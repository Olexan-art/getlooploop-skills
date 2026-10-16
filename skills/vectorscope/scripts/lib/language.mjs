// Pages in Russian are not analysed (the publisher's decision; the reasons are in refusal.mjs).
// This decides, after the fetch and the text extraction and before any chunking, whether a
// page is in Russian. Two signals, in order:
//
// 1. What the page declares: <html lang>, <meta http-equiv="content-language"> and the
//    Content-Language header. "ru" or "ru-…" is Russian. Any other Cyrillic-script language
//    declared (uk, be, bg, kk, sr, …) wins over the letter rule below, because the letters alone
//    can misfire on a language that shares them: Belarusian, Kazakh, Kyrgyz and Mongolian all
//    write U+044B and U+044D.
// 2. Otherwise (nothing declared, or a non-Cyrillic language such as a template's default "en"),
//    the letters of the main extracted text. Correct Ukrainian never contains U+044B, U+044D or U+0451 (yeru, e, yo); ordinary
//    Russian prose has one of them in about one word in six (17–18% in the samples measured when
//    this was written). So: at least MIN_CYRILLIC_WORDS Cyrillic words, at least MARKER_SHARE of
//    them holding U+044B, U+044D or U+0451 (yeru, e, yo), and almost none (under OTHER_SHARE) holding a letter Russian does not
//    have (і ї є ґ ў, the Kazakh, Serbian and Macedonian letters), which rules out Ukrainian,
//    Belarusian, Kazakh and Serbian text with a Russian quotation in it.
//    U+044A (hard sign) is not a marker here: Bulgarian writes it in a large share of its words (for example in the words for 'am', 'in' and 'road'),
//    and Bulgarian has none of the other three.
//
// The letters are written as escapes so this file holds no Russian-only letters of its own.

import * as cheerio from "cheerio";

export const MIN_CYRILLIC_WORDS = 30;
// Russian prose measured at 17–18%; a page with headings, names and numbers runs lower, and no
// Ukrainian, Bulgarian or Serbian text reaches it at all, so the bar sits well under the prose rate.
export const MARKER_SHARE = 0.08;
// A Ukrainian page writes і in roughly every fourth word; a Russian page writes none of these.
export const OTHER_SHARE = 0.02;

const CYRILLIC_WORD = /[\u0400-\u04ff\u0500-\u052f]+/g;
// U+044B U+044D U+0451
const MARKERS = /[\u044b\u044d\u0451]/;
// і ї є ґ ў (Ukrainian, Belarusian); ә ғ қ ң ө ұ ү һ (Kazakh and other Turkic); ј љ њ ћ ђ џ ѓ ќ ѕ (Serbian, Macedonian)
const NOT_RUSSIAN = /[\u0456\u0457\u0454\u0491\u045e\u04d9\u0493\u049b\u04a3\u04e9\u04b1\u04af\u04bb\u0458\u0459\u045a\u045b\u0452\u045f\u0453\u045c\u0455]/;
// Languages written in Cyrillic other than Russian: a declaration of one of them settles it.
const OTHER_CYRILLIC_LANGS = new Set(["uk", "be", "bg", "sr", "mk", "kk", "ky", "mn", "tg", "tt", "ba", "cv", "sah", "ab", "os", "ce", "rue"]);
// A page whose text is plainly another Cyrillic language (і, ї, є … in a tenth of its words) is not
// refused on a stray lang="ru" left in a template: a Ukrainian page must never be refused.
export const OTHER_OVERRIDES_DECLARED = 0.1;

/** The primary language subtag of a declaration ("ru-RU" → "ru"), or null. */
export function primaryTag(value) {
  const first = String(value ?? "").split(",")[0].trim().toLowerCase();
  const tag = first.split(/[-_;\s]/)[0];
  return /^[a-z]{2,3}$/.test(tag) ? tag : null;
}

/** Everything the page declares about its language: [{ source, value, tag }]. */
export function declaredLanguages($, contentLanguageHeader) {
  const out = [];
  const add = (source, value) => {
    const tag = primaryTag(value);
    if (tag) out.push({ source, value: String(value).trim().slice(0, 40), tag });
  };
  add("html lang", $("html").attr("lang"));
  add("html xml:lang", $("html").attr("xml:lang"));
  $("meta[http-equiv]").each((_, el) => {
    if (String($(el).attr("http-equiv")).toLowerCase() === "content-language") add("meta content-language", $(el).attr("content"));
  });
  add("Content-Language header", contentLanguageHeader);
  return out;
}

/** The declarations of a raw HTML document plus the response header. */
export function declaredLanguagesFromHtml(html, contentLanguageHeader) {
  return declaredLanguages(cheerio.load(html), contentLanguageHeader);
}

/** Counts over the Cyrillic words of a text. */
export function letterCounts(text) {
  const words = String(text ?? "").toLowerCase().match(CYRILLIC_WORD) || [];
  let marker = 0;
  let other = 0;
  for (const word of words) {
    if (MARKERS.test(word)) marker++;
    if (NOT_RUSSIAN.test(word)) other++;
  }
  return { cyrillicWords: words.length, markerWords: marker, otherWords: other };
}

/**
 * { russian, basis, declared, ...counts }. basis: "declared" (the page says ru), "letters"
 * (the text rule), "declared_other" (another Cyrillic language is declared, so the letters
 * are not consulted), "declared_contradicted" (ru declared, the text plainly another Cyrillic
 * language) or null.
 */
export function judgeLanguage({ declared = [], text = "" }) {
  const counts = letterCounts(text);
  // The most specific declaration decides: <html lang>, then xml:lang, then the meta, then the header.
  const tag = declared[0]?.tag ?? null;
  const result = (russian, basis) => ({ russian, basis, declared, ...counts, markerShare: counts.cyrillicWords ? counts.markerWords / counts.cyrillicWords : 0 });
  const plainlyOther = counts.cyrillicWords >= MIN_CYRILLIC_WORDS && counts.otherWords / counts.cyrillicWords >= OTHER_OVERRIDES_DECLARED;
  if (tag === "ru") return plainlyOther ? result(false, "declared_contradicted") : result(true, "declared");
  if (tag && OTHER_CYRILLIC_LANGS.has(tag)) return result(false, "declared_other");
  const { cyrillicWords, markerWords, otherWords } = counts;
  if (cyrillicWords >= MIN_CYRILLIC_WORDS && markerWords / cyrillicWords >= MARKER_SHARE && otherWords / cyrillicWords < OTHER_SHARE) {
    return result(true, "letters");
  }
  return result(false, null);
}
