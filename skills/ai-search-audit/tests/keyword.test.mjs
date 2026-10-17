// The keyword lens: the phrase read off the h1 (or given), its written variants, where it stands,
// how far it reaches across the h2 sections, the share of text without it, and a promise of a
// figure that states none (English only, and the report says when it did not run).
import { test } from "node:test";
import assert from "node:assert/strict";
import { countPhrase, keywordFromHeading, keywordVariants, promiseFailures, promiseRuleReads } from "../scripts/lib/keyword.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { codesOf, findingOf, page, readingOf } from "./helpers.mjs";

test("the keyword read off the h1: the site's signature, a year, a sales tail and the brand trimmed", () => {
  assert.equal(keywordFromHeading("Electronic Signature Solutions with SignNow", "https://www.signnow.com/x"), "Electronic Signature Solutions");
  assert.equal(keywordFromHeading("Form BCA-14 35 2026 | DocHub"), "Form BCA-14 35");
  assert.equal(keywordFromHeading("W-9 form: Fill out & sign online"), "W-9 form");
  assert.equal(keywordFromHeading("Semantic chunking, made visible: see how AI reads your page"), "Semantic chunking");
  assert.equal(keywordFromHeading("The best help desk software for small support teams today"), "best help desk software");
  assert.equal(keywordFromHeading(""), "");
});

test("phrases are counted whole, and variants swap one separator", () => {
  assert.equal(countPhrase("e-sign, E-Sign and e-signature", "e-sign"), 2);
  assert.deepEqual(keywordVariants("e-sign").slice(0, 3), ["e sign", "e.sign", "esign"]);
});

test("a promise of a figure with no figure; English only", () => {
  assert.equal(promiseFailures("A filing fee must accompany every application you submit.").length, 1);
  assert.equal(promiseFailures("A filing fee of $35 must accompany every application.").length, 0);
  assert.equal(promiseFailures("The cost of that error lands on the author of the page.").length, 0, "a cost that is not money");
  assert.equal(promiseFailures("How much does the subscription plan cost per month?").length, 0, "a question asks for the figure");
  assert.equal(promiseRuleReads("en-GB"), true);
  assert.equal(promiseRuleReads("uk"), false);
});

const sec = (h, text) => `<h2>${h}</h2><p>${text}</p>`;
const plain = (i) => `Section ${i} describes billing, exports and the team plan in some detail for the reader. It also covers limits and the support hours.`;

test("the findings: absent from title and h1, one section of many, most of the text off the phrase", async () => {
  const body = sec("What the help desk does", "The help desk software sorts every ticket by urgency, so the help desk team answers the oldest first.") + [1, 2, 3, 4].map((i) => sec(`Part ${i}`, plain(i))).join("");
  const html = page({ title: "Pricing and plans for support teams", h1: "<h1>Plans for every team</h1>", body });
  const codes = await codesOf(html, {}, {}, { keyword: "help desk" });
  assert.ok(codes.includes("keyword_not_in_title"));
  assert.ok(codes.includes("keyword_one_section"));
  assert.ok(codes.includes("off_keyword_share"));
  const one = await findingOf(html, "keyword_one_section", {}, {}, { keyword: "help desk" });
  assert.equal(one.evidence.source, "given");
  assert.ok(one.zones.length, "the section holding the phrase is marked on the map");
  // Spread across the page: none of the three.
  const spread = [1, 2, 3, 4].map((i) => sec(`Part ${i}`, `The help desk handles part ${i} of the work: ${plain(i)}`)).join("");
  const good = await codesOf(page({ title: "Help desk pricing for teams", h1: "<h1>Help desk plans</h1>", body: spread }), {}, {}, { keyword: "help desk" });
  for (const c of ["keyword_not_in_title", "keyword_one_section", "off_keyword_share"]) assert.ok(!good.includes(c), c);
});

test("a punctuation variant in the strongest fields splits the phrase", async () => {
  const html = page({ title: "Esign documents online for teams", h1: "<h1>Esign documents</h1>", body: sec("How", "You can e-sign any file, and e-sign it again later. A signed file is stored for ten years.") });
  const f = await findingOf(html, "keyword_variant_split", {}, {}, { keyword: "e-sign" });
  assert.equal(f.evidence.rival, "esign");
  assert.deepEqual(f.evidence.rivalFields, ["title", "h1"]);
});

test("the promise rule on a page, and the note when the page is not in English", async () => {
  const body = sec("Fees", "A filing fee must accompany every application you submit to the help desk.") + sec("More", "The help desk also answers questions about forms and help desk accounts.");
  assert.ok((await codesOf(page({ body }), {}, {}, { keyword: "help desk" })).includes("promise_without_number"));
  const uk = await readingOf(page({ lang: "uk", body }));
  const m = buildModel(uk, { keyword: "help desk" });
  assert.ok(!m.findings.some((f) => f.code === "promise_without_number"));
  assert.ok(m.caps.some((c) => c.id === "promise"));
});

test("no --keyword and no h1: the keyword is not checked, and the report says so", async () => {
  const m = buildModel(await readingOf(page({ omit: ["h1"] })));
  assert.ok(m.caps.some((c) => c.id === "keyword"));
  assert.ok(!m.findings.some((f) => f.area === "quote" && f.code.startsWith("keyword")));
});
