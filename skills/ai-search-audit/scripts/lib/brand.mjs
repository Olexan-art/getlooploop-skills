// How AI describes the brand: the GetLoopLoop Brandscope's five buyer questions, answered by the
// model of the agent running this skill FROM ITS OWN KNOWLEDGE (no browsing, no search, no reading
// the page first), written to brand.json; then compared with the page by fixed rules. This is one
// model's view. The web Brandscope asks three assistants; this skill asks the one it runs in.
//
// What can be called wrong is narrow on purpose, as in Brandscope: a price the page states
// differently, or a number of the same thing (plans, users, passages, languages) the page states
// differently. Everything else the model says is either on the page, or a fact the page lacks.
// A complaint is never checked against the brand's own page, and alternatives are other brands.

import { validateIdentity } from "../../../vectorscope/scripts/lib/judgement.mjs";
import { RUSSIAN_ONLY } from "./russian.mjs";

export const QUESTIONS = [
  { id: "what_is", ask: (b) => `What is ${b}? Answer in two sentences.` },
  { id: "pricing", ask: (b) => `How much does ${b} cost? Name the plans and prices you know of. If you are not sure, say so.` },
  { id: "integrations", ask: (b) => `What does ${b} integrate with? Name the integrations you know of.` },
  { id: "weaknesses", ask: (b) => `What are the main weaknesses or complaints about ${b} compared with its alternatives?` },
  { id: "alternatives", ask: (b) => `What are the main alternatives to ${b}, and when would somebody pick one of them instead?` },
];
export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
/** The questions whose answers are compared with the page for facts it lacks. */
export const FACT_QUESTIONS = ["what_is", "pricing", "integrations"];
export const MAX_ANSWER_CHARS = 1500;
export const BASIS = "own_knowledge";

// ── ported rules: knowing the brand, money, words ────────────────────────────

const DISCLAIMERS = [
  /\b(?:i|we) (?:do not|don't) have (?:any |much |specific |detailed )?(?:information|details|data|knowledge)\b/i,
  /\b(?:i|we) (?:am|'m|are) not (?:familiar|aware)\b/i,
  /\bnot familiar with\b/i,
  /\b(?:i|we) (?:have|has) no (?:information|knowledge|record)\b/i,
  /\b(?:i|we) (?:could not|couldn't|cannot|can't) find (?:any |much )?(?:information|details|records?|references?|anything|a company)/i,
  /\b(?:i|we) (?:do not|don't) (?:know|recognise|recognize) (?:of|about|any)\b/i,
  /\bno (?:widely |publicly )?(?:known|available|recognised|recognized) (?:company|brand|product|information)\b/i,
  /\b(?:does|do) not appear to be a (?:well[- ])?known\b/i,
  /\bunable to find\b/i,
  /\bmay not exist\b/i,
];
/** An answer that opens by saying the model does not know the brand. Read from the first 400 characters. */
export const disclaimsKnowledge = (text) => DISCLAIMERS.some((re) => re.test(String(text || "").slice(0, 400)));

/** Money as a page or an answer writes it: $20, 20 USD, €15/month. One price stated twice is one price. */
const MONEY = /(?:[$€£]\s?\d[\d.,]*)|(?:\d[\d.,]*\s?(?:usd|eur|gbp|dollars|euros))/gi;
export function amounts(text) {
  return [...new Set((String(text || "").match(MONEY) || []).map((v) => v.replace(/\s+/g, "").replace(/[.,]$/, "").toLowerCase()))];
}

/** A number and the noun it counts: "26 passages", "3 plans", "12 bots". Nouns folded to a stem. */
const COUNTED = /(?<![\p{L}\p{N}.,$€£])(\d{1,6}(?:[.,]\d+)?)\s+([\p{L}][\p{L}-]{2,})/gu;
const NOT_A_COUNT = new Set(["and", "or", "of", "to", "in", "on", "at", "by", "for", "the", "per", "from", "with", "out", "percent", "pm", "am", "px", "kb", "mb", "gb"]);
const stem = (w) => w.toLowerCase().replace(/(?:ies)$/, "y").replace(/(?:es|s)$/, "");
export function countedNumbers(text) {
  const out = [];
  for (const m of String(text || "").matchAll(COUNTED)) {
    const noun = m[2].toLowerCase();
    if (NOT_A_COUNT.has(noun)) continue;
    const n = Number(m[1].replace(",", "."));
    if (!Number.isFinite(n) || (n >= 1900 && n <= 2100 && !m[1].includes("."))) continue;
    out.push({ n, unit: stem(noun), raw: m[0] });
  }
  return out;
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;
const STOP = new Set("a an and are as at be by for from has have in is it its of on or that the to with your you this these those we our us they their can will would could should".split(" "));
const words = (t) => (String(t || "").toLowerCase().match(WORD) || []).filter((w) => w.length > 2 && !STOP.has(w));

/** The checkable parts of a sentence: its numbers and the capitalised names past its first word. */
export function anchorsOf(sentence, brand) {
  const out = [];
  const b = String(brand || "").toLowerCase().replace(/\s+/g, "");
  const tokens = String(sentence).split(/\s+/).filter(Boolean);
  tokens.forEach((raw, i) => {
    const w = raw.replace(/^[^\p{L}\p{N}$€£]+|[^\p{L}\p{N}%]+$/gu, "");
    if (w.length < 2) return;
    if (b && w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").includes(b)) return;
    if (/\d/.test(w)) out.push(w.toLowerCase());
    else if (i > 0 && /^\p{Lu}/u.test(w)) out.push(w.toLowerCase());
  });
  return [...new Set(out)];
}

const sentencesOf = (text) =>
  String(text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

// ── brand.json ───────────────────────────────────────────────────────────────

/**
 * {"agent": "…", "model": "…", "brand": "Name", "basis": "own_knowledge",
 *  "answers": [{"question": "what_is", "knows": true, "answer": "…"}, {"question": "pricing", "knows": false, "answer": ""}, …]}
 * All five questions, each once. Returns { brand, answers, judgement } or throws.
 */
export function validateBrand(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.answers)) throw new Error('brand.json must be {"brand": "…", "basis": "own_knowledge", "answers": [{"question": "what_is", "knows": true, "answer": "…"}, …]}.');
  if (input.basis !== BASIS) throw new Error(`brand.json "basis" must be "${BASIS}": the answers come from the model's own knowledge, with no browsing or search, and the file says so.`);
  const brand = typeof input.brand === "string" ? input.brand.replace(/\s+/g, " ").trim() : "";
  if (!brand || brand.length > 80) throw new Error('brand.json "brand" must be the brand\'s name, 1–80 characters.');
  const seen = new Set();
  const answers = input.answers.map((a, i) => {
    const where = `answers[${i}]`;
    if (!a || !QUESTION_IDS.includes(a.question)) throw new Error(`${where}.question must be one of ${QUESTION_IDS.join(", ")}.`);
    if (seen.has(a.question)) throw new Error(`question ${a.question} is answered twice.`);
    seen.add(a.question);
    if (typeof a.knows !== "boolean") throw new Error(`${where}.knows must be true or false ("doesn't know" is a valid answer: false).`);
    const text = typeof a.answer === "string" ? a.answer.trim() : "";
    if (text.length > MAX_ANSWER_CHARS) throw new Error(`${where}.answer is over ${MAX_ANSWER_CHARS} characters.`);
    if (RUSSIAN_ONLY.test(text)) throw new Error(`${where}.answer holds Russian letters; answer in English or the page's language, never Russian.`);
    if (a.knows && !text) throw new Error(`${where}: knows is true, so the answer text is required.`);
    return { question: a.question, knows: a.knows && !disclaimsKnowledge(text), text };
  });
  const missing = QUESTION_IDS.filter((q) => !seen.has(q));
  if (missing.length) throw new Error(`brand.json has no answer to ${missing.join(", ")}; all five are answered, "knows": false included.`);
  answers.sort((a, b) => QUESTION_IDS.indexOf(a.question) - QUESTION_IDS.indexOf(b.question));
  return { brand, answers, judgement: validateIdentity(input) };
}

/**
 * The comparison. `page` is { text, passages } — the page's visible text (with title and
 * description) and its passages, to place a contradiction on the map. Returns findings.
 */
export function brandFindings(b, page) {
  if (!b) return [];
  const out = [];
  const known = b.answers.filter((a) => a.knows);
  const base = { judgement: b.judgement };
  if (!known.length) {
    out.push({ ...base, code: "brand_unknown", evidence: { brand: b.brand, known: 0, asked: b.answers.length }, where: "brand questions 1–5" });
    return out;
  }
  const pageText = page.text;
  const pageLower = pageText.toLowerCase();
  const passageOf = (needle) => {
    const n = String(needle).toLowerCase();
    const p = page.passages.find((x) => x.text.toLowerCase().includes(n));
    return p ? p.index : null;
  };
  // Contradictions: a price the page states differently, or a count of the same thing.
  const contradictions = [];
  const ours = amounts(pageText);
  for (const a of known) {
    if (a.question === "weaknesses" || a.question === "alternatives") continue;
    if (a.question === "pricing") {
      const theirs = amounts(a.text);
      if (theirs.length && ours.length && !theirs.some((v) => ours.includes(v))) contradictions.push({ question: a.question, kind: "price", model: theirs.slice(0, 3), page: ours.slice(0, 3), passage: passageOf(ours[0]) });
    }
    const pageCounts = countedNumbers(pageText);
    for (const c of countedNumbers(a.text)) {
      const same = pageCounts.filter((p) => p.unit === c.unit);
      if (same.length && !same.some((p) => p.n === c.n)) contradictions.push({ question: a.question, kind: "count", model: [c.raw], page: [...new Set(same.map((p) => p.raw))].slice(0, 3), passage: passageOf(same[0].raw) });
    }
  }
  if (contradictions.length) {
    const first = contradictions[0];
    out.push({ ...base, code: "brand_contradiction", evidence: { brand: b.brand, count: contradictions.length, items: contradictions.slice(0, 6) }, passages: [...new Set(contradictions.map((c) => c.passage).filter((p) => p !== null))], where: `brand question ${QUESTION_IDS.indexOf(first.question) + 1} · ${first.passage !== null ? `page: passage #${first.passage}` : "page"}` });
  }
  // Facts the page lacks: sentences whose numbers and names are nowhere on the page.
  const lacking = [];
  for (const a of known.filter((x) => FACT_QUESTIONS.includes(x.question))) {
    for (const s of sentencesOf(a.text)) {
      const anchors = anchorsOf(s, b.brand);
      if (!anchors.length) continue;
      const found = anchors.filter((x) => pageLower.includes(x)).length;
      if (found / anchors.length < 0.5) lacking.push({ question: a.question, sentence: s.slice(0, 220), anchors: anchors.slice(0, 6) });
    }
    if (a.question === "pricing" && amounts(a.text).length && !ours.length) lacking.push({ question: a.question, sentence: "prices", anchors: amounts(a.text).slice(0, 3) });
  }
  // Content words of the description: does the page say the same things? (Brandscope's 35% rule, reported.)
  const what = known.find((a) => a.question === "what_is");
  let support = null;
  if (what) {
    const site = new Set(words(pageText));
    const claim = words(what.text);
    support = claim.length ? Number((claim.filter((w) => site.has(w)).length / claim.length).toFixed(3)) : null;
  }
  if (lacking.length) out.push({ ...base, code: "brand_fact_absent", evidence: { brand: b.brand, count: lacking.length, items: lacking.slice(0, 6), descriptionSupport: support }, where: `brand question${new Set(lacking.map((l) => l.question)).size > 1 ? "s" : ""} ${[...new Set(lacking.map((l) => QUESTION_IDS.indexOf(l.question) + 1))].join(", ")} · not on the page` });
  return out;
}
