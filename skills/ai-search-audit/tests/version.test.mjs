// The version is written twice: SKILL_VERSION (what reports and exports carry) and package.json
// (what npm and a release tag read); SKILL.md states it a third time. They are held together here.
// Versions count in thousandths — 2.101, 2.102, … — and package.json writes 2.101 as 2.101.0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SKILL_VERSION } from "../scripts/lib/version.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

test("SKILL_VERSION, package.json and SKILL.md name the same version", () => {
  assert.equal(`${SKILL_VERSION}.0`, pkg.version);
  assert.ok(skill.includes(`Version ${SKILL_VERSION}.`), "SKILL.md states the version");
});

test("the minor part is three digits, so versions count in thousandths", () => {
  assert.match(SKILL_VERSION, /^\d+\.\d{3}$/);
});
