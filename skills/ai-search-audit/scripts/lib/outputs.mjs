// The Markdown summary (English) and the JSON export, both from the same model as the HTML.
// The export carries every finding with its evidence and its rule sources, so a fuller report
// (one with descriptions and fix directions) can be rendered from this data alone.

import { CANNOT, MARK, SEV, UI, dateOf, verdict, ZONE_LABEL } from "./copy.mjs";
import { CODES, SEVERITIES } from "./checks.mjs";
import { EXPORT_SCHEMA, PRODUCED_BY, SKILL_VERSION } from "./version.mjs";
import { FULL_VERSION_URL, refusalLead, TOOL_NAME } from "./report.mjs";
import { FINDINGS, REFUSAL_COPY } from "../../../vectorscope/scripts/lib/refusal.mjs";

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

function zoneName(z) {
  if (z.kind === "section" || z.kind === "js") return `${z.label || z.headings[0] || ZONE_LABEL.untitled()[0]}${z.kind === "js" ? " · JavaScript" : ""}`;
  return (ZONE_LABEL[z.kind] || ZONE_LABEL.untitled)(z)[0];
}

/** The Markdown summary. */
export function renderMarkdown(model) {
  const r = model.reading;
  const o = [];
  o.push(`# ${TOOL_NAME} Lite: ${r.fetch.finalUrl}`, "");
  o.push(`${r.facts.head.title ? `${cell(r.facts.head.title)} · ` : ""}checked ${dateOf(r.createdAt)[0]} · skill ${SKILL_VERSION}`, "");
  o.push(`**${verdict(model.findings)[0]}** · ${model.findings.length} problems (${SEVERITIES.map((s) => `${SEV[s][0].toLowerCase()} ${model.counts[s]}`).join(", ")})`, "");
  o.push("Lite lists problems, not fixes: labels, severities and places. Every check is deterministic; no model wrote any part of this.", "");
  o.push("## Status", "", "| Question | State | Problems |", "|---|---|---|");
  for (const t of model.tiles) o.push(`| ${t.q[0]} | ${({ ok: "OK", prob: "Problems", block: "Blocking", na: "One version" })[t.state]} | ${t.count} |`);
  o.push("", "## Biggest problems", "");
  if (!model.bigs.length) o.push("No problems found.");
  for (const f of model.bigs) o.push(`${f.pin}. **${SEV[f.severity][0]}** · ${f.label[0]}${f.where ? ` · \`${cell(f.where)}\`` : ""}`);
  o.push("", "## All problems", "", "| # | Severity | Problem | Where | Code |", "|---|---|---|---|---|");
  for (const f of model.findings) o.push(`| ${f.pin} | ${SEV[f.severity][0]} | ${cell(f.label[0])} | ${f.where ? `\`${cell(f.where)}\`` : "—"} | \`${f.code}\` |`);
  o.push("", "## Page map", "", "Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.", "");
  model.zones.forEach((z, i) => {
    const seen = z.hidden || z.kind === "aside" ? " · unseen" : z.seen !== null && z.seen !== undefined && z.seen < 0.9 && z.kind !== "header" && z.kind !== "nav" && z.kind !== "footer" ? ` · ${Math.round((1 - z.seen) * 100)}% unseen` : "";
    o.push(`${i + 1}. ${cell(zoneName(z))}${z.kind === "js" ? " (only with JavaScript)" : ""}${seen}${z.pins.length ? ` · problems ${z.pins.map((f) => f.pin).join(", ")}` : ""}`);
  });
  const strip = (title, rows) => {
    o.push("", `**${title}**`, "");
    for (const row of rows) o.push(`- ${Array.isArray(row.k) ? row.k[0] : row.k}: ${row.v[0]}${row.pins.length ? ` · problems ${row.pins.map((f) => f.pin).join(", ")}` : ""}`);
  };
  strip("`<head>`", model.head);
  strip("`robots.txt` · `llms.txt`", model.robots);
  o.push("", `## Google and Bing checks`, "", "| Check | State |", "|---|---|");
  for (const c of model.checklist) o.push(`| ${c.name[0]} | ${MARK[c.state].t[0]} |`);
  o.push("", `## Bots in robots.txt (path \`${cell(model.robotsPath)}\`)`, "");
  if (r.robots.status === "not_checked") o.push(UI.robotsNotChecked[0]);
  else {
    if (r.robots.status === "none") o.push(`${UI.robotsNone[0]}.`, "");
    if (r.robots.status === "unreachable") o.push(`${UI.robotsUnreachable[0]}.`, "");
    o.push("| Bot | Vendor | Purpose | Verdict | Rule |", "|---|---|---|---|---|");
    for (const b of model.bots) o.push(`| ${b.token} | ${b.vendor} | ${UI.kind[b.kind][0]} | ${b.allowed ? "allowed" : "blocked"} | ${b.rule ? `\`${cell(b.rule)}\`` : "—"} |`);
  }
  o.push("", "## Language versions", "");
  if (!model.languages) o.push(UI.langOne[0]);
  else {
    o.push(`x-default: ${model.languages.xDefault ? "yes" : "no"}`, "", "| Lang | Title | Description | hreflang | html lang |", "|---|---|---|---|---|");
    for (const row of model.languages.rows) o.push(`| ${cell(row.hreflang)}${row.self ? " (this page)" : ""}${row.refused ? " (not analysed)" : ""} | ${row.cells.map((s) => MARK[s].t[0]).join(" | ")} |`);
  }
  const w = model.waterfall;
  if (w) {
    o.push("", "## Where the text goes (characters)", "", "| Stage | Characters |", "|---|---|");
    [w.raw, w.removed, w.kept, w.inPassagesUnique, w.notInPassages, w.pastCap].forEach((v, i) => o.push(`| ${UI.wf[i][0]} | ${fmt(v)} |`));
    o.push("", `${model.passages.used} of ${model.passages.cap} passages.`);
  }
  if (model.caps.length) {
    o.push("", "## Not checked", "");
    for (const c of model.caps) o.push(`- ${c.t[0]}`);
  }
  o.push("", "## What this check cannot see", "");
  for (const c of CANNOT) o.push(`- ${c.t[0]}: ${c.links.map(([en, , href]) => `[${en}](${href})`).join(" · ")}`);
  o.push("", `A full version with explanations is available from GetLoopLoop: ${FULL_VERSION_URL}`, "");
  return o.join("\n");
}

/** The JSON export: getlooploop/ai-search-audit@1. */
export function buildExport(model) {
  const r = model.reading;
  return {
    schema: EXPORT_SCHEMA,
    skillVersion: SKILL_VERSION,
    producedBy: PRODUCED_BY,
    createdAt: r.createdAt,
    edition: "lite",
    page: { url: r.fetch.finalUrl, requestedUrl: r.fetch.requestedUrl, title: r.facts.head.title, saved: r.fetch.saved, redirects: r.fetch.chain },
    verdict: { en: verdict(model.findings)[0], uk: verdict(model.findings)[1] },
    counts: { total: model.findings.length, ...model.counts },
    tiles: model.tiles.map((t) => ({ id: t.id, question: { en: t.q[0], uk: t.q[1] }, state: t.state, problems: t.count })),
    findings: model.findings.map((f) => ({
      id: f.id,
      pin: f.pin,
      big: f.big,
      code: f.code,
      severity: f.severity,
      area: f.area,
      owner: f.owner,
      hidesText: f.hides,
      informational: f.informational,
      label: { en: f.label[0], uk: f.label[1] },
      where: f.where,
      map: { zones: f.zones, strip: f.strip },
      passages: f.passages,
      evidence: f.evidence,
      rules: f.rules,
    })),
    codes: Object.fromEntries(Object.entries(CODES).map(([k, v]) => [k, { severity: v.severity, area: v.area, owner: v.owner }])),
    checklist: model.checklist.map((c) => ({ id: c.id, name: { en: c.name[0], uk: c.name[1] }, state: c.state, codes: c.codes })),
    pageMap: {
      zones: model.zones.map((z) => ({ id: z.id, kind: z.kind, label: z.label, headings: z.headings, chars: z.chars, hidden: Boolean(z.hidden), panels: z.panels || 0, seenShare: z.seen ?? null, merged: z.merged || 0, problems: z.pins.map((f) => f.pin) })),
      head: model.head.map((row) => ({ id: row.id, value: { en: row.v[0], uk: row.v[1] }, problems: row.pins.map((f) => f.pin) })),
      robots: model.robots.map((row) => ({ id: row.id, value: { en: row.v[0], uk: row.v[1] }, problems: row.pins.map((f) => f.pin) })),
    },
    robots: { url: r.robots.url, status: r.robots.status, httpStatus: r.robots.httpStatus, path: model.robotsPath, sitemaps: r.robots.sitemaps, bots: r.robots.bots.map((b) => ({ token: b.token, vendor: b.vendor, kind: b.kind, allowed: b.allowed, rule: b.rule, group: b.group })) },
    sitemap: r.sitemap,
    llms: r.llms ? { url: r.llms.url, status: r.llms.status, present: r.llms.present, links: r.llms.links } : null,
    languages: model.languages,
    alternates: r.alternates ? { total: r.alternates.total, checked: r.alternates.checked, unchecked: r.alternates.unchecked, cap: r.alternates.cap, results: r.alternates.results.map((a) => (a.refused ? { hreflang: a.hreflang, href: a.href, refused: a.refused } : { hreflang: a.hreflang, href: a.href, ok: a.ok, status: a.status, finalUrl: a.finalUrl, redirected: a.redirected, title: a.title, lang: a.lang, noindex: a.noindex, reason: a.reason })) } : null,
    links: r.links ? { total: r.links.total, checked: r.links.checked, unchecked: r.links.unchecked, cap: r.links.cap, results: r.links.results } : null,
    structuredData: { jsonLd: r.facts.structured.jsonLd.map((b) => ({ index: b.index, ok: b.ok, error: b.error, types: b.types, top: b.top })), microdata: r.facts.structured.microdata, rdfa: r.facts.structured.rdfa },
    reading: { passages: model.passages.used, cap: model.passages.cap, waterfall: model.waterfall, render: r.render ? { ok: r.render.ok, wordCount: r.render.wordCount, passages: r.render.passages, jsOnlySections: r.render.jsZones?.length ?? 0, reason: r.render.reason } : null },
    notChecked: model.caps.map((c) => ({ id: c.id, count: c.n ?? null, cap: c.cap ?? null, en: c.t[0], uk: c.t[1] })),
    notMeasured: ["core_web_vitals", "google_index"],
    cannotSee: CANNOT.map((c) => ({ en: c.t[0], uk: c.t[1], links: c.links.map(([en, uk, href]) => ({ en, uk, href })) })),
  };
}

/** Markdown and JSON for a refused reading: the code, and for a page in Russian the reason. */
export function renderRefusalMarkdown(reading) {
  const url = reading.page?.url || reading.fetch?.finalUrl || reading.requestedInput || "";
  if (reading.reasonCode !== "refused_language_ru") return `# ${TOOL_NAME} Lite: ${url}\n\nThe page could not be audited: \`${reading.reasonCode}\`${reading.status ? ` (HTTP ${reading.status})` : ""}.\n`;
  const lines = [`# ${TOOL_NAME} Lite: ${url}`, "", `**${REFUSAL_COPY.title.en}.** ${refusalLead("en")}`, ""];
  for (const f of FINDINGS) {
    if (f.items) {
      lines.push(`- **${f.source.en}**`);
      for (const it of f.items) lines.push(`  - ${it.text.en} ${it.url}`);
    } else lines.push(`- **${f.source.en}**${f.joiner.en}${f.text.en} ${f.url}`);
  }
  lines.push("", `${REFUSAL_COPY.sanctions.en}`, "", REFUSAL_COPY.lastLine.en, "");
  return lines.join("\n");
}

export function buildRefusalExport(reading) {
  return {
    schema: EXPORT_SCHEMA,
    skillVersion: SKILL_VERSION,
    producedBy: PRODUCED_BY,
    createdAt: reading.createdAt,
    edition: "lite",
    refused: true,
    reasonCode: reading.reasonCode,
    status: reading.status ?? null,
    page: { url: reading.page?.url || reading.fetch?.finalUrl || null, requestedUrl: reading.page?.requestedUrl || reading.fetch?.requestedUrl || reading.requestedInput },
    ...(reading.language ? { language: reading.language } : {}),
  };
}
