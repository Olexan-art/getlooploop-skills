#!/usr/bin/env node
// WCAG 2.x contrast of the report's colour tokens, in both themes, read from the CSS the report
// ships. Text must reach 4.5:1 on every surface it sits on; graphics and the parts of controls
// (bars, markers, control borders, the focus ring) 3:1. A translucent ("-soft") background is
// composited over the surface it is drawn on before it is measured.
//
//   node tools/contrast.mjs          prints the table
//   tests/contrast.test.mjs          fails if any pair falls short

const hex = (h) => {
  const x = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
};
function rgb(value, under) {
  const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(String(value).replace(/\s/g, ""));
  if (!m) return hex(value);
  const a = Number(m[4]);
  const u = rgb(under);
  return [1, 2, 3].map((i, k) => Math.round(Number(m[i]) * a + u[k] * (1 - a)));
}
const lum = (c) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** The two token sets: the light default (`:root{…}`) and `:root[data-theme="dark"]{…}`. */
export function themes(css) {
  const block = (re) => {
    const m = re.exec(css);
    if (!m) throw new Error(`no token block ${re}`);
    return Object.fromEntries([...m[1].matchAll(/--([\w-]+):([^;]+);/g)].map((x) => [x[1], x[2].trim()]));
  };
  return { light: block(/:root\{([^}]*)\}/), dark: block(/:root\[data-theme="dark"\]\{([^}]*)\}/) };
}

const SURFACES = ["bg", "bg-2", "panel", "panel-2"];
const TEXT = ["text", "muted", "faint", "accent", "amber", "red", "green", "lm", "ld", "lj"];
const ON_SOFT = [["accent", "accent-soft"], ["amber", "amber-soft"], ["red", "red-soft"], ["green", "green-soft"], ["lm", "lm-soft"], ["ld", "ld-soft"], ["lj", "lj-soft"], ["text", "amber-soft"], ["text", "lj-soft"]];
const GRAPHICS = ["accent", "amber", "red", "green", "gone", "control"];

/** Every pair, measured: { theme, fg, bg, need, ratio, ok }. `extra` adds [fg, bg, need] pairs. */
export function measure(css, extra = []) {
  const out = [];
  for (const [theme, t] of Object.entries(themes(css))) {
    const has = (k) => t[k] !== undefined;
    const add = (fg, bg, need, under = null) => {
      if (!has(fg) || !has(bg) || (under && !has(under))) return;
      const base = under ? t[under] : t[bg];
      const back = rgb(t[bg], under ? t[under] : "#ffffff");
      const r = ratio(rgb(t[fg], base), back);
      out.push({ theme, fg, bg: under ? `${bg} on ${under}` : bg, need, ratio: Math.round(r * 100) / 100, ok: r >= need });
    };
    for (const bg of SURFACES) for (const fg of TEXT) add(fg, bg, 4.5);
    for (const [fg, soft] of ON_SOFT) for (const under of ["panel", "panel-2"]) add(fg, soft, 4.5, under);
    for (const fg of GRAPHICS) for (const bg of ["panel", "panel-2", "empty"]) add(fg, bg, 3);
    add("accent-ink", "accent", 4.5);
    for (const [fg, bg, need] of extra) add(fg, bg, need);
  }
  return out;
}

if (/[\\/]tools[\\/]contrast\.mjs$/.test(process.argv[1] || "")) {
  const { REPORT_CSS } = await import("../scripts/lib/html.mjs");
  const rows = measure(REPORT_CSS);
  for (const r of rows) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.theme.padEnd(5)} ${r.fg.padEnd(11)} on ${r.bg.padEnd(22)} ${r.ratio.toFixed(2).padStart(5)}:1 (needs ${r.need})`);
  console.log(`${rows.filter((r) => r.ok).length} of ${rows.length} pass`);
}
