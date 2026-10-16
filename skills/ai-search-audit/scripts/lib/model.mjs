// One model of the audit, built once from the reading and its findings, and read by all three
// outputs (HTML, Markdown, JSON), so they can never disagree: the pin numbers, the tiles, the
// page map's zones and side strips, the checklist, the language grid, the bots, the waterfall.

import { auditFindings, SEVERITIES, SEVERITY_RANK } from "./checks.mjs";
import { headingKey } from "./facts.mjs";
import { AREAS, label, fmtEn, fmtUk, ukForm } from "./copy.mjs";
import { samePage } from "../../../vectorscope/scripts/lib/technical.mjs";
import { pathOf as robotsPathOf } from "../../../vectorscope/scripts/lib/robots.mjs";

/** How many findings the "Biggest problems" row shows. */
export const BIGGEST = 5;
/** A zone with less than this share of its text in a passage is drawn as unseen. */
export const UNSEEN_SHARE = 0.05;
/** Above this share a zone counts as read; between the two, the unseen part is drawn as a band. */
export const SEEN_SHARE = 0.9;

const uk = (n, a, b, c) => `${fmtUk(n)} ${ukForm(n, a, b, c)}`;
const hasRow = (f, side, row) => f.strip && f.strip.side === side && f.strip.rows.includes(row);
const worst = (items) => items.reduce((w, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[w] ? f.severity : w), "low");

/** The cell state a set of findings gives: fail for medium and up, warn for low only, else pass. */
export const stateOf = (items) => (!items.length ? "pass" : items.some((f) => f.severity !== "low") ? "fail" : "warn");

function zoneSeen(reading) {
  const rows = reading.vs.losses?.sections?.rows || [];
  const zones = reading.facts.zones;
  const byKey = new Map();
  for (const z of zones) for (const h of z.headings) if (!byKey.has(headingKey(h))) byKey.set(headingKey(h), z.id);
  const acc = new Map();
  const add = (id, chars, inP) => {
    const a = acc.get(id) || { chars: 0, inPassages: 0 };
    a.chars += chars;
    a.inPassages += inP;
    acc.set(id, a);
  };
  const firstFlow = zones.find((z) => z.kind === "hero" || z.kind === "intro" || z.kind === "section");
  for (const row of rows) {
    if (row.inPassages === null || !row.chars) continue;
    if (row.kind === "h2") {
      const id = byKey.get(headingKey(row.heading));
      if (id !== undefined) add(id, row.chars, row.inPassages);
    } else if (row.kind === "before_first_h2" && firstFlow) add(firstFlow.id, row.chars, row.inPassages);
  }
  const out = new Map();
  for (const [id, a] of acc) out.set(id, a.chars ? a.inPassages / a.chars : null);
  return out;
}

/** The checklist: 24 standard checks, each one a cell. `codes` are the findings that fail or warn it. */
function checklist(reading, findings) {
  const by = (codes) => findings.filter((f) => codes.includes(f.code));
  const hl = reading.facts.head.hreflang;
  const types = new Set(reading.facts.structured.jsonLd.flatMap((b) => b.types).concat(reading.facts.structured.microdata));
  const cells = [
    ["http_status", ["Status", "Статус"], ["HTTP status and redirects", "HTTP-статус і переадресації"], ["redirect_chain"], reading.fetch.saved ? "na" : null],
    ["https", ["HTTPS", "HTTPS"], ["Served over HTTPS", "Віддається через HTTPS"], ["not_https"], null],
    ["robots_search_bots", ["Robots", "Robots"], ["Googlebot and Bingbot may fetch the page", "Googlebot і Bingbot можуть завантажити сторінку"], ["search_engine_blocked", "robots_unreachable"], reading.robots.status === "not_checked" ? "na" : null],
    ["noindex", ["noindex", "noindex"], ["Not marked noindex", "Не позначено noindex"], ["noindex"], null],
    ["canonical", ["Canonical", "Canonical"], ["One absolute canonical to the page itself", "Один абсолютний canonical на саму сторінку"], ["canonical_missing", "canonical_relative", "canonical_other", "canonical_multiple"], null],
    ["in_sitemap", ["Sitemap", "Sitemap"], ["Listed in the sitemap", "Є в sitemap"], ["sitemap_missing", "sitemap_not_listed"], !reading.sitemap || (reading.sitemap.found && reading.sitemap.listsPage === null) ? "na" : null],
    ["indexed", ["Index", "Індекс"], ["In Google's index", "В індексі Google"], [], "na"],
    ["title_length", ["Title", "Title"], ["Title present, 10–60 characters", "Title є, 10–60 символів"], ["title_missing", "title_too_long", "title_too_short"], null],
    ["title_unique", ["Title ×lang", "Title ×мови"], ["A different title per language version", "Різний title у кожній мовній версії"], ["title_duplicate_locales"], !hl.length ? "none" : !reading.alternates ? "na" : null],
    ["meta_description", ["Description", "Опис"], ["Description present, 70–160 characters", "Опис є, 70–160 символів"], ["meta_description_missing", "meta_description_short", "meta_description_long"], null],
    ["social_preview", ["Preview", "Прев’ю"], ["Open Graph and Twitter card tags", "Теги Open Graph і Twitter card"], ["social_tags_missing"], null],
    ["h1", ["H1", "H1"], ["One h1", "Один h1"], ["h1_missing", "h1_multiple"], null],
    ["heading_order", ["Headings", "Заголовки"], ["No skipped heading levels", "Без пропущених рівнів заголовків"], ["heading_order_skip"], null],
    ["image_alt", ["Alt", "Alt"], ["Images carry alt", "Зображення мають alt"], ["image_alt_missing"], reading.facts.images.length ? null : "none"],
    ["html_lang", ["lang", "lang"], ["html lang declared", "html lang оголошено"], ["html_lang_missing"], null],
    ["url_readable", ["URL", "URL"], ["A readable URL", "Зручна адреса"], ["url_unreadable"], null],
    ["internal_links", ["Links", "Посилання"], ["Internal links present", "Є внутрішні посилання"], ["internal_links_none"], null],
    ["broken_links", ["404", "404"], ["Links answer without errors", "Посилання відповідають без помилок"], ["broken_links"], !reading.links ? "na" : reading.links.total === 0 ? "none" : null],
    ["viewport", ["Viewport", "Viewport"], ["A mobile viewport", "Мобільний viewport"], ["viewport_missing"], null],
    ["page_weight", ["Weight", "Вага"], ["HTML size and scripts", "Розмір HTML і скрипти"], ["page_weight_heavy"], null],
    ["core_web_vitals", ["CWV", "CWV"], ["Core Web Vitals from real users", "Core Web Vitals від реальних користувачів"], [], "na"],
    ["hreflang_pairs", ["hreflang", "hreflang"], ["hreflang versions link back", "Мовні версії hreflang посилаються взаємно"], ["hreflang_no_return", "hreflang_invalid_code", "hreflang_no_self", "hreflang_alternate_broken"], !hl.length ? "none" : !reading.alternates ? "na" : null],
    ["rich_faqpage", ["FAQ", "FAQ"], ["FAQPage markup", "Розмітка FAQPage"], ["faq_schema_not_visible", "faq_rich_result_retired"], types.has("FAQPage") ? null : "none"],
    ["rich_breadcrumb", ["Breadcrumb", "Ланцюжок"], ["BreadcrumbList markup", "Розмітка BreadcrumbList"], [], types.has("BreadcrumbList") ? null : "none"],
  ];
  return cells.map(([id, short, name, codes, fixed]) => {
    let items = by(codes);
    if (id === "rich_breadcrumb") items = findings.filter((f) => f.code === "schema_required_missing" && f.evidence.types.includes("BreadcrumbList"));
    const state = fixed && !items.length ? fixed : stateOf(items);
    return { id, short, name, state, codes: items.map((f) => f.code) };
  });
}

/** The language grid: this page and each alternate, by title, description, hreflang and html lang. */
function languageGrid(reading, findings) {
  const hl = reading.facts.head.hreflang;
  if (!hl.length) return null;
  const f = (code) => findings.find((x) => x.code === code);
  const dupT = f("title_duplicate_locales");
  const dupD = f("description_duplicate_locales");
  const noReturn = f("hreflang_no_return");
  const broken = f("hreflang_alternate_broken");
  const noSelf = f("hreflang_no_self");
  const mismatch = f("hreflang_lang_mismatch");
  const inGroup = (fd, lang) => Boolean(fd && fd.evidence.groups.some((g) => g.includes(lang)));
  const page = reading.fetch.finalUrl;
  const canonical = reading.vs.technical?.canonical?.resolved;
  const self = hl.find((h) => h.href && (samePage(h.href, page) || (canonical && samePage(h.href, canonical))));
  const selfLang = self?.hreflang || reading.facts.head.lang || "—";
  const rows = [];
  const langCell = (lang, hreflang) => (!lang ? "warn" : mismatch && mismatch.evidence.items.some((s) => s.startsWith(`${hreflang}:`)) ? "warn" : "pass");
  rows.push({ hreflang: selfLang, self: true, cells: [inGroup(dupT, selfLang) ? "fail" : "pass", inGroup(dupD, selfLang) ? "warn" : "pass", noSelf ? "fail" : "pass", langCell(reading.facts.head.lang, selfLang)] });
  for (const a of reading.alternates?.results || []) {
    if (a.refused) {
      rows.push({ hreflang: a.hreflang, refused: true, cells: ["na", "na", "na", "na"] });
      continue;
    }
    if (!a.ok) {
      rows.push({ hreflang: a.hreflang, cells: ["na", "na", broken ? "fail" : "na", "na"] });
      continue;
    }
    const back = noReturn && noReturn.evidence.langs.includes(a.hreflang);
    const bad = broken && broken.evidence.langs.includes(a.hreflang);
    rows.push({ hreflang: a.hreflang, cells: [inGroup(dupT, a.hreflang) ? "fail" : "pass", inGroup(dupD, a.hreflang) ? "warn" : "pass", back || bad ? "fail" : "pass", langCell(a.lang, a.hreflang)] });
  }
  return {
    rows,
    xDefault: hl.some((h) => h.hreflang.toLowerCase() === "x-default"),
    declared: hl.length,
    unread: reading.alternates ? reading.alternates.unchecked.length : null,
    cap: reading.alternates?.cap ?? null,
    measured: Boolean(reading.alternates),
  };
}

/** The <head> strip and the robots.txt · llms.txt strip: one row per thing, with its value. */
function strips(reading, findings) {
  const h = reading.facts.head;
  const st = reading.facts.structured;
  const titleDup = findings.find((f) => f.code === "title_duplicate_locales");
  const chars = (n) => [`${fmtEn(n)} characters`, uk(n, "символ", "символи", "символів")];
  const none = ["none", "немає"];
  let canonical = none;
  const c = reading.vs.technical?.canonical;
  if (c?.present) {
    let v = c.href;
    try {
      const u = new URL(c.resolved);
      v = c.self ? `${u.pathname}${u.search}` : c.resolved;
    } catch {}
    canonical = [c.count > 1 ? `×${c.count} · ${v}` : v, c.count > 1 ? `×${c.count} · ${v}` : v];
  }
  const robotsMeta = h.robotsMeta.map((m) => m.content).join(" · ");
  const xr = reading.fetch.xRobotsTag ? ` · X-Robots-Tag: ${reading.fetch.xRobotsTag}` : "";
  const types = [...new Set(st.jsonLd.flatMap((b) => b.top || b.types))];
  const typesText = types.length ? (types.length > 2 ? `${types.slice(0, 2).join(", ")} +${types.length - 2}` : types.join(", ")) : st.microdata.length || st.rdfa.length ? `${[...st.microdata, ...st.rdfa].slice(0, 2).join(", ")}` : "";
  const socialHave = ["og:title", "og:description", "og:image"].filter((k) => h.og[k]).length + (h.twitter["twitter:card"] ? 1 : 0);
  const langs = h.hreflang.map((x) => x.hreflang);
  const head = [
    { id: "title", k: "title", v: !h.title ? none : titleDup ? [`same ×${titleDup.evidence.count} languages`, `однаковий ×${titleDup.evidence.count} мови`] : chars(h.title.length) },
    { id: "description", k: "meta description", v: h.metaDescriptions[0] ? chars(h.metaDescriptions[0].length) : none },
    { id: "canonical", k: "canonical", v: canonical },
    { id: "robots", k: "meta robots", v: robotsMeta || xr ? [`${robotsMeta || "—"}${xr}`, `${robotsMeta || "—"}${xr}`] : ["not set", "не задано"] },
    { id: "hreflang", k: "hreflang", v: langs.length ? [langs.length > 5 ? `${langs.slice(0, 5).join(" · ")} +${langs.length - 5}` : langs.join(" · "), langs.length > 5 ? `${langs.slice(0, 5).join(" · ")} +${langs.length - 5}` : langs.join(" · ")] : none },
    { id: "lang", k: "html lang", v: h.lang ? [h.lang, h.lang] : none },
    { id: "jsonld", k: "JSON-LD", v: typesText ? [typesText, typesText] : st.jsonLd.length ? [`${st.jsonLd.length} blocks`, `${st.jsonLd.length} блоки`] : none },
    { id: "social", k: "Open Graph", v: [`${socialHave} of 4 tags`, `${socialHave} з 4 тегів`] },
    { id: "viewport", k: "viewport", v: h.viewport ? ["set", "задано"] : none },
    { id: "scripts", k: "scripts", v: [`${h.scripts.total} · ${h.scripts.blocking} blocking`, `${h.scripts.total} · ${h.scripts.blocking} блокують`] },
  ];
  const r = reading.robots;
  const bots = r.bots || [];
  const groupVal = (kinds) => {
    if (r.status === "not_checked") return ["not measured", "не виміряно"];
    if (r.status === "unreachable") return ["no answer", "немає відповіді"];
    const b = bots.filter((x) => kinds.includes(x.kind) && !x.allowed);
    return b.length ? [`${b.length} blocked`, `${b.length} заборонено`] : ["allowed", "дозволено"];
  };
  const sm = reading.sitemap;
  const ll = reading.llms;
  const robots = [
    { id: "search", k: "Google · Bing", v: groupVal(["index"]) },
    { id: "ai_search", k: ["AI search bots", "ШІ-пошуковики"], v: groupVal(["search", "user"]) },
    { id: "ai_training", k: ["AI training bots", "Боти навчання ШІ"], v: groupVal(["training"]) },
    { id: "sitemap", k: "sitemap.xml", v: !sm ? ["not measured", "не виміряно"] : !sm.found ? ["not found", "не знайдено"] : sm.listsPage === true ? ["lists the page", "сторінка є"] : sm.listsPage === false ? ["page not listed", "сторінки немає"] : ["not measured", "не виміряно"] },
    { id: "llms", k: "llms.txt", v: !ll ? ["not measured", "не виміряно"] : ll.present ? [`present · ${ll.links} links`, `є · ${uk(ll.links, "посилання", "посилання", "посилань")}`] : none },
  ];
  const attach = (side, rows) => rows.map((row) => ({ ...row, pins: findings.filter((f) => hasRow(f, side, row.id)) }));
  return { head: attach("head", head), robots: attach("robots", robots) };
}

/** Build the model. `reading` must be ok. */
export function buildModel(reading) {
  const findings = auditFindings(reading).map((f) => ({ ...f, label: label(f) }));
  const zones = reading.facts.zones;
  const seen = zoneSeen(reading);
  const jsZones = (reading.render?.jsZones || []).map((z, i) => ({ ...z, id: `js${i}`, kind: "js" }));
  // Order of zones as drawn: the plain zones, with each JS-only zone after the one it follows.
  const drawn = [];
  for (const z of zones) {
    drawn.push({ ...z, seen: seen.has(z.id) ? seen.get(z.id) : null });
    for (const j of jsZones.filter((x) => x.after === z.id)) drawn.push(j);
  }
  const position = new Map(drawn.map((z, i) => [z.id, i]));
  const { head, robots } = strips(reading, findings);
  const rowPos = (f) => {
    if (f.zones.length) return Math.min(...f.zones.map((z) => position.get(z) ?? 999));
    if (f.strip) {
      const rows = f.strip.side === "head" ? head : robots;
      const i = rows.findIndex((r) => f.strip.rows.includes(r.id));
      return (f.strip.side === "head" ? 1000 : 2000) + Math.max(0, i);
    }
    return 9999;
  };
  // Pins: the biggest problems keep 1–5; the rest follow by severity, then top to bottom.
  const bigs = findings.slice(0, BIGGEST);
  const rest = findings.slice(BIGGEST).sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || rowPos(a) - rowPos(b));
  [...bigs, ...rest].forEach((f, i) => {
    f.pin = i + 1;
    f.big = i < BIGGEST;
    f.mapped = f.zones.length > 0 || Boolean(f.strip);
  });
  const ordered = [...bigs, ...rest];
  for (const z of drawn) z.pins = ordered.filter((f) => f.zones.includes(z.id));
  const tiles = AREAS.map((a) => {
    const items = findings.filter((f) => f.area === a.id);
    let state = items.some((f) => f.severity === "blocking") ? "block" : items.some((f) => f.severity === "high" || f.severity === "medium") ? "prob" : "ok";
    if (a.id === "lang" && !reading.facts.head.hreflang.length && !items.length) state = "na";
    return { id: a.id, q: a.q, state, count: items.length, minorOnly: items.length > 0 && state === "ok", worst: items.length ? worst(items) : null };
  });
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  const w = reading.vs.losses?.waterfall || null;
  return {
    reading,
    findings: ordered,
    bigs,
    tiles,
    counts,
    zones: drawn,
    head,
    robots,
    mappedCount: ordered.filter((f) => f.mapped).length,
    unmappedCount: ordered.filter((f) => !f.mapped).length,
    checklist: checklist(reading, findings),
    languages: languageGrid(reading, findings),
    bots: reading.robots.bots || [],
    robotsPath: robotsPathOf(reading.fetch.finalUrl),
    waterfall: w,
    passages: { used: reading.vs.passages.length, cap: reading.vs.page.chunkCap },
    caps: caps(reading),
  };
}

/** Every list the reading did not finish, so nothing reads as complete when it is not. */
function caps(r) {
  const out = [];
  if (r.links?.unchecked) out.push({ id: "links", n: r.links.unchecked, cap: r.links.cap, t: [`${r.links.unchecked} links not checked (cap ${r.links.cap})`, `${uk(r.links.unchecked, "посилання", "посилання", "посилань")} не перевірено (ліміт ${r.links.cap})`] });
  const unverified = (r.links?.results || []).filter((x) => x.verdict === "unverified").length;
  if (unverified) out.push({ id: "links_unverified", n: unverified, t: [`${unverified} links did not answer or refused the check`, `${uk(unverified, "посилання не відповіло", "посилання не відповіли", "посилань не відповіли")} або відмовили в перевірці`] });
  if (r.alternates?.unchecked.length) out.push({ id: "alternates", n: r.alternates.unchecked.length, cap: r.alternates.cap, t: [`${r.alternates.unchecked.length} language versions not read (cap ${r.alternates.cap})`, `${uk(r.alternates.unchecked.length, "мовну версію", "мовні версії", "мовних версій")} не прочитано (ліміт ${r.alternates.cap})`] });
  if (r.sitemap?.children.unread && r.sitemap.listsPage !== true) out.push({ id: "sitemap", n: r.sitemap.children.unread, cap: r.sitemap.children.cap, t: [`${r.sitemap.children.unread} child sitemaps not read (cap ${r.sitemap.children.cap})`, `${uk(r.sitemap.children.unread, "дочірній sitemap", "дочірні sitemap", "дочірніх sitemap")} не прочитано (ліміт ${r.sitemap.children.cap})`] });
  const merged = r.facts.zones.find((z) => z.kind === "more");
  if (merged) out.push({ id: "zones", n: merged.merged, t: [`${merged.merged} sections drawn as one zone on the map`, `${uk(merged.merged, "розділ", "розділи", "розділів")} на мапі показано однією зоною`] });
  if (r.fetch.saved) out.push({ id: "saved", t: ["A saved page: robots.txt, sitemap, llms.txt, language versions and links not measured", "Збережена сторінка: robots.txt, sitemap, llms.txt, мовні версії й посилання не виміряно"] });
  return out;
}
