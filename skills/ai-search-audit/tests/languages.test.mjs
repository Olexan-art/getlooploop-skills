// hreflang: the alternates are fetched (from fixtures, through a stubbed fetch) and checked for
// reciprocity, self-reference, x-default, their status, their titles and descriptions, and their
// html lang. An alternate declared Russian is never fetched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAlternates, checkLlms } from "../scripts/lib/collect.mjs";
import { auditFindings } from "../scripts/lib/checks.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { readingOf, withFetch } from "./helpers.mjs";

const EN = "https://example.org/en/page";
const UK = "https://example.org/uk/page";
const DE = "https://example.org/de/page";
const ES = "https://example.org/es/page";

const links = (set) => set.map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${h}">`).join("");
const doc = ({ lang, title, description, alternates, noindex = false, canonical = alternates[0]?.[1] || EN }) =>
  `<!doctype html><html lang="${lang}"><head><title>${title}</title><meta name="description" content="${description}">${noindex ? '<meta name="robots" content="noindex">' : ""}<meta name="viewport" content="width=device-width"><link rel="canonical" href="${canonical}">${links(alternates)}</head><body><main><h1>${title}</h1><p>${"Text of the page in its own language, long enough to be read as content. ".repeat(4)}</p><a href="/x">x</a></main></body></html>`;

const FULL = [["en", EN], ["uk", UK], ["de", DE], ["x-default", EN]];
const main = doc({ lang: "en", title: "Pricing for every team", description: "The English description of the pricing page, which says what each plan includes and costs.", alternates: FULL });
const routes = {
  [UK]: { body: doc({ lang: "uk", title: "Ціни для кожної команди", description: "Український опис сторінки цін: що входить у кожен план і скільки він коштує.", alternates: [["uk", UK], ["en", EN], ["de", DE], ["x-default", EN]] }) },
  // German: no link back to the English page, the English title, and lang="en".
  [DE]: { body: doc({ lang: "en", title: "Pricing for every team", description: "Die deutsche Beschreibung der Preisseite, mit allem, was jeder Plan enthält und kostet.", alternates: [["de", DE], ["uk", UK]] }) },
};

async function audited(html, alternateRoutes, llms = null) {
  const r = await readingOf(html, {}, { url: EN });
  r.alternates = await withFetch(alternateRoutes, () => checkAlternates(EN, r.facts.head.hreflang));
  if (llms) r.llms = llms;
  return { r, findings: auditFindings(r) };
}

test("reciprocity: the alternate that does not link back is named, the one that does is not", async () => {
  const { findings } = await audited(main, routes);
  const f = findings.find((x) => x.code === "hreflang_no_return");
  assert.ok(f);
  assert.deepEqual(f.evidence.langs, ["de"]);
  assert.equal(f.severity, "high");
});

test("the same title in two language versions, and an html lang that disagrees with hreflang", async () => {
  const { findings } = await audited(main, routes);
  const dup = findings.find((x) => x.code === "title_duplicate_locales");
  assert.deepEqual(dup.evidence.groups, [["en", "de"]]);
  const mismatch = findings.find((x) => x.code === "hreflang_lang_mismatch");
  assert.deepEqual(mismatch.evidence.items, ['de: lang="en"']);
  assert.ok(!findings.some((x) => x.code === "description_duplicate_locales"));
});

test("the language grid marks each version's cells from the same findings", async () => {
  const { r } = await audited(main, routes);
  const m = buildModel(r);
  const row = (l) => m.languages.rows.find((x) => x.hreflang === l);
  // The fourth column is the same facts; these pages have no h2 sections, so nothing is compared.
  assert.deepEqual(row("en").cells, ["fail", "pass", "pass", "na"]);
  assert.deepEqual(row("uk").cells, ["pass", "pass", "pass", "na"]);
  // de: no link back; the html lang warning folds into the same cell, and the fail outranks it.
  assert.deepEqual(row("de").cells, ["fail", "pass", "fail", "na"]);
  assert.equal(m.languages.xDefault, true);
});

test("a set without this page, without x-default, with a bad code and a broken alternate", async () => {
  const html = doc({ lang: "en", title: "Pricing for every team", description: "d".repeat(80), alternates: [["uk", UK], ["english", ES], ["es", ES]], canonical: EN });
  const { findings } = await audited(html, { [UK]: routes[UK], [ES]: { status: 404, body: "gone" } });
  const codes = findings.map((x) => x.code);
  for (const c of ["hreflang_no_self", "hreflang_no_x_default", "hreflang_invalid_code", "hreflang_alternate_broken"]) assert.ok(codes.includes(c), `${c} in ${codes.join(", ")}`);
  assert.deepEqual(findings.find((x) => x.code === "hreflang_invalid_code").evidence.codes, ["english"]);
});

test("an alternate declared Russian is not fetched; its row says not analysed", async () => {
  const html = doc({ lang: "en", title: "Pricing for every team", description: "d".repeat(80), alternates: [["en", EN], ["ru", "https://example.org/ru/page"], ["x-default", EN]] });
  const r = await readingOf(html, {}, { url: EN });
  const calls = [];
  r.alternates = await withFetch({}, async (c) => {
    const out = await checkAlternates(EN, r.facts.head.hreflang);
    calls.push(...c);
    return out;
  });
  assert.equal(calls.length, 0);
  assert.equal(r.alternates.results[0].refused, "refused_language_ru");
  const m = buildModel(r);
  assert.equal(m.languages.rows.find((x) => x.hreflang === "ru").refused, true);
});

test("the alternates cap: past ALTERNATES_CAP they are listed as not read", async () => {
  const many = Array.from({ length: 12 }, (_, i) => [`x${String.fromCharCode(97 + (i % 26))}${i}`, `https://example.org/l${i}/page`]);
  const html = doc({ lang: "en", title: "t".repeat(20), description: "d".repeat(80), alternates: [["en", EN], ...many] });
  const r = await readingOf(html, {}, { url: EN });
  const out = await withFetch({}, () => checkAlternates(EN, r.facts.head.hreflang));
  assert.equal(out.checked, 10);
  assert.equal(out.unchecked.length, 2);
});

test("llms.txt that links only one of the language versions", async () => {
  const llms = await withFetch({ "https://example.org/llms.txt": { headers: { "content-type": "text/plain" }, body: "# Site\n\n- [Pricing](https://example.org/en/page)\n- [Docs](https://example.org/en/docs)\n" } }, () => checkLlms(EN));
  assert.equal(llms.present, true);
  assert.equal(llms.links, 2);
  const { findings } = await audited(main, routes, llms);
  assert.ok(findings.some((x) => x.code === "llms_txt_one_language"));
  const both = { ...llms, sample: [...llms.sample, UK] };
  const again = await audited(main, routes, both);
  assert.ok(!again.findings.some((x) => x.code === "llms_txt_one_language"));
});

test("an llms.txt path that answers with an HTML page is a soft 404, not an llms.txt", async () => {
  const llms = await withFetch({ "https://example.org/llms.txt": { body: "<!doctype html><html><body>Not found</body></html>" } }, () => checkLlms(EN));
  assert.equal(llms.present, false);
  assert.equal(llms.softNotFound, true);
});
