// The inline favicons are generated from assets/favicons/; the module must match the files, and
// every vendor the robots.txt check names must have one (a bot row without its mark is a hole).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { faviconsModule } from "../tools/favicons.mjs";
import { FAVICONS } from "../scripts/lib/favicons.mjs";
import { AI_BOTS } from "../../vectorscope/scripts/lib/robots.mjs";

test("scripts/lib/favicons.mjs is the generated module", () => {
  const committed = readFileSync(new URL("../scripts/lib/favicons.mjs", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.equal(committed, faviconsModule());
});

test("every crawler vendor has a favicon, and each is small", () => {
  for (const bot of AI_BOTS) assert.ok(FAVICONS[bot.vendor], bot.vendor);
  for (const [vendor, uri] of Object.entries(FAVICONS)) assert.ok(uri.length < 2000, `${vendor}: ${uri.length}`);
});
