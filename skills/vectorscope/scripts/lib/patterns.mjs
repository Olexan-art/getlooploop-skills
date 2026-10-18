// Writing patterns: the GetLoopLoop PatternScope's deterministic detectors and its density score,
// run over the page's kept text. Pure: no model, no network. Each detector has a written rule, a
// span of the input as its evidence and a stated limitation. These are signals about worn writing,
// not an AI detector: nothing here says who or what wrote the text.
//
// Four detector families, as PatternScope draws them:
//   stock       worn openers and connectives, from a list written natively per language
//   repetition  two or more sentences with the same skeleton (content words replaced)
//   uniformity  three or more consecutive sentences that open the same way
//   vagueness   an evaluative adjective on an abstract noun, with nothing checkable in the sentence
//
// Languages: English, Ukrainian and Spanish have lexicons. Any other language is not analysed and
// the report says so; a language with no lexicon would score zero for every text, which reads as
// praise. Russian never reaches this module: the reading refuses it first.

import { RUSSIAN_ONLY } from "./russian.mjs";

export const DETECTOR_SET_VERSION = "det-1";
export const SCORE_MODEL_VERSION = "score-1";
export const LANGUAGES = ["en", "uk", "es"];
/** Below this the density swings a band on a comma, so the score is not computed. */
export const MIN_WORDS = 60;
/** This skill's rule: stock phrases at or above 2.0 per 1,000 words is a density readers notice. */
export const STOCK_DENSITY_MEDIUM = 2.0;
/** PatternScope's measured saturation: weighted points per 1,000 words that map to 100. */
export const SATURATION_POINTS_PER_1K = 250;
const SEVERITY_POINTS = { low: 1, medium: 3, high: 6 };
const REPEAT_CAP = 4;
const BANDS = [[60, "high"], [30, "moderate"], [0, "low"]];

// ── normalisation and counting ───────────────────────────────────────────────

const INVISIBLE = /[\u00ad\u200b\u200c\u200d\u2060\ufeff]/g;
const ODD_SPACES = /[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g;

/** Idempotent: case, quotes and punctuation are the writer's and are left alone. */
export function normalizeText(raw) {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .replace(ODD_SPACES, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Words as the score counts them, so the density denominator and the word count are one function. */
export function countWords(text) {
  return String(text ?? "").split(/[^\p{L}\p{N}'’-]+/u).filter((w) => /\p{L}|\p{N}/u.test(w)).length;
}

/** Sentences by terminal punctuation followed by space or end. Deliberately simple; it splits "e.g.". */
export function splitSentences(text) {
  const out = [];
  const re = /[^.!?…]+[.!?…]+(?=\s|$)|[^.!?…]+$/gu;
  let match;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const leading = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body.length < 2) continue;
    out.push({ text: body, startOffset: match.index + leading, endOffset: match.index + leading + body.length });
  }
  return out;
}

// ── language ─────────────────────────────────────────────────────────────────

const UKRAINIAN_ONLY = /[іїєґ]/i;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /\p{Script=Latin}/u;
const EN_MARKERS = new Set(["the", "and", "of", "to", "is", "that", "with", "for", "this", "are", "which", "from"]);
const ES_MARKERS = new Set(["que", "de", "la", "el", "los", "las", "para", "con", "una", "como", "por", "del", "se"]);
const ES_LETTERS = /[ñáéíóúü¿¡]/i;
const OTHER_LATIN = /[ąćęłńśźżğ]|œ|æ|ß/i;
const MIX_SHARE = 0.35;
/** Words with a letter from OTHER_LATIN, as a share of the Latin words, that make the text another language. */
const OTHER_LATIN_SHARE = 0.02;

const wordsOf = (text) => String(text ?? "").split(/[^\p{L}\p{N}'’]+/u).filter((w) => /\p{L}/u.test(w));
const hits = (lower, set) => lower.reduce((n, w) => n + (set.has(w) ? 1 : 0), 0);

/**
 * Which of the three lexicon languages the text is in, or a refusal code. Cyrillic is Ukrainian
 * or nothing; a mix of scripts above a third of the words is not scored.
 */
export function detectLanguage(text) {
  const all = wordsOf(text);
  if (all.length < 3) return { ok: false, code: "language_undetermined" };
  let cyr = 0;
  let lat = 0;
  for (const w of all) {
    if (CYRILLIC.test(w)) cyr += 1;
    else if (LATIN.test(w)) lat += 1;
  }
  const scripted = cyr + lat;
  if (!scripted) return { ok: false, code: "language_undetermined" };
  if (Math.min(cyr, lat) / scripted > MIX_SHARE) return { ok: false, code: RUSSIAN_ONLY.test(text) ? "language_not_supported" : "unsupported_mix" };
  if (cyr >= lat) {
    if (RUSSIAN_ONLY.test(text) || !UKRAINIAN_ONLY.test(text)) return { ok: false, code: "language_not_supported" };
    const n = (text.match(/[іїєґ]/gi) || []).length;
    return { ok: true, language: "uk", confidence: n >= 6 ? "high" : n >= 2 ? "medium" : "low" };
  }
  const lower = all.map((w) => w.toLowerCase());
  const en = hits(lower, EN_MARKERS);
  const esWords = hits(lower, ES_MARKERS);
  // Another Latin-script language (Polish, Turkish, German…) shows in its letters, but a whole page
  // is not a pasted paragraph: one name with "ł" or "ß" in a long English article is a name, not a
  // language. So it takes two such words and a share of the words, not one letter anywhere (2.111; the web tool, made
  // for pasted text, still refuses on one).
  const otherWords = all.filter((w) => OTHER_LATIN.test(w)).length;
  if (otherWords >= 2 && otherWords / lat >= OTHER_LATIN_SHARE && esWords < 3) return { ok: false, code: "unsupported_language" };
  const es = esWords + (ES_LETTERS.test(text) ? 3 : 0);
  if (!en && !es) return { ok: false, code: "language_undetermined" };
  const [language, top, other] = en >= es ? ["en", en, es] : ["es", es, en];
  const margin = top - other;
  return { ok: true, language, confidence: margin >= 4 ? "high" : margin >= 2 ? "medium" : "low" };
}

// ── lexicons, per language, written natively rather than translated ──────────

const STOCK = {
  en: ["it is worth noting that", "it should be emphasised that", "it should be emphasized that", "it should be noted that", "it is important to understand that", "it is necessary to draw attention to the fact that", "in connection with the fact that", "in today's world", "in the modern world", "at the end of the day", "when it comes to", "needless to say", "it goes without saying", "last but not least", "in order to be able to", "due to the fact that"],
  uk: ["варто зазначити, що", "варто зазначити що", "слід зазначити, що", "слід підкреслити, що", "необхідно звернути увагу на те, що", "у зв'язку з тим, що", "у звʼязку з тим, що", "в зв'язку з тим, що", "важливо розуміти, що", "у сучасних умовах", "на сьогоднішній день", "не секрет, що", "як відомо", "перш за все", "в кінцевому підсумку"],
  es: ["cabe señalar que", "cabe destacar que", "hay que tener en cuenta que", "es importante entender que", "debido al hecho de que", "en el mundo actual", "en la actualidad", "a día de hoy", "no cabe duda de que", "por otro lado", "en última instancia"],
};

const FUNCTION_WORDS = {
  en: new Set(["a", "an", "the", "of", "to", "for", "and", "or", "in", "on", "at", "with", "our", "your", "we", "you", "it", "is", "are", "that", "this", "every", "each", "all"]),
  uk: new Set(["і", "й", "та", "або", "в", "у", "на", "до", "з", "із", "зі", "для", "що", "як", "ми", "ви", "наш", "наша", "наші", "ваш", "ваша", "ваші", "кожен", "кожного", "кожному", "це", "є"]),
  es: new Set(["el", "la", "los", "las", "un", "una", "de", "del", "a", "al", "para", "por", "y", "o", "en", "con", "nuestro", "nuestra", "nuestros", "su", "que", "es", "son", "cada", "todo", "todos"]),
};

const EQUIVALENT = {
  en: { a: "art", an: "art", the: "art" },
  uk: { наш: "poss", наша: "poss", наші: "poss", ваш: "poss", ваша: "poss", ваші: "poss" },
  es: { el: "art", la: "art", los: "art", las: "art", un: "art", una: "art", nuestro: "poss", nuestra: "poss", nuestros: "poss" },
};

const EVALUATIVE = {
  en: new Set(["comprehensive", "seamless", "innovative", "effective", "efficient", "robust", "holistic", "cutting-edge", "state-of-the-art", "world-class", "best-in-class", "unique", "powerful", "flexible", "scalable", "individual", "tailored", "bespoke", "unparalleled", "unrivalled", "proven", "trusted", "leading", "advanced", "optimal", "streamlined", "transparent"]),
  uk: new Set(["комплексний", "комплексне", "комплексна", "комплексні", "ефективний", "ефективне", "ефективна", "ефективні", "інноваційний", "інноваційне", "інноваційна", "інноваційні", "індивідуальний", "індивідуальне", "індивідуальна", "індивідуальні", "унікальний", "унікальне", "унікальна", "унікальні", "гнучкий", "гнучке", "гнучка", "гнучкі", "надійний", "надійне", "надійна", "надійні", "бездоганний", "бездоганне", "бездоганна", "бездоганні", "провідний", "провідне", "провідна", "провідні", "сучасний", "сучасне", "сучасна", "сучасні", "високий", "високе", "висока", "високі", "широкий", "широке", "широка", "широкі", "прозорий", "прозоре", "прозора", "прозорі"]),
  es: new Set(["integral", "integrales", "innovador", "innovadora", "innovadores", "innovadoras", "eficaz", "eficaces", "eficiente", "eficientes", "único", "única", "únicos", "únicas", "flexible", "flexibles", "robusto", "robusta", "escalable", "escalables", "personalizado", "personalizada", "líder", "líderes", "avanzado", "avanzada", "óptimo", "óptima", "transparente", "transparentes", "sólido", "sólida", "integrado", "integrada", "vanguardista"]),
};

const ABSTRACT_NOUN = {
  en: new Set(["solution", "solutions", "approach", "approaches", "value", "values", "quality", "experience", "experiences", "service", "services", "results", "outcome", "outcomes", "growth", "efficiency", "synergy", "synergies", "innovation", "expertise", "capability", "capabilities", "platform", "ecosystem", "framework", "strategy", "strategies", "process", "processes", "performance", "excellence", "impact", "transformation", "range", "spectrum"]),
  uk: new Set(["рішення", "рішень", "підхід", "підходу", "підходи", "цінність", "цінності", "якість", "якості", "досвід", "досвіду", "сервіс", "сервісу", "послуги", "послуг", "результат", "результати", "результатів", "зростання", "ефективність", "ефективності", "синергія", "синергії", "інновації", "експертиза", "потенціал", "платформа", "платформи", "екосистема", "стратегія", "стратегії", "процес", "процеси", "процесів", "продуктивність", "рівень", "рівня", "спектр", "спектру", "напрямок", "напрямки", "можливості", "можливостей"]),
  es: new Set(["solución", "soluciones", "enfoque", "enfoques", "valor", "valores", "calidad", "experiencia", "experiencias", "servicio", "servicios", "resultado", "resultados", "crecimiento", "eficiencia", "sinergia", "sinergias", "innovación", "experticia", "capacidad", "capacidades", "plataforma", "ecosistema", "estrategia", "estrategias", "proceso", "procesos", "rendimiento", "excelencia", "impacto", "transformación", "gama", "abanico", "nivel", "niveles"]),
};

const severityFromCount = (n) => (n >= 3 ? "high" : n === 2 ? "medium" : "low");

/** Every occurrence of a phrase at word boundaries, case-folded; an index walk, not a regex. */
export function findAll(text, phrase) {
  const hay = text.toLowerCase();
  const needle = phrase.toLowerCase();
  const spans = [];
  let from = 0;
  while (from <= hay.length - needle.length) {
    const at = hay.indexOf(needle, from);
    if (at < 0) break;
    const before = at === 0 ? "" : hay[at - 1];
    const after = hay[at + needle.length] ?? "";
    if ((!before || !/[\p{L}\p{N}]/u.test(before)) && (!after || !/[\p{L}\p{N}]/u.test(after))) spans.push([at, at + needle.length]);
    from = at + needle.length;
  }
  return spans;
}

// ── the detectors ────────────────────────────────────────────────────────────

/** Stock phrasing: a phrase from the language's list; severity from how often the same phrase recurs. */
export function detectStock(text, language) {
  const out = [];
  for (const phrase of STOCK[language]) {
    const spans = findAll(text, phrase);
    for (const [s, e] of spans) out.push({ detector: "phrase_templates", family: "stock", severity: severityFromCount(spans.length), startOffset: s, endOffset: e, evidence: text.slice(s, e), occurrences: spans.length, reason: "stock_phrase" });
  }
  return out;
}

const CONTENT_WORD = /^[\p{L}\p{N}][\p{L}\p{N}'’-]*$/u;

/** A sentence reduced to its shape: function words kept (articles folded), content words replaced. */
export function skeletonOf(sentence, language) {
  const fn = FUNCTION_WORDS[language];
  const eq = EQUIVALENT[language];
  return sentence
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean)
    .map((w) => eq[w] || (fn.has(w) ? w : CONTENT_WORD.test(w) ? "·" : w))
    .join(" ");
}

/** Repeated sentence shapes: sentences sharing a skeleton of four or more tokens. */
export function detectRepetition(text, language) {
  const by = new Map();
  for (const s of splitSentences(text)) {
    const sk = skeletonOf(s.text, language);
    const tokens = sk.split(" ");
    // Under four tokens matches everything. So does a skeleton with no function word at all ("Retrieved
    // 20 January 2024." is · · · ·, like every four-word list item): a shape needs words that are kept.
    if (tokens.length < 4 || tokens.every((t) => t === "·")) continue;
    by.set(sk, [...(by.get(sk) || []), s]);
  }
  const out = [];
  for (const group of by.values()) {
    if (group.length < 2) continue;
    for (const s of group) out.push({ detector: "sentence_template", family: "repetition", severity: severityFromCount(group.length), startOffset: s.startOffset, endOffset: s.endOffset, evidence: s.text, occurrences: group.length, reason: "shared_sentence_skeleton" });
  }
  return out;
}

/** Uniform openings: three or more consecutive sentences whose opening (one content word plus the function words before it) matches. */
export function detectUniformity(text, language) {
  const sentences = splitSentences(text);
  const fn = FUNCTION_WORDS[language];
  const opener = (s) => {
    const tokens = s.toLowerCase().split(/\s+/).map((t) => t.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
    const taken = [];
    for (const t of tokens) {
      taken.push(t);
      if (!fn.has(t)) break;
      if (taken.length >= 3) break;
    }
    return taken.join(" ");
  };
  const out = [];
  let runStart = 0;
  for (let i = 1; i <= sentences.length; i += 1) {
    const same = i < sentences.length && opener(sentences[i].text) === opener(sentences[runStart].text) && opener(sentences[runStart].text).length > 2;
    if (same) continue;
    const length = i - runStart;
    if (length >= 3) {
      const first = sentences[runStart];
      const last = sentences[i - 1];
      out.push({ detector: "sentence_uniformity", family: "uniformity", severity: length >= 4 ? "high" : "medium", startOffset: first.startOffset, endOffset: last.endOffset, evidence: text.slice(first.startOffset, last.endOffset), occurrences: length, reason: "repeated_opening" });
    }
    runStart = i;
  }
  return out;
}

/** A digit, or a capitalised word past the first: something a reader could go and check. */
function hasConcreteAnchor(sentence) {
  if (/\p{Nd}/u.test(sentence)) return true;
  const words = sentence.split(/\s+/).filter(Boolean);
  for (let i = 1; i < words.length; i += 1) {
    const w = words[i].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (w.length < 2) continue;
    const c = w[0];
    if (c === c.toLocaleUpperCase() && c !== c.toLocaleLowerCase() && (w !== w.toLocaleUpperCase() || w.length <= 4)) return true;
  }
  return false;
}

function tokensOf(sentence) {
  const out = [];
  const re = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) out.push({ word: m[0].toLocaleLowerCase(), start: m.index, end: m.index + m[0].length });
  return out;
}

/** Unchecked claims: an evaluative adjective on an abstract noun in a sentence with nothing concrete in it. */
export function detectVagueness(text, language) {
  const evaluative = EVALUATIVE[language];
  const nouns = ABSTRACT_NOUN[language];
  const fn = FUNCTION_WORDS[language];
  const pairs = [];
  for (const s of splitSentences(text)) {
    if (hasConcreteAnchor(s.text)) continue;
    const tokens = tokensOf(s.text);
    for (let i = 0; i < tokens.length; i += 1) {
      const a = tokens[i];
      const isAdj = evaluative.has(a.word);
      const isNoun = nouns.has(a.word);
      if (!isAdj && !isNoun) continue;
      const own = isAdj ? evaluative : nouns;
      for (let j = i + 1; j < tokens.length && j <= i + 3; j += 1) {
        const b = tokens[j];
        if (j > i + 1) {
          const between = tokens[j - 1].word;
          if (!fn.has(between) && !own.has(between)) break;
        }
        if (!(isAdj ? nouns.has(b.word) : evaluative.has(b.word))) continue;
        pairs.push({ key: `${a.word} ${b.word}`, start: s.startOffset + a.start, end: s.startOffset + b.end });
        break;
      }
    }
  }
  const outer = pairs.filter((p) => !pairs.some((o) => o !== p && o.start <= p.start && o.end >= p.end));
  const counts = new Map();
  for (const p of outer) counts.set(p.key, (counts.get(p.key) ?? 0) + 1);
  const total = outer.length;
  const severity = severityFromCount(total >= 5 ? 3 : total >= 3 ? 2 : 1);
  return outer.map((p) => ({ detector: "abstract_claim", family: "vagueness", severity, startOffset: p.start, endOffset: p.end, evidence: text.slice(p.start, p.end), occurrences: counts.get(p.key) ?? 1, reason: "unsupported_claim" }));
}

/** Every detector, ordered by position. */
export function runDetectors(text, language) {
  return [...detectStock(text, language), ...detectRepetition(text, language), ...detectUniformity(text, language), ...detectVagueness(text, language)].sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
}

// ── the score: weighted findings per 1,000 words, each point traceable to a finding ──

export function scoreDocument(findings, wordCount) {
  if (wordCount < MIN_WORDS) return { scoreModelVersion: SCORE_MODEL_VERSION, band: "insufficient_text", value: null, wordCount, perThousand: null, contributions: [] };
  const seen = new Map();
  const by = new Map();
  for (const f of findings) {
    const e = by.get(f.family) ?? { family: f.family, counted: 0, suppressed: 0, points: 0 };
    const key = `${f.detector}::${f.reason}::${f.evidence.toLowerCase()}`;
    const already = seen.get(key) ?? 0;
    seen.set(key, already + 1);
    if (already >= REPEAT_CAP) e.suppressed += 1;
    else {
      e.counted += 1;
      e.points += SEVERITY_POINTS[f.severity];
    }
    by.set(f.family, e);
  }
  const contributions = [...by.values()].sort((a, b) => b.points - a.points);
  const points = contributions.reduce((s, c) => s + c.points, 0);
  const perThousand = (points / wordCount) * 1000;
  const value = Math.round(Math.min(1, perThousand / SATURATION_POINTS_PER_1K) * 100);
  return { scoreModelVersion: SCORE_MODEL_VERSION, band: BANDS.find(([floor]) => value >= floor)[1], value, wordCount, perThousand: Number(perThousand.toFixed(2)), points, capped: perThousand > SATURATION_POINTS_PER_1K, contributions };
}

/**
 * The page's writing patterns. `sections` are the kept text's sections ({heading, text}) in order;
 * `passages` locate each finding (the first passage whose text holds its evidence). Returns the
 * language verdict, the word count, the score and the findings, each with its section heading,
 * passage index and word position (1-based) in the analysed text.
 */
export function analysePatterns(sections, passages = []) {
  const parts = [];
  let offset = 0;
  const bounds = [];
  for (const s of sections) {
    const t = normalizeText(s.text);
    if (!t) continue;
    bounds.push({ start: offset, end: offset + t.length, heading: s.heading ?? null });
    parts.push(t);
    offset += t.length + 2;
  }
  const text = parts.join("\n\n");
  const wordCount = countWords(text);
  const lang = detectLanguage(text);
  if (!lang.ok) return { analysed: false, reason: lang.code, wordCount, findings: [], score: null, version: DETECTOR_SET_VERSION };
  const raw = runDetectors(text, lang.language);
  const fold = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const findings = raw.map((f) => {
    const sec = bounds.find((b) => f.startOffset >= b.start && f.startOffset < b.end) || null;
    const ev = fold(f.evidence).slice(0, 120);
    const p = passages.find((x) => fold(x.text).includes(ev));
    return { ...f, heading: sec?.heading ?? null, passage: p ? p.index : null, word: countWords(text.slice(0, f.startOffset)) + 1 };
  });
  return { analysed: true, language: lang.language, confidence: lang.confidence, wordCount, findings, score: scoreDocument(raw, wordCount), version: DETECTOR_SET_VERSION };
}
