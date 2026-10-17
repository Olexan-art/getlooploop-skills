// Questions people ask: the agent writes 8 to 12 spoken questions about the page's topic, built the
// way the GetLoopLoop Voicescope builds them (the topic crossed with a real circumstance along four
// axes), and judges, for each one, the passage a retriever should return, whether it answers the
// question completely, in part or not at all, and the verbatim words that answer. This file only
// checks what the agent wrote: every quote must be copied from its passage, word for word.

import { quoteIn, validateIdentity, VERDICTS } from "../../../vectorscope/scripts/lib/judgement.mjs";
import { RUSSIAN_ONLY } from "./russian.mjs";

export const MIN_QUESTIONS = 8;
export const MAX_QUESTIONS = 12;
export const MAX_QUESTION_CHARS = 200;
export const MAX_QUOTE_CHARS = 400;
/** Voicescope's four axes: urgency; who is asking and on what; the thing in front of them; what actually hurts. */
export const AXES = ["urgency", "device", "object", "obstacle"];
const str = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * questions.json:
 * {"agent": "…", "model": "…", "topic": "…",
 *  "questions": [{"id": "q1", "question": "…", "axes": ["urgency", "object"],
 *                 "passage": 4, "verdict": "complete", "citable": true, "quote": "verbatim words"}]}
 * `passages` are the reading's passages ([{index, text}]). Returns { questions, judgement, topic, warnings } or throws.
 */
export function validateQuestions(input, passages, { keyword = null } = {}) {
  if (!input || typeof input !== "object" || !Array.isArray(input.questions)) throw new Error('questions.json must be {"questions": [{"id": "q1", "question": "…", "axes": ["urgency"], "passage": 3, "verdict": "complete", "citable": true, "quote": "…"}]}.');
  const list = input.questions;
  if (list.length < MIN_QUESTIONS || list.length > MAX_QUESTIONS) throw new Error(`${list.length} questions; write ${MIN_QUESTIONS} to ${MAX_QUESTIONS}.`);
  const byIndex = new Map(passages.map((p) => [p.index, p]));
  const ids = new Set();
  const used = new Set();
  const warnings = [];
  const questions = list.map((q, i) => {
    const where = `questions[${i}]`;
    if (!q || typeof q !== "object") throw new Error(`${where} is not an object.`);
    const id = str(q.id) ? q.id.trim() : `q${i + 1}`;
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(id)) throw new Error(`${where}.id must be a short id such as "q1".`);
    if (ids.has(id)) throw new Error(`question id ${id} appears twice.`);
    ids.add(id);
    if (!str(q.question) || q.question.length > MAX_QUESTION_CHARS) throw new Error(`${where}.question must be 1–${MAX_QUESTION_CHARS} characters.`);
    if (RUSSIAN_ONLY.test(q.question) || RUSSIAN_ONLY.test(q.quote || "")) throw new Error(`${where}: Russian letters found. Questions are written in the page's language, and never in Russian.`);
    const axes = Array.isArray(q.axes) ? q.axes : [];
    if (!axes.length || axes.length > 3 || axes.some((a) => !AXES.includes(a))) throw new Error(`${where}.axes must name 1 to 3 of ${AXES.join(", ")} (never all four in one question).`);
    for (const a of axes) used.add(a);
    if (!VERDICTS.includes(q.verdict)) throw new Error(`${where}.verdict must be one of ${VERDICTS.join(", ")}.`);
    const passage = q.passage ?? null;
    if (passage !== null && !byIndex.has(passage)) throw new Error(`${where}.passage ${JSON.stringify(passage)} is not a passage index of this reading (0–${passages.length - 1}).`);
    const quote = typeof q.quote === "string" ? q.quote.trim() : "";
    if (q.verdict === "missing") {
      if (q.citable === true) throw new Error(`${where}: a missing answer cannot be citable.`);
      return { id, question: q.question.trim(), axes, passage, verdict: "missing", citable: false, quote: null };
    }
    if (typeof q.citable !== "boolean") throw new Error(`${where}.citable must be true or false.`);
    if (passage === null) throw new Error(`${where}.passage is required for a ${q.verdict} answer.`);
    if (!quote) throw new Error(`${where}.quote is required for a ${q.verdict} answer: the words in the passage that answer.`);
    if (quote.length > MAX_QUOTE_CHARS) throw new Error(`${where}.quote is over ${MAX_QUOTE_CHARS} characters; quote the answering sentence.`);
    if (!quoteIn(quote, byIndex.get(passage).text)) throw new Error(`${where}.quote is not verbatim text from passage ${passage}. Copy it exactly (whitespace, quote marks and case may differ).`);
    return { id, question: q.question.trim(), axes, passage, verdict: q.verdict, citable: q.citable, quote };
  });
  const unused = AXES.filter((a) => !used.has(a));
  if (unused.length) throw new Error(`no question uses the ${unused.join(", ")} axis; vary the circumstance along all four.`);
  if (keyword) {
    const k = keyword.toLowerCase();
    const withKey = questions.filter((q) => q.question.toLowerCase().includes(k)).length;
    if (withKey > questions.length / 2) warnings.push(`${withKey} of ${questions.length} questions contain the keyword "${keyword}"; people describe the problem, not the jargon.`);
  }
  if (!questions.some((q) => q.verdict === "missing")) warnings.push("every question is answered; include at least one the page probably does not answer.");
  const topic = str(input.topic) ? input.topic.replace(/\s+/g, " ").trim().slice(0, 120) : null;
  return { questions, topic, judgement: validateIdentity(input), warnings };
}

/** Findings: each missing answer (medium) and each partial one (low). */
export function questionFindings(q) {
  if (!q) return [];
  const out = [];
  q.questions.forEach((x, i) => {
    if (x.verdict === "complete") return;
    out.push({
      id: `${x.verdict === "missing" ? "question_missing" : "question_partial"}-${x.id}`,
      code: x.verdict === "missing" ? "question_missing" : "question_partial",
      evidence: { id: x.id, n: i + 1, question: x.question, axes: x.axes, passage: x.passage, quote: x.quote, citable: x.citable },
      passages: x.verdict === "partial" && x.passage !== null ? [x.passage] : [],
      where: x.verdict === "partial" ? `question ${i + 1} · passage #${x.passage}` : `question ${i + 1} · no passage`,
      judgement: q.judgement,
    });
  });
  return out;
}
