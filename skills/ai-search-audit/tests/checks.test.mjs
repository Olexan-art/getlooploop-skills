// Every check, on synthetic HTML: once with the error and once without it. The pages are built in
// helpers.mjs; the network parts (robots.txt, sitemap, llms.txt, links, the render) are patched in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { robotsReport } from "../../vectorscope/scripts/lib/robots.mjs";
import { CODES } from "../scripts/lib/checks.mjs";
import { LABELS } from "../scripts/lib/copy.mjs";
import { codesOf, findingOf, page, section, URL_ } from "./helpers.mjs";

const robots = (text) => ({ robotsText: text });
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const brokenLinks = { total: 2, checked: 2, unchecked: 0, cap: 30, results: [{ url: "https://example.org/gone", status: 404, verdict: "broken", zone: 1, path: "main > a" }, { url: "https://example.org/ok", status: 200, verdict: "ok", zone: 1, path: "main > a" }] };
const okLinks = { ...brokenLinks, results: [brokenLinks.results[1]] };
const sitemapFound = (listsPage) => ({ source: "robots", declared: [], offSite: [], fetched: [{ url: "https://example.org/sitemap.xml", status: 200, kind: "urlset", count: 3, read: true }], found: true, listsPage, matchedIn: null, children: { total: 0, read: 0, unread: 0, cap: 5 }, candidatesUnread: 0 });
const faq = (q) => `<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"${q}","acceptedAnswer":{"@type":"Answer","text":"Yes, it does."}}]}</script>`;

// [code, the page (and patch, options) with the error, the page without it]
const CASES = [
  ["noindex", [page({ head: '<meta name="robots" content="noindex, follow">' })], [page()]],
  ["noindex", [page(), { fetch: { xRobotsTag: "noindex" } }], [page(), { fetch: { xRobotsTag: "max-snippet:-1" } }]],
  ["search_engine_blocked", [page(), {}, robots("User-agent: Googlebot\nDisallow: /\n")], [page(), {}, robots("User-agent: Googlebot\nDisallow: /private\n")]],
  ["ai_search_blocked", [page(), {}, robots("User-agent: OAI-SearchBot\nDisallow: /page\n")], [page(), {}, robots("User-agent: OAI-SearchBot\nAllow: /\n")]],
  ["ai_training_blocked", [page(), {}, robots("User-agent: GPTBot\nDisallow: /\n")], [page()]],
  ["robots_unreachable", [page(), { robots: { ...robotsReport({ status: "unreachable", url: "https://example.org/robots.txt", httpStatus: 503 }, URL_), sitemaps: [] } }], [page()]],
  ["llms_txt_missing", [page(), { llms: { url: "https://example.org/llms.txt", status: 404, present: false } }], [page(), { llms: { url: "https://example.org/llms.txt", status: 200, present: true, links: 3, sample: [] } }]],
  ["not_https", [page(), { fetch: { finalUrl: "http://example.org/page" } }], [page()]],
  ["redirect_chain", [page(), { fetch: { chain: [{ url: "http://example.org/a", status: 301 }, { url: "https://example.org/a", status: 301 }, { url: URL_, status: 200 }] } }], [page(), { fetch: { chain: [{ url: "http://example.org/page", status: 301 }, { url: URL_, status: 200 }] } }]],
  ["sitemap_missing", [page(), { sitemap: { ...sitemapFound(null), found: false, fetched: [{ url: "https://example.org/sitemap.xml", status: 404, read: false }] } }], [page(), { sitemap: sitemapFound(true) }]],
  ["sitemap_not_listed", [page(), { sitemap: sitemapFound(false) }], [page(), { sitemap: sitemapFound(null) }]],
  ["title_missing", [page({ omit: ["title"] })], [page()]],
  ["title_too_long", [page({ title: "A".repeat(61) })], [page({ title: "A".repeat(60) })]],
  ["title_too_short", [page({ title: "Short" })], [page({ title: "Ten chars!" })]],
  ["meta_description_missing", [page({ omit: ["description"] })], [page()]],
  ["meta_description_short", [page({ description: "Too short." })], [page()]],
  ["meta_description_long", [page({ description: "x".repeat(161) })], [page({ description: "x".repeat(160) })]],
  ["h1_missing", [page({ omit: ["h1"] })], [page()]],
  ["h1_multiple", [page({ body: "<h1>A second h1</h1>" })], [page()]],
  ["heading_order_skip", [page({ body: section("Two") + "<h4>Four</h4><p>text</p>" })], [page({ body: section("Two") + "<h3>Three</h3><p>text</p>" })]],
  ["canonical_missing", [page({ omit: ["canonical"] })], [page()]],
  ["canonical_relative", [page({ canonical: "/page" })], [page()]],
  ["canonical_other", [page({ canonical: "https://example.org/elsewhere" })], [page()]],
  ["canonical_multiple", [page({ head: '<link rel="canonical" href="https://example.org/page">' })], [page()]],
  ["internal_links_none", [page({ omit: ["link"] })], [page()]],
  ["broken_links", [page(), { links: brokenLinks }], [page(), { links: okLinks }]],
  ["image_alt_missing", [page({ body: '<img src="a.png">' })], [page({ body: '<img src="a.png" alt="">' })]],
  ["viewport_missing", [page({ omit: ["viewport"] })], [page()]],
  ["html_lang_missing", [page({ lang: "" })], [page()]],
  ["social_tags_missing", [page({ omit: ["og"] })], [page()]],
  ["social_tags_missing", [page({ omit: ["twitter"] })], [page()]],
  ["page_weight_heavy", [page({ body: many(31, (i) => `<script src="/s${i}.js"></script>`) })], [page({ body: many(30, (i) => `<script src="/s${i}.js"></script>`) })]],
  ["url_unreadable", [page(), {}, { url: "https://example.org/page?a=1&b=2&c=3" }], [page(), {}, { url: "https://example.org/page?a=1" }]],
  ["jsonld_invalid", [page({ head: '<script type="application/ld+json">{"@type": </script>' })], [page()]],
  ["structured_data_none", [page({ omit: ["jsonld"] })], [page({ omit: ["jsonld"], body: '<div itemscope itemtype="https://schema.org/Thing"></div>' })]],
  ["schema_required_missing", [page({ head: '<script type="application/ld+json">{"@type":"Product","name":"Widget"}</script>' })], [page({ head: '<script type="application/ld+json">{"@type":"Product","name":"Widget","offers":{"@type":"Offer","price":"5"}}</script>' })]],
  ["schema_required_missing", [page({ head: '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"},{"@type":"ListItem","position":2,"name":"Page"}]}</script>' })], [page({ head: '<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://example.org/"},{"@type":"ListItem","position":2,"name":"Page"}]}</script>' })]],
  ["schema_required_missing", [page({ head: '<script type="application/ld+json">{"@type":"SoftwareApplication","name":"App","offers":{"@type":"Offer","price":"0"}}</script>' })], [page({ head: '<script type="application/ld+json">{"@type":"SoftwareApplication","name":"App","offers":{"@type":"Offer","price":"0"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.5","ratingCount":"10"}}</script>' })]],
  ["schema_recommended_missing", [page({ head: '<script type="application/ld+json">{"@type":"Article","headline":"H","image":"i.png","datePublished":"2026-01-01"}</script>' })], [page({ head: '<script type="application/ld+json">{"@type":"Article","headline":"H","image":"i.png","datePublished":"2026-01-01","author":{"@type":"Person","name":"A"}}</script>' })]],
  ["faq_schema_not_visible", [page({ head: faq("Is the widget free for schools?") })], [page({ head: faq("Is the widget free for schools?"), body: "<h2>Is the widget free for schools?</h2><p>Yes, it is free for schools of any size, with every feature.</p>" })]],
  ["faq_rich_result_retired", [page({ head: faq("Q?") })], [page()]],
  ["lost_faq_questions", [page({ body: `<h2>FAQ</h2><p>Yes. You can change plans at any time.</p><p>No. There is no setup fee at all.</p><p>Yes. Every plan includes support by email.</p><p>${"More words about the plans and their limits. ".repeat(4)}</p>` })], [page({ body: `<h2>FAQ</h2><p>Can I change plans? Yes. You can change plans at any time.</p><p>Is there a fee? No. There is no setup fee at all.</p><p>Is support included? Yes. Every plan includes support by email.</p>` })]],
  ["nav_in_content", [page({ body: section("Links") + "<div><p>Home</p><p>About</p><p>Blog</p><p>Contact</p><p>Pricing</p></div>" + section("After") })], [page({ body: section("Links") + section("After") })]],
  ["thin_section", [page({ body: section("Long one") + "<h2>Thin</h2><p>Only a line about the thin subject, short of the bar for a full section answer.</p>" + section("Another long one") })], [page({ body: section("Long one") + section("Another long one") })]],
  ["truncated_teaser", [page({ body: section("News") + "<p>The new release brings a faster editor and…</p>" + section("More") })], [page({ body: section("News") + "<p>The new release brings a faster editor.</p>" + section("More") })]],
  ["repeated_claim", [page({ body: many(4, (i) => `<h2>Part ${"ABCD"[i]}</h2><p>${many(3, (j) => `Line ${j} of part ${i} holds ${j} facts. `)}Our tool is the fastest way to ship your docs today.</p>`) })], [page({ body: many(4, (i) => section(`Part ${"ABCD"[i]}`)) })]],
  ["cap_overflow", [page({ body: many(30, (i) => section(`Section ${i}`, null, 12)) })], [page({ body: many(10, (i) => section(`Section ${i}`, null, 12)) })]],
  ["dominant_heading", [page({ body: section("Big", null, 40) + section("Small one") + section("Small two") + section("Small three") })], [page({ body: section("One", null, 10) + section("Two", null, 10) + section("Three", null, 10) + section("Four", null, 10) })]],
  ["js_dependent", [page(), { vs: { render: { ok: true, wordCount: 900, passages: 6, charsIndexed: 6000, headings: 6 } } }], [page(), { vs: { render: { ok: true, wordCount: 90, passages: 2, charsIndexed: 600, headings: 2 } } }]],
  ["hero_lede_dropped", [page({ omit: ["h1"], before: `<header><nav><a href="/">Home</a></nav><h1>The page heading</h1><p>The product is help-desk software for support teams of three to three hundred people.</p></header>` })], [page({ omit: ["h1"], before: `<header><h1>The page heading</h1><p>The product is help-desk software for support teams of three to three hundred people.</p></header>` })]],
  ["hidden_headings", [page({ body: `<div role="tabpanel" hidden><h2>Compare features</h2><p>${"Hidden comparison text. ".repeat(12)}</p></div>` })], [page({ body: `<div role="tabpanel"><h2>Compare features</h2><p>${"Visible comparison text. ".repeat(12)}</p></div>` })]],
  ["hidden_headings", [page({ before: `<nav hidden><h2>Menu</h2><p>Links</p></nav>` })], [page({ body: `<dialog><h2>Sign in</h2><p>Form</p></dialog>` })], { inverse: true }],
  ["ssr_placeholder_text", [page({ body: section("Calculator") + "<p>Calculating your plan…</p>" })], [page({ body: section("Calculator") + "<p>Calculating your plan takes a moment and uses only the numbers you type into the form.</p>" })]],
  ["h1_glued_words", [page({ h1: "<h1><span>BrightDesk</span><span>Plans for every team</span></h1>" })], [page({ h1: "<h1>Get<span>Loop</span>Loop</h1>" })]],
];

for (const [code, withIt, without, opts = {}] of CASES) {
  test(`${code}: ${opts.inverse ? "not raised for furniture or dialogs" : "raised with the error, not without it"}`, async () => {
    if (!opts.inverse) {
      const yes = await codesOf(withIt[0], withIt[1] || {}, withIt[2] || {});
      assert.ok(yes.includes(code), `expected ${code} in ${yes.join(", ")}`);
    } else {
      const a = await codesOf(withIt[0], withIt[1] || {}, withIt[2] || {});
      assert.ok(!a.includes(code), `${code} raised for a hidden menu: ${a.join(", ")}`);
    }
    const no = await codesOf(without[0], without[1] || {}, without[2] || {});
    assert.ok(!no.includes(code), `did not expect ${code} in ${no.join(", ")}`);
  });
}

test("every registered code has a test case, a label in both languages, an area, an owner and rule sources", async () => {
  const tested = new Set(CASES.map((c) => c[0]));
  const elsewhere = new Set(["mid_sentence_start", "hreflang_no_return", "hreflang_invalid_code", "hreflang_no_self", "hreflang_alternate_broken", "title_duplicate_locales", "description_duplicate_locales", "hreflang_lang_mismatch", "hreflang_no_x_default", "llms_txt_one_language", "locale_facts_differ", "question_missing", "question_partial", "stock_phrases", "repeated_sentence_shape", "uniform_openings", "unchecked_claims", "keyword_not_in_title", "keyword_variant_split", "keyword_one_section", "off_keyword_share", "promise_without_number", "brand_contradiction", "brand_fact_absent", "brand_unknown", "review_rating_unbacked", "review_control_hallucination", "reviews_without_markup", "rich_result_retired", "image_dimensions_missing", "image_lcp_lazy", "image_not_lazy", "image_legacy_format", "image_oversized", "image_no_srcset", "favicon_missing", "site_name_missing", "mixed_content", "soft_404", "url_variants_inconsistent", "hsts_missing", "author_missing", "about_contact_missing", "organization_details_missing", "article_date_missing", "privacy_terms_missing", "date_mismatch", "snippet_blocked", "markdown_alternate_broken", "ai_catalog_invalid", "indexnow_key_broken", "spa_shell"]);
  for (const [code, reg] of Object.entries(CODES)) {
    assert.ok(tested.has(code) || elsewhere.has(code), `${code} has no test`);
    assert.ok(LABELS[code], `${code} has no label`);
    assert.ok(["classic", "find", "read", "quote", "brand", "lang"].includes(reg.area), code);
    assert.ok(["dev", "content", "seo"].includes(reg.owner), code);
    assert.ok(reg.rules.length, code);
    assert.ok([undefined, "measured", "derived", "judgement"].includes(reg.layer), code);
  }
});

test("a finding carries its rule sources as name and URL, its severity and where it is", async () => {
  const f = await findingOf(page({ omit: ["viewport"] }), "viewport_missing");
  assert.equal(f.severity, "medium");
  assert.equal(f.area, "classic");
  assert.ok(f.rules.every((r) => r.name && /^https:\/\//.test(r.url)));
  assert.deepEqual(f.strip, { side: "head", rows: ["viewport"] });
});

test("hidden headings are high when the hidden text is long, medium when short", async () => {
  const long = await findingOf(page({ body: `<div hidden><h2>Panel</h2><p>${"Hidden text. ".repeat(30)}</p></div>` }), "hidden_headings");
  const short = await findingOf(page({ body: `<div hidden><h2>Panel</h2><p>Hi.</p></div>` }), "hidden_headings");
  assert.equal(long.severity, "high");
  assert.equal(short.severity, "medium");
});

test("FAQ markup: the questions that are not on the page are counted", async () => {
  const f = await findingOf(page({ head: faq("Is the widget free for schools?") }), "faq_schema_not_visible");
  assert.equal(f.evidence.notVisible, 1);
  assert.deepEqual(f.evidence.samples, ["Is the widget free for schools?"]);
});
