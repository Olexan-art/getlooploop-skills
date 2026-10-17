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
import { extractSections } from "../../../vectorscope/scripts/lib/chunk.mjs";
import { sectionNumbers } from "./localeFacts.mjs";

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

/** An alternate's h2 sections as numbers only (see localeFacts.mjs). */
export function alternateSections(analysed) {
  const hasIntro = [analysed.title, (analysed.h1 || []).join(" "), analysed.metaDescription].some((x) => String(x || "").trim());
  return sectionNumbers(extractSections(analysed).map((s, i) => ({ ...s, ...(i === 0 && hasIntro ? { intro: true } : {}) })));
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
    const analysed = analyseHtml({ html: r.text, url: r.url });
    const language = judgeLanguage({ declared: declaredLanguagesFromHtml(r.text, r.headers.contentLanguage), text: analysed.bodyText || "" });
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
      // Only the numbers of each h2 section, with a few words around each: what the locale-facts
      // check compares. The rest of the alternate's text is not kept.
      sections: alternateSections(analysed),
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

// ── images and the site around the page ─────────────────────────────────────

/** Images whose size is read (a HEAD each, a bodiless GET when HEAD is refused); the rest are counted. */
export const IMAGE_CHECK_CAP = 20;
/** URL variants of the page fetched to see where they end (http, www or not, trailing slash). */
export const VARIANT_CAP = 3;

/** HEAD the first IMAGE_CHECK_CAP images with a URL: status, Content-Length and Content-Type. */
export async function checkImages(images) {
  const list = [];
  const seen = new Set();
  for (const img of images) {
    if (!img.url || seen.has(img.url) || !/^https?:/i.test(img.url)) continue;
    seen.add(img.url);
    list.push(img);
  }
  const batch = list.slice(0, IMAGE_CHECK_CAP);
  const results = await pool(batch, LINK_CHECK_CONCURRENCY, async (img) => {
    let r = await guardedFetch(img.url, { method: "HEAD", timeoutMs: LINK_TIMEOUT_MS, accept: "image/*" });
    if (!r.ok || [403, 405, 501].includes(r.status) || !r.headers?.contentLength) {
      const g = await guardedFetch(img.url, { method: "GET", timeoutMs: LINK_TIMEOUT_MS, body: false, accept: "image/*" });
      if (g.ok) r = g;
    }
    return { index: img.index, url: img.url, status: r.status ?? null, bytes: r.ok && r.headers?.contentLength ? Number(r.headers.contentLength) : null, type: r.ok ? r.headers?.contentType || null : null, reason: r.ok ? null : r.reason };
  });
  return { total: list.length, checked: results.length, unchecked: Math.max(0, list.length - batch.length), cap: IMAGE_CHECK_CAP, results };
}

/** www added to a bare domain, or taken off; a deeper subdomain (docs.example.org) has no www variant. */
const flipWww = (u) => {
  const x = new URL(u);
  if (x.hostname.startsWith("www.")) x.hostname = x.hostname.slice(4);
  else if (x.hostname.split(".").length === 2) x.hostname = `www.${x.hostname}`;
  else return null;
  return x.toString();
};
const flipSlash = (u) => {
  const x = new URL(u);
  if (x.pathname === "/") return null;
  x.pathname = x.pathname.endsWith("/") ? x.pathname.slice(0, -1) : `${x.pathname}/`;
  return x.toString();
};

/** A path that cannot exist on the site, so a 200 answer to it is a soft 404. */
export function improbablePath(pageUrl, seed = Date.now()) {
  const u = new URL(pageUrl);
  return `${u.origin}/getlooploop-audit-missing-${seed.toString(36)}-page`;
}

/**
 * One request each: the favicon, a path that does not exist (soft 404), up to VARIANT_CAP URL
 * variants, a Markdown alternate (declared, or the page URL plus .md), /.well-known/ai-catalog.json
 * (then /ai-catalog.json if that is missing), and the IndexNow key file when a key is declared.
 */
export async function checkSite(pageUrl, extras, { canonical = null, now = Date.now() } = {}) {
  const u = new URL(pageUrl);
  const out = {};
  // Favicon: the declared one, else /favicon.ico.
  const icon = extras.icons[0] || `${u.origin}/favicon.ico`;
  // A data: URI is not a file Googlebot-Image can crawl; it is reported, not fetched.
  const fi = /^data:/i.test(icon) ? { ok: false, reason: "data_uri" } : await guardedFetch(icon, { method: "GET", body: false, accept: "image/*", timeoutMs: LINK_TIMEOUT_MS });
  out.favicon = { url: /^data:/i.test(icon) ? icon.slice(0, 40) : icon, declared: extras.icons.length > 0, status: fi.status ?? null, ok: Boolean(fi.ok && fi.status === 200 && !/text\/html/i.test(fi.headers?.contentType || "")), reason: fi.ok ? null : fi.reason };
  // Soft 404.
  const missing = improbablePath(pageUrl, now);
  const sm = await guardedFetch(missing, { method: "GET", body: false, accept: "text/html", timeoutMs: LINK_TIMEOUT_MS });
  out.soft404 = { url: missing, status: sm.status ?? null, finalUrl: sm.ok ? sm.url : null, reason: sm.ok ? null : sm.reason };
  // URL variants: each should end where the page itself ends (or at its canonical).
  const target = canonical || pageUrl;
  const variants = [];
  if (u.protocol === "https:") variants.push(["http", pageUrl.replace(/^https:/i, "http:")]);
  const www = flipWww(pageUrl);
  if (www) variants.push(["www", www]);
  const slash = flipSlash(pageUrl);
  if (slash) variants.push(["slash", slash]);
  out.variants = [];
  for (const [kind, url] of variants.slice(0, VARIANT_CAP)) {
    const r = await guardedFetch(url, { method: "GET", body: false, accept: "text/html", timeoutMs: LINK_TIMEOUT_MS });
    out.variants.push({ kind, url, status: r.status ?? null, finalUrl: r.ok ? r.url : null, ends: r.ok && r.status === 200 && (samePage(r.url, target) || samePage(r.url, pageUrl)), reason: r.ok ? null : r.reason });
  }
  // A Markdown alternate.
  const mdUrl = extras.markdown[0] || (u.pathname.endsWith("/") ? `${u.origin}${u.pathname}index.html.md` : `${u.origin}${u.pathname}.md`);
  const md = await guardedFetch(mdUrl, { method: "GET", accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1", maxBytes: LLMS_MAX_BYTES, timeoutMs: LINK_TIMEOUT_MS });
  const mdText = md.ok ? md.text : "";
  out.markdown = { url: mdUrl, declared: extras.markdown.length > 0, status: md.status ?? null, ok: Boolean(md.ok && md.status === 200 && mdText.trim() && !/^\s*<(?:!doctype|html)/i.test(mdText)), contentType: md.ok ? md.headers.contentType : null, reason: md.ok ? null : md.reason };
  // ai-catalog.json.
  out.aiCatalog = null;
  for (const path of ["/.well-known/ai-catalog.json", "/ai-catalog.json"]) {
    const r = await guardedFetch(`${u.origin}${path}`, { method: "GET", accept: "application/json", maxBytes: LLMS_MAX_BYTES, timeoutMs: LINK_TIMEOUT_MS });
    const present = Boolean(r.ok && r.status === 200 && r.text.trim() && !/^\s*</.test(r.text));
    let valid = null;
    if (present) {
      try {
        JSON.parse(r.text);
        valid = true;
      } catch {
        valid = false;
      }
    }
    out.aiCatalog = { url: `${u.origin}${path}`, status: r.status ?? null, present, valid };
    if (present) break;
  }
  // IndexNow: only when a key is declared.
  if (extras.indexnow[0]) {
    const key = extras.indexnow[0];
    const r = await guardedFetch(`${u.origin}/${key}.txt`, { method: "GET", accept: "text/plain", maxBytes: 4096, timeoutMs: LINK_TIMEOUT_MS });
    out.indexnow = { key, url: `${u.origin}/${key}.txt`, status: r.status ?? null, ok: Boolean(r.ok && r.status === 200 && r.text.trim() === key) };
  } else out.indexnow = null;
  out.requests = (/^data:/i.test(icon) ? 3 : 4) + out.variants.length + (out.aiCatalog && out.aiCatalog.url.endsWith("/ai-catalog.json") && !out.aiCatalog.url.includes(".well-known") ? 1 : 0) + (out.indexnow ? 1 : 0);
  return out;
}
