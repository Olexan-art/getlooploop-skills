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

// The plugin manifests at the repository root (Antigravity, Gemini CLI, Claude Code) each write the
// version again; they must name the skill's version, or an install reports another release.
const root = new URL("../../../", import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8"));

test("every plugin manifest names the skill's version", () => {
  const want = `${SKILL_VERSION}.0`;
  assert.equal(json("plugin.json").version, want, "plugin.json");
  assert.equal(json("gemini-extension.json").version, want, "gemini-extension.json");
  assert.equal(json(".claude-plugin/plugin.json").version, want, ".claude-plugin/plugin.json");
  for (const p of [".claude-plugin/marketplace.json", ".agents/plugins/marketplace.json"]) {
    for (const plugin of json(p).plugins) assert.equal(plugin.version, want, `${p}: ${plugin.name}`);
  }
});

test("the manifests name the skill and one marketplace, as the READMEs tell people to type", () => {
  const names = [json("plugin.json").name, json("gemini-extension.json").name, json(".claude-plugin/plugin.json").name, ...json(".claude-plugin/marketplace.json").plugins.map((p) => p.name), ...json(".agents/plugins/marketplace.json").plugins.map((p) => p.name)];
  assert.deepEqual([...new Set(names)], ["vectorscope"]);
  assert.equal(json(".claude-plugin/marketplace.json").name, json(".agents/plugins/marketplace.json").name);
  for (const readme of ["README.md", "README.uk.md", "README.pl.md"]) {
    const text = readFileSync(new URL(readme, root), "utf8");
    assert.ok(text.includes("agy plugin install https://github.com/Olexan-art/getlooploop-skills"), `${readme}: Antigravity`);
    assert.ok(text.includes(`/plugin install vectorscope@${json(".claude-plugin/marketplace.json").name}`), `${readme}: Claude Code`);
  }
});
