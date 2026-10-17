// The whole read, with fetch stubbed: the redirect chain, robots.txt and its Sitemap: line, a
// gzipped child sitemap, llms.txt, the link check and its cap, and the refusals. Every request
// the read makes is listed, so nothing outside the page's own site is ever asked for.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readAudit } from "../scripts/lib/reading.mjs";
import { LINK_CHECK_CAP, parseSitemap, robotsSitemaps } from "../scripts/lib/collect.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { page, withFetch } from "./helpers.mjs";

const O = "https://example.org";
const body = page({ body: Array.from({ length: 35 }, (_, i) => `<p><a href="/l${i}">Link ${i}</a> and some words.</p>`).join("") });
const gz = gzipSync(Buffer.from(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${O}/page</loc></url></urlset>`));

function routes() {
  const r = {
    [`${O}/start`]: { status: 301, headers: { location: "/mid" } },
    [`${O}/mid`]: { status: 302, headers: { location: `${O}/page` } },
    [`${O}/page`]: { body },
    [`${O}/other`]: { body: "ok" },
    [`${O}/robots.txt`]: { headers: { "content-type": "text/plain" }, body: `User-agent: *\nAllow: /\n\nUser-agent: CCBot\nDisallow: /\n\nSitemap: ${O}/sitemap_index.xml\nSitemap: https://elsewhere.example.net/sitemap.xml\n` },
    [`${O}/sitemap_index.xml`]: { headers: { "content-type": "application/xml" }, body: `<?xml version="1.0"?><sitemapindex><sitemap><loc>${O}/posts.xml</loc></sitemap><sitemap><loc>${O}/pages.xml.gz</loc></sitemap></sitemapindex>` },
    [`${O}/posts.xml`]: { headers: { "content-type": "application/xml" }, body: `<urlset><url><loc>${O}/blog/a</loc></url></urlset>` },
  };
  for (let i = 0; i < 35; i++) r[`${O}/l${i}`] = { status: i === 3 ? 404 : i === 5 ? 403 : 200, body: "ok" };
  return r;
}

test("a full read: redirects, robots.txt, a gzipped child sitemap, llms.txt, 30 links and the rest counted", async () => {
  const table = routes();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push(String(url));
    const r = table[String(url)];
    if (String(url) === `${O}/pages.xml.gz`) return new Response(gz, { status: 200, headers: { "content-type": "application/gzip" } });
    if (!r) return new Response("missing", { status: 404, headers: { "content-type": "text/html" } });
    return new Response(init.method === "HEAD" || (r.status >= 300 && r.status < 400) ? null : r.body ?? "", { status: r.status ?? 200, headers: { "content-type": "text/html", ...(r.headers || {}) } });
  };
  let reading;
  try {
    reading = await readAudit({ url: `${O}/start` });
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(reading.ok, true);
  assert.deepEqual(reading.fetch.chain.map((c) => c.status), [301, 302, 200]);
  assert.equal(reading.fetch.finalUrl, `${O}/page`);
  assert.equal(reading.robots.bots.find((b) => b.token === "CCBot").allowed, false);
  assert.equal(reading.sitemap.listsPage, true);
  assert.equal(reading.sitemap.matchedIn, `${O}/pages.xml.gz`);
  assert.deepEqual(reading.sitemap.offSite, ["https://elsewhere.example.net/sitemap.xml"]);
  assert.equal(reading.llms.present, false);
  assert.equal(reading.links.checked, LINK_CHECK_CAP);
  assert.equal(reading.links.unchecked, 36 - LINK_CHECK_CAP);
  assert.deepEqual(reading.links.results.filter((x) => x.verdict === "broken").map((x) => x.url), [`${O}/l3`]);
  assert.deepEqual(reading.links.results.filter((x) => x.verdict === "unverified").map((x) => x.url), [`${O}/l5`]);
  // Nothing outside the site (its own http and www variants are the site), and nothing past the cap.
  const own = (u) => [`${O}/`, "http://example.org/", "https://www.example.org/"].some((p) => u.startsWith(p));
  assert.ok(calls.every(own), calls.filter((u) => !own(u)).join(", "));
  assert.deepEqual(reading.site.variants.map((v) => v.kind), ["http", "www", "slash"]);
  assert.equal(reading.site.soft404.status, 404);
  assert.equal(reading.images.total, 0);
  assert.ok(!calls.includes(`${O}/l34`));
  const m = buildModel(reading);
  const codes = m.findings.map((f) => f.code);
  assert.ok(codes.includes("redirect_chain"));
  assert.ok(codes.includes("broken_links"));
  assert.ok(codes.includes("ai_training_blocked"));
  assert.ok(codes.includes("url_variants_inconsistent"), "the variants answer 404, not the page");
  assert.ok(codes.includes("favicon_missing"));
  assert.ok(!codes.includes("soft_404"));
  assert.ok(m.caps.some((c) => c.id === "links" && c.n === 6));
  assert.ok(m.caps.some((c) => c.id === "links_unverified"));
});

test("refusals: an error status, a site that blocks readers, a file, a private host", async () => {
  const cases = [
    [`${O}/gone`, { [`${O}/gone`]: { status: 404, body: "no" } }, "http_error", 404],
    [`${O}/closed`, { [`${O}/closed`]: { status: 403, body: "no" } }, "blocked", 403],
    [`${O}/file.pdf`, { [`${O}/file.pdf`]: { headers: { "content-type": "application/pdf" }, body: "%PDF" } }, "not_html", 200],
  ];
  for (const [url, table, code, status] of cases) {
    const r = await withFetch(table, () => readAudit({ url }));
    assert.equal(r.ok, false, url);
    assert.equal(r.reasonCode, code, url);
    if (status !== 200) assert.equal(r.status, status, url);
  }
  const calls = await withFetch({}, async (c) => {
    const r = await readAudit({ url: "http://localhost:3000/admin" });
    assert.equal(r.reasonCode, "blocked_host");
    return c;
  });
  assert.equal(calls.length, 0);
});

test("sitemap and robots parsers", () => {
  assert.deepEqual(robotsSitemaps("User-agent: *\nSitemap: https://a.org/s.xml # main\nsitemap:https://a.org/t.xml\n"), ["https://a.org/s.xml", "https://a.org/t.xml"]);
  const p = parseSitemap("<urlset><url><loc>https://a.org/?a=1&amp;b=2</loc></url><url><loc><![CDATA[https://a.org/c]]></loc></url></urlset>");
  assert.equal(p.kind, "urlset");
  assert.deepEqual(p.locs, ["https://a.org/?a=1&b=2", "https://a.org/c"]);
});
