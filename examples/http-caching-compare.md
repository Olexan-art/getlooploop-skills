# Vectorscope comparison: 2 pages, one topic dictionary

> **Same for everyone.** The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the 26-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.
>
> **Your model's judgement.** The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (model not stated by the agent). Another model may group a little differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.
>
> **Not any assistant's pipeline.** ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the 26-passage cap is this tool's.
>
> **Three kinds of number.** Every section and number carries a marker: `measured` is what the parser saw, `derived` is computed from it by a fixed formula, `judgement` is the agent's reading. *How each number is computed*, at the end, gives every formula.

> The agent grouped every page against one shared topic dictionary, so the topics line up across pages.

## The pages `measured` `derived`

| Page | URL | Words | Passages | Past cap | AI crawlers blocked | Findings (high/medium/low) |
|---|---|---|---|---|---|---|
| 1 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching | 5,153 | 26/26 | 0 | none | 0/2/1 |
| 2 | https://web.dev/articles/http-cache?hl=en | 2,060 | 15/26 | 0 | none | 0/4/2 |

## Topics × pages `judgement` `derived`

Passages and characters each page spends on each shared topic.

| Topic | Page 1 | Page 2 |
|---|---|---|
| What the HTTP cache is and why it helps | 2 · 914 chars | 3 · 1,766 chars |
| Private, shared and managed caches | 3 · 5,059 chars | — |
| Freshness: max-age, Expires, heuristics, Vary | 4 · 5,281 chars | — |
| Revalidation: ETag, Last-Modified, 304 | 4 · 6,522 chars | 2 · 2,732 chars |
| Preventing reuse: no-cache, no-store, reloads | 6 · 7,883 chars | — |
| Recommended settings and cache busting | 7 · 8,960 chars | 7 · 6,373 chars |
| Browser support and request headers | — | 2 · 831 chars |
| Configuring response headers on a server | — | 1 · 1,606 chars |

**Topic gaps** (topics the other pages cover and this one does not):

- Page 1: Browser support and request headers, Configuring response headers on a server
- Page 2: Private, shared and managed caches, Freshness: max-age, Expires, heuristics, Vary, Preventing reuse: no-cache, no-store, reloads

## Who wins each query

| Query | Source | Page 1 | Page 2 | Winner |
|---|---|---|---|---|
| what is the difference between no-cache and no-store | generated | complete #13, citable | partial #10, citable | Page 1 |
| what max-age should versioned static files get | generated | partial #20 | complete #10, citable | Page 2 |
| how does ETag revalidation work | generated | complete #10, citable | complete #9, citable | Page 1, Page 2 (tie) |
| what is a shared cache | generated | complete #2, citable | missing | Page 1 |
| what happens if I don't set Cache-Control | generated | complete #5, citable | complete #5, citable | Page 1, Page 2 (tie) |
| how to set caching headers in nginx | generated | missing | partial #5 | Page 2 |
| how to bust the cache when a file changes | generated | complete #19, citable | complete #6, citable | Page 1, Page 2 (tie) |
| does the browser revalidate when the user reloads | generated | complete #15, citable | missing | Page 1 |

## Fact gaps

Which page states a fact the others lack.

| Fact | Page 1 | Page 2 |
|---|---|---|
| Cache-Control: max-age=31536000 caches a response for one year, the usual setting for versioned files. | ✓ #16 #20 #21 | ✓ #6 #10 #14 |
| ETag carries a server-chosen token, often a hash of the content, that the client sends back in If-None-Match. | ✓ #10 | ✓ #8 #9 |
| A 304 Not Modified response carries no body, so revalidation transfers very little. | ✓ #9 | ✓ #9 |
| no-cache allows storing but forces revalidation before reuse; no-store forbids storing. | ✓ #13 | ✓ #7 #10 |
| Without Cache-Control, responses are still cached heuristically. | ✓ #5 | ✓ #5 |
| The specification suggests reusing a heuristically cached response for about 10% of the time since it was last modified. | ✓ #5 | — |
| Expires was HTTP/1.0's freshness header; when both are present, max-age wins. | ✓ #7 | — |
| Vary keys stored responses by request headers such as Accept-Language. | ✓ #8 | — |
| A private cache belongs to one client; a shared cache sits between client and server and serves many users. | ✓ #2 | — |
| The immutable directive stops revalidation on reload for content that never changes. | ✓ #16 #21 | — |
| QPACK predefines one-week, one-month and one-year max-age values that compress to one byte in HTTP/3. | ✓ #20 | — |
| Clear-Site-Data: cache clears browser caches but has no effect on intermediate caches. | ✓ #17 | — |
| ETag is recommended over Last-Modified because it is more accurate. | — | ✓ #8 |
| Build tools such as webpack can add hash fingerprints to asset URLs automatically. | — | ✓ #7 |
| private, max-age=600 lets the browser, but not intermediary caches, keep a response for 10 minutes. | — | ✓ #14 |

- Page 1: 7 fact(s) only it states, 3 it lacks.
- Page 2: 3 fact(s) only it states, 7 it lacks.

## Rewrite plan `judgement`

The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.

1. **Page 2** · `canonical_other` · page-wide  
   **Problem:** The page's canonical is https://web.dev/articles/http-cache, and in this run a plain fetch of that URL (no Accept-Language) was redirected to the French ?hl=fr version. A crawler that follows the canonical may store the page in a language the reader did not ask for.  
   **Fix:** Serve the canonical URL in its default language to clients that send no Accept-Language, and keep the language variants on hreflang alternates.
2. **Page 1** · passages #21  
   **Problem:** Under "Common caching patterns" an h3 reads "Validation", the same text as the earlier h2. Up to 2.102 this chunker took it for that h2 and filed the rest of the section under "Validation"; 2.103 follows the h2 order and keeps it in #21, but any splitter that matches headings by their text alone still makes that cut, and a passage that says "Validation" with no subject is ambiguous to a retriever either way.  
   **Fix:** Give the h3 its own name, such as "Validating cache-busted files", and open the passage with its subject.
   - *Before:* Don't forget to set the Last-Modified and ETag headers, so that you don't have to re-transmit a resource when reloading.
   - *After:* For cache-busted static files, also set Last-Modified and ETag, so that a reload revalidates the file instead of re-transmitting it.
3. **Page 1** · `mid_sentence_start` · passages #3  
   **Problem:** "Types of caches" runs to about 5,000 characters under one h2, so the window cuts it and #3 opens with "proxy-revalidate However".  
   **Fix:** Promote Private caches, Shared cache, Proxy caches and Managed caches to h2, so each type is a passage that names itself.
   - *Before:* proxy-revalidate However, in recent years, as HTTPS has become more common and client/server communication has become encrypted, proxy caches in the path can only tunnel a response and can't behave as a cache, in many cases.
   - *After:* Proxy caches and HTTPS: now that most traffic is encrypted, a proxy cache on the path can usually only tunnel the response and cannot cache it.
4. **Page 2** · `nav_in_content` · passages #2  
   **Problem:** The browser-compatibility widget becomes the words "Browser Support / Source" three times; the passage says nothing a retriever can quote.  
   **Fix:** State the support in a sentence and keep the widget out of the extracted text (or give it an accessible text summary).
   - *Before:* Cache-Control Browser Support Source ETag Browser Support Source Last-Modified Browser Support Source
   - *After:* Cache-Control, ETag and Last-Modified are supported in all major browsers.
5. **Page 2** · `thin_section` · passages #13  
   **Problem:** "Appendix: Cache-Control flowchart" is an image with a 60-character caption; the decision it draws never reaches the text.  
   **Fix:** Write the flowchart's decisions as a short list under the image.
   - *Before:* The decision process for setting your Cache-Control headers.
   - *After:* Choosing Cache-Control: if the response must never be reused, use no-store; if it must be checked every time, use no-cache; otherwise use private (browser only) or public, with a max-age that matches how often it changes.
6. **Page 2** · passages #0  
   **Problem:** The meta description is double-escaped, so passage #0 stores the literal text "browser&#39;s".  
   **Fix:** Escape the description once.
   - *Before:* The browser&#39;s HTTP Cache is your first line of defense against unnecessary network requests.
   - *After:* The browser's HTTP cache is your first line of defense against unnecessary network requests.

## Checks by page

### Page 1 · https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching

| Crawler | Vendor | What it does | This page | Deciding rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | assistant search index | allowed | no rule matches |
| ChatGPT-User | OpenAI | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| GPTBot | OpenAI | training data | allowed | no rule matches |
| Claude-SearchBot | Anthropic | assistant search index | allowed | no rule matches |
| Claude-User | Anthropic | fetches when a user asks | allowed | no rule matches |
| ClaudeBot | Anthropic | training data | allowed | no rule matches |
| PerplexityBot | Perplexity | assistant search index | allowed | no rule matches |
| Perplexity-User | Perplexity | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| Google-Extended | Google | training data | allowed | no rule matches |
| Googlebot | Google | web search index | allowed | no rule matches |
| Bingbot | Microsoft | web search index | allowed | no rule matches |
| CCBot | Common Crawl | training data | allowed | no rule matches |

- **JSON-LD:** none
- **Canonical:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching (this page)
- **Meta description:** 114 characters

- **[medium] Passages that start mid-sentence** `mid_sentence_start` · passages #3 #10 #11 #12 #14 #16 #20 #21 #23  
  9 passage(s) open on a lowercase word or a punctuation mark.  
  - #3 “proxy-revalidate However, in recent years, as HTTPS has become more common and …”
  - #10 “to parse, and distributed servers have difficulty synchronizing file-update tim…”
  - #11 “for caching; it is a standard HTTP header that is also used by content-manageme…”
  - #12 “it must not be reused without revalidation once it is stale — so, in combinatio…”
  - #14 “following being used. http Cache-Control: no-store, no-cache, max-age=0, must-r…”
  - #16 “with no-cache, you can be sure you'll get a 200 OK from the origin server. That…”
  *What to do:* The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.
- **[medium] Navigation inside the content** `nav_in_content` · passages #8  
  2 run(s) of four or more one-or-two-word lines.  
  - #8 “URL · Response body · https://example.com/index.html · <!doctype html>... · https://example.com/style.css”
  - #8 “URL · Accept-Language · Response body · https://example.com/index.html · ja-JP · <!doctype html>... · https://example.com/index.html · en-US”
  *What to do:* Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.
- **[low] No structured data** `jsonld_none`  
  No JSON-LD on the page.  
  *What to do:* Not needed for the passages, but FAQPage, HowTo, Product or Article markup states what the page is in a form machines read without guessing.

### Page 2 · https://web.dev/articles/http-cache?hl=en

| Crawler | Vendor | What it does | This page | Deciding rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | assistant search index | allowed | no rule matches |
| ChatGPT-User | OpenAI | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| GPTBot | OpenAI | training data | allowed | no rule matches |
| Claude-SearchBot | Anthropic | assistant search index | allowed | no rule matches |
| Claude-User | Anthropic | fetches when a user asks | allowed | no rule matches |
| ClaudeBot | Anthropic | training data | allowed | no rule matches |
| PerplexityBot | Perplexity | assistant search index | allowed | no rule matches |
| Perplexity-User | Perplexity | fetches when a user asks (vendor: robots.txt may not apply) | allowed | no rule matches |
| Google-Extended | Google | training data | allowed | no rule matches |
| Googlebot | Google | web search index | allowed | no rule matches |
| Bingbot | Microsoft | web search index | allowed | no rule matches |
| CCBot | Common Crawl | training data | allowed | no rule matches |

- **JSON-LD:** Article, BreadcrumbList, ListItem
- **Canonical:** https://web.dev/articles/http-cache (another URL)
- **Meta description:** 96 characters

- **[medium] One heading carries too much of the page** `dominant_heading` · passages #6 #7 #8 #9  
  “Which response header values should you use?” holds 50.5% of the indexed text.  
  *What to do:* The chunker splits only at h2. If this part has subtopics, they are h3s or styled text; make them real h2 headings so each becomes its own passage.
- **[medium] Passages that start mid-sentence** `mid_sentence_start` · passages #7 #8 #9  
  3 passage(s) open on a lowercase word or a punctuation mark.  
  - #7 “it can immediately use the value in the HTTP Cache, without having to make a ne…”
  - #8 “can also accept a comma-separated list of directives. See Appendix: Cache-Contr…”
  - #9 “there's a match, then the server can respond with a 304 Not Modified HTTP respo…”
  *What to do:* The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.
- **[medium] Navigation inside the content** `nav_in_content` · passages #2 #5  
  2 run(s) of four or more one-or-two-word lines.  
  - #2 “Cache-Control · Browser Support · Source · ETag · Browser Support · Source · Last-Modified · Browser Support”
  - #5 “Express · Apache · nginx · Firebase Hosting · Netlify”
  *What to do:* Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.
- **[medium] Canonical points elsewhere** `canonical_other`  
  rel=canonical names https://web.dev/articles/http-cache.  
  *What to do:* Search indexes will prefer that URL; the passages here may be stored under it or not at all. Point canonical at this page if it is the original.
- **[low] Thin sections** `thin_section` · passages #13  
  1 heading(s) with fewer than 150 characters under them.  
  - #13 “Appendix: Cache-Control flowchart (60 chars)”
  *What to do:* A passage this short cannot answer much on its own. Merge it into a neighbour or say what the heading promises.
- **[low] The same words in most groups** `repeated_claim` · passages #1 #2 #10  
  1 phrase(s) recur across at least half of the 6 groups.  
  - “supported in all browsers (3 groups)”
  *What to do:* Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.

## Each page's groups `judgement` `measured`

### Page 1

| Group | Label | Topic | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|---|
| 0 | What the HTTP cache is | What the HTTP cache is and why it helps | keywords: Associated · Subsequent | 2 | 914 | 2.6% |
| 1 | Private, proxy and managed caches | Private, shared and managed caches | heading: Types of caches | 3 | 5,059 | 14.6% |
| 2 | Freshness, Expires, heuristic caching and Vary | Freshness: max-age, Expires, heuristics, Vary | keywords: Possible · Specifying | 4 | 5,281 | 15.3% |
| 3 | Revalidation with If-Modified-Since and ETag | Revalidation: ETag, Last-Modified, 304 | heading: Validation | 4 | 6,522 | 18.8% |
| 4 | no-cache, no-store, reloads, deletion and request collapse | Preventing reuse: no-cache, no-store, reloads | keywords: Force · Right | 6 | 7,883 | 22.8% |
| 5 | Common caching patterns and cache busting | Recommended settings and cache busting | heading: Common caching patterns | 7 | 8,960 | 25.9% |

A page contributes at most 26 passages, and this one filled every slot; the last passage reaches the end of the kept text, so nothing fell past the cap.

### Page 2

| Group | Label | Topic | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|---|
| 0 | Why the HTTP cache matters and how it works | What the HTTP cache is and why it helps | keywords: First · Defense | 3 | 1,766 | 13.3% |
| 1 | Browser support and request headers | Browser support and request headers | keywords: Automatically · Understanding | 2 | 831 | 6.2% |
| 2 | Response headers to configure on the server | Configuring response headers on a server | heading: Response headers: configure your web server | 1 | 1,606 | 12.1% |
| 3 | Versioned and unversioned URLs | Recommended settings and cache busting | heading: Which response header values should you use? | 2 | 3,986 | 30% |
| 4 | ETag revalidation and 304 | Revalidation: ETag, Last-Modified, 304 | heading: Which response header values should you use? | 2 | 2,732 | 20.5% |
| 5 | Summary and appendix: recommended values | Recommended settings and cache busting | keywords: Optimize · Usage | 5 | 2,387 | 17.9% |

A page contributes at most 26 passages; this one needed 15, so none of its extracted text fell past the cap.

## Losses by page `measured` `derived`

| Page | Raw (est.) | Removed | Kept | In passages, unique | Past cap | Sections cut |
|---|---|---|---|---|---|---|
| 1 | 93,570 | 60,964 | 32,606 | 32,366 | 0 | 0 / 15 |
| 2 | 25,226 | 12,426 | 12,800 | 12,497 | 0 | 0 / 12 |

### Page 1

#### Where the text goes `measured` `derived`

Characters, whitespace runs folded to one space. "Text in the raw HTML" is the kept text plus every removal, so the stages sum exactly.

| Stage | Characters | Share | Layer |
|---|---|---|---|
| Text in the raw HTML (estimate) | 93,570 | 100% of raw | `derived` |
| Removed by the cleaner | 60,964 | 65.2% of raw | `measured` |
| Kept: the chunker's input | 32,606 | 34.8% of raw | `measured` |
| In passages, unique | 32,366 | 99.3% of kept | `derived` |
| Kept, in no passage text | 240 | 0.7% of kept | `derived` |
| Past the cap | 0 | 0% of kept | `derived` |

The passages hold 34,619 characters in all: 32,366 unique, plus 2,100 of overlap between neighbours and 153 of intro (title, h1, description) in passage #0. Of the kept text in no passage: 192 in h2 heading lines, 48 spaces between sections.

##### What the cleaner removed `measured`

25 elements with text, 60,964 characters. By reason: script, style, noscript, template 51,227 (16) · svg, canvas, iframe, embed 13 (3) · head (title, meta) 26 (1) · page header (site banner) 1,731 (1) · footer 500 (1) · aside, role=complementary 7,432 (2) · outside the chosen main region 35 (1).

| Reason | Element | Path | Chars | Its text begins |
|---|---|---|---|---|
| script, style, noscript, template | `template` | … > section.content-section > div.article-footer__inner > mdn-content-feedback > template | 16,992 | “.content-feedback{border:none;margin:0 0 .25rem;padding:0}.content-feedback>labe…” |
| script, style, noscript, template | `template` | header.page-layout__header > div.breadcrumbs-bar > mdn-language-switcher > template | 11,342 | “*,:after,:before{box-sizing:border-box}button,input,select,textarea{font:inherit…” |
| script, style, noscript, template | `template` | … > nav.left-sidebar > div.left-sidebar__header > mdn-sidebar-filter > template | 9,816 | “.visually-hidden{border:0!important;clip-path:inset(50%)!important;height:1px!im…” |
| script, style, noscript, template | `template` | header.page-layout__header > div.breadcrumbs-bar > mdn-toggle-sidebar > template | 8,397 | “:host{border-right:1px solid var(--color-border-primary);display:block;height:10…” |
| aside, role=complementary | `aside#main-sidebar.layout__left-sidebar` | div.page-layout__main > div.layout__2-sidebars-inline > aside#main-sidebar.layout__left-sidebar | 7,207 | “HTTP Guides Overview of HTTP Evolution of HTTP A typical HTTP session HTTP messa…” |

20 more elements, 7,210 characters, not listed here (export.json lists up to 200 and sums the rest).

12 more matched elements held no text.

##### How much of each section reached a passage `derived`

| Section | Reached a passage | Of | Share |
|---|---|---|---|
| *Intro: title, h1, description* | 153 | 153 | 100% |
| *Before the first h2* | 761 | 761 | 100% |
| Types of caches | 4,666 | 4,666 | 100% |
| Heuristic caching | 979 | 979 | 100% |
| Fresh and stale based on age | 1,671 | 1,671 | 100% |
| Expires or max-age | 665 | 665 | 100% |
| Vary | 1,966 | 1,966 | 100% |
| Validation | 5,945 | 5,945 | 100% |
| Don't cache | 2,686 | 2,686 | 100% |
| Reload and force reload | 2,886 | 2,886 | 100% |
| Deleting stored responses | 1,271 | 1,271 | 100% |
| Request collapse | 655 | 655 | 100% |
| Common caching patterns | 7,947 | 7,947 | 100% |
| See also | 118 | 118 | 100% |
| Help improve MDN | 150 | 150 | 100% |

### Page 2

#### Where the text goes `measured` `derived`

Characters, whitespace runs folded to one space. "Text in the raw HTML" is the kept text plus every removal, so the stages sum exactly.

| Stage | Characters | Share | Layer |
|---|---|---|---|
| Text in the raw HTML (estimate) | 25,226 | 100% of raw | `derived` |
| Removed by the cleaner | 12,426 | 49.3% of raw | `measured` |
| Kept: the chunker's input | 12,800 | 50.7% of raw | `measured` |
| In passages, unique | 12,497 | 97.6% of kept | `derived` |
| Kept, in no passage text | 303 | 2.4% of kept | `derived` |
| Past the cap | 0 | 0% of kept | `derived` |

The passages hold 13,308 characters in all: 12,497 unique, plus 576 of overlap between neighbours and 231 of intro (title, h1, description) in passage #0. Of the kept text in no passage: 254 in h2 heading lines, 49 spaces between sections.

##### What the cleaner removed `measured`

40 elements with text, 12,426 characters. By reason: script, style, noscript, template 8,481 (7) · svg, canvas, iframe, embed 24 (5) · head (title, meta) 79 (1) · [hidden] or aria-hidden 902 (18) · role=banner 521 (1) · navigation (nav, role=navigation) 1,875 (4) · aside, role=complementary 524 (3) · outside the chosen main region 20 (1).

| Reason | Element | Path | Chars | Its text begins |
|---|---|---|---|---|
| script, style, noscript, template | `script` | script | 6,329 | “(function(d,e,v,s,i,t,E){d['GoogleDevelopersObject']=i; t=e.createElement(v);t.a…” |
| navigation (nav, role=navigation) | `nav.devsite-book-nav.devsite-nav` | section.devsite-wrapper > devsite-book-nav > nav.devsite-book-nav.devsite-nav | 1,171 | “Resources More AI and the web Fast load times Learn Core Web Vitals Identity Pro…” |
| script, style, noscript, template | `script` | devsite-analytics > script | 807 | “{&#34;at&#34;: &#34;True&#34;, &#34;ga4&#34;: [], &#34;ga4p&#34;: [], &#34;gtm&#…” |
| role=banner | `devsite-header` | section.devsite-wrapper > devsite-header | 521 | “Resources Discover Baseline How to use Baseline Blog Case Studies English Deutsc…” |
| [hidden] or aria-hidden | `div.devsite-tabs-dropdown` | … > devsite-tabs.upper-tabs > nav.devsite-tabs-wrapper > tab.devsite-dropdown > div.devsite-tabs-dropdown | 473 | “Web Platform Dive into the web platform, at your pace. HTML CSS JavaScript User…” |

35 more elements, 3,125 characters, not listed here (export.json lists up to 200 and sums the rest).

20 more matched elements held no text.

##### How much of each section reached a passage `derived`

| Section | Reached a passage | Of | Share |
|---|---|---|---|
| *Intro: title, h1, description* | 231 | 231 | 100% |
| *Before the first h2* | 833 | 833 | 100% |
| Browser compatibility | 261 | 261 | 100% |
| How the HTTP Cache works | 698 | 698 | 100% |
| Request headers: stick with the defaults (usually) | 570 | 570 | 100% |
| Response headers: configure your web server | 1,606 | 1,606 | 100% |
| Which response header values should you use? | 6,142 | 6,142 | 100% |
| Summary | 571 | 571 | 100% |
| Learn more | 243 | 243 | 100% |
| Appendix: More tips | 714 | 714 | 100% |
| Appendix: Cache-Control flowchart | 60 | 60 | 100% |
| Appendix: Cache-Control examples | 799 | 799 | 100% |

---

This is a preview of the machine's view, not a guarantee of what any assistant does with it.

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
