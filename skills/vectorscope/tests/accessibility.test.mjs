import { test } from "node:test";
import assert from "node:assert/strict";
import { readAccessibility } from "../scripts/lib/accessibility.mjs";

test("readAccessibility: images, missing alt, empty alt and filename alt", () => {
  const html = `
    <img src="/hero.png">
    <img src="/a.jpg" alt="">
    <img src="/b.jpg" alt="photo_2023.jpg">
    <img src="/c.svg" alt="A diagram of the pipeline">
    <img src="/d.png" alt="Chart of monthly visits">
  `;
  const a = readAccessibility(html);
  assert.equal(a.images.total, 5);
  assert.equal(a.images.missingAlt, 1);
  assert.equal(a.images.emptyAlt, 1);
  assert.equal(a.images.filenameAlt, 1);
  assert.deepEqual(a.images.samples, [{ text: "/hero.png", reason: "missing" }, { text: "photo_2023.jpg", reason: "filename" }]);
});

test("readAccessibility: heading order, level jumps and multiple h1", () => {
  const html = `
    <h1>Title</h1>
    <h3>Skipped</h3>
    <h2>Back</h2>
    <h4>Skipped again</h4>
    <h1>Second h1</h1>
  `;
  const a = readAccessibility(html);
  assert.equal(a.headings.total, 5);
  assert.equal(a.headings.h1Count, 2);
  assert.equal(a.headings.skippedCount, 2);
  assert.deepEqual(a.headings.skipped, [
    { from: 1, to: 3, text: "Skipped" },
    { from: 2, to: 4, text: "Skipped again" },
  ]);
  assert.equal(a.headings.firstLevel, 1);
});

test("readAccessibility: consecutive headings do not jump, and the first level is read", () => {
  const a = readAccessibility("<h2>Only</h2><h3>Child</h3>");
  assert.equal(a.headings.total, 2);
  assert.equal(a.headings.h1Count, 0);
  assert.equal(a.headings.skippedCount, 0);
  assert.equal(a.headings.firstLevel, 2);
});

test("readAccessibility: an empty page has nothing", () => {
  const a = readAccessibility("");
  assert.deepEqual(a, {
    images: { total: 0, missingAlt: 0, emptyAlt: 0, filenameAlt: 0, samples: [] },
    headings: { total: 0, h1Count: 0, skippedCount: 0, skipped: [], firstLevel: null },
  });
});
