// dist/read.mjs and dist/audit.mjs are generated from scripts/ (and the Vectorscope skill's
// scripts/lib, which they import) and committed, so the skill runs as a folder of its own with no
// npm install. This test rebuilds them in memory and fails if the committed files differ.
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
    const committed = readFileSync(file.path, "utf8").replace(/\r\n/g, "\n");
    assert.ok(committed === file.text.replace(/\r\n/g, "\n"), `dist/${file.name}.mjs is out of date with scripts/; run npm run build and commit dist/`);
  }
});

test("the bundles import nothing outside Node itself, so the skill folder stands alone", () => {
  for (const name of ["read", "audit"]) {
    const path = new URL(`../dist/${name}.mjs`, import.meta.url);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const imports = [...text.matchAll(/^import\s.*?from\s+"([^"]+)";?$/gm)].map((m) => m[1]);
    assert.ok(imports.every((s) => s.startsWith("node:")), `${name}: ${imports.filter((s) => !s.startsWith("node:")).join(", ")}`);
  }
});
