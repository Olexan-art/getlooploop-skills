// Fetch one page, refusing anything that is not a readable HTML document.
// A plain HTTP fetch: no JavaScript is executed, exactly as in the product.

import { judgePublicUrl } from "./guards.mjs";
import { isHtmlContentType } from "./nonPageUrl.mjs";

export const CRAWLER_UA = "GetLoopLoop/1.0 SEO Crawler";

export const FETCH_TIMEOUT_MS = 12_000;
export const MAX_HTML_BYTES = 3_000_000;
export const MAX_REDIRECTS = 5;

// The response headers that change how a crawler may store or index the page. Names are the
// lower-case spellings a server may send any way it likes; `Headers.get` is case-insensitive.
export const RESPONSE_HEADERS = ["x-robots-tag", "cache-control", "content-type", "content-language"];

/**
 * Returns { ok: true, url, html } or { ok: false, reason, status? }.
 * Reasons: the guard's codes, plus unreachable | http_error | blocked | not_html | too_large.
 *
 * Redirects are followed by hand and every hop is judged before it is taken.
 * A shared server would also pass each request through a one-at-a-time host gate;
 * that is a politeness limit for a shared server and is not needed for
 * one fetch from one machine, so it is the one part of this function not carried over.
 */
export async function fetchPublicPage(startUrl) {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const verdict = judgePublicUrl(current);
    if (!verdict.ok) return { ok: false, reason: verdict.reason };
    current = verdict.url;

    let response;
    try {
      response = await fetch(current, {
        headers: { "User-Agent": CRAWLER_UA, Accept: "text/html" },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return { ok: false, reason: "unreachable" };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { ok: false, reason: "http_error", status: response.status };
      current = new URL(location, current).toString();
      continue;
    }

    // 401, 403 and 429 are a decision the site made about automated readers, not a broken page.
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return { ok: false, reason: "blocked", status: response.status };
    }
    if (!response.ok) return { ok: false, reason: "http_error", status: response.status };

    if (!isHtmlContentType(response.headers.get("content-type"))) {
      return { ok: false, reason: "not_html" };
    }

    // Length first when the server declares it, so a large file is refused before it is pulled down.
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared && declared > MAX_HTML_BYTES) return { ok: false, reason: "too_large" };

    let html;
    try {
      html = await response.text();
    } catch {
      // A failure while reading the body is reported as `unreachable`,
      // the same code a refused connection gets.
      return { ok: false, reason: "unreachable" };
    }
    if (html.length > MAX_HTML_BYTES) return { ok: false, reason: "too_large" };

    return {
      ok: true,
      url: current,
      html,
      contentLanguage: response.headers.get("content-language"),
      headers: Object.fromEntries(RESPONSE_HEADERS.map((name) => [name, response.headers.get(name)])),
    };
  }

  return { ok: false, reason: "http_error" };
}
