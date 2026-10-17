# AI Search Audit Lite: https://www.getlooploop.com/vectorscope

Semantic Chunking Visualizer for Any URL — Vectorscope · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 18 problems (blocking 0, high 0, medium 7, low 11)

Lite lists problems, not fixes: labels, severities and places. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such.

> Brand, reviews and questions: one model's view (Claude Opus 5.5), from its own knowledge, not ChatGPT, Gemini or Perplexity. The web Brandscope and Reviewscope ask three assistants.

Main phrase: “Semantic chunking” (read off the h1).

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 6 |
| AI finds it? | OK | 0 |
| AI reads all of it? | Problems | 2 |
| AI quotes it right? | Problems | 8 |
| AI gets the brand right? | Problems | 1 |
| Languages in order? | OK | 1 |

## Biggest problems

1. **Medium** · 2 broken links · `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card`
2. **Medium** · Required schema fields missing · `JSON-LD #2 $`
3. **Medium** · 2 passages start mid-sentence · `passages #6, #14`
4. **Medium** · No answer: “Can I paste a link to a PDF instead o…” · `question 11 · no passage` · *Agent's judgement · Claude Opus 5.5*
5. **Medium** · No answer: “The page I need is behind a login on …” · `question 12 · no passage` · *Agent's judgement · Claude Opus 5.5*

## All problems

| # | Severity | Problem | Where | Layer | Code |
|---|---|---|---|---|---|
| 1 | Medium | 2 broken links | `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card` | Measured | `broken_links` |
| 2 | Medium | Required schema fields missing | `JSON-LD #2 $` | Measured | `schema_required_missing` |
| 3 | Medium | 2 passages start mid-sentence | `passages #6, #14` | Derived | `mid_sentence_start` |
| 4 | Medium | No answer: “Can I paste a link to a PDF instead o…” | `question 11 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 5 | Medium | No answer: “The page I need is behind a login on …” | `question 12 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 6 | Medium | Menu lines inside the text | `passage #1` | Measured | `nav_in_content` |
| 7 | Medium | AI doesn't know the brand | `brand questions 1–5` | Agent's judgement · Claude Opus 5.5 | `brand_unknown` |
| 8 | Low | Answered in part: “Can I check a page from my phone with…” | `question 4 · passage #1` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 9 | Low | 1 very short section | `h2 “Important passage outside the cap?”` | Measured | `thin_section` |
| 10 | Low | Answered in part: “My launch page goes live tomorrow: wi…” | `question 1 · passage #5` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 11 | Low | Answered in part: “Our site is a React app. Will the tex…” | `question 9 · passage #5` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 12 | Low | 2 sentences of one shape | `passage #7 · word 892, passage #15 · word 2303` | Measured | `repeated_sentence_shape` |
| 13 | Low | Answered in part: “I have twenty pages to check before F…” | `question 10 · passage #14` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 14 | Low | FAQ rich result retired | `FAQPage` | Measured | `faq_rich_result_retired` |
| 15 | Low | How-to: no rich result any more | `HowTo` | Measured | `rich_result_retired` |
| 16 | Low | 131 KB, 40 scripts | `HTML` | Derived | `page_weight_heavy` |
| 17 | Low | llms.txt: one language only | `/llms.txt` | Measured | `llms_txt_one_language` |
| 18 | Low | No contact link | `contact link` | Measured | `about_contact_missing` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero · problems 6, 8
3. Sidebar · unseen
4. What does this mean?
5. Important passage outside the cap? · problems 9
6. Models and retrieval caps vary.
7. How to read your result · problems 3, 10, 11
8. What is semantic chunking? · problems 12
9. Is my content ready for AI search?
10. Using Vectorscope to test a RAG pipeline
11. Who is Vectorscope for?
12. Words used on this page
13. 4 more sections · problems 1, 3, 12, 13
14. Footer

**`<head>`**

- title: 54 characters
- meta description: 152 characters
- canonical: /vectorscope
- meta robots: index, follow · index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1
- hreflang: en · uk · es · x-default
- html lang: en
- JSON-LD: Organization, WebSite +6 · problems 2, 14, 15
- Open Graph: 4 of 4 tags
- viewport: set
- scripts: 40 · 1 blocking · problems 16
- favicon: loads

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: present · 32 links · problems 17
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
| Image sizes, formats, lazy loading, srcset | Not on this page |
| Eligible for a snippet (no nosnippet, max-snippet:0) | Passed |
| A favicon that loads | Passed |
| WebSite name markup on the home page | Not on this page |
| No http:// resources on https | Passed |
| A missing page answers 404 | Passed |
| http, www and slash variants end at the page | Passed |
| Strict-Transport-Security header | Passed |
| Author, About, Contact, organisation, dates, privacy and terms | Warning |

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

| Lang | Title | Description | hreflang | Same facts |
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

- Descriptions of each problem and directions to fix it: [Full version from GetLoopLoop](https://www.getlooploop.com)
- What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews: [Brandscope](https://www.getlooploop.com/brandscope) · [Reviewscope](https://www.getlooploop.com/reviewscope)
- How their answers change from day to day: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user speed, sites over 50 pages, tracking over time: [GetLoopLoop](https://www.getlooploop.com)

Full report with explanations: https://www.getlooploop.com
