// The page-level facts the newer checks need, read once from the same parsed document: the app
// shell of a single-page app, snippet controls, the favicon, a Markdown alternate, an IndexNow
// key, mixed content, the trust links (About, Contact, privacy, terms), an author byline and the
// dates the page shows. Pure: no I/O.

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Containers a single-page app mounts into. Near-empty in the served HTML means the text arrives with JavaScript. */
export const APP_ROOTS = ["#root", "#__next", "#app", "#__nuxt", "#___gatsby", "#svelte", "[data-reactroot]", "app-root", "[ng-version]"];
/** Below this many words of extracted text, a page with an app root is a shell (this skill's rule). */
export const SHELL_MAX_WORDS = 150;
/** An app root holding less text than this is empty. */
export const SHELL_ROOT_MAX_CHARS = 200;

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  січня: 1, лютого: 2, березня: 3, квітня: 4, травня: 5, червня: 6, липня: 7, серпня: 8, вересня: 9, жовтня: 10, листопада: 11, грудня: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const iso = (y, m, d) => (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null);

/** Dates written in the text: 2026-10-17, 17.10.2026, 17 Oct 2026, October 17, 2026, 17 жовтня 2026, 17 de octubre de 2026. */
export function datesIn(text) {
  const out = new Set();
  const t = String(text || "");
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) out.add(iso(+m[1], +m[2], +m[3]));
  for (const m of t.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g)) out.add(iso(+m[3], +m[2], +m[1]));
  for (const m of t.matchAll(/(?<![\p{L}\p{N}])(\d{1,2})\s+(?:de\s+)?([\p{L}]{3,10})\.?,?\s+(?:de\s+)?(\d{4})(?![\p{N}])/gu)) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo) out.add(iso(+m[3], mo, +m[1]));
  }
  for (const m of t.matchAll(/(?<![\p{L}])([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})(?![\p{N}])/g)) {
    const mo = MONTHS[m[1].toLowerCase()];
    if (mo) out.add(iso(+m[3], mo, +m[2]));
  }
  out.delete(null);
  return [...out];
}

const LINK_KINDS = {
  about: /(?:^|\/)(?:about(?:-us)?|company|team|pro-nas|about_us|quienes-somos|sobre-nosotros|acerca(?:-de)?)(?:\/|\.html?$|$)|\b(?:about|про нас|про компанію|sobre nosotros|acerca de|quiénes somos)\b/i,
  contact: /(?:^|\/)(?:contact(?:-us|s)?|kontakty|contacto|support)(?:\/|\.html?$|$)|\b(?:contact|контакти|зв[’']язатися|contacto)\b/i,
  privacy: /(?:^|\/)(?:privacy(?:-policy)?|privacidad|confidentiality|polityka-prywatnosci)(?:\/|\.html?$|$)|\b(?:privacy|конфіденційн|privacidad)/i,
  terms: /(?:^|\/)(?:terms(?:-of-(?:service|use))?|tos|legal|condiciones|terminos|umovy)(?:\/|\.html?$|$)|\b(?:terms|умови використання|умови користування|términos|condiciones)/i,
};

/** Every fact the newer checks read, from the parsed document. */
export function pageExtras($, resolve, pageUrl, facts) {
  const attr = (n, k) => (n?.attribs && Object.prototype.hasOwnProperty.call(n.attribs, k) ? String(n.attribs[k]) : null);
  const relOf = (n) => (attr(n, "rel") || "").toLowerCase().split(/\s+/).filter(Boolean);
  // The app shell.
  const roots = APP_ROOTS.map((sel) => {
    const el = $(sel).first();
    return el.length ? { selector: sel, chars: fold(el.text()).length } : null;
  }).filter(Boolean);
  // Snippet controls in markup: data-nosnippet elements and how much text they cover.
  const nosnippet = $("[data-nosnippet]").toArray().filter((n) => !$(n).parents("[data-nosnippet]").length);
  const nosnippetChars = nosnippet.reduce((s, n) => s + fold($(n).text()).length, 0);
  // The favicon, as Google accepts it.
  const icons = $("link[rel][href]")
    .toArray()
    .filter((n) => relOf(n).some((r) => ["icon", "apple-touch-icon", "apple-touch-icon-precomposed"].includes(r)))
    .map((n) => resolve(attr(n, "href")))
    .filter(Boolean);
  // A Markdown alternate of the page.
  const markdown = $("link[rel][href]")
    .toArray()
    .filter((n) => relOf(n).includes("alternate") && /markdown/i.test(attr(n, "type") || ""))
    .map((n) => resolve(attr(n, "href")))
    .filter(Boolean);
  // An IndexNow key declared in markup (some publishers do; the protocol keeps the key in a file).
  const indexnow = $("meta[name]")
    .toArray()
    .filter((n) => /^(?:indexnow|indexnow-key|indexnow_key)$/i.test((attr(n, "name") || "").trim()))
    .map((n) => fold(attr(n, "content")))
    .filter((k) => /^[A-Za-z0-9-]{8,128}$/.test(k));
  // Mixed content: http:// subresources on an https page.
  const mixed = [];
  if (/^https:/i.test(pageUrl)) {
    const take = (sel, key, tag) =>
      $(sel)
        .toArray()
        .forEach((n) => {
          const raw = (attr(n, key) || "").trim();
          if (/^http:\/\//i.test(raw)) mixed.push({ tag, url: raw.slice(0, 160) });
          if (key === "src" && /(?:^|,\s*)http:\/\//i.test(attr(n, "srcset") || "")) mixed.push({ tag: `${tag} srcset`, url: (attr(n, "srcset") || "").slice(0, 160) });
        });
    take("img[src], img[srcset]", "src", "img");
    take("script[src]", "src", "script");
    take("iframe[src]", "src", "iframe");
    take("video[src], audio[src], source[src], embed[src]", "src", "media");
    $("link[href]")
      .toArray()
      .filter((n) => relOf(n).some((r) => ["stylesheet", "preload", "icon", "modulepreload"].includes(r)))
      .forEach((n) => {
        const raw = (attr(n, "href") || "").trim();
        if (/^http:\/\//i.test(raw)) mixed.push({ tag: "link", url: raw.slice(0, 160) });
      });
  }
  // Trust links, by address and by link text.
  const trust = {};
  for (const [k, re] of Object.entries(LINK_KINDS)) {
    trust[k] = facts.links.filter((l) => l.internal || k === "privacy" || k === "terms").some((l) => {
      let path = "";
      try {
        path = new URL(l.url).pathname.toLowerCase();
      } catch {}
      return re.test(path) || re.test(l.text || "");
    });
  }
  // An author byline in markup.
  const metaAuthor = $("meta[name]").toArray().find((n) => (attr(n, "name") || "").trim().toLowerCase() === "author");
  const byline =
    Boolean(metaAuthor && fold(attr(metaAuthor, "content"))) ||
    $('a[rel~="author"], [rel="author"], [itemprop="author"], .author, .byline, [class*="author-name"], [class*="byline"]').toArray().some((n) => fold($(n).text()).length >= 2);
  // Dates shown: <time datetime> and dates written in the visible text.
  const timeDates = $("time[datetime]")
    .toArray()
    .map((n) => (attr(n, "datetime") || "").slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const visibleDates = [...new Set([...timeDates, ...datesIn(facts.visibleText)])];
  const article = $("article").length > 0;
  return {
    roots,
    nosnippet: { elements: nosnippet.length, chars: nosnippetChars },
    icons,
    markdown,
    indexnow,
    mixed: mixed.slice(0, 40),
    mixedTotal: mixed.length,
    trust,
    byline,
    visibleDates: visibleDates.slice(0, 20),
    hasArticleElement: article,
  };
}
