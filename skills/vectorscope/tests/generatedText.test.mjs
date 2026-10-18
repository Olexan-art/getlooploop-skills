// "How generated the text sounds" (2.111): the agent's style.json, the Pattern score over the kept
// text, the marker words beside it, the disagreement between the two, and the block's copy in
// English, Ukrainian and Polish. Not an AI detector, and the tests hold it to saying so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeGenerated, GENERATED_COPY, GENERATED_METRICS, generatedExport, generatedMarkdown, renderGeneratedHtml, validateStyle } from "../scripts/lib/generatedText.mjs";
import { countMarkers, markerBand, markerTerms } from "../scripts/lib/markers.mjs";
import { plForm } from "../scripts/lib/i18n.mjs";
import { readPage } from "../scripts/lib/reading.mjs";

const TEMPLATE = [
  "In today's world, managing your finances has never been more important. When it comes to running a small business, every minute counts, and invoicing is no exception. It is worth noting that late payments are one of the biggest challenges facing small businesses today. That is why we built a powerful solution that delivers a seamless experience from the first invoice to the final payment. Our platform helps you stay organised. Our platform helps you save time. Our platform helps you get paid faster. At the end of the day, your business deserves a comprehensive platform that works as hard as you do.",
  "Tallyfern integrates seamlessly with the tools you already use, creating a unified ecosystem for your business. Our innovative integrations streamline your workflows and unlock new levels of efficiency, delivering a frictionless experience across your entire tech stack. Every business is unique, and our robust platform adapts to it. Experience the difference that true connectivity can make for your business and unlock its full potential today.",
  "Reminders go out 3 days before the due date, on the due date and 7 days after it. You can change each of the three, turn any of them off, or write your own text; the default email is 74 words long and names the invoice number, the amount and the payment link. A reminder stops the moment Stripe or PayPal reports the payment, so a client who paid at 9:02 is not chased at 9:05.",
  "Free for up to 5 clients.",
];
const passages = TEMPLATE.map((text, index) => ({ index, heading: `Section ${index}`, text, charCount: text.length }));
const sections = [{ heading: "Tallyfern", text: "Tallyfern\nThe smarter way to get paid.", intro: true }, ...TEMPLATE.map((text, i) => ({ heading: `Section ${i}`, text }))];
const STYLE = {
  agent: "Claude Code",
  model: "test-model",
  passages: [
    { passage: 0, verdict: "generic", evidence: "a powerful solution that delivers a seamless experience" },
    { passage: 1, verdict: "generic", evidence: "unlock its full potential", why: "names no integration" },
    { passage: 2, verdict: "specific", evidence: "a client who paid at 9:02 is not chased at 9:05" },
    { passage: 3, verdict: "specific", evidence: "Free for up to 5 clients." },
  ],
};

test("Polish plural forms: 1 one, 2–4 few except 12–14, the rest many", () => {
  const f = (n) => plForm(n, "fragment", "fragmenty", "fragmentów");
  assert.deepEqual([1, 2, 4, 5, 12, 14, 21, 22, 25, 112, 122].map(f), ["fragment", "fragmenty", "fragmenty", "fragmentów", "fragmentów", "fragmentów", "fragmentów", "fragmenty", "fragmentów", "fragmentów", "fragmenty"]);
});

test("style.json: every passage once, a known verdict, a verbatim quote, no Russian", () => {
  const ok = validateStyle(STYLE, passages);
  assert.equal(ok.passages.length, 4);
  assert.deepEqual(ok.judgement, { agent: "Claude Code", model: "test-model" });
  const without = (n) => ({ ...STYLE, passages: STYLE.passages.filter((p) => p.passage !== n) });
  assert.throws(() => validateStyle(without(3), passages), /leaves out passage 3/);
  assert.throws(() => validateStyle({ passages: [...STYLE.passages, STYLE.passages[0]] }, passages), /judged twice/);
  assert.throws(() => validateStyle({ passages: STYLE.passages.map((p, i) => (i ? p : { ...p, verdict: "ai" })) }, passages), /verdict/);
  assert.throws(() => validateStyle({ passages: STYLE.passages.map((p, i) => (i ? p : { ...p, evidence: "words the page never wrote" })) }, passages), /not verbatim/);
  assert.throws(() => validateStyle({ passages: STYLE.passages.map((p, i) => (i ? p : { ...p, why: "это" })) }, passages), /Russian/);
  assert.throws(() => validateStyle({ passages: [{ passage: 9, verdict: "generic", evidence: "x" }] }, passages), /not a passage/);
  assert.throws(() => validateStyle([], passages), /style\.json must be/);
});

test("the block: score over the kept text without the intro, markers beside it, short passages named", () => {
  const g = computeGenerated({ sections, passages, style: validateStyle(STYLE, passages) });
  assert.equal(g.analysed, true);
  assert.equal(g.language, "en");
  assert.ok(g.page.score.value > 0, "template text scores above zero");
  assert.ok(g.page.markers.hits >= 8, `markers counted: ${g.page.markers.hits}`);
  assert.equal(g.page.markers.band, "frequent");
  assert.deepEqual(g.short, [3]);
  assert.equal(g.passages[3].score, null, "no score of its own under 60 words");
  assert.ok(g.families.find((f) => f.family === "stock").chips.some((c) => /worth noting/i.test(c.text)));
  // The intro is not scored: its words are not in the page's word count.
  const noIntro = computeGenerated({ sections: sections.slice(1), passages, style: null });
  assert.equal(noIntro.page.words, g.page.words);
  // The swap test and where it parts with the script.
  assert.equal(g.generic.passages, 2);
  assert.ok(Math.abs(g.generic.share - (passages[0].charCount + passages[1].charCount) / passages.reduce((s, p) => s + p.charCount, 0)) < 1e-9);
  const missed = g.disagreements.filter((d) => d.kind === "script_missed").map((d) => d.passage);
  assert.ok(missed.includes(1), "the integrations passage is generic and scores low: shown as a disagreement");
});

test("no lexicon, no score: a reason, never a zero", () => {
  const polish = "To jest krótki tekst o fakturach. Każda faktura ma numer, kwotę i termin płatności. Przypomnienie wychodzi trzy dni przed terminem i w dniu terminu. Klient płaci kartą lub przelewem, a status zmienia się od razu po zaksięgowaniu wpłaty na koncie firmy w banku. Wszystko widać w jednym miejscu, bez arkuszy i bez ręcznego przepisywania danych z jednego systemu do drugiego.";
  const p = [{ index: 0, heading: null, text: polish, charCount: polish.length }];
  const g = computeGenerated({ sections: [{ heading: null, text: polish }], passages: p, style: null });
  assert.equal(g.analysed, false);
  assert.equal(g.page, null);
  assert.ok(["unsupported_language", "language_not_supported", "language_undetermined"].includes(g.reason), g.reason);
  assert.ok(GENERATED_COPY.reason[g.reason], "the reason has copy");
  const old = computeGenerated({ sections: null, passages, style: null });
  assert.equal(old.reason, "no_sections");
  const html = renderGeneratedHtml(old);
  assert.ok(html.includes("read.mjs"), "an old reading says to read again");
});

test("marker words: none on a hand-written page, inflections counted in Ukrainian and Spanish", async () => {
  const html = readFileSync(new URL("./fixtures/getlooploop-vectorscope.html", import.meta.url), "utf8");
  const reading = await readPage({ url: "https://www.getlooploop.com/vectorscope", html, robots: "skip" });
  assert.ok(Array.isArray(reading.sections) && reading.sections[0].intro, "the reading records its sections, intro marked");
  const g = computeGenerated({ sections: reading.sections, passages: reading.passages, style: null });
  assert.equal(g.page.markers.hits, 0);
  assert.ok(g.page.score.value < 30, `hand-written page scores low: ${g.page.score.value}`);
  assert.equal(countMarkers("Безшовний досвід і безшовна інтеграція виведуть бізнес на новий рівень.", "uk").total, 3);
  assert.equal(countMarkers("Una experiencia fluida, sin fisuras, de vanguardia.", "es").total, 3);
  assert.equal(countMarkers("Adentro del edificio.", "es").total, 0, "adentro is not adentrarse");
  assert.equal(countMarkers("x", "pl"), null, "no list, no count");
  assert.equal(markerBand(9.9), "rare");
  assert.equal(markerBand(10), "noticeable");
  assert.equal(markerBand(25), "frequent");
  for (const lang of ["en", "uk", "es"]) assert.ok(markerTerms(lang).length >= 20, lang);
  assert.ok(!markerTerms("uk").some((t) => /[ыъэё]/.test(t)), "no Russian letters in the Ukrainian list");
});

test("HTML: three languages, page text escaped, a fold of formulas when the host has no \"?\"", () => {
  const evil = '<img src=x onerror="alert(1)">';
  const p = passages.map((x, i) => (i ? x : { ...x, heading: evil }));
  const g = computeGenerated({ sections, passages: p, style: validateStyle(STYLE, p) });
  const html = renderGeneratedHtml(g, { anchor: (i) => `#p-${i}` });
  assert.ok(html.includes('id="generated"'));
  assert.ok(html.includes('class="l-uk" lang="uk"') && html.includes('class="l-pl" lang="pl"'));
  assert.ok(!html.includes(evil) && html.includes("&lt;img"));
  assert.ok(html.includes("gx-how"), "formulas folded in");
  assert.ok(html.includes("Na ile tekst brzmi jak wygenerowany") && html.includes("Наскільки текст звучить як згенерований"));
  assert.ok(html.includes('href="#p-1"'));
  const withHelp = renderGeneratedHtml(g, { help: (id) => `<i data-help="${id}"></i>` });
  assert.ok(!withHelp.includes("gx-how") && withHelp.includes('data-help="pattern_score"'));
  const md = generatedMarkdown(g).join("\n");
  assert.match(md, /## How generated the text sounds/);
  assert.match(md, /Not an authorship detector/);
  const ex = generatedExport(g);
  assert.equal(ex.passages.length, 4);
  assert.equal(ex.judgement.generic.passages, 2);
});

test("copy and metrics: every entry in English, Ukrainian and Polish, none of it Russian", () => {
  const walk = (o, path) => {
    if (o && typeof o === "object" && "en" in o) {
      for (const l of ["en", "uk", "pl"]) assert.ok(o[l], `${path}.${l}`);
      for (const l of ["uk", "pl"]) {
        const v = typeof o[l] === "function" ? o[l]({ hits: 2, with: 1, of: 3, n: 2, refs: ["#1", "#2"], list: "#1", points: 3, words: 100, per1k: 3, value: 1, by: "x", markers: "5" }) : o[l];
        assert.ok(!/[ыъэё]/.test(v), `${path}.${l} has Russian letters`);
      }
    } else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
  };
  walk(GENERATED_COPY, "copy");
  walk(GENERATED_METRICS, "metrics");
  assert.match(GENERATED_COPY.note.en, /Authorship cannot be proven/);
});

test("a whole page is not a pasted paragraph: names do not change the language, a reference list is not a template", async () => {
  const { detectLanguage, detectRepetition } = await import("../scripts/lib/patterns.mjs");
  assert.equal(detectLanguage("The model was described by Łukasz Kaiser and others in the paper that made the transformer, which is the basis of this article.").language, "en");
  assert.equal(detectLanguage("Ceny planów dla zespołów są proste i jasne.").code, "unsupported_language", "Polish is still Polish");
  const refs = "Retrieved 20 January 2024. Retrieved 12 June 2023. Retrieved 30 June 2025. Retrieved 16 November 2025.";
  assert.equal(detectRepetition(refs, "en").length, 0, "a skeleton with no function word is not a shape");
  const template = "Our platform helps you stay organised. Our platform helps you save time. Our platform helps you get paid faster.";
  assert.ok(detectRepetition(template, "en").length >= 2, "a real template still repeats");
});
