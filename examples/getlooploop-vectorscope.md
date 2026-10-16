# Vectorscope reading: Semantic Chunking Visualizer for Any URL — Vectorscope

> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the 26-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.
>
> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (model not stated by the agent). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.
>
> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the 26-passage cap is this tool's.
>
> **Three kinds of number.** Every section and number carries a marker: `measured` is what the parser saw, `derived` is computed from it by a fixed formula, `judgement` is the agent's reading. *How each number is computed*, at the end, gives every formula.

| | |
|---|---|
| URL | https://www.getlooploop.com/vectorscope |
| Title | Semantic Chunking Visualizer for Any URL — Vectorscope |
| Words | 2,463 `measured` |
| Headings found | 14 `measured` |
| noindex | no |

**Pipeline:** Fetched → Extracted 2,463 words · 14 headings → Chunked 17 passages · 14,211 chars → Grouped 6 groups · 0 repeats (by reading; no embedding step)

## Counters `measured` `derived`

- **17** passages read `measured`
- **17/26** slots used of the 26-passage cap `measured`
- **0** characters past the cap, not read `derived`: the kept text after the last passage, counted only when every slot is filled.
- **13,547** characters of unique text in passages `derived`
- **14,211** characters in passages, overlap and intro included `measured`

## Where the text goes `measured` `derived`

Characters, whitespace runs folded to one space. "Text in the raw HTML" is the kept text plus every removal, so the stages sum exactly.

| Stage | Characters | Share | Layer |
|---|---|---|---|
| Text in the raw HTML (estimate) | 48,098 | 100% of raw | `derived` |
| Removed by the cleaner | 34,177 | 71.1% of raw | `measured` |
| Kept: the chunker's input | 13,921 | 28.9% of raw | `measured` |
| In passages, unique | 13,547 | 97.3% of kept | `derived` |
| Kept, in no passage text | 374 | 2.7% of kept | `derived` |
| Past the cap | 0 | 0% of kept | `derived` |

The passages hold 14,211 characters in all: 13,547 unique, plus 378 of overlap between neighbours and 286 of intro (title, h1, description) in passage #0. Of the kept text in no passage: 298 in h2 heading lines, 76 spaces between sections.

### What the cleaner removed `measured`

45 elements with text, 34,177 characters. By reason: script, style, noscript, template 32,534 (27) · svg, canvas, iframe, embed 33 (1) · head (title, meta) 54 (1) · [hidden] or aria-hidden 284 (7) · page header (site banner) 68 (1) · navigation (nav, role=navigation) 16 (1) · footer 749 (1) · aside, role=complementary 339 (1) · form, button, select, input 100 (5).

| Reason | Element | Path | Chars | Its text begins |
|---|---|---|---|---|
| script, style, noscript, template | `script` | script | 3,689 | “self.__next_f.push([1,"17:[[\"$\",\"title\",\"0\",{\"children\":\"Semantic Chunk…” |
| script, style, noscript, template | `script` | script | 2,939 | “self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\…” |
| script, style, noscript, template | `script` | script | 2,769 | “{"@context":"https://schema.org","@type":"FAQPage","@id":"https://www.getlooploo…” |
| script, style, noscript, template | `script` | script | 2,396 | “self.__next_f.push([1,"2:[\"$\",\"html\",null,{\"lang\":\"en\",\"suppressHydrati…” |
| script, style, noscript, template | `script` | script | 2,292 | “self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@type\":\"DefinedT…” |
| script, style, noscript, template | `script` | script | 2,148 | “{"@context":"https://schema.org","@type":"DefinedTermSet","@id":"https://www.get…” |
| script, style, noscript, template | `script` | script | 1,849 | “self.__next_f.push([1,"11:I[24431,[],\"OutletBoundary\"]\n14:I[24431,[],\"Viewpo…” |
| script, style, noscript, template | `script` | script | 1,653 | “self.__next_f.push([1,"0:{\"P\":null,\"b\":\"L-uh39B74nD4XsnIRp5Gc\",\"p\":\"\",…” |
| script, style, noscript, template | `script` | script | 1,269 | “self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@type\":\"HowTo\",…” |
| script, style, noscript, template | `script` | script | 1,255 | “self.__next_f.push([1,"7:[\"$\",\"script\",\"5\",{\"type\":\"application/ld+json…” |
| script, style, noscript, template | `script` | script | 1,251 | “self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@type\":\"Software…” |
| script, style, noscript, template | `script` | script | 1,226 | “self.__next_f.push([1,"10:I[78297,[\"2619\",\"static/chunks/2619-3285f830dd579a0…” |
| script, style, noscript, template | `script` | script | 1,184 | “self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@graph\":[{\"@type…” |
| script, style, noscript, template | `script` | script | 1,153 | “{"@context":"https://schema.org","@type":"HowTo","@id":"https://www.getlooploop.…” |
| script, style, noscript, template | `script` | script | 1,143 | “{"@context":"https://schema.org","@type":"SoftwareApplication","@id":"https://ww…” |
| script, style, noscript, template | `script` | script | 1,136 | “self.__next_f.push([1,"8:[\"$\",\"$Ld\",null,{\"parallelRouterKey\":\"children\"…” |
| script, style, noscript, template | `script` | script | 1,070 | “{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https:…” |
| script, style, noscript, template | `script` | script | 856 | “{"@context":"https://schema.org","@type":"WebPage","@id":"https://www.getlooploo…” |
| footer | `footer.border-t.border-white/10` | div.marketing-root > footer.border-t.border-white/10 | 749 | “GetLoopLoop Find where a brand loses AI-search conversations. Close the gap. Pro…” |
| aside, role=complementary | `div.pt-card.pt-card--active` | … > div.pt-16 > div.pt > div.mx-auto > div.pt-card.pt-card--active | 339 | “New · free · open source Run Vectorscope inside your coding agent The Vectorscop…” |

25 more elements, 1,811 characters, not listed here (export.json lists up to 200 and sums the rest).

85 more matched elements held no text.

### How much of each section reached a passage `derived`

| Section | Reached a passage | Of | Share |
|---|---|---|---|
| *Intro: title, h1, description* | 286 | 286 | 100% |
| *Before the first h2* | 804 | 804 | 100% |
| What does this mean? | 259 | 259 | 100% |
| Important passage outside the cap? | 139 | 139 | 100% |
| Models and retrieval caps vary. | 246 | 246 | 100% |
| How to read your result | 2,257 | 2,257 | 100% |
| What is semantic chunking? | 1,994 | 1,994 | 100% |
| Is my content ready for AI search? | 1,126 | 1,126 | 100% |
| Using Vectorscope to test a RAG pipeline | 863 | 863 | 100% |
| Who is Vectorscope for? | 890 | 890 | 100% |
| Words used on this page | 1,400 | 1,400 | 100% |
| Keep reading | 437 | 437 | 100% |
| Questions people ask about this | 2,107 | 2,107 | 100% |
| Other free AI search tools | 746 | 746 | 100% |
| What this cannot show you | 279 | 279 | 100% |

## Checks `measured` `derived`

### AI crawlers and robots.txt `measured`

| Crawler | Vendor | What it does | This page | Deciding rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | assistant search index | allowed | `Allow: /vectorscope` (via *) |
| ChatGPT-User | OpenAI | fetches when a user asks (vendor: robots.txt may not apply) | allowed | `Allow: /vectorscope` (via *) |
| GPTBot | OpenAI | training data | allowed | `Allow: /vectorscope` (via *) |
| Claude-SearchBot | Anthropic | assistant search index | allowed | `Allow: /vectorscope` (via *) |
| Claude-User | Anthropic | fetches when a user asks | allowed | `Allow: /vectorscope` (via *) |
| ClaudeBot | Anthropic | training data | allowed | `Allow: /vectorscope` (via *) |
| PerplexityBot | Perplexity | assistant search index | allowed | `Allow: /vectorscope` (via *) |
| Perplexity-User | Perplexity | fetches when a user asks (vendor: robots.txt may not apply) | allowed | `Allow: /vectorscope` (via *) |
| Google-Extended | Google | training data | allowed | `Allow: /vectorscope` (via *) |
| Googlebot | Google | web search index | allowed | `Allow: /vectorscope` (via *) |
| Bingbot | Microsoft | web search index | allowed | `Allow: /vectorscope` (via *) |
| CCBot | Common Crawl | training data | allowed | `Allow: /vectorscope` (via *) |

### Technical markup `measured`

- **JSON-LD:** Answer, BreadcrumbList, DefinedTerm, DefinedTermSet, FAQPage, HowTo, HowToStep, ListItem, Offer, Organization, Person, Question, SoftwareApplication, Thing, WebPage, WebSite
- **Canonical:** https://www.getlooploop.com/vectorscope (this page)
- **Meta description:** 152 characters

### Findings `derived`

- **[medium] Passages that start mid-sentence** `mid_sentence_start` · passages #6 #14  
  2 passage(s) open on a lowercase word or a punctuation mark.  
  - #6 “to quote. The passage a question actually retrieves Asking the page a question …”
  - #14 “after the reading is produced. No account is needed, so there is nothing to att…”
  *What to do:* The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.
- **[medium] Navigation inside the content** `nav_in_content` · passages #1  
  1 run(s) of four or more one-or-two-word lines.  
  - #1 “1. Fetched · 2. Extracted · 3. Chunked · 4. Embedded · 5. Grouped · passages read”
  *What to do:* Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.
- **[low] Thin sections** `thin_section` · passages #3  
  1 heading(s) with fewer than 150 characters under them.  
  - #3 “Important passage outside the cap? (139 chars)”
  *What to do:* A passage this short cannot answer much on its own. Merge it into a neighbour or say what the heading promises.
- **[low] The same words in most groups** `repeated_claim` · passages #2 #7 #8  
  1 phrase(s) recur across at least half of the 6 groups.  
  - “the question semantic chunking (3 groups)”
  *What to do:* Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.

## Rewrite plan `judgement`

The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.

1. `nav_in_content` · passages #1  
   **Problem:** The empty result widget is inside main, so its step labels and counter captions become passage #1: a retriever stores "1. Fetched 2. Extracted …" as content.  
   **Fix:** Render the result widget only after a run, or mark the placeholder aria-hidden and move it out of main. If the counts should stay readable, say them in one sentence.
   - *Before:* passages read slots used of the 26-passage cap characters the cap cut off (0 when the page fits)
   - *After:* For each page, Vectorscope reports three counts: the passages it read, the slots used of its 26-passage cap, and the characters the cap cut off.
2. `mid_sentence_start` · passages #5 #6  
   **Problem:** "How to read your result" is 2,450 characters under one h2, so the 2,000-character window cuts it and passage #6 opens with "to quote." mid-sentence.  
   **Fix:** Make each of the four readings its own h2 ("Chunks that never reach the index", "The extraction ratio", …), so every passage starts where its topic starts and carries the heading that names it.
   - *Before:* to quote. The passage a question actually retrieves Asking the page a question returns the passages that answer it, ranked, using only that page
   - *After:* Which passage does a question retrieve? Asking Vectorscope a question returns the passages of the page that answer it, ranked, using only that page.
3. `mid_sentence_start` · passages #13 #14  
   **Problem:** The FAQ is one h2 of 2,292 characters; the window splits the answer to "Is it really free?" across two passages, and #14 opens with "after the reading is produced".  
   **Fix:** Split the FAQ into two h2 sections (AI citations; using Vectorscope), each under 2,000 characters, so no answer is cut away from its question.
   - *Before:* after the reading is produced. No account is needed, so there is nothing to attach it to.
   - *After:* Vectorscope does not keep the fetched page once the reading is produced, and it needs no account, so nothing is attached to you.
4. `thin_section` · passages #3  
   **Problem:** "Important passage outside the cap?" has 139 characters under it, and the answer leans on the heading: "Move it earlier" says nothing to a retriever that sees the passage alone.  
   **Fix:** Repeat the subject in the answer and name the cap, so the passage stands on its own.
   - *Before:* Move it earlier on the page, or split the page so that passage has a budget of its own.
   - *After:* If an important passage falls outside Vectorscope's 26-passage cap, move it earlier on the page, or split the page so that passage has a budget of its own.
5. passages #16  
   **Problem:** "One page on its own." opens the passage with no subject; read alone it does not say what is limited.  
   **Fix:** Name the product and the limit in the first sentence.
   - *Before:* One page on its own.
   - *After:* Vectorscope reads one page on its own.

## Query test `judgement`

The agent's judgement: for each typical query, the best passage and whether it answers on its own.

| Query | Source | Best passage | Answer | Citable | The words that answer |
|---|---|---|---|---|---|
| what is semantic chunking | generated | #7 | complete | yes | “Semantic chunking is splitting a page into passages where its meaning changes, instead of every fixed number of characters or at every heading.” |
| does Vectorscope use semantic chunking | generated | #13 | complete | yes | “Does Vectorscope use semantic chunking? Not to cut the page. Vectorscope cuts at every h2” |
| how many passages of a page does a retriever read | generated | #3 | partial | no | “This reading takes at most 26 passages from a page.” |
| how do I get cited in AI Overviews | generated | #13 | complete | yes | “Give the answer its own passage, under a heading that names the question, high enough on the page to survive the retrieval cap.” |
| what is the extraction ratio | generated | #5 | complete | yes | “The extraction ratio is how much of the page turned into readable text” |
| how to compare my RAG chunker against a reference | generated | #9 | complete | yes | “Run a page you already index, and compare the passage boundaries with your own chunker's” |
| is Vectorscope free | generated | #14 | complete | yes | “Is it really free? Yes, with a rate limit rather than a paywall.” |
| which chunking strategy is best for RAG | generated | #7 | partial | no | “Fixed-length chunking cuts every N characters and is the default in most pipelines because it is trivial to implement.” |

## The groups this page falls into `judgement`

| Group | Label | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|
| 0 | What Vectorscope is, and what its reading does not prove | keywords: Visualizer · Machine | 5 | 1,734 | 12.2% |
| 1 | How to read the four results | heading: How to read your result | 2 | 2,450 | 17.2% |
| 2 | Chunking strategies and the terms behind them | keywords: Grouping · Length | 2 | 3,394 | 23.9% |
| 3 | What the tool can and cannot tell you, and who it is for | keywords: Whether · Against | 4 | 3,158 | 22.2% |
| 4 | Links to further reading and other tools | keywords: Three · Questions | 2 | 1,183 | 8.3% |
| 5 | FAQ: AI citations and how Vectorscope works | heading: Questions people ask about this | 2 | 2,292 | 16.1% |

Label is the agent's name for the group when it gave one. Label source is the computed label: "heading" is the page's own section heading and can be quoted; "keywords" is the group's two most distinctive words, a hint and not what the section is called.

- **0 · What Vectorscope is, and what its reading does not prove:** The intro, the empty result widget, and three short caveats.
- **1 · How to read the four results:** Cap, extraction ratio, groups, and the passage a question retrieves; one long section the window cuts in two.
- **5 · FAQ: AI citations and how Vectorscope works:** The questions survive as text, so each answer keeps its question.

## Passages, by group `measured` `judgement`

In reading order inside each group. Each line shows how the passage opens (its first 240 characters).

### 0 · What Vectorscope is, and what its reading does not prove (5 passages)

- **#0** *Semantic Chunking Visualizer for Any URL — Vectorscope* · 286 chars  
  Semantic Chunking Visualizer for Any URL — Vectorscope Semantic chunking, made visible: see what survives the trip into vector space. Free semantic chunking visualizer: paste a URL and see the passages a retriever cuts, how they group by me…
- **#1** 804 chars  
  Free tool No account Experimental Vectorscope Semantic chunking, made visible: see what survives the trip into vector space. Vectorscope is a free semantic chunking visualizer: it cuts one URL into the passages a retrieval system would stor…
- **#2** *What does this mean?* · 259 chars  
  The reading shows which passages of your page a retriever can receive, and how they group by meaning — the question semantic chunking asks, put to passages already cut. It is a preview of the machine's view, not a guarantee of what any assi…
- **#3** *Important passage outside the cap?* · 139 chars  
  Move it earlier on the page, or split the page so that passage has a budget of its own. This reading takes at most 26 passages from a page.
- **#4** *Models and retrieval caps vary.* · 246 chars  
  This does not establish that any assistant has indexed the page. Each system does its own chunking — fixed windows, headings or semantic chunking — and embeds and caps in its own way; this is the pipeline the product runs. Sources and metho…

### 1 · How to read the four results (2 passages)

- **#5** *How to read your result* · 1,995 chars  
  Four readings decide whether a page is legible to a retrieval system. Here is what each one means when it is bad. Chunks that never reach the index A retrieval system reads a fixed number of passages from a page and ignores the rest, so any…
- **#6** *How to read your result* · 455 chars  
  to quote. The passage a question actually retrieves Asking the page a question returns the passages that answer it, ranked, using only that page — which is the closest thing to watching a model decide what your page is for. If the returned…

### 2 · Chunking strategies and the terms behind them (2 passages)

- **#7** *What is semantic chunking?* · 1,994 chars  
  Semantic chunking is splitting a page into passages where its meaning changes, instead of every fixed number of characters or at every heading. Vectorscope does not cut that way: it cuts at each h2 and then in fixed windows, and its semanti…
- **#11** *Words used on this page* · 1,400 chars  
  The terms this page relies on, each defined once, because a page that uses them without defining them is a page an assistant cannot explain to anybody. Semantic chunking Cutting text into passages where its meaning changes, rather than at a…

### 3 · What the tool can and cannot tell you, and who it is for (4 passages)

- **#8** *Is my content ready for AI search?* · 1,126 chars  
  This page answers that question for one URL at a time, honestly, which means naming what it cannot see as clearly as what it can. What this tool can tell you How much of your page becomes readable text at all, as a ratio and not an adjectiv…
- **#9** *Using Vectorscope to test a RAG pipeline* · 863 chars  
  If you build retrieval rather than content, this page is a reference implementation you can point at any URL in about twenty seconds. 1 Run a page you already index, and compare the passage boundaries with your own chunker's — fixed windows…
- **#10** *Who is Vectorscope for?* · 890 chars  
  Vectorscope is for anyone whose page has to be read in passages: the people who write it, and the people who build the retrieval that reads it. Both get the same reading — the cut, the cap, and the semantic chunking question of which passag…
- **#16** *What this cannot show you* · 279 chars  
  One page on its own. Whether that page answers the questions people actually ask an assistant, how it stands against a rival page on the same subject, and which topics your site has no page for at all — those need a corpus of the whole site…

### 4 · Links to further reading and other tools (2 passages)

- **#12** *Keep reading* · 437 chars  
  Longer answers to the questions this page can only summarise. What semantic chunking is, and what it trades away The three strategies, side by side, on the same page. How to optimise content for AI search What actually changes a passage's c…
- **#15** *Other free AI search tools* · 746 chars  
  Voicescope Start with one keyword and explore the questions a person may ask an AI assistant across real-life contexts. Brandscope Ask three AI assistants the buyer questions around a brand, then compare their answers with the brand's own p…

### 5 · FAQ: AI citations and how Vectorscope works (2 passages)

- **#13** *Questions people ask about this* · 1,992 chars  
  How does AI Mode choose which sources to cite? Nobody outside Google can state the mechanism, and this page will not pretend to. What is observable is that cited pages tend to contain a passage that answers the query completely on its own,…
- **#14** *Questions people ask about this* · 300 chars  
  after the reading is produced. No account is needed, so there is nothing to attach it to. Is it really free? Yes, with a rate limit rather than a paywall. The limit exists because every reading spends an embedding call, and it resets on a f…

## Side-path content `derived`

No passage looks like related links or utility copy.

## The page's vocabulary `derived`

*What the page says, not search demand — for how people ask, use the query test or https://www.getlooploop.com/voicescope.*

### Phrases this page owns

Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses.

1. semantic chunking (23; 12 passages; 6 of 6 groups; describes the page)
2. fixed window (5; 5 passages; 4 of 6 groups; describes the page)
3. retrieval system (4; 3 passages; 3 of 6 groups)
4. stand alone (3; 3 passages; 3 of 6 groups)
5. readable text (3; 3 passages; 3 of 6 groups)
6. meaning changes (3; 3 passages; 2 of 6 groups)
7. heading aware (4; 2 passages; 2 of 6 groups)
8. heading aware chunking (3; 2 passages; 2 of 6 groups)
9. semantic chunking visualizer (3; 2 passages; 1 of 6 groups)
10. extraction ratio (3; 2 passages; 2 of 6 groups)
11. fixed length (3; 2 passages; 1 of 6 groups)
12. long section (3; 2 passages; 2 of 6 groups)
13. free semantic chunking visualizer (2; 2 passages; 1 of 6 groups)
14. repeated sentence shapes (2; 2 passages; 2 of 6 groups)
15. reader reacts (2; 2 passages; 2 of 6 groups)

### Narrative words

Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.

page (71; 16 passages; 6 of 6 groups; describes the page), passage (60; 13 passages; 6 of 6 groups; describes the page), cut (30; 9 passages; 5 of 6 groups; describes the page), heading (22; 9 passages; 5 of 6 groups; describes the page), question (18; 12 passages; 6 of 6 groups; describes the page), answer (16; 10 passages; 5 of 6 groups; describes the page), cap (14; 8 passages; 4 of 6 groups; describes the page), group (13; 7 passages; 5 of 6 groups; describes the page), meaning (13; 8 passages; 5 of 6 groups; describes the page), vectorscope (13; 7 passages; 6 of 6 groups; describes the page)

## Citable facts `judgement`

The agent's list of the concrete facts, figures and claims the passages state.

- A page contributes at most 26 passages; the rest is never read. (#1 #3)
- Long sections are cut into 2,000-character windows with 200 characters of overlap. (#7 #9 #13)
- Only an h2 starts a passage; an h3 stays inside the passage of the h2 above it. (#7 #13)
- The grouping embeds each passage after the cut; the cut itself is not semantic. (#7 #13)
- A test of one URL takes about twenty seconds. (#9)
- Free with a rate limit, no account; the fetched page is not retained. (#13 #14)

---

A page contributes at most 26 passages; this one needed 17, so none of its extracted text fell past the cap.

This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.

## How each number is computed

- `measured` **Measured:** What the parser saw: words, passages, characters, robots.txt, markup. A script counted it; any model running the skill gets the same number.
- `derived` **Derived:** Computed from measured values by a fixed formula: shares, characters past the cap, check verdicts. Deterministic; where it rests on the agent's groups, the metric says so.
- `judgement` **Agent's judgement:** The agent's reading of the passages: groups, labels, the rewrite plan, the query test, the facts. The scripts validate its shape and quotes; another model may judge differently.

- **Words** `measured` (`words`). The extracted body text split on whitespace; every non-empty piece is a word. *Unit:* words. *Limits:* Counted after the cleaner, so menus, footers and hidden text are not in it. A page drawn by JavaScript reads low here; compare with --render.
- **Headings found** `measured` (`headings`). h1 elements plus h2 elements (the first 40) left after the cleaner, with empty ones dropped. *Unit:* headings. *Limits:* h3 and styled text are not counted: the chunker splits only at h2.
- **Passages read** `measured` (`passages`). Sections at h2 headings (or paragraph blocks), long ones cut into 2,000-character windows with about 200 characters of overlap, slivers under 40 characters folded into the passage before, then the first 26 kept. *Unit:* passages. *Threshold:* At most 26 per page (this tool's cap). *Limits:* Other systems cut and cap differently; this is a working model of a typical retriever.
- **Cap slots used** `measured` (`slots`). Passages kept, out of the 26-passage cap. "Every slot filled" when the chunker produced 26 or more. *Unit:* slots. *Threshold:* 26: a full cap means text may have been left out (see characters past the cap). *Limits:* A full cap does not by itself mean text was lost: the last passage may end exactly at the end of the page.
- **Passage length** `measured` (`passage_chars`). The length of one passage's text, as the chunker emitted it. *Unit:* characters, as the passage text holds them. *Threshold:* At most about 2,000, unless a sliver was folded in. *Limits:* Neighbouring passages share about 200 characters by design.
- **Text in passages, overlap and intro included** `measured` (`chars_in_passages`). The sum of every passage's length (page.charsIndexed). Passage #0 repeats the title, h1 and meta description; neighbours repeat about 200 characters. *Unit:* characters, as the passage text holds them. *Limits:* Counts repeated text more than once, so it can exceed the page's own text. For how much of the page reached a passage, read the unique number.
- **Unique text in passages** `derived` (`chars_unique`). Each passage is located in the kept text (the intro part, title, h1 and description, set aside); the union of the located spans is counted once, so overlap is not counted twice. *Unit:* characters, whitespace runs folded to one space. *Limits:* A passage the locator cannot place is reported as unlocated rather than guessed. Heading lines the chunker carries only as a passage's heading are not in it.
- **Characters past the cap** `derived` (`chars_past_cap`). Only when every one of the 26 slots is filled: the kept text after the end of the last passage. Equivalently, kept text − unique text in passages − text between passages, counted after the last one. *Unit:* characters, whitespace runs folded to one space. *Threshold:* Above 0 means a tail no retriever using this cap can return. *Limits:* Replaces the 2.101 estimate, which subtracted the overlapping total and so undercounted, often to 0. That old number is still exported as charsUnread.
- **charsUnread (2.101 meaning)** `derived` (`chars_unread_legacy`). When the cap is reached: extracted body characters − text in passages including overlap and intro; otherwise 0. *Unit:* characters, as the passage text holds them. *Limits:* Undercounts and can read 0 even when the cap cut a tail. Kept unchanged for compatibility; use characters past the cap.
- **Text in the raw HTML** `derived` (`text_raw`). Kept text plus every removal in the table below. An estimate of the document's text, defined so the waterfall sums exactly. *Unit:* characters, whitespace runs folded to one space. *Limits:* Script and style bodies count as text here because the cleaner has to remove them; it is not the text a reader sees.
- **Removed by the cleaner** `measured` (`text_removed`). For every element the cleaner removed (outermost only, so nothing counts twice): its own text at the moment of removal. Plus, when a main region was chosen, the text of everything outside it. *Unit:* characters, whitespace runs folded to one space. *Limits:* Observed on a second copy of the extraction, checked to give the same text; the removal itself is the product's rule and is not tuned here.
- **Kept text** `measured` (`text_kept`). The extractor's body text (the chunker's input), whitespace folded. *Unit:* characters, whitespace runs folded to one space. *Limits:* Differs slightly from page.bodyChars, which counts line breaks as they are.
- **Kept, but in no passage text** `derived` (`not_in_passages`). Kept text before the end of the last passage that no passage holds: h2 heading lines (carried as a passage's heading, not its text), the spaces between sections, and anything else (should be 0). *Unit:* characters, whitespace runs folded to one space. *Limits:* A retriever may still see a heading as the passage's metadata; this tool does not assume either way.
- **Overlap** `derived` (`overlap_chars`). Located passage text − unique text in passages: what neighbouring windows repeat. *Unit:* characters, whitespace runs folded to one space. *Limits:* By design, about 200 per cut inside a long section.
- **Intro** `measured` (`intro_chars`). The title, h1 and meta description the chunker puts at the start of passage #0. *Unit:* characters, whitespace runs folded to one space. *Limits:* Not part of the body text, so it is outside the waterfall's kept stage.
- **Characters removed by one element** `measured` (`removal_chars`). The removed element's text, whitespace folded, at the moment the cleaner removed it. *Unit:* characters, whitespace runs folded to one space. *Limits:* Elements with no text are counted but not listed. Beyond the first 200 the rest are summed, never dropped.
- **Section text that reached a passage** `derived` (`section_reached`). For each section the chunker made (the intro, the text before the first h2, each h2), the part of its text inside some passage, over its length. *Unit:* characters, whitespace runs folded to one space. *Threshold:* Under 100% means that section lost text, almost always to the cap. *Limits:* When the page has no usable h2 split, the body is one row.
- **robots.txt verdict** `measured` (`robots_verdict`). RFC 9309 over the site's /robots.txt: the group naming the token replaces *; the longest matching Allow or Disallow wins; Allow wins a tie. *Unit:* allowed / blocked per crawler. *Limits:* A 4xx robots.txt means no rules; 5xx or no answer means all blocked. Some user-fetch crawlers say they may ignore robots.txt.
- **Technical markup** `measured` (`markup`). From the raw HTML: every @type in application/ld+json blocks (through @graph), rel=canonical links, the meta description's length. *Unit:* types, links, characters. *Threshold:* Meta description: 70–160 characters. *Limits:* Read, not validated against schema.org.
- **Words with JavaScript** `measured` (`render_words`). The same extraction and chunking over the DOM a local headless Chrome dumped after running the page's scripts. *Unit:* words, passages. *Threshold:* 50% more words and at least 150 more raises js_dependent. *Limits:* Only with --render. The reading itself stays the plain fetch.
- **Group size** `derived` (`group_chars`). Passages in the group, and the sum of their lengths. *Unit:* characters, as the passage text holds them. *Limits:* Computed over the agent's groups, so it moves with the grouping.
- **Share of indexed text** `derived` (`group_share`). The group's characters over the characters of every passage (overlap included). *Unit:* percent. *Limits:* Computed over the agent's groups. Overlap counts in both neighbours.
- **Phrase and word counts** `derived` (`vocabulary`). Over the passages' text with the overlap removed: ×uses, the passages that use it (p), and how many groups it reaches (g/total). *Unit:* occurrences, passages, groups. *Threshold:* A phrase needs 2 uses in 2 passages, or 3 in one. *Limits:* What the page says, not search demand. The group count rests on the agent's groups.
- **Check verdicts** `derived` (`check_verdicts`). Fixed rules over the measured values, each a named constant in checks.mjs with its reason; every finding names the passages it rests on. *Unit:* findings, by severity. *Threshold:* Each check's threshold is in the check table of SKILL.md. *Limits:* repeated_claim uses the agent's groups; every other check does not.
- **Groups and labels** `judgement` (`groups`). The agent read every passage and grouped them by subject (at most 6); its label is its own. The label source is computed: a heading most members share, else two distinctive words. *Unit:* groups. *Threshold:* At most 6 groups. *Limits:* Not an embedding clustering; another model may group a little differently.
- **Repeats** `judgement` (`duplicates`). Passages the agent marked as repeating an earlier, non-adjacent passage almost word for word. *Unit:* passages. *Limits:* The product judges this from embeddings at cosine 0.94; here it is read.
- **Query test** `judgement` (`query_verdicts`). For 5 to 10 typical queries, the agent names the best passage and a verdict (complete, partial, missing) and quotes the answer; the quote is checked verbatim. *Unit:* queries. *Limits:* Judged from the passages only; it is not a measurement of what any assistant returns.
- **Rewrite plan** `judgement` (`plan`). The agent's fixes in priority order; each 'before' is checked verbatim against its passage, each cited check against the checks that fired. *Unit:* items. *Limits:* Advice, not a measurement.
- **Citable facts** `judgement` (`facts`). The agent's list of concrete facts the passages state, each with the passages that state it. *Unit:* facts. *Limits:* Fact gaps are only as fair as this list is complete.
- **Topic × page cells** `derived` (`topic_cells`). Passages and characters of the groups the agent assigned to each shared topic. *Unit:* characters, as the passage text holds them. *Limits:* Computed over the agent's groups and topics.
- **Changes since the baseline** `derived` (`diff_counts`). Passages matched by identical text, then by the same heading in order; the rest are added or removed. *Unit:* passages. *Limits:* A passage that moved and changed heading counts as removed plus added.
