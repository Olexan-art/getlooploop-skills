#!/usr/bin/env node
// GENERATED FILE - do not edit. Bundled by esbuild from scripts/lens.mjs and scripts/lib/,
// with cheerio and its dependencies inlined, so it runs with Node 20.18 or later and no npm install.
// The readable source is scripts/. To rebuild after changing it: npm install && npm run build
// (tests/dist.test.mjs fails if this file differs from a fresh build).
import { createRequire as __vectorscopeCreateRequire } from "node:module";
const require = __vectorscopeCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// scripts/lens.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// scripts/lib/vocabulary.mjs
var PHRASE_LIMIT = 15;
var NARRATIVE_LIMIT = 10;
var PHRASE_MAX_WORDS = 4;
var SCOPE_SPREAD = 0.6;
var MIN_KEYWORD_COUNT = 2;
var PHRASE_MIN_COUNT = 2;
var PHRASE_MIN_PASSAGES = 2;
var PHRASE_SINGLE_PASSAGE_COUNT = 3;
var PHRASE_SHARE = 1 / 3;
var SUBSUME_RATIO = 1.25;
var NARRATIVE_ALONE_RATIO = 2;
var OVERLAP_MIN_CHARS = 40;
var OVERLAP_MAX_CHARS = 600;
var LABEL_STOP = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "our",
  "can",
  "will",
  "are",
  "that",
  "this",
  "from",
  "have",
  "has",
  "not",
  "all",
  "any",
  "how",
  "what",
  "more",
  "one",
  "use",
  "using",
  "used",
  "get",
  "make",
  "also",
  "than",
  "then",
  "when"
]);
var GENERIC_WORDS = /* @__PURE__ */ new Set([
  // English: reporting and reading verbs
  "see",
  "seen",
  "say",
  "says",
  "said",
  "read",
  "reads",
  "tell",
  "tells",
  "told",
  "show",
  "shows",
  "shown",
  "ask",
  "asks",
  "asked",
  "keep",
  "keeps",
  "kept",
  "take",
  "takes",
  "taken",
  "give",
  "gives",
  "given",
  "made",
  "makes",
  "let",
  "lets",
  "want",
  "wants",
  "know",
  "knows",
  "find",
  "finds",
  "found",
  "come",
  "comes",
  "goes",
  "put",
  "puts",
  "look",
  "looks",
  "like",
  "means",
  "mean",
  "going",
  // English: connectives, hedges, quantities
  "whether",
  "rather",
  "instead",
  "because",
  "cannot",
  "without",
  "within",
  "while",
  "though",
  "although",
  "since",
  "until",
  "upon",
  "unless",
  "already",
  "always",
  "never",
  "often",
  "still",
  "yet",
  "even",
  "ever",
  "much",
  "many",
  "less",
  "least",
  "enough",
  "quite",
  "really",
  "almost",
  "well",
  "now",
  "back",
  "out",
  "up",
  "down",
  "off",
  "around",
  "across",
  "along",
  "against",
  "among",
  "etc",
  "beside",
  "inside",
  "outside",
  "behind",
  "beyond",
  "far",
  "different",
  "main",
  // Citation residue
  "et",
  "al",
  "nothing",
  "something",
  "anything",
  "everything",
  "nobody",
  "somebody",
  "someone",
  "anyone",
  "everyone",
  "thing",
  "things",
  "way",
  "ways",
  "lot",
  "kind",
  "example",
  "examples",
  "based",
  "new",
  "first",
  "second",
  "last",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  // Ukrainian
  "каже",
  "кажуть",
  "сказати",
  "показує",
  "показують",
  "бачити",
  "читати",
  "читає",
  "має",
  "мають",
  "можуть",
  "немає",
  "нічого",
  "ніхто",
  "ніщо",
  "щось",
  "хтось",
  "хто",
  "кого",
  "чого",
  "чим",
  "собі",
  "сам",
  "сама",
  "самі",
  "один",
  "одна",
  "одне",
  "одну",
  "одного",
  "одній",
  "два",
  "дві",
  "три",
  "чотири",
  "п’ять",
  "тож",
  "отже",
  "будь",
  "просто",
  "зараз",
  "тоді",
  "замість",
  "приклад",
  "наприклад",
  "поруч",
  "ніж",
  "дійсно",
  "справді",
  "завжди",
  "ніколи",
  "часто",
  "майже",
  "потім",
  "далі",
  "скільки",
  "наскільки",
  "всередині",
  // Ukrainian: declined possessives and determiners
  "вашого",
  "вашої",
  "вашій",
  "вашому",
  "вашою",
  "вашим",
  "ваших",
  "нашого",
  "нашої",
  "нашій",
  "нашому",
  "нашою",
  "нашим",
  "наших",
  "свого",
  "своєї",
  "своїй",
  "своєму",
  "своєю",
  "своїм",
  "своїх",
  "власний",
  "власна",
  "власне",
  "власні",
  "власного",
  "власної",
  "власній",
  "власною",
  "власним",
  "власних",
  "кожного",
  "кожної",
  "кожній",
  "кожному",
  "кожним",
  "жоден",
  "жодна",
  "жодне",
  "жодної",
  "жодного",
  "жодній",
  "жодних",
  // Spanish
  "dice",
  "dicen",
  "decir",
  "ver",
  "lee",
  "leer",
  "hace",
  "hacen",
  "hacer",
  "ejemplo",
  "ninguna",
  "ninguno",
  "nadie",
  "nada",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "vez",
  "veces",
  "junto",
  "existe",
  "bien",
  "sino",
  "luego",
  "ahí",
  "haz",
  // Spanish determiners the stop list does not carry
  "cuya",
  "cuyo",
  "cuyas",
  "cuyos",
  "ningún",
  "propia",
  "propio",
  "propias",
  "propios",
  "cualquier",
  "cualquiera"
]);
function pageStopLanguage(texts) {
  return detectStopLanguage(texts.join("\n"));
}
__name(pageStopLanguage, "pageStopLanguage");
function usableKeyword(token, language) {
  if (token.length < 2) return false;
  if (LABEL_STOP.has(token) || isStopword(token, language)) return false;
  return new RegExp("\\p{L}", "u").test(token);
}
__name(usableKeyword, "usableKeyword");
function stripMarkup(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" && text[i + 1] === "\\") {
      let depth = 0;
      let j = i;
      for (; j < text.length; j++) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") {
          depth--;
          if (depth === 0) break;
        }
      }
      out += " . ";
      i = j;
      continue;
    }
    out += text[i];
  }
  return out.replace(/\\[A-Za-z]+/g, " . ").replace(/\[[^[\]\n]{0,24}\]/g, " . ");
}
__name(stripMarkup, "stripMarkup");
function withoutOverlap(texts) {
  return texts.map((text, index) => {
    if (index === 0) return text;
    const previous = texts[index - 1];
    const longest = Math.min(previous.length, text.length, OVERLAP_MAX_CHARS);
    for (let k = longest; k >= OVERLAP_MIN_CHARS; k--) {
      if (previous.endsWith(text.slice(0, k))) return text.slice(k);
    }
    return text;
  });
}
__name(withoutOverlap, "withoutOverlap");
function withoutRepeatedSentences(texts) {
  const seen = /* @__PURE__ */ new Set();
  return texts.map(
    (text) => text.split(/(?<=[.!?…])\s+|\n+/u).filter((sentence) => {
      const key = sentence.toLowerCase().replace(/\s+/g, " ").replace(/[\s.!?…:;,]+$/u, "").trim();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join("\n")
  );
}
__name(withoutRepeatedSentences, "withoutRepeatedSentences");
var CLITIC = new RegExp("(\\p{L})['’ʼ](?:s|t|re|ve|ll|d|m)(?![\\p{L}\\p{N}])", "giu");
var INNER_APOSTROPHE = new RegExp("(\\p{L})['ʼ](?=\\p{L})", "gu");
function contentRuns(text, language) {
  const runs = [];
  let run = [];
  const end = /* @__PURE__ */ __name(() => {
    if (run.length) runs.push(run);
    run = [];
  }, "end");
  const prepared = text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(CLITIC, "$1").replace(INNER_APOSTROPHE, "$1’");
  const parts = prepared.split(new RegExp("((?:[^\\p{L}\\p{N}’]|’(?!\\p{L})|(?<!\\p{L})’)+)", "u"));
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      if (!/^[\s-]+$/.test(part)) end();
      return;
    }
    if (!part) return;
    if (!usableKeyword(part, language) || /^\d+$/.test(part)) {
      end();
      return;
    }
    run.push(part);
  });
  end();
  return runs;
}
__name(contentRuns, "contentRuns");
function tally(map, key, surface, passage, group, neighbours) {
  let entry = map.get(key);
  if (!entry) {
    entry = { count: 0, passages: /* @__PURE__ */ new Set(), groups: /* @__PURE__ */ new Set(), surfaces: /* @__PURE__ */ new Map(), left: /* @__PURE__ */ new Set(), right: /* @__PURE__ */ new Set() };
    map.set(key, entry);
  }
  if (neighbours) {
    entry.left.add(neighbours.left);
    entry.right.add(neighbours.right);
  }
  entry.count++;
  entry.passages.add(passage);
  entry.groups.add(group);
  entry.surfaces.set(surface, (entry.surfaces.get(surface) ?? 0) + 1);
}
__name(tally, "tally");
function displayOf(key, surfaces) {
  if (surfaces.has(key)) return key;
  return [...surfaces.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? key;
}
__name(displayOf, "displayOf");
function contains(longer, shorter) {
  for (let i = 0; i + shorter.length <= longer.length; i++) {
    let match = true;
    for (let j = 0; j < shorter.length; j++) {
      if (longer[i + j] !== shorter[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
__name(contains, "contains");
var round = /* @__PURE__ */ __name((value) => Math.round(value * 1e3) / 1e3, "round");
function pageVocabulary(texts, assignment, groupCount, language, limits = {}) {
  if (!texts.length) return { phrases: [], narrative: [] };
  const stopLanguage = language === void 0 ? pageStopLanguage(texts) : language;
  const runsByPassage = withoutRepeatedSentences(withoutOverlap(texts).map(stripMarkup)).map(
    (text) => contentRuns(text, stopLanguage)
  );
  const rawCounts = /* @__PURE__ */ new Map();
  for (const runs of runsByPassage) {
    for (const run of runs) for (const token of run) rawCounts.set(token, (rawCounts.get(token) ?? 0) + 1);
  }
  const singularOf = /* @__PURE__ */ new Map();
  for (const token of rawCounts.keys()) {
    if (!token.endsWith("s") || token.length < 4) continue;
    const singular = token.slice(0, -1);
    if (rawCounts.has(singular)) singularOf.set(token, singular);
  }
  const fold = /* @__PURE__ */ __name((token) => singularOf.get(token) ?? token, "fold");
  const words = /* @__PURE__ */ new Map();
  const grams = /* @__PURE__ */ new Map();
  runsByPassage.forEach((runs, passage) => {
    const group = assignment[passage] ?? 0;
    for (const raw of runs) {
      const keys = raw.map(fold);
      keys.forEach((key) => tally(words, key, key, passage, group));
      for (let n = 2; n <= PHRASE_MAX_WORDS; n++) {
        for (let i = 0; i + n <= keys.length; i++) {
          const slice = keys.slice(i, i + n);
          if (slice.some((word, j) => j > 0 && word === slice[j - 1])) continue;
          tally(grams, slice.join(" "), raw.slice(i, i + n).join(" "), passage, group, {
            left: keys[i - 1] ?? "",
            right: keys[i + n] ?? ""
          });
        }
      }
    }
  });
  const accepted = /* @__PURE__ */ new Map();
  for (const [key, entry] of grams) {
    if (entry.count < PHRASE_MIN_COUNT) continue;
    if (entry.passages.size < PHRASE_MIN_PASSAGES && entry.count < PHRASE_SINGLE_PASSAGE_COUNT) continue;
    const parts = key.split(" ");
    if (GENERIC_WORDS.has(parts[0]) || GENERIC_WORDS.has(parts[parts.length - 1])) continue;
    const rarest = Math.min(...parts.map((word) => words.get(word)?.count ?? 0));
    if (!rarest || entry.count / rarest < PHRASE_SHARE) continue;
    const extendsSide = /* @__PURE__ */ __name((side) => {
      if (side.size !== 1) return false;
      const [word] = side;
      return word !== "" && !GENERIC_WORDS.has(word);
    }, "extendsSide");
    if (extendsSide(entry.left) || extendsSide(entry.right)) continue;
    accepted.set(key, { tally: entry, words: parts });
  }
  const kept = [...accepted.entries()].filter(([, shorter]) => {
    for (const [, longer] of accepted) {
      if (longer.words.length <= shorter.words.length) continue;
      if (!contains(longer.words, shorter.words)) continue;
      if (shorter.tally.count < SUBSUME_RATIO * longer.tally.count) return false;
    }
    return true;
  });
  const denominator = Math.max(1, groupCount);
  const termOf = /* @__PURE__ */ __name((term, entry, n) => {
    const spread = round(entry.groups / denominator);
    return { term, count: entry.count, groups: entry.groups, spread, scope: spread >= SCOPE_SPREAD, passages: entry.passages, words: n };
  }, "termOf");
  const cohesionOf = /* @__PURE__ */ __name((parts, count) => parts.length * count / Math.max(1, parts.reduce((sum, word) => sum + (words.get(word)?.count ?? 0), 0)), "cohesionOf");
  const ranked = kept.map(([key, { tally: entry, words: parts }]) => ({ key, parts, entry, cohesion: cohesionOf(parts, entry.count) })).sort(
    (a, b) => b.entry.passages.size - a.entry.passages.size || b.entry.count - a.entry.count || b.parts.length - a.parts.length || b.cohesion - a.cohesion || a.key.localeCompare(b.key)
  ).slice(0, limits.phrases ?? PHRASE_LIMIT);
  const phrases = ranked.map(
    ({ key, parts, entry }) => termOf(displayOf(key, entry.surfaces), { count: entry.count, passages: entry.passages.size, groups: entry.groups.size }, parts.length)
  );
  const listed = new Map(ranked.map(({ key, parts }) => [key, parts.length]));
  const alone = /* @__PURE__ */ new Map();
  const inside = /* @__PURE__ */ new Map();
  runsByPassage.forEach((runs, passage) => {
    const group = assignment[passage] ?? 0;
    for (const raw of runs) {
      const keys = raw.map(fold);
      const covered = new Array(keys.length).fill(false);
      for (let n = PHRASE_MAX_WORDS; n >= 2; n--) {
        for (let i = 0; i + n <= keys.length; i++) {
          if (listed.get(keys.slice(i, i + n).join(" ")) === n) {
            for (let j = i; j < i + n; j++) covered[j] = true;
          }
        }
      }
      keys.forEach((key, i) => {
        if (covered[i]) inside.set(key, (inside.get(key) ?? 0) + 1);
        else tally(alone, key, key, passage, group);
      });
    }
  });
  const narrative = [...alone.entries()].filter(([key, entry]) => {
    if (GENERIC_WORDS.has(key) || entry.count < MIN_KEYWORD_COUNT) return false;
    const held = inside.get(key) ?? 0;
    return held === 0 || entry.count >= NARRATIVE_ALONE_RATIO * held;
  }).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0])).slice(0, limits.narrative ?? NARRATIVE_LIMIT).map(([key, entry]) => termOf(key, { count: entry.count, passages: entry.passages.size, groups: entry.groups.size }, 1));
  return { phrases, narrative };
}
__name(pageVocabulary, "pageVocabulary");
function flattenVocabulary(vocabulary) {
  return [...vocabulary.phrases, ...vocabulary.narrative].map(({ term, count, groups, spread, scope }) => ({
    term,
    count,
    groups,
    spread,
    scope
  }));
}
__name(flattenVocabulary, "flattenVocabulary");

// scripts/lib/lens.mjs
var STOP = /* @__PURE__ */ new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "them",
  "their",
  "our",
  "your",
  "my",
  "me",
  "him",
  "her",
  "us",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "any",
  "if",
  "vs",
  "via",
  "per",
  "www",
  "http",
  "https",
  "com",
  "org",
  "net",
  "html",
  "php",
  "asp",
  // Ukrainian: conjunctions and particles
  "і",
  "й",
  "та",
  "а",
  "але",
  "або",
  "чи",
  "що",
  "щоб",
  "як",
  "якщо",
  "коли",
  "бо",
  "тому",
  "хоча",
  "проте",
  "однак",
  "тобто",
  "аби",
  "ні",
  "не",
  "так",
  "ще",
  "вже",
  "уже",
  "лише",
  "тільки",
  "теж",
  "також",
  "навіть",
  "саме",
  "ось",
  "би",
  "б",
  "ж",
  // Ukrainian: prepositions
  "в",
  "у",
  "на",
  "з",
  "із",
  "зі",
  "до",
  "від",
  "по",
  "про",
  "для",
  "без",
  "над",
  "під",
  "при",
  "через",
  "між",
  "за",
  "о",
  "об",
  "після",
  "перед",
  "біля",
  "серед",
  "щодо",
  "поки",
  // Ukrainian: pronouns and determiners
  "я",
  "ти",
  "він",
  "вона",
  "воно",
  "ми",
  "ви",
  "вони",
  "мене",
  "тебе",
  "його",
  "її",
  "їх",
  "нас",
  "вас",
  "них",
  "мені",
  "тобі",
  "йому",
  "їй",
  "нам",
  "вам",
  "їм",
  "себе",
  "мій",
  "моя",
  "моє",
  "мої",
  "твій",
  "твоя",
  "твоє",
  "твої",
  "наш",
  "наша",
  "наше",
  "наші",
  "ваш",
  "ваша",
  "ваше",
  "ваші",
  "свій",
  "своя",
  "своє",
  "свої",
  "свою",
  "їхній",
  "їхня",
  "їхнє",
  "їхні",
  "це",
  "цей",
  "ця",
  "ці",
  "цю",
  "цього",
  "цієї",
  "цих",
  "цьому",
  "цим",
  "той",
  "те",
  "ті",
  "ту",
  "того",
  "тих",
  "тим",
  "який",
  "яка",
  "яке",
  "які",
  "яку",
  "якого",
  "якої",
  "яких",
  "якому",
  "яким",
  "де",
  "куди",
  "чому",
  "весь",
  "вся",
  "все",
  "всі",
  "усі",
  "кожен",
  "кожна",
  "кожне",
  "інший",
  "інша",
  "інше",
  "інші",
  "тут",
  "там",
  // Ukrainian: auxiliaries
  "є",
  "був",
  "була",
  "було",
  "були",
  "бути",
  "буде",
  "будуть",
  "може",
  "можна",
  "треба",
  "дуже",
  "більш",
  "більше",
  "менше"
]);
var STOP_ES_ONLY = /* @__PURE__ */ new Set([
  "que",
  "qué",
  "una",
  "unos",
  "unas",
  "por",
  "pero",
  "más",
  "este",
  "esta",
  "estos",
  "estas",
  "esto",
  "eso",
  "esos",
  "esas",
  "porque",
  "cuando",
  "cuándo",
  "muy",
  "sobre",
  "también",
  "hasta",
  "donde",
  "dónde",
  "desde",
  "durante",
  "todos",
  "todas",
  "toda",
  "otro",
  "otra",
  "otros",
  "otras",
  "ellos",
  "ellas",
  "antes",
  "algunos",
  "algunas",
  "tanto",
  "muchos",
  "muchas",
  "quien",
  "quién",
  "quienes",
  "cual",
  "cuál",
  "cuales",
  "cuáles",
  "poco",
  "estar",
  "nosotros",
  "nosotras",
  "vosotros",
  "vosotras",
  "nuestro",
  "nuestra",
  "nuestros",
  "nuestras",
  "vuestro",
  "vuestra",
  "vuestros",
  "vuestras",
  "está",
  "están",
  "estás",
  "estamos",
  "estoy",
  "fueron",
  "sido",
  "siendo",
  "había",
  "habían",
  "haber",
  "hemos",
  "hubo",
  "tiene",
  "tienen",
  "tengo",
  "tener",
  "tenía",
  "puede",
  "pueden",
  "cómo",
  "usted",
  "ustedes",
  "aquí",
  "allí",
  "así",
  "aunque",
  "cada",
  "mientras",
  "según",
  "tras",
  "hacia",
  "además",
  "entonces",
  "luego",
  "ahora",
  "siempre",
  "nunca",
  "cuánto",
  "cuánta",
  "cuántos",
  "cuántas",
  "mismo",
  "misma",
  "mismos",
  "mismas",
  "pues",
  "aquel",
  "aquella",
  "aquellos",
  "aquellas",
  "ello",
  "él",
  "mí",
  "tú",
  "sí",
  "sólo",
  "eres",
  "somos",
  "sois",
  "éramos",
  "mío",
  "mía",
  "tuyo",
  "tuya",
  "suyo",
  "suya",
  "suyos",
  "suyas"
]);
var STOP_ES_SHARED = /* @__PURE__ */ new Set([
  "de",
  "la",
  "el",
  "en",
  "es",
  "se",
  "lo",
  "le",
  "al",
  "su",
  "mi",
  "tu",
  "te",
  "ti",
  "ya",
  "si",
  "son",
  "era",
  "eran",
  "eras",
  "sin",
  "sea",
  "hay",
  "con",
  "del",
  "ha",
  "han",
  "les",
  "mas",
  "nos",
  "sus",
  "mis",
  "tus",
  "ser",
  "uno",
  "esa",
  "ese",
  "para",
  "yo",
  "os",
  "ni",
  "fue",
  "fui",
  "los",
  "las",
  "como",
  "todo",
  "nada",
  "mucho",
  "algo",
  "ella",
  "ante",
  "solo",
  "sino",
  "un",
  "soy",
  "sean"
]);
var EN_MARKERS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "of",
  "to",
  "is",
  "in",
  "that",
  "it",
  "for",
  "with",
  "are",
  "this",
  "on",
  "you",
  "be",
  "as",
  "by",
  "was",
  "from",
  "have",
  "your",
  "can",
  "will",
  "not",
  "or"
]);
var ES_EVIDENCE = /* @__PURE__ */ new Set(["de", "la", "el", "los", "las", "del", "con", "para"]);
var DETECT_SAMPLE_CHARS = 2e4;
function detectStopLanguage(text) {
  if (!text) return null;
  const sample = text.slice(0, DETECT_SAMPLE_CHARS);
  let spanish = 0;
  let english = 0;
  let only = false;
  for (const word of sample.toLowerCase().split(/[^\p{L}]+/u)) {
    if (!word) continue;
    if (STOP_ES_ONLY.has(word)) {
      spanish += 1;
      only = true;
    } else if (ES_EVIDENCE.has(word)) {
      spanish += 1;
    } else if (EN_MARKERS.has(word)) {
      english += 1;
    }
  }
  if (spanish < 2 || spanish <= english) return null;
  return only || /[ñ¿¡áíóú]/i.test(sample) ? "es" : null;
}
__name(detectStopLanguage, "detectStopLanguage");
function isStopword(token, language = null) {
  if (STOP.has(token) || STOP_ES_ONLY.has(token)) return true;
  return language === "es" && STOP_ES_SHARED.has(token);
}
__name(isStopword, "isStopword");
function tokenize(text, language) {
  if (!text) return [];
  const extra = language === void 0 ? detectStopLanguage(text) : language;
  return text.toLowerCase().replace(/https?:\/\//g, " ").replace(/[^\p{L}\p{N}\s._/-]+/gu, " ").split(/[\s/_.-]+/).map((t) => t.trim()).filter((t) => t.length >= 2 && !isStopword(t, extra) && !/^\d+$/.test(t));
}
__name(tokenize, "tokenize");
var FURNITURE_SOURCE = "\\b(terms of (service|use)|terms and conditions|privacy (policy|notice|statement)|cookie (policy|settings|preferences|consent)|accept (all )?cookies|copyright|all rights reserved|log in|sign in to|create (a |an )?(free )?account|subscribe to our|newsletter)\\b";
var FURNITURE_PHRASE = new RegExp(FURNITURE_SOURCE);
var FURNITURE_PHRASE_ALL = new RegExp(FURNITURE_SOURCE, "g");
var UNTITLED_LABEL = "Untitled section";
function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
__name(titleCase, "titleCase");
function usableLabelTerm(token) {
  if (token.length < 4) return false;
  if (LABEL_STOP.has(token)) return false;
  if (/\d/.test(token)) return false;
  return true;
}
__name(usableLabelTerm, "usableLabelTerm");
function labelGroup(groupTexts, otherTexts, heading, language) {
  const clean = (heading || "").trim();
  if (clean && clean.length <= 80) return clean;
  const stopLanguage = language === void 0 ? pageStopLanguage([...groupTexts, ...otherTexts]) : language;
  const inside = /* @__PURE__ */ new Map();
  for (const text of groupTexts) {
    for (const token of new Set(tokenize(text, stopLanguage))) {
      if (!usableLabelTerm(token)) continue;
      inside.set(token, (inside.get(token) || 0) + 1);
    }
  }
  if (!inside.size) return UNTITLED_LABEL;
  const outside = /* @__PURE__ */ new Map();
  for (const text of otherTexts) {
    for (const token of new Set(tokenize(text, stopLanguage))) {
      outside.set(token, (outside.get(token) || 0) + 1);
    }
  }
  const insideSize = Math.max(1, groupTexts.length);
  const outsideSize = Math.max(1, otherTexts.length);
  const scored = Array.from(inside.entries()).filter(([, count]) => insideSize < 3 ? true : count >= 2).map(([token, count]) => {
    const rateInside = count / insideSize;
    const rateOutside = (outside.get(token) || 0) / outsideSize;
    return { token, score: rateInside / (rateOutside + 0.25) };
  }).sort((a, b) => b.score - a.score || b.token.length - a.token.length || a.token.localeCompare(b.token));
  const picked = scored.slice(0, 2).map((entry) => entry.token);
  if (!picked.length) return "Untitled section";
  return picked.map(titleCase).join(" · ");
}
__name(labelGroup, "labelGroup");
function dominantHeading(headings) {
  const counts = /* @__PURE__ */ new Map();
  for (const heading of headings) {
    const clean = (heading || "").trim();
    if (!clean) continue;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  }
  if (!counts.size) return null;
  let best = "";
  let bestCount = 0;
  for (const [heading, count] of counts) {
    if (count > bestCount) {
      best = heading;
      bestCount = count;
    }
  }
  return bestCount * 2 > headings.length ? best : null;
}
__name(dominantHeading, "dominantHeading");
function labelSourceOf(label, heading) {
  return heading && label === heading ? "heading" : label === UNTITLED_LABEL ? "none" : "keywords";
}
__name(labelSourceOf, "labelSourceOf");
var PREVIEW_CHARS = 240;

// scripts/lib/export.mjs
var VECTORSCOPE_EXPORT_SCHEMA = "getlooploop/vectorscope-reading@1";
var PRODUCED_BY = "vectorscope-skill (local, no embeddings)";
var GROUPING_NOTE = "Grouped by the agent's reading, not by embeddings; groups are a judgement, chunking and the 26-passage cap are the product's exact rules.";
function round2(value) {
  return Math.round(value * 1e3) / 1e3;
}
__name(round2, "round");
function buildVectorscopeExport(page, lens, now = /* @__PURE__ */ new Date()) {
  const indexedChars = lens.groups.reduce((sum, group) => sum + group.charCount, 0);
  const exportedChars = lens.chunks.reduce((sum, chunk) => sum + (chunk.preview?.length || 0), 0);
  const share = indexedChars > 0 ? exportedChars / indexedChars : 0;
  const sharePercent = Math.round(share * 100);
  const headingsPresent = lens.chunks.some((chunk) => Boolean(chunk.heading));
  return {
    schema: VECTORSCOPE_EXPORT_SCHEMA,
    generatedAt: now.toISOString(),
    producedBy: {
      tool: PRODUCED_BY,
      what: `One page, put through the GetLoopLoop Vectorscope's fetch, extract and chunk steps locally, with the product's 26-passage cap, and no embedding step. ${GROUPING_NOTE}`,
      url: "https://www.getlooploop.com/vectorscope"
    },
    howToRead: {
      grouping: `${GROUPING_NOTE} The product groups passages by average-link clustering over embedding similarity; here the passages were read and grouped by subject instead, so two runs can group the same page differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.`,
      unitOfAnalysis: "A chunk is one passage as the pipeline split it — roughly 2000 characters, following the page's own headings where it has them. Chunks overlap by about 200 characters, so their lengths sum to more than the page.",
      textHead: `Only the first 240 characters of each chunk are included. Across this page that is ${exportedChars} of ${indexedChars} indexed characters, about ${sharePercent}%, and always the opening of each passage rather than a sample spread through it.`,
      phrases: "Counted over the page's whole text, not the excerpts below. A phrase is two to four content words the page writes side by side — never across a stopword, punctuation or a number — at least twice and in at least two passages (or three times in one), and cohesive enough that the words are not merely neighbours. A shorter phrase nearly always inside a longer one is folded into it. Ranked by `passages` (how many distinct passages use it), then `count`. `groups` is how many of the page's groups it reaches and `describesWholePage` is true when it reaches most of them. These are what the page says, not search demand: nothing here measures how often anybody searches or asks for them. The group counts rest on the grouping above, which is a judgement.",
      narrativeWords: "Single words, counted only where none of the listed phrases already used them, so the occurrences still add up. Reporting verbs, connectives and markup residue ([edit] links, TeX) are left out. They say what the page talks about; they are rarely what anybody types or asks.",
      keywords: "`phrases` followed by `narrativeWords` as one list, in the shape earlier exports had. Prefer the two lists above.",
      agentLabel: "v2: the name the agent gave the group after reading it, or null. It is a judgement, like the grouping; `label` and `labelSource` are the computed label as in v1.",
      groupLabels: headingsPresent ? '`labelSource` says where each name came from. "heading" is the page\'s own section heading and can be quoted. "keywords" is a computed guess — the group\'s most distinctive words — and is a hint, not a topic; do not quote it back as what the section is called.' : "Every `labelSource` here is \"keywords\": a computed guess at the group's most distinctive two words, not a heading the page carries. Treat it as a hint and never quote it as the section's name.",
      cohesion: "null: cohesion is the mean cosine between a group's passage embeddings, and no embeddings were computed.",
      selfSimilarity: "null: the median cosine between passages needs embeddings, and none were computed.",
      groupFloor: "null: there was no similarity cut; the groups are a reading of the passages.",
      duplicateOf: "The index of an earlier, non-adjacent chunk this one repeats nearly word for word, as judged by reading — the product judges it from embeddings at cosine 0.94. The chunker's own overlap between neighbours is excluded.",
      projectionExplained: "null: there is no projection without vectors.",
      whatCapReachedMeans: page.chunkCap ? `The pipeline indexes at most ${page.chunkCap} chunks per page. \`capReached\` true with \`charsUnread\` above zero means an assistant reading this page never sees that tail.` : "`capReached` true with `charsUnread` above zero means the page has a tail the pipeline never indexed, which an assistant reading this page never sees.",
      noindex: "True when the page asks search engines not to index it. Says nothing about whether an assistant can read it, but it is often unintentional."
    },
    // What this reading cannot answer, plus one line about the grouping.
    cannotAnswer: [
      `Sentiment or tone of the page. Only about ${sharePercent}% of the text is here, taken from the opening of each passage — enough to produce a confident-sounding verdict from an unrepresentative sample. If asked, say what the sample supports and that it is a sample.`,
      "Anything about competitors, or how this page compares to another. One page was read; no other page was fetched.",
      "Which search or assistant prompts this page ranks or gets cited for. That needs a query inventory and measurement over time, neither of which is in this export.",
      "How often people search for or ask about any phrase listed here. The counts are how often the page says them, not demand.",
      "Whether the page is factually correct, current, or original. Nothing here checked any claim on it.",
      "How the page renders for a browser running JavaScript. This is a plain fetch, which is also what an assistant that does not run JavaScript sees.",
      "How close any two passages are in an embedding space, or whether any assistant has indexed this page. No embeddings were computed, and this is a preview of the machine's view, not a guarantee of what any assistant does with it."
    ],
    suggestedPrompt: 'This is a retrieval read-out of one web page. Using it, tell me: (1) what this page is about — lean on `phrases` first, and on those where `describesWholePage` is true most, since they are counted over the full text rather than the excerpts — group by group, naming groups only where labelSource is "heading"; (2) what someone asking an assistant about this subject would find here, and what they would not; (3) what to change first, ordered by how much it would change what an assistant retrieves — cite the chunk indexes or group ids your answer rests on. Where the payload\'s cannotAnswer list says the data does not support a claim, say so instead of estimating.',
    page: {
      url: page.url,
      requestedUrl: page.requestedUrl,
      title: page.title,
      wordCount: page.wordCount,
      headingsFound: page.headings,
      noindex: page.noindex
    },
    retrieval: {
      embeddingModel: null,
      dimensions: null,
      chunkCap: page.chunkCap ?? null,
      chunksIndexed: page.chunksIndexed,
      charsIndexed: page.charsIndexed,
      charsUnread: page.charsUnread,
      capReached: page.capReached,
      duplicateChunks: lens.duplicates,
      // The product counts groups its clustering was forced to merge past six; a judged grouping has no such count.
      groupsMergedByPaletteLimit: null
    },
    textCoverage: { exportedChars, indexedChars, share: round2(share) },
    geometry: {
      selfSimilarity: null,
      groupFloor: null,
      projectionExplained: null,
      projectionBasis: null
    },
    phrases: Array.isArray(lens.phrases) ? lens.phrases.map(exportTerm) : [],
    narrativeWords: Array.isArray(lens.narrative) ? lens.narrative.map(exportTerm) : [],
    keywords: Array.isArray(lens.keywords) ? lens.keywords.map((keyword) => ({
      term: keyword.term,
      count: keyword.count,
      groups: keyword.groups,
      spread: keyword.spread,
      describesWholePage: keyword.scope
    })) : [],
    groups: lens.groups.map((group) => ({
      id: group.id,
      label: group.label,
      labelSource: group.labelSource ?? "unstated",
      chunkCount: group.chunkCount,
      charCount: group.charCount,
      shareOfIndexedChars: indexedChars > 0 ? round2(group.charCount / indexedChars) : 0,
      cohesion: null,
      // v2, additive: the agent's own name and note for the group, and its shared topic in
      // compare mode. `label` keeps its v1 meaning (the computed heading/keyword label).
      agentLabel: group.agentLabel ?? null,
      note: group.note ?? null,
      topic: group.topic ?? null
    })),
    chunks: lens.chunks.map((chunk) => ({
      index: chunk.chunkIndex,
      group: chunk.group,
      heading: chunk.heading ?? null,
      charCount: chunk.charCount,
      duplicateOf: chunk.duplicateOf,
      textHead: chunk.preview
    }))
  };
}
__name(buildVectorscopeExport, "buildVectorscopeExport");
function exportTerm(term) {
  return {
    term: term.term,
    count: term.count,
    passages: term.passages,
    groups: term.groups,
    spread: term.spread,
    describesWholePage: term.scope
  };
}
__name(exportTerm, "exportTerm");
function vectorscopeExportName(page) {
  let slug = "page";
  try {
    const parsed = new URL(page.url);
    slug = `${parsed.hostname}${parsed.pathname}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  } catch {
  }
  return `vectorscope-${slug.slice(0, 80) || "page"}.json`;
}
__name(vectorscopeExportName, "vectorscopeExportName");

// scripts/lib/refusal.mjs
var REFUSAL_CODE = "refused_language_ru";
var PROSECUTOR_FIGURES_AS_OF = "2025-11-05";
var REFUSAL_COPY = {
  title: { en: "This page was not analysed", uk: "Цю сторінку не проаналізовано" },
  lead: {
    en: "Vectorscope does not analyse pages written in Russian. This is the publisher's decision, made because of Russia's war against Ukraine. These are the findings it rests on:",
    uk: "Vectorscope не аналізує сторінки російською мовою. Це рішення автора інструмента через війну Росії проти України. Воно спирається на такі висновки:"
  },
  sanctionsLabel: { en: "Sanctions", uk: "Санкції" },
  sanctions: {
    en: "If this site is operated by people or companies in Russia, it may be subject to sanctions. Check the official lists:",
    uk: "Якщо сайт належить особам чи компаніям у Росії, він може підпадати під санкції. Перевірте офіційні списки:"
  },
  lastLine: {
    en: "If the site has a version in another language, run that URL instead.",
    uk: "Якщо сайт має версію іншою мовою, запустіть її адресу."
  }
};
var FINDINGS = [
  {
    id: "unga",
    source: { en: "United Nations General Assembly", uk: "Генеральна Асамблея ООН" },
    items: [
      {
        id: "es-11-1",
        text: {
          en: "Deplored Russia's aggression against Ukraine and demanded the withdrawal of its forces: **141 states in favour, 5 against, 35 abstentions** (resolution ES-11/1, 2 March 2022).",
          uk: "Засудила агресію Росії проти України й вимагала вивести її війська: **141 держава «за», 5 «проти», 35 утрималися** (резолюція ES-11/1, 2 березня 2022 р.)."
        },
        url: "https://news.un.org/en/story/2022/03/1113152"
      },
      {
        id: "es-11-4",
        text: {
          en: "Declared the attempted annexation of four Ukrainian regions invalid: **143 in favour, 5 against, 35 abstentions** (resolution ES-11/4, 12 October 2022).",
          uk: "Визнала недійсною спробу анексії чотирьох областей України: **143 «за», 5 «проти», 35 утрималися** (резолюція ES-11/4, 12 жовтня 2022 р.)."
        },
        url: "https://news.un.org/en/story/2022/10/1129492"
      }
    ]
  },
  {
    id: "europarl",
    source: { en: "European Parliament", uk: "Європейський парламент" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: "recognised Russia as a **state sponsor of terrorism** (494 votes to 58, 23 November 2022).",
      uk: "визнав Росію **державою — спонсором тероризму** (494 голоси проти 58, 23 листопада 2022 р.)."
    },
    url: "https://www.europarl.europa.eu/news/en/press-room/20221118IPR55707/european-parliament-declares-russia-to-be-a-state-sponsor-of-terrorism"
  },
  {
    id: "icc",
    source: { en: "International Criminal Court", uk: "Міжнародний кримінальний суд" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: "issued arrest warrants for Vladimir Putin and Maria Lvova-Belova for the **war crime of unlawfully deporting Ukrainian children** (17 March 2023).",
      uk: "видав ордери на арешт Володимира Путіна та Марії Львової-Бєлової за **воєнний злочин — незаконну депортацію українських дітей** (17 березня 2023 р.)."
    },
    url: "https://www.icc-cpi.int/news/situation-ukraine-icc-judges-issue-arrest-warrants-against-vladimir-vladimirovich-putin-and"
  },
  {
    id: "coi",
    source: { en: "UN Commission of Inquiry on Ukraine", uk: "Комісія ООН з розслідування щодо України" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: 'found that enforced disappearances of civilians by Russian authorities were "widespread and systematic" and amount to **crimes against humanity**, as does its torture of detainees (March 2025).',
      uk: "встановила, що насильницькі зникнення цивільних, які чинить російська влада, «масові й систематичні» і є **злочинами проти людяності**, як і катування утримуваних (березень 2025 р.)."
    },
    url: "https://news.un.org/en/story/2025/03/1161281"
  },
  {
    id: "pgo",
    source: { en: "Office of the Prosecutor General of Ukraine", uk: "Офіс Генерального прокурора України" },
    joiner: { en: ": ", uk: ": " },
    asOf: PROSECUTOR_FIGURES_AS_OF,
    text: {
      en: "**over 190,000 war crimes** registered since the full-scale invasion, **747 indictments** sent to court and **206 people convicted** (5 November 2025).",
      uk: "зареєстровано **понад 190 000 воєнних злочинів** від початку повномасштабного вторгнення, **747 обвинувальних актів** скеровано до суду, **206 осіб засуджено** (5 листопада 2025 р.)."
    },
    url: "https://gp.gov.ua/en/posts/ponad-190-tisyac-vojennix-zlociniv-ofis-genprokurora-predstaviv-komisiyi-oon-masstabi-zlociniv-rf-proti-ukrayini"
  }
];
var SANCTIONS_LINKS = [
  { id: "eu", name: "EU Sanctions Map", url: "https://sanctionsmap.eu" },
  { id: "ofac", name: "US OFAC Sanctions List Search", url: "https://sanctionssearch.ofac.treas.gov" }
];

// scripts/lib/i18n.mjs
var fmtN = /* @__PURE__ */ __name((n) => Number(n).toLocaleString("en-US"), "fmtN");
var fmtUk = /* @__PURE__ */ __name((n) => Number(n).toLocaleString("en-US").replace(/,/g, " "), "fmtUk");
var en = /* @__PURE__ */ __name((n, one, many) => `${fmtN(n)} ${n === 1 ? one : many}`, "en");
function ukForm(n, one, few, many) {
  const abs = Math.abs(Number(n));
  const d10 = abs % 10;
  const d100 = abs % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}
__name(ukForm, "ukForm");
var uk = /* @__PURE__ */ __name((n, one, few, many) => `${fmtUk(n)} ${ukForm(n, one, few, many)}`, "uk");
var pct = /* @__PURE__ */ __name((x) => `${Math.round(x * 1e3) / 10}%`, "pct");
var S = {
  // ── chrome
  eyebrow: { en: "Vectorscope · local reading", uk: "Vectorscope · локальне читання" },
  eyebrowCompare: { en: "Vectorscope · comparison", uk: "Vectorscope · порівняння" },
  themeGroup: { en: "Theme", uk: "Тема" },
  dark: { en: "Dark", uk: "Темна" },
  light: { en: "Light", uk: "Світла" },
  langGroup: { en: "Language", uk: "Мова" },
  askedFor: { en: /* @__PURE__ */ __name((v) => `Asked for ${v.url}, redirected here.`, "en"), uk: /* @__PURE__ */ __name((v) => `Запитано ${v.url}, переспрямовано сюди.`, "uk") },
  words: { en: /* @__PURE__ */ __name((v) => `<b>${fmtN(v.n)}</b> words`, "en"), uk: /* @__PURE__ */ __name((v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "слово", "слова", "слів")}`, "uk") },
  headingsFound: { en: /* @__PURE__ */ __name((v) => `<b>${fmtN(v.n)}</b> headings found`, "en"), uk: /* @__PURE__ */ __name((v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "заголовок", "заголовки", "заголовків")}`, "uk") },
  noindexYes: { en: "<b>noindex</b>: the page asks search engines not to index it", uk: "<b>noindex</b>: сторінка просить пошуковики її не індексувати" },
  noindexNo: { en: "noindex <b>no</b>", uk: "noindex <b>ні</b>" },
  // ── how to read this report: three different claims, kept apart
  infoAria: { en: "How to read this report", uk: "Як читати цей звіт" },
  infoSameTitle: { en: "Same for everyone", uk: "Однаково для всіх" },
  infoSameBody: {
    en: /* @__PURE__ */ __name((v) => `The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the ${v.cap}-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Завантаження, видобування тексту, нарізання (за заголовками h2, далі вікнами по 2 000 символів), ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, robots.txt і автоматичні перевірки виконують скрипти: результат однаковий, хоч би яка модель запускала навичку.`, "uk")
  },
  infoJudgeTitle: { en: "Your model's judgement", uk: "Судження вашої моделі" },
  infoJudgeBody: {
    en: /* @__PURE__ */ __name((v) => `The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (${v.by}). Another model may group a little differently. For the embedding-based reading with the map, run the page at ${v.link}.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Групи, їхні назви, план переписування, тест запитів і факти — це прочитання моделі, яка запустила цю навичку (${v.by}). Інша модель може згрупувати трохи інакше. Читання на ембедингах із картою — на ${v.link}.`, "uk")
  },
  // agent and model arrive HTML-safe; either may be null, and then it is said, never guessed.
  infoBy: {
    en: /* @__PURE__ */ __name((v) => [v.model ? `model: <b>${v.model}</b>` : "model not stated by the agent", v.agent ? `agent: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "), "en"),
    uk: /* @__PURE__ */ __name((v) => [v.model ? `модель: <b>${v.model}</b>` : "агент не вказав модель", v.agent ? `агент: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "), "uk")
  },
  infoByPage: { en: /* @__PURE__ */ __name((v) => `page ${v.n}: ${v.by}`, "en"), uk: /* @__PURE__ */ __name((v) => `сторінка ${v.n}: ${v.by}`, "uk") },
  infoNotTitle: { en: "Not any assistant's pipeline", uk: "Не конвеєр жодного асистента" },
  infoNotBody: {
    en: /* @__PURE__ */ __name((v) => `ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the ${v.cap}-passage cap is this tool's.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `ChatGPT, Gemini, Perplexity, Copilot та інші мають власні краулери, власне нарізання й ембединги і не публікують їх. Принцип той самий (завантаження → текст → уривки → пошук), деталі різняться. Це читання — робоча модель типового ретривера, а не копія котрогось із них; ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")} — правило цього інструмента.`, "uk")
  },
  // ── the refusal (its copy lives in refusal.mjs)
  refusalTitle: REFUSAL_COPY.title,
  refusedTag: { en: "not analysed", uk: "не проаналізовано" },
  // ── blocked banner
  bannerTitle: { en: "AI crawlers are blocked from this page", uk: "ШІ-краулерам закрито доступ до цієї сторінки" },
  bannerBody: {
    en: /* @__PURE__ */ __name((v) => `robots.txt disallows this path for ${v.bots}. Those assistants cannot fetch the page for search or for a user's question, so everything below is moot for them until the rule changes.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `robots.txt забороняє цей шлях для ${v.bots}. Ці асистенти не можуть завантажити сторінку ні для пошуку, ні на запит користувача, тож усе нижче для них не має значення, доки правило не зміниться.`, "uk")
  },
  bannerUnreachable: {
    en: "robots.txt could not be read (a server error or no answer). RFC 9309 tells a crawler to assume it may fetch nothing in that case, so compliant AI crawlers treat the whole site as blocked until robots.txt answers.",
    uk: "robots.txt не вдалося прочитати (помилка сервера або немає відповіді). За RFC 9309 краулер у такому разі вважає, що не може завантажувати нічого, тож сумлінні ШІ-краулери вважають увесь сайт закритим, доки robots.txt не відповість."
  },
  // ── result
  result: { en: "Result", uk: "Результат" },
  whatMachineReads: { en: "what the machine reads", uk: "що читає машина" },
  fetched: { en: "Fetched", uk: "Завантажено" },
  extracted: { en: "Extracted", uk: "Видобуто" },
  chunked: { en: "Chunked", uk: "Нарізано" },
  grouped: { en: "Grouped", uk: "Згруповано" },
  nWords: { en: /* @__PURE__ */ __name((v) => en(v.n, "word", "words"), "en"), uk: /* @__PURE__ */ __name((v) => uk(v.n, "слово", "слова", "слів"), "uk") },
  nPassages: { en: /* @__PURE__ */ __name((v) => en(v.n, "passage", "passages"), "en"), uk: /* @__PURE__ */ __name((v) => uk(v.n, "уривок", "уривки", "уривків"), "uk") },
  nGroups: { en: /* @__PURE__ */ __name((v) => en(v.n, "group", "groups"), "en"), uk: /* @__PURE__ */ __name((v) => uk(v.n, "група", "групи", "груп"), "uk") },
  pipelineNote: {
    en: /* @__PURE__ */ __name((v) => `${fmtN(v.headings)} headings · ${fmtN(v.chars)} characters indexed · ${en(v.repeats, "repeat", "repeats")} · grouped by reading, no embedding step`, "en"),
    uk: /* @__PURE__ */ __name((v) => `${uk(v.headings, "заголовок", "заголовки", "заголовків")} · ${uk(v.chars, "символ", "символи", "символів")} в індексі · ${uk(v.repeats, "повтор", "повтори", "повторів")} · групування читанням, без ембедингів`, "uk")
  },
  passagesRead: { en: "passages read", uk: "уривків прочитано" },
  slotsUsed: { en: /* @__PURE__ */ __name((v) => `slots used of the ${v.cap}-passage cap${v.full ? ": every slot filled" : ""}`, "en"), uk: /* @__PURE__ */ __name((v) => `місць зайнято з ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}${v.full ? ": усі місця зайняті" : ""}`, "uk") },
  pastCap: { en: "characters past the cap (0 when the page fits)", uk: "символів за лімітом (0, коли сторінка вміщується)" },
  // ── strip
  strip: { en: "The reading strip", uk: "Смуга читання" },
  stripSub: { en: /* @__PURE__ */ __name((v) => `one cell per passage, in reading order, inside the ${v.cap}-slot cap`, "en"), uk: /* @__PURE__ */ __name((v) => `одна клітинка на уривок, у порядку читання, у межах ліміту в ${v.cap} місць`, "uk") },
  stripAria: { en: /* @__PURE__ */ __name((v) => `Passages inside the ${v.cap}-passage cap`, "en"), uk: /* @__PURE__ */ __name((v) => `Уривки в межах ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}`, "uk") },
  pastCapShort: { en: "characters past the cap", uk: "символів за лімітом" },
  notRead: { en: "not read", uk: "не прочитано" },
  cap: { en: "cap", uk: "ліміт" },
  readoutIdle: {
    en: "Hover or focus a cell to see its passage, heading and group. Striped cells are side-path content. Select a cell to jump to the passage.",
    uk: "Наведіть курсор або перейдіть на клітинку, щоб побачити її уривок, заголовок і групу. Смугасті клітинки — побічний вміст. Натисніть клітинку, щоб перейти до уривка."
  },
  noHeading: { en: "no heading", uk: "без заголовка" },
  group: { en: "group", uk: "група" },
  chars: { en: "chars", uk: "симв." },
  cellTip: {
    en: /* @__PURE__ */ __name((v) => `<b>#${v.i}</b> · ${v.heading} · group ${v.g}: <b>${v.label}</b> · ${fmtN(v.chars)} chars${v.role}`, "en"),
    uk: /* @__PURE__ */ __name((v) => `<b>#${v.i}</b> · ${v.heading} · група ${v.g}: <b>${v.label}</b> · ${fmtUk(v.chars)} симв.${v.role}`, "uk")
  },
  cellAria: {
    en: /* @__PURE__ */ __name((v) => `Passage ${v.i}, ${v.heading}, group ${v.g}: ${v.label}, ${v.chars} characters${v.role}`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Уривок ${v.i}, ${v.heading}, група ${v.g}: ${v.label}, ${v.chars} символів${v.role}`, "uk")
  },
  roleMain: { en: "main", uk: "основний" },
  roleRelated: { en: "related", uk: "пов’язане" },
  roleUtility: { en: "utility", uk: "службове" },
  // ── checks
  checks: { en: "Checks", uk: "Перевірки" },
  checksSub: { en: "automatic, ranked by severity; each names the passages it rests on", uk: "автоматичні, за важливістю; кожна називає уривки, на яких ґрунтується" },
  aiCrawlers: { en: "AI crawlers and robots.txt", uk: "ШІ-краулери і robots.txt" },
  robotsFor: { en: /* @__PURE__ */ __name((v) => `rules for the path ${v.path}`, "en"), uk: /* @__PURE__ */ __name((v) => `правила для шляху ${v.path}`, "uk") },
  colCrawler: { en: "Crawler", uk: "Краулер" },
  colVendor: { en: "Vendor", uk: "Компанія" },
  colPurpose: { en: "What it does", uk: "Що робить" },
  colVerdict: { en: "This page", uk: "Ця сторінка" },
  colRule: { en: "Deciding rule", uk: "Вирішальне правило" },
  allowed: { en: "allowed", uk: "дозволено" },
  blocked: { en: "blocked", uk: "заблоковано" },
  noRule: { en: "no rule matches", uk: "жодне правило не підходить" },
  groupStar: { en: "via *", uk: "через *" },
  kindSearch: { en: "search index for the assistant", uk: "пошуковий індекс асистента" },
  kindUser: { en: "fetches when a user asks", uk: "завантажує на запит користувача" },
  kindTraining: { en: "collects training data", uk: "збирає дані для навчання" },
  kindIndex: { en: "web search index assistants answer from", uk: "вебіндекс, з якого відповідають асистенти" },
  mayIgnore: { en: "the vendor says robots.txt may not apply to it", uk: "компанія зазначає, що robots.txt може на нього не діяти" },
  robotsNone: { en: /* @__PURE__ */ __name((v) => `No robots.txt (HTTP ${v.status}): nothing is disallowed.`, "en"), uk: /* @__PURE__ */ __name((v) => `robots.txt немає (HTTP ${v.status}): нічого не заборонено.`, "uk") },
  robotsNotChecked: { en: "robots.txt was not checked in this run (a saved page, or --no-robots).", uk: "robots.txt у цьому запуску не перевірявся (збережена сторінка або --no-robots)." },
  robotsSource: { en: /* @__PURE__ */ __name((v) => `Read from ${v.url}. Groups matched by product token, case-insensitively; longest matching rule wins, Allow wins a tie (RFC 9309).`, "en"), uk: /* @__PURE__ */ __name((v) => `Прочитано з ${v.url}. Групи зіставлено за токеном продукту без огляду на регістр; перемагає найдовше правило, за рівної довжини — Allow (RFC 9309).`, "uk") },
  technical: { en: "Technical markup", uk: "Технічна розмітка" },
  jsonLd: { en: "Structured data (JSON-LD)", uk: "Структуровані дані (JSON-LD)" },
  jsonLdNone: { en: "none", uk: "немає" },
  jsonLdInvalid: { en: /* @__PURE__ */ __name((v) => `${v.n} block(s) not valid JSON`, "en"), uk: /* @__PURE__ */ __name((v) => `блоків з невалідним JSON: ${v.n}`, "uk") },
  canonical: { en: "Canonical", uk: "Canonical" },
  canonicalMissing: { en: "missing", uk: "немає" },
  canonicalSelf: { en: "points to this page", uk: "вказує на цю сторінку" },
  canonicalOther: { en: "points to another URL", uk: "вказує на іншу адресу" },
  canonicalRelative: { en: "relative", uk: "відносна адреса" },
  metaDescription: { en: "Meta description", uk: "Meta description" },
  metaChars: { en: /* @__PURE__ */ __name((v) => `${v.n} characters`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.n} ${ukForm(v.n, "символ", "символи", "символів")}`, "uk") },
  metaNone: { en: "missing", uk: "немає" },
  render: { en: "With JavaScript", uk: "З JavaScript" },
  renderDone: {
    en: /* @__PURE__ */ __name((v) => `${fmtN(v.js)} words and ${v.jsp} passages with JavaScript, against ${fmtN(v.plain)} words and ${v.plainp} passages from the plain fetch. The reading above is the plain fetch.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `${uk(v.js, "слово", "слова", "слів")} і ${uk(v.jsp, "уривок", "уривки", "уривків")} з JavaScript проти ${uk(v.plain, "слова", "слів", "слів")} і ${uk(v.plainp, "уривка", "уривків", "уривків")} у звичайному завантаженні. Читання вище — звичайне завантаження.`, "uk")
  },
  renderNoBrowser: { en: "Not rendered: no local Chrome or Chromium was found (set CHROME_PATH).", uk: "Не відрендерено: локальний Chrome чи Chromium не знайдено (задайте CHROME_PATH)." },
  renderFailed: { en: /* @__PURE__ */ __name((v) => `Not rendered: the browser run failed (${v.reason}).`, "en"), uk: /* @__PURE__ */ __name((v) => `Не відрендерено: запуск браузера не вдався (${v.reason}).`, "uk") },
  findings: { en: "Findings", uk: "Знахідки" },
  noFindings: { en: "No automatic check found anything on this page.", uk: "Автоматичні перевірки нічого не знайшли на цій сторінці." },
  sevHigh: { en: "high", uk: "високий" },
  sevMedium: { en: "medium", uk: "середній" },
  sevLow: { en: "low", uk: "низький" },
  sevInfo: { en: "info", uk: "довідка" },
  passagesLabel: { en: "Passages", uk: "Уривки" },
  whatToDo: { en: "What to do", uk: "Що зробити" },
  // ── plan
  plan: { en: "Rewrite plan", uk: "План переписування" },
  planSub: { en: "the agent's judgement, in priority order; every passage must stand on its own, because a retriever sees it alone", uk: "судження агента, за пріоритетом; кожен уривок має бути самодостатнім, бо ретривер бачить його окремо" },
  problem: { en: "Problem", uk: "Проблема" },
  fix: { en: "Fix", uk: "Виправлення" },
  before: { en: "Before", uk: "Було" },
  after: { en: "After", uk: "Стало" },
  page: { en: "page", uk: "сторінка" },
  pageN: { en: /* @__PURE__ */ __name((v) => `Page ${v.n}`, "en"), uk: /* @__PURE__ */ __name((v) => `Сторінка ${v.n}`, "uk") },
  // ── queries
  queries: { en: "Query test", uk: "Тест запитів" },
  queriesSub: { en: "the agent's judgement: for each typical query, the best passage and whether it answers on its own", uk: "судження агента: для кожного типового запиту — найкращий уривок і чи відповідає він сам по собі" },
  colQuery: { en: "Query", uk: "Запит" },
  colBest: { en: "Best passage", uk: "Найкращий уривок" },
  colAnswer: { en: "Answer", uk: "Відповідь" },
  colCitable: { en: "Citable", uk: "Цитовне" },
  colQuote: { en: "The words that answer", uk: "Слова, що відповідають" },
  srcUser: { en: "your query", uk: "ваш запит" },
  srcGenerated: { en: "written by the agent", uk: "запит від агента" },
  vComplete: { en: "complete", uk: "повна" },
  vPartial: { en: "partial", uk: "часткова" },
  vMissing: { en: "missing", uk: "немає" },
  yes: { en: "yes", uk: "так" },
  no: { en: "no", uk: "ні" },
  querySummary: {
    en: /* @__PURE__ */ __name((v) => `${v.complete} of ${v.total} queries answered completely, ${v.partial} partly, ${v.missing} not at all; ${v.citable} with a citable passage.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Повна відповідь: ${v.complete} з ${v.total}, часткова: ${v.partial}, немає: ${v.missing}; придатний до цитування уривок: ${v.citable}.`, "uk")
  },
  winners: { en: "Who wins each query", uk: "Хто виграє кожен запит" },
  colWinner: { en: "Winner", uk: "Переможець" },
  citableMark: { en: "citable", uk: "цитовне" },
  tie: { en: "tie", uk: "нічия" },
  nobody: { en: "nobody answers", uk: "ніхто не відповідає" },
  // ── groups
  groupsTitle: { en: "The groups this page falls into", uk: "Групи, на які розпадається сторінка" },
  groupsSub: { en: /* @__PURE__ */ __name((v) => `${en(v.n, "group", "groups")}, by the agent's reading`, "en"), uk: /* @__PURE__ */ __name((v) => `${uk(v.n, "група", "групи", "груп")}, за прочитанням агента`, "uk") },
  groupN: { en: /* @__PURE__ */ __name((v) => `Group ${v.n}`, "en"), uk: /* @__PURE__ */ __name((v) => `Група ${v.n}`, "uk") },
  labelSource: { en: "label source", uk: "джерело мітки" },
  srcHeading: { en: "heading", uk: "заголовок" },
  srcKeywords: { en: "keywords (a hint)", uk: "ключові слова (підказка)" },
  srcNone: { en: "no label", uk: "без мітки" },
  srcHeadingTitle: { en: "The page's own section heading", uk: "Власний заголовок розділу сторінки" },
  srcKeywordsTitle: { en: "The group's two most distinctive words: a hint, not the section's name", uk: "Два найхарактерніші слова групи: підказка, а не назва розділу" },
  ofIndexed: { en: "of the indexed text", uk: "індексованого тексту" },
  groupsExplain: {
    en: "The large name is the agent's label for the group. Under it, the <b>label source</b>: a <b>heading</b> is the page's own section heading and can be quoted; <b>keywords</b> are the group's two most distinctive words, a hint and not what the section is called.",
    uk: "Велика назва — мітка групи від агента. Під нею <b>джерело мітки</b>: <b>заголовок</b> — власний заголовок розділу сторінки, його можна цитувати; <b>ключові слова</b> — два найхарактерніші слова групи, підказка, а не назва розділу."
  },
  // ── passages
  passagesTitle: { en: "Passages, by group", uk: "Уривки за групами" },
  passagesSub: { en: /* @__PURE__ */ __name((v) => `in reading order inside each group; each opens with its first ${v.n} characters`, "en"), uk: /* @__PURE__ */ __name((v) => `у порядку читання всередині групи; кожен показано першими ${v.n} символами`, "uk") },
  showFull: { en: "Show the full passage", uk: "Показати весь уривок" },
  repeats: { en: /* @__PURE__ */ __name((v) => `repeats #${v.n}`, "en"), uk: /* @__PURE__ */ __name((v) => `повторює #${v.n}`, "uk") },
  outsideCap: {
    en: /* @__PURE__ */ __name((v) => `<b>Outside cap: ${fmtN(v.n)} characters</b> at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `<b>За лімітом: ${uk(v.n, "символ", "символи", "символів")}</b> наприкінці сторінки. Це не уривки цього читання: звідти нічого не можна дістати.`, "uk")
  },
  // ── side path / keywords
  sideTitle: { en: "Side-path content", uk: "Побічний вміст" },
  sideSome: { en: /* @__PURE__ */ __name((v) => `${en(v.n, "passage looks", "passages look")} like related links or utility copy; they are still indexed.`, "en"), uk: /* @__PURE__ */ __name((v) => `${uk(v.n, "уривок схожий", "уривки схожі", "уривків схожі")} на пов’язані посилання чи службовий текст; їх однаково проіндексовано.`, "uk") },
  sideNone: { en: "No passage looks like related links or utility copy.", uk: "Жоден уривок не схожий на пов’язані посилання чи службовий текст." },
  relatedLink: { en: "related link", uk: "пов’язане посилання" },
  utilityCopy: { en: "utility copy", uk: "службовий текст" },
  kwTitle: { en: "The page's vocabulary", uk: "Словник сторінки" },
  kwHonest: {
    en: /* @__PURE__ */ __name((v) => `What the page says, not search demand — for how people ask, use the query test or ${v.link}.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Це те, що каже сторінка, а не пошуковий попит. Як питають люди — покаже тест запитів або ${v.link}.`, "uk")
  },
  phrasesTitle: { en: "Phrases this page owns", uk: "Фрази, що належать цій сторінці" },
  phrasesNote: {
    en: "Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses. A highlighted phrase reaches most of the page's groups.",
    uk: "Від двох до чотирьох слів, які сторінка пише разом, щонайменше у двох уривках (або тричі в одному), ніколи через розділовий знак чи службове слово. Порядок — за кількістю уривків, далі за вживаннями. Виділена фраза охоплює більшість груп сторінки."
  },
  narrativeTitle: { en: "Narrative words", uk: "Слова розповіді" },
  narrativeNote: {
    en: "Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.",
    uk: "Окремі слова, пораховані лише там, де їх не використала жодна фраза вище. Вони кажуть, про що говорить сторінка; але люди рідко саме так пишуть чи питають."
  },
  noPhrases: { en: "No phrase is written often enough to count.", uk: "Жодну фразу не написано достатньо часто, щоб її врахувати." },
  none: { en: "None.", uk: "Немає." },
  kwTitleAttr: {
    en: /* @__PURE__ */ __name((v) => `${v.count} uses, in ${v.passages} passages and ${v.groups} of ${v.total} groups`, "en"),
    uk: /* @__PURE__ */ __name((v) => `вживань: ${v.count}, уривків: ${v.passages}, груп: ${v.groups} з ${v.total}`, "uk")
  },
  // ── facts
  facts: { en: "Citable facts", uk: "Факти для цитування" },
  factsSub: { en: "the agent's list of the concrete facts, figures and claims the passages state", uk: "перелік конкретних фактів, чисел і тверджень з уривків, складений агентом" },
  colFact: { en: "Fact", uk: "Факт" },
  stated: { en: "stated", uk: "є" },
  notStated: { en: "not stated", uk: "немає" },
  onlyHere: { en: "only this page", uk: "лише тут" },
  // ── diff
  diff: { en: "Since the baseline", uk: "Порівняно з базовою версією" },
  diffSub: { en: /* @__PURE__ */ __name((v) => `against the reading of ${v.url}`, "en"), uk: /* @__PURE__ */ __name((v) => `відносно читання ${v.url}`, "uk") },
  diffCounts: {
    en: /* @__PURE__ */ __name((v) => `${v.same} unchanged · ${v.changed} changed · ${v.added} added · ${v.removed} removed`, "en"),
    uk: /* @__PURE__ */ __name((v) => `без змін: ${v.same} · змінено: ${v.changed} · додано: ${v.added} · вилучено: ${v.removed}`, "uk")
  },
  colMeasure: { en: "Measure", uk: "Показник" },
  colBefore: { en: "Baseline", uk: "Було" },
  colAfter: { en: "Now", uk: "Зараз" },
  mPassages: { en: "Passages", uk: "Уривки" },
  mWords: { en: "Words", uk: "Слова" },
  mCap: { en: "Cap reached", uk: "Ліміт досягнуто" },
  mUnread: { en: "Characters past the cap", uk: "Символи за лімітом" },
  stSame: { en: "unchanged", uk: "без змін" },
  stChanged: { en: "changed", uk: "змінено" },
  stAdded: { en: "added", uk: "додано" },
  stRemoved: { en: "removed", uk: "вилучено" },
  groupChanges: { en: "Group changes", uk: "Зміни груп" },
  cameFrom: { en: "came from", uk: "походить з" },
  newText: { en: "new text", uk: "новий текст" },
  wasN: { en: /* @__PURE__ */ __name((v) => `was #${v.n}`, "en"), uk: /* @__PURE__ */ __name((v) => `було #${v.n}`, "uk") },
  // ── compare
  compareTitle: { en: /* @__PURE__ */ __name((v) => `${v.n} pages, one topic dictionary`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.n} ${ukForm(v.n, "сторінка", "сторінки", "сторінок")}, один словник тем`, "uk") },
  pagesTitle: { en: "The pages", uk: "Сторінки" },
  colPage: { en: "Page", uk: "Сторінка" },
  colWords: { en: "Words", uk: "Слова" },
  colPassages: { en: "Passages", uk: "Уривки" },
  colPastCap: { en: "Past cap", uk: "За лімітом" },
  colBlocked: { en: "AI crawlers blocked", uk: "Заблоковані ШІ-краулери" },
  colFindings: { en: "Findings", uk: "Знахідки" },
  topicTable: { en: "Topics × pages", uk: "Теми × сторінки" },
  topicTableSub: { en: "passages and characters each page spends on each shared topic", uk: "скільки уривків і символів кожна сторінка віддає кожній спільній темі" },
  colTopic: { en: "Topic", uk: "Тема" },
  topicGaps: { en: "Topic gaps", uk: "Прогалини в темах" },
  topicGapsSub: { en: "topics the other pages cover and this one does not", uk: "теми, які мають інші сторінки, а ця — ні" },
  noGaps: { en: "no gaps", uk: "прогалин немає" },
  factGaps: { en: "Fact gaps", uk: "Прогалини у фактах" },
  factGapsSub: { en: "which page states a fact the others lack", uk: "яка сторінка має факт, якого бракує іншим" },
  crawlersByPage: { en: "AI crawlers by page", uk: "ШІ-краулери за сторінками" },
  findingsByPage: { en: "Findings by page", uk: "Знахідки за сторінками" },
  readingByPage: { en: "Each page's reading", uk: "Читання кожної сторінки" },
  // ── closing / footer
  closingCut: {
    en: /* @__PURE__ */ __name((v) => `A page contributes at most ${v.cap} passages, and this one filled every slot: ${fmtN(v.n)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця: ${uk(v.n, "символ", "символи", "символів")} наприкінці не потрапили в індекс і не можуть стати відповіддю ні на що.`, "uk")
  },
  closingFull: {
    en: /* @__PURE__ */ __name((v) => `A page contributes at most ${v.cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця. Лічильник не показує тексту за лімітом, але через перекриття уривків короткий хвіст сторінки все ж міг лишитися непрочитаним.`, "uk")
  },
  closingFits: {
    en: /* @__PURE__ */ __name((v) => `A page contributes at most ${v.cap} passages; this one needed ${v.n}, so none of its extracted text fell past the cap.`, "en"),
    uk: /* @__PURE__ */ __name((v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}; цій знадобилося ${v.n}, тож жоден видобутий текст не вийшов за ліміт.`, "uk")
  },
  fine: {
    en: "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.",
    uk: "Це попередній перегляд того, що бачить машина, а не гарантія того, що з цим зробить будь-який асистент: звідси не випливає, що якийсь асистент проіндексував сторінку, а кожна система нарізає, вбудовує й обмежує по-своєму."
  },
  footerMadeRefused: {
    en: "Made with the vectorscope skill: the scripts fetched the page, found it was in Russian and kept nothing of it; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку, визначили, що вона російською, і нічого з неї не зберегли; жодної моделі чи ембедингів не викликано."
  },
  footerMade: {
    en: "Made with the vectorscope skill: the scripts fetched the page and its robots.txt and sent nothing anywhere; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку та її robots.txt і нікуди нічого не надсилали; жодної моделі чи ембедингів не викликано."
  },
  footerAuthor: { en: "the author", uk: "автор" }
};
var CHECK_COPY = {
  robots_unreachable: {
    title: { en: "robots.txt did not answer", uk: "robots.txt не відповідає" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.url || "robots.txt"} returned ${v.httpStatus ? `HTTP ${v.httpStatus}` : "no answer"}.`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.url || "robots.txt"} повернув ${v.httpStatus ? `HTTP ${v.httpStatus}` : "порожнечу"}.`, "uk") },
    tell: { en: "Under RFC 9309 a crawler that cannot read robots.txt assumes it may fetch nothing. Make robots.txt answer 200 (or 404 if you want no rules).", uk: "За RFC 9309 краулер, який не може прочитати robots.txt, вважає, що не може завантажувати нічого. Зробіть так, щоб robots.txt відповідав 200 (або 404, якщо правил не треба)." }
  },
  ai_search_blocked: {
    title: { en: "AI search and answer crawlers are blocked", uk: "Заблоковано пошукових ШІ-краулерів і тих, що відповідають" },
    what: { en: /* @__PURE__ */ __name((v) => `Blocked for this path: ${v.bots}.`, "en"), uk: /* @__PURE__ */ __name((v) => `Для цього шляху заблоковано: ${v.bots}.`, "uk") },
    tell: { en: "These crawlers fetch pages to answer people. While they are disallowed, the rest of this report is moot for those assistants. Remove the Disallow for them if you want to be cited.", uk: "Ці краулери завантажують сторінки, щоб відповідати людям. Поки їм заборонено, решта звіту для цих асистентів не має значення. Зніміть Disallow для них, якщо хочете, щоб вас цитували." }
  },
  ai_training_blocked: {
    title: { en: "Training crawlers are blocked", uk: "Краулерів для навчання заблоковано" },
    what: { en: /* @__PURE__ */ __name((v) => `Blocked: ${v.bots}.`, "en"), uk: /* @__PURE__ */ __name((v) => `Заблоковано: ${v.bots}.`, "uk") },
    tell: { en: "Usually a deliberate choice: these collect model-training data and do not decide whether an assistant can cite you today. Keep it if it was meant.", uk: "Зазвичай це свідомий вибір: ці краулери збирають дані для навчання моделей і не вирішують, чи процитує вас асистент сьогодні. Залиште, якщо так і задумано." }
  },
  noindex: {
    title: { en: "The page asks not to be indexed", uk: "Сторінка просить її не індексувати" },
    what: { en: "meta robots carries noindex.", uk: "meta robots містить noindex." },
    tell: { en: "Search indexes that assistants answer from will drop the page. Remove noindex unless that is the intent.", uk: "Пошукові індекси, з яких відповідають асистенти, викинуть сторінку. Приберіть noindex, якщо це не навмисно." }
  },
  js_dependent: {
    title: { en: "Most of the page needs JavaScript", uk: "Більша частина сторінки потребує JavaScript" },
    what: { en: /* @__PURE__ */ __name((v) => `${fmtN(v.withJs)} words with JavaScript, ${fmtN(v.withoutJs)} without.`, "en"), uk: /* @__PURE__ */ __name((v) => `${fmtUk(v.withJs)} слів з JavaScript, ${fmtUk(v.withoutJs)} без нього.`, "uk") },
    tell: { en: "A retriever that does not run JavaScript reads the smaller number. Render the content on the server.", uk: "Ретривер, який не виконує JavaScript, читає меншу кількість. Рендерте вміст на сервері." }
  },
  cap_overflow: {
    title: { en: "Text fell past the 26-passage cap", uk: "Текст вийшов за ліміт у 26 уривків" },
    what: { en: /* @__PURE__ */ __name((v) => `${fmtN(v.charsUnread)} characters after passage #${v.last} are never stored.`, "en"), uk: /* @__PURE__ */ __name((v) => `${uk(v.charsUnread, "символ", "символи", "символів")} після уривка #${v.last} ніколи не зберігаються.`, "uk") },
    tell: { en: "Move what matters earlier, cut repetition, or split the page so each part has its own 26 slots.", uk: "Перенесіть важливе вище, приберіть повтори або розділіть сторінку, щоб кожна частина мала власні 26 місць." }
  },
  lost_faq_questions: {
    title: { en: "FAQ answers without their questions", uk: "Відповіді FAQ без запитань" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.answers} sentences open with an answer ("Yes.", "No.") and the passage holds ${v.questions} question mark(s).`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.answers} речень починаються з відповіді («Так.», «Ні.»), а в уривку лише ${v.questions} знак(и) питання.`, "uk") },
    tell: { en: "The questions are probably in buttons or accordions the extractor drops. Put each question as visible text (an h3 or a bold line) right before its answer.", uk: "Запитання, імовірно, сидять у кнопках чи акордеонах, які екстрактор відкидає. Зробіть кожне запитання видимим текстом (h3 або жирний рядок) просто перед відповіддю." }
  },
  dominant_heading: {
    title: { en: "One heading carries too much of the page", uk: "Один заголовок несе забагато сторінки" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.heading ? `“${v.heading}”` : "Text with no heading"} holds ${pct(v.share)} of the indexed text.`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.heading ? `«${v.heading}»` : "Текст без заголовка"} містить ${pct(v.share)} індексованого тексту.`, "uk") },
    tell: { en: "The chunker splits only at h2. If this part has subtopics, they are h3s or styled text; make them real h2 headings so each becomes its own passage.", uk: "Нарізувач ділить лише за h2. Якщо в цій частині є підтеми, вони оформлені як h3 або стилізований текст; зробіть їх справжніми h2, щоб кожна стала окремим уривком." }
  },
  mid_sentence_start: {
    title: { en: "Passages that start mid-sentence", uk: "Уривки, що починаються посеред речення" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.count} passage(s) open on a lowercase word or a punctuation mark.`, "en"), uk: /* @__PURE__ */ __name((v) => `Уривків, що починаються з малої літери чи розділового знака: ${v.count}.`, "uk") },
    tell: { en: "The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.", uk: "Розділ був довший за 2 000 символів, і вікно його розрізало. Розбийте довгі розділи заголовками h2, щоб уривки починалися там, де починається тема." }
  },
  nav_in_content: {
    title: { en: "Navigation inside the content", uk: "Навігація всередині вмісту" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.runs} run(s) of four or more one-or-two-word lines.`, "en"), uk: /* @__PURE__ */ __name((v) => `Серій із чотирьох і більше рядків по одному-два слова: ${v.runs}.`, "uk") },
    tell: { en: "Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.", uk: "Меню, списки тегів чи таблиці підписів у головній області стають текстом уривків. Загорніть їх у nav або винесіть з main." }
  },
  thin_section: {
    title: { en: "Thin sections", uk: "Тонкі розділи" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.count} heading(s) with fewer than 150 characters under them.`, "en"), uk: /* @__PURE__ */ __name((v) => `Заголовків, під якими менше 150 символів: ${v.count}.`, "uk") },
    tell: { en: "A passage this short cannot answer much on its own. Merge it into a neighbour or say what the heading promises.", uk: "Такий короткий уривок мало що може відповісти сам. Об’єднайте його з сусіднім або напишіть те, що обіцяє заголовок." }
  },
  truncated_teaser: {
    title: { en: "Truncated teasers", uk: "Обрізані анонси" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.count} line(s) end in “…”.`, "en"), uk: /* @__PURE__ */ __name((v) => `Рядків, що закінчуються на «…»: ${v.count}.`, "uk") },
    tell: { en: "A cut-off teaser gives the retriever half a claim. Finish the sentence or drop the teaser.", uk: "Обрізаний анонс дає ретриверу половину твердження. Допишіть речення або приберіть анонс." }
  },
  repeated_claim: {
    title: { en: "The same words in most groups", uk: "Ті самі слова в більшості груп" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.n} phrase(s) recur across at least half of the ${v.groupCount} groups.`, "en"), uk: /* @__PURE__ */ __name((v) => `Фраз, що повторюються щонайменше в половині з ${v.groupCount} груп: ${v.n}.`, "uk") },
    tell: { en: "Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.", uk: "Повтори витрачають уривки на вже сказане й розмивають групи. Скажіть це один раз, там, де йому місце." }
  },
  canonical_other: {
    title: { en: "Canonical points elsewhere", uk: "Canonical вказує на іншу сторінку" },
    what: { en: /* @__PURE__ */ __name((v) => `rel=canonical names ${v.href}.`, "en"), uk: /* @__PURE__ */ __name((v) => `rel=canonical називає ${v.href}.`, "uk") },
    tell: { en: "Search indexes will prefer that URL; the passages here may be stored under it or not at all. Point canonical at this page if it is the original.", uk: "Пошукові індекси віддадуть перевагу тій адресі; уривки звідси можуть зберегтися під нею або не зберегтися взагалі. Вкажіть canonical на цю сторінку, якщо вона оригінал." }
  },
  canonical_multiple: {
    title: { en: "More than one canonical", uk: "Більше одного canonical" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.count} rel=canonical links.`, "en"), uk: /* @__PURE__ */ __name((v) => `Посилань rel=canonical: ${v.count}.`, "uk") },
    tell: { en: "Conflicting canonicals are usually ignored. Keep exactly one.", uk: "Суперечливі canonical зазвичай ігнорують. Залиште рівно один." }
  },
  canonical_relative: {
    title: { en: "Relative canonical", uk: "Відносний canonical" },
    what: { en: /* @__PURE__ */ __name((v) => `rel=canonical is “${v.href}”.`, "en"), uk: /* @__PURE__ */ __name((v) => `rel=canonical — «${v.href}».`, "uk") },
    tell: { en: "It works, but an absolute URL leaves nothing to resolve. Write the full https:// address.", uk: "Це працює, але абсолютна адреса не залишає місця для помилки. Напишіть повну адресу https://." }
  },
  canonical_missing: {
    title: { en: "No canonical", uk: "Немає canonical" },
    what: { en: "The page has no rel=canonical link.", uk: "На сторінці немає посилання rel=canonical." },
    tell: { en: "Add one pointing at this URL, so copies with tracking parameters fold into it.", uk: "Додайте його з адресою цієї сторінки, щоб копії з параметрами відстеження зводилися до неї." }
  },
  jsonld_invalid: {
    title: { en: "Broken structured data", uk: "Зламані структуровані дані" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.invalid} of ${v.blocks} JSON-LD block(s) are not valid JSON.`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.invalid} з ${v.blocks} блоків JSON-LD — невалідний JSON.`, "uk") },
    tell: { en: "An unparseable block is ignored whole. Validate it.", uk: "Блок, який не розбирається, ігнорують повністю. Перевірте його валідатором." }
  },
  jsonld_none: {
    title: { en: "No structured data", uk: "Немає структурованих даних" },
    what: { en: "No JSON-LD on the page.", uk: "На сторінці немає JSON-LD." },
    tell: { en: "Not needed for the passages, but FAQPage, HowTo, Product or Article markup states what the page is in a form machines read without guessing.", uk: "Для уривків це не обов’язково, але розмітка FAQPage, HowTo, Product чи Article каже, що це за сторінка, у формі, яку машини читають без здогадок." }
  },
  meta_description_missing: {
    title: { en: "No meta description", uk: "Немає meta description" },
    what: { en: "The intro passage (#0) has only the title and h1.", uk: "Вступний уривок (#0) має лише title і h1." },
    tell: { en: "The chunker puts the description into passage #0. Write one or two sentences that say what the page answers.", uk: "Нарізувач додає опис в уривок #0. Напишіть одне-два речення про те, на що відповідає сторінка." }
  },
  meta_description_short: {
    title: { en: "Short meta description", uk: "Короткий meta description" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.length} characters.`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.`, "uk") },
    tell: { en: "It is part of passage #0. Say what the page answers, in 70–160 characters.", uk: "Він входить в уривок #0. Скажіть, на що відповідає сторінка, у 70–160 символах." }
  },
  meta_description_long: {
    title: { en: "Long meta description", uk: "Довгий meta description" },
    what: { en: /* @__PURE__ */ __name((v) => `${v.length} characters.`, "en"), uk: /* @__PURE__ */ __name((v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.`, "uk") },
    tell: { en: "Snippets cut it at about 160 characters. Put the answer first.", uk: "Сніпети обрізають його приблизно на 160 символах. Поставте відповідь на початок." }
  },
  robots_not_checked: {
    title: { en: "robots.txt not checked", uk: "robots.txt не перевірено" },
    what: { en: "This run read a saved page.", uk: "Цей запуск читав збережену сторінку." },
    tell: { en: "Run read.mjs on the live URL to check the AI crawlers.", uk: "Запустіть read.mjs на живій адресі, щоб перевірити ШІ-краулерів." }
  }
};
function tr(key, lang, values = {}) {
  const entry = S[key];
  if (!entry) throw new Error(`no copy for ${key}`);
  const value = entry[lang] ?? entry.en;
  return typeof value === "function" ? value(values) : value;
}
__name(tr, "tr");
function checkCopy(code, lang, evidence = {}) {
  const copy = CHECK_COPY[code];
  if (!copy) return { title: code, what: "", tell: "" };
  const pick = /* @__PURE__ */ __name((part) => {
    const value = copy[part][lang] ?? copy[part].en;
    return typeof value === "function" ? value(evidence) : value;
  }, "pick");
  return { title: pick("title"), what: pick("what"), tell: pick("tell") };
}
__name(checkCopy, "checkCopy");

// scripts/lib/checks.mjs
var FAQ_MIN_ANSWER_OPENERS = 3;
var FAQ_MAX_QUESTION_RATIO = 0.5;
var DOMINANT_HEADING_SHARE = 0.3;
var DOMINANT_MIN_PASSAGES = 4;
var NAV_MIN_LINES = 4;
var NAV_MAX_WORDS = 2;
var NAV_MAX_LINE_CHARS = 30;
var THIN_SECTION_CHARS = 150;
var REPEAT_NGRAM = 4;
var REPEAT_MIN_CONTENT_WORDS = 2;
var REPEAT_GROUP_SHARE = 0.5;
var REPEAT_MIN_GROUPS = 3;
var OVERLAP_SEARCH_CHARS = 400;
var META_DESCRIPTION_MIN = 70;
var META_DESCRIPTION_MAX = 160;
var JS_GAIN_RATIO = 1.5;
var JS_GAIN_MIN_WORDS = 150;
var MAX_SAMPLES = 6;
var SEVERITY_RANK = { high: 3, medium: 2, low: 1, info: 0 };
var CHECK_CODES = [
  "robots_unreachable",
  "ai_search_blocked",
  "noindex",
  "js_dependent",
  "cap_overflow",
  "lost_faq_questions",
  "dominant_heading",
  "mid_sentence_start",
  "nav_in_content",
  "canonical_other",
  "canonical_multiple",
  "jsonld_invalid",
  "ai_training_blocked",
  "thin_section",
  "truncated_teaser",
  "repeated_claim",
  "canonical_missing",
  "canonical_relative",
  "jsonld_none",
  "meta_description_missing",
  "meta_description_short",
  "meta_description_long",
  "robots_not_checked"
];
var oneLine = /* @__PURE__ */ __name((s) => String(s ?? "").replace(/\s+/g, " ").trim(), "oneLine");
var clip = /* @__PURE__ */ __name((s, n = 90) => {
  const t = oneLine(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}, "clip");
function isShortLine(line) {
  const text = line.trim();
  if (!text || text.length > NAV_MAX_LINE_CHARS) return false;
  if (!new RegExp("\\p{L}", "u").test(text)) return false;
  return text.split(/\s+/).length <= NAV_MAX_WORDS;
}
__name(isShortLine, "isShortLine");
function shortLineRuns(bodyText, passages) {
  const runs = [];
  let run = [];
  const flush = /* @__PURE__ */ __name(() => {
    if (run.length >= NAV_MIN_LINES) runs.push(run);
    run = [];
  }, "flush");
  for (const line of String(bodyText || "").split("\n")) {
    if (!line.trim()) continue;
    if (isShortLine(line)) run.push(line.trim());
    else flush();
  }
  flush();
  const flat = passages.map((p) => oneLine(p.text));
  return runs.map((lines) => {
    const first = lines[0];
    const joined = lines.slice(0, 3).join(" ");
    const holding = [];
    flat.forEach((text, index) => {
      if (text.includes(joined) || lines.length && text.includes(first) && text.includes(lines[lines.length - 1]) && text.includes(lines[1])) holding.push(passages[index].index);
    });
    return { lines: lines.slice(0, 12), count: lines.length, passages: holding };
  });
}
__name(shortLineRuns, "shortLineRuns");
var ANSWER_OPENER = /^(?:yes|no|yep|nope|yeah|absolutely|correct|definitely|sure|of course|not really|not quite|так|ні|sí|si|oui|non|tak|nie|ja|nein)(?:[.,!:;]|\s+[—–-])/iu;
function sentences(text) {
  return String(text || "").split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim().replace(/^[«"“'(\[]+/, "")).filter(Boolean);
}
__name(sentences, "sentences");
function lostFaq(passages) {
  const hits = [];
  for (const p of passages) {
    const openers = sentences(p.text).filter((s) => ANSWER_OPENER.test(s));
    const questions = (p.text.match(/[?？]/g) || []).length;
    if (openers.length >= FAQ_MIN_ANSWER_OPENERS && questions < openers.length * FAQ_MAX_QUESTION_RATIO) {
      hits.push({ passage: p.index, answers: openers.length, questions, text: clip(openers[0], 80) });
    }
  }
  if (!hits.length) return [];
  return [{ code: "lost_faq_questions", severity: "high", passages: hits.map((h) => h.passage), evidence: { samples: hits.slice(0, MAX_SAMPLES) } }];
}
__name(lostFaq, "lostFaq");
function isIntro(p, page) {
  return p.index === 0 && (p.rawHeading ?? p.heading) && oneLine(p.rawHeading ?? p.heading) === oneLine(page.title || page.h1?.[0] || "");
}
__name(isIntro, "isIntro");
function dominantHeading2(passages, page) {
  if (passages.length < DOMINANT_MIN_PASSAGES) return [];
  const total = passages.reduce((sum, p) => sum + p.charCount, 0);
  if (!total) return [];
  const byHeading = /* @__PURE__ */ new Map();
  for (const p of passages) {
    if (isIntro(p, page)) continue;
    const key = oneLine(p.rawHeading ?? p.heading) || "";
    const entry = byHeading.get(key) ?? { heading: key || null, chars: 0, passages: [] };
    entry.chars += p.charCount;
    entry.passages.push(p.index);
    byHeading.set(key, entry);
  }
  const out = [];
  for (const entry of byHeading.values()) {
    const share = entry.chars / total;
    if (share > DOMINANT_HEADING_SHARE && entry.passages.length >= 2) {
      out.push({
        code: "dominant_heading",
        severity: "medium",
        passages: entry.passages,
        evidence: { heading: entry.heading, share: Math.round(share * 1e3) / 1e3, chars: entry.chars }
      });
    }
  }
  return out;
}
__name(dominantHeading2, "dominantHeading");
function midSentence(passages) {
  const hits = passages.filter((p) => p.index > 0 && new RegExp("^(?:\\p{Ll}|[,;:)\\]}»”’…])", "u").test(p.text.trim())).map((p) => ({ passage: p.index, text: clip(p.text, 80) }));
  if (!hits.length) return [];
  return [{ code: "mid_sentence_start", severity: "medium", passages: hits.map((h) => h.passage), evidence: { samples: hits.slice(0, MAX_SAMPLES), count: hits.length } }];
}
__name(midSentence, "midSentence");
function navInContent(reading) {
  const runs = reading.layout?.shortLineRuns ?? shortLineRuns(reading.passages.map((p) => p.text).join("\n"), reading.passages);
  const inside = runs.filter((run) => run.passages.length);
  if (!inside.length) return [];
  const passages = [...new Set(inside.flatMap((run) => run.passages))].sort((a, b) => a - b);
  return [{
    code: "nav_in_content",
    severity: "medium",
    passages,
    evidence: { runs: inside.length, samples: inside.slice(0, MAX_SAMPLES).map((run) => ({ passage: run.passages[0], lines: run.lines.slice(0, 8), count: run.count })) }
  }];
}
__name(navInContent, "navInContent");
function thinSections(passages, page) {
  const sections = [];
  for (const p of passages) {
    if (isIntro(p, page) || p.contentRole !== "main") continue;
    const heading = oneLine(p.rawHeading ?? p.heading);
    if (!heading) continue;
    const last = sections[sections.length - 1];
    if (last && last.heading === heading && last.passages[last.passages.length - 1] === p.index - 1) {
      last.chars += p.charCount;
      last.passages.push(p.index);
    } else {
      sections.push({ heading, chars: p.charCount, passages: [p.index] });
    }
  }
  const thin = sections.filter((s) => s.chars < THIN_SECTION_CHARS);
  if (!thin.length) return [];
  return [{
    code: "thin_section",
    severity: "low",
    passages: thin.flatMap((s) => s.passages),
    evidence: { samples: thin.slice(0, MAX_SAMPLES).map((s) => ({ passage: s.passages[0], heading: s.heading, chars: s.chars })), count: thin.length }
  }];
}
__name(thinSections, "thinSections");
var CODE_LIKE = /[<>{}();=]/;
var TEASER = new RegExp("(\\S[^\\n]{0,70}?)(…|\\.\\.\\.)(?=[ \\t]*(?:\\n|$)|\\s+\\p{Lu})", "gu");
function truncatedTeasers(passages) {
  const hits = [];
  for (const p of passages) {
    for (const match of p.text.matchAll(TEASER)) {
      if (CODE_LIKE.test(match[1])) continue;
      hits.push({ passage: p.index, text: clip(`${match[1]}${match[2]}`, 80) });
    }
  }
  if (!hits.length) return [];
  const passageIds = [...new Set(hits.map((h) => h.passage))];
  return [{ code: "truncated_teaser", severity: hits.length >= 3 ? "medium" : "low", passages: passageIds, evidence: { count: hits.length, samples: hits.slice(0, MAX_SAMPLES) } }];
}
__name(truncatedTeasers, "truncatedTeasers");
function withoutOverlap2(previous, current) {
  if (!previous) return current;
  const probe = current.slice(0, 40);
  if (probe.length < 20) return current;
  const at = previous.lastIndexOf(probe);
  if (at < 0) return current;
  const overlap = previous.length - at;
  return overlap <= OVERLAP_SEARCH_CHARS ? current.slice(overlap) : current;
}
__name(withoutOverlap2, "withoutOverlap");
var CODE_TOKEN = /^[A-Z][A-Za-z]*(?:-[A-Z][A-Za-z]*)+:?$|[:/=<>{}()"#@\\]|\d/;
var EDGE_PUNCTUATION = /^[«"“‘'(\[]+|[.,;:!?)\]»”’']+$/g;
var NOT_FUNCTION_WORDS = /* @__PURE__ */ new Set(["www", "http", "https", "com", "org", "net", "html", "php", "asp"]);
function proseRuns(text) {
  const runs = [];
  let run = [];
  for (const raw of String(text || "").split(/\s+/)) {
    const token = raw.replace(EDGE_PUNCTUATION, "");
    if (!token || CODE_TOKEN.test(token)) {
      if (run.length) runs.push(run);
      run = [];
      continue;
    }
    run.push(...token.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  }
  if (run.length) runs.push(run);
  return runs;
}
__name(proseRuns, "proseRuns");
function repeatedClaims(passages, assignment, groupCount) {
  if (!assignment || groupCount < REPEAT_MIN_GROUPS) return [];
  const need = Math.max(2, Math.ceil(groupCount * REPEAT_GROUP_SHARE));
  const where = /* @__PURE__ */ new Map();
  passages.forEach((p, i) => {
    if (i === 0) return;
    const text = withoutOverlap2(passages[i - 1]?.text, p.text);
    const seen = /* @__PURE__ */ new Set();
    for (const tokens of proseRuns(text))
      for (let k = 0; k + REPEAT_NGRAM <= tokens.length; k++) {
        const gram = tokens.slice(k, k + REPEAT_NGRAM);
        const content = gram.filter((t) => t.length >= 3 && !isStopword(t)).length;
        if (content < REPEAT_MIN_CONTENT_WORDS) continue;
        if (!gram.some((t) => isStopword(t) && !NOT_FUNCTION_WORDS.has(t))) continue;
        const key = gram.join(" ");
        if (seen.has(key)) continue;
        seen.add(key);
        const entry = where.get(key) ?? { groups: /* @__PURE__ */ new Set(), passages: /* @__PURE__ */ new Set() };
        entry.groups.add(assignment[i]);
        entry.passages.add(p.index);
        where.set(key, entry);
      }
  });
  const candidates = [...where.entries()].filter(([, entry]) => entry.groups.size >= need).sort((a, b) => b[1].groups.size - a[1].groups.size || b[1].passages.size - a[1].passages.size || a[0].localeCompare(b[0]));
  if (!candidates.length) return [];
  const picked = [];
  for (const [key, entry] of candidates) {
    const tokens = key.split(" ");
    const tri = /* @__PURE__ */ __name((list) => list.slice(0, -2).map((_, k) => list.slice(k, k + 3).join(" ")), "tri");
    const clash = picked.some((p) => tri(p.phrase.split(" ")).some((t) => tri(tokens).includes(t)));
    if (clash) continue;
    picked.push({ phrase: key, groups: entry.groups.size, passages: [...entry.passages].sort((a, b) => a - b) });
    if (picked.length >= MAX_SAMPLES) break;
  }
  const ids = [...new Set(picked.flatMap((p) => p.passages))].sort((a, b) => a - b);
  return [{ code: "repeated_claim", severity: "low", passages: ids, evidence: { groupCount, samples: picked } }];
}
__name(repeatedClaims, "repeatedClaims");
function robotsChecks(robots) {
  if (!robots) return [];
  if (robots.status === "not_checked") return [{ code: "robots_not_checked", severity: "info", passages: [], evidence: {} }];
  if (robots.status === "unreachable") return [{ code: "robots_unreachable", severity: "high", passages: [], evidence: { url: robots.url, httpStatus: robots.httpStatus } }];
  const blocked = (robots.bots || []).filter((bot) => !bot.allowed);
  const answering = blocked.filter((bot) => bot.kind !== "training");
  const training = blocked.filter((bot) => bot.kind === "training");
  const out = [];
  if (answering.length) out.push({ code: "ai_search_blocked", severity: "high", passages: [], evidence: { bots: answering.map((b) => b.token), rules: answering.map((b) => b.rule) } });
  if (training.length) out.push({ code: "ai_training_blocked", severity: "low", passages: [], evidence: { bots: training.map((b) => b.token) } });
  return out;
}
__name(robotsChecks, "robotsChecks");
function technicalChecks(technical) {
  if (!technical) return [];
  const out = [];
  const { jsonLd, canonical, metaDescription } = technical;
  if (jsonLd.invalid) out.push({ code: "jsonld_invalid", severity: "medium", passages: [], evidence: { invalid: jsonLd.invalid, blocks: jsonLd.blocks } });
  if (!jsonLd.types.length && !jsonLd.invalid) out.push({ code: "jsonld_none", severity: "low", passages: [], evidence: {} });
  if (!canonical.present) out.push({ code: "canonical_missing", severity: "low", passages: [], evidence: {} });
  else {
    if (canonical.count > 1) out.push({ code: "canonical_multiple", severity: "medium", passages: [], evidence: { count: canonical.count } });
    if (!canonical.absolute) out.push({ code: "canonical_relative", severity: "low", passages: [], evidence: { href: canonical.href } });
    if (canonical.self === false) out.push({ code: "canonical_other", severity: "medium", passages: [], evidence: { href: canonical.resolved } });
  }
  if (!metaDescription.present) out.push({ code: "meta_description_missing", severity: "low", passages: [0], evidence: {} });
  else if (metaDescription.length < META_DESCRIPTION_MIN) out.push({ code: "meta_description_short", severity: "low", passages: [0], evidence: { length: metaDescription.length } });
  else if (metaDescription.length > META_DESCRIPTION_MAX) out.push({ code: "meta_description_long", severity: "low", passages: [0], evidence: { length: metaDescription.length } });
  return out;
}
__name(technicalChecks, "technicalChecks");
function pageChecks(reading) {
  const { page } = reading;
  const out = [];
  if (page.noindex) out.push({ code: "noindex", severity: "high", passages: [], evidence: {} });
  if (page.capReached && page.charsUnread > 0) {
    out.push({ code: "cap_overflow", severity: "high", passages: [reading.passages.length - 1], evidence: { charsUnread: page.charsUnread, cap: page.chunkCap, last: reading.passages.length - 1 } });
  }
  const r = reading.render;
  if (r?.ok && r.wordCount >= page.wordCount * JS_GAIN_RATIO && r.wordCount - page.wordCount >= JS_GAIN_MIN_WORDS) {
    out.push({ code: "js_dependent", severity: "high", passages: [], evidence: { withoutJs: page.wordCount, withJs: r.wordCount, passagesWithoutJs: page.chunksIndexed, passagesWithJs: r.passages } });
  }
  return out;
}
__name(pageChecks, "pageChecks");
function runChecks(reading, assignment = null, groupCount = 0) {
  const passages = reading.passages || [];
  const findings = [
    ...robotsChecks(reading.robots),
    ...pageChecks(reading),
    ...lostFaq(passages),
    ...dominantHeading2(passages, reading.page),
    ...midSentence(passages),
    ...navInContent(reading),
    ...thinSections(passages, reading.page),
    ...truncatedTeasers(passages),
    ...repeatedClaims(passages, assignment, groupCount),
    ...technicalChecks(reading.technical)
  ];
  return findings.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || CHECK_CODES.indexOf(a.code) - CHECK_CODES.indexOf(b.code)
  );
}
__name(runChecks, "runChecks");

// scripts/lib/analysis.mjs
function buildJudgedLens(reading, grouping) {
  const passages = reading.passages;
  const assignment = new Array(passages.length).fill(0);
  grouping.groups.forEach((members, id) => members.forEach((index) => assignment[index] = id));
  const chunks = passages.map((p, index) => ({
    chunkIndex: p.index,
    preview: p.text.slice(0, PREVIEW_CHARS),
    charCount: p.text.length,
    group: assignment[index],
    duplicateOf: grouping.duplicates.has(index) ? grouping.duplicates.get(index) : null,
    heading: p.heading,
    contentRole: p.contentRole
  }));
  const stopLanguage = pageStopLanguage(passages.map((p) => p.text));
  const groups = grouping.groups.map((memberIndexes, id) => {
    const memberTexts = memberIndexes.map((index) => passages[index].text);
    const otherTexts = passages.filter((_, index) => assignment[index] !== id).map((p) => p.text);
    const heading = dominantHeading(memberIndexes.map((index) => passages[index].rawHeading ?? passages[index].heading));
    const label = labelGroup(memberTexts, otherTexts, heading, stopLanguage);
    const meta = grouping.meta?.[id] ?? {};
    return {
      id,
      label,
      labelSource: labelSourceOf(label, heading),
      // v2: the agent's name for the group; the computed label above stays as the label source.
      agentLabel: meta.label ?? null,
      note: meta.note ?? null,
      topic: meta.topic ?? null,
      chunkCount: memberIndexes.length,
      charCount: memberTexts.reduce((sum, text) => sum + text.length, 0),
      cohesion: null,
      members: memberIndexes
    };
  });
  const vocabulary = pageVocabulary(passages.map((p) => p.text), assignment, groups.length, stopLanguage);
  return {
    chunks,
    groups,
    assignment,
    duplicates: grouping.duplicates.size,
    keywords: flattenVocabulary(vocabulary),
    phrases: vocabulary.phrases,
    narrative: vocabulary.narrative,
    // Who did the reading, as stated in groups.json; null fields when not stated.
    judgement: grouping.judgement ?? { agent: null, model: null }
  };
}
__name(buildJudgedLens, "buildJudgedLens");
var displayLabel = /* @__PURE__ */ __name((group) => group?.agentLabel || group?.label || "", "displayLabel");
function pageChecks2(reading, lens) {
  return runChecks(reading, lens?.assignment ?? null, lens?.groups.length ?? 0);
}
__name(pageChecks2, "pageChecks");
function diffReadings(oldReading, newReading, oldLens = null, newLens = null) {
  const olds = oldReading.passages;
  const news = newReading.passages;
  const matchOld = new Array(olds.length).fill(null);
  const matchNew = new Array(news.length).fill(null);
  const status = new Array(news.length).fill("added");
  const byText = /* @__PURE__ */ new Map();
  olds.forEach((p, i) => {
    const list = byText.get(p.text) ?? [];
    list.push(i);
    byText.set(p.text, list);
  });
  news.forEach((p, j) => {
    const list = byText.get(p.text);
    if (list && list.length) {
      const i = list.shift();
      matchOld[i] = j;
      matchNew[j] = i;
      status[j] = "same";
    }
  });
  news.forEach((p, j) => {
    if (matchNew[j] !== null) return;
    const heading = (p.heading || "").trim();
    if (!heading) return;
    const i = olds.findIndex((o, k) => matchOld[k] === null && (o.heading || "").trim() === heading);
    if (i >= 0) {
      matchOld[i] = j;
      matchNew[j] = i;
      status[j] = "changed";
    }
  });
  const passages = news.map((p, j) => ({
    index: p.index,
    status: status[j],
    was: matchNew[j],
    heading: p.heading,
    chars: p.charCount,
    charsBefore: matchNew[j] === null ? null : olds[matchNew[j]].charCount
  }));
  const removed = olds.map((p, i) => ({ index: p.index, heading: p.heading, chars: p.charCount })).filter((_, i) => matchOld[i] === null);
  const capOf = /* @__PURE__ */ __name((r) => ({ passages: r.page.chunksIndexed, capReached: r.page.capReached, charsUnread: r.page.charsUnread, words: r.page.wordCount, chars: r.page.charsIndexed }), "capOf");
  let groups = null;
  if (oldLens && newLens) {
    groups = {
      before: oldLens.groups.map((g) => ({ id: g.id, label: displayLabel(g), passages: g.chunkCount })),
      after: newLens.groups.map((g) => {
        const from = {};
        for (const member of g.members) {
          const was = matchNew[member];
          if (was === null) continue;
          const oldGroup = oldLens.assignment[was];
          from[oldGroup] = (from[oldGroup] ?? 0) + 1;
        }
        return { id: g.id, label: displayLabel(g), passages: g.chunkCount, from };
      })
    };
  }
  return {
    before: capOf(oldReading),
    after: capOf(newReading),
    counts: {
      same: status.filter((s) => s === "same").length,
      changed: status.filter((s) => s === "changed").length,
      added: status.filter((s) => s === "added").length,
      removed: removed.length
    },
    passages,
    removed,
    groups,
    sameUrl: oldReading.page.url === newReading.page.url,
    baselineUrl: oldReading.page.url
  };
}
__name(diffReadings, "diffReadings");
function compareTopics(pages, topics) {
  const table = topics.map((topic) => {
    const cells = {};
    for (const { n, lens } of pages) {
      const total = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
      const groups = lens.groups.filter((g) => g.topic === topic.id);
      const passages = groups.reduce((sum, g) => sum + g.chunkCount, 0);
      const chars = groups.reduce((sum, g) => sum + g.charCount, 0);
      cells[n] = { passages, chars, share: total ? Math.round(chars / total * 1e3) / 1e3 : 0 };
    }
    return { topic: topic.id, name: topic.name, cells };
  });
  const gaps = {};
  for (const { n } of pages) {
    gaps[n] = table.filter((row) => row.cells[n].passages === 0 && pages.some((p) => p.n !== n && row.cells[p.n].passages > 0)).map((row) => row.topic);
  }
  return { table, gaps };
}
__name(compareTopics, "compareTopics");
function compareFacts(pages, facts) {
  const unique = {};
  const lacking = {};
  for (const { n } of pages) {
    unique[n] = facts.filter((f) => f.pages[n] && Object.keys(f.pages).length === 1).map((f) => f.id);
    lacking[n] = facts.filter((f) => !f.pages[n]).map((f) => f.id);
  }
  return { unique, lacking };
}
__name(compareFacts, "compareFacts");

// scripts/lib/judgement.mjs
var MAX_GROUPS = 6;
var MAX_LABEL_CHARS = 80;
var MAX_NOTE_CHARS = 240;
var MAX_IDENTITY_CHARS = 60;
var MAX_TOPICS = 12;
var MAX_QUERIES = 10;
var MIN_QUERIES = 5;
var MAX_QUOTE_CHARS = 400;
var VERDICTS = ["complete", "partial", "missing"];
var QUERY_SOURCES = ["user", "generated"];
var isInt = /* @__PURE__ */ __name((v) => Number.isInteger(v), "isInt");
var str = /* @__PURE__ */ __name((v) => typeof v === "string" && v.trim().length > 0, "str");
function foldForQuote(text) {
  return String(text ?? "").replace(/[‘’‚′]/g, "'").replace(/[“”„″«»]/g, '"').replace(/[–—−]/g, "-").replace(/…/g, "...").replace(/\s+/g, " ").trim().toLowerCase();
}
__name(foldForQuote, "foldForQuote");
function quoteIn(quote, text) {
  const q = foldForQuote(quote);
  return q.length > 0 && foldForQuote(text).includes(q);
}
__name(quoteIn, "quoteIn");
function validateGrouping(input, passageCount, { topicIds = null, requireTopics = false } = {}) {
  if (!input || typeof input !== "object" || !Array.isArray(input.groups)) {
    throw new Error('groups.json must be an object with a "groups" array, e.g. {"groups": [[0,1],[2]], "duplicates": {}} or {"groups": [{"members": [0,1], "label": "…"}]}');
  }
  const raw = input.groups;
  if (raw.length === 0) throw new Error("groups is empty: every passage must belong to a group.");
  if (raw.length > MAX_GROUPS) {
    throw new Error(`${raw.length} groups given; the product draws at most ${MAX_GROUPS}. Merge the closest subjects until there are ${MAX_GROUPS} or fewer.`);
  }
  const entries = raw.map((group, g) => {
    if (Array.isArray(group)) return { members: group, label: null, note: null, topic: null };
    if (!group || typeof group !== "object" || !Array.isArray(group.members)) {
      throw new Error(`group ${g} must be an array of passage indexes or an object with a "members" array.`);
    }
    const label = group.label === void 0 || group.label === null ? null : String(group.label).replace(/\s+/g, " ").trim();
    if (label !== null && (!label || label.length > MAX_LABEL_CHARS)) throw new Error(`group ${g}: "label" must be 1–${MAX_LABEL_CHARS} characters.`);
    const note = group.note === void 0 || group.note === null ? null : String(group.note).replace(/\s+/g, " ").trim();
    if (note !== null && note.length > MAX_NOTE_CHARS) throw new Error(`group ${g}: "note" is over ${MAX_NOTE_CHARS} characters.`);
    const topic = group.topic === void 0 || group.topic === null ? null : String(group.topic);
    if (topic !== null && topicIds && !topicIds.has(topic)) throw new Error(`group ${g}: topic ${JSON.stringify(topic)} is not an id in topics.json.`);
    return { members: group.members, label, note: note || null, topic };
  });
  if (requireTopics) {
    entries.forEach((entry, g) => {
      if (!entry.topic) throw new Error(`group ${g} has no "topic": in compare mode every group names a topic id from topics.json.`);
    });
  }
  const seen = /* @__PURE__ */ new Map();
  entries.forEach((entry, g) => {
    if (entry.members.length === 0) throw new Error(`group ${g} is not a non-empty array of passage indexes.`);
    for (const value of entry.members) {
      if (!isInt(value) || value < 0 || value >= passageCount) {
        throw new Error(`group ${g} holds ${JSON.stringify(value)}, which is not a passage index (0–${passageCount - 1}).`);
      }
      if (seen.has(value)) throw new Error(`passage ${value} is in group ${seen.get(value)} and group ${g}; each passage goes in exactly one group.`);
      seen.set(value, g);
    }
  });
  const missing = [];
  for (let i = 0; i < passageCount; i++) if (!seen.has(i)) missing.push(i);
  if (missing.length) {
    throw new Error(`passage${missing.length === 1 ? "" : "s"} ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} in no group. A passage that shares no subject goes in a group of its own.`);
  }
  const sorted = entries.map((entry) => ({ ...entry, members: entry.members.slice().sort((a, b) => a - b) }));
  const ordered = sorted.slice().sort((a, b) => a.members[0] - b.members[0]);
  const reordered = ordered.some((entry, i) => entry !== sorted[i]) || entries.some((entry, i) => entry.members.some((value, j) => value !== sorted[i].members[j]));
  const duplicates = /* @__PURE__ */ new Map();
  const rawDup = input.duplicates ?? {};
  if (typeof rawDup !== "object" || Array.isArray(rawDup)) throw new Error('"duplicates" must be an object like {"7": 2}.');
  for (const [key, value] of Object.entries(rawDup)) {
    const later = Number(key);
    if (!isInt(later) || later < 0 || later >= passageCount) throw new Error(`duplicates key ${JSON.stringify(key)} is not a passage index.`);
    if (!isInt(value) || value < 0 || value >= passageCount) throw new Error(`duplicates[${key}] = ${JSON.stringify(value)} is not a passage index.`);
    if (value >= later) throw new Error(`duplicates[${key}] = ${value}: a duplicate points back to an EARLIER passage.`);
    if (later - value <= 1) throw new Error(`duplicates[${key}] = ${value}: adjacent passages share the chunker's overlap; only non-adjacent repeats count.`);
    duplicates.set(later, value);
  }
  return {
    groups: ordered.map((entry) => entry.members),
    meta: ordered.map(({ label, note, topic }) => ({ label, note, topic })),
    duplicates,
    reordered,
    judgement: validateIdentity(input)
  };
}
__name(validateGrouping, "validateGrouping");
function validateIdentity(input) {
  const one = /* @__PURE__ */ __name((key) => {
    const value = input[key];
    if (value === void 0 || value === null) return null;
    if (typeof value !== "string") throw new Error(`"${key}" must be a string, e.g. ${key === "agent" ? '"Claude Code"' : '"Claude Opus 5.5"'}, or left out.`);
    const text = value.replace(/\s+/g, " ").trim();
    if (!text || text.length > MAX_IDENTITY_CHARS) throw new Error(`"${key}" must be 1–${MAX_IDENTITY_CHARS} characters, or left out.`);
    if (/[\u0000-\u001f\u007f<>]/.test(text)) throw new Error(`"${key}" holds control characters or angle brackets; give a plain name.`);
    return text;
  }, "one");
  return { agent: one("agent"), model: one("model") };
}
__name(validateIdentity, "validateIdentity");
function validateTopics(input) {
  if (!input || !Array.isArray(input.topics) || !input.topics.length) throw new Error('topics.json must be {"topics": [{"id": "…", "name": "…"}, …]} with at least one topic.');
  if (input.topics.length > MAX_TOPICS) throw new Error(`${input.topics.length} topics; keep the shared dictionary to ${MAX_TOPICS} or fewer by merging the closest.`);
  const ids = /* @__PURE__ */ new Set();
  return input.topics.map((topic, i) => {
    if (!topic || !str(topic.id) || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(topic.id)) throw new Error(`topics[${i}].id must be a short lowercase slug (a-z, 0-9, - or _).`);
    if (ids.has(topic.id)) throw new Error(`topic id ${topic.id} appears twice.`);
    ids.add(topic.id);
    if (!str(topic.name) || topic.name.length > MAX_LABEL_CHARS) throw new Error(`topics[${i}].name must be 1–${MAX_LABEL_CHARS} characters.`);
    return { id: topic.id, name: topic.name.trim() };
  });
}
__name(validateTopics, "validateTopics");
function pageByNumber(pages, n, where) {
  const page = pages.find((p) => p.n === Number(n));
  if (!page) throw new Error(`${where}: page ${JSON.stringify(n)} is not in this run (pages ${pages.map((p) => p.n).join(", ")}).`);
  return page;
}
__name(pageByNumber, "pageByNumber");
function checkPassages(page, list, where) {
  if (!Array.isArray(list)) throw new Error(`${where}: passages must be an array of passage indexes.`);
  for (const value of list) {
    if (!isInt(value) || value < 0 || value >= page.passages.length) throw new Error(`${where}: ${JSON.stringify(value)} is not a passage index of page ${page.n} (0–${page.passages.length - 1}).`);
  }
  return list.slice();
}
__name(checkPassages, "checkPassages");
function validateFacts(input, pages, topicIds = null) {
  if (!input || !Array.isArray(input.facts)) throw new Error('facts.json must be {"facts": [{"id": "f1", "fact": "…", "pages": {"1": [3]}}]}.');
  const ids = /* @__PURE__ */ new Set();
  return input.facts.map((fact, i) => {
    const where = `facts[${i}]`;
    if (!fact || !str(fact.id)) throw new Error(`${where}.id is required.`);
    if (ids.has(fact.id)) throw new Error(`fact id ${fact.id} appears twice.`);
    ids.add(fact.id);
    if (!str(fact.fact) || fact.fact.length > MAX_NOTE_CHARS) throw new Error(`${where}.fact must be 1–${MAX_NOTE_CHARS} characters.`);
    if (fact.topic && topicIds && !topicIds.has(fact.topic)) throw new Error(`${where}.topic ${JSON.stringify(fact.topic)} is not in topics.json.`);
    let map = fact.pages;
    if (!map && Array.isArray(fact.passages) && pages.length === 1) map = { [pages[0].n]: fact.passages };
    if (!map || typeof map !== "object" || Array.isArray(map) || !Object.keys(map).length) throw new Error(`${where}.pages must map each page that states the fact to the passages that state it.`);
    const out = {};
    for (const [n, list] of Object.entries(map)) {
      const page = pageByNumber(pages, n, where);
      const passages = checkPassages(page, list, `${where}.pages.${n}`);
      if (!passages.length) throw new Error(`${where}.pages.${n} is empty: leave the page out when it does not state the fact.`);
      out[page.n] = passages;
    }
    return { id: fact.id, fact: fact.fact.trim(), topic: fact.topic ?? null, pages: out };
  });
}
__name(validateFacts, "validateFacts");
function validatePlan(input, pages, firedByPage = /* @__PURE__ */ new Map()) {
  if (!input || !Array.isArray(input.items) || !input.items.length) throw new Error('plan.json must be {"items": [{"priority": 1, "passages": [3], "problem": "…", "fix": "…"}]}.');
  const warnings = [];
  const items = input.items.map((item, i) => {
    const where = `items[${i}]`;
    if (!item || typeof item !== "object") throw new Error(`${where} is not an object.`);
    if (!isInt(item.priority) || item.priority < 1) throw new Error(`${where}.priority must be a whole number from 1 (do first).`);
    const page = pageByNumber(pages, item.page ?? pages[0].n, where);
    const passages = checkPassages(page, item.passages ?? [], `${where}.passages`);
    const check = item.check ?? null;
    if (check !== null && !CHECK_CODES.includes(check)) throw new Error(`${where}.check ${JSON.stringify(check)} is not a check code (${CHECK_CODES.join(", ")}), or null.`);
    if (check && !firedByPage.get(page.n)?.has(check)) warnings.push(`${where}: check ${check} did not fire on page ${page.n}; kept, but say why it applies.`);
    if (!str(item.problem)) throw new Error(`${where}.problem is required.`);
    if (!str(item.fix)) throw new Error(`${where}.fix is required.`);
    const hasBefore = str(item.before);
    const hasAfter = str(item.after);
    if (hasBefore !== hasAfter) throw new Error(`${where}: "before" and "after" go together; give both or neither.`);
    if (hasBefore) {
      if (!passages.length) throw new Error(`${where}: a before → after rewrite needs the passage it comes from in "passages".`);
      if (!passages.some((index) => quoteIn(item.before, page.passages[index].text))) {
        throw new Error(`${where}.before is not verbatim text from passage${passages.length === 1 ? "" : "s"} ${passages.join(", ")} of page ${page.n}. Copy it exactly (whitespace and quote style may differ).`);
      }
    }
    return {
      priority: item.priority,
      page: page.n,
      passages,
      check,
      problem: item.problem.trim(),
      fix: item.fix.trim(),
      before: hasBefore ? item.before.trim() : null,
      after: hasAfter ? item.after.trim() : null
    };
  });
  items.sort((a, b) => a.priority - b.priority);
  return { items, warnings };
}
__name(validatePlan, "validatePlan");
function validateQueries(input, pages) {
  if (!input || !Array.isArray(input.queries) || !input.queries.length) throw new Error('queries.json must be {"queries": [{"query": "…", "source": "generated", "results": {"1": {…}}}]}.');
  if (input.queries.length > MAX_QUERIES) throw new Error(`${input.queries.length} queries; keep it to ${MAX_QUERIES} typical ones.`);
  const warnings = [];
  if (input.queries.length < MIN_QUERIES) warnings.push(`${input.queries.length} queries; ${MIN_QUERIES}–${MAX_QUERIES} give a fairer picture.`);
  const ids = /* @__PURE__ */ new Set();
  const queries = input.queries.map((q, i) => {
    const where = `queries[${i}]`;
    const id = str(q?.id) ? q.id : `q${i + 1}`;
    if (ids.has(id)) throw new Error(`query id ${id} appears twice.`);
    ids.add(id);
    if (!str(q.query) || q.query.length > 200) throw new Error(`${where}.query must be 1–200 characters.`);
    if (!QUERY_SOURCES.includes(q.source)) throw new Error(`${where}.source must be "user" (the user gave it) or "generated" (you wrote it).`);
    let map = q.results;
    if (!map && q.result && pages.length === 1) map = { [pages[0].n]: q.result };
    if (!map || typeof map !== "object") throw new Error(`${where}.results must map every page number to its result.`);
    const results = {};
    for (const page of pages) {
      const r = map[page.n] ?? map[String(page.n)];
      const at = `${where}.results.${page.n}`;
      if (!r || typeof r !== "object") throw new Error(`${at} is missing: every page gets a verdict, "missing" included.`);
      if (!VERDICTS.includes(r.verdict)) throw new Error(`${at}.verdict must be one of ${VERDICTS.join(", ")}.`);
      if (typeof r.citable !== "boolean") throw new Error(`${at}.citable must be true or false.`);
      const passage = r.passage ?? null;
      const quote = typeof r.quote === "string" ? r.quote.trim() : "";
      if (r.verdict === "missing") {
        if (r.citable) throw new Error(`${at}: a missing answer cannot be citable.`);
        if (passage !== null) checkPassages(page, [passage], at);
        results[page.n] = { passage, verdict: "missing", citable: false, quote: null };
        continue;
      }
      if (passage === null) throw new Error(`${at}.passage is required for a ${r.verdict} answer.`);
      checkPassages(page, [passage], at);
      if (!quote) throw new Error(`${at}.quote is required for a ${r.verdict} answer: the words in the passage that answer.`);
      if (quote.length > MAX_QUOTE_CHARS) throw new Error(`${at}.quote is over ${MAX_QUOTE_CHARS} characters; quote the answering sentence, not the passage.`);
      if (!quoteIn(quote, page.passages[passage].text)) throw new Error(`${at}.quote is not verbatim text from passage ${passage} of page ${page.n}.`);
      results[page.n] = { passage, verdict: r.verdict, citable: r.citable, quote };
    }
    return { id, query: q.query.trim(), source: q.source, results };
  });
  return { queries, warnings };
}
__name(validateQueries, "validateQueries");
var VERDICT_RANK = { complete: 2, partial: 1, missing: 0 };
function queryWinner(query) {
  const scored = Object.entries(query.results).map(([n, r]) => ({ n: Number(n), score: VERDICT_RANK[r.verdict] * 2 + (r.citable ? 1 : 0) }));
  const best = Math.max(...scored.map((s) => s.score));
  if (best <= 0) return { winners: [], tie: false };
  const winners = scored.filter((s) => s.score === best).map((s) => s.n);
  return { winners, tie: winners.length > 1 };
}
__name(queryWinner, "queryWinner");

// scripts/lib/nonPageUrl.mjs
var MACHINE_SUFFIX = new RegExp(
  "\\.(?:" + [
    // Feeds and structured data
    "xml",
    "xsl",
    "xslt",
    "rss",
    "atom",
    "json",
    "jsonld",
    "csv",
    "tsv",
    "yaml",
    "yml",
    // Plain text and archives
    "txt",
    "md",
    "log",
    "gz",
    "zip",
    "tar",
    "rar",
    "7z",
    "bz2",
    // Documents
    "pdf",
    "docx?",
    "xlsx?",
    "pptx?",
    "rtf",
    "odt",
    "ods",
    "odp",
    "epub",
    // Code and build output
    "js",
    "mjs",
    "cjs",
    "css",
    "map",
    "wasm",
    // Images, fonts, media
    "svg",
    "ico",
    "png",
    "jpe?g",
    "gif",
    "webp",
    "avif",
    "bmp",
    "tiff?",
    "woff2?",
    "ttf",
    "otf",
    "eot",
    "mp4",
    "webm",
    "mov",
    "avi",
    "mp3",
    "wav",
    "ogg",
    "flac"
  ].join("|") + ")$",
  "i"
);

// scripts/lib/robots.mjs
var MAX_ROBOTS_BYTES = 500 * 1024;
function pathOf(url) {
  const parsed = new URL(url);
  return `${parsed.pathname || "/"}${parsed.search}`;
}
__name(pathOf, "pathOf");

// scripts/lib/html.mjs
var VECTORSCOPE_URL = "https://www.getlooploop.com/vectorscope";
var GROUP_COLOURS = ["#0e9ab8", "#8b5cf6", "#16a34a", "#e0458a", "#3d7ef0", "#7a8a14"];
var fmt = /* @__PURE__ */ __name((n) => Number(n).toLocaleString("en-US"), "fmt");
var pct2 = /* @__PURE__ */ __name((x) => `${Math.round(x * 1e3) / 10}%`, "pct");
function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc, "esc");
function safeHref(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}
__name(safeHref, "safeHref");
var oneLine2 = /* @__PURE__ */ __name((s) => String(s ?? "").replace(/\s+/g, " ").trim(), "oneLine");
var clip2 = /* @__PURE__ */ __name((s, n) => {
  const t = oneLine2(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}, "clip");
function L(key, v) {
  return `<span class="l-en">${tr(key, "en", v)}</span><span class="l-uk" lang="uk">${tr(key, "uk", v)}</span>`;
}
__name(L, "L");
function pair(en2, uk2) {
  return `<span class="l-en">${en2}</span><span class="l-uk" lang="uk">${uk2}</span>`;
}
__name(pair, "pair");
function attr(name, key, v) {
  const en2 = tr(key, "en", v);
  const uk2 = tr(key, "uk", v);
  return `${name}="${esc(en2)}" data-en-${name}="${esc(en2)}" data-uk-${name}="${esc(uk2)}" data-i18n`;
}
__name(attr, "attr");
function safeEvidence(evidence) {
  const out = {};
  for (const [key, value] of Object.entries(evidence || {})) {
    if (typeof value === "string") out[key] = esc(value);
    else if (Array.isArray(value) && value.every((x) => typeof x === "string")) out[key] = value.map(esc).join(", ");
    else out[key] = value;
  }
  if (Array.isArray(evidence?.samples)) out.n = evidence.samples.length;
  return out;
}
__name(safeEvidence, "safeEvidence");
var CHECK = '<svg class="ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var ARROW = '<span class="arrow" aria-hidden="true">→</span>';
var STOP2 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 12h9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
var INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.5v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.35" fill="currentColor"/></svg>';
var ICONS = {
  getlooploop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5a4.5 4.5 0 1 0 0 9c2.4 0 3.4-1.9 4.5-4.5s2.1-4.5 4.5-4.5a4.5 4.5 0 1 1 0 9c-2.4 0-3.4-1.9-4.5-4.5S9.9 7.5 7.5 7.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  bluesky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.3C8 5.4 11 9.6 12 11.8c1-2.2 4-6.4 6.8-8.5 2-1.5 5.2-2.6 5.2 1 0 .7-.4 6-.6 6.9-.8 3-3.8 3.7-6.5 3.3 4.7.8 5.9 3.4 3.3 6.1-4.9 5-7-1.3-7.6-2.9l-.6-1.7-.6 1.7c-.6 1.6-2.7 7.9-7.6 2.9-2.6-2.7-1.4-5.3 3.3-6.1-2.7.4-5.7-.3-6.5-3.3C.4 10.3 0 5 0 4.3c0-3.6 3.2-2.5 5.2-1z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>'
};
var FOOTER_LINKS = [
  { id: "getlooploop", name: "GetLoopLoop", href: "https://www.getlooploop.com" },
  { id: "x", name: "X", href: "https://x.com/Looploopnow" },
  { id: "bluesky", name: "Bluesky", href: "https://bsky.app/profile/getlooploop.bsky.social" },
  { id: "linkedin", name: "LinkedIn", href: "https://www.linkedin.com/in/olexandr-tsyrkin-07460539", key: "footerAuthor" }
];
var CSS = `
:root{
  --bg:#060b14;--bg-2:#08101d;--panel:#0a1424;--panel-2:#0d1a2e;--line:#1b2b42;--line-2:#24395a;
  --text:#e6eef8;--muted:#8fa1b8;--faint:#5f728b;
  --accent:#22d3ee;--accent-ink:#04121a;--accent-soft:rgba(34,211,238,.12);--glow:0 0 0 1px rgba(34,211,238,.18),0 0 32px rgba(34,211,238,.10);
  --amber:#f5a524;--amber-soft:rgba(245,165,36,.14);
  --red:#f87171;--red-soft:rgba(248,113,113,.13);--green:#34d399;--green-soft:rgba(52,211,153,.12);
  --empty:#0f1d33;--shadow:0 1px 0 rgba(255,255,255,.03) inset;
  color-scheme:dark;
}
@media (prefers-color-scheme: light){
  :root:not([data-theme="dark"]){
    --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
    --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
    --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
    --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
    --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--green:#047857;--green-soft:rgba(4,120,87,.09);
    --empty:#eef3f8;--shadow:none;
    color-scheme:light;
  }
}
:root[data-theme="light"]{
  --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
  --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
  --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
  --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
  --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--green:#047857;--green-soft:rgba(4,120,87,.09);
  --empty:#eef3f8;--shadow:none;
  color-scheme:light;
}
.l-uk{display:none}
:root[data-lang="uk"] .l-en{display:none}
:root[data-lang="uk"] .l-uk{display:inline}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;overflow-wrap:anywhere}
a{color:var(--accent)}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.mono,.eyebrow,.tag,.chip-n,.code{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.wrap{max-width:1120px;margin:0 auto;padding:28px 16px 32px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.toggles{display:flex;gap:8px;flex-wrap:wrap}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
.toggle{display:inline-flex;border:1px solid var(--line);border-radius:10px;padding:3px;background:var(--panel)}
.toggle button{font:inherit;font-size:13px;color:var(--muted);background:none;border:0;border-radius:7px;padding:4px 12px;cursor:pointer}
.toggle button[aria-pressed="true"]{background:var(--panel-2);color:var(--text);box-shadow:0 0 0 1px var(--line-2)}
h1{font-size:clamp(28px,4.6vw,46px);line-height:1.08;letter-spacing:-.02em;margin:10px 0 10px;font-weight:800}
h2{font-size:20px;margin:0;letter-spacing:-.01em}
h3{font-size:16px;margin:0}
.url{display:inline-block;font-size:14px;margin-bottom:14px;word-break:break-all}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;padding:0;list-style:none}
.tag{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;color:var(--muted);background:var(--panel)}
.tag b{color:var(--text);font-weight:600}
.tag a{text-transform:none;letter-spacing:0}
.tag.warn{border-color:var(--amber);color:var(--amber);background:var(--amber-soft)}
.tag.warn b{color:var(--amber)}
.note{margin:0;color:var(--muted);max-width:820px;font-size:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:22px;box-shadow:var(--glow)}
.panel-head{display:flex;justify-content:space-between;align-items:baseline;gap:6px 12px;flex-wrap:wrap;margin-bottom:14px}
.panel-head .sub{color:var(--muted);font-size:13px}
.info{display:flex;gap:12px;align-items:flex-start;margin-top:18px;border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--panel);border-radius:12px;padding:14px 18px}
.info>svg{width:20px;height:20px;color:var(--accent);flex:none;margin-top:1px}
.info-items{display:grid;gap:10px;min-width:0}
.info h2{font-size:14.5px;margin:0 0 2px}
.info p{margin:0;font-size:14px;color:var(--muted);max-width:860px;overflow-wrap:anywhere}
.info p b{color:var(--text);font-weight:600}
@media (max-width:480px){.info{padding:12px 14px;gap:10px}}
.lb-uk{display:none}
:root[data-lang="uk"] .lb-en{display:none}
:root[data-lang="uk"] .lb-uk{display:block}
.refusal{margin-top:18px;border:1.5px solid var(--red);border-left-width:4px;background:var(--panel);border-radius:14px;padding:18px 20px;box-shadow:var(--glow)}
.refusal-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.refusal-head svg{width:30px;height:30px;color:var(--red);flex:none}
.refusal-head h2{font-size:clamp(20px,3.4vw,26px);color:var(--text);margin:0}
.refusal .lead{margin:0 0 14px;font-size:15.5px;max-width:860px}
.refusal ul{margin:0;padding-left:20px;max-width:860px}
.refusal>div>ul>li{margin:0 0 12px}
.refusal li ul{margin-top:6px}
.refusal li li{margin:0 0 6px}
.refusal p,.refusal li{font-size:14.5px;line-height:1.55;overflow-wrap:anywhere}
.refusal b{font-weight:700;color:var(--text)}
.refusal .src-link{white-space:nowrap;margin-left:4px;font-size:13px}
.refusal .sanctions{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--line);max-width:860px}
.refusal .last{margin:12px 0 0;color:var(--muted)}
.refusal.compact{margin-top:10px;padding:14px 16px}
@media (max-width:480px){.refusal{padding:14px 14px}.refusal ul{padding-left:16px}}
.banner{margin-top:18px;border:1.5px solid var(--red);background:var(--red-soft);border-radius:14px;padding:14px 18px}
.banner h2{color:var(--red);font-size:17px;margin-bottom:4px}
.banner p{margin:0;font-size:14.5px}
.pipeline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0;padding:0 0 16px;list-style:none;border-bottom:1px solid var(--line)}
.pipeline li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px}
.pipeline .step{display:inline-flex;align-items:center;flex-wrap:wrap;gap:2px 7px;padding:6px 11px;border:1px solid var(--line);border-radius:10px;background:var(--panel-2);overflow-wrap:normal;word-break:normal}
.pipeline .step small{color:var(--muted);font-weight:500;font-size:13px}
.ok{width:15px;height:15px;color:var(--accent);flex:none}
.arrow{color:var(--faint)}
.pipeline-note{color:var(--muted);font-size:12.5px;margin:10px 0 0}
.counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.counter{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.counter .n{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.counter .n small{font-size:16px;color:var(--muted);font-weight:600}
.counter .l{color:var(--muted);font-size:13px;margin-top:4px}
.counter.full{border-color:var(--amber);background:var(--amber-soft)}
.counter.full .n,.counter.full .n small{color:var(--amber)}
.strip{display:flex;align-items:stretch;gap:8px;margin-top:8px}
.frame{position:relative;flex:26 1 0;min-width:0;display:flex;gap:3px;padding:6px;border:1.5px solid var(--accent);border-radius:10px;background:var(--accent-soft)}
.frame.full{border-color:var(--amber)}
.cell{flex:1 1 0;min-width:0;height:44px;border-radius:4px;background:var(--c);display:block;position:relative;transition:transform .12s, box-shadow .12s}
.cell.side{background:repeating-linear-gradient(135deg,var(--c) 0 5px,color-mix(in srgb,var(--c) 55%,var(--panel)) 5px 8px)}
.cell:hover,.cell:focus-visible,.cell.on{transform:translateY(-3px);box-shadow:0 0 0 2px var(--panel),0 0 0 4px var(--c);outline:none}
.slot{flex:1 1 0;min-width:0;height:44px;border-radius:4px;border:1px dashed var(--line-2);background:var(--empty)}
.tail{flex:0 0 22%;min-width:64px;border:1.5px dashed var(--amber);border-radius:10px;background:var(--amber-soft);color:var(--amber);display:flex;flex-direction:column;justify-content:center;padding:6px 10px;font-size:12px;line-height:1.3}
.tail b{font-size:15px;font-variant-numeric:tabular-nums}
.scale{display:flex;gap:8px;margin-top:6px;font-size:11.5px;color:var(--muted)}
.scale .in{flex:26 1 0;min-width:0;display:flex;justify-content:space-between}
.scale .out{flex:0 0 22%;min-width:64px;color:var(--amber)}
.scale .cap{color:var(--accent);font-weight:700}
.scale .cap.full{color:var(--amber)}
.compact .cell,.compact .slot{height:30px}
.readout{margin:12px 0 0;min-height:3.2em;padding:10px 12px;border-radius:10px;background:var(--panel-2);border:1px solid var(--line);font-size:13.5px;color:var(--muted)}
.readout b{color:var(--text)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;padding:0;list-style:none;font-size:13px;color:var(--muted)}
.legend li{display:flex;align-items:center;gap:6px}
.sw{width:10px;height:10px;border-radius:3px;background:var(--c);flex:none}
.groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.gcard{border:1px solid var(--line);border-top:3px solid var(--c);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.gcard .gid{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gcard h3{margin:4px 0 8px;font-size:16.5px;line-height:1.3}
.gcard .gnote{color:var(--muted);font-size:13px;margin:0 0 8px}
.src{display:inline-flex;flex-wrap:wrap;gap:2px 6px;align-items:baseline;font-size:11px;letter-spacing:.06em;border-radius:6px;padding:2px 7px;border:1px solid var(--line-2);color:var(--muted);max-width:100%}
.src .k{text-transform:uppercase}
.src .v{letter-spacing:0;font-size:12px;color:var(--text);text-transform:none}
.src.heading{border-color:var(--accent)}
.src.heading .k{color:var(--accent)}
.topic{display:inline-block;margin:0 0 8px;font-size:11.5px;border-radius:999px;padding:1px 9px;background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent)}
.gstats{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0 8px;font-size:13px;color:var(--muted)}
.gstats b{color:var(--text);font-variant-numeric:tabular-nums}
.bar{height:6px;border-radius:999px;background:var(--empty);overflow:hidden}
.bar span{display:block;height:100%;background:var(--c);border-radius:999px}
.explain{color:var(--muted);font-size:13px;margin:12px 0 0}
.pgroup{margin-top:18px}
.pgroup:first-of-type{margin-top:4px}
.pgroup-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.pgroup-head .sw{width:12px;height:12px}
.pgroup-head small{color:var(--muted);font-weight:500;font-size:13px}
.plist{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.passage{border:1px solid var(--line);border-left:3px solid var(--c);border-radius:10px;padding:10px 14px;background:var(--panel-2);scroll-margin-top:16px}
.passage:target{box-shadow:0 0 0 2px var(--c)}
.phead{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:13px;color:var(--muted)}
.phead .num{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-weight:700;color:var(--text);font-size:13.5px}
.phead .ph{color:var(--text);font-weight:600}
.role{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;border-radius:6px;padding:1px 7px;border:1px solid var(--line-2)}
.role.related,.role.utility{color:var(--amber);border-color:var(--amber)}
.role.dup{color:var(--muted)}
.opening{margin:6px 0 0;font-size:14px}
details{margin-top:6px}
summary{cursor:pointer;color:var(--accent);font-size:13px;width:max-content;max-width:100%}
.full-text{white-space:pre-wrap;margin:8px 0 0;padding:10px 12px;border-radius:8px;background:var(--panel);border:1px solid var(--line);font-size:13.5px;max-height:420px;overflow:auto}
.cut{margin-top:12px;border:1.5px dashed var(--amber);background:var(--amber-soft);color:var(--text);border-radius:10px;padding:10px 14px;font-size:14px}
.cut b{color:var(--amber)}
.sides{margin:0;padding-left:18px}
.sides li{margin:3px 0}
.kw{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.kw h3,.subhead{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 8px;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-weight:700}
.subhead{margin-top:22px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;font-size:13.5px;background:var(--panel-2)}
.chip.scope{border-color:var(--accent);background:var(--accent-soft)}
.chip-n{font-size:11.5px;color:var(--muted)}
.chips.phrases .chip{font-size:14.5px;font-weight:600;padding:4px 12px}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel-2)}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:0}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.code{font-size:12.5px}
.pill{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:1px 9px;border:1px solid var(--line-2);color:var(--muted);white-space:nowrap;font-weight:600}
.pill.good{color:var(--green);border-color:var(--green);background:var(--green-soft)}
.pill.bad{color:var(--red);border-color:var(--red);background:var(--red-soft)}
.pill.mid{color:var(--amber);border-color:var(--amber);background:var(--amber-soft)}
.pill.sev-high{color:var(--red);border-color:var(--red);background:var(--red-soft)}
.pill.sev-medium{color:var(--amber);border-color:var(--amber);background:var(--amber-soft)}
.pill.sev-low{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.small{font-size:12.5px;color:var(--muted)}
.facts-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.kv{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--panel-2)}
.kv .k{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.kv .v{margin-top:4px;font-size:14px}
.findings{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.finding{border:1px solid var(--line);border-left:3px solid var(--sev);border-radius:12px;padding:12px 16px;background:var(--panel-2)}
.finding.high{--sev:var(--red)}.finding.medium{--sev:var(--amber)}.finding.low{--sev:var(--accent)}.finding.info{--sev:var(--line-2)}
.fhead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.fhead h3{font-size:15.5px}
.fhead .code{color:var(--faint)}
.finding p{margin:6px 0 0;font-size:14px}
.finding .tell{color:var(--muted)}
.finding .tell b{color:var(--text)}
.refs{display:flex;flex-wrap:wrap;gap:4px 8px;margin-top:6px;font-size:13px}
.refs a{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-decoration:none;border:1px solid var(--line-2);border-radius:6px;padding:0 6px}
.samples{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:4px}
.samples li{font-size:13px;color:var(--muted);border-left:2px solid var(--line-2);padding-left:10px}
.samples q{color:var(--text)}
.plan{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.item{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.ihead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:8px}
.ihead .pill{white-space:normal;max-width:100%}
.prio{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--accent);color:var(--accent-ink);font-weight:800;font-size:14px}
.item dl{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;font-size:14px}
.item dt{color:var(--muted);font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding-top:2px}
.item dd{margin:0}
.ba{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:stretch;margin-top:12px}
.ba .side{border-radius:10px;padding:10px 12px;font-size:13.5px;border:1px solid}
.ba .side .k{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;margin-bottom:4px}
.ba .was{border-color:var(--amber);background:var(--amber-soft)}
.ba .was .k{color:var(--amber)}
.ba .now{border-color:var(--green);background:var(--green-soft)}
.ba .now .k{color:var(--green)}
.ba .to{align-self:center;color:var(--faint);font-size:18px}
.quote{font-size:13px}
.win{font-weight:700;color:var(--green)}
.cellmark{display:flex;flex-direction:column;gap:3px}
.heat .hbar{display:block;height:4px;border-radius:999px;background:var(--accent);margin-top:4px;opacity:.85}
.gap{color:var(--faint)}
.yes{color:var(--green);font-weight:700}
.only{display:inline-block;margin-left:6px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:0 6px}
.closing{font-size:16px;font-weight:600;margin:0}
.closing.full{color:var(--amber)}
.fine{color:var(--muted);font-size:13px;margin:10px 0 0}
.foot{margin-top:28px;border-top:1px solid var(--line);padding:18px 0 4px;color:var(--faint);font-size:12.5px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;align-items:center}
.foot p{margin:0;max-width:560px}
.links{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.links a{display:inline-flex;align-items:center;gap:7px;color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 9px;background:var(--panel);font-size:13px}
.links a:hover{color:var(--text);border-color:var(--line-2)}
.links svg{width:15px;height:15px;flex:none}
.pagesec{border-top:1px solid var(--line);margin-top:18px;padding-top:16px}
.pagesec:first-of-type{border-top:0;margin-top:0;padding-top:0}
.pagesec h3{font-size:15px;margin-bottom:6px}
@media (max-width:540px){.counters{grid-template-columns:1fr}}
@media (max-width:720px){
  .counter .n{font-size:24px}
  .pipeline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .pipeline .arrow{display:none}
  .pipeline li{min-width:0}
  .pipeline .step{width:100%}
  .kw{grid-template-columns:1fr}
  .cell,.slot{height:36px}
  .frame{padding:4px;gap:2px}
  .tail{flex-basis:26%;padding:4px 6px;font-size:11px}
  .tail b{font-size:13px}
  .scale .out{flex-basis:26%}
  .panel{padding:16px}
  .ba{grid-template-columns:1fr}
  .ba .to{justify-self:center;transform:rotate(90deg)}
  .item dl{grid-template-columns:1fr}
  .facts-grid{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.cell{transition:none}}
`;
var JS = `
(function(){
  var root=document.documentElement,KEY="vectorscope-theme",LKEY="vectorscope-lang";
  function param(re){var m=re.exec(location.search+location.hash);return m?m[1]:null}
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function effective(){var t=root.getAttribute("data-theme");if(t)return t;try{return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){return "dark"}}
  function paint(){var t=effective(),l=root.getAttribute("data-lang")||"en";var b=document.querySelectorAll("[data-set-theme]");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t));var c=document.querySelectorAll("[data-set-lang]");for(var j=0;j<c.length;j++)c[j].setAttribute("aria-pressed",String(c[j].getAttribute("data-set-lang")===l))}
  function applyLang(l){
    root.setAttribute("data-lang",l);root.setAttribute("lang",l==="uk"?"uk":"en");
    var els=document.querySelectorAll("[data-i18n]"),pre="data-"+l+"-";
    for(var i=0;i<els.length;i++){var el=els[i],set=[];for(var j=0;j<el.attributes.length;j++){var a=el.attributes[j];if(a.name.indexOf(pre)===0)set.push([a.name.slice(pre.length),a.value])}for(var k=0;k<set.length;k++)el.setAttribute(set[k][0],set[k][1])}
  }
  var first=param(/[?#&]theme=(light|dark)/)||get(KEY);if(first==="light"||first==="dark")root.setAttribute("data-theme",first);
  var lang=param(/[?#&]lang=(en|uk)/)||get(LKEY);root.setAttribute("data-lang",lang==="uk"?"uk":"en");
  document.addEventListener("DOMContentLoaded",function(){
    applyLang(root.getAttribute("data-lang"));paint();
    var b=document.querySelectorAll("[data-set-theme]");
    for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);put(KEY,t);paint()});
    var c=document.querySelectorAll("[data-set-lang]");
    for(var j=0;j<c.length;j++)c[j].addEventListener("click",function(){var l=this.getAttribute("data-set-lang");applyLang(l);put(LKEY,l);paint()});
    var outs=document.querySelectorAll(".readout");
    for(var o=0;o<outs.length;o++)(function(out){
      var scope=out.parentNode,cells=scope.querySelectorAll(".cell"),idle=null;
      function show(c){if(idle===null)idle=out.innerHTML;out.innerHTML=c.getAttribute("data-tip")}
      function reset(){if(idle!==null)out.innerHTML=idle}
      for(var q=0;q<cells.length;q++){
        cells[q].addEventListener("mouseenter",function(){show(this)});
        cells[q].addEventListener("focus",function(){show(this)});
        cells[q].addEventListener("mouseleave",function(){if(document.activeElement!==this)reset()});
        cells[q].addEventListener("blur",reset);
      }
    })(outs[o]);
  });
})();
`;
function documentStart(title) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="referrer" content="no-referrer">',
    // No network from this file: styles and the one script are inline, nothing else loads.
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">`,
    `<title>${esc(title)}</title>`,
    `<style>${CSS}</style>`,
    `<script>${JS}</script>`,
    "</head>",
    "<body>",
    '<main class="wrap">'
  ];
}
__name(documentStart, "documentStart");
function topBar(eyebrowKey) {
  return [
    '<div class="top">',
    `<span class="eyebrow">${L(eyebrowKey)}</span>`,
    '<div class="toggles">',
    `<div class="toggle" role="group" ${attr("aria-label", "langGroup")}><button type="button" data-set-lang="en" aria-pressed="true">EN</button><button type="button" data-set-lang="uk" aria-pressed="false" lang="uk">UK</button></div>`,
    `<div class="toggle" role="group" ${attr("aria-label", "themeGroup")}><button type="button" data-set-theme="dark" aria-pressed="false">${L("dark")}</button><button type="button" data-set-theme="light" aria-pressed="false">${L("light")}</button></div>`,
    "</div>",
    "</div>"
  ];
}
__name(topBar, "topBar");
function footer(madeKey = "footerMade") {
  const links = FOOTER_LINKS.map((link) => {
    const label = link.key ? `${esc(link.name)} · ${L(link.key)}` : esc(link.name);
    return `<li><a href="${esc(link.href)}" rel="noopener noreferrer" target="_blank">${ICONS[link.id]}<span>${label}</span></a></li>`;
  }).join("");
  return [`<footer class="foot"><p>${L(madeKey)}</p><ul class="links">${links}</ul></footer>`];
}
__name(footer, "footer");
function documentEnd() {
  return ["</main>", "</body>", "</html>"];
}
__name(documentEnd, "documentEnd");
var SEV_KEY = { high: "sevHigh", medium: "sevMedium", low: "sevLow", info: "sevInfo" };
var KIND_KEY = { search: "kindSearch", user: "kindUser", training: "kindTraining", index: "kindIndex" };
var VERDICT_KEY = { complete: "vComplete", partial: "vPartial", missing: "vMissing" };
var VERDICT_CLASS = { complete: "good", partial: "mid", missing: "bad" };
function answeringBlocked(robots) {
  if (!robots) return [];
  return (robots.bots || []).filter((bot) => !bot.allowed && bot.kind !== "training");
}
__name(answeringBlocked, "answeringBlocked");
function bannerFor(robots, prefix = "") {
  if (!robots) return [];
  if (robots.status === "unreachable") {
    return [`<section class="banner" role="alert"><h2>${prefix}${L("bannerTitle")}</h2><p>${L("bannerUnreachable")}</p></section>`];
  }
  const blocked = answeringBlocked(robots);
  if (!blocked.length) return [];
  const bots = blocked.map((b) => `<b class="mono">${esc(b.token)}</b>`).join(", ");
  return [`<section class="banner" role="alert"><h2>${prefix}${L("bannerTitle")}</h2><p>${L("bannerBody", { bots })}</p></section>`];
}
__name(bannerFor, "bannerFor");
function boldMarks(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}
__name(boldMarks, "boldMarks");
function sourceLink(url) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
  }
  return `<a class="src-link" href="${esc(url)}" rel="noopener noreferrer" target="_blank">${esc(host)} ↗</a>`;
}
__name(sourceLink, "sourceLink");
function refusalBody(lang) {
  const out = [`<p class="lead">${esc(REFUSAL_COPY.lead[lang])}</p>`, "<ul>"];
  for (const f of FINDINGS) {
    if (f.items) {
      out.push(`<li><b>${esc(f.source[lang])}</b><ul>`);
      for (const item of f.items) out.push(`<li>${boldMarks(item.text[lang])} ${sourceLink(item.url)}</li>`);
      out.push("</ul></li>");
    } else {
      out.push(`<li><b>${esc(f.source[lang])}</b>${esc(f.joiner[lang])}${boldMarks(f.text[lang])} ${sourceLink(f.url)}</li>`);
    }
  }
  out.push("</ul>");
  const lists = SANCTIONS_LINKS.map((l) => `<a href="${esc(l.url)}" rel="noopener noreferrer" target="_blank">${esc(l.name)}</a>`).join(" · ");
  out.push(`<p class="sanctions"><b>${esc(REFUSAL_COPY.sanctionsLabel[lang])}:</b> ${esc(REFUSAL_COPY.sanctions[lang])} ${lists}</p>`);
  out.push(`<p class="last">${esc(REFUSAL_COPY.lastLine[lang])}</p>`);
  return out.join("");
}
__name(refusalBody, "refusalBody");
function refusalBlock(compact = false) {
  return [
    `<section class="refusal${compact ? " compact" : ""}" role="alert">`,
    `<div class="refusal-head">${STOP2}<h2>${L("refusalTitle")}</h2></div>`,
    `<div class="lb-en">${refusalBody("en")}</div><div class="lb-uk" lang="uk">${refusalBody("uk")}</div>`,
    "</section>"
  ];
}
__name(refusalBlock, "refusalBlock");
function renderRefusalHtml(reading) {
  const url = reading.page?.url || reading.requestedInput || "";
  const href = safeHref(url);
  const out = documentStart(`Vectorscope: ${REFUSAL_COPY.title.en}`);
  out.push(...topBar("eyebrow"));
  out.push("<header>");
  out.push(
    href ? `<a class="url mono" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(url)}</a>` : `<span class="url mono">${esc(url)}</span>`
  );
  out.push("</header>");
  out.push(...refusalBlock());
  out.push(...footer("footerMadeRefused"));
  out.push(...documentEnd());
  return out.join("\n") + "\n";
}
__name(renderRefusalHtml, "renderRefusalHtml");
function byLine(judgements, lang) {
  const one = /* @__PURE__ */ __name((j) => tr("infoBy", lang, { agent: j?.agent ? esc(j.agent) : null, model: j?.model ? esc(j.model) : null }), "one");
  const keys = judgements.map((x) => JSON.stringify([x.j?.agent ?? null, x.j?.model ?? null]));
  if (new Set(keys).size <= 1) return one(judgements[0]?.j);
  return judgements.map((x) => tr("infoByPage", lang, { n: x.n, by: one(x.j) })).join("; ");
}
__name(byLine, "byLine");
function infoPanel(cap, judgements) {
  const link = `<a href="${VECTORSCOPE_URL}" rel="noopener noreferrer" target="_blank">getlooploop.com/vectorscope</a>`;
  const judge = pair(tr("infoJudgeBody", "en", { by: byLine(judgements, "en"), link }), tr("infoJudgeBody", "uk", { by: byLine(judgements, "uk"), link }));
  return [
    `<section class="info" ${attr("aria-label", "infoAria")}>${INFO}<div class="info-items">`,
    `<div><h2>${L("infoSameTitle")}</h2><p>${L("infoSameBody", { cap })}</p></div>`,
    `<div><h2>${L("infoJudgeTitle")}</h2><p>${judge}</p></div>`,
    `<div><h2>${L("infoNotTitle")}</h2><p>${L("infoNotBody", { cap })}</p></div>`,
    "</div></section>"
  ];
}
__name(infoPanel, "infoPanel");
function refs(passages, anchor) {
  if (!passages?.length) return "";
  return `<div class="refs"><span class="small">${L("passagesLabel")}:</span>${passages.map((i) => `<a href="#${anchor(i)}">#${i}</a>`).join("")}</div>`;
}
__name(refs, "refs");
function robotsTable(robots, pageUrl) {
  const out = [];
  if (!robots) return out;
  if (robots.status === "not_checked") {
    out.push(`<p class="note">${L("robotsNotChecked")}</p>`);
    return out;
  }
  let path = "/";
  try {
    path = pathOf(pageUrl);
  } catch {
  }
  out.push(`<p class="small" style="margin:0 0 8px">${L("robotsFor", { path: `<span class="mono">${esc(path)}</span>` })}</p>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colCrawler")}</th><th>${L("colVendor")}</th><th>${L("colPurpose")}</th><th>${L("colVerdict")}</th><th>${L("colRule")}</th></tr></thead><tbody>`);
  for (const bot of robots.bots) {
    const verdict = bot.allowed ? `<span class="pill good">${L("allowed")}</span>` : `<span class="pill bad">${L("blocked")}</span>`;
    const rule = bot.rule ? `<span class="code">${esc(bot.rule)}</span>${bot.group === "*" ? ` <span class="small">${L("groupStar")}</span>` : ""}` : `<span class="small">${L("noRule")}</span>`;
    const caveat = bot.honours === false ? `<div class="small">${L("mayIgnore")}</div>` : "";
    out.push(`<tr><td class="code">${esc(bot.token)}</td><td>${esc(bot.vendor)}</td><td>${L(KIND_KEY[bot.kind])}${caveat}</td><td>${verdict}</td><td>${rule}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  if (robots.status === "ok") out.push(`<p class="small" style="margin:8px 0 0">${L("robotsSource", { url: `<span class="mono">${esc(robots.url)}</span>` })}</p>`);
  if (robots.status === "none") out.push(`<p class="small" style="margin:8px 0 0">${L("robotsNone", { status: esc(robots.httpStatus) })}</p>`);
  return out;
}
__name(robotsTable, "robotsTable");
function technicalGrid(reading) {
  const t = reading.technical;
  if (!t) return [];
  const out = [];
  out.push(`<h3 class="subhead">${L("technical")}</h3>`);
  out.push('<div class="facts-grid">');
  const types = t.jsonLd.types.length ? t.jsonLd.types.map((x) => `<span class="code">${esc(x)}</span>`).join(", ") : L("jsonLdNone");
  const invalid = t.jsonLd.invalid ? ` · ${L("jsonLdInvalid", { n: t.jsonLd.invalid })}` : "";
  out.push(`<div class="kv"><div class="k">${L("jsonLd")}</div><div class="v">${types}${invalid}</div></div>`);
  let canon;
  if (!t.canonical.present) canon = `<span class="pill mid">${L("canonicalMissing")}</span>`;
  else {
    canon = t.canonical.self ? `<span class="pill good">${L("canonicalSelf")}</span>` : `<span class="pill bad">${L("canonicalOther")}</span>`;
    if (!t.canonical.absolute) canon += ` <span class="pill mid">${L("canonicalRelative")}</span>`;
    canon += `<div class="small mono" style="margin-top:4px">${esc(t.canonical.href)}</div>`;
  }
  out.push(`<div class="kv"><div class="k">${L("canonical")}</div><div class="v">${canon}</div></div>`);
  const desc = t.metaDescription.present ? L("metaChars", { n: t.metaDescription.length }) : `<span class="pill mid">${L("metaNone")}</span>`;
  out.push(`<div class="kv"><div class="k">${L("metaDescription")}</div><div class="v">${desc}</div></div>`);
  out.push("</div>");
  const r = reading.render;
  if (r) {
    const text = r.ok ? L("renderDone", { js: r.wordCount, jsp: r.passages, plain: reading.page.wordCount, plainp: reading.page.chunksIndexed }) : r.reason === "no_browser" ? L("renderNoBrowser") : L("renderFailed", { reason: esc(r.reason) });
    out.push(`<div class="kv" style="margin-top:10px"><div class="k">${L("render")}</div><div class="v">${text}</div></div>`);
  }
  return out;
}
__name(technicalGrid, "technicalGrid");
function findingCard(finding, anchor) {
  const ev = safeEvidence(finding.evidence);
  const en2 = checkCopy(finding.code, "en", ev);
  const uk2 = checkCopy(finding.code, "uk", ev);
  const out = [];
  out.push(`<li class="finding ${finding.severity}">`);
  out.push(`<div class="fhead"><span class="pill sev-${finding.severity}">${L(SEV_KEY[finding.severity])}</span><h3>${pair(en2.title, uk2.title)}</h3><span class="code">${esc(finding.code)}</span></div>`);
  if (en2.what) out.push(`<p>${pair(en2.what, uk2.what)}</p>`);
  const samples = finding.evidence?.samples;
  if (Array.isArray(samples) && samples.length) {
    out.push('<ul class="samples">');
    for (const s of samples) {
      const where = s.passage !== void 0 ? `<a href="#${anchor(s.passage)}" class="mono">#${s.passage}</a> ` : "";
      let body;
      if (s.lines) body = `<q>${esc(s.lines.join(" · "))}</q>${s.count > s.lines.length ? ` <span class="small">(+${s.count - s.lines.length})</span>` : ""}`;
      else if (s.phrase) body = `<q>${esc(s.phrase)}</q> <span class="small">· ${s.groups}/${finding.evidence.groupCount} · ${s.passages.map((i) => `<a class="mono" href="#${anchor(i)}">#${i}</a>`).join(" ")}</span>`;
      else if (s.heading) body = `<q>${esc(s.heading)}</q> <span class="small">· ${fmt(s.chars)}</span>`;
      else body = `<q>${esc(s.text)}</q>`;
      out.push(`<li>${where}${body}</li>`);
    }
    out.push("</ul>");
  }
  const sampled = Array.isArray(samples) ? new Set(samples.map((s) => s.passage)) : /* @__PURE__ */ new Set();
  if (finding.passages.length && finding.passages.some((p) => !sampled.has(p)) && !samples?.some((s) => s.phrase)) out.push(refs(finding.passages, anchor));
  out.push(`<p class="tell"><b>${L("whatToDo")}:</b> ${pair(en2.tell, uk2.tell)}</p>`);
  out.push("</li>");
  return out.join("");
}
__name(findingCard, "findingCard");
function checksPanel(reading, checks, anchor) {
  const out = [];
  out.push('<section class="panel" id="checks" aria-labelledby="h-checks">');
  out.push(`<div class="panel-head"><h2 id="h-checks">${L("checks")}</h2><span class="sub">${L("checksSub")}</span></div>`);
  out.push(`<h3 class="subhead" style="margin-top:0">${L("aiCrawlers")}</h3>`);
  out.push(...robotsTable(reading.robots, reading.page.url));
  out.push(...technicalGrid(reading));
  out.push(`<h3 class="subhead">${L("findings")}</h3>`);
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  if (shown.length) {
    out.push('<ol class="findings">');
    for (const f of shown) out.push(findingCard(f, anchor));
    out.push("</ol>");
  } else {
    out.push(`<p class="note">${L("noFindings")}</p>`);
  }
  out.push("</section>");
  return out;
}
__name(checksPanel, "checksPanel");
function planPanel(plan, anchorFor, multi) {
  if (!plan?.items?.length) return [];
  const out = [];
  out.push('<section class="panel" id="plan" aria-labelledby="h-plan">');
  out.push(`<div class="panel-head"><h2 id="h-plan">${L("plan")}</h2><span class="sub">${L("planSub")}</span></div>`);
  out.push('<ol class="plan">');
  for (const item of plan.items) {
    const anchor = anchorFor(item.page);
    out.push('<li class="item">');
    const known = item.check && CHECK_COPY[item.check];
    const code = item.check ? `<span class="pill">${known ? pair(checkCopy(item.check, "en").title, checkCopy(item.check, "uk").title) : esc(item.check)}</span>` : "";
    const where = multi ? `<span class="pill">${L("pageN", { n: item.page })}</span>` : "";
    out.push(`<div class="ihead"><span class="prio">${item.priority}</span>${where}${code}${item.passages.map((i) => `<a class="mono small" href="#${anchor(i)}">#${i}</a>`).join(" ")}</div>`);
    out.push(`<dl><dt>${L("problem")}</dt><dd>${esc(item.problem)}</dd><dt>${L("fix")}</dt><dd>${esc(item.fix)}</dd></dl>`);
    if (item.before) {
      out.push(`<div class="ba"><div class="side was"><span class="k">${L("before")}</span>${esc(item.before)}</div><div class="to" aria-hidden="true">→</div><div class="side now"><span class="k">${L("after")}</span>${esc(item.after)}</div></div>`);
    }
    out.push("</li>");
  }
  out.push("</ol>");
  out.push("</section>");
  return out;
}
__name(planPanel, "planPanel");
function verdictPill(r) {
  return `<span class="pill ${VERDICT_CLASS[r.verdict]}">${L(VERDICT_KEY[r.verdict])}</span>`;
}
__name(verdictPill, "verdictPill");
function querySummary(queries, n) {
  const results = queries.map((q) => q.results[n]);
  return L("querySummary", {
    total: results.length,
    complete: results.filter((r) => r.verdict === "complete").length,
    partial: results.filter((r) => r.verdict === "partial").length,
    missing: results.filter((r) => r.verdict === "missing").length,
    citable: results.filter((r) => r.citable).length
  });
}
__name(querySummary, "querySummary");
function queriesPanelSingle(queries, n, anchor) {
  if (!queries?.length) return [];
  const out = [];
  out.push('<section class="panel" id="queries" aria-labelledby="h-queries">');
  out.push(`<div class="panel-head"><h2 id="h-queries">${L("queries")}</h2><span class="sub">${L("queriesSub")}</span></div>`);
  out.push(`<p class="note" style="margin-bottom:12px">${querySummary(queries, n)}</p>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colQuery")}</th><th>${L("colBest")}</th><th>${L("colAnswer")}</th><th>${L("colCitable")}</th><th>${L("colQuote")}</th></tr></thead><tbody>`);
  for (const q of queries) {
    const r = q.results[n];
    const src = `<div class="small">${L(q.source === "user" ? "srcUser" : "srcGenerated")}</div>`;
    const best = r.passage === null ? "—" : `<a class="mono" href="#${anchor(r.passage)}">#${r.passage}</a>`;
    out.push(`<tr><td>${esc(q.query)}${src}</td><td class="num">${best}</td><td>${verdictPill(r)}</td><td>${r.citable ? `<span class="yes">${L("yes")}</span>` : `<span class="gap">${L("no")}</span>`}</td><td class="quote">${r.quote ? `<q>${esc(r.quote)}</q>` : "—"}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  out.push("</section>");
  return out;
}
__name(queriesPanelSingle, "queriesPanelSingle");
function factsPanelSingle(facts, n, anchor) {
  if (!facts?.length) return [];
  const out = [];
  out.push('<section class="panel" id="facts" aria-labelledby="h-facts">');
  out.push(`<div class="panel-head"><h2 id="h-facts">${L("facts")}</h2><span class="sub">${L("factsSub")}</span></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colFact")}</th><th>${L("passagesLabel")}</th></tr></thead><tbody>`);
  for (const f of facts) {
    out.push(`<tr><td>${esc(f.fact)}</td><td class="num">${(f.pages[n] || []).map((i) => `<a class="mono" href="#${anchor(i)}">#${i}</a>`).join(" ")}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  out.push("</section>");
  return out;
}
__name(factsPanelSingle, "factsPanelSingle");
function diffPanel(diff) {
  if (!diff) return [];
  const out = [];
  out.push('<section class="panel" id="diff" aria-labelledby="h-diff">');
  out.push(`<div class="panel-head"><h2 id="h-diff">${L("diff")}</h2><span class="sub">${L("diffSub", { url: `<span class="mono">${esc(diff.baselineUrl)}</span>` })}</span></div>`);
  out.push(`<p class="note" style="margin-bottom:12px">${L("diffCounts", diff.counts)}</p>`);
  const b = diff.before;
  const a = diff.after;
  const yn = /* @__PURE__ */ __name((x) => x ? L("yes") : L("no"), "yn");
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colMeasure")}</th><th>${L("colBefore")}</th><th>${L("colAfter")}</th></tr></thead><tbody>`);
  out.push(`<tr><td>${L("mPassages")}</td><td class="num">${b.passages}</td><td class="num">${a.passages}</td></tr>`);
  out.push(`<tr><td>${L("mWords")}</td><td class="num">${fmt(b.words)}</td><td class="num">${fmt(a.words)}</td></tr>`);
  out.push(`<tr><td>${L("mCap")}</td><td>${yn(b.capReached)}</td><td>${yn(a.capReached)}</td></tr>`);
  out.push(`<tr><td>${L("mUnread")}</td><td class="num">${fmt(b.charsUnread)}</td><td class="num">${fmt(a.charsUnread)}</td></tr>`);
  out.push("</tbody></table></div>");
  const changes = diff.passages.filter((p) => p.status !== "same");
  if (changes.length || diff.removed.length) {
    out.push('<ul class="samples" style="margin-top:12px">');
    for (const p of changes) {
      const key = p.status === "changed" ? "stChanged" : "stAdded";
      const delta = p.charsBefore !== null ? ` <span class="small">${fmt(p.charsBefore)} → ${fmt(p.chars)}</span>` : ` <span class="small">${fmt(p.chars)}</span>`;
      out.push(`<li><a class="mono" href="#p-${p.index}">#${p.index}</a> <span class="pill ${p.status === "added" ? "good" : "mid"}">${L(key)}</span> ${p.heading ? `<q>${esc(p.heading)}</q>` : ""}${p.was !== null ? ` <span class="small">${L("wasN", { n: p.was })}</span>` : ""}${delta}</li>`);
    }
    for (const p of diff.removed) out.push(`<li><span class="mono">#${p.index}</span> <span class="pill bad">${L("stRemoved")}</span> ${p.heading ? `<q>${esc(p.heading)}</q>` : ""} <span class="small">${fmt(p.chars)}</span></li>`);
    out.push("</ul>");
  }
  if (diff.groups) {
    out.push(`<h3 class="subhead">${L("groupChanges")}</h3>`);
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colAfter")}</th><th>${L("passagesLabel")}</th><th>${L("cameFrom")}</th></tr></thead><tbody>`);
    for (const g of diff.groups.after) {
      const from = Object.entries(g.from).map(([id, count]) => `${esc(diff.groups.before[id]?.label ?? `#${id}`)} <span class="small">×${count}</span>`).join(", ");
      const fresh = g.passages - Object.values(g.from).reduce((s, x) => s + x, 0);
      out.push(`<tr><td>${g.id} · ${esc(g.label)}</td><td class="num">${g.passages}</td><td>${from || ""}${fresh ? `${from ? ", " : ""}${L("newText")} <span class="small">×${fresh}</span>` : ""}</td></tr>`);
    }
    out.push("</tbody></table></div>");
  }
  out.push("</section>");
  return out;
}
__name(diffPanel, "diffPanel");
function closingSentence(page) {
  const cap = page.chunkCap;
  const capCut = page.capReached && page.charsUnread > 0;
  if (capCut) return L("closingCut", { cap, n: page.charsUnread });
  if (page.capReached) return L("closingFull", { cap });
  return L("closingFits", { cap, n: page.chunksIndexed });
}
__name(closingSentence, "closingSentence");
function stripBlock(reading, lens, anchor, compact = false) {
  const { page } = reading;
  const cap = page.chunkCap;
  const capCut = page.capReached && page.charsUnread > 0;
  const colour = /* @__PURE__ */ __name((id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`, "colour");
  const out = [];
  out.push(`<div class="strip${compact ? " compact" : ""}">`);
  out.push(`<div class="frame${page.capReached ? " full" : ""}" role="list" ${attr("aria-label", "stripAria", { cap })}>`);
  for (const c of lens.chunks) {
    const label = oneLine2(displayLabel(lens.groups[c.group]));
    const roleEn = c.contentRole !== "main" ? ` · ${tr(c.contentRole === "related" ? "roleRelated" : "roleUtility", "en")}` : "";
    const roleUk = c.contentRole !== "main" ? ` · ${tr(c.contentRole === "related" ? "roleRelated" : "roleUtility", "uk")}` : "";
    const headEn = c.heading ? oneLine2(c.heading) : tr("noHeading", "en");
    const headUk = c.heading ? oneLine2(c.heading) : tr("noHeading", "uk");
    const tipEn = tr("cellTip", "en", { i: c.chunkIndex, heading: esc(headEn), g: c.group, label: esc(label), chars: c.charCount, role: roleEn });
    const tipUk = tr("cellTip", "uk", { i: c.chunkIndex, heading: esc(headUk), g: c.group, label: esc(label), chars: c.charCount, role: roleUk });
    const ariaEn = tr("cellAria", "en", { i: c.chunkIndex, heading: headEn, g: c.group, label, chars: c.charCount, role: roleEn });
    const ariaUk = tr("cellAria", "uk", { i: c.chunkIndex, heading: headUk, g: c.group, label, chars: c.charCount, role: roleUk });
    out.push(
      `<a role="listitem" class="cell${c.contentRole !== "main" ? " side" : ""}" style="${colour(c.group)}" href="#${anchor(c.chunkIndex)}" data-tip="${esc(tipEn)}" data-en-data-tip="${esc(tipEn)}" data-uk-data-tip="${esc(tipUk)}" aria-label="${esc(ariaEn)}" data-en-aria-label="${esc(ariaEn)}" data-uk-aria-label="${esc(ariaUk)}" title="${esc(ariaEn)}" data-en-title="${esc(ariaEn)}" data-uk-title="${esc(ariaUk)}" data-i18n></a>`
    );
  }
  for (let i = lens.chunks.length; i < cap; i++) out.push('<span class="slot" aria-hidden="true"></span>');
  out.push("</div>");
  if (capCut) out.push(`<div class="tail" role="note"><b>${fmt(page.charsUnread)}</b>${L("pastCapShort")}</div>`);
  out.push("</div>");
  out.push('<div class="scale mono" aria-hidden="true">');
  out.push(`<div class="in"><span>#0</span><span class="cap${page.capReached ? " full" : ""}">${L("cap")} · ${cap} ▲</span></div>`);
  if (capCut) out.push(`<div class="out">${L("notRead")}</div>`);
  out.push("</div>");
  out.push(`<p class="readout" aria-live="polite">${L("readoutIdle")}</p>`);
  out.push('<ul class="legend">');
  for (const g of lens.groups) out.push(`<li><span class="sw" style="${colour(g.id)}"></span>${g.id} · ${esc(oneLine2(displayLabel(g)))}</li>`);
  out.push("</ul>");
  return out;
}
__name(stripBlock, "stripBlock");
function groupCards(lens, topicsById = null) {
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const colour = /* @__PURE__ */ __name((id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`, "colour");
  const out = ['<div class="groups">'];
  for (const g of lens.groups) {
    const share = indexed ? g.charCount / indexed : 0;
    out.push(`<article class="gcard" style="${colour(g.id)}">`);
    out.push(`<div class="gid mono">${L("groupN", { n: g.id })}</div>`);
    out.push(`<h3>${esc(oneLine2(displayLabel(g)))}</h3>`);
    if (g.topic && topicsById) out.push(`<span class="topic">${esc(topicsById.get(g.topic)?.name ?? g.topic)}</span>`);
    if (g.note) out.push(`<p class="gnote">${esc(g.note)}</p>`);
    const srcKey = g.labelSource === "heading" ? "srcHeading" : g.labelSource === "keywords" ? "srcKeywords" : "srcNone";
    const titleKey = g.labelSource === "heading" ? "srcHeadingTitle" : "srcKeywordsTitle";
    const value = g.agentLabel ? `<span class="v">${esc(oneLine2(g.label))}</span>` : "";
    out.push(`<span class="src ${esc(g.labelSource)}" ${attr("title", titleKey)}><span class="k">${L("labelSource")}: ${L(srcKey)}</span>${value}</span>`);
    out.push(`<div class="gstats"><span>${L("nPassages", { n: g.chunkCount })}</span><span><b>${fmt(g.charCount)}</b> ${L("chars")}</span><span><b>${pct2(share)}</b> ${L("ofIndexed")}</span></div>`);
    out.push(`<div class="bar" role="img" aria-label="${pct2(share)}"><span style="width:${(share * 100).toFixed(1)}%"></span></div>`);
    out.push("</article>");
  }
  out.push("</div>");
  return out;
}
__name(groupCards, "groupCards");
function vocabularyPanel(lens, groupCount) {
  const phrases = lens.phrases ?? [];
  const narrative = lens.narrative ?? (lens.phrases ? [] : lens.keywords ?? []);
  const chip = /* @__PURE__ */ __name((k) => `<li class="chip${k.scope ? " scope" : ""}" ${attr("title", "kwTitleAttr", { count: k.count, passages: k.passages ?? "?", groups: k.groups, total: groupCount })}>${esc(k.term)} <span class="chip-n">×${fmt(k.count)}${k.passages !== void 0 ? ` · ${k.passages}p` : ""} · ${k.groups}/${groupCount}</span></li>`, "chip");
  const out = [];
  out.push('<section class="panel" id="vocabulary" aria-labelledby="h-kw">');
  out.push(`<div class="panel-head"><h2 id="h-kw">${L("kwTitle")}</h2></div>`);
  out.push(`<p class="note honest" style="margin-bottom:14px">${L("kwHonest", { link: `<a href="https://www.getlooploop.com/voicescope" rel="noopener noreferrer" target="_blank">getlooploop.com/voicescope</a>` })}</p>`);
  out.push(`<h3 class="subhead" style="margin-top:0">${L("phrasesTitle")}</h3>`);
  out.push(`<p class="small" style="margin:0 0 8px">${L("phrasesNote")}</p>`);
  out.push(phrases.length ? `<ul class="chips phrases">${phrases.map(chip).join("")}</ul>` : `<p class="note">${L("noPhrases")}</p>`);
  out.push(`<h3 class="subhead">${L("narrativeTitle")}</h3>`);
  out.push(`<p class="small" style="margin:0 0 8px">${L("narrativeNote")}</p>`);
  out.push(narrative.length ? `<ul class="chips">${narrative.map(chip).join("")}</ul>` : `<p class="note">${L("none")}</p>`);
  out.push("</section>");
  return out;
}
__name(vocabularyPanel, "vocabularyPanel");
function renderHtml(reading, lens, extras = {}) {
  const { page } = reading;
  const cap = page.chunkCap;
  const groupCount = lens.groups.length;
  const capCut = page.capReached && page.charsUnread > 0;
  const colour = /* @__PURE__ */ __name((id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`, "colour");
  const anchor = /* @__PURE__ */ __name((i) => `p-${i}`, "anchor");
  const checks = extras.checks ?? [];
  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {
  }
  const title = oneLine2(page.title || host || page.url);
  const href = safeHref(page.url);
  const out = documentStart(`Vectorscope reading: ${title}`);
  out.push(...topBar("eyebrow"));
  out.push("<header>");
  out.push(`<h1>${esc(title)}</h1>`);
  out.push(
    href ? `<a class="url mono" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(page.url)}</a>` : `<span class="url mono">${esc(page.url)}</span>`
  );
  if (page.url !== page.requestedUrl) out.push(`<p class="note">${L("askedFor", { url: `<span class="mono">${esc(page.requestedUrl)}</span>` })}</p>`);
  out.push('<ul class="meta">');
  out.push(`<li class="tag">${L("words", { n: page.wordCount })}</li>`);
  out.push(`<li class="tag">${L("headingsFound", { n: page.headings })}</li>`);
  out.push(page.noindex ? `<li class="tag warn">${L("noindexYes")}</li>` : `<li class="tag">${L("noindexNo")}</li>`);
  out.push("</ul>");
  out.push("</header>");
  out.push(...infoPanel(cap, [{ n: 1, j: lens.judgement }]));
  out.push(...bannerFor(reading.robots));
  out.push('<section class="panel" aria-labelledby="h-result">');
  out.push(`<div class="panel-head"><h2 id="h-result" class="eyebrow">${L("result")}</h2><span class="sub">${L("whatMachineReads")}</span></div>`);
  out.push('<ol class="pipeline">');
  const steps = [
    ["fetched", ""],
    ["extracted", L("nWords", { n: page.wordCount })],
    ["chunked", L("nPassages", { n: page.chunksIndexed })],
    ["grouped", L("nGroups", { n: groupCount })]
  ];
  steps.forEach(([name, detail], i) => {
    out.push(`<li>${i ? ARROW : ""}<span class="step">${CHECK}${L(name)}${detail ? ` <small>${detail}</small>` : ""}</span></li>`);
  });
  out.push("</ol>");
  out.push(`<p class="pipeline-note">${L("pipelineNote", { headings: page.headings, chars: page.charsIndexed, repeats: lens.duplicates })}</p>`);
  out.push('<div class="counters">');
  out.push(`<div class="counter"><div class="n">${fmt(page.chunksIndexed)}</div><div class="l">${L("passagesRead")}</div></div>`);
  out.push(`<div class="counter${page.capReached ? " full" : ""}"><div class="n">${fmt(page.chunksIndexed)}<small>/${cap}</small></div><div class="l">${L("slotsUsed", { cap, full: page.capReached })}</div></div>`);
  out.push(`<div class="counter${capCut ? " full" : ""}"><div class="n">${fmt(page.charsUnread)}</div><div class="l">${L("pastCap")}</div></div>`);
  out.push("</div>");
  out.push("</section>");
  out.push('<section class="panel" aria-labelledby="h-strip">');
  out.push(`<div class="panel-head"><h2 id="h-strip">${L("strip")}</h2><span class="sub">${L("stripSub", { cap })}</span></div>`);
  out.push(...stripBlock(reading, lens, anchor));
  out.push("</section>");
  out.push(...diffPanel(extras.diff));
  out.push(...checksPanel(reading, checks, anchor));
  out.push(...planPanel(extras.plan, () => anchor, false));
  out.push(...queriesPanelSingle(extras.queries, 1, anchor));
  out.push('<section class="panel" aria-labelledby="h-groups">');
  out.push(`<div class="panel-head"><h2 id="h-groups">${L("groupsTitle")}</h2><span class="sub">${L("groupsSub", { n: groupCount })}</span></div>`);
  out.push(...groupCards(lens, extras.topicsById ?? null));
  out.push(`<p class="explain">${L("groupsExplain")}</p>`);
  out.push("</section>");
  out.push('<section class="panel" aria-labelledby="h-passages">');
  out.push(`<div class="panel-head"><h2 id="h-passages">${L("passagesTitle")}</h2><span class="sub">${L("passagesSub", { n: PREVIEW_CHARS })}</span></div>`);
  for (const g of lens.groups) {
    out.push(`<div class="pgroup" style="${colour(g.id)}">`);
    out.push(`<div class="pgroup-head"><span class="sw"></span><h3>${g.id} · ${esc(oneLine2(displayLabel(g)))}</h3><small>${L("nPassages", { n: g.chunkCount })}</small></div>`);
    out.push('<ol class="plist">');
    for (const index of g.members) {
      const c = lens.chunks[index];
      const text = reading.passages[index]?.text ?? c.preview;
      const roleKey = c.contentRole === "related" ? "roleRelated" : c.contentRole === "utility" ? "roleUtility" : "roleMain";
      out.push(`<li class="passage" id="${anchor(c.chunkIndex)}">`);
      out.push('<div class="phead">');
      out.push(`<span class="num">#${c.chunkIndex}</span>`);
      if (c.heading) out.push(`<span class="ph">${esc(oneLine2(c.heading))}</span>`);
      out.push(`<span>${fmt(c.charCount)} ${L("chars")}</span>`);
      out.push(`<span class="role ${esc(c.contentRole)}">${L(roleKey)}</span>`);
      if (c.duplicateOf !== null) out.push(`<span class="role dup">${L("repeats", { n: c.duplicateOf })}</span>`);
      out.push("</div>");
      out.push(`<p class="opening">${esc(oneLine2(c.preview))}${c.charCount > PREVIEW_CHARS ? "…" : ""}</p>`);
      if (c.charCount > PREVIEW_CHARS) {
        out.push(`<details><summary>${L("showFull")}</summary><div class="full-text">${esc(text)}</div></details>`);
      }
      out.push("</li>");
    }
    out.push("</ol>");
    out.push("</div>");
  }
  if (capCut) out.push(`<p class="cut">${L("outsideCap", { n: page.charsUnread })}</p>`);
  out.push("</section>");
  const side = lens.chunks.filter((c) => c.contentRole !== "main");
  out.push('<section class="panel" aria-labelledby="h-side">');
  out.push(`<div class="panel-head"><h2 id="h-side">${L("sideTitle")}</h2></div>`);
  if (side.length) {
    out.push(`<p class="note">${L("sideSome", { n: side.length })}</p>`);
    out.push('<ul class="sides">');
    for (const c of side) {
      out.push(`<li><a href="#${anchor(c.chunkIndex)}">#${c.chunkIndex}</a>${c.heading ? ` · ${esc(oneLine2(c.heading))}` : ""} · ${L(c.contentRole === "related" ? "relatedLink" : "utilityCopy")} (${L("group")} ${c.group})</li>`);
    }
    out.push("</ul>");
  } else {
    out.push(`<p class="note">${L("sideNone")}</p>`);
  }
  out.push("</section>");
  out.push(...vocabularyPanel(lens, groupCount));
  out.push(...factsPanelSingle(extras.facts, 1, anchor));
  out.push('<section class="panel" aria-label="Closing">');
  out.push(`<p class="closing${capCut ? " full" : ""}">${closingSentence(page)}</p>`);
  out.push(`<p class="fine">${L("fine")}</p>`);
  out.push("</section>");
  out.push(...footer());
  out.push(...documentEnd());
  return out.join("\n") + "\n";
}
__name(renderHtml, "renderHtml");
function hostOf(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.length > 1 ? u.pathname : ""}`;
  } catch {
    return String(url);
  }
}
__name(hostOf, "hostOf");
function renderCompareHtml(data) {
  const { pages, topics, topicCmp, facts, factCmp, queries, plan } = data;
  const refused = data.refused ?? [];
  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const anchorFor = /* @__PURE__ */ __name((n) => (i) => `p${n}-${i}`, "anchorFor");
  const short = /* @__PURE__ */ __name((p) => `<span class="mono">${p.n}</span> · ${esc(clip2(hostOf(p.reading.page.url), 48))}`, "short");
  const out = documentStart(`Vectorscope comparison: ${pages.map((p) => hostOf(p.reading.page.url)).join(" vs ")}`);
  out.push(...topBar("eyebrowCompare"));
  out.push("<header>");
  out.push(`<h1>${L("compareTitle", { n: pages.length })}</h1>`);
  out.push('<ul class="meta">');
  for (const p of pages) {
    const href = safeHref(p.reading.page.url);
    out.push(`<li class="tag"><b>${p.n}</b> ${href ? `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(clip2(hostOf(p.reading.page.url), 60))}</a>` : esc(p.reading.page.url)}</li>`);
  }
  for (const r of refused) out.push(`<li class="tag warn"><b>${r.n}</b> ${esc(clip2(hostOf(r.url), 60))} · ${L("refusedTag")}</li>`);
  out.push("</ul>");
  out.push("</header>");
  out.push(...infoPanel(pages[0].reading.page.chunkCap, pages.map((p) => ({ n: p.n, j: p.lens.judgement }))));
  for (const p of pages) out.push(...bannerFor(p.reading.robots, `${L("pageN", { n: p.n })} · `));
  out.push('<section class="panel" aria-labelledby="h-pages">');
  out.push(`<div class="panel-head"><h2 id="h-pages">${L("pagesTitle")}</h2></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colPage")}</th><th>${L("colWords")}</th><th>${L("colPassages")}</th><th>${L("colPastCap")}</th><th>${L("colBlocked")}</th><th>${L("colFindings")}</th></tr></thead><tbody>`);
  for (const p of pages) {
    const pg = p.reading.page;
    const blocked = (p.reading.robots?.bots || []).filter((b) => !b.allowed).map((b) => b.token);
    const high = p.checks.filter((f) => f.severity === "high").length;
    const medium = p.checks.filter((f) => f.severity === "medium").length;
    const low = p.checks.filter((f) => f.severity === "low").length;
    const sev = [
      high ? `<span class="pill sev-high">${high} ${L("sevHigh")}</span>` : "",
      medium ? `<span class="pill sev-medium">${medium} ${L("sevMedium")}</span>` : "",
      low ? `<span class="pill sev-low">${low} ${L("sevLow")}</span>` : ""
    ].filter(Boolean).join(" ");
    out.push(
      `<tr><td>${short(p)}<div class="small">${esc(clip2(pg.title, 70))}</div></td><td class="num">${fmt(pg.wordCount)}</td><td class="num">${pg.chunksIndexed}/${pg.chunkCap}</td><td class="num">${fmt(pg.charsUnread)}</td><td>${blocked.length ? `<span class="code">${esc(blocked.join(", "))}</span>` : "—"}</td><td>${sev || "—"}</td></tr>`
    );
  }
  out.push("</tbody></table></div>");
  out.push("</section>");
  out.push('<section class="panel" id="topics" aria-labelledby="h-topics">');
  out.push(`<div class="panel-head"><h2 id="h-topics">${L("topicTable")}</h2><span class="sub">${L("topicTableSub")}</span></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colTopic")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
  for (const row of topicCmp.table) {
    const cells = pages.map((p) => {
      const c = row.cells[p.n];
      if (!c.passages) return `<td class="gap">—</td>`;
      return `<td class="num heat">${L("nPassages", { n: c.passages })} · ${fmt(c.chars)} ${L("chars")}<span class="hbar" style="width:${Math.max(4, Math.round(c.share * 100))}%"></span></td>`;
    }).join("");
    out.push(`<tr><td>${esc(row.name)}</td>${cells}</tr>`);
  }
  out.push("</tbody></table></div>");
  out.push(`<h3 class="subhead">${L("topicGaps")}</h3>`);
  out.push(`<p class="small" style="margin:0 0 8px">${L("topicGapsSub")}</p>`);
  out.push('<ul class="samples">');
  for (const p of pages) {
    const gaps = topicCmp.gaps[p.n];
    out.push(`<li>${short(p)}: ${gaps.length ? gaps.map((id) => `<q>${esc(topicsById.get(id)?.name ?? id)}</q>`).join(", ") : `<span class="yes">${L("noGaps")}</span>`}</li>`);
  }
  out.push("</ul>");
  out.push("</section>");
  if (queries?.length) {
    out.push('<section class="panel" id="queries" aria-labelledby="h-queries">');
    out.push(`<div class="panel-head"><h2 id="h-queries">${L("winners")}</h2><span class="sub">${L("queriesSub")}</span></div>`);
    out.push('<ul class="samples" style="margin:0 0 12px">');
    for (const p of pages) out.push(`<li>${short(p)}: ${querySummary(queries, p.n)}</li>`);
    out.push("</ul>");
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colQuery")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}<th>${L("colWinner")}</th></tr></thead><tbody>`);
    for (const q of queries) {
      const { winners, tie } = queryWinner(q);
      const cells = pages.map((p) => {
        const r = q.results[p.n];
        const best = r.passage === null ? "" : ` <a class="mono small" href="#${anchorFor(p.n)(r.passage)}">#${r.passage}</a>`;
        const cite = r.citable ? ` <span class="yes small">${L("citableMark")}</span>` : "";
        const quote = r.quote ? `<div class="quote small"><q>${esc(clip2(r.quote, 140))}</q></div>` : "";
        return `<td><div class="cellmark"><span>${verdictPill(r)}${best}${cite}</span>${quote}</div></td>`;
      }).join("");
      const win = winners.length ? `<span class="win">${winners.map((n) => L("pageN", { n })).join(" · ")}</span>${tie ? ` <span class="small">(${L("tie")})</span>` : ""}` : `<span class="gap">${L("nobody")}</span>`;
      out.push(`<tr><td>${esc(q.query)}<div class="small">${L(q.source === "user" ? "srcUser" : "srcGenerated")}</div></td>${cells}<td>${win}</td></tr>`);
    }
    out.push("</tbody></table></div>");
    out.push("</section>");
  }
  if (facts?.length) {
    out.push('<section class="panel" id="facts" aria-labelledby="h-facts">');
    out.push(`<div class="panel-head"><h2 id="h-facts">${L("factGaps")}</h2><span class="sub">${L("factGapsSub")}</span></div>`);
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colFact")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
    for (const f of facts) {
      const only = Object.keys(f.pages).length === 1 && pages.length > 1;
      const cells = pages.map((p) => {
        const where = f.pages[p.n];
        if (!where) return `<td class="gap">${L("notStated")}</td>`;
        return `<td><span class="yes">✓</span> ${where.map((i) => `<a class="mono small" href="#${anchorFor(p.n)(i)}">#${i}</a>`).join(" ")}${only ? `<span class="only">${L("onlyHere")}</span>` : ""}</td>`;
      }).join("");
      out.push(`<tr><td>${esc(f.fact)}${f.topic ? `<div class="small">${esc(topicsById.get(f.topic)?.name ?? f.topic)}</div>` : ""}</td>${cells}</tr>`);
    }
    out.push("</tbody></table></div>");
    out.push('<ul class="samples" style="margin-top:12px">');
    for (const p of pages) {
      out.push(`<li>${short(p)}: ${L("onlyHere")} <b>${factCmp.unique[p.n].length}</b> · ${L("notStated")} <b>${factCmp.lacking[p.n].length}</b></li>`);
    }
    out.push("</ul>");
    out.push("</section>");
  }
  out.push(...planPanel(plan, anchorFor, true));
  out.push('<section class="panel" id="checks" aria-labelledby="h-crawlers">');
  out.push(`<div class="panel-head"><h2 id="h-crawlers">${L("crawlersByPage")}</h2></div>`);
  const bots = pages.find((p) => p.reading.robots?.bots?.length)?.reading.robots.bots ?? [];
  if (bots.length) {
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colCrawler")}</th><th>${L("colPurpose")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
    for (const bot of bots) {
      const cells = pages.map((p) => {
        const b = p.reading.robots?.bots?.find((x) => x.token === bot.token);
        if (!b) return '<td class="gap">—</td>';
        return `<td>${b.allowed ? `<span class="pill good">${L("allowed")}</span>` : `<span class="pill bad">${L("blocked")}</span>`}${b.rule ? `<div class="code small">${esc(b.rule)}</div>` : ""}</td>`;
      }).join("");
      out.push(`<tr><td class="code">${esc(bot.token)}<div class="small">${esc(bot.vendor)}</div></td><td>${L(KIND_KEY[bot.kind])}</td>${cells}</tr>`);
    }
    out.push("</tbody></table></div>");
  } else {
    out.push(`<p class="note">${L("robotsNotChecked")}</p>`);
  }
  out.push(`<h3 class="subhead">${L("findingsByPage")}</h3>`);
  for (const p of pages) {
    out.push(`<div class="pagesec"><h3>${short(p)}</h3>`);
    const shown = p.checks.filter((f) => f.code !== "robots_not_checked");
    if (shown.length) {
      out.push('<ol class="findings">');
      for (const f of shown) out.push(findingCard(f, anchorFor(p.n)));
      out.push("</ol>");
    } else out.push(`<p class="note">${L("noFindings")}</p>`);
    out.push("</div>");
  }
  out.push("</section>");
  out.push('<section class="panel" aria-labelledby="h-each">');
  out.push(`<div class="panel-head"><h2 id="h-each">${L("readingByPage")}</h2></div>`);
  for (const p of pages) {
    const anchor = anchorFor(p.n);
    out.push(`<div class="pagesec"><h3>${short(p)}</h3>`);
    out.push(`<p class="small" style="margin:0 0 6px">${closingSentence(p.reading.page)}</p>`);
    out.push(...stripBlock(p.reading, p.lens, anchor, true));
    out.push('<div style="margin-top:12px"></div>');
    out.push(...groupCards(p.lens, topicsById));
    out.push(`<details><summary>${L("passagesTitle")}</summary><ol class="plist" style="margin-top:8px">`);
    for (const c of p.lens.chunks) {
      const colour = `--c:${GROUP_COLOURS[c.group] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
      const text = p.reading.passages[c.chunkIndex]?.text ?? c.preview;
      out.push(`<li class="passage" id="${anchor(c.chunkIndex)}" style="${colour}"><div class="phead"><span class="num">#${c.chunkIndex}</span>${c.heading ? `<span class="ph">${esc(oneLine2(c.heading))}</span>` : ""}<span>${fmt(c.charCount)} ${L("chars")}</span></div><div class="full-text">${esc(text)}</div></li>`);
    }
    out.push("</ol></details>");
    out.push("</div>");
  }
  for (const r of refused) {
    out.push(`<div class="pagesec"><h3><span class="mono">${r.n}</span> · ${esc(clip2(hostOf(r.url), 48))}</h3>`);
    out.push(...refusalBlock(true));
    out.push("</div>");
  }
  out.push("</section>");
  out.push('<section class="panel" aria-label="Closing">');
  out.push(`<p class="fine" style="margin:0">${L("fine")}</p>`);
  out.push("</section>");
  out.push(...footer());
  out.push(...documentEnd());
  return out.join("\n") + "\n";
}
__name(renderCompareHtml, "renderCompareHtml");

// scripts/lens.mjs
var COMPARE_SCHEMA = "getlooploop/vectorscope-compare@1";
var REFUSAL_SCHEMA = "getlooploop/vectorscope-refusal@1";
var SKILL_VERSION = 2;
var USAGE = [
  "Usage: node scripts/lens.mjs reading.json groups.json [--plan plan.json] [--queries queries.json] [--facts facts.json]",
  "         [--topics topics.json] [--baseline old-reading.json [--baseline-groups old-groups.json]] [--json out.json] [--md out.md] [--html out.html]",
  "       node scripts/lens.mjs --compare readings/manifest.json [--json out.json] [--md out.md] [--html out.html]"
].join("\n");
function fail(message) {
  console.error(`REFUSED  ${message}`);
  process.exit(1);
}
__name(fail, "fail");
function parseArgs(argv) {
  const out = { files: [] };
  const flags = ["json", "md", "html", "plan", "queries", "facts", "topics", "baseline", "baseline-groups", "compare"];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && flags.includes(arg.slice(2))) out[arg.slice(2)] = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else out.files.push(arg);
  }
  return out;
}
__name(parseArgs, "parseArgs");
function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${what} (${path}) could not be read as JSON: ${error.message}`);
  }
}
__name(readJson, "readJson");
function attempt(what, fn) {
  try {
    return fn();
  } catch (error) {
    fail(`${what}: ${error.message}`);
  }
}
__name(attempt, "attempt");
var fmt2 = /* @__PURE__ */ __name((n) => Number(n).toLocaleString("en-US"), "fmt");
var cell = /* @__PURE__ */ __name((s) => String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim(), "cell");
var pct3 = /* @__PURE__ */ __name((x) => `${Math.round(x * 1e3) / 10}%`, "pct");
var plural = /* @__PURE__ */ __name((n, one, many) => `${n} ${n === 1 ? one : many}`, "plural");
var ROLE_LABEL = { related: "related link", utility: "utility copy" };
var KIND = { search: "assistant search index", user: "fetches when a user asks", training: "training data", index: "web search index" };
function plainEvidence(evidence) {
  const out = {};
  for (const [key, value] of Object.entries(evidence || {})) {
    out[key] = Array.isArray(value) && value.every((x) => typeof x === "string") ? value.join(", ") : value;
  }
  if (Array.isArray(evidence?.samples)) out.n = evidence.samples.length;
  return out;
}
__name(plainEvidence, "plainEvidence");
function blockedBanner(robots, prefix = "") {
  if (!robots) return [];
  if (robots.status === "unreachable") {
    return [`> **${prefix}AI crawlers are blocked from this page.** robots.txt could not be read; under RFC 9309 a crawler then assumes it may fetch nothing.`, ""];
  }
  const blocked = (robots.bots || []).filter((b) => !b.allowed && b.kind !== "training");
  if (!blocked.length) return [];
  return [
    `> **${prefix}AI crawlers are blocked from this page:** robots.txt disallows it for ${blocked.map((b) => b.token).join(", ")}. Those assistants cannot fetch it, so the rest of this report is moot for them until the rule changes.`,
    ""
  ];
}
__name(blockedBanner, "blockedBanner");
function robotsMarkdown(robots) {
  const out = [];
  if (!robots || robots.status === "not_checked") {
    out.push("robots.txt was not checked in this run.", "");
    return out;
  }
  if (robots.status === "unreachable") out.push(`robots.txt at ${robots.url} did not answer${robots.httpStatus ? ` (HTTP ${robots.httpStatus})` : ""}: compliant crawlers treat the site as blocked.`, "");
  if (robots.status === "none") out.push(`No robots.txt (HTTP ${robots.httpStatus}): nothing is disallowed.`, "");
  out.push("| Crawler | Vendor | What it does | This page | Deciding rule |");
  out.push("|---|---|---|---|---|");
  for (const b of robots.bots) {
    out.push(`| ${b.token} | ${b.vendor} | ${KIND[b.kind]}${b.honours === false ? " (vendor: robots.txt may not apply)" : ""} | ${b.allowed ? "allowed" : "**blocked**"} | ${b.rule ? `\`${cell(b.rule)}\`${b.group === "*" ? " (via *)" : ""}` : "no rule matches"} |`);
  }
  out.push("");
  return out;
}
__name(robotsMarkdown, "robotsMarkdown");
function technicalMarkdown(technical, render, page) {
  if (!technical) return [];
  const t = technical;
  const out = [];
  out.push(`- **JSON-LD:** ${t.jsonLd.types.length ? t.jsonLd.types.join(", ") : "none"}${t.jsonLd.invalid ? ` (${t.jsonLd.invalid} block(s) not valid JSON)` : ""}`);
  out.push(`- **Canonical:** ${t.canonical.present ? `${cell(t.canonical.href)} (${t.canonical.self ? "this page" : "another URL"}${t.canonical.absolute ? "" : ", relative"})` : "missing"}`);
  out.push(`- **Meta description:** ${t.metaDescription.present ? `${t.metaDescription.length} characters` : "missing"}`);
  if (render) {
    out.push(
      `- **With JavaScript:** ${render.ok ? `${fmt2(render.wordCount)} words, ${render.passages} passages (plain fetch: ${fmt2(page.wordCount)} words, ${page.chunksIndexed} passages)` : render.reason === "no_browser" ? "not rendered, no local Chrome or Chromium found" : `not rendered (${render.reason})`}`
    );
  }
  out.push("");
  return out;
}
__name(technicalMarkdown, "technicalMarkdown");
function findingsMarkdown(checks) {
  const out = [];
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  if (!shown.length) {
    out.push("No automatic check found anything.", "");
    return out;
  }
  for (const f of shown) {
    const copy = checkCopy(f.code, "en", plainEvidence(f.evidence));
    out.push(`- **[${f.severity}] ${copy.title}** \`${f.code}\`${f.passages.length ? ` · passages ${f.passages.map((i) => `#${i}`).join(" ")}` : ""}  `);
    if (copy.what) out.push(`  ${copy.what}  `);
    for (const s of f.evidence?.samples ?? []) {
      const where = s.passage !== void 0 ? `#${s.passage} ` : "";
      const body = s.lines ? s.lines.join(" · ") : s.phrase ? `${s.phrase} (${s.groups} groups)` : s.heading ? `${s.heading} (${s.chars} chars)` : s.text;
      out.push(`  - ${where}“${cell(body)}”`);
    }
    out.push(`  *What to do:* ${copy.tell}`);
  }
  out.push("");
  return out;
}
__name(findingsMarkdown, "findingsMarkdown");
function planMarkdown(plan, multi) {
  if (!plan?.items?.length) return [];
  const out = ["## Rewrite plan", "", "The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.", ""];
  for (const item of plan.items) {
    out.push(`${item.priority}. ${multi ? `**Page ${item.page}** · ` : ""}${item.check ? `\`${item.check}\` · ` : ""}${item.passages.length ? `passages ${item.passages.map((i) => `#${i}`).join(" ")}` : "page-wide"}  `);
    out.push(`   **Problem:** ${cell(item.problem)}  `);
    out.push(`   **Fix:** ${cell(item.fix)}`);
    if (item.before) {
      out.push(`   - *Before:* ${cell(item.before)}`);
      out.push(`   - *After:* ${cell(item.after)}`);
    }
  }
  out.push("");
  return out;
}
__name(planMarkdown, "planMarkdown");
function queriesMarkdown(queries, n) {
  if (!queries?.length) return [];
  const out = ["## Query test", "", "The agent's judgement: for each typical query, the best passage and whether it answers on its own.", ""];
  out.push("| Query | Source | Best passage | Answer | Citable | The words that answer |");
  out.push("|---|---|---|---|---|---|");
  for (const q of queries) {
    const r = q.results[n];
    out.push(`| ${cell(q.query)} | ${q.source} | ${r.passage === null ? "—" : `#${r.passage}`} | ${r.verdict} | ${r.citable ? "yes" : "no"} | ${r.quote ? `“${cell(r.quote)}”` : "—"} |`);
  }
  out.push("");
  return out;
}
__name(queriesMarkdown, "queriesMarkdown");
function diffMarkdown(diff) {
  if (!diff) return [];
  const out = ["## Since the baseline", ""];
  out.push(`Against the reading of ${diff.baselineUrl}: ${diff.counts.same} unchanged, ${diff.counts.changed} changed, ${diff.counts.added} added, ${diff.counts.removed} removed.`, "");
  out.push("| Measure | Baseline | Now |", "|---|---|---|");
  out.push(`| Passages | ${diff.before.passages} | ${diff.after.passages} |`);
  out.push(`| Words | ${fmt2(diff.before.words)} | ${fmt2(diff.after.words)} |`);
  out.push(`| Cap reached | ${diff.before.capReached ? "yes" : "no"} | ${diff.after.capReached ? "yes" : "no"} |`);
  out.push(`| Characters past the cap | ${fmt2(diff.before.charsUnread)} | ${fmt2(diff.after.charsUnread)} |`, "");
  for (const p of diff.passages.filter((x) => x.status !== "same")) {
    out.push(`- #${p.index} ${p.status}${p.heading ? ` · ${cell(p.heading)}` : ""}${p.was !== null ? ` (was #${p.was}, ${fmt2(p.charsBefore)} → ${fmt2(p.chars)} chars)` : ` (${fmt2(p.chars)} chars)`}`);
  }
  for (const p of diff.removed) out.push(`- #${p.index} removed${p.heading ? ` · ${cell(p.heading)}` : ""} (${fmt2(p.chars)} chars)`);
  if (diff.groups) {
    out.push("", "**Group changes**", "");
    for (const g of diff.groups.after) {
      const from = Object.entries(g.from).map(([id, count]) => `${diff.groups.before[id]?.label ?? `#${id}`} ×${count}`);
      const fresh = g.passages - Object.values(g.from).reduce((s, x) => s + x, 0);
      if (fresh) from.push(`new text ×${fresh}`);
      out.push(`- ${g.id} · ${cell(g.label)} (${g.passages}) ← ${from.join(", ")}`);
    }
  }
  out.push("");
  return out;
}
__name(diffMarkdown, "diffMarkdown");
function groupsTable(lens, topicName = null) {
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const out = topicName ? ["| Group | Label | Topic | Label source | Passages | Chars | Share |", "|---|---|---|---|---|---|---|"] : ["| Group | Label | Label source | Passages | Chars | Share |", "|---|---|---|---|---|---|"];
  for (const g of lens.groups) {
    const source = g.agentLabel ? `${g.labelSource}: ${cell(g.label)}` : g.labelSource;
    const topic = topicName ? ` ${cell(topicName.get(g.topic) ?? g.topic ?? "")} |` : "";
    out.push(`| ${g.id} | ${cell(displayLabel(g))} |${topic} ${source} | ${g.chunkCount} | ${fmt2(g.charCount)} | ${pct3(indexed ? g.charCount / indexed : 0)} |`);
  }
  return out;
}
__name(groupsTable, "groupsTable");
function closingLine(page) {
  const cap = page.chunkCap;
  if (page.capReached && page.charsUnread > 0) {
    return `A page contributes at most ${cap} passages, and this one filled every slot: ${fmt2(page.charsUnread)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`;
  }
  if (page.capReached) {
    return `A page contributes at most ${cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`;
  }
  return `A page contributes at most ${cap} passages; this one needed ${page.chunksIndexed}, so none of its extracted text fell past the cap.`;
}
__name(closingLine, "closingLine");
function refusalMarkdown(heading = "##") {
  const lang = /* @__PURE__ */ __name((code) => {
    const out = [`${heading} ${REFUSAL_COPY.title[code]}`, "", REFUSAL_COPY.lead[code], ""];
    for (const f of FINDINGS) {
      if (f.items) {
        out.push(`**${f.source[code]}**`, "");
        for (const item of f.items) out.push(`- ${item.text[code]} → ${item.url}`);
        out.push("");
      } else {
        out.push(`**${f.source[code]}**${f.joiner[code]}${f.text[code]} → ${f.url}`, "");
      }
    }
    out.push(`**${REFUSAL_COPY.sanctionsLabel[code]}:** ${REFUSAL_COPY.sanctions[code]} ${SANCTIONS_LINKS.map((l) => `${l.name} (${l.url})`).join(" · ")}`, "");
    out.push(REFUSAL_COPY.lastLine[code], "");
    return out;
  }, "lang");
  return [...lang("en"), ...lang("uk")];
}
__name(refusalMarkdown, "refusalMarkdown");
function renderRefusalMarkdown(reading) {
  const url = reading.page?.url || reading.requestedInput || "";
  return [`# Vectorscope: ${REFUSAL_COPY.title.en}`, "", `URL: ${cell(url)}`, "", ...refusalMarkdown("##")].join("\n");
}
__name(renderRefusalMarkdown, "renderRefusalMarkdown");
function refusalExport(reading) {
  return {
    schema: REFUSAL_SCHEMA,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    skillVersion: SKILL_VERSION,
    producedBy: { tool: "vectorscope-skill (local, no embeddings)", url: "https://www.getlooploop.com/vectorscope" },
    refused: true,
    reasonCode: reading.reasonCode,
    page: { url: reading.page?.url ?? null, requestedUrl: reading.page?.requestedUrl ?? reading.requestedInput ?? null },
    language: reading.language ?? null,
    passages: []
  };
}
__name(refusalExport, "refusalExport");
function runRefused(args, reading) {
  console.log(`REFUSED  ${reading.reasonCode}: pages in Russian are not analysed; the report holds the reason and nothing of the page`);
  writeOutputs(args, refusalExport(reading), renderRefusalMarkdown(reading), renderRefusalHtml(reading), "vectorscope-refused.json");
}
__name(runRefused, "runRefused");
function byMarkdown(judgements) {
  const one = /* @__PURE__ */ __name((j) => [j?.model ? `model: ${cell(j.model)}` : "model not stated by the agent", j?.agent ? `agent: ${cell(j.agent)}` : null].filter(Boolean).join(" · "), "one");
  const keys = judgements.map((x) => JSON.stringify([x.j?.agent ?? null, x.j?.model ?? null]));
  return new Set(keys).size <= 1 ? one(judgements[0]?.j) : judgements.map((x) => `page ${x.n}: ${one(x.j)}`).join("; ");
}
__name(byMarkdown, "byMarkdown");
function infoMarkdown(cap, judgements) {
  return [
    `> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the ${cap}-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.`,
    ">",
    `> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (${byMarkdown(judgements)}). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.`,
    ">",
    `> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the ${cap}-passage cap is this tool's.`,
    ""
  ];
}
__name(infoMarkdown, "infoMarkdown");
function renderMarkdown(reading, lens, extras = {}) {
  const { page } = reading;
  const cap = page.chunkCap;
  const out = [];
  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {
  }
  out.push(`# Vectorscope reading: ${cell(page.title || host || page.url)}`);
  out.push("");
  out.push(...infoMarkdown(cap, [{ n: 1, j: lens.judgement }]));
  out.push(...blockedBanner(reading.robots));
  out.push("| | |");
  out.push("|---|---|");
  out.push(`| URL | ${cell(page.url)} |`);
  if (page.url !== page.requestedUrl) out.push(`| Asked for | ${cell(page.requestedUrl)} |`);
  out.push(`| Title | ${cell(page.title || "(none)")} |`);
  out.push(`| Words | ${fmt2(page.wordCount)} |`);
  out.push(`| Headings found | ${page.headings} |`);
  out.push(`| noindex | ${page.noindex ? "**yes**: the page asks search engines not to index it, which usually means assistants never see it either" : "no"} |`);
  out.push("");
  const repeats = lens.duplicates;
  out.push(
    `**Pipeline:** Fetched → Extracted ${fmt2(page.wordCount)} words · ${page.headings} headings → Chunked ${plural(page.chunksIndexed, "passage", "passages")} · ${fmt2(page.charsIndexed)} chars → Grouped ${plural(lens.groups.length, "group", "groups")} · ${plural(repeats, "repeat", "repeats")} (by reading; no embedding step)`
  );
  out.push("");
  out.push("## Counters");
  out.push("");
  out.push(`- **${page.chunksIndexed}** passages read`);
  out.push(`- **${page.chunksIndexed}/${cap}** slots used of the ${cap}-passage cap${page.capReached ? " (every slot filled)" : ""}`);
  out.push(
    `- **${fmt2(page.charsUnread)}** characters past the cap, not read. Zero unless every slot was filled; then counted as extracted characters minus indexed characters, and since passages overlap by about 200 characters and the first one repeats the title and description, it undercounts and can read 0 even when the cap cut off a tail.`
  );
  out.push("");
  out.push(...diffMarkdown(extras.diff));
  out.push("## Checks", "", "### AI crawlers and robots.txt", "");
  out.push(...robotsMarkdown(reading.robots));
  out.push("### Technical markup", "");
  out.push(...technicalMarkdown(reading.technical, reading.render, page));
  out.push("### Findings", "");
  out.push(...findingsMarkdown(extras.checks ?? []));
  out.push(...planMarkdown(extras.plan, false));
  out.push(...queriesMarkdown(extras.queries, 1));
  out.push("## The groups this page falls into");
  out.push("");
  out.push(...groupsTable(lens));
  out.push("");
  out.push(
    `Label is the agent's name for the group when it gave one. Label source is the computed label: "heading" is the page's own section heading and can be quoted; "keywords" is the group's two most distinctive words, a hint and not what the section is called.`
  );
  out.push("");
  const noted = lens.groups.filter((x) => x.note);
  for (const g of noted) out.push(`- **${g.id} · ${cell(displayLabel(g))}:** ${cell(g.note)}`);
  if (noted.length) out.push("");
  out.push("## Passages, by group");
  out.push("");
  out.push("In reading order inside each group. Each line shows how the passage opens (its first 240 characters).");
  out.push("");
  for (const g of lens.groups) {
    out.push(`### ${g.id} · ${cell(displayLabel(g))} (${plural(g.chunkCount, "passage", "passages")})`);
    out.push("");
    for (const index of g.members) {
      const c = lens.chunks[index];
      const notes = [ROLE_LABEL[c.contentRole], c.duplicateOf !== null ? `repeats #${c.duplicateOf}` : null].filter(Boolean);
      const head = c.heading ? `*${cell(c.heading)}* · ` : "";
      out.push(`- **#${c.chunkIndex}** ${head}${fmt2(c.charCount)} chars${notes.length ? ` · **${notes.join(" · ")}**` : ""}  `);
      out.push(`  ${cell(c.preview)}${c.charCount > PREVIEW_CHARS ? "…" : ""}`);
    }
    out.push("");
  }
  if (page.capReached && page.charsUnread > 0) {
    out.push(`*Outside cap:* ${fmt2(page.charsUnread)} characters at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.`);
    out.push("");
  }
  const side = lens.chunks.filter((c) => c.contentRole !== "main");
  out.push("## Side-path content");
  out.push("");
  if (side.length) {
    out.push(`${plural(side.length, "passage looks", "passages look")} like related links or utility copy; they are still indexed.`);
    out.push("");
    for (const c of side) out.push(`- #${c.chunkIndex}${c.heading ? ` · ${cell(c.heading)}` : ""} · ${ROLE_LABEL[c.contentRole]} (group ${c.group})`);
  } else {
    out.push("No passage looks like related links or utility copy.");
  }
  out.push("");
  out.push("## The page's vocabulary");
  out.push("");
  out.push("*What the page says, not search demand — for how people ask, use the query test or https://www.getlooploop.com/voicescope.*");
  out.push("");
  const groupCount = lens.groups.length;
  const term = /* @__PURE__ */ __name((k) => `${k.term} (${k.count}${k.passages !== void 0 ? `; ${k.passages} passages` : ""}; ${k.groups} of ${groupCount} groups${k.scope ? "; describes the page" : ""})`, "term");
  const phrases = lens.phrases ?? [];
  const narrative = lens.narrative ?? (lens.phrases ? [] : lens.keywords ?? []);
  out.push("### Phrases this page owns");
  out.push("");
  out.push("Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses.");
  out.push("");
  out.push(phrases.length ? phrases.map((k, i) => `${i + 1}. ${term(k)}`).join("\n") : "No phrase is written often enough to count.");
  out.push("");
  out.push("### Narrative words");
  out.push("");
  out.push("Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.");
  out.push("");
  out.push(narrative.length ? narrative.map(term).join(", ") : "None.");
  out.push("");
  if (extras.facts?.length) {
    out.push("## Citable facts", "", "The agent's list of the concrete facts, figures and claims the passages state.", "");
    for (const f of extras.facts) out.push(`- ${cell(f.fact)} (${(f.pages[1] || []).map((i) => `#${i}`).join(" ")})`);
    out.push("");
  }
  out.push("---");
  out.push("");
  out.push(closingLine(page));
  out.push("");
  out.push(
    "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way."
  );
  out.push("");
  return out.join("\n");
}
__name(renderMarkdown, "renderMarkdown");
function renderCompareMarkdown(data) {
  const { pages, topicCmp, facts, factCmp, queries, plan, topics } = data;
  const name = new Map(topics.map((t) => [t.id, t.name]));
  const out = [`# Vectorscope comparison: ${pages.length} pages, one topic dictionary`, ""];
  out.push(...infoMarkdown(pages[0].reading.page.chunkCap, pages.map((p) => ({ n: p.n, j: p.lens.judgement }))));
  out.push("> The agent grouped every page against one shared topic dictionary, so the topics line up across pages.", "");
  if (data.refused?.length) {
    out.push(`Not analysed: ${data.refused.map((r) => `page ${r.n} (${cell(r.url)})`).join(", ")}.`, "");
    out.push(...refusalMarkdown("##"));
  }
  for (const p of pages) out.push(...blockedBanner(p.reading.robots, `Page ${p.n}: `));
  out.push("## The pages", "");
  out.push("| Page | URL | Words | Passages | Past cap | AI crawlers blocked | Findings (high/medium/low) |", "|---|---|---|---|---|---|---|");
  for (const p of pages) {
    const pg = p.reading.page;
    const blocked = (p.reading.robots?.bots || []).filter((b) => !b.allowed).map((b) => b.token);
    const count = /* @__PURE__ */ __name((s) => p.checks.filter((f) => f.severity === s).length, "count");
    out.push(`| ${p.n} | ${cell(pg.url)} | ${fmt2(pg.wordCount)} | ${pg.chunksIndexed}/${pg.chunkCap} | ${fmt2(pg.charsUnread)} | ${blocked.length ? blocked.join(", ") : "none"} | ${count("high")}/${count("medium")}/${count("low")} |`);
  }
  out.push("");
  out.push("## Topics × pages", "", "Passages and characters each page spends on each shared topic.", "");
  out.push(`| Topic | ${pages.map((p) => `Page ${p.n}`).join(" | ")} |`, `|---|${pages.map(() => "---").join("|")}|`);
  for (const row of topicCmp.table) {
    out.push(`| ${cell(row.name)} | ${pages.map((p) => row.cells[p.n].passages ? `${row.cells[p.n].passages} · ${fmt2(row.cells[p.n].chars)} chars` : "—").join(" | ")} |`);
  }
  out.push("", "**Topic gaps** (topics the other pages cover and this one does not):", "");
  for (const p of pages) out.push(`- Page ${p.n}: ${topicCmp.gaps[p.n].length ? topicCmp.gaps[p.n].map((id) => name.get(id) ?? id).join(", ") : "no gaps"}`);
  out.push("");
  if (queries?.length) {
    out.push("## Who wins each query", "");
    out.push(`| Query | Source | ${pages.map((p) => `Page ${p.n}`).join(" | ")} | Winner |`, `|---|---|${pages.map(() => "---").join("|")}|---|`);
    for (const q of queries) {
      const { winners, tie } = queryWinner(q);
      const cells = pages.map((p) => {
        const r = q.results[p.n];
        return `${r.verdict}${r.passage !== null ? ` #${r.passage}` : ""}${r.citable ? ", citable" : ""}`;
      });
      out.push(`| ${cell(q.query)} | ${q.source} | ${cells.join(" | ")} | ${winners.length ? winners.map((n) => `Page ${n}`).join(", ") + (tie ? " (tie)" : "") : "nobody"} |`);
    }
    out.push("");
  }
  if (facts?.length) {
    out.push("## Fact gaps", "", "Which page states a fact the others lack.", "");
    out.push(`| Fact | ${pages.map((p) => `Page ${p.n}`).join(" | ")} |`, `|---|${pages.map(() => "---").join("|")}|`);
    for (const f of facts) out.push(`| ${cell(f.fact)} | ${pages.map((p) => f.pages[p.n] ? `✓ ${f.pages[p.n].map((i) => `#${i}`).join(" ")}` : "—").join(" | ")} |`);
    out.push("");
    for (const p of pages) out.push(`- Page ${p.n}: ${factCmp.unique[p.n].length} fact(s) only it states, ${factCmp.lacking[p.n].length} it lacks.`);
    out.push("");
  }
  out.push(...planMarkdown(plan, true));
  out.push("## Checks by page", "");
  for (const p of pages) {
    out.push(`### Page ${p.n} · ${cell(p.reading.page.url)}`, "");
    out.push(...robotsMarkdown(p.reading.robots));
    out.push(...technicalMarkdown(p.reading.technical, p.reading.render, p.reading.page));
    out.push(...findingsMarkdown(p.checks));
  }
  out.push("## Each page's groups", "");
  for (const p of pages) {
    out.push(`### Page ${p.n}`, "");
    out.push(...groupsTable(p.lens, name));
    out.push("", closingLine(p.reading.page), "");
  }
  out.push("---", "", "This is a preview of the machine's view, not a guarantee of what any assistant does with it.", "");
  return out.join("\n");
}
__name(renderCompareMarkdown, "renderCompareMarkdown");
function exportChecks(checks) {
  return checks.map((f) => ({ ...f, message: checkCopy(f.code, "en", plainEvidence(f.evidence)).what }));
}
__name(exportChecks, "exportChecks");
function sharedJudgement(list) {
  const same = /* @__PURE__ */ __name((key) => new Set(list.map((j) => j?.[key] ?? null)).size === 1 ? list[0]?.[key] ?? null : null, "same");
  return { agent: same("agent"), model: same("model") };
}
__name(sharedJudgement, "sharedJudgement");
function singleExport(reading, lens, extras) {
  return {
    ...buildVectorscopeExport(reading.page, lens),
    // v2, additive. None of the v1 fields above changed meaning, so the schema id is unchanged.
    skillVersion: SKILL_VERSION,
    // Who did the reading (groups.json "agent" and "model"), null when the agent did not say.
    judgement: lens.judgement ?? { agent: null, model: null },
    checks: exportChecks(extras.checks),
    technical: reading.technical ?? null,
    robots: reading.robots ?? null,
    render: reading.render ?? null,
    plan: extras.plan?.items ?? null,
    queries: extras.queries ?? null,
    facts: extras.facts ?? null,
    diff: extras.diff ?? null
  };
}
__name(singleExport, "singleExport");
function loadReading(path) {
  const reading = readJson(path, "reading");
  if (!reading.ok) fail(`the reading ${path} is a refusal (${reading.reasonCode}); there are no passages to group.`);
  if (!Array.isArray(reading.passages) || !reading.passages.length) fail(`the reading ${path} holds no passages.`);
  return reading;
}
__name(loadReading, "loadReading");
function writeOutputs(args, jsonValue, md, html, fallbackJson) {
  const jsonPath = args.json || fallbackJson;
  const mdPath = args.md || jsonPath.replace(/\.json$/, "") + ".md";
  writeFileSync(jsonPath, JSON.stringify(jsonValue, null, 2));
  writeFileSync(mdPath, md);
  if (args.html) writeFileSync(args.html, html);
  console.log(`report    ${mdPath}`);
  console.log(`export    ${jsonPath}`);
  if (args.html) console.log(`html      ${args.html}`);
}
__name(writeOutputs, "writeOutputs");
function printChecks(checks, prefix = "") {
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  console.log(`${prefix}checks    ${shown.length ? "" : "none"}`);
  for (const f of shown) console.log(`${prefix}  [${f.severity}] ${f.code}${f.passages.length ? ` #${f.passages.join(" #")}` : ""}`);
}
__name(printChecks, "printChecks");
function runSingle(args) {
  if (args.files.length >= 1 && args.files.length <= 2) {
    const first = readJson(args.files[0], "reading");
    if (first.reasonCode === REFUSAL_CODE) return runRefused(args, first);
  }
  if (args.files.length !== 2) {
    console.error(USAGE);
    process.exit(1);
  }
  const reading = loadReading(args.files[0]);
  const pages = [{ n: 1, passages: reading.passages }];
  const topics = args.topics ? attempt("topics.json", () => validateTopics(readJson(args.topics, "topics"))) : null;
  const topicIds = topics ? new Set(topics.map((t) => t.id)) : null;
  const grouping = attempt("groups.json", () => validateGrouping(readJson(args.files[1], "groups"), reading.passages.length, { topicIds }));
  const lens = buildJudgedLens(reading, grouping);
  const checks = pageChecks2(reading, lens);
  const extras = { checks, topicsById: topics ? new Map(topics.map((t) => [t.id, t])) : null };
  const warnings = [];
  if (args.plan) {
    const fired = /* @__PURE__ */ new Map([[1, new Set(checks.map((f) => f.code))]]);
    const plan = attempt("plan.json", () => validatePlan(readJson(args.plan, "plan"), pages, fired));
    extras.plan = plan;
    warnings.push(...plan.warnings);
  }
  if (args.queries) {
    const q = attempt("queries.json", () => validateQueries(readJson(args.queries, "queries"), pages));
    extras.queries = q.queries;
    warnings.push(...q.warnings);
  }
  if (args.facts) extras.facts = attempt("facts.json", () => validateFacts(readJson(args.facts, "facts"), pages, topicIds));
  if (args["baseline-groups"] && !args.baseline) fail("--baseline-groups needs --baseline.");
  if (args.baseline) {
    const old = loadReading(args.baseline);
    let oldLens = null;
    if (args["baseline-groups"]) {
      const oldGrouping = attempt("baseline groups", () => validateGrouping(readJson(args["baseline-groups"], "baseline groups"), old.passages.length));
      oldLens = buildJudgedLens(old, oldGrouping);
    }
    extras.diff = diffReadings(old, reading, oldLens, lens);
  }
  if (grouping.reordered) console.log("note      groups were renumbered by their earliest passage and sorted inside");
  for (const w of warnings) console.log(`warning   ${w}`);
  for (const g of lens.groups) {
    console.log(`group ${g.id}   ${displayLabel(g)} [${g.labelSource}${g.agentLabel ? `: ${g.label}` : ""}] · ${plural(g.chunkCount, "passage", "passages")} · ${fmt2(g.charCount)} chars`);
  }
  console.log(`phrases   ${lens.phrases.slice(0, 8).map((k) => k.term).join(", ")}${lens.phrases.length > 8 ? ", …" : ""}`);
  console.log(`narrative ${lens.narrative.map((k) => k.term).join(", ")}`);
  printChecks(checks);
  if (extras.diff) console.log(`diff      ${extras.diff.counts.same} same · ${extras.diff.counts.changed} changed · ${extras.diff.counts.added} added · ${extras.diff.counts.removed} removed`);
  writeOutputs(args, singleExport(reading, lens, extras), renderMarkdown(reading, lens, extras), renderHtml(reading, lens, extras), vectorscopeExportName(reading.page));
}
__name(runSingle, "runSingle");
function runCompare(args) {
  const manifestPath = args.compare;
  const manifest = readJson(manifestPath, "manifest");
  if (!Array.isArray(manifest.pages)) fail("manifest.json has no pages; write it with read.mjs and several URLs.");
  const dir = dirname(manifestPath);
  const usable = manifest.pages.filter((p) => p.ok);
  const refused = manifest.pages.filter((p) => !p.ok && p.reasonCode === REFUSAL_CODE).map((p) => ({ n: p.n, url: p.url ?? p.requested, reasonCode: p.reasonCode }));
  if (usable.length < 2) fail(`only ${usable.length} page(s) in the manifest could be read; a comparison needs two.`);
  for (const p of manifest.pages.filter((x) => !x.ok)) console.log(`note      page ${p.n} (${p.requested}) was refused (${p.reasonCode}) and is left out`);
  const topicsPath = join(dir, "topics.json");
  if (!existsSync(topicsPath)) fail(`${topicsPath} is missing: compare mode needs one shared topic dictionary.`);
  const topics = attempt("topics.json", () => validateTopics(readJson(topicsPath, "topics")));
  const topicIds = new Set(topics.map((t) => t.id));
  const pages = usable.map((entry) => {
    const reading = loadReading(join(dir, entry.reading));
    const groupsPath = join(dir, `groups-${entry.n}.json`);
    if (!existsSync(groupsPath)) fail(`${groupsPath} is missing: write one groups file per page.`);
    const grouping = attempt(`groups-${entry.n}.json`, () => validateGrouping(readJson(groupsPath, "groups"), reading.passages.length, { topicIds, requireTopics: true }));
    const lens = buildJudgedLens(reading, grouping);
    return { n: entry.n, reading, lens, checks: pageChecks2(reading, lens), passages: reading.passages };
  });
  const warnings = [];
  const optional = /* @__PURE__ */ __name((file) => existsSync(join(dir, file)) ? readJson(join(dir, file), file) : null, "optional");
  const factsRaw = optional("facts.json");
  const facts = factsRaw ? attempt("facts.json", () => validateFacts(factsRaw, pages, topicIds)) : null;
  const queriesRaw = optional("queries.json");
  let queries = null;
  if (queriesRaw) {
    const q = attempt("queries.json", () => validateQueries(queriesRaw, pages));
    queries = q.queries;
    warnings.push(...q.warnings);
  }
  const planRaw = optional("plan.json");
  let plan = null;
  if (planRaw) {
    const fired = new Map(pages.map((p) => [p.n, new Set(p.checks.map((f) => f.code))]));
    plan = attempt("plan.json", () => validatePlan(planRaw, pages, fired));
    warnings.push(...plan.warnings);
  }
  const topicCmp = compareTopics(pages, topics);
  const factCmp = facts ? compareFacts(pages, facts) : null;
  const data = { pages, topics, topicCmp, facts, factCmp, queries, plan, refused };
  for (const w of warnings) console.log(`warning   ${w}`);
  for (const p of pages) {
    console.log(`page ${p.n}    ${p.reading.page.url} · ${p.reading.page.chunksIndexed} passages · ${p.lens.groups.length} groups`);
    printChecks(p.checks, "  ");
  }
  for (const row of topicCmp.table) console.log(`topic     ${row.name}: ${pages.map((p) => `${p.n}=${row.cells[p.n].passages}`).join(" ")}`);
  for (const q of queries ?? []) {
    const w = queryWinner(q);
    console.log(`query     ${q.query} → ${w.winners.length ? w.winners.map((n) => `page ${n}`).join(", ") + (w.tie ? " (tie)" : "") : "nobody"}`);
  }
  const exported = {
    schema: COMPARE_SCHEMA,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    skillVersion: SKILL_VERSION,
    producedBy: { tool: "vectorscope-skill (local, no embeddings)", url: "https://www.getlooploop.com/vectorscope" },
    howToRead: "Each page is a full single-page export under pages[]. topics is the one dictionary every page was grouped against; topicTable gives passages and characters per topic per page; topicGaps lists, per page, topics the others cover and it does not; facts and factGaps are the agent's list of citable facts and where each is stated; queries carry a verdict per page and the winner. Grouping, facts and verdicts are judgements; chunking and the cap are the product's exact rules.",
    // Who did the reading: the value every page's groups file states, null where they differ or say nothing.
    judgement: sharedJudgement(pages.map((p) => p.lens.judgement)),
    pages: pages.map((p) => ({ n: p.n, ...singleExport(p.reading, p.lens, { checks: p.checks }) })),
    topics,
    topicTable: topicCmp.table,
    topicGaps: topicCmp.gaps,
    facts,
    factGaps: factCmp,
    queries: queries ? queries.map((q) => ({ ...q, winner: queryWinner(q) })) : null,
    plan: plan?.items ?? null,
    // Pages in Russian are not analysed: listed, with nothing of the page.
    refused
  };
  writeOutputs(args, exported, renderCompareMarkdown(data), renderCompareHtml(data), join(dir, "compare.json"));
}
__name(runCompare, "runCompare");
var isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exit(1);
  }
  if (args.compare) runCompare(args);
  else runSingle(args);
}
export {
  COMPARE_SCHEMA,
  REFUSAL_SCHEMA,
  SKILL_VERSION,
  buildJudgedLens,
  renderCompareMarkdown,
  renderMarkdown,
  renderRefusalMarkdown,
  validateGrouping
};
