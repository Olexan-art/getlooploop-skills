import { test } from "node:test";
import assert from "node:assert/strict";
import { runChecks, shortLineRuns, withoutOverlap, THIN_SECTION_CHARS } from "../scripts/lib/checks.mjs";
import { reading, filler } from "./helpers.mjs";
import { CHECK_COPY } from "../scripts/lib/i18n.mjs";

const codes = (findings) => findings.map((f) => f.code);
const find = (findings, code) => findings.find((f) => f.code === code);
const withLayout = (r) => {
  r.layout = { shortLineRuns: shortLineRuns(r.passages.map((p) => p.text).join("\n"), r.passages) };
  return r;
};

test("lost_faq_questions: answers without question marks", () => {
  const faq = "Yes. The export is plain JSON. No, nothing is sent anywhere. Yes, it works offline. No. Only one URL per run.";
  const f = find(runChecks(reading(["Intro text for the page.", faq])), "lost_faq_questions");
  assert.ok(f, "fires");
  assert.deepEqual(f.passages, [1]);
  assert.equal(f.severity, "high");
  // The report sentence reads the totals: no "undefined" in any language.
  assert.equal(f.evidence.answers, 4);
  for (const lang of ["en", "uk", "pl"]) assert.ok(!CHECK_COPY.lost_faq_questions.what[lang](f.evidence).includes("undefined"), lang);
});

test("lost_faq_questions: quiet when the questions are kept", () => {
  const faq = "Is it JSON? Yes. The export is plain JSON. Is anything sent? No, nothing. Does it work offline? Yes, it does.";
  assert.ok(!codes(runChecks(reading(["Intro.", faq]))).includes("lost_faq_questions"));
});

test("dominant_heading: one heading over 30% of the text", () => {
  const big = filler(40);
  const small = filler(3);
  const r = reading(["Test page intro", big, big, small, small], { headings: ["Test page", "Everything", "Everything", "Small A", "Small B"] });
  const f = find(runChecks(r), "dominant_heading");
  assert.ok(f);
  assert.equal(f.evidence.heading, "Everything");
  assert.ok(f.evidence.share > 0.3);
  assert.deepEqual(f.passages, [1, 2]);
});

test("dominant_heading: quiet on a balanced page", () => {
  const part = filler(10);
  const r = reading(["Test page intro", part, part, part, part], { headings: ["Test page", "A", "B", "C", "D"] });
  assert.ok(!codes(runChecks(r)).includes("dominant_heading"));
});

test("mid_sentence_start: lowercase or punctuation opening", () => {
  const f = find(runChecks(reading(["Intro sentence.", "the window cut this one.", ", and this one too.", "This one is fine."])), "mid_sentence_start");
  assert.deepEqual(f.passages, [1, 2]);
});

test("nav_in_content: a run of short lines inside a passage", () => {
  const nav = "Home\nPricing\nAbout us\nBlog\nContact";
  const r = withLayout(reading(["Intro sentence.", `Real paragraph text here.\n${nav}\nMore text follows here.`]));
  const f = find(runChecks(r), "nav_in_content");
  assert.ok(f);
  assert.deepEqual(f.passages, [1]);
  assert.equal(f.evidence.samples[0].count, 5);
});

test("nav_in_content: three short lines are not a menu", () => {
  const r = withLayout(reading(["Intro.", "Text here.\nOne\nTwo\nThree\nA much longer line that is a sentence."]));
  assert.ok(!codes(runChecks(r)).includes("nav_in_content"));
});

test("thin_section: a heading with little under it", () => {
  const r = reading(["Test page intro", "Too short to answer.", filler(10)], { headings: ["Test page", "Thin", "Fine"] });
  const f = find(runChecks(r), "thin_section");
  assert.deepEqual(f.passages, [1]);
  assert.ok(f.evidence.samples[0].chars < THIN_SECTION_CHARS);
});

test("truncated_teaser: lines ending in an ellipsis", () => {
  const r = reading(["Intro.", "Read how we rebuilt the pipeline and what…\nOur next story covers the...\nA full sentence."]);
  assert.equal(find(runChecks(r), "truncated_teaser").evidence.count, 2);
});

test("truncated_teaser: code samples eliding themselves are not teasers", () => {
  const r = reading(["Intro.", "Example response:\n<!doctype html>...\nbody { ...\nA full sentence."]);
  assert.ok(!codes(runChecks(r)).includes("truncated_teaser"));
});

test("thin_section: a short see-also list is side-path, not thin", () => {
  const r = reading(["Test page intro", "Link one / Link two", filler(10)], { headings: ["Test page", "See also", "Fine"] });
  r.passages[1].contentRole = "related";
  assert.ok(!codes(runChecks(r)).includes("thin_section"));
});

test("repeated_claim: the same phrase in most groups", () => {
  const claim = "Our editor saves hours every single week.";
  const r = reading(["Intro.", `Alpha section. ${claim}`, `Beta section. ${claim}`, `Gamma section. ${claim}`, "Delta section alone."]);
  const f = find(runChecks(r, [0, 1, 2, 3, 3], 4), "repeated_claim");
  assert.ok(f);
  assert.ok(f.evidence.samples.some((s) => s.phrase.includes("editor saves hours")));
});

test("repeated_claim: header names and code samples are vocabulary, not claims", () => {
  const sample = "HTTP/1.1 200 OK Content-Type: text/html Cache-Control: max-age=604800 ETag: \"33a64df5\" Last-Modified: Tue, 22 Feb 2022";
  const r = reading(["Intro.", `Alpha. ${sample}`, `Beta. ${sample}`, `Gamma. ${sample}`]);
  assert.ok(!codes(runChecks(r, [0, 1, 2, 3], 4)).includes("repeated_claim"));
});

test("repeated_claim: the chunker's overlap is not repetition", () => {
  const a = filler(30, "alpha");
  const b = `${a.slice(-150)} ${filler(20, "beta")}`;
  assert.ok(withoutOverlap(a, b).length < b.length);
  const r = reading(["Intro.", a, b, filler(20, "gamma")]);
  assert.ok(!codes(runChecks(r, [0, 1, 2, 3], 4)).includes("repeated_claim"));
});

test("technical: missing canonical and description, no JSON-LD", () => {
  const technical = { jsonLd: { blocks: 0, invalid: 0, types: [] }, canonical: { present: false, count: 0, href: null, absolute: false, resolved: null, self: null }, metaDescription: { present: false, length: 0 } };
  const c = codes(runChecks(reading(["Intro."], { technical })));
  for (const code of ["jsonld_none", "canonical_missing", "meta_description_missing"]) assert.ok(c.includes(code), code);
});

test("technical: canonical to another page outranks a relative one", () => {
  const technical = { jsonLd: { blocks: 1, invalid: 1, types: [] }, canonical: { present: true, count: 1, href: "/other", absolute: false, resolved: "https://example.org/other", self: false }, metaDescription: { present: true, length: 200 } };
  const c = codes(runChecks(reading(["Intro."], { technical })));
  assert.ok(c.indexOf("canonical_other") < c.indexOf("canonical_relative"));
  assert.ok(c.includes("jsonld_invalid") && c.includes("meta_description_long"));
});

test("robots: answering bots blocked rank first, training bots low", () => {
  const robots = {
    status: "ok",
    bots: [
      { token: "OAI-SearchBot", kind: "search", allowed: false, rule: "Disallow: /" },
      { token: "GPTBot", kind: "training", allowed: false, rule: "Disallow: /" },
      { token: "Bingbot", kind: "index", allowed: true, rule: null },
    ],
  };
  const findings = runChecks(reading(["Intro.", "the cut one."], { robots }));
  assert.equal(findings[0].code, "ai_search_blocked");
  assert.deepEqual(findings[0].evidence.bots, ["OAI-SearchBot"]);
  assert.equal(find(findings, "ai_training_blocked").severity, "low");
});

test("robots: an unreachable robots.txt is a high finding", () => {
  const f = runChecks(reading(["Intro."], { robots: { status: "unreachable", url: "https://example.org/robots.txt", httpStatus: 503, bots: [] } }));
  assert.equal(f[0].code, "robots_unreachable");
});

test("js_dependent and cap_overflow", () => {
  const r = reading(["Intro.", "Body."], { render: { ok: true, wordCount: 900, passages: 6 }, page: { wordCount: 200, capReached: true, charsUnread: 5000 } });
  const c = codes(runChecks(r));
  assert.ok(c.includes("js_dependent"));
  assert.ok(c.includes("cap_overflow"));
});

test("header_noindex: X-Robots-Tag noindex is high, and 'none' counts too", () => {
  const r = reading(["Intro."], { headers: { "x-robots-tag": "noindex" } });
  const f = find(runChecks(r), "header_noindex");
  assert.ok(f);
  assert.equal(f.severity, "high");
  assert.equal(f.evidence.value, "noindex");
  assert.ok(codes(runChecks(reading(["Intro."], { headers: { "x-robots-tag": "none" } }))).includes("header_noindex"));
});

test("header_noindex: quiet without the header or for an unrelated directive", () => {
  assert.ok(!codes(runChecks(reading(["Intro."]))).includes("header_noindex"));
  assert.ok(!codes(runChecks(reading(["Intro."], { headers: { "x-robots-tag": "noarchive" } }))).includes("header_noindex"));
});

test("cache_control_no_store fires, max-age does not", () => {
  assert.ok(codes(runChecks(reading(["Intro."], { headers: { "cache-control": "no-store" } }))).includes("cache_control_no_store"));
  assert.ok(!codes(runChecks(reading(["Intro."], { headers: { "cache-control": "max-age=3600, public" } }))).includes("cache_control_no_store"));
});

test("img_missing_alt and img_filename_alt count the right images", () => {
  const a = {
    images: { total: 4, missingAlt: 2, emptyAlt: 1, filenameAlt: 1, samples: [{ text: "/a.png", reason: "missing" }, { text: "/b.jpg", reason: "missing" }, { text: "photo_1.jpg", reason: "filename" }] },
    headings: { total: 3, h1Count: 1, skippedCount: 0, skipped: [], firstLevel: 1 },
  };
  const findings = runChecks(reading(["Intro."], { accessibility: a }));
  assert.equal(find(findings, "img_missing_alt").evidence.count, 2);
  assert.equal(find(findings, "img_filename_alt").evidence.count, 1);
});

test("heading_skip and multiple_h1", () => {
  const a = {
    images: { total: 0, missingAlt: 0, emptyAlt: 0, filenameAlt: 0, samples: [] },
    headings: { total: 4, h1Count: 2, skippedCount: 1, skipped: [{ from: 1, to: 3, text: "Skipped" }], firstLevel: 1 },
  };
  const findings = runChecks(reading(["Intro."], { accessibility: a }));
  assert.equal(find(findings, "heading_skip").evidence.count, 1);
  assert.equal(find(findings, "multiple_h1").evidence.count, 2);
});

test("header and accessibility checks are skipped for a saved page (no fields)", () => {
  const c = codes(runChecks(reading(["Intro."])));
  for (const code of ["header_noindex", "cache_control_no_store", "img_missing_alt", "img_filename_alt", "heading_skip", "multiple_h1"]) {
    assert.ok(!c.includes(code), code);
  }
});
