# AI Search Audit Lite: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching

HTTP caching - HTTP \| MDN · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 10 problems (blocking 0, high 0, medium 3, low 7)

Lite lists problems, not fixes: labels, severities and places. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such.

Main phrase: “HTTP caching” (read off the h1).

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | OK | 4 |
| AI finds it? | OK | 1 |
| AI reads all of it? | Problems | 1 |
| AI quotes it right? | Problems | 4 |
| AI gets the brand right? | Not checked | 0 |
| Languages in order? | One version | 0 |

## Biggest problems

1. **Medium** · 9 passages start mid-sentence · `passages #3, #10, #11, #12, #14, #16`
2. **Medium** · Main phrase in 4 of 15 sections · `4 of 15 h2 sections`
3. **Medium** · Menu lines inside the text · `passage #8`
4. **Low** · No llms.txt · `/llms.txt`
5. **Low** · Preview tags missing · `og:title, og:description, og:image`

## All problems

| # | Severity | Problem | Where | Layer | Code |
|---|---|---|---|---|---|
| 1 | Medium | 9 passages start mid-sentence | `passages #3, #10, #11, #12, #14, #16` | Derived | `mid_sentence_start` |
| 2 | Medium | Main phrase in 4 of 15 sections | `4 of 15 h2 sections` | Derived | `keyword_one_section` |
| 3 | Medium | Menu lines inside the text | `passage #8` | Measured | `nav_in_content` |
| 4 | Low | No llms.txt | `/llms.txt` | Measured | `llms_txt_missing` |
| 5 | Low | Preview tags missing | `og:title, og:description, og:image` | Measured | `social_tags_missing` |
| 6 | Low | 2 images without width and height | `div.layout__body.reference-layout__body > section.content-section > p > img, div.layout__body.reference-layout__body > section.content-section > p > img` | Measured | `image_dimensions_missing` |
| 7 | Low | 2 sentences of one shape | `passage #5 · word 899, passage #18 · word 3890` | Measured | `repeated_sentence_shape` |
| 8 | Low | No Organization markup | `no Organization markup` | Measured | `organization_details_missing` |
| 9 | Low | No contact link | `contact link` | Measured | `about_contact_missing` |
| 10 | Low | 78% of the text off the phrase | `20 passages without the phrase` | Derived | `off_keyword_share` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero · problems 2
3. In this article
4. Types of caches · problems 1, 2, 6
5. Heuristic caching · problems 7
6. Fresh and stale based on age
7. Expires or max-age
8. Vary · problems 3
9. Validation · problems 1
10. Don't cache · problems 1
11. Reload and force reload · problems 1
12. Deleting stored responses
13. 5 more sections · problems 1, 2, 6, 7
14. Footer

**`<head>`**

- title: 25 characters
- meta description: 114 characters
- canonical: /en-US/docs/Web/HTTP/Guides/Caching
- meta robots: not set
- hreflang: none
- html lang: en-US
- JSON-LD: BreadcrumbList, ListItem · problems 8
- Open Graph: 1 of 4 tags · problems 5
- viewport: set
- scripts: 6 · 0 blocking
- favicon: loads

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: none · problems 4
- Markdown copy: none
- ai-catalog.json: none

## Google and Bing checks

| Check | State |
|---|---|
| HTTP status and redirects | Passed |
| Served over HTTPS | Passed |
| Googlebot and Bingbot may fetch the page | Passed |
| Not marked noindex | Passed |
| One absolute canonical to the page itself | Passed |
| Listed in the sitemap | Passed |
| In Google's index | Not measured |
| Title present, 10–60 characters | Passed |
| A different title per language version | Not on this page |
| Description present, 70–160 characters | Passed |
| Open Graph and Twitter card tags | Warning |
| One h1 | Passed |
| No skipped heading levels | Passed |
| Images carry alt | Passed |
| html lang declared | Passed |
| A readable URL | Passed |
| Internal links present | Passed |
| Links answer without errors | Passed |
| A mobile viewport | Passed |
| HTML size and scripts | Passed |
| Core Web Vitals from real users | Not measured |
| hreflang versions link back | Not on this page |
| FAQPage markup | Not on this page |
| BreadcrumbList markup | Not on this page |
| Image sizes, formats, lazy loading, srcset | Warning |
| Eligible for a snippet (no nosnippet, max-snippet:0) | Passed |
| A favicon that loads | Passed |
| WebSite name markup on the home page | Not on this page |
| No http:// resources on https | Passed |
| A missing page answers 404 | Passed |
| http, www and slash variants end at the page | Passed |
| Strict-Transport-Security header | Passed |
| Author, About, Contact, organisation, dates, privacy and terms | Warning |

## Bots in robots.txt (path `/en-US/docs/Web/HTTP/Guides/Caching`)

| Bot | Vendor | Purpose | Verdict | Rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | search | allowed | — |
| ChatGPT-User | OpenAI | a user's question | allowed | — |
| GPTBot | OpenAI | training | allowed | — |
| Claude-SearchBot | Anthropic | search | allowed | — |
| Claude-User | Anthropic | a user's question | allowed | — |
| ClaudeBot | Anthropic | training | allowed | — |
| PerplexityBot | Perplexity | search | allowed | — |
| Perplexity-User | Perplexity | a user's question | allowed | — |
| Google-Extended | Google | training | allowed | — |
| Googlebot | Google | web index | allowed | — |
| Bingbot | Microsoft | web index | allowed | — |
| CCBot | Common Crawl | training | allowed | — |

## Language versions

One language version: the page declares no hreflang.

## Where the text goes (characters)

| Stage | Characters |
|---|---|
| Raw HTML | 93,570 |
| Removed | 60,964 |
| Kept | 32,606 |
| In passages | 32,366 |
| Not in passages | 240 |
| Past the cap | 0 |

26 of 26 passages.

## Not checked

- questions.json not given: that judgement was not made
- brand.json not given: that judgement was not made
- reviews.json not given: that judgement was not made
- 470 links not checked (cap 30)
- 5 sections drawn as one zone on the map

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version from GetLoopLoop](https://www.getlooploop.com)
- What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews: [Brandscope](https://www.getlooploop.com/brandscope) · [Reviewscope](https://www.getlooploop.com/reviewscope)
- How their answers change from day to day: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user speed, sites over 50 pages, tracking over time: [GetLoopLoop](https://www.getlooploop.com)

Full report with explanations: https://www.getlooploop.com
