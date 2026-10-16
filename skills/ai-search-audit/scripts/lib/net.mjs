// Every request the audit makes goes through here: the Vectorscope's URL guard on every hop,
// redirects followed by hand (so the chain can be reported), a timeout and a byte ceiling.
// The audit fetches only the page, its robots.txt, sitemap, llms.txt, its hreflang alternates
// and, for the link check, up to LINK_CHECK_CAP links; each of those callers names its own caps.

import { judgePublicUrl } from "../../../vectorscope/scripts/lib/guards.mjs";
import { CRAWLER_UA, FETCH_TIMEOUT_MS, MAX_HTML_BYTES, MAX_REDIRECTS } from "../../../vectorscope/scripts/lib/fetchPage.mjs";

export { CRAWLER_UA, FETCH_TIMEOUT_MS, MAX_HTML_BYTES, MAX_REDIRECTS };

/**
 * One guarded request. Returns
 *   { ok: true, url, chain, status, headers, text }  a final non-redirect answer (any status)
 *   { ok: false, reason, url, chain, status? }       guard refusal, network failure, too many hops, too large
 * `chain` lists every hop: [{ url, status }]; the last entry is the final answer.
 * `body: false` skips reading the body (HEAD-like use with GET); `binary: true` returns it as a
 * Buffer in `body` instead of as text.
 */
export async function guardedFetch(startUrl, { method = "GET", accept = "*/*", maxBytes = MAX_HTML_BYTES, timeoutMs = FETCH_TIMEOUT_MS, body = true, binary = false } = {}) {
  const chain = [];
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const verdict = judgePublicUrl(current);
    if (!verdict.ok) return { ok: false, reason: verdict.reason, url: current, chain };
    current = verdict.url;
    let response;
    try {
      response = await fetch(current, {
        method,
        headers: { "User-Agent": CRAWLER_UA, Accept: accept },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return { ok: false, reason: "unreachable", url: current, chain };
    }
    chain.push({ url: current, status: response.status });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      try {
        await response.body?.cancel();
      } catch {}
      if (!location) return { ok: true, url: current, chain, status: response.status, headers: headersOf(response), text: "" };
      try {
        current = new URL(location, current).toString();
      } catch {
        return { ok: false, reason: "http_error", url: current, chain, status: response.status };
      }
      continue;
    }
    const headers = headersOf(response);
    if (!body || method === "HEAD") {
      try {
        await response.body?.cancel();
      } catch {}
      return { ok: true, url: current, chain, status: response.status, headers, text: "" };
    }
    const declared = Number(headers.contentLength || 0);
    if (declared && declared > maxBytes) {
      try {
        await response.body?.cancel();
      } catch {}
      return { ok: false, reason: "too_large", url: current, chain, status: response.status };
    }
    if (binary) {
      let buf;
      try {
        buf = Buffer.from(await response.arrayBuffer());
      } catch {
        return { ok: false, reason: "unreachable", url: current, chain, status: response.status };
      }
      if (buf.length > maxBytes) return { ok: false, reason: "too_large", url: current, chain, status: response.status };
      return { ok: true, url: current, chain, status: response.status, headers, body: buf, text: "" };
    }
    let text;
    try {
      text = await response.text();
    } catch {
      return { ok: false, reason: "unreachable", url: current, chain, status: response.status };
    }
    if (text.length > maxBytes) return { ok: false, reason: "too_large", url: current, chain, status: response.status };
    return { ok: true, url: current, chain, status: response.status, headers, text };
  }
  return { ok: false, reason: "too_many_redirects", url: current, chain };
}

function headersOf(response) {
  return {
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    contentLanguage: response.headers.get("content-language"),
    xRobotsTag: response.headers.get("x-robots-tag"),
  };
}

/** Run async jobs with at most `limit` in flight, results in input order. */
export async function pool(items, limit, job) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await job(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
