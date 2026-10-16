English · [Українська](README.uk.md)

# GetLoopLoop skills

Agent Skills from [GetLoopLoop](https://www.getlooploop.com), for Claude Code, Codex, opencode, Hermes Agent and other agents that load `SKILL.md` skills.

| Skill | What it does |
|---|---|
| [`vectorscope`](skills/vectorscope/SKILL.md) | Shows how a retrieval system reads public pages: the product's exact fetch, extraction, chunking and 26-passage cap, robots.txt verdicts for AI crawlers, automatic structure checks, and the agent's grouping, query test and rewrite plan. Compares 2 to 5 pages. |

## In plain words

Before an AI assistant can quote your page, a machine has to read it, and it does not read it the way you do. It fetches the page once, throws away the menus, buttons and footers, and cuts the rest into passages of about 2,000 characters. It keeps at most 26. Each passage is later found and quoted **on its own**, without the page around it.

This skill runs those same steps on any public page and tells you what to fix: whether AI crawlers are even allowed in, which passages lost their question or their subject, what fell past the 26-passage limit, which typical questions the page answers and which it does not, and how to rewrite the weakest passages so each one stands on its own.

It does not rank your page, give it a score, detect AI-written text, or predict what any assistant will say about you.

## Features

- **The machine's reading:** the exact fetch, extraction, chunking and 26-passage cap of the live tool; how many words survive, how many passages they become, what falls past the cap.
- **AI crawlers first:** robots.txt checked for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot and CCBot, with RFC 9309 matching. If the crawlers that answer people are blocked, the report says so before anything else.
- **Automatic checks**, each with a code, the passages it rests on and the evidence: FAQ answers that lost their questions, one heading carrying too much of the page, passages cut mid-sentence, navigation inside the content, thin sections, truncated teasers, the same claim in every section, canonical, JSON-LD and meta description.
- **Grouping by the agent's reading:** the passages grouped by subject and named, with the page's own heading or keywords kept as the label source.
- **Query test:** 5 to 10 typical questions (yours or the agent's), the best passage for each, whether it answers completely, and the exact words a retriever could quote.
- **Rewrite plan:** prioritised fixes tied to the checks, with before → after rewrites for the weakest passages.
- **Compare 2 to 5 pages** on one shared topic dictionary: a topic × page table, topic gaps, fact gaps, and who wins each query.
- **Before and after:** diff a page against an earlier reading.
- **Optional JavaScript render** with a local Chrome or Chromium, to see how much of the page only exists after scripts run.
- **One self-contained HTML report** in English or Ukrainian (a switch at the top), light or dark, readable on a phone, with no network requests; plus Markdown and JSON.

Why the groups are "the agent's reading": the live tool groups passages by comparing their embeddings. This skill makes no model or embedding calls, so the agent that runs it reads the passages and groups them by subject instead. The fetching, the cutting, the cap and the checks are deterministic; the grouping, the query verdicts and the plan are a judgement, and the scripts validate each of them (every quote must be verbatim from its passage). For the embedding-based reading with the map, use the free tool at https://www.getlooploop.com/vectorscope.

## What you get

The top of the report, dark and light:

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

Comparing two pages: topics × pages, topic gaps, and who wins each query:

![Compare mode](docs/report-compare.png)

The footer, and the report on a phone:

![Footer](docs/report-footer.png)

![The report on a narrow screen](docs/report-mobile.png)

Three real runs are in [`examples/`](examples), each with the files the agent wrote in [`examples/judgement/`](examples/judgement):

- the Vectorscope page itself, which needs 17 passages and loses nothing ([HTML](examples/getlooploop-vectorscope.html), [Markdown](examples/getlooploop-vectorscope.md), [JSON](examples/getlooploop-vectorscope.json));
- the Wikipedia article on large language models, which fills every slot and leaves about 53,000 characters unread ([HTML](examples/wikipedia-llm.html), [Markdown](examples/wikipedia-llm.md), [JSON](examples/wikipedia-llm.json));
- MDN's HTTP caching guide against web.dev's HTTP cache article ([HTML](examples/http-caching-compare.html), [Markdown](examples/http-caching-compare.md), [JSON](examples/http-caching-compare.json)).

## Install

The skill needs Node 18 or later. Its only dependency is [cheerio](https://cheerio.js.org/). Copy the folder to wherever your agent looks for skills (next section), then once:

```
cd <skills directory>/vectorscope && npm install --omit=dev
```

## Use it with your agent

The skill is one folder, `skills/vectorscope`, with a `SKILL.md` and Node scripts. Agents that support Agent Skills load it from their skills directory; any other agent can follow `SKILL.md` as instructions. Either way the agent runs the same commands from the skill folder, and the agent's own model does the reading.

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
node scripts/read.mjs https://example.com/page --out reading.json   # fetch → extract → chunk → cap, robots.txt, checks
# the agent reads the passages and writes groups.json
node scripts/lens.mjs reading.json groups.json --html report.html   # labels, keywords, all checks
# the agent writes queries.json and plan.json
node scripts/lens.mjs reading.json groups.json --queries queries.json --plan plan.json --html report.html --md report.md --json export.json

node scripts/read.mjs <url1> <url2> --out-dir readings              # compare; then topics.json, groups-<n>.json, facts.json, queries.json
node scripts/lens.mjs --compare readings/manifest.json --html readings/compare.html
```

The scripts make no model or embedding calls and send nothing anywhere except the GETs for the page and its robots.txt (and, with `--render`, the local browser loading the page). Fields that would need vectors (cohesion, self-similarity, the projection) are reported as `null` instead of being estimated. The HTML report escapes every piece of page text and carries a content security policy that blocks all network requests from it, because the passages are third-party content. `npm test` runs the tests.

## Licence

Free to use, change and share under the MIT licence, see [LICENSE](LICENSE). If you publish something built with it, a link to [getlooploop.com](https://www.getlooploop.com) is appreciated.
