// The HTML report: self-contained (a CSP that blocks the network, nothing loaded from outside),
// page text escaped, both languages present, the Lite layout's sections in order, and no prose
// that belongs to the full version (no rule text, no fix directions). The Markdown and the JSON
// come from the same model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildModel } from "../scripts/lib/model.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { buildExport, renderMarkdown } from "../scripts/lib/outputs.mjs";
import { EXPORT_SCHEMA } from "../scripts/lib/version.mjs";
import { page, readingOf, section } from "./helpers.mjs";

const EVIL = `<img src=x onerror="alert(1)">`;
const html = page({ title: `Title ${EVIL}`, body: section(`Heading ${EVIL}`) + '<img src="a.png">' + section("Second") });

async function report() {
  const r = await readingOf(html);
  const m = buildModel(r);
  return { r, m, out: renderReport(m) };
}

test("a CSP that blocks every network request, and nothing loaded from outside", async () => {
  const { out } = await report();
  assert.match(out, /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">/);
  for (const m of out.matchAll(/\ssrc="([^"]*)"/g)) assert.ok(m[1].startsWith("data:"), `src ${m[1].slice(0, 40)}`);
  assert.ok(!/<link[^>]+rel="stylesheet"/.test(out));
  assert.ok(!/<script[^>]+src=/.test(out));
});

test("page text is escaped wherever it appears", async () => {
  const { out } = await report();
  assert.ok(!out.includes(EVIL));
  assert.ok(out.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
});

test("the Lite layout: verdict, six tiles, the map, biggest problems, the charts, the checklist, languages, cannot see, footer", async () => {
  const { out } = await report();
  const order = ['id="verdict"', 'id="status"', 'id="page-map"', 'id="biggest"', 'id="lc-severity"', 'id="lc-text"', 'id="lc-bots"', 'id="lc-classic"', 'id="lc-langs"', 'id="cannot-see"', 'id="full-link"', 'class="foot"'];
  let at = -1;
  for (const id of order) {
    const i = out.indexOf(id);
    assert.ok(i > at, `${id} out of order`);
    at = i;
  }
  assert.equal((out.match(/<li class="tile /g) || []).length, 6);
  for (const q of ["Shown well in search?", "AI finds it?", "AI reads all of it?", "AI quotes it right?", "AI gets the brand right?", "Languages in order?"]) assert.ok(out.includes(q), q);
  assert.ok(!out.includes("Rich results &amp; markup"));
  assert.ok(out.includes('id="tile-brand"') && out.includes("no brand.json or reviews.json"), "the brand tile says it was not checked");
  assert.equal((out.match(/id="cg-/g) || []).length, 33);
  assert.ok(out.includes('href="https://www.getlooploop.com"'));
});

test("both languages are in the file, and Lite carries no rule text and no fix directions", async () => {
  const { out } = await report();
  assert.ok(out.includes('class="l-uk" lang="uk"'));
  assert.ok(out.includes("Мапа сторінки"));
  assert.ok(!/What the rule says|Fix direction|Що каже правило|Напрям виправлення/.test(out));
  // The one quoted source on the page is the llms.txt note; every rule source is in the export.
  assert.ok(out.includes('id="llms-note"'));
  assert.ok(!out.replace(/<p class="capnote" id="llms-note">.*?<\/p>/s, "").includes("developers.google.com"), "rule sources are in the export, not on the Lite page");
});

test("the export: the schema id, every finding with its rule sources, the same pins as the report", async () => {
  const { m, out } = await report();
  const x = buildExport(m);
  assert.equal(x.schema, EXPORT_SCHEMA);
  assert.equal(x.findings.length, m.findings.length);
  for (const f of x.findings) {
    assert.ok(f.rules.length && f.rules.every((s) => s.url.startsWith("https://")), f.code);
    assert.ok(f.label.en && f.label.uk, f.code);
  }
  for (const f of m.findings) assert.ok(out.includes(`id="${f.big ? "big" : "pin"}-${f.id}"`), f.id);
  const md = renderMarkdown(m);
  assert.ok(md.startsWith("# AI Search Audit Lite: https://example.org/page"));
  for (const f of m.findings) assert.ok(md.includes(`\`${f.code}\``), f.code);
});
