// The agent's judgement files: questions.json, brand.json and reviews.json are validated (quotes
// verbatim, every question and platform answered, "doesn't know" allowed, own knowledge only),
// and the comparisons with the page are deterministic. Every finding they give is marked as the
// agent's judgement, with the model that made it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AXES, validateQuestions } from "../scripts/lib/questions.mjs";
import { amounts, countedNumbers, disclaimsKnowledge, validateBrand } from "../scripts/lib/brand.mjs";
import { CONTROL, PLATFORM_CODES, REVIEW_PLATFORMS, validateReviews, visibleRatingIn } from "../scripts/lib/reviews.mjs";
import { buildModel } from "../scripts/lib/model.mjs";
import { renderReport } from "../scripts/lib/report.mjs";
import { buildExport } from "../scripts/lib/outputs.mjs";
import { page, readingOf } from "./helpers.mjs";

const ID = { agent: "Test agent", model: "Test model 1" };
const body = `<h2>Plans</h2><p>The Free plan covers 3 agents and costs $0. The Team plan is $29 per month for 10 agents. It connects to Slack and to Gmail.</p><h2>Security</h2><p>Every account is encrypted at rest. Backups run every night and are kept for 30 days.</p>`;
const html = page({ title: "BrightDesk pricing for support teams", body });

async function reading() {
  return readingOf(html);
}
const passageWith = (r, s) => r.vs.passages.find((p) => p.text.includes(s)).index;

function questionsFor(r, over = {}) {
  const plans = passageWith(r, "Free plan covers");
  const sec = passageWith(r, "encrypted at rest");
  const qs = [
    { id: "q1", question: "How many agents can I add for free, right now?", axes: ["urgency", "object"], passage: plans, verdict: "complete", citable: true, quote: "The Free plan covers 3 agents and costs $0." },
    { id: "q2", question: "On my phone: does it work with Slack?", axes: ["device"], passage: plans, verdict: "complete", citable: true, quote: "It connects to Slack and to Gmail." },
    { id: "q3", question: "I deleted a ticket by mistake, can I get it back?", axes: ["obstacle"], passage: sec, verdict: "partial", citable: false, quote: "Backups run every night and are kept for 30 days." },
    { id: "q4", question: "Is my data stored in the EU?", axes: ["obstacle", "object"], passage: sec, verdict: "partial", citable: true, quote: "Every account is encrypted at rest." },
    { id: "q5", question: "Is there a discount for nonprofits?", axes: ["object"], passage: null, verdict: "missing" },
    { id: "q6", question: "What does the team plan cost per month?", axes: ["object"], passage: plans, verdict: "complete", citable: true, quote: "The Team plan is $29 per month for 10 agents." },
    { id: "q7", question: "My boss is waiting: can I export tickets today?", axes: ["urgency", "device"], passage: null, verdict: "missing" },
    { id: "q8", question: "How long are backups kept?", axes: ["obstacle"], passage: sec, verdict: "complete", citable: true, quote: "kept for 30 days" },
  ];
  return { ...ID, topic: "help desk pricing", questions: qs, ...over };
}

test("questions.json: valid, with verbatim quotes, 8 to 12 questions and all four axes", async () => {
  const r = await reading();
  const v = validateQuestions(questionsFor(r), r.vs.passages);
  assert.equal(v.questions.length, 8);
  assert.deepEqual(v.judgement, { agent: "Test agent", model: "Test model 1" });
  assert.deepEqual(AXES, ["urgency", "device", "object", "obstacle"]);
});

test("questions.json: a quote that is not in its passage, a fourth axis missing, too few questions, Russian letters", async () => {
  const r = await reading();
  const bad = questionsFor(r);
  bad.questions[0].quote = "The Free plan covers five agents.";
  assert.throws(() => validateQuestions(bad, r.vs.passages), /not verbatim/);
  const noDevice = questionsFor(r);
  noDevice.questions = noDevice.questions.map((q) => ({ ...q, axes: q.axes.filter((a) => a !== "device").length ? q.axes.filter((a) => a !== "device") : ["object"] }));
  assert.throws(() => validateQuestions(noDevice, r.vs.passages), /device axis/);
  const few = questionsFor(r);
  few.questions = few.questions.slice(0, 7);
  assert.throws(() => validateQuestions(few, r.vs.passages), /write 8 to 12/);
  const ru = questionsFor(r);
  ru.questions[4].question = `Is there a discount ${String.fromCharCode(0x44b)}?`;
  assert.throws(() => validateQuestions(ru, r.vs.passages), /Russian/);
});

test("questions: a missing answer is not tied to a spot, a partial one sits on its passage", async () => {
  const r = await reading();
  const m = buildModel(r, { questions: validateQuestions(questionsFor(r), r.vs.passages) });
  const missing = m.findings.filter((f) => f.code === "question_missing");
  const partial = m.findings.filter((f) => f.code === "question_partial");
  assert.equal(missing.length, 2);
  assert.equal(partial.length, 2);
  assert.ok(missing.every((f) => !f.mapped && f.severity === "medium" && f.layer === "judgement" && f.judgement.model === "Test model 1"));
  assert.ok(partial.every((f) => f.mapped && f.severity === "low"));
  assert.equal(new Set(m.findings.map((f) => f.id)).size, m.findings.length, "one id per finding");
  assert.equal(m.tiles.find((t) => t.id === "quote").count >= 4, true);
  const out = renderReport(m);
  assert.ok(out.includes("Agent&#39;s judgement · Test model 1") || out.includes("Agent's judgement · Test model 1"));
  assert.ok(out.includes('id="one-model"'));
});

const brandFile = (answers, over = {}) => ({ ...ID, brand: "BrightDesk", basis: "own_knowledge", answers, ...over });
const all = (text, knows = true) => ["what_is", "pricing", "integrations", "weaknesses", "alternatives"].map((q) => ({ question: q, knows, answer: knows ? text[q] || "" : "" }));

test("brand.json: all five answered, the basis stated, 'doesn't know' allowed", () => {
  assert.throws(() => validateBrand(brandFile(all({}, false).slice(0, 4))), /no answer to alternatives/);
  assert.throws(() => validateBrand(brandFile(all({}, false), { basis: "web" })), /own_knowledge/);
  assert.throws(() => validateBrand(brandFile([{ question: "what_is", knows: true, answer: "" }, ...all({}, false).slice(1)])), /answer text is required/);
  const v = validateBrand(brandFile(all({}, false)));
  assert.ok(v.answers.every((a) => !a.knows));
  assert.equal(disclaimsKnowledge("I'm not familiar with a company called BrightDesk."), true);
});

test("brand: unknown, a contradicted price and count, and facts the page lacks", async () => {
  const r = await reading();
  const unknown = buildModel(r, { brand: validateBrand(brandFile(all({}, false))) });
  assert.ok(unknown.findings.some((f) => f.code === "brand_unknown" && f.layer === "judgement"));
  const said = {
    what_is: "BrightDesk is a help desk for small teams. It was founded in Lisbon by Northwind Labs.",
    pricing: "BrightDesk has a free plan for 5 agents, and the Team plan costs $39 per month.",
    integrations: "It integrates with Slack and Gmail.",
    weaknesses: "Some users find reporting limited.",
    alternatives: "Zendesk and Freshdesk.",
  };
  const m = buildModel(r, { brand: validateBrand(brandFile(all(said))) });
  const c = m.findings.find((f) => f.code === "brand_contradiction");
  assert.ok(c, "a contradiction");
  assert.equal(c.severity, "high");
  assert.ok(c.evidence.items.some((x) => x.kind === "price" && x.model.includes("$39")));
  assert.ok(c.evidence.items.some((x) => x.kind === "count" && x.model[0] === "5 agents"));
  assert.ok(c.mapped, "placed on the passage that states the page's figure");
  const absent = m.findings.find((f) => f.code === "brand_fact_absent");
  assert.ok(absent.evidence.items.some((x) => /Lisbon/.test(x.sentence)));
  assert.ok(!absent.evidence.items.some((x) => /Slack and Gmail/.test(x.sentence)), "a fact the page states is not lacking");
  assert.ok(!m.findings.some((f) => f.code === "brand_unknown"));
  assert.deepEqual(amounts("$29, $29 and 10 USD"), ["$29", "10usd"]);
  assert.deepEqual(countedNumbers("3 agents in 2019 and 10 agents").map((x) => x.unit), ["agent", "agent"]);
});

const reviewsFile = (over = {}) => ({ ...ID, brand: "BrightDesk", basis: "own_knowledge", platforms: PLATFORM_CODES.map((p) => ({ platform: p, knows: false })), ...over });

test("reviews.json: twelve platforms and the control, each once; ratings on the platform's scale", () => {
  assert.equal(REVIEW_PLATFORMS.length, 12);
  assert.equal(CONTROL.name, "Vetteral");
  assert.ok(!REVIEW_PLATFORMS.some((p) => p.name.toLowerCase() === CONTROL.name.toLowerCase()));
  assert.throws(() => validateReviews(reviewsFile({ platforms: reviewsFile().platforms.slice(1) })), /no entry for g2/);
  const tooHigh = reviewsFile();
  tooHigh.platforms[0] = { platform: "g2", knows: true, rating: 7 };
  assert.throws(() => validateReviews(tooHigh), /outside G2's scale/);
  const tr = reviewsFile();
  tr.platforms[5] = { platform: "trustradius", knows: true, rating: 8.4 };
  assert.equal(validateReviews(tr).platforms[5].rating, 8.4, "TrustRadius scores out of ten");
});

test("reviews: a rating with no source, the invented platform, and ratings shown without markup", async () => {
  const r = await reading();
  const file = reviewsFile();
  file.platforms[0] = { platform: "g2", knows: true, rating: 4.5, reviews: 120 };
  file.platforms[12] = { platform: "vetteral", knows: true, rating: 4.2 };
  const m = buildModel(r, { reviews: validateReviews(file) });
  const unbacked = m.findings.find((f) => f.code === "review_rating_unbacked");
  assert.deepEqual(unbacked.evidence.items.map((x) => x.platform), ["G2"]);
  assert.ok(m.findings.some((f) => f.code === "review_control_hallucination" && f.severity === "high"));
  // The page names G2 and links to it: the rating has a source.
  const linked = await readingOf(page({ body: body + '<p>Rated on <a href="https://www.g2.com/products/brightdesk">G2</a>.</p>' }));
  assert.ok(!buildModel(linked, { reviews: validateReviews(file) }).findings.some((f) => f.code === "review_rating_unbacked"));
  // Ratings on the page, no AggregateRating: measured, no reviews.json needed.
  const shown = await readingOf(page({ body: body + "<h2>Customers</h2><p>Rated 4.8/5 by 1,200 support teams who switched last year.</p>" }));
  const f = buildModel(shown).findings.find((x) => x.code === "reviews_without_markup");
  assert.ok(f && f.layer === "measured" && f.mapped);
  const marked = await readingOf(page({ body: body + "<h2>Customers</h2><p>Rated 4.8/5 by 1,200 support teams who switched last year.</p>", head: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"BrightDesk","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","ratingCount":"1200"}}</script>' }));
  assert.ok(!buildModel(marked).findings.some((x) => x.code === "reviews_without_markup"));
  assert.equal(visibleRatingIn("about 26 passages"), null);
});

test("the brand tile: not checked without the files, judged with them; the export carries layer and model", async () => {
  const r = await reading();
  assert.equal(buildModel(r).tiles.find((t) => t.id === "brand").state, "na");
  const m = buildModel(r, { brand: validateBrand(brandFile(all({}, false))), reviews: validateReviews(reviewsFile()) });
  assert.equal(m.tiles.find((t) => t.id === "brand").state, "prob");
  const x = buildExport(m);
  const f = x.findings.find((y) => y.code === "brand_unknown");
  assert.equal(f.layer, "judgement");
  assert.deepEqual(f.judgement, { agent: "Test agent", model: "Test model 1" });
  assert.equal(x.judgement.brand.brand, "BrightDesk");
});
