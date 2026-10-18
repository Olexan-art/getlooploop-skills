# The report, the export and the reading files

Read this when the user asks what a number or a field means, compares with an older report, or wants the data in `export.json`, `compare.json` or `reading.json`.

## Measured, derived, judgement

Every section and every number in the report carries one of three tags, and the export splits the same way:

- **Measured** — what the parser saw: words, headings, passages and their lengths, the characters at each stage of the extraction, which element removed what, robots.txt rules, markup, the response headers (`X-Robots-Tag`, `Cache-Control`) and the accessibility structure (images and their alt text, the heading order). Scripts counted it; any model gets the same number.
- **Derived** — computed from measured values by a fixed formula: unique text in passages, characters past the cap, group shares, vocabulary counts, check verdicts. Deterministic. Where one rests on your groups (group shares, a phrase's group count, `repeated_claim`), the metric says so.
- **Agent's judgement** — your reading: groups and labels, repeats, the plan, the query test, the facts.

## Where the text goes

read.mjs prints a `losses` line (raw HTML text → removed by the cleaner → kept → in passages, unique → past the cap) and the three largest removal reasons.

At the end of the report, folded shut under a summary line that gives the characters past the cap (it opens on a click, and a `#help=` link into it opens it), the report shows a character waterfall: text in the raw HTML (an estimate: the kept text plus every removal, so it sums exactly), removed by the cleaner, kept (the chunker's input), in passages without double-counting the overlap, kept but in no passage text (h2 heading lines and the spaces between sections), and past the cap. Under it, the removals (reason, the element with a short CSS path, characters, how its text begins; largest first, every element beyond the listed ones counted) and a section map (how much of each h2 section, the intro and the text before the first h2 reached a passage). All of it is observed on a second run of the same extraction, checked to give the same text; nothing here changes a passage.

## Two text-in-passages numbers

*Unique text in passages* counts each kept character once; *text in passages, overlap and intro included* is the passages' own lengths summed (the old `charsIndexed`). **Characters past the cap** is the kept text after the last passage, counted only when all 26 slots are filled; 2.101 subtracted the overlapping total and could read 0 when the cap had cut a tail. The old value stays in the export as `charsUnread` with its old meaning. If the two differ, use the new one and, if the user compares with an older report, say why it changed.

## How generated the text sounds

The last open section of `report.html`, just above *Where the text goes*: the Pattern score over the page's kept text (PatternScope `det-1`/`score-1`, the rules of https://www.getlooploop.com/patternscope with two adjustments for a whole page that the "?" states; English, Ukrainian and Spanish), the marker words beside it and never inside it, the passages under 60 words that get no score of their own, your swap test, and where the script and you disagree. It is a single-page section: for one page of a comparison, run that page on its own with `--style`.

## The comparison report

It shows each page's counts and blocked crawlers, the topic × page table (passages and characters per topic), topic gaps (topics the others cover and a page does not), fact gaps (facts only one page states), who wins each query, the plan, the crawler table by page, every page's findings, and each page's strip and groups. It ends with *Losses by page*, folded like the single report's panel: the table, then each page's waterfall and section map, each folded again.

## Files

- `report.html`: one self-contained page (no external fonts, scripts or images; a content security policy blocks all network requests; every piece of page text is escaped), readable down to 375 px. A tag beside every section and number says Measured, Derived or Agent's judgement, and a "?" beside each number opens its formula, unit, threshold and known limits; `#help=<metric id>` (for example `#help=chars_past_cap`) opens one when the report loads. The interface is in English, Ukrainian and Polish.
- `report.md`: the same reading in Markdown, in English. Every heading and number carries a `measured`, `derived` or `judgement` marker; *Where the text goes*, the last section before the closing line, holds the waterfall, the removals (top 20) and the section map; the last section, *How each number is computed*, gives every metric's formula, unit, threshold and limits.
- `export.json`: the product's `getlooploop/vectorscope-reading@1` shape. `phrases` and `narrativeWords` (each entry: `term`, `count`, `passages`, `groups`, `spread`, `describesWholePage`) are the page vocabulary exactly as the product computes it; `keywords` is the two as one list, phrases first, in the shape earlier exports had. v2 only **adds** fields, so the schema id is unchanged: `skillVersion`, `judgement` (`agent` and `model` from groups.json, `null` when not stated), `checks` (each with an English `message`), `technical`, `robots`, `render`, `plan`, `queries`, `facts`, `diff`, and on each group `agentLabel`, `note` and `topic`. `label` and `labelSource` keep their v1 meaning (the computed label). Every field that needs vectors (cohesion, selfSimilarity, groupFloor, projection, embeddingModel, dimensions) is `null`.
  - Since 2.102 it also has two top-level sections, `measured` (`page`, `retrieval` with `charsInPassagesTotal` and `charsInPassagesUnique`, `passages` without their group, `losses`, `robots`, `technical`, `render`, and under `derived`: `charsPastCap`, the legacy `charsUnread`, `phrases`, `narrativeWords`, `checks`) and `judgement` (`agent`, `model`, `groups`, `assignment`, `duplicates`, `plan`, `queries`, `facts`), plus `layers` (what each section holds) and `metrics` (id → `layer`, `label`, `formula`, `unit`, `threshold`, `limits`: the same text as the report's "?"). Every v1 and v2 field also stays at its old path with its old meaning (`judgement.agent` and `judgement.model` are where v2 put them; `retrieval` only gains `charsPastCap` and `charsInPassagesUnique`), so the schema id stays `getlooploop/vectorscope-reading@1`: nothing a v1 or v2 consumer reads moved or changed. The cost is that some values appear twice; moving them would have broken every saved prompt that reads `phrases` or `labelSource`.
  - Since 2.111, `generatedText`, and `judgement.style` holds your swap-test verdicts.
- `compare.json` (`getlooploop/vectorscope-compare@1`): every page's export under `pages[]`, plus `topics`, `topicTable`, `topicGaps`, `facts`, `factGaps`, `queries` (each with its `winner`) and `plan`. Since 2.102 also `layers`, `metrics`, `measured.lossTable` (each page's waterfall and how many sections were cut) and, inside `judgement` beside `agent` and `model`, the shared `topics`, `facts`, `queries` and `plan`.
- `reading.json` (`getlooploop/vectorscope-skill-reading@1`) gains `technical`, `robots`, `layout`, `losses` (2.102: the waterfall, the passages' placement, the removals and the section map), `headers` (2.109: the response headers, null for a saved copy), `accessibility` (2.109: the images and their alt text, the heading order), `sections` (2.111: the kept text by section, the intro marked, which the Pattern score reads; a reading without it gets the block with "read again" instead of a score) and, with `--render`, `render`. Its passages are unchanged from v1, and lens still accepts a v1 reading (as a baseline, for example); the checks that need the new fields are then skipped.
