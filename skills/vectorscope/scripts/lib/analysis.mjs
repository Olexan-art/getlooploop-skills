// The read-out over a judged grouping, and the v2 layers built on it: checks, the baseline
// diff and the cross-page comparison. Deterministic; the judgement arrives as validated input.

import { dominantHeading, labelGroup, labelSourceOf, pageStopLanguage, PREVIEW_CHARS } from "./lens.mjs";
import { flattenVocabulary, pageVocabulary } from "./vocabulary.mjs";
import { runChecks } from "./checks.mjs";
import { charsPastCap } from "./losses.mjs";

/** The read-out over a judged grouping. */
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

  // One stop-word language for the whole page, as the product decides it.
  const stopLanguage = pageStopLanguage(passages.map((p) => p.text));
  const groups = grouping.groups.map((memberIndexes, id) => {
    const memberTexts = memberIndexes.map((index) => passages[index].text);
    const otherTexts = passages.filter((_, index) => assignment[index] !== id).map((p) => p.text);
    const heading = dominantHeading(memberIndexes.map((index) => passages[index].rawHeading ?? passages[index].heading));
    const label = labelGroup(memberTexts, otherTexts, heading, stopLanguage);
    const meta = grouping.meta?.[id] ?? {};
    return {
      id,
      label,
      labelSource: labelSourceOf(label, heading),
      // v2: the agent's name for the group; the computed label above stays as the label source.
      agentLabel: meta.label ?? null,
      note: meta.note ?? null,
      topic: meta.topic ?? null,
      chunkCount: memberIndexes.length,
      charCount: memberTexts.reduce((sum, text) => sum + text.length, 0),
      cohesion: null,
      members: memberIndexes,
    };
  });

  // The page vocabulary as the product computes it: phrases first, then narrative words;
  // `keywords` is the two as one list, the shape earlier readings had.
  const vocabulary = pageVocabulary(passages.map((p) => p.text), assignment, groups.length, stopLanguage);
  return {
    chunks,
    groups,
    assignment,
    duplicates: grouping.duplicates.size,
    keywords: flattenVocabulary(vocabulary),
    phrases: vocabulary.phrases,
    narrative: vocabulary.narrative,
    // Who did the reading, as stated in groups.json; null fields when not stated.
    judgement: grouping.judgement ?? { agent: null, model: null },
  };
}

/** The name a group is shown by: the agent's label when there is one, else the computed one. */
export const displayLabel = (group) => group?.agentLabel || group?.label || "";

/** Checks for one page, with the grouping the repetition check needs. */
export function pageChecks(reading, lens) {
  return runChecks(reading, lens?.assignment ?? null, lens?.groups.length ?? 0);
}

// ── before / after ───────────────────────────────────────────────────────────

/**
 * Compare a baseline reading with the current one. Passages are matched by identical text
 * first, then by the same heading in order; what is left is added or removed.
 * `oldLens` (optional) carries the baseline grouping, for the group changes.
 */
export function diffReadings(oldReading, newReading, oldLens = null, newLens = null) {
  const olds = oldReading.passages;
  const news = newReading.passages;
  const matchOld = new Array(olds.length).fill(null);
  const matchNew = new Array(news.length).fill(null);
  const status = new Array(news.length).fill("added");

  const byText = new Map();
  olds.forEach((p, i) => {
    const list = byText.get(p.text) ?? [];
    list.push(i);
    byText.set(p.text, list);
  });
  news.forEach((p, j) => {
    const list = byText.get(p.text);
    if (list && list.length) {
      const i = list.shift();
      matchOld[i] = j;
      matchNew[j] = i;
      status[j] = "same";
    }
  });
  news.forEach((p, j) => {
    if (matchNew[j] !== null) return;
    const heading = (p.heading || "").trim();
    if (!heading) return;
    const i = olds.findIndex((o, k) => matchOld[k] === null && (o.heading || "").trim() === heading);
    if (i >= 0) {
      matchOld[i] = j;
      matchNew[j] = i;
      status[j] = "changed";
    }
  });

  const passages = news.map((p, j) => ({
    index: p.index,
    status: status[j],
    was: matchNew[j],
    heading: p.heading,
    chars: p.charCount,
    charsBefore: matchNew[j] === null ? null : olds[matchNew[j]].charCount,
  }));
  const removed = olds
    .map((p, i) => ({ index: p.index, heading: p.heading, chars: p.charCount }))
    .filter((_, i) => matchOld[i] === null);

  // charsUnread keeps its 2.101 meaning; charsPastCap (2.102) is the honest count, and the waterfall is null for a reading made before 2.102.
  const capOf = (r) => ({
    passages: r.page.chunksIndexed,
    capReached: r.page.capReached,
    charsUnread: r.page.charsUnread,
    charsPastCap: charsPastCap(r),
    words: r.page.wordCount,
    chars: r.page.charsIndexed,
    waterfall: r.losses?.waterfall ?? null,
  });

  let groups = null;
  if (oldLens && newLens) {
    groups = {
      before: oldLens.groups.map((g) => ({ id: g.id, label: displayLabel(g), passages: g.chunkCount })),
      after: newLens.groups.map((g) => {
        const from = {};
        for (const member of g.members) {
          const was = matchNew[member];
          if (was === null) continue;
          const oldGroup = oldLens.assignment[was];
          from[oldGroup] = (from[oldGroup] ?? 0) + 1;
        }
        return { id: g.id, label: displayLabel(g), passages: g.chunkCount, from };
      }),
    };
  }

  return {
    before: capOf(oldReading),
    after: capOf(newReading),
    counts: {
      same: status.filter((s) => s === "same").length,
      changed: status.filter((s) => s === "changed").length,
      added: status.filter((s) => s === "added").length,
      removed: removed.length,
    },
    passages,
    removed,
    groups,
    sameUrl: oldReading.page.url === newReading.page.url,
    baselineUrl: oldReading.page.url,
  };
}

// ── compare ──────────────────────────────────────────────────────────────────

/**
 * Cross-page tables. `pages` is [{ n, reading, lens }]; `topics` the shared dictionary.
 * Returns { table: [{topic, cells: {n: {passages, chars, share}}}], gaps: {n: [topicId]}, factGaps }.
 */
export function compareTopics(pages, topics) {
  const table = topics.map((topic) => {
    const cells = {};
    for (const { n, lens } of pages) {
      const total = lens.groups.reduce((sum, g) => sum + g.charCount, 0);
      const groups = lens.groups.filter((g) => g.topic === topic.id);
      const passages = groups.reduce((sum, g) => sum + g.chunkCount, 0);
      const chars = groups.reduce((sum, g) => sum + g.charCount, 0);
      cells[n] = { passages, chars, share: total ? Math.round((chars / total) * 1000) / 1000 : 0 };
    }
    return { topic: topic.id, name: topic.name, cells };
  });
  const gaps = {};
  for (const { n } of pages) {
    gaps[n] = table.filter((row) => row.cells[n].passages === 0 && pages.some((p) => p.n !== n && row.cells[p.n].passages > 0)).map((row) => row.topic);
  }
  return { table, gaps };
}

/** For each page, the facts only it states, and the facts others state that it lacks. */
export function compareFacts(pages, facts) {
  const unique = {};
  const lacking = {};
  for (const { n } of pages) {
    unique[n] = facts.filter((f) => f.pages[n] && Object.keys(f.pages).length === 1).map((f) => f.id);
    lacking[n] = facts.filter((f) => !f.pages[n]).map((f) => f.id);
  }
  return { unique, lacking };
}
