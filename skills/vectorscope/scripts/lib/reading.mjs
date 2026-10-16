// Step 1 as a function: URL → fetch → extract → chunk → cap → roles.
// The full read, end to end,
// minus everything that needs a quota, a database, or an embedding model.
// v2 adds layers around that core (technical markup, robots.txt, line layout, an optional
// JavaScript render); none of them changes a passage.

import { judgeRequestedUrl } from "./guards.mjs";
import { fetchPublicPage } from "./fetchPage.mjs";
import { analyseHtml } from "./extract.mjs";
import { chunkPage, CHUNKS_PER_PAGE } from "./chunk.mjs";
import { contentRole } from "./lens.mjs";
import { readTechnical } from "./technical.mjs";
import { fetchRobots, robotsReport } from "./robots.mjs";
import { shortLineRuns } from "./checks.mjs";
import { renderPage } from "./render.mjs";
import { basename } from "node:path";
import { declaredLanguagesFromHtml, judgeLanguage } from "./language.mjs";
import { measureLosses } from "./losses.mjs";

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
 * Read one page. `html` may be supplied to skip the network (a saved copy of the same URL);
 * every other step is identical.
 * Options (all layers, none touches the passages):
 *   robots: "fetch" (default when the page is fetched), "skip", or { text } for a saved robots.txt;
 *   render: true to compare against a headless-browser render.
 * Returns { schema, ok, reasonCode, status?, requestedInput, page?, passages?, technical?, robots?, layout?, render? }.
 */
export async function readPage({ url, html, finalUrl, robots, render = false, onHtml }) {
  const base = { schema: READING_SCHEMA, requestedInput: String(url ?? "") };

  const verdict = judgeRequestedUrl(url);
  if (!verdict.ok) return { ...base, ok: false, reasonCode: verdict.reason };
  const urlKey = verdict.url;
  const host = new URL(urlKey).hostname;

  let fetched;
  if (typeof html === "string") {
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

  // Pages in Russian are not analysed: decided after the extraction, before any chunking. The
  // refusal keeps no page text, title or passages, only what the decision rests on.
  const analysed = analyse(fetched.html, fetched.url, urlKey);
  const language = judgeLanguage({ declared: declaredLanguagesFromHtml(fetched.html, fetched.contentLanguage), text: analysed.bodyText || "" });
  if (language.russian) {
    return {
      ...base,
      ok: false,
      reasonCode: REFUSED_LANGUAGE_RU,
      page: { url: analysed.url, requestedUrl: urlKey },
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
    robots: robotsReport(robotsFetched, analysed.url),
    layout,
    losses,
    ...(rendered ? { render: rendered } : {}),
  };
}
