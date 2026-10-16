// Step 1 as a function: URL → fetch → extract → chunk → cap → roles.
// The full read, end to end,
// minus everything that needs a quota, a database, or an embedding model.

import { judgeRequestedUrl } from "./guards.mjs";
import { fetchPublicPage } from "./fetchPage.mjs";
import { analyseHtml } from "./extract.mjs";
import { chunkPage, CHUNKS_PER_PAGE } from "./chunk.mjs";
import { contentRole } from "./lens.mjs";

export const READING_SCHEMA = "getlooploop/vectorscope-skill-reading@1";

/**
 * Read one page. `html` may be supplied to skip the network (a saved copy of the same URL);
 * every other step is identical.
 * Returns { schema, ok, reasonCode, status?, requestedInput, page?, passages? }.
 */
export async function readPage({ url, html, finalUrl }) {
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

  const analysed = analyseHtml({
    html: fetched.html,
    url: fetched.url,
    requestedUrl: urlKey,
    statusCode: 200,
    contentType: "text/html",
  });

  const chunks = chunkPage({
    id: "public",
    url: analysed.url,
    domain: host,
    title: analysed.title || null,
    h1: analysed.h1,
    h2: analysed.h2,
    metaDescription: analysed.metaDescription || null,
    bodyText: analysed.bodyText || null,
    isCompetitor: false,
  });

  if (!chunks.length) return { ...base, ok: false, reasonCode: "empty" };

  const charsIndexed = chunks.reduce((sum, chunk) => sum + chunk.charCount, 0);
  const bodyChars = (analysed.bodyText || "").trim().length;

  const page = {
    url: analysed.url,
    requestedUrl: urlKey,
    title: analysed.title || "",
    wordCount: analysed.wordCount,
    chunksIndexed: chunks.length,
    charsIndexed,
    charsUnread: Math.max(0, bodyChars - charsIndexed),
    capReached: chunks.length >= CHUNKS_PER_PAGE,
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

  return { ...base, ok: true, reasonCode: "ok", page, passages };
}
