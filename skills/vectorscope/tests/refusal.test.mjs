// The refusal for pages in Russian: its approved copy, both languages in step, and a report that
// holds the refusal and nothing of the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FINDINGS, REFUSAL_COPY, SANCTIONS_LINKS, refusalLinks, refusalSentences, PROSECUTOR_FIGURES_AS_OF } from "../scripts/lib/refusal.mjs";
import { renderRefusalHtml } from "../scripts/lib/html.mjs";
import { renderRefusalMarkdown } from "../scripts/lens.mjs";

const lensScript = fileURLToPath(new URL("../scripts/lens.mjs", import.meta.url));
const refused = { schema: "getlooploop/vectorscope-skill-reading@1", ok: false, reasonCode: "refused_language_ru", requestedInput: "https://example.org/ru", page: { url: "https://example.org/ru", requestedUrl: "https://example.org/ru" }, language: { basis: "declared", declared: [{ source: "html lang", value: "ru", tag: "ru" }], cyrillicWords: 0, markerWords: 0, otherWords: 0 } };

// Every number in a sentence, separators removed ("190,000" and "190 000" are both 190000).
const numbers = (text) => (text.replace(/(\d)[,  ](?=\d{3}\b)/g, "$1").match(/\d+/g) || []).join(" ");

test("English and Ukrainian carry the same findings, the same numbers and the same links", () => {
  const en = refusalSentences("en");
  const uk = refusalSentences("uk");
  assert.equal(en.length, uk.length);
  en.forEach((sentence, i) => assert.equal(numbers(uk[i]), numbers(sentence), `finding ${i}: ${sentence}`));
  // The same bold spans, by count, in each finding.
  en.forEach((sentence, i) => assert.equal((uk[i].match(/\*\*/g) || []).length, (sentence.match(/\*\*/g) || []).length, `bold spans in finding ${i}`));
  for (const key of Object.keys(REFUSAL_COPY)) assert.ok(REFUSAL_COPY[key].en && REFUSAL_COPY[key].uk, key);
  const links = refusalLinks();
  assert.equal(new Set(links).size, links.length);
  assert.ok(links.every((u) => u.startsWith("https://")));
  assert.equal(PROSECUTOR_FIGURES_AS_OF, "2025-11-05");
  assert.ok(FINDINGS.find((f) => f.id === "pgo").text.en.includes("(5 November 2025)"));
});

test("the refusal report: header with the URL, the refusal, the footer, nothing else", () => {
  const html = renderRefusalHtml(refused);
  assert.ok(html.includes("This page was not analysed"));
  assert.ok(html.includes("Цю сторінку не проаналізовано"));
  assert.ok(html.includes("https://example.org/ru"));
  assert.ok(!html.includes('id="h-result"'), "no results panel");
  assert.ok(!html.includes('class="info"'), "no info panel: nothing was judged");
  assert.ok(html.includes('class="foot"'));
  for (const url of refusalLinks()) {
    assert.ok(html.includes(`href="${url}" rel="noopener noreferrer" target="_blank"`), url);
  }
  assert.ok(html.includes("<b>141 states in favour, 5 against, 35 abstentions</b>"));
  assert.ok(html.includes("<b>141 держава «за», 5 «проти», 35 утрималися</b>"));
  assert.ok(html.includes("<b>United Nations General Assembly</b>"));
  assert.ok(!html.includes("**"));
  for (const l of SANCTIONS_LINKS) assert.ok(html.includes(`>${l.name}</a>`));

  const md = renderRefusalMarkdown(refused);
  assert.ok(md.startsWith("# Vectorscope: This page was not analysed"));
  for (const url of refusalLinks()) assert.ok(md.includes(url), url);
  assert.ok(md.includes("## Цю сторінку не проаналізовано"));
});

test("compare: a page in Russian is left out, with the refusal in its slot, and the others proceed", () => {
  const src = fileURLToPath(new URL("../../../examples/judgement/http-caching-compare/", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "vectorscope-compare-refusal-"));
  try {
    for (const f of ["reading-1.json", "reading-2.json", "groups-1.json", "groups-2.json", "topics.json", "facts.json", "queries.json", "plan.json"]) writeFileSync(join(dir, f), readFileSync(join(src, f)));
    const manifest = JSON.parse(readFileSync(join(src, "manifest.json"), "utf8"));
    manifest.pages.push({ n: 3, url: "https://example.org/ru", requested: "https://example.org/ru", reading: "reading-3.json", ok: false, reasonCode: "refused_language_ru" });
    writeFileSync(join(dir, "reading-3.json"), JSON.stringify(refused));
    writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
    execFileSync(process.execPath, [lensScript, "--compare", join(dir, "manifest.json"), "--html", join(dir, "c.html"), "--md", join(dir, "c.md"), "--json", join(dir, "c.json")], { encoding: "utf8" });
    const html = readFileSync(join(dir, "c.html"), "utf8");
    assert.equal((html.match(/class="refusal compact"/g) || []).length, 1);
    assert.ok(html.includes('id="h-each"'), "the two read pages still get their report");
    const exported = JSON.parse(readFileSync(join(dir, "c.json"), "utf8"));
    assert.equal(exported.pages.length, 2);
    assert.deepEqual(exported.refused, [{ n: 3, url: "https://example.org/ru", reasonCode: "refused_language_ru" }]);
    assert.ok(readFileSync(join(dir, "c.md"), "utf8").includes("Not analysed: page 3"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("lens.mjs on a refused reading writes the refusal report and an export with no passages", () => {
  const dir = mkdtempSync(join(tmpdir(), "vectorscope-refusal-"));
  try {
    writeFileSync(join(dir, "reading.json"), JSON.stringify(refused));
    const out = execFileSync(process.execPath, [lensScript, join(dir, "reading.json"), "--html", join(dir, "r.html"), "--md", join(dir, "r.md"), "--json", join(dir, "e.json")], { encoding: "utf8" });
    assert.match(out, /REFUSED {2}refused_language_ru/);
    const exported = JSON.parse(readFileSync(join(dir, "e.json"), "utf8"));
    assert.equal(exported.reasonCode, "refused_language_ru");
    assert.equal(exported.refused, true);
    assert.deepEqual(exported.passages, []);
    assert.ok(readFileSync(join(dir, "r.html"), "utf8").includes("This page was not analysed"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
