#!/usr/bin/env node
// Bundles the two entry scripts, scripts/read.mjs and scripts/lens.mjs, with their dependencies
// (cheerio and everything it pulls in) into dist/read.mjs and dist/lens.mjs, so the skill runs
// with plain `node` and no `npm install`: claude.ai's code-execution sandbox, and other places
// where package installs are blocked, get a skill that works as uploaded.
//
//   npm run build            writes dist/
//   tests/dist.test.mjs      builds the same thing in memory and fails if dist/ differs
//
// The bundle is minified with names kept, and split: the code both entries share sits in
// dist/chunks/, so no file is large enough for an agent's file connector to refuse it. The source
// of truth is still scripts/. esbuild is a devDependency only: nobody running the skill needs it.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ENTRIES = ["read", "lens"];

const banner = () =>
  [
    "// GENERATED FILE - do not edit. Bundled by esbuild from scripts/read.mjs, scripts/lens.mjs and scripts/lib/,",
    "// with cheerio and its dependencies inlined, so it runs with Node 20.18 or later and no npm install.",
    "// The readable source is scripts/. To rebuild after changing it: npm install && npm run build",
    "// (tests/dist.test.mjs fails if this file differs from a fresh build).",
    // Some bundled CommonJS dependencies call require() for Node built-ins; an ES module has no
    // require of its own, so give it one.
    'import { createRequire as __vectorscopeCreateRequire } from "node:module";',
    "const require = __vectorscopeCreateRequire(import.meta.url);",
  ].join("\n");

// cheerio's only use of undici is cheerio.fromURL(), which the skill never calls.
const stubUndici = {
  name: "stub-undici",
  setup(build) {
    build.onResolve({ filter: /^undici$/ }, () => ({ path: join(SKILL_DIR, "tools", "undici-stub.mjs") }));
  },
};

export function buildOptions() {
  return {
    absWorkingDir: SKILL_DIR,
    entryPoints: Object.fromEntries(ENTRIES.map((name) => [name, join(SKILL_DIR, "scripts", `${name}.mjs`)])),
    outdir: join(SKILL_DIR, "dist"),
    entryNames: "[name]",
    chunkNames: "chunks/[name]-[hash]",
    outExtension: { ".js": ".mjs" },
    bundle: true,
    splitting: true,
    platform: "node",
    format: "esm",
    // cheerio declares Node 20.18.1 or later, and nothing older was tested.
    target: "node20",
    minify: true,
    keepNames: true,
    legalComments: "eof",
    charset: "utf8",
    logLevel: "warning",
    banner: { js: banner() },
    plugins: [stubUndici],
    write: false,
  };
}

/** Builds every file of dist/ in memory: [{ name, path, text }], the entries and their shared chunks. Throws if esbuild is not installed. */
export async function bundle() {
  const esbuild = await import("esbuild");
  const result = await esbuild.build(buildOptions());
  // esbuild keeps an entry script's shebang on the first line, above the banner.
  return result.outputFiles
    .filter((f) => f.path.endsWith(".mjs"))
    .map((f) => ({ name: relative(join(SKILL_DIR, "dist"), f.path).split("\\").join("/"), path: f.path, text: f.text }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const files = await bundle();
  rmSync(join(SKILL_DIR, "dist", "chunks"), { recursive: true, force: true });
  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.text);
    console.log(`built ${relative(SKILL_DIR, file.path).replace(/\\/g, "/")}  ${(Buffer.byteLength(file.text) / 1024).toFixed(0)} KiB`);
  }
}
