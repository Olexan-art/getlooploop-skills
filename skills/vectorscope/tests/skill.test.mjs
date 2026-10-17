// SKILL.md is what the agent follows, so two of its promises are held here. "Show the report"
// presents one file, the HTML: in claude.ai the last file presented is the one that opens, and
// when the step listed report.html, report.md and export.json, the user was handed the JSON.
// And the description says what the skill does, not how the report looks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const section = (title) => {
  const start = skill.indexOf(`## ${title}\n`);
  assert.ok(start >= 0, `SKILL.md has a "${title}" section`);
  const end = skill.indexOf("\n## ", start + 4);
  return skill.slice(start, end < 0 ? undefined : end);
};
const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)[1];
const description = /^description: (.*)$/m.exec(frontmatter)[1];
const intro = skill.slice(skill.indexOf("\n# "), skill.indexOf("\n## "));

test("Show the report presents only report.html and never opens the JSON or the Markdown", () => {
  const show = section("Show the report");
  assert.match(show, /Present one file: `report\.html`/);
  assert.match(show, /present \*\*only `report\.html`\*\*/);
  assert.match(show, /Never open or preview `export\.json` or `report\.md` as the result/);
  assert.match(show, /the HTML is the report/);
  // Every environment gets the rule: claude.ai, Claude Code, any other agent.
  for (const env of ["claude.ai", "Claude Code", "any other agent"]) assert.ok(show.includes(env), env);
  // The old wording that handed claude.ai users three files must not come back.
  assert.ok(!/Save `report\.html` \(and `report\.md`, `export\.json`\)/.test(show), "the three-file save-and-present wording is gone");
  assert.ok(!/present (them|all|each)/i.test(show));
});

test("the description and the intro say what the skill does, not how the report looks", () => {
  for (const text of [description, intro]) {
    assert.ok(!/\b(theme|dark|light|sprite|ornament|motanka|EN \| UK|English or Ukrainian|visual)\b/i.test(text), text.slice(0, 120));
    assert.ok(!/Russian/i.test(text), "the refusal is not advertised in the description");
  }
});
