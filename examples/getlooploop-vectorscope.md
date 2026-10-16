# Vectorscope reading: Semantic Chunking Visualizer for Any URL — Vectorscope

> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the 26-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.
>
> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (model not stated by the agent). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.
>
> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the 26-passage cap is this tool's.

| | |
|---|---|
| URL | https://www.getlooploop.com/vectorscope |
| Title | Semantic Chunking Visualizer for Any URL — Vectorscope |
| Words | 2,447 |
| Headings found | 14 |
| noindex | no |

**Pipeline:** Fetched → Extracted 2,447 words · 14 headings → Chunked 17 passages · 14,109 chars → Grouped 6 groups · 0 repeats (by reading; no embedding step)

## Counters

- **17** passages read
- **17/26** slots used of the 26-passage cap
- **0** characters past the cap, not read. Zero unless every slot was filled; then counted as extracted characters minus indexed characters, and since passages overlap by about 200 characters and the first one repeats the title and description, it undercounts and can read 0 even when the cap cut off a tail.

## Checks

### AI crawlers and robots.txt

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

### Technical markup

- **JSON-LD:** Answer, BreadcrumbList, DefinedTerm, DefinedTermSet, FAQPage, HowTo, HowToStep, ListItem, Offer, Organization, Person, Question, SoftwareApplication, Thing, WebPage, WebSite
- **Canonical:** https://www.getlooploop.com/vectorscope (this page)
- **Meta description:** 152 characters
- **With JavaScript:** 2,463 words, 17 passages (plain fetch: 2,447 words, 17 passages)

### Findings

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

## Rewrite plan

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

## Query test

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

## The groups this page falls into

| Group | Label | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|
| 0 | What Vectorscope is, and what its reading does not prove | keywords: Visualizer · Machine | 5 | 1,734 | 12.3% |
| 1 | How to read the four results | heading: How to read your result | 2 | 2,450 | 17.4% |
| 2 | Chunking strategies and the terms behind them | keywords: Grouping · Length | 2 | 3,394 | 24.1% |
| 3 | What the tool can and cannot tell you, and who it is for | keywords: Whether · Against | 4 | 3,158 | 22.4% |
| 4 | Links to further reading and other tools | keywords: Three · Questions | 2 | 1,081 | 7.7% |
| 5 | FAQ: AI citations and how Vectorscope works | heading: Questions people ask about this | 2 | 2,292 | 16.2% |

Label is the agent's name for the group when it gave one. Label source is the computed label: "heading" is the page's own section heading and can be quoted; "keywords" is the group's two most distinctive words, a hint and not what the section is called.

- **0 · What Vectorscope is, and what its reading does not prove:** The intro, the empty result widget, and three short caveats.
- **1 · How to read the four results:** Cap, extraction ratio, groups, and the passage a question retrieves; one long section the window cuts in two.
- **5 · FAQ: AI citations and how Vectorscope works:** The questions survive as text, so each answer keeps its question.

## Passages, by group

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

- **#12** *Keep reading* · 335 chars  
  Longer answers to the questions this page can only summarise. What semantic chunking is, and what it trades away The three strategies, side by side, on the same page. How to optimise content for AI search What actually changes a passage's c…
- **#15** *Other free AI search tools* · 746 chars  
  Voicescope Start with one keyword and explore the questions a person may ask an AI assistant across real-life contexts. Brandscope Ask three AI assistants the buyer questions around a brand, then compare their answers with the brand's own p…

### 5 · FAQ: AI citations and how Vectorscope works (2 passages)

- **#13** *Questions people ask about this* · 1,992 chars  
  How does AI Mode choose which sources to cite? Nobody outside Google can state the mechanism, and this page will not pretend to. What is observable is that cited pages tend to contain a passage that answers the query completely on its own,…
- **#14** *Questions people ask about this* · 300 chars  
  after the reading is produced. No account is needed, so there is nothing to attach it to. Is it really free? Yes, with a rate limit rather than a paywall. The limit exists because every reading spends an embedding call, and it resets on a f…

## Side-path content

No passage looks like related links or utility copy.

## The page's vocabulary

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

page (71; 16 passages; 6 of 6 groups; describes the page), passage (60; 13 passages; 6 of 6 groups; describes the page), cut (30; 9 passages; 5 of 6 groups; describes the page), heading (22; 9 passages; 5 of 6 groups; describes the page), question (18; 12 passages; 6 of 6 groups; describes the page), answer (16; 10 passages; 5 of 6 groups; describes the page), cap (14; 8 passages; 4 of 6 groups; describes the page), group (13; 7 passages; 5 of 6 groups; describes the page), meaning (13; 8 passages; 5 of 6 groups; describes the page), vectorscope (12; 6 passages; 5 of 6 groups; describes the page)

## Citable facts

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
