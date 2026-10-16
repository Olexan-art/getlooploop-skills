// robots.txt through the audit: the Vectorscope's RFC 9309 matching (reused, not copied), split
// into the search engines, the AI search and user-fetch bots, and the training bots.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AI_BOTS } from "../../vectorscope/scripts/lib/robots.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { codesOf, findingOf, page, readingOf } from "./helpers.mjs";

const opts = (robotsText) => ({ robotsText });

test("a named group replaces *, so Googlebot allowed by its own group is not blocked by *", async () => {
  const codes = await codesOf(page(), {}, opts("User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nUser-agent: Bingbot\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: Claude-SearchBot\nUser-agent: Claude-User\nUser-agent: PerplexityBot\nUser-agent: Perplexity-User\nAllow: /\n"));
  assert.ok(!codes.includes("search_engine_blocked"));
  assert.ok(!codes.includes("ai_search_blocked"));
  assert.ok(codes.includes("ai_training_blocked"), "GPTBot, ClaudeBot, Google-Extended and CCBot fall to * and are blocked");
});

test("the longest pattern wins and Allow wins a tie", async () => {
  const r = await readingOf(page(), {}, opts("User-agent: *\nDisallow: /pa\nAllow: /page\n"));
  assert.ok(r.robots.bots.every((b) => b.allowed));
  const s = await readingOf(page(), {}, opts("User-agent: *\nAllow: /pa\nDisallow: /page\n"));
  assert.ok(s.robots.bots.every((b) => !b.allowed));
});

test("blocked search engines and AI search bots are blocking; each lands on its robots row", async () => {
  const f = await findingOf(page(), "search_engine_blocked", {}, opts("User-agent: Bingbot\nDisallow: /\n"));
  assert.equal(f.severity, "blocking");
  assert.deepEqual(f.evidence.bots, ["Bingbot"]);
  const r = await readingOf(page(), {}, opts("User-agent: PerplexityBot\nDisallow: /\n"));
  const m = buildModel(r);
  assert.ok(m.robots.find((x) => x.id === "ai_search").pins.some((x) => x.code === "ai_search_blocked"));
  assert.equal(m.tiles.find((t) => t.id === "find").state, "block");
  assert.ok(m.bots.length === AI_BOTS.length);
});

test("a saved page without robots.txt: the robots row and the checklist cell say not measured", async () => {
  const r = await readingOf(page(), {}, { robotsText: null });
  const m = buildModel(r);
  assert.equal(r.robots.status, "not_checked");
  assert.equal(m.checklist.find((c) => c.id === "robots_search_bots").state, "na");
  assert.equal(m.robots.find((x) => x.id === "search").v[0], "not measured");
});
