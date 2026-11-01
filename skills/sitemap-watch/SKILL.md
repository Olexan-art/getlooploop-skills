---
name: sitemap-watch
description: Watches the sitemaps of a site or of competitors over time. Takes a snapshot of every URL in a site's sitemaps (robots.txt, sitemap indexes, .xml.gz), stores it, and compares it with the previous snapshot - new pages, removed pages, changed lastmod, and new pages grouped by section. The script counts and compares; the agent reads what the new pages and sections mean. Use when the user asks what is new on a site, what new pages a competitor published, to check what is new at competitors, to track or monitor competitor sitemaps, or what changed in a sitemap. Also Ukrainian requests, e.g. «нові сторінки у конкурентів», «що нового в сайтмапі», «що нового на сайті конкурента», «відстежуй сайтмапи конкурентів».
---

Version 1.101.

# Sitemap watch

## Purpose

The script reads a site's sitemaps, stores the list of URLs as a snapshot, and compares two snapshots: which URLs are new, which are gone, whose `lastmod` changed, and how the new ones group by path. It does nothing else. You interpret the result.

## Requirements

- Node 18 or later. No `npm install`; built-ins only.
- `$SKILL` is this file's folder (`${CLAUDE_SKILL_DIR}` in Claude Code).
- Snapshots are kept in `~/.sitemap-watch/<site>/`, or in `--dir D`, or in `$SITEMAP_WATCH_DIR`. Keep using the same folder, or there is nothing to compare with. In a sandbox that forgets files between chats, tell the user the history will not survive.
- Network: GET requests to the site's robots.txt and sitemaps, one at a time.

## Rules

- **R1.** Answer in the user's language.
- **R2.** Report only what the script printed as counts and URLs. Never invent pages or numbers.
- **R3.** Your analysis is separate and labelled as your reading, not the tool's output.
- **R4.** If a snapshot is partial, capped or failed, say so before the counts: a "removed" URL may only be from a sitemap that failed this time.
- **R5.** Do not open or fetch the new pages unless the user asks. The URL paths are the evidence.
- **R6.** Sites under Russian country-code domains are refused by the script; do not work around it.

## Procedure

1. **Which sites.** Use the sites the user names. "Competitors" with no names: ask once for the domains, or use a list the user gave earlier in this project.
2. **Check history.** `node "$SKILL/scripts/sitemap-watch.mjs" list <site> [more sites]`
3. **No snapshots yet:** `node "$SKILL/scripts/sitemap-watch.mjs" snapshot <site> [more sites]`. Tell the user a baseline was taken (date, URL count, sitemaps read) and that there is nothing to compare yet; the next run will show what is new. Stop.
4. **Snapshots exist:** `node "$SKILL/scripts/sitemap-watch.mjs" diff <site> --fresh` (takes a new snapshot, then compares it with the previous one). For a longer period, compare against an older snapshot: `--from 2026-10-01` (a date prefix or a file from `list`). Add `--json` if you need every URL; Markdown lists 200 per section by default (`--limit 0` for all) and says how many it left out.
5. **Report**, in this order:
   1. Warnings from the script (partial, capped, failed sitemaps), if any.
   2. Period and counts: before → after, new, removed, lastmod changed.
   3. New pages, grouped: the groups table first (prefixes marked "New section" are sections that did not exist before), then the URLs. Many new URLs: show the groups and the 10 to 20 most telling URLs, and say how many more there are.
   4. Removed pages, briefly.
   5. **Agent's reading** (label it so): what the new sections and URL slugs suggest - new product or feature pages, a new blog topic, new locales, landing pages for a campaign, integrations, programmatic pages. Keep it to what the paths support, and say when a guess is a guess.
6. Several sites: one block per site, then 1 or 2 lines comparing them.

## Script output

- `snapshot`: `urls N from M sitemap(s)`, `failed`, `capped`, `saved <path>`, and `baseline` or `previous`.
- `NOT SAVED`: no URL could be read (no sitemap, 404, timeout). Nothing was stored. Tell the user the reason; suggest the sitemap URL if they know it (`snapshot https://site/sitemap_index.xml`).
- `diff`: `BASELINE ONLY` (one snapshot; nothing to compare), or a Markdown report with the counts, the warnings, the groups (`/blog/`, `/blog/2026/`) and the URL lists.
- Limits: 500 sitemaps and 200,000 URLs per snapshot (`--max-sitemaps`, `--max-urls`), 20 s per request. When a limit is hit the script says how much it left out; pass that on.
