// The update check (scripts/lib/update-check.mjs). The same file, and this same test, live in every
// public GetLoopLoop skill repository; the hash below fails the copy that changed alone. Change the
// module in all five repositories at once and update UPDATE_CHECK_SHA256 in all five tests.
// No test reaches the network: every fetch here is a local stub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkForUpdate, compareVersions, fallbackUrl, LATEST_URL, osWord, updateCheckDisabled, updateExport, updateLine, updateNotice, UPDATE_TTL_MS } from "../scripts/lib/update-check.mjs";

const UPDATE_CHECK_SHA256 = "21f6a9a4100446ca8b8845dfd2a344c32888d2188fce1840e3424bf04505cbf8";

test("the module is the shared copy, byte for byte (line endings aside)", () => {
  const text = readFileSync(new URL("../scripts/lib/update-check.mjs", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.equal(createHash("sha256").update(text).digest("hex"), UPDATE_CHECK_SHA256);
});

const repo = "example-repo";
const skill = "example-skill";
const quiet = { argv: ["node", "script.mjs"], env: {} };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A stub server: answers GetLoopLoop with `ours` ({status, body}, "hang" or "throw") and GitHub with `github`. */
function stub({ ours = { status: 200, body: { skill, latest: "2.200" } }, github = { status: 200, body: { name: skill, version: "2.150.0" } } } = {}) {
  const calls = [];
  const answer = (spec, init) => {
    if (spec === "throw") return Promise.reject(new TypeError("fetch failed"));
    if (spec === "hang") return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))));
    return Promise.resolve({ status: spec.status, text: async () => (typeof spec.body === "string" ? spec.body : JSON.stringify(spec.body)) });
  };
  const fn = (url, init) => {
    calls.push(url);
    return answer(url.startsWith(LATEST_URL) ? ours : github, init);
  };
  fn.calls = calls;
  return fn;
}
function tempState() {
  const dir = mkdtempSync(join(tmpdir(), "gll-update-"));
  return { dir, state: () => JSON.parse(readFileSync(join(dir, "update-check.json"), "utf8")), done: () => rmSync(dir, { recursive: true, force: true }) };
}
const params = (url) => Object.fromEntries(new URL(url).searchParams);

test("versions compare as numbers, 2.113 and 2.113.0 alike", () => {
  assert.equal(compareVersions("2.113", "2.113.0"), 0);
  assert.equal(compareVersions("2.114.0", "2.113"), 1);
  assert.equal(compareVersions("2.99", "2.100"), -1);
  assert.equal(compareVersions("1.10.0", "1.009"), 1);
  assert.equal(compareVersions("nope", "1.0"), null);
});

test("the request carries exactly skill, v, os, id and runs, and nothing else", async () => {
  const s = tempState();
  const fetchImpl = stub();
  await checkForUpdate({ repo, plugin: skill, current: "2.113", fetchImpl, stateDir: s.dir, platform: "darwin", ...quiet });
  assert.equal(fetchImpl.calls.length, 1);
  const url = new URL(fetchImpl.calls[0]);
  assert.equal(`${url.origin}${url.pathname}`, "https://www.getlooploop.com/api/skill-version/latest");
  const p = params(fetchImpl.calls[0]);
  assert.deepEqual(Object.keys(p).sort(), ["id", "os", "runs", "skill", "v"]);
  assert.equal(p.skill, skill);
  assert.equal(p.v, "2.113");
  assert.equal(p.os, "mac");
  assert.match(p.id, UUID_V4);
  assert.equal(p.runs, "1");
  assert.deepEqual(["win32", "darwin", "linux", "freebsd"].map(osWord), ["win", "mac", "linux", "other"]);
  s.done();
});

test("a newer version gives one notice, with the export field, a stderr line and three languages", async () => {
  const s = tempState();
  const u = await checkForUpdate({ repo, plugin: skill, current: "2.113", fetchImpl: stub(), stateDir: s.dir, ...quiet });
  assert.equal(u.latest, "2.200");
  assert.deepEqual(Object.keys(updateExport(u)), ["current", "latest", "how"]);
  assert.match(u.how, /\/plugin marketplace update example-repo/);
  assert.match(u.how, /agy plugin install https:\/\/github\.com\/Olexan-art\/example-repo/);
  assert.match(u.how, /npx skills update example-skill/);
  assert.match(updateLine(u), /^update {4}example-skill 2\.200 is available/);
  const n = updateNotice(u);
  for (const k of ["en", "uk", "pl"]) assert.ok(n[k].includes("2.200"), k);
  assert.ok(!/[ыъэё]/i.test(n.uk));
  s.done();
});

test("the same or an older version gives nothing", async () => {
  for (const latest of ["2.113.0", "2.112", "2.113"]) {
    const s = tempState();
    assert.equal(await checkForUpdate({ repo, plugin: skill, current: "2.113", fetchImpl: stub({ ours: { status: 200, body: { skill, latest } } }), stateDir: s.dir, ...quiet }), null, latest);
    s.done();
  }
});

test("the install id is made once, kept in install-id and shared by every skill", async () => {
  const s = tempState();
  const a = stub();
  const b = stub();
  await checkForUpdate({ repo: "first-repo", plugin: "first-skill", current: "1.0", fetchImpl: a, stateDir: s.dir, ...quiet });
  await checkForUpdate({ repo: "second-repo", plugin: "second-skill", current: "3.0", fetchImpl: b, stateDir: s.dir, ...quiet });
  const id = readFileSync(join(s.dir, "install-id"), "utf8").trim();
  assert.match(id, UUID_V4);
  assert.equal(params(a.calls[0]).id, id);
  assert.equal(params(b.calls[0]).id, id);
  assert.equal(params(b.calls[0]).skill, "second-skill");
  s.done();
});

test("runs count every run, are sent with the daily check and start again after a 200", async () => {
  const s = tempState();
  const t0 = 1_800_000_000_000;
  const f1 = stub();
  await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl: f1, stateDir: s.dir, now: t0, ...quiet });
  assert.equal(params(f1.calls[0]).runs, "1");
  assert.equal(s.state()[skill].runs, 0, "reset after the answer");
  const quietFetch = stub();
  for (let i = 1; i <= 3; i++) await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl: quietFetch, stateDir: s.dir, now: t0 + i * 1000, ...quiet });
  assert.equal(quietFetch.calls.length, 0, "no request within the day");
  assert.equal(s.state()[skill].runs, 3);
  const f2 = stub();
  await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl: f2, stateDir: s.dir, now: t0 + UPDATE_TTL_MS, ...quiet });
  assert.equal(params(f2.calls[0]).runs, "4", "three counted runs and this one");
  assert.equal(s.state()[skill].runs, 0);
  s.done();
});

test("404, a timeout, a refused connection or bad JSON fall back to plugin.json on GitHub, and keep the count", async () => {
  for (const ours of [{ status: 404, body: "not found" }, "hang", "throw", { status: 200, body: "<html>" }]) {
    const s = tempState();
    const fetchImpl = stub({ ours });
    const u = await checkForUpdate({ repo, plugin: skill, current: "2.113", fetchImpl, stateDir: s.dir, timeoutMs: 50, ...quiet });
    assert.equal(fetchImpl.calls.length, 2);
    assert.equal(fetchImpl.calls[1], fallbackUrl(repo));
    assert.equal(fetchImpl.calls[1], "https://raw.githubusercontent.com/Olexan-art/example-repo/main/plugin.json");
    assert.equal(u.latest, "2.150.0");
    assert.equal(s.state()[skill].runs, 1, "not reset without an answer from GetLoopLoop");
    s.done();
  }
});

test("both down: nothing, quickly, and no second try within the day", async () => {
  const s = tempState();
  const t0 = 1_800_000_000_000;
  const started = Date.now();
  const down = stub({ ours: "hang", github: "hang" });
  assert.equal(await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl: down, stateDir: s.dir, now: t0, timeoutMs: 50, ...quiet }), null);
  assert.ok(Date.now() - started < 1500);
  const again = stub();
  assert.equal(await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl: again, stateDir: s.dir, now: t0 + 1000, ...quiet }), null);
  assert.equal(again.calls.length, 0);
  assert.equal(s.state()[skill].runs, 2);
  s.done();
});

test("a broken state file is ignored, not fatal", async () => {
  const s = tempState();
  writeFileSync(join(s.dir, "update-check.json"), "{not json");
  writeFileSync(join(s.dir, "install-id"), "not-a-uuid");
  const fetchImpl = stub();
  const u = await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl, stateDir: s.dir, ...quiet });
  assert.equal(u.latest, "2.200");
  assert.match(params(fetchImpl.calls[0]).id, UUID_V4);
  s.done();
});

test("the flag, the environment variable and CI switch it off: no request, no id, no state", async () => {
  const off = [
    { argv: ["node", "s.mjs", "--no-update-check"], env: {} },
    { argv: ["node", "s.mjs"], env: { GETLOOPLOOP_NO_UPDATE_CHECK: "1" } },
    { argv: ["node", "s.mjs"], env: { CI: "true" } },
  ];
  for (const o of off) {
    const s = tempState();
    const fetchImpl = stub();
    assert.ok(updateCheckDisabled(o));
    assert.equal(await checkForUpdate({ repo, plugin: skill, current: "1.0", fetchImpl, stateDir: s.dir, ...o }), null);
    assert.equal(fetchImpl.calls.length, 0);
    assert.ok(!existsSync(join(s.dir, "install-id")) && !existsSync(join(s.dir, "update-check.json")));
    s.done();
  }
  assert.equal(updateCheckDisabled({ argv: ["node", "s.mjs"], env: { CI: "false", GETLOOPLOOP_NO_UPDATE_CHECK: "0" } }), null);
});
