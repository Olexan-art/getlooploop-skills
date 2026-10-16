// The page's machine-facing markup: JSON-LD types, the canonical link, the meta description.
// Read from the raw HTML with a cheerio load of its own, so the extraction the chunker depends
// on is untouched.

import * as cheerio from "cheerio";

/** Every @type in a JSON-LD value, through @graph and nested objects. */
function collectTypes(value, out, depth = 0) {
  if (depth > 12 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out, depth + 1);
    return;
  }
  const type = value["@type"];
  if (typeof type === "string") out.add(type.replace(/^https?:\/\/schema\.org\//i, ""));
  else if (Array.isArray(type)) for (const t of type) if (typeof t === "string") out.add(t.replace(/^https?:\/\/schema\.org\//i, ""));
  for (const [key, child] of Object.entries(value)) {
    if (key === "@context") continue;
    collectTypes(child, out, depth + 1);
  }
}

/** Two URLs name the same page when they differ only by a fragment or a trailing slash. */
export function samePage(a, b) {
  try {
    const x = new URL(a);
    const y = new URL(b);
    x.hash = "";
    y.hash = "";
    const strip = (u) => `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "") || "/"}${u.search}`;
    return strip(x) === strip(y);
  } catch {
    return false;
  }
}

/** { jsonLd: { blocks, invalid, types }, canonical: {...}, metaDescription: {...}, lang } */
export function readTechnical(html, pageUrl) {
  const $ = cheerio.load(html);

  const types = new Set();
  let blocks = 0;
  let invalid = 0;
  $('script[type="application/ld+json"]').each((_, element) => {
    blocks += 1;
    const raw = $(element).text().trim();
    try {
      collectTypes(JSON.parse(raw), types);
    } catch {
      invalid += 1;
    }
  });

  const links = $('link[rel]')
    .filter((_, element) => String($(element).attr("rel") || "").toLowerCase().split(/\s+/).includes("canonical"))
    .toArray();
  const href = links.length ? String($(links[0]).attr("href") || "").trim() : "";
  let resolved = null;
  try {
    if (href) resolved = new URL(href, pageUrl).toString();
  } catch {
    resolved = null;
  }
  const canonical = {
    present: Boolean(href),
    count: links.length,
    href: href || null,
    absolute: /^https?:\/\//i.test(href),
    resolved,
    self: resolved ? samePage(resolved, pageUrl) : null,
  };

  const description = ($('meta[name="description"]').attr("content") || "").trim();

  return {
    jsonLd: { blocks, invalid, types: [...types].sort() },
    canonical,
    metaDescription: { present: Boolean(description), length: description.length },
    lang: ($("html").attr("lang") || "").trim() || null,
  };
}
