// The page map's zones come from the real document: the site header and navigation, the hero
// (the h1 up to the first h2), one zone per h2, sidebars and the footer; consecutive hidden
// panels are one zone; past MAX_ZONES the sections merge into one. Every element is tagged with
// the zone it sits in, and each finding is marked on the zone of its element.
import { test } from "node:test";
import assert from "node:assert/strict";
import { collectFacts, MAX_ZONES } from "../scripts/lib/facts.mjs";
import { jsOnlyZones } from "../scripts/lib/reading.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { page, readingOf, section } from "./helpers.mjs";

const URL_ = "https://example.org/p";
const kinds = (f) => f.zones.map((z) => z.kind);

const SHOP = `<!doctype html><html lang="en"><head><title>T</title></head><body>
<header><nav><a href="/a">A</a><a href="/b">B</a></nav><h1>BrightDesk pricing</h1><p>BrightDesk is help-desk software for support teams of three to three hundred people.</p></header>
<main><p>Loading…</p>
<h2>Plan comparison</h2><p>Compare the plans side by side and pick one.</p>
<div role="tabpanel" hidden><h2>Integrations by plan</h2><p>aaa</p></div><div role="tabpanel" hidden><h2>Security by plan</h2><p>bbb</p></div>
<p>Text after the tabs belongs to the comparison.</p>
<h2>Plan cards</h2><img src="free.png"><a href="https://other.org/x">Partner</a>
</main><aside><p>Sidebar promo</p></aside><footer><p>Footer links</p></footer></body></html>`;

test("zones top to bottom: header with navigation, hero inside the header, sections, hidden panels as one, sidebar, footer", () => {
  const f = collectFacts(SHOP, URL_);
  assert.deepEqual(kinds(f), ["header", "hero", "section", "section", "section", "aside", "footer"]);
  const [header, hero, comparison, hidden, cards] = f.zones;
  assert.equal(header.hasNav, true);
  assert.equal(hero.inHeader, true);
  assert.equal(comparison.label, "Plan comparison");
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.panels, 2);
  assert.deepEqual(hidden.headings, ["Integrations by plan", "Security by plan"]);
  assert.equal(cards.label, "Plan cards");
});

test("each element sits in its zone: the image and the link in Plan cards, the lede in the hero's header, text after hidden tabs back in the zone before", () => {
  const f = collectFacts(SHOP, URL_);
  const zoneOf = (label) => f.zones.find((z) => z.label === label).id;
  assert.equal(f.images[0].zone, zoneOf("Plan cards"));
  assert.equal(f.links.find((l) => !l.internal).zone, zoneOf("Plan cards"));
  assert.equal(f.links.find((l) => l.internal).zone, 0);
  assert.equal(f.removedHeaders.length, 1);
  assert.equal(f.removedHeaders[0].ledeCount, 1);
  assert.equal(f.placeholders[0].zone, f.zones.find((z) => z.kind === "hero").id);
  assert.deepEqual(f.hiddenHeadings.map((h) => h.zone), [3, 3]);
  const comparison = f.zones.find((z) => z.label === "Plan comparison");
  assert.ok(comparison.chars > "Compare the plans side by side and pick one.".length + 10, "text after the hidden tabs counts toward the comparison zone");
});

test("findings are marked on the zone of their element", async () => {
  const r = await readingOf(SHOP, {}, { url: URL_ });
  const m = buildModel(r);
  const zoneOf = (code) => m.findings.find((f) => f.code === code)?.zones;
  const hero = m.zones.find((z) => z.kind === "hero").id;
  const hidden = m.zones.find((z) => z.hidden).id;
  const cards = m.zones.find((z) => z.label === "Plan cards").id;
  assert.deepEqual(zoneOf("hero_lede_dropped"), [hero]);
  assert.deepEqual(zoneOf("hidden_headings"), [hidden]);
  assert.deepEqual(zoneOf("image_alt_missing"), [cards]);
  assert.deepEqual(zoneOf("ssr_placeholder_text"), [hero]);
  // Head problems go to the <head> strip, not the page.
  const title = m.head.find((h) => h.id === "description");
  assert.ok(title.pins.some((f) => f.code === "meta_description_missing"));
});

test("a short text before the h1 folds into the hero; a page with no headings is one zone", () => {
  const f = collectFacts(`<html><body><main><p>Home › Docs</p><h1>Title</h1><p>Body text.</p><h2>One</h2><p>x</p></main></body></html>`, URL_);
  assert.deepEqual(kinds(f), ["hero", "section"]);
  const g = collectFacts(`<html><body><p>Only a paragraph of text and nothing else.</p></body></html>`, URL_);
  assert.deepEqual(kinds(g), ["intro"]);
});

test("past MAX_ZONES the remaining sections merge into one zone that keeps the count", () => {
  const html = page({ body: Array.from({ length: 20 }, (_, i) => section(`S${i}`)).join("") });
  const f = collectFacts(html, URL_);
  assert.equal(f.zones.length, MAX_ZONES);
  const more = f.zones.find((z) => z.kind === "more");
  assert.ok(more.merged >= 7);
  assert.ok(more.headings.includes("S19"));
});

test("a section only the JavaScript render has becomes a dashed zone after the one it follows", () => {
  const plain = collectFacts(`<html><body><main><h1>T</h1><p>x</p><h2>Calculator</h2><div id="calc"></div><h2>FAQ</h2><p>y</p></main></body></html>`, URL_);
  const rendered = collectFacts(`<html><body><main><h1>T</h1><p>x</p><h2>Calculator</h2><div id="calc"><h2>Your estimate</h2><p>Seats and price.</p></div><h2>FAQ</h2><p>y</p></main></body></html>`, URL_);
  const js = jsOnlyZones(plain, rendered);
  assert.equal(js.length, 1);
  assert.equal(js[0].label, "Your estimate");
  assert.equal(js[0].after, plain.zones.find((z) => z.label === "Calculator").id);
});

test("a heading's text with glued spans and its spaced form are one heading", () => {
  const f = collectFacts(`<html><body><main><h1><span>Bright</span><span>Desk plans</span></h1></main></body></html>`, URL_);
  assert.equal(f.headings[0].glued.length, 1);
});
