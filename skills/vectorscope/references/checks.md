# The checks and the AI crawlers

Read this when you explain a finding to the user or cite a check code in `plan.json`.

The scripts run these on every page; each finding has a code, a severity, the passages it rests on and the evidence. Thresholds are named constants in `scripts/lib/checks.mjs`, each with its reason.

| Code | Severity | What it means | Tell the user |
|---|---|---|---|
| `robots_unreachable` | high | robots.txt answered 5xx or not at all | Under RFC 9309 a crawler then assumes it may fetch nothing. Say this first. |
| `ai_search_blocked` | high | robots.txt disallows this path for a search or user-fetch crawler (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Googlebot, Bingbot) | **Say this first:** for those assistants the rest of the report is moot until the rule changes. |
| `noindex` | high | meta robots says noindex | Search indexes that assistants answer from will drop the page. |
| `header_noindex` | high | the `X-Robots-Tag` response header says noindex or none | Same effect as meta robots noindex; say which one said it. A saved page has no headers, so this check is skipped for one. |
| `js_dependent` | high | with `--render`, JavaScript adds 50% more words or more (and at least 150) | A retriever that does not run JavaScript reads the smaller number. |
| `cap_overflow` | high | all 26 slots filled and text left over | Name what fell past the cap; it can never be retrieved. |
| `lost_faq_questions` | high | 3 or more sentences open with "Yes."/"No." (and similar) and there are fewer "?" than half of them | The questions were in buttons or accordions and did not survive; each answer has lost its address. |
| `dominant_heading` | medium | one heading holds over 30% of the text | The chunker splits only at h2 (since 2.103, only at a line where the h2s, in their order, can be; a later line that repeats an earlier h2 is text); the subheadings there are h3 or styled text. |
| `mid_sentence_start` | medium | a passage opens lowercase or on punctuation | A section over 2,000 characters was cut by the window. |
| `nav_in_content` | medium | 4 or more consecutive one-or-two-word lines inside the main text | Menus, tag lists or label tables became passage text. |
| `canonical_other` | medium | the canonical names another URL | Indexes will prefer that URL. |
| `canonical_multiple` | medium | more than one canonical | Conflicting canonicals are ignored. |
| `jsonld_invalid` | medium | a JSON-LD block does not parse | It is ignored whole. |
| `ai_training_blocked` | low | only training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) are blocked | Usually deliberate; it does not stop an assistant citing the page today. |
| `thin_section` | low | a heading with fewer than 150 characters under it | Too short to answer anything alone. |
| `truncated_teaser` | low (medium at 3 or more) | lines ending in "…" or "..." (code samples excluded) | A cut-off teaser gives the retriever half a claim. |
| `repeated_claim` | low | the same 4-word phrase (with grammar in it, not code) in at least half the groups | Repetition spends passages on what was already said. |
| `canonical_missing`, `canonical_relative` | low | no canonical, or a relative one | Add one absolute canonical. |
| `jsonld_none` | low | no JSON-LD | Optional; FAQPage, HowTo, Product or Article markup states what the page is. |
| `meta_description_missing`, `meta_description_short`, `meta_description_long` | low | missing, under 70 or over 160 characters | The chunker puts the description into passage #0. |
| `cache_control_no_store` | low | the `Cache-Control` header says no-store | Caches are told not to keep a copy; a crawler that honours it reads fresh each time. |
| `img_missing_alt` | low | an `<img>` has no alt attribute | A retriever and a screen reader both read the alt; describe the image or set `alt=""` if it is decorative. |
| `img_filename_alt` | low | an alt is only a file name | A file name says nothing; write what the image shows. |
| `heading_skip` | low | a heading jumps a level (h1 → h3, h2 → h4) | Keep heading levels consecutive for readers and retrievers. |
| `multiple_h1` | low | more than one h1 | One page, one main subject: keep a single h1. |
| `robots_not_checked` | info | a saved page was read | Run on the live URL to check the crawlers. |

## AI crawlers

The robots.txt check reads `/robots.txt` on the page's own origin and follows RFC 9309: user-agent lines are grouped; a group naming the token (matched case-insensitively) replaces `*`; groups naming the same token are combined; the longest matching Allow or Disallow pattern wins (`*` and `$` supported), and Allow wins a tie. A 4xx robots.txt means no rules; a 5xx or no answer means everything is assumed disallowed. The tokens, as the vendors document them:

| Token | Vendor | Purpose | Source |
|---|---|---|---|
| OAI-SearchBot | OpenAI | ChatGPT search results | https://developers.openai.com/api/docs/bots |
| ChatGPT-User | OpenAI | fetches when a user asks; OpenAI says robots.txt rules may not apply | same |
| GPTBot | OpenAI | training data | same |
| Claude-SearchBot | Anthropic | search result quality | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler |
| Claude-User | Anthropic | fetches when a Claude user asks | same |
| ClaudeBot | Anthropic | training data | same |
| PerplexityBot | Perplexity | Perplexity search results | https://docs.perplexity.ai/guides/bots |
| Perplexity-User | Perplexity | fetches when a user asks; Perplexity says it generally ignores robots.txt | same |
| Google-Extended | Google | a robots.txt-only token for Gemini training and grounding; Google says it does not affect Search | https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers |
| Googlebot | Google | Google Search | same |
| Bingbot | Microsoft | Bing's index | https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 (token `bingbot`; that page renders with JavaScript) |
| CCBot | Common Crawl | the open web crawl | https://commoncrawl.org/ccbot |

RFC 9309: https://www.rfc-editor.org/rfc/rfc9309. A user-fetch crawler that ignores robots.txt can still be blocked at the server; say so if the user wants to block it.
