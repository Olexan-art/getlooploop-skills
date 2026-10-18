Read this when you explain a finding to the user or cite a check code in `plan.json`.

# The checks and the AI crawlers

The scripts run these checks on every page. Each finding has a code, a severity, its passages and the evidence. Thresholds are named constants, with reasons, in `scripts/lib/checks.mjs`.

## Checks

| Code | Severity | Fires when | Tell the user |
|---|---|---|---|
| `robots_unreachable` | high | robots.txt answered 5xx or not at all | Say this first: under RFC 9309 a crawler then assumes it may fetch nothing. |
| `ai_search_blocked` | high | robots.txt disallows this path for a search or user-fetch crawler (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Googlebot, Bingbot) | **Say this first:** for those assistants the rest of the report does not matter until the rule changes. |
| `noindex` | high | meta robots says noindex | Search indexes that assistants answer from drop the page. |
| `header_noindex` | high | `X-Robots-Tag` says noindex or none | Same effect as meta noindex; say which one said it. Skipped for a saved page. |
| `js_dependent` | high | with `--render`, JavaScript adds at least 50% more words, and at least 150 | A retriever without JavaScript reads the smaller number. |
| `cap_overflow` | high | all 26 slots filled, text left over | Name what fell past the cap; it can never be retrieved. |
| `lost_faq_questions` | high | at least 3 sentences open with "Yes."/"No." (or similar), with fewer "?" than half of them | The questions were in buttons or accordions and were lost; each answer has lost its address. |
| `dominant_heading` | medium | 1 heading holds over 30% of the text | The chunker splits only at h2 (since 2.103, only at a line where the h2s, in their order, can be; a later line that repeats an earlier h2 is text). The subheadings there are h3 or styled text. |
| `mid_sentence_start` | medium | a passage opens lowercase or on punctuation | The window cut a section over 2,000 characters. |
| `nav_in_content` | medium | at least 4 consecutive lines of 1 or 2 words in the main text | Menus, tag lists or label tables became passage text. |
| `canonical_other` | medium | the canonical names another URL | Indexes prefer that URL. |
| `canonical_multiple` | medium | more than 1 canonical | Conflicting canonicals are ignored. |
| `jsonld_invalid` | medium | a JSON-LD block does not parse | The whole block is ignored. |
| `ai_training_blocked` | low | only training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) blocked | Usually deliberate; it does not stop an assistant citing the page today. |
| `thin_section` | low | a heading has under 150 characters under it | Too short to answer anything alone. |
| `truncated_teaser` | low (medium at 3 or more) | lines end in "…" or "..." (code excluded) | A cut-off teaser gives half a claim. |
| `repeated_claim` | low | the same 4-word phrase (with grammar words, not code) in at least half the groups | Repetition spends passages on what was said. |
| `canonical_missing`, `canonical_relative` | low | no canonical, or a relative one | Add 1 absolute canonical. |
| `jsonld_none` | low | no JSON-LD | Optional; FAQPage, HowTo, Product or Article markup states what the page is. |
| `meta_description_missing`, `meta_description_short`, `meta_description_long` | low | missing, under 70 or over 160 characters | The chunker puts the description into passage #0. |
| `cache_control_no_store` | low | `Cache-Control` says no-store | Caches keep no copy; a crawler that obeys it reads fresh each time. |
| `img_missing_alt` | low | an `<img>` has no alt | Retrievers and screen readers read the alt. Describe the image, or set `alt=""` if decorative. |
| `img_filename_alt` | low | an alt is only a file name | Write what the image shows. |
| `heading_skip` | low | a heading skips a level (h1 → h3, h2 → h4) | Keep heading levels consecutive. |
| `multiple_h1` | low | more than 1 h1 | Keep 1 h1 for the main subject. |
| `robots_not_checked` | info | a saved page was read | Run on the live URL to check the crawlers. |

## robots.txt rules

The check reads `/robots.txt` on the page's origin and follows RFC 9309 (https://www.rfc-editor.org/rfc/rfc9309):

- User-agent lines are grouped. A group that names the token (case-insensitive) replaces `*`; groups that name the same token are combined.
- The longest matching Allow or Disallow pattern wins (`*` and `$` supported). Allow wins a tie.
- 4xx: no rules. 5xx or no answer: everything disallowed.
- A user-fetch crawler that ignores robots.txt can still be blocked at the server. Tell a user who wants to block it.

## AI crawler tokens

| Token | Vendor | Purpose | Source |
|---|---|---|---|
| OAI-SearchBot | OpenAI | ChatGPT search results | https://developers.openai.com/api/docs/bots |
| ChatGPT-User | OpenAI | fetches when a user asks; OpenAI says robots.txt may not apply | same |
| GPTBot | OpenAI | training data | same |
| Claude-SearchBot | Anthropic | search result quality | https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler |
| Claude-User | Anthropic | fetches when a Claude user asks | same |
| ClaudeBot | Anthropic | training data | same |
| PerplexityBot | Perplexity | Perplexity search results | https://docs.perplexity.ai/guides/bots |
| Perplexity-User | Perplexity | fetches when a user asks; Perplexity says it generally ignores robots.txt | same |
| Google-Extended | Google | robots.txt-only token for Gemini training and grounding; does not affect Search | https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers |
| Googlebot | Google | Google Search | same |
| Bingbot | Microsoft | Bing's index | https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 (token `bingbot`; the page needs JavaScript) |
| CCBot | Common Crawl | the open web crawl | https://commoncrawl.org/ccbot |
