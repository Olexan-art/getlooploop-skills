// Every text and UI colour pair of the report passes WCAG AA in both themes (tools/contrast.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { measure } from "../tools/contrast.mjs";
import { REPORT_CSS } from "../scripts/lib/html.mjs";

test("WCAG AA contrast for every token pair, light and dark", () => {
  const rows = measure(REPORT_CSS);
  assert.ok(rows.length > 100);
  assert.ok(rows.some((r) => r.theme === "dark") && rows.some((r) => r.theme === "light"));
  const bad = rows.filter((r) => !r.ok).map((r) => `${r.theme} ${r.fg} on ${r.bg} ${r.ratio}:1 < ${r.need}`);
  assert.deepEqual(bad, []);
});
