# Network, sandboxes and limits

Read this when read.mjs prints `REFUSED unreachable`, when the shell has no network, when the skill folder is read-only, or when the user asks what the tool can and cannot read.

## What the run reaches

A run makes GET requests to the page and to its site's `/robots.txt`, plus one DNS lookup of the site's host and one RDAP request to `rdap.org` (`https://rdap.org/ip/<the site's IP address>`) for the country its server is registered in, and to nothing else. The RDAP request sends the site's IP address to rdap.org and nothing of the page; with `--html` (a saved copy) neither is made. On claude.ai the code-execution sandbox must be allowed to reach that site (below).

## If the page cannot be fetched

The run fetches the page and `/robots.txt` on the same site with Node's own `fetch`. When that fails, read.mjs prints `REFUSED unreachable` (or another refusal code) and writes the refusal into the reading. Say what the code means, and in a sandbox say what to change:

- **claude.ai or the Claude desktop app:** code execution reaches only what its network setting allows, and the page's site has to be among it. On Free, Pro and Max plans the setting is **Allow network egress**, under Settings > Capabilities with **Code execution and file creation**; by default it lets code reach approved package sources. On Team and Enterprise plans an owner sets it in Organization settings > Capabilities: off, package managers only (the default), package managers and specific domains, or all domains; with specific domains, the page's domain must be on the list. Tell the user which setting decides it. If their plan's setting cannot allow the site, say that this page cannot be read from claude.ai, and that the same skill runs in Claude Code or another agent on their own machine. Then stop; do not fetch the page some other way.
- **Behind a proxy:** if the environment sets `HTTPS_PROXY` or `HTTP_PROXY` and the fetch is `unreachable`, run read.mjs once more with `NODE_USE_ENV_PROXY=1` in front of the command (Node 22.21 or later, or 24 or later). Node's `fetch` ignores those variables otherwise.
- **Anywhere else:** the site may be down, the name may not resolve, or the machine has no internet. Say which code came back and stop.

Whatever the cause, do not fill in for the scripts. A count, a cut or a check made by hand is not this tool's result.

## No network in the shell, or nowhere to install

Some agents run their shell with no internet (cloud sandboxes such as Codex in the cloud or ChatGPT), or cannot write to their skills folder.

- **The skill folder can live anywhere.** If the agent's skills folder is read-only, unpack `vectorscope.zip` (or copy this folder) into any directory you can write, such as the working directory, and use that folder as `$SKILL`. Nothing needs installing. Copying file by file (through a file connector, say) works too, as long as `dist/` comes whole, `dist/chunks/` included; no file in it is over 700 KB. If you cannot get the files at all (no network, downloads blocked), ask the user to attach `vectorscope.zip` from the repository's Releases, and wait.
- **No network in the shell:** read.mjs prints `REFUSED unreachable`. Ask the user for a saved copy: the page saved from their browser as "Web page, HTML only" (Ctrl+S, or Cmd+S on a Mac), and, if they can, the site's robots.txt (open `<site>/robots.txt` and save it as text). Then run `node "$SKILL/dist/read.mjs" <url> --html page.html --robots robots.txt --out reading.json` and go on with step 2. Without `--robots`, robots.txt is reported as not checked. The report says it read a saved copy.
- **Only files the user gives you.** Do not make the saved copy yourself with a browsing or fetch tool: those return text or Markdown converted from the page, not its HTML, and the reading would not be the page's. And do not fill in for the scripts: a check made by hand is not this tool's result.

## Limits

- One public URL per reading (up to 5 in compare mode, read one after another). The guard refuses localhost, private and link-local addresses, hostnames without a dot, non-standard ports and anything that is not http(s). It checks every redirect hop (5 at most), for the page and for robots.txt.
- No login and no cookies: a page behind a sign-in is read as an anonymous visitor sees it. The fetch sends no Accept-Language, so a site that picks a language by location may answer in another language; pass the URL with its language parameter if so.
- No JavaScript in the reading. The product parses the fetched HTML with cheerio, and so does this skill. `--render` also runs the page in a local Chrome, Chromium or Edge (`CHROME_PATH`, else the usual install paths) with a fresh throwaway profile and `--dump-dom`, and reports words and passages with JavaScript against the plain fetch; the reading itself stays the plain one. With no browser it says so and continues.
- No response headers for a saved page. `--html` reads a saved copy, so `headers` is null and the `X-Robots-Tag` and `Cache-Control` checks are skipped; the accessibility structure is still read from the saved HTML.
- 12-second timeout, 3,000,000-character ceiling, HTML only (`text/html` or `application/xhtml+xml`). robots.txt is read up to 500 KiB.
- The fetch sends `User-Agent: GetLoopLoop/1.0 SEO Crawler`, as the product does. `--html saved.html` reads a saved copy instead (robots.txt is then not checked unless `--robots saved.txt` is given); `--save-html page.html` keeps the fetched copy.
- Tests: `npm test` in `$SKILL` (Node's built-in runner, no network; it needs `npm install` for the check that `dist/` matches `scripts/`).
