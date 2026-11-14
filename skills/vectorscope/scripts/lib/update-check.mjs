// Is there a newer release of this skill? Asked at most once a day per skill, silent on any failure,
// and the same request counts installs and runs, anonymously.
//
// The request (once per 24 hours per skill):
//   GET https://www.getlooploop.com/api/skill-version/latest?skill=<name>&v=<version>&os=<win|mac|linux|other>&id=<install id>&runs=<n>
// - skill, v: this skill's name and running version;
// - os: from process.platform, one of four words;
// - id: a random UUID v4 made on the first check and kept in ~/.getlooploop-skills/install-id, one id
//   for every GetLoopLoop skill on the machine; never derived from the machine or the user;
// - runs: how many times this skill ran since its last answered check (0 to 100000).
// Nothing else: no page URL, no domain, no audit data, no user name, no host name. The server
// derives a country from the connection and does not store the IP address.
// If that request fails (non-200, timeout, bad JSON), the version is read from the repository's
// plugin.json on GitHub instead, with no parameters, and the run count is kept for the next day.
//
// State, in ~/.getlooploop-skills/: install-id, and update-check.json (per skill: when it last
// checked, the latest version seen, the runs since the last answered check). Delete the folder to
// reset the id.
//
// Off: GETLOOPLOOP_NO_UPDATE_CHECK=1, the --no-update-check flag, or CI set in the environment (and
// under node --test). Off means no request of any kind, no id file and no counter.
//
// Never fails a run and never updates anything: it reports, and the agent offers the update command
// for the way the skill was installed (SKILL.md), running it only when the user agrees.
//
// This file is identical in every public GetLoopLoop skill repository (getlooploop-skills,
// ai-search-audit, ai-search-audit-full, page-text-to-prompts, sitemap-watch);
// tests/update-check.test.mjs holds its hash, so a copy changed in one place fails its tests.

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Where the latest version is asked first. */
export const LATEST_URL = "https://www.getlooploop.com/api/skill-version/latest";
/** Where it is read when that fails: the repository's plugin.json, {repo} being its name. */
export const FALLBACK_URL = "https://raw.githubusercontent.com/Olexan-art/{repo}/main/plugin.json";

export const STATE_DIR = join(homedir(), ".getlooploop-skills");
export const UPDATE_TTL_MS = 24 * 60 * 60 * 1000;
export const UPDATE_TIMEOUT_MS = 2000;
export const MAX_RUNS = 100000;
export const NO_UPDATE_FLAG = "--no-update-check";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** The four operating-system words the request may carry. */
export function osWord(platform = process.platform) {
  return platform === "win32" ? "win" : platform === "darwin" ? "mac" : platform === "linux" ? "linux" : "other";
}

/** The first request's URL: exactly these five parameters. */
export function latestUrl({ skill, version, os, id, runs }) {
  const q = new URLSearchParams({ skill, v: String(version), os, id, runs: String(runs) });
  return `${LATEST_URL}?${q}`;
}

/** The fallback's URL for one repository. */
export const fallbackUrl = (repo) => FALLBACK_URL.replace("{repo}", encodeURIComponent(repo));

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
  // A script started by a test (node --test passes NODE_TEST_CONTEXT down) never asks anybody.
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

/** The export field: { current, latest, how }, or null. */
export const updateExport = (u) => (u ? { current: u.current, latest: u.latest, how: u.how } : null);

// ── state ────────────────────────────────────────────────────────────────────

function readJsonFile(file) {
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeFile(dir, name, text) {
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), text);
    return true;
  } catch {
    // A read-only home is not a reason to fail a run.
    return false;
  }
}

/** The install id shared by every GetLoopLoop skill on this machine: read, or made once. */
export function installId(stateDir = STATE_DIR) {
  try {
    const id = readFileSync(join(stateDir, "install-id"), "utf8").trim();
    if (UUID_V4.test(id)) return id;
  } catch {}
  const id = randomUUID();
  writeFile(stateDir, "install-id", `${id}\n`);
  return id;
}

const clampRuns = (n) => Math.min(MAX_RUNS, Math.max(0, Number.isInteger(n) ? n : 0));

// ── requests ─────────────────────────────────────────────────────────────────

async function getText(url, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, redirect: "follow" });
    if (!response || response.status !== 200) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The version in an answer: `latest` from GetLoopLoop, `version` from plugin.json; else null. */
export function parseLatest(text, key = "latest") {
  try {
    const body = JSON.parse(text);
    return versionParts(body?.[key]) ? String(body[key]) : null;
  } catch {
    return null;
  }
}

/**
 * The update, or null: { current, latest, how, routes, plugin } when the published version is
 * newer than the running one. Never throws. `fetchImpl`, `stateDir`, `now` and `platform` are
 * there for tests.
 */
export async function checkForUpdate({ repo, plugin, current, argv = process.argv, env = process.env, fetchImpl = globalThis.fetch, stateDir = STATE_DIR, now = Date.now(), platform = process.platform, timeoutMs = UPDATE_TIMEOUT_MS } = {}) {
  try {
    const skill = plugin || repo;
    if (!repo || !versionParts(current) || updateCheckDisabled({ argv, env }) || typeof fetchImpl !== "function") return null;
    const cache = readJsonFile(join(stateDir, "update-check.json"));
    const entry = cache[skill] && typeof cache[skill] === "object" && !Array.isArray(cache[skill]) ? cache[skill] : {};
    entry.runs = clampRuns((Number.isInteger(entry.runs) ? entry.runs : 0) + 1);
    let latest;
    if (typeof entry.checkedAt === "number" && now - entry.checkedAt >= 0 && now - entry.checkedAt < UPDATE_TTL_MS) {
      latest = entry.latest ?? null;
    } else {
      const url = latestUrl({ skill, version: current, os: osWord(platform), id: installId(stateDir), runs: entry.runs });
      latest = parseLatest(await getText(url, fetchImpl, timeoutMs), "latest");
      if (latest) entry.runs = 0;
      else latest = parseLatest(await getText(fallbackUrl(repo), fetchImpl, timeoutMs), "version");
      entry.checkedAt = now;
      entry.latest = latest;
    }
    cache[skill] = entry;
    writeFile(stateDir, "update-check.json", JSON.stringify(cache, null, 2));
    if (!latest || compareVersions(latest, current) !== 1) return null;
    const routes = updateRoutes({ repo, plugin: skill });
    return { current: String(current), latest, how: updateHow(routes), routes, plugin: skill };
  } catch {
    return null;
  }
}
