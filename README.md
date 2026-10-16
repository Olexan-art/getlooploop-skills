English · [Українська](README.uk.md)

# GetLoopLoop skills

Vectorscope skill **2.103**. Versions count in thousandths (2.101, 2.102, …), so the first number moves only on a breaking change.

Agent Skills from [GetLoopLoop](https://www.getlooploop.com), for claude.ai and the Claude desktop app, Claude Code, Codex, opencode, Hermes Agent and other agents that load `SKILL.md` skills.

| Skill | What it does |
|---|---|
| [`vectorscope`](skills/vectorscope/SKILL.md) | Shows how a retrieval system reads public pages: the product's exact fetch, extraction, chunking and 26-passage cap, robots.txt verdicts for AI crawlers, automatic structure checks, and the agent's grouping, query test and rewrite plan. Compares 2 to 5 pages. |

## In plain words

Before an AI assistant can quote your page, a machine has to read it, and it does not read it the way you do. It fetches the page once, throws away the menus, buttons and footers, and cuts the rest into passages of about 2,000 characters. It keeps at most 26. Each passage is later found and quoted **on its own**, without the page around it.

This skill runs those same steps on any public page and tells you what to fix: whether AI crawlers are even allowed in, which passages lost their question or their subject, what fell past the 26-passage limit, which typical questions the page answers and which it does not, and how to rewrite the weakest passages so each one stands on its own.

It does not rank your page, give it a score, detect AI-written text, or predict what any assistant will say about you.

## Features

- **The machine's reading:** the exact fetch, extraction, chunking and 26-passage cap of the live tool; how many words survive, how many passages they become, what falls past the cap.
- **Measured, derived, judgement:** every section and number carries a tag saying whether the parser measured it, a fixed formula derived it, or the agent judged it; the export splits into `measured` and `judgement` the same way.
- **Where the text goes** (at the end of the report, folded under a line that gives the characters past the cap): a character waterfall from the raw HTML to the passages (removed by the cleaner, kept, in passages without double-counting the overlap, past the cap), a table of what the cleaner removed and why (the element, its CSS path, its characters, how its text begins), and a map of how much of each section reached a passage.
- **Every number explained:** a "?" beside each number opens its formula, unit, threshold and known limits, in English or Ukrainian; the Markdown ends with the same list and the export carries it as a `metrics` dictionary.
- **An honest past-the-cap count:** characters past the cap are counted from the unique text in passages, so a page whose cap cut a tail no longer reads 0; the 2.101 number stays in the export as `charsUnread`.
- **AI crawlers first:** robots.txt checked for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot and CCBot, with RFC 9309 matching. If the crawlers that answer people are blocked, the report says so before anything else.
- **Automatic checks**, each with a code, the passages it rests on and the evidence: FAQ answers that lost their questions, one heading carrying too much of the page, passages cut mid-sentence, navigation inside the content, thin sections, truncated teasers, the same claim in every section, canonical, JSON-LD and meta description.
- **The page's vocabulary, phrases first:** the two-to-four-word phrases the page owns, ranked by how many passages use them, then its narrative words. What the page says, not search demand.
- **Grouping by the agent's reading:** the passages grouped by subject and named, with the page's own heading or keywords kept as the label source.
- **Query test:** 5 to 10 typical questions (yours or the agent's), the best passage for each, whether it answers completely, and the exact words a retriever could quote.
- **Rewrite plan:** prioritised fixes tied to the checks, with before → after rewrites for the weakest passages.
- **Compare 2 to 5 pages** on one shared topic dictionary: a topic × page table, topic gaps, fact gaps, and who wins each query.
- **Before and after:** diff a page against an earlier reading.
- **Optional JavaScript render** with a local Chrome or Chromium, to see how much of the page only exists after scripts run.
- **One self-contained HTML report** in English or Ukrainian (a switch at the top), light or dark, readable on a phone, with no network requests; plus Markdown and JSON.

Why the groups are "the agent's reading": the live tool groups passages by comparing their embeddings. This skill makes no model or embedding calls, so the agent that runs it reads the passages and groups them by subject instead. The fetching, the cutting, the cap and the checks are deterministic; the grouping, the query verdicts and the plan are a judgement, and the scripts validate each of them (every quote must be verbatim from its passage). For the embedding-based reading with the map, use the free tool at https://www.getlooploop.com/vectorscope.

## What you get

The top of the report, dark and light: the tags beside every section and number, and the info panel that explains them:

![Info panel and the measured, derived and judgement tags](docs/report-layers.png)

Where the text goes, from the raw HTML to the passages:

![Character waterfall](docs/report-waterfall.png)

What the cleaner removed, largest first, and how much of each section reached a passage:

![Removals table](docs/report-removals.png)

![Section map](docs/report-sections.png)

The "?" beside a number: its formula, unit, threshold and limits:

![A metric's explanation, open](docs/report-metric-help.png)

The rest of the top of the report, dark and light:

![Report header, dark theme: pipeline, counters with the cap reached, reading strip](docs/report-dark.png)

![Report header, light theme](docs/report-light.png)

The same report with the interface in Ukrainian (page content is never translated):

![Report in Ukrainian](docs/report-uk.png)

The checks: the AI-crawler table first, then the technical markup and the findings, each with its passages and what to do:

![AI crawler table and checks](docs/report-checks.png)

The rewrite plan, with before → after:

![Rewrite plan with before and after](docs/report-plan.png)

The query test:

![Query test](docs/report-queries.png)

The page's vocabulary: the phrases it owns first, its narrative words second:

![Phrases this page owns, then narrative words](docs/report-vocabulary.png)

Comparing two pages: topics × pages, topic gaps, and who wins each query:

![Compare mode](docs/report-compare.png)

The footer, and the report on a phone:

![Footer](docs/report-footer.png)

![The report on a narrow screen](docs/report-mobile.png)

Three real runs are in [`examples/`](examples), each with the files the agent wrote in [`examples/judgement/`](examples/judgement):

- the Vectorscope page itself, which needs 17 passages and loses nothing to the cap ([HTML](examples/getlooploop-vectorscope.html), [Markdown](examples/getlooploop-vectorscope.md), [JSON](examples/getlooploop-vectorscope.json));
- the Wikipedia article on large language models, which fills every slot and leaves 55,001 characters past the cap, six sections reaching no passage at all ([HTML](examples/wikipedia-llm.html), [Markdown](examples/wikipedia-llm.md), [JSON](examples/wikipedia-llm.json));
- MDN's HTTP caching guide against web.dev's HTTP cache article; MDN fills every slot and, since 2.103, loses nothing past the cap: its h3 "Validation" no longer cuts "Common caching patterns", and the slot that cut used now holds the page's last section ([HTML](examples/http-caching-compare.html), [Markdown](examples/http-caching-compare.md), [JSON](examples/http-caching-compare.json)).

## Install

The skill needs Node 20.18 or later (what cheerio declares) and **no `npm install`**: `dist/read.mjs` and `dist/lens.mjs` are the scripts bundled with their one dependency, [cheerio](https://cheerio.js.org/), so plain `node` runs them, including in sandboxes that block package installs. The readable source is in `scripts/`; `dist/` is generated from it (see *Working on the skill*).

### claude.ai and the Claude desktop app

1. Download **`vectorscope.zip`** from this repository's [Releases](https://github.com/Olexan-art/getlooploop-skills/releases). Do not unpack it: the upload takes the zip, with the `vectorscope` folder at its top level.
2. Turn on code execution: **Settings > Capabilities > Code execution and file creation**. Skills need it. On Team and Enterprise plans an owner controls it in Organization settings > Capabilities.
3. Upload the skill: **Customize > Skills**, the **+** button, **Create skill**, **Upload a skill**, then choose `vectorscope.zip`. Turn the skill on in the list. In the desktop app it is the same Customize > Skills page.
4. Let the sandbox reach the site you want read. A run fetches the page and its `robots.txt`, and code execution only reaches what its network setting allows. On Free, Pro and Max plans that setting is **Allow network egress** in Settings > Capabilities. On Team and Enterprise plans an owner chooses in Organization settings > Capabilities: off, package managers only (the default), package managers and specific domains, or all domains. With specific domains, add the site's domain. If your plan's setting cannot allow the site, the run stops with `REFUSED unreachable` and says so; use Claude Code or another agent on your own machine for that page.
5. In a chat, ask: **"run vectorscope on https://example.com/page"**. Claude runs the scripts in the sandbox and hands you `report.html` as a file to download and open in your browser, with a short summary in the chat.

**Pasting this repository's link into a chat is not installing it.** Claude rightly will not download and run code from a link someone pasted, so it will at best imitate the steps by hand, and those numbers are not the tool's. Upload the zip as above.

Sources: [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude) · [Create custom skills](https://claude.com/docs/skills/how-to) (the zip's structure, the name and description rules) · [Create and edit files with Claude](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude) (code execution and network egress) · [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (network access by surface). Checked on 2026-10-16.

## Use it with your agent

The skill is one folder, `skills/vectorscope`, with a `SKILL.md` and Node scripts. Agents that support Agent Skills load it from their skills directory; any other agent can follow `SKILL.md` as instructions. Either way the agent runs the same scripts from the skill folder, and the agent's own model does the reading. No install step: the agent runs `node dist/read.mjs` and `node dist/lens.mjs` as they are.

```
git clone https://github.com/Olexan-art/getlooploop-skills.git
```

**Claude Code** loads personal skills from `~/.claude/skills/` and project skills from `.claude/skills/`.

```
mkdir -p ~/.claude/skills && cp -r getlooploop-skills/skills/vectorscope ~/.claude/skills/vectorscope   # personal
mkdir -p .claude/skills && cp -r getlooploop-skills/skills/vectorscope .claude/skills/vectorscope       # or: this project only
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse getlooploop-skills\skills\vectorscope "$HOME\.claude\skills\vectorscope"
```

**OpenAI Codex (CLI, IDE extension, app)** scans `$HOME/.agents/skills` (user) and `.agents/skills` in every directory from where you launch it up to the repository root (repo).

```
mkdir -p ~/.agents/skills && cp -r getlooploop-skills/skills/vectorscope ~/.agents/skills/vectorscope
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse getlooploop-skills\skills\vectorscope "$HOME\.agents\skills\vectorscope"
```

**opencode** loads global skills from `~/.config/opencode/skills/`, `~/.claude/skills/` or `~/.agents/skills/`, and project skills from `.opencode/skills/`, `.claude/skills/` or `.agents/skills/` (walking up to the git worktree). A copy made for Claude Code or Codex above is picked up too; otherwise:

```
mkdir -p ~/.config/opencode/skills && cp -r getlooploop-skills/skills/vectorscope ~/.config/opencode/skills/vectorscope
```

**Hermes Agent (Nous Research)** keeps skills in `~/.hermes/skills/`. It also reads `<project>/.hermes/skills/` and `<project>/.agents/skills/` once you trust the repository with `hermes skills trust`, and any folder listed under `skills.external_dirs` in `~/.hermes/config.yaml` (for example `~/.agents/skills`).

```
mkdir -p ~/.hermes/skills && cp -r getlooploop-skills/skills/vectorscope ~/.hermes/skills/vectorscope
```

**GLM** (Zhipu / Z.ai) is a model family, not an agent. Z.ai's GLM Coding Plan is used inside coding agents; its documentation names Claude Code, Codex and OpenCode among them. Install the skill for the agent you run GLM in, as above: the skill then follows that agent's instructions, and GLM does the reading.

**Any other agent:** point its instructions file (for example `AGENTS.md`) at the skill, so it reads the steps before it starts:

```
For questions about how AI assistants read a web page, follow skills/vectorscope/SKILL.md and run its scripts from that folder.
```

Sources: [Claude Code skills](https://code.claude.com/docs/en/skills) · [Codex skills](https://learn.chatgpt.com/docs/build-skills) (where developers.openai.com/codex/skills now redirects) · [opencode skills](https://opencode.ai/docs/skills) · [Hermes Agent skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) · [Z.ai GLM Coding Plan](https://docs.z.ai/devpack/overview). Checked on 2026-10-16; skill folders move between releases, so check your agent's current docs if a path does not work.

## Vectorscope, in short

```
node dist/read.mjs https://example.com/page --out reading.json   # fetch → extract → chunk → cap, robots.txt, checks
# the agent reads the passages and writes groups.json
node dist/lens.mjs reading.json groups.json --html report.html   # labels, phrases, all checks
# the agent writes queries.json and plan.json
node dist/lens.mjs reading.json groups.json --queries queries.json --plan plan.json --html report.html --md report.md --json export.json

node dist/read.mjs <url1> <url2> --out-dir readings              # compare; then topics.json, groups-<n>.json, facts.json, queries.json
node dist/lens.mjs --compare readings/manifest.json --html readings/compare.html
```

The scripts make no model or embedding calls and send nothing anywhere except the GETs for the page and its robots.txt (and, with `--render`, the local browser loading the page). Fields that would need vectors (cohesion, self-similarity, the projection) are reported as `null` instead of being estimated. The HTML report escapes every piece of page text and carries a content security policy that blocks all network requests from it, because the passages are third-party content.


## Working on the skill

`scripts/` is the source; `dist/` is built from it with [esbuild](https://esbuild.github.io/) (a development dependency only) and committed, so the skill runs without an install.

```
cd skills/vectorscope
npm install          # cheerio, and esbuild for the build
npm run build        # scripts/ → dist/read.mjs, dist/lens.mjs (not minified, readable)
npm test             # includes a check that dist/ equals a fresh build, so dist never drifts from scripts/
npm run zip          # dist-release/vectorscope.zip, the file to attach to a release for claude.ai
```

Change `scripts/`, run `npm run build`, and commit both.

## Licence

Free to use, change and share under the MIT licence, see [LICENSE](LICENSE). If you publish something built with it, a link to [getlooploop.com](https://www.getlooploop.com) is appreciated.
