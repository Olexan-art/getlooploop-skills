// The page's own vocabulary, in two tiers: the phrases it owns, then the words that carry
// its story. A port of the product's page-vocabulary step, function for function and
// constant for constant, so the skill's lists match the live tool's exactly. Pure: text in,
// counts out, no model.
//
// Why two tiers: counted together and ranked by raw count, single words win, and a page's
// top twenty can hold no phrase at all. People search in phrases and ask assistants in
// sentences; a single word says what a page is narrating, not what it can be found for.
//
// What it is not: every number here is what the page says. None of it is search demand.

import { detectStopLanguage, isStopword } from "./lens.mjs";

// ── constants ────────────────────────────────────────────────────────────────

/** How many keywords the flat list is given. */
export const KEYWORD_LIMIT = 20;
/** How many phrases are listed; past the fifteenth they are the tail, not the page. */
export const PHRASE_LIMIT = 15;
/** How many narrative words are listed: the second tier is a summary, not an index. */
export const NARRATIVE_LIMIT = 10;
/** The longest phrase counted. Past four words a run is a sentence, not a term. */
export const PHRASE_MAX_WORDS = 4;
/** A term reaching this share of the page's groups is describing the page. */
export const SCOPE_SPREAD = 0.6;
/** A word used once is not vocabulary. */
export const MIN_KEYWORD_COUNT = 2;
/** A phrase is written at least twice, and either in two passages or three times. */
export const PHRASE_MIN_COUNT = 2;
export const PHRASE_MIN_PASSAGES = 2;
export const PHRASE_SINGLE_PASSAGE_COUNT = 3;
/** How much of the rarest word's use the phrase has to account for. */
export const PHRASE_SHARE = 1 / 3;
/** A shorter phrase written under 1.25 times as often as a longer one holding it is folded in. */
export const SUBSUME_RATIO = 1.25;
/** A narrative word under a listed phrase stays only if its bare uses are twice the held ones. */
export const NARRATIVE_ALONE_RATIO = 2;
/** The shortest and longest exact carry taken for the chunker's own overlap (it carries ~200). */
export const OVERLAP_MIN_CHARS = 40;
export const OVERLAP_MAX_CHARS = 600;

/** Words that are in every group of every page and therefore name none of them. */
export const LABEL_STOP = new Set([
  "the", "and", "for", "with", "you", "your", "our", "can", "will", "are", "that",
  "this", "from", "have", "has", "not", "all", "any", "how", "what", "more",
  "one", "use", "using", "used", "get", "make", "also", "than", "then", "when",
]);

/**
 * Words that carry a sentence and no subject: they may sit inside a phrase, never start or
 * end one, and never stand in the narrative list. English, Ukrainian and Spanish only.
 */
export const GENERIC_WORDS = new Set([
  // English: reporting and reading verbs
  "see", "seen", "say", "says", "said", "read", "reads", "tell", "tells", "told",
  "show", "shows", "shown", "ask", "asks", "asked", "keep", "keeps", "kept",
  "take", "takes", "taken", "give", "gives", "given", "made", "makes", "let", "lets",
  "want", "wants", "know", "knows", "find", "finds", "found", "come", "comes", "goes",
  "put", "puts", "look", "looks", "like", "means", "mean", "going",
  // English: connectives, hedges, quantities
  "whether", "rather", "instead", "because", "cannot", "without", "within",
  "while", "though", "although", "since", "until", "upon", "unless", "already",
  "always", "never", "often", "still", "yet", "even", "ever", "much", "many", "less",
  "least", "enough", "quite", "really", "almost", "well", "now", "back", "out", "up",
  "down", "off", "around", "across", "along", "against", "among", "etc",
  "beside", "inside", "outside", "behind", "beyond", "far", "different", "main",
  // Citation residue
  "et", "al",
  "nothing", "something", "anything", "everything", "nobody", "somebody", "someone",
  "anyone", "everyone", "thing", "things", "way", "ways", "lot", "kind",
  "example", "examples", "based", "new", "first", "second", "last",
  "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  // Ukrainian
  "каже", "кажуть", "сказати", "показує", "показують", "бачити", "читати", "читає",
  "має", "мають", "можуть", "немає", "нічого", "ніхто", "ніщо", "щось", "хтось", "хто",
  "кого", "чого", "чим", "собі", "сам", "сама", "самі", "один", "одна", "одне",
  "одну", "одного", "одній", "два", "дві", "три", "чотири", "п’ять", "тож", "отже",
  "будь", "просто", "зараз", "тоді", "замість", "приклад", "наприклад", "поруч",
  "ніж", "дійсно", "справді", "завжди", "ніколи", "часто", "майже", "потім", "далі",
  "скільки", "наскільки", "всередині",
  // Ukrainian: declined possessives and determiners
  "вашого", "вашої", "вашій", "вашому", "вашою", "вашим", "ваших", "нашого", "нашої",
  "нашій", "нашому", "нашою", "нашим", "наших", "свого", "своєї", "своїй", "своєму",
  "своєю", "своїм", "своїх", "власний", "власна", "власне", "власні", "власного",
  "власної", "власній", "власною", "власним", "власних", "кожного", "кожної",
  "кожній", "кожному", "кожним", "жоден", "жодна", "жодне", "жодної", "жодного",
  "жодній", "жодних",
  // Spanish
  "dice", "dicen", "decir", "ver", "lee", "leer", "hace", "hacen", "hacer",
  "ejemplo", "ninguna", "ninguno", "nadie", "nada", "dos", "tres", "cuatro", "cinco",
  "vez", "veces", "junto", "existe", "bien", "sino", "luego", "ahí", "haz",
  // Spanish determiners the stop list does not carry
  "cuya", "cuyo", "cuyas", "cuyos", "ningún", "propia", "propio", "propias", "propios",
  "cualquier", "cualquiera",
]);

// ── reading the text ─────────────────────────────────────────────────────────

/** The page's language for stop words, decided once for all of its passages. */
export function pageStopLanguage(texts) {
  return detectStopLanguage(texts.join("\n"));
}

/** A word that can carry a keyword: not punctuation, not a stopword, has a letter. */
export function usableKeyword(token, language) {
  if (token.length < 2) return false;
  if (LABEL_STOP.has(token) || isStopword(token, language)) return false;
  return /\p{L}/u.test(token);
}

/**
 * Markup that survives extraction as words, removed by its shape: a TeX brace group that
 * opens on a backslash (and any stray `\command`), and short bracketed spans such as
 * `[ edit ]`, `[15]`, `[citation needed]`. Each becomes a full stop, ending any phrase.
 */
export function stripMarkup(text) {
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

/** The passages with the chunker's own overlap (an exact suffix-to-prefix carry) taken off. */
export function withoutOverlap(texts) {
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

/** The passages with every sentence the page has already said (verbatim) taken out. */
export function withoutRepeatedSentences(texts) {
  const seen = new Set();
  return texts.map((text) =>
    text
      .split(/(?<=[.!?…])\s+|\n+/u)
      .filter((sentence) => {
        const key = sentence.toLowerCase().replace(/\s+/g, " ").replace(/[\s.!?…:;,]+$/u, "").trim();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join("\n")
  );
}

/** English clitics after an apostrophe: the word is what stands before them. */
const CLITIC = /(\p{L})['’ʼ](?:s|t|re|ve|ll|d|m)(?![\p{L}\p{N}])/giu;
/** An apostrophe inside a word, as Ukrainian writes `п’ять`: part of the word. */
const INNER_APOSTROPHE = /(\p{L})['ʼ](?=\p{L})/gu;

/**
 * The content words of one passage, split wherever the phrase is broken: a stopword, a
 * comma or a full stop ends the run; only whitespace and hyphens join.
 */
export function contentRuns(text, language) {
  const runs = [];
  let run = [];
  const end = () => {
    if (run.length) runs.push(run);
    run = [];
  };

  const prepared = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(CLITIC, "$1")
    .replace(INNER_APOSTROPHE, "$1’");

  const parts = prepared.split(/((?:[^\p{L}\p{N}’]|’(?!\p{L})|(?<!\p{L})’)+)/u);
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

// ── counting ─────────────────────────────────────────────────────────────────

function tally(map, key, surface, passage, group, neighbours) {
  let entry = map.get(key);
  if (!entry) {
    entry = { count: 0, passages: new Set(), groups: new Set(), surfaces: new Map(), left: new Set(), right: new Set() };
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

/** The folded key when the page wrote it that way, else the page's most frequent spelling. */
function displayOf(key, surfaces) {
  if (surfaces.has(key)) return key;
  return [...surfaces.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? key;
}

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

const round = (value) => Math.round(value * 1000) / 1000;

/**
 * The page's vocabulary: { phrases, narrative }, each entry
 * { term, count, groups, spread, scope, passages, words }.
 * Phrases are 2–4-word n-grams inside one run, ranked by passages, count, length,
 * cohesion, then alphabetically. Narrative words are counted only where no listed
 * phrase spent them.
 */
export function pageVocabulary(texts, assignment, groupCount, language, limits = {}) {
  if (!texts.length) return { phrases: [], narrative: [] };

  const stopLanguage = language === undefined ? pageStopLanguage(texts) : language;
  const runsByPassage = withoutRepeatedSentences(withoutOverlap(texts).map(stripMarkup)).map((text) =>
    contentRuns(text, stopLanguage)
  );

  // Plurals folded into the singular, only when the singular is used on this page.
  const rawCounts = new Map();
  for (const runs of runsByPassage) {
    for (const run of runs) for (const token of run) rawCounts.set(token, (rawCounts.get(token) ?? 0) + 1);
  }
  const singularOf = new Map();
  for (const token of rawCounts.keys()) {
    if (!token.endsWith("s") || token.length < 4) continue;
    const singular = token.slice(0, -1);
    if (rawCounts.has(singular)) singularOf.set(token, singular);
  }
  const fold = (token) => singularOf.get(token) ?? token;

  const words = new Map();
  const grams = new Map();
  runsByPassage.forEach((runs, passage) => {
    const group = assignment[passage] ?? 0;
    for (const raw of runs) {
      const keys = raw.map(fold);
      keys.forEach((key) => tally(words, key, key, passage, group));
      for (let n = 2; n <= PHRASE_MAX_WORDS; n++) {
        for (let i = 0; i + n <= keys.length; i++) {
          const slice = keys.slice(i, i + n);
          // A stutter (`pdf pdf`) is layout, not a phrase.
          if (slice.some((word, j) => j > 0 && word === slice[j - 1])) continue;
          tally(grams, slice.join(" "), raw.slice(i, i + n).join(" "), passage, group, {
            left: keys[i - 1] ?? "",
            right: keys[i + n] ?? "",
          });
        }
      }
    }
  });

  // ── which n-grams are phrases ──
  const accepted = new Map();
  for (const [key, entry] of grams) {
    if (entry.count < PHRASE_MIN_COUNT) continue;
    if (entry.passages.size < PHRASE_MIN_PASSAGES && entry.count < PHRASE_SINGLE_PASSAGE_COUNT) continue;
    const parts = key.split(" ");
    if (GENERIC_WORDS.has(parts[0]) || GENERIC_WORDS.has(parts[parts.length - 1])) continue;
    const rarest = Math.min(...parts.map((word) => words.get(word)?.count ?? 0));
    if (!rarest || entry.count / rarest < PHRASE_SHARE) continue;
    // A window of a longer phrase: the same content word always beside it.
    const extendsSide = (side) => {
      if (side.size !== 1) return false;
      const [word] = side;
      return word !== "" && !GENERIC_WORDS.has(word);
    };
    if (extendsSide(entry.left) || extendsSide(entry.right)) continue;
    accepted.set(key, { tally: entry, words: parts });
  }

  // ── subsumption: a shorter phrase a longer one already says ──
  const kept = [...accepted.entries()].filter(([, shorter]) => {
    for (const [, longer] of accepted) {
      if (longer.words.length <= shorter.words.length) continue;
      if (!contains(longer.words, shorter.words)) continue;
      if (shorter.tally.count < SUBSUME_RATIO * longer.tally.count) return false;
    }
    return true;
  });

  const denominator = Math.max(1, groupCount);
  const termOf = (term, entry, n) => {
    const spread = round(entry.groups / denominator);
    return { term, count: entry.count, groups: entry.groups, spread, scope: spread >= SCOPE_SPREAD, passages: entry.passages, words: n };
  };

  // How tightly the words belong together; only a tie-break.
  const cohesionOf = (parts, count) =>
    (parts.length * count) / Math.max(1, parts.reduce((sum, word) => sum + (words.get(word)?.count ?? 0), 0));

  const ranked = kept
    .map(([key, { tally: entry, words: parts }]) => ({ key, parts, entry, cohesion: cohesionOf(parts, entry.count) }))
    .sort(
      (a, b) =>
        b.entry.passages.size - a.entry.passages.size ||
        b.entry.count - a.entry.count ||
        b.parts.length - a.parts.length ||
        b.cohesion - a.cohesion ||
        a.key.localeCompare(b.key)
    )
    .slice(0, limits.phrases ?? PHRASE_LIMIT);

  const phrases = ranked.map(({ key, parts, entry }) =>
    termOf(displayOf(key, entry.surfaces), { count: entry.count, passages: entry.passages.size, groups: entry.groups.size }, parts.length)
  );

  // ── narrative: what the listed phrases did not already spend ──
  const listed = new Map(ranked.map(({ key, parts }) => [key, parts.length]));
  const alone = new Map();
  const inside = new Map();
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

  const narrative = [...alone.entries()]
    .filter(([key, entry]) => {
      if (GENERIC_WORDS.has(key) || entry.count < MIN_KEYWORD_COUNT) return false;
      const held = inside.get(key) ?? 0;
      return held === 0 || entry.count >= NARRATIVE_ALONE_RATIO * held;
    })
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, limits.narrative ?? NARRATIVE_LIMIT)
    .map(([key, entry]) => termOf(key, { count: entry.count, passages: entry.passages.size, groups: entry.groups.size }, 1));

  return { phrases, narrative };
}

/** Phrases then narrative words, each as the plain keyword shape. */
export function flattenVocabulary(vocabulary) {
  return [...vocabulary.phrases, ...vocabulary.narrative].map(({ term, count, groups, spread, scope }) => ({
    term,
    count,
    groups,
    spread,
    scope,
  }));
}

/** The two tiers as one list, phrases first: the shape `keywords` has always had. */
export function pageKeywords(texts, assignment, groupCount, limit = KEYWORD_LIMIT, language) {
  const { phrases, narrative } = pageVocabulary(texts, assignment, groupCount, language, {
    narrative: Math.max(NARRATIVE_LIMIT, limit),
  });
  return flattenVocabulary({ phrases, narrative }).slice(0, limit);
}
