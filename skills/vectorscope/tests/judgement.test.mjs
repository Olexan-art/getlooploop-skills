import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGrouping, validateTopics, validateFacts, validatePlan, validateQueries, queryWinner, quoteIn } from "../scripts/lib/judgement.mjs";

const pages = [{ n: 1, passages: [{ text: "Intro to caching." }, { text: "The max-age directive sets freshness in seconds." }, { text: "ETag lets a client revalidate." }] }];

test("groups: the v1 shape still works", () => {
  const g = validateGrouping({ groups: [[0], [1, 2]] }, 3);
  assert.deepEqual(g.groups, [[0], [1, 2]]);
  assert.deepEqual(g.meta[0], { label: null, note: null, topic: null });
});

test("groups: the v2 shape carries label and note, and renumbers", () => {
  const g = validateGrouping({ groups: [{ members: [2, 1], label: "Validation", note: "how a cache checks" }, [0]] }, 3);
  assert.deepEqual(g.groups, [[0], [1, 2]]);
  assert.equal(g.meta[1].label, "Validation");
  assert.equal(g.reordered, true);
});

test("groups: refusals", () => {
  assert.throws(() => validateGrouping({ groups: [[0, 1]] }, 3), /in no group/);
  assert.throws(() => validateGrouping({ groups: [[0, 1], [1, 2]] }, 3), /exactly one group/);
  assert.throws(() => validateGrouping({ groups: [{ members: [0, 1, 2], label: "x".repeat(81) }] }, 3), /label/);
  assert.throws(() => validateGrouping({ groups: [{ members: [0, 1, 2] }] }, 3, { requireTopics: true }), /topic/);
  assert.throws(() => validateGrouping({ groups: [[0], [1], [2]], duplicates: { 1: 0 } }, 3), /adjacent/);
});

test("topics: slugs, unique", () => {
  assert.equal(validateTopics({ topics: [{ id: "fresh", name: "Freshness" }] }).length, 1);
  assert.throws(() => validateTopics({ topics: [{ id: "Bad Id", name: "x" }] }), /slug/);
  assert.throws(() => validateTopics({ topics: [{ id: "a", name: "x" }, { id: "a", name: "y" }] }), /twice/);
});

test("facts: located on pages, with the single-mode shorthand", () => {
  const facts = validateFacts({ facts: [{ id: "f1", fact: "max-age is in seconds", passages: [1] }] }, pages);
  assert.deepEqual(facts[0].pages, { 1: [1] });
  assert.throws(() => validateFacts({ facts: [{ id: "f1", fact: "x", pages: { 2: [0] } }] }, pages), /not in this run/);
});

test("plan: before must be verbatim, codes must exist", () => {
  const ok = validatePlan(
    {
      items: [
        { priority: 2, passages: [1], check: "thin_section", problem: "p", fix: "f", before: "The max-age  directive sets freshness", after: "In HTTP caching, max-age …" },
        { priority: 1, passages: [], problem: "p", fix: "f" },
      ],
    },
    pages,
    new Map([[1, new Set(["thin_section"])]])
  );
  assert.equal(ok.items[0].priority, 1);
  assert.equal(ok.warnings.length, 0);
  assert.throws(() => validatePlan({ items: [{ priority: 1, passages: [1], problem: "p", fix: "f", before: "not in the text", after: "x" }] }, pages), /verbatim/);
  assert.throws(() => validatePlan({ items: [{ priority: 1, passages: [1], check: "made_up", problem: "p", fix: "f" }] }, pages), /check code/);
  assert.equal(validatePlan({ items: [{ priority: 1, passages: [1], check: "thin_section", problem: "p", fix: "f" }] }, pages).warnings.length, 1);
});

test("queries: the quote must come from the passage; missing is never citable", () => {
  const q = validateQueries({ queries: [{ query: "what is max-age", source: "generated", result: { passage: 1, verdict: "complete", citable: true, quote: "max-age directive sets freshness in seconds" } }] }, pages);
  assert.equal(q.queries[0].results[1].verdict, "complete");
  assert.equal(q.warnings.length, 1, "fewer than five queries warns");
  assert.throws(() => validateQueries({ queries: [{ query: "q", source: "generated", result: { passage: 2, verdict: "partial", citable: false, quote: "max-age" } }] }, pages), /verbatim/);
  assert.throws(() => validateQueries({ queries: [{ query: "q", source: "generated", result: { passage: null, verdict: "missing", citable: true } }] }, pages), /citable/);
  assert.throws(() => validateQueries({ queries: [{ query: "q", source: "me", result: { passage: null, verdict: "missing", citable: false } }] }, pages), /source/);
});

test("winner: verdict first, then citable; ties are reported", () => {
  const q = { results: { 1: { verdict: "complete", citable: false }, 2: { verdict: "complete", citable: true }, 3: { verdict: "partial", citable: true } } };
  assert.deepEqual(queryWinner(q), { winners: [2], tie: false });
  assert.deepEqual(queryWinner({ results: { 1: { verdict: "missing", citable: false }, 2: { verdict: "missing", citable: false } } }).winners, []);
  assert.equal(queryWinner({ results: { 1: { verdict: "partial", citable: true }, 2: { verdict: "partial", citable: true } } }).tie, true);
});

test("quote folding: whitespace, quotes, dashes, case", () => {
  assert.ok(quoteIn("“Hello” — World", '"hello"   - world'));
});
