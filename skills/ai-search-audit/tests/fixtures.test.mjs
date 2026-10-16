// Real public pages, saved: the Vectorscope skill's fixtures (example.com, MDN's HTTP caching
// guide with its attribution file, and GetLoopLoop's own Vectorscope pages in English and
// Ukrainian), read offline. Each one gives the findings the live run gave on the same day.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readAudit } from "../scripts/lib/reading.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { vsFixture } from "./helpers.mjs";

const CASES = [
  ["example-com.html", "https://example.com/", ["h1_missing", "meta_description_missing", "canonical_missing", "internal_links_none", "social_tags_missing", "structured_data_none"]],
  ["mdn-http-caching.html", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", ["mid_sentence_start", "nav_in_content", "social_tags_missing"]],
  ["getlooploop-vectorscope.html", "https://www.getlooploop.com/vectorscope", ["schema_required_missing", "mid_sentence_start", "nav_in_content", "page_weight_heavy", "faq_rich_result_retired", "thin_section"]],
  ["uk-vectorscope.html", "https://www.getlooploop.com/uk/vectorscope", ["schema_required_missing", "mid_sentence_start", "nav_in_content", "page_weight_heavy", "faq_rich_result_retired", "thin_section"]],
];

for (const [file, url, codes] of CASES) {
  test(`${file}: the same findings as the live run`, async () => {
    const r = await readAudit({ url, html: vsFixture(file), finalUrl: url });
    assert.equal(r.ok, true);
    const m = buildModel(r);
    assert.deepEqual(m.findings.map((f) => f.code).sort(), codes.slice().sort());
    const html = renderReport(m);
    assert.ok(html.length > 50_000 && html.includes('id="page-map"'));
  });
}

test("MDN fills all 26 slots and draws its sections on the map, the tail merged and counted", async () => {
  const url = CASES[1][1];
  const m = buildModel(await readAudit({ url, html: vsFixture("mdn-http-caching.html"), finalUrl: url }));
  assert.equal(m.passages.used, 26);
  assert.ok(m.zones.some((z) => z.label === "Types of caches"));
  assert.ok(m.caps.some((c) => c.id === "zones"));
});
