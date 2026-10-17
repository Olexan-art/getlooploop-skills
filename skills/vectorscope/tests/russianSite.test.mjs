// 2.110: the site-level refusals: a Russian domain zone, hosting in Russia, a Russian-language
// version of the site. No network: DNS and every fetch are replaced.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { judgeRussianSite, lookupHosting, ruAudienceSignals, ruDomainZone, RDAP_URL } from "../scripts/lib/russianSite.mjs";
import { readPage } from "../scripts/lib/reading.mjs";
import { CRAWLER_UA } from "../scripts/lib/fetchPage.mjs";
import { REFUSAL_CODES, REFUSAL_COPY, REFUSAL_REASON, isRefusalCode } from "../scripts/lib/refusal.mjs";
import { renderRefusalHtml } from "../scripts/lib/html.mjs";
import { renderRefusalMarkdown } from "../scripts/lens.mjs";

const lensScript = fileURLToPath(new URL("../scripts/lens.mjs", import.meta.url));
const exampleHtml = readFileSync(fileURLToPath(new URL("./fixtures/example-com.html", import.meta.url)), "utf8");

const host = (url) => new URL(url).hostname;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/rdap+json" } });
const page = (html, headers = {}) => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", ...headers } });
const noLookup = async () => assert.fail("DNS must not be asked");
const noFetch = async () => assert.fail("nothing must be fetched");
const lookupTo = (...addresses) => async () => addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
const rdapCountry = (country, calls = []) => async (url, init) => {
  calls.push({ url, init });
  return json(country === undefined ? { handle: "NET-1" } : { country });
};

/** Replace the global fetch (the page fetch) for one test body. */
async function withGlobalFetch(impl, body) {
  const saved = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await body();
  } finally {
    globalThis.fetch = saved;
  }
}

test("domain: .ru, .su, .рф, .москва and .moscow refuse; look-alikes do not", () => {
  for (const url of ["https://example.ru/", "https://shop.example.RU./x", "https://a.su", "https://пример.рф/", "https://xn--e1afmkfd.xn--p1ai", "https://сайт.москва", "https://a.moscow"]) {
    assert.ok(ruDomainZone(host(url)), url);
  }
  assert.equal(ruDomainZone("пример.рф"), "xn--p1ai", "the Unicode zone is read too");
  for (const url of ["https://example.com", "https://ru.example.com/ru/", "https://example.run", "https://example.ru.com", "https://rus.org", "https://example.ua", "https://moscow.example.com"]) {
    assert.equal(ruDomainZone(host(url)), null, url);
  }
});

test("audience: every official declaration of a Russian version is found; links are not", () => {
  const url = "https://www.example.com/en/page";
  const one = (html, contentLanguage) => ruAudienceSignals({ html, contentLanguage, pageUrl: url }).map((s) => s.kind);
  assert.deepEqual(one('<link rel="alternate" hreflang="ru" href="https://www.example.com/ru/page">'), ["hreflang"]);
  assert.deepEqual(one('<link rel="Alternate" hreflang="ru-UA" href="/x">'), ["hreflang"]);
  assert.deepEqual(one('<meta property="og:locale" content="ru_RU">'), ["og_locale"]);
  assert.deepEqual(one('<meta property="og:locale" content="uk_UA"><meta property="og:locale:alternate" content="ru_UA">'), ["og_locale"]);
  assert.deepEqual(one("<p>x</p>", "uk, ru"), ["content_language"]);
  assert.deepEqual(one('<a href="/ru">RU</a>'), [], "a link is not a declaration");
  assert.deepEqual(one('<a href="https://example.com/ru/page?x=1">RU</a>'), [], "a link is not a declaration");
  assert.deepEqual(one('<a href="https://ru.example.com/">RU</a>'), [], "a link is not a declaration");
  assert.deepEqual(one('<a href="/other" hreflang="ru">x</a>'), [], "a link is not a declaration");
  assert.deepEqual(one('<a href="/other" lang="RU">x</a>'), [], "a link is not a declaration");
});

test("audience: quiet on other languages, other sites and paths that only start with ru", () => {
  const url = "https://www.example.com/en/page";
  const none = (html, contentLanguage) => assert.deepEqual(ruAudienceSignals({ html, contentLanguage, pageUrl: url }), [], html);
  none('<link rel="alternate" hreflang="uk" href="/uk/"><link rel="alternate" hreflang="x-default" href="/">');
  none('<link rel="stylesheet" hreflang="ru" href="/a.css">');
  none('<meta property="og:locale" content="uk_UA"><meta name="description" content="ru">');
  none('<a href="/rules">Rules</a><a href="/run/">Run</a><a href="/en/ru">x</a><a href="/russia">x</a>');
  none('<a href="https://other.org/ru/">elsewhere</a><a href="https://ru.other.org/">elsewhere</a>');
  none('<a href="mailto:ru@example.com">mail</a><a href="#ru">anchor</a>');
  none("<p>x</p>", "uk, en-GB");
  none('<a href="/x" lang="rue">Rusyn is not Russian</a>');
});

test("hosting: one DNS lookup, one RDAP request for the first IPv4 address, with the skill's User-Agent", async () => {
  const calls = [];
  const r = await lookupHosting("example.com", { lookup: lookupTo("2001:db8::1", "93.184.215.14"), fetch: rdapCountry("RU", calls) });
  assert.deepEqual(r, { status: "checked", country: "RU", ip: "93.184.215.14" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${RDAP_URL}93.184.215.14`);
  assert.equal(calls[0].url, "https://rdap.org/ip/93.184.215.14");
  assert.equal(calls[0].init.headers["User-Agent"], CRAWLER_UA);
  assert.equal(calls[0].init.redirect, "follow");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

test("hosting: DNS failure, RDAP failure or no country is not_determined, never a refusal", async () => {
  assert.deepEqual(await lookupHosting("x.example", { lookup: async () => { throw new Error("ENOTFOUND"); }, fetch: noFetch }), { status: "not_determined" });
  assert.deepEqual(await lookupHosting("x.example", { lookup: lookupTo("192.0.2.1"), fetch: async () => { throw new Error("offline"); } }), { status: "not_determined", ip: "192.0.2.1" });
  assert.deepEqual(await lookupHosting("x.example", { lookup: lookupTo("192.0.2.1"), fetch: async () => json({}, 404) }), { status: "not_determined", ip: "192.0.2.1" });
  assert.deepEqual(await lookupHosting("x.example", { lookup: lookupTo("192.0.2.1"), fetch: rdapCountry(undefined) }), { status: "not_determined", ip: "192.0.2.1" });
  const slow = await lookupHosting("x.example", { lookup: () => new Promise(() => {}), fetch: noFetch, timeoutMs: 20 });
  assert.deepEqual(slow, { status: "not_determined" });
  const judged = await judgeRussianSite({ url: "https://x.example/", deps: { lookup: lookupTo("192.0.2.1"), fetch: rdapCountry(undefined) } });
  assert.equal(judged.refusal, null);
  assert.equal(judged.hosting.status, "not_determined");
});

test("order: domain before hosting, hosting before audience, and no network when told", async () => {
  const domain = await judgeRussianSite({ url: "https://example.ru/", html: '<link rel="alternate" hreflang="ru" href="/ru">', deps: { lookup: noLookup, fetch: noFetch } });
  assert.equal(domain.refusal.reasonCode, "refused_ru_domain");
  assert.equal(domain.refusal.signal, "domain");
  assert.equal(domain.refusal.zone, "ru");

  const hosting = await judgeRussianSite({ url: "https://example.com/", html: '<link rel="alternate" hreflang="ru" href="/ru">', deps: { lookup: lookupTo("192.0.2.7"), fetch: rdapCountry("RU") } });
  assert.equal(hosting.refusal.reasonCode, "refused_ru_hosting");
  assert.deepEqual([hosting.refusal.country, hosting.refusal.ip], ["RU", "192.0.2.7"]);

  const audience = await judgeRussianSite({ url: "https://example.com/", html: '<link rel="alternate" hreflang="ru" href="/ru">', deps: { lookup: lookupTo("192.0.2.7"), fetch: rdapCountry("DE") } });
  assert.equal(audience.refusal.reasonCode, "refused_ru_audience");
  assert.deepEqual(audience.refusal.signals, [{ kind: "hreflang", value: "ru" }]);

  const offline = await judgeRussianSite({ url: "https://example.com/", network: false, deps: { lookup: noLookup, fetch: noFetch } });
  assert.equal(offline.refusal, null);
  assert.equal(offline.hosting.status, "not_checked");

  // The second call reuses the first one's answer for the same host.
  const again = await judgeRussianSite({ url: "https://example.com/", html: "<p>x</p>", hosting: audience.hosting, deps: { lookup: noLookup, fetch: noFetch } });
  assert.equal(again.refusal, null);
  assert.equal(again.hosting.country, "DE");
});

test("readPage: a .ru address is refused before any request, and the reading names the signal", async () => {
  const r = await withGlobalFetch(noFetch, () => readPage({ url: "https://example.ru/page", deps: { lookup: noLookup, fetch: noFetch } }));
  assert.equal(r.ok, false);
  assert.equal(r.reasonCode, "refused_ru_domain");
  assert.equal(r.refusal.signal, "domain");
  assert.equal(r.page.url, "https://example.ru/page");
  assert.equal(r.passages, undefined);
  // Also with a saved copy: the address alone decides.
  const saved = await readPage({ url: "https://example.su/", html: exampleHtml });
  assert.equal(saved.reasonCode, "refused_ru_domain");
});

test("readPage: hosting in Russia is refused before the page is fetched", async () => {
  const r = await withGlobalFetch(noFetch, () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: rdapCountry("RU") } }));
  assert.equal(r.reasonCode, "refused_ru_hosting");
  assert.equal(r.refusal.signal, "hosting");
  assert.deepEqual(r.hosting, { status: "checked", country: "RU", ip: "192.0.2.9" });
});

test("readPage: a Russian-language version is refused after the fetch; the page text is not kept", async () => {
  const html = exampleHtml.replace("</head>", '<link rel="alternate" hreflang="ru-RU" href="https://example.com/ru/"></head>');
  const r = await withGlobalFetch(async () => page(html), () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: rdapCountry("US") } }));
  assert.equal(r.reasonCode, "refused_ru_audience");
  assert.equal(r.refusal.signal, "audience");
  assert.deepEqual(r.refusal.signals, [{ kind: "hreflang", value: "ru-RU" }]);
  assert.equal(r.passages, undefined);
  assert.ok(!JSON.stringify(r).includes("Example Domain"), "nothing of the page");

  const header = await withGlobalFetch(async () => page(exampleHtml, { "content-language": "ru" }), () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: rdapCountry("US") } }));
  assert.equal(header.reasonCode, "refused_ru_audience");
  assert.equal(header.refusal.signals[0].kind, "content_language");
});

test("readPage: a redirect to a .ru address is refused on the final address", async () => {
  let n = 0;
  const fetchImpl = async () => (n++ === 0 ? new Response("", { status: 301, headers: { location: "https://example.ru/" } }) : page(exampleHtml));
  const r = await withGlobalFetch(fetchImpl, () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: rdapCountry("US") } }));
  assert.equal(r.reasonCode, "refused_ru_domain");
  assert.equal(r.page.url, "https://example.ru/");
});

test("readPage: hosting not determined is recorded and nothing is refused; a saved copy is not checked", async () => {
  const r = await withGlobalFetch(async () => page(exampleHtml), () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: async () => { throw new Error("offline"); } } }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.hosting, { status: "not_determined", ip: "192.0.2.9" });
  const elsewhere = await withGlobalFetch(async () => page(exampleHtml), () => readPage({ url: "https://example.com/", robots: "skip", deps: { lookup: lookupTo("192.0.2.9"), fetch: rdapCountry("US") } }));
  assert.deepEqual(elsewhere.hosting, { status: "checked", country: "US", ip: "192.0.2.9" });
  const saved = await readPage({ url: "https://example.com/", html: exampleHtml, deps: { lookup: noLookup, fetch: noFetch } });
  assert.equal(saved.ok, true);
  assert.deepEqual(saved.hosting, { status: "not_checked" });
});

test("the report: the same refusal block, one reason line per code in both languages, no other-language line", () => {
  assert.deepEqual(REFUSAL_CODES, ["refused_ru_domain", "refused_ru_hosting", "refused_ru_audience", "refused_language_ru"]);
  assert.ok(!("lastLine" in REFUSAL_COPY));
  // The lead names every reason; the reason line under it names the one that fired.
  assert.ok(REFUSAL_COPY.lead.en.includes("does not analyse pages written in Russian, or sites in Russia's domain zone, hosted in Russia or with a Russian-language version. This is the publisher's decision"));
  assert.ok(REFUSAL_COPY.lead.uk.includes("не аналізує сторінки російською мовою, а також сайти в доменній зоні Росії, розміщені в Росії або з російськомовною версією. Це рішення"));
  assert.equal(isRefusalCode("blocked"), false);
  for (const code of REFUSAL_CODES) {
    const reading = { ok: false, reasonCode: code, requestedInput: "https://example.org/x", page: { url: "https://example.org/x" } };
    const html = renderRefusalHtml(reading);
    const md = renderRefusalMarkdown(reading);
    for (const lang of ["en", "uk"]) {
      assert.ok(html.includes(REFUSAL_REASON[code][lang].replace(/'/g, "&#39;")), `${code} ${lang} html`);
      assert.ok(md.includes(REFUSAL_REASON[code][lang]), `${code} ${lang} md`);
    }
    for (const other of REFUSAL_CODES.filter((c) => c !== code)) assert.ok(!md.includes(REFUSAL_REASON[other].en), `${code} carries only its own reason`);
    assert.ok(html.includes("This page was not analysed") && html.includes("Цю сторінку не проаналізовано"));
    for (const text of [html, md]) {
      assert.ok(!/another language|іншою мовою|class="last"/.test(text), `${code}: the other-language line is gone`);
    }
  }
  // Correct Ukrainian: none of the four letters Ukrainian does not have.
  for (const code of REFUSAL_CODES) assert.ok(!/[ыъэё]/i.test(REFUSAL_REASON[code].uk), code);
});

test("lens.mjs on a domain refusal writes the refusal report with its reason", () => {
  const dir = mkdtempSync(join(tmpdir(), "vectorscope-ru-domain-"));
  try {
    const reading = { schema: "getlooploop/vectorscope-skill-reading@1", ok: false, reasonCode: "refused_ru_domain", refusal: { reasonCode: "refused_ru_domain", signal: "domain", host: "example.ru", zone: "ru" }, requestedInput: "https://example.ru/", page: { url: "https://example.ru/", requestedUrl: "https://example.ru/" }, hosting: { status: "not_checked" } };
    writeFileSync(join(dir, "reading.json"), JSON.stringify(reading));
    const out = execFileSync(process.execPath, [lensScript, join(dir, "reading.json"), "--html", join(dir, "r.html"), "--md", join(dir, "r.md"), "--json", join(dir, "e.json")], { encoding: "utf8" });
    assert.match(out, /REFUSED {2}refused_ru_domain: the address is in Russia's domain zone/);
    const exported = JSON.parse(readFileSync(join(dir, "e.json"), "utf8"));
    assert.equal(exported.refusal.signal, "domain");
    assert.deepEqual(exported.passages, []);
    assert.ok(readFileSync(join(dir, "r.html"), "utf8").includes("Чому: адреса в доменній зоні Росії."));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readPage: MDN's saved page links its Russian version from the language switcher and is still read", async () => {
  const html = readFileSync(fileURLToPath(new URL("./fixtures/mdn-http-caching.html", import.meta.url)), "utf8");
  assert.ok(html.includes('href="/ru/docs/Web/HTTP/Guides/Caching"'), "the switcher link is in the saved page");
  const r = await readPage({ url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", html, robots: "skip" });
  assert.equal(r.ok, true);
  assert.equal(r.page.chunksIndexed, 26);
});
