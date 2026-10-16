// What a fetched HTML document becomes before it is chunked.

import * as cheerio from "cheerio";

/**
 * Extract text the way a retriever sees content: strip scripts, styles, chrome
 * (nav/footer/aside/header), forms and banners, then take the largest main region
 * when it holds at least a quarter of the body, else the cleaned body.
 */
export function extractVisiblePageText($) {
  const htmlSource = $.root().html() || "";
  const htmlBytes = Buffer.byteLength(htmlSource, "utf-8");

  const $clone = cheerio.load(htmlSource);

  // Remove non-content / non-rendered for bots & users
  $clone(
    [
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
      "nav",
      "footer",
      "aside",
      "header",
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
    ].join(", ")
  ).remove();

  // A block boundary is a word boundary: a newline after each block element.
  const BLOCKS =
    "h1, h2, h3, h4, h5, h6, p, li, tr, td, th, div, section, article, blockquote, pre, figcaption, dd, dt, summary, details, br, hr";
  $clone(BLOCKS).after(String.fromCharCode(10));

  // And two sibling elements with nothing between them are two words, not one.
  $clone("*").each((_, element) => {
    const previous = element.prev;
    if (previous && previous.type === "tag") $clone(element).before(" ");
  });

  const mainSel =
    "main, article, [role='main'], .content, .post, .entry-content, .article-body, #content, #main";
  const bodyRaw = $clone("body").text() || $clone.root().text() || "";

  let rawText = bodyRaw;
  const regions = $clone(mainSel).toArray();
  if (regions.length) {
    let best = "";
    for (const element of regions) {
      const text = $clone(element).text() || "";
      if (text.length > best.length) best = text;
    }
    // A quarter: high enough to reject a teaser card, low enough to keep a real article.
    if (best.length >= bodyRaw.length * 0.25) rawText = best;
  }

  const bodyText = rawText
    .replace(/ /g, " ")
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

  return { bodyText, wordCount, textBytes, codeBytes, htmlBytes, textRatioPct, codeRatioPct };
}

/**
 * Everything derivable from a fetched document, with no I/O.
 * Only the fields the Vectorscope reads are kept: title, metaDescription, h1, h2, bodyText,
 * wordCount, and noindex from meta robots.
 */
// , minus schema markup and language, which the Vectorscope does not read.
export function analyseHtml(input) {
  const $ = cheerio.load(input.html);

  const title = ($("title").first().text() || "").trim();
  const metaDescription = ($('meta[name="description"]').attr("content") || "").trim();
  const h1 = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2 = $("h2")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 40);

  const { bodyText, wordCount } = extractVisiblePageText($);

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
