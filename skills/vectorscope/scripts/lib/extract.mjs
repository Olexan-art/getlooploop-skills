// What a fetched HTML document becomes before it is chunked.

import * as cheerio from "cheerio";

// Elements nobody sees. Removed first; the h1 is read after this pass, so a page that titles
// itself in its banner still has one.
const NON_RENDERED = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "head",
  "[hidden]",
  "[aria-hidden='true']",
];

// The page's furniture. `header` is judged one by one instead (see below).
const CHROME = [
  "nav",
  "footer",
  "aside",
  "form",
  "button",
  "select",
  "textarea",
  "input",
  ".cookie",
  ".cookies",
  "#cookie",
  ".cookie-banner",
  ".cookie-consent",
  "[class*='cookie']",
  "[id*='cookie']",
  "[class*='newsletter']",
  "[class*='popup']",
  "[class*='modal']",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='complementary']",
];

// What a removed element leaves behind: a private-use mark, resolved at the end to a space
// between two words and to nothing beside whitespace or punctuation.
const BOUNDARY = "\uE000";

function resolveBoundaries(text) {
  return text
    .replace(/\uE000+(?=[\s.,;:!?)\]}%»”’…]|$)/g, "")
    .replace(/(^|[\s(\[{«“‘])\uE000+/g, "$1")
    .replace(/\uE000+/g, " ");
}

/** A heading as one line: every boundary a space, every run of whitespace one. */
function headingText(raw) {
  return resolveBoundaries(raw).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/** The nearest sibling that is not a comment (React writes `<!-- -->` between fragments). */
function siblingOf(node, side) {
  let current = node?.[side];
  while (current && current.type === "comment") current = current[side];
  return current ?? null;
}

/** Whether a text node ends (or starts) on something that could be half of a fused word. */
function opensGap(data, side) {
  const char = side === "end" ? data.slice(-1) : data.charAt(0);
  return Boolean(char) && !/\s/.test(char) && char !== BOUNDARY;
}

/**
 * Whether a text node and an element meet in the middle of two words. Two shapes only, so
 * that `Get<span>Loop</span>Loop` stays one word:
 *   - phrase-ending punctuation followed by a capital ("Why marked?Unchecked");
 *     a full stop only after a letter;
 *   - an element holding a phrase (a space inside it) meeting a capital from a letter
 *     ("Vectorscope<span>Paste a URL…</span>").
 */
function gluedBoundary(left, right, elementText) {
  const l = left.slice(-1);
  const r = right.charAt(0);
  if (!l || !r || /\s/.test(l) || /\s/.test(r) || l === BOUNDARY || r === BOUNDARY) return false;
  if (/[?!:;)\]»”]/.test(l) && /\p{Lu}/u.test(r)) return true;
  if (l === "." && /\p{L}/u.test(left.slice(-2, -1)) && /\p{Lu}/u.test(r)) return true;
  const phrase = /\S\s+\S/.test(resolveBoundaries(elementText).trim());
  return phrase && /\p{L}/u.test(l) && /\p{Lu}/u.test(r);
}

/**
 * Extract text the way a retriever sees content: strip scripts, styles and hidden elements,
 * then chrome (nav/footer/aside, the site banner), forms and banners, then take the largest
 * main region when it holds at least a quarter of the body, else the cleaned body.
 *
 * The h1 and h2 come back with it, read from the same cleaned document, because the chunker
 * matches body lines against h2 text: the h1 after hidden elements are gone, the h2 after
 * the furniture is gone too.
 */
export function extractVisiblePageText($, observer = null) {
  const htmlSource = $.root().html() || "";
  const htmlBytes = Buffer.byteLength(htmlSource, "utf-8");

  const $clone = cheerio.load(htmlSource);

  // v2.102: an observer (losses.mjs) may look at what each pass removes. It only reads, and every
  // call is guarded, so without one this function does exactly what it did before.
  if (observer) observer.removing($clone, $clone(NON_RENDERED.join(", ")), "non_rendered");
  $clone(NON_RENDERED.join(", ")).replaceWith(BOUNDARY);

  // A block boundary is a word boundary: a newline after each block element.
  const BLOCKS =
    "h1, h2, h3, h4, h5, h6, p, li, tr, td, th, div, section, article, blockquote, pre, figcaption, dd, dt, summary, details, br, hr";
  $clone(BLOCKS).after(String.fromCharCode(10));

  // Two sibling elements with nothing between them are two words, not one; and a text node
  // meeting an element is judged by `gluedBoundary`.
  $clone("*").each((_, element) => {
    let text = null;
    const ownText = () => (text ??= $clone(element).text());
    const previous = siblingOf(element, "prev");
    if (previous && previous.type === "tag") {
      $clone(element).before(" ");
    } else if (previous && previous.type === "text" && opensGap(previous.data || "", "end")) {
      if (gluedBoundary(previous.data || "", ownText(), ownText())) $clone(element).before(" ");
    }
    const following = siblingOf(element, "next");
    if (following && following.type === "text" && opensGap(following.data || "", "start")) {
      if (gluedBoundary(ownText(), following.data || "", ownText())) $clone(element).after(" ");
    }
  });

  const h1 = $clone("h1")
    .map((_, el) => headingText($clone(el).text()))
    .get()
    .filter(Boolean);

  // A page-level <header> is the site's banner and goes. A header inside main, article,
  // section, aside or nav is the content's own opening, and so is a header elsewhere that
  // holds the h1 and no navigation. A kept header keeps only its headings and paragraphs
  // (the title and the lede); its controls (dropdowns, contents lists, forms) go.
  $clone("header").each((_, element) => {
    const header = $clone(element);
    if (!header.parent().length) return;
    const scoped =
      header.parents("main, article, section, aside, nav, [role='main'], [role='article'], [role='region']").length > 0;
    const titleBlock = header.find("h1").length > 0 && header.find("nav, [role='navigation']").length === 0;
    const banner = (header.attr("role") || "").trim().toLowerCase() === "banner";
    if (banner || (!scoped && !titleBlock)) {
      if (observer) observer.removing($clone, header, banner ? "banner_role" : "header_chrome");
      header.replaceWith(BOUNDARY);
      return;
    }
    const PROSE = "h1, h2, h3, h4, h5, h6, p";
    const kept = header
      .find(PROSE)
      .filter((_, node) => {
        const between = $clone(node).parentsUntil(header);
        return between.filter(PROSE).length === 0 && between.filter(CHROME.join(", ")).length === 0;
      })
      .toArray()
      .map((node) => `${$clone.html(node)}\n`)
      .join("");
    if (observer) observer.headerTrimmed($clone, header, kept);
    header.replaceWith(`${BOUNDARY}${kept}${BOUNDARY}`);
  });

  if (observer) observer.removing($clone, $clone(CHROME.join(", ")), "chrome");
  $clone(CHROME.join(", ")).replaceWith(BOUNDARY);

  const h2 = $clone("h2")
    .map((_, el) => headingText($clone(el).text()))
    .get()
    .filter(Boolean);

  const mainSel =
    "main, article, [role='main'], .content, .post, .entry-content, .article-body, #content, #main";
  const bodyRaw = $clone("body").text() || $clone.root().text() || "";

  let rawText = bodyRaw;
  const regions = $clone(mainSel).toArray();
  if (regions.length) {
    let best = "";
    let bestElement = null;
    for (const element of regions) {
      const text = $clone(element).text() || "";
      if (text.length > best.length) {
        best = text;
        bestElement = element;
      }
    }
    // A quarter: high enough to reject a teaser card, low enough to keep a real article.
    if (best.length >= bodyRaw.length * 0.25) {
      rawText = best;
      if (observer) observer.mainRegion($clone, bestElement);
    }
  }

  const bodyText = resolveBoundaries(rawText)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const textBytes = Buffer.byteLength(bodyText, "utf-8");
  const codeBytes = Math.max(0, htmlBytes - textBytes);
  const textRatioPct = htmlBytes > 0 ? Math.round((textBytes / htmlBytes) * 1000) / 10 : 0;
  const codeRatioPct = htmlBytes > 0 ? Math.round((codeBytes / htmlBytes) * 1000) / 10 : 0;
  const wordCount = bodyText ? bodyText.split(/\s+/).filter((w) => w.length > 0).length : 0;

  return { bodyText, wordCount, textBytes, codeBytes, htmlBytes, textRatioPct, codeRatioPct, h1, h2 };
}

/**
 * Everything derivable from a fetched document, with no I/O.
 * Only the fields the Vectorscope reads are kept: title, metaDescription, h1, h2, bodyText,
 * wordCount, and noindex from meta robots.
 */
// Schema markup and language are not read: the Vectorscope does not use them.
export function analyseHtml(input) {
  const $ = cheerio.load(input.html);

  const title = ($("title").first().text() || "").trim();
  const metaDescription = ($('meta[name="description"]').attr("content") || "").trim();

  // Headings from the extractor, read from the cleaned document rather than the raw markup.
  const extracted = extractVisiblePageText($);
  const { bodyText, wordCount } = extracted;
  const h1 = extracted.h1;
  const h2 = extracted.h2.slice(0, 40);

  const metaRobots = $('meta[name="robots"]').attr("content") || "";
  const combinedRobots = `${metaRobots} ${input.xRobotsTag ?? ""}`.toLowerCase();

  return {
    url: input.url,
    requestedUrl: input.requestedUrl,
    title,
    metaDescription,
    h1,
    h2,
    bodyText,
    wordCount,
    reachability: {
      noindex: combinedRobots.includes("noindex"),
      nofollow: combinedRobots.includes("nofollow"),
    },
  };
}
