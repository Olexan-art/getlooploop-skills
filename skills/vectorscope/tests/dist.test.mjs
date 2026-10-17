// dist/read.mjs, dist/lens.mjs and the chunk they share in dist/chunks/ are generated from
// scripts/ and committed, so the skill runs as a folder of its own with no npm install. This test
// rebuilds them in memory and fails if the committed files differ: a change to scripts/ without
// npm run build would otherwise ship a skill that runs old code.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

let bundle = null;
try {
  ({ bundle } = await import("../tools/build.mjs"));
  await import("esbuild");
} catch {
  bundle = null;
}

/** A GitHub file connector refused a 1.1 MB audit.mjs and served a 732 KB read.mjs: every file in dist/ stays under 700 KB. */
const MAX_FILE_BYTES = 700 * 1024;

const distFiles = () => {
  const dir = new URL("../dist/", import.meta.url);
  if (!existsSync(dir)) return [];
  const chunkDir = new URL("chunks/", dir);
  const chunks = existsSync(chunkDir) ? readdirSync(chunkDir).map((f) => `chunks/${f}`) : [];
  return [...readdirSync(dir).filter((f) => f.endsWith(".mjs")), ...chunks].sort();
};

test("dist/ equals a fresh build of scripts/", { skip: bundle ? false : "esbuild is not installed (npm install to run this test)" }, async () => {
  for (const file of await bundle()) {
    assert.ok(existsSync(file.path), `dist/${file.name} is missing; run npm run build`);
    const committed = readFileSync(file.path, "utf8").replace(/\r\n/g, "\n");
    assert.ok(committed === file.text.replace(/\r\n/g, "\n"), `dist/${file.name} is out of date with scripts/; run npm run build and commit dist/`);
  }
});

test("dist/ holds exactly the files a build writes: no stale chunk left behind", { skip: bundle ? false : "esbuild is not installed (npm install to run this test)" }, async () => {
  assert.deepEqual(distFiles(), (await bundle()).map((f) => f.name));
});

test("the bundles import only Node itself and their own chunks, so the skill folder stands alone", () => {
  for (const name of distFiles()) {
    const text = readFileSync(new URL(`../dist/${name}`, import.meta.url), "utf8");
    const imports = [...text.matchAll(/(?:^|[;\s}])import\s*(?:[\w$*{}\s,]+?\s*from\s*)?"([^"]+)"/g)].map((m) => m[1]);
    const bad = imports.filter((s) => !s.startsWith("node:") && !/^\.\.?\/(?:chunks\/)?chunk-[\w-]+\.mjs$/.test(s));
    assert.deepEqual(bad, [], name);
  }
});

test("no file in dist/ is large enough for a file connector to refuse it", () => {
  for (const name of distFiles()) assert.ok(readFileSync(new URL(`../dist/${name}`, import.meta.url)).length < MAX_FILE_BYTES, name);
});
