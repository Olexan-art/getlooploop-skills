# AI Search Audit Lite: https://example.com/

Example Domain · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 8 problems (blocking 0, high 0, medium 1, low 7)

Lite lists problems, not fixes: labels, severities and places. Every check is deterministic; no model wrote any part of this.

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 6 |
| AI finds it? | OK | 1 |
| AI reads all of it? | OK | 0 |
| AI quotes it right? | OK | 0 |
| Rich results & markup | OK | 1 |
| Languages in order? | One version | 0 |

## Biggest problems

1. **Medium** · No h1 · `<h1>`
2. **Low** · No llms.txt · `/llms.txt`
3. **Low** · No sitemap found · `sitemap.xml`
4. **Low** · No description · `<meta name="description">`
5. **Low** · No canonical · `<link rel="canonical">`

## All problems

| # | Severity | Problem | Where | Code |
|---|---|---|---|---|
| 1 | Medium | No h1 | `<h1>` | `h1_missing` |
| 2 | Low | No llms.txt | `/llms.txt` | `llms_txt_missing` |
| 3 | Low | No sitemap found | `sitemap.xml` | `sitemap_missing` |
| 4 | Low | No description | `<meta name="description">` | `meta_description_missing` |
| 5 | Low | No canonical | `<link rel="canonical">` | `canonical_missing` |
| 6 | Low | No structured data | `JSON-LD, microdata, RDFa` | `structured_data_none` |
| 7 | Low | Preview tags missing | `og:title, og:description, og:image, twitter:card` | `social_tags_missing` |
| 8 | Low | No internal links | `<a href>` | `internal_links_none` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Top of the content

**`<head>`**

- title: 14 characters
- meta description: none · problems 4
- canonical: none · problems 5
- meta robots: not set
- hreflang: none
- html lang: en
- JSON-LD: none · problems 6
- Open Graph: 0 of 4 tags · problems 7
- viewport: set
- scripts: 1 · 0 blocking

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: not found · problems 3
- llms.txt: none · problems 2

## Google and Bing checks

| Check | State |
|---|---|
| HTTP status and redirects | Passed |
| Served over HTTPS | Passed |
| Googlebot and Bingbot may fetch the page | Passed |
| Not marked noindex | Passed |
| One absolute canonical to the page itself | Warning |
| Listed in the sitemap | Warning |
| In Google's index | Not measured |
| Title present, 10–60 characters | Passed |
| A different title per language version | Not on this page |
| Description present, 70–160 characters | Warning |
| Open Graph and Twitter card tags | Warning |
| One h1 | Problem |
| No skipped heading levels | Passed |
| Images carry alt | Not on this page |
| html lang declared | Passed |
| A readable URL | Passed |
| Internal links present | Warning |
| Links answer without errors | Not on this page |
| A mobile viewport | Passed |
| HTML size and scripts | Passed |
| Core Web Vitals from real users | Not measured |
| hreflang versions link back | Not on this page |
| FAQPage markup | Not on this page |
| BreadcrumbList markup | Not on this page |

## Bots in robots.txt (path `/`)

no robots.txt: all allowed.

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
| Raw HTML | 338 |
| Removed | 182 |
| Kept | 156 |
| In passages | 156 |
| Not in passages | 0 |
| Past the cap | 0 |

2 of 26 passages.

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version](https://www.getlooploop.com)
- What AI says about your brand and reviews, the questions people ask, a target keyword: [Full version](https://www.getlooploop.com)
- Several real assistants side by side: [Brandscope](https://www.getlooploop.com/brandscope)
- How their answers change over time: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings map): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user Core Web Vitals, sites beyond one page: [GetLoopLoop](https://www.getlooploop.com)

A full version with explanations is available from GetLoopLoop: https://www.getlooploop.com
