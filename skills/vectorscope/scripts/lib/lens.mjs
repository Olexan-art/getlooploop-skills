// The deterministic half of the Vectorscope read-out: side-path roles, group labels, page keywords.
// None of this needs vectors; the grouping it is applied to is supplied by the caller.

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
  // Ukrainian function words
  "і", "в", "у", "на", "з", "та", "що", "як", "для", "про", "це", "не", "але", "чи", "до",
]);

export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/[^\p{L}\p{N}\s._/-]+/gu, " ")
    .split(/[\s/_.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t));
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

const LABEL_STOP = new Set([
  "the", "and", "for", "with", "you", "your", "our", "can", "will", "are", "that",
  "this", "from", "have", "has", "not", "all", "any", "how", "what", "more",
  "one", "use", "using", "used", "get", "make", "also", "than", "then", "when",
]);

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
export function labelGroup(groupTexts, otherTexts, heading) {
  const clean = (heading || "").trim();
  if (clean && clean.length <= 80) return clean;

  const inside = new Map();
  for (const text of groupTexts) {
    for (const token of new Set(tokenize(text))) {
      if (!usableLabelTerm(token)) continue;
      inside.set(token, (inside.get(token) || 0) + 1);
    }
  }
  if (!inside.size) return UNTITLED_LABEL;

  const outside = new Map();
  for (const text of otherTexts) {
    for (const token of new Set(tokenize(text))) {
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

// , 788, 797, 803, 816.
const KEYWORD_LIMIT = 20;
const SCOPE_SPREAD = 0.6;
const MIN_KEYWORD_COUNT = 2;
const MIN_PHRASE_COUNT = 3;
const PHRASE_SHARE = 0.5;

function usableKeyword(token) {
  if (token.length < 2) return false;
  if (LABEL_STOP.has(token) || STOP.has(token)) return false;
  return /\p{L}/u.test(token);
}

// runs of directly adjacent content words.
function contentRuns(text) {
  const runs = [];
  let run = [];
  const end = () => {
    if (run.length) runs.push(run);
    run = [];
  };

  const parts = text.toLowerCase().replace(/https?:\/\/\S+/g, " ").split(/([^\p{L}\p{N}]+)/u);
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      if (!/^[\s-]+$/.test(part)) end();
      return;
    }
    if (!part) return;
    if (!usableKeyword(part) || /^\d+$/.test(part)) {
      end();
      return;
    }
    run.push(part);
  });
  end();
  return runs;
}

function pairsOf(run) {
  const out = [];
  for (let i = 0; i + 1 < run.length; i++) out.push(`${run[i]} ${run[i + 1]}`);
  return out;
}

/**
 * The page's vocabulary: one- and two-word terms, counted by occurrence, with how many groups each reaches.
 * `assignment[i]` is the group id of passage i.
 */
export function pageKeywords(texts, assignment, groupCount, limit = KEYWORD_LIMIT) {
  if (!texts.length) return [];

  const runsByChunk = texts.map((text) => contentRuns(text));

  // Plurals folded into the singular, only when the singular is used on this page.
  const rawCounts = new Map();
  for (const runs of runsByChunk) {
    for (const run of runs) for (const token of run) rawCounts.set(token, (rawCounts.get(token) ?? 0) + 1);
  }
  const singularOf = new Map();
  for (const token of rawCounts.keys()) {
    if (!token.endsWith("s") || token.length < 4) continue;
    const singular = token.slice(0, -1);
    if (rawCounts.has(singular)) singularOf.set(token, singular);
  }
  const fold = (token) => singularOf.get(token) ?? token;
  const folded = runsByChunk.map((runs) => runs.map((run) => run.map(fold)));

  // Which pairs are phrases: said at least 3 times, and at least half of the rarer word's uses.
  const wordTotals = new Map();
  const pairTotals = new Map();
  for (const runs of folded) {
    for (const run of runs) {
      for (const token of run) wordTotals.set(token, (wordTotals.get(token) ?? 0) + 1);
      for (const pair of pairsOf(run)) pairTotals.set(pair, (pairTotals.get(pair) ?? 0) + 1);
    }
  }
  const phrases = new Map();
  for (const [pair, total] of pairTotals) {
    if (total < MIN_PHRASE_COUNT) continue;
    const [a, b] = pair.split(" ");
    const rarer = Math.min(wordTotals.get(a) ?? 0, wordTotals.get(b) ?? 0);
    if (rarer && total / rarer >= PHRASE_SHARE) phrases.set(pair, total);
  }

  // Spend each occurrence once, left to right; where two phrases overlap the stronger wins.
  const counts = new Map();
  const groupsSeen = new Map();
  const record = (term, group) => {
    counts.set(term, (counts.get(term) ?? 0) + 1);
    const set = groupsSeen.get(term) ?? new Set();
    set.add(group);
    groupsSeen.set(term, set);
  };

  folded.forEach((runs, index) => {
    const group = assignment[index] ?? 0;
    for (const run of runs) {
      for (let i = 0; i < run.length; ) {
        const here = i + 1 < run.length ? phrases.get(`${run[i]} ${run[i + 1]}`) ?? 0 : 0;
        const next = i + 2 < run.length ? phrases.get(`${run[i + 1]} ${run[i + 2]}`) ?? 0 : 0;
        if (here && here >= next) {
          record(`${run[i]} ${run[i + 1]}`, group);
          i += 2;
        } else {
          record(run[i], group);
          i += 1;
        }
      }
    }
  });

  const denominator = Math.max(1, groupCount);
  return [...counts.entries()]
    .map(([term, count]) => {
      const groups = groupsSeen.get(term)?.size ?? 0;
      const spread = round(groups / denominator);
      return { term, count, groups, spread, scope: spread >= SCOPE_SPREAD };
    })
    .filter((entry) => entry.count >= MIN_KEYWORD_COUNT)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export const PREVIEW_CHARS = 240;
