// Measured, derived, judgement (2.102): one metrics dictionary behind the HTML "?", the Markdown
// section and the export; the export's two sections beside the fields v1/v2 consumers read; the
// loss panels in every mode; and page text in the new panels escaped like everywhere else.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { METRICS, LAYERS, LAYER_COPY, metricsDictionary } from "../scripts/lib/metrics.mjs";
import { readPage } from "../scripts/lib/reading.mjs";
import { buildJudgedLens, diffReadings, pageChecks, compareTopics } from "../scripts/lib/analysis.mjs";
import { validateGrouping } from "../scripts/lib/judgement.mjs";
import { renderHtml, renderCompareHtml, renderRefusalHtml } from "../scripts/lib/html.mjs";
import { renderMarkdown, renderCompareMarkdown } from "../scripts/lens.mjs";
import { REMOVAL_REASONS } from "../scripts/lib/losses.mjs";
import { S } from "../scripts/lib/i18n.mjs";

const lensScript = fileURLToPath(new URL("../scripts/lens.mjs", import.meta.url));
const fixture = readFileSync(new URL("./fixtures/removals.html", import.meta.url), "utf8");
const evil = '<img src=x onerror="alert(1)">';

async function judged(html = fixture, url = "https://example.org/removals") {
  const reading = await readPage({ url, html, robots: "skip" });
  const lens = buildJudgedLens(reading, validateGrouping({ groups: [reading.passages.map((p) => p.index)] }, reading.passages.length));
  return { reading, lens, checks: pageChecks(reading, lens) };
}

test("metrics: every entry has a layer and EN and UK for each part", () => {
  for (const [id, m] of Object.entries(METRICS)) {
    assert.ok(LAYERS.includes(m.layer), `${id}: layer`);
    for (const part of ["label", "formula", "unit", "limits"]) assert.ok(m[part]?.en && m[part]?.uk, `${id}.${part}`);
    assert.ok(m.threshold === null || (m.threshold.en && m.threshold.uk), `${id}.threshold`);
  }
  for (const layer of LAYERS) assert.ok(LAYER_COPY[layer].label.en && LAYER_COPY[layer].label.uk && LAYER_COPY[layer].what.uk);
  for (const reason of REMOVAL_REASONS) assert.ok(S[`rs_${reason}`]?.en && S[`rs_${reason}`]?.uk, `copy for ${reason}`);
  const dict = metricsDictionary();
  assert.deepEqual(Object.keys(dict), Object.keys(METRICS));
  assert.deepEqual(Object.keys(dict.chars_past_cap), ["layer", "label", "formula", "unit", "threshold", "limits"]);
});

test("html: badges and a '?' for numbers, every '?' a known metric, both languages", async () => {
  const { reading, lens, checks } = await judged();
  const html = renderHtml(reading, lens, { checks });
  for (const layer of LAYERS) assert.ok(html.includes(`class="lyr ${layer}"`), layer);
  const ids = [...html.matchAll(/data-metric="([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 20);
  for (const id of ids) assert.ok(METRICS[id], id);
  for (const id of ["words", "passages", "slots", "chars_past_cap", "chars_unique", "chars_in_passages", "text_raw", "text_removed", "text_kept", "removal_chars", "section_reached", "group_share", "check_verdicts", "vocabulary"]) {
    assert.ok(ids.includes(id), `a "?" for ${id}`);
  }
  assert.ok(html.includes(METRICS.chars_past_cap.formula.uk.slice(0, 40)), "the Ukrainian formula is in the page");
  assert.ok(html.includes("Three kinds of number") && html.includes("Три види чисел"));
});

test("html: the waterfall chart, the removals table and the section map", async () => {
  const { reading, lens, checks } = await judged();
  const html = renderHtml(reading, lens, { checks });
  assert.ok(html.includes('id="losses"'));
  assert.match(html, /<svg class="wf"[^>]+role="img"/);
  assert.equal((html.match(/<rect class="track"/g) || []).length, 6, "six stages");
  // This page fits the cap, so "past the cap" is 0 and is drawn as a line (2 wide), not left empty.
  assert.match(html, /<rect class="b-cap" x="[^"]+" y="\d+" width="2" height="20"\/>/);
  assert.ok(html.includes("div.cookie-banner"), "the element is named");
  assert.ok(html.includes('class="secmap"'));
  // 2.103: the panel is the last one before the closing sentence, folded shut, and its summary
  // line names what is inside and the past-the-cap count in both languages.
  const at = html.indexOf('id="losses"');
  for (const before of ['id="h-strip"', 'id="checks"', 'id="h-groups"', 'id="h-passages"', 'id="h-side"']) {
    assert.ok(html.indexOf(before) > 0 && html.indexOf(before) < at, `${before} comes before the losses panel`);
  }
  assert.ok(at < html.indexOf('aria-label="Closing"'));
  const fold = html.slice(at, html.indexOf("</summary>", at));
  assert.match(fold, /<details class="fold"><summary>/, "a native <details>, closed: no open attribute");
  assert.ok(fold.includes("Where the text goes") && fold.includes("Куди дівається текст"));
  assert.ok(fold.includes("what the cleaner removed and what reached the passages") && fold.includes("що прибрав очищувач і що дійшло до уривків"));
  assert.ok(fold.includes("0 characters past the cap") && fold.includes("0 символів за лімітом"));
  // The counters stay where they were, in the result panel above the strip.
  assert.ok(html.indexOf('<div class="counters">') > html.indexOf('id="h-result"') && html.indexOf('<div class="counters">') < html.indexOf('id="h-strip"'));
  // A #help link to a metric inside the fold unfolds every <details> around it first.
  assert.ok(html.includes('function unfold(el)') && /if\(d\)\{unfold\(d\);d\.open=true/.test(html));
});

test("html: removed text in the new panels is escaped", async () => {
  const page = `<!doctype html><html><head><title>t</title></head><body><main><h2>A</h2><p>${"Kept words in a sentence. ".repeat(12)}</p><h2>B</h2><p>${"More kept words here. ".repeat(12)}</p></main><nav id="x&quot;y">${evil.replace(/</g, "&lt;")} nav text</nav><div class="${'"><b>bad</b>'.replace(/"/g, "&quot;")} cookie">cookie</div></body></html>`;
  const { reading, lens, checks } = await judged(page, "https://example.org/x");
  const html = renderHtml(reading, lens, { checks });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<b>bad</b>"));
  assert.ok(html.includes("&lt;img src=x"));
});

test("export: measured and judgement sections, the metrics dictionary, and every v1/v2 field where it was", async () => {
  const { reading, lens } = await judged();
  const dir = mkdtempSync(join(tmpdir(), "vectorscope-layers-"));
  writeFileSync(join(dir, "reading.json"), JSON.stringify(reading));
  writeFileSync(join(dir, "groups.json"), JSON.stringify({ groups: [reading.passages.map((p) => p.index)], agent: "Test agent", model: "Test model" }));
  execFileSync(process.execPath, [lensScript, join(dir, "reading.json"), join(dir, "groups.json"), "--json", join(dir, "export.json"), "--md", join(dir, "report.md"), "--html", join(dir, "report.html")]);
  const ex = JSON.parse(readFileSync(join(dir, "export.json"), "utf8"));
  assert.equal(ex.schema, "getlooploop/vectorscope-reading@1");
  // The old paths, unchanged.
  for (const key of ["page", "retrieval", "phrases", "narrativeWords", "keywords", "groups", "chunks", "checks", "technical", "robots", "plan", "queries", "facts"]) assert.ok(key in ex, key);
  assert.equal(ex.retrieval.charsUnread, reading.page.charsUnread);
  assert.equal(ex.retrieval.charsIndexed, reading.page.charsIndexed);
  assert.equal(ex.judgement.agent, "Test agent");
  assert.equal(ex.judgement.model, "Test model");
  // The new sections.
  assert.deepEqual(ex.measured.page, ex.page);
  assert.deepEqual(ex.measured.derived.phrases, ex.phrases);
  assert.deepEqual(ex.measured.losses.waterfall, reading.losses.waterfall);
  assert.equal(ex.measured.retrieval.charsInPassagesTotal, reading.page.charsIndexed);
  assert.equal(ex.measured.retrieval.charsInPassagesUnique, reading.losses.passages.unique);
  assert.equal(ex.measured.derived.charsPastCap, reading.losses.waterfall.pastCap);
  assert.ok(!("group" in ex.measured.passages[0]), "which group a passage is in is judgement");
  assert.deepEqual(ex.judgement.groups, ex.groups);
  assert.equal(ex.judgement.assignment.length, reading.passages.length);
  assert.deepEqual(Object.keys(ex.metrics), Object.keys(METRICS));
  assert.ok(ex.layers.measured && ex.layers.judgement);
  // The same dictionary is the Markdown's last section.
  const md = readFileSync(join(dir, "report.md"), "utf8");
  assert.ok(md.includes("## How each number is computed"));
  for (const m of Object.values(METRICS)) assert.ok(md.includes(`**${m.label.en}**`), m.label.en);
  assert.ok(md.includes("## Where the text goes `measured` `derived`"));
  assert.ok(md.includes("## The groups this page falls into `judgement`"));
  // 2.103: "Where the text goes" is the last section, after every other one and before the closing
  // line and "How each number is computed".
  const where = md.indexOf("## Where the text goes");
  const sections = [...md.matchAll(/^## .+$/gm)].map((m) => [m.index, m[0]]);
  const after = sections.filter(([i]) => i > where).map(([, h]) => h);
  assert.deepEqual(after, ["## How each number is computed"]);
  assert.ok(md.indexOf("\n---\n", where) > where && md.indexOf("\n---\n", where) < md.indexOf("## How each number is computed"));
  assert.ok(md.includes("div.cookie-banner"));
});

test("markdown and html of a 2.101 reading: no waterfall, the legacy number, said so", async () => {
  const { reading, lens, checks } = await judged();
  const old = { ...reading };
  delete old.losses;
  const html = renderHtml(old, lens, { checks });
  assert.ok(html.includes("no loss measurement"));
  assert.ok(!html.includes('<svg class="wf"'));
  assert.ok(renderMarkdown(old, lens, { checks }).includes("no loss measurement"));
});

test("before/after: the waterfall is diffed stage by stage", async () => {
  const a = await judged();
  const changed = fixture.replace("Join our newsletter today", "Join our newsletter today, and more text in the box");
  const b = await judged(changed);
  const diff = diffReadings(a.reading, b.reading, a.lens, b.lens);
  assert.ok(diff.before.waterfall && diff.after.waterfall);
  assert.ok(diff.after.waterfall.removed > diff.before.waterfall.removed);
  const html = renderHtml(b.reading, b.lens, { checks: b.checks, diff });
  assert.ok(html.includes("Waterfall, baseline → now") && html.includes("Каскад: було → зараз"));
});

test("compare: the cross-page loss table and each page's waterfall", async () => {
  const one = await judged();
  const two = await judged(readFileSync(new URL("./fixtures/example-com.html", import.meta.url), "utf8"), "https://example.com/");
  const pages = [
    { n: 1, reading: one.reading, lens: buildJudgedLens(one.reading, validateGrouping({ groups: [{ members: one.reading.passages.map((p) => p.index), topic: "t" }] }, one.reading.passages.length)), checks: one.checks },
    { n: 2, reading: two.reading, lens: buildJudgedLens(two.reading, validateGrouping({ groups: [{ members: two.reading.passages.map((p) => p.index), topic: "t" }] }, two.reading.passages.length)), checks: two.checks },
  ];
  const topics = [{ id: "t", name: "Topic" }];
  const html = renderCompareHtml({ pages, topics, topicCmp: compareTopics(pages, topics), facts: null, factCmp: null, queries: null, plan: null });
  assert.ok(html.includes("Losses by page") && html.includes("Втрати за сторінками"));
  assert.equal((html.match(/<svg class="wf"/g) || []).length, 2);
  // 2.103: the table and both pages' waterfalls sit in one folded panel at the end, each page folded too.
  const at = html.indexOf('id="losses"');
  assert.ok(at > html.indexOf('id="h-each"') && at > html.indexOf('id="topics"') && at < html.indexOf('aria-label="Closing"'));
  assert.match(html.slice(at, at + 400), /<details class="fold"><summary>/);
  assert.ok(html.slice(at).includes("characters past the cap across the pages"));
  assert.equal((html.match(/<details class="fold-page">/g) || []).length, 2);
  assert.ok(html.indexOf('<svg class="wf"') > at, "no waterfall above the fold");
  const md = renderCompareMarkdown({ pages, topics, topicCmp: compareTopics(pages, topics), facts: null, factCmp: null, queries: null, plan: null });
  const losses = md.indexOf("## Losses by page");
  assert.ok(losses > md.indexOf("## Each page's groups") && losses < md.indexOf("## How each number is computed"));
  assert.ok(md.indexOf("#### Where the text goes") > losses, "each page's waterfall comes after the table");
});

test("the refusal report has no waterfall: nothing was kept", () => {
  const html = renderRefusalHtml({ ok: false, reasonCode: "refused_language_ru", page: { url: "https://example.org/x" } });
  assert.ok(!html.includes('class="wf"') && !html.includes('id="losses"') && !html.includes('class="lyr'));
});
