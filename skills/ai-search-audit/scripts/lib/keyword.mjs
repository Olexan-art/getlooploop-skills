// The keyword lens: what the page does with one target phrase, counted rather than judged. A port
// of the GetLoopLoop keyword lens's model-free part: the phrase and its written variants, where they
// stand (title, h1, description), how far they reach across the page's sections, how much of the
// text never mentions them, and a promise of a figure that states none. No embeddings: the
// page's h2 sections are the groups, so "confined to one group" means one h2 section.
//
// The keyword is the one the user gave (--keyword), else the page's own h1 with the site's name,
// a trailing year, a sales tail and stop words at the edges trimmed. The report says which.

export const MAX_KEYWORD_LENGTH = 80;
export const MIN_KEYWORD_LENGTH = 2;
export const MAX_VARIANTS = 10;
/** Share of the passage text that must mention the keyword before the page reads as being about it. */
export const OFF_KEYWORD_FLOOR = 0.5;
/** Spread at or below which the keyword belongs to one section, checked on pages with 3+ sections. */
export const SPREAD_FLOOR = 1 / 3;
export const MIN_GROUPS_FOR_SPREAD = 3;
export const KEYWORD_MAX_WORDS = 5;

export const normaliseKeyword = (raw) => String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_KEYWORD_LENGTH);
export const isUsableKeyword = (k) => k.length >= MIN_KEYWORD_LENGTH && /[\p{L}\p{N}]/u.test(k);

const EDGE_STOP = new Set(
  ("a an the and or but of for to in on at by with from as is are was were be your you our we it its their this that these those how what when where which who why all any more most " +
    "other than then here there up down out off just also very only so such too now vs via").split(" "),
);
const TRAILING_JOIN = new Set("with by for from using via in on at to and or of &".split(" "));
const CODE_TOKEN = /^(?=[^\s]*[A-Za-z])(?=[^\s]*\d)[A-Za-z0-9.\-/]+$/;
const squashWord = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

function brandName(siteUrl) {
  if (!siteUrl) return "";
  let host = "";
  try {
    host = new URL(siteUrl).hostname;
  } catch {
    host = String(siteUrl).replace(/^https?:\/\//, "").split("/")[0];
  }
  return squashWord(host.replace(/^www\./, "").split(".")[0]);
}

function dropBrand(tokens, brand) {
  if (brand.length < 3) return tokens;
  const runs = [[]];
  for (let i = 0; i < tokens.length; ) {
    let matched = 0;
    for (let span = Math.min(3, tokens.length - i); span >= 1; span -= 1) {
      if (tokens.slice(i, i + span).map(squashWord).join("") === brand) {
        matched = span;
        break;
      }
    }
    if (matched) {
      runs.push([]);
      i += matched;
      continue;
    }
    runs[runs.length - 1].push(tokens[i]);
    i += 1;
  }
  const best = runs.reduce((a, b) => (b.length > a.length ? b : a), []);
  return best.length ? best : tokens;
}

function capWords(tokens) {
  if (tokens.length <= KEYWORD_MAX_WORDS) return tokens;
  const seam = (w) => EDGE_STOP.has(w.toLowerCase()) || TRAILING_JOIN.has(w.toLowerCase());
  let cut = KEYWORD_MAX_WORDS;
  for (let i = KEYWORD_MAX_WORDS - 1; i >= 2; i -= 1) {
    if (seam(tokens[i])) {
      cut = i;
      break;
    }
  }
  let kept = tokens.slice(0, cut);
  const next = tokens[cut];
  if (next && /^\d[\d.\-]*$/.test(next) && CODE_TOKEN.test(kept[kept.length - 1] || "")) kept = tokens.slice(0, cut + 1);
  while (kept.length && seam(kept[kept.length - 1])) kept.pop();
  return kept.length ? kept : tokens.slice(0, KEYWORD_MAX_WORDS);
}

/** The page's own subject from its h1: the site's signature, a trailing year, a sales tail, the brand and edge stop words trimmed; at most five words. */
export function keywordFromHeading(heading, siteUrl) {
  let value = String(heading ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  const signed = value.match(/^(.{8,}?)\s*[|·–—]\s*([^|·–—]{1,30})$/);
  if (signed && !/[.!?]/.test(signed[2])) value = signed[1].trim();
  const offered = value.match(/^(.{8,}?)\s*:\s*(.{3,60})$/);
  if (offered && /\b(fill|sign|edit|download|print|get|create|make|free|online|template|pdf|form)\b/i.test(offered[2])) value = offered[1].trim();
  value = value.replace(/\s+(?:19|20)\d{2}$/, "").trim();
  let tokens = value
    .split(/\s[|·–—]\s/)
    .map((part) => part.trim().split(" ").filter(Boolean))
    .reduce((a, b) => (b.length > a.length ? b : a), []);
  const brand = brandName(siteUrl);
  if (brand) tokens = dropBrand(tokens, brand);
  // This skill's addition: a comma, colon or semicolon inside the first five words ends the
  // subject ("Semantic chunking, made visible: see how…" is about semantic chunking). Without it
  // the five-word cap cuts mid-clause and the keyword is a phrase nobody would type.
  const clause = tokens.findIndex((t, i) => i >= 1 && i < KEYWORD_MAX_WORDS && /[,:;]$/.test(t));
  if (clause >= 1) tokens = [...tokens.slice(0, clause), tokens[clause].replace(/[,:;]+$/, "")];
  while (tokens.length && TRAILING_JOIN.has(tokens[tokens.length - 1].toLowerCase())) tokens.pop();
  while (tokens.length && EDGE_STOP.has(tokens[0].toLowerCase())) tokens.shift();
  while (tokens.length && EDGE_STOP.has(tokens[tokens.length - 1].toLowerCase())) tokens.pop();
  return normaliseKeyword(capWords(tokens).join(" "));
}

const escapeRegExp = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whole-phrase occurrences, case-insensitive, at letter/digit boundaries. */
export function countPhrase(haystack, phrase) {
  const needle = String(phrase ?? "").trim();
  if (!needle) return 0;
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, "giu");
  return (String(haystack || "").match(re) || []).length;
}

/** The forms a keyword is also written in: one separator swapped for a neighbour, and every separator gone. */
export function keywordVariants(keyword) {
  const trimmed = keyword.trim();
  if (!trimmed) return [];
  const out = [];
  const seen = new Set([trimmed.toLowerCase()]);
  const add = (form) => {
    const key = form.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(form);
  };
  const NEIGHBOURS = { " ": ["-", ""], "-": [" ", ".", ""], ".": [" ", "-", ""], _: ["-", " ", ""], "/": ["-", " "] };
  for (let i = 0; i < trimmed.length; i++) {
    for (const swap of NEIGHBOURS[trimmed[i]] || []) add(trimmed.slice(0, i) + swap + trimmed.slice(i + 1));
  }
  add(trimmed.replace(/[\s\-._/]/g, ""));
  return out;
}

const PROMISE_WORDS = /\b(fee|fees|cost|costs|price|prices|deadline|due date|filed within|time frame|timeframe|mailing address|postal address|street address|office address|filing address|hours|penalty|penalties)\b/i;
const MONEY_TRIGGER = /^(fee|fees|cost|costs|price|prices|penalty|penalties)$/i;
const MONEY_CUE = /\b(pay|pays|paid|paying|payment|payments|charge|charges|charged|apply|applies|applied|require|requires|required|requirement|requirements|mandatory|must|due|owe|owed|bill|billed|billing|accompany|accompanies|submit|submission|subscription|plan|plans|monthly|annual|annually|invoice|refund|refundable)\b/i;
const HAS_FIGURE = /(\d|\$|€|£|¥|\bfree of charge\b|\b(zero|free|nothing|none|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand|dozen|half|dollars?|euros?|cents?)\b|\ban? (day|week|month|year|hour|minute)\b|\bno (fees?|costs?|charges?|penalty|penalties|price)\b)/i;
const QUOTED = /“[^”]*”|"[^"]*"|«[^»]*»|„[^“”]*[“”]/g;
const MIN_CLAIM_CHARS = 25;

const sentences = (text) =>
  String(text || "")
    .split(/(?<=[.!?:;])\s+|\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CLAIM_CHARS);

/** Sentences that promise a fee, a deadline, hours or an address and state no figure. English word lists only. */
export function promiseFailures(text) {
  const out = [];
  for (const sentence of sentences(text)) {
    if (/\?\s*$/.test(sentence) || /\s·\s/.test(sentence)) continue;
    const own = sentence.replace(QUOTED, " ");
    const trigger = own.match(PROMISE_WORDS);
    if (!trigger) continue;
    if (MONEY_TRIGGER.test(trigger[0]) && !MONEY_CUE.test(own)) continue;
    if (HAS_FIGURE.test(own)) continue;
    out.push({ sentence, trigger: trigger[0].toLowerCase() });
  }
  return out;
}

/** The promise rule reads English only (and pages with no declared language). */
export function promiseRuleReads(language) {
  const primary = String(language || "").trim().toLowerCase().split(/[-_]/)[0];
  return !primary || primary === "en";
}

/**
 * The keyword report. `passages` are [{index, heading, text, charCount, group}]; `groupCount` the
 * number of h2 sections. Returns the counts and the findings as codes with their evidence.
 */
export function keywordReport({ keyword: raw, source, fields, passages, groupCount, language }) {
  const keyword = normaliseKeyword(raw);
  const variants = keywordVariants(keyword).slice(0, MAX_VARIANTS - 1);
  const body = passages.map((p) => `${p.heading || ""}\n${p.text || ""}`).join("\n");
  const inFields = (form) => ["title", "h1", "description"].filter((k) => countPhrase(fields[k] || "", form) > 0);
  const exactCount = countPhrase(body, keyword);
  const exactFields = inFields(keyword);
  const forms = [keyword, ...variants];
  const mentions = (p) => forms.some((f) => countPhrase(p.text || "", f) > 0 || countPhrase(p.heading || "", f) > 0);
  const hit = passages.filter(mentions);
  const reached = new Set(hit.map((p) => p.group)).size;
  const total = Math.max(0, groupCount || 0);
  const spread = total ? reached / total : 0;
  const indexed = passages.reduce((s, p) => s + (p.charCount || 0), 0);
  const onKeyword = hit.reduce((s, p) => s + (p.charCount || 0), 0);
  const share = indexed ? onKeyword / indexed : 0;
  const findings = [];
  if (!exactFields.length) findings.push({ code: "keyword_not_in_title", evidence: { keyword, source, exactCount, title: fields.title || "", h1: fields.h1 || "", description: fields.description || "" } });
  const rivals = variants.map((form) => ({ form, count: countPhrase(body, form), fields: inFields(form) }));
  const rival = rivals.find((v) => v.fields.length > 0 || v.count > 0);
  if (rival && (exactCount > 0 || rival.fields.length)) findings.push({ code: "keyword_variant_split", evidence: { keyword, source, exactCount, rival: rival.form, rivalCount: rival.count, rivalFields: rival.fields } });
  if (total >= MIN_GROUPS_FOR_SPREAD && spread <= SPREAD_FLOOR) findings.push({ code: "keyword_one_section", evidence: { keyword, source, sectionsReached: reached, sections: total, spread: Number(spread.toFixed(3)), passages: hit.map((p) => p.index) } });
  if (indexed && share < OFF_KEYWORD_FLOOR) findings.push({ code: "off_keyword_share", evidence: { keyword, source, charsOnKeyword: onKeyword, charsIndexed: indexed, share: Number(share.toFixed(3)), offShare: Number((1 - share).toFixed(3)), floor: OFF_KEYWORD_FLOOR, offPassages: passages.filter((p) => !mentions(p)).map((p) => p.index) } });
  const promiseChecked = promiseRuleReads(language);
  let promise = null;
  let weight = 0;
  for (const p of promiseChecked ? hit : []) {
    const failing = promiseFailures(p.text || "");
    if (!failing.length) continue;
    const w = new Set(failing.map((x) => x.trigger)).size;
    if (!promise || w > weight || (w === weight && (p.charCount || 0) > promise.charCount)) {
      weight = w;
      promise = { passage: p.index, heading: p.heading || null, trigger: failing[0].trigger, sentence: failing[0].sentence.slice(0, 240), charCount: p.charCount || 0 };
    }
  }
  if (promise) findings.push({ code: "promise_without_number", evidence: { passage: promise.passage, heading: promise.heading, trigger: promise.trigger, sentence: promise.sentence } });
  return { keyword, source, exact: { count: exactCount, fields: exactFields }, variants: rivals, sections: { reached, total, spread: Number(spread.toFixed(3)) }, chars: { onKeyword, indexed, share: Number(share.toFixed(3)) }, promiseChecked, findings };
}
