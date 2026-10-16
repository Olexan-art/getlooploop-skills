#!/usr/bin/env node
// Step 1 of the Vectorscope skill: fetch → extract → chunk → cap → side-path roles, plus the
// layers around that core: the page's technical markup and robots.txt, and optionally a
// JavaScript render to compare against.
//   node scripts/read.mjs <url> [--out reading.json] [--render] [--no-robots] [--save-html page.html]
//   node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt]
//   node scripts/read.mjs <url1> <url2> [... up to 5] [--out-dir readings] [--render] [--no-robots]
// One URL writes one reading. Two to five write reading-1.json … reading-N.json and manifest.json
// into --out-dir (compare mode). A refusal still writes its reading, with ok:false and the code.
// --html reads a saved copy of the page instead of fetching it (repeatable runs and tests); then
// robots.txt is not fetched unless --robots names a saved copy.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readPage } from "./lib/reading.mjs";
import { findBrowser } from "./lib/render.mjs";
import { runChecks } from "./lib/checks.mjs";

export const MAX_COMPARE_URLS = 5;
export const MANIFEST_SCHEMA = "getlooploop/vectorscope-skill-manifest@1";

const USAGE = [
  "Usage: node scripts/read.mjs <url> [--out reading.json] [--render] [--no-robots] [--save-html page.html]",
  "       node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt]",
  `       node scripts/read.mjs <url1> <url2> [… up to ${MAX_COMPARE_URLS}] [--out-dir readings] [--render] [--no-robots]`,
].join("\n");

function parseArgs(argv) {
  const out = { urls: [], out: "reading.json", outDir: "readings", html: null, finalUrl: null, robots: null, noRobots: false, render: false, saveHtml: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") out.out = argv[++i];
    else if (arg === "--out-dir") out.outDir = argv[++i];
    else if (arg === "--html") out.html = argv[++i];
    else if (arg === "--final-url") out.finalUrl = argv[++i];
    else if (arg === "--robots") out.robots = argv[++i];
    else if (arg === "--no-robots") out.noRobots = true;
    else if (arg === "--render") out.render = true;
    else if (arg === "--save-html") out.saveHtml = argv[++i];
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else out.urls.push(arg);
  }
  return out;
}

const fmt = (n) => Number(n).toLocaleString("en-US");

function summarise(reading, file, prefix = "") {
  if (!reading.ok) {
    console.log(`${prefix}REFUSED  ${reading.reasonCode}${reading.status ? ` (HTTP ${reading.status})` : ""}`);
    console.log(`${prefix}reading  ${file}`);
    return;
  }
  const { page, passages, robots, technical, render } = reading;
  const roles = passages.filter((p) => p.contentRole !== "main");
  console.log(`${prefix}url       ${page.url}${page.url !== page.requestedUrl ? `  (asked for ${page.requestedUrl})` : ""}`);
  console.log(`${prefix}title     ${page.title || "(none)"}`);
  console.log(`${prefix}extracted ${fmt(page.wordCount)} words · ${page.headings} headings${page.noindex ? " · NOINDEX" : ""}`);
  console.log(`${prefix}chunked   ${passages.length} passages · ${fmt(page.charsIndexed)} chars · ${passages.length}/${page.chunkCap} cap slots${page.capReached ? " (cap reached)" : ""}`);
  console.log(`${prefix}past cap  ${fmt(page.charsUnread)} chars`);
  console.log(`${prefix}side-path ${roles.length ? roles.map((p) => `#${p.index} ${p.contentRole}`).join(", ") : "none"}`);
  if (robots) {
    const blocked = robots.bots.filter((b) => !b.allowed).map((b) => b.token);
    console.log(`${prefix}robots    ${robots.status}${robots.status === "ok" || robots.status === "none" ? ` · blocked: ${blocked.length ? blocked.join(", ") : "none"}` : ""}`);
  }
  if (technical) {
    console.log(`${prefix}json-ld   ${technical.jsonLd.types.length ? technical.jsonLd.types.join(", ") : "none"} · canonical ${technical.canonical.present ? (technical.canonical.self ? "self" : "other") : "missing"} · description ${technical.metaDescription.length} chars`);
  }
  if (render) {
    console.log(
      render.ok
        ? `${prefix}render    with JS ${fmt(render.wordCount)} words · ${render.passages} passages (without JS ${fmt(page.wordCount)} · ${page.chunksIndexed})`
        : `${prefix}render    not done: ${render.reason === "no_browser" ? "no Chrome or Chromium found (set CHROME_PATH)" : render.reason}`
    );
  }
  // Every check except the repetition one, which needs the grouping; lens.mjs prints the full list.
  const checks = runChecks(reading).filter((f) => f.code !== "robots_not_checked");
  console.log(`${prefix}checks    ${checks.length ? checks.map((f) => `[${f.severity}] ${f.code}`).join(", ") : "none"}`);
  console.log(`${prefix}reading   ${file}`);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
if (args.help || args.urls.length === 0) {
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}
if (args.urls.length > MAX_COMPARE_URLS) {
  console.error(`At most ${MAX_COMPARE_URLS} URLs in compare mode; ${args.urls.length} given.`);
  process.exit(1);
}
if (args.render && !findBrowser()) {
  console.log("render    no Chrome or Chromium found (set CHROME_PATH); continuing with the plain fetch only");
}

const robotsOption = (forHtml) => {
  if (args.robots) return { text: readFileSync(args.robots, "utf8") };
  if (args.noRobots) return "skip";
  return forHtml ? "skip" : "fetch";
};

if (args.urls.length === 1) {
  const html = args.html ? readFileSync(args.html, "utf8") : undefined;
  const reading = await readPage({
    url: args.urls[0],
    html,
    finalUrl: args.finalUrl || undefined,
    robots: robotsOption(Boolean(html)),
    render: args.render,
    onHtml: args.saveHtml ? (source) => writeFileSync(args.saveHtml, source) : undefined,
  });
  writeFileSync(args.out, JSON.stringify(reading, null, 2));
  summarise(reading, args.out);
  process.exit(reading.ok ? 0 : 2);
}

// Compare mode: one reading per URL, read one after another, and a manifest.
if (args.html) {
  console.error("--html reads one saved page; it cannot be combined with several URLs.");
  process.exit(1);
}
mkdirSync(args.outDir, { recursive: true });
const pages = [];
for (let i = 0; i < args.urls.length; i++) {
  const n = i + 1;
  const file = `reading-${n}.json`;
  const reading = await readPage({ url: args.urls[i], robots: robotsOption(false), render: args.render });
  writeFileSync(join(args.outDir, file), JSON.stringify(reading, null, 2));
  console.log(`── page ${n}`);
  summarise(reading, join(args.outDir, file), "  ");
  pages.push({ n, url: reading.page?.url ?? args.urls[i], requested: args.urls[i], reading: file, ok: reading.ok, reasonCode: reading.reasonCode });
}
const manifest = { schema: MANIFEST_SCHEMA, mode: "compare", createdAt: new Date().toISOString(), pages };
writeFileSync(join(args.outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`manifest  ${join(args.outDir, "manifest.json")}`);
const usable = pages.filter((p) => p.ok).length;
if (usable < 2) {
  console.log(`only ${usable} of ${pages.length} pages could be read; a comparison needs two.`);
  process.exit(2);
}
