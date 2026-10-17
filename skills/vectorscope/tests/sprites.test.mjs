// scripts/lib/sprites.mjs is generated from assets/*.webp; a changed asset without a rebuild
// would ship the old picture. Also keeps the decorations small: they are in every report.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spritesModule } from "../tools/sprites.mjs";
import { CORNER, MOTANKA, ORNAMENT } from "../scripts/lib/sprites.mjs";

test("sprites.mjs matches the assets", () => {
  const committed = readFileSync(new URL("../scripts/lib/sprites.mjs", import.meta.url), "utf8");
  assert.equal(committed, spritesModule(), "out of date — run node tools/sprites.mjs");
});

test("the decorations stay small", () => {
  assert.ok(ORNAMENT.length + MOTANKA.length + CORNER.length < 110_000);
});

test("brandmark.mjs matches the GetLoopLoop mark asset, and stays small", async () => {
  const { brandmarkModule } = await import("../tools/brandmark.mjs");
  const { GLL_MARK, GLL_MARK_LIGHT } = await import("../scripts/lib/brandmark.mjs");
  assert.equal(readFileSync(new URL("../scripts/lib/brandmark.mjs", import.meta.url), "utf8"), brandmarkModule(), "out of date — run node tools/brandmark.mjs");
  for (const m of [GLL_MARK, GLL_MARK_LIGHT]) assert.ok(m.startsWith("data:image/webp;base64,") && m.length < 12000, String(m.length));
});
