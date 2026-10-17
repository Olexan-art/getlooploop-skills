// Accessibility structure a retriever and a screen reader both read: the page's images and the
// order of its headings. Read from the raw HTML with a cheerio load of its own, so the extraction
// the chunker depends on is untouched.

import * as cheerio from "cheerio";

// An alt that is only a filename ("photo_2023.jpg") says nothing to a machine or a person.
const FILENAME_ALT = /^[^\s/]+\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)$/i;

// How many samples a reader carries; the checks cap their findings at the same number.
export const MAX_SAMPLES = 6;

/**
 * { images: { total, missingAlt, emptyAlt, filenameAlt, samples },
 *   headings: { total, h1Count, skippedCount, skipped, firstLevel } }
 *
 * `missingAlt` counts an <img> with no alt attribute at all; `emptyAlt` counts alt="", which is a
 * deliberate decorative mark and is not a finding. `filenameAlt` counts an alt that is only a file
 * name. Headings are read in document order, so a level jump (h1 → h3) is visible.
 */
export function readAccessibility(html) {
  const $ = cheerio.load(html);

  const images = [];
  $("img").each((_, element) => {
    const node = $(element);
    images.push({ src: (node.attr("src") || "").trim(), alt: node.attr("alt") });
  });
  const missing = images.filter((image) => image.alt === undefined);
  const empty = images.filter((image) => image.alt === "");
  const filename = images.filter((image) => typeof image.alt === "string" && FILENAME_ALT.test(image.alt.trim()));
  const samples = [
    ...missing.map((image) => ({ text: image.src, reason: "missing" })),
    ...filename.map((image) => ({ text: image.alt, reason: "filename" })),
  ].slice(0, MAX_SAMPLES);

  const headings = [];
  $("h1,h2,h3,h4,h5,h6").each((_, element) => {
    const level = Number(element.tagName.slice(1));
    const text = ($(element).text() || "").replace(/\s+/g, " ").trim();
    headings.push({ level, text });
  });
  const skipped = [];
  for (let i = 1; i < headings.length; i++) {
    const from = headings[i - 1];
    const to = headings[i];
    if (to.level - from.level > 1) skipped.push({ from: from.level, to: to.level, text: to.text });
  }

  return {
    images: {
      total: images.length,
      missingAlt: missing.length,
      emptyAlt: empty.length,
      filenameAlt: filename.length,
      samples,
    },
    headings: {
      total: headings.length,
      h1Count: headings.filter((heading) => heading.level === 1).length,
      skippedCount: skipped.length,
      skipped: skipped.slice(0, MAX_SAMPLES),
      firstLevel: headings[0]?.level ?? null,
    },
  };
}
