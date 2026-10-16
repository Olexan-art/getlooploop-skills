// A section starts at an h2, not at every line that reads like one (2.103).
//
// The fixture is MDN's HTTP caching guide as served on 16 Oct 2026 (Mozilla Contributors,
// CC BY-SA 2.5; see fixtures/mdn-http-caching.ATTRIBUTION.txt). It has an h2 "Validation" and,
// eight sections later under the h2 "Common caching patterns", an h3 "Validation". Up to 2.102 the
// h3 line started a section, so the second half of "Common caching patterns" was filed under
// "Validation" and the page's last section fell past the passage cap. These tests fail on 2.102.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyseHtml } from "../scripts/lib/extract.mjs";
import { chunkPage, extractSections } from "../scripts/lib/chunk.mjs";

const URL_MDN = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching";

function readMdn() {
  const html = readFileSync(new URL("./fixtures/mdn-http-caching.html", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const page = analyseHtml({ html, url: URL_MDN, requestedUrl: URL_MDN });
  const input = {
    id: "mdn",
    url: URL_MDN,
    domain: "developer.mozilla.org",
    title: page.title || null,
    h1: page.h1,
    h2: page.h2,
    metaDescription: page.metaDescription || null,
    bodyText: page.bodyText || null,
    isCompetitor: false,
  };
  return { page, sections: extractSections(input), chunks: chunkPage(input) };
}

test("MDN caching: the h3 'Validation' under 'Common caching patterns' does not start a section", () => {
  const { page, sections, chunks } = readMdn();
  // The page really has the text twice in the body, once as the h2 and once as the h3.
  assert.equal(page.h2.filter((h) => h === "Validation").length, 1);
  assert.equal(page.bodyText.split(/\n+/).filter((line) => line.trim() === "Validation").length, 2);

  const headings = sections.map((s) => s.heading);
  assert.equal(headings.filter((h) => h === "Validation").length, 1, "one section per h2");
  // The intro, the text before the first h2, then each h2 once, in order.
  assert.equal(headings[1], null);
  assert.deepEqual(headings.slice(2), page.h2, "the sections are the h2s, in order, once each");

  // The h3 stays inside its own section, as text.
  const patterns = sections.find((s) => s.heading === "Common caching patterns");
  assert.match(patterns.text, /\nValidation\nDon't forget to set the Last-Modified and ETag headers/);
  assert.match(patterns.text, /\nMain resources\n/);
  const validation = sections.find((s) => s.heading === "Validation");
  assert.doesNotMatch(validation.text, /Don't forget to set the Last-Modified/);

  // The passages agree: none after "Common caching patterns" is labelled "Validation", and the
  // slot the extra cut used now holds the page's last section.
  const firstPattern = chunks.findIndex((c) => c.sectionHeading === "Common caching patterns");
  assert.ok(firstPattern > 0);
  assert.deepEqual(
    chunks.slice(firstPattern).map((c) => c.sectionHeading),
    [...Array(5).fill("Common caching patterns"), "See also", "Help improve MDN"],
  );
  assert.equal(chunks.length, 26);
});

const base = { title: "T", h1: ["T"], metaDescription: null };

test("a line repeating an earlier h2 after a later h2 is text of the section it sits in", () => {
  const sections = extractSections({
    ...base,
    h2: ["Alpha", "Beta"],
    bodyText: "Alpha\nalpha text\nBeta\nbeta text\nAlpha\nmore beta text",
  });
  assert.deepEqual(sections.slice(1), [
    { heading: "Alpha", text: "alpha text" },
    { heading: "Beta", text: "beta text\nAlpha\nmore beta text" },
  ]);
});

test("a contents list above the article still reads as before, and the real headings still cut", () => {
  const sections = extractSections({
    ...base,
    h2: ["Alpha", "Beta"],
    bodyText: "Contents\nAlpha\nBeta\nAlpha\nalpha text\nBeta\nbeta text",
  });
  assert.deepEqual(sections.slice(1), [
    { heading: null, text: "Contents" },
    { heading: "Alpha", text: "alpha text" },
    { heading: "Beta", text: "beta text" },
  ]);
});

test("a heading repeated inside its own section still cuts, under the same name, as before", () => {
  const sections = extractSections({
    ...base,
    h2: ["Alpha", "Beta"],
    bodyText: "Alpha\nfirst\nAlpha\nsecond\nBeta\nthird",
  });
  assert.deepEqual(sections.slice(1), [
    { heading: "Alpha", text: "first" },
    { heading: "Alpha", text: "second" },
    { heading: "Beta", text: "third" },
  ]);
});

test("two h2s with the same text each start a section", () => {
  const sections = extractSections({
    ...base,
    h2: ["Example", "Notes", "Example"],
    bodyText: "Example\none\nNotes\ntwo\nExample\nthree",
  });
  assert.deepEqual(sections.slice(1).map((s) => [s.heading, s.text]), [
    ["Example", "one"],
    ["Notes", "two"],
    ["Example", "three"],
  ]);
});
