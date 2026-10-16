// Every check of the Lite audit, over one reading. Deterministic: the same reading gives the same
// findings on any machine, with any agent. Each finding is a code, a severity, where it is, the
// evidence, and the published rules it rests on; the words a person reads belong to the report
// (copy.mjs), and the Lite report shows only a short label, the severity and the place.
//
// The Vectorscope's own checks (the passage reading) run unchanged through its runChecks, with
// one deterministic stand-in for the agent's grouping: each h2 section counts as a group, so the
// repeated-claim check needs no judgement.

import { runChecks } from "../../../vectorscope/scripts/lib/checks.mjs";
import { primaryTag } from "../../../vectorscope/scripts/lib/language.mjs";
import { samePage } from "../../../vectorscope/scripts/lib/technical.mjs";
import { headingKey, typedNodes } from "./facts.mjs";
import { source } from "./rules.mjs";

// ── thresholds (each is the skill's rule unless a source says otherwise; README lists them) ──

/** Google shows a title link about 600 px wide; 60 characters is the usual fit. */
export const TITLE_MAX = 60;
/** Under 10 characters a title cannot say what the page is. */
export const TITLE_MIN = 10;
/** The description length the Vectorscope uses: under 70 says little, over 160 is cut in results. */
export { META_DESCRIPTION_MIN, META_DESCRIPTION_MAX } from "../../../vectorscope/scripts/lib/checks.mjs";
/** HTML over 500 KB, or more than 30 scripts, is a heavy page to fetch and parse before any text. */
export const HEAVY_HTML_BYTES = 500_000;
export const HEAVY_SCRIPTS = 30;
/** Two or more redirects before the page answers is a chain. */
export const REDIRECT_CHAIN_HOPS = 2;
/** A URL longer than this, or with more query parameters than this, is hard to read and share. */
export const URL_MAX_CHARS = 115;
export const URL_MAX_PARAMS = 2;
/** Hidden text this long under hidden headings is a section, not a stray label. */
export const HIDDEN_HIGH_CHARS = 200;

export const SEVERITIES = ["blocking", "high", "medium", "low"];
export const SEVERITY_RANK = { blocking: 4, high: 3, medium: 2, low: 1 };

/**
 * The registry: every code, its default severity, the status tile it belongs to, who it
 * concerns, and the rules it rests on. `hides`: the problem keeps text from AI (the verdict
 * counts these). `info`: informational, not a breach of a rule.
 */
export const CODES = {
  // Access & indexing
  robots_unreachable: { severity: "blocking", area: "find", owner: "dev", rules: ["rfc"] },
  search_engine_blocked: { severity: "blocking", area: "find", owner: "dev", rules: ["gRobots", "bing", "rfc"] },
  ai_search_blocked: { severity: "blocking", area: "find", owner: "dev", rules: ["openai", "anthropic", "perplexity", "rfc"] },
  noindex: { severity: "blocking", area: "find", owner: "dev", rules: ["gNoindex", "gRobotsMeta"] },
  ai_training_blocked: { severity: "low", area: "find", owner: "seo", rules: ["openai", "anthropic", "gCrawlers", "ccbot"], info: true },
  llms_txt_missing: { severity: "low", area: "find", owner: "seo", rules: ["llms"], info: true },
  // Classic SEO
  not_https: { severity: "high", area: "classic", owner: "dev", rules: ["gPageExp"] },
  redirect_chain: { severity: "low", area: "classic", owner: "dev", rules: ["gRedirects", "skill"] },
  sitemap_missing: { severity: "low", area: "classic", owner: "seo", rules: ["gSitemap", "sitemaps"] },
  sitemap_not_listed: { severity: "low", area: "classic", owner: "seo", rules: ["gSitemap", "sitemaps"] },
  title_missing: { severity: "high", area: "classic", owner: "content", rules: ["gTitle"] },
  title_too_long: { severity: "low", area: "classic", owner: "content", rules: ["gTitle", "skill"] },
  title_too_short: { severity: "low", area: "classic", owner: "content", rules: ["gTitle", "skill"] },
  meta_description_missing: { severity: "low", area: "classic", owner: "content", rules: ["gSnippet"] },
  meta_description_short: { severity: "low", area: "classic", owner: "content", rules: ["gSnippet", "skill"] },
  meta_description_long: { severity: "low", area: "classic", owner: "content", rules: ["gSnippet", "skill"] },
  h1_missing: { severity: "medium", area: "classic", owner: "content", rules: ["wHead"] },
  h1_multiple: { severity: "low", area: "classic", owner: "content", rules: ["wHead"] },
  heading_order_skip: { severity: "low", area: "classic", owner: "content", rules: ["wHead"] },
  canonical_missing: { severity: "low", area: "classic", owner: "seo", rules: ["gCanon"] },
  canonical_relative: { severity: "low", area: "classic", owner: "seo", rules: ["gCanon"] },
  canonical_other: { severity: "medium", area: "classic", owner: "seo", rules: ["gCanon"] },
  canonical_multiple: { severity: "medium", area: "classic", owner: "seo", rules: ["gCanon"] },
  internal_links_none: { severity: "low", area: "classic", owner: "seo", rules: ["gLinks"] },
  broken_links: { severity: "medium", area: "classic", owner: "content", rules: ["gHttp"] },
  image_alt_missing: { severity: "low", area: "classic", owner: "content", rules: ["gImages", "wImages"] },
  viewport_missing: { severity: "medium", area: "classic", owner: "dev", rules: ["gMobile"] },
  html_lang_missing: { severity: "low", area: "classic", owner: "dev", rules: ["i18n"] },
  social_tags_missing: { severity: "low", area: "classic", owner: "seo", rules: ["ogp"] },
  page_weight_heavy: { severity: "low", area: "classic", owner: "dev", rules: ["skill"] },
  url_unreadable: { severity: "low", area: "classic", owner: "seo", rules: ["gUrl", "skill"] },
  // Rich results and markup
  jsonld_invalid: { severity: "medium", area: "markup", owner: "dev", rules: ["gSdIntro"] },
  structured_data_none: { severity: "low", area: "markup", owner: "seo", rules: ["gSdIntro"], info: true },
  schema_required_missing: { severity: "medium", area: "markup", owner: "dev", rules: ["gSdIntro"] },
  schema_recommended_missing: { severity: "low", area: "markup", owner: "dev", rules: ["gSdIntro"] },
  faq_rich_result_retired: { severity: "low", area: "markup", owner: "seo", rules: ["gUpdates"], info: true },
  // AI quotes it right (FAQ, schema and visible-text issues; the question tests are not in Lite)
  faq_schema_not_visible: { severity: "high", area: "quote", owner: "content", rules: ["gSdPol", "sFaq"] },
  lost_faq_questions: { severity: "high", area: "quote", owner: "content", rules: ["apgAcc", "vs"] },
  mid_sentence_start: { severity: "medium", area: "quote", owner: "content", rules: ["vs"] },
  truncated_teaser: { severity: "low", area: "quote", owner: "content", rules: ["vs"] },
  repeated_claim: { severity: "low", area: "quote", owner: "content", rules: ["vs"] },
  // AI reads all of it
  cap_overflow: { severity: "high", area: "read", owner: "content", rules: ["vs"], hides: true },
  js_dependent: { severity: "high", area: "read", owner: "dev", rules: ["gJs"], hides: true },
  hero_lede_dropped: { severity: "high", area: "read", owner: "dev", rules: ["header", "vs"], hides: true },
  hidden_headings: { severity: "high", area: "read", owner: "dev", rules: ["hidden"], hides: true },
  ssr_placeholder_text: { severity: "medium", area: "read", owner: "dev", rules: ["gJs"] },
  h1_glued_words: { severity: "medium", area: "read", owner: "dev", rules: ["dom", "cssText"] },
  nav_in_content: { severity: "medium", area: "read", owner: "dev", rules: ["nav", "vs"] },
  dominant_heading: { severity: "medium", area: "read", owner: "content", rules: ["wHead", "vs"] },
  thin_section: { severity: "low", area: "read", owner: "content", rules: ["vs"] },
  // Languages
  hreflang_no_return: { severity: "high", area: "lang", owner: "dev", rules: ["gHreflang"] },
  hreflang_invalid_code: { severity: "medium", area: "lang", owner: "dev", rules: ["gHreflang"] },
  hreflang_no_self: { severity: "medium", area: "lang", owner: "dev", rules: ["gHreflang"] },
  hreflang_alternate_broken: { severity: "medium", area: "lang", owner: "dev", rules: ["gHreflang"] },
  title_duplicate_locales: { severity: "medium", area: "lang", owner: "content", rules: ["gTitle", "gMulti"] },
  description_duplicate_locales: { severity: "low", area: "lang", owner: "content", rules: ["gSnippet", "gMulti"] },
  hreflang_lang_mismatch: { severity: "low", area: "lang", owner: "dev", rules: ["gHreflang", "i18n"] },
  hreflang_no_x_default: { severity: "low", area: "lang", owner: "seo", rules: ["gHreflang"], info: true },
  llms_txt_one_language: { severity: "low", area: "lang", owner: "seo", rules: ["llms"], info: true },
};
export const CODE_ORDER = Object.keys(CODES);

/** Required and recommended properties per type, with the source that names them. */
export const SCHEMA_RULES = {
  FAQPage: { source: "sFaq", required: ["mainEntity"] },
  Product: { source: "gProduct", required: ["name"], oneOf: ["offers", "review", "aggregateRating"] },
  SoftwareApplication: { source: "gSoftware", required: ["name", "offers"], oneOf: ["aggregateRating", "review"] },
  WebApplication: { source: "gSoftware", required: ["name", "offers"], oneOf: ["aggregateRating", "review"] },
  MobileApplication: { source: "gSoftware", required: ["name", "offers"], oneOf: ["aggregateRating", "review"] },
  BreadcrumbList: { source: "gBread", required: ["itemListElement"] },
  HowTo: { source: "sHowTo", required: ["name", "step"] },
  Article: { source: "gArticle", recommended: ["headline", "image", "datePublished", "author"] },
  NewsArticle: { source: "gArticle", recommended: ["headline", "image", "datePublished", "author"] },
  BlogPosting: { source: "gArticle", recommended: ["headline", "image", "datePublished", "author"] },
  Organization: { source: "gOrg", recommended: ["name", "url", "logo"] },
};

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const norm = (s) => fold(s).toLowerCase().replace(/[“”«»"'’‘]/g, "").replace(/[?!.:;,]+$/g, "");
const has = (node, key) => node[key] !== undefined && node[key] !== null && node[key] !== "" && !(Array.isArray(node[key]) && node[key].length === 0);
const asList = (v) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

// ── where things are on the map ──────────────────────────────────────────────

function locator(reading) {
  const zones = reading.facts.zones;
  const byHeading = new Map();
  for (const z of zones) for (const h of z.headings) if (!byHeading.has(headingKey(h))) byHeading.set(headingKey(h), z.id);
  const hero = zones.find((z) => z.kind === "hero")?.id ?? zones.find((z) => z.kind === "intro" || z.kind === "section")?.id ?? null;
  const title = headingKey(reading.vs.page.title || "");
  const passage = (i) => {
    const p = reading.vs.passages.find((x) => x.index === i);
    if (!p) return hero;
    const key = headingKey(p.rawHeading ?? p.heading ?? "");
    if (i === 0 && (!key || key === title)) return hero;
    return byHeading.get(key) ?? hero;
  };
  const passages = (ids) => [...new Set((ids || []).map(passage).filter((z) => z !== null))];
  return { zones, hero, passage, passages, heading: (t) => byHeading.get(headingKey(t)) ?? null };
}

// ── the checks ───────────────────────────────────────────────────────────────

function accessChecks(r, out) {
  const robots = r.robots;
  if (robots.status === "unreachable") out.push({ code: "robots_unreachable", evidence: { url: robots.url, httpStatus: robots.httpStatus }, strip: { side: "robots", rows: ["search", "ai_search", "ai_training"] }, where: "/robots.txt" });
  else if (robots.status === "ok") {
    const blocked = robots.bots.filter((b) => !b.allowed);
    const engines = blocked.filter((b) => b.kind === "index");
    const answering = blocked.filter((b) => b.kind === "search" || b.kind === "user");
    const training = blocked.filter((b) => b.kind === "training");
    if (engines.length) out.push({ code: "search_engine_blocked", evidence: { bots: engines.map((b) => b.token), rules: engines.map((b) => b.rule) }, strip: { side: "robots", rows: ["search"] }, where: "/robots.txt" });
    if (answering.length) out.push({ code: "ai_search_blocked", evidence: { bots: answering.map((b) => b.token), rules: answering.map((b) => b.rule) }, strip: { side: "robots", rows: ["ai_search"] }, where: "/robots.txt" });
    if (training.length) out.push({ code: "ai_training_blocked", evidence: { bots: training.map((b) => b.token), rules: training.map((b) => b.rule) }, strip: { side: "robots", rows: ["ai_training"] }, where: "/robots.txt" });
  }
  const sources = [];
  for (const m of r.facts.head.robotsMeta) if (/\bnoindex\b|\bnone\b/i.test(m.content)) sources.push(`meta ${m.name}: ${m.content}`);
  if (/\bnoindex\b|\bnone\b/i.test(r.fetch.xRobotsTag || "")) sources.push(`X-Robots-Tag: ${fold(r.fetch.xRobotsTag)}`);
  if (sources.length) out.push({ code: "noindex", evidence: { sources }, strip: { side: "head", rows: ["robots"] }, where: sources.map((s) => s.split(":")[0]).join(", ") });
  if (r.llms && !r.llms.present) out.push({ code: "llms_txt_missing", evidence: { url: r.llms.url, status: r.llms.status, softNotFound: Boolean(r.llms.softNotFound) }, strip: { side: "robots", rows: ["llms"] }, where: "/llms.txt" });
}

function classicChecks(r, loc, out) {
  const { facts, fetch } = r;
  const head = facts.head;
  if (fetch.finalUrl && new URL(fetch.finalUrl).protocol === "http:") out.push({ code: "not_https", evidence: { url: fetch.finalUrl }, where: "URL" });
  const hops = Math.max(0, (fetch.chain || []).length - 1);
  if (hops >= REDIRECT_CHAIN_HOPS) out.push({ code: "redirect_chain", evidence: { hops, chain: fetch.chain.map((c) => `${c.status} ${c.url}`) }, where: "URL" });
  if (r.sitemap) {
    if (!r.sitemap.found) out.push({ code: "sitemap_missing", evidence: { tried: r.sitemap.fetched.map((f) => `${f.status ?? f.reason} ${f.url}`), declared: r.sitemap.declared.length }, strip: { side: "robots", rows: ["sitemap"] }, where: "sitemap.xml" });
    else if (r.sitemap.listsPage === false) out.push({ code: "sitemap_not_listed", evidence: { read: r.sitemap.fetched.filter((f) => f.read).map((f) => `${f.url} (${f.count} URLs)`) }, strip: { side: "robots", rows: ["sitemap"] }, where: "sitemap.xml" });
  }
  const title = head.title;
  if (!title) out.push({ code: "title_missing", evidence: {}, strip: { side: "head", rows: ["title"] }, where: "<title>" });
  else if (title.length > TITLE_MAX) out.push({ code: "title_too_long", evidence: { length: title.length, max: TITLE_MAX, title }, strip: { side: "head", rows: ["title"] }, where: "<title>" });
  else if (title.length < TITLE_MIN) out.push({ code: "title_too_short", evidence: { length: title.length, min: TITLE_MIN, title }, strip: { side: "head", rows: ["title"] }, where: "<title>" });
  const h1s = facts.headings.filter((h) => h.level === 1 && !h.hidden);
  if (!h1s.length) out.push({ code: "h1_missing", evidence: {}, where: "<h1>" });
  else if (h1s.length > 1) out.push({ code: "h1_multiple", evidence: { count: h1s.length, samples: h1s.slice(0, 6).map((h) => h.text) }, zones: [...new Set(h1s.map((h) => h.zone))], where: h1s.map((h) => h.path).slice(0, 3).join(", ") });
  const content = facts.headings.filter((h) => !h.hidden && !h.overlay && !(h.furniture && h.furniture !== "header"));
  const skips = [];
  for (let i = 1; i < content.length; i++) if (content[i].level > content[i - 1].level + 1) skips.push({ from: content[i - 1].level, to: content[i].level, text: content[i].text, zone: content[i].zone, path: content[i].path });
  if (skips.length) out.push({ code: "heading_order_skip", evidence: { count: skips.length, samples: skips.slice(0, 6).map((s) => `h${s.from} → h${s.to} “${s.text}”`) }, zones: [...new Set(skips.map((s) => s.zone))], where: skips[0].path });
  const internal = facts.links.filter((l) => l.internal && !l.self);
  if (!internal.length) out.push({ code: "internal_links_none", evidence: { links: facts.links.length }, where: "<a href>" });
  if (r.links) {
    const broken = r.links.results.filter((x) => x.verdict === "broken");
    if (broken.length) out.push({ code: "broken_links", evidence: { count: broken.length, checked: r.links.checked, unchecked: r.links.unchecked, samples: broken.slice(0, 8).map((b) => `${b.status} ${b.url}`) }, zones: [...new Set(broken.map((b) => b.zone))], where: broken.slice(0, 3).map((b) => b.path).join(", ") });
  }
  const noAlt = facts.images.filter((i) => !i.hasAlt && !i.decorative);
  if (noAlt.length) out.push({ code: "image_alt_missing", evidence: { count: noAlt.length, images: facts.images.length, samples: noAlt.slice(0, 6).map((i) => i.src) }, zones: [...new Set(noAlt.map((i) => i.zone))], where: noAlt.slice(0, 3).map((i) => i.path).join(", ") });
  if (!head.viewport) out.push({ code: "viewport_missing", evidence: {}, strip: { side: "head", rows: ["viewport"] }, where: '<meta name="viewport">' });
  if (!head.lang) out.push({ code: "html_lang_missing", evidence: {}, strip: { side: "head", rows: ["lang"] }, where: "<html lang>" });
  const missingSocial = ["og:title", "og:description", "og:image"].filter((k) => !head.og[k]);
  if (!head.twitter["twitter:card"]) missingSocial.push("twitter:card");
  if (missingSocial.length) out.push({ code: "social_tags_missing", evidence: { missing: missingSocial }, strip: { side: "head", rows: ["social"] }, where: missingSocial.join(", ") });
  if (facts.htmlBytes > HEAVY_HTML_BYTES || head.scripts.total > HEAVY_SCRIPTS) out.push({ code: "page_weight_heavy", evidence: { htmlBytes: facts.htmlBytes, scripts: head.scripts.total, blocking: head.scripts.blocking, maxBytes: HEAVY_HTML_BYTES, maxScripts: HEAVY_SCRIPTS }, strip: { side: "head", rows: ["scripts"] }, where: "HTML" });
  const u = new URL(fetch.finalUrl);
  const params = [...u.searchParams.keys()].length;
  const tail = `${u.pathname}${u.search}`;
  if (tail.length > URL_MAX_CHARS || params > URL_MAX_PARAMS || /(?:^|[?&;])(?:sid|sessionid|jsessionid|phpsessid)=/i.test(u.search + u.pathname)) out.push({ code: "url_unreadable", evidence: { length: tail.length, params, max: URL_MAX_CHARS }, where: "URL" });
}

function structuredChecks(r, out) {
  const { jsonLd, microdata, rdfa } = r.facts.structured;
  const invalid = jsonLd.filter((b) => !b.ok);
  if (invalid.length) out.push({ code: "jsonld_invalid", evidence: { invalid: invalid.length, blocks: jsonLd.length, errors: invalid.slice(0, 3).map((b) => `#${b.index}: ${b.error}`) }, strip: { side: "head", rows: ["jsonld"] }, where: invalid.map((b) => `script[type="application/ld+json"] #${b.index}`).join(", ") });
  if (!jsonLd.length && !microdata.length && !rdfa.length) out.push({ code: "structured_data_none", evidence: {}, strip: { side: "head", rows: ["jsonld"] }, where: "JSON-LD, microdata, RDFa" });
  const required = [];
  const recommended = [];
  let faqQuestions = [];
  let faqBlock = null;
  for (const block of jsonLd.filter((b) => b.ok)) {
    for (const { types, node, path } of typedNodes(block.value)) {
      for (const type of types) {
        const rule = SCHEMA_RULES[type];
        if (!rule) continue;
        const missing = (rule.required || []).filter((k) => !has(node, k));
        if (rule.oneOf && !rule.oneOf.some((k) => has(node, k))) missing.push(rule.oneOf.join(" | "));
        if (type === "FAQPage" && has(node, "mainEntity")) {
          const qs = asList(node.mainEntity);
          const bad = qs.filter((q) => !q || typeof q !== "object" || !has(q, "name") || !q.acceptedAnswer || !has(asList(q.acceptedAnswer)[0] || {}, "text"));
          if (bad.length) missing.push(`mainEntity[${bad.length}] name | acceptedAnswer.text`);
          faqQuestions = faqQuestions.concat(qs.filter((q) => q && typeof q === "object" && typeof q.name === "string").map((q) => fold(q.name)));
          faqBlock ??= block.index;
        }
        if (type === "BreadcrumbList" && has(node, "itemListElement")) {
          const items = asList(node.itemListElement);
          const bad = items.filter((it, i) => !it || typeof it !== "object" || !has(it, "position") || !(has(it, "name") || (it.item && typeof it.item === "object" && has(it.item, "name"))) || (i < items.length - 1 && !has(it, "item")));
          if (bad.length) missing.push(`itemListElement[${bad.length}] position | name | item`);
        }
        if (type.endsWith("Application") && has(node, "offers")) {
          const offers = asList(node.offers);
          if (!offers.some((o) => o && typeof o === "object" && (has(o, "price") || has(o, "lowPrice")))) missing.push("offers.price");
        }
        if (missing.length) required.push({ type, missing, block: block.index, path, source: rule.source });
        const rec = (rule.recommended || []).filter((k) => !has(node, k));
        if (rec.length) recommended.push({ type, missing: rec, block: block.index, path, source: rule.source });
      }
    }
  }
  if (required.length) out.push({ code: "schema_required_missing", evidence: { types: [...new Set(required.map((x) => x.type))], items: required.slice(0, 8).map((x) => `${x.type}: ${x.missing.join(", ")}`) }, rulesExtra: [...new Set(required.map((x) => x.source))], strip: { side: "head", rows: ["jsonld"] }, where: required.slice(0, 3).map((x) => `JSON-LD #${x.block} ${x.path}`).join(", ") });
  if (recommended.length) out.push({ code: "schema_recommended_missing", evidence: { types: [...new Set(recommended.map((x) => x.type))], items: recommended.slice(0, 8).map((x) => `${x.type}: ${x.missing.join(", ")}`) }, rulesExtra: [...new Set(recommended.map((x) => x.source))], strip: { side: "head", rows: ["jsonld"] }, where: recommended.slice(0, 3).map((x) => `JSON-LD #${x.block} ${x.path}`).join(", ") });
  const hasFaq = jsonLd.some((b) => b.types.includes("FAQPage")) || microdata.includes("FAQPage");
  if (hasFaq) {
    const visible = norm(r.facts.visibleText);
    const notVisible = faqQuestions.filter((q) => q && !visible.includes(norm(q)));
    if (notVisible.length) out.push({ code: "faq_schema_not_visible", evidence: { questions: faqQuestions.length, notVisible: notVisible.length, samples: notVisible.slice(0, 5) }, strip: { side: "head", rows: ["jsonld"] }, where: `script[type="application/ld+json"] #${faqBlock}` });
    out.push({ code: "faq_rich_result_retired", evidence: { date: "2026-05-07" }, strip: { side: "head", rows: ["jsonld"] }, where: "FAQPage" });
  }
}

function readingChecks(r, loc, out) {
  const vs = r.vs;
  // The Vectorscope's checks, with h2 sections standing in for the agent's groups.
  const keys = [];
  const assignment = vs.passages.map((p) => {
    const k = headingKey(p.rawHeading ?? p.heading ?? "");
    let g = keys.indexOf(k);
    if (g < 0) g = keys.push(k) - 1;
    return g;
  });
  const keep = new Set(["cap_overflow", "js_dependent", "lost_faq_questions", "dominant_heading", "mid_sentence_start", "nav_in_content", "thin_section", "truncated_teaser", "repeated_claim", "canonical_missing", "canonical_relative", "canonical_other", "canonical_multiple", "meta_description_missing", "meta_description_short", "meta_description_long"]);
  const strips = { canonical_missing: "canonical", canonical_relative: "canonical", canonical_other: "canonical", canonical_multiple: "canonical", meta_description_missing: "description", meta_description_short: "description", meta_description_long: "description" };
  for (const f of runChecks({ ...vs, robots: undefined }, assignment, keys.length)) {
    if (!keep.has(f.code)) continue;
    const item = { code: f.code, severity: f.severity === "info" ? "low" : f.severity, evidence: f.evidence, passages: f.passages };
    if (strips[f.code]) {
      item.strip = { side: "head", rows: [strips[f.code]] };
      item.passages = [];
      item.where = f.code.startsWith("canonical") ? '<link rel="canonical">' : '<meta name="description">';
    } else if (f.code === "cap_overflow") {
      item.zones = capZones(r, loc);
      item.where = `passage #${f.passages[0]} and after`;
    } else if (f.code === "js_dependent") {
      item.zones = (r.render?.jsZones || []).map((z, i) => `js${i}`);
      item.where = "JavaScript";
    } else if (f.code === "thin_section") {
      item.zones = [...new Set((f.evidence.samples || []).map((s) => loc.heading(s.heading)).filter((z) => z !== null))];
      item.where = (f.evidence.samples || []).slice(0, 3).map((s) => `h2 “${s.heading}”`).join(", ");
    } else {
      item.zones = loc.passages(f.passages);
      item.where = f.passages.length ? `passage${f.passages.length > 1 ? "s" : ""} #${f.passages.slice(0, 6).join(", #")}` : null;
    }
    out.push(item);
  }
  const facts = r.facts;
  const lede = facts.removedHeaders.filter((h) => h.ledeCount > 0);
  if (lede.length) {
    const heroZone = loc.hero;
    out.push({ code: "hero_lede_dropped", evidence: { chars: lede.reduce((s, h) => s + h.ledeChars, 0), paragraphs: lede.reduce((s, h) => s + h.ledeCount, 0), samples: lede.flatMap((h) => h.ledes).slice(0, 3), header: lede[0].path }, zones: [...new Set(lede.map((h) => (h.hasH1 && heroZone !== null ? heroZone : h.zone)))], where: `${lede[0].path} > p` });
  }
  if (facts.hiddenHeadings.length) {
    out.push({ code: "hidden_headings", severity: facts.hiddenChars >= HIDDEN_HIGH_CHARS ? "high" : "medium", evidence: { count: facts.hiddenHeadings.length, chars: facts.hiddenChars, samples: facts.hiddenHeadings.slice(0, 6).map((h) => `h${h.level} “${h.text}”`) }, zones: [...new Set(facts.hiddenHeadings.map((h) => h.zone))], where: facts.hiddenHeadings[0].root || facts.hiddenHeadings[0].path });
  }
  if (facts.placeholders.length) out.push({ code: "ssr_placeholder_text", evidence: { count: facts.placeholders.length, samples: facts.placeholders.slice(0, 4).map((p) => p.text) }, zones: [...new Set(facts.placeholders.map((p) => p.zone))], where: facts.placeholders[0].path });
  const glued = facts.headings.filter((h) => h.level === 1 && h.glued?.length);
  if (glued.length) out.push({ code: "h1_glued_words", evidence: { textContent: glued[0].textContent, joins: glued.flatMap((h) => h.glued).slice(0, 4).map((j) => `${j.left}${j.right}`) }, zones: [...new Set(glued.map((h) => h.zone))], where: glued[0].path });
}

/** The zones holding text past the cap: sections that reached no passage, else the last section. */
function capZones(r, loc) {
  const rows = r.vs.losses?.sections?.rows || [];
  const out = [];
  for (const row of rows) {
    if (row.kind !== "h2" || row.inPassages === null || row.chars === 0) continue;
    if (row.inPassages < row.chars * 0.95) {
      const z = loc.heading(row.heading);
      if (z !== null && !out.includes(z)) out.push(z);
    }
  }
  if (!out.length) {
    const last = [...loc.zones].reverse().find((z) => z.kind === "section" || z.kind === "more");
    if (last) out.push(last.id);
  }
  return out;
}

const HREFLANG_CODE = /^(?:x-default|[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?)$/i;

function languageChecks(r, out) {
  const hl = r.facts.head.hreflang;
  if (!hl.length) return;
  const page = r.fetch.finalUrl;
  const canonical = r.vs.technical?.canonical?.resolved;
  const isSelf = (href) => href && (samePage(href, page) || (canonical && samePage(href, canonical)) || samePage(href, r.fetch.requestedUrl));
  const invalid = hl.filter((h) => !HREFLANG_CODE.test(h.hreflang));
  if (invalid.length) out.push({ code: "hreflang_invalid_code", evidence: { codes: invalid.map((h) => h.hreflang) }, strip: { side: "head", rows: ["hreflang"] }, where: invalid.map((h) => `hreflang="${h.hreflang}"`).join(", ") });
  const self = hl.find((h) => isSelf(h.href));
  if (!self) out.push({ code: "hreflang_no_self", evidence: { declared: hl.map((h) => h.hreflang) }, strip: { side: "head", rows: ["hreflang"] }, where: '<link rel="alternate" hreflang>' });
  if (!hl.some((h) => h.hreflang.toLowerCase() === "x-default")) out.push({ code: "hreflang_no_x_default", evidence: { declared: hl.map((h) => h.hreflang) }, strip: { side: "head", rows: ["hreflang"] }, where: '<link rel="alternate" hreflang>' });
  const alts = r.alternates?.results || [];
  const read = alts.filter((a) => a.ok);
  const noReturn = read.filter((a) => !a.hreflangSet.some((h) => isSelf(h.href)));
  if (noReturn.length) out.push({ code: "hreflang_no_return", evidence: { langs: noReturn.map((a) => a.hreflang), urls: noReturn.map((a) => a.href) }, strip: { side: "head", rows: ["hreflang"] }, where: noReturn.map((a) => a.href).slice(0, 3).join(", ") });
  const broken = alts.filter((a) => !a.refused && (!a.ok || a.redirected || a.noindex));
  if (broken.length) out.push({ code: "hreflang_alternate_broken", evidence: { langs: broken.map((a) => a.hreflang), items: broken.map((a) => `${a.hreflang}: ${a.ok ? (a.noindex ? "noindex" : `redirects to ${a.finalUrl}`) : a.status ? `HTTP ${a.status}` : a.reason}`) }, strip: { side: "head", rows: ["hreflang"] }, where: broken.map((a) => a.href).slice(0, 3).join(", ") });
  // The versions side by side: this page (under its own hreflang) and every alternate read.
  const versions = [{ hreflang: self?.hreflang || r.facts.head.lang || "this page", title: r.facts.head.title, description: r.facts.head.metaDescriptions[0] || "", lang: r.facts.head.lang, self: true }, ...read];
  const dupes = (field) => {
    const groups = new Map();
    for (const v of versions) {
      const key = fold(v[field]);
      if (!key) continue;
      groups.set(key, [...(groups.get(key) || []), v.hreflang]);
    }
    return [...groups.values()].filter((g) => g.length >= 2);
  };
  const dupTitles = dupes("title");
  if (dupTitles.length) out.push({ code: "title_duplicate_locales", evidence: { groups: dupTitles, count: Math.max(...dupTitles.map((g) => g.length)) }, strip: { side: "head", rows: ["title"] }, where: "<title>" });
  const dupDesc = dupes("description");
  if (dupDesc.length) out.push({ code: "description_duplicate_locales", evidence: { groups: dupDesc, count: Math.max(...dupDesc.map((g) => g.length)) }, strip: { side: "head", rows: ["description"] }, where: '<meta name="description">' });
  const mismatch = versions.filter((v) => v.lang && v.hreflang && HREFLANG_CODE.test(v.hreflang) && v.hreflang.toLowerCase() !== "x-default" && primaryTag(v.lang) !== primaryTag(v.hreflang));
  if (mismatch.length) out.push({ code: "hreflang_lang_mismatch", evidence: { items: mismatch.map((v) => `${v.hreflang}: lang="${v.lang}"`) }, strip: { side: "head", rows: ["lang"] }, where: "<html lang>" });
  // llms.txt and the languages: does it point at more than one of the versions?
  if (r.llms?.present && read.length) {
    const langs = [{ hreflang: self?.hreflang, url: page }, ...read.map((a) => ({ hreflang: a.hreflang, url: a.finalUrl || a.href }))].filter((v) => v.hreflang);
    const prefixOf = (u) => {
      try {
        const x = new URL(u);
        const first = x.pathname.split("/").filter(Boolean)[0] || "";
        return `${x.host}/${first}`;
      } catch {
        return "";
      }
    };
    const sample = r.llms.sample || [];
    const mentions = langs.filter((v) => sample.some((u) => samePage(u, v.url) || (prefixOf(u) === prefixOf(v.url) && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(prefixOf(v.url).split("/")[1] || ""))));
    const distinct = new Set(mentions.map((v) => primaryTag(v.hreflang)));
    if (distinct.size <= 1) out.push({ code: "llms_txt_one_language", evidence: { versions: langs.length, mentioned: [...distinct].filter(Boolean), links: r.llms.links }, strip: { side: "robots", rows: ["llms"] }, where: "/llms.txt" });
  }
}

/**
 * Every finding for one reading, ranked: severity first, then the registry's order. Each comes
 * with its id (the code), area, owner, rules, where, zones (page-map zone ids, or js0… for the
 * JavaScript-only zones) and strip rows.
 */
export function auditFindings(reading) {
  const loc = locator(reading);
  const raw = [];
  accessChecks(reading, raw);
  classicChecks(reading, loc, raw);
  structuredChecks(reading, raw);
  readingChecks(reading, loc, raw);
  languageChecks(reading, raw);
  const out = raw.map((f) => {
    const reg = CODES[f.code];
    if (!reg) throw new Error(`unregistered code ${f.code}`);
    const rules = [...new Set([...reg.rules, ...(f.rulesExtra || [])])];
    return {
      id: f.code,
      code: f.code,
      severity: f.severity || reg.severity,
      area: reg.area,
      owner: reg.owner,
      hides: Boolean(reg.hides),
      informational: Boolean(reg.info),
      where: f.where ?? null,
      zones: f.zones || [],
      strip: f.strip || null,
      passages: f.passages || [],
      evidence: f.evidence || {},
      rules: rules.map(source),
    };
  });
  return out.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || CODE_ORDER.indexOf(a.code) - CODE_ORDER.indexOf(b.code));
}
