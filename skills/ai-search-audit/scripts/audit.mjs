#!/usr/bin/env node
// Step 2 of the AI Search Audit (Lite): every check over the reading, the agent's judgement files
// validated and compared with the page, and the report. No network, no model: the scripts only
// count, compare and draw; the judgement in questions.json, brand.json and reviews.json was
// written by the agent running the skill, and the report marks it as such.
//   node scripts/audit.mjs reading.json [--questions questions.json] [--brand brand.json] [--reviews reviews.json]
//        [--keyword "phrase"] [--html report.html] [--md report.md] [--json export.json] [--check]
// --check validates the judgement files against the reading and writes nothing.
// A refused reading (ok:false) still gets its report: the URL and the reason, nothing else.

import { readFileSync, writeFileSync } from "node:fs";
import { buildModel } from "./lib/model.mjs";
import { renderRefusal, renderReport } from "./lib/report.mjs";
import { buildExport, buildRefusalExport, renderMarkdown, renderRefusalMarkdown } from "./lib/outputs.mjs";
import { READING_SCHEMA } from "./lib/version.mjs";
import { validateQuestions } from "./lib/questions.mjs";
import { validateBrand } from "./lib/brand.mjs";
import { validateReviews } from "./lib/reviews.mjs";
import { textModules } from "./lib/checks.mjs";

const USAGE = [
  "Usage: node scripts/audit.mjs reading.json [--questions questions.json] [--brand brand.json] [--reviews reviews.json]",
  '       [--keyword "phrase"] [--html report.html] [--md report.md] [--json export.json] [--check]',
].join("\n");

function parseArgs(argv) {
  const out = { reading: null, html: null, md: null, json: null, questions: null, brand: null, reviews: null, keyword: null, check: false };
  const takes = { "--html": "html", "--md": "md", "--json": "json", "--questions": "questions", "--brand": "brand", "--reviews": "reviews", "--keyword": "keyword" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (takes[arg]) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} needs a value`);
      out[takes[arg]] = v;
    } else if (arg === "--check") out.check = true;
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else if (!out.reading) out.reading = arg;
    else throw new Error(`One reading only; also given: ${arg}`);
  }
  return out;
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
if (args.help || !args.reading) {
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}
if (!args.check && !args.html && !args.md && !args.json) args.html = "report.html";

const readJson = (file, what) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`REFUSED   ${file} is not a readable JSON file (${what}): ${error.message}`);
    process.exit(1);
  }
};

const reading = readJson(args.reading, "reading");
if (reading.schema !== READING_SCHEMA) {
  console.error(`REFUSED   ${args.reading} is not an ai-search-audit reading (schema ${JSON.stringify(reading.schema)}, expected ${READING_SCHEMA}). Run read.mjs first.`);
  process.exit(1);
}

if (!reading.ok) {
  if (args.check) {
    console.log(`REFUSED   ${reading.reasonCode}: the reading was refused, so there is nothing to judge.`);
    process.exit(2);
  }
  if (args.html) writeFileSync(args.html, renderRefusal(reading));
  if (args.md) writeFileSync(args.md, renderRefusalMarkdown(reading));
  if (args.json) writeFileSync(args.json, JSON.stringify(buildRefusalExport(reading), null, 2));
  console.log(`REFUSED   ${reading.reasonCode}${reading.status ? ` (HTTP ${reading.status})` : ""}`);
  for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
  process.exit(2);
}

// The judgement files: each one validated against this reading, or the run stops and says what to fix.
const extra = { keyword: args.keyword };
const modules = textModules(reading, { keyword: args.keyword });
const judged = [
  ["questions", args.questions, (x) => validateQuestions(x, reading.vs.passages, { keyword: modules.keyword.keyword })],
  ["brand", args.brand, validateBrand],
  ["reviews", args.reviews, validateReviews],
];
for (const [key, file, validate] of judged) {
  if (!file) continue;
  try {
    extra[key] = validate(readJson(file, key));
  } catch (error) {
    console.error(`REFUSED   ${file}: ${error.message}`);
    process.exit(1);
  }
  for (const w of extra[key].warnings || []) console.log(`warning   ${file}: ${w}`);
  const j = extra[key].judgement;
  console.log(`${key.padEnd(9)} ${file} ok · judged by ${j.agent || "agent not stated"} · ${j.model || "model not stated"}`);
}
if (args.check) process.exit(0);

const model = buildModel(reading, extra);
if (args.html) writeFileSync(args.html, renderReport(model));
if (args.md) writeFileSync(args.md, renderMarkdown(model));
if (args.json) writeFileSync(args.json, JSON.stringify(buildExport(model), null, 2));

const c = model.counts;
console.log(`url       ${reading.fetch.finalUrl}`);
console.log(`problems  ${model.findings.length} · blocking ${c.blocking} · high ${c.high} · medium ${c.medium} · low ${c.low}`);
console.log(`tiles     ${model.tiles.map((t) => `${t.id} ${t.state}`).join(" · ")}`);
if (model.keyword) console.log(`keyword   “${model.keyword.keyword}” (${model.keyword.source === "given" ? "--keyword" : "from the h1"})`);
const p = model.modules.patterns;
console.log(`patterns  ${p.analysed ? `${p.language} · ${p.wordCount} words · ${p.findings.length} signals` : `not analysed (${p.reason})`}`);
if (model.modules.locales) console.log(`locales   ${model.modules.locales.compared.map((x) => `${x.hreflang} ${x.aligned ? `${x.differ} differ` : "not aligned"}`).join(" · ")}`);
for (const f of model.findings) console.log(`  ${String(f.pin).padStart(2)} [${f.severity}] ${f.code}${f.layer === "judgement" ? " (judgement)" : ""}${f.where ? `  @ ${f.where.slice(0, 90)}` : ""}`);
const cl = model.checklist;
console.log(`checklist ${["pass", "fail", "warn", "na", "none"].map((s) => `${s} ${cl.filter((x) => x.state === s).length}`).join(" · ")}`);
for (const cap of model.caps) console.log(`not done  ${cap.t[0]}`);
for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
