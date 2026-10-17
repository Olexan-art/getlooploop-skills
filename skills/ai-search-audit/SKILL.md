---
name: ai-search-audit
description: Audit one public web page for classic search and AI search (SEO and GEO): robots.txt for Googlebot and AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot), noindex and snippet controls, sitemap and llms.txt, title, description, headings, canonical, links, images, structured data and retired rich results, trust signals, hreflang versions and their facts, how an AI retriever reads the page (passages, the 26-passage cap, hidden or JavaScript-only text), writing patterns, the target keyword, the questions people ask, and what the agent's own model believes about the brand and its reviews. A visual HTML report in English or Ukrainian, plus Markdown and JSON, listing problems, not fixes. Use when the user asks for an SEO or GEO audit, whether a page is ready for AI search, why Google, ChatGPT or Perplexity may not show or quote a page, or names ai-search-audit. Ukrainian too: «SEO-аудит сторінки», «аудит для ШІ-пошуку», «GEO-аудит». Scripts call no model.
---

Version 2.101. Versions count in thousandths (2.101, 2.102, …): the first number moves only on a breaking change.

# AI Search Audit (Lite)

**In plain words, for people opening this file:** before Google, Bing or an AI assistant can show or quote a page, a crawler has to be allowed in, the page has to say what it is, and the text has to survive the machine's reading. This skill checks one public page against the standard, published rules for all three, adds three readings only an AI can make (the questions people ask and whether the page answers them, what the agent's own model believes about the brand, and what it believes about the brand's reviews), and draws the result as one visual report: six status tiles, a map of the page with every problem marked where it is, the biggest problems, the bots in robots.txt, the Google and Bing checklist, the language versions, and where the text goes on its way to an AI retriever. The scripts are deterministic and call no model; the three readings are written by you, the agent running the skill, and the report marks each of them as the agent's judgement, with your model's name. The report lists problems; it does not explain them or say how to fix them.

**Коротко українською:** перш ніж Google, Bing чи ШІ-асистент покажуть або процитують сторінку, краулер має отримати дозвіл, сторінка має сказати, що вона таке, а текст має пережити машинне читання. Ця навичка перевіряє одну публічну сторінку за стандартними опублікованими правилами для всіх трьох, додає три прочитання, які може зробити лише ШІ (запитання людей і чи відповідає на них сторінка, що модель агента знає про бренд і що — про його відгуки), і показує результат одним звітом: шість плиток стану, мапа сторінки з кожною проблемою на її місці, найбільші проблеми, боти в robots.txt, чекліст Google і Bing, мовні версії й шлях тексту до ШІ-ретривера. Скрипти детерміновані й не викликають жодної моделі; три прочитання пишете ви, агент, і звіт позначає кожне як судження агента з назвою вашої моделі. Звіт перелічує проблеми, але не пояснює їх і не каже, як виправити.

**Answer the user in the language they wrote in.** The report has an EN | UK switch; English is the default.

## Before you start

- **`$SKILL` below is this skill's folder**, the one this SKILL.md is in. In Claude Code it is `${CLAUDE_SKILL_DIR}`. On claude.ai the skill's whole folder is copied into the code-execution sandbox; use the path you read this file from. Work in a writable directory of your own and call the scripts by their path.
- **No install.** `dist/read.mjs` and `dist/audit.mjs` are the scripts bundled with everything they need (cheerio and the Vectorscope skill's reading code), so plain `node` runs them: no `npm install`, no network for packages, no other skill folder needed.
- **Node 20.18 or later.** Check with `node --version`. If there is no Node, or an older one, say so and stop.
- **Network:** the read makes requests to the page, its site's `/robots.txt`, its sitemap (the robots.txt `Sitemap:` lines on the same site, else `/sitemap.xml`, and at most 5 child sitemaps of an index), `/llms.txt`, its hreflang alternates (at most 10), a HEAD (or a bodiless GET) of at most 30 of its links and at most 20 of its images, and one request each for the favicon, a path that does not exist (the soft-404 check), at most 3 URL variants (http, www or not, the trailing slash), a Markdown copy of the page, `/.well-known/ai-catalog.json` (then `/ai-catalog.json`) and, only when the page declares one, its IndexNow key file. When the page is an empty single-page-app shell, it is also rendered in a local Chrome or Chromium (see *Limits*). Nothing else, and every cap is reported in the report and the export.
- **Never re-create the audit by hand.** If the scripts cannot run here (no Node, no code execution, the network blocked), say so, say what would make them run, and stop. Do not fetch the page another way and check it yourself: findings made by hand are not the tool's.

## Steps

1. *script* `node "$SKILL/dist/read.mjs" <url> --out reading.json` (add `--render` to compare with a JavaScript render in a local Chrome or Chromium; an empty app shell is rendered without it).
   It prints what it read: the final URL and redirects, the page's size, passages, robots.txt, sitemap, llms.txt, the language versions, the links and images checked, the site checks, and every cap it hit. If it prints `REFUSED <code>` (exit code 2), skip to step 6: the report says why. Do not retry with another URL unless asked.
2. *judgement* **questions.json.** Read the `text` of every passage in `reading.json` (`vs.passages`), in full. Write 8 to 12 questions a person would say out loud to an assistant about the page's topic, and judge each against the passages (schema and rules below).
3. *judgement* **brand.json.** Name the brand the page belongs to (the site's own name). Answer the five buyer questions below **from your own knowledge only**: no browsing, no search, no other tool, and not from the page you just read. Where you do not know, say so with `"knows": false`.
4. *judgement* **reviews.json.** For the same brand, state from your own knowledge only the rating you believe it has on each of the 12 platforms below and on the control platform, or `"knows": false`.
5. *script* `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --brand brand.json --reviews reviews.json --check`
   It validates the three files against the reading and writes nothing. If it prints `REFUSED <file>: <reason>`, fix that file as the message says and run it again. A `warning` line is advice about the file, not a refusal.
6. *script* `node "$SKILL/dist/audit.mjs" reading.json --questions questions.json --brand brand.json --reviews reviews.json --html report.html --md report.md --json export.json` (add `--keyword "phrase"` when the user gave a target keyword; otherwise the keyword is read off the h1).
   It runs every check and prints the problems, numbered as on the report's map, with where each one is; judgement findings are marked `(judgement)`.
7. **Show the report** (required; see *Show the report*). A chat summary goes with it, never instead of it.

**`REFUSED refused_language_ru`** means the page is in Russian, and pages in Russian are not analysed. Skip steps 2 to 5, run step 6 without the judgement files (the report holds the reason and its sources), show it, say in one line in the chat that this tool does not analyse pages in Russian, and stop. Do not analyse the page in any other way.

`--html saved.html --final-url <url>` audits a saved copy instead (add `--robots saved-robots.txt` for its robots.txt); then nothing is fetched, and the sitemap, llms.txt, language versions, links, images and site checks are reported as not measured. `--save-html page.html` keeps the fetched copy.

## The files you write

Every one of them carries `agent` and `model` at the top level, as `groups.json` does in the Vectorscope skill: `agent` is the product you are running in ("Claude Code", "claude.ai", "Codex", "opencode", "Hermes"), `model` is your model's name as you know it ("Claude Opus 5.5", "GPT-5"). Up to 60 characters each. Fill them in honestly; if you do not know one, leave it out and the report says "model not stated". Never guess or invent either. The report prints the model beside every judgement finding.

**Never in Russian.** Questions, answers and quotes are in the page's language (or English for the brand and review answers), never Russian; a file holding a Russian-only letter is refused.

### questions.json

```json
{
  "agent": "Claude Code",
  "model": "Claude Opus 5.5",
  "topic": "what the page is about, in a few words",
  "questions": [
    { "id": "q1", "question": "My launch is tomorrow: will an assistant see the FAQ at the bottom?", "axes": ["urgency", "object"],
      "passage": 5, "verdict": "partial", "citable": false, "quote": "verbatim words from passage 5" },
    { "id": "q2", "question": "Can I paste a PDF instead of a web page?", "axes": ["object"], "passage": null, "verdict": "missing" }
  ]
}
```

Write the questions the way the GetLoopLoop Voicescope does: cross the page's topic with a real circumstance, and vary the circumstance along four axes, naming in `axes` the one to three each question uses (never all four in one question; every axis used at least once across the file):

- `urgency`: needed right now, on the move, or against a deadline;
- `device`: who is asking and on what (a phone, nothing installed, hands busy, somebody standing over them);
- `object`: the thing in front of them (the specific document, page, account, report or person);
- `obstacle`: what actually hurts (the mistake already made, the thing they cannot find, the thing they are afraid of getting wrong).

Rules, in the order they are usually broken: most questions must **not** contain the page's keyword (people describe the problem, not the jargon); write speech, in the first person, in the page's language; no wake words ("Hey Google", "Siri"); no question that is another with words added; include at least one the page probably does not answer.

Then judge each, from the passages only, never from what you know: `passage` is the single passage a retriever should return (`null` when none does); `verdict` is `complete` (that passage alone answers it), `partial` (it helps but leaves part out) or `missing`; `citable` is true only when the quoted words make sense quoted alone; `quote` is the exact words that answer, up to 400 characters, copied **verbatim** from that passage (whitespace, quote marks, dashes and case are folded, nothing else). A `missing` answer has no quote. The script refuses a quote that is not in its passage.

### brand.json

```json
{
  "agent": "Claude Code",
  "model": "Claude Opus 5.5",
  "brand": "BrightDesk",
  "basis": "own_knowledge",
  "answers": [
    { "question": "what_is", "knows": true, "answer": "BrightDesk is a help desk for small support teams. …" },
    { "question": "pricing", "knows": false, "answer": "" },
    { "question": "integrations", "knows": true, "answer": "…" },
    { "question": "weaknesses", "knows": false, "answer": "" },
    { "question": "alternatives", "knows": true, "answer": "…" }
  ]
}
```

The five questions, the GetLoopLoop Brandscope's, fixed (ask them of yourself in this wording):

1. `what_is`: What is <brand>? Answer in two sentences.
2. `pricing`: How much does <brand> cost? Name the plans and prices you know of. If you are not sure, say so.
3. `integrations`: What does <brand> integrate with? Name the integrations you know of.
4. `weaknesses`: What are the main weaknesses or complaints about <brand> compared with its alternatives?
5. `alternatives`: What are the main alternatives to <brand>, and when would somebody pick one of them instead?

**Honesty rules.** `basis` must be `"own_knowledge"`: by writing it you state that the answers come from what you already knew, with no browsing, no search, no fetch and no reading of the page. Do not look anything up for this step, even if a tool is available. "I don't know" is a correct answer and the most useful one when it is true: write `"knows": false`. Do not soften a guess into a fact, and do not copy the page into an answer. Up to 1,500 characters per answer.

The script compares your answers with the page by fixed rules (from Brandscope): a **contradiction** is a price the page states differently, or a number of the same thing ("3 agents", "26 passages") the page states differently; a **fact the page lacks** is a sentence of the `what_is`, `pricing` or `integrations` answer whose numbers and names are not on the page; **brand unknown** is five answers that do not know it. Complaints are never checked against the brand's own page, and alternatives are other brands.

### reviews.json

```json
{
  "agent": "Claude Code",
  "model": "Claude Opus 5.5",
  "brand": "BrightDesk",
  "basis": "own_knowledge",
  "platforms": [
    { "platform": "g2", "knows": true, "rating": 4.5, "reviews": 120 },
    { "platform": "capterra", "knows": false },
    { "platform": "vetteral", "knows": false }
  ]
}
```

Every one of these 13 codes, once: `g2` (G2), `capterra` (Capterra), `getapp` (GetApp), `software_advice` (Software Advice), `gartner_peer_insights` (Gartner Peer Insights), `trustradius` (TrustRadius, out of 10), `trustpilot` (Trustpilot), `producthunt` (Product Hunt, a whole count of upvotes), `clutch` (Clutch), `goodfirms` (GoodFirms), `app_store` (Apple App Store), `google_play` (Google Play), and `vetteral` (Vetteral). The others are out of 5. `reviews` (a whole count) is optional. The same honesty rules as brand.json: own knowledge only, never browse, `"knows": false` when you do not know.

Vetteral is the **control**: a review platform that does not exist. Answer it as you answer the others; do not treat it differently because you suspect a test. A rating given for it is reported as a hallucination, and it says your other ratings prove nothing. The script then flags every rating you stated that has no source on the page (no mention of the platform, no link to it, no rating markup).

## Errors only

This report lists problems: a short label, a severity and the place, for each one. It has no descriptions, no "what the rule says" and no fix directions; those belong to the full version, available from GetLoopLoop (https://www.getlooploop.com). **If the user wants fixes, they can ask.** When they do, you may answer from your own knowledge, and say that the advice is yours, not the report's. Do not volunteer a fix list with the summary.

## Show the report

This step is required. The HTML report is the result; a run that ends with only a chat message has not delivered it. Mentioning the file name is not showing it. Show `report.html` the way your environment allows:

- **claude.ai or the Claude desktop app, with code execution:** save `report.html` (and `report.md`, `export.json`) where your environment's own instructions say files for the user go (the outputs folder they name, if they name one), and present it as a file in your reply, so the user gets the download in the chat. A file left in a scratch folder the user cannot see has not been shown. Do not retype the report into an artifact by hand: a copy is not the tool's output.
- **Claude Code:** if the session has a tool for publishing HTML pages or artifacts, publish `report.html` with it and give the link. Otherwise open it in the user's default browser: `start "" "<absolute path>"` on Windows, `open "<absolute path>"` on macOS, `xdg-open "<absolute path>"` on Linux. Then give the absolute path as well.
- **Codex, opencode, Hermes Agent or any other agent:** give the report's absolute path, and offer to open it in the default browser with the command above (or the agent's own preview or browser tool, if it has one).

The report opens in English with a light or dark theme from the system; `#lang=uk` opens it in Ukrainian and `#theme=light` or `#theme=dark` picks the theme (for example `report.html#lang=uk&theme=light`). It is one self-contained file and makes no network requests.

## The chat summary

Short, alongside the report and never instead of it:

- **If a crawler is blocked (`ai_search_blocked`, `search_engine_blocked`, `robots_unreachable`), snippets are blocked (`snippet_blocked`) or the page is `noindex`, say that first.**
- The verdict line and the counts by severity, as the report states them.
- The biggest problems (the report's numbers 1 to 5), each with where it is.
- What was not checked: every cap the audit printed (links past 30, images past 20, alternates past 10, child sitemaps past 5, sections merged on the map, a render that could not run).
- Say once that the checks are deterministic and rest on a published rule or a threshold this skill names, and that the questions, the brand and the reviews are your own judgement as one model (name it), not what ChatGPT, Gemini or Perplexity say; the web Brandscope and Reviewscope ask three assistants.
- Do not claim that any assistant has indexed the page, ranks it or will cite it, and do not add a score.

## The checks

Each finding has a code, a severity (blocking, high, medium or low), the status tile it belongs to, who it concerns (developer, content, SEO), its layer (measured: a script counted it; derived: a fixed formula over measured values; judgement: your model, with `agent` and `model`), where it is, the evidence, and its rule sources (in the export). Findings that are not tied to one spot on the page (most of the brand, review and question findings, and several site checks) are counted on the map as "+N not tied to one spot".

| Tile | Codes |
|---|---|
| Shown well in search? | `not_https`, `title_missing` (high); `h1_missing`, `canonical_other`, `canonical_multiple`, `broken_links`, `viewport_missing`, `jsonld_invalid`, `schema_required_missing`, `image_lcp_lazy`, `image_oversized`, `mixed_content`, `soft_404`, `url_variants_inconsistent` (medium); `redirect_chain`, `sitemap_missing`, `sitemap_not_listed`, `title_too_long`, `title_too_short`, `meta_description_missing`, `meta_description_short`, `meta_description_long`, `h1_multiple`, `heading_order_skip`, `canonical_missing`, `canonical_relative`, `internal_links_none`, `image_alt_missing`, `image_dimensions_missing`, `image_not_lazy`, `image_legacy_format`, `image_no_srcset`, `html_lang_missing`, `social_tags_missing`, `page_weight_heavy`, `url_unreadable`, `schema_recommended_missing`, `favicon_missing`, `site_name_missing`, `hsts_missing`, `author_missing`, `about_contact_missing`, `organization_details_missing`, `article_date_missing`, `privacy_terms_missing`, `date_mismatch` (low); `structured_data_none`, `faq_rich_result_retired`, `rich_result_retired` (low, informational) |
| AI finds it? | `robots_unreachable`, `search_engine_blocked`, `ai_search_blocked`, `noindex` (blocking); `snippet_blocked` (high); `markdown_alternate_broken`, `ai_catalog_invalid`, `indexnow_key_broken` (low); `ai_training_blocked`, `llms_txt_missing` (low, informational) |
| AI reads all of it? | `cap_overflow`, `js_dependent`, `hero_lede_dropped`, `hidden_headings`, `spa_shell` (high; hidden headings are medium when the hidden text is short); `ssr_placeholder_text`, `h1_glued_words`, `nav_in_content`, `dominant_heading` (medium); `thin_section` (low) |
| AI quotes it right? | `faq_schema_not_visible`, `lost_faq_questions` (high); `mid_sentence_start`, `question_missing`, `keyword_not_in_title`, `keyword_variant_split`, `keyword_one_section` (medium); `truncated_teaser`, `repeated_claim`, `question_partial`, `off_keyword_share`, `promise_without_number`, `stock_phrases`, `repeated_sentence_shape`, `uniform_openings`, `unchecked_claims` (low; the writing patterns are medium when they recur, stock phrases from 2.0 per 1,000 words) |
| AI gets the brand right? | `brand_contradiction`, `review_rating_unbacked`, `review_control_hallucination` (high); `brand_fact_absent`, `brand_unknown`, `reviews_without_markup` (medium) |
| Languages in order? | `hreflang_no_return` (high); `hreflang_invalid_code`, `hreflang_no_self`, `hreflang_alternate_broken`, `title_duplicate_locales`, `locale_facts_differ` (medium); `description_duplicate_locales`, `hreflang_lang_mismatch`, `hreflang_no_x_default`, `llms_txt_one_language` (low) |

The passage checks are the Vectorscope skill's, run unchanged (h2 sections, 2,000-character windows, a 26-passage cap); `repeated_claim` and the keyword's "one section" use the page's h2 sections as their groups, so they need no embeddings. The Google and Bing checklist has 33 cells; Core Web Vitals and "in Google's index" are always *not measured* (they need field data and Search Console).

**Writing patterns** are the GetLoopLoop PatternScope's deterministic detectors, run over the kept text: stock phrases from a list written per language, repeated sentence shapes, runs of sentences that open the same way, and evaluative claims with nothing checkable in the sentence, each with its position (passage and word) and a density per 1,000 words. English, Ukrainian and Spanish are analysed; other languages are reported as not analysed. They are signals about worn writing, not an AI detector.

**The keyword** is `--keyword` when given, else the page's h1 with the site's name, a trailing year, a sales tail, a clause after a comma or colon and stop words at the edges trimmed (at most five words); the report says which. The promise-without-a-figure rule reads English only, and says so.

**Locale facts** compare the numbers in each h2 section across the language versions read, aligned by section order and only when both versions have the same number of sections; a version whose sections do not line up is listed as not compared. Numbers written as words are not read, and a number may differ on purpose (a local price).

**Structured data:** JSON-LD is parsed (microdata and RDFa types are listed). Required properties, as Google's pages list them, are checked for FAQPage, Product, SoftwareApplication (and WebApplication, MobileApplication), BreadcrumbList, Event, JobPosting, LocalBusiness, VideoObject, QAPage, WebSite, ProductGroup, Offer, AggregateOffer, Review and AggregateRating; recommended ones for those and Article (NewsArticle, BlogPosting), Organization and Person. Every FAQPage question must appear in the visible text. Rich results Google retired are informational (no Google rich result any more, not an error), each dated by its entry on https://developers.google.com/search/updates: FAQ (7 May 2026), How-to (14 September 2023), course info, estimated salary and vehicle listing (documentation removed 9 September 2025), ClaimReview (phased out 12 June 2025), special announcement (31 July 2025), practice problem (6 January 2026) and the sitelinks search box (29 November 2024).

**llms.txt:** the report notes that Google documents no use of it, quoting Google's AI features page: "You don't need to create new machine readable files, AI text files, or markup to appear in these features."

**AI crawlers:** robots.txt is matched by RFC 9309 (the Vectorscope skill's parser): GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot and CCBot. A 4xx robots.txt means no rules; a 5xx or no answer means everything is assumed disallowed.

**This skill's own thresholds** (each a named constant with its reason, in `scripts/lib/`): title 10 to 60 characters; description 70 to 160; a redirect chain is 2 or more hops; a heavy page is HTML over 500 KB or more than 30 scripts; a hard-to-read URL is over 115 characters, more than 2 query parameters or a session id; hidden headings are high from 200 hidden characters; an image is oversized over 200 KB and wants a srcset over 100 KB or from 800 px declared width; above the fold is the hero and at most its first two images, the first being the LCP candidate; `data-nosnippet` blocks snippets when it covers half the visible text; an app shell is under 150 words with an app root (`#root`, `#__next`, `#app`, …) holding under 200 characters; stock phrases are medium from 2.0 per 1,000 words; the keyword's off-phrase floor is half the passage text and "one section" is a third of the sections or fewer, from three sections.

## Refusal codes

| Code | Tell the user |
|---|---|
| `invalid_url` | That does not look like a web address. Ask for the full URL of a page. |
| `blocked_scheme` | Only http and https pages can be read. |
| `blocked_host`, `blocked_address` | That address is not a page on the public web: localhost, a private network, or a non-standard port. |
| `unreachable` | The page could not be reached. It may be down, or the name does not resolve. |
| `http_error` | The page answered with an error status (in the reading), or redirected more than 5 times. |
| `blocked` | The site turns automated readers away (HTTP 401, 403 or 429); retrying will not help. |
| `not_html` | The URL is a file such as a PDF or an image, not an HTML page. |
| `too_large` | The page is over the 3 MB ceiling. |
| `empty` | The page answered, but no readable text was left once navigation and boilerplate were removed. |
| `refused_language_ru` | The page is in Russian, and this tool does not analyse pages in Russian. One line in the chat, the report, nothing more. |

## Outputs

- `report.html`: one self-contained page (inline CSS and one small script, favicons as data URIs, a content security policy that blocks every network request, every piece of page text escaped), dark and light, EN | UK, safe down to 375 px. Judgement findings carry an "Agent's judgement · <model>" badge, and a note says that brand, reviews and questions are one model's view.
- `report.md`: the same audit in Markdown, in English: the status, the biggest problems, every problem with its code, place and layer, the page map as a list, the checklist, the bots, the language versions, where the text goes, and what was not checked.
- `export.json`: `getlooploop/ai-search-audit@1`. Every finding with `code`, `severity`, `area`, `owner`, `layer`, `judgement` (`agent`, `model`, or `null`), `label` (en, uk), `where`, `map` (zones and strip rows), `passages`, `evidence` and `rules` (each `{ name, url }`), plus the tiles, the checklist, the page map, robots, sitemap, llms.txt, languages, alternates, links, structured data, `keyword`, `writingPatterns`, `localeFacts`, `judgement` (the three files as validated), the reading's waterfall, `notChecked` (every cap) and `notMeasured`.
- `reading.json` (`getlooploop/ai-search-audit-reading@1`): everything read in step 1, so step 6 can be rerun offline.

## Limits

- One public URL per audit. The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s), on every redirect hop (5 at most) of every request.
- No login and no cookies; no Accept-Language, so a site that picks a language by location may answer in another language.
- No JavaScript in the reading. `--render`, or an empty app shell, also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile, and draws the sections only the render has as dashed zones on the map. With no browser, the report says the render was not done.
- 12-second timeout per request (8 for a link, an image or a site check), 3,000,000-character ceiling for HTML, 10 MB for a sitemap, 1 MB for llms.txt, the Markdown copy and ai-catalog.json.
- The brand and review readings are one model's knowledge at its training time; they are not a measurement of any assistant, and they say nothing about what ChatGPT, Gemini or Perplexity answer today.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`.
- The readable source is `scripts/` in the repository, built into `dist/` with esbuild; tests: `npm test` in the skill folder of a repository checkout.

## If the page cannot be fetched

When a request fails, read.mjs prints `REFUSED unreachable` (or another code above). In a sandbox, say what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows. On Free, Pro and Max plans the setting is **Allow network egress** (Settings > Capabilities); on Team and Enterprise plans an owner sets it in Organization settings > Capabilities (off, package managers only, package managers and specific domains, or all domains; with specific domains, the page's domain must be listed). If the plan's setting cannot allow the site, say that this page cannot be audited from claude.ai, and that the same skill runs in Claude Code or another agent on the user's own machine. Then stop.
- **Behind a proxy:** if `HTTPS_PROXY` or `HTTP_PROXY` is set and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front (Node 22.21 or later, or 24 or later).
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Say which code came back and stop.
