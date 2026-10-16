// Readings built from HTML in the tests: no network. readAudit reads a saved page exactly as it
// reads a fetched one; the parts that need the network (robots.txt, sitemap, llms.txt,
// alternates, links) are patched in by each test from fixture data.
import { readFileSync } from "node:fs";
import { readAudit } from "../scripts/lib/reading.mjs";
import { auditFindings } from "../scripts/lib/checks.mjs";

export const URL_ = "https://example.org/page";

const PARAGRAPH = "An opening paragraph that says what the page is about, in plain words. ".repeat(3);

/**
 * A small page that passes every classic check. `omit` drops parts of the head (canonical,
 * viewport, description, og, twitter, jsonld) or the body (h1, link); `head` and `body` add to it.
 */
export function page({ head = "", body = "", lang = "en", title = "A clear title for this test page", description = "A description long enough to pass the length check: seventy characters and a few more words.", canonical = URL_, omit = [], h1 = "<h1>The page heading</h1>", before = "" } = {}) {
  const parts = {
    viewport: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    canonical: `<link rel="canonical" href="${canonical}">`,
    description: `<meta name="description" content="${description}">`,
    og: '<meta property="og:title" content="t"><meta property="og:description" content="d"><meta property="og:image" content="https://example.org/i.png">',
    twitter: '<meta name="twitter:card" content="summary">',
    jsonld: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"x"}</script>',
  };
  const headHtml = Object.entries(parts).filter(([k]) => !omit.includes(k)).map(([, v]) => v).join("");
  const titleHtml = omit.includes("title") ? "" : `<title>${title}</title>`;
  const link = omit.includes("link") ? "" : '<p><a href="/other">Another page on this site</a></p>';
  return `<!doctype html><html${lang ? ` lang="${lang}"` : ""}><head>${titleHtml}${headHtml}${head}</head><body>${before}<main>${omit.includes("h1") ? "" : h1}<p>${PARAGRAPH}</p>${link}${body}</main></body></html>`;
}

/** A section long enough not to be thin. */
export const section = (h, words = null, times = 4) => `<h2>${h}</h2><p>${words ? words.repeat(times) : Array.from({ length: times * 2 }, (_, i) => `Line ${i} of ${h} holds ${i + 1} facts.`).join(" ")}</p>`;

/** Read HTML as a saved page; `patch` sets the network parts. */
export async function readingOf(html, patch = {}, { url = URL_, robotsText = "User-agent: *\nAllow: /\n" } = {}) {
  const r = await readAudit({ url, html, finalUrl: url, robotsText, now: new Date("2026-10-17T09:00:00Z") });
  if (!r.ok) return r;
  for (const [k, v] of Object.entries(patch)) {
    if (k === "fetch") r.fetch = { ...r.fetch, ...v };
    else if (k === "vs") r.vs = { ...r.vs, ...v };
    else r[k] = v;
  }
  return r;
}

export async function codesOf(html, patch, opts) {
  const r = await readingOf(html, patch, opts);
  if (!r.ok) throw new Error(`reading refused: ${r.reasonCode}`);
  return auditFindings(r).map((f) => f.code);
}

export async function findingOf(html, code, patch, opts) {
  const r = await readingOf(html, patch, opts);
  return auditFindings(r).find((f) => f.code === code);
}

/** The Vectorscope skill's saved public pages (see their ATTRIBUTION files there). */
export const vsFixture = (name) => readFileSync(new URL(`../../vectorscope/tests/fixtures/${name}`, import.meta.url), "utf8");

/** Replace global fetch with a map of URL → { status, body, headers } for the duration of `fn`. */
export async function withFetch(routes, fn) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    const r = routes[String(url)];
    if (!r) return new Response("not found", { status: 404, headers: { "content-type": "text/html" } });
    const headers = { "content-type": "text/html; charset=utf-8", ...(r.headers || {}) };
    return new Response(init.method === "HEAD" ? null : r.body ?? "", { status: r.status ?? 200, headers });
  };
  try {
    return await fn(calls);
  } finally {
    globalThis.fetch = original;
  }
}
