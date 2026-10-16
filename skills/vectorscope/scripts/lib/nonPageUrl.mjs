// What is not a page a reader could open.

export function isSitemapResourceUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const name = path.split("/").pop() || "";

    // sitemap.xml, sitemap_index.xml, wp-sitemap.xml, sitemap-products-1.xml, compressed sitemaps, bare /sitemap.
    return /^(?:(?:[a-z0-9]+[-_])?sitemap(?:index|[_-][a-z0-9_-]+|\d*)?\.xml(?:\.gz)?|sitemap)$/.test(name);
  } catch {
    const name = String(value).split(/[/?#]/).filter(Boolean).pop() || "";
    return /^(?:(?:[a-z0-9]+[-_])?sitemap(?:index|[_-][a-z0-9_-]+|\d*)?\.xml(?:\.gz)?|sitemap)$/i.test(name);
  }
}

export const MACHINE_SUFFIX = new RegExp(
  "\\.(?:" +
    [
      // Feeds and structured data
      "xml", "xsl", "xslt", "rss", "atom", "json", "jsonld", "csv", "tsv", "yaml", "yml",
      // Plain text and archives
      "txt", "md", "log", "gz", "zip", "tar", "rar", "7z", "bz2",
      // Documents
      "pdf", "docx?", "xlsx?", "pptx?", "rtf", "odt", "ods", "odp", "epub",
      // Code and build output
      "js", "mjs", "cjs", "css", "map", "wasm",
      // Images, fonts, media
      "svg", "ico", "png", "jpe?g", "gif", "webp", "avif", "bmp", "tiff?",
      "woff2?", "ttf", "otf", "eot",
      "mp4", "webm", "mov", "avi", "mp3", "wav", "ogg", "flac",
    ].join("|") +
    ")$",
  "i"
);

const MACHINE_BARE_NAMES = new Set(["rss", "feed", "feeds", "rss.xml", "atom.xml"]);

export function isMachineUrl(value) {
  let path;
  try {
    path = new URL(value).pathname.toLowerCase().replace(/\/+$/, "");
  } catch {
    path = String(value).split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "");
  }
  if (MACHINE_SUFFIX.test(path)) return true;
  return MACHINE_BARE_NAMES.has(path.split("/").pop() || "");
}

export function isHtmlContentType(value) {
  return /text\/html|application\/xhtml\+xml/i.test(String(value || ""));
}

export function isCorpusCandidateUrl(value) {
  return !isSitemapResourceUrl(value) && !isMachineUrl(value);
}
