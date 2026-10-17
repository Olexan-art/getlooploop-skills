// The audit as one self-contained HTML page, in the approved Lite layout: a verdict line, six
// status tiles, the page map drawn from the real document, the biggest problems, the severity
// bars, where the text goes, the bots, the classic checklist, the language grid, what the check
// cannot see, and the footer. Lite is a picture of the problems: labels, numbers and places,
// no descriptions and no fixes.
//
// Every string that came from the audited page (titles, headings, URLs) goes through esc(); the
// CSP blocks every network request; the one inline script only switches language and theme.

import { esc, FOOTER_LINKS } from "../../../vectorscope/scripts/lib/html.mjs";
import { FINDINGS, REFUSAL_COPY, SANCTIONS_LINKS } from "../../../vectorscope/scripts/lib/refusal.mjs";
import { MOTANKA } from "../../../vectorscope/scripts/lib/sprites.mjs";
import { CSS, CSS_EXTRA } from "./css.mjs";
import { FAVICONS } from "./favicons.mjs";
import { CANNOT, LAYER, MARK, OWNERS, SEV, STATE, UI, ZONE_LABEL, dateOf, fmtEn, fmtUk, nMinor, nProblems, verdict } from "./copy.mjs";
import { SEVERITIES } from "./checks.mjs";

export const TOOL_NAME = "AI Search Audit";
export const FULL_VERSION_URL = "https://www.getlooploop.com";

// ── small helpers ────────────────────────────────────────────────────────────

const pair = (en, uk) => `<span class="l-en">${en}</span><span class="l-uk" lang="uk">${uk}</span>`;
/** A [en, uk] pair of plain strings, escaped. */
const P = (t) => pair(esc(t[0]), esc(t[1]));
const attrPair = (name, en, uk) => `${name}="${esc(en)}" data-en-${name}="${esc(en)}" data-uk-${name}="${esc(uk)}" data-i18n`;
const ext = (href, text) => `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
const call = (t, ...a) => [typeof t[0] === "function" ? t[0](...a) : t[0], typeof t[1] === "function" ? t[1](...a) : t[1]];
const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, Math.max(1, n - 1))}…` : t;
};

function safeHref(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

const ICONS = {
  getlooploop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5a4.5 4.5 0 1 0 0 9c2.4 0 3.4-1.9 4.5-4.5s2.1-4.5 4.5-4.5a4.5 4.5 0 1 1 0 9c-2.4 0-3.4-1.9-4.5-4.5S9.9 7.5 7.5 7.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  bluesky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.3C8 5.4 11 9.6 12 11.8c1-2.2 4-6.4 6.8-8.5 2-1.5 5.2-2.6 5.2 1 0 .7-.4 6-.6 6.9-.8 3-3.8 3.7-6.5 3.3 4.7.8 5.9 3.4 3.3 6.1-4.9 5-7-1.3-7.6-2.9l-.6-1.7-.6 1.7c-.6 1.6-2.7 7.9-7.6 2.9-2.6-2.7-1.4-5.3 3.3-6.1-2.7.4-5.7-.3-6.5-3.3C.4 10.3 0 5 0 4.3c0-3.6 3.2-2.5 5.2-1z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};
// The Vectorscope report's four footer links, so the two skills cannot drift apart.
const LINKS = FOOTER_LINKS.map((l) => [l.id, l.name, l.href, l.key ? UI.author : null]);
const OWNER_ICON = {
  dev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  content: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  seo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const STATE_ICON = {
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  prob: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/></svg>',
  block: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  na: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><path d="M8 12h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.6 10.6 0 0 1 12 6c5 0 8.5 4.3 9.5 6-.5.9-1.5 2.3-3 3.6M6.4 7.6C4.6 8.9 3.2 10.7 2.5 12c1 1.7 4.5 6 9.5 6 1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7.5 12h9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

// ── markers: shape and size carry the severity as well as the colour ─────────

function pinShape(sev) {
  if (sev === "blocking") {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return `${(15.5 * Math.cos(a)).toFixed(2)},${(15.5 * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return `<polygon class="sh" points="${pts}"/>`;
  }
  if (sev === "high") return '<circle class="sh" r="13.5"/>';
  if (sev === "medium") return '<circle class="sh" r="11.5"/>';
  return '<rect class="sh" x="-9.5" y="-9.5" width="19" height="19" rx="4"/>';
}
const pinIcon = (sev, n, size = 28) => `<svg class="pi pin ${sev}" viewBox="-19 -19 38 38" width="${size}" height="${size}" aria-hidden="true">${pinShape(sev)}${n != null ? `<text dy=".36em">${n}</text>` : ""}</svg>`;
const target = (f) => (f.big ? `big-${f.id}` : `pin-${f.id}`);
function pinLink(f, x, y) {
  const lab = (i) => `${f.pin} · ${SEV[f.severity][i]} · ${f.label[i]}`;
  return `<a class="pm-a" href="#${target(f)}" ${attrPair("aria-label", lab(0), lab(1))}><g class="pin ${f.severity}" transform="translate(${x} ${y})"><circle class="ring" r="19"/>${pinShape(f.severity)}<text dy=".36em">${f.pin}</text></g></a>`;
}
/** The "Agent's judgement · <model>" badge, on every finding the agent's model made. */
const judgeBadge = (f) => {
  if (f.layer !== "judgement") return "";
  const m = f.judgement?.model;
  const t = [`${LAYER.judgement[0]} · ${m || UI.modelNotStated[0]}`, `${LAYER.judgement[1]} · ${m || UI.modelNotStated[1]}`];
  return `<span class="lyr judgement">${P(t)}</span>`;
};
const ownerMark = (o) => `<span class="own" ${attrPair("title", OWNERS[o][0], OWNERS[o][1])}>${OWNER_ICON[o]}<span class="vh">${P(OWNERS[o])}</span></span>`;
/** SVG text in both languages, or once when the two are the same. */
const stx = (x, y, t, cls, extra = "") =>
  t[0] === t[1] ? `<text class="${cls}" x="${x}" y="${y}"${extra}>${esc(t[0])}</text>` : `<text class="${cls} l-en" x="${x}" y="${y}"${extra}>${esc(t[0])}</text><text class="${cls} l-uk" x="${x}" y="${y}"${extra}>${esc(t[1])}</text>`;
const rr = (x, y, w, h, cls, rx = 2) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const mkI = (st, lab) => `<span class="mk ${st}" ${attrPair("title", lab[0], lab[1])}><i aria-hidden="true">${MARK[st].i}</i><span class="vh">${P(lab)}</span></span>`;
const head = (id, t, unit) => `<div class="panel-head"><h2 id="${id}">${P(t)}${unit ? ` <span class="unit">${P(unit)}</span>` : ""}</h2></div>`;

// ── the page map ─────────────────────────────────────────────────────────────

const MAP_W = 520;
const PIN_STEP = 36;
const MAX_ZONE_PINS = 6;
const LINE_WIDTHS = [470, 430, 300, 452, 386, 410, 260];

function zoneLabel(z) {
  if (z.kind === "section" || z.kind === "js") {
    const text = z.label || z.headings[0] || "";
    const base = text ? [text, text] : ZONE_LABEL.untitled();
    return z.kind === "js" ? [`${base[0]} · JavaScript`, `${base[1]} · JavaScript`] : base;
  }
  return (ZONE_LABEL[z.kind] || ZONE_LABEL.untitled)(z);
}

function zoneHeight(z, lede) {
  if (z.kind === "header" || z.kind === "nav" || z.kind === "footer") return 44;
  const body = 50 + Math.min(60, Math.round(Math.sqrt(Math.max(0, z.chars)) * 0.9));
  if (z.kind === "hero") return Math.max(lede ? 104 : 80, body);
  if (z.hidden || z.kind === "aside") return Math.max(80, body);
  return body;
}

function pageSvg(model) {
  const lede = model.findings.find((f) => f.code === "hero_lede_dropped");
  const out = [];
  let y = 0;
  for (const z of model.zones) {
    const h = zoneHeight(z, lede && lede.zones.includes(z.id));
    const pins = z.pins.slice(0, z.pins.length > MAX_ZONE_PINS ? MAX_ZONE_PINS - 1 : MAX_ZONE_PINS);
    const extra = z.pins.length - pins.length;
    const pinRoom = (pins.length + (extra ? 1 : 0)) * PIN_STEP;
    const maxChars = Math.max(10, Math.floor((MAP_W - 28 - pinRoom) / 7.6));
    const g = [`<g aria-hidden="true">`, `<rect class="z${z.kind === "js" ? " js" : ""}" x="0.75" y="${y + 0.75}" width="${MAP_W - 1.5}" height="${h - 1.5}" rx="8"/>`];
    const lab = zoneLabel(z).map((t) => clip(t, maxChars));
    g.push(stx(14, y + 21, lab, "zl"));
    const contentTop = y + 32;
    const contentH = h - 42;
    const unseen = z.hidden || z.kind === "aside" || (z.seen !== null && z.seen !== undefined && z.seen < 0.05 && z.kind !== "header" && z.kind !== "nav" && z.kind !== "footer");
    if (z.kind === "header" || z.kind === "nav" || z.kind === "footer") {
      if (z.hasNav && !z.pins.length) for (let i = 0; i < 5; i++) g.push(rr(262 + i * 48, y + 15, 38, 6, "ln"));
      if (!z.hasNav || z.pins.length) g.push(rr(14, y + 31, 170, 4, "ln faint"));
      else g.push(rr(14, y + 31, 170, 4, "ln faint"));
    } else if (unseen) {
      g.push(rr(14, contentTop, MAP_W - 28, Math.max(18, contentH), "hid", 4));
      const t = z.hidden && z.panels > 1 ? call(UI.panelsHidden, z.panels, z.chars) : UI.notSeen;
      g.push(stx(MAP_W / 2, contentTop + Math.max(18, contentH) / 2 + 4, t, "ht halo", ' text-anchor="middle"'));
    } else {
      if (z.kind === "hero") {
        g.push(rr(14, contentTop - 2, 64, 5, "ln"));
        g.push(rr(14, contentTop + 6, 280, 14, "ln strong", 3));
      }
      const start = z.kind === "hero" ? contentTop + 28 : contentTop;
      const isLede = z.kind === "hero" && lede && lede.zones.includes(z.id);
      if (isLede) {
        g.push(rr(14, start, 360, 34, "hid", 4));
        g.push(stx(194, start + 21, UI.notSeen, "ht halo", ' text-anchor="middle"'));
      } else {
        const partial = z.seen !== null && z.seen !== undefined && z.seen < 0.9 && z.kind !== "hero" ? 1 - z.seen : 0;
        const room = y + h - 10 - start;
        const lines = Math.max(1, Math.floor(room / 10));
        const seenLines = partial ? Math.max(0, Math.round(lines * (1 - partial))) : lines;
        for (let i = 0; i < seenLines; i++) g.push(rr(14, start + i * 10, LINE_WIDTHS[(i + Number(z.id === "js" ? 0 : z.id || 0)) % LINE_WIDTHS.length], i ? 4 : 5, i ? "ln faint" : "ln"));
        if (partial) {
          const top = start + seenLines * 10;
          const bh = Math.max(16, y + h - 8 - top);
          g.push(rr(14, top, MAP_W - 28, bh, "hid", 4));
          if (bh >= 16) g.push(stx(MAP_W / 2, top + bh / 2 + 4, call(UI.partSeen, Math.round(partial * 100)), "ht halo", ' text-anchor="middle"'));
        }
      }
    }
    g.push("</g>");
    out.push(g.join(""));
    pins.forEach((f, i) => out.push(pinLink(f, MAP_W - 22 - (pins.length - 1 - i) * PIN_STEP - (extra ? PIN_STEP : 0), y + 21)));
    if (extra) out.push(`<text class="zn" x="${MAP_W - 22}" y="${y + 25}" text-anchor="middle" aria-hidden="true">+${extra}</text>`);
    y += h + 12;
  }
  const H = Math.max(40, y - 12);
  return `<svg class="pm-svg pm-page" id="pm-page" viewBox="0 0 ${MAP_W} ${H}" role="group" ${attrPair("aria-label", UI.mapAria[0], UI.mapAria[1])}><defs><pattern id="pm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hb" width="7" height="7"/><line class="hl" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>${out.join("")}</svg>`;
}

function sideSvg(id, title, rows) {
  const W = 320;
  const RH = 34;
  const top = 36;
  const H = top + rows.length * RH + 6;
  const o = [`<g aria-hidden="true"><rect class="z" x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="8"/>${stx(14, 23, [title, title], "zl mono")}`];
  rows.forEach((r, i) => {
    const y = top + i * RH;
    const k = Array.isArray(r.k) ? r.k : [r.k, r.k];
    const shown = r.pins.slice(0, 3);
    const room = Math.floor((W - 30 - Math.max(1, shown.length) * 34 - 148) / 6.7);
    o.push(`<line class="sep" x1="10" x2="${W - 10}" y1="${y}" y2="${y}"/>`, stx(14, y + 21, k.map((t) => clip(t, 16)), "zk"), stx(148, y + 21, r.v.map((t) => clip(t, room)), "zv"));
    if (!r.pins.length) o.push(`<g class="okm" transform="translate(${W - 22} ${y + 17})"><circle r="9.5"/><path d="m-4.5 0.5 3 3 6-6.5"/></g>`);
  });
  o.push("</g>");
  rows.forEach((r, i) => r.pins.slice(0, 3).forEach((f, j, arr) => o.push(pinLink(f, W - 22 - (arr.length - 1 - j) * 34, top + i * RH + 17))));
  return `<svg class="pm-svg" id="${id}" viewBox="0 0 ${W} ${H}" role="group" ${attrPair("aria-label", title, title)}>${o.join("")}</svg>`;
}

function mapBlock(model) {
  const o = [`<section class="panel pm-panel" id="page-map" aria-labelledby="h-map">`];
  o.push(`<div class="panel-head"><h2 id="h-map">${P(UI.pageMap)}</h2><span class="sub">${P(call(UI.marked, model.mappedCount))}</span></div>`);
  o.push(`<div class="pmap"><div class="pm-pagecol">${pageSvg(model)}</div><div class="pm-side">${sideSvg("pm-head", "<head>", model.head)}${sideSvg("pm-robots", "robots.txt · llms.txt", model.robots)}</div></div>`);
  const legend = [...SEVERITIES.map((s) => `<li>${pinIcon(s, null, 22)}${P(SEV[s])}</li>`), `<li><span class="sw-hatch" aria-hidden="true"></span>${P(UI.notSeen)}</li>`, `<li><span class="sw-js" aria-hidden="true"></span>${P(UI.onlyJs)}</li>`];
  if (model.unmappedCount) legend.push(`<li class="pm-un">${P(call(UI.unmapped, model.unmappedCount))}</li>`);
  o.push(`<ul class="pm-legend" id="map-legend">${legend.join("")}</ul>`);
  const rest = model.findings.filter((f) => !f.big);
  if (rest.length) o.push(`<ol class="pm-key" id="map-key" ${attrPair("aria-label", UI.otherProblems[0], UI.otherProblems[1])}>${rest.map((f) => `<li id="pin-${esc(f.id)}" class="${f.severity}${f.layer === "judgement" ? " jd" : ""}">${pinIcon(f.severity, f.pin, 26)}<span class="vh">${P(SEV[f.severity])}: </span><span class="pk-l">${P(f.label)}</span>${ownerMark(f.owner)}${judgeBadge(f)}</li>`).join("")}</ol>`);
  const zonesCap = model.caps.find((c) => c.id === "zones");
  if (zonesCap) o.push(`<p class="capnote">${P(zonesCap.t)}</p>`);
  o.push("</section>");
  return o.join("\n");
}

// ── the panels ───────────────────────────────────────────────────────────────

function tilesBlock(model) {
  const o = [`<ul class="tiles tiles-lite" id="status" ${attrPair("aria-label", UI.statusAria[0], UI.statusAria[1])}>`];
  for (const t of model.tiles) {
    const na = t.id === "brand" ? [STATE.unchecked, UI.noBrandFiles] : [STATE.na, UI.oneVersion];
    const tc = t.state === "na" ? na[1] : !t.count ? UI.nothingFound : t.minorOnly ? nMinor(t.count) : nProblems(t.count);
    o.push(`<li class="tile ${t.state}" id="tile-${t.id}"><h2>${P(t.q)}</h2><span class="state">${STATE_ICON[t.state]}${P(t.state === "na" ? na[0] : STATE[t.state])}</span><span class="tc">${P(tc)}</span></li>`);
  }
  o.push("</ul>");
  return o.join("\n");
}

function biggestBlock(model) {
  const o = [`<section class="panel" id="biggest" aria-labelledby="h-biggest">${head("h-biggest", UI.biggest)}`];
  if (!model.bigs.length) o.push(`<p class="none-found">${P(UI.noProblems)}</p>`);
  else o.push(`<ol class="bchips">${model.bigs.map((f) => `<li class="bchip ${f.severity}" id="big-${esc(f.id)}"><span class="bc-t">${pinIcon(f.severity, f.pin, 30)}<span>${P(f.label)}</span></span><span class="bc-m"><span class="sevw ${f.severity}">${P(SEV[f.severity])}</span>${ownerMark(f.owner)}</span>${judgeBadge(f)}</li>`).join("")}</ol>`);
  o.push("</section>");
  return o.join("\n");
}

function severityBlock(model) {
  const max = Math.max(1, ...SEVERITIES.map((s) => model.counts[s]));
  const C = { blocking: "--red", high: "--amber", medium: "--amber", low: "--pin-low" };
  const rows = SEVERITIES.map((s) => `<li><span class="sl">${pinIcon(s, null, 18)}${P(SEV[s])}</span><span class="st"><span class="sb ${s}" style="width:${((model.counts[s] / max) * 100).toFixed(1)}%;--c:var(${C[s]})"></span></span><span class="sn">${model.counts[s]}</span></li>`).join("");
  return `<section class="panel" id="lc-severity" aria-labelledby="h-lc-sev">${head("h-lc-sev", UI.severity, UI.problemsUnit)}<ul class="sbars">${rows}</ul></section>`;
}

function waterfallBlock(model) {
  const w = model.waterfall;
  const unit = [`${UI.charsUnit[0]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[0]}`, `${UI.charsUnit[1]} · ${call(UI.passagesLine, model.passages.used, model.passages.cap)[1]}`];
  if (!w) return `<section class="panel" id="lc-text" aria-labelledby="h-lc-text">${head("h-lc-text", UI.text, unit)}</section>`;
  const R = 46;
  const x = (v) => `${((v / Math.max(1, w.raw)) * 100).toFixed(3)}%`;
  const rows = [
    [w.raw, 0, "b-raw"],
    [w.removed, w.kept, "b-gone"],
    [w.kept, 0, "b-kept"],
    [w.inPassagesUnique, 0, "b-kept"],
    [w.notInPassages, w.inPassagesUnique, "b-gone"],
    [w.pastCap, w.inPassagesUnique + w.notInPassages, "b-cap"],
  ];
  const aria = [
    `Where the text goes: ${fmtEn(w.raw)} characters in the raw HTML, ${fmtEn(w.removed)} removed, ${fmtEn(w.kept)} kept, ${fmtEn(w.inPassagesUnique)} unique in passages, ${fmtEn(w.notInPassages)} in no passage, ${fmtEn(w.pastCap)} past the cap.`,
    `Куди дівається текст: ${fmtUk(w.raw)} символів у сирому HTML, ${fmtUk(w.removed)} видалено, ${fmtUk(w.kept)} збережено, ${fmtUk(w.inPassagesUnique)} унікально в уривках, ${fmtUk(w.notInPassages)} поза уривками, ${fmtUk(w.pastCap)} за лімітом.`,
  ];
  const s = [`<svg class="wf" id="waterfall" width="100%" height="${rows.length * R}" role="img" ${attrPair("aria-label", aria[0], aria[1])}>`];
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="22" y2="${2 * R + 38}"/>`);
  s.push(`<line class="guide" x1="${x(w.kept)}" x2="${x(w.kept)}" y1="${3 * R + 22}" y2="${5 * R + 38}"/>`);
  rows.forEach(([v, start, cls], i) => {
    const t = i * R;
    const [en, uk] = UI.wf[i];
    s.push(`<g><title>${esc(en)}: ${fmtEn(v)} / ${esc(uk)}: ${fmtUk(v)}</title>`);
    s.push(stx(0, t + 15, [en, uk], "lab"));
    s.push(stx("100%", t + 15, [fmtEn(v), fmtUk(v)], "val", ' text-anchor="end"'));
    s.push(`<rect class="track" x="0" y="${t + 22}" width="100%" height="16" rx="4"/>`);
    // A zero stage is a line at its position, never an empty space.
    if (v > 0) s.push(`<rect class="${cls}" x="${x(start)}" y="${t + 22}" width="${x(v)}" height="16" rx="4"/>`);
    else s.push(`<rect class="${cls}" x="${x(start)}" y="${t + 20}" width="2" height="20" transform="translate(-2,0)"/>`);
    s.push("</g>");
  });
  s.push("</svg>");
  return `<section class="panel" id="lc-text" aria-labelledby="h-lc-text">${head("h-lc-text", UI.text, unit)}${s.join("")}</section>`;
}

function favImg(vendor) {
  const src = FAVICONS[vendor];
  return src ? `<img class="fav" src="${src}" alt="" width="16" height="16" onerror="this.style.visibility='hidden'">` : `<span class="fav" aria-hidden="true"></span>`;
}

function botsBlock(model) {
  const r = model.reading.robots;
  const unit = call(UI.path, model.robotsPath);
  let note = "";
  if (r.status === "none") note = `<p class="capnote">${P(UI.robotsNone)}</p>`;
  if (r.status === "unreachable") note = `<p class="capnote bad">${P(UI.robotsUnreachable)}</p>`;
  if (r.status === "not_checked") return `<section class="panel wide" id="lc-bots" aria-labelledby="h-lc-bots">${head("h-lc-bots", UI.bots, unit)}<p class="capnote">${P(UI.robotsNotChecked)}</p></section>`;
  const items = model.bots
    .map((b) => `<li class="${b.allowed ? "ok" : "no"}" id="bot-${esc(b.token.toLowerCase())}">${favImg(b.vendor)}<span class="bn">${esc(b.token)}</span>${b.allowed ? mkI("pass", UI.allowed) : mkI("fail", UI.blocked)}<span class="bp">${esc(b.vendor)} · ${P(UI.kind[b.kind])}</span></li>`)
    .join("");
  const llmsNote = `<p class="capnote" id="llms-note">${P(UI.llmsNote)} ${ext(UI.llmsNoteSource[2], `${esc(UI.llmsNoteSource[0])} ↗`)}</p>`;
  return `<section class="panel wide" id="lc-bots" aria-labelledby="h-lc-bots">${head("h-lc-bots", UI.bots, unit)}<ul class="bots">${items}</ul>${note}${llmsNote}</section>`;
}

function classicBlock(model) {
  const cl = model.checklist;
  const n = (st) => cl.filter((c) => c.state === st).length;
  const sum = ["pass", "fail", "warn", "na", "none"]
    .filter((st) => n(st))
    .map((st) => `<li><span class="mk ${st}"><i aria-hidden="true">${MARK[st].i}</i></span><b>${P(call(UI.sum[st], n(st)))}</b></li>`)
    .join("");
  const cells = cl
    .map((c) => `<li class="${c.state}" id="cg-${c.id}" tabindex="0" ${attrPair("aria-label", `${c.name[0]}: ${MARK[c.state].t[0]}`, `${c.name[1]}: ${MARK[c.state].t[1]}`)}><span class="mk ${c.state}" aria-hidden="true"><i>${MARK[c.state].i}</i></span><span class="cs" aria-hidden="true">${P(c.short)}</span><span class="tip" aria-hidden="true">${P(c.name)} · ${P(MARK[c.state].t)}</span></li>`)
    .join("");
  const notes = model.caps.filter((c) => ["links", "links_unverified", "sitemap", "saved"].includes(c.id)).map((c) => `<li>${P(c.t)}</li>`).join("");
  return `<section class="panel" id="lc-classic" aria-labelledby="h-lc-classic">${head("h-lc-classic", UI.classic, call(UI.checksUnit, cl.length))}<ul class="cg-sum">${sum}</ul><ul class="cg" id="classic-grid">${cells}</ul>${notes ? `<ul class="caps" ${attrPair("aria-label", UI.caps[0], UI.caps[1])}>${notes}</ul>` : ""}</section>`;
}

function languagesBlock(model) {
  const L = model.languages;
  if (!L) return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs)}<p class="capnote">${P(UI.langOne)}</p></section>`;
  const markKey = `<ul class="mkey" aria-hidden="true">${["pass", "fail", "warn", "na"].map((s) => `<li><span class="mk ${s}"><i>${MARK[s].i}</i></span>${P(MARK[s].t)}</li>`).join("")}</ul>`;
  const rows = L.rows
    .map((row) => {
      const name = `${esc(row.hreflang)}${row.self ? ` <span class="self">${P(UI.thisPage)}</span>` : ""}${row.refused ? ` <span class="self">${P(UI.langRefused)}</span>` : ""}`;
      return `<tr><td>${name}</td>${row.cells.map((st, i) => `<td>${mkI(st, [`${UI.langCols[i][0]}: ${MARK[st].t[0]}`, `${UI.langCols[i][1]}: ${MARK[st].t[1]}`])}</td>`).join("")}</tr>`;
    })
    .join("");
  const unit = [`${call(UI.versionsUnit, L.rows.length)[0]} · x-default ${L.xDefault ? "✓" : "✕"}`, `${call(UI.versionsUnit, L.rows.length)[1]} · x-default ${L.xDefault ? "✓" : "✕"}`];
  const unread = L.unread ? `<p class="capnote">${P(call(UI.langUnread, L.unread, L.cap))}</p>` : "";
  return `<section class="panel" id="lc-langs" aria-labelledby="h-lc-langs">${head("h-lc-langs", UI.langs, unit)}<div class="tablewrap"><table class="lgrid"><thead><tr><th>${P(UI.langCol)}</th>${UI.langCols.map((c) => `<th>${P(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>${markKey}${unread}</section>`;
}

function cannotBlock(model) {
  const j = model.judgement;
  const note = j.any ? `<p class="honest" id="one-model">${P([UI.oneModel[0](j.model || UI.modelNotStated[0]), UI.oneModel[1](j.model || UI.modelNotStated[1])])}</p>` : "";
  const items = CANNOT.map((c) => `<li>${EYE_OFF}<span class="cl-t">${P(c.t)}</span><span>${c.links.map(([en, uk, href]) => ext(href, `${pair(esc(en), esc(uk))} ↗`)).join(" · ")}</span></li>`).join("");
  return `<section class="panel" id="cannot-see" aria-labelledby="h-cannot">${head("h-cannot", UI.cannot)}${note}<ul class="cannot-lite">${items}</ul></section>`;
}

// ── the page frame ───────────────────────────────────────────────────────────

const JS = `
(function(){
  var root=document.documentElement,TK="ai-search-audit-theme",LK="ai-search-audit-lang";
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function effective(){var t=root.getAttribute("data-theme");if(t)return t;try{return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){return "dark"}}
  function paint(){var t=effective(),l=root.getAttribute("data-lang")||"en",b=document.querySelectorAll("[data-set-theme]"),c=document.querySelectorAll("[data-set-lang]"),i;for(i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t));for(i=0;i<c.length;i++)c[i].setAttribute("aria-pressed",String(c[i].getAttribute("data-set-lang")===l))}
  function applyLang(l){root.setAttribute("data-lang",l);root.setAttribute("lang",l);var els=document.querySelectorAll("[data-i18n]"),pre="data-"+l+"-";for(var i=0;i<els.length;i++){var el=els[i],set=[];for(var j=0;j<el.attributes.length;j++){var a=el.attributes[j];if(a.name.indexOf(pre)===0)set.push([a.name.slice(pre.length),a.value])}for(var k=0;k<set.length;k++)el.setAttribute(set[k][0],set[k][1])}}
  var h=location.hash,hl=/(?:^#|&)lang=(en|uk)/.exec(h),ht=/(?:^#|&)theme=(dark|light)/.exec(h);
  var t0=ht?ht[1]:get(TK);if(t0==="light"||t0==="dark")root.setAttribute("data-theme",t0);
  applyLang(hl?hl[1]:get(LK)==="uk"?"uk":"en");paint();
  var b=document.querySelectorAll("[data-set-theme]");
  for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);put(TK,t);paint()});
  var c=document.querySelectorAll("[data-set-lang]");
  for(var j=0;j<c.length;j++)c[j].addEventListener("click",function(){var l=this.getAttribute("data-set-lang");applyLang(l);put(LK,l);paint()});
  try{matchMedia("(prefers-color-scheme: light)").addEventListener("change",paint)}catch(e){}
  function isA(n){return n&&n.tagName&&String(n.tagName).toUpperCase()==="A"}
  document.addEventListener("click",function(e){var a=e.target;while(a&&a!==document&&!isA(a))a=a.parentNode;if(!a||a===document)return;var href=a.getAttribute("href");if(!href||href.charAt(0)!=="#"||href.length<2)return;var t=document.getElementById(href.slice(1));if(!t)return;e.preventDefault();try{t.scrollIntoView({block:"center"})}catch(x){}t.classList.add("hit");setTimeout(function(){t.classList.remove("hit")},1600)});
})();
`;

function documentStart(title) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="referrer" content="no-referrer">',
    // No network from this file: the styles and the one script are inline, images are data: URIs.
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">`,
    `<title>${esc(title)}</title>`,
    `<style>${CSS}${CSS_EXTRA}</style>`,
    "</head>",
    "<body>",
    '<main class="wrap" id="report">',
    '<div class="corner corner--tl" aria-hidden="true"></div>',
    '<div class="top">',
    `<div class="top-l"><span class="eyebrow">${P(UI.eyebrow)}</span></div>`,
    '<div class="toggles">',
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.langGroup[0], UI.langGroup[1])}><button type="button" id="lang-en" data-set-lang="en" aria-pressed="true">EN</button><button type="button" id="lang-uk" data-set-lang="uk" aria-pressed="false" lang="uk">UK</button></div>`,
    `<div class="toggle" role="group" ${attrPair("aria-label", UI.themeGroup[0], UI.themeGroup[1])}><button type="button" id="theme-dark" data-set-theme="dark" aria-pressed="false">${P(UI.dark)}</button><button type="button" id="theme-light" data-set-theme="light" aria-pressed="false">${P(UI.light)}</button></div>`,
    "</div></div>",
    '<div class="deco" aria-hidden="true"></div>',
  ];
}

function documentEnd(madeKey = "footer") {
  const links = LINKS.map(([id, name, href, k]) => `<li><a id="foot-${id}" href="${href}" rel="noopener noreferrer" target="_blank">${ICONS[id]}<span>${name}${k ? ` · ${P(k)}` : ""}</span></a></li>`).join("");
  return [
    '<div class="deco deco--foot" aria-hidden="true"></div>',
    `<footer class="foot"><div class="foot-made"><img class="motanka" src="${MOTANKA}" alt="" width="30" height="39"><p>${P(UI[madeKey])}</p></div><ul class="links">${links}</ul></footer>`,
    '<div class="corner corner--br" aria-hidden="true"></div>',
    "</main>",
    `<script>${JS}</script>`,
    "</body>",
    "</html>",
  ];
}

function pageId(url, title) {
  const href = safeHref(url);
  const link = href ? `<a class="url mono" id="audited-url" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(url)}</a>` : `<span class="url mono">${esc(url)}</span>`;
  return `<div class="pageid">${link}${title ? `<span class="pt">${esc(clip(title, 140))}</span>` : ""}</div>`;
}

/** The report for an audited page. */
export function renderReport(model) {
  const r = model.reading;
  const o = documentStart(`${TOOL_NAME} Lite: ${r.fetch.finalUrl}`);
  o.push('<header class="verdict lite-verdict" id="verdict">');
  o.push(pageId(r.fetch.finalUrl, r.facts.head.title));
  o.push(`<h1>${P(verdict(model.findings))}</h1>`);
  const date = dateOf(r.createdAt);
  o.push(`<p class="lite-meta"><span>${P(nProblems(model.findings.length))}</span><span aria-hidden="true">·</span><span>${P([UI.checked[0](date[0]), UI.checked[1](date[1])])}</span></p>`);
  o.push("</header>");
  o.push(tilesBlock(model));
  o.push(mapBlock(model));
  o.push(biggestBlock(model));
  o.push('<div class="lcharts">');
  o.push(severityBlock(model));
  o.push(waterfallBlock(model));
  o.push(botsBlock(model));
  o.push(classicBlock(model));
  o.push(languagesBlock(model));
  o.push("</div>");
  o.push(cannotBlock(model));
  o.push(`<p class="fulllink" id="full-link"><a href="${FULL_VERSION_URL}" rel="noopener noreferrer" target="_blank">${P(UI.full)}</a></p>`);
  o.push(...documentEnd());
  return o.join("\n") + "\n";
}

// ── the refusal: pages in Russian are not analysed ───────────────────────────

const bold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
function sourceLink(url) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  return `<a class="src-link" href="${esc(url)}" rel="noopener noreferrer" target="_blank">${esc(host)} ↗</a>`;
}
/** The Vectorscope's approved refusal copy, with only the tool's name changed. */
export const refusalLead = (lang) => REFUSAL_COPY.lead[lang].replace("Vectorscope", TOOL_NAME);
function refusalBody(lang) {
  const out = [`<p class="lead">${esc(refusalLead(lang))}</p>`, "<ul>"];
  for (const f of FINDINGS) {
    if (f.items) {
      out.push(`<li><b>${esc(f.source[lang])}</b><ul>`);
      for (const item of f.items) out.push(`<li>${bold(item.text[lang])} ${sourceLink(item.url)}</li>`);
      out.push("</ul></li>");
    } else out.push(`<li><b>${esc(f.source[lang])}</b>${esc(f.joiner[lang])}${bold(f.text[lang])} ${sourceLink(f.url)}</li>`);
  }
  out.push("</ul>");
  const lists = SANCTIONS_LINKS.map((l) => `<a href="${esc(l.url)}" rel="noopener noreferrer" target="_blank">${esc(l.name)}</a>`).join(" · ");
  out.push(`<p class="sanctions"><b>${esc(REFUSAL_COPY.sanctionsLabel[lang])}:</b> ${esc(REFUSAL_COPY.sanctions[lang])} ${lists}</p>`);
  out.push(`<p class="last">${esc(REFUSAL_COPY.lastLine[lang])}</p>`);
  return out.join("");
}

/** The report for a refused reading: the URL, the reason, the footer; nothing of the page. */
export function renderRefusal(reading) {
  const url = reading.page?.url || reading.fetch?.finalUrl || reading.requestedInput || "";
  const o = documentStart(`${TOOL_NAME} Lite: ${REFUSAL_COPY.title.en}`);
  o.push(`<header class="verdict lite-verdict" id="verdict">${pageId(url, "")}</header>`);
  if (reading.reasonCode === "refused_language_ru") {
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P([REFUSAL_COPY.title.en, REFUSAL_COPY.title.uk])}</h2></div><div class="lb-en">${refusalBody("en")}</div><div class="lb-uk" lang="uk">${refusalBody("uk")}</div></section>`);
  } else {
    const code = `${reading.reasonCode}${reading.status ? ` · HTTP ${reading.status}` : ""}`;
    o.push(`<section class="refusal" role="alert"><div class="refusal-head">${STOP}<h2>${P(["The page could not be audited", "Сторінку не вдалося перевірити"])}</h2></div><p class="lead mono">${esc(code)}</p></section>`);
  }
  o.push(...documentEnd("footerRefused"));
  return o.join("\n") + "\n";
}
