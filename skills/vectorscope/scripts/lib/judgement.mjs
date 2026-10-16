// Validation for the files the agent writes in the judgement steps: groups.json, topics.json,
// facts.json, plan.json, queries.json. Each validator returns the normalised value or throws
// an Error whose message says what to fix. Page numbers are 1-based (as in the manifest);
// passage indexes are 0-based (as in the reading).

import { CHECK_CODES } from "./checks.mjs";

export const MAX_GROUPS = 6;
export const MAX_LABEL_CHARS = 80;
export const MAX_NOTE_CHARS = 240;
/** "agent" and "model" in groups.json: who did the reading, as the agent states it about itself. */
export const MAX_IDENTITY_CHARS = 60;
export const MAX_TOPICS = 12;
export const MAX_QUERIES = 10;
export const MIN_QUERIES = 5;
export const MAX_QUOTE_CHARS = 400;
export const VERDICTS = ["complete", "partial", "missing"];
export const QUERY_SOURCES = ["user", "generated"];

const isInt = (v) => Number.isInteger(v);
const str = (v) => typeof v === "string" && v.trim().length > 0;

/** Text compared for a verbatim quote: whitespace collapsed, quotes, dashes and case folded. */
export function foldForQuote(text) {
  return String(text ?? "")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″«»]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function quoteIn(quote, text) {
  const q = foldForQuote(quote);
  return q.length > 0 && foldForQuote(text).includes(q);
}

// ── groups.json ──────────────────────────────────────────────────────────────

/**
 * v1: {"groups": [[0,1],[2]], "duplicates": {"7": 2}}
 * v2: {"groups": [{"members": [0,1], "label": "…", "note": "…", "topic": "t1"}, …], "duplicates": {}}
 * The two shapes can be mixed. Returns { groups: number[][], meta: [{label, note, topic}], duplicates: Map, reordered }.
 */
export function validateGrouping(input, passageCount, { topicIds = null, requireTopics = false } = {}) {
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
    const label = group.label === undefined || group.label === null ? null : String(group.label).replace(/\s+/g, " ").trim();
    if (label !== null && (!label || label.length > MAX_LABEL_CHARS)) throw new Error(`group ${g}: "label" must be 1–${MAX_LABEL_CHARS} characters.`);
    const note = group.note === undefined || group.note === null ? null : String(group.note).replace(/\s+/g, " ").trim();
    if (note !== null && note.length > MAX_NOTE_CHARS) throw new Error(`group ${g}: "note" is over ${MAX_NOTE_CHARS} characters.`);
    const topic = group.topic === undefined || group.topic === null ? null : String(group.topic);
    if (topic !== null && topicIds && !topicIds.has(topic)) throw new Error(`group ${g}: topic ${JSON.stringify(topic)} is not an id in topics.json.`);
    return { members: group.members, label, note: note || null, topic };
  });
  if (requireTopics) {
    entries.forEach((entry, g) => {
      if (!entry.topic) throw new Error(`group ${g} has no "topic": in compare mode every group names a topic id from topics.json.`);
    });
  }

  const seen = new Map();
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

  // Members ascending; groups numbered by their earliest passage.
  const sorted = entries.map((entry) => ({ ...entry, members: entry.members.slice().sort((a, b) => a - b) }));
  const ordered = sorted.slice().sort((a, b) => a.members[0] - b.members[0]);
  const reordered =
    ordered.some((entry, i) => entry !== sorted[i]) || entries.some((entry, i) => entry.members.some((value, j) => value !== sorted[i].members[j]));

  const duplicates = new Map();
  const rawDup = input.duplicates ?? {};
  if (typeof rawDup !== "object" || Array.isArray(rawDup)) throw new Error('"duplicates" must be an object like {"7": 2}.');
  for (const [key, value] of Object.entries(rawDup)) {
    const later = Number(key);
    if (!isInt(later) || later < 0 || later >= passageCount) throw new Error(`duplicates key ${JSON.stringify(key)} is not a passage index.`);
    if (!isInt(value) || value < 0 || value >= passageCount) throw new Error(`duplicates[${key}] = ${JSON.stringify(value)} is not a passage index.`);
    if (value >= later) throw new Error(`duplicates[${key}] = ${value}: a duplicate points back to an EARLIER passage.`);
    // neighbours overlap by design, so an adjacent pair is never a duplicate.
    if (later - value <= 1) throw new Error(`duplicates[${key}] = ${value}: adjacent passages share the chunker's overlap; only non-adjacent repeats count.`);
    duplicates.set(later, value);
  }
  return {
    groups: ordered.map((entry) => entry.members),
    meta: ordered.map(({ label, note, topic }) => ({ label, note, topic })),
    duplicates,
    reordered,
    judgement: validateIdentity(input),
  };
}

/**
 * The optional top-level "agent" and "model" of groups.json: what the agent that did the reading
 * says about itself ("Claude Code", "Claude Opus 5.5"). Absent stays null, and the report then says
 * the model was not stated; nothing is ever inferred.
 */
export function validateIdentity(input) {
  const one = (key) => {
    const value = input[key];
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") throw new Error(`"${key}" must be a string, e.g. ${key === "agent" ? '"Claude Code"' : '"Claude Opus 5.5"'}, or left out.`);
    const text = value.replace(/\s+/g, " ").trim();
    if (!text || text.length > MAX_IDENTITY_CHARS) throw new Error(`"${key}" must be 1–${MAX_IDENTITY_CHARS} characters, or left out.`);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f<>]/.test(text)) throw new Error(`"${key}" holds control characters or angle brackets; give a plain name.`);
    return text;
  };
  return { agent: one("agent"), model: one("model") };
}

// ── topics.json ──────────────────────────────────────────────────────────────

/** {"topics": [{"id": "freshness", "name": "Freshness and max-age"}]} → [{id, name}] */
export function validateTopics(input) {
  if (!input || !Array.isArray(input.topics) || !input.topics.length) throw new Error('topics.json must be {"topics": [{"id": "…", "name": "…"}, …]} with at least one topic.');
  if (input.topics.length > MAX_TOPICS) throw new Error(`${input.topics.length} topics; keep the shared dictionary to ${MAX_TOPICS} or fewer by merging the closest.`);
  const ids = new Set();
  return input.topics.map((topic, i) => {
    if (!topic || !str(topic.id) || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(topic.id)) throw new Error(`topics[${i}].id must be a short lowercase slug (a-z, 0-9, - or _).`);
    if (ids.has(topic.id)) throw new Error(`topic id ${topic.id} appears twice.`);
    ids.add(topic.id);
    if (!str(topic.name) || topic.name.length > MAX_LABEL_CHARS) throw new Error(`topics[${i}].name must be 1–${MAX_LABEL_CHARS} characters.`);
    return { id: topic.id, name: topic.name.trim() };
  });
}

// ── shared: page/passage references ──────────────────────────────────────────

/** `pages` is [{ n, passages: [{index, text}] }]. */
function pageByNumber(pages, n, where) {
  const page = pages.find((p) => p.n === Number(n));
  if (!page) throw new Error(`${where}: page ${JSON.stringify(n)} is not in this run (pages ${pages.map((p) => p.n).join(", ")}).`);
  return page;
}

function checkPassages(page, list, where) {
  if (!Array.isArray(list)) throw new Error(`${where}: passages must be an array of passage indexes.`);
  for (const value of list) {
    if (!isInt(value) || value < 0 || value >= page.passages.length) throw new Error(`${where}: ${JSON.stringify(value)} is not a passage index of page ${page.n} (0–${page.passages.length - 1}).`);
  }
  return list.slice();
}

// ── facts.json ───────────────────────────────────────────────────────────────

/**
 * {"facts": [{"id": "f1", "fact": "…", "topic": "freshness", "pages": {"1": [4], "2": [2]}}]}
 * Single mode may write "passages": [4] instead of "pages". Returns [{id, fact, topic, pages: {n: [idx]}}].
 */
export function validateFacts(input, pages, topicIds = null) {
  if (!input || !Array.isArray(input.facts)) throw new Error('facts.json must be {"facts": [{"id": "f1", "fact": "…", "pages": {"1": [3]}}]}.');
  const ids = new Set();
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

// ── plan.json ────────────────────────────────────────────────────────────────

/**
 * {"items": [{"priority": 1, "page": 1, "passages": [3], "check": "lost_faq_questions",
 *   "problem": "…", "fix": "…", "before": "verbatim text from the passage", "after": "the rewrite"}]}
 * `firedByPage` maps page n → Set of codes the checks found, to warn on a code that did not fire.
 * Returns { items (sorted by priority), warnings }.
 */
export function validatePlan(input, pages, firedByPage = new Map()) {
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
    if (check && !(firedByPage.get(page.n)?.has(check))) warnings.push(`${where}: check ${check} did not fire on page ${page.n}; kept, but say why it applies.`);
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
      after: hasAfter ? item.after.trim() : null,
    };
  });
  items.sort((a, b) => a.priority - b.priority);
  return { items, warnings };
}

// ── queries.json ─────────────────────────────────────────────────────────────

/**
 * {"queries": [{"id": "q1", "query": "…", "source": "generated",
 *   "results": {"1": {"passage": 4, "verdict": "complete", "citable": true, "quote": "…"}}}]}
 * Single mode may write "result": {...} for page 1. Every page in the run needs a result.
 * Returns { queries, warnings }.
 */
export function validateQueries(input, pages) {
  if (!input || !Array.isArray(input.queries) || !input.queries.length) throw new Error('queries.json must be {"queries": [{"query": "…", "source": "generated", "results": {"1": {…}}}]}.');
  if (input.queries.length > MAX_QUERIES) throw new Error(`${input.queries.length} queries; keep it to ${MAX_QUERIES} typical ones.`);
  const warnings = [];
  if (input.queries.length < MIN_QUERIES) warnings.push(`${input.queries.length} queries; ${MIN_QUERIES}–${MAX_QUERIES} give a fairer picture.`);
  const ids = new Set();
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

const VERDICT_RANK = { complete: 2, partial: 1, missing: 0 };

/** Who answers a query best: verdict, then citable. Returns { winners: [n], tie: bool } or winners [] when nobody answers. */
export function queryWinner(query) {
  const scored = Object.entries(query.results).map(([n, r]) => ({ n: Number(n), score: VERDICT_RANK[r.verdict] * 2 + (r.citable ? 1 : 0) }));
  const best = Math.max(...scored.map((s) => s.score));
  if (best <= 0) return { winners: [], tie: false };
  const winners = scored.filter((s) => s.score === best).map((s) => s.n);
  return { winners, tie: winners.length > 1 };
}
