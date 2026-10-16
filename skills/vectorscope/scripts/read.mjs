#!/usr/bin/env node
// Step 1 of the Vectorscope skill: fetch → extract → chunk → cap → side-path roles.
//   node scripts/read.mjs <url> [--out reading.json] [--html saved.html [--final-url <url>]]
// Writes the reading as JSON (every passage with its full text) and prints a short summary.
// On a refusal it still writes the JSON, with ok:false and the machine code, and exits 2.
// --html reads a saved copy of the page instead of fetching it (for repeatable runs and tests).

import { readFileSync, writeFileSync } from "node:fs";
import { readPage } from "./lib/reading.mjs";

function parseArgs(argv) {
  const out = { url: null, out: "reading.json", html: null, finalUrl: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") out.out = argv[++i];
    else if (arg === "--html") out.html = argv[++i];
    else if (arg === "--final-url") out.finalUrl = argv[++i];
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (!out.url) out.url = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  return out;
}

const USAGE = "Usage: node scripts/read.mjs <url> [--out reading.json] [--html saved.html [--final-url <url>]]";

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
if (args.help || args.url === null) {
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}

const html = args.html ? readFileSync(args.html, "utf8") : undefined;
const reading = await readPage({ url: args.url, html, finalUrl: args.finalUrl || undefined });
writeFileSync(args.out, JSON.stringify(reading, null, 2));

if (!reading.ok) {
  console.log(`REFUSED  ${reading.reasonCode}${reading.status ? ` (HTTP ${reading.status})` : ""}`);
  console.log(`reading  ${args.out}`);
  process.exit(2);
}

const { page, passages } = reading;
const roles = passages.filter((p) => p.contentRole !== "main");
const fmt = (n) => n.toLocaleString("en-US");
console.log(`url       ${page.url}${page.url !== page.requestedUrl ? `  (asked for ${page.requestedUrl})` : ""}`);
console.log(`title     ${page.title || "(none)"}`);
console.log(`extracted ${fmt(page.wordCount)} words · ${page.headings} headings${page.noindex ? " · NOINDEX" : ""}`);
console.log(`chunked   ${passages.length} passages · ${fmt(page.charsIndexed)} chars · ${passages.length}/${page.chunkCap} cap slots${page.capReached ? " (cap reached)" : ""}`);
console.log(`past cap  ${fmt(page.charsUnread)} chars`);
console.log(`side-path ${roles.length ? roles.map((p) => `#${p.index} ${p.contentRole}`).join(", ") : "none"}`);
console.log(`reading   ${args.out}`);
