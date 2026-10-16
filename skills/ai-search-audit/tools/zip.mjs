#!/usr/bin/env node
// Packs the skill for upload to claude.ai (Customize > Skills > "+" > Create skill > Upload a skill):
// dist-release/ai-search-audit.zip at the repository root, holding the skill folder itself as the
// top level (ai-search-audit/SKILL.md, not SKILL.md at the root), which is the shape claude.ai looks for.
// The same packer as the Vectorscope skill's tools/zip.mjs (a script, so it is not importable).
//
//   npm run zip
//
// In: SKILL.md, dist/ (the bundled scripts, which need no npm install), the favicons' NOTICE and
// the repository's LICENSE. Out: scripts/ (it imports the Vectorscope skill's source, which an
// installed folder does not have; the readable source is in the repository), node_modules, tests,
// tools, assets, examples, docs. Before writing, it checks the frontmatter rules the upload enforces:
// a name of lowercase letters, digits and hyphens (64 at most) that matches the folder, and a
// description of 1,024 characters at most, with no XML tags. The archive is deterministic (sorted
// entries, one fixed timestamp), so the same tree always gives the same bytes.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = resolve(SKILL_DIR, "..", "..");
const FOLDER = "ai-search-audit";
const OUT = join(REPO_DIR, "dist-release", `${FOLDER}.zip`);
// The Skills API documents a 30 MB uncompressed ceiling; claude.ai names "size limits" without a
// number, so the same ceiling is used here as a guard.
const MAX_UNCOMPRESSED = 30 * 1024 * 1024;

function fail(message) {
  console.error(`REFUSED  ${message}`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function checkFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!match) fail("SKILL.md does not start with YAML frontmatter.");
  const field = (key) => {
    const line = match[1].split(/\r?\n/).find((l) => l.startsWith(`${key}:`));
    return line ? line.slice(key.length + 1).trim() : null;
  };
  const name = field("name");
  const description = field("description");
  if (!name || !/^[a-z0-9-]{1,64}$/.test(name)) fail(`name ${JSON.stringify(name)} must be 1-64 lowercase letters, digits and hyphens.`);
  if (/anthropic|claude/.test(name)) fail(`name ${JSON.stringify(name)} uses a reserved word.`);
  if (name !== FOLDER) fail(`name ${JSON.stringify(name)} must match the folder name ${FOLDER}.`);
  if (!description) fail("description is missing.");
  if ([...description].length > 1024) fail(`description is ${[...description].length} characters; the limit is 1,024.`);
  if (/<[^>]*>/.test(description)) fail("description holds an XML tag.");
  return { name, descriptionChars: [...description].length };
}

// CRC-32 (IEEE), as the ZIP format needs it; zlib.crc32 only arrived in Node 20.15 and 22.2.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 2026-01-01 00:00 in MS-DOS time, for every entry.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // made by: Unix, 2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // -rw-r--r--
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + packed.length;
  }
  const centralSize = centrals.reduce((s, b) => s + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

for (const required of ["SKILL.md", "dist/read.mjs", "dist/audit.mjs", "assets/favicons/NOTICE.txt"]) {
  if (!existsSync(join(SKILL_DIR, required))) fail(`${required} is missing${required.startsWith("dist/") ? "; run npm run build" : ""}.`);
}
const license = join(REPO_DIR, "LICENSE");
if (!existsSync(license)) fail("LICENSE is missing at the repository root.");

// Text files go in with LF line endings whatever the checkout did, so every machine builds the same zip.
const lf = (path) => (/\.(mjs|md|txt)$|LICENSE$/.test(path) ? Buffer.from(readFileSync(path, "utf8").replace(/\r\n/g, "\n"), "utf8") : readFileSync(path));

const fm = checkFrontmatter(readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8"));
const files = [join(SKILL_DIR, "SKILL.md"), ...walk(join(SKILL_DIR, "dist")), join(SKILL_DIR, "assets", "favicons", "NOTICE.txt")];
const entries = files
  .map((path) => ({ name: `${FOLDER}/${relative(SKILL_DIR, path).replace(/\\/g, "/")}`, data: lf(path) }))
  .concat([{ name: `${FOLDER}/LICENSE`, data: lf(license) }])
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const total = entries.reduce((s, e) => s + e.data.length, 0);
if (total > MAX_UNCOMPRESSED) fail(`${total} bytes uncompressed; keep it under ${MAX_UNCOMPRESSED}.`);

const archive = zip(entries);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, archive);
console.log(`name      ${fm.name} (matches the folder) · description ${fm.descriptionChars}/1024 characters`);
for (const e of entries) console.log(`  ${String(e.data.length).padStart(9)}  ${e.name}`);
console.log(`files     ${entries.length} · ${total} bytes uncompressed`);
console.log(`zip       ${relative(REPO_DIR, OUT).replace(/\\/g, "/")} · ${statSync(OUT).size} bytes`);
