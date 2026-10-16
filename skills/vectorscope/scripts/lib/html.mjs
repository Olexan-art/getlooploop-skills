// The reading as one self-contained HTML page: inline CSS, a few lines of inline JS, no
// external fonts, scripts or images, so the file opens offline and can be published as is.
// Every string that came from the page is third-party content and goes through esc().

import { PREVIEW_CHARS } from "./lens.mjs";

const VECTORSCOPE_URL = "https://www.getlooploop.com/vectorscope";

// Categorical group colours, in a fixed order. Each one is at least 3:1 against the panel
// in both themes (dark #0a1424, light #ffffff). The skill allows at most 6 groups, so the
// palette is never cycled.
export const GROUP_COLOURS = ["#0e9ab8", "#8b5cf6", "#16a34a", "#e0458a", "#3d7ef0", "#7a8a14"];

const fmt = (n) => Number(n).toLocaleString("en-US");
const pct = (x) => `${Math.round(x * 1000) / 10}%`;
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
const ROLE_LABEL = { main: "main", related: "related", utility: "utility" };

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

const CHECK = '<svg class="ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = '<span class="arrow" aria-hidden="true">→</span>';

const CSS = `
:root{
  --bg:#060b14;--bg-2:#08101d;--panel:#0a1424;--panel-2:#0d1a2e;--line:#1b2b42;--line-2:#24395a;
  --text:#e6eef8;--muted:#8fa1b8;--faint:#5f728b;
  --accent:#22d3ee;--accent-ink:#04121a;--accent-soft:rgba(34,211,238,.12);--glow:0 0 0 1px rgba(34,211,238,.18),0 0 32px rgba(34,211,238,.10);
  --amber:#f5a524;--amber-soft:rgba(245,165,36,.14);
  --empty:#0f1d33;--shadow:0 1px 0 rgba(255,255,255,.03) inset;
  color-scheme:dark;
}
@media (prefers-color-scheme: light){
  :root:not([data-theme="dark"]){
    --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
    --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
    --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
    --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
    --empty:#eef3f8;--shadow:none;
    color-scheme:light;
  }
}
:root[data-theme="light"]{
  --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
  --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
  --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
  --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
  --empty:#eef3f8;--shadow:none;
  color-scheme:light;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;overflow-wrap:anywhere}
a{color:var(--accent)}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.mono,.eyebrow,.tag,.chip-n{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.wrap{max-width:1120px;margin:0 auto;padding:28px 16px 56px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
.eyebrow.muted{color:var(--muted);font-weight:500}
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
.tag.warn{border-color:var(--amber);color:var(--amber);background:var(--amber-soft)}
.tag.warn b{color:var(--amber)}
.note{margin:0;color:var(--muted);max-width:820px;font-size:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:22px;box-shadow:var(--glow)}
.panel-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.panel-head .sub{color:var(--muted);font-size:13px}
.pipeline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0;padding:0 0 16px;list-style:none;border-bottom:1px solid var(--line)}
.pipeline li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px}
.pipeline .step{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid var(--line);border-radius:10px;background:var(--panel-2)}
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
.readout{margin:12px 0 0;min-height:3.2em;padding:10px 12px;border-radius:10px;background:var(--panel-2);border:1px solid var(--line);font-size:13.5px;color:var(--muted)}
.readout b{color:var(--text)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;padding:0;list-style:none;font-size:13px;color:var(--muted)}
.legend li{display:flex;align-items:center;gap:6px}
.sw{width:10px;height:10px;border-radius:3px;background:var(--c);flex:none}
.groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.gcard{border:1px solid var(--line);border-top:3px solid var(--c);border-radius:12px;padding:14px 16px;background:var(--panel-2)}
.gcard .gid{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gcard h3{margin:4px 0 8px;font-size:16.5px;line-height:1.3}
.src{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:1px 7px;border:1px solid var(--line-2);color:var(--muted)}
.src.heading{color:var(--accent);border-color:var(--accent)}
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
.kw h3{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-2);border-radius:999px;padding:3px 10px;font-size:13.5px;background:var(--panel-2)}
.chip.scope{border-color:var(--accent);background:var(--accent-soft)}
.chip-n{font-size:11.5px;color:var(--muted)}
.closing{font-size:16px;font-weight:600;margin:0}
.closing.full{color:var(--amber)}
.fine{color:var(--muted);font-size:13px;margin:10px 0 0}
footer{margin-top:26px;color:var(--faint);font-size:12.5px}
@media (max-width:540px){.counters{grid-template-columns:1fr}}
@media (max-width:720px){
  .counter .n{font-size:24px}
  .pipeline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .pipeline .arrow{display:none}
  .pipeline .step{width:100%}
  .kw{grid-template-columns:1fr}
  .cell,.slot{height:36px}
  .frame{padding:4px;gap:2px}
  .tail{flex-basis:26%;padding:4px 6px;font-size:11px}
  .tail b{font-size:13px}
  .scale .out{flex-basis:26%}
  .panel{padding:16px}
}
@media (prefers-reduced-motion:reduce){.cell{transition:none}}
`;

// Theme: a #theme=light|dark (or ?theme=) in the URL wins, then the stored choice, then the system.
// Strip: hovering or focusing a cell writes its passage, heading and group into the readout.
const JS = `
(function(){
  var root=document.documentElement,KEY="vectorscope-theme";
  function param(){var m=/[?#&]theme=(light|dark)/.exec(location.search+location.hash);return m?m[1]:null}
  function stored(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function effective(){var t=root.getAttribute("data-theme");if(t)return t;try{return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){return "dark"}}
  function paint(){var t=effective();var b=document.querySelectorAll("[data-set-theme]");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-set-theme")===t))}
  var first=param()||stored();if(first==="light"||first==="dark")root.setAttribute("data-theme",first);
  document.addEventListener("DOMContentLoaded",function(){
    paint();
    var b=document.querySelectorAll("[data-set-theme]");
    for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var t=this.getAttribute("data-set-theme");root.setAttribute("data-theme",t);try{localStorage.setItem(KEY,t)}catch(e){}paint()});
    var out=document.getElementById("readout");if(!out)return;var idle=out.innerHTML;
    var cells=document.querySelectorAll(".cell");
    function show(c){out.innerHTML=c.getAttribute("data-tip")}
    for(var j=0;j<cells.length;j++){
      cells[j].addEventListener("mouseenter",function(){show(this)});
      cells[j].addEventListener("focus",function(){show(this)});
      cells[j].addEventListener("mouseleave",function(){if(document.activeElement!==this)out.innerHTML=idle});
      cells[j].addEventListener("blur",function(){out.innerHTML=idle});
    }
  });
})();
`;

/** Render the reading as a self-contained HTML document. */
export function renderHtml(reading, lens) {
  const { page } = reading;
  const cap = page.chunkCap;
  const groupCount = lens.groups.length;
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const capCut = page.capReached && page.charsUnread > 0;
  const colour = (id) => `--c:${GROUP_COLOURS[id] ?? GROUP_COLOURS[GROUP_COLOURS.length - 1]}`;
  const groupLabel = (id) => lens.groups[id]?.label ?? `Group ${id}`;

  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {}
  const title = oneLine(page.title || host || page.url);
  const href = safeHref(page.url);
  const out = [];

  out.push("<!doctype html>");
  out.push('<html lang="en">');
  out.push("<head>");
  out.push('<meta charset="utf-8">');
  out.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  out.push('<meta name="referrer" content="no-referrer">');
  // No network from this file: styles and the one script are inline, nothing else loads.
  out.push(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">`);
  out.push(`<title>Vectorscope reading: ${esc(title)}</title>`);
  out.push(`<style>${CSS}</style>`);
  out.push(`<script>${JS}</script>`);
  out.push("</head>");
  out.push("<body>");
  out.push('<main class="wrap">');

  // ── header
  out.push('<div class="top">');
  out.push('<span class="eyebrow">Vectorscope · local reading</span>');
  out.push('<div class="toggle" role="group" aria-label="Theme"><button type="button" data-set-theme="dark" aria-pressed="false">Dark</button><button type="button" data-set-theme="light" aria-pressed="false">Light</button></div>');
  out.push("</div>");
  out.push("<header>");
  out.push(`<h1>${esc(title)}</h1>`);
  out.push(
    href
      ? `<a class="url mono" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${esc(page.url)}</a>`
      : `<span class="url mono">${esc(page.url)}</span>`
  );
  if (page.url !== page.requestedUrl) out.push(`<p class="note">Asked for <span class="mono">${esc(page.requestedUrl)}</span>, redirected here.</p>`);
  out.push('<ul class="meta">');
  out.push(`<li class="tag"><b>${fmt(page.wordCount)}</b> words</li>`);
  out.push(`<li class="tag"><b>${fmt(page.headings)}</b> headings found</li>`);
  out.push(
    page.noindex
      ? '<li class="tag warn"><b>noindex</b>: the page asks search engines not to index it</li>'
      : "<li class=\"tag\">noindex <b>no</b></li>"
  );
  out.push("</ul>");
  out.push(
    `<p class="note">The groups are Claude's reading of the passages, not an embedding clustering. The fetch, extraction, chunking and the ${cap}-passage cap are the tool's exact rules. For the embedding-based reading with the map, run the page at <a href="${VECTORSCOPE_URL}" rel="noopener noreferrer" target="_blank">getlooploop.com/vectorscope</a>.</p>`
  );
  out.push("</header>");

  // ── pipeline + counters
  out.push('<section class="panel" aria-labelledby="h-result">');
  out.push('<div class="panel-head"><h2 id="h-result" class="eyebrow">Result</h2><span class="sub">what the machine reads</span></div>');
  out.push('<ol class="pipeline">');
  const steps = [
    ["Fetched", ""],
    ["Extracted", `${fmt(page.wordCount)} words`],
    ["Chunked", plural(page.chunksIndexed, "passage", "passages")],
    ["Grouped", plural(groupCount, "group", "groups")],
  ];
  steps.forEach(([name, detail], i) => {
    out.push(`<li>${i ? ARROW : ""}<span class="step">${CHECK}${name}${detail ? ` <small>${esc(detail)}</small>` : ""}</span></li>`);
  });
  out.push("</ol>");
  out.push(
    `<p class="pipeline-note">${fmt(page.headings)} headings · ${fmt(page.charsIndexed)} characters indexed · ${plural(lens.duplicates, "repeat", "repeats")} · grouped by reading, no embedding step</p>`
  );
  out.push('<div class="counters">');
  out.push(`<div class="counter"><div class="n">${fmt(page.chunksIndexed)}</div><div class="l">passages read</div></div>`);
  out.push(
    `<div class="counter${page.capReached ? " full" : ""}"><div class="n">${fmt(page.chunksIndexed)}<small>/${cap}</small></div><div class="l">slots used of the ${cap}-passage cap${page.capReached ? ": every slot filled" : ""}</div></div>`
  );
  out.push(
    `<div class="counter${capCut ? " full" : ""}"><div class="n">${fmt(page.charsUnread)}</div><div class="l">characters past the cap (0 when the page fits)</div></div>`
  );
  out.push("</div>");
  out.push("</section>");

  // ── reading strip
  out.push('<section class="panel" aria-labelledby="h-strip">');
  out.push(
    `<div class="panel-head"><h2 id="h-strip">The reading strip</h2><span class="sub">one cell per passage, in reading order, inside the ${cap}-slot cap</span></div>`
  );
  out.push('<div class="strip">');
  out.push(`<div class="frame${page.capReached ? " full" : ""}" role="list" aria-label="Passages inside the ${cap}-passage cap">`);
  for (const c of lens.chunks) {
    const heading = c.heading ? oneLine(c.heading) : "no heading";
    const role = c.contentRole !== "main" ? ` · ${ROLE_LABEL[c.contentRole]}` : "";
    const tip = `<b>#${c.chunkIndex}</b> · ${esc(heading)} · group ${c.group}: <b>${esc(groupLabel(c.group))}</b> · ${fmt(c.charCount)} chars${role}`;
    const aria = `Passage ${c.chunkIndex}, ${heading}, group ${c.group}: ${oneLine(groupLabel(c.group))}, ${c.charCount} characters${role}`;
    out.push(
      `<a role="listitem" class="cell${c.contentRole !== "main" ? " side" : ""}" style="${colour(c.group)}" href="#p-${c.chunkIndex}" data-tip="${esc(tip)}" aria-label="${esc(aria)}" title="${esc(aria)}"></a>`
    );
  }
  for (let i = lens.chunks.length; i < cap; i++) out.push('<span class="slot" aria-hidden="true"></span>');
  out.push("</div>");
  if (capCut) out.push(`<div class="tail" role="note"><b>${fmt(page.charsUnread)}</b>characters past the cap</div>`);
  out.push("</div>");
  out.push('<div class="scale mono" aria-hidden="true">');
  out.push(`<div class="in"><span>#0</span><span class="cap${page.capReached ? " full" : ""}">cap · ${cap} ▲</span></div>`);
  if (capCut) out.push('<div class="out">not read</div>');
  out.push("</div>");
  out.push(
    '<p class="readout" id="readout" aria-live="polite">Hover or focus a cell to see its passage, heading and group. Striped cells are side-path content. Select a cell to jump to the passage.</p>'
  );
  out.push('<ul class="legend">');
  for (const g of lens.groups) out.push(`<li><span class="sw" style="${colour(g.id)}"></span>${g.id} · ${esc(oneLine(g.label))}</li>`);
  out.push("</ul>");
  out.push("</section>");

  // ── groups
  out.push('<section class="panel" aria-labelledby="h-groups">');
  out.push(`<div class="panel-head"><h2 id="h-groups">The groups this page falls into</h2><span class="sub">${plural(groupCount, "group", "groups")}, by Claude's reading</span></div>`);
  out.push('<div class="groups">');
  for (const g of lens.groups) {
    const share = indexed ? g.charCount / indexed : 0;
    out.push(`<article class="gcard" style="${colour(g.id)}">`);
    out.push(`<div class="gid mono">Group ${g.id}</div>`);
    out.push(`<h3>${esc(oneLine(g.label))}</h3>`);
    out.push(
      `<span class="src ${esc(g.labelSource)}" title="${g.labelSource === "heading" ? "The page's own section heading" : "The group's two most distinctive words: a hint, not the section's name"}">${g.labelSource === "heading" ? "label: heading" : g.labelSource === "keywords" ? "label: keywords (a hint)" : "no label"}</span>`
    );
    out.push(`<div class="gstats"><span><b>${fmt(g.chunkCount)}</b> ${g.chunkCount === 1 ? "passage" : "passages"}</span><span><b>${fmt(g.charCount)}</b> chars</span><span><b>${pct(share)}</b> of the indexed text</span></div>`);
    out.push(`<div class="bar" role="img" aria-label="${pct(share)} of the indexed text"><span style="width:${(share * 100).toFixed(1)}%"></span></div>`);
    out.push("</article>");
  }
  out.push("</div>");
  out.push(
    '<p class="explain">A <b>heading</b> label is the page\'s own section heading and can be quoted. A <b>keywords</b> label is the group\'s two most distinctive words: a hint at what the group is about, not what the section is called.</p>'
  );
  out.push("</section>");

  // ── passages by group
  out.push('<section class="panel" aria-labelledby="h-passages">');
  out.push(`<div class="panel-head"><h2 id="h-passages">Passages, by group</h2><span class="sub">in reading order inside each group; each opens with its first ${PREVIEW_CHARS} characters</span></div>`);
  for (const g of lens.groups) {
    out.push(`<div class="pgroup" style="${colour(g.id)}">`);
    out.push(`<div class="pgroup-head"><span class="sw"></span><h3>${g.id} · ${esc(oneLine(g.label))}</h3><small>${plural(g.chunkCount, "passage", "passages")}</small></div>`);
    out.push('<ol class="plist">');
    for (const index of g.members) {
      const c = lens.chunks[index];
      const text = reading.passages[index]?.text ?? c.preview;
      out.push(`<li class="passage" id="p-${c.chunkIndex}">`);
      out.push('<div class="phead">');
      out.push(`<span class="num">#${c.chunkIndex}</span>`);
      if (c.heading) out.push(`<span class="ph">${esc(oneLine(c.heading))}</span>`);
      out.push(`<span>${fmt(c.charCount)} chars</span>`);
      out.push(`<span class="role ${esc(c.contentRole)}">${esc(ROLE_LABEL[c.contentRole] ?? c.contentRole)}</span>`);
      if (c.duplicateOf !== null) out.push(`<span class="role dup">repeats #${c.duplicateOf}</span>`);
      out.push("</div>");
      out.push(`<p class="opening">${esc(oneLine(c.preview))}${c.charCount > PREVIEW_CHARS ? "…" : ""}</p>`);
      if (c.charCount > PREVIEW_CHARS) {
        out.push(`<details><summary>Show the full passage</summary><div class="full-text">${esc(text)}</div></details>`);
      }
      out.push("</li>");
    }
    out.push("</ol>");
    out.push("</div>");
  }
  if (capCut) {
    out.push(
      `<p class="cut"><b>Outside cap: ${fmt(page.charsUnread)} characters</b> at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.</p>`
    );
  }
  out.push("</section>");

  // ── side-path content
  const side = lens.chunks.filter((c) => c.contentRole !== "main");
  out.push('<section class="panel" aria-labelledby="h-side">');
  out.push('<div class="panel-head"><h2 id="h-side">Side-path content</h2></div>');
  if (side.length) {
    out.push(`<p class="note">${plural(side.length, "passage looks", "passages look")} like related links or utility copy; they are still indexed.</p>`);
    out.push('<ul class="sides">');
    for (const c of side) {
      out.push(
        `<li><a href="#p-${c.chunkIndex}">#${c.chunkIndex}</a>${c.heading ? ` · ${esc(oneLine(c.heading))}` : ""} · ${c.contentRole === "related" ? "related link" : "utility copy"} (group ${c.group})</li>`
      );
    }
    out.push("</ul>");
  } else {
    out.push('<p class="note">No passage looks like related links or utility copy.</p>');
  }
  out.push("</section>");

  // ── keywords
  const scope = lens.keywords.filter((k) => k.scope);
  const section = lens.keywords.filter((k) => !k.scope);
  const chip = (k) =>
    `<li class="chip${k.scope ? " scope" : ""}" title="${esc(`${k.count} uses, in ${k.groups} of ${groupCount} groups`)}">${esc(k.term)} <span class="chip-n">×${fmt(k.count)} · ${k.groups}/${groupCount}</span></li>`;
  out.push('<section class="panel" aria-labelledby="h-kw">');
  out.push('<div class="panel-head"><h2 id="h-kw">The words and phrases this page keeps using</h2></div>');
  out.push(
    '<p class="note" style="margin-bottom:14px">Counted across the whole page, as single words and as the two-word phrases it writes often enough to be saying the phrase. A term reaching most groups describes the page; one confined to fewer is a section\'s own vocabulary. Group counts rest on the grouping above. Each chip shows uses and groups reached.</p>'
  );
  out.push('<div class="kw">');
  out.push(`<div><h3>Describes the page</h3>${scope.length ? `<ul class="chips">${scope.map(chip).join("")}</ul>` : '<p class="note">No term reaches enough of this page to describe it as a whole.</p>'}</div>`);
  out.push(`<div><h3>Belongs to one section</h3>${section.length ? `<ul class="chips">${section.map(chip).join("")}</ul>` : '<p class="note">None.</p>'}</div>`);
  out.push("</div>");
  out.push("</section>");

  // ── closing
  let closing;
  if (capCut) {
    closing = `A page contributes at most ${cap} passages, and this one filled every slot: ${fmt(page.charsUnread)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`;
  } else if (page.capReached) {
    closing = `A page contributes at most ${cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`;
  } else {
    closing = `A page contributes at most ${cap} passages; this one needed ${page.chunksIndexed}, so none of its extracted text fell past the cap.`;
  }
  out.push('<section class="panel" aria-label="Closing">');
  out.push(`<p class="closing${capCut ? " full" : ""}">${esc(closing)}</p>`);
  out.push(
    '<p class="fine">This is a preview of the machine\'s view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.</p>'
  );
  out.push("</section>");
  out.push(
    `<footer>Made with the vectorscope skill: the scripts fetched the page once and sent nothing anywhere; no embedding was computed. <a href="${VECTORSCOPE_URL}" rel="noopener noreferrer" target="_blank">GetLoopLoop Vectorscope</a></footer>`
  );
  out.push("</main>");
  out.push("</body>");
  out.push("</html>");
  return out.join("\n") + "\n";
}
