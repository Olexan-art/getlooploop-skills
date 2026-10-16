---
name: ai-search-audit
description: Audit one public web page for classic search and AI search (SEO and GEO) with deterministic checks that rest on published rules - HTTP status, redirects and HTTPS, robots.txt for Googlebot, Bingbot and AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot), noindex, sitemap and llms.txt, title, description, headings, canonical, links, images, viewport and social tags, JSON-LD and FAQ markup, hreflang language versions, and how an AI retriever reads the page (passages, the 26-passage cap, hidden or JavaScript-only text). Writes a visual HTML report in English or Ukrainian, plus Markdown and JSON, that lists problems, not fixes. Use when the user asks for an SEO audit, a GEO or AI search audit, whether a page is ready for AI search, why Google, ChatGPT or Perplexity may not show or quote a page, or names ai-search-audit. Ukrainian requests too, e.g. «SEO-аудит сторінки», «аудит для ШІ-пошуку», «GEO-аудит», «чи готова сторінка до ШІ-пошуку», «перевір сторінку для Google і ChatGPT». No model calls.
---

Version 2.101. Versions count in thousandths (2.101, 2.102, …): the first number moves only on a breaking change.

# AI Search Audit (Lite)

**In plain words, for people opening this file:** before Google, Bing or an AI assistant can show or quote a page, a crawler has to be allowed in, the page has to say what it is, and the text has to survive the machine's reading. This skill checks one public page against the standard, published rules for all three and draws the result as one visual report: six status tiles, a map of the page with every problem marked where it is, the biggest problems, the bots in robots.txt, the classic Google and Bing checklist, the language versions, and where the page's text goes on its way to an AI retriever. Every check is deterministic: no model, no embeddings, no judgement. The report lists problems; it does not explain them or say how to fix them.

**Коротко українською:** перш ніж Google, Bing чи ШІ-асистент покажуть або процитують сторінку, краулер має отримати дозвіл, сторінка має сказати, що вона таке, а текст має пережити машинне читання. Ця навичка перевіряє одну публічну сторінку за стандартними опублікованими правилами для всіх трьох і показує результат одним візуальним звітом: шість плиток стану, мапа сторінки з кожною проблемою на її місці, найбільші проблеми, боти в robots.txt, класичний чекліст Google і Bing, мовні версії і шлях тексту до ШІ-ретривера. Усі перевірки детерміновані: жодних моделей, ембедингів чи суджень. Звіт перелічує проблеми, але не пояснює їх і не каже, як виправити.

**Answer the user in the language they wrote in.** The report has an EN | UK switch; English is the default.

## Before you start

- **`$SKILL` below is this skill's folder**, the one this SKILL.md is in. In Claude Code it is `${CLAUDE_SKILL_DIR}`. On claude.ai the skill's whole folder is copied into the code-execution sandbox; use the path you read this file from. Work in a writable directory of your own and call the scripts by their path.
- **No install.** `dist/read.mjs` and `dist/audit.mjs` are the scripts bundled with everything they need (cheerio and the Vectorscope skill's reading code), so plain `node` runs them: no `npm install`, no network for packages, no other skill folder needed.
- **Node 20.18 or later.** Check with `node --version`. If there is no Node, or an older one, say so and stop.
- **Network:** the read makes requests to the page, its site's `/robots.txt`, its sitemap (the robots.txt `Sitemap:` lines on the same site, else `/sitemap.xml`, and at most 5 child sitemaps of an index), `/llms.txt`, its hreflang alternates (at most 10) and a HEAD (or a bodiless GET) of at most 30 of its links. Nothing else, and every cap is reported in the report and the export.
- **Never re-create the audit by hand.** If the scripts cannot run here (no Node, no code execution, the network blocked), say so, say what would make them run, and stop. Do not fetch the page another way and check it yourself: findings made by hand are not the tool's.

## Steps

1. *script* `node "$SKILL/dist/read.mjs" <url> --out reading.json` (add `--render` to compare with a JavaScript render in a local Chrome or Chromium).
   It prints what it read: the final URL and redirects, the page's size, passages, robots.txt, sitemap, llms.txt, the language versions, the links checked, and every cap it hit. If it prints `REFUSED <code>` (exit code 2), go to step 2 anyway: the report says why. Do not retry with another URL unless asked.
2. *script* `node "$SKILL/dist/audit.mjs" reading.json --html report.html --md report.md --json export.json`
   It runs every check and prints the problems, numbered as on the report's map, with where each one is.
3. **Show the report** (required; see *Show the report*). A chat summary goes with it, never instead of it.

**`REFUSED refused_language_ru`** means the page is in Russian, and pages in Russian are not analysed. Run step 2 as usual (the report holds the reason and its sources), show it, say in one line in the chat that this tool does not analyse pages in Russian, and stop. Do not analyse the page in any other way.

`--html saved.html --final-url <url>` audits a saved copy instead (add `--robots saved-robots.txt` for its robots.txt); then nothing is fetched, and the sitemap, llms.txt, language versions and links are reported as not measured. `--save-html page.html` keeps the fetched copy.

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

- **If a crawler is blocked (`ai_search_blocked`, `search_engine_blocked`, `robots_unreachable`) or the page is `noindex`, say that first.**
- The verdict line and the counts by severity, as the report states them.
- The biggest problems (the report's numbers 1 to 5), each with where it is.
- What was not checked: every cap the audit printed (links past 30, alternates past 10, child sitemaps past 5, sections merged on the map).
- Say once that every check is deterministic and rests on a published rule or a threshold this skill names; nothing was judged by a model.
- Do not claim that any assistant has indexed the page, ranks it or will cite it, and do not add a score.

## The checks

Each finding has a code, a severity (blocking, high, medium or low), the status tile it belongs to, who it concerns (developer, content, SEO), where it is, the evidence, and its rule sources (in the export).

| Tile | Codes |
|---|---|
| AI finds it? | `robots_unreachable`, `search_engine_blocked`, `ai_search_blocked`, `noindex` (blocking); `ai_training_blocked`, `llms_txt_missing` (low, informational) |
| Shown well in search? | `not_https`, `title_missing` (high); `h1_missing`, `canonical_other`, `canonical_multiple`, `broken_links`, `viewport_missing` (medium); `redirect_chain`, `sitemap_missing`, `sitemap_not_listed`, `title_too_long`, `title_too_short`, `meta_description_missing`, `meta_description_short`, `meta_description_long`, `h1_multiple`, `heading_order_skip`, `canonical_missing`, `canonical_relative`, `internal_links_none`, `image_alt_missing`, `html_lang_missing`, `social_tags_missing`, `page_weight_heavy`, `url_unreadable` (low) |
| AI reads all of it? | `cap_overflow`, `js_dependent`, `hero_lede_dropped`, `hidden_headings` (high; hidden headings are medium when the hidden text is short); `ssr_placeholder_text`, `h1_glued_words`, `nav_in_content`, `dominant_heading` (medium); `thin_section` (low) |
| AI quotes it right? | `faq_schema_not_visible`, `lost_faq_questions` (high); `mid_sentence_start` (medium); `truncated_teaser`, `repeated_claim` (low). In Lite this tile covers FAQ, markup and visible-text problems only. |
| Rich results & markup | `jsonld_invalid`, `schema_required_missing` (medium); `schema_recommended_missing`, `structured_data_none`, `faq_rich_result_retired` (low; the last two informational) |
| Languages in order? | `hreflang_no_return` (high); `hreflang_invalid_code`, `hreflang_no_self`, `hreflang_alternate_broken`, `title_duplicate_locales` (medium); `description_duplicate_locales`, `hreflang_lang_mismatch`, `hreflang_no_x_default`, `llms_txt_one_language` (low) |

The passage checks are the Vectorscope skill's, run unchanged (h2 sections, 2,000-character windows, a 26-passage cap); `repeated_claim` uses the page's h2 sections as its groups, so it needs no judgement. The classic checklist in the report has 24 cells; Core Web Vitals and "in Google's index" are always *not measured* (they need field data and Search Console).

**This skill's own thresholds** (each is in `scripts/lib/checks.mjs` with its reason): title 10 to 60 characters; description 70 to 160 characters; a redirect chain is 2 or more hops; a heavy page is HTML over 500 KB or more than 30 scripts; a hard-to-read URL is over 115 characters, more than 2 query parameters or a session id; hidden headings are high from 200 hidden characters.

**Structured data:** JSON-LD is parsed (microdata and RDFa types are listed). Required properties are checked for FAQPage, Product, SoftwareApplication (and WebApplication, MobileApplication), BreadcrumbList and HowTo; recommended ones for Article (and NewsArticle, BlogPosting) and Organization. Every FAQPage question must appear in the visible text. Google retired FAQ rich results (documented on 7 May 2026, https://developers.google.com/search/updates), so FAQPage markup is reported as informational.

**AI crawlers:** robots.txt is matched by RFC 9309 (the Vectorscope skill's parser): GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot and CCBot. A 4xx robots.txt means no rules; a 5xx or no answer means everything is assumed disallowed.

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

- `report.html`: one self-contained page (inline CSS and one small script, favicons as data URIs, a content security policy that blocks every network request, every piece of page text escaped), dark and light, EN | UK, safe down to 375 px.
- `report.md`: the same audit in Markdown, in English: the status, the biggest problems, every problem with its code and place, the page map as a list, the checklist, the bots, the language versions, where the text goes, and what was not checked.
- `export.json`: `getlooploop/ai-search-audit@1`. Every finding with `code`, `severity`, `area`, `owner`, `label` (en, uk), `where`, `map` (zones and strip rows), `passages`, `evidence` and `rules` (each `{ name, url }`), plus the tiles, the checklist, the page map, robots, sitemap, llms.txt, languages, alternates, links, structured data, the reading's waterfall, `notChecked` (every cap) and `notMeasured`.
- `reading.json` (`getlooploop/ai-search-audit-reading@1`): everything read in step 1, so step 2 can be rerun offline.

## Limits

- One public URL per audit. The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s), on every redirect hop (5 at most) of every request.
- No login and no cookies; no Accept-Language, so a site that picks a language by location may answer in another language.
- No JavaScript in the reading. `--render` also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile, and draws the sections only the render has as dashed zones on the map.
- 12-second timeout per request (8 for a link), 3,000,000-character ceiling for HTML, 10 MB for a sitemap, 1 MB for llms.txt.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`.
- The readable source is `scripts/` in the repository, built into `dist/` with esbuild; tests: `npm test` in the skill folder of a repository checkout.

## If the page cannot be fetched

When a request fails, read.mjs prints `REFUSED unreachable` (or another code above). In a sandbox, say what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows. On Free, Pro and Max plans the setting is **Allow network egress** (Settings > Capabilities); on Team and Enterprise plans an owner sets it in Organization settings > Capabilities (off, package managers only, package managers and specific domains, or all domains; with specific domains, the page's domain must be listed). If the plan's setting cannot allow the site, say that this page cannot be audited from claude.ai, and that the same skill runs in Claude Code or another agent on the user's own machine. Then stop.
- **Behind a proxy:** if `HTTPS_PROXY` or `HTTP_PROXY` is set and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front (Node 22.21 or later, or 24 or later).
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Say which code came back and stop.
