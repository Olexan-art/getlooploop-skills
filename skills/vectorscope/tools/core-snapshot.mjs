#!/usr/bin/env node
// The core, fingerprinted: for saved pages, the reading's page fields and passages; for the saved
// readings in examples/judgement with their groups, the vocabulary (phrases, narrative words,
// keywords). 2.102 only adds instrumentation around that core, and tests/core.test.mjs proves it:
// it compares this snapshot, taken with the current scripts, against the one 2.101 produced
// (tests/fixtures/core-2.101.json).
//
//   node tools/core-snapshot.mjs [<skill dir to take it with>] > snapshot.json
//
// With another skill folder as the argument (a checkout of an older version, with its own
// node_modules), the snapshot is taken with that folder's scripts; that is how the 2.101 file
// was made. No network: every input is a file in this repository.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(HERE, "..", "..");

/** Saved pages: [fixture file, the URL it was read from]. */
export const PAGES = [
  ["tests/fixtures/example-com.html", "https://example.com/"],
  ["tests/fixtures/getlooploop-vectorscope.html", "https://www.getlooploop.com/vectorscope"],
  ["tests/fixtures/uk-vectorscope.html", "https://www.getlooploop.com/uk/vectorscope"],
  ["tests/fixtures/uk-voicescope.html", "https://www.getlooploop.com/uk/voicescope"],
  ["tests/fixtures/removals.html", "https://example.org/removals"],
];

/** Saved readings with their groups: [reading, groups], relative to the repository root. */
export const READINGS = [
  ["examples/judgement/getlooploop-vectorscope/reading.json", "examples/judgement/getlooploop-vectorscope/groups.json"],
  ["examples/judgement/wikipedia-llm/reading.json", "examples/judgement/wikipedia-llm/groups.json"],
  ["examples/judgement/http-caching-compare/reading-1.json", "examples/judgement/http-caching-compare/groups-1.json"],
  ["examples/judgement/http-caching-compare/reading-2.json", "examples/judgement/http-caching-compare/groups-2.json"],
];

const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** The snapshot, taken with the scripts in `skillDir`. */
export async function coreSnapshot(skillDir = HERE) {
  const lib = (name) => import(pathToFileURL(join(skillDir, "scripts", "lib", name)).href);
  const { readPage } = await lib("reading.mjs");
  const { buildJudgedLens } = await lib("analysis.mjs");
  const { validateGrouping } = await lib("judgement.mjs");

  const pages = [];
  for (const [file, url] of PAGES) {
    // LF whatever the checkout did, so a Windows clone hashes the same bytes.
    const html = readFileSync(join(HERE, file), "utf8").replace(/\r\n/g, "\n");
    const reading = await readPage({ url, html, robots: "skip" });
    pages.push({
      file,
      ok: reading.ok,
      reasonCode: reading.reasonCode,
      passages: reading.passages?.length ?? 0,
      page: reading.page ?? null,
      pageSha256: sha(reading.page ?? null),
      passagesSha256: sha(reading.passages ?? null),
    });
  }

  const vocabulary = [];
  for (const [readingFile, groupsFile] of READINGS) {
    const reading = JSON.parse(readFileSync(join(REPO, readingFile), "utf8"));
    const grouping = validateGrouping(JSON.parse(readFileSync(join(REPO, groupsFile), "utf8")), reading.passages.length);
    const lens = buildJudgedLens(reading, grouping);
    vocabulary.push({
      reading: readingFile,
      passagesSha256: sha(reading.passages),
      phrases: lens.phrases.map((k) => k.term),
      narrative: lens.narrative.map((k) => k.term),
      phrasesSha256: sha(lens.phrases),
      narrativeSha256: sha(lens.narrative),
      keywordsSha256: sha(lens.keywords),
    });
  }
  return { pages, vocabulary };
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const dir = process.argv[2] ? resolve(process.argv[2]) : HERE;
  process.stdout.write(`${JSON.stringify({ takenWith: process.argv[2] ? "another skill folder" : "this skill folder", ...(await coreSnapshot(dir)) }, null, 2)}\n`);
}
