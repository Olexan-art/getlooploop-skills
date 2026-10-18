// A passage that opens on a brand written in lower case with a capital inside (pdfFiller, iPhone)
// opens a sentence; mid_sentence_start must not fire on it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runChecks } from "../scripts/lib/checks.mjs";
import { reading } from "./helpers.mjs";

test("mid_sentence_start: a lower-case brand with a capital inside opens a sentence", () => {
  const f = runChecks(reading(["Intro text for the page.", "pdfFiller converts the file in seconds.", "and then the text goes on mid-sentence."])).find((x) => x.code === "mid_sentence_start");
  assert.deepEqual(f.passages, [2]);
});
