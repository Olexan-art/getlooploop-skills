// The requests around the page: its sitemap, its llms.txt, its hreflang alternates and a link
// check. Each one has a cap, and each result says how much of its list it did not get to, so
// nothing is cut silently. The parsers are pure and exported for the tests.

import * as cheerio from "cheerio";
import { gunzipSync } from "node:zlib";
import { guardedFetch, pool } from "./net.mjs";
import { samePage } from "../../../vectorscope/scripts/lib/technical.mjs";
import { declaredLanguagesFromHtml, judgeLanguage, primaryTag } from "../../../vectorscope/scripts/lib/language.mjs";
import { analyseHtml } from "../../../vectorscope/scripts/lib/extract.mjs";
import { isHtmlContentType } from "../../../vectorscope/scripts/lib/nonPageUrl.mjs";
import { hostKey } from "./facts.mjs";

// ── caps ─────────────────────────────────────────────────────────────────────

/** Links checked, in document order; the rest are counted as unchecked. */
export const LINK_CHECK_CAP = 30;
/** Requests in flight at once for the link check: polite to one site, quick enough for 30. */
export const LINK_CHECK_CONCURRENCY = 5;
/** A link that has not answered in 8 seconds is reported as unverified, not as broken. */
export const LINK_TIMEOUT_MS = 8_000;
/** hreflang alternates fetched; the rest are listed as unchecked. */
export const ALTERNATES_CAP = 10;
/** Child sitemaps read from a sitemap index; the rest are counted as unread. */
export const SITEMAP_CHILD_CAP = 5;
/** A sitemap may hold 50,000 URLs and 50 MB (sitemaps.org); 10 MB covers almost all of them, and larger ones are reported as not read. */
export const SITEMAP_MAX_BYTES = 10 * 1024 * 1024;
/** llms.txt is a short Markdown file; past 1 MB it is not one. */
export const LLMS_MAX_BYTES = 1024 * 1024;

const decodeXml = (s) =>
  String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();

/** A sitemap's kind and its <loc> values. */
export function parseSitemap(xml) {
  const text = String(xml || "");
  const kind = /<sitemapindex[\s>]/i.test(text) ? "sitemapindex" : /<urlset[\s>]/i.test(text) ? "urlset" : "unknown";
  const locs = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => decodeXml(m[1])).filter(Boolean);
  return { kind, locs };
}

/** The Sitemap: lines of a robots.txt. */
export function robotsSitemaps(robotsText) {
  return String(robotsText || "")
    .split(/\r\n|\r|\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter((l) => /^sitemap\s*:/i.test(l))
    .map((l) => l.replace(/^sitemap\s*:\s*/i, "").trim())
    .filter(Boolean);
}

const sameSite = (a, b) => {
  const x = hostKey(a);
  const y = hostKey(b);
  return Boolean(x) && (x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`));
};

/**
 * Find the page in the site's sitemap: the robots.txt Sitemap: lines (same site only), else
 * /sitemap.xml; a sitemap index is followed into at most SITEMAP_CHILD_CAP children.
 * `pageUrls` are the URLs that count as this page (final, requested, canonical).
 */
export async function checkSitemap(pageUrl, robotsText, pageUrls) {
  const origin = new URL(pageUrl).origin;
  const declared = robotsSitemaps(robotsText);
  const offSite = declared.filter((u) => !sameSite(u, pageUrl));
  const candidates = declared.filter((u) => sameSite(u, pageUrl));
  const source = candidates.length ? "robots" : "default";
  if (!candidates.length) candidates.push(`${origin}/sitemap.xml`);
  const fetched = [];
  const children = [];
  let found = false;
  let listsPage = false;
  let matchedIn = null;
  const matches = (loc) => pageUrls.some((u) => u && samePage(loc, u));
  const read = async (url) => {
    const r = await guardedFetch(url, { accept: "application/xml,text/xml;q=0.9,*/*;q=0.5", maxBytes: SITEMAP_MAX_BYTES, binary: true });
    if (!r.ok || r.status !== 200) {
      fetched.push({ url, status: r.status ?? null, reason: r.ok ? "http_error" : r.reason, kind: null, count: 0, read: false });
      return null;
    }
    // A .xml.gz sitemap is a gzip file (sitemaps.org allows it); unpacked here, within the same ceiling.
    let text;
    try {
      text = r.body[0] === 0x1f && r.body[1] === 0x8b ? gunzipSync(r.body, { maxOutputLength: SITEMAP_MAX_BYTES }).toString("utf8") : r.body.toString("utf8");
    } catch {
      fetched.push({ url, status: r.status, reason: "unreadable", kind: null, count: 0, read: false });
      return null;
    }
    const parsed = parseSitemap(text);
    fetched.push({ url, status: r.status, kind: parsed.kind, count: parsed.locs.length, read: parsed.kind !== "unknown" });
    if (parsed.kind !== "unknown") found = true;
    return parsed;
  };
  for (const url of candidates.slice(0, 3)) {
    const parsed = await read(url);
    if (!parsed) continue;
    if (parsed.kind === "urlset" && parsed.locs.some(matches)) {
      listsPage = true;
      matchedIn = url;
      break;
    }
    if (parsed.kind === "sitemapindex") children.push(...parsed.locs.filter((u) => sameSite(u, pageUrl)));
  }
  let childrenRead = 0;
  if (!listsPage) {
    // Children whose name carries the page's first path segment or language go first.
    const seg = (new URL(pageUrl).pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
    const hit = (u) => Number(Boolean(seg) && u.toLowerCase().includes(seg));
    const ranked = children.slice().sort((a, b) => hit(b) - hit(a));
    for (const url of ranked.slice(0, SITEMAP_CHILD_CAP)) {
      childrenRead++;
      const parsed = await read(url);
      if (parsed?.locs.some(matches)) {
        listsPage = true;
        matchedIn = url;
        break;
      }
    }
  }
  const childrenUnread = Math.max(0, children.length - childrenRead);
  const unreadFiles = fetched.filter((f) => !f.read).length;
  return {
    source,
    declared,
    offSite,
    fetched,
    found,
    // Unknown when the page was not found but part of the sitemap was not read: never a guess.
    listsPage: listsPage ? true : found && childrenUnread === 0 && unreadFiles === 0 && candidates.length <= 3 ? false : null,
    matchedIn,
    children: { total: children.length, read: childrenRead, unread: childrenUnread, cap: SITEMAP_CHILD_CAP },
    candidatesUnread: Math.max(0, candidates.length - 3),
  };
}

/** The links of an llms.txt (Markdown links and bare URLs), in order, unique. */
export function llmsLinks(text) {
  const out = [];
  for (const m of String(text || "").matchAll(/\]\((https?:\/\/[^)\s]+)\)|(?<![(\w])(https?:\/\/[^\s<>)\]]+)/g)) {
    const u = (m[1] || m[2]).replace(/[.,;:]+$/, "");
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

/** /llms.txt at the page's origin. An HTML answer is a soft 404, not an llms.txt. */
export async function checkLlms(pageUrl) {
  const url = `${new URL(pageUrl).origin}/llms.txt`;
  const r = await guardedFetch(url, { accept: "text/plain,text/markdown;q=0.9,*/*;q=0.5", maxBytes: LLMS_MAX_BYTES });
  if (!r.ok) return { url, status: r.status ?? null, present: false, reason: r.reason };
  const html = isHtmlContentType(r.headers.contentType) || /^\s*<(?:!doctype|html)/i.test(r.text);
  const present = r.status === 200 && !html && r.text.trim().length > 0;
  const links = present ? llmsLinks(r.text) : [];
  return { url, status: r.status, present, softNotFound: r.status === 200 && html, bytes: present ? Buffer.byteLength(r.text) : 0, links: links.length, sample: links.slice(0, 40) };
}

/** What the audit reads of an alternate: just enough to judge the pair, never its content. */
export function alternateFacts(html, url) {
  const $ = cheerio.load(html);
  const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
  const metaNamed = (name) => $("meta[name]").toArray().filter((n) => String(n.attribs.name || "").trim().toLowerCase() === name);
  const robots = metaNamed("robots").concat(metaNamed("googlebot")).map((n) => fold(n.attribs.content).toLowerCase());
  return {
    title: fold($("title").first().text()),
    description: fold(metaNamed("description")[0]?.attribs.content || ""),
    lang: fold($("html").attr("lang") || "") || null,
    noindex: robots.some((c) => /\bnoindex\b|\bnone\b/.test(c)),
    hreflang: $("link[rel][hreflang]")
      .toArray()
      .filter((n) => String(n.attribs.rel || "").toLowerCase().split(/\s+/).includes("alternate"))
      .map((n) => {
        let href = null;
        try {
          href = new URL(String(n.attribs.href || "").trim(), url).toString();
        } catch {}
        return { hreflang: fold(n.attribs.hreflang), href };
      }),
  };
}

/**
 * Fetch each hreflang alternate (at most ALTERNATES_CAP) and read only what the pair needs:
 * status, final URL, title, description, html lang, noindex and its own hreflang set. An
 * alternate declared or detected as Russian is not read at all: it carries only the refusal.
 */
export async function checkAlternates(pageUrl, hreflang) {
  const seen = new Set();
  const list = [];
  for (const h of hreflang) {
    if (!h.href || h.hreflang.toLowerCase() === "x-default" || samePage(h.href, pageUrl)) continue;
    const key = h.href.replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(h);
  }
  const checked = list.slice(0, ALTERNATES_CAP);
  const results = [];
  for (const h of checked) {
    if (primaryTag(h.hreflang) === "ru") {
      results.push({ hreflang: h.hreflang, href: h.href, refused: "refused_language_ru", basis: "hreflang" });
      continue;
    }
    const r = await guardedFetch(h.href, { accept: "text/html" });
    if (!r.ok) {
      results.push({ hreflang: h.hreflang, href: h.href, ok: false, reason: r.reason, status: r.status ?? null, chain: r.chain.map((c) => c.status) });
      continue;
    }
    const redirected = r.chain.length > 1 && !samePage(r.url, h.href);
    const isHtml = isHtmlContentType(r.headers.contentType);
    if (r.status !== 200 || !isHtml) {
      results.push({ hreflang: h.hreflang, href: h.href, ok: false, status: r.status, finalUrl: r.url, redirected, reason: isHtml ? "http_error" : "not_html" });
      continue;
    }
    const language = judgeLanguage({ declared: declaredLanguagesFromHtml(r.text, r.headers.contentLanguage), text: analyseHtml({ html: r.text, url: r.url }).bodyText || "" });
    if (language.russian) {
      results.push({ hreflang: h.hreflang, href: h.href, refused: "refused_language_ru", basis: language.basis });
      continue;
    }
    const facts = alternateFacts(r.text, r.url);
    const xRobots = String(r.headers.xRobotsTag || "").toLowerCase();
    results.push({
      hreflang: h.hreflang,
      href: h.href,
      ok: true,
      status: r.status,
      finalUrl: r.url,
      redirected,
      title: facts.title,
      description: facts.description,
      lang: facts.lang,
      noindex: facts.noindex || /\bnoindex\b|\bnone\b/.test(xRobots),
      hreflangSet: facts.hreflang.slice(0, 60),
    });
  }
  return { total: list.length, checked: results.length, unchecked: list.slice(ALTERNATES_CAP).map((h) => ({ hreflang: h.hreflang, href: h.href })), cap: ALTERNATES_CAP, results };
}

/** How a link answered: ok, broken, unverified (refused or silent), or skipped (not public). */
export function linkVerdict(r) {
  if (!r.ok) return r.reason === "unreachable" || r.reason === "too_many_redirects" ? "unverified" : "skipped";
  if ([401, 403, 429].includes(r.status)) return "unverified";
  if (r.status >= 400) return "broken";
  if (r.status >= 300) return "unverified";
  return "ok";
}

/**
 * HEAD each of the first LINK_CHECK_CAP unique links (GET without reading the body when HEAD is
 * refused). The rest are counted, never dropped.
 */
export async function checkLinks(links) {
  const unique = [];
  const seen = new Set();
  for (const l of links) {
    if (l.self || seen.has(l.url)) continue;
    seen.add(l.url);
    unique.push(l);
  }
  const batch = unique.slice(0, LINK_CHECK_CAP);
  const results = await pool(batch, LINK_CHECK_CONCURRENCY, async (l) => {
    let r = await guardedFetch(l.url, { method: "HEAD", timeoutMs: LINK_TIMEOUT_MS });
    if (!r.ok || [403, 405, 501].includes(r.status) || (r.status >= 400 && r.status !== 404 && r.status !== 410)) {
      const g = await guardedFetch(l.url, { method: "GET", timeoutMs: LINK_TIMEOUT_MS, body: false, accept: "text/html,*/*;q=0.8" });
      if (g.ok || !r.ok) r = g;
    }
    return { url: l.url, internal: l.internal, zone: l.zone, path: l.path, text: l.text, status: r.status ?? null, verdict: linkVerdict(r) };
  });
  return { total: unique.length, checked: results.length, unchecked: Math.max(0, unique.length - batch.length), cap: LINK_CHECK_CAP, results };
}
