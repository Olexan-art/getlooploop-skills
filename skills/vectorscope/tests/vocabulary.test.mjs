// The page vocabulary in two tiers: the phrases a page owns, then its narrative words.
// The same cases the product's own tests pin, so the port cannot drift from it quietly.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  contentRuns,
  GENERIC_WORDS,
  pageKeywords,
  pageVocabulary,
  stripMarkup,
  withoutOverlap,
  withoutRepeatedSentences,
} from "../scripts/lib/vocabulary.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const terms = (rows) => rows.map((row) => row.term);
const one = (texts) => pageVocabulary(texts, texts.map((_, i) => i), texts.length);

// ── phrases ──────────────────────────────────────────────────────────────────

test("a phrase of three words is found, and counted in the passages it reaches", () => {
  const { phrases } = one(["A large language model predicts text.", "Every large language model is trained.", "Training data feeds the model."]);
  const llm = phrases.find((row) => row.term === "large language model");
  assert.ok(llm, terms(phrases).join(", "));
  assert.equal(llm.count, 2);
  assert.equal(llm.passages, 2);
  assert.equal(llm.words, 3);
});

test("a phrase never crosses a stopword, a punctuation mark or a number", () => {
  const { phrases } = one([
    "Signature of the document. Signature, document. Signature 2 document.",
    "Signature of the document again. Signature, document once more. Signature 3 document.",
  ]);
  assert.ok(!terms(phrases).includes("signature document"), terms(phrases).join(", "));
});

test("twice in two passages is a phrase; twice in one passage is not; three times in one is", () => {
  assert.ok(terms(one(["The query log grows.", "Read the query log."]).phrases).includes("query log"));
  assert.ok(!terms(one(["The query log grows. Read the query log."]).phrases).includes("query log"));
  assert.ok(terms(one(["The query log grows. Read the query log. Trim the query log."]).phrases).includes("query log"));
});

test("a frequent word beside a rare one is not a phrase", () => {
  const { phrases } = one([
    "The document is signed. Send the document. Share the document. Archive the document.",
    "A document template. A document field. A document link. The document history.",
    "Store the document. Find the document. A document template again.",
  ]);
  for (const pair of ["document field", "document link", "document history"]) assert.ok(!terms(phrases).includes(pair), pair);
});

test("a phrase may not begin or end on a generic word", () => {
  const { phrases } = one(["See also the archive. Whether archive matters.", "See also it. Whether archive."]);
  assert.ok(!terms(phrases).some((term) => term.startsWith("see ") || term.startsWith("whether ")));
  assert.ok(GENERIC_WORDS.has("see") && GENERIC_WORDS.has("whether"));
});

// ── subsumption ─────────────────────────────────────────────────────────────

test("a shorter phrase the longer one always holds is dropped", () => {
  const { phrases } = one(["A semantic chunking visualizer for any page.", "The semantic chunking visualizer reads it.", "Open the semantic chunking visualizer."]);
  assert.deepEqual(terms(phrases), ["semantic chunking visualizer"]);
});

test("a shorter phrase used far more on its own stays beside the longer one", () => {
  const { phrases } = one([
    "An ai slop checker. Ai slop spreads.",
    "The ai slop checker marks ai slop.",
    "Ai slop is everywhere. Ai slop again.",
    "Run the ai slop checker on ai slop.",
  ]);
  const list = terms(phrases);
  assert.ok(list.includes("ai slop checker") && list.includes("ai slop"), list.join(", "));
  assert.ok(list.indexOf("ai slop") < list.indexOf("ai slop checker"), "more passages first");
});

test("a window of a longer repeated run is not listed on its own", () => {
  const list = terms(one(["Ask an ai assistant across real life contexts.", "We asked an ai assistant across real life contexts twice."]).phrases);
  assert.ok(!list.includes("assistant across real") && !list.includes("ai assistant across real"), list.join(", "));
  assert.ok(list.includes("real life contexts"), list.join(", "));
});

test("phrases rank by passages, then count, then length", () => {
  const { phrases } = one(["fixed window here. retrieval system there. retrieval system again.", "fixed window here too. retrieval system also.", "fixed window once more."]);
  assert.deepEqual(terms(phrases), ["fixed window", "retrieval system"]);
});

// ── narrative ───────────────────────────────────────────────────────────────

test("a narrative word is not a word the phrases already spent", () => {
  const { phrases, narrative } = one(["The audit trail is written. The audit trail is kept.", "Read the audit trail whenever you need it."]);
  assert.ok(terms(phrases).includes("audit trail"));
  assert.ok(!terms(narrative).includes("trail") && !terms(narrative).includes("audit"));
});

test("a word far more frequent on its own stays in the narrative", () => {
  const { narrative } = one(["A language model predicts. The model is big. The model is slow. A model, a model.", "Every language model is a model. Model after model."]);
  const model = narrative.find((row) => row.term === "model");
  assert.ok(model, terms(narrative).join(", "));
  assert.equal(model.count, 7, "counted only where the phrase did not spend it");
});

test("reporting verbs and connectives are not narrative", () => {
  const { narrative } = one([
    "See whether the cache works. See whether it reads. Say it again. Example, example.",
    "See whether it says so. Read it, read it. Cache, cache.",
  ]);
  assert.deepEqual(terms(narrative), ["cache"]);
});

// ── the text that is read ────────────────────────────────────────────────────

test("markup residue is removed by its shape", () => {
  const text = stripMarkup("History [ edit ] The model {\\displaystyle f(E(y))} and \\frac{a}{b} [15] [citation needed] grows.");
  assert.doesNotMatch(text, /edit|displaystyle|frac|citation|15/);
  assert.match(text, /History/);
  assert.match(text, /grows/);
  assert.match(stripMarkup("[this bracket holds a real sentence of the page]"), /real sentence/);
});

test("the chunker's overlap is counted once", () => {
  const carry = "The overlap carries a sentence about the vector space and its retrieval system.";
  const first = `Opening words of the first window. ${carry}`;
  const second = `${carry} Then the second window goes on.`;
  assert.equal(withoutOverlap([first, second])[1].trim(), "Then the second window goes on.");
  assert.ok(!terms(one([first, second]).phrases).includes("vector space"), "one sighting, not two passages");
});

test("a sentence the page repeats verbatim is one statement", () => {
  const [, second] = withoutRepeatedSentences(["Patternscope marks phrases. It reads.", "patternscope marks  phrases. New."]);
  assert.equal(second.trim(), "New.");
  assert.deepEqual(terms(one(["Patternscope marks phrases.", "Patternscope marks phrases."]).phrases), []);
});

test("apostrophes are read as the language writes them", () => {
  assert.deepEqual(contentRuns("п’ять питань і п'ять відповідей", null), [["п’ять", "питань"], ["п’ять", "відповідей"]]);
  assert.deepEqual(contentRuns("the page's cache", null), [["page", "cache"]]);
});

test("a phrase is shown the way the page writes it", () => {
  const { phrases } = pageVocabulary(["Las frases hechas cansan.", "Evita las frases hechas.", "Una frase basta."], [0, 1, 2], 3, "es");
  assert.ok(terms(phrases).includes("frases hechas"), terms(phrases).join(", "));
});

test("the same page yields the same two lists twice", () => {
  const texts = ["alpha beta gamma. alpha beta.", "gamma delta. alpha beta gamma."];
  assert.deepEqual(pageVocabulary(texts, [0, 1], 2), pageVocabulary(texts, [0, 1], 2));
});

test("the flat list is phrases first", () => {
  const rows = pageKeywords(["The audit trail grows. Audit trail. Logs, logs, logs.", "The audit trail. Logs, logs."], [0, 1], 2);
  assert.equal(rows[0].term, "audit trail");
  assert.equal(rows[1].term, "logs");
});

// ── fixture ─────────────────────────────────────────────────────────────────

test("Wikipedia's LLM article: its phrases lead, and its furniture is gone", () => {
  const { passages } = JSON.parse(readFileSync(join(here, "fixtures", "wikipedia-llm.passages.json"), "utf8"));
  const ids = new Map();
  const assignment = passages.map((p) => {
    const key = p.heading || "";
    if (!ids.has(key)) ids.set(key, ids.size);
    return ids.get(key);
  });
  const { phrases, narrative } = pageVocabulary(passages.map((p) => p.text), assignment, ids.size);
  assert.equal(phrases.length, 15);
  for (const phrase of ["language model", "large language model", "neural network", "fine tuned"]) assert.ok(terms(phrases).includes(phrase), phrase);
  for (const noise of ["edit", "displaystyle", "example", "based"]) assert.ok(!terms(narrative).includes(noise), noise);
  assert.ok(terms(narrative).includes("llm"));
  assert.ok(phrases.every((row) => row.words >= 2 && row.passages >= 2));
});
