// The core must not change: 2.102 adds instrumentation and presentation around the reading, and
// every passage, every page field and the vocabulary must come out exactly as 2.101 made them.
// tests/fixtures/core-2.101.json was taken with the 2.101 scripts (commit e1da92b) by
// tools/core-snapshot.mjs; this test takes the same snapshot with the current scripts and
// requires it to be identical, field by field and hash by hash.
//
// 2.103 changes the chunker on purpose, and the snapshot was updated for exactly one entry, marked
// "changedIn": "2.103" in the file with the 2.101 values kept under "before2103":
//
//   examples/judgement/http-caching-compare/reading-1.json (MDN's HTTP caching guide). Its h3
//   "Validation" under "Common caching patterns" repeats the h2 "Validation"; 2.102 took that line
//   for the h2 and cut the section there. 2.103 keeps it inside "Common caching patterns", so
//   passages #21 to #23 are re-cut (five passages under that heading instead of two plus three
//   under "Validation"), the slot freed holds "Help improve MDN" (#25, past the cap before) and
//   "See also" moves from #25 to #24. The reading was taken again; its passages, and with them
//   the phrase order and the narrative and keyword counts, follow. The phrase list itself is the
//   same set of phrases.
//
// No saved page in PAGES has a line that repeats an earlier h2, so every page entry is still the
// 2.101 one, unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { coreSnapshot } from "../tools/core-snapshot.mjs";
import { extractVisiblePageText } from "../scripts/lib/extract.mjs";

const golden = JSON.parse(readFileSync(new URL("./fixtures/core-2.101.json", import.meta.url), "utf8"));
const now = await coreSnapshot();

test("page fields and passages are byte-identical to 2.101 for every saved page", () => {
  assert.equal(now.pages.length, golden.pages.length);
  now.pages.forEach((p, i) => {
    const g = golden.pages[i];
    assert.equal(p.file, g.file);
    assert.deepEqual(p.page, g.page, `${p.file}: page fields`);
    assert.equal(p.pageSha256, g.pageSha256, `${p.file}: page hash`);
    assert.equal(p.passagesSha256, g.passagesSha256, `${p.file}: passages hash`);
    assert.equal(p.passages, g.passages, `${p.file}: passage count`);
  });
});

test("phrases, narrative words and keywords are identical to 2.101 for the saved readings in examples/judgement", () => {
  assert.equal(now.vocabulary.length, golden.vocabulary.length);
  now.vocabulary.forEach((v, i) => {
    const g = golden.vocabulary[i];
    assert.equal(v.passagesSha256, g.passagesSha256, `${v.reading}: the saved passages`);
    assert.deepEqual(v.phrases, g.phrases, `${v.reading}: phrases`);
    assert.deepEqual(v.narrative, g.narrative, `${v.reading}: narrative words`);
    assert.equal(v.phrasesSha256, g.phrasesSha256, `${v.reading}: phrase counts`);
    assert.equal(v.narrativeSha256, g.narrativeSha256, `${v.reading}: narrative counts`);
    assert.equal(v.keywordsSha256, g.keywordsSha256, `${v.reading}: keywords`);
  });
});

test("2.103 changed the snapshot for the MDN reading only, and kept the same phrases", () => {
  const changed = golden.vocabulary.filter((v) => v.changedIn === "2.103");
  assert.deepEqual(changed.map((v) => v.reading), ["examples/judgement/http-caching-compare/reading-1.json"]);
  assert.ok(golden.pages.every((p) => !p.changedIn), "no saved page changed");
  const [mdn] = changed;
  assert.notEqual(mdn.passagesSha256, mdn.before2103.passagesSha256, "the passages were re-cut");
  assert.deepEqual([...mdn.phrases].sort(), [...mdn.before2103.phrases].sort(), "the same phrases, in a new order");
});

test("the observer only looks: extraction with and without it is identical", () => {
  for (const file of ["removals.html", "getlooploop-vectorscope.html", "uk-voicescope.html"]) {
    const html = readFileSync(new URL(`./fixtures/${file}`, import.meta.url), "utf8");
    const plain = extractVisiblePageText(cheerio.load(html));
    const calls = [];
    const observer = {
      removing: (_, selection, step) => calls.push([step, selection.length]),
      headerTrimmed: () => calls.push(["header"]),
      mainRegion: () => calls.push(["main"]),
    };
    const watched = extractVisiblePageText(cheerio.load(html), observer);
    assert.deepEqual(watched, plain, file);
    assert.ok(calls.length >= 2, `${file}: the observer was called`);
  }
});
