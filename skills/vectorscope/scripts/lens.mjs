#!/usr/bin/env node
// Step 3 of the Vectorscope skill: labels, counts, shares, keywords and side-path content
// over the grouping Claude wrote in step 2, and the two outputs.
//   node scripts/lens.mjs reading.json groups.json [--json out.json] [--md out.md]
// groups.json: {"groups": [[0,1,2],[3,4],...], "duplicates": {"7": 2}}
// Every passage index exactly once, at most 6 groups. Refuses with a clear message otherwise.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  dominantHeading,
  labelGroup,
  labelSourceOf,
  pageKeywords,
  PREVIEW_CHARS,
} from "./lib/lens.mjs";
import { buildVectorscopeExport, vectorscopeExportName } from "./lib/export.mjs";

const MAX_GROUPS = 6;

const USAGE = "Usage: node scripts/lens.mjs reading.json groups.json [--json out.json] [--md out.md]";

function fail(message) {
  console.error(`REFUSED  ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { files: [], json: null, md: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") out.json = argv[++i];
    else if (argv[i] === "--md") out.md = argv[++i];
    else out.files.push(argv[i]);
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

/** Validate and normalise the grouping. Returns { groups: number[][], duplicates: Map<number, number>, reordered }. */
export function validateGrouping(input, passageCount) {
  if (!input || typeof input !== "object" || !Array.isArray(input.groups)) {
    throw new Error('groups.json must be an object with a "groups" array, e.g. {"groups": [[0,1],[2]], "duplicates": {}}');
  }
  const groups = input.groups;
  if (groups.length === 0) throw new Error("groups is empty: every passage must belong to a group.");
  if (groups.length > MAX_GROUPS) {
    throw new Error(`${groups.length} groups given; the product draws at most ${MAX_GROUPS}. Merge the closest subjects until there are ${MAX_GROUPS} or fewer.`);
  }
  const seen = new Map();
  groups.forEach((group, g) => {
    if (!Array.isArray(group) || group.length === 0) throw new Error(`group ${g} is not a non-empty array of passage indexes.`);
    for (const value of group) {
      if (!Number.isInteger(value) || value < 0 || value >= passageCount) {
        throw new Error(`group ${g} holds ${JSON.stringify(value)}, which is not a passage index (0–${passageCount - 1}).`);
      }
      if (seen.has(value)) throw new Error(`passage ${value} is in group ${seen.get(value)} and group ${g}; each passage goes in exactly one group.`);
      seen.set(value, g);
    }
  });
  const missing = [];
  for (let i = 0; i < passageCount; i++) if (!seen.has(i)) missing.push(i);
  if (missing.length) {
    throw new Error(`passage${missing.length === 1 ? "" : "s"} ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} in no group. A passage that shares no subject goes in a group of its own.`);
  }

  // Members ascending; groups numbered by their earliest passage.
  const sorted = groups.map((group) => group.slice().sort((a, b) => a - b));
  const ordered = sorted.slice().sort((a, b) => a[0] - b[0]);
  const reordered = ordered.some((group, i) => group !== sorted[i]) ||
    groups.some((group, i) => group.some((value, j) => value !== sorted[i][j]));

  const duplicates = new Map();
  const rawDup = input.duplicates ?? {};
  if (typeof rawDup !== "object" || Array.isArray(rawDup)) throw new Error('"duplicates" must be an object like {"7": 2}.');
  for (const [key, value] of Object.entries(rawDup)) {
    const later = Number(key);
    if (!Number.isInteger(later) || later < 0 || later >= passageCount) throw new Error(`duplicates key ${JSON.stringify(key)} is not a passage index.`);
    if (!Number.isInteger(value) || value < 0 || value >= passageCount) throw new Error(`duplicates[${key}] = ${JSON.stringify(value)} is not a passage index.`);
    if (value >= later) throw new Error(`duplicates[${key}] = ${value}: a duplicate points back to an EARLIER passage.`);
    // neighbours overlap by design, so an adjacent pair is never a duplicate.
    if (later - value <= 1) throw new Error(`duplicates[${key}] = ${value}: adjacent passages share the chunker's overlap; only non-adjacent repeats count.`);
    duplicates.set(later, value);
  }
  return { groups: ordered, duplicates, reordered };
}

/** The read-out over a judged grouping. . */
export function buildJudgedLens(reading, grouping) {
  const passages = reading.passages;
  const assignment = new Array(passages.length).fill(0);
  grouping.groups.forEach((members, id) => members.forEach((index) => (assignment[index] = id)));

  const chunks = passages.map((p, index) => ({
    chunkIndex: p.index,
    preview: p.text.slice(0, PREVIEW_CHARS),
    charCount: p.text.length,
    group: assignment[index],
    duplicateOf: grouping.duplicates.has(index) ? grouping.duplicates.get(index) : null,
    heading: p.heading,
    contentRole: p.contentRole,
  }));

  const groups = grouping.groups.map((memberIndexes, id) => {
    const memberTexts = memberIndexes.map((index) => passages[index].text);
    const otherTexts = passages.filter((_, index) => assignment[index] !== id).map((p) => p.text);
    const heading = dominantHeading(memberIndexes.map((index) => passages[index].rawHeading ?? passages[index].heading));
    const label = labelGroup(memberTexts, otherTexts, heading);
    return {
      id,
      label,
      labelSource: labelSourceOf(label, heading),
      chunkCount: memberIndexes.length,
      charCount: memberTexts.reduce((sum, text) => sum + text.length, 0),
      cohesion: null,
      members: memberIndexes,
    };
  });

  return {
    chunks,
    groups,
    duplicates: grouping.duplicates.size,
    keywords: pageKeywords(passages.map((p) => p.text), assignment, groups.length),
  };
}

// ── markdown ─────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n).toLocaleString("en-US");
const cell = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
const pct = (x) => `${Math.round(x * 1000) / 10}%`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const ROLE_LABEL = { related: "related link", utility: "utility copy" };

export function renderMarkdown(reading, lens) {
  const { page } = reading;
  const cap = page.chunkCap;
  const indexed = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
  const out = [];
  let host = "";
  try {
    host = new URL(page.url).hostname.replace(/^www\./, "");
  } catch {}

  out.push(`# Vectorscope reading: ${cell(page.title || host || page.url)}`);
  out.push("");
  out.push(
    "> Grouped by Claude's reading, not by embeddings: the fetch, extraction, chunking and the " +
      `${cap}-passage cap are the product's exact rules; the groups are a judgement. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.`
  );
  out.push("");
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
    `- **${fmt(page.charsUnread)}** characters past the cap, not read. Counted as extracted characters minus indexed characters; ` +
      "passages overlap by about 200 characters and the first one repeats the title and description, so this undercounts and can read 0 even when the cap cut off a tail."
  );
  out.push("");

  out.push("## The groups this page falls into");
  out.push("");
  out.push("| Group | Label | Label source | Passages | Chars | Share |");
  out.push("|---|---|---|---|---|---|");
  for (const g of lens.groups) {
    out.push(`| ${g.id} | ${cell(g.label)} | ${g.labelSource} | ${g.chunkCount} | ${fmt(g.charCount)} | ${pct(indexed ? g.charCount / indexed : 0)} |`);
  }
  out.push("");
  out.push(
    '"heading" is the page\'s own section heading and can be quoted. "keywords" is the group\'s two most distinctive words: a hint, not what the section is called.'
  );
  out.push("");

  out.push("## Passages, by group");
  out.push("");
  out.push("In reading order inside each group. Each line shows how the passage opens (its first 240 characters).");
  out.push("");
  for (const g of lens.groups) {
    out.push(`### ${g.id} · ${cell(g.label)} (${plural(g.chunkCount, "passage", "passages")})`);
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

  out.push("## The words and phrases this page keeps using");
  out.push("");
  out.push(
    "Counted across the whole page, as single words and as the two-word phrases it writes often enough to be saying the phrase. A term reaching most groups describes the page; one confined to fewer is a section's own vocabulary. Group counts rest on the grouping above."
  );
  out.push("");
  const term = (k) => `${k.term} (${k.count}; ${k.groups} of ${lens.groups.length} groups)`;
  const scope = lens.keywords.filter((k) => k.scope);
  const section = lens.keywords.filter((k) => !k.scope);
  out.push(`**Describes the page:** ${scope.length ? scope.map(term).join(", ") : "no term reaches enough of this page to describe it as a whole."}`);
  out.push("");
  out.push(`**Belongs to one section:** ${section.length ? section.map(term).join(", ") : "none."}`);
  out.push("");

  out.push("---");
  out.push("");
  let closing;
  if (page.capReached && page.charsUnread > 0) {
    closing = `A page contributes at most ${cap} passages, and this one filled every slot: ${fmt(page.charsUnread)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`;
  } else if (page.capReached) {
    closing = `A page contributes at most ${cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`;
  } else {
    closing = `A page contributes at most ${cap} passages; this one needed ${page.chunksIndexed}, so none of its extracted text fell past the cap.`;
  }
  out.push(closing);
  out.push("");
  out.push(
    "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way."
  );
  out.push("");
  return out.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (args.files.length !== 2) {
    console.error(USAGE);
    process.exit(1);
  }
  const reading = readJson(args.files[0], "reading");
  if (!reading.ok) fail(`the reading is a refusal (${reading.reasonCode}); there are no passages to group.`);
  if (!Array.isArray(reading.passages) || !reading.passages.length) fail("the reading holds no passages.");
  const rawGroups = readJson(args.files[1], "groups");

  let grouping;
  try {
    grouping = validateGrouping(rawGroups, reading.passages.length);
  } catch (error) {
    fail(`groups.json: ${error.message}`);
  }

  const lens = buildJudgedLens(reading, grouping);
  const exported = buildVectorscopeExport(reading.page, lens);
  const jsonPath = args.json || vectorscopeExportName(reading.page);
  const mdPath = args.md || jsonPath.replace(/\.json$/, "") + ".md";
  writeFileSync(jsonPath, JSON.stringify(exported, null, 2));
  writeFileSync(mdPath, renderMarkdown(reading, lens));

  if (grouping.reordered) console.log("note      groups were renumbered by their earliest passage and sorted inside");
  for (const g of lens.groups) {
    console.log(`group ${g.id}   ${g.label} [${g.labelSource}] · ${plural(g.chunkCount, "passage", "passages")} · ${fmt(g.charCount)} chars`);
  }
  console.log(`keywords  ${lens.keywords.slice(0, 8).map((k) => k.term).join(", ")}${lens.keywords.length > 8 ? ", …" : ""}`);
  console.log(`report    ${mdPath}`);
  console.log(`export    ${jsonPath}`);
}
