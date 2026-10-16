#!/usr/bin/env node
// Step 1 of the AI Search Audit (Lite): fetch the page and everything the checks need, and write
// one reading. All the network is here: the page, its robots.txt, its sitemap, its llms.txt, its
// hreflang alternates and a HEAD (or GET) of up to 30 of its links. Each list has a cap and the
// reading says how much of it went unchecked.
//   node scripts/read.mjs <url> [--out reading.json] [--render] [--save-html page.html]
//   node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt]
// A refusal still writes its reading, with ok:false and the code, and exits with code 2.

import { readFileSync, writeFileSync } from "node:fs";
import { readAudit } from "./lib/reading.mjs";
import { findBrowser } from "../../vectorscope/scripts/lib/render.mjs";

const USAGE = [
  "Usage: node scripts/read.mjs <url> [--out reading.json] [--render] [--save-html page.html]",
  "       node scripts/read.mjs <url> --html saved.html [--final-url <url>] [--robots saved-robots.txt]",
].join("\n");

function parseArgs(argv) {
  const out = { urls: [], out: "reading.json", html: null, finalUrl: null, robots: null, render: false, saveHtml: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") out.out = argv[++i];
    else if (arg === "--html") out.html = argv[++i];
    else if (arg === "--final-url") out.finalUrl = argv[++i];
    else if (arg === "--robots") out.robots = argv[++i];
    else if (arg === "--render") out.render = true;
    else if (arg === "--save-html") out.saveHtml = argv[++i];
    else if (arg === "-h" || arg === "--help") out.help = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else out.urls.push(arg);
  }
  return out;
}

const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

function summarise(r, file) {
  if (!r.ok) {
    console.log(`REFUSED   ${r.reasonCode}${r.status ? ` (HTTP ${r.status})` : ""}`);
    if (r.reasonCode === "refused_language_ru") console.log("reason    pages in Russian are not analysed; nothing of the page was kept. Run audit.mjs on this reading to write the report that says why.");
    console.log(`reading   ${file}`);
    return;
  }
  const { fetch, facts, vs, robots, sitemap, llms, alternates, links, render } = r;
  console.log(`url       ${fetch.finalUrl}${fetch.finalUrl !== fetch.requestedUrl ? `  (asked for ${fetch.requestedUrl})` : ""}`);
  if (fetch.chain.length > 1) console.log(`redirects ${fetch.chain.map((c) => c.status).join(" → ")}`);
  console.log(`title     ${facts.head.title || "(none)"}`);
  console.log(`page      ${fmt(facts.htmlBytes)} bytes of HTML · ${facts.head.scripts.total} scripts · ${facts.headings.length} headings · ${facts.images.length} images · ${facts.links.length} links · ${facts.zones.length} zones on the map`);
  console.log(`passages  ${vs.passages.length}/${vs.page.chunkCap} · ${fmt(vs.losses?.waterfall?.pastCap ?? 0)} chars past the cap`);
  const blocked = robots.bots.filter((b) => !b.allowed).map((b) => b.token);
  console.log(`robots    ${robots.status}${robots.status === "ok" || robots.status === "none" ? ` · blocked: ${blocked.length ? blocked.join(", ") : "none"}` : ""}`);
  if (sitemap) console.log(`sitemap   ${sitemap.found ? `found · lists the page: ${sitemap.listsPage === null ? "not measured" : sitemap.listsPage ? "yes" : "no"}` : "not found"}${sitemap.children.unread && sitemap.listsPage !== true ? ` · ${sitemap.children.unread} child sitemaps not read (cap ${sitemap.children.cap})` : ""}`);
  if (llms) console.log(`llms.txt  ${llms.present ? `present · ${llms.links} links` : `none (HTTP ${llms.status ?? llms.reason})`}`);
  if (alternates) console.log(`hreflang  ${facts.head.hreflang.length} declared · ${alternates.checked} alternates read${alternates.unchecked.length ? ` · ${alternates.unchecked.length} not read (cap ${alternates.cap})` : ""}`);
  if (links) console.log(`links     ${links.checked} of ${links.total} checked${links.unchecked ? ` · ${links.unchecked} not checked (cap ${links.cap})` : ""} · broken ${links.results.filter((x) => x.verdict === "broken").length} · unverified ${links.results.filter((x) => x.verdict === "unverified").length}`);
  if (fetch.saved) console.log("network   none: a saved page was read; robots.txt, sitemap, llms.txt, alternates and links are not measured");
  if (render) console.log(render.ok ? `render    with JS ${fmt(render.wordCount)} words · ${render.passages} passages (without JS ${fmt(vs.page.wordCount)} · ${vs.passages.length}) · ${render.jsZones.length} sections only with JS` : `render    not done: ${render.reason === "no_browser" ? "no Chrome or Chromium found (set CHROME_PATH)" : render.reason}`);
  console.log(`reading   ${file}`);
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(USAGE);
  process.exit(1);
}
if (args.help || args.urls.length !== 1) {
  console.error(args.urls.length > 1 ? "One URL per audit." : "");
  console.error(USAGE);
  process.exit(args.help ? 0 : 1);
}
if (args.render && !findBrowser()) console.log("render    no Chrome or Chromium found (set CHROME_PATH); continuing with the plain fetch only");

const reading = await readAudit({
  url: args.urls[0],
  html: args.html ? readFileSync(args.html, "utf8") : undefined,
  finalUrl: args.finalUrl || undefined,
  robotsText: args.robots ? readFileSync(args.robots, "utf8") : undefined,
  render: args.render,
  onHtml: args.saveHtml ? (source) => writeFileSync(args.saveHtml, source) : undefined,
});
writeFileSync(args.out, JSON.stringify(reading, null, 2));
summarise(reading, args.out);
process.exit(reading.ok ? 0 : 2);
