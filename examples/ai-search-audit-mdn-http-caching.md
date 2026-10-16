# AI Search Audit Lite: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching

HTTP caching - HTTP \| MDN · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 4 problems (blocking 0, high 0, medium 2, low 2)

Lite lists problems, not fixes: labels, severities and places. Every check is deterministic; no model wrote any part of this.

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | OK | 1 |
| AI finds it? | OK | 1 |
| AI reads all of it? | Problems | 1 |
| AI quotes it right? | Problems | 1 |
| Rich results & markup | OK | 0 |
| Languages in order? | One version | 0 |

## Biggest problems

1. **Medium** · 9 passages start mid-sentence · `passages #3, #10, #11, #12, #14, #16`
2. **Medium** · Menu lines inside the text · `passage #8`
3. **Low** · No llms.txt · `/llms.txt`
4. **Low** · Preview tags missing · `og:title, og:description, og:image`

## All problems

| # | Severity | Problem | Where | Code |
|---|---|---|---|---|
| 1 | Medium | 9 passages start mid-sentence | `passages #3, #10, #11, #12, #14, #16` | `mid_sentence_start` |
| 2 | Medium | Menu lines inside the text | `passage #8` | `nav_in_content` |
| 3 | Low | No llms.txt | `/llms.txt` | `llms_txt_missing` |
| 4 | Low | Preview tags missing | `og:title, og:description, og:image` | `social_tags_missing` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero
3. In this article
4. Types of caches · problems 1
5. Heuristic caching
6. Fresh and stale based on age
7. Expires or max-age
8. Vary · problems 2
9. Validation · problems 1
10. Don't cache · problems 1
11. Reload and force reload · problems 1
12. Deleting stored responses
13. 5 more sections · problems 1
14. Footer

**`<head>`**

- title: 25 characters
- meta description: 114 characters
- canonical: /en-US/docs/Web/HTTP/Guides/Caching
- meta robots: not set
- hreflang: none
- html lang: en-US
- JSON-LD: BreadcrumbList, ListItem
- Open Graph: 1 of 4 tags · problems 4
- viewport: set
- scripts: 6 · 0 blocking

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: none · problems 3

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

- 470 links not checked (cap 30)
- 5 sections drawn as one zone on the map

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version](https://www.getlooploop.com)
- What AI says about your brand and reviews, the questions people ask, a target keyword: [Full version](https://www.getlooploop.com)
- Several real assistants side by side: [Brandscope](https://www.getlooploop.com/brandscope)
- How their answers change over time: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings map): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user Core Web Vitals, sites beyond one page: [GetLoopLoop](https://www.getlooploop.com)

A full version with explanations is available from GetLoopLoop: https://www.getlooploop.com
