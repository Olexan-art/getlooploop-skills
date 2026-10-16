// The product's chunker: heading-aware sections, a sentence-aware window inside long ones,
// slivers folded into their host, and a hard per-page cap.

import { isCorpusCandidateUrl } from "./nonPageUrl.mjs";

export const CHUNKS_PER_PAGE = 26;

const MIN_CHUNK_CHARS = 40;

// unpaired surrogates and NUL removed.
export function sanitiseChunkText(value) {
  return value
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/\u0000/g, "");
}

export function isIndexableText(url, bodyText) {
  const text = (bodyText || "").trim();
  if (!text) return false;

  // The magic numbers a document announces itself with, at the very start.
  if (/^%PDF-/.test(text)) return false;
  if (/^\{\rtf/i.test(text)) return false;
  if (text.startsWith("PK")) return false; // docx, xlsx, pptx
  if (text.startsWith("ÐÏà")) return false; // legacy .doc

  // A file extension, or a sitemap served without one.
  if (!isCorpusCandidateUrl(url)) return false;

  // Text that is mostly not text.
  const sample = text.slice(0, 2000);
  let odd = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code < 9 || (code > 13 && code < 32) || code === 0xfffd) odd++;
  }
  return odd / Math.max(1, sample.length) < 0.1;
}

/**
 * Split a page into passages. Returns [{ chunkIndex, chunkText, sectionHeading, charCount, ... }],
 * at most CHUNKS_PER_PAGE of them; [] when the page is not indexable text.
 */
export function chunkPage(page, maxChars = 2000, overlap = 200) {
  const chunks = [];

  if (!isIndexableText(page.url, page.bodyText)) return chunks;

  const sections = extractSections(page);

  if (sections.length > 1) {
    let chunkIndex = 0;
    for (const section of sections) {
      if (!section.text.trim()) continue;
      if (section.text.length <= maxChars) {
        chunks.push({
          pageId: page.id,
          url: page.url,
          domain: page.domain,
          title: page.title,
          chunkIndex,
          chunkText: section.text.trim(),
          sectionHeading: section.heading,
          isCompetitor: page.isCompetitor,
          charCount: section.text.trim().length,
        });
        chunkIndex++;
      } else {
        const subChunks = sentenceAwareSplit(section.text, maxChars, overlap);
        for (const sub of subChunks) {
          chunks.push({
            pageId: page.id,
            url: page.url,
            domain: page.domain,
            title: page.title,
            chunkIndex,
            chunkText: sub.trim(),
            sectionHeading: section.heading,
            isCompetitor: page.isCompetitor,
            charCount: sub.trim().length,
          });
          chunkIndex++;
        }
      }
    }
  } else {
    // No clear structure — plain sliding window. `h1` is an array here, so it contributes "" (as in the product).
    const base = [
      page.title,
      typeof page.h1 === "string" ? page.h1 : "",
      page.metaDescription,
      page.bodyText,
    ].filter(Boolean).join("\n\n");

    if (!base.trim()) return [];

    const subChunks = sentenceAwareSplit(base, maxChars, overlap);
    for (let i = 0; i < subChunks.length; i++) {
      const text = subChunks[i].trim();
      if (!text) continue;
      chunks.push({
        pageId: page.id,
        url: page.url,
        domain: page.domain,
        title: page.title,
        chunkIndex: i,
        chunkText: text,
        sectionHeading: null,
        isCompetitor: page.isCompetitor,
        charCount: text.length,
      });
    }
  }

  const clean = chunks.map((chunk) => {
    const chunkText = sanitiseChunkText(chunk.chunkText);
    return {
      ...chunk,
      chunkText,
      charCount: chunkText.length,
      sectionHeading: chunk.sectionHeading ? sanitiseChunkText(chunk.sectionHeading) : chunk.sectionHeading,
    };
  });

  // Cap per page
  return mergeSlivers(clean, maxChars).slice(0, CHUNKS_PER_PAGE);
}

// a passage under 40 chars folds into the one before it.
function mergeSlivers(chunks, maxChars) {
  if (chunks.length < 2) return chunks;

  const out = [];
  for (const chunk of chunks) {
    const host = out[out.length - 1];
    const isSliver = chunk.charCount < MIN_CHUNK_CHARS;
    const joined = host ? `${host.chunkText}\n${chunk.sectionHeading || ""}\n${chunk.chunkText}`.replace(/\n{2,}/g, "\n") : "";

    if (host && isSliver && joined.length <= maxChars) {
      out[out.length - 1] = { ...host, chunkText: joined, charCount: joined.length };
      continue;
    }
    out.push(chunk);
  }

  return out.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

// How a body line and an h2 are compared: whitespace folded, case ignored.
function headingKey(text) {
  return text.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

/**
 * Which body lines start a section (2.103).
 *
 * The body is plain text, so an h2 is recognised by a line that reads the same, and any line can
 * read the same: an h3, a table cell, a card label. MDN's HTTP caching guide has an h2
 * "Validation" and, eight sections later under "Common caching patterns", an h3 "Validation";
 * up to 2.102 every line with the text started a section, so the h3 closed "Common caching
 * patterns" halfway and filed the rest of it under the earlier heading.
 *
 * What the extractor does know is the order: the h2 list and the body come from the same cleaned
 * document, so the real h2 lines appear in the body in the list's order. The longest run of
 * matching lines that follows that order is the outline (an LCS of the h2 list against the
 * matching lines, taking the latest line when two would do, so a contents list above the article
 * does not stand in for the headings below it). A matching line is refused only when the outline
 * has already moved past every h2 it could be: it comes after the real line of a later h2, and
 * reopening an earlier section there is the one reading that cannot be true. Every other matching
 * line still starts a section, as before, so pages without such a line chunk byte for byte as
 * they did.
 *
 * Not covered: a line that repeats a later h2 before that h2 is reached still cuts there, since
 * order alone cannot tell it from a contents entry; and when the order allows two lines for one
 * h2, the later one is taken.
 */
function sectionStartLines(lines, h2) {
  const keys = h2.map(headingKey);
  const known = new Set(keys);
  const lineAt = [];
  const lineKey = [];
  lines.forEach((line, index) => {
    const key = headingKey(line);
    if (known.has(key)) {
      lineAt.push(index);
      lineKey.push(key);
    }
  });

  const n = keys.length;
  const m = lineAt.length;
  const best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let a = 1; a <= n; a++) {
    for (let b = 1; b <= m; b++) {
      best[a][b] = keys[a - 1] === lineKey[b - 1]
        ? best[a - 1][b - 1] + 1
        : Math.max(best[a - 1][b], best[a][b - 1]);
    }
  }
  // The line each h2 is read at, walked back from the end so each h2 takes the latest line it can.
  const at = new Array(n).fill(-1);
  for (let a = n, b = m; a > 0 && b > 0; ) {
    if (keys[a - 1] === lineKey[b - 1]) {
      at[a - 1] = lineAt[b - 1];
      a--;
      b--;
    } else if (best[a][b - 1] >= best[a - 1][b]) {
      b--;
    } else {
      a--;
    }
  }

  const lastOf = new Map();
  keys.forEach((key, index) => lastOf.set(key, index));
  const starts = new Set();
  let reached = -1;
  let next = 0;
  for (let c = 0; c < m; c++) {
    // The furthest h2 of the outline whose line lies before this one.
    while (next < n && (at[next] === -1 || at[next] < lineAt[c])) {
      if (at[next] !== -1) reached = next;
      next++;
    }
    if ((lastOf.get(lineKey[c]) ?? -1) >= reached) starts.add(lineAt[c]);
  }
  return starts;
}

// Exported in 2.102 so the loss measurement reads the chunker's own sections. 2.103: a section
// starts only at a line that sectionStartLines accepts.
export function extractSections(page) {
  const sections = [];
  const h1 = toStringArray(page.h1);
  const h2 = toStringArray(page.h2);

  // Title, h1 and meta description as an intro section
  const intro = [page.title, h1.join(" "), page.metaDescription].filter(Boolean).join("\n");
  if (intro.trim()) {
    sections.push({ heading: page.title || h1[0] || null, text: intro });
  }

  const body = (page.bodyText || "").trim();
  if (!body) return sections;

  // Split only on h2 headings that occupy their own line.
  const introCount = sections.length;
  if (h2.length >= 2) {
    const headingByLine = new Map(h2.map((heading) => [headingKey(heading), heading.trim()]));
    const lines = body.split(/\n+/);
    const starts = sectionStartLines(lines, h2);
    let currentHeading = null;
    let current = [];
    let found = 0;
    const flush = () => {
      const text = current.join("\n").trim();
      if (text) sections.push({ heading: currentHeading, text });
      current = [];
    };
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const heading = starts.has(index) ? headingByLine.get(headingKey(line)) : undefined;
      if (heading) {
        flush();
        currentHeading = heading;
        found++;
      } else {
        current.push(line);
      }
    }
    flush();
    if (found >= 2 && sections.length) return sections;
    sections.length = introCount;
  }

  // Fallback: split by double newlines (paragraphs)
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim());
  if (paragraphs.length >= 3) {
    let current = "";
    for (const p of paragraphs) {
      if (current.length + p.length > 2000 && current.trim()) {
        sections.push({ heading: null, text: current.trim() });
        current = p;
      } else {
        current += (current ? "\n\n" : "") + p;
      }
    }
    if (current.trim()) {
      sections.push({ heading: null, text: current.trim() });
    }
  } else {
    sections.push({ heading: null, text: body });
  }

  return sections;
}

/**
 * Sliding window with ~200 chars of overlap.
 * Quirk kept on purpose: `lastIndexOf(" ")` is inside the Math.max, so in practice the cut is at
 * the last space of the window, not at the last sentence end. That is what the product does.
 */
function sentenceAwareSplit(text, maxChars, overlap) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  let i = 0;
  const step = Math.max(100, maxChars - overlap);

  while (i < clean.length) {
    let end = Math.min(clean.length, i + maxChars);
    if (end < clean.length) {
      const slice = clean.slice(i, end);
      const sp = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf(" ")
      );
      if (sp > maxChars * 0.4) end = i + sp + 1;
    }
    const part = clean.slice(i, end).trim();
    if (part) chunks.push(part);
    if (end >= clean.length) break;
    i = nextWindowStart(clean, end, Math.max(end - overlap, i + step));
  }

  return chunks;
}

/**
 * Where the next window opens: on a word, never inside one, and never past the end of the
 * window just emitted (so no text falls between two windows). A start inside a run with no
 * space before that end stays where it is.
 */
export function nextWindowStart(text, end, proposed) {
  let start = Math.min(proposed, end);
  if (start > 0 && start < end && !/\s/.test(text[start - 1])) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < end) start = space + 1;
  }
  return start;
}

function toStringArray(v) {
  if (!v) return [];
  if (typeof v === "string") return v ? [v] : [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [];
}
