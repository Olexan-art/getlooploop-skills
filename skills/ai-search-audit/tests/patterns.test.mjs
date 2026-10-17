// Writing patterns: the four detector families, the language gate, the density score, and the
// findings they become, with their positions. Signals about worn writing, not an AI detector.
import { test } from "node:test";
import assert from "node:assert/strict";
import { analysePatterns, countWords, detectLanguage, detectRepetition, detectStock, detectUniformity, detectVagueness, normalizeText, scoreDocument, skeletonOf } from "../scripts/lib/patterns.mjs";
import { codesOf, findingOf, page } from "./helpers.mjs";

// Ten sentences of ten different shapes, so the filler itself never repeats a skeleton.
const PROSE = [
  "The editor saves every draft at 09:00.",
  "Thirty versions stay in the history for each file.",
  "Exports run as PDF or DOCX from the toolbar.",
  "Teams of up to 40 people share one workspace.",
  "Support answers by email within one working day.",
  "Signatures are stored with an audit trail since 2019.",
  "Billing happens monthly, and refunds take five days.",
  "Admins can lock templates so nobody edits them by accident.",
  "Mobile apps open the same documents offline.",
  "Single sign-on works with Okta and Azure AD.",
];
const FILLER = PROSE.join(" ") + " ";

test("normalisation is idempotent and leaves case and quotes alone", () => {
  const raw = "  It is  “quoted”​.\r\n\r\n\r\n\r\nNext   line.  ";
  const once = normalizeText(raw);
  assert.equal(once, "It is “quoted”.\n\nNext line.");
  assert.equal(normalizeText(once), once);
  assert.equal(countWords("Don't stop — 3 words-here"), 4);
});

test("stock phrases: matched at word boundaries, severity from how often the same phrase recurs", () => {
  const one = detectStock("When it comes to pricing, the plan is simple.", "en");
  assert.equal(one.length, 1);
  assert.equal(one[0].severity, "low");
  assert.equal(one[0].evidence, "When it comes to");
  const three = detectStock("When it comes to A. When it comes to B. When it comes to C.", "en");
  assert.ok(three.every((f) => f.severity === "high" && f.occurrences === 3));
  assert.equal(detectStock("whenever it comes together", "en").length, 0);
  assert.equal(detectStock("Варто зазначити, що план простий.", "uk").length, 1);
  assert.equal(detectStock("Cabe destacar que el plan es simple.", "es").length, 1);
});

test("repeated sentence shapes: one skeleton, articles folded, content words replaced", () => {
  assert.equal(skeletonOf("Our approach delivers a comprehensive solution.", "en"), skeletonOf("Our team delivers an individual approach.", "en"));
  const f = detectRepetition("Our approach delivers a comprehensive solution. Our team delivers an individual approach. It rains.", "en");
  assert.equal(f.length, 2);
  assert.equal(f[0].occurrences, 2);
  assert.equal(detectRepetition("Short one. Short two.", "en").length, 0, "skeletons under four tokens match everything and are skipped");
});

test("uniform openings: three or more consecutive sentences, one finding per run", () => {
  const f = detectUniformity("We deliver quality. We deliver speed. We deliver results. Then it ends.", "en");
  assert.equal(f.length, 1);
  assert.equal(f[0].occurrences, 3);
  assert.equal(f[0].severity, "medium");
  assert.equal(detectUniformity("We deliver quality. We deliver speed. Then it ends.", "en").length, 0);
  assert.equal(detectUniformity("Ofrecemos calidad. Ofrecemos rapidez. Ofrecemos resultados.", "es").length, 1, "pro-drop: one content word is the opening");
});

test("unchecked claims: an evaluative adjective on an abstract noun, unless the sentence has something to check", () => {
  assert.equal(detectVagueness("We offer a comprehensive solution for teams.", "en")[0].evidence, "comprehensive solution");
  assert.equal(detectVagueness("A comprehensive solution that cut review time from 9 days to 2.", "en").length, 0);
  assert.equal(detectVagueness("We offer a comprehensive, scalable solution for teams.", "en").length, 1, "one claim, one finding");
  assert.equal(detectVagueness("Ми пропонуємо комплексне рішення для команд.", "uk").length, 1);
});

test("the language gate: Ukrainian, English and Spanish are analysed; Russian and others are not", () => {
  assert.deepEqual(detectLanguage("Це сторінка про тарифи і плани для команд, які пишуть документи.").language, "uk");
  assert.equal(detectLanguage("This is the page about the plans and the prices of the editor.").language, "en");
  assert.equal(detectLanguage("Esta es la página de los planes y los precios para el equipo.").language, "es");
  // One Russian-only letter (written as an escape) settles it: refused, never analysed.
  assert.equal(detectLanguage("Ціни для команд і плани " + String.fromCharCode(0x44b)).ok, false);
  assert.equal(detectLanguage("Ceny planów dla zespołów są proste i jasne.").code, "unsupported_language");
});

test("the score: weighted findings per 1,000 words; under 60 words there is no score", () => {
  const f = detectStock("When it comes to it.", "en");
  assert.equal(scoreDocument(f, 40).band, "insufficient_text");
  const s = scoreDocument(f, 1000);
  assert.equal(s.perThousand, 1);
  assert.equal(s.value, 0);
  assert.equal(s.band, "low");
});

test("analysePatterns: each finding located by its section, passage and word", () => {
  const sections = [{ heading: "Plans", text: `${FILLER}When it comes to pricing, the plan is simple.` }];
  const passages = [{ index: 0, text: sections[0].text }];
  const r = analysePatterns(sections, passages);
  assert.equal(r.analysed, true);
  const f = r.findings.find((x) => x.family === "stock");
  assert.equal(f.passage, 0);
  assert.equal(f.heading, "Plans");
  assert.equal(f.word, countWords(FILLER) + 1);
});

test("the findings on a page: stock phrases medium at 2 per 1,000 words, the others low unless they recur", async () => {
  const body = `<h2>Plans</h2><p>${FILLER}When it comes to pricing, it is simple. Needless to say, it is fair.</p><h2>More</h2><p>${FILLER}</p>`;
  const f = await findingOf(page({ body }), "stock_phrases");
  assert.ok(f.evidence.per1k >= 2);
  assert.equal(f.severity, "medium");
  assert.equal(f.layer, "derived");
  assert.ok(f.zones.length >= 1, "placed on the map");
  assert.match(f.evidence.note, /not an AI detector/);
  const clean = await codesOf(page({ body: `<h2>Plans</h2><p>${FILLER}</p><h2>More</h2><p>${PROSE.slice(0, 5).map((x) => x.replace(".", " today.")).join(" ")}</p>` }));
  for (const c of ["stock_phrases", "repeated_sentence_shape", "uniform_openings", "unchecked_claims"]) assert.ok(!clean.includes(c), c);
  const shaped = await codesOf(page({ body: `<h2>Plans</h2><p>${FILLER}We deliver quality. We deliver speed. We deliver results. We offer a comprehensive solution for teams.</p><h2>More</h2><p>${FILLER}</p>` }));
  assert.ok(shaped.includes("uniform_openings"));
  assert.ok(shaped.includes("unchecked_claims"));
  assert.ok(shaped.includes("repeated_sentence_shape"), "the filler, written twice, repeats its shapes");
});
