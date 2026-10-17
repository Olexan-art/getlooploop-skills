// The report's own words, in English (the default) and Ukrainian. Codes travel on the wire; the
// sentence is chosen here. Lite shows short labels only: no descriptions, no "what the rule
// says", no fix directions. Every entry is [en, uk]; a label is a function of the evidence.
// Page content (headings, titles) is never translated.

import { ukForm } from "../../../vectorscope/scripts/lib/i18n.mjs";

export { ukForm };

export const fmtEn = (n) => Number(n ?? 0).toLocaleString("en-US");
export const fmtUk = (n) => Number(n ?? 0).toLocaleString("en-US").replace(/,/g, " ");
const en = (n, one, many) => `${fmtEn(n)} ${n === 1 ? one : many}`;
const uk = (n, one, few, many) => `${fmtUk(n)} ${ukForm(n, one, few, many)}`;
const kb = (bytes) => Math.round(bytes / 1024);
const dec = (n, sep) => String(Number(n ?? 0)).replace(".", sep);
const q = (t, n = 38) => {
  const x = String(t ?? "").replace(/\s+/g, " ").trim();
  return `“${x.length > n ? `${x.slice(0, n - 1)}…` : x}”`;
};
const list = (xs, n = 2) => (xs.length > n ? `${xs.slice(0, n).join(", ")} +${xs.length - n}` : xs.join(", "));

/** Short labels, three to six words, for the map, the chips and the Markdown. */
export const LABELS = {
  robots_unreachable: () => ["robots.txt does not answer", "robots.txt не відповідає"],
  search_engine_blocked: (e) => [`${list(e.bots)} blocked`, `${list(e.bots)} заблоковано`],
  ai_search_blocked: (e) => (e.bots.length === 1 ? [`${e.bots[0]} blocked`, `${e.bots[0]} заблоковано`] : [`${e.bots.length} AI search bots blocked`, `${uk(e.bots.length, "ШІ-бот пошуку", "ШІ-боти пошуку", "ШІ-ботів пошуку")} заблоковано`]),
  ai_training_blocked: (e) => (e.bots.length <= 2 ? [`${e.bots.join(", ")} blocked`, `${e.bots.join(", ")} заблоковано`] : [`${e.bots.length} training bots blocked`, `${uk(e.bots.length, "бот навчання", "боти навчання", "ботів навчання")} заблоковано`]),
  noindex: () => ["The page says noindex", "Сторінка каже noindex"],
  llms_txt_missing: () => ["No llms.txt", "Немає llms.txt"],
  not_https: () => ["No HTTPS", "Без HTTPS"],
  redirect_chain: (e) => [`${e.hops} redirects in a row`, `${uk(e.hops, "переадресація", "переадресації", "переадресацій")} поспіль`],
  sitemap_missing: () => ["No sitemap found", "Sitemap не знайдено"],
  sitemap_not_listed: () => ["Not in the sitemap", "Немає в sitemap"],
  title_missing: () => ["No title", "Немає title"],
  title_too_long: (e) => [`Title too long · ${e.length}`, `Title задовгий · ${e.length}`],
  title_too_short: (e) => [`Title too short · ${e.length}`, `Title закороткий · ${e.length}`],
  meta_description_missing: () => ["No description", "Немає опису"],
  meta_description_short: (e) => [`Description too short · ${e.length}`, `Опис закороткий · ${e.length}`],
  meta_description_long: (e) => [`Description too long · ${e.length}`, `Опис задовгий · ${e.length}`],
  h1_missing: () => ["No h1", "Немає h1"],
  h1_multiple: (e) => [`${e.count} h1 headings`, uk(e.count, "заголовок h1", "заголовки h1", "заголовків h1")],
  heading_order_skip: () => ["Heading levels skipped", "Пропущено рівні заголовків"],
  canonical_missing: () => ["No canonical", "Немає canonical"],
  canonical_relative: () => ["Canonical is relative", "Canonical відносний"],
  canonical_other: () => ["Canonical points elsewhere", "Canonical веде деінде"],
  canonical_multiple: () => ["Several canonicals", "Кілька canonical"],
  internal_links_none: () => ["No internal links", "Немає внутрішніх посилань"],
  broken_links: (e) => (e.count === 1 ? ["A link leads to an error", "Посилання веде на помилку"] : [`${e.count} broken links`, uk(e.count, "неробоче посилання", "неробочі посилання", "неробочих посилань")]),
  image_alt_missing: (e) => [en(e.count, "image without alt", "images without alt"), `${uk(e.count, "зображення", "зображення", "зображень")} без alt`],
  viewport_missing: () => ["No viewport meta", "Немає meta viewport"],
  html_lang_missing: () => ["No html lang", "Немає html lang"],
  social_tags_missing: () => ["Preview tags missing", "Бракує тегів прев’ю"],
  page_weight_heavy: (e) => [`${fmtEn(kb(e.htmlBytes))} KB, ${en(e.scripts, "script", "scripts")}`, `${fmtUk(kb(e.htmlBytes))} КБ, ${uk(e.scripts, "скрипт", "скрипти", "скриптів")}`],
  url_unreadable: () => ["Hard-to-read URL", "Незручна адреса"],
  jsonld_invalid: () => ["JSON-LD does not parse", "JSON-LD не розбирається"],
  structured_data_none: () => ["No structured data", "Немає структурованих даних"],
  schema_required_missing: () => ["Required schema fields missing", "Бракує обов’язкових полів схеми"],
  schema_recommended_missing: () => ["Recommended schema fields missing", "Бракує рекомендованих полів схеми"],
  faq_rich_result_retired: () => ["FAQ rich result retired", "Розширеного FAQ більше немає"],
  faq_schema_not_visible: (e) => [`FAQ markup ≠ visible text · ${e.notVisible}`, `Розмітка FAQ ≠ видимий текст · ${e.notVisible}`],
  lost_faq_questions: () => ["FAQ answers lost their questions", "Відповіді FAQ без запитань"],
  mid_sentence_start: (e) => {
    const n = e.count ?? e.samples?.length ?? 1;
    return n === 1 ? ["A passage starts mid-sentence", "Уривок із середини речення"] : [`${n} passages start mid-sentence`, `${uk(n, "уривок", "уривки", "уривків")} із середини речення`];
  },
  truncated_teaser: (e) => [en(e.count, "cut-off teaser", "cut-off teasers"), uk(e.count, "обрізаний анонс", "обрізані анонси", "обрізаних анонсів")],
  repeated_claim: () => ["The same claim, again and again", "Те саме твердження знову й знову"],
  cap_overflow: (e) => [`${fmtEn(e.charsPastCap)} characters past the cap`, `${uk(e.charsPastCap, "символ", "символи", "символів")} за лімітом`],
  js_dependent: (e) => [`${fmtEn(e.withJs - e.withoutJs)} words need JavaScript`, `${uk(e.withJs - e.withoutJs, "слово", "слова", "слів")} лише з JavaScript`],
  hero_lede_dropped: () => ["Opening paragraph unseen", "Вступ не видно"],
  hidden_headings: (e) => [`${en(e.count, "heading", "headings")} in hidden panels`, `${uk(e.count, "заголовок", "заголовки", "заголовків")} у прихованих панелях`],
  ssr_placeholder_text: () => ["Loading text read as content", "Напис завантаження як зміст"],
  h1_glued_words: () => ["Heading words glued", "Слова заголовка злиплися"],
  nav_in_content: () => ["Menu lines inside the text", "Рядки меню всередині тексту"],
  dominant_heading: (e) => [`One section holds ${Math.round((e.share || 0) * 100)}%`, `Один розділ тримає ${Math.round((e.share || 0) * 100)}%`],
  thin_section: (e) => {
    const n = e.count ?? 1;
    return [en(n, "very short section", "very short sections"), uk(n, "надто короткий розділ", "надто короткі розділи", "надто коротких розділів")];
  },
  hreflang_no_return: (e) => [`${list(e.langs)}: no link back`, `${list(e.langs)}: немає зворотного посилання`],
  hreflang_invalid_code: (e) => [`Invalid hreflang · ${list(e.codes)}`, `Хибний hreflang · ${list(e.codes)}`],
  hreflang_no_self: () => ["hreflang leaves this page out", "hreflang без цієї сторінки"],
  hreflang_alternate_broken: (e) => [`${list(e.langs)}: version answers wrong`, `${list(e.langs)}: версія відповідає з помилкою`],
  title_duplicate_locales: (e) => [`Same title in ${e.count} languages`, `Однаковий title у ${e.count} мовах`],
  description_duplicate_locales: (e) => [`Same description in ${e.count} languages`, `Однаковий опис у ${e.count} мовах`],
  hreflang_lang_mismatch: () => ["html lang ≠ hreflang", "html lang ≠ hreflang"],
  hreflang_no_x_default: () => ["No x-default", "Немає x-default"],
  llms_txt_one_language: () => ["llms.txt: one language only", "llms.txt: лише одна мова"],
  locale_facts_differ: (e) => {
    const d = e.items[0];
    const more = e.count > 1 ? ` +${e.count - 1}` : "";
    return [`${d.values[0]} or ${d.values[1]}? · ${d.hreflang}${more}`, `${d.values[0]} чи ${d.values[1]}? · ${d.hreflang}${more}`];
  },
  question_missing: (e) => [`No answer: ${q(e.question)}`, `Без відповіді: ${q(e.question)}`],
  question_partial: (e) => [`Answered in part: ${q(e.question)}`, `Частково: ${q(e.question)}`],
  stock_phrases: (e) => [`Stock phrases · ${dec(e.per1k, ".")} per 1,000 words`, `Шаблонні фрази · ${dec(e.per1k, ",")} на 1 000 слів`],
  repeated_sentence_shape: (e) => [en(e.count, "sentence of one shape", "sentences of one shape"), `${uk(e.count, "речення", "речення", "речень")} однієї форми`],
  uniform_openings: (e) => [e.count === 1 ? "A run of sentences opens alike" : `${e.count} runs of sentences open alike`, e.count === 1 ? "Речення поспіль починаються однаково" : `${uk(e.count, "низка речень", "низки речень", "низок речень")} з однаковим початком`],
  unchecked_claims: (e) => [en(e.count, "claim with nothing to check", "claims with nothing to check"), `${uk(e.count, "твердження", "твердження", "тверджень")} без фактів для перевірки`],
  keyword_not_in_title: () => ["Main phrase not in title or h1", "Головної фрази немає в title чи h1"],
  keyword_variant_split: () => ["Main phrase written two ways", "Головну фразу написано двома способами"],
  keyword_one_section: (e) => [`Main phrase in ${e.sectionsReached} of ${e.sections} sections`, `Головна фраза в ${e.sectionsReached} із ${e.sections} розділів`],
  off_keyword_share: (e) => [`${Math.round(e.offShare * 100)}% of the text off the phrase`, `${Math.round(e.offShare * 100)}% тексту без головної фрази`],
  promise_without_number: () => ["A promise with no figure", "Обіцянка без числа"],
  brand_contradiction: (e) => (e.count === 1 ? ["AI contradicts the page", "ШІ суперечить сторінці"] : [`AI contradicts the page · ${e.count}`, `ШІ суперечить сторінці · ${e.count}`]),
  brand_fact_absent: (e) => [`AI knows, the page lacks · ${e.count}`, `ШІ знає, на сторінці немає · ${e.count}`],
  brand_unknown: () => ["AI doesn't know the brand", "ШІ не знає бренду"],
  review_rating_unbacked: (e) => (e.count === 1 ? [`${e.items[0].platform} rating, no source`, `Рейтинг ${e.items[0].platform} без джерела`] : [`${e.count} ratings with no source`, `${uk(e.count, "рейтинг", "рейтинги", "рейтингів")} без джерела`]),
  review_control_hallucination: () => ["AI rated a platform that doesn't exist", "ШІ оцінив платформу, якої немає"],
  reviews_without_markup: () => ["Ratings shown without markup", "Оцінки без розмітки"],
  rich_result_retired: (e) => (e.items.length === 1 ? [`${e.items[0].feature}: no rich result any more`, `${e.items[0].feature}: розширеного результату більше немає`] : [`${e.items.length} retired rich results`, `${uk(e.items.length, "розширений результат", "розширені результати", "розширених результатів")} більше немає`]),
  image_dimensions_missing: (e) => [en(e.count, "image without width and height", "images without width and height"), `${uk(e.count, "зображення", "зображення", "зображень")} без width і height`],
  image_lcp_lazy: () => ["First image lazy-loaded", "Перше зображення з lazy"],
  image_not_lazy: (e) => [en(e.count, "image below the fold loads eagerly", "images below the fold load eagerly"), `${uk(e.count, "зображення", "зображення", "зображень")} нижче екрана без lazy`],
  image_legacy_format: (e) => [en(e.count, "image in JPEG or PNG only", "images in JPEG or PNG only"), `${uk(e.count, "зображення", "зображення", "зображень")} лише в JPEG чи PNG`],
  image_oversized: (e) => [en(e.count, "image over 200 KB", "images over 200 KB"), `${uk(e.count, "зображення", "зображення", "зображень")} понад 200 КБ`],
  image_no_srcset: (e) => [en(e.count, "large image without srcset", "large images without srcset"), `${uk(e.count, "велике зображення", "великі зображення", "великих зображень")} без srcset`],
  favicon_missing: () => ["Favicon does not load", "Favicon не завантажується"],
  site_name_missing: () => ["No WebSite name markup", "Немає назви сайту в розмітці"],
  mixed_content: (e) => [en(e.count, "http:// resource on an https page", "http:// resources on an https page"), `${uk(e.count, "ресурс", "ресурси", "ресурсів")} http:// на https-сторінці`],
  soft_404: () => ["A missing page answers 200", "Неіснуюча сторінка відповідає 200"],
  url_variants_inconsistent: (e) => [e.count === 1 ? "A URL variant ends elsewhere" : `${e.count} URL variants end elsewhere`, e.count === 1 ? "Варіант адреси веде деінде" : `${uk(e.count, "варіант адреси веде", "варіанти адреси ведуть", "варіантів адреси ведуть")} деінде`],
  hsts_missing: () => ["No HSTS header", "Немає заголовка HSTS"],
  author_missing: () => ["Article without an author", "Стаття без автора"],
  about_contact_missing: (e) => [`No ${e.missing.join(" or ")} link`, `Немає посилання ${e.missing.map((k) => (k === "about" ? "«Про нас»" : "«Контакти»")).join(" чи ")}`],
  organization_details_missing: (e) => (e.found ? [`Organization lacks ${e.missing.join(", ")}`, `В Organization бракує ${e.missing.join(", ")}`] : ["No Organization markup", "Немає розмітки Organization"]),
  article_date_missing: () => ["Article without a visible date", "Стаття без видимої дати"],
  privacy_terms_missing: (e) => [`No ${e.missing.join(" or ")} link`, `Немає посилання на ${e.missing.map((k) => (k === "privacy" ? "конфіденційність" : "умови")).join(" чи ")}`],
  date_mismatch: () => ["Markup date ≠ visible date", "Дата в розмітці ≠ видима дата"],
  snippet_blocked: () => ["Snippets blocked", "Сніпети заборонено"],
  markdown_alternate_broken: () => ["Markdown version does not load", "Markdown-версія не завантажується"],
  ai_catalog_invalid: () => ["ai-catalog.json does not parse", "ai-catalog.json не розбирається"],
  indexnow_key_broken: () => ["IndexNow key file missing", "Немає файлу ключа IndexNow"],
  spa_shell: (e) => [`Empty app shell · ${e.words} words without JavaScript`, `Порожня оболонка застосунку · ${uk(e.words, "слово", "слова", "слів")} без JavaScript`],
};

export const label = (f) => {
  const fn = LABELS[f.code];
  if (!fn) throw new Error(`no label for ${f.code}`);
  return fn(f.evidence || {});
};

export const SEV = {
  blocking: ["Blocking", "Блокувальна"],
  high: ["High", "Висока"],
  medium: ["Medium", "Середня"],
  low: ["Low", "Низька"],
};

export const OWNERS = { dev: ["Developer", "Розробник"], content: ["Content", "Контент"], seo: ["SEO", "SEO"] };

/** The six status tiles, as the approved Lite prototype draws them. Markup sits in "Shown well in search?"; the questions, the writing patterns and the keyword in "AI quotes it right?"; brand and reviews in their own tile. */
export const AREAS = [
  { id: "classic", q: ["Shown well in search?", "Добре видно в пошуку?"] },
  { id: "find", q: ["AI finds it?", "ШІ знаходить?"] },
  { id: "read", q: ["AI reads all of it?", "ШІ читає все?"] },
  { id: "quote", q: ["AI quotes it right?", "ШІ цитує правильно?"] },
  { id: "brand", q: ["AI gets the brand right?", "ШІ правильно описує бренд?"] },
  { id: "lang", q: ["Languages in order?", "Мови гаразд?"] },
];

/** The layer a finding comes from; a judgement carries the model that judged. */
export const LAYER = {
  measured: ["Measured", "Виміряно"],
  derived: ["Derived", "Обчислено"],
  judgement: ["Agent's judgement", "Судження агента"],
};

export const STATE = {
  ok: ["OK", "Гаразд"],
  prob: ["Problems", "Є проблеми"],
  block: ["Blocking", "Блокує"],
  na: ["One version", "Одна версія"],
  unchecked: ["Not checked", "Не перевірено"],
};

export const MARK = {
  pass: { i: "✓", t: ["Passed", "Пройдено"] },
  fail: { i: "✕", t: ["Problem", "Проблема"] },
  warn: { i: "!", t: ["Warning", "Увага"] },
  na: { i: "—", t: ["Not measured", "Не виміряно"] },
  none: { i: "∅", t: ["Not on this page", "Немає на сторінці"] },
};

export const ZONE_LABEL = {
  header: (z) => (z.hasNav ? ["Site header · navigation", "Шапка сайту · навігація"] : ["Site header", "Шапка сайту"]),
  nav: () => ["Navigation", "Навігація"],
  hero: (z) => (z.inHeader ? ["Hero · inside <header>", "Перший екран · у <header>"] : ["Hero", "Перший екран"]),
  intro: () => ["Top of the content", "Початок вмісту"],
  aside: () => ["Sidebar", "Бічна панель"],
  footer: () => ["Footer", "Підвал"],
  more: (z) => [`${z.merged} more sections`, `ще ${uk(z.merged, "розділ", "розділи", "розділів")}`],
  untitled: () => ["Untitled section", "Розділ без назви"],
};

export const UI = {
  eyebrow: ["AI search audit · Lite", "Аудит для ШІ-пошуку · Lite"],
  langGroup: ["Language", "Мова"],
  themeGroup: ["Theme", "Тема"],
  dark: ["Dark", "Темна"],
  light: ["Light", "Світла"],
  checked: [(d) => `checked ${d}`, (d) => `перевірено ${d}`],
  statusAria: ["Status by question", "Стан за запитаннями"],
  nothingFound: ["nothing found", "нічого не знайдено"],
  oneVersion: ["no hreflang", "без hreflang"],
  noBrandFiles: ["no brand.json or reviews.json", "без brand.json і reviews.json"],
  modelNotStated: ["model not stated", "модель не вказано"],
  oneModel: [
    (m) => `Brand, reviews and questions: one model's view (${m}), from its own knowledge, not ChatGPT, Gemini or Perplexity. The web Brandscope and Reviewscope ask three assistants.`,
    (m) => `Бренд, відгуки й запитання: погляд однієї моделі (${m}), з її власних знань, а не ChatGPT, Gemini чи Perplexity. Вебверсії Brandscope і Reviewscope питають трьох асистентів.`,
  ],
  pageMap: ["Page map", "Мапа сторінки"],
  marked: [(n) => `${en(n, "problem", "problems")} marked`, (n) => `позначено ${uk(n, "проблему", "проблеми", "проблем")}`],
  mapAria: ["Map of the audited page, top to bottom, with numbered problem markers", "Мапа перевіреної сторінки згори донизу з пронумерованими маркерами проблем"],
  notSeen: ["AI does not see this", "ШІ цього не бачить"],
  partSeen: [(p) => `${p}% unseen by AI`, (p) => `${p}% ШІ не бачить`],
  onlyJs: ["Only with JavaScript", "Лише з JavaScript"],
  panelsHidden: [(n, c) => `${en(n, "panel", "panels")} hidden · ${fmtEn(c)} characters`, (n, c) => `${uk(n, "панель", "панелі", "панелей")} приховано · ${uk(c, "символ", "символи", "символів")}`],
  unmapped: [(n) => `+${n} not tied to one spot`, (n) => `+${n} не прив’язані до місця`],
  otherProblems: ["Other problems", "Інші проблеми"],
  more: [(n) => `+${n}`, (n) => `+${n}`],
  biggest: ["Biggest problems", "Найбільші проблеми"],
  noProblems: ["No problems found", "Проблем не знайдено"],
  severity: ["Severity", "Серйозність"],
  problemsUnit: ["problems", "проблеми"],
  text: ["Where the text goes", "Куди дівається текст"],
  charsUnit: ["characters", "символи"],
  wf: [["Raw HTML", "Сирий HTML"], ["Removed", "Видалено"], ["Kept", "Збережено"], ["In passages", "В уривках"], ["Not in passages", "Не в уривках"], ["Past the cap", "За лімітом"]],
  passagesLine: [(n, cap) => `${n} of ${cap} passages`, (n, cap) => `${n} із ${cap} уривків`],
  bots: ["Bots in robots.txt", "Боти в robots.txt"],
  path: [(p) => `path ${p}`, (p) => `шлях ${p}`],
  allowed: ["allowed", "дозволено"],
  blocked: ["blocked", "заборонено"],
  robotsNone: ["no robots.txt: all allowed", "robots.txt немає: усе дозволено"],
  robotsUnreachable: ["robots.txt does not answer: assume all blocked", "robots.txt не відповідає: вважається, що все заборонено"],
  robotsNotChecked: ["robots.txt not measured", "robots.txt не виміряно"],
  llmsNote: [
    "Google documents no use of llms.txt: “You don't need to create new machine readable files, AI text files, or markup to appear in these features.”",
    "Google не документує використання llms.txt: «You don't need to create new machine readable files, AI text files, or markup to appear in these features.»",
  ],
  llmsNoteSource: ["Google Search Central: AI features and your website", "Google Search Central: AI features and your website", "https://developers.google.com/search/docs/appearance/ai-features"],
  kind: { search: ["search", "пошук"], user: ["a user's question", "запит користувача"], training: ["training", "навчання"], index: ["web index", "вебіндекс"] },
  classic: ["Google and Bing checks", "Перевірки Google і Bing"],
  checksUnit: [(n) => `${n} checks`, (n) => `${uk(n, "перевірка", "перевірки", "перевірок")}`],
  sum: {
    pass: [(n) => `${n} passed`, (n) => `${uk(n, "пройдена", "пройдені", "пройдених")}`],
    fail: [(n) => en(n, "problem", "problems"), (n) => uk(n, "проблема", "проблеми", "проблем")],
    warn: [(n) => en(n, "warning", "warnings"), (n) => uk(n, "попередження", "попередження", "попереджень")],
    na: [(n) => `${n} not measured`, (n) => `${fmtUk(n)} не ${ukForm(n, "виміряна", "виміряні", "виміряних")}`],
    none: [(n) => `${n} not on this page`, (n) => `${fmtUk(n)} немає на сторінці`],
  },
  langs: ["Language versions", "Мовні версії"],
  versionsUnit: [(n) => en(n, "version", "versions"), (n) => uk(n, "версія", "версії", "версій")],
  langCols: [["Title", "Title"], ["Description", "Опис"], ["hreflang", "hreflang"], ["Same facts", "Ті самі факти"]],
  langCol: ["Lang", "Мова"],
  langOne: ["One language version: the page declares no hreflang.", "Одна мовна версія: сторінка не оголошує hreflang."],
  langUnread: [(n, cap) => `+${n} not read (cap ${cap})`, (n, cap) => `+${n} не прочитано (ліміт ${cap})`],
  langRefused: ["not analysed", "не аналізується"],
  thisPage: ["this page", "ця сторінка"],
  xDefault: ["x-default", "x-default"],
  cannot: ["What this check cannot see", "Чого ця перевірка не бачить"],
  full: ["Full report with explanations →", "Повний звіт із поясненнями →"],
  caps: ["Not checked", "Не перевірено"],
  footer: [
    "Made with the ai-search-audit skill (Lite) by GetLoopLoop: the scripts fetched the page, its robots.txt, sitemap, llms.txt and language versions, and up to 30 of its links, and sent nothing anywhere; the judgement parts are the agent's model.",
    "Зроблено навичкою ai-search-audit (Lite) від GetLoopLoop: скрипти завантажили сторінку, її robots.txt, sitemap, llms.txt і мовні версії та до 30 її посилань і нікуди нічого не надсилали; частини із судженнями — це модель агента.",
  ],
  footerRefused: [
    "Made with the ai-search-audit skill (Lite) by GetLoopLoop: the scripts fetched the page once and kept nothing of it.",
    "Зроблено навичкою ai-search-audit (Lite) від GetLoopLoop: скрипти один раз завантажили сторінку й нічого з неї не зберегли.",
  ],
  author: ["the author", "автор"],
  refusedEyebrow: ["AI search audit · Lite", "Аудит для ШІ-пошуку · Lite"],
};

/** "What this check cannot see": one line each, with where to get it. Brand, reviews and questions are in Lite as one model's view; several assistants are the web tools. */
export const CANNOT = [
  { t: ["Descriptions of each problem and directions to fix it", "Опис кожної проблеми й напрям виправлення"], links: [["Full version from GetLoopLoop", "Повна версія від GetLoopLoop", "https://www.getlooploop.com"]] },
  { t: ["What real assistants (ChatGPT, Gemini, Perplexity) say about your brand and reviews", "Що справжні асистенти (ChatGPT, Gemini, Perplexity) кажуть про ваш бренд і відгуки"], links: [["Brandscope", "Brandscope", "https://www.getlooploop.com/brandscope"], ["Reviewscope", "Reviewscope", "https://www.getlooploop.com/reviewscope"]] },
  { t: ["How their answers change from day to day", "Як їхні відповіді змінюються з дня на день"], links: [["AI answer volatility", "Мінливість відповідей ШІ", "https://www.getlooploop.com/ai-volatility"]] },
  { t: ["How AI groups your text by meaning (embeddings)", "Як ШІ групує ваш текст за змістом (ембединги)"], links: [["Vectorscope", "Vectorscope", "https://www.getlooploop.com/vectorscope"]] },
  { t: ["Search Console data, real-user speed, sites over 50 pages, tracking over time", "Дані Search Console, швидкість у реальних користувачів, сайти понад 50 сторінок, відстеження в часі"], links: [["GetLoopLoop", "GetLoopLoop", "https://www.getlooploop.com"]] },
];

/** The verdict line at the top. */
export function verdict(findings) {
  const blocking = findings.filter((f) => f.severity === "blocking").length;
  const hides = findings.filter((f) => f.hides).length;
  if (blocking) return [blocking === 1 ? "1 problem blocks search or AI" : `${blocking} problems block search or AI`, `${uk(blocking, "проблема блокує", "проблеми блокують", "проблем блокують")} пошук або ШІ`];
  if (hides) return [hides === 1 ? "1 problem hides text from AI" : `${hides} problems hide text from AI`, `${uk(hides, "проблема ховає", "проблеми ховають", "проблем ховають")} текст від ШІ`];
  if (findings.some((f) => f.severity !== "low")) return ["Nothing hides text from AI", "Ніщо не ховає текст від ШІ"];
  return findings.length ? ["Only minor notes", "Лише дрібні зауваження"] : ["No problems found", "Проблем не знайдено"];
}

export const nProblems = (n) => [en(n, "problem", "problems"), uk(n, "проблема", "проблеми", "проблем")];
export const nMinor = (n) => [n === 1 ? "1 minor note" : `${n} minor notes`, uk(n, "дрібне зауваження", "дрібні зауваження", "дрібних зауважень")];

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_UK = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
/** A date in both languages, in the local time of the machine that ran the audit. */
export function dateOf(iso) {
  const d = new Date(iso);
  return [`${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`, `${d.getDate()} ${MONTHS_UK[d.getMonth()]} ${d.getFullYear()}`];
}
