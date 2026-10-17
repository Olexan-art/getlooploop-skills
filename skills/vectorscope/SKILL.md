---
name: vectorscope
description: Show how an AI assistant's retriever or a RAG pipeline reads public web pages - the GetLoopLoop Vectorscope's exact fetch, extraction, chunking and 26-passage cap, robots.txt verdicts for AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and more), automatic structure checks, and an agent-written grouping, query test and rewrite plan, as an HTML report; compares 2 to 5 pages. Use when the user asks how AI reads a page, what passages it splits into, what falls past a retrieval cap, whether AI bots are blocked, how to make a page easier for AI to cite, how pages compare for AI search, or names vectorscope. Ukrainian requests too, e.g. «як ШІ-асистент читає сторінку», «на які фрагменти ділиться сторінка», «що не вміщується в ліміт», «прожени сторінку через vectorscope», «порівняй сторінки», «перевір robots.txt для ШІ-ботів». No embeddings.
---

Version 2.107. Versions count in thousandths (2.101, 2.102, 2.103, 2.104, 2.105, 2.106, 2.107, …): the first number moves only on a breaking change.

# Vectorscope (local, no embeddings)

**In plain words, for people opening this file:** an AI assistant does not read a web page whole. A machine fetches it, keeps only the readable text, cuts it into passages and stores at most 26 of them; whatever comes after the 26th is never seen. This skill runs those exact steps on a public page, checks whether AI crawlers may fetch it, flags the structural problems that make passages hard to quote, and has the agent group the passages by subject, test the questions people ask and write a rewrite plan. It writes a report (HTML, Markdown and JSON). It does not score or rank the page, detect AI text, or predict what any assistant will say. It makes no model or embedding calls; the only network requests are the page and its robots.txt.

**Коротко українською:** ШІ-асистент не читає сторінку цілком. Машина завантажує її, лишає тільки текст, ріже на уривки й зберігає не більше 26; усе після 26-го вона не бачить. Ця навичка проганяє сторінку саме цими кроками, перевіряє robots.txt для ШІ-краулерів і показує структурні проблеми, через які уривки важко цитувати. Агент групує уривки за темою, перевіряє типові запити й пише план переписування з прикладами «було → стало». Можна порівняти від 2 до 5 сторінок. Скрипти не викликають жодних моделей чи ембедингів.

**Answer the user in the language they wrote in.**

Steps marked *script* run the product's exact rules and are deterministic. Steps marked *judgement* are yours: you write a small JSON file, and the next script validates it and refuses with a message naming what to fix.

## Before you start

- **`$SKILL` below is this skill's folder**, the one this SKILL.md is in. In Claude Code it is `${CLAUDE_SKILL_DIR}`. On claude.ai the skill's whole folder is copied into the code-execution sandbox; use the path you read this file from. Work in a writable directory of your own (the files you and the scripts write go there) and call the scripts by their path. They do not depend on the current directory.
- **No install.** `dist/read.mjs` and `dist/lens.mjs` (with the code they share in `dist/chunks/`) are the scripts bundled with everything they need, so plain `node` runs them: no `npm install`, no network for packages. They are generated from the readable source in `scripts/` and do exactly the same thing. Only if `dist/` is missing (a checkout without it) run `npm install --omit=dev` in `$SKILL` and use `scripts/read.mjs` and `scripts/lens.mjs` instead.
- **Node 20.18 or later** (what cheerio, bundled inside, declares). Check with `node --version`. If there is no Node, or an older one, say so and stop.
- **Network:** a run makes GET requests to the page and to its site's `/robots.txt`, and to nothing else. On claude.ai the code-execution sandbox must be allowed to reach that site (see *If the page cannot be fetched* at the end).
- **Never re-create the pipeline by hand.** If the scripts cannot run here (no Node, no code execution, the network blocked), say so, say what would make them run, and stop. Do not fetch the page another way and count, cut or check it yourself: numbers made by hand are not the tool's, however close they look, and the report would present them as if they were.

## Single page

1. *script* `node "$SKILL/dist/read.mjs" <url> --out reading.json` (add `--render` to compare with a JavaScript render, see Limits).
   It prints the counts, the robots.txt verdict, the technical markup and the first checks. If it prints `REFUSED <code>` (exit code 2), stop and explain the code (table at the end). Do not retry with another URL unless asked.
   **`REFUSED refused_language_ru`** means the page is in Russian, and pages in Russian are not analysed. Run `node "$SKILL/dist/lens.mjs" reading.json --html report.html --md report.md --json export.json` (no groups file), show the report as usual (step 6; it holds the reason and its sources), say in one line in the chat that this tool does not analyse pages in Russian, and stop. Do not analyse the page in any other way: no re-implementation by hand, no summary or description of its content.
2. *judgement* Read the `text` of **every** passage in `reading.json`, in full, and write `groups.json` (rules below).
3. *script* `node "$SKILL/dist/lens.mjs" reading.json groups.json --html report.html --md report.md --json export.json`
   This validates the grouping, computes labels, the page vocabulary (phrases, then narrative words) and all checks, and prints the findings with their passage ids.
   read.mjs has already printed where the text went: a `losses` line (raw HTML text → removed by the cleaner → kept → in passages, unique → past the cap) and the three largest removal reasons. The report draws it in full (see *Measured, derived, judgement* below).
4. *judgement* Write `queries.json` (5 to 10 typical queries, each answered from the passages) and `plan.json` (the rewrite plan). Write `facts.json` too if the user wants the citable facts listed.
5. *script* Run lens again with everything:
   `node "$SKILL/dist/lens.mjs" reading.json groups.json --plan plan.json --queries queries.json [--facts facts.json] --html report.html --md report.md --json export.json`
   A `REFUSED` names the file and the item; fix it and rerun. A `warning` (for example a plan item citing a check that did not fire) is kept, but deserves a sentence in your answer.
6. **Show the report** (required; see *Show the report*). A chat summary goes with it, never instead of it.

**Before / after:** keep the old `reading.json` (and its `groups.json`). After the page changes, read it again and add `--baseline old-reading.json [--baseline-groups old-groups.json]` to lens. The report gains a diff: passages unchanged, changed, added and removed; the cap status before and now; and, with the old groups, which old groups each new group's passages came from.

## Compare (2 to 5 pages)

1. *script* `node "$SKILL/dist/read.mjs" <url1> <url2> [… <url5>] --out-dir readings`
   One reading per URL (`readings/reading-1.json` …) and `readings/manifest.json`. Pages are numbered 1…N in the order given. A refused page is left out of the comparison; at least two must read. A page in Russian (`refused_language_ru`) is left out the same way, and the comparison report shows the refusal in its slot; write no groups file for it, and the others proceed.
2. *judgement* Read every passage of every page. Write **one** shared `readings/topics.json`, then `readings/groups-<n>.json` for each page, where every group names a topic from that dictionary. Then `readings/facts.json`, `readings/queries.json` and (optional) `readings/plan.json`.
3. *script* `node "$SKILL/dist/lens.mjs" --compare readings/manifest.json --html readings/compare.html --md readings/compare.md --json readings/compare.json`
4. **Show the report**, `readings/compare.html` (required; see *Show the report*).

The comparison report shows each page's counts and blocked crawlers, the topic × page table (passages and characters per topic), topic gaps (topics the others cover and a page does not), fact gaps (facts only one page states), who wins each query, the plan, the crawler table by page, every page's findings, and each page's strip and groups.

Compare the pages the user names. Do not volunteer a comparison against a named company's page unless the user asks for it.

## Measured, derived, judgement

Every section and every number in the report carries one of three tags, and the export splits the same way. Keep them apart when you present the result:

- **Measured** — what the parser saw: words, headings, passages and their lengths, the characters at each stage of the extraction, which element removed what, robots.txt rules, markup. Scripts counted it; any model gets the same number.
- **Derived** — computed from measured values by a fixed formula: unique text in passages, characters past the cap, group shares, vocabulary counts, check verdicts. Deterministic. Where one rests on your groups (group shares, a phrase's group count, `repeated_claim`), the metric says so.
- **Agent's judgement** — your reading: groups and labels, repeats, the plan, the query test, the facts.

When you summarise, **say which kind each claim is.** "The cap cut 55,001 characters" is measured and derived, and you can state it flatly. "The page has six subjects" or "query 3 is not answered" is your judgement; say it as yours. Never present a judgement as a measurement, and never round a measurement into a judgement ("about half the page is lost" when the report says 41%). When a number is questioned, quote its formula from the report's "?" (or the Markdown's *How each number is computed*); do not explain it from memory.

**Where the text goes.** At the end of the report, folded shut under a summary line that gives the characters past the cap (it opens on a click, and a `#help=` link into it opens it), the report shows a character waterfall: text in the raw HTML (an estimate: the kept text plus every removal, so it sums exactly), removed by the cleaner, kept (the chunker's input), in passages without double-counting the overlap, kept but in no passage text (h2 heading lines and the spaces between sections), and past the cap. Under it, the removals (reason, the element with a short CSS path, characters, how its text begins; largest first, every element beyond the listed ones counted) and a section map (how much of each h2 section, the intro and the text before the first h2 reached a passage). All of it is observed on a second run of the same extraction, checked to give the same text; nothing here changes a passage.

**Two text-in-passages numbers.** *Unique text in passages* counts each kept character once; *text in passages, overlap and intro included* is the passages' own lengths summed (the old `charsIndexed`). **Characters past the cap** is now the kept text after the last passage, counted only when all 26 slots are filled; 2.101 subtracted the overlapping total and could read 0 when the cap had cut a tail. The old value stays in the export as `charsUnread` with its old meaning. If the two differ, use the new one and, if the user compares with an older report, say why it changed.

Say what fell to the cleaner when it matters: a large `outside_main` or `nav` removal that held real content, or a section the map shows at 0% (it reached no passage at all), is worth a sentence and often a plan item.

## The files you write

Page numbers are 1-based (as in the manifest; single mode is page 1). Passage ids are the `index` values in the reading, 0-based. Every quote and every `before` text must be copied **verbatim** from the passage it cites: the scripts fold whitespace, curly quotes, dashes and case, and refuse anything else.

### groups.json

```json
{
  "groups": [
    { "members": [0, 1, 2], "label": "What the HTTP cache is", "note": "optional, up to 240 characters", "topic": "what" },
    { "members": [3, 4] }
  ],
  "duplicates": { "7": 2 },
  "agent": "Claude Code",
  "model": "Claude Opus 5.5"
}
```

`agent` and `model` (optional, up to 60 characters each) say who did the reading; the report's info panel shows them next to the groups, the plan and the query test, because another model may group a little differently. Fill them in honestly with what you know about yourself: `agent` is the product you are running in (for example "Claude Code", "claude.ai", "Codex", "opencode", "Hermes"), `model` is your model's name as you know it (for example "Claude Opus 5.5", "GPT-5"). If you do not know one, leave it out: the report then says "model not stated by the agent". Never guess or invent either. In compare mode, put the same two fields in every `groups-<n>.json`.

The v1 shape, `{"groups": [[0, 1, 2], [3, 4]]}`, still works, and the two shapes can be mixed. `label` (up to 80 characters) is your name for the group; the report shows it first and keeps the computed label (a heading most of the group's passages share, or else its two most distinctive words) as the "label source". `topic` is required in compare mode and must be an id from `topics.json`.

Group them the way the product's average-link clustering would:

- **Same subject, same group.** Put two passages together when a reader would say they are about the same thing: the same topic, product, question or procedure. Sitting next to each other or sharing a heading is not enough on its own.
- **Join the group, not one member.** A passage joins a group only if it fits the group as a whole, not just its nearest neighbour. Do not chain A–B–C when A and C have nothing in common.
- **Ignore the overlap.** Neighbouring passages share about 200 characters by design. That shared text is not evidence that they belong together.
- **At most 6 groups.** If you see more subjects than that, merge the two closest, and keep merging until there are 6 or fewer.
- **Every page splits into its facets.** Expect 2 to 5 groups on a normal page. Use a single group only when the page has one or two passages.
- **Alone is allowed.** A passage that shares no subject with any other gets a group of its own.
- **Side-path passages are grouped like any others,** by subject. The report lists them separately.
- **Duplicates:** if a passage repeats an earlier, **non-adjacent** passage almost word for word, record `"later": earlier`. Adjacent passages are never duplicates. Most pages have none.
- Each passage index appears **exactly once**. The script renumbers groups by their earliest passage.
- **Labels name the subject**, in the page's language, the way a reader would: "Revalidation with ETag", not "Validation stuff". Never name a subject the passages do not cover.

### topics.json (compare mode)

```json
{ "topics": [ { "id": "freshness", "name": "Freshness: max-age, Expires, heuristics" } ] }
```

One dictionary for all pages, written **before** the groups, so the groups line up across pages. Ids are short lowercase slugs (`a-z`, `0-9`, `-`, `_`); at most 12 topics. Make a topic for every subject any page covers, named neutrally (not after one page's heading). Two groups of one page may share a topic. A topic only one page covers is fine: that is what a topic gap is.

### facts.json

```json
{ "facts": [ { "id": "f1", "fact": "max-age=31536000 caches for one year.", "topic": "patterns", "pages": { "1": [16, 20], "2": [6] } } ] }
```

A fact is something concrete and citable: a number, a name, a rule, a definition, a date, a specific claim. Not "the page explains caching". Write each fact **once** and list every page and passage that states it, in any wording; leave a page out when it does not state it. In single mode `"passages": [16, 20]` may replace `pages`. List every fact the pages give, not a sample: the fact gaps are only as fair as this list.

### queries.json

```json
{
  "queries": [
    { "id": "q1", "query": "what is the difference between no-cache and no-store", "source": "generated",
      "results": {
        "1": { "passage": 13, "verdict": "complete", "citable": true, "quote": "The no-cache directive does not prevent the storing of responses" },
        "2": { "passage": null, "verdict": "missing", "citable": false } } }
  ]
}
```

5 to 10 typical queries. Use the user's own queries when they give them (`"source": "user"`); otherwise write the questions a person would actually type into an assistant about this subject (`"source": "generated"`), including at least one the page probably does not answer. For each page:

- `passage`: the single passage a retriever should return (or `null` when none does).
- `verdict`: `complete` (the passage alone answers it), `partial` (it helps but leaves part out, or needs a neighbouring passage), `missing`.
- `citable`: true only if the quoted words make sense quoted alone, with their subject in them. "It does this automatically" is not citable.
- `quote`: the exact words that answer, up to 400 characters, verbatim from that passage. Required unless the verdict is `missing`.

Judge only from the passages, never from what you know about the subject. In single mode `"result": {…}` may replace `results`. The report counts complete, partial and missing per page and, in compare mode, names who wins each query (the better verdict, then citable; ties are shown).

### plan.json

```json
{
  "items": [
    { "priority": 1, "page": 1, "passages": [3], "check": "mid_sentence_start",
      "problem": "…", "fix": "…",
      "before": "verbatim text from passage 3", "after": "the rewrite" }
  ]
}
```

Priority 1 is first. `check` is a check code (below) or `null` for a problem you found by reading. `page` defaults to 1. `before` and `after` go together; give them for the weakest passages, at least two or three per page.

**The guiding principle: every passage must stand on its own, because a retriever sees it alone.** A passage is returned without the one before it, without the page title and without the heading above it unless the heading is inside it. So the rewrite:

- names the product or subject instead of "it", "this", "our editor", "the tool";
- keeps the question next to its answer (an FAQ answer without its question is a fact with no address);
- keeps the fact next to the claim (the number, the limit, the date in the same sentence as the promise);
- opens on the subject, not mid-sentence and not on a transition;
- says in a sentence what an image, a widget or a table shows.

Order the plan by what changes retrieval most: blocked crawlers and noindex first, then text past the cap, then passages whose questions or subjects were lost, then thin or fragmented sections, then markup. Keep `after` faithful to the page: rewrite what it says, never add claims it does not make. Write the plan after you have the checks, so it can cite them.

## The checks

The scripts run these on every page; each finding has a code, a severity, the passages it rests on and the evidence. Thresholds are named constants in `scripts/lib/checks.mjs`, each with its reason.

| Code | Severity | What it means | Tell the user |
|---|---|---|---|
| `robots_unreachable` | high | robots.txt answered 5xx or not at all | Under RFC 9309 a crawler then assumes it may fetch nothing. Say this first. |
| `ai_search_blocked` | high | robots.txt disallows this path for a search or user-fetch crawler (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Googlebot, Bingbot) | **Say this first:** for those assistants the rest of the report is moot until the rule changes. |
| `noindex` | high | meta robots says noindex | Search indexes that assistants answer from will drop the page. |
| `js_dependent` | high | with `--render`, JavaScript adds 50% more words or more (and at least 150) | A retriever that does not run JavaScript reads the smaller number. |
| `cap_overflow` | high | all 26 slots filled and text left over | Name what fell past the cap; it can never be retrieved. |
| `lost_faq_questions` | high | 3 or more sentences open with "Yes."/"No." (and similar) and there are fewer "?" than half of them | The questions were in buttons or accordions and did not survive; each answer has lost its address. |
| `dominant_heading` | medium | one heading holds over 30% of the text | The chunker splits only at h2 (since 2.103, only at a line where the h2s, in their order, can be; a later line that repeats an earlier h2 is text); the subheadings there are h3 or styled text. |
| `mid_sentence_start` | medium | a passage opens lowercase or on punctuation | A section over 2,000 characters was cut by the window. |
| `nav_in_content` | medium | 4 or more consecutive one-or-two-word lines inside the main text | Menus, tag lists or label tables became passage text. |
| `canonical_other` | medium | the canonical names another URL | Indexes will prefer that URL. |
| `canonical_multiple` | medium | more than one canonical | Conflicting canonicals are ignored. |
| `jsonld_invalid` | medium | a JSON-LD block does not parse | It is ignored whole. |
| `ai_training_blocked` | low | only training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) are blocked | Usually deliberate; it does not stop an assistant citing the page today. |
| `thin_section` | low | a heading with fewer than 150 characters under it | Too short to answer anything alone. |
| `truncated_teaser` | low (medium at 3 or more) | lines ending in "…" or "..." (code samples excluded) | A cut-off teaser gives the retriever half a claim. |
| `repeated_claim` | low | the same 4-word phrase (with grammar in it, not code) in at least half the groups | Repetition spends passages on what was already said. |
| `canonical_missing`, `canonical_relative` | low | no canonical, or a relative one | Add one absolute canonical. |
| `jsonld_none` | low | no JSON-LD | Optional; FAQPage, HowTo, Product or Article markup states what the page is. |
| `meta_description_missing`, `meta_description_short`, `meta_description_long` | low | missing, under 70 or over 160 characters | The chunker puts the description into passage #0. |
| `robots_not_checked` | info | a saved page was read | Run on the live URL to check the crawlers. |

### AI crawlers

The robots.txt check reads `/robots.txt` on the page's own origin and follows RFC 9309: user-agent lines are grouped; a group naming the token (matched case-insensitively) replaces `*`; groups naming the same token are combined; the longest matching Allow or Disallow pattern wins (`*` and `$` supported), and Allow wins a tie. A 4xx robots.txt means no rules; a 5xx or no answer means everything is assumed disallowed. The tokens, as the vendors document them:

| Token | Vendor | Purpose | Source |
|---|---|---|---|
| OAI-SearchBot | OpenAI | ChatGPT search results | https://developers.openai.com/api/docs/bots |
| ChatGPT-User | OpenAI | fetches when a user asks; OpenAI says robots.txt rules may not apply | same |
| GPTBot | OpenAI | training data | same |
| Claude-SearchBot | Anthropic | search result quality | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler |
| Claude-User | Anthropic | fetches when a Claude user asks | same |
| ClaudeBot | Anthropic | training data | same |
| PerplexityBot | Perplexity | Perplexity search results | https://docs.perplexity.ai/guides/bots |
| Perplexity-User | Perplexity | fetches when a user asks; Perplexity says it generally ignores robots.txt | same |
| Google-Extended | Google | a robots.txt-only token for Gemini training and grounding; Google says it does not affect Search | https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers |
| Googlebot | Google | Google Search | same |
| Bingbot | Microsoft | Bing's index | https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 (token `bingbot`; that page renders with JavaScript) |
| CCBot | Common Crawl | the open web crawl | https://commoncrawl.org/ccbot |

RFC 9309: https://www.rfc-editor.org/rfc/rfc9309. A user-fetch crawler that ignores robots.txt can still be blocked at the server; say so if the user wants to block it.

## Show the report

This step is required. The HTML report is the result; a run that ends with only a chat message has not delivered it. Mentioning the file name is not showing it.

**Present one file: `report.html`** (in compare mode `readings/compare.html`). `report.md` and `export.json` are written beside it for whoever wants the data; keep them there, but do not present, attach, open or preview them. Never open or preview `export.json` or `report.md` as the result, and never end the reply on either of them: the HTML is the report. If the environment shows the last file you present, that last (and only) file must be the HTML.

- **claude.ai or the Claude desktop app, with code execution:** files you create there reach the user as files they can download from the conversation. Save `report.html` where your environment's own instructions say files for the user go (the outputs folder they name, if they name one), with `report.md` and `export.json` beside it, and present **only `report.html`** as a file in your reply, so the download the user gets and opens is the report. Do not present the JSON or the Markdown, not even after the HTML. A file left in a scratch folder the user cannot see has not been shown. Do not retype the report into an artifact by hand: it is large, and a copy is not the tool's output.
- **Claude Code:** if the session has a tool for publishing HTML pages or artifacts, publish `report.html` with it, and only that file, and give the link. Otherwise open `report.html` in the user's default browser: `start "" "<absolute path>"` on Windows, `open "<absolute path>"` on macOS, `xdg-open "<absolute path>"` on Linux. Then give its absolute path. Do not open, publish or print the JSON or the Markdown.
- **Codex, opencode, Hermes Agent or any other agent:** give `report.html`'s absolute path and offer to open it in the default browser with the command above (or the agent's own preview or browser tool, if it has one). Preview only the HTML. Name the other two files only if the user asks for the data.

The report is one self-contained file and makes no network requests, so it opens offline. It opens in English and in the light theme; `#lang=uk` opens it in Ukrainian and `#theme=dark` in the dark theme (for example `report.html#lang=uk&theme=dark`).

## The chat summary

Short, alongside the report and never instead of it:

- **If an answering crawler is blocked (`ai_search_blocked`, `robots_unreachable`) or the page is noindex, say that before anything else.**
- Then the pipeline line and the counters: passages read, slots used of 26, characters past the cap; and where the text went (the waterfall in one line: kept, in passages, past the cap) with the largest removal if it held content. These are measured or derived; say so.
- The findings, high first, each with its passage ids and what to do.
- The plan's top three items, with one before → after.
- The query test: how many queries were answered completely, and which found nothing. In compare mode: the topic gaps, the facts only one page has, and who wins each query.
- The groups, briefly. Your label first; quote the computed label as the section's name only when its source is `heading`.
- The page vocabulary: the **phrases this page owns** first (two to four words it writes together, ranked by how many passages use them), then the **narrative words** (single words not already inside a listed phrase). Say, with it, that these are what the page says, not search demand; for how people actually ask, point to the query test or https://www.getlooploop.com/voicescope.
- Say, once, that the groups, the queries and the plan are the agent's reading of the passages (judgement), not an embedding clustering; the chunking, the cap, the losses and the checks are deterministic (measured and derived). For the embedding-based reading with the map, point to https://www.getlooploop.com/vectorscope.
- Do not claim that any assistant has indexed the page, ranks it or will cite it.
- A very low word count on a page that looks rich in a browser usually means its content is drawn by JavaScript. Suggest `--render` to measure it.

## Outputs

- `report.html`: one self-contained page (no external fonts, scripts or images; a content security policy blocks all network requests; every piece of page text is escaped), readable down to 375 px. A tag beside every section and number says Measured, Derived or Agent's judgement, and a "?" beside each number opens its formula, unit, threshold and known limits; `#help=<metric id>` (for example `#help=chars_past_cap`) opens one when the report loads.
- `report.md`: the same reading in Markdown, in English. Every heading and number carries a `measured`, `derived` or `judgement` marker; *Where the text goes*, the last section before the closing line, holds the waterfall, the removals (top 20) and the section map; the last section, *How each number is computed*, gives every metric's formula, unit, threshold and limits.
- `export.json`: the product's `getlooploop/vectorscope-reading@1` shape. `phrases` and `narrativeWords` (each entry: `term`, `count`, `passages`, `groups`, `spread`, `describesWholePage`) are the page vocabulary exactly as the product computes it; `keywords` is the two as one list, phrases first, in the shape earlier exports had. v2 only **adds** fields, so the schema id is unchanged: `skillVersion`, `judgement` (`agent` and `model` from groups.json, `null` when not stated), `checks` (each with an English `message`), `technical`, `robots`, `render`, `plan`, `queries`, `facts`, `diff`, and on each group `agentLabel`, `note` and `topic`. `label` and `labelSource` keep their v1 meaning (the computed label). Every field that needs vectors (cohesion, selfSimilarity, groupFloor, projection, embeddingModel, dimensions) is `null`.
- **2.102 export, schema id unchanged.** `export.json` gains two top-level sections, `measured` (`page`, `retrieval` with `charsInPassagesTotal` and `charsInPassagesUnique`, `passages` without their group, `losses`, `robots`, `technical`, `render`, and under `derived`: `charsPastCap`, the legacy `charsUnread`, `phrases`, `narrativeWords`, `checks`) and `judgement` (`agent`, `model`, `groups`, `assignment`, `duplicates`, `plan`, `queries`, `facts`), plus `layers` (what each section holds) and `metrics` (id → `layer`, `label`, `formula`, `unit`, `threshold`, `limits`: the same text as the report's "?"). Every v1 and v2 field also stays at its old path with its old meaning (`judgement.agent` and `judgement.model` are where v2 put them; `retrieval` only gains `charsPastCap` and `charsInPassagesUnique`), so the schema id stays `getlooploop/vectorscope-reading@1`: nothing a v1 or v2 consumer reads moved or changed. The cost is that some values appear twice; moving them would have broken every saved prompt that reads `phrases` or `labelSource`.
- Compare mode writes `compare.json` (`getlooploop/vectorscope-compare@1`): every page's export under `pages[]`, plus `topics`, `topicTable`, `topicGaps`, `facts`, `factGaps`, `queries` (each with its `winner`) and `plan`. 2.102 adds `layers`, `metrics`, `measured.lossTable` (each page's waterfall and how many sections were cut) and, inside `judgement` beside `agent` and `model`, the shared `topics`, `facts`, `queries` and `plan`. The compare report ends with *Losses by page*, folded like the single report's panel: the table, then each page's waterfall and section map, each folded again.
- `reading.json` (`getlooploop/vectorscope-skill-reading@1`) gains `technical`, `robots`, `layout`, `losses` (2.102: the waterfall, the passages' placement, the removals and the section map) and, with `--render`, `render`. Its passages are unchanged from v1, and lens still accepts a v1 reading (as a baseline, for example); the checks that need the new fields are then skipped.

## Limits

- One public URL per reading (up to 5 in compare mode, read one after another). The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s). It checks every redirect hop (5 at most), for the page and for robots.txt.
- No login and no cookies: a page behind a sign-in is read as an anonymous visitor sees it. The fetch sends no Accept-Language, so a site that picks a language by location may answer in another language; pass the URL with its language parameter if so.
- No JavaScript in the reading. The product parses the fetched HTML with cheerio, and so does this skill. `--render` also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile and `--dump-dom`, and reports words and passages with JavaScript against the plain fetch; the reading itself stays the plain one. With no browser it says so and continues.
- 12-second timeout, 3,000,000-character ceiling, HTML only (`text/html` or `application/xhtml+xml`). robots.txt is read up to 500 KiB.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`, as the product does. `--html saved.html` reads a saved copy instead (robots.txt is then not checked unless `--robots saved.txt` is given); `--save-html page.html` keeps the fetched copy.
- Tests: `npm test` in `$SKILL` (Node's built-in runner, no network; it needs `npm install` for the check that `dist/` matches `scripts/`).

## Refusal codes

| Code | Tell the user |
|---|---|
| `invalid_url` | That does not look like a web address. Ask for the full URL of a page. |
| `blocked_scheme` | Only http and https pages can be read. (A bare `host:port` is read as a scheme too.) |
| `blocked_host`, `blocked_address` | That address is not a page on the public web: localhost, a private network, or a non-standard port. |
| `unreachable` | The page could not be reached. It may be down, or the name does not resolve. |
| `http_error` | The page returned an error (the HTTP status is in the JSON), not a document. |
| `blocked` | The site turns automated readers away (HTTP 401, 403 or 429). Its policy blocks scanners, so retrying will not help. |
| `not_html` | The URL is a file such as a PDF or an image, not an HTML page. |
| `too_large` | The page is over the 3 MB ceiling. |
| `empty` | The page answered, but no readable text was left once navigation and boilerplate were removed, or the URL is a feed, sitemap or file. |
| `refused_language_ru` | The page is in Russian, and this tool does not analyse pages in Russian. One line in the chat, the report, nothing more. |


## No network in the shell, or nowhere to install

Some agents run their shell with no internet (cloud sandboxes such as Codex in the cloud or ChatGPT), or cannot write to their skills folder.

- **The skill folder can live anywhere.** If the agent's skills folder is read-only, unpack `vectorscope.zip` (or copy this folder) into any directory you can write, such as the working directory, and use that folder as `$SKILL`. Nothing needs installing. Copying file by file (through a file connector, say) works too, as long as `dist/` comes whole, `dist/chunks/` included; no file in it is over 700 KB. If you cannot get the files at all (no network, downloads blocked), ask the user to attach `vectorscope.zip` from the repository's Releases, and wait.
- **No network in the shell:** read.mjs prints `REFUSED unreachable`. Ask the user for a saved copy: the page saved from their browser as "Web page, HTML only" (Ctrl+S, or Cmd+S on a Mac), and, if they can, the site's robots.txt (open `<site>/robots.txt` and save it as text). Then run `node "$SKILL/dist/read.mjs" <url> --html page.html --robots robots.txt --out reading.json` and go on with step 2. Without `--robots`, robots.txt is reported as not checked. The report says it read a saved copy.
- **Only files the user gives you.** Do not make the saved copy yourself with a browsing or fetch tool: those return text or Markdown converted from the page, not its HTML, and the reading would not be the page's. And do not fill in for the scripts: a check made by hand is not this tool's result.

## If the page cannot be fetched

The run fetches the page and `/robots.txt` on the same site with Node's own `fetch`. When that fails, read.mjs prints `REFUSED unreachable` (or another code from the table above) and writes the refusal into the reading. Say what the code means, and in a sandbox say what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows, and the page's site has to be among it. On Free, Pro and Max plans the setting is **Allow network egress**, under Settings > Capabilities with **Code execution and file creation**; by default it lets code reach approved package sources. On Team and Enterprise plans an owner sets it in Organization settings > Capabilities: off, package managers only (the default), package managers and specific domains, or all domains; with specific domains, the page's domain must be on the list. Tell the user which setting decides it. If their plan's setting cannot allow the site, say that this page cannot be read from claude.ai, and that the same skill runs in Claude Code or another agent on their own machine. Then stop; do not fetch the page some other way.
- **Behind a proxy:** if the environment sets `HTTPS_PROXY` or `HTTP_PROXY` and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front of the command (Node 22.21 or later, or 24 or later). Node's `fetch` ignores those variables otherwise.
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Say which code came back and stop.

Whatever the cause, do not fill in for the scripts. A count, a cut or a check made by hand is not this tool's result.
