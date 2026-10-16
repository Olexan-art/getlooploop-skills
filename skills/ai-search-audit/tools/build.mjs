#!/usr/bin/env node
// Bundles the two entry scripts, scripts/read.mjs and scripts/audit.mjs, with everything they
// import: this skill's scripts/lib, the Vectorscope skill's scripts/lib (imported, not copied:
// the reading, the robots.txt rules, the checks and the refusal are that code) and cheerio. The
// result, dist/read.mjs and dist/audit.mjs, runs with plain `node` from a skill folder installed
// on its own, with no npm install and no Vectorscope folder next to it.
//
//   npm run build            writes dist/
//   tests/dist.test.mjs      builds the same thing in memory and fails if dist/ differs
//
// Not minified, names kept, so the bundle stays readable; the source of truth is scripts/.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ENTRIES = ["read", "audit"];

const banner = (name) =>
  [
    `// GENERATED FILE - do not edit. Bundled by esbuild from scripts/${name}.mjs, scripts/lib/ and the`,
    "// Vectorscope skill's scripts/lib/, with cheerio and its dependencies inlined, so it runs with",
    "// Node 20.18 or later and no npm install. The readable source is scripts/. To rebuild after",
    "// changing it: npm install && npm run build (tests/dist.test.mjs fails if this file differs).",
    // Some bundled CommonJS dependencies call require() for Node built-ins; an ES module has none.
    'import { createRequire as __aiSearchAuditCreateRequire } from "node:module";',
    "const require = __aiSearchAuditCreateRequire(import.meta.url);",
  ].join("\n");

const plugins = [
  {
    // One cheerio for both skills' modules, resolved from this skill's node_modules.
    name: "one-cheerio",
    setup(build) {
      build.onResolve({ filter: /^cheerio$/ }, async (args) => {
        if (args.resolveDir === SKILL_DIR) return undefined;
        return build.resolve("cheerio", { kind: args.kind, resolveDir: SKILL_DIR });
      });
    },
  },
  {
    // cheerio imports undici only for cheerio.fromURL(), which neither skill calls.
    name: "stub-undici",
    setup(build) {
      build.onResolve({ filter: /^undici$/ }, () => ({ path: join(SKILL_DIR, "tools", "undici-stub.mjs") }));
    },
  },
  {
    // ... and encoding-sniffer (with iconv-lite's codepage tables) only for loadBuffer() and the
    // stream loaders; every page reaches cheerio.load() as text.
    name: "stub-encoding-sniffer",
    setup(build) {
      build.onResolve({ filter: /^encoding-sniffer$/ }, () => ({ path: join(SKILL_DIR, "tools", "encoding-stub.mjs") }));
    },
  },
];

export function buildOptions(name) {
  return {
    absWorkingDir: SKILL_DIR,
    entryPoints: [join(SKILL_DIR, "scripts", `${name}.mjs`)],
    outfile: join(SKILL_DIR, "dist", `${name}.mjs`),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    minify: false,
    keepNames: true,
    legalComments: "inline",
    charset: "utf8",
    logLevel: "warning",
    banner: { js: banner(name) },
    plugins,
    write: false,
  };
}

/** Builds every entry in memory: [{ name, path, text }]. Throws if esbuild is not installed. */
export async function bundle() {
  const esbuild = await import("esbuild");
  const out = [];
  for (const name of ENTRIES) {
    const result = await esbuild.build(buildOptions(name));
    const [file] = result.outputFiles.filter((f) => f.path.endsWith(".mjs"));
    out.push({ name, path: file.path, text: file.text });
  }
  return out;
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  for (const file of await bundle()) {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.text);
    console.log(`built ${relative(SKILL_DIR, file.path).replace(/\\/g, "/")}  ${(Buffer.byteLength(file.text) / 1024).toFixed(0)} KiB`);
  }
}
