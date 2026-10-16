// Pages in Russian are refused with the Vectorscope's own rule and its approved copy (only the
// tool's name differs), and the report holds the reason and nothing of the page. No Russian text
// is needed for the test: the declaration alone refuses, and the letter rule is covered by the
// Vectorscope's synthetic sample.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REFUSAL_COPY, refusalLinks } from "../../vectorscope/scripts/lib/refusal.mjs";
import { renderRefusal, refusalLead } from "../scripts/lib/report.mjs";
import { esc } from "../../vectorscope/scripts/lib/html.mjs";
import { buildRefusalExport, renderRefusalMarkdown } from "../scripts/lib/outputs.mjs";
import { page, readingOf } from "./helpers.mjs";

const SECRET = "A sentence that only this page carries, and the report must never show.";

test("lang=ru is refused before anything else is read; the reading keeps nothing of the page", async () => {
  const r = await readingOf(page({ lang: "ru", body: `<p>${SECRET}</p>` }));
  assert.equal(r.ok, false);
  assert.equal(r.reasonCode, "refused_language_ru");
  assert.equal(r.language.basis, "declared");
  const json = JSON.stringify(r);
  assert.ok(!json.includes(SECRET));
  assert.ok(!("facts" in r) && !("vs" in r));
});

test("the synthetic Russian-like sample is refused by its letters with nothing declared", async () => {
  const sample = readFileSync(new URL("../../vectorscope/tests/fixtures/russian-sample.txt", import.meta.url), "utf8").split("\n").slice(1).join(" ");
  const r = await readingOf(page({ lang: "", body: `<p>${sample}</p>` }));
  assert.equal(r.reasonCode, "refused_language_ru");
  assert.equal(r.language.basis, "letters");
});

test("a Ukrainian page is never refused", async () => {
  const r = await readingOf(page({ lang: "uk", body: "<p>Ця сторінка пояснює, як працює перевірка, і жодне її слово не має бути відкинуте.</p>" }));
  assert.equal(r.ok, true);
});

test("the refusal report: the approved copy in both languages, every source, nothing of the page", async () => {
  const r = await readingOf(page({ lang: "ru", body: `<p>${SECRET}</p>` }));
  const html = renderRefusal(r);
  assert.ok(html.includes(REFUSAL_COPY.title.en) && html.includes(REFUSAL_COPY.title.uk));
  assert.ok(html.includes(esc(refusalLead("en"))) && html.includes(esc(refusalLead("uk"))));
  assert.ok(refusalLead("en").startsWith("AI Search Audit does not analyse pages written in Russian"));
  for (const url of refusalLinks()) assert.ok(html.includes(url), url);
  assert.ok(!html.includes(SECRET));
  assert.ok(!html.includes('id="page-map"'));
  assert.ok(renderRefusalMarkdown(r).includes(REFUSAL_COPY.title.en));
  assert.equal(buildRefusalExport(r).refused, true);
});
