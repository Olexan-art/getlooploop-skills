---
name: vectorscope
description: Shows how an AI retriever or a RAG pipeline reads a public web page: the fetch, the text extraction, the cut into passages, the 26-passage cap, robots.txt rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot), structure checks and how generated the text sounds. The agent groups the passages, tests queries and writes a rewrite plan. Output: an HTML report. Compares 2 to 5 pages. Use when the user asks how AI reads or chunks a page, what is past a retrieval cap, if AI bots are blocked, how to make a page easier to cite, or names vectorscope. Also «як ШІ читає сторінку». For a full SEO or GEO audit, use ai-search-audit-full.
---

Version 2.112.

# Vectorscope (local, no embeddings)

## Purpose

The scripts run the product's exact fetch, extraction, chunking and 26-passage cap on 1 to 5 public pages, check robots.txt for AI crawlers, and run structure and pattern checks. You group the passages, test queries, judge each passage and write a rewrite plan; the scripts write an HTML report. The skill does not rank the page, decide who wrote it, or predict what an assistant will say.

## Requirements

- Node 20.18 or later. If it is missing or older, tell the user and stop.
- No install: `dist/*.mjs` (with `dist/chunks/`) run with plain `node`. Only if `dist/` is missing, run `npm install --omit=dev` in `$SKILL` and use `scripts/*.mjs`.
- Network: the page, its robots.txt, 1 DNS lookup, 1 RDAP request.
- `$SKILL` is this file's folder (`${CLAUDE_SKILL_DIR}` in Claude Code; on claude.ai, the path you read it from).
- Work in a writable directory of your own. Call the scripts by their path.
- No network, a read-only skill folder, or `unreachable`: read `references/environment.md` first.

## Rules

- **R1.** Answer in the user's language.
- **R2.** Write every JSON file with the file-writing tool, never a shell heredoc (heredocs break on apostrophes).
- **R3.** Never re-create the scripts' work by hand. If they cannot run, tell the user why and what would fix it, and stop.
- **R4.** Never invent: quotes verbatim, labels only for covered subjects, no new claims in the plan, `agent`/`model` honest or absent.
- **R5.** Pages in Russian or from Russian sites are refused, not analysed, whatever the user asks.
- **R6.** The scripts call no model and no embedding API. The reading is yours; say so.
- **R7.** Do not claim that an assistant has indexed, ranks or will cite the page. Never say the page was or was not written by AI.
- **R8.** Compare only the pages the user names. After a refusal, do not try another URL unless asked.

## Procedure

(script) steps are deterministic. (judgement) steps are yours: write a JSON file; the next script validates it.

### Single page

1. **Read (script).** `node "$SKILL/dist/read.mjs" <url> --out reading.json` (`--render` adds a JavaScript render to compare).
   - On failure: `REFUSED <code>` (exit code 2). Stop; see *Refusal codes*.
2. **Group (judgement).** Read every passage's `text` in full. Write `groups.json`.
3. **Lens (script).** `node "$SKILL/dist/lens.mjs" reading.json groups.json --html report.html --md report.md --json export.json`
   - Result: labels, vocabulary, checks, findings with passage ids.
4. **Judge (judgement).** Write `queries.json`, `style.json`, `plan.json`; `facts.json` if the user wants the facts.
5. **Lens again (script).** `node "$SKILL/dist/lens.mjs" reading.json groups.json --plan plan.json --queries queries.json --style style.json [--facts facts.json] --html report.html --md report.md --json export.json`
6. **Show the report** (required), with the chat summary.

In steps 3 and 5, `REFUSED` names the file and item: fix it and run again. A `warning` does not stop the run; mention it in 1 sentence.

Before / after: keep the old `reading.json` and `groups.json`, read the changed page, and add `--baseline old-reading.json [--baseline-groups old-groups.json]` to lens. The report adds a passage diff, the cap status and where each new group came from.

### Compare (2 to 5 pages)

1. **Read (script).** `node "$SKILL/dist/read.mjs" <url1> <url2> [… <url5>] --out-dir readings`
   - Result: `readings/reading-<n>.json` in the order given, and `readings/manifest.json`.
   - A refused page is left out; write no groups file for it. At least 2 pages must read.
2. **Judge (judgement).** Read every passage of every page. Write, in this order: shared `readings/topics.json`, `readings/groups-<n>.json` per page, `readings/facts.json`, `readings/queries.json`, optional `readings/plan.json`.
3. **Lens (script).** `node "$SKILL/dist/lens.mjs" --compare readings/manifest.json --html readings/compare.html --md readings/compare.md --json readings/compare.json`
4. **Show the report** `readings/compare.html` (required).

*How generated the text sounds* is single-page only: run that page alone with `--style`.

## Judgement files

Read `references/judgement.md` before you write any of them.

- **All:** `quote`, `evidence` and `before` are verbatim from the cited passage. Passage ids are 0-based `index`; pages are 1-based. `agent`, `model` (groups and style files): your product and model name; leave out what you do not know.
- **groups.json:** every passage exactly once. Group by subject, not by adjacency, heading or the ~200-character overlap; a passage must fit the whole group. At most 6 groups, usually 2 to 5; 1 only for a page of 1 or 2 passages. `duplicates`: near-verbatim repeats of an earlier **non-adjacent** passage only. Labels in the page's language.
- **topics.json** (compare): first; at most 12 slug ids, neutral names. Every group has a `topic`.
- **queries.json:** 5 to 10, the user's own if given; at least 1 the page probably does not answer. Per page: `passage` (id or `null`), `verdict` (`complete`, `partial`, `missing`), `citable` only if the quote makes sense alone. Judge from the passages only.
- **style.json:** every passage: `generic` if it fits a competitor's page with only the brand changed, else `specific`.
- **facts.json:** every citable fact once, with every page and passage that states it.
- **plan.json:** after the checks; `check` is a code from `references/checks.md` or `null`. Each passage must stand alone: name the subject, keep question with answer and fact with claim, open on the subject, describe images and tables. Order: blocked crawlers and noindex, past the cap, lost questions or subjects, thin sections, markup. `before`/`after` for the 2 or 3 weakest passages per page. An item with no passages (for example a site-wide check): `"passages": []`; leave out `before` and `after`, do not set them to `null`.

## Verification

- [ ] The last lens run printed no `REFUSED`.
- [ ] `report.html` (or `readings/compare.html`) exists.
- [ ] Every `warning` is in the answer.
- [ ] A blocked answering crawler or noindex comes first.

## Show the report

Required. A chat message or a file name alone does not deliver the report.

If the user or caller said not to publish or open anything, stop when the HTML file exists and give its path.

Present one file: `report.html` (compare: `readings/compare.html`). Keep `report.md` and `export.json` beside it; do not present, attach, open or preview them. Never open or preview `export.json` or `report.md` as the result, and never end the reply on either: the HTML is the report. If the environment shows the last file presented, it must be the HTML.

- **claude.ai or the Claude desktop app, with code execution:** save the 3 files where your instructions say user files go (the outputs folder, if named) and present **only `report.html`**: not the JSON or the Markdown, not even after the HTML. A scratch folder the user cannot see does not count. Do not retype the report into an artifact.
- **Claude Code:** publish only `report.html` with an HTML or artifact publishing tool, if there is one, and give the link. Otherwise open it in the default browser (`start "" "<absolute path>"`, `open`, `xdg-open`) and give its absolute path. Do not publish or open the JSON or the Markdown.
- **Codex, opencode, Hermes Agent or any other agent:** give `report.html`'s absolute path and offer to open it. Name the other 2 files only if asked.

The report opens offline, in English. `#lang=uk`, `#lang=pl`, `#theme=dark` change it (`report.html#lang=pl&theme=dark`). Add `#lang` when the user writes in Ukrainian or Polish.

## Chat summary

Short, with the report. Tag each claim **measured** (counted), **derived** (fixed formula) or **agent's judgement** (your files). Never present a judgement as a measurement or round a measurement into one. If a number is questioned, quote its formula from the report's "?" or the Markdown's *How each number is computed*.

1. **A blocked answering crawler (`ai_search_blocked`, `robots_unreachable`) or noindex, first.**
2. Passages read, slots used of 26, characters past the cap, where the text went. Name a large removal (`outside_main`, `nav`) or a 0% section that held content.
3. Findings, high first, with passage ids and the fix.
4. The plan's top 3 items, with 1 before → after.
5. Queries: how many complete, which found nothing. Compare: topic gaps, facts on 1 page only, who wins each query.
6. Pattern score and band, marker words per 1,000, passages you judged generic, and where you and the script disagree.
7. Groups: your label first; the computed label only when its source is `heading`.
8. **Phrases this page owns**, then **narrative words**: what the page says, not search demand (for that: the query test or https://www.getlooploop.com/voicescope).
9. Once: groups, queries and plan are your reading, not embeddings; chunking, cap, losses and checks are deterministic (embeddings: https://www.getlooploop.com/vectorscope).
10. Very few words on a rich-looking page: suggest `--render`.

## Refusal codes

`REFUSED <code>`: the page was not analysed.

| Code | Tell the user |
|---|---|
| `invalid_url` | Not a web address; ask for the full URL. |
| `blocked_scheme` | Only http and https (a bare `host:port` counts as a scheme). |
| `blocked_host`, `blocked_address` | Localhost, a private network or a non-standard port. |
| `unreachable` | Down or does not resolve. In a sandbox, read `references/environment.md`. |
| `http_error` | The page returned an error (status in the JSON). |
| `blocked` | The site refuses automated readers (401, 403, 429); retrying will not help. |
| `not_html` | A file such as a PDF or image. |
| `too_large` | Over 3 MB. |
| `empty` | No readable text after cleaning, or a feed, sitemap or file. |
| `refused_ru_domain` | Russian domain zone (.ru, .su, .рф, .москва, .moscow); not fetched. |
| `refused_ru_hosting` | Hosted in Russia (RDAP country RU); not fetched. |
| `refused_ru_audience` | Declares a Russian-language version (hreflang, og:locale, Content-Language). |
| `refused_language_ru` | The page is in Russian. |

For `refused_ru_*` and `refused_language_ru`: run `node "$SKILL/dist/lens.mjs" reading.json --html report.html --md report.md --json export.json` (no groups file), show the report, give the reason in 1 line, and stop. Do not analyse, summarise or describe the page another way.

## References

| File | Read when |
|---|---|
| `references/judgement.md` | before any judgement file |
| `references/checks.md` | explaining or citing a check; crawler tokens; robots.txt rules |
| `references/outputs.md` | a number or field, the waterfall, past-cap vs old `charsUnread`, export or reading schema |
| `references/environment.md` | no network, read-only folder, `unreachable`, what the tool can read |
