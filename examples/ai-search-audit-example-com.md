# AI Search Audit Lite: https://example.com/

Example Domain · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 22 problems (blocking 0, high 0, medium 6, low 16)

Lite lists problems, not fixes: labels, severities and places. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such.

> Brand, reviews and questions: one model's view (Claude Opus 5.5), from its own knowledge, not ChatGPT, Gemini or Perplexity. The web Brandscope and Reviewscope ask three assistants.

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 14 |
| AI finds it? | OK | 1 |
| AI reads all of it? | OK | 0 |
| AI quotes it right? | Problems | 6 |
| AI gets the brand right? | Problems | 1 |
| Languages in order? | One version | 0 |

## Biggest problems

1. **Medium** · No h1 · `<h1>`
2. **Medium** · 2 URL variants end elsewhere · `http, www`
3. **Medium** · No answer: “Who owns example.com?” · `question 4 · no passage` · *Agent's judgement · Claude Opus 5.5*
4. **Medium** · No answer: “Can I buy example.com, or a domain li…” · `question 6 · no passage` · *Agent's judgement · Claude Opus 5.5*
5. **Medium** · No answer: “Which other domains are reserved for …” · `question 7 · no passage` · *Agent's judgement · Claude Opus 5.5*

## All problems

| # | Severity | Problem | Where | Layer | Code |
|---|---|---|---|---|---|
| 1 | Medium | No h1 | `<h1>` | Measured | `h1_missing` |
| 2 | Medium | 2 URL variants end elsewhere | `http, www` | Measured | `url_variants_inconsistent` |
| 3 | Medium | No answer: “Who owns example.com?” | `question 4 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 4 | Medium | No answer: “Can I buy example.com, or a domain li…” | `question 6 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 5 | Medium | No answer: “Which other domains are reserved for …” | `question 7 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 6 | Medium | AI knows, the page lacks · 1 | `brand question 1 · not on the page` | Agent's judgement · Claude Opus 5.5 | `brand_fact_absent` |
| 7 | Low | Answered in part: “I need a fake email address for a dem…” | `question 3 · passage #1` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 8 | Low | Answered in part: “On my phone the link opens a bare pag…” | `question 5 · passage #0` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 9 | Low | Answered in part: “Can I point my own app at example.com…” | `question 9 · passage #1` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 10 | Low | No description | `<meta name="description">` | Measured | `meta_description_missing` |
| 11 | Low | No canonical | `<link rel="canonical">` | Measured | `canonical_missing` |
| 12 | Low | No structured data | `JSON-LD, microdata, RDFa` | Measured | `structured_data_none` |
| 13 | Low | No WebSite name markup | `WebSite name` | Measured | `site_name_missing` |
| 14 | Low | No Organization markup | `no Organization markup` | Measured | `organization_details_missing` |
| 15 | Low | Preview tags missing | `og:title, og:description, og:image, twitter:card` | Measured | `social_tags_missing` |
| 16 | Low | Favicon does not load | `<link rel="icon">` | Measured | `favicon_missing` |
| 17 | Low | No sitemap found | `sitemap.xml` | Measured | `sitemap_missing` |
| 18 | Low | No llms.txt | `/llms.txt` | Measured | `llms_txt_missing` |
| 19 | Low | No internal links | `<a href>` | Measured | `internal_links_none` |
| 20 | Low | No HSTS header | `Strict-Transport-Security` | Measured | `hsts_missing` |
| 21 | Low | No about or contact link | `about link, contact link` | Measured | `about_contact_missing` |
| 22 | Low | No privacy or terms link | `privacy link, terms link` | Measured | `privacy_terms_missing` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Top of the content · problems 7, 8, 9

**`<head>`**

- title: 14 characters
- meta description: none · problems 10
- canonical: none · problems 11
- meta robots: not set
- hreflang: none
- html lang: en
- JSON-LD: none · problems 12, 13, 14
- Open Graph: 0 of 4 tags · problems 15
- viewport: set
- scripts: 1 · 0 blocking
- favicon: data: URI · problems 16

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: not found · problems 17
- llms.txt: none · problems 18
- Markdown copy: none
- ai-catalog.json: none

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
| Image sizes, formats, lazy loading, srcset | Not on this page |
| Eligible for a snippet (no nosnippet, max-snippet:0) | Passed |
| A favicon that loads | Warning |
| WebSite name markup on the home page | Warning |
| No http:// resources on https | Passed |
| A missing page answers 404 | Passed |
| http, www and slash variants end at the page | Problem |
| Strict-Transport-Security header | Warning |
| Author, About, Contact, organisation, dates, privacy and terms | Warning |

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

## Not checked

- Writing patterns: 25 words, under the 60 the density needs; no score
- Keyword not checked: no --keyword and no h1 to read one from

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version from GetLoopLoop](https://www.getlooploop.com)
- What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews: [Brandscope](https://www.getlooploop.com/brandscope) · [Reviewscope](https://www.getlooploop.com/reviewscope)
- How their answers change from day to day: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user speed, sites over 50 pages, tracking over time: [GetLoopLoop](https://www.getlooploop.com)

Full report with explanations: https://www.getlooploop.com
