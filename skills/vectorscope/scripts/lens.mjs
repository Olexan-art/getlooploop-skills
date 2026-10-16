#!/usr/bin/env node
// Step 3 of the Vectorscope skill: labels, counts, shares, keywords, side-path content and the
// automatic checks over the grouping the agent wrote in step 2, plus the judgement layers
// (plan, query test, facts) and the outputs.
//
// Single page:
//   node scripts/lens.mjs reading.json groups.json [--plan plan.json] [--queries queries.json]
//        [--facts facts.json] [--topics topics.json]
//        [--baseline old-reading.json [--baseline-groups old-groups.json]]
//        [--json out.json] [--md out.md] [--html out.html]
// Compare (2–5 pages read with read.mjs into one directory):
//   node scripts/lens.mjs --compare readings/manifest.json [--json out.json] [--md out.md] [--html out.html]
//   reads groups-<n>.json for every page, topics.json, and (optional) facts.json, queries.json,
//   plan.json from the manifest's directory.
//
// groups.json: {"groups": [[0,1,2],[3,4]], "duplicates": {"7": 2}} (v1) or
//              {"groups": [{"members": [0,1,2], "label": "…", "note": "…"}], "duplicates": {}} (v2).
// Every input is validated; a problem prints REFUSED with what to fix and exits 1.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PREVIEW_CHARS } from "./lib/lens.mjs";
import { buildVectorscopeExport, vectorscopeExportName } from "./lib/export.mjs";
import { renderHtml, renderCompareHtml, renderRefusalHtml } from "./lib/html.mjs";
import { FINDINGS, REFUSAL_CODE, REFUSAL_COPY, SANCTIONS_LINKS } from "./lib/refusal.mjs";
import { buildJudgedLens, compareFacts, compareTopics, diffReadings, displayLabel, pageChecks } from "./lib/analysis.mjs";
import { queryWinner, validateFacts, validateGrouping, validatePlan, validateQueries, validateTopics } from "./lib/judgement.mjs";
import { checkCopy } from "./lib/i18n.mjs";

// Kept for v1 callers that imported these from here.
export { validateGrouping, buildJudgedLens };

export const COMPARE_SCHEMA = "getlooploop/vectorscope-compare@1";
export const REFUSAL_SCHEMA = "getlooploop/vectorscope-refusal@1";
/** Versions count in thousandths (2.101, 2.102, …) so the first number moves only on a real break. Mirrors package.json. */
export const SKILL_VERSION = "2.101";

const USAGE = [
  "Usage: node scripts/lens.mjs reading.json groups.json [--plan plan.json] [--queries queries.json] [--facts facts.json]",
  "         [--topics topics.json] [--baseline old-reading.json [--baseline-groups old-groups.json]] [--json out.json] [--md out.md] [--html out.html]",
  "       node scripts/lens.mjs --compare readings/manifest.json [--json out.json] [--md out.md] [--html out.html]",
].join("\n");

function fail(message) {
  console.error(`REFUSED  ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { files: [] };
  const flags = ["json", "md", "html", "plan", "queries", "facts", "topics", "baseline", "baseline-groups", "compare"];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && flags.includes(arg.slice(2))) out[arg.slice(2)] = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else out.files.push(arg);
  }
  return out;
}

function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${what} (${path}) could not be read as JSON: ${error.message}`);
  }
}

function attempt(what, fn) {
  try {
    return fn();
  } catch (error) {
    fail(`${what}: ${error.message}`);
  }
}

// ── markdown ─────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n).toLocaleString("en-US");
const cell = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
const pct = (x) => `${Math.round(x * 1000) / 10}%`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const ROLE_LABEL = { related: "related link", utility: "utility copy" };
const KIND = { search: "assistant search index", user: "fetches when a user asks", training: "training data", index: "web search index" };

/** Plain-text evidence for the copy functions. */
function plainEvidence(evidence) {
  const out = {};
  for (const [key, value] of Object.entries(evidence || {})) {
    out[key] = Array.isArray(value) && value.every((x) => typeof x === "string") ? value.join(", ") : value;
  }
  if (Array.isArray(evidence?.samples)) out.n = evidence.samples.length;
  return out;
}

function blockedBanner(robots, prefix = "") {
  if (!robots) return [];
  if (robots.status === "unreachable") {
    return [`> **${prefix}AI crawlers are blocked from this page.** robots.txt could not be read; under RFC 9309 a crawler then assumes it may fetch nothing.`, ""];
  }
  const blocked = (robots.bots || []).filter((b) => !b.allowed && b.kind !== "training");
  if (!blocked.length) return [];
  return [
    `> **${prefix}AI crawlers are blocked from this page:** robots.txt disallows it for ${blocked.map((b) => b.token).join(", ")}. Those assistants cannot fetch it, so the rest of this report is moot for them until the rule changes.`,
    "",
  ];
}

function robotsMarkdown(robots) {
  const out = [];
  if (!robots || robots.status === "not_checked") {
    out.push("robots.txt was not checked in this run.", "");
    return out;
  }
  if (robots.status === "unreachable") out.push(`robots.txt at ${robots.url} did not answer${robots.httpStatus ? ` (HTTP ${robots.httpStatus})` : ""}: compliant crawlers treat the site as blocked.`, "");
  if (robots.status === "none") out.push(`No robots.txt (HTTP ${robots.httpStatus}): nothing is disallowed.`, "");
  out.push("| Crawler | Vendor | What it does | This page | Deciding rule |");
  out.push("|---|---|---|---|---|");
  for (const b of robots.bots) {
    out.push(`| ${b.token} | ${b.vendor} | ${KIND[b.kind]}${b.honours === false ? " (vendor: robots.txt may not apply)" : ""} | ${b.allowed ? "allowed" : "**blocked**"} | ${b.rule ? `\`${cell(b.rule)}\`${b.group === "*" ? " (via *)" : ""}` : "no rule matches"} |`);
  }
  out.push("");
  return out;
}

function technicalMarkdown(technical, render, page) {
  if (!technical) return [];
  const t = technical;
  const out = [];
  out.push(`- **JSON-LD:** ${t.jsonLd.types.length ? t.jsonLd.types.join(", ") : "none"}${t.jsonLd.invalid ? ` (${t.jsonLd.invalid} block(s) not valid JSON)` : ""}`);
  out.push(`- **Canonical:** ${t.canonical.present ? `${cell(t.canonical.href)} (${t.canonical.self ? "this page" : "another URL"}${t.canonical.absolute ? "" : ", relative"})` : "missing"}`);
  out.push(`- **Meta description:** ${t.metaDescription.present ? `${t.metaDescription.length} characters` : "missing"}`);
  if (render) {
    out.push(
      `- **With JavaScript:** ${render.ok ? `${fmt(render.wordCount)} words, ${render.passages} passages (plain fetch: ${fmt(page.wordCount)} words, ${page.chunksIndexed} passages)` : render.reason === "no_browser" ? "not rendered, no local Chrome or Chromium found" : `not rendered (${render.reason})`}`
    );
  }
  out.push("");
  return out;
}

function findingsMarkdown(checks) {
  const out = [];
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  if (!shown.length) {
    out.push("No automatic check found anything.", "");
    return out;
  }
  for (const f of shown) {
    const copy = checkCopy(f.code, "en", plainEvidence(f.evidence));
    out.push(`- **[${f.severity}] ${copy.title}** \`${f.code}\`${f.passages.length ? ` · passages ${f.passages.map((i) => `#${i}`).join(" ")}` : ""}  `);
    if (copy.what) out.push(`  ${copy.what}  `);
    for (const s of f.evidence?.samples ?? []) {
      const where = s.passage !== undefined ? `#${s.passage} ` : "";
      const body = s.lines ? s.lines.join(" · ") : s.phrase ? `${s.phrase} (${s.groups} groups)` : s.heading ? `${s.heading} (${s.chars} chars)` : s.text;
      out.push(`  - ${where}“${cell(body)}”`);
    }
    out.push(`  *What to do:* ${copy.tell}`);
  }
  out.push("");
  return out;
}

function planMarkdown(plan, multi) {
  if (!plan?.items?.length) return [];
  const out = ["## Rewrite plan", "", "The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.", ""];
  for (const item of plan.items) {
    out.push(`${item.priority}. ${multi ? `**Page ${item.page}** · ` : ""}${item.check ? `\`${item.check}\` · ` : ""}${item.passages.length ? `passages ${item.passages.map((i) => `#${i}`).join(" ")}` : "page-wide"}  `);
    out.push(`   **Problem:** ${cell(item.problem)}  `);
    out.push(`   **Fix:** ${cell(item.fix)}`);
    if (item.before) {
      out.push(`   - *Before:* ${cell(item.before)}`);
      out.push(`   - *After:* ${cell(item.after)}`);
    }
  }
  out.push("");
  return out;
}

function queriesMarkdown(queries, n) {
  if (!queries?.length) return [];
  const out = ["## Query test", "", "The agent's judgement: for each typical query, the best passage and whether it answers on its own.", ""];
  out.push("| Query | Source | Best passage | Answer | Citable | The words that answer |");
  out.push("|---|---|---|---|---|---|");
  for (const q of queries) {
    const r = q.results[n];
    out.push(`| ${cell(q.query)} | ${q.source} | ${r.passage === null ? "—" : `#${r.passage}`} | ${r.verdict} | ${r.citable ? "yes" : "no"} | ${r.quote ? `“${cell(r.quote)}”` : "—"} |`);
  }
  out.push("");
  return out;
}

function diffMarkdown(diff) {
  if (!diff) return [];
  const out = ["## Since the baseline", ""];
  out.push(`Against the reading of ${diff.baselineUrl}: ${diff.counts.same} unchanged, ${diff.counts.changed} changed, ${diff.counts.added} added, ${diff.counts.removed} removed.`, "");
  out.push("| Measure | Baseline | Now |", "|---|---|---|");
  out.push(`| Passages | ${diff.before.passages} | ${diff.after.passages} |`);
  out.push(`| Words | ${fmt(diff.before.words)} | ${fmt(diff.after.words)} |`);
  out.push(`| Cap reached | ${diff.before.capReached ? "yes" : "no"} | ${diff.after.capReached ? "yes" : "no"} |`);
  out.push(`| Characters past the cap | ${fmt(diff.before.charsUnread)} | ${fmt(diff.after.charsUnread)} |`, "");
  for (const p of diff.passages.filter((x) => x.status !== "same")) {
    out.push(`- #${p.index} ${p.status}${p.heading ? ` · ${cell(p.heading)}` : ""}${p.was !== null ? ` (was #${p.was}, ${fmt(p.charsBefore)} → ${fmt(p.chars)} chars)` : ` (${fmt(p.chars)} chars)`}`);
  }
  for (const p of diff.removed) out.push(`- #${p.index} removed${p.heading ? ` · ${cell(p.heading)}` : ""} (${fmt(p.chars)} chars)`);
  if (diff.groups) {
    out.push("", "**Group changes**", "");
    for (const g of diff.groups.after) {
      const from = Object.entries(g.from).map(([id, count]) => `${diff.groups.before[id]?.label ?? `#${id}`} ×${count}`);
      const fresh = g.passages - Object.values(g.from).reduce((s, x) => s + x, 0);
      if (fresh) from.push(`new text ×${fresh}`);
      out.push(`- ${g.id} · ${cell(g.label)} (${g.passages}) ← ${from.join(", ")}`);
    }
  }
  out.push("");
  return out;
}

function groupsTable(lens, topicName = null) {
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const out = topicName
    ? ["| Group | Label | Topic | Label source | Passages | Chars | Share |", "|---|---|---|---|---|---|---|"]
    : ["| Group | Label | Label source | Passages | Chars | Share |", "|---|---|---|---|---|---|"];
  for (const g of lens.groups) {
    const source = g.agentLabel ? `${g.labelSource}: ${cell(g.label)}` : g.labelSource;
    const topic = topicName ? ` ${cell(topicName.get(g.topic) ?? g.topic ?? "")} |` : "";
    out.push(`| ${g.id} | ${cell(displayLabel(g))} |${topic} ${source} | ${g.chunkCount} | ${fmt(g.charCount)} | ${pct(indexed ? g.charCount / indexed : 0)} |`);
  }
  return out;
}

function closingLine(page) {
  const cap = page.chunkCap;
  if (page.capReached && page.charsUnread > 0) {
    return `A page contributes at most ${cap} passages, and this one filled every slot: ${fmt(page.charsUnread)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`;
  }
  if (page.capReached) {
    return `A page contributes at most ${cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`;
  }
  return `A page contributes at most ${cap} passages; this one needed ${page.chunksIndexed}, so none of its extracted text fell past the cap.`;
}

// ── a page in Russian: the refusal and nothing of the page ─────────────────────

/** The refusal in Markdown, English then Ukrainian, every finding with its link. */
function refusalMarkdown(heading = "##") {
  const lang = (code) => {
    const out = [`${heading} ${REFUSAL_COPY.title[code]}`, "", REFUSAL_COPY.lead[code], ""];
    for (const f of FINDINGS) {
      if (f.items) {
        out.push(`**${f.source[code]}**`, "");
        for (const item of f.items) out.push(`- ${item.text[code]} → ${item.url}`);
        out.push("");
      } else {
        out.push(`**${f.source[code]}**${f.joiner[code]}${f.text[code]} → ${f.url}`, "");
      }
    }
    out.push(`**${REFUSAL_COPY.sanctionsLabel[code]}:** ${REFUSAL_COPY.sanctions[code]} ${SANCTIONS_LINKS.map((l) => `${l.name} (${l.url})`).join(" · ")}`, "");
    out.push(REFUSAL_COPY.lastLine[code], "");
    return out;
  };
  return [...lang("en"), ...lang("uk")];
}

export function renderRefusalMarkdown(reading) {
  const url = reading.page?.url || reading.requestedInput || "";
  return [`# Vectorscope: ${REFUSAL_COPY.title.en}`, "", `URL: ${cell(url)}`, "", ...refusalMarkdown("##")].join("\n");
}

function refusalExport(reading) {
  return {
    schema: REFUSAL_SCHEMA,
    generatedAt: new Date().toISOString(),
    skillVersion: SKILL_VERSION,
    producedBy: { tool: "vectorscope-skill (local, no embeddings)", url: "https://www.getlooploop.com/vectorscope" },
    refused: true,
    reasonCode: reading.reasonCode,
    page: { url: reading.page?.url ?? null, requestedUrl: reading.page?.requestedUrl ?? reading.requestedInput ?? null },
    language: reading.language ?? null,
    passages: [],
  };
}

function runRefused(args, reading) {
  console.log(`REFUSED  ${reading.reasonCode}: pages in Russian are not analysed; the report holds the reason and nothing of the page`);
  writeOutputs(args, refusalExport(reading), renderRefusalMarkdown(reading), renderRefusalHtml(reading), "vectorscope-refused.json");
}

/** Who did the reading, as groups.json states it; "model not stated by the agent" otherwise. */
function byMarkdown(judgements) {
  const one = (j) => [j?.model ? `model: ${cell(j.model)}` : "model not stated by the agent", j?.agent ? `agent: ${cell(j.agent)}` : null].filter(Boolean).join(" · ");
  const keys = judgements.map((x) => JSON.stringify([x.j?.agent ?? null, x.j?.model ?? null]));
  return new Set(keys).size <= 1 ? one(judgements[0]?.j) : judgements.map((x) => `page ${x.n}: ${one(x.j)}`).join("; ");
}

/** The report's three claims, kept apart, as the HTML report's info panel states them. */
function infoMarkdown(cap, judgements) {
  return [
    `> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the ${cap}-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.`,
    ">",
    `> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (${byMarkdown(judgements)}). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.`,
    ">",
    `> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the ${cap}-passage cap is this tool's.`,
    "",
  ];
}

export function renderMarkdown(reading, lens, extras = {}) {
  const { page } = reading;
  const cap = page.chunkCap;
  const out = [];
  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {}

  out.push(`# Vectorscope reading: ${cell(page.title || host || page.url)}`);
  out.push("");
  out.push(...infoMarkdown(cap, [{ n: 1, j: lens.judgement }]));
  out.push(...blockedBanner(reading.robots));
  out.push("| | |");
  out.push("|---|---|");
  out.push(`| URL | ${cell(page.url)} |`);
  if (page.url !== page.requestedUrl) out.push(`| Asked for | ${cell(page.requestedUrl)} |`);
  out.push(`| Title | ${cell(page.title || "(none)")} |`);
  out.push(`| Words | ${fmt(page.wordCount)} |`);
  out.push(`| Headings found | ${page.headings} |`);
  out.push(`| noindex | ${page.noindex ? "**yes**: the page asks search engines not to index it, which usually means assistants never see it either" : "no"} |`);
  out.push("");

  const repeats = lens.duplicates;
  out.push(
    `**Pipeline:** Fetched → Extracted ${fmt(page.wordCount)} words · ${page.headings} headings → ` +
      `Chunked ${plural(page.chunksIndexed, "passage", "passages")} · ${fmt(page.charsIndexed)} chars → ` +
      `Grouped ${plural(lens.groups.length, "group", "groups")} · ${plural(repeats, "repeat", "repeats")} (by reading; no embedding step)`
  );
  out.push("");

  out.push("## Counters");
  out.push("");
  out.push(`- **${page.chunksIndexed}** passages read`);
  out.push(`- **${page.chunksIndexed}/${cap}** slots used of the ${cap}-passage cap${page.capReached ? " (every slot filled)" : ""}`);
  out.push(
    `- **${fmt(page.charsUnread)}** characters past the cap, not read. Zero unless every slot was filled; then counted as extracted characters minus indexed characters, ` +
      "and since passages overlap by about 200 characters and the first one repeats the title and description, it undercounts and can read 0 even when the cap cut off a tail."
  );
  out.push("");

  out.push(...diffMarkdown(extras.diff));

  out.push("## Checks", "", "### AI crawlers and robots.txt", "");
  out.push(...robotsMarkdown(reading.robots));
  out.push("### Technical markup", "");
  out.push(...technicalMarkdown(reading.technical, reading.render, page));
  out.push("### Findings", "");
  out.push(...findingsMarkdown(extras.checks ?? []));

  out.push(...planMarkdown(extras.plan, false));
  out.push(...queriesMarkdown(extras.queries, 1));

  out.push("## The groups this page falls into");
  out.push("");
  out.push(...groupsTable(lens));
  out.push("");
  out.push(
    'Label is the agent\'s name for the group when it gave one. Label source is the computed label: "heading" is the page\'s own section heading and can be quoted; "keywords" is the group\'s two most distinctive words, a hint and not what the section is called.'
  );
  out.push("");
  const noted = lens.groups.filter((x) => x.note);
  for (const g of noted) out.push(`- **${g.id} · ${cell(displayLabel(g))}:** ${cell(g.note)}`);
  if (noted.length) out.push("");

  out.push("## Passages, by group");
  out.push("");
  out.push("In reading order inside each group. Each line shows how the passage opens (its first 240 characters).");
  out.push("");
  for (const g of lens.groups) {
    out.push(`### ${g.id} · ${cell(displayLabel(g))} (${plural(g.chunkCount, "passage", "passages")})`);
    out.push("");
    for (const index of g.members) {
      const c = lens.chunks[index];
      const notes = [ROLE_LABEL[c.contentRole], c.duplicateOf !== null ? `repeats #${c.duplicateOf}` : null].filter(Boolean);
      const head = c.heading ? `*${cell(c.heading)}* · ` : "";
      out.push(`- **#${c.chunkIndex}** ${head}${fmt(c.charCount)} chars${notes.length ? ` · **${notes.join(" · ")}**` : ""}  `);
      out.push(`  ${cell(c.preview)}${c.charCount > PREVIEW_CHARS ? "…" : ""}`);
    }
    out.push("");
  }
  if (page.capReached && page.charsUnread > 0) {
    out.push(`*Outside cap:* ${fmt(page.charsUnread)} characters at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.`);
    out.push("");
  }

  const side = lens.chunks.filter((c) => c.contentRole !== "main");
  out.push("## Side-path content");
  out.push("");
  if (side.length) {
    out.push(`${plural(side.length, "passage looks", "passages look")} like related links or utility copy; they are still indexed.`);
    out.push("");
    for (const c of side) out.push(`- #${c.chunkIndex}${c.heading ? ` · ${cell(c.heading)}` : ""} · ${ROLE_LABEL[c.contentRole]} (group ${c.group})`);
  } else {
    out.push("No passage looks like related links or utility copy.");
  }
  out.push("");

  out.push("## The page's vocabulary");
  out.push("");
  out.push("*What the page says, not search demand — for how people ask, use the query test or https://www.getlooploop.com/voicescope.*");
  out.push("");
  const groupCount = lens.groups.length;
  const term = (k) => `${k.term} (${k.count}${k.passages !== undefined ? `; ${k.passages} passages` : ""}; ${k.groups} of ${groupCount} groups${k.scope ? "; describes the page" : ""})`;
  const phrases = lens.phrases ?? [];
  const narrative = lens.narrative ?? (lens.phrases ? [] : lens.keywords ?? []);
  out.push("### Phrases this page owns");
  out.push("");
  out.push("Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses.");
  out.push("");
  out.push(phrases.length ? phrases.map((k, i) => `${i + 1}. ${term(k)}`).join("\n") : "No phrase is written often enough to count.");
  out.push("");
  out.push("### Narrative words");
  out.push("");
  out.push("Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.");
  out.push("");
  out.push(narrative.length ? narrative.map(term).join(", ") : "None.");
  out.push("");

  if (extras.facts?.length) {
    out.push("## Citable facts", "", "The agent's list of the concrete facts, figures and claims the passages state.", "");
    for (const f of extras.facts) out.push(`- ${cell(f.fact)} (${(f.pages[1] || []).map((i) => `#${i}`).join(" ")})`);
    out.push("");
  }

  out.push("---");
  out.push("");
  out.push(closingLine(page));
  out.push("");
  out.push(
    "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way."
  );
  out.push("");
  return out.join("\n");
}

export function renderCompareMarkdown(data) {
  const { pages, topicCmp, facts, factCmp, queries, plan, topics } = data;
  const name = new Map(topics.map((t) => [t.id, t.name]));
  const out = [`# Vectorscope comparison: ${pages.length} pages, one topic dictionary`, ""];
  out.push(...infoMarkdown(pages[0].reading.page.chunkCap, pages.map((p) => ({ n: p.n, j: p.lens.judgement }))));
  out.push("> The agent grouped every page against one shared topic dictionary, so the topics line up across pages.", "");
  if (data.refused?.length) {
    out.push(`Not analysed: ${data.refused.map((r) => `page ${r.n} (${cell(r.url)})`).join(", ")}.`, "");
    out.push(...refusalMarkdown("##"));
  }
  for (const p of pages) out.push(...blockedBanner(p.reading.robots, `Page ${p.n}: `));
  out.push("## The pages", "");
  out.push("| Page | URL | Words | Passages | Past cap | AI crawlers blocked | Findings (high/medium/low) |", "|---|---|---|---|---|---|---|");
  for (const p of pages) {
    const pg = p.reading.page;
    const blocked = (p.reading.robots?.bots || []).filter((b) => !b.allowed).map((b) => b.token);
    const count = (s) => p.checks.filter((f) => f.severity === s).length;
    out.push(`| ${p.n} | ${cell(pg.url)} | ${fmt(pg.wordCount)} | ${pg.chunksIndexed}/${pg.chunkCap} | ${fmt(pg.charsUnread)} | ${blocked.length ? blocked.join(", ") : "none"} | ${count("high")}/${count("medium")}/${count("low")} |`);
  }
  out.push("");
  out.push("## Topics × pages", "", "Passages and characters each page spends on each shared topic.", "");
  out.push(`| Topic | ${pages.map((p) => `Page ${p.n}`).join(" | ")} |`, `|---|${pages.map(() => "---").join("|")}|`);
  for (const row of topicCmp.table) {
    out.push(`| ${cell(row.name)} | ${pages.map((p) => (row.cells[p.n].passages ? `${row.cells[p.n].passages} · ${fmt(row.cells[p.n].chars)} chars` : "—")).join(" | ")} |`);
  }
  out.push("", "**Topic gaps** (topics the other pages cover and this one does not):", "");
  for (const p of pages) out.push(`- Page ${p.n}: ${topicCmp.gaps[p.n].length ? topicCmp.gaps[p.n].map((id) => name.get(id) ?? id).join(", ") : "no gaps"}`);
  out.push("");
  if (queries?.length) {
    out.push("## Who wins each query", "");
    out.push(`| Query | Source | ${pages.map((p) => `Page ${p.n}`).join(" | ")} | Winner |`, `|---|---|${pages.map(() => "---").join("|")}|---|`);
    for (const q of queries) {
      const { winners, tie } = queryWinner(q);
      const cells = pages.map((p) => {
        const r = q.results[p.n];
        return `${r.verdict}${r.passage !== null ? ` #${r.passage}` : ""}${r.citable ? ", citable" : ""}`;
      });
      out.push(`| ${cell(q.query)} | ${q.source} | ${cells.join(" | ")} | ${winners.length ? winners.map((n) => `Page ${n}`).join(", ") + (tie ? " (tie)" : "") : "nobody"} |`);
    }
    out.push("");
  }
  if (facts?.length) {
    out.push("## Fact gaps", "", "Which page states a fact the others lack.", "");
    out.push(`| Fact | ${pages.map((p) => `Page ${p.n}`).join(" | ")} |`, `|---|${pages.map(() => "---").join("|")}|`);
    for (const f of facts) out.push(`| ${cell(f.fact)} | ${pages.map((p) => (f.pages[p.n] ? `✓ ${f.pages[p.n].map((i) => `#${i}`).join(" ")}` : "—")).join(" | ")} |`);
    out.push("");
    for (const p of pages) out.push(`- Page ${p.n}: ${factCmp.unique[p.n].length} fact(s) only it states, ${factCmp.lacking[p.n].length} it lacks.`);
    out.push("");
  }
  out.push(...planMarkdown(plan, true));
  out.push("## Checks by page", "");
  for (const p of pages) {
    out.push(`### Page ${p.n} · ${cell(p.reading.page.url)}`, "");
    out.push(...robotsMarkdown(p.reading.robots));
    out.push(...technicalMarkdown(p.reading.technical, p.reading.render, p.reading.page));
    out.push(...findingsMarkdown(p.checks));
  }
  out.push("## Each page's groups", "");
  for (const p of pages) {
    out.push(`### Page ${p.n}`, "");
    out.push(...groupsTable(p.lens, name));
    out.push("", closingLine(p.reading.page), "");
  }
  out.push("---", "", "This is a preview of the machine's view, not a guarantee of what any assistant does with it.", "");
  return out.join("\n");
}

// ── export ───────────────────────────────────────────────────────────────────

function exportChecks(checks) {
  return checks.map((f) => ({ ...f, message: checkCopy(f.code, "en", plainEvidence(f.evidence)).what }));
}

function sharedJudgement(list) {
  const same = (key) => (new Set(list.map((j) => j?.[key] ?? null)).size === 1 ? list[0]?.[key] ?? null : null);
  return { agent: same("agent"), model: same("model") };
}

function singleExport(reading, lens, extras) {
  return {
    ...buildVectorscopeExport(reading.page, lens),
    // v2, additive. None of the v1 fields above changed meaning, so the schema id is unchanged.
    skillVersion: SKILL_VERSION,
    // Who did the reading (groups.json "agent" and "model"), null when the agent did not say.
    judgement: lens.judgement ?? { agent: null, model: null },
    checks: exportChecks(extras.checks),
    technical: reading.technical ?? null,
    robots: reading.robots ?? null,
    render: reading.render ?? null,
    plan: extras.plan?.items ?? null,
    queries: extras.queries ?? null,
    facts: extras.facts ?? null,
    diff: extras.diff ?? null,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function loadReading(path) {
  const reading = readJson(path, "reading");
  if (!reading.ok) fail(`the reading ${path} is a refusal (${reading.reasonCode}); there are no passages to group.`);
  if (!Array.isArray(reading.passages) || !reading.passages.length) fail(`the reading ${path} holds no passages.`);
  return reading;
}

function writeOutputs(args, jsonValue, md, html, fallbackJson) {
  const jsonPath = args.json || fallbackJson;
  const mdPath = args.md || jsonPath.replace(/\.json$/, "") + ".md";
  writeFileSync(jsonPath, JSON.stringify(jsonValue, null, 2));
  writeFileSync(mdPath, md);
  if (args.html) writeFileSync(args.html, html);
  console.log(`report    ${mdPath}`);
  console.log(`export    ${jsonPath}`);
  if (args.html) console.log(`html      ${args.html}`);
}

function printChecks(checks, prefix = "") {
  const shown = checks.filter((f) => f.code !== "robots_not_checked");
  console.log(`${prefix}checks    ${shown.length ? "" : "none"}`);
  for (const f of shown) console.log(`${prefix}  [${f.severity}] ${f.code}${f.passages.length ? ` #${f.passages.join(" #")}` : ""}`);
}

function runSingle(args) {
  if (args.files.length >= 1 && args.files.length <= 2) {
    const first = readJson(args.files[0], "reading");
    if (first.reasonCode === REFUSAL_CODE) return runRefused(args, first);
  }
  if (args.files.length !== 2) {
    console.error(USAGE);
    process.exit(1);
  }
  const reading = loadReading(args.files[0]);
  const pages = [{ n: 1, passages: reading.passages }];
  const topics = args.topics ? attempt("topics.json", () => validateTopics(readJson(args.topics, "topics"))) : null;
  const topicIds = topics ? new Set(topics.map((t) => t.id)) : null;
  const grouping = attempt("groups.json", () => validateGrouping(readJson(args.files[1], "groups"), reading.passages.length, { topicIds }));
  const lens = buildJudgedLens(reading, grouping);
  const checks = pageChecks(reading, lens);

  const extras = { checks, topicsById: topics ? new Map(topics.map((t) => [t.id, t])) : null };
  const warnings = [];
  if (args.plan) {
    const fired = new Map([[1, new Set(checks.map((f) => f.code))]]);
    const plan = attempt("plan.json", () => validatePlan(readJson(args.plan, "plan"), pages, fired));
    extras.plan = plan;
    warnings.push(...plan.warnings);
  }
  if (args.queries) {
    const q = attempt("queries.json", () => validateQueries(readJson(args.queries, "queries"), pages));
    extras.queries = q.queries;
    warnings.push(...q.warnings);
  }
  if (args.facts) extras.facts = attempt("facts.json", () => validateFacts(readJson(args.facts, "facts"), pages, topicIds));
  if (args["baseline-groups"] && !args.baseline) fail("--baseline-groups needs --baseline.");
  if (args.baseline) {
    const old = loadReading(args.baseline);
    let oldLens = null;
    if (args["baseline-groups"]) {
      const oldGrouping = attempt("baseline groups", () => validateGrouping(readJson(args["baseline-groups"], "baseline groups"), old.passages.length));
      oldLens = buildJudgedLens(old, oldGrouping);
    }
    extras.diff = diffReadings(old, reading, oldLens, lens);
  }

  if (grouping.reordered) console.log("note      groups were renumbered by their earliest passage and sorted inside");
  for (const w of warnings) console.log(`warning   ${w}`);
  for (const g of lens.groups) {
    console.log(`group ${g.id}   ${displayLabel(g)} [${g.labelSource}${g.agentLabel ? `: ${g.label}` : ""}] · ${plural(g.chunkCount, "passage", "passages")} · ${fmt(g.charCount)} chars`);
  }
  console.log(`phrases   ${lens.phrases.slice(0, 8).map((k) => k.term).join(", ")}${lens.phrases.length > 8 ? ", …" : ""}`);
  console.log(`narrative ${lens.narrative.map((k) => k.term).join(", ")}`);
  printChecks(checks);
  if (extras.diff) console.log(`diff      ${extras.diff.counts.same} same · ${extras.diff.counts.changed} changed · ${extras.diff.counts.added} added · ${extras.diff.counts.removed} removed`);
  writeOutputs(args, singleExport(reading, lens, extras), renderMarkdown(reading, lens, extras), renderHtml(reading, lens, extras), vectorscopeExportName(reading.page));
}

function runCompare(args) {
  const manifestPath = args.compare;
  const manifest = readJson(manifestPath, "manifest");
  if (!Array.isArray(manifest.pages)) fail("manifest.json has no pages; write it with read.mjs and several URLs.");
  const dir = dirname(manifestPath);
  const usable = manifest.pages.filter((p) => p.ok);
  const refused = manifest.pages.filter((p) => !p.ok && p.reasonCode === REFUSAL_CODE).map((p) => ({ n: p.n, url: p.url ?? p.requested, reasonCode: p.reasonCode }));
  if (usable.length < 2) fail(`only ${usable.length} page(s) in the manifest could be read; a comparison needs two.`);
  for (const p of manifest.pages.filter((x) => !x.ok)) console.log(`note      page ${p.n} (${p.requested}) was refused (${p.reasonCode}) and is left out`);

  const topicsPath = join(dir, "topics.json");
  if (!existsSync(topicsPath)) fail(`${topicsPath} is missing: compare mode needs one shared topic dictionary.`);
  const topics = attempt("topics.json", () => validateTopics(readJson(topicsPath, "topics")));
  const topicIds = new Set(topics.map((t) => t.id));

  const pages = usable.map((entry) => {
    const reading = loadReading(join(dir, entry.reading));
    const groupsPath = join(dir, `groups-${entry.n}.json`);
    if (!existsSync(groupsPath)) fail(`${groupsPath} is missing: write one groups file per page.`);
    const grouping = attempt(`groups-${entry.n}.json`, () => validateGrouping(readJson(groupsPath, "groups"), reading.passages.length, { topicIds, requireTopics: true }));
    const lens = buildJudgedLens(reading, grouping);
    return { n: entry.n, reading, lens, checks: pageChecks(reading, lens), passages: reading.passages };
  });

  const warnings = [];
  const optional = (file) => (existsSync(join(dir, file)) ? readJson(join(dir, file), file) : null);
  const factsRaw = optional("facts.json");
  const facts = factsRaw ? attempt("facts.json", () => validateFacts(factsRaw, pages, topicIds)) : null;
  const queriesRaw = optional("queries.json");
  let queries = null;
  if (queriesRaw) {
    const q = attempt("queries.json", () => validateQueries(queriesRaw, pages));
    queries = q.queries;
    warnings.push(...q.warnings);
  }
  const planRaw = optional("plan.json");
  let plan = null;
  if (planRaw) {
    const fired = new Map(pages.map((p) => [p.n, new Set(p.checks.map((f) => f.code))]));
    plan = attempt("plan.json", () => validatePlan(planRaw, pages, fired));
    warnings.push(...plan.warnings);
  }

  const topicCmp = compareTopics(pages, topics);
  const factCmp = facts ? compareFacts(pages, facts) : null;
  const data = { pages, topics, topicCmp, facts, factCmp, queries, plan, refused };

  for (const w of warnings) console.log(`warning   ${w}`);
  for (const p of pages) {
    console.log(`page ${p.n}    ${p.reading.page.url} · ${p.reading.page.chunksIndexed} passages · ${p.lens.groups.length} groups`);
    printChecks(p.checks, "  ");
  }
  for (const row of topicCmp.table) console.log(`topic     ${row.name}: ${pages.map((p) => `${p.n}=${row.cells[p.n].passages}`).join(" ")}`);
  for (const q of queries ?? []) {
    const w = queryWinner(q);
    console.log(`query     ${q.query} → ${w.winners.length ? w.winners.map((n) => `page ${n}`).join(", ") + (w.tie ? " (tie)" : "") : "nobody"}`);
  }

  const exported = {
    schema: COMPARE_SCHEMA,
    generatedAt: new Date().toISOString(),
    skillVersion: SKILL_VERSION,
    producedBy: { tool: "vectorscope-skill (local, no embeddings)", url: "https://www.getlooploop.com/vectorscope" },
    howToRead:
      "Each page is a full single-page export under pages[]. topics is the one dictionary every page was grouped against; topicTable gives passages and characters per topic per page; topicGaps lists, per page, topics the others cover and it does not; facts and factGaps are the agent's list of citable facts and where each is stated; queries carry a verdict per page and the winner. Grouping, facts and verdicts are judgements; chunking and the cap are the product's exact rules.",
    // Who did the reading: the value every page's groups file states, null where they differ or say nothing.
    judgement: sharedJudgement(pages.map((p) => p.lens.judgement)),
    pages: pages.map((p) => ({ n: p.n, ...singleExport(p.reading, p.lens, { checks: p.checks }) })),
    topics,
    topicTable: topicCmp.table,
    topicGaps: topicCmp.gaps,
    facts,
    factGaps: factCmp,
    queries: queries ? queries.map((q) => ({ ...q, winner: queryWinner(q) })) : null,
    plan: plan?.items ?? null,
    // Pages in Russian are not analysed: listed, with nothing of the page.
    refused,
  };
  writeOutputs(args, exported, renderCompareMarkdown(data), renderCompareHtml(data), join(dir, "compare.json"));
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exit(1);
  }
  if (args.compare) runCompare(args);
  else runSingle(args);
}
