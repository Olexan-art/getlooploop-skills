// robots.txt for the page's own origin: fetched once, parsed per RFC 9309, and asked whether
// each AI and search crawler may fetch the page's path. A layer around the reading; the
// chunker never sees any of it.

import { judgePublicUrl } from "./guards.mjs";
import { CRAWLER_UA, FETCH_TIMEOUT_MS, MAX_REDIRECTS } from "./fetchPage.mjs";

// RFC 9309 asks crawlers to parse at least 500 KiB; anything past it is ignored, not refused.
export const MAX_ROBOTS_BYTES = 500 * 1024;

/**
 * The crawlers the report checks, with their robots.txt product tokens as each vendor documents
 * them (sources in SKILL.md). `kind`: "search" builds an assistant's search index, "user" fetches
 * a page when a person asks, "training" collects model-training data, "index" is a web search
 * engine whose index assistants answer from.
 * `honours`: false where the vendor says robots.txt may not apply to that fetcher.
 */
export const AI_BOTS = [
  { token: "OAI-SearchBot", vendor: "OpenAI", kind: "search", honours: true },
  { token: "ChatGPT-User", vendor: "OpenAI", kind: "user", honours: false },
  { token: "GPTBot", vendor: "OpenAI", kind: "training", honours: true },
  { token: "Claude-SearchBot", vendor: "Anthropic", kind: "search", honours: true },
  { token: "Claude-User", vendor: "Anthropic", kind: "user", honours: true },
  { token: "ClaudeBot", vendor: "Anthropic", kind: "training", honours: true },
  { token: "PerplexityBot", vendor: "Perplexity", kind: "search", honours: true },
  { token: "Perplexity-User", vendor: "Perplexity", kind: "user", honours: false },
  { token: "Google-Extended", vendor: "Google", kind: "training", honours: true },
  { token: "Googlebot", vendor: "Google", kind: "index", honours: true },
  { token: "Bingbot", vendor: "Microsoft", kind: "index", honours: true },
  { token: "CCBot", vendor: "Common Crawl", kind: "training", honours: true },
];

/** Parse robots.txt into groups: [{ agents: [lowercase tokens], rules: [{ allow, pattern }] }]. */
export function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  const lines = String(text ?? "").slice(0, MAX_ROBOTS_BYTES).replace(/^﻿/, "").split(/\r\n|\r|\n/);
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      // Consecutive user-agent lines share one group; a user-agent after a rule opens a new one.
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      // "GPTBot/1.0" names the product token GPTBot.
      current.agents.push(value.split("/")[0].trim().toLowerCase());
      lastWasAgent = true;
    } else if (key === "allow" || key === "disallow") {
      lastWasAgent = false;
      if (!current) continue; // A rule before any user-agent belongs to nobody.
      current.rules.push({ allow: key === "allow", pattern: value });
    } else {
      // Sitemap, crawl-delay and other extensions neither open nor close a group.
      lastWasAgent = false;
    }
  }
  return groups;
}

/**
 * The rules that apply to one product token: every group naming it (case-insensitively),
 * combined; else every "*" group, combined; else none.
 */
export function rulesFor(groups, token) {
  const wanted = token.toLowerCase();
  const own = groups.filter((group) => group.agents.includes(wanted));
  const chosen = own.length ? own : groups.filter((group) => group.agents.includes("*"));
  return {
    group: own.length ? token : chosen.length ? "*" : null,
    rules: chosen.flatMap((group) => group.rules),
  };
}

/** Normalise percent-encoding so "/caf%C3%A9" and "/café" compare equal. */
function normalisePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Whether a robots pattern ("*" any run, "$" end) matches a path. */
export function patternMatches(pattern, path) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = body
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${regex}${anchored ? "$" : ""}`).test(path);
}

/**
 * Whether a path is allowed by a rule list: the longest matching pattern wins; on a tie, allow
 * wins (RFC 9309 2.2.2: the least restrictive). An empty Disallow matches nothing.
 * Returns { allowed, rule } with the winning rule, or rule null when nothing matched.
 */
export function judgePath(rules, rawPath) {
  const path = normalisePath(rawPath || "/");
  if (path === "/robots.txt") return { allowed: true, rule: null };
  let best = null;
  for (const rule of rules) {
    if (!rule.pattern) continue;
    const pattern = normalisePath(rule.pattern);
    if (!patternMatches(pattern, path)) continue;
    const length = pattern.length;
    if (!best || length > best.length || (length === best.length && rule.allow && !best.rule.allow)) {
      best = { length, rule };
    }
  }
  return best ? { allowed: best.rule.allow, rule: `${best.rule.allow ? "Allow" : "Disallow"}: ${best.rule.pattern}` } : { allowed: true, rule: null };
}

/** The path and query a crawler asks for. */
export function pathOf(url) {
  const parsed = new URL(url);
  return `${parsed.pathname || "/"}${parsed.search}`;
}

/** Every bot's verdict for one URL against parsed robots.txt text. */
export function judgeBots(text, url, bots = AI_BOTS) {
  const groups = parseRobots(text);
  const path = pathOf(url);
  return bots.map((bot) => {
    const { group, rules } = rulesFor(groups, bot.token);
    const verdict = judgePath(rules, path);
    return { ...bot, allowed: verdict.allowed, rule: verdict.rule, group };
  });
}

/**
 * Fetch robots.txt for a page's origin. Returns
 *   { status: "ok", url, httpStatus, text }        2xx, parsed
 *   { status: "none", url, httpStatus }            4xx: no rules, everything allowed (RFC 9309 2.3.1.3)
 *   { status: "unreachable", url, httpStatus? }    5xx or network: RFC 9309 says assume complete disallow
 */
export async function fetchRobots(pageUrl) {
  const origin = new URL(pageUrl).origin;
  let current = `${origin}/robots.txt`;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const verdict = judgePublicUrl(current);
    if (!verdict.ok) return { status: "unreachable", url: current };
    current = verdict.url;
    let response;
    try {
      response = await fetch(current, {
        headers: { "User-Agent": CRAWLER_UA, Accept: "text/plain" },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return { status: "unreachable", url: current };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { status: "unreachable", url: current, httpStatus: response.status };
      current = new URL(location, current).toString();
      continue;
    }
    if (response.status >= 400 && response.status < 500) return { status: "none", url: current, httpStatus: response.status };
    if (!response.ok) return { status: "unreachable", url: current, httpStatus: response.status };
    let text;
    try {
      text = await response.text();
    } catch {
      return { status: "unreachable", url: current, httpStatus: response.status };
    }
    return { status: "ok", url: current, httpStatus: response.status, text: text.slice(0, MAX_ROBOTS_BYTES) };
  }
  return { status: "unreachable", url: current };
}

/** The robots block a reading carries: the fetch outcome and one verdict per bot. */
export function robotsReport(fetched, pageUrl) {
  const base = { url: fetched.url ?? null, status: fetched.status, httpStatus: fetched.httpStatus ?? null };
  if (fetched.status === "not_checked") return { ...base, bots: [] };
  if (fetched.status === "ok") return { ...base, bots: judgeBots(fetched.text, pageUrl) };
  // No file: everything allowed. Unreachable: RFC 9309 says a crawler assumes it may fetch nothing.
  const allowed = fetched.status === "none";
  return {
    ...base,
    bots: AI_BOTS.map((bot) => ({ ...bot, allowed, rule: null, group: null })),
  };
}
