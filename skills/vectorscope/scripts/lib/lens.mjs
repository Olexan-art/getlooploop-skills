// The deterministic half of the Vectorscope read-out: side-path roles, group labels, page keywords.
// None of this needs vectors; the grouping it is applied to is supplied by the caller.

import { LABEL_STOP, pageStopLanguage } from "./vocabulary.mjs";

export { pageStopLanguage };

// Words that carry no subject of their own. English and Ukrainian always (no English token
// is written in Cyrillic); Ukrainian only, never Russian.
export const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "them", "their", "our", "your", "my",
  "me", "him", "her", "us", "what", "which", "who", "whom", "whose", "where", "when",
  "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "about", "into", "over", "after", "before", "between", "under", "again", "further",
  "then", "once", "here", "there", "any", "if", "vs", "via", "per", "www", "http", "https",
  "com", "org", "net", "html", "php", "asp",
  // Ukrainian: conjunctions and particles
  "і", "й", "та", "а", "але", "або", "чи", "що", "щоб", "як", "якщо", "коли", "бо",
  "тому", "хоча", "проте", "однак", "тобто", "аби", "ні", "не", "так", "ще", "вже",
  "уже", "лише", "тільки", "теж", "також", "навіть", "саме", "ось", "би", "б", "ж",
  // Ukrainian: prepositions
  "в", "у", "на", "з", "із", "зі", "до", "від", "по", "про", "для", "без", "над",
  "під", "при", "через", "між", "за", "о", "об", "після", "перед", "біля", "серед",
  "щодо", "поки",
  // Ukrainian: pronouns and determiners
  "я", "ти", "він", "вона", "воно", "ми", "ви", "вони", "мене", "тебе", "його", "її",
  "їх", "нас", "вас", "них", "мені", "тобі", "йому", "їй", "нам", "вам", "їм", "себе",
  "мій", "моя", "моє", "мої", "твій", "твоя", "твоє", "твої", "наш", "наша", "наше",
  "наші", "ваш", "ваша", "ваше", "ваші", "свій", "своя", "своє", "свої", "свою",
  "їхній", "їхня", "їхнє", "їхні", "це", "цей", "ця", "ці", "цю", "цього", "цієї",
  "цих", "цьому", "цим", "той", "те", "ті", "ту", "того", "тих", "тим", "який",
  "яка", "яке", "які", "яку", "якого", "якої", "яких", "якому", "яким", "де", "куди",
  "чому", "весь", "вся", "все", "всі", "усі", "кожен", "кожна", "кожне", "інший",
  "інша", "інше", "інші", "тут", "там",
  // Ukrainian: auxiliaries
  "є", "був", "була", "було", "були", "бути", "буде", "будуть", "може", "можна",
  "треба", "дуже", "більш", "більше", "менше",
]);

// Spanish words that are never English words, so they are dropped anywhere.
const STOP_ES_ONLY = new Set([
  "que", "qué", "una", "unos", "unas", "por", "pero", "más", "este", "esta", "estos",
  "estas", "esto", "eso", "esos", "esas", "porque", "cuando", "cuándo", "muy", "sobre",
  "también", "hasta", "donde", "dónde", "desde", "durante", "todos", "todas", "toda",
  "otro", "otra", "otros", "otras", "ellos", "ellas", "antes", "algunos", "algunas",
  "tanto", "muchos", "muchas", "quien", "quién", "quienes", "cual", "cuál", "cuales",
  "cuáles", "poco", "estar", "nosotros", "nosotras", "vosotros", "vosotras", "nuestro",
  "nuestra", "nuestros", "nuestras", "vuestro", "vuestra", "vuestros", "vuestras", "está",
  "están", "estás", "estamos", "estoy", "fueron", "sido", "siendo", "había", "habían",
  "haber", "hemos", "hubo", "tiene", "tienen", "tengo", "tener", "tenía", "puede",
  "pueden", "cómo", "usted", "ustedes", "aquí", "allí", "así", "aunque", "cada",
  "mientras", "según", "tras", "hacia", "además", "entonces", "luego", "ahora", "siempre",
  "nunca", "cuánto", "cuánta", "cuántos", "cuántas", "mismo", "misma", "mismos", "mismas",
  "pues", "aquel", "aquella", "aquellos", "aquellas", "ello", "él", "mí", "tú", "sí",
  "sólo", "eres", "somos", "sois", "éramos", "mío", "mía", "tuyo", "tuya",
  "suyo", "suya", "suyos", "suyas",
]);

// Spanish function words that are also English tokens ("de facto", "Las Vegas", "/en/"):
// dropped only from text detected as Spanish, so English text tokenises as it always did.
const STOP_ES_SHARED = new Set([
  "de", "la", "el", "en", "es", "se", "lo", "le", "al", "su", "mi", "tu", "te", "ti",
  "ya", "si", "son", "era", "eran", "eras", "sin", "sea", "hay", "con", "del", "ha",
  "han", "les", "mas", "nos", "sus", "mis", "tus", "ser", "uno", "esa", "ese", "para",
  "yo", "os", "ni", "fue", "fui", "los", "las", "como", "todo", "nada", "mucho", "algo",
  "ella", "ante", "solo", "sino", "un", "soy", "sean",
]);

// A handful of English function words, only to tell English text from Spanish.
const EN_MARKERS = new Set([
  "the", "and", "of", "to", "is", "in", "that", "it", "for", "with", "are", "this", "on",
  "you", "be", "as", "by", "was", "from", "have", "your", "can", "will", "not", "or",
]);

// The shared words that count as evidence of Spanish.
const ES_EVIDENCE = new Set(["de", "la", "el", "los", "las", "del", "con", "para"]);

// How much of a text the language test reads.
const DETECT_SAMPLE_CHARS = 20_000;

// Spanish when Spanish function words outnumber English ones, at least two of them, and the
// text has a word only Spanish writes or Spanish spelling (ñ ¿ ¡ á í ó ú). Returns "es" or null.
export function detectStopLanguage(text) {
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

// Whether a token carries no subject, in the given (or no) extra language.
export function isStopword(token, language = null) {
  if (STOP.has(token) || STOP_ES_ONLY.has(token)) return true;
  return language === "es" && STOP_ES_SHARED.has(token);
}

// Tokenize text into lowercase terms. `language` is the extra stop list; left out
// (undefined), it is decided from this text.
export function tokenize(text, language) {
  if (!text) return [];
  const extra = language === undefined ? detectStopLanguage(text) : language;
  return text
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/[^\p{L}\p{N}\s._/-]+/gu, " ")
    .split(/[\s/_.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !isStopword(t, extra) && !/^\d+$/.test(t));
}

// ── side-path roles ──────────────────────────────────────────────────────────

const FURNITURE_SOURCE =
  "\\b(terms of (service|use)|terms and conditions|privacy (policy|notice|statement)|" +
  "cookie (policy|settings|preferences|consent)|accept (all )?cookies|copyright|" +
  "all rights reserved|log in|sign in to|create (a |an )?(free )?account|" +
  "subscribe to our|newsletter)\\b";
const FURNITURE_PHRASE = new RegExp(FURNITURE_SOURCE);
const FURNITURE_PHRASE_ALL = new RegExp(FURNITURE_SOURCE, "g");

const RELATED_PHRASE =
  /\b(related (articles|products|links|posts)|recommended (for you|reading|articles)|other products|you may also|popular (articles|resources|posts)|more from|try more|see also)\b/;

/** "main" | "related" | "utility" — a conservative structural hint, never a claim that content was removed. */
export function contentRole(text, heading) {
  const headingSample = String(heading || "").toLocaleLowerCase();
  const body = String(text || "").toLocaleLowerCase();

  if (FURNITURE_PHRASE.test(headingSample)) return "utility";

  // Distinct phrases, not occurrences.
  const signals = new Set();
  for (const match of body.matchAll(FURNITURE_PHRASE_ALL)) signals.add(match[0]);
  if (signals.size >= 2) return "utility";

  if (/^\s*(related|see also|more from|you may also)\b/.test(headingSample)) return "related";
  if (RELATED_PHRASE.test(headingSample) || RELATED_PHRASE.test(body)) return "related";
  return "main";
}

// ── labels ───────────────────────────────────────────────────────────────────

// LABEL_STOP and pageStopLanguage are defined once, beside the vocabulary that also uses them.

export const UNTITLED_LABEL = "Untitled section";

export function round(value) {
  return Math.round(value * 10000) / 10000;
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function usableLabelTerm(token) {
  if (token.length < 4) return false;
  if (LABEL_STOP.has(token)) return false;
  if (/\d/.test(token)) return false;
  return true;
}

/** A heading of at most 80 chars wins; otherwise the group's two most distinctive words. */
export function labelGroup(groupTexts, otherTexts, heading, language) {
  const clean = (heading || "").trim();
  if (clean && clean.length <= 80) return clean;

  const stopLanguage = language === undefined ? pageStopLanguage([...groupTexts, ...otherTexts]) : language;
  const inside = new Map();
  for (const text of groupTexts) {
    for (const token of new Set(tokenize(text, stopLanguage))) {
      if (!usableLabelTerm(token)) continue;
      inside.set(token, (inside.get(token) || 0) + 1);
    }
  }
  if (!inside.size) return UNTITLED_LABEL;

  const outside = new Map();
  for (const text of otherTexts) {
    for (const token of new Set(tokenize(text, stopLanguage))) {
      outside.set(token, (outside.get(token) || 0) + 1);
    }
  }

  const insideSize = Math.max(1, groupTexts.length);
  const outsideSize = Math.max(1, otherTexts.length);

  const scored = Array.from(inside.entries())
    .filter(([, count]) => (insideSize < 3 ? true : count >= 2))
    .map(([token, count]) => {
      const rateInside = count / insideSize;
      const rateOutside = (outside.get(token) || 0) / outsideSize;
      return { token, score: rateInside / (rateOutside + 0.25) };
    })
    .sort((a, b) => b.score - a.score || b.token.length - a.token.length || a.token.localeCompare(b.token));

  const picked = scored.slice(0, 2).map((entry) => entry.token);
  if (!picked.length) return "Untitled section";
  return picked.map(titleCase).join(" · ");
}

/** The heading a strict majority of the group's passages sit under, or null. */
export function dominantHeading(headings) {
  const counts = new Map();
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

/** Where a group label came from: a heading, keywords, or nothing. */
export function labelSourceOf(label, heading) {
  return heading && label === heading ? "heading" : label === UNTITLED_LABEL ? "none" : "keywords";
}

// ── keywords ─────────────────────────────────────────────────────────────────
// The page vocabulary (phrases, then narrative words) lives in vocabulary.mjs.

export const PREVIEW_CHARS = 240;
