Read this when read.mjs prints `REFUSED unreachable`, the shell has no network, the skill folder is read-only, or the user asks what the tool can and cannot read.

# Network, sandboxes and limits

## What the run reaches

- GET requests, with Node's own `fetch`, to the page and to its site's `/robots.txt`.
- 1 DNS lookup of the site's host, and 1 RDAP request to `https://rdap.org/ip/<the site's IP address>` for its server's country. RDAP receives the IP address and nothing of the page.
- Nothing else. With `--html` (a saved copy), no DNS or RDAP request is made.

## If the page cannot be fetched

read.mjs prints `REFUSED unreachable` (or another code) and writes the refusal into the reading. Tell the user what the code means, and in a sandbox what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows, and the page's site must be allowed.
  - Free, Pro and Max: **Allow network egress**, in Settings > Capabilities with **Code execution and file creation**. The default allows approved package sources.
  - Team and Enterprise: an owner sets it in Organization settings > Capabilities: off, package managers only (default), package managers and specific domains, or all domains. With specific domains, the page's domain must be listed.
  - Tell the user which setting decides it. If their plan cannot allow the site, tell them the page cannot be read from claude.ai, and that the skill runs in Claude Code or another agent on their own machine. Stop; do not fetch the page another way.
- **Behind a proxy:** if `HTTPS_PROXY` or `HTTP_PROXY` is set and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front (Node 22.21 or later, or 24 or later). Otherwise `fetch` ignores those variables.
- **Anywhere else:** the site is down, the name does not resolve, or there is no internet. Tell the user the code, and stop.

Do not fill in for the scripts: a count, cut or check made by hand is not this tool's result.

## No network in the shell, or nowhere to install

Some agents have no internet in the shell (cloud sandboxes such as Codex in the cloud or ChatGPT), or cannot write to their skills folder.

- **Read-only skills folder:** unpack `vectorscope.zip` (or copy this folder) into a directory you can write, and use it as `$SKILL`. Nothing needs installing.
- **Copying file by file** (for example through a file connector) works if `dist/` arrives whole, with `dist/chunks/`. No file in it is over 700 KB.
- **No way to get the files:** ask the user to attach `vectorscope.zip` from the repository's Releases, and wait.
- **No network in the shell** (`REFUSED unreachable`): ask the user for the page saved from their browser as "Web page, HTML only" (Ctrl+S, or Cmd+S on a Mac) and, if they can, `<site>/robots.txt` saved as text. Then run `node "$SKILL/dist/read.mjs" <url> --html page.html --robots robots.txt --out reading.json` and continue with step 2. Without `--robots`, robots.txt is reported as not checked. The report says it read a saved copy.
- **Use only files the user gives you.** Do not make the saved copy with a browsing or fetch tool: they return text or Markdown, not the page's HTML.

## Limits

- 1 public URL per reading; at most 5 in compare mode, read one after another.
- The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything not http(s). It checks every redirect hop (at most 5), for the page and robots.txt.
- No login, no cookies: a page behind a sign-in is read as an anonymous visitor sees it.
- No Accept-Language is sent. A site that picks a language by location can answer in another language; then pass the URL with its language parameter.
- No JavaScript in the reading: the product and this skill parse the fetched HTML with cheerio.
- `--render` also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile and `--dump-dom`. It reports words and passages with JavaScript against the plain fetch; the reading stays the plain one. With no browser it says so and continues.
- A saved page (`--html saved.html`) has no headers: `headers` is null and the `X-Robots-Tag` and `Cache-Control` checks are skipped. The accessibility structure is still read. robots.txt is not checked unless `--robots saved.txt` is given.
- 12-second timeout, at most 3,000,000 characters, HTML only (`text/html` or `application/xhtml+xml`). robots.txt is read up to 500 KiB.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`, as the product does. `--save-html page.html` keeps the fetched copy.
- Tests: `npm test` in `$SKILL` (Node's built-in runner, no network). The check that `dist/` matches `scripts/` needs `npm install`.
