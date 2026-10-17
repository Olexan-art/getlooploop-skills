// Step 1 as a function: the page and everything around it, measured. The network happens here
// and nowhere else; step 2 (audit.mjs) only computes and draws. A refusal is a reading too: it
// carries the code, and for a page in Russian nothing of the page at all.

import { judgeRequestedUrl } from "../../../vectorscope/scripts/lib/guards.mjs";
import { readPage } from "../../../vectorscope/scripts/lib/reading.mjs";
import { fetchRobots, robotsReport } from "../../../vectorscope/scripts/lib/robots.mjs";
import { renderPage } from "../../../vectorscope/scripts/lib/render.mjs";
import { analyseHtml } from "../../../vectorscope/scripts/lib/extract.mjs";
import { extractSections } from "../../../vectorscope/scripts/lib/chunk.mjs";
import { declaredLanguagesFromHtml, judgeLanguage } from "../../../vectorscope/scripts/lib/language.mjs";
import { isHtmlContentType } from "../../../vectorscope/scripts/lib/nonPageUrl.mjs";
import { REFUSAL_CODE } from "../../../vectorscope/scripts/lib/refusal.mjs";
import { basename } from "node:path";
import { guardedFetch } from "./net.mjs";
import { collectFacts, headingKey } from "./facts.mjs";
import { checkAlternates, checkImages, checkLinks, checkLlms, checkSite, checkSitemap, robotsSitemaps } from "./collect.mjs";
import { SHELL_MAX_WORDS, SHELL_ROOT_MAX_CHARS } from "./extras.mjs";
import { READING_SCHEMA, SKILL_VERSION } from "./version.mjs";

export { headingKey };


/** The chunker's sections of the kept text, the intro (title, h1, description) marked. */
export function keptSections(analysed) {
  const hasIntro = [analysed.title, (analysed.h1 || []).join(" "), analysed.metaDescription].some((x) => String(x || "").trim());
  return extractSections(analysed).map((s, i) => ({ heading: s.heading ?? null, text: s.text, ...(i === 0 && hasIntro ? { intro: true } : {}) }));
}

/** Fetch the page itself; every failure becomes a refusal code. */
async function fetchPage(url) {
  const r = await guardedFetch(url, { accept: "text/html,application/xhtml+xml" });
  if (!r.ok) return { ok: false, reason: r.reason === "too_many_redirects" ? "http_error" : r.reason, status: r.status, chain: r.chain };
  if ([401, 403, 429].includes(r.status)) return { ok: false, reason: "blocked", status: r.status, chain: r.chain };
  if (r.status >= 300) return { ok: false, reason: "http_error", status: r.status, chain: r.chain };
  if (!isHtmlContentType(r.headers.contentType)) return { ok: false, reason: "not_html", status: r.status, chain: r.chain };
  return { ok: true, url: r.url, chain: r.chain, status: r.status, headers: r.headers, html: r.text };
}

/** The rendered DOM's sections that the plain fetch does not have, each placed after the plain zone it follows. */
export function jsOnlyZones(plainFacts, renderedFacts) {
  const plain = new Set(plainFacts.headings.map((h) => headingKey(h.text)));
  const zoneOf = new Map();
  for (const z of plainFacts.zones) for (const h of z.headings) zoneOf.set(headingKey(h), z.id);
  const out = [];
  let after = plainFacts.zones.find((z) => z.kind === "hero")?.id ?? 0;
  for (const z of renderedFacts.zones) {
    const keys = z.headings.map(headingKey);
    const known = keys.find((k) => zoneOf.has(k));
    if (known !== undefined) {
      after = zoneOf.get(known);
      continue;
    }
    if (z.kind === "section" && keys.length && !keys.some((k) => plain.has(k)) && !z.hidden) out.push({ label: z.label, headings: z.headings.slice(0, 6), chars: z.chars, after });
  }
  return out;
}

/**
 * Read one page for the audit. Options:
 *   html, finalUrl     read a saved copy instead of fetching (then nothing else is fetched unless `network`)
 *   robotsText         a saved robots.txt for a saved page
 *   network            fetch robots.txt, sitemap, llms.txt, alternates and links (default: true unless html is given)
 *   render             also render the page in a local headless browser and compare
 */
export async function readAudit({ url, html, finalUrl, robotsText, network, render = false, onHtml, now = new Date() }) {
  const base = { schema: READING_SCHEMA, skillVersion: SKILL_VERSION, createdAt: now.toISOString(), requestedInput: String(url ?? "") };
  const verdict = judgeRequestedUrl(url);
  if (!verdict.ok) return { ...base, ok: false, reasonCode: verdict.reason };
  const urlKey = verdict.url;
  const saved = typeof html === "string";
  const online = network ?? !saved;

  let page;
  if (saved) {
    page = { ok: true, url: finalUrl || urlKey, chain: [], status: null, headers: {}, html, saved: true };
  } else {
    page = await fetchPage(urlKey);
    if (!page.ok) return { ...base, ok: false, reasonCode: page.reason, ...(page.status ? { status: page.status } : {}), fetch: { requestedUrl: urlKey, chain: page.chain || [] } };
  }
  if (onHtml) onHtml(page.html, page.url);

  // Pages in Russian are not analysed: decided before anything else is read, and nothing kept.
  const analysed = analyseHtml({ html: page.html, url: page.url });
  const language = judgeLanguage({ declared: declaredLanguagesFromHtml(page.html, page.headers.contentLanguage), text: analysed.bodyText || "" });
  if (language.russian) {
    return {
      ...base,
      ok: false,
      reasonCode: REFUSAL_CODE,
      page: { url: page.url, requestedUrl: urlKey },
      language: { basis: language.basis, declared: language.declared, cyrillicWords: language.cyrillicWords, markerWords: language.markerWords, otherWords: language.otherWords },
    };
  }

  const vs = await readPage({ url: urlKey, html: page.html, finalUrl: page.url, robots: "skip" });
  if (!vs.ok) return { ...base, ok: false, reasonCode: vs.reasonCode, fetch: { requestedUrl: urlKey, finalUrl: page.url, chain: page.chain } };

  const facts = collectFacts(page.html, page.url);
  // The kept text's own sections, as the chunker splits it: the writing patterns, the keyword and
  // the language versions' numbers read these, so all three see what a retriever sees.
  facts.sections = keptSections(analysed);

  let robotsFetched;
  if (online) robotsFetched = await fetchRobots(page.url);
  else if (typeof robotsText === "string") robotsFetched = { status: "ok", url: `${new URL(page.url).origin}/robots.txt`, httpStatus: null, text: robotsText };
  else robotsFetched = { status: "not_checked" };
  const robots = { ...robotsReport(robotsFetched, page.url), sitemaps: robotsSitemaps(robotsFetched.text) };

  const canonical = vs.technical?.canonical?.resolved || null;
  const pageUrls = [page.url, urlKey, canonical].filter(Boolean);
  const sitemap = online ? await checkSitemap(page.url, robotsFetched.text, pageUrls) : null;
  const llms = online ? await checkLlms(page.url) : null;
  const alternates = online ? await checkAlternates(page.url, facts.head.hreflang) : null;
  const links = online ? await checkLinks(facts.links) : null;
  const images = online ? await checkImages(facts.images) : null;
  const site = online ? await checkSite(page.url, facts.extras, { canonical, now: now.getTime() }) : null;

  // A single-page app shell: an app root with almost no text, and scripts to fill it. Then the
  // render runs on its own (when a local browser is found), so the JavaScript-only text is measured.
  const emptyRoots = facts.extras.roots.filter((x) => x.chars < SHELL_ROOT_MAX_CHARS);
  const shell = { detected: vs.page.wordCount < SHELL_MAX_WORDS && emptyRoots.length > 0 && facts.head.scripts.total > 0, roots: emptyRoots.map((x) => x.selector), words: vs.page.wordCount, scripts: facts.head.scripts.total };
  const autoRender = shell.detected && !render && online;

  let rendered = null;
  if (render || autoRender) {
    const result = await renderPage(page.url);
    if (!result.ok) rendered = { ok: false, reason: result.reason, browser: result.browser ? basename(result.browser) : null, auto: autoRender };
    else {
      const js = await readPage({ url: urlKey, html: result.html, finalUrl: page.url, robots: "skip" });
      const jsFacts = collectFacts(result.html, page.url);
      rendered = {
        ok: true,
        browser: basename(result.browser),
        wordCount: js.ok ? js.page.wordCount : 0,
        passages: js.ok ? js.passages.length : 0,
        charsIndexed: js.ok ? js.page.charsIndexed : 0,
        headings: js.ok ? js.page.headings : 0,
        jsZones: jsOnlyZones(facts, jsFacts),
        auto: autoRender,
      };
    }
  }

  return {
    ...base,
    ok: true,
    reasonCode: "ok",
    fetch: {
      requestedUrl: urlKey,
      finalUrl: page.url,
      saved,
      chain: page.chain,
      status: page.status,
      contentType: page.headers.contentType ?? null,
      xRobotsTag: page.headers.xRobotsTag ?? null,
      hsts: page.headers.hsts ?? null,
      contentLanguage: page.headers.contentLanguage ?? null,
    },
    facts,
    vs: { page: vs.page, passages: vs.passages, technical: vs.technical, losses: vs.losses, layout: vs.layout, ...(rendered?.ok ? { render: { ok: true, browser: rendered.browser, wordCount: rendered.wordCount, passages: rendered.passages, charsIndexed: rendered.charsIndexed, headings: rendered.headings } } : {}) },
    robots,
    sitemap,
    llms,
    alternates,
    links,
    images,
    site,
    shell,
    render: rendered,
  };
}
