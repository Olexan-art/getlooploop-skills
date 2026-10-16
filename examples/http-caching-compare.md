# Vectorscope comparison: 2 pages, one topic dictionary

> Each page was read with the product's exact fetch, extraction, chunking and 26-passage cap. The agent grouped every page against one shared topic dictionary, so the topics line up across pages; the grouping, the facts and the query verdicts are a judgement.

## The pages

| Page | URL | Words | Passages | Past cap | AI crawlers blocked | Findings (high/medium/low) |
|---|---|---|---|---|---|---|
| 1 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching | 5,153 | 26/26 | 0 | none | 0/3/1 |
| 2 | https://web.dev/articles/http-cache?hl=en | 2,060 | 15/26 | 0 | none | 0/4/2 |

## Topics × pages

Passages and characters each page spends on each shared topic.

| Topic | Page 1 | Page 2 |
|---|---|---|
| What the HTTP cache is and why it helps | 2 · 914 chars | 3 · 1,766 chars |
| Private, shared and managed caches | 3 · 5,059 chars | — |
| Freshness: max-age, Expires, heuristics, Vary | 4 · 5,281 chars | — |
| Revalidation: ETag, Last-Modified, 304 | 4 · 6,522 chars | 2 · 2,732 chars |
| Preventing reuse: no-cache, no-store, reloads | 6 · 7,883 chars | — |
| Recommended settings and cache busting | 7 · 8,801 chars | 7 · 6,373 chars |
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
| The immutable directive stops revalidation on reload for content that never changes. | ✓ #16 #22 | — |
| QPACK predefines one-week, one-month and one-year max-age values that compress to one byte in HTTP/3. | ✓ #20 | — |
| Clear-Site-Data: cache clears browser caches but has no effect on intermediate caches. | ✓ #17 | — |
| ETag is recommended over Last-Modified because it is more accurate. | — | ✓ #8 |
| Build tools such as webpack can add hash fingerprints to asset URLs automatically. | — | ✓ #7 |
| private, max-age=600 lets the browser, but not intermediary caches, keep a response for 10 minutes. | — | ✓ #14 |

- Page 1: 7 fact(s) only it states, 3 it lacks.
- Page 2: 3 fact(s) only it states, 7 it lacks.

## Rewrite plan

The agent's judgement, in priority order. Every passage must stand on its own, because a retriever sees it alone.

1. **Page 2** · `canonical_other` · page-wide  
   **Problem:** The page's canonical is https://web.dev/articles/http-cache, and in this run a plain fetch of that URL (no Accept-Language) was redirected to the French ?hl=fr version. A crawler that follows the canonical may store the page in a language the reader did not ask for.  
   **Fix:** Serve the canonical URL in its default language to clients that send no Accept-Language, and keep the language variants on hreflang alternates.
2. **Page 1** · `dominant_heading` · passages #22 #23 #24  
   **Problem:** Under "Common caching patterns" an h3 reads "Validation", the same text as the earlier h2. The chunker matches heading lines by text, so #22 to #24 are filed under the wrong section and "Validation" ends up holding 31% of the page.  
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
- **With JavaScript:** 4,678 words, 24 passages (plain fetch: 5,153 words, 26 passages)

- **[medium] One heading carries too much of the page** `dominant_heading` · passages #9 #10 #11 #12 #22 #23 #24  
  “Validation” holds 31.1% of the indexed text.  
  *What to do:* The chunker splits only at h2. If this part has subtopics, they are h3s or styled text; make them real h2 headings so each becomes its own passage.
- **[medium] Passages that start mid-sentence** `mid_sentence_start` · passages #3 #10 #11 #12 #14 #16 #20 #21 #23 #24  
  10 passage(s) open on a lowercase word or a punctuation mark.  
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
- **With JavaScript:** 2,127 words, 17 passages (plain fetch: 2,060 words, 15 passages)

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

## Each page's groups

### Page 1

| Group | Label | Topic | Label source | Passages | Chars | Share |
|---|---|---|---|---|---|---|
| 0 | What the HTTP cache is | What the HTTP cache is and why it helps | keywords: Associated · Subsequent | 2 | 914 | 2.7% |
| 1 | Private, proxy and managed caches | Private, shared and managed caches | heading: Types of caches | 3 | 5,059 | 14.7% |
| 2 | Freshness, Expires, heuristic caching and Vary | Freshness: max-age, Expires, heuristics, Vary | keywords: Possible · Specifying | 4 | 5,281 | 15.3% |
| 3 | Revalidation with If-Modified-Since and ETag | Revalidation: ETag, Last-Modified, 304 | heading: Validation | 4 | 6,522 | 18.9% |
| 4 | no-cache, no-store, reloads, deletion and request collapse | Preventing reuse: no-cache, no-store, reloads | keywords: Force · Right | 6 | 7,883 | 22.9% |
| 5 | Common caching patterns and cache busting | Recommended settings and cache busting | keywords: Resources · Bundle | 7 | 8,801 | 25.5% |

A page contributes at most 26 passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.

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

---

This is a preview of the machine's view, not a guarantee of what any assistant does with it.
