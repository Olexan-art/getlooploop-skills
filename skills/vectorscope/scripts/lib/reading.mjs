// Step 1 as a function: URL → fetch → extract → chunk → cap → roles.
// The full read, end to end,
// minus everything that needs a quota, a database, or an embedding model.
// v2 adds layers around that core (technical markup, robots.txt, line layout, an optional
// JavaScript render); none of them changes a passage.

import { judgeRequestedUrl } from "./guards.mjs";
import { fetchPublicPage } from "./fetchPage.mjs";
import { analyseHtml } from "./extract.mjs";
import { chunkPage, CHUNKS_PER_PAGE, extractSections } from "./chunk.mjs";
import { contentRole } from "./lens.mjs";
import { readTechnical } from "./technical.mjs";
import { readAccessibility } from "./accessibility.mjs";
import { fetchRobots, robotsReport } from "./robots.mjs";
import { shortLineRuns } from "./checks.mjs";
import { renderPage } from "./render.mjs";
import { basename } from "node:path";
import { declaredLanguagesFromHtml, judgeLanguage } from "./language.mjs";
import { measureLosses } from "./losses.mjs";
import { hostingRecord, judgeRussianSite } from "./russianSite.mjs";

export const REFUSED_LANGUAGE_RU = "refused_language_ru";

export const READING_SCHEMA = "getlooploop/vectorscope-skill-reading@1";

function analyse(html, finalUrl, urlKey) {
  return analyseHtml({
    html,
    url: finalUrl,
    requestedUrl: urlKey,
    statusCode: 200,
    contentType: "text/html",
  });
}

/** Extract and chunk one HTML document exactly as the product does. */
function chunkHtml(html, finalUrl, urlKey, host, analysed = analyse(html, finalUrl, urlKey)) {
  const chunkerPage = {
    id: "public",
    url: analysed.url,
    domain: host,
    title: analysed.title || null,
    h1: analysed.h1,
    h2: analysed.h2,
    metaDescription: analysed.metaDescription || null,
    bodyText: analysed.bodyText || null,
    isCompetitor: false,
  };
  const chunks = chunkPage(chunkerPage);
  return { analysed, chunks, chunkerPage };
}

/**
 * 2.111: the kept text's sections as the chunker splits it, the intro (title, h1, description)
 * marked. "How generated the text sounds" scores this text, whole and past the cap included, the
 * same text AI Search Audit's writing patterns read.
 */
export function keptSections(chunkerPage) {
  const h1 = Array.isArray(chunkerPage.h1) ? chunkerPage.h1 : chunkerPage.h1 ? [chunkerPage.h1] : [];
  const hasIntro = [chunkerPage.title, h1.join(" "), chunkerPage.metaDescription].some((x) => String(x || "").trim());
  return extractSections(chunkerPage).map((s, i) => ({ heading: s.heading ?? null, text: s.text, ...(i === 0 && hasIntro ? { intro: true } : {}) }));
}

/**
 * Read one page. `html` may be supplied to skip the network (a saved copy of the same URL);
 * every other step is identical.
 * Options (all layers, none touches the passages):
 *   robots: "fetch" (default when the page is fetched), "skip", or { text } for a saved robots.txt;
 *   render: true to compare against a headless-browser render;
 *   deps: { lookup, fetch } for the hosting check, replaced in tests.
 * Before anything is fetched, a .ru-zone address and a server in Russia refuse; after the fetch,
 * a Russian-language version of the site, then a page in Russian (russianSite.mjs, language.mjs).
 * With a saved copy (html) nothing goes to the network, so hosting is recorded "not_checked".
 * Returns { schema, ok, reasonCode, status?, requestedInput, page?, passages?, technical?, robots?, layout?, render? }.
 */
export async function readPage({ url, html, finalUrl, robots, render = false, onHtml, deps }) {
  const base = { schema: READING_SCHEMA, requestedInput: String(url ?? "") };

  const verdict = judgeRequestedUrl(url);
  if (!verdict.ok) return { ...base, ok: false, reasonCode: verdict.reason };
  const urlKey = verdict.url;
  const host = new URL(urlKey).hostname;
  const saved = typeof html === "string";

  // 2.110: the domain zone and the hosting country, before the page is fetched at all.
  const refuse = (judged, pageUrl) => ({
    ...base,
    ok: false,
    reasonCode: judged.refusal.reasonCode,
    refusal: judged.refusal,
    page: { url: pageUrl, requestedUrl: urlKey },
    hosting: hostingRecord(judged.hosting),
  });
  const before = await judgeRussianSite({ url: urlKey, network: !saved, deps });
  if (before.refusal) return refuse(before, urlKey);

  let fetched;
  if (saved) {
    fetched = { ok: true, url: finalUrl || urlKey, html };
  } else {
    fetched = await fetchPublicPage(urlKey);
  }
  if (!fetched.ok) {
    return {
      ...base,
      ok: false,
      reasonCode: fetched.reason,
      ...(fetched.status === undefined ? {} : { status: fetched.status }),
    };
  }
  if (onHtml) onHtml(fetched.html, fetched.url);

  // The final address after redirects, then a Russian-language version of the site.
  const after = await judgeRussianSite({ url: urlKey, finalUrl: fetched.url, html: fetched.html, contentLanguage: fetched.contentLanguage, network: !saved, hosting: before.hosting, deps });
  if (after.refusal) return refuse(after, fetched.url);
  const hosting = hostingRecord(after.hosting);

  // Pages in Russian are not analysed: decided after the extraction, before any chunking. The
  // refusal keeps no page text, title or passages, only what the decision rests on.
  const analysed = analyse(fetched.html, fetched.url, urlKey);
  const language = judgeLanguage({ declared: declaredLanguagesFromHtml(fetched.html, fetched.contentLanguage), text: analysed.bodyText || "" });
  if (language.russian) {
    return {
      ...base,
      ok: false,
      reasonCode: REFUSED_LANGUAGE_RU,
      refusal: { reasonCode: REFUSED_LANGUAGE_RU, signal: "language" },
      page: { url: analysed.url, requestedUrl: urlKey },
      hosting,
      language: {
        basis: language.basis,
        declared: language.declared,
        cyrillicWords: language.cyrillicWords,
        markerWords: language.markerWords,
        otherWords: language.otherWords,
      },
    };
  }
  const { chunks, chunkerPage } = chunkHtml(fetched.html, fetched.url, urlKey, host, analysed);

  if (!chunks.length) return { ...base, ok: false, reasonCode: "empty" };

  const charsIndexed = chunks.reduce((sum, chunk) => sum + chunk.charCount, 0);
  const bodyChars = (analysed.bodyText || "").trim().length;
  const capReached = chunks.length >= CHUNKS_PER_PAGE;

  const page = {
    url: analysed.url,
    requestedUrl: urlKey,
    title: analysed.title || "",
    wordCount: analysed.wordCount,
    chunksIndexed: chunks.length,
    charsIndexed,
    // Zero unless the cap was reached: below it every character was offered to the chunker,
    // and the raw difference is only intro repetition, heading lines, overlap and whitespace.
    charsUnread: capReached ? Math.max(0, bodyChars - charsIndexed) : 0,
    capReached,
    noindex: analysed.reachability.noindex,
    headings: analysed.h1.length + analysed.h2.length,
    chunkCap: CHUNKS_PER_PAGE,
    // Not in the product's page object, carried so the report can state the pipeline's input.
    bodyChars,
    h1: analysed.h1,
    metaDescription: analysed.metaDescription || "",
  };

  // Heading as LensChunk carries it and role as buildLens computes it.
  const passages = chunks.map((chunk) => ({
    index: chunk.chunkIndex,
    heading: (chunk.sectionHeading || "").trim() || null,
    rawHeading: chunk.sectionHeading,
    contentRole: contentRole(chunk.chunkText, chunk.sectionHeading),
    charCount: chunk.charCount,
    text: chunk.chunkText,
  }));

  // ── layers (v2) ──
  // 2.102: where the text went, stage by stage. Observed on a copy; the passages above are final.
  const losses = measureLosses({ html: fetched.html, chunkerPage, passages, capReached });
  const technical = readTechnical(fetched.html, analysed.url);
  const accessibility = readAccessibility(fetched.html);
  const layout = { shortLineRuns: shortLineRuns(analysed.bodyText || "", passages) };

  let robotsFetched;
  if (robots && typeof robots === "object" && typeof robots.text === "string") {
    robotsFetched = { status: "ok", url: `${new URL(analysed.url).origin}/robots.txt`, httpStatus: null, text: robots.text };
  } else if (robots === "skip" || (robots === undefined && typeof html === "string")) {
    robotsFetched = { status: "not_checked" };
  } else {
    robotsFetched = await fetchRobots(analysed.url);
  }

  let rendered;
  if (render) {
    const result = await renderPage(analysed.url);
    if (!result.ok) {
      rendered = { ok: false, reason: result.reason, browser: result.browser ? basename(result.browser) : null };
    } else {
      const js = chunkHtml(result.html, analysed.url, urlKey, host);
      rendered = {
        ok: true,
        // The executable name only: the reading may be shared, the install path is nobody's business.
        browser: basename(result.browser),
        wordCount: js.analysed.wordCount,
        passages: js.chunks.length,
        charsIndexed: js.chunks.reduce((sum, chunk) => sum + chunk.charCount, 0),
        headings: js.analysed.h1.length + js.analysed.h2.length,
      };
    }
  }

  return {
    ...base,
    ok: true,
    reasonCode: "ok",
    page,
    passages,
    technical,
    // The response headers (null when a saved copy was read) and the accessibility structure.
    headers: fetched.headers ?? null,
    accessibility,
    robots: robotsReport(robotsFetched, analysed.url),
    hosting,
    layout,
    losses,
    // 2.111: the kept text by section, for the Pattern score and the marker words.
    sections: keptSections(chunkerPage),
    ...(rendered ? { render: rendered } : {}),
  };
}
