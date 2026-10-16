# GetLoopLoop skills

Agent Skills from [GetLoopLoop](https://www.getlooploop.com), for Claude Code and other agents that load `SKILL.md` skills.

| Skill | What it does |
|---|---|
| [`vectorscope`](skills/vectorscope/SKILL.md) | Shows how a retrieval system reads one public page: the product's exact fetch, extraction, chunking and 26-passage cap, with the passages grouped into topics by Claude's reading instead of embeddings. |

## Install

Copy or symlink a skill folder into your skills directory. For Claude Code that is `~/.claude/skills/` (personal) or `.claude/skills/` (per project):

```
cp -r skills/vectorscope ~/.claude/skills/vectorscope
cd ~/.claude/skills/vectorscope && npm install --omit=dev
```

The skill needs Node 18 or later. Its only dependency is [cheerio](https://cheerio.js.org/).

## Vectorscope, in short

```
node scripts/read.mjs https://example.com/page --out reading.json   # fetch → extract → chunk → cap
# Claude reads the passages and writes groups.json
node scripts/lens.mjs reading.json groups.json --md report.md --json export.json
```

The scripts make no model or embedding calls and send nothing anywhere except the one GET for the page. Fields that would need vectors (cohesion, self-similarity, the projection) are reported as `null` instead of being estimated. For the embedding-based reading with the semantic map, use the free tool at https://www.getlooploop.com/vectorscope.

## Licence

Free to use, change and share under the MIT licence, see [LICENSE](LICENSE). If you publish something built with it, a link to [getlooploop.com](https://www.getlooploop.com) is appreciated.
