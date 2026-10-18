# The files you write (judgement)

Read this before writing `groups.json`, `topics.json`, `facts.json`, `queries.json`, `style.json` or `plan.json`. lens.mjs validates each file and refuses with a message naming what to fix.

Page numbers are 1-based (as in the manifest; single mode is page 1). Passage ids are the `index` values in the reading, 0-based. Every quote and every `before` text must be copied **verbatim** from the passage it cites: the scripts fold whitespace, curly quotes, dashes and case, and refuse anything else.

## groups.json

```json
{
  "groups": [
    { "members": [0, 1, 2], "label": "What the HTTP cache is", "note": "optional, up to 240 characters", "topic": "what" },
    { "members": [3, 4] }
  ],
  "duplicates": { "7": 2 },
  "agent": "<your agent>",
  "model": "<your model name>"
}
```

`agent` and `model` (optional, up to 60 characters each) say who did the reading; the report's info panel shows them next to the groups, the plan and the query test, because another model may group a little differently. Fill them in honestly with what you know about yourself: `agent` is the product you are running in (for example "Claude Code", "claude.ai", "Codex", "opencode", "Hermes"), `model` is your model's name as you know it. If you do not know one, leave it out: the report then says "model not stated by the agent". Never guess or invent either. In compare mode, put the same two fields in every `groups-<n>.json`.

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

## topics.json (compare mode)

```json
{ "topics": [ { "id": "freshness", "name": "Freshness: max-age, Expires, heuristics" } ] }
```

One dictionary for all pages, written **before** the groups, so the groups line up across pages. Ids are short lowercase slugs (`a-z`, `0-9`, `-`, `_`); at most 12 topics. Make a topic for every subject any page covers, named neutrally (not after one page's heading). Two groups of one page may share a topic. A topic only one page covers is fine: that is what a topic gap is.

## facts.json

```json
{ "facts": [ { "id": "f1", "fact": "max-age=31536000 caches for one year.", "topic": "patterns", "pages": { "1": [16, 20], "2": [6] } } ] }
```

A fact is something concrete and citable: a number, a name, a rule, a definition, a date, a specific claim. Not "the page explains caching". Write each fact **once** and list every page and passage that states it, in any wording; leave a page out when it does not state it. In single mode `"passages": [16, 20]` may replace `pages`. List every fact the pages give, not a sample: the fact gaps are only as fair as this list.

## queries.json

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

## style.json

```json
{ "agent": "<your agent>", "model": "<your model name>",
  "passages": [
    { "passage": 3, "verdict": "specific", "evidence": "Free for up to 5 clients.", "why": "a limit a reader can check" },
    { "passage": 5, "verdict": "generic", "evidence": "unlock its full potential", "why": "names no integration" } ] }
```

The swap test, one verdict for **every** passage: would this passage fit a competitor's page with only the brand name changed? `generic` if yes, `specific` if it holds something only this page could say (a number, a name, a limit, a procedure, a first-hand detail). `evidence` is the words that decided it, verbatim from that passage (at most 200 characters); `why` is optional, one short line in the user's language. Judge the passage, not the page, and not who wrote it: this is not an AI detector, and the report says so. The script checks every passage is judged once and every quote is verbatim, then shows your verdicts beside PatternScope's score and the marker words; where they disagree it shows both and averages nothing.

`agent` and `model` follow the same rule as in groups.json: filled in honestly, or left out.

## plan.json

```json
{
  "items": [
    { "priority": 1, "page": 1, "passages": [3], "check": "mid_sentence_start",
      "problem": "…", "fix": "…",
      "before": "verbatim text from passage 3", "after": "the rewrite" }
  ]
}
```

Priority 1 is first. `check` is a check code (see `checks.md`) or `null` for a problem you found by reading. `page` defaults to 1. `before` and `after` go together; give them for the weakest passages, at least two or three per page.

**The guiding principle: every passage must stand on its own, because a retriever sees it alone.** A passage is returned without the one before it, without the page title and without the heading above it unless the heading is inside it. So the rewrite:

- names the product or subject instead of "it", "this", "our editor", "the tool";
- keeps the question next to its answer (an FAQ answer without its question is a fact with no address);
- keeps the fact next to the claim (the number, the limit, the date in the same sentence as the promise);
- opens on the subject, not mid-sentence and not on a transition;
- says in a sentence what an image, a widget or a table shows.

Order the plan by what changes retrieval most: blocked crawlers and noindex first, then text past the cap, then passages whose questions or subjects were lost, then thin or fragmented sections, then markup. Keep `after` faithful to the page: rewrite what it says, never add claims it does not make. Write the plan after you have the checks, so it can cite them.
