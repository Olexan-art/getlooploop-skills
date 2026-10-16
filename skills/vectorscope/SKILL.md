---
name: vectorscope
description: Show how a retrieval system (an AI assistant's search step, a RAG pipeline) reads one public web page. It fetches the page, extracts the text a crawler keeps, cuts it into passages with the GetLoopLoop Vectorscope's exact chunker and 26-passage cap, groups the passages into topics, and reports labels, keywords, side-path content and what fell past the cap. Use it when the user asks how an AI assistant, retriever or RAG system reads a page, what passages a page splits into, what falls past a retrieval cap, how a page's content groups into topics, which words a page keeps using, or asks for "vectorscope" by name. The grouping is done by reading the passages, not with embeddings.
---

# Vectorscope (local, no embeddings)

Three steps. Steps 1 and 3 are scripts that run the product's exact rules. Step 2 is your judgement. Run every command from this skill's folder.

**First run:** if `node_modules/` is missing here, run `npm install --omit=dev` (it installs cheerio and nothing else). Requires Node 18 or later.

## 1. Read the page

```
node scripts/read.mjs <url> --out reading.json
```

This fetches the page (one plain HTTP GET, no JavaScript), extracts the visible text, chunks it, applies the 26-passage cap and marks side-path passages. It writes `reading.json` with the page fields and every passage: `index`, `heading`, `contentRole` (`main` / `related` / `utility`), `charCount`, and the full `text`.

If the script prints `REFUSED <code>` (exit code 2), stop and tell the user what the code means (see the table below). Do not retry with a different URL unless they ask.

## 2. Group the passages (your judgement)

Read the `text` of **every** passage in `reading.json`, in full. Then group them the way the product's average-link clustering would:

- **Same subject, same group.** Put two passages together when a reader would say they are about the same thing: the same topic, product, question or procedure. Sitting next to each other or sharing a heading is not enough on its own.
- **Join the group, not one member.** A passage joins a group only if it fits the group as a whole, not just its nearest neighbour. Do not chain A–B–C when A and C have nothing in common.
- **Ignore the overlap.** Neighbouring passages share about 200 characters by design. That shared text is not evidence that they belong together.
- **At most 6 groups.** If you see more subjects than that, merge the two closest subjects, and keep merging until there are 6 or fewer.
- **Every page splits into its facets.** The product's cut is relative to the page itself, so a page about one subject still splits into the parts it covers. Expect 2 to 5 groups on a normal page. Use a single group only when the page has one or two passages.
- **Alone is allowed.** A passage that shares no subject with any other passage gets a group of its own.
- **Side-path passages are grouped like any others,** by subject. The report lists them separately.
- **Duplicates:** if a passage repeats an earlier, **non-adjacent** passage almost word for word (repeated boilerplate, a call to action printed twice), record `"later": earlier`. Adjacent passages are never duplicates. Most pages have none.
- Each passage index appears **exactly once**. Number groups in reading order, so group 0 holds passage 0. The script also renumbers them.

Write `groups.json`:

```json
{"groups": [[0, 1, 2], [3, 4], [5]], "duplicates": {"7": 2}}
```

## 3. Compute the read-out

```
node scripts/lens.mjs reading.json groups.json --md report.md --json export.json
```

The script checks the grouping. If it prints `REFUSED groups.json: …`, fix what it names and run it again. It then computes each group's label (a heading shared by most of the group's passages, or else the group's two most distinctive words), passage and character counts, share of the indexed text, the page's keywords with how many groups each one reaches, and the side-path list. It writes:

- `report.md`: the reading, laid out like the live page;
- `export.json`: the product's `getlooploop/vectorscope-reading@1` shape. Every field that needs vectors (cohesion, selfSimilarity, groupFloor, projection, embeddingModel, dimensions) is `null`.

## Presenting the result

- Lead with the pipeline line and the counters: passages read, slots used out of 26, characters past the cap.
- Show the groups table. Quote a label as the section's name only when its source is `heading`. A `keywords` label is a hint.
- Name any side-path passages, and say they are still indexed.
- Give the keywords in two lists: "describes the page" and "belongs to one section".
- End with the closing sentence from the report: what the cap left unread, or that nothing was left out.
- Always say, once, that the groups are your reading of the passages and not an embedding clustering. The chunking and the cap are the product's exact rules. For the embedding-based reading with the map, point to https://www.getlooploop.com/vectorscope.
- Do not claim that any assistant has indexed the page. This is a preview of the machine's view, not a guarantee of what any assistant does with it.
- A very low word count on a page that looks rich in a browser usually means its content is drawn by JavaScript. Say so: an assistant that does not run JavaScript reads about that much and no more.

## Limits

- One public URL per run. The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s). It checks every redirect hop (5 at most).
- No login and no cookies: a page behind a sign-in is read as an anonymous visitor sees it.
- No JavaScript rendering. The product does not render JavaScript either: it parses the fetched HTML with cheerio, and so does this skill.
- 12-second timeout, 3,000,000-character ceiling, HTML only (`text/html` or `application/xhtml+xml`).
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`, as the product does.

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

