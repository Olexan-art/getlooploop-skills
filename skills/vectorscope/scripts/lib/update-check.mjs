// Is there a newer release of this skill? One GET of the repository's plugin.json on GitHub, at most
// once a day per skill, and silence on any failure.
//
// What it sends: nothing but that GET (https://raw.githubusercontent.com/Olexan-art/<repo>/main/plugin.json).
// No page URL, no domain, no audit data, no identifier; the request carries only what any HTTP
// client sends (Node's fetch user agent). The answer is cached for 24 hours in
// ~/.getlooploop-skills/update-check.json, keyed by repository, failures included, so an offline
// machine is not asked again on every run.
//
// Off: GETLOOPLOOP_NO_UPDATE_CHECK=1, the --no-update-check flag, or CI set in the environment
// (and under node --test, so a test never asks GitHub).
//
// Never fails, never waits more than about 2 seconds, never updates anything: it reports, and the
// agent offers the update command for the way the skill was installed (SKILL.md), running it only
// when the user agrees.
//
// This file is identical in every public GetLoopLoop skill repository (getlooploop-skills,
// ai-search-audit, ai-search-audit-full, page-text-to-prompts, sitemap-watch);
// tests/update-check.test.mjs holds its hash, so a copy changed in one place fails its tests.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Where the latest version is read: the one URL this module ever requests. {repo} is the
 * repository name. Kept as one constant, with the request and the parsing below it in
 * fetchLatest and parseLatest, so the source can be moved without touching the rest.
 */
export const LATEST_URL = "https://raw.githubusercontent.com/Olexan-art/{repo}/main/plugin.json";

export const UPDATE_CACHE_FILE = join(homedir(), ".getlooploop-skills", "update-check.json");
export const UPDATE_TTL_MS = 24 * 60 * 60 * 1000;
export const UPDATE_TIMEOUT_MS = 2000;
export const NO_UPDATE_FLAG = "--no-update-check";

/** LATEST_URL for one repository. */
export const latestUrl = (repo) => LATEST_URL.replace("{repo}", encodeURIComponent(repo));

/** Numbers of a version, "2.113" and "2.113.0" alike: [2, 113, 0]. Null for anything else. */
export function versionParts(v) {
  const m = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)] : null;
}

/** -1, 0 or 1; null when either side is not a version. */
export function compareVersions(a, b) {
  const x = versionParts(a);
  const y = versionParts(b);
  if (!x || !y) return null;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}

/** Why the check is off, or null when it may run. */
export function updateCheckDisabled({ argv = process.argv, env = process.env } = {}) {
  if (argv.includes(NO_UPDATE_FLAG)) return "flag";
  if (env.GETLOOPLOOP_NO_UPDATE_CHECK && env.GETLOOPLOOP_NO_UPDATE_CHECK !== "0") return "env";
  if (env.CI && env.CI !== "0" && env.CI !== "false") return "ci";
  // A script started by a test (node --test passes NODE_TEST_CONTEXT down) never asks GitHub.
  if (env.NODE_TEST_CONTEXT) return "test";
  return null;
}

/** The ways to update, for the notice and the export: the install routes and their commands. */
export function updateRoutes({ repo, plugin }) {
  return {
    claudeCode: `/plugin marketplace update ${repo}`,
    antigravity: `agy plugin install https://github.com/Olexan-art/${repo}`,
    skillsCli: `npx skills update ${plugin}`,
    zip: `https://github.com/Olexan-art/${repo}/releases`,
  };
}

/** The `how` sentence, in English, as the JSON export carries it. */
export function updateHow(routes) {
  return `Claude Code plugin: ${routes.claudeCode} (or turn on auto-update for the marketplace in /plugin). Antigravity: ${routes.antigravity} again. skills CLI: ${routes.skillsCli}. claude.ai: upload the new zip from ${routes.zip}.`;
}

/** The notice, in the report's three languages: plain text, for the caller to escape. */
export function updateNotice(u) {
  return {
    en: `A newer version of this skill is available: ${u.latest} (this report was made with ${u.current}). ${u.how}`,
    uk: `Доступна новіша версія цієї навички: ${u.latest} (цей звіт зроблено версією ${u.current}). Claude Code: ${u.routes.claudeCode} (або ввімкніть автооновлення маркетплейсу в /plugin). Antigravity: ще раз ${u.routes.antigravity}. skills CLI: ${u.routes.skillsCli}. claude.ai: завантажте новий zip з ${u.routes.zip}.`,
    pl: `Dostępna jest nowsza wersja tego skilla: ${u.latest} (ten raport powstał w wersji ${u.current}). Claude Code: ${u.routes.claudeCode} (albo włącz automatyczne aktualizacje marketplace’u w /plugin). Antigravity: ponownie ${u.routes.antigravity}. skills CLI: ${u.routes.skillsCli}. claude.ai: wgraj nowy zip z ${u.routes.zip}.`,
  };
}

/** The one stderr line. */
export const updateLine = (u) => `update    ${u.plugin} ${u.latest} is available (running ${u.current}); ask the user before updating. ${u.how}`;

function readCache(file) {
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeCache(file, cache) {
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(cache, null, 2));
  } catch {
    // A read-only home is not a reason to fail a run.
  }
}

/** The version in the answer (plugin.json's `version`), or null. */
export function parseLatest(text) {
  try {
    const body = JSON.parse(text);
    return versionParts(body?.version) ? String(body.version) : null;
  } catch {
    return null;
  }
}

async function fetchLatest(repo, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(latestUrl(repo), { signal: controller.signal, redirect: "follow" });
    if (!response || response.status !== 200) return null;
    return parseLatest(await response.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The update, or null: { current, latest, how, routes, plugin } when the published version is
 * newer than the running one. Never throws. `fetchImpl`, `cacheFile` and `now` are there for tests.
 */
export async function checkForUpdate({ repo, plugin, current, argv = process.argv, env = process.env, fetchImpl = globalThis.fetch, cacheFile = UPDATE_CACHE_FILE, now = Date.now(), timeoutMs = UPDATE_TIMEOUT_MS } = {}) {
  try {
    if (!repo || !versionParts(current) || updateCheckDisabled({ argv, env }) || typeof fetchImpl !== "function") return null;
    const cache = readCache(cacheFile);
    const hit = cache[repo];
    let latest;
    if (hit && typeof hit.checkedAt === "number" && now - hit.checkedAt >= 0 && now - hit.checkedAt < UPDATE_TTL_MS) {
      latest = hit.latest ?? null;
    } else {
      latest = await fetchLatest(repo, fetchImpl, timeoutMs);
      cache[repo] = { checkedAt: now, latest };
      writeCache(cacheFile, cache);
    }
    if (!latest || compareVersions(latest, current) !== 1) return null;
    const routes = updateRoutes({ repo, plugin: plugin || repo });
    return { current: String(current), latest, how: updateHow(routes), routes, plugin: plugin || repo };
  } catch {
    return null;
  }
}

/** The export field: { current, latest, how }, or null. */
export const updateExport = (u) => (u ? { current: u.current, latest: u.latest, how: u.how } : null);
