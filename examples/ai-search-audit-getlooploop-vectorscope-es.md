# AI Search Audit Lite: https://www.getlooploop.com/es/vectorscope

Fragmentado semántico de tu página — Vectorscope · checked 17 Oct 2026 · skill 2.101

**Nothing hides text from AI** · 17 problems (blocking 0, high 0, medium 7, low 10)

Lite lists problems, not fixes: labels, severities and places. The checks are deterministic (measured or derived); the questions, the brand and the reviews are the agent's judgement, marked as such.

> Brand, reviews and questions: one model's view (Claude Opus 5.5), from its own knowledge, not ChatGPT, Gemini or Perplexity. The web Brandscope and Reviewscope ask three assistants.

Main phrase: “El fragmentado semántico” (read off the h1).

## Status

| Question | State | Problems |
|---|---|---|
| Shown well in search? | Problems | 6 |
| AI finds it? | OK | 0 |
| AI reads all of it? | Problems | 2 |
| AI quotes it right? | Problems | 7 |
| AI gets the brand right? | Problems | 1 |
| Languages in order? | OK | 1 |

## Biggest problems

1. **Medium** · 2 broken links · `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card`
2. **Medium** · Required schema fields missing · `JSON-LD #2 $`
3. **Medium** · 3 passages start mid-sentence · `passages #6, #8, #15`
4. **Medium** · No answer: “¿Puedo pegar el enlace de un PDF en l…” · `question 11 · no passage` · *Agent's judgement · Claude Opus 5.5*
5. **Medium** · No answer: “La página que necesito solo se abre t…” · `question 12 · no passage` · *Agent's judgement · Claude Opus 5.5*

## All problems

| # | Severity | Problem | Where | Layer | Code |
|---|---|---|---|---|---|
| 1 | Medium | 2 broken links | `div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card, div.mt-12.space-y-14 > section#more > div.mt-7.grid > a.group.pt-card` | Measured | `broken_links` |
| 2 | Medium | Required schema fields missing | `JSON-LD #2 $` | Measured | `schema_required_missing` |
| 3 | Medium | 3 passages start mid-sentence | `passages #6, #8, #15` | Derived | `mid_sentence_start` |
| 4 | Medium | No answer: “¿Puedo pegar el enlace de un PDF en l…” | `question 11 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 5 | Medium | No answer: “La página que necesito solo se abre t…” | `question 12 · no passage` | Agent's judgement · Claude Opus 5.5 | `question_missing` |
| 6 | Medium | Menu lines inside the text | `passage #1` | Measured | `nav_in_content` |
| 7 | Medium | AI doesn't know the brand | `brand questions 1–5` | Agent's judgement · Claude Opus 5.5 | `brand_unknown` |
| 8 | Low | Answered in part: “¿Puedo revisar una página desde el mó…” | `question 4 · passage #1` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 9 | Low | 1 very short section | `h2 “¿Un pasaje importante fuera del límite?”` | Measured | `thin_section` |
| 10 | Low | Answered in part: “Mañana publicamos la página: ¿un asis…” | `question 1 · passage #5` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 11 | Low | Answered in part: “Nuestra web es una app de React. ¿Se …” | `question 9 · passage #5` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 12 | Low | Answered in part: “Tengo veinte páginas que revisar ante…” | `question 10 · passage #15` | Agent's judgement · Claude Opus 5.5 | `question_partial` |
| 13 | Low | FAQ rich result retired | `FAQPage` | Measured | `faq_rich_result_retired` |
| 14 | Low | How-to: no rich result any more | `HowTo` | Measured | `rich_result_retired` |
| 15 | Low | 134 KB, 42 scripts | `HTML` | Derived | `page_weight_heavy` |
| 16 | Low | llms.txt: one language only | `/llms.txt` | Measured | `llms_txt_one_language` |
| 17 | Low | No contact link | `contact link` | Measured | `about_contact_missing` |

## Page map

Top to bottom; the numbers are the problems above. Unseen: the text reaches no passage an AI retriever would read.

1. Site header · navigation
2. Hero · problems 6, 8
3. Sidebar · unseen
4. ¿Qué significa esto?
5. ¿Un pasaje importante fuera del límite? · problems 9
6. Los modelos y los límites varían.
7. Cómo leer tu resultado · problems 3, 10, 11
8. ¿Qué es el fragmentado semántico? · problems 3
9. ¿Está mi contenido listo para la búsqueda con IA?
10. Usar Vectorscope para probar un pipeline RAG
11. ¿Para quién es Vectorscope?
12. Palabras usadas en esta página
13. 4 more sections · problems 1, 3, 12
14. Footer

**`<head>`**

- title: 48 characters
- meta description: 146 characters
- canonical: /es/vectorscope
- meta robots: index, follow · index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1
- hreflang: en · uk · es · x-default
- html lang: es
- JSON-LD: Organization, WebSite +6 · problems 2, 13, 14
- Open Graph: 4 of 4 tags
- viewport: set
- scripts: 42 · 1 blocking · problems 15
- favicon: loads

**`robots.txt` · `llms.txt`**

- Google · Bing: allowed
- AI search bots: allowed
- AI training bots: allowed
- sitemap.xml: lists the page
- llms.txt: present · 32 links · problems 16
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

## Bots in robots.txt (path `/es/vectorscope`)

| Bot | Vendor | Purpose | Verdict | Rule |
|---|---|---|---|---|
| OAI-SearchBot | OpenAI | search | allowed | `Allow: /es` |
| ChatGPT-User | OpenAI | a user's question | allowed | `Allow: /es` |
| GPTBot | OpenAI | training | allowed | `Allow: /es` |
| Claude-SearchBot | Anthropic | search | allowed | `Allow: /es` |
| Claude-User | Anthropic | a user's question | allowed | `Allow: /es` |
| ClaudeBot | Anthropic | training | allowed | `Allow: /es` |
| PerplexityBot | Perplexity | search | allowed | `Allow: /es` |
| Perplexity-User | Perplexity | a user's question | allowed | `Allow: /es` |
| Google-Extended | Google | training | allowed | `Allow: /es` |
| Googlebot | Google | web index | allowed | `Allow: /es` |
| Bingbot | Microsoft | web index | allowed | `Allow: /es` |
| CCBot | Common Crawl | training | allowed | `Allow: /es` |

## Language versions

x-default: yes

| Lang | Title | Description | hreflang | Same facts |
|---|---|---|---|---|
| es (this page) | Passed | Passed | Passed | Passed |
| en | Passed | Passed | Passed | Passed |
| uk | Passed | Passed | Passed | Passed |

## Where the text goes (characters)

| Stage | Characters |
|---|---|
| Raw HTML | 50,441 |
| Removed | 35,410 |
| Kept | 15,031 |
| In passages | 14,590 |
| Not in passages | 441 |
| Past the cap | 0 |

18 of 26 passages.

## Not checked

- The promise-without-a-figure rule reads English only
- 4 sections drawn as one zone on the map

## What this check cannot see

- Descriptions of each problem and directions to fix it: [Full version from GetLoopLoop](https://www.getlooploop.com)
- What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews: [Brandscope](https://www.getlooploop.com/brandscope) · [Reviewscope](https://www.getlooploop.com/reviewscope)
- How their answers change from day to day: [AI answer volatility](https://www.getlooploop.com/ai-volatility)
- How AI groups your text by meaning (embeddings): [Vectorscope](https://www.getlooploop.com/vectorscope)
- Search Console data, real-user speed, sites over 50 pages, tracking over time: [GetLoopLoop](https://www.getlooploop.com)

Full report with explanations: https://www.getlooploop.com
