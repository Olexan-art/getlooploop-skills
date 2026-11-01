// Runs against a local fixture server only; no test touches a third-party site.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { mkdtempSync, rmSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parseSitemap,
  parseRobotsSitemaps,
  takeSnapshot,
  saveSnapshot,
  diffSnapshots,
  groupByPrefix,
  normaliseInput,
  siteKey,
  main,
  USER_AGENT,
} from "../scripts/sitemap-watch.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "sitemap-watch.mjs");
const run = promisify(execFile);

let server;
let base;
let routes = {};
const seenAgents = new Set();

const urlset = (items) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${items
    .map(([loc, lastmod]) => `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<image:image><image:loc>${loc}/img.png</image:loc></image:image></url>`)
    .join("\n")}\n</urlset>`;
const index = (locs) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map((l) => `  <sitemap><loc>${l}</loc></sitemap>`).join("\n")}\n</sitemapindex>`;

function stateOne() {
  return {
    "/robots.txt": `User-agent: *\nDisallow:\n\nSitemap: ${base}/sitemap_index.xml\n`,
    "/sitemap_index.xml": index([`${base}/pages.xml`, `${base}/blog.xml.gz`]),
    "/pages.xml": urlset([
      [`${base}/`, "2026-10-01"],
      [`${base}/pricing`, "2026-10-01"],
      [`${base}/features/export`, "2026-10-01"],
    ]),
    "/blog.xml.gz": gzipSync(
      urlset([
        [`${base}/blog/2026/first-post`, "2026-10-02"],
        [`${base}/blog/2026/second-post`, "2026-10-03"],
      ]),
    ),
  };
}

function stateTwo() {
  const s = stateOne();
  s["/sitemap_index.xml"] = index([`${base}/pages.xml`, `${base}/blog.xml.gz`, `${base}/integrations.xml`]);
  s["/pages.xml"] = urlset([
    [`${base}/`, "2026-10-01"],
    [`${base}/pricing`, "2026-10-20"],
    [`${base}/features/export`, "2026-10-01"],
    [`${base}/features/sign`, "2026-10-21"],
  ]);
  s["/blog.xml.gz"] = gzipSync(
    urlset([
      [`${base}/blog/2026/first-post`, "2026-10-02"],
      [`${base}/blog/2026/third-post`, "2026-10-22"],
    ]),
  );
  s["/integrations.xml"] = urlset([
    [`${base}/integrations/slack/setup`, null],
    [`${base}/integrations/slack/faq`, null],
    [`${base}/integrations/drive/setup`, null],
  ]);
  return s;
}

before(async () => {
  server = createServer((req, res) => {
    seenAgents.add(req.headers["user-agent"]);
    const body = routes[req.url.split("?")[0]];
    if (body === undefined) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("not found");
    }
    if (body === "TIMEOUT") return; // never answers
    res.writeHead(200, { "content-type": Buffer.isBuffer(body) ? "application/gzip" : "application/xml" });
    res.end(body);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections?.();
  server.close();
});

const fast = { delayMs: 0, timeoutMs: 3000 };

test("parseSitemap reads urlsets, indexes, lastmod, entities and skips image:loc", () => {
  const u = parseSitemap(urlset([["https://a.test/x?a=1&amp;b=2", "2026-01-01"], ["https://a.test/y", null]]));
  assert.equal(u.kind, "urlset");
  assert.deepEqual(u.entries, [
    { loc: "https://a.test/x?a=1&b=2", lastmod: "2026-01-01" },
    { loc: "https://a.test/y", lastmod: null },
  ]);
  const i = parseSitemap(index(["https://a.test/s1.xml", "https://a.test/s2.xml"]));
  assert.equal(i.kind, "index");
  assert.equal(i.entries.length, 2);
  assert.equal(parseSitemap("<html><body>hi</body></html>").kind, "unknown");
  assert.equal(parseSitemap("<urlset><url><loc><![CDATA[https://a.test/c]]></loc></url></urlset>").entries[0].loc, "https://a.test/c");
});

test("parseRobotsSitemaps takes every Sitemap line, any case", () => {
  assert.deepEqual(parseRobotsSitemaps("User-agent: *\nsitemap: https://a.test/one.xml\r\nSITEMAP:https://a.test/two.xml\n# Sitemap: no"), [
    "https://a.test/one.xml",
    "https://a.test/two.xml",
  ]);
});

test("inputs: bare hosts get https, www is folded into one site key, Russian domains are refused", () => {
  assert.equal(normaliseInput("example.com").href, "https://example.com/");
  assert.equal(siteKey(normaliseInput("www.example.com")), "example.com");
  assert.equal(siteKey(normaliseInput("http://127.0.0.1:8080/")), "127.0.0.1_8080");
  assert.throws(() => normaliseInput("ftp://example.com"), /http/);
  assert.throws(() => normaliseInput("shop.example.ru"), /refused/);
});

test("snapshot follows robots.txt, the index and a gzipped child", async () => {
  routes = stateOne();
  const s = await takeSnapshot(base, fast);
  assert.equal(s.discovery, "robots.txt");
  assert.equal(s.urlCount, 5);
  assert.equal(s.sitemapsRead, 3);
  assert.equal(s.partial, false);
  assert.deepEqual(s.errors, []);
  assert.ok(s.urls.some((u) => u.loc.endsWith("/blog/2026/second-post") && u.lastmod === "2026-10-03"));
  assert.ok(seenAgents.has(USER_AGENT));
});

test("snapshot falls back to /sitemap.xml when robots.txt names none", async () => {
  routes = { "/robots.txt": "User-agent: *\nDisallow:\n", "/sitemap.xml": urlset([[`${base}/a`, null]]) };
  const s = await takeSnapshot(base, fast);
  assert.match(s.discovery, /sitemap\.xml/);
  assert.equal(s.urlCount, 1);
});

test("a failing child sitemap is reported, not fatal, and marks the snapshot partial", async () => {
  routes = stateOne();
  routes["/sitemap_index.xml"] = index([`${base}/pages.xml`, `${base}/missing.xml`]);
  const s = await takeSnapshot(base, fast);
  assert.equal(s.urlCount, 3);
  assert.equal(s.partial, true);
  assert.equal(s.sitemapsFailed, 1);
  assert.match(s.errors[0].error, /404/);
});

test("a timeout is reported per sitemap", async () => {
  routes = { "/slow-sitemap.xml": "TIMEOUT" };
  const s = await takeSnapshot(`${base}/slow-sitemap.xml`, { delayMs: 0, timeoutMs: 300 });
  assert.equal(s.urlCount, 0);
  assert.match(s.errors[0].error, /timed out/);
});

test("caps are reported, never silent", async () => {
  routes = stateOne();
  const urlCapped = await takeSnapshot(base, { ...fast, maxUrls: 2 });
  assert.equal(urlCapped.urlCount, 2);
  assert.equal(urlCapped.capped.urlsDropped, 3);
  const mapCapped = await takeSnapshot(base, { ...fast, maxSitemaps: 2 });
  assert.equal(mapCapped.capped.sitemapsSkipped, 1);
  assert.equal(mapCapped.capped.sitemapsSkippedSample.length, 1);
});

test("an index that points at itself does not loop", async () => {
  routes = { "/sitemap.xml": index([`${base}/sitemap.xml`, `${base}/a.xml`]), "/a.xml": urlset([[`${base}/a`, null]]) };
  const s = await takeSnapshot(`${base}/sitemap.xml`, fast);
  assert.equal(s.sitemaps.length, 2);
  assert.equal(s.urlCount, 1);
});

test("diff finds new, removed and lastmod-changed URLs and groups the new ones", async () => {
  routes = stateOne();
  const a = await takeSnapshot(base, fast);
  routes = stateTwo();
  const b = await takeSnapshot(base, fast);
  const d = diffSnapshots(a, b);
  assert.deepEqual(d.counts, { new: 5, removed: 1, lastmodChanged: 1, net: 4 });
  assert.ok(d.removed[0].loc.endsWith("/blog/2026/second-post"));
  assert.ok(d.lastmodChanged[0].loc.endsWith("/pricing"));
  assert.deepEqual(d.newGroups.level1[0], { prefix: "/integrations/", new: 3, before: 0, newPrefix: true });
  const features = d.newGroups.level1.find((g) => g.prefix === "/features/");
  assert.deepEqual(features, { prefix: "/features/", new: 1, before: 1, newPrefix: false });
  assert.deepEqual(d.newGroups.level2[0], { prefix: "/integrations/slack/", new: 2, before: 0, newPrefix: true });
  assert.deepEqual(d.warnings, []);
});

test("groupByPrefix puts root pages under / and adds the host when hosts differ", () => {
  const g = groupByPrefix(["https://a.test/x", "https://a.test/docs/y"]);
  assert.deepEqual(g.level1.map((r) => r.prefix).sort(), ["/", "/docs/"]);
  const h = groupByPrefix(["https://a.test/docs/y", "https://b.test/docs/z"]);
  assert.deepEqual(h.level1.map((r) => r.prefix).sort(), ["a.test/docs/", "b.test/docs/"]);
});

test("diff warns when a snapshot was partial", async () => {
  routes = stateOne();
  const a = await takeSnapshot(base, fast);
  routes = stateOne();
  routes["/sitemap_index.xml"] = index([`${base}/pages.xml`, `${base}/gone.xml`]);
  const b = await takeSnapshot(base, fast);
  const d = diffSnapshots(a, b);
  assert.equal(d.counts.removed, 2);
  assert.match(d.warnings.join(" "), /later snapshot is partial/);
});

test("CLI: snapshot, baseline message, diff, --fresh, list and --json, in a temp state dir", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sitemap-watch-"));
  try {
    const env = { ...process.env, SITEMAP_WATCH_DIR: dir };
    const cli = (...args) => run(process.execPath, [SCRIPT, ...args, "--delay-ms", "0"], { env });
    routes = stateOne();
    const first = await cli("snapshot", base);
    assert.match(first.stdout, /urls\s+5 from 3 sitemap/);
    assert.match(first.stdout, /baseline/);

    const early = await cli("diff", base);
    assert.match(early.stdout, /BASELINE ONLY/);

    routes = stateTwo();
    const fresh = await cli("diff", base, "--fresh");
    assert.match(fresh.stdout, /New: 5 · Removed: 1 · Lastmod changed: 1/);
    assert.match(fresh.stdout, /\| `\/integrations\/` \| 3 \| 0 \| yes \|/);

    const json = JSON.parse((await cli("diff", base, "--json")).stdout);
    assert.equal(json.status, "compared");
    assert.equal(json.counts.new, 5);

    const limited = await cli("diff", base, "--limit", "2");
    assert.match(limited.stdout, /and 3 more/);

    const list = await cli("list", base);
    assert.equal((list.stdout.match(/URLs/g) || []).length, 2);
    const key = readdirSync(dir)[0];
    assert.equal(key, siteKey(new URL(base)));
    const saved = readdirSync(join(dir, key)).sort((x, y) => (JSON.parse(readFileSync(join(dir, key, x), "utf8")).fetchedAt < JSON.parse(readFileSync(join(dir, key, y), "utf8")).fetchedAt ? -1 : 1));
    assert.equal(saved.length, 2);
    assert.equal(JSON.parse(readFileSync(join(dir, key, saved[0]), "utf8")).urlCount, 5);

    const byDate = JSON.parse((await cli("diff", base, "--from", saved[0], "--to", saved[1], "--json")).stdout);
    assert.equal(byDate.counts.net, 4);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: a site with no readable sitemap saves nothing and exits 2", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sitemap-watch-"));
  try {
    routes = { "/robots.txt": "User-agent: *\n" };
    const lines = [];
    const code = await main(["snapshot", base, "--dir", dir, "--delay-ms", "0"], { log: (m) => lines.push(m), err: (m) => lines.push(m) });
    assert.equal(code, 2);
    assert.match(lines.join("\n"), /NOT SAVED.*404/s);
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("saveSnapshot never overwrites a snapshot taken in the same second", () => {
  const dir = mkdtempSync(join(tmpdir(), "sitemap-watch-"));
  try {
    const snap = { site: "a.test", fetchedAt: "2026-11-01T10:00:00.000Z", urls: [], urlCount: 0 };
    const p1 = saveSnapshot(snap, { dir });
    const p2 = saveSnapshot(snap, { dir });
    assert.notEqual(p1, p2);
    assert.ok(!basename(p1).includes(":"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
