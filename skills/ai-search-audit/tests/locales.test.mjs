// Locale facts: the numbers of each language version's h2 sections, aligned by order when both
// versions have the same number of sections, compared as sets. A version whose sections do not
// line up is not compared, and the report says so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareLocales, numbersIn, sectionNumbers } from "../scripts/lib/localeFacts.mjs";
import { checkAlternates } from "../scripts/lib/collect.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { readingOf, withFetch } from "./helpers.mjs";

test("numbers as the locales write them: 2,000 · 2 000 · 2.000 are one; 0.5 and 0,5 too", () => {
  assert.deepEqual(numbersIn("2,000 and 2 000 and 2.000").map((n) => n.value), [2000, 2000, 2000]);
  assert.deepEqual(numbersIn("0.5 or 0,5").map((n) => n.value), [0.5, 0.5]);
  assert.deepEqual(numbersIn("GPT-5 has 26 slots").map((n) => n.value), [26], "a digit glued to letters is a name, not a number");
});

const S = (heading, text) => ({ heading, text });

test("aligned by order: a number one version states and the other replaces is reported", () => {
  const en = sectionNumbers([{ ...S("Title", "intro 99"), intro: true }, S("Plans", "Free for up to 3 agents."), S("Limits", "Up to 26 passages.")]);
  assert.equal(en.length, 2, "the intro is left out");
  const de = sectionNumbers([S("Pläne", "Kostenlos für bis zu 5 Agenten."), S("Grenzen", "Bis zu 26 Abschnitte.")]);
  const r = compareLocales("en", en, [{ hreflang: "de", sections: de }]);
  assert.equal(r.differ.length, 1);
  assert.deepEqual(r.differ[0].values, ["3", "5"]);
  assert.equal(r.differ[0].position, 1);
  assert.equal(r.findings[0].code, "locale_facts_differ");
});

test("not aligned: different section counts are not compared; the same numbers are not a finding", () => {
  const en = sectionNumbers([S("A", "3 agents"), S("B", "26 passages")]);
  const r = compareLocales("en", en, [{ hreflang: "uk", sections: sectionNumbers([S("А", "3 агенти")]) }]);
  assert.equal(r.compared[0].aligned, false);
  assert.equal(r.compared[0].reason, "sections_differ");
  assert.equal(r.findings.length, 0);
  const same = compareLocales("en", en, [{ hreflang: "uk", sections: sectionNumbers([S("А", "3 агенти"), S("Б", "26 уривків")]) }]);
  assert.equal(same.findings.length, 0);
  assert.equal(same.compared[0].aligned, true);
});

const EN = "https://example.org/en/page";
const DE = "https://example.org/de/page";
const head = (lang, self, other) => `<html lang="${lang}"><head><title>T ${lang}</title><link rel="alternate" hreflang="${lang}" href="${self}"><link rel="alternate" hreflang="${lang === "en" ? "de" : "en"}" href="${other}"></head>`;
const doc = (lang, self, other, a, b) => `<!doctype html>${head(lang, self, other)}<body><main><h1>Plans ${lang}</h1><h2>${lang === "en" ? "Free" : "Gratis"}</h2><p>${a} ${"Words about the plan and what it includes for a team. ".repeat(3)}</p><h2>${lang === "en" ? "Limits" : "Grenzen"}</h2><p>${b} ${"More words about the limits of every plan for teams. ".repeat(3)}</p></main></body></html>`;

test("end to end: the alternate's sections are read as numbers only, and the grid's last column shows the drift", async () => {
  const r = await readingOf(doc("en", EN, DE, "Free for up to 3 agents.", "Up to 26 passages."), {}, { url: EN });
  r.alternates = await withFetch({ [DE]: { body: doc("de", DE, EN, "Kostenlos für bis zu 5 Agenten.", "Bis zu 26 Abschnitte.") } }, () => checkAlternates(EN, r.facts.head.hreflang));
  const alt = r.alternates.results[0];
  assert.ok(alt.sections.every((s) => Object.keys(s).sort().join() === "heading,numbers,position"), "no text of the alternate is kept beyond the numbers and their context");
  const m = buildModel(r);
  const f = m.findings.find((x) => x.code === "locale_facts_differ");
  assert.ok(f && f.area === "lang" && f.mapped);
  assert.match(f.label[0], /^3 or 5\? · de/);
  assert.equal(m.languages.rows.find((x) => x.hreflang === "de").cells[3], "fail");
  assert.equal(m.languages.rows.find((x) => x.self).cells[3], "fail");
});
