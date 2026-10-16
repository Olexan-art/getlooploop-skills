// The reading as one self-contained HTML page: inline CSS, a few lines of inline JS, no
// external fonts, scripts or images, so the file opens offline and can be published as is.
// Every string that came from the page (or from a judgement file) is content and goes through
// esc(). The report's own words come from i18n.mjs in English and Ukrainian; a toggle switches
// them, and page content is never translated.

import { PREVIEW_CHARS } from "./lens.mjs";
import { CHECK_COPY, tr, checkCopy } from "./i18n.mjs";
import { displayLabel } from "./analysis.mjs";
import { queryWinner } from "./judgement.mjs";
import { pathOf } from "./robots.mjs";

const VECTORSCOPE_URL = "https://www.getlooploop.com/vectorscope";

// Categorical group colours, in a fixed order. Each one is at least 3:1 against the panel
// in both themes (dark #0a1424, light #ffffff). The skill allows at most 6 groups, so the
// palette is never cycled.
export const GROUP_COLOURS = ["#0e9ab8", "#8b5cf6", "#16a34a", "#e0458a", "#3d7ef0", "#7a8a14"];

const fmt = (n) => Number(n).toLocaleString("en-US");
const pct = (x) => `${Math.round(x * 1000) / 10}%`;

/** HTML-escape text for element content and attribute values. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** An href only for http(s) URLs; anything else is not linked. */
function safeHref(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n) => {
  const t = oneLine(s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ── bilingual helpers ────────────────────────────────────────────────────────

/** Report copy in both languages; CSS shows one. `v` values must already be HTML-safe. */
function L(key, v) {
  return `<span class="l-en">${tr(key, "en", v)}</span><span class="l-uk" lang="uk">${tr(key, "uk", v)}</span>`;
}
/** Two already-built strings as a bilingual pair. */
function pair(en, uk) {
  return `<span class="l-en">${en}</span><span class="l-uk" lang="uk">${uk}</span>`;
}
/** An attribute in both languages: the English value now, both kept for the switch. */
function attr(name, key, v) {
  const en = tr(key, "en", v);
  const uk = tr(key, "uk", v);
  return `${name}="${esc(en)}" data-en-${name}="${esc(en)}" data-uk-${name}="${esc(uk)}" data-i18n`;
}

/** Evidence made HTML-safe for the copy functions: strings escaped, lists joined. */
function safeEvidence(evidence) {
  const out = {};
  for (const [key, value] of Object.entries(evidence || {})) {
    if (typeof value === "string") out[key] = esc(value);
    else if (Array.isArray(value) && value.every((x) => typeof x === "string")) out[key] = value.map(esc).join(", ");
    else out[key] = value;
  }
  if (Array.isArray(evidence?.samples)) out.n = evidence.samples.length;
  return out;
}

const CHECK = '<svg class="ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = '<span class="arrow" aria-hidden="true">→</span>';

// Brand marks for the footer, drawn inline (no external images under this CSP).
const ICONS = {
  getlooploop:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 7.5a4.5 4.5 0 1 0 0 9c2.4 0 3.4-1.9 4.5-4.5s2.1-4.5 4.5-4.5a4.5 4.5 0 1 1 0 9c-2.4 0-3.4-1.9-4.5-4.5S9.9 7.5 7.5 7.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  bluesky:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.3C8 5.4 11 9.6 12 11.8c1-2.2 4-6.4 6.8-8.5 2-1.5 5.2-2.6 5.2 1 0 .7-.4 6-.6 6.9-.8 3-3.8 3.7-6.5 3.3 4.7.8 5.9 3.4 3.3 6.1-4.9 5-7-1.3-7.6-2.9l-.6-1.7-.6 1.7c-.6 1.6-2.7 7.9-7.6 2.9-2.6-2.7-1.4-5.3 3.3-6.1-2.7.4-5.7-.3-6.5-3.3C.4 10.3 0 5 0 4.3c0-3.6 3.2-2.5 5.2-1z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};

export const FOOTER_LINKS = [
  { id: "getlooploop", name: "GetLoopLoop", href: "https://www.getlooploop.com" },
  { id: "x", name: "X", href: "https://x.com/Looploopnow" },
  { id: "bluesky", name: "Bluesky", href: "https://bsky.app/profile/getlooploop.bsky.social" },
  { id: "linkedin", name: "LinkedIn", href: "https://www.linkedin.com/in/olexandr-tsyrkin-07460539", key: "footerAuthor" },
];

const CSS = `
:root{
  --bg:#060b14;--bg-2:#08101d;--panel:#0a1424;--panel-2:#0d1a2e;--line:#1b2b42;--line-2:#24395a;
  --text:#e6eef8;--muted:#8fa1b8;--faint:#5f728b;
  --accent:#22d3ee;--accent-ink:#04121a;--accent-soft:rgba(34,211,238,.12);--glow:0 0 0 1px rgba(34,211,238,.18),0 0 32px rgba(34,211,238,.10);
  --amber:#f5a524;--amber-soft:rgba(245,165,36,.14);
  --red:#f87171;--red-soft:rgba(248,113,113,.13);--green:#34d399;--green-soft:rgba(52,211,153,.12);
  --empty:#0f1d33;--shadow:0 1px 0 rgba(255,255,255,.03) inset;
  color-scheme:dark;
}
@media (prefers-color-scheme: light){
  :root:not([data-theme="dark"]){
    --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
    --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
    --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
    --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
    --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--green:#047857;--green-soft:rgba(4,120,87,.09);
    --empty:#eef3f8;--shadow:none;
    color-scheme:light;
  }
}
:root[data-theme="light"]{
  --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
  --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
  --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
  --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
  --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--green:#047857;--green-soft:rgba(4,120,87,.09);
  --empty:#eef3f8;--shadow:none;
  color-scheme:light;
}
.l-uk{display:none}
:root[data-lang="uk"] .l-en{display:none}
:root[data-lang="uk"] .l-uk{display:inline}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;overflow-wrap:anywhere}
a{color:var(--accent)}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.mono,.eyebrow,.tag,.chip-n,.code{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.wrap{max-width:1120px;margin:0 auto;padding:28px 16px 32px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.toggles{display:flex;gap:8px;flex-wrap:wrap}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
.toggle{display:inline-flex;border:1px solid var(--line);border-radius:10px;padding:3px;background:var(--panel)}
.toggle button{font:inherit;font-size:13px;color:var(--muted);background:none;border:0;border-radius:7px;padding:4px 12px;cursor:pointer}
.toggle button[aria-pressed="true"]{background:var(--panel-2);color:var(--text);box-shadow:0 0 0 1px var(--line-2)}
h1{font-size:clamp(28px,4.6vw,46px);line-height:1.08;letter-spacing:-.02em;margin:10px 0 10px;font-weight:800}
h2{font-size:20px;margin:0;letter-spacing:-.01em}
h3{font-size:16px;margin:0}
.url{display:inline-block;font-size:14px;margin-bottom:14px;word-break:break-all}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;padding:0;list-style:none}
.tag{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;color:var(--muted);background:var(--panel)}
.tag b{color:var(--text);font-weight:600}
.tag a{text-transform:none;letter-spacing:0}
.tag.warn{border-color:var(--amber);color:var(--amber);background:var(--amber-soft)}
.tag.warn b{color:var(--amber)}
.note{margin:0;color:var(--muted);max-width:820px;font-size:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:22px;box-shadow:var(--glow)}
.panel-head{display:flex;justify-content:space-between;align-items:baseline;gap:6px 12px;flex-wrap:wrap;margin-bottom:14px}
.panel-head .sub{color:var(--muted);font-size:13px}
.banner{margin-top:18px;border:1.5px solid var(--red);background:var(--red-soft);border-radius:14px;padding:14px 18px}
.banner h2{color:var(--red);font-size:17px;margin-bottom:4px}
.banner p{margin:0;font-size:14.5px}
.pipeline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0;padding:0 0 16px;list-style:none;border-bottom:1px solid var(--line)}
.pipeline li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px}
.pipeline .step{display:inline-flex;align-items:center;flex-wrap:wrap;gap:2px 7px;padding:6px 11px;border:1px solid var(--line);border-radius:10px;background:var(--panel-2);overflow-wrap:normal;word-break:normal}
.pipeline .step small{color:var(--muted);font-weight:500;font-size:13px}
.ok{width:15px;height:15px;color:var(--accent);flex:none}
.arrow{color:var(--faint)}
.pipeline-note{color:var(--muted);font-size:12.5px;margin:10px 0 0}
.counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.counter{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.counter .n{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.counter .n small{font-size:16px;color:var(--muted);font-weight:600}
.counter .l{color:var(--muted);font-size:13px;margin-top:4px}
.counter.full{border-color:var(--amber);background:var(--amber-soft)}
.counter.full .n,.counter.full .n small{color:var(--amber)}
.strip{display:flex;align-items:stretch;gap:8px;margin-top:8px}
.frame{position:relative;flex:26 1 0;min-width:0;display:flex;gap:3px;padding:6px;border:1.5px solid var(--accent);border-radius:10px;background:var(--accent-soft)}
.frame.full{border-color:var(--amber)}
.cell{flex:1 1 0;min-width:0;height:44px;border-radius:4px;background:var(--c);display:block;position:relative;transition:transform .12s, box-shadow .12s}
.cell.side{background:repeating-linear-gradient(135deg,var(--c) 0 5px,color-mix(in srgb,var(--c) 55%,var(--panel)) 5px 8px)}
.cell:hover,.cell:focus-visible,.cell.on{transform:translateY(-3px);box-shadow:0 0 0 2px var(--panel),0 0 0 4px var(--c);outline:none}
.slot{flex:1 1 0;min-width:0;height:44px;border-radius:4px;border:1px dashed var(--line-2);background:var(--empty)}
.tail{flex:0 0 22%;min-width:64px;border:1.5px dashed var(--amber);border-radius:10px;background:var(--amber-soft);color:var(--amber);display:flex;flex-direction:column;justify-content:center;padding:6px 10px;font-size:12px;line-height:1.3}
.tail b{font-size:15px;font-variant-numeric:tabular-nums}
.scale{display:flex;gap:8px;margin-top:6px;font-size:11.5px;color:var(--muted)}
.scale .in{flex:26 1 0;min-width:0;display:flex;justify-content:space-between}
.scale .out{flex:0 0 22%;min-width:64px;color:var(--amber)}
.scale .cap{color:var(--accent);font-weight:700}
.scale .cap.full{color:var(--amber)}
.compact .cell,.compact .slot{height:30px}
.readout{margin:12px 0 0;min-height:3.2em;padding:10px 12px;border-radius:10px;background:var(--panel-2);border:1px solid var(--line);font-size:13.5px;color:var(--muted)}
.readout b{color:var(--text)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;padding:0;list-style:none;font-size:13px;color:var(--muted)}
.legend li{display:flex;align-items:center;gap:6px}
.sw{width:10px;height:10px;border-radius:3px;background:var(--c);flex:none}
.groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.gcard{border:1px solid var(--line);border-top:3px solid var(--c);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.gcard .gid{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gcard h3{margin:4px 0 8px;font-size:16.5px;line-height:1.3}
.gcard .gnote{color:var(--muted);font-size:13px;margin:0 0 8px}
.src{display:inline-flex;flex-wrap:wrap;gap:2px 6px;align-items:baseline;font-size:11px;letter-spacing:.06em;border-radius:6px;padding:2px 7px;border:1px solid var(--line-2);color:var(--muted);max-width:100%}
.src .k{text-transform:uppercase}
.src .v{letter-spacing:0;font-size:12px;color:var(--text);text-transform:none}
.src.heading{border-color:var(--accent)}
.src.heading .k{color:var(--accent)}
.topic{display:inline-block;margin:0 0 8px;font-size:11.5px;border-radius:999px;padding:1px 9px;background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent)}
.gstats{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0 8px;font-size:13px;color:var(--muted)}
.gstats b{color:var(--text);font-variant-numeric:tabular-nums}
.bar{height:6px;border-radius:999px;background:var(--empty);overflow:hidden}
.bar span{display:block;height:100%;background:var(--c);border-radius:999px}
.explain{color:var(--muted);font-size:13px;margin:12px 0 0}
.pgroup{margin-top:18px}
.pgroup:first-of-type{margin-top:4px}
.pgroup-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.pgroup-head .sw{width:12px;height:12px}
.pgroup-head small{color:var(--muted);font-weight:500;font-size:13px}
.plist{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.passage{border:1px solid var(--line);border-left:3px solid var(--c);border-radius:10px;padding:10px 14px;background:var(--panel-2);scroll-margin-top:16px}
.passage:target{box-shadow:0 0 0 2px var(--c)}
.phead{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:13px;color:var(--muted)}
.phead .num{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-weight:700;color:var(--text);font-size:13.5px}
.phead .ph{color:var(--text);font-weight:600}
.role{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;border-radius:6px;padding:1px 7px;border:1px solid var(--line-2)}
.role.related,.role.utility{color:var(--amber);border-color:var(--amber)}
.role.dup{color:var(--muted)}
.opening{margin:6px 0 0;font-size:14px}
details{margin-top:6px}
summary{cursor:pointer;color:var(--accent);font-size:13px;width:max-content;max-width:100%}
.full-text{white-space:pre-wrap;margin:8px 0 0;padding:10px 12px;border-radius:8px;background:var(--panel);border:1px solid var(--line);font-size:13.5px;max-height:420px;overflow:auto}
.cut{margin-top:12px;border:1.5px dashed var(--amber);background:var(--amber-soft);color:var(--text);border-radius:10px;padding:10px 14px;font-size:14px}
.cut b{color:var(--amber)}
.sides{margin:0;padding-left:18px}
.sides li{margin:3px 0}
.kw{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.kw h3,.subhead{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 8px;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-weight:700}
.subhead{margin-top:22px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;font-size:13.5px;background:var(--panel-2)}
.chip.scope{border-color:var(--accent);background:var(--accent-soft)}
.chip-n{font-size:11.5px;color:var(--muted)}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel-2)}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:0}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.code{font-size:12.5px}
.pill{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:1px 9px;border:1px solid var(--line-2);color:var(--muted);white-space:nowrap;font-weight:600}
.pill.good{color:var(--green);border-color:var(--green);background:var(--green-soft)}
.pill.bad{color:var(--red);border-color:var(--red);background:var(--red-soft)}
.pill.mid{color:var(--amber);border-color:var(--amber);background:var(--amber-soft)}
.pill.sev-high{color:var(--red);border-color:var(--red);background:var(--red-soft)}
.pill.sev-medium{color:var(--amber);border-color:var(--amber);background:var(--amber-soft)}
.pill.sev-low{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.small{font-size:12.5px;color:var(--muted)}
.facts-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.kv{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--panel-2)}
.kv .k{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.kv .v{margin-top:4px;font-size:14px}
.findings{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.finding{border:1px solid var(--line);border-left:3px solid var(--sev);border-radius:12px;padding:12px 16px;background:var(--panel-2)}
.finding.high{--sev:var(--red)}.finding.medium{--sev:var(--amber)}.finding.low{--sev:var(--accent)}.finding.info{--sev:var(--line-2)}
.fhead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.fhead h3{font-size:15.5px}
.fhead .code{color:var(--faint)}
.finding p{margin:6px 0 0;font-size:14px}
.finding .tell{color:var(--muted)}
.finding .tell b{color:var(--text)}
.refs{display:flex;flex-wrap:wrap;gap:4px 8px;margin-top:6px;font-size:13px}
.refs a{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-decoration:none;border:1px solid var(--line-2);border-radius:6px;padding:0 6px}
.samples{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:4px}
.samples li{font-size:13px;color:var(--muted);border-left:2px solid var(--line-2);padding-left:10px}
.samples q{color:var(--text)}
.plan{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.item{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.ihead{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:8px}
.ihead .pill{white-space:normal;max-width:100%}
.prio{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--accent);color:var(--accent-ink);font-weight:800;font-size:14px}
.item dl{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;font-size:14px}
.item dt{color:var(--muted);font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding-top:2px}
.item dd{margin:0}
.ba{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:stretch;margin-top:12px}
.ba .side{border-radius:10px;padding:10px 12px;font-size:13.5px;border:1px solid}
.ba .side .k{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;margin-bottom:4px}
.ba .was{border-color:var(--amber);background:var(--amber-soft)}
.ba .was .k{color:var(--amber)}
.ba .now{border-color:var(--green);background:var(--green-soft)}
.ba .now .k{color:var(--green)}
.ba .to{align-self:center;color:var(--faint);font-size:18px}
.quote{font-size:13px}
.win{font-weight:700;color:var(--green)}
.cellmark{display:flex;flex-direction:column;gap:3px}
.heat .hbar{display:block;height:4px;border-radius:999px;background:var(--accent);margin-top:4px;opacity:.85}
.gap{color:var(--faint)}
.yes{color:var(--green);font-weight:700}
.only{display:inline-block;margin-left:6px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:0 6px}
.closing{font-size:16px;font-weight:600;margin:0}
.closing.full{color:var(--amber)}
.fine{color:var(--muted);font-size:13px;margin:10px 0 0}
.foot{margin-top:28px;border-top:1px solid var(--line);padding:18px 0 4px;color:var(--faint);font-size:12.5px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;align-items:center}
.foot p{margin:0;max-width:560px}
.links{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.links a{display:inline-flex;align-items:center;gap:7px;color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 9px;background:var(--panel);font-size:13px}
.links a:hover{color:var(--text);border-color:var(--line-2)}
.links svg{width:15px;height:15px;flex:none}
.pagesec{border-top:1px solid var(--line);margin-top:18px;padding-top:16px}
.pagesec:first-of-type{border-top:0;margin-top:0;padding-top:0}
.pagesec h3{font-size:15px;margin-bottom:6px}
@media (max-width:540px){.counters{grid-template-columns:1fr}}
@media (max-width:720px){
  .counter .n{font-size:24px}
  .pipeline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .pipeline .arrow{display:none}
  .pipeline li{min-width:0}
  .pipeline .step{width:100%}
  .kw{grid-template-columns:1fr}
  .cell,.slot{height:36px}
  .frame{padding:4px;gap:2px}
  .tail{flex-basis:26%;padding:4px 6px;font-size:11px}
  .tail b{font-size:13px}
  .scale .out{flex-basis:26%}
  .panel{padding:16px}
  .ba{grid-template-columns:1fr}
  .ba .to{justify-self:center;transform:rotate(90deg)}
  .item dl{grid-template-columns:1fr}
  .facts-grid{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.cell{transition:none}}
`;

// Theme: a #theme=light|dark (or ?theme=) in the URL wins, then the stored choice, then the system.
// Language: #lang=uk|en (or ?lang=) wins, then the stored choice, then English.
// Strip: hovering or focusing a cell writes its passage, heading and group into the readout.
const JS = `
(function(){
  var root=document.documentElement,KEY="vectorscope-theme",LKEY="vectorscope-lang";
  function param(re){var m=re.exec(location.search+location.hash);return m?m[1]:null}
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function put(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function effective(){var t=root.getAttribute("data-theme");if(t)return t;try{return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){return "dark"}}
  function paint(){var t=effective(),l=root.getAttribute("data-lang")||"en";var b=document.querySelectorAll("[data-set-theme]");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t));var c=document.querySelectorAll("[data-set-lang]");for(var j=0;j<c.length;j++)c[j].setAttribute("aria-pressed",String(c[j].getAttribute("data-set-lang")===l))}
  function applyLang(l){
    root.setAttribute("data-lang",l);root.setAttribute("lang",l==="uk"?"uk":"en");
    var els=document.querySelectorAll("[data-i18n]"),pre="data-"+l+"-";
    for(var i=0;i<els.length;i++){var el=els[i],set=[];for(var j=0;j<el.attributes.length;j++){var a=el.attributes[j];if(a.name.indexOf(pre)===0)set.push([a.name.slice(pre.length),a.value])}for(var k=0;k<set.length;k++)el.setAttribute(set[k][0],set[k][1])}
  }
  var first=param(/[?#&]theme=(light|dark)/)||get(KEY);if(first==="light"||first==="dark")root.setAttribute("data-theme",first);
  var lang=param(/[?#&]lang=(en|uk)/)||get(LKEY);root.setAttribute("data-lang",lang==="uk"?"uk":"en");
  document.addEventListener("DOMContentLoaded",function(){
    applyLang(root.getAttribute("data-lang"));paint();
    var b=document.querySelectorAll("[data-set-theme]");
    for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);put(KEY,t);paint()});
    var c=document.querySelectorAll("[data-set-lang]");
    for(var j=0;j<c.length;j++)c[j].addEventListener("click",function(){var l=this.getAttribute("data-set-lang");applyLang(l);put(LKEY,l);paint()});
    var outs=document.querySelectorAll(".readout");
    for(var o=0;o<outs.length;o++)(function(out){
      var scope=out.parentNode,cells=scope.querySelectorAll(".cell"),idle=null;
      function show(c){if(idle===null)idle=out.innerHTML;out.innerHTML=c.getAttribute("data-tip")}
      function reset(){if(idle!==null)out.innerHTML=idle}
      for(var q=0;q<cells.length;q++){
        cells[q].addEventListener("mouseenter",function(){show(this)});
        cells[q].addEventListener("focus",function(){show(this)});
        cells[q].addEventListener("mouseleave",function(){if(document.activeElement!==this)reset()});
        cells[q].addEventListener("blur",reset);
      }
    })(outs[o]);
  });
})();
`;

// ── shared pieces ────────────────────────────────────────────────────────────

function documentStart(title) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="referrer" content="no-referrer">',
    // No network from this file: styles and the one script are inline, nothing else loads.
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">`,
    `<title>${esc(title)}</title>`,
    `<style>${CSS}</style>`,
    `<script>${JS}</script>`,
    "</head>",
    "<body>",
    '<main class="wrap">',
  ];
}

function topBar(eyebrowKey) {
  return [
    '<div class="top">',
    `<span class="eyebrow">${L(eyebrowKey)}</span>`,
    '<div class="toggles">',
    `<div class="toggle" role="group" ${attr("aria-label", "langGroup")}><button type="button" data-set-lang="en" aria-pressed="true">EN</button><button type="button" data-set-lang="uk" aria-pressed="false" lang="uk">UK</button></div>`,
    `<div class="toggle" role="group" ${attr("aria-label", "themeGroup")}><button type="button" data-set-theme="dark" aria-pressed="false">${L("dark")}</button><button type="button" data-set-theme="light" aria-pressed="false">${L("light")}</button></div>`,
    "</div>",
    "</div>",
  ];
}

function footer() {
  const links = FOOTER_LINKS.map((link) => {
    const label = link.key ? `${esc(link.name)} · ${L(link.key)}` : esc(link.name);
    return `<li><a href="${esc(link.href)}" rel="noopener noreferrer" target="_blank">${ICONS[link.id]}<span>${label}</span></a></li>`;
  }).join("");
  return [`<footer class="foot"><p>${L("footerMade")}</p><ul class="links">${links}</ul></footer>`];
}

function documentEnd() {
  return ["</main>", "</body>", "</html>"];
}

const SEV_KEY = { high: "sevHigh", medium: "sevMedium", low: "sevLow", info: "sevInfo" };
const KIND_KEY = { search: "kindSearch", user: "kindUser", training: "kindTraining", index: "kindIndex" };
const VERDICT_KEY = { complete: "vComplete", partial: "vPartial", missing: "vMissing" };
const VERDICT_CLASS = { complete: "good", partial: "mid", missing: "bad" };

/** The bots that answer people (not training-only) and are blocked; the banner's subject. */
function answeringBlocked(robots) {
  if (!robots) return [];
  return (robots.bots || []).filter((bot) => !bot.allowed && bot.kind !== "training");
}

function bannerFor(robots, prefix = "") {
  if (!robots) return [];
  if (robots.status === "unreachable") {
    return [`<section class="banner" role="alert"><h2>${prefix}${L("bannerTitle")}</h2><p>${L("bannerUnreachable")}</p></section>`];
  }
  const blocked = answeringBlocked(robots);
  if (!blocked.length) return [];
  const bots = blocked.map((b) => `<b class="mono">${esc(b.token)}</b>`).join(", ");
  return [`<section class="banner" role="alert"><h2>${prefix}${L("bannerTitle")}</h2><p>${L("bannerBody", { bots })}</p></section>`];
}

/** Links to passages: #3 #4 … (anchors are p-3 in single mode, p2-3 for page 2 in compare). */
function refs(passages, anchor) {
  if (!passages?.length) return "";
  return `<div class="refs"><span class="small">${L("passagesLabel")}:</span>${passages.map((i) => `<a href="#${anchor(i)}">#${i}</a>`).join("")}</div>`;
}

function robotsTable(robots, pageUrl) {
  const out = [];
  if (!robots) return out;
  if (robots.status === "not_checked") {
    out.push(`<p class="note">${L("robotsNotChecked")}</p>`);
    return out;
  }
  let path = "/";
  try {
    path = pathOf(pageUrl);
  } catch {}
  out.push(`<p class="small" style="margin:0 0 8px">${L("robotsFor", { path: `<span class="mono">${esc(path)}</span>` })}</p>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colCrawler")}</th><th>${L("colVendor")}</th><th>${L("colPurpose")}</th><th>${L("colVerdict")}</th><th>${L("colRule")}</th></tr></thead><tbody>`);
  for (const bot of robots.bots) {
    const verdict = bot.allowed ? `<span class="pill good">${L("allowed")}</span>` : `<span class="pill bad">${L("blocked")}</span>`;
    const rule = bot.rule ? `<span class="code">${esc(bot.rule)}</span>${bot.group === "*" ? ` <span class="small">${L("groupStar")}</span>` : ""}` : `<span class="small">${L("noRule")}</span>`;
    const caveat = bot.honours === false ? `<div class="small">${L("mayIgnore")}</div>` : "";
    out.push(`<tr><td class="code">${esc(bot.token)}</td><td>${esc(bot.vendor)}</td><td>${L(KIND_KEY[bot.kind])}${caveat}</td><td>${verdict}</td><td>${rule}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  if (robots.status === "ok") out.push(`<p class="small" style="margin:8px 0 0">${L("robotsSource", { url: `<span class="mono">${esc(robots.url)}</span>` })}</p>`);
  if (robots.status === "none") out.push(`<p class="small" style="margin:8px 0 0">${L("robotsNone", { status: esc(robots.httpStatus) })}</p>`);
  return out;
}

function technicalGrid(reading) {
  const t = reading.technical;
  if (!t) return [];
  const out = [];
  out.push(`<h3 class="subhead">${L("technical")}</h3>`);
  out.push('<div class="facts-grid">');
  const types = t.jsonLd.types.length ? t.jsonLd.types.map((x) => `<span class="code">${esc(x)}</span>`).join(", ") : L("jsonLdNone");
  const invalid = t.jsonLd.invalid ? ` · ${L("jsonLdInvalid", { n: t.jsonLd.invalid })}` : "";
  out.push(`<div class="kv"><div class="k">${L("jsonLd")}</div><div class="v">${types}${invalid}</div></div>`);
  let canon;
  if (!t.canonical.present) canon = `<span class="pill mid">${L("canonicalMissing")}</span>`;
  else {
    canon = t.canonical.self ? `<span class="pill good">${L("canonicalSelf")}</span>` : `<span class="pill bad">${L("canonicalOther")}</span>`;
    if (!t.canonical.absolute) canon += ` <span class="pill mid">${L("canonicalRelative")}</span>`;
    canon += `<div class="small mono" style="margin-top:4px">${esc(t.canonical.href)}</div>`;
  }
  out.push(`<div class="kv"><div class="k">${L("canonical")}</div><div class="v">${canon}</div></div>`);
  const desc = t.metaDescription.present ? L("metaChars", { n: t.metaDescription.length }) : `<span class="pill mid">${L("metaNone")}</span>`;
  out.push(`<div class="kv"><div class="k">${L("metaDescription")}</div><div class="v">${desc}</div></div>`);
  out.push("</div>");
  const r = reading.render;
  if (r) {
    const text = r.ok
      ? L("renderDone", { js: r.wordCount, jsp: r.passages, plain: reading.page.wordCount, plainp: reading.page.chunksIndexed })
      : r.reason === "no_browser"
        ? L("renderNoBrowser")
        : L("renderFailed", { reason: esc(r.reason) });
    out.push(`<div class="kv" style="margin-top:10px"><div class="k">${L("render")}</div><div class="v">${text}</div></div>`);
  }
  return out;
}

function findingCard(finding, anchor) {
  const ev = safeEvidence(finding.evidence);
  const en = checkCopy(finding.code, "en", ev);
  const uk = checkCopy(finding.code, "uk", ev);
  const out = [];
  out.push(`<li class="finding ${finding.severity}">`);
  out.push(`<div class="fhead"><span class="pill sev-${finding.severity}">${L(SEV_KEY[finding.severity])}</span><h3>${pair(en.title, uk.title)}</h3><span class="code">${esc(finding.code)}</span></div>`);
  if (en.what) out.push(`<p>${pair(en.what, uk.what)}</p>`);
  const samples = finding.evidence?.samples;
  if (Array.isArray(samples) && samples.length) {
    out.push('<ul class="samples">');
    for (const s of samples) {
      const where = s.passage !== undefined ? `<a href="#${anchor(s.passage)}" class="mono">#${s.passage}</a> ` : "";
      let body;
      if (s.lines) body = `<q>${esc(s.lines.join(" · "))}</q>${s.count > s.lines.length ? ` <span class="small">(+${s.count - s.lines.length})</span>` : ""}`;
      else if (s.phrase) body = `<q>${esc(s.phrase)}</q> <span class="small">· ${s.groups}/${finding.evidence.groupCount} · ${s.passages.map((i) => `<a class="mono" href="#${anchor(i)}">#${i}</a>`).join(" ")}</span>`;
      else if (s.heading) body = `<q>${esc(s.heading)}</q> <span class="small">· ${fmt(s.chars)}</span>`;
      else body = `<q>${esc(s.text)}</q>`;
      out.push(`<li>${where}${body}</li>`);
    }
    out.push("</ul>");
  }
  const sampled = Array.isArray(samples) ? new Set(samples.map((s) => s.passage)) : new Set();
  if (finding.passages.length && finding.passages.some((p) => !sampled.has(p)) && !samples?.some((s) => s.phrase)) out.push(refs(finding.passages, anchor));
  out.push(`<p class="tell"><b>${L("whatToDo")}:</b> ${pair(en.tell, uk.tell)}</p>`);
  out.push("</li>");
  return out.join("");
}

function checksPanel(reading, checks, anchor) {
  const out = [];
  out.push('<section class="panel" id="checks" aria-labelledby="h-checks">');
  out.push(`<div class="panel-head"><h2 id="h-checks">${L("checks")}</h2><span class="sub">${L("checksSub")}</span></div>`);
  out.push(`<h3 class="subhead" style="margin-top:0">${L("aiCrawlers")}</h3>`);
  out.push(...robotsTable(reading.robots, reading.page.url));
  out.push(...technicalGrid(reading));
  out.push(`<h3 class="subhead">${L("findings")}</h3>`);
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  if (shown.length) {
    out.push('<ol class="findings">');
    for (const f of shown) out.push(findingCard(f, anchor));
    out.push("</ol>");
  } else {
    out.push(`<p class="note">${L("noFindings")}</p>`);
  }
  out.push("</section>");
  return out;
}

function planPanel(plan, anchorFor, multi) {
  if (!plan?.items?.length) return [];
  const out = [];
  out.push('<section class="panel" id="plan" aria-labelledby="h-plan">');
  out.push(`<div class="panel-head"><h2 id="h-plan">${L("plan")}</h2><span class="sub">${L("planSub")}</span></div>`);
  out.push('<ol class="plan">');
  for (const item of plan.items) {
    const anchor = anchorFor(item.page);
    out.push('<li class="item">');
    const known = item.check && CHECK_COPY[item.check];
    const code = item.check ? `<span class="pill">${known ? pair(checkCopy(item.check, "en").title, checkCopy(item.check, "uk").title) : esc(item.check)}</span>` : "";
    const where = multi ? `<span class="pill">${L("pageN", { n: item.page })}</span>` : "";
    out.push(`<div class="ihead"><span class="prio">${item.priority}</span>${where}${code}${item.passages.map((i) => `<a class="mono small" href="#${anchor(i)}">#${i}</a>`).join(" ")}</div>`);
    out.push(`<dl><dt>${L("problem")}</dt><dd>${esc(item.problem)}</dd><dt>${L("fix")}</dt><dd>${esc(item.fix)}</dd></dl>`);
    if (item.before) {
      out.push(`<div class="ba"><div class="side was"><span class="k">${L("before")}</span>${esc(item.before)}</div><div class="to" aria-hidden="true">→</div><div class="side now"><span class="k">${L("after")}</span>${esc(item.after)}</div></div>`);
    }
    out.push("</li>");
  }
  out.push("</ol>");
  out.push("</section>");
  return out;
}

function verdictPill(r) {
  return `<span class="pill ${VERDICT_CLASS[r.verdict]}">${L(VERDICT_KEY[r.verdict])}</span>`;
}

function querySummary(queries, n) {
  const results = queries.map((q) => q.results[n]);
  return L("querySummary", {
    total: results.length,
    complete: results.filter((r) => r.verdict === "complete").length,
    partial: results.filter((r) => r.verdict === "partial").length,
    missing: results.filter((r) => r.verdict === "missing").length,
    citable: results.filter((r) => r.citable).length,
  });
}

function queriesPanelSingle(queries, n, anchor) {
  if (!queries?.length) return [];
  const out = [];
  out.push('<section class="panel" id="queries" aria-labelledby="h-queries">');
  out.push(`<div class="panel-head"><h2 id="h-queries">${L("queries")}</h2><span class="sub">${L("queriesSub")}</span></div>`);
  out.push(`<p class="note" style="margin-bottom:12px">${querySummary(queries, n)}</p>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colQuery")}</th><th>${L("colBest")}</th><th>${L("colAnswer")}</th><th>${L("colCitable")}</th><th>${L("colQuote")}</th></tr></thead><tbody>`);
  for (const q of queries) {
    const r = q.results[n];
    const src = `<div class="small">${L(q.source === "user" ? "srcUser" : "srcGenerated")}</div>`;
    const best = r.passage === null ? "—" : `<a class="mono" href="#${anchor(r.passage)}">#${r.passage}</a>`;
    out.push(`<tr><td>${esc(q.query)}${src}</td><td class="num">${best}</td><td>${verdictPill(r)}</td><td>${r.citable ? `<span class="yes">${L("yes")}</span>` : `<span class="gap">${L("no")}</span>`}</td><td class="quote">${r.quote ? `<q>${esc(r.quote)}</q>` : "—"}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  out.push("</section>");
  return out;
}

function factsPanelSingle(facts, n, anchor) {
  if (!facts?.length) return [];
  const out = [];
  out.push('<section class="panel" id="facts" aria-labelledby="h-facts">');
  out.push(`<div class="panel-head"><h2 id="h-facts">${L("facts")}</h2><span class="sub">${L("factsSub")}</span></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colFact")}</th><th>${L("passagesLabel")}</th></tr></thead><tbody>`);
  for (const f of facts) {
    out.push(`<tr><td>${esc(f.fact)}</td><td class="num">${(f.pages[n] || []).map((i) => `<a class="mono" href="#${anchor(i)}">#${i}</a>`).join(" ")}</td></tr>`);
  }
  out.push("</tbody></table></div>");
  out.push("</section>");
  return out;
}

function diffPanel(diff) {
  if (!diff) return [];
  const out = [];
  out.push('<section class="panel" id="diff" aria-labelledby="h-diff">');
  out.push(`<div class="panel-head"><h2 id="h-diff">${L("diff")}</h2><span class="sub">${L("diffSub", { url: `<span class="mono">${esc(diff.baselineUrl)}</span>` })}</span></div>`);
  out.push(`<p class="note" style="margin-bottom:12px">${L("diffCounts", diff.counts)}</p>`);
  const b = diff.before;
  const a = diff.after;
  const yn = (x) => (x ? L("yes") : L("no"));
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colMeasure")}</th><th>${L("colBefore")}</th><th>${L("colAfter")}</th></tr></thead><tbody>`);
  out.push(`<tr><td>${L("mPassages")}</td><td class="num">${b.passages}</td><td class="num">${a.passages}</td></tr>`);
  out.push(`<tr><td>${L("mWords")}</td><td class="num">${fmt(b.words)}</td><td class="num">${fmt(a.words)}</td></tr>`);
  out.push(`<tr><td>${L("mCap")}</td><td>${yn(b.capReached)}</td><td>${yn(a.capReached)}</td></tr>`);
  out.push(`<tr><td>${L("mUnread")}</td><td class="num">${fmt(b.charsUnread)}</td><td class="num">${fmt(a.charsUnread)}</td></tr>`);
  out.push("</tbody></table></div>");
  const changes = diff.passages.filter((p) => p.status !== "same");
  if (changes.length || diff.removed.length) {
    out.push('<ul class="samples" style="margin-top:12px">');
    for (const p of changes) {
      const key = p.status === "changed" ? "stChanged" : "stAdded";
      const delta = p.charsBefore !== null ? ` <span class="small">${fmt(p.charsBefore)} → ${fmt(p.chars)}</span>` : ` <span class="small">${fmt(p.chars)}</span>`;
      out.push(`<li><a class="mono" href="#p-${p.index}">#${p.index}</a> <span class="pill ${p.status === "added" ? "good" : "mid"}">${L(key)}</span> ${p.heading ? `<q>${esc(p.heading)}</q>` : ""}${p.was !== null ? ` <span class="small">${L("wasN", { n: p.was })}</span>` : ""}${delta}</li>`);
    }
    for (const p of diff.removed) out.push(`<li><span class="mono">#${p.index}</span> <span class="pill bad">${L("stRemoved")}</span> ${p.heading ? `<q>${esc(p.heading)}</q>` : ""} <span class="small">${fmt(p.chars)}</span></li>`);
    out.push("</ul>");
  }
  if (diff.groups) {
    out.push(`<h3 class="subhead">${L("groupChanges")}</h3>`);
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colAfter")}</th><th>${L("passagesLabel")}</th><th>${L("cameFrom")}</th></tr></thead><tbody>`);
    for (const g of diff.groups.after) {
      const from = Object.entries(g.from)
        .map(([id, count]) => `${esc(diff.groups.before[id]?.label ?? `#${id}`)} <span class="small">×${count}</span>`)
        .join(", ");
      const fresh = g.passages - Object.values(g.from).reduce((s, x) => s + x, 0);
      out.push(`<tr><td>${g.id} · ${esc(g.label)}</td><td class="num">${g.passages}</td><td>${from || ""}${fresh ? `${from ? ", " : ""}${L("newText")} <span class="small">×${fresh}</span>` : ""}</td></tr>`);
    }
    out.push("</tbody></table></div>");
  }
  out.push("</section>");
  return out;
}

function closingSentence(page) {
  const cap = page.chunkCap;
  const capCut = page.capReached && page.charsUnread > 0;
  if (capCut) return L("closingCut", { cap, n: page.charsUnread });
  if (page.capReached) return L("closingFull", { cap });
  return L("closingFits", { cap, n: page.chunksIndexed });
}

function stripBlock(reading, lens, anchor, compact = false) {
  const { page } = reading;
  const cap = page.chunkCap;
  const capCut = page.capReached && page.charsUnread > 0;
  const colour = (id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
  const out = [];
  out.push(`<div class="strip${compact ? " compact" : ""}">`);
  out.push(`<div class="frame${page.capReached ? " full" : ""}" role="list" ${attr("aria-label", "stripAria", { cap })}>`);
  for (const c of lens.chunks) {
    const label = oneLine(displayLabel(lens.groups[c.group]));
    const roleEn = c.contentRole !== "main" ? ` · ${tr(c.contentRole === "related" ? "roleRelated" : "roleUtility", "en")}` : "";
    const roleUk = c.contentRole !== "main" ? ` · ${tr(c.contentRole === "related" ? "roleRelated" : "roleUtility", "uk")}` : "";
    const headEn = c.heading ? oneLine(c.heading) : tr("noHeading", "en");
    const headUk = c.heading ? oneLine(c.heading) : tr("noHeading", "uk");
    const tipEn = tr("cellTip", "en", { i: c.chunkIndex, heading: esc(headEn), g: c.group, label: esc(label), chars: c.charCount, role: roleEn });
    const tipUk = tr("cellTip", "uk", { i: c.chunkIndex, heading: esc(headUk), g: c.group, label: esc(label), chars: c.charCount, role: roleUk });
    const ariaEn = tr("cellAria", "en", { i: c.chunkIndex, heading: headEn, g: c.group, label, chars: c.charCount, role: roleEn });
    const ariaUk = tr("cellAria", "uk", { i: c.chunkIndex, heading: headUk, g: c.group, label, chars: c.charCount, role: roleUk });
    out.push(
      `<a role="listitem" class="cell${c.contentRole !== "main" ? " side" : ""}" style="${colour(c.group)}" href="#${anchor(c.chunkIndex)}" data-tip="${esc(tipEn)}" data-en-data-tip="${esc(tipEn)}" data-uk-data-tip="${esc(tipUk)}" aria-label="${esc(ariaEn)}" data-en-aria-label="${esc(ariaEn)}" data-uk-aria-label="${esc(ariaUk)}" title="${esc(ariaEn)}" data-en-title="${esc(ariaEn)}" data-uk-title="${esc(ariaUk)}" data-i18n></a>`
    );
  }
  for (let i = lens.chunks.length; i < cap; i++) out.push('<span class="slot" aria-hidden="true"></span>');
  out.push("</div>");
  if (capCut) out.push(`<div class="tail" role="note"><b>${fmt(page.charsUnread)}</b>${L("pastCapShort")}</div>`);
  out.push("</div>");
  out.push('<div class="scale mono" aria-hidden="true">');
  out.push(`<div class="in"><span>#0</span><span class="cap${page.capReached ? " full" : ""}">${L("cap")} · ${cap} ▲</span></div>`);
  if (capCut) out.push(`<div class="out">${L("notRead")}</div>`);
  out.push("</div>");
  out.push(`<p class="readout" aria-live="polite">${L("readoutIdle")}</p>`);
  out.push('<ul class="legend">');
  for (const g of lens.groups) out.push(`<li><span class="sw" style="${colour(g.id)}"></span>${g.id} · ${esc(oneLine(displayLabel(g)))}</li>`);
  out.push("</ul>");
  return out;
}

function groupCards(lens, topicsById = null) {
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const colour = (id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
  const out = ['<div class="groups">'];
  for (const g of lens.groups) {
    const share = indexed ? g.charCount / indexed : 0;
    out.push(`<article class="gcard" style="${colour(g.id)}">`);
    out.push(`<div class="gid mono">${L("groupN", { n: g.id })}</div>`);
    out.push(`<h3>${esc(oneLine(displayLabel(g)))}</h3>`);
    if (g.topic && topicsById) out.push(`<span class="topic">${esc(topicsById.get(g.topic)?.name ?? g.topic)}</span>`);
    if (g.note) out.push(`<p class="gnote">${esc(g.note)}</p>`);
    const srcKey = g.labelSource === "heading" ? "srcHeading" : g.labelSource === "keywords" ? "srcKeywords" : "srcNone";
    const titleKey = g.labelSource === "heading" ? "srcHeadingTitle" : "srcKeywordsTitle";
    const value = g.agentLabel ? `<span class="v">${esc(oneLine(g.label))}</span>` : "";
    out.push(`<span class="src ${esc(g.labelSource)}" ${attr("title", titleKey)}><span class="k">${L("labelSource")}: ${L(srcKey)}</span>${value}</span>`);
    out.push(`<div class="gstats"><span>${L("nPassages", { n: g.chunkCount })}</span><span><b>${fmt(g.charCount)}</b> ${L("chars")}</span><span><b>${pct(share)}</b> ${L("ofIndexed")}</span></div>`);
    out.push(`<div class="bar" role="img" aria-label="${pct(share)}"><span style="width:${(share * 100).toFixed(1)}%"></span></div>`);
    out.push("</article>");
  }
  out.push("</div>");
  return out;
}

// ── single page ──────────────────────────────────────────────────────────────

/**
 * Render one reading. `extras` (all optional): { checks, plan, queries, facts, diff, topicsById }.
 * Called with only (reading, lens) it renders the v1 sections plus an empty checks panel.
 */
export function renderHtml(reading, lens, extras = {}) {
  const { page } = reading;
  const cap = page.chunkCap;
  const groupCount = lens.groups.length;
  const capCut = page.capReached && page.charsUnread > 0;
  const colour = (id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
  const anchor = (i) => `p-${i}`;
  const checks = extras.checks ?? [];

  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {}
  const title = oneLine(page.title || host || page.url);
  const href = safeHref(page.url);
  const out = documentStart(`Vectorscope reading: ${title}`);

  out.push(...topBar("eyebrow"));
  out.push("<header>");
  out.push(`<h1>${esc(title)}</h1>`);
  out.push(
    href
      ? `<a class="url mono" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(page.url)}</a>`
      : `<span class="url mono">${esc(page.url)}</span>`
  );
  if (page.url !== page.requestedUrl) out.push(`<p class="note">${L("askedFor", { url: `<span class="mono">${esc(page.requestedUrl)}</span>` })}</p>`);
  out.push('<ul class="meta">');
  out.push(`<li class="tag">${L("words", { n: page.wordCount })}</li>`);
  out.push(`<li class="tag">${L("headingsFound", { n: page.headings })}</li>`);
  out.push(page.noindex ? `<li class="tag warn">${L("noindexYes")}</li>` : `<li class="tag">${L("noindexNo")}</li>`);
  out.push("</ul>");
  out.push(`<p class="note">${L("groupsNote", { cap, link: `<a href="${VECTORSCOPE_URL}" rel="noopener noreferrer" target="_blank">getlooploop.com/vectorscope</a>` })}</p>`);
  out.push("</header>");
  // If the AI crawlers that answer people are blocked, that is said first.
  out.push(...bannerFor(reading.robots));

  // ── pipeline + counters
  out.push('<section class="panel" aria-labelledby="h-result">');
  out.push(`<div class="panel-head"><h2 id="h-result" class="eyebrow">${L("result")}</h2><span class="sub">${L("whatMachineReads")}</span></div>`);
  out.push('<ol class="pipeline">');
  const steps = [
    ["fetched", ""],
    ["extracted", L("nWords", { n: page.wordCount })],
    ["chunked", L("nPassages", { n: page.chunksIndexed })],
    ["grouped", L("nGroups", { n: groupCount })],
  ];
  steps.forEach(([name, detail], i) => {
    out.push(`<li>${i ? ARROW : ""}<span class="step">${CHECK}${L(name)}${detail ? ` <small>${detail}</small>` : ""}</span></li>`);
  });
  out.push("</ol>");
  out.push(`<p class="pipeline-note">${L("pipelineNote", { headings: page.headings, chars: page.charsIndexed, repeats: lens.duplicates })}</p>`);
  out.push('<div class="counters">');
  out.push(`<div class="counter"><div class="n">${fmt(page.chunksIndexed)}</div><div class="l">${L("passagesRead")}</div></div>`);
  out.push(`<div class="counter${page.capReached ? " full" : ""}"><div class="n">${fmt(page.chunksIndexed)}<small>/${cap}</small></div><div class="l">${L("slotsUsed", { cap, full: page.capReached })}</div></div>`);
  out.push(`<div class="counter${capCut ? " full" : ""}"><div class="n">${fmt(page.charsUnread)}</div><div class="l">${L("pastCap")}</div></div>`);
  out.push("</div>");
  out.push("</section>");

  // ── reading strip
  out.push('<section class="panel" aria-labelledby="h-strip">');
  out.push(`<div class="panel-head"><h2 id="h-strip">${L("strip")}</h2><span class="sub">${L("stripSub", { cap })}</span></div>`);
  out.push(...stripBlock(reading, lens, anchor));
  out.push("</section>");

  out.push(...diffPanel(extras.diff));
  out.push(...checksPanel(reading, checks, anchor));
  out.push(...planPanel(extras.plan, () => anchor, false));
  out.push(...queriesPanelSingle(extras.queries, 1, anchor));

  // ── groups
  out.push('<section class="panel" aria-labelledby="h-groups">');
  out.push(`<div class="panel-head"><h2 id="h-groups">${L("groupsTitle")}</h2><span class="sub">${L("groupsSub", { n: groupCount })}</span></div>`);
  out.push(...groupCards(lens, extras.topicsById ?? null));
  out.push(`<p class="explain">${L("groupsExplain")}</p>`);
  out.push("</section>");

  // ── passages by group
  out.push('<section class="panel" aria-labelledby="h-passages">');
  out.push(`<div class="panel-head"><h2 id="h-passages">${L("passagesTitle")}</h2><span class="sub">${L("passagesSub", { n: PREVIEW_CHARS })}</span></div>`);
  for (const g of lens.groups) {
    out.push(`<div class="pgroup" style="${colour(g.id)}">`);
    out.push(`<div class="pgroup-head"><span class="sw"></span><h3>${g.id} · ${esc(oneLine(displayLabel(g)))}</h3><small>${L("nPassages", { n: g.chunkCount })}</small></div>`);
    out.push('<ol class="plist">');
    for (const index of g.members) {
      const c = lens.chunks[index];
      const text = reading.passages[index]?.text ?? c.preview;
      const roleKey = c.contentRole === "related" ? "roleRelated" : c.contentRole === "utility" ? "roleUtility" : "roleMain";
      out.push(`<li class="passage" id="${anchor(c.chunkIndex)}">`);
      out.push('<div class="phead">');
      out.push(`<span class="num">#${c.chunkIndex}</span>`);
      if (c.heading) out.push(`<span class="ph">${esc(oneLine(c.heading))}</span>`);
      out.push(`<span>${fmt(c.charCount)} ${L("chars")}</span>`);
      out.push(`<span class="role ${esc(c.contentRole)}">${L(roleKey)}</span>`);
      if (c.duplicateOf !== null) out.push(`<span class="role dup">${L("repeats", { n: c.duplicateOf })}</span>`);
      out.push("</div>");
      out.push(`<p class="opening">${esc(oneLine(c.preview))}${c.charCount > PREVIEW_CHARS ? "…" : ""}</p>`);
      if (c.charCount > PREVIEW_CHARS) {
        out.push(`<details><summary>${L("showFull")}</summary><div class="full-text">${esc(text)}</div></details>`);
      }
      out.push("</li>");
    }
    out.push("</ol>");
    out.push("</div>");
  }
  if (capCut) out.push(`<p class="cut">${L("outsideCap", { n: page.charsUnread })}</p>`);
  out.push("</section>");

  // ── side-path content
  const side = lens.chunks.filter((c) => c.contentRole !== "main");
  out.push('<section class="panel" aria-labelledby="h-side">');
  out.push(`<div class="panel-head"><h2 id="h-side">${L("sideTitle")}</h2></div>`);
  if (side.length) {
    out.push(`<p class="note">${L("sideSome", { n: side.length })}</p>`);
    out.push('<ul class="sides">');
    for (const c of side) {
      out.push(`<li><a href="#${anchor(c.chunkIndex)}">#${c.chunkIndex}</a>${c.heading ? ` · ${esc(oneLine(c.heading))}` : ""} · ${L(c.contentRole === "related" ? "relatedLink" : "utilityCopy")} (${L("group")} ${c.group})</li>`);
    }
    out.push("</ul>");
  } else {
    out.push(`<p class="note">${L("sideNone")}</p>`);
  }
  out.push("</section>");

  // ── keywords
  const scope = lens.keywords.filter((k) => k.scope);
  const section = lens.keywords.filter((k) => !k.scope);
  const chip = (k) =>
    `<li class="chip${k.scope ? " scope" : ""}" ${attr("title", "kwTitleAttr", { count: k.count, groups: k.groups, total: groupCount })}>${esc(k.term)} <span class="chip-n">×${fmt(k.count)} · ${k.groups}/${groupCount}</span></li>`;
  out.push('<section class="panel" aria-labelledby="h-kw">');
  out.push(`<div class="panel-head"><h2 id="h-kw">${L("kwTitle")}</h2></div>`);
  out.push(`<p class="note" style="margin-bottom:14px">${L("kwNote")}</p>`);
  out.push('<div class="kw">');
  out.push(`<div><h3>${L("kwScope")}</h3>${scope.length ? `<ul class="chips">${scope.map(chip).join("")}</ul>` : `<p class="note">${L("kwNoScope")}</p>`}</div>`);
  out.push(`<div><h3>${L("kwSection")}</h3>${section.length ? `<ul class="chips">${section.map(chip).join("")}</ul>` : `<p class="note">${L("none")}</p>`}</div>`);
  out.push("</div>");
  out.push("</section>");

  out.push(...factsPanelSingle(extras.facts, 1, anchor));

  // ── closing
  out.push('<section class="panel" aria-label="Closing">');
  out.push(`<p class="closing${capCut ? " full" : ""}">${closingSentence(page)}</p>`);
  out.push(`<p class="fine">${L("fine")}</p>`);
  out.push("</section>");
  out.push(...footer());
  out.push(...documentEnd());
  return out.join("\n") + "\n";
}

// ── compare ──────────────────────────────────────────────────────────────────

function hostOf(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.length > 1 ? u.pathname : ""}`;
  } catch {
    return String(url);
  }
}

/**
 * Render a comparison. `data`: { pages: [{ n, reading, lens, checks }], topics, topicCmp, facts,
 * factCmp, queries, plan }.
 */
export function renderCompareHtml(data) {
  const { pages, topics, topicCmp, facts, factCmp, queries, plan } = data;
  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const anchorFor = (n) => (i) => `p${n}-${i}`;
  const short = (p) => `<span class="mono">${p.n}</span> · ${esc(clip(hostOf(p.reading.page.url), 48))}`;
  const out = documentStart(`Vectorscope comparison: ${pages.map((p) => hostOf(p.reading.page.url)).join(" vs ")}`);

  out.push(...topBar("eyebrowCompare"));
  out.push("<header>");
  out.push(`<h1>${L("compareTitle", { n: pages.length })}</h1>`);
  out.push('<ul class="meta">');
  for (const p of pages) {
    const href = safeHref(p.reading.page.url);
    out.push(`<li class="tag"><b>${p.n}</b> ${href ? `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(clip(hostOf(p.reading.page.url), 60))}</a>` : esc(p.reading.page.url)}</li>`);
  }
  out.push("</ul>");
  out.push(`<p class="note">${L("groupsNote", { cap: pages[0].reading.page.chunkCap, link: `<a href="${VECTORSCOPE_URL}" rel="noopener noreferrer" target="_blank">getlooploop.com/vectorscope</a>` })}</p>`);
  out.push("</header>");
  for (const p of pages) out.push(...bannerFor(p.reading.robots, `${L("pageN", { n: p.n })} · `));

  // ── pages overview
  out.push('<section class="panel" aria-labelledby="h-pages">');
  out.push(`<div class="panel-head"><h2 id="h-pages">${L("pagesTitle")}</h2></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colPage")}</th><th>${L("colWords")}</th><th>${L("colPassages")}</th><th>${L("colPastCap")}</th><th>${L("colBlocked")}</th><th>${L("colFindings")}</th></tr></thead><tbody>`);
  for (const p of pages) {
    const pg = p.reading.page;
    const blocked = (p.reading.robots?.bots || []).filter((b) => !b.allowed).map((b) => b.token);
    const high = p.checks.filter((f) => f.severity === "high").length;
    const medium = p.checks.filter((f) => f.severity === "medium").length;
    const low = p.checks.filter((f) => f.severity === "low").length;
    const sev = [
      high ? `<span class="pill sev-high">${high} ${L("sevHigh")}</span>` : "",
      medium ? `<span class="pill sev-medium">${medium} ${L("sevMedium")}</span>` : "",
      low ? `<span class="pill sev-low">${low} ${L("sevLow")}</span>` : "",
    ].filter(Boolean).join(" ");
    out.push(
      `<tr><td>${short(p)}<div class="small">${esc(clip(pg.title, 70))}</div></td><td class="num">${fmt(pg.wordCount)}</td><td class="num">${pg.chunksIndexed}/${pg.chunkCap}</td><td class="num">${fmt(pg.charsUnread)}</td><td>${blocked.length ? `<span class="code">${esc(blocked.join(", "))}</span>` : "—"}</td><td>${sev || "—"}</td></tr>`
    );
  }
  out.push("</tbody></table></div>");
  out.push("</section>");

  // ── topic table
  out.push('<section class="panel" id="topics" aria-labelledby="h-topics">');
  out.push(`<div class="panel-head"><h2 id="h-topics">${L("topicTable")}</h2><span class="sub">${L("topicTableSub")}</span></div>`);
  out.push('<div class="tablewrap"><table>');
  out.push(`<thead><tr><th>${L("colTopic")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
  for (const row of topicCmp.table) {
    const cells = pages
      .map((p) => {
        const c = row.cells[p.n];
        if (!c.passages) return `<td class="gap">—</td>`;
        return `<td class="num heat">${L("nPassages", { n: c.passages })} · ${fmt(c.chars)} ${L("chars")}<span class="hbar" style="width:${Math.max(4, Math.round(c.share * 100))}%"></span></td>`;
      })
      .join("");
    out.push(`<tr><td>${esc(row.name)}</td>${cells}</tr>`);
  }
  out.push("</tbody></table></div>");
  out.push(`<h3 class="subhead">${L("topicGaps")}</h3>`);
  out.push(`<p class="small" style="margin:0 0 8px">${L("topicGapsSub")}</p>`);
  out.push('<ul class="samples">');
  for (const p of pages) {
    const gaps = topicCmp.gaps[p.n];
    out.push(`<li>${short(p)}: ${gaps.length ? gaps.map((id) => `<q>${esc(topicsById.get(id)?.name ?? id)}</q>`).join(", ") : `<span class="yes">${L("noGaps")}</span>`}</li>`);
  }
  out.push("</ul>");
  out.push("</section>");

  // ── queries
  if (queries?.length) {
    out.push('<section class="panel" id="queries" aria-labelledby="h-queries">');
    out.push(`<div class="panel-head"><h2 id="h-queries">${L("winners")}</h2><span class="sub">${L("queriesSub")}</span></div>`);
    out.push('<ul class="samples" style="margin:0 0 12px">');
    for (const p of pages) out.push(`<li>${short(p)}: ${querySummary(queries, p.n)}</li>`);
    out.push("</ul>");
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colQuery")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}<th>${L("colWinner")}</th></tr></thead><tbody>`);
    for (const q of queries) {
      const { winners, tie } = queryWinner(q);
      const cells = pages
        .map((p) => {
          const r = q.results[p.n];
          const best = r.passage === null ? "" : ` <a class="mono small" href="#${anchorFor(p.n)(r.passage)}">#${r.passage}</a>`;
          const cite = r.citable ? ` <span class="yes small">${L("citableMark")}</span>` : "";
          const quote = r.quote ? `<div class="quote small"><q>${esc(clip(r.quote, 140))}</q></div>` : "";
          return `<td><div class="cellmark"><span>${verdictPill(r)}${best}${cite}</span>${quote}</div></td>`;
        })
        .join("");
      const win = winners.length ? `<span class="win">${winners.map((n) => L("pageN", { n })).join(" · ")}</span>${tie ? ` <span class="small">(${L("tie")})</span>` : ""}` : `<span class="gap">${L("nobody")}</span>`;
      out.push(`<tr><td>${esc(q.query)}<div class="small">${L(q.source === "user" ? "srcUser" : "srcGenerated")}</div></td>${cells}<td>${win}</td></tr>`);
    }
    out.push("</tbody></table></div>");
    out.push("</section>");
  }

  // ── facts
  if (facts?.length) {
    out.push('<section class="panel" id="facts" aria-labelledby="h-facts">');
    out.push(`<div class="panel-head"><h2 id="h-facts">${L("factGaps")}</h2><span class="sub">${L("factGapsSub")}</span></div>`);
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colFact")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
    for (const f of facts) {
      const only = Object.keys(f.pages).length === 1 && pages.length > 1;
      const cells = pages
        .map((p) => {
          const where = f.pages[p.n];
          if (!where) return `<td class="gap">${L("notStated")}</td>`;
          return `<td><span class="yes">✓</span> ${where.map((i) => `<a class="mono small" href="#${anchorFor(p.n)(i)}">#${i}</a>`).join(" ")}${only ? `<span class="only">${L("onlyHere")}</span>` : ""}</td>`;
        })
        .join("");
      out.push(`<tr><td>${esc(f.fact)}${f.topic ? `<div class="small">${esc(topicsById.get(f.topic)?.name ?? f.topic)}</div>` : ""}</td>${cells}</tr>`);
    }
    out.push("</tbody></table></div>");
    out.push('<ul class="samples" style="margin-top:12px">');
    for (const p of pages) {
      out.push(`<li>${short(p)}: ${L("onlyHere")} <b>${factCmp.unique[p.n].length}</b> · ${L("notStated")} <b>${factCmp.lacking[p.n].length}</b></li>`);
    }
    out.push("</ul>");
    out.push("</section>");
  }

  out.push(...planPanel(plan, anchorFor, true));

  // ── robots by page, then findings by page
  out.push('<section class="panel" id="checks" aria-labelledby="h-crawlers">');
  out.push(`<div class="panel-head"><h2 id="h-crawlers">${L("crawlersByPage")}</h2></div>`);
  const bots = pages.find((p) => p.reading.robots?.bots?.length)?.reading.robots.bots ?? [];
  if (bots.length) {
    out.push('<div class="tablewrap"><table>');
    out.push(`<thead><tr><th>${L("colCrawler")}</th><th>${L("colPurpose")}</th>${pages.map((p) => `<th>${L("pageN", { n: p.n })}</th>`).join("")}</tr></thead><tbody>`);
    for (const bot of bots) {
      const cells = pages
        .map((p) => {
          const b = p.reading.robots?.bots?.find((x) => x.token === bot.token);
          if (!b) return '<td class="gap">—</td>';
          return `<td>${b.allowed ? `<span class="pill good">${L("allowed")}</span>` : `<span class="pill bad">${L("blocked")}</span>`}${b.rule ? `<div class="code small">${esc(b.rule)}</div>` : ""}</td>`;
        })
        .join("");
      out.push(`<tr><td class="code">${esc(bot.token)}<div class="small">${esc(bot.vendor)}</div></td><td>${L(KIND_KEY[bot.kind])}</td>${cells}</tr>`);
    }
    out.push("</tbody></table></div>");
  } else {
    out.push(`<p class="note">${L("robotsNotChecked")}</p>`);
  }
  out.push(`<h3 class="subhead">${L("findingsByPage")}</h3>`);
  for (const p of pages) {
    out.push(`<div class="pagesec"><h3>${short(p)}</h3>`);
    const shown = p.checks.filter((f) => f.code !== "robots_not_checked");
    if (shown.length) {
      out.push('<ol class="findings">');
      for (const f of shown) out.push(findingCard(f, anchorFor(p.n)));
      out.push("</ol>");
    } else out.push(`<p class="note">${L("noFindings")}</p>`);
    out.push("</div>");
  }
  out.push("</section>");

  // ── each page's reading, compact
  out.push('<section class="panel" aria-labelledby="h-each">');
  out.push(`<div class="panel-head"><h2 id="h-each">${L("readingByPage")}</h2></div>`);
  for (const p of pages) {
    const anchor = anchorFor(p.n);
    out.push(`<div class="pagesec"><h3>${short(p)}</h3>`);
    out.push(`<p class="small" style="margin:0 0 6px">${closingSentence(p.reading.page)}</p>`);
    out.push(...stripBlock(p.reading, p.lens, anchor, true));
    out.push('<div style="margin-top:12px"></div>');
    out.push(...groupCards(p.lens, topicsById));
    out.push(`<details><summary>${L("passagesTitle")}</summary><ol class="plist" style="margin-top:8px">`);
    for (const c of p.lens.chunks) {
      const colour = `--c:${GROUP_COLOURS[c.group] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
      const text = p.reading.passages[c.chunkIndex]?.text ?? c.preview;
      out.push(`<li class="passage" id="${anchor(c.chunkIndex)}" style="${colour}"><div class="phead"><span class="num">#${c.chunkIndex}</span>${c.heading ? `<span class="ph">${esc(oneLine(c.heading))}</span>` : ""}<span>${fmt(c.charCount)} ${L("chars")}</span></div><div class="full-text">${esc(text)}</div></li>`);
    }
    out.push("</ol></details>");
    out.push("</div>");
  }
  out.push("</section>");

  out.push('<section class="panel" aria-label="Closing">');
  out.push(`<p class="fine" style="margin:0">${L("fine")}</p>`);
  out.push("</section>");
  out.push(...footer());
  out.push(...documentEnd());
  return out.join("\n") + "\n";
}
