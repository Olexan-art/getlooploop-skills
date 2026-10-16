import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRobots, rulesFor, judgePath, patternMatches, judgeBots, robotsReport } from "../scripts/lib/robots.mjs";

const ROBOTS = `
# a comment
User-agent: *
Disallow: /private/
Allow: /private/open$

User-agent: GPTBot
User-agent: CCBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /
Disallow: /drafts/*.html

Sitemap: https://example.org/sitemap.xml
`;

const byToken = (text, url) => Object.fromEntries(judgeBots(text, url).map((b) => [b.token, b]));

test("groups: consecutive user-agent lines share one group", () => {
  const groups = parseRobots(ROBOTS);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups[1].agents, ["gptbot", "ccbot"]);
});

test("a named group replaces *, matched case-insensitively", () => {
  const groups = parseRobots(ROBOTS);
  assert.equal(rulesFor(groups, "gptbot").group, "gptbot");
  assert.equal(rulesFor(groups, "ClaudeBot").group, "*");
});

test("groups naming the same token are combined", () => {
  const groups = parseRobots("User-agent: Bot\nDisallow: /a\n\nUser-agent: Bot\nDisallow: /b\n");
  assert.equal(rulesFor(groups, "Bot").rules.length, 2);
});

test("longest match wins; allow wins a tie", () => {
  const rules = [
    { allow: false, pattern: "/shop" },
    { allow: true, pattern: "/shop/item" },
  ];
  assert.equal(judgePath(rules, "/shop/item/1").allowed, true);
  assert.equal(judgePath(rules, "/shop/cart").allowed, false);
  const tie = [
    { allow: false, pattern: "/x" },
    { allow: true, pattern: "/x" },
  ];
  assert.equal(judgePath(tie, "/x").allowed, true);
});

test("wildcards and the end anchor", () => {
  assert.equal(patternMatches("/drafts/*.html", "/drafts/a/b.html"), true);
  assert.equal(patternMatches("/private/open$", "/private/open"), true);
  assert.equal(patternMatches("/private/open$", "/private/open/more"), false);
  assert.equal(patternMatches("/*.pdf$", "/files/a.pdf?x=1"), false);
});

test("an empty Disallow allows everything", () => {
  assert.equal(judgePath([{ allow: false, pattern: "" }], "/anything").allowed, true);
});

test("per-bot verdicts for one URL", () => {
  const verdicts = byToken(ROBOTS, "https://example.org/private/x");
  assert.equal(verdicts.GPTBot.allowed, false);
  assert.equal(verdicts.CCBot.allowed, false);
  assert.equal(verdicts["OAI-SearchBot"].allowed, true);
  assert.equal(verdicts.ClaudeBot.allowed, false, "* disallows /private/");
  assert.equal(verdicts.ClaudeBot.rule, "Disallow: /private/");
  assert.equal(byToken(ROBOTS, "https://example.org/private/open").ClaudeBot.allowed, true, "the longer Allow wins");
  assert.equal(byToken(ROBOTS, "https://example.org/drafts/2026/a.html")["OAI-SearchBot"].allowed, false);
});

test("a version suffix and percent-encoding", () => {
  const groups = parseRobots("User-agent: GPTBot/1.1\nDisallow: /caf%C3%A9\n");
  assert.equal(rulesFor(groups, "GPTBot").group, "GPTBot");
  assert.equal(judgePath(rulesFor(groups, "GPTBot").rules, "/café/menu").allowed, false);
});

test("no robots.txt allows all; an unreachable one blocks all", () => {
  assert.ok(robotsReport({ status: "none", url: "u", httpStatus: 404 }, "https://example.org/").bots.every((b) => b.allowed));
  assert.ok(robotsReport({ status: "unreachable", url: "u", httpStatus: 503 }, "https://example.org/").bots.every((b) => !b.allowed));
});
