// Losses at every stage (2.102): every removal reason on synthetic HTML, the waterfall summing
// exactly, the section map, the honest past-the-cap count, and the cap on listed removals.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readPage } from "../scripts/lib/reading.mjs";
import { REMOVAL_REASONS, MAX_REMOVAL_ITEMS, charsPastCap } from "../scripts/lib/losses.mjs";
import { runChecks } from "../scripts/lib/checks.mjs";

const read = (html, url = "https://example.org/page") => readPage({ url, html, robots: "skip" });
const fixture = readFileSync(new URL("./fixtures/removals.html", import.meta.url), "utf8");
const doc = (body, head = "<title>Synthetic page</title>") => `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
const prose = (n, word = "sentence") => Array.from({ length: n }, (_, i) => `This is ${word} number ${i} of the synthetic page, written to be kept.`).join(" ");

function sums(losses) {
  const w = losses.waterfall;
  assert.equal(w.raw, w.kept + w.removed, "raw = kept + removed");
  assert.equal(w.kept, w.inPassagesUnique + w.notInPassages + w.pastCap, "kept = unique + not in passages + past cap");
  assert.equal(w.removed, losses.removals.byReason.reduce((s, r) => s + r.chars, 0), "removed = the sum of the reasons");
  assert.equal(losses.notInPassages.headingLines + losses.notInPassages.whitespace + losses.notInPassages.other, w.notInPassages);
}

test("every removal reason is named, with the element, its path, its chars and a sample", async () => {
  const r = await read(fixture, "https://example.org/removals");
  assert.ok(r.ok);
  assert.equal(r.losses.consistent, true);
  const reasons = new Set(r.losses.removals.byReason.map((b) => b.reason));
  for (const reason of REMOVAL_REASONS) assert.ok(reasons.has(reason), `reason ${reason} not seen`);
  const find = (reason, text) => r.losses.removals.items.find((i) => i.reason === reason && i.sample.includes(text));
  const expect = [
    ["script_style", "a script in the body"],
    ["script_style", "Please enable JavaScript"],
    ["embedded", "SVG label text"],
    ["head_meta", "Removal fixture"],
    ["hidden", "Hidden attribute text"],
    ["hidden", "Aria hidden decorative"],
    ["header_chrome", "Site banner tagline"],
    ["banner_role", "Role banner strip"],
    ["header_controls", "Contents dropdown option"],
    ["nav", "Role navigation links"],
    ["footer", "Footer copyright"],
    ["aside", "Aside related reading"],
    ["aside", "Complementary box"],
    ["contentinfo_role", "Role contentinfo"],
    ["form_control", "Subscribe now"],
    ["overlay_class", "We use cookies"],
    ["overlay_class", "Join our newsletter"],
    ["overlay_class", "Modal dialog"],
    ["outside_main", "Outside main promo"],
  ];
  for (const [reason, text] of expect) {
    const item = find(reason, text);
    assert.ok(item, `${reason}: ${text}`);
    assert.ok(item.chars > 0 && item.element && item.path, `${reason}: ${text} has chars, element and path`);
  }
  assert.equal(find("overlay_class", "We use cookies").element, "div.cookie-banner");
  // The kept header lost only its controls: its title and lede are in the text.
  assert.ok(r.passages.some((p) => p.text.includes("The lede of the article stays")));
  // Removed text is in no passage.
  for (const gone of ["Subscribe now", "We use cookies", "Footer copyright", "Outside main promo"]) assert.ok(!r.passages.some((p) => p.text.includes(gone)), gone);
  sums(r.losses);
});

test("each removal counts its own text once: nested matches are not counted twice", async () => {
  const r = await read(doc(`<main><h2>One</h2><p>${prose(4)}</p><h2>Two</h2><p>${prose(4, "line")}</p></main><nav><div hidden>inner hidden</div><a>Menu link text</a></nav>`));
  const navs = r.losses.removals.items.filter((i) => i.sample.includes("Menu link text"));
  assert.equal(navs.length, 1);
  // The hidden div went first (non-rendered pass), so the nav no longer holds its words.
  assert.ok(!navs[0].sample.includes("inner hidden"));
  assert.equal(r.losses.removals.items.filter((i) => i.sample.includes("inner hidden")).length, 1);
  sums(r.losses);
});

test("the waterfall sums exactly on every fixture page", async () => {
  for (const [file, url] of [
    ["example-com.html", "https://example.com/"],
    ["getlooploop-vectorscope.html", "https://www.getlooploop.com/vectorscope"],
    ["uk-vectorscope.html", "https://www.getlooploop.com/uk/vectorscope"],
    ["uk-voicescope.html", "https://www.getlooploop.com/uk/voicescope"],
  ]) {
    const r = await read(readFileSync(new URL(`./fixtures/${file}`, import.meta.url), "utf8"), url);
    assert.equal(r.losses.consistent, true, file);
    assert.equal(r.losses.passages.unlocated, 0, `${file}: every passage located`);
    assert.equal(r.losses.notInPassages.other, 0, `${file}: nothing unexplained`);
    assert.equal(r.losses.passages.total, r.page.charsIndexed, `${file}: total is charsIndexed`);
    sums(r.losses);
    // Below the cap nothing is past it.
    if (!r.page.capReached) assert.equal(r.losses.waterfall.pastCap, 0, file);
  }
});

test("past the cap: counted from the unique text, so it no longer reads 0 when the cap cut a tail", async () => {
  // 32 short h2 sections and a long description: the overlapping total exceeds the body, so the
  // 2.101 estimate reads 0, while six sections fall past the 26-passage cap.
  const description = "D".repeat(10) + " " + "long description words ".repeat(60);
  const sections = Array.from({ length: 32 }, (_, i) => `<h2>Section ${i}</h2><p>Section ${i} text says one thing about subject ${i} in plain words.</p>`).join("");
  const r = await read(doc(`<main>${sections}</main>`, `<title>Capped</title><meta name="description" content="${description}">`));
  assert.equal(r.page.capReached, true);
  assert.equal(r.page.charsUnread, 0, "the legacy field keeps its 2.101 value");
  const past = r.losses.waterfall.pastCap;
  assert.ok(past > 0, "the honest count sees the tail");
  assert.equal(charsPastCap(r), past);
  // The sections after the last passage reached no passage at all; the ones before reached one in full.
  const h2 = r.losses.sections.rows.filter((row) => row.kind === "h2");
  const cut = h2.filter((row) => row.inPassages === 0);
  const firstCut = h2.indexOf(cut[0]);
  assert.ok(h2.slice(0, firstCut - 1).every((row) => row.inPassages === row.chars));
  assert.ok(h2.slice(firstCut).every((row) => row.inPassages === 0));
  assert.ok(cut.length >= 6);
  sums(r.losses);
  // cap_overflow now fires, and says how much.
  const finding = runChecks(r).find((f) => f.code === "cap_overflow");
  assert.ok(finding);
  assert.equal(finding.evidence.charsPastCap, past);
  assert.equal(finding.evidence.charsUnread, 0);
});

test("a reading from 2.101 (no losses) still works: the legacy number is used", () => {
  const old = { ok: true, page: { capReached: true, charsUnread: 1234 }, passages: [] };
  assert.equal(charsPastCap(old), 1234);
});

test("the section map: intro, the text before the first h2, each h2", async () => {
  const r = await read(fixture, "https://example.org/removals");
  const kinds = r.losses.sections.rows.map((row) => row.kind);
  assert.deepEqual(kinds, ["intro", "before_first_h2", "h2", "h2"]);
  assert.equal(r.losses.sections.mode, "h2");
  for (const row of r.losses.sections.rows) assert.equal(row.inPassages, row.chars, row.heading ?? row.kind);
});

test("removals past the listing cap are counted, never dropped", async () => {
  const many = Array.from({ length: MAX_REMOVAL_ITEMS + 25 }, (_, i) => `<span hidden>hidden note ${i}</span>`).join("");
  const r = await read(doc(`<main><h2>A</h2><p>${prose(3)}</p><h2>B</h2><p>${prose(3, "line")}</p>${many}</main>`));
  const rm = r.losses.removals;
  assert.equal(rm.items.length, MAX_REMOVAL_ITEMS);
  assert.equal(rm.elementsWithText, MAX_REMOVAL_ITEMS + 25 + rm.byReason.filter((b) => b.reason !== "hidden").reduce((s, b) => s + b.elements, 0));
  assert.equal(rm.omitted.elements, rm.elementsWithText - MAX_REMOVAL_ITEMS);
  assert.equal(rm.items.reduce((s, x) => s + x.chars, 0) + rm.omitted.chars, rm.chars);
  sums(r.losses);
});

test("a page in Russian is refused before any measurement: no losses", async () => {
  const r = await read(`<html lang="ru"><head><title>x</title></head><body><main><p>${prose(5)}</p></main></body></html>`);
  assert.equal(r.ok, false);
  assert.equal(r.reasonCode, "refused_language_ru");
  assert.equal(r.losses, undefined);
});
