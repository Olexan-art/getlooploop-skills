// The owner-approved additions, on synthetic pages: the app shell, images, schema types and
// retired rich results, trust signals (E-E-A-T presence, no score), snippet controls, the site
// around the page (favicon, soft 404, URL variants, HSTS, Markdown copy, ai-catalog.json,
// IndexNow), mixed content and dates. Each code is raised with the error and not without it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkImages, checkSite, improbablePath } from "../scripts/lib/collect.mjs";
import { datesIn } from "../scripts/lib/extras.mjs";
import { RETIRED } from "../scripts/lib/checks.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { codesOf, findingOf, page, readingOf, section, URL_, withFetch } from "./helpers.mjs";

const ld = (o) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...o })}</script>`;
const okSite = {
  favicon: { url: "https://example.org/favicon.ico", declared: false, status: 200, ok: true },
  soft404: { url: "https://example.org/missing", status: 404 },
  variants: [{ kind: "http", url: "http://example.org/page", status: 200, finalUrl: URL_, ends: true }],
  markdown: { url: "https://example.org/page.md", declared: false, status: 404, ok: false },
  aiCatalog: { url: "https://example.org/ai-catalog.json", status: 404, present: false, valid: null },
  indexnow: null,
};
const site = (over) => ({ site: { ...okSite, ...over } });
const imgs = (results) => ({ images: { total: results.length, checked: results.length, unchecked: 0, cap: 20, results } });
const trusted = '<footer><a href="/about">About</a> <a href="/contact">Contact</a> <a href="/privacy">Privacy</a> <a href="/terms">Terms</a></footer>';
const org = ld({ "@type": "Organization", name: "Example", logo: "https://example.org/l.png", sameAs: ["https://x.com/example"] });

const CASES = [
  ["image_dimensions_missing", [page({ body: '<img src="/a.png" alt="a">' })], [page({ body: '<img src="/a.png" alt="a" width="10" height="10">' })]],
  ["image_lcp_lazy", [page({ h1: '<h1>H</h1><img src="/hero.webp" alt="h" width="9" height="9" loading="lazy">' })], [page({ h1: '<h1>H</h1><img src="/hero.webp" alt="h" width="9" height="9">' })]],
  ["image_not_lazy", [page({ body: section("Later") + '<img src="/b.webp" alt="b" width="9" height="9">' })], [page({ body: section("Later") + '<img src="/b.webp" alt="b" width="9" height="9" loading="lazy">' })]],
  ["image_legacy_format", [page({ body: '<img src="/a.jpg" alt="a" width="9" height="9">' })], [page({ body: '<picture><source type="image/avif" srcset="/a.avif"><img src="/a.jpg" alt="a" width="9" height="9"></picture>' })]],
  ["image_oversized", [page({ body: '<img src="/a.webp" alt="a" width="9" height="9">' }), imgs([{ index: 0, url: "https://example.org/a.webp", status: 200, bytes: 400_000, type: "image/webp" }])], [page({ body: '<img src="/a.webp" alt="a" width="9" height="9">' }), imgs([{ index: 0, url: "https://example.org/a.webp", status: 200, bytes: 40_000, type: "image/webp" }])]],
  ["image_no_srcset", [page({ body: '<img src="/a.webp" alt="a" width="1200" height="600">' })], [page({ body: '<img src="/a.webp" alt="a" width="1200" height="600" srcset="/a-600.webp 600w, /a.webp 1200w">' })]],
  ["rich_result_retired", [page({ head: ld({ "@type": "HowTo", name: "x", step: [] }) })], [page()]],
  ["rich_result_retired", [page({ head: ld({ "@type": "WebSite", name: "E", url: "https://example.org/", potentialAction: { "@type": "SearchAction", target: "https://example.org/?q={q}" } }) })], [page({ head: ld({ "@type": "WebSite", name: "E", url: "https://example.org/" }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "Event", name: "Launch", startDate: "2026-11-01", location: { "@type": "Place", name: "Hall" } }) })], [page({ head: ld({ "@type": "Event", name: "Launch", startDate: "2026-11-01", location: { "@type": "Place", name: "Hall", address: "Kyiv" } }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "JobPosting", title: "Editor", datePosted: "2026-10-01", description: "x" }) })], [page({ head: ld({ "@type": "JobPosting", title: "Editor", datePosted: "2026-10-01", description: "x", hiringOrganization: { "@type": "Organization", name: "E" } }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "VideoObject", name: "Demo", thumbnailUrl: "https://example.org/t.jpg" }) })], [page({ head: ld({ "@type": "VideoObject", name: "Demo", thumbnailUrl: "https://example.org/t.jpg", uploadDate: "2026-01-01" }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "QAPage", mainEntity: { "@type": "Question", name: "Q?", answerCount: 1 } }) })], [page({ head: ld({ "@type": "QAPage", mainEntity: { "@type": "Question", name: "Q?", answerCount: 1, acceptedAnswer: { "@type": "Answer", text: "A" } } }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "AggregateRating", ratingValue: "4.5", ratingCount: "10" }) })], [page({ head: ld({ "@type": "Product", name: "P", aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", ratingCount: "10" } }) })]],
  ["schema_required_missing", [page({ head: ld({ "@type": "LocalBusiness", name: "Cafe" }) })], [page({ head: ld({ "@type": "LocalBusiness", name: "Cafe", address: "Lviv" }) })]],
  ["snippet_blocked", [page({ head: '<meta name="robots" content="max-snippet:0">' })], [page({ head: '<meta name="robots" content="max-snippet:-1">' })]],
  ["snippet_blocked", [page({ body: `<div data-nosnippet>${section("All", null, 12)}</div>` })], [page({ body: `<div data-nosnippet><p>Price note.</p></div>${section("All", null, 12)}` })]],
  ["favicon_missing", [page(), site({ favicon: { url: "https://example.org/favicon.ico", declared: false, status: 404, ok: false } })], [page(), site({})]],
  ["mixed_content", [page({ body: '<img src="http://cdn.example.org/a.webp" alt="a" width="9" height="9">' })], [page({ body: '<img src="https://cdn.example.org/a.webp" alt="a" width="9" height="9">' })]],
  ["soft_404", [page(), site({ soft404: { url: "https://example.org/missing", status: 200, finalUrl: "https://example.org/missing" } })], [page(), site({})]],
  ["url_variants_inconsistent", [page(), site({ variants: [{ kind: "www", url: "https://www.example.org/page", status: 200, finalUrl: "https://www.example.org/page", ends: false }] })], [page(), site({})]],
  ["hsts_missing", [page(), { fetch: { saved: false, hsts: null } }], [page(), { fetch: { saved: false, hsts: "max-age=31536000" } }]],
  ["markdown_alternate_broken", [page(), site({ markdown: { url: "https://example.org/page.md", declared: true, status: 404, ok: false } })], [page(), site({ markdown: { url: "https://example.org/page.md", declared: true, status: 200, ok: true } })]],
  ["ai_catalog_invalid", [page(), site({ aiCatalog: { url: "https://example.org/.well-known/ai-catalog.json", status: 200, present: true, valid: false } })], [page(), site({ aiCatalog: { url: "https://example.org/.well-known/ai-catalog.json", status: 200, present: true, valid: true } })]],
  ["indexnow_key_broken", [page(), site({ indexnow: { key: "abcdef123456", url: "https://example.org/abcdef123456.txt", status: 404, ok: false } })], [page(), site({ indexnow: { key: "abcdef123456", url: "https://example.org/abcdef123456.txt", status: 200, ok: true } })]],
  ["author_missing", [page({ head: ld({ "@type": "Article", headline: "H" }) })], [page({ head: ld({ "@type": "Article", headline: "H", author: { "@type": "Person", name: "A" } }) })]],
  ["about_contact_missing", [page()], [page({ body: trusted })]],
  ["privacy_terms_missing", [page()], [page({ body: trusted })]],
  ["organization_details_missing", [page()], [page({ head: org })]],
  ["organization_details_missing", [page({ head: ld({ "@type": "Organization", name: "Example" }) })], [page({ head: org })]],
  ["article_date_missing", [page({ head: ld({ "@type": "Article", headline: "H", datePublished: "2026-10-01" }) })], [page({ head: ld({ "@type": "Article", headline: "H", datePublished: "2026-10-01" }), body: "<p>Published 1 October 2026.</p>" })]],
  ["date_mismatch", [page({ head: ld({ "@type": "Article", headline: "H", datePublished: "2026-10-01" }), body: "<p>Published 3 October 2026.</p>" })], [page({ head: ld({ "@type": "Article", headline: "H", datePublished: "2026-10-01" }), body: '<p>Published <time datetime="2026-10-01">1 Oct</time>.</p>' })]],
  ["site_name_missing", [page(), {}, { url: "https://example.org/" }], [page({ head: ld({ "@type": "WebSite", name: "Example", url: "https://example.org/" }) }), {}, { url: "https://example.org/" }]],
  ["spa_shell", [page({ omit: ["h1"], body: '<div id="root"></div><script src="/app.js"></script>' }).replace(/<p>An opening[^<]*<\/p>/, ""), { shell: { detected: true, roots: ["#root"], words: 8, scripts: 1 } }], [page()]],
];

for (const [code, withIt, without] of CASES) {
  test(`${code}: raised with the error, not without it`, async () => {
    const yes = await codesOf(withIt[0], withIt[1] || {}, withIt[2] || {});
    assert.ok(yes.includes(code), `expected ${code} in ${yes.join(", ")}`);
    const no = await codesOf(without[0], without[1] || {}, without[2] || {});
    assert.ok(!no.includes(code), `did not expect ${code} in ${no.join(", ")}`);
  });
}

test("retired rich results carry the date of the Google entry; FAQPage keeps its own code", async () => {
  assert.equal(RETIRED.HowTo.date, "2023-09-14");
  const f = await findingOf(page({ head: ld({ "@type": "Course", name: "C" }) }), "rich_result_retired");
  assert.deepEqual(f.evidence.items.map((x) => [x.type, x.date]), [["Course", "2025-09-09"]]);
  assert.equal(f.informational, true);
  assert.ok(!(await codesOf(page({ head: ld({ "@type": "HowTo", name: "x" }) }))).includes("schema_required_missing"), "a retired type is not held to its old required fields");
});

test("dates written in three languages and as ISO", () => {
  assert.deepEqual(datesIn("on 2026-10-17, 17.10.2026, 17 Oct 2026, October 17, 2026, 17 жовтня 2026 and 17 de octubre de 2026").sort(), ["2026-10-17"]);
});

test("the image HEAD is capped at 20 and counts the rest; data: images are never fetched", async () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ index: i, url: `https://example.org/i${i}.webp` })).concat([{ index: 25, url: null }]);
  const r = await withFetch({}, () => checkImages(many));
  assert.equal(r.checked, 20);
  assert.equal(r.unchecked, 5);
});

test("the site requests: one each, the variants capped at 3, nothing off the site", async () => {
  const extras = { icons: [], markdown: [], indexnow: ["abcdef123456"] };
  const calls = await withFetch({ "https://example.org/favicon.ico": { headers: { "content-type": "image/x-icon" }, body: "i" }, "https://example.org/page.md": { headers: { "content-type": "text/markdown" }, body: "# Page" } }, async (c) => {
    const s = await checkSite(URL_, extras, { now: 1 });
    assert.equal(s.favicon.ok, true);
    assert.equal(s.soft404.url, improbablePath(URL_, 1));
    assert.equal(s.soft404.status, 404);
    assert.equal(s.variants.length, 3);
    assert.equal(s.markdown.ok, true);
    assert.equal(s.aiCatalog.present, false);
    assert.equal(s.indexnow.ok, false);
    return c;
  });
  assert.ok(calls.every((x) => /^https?:\/\/(?:www\.)?example\.org\//.test(x.url)), calls.map((x) => x.url).join(", "));
  assert.ok(calls.length <= 9);
});

test("an app shell with no browser: the report says the render was not done", async () => {
  const r = await readingOf(page());
  r.shell = { detected: true, roots: ["#root"], words: 8, scripts: 3 };
  r.render = { ok: false, reason: "no_browser", auto: true };
  const m = buildModel(r);
  assert.ok(m.findings.some((f) => f.code === "spa_shell" && f.hides));
  assert.ok(m.caps.some((c) => c.id === "render_none" && /no Chrome or Chromium/.test(c.t[0])));
});

test("the checklist has the new cells, and the robots strip the Markdown copy and ai-catalog.json", async () => {
  const m = buildModel(await readingOf(page(), site({})));
  for (const id of ["images", "snippet", "favicon", "site_name", "mixed", "soft404", "variants", "hsts", "trust"]) assert.ok(m.checklist.some((c) => c.id === id), id);
  assert.ok(m.robots.some((r) => r.id === "markdown") && m.robots.some((r) => r.id === "ai_catalog"));
  assert.ok(m.head.some((r) => r.id === "favicon"));
});
