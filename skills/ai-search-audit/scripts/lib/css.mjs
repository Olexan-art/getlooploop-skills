// The report's stylesheet: the approved Lite design (dark and light tokens, the page map, the charts,
// the grids), inline because the report loads nothing. The two decorations come from the Vectorscope
// skill's sprites, so the ornaments are the same bytes.
import { CORNER, ORNAMENT } from "../../../vectorscope/scripts/lib/sprites.mjs";

export const CSS = `
:root{
  --bg:#060b14;--bg-2:#08101d;--panel:#0a1424;--panel-2:#0d1a2e;--line:#1b2b42;--line-2:#24395a;
  --text:#e6eef8;--muted:#8fa1b8;--faint:#5f728b;
  --accent:#22d3ee;--accent-ink:#04121a;--accent-soft:rgba(34,211,238,.12);--glow:0 0 0 1px rgba(34,211,238,.18),0 0 32px rgba(34,211,238,.10);
  --amber:#f5a524;--amber-soft:rgba(245,165,36,.14);
  --red:#f87171;--red-soft:rgba(248,113,113,.13);--red-ink:#1a0606;--green:#34d399;--green-soft:rgba(52,211,153,.12);
  --empty:#0f1d33;
  --lm:#22d3ee;--lm-soft:rgba(34,211,238,.10);--ld:#a78bfa;--ld-soft:rgba(167,139,250,.12);--lj:#f472b6;--lj-soft:rgba(244,114,182,.12);--gone:#4a5d78;
  --pop:0 10px 30px rgba(0,0,0,.35);
  --deco:.15;--deco-filter:brightness(2.6) saturate(.55);--deco-mark:.42;
  color-scheme:dark;
}
@media (prefers-color-scheme: light){
  :root:not([data-theme="dark"]){
    --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
    --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
    --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
    --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
    --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--red-ink:#ffffff;--green:#047857;--green-soft:rgba(4,120,87,.09);
    --empty:#eef3f8;
    --lm:#0e7490;--lm-soft:rgba(14,116,144,.08);--ld:#6d28d9;--ld-soft:rgba(109,40,217,.07);--lj:#be185d;--lj-soft:rgba(190,24,93,.07);--gone:#a3b1c2;
    --pop:0 10px 30px rgba(11,22,38,.14);
    --deco:.2;--deco-filter:none;--deco-mark:.5;
    color-scheme:light;
  }}
:root[data-theme="light"]{
  --bg:#f3f6fa;--bg-2:#eaf0f6;--panel:#ffffff;--panel-2:#f6f9fc;--line:#d6dfea;--line-2:#c3d0df;
  --text:#0b1626;--muted:#4b5c72;--faint:#74859a;
  --accent:#0e7490;--accent-ink:#ffffff;--accent-soft:rgba(14,116,144,.09);--glow:0 0 0 1px rgba(14,116,144,.10),0 6px 24px rgba(11,22,38,.06);
  --amber:#b45309;--amber-soft:rgba(180,83,9,.10);
  --red:#b91c1c;--red-soft:rgba(185,28,28,.08);--red-ink:#ffffff;--green:#047857;--green-soft:rgba(4,120,87,.09);
  --empty:#eef3f8;
  --lm:#0e7490;--lm-soft:rgba(14,116,144,.08);--ld:#6d28d9;--ld-soft:rgba(109,40,217,.07);--lj:#be185d;--lj-soft:rgba(190,24,93,.07);--gone:#a3b1c2;
  --pop:0 10px 30px rgba(11,22,38,.14);
  --deco:.2;--deco-filter:none;--deco-mark:.5;
  color-scheme:light;
}
.l-uk{display:none}
:root[data-lang="uk"] .l-en{display:none}
:root[data-lang="uk"] .l-uk{display:inline}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;overflow-wrap:anywhere}
a{color:var(--accent)}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.mono,.eyebrow,.tag,.code,.mod,.lyr{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.wrap{max-width:1120px;margin:0 auto;padding-block:20px 32px;padding-left:max(16px, env(safe-area-inset-left, 0px));padding-right:max(16px, env(safe-area-inset-right, 0px));position:relative;color:var(--text)}
.corner{position:absolute;width:132px;height:134px;background:url("${CORNER}") center/contain no-repeat;opacity:var(--deco);filter:var(--deco-filter);pointer-events:none}
.corner--br{right:0;bottom:0}
.corner--tl{left:0;top:0;transform:rotate(180deg)}
@media (max-width:640px){.corner{display:none}}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.toggles{display:flex;gap:8px;flex-wrap:wrap}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}
.toggle{display:inline-flex;border:1px solid var(--line);border-radius:10px;padding:3px;background:var(--panel)}
.toggle button{font:inherit;font-size:13px;color:var(--muted);background:none;border:0;border-radius:7px;padding:4px 12px;cursor:pointer}
.toggle button[aria-pressed="true"]{background:var(--panel-2);color:var(--text);box-shadow:0 0 0 1px var(--line-2)}
h1{font-size:clamp(26px,4.2vw,42px);line-height:1.08;letter-spacing:-.02em;margin:8px 0 8px;font-weight:800}
h2{font-size:20px;margin:0;letter-spacing:-.01em}
h3{font-size:16px;margin:0}
.url{display:inline-block;font-size:14px;margin-bottom:12px;word-break:break-all}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:22px;box-shadow:var(--glow);min-width:0}
.panel-head{display:flex;align-items:baseline;gap:6px 12px;flex-wrap:wrap;margin-bottom:14px}
.panel-head .sub{color:var(--muted);font-size:13px;margin-left:auto}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--panel-2);margin-top:14px}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:0}
/* counters, waterfall */
.counters{display:grid;grid-template-columns:repeat(auto-fit,minmax(176px,1fr));gap:12px;margin-top:4px}
.wf{display:block;width:100%;overflow:visible}
.wf .lab{fill:var(--text);font-size:13px;font-weight:600}
.wf .val{fill:var(--text);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
.wf .track{fill:var(--empty)}
.wf .b-raw{fill:var(--line-2)}
.wf .b-kept{fill:var(--accent)}
.wf .b-gone{fill:var(--gone)}
.wf .b-cap{fill:var(--amber)}
.wf .guide{stroke:var(--line-2);stroke-width:1;stroke-dasharray:3 3}
/* footer */
.deco{height:26px;margin:6px 0 2px;background:url("${ORNAMENT}") center/contain no-repeat;opacity:var(--deco);filter:var(--deco-filter);pointer-events:none}
.deco--foot{margin:30px 0 -14px}
.motanka{width:30px;height:auto;opacity:var(--deco-mark);filter:var(--deco-filter);flex:none}
.foot-made{display:flex;align-items:center;gap:12px;max-width:600px}
.foot{margin-top:28px;border-top:1px solid var(--line);padding:18px 0 4px;color:var(--faint);font-size:12.5px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;align-items:center}
.foot p{margin:0;max-width:560px}
.links{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.links a{display:inline-flex;align-items:center;gap:7px;color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px 5px 9px;background:var(--panel);font-size:13px}
.links a:hover{color:var(--text);border-color:var(--line-2)}
.links svg{width:15px;height:15px;flex:none}
@media (max-width:720px){
  .panel{padding:16px}
  .panel-head .sub{margin-left:0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;scroll-behavior:auto!important}}

input[type="checkbox"]:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pageid{display:flex;flex-wrap:wrap;gap:2px 12px;align-items:baseline;margin:4px 0 6px;font-size:13px;color:var(--muted)}
.pageid .url{font-size:12.5px;margin:0}
.pageid .pt{color:var(--muted)}
.verdict h1{font-size:clamp(23px,3.1vw,34px);line-height:1.2;letter-spacing:-.015em;margin:2px 0 8px;max-width:980px;font-weight:800}
.tiles{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tile{border:1px solid var(--line);border-top:4px solid var(--st);border-radius:12px;padding:11px 13px 12px;background:var(--panel);min-width:0;display:flex;flex-direction:column;gap:7px}
.tile.ok{--st:var(--green);--sts:var(--green-soft)}
.tile.prob{--st:var(--amber);--sts:var(--amber-soft)}
.tile.block{--st:var(--red);--sts:var(--red-soft)}
.tile h2{font-size:14.5px;line-height:1.3;letter-spacing:0}
.state{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-weight:800;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--st);background:var(--sts);border:1px solid var(--st);border-radius:999px;padding:1px 10px 1px 5px}
.state svg{width:16px;height:16px;flex:none}
.tile p{margin:0;font-size:13px;line-height:1.45;color:var(--text)}
.tile .tc{margin-top:auto;font-size:12px;color:var(--muted)}
.mk{--mc:var(--muted);--ms:transparent;display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mc);white-space:nowrap;align-self:start;padding-top:1px}
.mk i{font-style:normal;display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--mc);background:var(--ms);font-size:12px;line-height:1;letter-spacing:0;flex:none}
.mk.pass{--mc:var(--green);--ms:var(--green-soft)}
.mk.fail{--mc:var(--red);--ms:var(--red-soft)}
.mk.warn{--mc:var(--amber);--ms:var(--amber-soft)}
.mk.na{--mc:var(--muted)}
.mk.na i{border-style:dashed}
@media (max-width:820px){.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){
  .tiles{grid-template-columns:1fr;gap:8px}
  .tile{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;padding:10px 12px}
  .tile h2{grid-column:1}.tile .state{grid-column:2;grid-row:1}
  .tile p,.tile .tc{grid-column:1/-1}}

/* one severity palette, matching the map markers: blocking red · high amber filled · medium amber outline · low blue */
.pill.sev-high{color:var(--amber-ink);border-color:var(--amber);background:var(--amber)}
:root{--amber-ink:#1a1200;--pin-low:#7dd3fc;--hatch:rgba(143,161,184,.42)}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--amber-ink:#ffffff;--pin-low:#0369a1;--hatch:rgba(75,92,114,.38)}}
:root[data-theme="light"]{--amber-ink:#ffffff;--pin-low:#0369a1;--hatch:rgba(75,92,114,.38)}
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.top-l{display:flex;align-items:center;flex-wrap:wrap;gap:6px 14px;min-width:0}
.hit{box-shadow:0 0 0 2px var(--accent)!important;transition:box-shadow .2s}
/* page map */
.pmap{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px;align-items:start}
.pm-pagecol{min-width:0;display:flex;justify-content:center}
.pm-svg{display:block;width:100%;height:auto;overflow:visible}
.pm-page{max-width:600px}
.pm-side{display:grid;gap:14px;min-width:0;justify-items:center}
.pm-side .pm-svg{max-width:440px}
.pm-svg .z{fill:var(--panel-2);stroke:var(--line-2);stroke-width:1}
.pm-svg .z.js{fill:var(--bg-2);stroke:var(--muted);stroke-width:1.5;stroke-dasharray:7 5}
.pm-svg .zl{fill:var(--muted);font:600 13.5px ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}
.pm-svg .zl.mono,.pm-svg .zk,.pm-svg .zv{font-family:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace}
.pm-svg .zk{fill:var(--text);font-size:12.5px;font-weight:600}
.pm-svg .zv{fill:var(--muted);font-size:11.5px}
.pm-svg .ht{fill:var(--text);font:700 12px ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}
.pm-svg .halo{paint-order:stroke;stroke:var(--panel-2);stroke-width:5px;stroke-linejoin:round}
.pm-svg .ln{fill:var(--line-2)}
.pm-svg .ln.strong{fill:var(--muted);opacity:.6}
.pm-svg .ln.faint{fill:var(--line-2);opacity:.7}
.pm-svg .hid{fill:url(#pm-hatch);stroke:var(--muted);stroke-width:1.2;stroke-dasharray:4 3}
.pm-svg .hb,.pm-hatch-bg{fill:var(--bg-2)}
.pm-svg .hl{stroke:var(--hatch);stroke-width:2.2}
.pm-svg .sep{stroke:var(--line);stroke-width:1}
.pm-svg .okm circle{fill:var(--green-soft);stroke:var(--green);stroke-width:1.5}
.pm-svg .okm path{fill:none;stroke:var(--green);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.pin text{font:800 14px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.pin.blocking .sh{fill:var(--red)}.pin.blocking text{fill:var(--red-ink)}
.pin.high .sh{fill:var(--amber)}.pin.high text{fill:var(--amber-ink)}
.pin.medium .sh{fill:var(--panel);stroke:var(--amber);stroke-width:2.6}.pin.medium text{fill:var(--amber)}
.pin.low .sh{fill:var(--panel);stroke:var(--pin-low);stroke-width:1.6}.pin.low text{fill:var(--pin-low);font-size:13px}
.pin .ring{fill:none;stroke:var(--accent);stroke-width:3;opacity:0}
.pm-a{cursor:pointer}
.pm-a:focus{outline:none}
.pm-a:hover .ring,.pm-a:focus-visible .ring{opacity:1}
.pi{flex:none;display:inline-block;vertical-align:middle;overflow:visible}
.pm-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:14px 0 0;padding:0;list-style:none;font-size:13px;color:var(--muted);align-items:center}
.pm-legend li{display:inline-flex;align-items:center;gap:6px}
.pm-legend .pm-un a{color:var(--text);font-weight:600}
.sw-hatch,.sw-js{width:22px;height:14px;border-radius:3px;flex:none;display:inline-block}
.sw-hatch{border:1.2px dashed var(--muted);background:repeating-linear-gradient(45deg,var(--hatch) 0 2px,var(--bg-2) 2px 6px)}
.sw-js{border:1.5px dashed var(--muted);background:var(--bg-2)}
.pm-key{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px 10px}
.pm-key li{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:4px 10px 4px 6px;background:var(--panel-2);font-size:13.5px;font-weight:600;min-width:0;scroll-margin-top:12px}
.pk-l{min-width:0;flex:1}
.own{display:inline-flex;align-items:center;flex:none;color:var(--accent)}
.own svg{width:15px;height:15px}
/* lite */
.lite-verdict h1{font-size:clamp(26px,4vw,40px);line-height:1.12;letter-spacing:-.02em;margin:2px 0 6px;font-weight:800}
.lite-meta{margin:0;font-size:13.5px;color:var(--muted);display:flex;flex-wrap:wrap;gap:2px 8px}
.tiles-lite .tile{gap:8px}
.tiles-lite .tile h2{font-size:15px}
.bchips{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.bchip{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);border-top:4px solid var(--sev);border-radius:12px;padding:10px 12px;background:var(--panel-2);min-width:0;scroll-margin-top:12px}
.bchip.blocking{--sev:var(--red)}.bchip.high,.bchip.medium{--sev:var(--amber)}.bchip.low{--sev:var(--pin-low)}
.sevw{font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--sc)}
.sevw.blocking{--sc:var(--red)}.sevw.high,.sevw.medium{--sc:var(--amber)}.sevw.low{--sc:var(--pin-low)}
.fav{vertical-align:-3px;border-radius:3px;flex:none}
.bchip .bc-t{display:flex;gap:9px;align-items:center;font-weight:800;font-size:15px;line-height:1.25}
.bchip .bc-m{display:flex;gap:8px;align-items:center;justify-content:space-between}
.lcharts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}
.lcharts .panel{margin-top:16px}
.lcharts .wide{grid-column:1/-1}
.unit{font-size:12px;color:var(--muted);font-weight:500}
.sbars{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.sbars li{display:grid;grid-template-columns:118px minmax(0,1fr) 44px;gap:10px;align-items:center;font-size:13.5px}
.sbars .sl{display:inline-flex;align-items:center;gap:7px;font-weight:600;white-space:nowrap}
.sbars .st{height:14px;border-radius:4px;background:var(--empty);position:relative;overflow:hidden}
.sbars .sb{position:absolute;inset:0 auto 0 0;border-radius:4px;background:var(--c)}
.sbars .sb.medium{opacity:.55}
.sbars .sn{font-weight:800;font-variant-numeric:tabular-nums;text-align:right}
.bots{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.bots li{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:2px 8px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:7px 10px;background:var(--panel-2);min-width:0}
.bots li.no{border-color:var(--red);background:var(--red-soft)}
.bots .fav{width:16px;height:16px;border-radius:3px}
.bots .bn{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;font-weight:700;min-width:0}
.bots .bp{grid-column:2/-1;font-size:11.5px;color:var(--muted)}
.bots .mk{padding:0}
.cg{list-style:none;margin:0;padding:0 0 34px;display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:6px;position:relative}
.cg li{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line);border-radius:9px;padding:7px 3px 5px;background:var(--panel-2);cursor:default;min-width:0}
.cg li.fail{border-color:var(--red)}.cg li.warn{border-color:var(--amber)}
.cg li:focus{outline:none}
.cg li:focus-visible,.cg li:hover{box-shadow:0 0 0 2px var(--accent)}
.cg .mk i{width:22px;height:22px;font-size:12.5px}
.cg .cs{font-size:10.5px;line-height:1.2;color:var(--muted);text-align:center;max-width:100%;overflow-wrap:anywhere}
.cg .tip{display:none;position:absolute;left:0;right:0;bottom:0;font-size:12.5px;color:var(--text);background:var(--panel);border:1px solid var(--line-2);border-radius:8px;padding:4px 10px;pointer-events:none}
.cg li:hover .tip,.cg li:focus .tip{display:block}
.cg-sum{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 0 10px;padding:0;list-style:none;font-size:13px}
.cg-sum li{display:inline-flex;align-items:center;gap:6px}
.lgrid{width:100%;border-collapse:collapse;font-size:13px}
.lgrid th,.lgrid td{text-align:center;padding:7px 6px;border-bottom:1px solid var(--line)}
.lgrid th{font-size:11px}
.lgrid th:first-child,.lgrid td:first-child{text-align:left;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-weight:700}
.lgrid .mk{justify-content:center;padding:0}
.lgrid tr:last-child td{border-bottom:0}
.mkey{display:flex;flex-wrap:wrap;gap:4px 14px;margin:10px 0 0;padding:0;list-style:none;font-size:12px;color:var(--muted)}
.mkey li{display:inline-flex;align-items:center;gap:5px}
.mkey .mk i{width:16px;height:16px;font-size:10px}
.cannot-lite{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.cannot-lite li{display:flex;gap:10px;align-items:center;font-size:13.5px;border:1px solid var(--line);border-radius:10px;padding:7px 12px;background:var(--panel-2);flex-wrap:wrap}
.cannot-lite svg{width:18px;height:18px;color:var(--muted);flex:none}
.cannot-lite .cl-t{flex:1;min-width:180px}
.cannot-lite a{font-size:12.5px;white-space:nowrap}
.fulllink{margin:22px 0 0;font-size:17px;font-weight:800}
.fulllink a{text-decoration:none;border-bottom:2px solid var(--accent)}
@media (max-width:860px){.pmap{grid-template-columns:1fr}.pm-side{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}}
@media (max-width:720px){.lcharts{grid-template-columns:1fr}.sbars li{grid-template-columns:104px minmax(0,1fr) 34px}}
@media (max-width:640px){.tiles-lite .tile{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px}.tiles-lite .tile .tc{grid-column:1/-1}.bchips{grid-template-columns:1fr}}
`;

/** States and blocks the real reports need beyond the prototype: a tile with one language version, "not on this page" cells, cap notes, the refusal. */
export const CSS_EXTRA = `
.pm-svg .zn{fill:var(--text);font:700 12px ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}
.tile.na{--st:var(--muted);--sts:transparent}
.tile.na .state{border-style:dashed}
.mk.none{--mc:var(--faint)}
.mk.none i{border-style:dotted}
.cg li.na,.cg li.none{border-style:dashed}
.capnote{margin:10px 0 0;font-size:12.5px;color:var(--muted)}
.capnote.bad{color:var(--red);font-weight:600}
.caps{margin:10px 0 0;padding:0 0 0 16px;font-size:12.5px;color:var(--muted);display:grid;gap:2px}
.none-found{margin:0;font-size:14.5px;color:var(--muted)}
.lgrid .self{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:500;font-size:11px;color:var(--muted);margin-left:4px}
.bchip .bc-t>span:last-child{overflow-wrap:break-word;min-width:0}
.refusal{margin-top:18px;border:1.5px solid var(--red);border-left-width:4px;background:var(--panel);border-radius:14px;padding:18px 20px;box-shadow:var(--glow)}
.refusal-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.refusal-head svg{width:30px;height:30px;color:var(--red);flex:none}
.refusal-head h2{font-size:clamp(20px,3.4vw,26px);color:var(--text);margin:0}
.refusal .lead{margin:0 0 14px;font-size:15.5px;max-width:860px}
.refusal ul{margin:0;padding-left:20px;max-width:860px}
.refusal>div>ul>li{margin:0 0 12px}
.refusal li ul{margin-top:6px}
.refusal li li{margin:0 0 6px}
.refusal p,.refusal li{font-size:14.5px;line-height:1.55;overflow-wrap:anywhere}
.refusal b{font-weight:700;color:var(--text)}
.refusal .src-link{white-space:nowrap;margin-left:4px;font-size:13px}
.refusal .sanctions{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--line);max-width:860px}
.refusal .last{margin:12px 0 0;color:var(--muted)}
.lb-uk{display:none}
:root[data-lang="uk"] .lb-en{display:none}
:root[data-lang="uk"] .lb-uk{display:block}
@media (max-width:480px){.refusal{padding:14px 14px}.refusal ul{padding-left:16px}}
`;
