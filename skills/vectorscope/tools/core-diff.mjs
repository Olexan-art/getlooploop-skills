#!/usr/bin/env node
// Proves that a change left the core alone: reads the same saved pages with two skill folders and
// compares, byte for byte, the reading's page fields and passages and, with a groups file, the
// vocabulary (phrases, narrative words, keywords). Exit 1 on any difference.
//
//   node tools/core-diff.mjs <old skill dir> <page.html> <url> [<groups.json>] [<page.html> <url> [<groups.json>] …]
//
// The old folder is a checkout of the earlier version with its own node_modules (npm install). The
// pages are saved copies (read.mjs --save-html), so both versions read exactly the same bytes and
// nothing is fetched. A groups argument is recognised by its .json extension.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function load(dir) {
  const lib = (name) => import(pathToFileURL(join(dir, "scripts", "lib", name)).href);
  return { ...(await lib("reading.mjs")), ...(await lib("analysis.mjs")), ...(await lib("judgement.mjs")) };
}

async function core(api, html, url, groups) {
  const reading = await api.readPage({ url, html, robots: "skip" });
  const out = { ok: reading.ok, page: JSON.stringify(reading.page ?? null), passages: JSON.stringify(reading.passages ?? null) };
  if (groups && reading.ok) {
    const lens = api.buildJudgedLens(reading, api.validateGrouping(groups, reading.passages.length));
    out.phrases = JSON.stringify(lens.phrases);
    out.narrative = JSON.stringify(lens.narrative);
    out.keywords = JSON.stringify(lens.keywords);
  }
  return { out, passages: reading.passages?.length ?? 0 };
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("Usage: node tools/core-diff.mjs <old skill dir> <page.html> <url> [<groups.json>] …");
  process.exit(1);
}
const oldApi = await load(resolve(args[0]));
const newApi = await load(HERE);
let failed = false;
for (let i = 1; i < args.length; ) {
  const file = args[i++];
  const url = args[i++];
  const groups = args[i] && args[i].endsWith(".json") ? JSON.parse(readFileSync(args[i++], "utf8")) : null;
  const html = readFileSync(file, "utf8");
  const a = await core(oldApi, html, url, groups);
  const b = await core(newApi, html, url, groups);
  const fields = Object.keys(a.out);
  const diff = fields.filter((k) => a.out[k] !== b.out[k]);
  console.log(`${diff.length ? "DIFFERENT" : "identical"}  ${url}  ${b.passages} passages · compared: ${fields.join(", ")}${diff.length ? ` · differs: ${diff.join(", ")}` : ""}`);
  if (diff.length) failed = true;
}
process.exit(failed ? 1 : 0);
