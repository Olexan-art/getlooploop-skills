# AI Search Audit Lite: https://www.getlooploop.com/vectorscope

Semantic Chunking Visualizer for Any URL — Vectorscope · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 8 problems (blocking 0, high 0, medium 4, low 4)

Lite lists problems, not fixes: labels, severities and places. Every check is deterministic; no model wrote any part of this.

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 2 |
| AI finds it? | OK | 0 |
| AI reads all of it? | Problems | 2 |
| AI quotes it right? | Problems | 1 |
| Rich results & markup | Problems | 2 |
| Languages in order? | OK | 1 |

## Biggest problems

1. **Medium** · 2 broken links · `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card`
2. **Medium** · Required schema fields missing · `JSON-LD #2 $`
3. **Medium** · 2 passages start mid-sentence · `passages #6, #14`
4. **Medium** · Menu lines inside the text · `passage #1`
5. **Low** · 131 KB, 40 scripts · `HTML`

## All problems

| # | Severity | Problem | Where | Code |
|---|---|---|---|---|
| 1 | Medium | 2 broken links | `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card` | `broken_links` |
| 2 | Medium | Required schema fields missing | `JSON-LD #2 $` | `schema_required_missing` |
| 3 | Medium | 2 passages start mid-sentence | `passages #6, #14` | `mid_sentence_start` |
| 4 | Medium | Menu lines inside the text | `passage #1` | `nav_in_content` |
| 5 | Low | 131 KB, 40 scripts | `HTML` | `page_weight_heavy` |
| 6 | Low | 1 very short section | `h2 “Important passage outside the cap?”` | `thin_section` |
| 7 | Low | FAQ rich result retired | `FAQPage` | `faq_rich_result_retired` |
| 8 | Low | llms.txt: one language only | `/llms.txt` | `llms_txt_one_language` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero · problems 4
3. Sidebar · unseen
4. What does this mean?
5. Important passage outside the cap? · problems 6
6. Models and retrieval caps vary.
7. How to read your result · problems 3
8. What is semantic chunking?
9. Is my content ready for AI search?
10. Using Vectorscope to test a RAG pipeline
11. Who is Vectorscope for?
12. Words used on this page
13. 4 more sections · problems 1, 3
14. Footer

**`<head>`**

- title: 54 characters
- meta description: 152 characters
- canonical: /vectorscope
- meta robots: index, follow · index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1
- hreflang: en · uk · es · x-default
- html lang: en
- JSON-LD: Organization, WebSite +6 · problems 2, 7
- Open Graph: 4 of 4 tags
- viewport: set
- scripts: 40 · 1 blocking · problems 5

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: present · 32 links · problems 8

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
| A different title per language version | Passed |
| Description present, 70–160 characters | Passed |
| Open Graph and Twitter card tags | Passed |
| One h1 | Passed |
| No skipped heading levels | Passed |
| Images carry alt | Not on this page |
| html lang declared | Passed |
| A readable URL | Passed |
| Internal links present | Passed |
| Links answer without errors | Problem |
| A mobile viewport | Passed |
| HTML size and scripts | Warning |
| Core Web Vitals from real users | Not measured |
| hreflang versions link back | Passed |
| FAQPage markup | Warning |
| BreadcrumbList markup | Passed |

## Bots in robots.txt (path `/vectorscope`)

| Bot | Vendor | Purpose | Verdict | Rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | search | allowed | `Allow: /vectorscope` |
| ChatGPT-User | OpenAI | a user's question | allowed | `Allow: /vectorscope` |
| GPTBot | OpenAI | training | allowed | `Allow: /vectorscope` |
| Claude-SearchBot | Anthropic | search | allowed | `Allow: /vectorscope` |
| Claude-User | Anthropic | a user's question | allowed | `Allow: /vectorscope` |
| ClaudeBot | Anthropic | training | allowed | `Allow: /vectorscope` |
| PerplexityBot | Perplexity | search | allowed | `Allow: /vectorscope` |
| Perplexity-User | Perplexity | a user's question | allowed | `Allow: /vectorscope` |
| Google-Extended | Google | training | allowed | `Allow: /vectorscope` |
| Googlebot | Google | web index | allowed | `Allow: /vectorscope` |
| Bingbot | Microsoft | web index | allowed | `Allow: /vectorscope` |
| CCBot | Common Crawl | training | allowed | `Allow: /vectorscope` |

## Language versions

x-default: yes

| Lang | Title | Description | hreflang | html lang |
|---|---|---|---|---|
| en (this page) | Passed | Passed | Passed | Passed |
| uk | Passed | Passed | Passed | Passed |
| es | Passed | Passed | Passed | Passed |

## Where the text goes (characters)

| Stage | Characters |
|---|---|
| Raw HTML | 48,146 |
| Removed | 34,177 |
| Kept | 13,969 |
| In passages | 13,595 |
| Not in passages | 374 |
| Past the cap | 0 |

17 of 26 passages.

## Not checked

- 4 sections drawn as one zone on the map

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version](https://www.getlooploop.com)
- What AI says about your brand and reviews, the questions people ask, a target keyword: [Full version](https://www.getlooploop.com)
- Several real assistants side by side: [Brandscope](https://www.getlooploop.com/brandscope)
- How their answers change over time: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings map): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user Core Web Vitals, sites beyond one page: [GetLoopLoop](https://www.getlooploop.com)

A full version with explanations is available from GetLoopLoop: https://www.getlooploop.com
