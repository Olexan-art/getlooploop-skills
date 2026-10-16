// Automatic checks over a reading: deterministic, no model. Each finding is a machine code, a
// severity, the passages it rests on and the evidence; the sentence a person reads is the
// report's job (codes on the wire, copy in the UI). Every threshold is a named constant with
// the reason for its value.

import { isStopword } from "./lens.mjs";
import { charsPastCap } from "./losses.mjs";

// ── thresholds ───────────────────────────────────────────────────────────────

// Three answers in a row is a FAQ's shape; two can be prose ("Yes, and no.").
export const FAQ_MIN_ANSWER_OPENERS = 3;
// Fewer question marks than half the answers means most questions did not survive extraction.
export const FAQ_MAX_QUESTION_RATIO = 0.5;
// Over 30% of the text under one heading is more than one topic on any page with four passages.
export const DOMINANT_HEADING_SHARE = 0.3;
// Below four passages a page has too little structure for one heading's share to mean anything.
export const DOMINANT_MIN_PASSAGES = 4;
// Four short lines in a row is a menu, a tag list or a table of labels, not a sentence.
export const NAV_MIN_LINES = 4;
// One or two words is a link label; three already starts to be a phrase.
export const NAV_MAX_WORDS = 2;
// A link label rarely runs past 30 characters; longer is a sentence fragment.
export const NAV_MAX_LINE_CHARS = 30;
// Under 150 characters a section is a sentence or two: too little to answer anything alone.
export const THIN_SECTION_CHARS = 150;
// Four words is the shortest run that reads as a claim rather than a common phrase.
export const REPEAT_NGRAM = 4;
// At least two content words, so "one of the most" is never a claim.
export const REPEAT_MIN_CONTENT_WORDS = 2;
// Half the groups: the claim is everywhere, not in one section plus its neighbour.
export const REPEAT_GROUP_SHARE = 0.5;
// With fewer than three groups "half the groups" is one or two, which is just adjacency.
export const REPEAT_MIN_GROUPS = 3;
// The longest a passage's opening overlap can be (the chunker overlaps ~200 characters).
export const OVERLAP_SEARCH_CHARS = 400;
// Google shows about 155-160 characters of a description; under 70 says almost nothing.
export const META_DESCRIPTION_MIN = 70;
export const META_DESCRIPTION_MAX = 160;
// Half as many words again after JavaScript, and at least 150 of them, is content a plain fetch misses.
export const JS_GAIN_RATIO = 1.5;
export const JS_GAIN_MIN_WORDS = 150;
// How many samples a finding carries as evidence.
export const MAX_SAMPLES = 6;

export const SEVERITY_RANK = { high: 3, medium: 2, low: 1, info: 0 };

/** Every code the checks can emit, in the order the report lists ties. */
export const CHECK_CODES = [
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
  "robots_not_checked",
];

const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n = 90) => {
  const t = oneLine(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ── short-line runs (computed in step 1, from the extracted text before chunking) ──

function isShortLine(line) {
  const text = line.trim();
  if (!text || text.length > NAV_MAX_LINE_CHARS) return false;
  if (!/\p{L}/u.test(text)) return false;
  return text.split(/\s+/).length <= NAV_MAX_WORDS;
}

/** Runs of NAV_MIN_LINES or more consecutive one-or-two-word lines, with the passages holding them. */
export function shortLineRuns(bodyText, passages) {
  const runs = [];
  let run = [];
  const flush = () => {
    if (run.length >= NAV_MIN_LINES) runs.push(run);
    run = [];
  };
  for (const line of String(bodyText || "").split("\n")) {
    // A blank line between two link labels is layout, not a sentence: it does not end the run.
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
      if (text.includes(joined) || (lines.length && text.includes(first) && text.includes(lines[lines.length - 1]) && text.includes(lines[1]))) holding.push(passages[index].index);
    });
    return { lines: lines.slice(0, 12), count: lines.length, passages: holding };
  });
}

// ── content checks ───────────────────────────────────────────────────────────

const ANSWER_OPENER =
  /^(?:yes|no|yep|nope|yeah|absolutely|correct|definitely|sure|of course|not really|not quite|так|ні|sí|si|oui|non|tak|nie|ja|nein)(?:[.,!:;]|\s+[—–-])/iu;

function sentences(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim().replace(/^[«"“'(\[]+/, ""))
    .filter(Boolean);
}

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

function isIntro(p, page) {
  return p.index === 0 && (p.rawHeading ?? p.heading) && oneLine(p.rawHeading ?? p.heading) === oneLine(page.title || page.h1?.[0] || "");
}

function dominantHeading(passages, page) {
  if (passages.length < DOMINANT_MIN_PASSAGES) return [];
  const total = passages.reduce((sum, p) => sum + p.charCount, 0);
  if (!total) return [];
  const byHeading = new Map();
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
        evidence: { heading: entry.heading, share: Math.round(share * 1000) / 1000, chars: entry.chars },
      });
    }
  }
  return out;
}

function midSentence(passages) {
  const hits = passages
    .filter((p) => p.index > 0 && /^(?:\p{Ll}|[,;:)\]}»”’…])/u.test(p.text.trim()))
    .map((p) => ({ passage: p.index, text: clip(p.text, 80) }));
  if (!hits.length) return [];
  return [{ code: "mid_sentence_start", severity: "medium", passages: hits.map((h) => h.passage), evidence: { samples: hits.slice(0, MAX_SAMPLES), count: hits.length } }];
}

function navInContent(reading) {
  const runs = reading.layout?.shortLineRuns ?? shortLineRuns(reading.passages.map((p) => p.text).join("\n"), reading.passages);
  const inside = runs.filter((run) => run.passages.length);
  if (!inside.length) return [];
  const passages = [...new Set(inside.flatMap((run) => run.passages))].sort((a, b) => a - b);
  return [{
    code: "nav_in_content",
    severity: "medium",
    passages,
    evidence: { runs: inside.length, samples: inside.slice(0, MAX_SAMPLES).map((run) => ({ passage: run.passages[0], lines: run.lines.slice(0, 8), count: run.count })) },
  }];
}

function thinSections(passages, page) {
  const sections = [];
  for (const p of passages) {
    // A see-also list is short by nature; it is side-path content, not a thin answer.
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
    evidence: { samples: thin.slice(0, MAX_SAMPLES).map((s) => ({ passage: s.passages[0], heading: s.heading, chars: s.chars })), count: thin.length },
  }];
}

const CODE_LIKE = /[<>{}();=]/;
const TEASER = /(\S[^\n]{0,70}?)(…|\.\.\.)(?=[ \t]*(?:\n|$)|\s+\p{Lu})/gu;

function truncatedTeasers(passages) {
  const hits = [];
  for (const p of passages) {
    for (const match of p.text.matchAll(TEASER)) {
      // "<!doctype html>…" or "body { ..." is a code sample eliding itself, not a teaser.
      if (CODE_LIKE.test(match[1])) continue;
      hits.push({ passage: p.index, text: clip(`${match[1]}${match[2]}`, 80) });
    }
  }
  if (!hits.length) return [];
  const passageIds = [...new Set(hits.map((h) => h.passage))];
  return [{ code: "truncated_teaser", severity: hits.length >= 3 ? "medium" : "low", passages: passageIds, evidence: { count: hits.length, samples: hits.slice(0, MAX_SAMPLES) } }];
}

/** A passage's text without the opening it shares with the passage before it (the chunker's overlap). */
export function withoutOverlap(previous, current) {
  if (!previous) return current;
  const probe = current.slice(0, 40);
  if (probe.length < 20) return current;
  const at = previous.lastIndexOf(probe);
  if (at < 0) return current;
  const overlap = previous.length - at;
  return overlap <= OVERLAP_SEARCH_CHARS ? current.slice(overlap) : current;
}

// A token that is code or data rather than prose: a header name (Content-Type, If-None-Match),
// anything with markup or assignment characters, or a number.
const CODE_TOKEN = /^[A-Z][A-Za-z]*(?:-[A-Z][A-Za-z]*)+:?$|[:/=<>{}()"#@\\]|\d/;
const EDGE_PUNCTUATION = /^[«"“‘'(\[]+|[.,;:!?)\]»”’']+$/g;
// URL fragments are stop words for keywords but say nothing about a sentence's shape.
const NOT_FUNCTION_WORDS = new Set(["www", "http", "https", "com", "org", "net", "html", "php", "asp"]);

/** Runs of prose words; code tokens end a run, so n-grams never span a code sample. */
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

function repeatedClaims(passages, assignment, groupCount) {
  if (!assignment || groupCount < REPEAT_MIN_GROUPS) return [];
  const need = Math.max(2, Math.ceil(groupCount * REPEAT_GROUP_SHARE));
  const where = new Map(); // ngram → { groups:Set, passages:Set }
  passages.forEach((p, i) => {
    if (i === 0) return; // the intro repeats the title and description by construction
    const text = withoutOverlap(passages[i - 1]?.text, p.text);
    const seen = new Set();
    for (const tokens of proseRuns(text))
    for (let k = 0; k + REPEAT_NGRAM <= tokens.length; k++) {
      const gram = tokens.slice(k, k + REPEAT_NGRAM);
      const content = gram.filter((t) => t.length >= 3 && !isStopword(t)).length;
      if (content < REPEAT_MIN_CONTENT_WORDS) continue;
      // A claim is a phrase with grammar in it; four nouns in a row is a topic's vocabulary.
      if (!gram.some((t) => isStopword(t) && !NOT_FUNCTION_WORDS.has(t))) continue;
      const key = gram.join(" ");
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = where.get(key) ?? { groups: new Set(), passages: new Set() };
      entry.groups.add(assignment[i]);
      entry.passages.add(p.index);
      where.set(key, entry);
    }
  });
  const candidates = [...where.entries()]
    .filter(([, entry]) => entry.groups.size >= need)
    .sort((a, b) => b[1].groups.size - a[1].groups.size || b[1].passages.size - a[1].passages.size || a[0].localeCompare(b[0]));
  if (!candidates.length) return [];
  const picked = [];
  for (const [key, entry] of candidates) {
    const tokens = key.split(" ");
    const tri = (list) => list.slice(0, -2).map((_, k) => list.slice(k, k + 3).join(" "));
    const clash = picked.some((p) => tri(p.phrase.split(" ")).some((t) => tri(tokens).includes(t)));
    if (clash) continue;
    picked.push({ phrase: key, groups: entry.groups.size, passages: [...entry.passages].sort((a, b) => a - b) });
    if (picked.length >= MAX_SAMPLES) break;
  }
  const ids = [...new Set(picked.flatMap((p) => p.passages))].sort((a, b) => a - b);
  return [{ code: "repeated_claim", severity: "low", passages: ids, evidence: { groupCount, samples: picked } }];
}

// ── technical checks ─────────────────────────────────────────────────────────

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
  // The meta description is the third line of the chunker's intro passage, so its length is
  // part of passage 0, not only a search snippet.
  if (!metaDescription.present) out.push({ code: "meta_description_missing", severity: "low", passages: [0], evidence: {} });
  else if (metaDescription.length < META_DESCRIPTION_MIN) out.push({ code: "meta_description_short", severity: "low", passages: [0], evidence: { length: metaDescription.length } });
  else if (metaDescription.length > META_DESCRIPTION_MAX) out.push({ code: "meta_description_long", severity: "low", passages: [0], evidence: { length: metaDescription.length } });
  return out;
}

function pageChecks(reading) {
  const { page } = reading;
  const out = [];
  if (page.noindex) out.push({ code: "noindex", severity: "high", passages: [], evidence: {} });
  // 2.102: the honest count (kept text after the last passage) when the reading measured it; a
  // reading from 2.101 or earlier falls back to its charsUnread, which can undercount to 0.
  const pastCap = charsPastCap(reading);
  if (page.capReached && pastCap > 0) {
    out.push({ code: "cap_overflow", severity: "high", passages: [reading.passages.length - 1], evidence: { charsPastCap: pastCap, charsUnread: page.charsUnread, cap: page.chunkCap, last: reading.passages.length - 1 } });
  }
  const r = reading.render;
  if (r?.ok && r.wordCount >= page.wordCount * JS_GAIN_RATIO && r.wordCount - page.wordCount >= JS_GAIN_MIN_WORDS) {
    out.push({ code: "js_dependent", severity: "high", passages: [], evidence: { withoutJs: page.wordCount, withJs: r.wordCount, passagesWithoutJs: page.chunksIndexed, passagesWithJs: r.passages } });
  }
  return out;
}

/**
 * Every check over one reading. `assignment[i]` is passage i's group (or null when there is no
 * grouping yet). Returns findings ranked by severity, then by the order of CHECK_CODES.
 */
export function runChecks(reading, assignment = null, groupCount = 0) {
  const passages = reading.passages || [];
  const findings = [
    ...robotsChecks(reading.robots),
    ...pageChecks(reading),
    ...lostFaq(passages),
    ...dominantHeading(passages, reading.page),
    ...midSentence(passages),
    ...navInContent(reading),
    ...thinSections(passages, reading.page),
    ...truncatedTeasers(passages),
    ...repeatedClaims(passages, assignment, groupCount),
    ...technicalChecks(reading.technical),
  ];
  return findings.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || CHECK_CODES.indexOf(a.code) - CHECK_CODES.indexOf(b.code)
  );
}
