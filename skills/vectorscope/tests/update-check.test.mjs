// The update check (scripts/lib/update-check.mjs). The same file, and this same test, live in every
// public GetLoopLoop skill repository; the hash below fails the copy that changed alone. Change the
// module in all five repositories at once and update UPDATE_CHECK_SHA256 in all five tests.
// No test reaches GitHub: every fetch here is a local stub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkForUpdate, compareVersions, latestUrl, updateCheckDisabled, updateExport, updateLine, updateNotice, UPDATE_TTL_MS } from "../scripts/lib/update-check.mjs";

const UPDATE_CHECK_SHA256 = "8f70981f71be58336ab07321a8b359d46aac72e683cc75ebfebb9a2c88d6b653";

test("the module is the shared copy, byte for byte (line endings aside)", () => {
  const text = readFileSync(new URL("../scripts/lib/update-check.mjs", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.equal(createHash("sha256").update(text).digest("hex"), UPDATE_CHECK_SHA256);
});

const repo = "example-skill";
const quiet = { argv: ["node", "script.mjs"], env: {} };
function stub(version, { status = 200, calls = [] } = {}) {
  const fn = async (url, init) => {
    calls.push({ url, init });
    return { status, text: async () => JSON.stringify({ name: repo, version }) };
  };
  fn.calls = calls;
  return fn;
}
function tempCache() {
  const dir = mkdtempSync(join(tmpdir(), "gll-update-"));
  return { file: join(dir, "update-check.json"), done: () => rmSync(dir, { recursive: true, force: true }) };
}

test("versions compare as numbers, 2.113 and 2.113.0 alike", () => {
  assert.equal(compareVersions("2.113", "2.113.0"), 0);
  assert.equal(compareVersions("2.114.0", "2.113"), 1);
  assert.equal(compareVersions("2.99", "2.100"), -1);
  assert.equal(compareVersions("1.10.0", "1.009"), 1);
  assert.equal(compareVersions("nope", "1.0"), null);
});

test("a newer version gives one notice, with the export field, a stderr line and three languages", async () => {
  const c = tempCache();
  const fetchImpl = stub("2.114.0");
  const u = await checkForUpdate({ repo, plugin: "example", current: "2.113", fetchImpl, cacheFile: c.file, ...quiet });
  assert.equal(u.latest, "2.114.0");
  assert.equal(u.current, "2.113");
  assert.deepEqual(Object.keys(updateExport(u)), ["current", "latest", "how"]);
  assert.match(u.how, /\/plugin marketplace update example-skill/);
  assert.match(u.how, /agy plugin install https:\/\/github\.com\/Olexan-art\/example-skill/);
  assert.match(u.how, /npx skills update example/);
  assert.match(updateLine(u), /^update {4}example 2\.114\.0 is available/);
  const n = updateNotice(u);
  for (const k of ["en", "uk", "pl"]) assert.ok(n[k].includes("2.114.0"), k);
  assert.ok(!/[ыъэё]/i.test(n.uk));
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, latestUrl(repo));
  assert.equal(fetchImpl.calls[0].url, "https://raw.githubusercontent.com/Olexan-art/example-skill/main/plugin.json");
  c.done();
});

test("the same or an older version gives nothing", async () => {
  for (const v of ["2.113.0", "2.112.0", "2.113"]) {
    const c = tempCache();
    assert.equal(await checkForUpdate({ repo, current: "2.113", fetchImpl: stub(v), cacheFile: c.file, ...quiet }), null, v);
    c.done();
  }
});

test("offline, a non-200, bad JSON or a timeout gives nothing, quickly", async () => {
  const c = tempCache();
  const failing = [
    async () => {
      throw new TypeError("fetch failed");
    },
    stub("9.0.0", { status: 404 }),
    async () => ({ status: 200, text: async () => "<html>" }),
    (url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted")))),
  ];
  for (const fetchImpl of failing) {
    rmSync(c.file, { force: true });
    const started = Date.now();
    assert.equal(await checkForUpdate({ repo, current: "1.0", fetchImpl, cacheFile: c.file, timeoutMs: 50, ...quiet }), null);
    assert.ok(Date.now() - started < 1500);
  }
  c.done();
});

test("the cache answers for 24 hours, failures included, then GitHub is asked again", async () => {
  const c = tempCache();
  const calls = [];
  const fetchImpl = stub("3.0.0", { calls });
  const t0 = 1_800_000_000_000;
  const first = await checkForUpdate({ repo, current: "2.0", fetchImpl, cacheFile: c.file, now: t0, ...quiet });
  const second = await checkForUpdate({ repo, current: "2.0", fetchImpl, cacheFile: c.file, now: t0 + UPDATE_TTL_MS - 1, ...quiet });
  assert.equal(first.latest, "3.0.0");
  assert.equal(second.latest, "3.0.0");
  assert.equal(calls.length, 1, "one request within a day");
  await checkForUpdate({ repo, current: "2.0", fetchImpl, cacheFile: c.file, now: t0 + UPDATE_TTL_MS, ...quiet });
  assert.equal(calls.length, 2, "asked again after a day");
  const cache = JSON.parse(readFileSync(c.file, "utf8"));
  assert.deepEqual(Object.keys(cache), [repo]);
  assert.deepEqual(Object.keys(cache[repo]).sort(), ["checkedAt", "latest"]);
  // Another skill has its own entry; an offline answer is cached too.
  await checkForUpdate({ repo: "other-skill", current: "1.0", fetchImpl: async () => { throw new Error("offline"); }, cacheFile: c.file, now: t0, ...quiet });
  const failCalls = [];
  assert.equal(await checkForUpdate({ repo: "other-skill", current: "1.0", fetchImpl: stub("9.0.0", { calls: failCalls }), cacheFile: c.file, now: t0 + 1000, ...quiet }), null);
  assert.equal(failCalls.length, 0);
  c.done();
});

test("a broken cache file is ignored, not fatal", async () => {
  const c = tempCache();
  writeFileSync(c.file, "{not json");
  const u = await checkForUpdate({ repo, current: "1.0", fetchImpl: stub("1.1.0"), cacheFile: c.file, ...quiet });
  assert.equal(u.latest, "1.1.0");
  c.done();
});

test("the flag, the environment variable and CI switch it off, and nothing is requested", async () => {
  const c = tempCache();
  const calls = [];
  const fetchImpl = stub("9.0.0", { calls });
  const off = [
    { argv: ["node", "s.mjs", "--no-update-check"], env: {} },
    { argv: ["node", "s.mjs"], env: { GETLOOPLOOP_NO_UPDATE_CHECK: "1" } },
    { argv: ["node", "s.mjs"], env: { CI: "true" } },
  ];
  for (const o of off) {
    assert.ok(updateCheckDisabled(o));
    assert.equal(await checkForUpdate({ repo, current: "1.0", fetchImpl, cacheFile: c.file, ...o }), null);
  }
  assert.equal(calls.length, 0);
  assert.equal(updateCheckDisabled({ argv: ["node", "s.mjs"], env: { CI: "false", GETLOOPLOOP_NO_UPDATE_CHECK: "0" } }), null);
  c.done();
});
