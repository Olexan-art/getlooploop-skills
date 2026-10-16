// Where the text goes, stage by stage: the raw HTML's text, what the cleaner removed (and why),
// what it kept, how much of that reached a passage, and what fell past the cap. 2.102.
//
// This module observes and never alters. It runs the extractor a second time on its own copy of
// the document with an observer attached (the observer only reads: .text(), attributes, parents),
// checks that the extraction came out identical to the one the chunker used, and maps the
// passages back onto the kept text. Nothing here feeds a passage, a page field or the vocabulary.
//
// One unit throughout: characters of text with every run of whitespace folded to one space.
// The kept text is the extractor's body text in that unit; each removal is the removed element's
// own text, at the moment it was removed, in that unit. "Text in the raw HTML" is defined as the
// kept text plus every removal, so the waterfall sums exactly by construction; it is an estimate
// of the document's text, not a separate count of it.

import * as cheerio from "cheerio";
import { extractVisiblePageText } from "./extract.mjs";
import { extractSections } from "./chunk.mjs";

/** Removal reasons, as wire codes; the report owns the words (i18n.mjs). In display order. */
export const REMOVAL_REASONS = [
  "script_style",
  "embedded",
  "head_meta",
  "hidden",
  "header_chrome",
  "banner_role",
  "header_controls",
  "nav",
  "footer",
  "aside",
  "contentinfo_role",
  "form_control",
  "overlay_class",
  "outside_main",
];

/** At most this many removed elements are listed one by one; the rest are counted, never dropped silently. */
export const MAX_REMOVAL_ITEMS = 200;
/** How much of a removed element's text is kept as a sample. */
export const SAMPLE_CHARS = 80;
/** How far before the previous passage's end the next one is looked for (the window overlap is about 200). */
export const LOCATE_BACK_CHARS = 600;

/** Text in the measuring unit: removal marks as spaces, whitespace folded, trimmed. */
export function foldText(text) {
  return String(text ?? "").replace(//g, " ").replace(/\s+/g, " ").trim();
}

/** An element node: domhandler gives script and style their own types. */
const isElement = (node) => node && (node.type === "tag" || node.type === "script" || node.type === "style");

// Which rule removed an element. Tags first, then roles and attributes, then the class patterns.
function nonRenderedReason(node) {
  const tag = (node.name || "").toLowerCase();
  if (["script", "style", "noscript", "template"].includes(tag)) return "script_style";
  if (["svg", "canvas", "iframe", "object", "embed"].includes(tag)) return "embedded";
  if (["head", "link", "meta"].includes(tag)) return "head_meta";
  return "hidden";
}

function chromeReason($, node) {
  const tag = (node.name || "").toLowerCase();
  const el = $(node);
  if (tag === "nav") return "nav";
  if (tag === "footer") return "footer";
  if (tag === "aside") return "aside";
  if (["form", "button", "select", "textarea", "input"].includes(tag)) return "form_control";
  const role = (el.attr("role") || "").trim().toLowerCase();
  if (role === "navigation") return "nav";
  if (role === "banner") return "banner_role";
  if (role === "contentinfo") return "contentinfo_role";
  if (role === "complementary") return "aside";
  return "overlay_class";
}

/** A short name for an element: tag, #id and up to two classes. */
function nameOf(node) {
  const tag = (node.name || "?").toLowerCase();
  const id = node.attribs?.id ? `#${String(node.attribs.id).trim().split(/\s+/)[0]}` : "";
  const classes = String(node.attribs?.class || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((c) => `.${c}`)
    .join("");
  return `${tag}${id}${classes}`.slice(0, 80);
}

/** A short CSS path: up to three ancestors (below body), then the element. */
function pathOf(node) {
  const parts = [];
  let current = node.parent;
  while (isElement(current) && !["body", "html"].includes(current.name) && parts.length < 3) {
    const id = current.attribs?.id ? `#${String(current.attribs.id).trim().split(/\s+/)[0]}` : "";
    const cls = String(current.attribs?.class || "").trim().split(/\s+/).filter(Boolean)[0];
    parts.unshift(`${current.name}${id || (cls ? `.${cls}` : "")}`);
    current = current.parent;
  }
  const more = isElement(current) && !["body", "html"].includes(current.name) ? "… > " : "";
  return `${more}${[...parts, nameOf(node)].join(" > ")}`.slice(0, 160);
}

function row($, node, reason, chars, text) {
  return {
    reason,
    tag: (node.name || "#text").toLowerCase(),
    id: node.attribs?.id ? String(node.attribs.id).slice(0, 60) : null,
    classes: String(node.attribs?.class || "").trim().split(/\s+/).filter(Boolean).slice(0, 4),
    element: isElement(node) ? nameOf(node) : "#text",
    path: isElement(node) ? pathOf(node) : `${pathOf(node.parent)} > #text`,
    chars,
    sample: text.slice(0, SAMPLE_CHARS),
  };
}

/** An observer for extractVisiblePageText: records every removal, reads only. */
function makeObserver() {
  const rows = [];
  let elements = 0;
  const outermost = (selection) => {
    const nodes = selection.toArray();
    const set = new Set(nodes);
    return nodes.filter((node) => {
      for (let p = node.parent; p; p = p.parent) if (set.has(p)) return false;
      return true;
    });
  };
  const record = ($, node, reason) => {
    elements += 1;
    const text = foldText($(node).text());
    if (text.length) rows.push(row($, node, reason, text.length, text));
  };
  return {
    rows,
    get elements() {
      return elements;
    },
    removing($, selection, step) {
      for (const node of outermost(selection)) {
        const reason = step === "non_rendered" ? nonRenderedReason(node) : step === "chrome" ? chromeReason($, node) : step;
        if (reason === "head_meta" && (node.name || "").toLowerCase() === "head") {
          // The head goes whole; its scripts and styles are named as such, the rest (the title) as head.
          let code = 0;
          for (const inner of outermost($(node).find("script, style, noscript, template"))) {
            const before = rows.length;
            record($, inner, "script_style");
            if (rows.length > before) code += rows[rows.length - 1].chars;
          }
          elements += 1;
          const text = foldText($(node).text());
          const chars = Math.max(0, text.length - code);
          if (chars) rows.push(row($, node, "head_meta", chars, foldText($(node).find("title").first().text()) || text));
          continue;
        }
        record($, node, reason);
      }
    },
    headerTrimmed($, header, keptHtml) {
      elements += 1;
      const full = foldText(header.text());
      const kept = foldText(cheerio.load(`<div>${keptHtml}</div>`, null, false).text());
      const chars = Math.max(0, full.length - kept.length);
      if (chars) {
        // The sample is what went: the header's text with the kept prose taken out, where that is a clean cut.
        const sample = full.startsWith(kept) ? full.slice(kept.length).trim() : full;
        rows.push(row($, header[0], "header_controls", chars, sample));
      }
    },
    mainRegion($, best) {
      // Everything in the body outside the chosen region: the region's siblings at every level up to body.
      for (let node = best; node && node.parent && !(isElement(node) && node.name === "body"); node = node.parent) {
        const parent = node.parent;
        if (parent.type === "root") break;
        let loose = "";
        for (const sibling of parent.children || []) {
          if (sibling === node) continue;
          if (isElement(sibling)) {
            elements += 1;
            const text = foldText($(sibling).text());
            if (text.length) rows.push(row($, sibling, "outside_main", text.length, text));
          } else if (sibling.type === "text") {
            loose += ` ${sibling.data || ""}`;
          }
        }
        const text = foldText(loose);
        if (text.length) rows.push(row($, { type: "text", name: "#text", parent }, "outside_main", text.length, text));
        if (isElement(parent) && parent.name === "body") break;
      }
    },
  };
}

/** Merge [start, end) intervals and return their total length. */
function unionLength(intervals) {
  const sorted = intervals.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cs = -1;
  let ce = -1;
  for (const [a, b] of sorted) {
    if (a > ce) {
      if (ce > cs) total += ce - cs;
      cs = a;
      ce = b;
    } else if (b > ce) ce = b;
  }
  if (ce > cs) total += ce - cs;
  return total;
}

/** Find `needle` in `hay` at or after `from - LOCATE_BACK_CHARS`, else anywhere; -1 if absent. */
function locate(hay, needle, from) {
  if (!needle) return -1;
  const near = hay.indexOf(needle, Math.max(0, from - LOCATE_BACK_CHARS));
  return near !== -1 ? near : hay.indexOf(needle);
}

/**
 * Measure the losses for one read page. `page` is the object handed to the chunker (title, h1, h2,
 * metaDescription, bodyText, url), `passages` the reading's passages, `capReached` the cap flag,
 * `html` the fetched document and `bodyText` the extraction the chunker used.
 */
export function measureLosses({ html, chunkerPage, passages, capReached }) {
  const observer = makeObserver();
  const observed = extractVisiblePageText(cheerio.load(html), observer);
  const consistent = observed.bodyText === (chunkerPage.bodyText || "");

  const body = foldText(chunkerPage.bodyText || "");
  const kept = body.length;

  // ── where each passage sits in the kept text
  const h1 = Array.isArray(chunkerPage.h1) ? chunkerPage.h1 : chunkerPage.h1 ? [chunkerPage.h1] : [];
  const intros = [
    foldText([chunkerPage.title, h1.join(" "), chunkerPage.metaDescription].filter(Boolean).join("\n")),
    foldText([chunkerPage.title, typeof chunkerPage.h1 === "string" ? chunkerPage.h1 : "", chunkerPage.metaDescription].filter(Boolean).join("\n\n")),
  ].filter(Boolean);
  const intervals = [];
  const placed = [];
  let lastEnd = 0;
  let introChars = 0;
  let unlocated = 0;
  let located = 0;
  for (const passage of passages) {
    const text = foldText(passage.text);
    let rest = text;
    let intro = 0;
    let at = locate(body, rest, lastEnd);
    if (at === -1) {
      for (const candidate of intros) {
        if (rest === candidate) {
          intro = candidate.length;
          rest = "";
          break;
        }
        if (rest.startsWith(`${candidate} `)) {
          const tail = rest.slice(candidate.length + 1);
          const found = locate(body, tail, lastEnd);
          if (found !== -1) {
            intro = candidate.length;
            rest = tail;
            at = found;
            break;
          }
        }
      }
    }
    introChars += intro;
    if (rest && at !== -1) {
      intervals.push([at, at + rest.length]);
      located += rest.length;
      lastEnd = Math.max(lastEnd, at + rest.length);
      placed.push({ index: passage.index, start: at, end: at + rest.length, intro });
    } else {
      if (rest) unlocated += rest.length;
      placed.push({ index: passage.index, start: null, end: null, intro });
    }
  }
  const covered = new Uint8Array(kept);
  for (const [a, b] of intervals) covered.fill(1, a, b);
  const unique = unionLength(intervals);

  // Past the cap: kept text after the last passage, counted only when every slot was filled.
  let tailStart = kept;
  if (capReached) {
    tailStart = lastEnd;
    while (tailStart < kept && body[tailStart] === " ") tailStart++;
  }
  const pastCap = kept - tailStart;

  // ── the chunker's sections, located in the kept text
  const sections = extractSections(chunkerPage);
  const hasIntro = Boolean(sections.length && intros.length && foldText(sections[0].text) === intros[0]);
  const bodySections = hasIntro ? sections.slice(1) : sections;
  const ranges = [];
  let cursor = 0;
  for (const section of bodySections) {
    const text = foldText(section.text);
    const at = text ? body.indexOf(text, cursor) : -1;
    if (at === -1) ranges.push({ heading: section.heading ?? null, start: null, end: null, chars: text.length });
    else {
      ranges.push({ heading: section.heading ?? null, start: at, end: at + text.length, chars: text.length });
      cursor = at + text.length;
    }
  }
  const inSection = new Uint8Array(kept);
  for (const r of ranges) if (r.start !== null) inSection.fill(1, r.start, r.end);

  // Kept text before the tail that no passage holds: heading lines, the spaces between, and anything else.
  let headingLines = 0;
  let whitespace = 0;
  let other = 0;
  for (let i = 0; i < tailStart; i++) {
    if (covered[i]) continue;
    if (body[i] === " ") whitespace++;
    else if (inSection[i]) other++;
    else headingLines++;
  }
  const notInPassages = headingLines + whitespace + other;

  // ── the section map: for each h2 section (and the intro), how much reached a passage
  const h2Mode = bodySections.some((s) => s.heading);
  const rows = [];
  if (hasIntro) rows.push({ kind: "intro", heading: null, chars: intros[0].length, inPassages: Math.min(intros[0].length, introChars), located: true });
  const coveredIn = (start, end) => {
    let n = 0;
    for (let i = start; i < end; i++) n += covered[i];
    return n;
  };
  if (h2Mode) {
    ranges.forEach((r, i) => {
      rows.push({
        kind: r.heading ? "h2" : i === 0 ? "before_first_h2" : "body",
        heading: r.heading,
        chars: r.chars,
        inPassages: r.start === null ? null : coveredIn(r.start, r.end),
        located: r.start !== null,
      });
    });
  } else if (ranges.length) {
    const ok = ranges.every((r) => r.start !== null);
    const chars = ranges.reduce((s, r) => s + r.chars, 0);
    rows.push({ kind: "body", heading: null, chars, inPassages: ok ? ranges.reduce((s, r) => s + coveredIn(r.start, r.end), 0) : null, located: ok });
  }

  // ── removals: largest first, every one counted
  const all = observer.rows.slice().sort((a, b) => b.chars - a.chars || a.path.localeCompare(b.path));
  const removedChars = all.reduce((s, r) => s + r.chars, 0);
  const byReason = REMOVAL_REASONS.map((reason) => {
    const list = all.filter((r) => r.reason === reason);
    return { reason, elements: list.length, chars: list.reduce((s, r) => s + r.chars, 0) };
  }).filter((r) => r.elements > 0);
  const items = all.slice(0, MAX_REMOVAL_ITEMS);
  const left = all.slice(MAX_REMOVAL_ITEMS);

  const total = passages.reduce((s, p) => s + p.charCount, 0);
  return {
    unit: "characters, whitespace runs folded to one space",
    consistent,
    waterfall: {
      raw: kept + removedChars,
      removed: removedChars,
      kept,
      inPassagesUnique: unique,
      notInPassages,
      pastCap,
    },
    passages: {
      unique,
      // The passages' own lengths, as page.charsIndexed counts them: overlap and the intro included.
      total,
      overlap: located - unique,
      intro: introChars,
      unlocated,
    },
    notInPassages: { headingLines, whitespace, other },
    removals: {
      elementsMatched: observer.elements,
      elementsWithText: all.length,
      chars: removedChars,
      byReason,
      items,
      omitted: { elements: left.length, chars: left.reduce((s, r) => s + r.chars, 0) },
    },
    sections: { mode: h2Mode ? "h2" : sections.length > 1 || hasIntro ? "paragraphs" : "window", rows },
    placement: placed,
  };
}

/** Has this reading a loss measurement (2.102 or later)? */
export const hasLosses = (reading) => Boolean(reading?.losses?.waterfall);

/**
 * Characters past the cap, honestly: the measured tail after the last passage (2.102). A reading
 * from 2.101 or earlier has only page.charsUnread, which can undercount; it is used then.
 */
export function charsPastCap(reading) {
  if (hasLosses(reading)) return reading.losses.waterfall.pastCap;
  return reading?.page?.charsUnread ?? 0;
}
