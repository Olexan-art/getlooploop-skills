// The version is written twice: SKILL_VERSION (what reports and exports carry) and package.json
// (what npm and the release tag read). Two copies drift, so this test holds them together.
// Versions count in thousandths — 2.101, 2.102, … — and package.json writes 2.101 as 2.101.0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SKILL_VERSION } from "../scripts/lens.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("SKILL_VERSION and package.json name the same version", () => {
  assert.equal(`${SKILL_VERSION}.0`, pkg.version);
});

test("the minor part is three digits, so versions count in thousandths", () => {
  assert.match(SKILL_VERSION, /^\d+\.\d{3}$/);
});
