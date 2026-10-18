Read this when the user asks what a number or a field means, compares with an older report, or wants the data in `export.json`, `compare.json` or `reading.json`.

# The report, the export and the reading files

## Measured, derived, judgement

Every section and number has 1 of 3 tags; the export splits the same way.

- **Measured:** what the parser saw. Words, headings, passages and lengths, characters at each extraction stage, which element removed what, robots.txt rules, markup, response headers (`X-Robots-Tag`, `Cache-Control`), accessibility structure (images and alt text, heading order).
- **Derived:** a fixed formula over measured values. Unique text in passages, characters past the cap, group shares, vocabulary counts, check verdicts. A metric that rests on your groups (group shares, a phrase's group count, `repeated_claim`) says so.
- **Agent's judgement:** groups and labels, repeats, the plan, the query test, the facts, the swap test.

## Where the text goes

read.mjs prints a `losses` line (raw HTML text → removed by the cleaner → kept → in passages, unique → past the cap) and the 3 largest removal reasons.

The report ends with a folded panel; its summary line gives the characters past the cap, and a `#help=` link into it opens it. It holds:

- a character waterfall: raw HTML text (an estimate: kept plus every removal), removed, kept (the chunker's input), in passages without the overlap counted twice, kept but in no passage (h2 lines and spaces between sections), past the cap;
- the removals: reason, element with a short CSS path, characters, first words; largest first, the rest counted;
- a section map: how much of each h2 section, the intro and the text before the first h2 reached a passage.

A second run of the same extraction, checked to give the same text, produces the panel. It changes no passage.

## Two text-in-passages numbers

- *Unique text in passages*: each kept character once.
- *Text in passages, overlap and intro included*: the passages' lengths summed (the old `charsIndexed`).
- **Characters past the cap**: kept text after the last passage, counted only when all 26 slots are filled.

2.101 subtracted the overlapping total and could read 0 when the cap cut a tail. The export keeps that value as `charsUnread`. If the 2 differ, use the new one, and tell a user who compares with an older report why it changed.

## How generated the text sounds

The last open section of `report.html`, above *Where the text goes*:

- the Pattern score over the kept text (PatternScope `det-1`/`score-1`, the rules of https://www.getlooploop.com/patternscope, with 2 whole-page adjustments the "?" states; English, Ukrainian and Spanish);
- the marker words, beside the score, never inside it;
- passages under 60 words, which get no score of their own;
- your swap test, and where you and the script disagree.

Single-page only. For 1 page of a comparison, run that page alone with `--style`.

## The comparison report

Each page's counts and blocked crawlers; the topic × page table (passages and characters per topic); topic gaps; fact gaps (facts only 1 page states); who wins each query; the plan; the crawler table by page; every page's findings; each page's strip and groups. Last, *Losses by page*, folded: the table, then each page's waterfall and section map, each folded.

## Files

**report.html**

- Self-contained: no external fonts, scripts or images; a content security policy blocks all network requests; all page text is escaped. Readable down to 375 px.
- Each section and number has a Measured, Derived or Agent's judgement tag, and each number a "?" with its formula, unit, threshold and limits. `#help=<metric id>` (for example `#help=chars_past_cap`) opens 1 on load.
- Interface in English, Ukrainian and Polish.

**report.md**

- The same reading in English Markdown, each heading and number marked `measured`, `derived` or `judgement`.
- *Where the text goes* (before the closing line): waterfall, removals (top 20), section map.
- *How each number is computed* (last): every metric's formula, unit, threshold and limits.

**export.json** (`getlooploop/vectorscope-reading@1`, the product's shape)

- `phrases` and `narrativeWords`: the page vocabulary as the product computes it. Entry fields: `term`, `count`, `passages`, `groups`, `spread`, `describesWholePage`. `keywords`: both lists as 1, phrases first (the earlier shape).
- v2 only **adds** fields, so the schema id stays: `skillVersion`, `judgement` (`agent`, `model`; `null` when not stated), `checks` (each with an English `message`), `technical`, `robots`, `render`, `plan`, `queries`, `facts`, `diff`; on each group `agentLabel`, `note`, `topic`.
- `label` and `labelSource` keep their v1 meaning (the computed label).
- Fields that need vectors (`cohesion`, `selfSimilarity`, `groupFloor`, `projection`, `embeddingModel`, `dimensions`) are `null`.
- Since 2.102:
  - `measured`: `page`, `retrieval` (with `charsInPassagesTotal`, `charsInPassagesUnique`), `passages` without their group, `losses`, `robots`, `technical`, `render`, and `derived` (`charsPastCap`, legacy `charsUnread`, `phrases`, `narrativeWords`, `checks`);
  - `judgement`: `agent`, `model`, `groups`, `assignment`, `duplicates`, `plan`, `queries`, `facts`;
  - `layers` (what each section holds) and `metrics` (id → `layer`, `label`, `formula`, `unit`, `threshold`, `limits`, as in the "?").
- Every v1 and v2 field stays at its old path with its old meaning, so some values appear twice. `retrieval` only gains `charsPastCap` and `charsInPassagesUnique`.
- Since 2.111: `generatedText`, and `judgement.style` with your swap-test verdicts.

**compare.json** (`getlooploop/vectorscope-compare@1`)

- Every page's export under `pages[]`, plus `topics`, `topicTable`, `topicGaps`, `facts`, `factGaps`, `queries` (each with its `winner`), `plan`.
- Since 2.102: `layers`, `metrics`, `measured.lossTable` (each page's waterfall and sections cut), and in `judgement`, beside `agent` and `model`, the shared `topics`, `facts`, `queries`, `plan`.

**reading.json** (`getlooploop/vectorscope-skill-reading@1`)

- Added after v1: `technical`, `robots`, `layout`; `losses` (2.102: waterfall, passage placement, removals, section map); `headers` (2.109: response headers, null for a saved copy); `accessibility` (2.109: images and alt text, heading order); `sections` (2.111: kept text by section, intro marked, read by the Pattern score; without it the report shows "read again" instead of a score); `render` (with `--render`).
- Passages are unchanged from v1. lens still accepts a v1 reading (for example as a baseline) and skips the checks that need the new fields.
