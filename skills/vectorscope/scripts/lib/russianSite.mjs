// 2.110: the site-level signals that refuse a page before its language is read. One function,
// judgeRussianSite(), applies them in the owner's order: the domain zone (a string check, nothing
// fetched), then where the site is hosted, then whether the page declares a Russian-language version of the site.
// The page-language refusal (language.mjs) comes after all three, in the reading.
// Every signal is deterministic except hosting, which asks DNS and one RDAP server; when either is
// unreachable or says nothing, hosting is "not_determined" and nothing is refused on it.

import { lookup as dnsLookup } from "node:dns/promises";
import * as cheerio from "cheerio";
import { CRAWLER_UA } from "./fetchPage.mjs";
import { REFUSED_RU_AUDIENCE, REFUSED_RU_DOMAIN, REFUSED_RU_HOSTING } from "./refusal.mjs";

/** The domain zones that refuse: .ru, .su, .рф, .москва and .moscow (IDN zones in their ASCII form). */
export const RU_ZONES = ["ru", "su", "xn--p1ai", "xn--80adxhks", "moscow"];
const UNICODE_ZONES = { "рф": "xn--p1ai", "москва": "xn--80adxhks" };

export const RDAP_URL = "https://rdap.org/ip/";
export const HOSTING_TIMEOUT_MS = 4_000;
/** At most this many audience signals are kept in a reading: enough to say why, no more. */
export const MAX_AUDIENCE_EVIDENCE = 5;

/** The refusing zone of a host name ("ru", "xn--p1ai" …), or null. */
export function ruDomainZone(host) {
  const h = String(host || "").toLowerCase().replace(/\.+$/, "");
  const last = h.split(".").pop() || "";
  const zone = UNICODE_ZONES[last] ?? last;
  return h.includes(".") && RU_ZONES.includes(zone) ? zone : null;
}

/** A language tag whose primary subtag is Russian: "ru", "ru-RU", "ru_UA", "RU". */
export const isRuTag = (value) => /^ru(?:[-_]|$)/i.test(String(value || "").trim());

/**
 * Whether the page officially declares a Russian-language version of its site. Only declarations
 * count, the ones a site makes for search engines and social cards; ordinary links (a language
 * switcher to /ru, a ru. subdomain, an <a lang="ru">) do not. Returns the signals found, each
 * { kind, value }; an empty list means none. Kinds:
 *   hreflang          <link rel="alternate" hreflang="ru…">
 *   og_locale         og:locale or og:locale:alternate starting with ru
 *   content_language  a ru tag in the Content-Language header
 */
export function ruAudienceSignals({ html, contentLanguage }) {
  const found = [];
  const add = (kind, value) => {
    if (!found.some((f) => f.kind === kind && f.value === value)) found.push({ kind, value: String(value).slice(0, 200) });
  };
  for (const tag of String(contentLanguage || "").split(",")) if (isRuTag(tag)) add("content_language", tag.trim());
  if (typeof html !== "string" || !html) return found;

  const $ = cheerio.load(html);
  $("link[hreflang]").each((_, el) => {
    const rel = String($(el).attr("rel") || "").toLowerCase().split(/\s+/);
    const hreflang = $(el).attr("hreflang");
    if (rel.includes("alternate") && isRuTag(hreflang)) add("hreflang", hreflang.trim());
  });
  $("meta[property], meta[name]").each((_, el) => {
    const prop = String($(el).attr("property") || $(el).attr("name") || "").toLowerCase().trim();
    const content = $(el).attr("content");
    if ((prop === "og:locale" || prop === "og:locale:alternate") && isRuTag(content)) add("og_locale", content.trim());
  });
  return found;
}

function withTimeout(promise, ms) {
  let timer;
  const expiry = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer));
}

/**
 * Where the host's server is: DNS for every address, then one RDAP request for the first one
 * (IPv4 preferred). Returns { status: "checked", country, ip } or { status: "not_determined", ip? };
 * never throws. `deps` replaces the DNS lookup and fetch in tests.
 */
export async function lookupHosting(host, { lookup = dnsLookup, fetch: fetchImpl = globalThis.fetch, timeoutMs = HOSTING_TIMEOUT_MS } = {}) {
  let addresses;
  try {
    addresses = await withTimeout(lookup(String(host).replace(/^\[|\]$/g, ""), { all: true }), timeoutMs);
  } catch {
    return { status: "not_determined" };
  }
  const list = Array.isArray(addresses) ? addresses : [addresses];
  const pick = list.find((a) => a?.family === 4) || list[0];
  const ip = pick?.address;
  if (!ip) return { status: "not_determined" };
  try {
    const response = await fetchImpl(`${RDAP_URL}${encodeURIComponent(ip)}`, {
      headers: { "User-Agent": CRAWLER_UA, Accept: "application/rdap+json, application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return { status: "not_determined", ip };
    const body = await response.json();
    const country = typeof body?.country === "string" ? body.country.trim().toUpperCase() : "";
    return country ? { status: "checked", country, ip } : { status: "not_determined", ip };
  } catch {
    return { status: "not_determined", ip };
  }
}

/**
 * The site-level refusal, in order: domain, hosting, audience. Call it once before the fetch with
 * `url` (domain, then hosting when `network`), and once after with `finalUrl`, `html` and
 * `contentLanguage` too (the final host's domain and hosting when it differs, then the audience).
 * `hosting` passes on what the first call found, so the same host is not asked twice.
 * Returns { refusal: { reasonCode, signal, ... } | null, hosting }, where hosting is
 * { status: "checked" | "not_determined" | "not_checked", country?, ip? }.
 */
export async function judgeRussianSite({ url, finalUrl, html, contentLanguage, network = true, hosting, deps } = {}) {
  const target = new URL(finalUrl || url);
  const host = target.hostname;

  const zone = ruDomainZone(host);
  if (zone) return { refusal: { reasonCode: REFUSED_RU_DOMAIN, signal: "domain", host, zone }, hosting: hosting ?? { status: "not_checked" } };

  let place = hosting && hosting.host === host ? hosting : null;
  if (!place) place = network ? { ...(await lookupHosting(host, deps)), host } : { status: "not_checked", host };
  if (place.status === "checked" && place.country === "RU") {
    return { refusal: { reasonCode: REFUSED_RU_HOSTING, signal: "hosting", host, country: place.country, ip: place.ip }, hosting: place };
  }

  if (typeof html === "string") {
    const signals = ruAudienceSignals({ html, contentLanguage, pageUrl: target.toString() });
    if (signals.length) {
      return { refusal: { reasonCode: REFUSED_RU_AUDIENCE, signal: "audience", host, signals: signals.slice(0, MAX_AUDIENCE_EVIDENCE), signalsFound: signals.length }, hosting: place };
    }
  }
  return { refusal: null, hosting: place };
}

/** The hosting record a reading carries: what was found, without the host it was found for. */
export const hostingRecord = (place) => {
  if (!place || place.status === "not_checked") return { status: "not_checked" };
  if (place.status !== "checked") return { status: "not_determined", ...(place.ip ? { ip: place.ip } : {}) };
  return { status: "checked", country: place.country, ip: place.ip };
};
