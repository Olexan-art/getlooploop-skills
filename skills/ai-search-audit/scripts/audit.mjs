#!/usr/bin/env node
// Step 2 of the AI Search Audit (Lite): every check over the reading, and the report. No
// network, no model: the same reading gives the same report anywhere.
//   node scripts/audit.mjs reading.json [--html report.html] [--md report.md] [--json export.json]
// A refused reading (ok:false) still gets its report: the URL and the reason, nothing else.

import { readFileSync, writeFileSync } from "node:fs";
import { buildModel } from "./lib/model.mjs";
import { renderRefusal, renderReport } from "./lib/report.mjs";
import { buildExport, buildRefusalExport, renderMarkdown, renderRefusalMarkdown } from "./lib/outputs.mjs";
import { READING_SCHEMA } from "./lib/version.mjs";

const USAGE = "Usage: node scripts/audit.mjs reading.json [--html report.html] [--md report.md] [--json export.json]";

function parseArgs(argv) {
  const out = { reading: null, html: null, md: null, json: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--html") out.html = argv[++i];
    else if (arg === "--md") out.md = argv[++i];
    else if (arg === "--json") out.json = argv[++i];
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
if (!args.html && !args.md && !args.json) args.html = "report.html";

let reading;
try {
  reading = JSON.parse(readFileSync(args.reading, "utf8"));
} catch (error) {
  console.error(`REFUSED   ${args.reading} is not a readable JSON file: ${error.message}`);
  process.exit(1);
}
if (reading.schema !== READING_SCHEMA) {
  console.error(`REFUSED   ${args.reading} is not an ai-search-audit reading (schema ${JSON.stringify(reading.schema)}, expected ${READING_SCHEMA}). Run read.mjs first.`);
  process.exit(1);
}

if (!reading.ok) {
  if (args.html) writeFileSync(args.html, renderRefusal(reading));
  if (args.md) writeFileSync(args.md, renderRefusalMarkdown(reading));
  if (args.json) writeFileSync(args.json, JSON.stringify(buildRefusalExport(reading), null, 2));
  console.log(`REFUSED   ${reading.reasonCode}${reading.status ? ` (HTTP ${reading.status})` : ""}`);
  for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
  process.exit(2);
}

const model = buildModel(reading);
if (args.html) writeFileSync(args.html, renderReport(model));
if (args.md) writeFileSync(args.md, renderMarkdown(model));
if (args.json) writeFileSync(args.json, JSON.stringify(buildExport(model), null, 2));

const c = model.counts;
console.log(`url       ${reading.fetch.finalUrl}`);
console.log(`problems  ${model.findings.length} · blocking ${c.blocking} · high ${c.high} · medium ${c.medium} · low ${c.low}`);
console.log(`tiles     ${model.tiles.map((t) => `${t.id} ${t.state}`).join(" · ")}`);
for (const f of model.findings) console.log(`  ${String(f.pin).padStart(2)} [${f.severity}] ${f.code}${f.where ? `  @ ${f.where.slice(0, 90)}` : ""}`);
const cl = model.checklist;
console.log(`checklist ${["pass", "fail", "warn", "na", "none"].map((s) => `${s} ${cl.filter((x) => x.state === s).length}`).join(" · ")}`);
for (const cap of model.caps) console.log(`not done  ${cap.t[0]}`);
for (const [k, v] of [["html", args.html], ["md", args.md], ["json", args.json]]) if (v) console.log(`${k.padEnd(9)} ${v}`);
