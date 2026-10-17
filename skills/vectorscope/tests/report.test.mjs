import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJudgedLens, diffReadings, compareTopics, compareFacts } from "../scripts/lib/analysis.mjs";
import { validateGrouping } from "../scripts/lib/judgement.mjs";
import { renderHtml, renderCompareHtml, FOOTER_LINKS } from "../scripts/lib/html.mjs";
import { runChecks, CHECK_CODES } from "../scripts/lib/checks.mjs";
import { S, CHECK_COPY } from "../scripts/lib/i18n.mjs";
import { readTechnical } from "../scripts/lib/technical.mjs";
import { reading } from "./helpers.mjs";

const evil = '<img src=x onerror="alert(1)"><script>alert(2)</script>';

function lensOf(r, groups) {
  return buildJudgedLens(r, validateGrouping({ groups }, r.passages.length));
}

test("html: page and judgement text is escaped everywhere", () => {
  const r = reading([`Intro ${evil}`, `Body ${evil}`], { title: `Title ${evil}`, headings: [null, `Heading ${evil}`] });
  const html = renderHtml(r, lensOf(r, [{ members: [0, 1], label: `Label ${evil}`, note: evil }]), { checks: runChecks(r) });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;img src=x"));
});

test("html: no network, bilingual chrome, footer links", () => {
  const r = reading(["Intro text.", "Body text."]);
  const html = renderHtml(r, lensOf(r, [[0, 1]]));
  assert.match(html, /default-src 'none'/);
  assert.ok(!/<link[^>]+stylesheet/.test(html) && !/src="https?:/.test(html));
  assert.ok(html.includes('data-set-lang="uk"') && html.includes('class="l-uk"'));
  for (const link of FOOTER_LINKS) assert.ok(html.includes(`href="${link.href}" rel="noopener noreferrer" target="_blank"`), link.name);
});

test("i18n: every string and every check code has both languages", () => {
  for (const [key, entry] of Object.entries(S)) assert.ok(entry.en && entry.uk, key);
  for (const code of CHECK_CODES) {
    const copy = CHECK_COPY[code];
    assert.ok(copy, code);
    for (const part of ["title", "what", "tell"]) assert.ok(copy[part].en && copy[part].uk, `${code}.${part}`);
  }
});

test("technical: JSON-LD types through @graph, canonical, description", () => {
  const html = `<html><head><meta name="description" content="Short."><link rel="canonical" href="/page">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"FAQPage","mainEntity":[{"@type":"Question"}]},{"@type":["Product","Thing"]}]}</script>
    <script type="application/ld+json">{ not json</script></head><body></body></html>`;
  const t = readTechnical(html, "https://example.org/page/");
  assert.deepEqual(t.jsonLd.types, ["FAQPage", "Product", "Question", "Thing"]);
  assert.equal(t.jsonLd.invalid, 1);
  assert.equal(t.canonical.absolute, false);
  assert.equal(t.canonical.self, true);
  assert.equal(t.metaDescription.length, 6);
});

test("diff: same, changed, added, removed, and where groups came from", () => {
  const old = reading(["Intro.", "Kept text.", "Old body.", "Gone."], { headings: [null, "Keep", "Body", "Gone"] });
  const now = reading(["Intro.", "Kept text.", "New body, longer.", "Fresh."], { headings: [null, "Keep", "Body", "Fresh"] });
  const d = diffReadings(old, now, lensOf(old, [[0, 1], [2, 3]]), lensOf(now, [[0, 1], [2], [3]]));
  assert.deepEqual(d.counts, { same: 2, changed: 1, added: 1, removed: 1 });
  assert.deepEqual(d.groups.after[1].from, { 1: 1 });
});

test("compare: topic table, gaps, facts", () => {
  const a = reading(["Intro.", "Freshness.", "Validation."]);
  const b = reading(["Intro.", "Freshness only."]);
  const pages = [
    { n: 1, reading: a, lens: buildJudgedLens(a, validateGrouping({ groups: [{ members: [0, 1], topic: "fresh" }, { members: [2], topic: "valid" }] }, 3)), checks: [] },
    { n: 2, reading: b, lens: buildJudgedLens(b, validateGrouping({ groups: [{ members: [0, 1], topic: "fresh" }] }, 2)), checks: [] },
  ];
  const topics = [
    { id: "fresh", name: "Freshness" },
    { id: "valid", name: "Validation" },
  ];
  const cmp = compareTopics(pages, topics);
  assert.deepEqual(cmp.gaps, { 1: [], 2: ["valid"] });
  const facts = [
    { id: "f1", fact: "x", pages: { 1: [1], 2: [1] } },
    { id: "f2", fact: "y", pages: { 1: [2] } },
  ];
  const fc = compareFacts(pages, facts);
  assert.deepEqual(fc.unique, { 1: ["f2"], 2: [] });
  const html = renderCompareHtml({ pages, topics, topicCmp: cmp, facts, factCmp: fc, queries: null, plan: null });
  assert.ok(html.includes("Topics × pages") && html.includes("Теми × сторінки"));
});

test("info panel: the three claims, and the model named only when the agent said it", () => {
  const r = reading(["First passage about caching rules in full.", "Second passage about freshness and revalidation."]);
  const unstated = renderHtml(r, lensOf(r, [[0, 1]]));
  assert.ok(unstated.includes('class="info"'));
  for (const text of ["Same for everyone", "Your model's judgement", "Not any assistant's pipeline", "Однаково для всіх", "model not stated by the agent", "агент не вказав модель"]) {
    assert.ok(unstated.includes(text), text);
  }
  // The panel sits under the header, before the results.
  assert.ok(unstated.indexOf('class="info"') > unstated.indexOf("</header>"));
  assert.ok(unstated.indexOf('class="info"') < unstated.indexOf('id="h-result"'));

  const grouping = validateGrouping({ groups: [[0, 1]], agent: "Claude Code", model: "Claude Opus" }, 2);
  assert.deepEqual(grouping.judgement, { agent: "Claude Code", model: "Claude Opus" });
  const named = renderHtml(r, buildJudgedLens(r, grouping));
  assert.ok(named.includes("model: <b>Claude Opus</b> · agent: <b>Claude Code</b>"));
  assert.ok(!named.includes("model not stated by the agent"));
});

test("groups.json agent and model: optional, short plain strings", () => {
  assert.deepEqual(validateGrouping({ groups: [[0]] }, 1).judgement, { agent: null, model: null });
  assert.deepEqual(validateGrouping({ groups: [[0]], agent: "  Codex  " }, 1).judgement, { agent: "Codex", model: null });
  assert.throws(() => validateGrouping({ groups: [[0]], model: 5 }, 1), /"model" must be a string/);
  assert.throws(() => validateGrouping({ groups: [[0]], agent: "x".repeat(61) }, 1), /1–60 characters/);
  assert.throws(() => validateGrouping({ groups: [[0]], agent: "<b>x</b>" }, 1), /angle brackets/);
});

test("html: light by default whatever the system prefers; dark only from the toggle or #theme=dark", () => {
  const r = reading(["Intro text.", "Body text."]);
  const html = renderHtml(r, lensOf(r, [[0, 1]]));
  assert.ok(!html.includes("prefers-color-scheme: light"), "the system preference does not pick the theme");
  const root = /:root\{([^}]*)\}/.exec(html)[1];
  assert.match(root, /color-scheme:light/);
  assert.match(html, /:root\[data-theme="dark"\]\{[^}]*color-scheme:dark/);
  assert.ok(html.includes("theme=(light|dark)"), "#theme= still works");
  assert.ok(html.includes('data-set-theme="dark"') && html.includes('data-set-theme="light"'), "the toggle stays");
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /:focus-visible/);
});

test("html: severity and verdict pills carry a shape beside the word, not colour alone", () => {
  const r = reading([`Intro.`, `body starts lowercase and runs on.`], { headings: [null, "Second"] });
  const html = renderHtml(r, lensOf(r, [[0, 1]]), { checks: runChecks(r) });
  for (const m of html.matchAll(/<span class="pill (sev-\w+|good|bad|mid)">(.{0,20})/g)) assert.ok(m[2].startsWith('<svg class="sv"'), m[0]);
});
