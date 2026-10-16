// Everything the audit needs from one HTML document, measured once: the <head> markup, the
// structured data, the headings, images and links, what the reader-facing text holds, and the
// page map's zones with the zone every element of interest sits in. Pure: no I/O, no model.
//
// The zones are a schematic of the served document, top to bottom: the site header and
// navigation, the hero (the h1 and what follows it up to the first h2), one zone per h2 section,
// sidebars and the footer. Every image, link, heading and placeholder is tagged with the zone it
// sits in, so a finding about it can be marked on the map where it happens.

import * as cheerio from "cheerio";
import { samePage } from "../../../vectorscope/scripts/lib/technical.mjs";

// ── thresholds and caps (each with its reason) ───────────────────────────────

/** More zones than this on the map stops being a picture; the rest of the sections are merged into one, and the count says so. */
export const MAX_ZONES = 14;
/** Text before the h1 shorter than this (a breadcrumb, a kicker) belongs to the hero, not a zone of its own. */
export const INTRO_MERGE_CHARS = 120;
/** A paragraph this long in a removed <header> is a lede, not a button label or a tagline fragment. */
export const LEDE_MIN_CHARS = 40;
/** How many samples a fact list keeps; the totals are always counted in full. */
export const MAX_SAMPLES = 8;
/** Visible text that announces content still to come, not content. */
export const PLACEHOLDER = /^(?:loading|calculating|please wait|fetching|one moment|завантаження|зачекайте|cargando|chargement|wird geladen|ładowanie)(?![\p{L}\p{N}])[^.!?]{0,60}(?:…|\.{3})?$/iu;
/** Placeholders longer than this are sentences that happen to start with "Loading". */
export const PLACEHOLDER_MAX_CHARS = 80;

/** Headings compared without case or whitespace, so a glued and a spaced reading of one heading match. */
export const headingKey = (s) => String(s ?? "").toLowerCase().replace(/[\s\u00a0]+/g, "");

const fold = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n = 90) => {
  const t = fold(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const isEl = (n) => n && (n.type === "tag" || n.type === "script" || n.type === "style");
const attr = (n, k) => (n?.attribs && Object.prototype.hasOwnProperty.call(n.attribs, k) ? String(n.attribs[k]) : null);
const role = (n) => (attr(n, "role") || "").trim().toLowerCase();

const HIDDEN_STYLE = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:!important)?\s*(?:;|$)/i;
const NEVER_RENDERED = new Set(["script", "style", "noscript", "template", "head", "title", "meta", "link"]);

function isHiddenEl(n) {
  if (!isEl(n)) return false;
  if (attr(n, "hidden") !== null) return true;
  if ((attr(n, "aria-hidden") || "").trim().toLowerCase() === "true") return true;
  const style = attr(n, "style");
  return Boolean(style && HIDDEN_STYLE.test(style));
}

/** A dialog or overlay is hidden by design; headings in it are not lost content. */
function isOverlay(n) {
  if (!isEl(n)) return false;
  if (n.name === "dialog") return true;
  const r = role(n);
  return r === "dialog" || r === "alertdialog";
}

const SCOPING = new Set(["main", "article", "section", "aside", "nav"]);
const SCOPING_ROLES = new Set(["main", "article", "region"]);

/** Whether a node has an ancestor that makes a <header> or <footer> the content's own, not the page's. */
function scoped(n) {
  for (let p = n.parent; p && p.type !== "root"; p = p.parent) {
    if (!isEl(p)) continue;
    if (SCOPING.has(p.name) || SCOPING_ROLES.has(role(p))) return true;
  }
  return false;
}

function within(n, test) {
  for (let p = n; p && p.type !== "root"; p = p.parent) if (isEl(p) && test(p)) return true;
  return false;
}

function textOf(n) {
  if (!n) return "";
  if (n.type === "text") return n.data || "";
  if (!n.children) return "";
  if (isEl(n) && NEVER_RENDERED.has(n.name)) return "";
  return n.children.map(textOf).join("");
}

/** Text a reader of the page sees: no scripts, styles or hidden elements. Elements are word boundaries. */
function visibleText(n) {
  if (!n) return "";
  if (n.type === "text") return n.data || "";
  if (!n.children) return "";
  if (isEl(n) && (NEVER_RENDERED.has(n.name) || isHiddenEl(n))) return " ";
  return ` ${n.children.map(visibleText).join("")} `;
}

/** A short CSS-like path for an element: up to three ancestors below body, then the element. */
export function pathOf(n) {
  const name = (x) => {
    const id = attr(x, "id") ? `#${attr(x, "id").trim().split(/\s+/)[0]}` : "";
    const cls = (attr(x, "class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((c) => `.${c}`).join("");
    return `${x.name}${id || cls}`;
  };
  const parts = [name(n)];
  let p = n.parent;
  while (isEl(p) && !["body", "html"].includes(p.name) && parts.length < 4) {
    parts.unshift(name(p));
    p = p.parent;
  }
  return parts.join(" > ").slice(0, 160);
}

// ── glued words in a heading ─────────────────────────────────────────────────

/**
 * Where a heading's textContent runs two words into one at an element boundary. The two shapes
 * the Vectorscope extractor itself treats as a word boundary: phrase-ending punctuation followed
 * by a capital ("Pricing:Plans"), and a letter meeting a capital where one side is an element
 * holding a phrase ("BrightDesk" + "Plans for every team"). "Get<span>Loop</span>Loop" is one word.
 */
export function gluedJoins(heading) {
  const segs = [];
  const walk = (n, owner) => {
    if (n.type === "text") {
      if (n.data) segs.push({ text: n.data, owner });
      return;
    }
    if (!isEl(n) || NEVER_RENDERED.has(n.name) || isHiddenEl(n)) return;
    if (n.name === "br" || n.name === "img" || n.name === "wbr") {
      segs.push({ text: " ", owner: n });
      return;
    }
    for (const c of n.children || []) walk(c, n === heading ? owner : n);
  };
  for (const c of heading.children || []) walk(c, heading);
  const out = [];
  for (let i = 1; i < segs.length; i++) {
    const a = segs[i - 1];
    const b = segs[i];
    if (a.owner === b.owner) continue;
    const l = a.text.slice(-1);
    const r = b.text.charAt(0);
    if (!l || !r || /\s/.test(l) || /\s/.test(r)) continue;
    const ownText = (seg) => fold(seg.owner === heading ? seg.text : textOf(seg.owner));
    const phrase = /\S\s+\S/.test(ownText(a)) || /\S\s+\S/.test(ownText(b));
    const punct = /[?!:;)\]»”]/.test(l) || (l === "." && /\p{L}/u.test(a.text.slice(-2, -1)));
    if (/\p{Lu}/u.test(r) && (punct || (phrase && /\p{L}/u.test(l)))) {
      out.push({ left: a.text.trim().split(/\s+/).pop(), right: b.text.trim().split(/\s+/)[0] });
    }
  }
  return out;
}

// ── structured data ──────────────────────────────────────────────────────────

const SCHEMA_PREFIX = /^https?:\/\/schema\.org\//i;
const typeList = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]).filter((t) => typeof t === "string").map((t) => t.replace(SCHEMA_PREFIX, ""));

/** Every typed object inside a JSON-LD value, depth-first, with the path to it. */
export function typedNodes(value, out = [], depth = 0, path = "") {
  if (depth > 12 || value === null || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => typedNodes(v, out, depth + 1, `${path}[${i}]`));
    return out;
  }
  const types = typeList(value["@type"]);
  if (types.length) out.push({ types, node: value, path: path || "$" });
  for (const [k, v] of Object.entries(value)) if (k !== "@context") typedNodes(v, out, depth + 1, path ? `${path}.${k}` : k);
  return out;
}

/** A JSON-LD block's text with the HTML comment or CDATA wrapper some CMSs add taken off. */
function unwrapJson(raw) {
  return String(raw || "")
    .trim()
    .replace(/^<!--/, "")
    .replace(/-->$/, "")
    .replace(/^\/\/\s*<!\[CDATA\[/, "")
    .replace(/\/\/\s*\]\]>$/, "")
    .trim();
}


// ── the walk: zones, and what sits in each ───────────────────────────────────

/** Is this <header> one the cleaner removes whole? The Vectorscope extractor's rule, read on the raw document. */
function headerRemoved(n) {
  const banner = role(n) === "banner";
  let hasH1 = false;
  let hasNav = false;
  const look = (x) => {
    if (!isEl(x)) return;
    if (x.name === "h1") hasH1 = true;
    if (x.name === "nav" || role(x) === "navigation") hasNav = true;
    (x.children || []).forEach(look);
  };
  (n.children || []).forEach(look);
  return { removed: banner || (!scoped(n) && !(hasH1 && !hasNav)), hasH1, hasNav, banner };
}

export function hostKey(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** The head of the document: title, description, robots, viewport, language, hreflang, social tags, scripts. */
function headFacts($, resolve, htmlEl) {
  const titles = $("title").toArray().filter((n) => !within(n, (p) => p.name === "svg"));
  const named = (name) => $("meta[name]").toArray().filter((n) => (attr(n, "name") || "").trim().toLowerCase() === name);
  const robotsMeta = $("meta[name]")
    .toArray()
    .filter((n) => ["robots", "googlebot", "bingbot"].includes((attr(n, "name") || "").trim().toLowerCase()))
    .map((n) => ({ name: attr(n, "name").trim().toLowerCase(), content: fold(attr(n, "content")) }));
  const viewport = named("viewport")[0];
  const hreflang = $("link[rel][hreflang]")
    .toArray()
    .filter((n) => (attr(n, "rel") || "").toLowerCase().split(/\s+/).includes("alternate"))
    .map((n) => ({ hreflang: fold(attr(n, "hreflang")), href: resolve(attr(n, "href") || ""), raw: attr(n, "href") }))
    .filter((x) => x.hreflang);
  const og = {};
  for (const n of $("meta[property]").toArray()) {
    const k = (attr(n, "property") || "").trim().toLowerCase();
    if (k.startsWith("og:") && !(k in og)) og[k] = fold(attr(n, "content"));
  }
  const twitter = {};
  for (const n of $("meta[name]").toArray()) {
    const k = (attr(n, "name") || "").trim().toLowerCase();
    if (k.startsWith("twitter:") && !(k in twitter)) twitter[k] = fold(attr(n, "content"));
  }
  const dataType = (n) => {
    const t = (attr(n, "type") || "").trim().toLowerCase();
    return Boolean(t) && !["text/javascript", "module", "application/javascript", "text/ecmascript"].includes(t);
  };
  const exec = $("script").toArray().filter((n) => !dataType(n));
  return {
    title: titles.length ? fold($(titles[0]).text()) : "",
    titleCount: titles.length,
    metaDescriptions: named("description").map((n) => fold(attr(n, "content"))),
    robotsMeta,
    viewport: viewport ? fold(attr(viewport, "content")) : null,
    lang: htmlEl ? fold(attr(htmlEl, "lang") || attr(htmlEl, "xml:lang") || "") || null : null,
    hreflang,
    og,
    twitter,
    scripts: {
      total: exec.length,
      external: exec.filter((n) => attr(n, "src")).length,
      inline: exec.filter((n) => !attr(n, "src")).length,
      // A classic external script in <head> without async or defer stops the parser until it has run.
      blocking: exec.filter((n) => attr(n, "src") && within(n, (p) => p.name === "head") && attr(n, "async") === null && attr(n, "defer") === null && (attr(n, "type") || "").toLowerCase() !== "module").length,
    },
  };
}

/** JSON-LD blocks parsed, microdata and RDFa types listed. */
function structuredFacts($) {
  const jsonLd = [];
  $("script[type]").each((_, n) => {
    if ((attr(n, "type") || "").trim().toLowerCase() !== "application/ld+json") return;
    const raw = unwrapJson($(n).text());
    try {
      const value = JSON.parse(raw);
      // `top`: the types of the block's own entities (the array items or the @graph members), not the nested ones.
      const tops = (Array.isArray(value) ? value : Array.isArray(value?.["@graph"]) ? value["@graph"] : [value]).flatMap((v) => (v && typeof v === "object" ? typeList(v["@type"]) : []));
      jsonLd.push({ index: jsonLd.length + 1, ok: true, value, types: [...new Set(typedNodes(value).flatMap((t) => t.types))], top: [...new Set(tops)] });
    } catch (error) {
      jsonLd.push({ index: jsonLd.length + 1, ok: false, error: String(error.message || error).slice(0, 120), value: null, types: [], top: [] });
    }
  });
  const lastSeg = (t) => String(t).replace(/[#/]+$/, "").split(/[/#]/).pop();
  const microdata = [...new Set($("[itemscope][itemtype]").toArray().flatMap((n) => String(attr(n, "itemtype")).trim().split(/\s+/).map(lastSeg)).filter(Boolean))].sort();
  const rdfa = [...new Set($("[typeof]").toArray().flatMap((n) => String(attr(n, "typeof")).trim().split(/\s+/).map((t) => lastSeg(t.replace(/^[a-z]+:/i, "")))).filter(Boolean))].sort();
  return { jsonLd, microdata, rdfa };
}

/** Inside `top`, is `p` under a nav, a button or a form (controls, not prose)? */
function underControl(p, top) {
  for (let x = p.parent; x && x !== top; x = x.parent) {
    if (!isEl(x)) continue;
    if (x.name === "nav" || x.name === "button" || x.name === "form" || role(x) === "navigation") return true;
  }
  return false;
}

/**
 * Collect the facts of one document. `pageUrl` is the final URL (after redirects); links resolve
 * against it, or against <base href>.
 */
export function collectFacts(html, pageUrl) {
  const $ = cheerio.load(html);
  const htmlEl = $("html")[0] || null;
  let base = pageUrl;
  const baseHref = $("base[href]").first().attr("href");
  if (baseHref) {
    try {
      base = new URL(baseHref, pageUrl).toString();
    } catch {}
  }
  const resolve = (href) => {
    try {
      return new URL(String(href).trim(), base).toString();
    } catch {
      return null;
    }
  };
  const pageHost = hostKey(pageUrl);
  const head = headFacts($, resolve, htmlEl);
  const structured = structuredFacts($);

  const zones = [];
  const addZone = (kind, label, extra = {}) => {
    const z = { id: zones.length, kind, label: label || null, chars: 0, headings: [], hidden: false, panels: 0, inHeader: false, ...extra };
    zones.push(z);
    return z;
  };
  const headings = [];
  const images = [];
  const links = [];
  const placeholders = [];
  const removedHeaders = [];
  const hiddenHeadings = [];
  const hiddenRootChars = new Map();
  const restoreAt = new Map(); // hidden root → the flow zone to return to when it closes
  const overrides = [];
  let flow = null;
  const visible = [];

  const current = () => overrides[overrides.length - 1] ?? flow ?? (flow = addZone("intro", null));

  function walk(n, ctx) {
    if (n.type === "text") {
      if (ctx.never) return;
      const t = fold(n.data);
      if (!t) return;
      const z = current();
      z.chars += t.length + 1;
      if (!ctx.hidden) visible.push(t);
      if (!ctx.hidden && !ctx.furniture && t.length <= PLACEHOLDER_MAX_CHARS && PLACEHOLDER.test(t)) placeholders.push({ text: clip(t, 80), zone: z.id, path: pathOf(n.parent) });
      return;
    }
    if (!isEl(n)) return;
    const tag = n.name;
    const never = ctx.never || NEVER_RENDERED.has(tag);
    const hiddenHere = !ctx.hidden && isHiddenEl(n);
    const hidden = ctx.hidden || hiddenHere;
    const hiddenRoot = hiddenHere ? n : ctx.hiddenRoot;
    const overlay = ctx.overlay || isOverlay(n);
    let furniture = ctx.furniture;
    let pushed = false;

    // Page-level landmarks open a zone of their own for everything inside them.
    if (!never && !ctx.furniture) {
      const r = role(n);
      const last = zones[zones.length - 1];
      if ((tag === "header" && !scoped(n)) || r === "banner") {
        const judged = headerRemoved(n);
        const z = addZone("header", null, { removedByCleaner: judged.removed, hasNav: judged.hasNav });
        overrides.push(z);
        pushed = true;
        furniture = "header";
        if (judged.removed) {
          const ledes = $(n)
            .find("p")
            .toArray()
            .filter((p) => !underControl(p, n) && !within(p, isHiddenEl))
            .map((p) => fold(textOf(p)))
            .filter((t) => t.length >= LEDE_MIN_CHARS);
          removedHeaders.push({ path: pathOf(n), hasH1: judged.hasH1, hasNav: judged.hasNav, banner: judged.banner, chars: fold(textOf(n)).length, ledes: ledes.slice(0, MAX_SAMPLES).map((t) => clip(t, 120)), ledeCount: ledes.length, ledeChars: ledes.reduce((s, t) => s + t.length, 0), zone: z.id });
        }
      } else if ((tag === "nav" || r === "navigation") && !within(n.parent, (p) => p.name === "main" || p.name === "article" || role(p) === "main")) {
        // Navigation straight after the site header is drawn as part of it.
        const z = last && (last.kind === "header" || last.kind === "nav") ? last : addZone("nav", null);
        z.hasNav = true;
        overrides.push(z);
        pushed = true;
        furniture = "nav";
      } else if ((tag === "footer" && !scoped(n)) || r === "contentinfo") {
        overrides.push(last && last.kind === "footer" ? last : addZone("footer", null));
        pushed = true;
        furniture = "footer";
      } else if ((tag === "aside" && !within(n.parent, (p) => p.name === "main" || p.name === "article" || role(p) === "main")) || r === "complementary") {
        overrides.push(addZone("aside", null));
        pushed = true;
        furniture = "aside";
      }
    }

    // Headings move the flow: the h1 opens the hero, every h2 opens a section.
    if (!never && /^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const text = fold(textOf(n));
      const inFurniture = Boolean(furniture && furniture !== "header");
      if (level === 1 && !inFurniture) {
        if (!zones.some((z) => z.kind === "hero")) {
          const z = addZone("hero", text, { inHeader: furniture === "header" });
          // An h1 inside the site header: the rest of the header is the hero.
          if (furniture === "header") overrides[overrides.length - 1] = z;
          flow = z;
        } else if (!furniture) {
          flow = addZone("section", text, { level: 1 });
        }
      } else if (level === 2 && !furniture) {
        const z = addZone("section", text, { hidden, level: 2 });
        if (hidden && hiddenRoot && !restoreAt.has(hiddenRoot)) restoreAt.set(hiddenRoot, flow);
        flow = z;
      }
      const z = current();
      if (level <= 2 && text && !z.headings.includes(text)) z.headings.push(text);
      headings.push({ level, text: clip(text, 160), hidden, furniture: furniture || null, overlay, zone: z.id, path: pathOf(n), ...(level === 1 ? { glued: gluedJoins(n), textContent: clip(textOf(n), 160) } : {}) });
      if (hidden && !overlay && !inFurniture && level >= 2 && level <= 4) {
        hiddenHeadings.push({ level, text: clip(text, 100), zone: z.id, path: pathOf(n), root: hiddenRoot ? pathOf(hiddenRoot) : null });
        if (hiddenRoot && !hiddenRootChars.has(hiddenRoot)) hiddenRootChars.set(hiddenRoot, fold(textOf(hiddenRoot)).length);
      }
    }

    const z = current();
    if (!never && tag === "img" && !hidden) {
      images.push({ src: clip(attr(n, "src") || attr(n, "data-src") || "", 120), hasAlt: attr(n, "alt") !== null, decorative: ["presentation", "none"].includes(role(n)), zone: z.id, path: pathOf(n) });
    }
    if (!never && tag === "a" && attr(n, "href") !== null) {
      const raw = attr(n, "href").trim();
      if (raw && !/^(?:javascript|mailto|tel|sms|data|blob):/i.test(raw) && !raw.startsWith("#")) {
        const url = resolve(raw);
        if (url && /^https?:/i.test(url)) {
          const noHash = url.replace(/#.*$/, "");
          links.push({ url: noHash, internal: hostKey(noHash) === pageHost, zone: z.id, hidden, text: clip(textOf(n), 60), path: pathOf(n), self: samePage(noHash, pageUrl) });
        }
      }
    }

    const childCtx = { never, hidden, hiddenRoot, overlay, furniture };
    for (const c of n.children || []) walk(c, childCtx);

    // A hidden panel ends where its container ends: what follows belongs to the zone before it.
    if (hiddenHere && restoreAt.has(n)) flow = restoreAt.get(n) ?? flow;
    if (pushed) overrides.pop();
  }

  const body = $("body")[0] || $.root()[0];
  for (const c of body.children || []) walk(c, { never: false, hidden: false, hiddenRoot: null, overlay: false, furniture: null });

  const facts = {
    pageUrl,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    head,
    structured,
    headings,
    images,
    links,
    placeholders,
    removedHeaders,
    hiddenHeadings,
    hiddenChars: [...hiddenRootChars.values()].reduce((s, c) => s + c, 0),
    visibleText: visible.join(" "),
  };
  facts.zones = tidyZones(zones, facts);
  return facts;
}

/**
 * The zones as the map draws them: empty ones dropped, a short text before the h1 folded into the
 * hero, consecutive hidden panels drawn as one zone, and anything past MAX_ZONES merged into one
 * "more sections" zone whose count is kept. Every fact's zone id is rewritten to match.
 */
function tidyZones(raw, facts) {
  const lists = [facts.headings, facts.images, facts.links, facts.placeholders, facts.removedHeaders, facts.hiddenHeadings];
  const used = new Set(lists.flat().map((x) => x.zone));
  const parent = raw.map((z) => z.id);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i];
    return i;
  };
  const alive = raw.map((z) => z.chars > 0 || z.headings.length > 0 || used.has(z.id));
  const into = (from, to) => {
    parent[from] = to;
    const a = raw[from];
    const b = raw[to];
    b.chars += a.chars;
    for (const h of a.headings) if (!b.headings.includes(h)) b.headings.push(h);
    alive[from] = false;
  };
  // Empty zones go to the zone before them (or after, at the very top).
  raw.forEach((z, i) => {
    if (alive[i]) return;
    const to = raw.slice(0, i).reverse().find((x) => alive[x.id]) ?? raw.slice(i + 1).find((x) => alive[x.id]);
    if (to) parent[i] = to.id;
  });
  // A short intro before the h1 is the hero's kicker.
  for (const z of raw) {
    if (!alive[z.id] || z.kind !== "intro" || z.chars >= INTRO_MERGE_CHARS) continue;
    const next = raw.slice(z.id + 1).find((x) => alive[x.id] && (x.kind === "hero" || x.kind === "section"));
    if (next) into(z.id, next.id);
  }
  // Consecutive hidden panels are drawn as one zone, with their count.
  let prev = null;
  for (const z of raw) {
    if (!alive[z.id]) continue;
    if (z.kind === "section" && z.hidden) {
      if (prev && prev.kind === "section" && prev.hidden) {
        prev.panels += 1;
        into(z.id, prev.id);
        continue;
      }
      z.panels = 1;
    }
    prev = z;
  }
  // The cap: sections past it merge into one zone, kept before the footer.
  let kept = raw.filter((z) => alive[z.id]);
  if (kept.length > MAX_ZONES) {
    const tail = kept.filter((z) => z.kind === "footer");
    const bodyZones = kept.filter((z) => z.kind !== "footer");
    const room = MAX_ZONES - tail.length - 1;
    const rest = bodyZones.slice(room);
    const more = rest[0];
    more.merged = rest.length;
    more.allHidden = rest.every((z) => z.hidden);
    more.kind = "more";
    for (const z of rest.slice(1)) into(z.id, more.id);
    kept = raw.filter((z) => alive[z.id]);
  }
  const newId = new Map(kept.map((z, i) => [z.id, i]));
  for (const list of lists) for (const x of list) x.zone = newId.get(find(x.zone)) ?? 0;
  return kept.map((z) => ({
    id: newId.get(z.id),
    kind: z.kind,
    label: z.label,
    headings: z.headings.slice(0, 60),
    chars: z.chars,
    hidden: z.kind === "more" ? Boolean(z.allHidden) : Boolean(z.hidden),
    panels: z.panels || 0,
    inHeader: Boolean(z.inHeader),
    removedByCleaner: Boolean(z.removedByCleaner),
    hasNav: Boolean(z.hasNav),
    merged: z.merged || 0,
  }));
}
