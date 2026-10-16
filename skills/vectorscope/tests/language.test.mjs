// Pages in Russian are refused; no Ukrainian page, and no page in another Cyrillic language, may be.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { judgeLanguage, declaredLanguagesFromHtml, letterCounts, primaryTag, MARKER_SHARE } from "../scripts/lib/language.mjs";
import { readPage } from "../scripts/lib/reading.mjs";
import { analyseHtml } from "../scripts/lib/extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(join(here, "fixtures", name), "utf8");
// The synthetic sample: pseudo-words, not Russian text (see its first line).
const russianLike = fixture("russian-sample.txt").split("\n").slice(1).join("\n");
const thrice = (name) => [1, 2, 3].map(() => fixture(name)).join(" ");
const page = (body, lang) => `<!doctype html><html${lang === undefined ? "" : ` lang="${lang}"`}><head><title>t</title></head><body><main><p>${body}</p></main></body></html>`;

test("the language tag is read from lang, meta and the header, the most specific first", () => {
  assert.equal(primaryTag("ru-RU"), "ru");
  assert.equal(primaryTag("uk, ru"), "uk");
  assert.equal(primaryTag(""), null);
  const d = declaredLanguagesFromHtml('<html lang="uk"><head><meta http-equiv="Content-Language" content="ru"></head></html>', "ru");
  assert.deepEqual(d.map((x) => x.tag), ["uk", "ru", "ru"]);
  assert.equal(judgeLanguage({ declared: d, text: "" }).russian, false);
});

test("lang=ru is refused, and so is ru-RU or a content-language header alone", () => {
  for (const decl of [[{ source: "html lang", value: "ru", tag: "ru" }], [{ source: "html lang", value: "ru-RU", tag: "ru" }], [{ source: "Content-Language header", value: "ru", tag: "ru" }]]) {
    const v = judgeLanguage({ declared: decl, text: "Some English template text." });
    assert.equal(v.russian, true);
    assert.equal(v.basis, "declared");
  }
});

test("the synthetic Russian-like sample is refused by its letters when nothing is declared", () => {
  const v = judgeLanguage({ declared: [], text: russianLike });
  assert.ok(v.cyrillicWords >= 30);
  assert.ok(v.markerWords / v.cyrillicWords >= MARKER_SHARE, `share ${v.markerWords}/${v.cyrillicWords}`);
  assert.equal(v.russian, true);
  assert.equal(v.basis, "letters");
  // A template that says lang="en" does not hide it.
  assert.equal(judgeLanguage({ declared: [{ source: "html lang", value: "en", tag: "en" }], text: russianLike }).russian, true);
});

test("our own Ukrainian pages are never refused, with or without their lang attribute", () => {
  for (const name of ["uk-vectorscope.html", "uk-voicescope.html"]) {
    const html = fixture(name);
    const text = analyseHtml({ html, url: "https://www.getlooploop.com/uk/x", requestedUrl: "https://www.getlooploop.com/uk/x" }).bodyText;
    const counts = letterCounts(text);
    assert.ok(counts.cyrillicWords > 300, `${name}: ${counts.cyrillicWords} Cyrillic words`);
    assert.equal(counts.markerWords, 0, `${name}: correct Ukrainian has none of the three letters`);
    assert.equal(judgeLanguage({ declared: declaredLanguagesFromHtml(html), text }).russian, false, `${name} with lang`);
    assert.equal(judgeLanguage({ declared: [], text }).russian, false, `${name} without lang`);
    // Even a stray lang="ru" in a template does not refuse a page that is plainly Ukrainian.
    const stray = judgeLanguage({ declared: [{ source: "html lang", value: "ru", tag: "ru" }], text });
    assert.equal(stray.russian, false, `${name} with lang=ru`);
    assert.equal(stray.basis, "declared_contradicted");
  }
});

test("a Ukrainian page quoting a few Russian-like words is not refused", () => {
  const text = analyseHtml({ html: fixture("uk-vectorscope.html"), url: "https://x.org/", requestedUrl: "https://x.org/" }).bodyText;
  assert.equal(judgeLanguage({ declared: [], text: `${text} ${russianLike.slice(0, 400)}` }).russian, false);
});

test("Bulgarian, Serbian, Kazakh and Belarusian are not refused by their letters", () => {
  for (const name of ["cyrillic-bulgarian.txt", "cyrillic-serbian.txt", "cyrillic-kazakh.txt", "cyrillic-belarusian.txt"]) {
    const text = thrice(name);
    const v = judgeLanguage({ declared: [], text });
    assert.ok(v.cyrillicWords >= 30, name);
    assert.equal(v.russian, false, `${name}: ${v.markerWords} marker, ${v.otherWords} other of ${v.cyrillicWords}`);
  }
});

test("Belarusian writes the marker letters, and its lang wins over them", () => {
  const text = thrice("cyrillic-belarusian.txt");
  assert.ok(letterCounts(text).markerWords > 0, "the sample does carry the letters the rule looks for");
  const v = judgeLanguage({ declared: [{ source: "html lang", value: "be", tag: "be" }], text: russianLike });
  assert.equal(v.russian, false);
  assert.equal(v.basis, "declared_other");
});

test("readPage refuses before chunking and keeps nothing of the page", async () => {
  const reading = await readPage({ url: "https://example.org/page", html: page(russianLike), robots: "skip" });
  assert.equal(reading.ok, false);
  assert.equal(reading.reasonCode, "refused_language_ru");
  assert.equal(reading.passages, undefined);
  assert.deepEqual(Object.keys(reading.page).sort(), ["requestedUrl", "url"]);
  assert.ok(!JSON.stringify(reading).includes(russianLike.slice(0, 40)));

  const declared = await readPage({ url: "https://example.org/page", html: page("Plain English text that is long enough to be a page of its own here.", "ru"), robots: "skip" });
  assert.equal(declared.reasonCode, "refused_language_ru");
  assert.equal(declared.language.basis, "declared");

  const ukrainian = await readPage({ url: "https://www.getlooploop.com/uk/vectorscope", html: fixture("uk-vectorscope.html"), robots: "skip" });
  assert.equal(ukrainian.ok, true);
  assert.ok(ukrainian.passages.length > 0);
});
