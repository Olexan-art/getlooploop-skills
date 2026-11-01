#!/usr/bin/env node
// sitemap-watch: snapshot a site's sitemaps and diff the snapshots over time.
//
//   node sitemap-watch.mjs snapshot <site-or-sitemap-url> [more sites] [--dir D]
//   node sitemap-watch.mjs diff <site> [--from F] [--to T] [--fresh] [--json] [--limit N]
//   node sitemap-watch.mjs list <site> [--json]
//
// Node 18+ built-ins only. The tool counts and compares; it does not interpret.

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

export const VERSION = "1.101";
export const USER_AGENT = `sitemap-watch/${VERSION} (+https://github.com/Olexan-art/getlooploop-skills)`;

const DEFAULTS = {
  maxSitemaps: 500,
  maxUrls: 200000,
  timeoutMs: 20000,
  delayMs: 250,
  maxBytes: 50 * 1024 * 1024,
  limit: 200,
};

// Sites under Russian country-code domains are refused, as in the other skills of this repository.
const REFUSED_TLDS = [".ru", ".su", ".xn--p1ai"];

// ---------- inputs ----------

export function normaliseInput(input) {
  let text = String(input || "").trim();
  if (!text) throw new Error("no site given");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`not a web address: ${input}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`only http and https are supported: ${input}`);
  const host = url.hostname.toLowerCase();
  if (REFUSED_TLDS.some((tld) => host === tld.slice(1) || host.endsWith(tld))) {
    throw new Error(`refused: ${host} is under a Russian country-code domain`);
  }
  return url;
}

// The folder a site's snapshots live in: the host without "www.", with the port if there is one.
export function siteKey(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return (url.port ? `${host}_${url.port}` : host).replace(/[^a-z0-9._-]/g, "_");
}

export function looksLikeSitemap(url) {
  const path = url.pathname.toLowerCase();
  return /\.xml(\.gz)?$/.test(path) || /\.gz$/.test(path) || /sitemap/.test(path);
}

export function stateRoot(opts = {}) {
  return resolve(opts.dir || process.env.SITEMAP_WATCH_DIR || join(homedir(), ".sitemap-watch"));
}

// ---------- fetching ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchBody(url, opts) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/xml,text/xml,text/plain,*/*;q=0.5" },
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const length = Number(res.headers.get("content-length") || 0);
  if (length > opts.maxBytes) throw new Error(`body is ${length} bytes; the limit is ${opts.maxBytes}`);
  let buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > opts.maxBytes) throw new Error(`body is ${buf.length} bytes; the limit is ${opts.maxBytes}`);
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    buf = gunzipSync(buf, { maxOutputLength: opts.maxBytes });
  }
  return { text: buf.toString("utf8"), finalUrl: res.url || String(url), status: res.status };
}

// ---------- parsing ----------

function decodeXml(s) {
  return s
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .trim();
}

// The first <loc> of a block that is not an image, video or news extension's.
const LOC_RE = /<(?:(?!image:|video:|news:|xhtml:)[\w-]+:)?loc\s*>([\s\S]*?)<\/(?:[\w-]+:)?loc\s*>/i;
const LASTMOD_RE = /<(?:[\w-]+:)?lastmod\s*>([\s\S]*?)<\/(?:[\w-]+:)?lastmod\s*>/i;

export function parseSitemap(xml) {
  const text = xml.replace(/<!--[\s\S]*?-->/g, "");
  const isIndex = /<(?:[\w-]+:)?sitemapindex\b/i.test(text);
  const blockRe = isIndex
    ? /<(?:[\w-]+:)?sitemap\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?sitemap\s*>/gi
    : /<(?:[\w-]+:)?url\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?url\s*>/gi;
  const entries = [];
  for (const m of text.matchAll(blockRe)) {
    const loc = LOC_RE.exec(m[1]);
    if (!loc) continue;
    const lastmod = LASTMOD_RE.exec(m[1]);
    entries.push({ loc: decodeXml(loc[1]), lastmod: lastmod ? decodeXml(lastmod[1]) || null : null });
  }
  const isUrlset = /<(?:[\w-]+:)?urlset\b/i.test(text);
  return { kind: isIndex ? "index" : isUrlset ? "urlset" : "unknown", entries };
}

export function parseRobotsSitemaps(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*sitemap\s*:\s*(\S+)/i.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

// ---------- snapshot ----------

export async function takeSnapshot(input, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const url = normaliseInput(input);
  const log = opts.log || (() => {});
  const errors = [];
  const sitemaps = [];
  let requests = 0;
  const polite = async () => {
    if (requests++ > 0 && opts.delayMs > 0) await sleep(opts.delayMs);
  };

  // 1. Where the sitemaps are.
  let roots = [];
  let discovery;
  if (looksLikeSitemap(url)) {
    roots = [url.href];
    discovery = "given";
  } else {
    const robotsUrl = new URL("/robots.txt", url.origin).href;
    try {
      await polite();
      const { text } = await fetchBody(robotsUrl, opts);
      roots = parseRobotsSitemaps(text)
        .map((s) => {
          try {
            return new URL(s, url.origin).href;
          } catch {
            errors.push({ url: s, error: "robots.txt names a sitemap that is not a valid URL" });
            return null;
          }
        })
        .filter(Boolean);
      discovery = roots.length ? "robots.txt" : null;
    } catch (e) {
      errors.push({ url: robotsUrl, error: `robots.txt: ${e.message}` });
    }
    if (!roots.length) {
      roots = [new URL("/sitemap.xml", url.origin).href];
      discovery = "/sitemap.xml (robots.txt names no sitemap)";
    }
  }
  roots = [...new Set(roots)];

  // 2. Read them, following indexes, breadth first.
  const queue = [...roots];
  const seen = new Set();
  const urls = new Map();
  let urlsDropped = 0;
  const sitemapsSkipped = [];
  while (queue.length) {
    const next = queue.shift();
    if (seen.has(next)) continue;
    seen.add(next);
    if (sitemaps.length >= opts.maxSitemaps) {
      sitemapsSkipped.push(next);
      continue;
    }
    const record = { url: next, kind: null, entries: 0 };
    sitemaps.push(record);
    try {
      await polite();
      const { text } = await fetchBody(next, opts);
      const parsed = parseSitemap(text);
      record.kind = parsed.kind;
      record.entries = parsed.entries.length;
      if (parsed.kind === "unknown") {
        record.error = "not a sitemap (no <urlset> or <sitemapindex>)";
        errors.push({ url: next, error: record.error });
      } else if (parsed.kind === "index") {
        for (const e of parsed.entries) {
          try {
            const child = new URL(e.loc, next).href;
            if (!seen.has(child)) queue.push(child);
          } catch {
            errors.push({ url: next, error: `index names an invalid sitemap URL: ${e.loc}` });
          }
        }
      } else {
        for (const e of parsed.entries) {
          if (urls.has(e.loc)) continue;
          if (urls.size >= opts.maxUrls) {
            urlsDropped++;
            continue;
          }
          urls.set(e.loc, e.lastmod);
        }
      }
      log(`  read  ${next}  (${record.kind}, ${record.entries} entries)`);
    } catch (e) {
      record.error = e.name === "TimeoutError" ? `timed out after ${opts.timeoutMs} ms` : e.message;
      errors.push({ url: next, error: record.error });
      log(`  error ${next}  ${record.error}`);
    }
  }

  const list = [...urls.entries()].map(([loc, lastmod]) => ({ loc, lastmod })).sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));
  return {
    tool: "sitemap-watch",
    version: VERSION,
    site: siteKey(url),
    input: String(input),
    fetchedAt: new Date().toISOString(),
    discovery,
    sitemaps,
    sitemapsRead: sitemaps.filter((s) => !s.error).length,
    sitemapsFailed: sitemaps.filter((s) => s.error).length,
    partial: errors.some((e) => sitemaps.some((s) => s.url === e.url)),
    capped: {
      maxSitemaps: opts.maxSitemaps,
      sitemapsSkipped: sitemapsSkipped.length,
      sitemapsSkippedSample: sitemapsSkipped.slice(0, 20),
      maxUrls: opts.maxUrls,
      urlsDropped,
    },
    errors,
    urlCount: list.length,
    urls: list,
  };
}

function fileStamp(iso) {
  return iso.replace(/:/g, "-");
}

export function saveSnapshot(snapshot, opts = {}) {
  const dir = join(stateRoot(opts), snapshot.site);
  mkdirSync(dir, { recursive: true });
  let path = join(dir, `${fileStamp(snapshot.fetchedAt)}.json`);
  for (let n = 2; existsSync(path); n++) path = join(dir, `${fileStamp(snapshot.fetchedAt)}-${n}.json`);
  writeFileSync(path, JSON.stringify(snapshot, null, 1));
  return path;
}

export function listSnapshots(site, opts = {}) {
  const key = siteKey(normaliseInput(site));
  const dir = join(stateRoot(opts), key);
  if (!existsSync(dir)) return { site: key, dir, snapshots: [] };
  const snapshots = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const path = join(dir, f);
      try {
        const s = JSON.parse(readFileSync(path, "utf8"));
        return { path, file: f, fetchedAt: s.fetchedAt, urlCount: s.urlCount, sitemapsRead: s.sitemapsRead, sitemapsFailed: s.sitemapsFailed, partial: !!s.partial };
      } catch (e) {
        return { path, file: f, error: `unreadable: ${e.message}` };
      }
    })
    .filter((s) => !s.error)
    .sort((a, b) => (a.fetchedAt < b.fetchedAt ? -1 : a.fetchedAt > b.fetchedAt ? 1 : 0));
  return { site: key, dir, snapshots };
}

// ---------- diff ----------

function pathSegments(loc) {
  try {
    const u = new URL(loc);
    return { host: u.host, segments: u.pathname.split("/").filter(Boolean) };
  } catch {
    return { host: "", segments: [] };
  }
}

function prefixes(loc, withHost) {
  const { host, segments } = pathSegments(loc);
  const head = withHost ? host : "";
  // The last segment is the page itself; a prefix is a folder that holds it.
  const folders = segments.slice(0, -1);
  const one = folders.length >= 1 ? `${head}/${folders[0]}/` : `${head}/`;
  const two = folders.length >= 2 ? `${head}/${folders[0]}/${folders[1]}/` : null;
  return { one, two };
}

export function groupByPrefix(newUrls, beforeUrls = []) {
  const hosts = new Set([...newUrls, ...beforeUrls].map((l) => pathSegments(l).host));
  const withHost = hosts.size > 1;
  const count = (list, level) => {
    const m = new Map();
    for (const l of list) {
      const p = prefixes(l, withHost)[level];
      if (p) m.set(p, (m.get(p) || 0) + 1);
    }
    return m;
  };
  const build = (level) => {
    const now = count(newUrls, level);
    const before = count(beforeUrls, level);
    return [...now.entries()]
      .map(([prefix, n]) => ({ prefix, new: n, before: before.get(prefix) || 0, newPrefix: !before.has(prefix) }))
      .sort((a, b) => b.new - a.new || (a.prefix < b.prefix ? -1 : 1));
  };
  return { level1: build("one"), level2: build("two") };
}

function resolveSnapshot(ref, listing) {
  if (!ref) return null;
  if (existsSync(ref)) return resolve(ref);
  const inDir = join(listing.dir, ref);
  if (existsSync(inDir)) return inDir;
  // A date or timestamp prefix: the newest snapshot that starts with it.
  const matches = listing.snapshots.filter((s) => s.fetchedAt.startsWith(ref) || s.file.startsWith(ref));
  if (!matches.length) throw new Error(`no snapshot of ${listing.site} matches ${ref}`);
  return matches[matches.length - 1].path;
}

export function diffSnapshots(a, b) {
  const before = new Map(a.urls.map((u) => [u.loc, u.lastmod]));
  const after = new Map(b.urls.map((u) => [u.loc, u.lastmod]));
  const added = [];
  const removed = [];
  const lastmodChanged = [];
  for (const [loc, lastmod] of after) {
    if (!before.has(loc)) added.push({ loc, lastmod });
    else if (lastmod && before.get(loc) && lastmod !== before.get(loc)) lastmodChanged.push({ loc, before: before.get(loc), after: lastmod });
  }
  for (const [loc, lastmod] of before) if (!after.has(loc)) removed.push({ loc, lastmod });
  const byLoc = (x, y) => (x.loc < y.loc ? -1 : x.loc > y.loc ? 1 : 0);
  added.sort(byLoc);
  removed.sort(byLoc);
  lastmodChanged.sort(byLoc);
  const warnings = [];
  if (a.partial) warnings.push(`the earlier snapshot is partial (${a.sitemapsFailed} sitemap(s) failed): some URLs may look new only because they were missing then`);
  if (b.partial) warnings.push(`the later snapshot is partial (${b.sitemapsFailed} sitemap(s) failed): some URLs may look removed only because their sitemap failed now`);
  for (const [label, s] of [["earlier", a], ["later", b]]) {
    if (s.capped?.urlsDropped) warnings.push(`the ${label} snapshot hit the URL cap (${s.capped.maxUrls}) and left out ${s.capped.urlsDropped} URL(s)`);
    if (s.capped?.sitemapsSkipped) warnings.push(`the ${label} snapshot hit the sitemap cap (${s.capped.maxSitemaps}) and did not read ${s.capped.sitemapsSkipped} sitemap(s)`);
  }
  return {
    site: b.site,
    from: { fetchedAt: a.fetchedAt, urlCount: a.urlCount, partial: !!a.partial },
    to: { fetchedAt: b.fetchedAt, urlCount: b.urlCount, partial: !!b.partial },
    counts: { new: added.length, removed: removed.length, lastmodChanged: lastmodChanged.length, net: b.urlCount - a.urlCount },
    newGroups: groupByPrefix(added.map((u) => u.loc), a.urls.map((u) => u.loc)),
    added,
    removed,
    lastmodChanged,
    warnings,
  };
}

export function diffMarkdown(d, limit = DEFAULTS.limit) {
  const lines = [];
  const cap = (arr, render) => {
    const shown = limit > 0 ? arr.slice(0, limit) : arr;
    for (const x of shown) lines.push(render(x));
    if (shown.length < arr.length) lines.push(`- … and ${arr.length - shown.length} more (use --limit 0 or --json for all)`);
  };
  lines.push(`# sitemap-watch: ${d.site}`, "");
  lines.push(`From ${d.from.fetchedAt} (${d.from.urlCount} URLs) to ${d.to.fetchedAt} (${d.to.urlCount} URLs), net ${d.counts.net >= 0 ? "+" : ""}${d.counts.net}.`);
  lines.push(`New: ${d.counts.new} · Removed: ${d.counts.removed} · Lastmod changed: ${d.counts.lastmodChanged}`, "");
  if (d.warnings.length) {
    lines.push("## Warnings", "");
    for (const w of d.warnings) lines.push(`- ${w}`);
    lines.push("");
  }
  const groupTable = (title, rows) => {
    if (!rows.length) return;
    lines.push(`## ${title}`, "", "| Prefix | New | Before | New section |", "|---|---:|---:|---|");
    const shown = limit > 0 ? rows.slice(0, limit) : rows;
    for (const r of shown) lines.push(`| \`${r.prefix}\` | ${r.new} | ${r.before} | ${r.newPrefix ? "yes" : ""} |`);
    if (shown.length < rows.length) lines.push(`| … ${rows.length - shown.length} more | | | |`);
    lines.push("");
  };
  groupTable("New pages by first path segment", d.newGroups.level1);
  groupTable("New pages by first two path segments", d.newGroups.level2);
  lines.push("## New URLs", "");
  if (!d.added.length) lines.push("None.");
  cap(d.added, (u) => `- ${u.loc}${u.lastmod ? ` (lastmod ${u.lastmod})` : ""}`);
  lines.push("", "## Removed URLs", "");
  if (!d.removed.length) lines.push("None.");
  cap(d.removed, (u) => `- ${u.loc}`);
  lines.push("", "## Lastmod changed", "");
  if (!d.lastmodChanged.length) lines.push("None.");
  cap(d.lastmodChanged, (u) => `- ${u.loc}: ${u.before} → ${u.after}`);
  lines.push("");
  return lines.join("\n");
}

// ---------- CLI ----------

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const [key, inline] = a.slice(2).split(/=(.*)/s);
    if (["json", "fresh", "quiet", "help"].includes(key)) flags[key] = true;
    else flags[key] = inline !== undefined ? inline : argv[++i];
  }
  return { command: positional[0], sites: positional.slice(1), flags };
}

const HELP = `sitemap-watch ${VERSION}

  snapshot <site-or-sitemap-url> [more…]   read the sitemaps, store a snapshot
  diff <site> [--from F] [--to T]          compare two snapshots (default: the newest two)
       [--fresh]                           take a new snapshot first, then compare it to the previous
       [--json] [--limit N]                JSON output; URLs listed in Markdown (default 200, 0 = all)
  list <site> [--json]                     the snapshots kept

Options: --dir D (or SITEMAP_WATCH_DIR; default ~/.sitemap-watch), --max-sitemaps N (500),
--max-urls N (200000), --timeout-ms N (20000), --delay-ms N (250 between requests).`;

function numberFlag(flags, name, fallback) {
  if (flags[name] === undefined) return fallback;
  const n = Number(flags[name]);
  if (!Number.isFinite(n) || n < 0) throw new Error(`--${name} must be a number ≥ 0`);
  return n;
}

async function snapshotCommand(site, flags, out) {
  const snap = await takeSnapshot(site, {
    maxSitemaps: numberFlag(flags, "max-sitemaps", DEFAULTS.maxSitemaps),
    maxUrls: numberFlag(flags, "max-urls", DEFAULTS.maxUrls),
    timeoutMs: numberFlag(flags, "timeout-ms", DEFAULTS.timeoutMs),
    delayMs: numberFlag(flags, "delay-ms", DEFAULTS.delayMs),
    log: flags.quiet || flags.json ? undefined : (m) => out.err(m),
  });
  if (snap.urlCount === 0 && snap.errors.length) {
    const msg = `NOT SAVED  ${snap.site}: no URLs read. ${snap.errors.map((e) => `${e.url}: ${e.error}`).join("; ")}`;
    return { ok: false, message: msg, snapshot: snap };
  }
  const path = saveSnapshot(snap, { dir: flags.dir });
  const previous = listSnapshots(site, { dir: flags.dir }).snapshots.filter((s) => s.path !== path);
  const lines = [
    `snapshot  ${snap.site}  ${snap.fetchedAt}`,
    `urls      ${snap.urlCount} from ${snap.sitemapsRead} sitemap(s) (found via ${snap.discovery})`,
  ];
  if (snap.sitemapsFailed) lines.push(`failed    ${snap.sitemapsFailed} sitemap(s): ${snap.errors.filter((e) => snap.sitemaps.some((s) => s.url === e.url)).map((e) => `${e.url} (${e.error})`).join("; ")}`);
  const robotsErr = snap.errors.find((e) => e.error.startsWith("robots.txt"));
  if (robotsErr) lines.push(`note      ${robotsErr.error}`);
  if (snap.capped.urlsDropped) lines.push(`capped    ${snap.capped.urlsDropped} URL(s) left out past --max-urls ${snap.capped.maxUrls}`);
  if (snap.capped.sitemapsSkipped) lines.push(`capped    ${snap.capped.sitemapsSkipped} sitemap(s) not read past --max-sitemaps ${snap.capped.maxSitemaps}`);
  lines.push(`saved     ${path}`);
  lines.push(previous.length ? `previous  ${previous.length} earlier snapshot(s); run diff to compare` : "baseline  first snapshot of this site; nothing to compare yet");
  return { ok: true, message: lines.join("\n"), path, snapshot: snap, isBaseline: !previous.length };
}

async function diffCommand(site, flags, out) {
  const opts = { dir: flags.dir };
  if (flags.fresh) {
    const r = await snapshotCommand(site, { ...flags, quiet: true }, out);
    if (!r.ok) return r;
    out.err(r.message.split("\n").slice(0, 2).join("\n"));
  }
  const listing = listSnapshots(site, opts);
  let toPath = resolveSnapshot(flags.to, listing);
  let fromPath = resolveSnapshot(flags.from, listing);
  const snaps = listing.snapshots;
  if (!toPath) toPath = snaps.length ? snaps[snaps.length - 1].path : null;
  if (!fromPath) {
    const idx = snaps.findIndex((s) => s.path === toPath);
    fromPath = idx > 0 ? snaps[idx - 1].path : null;
  }
  if (!toPath || !fromPath || fromPath === toPath) {
    const msg = snaps.length
      ? `BASELINE ONLY  ${listing.site}: ${snaps.length} snapshot(s) (${snaps.map((s) => `${s.fetchedAt}: ${s.urlCount} URLs`).join(", ")}); nothing to compare yet. Run diff --fresh later.`
      : `NO SNAPSHOTS  ${listing.site}: run snapshot first.`;
    return { ok: true, message: msg, json: { site: listing.site, status: snaps.length ? "baseline-only" : "no-snapshots", snapshots: snaps } };
  }
  const a = JSON.parse(readFileSync(fromPath, "utf8"));
  const b = JSON.parse(readFileSync(toPath, "utf8"));
  const d = diffSnapshots(a, b);
  d.fromFile = fromPath;
  d.toFile = toPath;
  return { ok: true, message: diffMarkdown(d, numberFlag(flags, "limit", DEFAULTS.limit)), json: { status: "compared", ...d } };
}

export async function main(argv, out = { log: (m) => console.log(m), err: (m) => console.error(m) }) {
  const { command, sites, flags } = parseArgs(argv);
  if (!command || flags.help || command === "help") {
    out.log(HELP);
    return command || flags.help ? 0 : 1;
  }
  if (!["snapshot", "diff", "list"].includes(command)) {
    out.err(`unknown command: ${command}\n\n${HELP}`);
    return 1;
  }
  if (!sites.length) {
    out.err(`${command} needs a site, e.g. ${command} example.com`);
    return 1;
  }
  if (sites.length > 1 && (flags.from || flags.to)) {
    out.err("--from and --to take one site at a time");
    return 1;
  }
  let code = 0;
  const jsonOut = [];
  for (const site of sites) {
    try {
      if (command === "list") {
        const l = listSnapshots(site, { dir: flags.dir });
        if (flags.json) jsonOut.push(l);
        else {
          out.log(`${l.site}  (${l.dir})`);
          if (!l.snapshots.length) out.log("  no snapshots");
          for (const s of l.snapshots) out.log(`  ${s.fetchedAt}  ${String(s.urlCount).padStart(7)} URLs  ${s.sitemapsRead} sitemap(s)${s.partial ? `, ${s.sitemapsFailed} failed (partial)` : ""}  ${s.file}`);
        }
        continue;
      }
      const r = command === "snapshot" ? await snapshotCommand(site, flags, out) : await diffCommand(site, flags, out);
      if (!r.ok) code = 2;
      if (flags.json) {
        jsonOut.push(r.json || (r.snapshot ? { ...r.snapshot, urls: undefined, saved: r.path || null, baseline: !!r.isBaseline, ok: r.ok, message: r.ok ? undefined : r.message } : { message: r.message }));
      } else (r.ok ? out.log : out.err)(r.message);
    } catch (e) {
      code = 2;
      const msg = `ERROR  ${site}: ${e.message}`;
      if (flags.json) jsonOut.push({ input: site, error: e.message });
      else out.err(msg);
    }
  }
  if (flags.json) out.log(JSON.stringify(jsonOut.length === 1 ? jsonOut[0] : jsonOut, null, 1));
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}

