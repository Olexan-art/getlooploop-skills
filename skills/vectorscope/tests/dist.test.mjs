// dist/read.mjs and dist/lens.mjs are generated from scripts/ and committed, so the skill runs with
// no npm install. This test rebuilds them in memory and fails if the committed files differ:
// a change to scripts/ without `npm run build` would otherwise ship a skill that runs old code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

let bundle = null;
try {
  ({ bundle } = await import("../tools/build.mjs"));
  await import("esbuild");
} catch {
  bundle = null;
}

test("dist/ equals a fresh build of scripts/", { skip: bundle ? false : "esbuild is not installed (npm install to run this test)" }, async () => {
  for (const file of await bundle()) {
    assert.ok(existsSync(file.path), `${file.name}: dist/${file.name}.mjs is missing; run npm run build`);
    // Compare without line-ending differences a checkout may introduce.
    const committed = readFileSync(file.path, "utf8").replace(/\r\n/g, "\n");
    assert.ok(committed === file.text.replace(/\r\n/g, "\n"), `dist/${file.name}.mjs is out of date with scripts/; run npm run build and commit dist/`);
  }
});
