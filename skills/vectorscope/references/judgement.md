Read this when you are about to write `groups.json`, `topics.json`, `facts.json`, `queries.json`, `style.json` or `plan.json`.

# The judgement files

lens.mjs validates each file and refuses with a message that names what to fix. Write every file with the file-writing tool, never a shell heredoc.

## Common rules

- Page numbers are 1-based, as in the manifest; single mode is page 1. Passage ids are the reading's 0-based `index`.
- Every quote, `evidence` and `before` is copied **verbatim** from the passage it cites. The scripts fold whitespace, curly quotes, dashes and case, and refuse anything else.
- `agent` (the product you run in, for example "Claude Code", "claude.ai", "Codex", "opencode", "Hermes") and `model` (your model's name as you know it): optional, at most 60 characters each. If you do not know one, leave it out; the report then says "model not stated by the agent". Never guess or invent either.

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

- `members`: each passage id in exactly 1 group. The script renumbers groups by their earliest passage.
- `label`: optional, at most 80 characters. The report shows it first and keeps the computed label (a heading most members share, else the 2 most distinctive words) as the "label source".
- `topic`: required in compare mode; an id from `topics.json`.
- `duplicates`: `"later": earlier`, only for a near-verbatim repeat of an earlier **non-adjacent** passage. Adjacent passages are never duplicates. Most pages have none.
- Compare mode: the same `agent` and `model` in every `groups-<n>.json`.
- The v1 shape, `{"groups": [[0, 1, 2], [3, 4]]}`, still works and can be mixed with the new one.

Group as the product's average-link clustering does:

1. **Same subject, same group:** the same topic, product, question or procedure. Adjacency or a shared heading alone is not enough.
2. **Join the group, not 1 member.** A passage must fit the whole group. Do not chain A–B–C when A and C share nothing.
3. **Ignore the overlap.** Neighbouring passages share about 200 characters by design.
4. **At most 6 groups.** With more subjects, merge the 2 closest until 6 or fewer remain.
5. **2 to 5 groups** on a normal page. 1 group only for a page of 1 or 2 passages.
6. A passage with no shared subject gets its own group. Side-path passages are grouped by subject too.
7. **Labels name the subject** in the page's language: "Revalidation with ETag", not "Validation stuff". Never name a subject the passages do not cover.

## topics.json (compare mode)

```json
{ "topics": [ { "id": "freshness", "name": "Freshness: max-age, Expires, heuristics" } ] }
```

- 1 file for all pages, written **before** the groups.
- Ids: lowercase slugs (`a-z`, `0-9`, `-`, `_`). At most 12 topics.
- A topic for every subject any page covers, named neutrally, not after 1 page's heading.
- 2 groups of 1 page can share a topic. A topic only 1 page covers is a topic gap, and allowed.

## facts.json

```json
{ "facts": [ { "id": "f1", "fact": "max-age=31536000 caches for one year.", "topic": "patterns", "pages": { "1": [16, 20], "2": [6] } } ] }
```

- A fact is concrete and citable: a number, name, rule, definition, date or specific claim. "The page explains caching" is not a fact.
- Each fact **once**, with every page and passage that states it in any wording. Leave out pages that do not state it.
- Single mode: `"passages": [16, 20]` can replace `pages`.
- List every fact, not a sample: the fact gaps depend on it.

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

- 5 to 10 queries. Use the user's own when given (`"source": "user"`). Else write what a person would type into an assistant (`"source": "generated"`), with at least 1 the page probably does not answer.
- Per page:
  - `passage`: the 1 passage a retriever should return, or `null`.
  - `verdict`: `complete` (the passage alone answers it), `partial` (it leaves part out, or needs a neighbouring passage), `missing`.
  - `citable`: `true` only if the quote makes sense alone, with its subject in it. "It does this automatically" is not citable.
  - `quote`: the exact answering words, at most 400 characters. Required unless `missing`.
- Judge only from the passages, never from what you know.
- Single mode: `"result": {…}` can replace `results`.

The report counts verdicts per page; in compare mode it names who wins each query (better verdict, then citable; ties shown).

## style.json

```json
{ "agent": "<your agent>", "model": "<your model name>",
  "passages": [
    { "passage": 3, "verdict": "specific", "evidence": "Free for up to 5 clients.", "why": "a limit a reader can check" },
    { "passage": 5, "verdict": "generic", "evidence": "unlock its full potential", "why": "names no integration" } ] }
```

- The swap test, 1 verdict for **every** passage, each once: would it fit a competitor's page with only the brand name changed?
- `verdict`: `generic` if yes; `specific` if it holds something only this page could say (a number, name, limit, procedure, first-hand detail).
- `evidence`: the deciding words, verbatim, at most 200 characters. `why`: optional, 1 short line in the user's language.
- Judge the passage, not the page and not who wrote it. This is not an AI detector.

The report shows your verdicts beside the Pattern score and marker words, and shows both where they disagree.

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

- Required: `priority` (whole number, 1 is first), `problem`, `fix`. `page` defaults to 1.
- `check`: a code from `checks.md`, or `null` for a problem you found by reading. A code that did not fire gives a warning; say why it applies.
- `before` and `after`: both or neither; `before` is verbatim from 1 of `passages`. Give them for the weakest passages, at least 2 or 3 per page.
- An item with no passages (for example a site-wide check): set `"passages": []`. Leave out `before` and `after`. Do not set them to `null`.
- Write the plan after the checks, so it can cite them.

**Every passage must stand on its own:** a retriever returns it without the passage before it, the page title, or the heading above it. So the rewrite:

- names the product or subject instead of "it", "this", "our editor", "the tool";
- keeps the question next to its answer;
- keeps the fact (number, limit, date) in the same sentence as the claim;
- opens on the subject, not mid-sentence or on a transition;
- says in a sentence what an image, widget or table shows.

Order: blocked crawlers and noindex; text past the cap; lost questions or subjects; thin or fragmented sections; markup.

Keep `after` faithful: rewrite what the page says, never add claims.
