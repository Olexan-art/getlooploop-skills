// "How generated the text sounds": one report block shared by Vectorscope, AI Search Audit Lite
// and AI Search Audit Full (they vendor this file unchanged). Three layers, kept apart:
//
//   derived    PatternScope's Pattern score (det-1 / score-1, patterns.mjs) over the page's kept
//              text, and the same score per passage from 60 words; the marker-word density
//              (markers.mjs), beside the score and never inside it;
//   measured   which passages are too short for a score of their own;
//   judgement  the agent's swap test, written to style.json: is each passage specific, or generic
//              enough to sit on a competitor's page with only the name changed? Each verdict
//              carries a verbatim quote the script checks.
//
// Not an authorship detector, and the block says so: worn phrasing and generic passages are what
// it can see; who wrote them it cannot. Where the script and the agent disagree, the disagreement
// is shown, never averaged.
//
// Pure: no model, no network. Copy in English, Ukrainian and Polish; Markdown and the export in
// English. Page text (headings, quotes) is escaped and never translated.

import { analysePatterns, countWords, DETECTOR_SET_VERSION, MIN_WORDS, normalizeText, runDetectors, SCORE_MODEL_VERSION, scoreDocument } from "./patterns.mjs";
import { countMarkers, markerBand, MARKER_SET_VERSION, perThousand } from "./markers.mjs";
import { quoteIn } from "./judgement.mjs";
import { RUSSIAN_ONLY } from "./russian.mjs";

export const STYLE_VERDICTS = ["specific", "generic"];
export const MAX_STYLE_QUOTE_CHARS = 200;
export const MAX_STYLE_WHY_CHARS = 160;
/** At or above this Pattern score the script reads a passage as templated. */
export const SCRIPT_TEMPLATED_AT = 30;
/** Chips shown per detector family before the rest is counted, not dropped. */
export const CHIPS_PER_FAMILY = 8;
export const FAMILIES = ["stock", "vagueness", "repetition", "uniformity"];

// ── the agent's file ─────────────────────────────────────────────────────────

const str = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * style.json: {"agent": "…", "model": "…", "passages": [{"passage": 0, "verdict": "specific" | "generic",
 * "evidence": "verbatim text from the passage", "why": "optional, one short line"}]}
 * Every passage of the reading exactly once. Returns {judgement: {agent, model}, passages, warnings}.
 */
export function validateStyle(input, passages) {
  const shape = 'style.json must be {"agent": "…", "model": "…", "passages": [{"passage": 0, "verdict": "specific", "evidence": "verbatim text from the passage", "why": "…"}]}';
  if (!input || typeof input !== "object" || !Array.isArray(input.passages)) throw new Error(shape);
  const byIndex = new Map(passages.map((p) => [p.index, p]));
  const seen = new Set();
  const out = [];
  input.passages.forEach((item, i) => {
    const where = `passages[${i}]`;
    if (!item || typeof item !== "object") throw new Error(`${where} must be an object. ${shape}`);
    const n = item.passage;
    if (!Number.isInteger(n) || !byIndex.has(n)) throw new Error(`${where}.passage ${JSON.stringify(n)} is not a passage of this reading (0–${passages.length - 1}).`);
    if (seen.has(n)) throw new Error(`passage ${n} is judged twice.`);
    seen.add(n);
    if (!STYLE_VERDICTS.includes(item.verdict)) throw new Error(`${where}.verdict must be "specific" or "generic".`);
    if (!str(item.evidence) || item.evidence.length > MAX_STYLE_QUOTE_CHARS) throw new Error(`${where}.evidence must be 1–${MAX_STYLE_QUOTE_CHARS} characters copied from passage ${n}.`);
    if (!quoteIn(item.evidence, byIndex.get(n).text)) throw new Error(`${where}.evidence is not verbatim text from passage ${n}. Copy it exactly (whitespace and quote style may differ).`);
    if (item.why !== undefined && item.why !== null && (typeof item.why !== "string" || item.why.length > MAX_STYLE_WHY_CHARS)) throw new Error(`${where}.why must be a string of at most ${MAX_STYLE_WHY_CHARS} characters.`);
    if (typeof item.why === "string" && RUSSIAN_ONLY.test(item.why)) throw new Error(`${where}.why contains letters used only in Russian; this product does not publish Russian.`);
    out.push({ passage: n, verdict: item.verdict, evidence: item.evidence.trim(), why: str(item.why) ? item.why.trim() : null });
  });
  const missing = passages.map((p) => p.index).filter((n) => !seen.has(n));
  if (missing.length) throw new Error(`style.json leaves out passage${missing.length === 1 ? "" : "s"} ${missing.join(", ")}: judge every passage.`);
  out.sort((a, b) => a.passage - b.passage);
  const id = (v) => (str(v) ? v.trim().slice(0, 60) : null);
  return { judgement: { agent: id(input.agent), model: id(input.model) }, passages: out, warnings: [] };
}

// ── the computation ──────────────────────────────────────────────────────────

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clipText = (s, n) => {
  const t = fold(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/**
 * The block's model. `sections` are the kept text's sections ({heading, text, intro?}) as the
 * chunker splits it, or null for a reading made before they were recorded; `passages` the
 * reading's passages; `style` a validated style.json or null.
 */
export function computeGenerated({ sections, passages, style = null }) {
  const base = {
    versions: { detectors: DETECTOR_SET_VERSION, score: SCORE_MODEL_VERSION, markers: MARKER_SET_VERSION },
    minWords: MIN_WORDS,
    templatedAt: SCRIPT_TEMPLATED_AT,
  };
  let patterns = null;
  let reason = null;
  if (!Array.isArray(sections)) reason = "no_sections";
  else {
    patterns = analysePatterns(sections.filter((s) => !s.intro), passages);
    if (!patterns.analysed) reason = patterns.reason;
    else if (patterns.score.band === "insufficient_text") reason = "insufficient_text";
  }
  const language = patterns?.analysed ? patterns.language : null;

  // The page: the score over the kept text, and the markers over the same words.
  let page = null;
  if (language) {
    const text = sections
      .filter((s) => !s.intro)
      .map((s) => normalizeText(s.text))
      .filter(Boolean)
      .join("\n\n");
    const m = countMarkers(text, language);
    const words = patterns.wordCount;
    page = {
      words,
      score: patterns.score.band === "insufficient_text" ? null : { value: patterns.score.value, band: patterns.score.band, points: patterns.score.points, perThousand: patterns.score.perThousand, contributions: patterns.score.contributions },
      markers: { hits: m.total, perThousand: perThousand(m.total, words), band: markerBand(perThousand(m.total, words)), terms: m.terms },
    };
  }

  // Each passage on its own.
  const verdicts = new Map((style?.passages || []).map((v) => [v.passage, v]));
  const rows = passages.map((p) => {
    const text = normalizeText(p.text);
    const words = countWords(text);
    const chars = Number.isFinite(p.charCount) ? p.charCount : String(p.text ?? "").length;
    let score = null;
    let markers = null;
    if (language) {
      if (words >= MIN_WORDS) {
        const s = scoreDocument(runDetectors(text, language), words);
        score = { value: s.value, band: s.band };
      }
      const m = countMarkers(text, language);
      markers = { hits: m.total, perThousand: perThousand(m.total, words), terms: m.terms.map((t) => t.term) };
    }
    const v = verdicts.get(p.index) || null;
    let disagree = null;
    if (v && score) {
      if (score.value < SCRIPT_TEMPLATED_AT && v.verdict === "generic") disagree = "script_missed";
      else if (score.value >= SCRIPT_TEMPLATED_AT && v.verdict === "specific") disagree = "script_flagged";
    }
    return { index: p.index, heading: p.heading ?? null, chars, words, short: words < MIN_WORDS, score, markers, verdict: v ? v.verdict : null, evidence: v ? v.evidence : null, why: v ? v.why : null, disagree };
  });

  // Findings as chips: one per distinct evidence, with its count and passages; the rest counted.
  const families = [];
  if (patterns?.analysed) {
    for (const family of FAMILIES) {
      const items = patterns.findings.filter((f) => f.family === family);
      if (!items.length) continue;
      const byKey = new Map();
      for (const f of items) {
        const key = fold(f.evidence).toLowerCase();
        const e = byKey.get(key) ?? { text: clipText(f.evidence, family === "stock" || family === "vagueness" ? 60 : 90), count: 0, passages: new Set() };
        e.count += 1;
        if (f.passage !== null && f.passage !== undefined) e.passages.add(f.passage);
        byKey.set(key, e);
      }
      const chips = [...byKey.values()].sort((a, b) => b.count - a.count).map((c) => ({ text: c.text, count: c.count, passages: [...c.passages].sort((a, b) => a - b) }));
      const contribution = page?.score?.contributions.find((c) => c.family === family) ?? null;
      families.push({ family, findings: items.length, points: contribution ? contribution.points : 0, chips: chips.slice(0, CHIPS_PER_FAMILY), more: Math.max(0, chips.length - CHIPS_PER_FAMILY) });
    }
  }
  if (page) {
    for (const t of page.markers.terms) t.passages = rows.filter((r) => r.markers?.terms.includes(t.term)).map((r) => r.index);
  }

  const totalChars = rows.reduce((s, r) => s + r.chars, 0);
  const judged = Boolean(style);
  const generic = rows.filter((r) => r.verdict === "generic");
  return {
    ...base,
    analysed: Boolean(page),
    reason,
    language,
    page,
    families,
    passages: rows,
    short: rows.filter((r) => r.short).map((r) => r.index),
    judged,
    judgement: style ? style.judgement : null,
    generic: judged ? { passages: generic.length, of: rows.length, chars: generic.reduce((s, r) => s + r.chars, 0), totalChars, share: totalChars ? generic.reduce((s, r) => s + r.chars, 0) / totalChars : 0 } : null,
    disagreements: rows.filter((r) => r.disagree).map((r) => ({ passage: r.index, kind: r.disagree })),
  };
}

// ── the numbers' definitions: the "?" in Vectorscope, the folded key in Lite and Full ──

export const GENERATED_METRICS = {
  pattern_score: {
    layer: "derived",
    label: { en: "Pattern score", uk: "Бал шаблонності", pl: "Wskaźnik szablonowości" },
    formula: {
      en: "PatternScope's four detector families (det-1) over the page's kept text, without the title, h1 and description intro: stock phrases; sentences sharing one shape; three or more sentences opening the same way; an evaluative word on an abstract noun with no number or name in the sentence. A finding scores 1, 3 or 6 by severity, one identical finding at most 4 times; points per 1,000 words over 250, capped at 100 (score-1). A passage's own score is the same formula over its text, from 60 words.",
      uk: "Чотири родини детекторів PatternScope (det-1) по збереженому тексту сторінки, без вступу з title, h1 і опису: стокові фрази; речення однієї будови; три й більше речень з однаковим початком; оцінне слово при абстрактному іменнику без цифри чи назви в реченні. Знахідка дає 1, 3 або 6 балів за силою, одна й та сама рахується не більше 4 разів; бали на 1 000 слів, поділені на 250, не більше 100 (score-1). Бал уривка — та сама формула по його тексту, від 60 слів.",
      pl: "Cztery rodziny detektorów PatternScope (det-1) na zachowanym tekście strony, bez wstępu z title, h1 i opisu: utarte frazy; zdania o tej samej budowie; trzy lub więcej zdań zaczynających się tak samo; słowo oceniające przy rzeczowniku abstrakcyjnym bez liczby ani nazwy w zdaniu. Sygnał daje 1, 3 lub 6 punktów według wagi, ten sam liczy się najwyżej 4 razy; punkty na 1000 słów podzielone przez 250, maksymalnie 100 (score-1). Wskaźnik fragmentu to ta sama formuła na jego tekście, od 60 słów.",
    },
    unit: { en: "0–100", uk: "0–100", pl: "0–100" },
    threshold: { en: "0–29 low · 30–59 moderate · 60+ high", uk: "0–29 низька · 30–59 помірна · 60+ висока", pl: "0–29 niski · 30–59 umiarkowany · 60+ wysoki" },
    limits: {
      en: "Calibrated on 60–300-word texts; a long page is an extrapolation. Lexicons for English, Ukrainian and Spanish only: any other language gets no score, not a zero. Signals of worn writing, not of who wrote it. Two changes from the web tool, for whole pages rather than pasted text: a sentence shape needs at least one function word (a reference list is not a template), and a few words with letters such as ł or ß do not make an English page another language.",
      uk: "Калібровано на текстах 60–300 слів; довга сторінка — екстраполяція. Словники лише для англійської, української та іспанської: інша мова не отримує бала, а не отримує нуль. Сигнали заношеного письма, а не того, хто писав. Дві зміни порівняно з вебінструментом, бо тут ціла сторінка, а не вставлений текст: будова речення має містити хоч одне службове слово (список джерел — не шаблон), а кілька слів із літерами на кшталт ł чи ß не роблять англійську сторінку іншою мовою.",
      pl: "Skalibrowany na tekstach 60–300 słów; długa strona to ekstrapolacja. Słowniki tylko dla angielskiego, ukraińskiego i hiszpańskiego: inny język nie dostaje wskaźnika, a nie dostaje zera. Sygnały wytartego stylu, nie tego, kto pisał. Dwie zmiany względem narzędzia w sieci, bo tu chodzi o całą stronę, a nie wklejony tekst: konstrukcja zdania musi zawierać choć jedno słowo funkcyjne (lista źródeł to nie szablon), a kilka słów z literami takimi jak ł czy ß nie czyni angielskiej strony innym językiem.",
    },
  },
  marker_words: {
    layer: "derived",
    label: { en: "Marker words", uk: "Слова-маркери", pl: "Słowa-markery" },
    formula: {
      en: "Occurrences of words from a fixed per-language list (seamless, unlock, delve; «безшовний», «на новий рівень»; «sin fisuras»…) per 1,000 words of the same text as the Pattern score. The English core follows published excess-vocabulary studies (Kobak et al., 2024); the Ukrainian and Spanish lists are written natively.",
      uk: "Входження слів зі сталого списку для кожної мови (seamless, unlock, delve; «безшовний», «на новий рівень»; «sin fisuras»…) на 1 000 слів того самого тексту, що й бал шаблонності. Англійське ядро спирається на опубліковані дослідження надлишкової лексики (Kobak та ін., 2024); українські й іспанські списки написано мовою оригіналу.",
      pl: "Wystąpienia słów ze stałej listy dla każdego języka (seamless, unlock, delve; «безшовний», «на новий рівень»; «sin fisuras»…) na 1000 słów tego samego tekstu co wskaźnik szablonowości. Angielski rdzeń opiera się na opublikowanych badaniach nadmiarowego słownictwa (Kobak i in., 2024); listy ukraińska i hiszpańska są pisane w tych językach.",
    },
    unit: { en: "hits per 1,000 words", uk: "входжень на 1 000 слів", pl: "wystąpień na 1000 słów" },
    threshold: { en: "0–9 rare · 10–24 noticeable · 25+ frequent; not yet calibrated", uk: "0–9 рідко · 10–24 помітно · 25+ часто; ще не калібровано", pl: "0–9 rzadko · 10–24 zauważalnie · 25+ często; jeszcze nieskalibrowane" },
    limits: {
      en: "Not part of the Pattern score, so the score stays PatternScope's. Marketing copy written by people uses these words too.",
      uk: "Не входить у бал шаблонності, тож бал лишається балом PatternScope. Маркетингові тексти людей теж уживають ці слова.",
      pl: "Nie wchodzi do wskaźnika szablonowości, więc wskaźnik pozostaje wskaźnikiem PatternScope. Teksty marketingowe pisane przez ludzi też używają tych słów.",
    },
  },
  generic_share: {
    layer: "judgement",
    label: { en: "Generic passages", uk: "Загальні уривки", pl: "Ogólne fragmenty" },
    formula: {
      en: "The agent reads every passage and marks it specific or generic by one question: would it fit a competitor's page with only the brand name changed? Each verdict carries a verbatim quote the script checks. Share = characters of generic passages / characters of all passages.",
      uk: "Агент читає кожен уривок і позначає його конкретним або загальним за одним питанням: чи підійде він на сторінку конкурента, якщо змінити лише назву бренду? Кожен вердикт має дослівну цитату, яку перевіряє скрипт. Частка = символи загальних уривків / символи всіх уривків.",
      pl: "Agent czyta każdy fragment i oznacza go jako konkretny lub ogólny na podstawie jednego pytania: czy pasowałby na stronę konkurenta po zmianie samej nazwy marki? Każdy werdykt ma dosłowny cytat, który sprawdza skrypt. Udział = znaki ogólnych fragmentów / znaki wszystkich fragmentów.",
    },
    unit: { en: "% of passage characters", uk: "% символів уривків", pl: "% znaków fragmentów" },
    threshold: null,
    limits: {
      en: "A model's reading, not a measurement: another model may draw the line elsewhere. Where it disagrees with the script, both are shown, never averaged.",
      uk: "Прочитання моделі, а не вимірювання: інша модель може провести межу інакше. Де воно розходиться зі скриптом, показано обидва, без усереднення.",
      pl: "Odczyt modelu, nie pomiar: inny model może poprowadzić granicę gdzie indziej. Tam, gdzie różni się od skryptu, pokazane są oba, bez uśredniania.",
    },
  },
  short_passages: {
    layer: "measured",
    label: { en: "Passages too short for a score", uk: "Уривки, закороткі для бала", pl: "Fragmenty za krótkie na wskaźnik" },
    formula: {
      en: "Passages with fewer than 60 words, PatternScope's floor.",
      uk: "Уривки, коротші за 60 слів — поріг PatternScope.",
      pl: "Fragmenty krótsze niż 60 słów, czyli próg PatternScope.",
    },
    unit: { en: "passages", uk: "уривки", pl: "fragmenty" },
    threshold: null,
    limits: {
      en: "Their text still counts in the page score; only a score of their own is withheld, because a density over a few dozen words swings on a comma.",
      uk: "Їхній текст однаково входить у бал сторінки; не ставиться лише їхній власний бал, бо щільність на кількох десятках слів змінюється від однієї коми.",
      pl: "Ich tekst nadal liczy się do wskaźnika strony; pomijany jest tylko ich własny wskaźnik, bo gęstość na kilkudziesięciu słowach zmienia się od jednego przecinka.",
    },
  },
};

// ── copy ─────────────────────────────────────────────────────────────────────

const N = {
  en: (n) => Number(n).toLocaleString("en-US"),
  uk: (n) => Number(n).toLocaleString("en-US").replace(/,/g, " "),
  pl: (n) => Number(n).toLocaleString("en-US").replace(/,/g, " "),
};
const D = { en: (x) => String(x), uk: (x) => String(x).replace(".", ","), pl: (x) => String(x).replace(".", ",") };
function ukForm(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const d = a % 10;
  if (d === 1 && a !== 11) return one;
  if (d >= 2 && d <= 4 && (a < 12 || a > 14)) return few;
  return many;
}
function plForm(n, one, few, many) {
  const a = Math.abs(n);
  if (a === 1) return one;
  const d = a % 10;
  const h = a % 100;
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
}
const refs = (list) => list.map((n) => `#${n}`);
const listEn = (xs) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const listUk = (xs) => (xs.length <= 2 ? xs.join(" і ") : `${xs.slice(0, -1).join(", ")} і ${xs[xs.length - 1]}`);
const listPl = (xs) => (xs.length <= 2 ? xs.join(" i ") : `${xs.slice(0, -1).join(", ")} i ${xs[xs.length - 1]}`);

export const GENERATED_COPY = {
  title: { en: "How generated the text sounds", uk: "Наскільки текст звучить як згенерований", pl: "Na ile tekst brzmi jak wygenerowany" },
  sub: {
    en: "stock phrasing, marker words and generic passages · not an authorship detector",
    uk: "шаблонні фрази, слова-маркери і загальні уривки · не детектор авторства",
    pl: "utarte frazy, słowa-markery i ogólne fragmenty · nie wykrywa autorstwa",
  },
  band: {
    low: { en: "low", uk: "низька", pl: "niski" },
    moderate: { en: "moderate", uk: "помірна", pl: "umiarkowany" },
    high: { en: "high", uk: "висока", pl: "wysoki" },
  },
  markerBand: {
    rare: { en: "rare", uk: "рідко", pl: "rzadko" },
    noticeable: { en: "noticeable", uk: "помітно", pl: "zauważalnie" },
    frequent: { en: "frequent", uk: "часто", pl: "często" },
  },
  verdict: {
    specific: { en: "specific", uk: "конкретний", pl: "konkretny" },
    generic: { en: "generic", uk: "загальний", pl: "ogólny" },
  },
  scoreLabel: {
    en: "Pattern score over the page's text, by PatternScope's rules",
    uk: "Бал шаблонності по тексту сторінки, за правилами PatternScope",
    pl: "Wskaźnik szablonowości tekstu strony według reguł PatternScope",
  },
  notComputed: { en: "not computed", uk: "не пораховано", pl: "nie policzono" },
  reason: {
    no_sections: {
      en: "This reading was made by an older read.mjs that did not record the page's text sections. Run read.mjs again.",
      uk: "Це читання зроблене старішим read.mjs, який не записував розділів тексту сторінки. Запустіть read.mjs ще раз.",
      pl: "Ten odczyt wykonał starszy read.mjs, który nie zapisywał sekcji tekstu strony. Uruchom read.mjs ponownie.",
    },
    insufficient_text: {
      en: "The page has fewer than 60 words of kept text: a density over so few words swings on a comma.",
      uk: "На сторінці менше 60 слів збереженого тексту: щільність на такій кількості слів змінюється від однієї коми.",
      pl: "Strona ma mniej niż 60 słów zachowanego tekstu: gęstość na tak małej liczbie słów zmienia się od jednego przecinka.",
    },
    language_not_supported: {
      en: "The lexicons cover English, Ukrainian and Spanish; this text's language is not one of them, so it gets no score rather than a zero.",
      uk: "Словники охоплюють англійську, українську й іспанську; мова цього тексту не з них, тож він не отримує бала, а не нуль.",
      pl: "Słowniki obejmują angielski, ukraiński i hiszpański; języka tego tekstu wśród nich nie ma, więc nie dostaje wskaźnika, a nie zera.",
    },
    unsupported_language: {
      en: "The lexicons cover English, Ukrainian and Spanish; this text's language is not one of them, so it gets no score rather than a zero.",
      uk: "Словники охоплюють англійську, українську й іспанську; мова цього тексту не з них, тож він не отримує бала, а не нуль.",
      pl: "Słowniki obejmują angielski, ukraiński i hiszpański; języka tego tekstu wśród nich nie ma, więc nie dostaje wskaźnika, a nie zera.",
    },
    unsupported_mix: {
      en: "The text mixes Latin and Cyrillic too much to pick one lexicon, so it gets no score.",
      uk: "Текст надто змішує латиницю й кирилицю, щоб обрати один словник, тож бала немає.",
      pl: "Tekst za bardzo miesza alfabet łaciński i cyrylicę, by wybrać jeden słownik, więc nie ma wskaźnika.",
    },
    language_undetermined: {
      en: "The text's language could not be determined, so no lexicon applies.",
      uk: "Мову тексту не вдалося визначити, тож жоден словник не застосовано.",
      pl: "Nie udało się ustalić języka tekstu, więc żaden słownik nie ma zastosowania.",
    },
  },
  markersLabel: {
    en: (v) => `Words models overuse: ${N.en(v.hits)} ${v.hits === 1 ? "occurrence" : "occurrences"} in ${v.with} of ${v.of} passages`,
    uk: (v) => `Слова, які моделі вживають надмірно: ${N.uk(v.hits)} ${ukForm(v.hits, "входження", "входження", "входжень")} у ${v.with} з ${v.of} уривків`,
    pl: (v) => `Słowa nadużywane przez modele: ${N.pl(v.hits)} ${plForm(v.hits, "wystąpienie", "wystąpienia", "wystąpień")} w ${v.with} z ${v.of} fragmentów`,
  },
  perThousandWords: { en: "/1,000 words", uk: "/1 000 слів", pl: "/1000 słów" },
  genericLabel: {
    en: "of passage text sits in passages the agent reads as generic: they would fit a competitor's site with only the name changed",
    uk: "тексту уривків припадає на уривки, які агент вважає загальними: їх можна перенести на сайт конкурента, змінивши лише назву",
    pl: "tekstu fragmentów przypada na fragmenty, które agent uznał za ogólne: pasowałyby na stronę konkurenta po zmianie samej nazwy",
  },
  genericPill: {
    en: (v) => `${v.n} of ${v.of} passages`,
    uk: (v) => `${v.n} з ${v.of} ${ukForm(v.of, "уривка", "уривків", "уривків")}`,
    pl: (v) => `${v.n} z ${v.of} fragmentów`,
  },
  notJudged: {
    en: "The agent did not read the passages for this block: no style.json was given.",
    uk: "Агент не читав уривки для цього блоку: style.json не передано.",
    pl: "Agent nie czytał fragmentów dla tego bloku: nie podano style.json.",
  },
  notJudgedPill: { en: "not judged", uk: "без судження", pl: "bez oceny" },
  shortLabel: {
    en: (v) => `passages under 60 words${v.list ? `: ${v.list}` : ""}. They get no score of their own, so one comma cannot flip a band; their text still counts in the page score.`,
    uk: (v) => `уривки, коротші за 60 слів${v.list ? `: ${v.list}` : ""}. Власного бала вони не отримують, щоб одна кома не перемикала смугу; у бал сторінки їхній текст входить.`,
    pl: (v) => `fragmenty krótsze niż 60 słów${v.list ? `: ${v.list}` : ""}. Nie dostają własnego wskaźnika, żeby jeden przecinek nie zmieniał przedziału; ich tekst nadal liczy się do wskaźnika strony.`,
  },
  shortPill: { en: "no score", uk: "без бала", pl: "bez wskaźnika" },
  byPassage: { en: "Passage by passage", uk: "Уривок за уривком", pl: "Fragment po fragmencie" },
  cellWidth: { en: "cell width = the passage's characters", uk: "ширина клітинки = символи уривка", pl: "szerokość komórki = znaki fragmentu" },
  rowScript: { en: "Script · score", uk: "Скрипт · бал", pl: "Skrypt · wskaźnik" },
  rowAgent: { en: "Agent · swap test", uk: "Агент · тест підміни", pl: "Agent · test podmiany" },
  legend: {
    high: { en: "high 60+", uk: "висока 60+", pl: "wysoki 60+" },
    moderate: { en: "moderate 30–59", uk: "помірна 30–59", pl: "umiarkowany 30–59" },
    low: { en: "low 0–29", uk: "низька 0–29", pl: "niski 0–29" },
    short: { en: "under 60 words", uk: "менше 60 слів", pl: "poniżej 60 słów" },
  },
  disagreeLead: {
    en: (v) => `The script and the agent disagree on ${listEn(v.refs)}.`,
    uk: (v) => `Скрипт і агент розходяться в ${v.refs.length === 1 ? "уривку" : "уривках"} ${listUk(v.refs)}.`,
    pl: (v) => `Skrypt i agent różnią się co do ${v.refs.length === 1 ? "fragmentu" : "fragmentów"} ${listPl(v.refs)}.`,
  },
  disagreeMissed: {
    en: (v) => `Low score, generic text: ${listEn(v.refs)}. PatternScope's lists do not hold what makes ${v.refs.length === 1 ? "it" : "them"} generic${v.markers ? `; the marker words do: ${v.markers} per 1,000 words` : ""}.`,
    uk: (v) => `Низький бал, загальний текст: ${listUk(v.refs)}. Того, що робить ${v.refs.length === 1 ? "його" : "їх"} загальними, у списках PatternScope немає${v.markers ? `; це видно зі слів-маркерів: ${v.markers} на 1 000 слів` : ""}.`,
    pl: (v) => `Niski wskaźnik, ogólny tekst: ${listPl(v.refs)}. Tego, co czyni ${v.refs.length === 1 ? "go" : "je"} ogólnymi, nie ma na listach PatternScope${v.markers ? `; widać to po słowach-markerach: ${v.markers} na 1000 słów` : ""}.`,
  },
  disagreeFlagged: {
    en: (v) => `High score, specific text: ${listEn(v.refs)}. ${v.refs.length === 1 ? "It states" : "They state"} facts, in worn phrasing.`,
    uk: (v) => `Високий бал, конкретний текст: ${listUk(v.refs)}. Факти є, але подані заношеними фразами.`,
    pl: (v) => `Wysoki wskaźnik, konkretny tekst: ${listPl(v.refs)}. Fakty są, ale podane utartymi frazami.`,
  },
  disagreeWhy: {
    en: "The disagreement is shown rather than averaged: it is where each method's blind spot shows.",
    uk: "Розбіжність показано, а не усереднено: саме в ній видно, чого не бачить кожен зі способів.",
    pl: "Rozbieżność jest pokazana, a nie uśredniona: właśnie w niej widać, czego nie dostrzega każda z metod.",
  },
  whereFrom: { en: "Where the score comes from", uk: "Звідки бал", pl: "Skąd wskaźnik" },
  whereFromLine: {
    en: (v) => `${N.en(v.points)} points over ${N.en(v.words)} words = ${D.en(v.per1k)} per 1,000 → ${v.value}/100. Every point has a finding you can see below.`,
    uk: (v) => `${N.uk(v.points)} ${ukForm(v.points, "бал", "бали", "балів")} на ${N.uk(v.words)} ${ukForm(v.words, "слово", "слова", "слів")} = ${D.uk(v.per1k)} на 1 000 → ${v.value}/100. Кожен бал має знахідку, яку видно нижче.`,
    pl: (v) => `${N.pl(v.points)} ${plForm(v.points, "punkt", "punkty", "punktów")} na ${N.pl(v.words)} ${plForm(v.words, "słowo", "słowa", "słów")} = ${D.pl(v.per1k)} na 1000 → ${v.value}/100. Każdy punkt ma sygnał widoczny poniżej.`,
  },
  noFindings: {
    en: "No finding in any of the four families: the score is 0.",
    uk: "У жодній із чотирьох родин немає знахідок: бал 0.",
    pl: "Brak sygnałów w żadnej z czterech rodzin: wskaźnik wynosi 0.",
  },
  family: {
    stock: { en: "Stock phrases", uk: "Стокові фрази", pl: "Utarte frazy" },
    vagueness: { en: "Claims with no number or name", uk: "Оцінки без цифр і назв", pl: "Oceny bez liczb i nazw" },
    repetition: { en: "Repeated sentence shape", uk: "Повтор конструкції", pl: "Powtórzona konstrukcja zdania" },
    uniformity: { en: "Uniform openings", uk: "Однакові початки речень", pl: "Jednakowe początki zdań" },
  },
  findingsN: {
    en: (v) => `${N.en(v.n)} ${v.n === 1 ? "finding" : "findings"} · ${N.en(v.points)} pts`,
    uk: (v) => `${N.uk(v.n)} ${ukForm(v.n, "знахідка", "знахідки", "знахідок")} · ${N.uk(v.points)} б.`,
    pl: (v) => `${N.pl(v.n)} ${plForm(v.n, "sygnał", "sygnały", "sygnałów")} · ${N.pl(v.points)} pkt`,
  },
  more: { en: (v) => `+${v.n} more`, uk: (v) => `ще ${v.n}`, pl: (v) => `jeszcze ${v.n}` },
  markersLine: { en: "Marker words (not in the score):", uk: "Слова-маркери (не в балі):", pl: "Słowa-markery (poza wskaźnikiem):" },
  noMarkers: { en: "Marker words: none.", uk: "Слів-маркерів немає.", pl: "Brak słów-markerów." },
  passagesHead: { en: "Passages", uk: "Уривки", pl: "Fragmenty" },
  col: {
    n: { en: "#", uk: "#", pl: "#" },
    heading: { en: "Heading", uk: "Заголовок", pl: "Nagłówek" },
    score: { en: "Score", uk: "Бал", pl: "Wskaźnik" },
    markers: { en: "Markers /1k", uk: "Маркери /1000", pl: "Markery /1000" },
    agent: { en: "Agent", uk: "Агент", pl: "Agent" },
    evidence: { en: "Agent's evidence, verbatim", uk: "Доказ агента, дослівно", pl: "Dowód agenta, dosłownie" },
  },
  words: {
    en: (v) => `${N.en(v.n)} ${v.n === 1 ? "word" : "words"}`,
    uk: (v) => `${N.uk(v.n)} ${ukForm(v.n, "слово", "слова", "слів")}`,
    pl: (v) => `${N.pl(v.n)} ${plForm(v.n, "słowo", "słowa", "słów")}`,
  },
  noHeading: { en: "(no heading)", uk: "(без заголовка)", pl: "(bez nagłówka)" },
  howTitle: { en: "How these numbers are computed", uk: "Як обчислено ці числа", pl: "Jak obliczono te liczby" },
  helpFormula: { en: "Formula", uk: "Формула", pl: "Wzór" },
  helpUnit: { en: "Unit", uk: "Одиниця", pl: "Jednostka" },
  helpThreshold: { en: "Threshold", uk: "Поріг", pl: "Próg" },
  helpLimits: { en: "Known limits", uk: "Обмеження", pl: "Ograniczenia" },
  noteTitle: { en: "This is not an AI detector.", uk: "Це не детектор ШІ.", pl: "To nie jest detektor AI." },
  note: {
    en: "Authorship cannot be proven from text: people write “it is worth noting that”, and a model can be told not to. The block counts what is visible and checkable: worn phrases, marker words and passages with no fact in them. For AI search the last one matters most: a generic passage adds nothing to an answer, so it is not cited, whoever wrote it.",
    uk: "Хто написав текст, з тексту довести не можна: люди пишуть «варто зазначити, що», а модель можна попросити так не писати. Блок рахує те, що видно й можна перевірити: заношені фрази, слова-маркери і уривки без жодного факту. Для ШІ-пошуку найважливіше останнє: загальний уривок нічого не додає до відповіді, тож його не цитують, хоч би хто його написав.",
    pl: "Autorstwa nie da się udowodnić na podstawie tekstu: ludzie piszą „warto zauważyć, że”, a model można poprosić, żeby tak nie pisał. Ten blok liczy to, co widać i co da się sprawdzić: utarte frazy, słowa-markery i fragmenty bez żadnego faktu. Dla wyszukiwania AI najważniejsze jest to ostatnie: ogólny fragment nic nie wnosi do odpowiedzi, więc nie jest cytowany, niezależnie od tego, kto go napisał.",
  },
  byLine: {
    en: (v) => `Swap test by ${v.by}.`,
    uk: (v) => `Тест підміни: ${v.by}.`,
    pl: (v) => `Test podmiany: ${v.by}.`,
  },
  layer: {
    measured: { en: "Measured", uk: "Виміряно", pl: "Zmierzono" },
    derived: { en: "Derived", uk: "Обчислено", pl: "Obliczono" },
    judgement: { en: "Agent's judgement", uk: "Судження агента", pl: "Ocena agenta" },
  },
};

// ── HTML ─────────────────────────────────────────────────────────────────────

const LANGS = ["en", "uk", "pl"];

/** HTML-escape page text and copy alike. */
export function escGx(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** One copy entry in every language; values are escaped unless `raw`. */
function T(entry, values, raw = false) {
  return LANGS.map((l) => {
    const v = typeof entry[l] === "function" ? entry[l](values ?? {}) : entry[l];
    const html = raw ? v : escGx(v);
    return l === "en" ? `<span class="l-en">${html}</span>` : `<span class="l-${l}" lang="${l}">${html}</span>`;
  }).join("");
}
/** An attribute in every language, for the reports' language switch. */
function A(name, entry, values) {
  const val = (l) => escGx(typeof entry[l] === "function" ? entry[l](values ?? {}) : entry[l]);
  return `${name}="${val("en")}" ${LANGS.map((l) => `data-${l}-${name}="${val(l)}"`).join(" ")} data-i18n`;
}
const C = GENERATED_COPY;
const join3 = (fn) => ({ en: fn("en"), uk: fn("uk"), pl: fn("pl") });

function defaultTag(layers) {
  return `<span class="gx-lyrs">${layers.map((l) => `<span class="gx-lyr ${l}">${T(C.layer[l])}</span>`).join("")}</span>`;
}

/** The scoped styles; every colour comes from the host report's tokens, and the host shows one of .l-en / .l-uk / .l-pl. */
export const GENERATED_CSS = `
.gx .gx-head{display:flex;align-items:baseline;gap:6px 12px;flex-wrap:wrap;margin-bottom:14px}
.gx .gx-head h2{margin:0}
.gx .gx-head .gx-sub{color:var(--muted);font-size:14px}
.gx-lyrs{display:inline-flex;gap:6px;flex-wrap:wrap}
.gx-lyr{font-size:12.5px;font-weight:600;border-radius:6px;padding:1px 8px;border:1px solid}
.gx-lyr.measured{color:var(--lm);border-color:var(--lm);background:var(--lm-soft)}
.gx-lyr.derived{color:var(--ld);border-color:var(--ld);background:var(--ld-soft)}
.gx-lyr.judgement{color:var(--lj);border-color:var(--lj);background:var(--lj-soft)}
.gx-counters{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.gx-counter{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--panel-2);display:flex;flex-direction:column;gap:6px;min-width:0}
.gx-counter .gx-n{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.gx-counter .gx-n small{font-size:16px;color:var(--muted);font-weight:600}
.gx-counter .gx-l{color:var(--muted);font-size:14px}
.gx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.gx-pill{display:inline-flex;align-items:center;font-size:13px;border-radius:999px;padding:1px 10px;border:1px solid var(--line-2);color:var(--muted);white-space:nowrap;font-weight:600}
.gx-pill.good{color:var(--green);border-color:var(--green);background:var(--green-soft)}
.gx-pill.bad{color:var(--red);border-color:var(--red);background:var(--red-soft)}
.gx-pill.mid{color:var(--amber);border-color:var(--amber);background:var(--amber-soft)}
.gx-pill.none{border-style:dashed}
.gx-subhead{font-size:17px;font-weight:700;margin:24px 0 8px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.gx-small{font-size:14px;color:var(--muted)}
.gx-strips{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 12px;align-items:center}
.gx-strips .gx-lab{font-size:13.5px;color:var(--muted);font-weight:600;white-space:nowrap}
.gx-strip{display:flex;gap:3px;padding:5px;border:1px solid var(--line);border-radius:10px;background:var(--panel-2);min-width:0}
.gx-cell{height:34px;border-radius:4px;min-width:5px;display:flex;align-items:center;justify-content:center;font:600 11.5px ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;color:var(--text);overflow:hidden;text-decoration:none}
.gx-c-high{background:var(--red-soft);box-shadow:inset 0 0 0 1.5px var(--red)}
.gx-c-moderate{background:var(--amber-soft);box-shadow:inset 0 0 0 1.5px var(--amber)}
.gx-c-low{background:var(--green-soft);box-shadow:inset 0 0 0 1.5px var(--green)}
.gx-c-short,.gx-c-none{background:repeating-linear-gradient(135deg,var(--empty) 0 5px,var(--panel) 5px 9px);box-shadow:inset 0 0 0 1px var(--line-2);color:var(--muted)}
.gx-c-generic{background:var(--amber-soft);box-shadow:inset 0 0 0 1.5px var(--amber)}
.gx-c-specific{background:var(--green-soft);box-shadow:inset 0 0 0 1.5px var(--green)}
.gx-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;padding:0;list-style:none;font-size:13.5px;color:var(--muted)}
.gx-legend li{display:flex;align-items:center;gap:6px}
.gx-sw{width:14px;height:12px;border-radius:3px;flex:none;display:inline-block}
.gx-cut{margin-top:14px;border:1.5px dashed var(--amber);background:var(--amber-soft);border-radius:10px;padding:10px 14px;font-size:15px}
.gx-cut p{margin:0}
.gx-cut p+p{margin-top:4px}
.gx-cut b{color:var(--amber)}
.gx-fam{display:flex;height:14px;border-radius:999px;overflow:hidden;background:var(--empty);margin:6px 0 10px}
.gx-fam span{display:block;height:100%}
.gx-f-stock{background:var(--amber)}
.gx-f-vagueness{background:var(--ld)}
.gx-f-repetition{background:var(--lm)}
.gx-f-uniformity{background:var(--lj)}
.gx-famlist{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.gx-famlist>li{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel-2);font-size:14.5px;min-width:0}
.gx-fh{display:flex;align-items:center;gap:8px;font-weight:700;flex-wrap:wrap}
.gx-pts{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--muted);font-weight:600;font-size:13.5px}
.gx-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0;padding:0;list-style:none}
.gx-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-2);border-radius:999px;padding:2px 10px;font-size:14px;background:var(--panel);max-width:100%}
.gx-chip-n{font-size:12.5px;color:var(--muted);white-space:nowrap}
.gx-markers{margin:10px 0 0}
.gx .gx-table{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel-2)}
.gx table{border-collapse:collapse;width:100%;font-size:14.5px;min-width:720px}
.gx th,.gx td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.gx th{font-size:13px;color:var(--muted);font-weight:700;white-space:nowrap}
.gx tr:last-child td{border-bottom:0}
.gx td.gx-num{font-variant-numeric:tabular-nums;white-space:nowrap}
.gx-meter{display:flex;align-items:center;gap:8px;white-space:nowrap}
.gx-meter i{display:block;width:56px;height:6px;border-radius:999px;background:var(--empty);overflow:hidden}
.gx-meter i b{display:block;height:100%;background:var(--c)}
.gx q{font-style:italic}
.gx tr.gx-disagree td:first-child{box-shadow:inset 3px 0 0 var(--amber)}
.gx-note{margin-top:18px;border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--panel-2);border-radius:12px;padding:12px 16px;font-size:14.5px;color:var(--muted)}
.gx-note b{color:var(--text)}
.gx-how{margin-top:14px}
.gx-how>summary{cursor:pointer;color:var(--accent);font-weight:600;font-size:14.5px}
.gx-how dl{margin:10px 0 0;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}
.gx-how dt{font-weight:700;color:var(--muted)}
.gx-how dd{margin:0}
.gx-how h4{grid-column:1/-1;margin:12px 0 2px;font-size:15px}
@media (max-width:520px){.gx-strips{grid-template-columns:1fr}.gx-counter .gx-n{font-size:26px}}
@media (prefers-reduced-motion:no-preference){.gx-cell{transition:transform .12s}.gx-cell:hover{transform:translateY(-2px)}}
`;

const BAND_PILL = { low: "good", moderate: "mid", high: "bad" };
const MARKER_PILL = { rare: "good", noticeable: "mid", frequent: "bad" };
const BAND_COLOUR = { low: "var(--green)", moderate: "var(--amber)", high: "var(--red)" };

function howFold() {
  const rows = Object.values(GENERATED_METRICS)
    .map((m) => {
      const row = (key, entry) => (entry ? `<dt>${T(C[key])}</dt><dd>${T(entry)}</dd>` : "");
      return `<h4>${T(m.label)} ${defaultTag([m.layer])}</h4>${row("helpFormula", m.formula)}${row("helpUnit", m.unit)}${row("helpThreshold", m.threshold)}${row("helpLimits", m.limits)}`;
    })
    .join("");
  return `<details class="gx-how"><summary>${T(C.howTitle)}</summary><dl>${rows}</dl></details>`;
}

/**
 * The block as one <section>. Options, all optional:
 *   tag(layers)   the host's layer badges (default: the block's own);
 *   help(id)      the host's "?" for a metric id in GENERATED_METRICS (default: none, and a folded
 *                 "How these numbers are computed" closes the block instead);
 *   anchor(index) the href of a passage in the host report, or null;
 *   by            the agent and model line, already HTML-safe, or null.
 */
export function renderGeneratedHtml(g, opts = {}) {
  const tag = opts.tag || defaultTag;
  const help = opts.help || (() => "");
  const anchor = opts.anchor || (() => null);
  const ref = (i) => {
    const href = anchor(i);
    return href ? `<a class="mono" href="${escGx(href)}">#${i}</a>` : `<span class="mono">#${i}</span>`;
  };
  const o = [];
  o.push('<section class="panel gx" id="generated" aria-labelledby="h-generated">');
  o.push(`<div class="gx-head panel-head"><h2 id="h-generated">${T(C.title)}</h2>${tag(["derived", "judgement"])}<span class="gx-sub sub">${T(C.sub)}</span></div>`);

  // ── the four numbers
  o.push('<div class="gx-counters">');
  const p = g.page;
  if (p?.score) {
    o.push(`<div class="gx-counter" id="gx-score"><div class="gx-row"><span class="gx-n">${p.score.value}<small>/100</small></span><span class="gx-pill ${BAND_PILL[p.score.band]}">${T(C.band[p.score.band])}</span></div><div class="gx-l">${T(C.scoreLabel)}</div><div class="gx-row">${tag(["derived"])}${help("pattern_score")}</div></div>`);
  } else {
    o.push(`<div class="gx-counter" id="gx-score"><div class="gx-row"><span class="gx-n">—</span><span class="gx-pill none">${T(C.notComputed)}</span></div><div class="gx-l">${T(C.reason[g.reason] || C.reason.language_undetermined)}</div><div class="gx-row">${tag(["derived"])}${help("pattern_score")}</div></div>`);
  }
  if (p) {
    const withMarkers = g.passages.filter((r) => r.markers?.hits).length;
    o.push(`<div class="gx-counter" id="gx-markers"><div class="gx-row"><span class="gx-n">${T(join3((l) => D[l](p.markers.perThousand)))}<small>${T(C.perThousandWords)}</small></span><span class="gx-pill ${MARKER_PILL[p.markers.band]}">${T(C.markerBand[p.markers.band])}</span></div><div class="gx-l">${T(C.markersLabel, { hits: p.markers.hits, with: withMarkers, of: g.passages.length })}</div><div class="gx-row">${tag(["derived"])}${help("marker_words")}</div></div>`);
  }
  if (g.judged) {
    const pct = Math.round(g.generic.share * 100);
    o.push(`<div class="gx-counter" id="gx-generic"><div class="gx-row"><span class="gx-n">${pct}<small>%</small></span><span class="gx-pill ${g.generic.passages ? "mid" : "good"}">${T(C.genericPill, { n: g.generic.passages, of: g.generic.of })}</span></div><div class="gx-l">${T(C.genericLabel)}</div><div class="gx-row">${tag(["judgement"])}${help("generic_share")}</div></div>`);
  } else {
    o.push(`<div class="gx-counter" id="gx-generic"><div class="gx-row"><span class="gx-n">—</span><span class="gx-pill none">${T(C.notJudgedPill)}</span></div><div class="gx-l">${T(C.notJudged)}</div><div class="gx-row">${tag(["judgement"])}${help("generic_share")}</div></div>`);
  }
  const shortList = g.short.map((i) => `#${i}`).join(", ");
  o.push(`<div class="gx-counter" id="gx-short"><div class="gx-row"><span class="gx-n">${g.short.length}<small> / ${g.passages.length}</small></span><span class="gx-pill none">${T(C.shortPill)}</span></div><div class="gx-l">${T(C.shortLabel, { list: shortList })}</div><div class="gx-row">${tag(["measured"])}${help("short_passages")}</div></div>`);
  o.push("</div>");

  // ── the two strips
  o.push(`<h3 class="gx-subhead">${T(C.byPassage)} <span class="gx-small">${T(C.cellWidth)}</span></h3>`);
  const total = Math.max(1, g.passages.reduce((s, r) => s + r.chars, 0));
  const cell = (r, cls, title) => {
    const href = anchor(r.index);
    const label = r.chars / total >= 0.03 ? r.index : "";
    const t = A("title", title);
    return href ? `<a class="gx-cell ${cls}" style="flex:${Math.max(1, r.chars)}" href="${escGx(href)}" ${t}>${label}</a>` : `<span class="gx-cell ${cls}" style="flex:${Math.max(1, r.chars)}" ${t}>${label}</span>`;
  };
  const scoreTitle = (r) =>
    join3((l) => {
      if (!r.score) return `#${r.index} · ${C.words[l]({ n: r.words })} · ${C.shortPill[l]}`;
      return `#${r.index} · ${r.score.value}/100 ${C.band[r.score.band][l]}`;
    });
  o.push('<div class="gx-strips">');
  if (p) {
    o.push(`<span class="gx-lab">${T(C.rowScript)}</span><div class="gx-strip">${g.passages.map((r) => cell(r, r.score ? `gx-c-${r.score.band}` : "gx-c-short", scoreTitle(r))).join("")}</div>`);
  }
  if (g.judged) {
    o.push(`<span class="gx-lab">${T(C.rowAgent)}</span><div class="gx-strip">${g.passages.map((r) => cell(r, `gx-c-${r.verdict}`, join3((l) => `#${r.index} · ${C.verdict[r.verdict][l]}`))).join("")}</div>`);
  }
  o.push("</div>");
  const sw = (cls, entry) => `<li><span class="gx-sw ${cls}"></span>${T(entry)}</li>`;
  const legend = [];
  if (p) legend.push(sw("gx-c-high", C.legend.high), sw("gx-c-moderate", C.legend.moderate), sw("gx-c-low", C.legend.low), sw("gx-c-short", C.legend.short));
  if (g.judged) legend.push(sw("gx-c-generic", C.verdict.generic), sw("gx-c-specific", C.verdict.specific));
  if (legend.length) o.push(`<ul class="gx-legend">${legend.join("")}</ul>`);

  // ── where they disagree
  if (g.disagreements.length) {
    const byKind = (k) => g.passages.filter((r) => r.disagree === k);
    const missed = byKind("script_missed");
    const flagged = byKind("script_flagged");
    const all = g.disagreements.map((d) => `#${d.passage}`);
    const parts = [`<p><b>${T(C.disagreeLead, { refs: all })}</b></p>`];
    if (missed.length) {
      const hot = missed.filter((r) => r.markers && r.markers.perThousand >= 10);
      const markers = hot.length === missed.length ? join3((l) => (l === "en" ? listEn : l === "uk" ? listUk : listPl)(hot.map((r) => D[l](Math.round(r.markers.perThousand))))) : null;
      parts.push(`<p>${LANGS.map((l) => {
        const html = escGx(C.disagreeMissed[l]({ refs: refs(missed.map((r) => r.index)), markers: markers ? markers[l] : null }));
        return l === "en" ? `<span class="l-en">${html}</span>` : `<span class="l-${l}" lang="${l}">${html}</span>`;
      }).join("")}</p>`);
    }
    if (flagged.length) parts.push(`<p>${T(C.disagreeFlagged, { refs: refs(flagged.map((r) => r.index)) })}</p>`);
    parts.push(`<p>${T(C.disagreeWhy)}</p>`);
    o.push(`<div class="gx-cut" id="gx-disagree">${parts.join("")}</div>`);
  }

  // ── where the score comes from
  if (p?.score) {
    o.push(`<h3 class="gx-subhead">${T(C.whereFrom)} ${tag(["derived"])}</h3>`);
    o.push(`<p class="gx-small" style="margin:0">${T(C.whereFromLine, { points: p.score.points, words: p.words, per1k: p.score.perThousand, value: p.score.value })}</p>`);
    if (g.families.length) {
      o.push(`<div class="gx-fam" role="img" ${A("aria-label", join3((l) => g.families.map((f) => `${C.family[f.family][l]} ${f.points}`).join(", ")))}>${g.families.filter((f) => f.points > 0).map((f) => `<span class="gx-f-${f.family}" style="flex:${f.points}"></span>`).join("")}</div>`);
      o.push('<ul class="gx-famlist">');
      for (const f of g.families) {
        const chips = f.chips.map((c) => `<li class="gx-chip">${escGx(c.text)} <span class="gx-chip-n">${c.count > 1 ? `×${c.count}` : ""}${c.passages.length ? `${c.count > 1 ? " · " : ""}${c.passages.map(ref).join(" ")}` : ""}</span></li>`).join("");
        const more = f.more ? `<li class="gx-chip gx-chip-n">${T(C.more, { n: f.more })}</li>` : "";
        o.push(`<li><div class="gx-fh"><span class="gx-sw gx-f-${f.family}"></span>${T(C.family[f.family])}<span class="gx-pts">${T(C.findingsN, { n: f.findings, points: f.points })}</span></div><ul class="gx-chips">${chips}${more}</ul></li>`);
      }
      o.push("</ul>");
    } else o.push(`<p class="gx-small">${T(C.noFindings)}</p>`);
  }
  if (p) {
    if (p.markers.terms.length) {
      const shown = p.markers.terms.slice(0, 16);
      const rest = p.markers.terms.length - shown.length;
      o.push(`<p class="gx-small gx-markers">${T(C.markersLine)}</p><ul class="gx-chips">${shown.map((t) => `<li class="gx-chip">${escGx(t.term)} <span class="gx-chip-n">${t.count > 1 ? `×${t.count}` : ""}${t.passages.length ? `${t.count > 1 ? " · " : ""}${t.passages.map(ref).join(" ")}` : ""}</span></li>`).join("")}${rest > 0 ? `<li class="gx-chip gx-chip-n">${T(C.more, { n: rest })}</li>` : ""}</ul>`);
    } else o.push(`<p class="gx-small gx-markers">${T(C.noMarkers)}</p>`);
  }

  // ── every passage
  o.push(`<h3 class="gx-subhead">${T(C.passagesHead)} ${tag(p ? ["derived", ...(g.judged ? ["judgement"] : [])] : g.judged ? ["judgement"] : ["measured"])}</h3>`);
  const head = ["n", "heading", ...(p ? ["score", "markers"] : []), ...(g.judged ? ["agent", "evidence"] : [])];
  o.push(`<div class="gx-table"><table><thead><tr>${head.map((k) => `<th>${T(C.col[k])}</th>`).join("")}</tr></thead><tbody>`);
  for (const r of g.passages) {
    const cells = [`<td class="gx-num">${ref(r.index)}</td>`, `<td>${r.heading ? escGx(r.heading) : `<span class="gx-small">${T(C.noHeading)}</span>`}</td>`];
    if (p) {
      cells.push(
        r.score
          ? `<td class="gx-num"><span class="gx-meter" style="--c:${BAND_COLOUR[r.score.band]}"><i><b style="width:${r.score.value}%"></b></i>${r.score.value}</span></td>`
          : `<td class="gx-num gx-small">— ${T(C.words, { n: r.words })}</td>`
      );
      cells.push(`<td class="gx-num">${r.markers.perThousand === null ? "—" : T(join3((l) => D[l](Math.round(r.markers.perThousand))))}</td>`);
    }
    if (g.judged) {
      cells.push(`<td><span class="gx-pill ${r.verdict === "generic" ? "mid" : "good"}">${T(C.verdict[r.verdict])}</span></td>`);
      cells.push(`<td><q>${escGx(r.evidence)}</q>${r.why ? ` <span class="gx-small">· ${escGx(r.why)}</span>` : ""}</td>`);
    }
    o.push(`<tr${r.disagree ? ' class="gx-disagree"' : ""}>${cells.join("")}</tr>`);
  }
  o.push("</tbody></table></div>");
  if (g.judged && opts.by) o.push(`<p class="gx-small">${LANGS.map((l) => `<span class="l-${l}"${l === "en" ? "" : ` lang="${l}"`}>${C.byLine[l]({ by: opts.by })}</span>`).join("")}</p>`);

  o.push(`<div class="gx-note"><b>${T(C.noteTitle)}</b> ${T(C.note)}</div>`);
  if (!opts.help) o.push(howFold());
  o.push("</section>");
  return o.join("\n");
}

// ── Markdown and the export (English) ────────────────────────────────────────

const cellMd = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();

/** The block as Markdown. `M(...layers)` renders the host's layer markers. */
export function generatedMarkdown(g, { heading = "##", M = (...l) => l.map((x) => "`" + x + "`").join(" ") } = {}) {
  const o = [`${heading} How generated the text sounds ${M("derived", "judgement")}`, "", "Stock phrasing, marker words and generic passages. Not an authorship detector: who wrote the text cannot be shown from the text.", ""];
  const p = g.page;
  if (p?.score) o.push(`- **Pattern score** ${M("derived")}: ${p.score.value}/100, ${p.score.band} (${N.en(p.score.points)} points over ${N.en(p.words)} words = ${p.score.perThousand} per 1,000; PatternScope ${g.versions.detectors}/${g.versions.score}, language ${g.language}).`);
  else o.push(`- **Pattern score** ${M("derived")}: not computed (${g.reason}). ${C.reason[g.reason]?.en ?? ""}`);
  if (p) o.push(`- **Marker words** ${M("derived")}: ${p.markers.perThousand} per 1,000 words, ${p.markers.band} (${p.markers.hits} occurrences; not part of the score; thresholds not yet calibrated).`);
  if (g.judged) o.push(`- **Generic passages** ${M("judgement")}: ${g.generic.passages} of ${g.generic.of}, ${Math.round(g.generic.share * 100)}% of passage characters (the agent's swap test).`);
  else o.push(`- **Generic passages** ${M("judgement")}: not judged (no style.json).`);
  o.push(`- **Too short for a score** ${M("measured")}: ${g.short.length} of ${g.passages.length} passages under 60 words${g.short.length ? ` (${g.short.map((i) => `#${i}`).join(", ")})` : ""}.`);
  o.push("");
  if (g.disagreements.length) {
    o.push(`The script and the agent disagree on ${listEn(g.disagreements.map((d) => `#${d.passage}`))}: ${g.disagreements.map((d) => `#${d.passage} ${d.kind === "script_missed" ? "low score, generic text" : "high score, specific text"}`).join("; ")}. Shown, not averaged.`, "");
  }
  if (p?.score && g.families.length) {
    o.push(`### Where the score comes from ${M("derived")}`, "");
    for (const f of g.families) o.push(`- ${C.family[f.family].en}: ${f.findings} findings, ${f.points} points — ${f.chips.map((c) => `“${cellMd(c.text)}”${c.count > 1 ? ` ×${c.count}` : ""}`).join(", ")}${f.more ? `, +${f.more} more` : ""}`);
    o.push("");
  }
  if (p?.markers.terms.length) o.push(`Marker words (not in the score): ${p.markers.terms.map((t) => `${t.term}${t.count > 1 ? ` ×${t.count}` : ""}`).join(", ")}.`, "");
  const cols = ["#", "Heading", ...(p ? ["Score", "Markers /1k"] : []), ...(g.judged ? ["Agent", "Evidence"] : [])];
  o.push(`| ${cols.join(" | ")} |`, `|${cols.map(() => "---").join("|")}|`);
  for (const r of g.passages) {
    const row = [`#${r.index}`, cellMd(r.heading || "—")];
    if (p) row.push(r.score ? `${r.score.value} ${r.score.band}` : `— (${r.words} words)`, r.markers.perThousand === null ? "—" : String(Math.round(r.markers.perThousand)));
    if (g.judged) row.push(`${r.verdict}${r.disagree ? " ≠ script" : ""}`, `“${cellMd(r.evidence)}”${r.why ? ` — ${cellMd(r.why)}` : ""}`);
    o.push(`| ${row.join(" | ")} |`);
  }
  o.push("");
  return o;
}

/** The block for export.json: the same numbers, every passage, the versions that produced them. */
export function generatedExport(g) {
  return {
    versions: g.versions,
    analysed: g.analysed,
    reason: g.reason,
    language: g.language,
    patternScore: g.page?.score ? { value: g.page.score.value, band: g.page.score.band, points: g.page.score.points, perThousand: g.page.score.perThousand, words: g.page.words } : null,
    markerWords: g.page ? { hits: g.page.markers.hits, perThousand: g.page.markers.perThousand, band: g.page.markers.band, terms: g.page.markers.terms } : null,
    families: g.families,
    shortPassages: g.short,
    judgement: g.judged ? { agent: g.judgement.agent, model: g.judgement.model, generic: g.generic } : null,
    disagreements: g.disagreements,
    passages: g.passages.map((r) => ({ index: r.index, words: r.words, chars: r.chars, score: r.score, markers: r.markers ? { hits: r.markers.hits, perThousand: r.markers.perThousand } : null, verdict: r.verdict, evidence: r.evidence, why: r.why, disagree: r.disagree })),
  };
}
