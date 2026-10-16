// Interface copy for the HTML report, in English (the default) and Ukrainian. Page content is
// never translated; only the report's own words are. Every entry is { en, uk }, each a string
// or a function of the values it needs. Values passed in are already HTML-safe.

import { REFUSAL_COPY } from "./refusal.mjs";

export const LANGS = ["en", "uk"];

const fmtN = (n) => Number(n).toLocaleString("en-US");
const fmtUk = (n) => Number(n).toLocaleString("en-US").replace(/,/g, " ");

/** English plural: "1 passage", "2 passages". */
const en = (n, one, many) => `${fmtN(n)} ${n === 1 ? one : many}`;
/** Ukrainian plural: 1 уривок, 2–4 уривки, 5+ уривків (11–14 take the many form). */
export function ukForm(n, one, few, many) {
  const abs = Math.abs(Number(n));
  const d10 = abs % 10;
  const d100 = abs % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}
const uk = (n, one, few, many) => `${fmtUk(n)} ${ukForm(n, one, few, many)}`;
const pct = (x) => `${Math.round(x * 1000) / 10}%`;

export const S = {
  // ── chrome
  eyebrow: { en: "Vectorscope · local reading", uk: "Vectorscope · локальне читання" },
  eyebrowCompare: { en: "Vectorscope · comparison", uk: "Vectorscope · порівняння" },
  themeGroup: { en: "Theme", uk: "Тема" },
  dark: { en: "Dark", uk: "Темна" },
  light: { en: "Light", uk: "Світла" },
  langGroup: { en: "Language", uk: "Мова" },
  askedFor: { en: (v) => `Asked for ${v.url}, redirected here.`, uk: (v) => `Запитано ${v.url}, переспрямовано сюди.` },
  words: { en: (v) => `<b>${fmtN(v.n)}</b> words`, uk: (v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "слово", "слова", "слів")}` },
  headingsFound: { en: (v) => `<b>${fmtN(v.n)}</b> headings found`, uk: (v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "заголовок", "заголовки", "заголовків")}` },
  noindexYes: { en: "<b>noindex</b>: the page asks search engines not to index it", uk: "<b>noindex</b>: сторінка просить пошуковики її не індексувати" },
  noindexNo: { en: "noindex <b>no</b>", uk: "noindex <b>ні</b>" },

  // ── how to read this report: three different claims, kept apart
  infoAria: { en: "How to read this report", uk: "Як читати цей звіт" },
  infoSameTitle: { en: "Same for everyone", uk: "Однаково для всіх" },
  infoSameBody: {
    en: (v) => `The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the ${v.cap}-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.`,
    uk: (v) => `Завантаження, видобування тексту, нарізання (за заголовками h2, далі вікнами по 2 000 символів), ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, robots.txt і автоматичні перевірки виконують скрипти: результат однаковий, хоч би яка модель запускала навичку.`,
  },
  infoJudgeTitle: { en: "Your model's judgement", uk: "Судження вашої моделі" },
  infoJudgeBody: {
    en: (v) => `The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (${v.by}). Another model may group a little differently. For the embedding-based reading with the map, run the page at ${v.link}.`,
    uk: (v) => `Групи, їхні назви, план переписування, тест запитів і факти — це прочитання моделі, яка запустила цю навичку (${v.by}). Інша модель може згрупувати трохи інакше. Читання на ембедингах із картою — на ${v.link}.`,
  },
  // agent and model arrive HTML-safe; either may be null, and then it is said, never guessed.
  infoBy: {
    en: (v) => [v.model ? `model: <b>${v.model}</b>` : "model not stated by the agent", v.agent ? `agent: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "),
    uk: (v) => [v.model ? `модель: <b>${v.model}</b>` : "агент не вказав модель", v.agent ? `агент: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "),
  },
  infoByPage: { en: (v) => `page ${v.n}: ${v.by}`, uk: (v) => `сторінка ${v.n}: ${v.by}` },
  infoNotTitle: { en: "Not any assistant's pipeline", uk: "Не конвеєр жодного асистента" },
  infoNotBody: {
    en: (v) => `ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the ${v.cap}-passage cap is this tool's.`,
    uk: (v) => `ChatGPT, Gemini, Perplexity, Copilot та інші мають власні краулери, власне нарізання й ембединги і не публікують їх. Принцип той самий (завантаження → текст → уривки → пошук), деталі різняться. Це читання — робоча модель типового ретривера, а не копія котрогось із них; ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")} — правило цього інструмента.`,
  },

  // ── the refusal (its copy lives in refusal.mjs)
  refusalTitle: REFUSAL_COPY.title,
  refusedTag: { en: "not analysed", uk: "не проаналізовано" },

  // ── blocked banner
  bannerTitle: { en: "AI crawlers are blocked from this page", uk: "ШІ-краулерам закрито доступ до цієї сторінки" },
  bannerBody: {
    en: (v) => `robots.txt disallows this path for ${v.bots}. Those assistants cannot fetch the page for search or for a user's question, so everything below is moot for them until the rule changes.`,
    uk: (v) => `robots.txt забороняє цей шлях для ${v.bots}. Ці асистенти не можуть завантажити сторінку ні для пошуку, ні на запит користувача, тож усе нижче для них не має значення, доки правило не зміниться.`,
  },
  bannerUnreachable: {
    en: "robots.txt could not be read (a server error or no answer). RFC 9309 tells a crawler to assume it may fetch nothing in that case, so compliant AI crawlers treat the whole site as blocked until robots.txt answers.",
    uk: "robots.txt не вдалося прочитати (помилка сервера або немає відповіді). За RFC 9309 краулер у такому разі вважає, що не може завантажувати нічого, тож сумлінні ШІ-краулери вважають увесь сайт закритим, доки robots.txt не відповість.",
  },

  // ── result
  result: { en: "Result", uk: "Результат" },
  whatMachineReads: { en: "what the machine reads", uk: "що читає машина" },
  fetched: { en: "Fetched", uk: "Завантажено" },
  extracted: { en: "Extracted", uk: "Видобуто" },
  chunked: { en: "Chunked", uk: "Нарізано" },
  grouped: { en: "Grouped", uk: "Згруповано" },
  nWords: { en: (v) => en(v.n, "word", "words"), uk: (v) => uk(v.n, "слово", "слова", "слів") },
  nPassages: { en: (v) => en(v.n, "passage", "passages"), uk: (v) => uk(v.n, "уривок", "уривки", "уривків") },
  nGroups: { en: (v) => en(v.n, "group", "groups"), uk: (v) => uk(v.n, "група", "групи", "груп") },
  pipelineNote: {
    en: (v) => `${fmtN(v.headings)} headings · ${fmtN(v.chars)} characters indexed · ${en(v.repeats, "repeat", "repeats")} · grouped by reading, no embedding step`,
    uk: (v) => `${uk(v.headings, "заголовок", "заголовки", "заголовків")} · ${uk(v.chars, "символ", "символи", "символів")} в індексі · ${uk(v.repeats, "повтор", "повтори", "повторів")} · групування читанням, без ембедингів`,
  },
  passagesRead: { en: "passages read", uk: "уривків прочитано" },
  slotsUsed: { en: (v) => `slots used of the ${v.cap}-passage cap${v.full ? ": every slot filled" : ""}`, uk: (v) => `місць зайнято з ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}${v.full ? ": усі місця зайняті" : ""}` },
  pastCap: { en: "characters past the cap (0 when the page fits)", uk: "символів за лімітом (0, коли сторінка вміщується)" },
  pastCapLegacy: { en: "characters past the cap (2.101 estimate: this reading has no loss measurement)", uk: "символів за лімітом (оцінка 2.101: у цьому читанні немає вимірювання втрат)" },
  uniqueInPassages: { en: "characters of unique text in passages", uk: "символів унікального тексту в уривках" },
  totalInPassages: { en: "characters in passages, overlap and intro included", uk: "символів в уривках, з перекриттям і вступом" },

  // ── 2.102: the three layers, the "?" beside each number
  infoLayersTitle: { en: "Three kinds of number", uk: "Три види чисел" },
  infoLayersBody: {
    en: (v) => `Every section and every number carries a tag. ${v.measured} is what the parser saw. ${v.derived} is computed from those by a fixed formula. ${v.judgement} is the reading of the agent that ran the skill. The ${v.help} beside a number opens its formula, unit, threshold and limits.`,
    uk: (v) => `Кожен розділ і кожне число мають позначку. ${v.measured} — те, що побачив парсер. ${v.derived} — обчислено з цього за сталою формулою. ${v.judgement} — прочитання агента, що запустив навичку. ${v.help} біля числа відкриває його формулу, одиницю, поріг і обмеження.`,
  },
  helpAria: { en: "How this number is computed", uk: "Як обчислено це число" },
  helpFormula: { en: "Formula", uk: "Формула" },
  helpUnit: { en: "Unit", uk: "Одиниця" },
  helpThreshold: { en: "Threshold", uk: "Поріг" },
  helpLimits: { en: "Known limits", uk: "Обмеження" },
  kOverlap: { en: "overlap", uk: "перекриття" },
  kIntro: { en: "intro", uk: "вступ" },
  helpColumns: { en: "How these numbers are computed:", uk: "Як обчислено ці числа:" },

  // ── 2.102: where the text goes
  lossesTitle: { en: "Where the text goes", uk: "Куди дівається текст" },
  lossesSub: { en: "every stage from the raw HTML to the passages, in characters", uk: "кожен етап від сирого HTML до уривків, у символах" },
  // 2.103: the panel is folded at the end of the report; its summary line says what is inside.
  lossesFold: { en: "what the cleaner removed and what reached the passages", uk: "що прибрав очищувач і що дійшло до уривків" },
  lossTableFold: { en: "what the cleaner removed and what reached the passages, page by page", uk: "що прибрав очищувач і що дійшло до уривків, сторінка за сторінкою" },
  foldPastCap: {
    en: (v) => en(v.n, "character past the cap", "characters past the cap"),
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} за лімітом`,
  },
  foldPastCapAll: {
    en: (v) => `${en(v.n, "character", "characters")} past the cap across the pages`,
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} за лімітом на всіх сторінках`,
  },
  wfRaw: { en: "Text in the raw HTML (estimate)", uk: "Текст у сирому HTML (оцінка)" },
  wfRemoved: { en: "Removed by the cleaner", uk: "Видалено очищувачем" },
  wfKept: { en: "Kept: the chunker's input", uk: "Збережено: вхід нарізувача" },
  wfUnique: { en: "In passages, unique", uk: "В уривках, унікально" },
  wfNotIn: { en: "Kept, in no passage text", uk: "Збережено, але не в тексті уривків" },
  wfPastCap: { en: "Past the cap", uk: "За лімітом" },
  wfAria: {
    en: (v) => `Character waterfall: ${v.raw} in the raw HTML, ${v.removed} removed, ${v.kept} kept, ${v.unique} in passages, ${v.notIn} in no passage text, ${v.pastCap} past the cap.`,
    uk: (v) => `Каскад символів: у сирому HTML ${v.raw}, видалено ${v.removed}, збережено ${v.kept}, в уривках ${v.unique}, поза текстом уривків ${v.notIn}, за лімітом ${v.pastCap}.`,
  },
  wfOfRaw: { en: (v) => `${v.p} of the raw text`, uk: (v) => `${v.p} сирого тексту` },
  wfOfKept: { en: (v) => `${v.p} of the kept text`, uk: (v) => `${v.p} збереженого тексту` },
  wfNote: {
    en: (v) => `The passages hold ${fmtN(v.total)} characters in all: ${fmtN(v.unique)} unique, plus ${fmtN(v.overlap)} of overlap between neighbours and ${fmtN(v.intro)} of intro (title, h1, description) in passage #0. Of the kept text in no passage: ${fmtN(v.headings)} in h2 heading lines, ${fmtN(v.spaces)} spaces between sections${v.other ? `, ${fmtN(v.other)} other` : ""}.`,
    uk: (v) => `Загалом в уривках ${uk(v.total, "символ", "символи", "символів")}: ${fmtUk(v.unique)} унікальних, плюс ${fmtUk(v.overlap)} перекриття між сусідами і ${fmtUk(v.intro)} вступу (title, h1, опис) в уривку #0. Зі збереженого тексту поза уривками: ${fmtUk(v.headings)} — рядки заголовків h2, ${fmtUk(v.spaces)} — пробіли між розділами${v.other ? `, ${fmtUk(v.other)} — інше` : ""}.`,
  },
  wfUnlocated: {
    en: (v) => `${fmtN(v.n)} characters of passage text could not be placed in the kept text; they are left out of the unique count rather than guessed.`,
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} тексту уривків не вдалося знайти в збереженому тексті; їх не враховано в унікальному числі, а не вгадано.`,
  },
  wfInconsistent: {
    en: "The observed extraction did not match the one the chunker used, so these numbers may not describe this reading. Please report it.",
    uk: "Спостережене видобування не збіглося з тим, яке використав нарізувач, тож ці числа можуть не описувати це читання. Повідомте про це, будь ласка.",
  },
  noLosses: {
    en: "This reading has no loss measurement: it was read with 2.101 or earlier. Read the page again with this version to see where its text goes.",
    uk: "У цьому читанні немає вимірювання втрат: його зроблено версією 2.101 або старшою. Прочитайте сторінку знову цією версією, щоб побачити, куди дівається текст.",
  },
  removalsTitle: { en: "What the cleaner removed", uk: "Що видалив очищувач" },
  removalsSub: {
    en: (v) => `${en(v.n, "element", "elements")} with text, ${fmtN(v.chars)} characters, largest first`,
    uk: (v) => `${uk(v.n, "елемент", "елементи", "елементів")} з текстом, ${uk(v.chars, "символ", "символи", "символів")}, від найбільшого`,
  },
  removalsEmpty: {
    en: (v) => `${en(v.n, "more matched element", "more matched elements")} held no text.`,
    uk: (v) => `Ще ${uk(v.n, "елемент", "елементи", "елементів")} без тексту.`,
  },
  removalsMore: {
    en: (v) => `${en(v.n, "more element", "more elements")}, ${en(v.chars, "character", "characters")}, not listed here (all in export.json up to 200; the rest summed there).`,
    uk: (v) => `Ще ${uk(v.n, "елемент", "елементи", "елементів")}, ${uk(v.chars, "символ", "символи", "символів")}, тут не показано (у export.json — до 200, решту там підсумовано).`,
  },
  removalsNone: { en: "The cleaner removed no text from this page.", uk: "Очищувач не видалив з цієї сторінки жодного тексту." },
  removalsByReason: { en: "By reason", uk: "За причиною" },
  colReason: { en: "Reason", uk: "Причина" },
  colElement: { en: "Element", uk: "Елемент" },
  colChars: { en: "Chars", uk: "Символи" },
  colSample: { en: "Its text begins", uk: "Його текст починається" },
  colElements: { en: "Elements", uk: "Елементи" },
  rs_script_style: { en: "script, style, noscript, template", uk: "script, style, noscript, template" },
  rs_embedded: { en: "svg, canvas, iframe, embed", uk: "svg, canvas, iframe, embed" },
  rs_head_meta: { en: "head (title, meta)", uk: "head (title, meta)" },
  rs_hidden: { en: "[hidden] or aria-hidden", uk: "[hidden] або aria-hidden" },
  rs_header_chrome: { en: "page header (site banner)", uk: "шапка сторінки (банер сайту)" },
  rs_banner_role: { en: "role=banner", uk: "role=banner" },
  rs_header_controls: { en: "controls inside a kept header", uk: "елементи керування в збереженій шапці" },
  rs_nav: { en: "navigation (nav, role=navigation)", uk: "навігація (nav, role=navigation)" },
  rs_footer: { en: "footer", uk: "футер" },
  rs_aside: { en: "aside, role=complementary", uk: "aside, role=complementary" },
  rs_contentinfo_role: { en: "role=contentinfo", uk: "role=contentinfo" },
  rs_form_control: { en: "form, button, select, input", uk: "form, button, select, input" },
  rs_overlay_class: { en: "cookie, newsletter, popup or modal class", uk: "клас cookie, newsletter, popup чи modal" },
  rs_outside_main: { en: "outside the chosen main region", uk: "поза обраною основною областю" },
  sectionsTitle: { en: "How much of each section reached a passage", uk: "Скільки з кожного розділу дійшло до уривків" },
  sectionsSub: { en: "the chunker's own sections, in page order", uk: "розділи самого нарізувача, у порядку сторінки" },
  secIntro: { en: "Intro: title, h1, description", uk: "Вступ: title, h1, опис" },
  secBefore: { en: "Before the first h2", uk: "До першого h2" },
  secBody: { en: "The body (not split at h2)", uk: "Основний текст (без поділу за h2)" },
  secUnlocated: { en: "not located", uk: "не знайдено" },
  secReached: { en: (v) => `${fmtN(v.n)} of ${fmtN(v.of)}`, uk: (v) => `${fmtUk(v.n)} з ${fmtUk(v.of)}` },
  secCutSummary: {
    en: (v) => `${en(v.n, "section", "sections")} lost text; ${en(v.zero, "section", "sections")} reached no passage at all.`,
    uk: (v) => `Утратили текст: ${uk(v.n, "розділ", "розділи", "розділів")}; зовсім не дійшли до уривків: ${uk(v.zero, "розділ", "розділи", "розділів")}.`,
  },
  secAllIn: { en: "Every section reached a passage in full.", uk: "Кожен розділ повністю дійшов до уривків." },
  lossTable: { en: "Losses by page", uk: "Втрати за сторінками" },
  lossTableSub: { en: "the same waterfall for every page, in characters", uk: "той самий каскад для кожної сторінки, у символах" },
  colRaw: { en: "Raw (est.)", uk: "Сирий (оцінка)" },
  colRemoved: { en: "Removed", uk: "Видалено" },
  colKept: { en: "Kept", uk: "Збережено" },
  colUnique: { en: "In passages", uk: "В уривках" },
  colSectionsCut: { en: "Sections cut", uk: "Урізані розділи" },
  wfDiff: { en: "Waterfall, baseline → now", uk: "Каскад: було → зараз" },
  wfDiffNone: { en: "The baseline reading has no loss measurement (2.101 or earlier), so only this reading's waterfall is shown above.", uk: "Базове читання не має вимірювання втрат (2.101 або старше), тому вище показано лише каскад цього читання." },
  colChange: { en: "Change", uk: "Зміна" },

  // ── strip
  strip: { en: "The reading strip", uk: "Смуга читання" },
  stripSub: { en: (v) => `one cell per passage, in reading order, inside the ${v.cap}-slot cap`, uk: (v) => `одна клітинка на уривок, у порядку читання, у межах ліміту в ${v.cap} місць` },
  stripAria: { en: (v) => `Passages inside the ${v.cap}-passage cap`, uk: (v) => `Уривки в межах ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}` },
  pastCapShort: { en: "characters past the cap", uk: "символів за лімітом" },
  notRead: { en: "not read", uk: "не прочитано" },
  cap: { en: "cap", uk: "ліміт" },
  readoutIdle: {
    en: "Hover or focus a cell to see its passage, heading and group. Striped cells are side-path content. Select a cell to jump to the passage.",
    uk: "Наведіть курсор або перейдіть на клітинку, щоб побачити її уривок, заголовок і групу. Смугасті клітинки — побічний вміст. Натисніть клітинку, щоб перейти до уривка.",
  },
  noHeading: { en: "no heading", uk: "без заголовка" },
  group: { en: "group", uk: "група" },
  chars: { en: "chars", uk: "симв." },
  cellTip: {
    en: (v) => `<b>#${v.i}</b> · ${v.heading} · group ${v.g}: <b>${v.label}</b> · ${fmtN(v.chars)} chars${v.role}`,
    uk: (v) => `<b>#${v.i}</b> · ${v.heading} · група ${v.g}: <b>${v.label}</b> · ${fmtUk(v.chars)} симв.${v.role}`,
  },
  cellAria: {
    en: (v) => `Passage ${v.i}, ${v.heading}, group ${v.g}: ${v.label}, ${v.chars} characters${v.role}`,
    uk: (v) => `Уривок ${v.i}, ${v.heading}, група ${v.g}: ${v.label}, ${v.chars} символів${v.role}`,
  },
  roleMain: { en: "main", uk: "основний" },
  roleRelated: { en: "related", uk: "пов’язане" },
  roleUtility: { en: "utility", uk: "службове" },

  // ── checks
  checks: { en: "Checks", uk: "Перевірки" },
  checksSub: { en: "automatic, ranked by severity; each names the passages it rests on", uk: "автоматичні, за важливістю; кожна називає уривки, на яких ґрунтується" },
  aiCrawlers: { en: "AI crawlers and robots.txt", uk: "ШІ-краулери і robots.txt" },
  robotsFor: { en: (v) => `rules for the path ${v.path}`, uk: (v) => `правила для шляху ${v.path}` },
  colCrawler: { en: "Crawler", uk: "Краулер" },
  colVendor: { en: "Vendor", uk: "Компанія" },
  colPurpose: { en: "What it does", uk: "Що робить" },
  colVerdict: { en: "This page", uk: "Ця сторінка" },
  colRule: { en: "Deciding rule", uk: "Вирішальне правило" },
  allowed: { en: "allowed", uk: "дозволено" },
  blocked: { en: "blocked", uk: "заблоковано" },
  noRule: { en: "no rule matches", uk: "жодне правило не підходить" },
  groupStar: { en: "via *", uk: "через *" },
  kindSearch: { en: "search index for the assistant", uk: "пошуковий індекс асистента" },
  kindUser: { en: "fetches when a user asks", uk: "завантажує на запит користувача" },
  kindTraining: { en: "collects training data", uk: "збирає дані для навчання" },
  kindIndex: { en: "web search index assistants answer from", uk: "вебіндекс, з якого відповідають асистенти" },
  mayIgnore: { en: "the vendor says robots.txt may not apply to it", uk: "компанія зазначає, що robots.txt може на нього не діяти" },
  robotsNone: { en: (v) => `No robots.txt (HTTP ${v.status}): nothing is disallowed.`, uk: (v) => `robots.txt немає (HTTP ${v.status}): нічого не заборонено.` },
  robotsNotChecked: { en: "robots.txt was not checked in this run (a saved page, or --no-robots).", uk: "robots.txt у цьому запуску не перевірявся (збережена сторінка або --no-robots)." },
  robotsSource: { en: (v) => `Read from ${v.url}. Groups matched by product token, case-insensitively; longest matching rule wins, Allow wins a tie (RFC 9309).`, uk: (v) => `Прочитано з ${v.url}. Групи зіставлено за токеном продукту без огляду на регістр; перемагає найдовше правило, за рівної довжини — Allow (RFC 9309).` },
  technical: { en: "Technical markup", uk: "Технічна розмітка" },
  jsonLd: { en: "Structured data (JSON-LD)", uk: "Структуровані дані (JSON-LD)" },
  jsonLdNone: { en: "none", uk: "немає" },
  jsonLdInvalid: { en: (v) => `${v.n} block(s) not valid JSON`, uk: (v) => `блоків з невалідним JSON: ${v.n}` },
  canonical: { en: "Canonical", uk: "Canonical" },
  canonicalMissing: { en: "missing", uk: "немає" },
  canonicalSelf: { en: "points to this page", uk: "вказує на цю сторінку" },
  canonicalOther: { en: "points to another URL", uk: "вказує на іншу адресу" },
  canonicalRelative: { en: "relative", uk: "відносна адреса" },
  metaDescription: { en: "Meta description", uk: "Meta description" },
  metaChars: { en: (v) => `${v.n} characters`, uk: (v) => `${v.n} ${ukForm(v.n, "символ", "символи", "символів")}` },
  metaNone: { en: "missing", uk: "немає" },
  render: { en: "With JavaScript", uk: "З JavaScript" },
  renderDone: {
    en: (v) => `${fmtN(v.js)} words and ${v.jsp} passages with JavaScript, against ${fmtN(v.plain)} words and ${v.plainp} passages from the plain fetch. The reading above is the plain fetch.`,
    uk: (v) => `${uk(v.js, "слово", "слова", "слів")} і ${uk(v.jsp, "уривок", "уривки", "уривків")} з JavaScript проти ${uk(v.plain, "слова", "слів", "слів")} і ${uk(v.plainp, "уривка", "уривків", "уривків")} у звичайному завантаженні. Читання вище — звичайне завантаження.`,
  },
  renderNoBrowser: { en: "Not rendered: no local Chrome or Chromium was found (set CHROME_PATH).", uk: "Не відрендерено: локальний Chrome чи Chromium не знайдено (задайте CHROME_PATH)." },
  renderFailed: { en: (v) => `Not rendered: the browser run failed (${v.reason}).`, uk: (v) => `Не відрендерено: запуск браузера не вдався (${v.reason}).` },
  findings: { en: "Findings", uk: "Знахідки" },
  noFindings: { en: "No automatic check found anything on this page.", uk: "Автоматичні перевірки нічого не знайшли на цій сторінці." },
  sevHigh: { en: "high", uk: "високий" },
  sevMedium: { en: "medium", uk: "середній" },
  sevLow: { en: "low", uk: "низький" },
  sevInfo: { en: "info", uk: "довідка" },
  passagesLabel: { en: "Passages", uk: "Уривки" },
  whatToDo: { en: "What to do", uk: "Що зробити" },

  // ── plan
  plan: { en: "Rewrite plan", uk: "План переписування" },
  planSub: { en: "the agent's judgement, in priority order; every passage must stand on its own, because a retriever sees it alone", uk: "судження агента, за пріоритетом; кожен уривок має бути самодостатнім, бо ретривер бачить його окремо" },
  problem: { en: "Problem", uk: "Проблема" },
  fix: { en: "Fix", uk: "Виправлення" },
  before: { en: "Before", uk: "Було" },
  after: { en: "After", uk: "Стало" },
  page: { en: "page", uk: "сторінка" },
  pageN: { en: (v) => `Page ${v.n}`, uk: (v) => `Сторінка ${v.n}` },

  // ── queries
  queries: { en: "Query test", uk: "Тест запитів" },
  queriesSub: { en: "the agent's judgement: for each typical query, the best passage and whether it answers on its own", uk: "судження агента: для кожного типового запиту — найкращий уривок і чи відповідає він сам по собі" },
  colQuery: { en: "Query", uk: "Запит" },
  colBest: { en: "Best passage", uk: "Найкращий уривок" },
  colAnswer: { en: "Answer", uk: "Відповідь" },
  colCitable: { en: "Citable", uk: "Цитовне" },
  colQuote: { en: "The words that answer", uk: "Слова, що відповідають" },
  srcUser: { en: "your query", uk: "ваш запит" },
  srcGenerated: { en: "written by the agent", uk: "запит від агента" },
  vComplete: { en: "complete", uk: "повна" },
  vPartial: { en: "partial", uk: "часткова" },
  vMissing: { en: "missing", uk: "немає" },
  yes: { en: "yes", uk: "так" },
  no: { en: "no", uk: "ні" },
  querySummary: {
    en: (v) => `${v.complete} of ${v.total} queries answered completely, ${v.partial} partly, ${v.missing} not at all; ${v.citable} with a citable passage.`,
    uk: (v) => `Повна відповідь: ${v.complete} з ${v.total}, часткова: ${v.partial}, немає: ${v.missing}; придатний до цитування уривок: ${v.citable}.`,
  },
  winners: { en: "Who wins each query", uk: "Хто виграє кожен запит" },
  colWinner: { en: "Winner", uk: "Переможець" },
  citableMark: { en: "citable", uk: "цитовне" },
  tie: { en: "tie", uk: "нічия" },
  nobody: { en: "nobody answers", uk: "ніхто не відповідає" },

  // ── groups
  groupsTitle: { en: "The groups this page falls into", uk: "Групи, на які розпадається сторінка" },
  groupsSub: { en: (v) => `${en(v.n, "group", "groups")}, by the agent's reading`, uk: (v) => `${uk(v.n, "група", "групи", "груп")}, за прочитанням агента` },
  groupN: { en: (v) => `Group ${v.n}`, uk: (v) => `Група ${v.n}` },
  labelSource: { en: "label source", uk: "джерело мітки" },
  srcHeading: { en: "heading", uk: "заголовок" },
  srcKeywords: { en: "keywords (a hint)", uk: "ключові слова (підказка)" },
  srcNone: { en: "no label", uk: "без мітки" },
  srcHeadingTitle: { en: "The page's own section heading", uk: "Власний заголовок розділу сторінки" },
  srcKeywordsTitle: { en: "The group's two most distinctive words: a hint, not the section's name", uk: "Два найхарактерніші слова групи: підказка, а не назва розділу" },
  ofIndexed: { en: "of the indexed text", uk: "індексованого тексту" },
  groupsExplain: {
    en: "The large name is the agent's label for the group. Under it, the <b>label source</b>: a <b>heading</b> is the page's own section heading and can be quoted; <b>keywords</b> are the group's two most distinctive words, a hint and not what the section is called.",
    uk: "Велика назва — мітка групи від агента. Під нею <b>джерело мітки</b>: <b>заголовок</b> — власний заголовок розділу сторінки, його можна цитувати; <b>ключові слова</b> — два найхарактерніші слова групи, підказка, а не назва розділу.",
  },

  // ── passages
  passagesTitle: { en: "Passages, by group", uk: "Уривки за групами" },
  passagesSub: { en: (v) => `in reading order inside each group; each opens with its first ${v.n} characters`, uk: (v) => `у порядку читання всередині групи; кожен показано першими ${v.n} символами` },
  showFull: { en: "Show the full passage", uk: "Показати весь уривок" },
  repeats: { en: (v) => `repeats #${v.n}`, uk: (v) => `повторює #${v.n}` },
  outsideCap: {
    en: (v) => `<b>Outside cap: ${fmtN(v.n)} characters</b> at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.`,
    uk: (v) => `<b>За лімітом: ${uk(v.n, "символ", "символи", "символів")}</b> наприкінці сторінки. Це не уривки цього читання: звідти нічого не можна дістати.`,
  },

  // ── side path / keywords
  sideTitle: { en: "Side-path content", uk: "Побічний вміст" },
  sideSome: { en: (v) => `${en(v.n, "passage looks", "passages look")} like related links or utility copy; they are still indexed.`, uk: (v) => `${uk(v.n, "уривок схожий", "уривки схожі", "уривків схожі")} на пов’язані посилання чи службовий текст; їх однаково проіндексовано.` },
  sideNone: { en: "No passage looks like related links or utility copy.", uk: "Жоден уривок не схожий на пов’язані посилання чи службовий текст." },
  relatedLink: { en: "related link", uk: "пов’язане посилання" },
  utilityCopy: { en: "utility copy", uk: "службовий текст" },
  kwTitle: { en: "The page's vocabulary", uk: "Словник сторінки" },
  kwHonest: {
    en: (v) => `What the page says, not search demand — for how people ask, use the query test or ${v.link}.`,
    uk: (v) => `Це те, що каже сторінка, а не пошуковий попит. Як питають люди — покаже тест запитів або ${v.link}.`,
  },
  phrasesTitle: { en: "Phrases this page owns", uk: "Фрази, що належать цій сторінці" },
  phrasesNote: {
    en: "Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses. A highlighted phrase reaches most of the page's groups.",
    uk: "Від двох до чотирьох слів, які сторінка пише разом, щонайменше у двох уривках (або тричі в одному), ніколи через розділовий знак чи службове слово. Порядок — за кількістю уривків, далі за вживаннями. Виділена фраза охоплює більшість груп сторінки.",
  },
  narrativeTitle: { en: "Narrative words", uk: "Слова розповіді" },
  narrativeNote: {
    en: "Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.",
    uk: "Окремі слова, пораховані лише там, де їх не використала жодна фраза вище. Вони кажуть, про що говорить сторінка; але люди рідко саме так пишуть чи питають.",
  },
  noPhrases: { en: "No phrase is written often enough to count.", uk: "Жодну фразу не написано достатньо часто, щоб її врахувати." },
  none: { en: "None.", uk: "Немає." },
  kwTitleAttr: {
    en: (v) => `${v.count} uses, in ${v.passages} passages and ${v.groups} of ${v.total} groups`,
    uk: (v) => `вживань: ${v.count}, уривків: ${v.passages}, груп: ${v.groups} з ${v.total}`,
  },

  // ── facts
  facts: { en: "Citable facts", uk: "Факти для цитування" },
  factsSub: { en: "the agent's list of the concrete facts, figures and claims the passages state", uk: "перелік конкретних фактів, чисел і тверджень з уривків, складений агентом" },
  colFact: { en: "Fact", uk: "Факт" },
  stated: { en: "stated", uk: "є" },
  notStated: { en: "not stated", uk: "немає" },
  onlyHere: { en: "only this page", uk: "лише тут" },

  // ── diff
  diff: { en: "Since the baseline", uk: "Порівняно з базовою версією" },
  diffSub: { en: (v) => `against the reading of ${v.url}`, uk: (v) => `відносно читання ${v.url}` },
  diffCounts: {
    en: (v) => `${v.same} unchanged · ${v.changed} changed · ${v.added} added · ${v.removed} removed`,
    uk: (v) => `без змін: ${v.same} · змінено: ${v.changed} · додано: ${v.added} · вилучено: ${v.removed}`,
  },
  colMeasure: { en: "Measure", uk: "Показник" },
  colBefore: { en: "Baseline", uk: "Було" },
  colAfter: { en: "Now", uk: "Зараз" },
  mPassages: { en: "Passages", uk: "Уривки" },
  mWords: { en: "Words", uk: "Слова" },
  mCap: { en: "Cap reached", uk: "Ліміт досягнуто" },
  mUnread: { en: "Characters past the cap", uk: "Символи за лімітом" },
  stSame: { en: "unchanged", uk: "без змін" },
  stChanged: { en: "changed", uk: "змінено" },
  stAdded: { en: "added", uk: "додано" },
  stRemoved: { en: "removed", uk: "вилучено" },
  groupChanges: { en: "Group changes", uk: "Зміни груп" },
  cameFrom: { en: "came from", uk: "походить з" },
  newText: { en: "new text", uk: "новий текст" },
  wasN: { en: (v) => `was #${v.n}`, uk: (v) => `було #${v.n}` },

  // ── compare
  compareTitle: { en: (v) => `${v.n} pages, one topic dictionary`, uk: (v) => `${v.n} ${ukForm(v.n, "сторінка", "сторінки", "сторінок")}, один словник тем` },
  pagesTitle: { en: "The pages", uk: "Сторінки" },
  colPage: { en: "Page", uk: "Сторінка" },
  colWords: { en: "Words", uk: "Слова" },
  colPassages: { en: "Passages", uk: "Уривки" },
  colPastCap: { en: "Past cap", uk: "За лімітом" },
  colBlocked: { en: "AI crawlers blocked", uk: "Заблоковані ШІ-краулери" },
  colFindings: { en: "Findings", uk: "Знахідки" },
  topicTable: { en: "Topics × pages", uk: "Теми × сторінки" },
  topicTableSub: { en: "passages and characters each page spends on each shared topic", uk: "скільки уривків і символів кожна сторінка віддає кожній спільній темі" },
  colTopic: { en: "Topic", uk: "Тема" },
  topicGaps: { en: "Topic gaps", uk: "Прогалини в темах" },
  topicGapsSub: { en: "topics the other pages cover and this one does not", uk: "теми, які мають інші сторінки, а ця — ні" },
  noGaps: { en: "no gaps", uk: "прогалин немає" },
  factGaps: { en: "Fact gaps", uk: "Прогалини у фактах" },
  factGapsSub: { en: "which page states a fact the others lack", uk: "яка сторінка має факт, якого бракує іншим" },
  crawlersByPage: { en: "AI crawlers by page", uk: "ШІ-краулери за сторінками" },
  findingsByPage: { en: "Findings by page", uk: "Знахідки за сторінками" },
  readingByPage: { en: "Each page's reading", uk: "Читання кожної сторінки" },

  // ── closing / footer
  closingCut: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot: ${fmtN(v.n)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця: ${uk(v.n, "символ", "символи", "символів")} наприкінці не потрапили в індекс і не можуть стати відповіддю ні на що.`,
  },
  closingFull: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця. Лічильник не показує тексту за лімітом, але через перекриття уривків короткий хвіст сторінки все ж міг лишитися непрочитаним.`,
  },
  closingFullExact: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot; the last passage reaches the end of the kept text, so nothing fell past the cap.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця; останній уривок доходить до кінця збереженого тексту, тож за ліміт нічого не вийшло.`,
  },
  closingFits: {
    en: (v) => `A page contributes at most ${v.cap} passages; this one needed ${v.n}, so none of its extracted text fell past the cap.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}; цій знадобилося ${v.n}, тож жоден видобутий текст не вийшов за ліміт.`,
  },
  fine: {
    en: "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.",
    uk: "Це попередній перегляд того, що бачить машина, а не гарантія того, що з цим зробить будь-який асистент: звідси не випливає, що якийсь асистент проіндексував сторінку, а кожна система нарізає, вбудовує й обмежує по-своєму.",
  },
  footerMadeRefused: {
    en: "Made with the vectorscope skill: the scripts fetched the page, found it was in Russian and kept nothing of it; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку, визначили, що вона російською, і нічого з неї не зберегли; жодної моделі чи ембедингів не викликано.",
  },
  footerMade: {
    en: "Made with the vectorscope skill: the scripts fetched the page and its robots.txt and sent nothing anywhere; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку та її robots.txt і нікуди нічого не надсилали; жодної моделі чи ембедингів не викликано.",
  },
  footerAuthor: { en: "the author", uk: "автор" },
};

/**
 * Copy for each check code: a title and what to tell the user. `what` turns the evidence into a
 * sentence (values arrive HTML-safe); `tell` is the advice.
 */
export const CHECK_COPY = {
  robots_unreachable: {
    title: { en: "robots.txt did not answer", uk: "robots.txt не відповідає" },
    what: { en: (v) => `${v.url || "robots.txt"} returned ${v.httpStatus ? `HTTP ${v.httpStatus}` : "no answer"}.`, uk: (v) => `${v.url || "robots.txt"} повернув ${v.httpStatus ? `HTTP ${v.httpStatus}` : "порожнечу"}.` },
    tell: { en: "Under RFC 9309 a crawler that cannot read robots.txt assumes it may fetch nothing. Make robots.txt answer 200 (or 404 if you want no rules).", uk: "За RFC 9309 краулер, який не може прочитати robots.txt, вважає, що не може завантажувати нічого. Зробіть так, щоб robots.txt відповідав 200 (або 404, якщо правил не треба)." },
  },
  ai_search_blocked: {
    title: { en: "AI search and answer crawlers are blocked", uk: "Заблоковано пошукових ШІ-краулерів і тих, що відповідають" },
    what: { en: (v) => `Blocked for this path: ${v.bots}.`, uk: (v) => `Для цього шляху заблоковано: ${v.bots}.` },
    tell: { en: "These crawlers fetch pages to answer people. While they are disallowed, the rest of this report is moot for those assistants. Remove the Disallow for them if you want to be cited.", uk: "Ці краулери завантажують сторінки, щоб відповідати людям. Поки їм заборонено, решта звіту для цих асистентів не має значення. Зніміть Disallow для них, якщо хочете, щоб вас цитували." },
  },
  ai_training_blocked: {
    title: { en: "Training crawlers are blocked", uk: "Краулерів для навчання заблоковано" },
    what: { en: (v) => `Blocked: ${v.bots}.`, uk: (v) => `Заблоковано: ${v.bots}.` },
    tell: { en: "Usually a deliberate choice: these collect model-training data and do not decide whether an assistant can cite you today. Keep it if it was meant.", uk: "Зазвичай це свідомий вибір: ці краулери збирають дані для навчання моделей і не вирішують, чи процитує вас асистент сьогодні. Залиште, якщо так і задумано." },
  },
  noindex: {
    title: { en: "The page asks not to be indexed", uk: "Сторінка просить її не індексувати" },
    what: { en: "meta robots carries noindex.", uk: "meta robots містить noindex." },
    tell: { en: "Search indexes that assistants answer from will drop the page. Remove noindex unless that is the intent.", uk: "Пошукові індекси, з яких відповідають асистенти, викинуть сторінку. Приберіть noindex, якщо це не навмисно." },
  },
  js_dependent: {
    title: { en: "Most of the page needs JavaScript", uk: "Більша частина сторінки потребує JavaScript" },
    what: { en: (v) => `${fmtN(v.withJs)} words with JavaScript, ${fmtN(v.withoutJs)} without.`, uk: (v) => `${fmtUk(v.withJs)} слів з JavaScript, ${fmtUk(v.withoutJs)} без нього.` },
    tell: { en: "A retriever that does not run JavaScript reads the smaller number. Render the content on the server.", uk: "Ретривер, який не виконує JavaScript, читає меншу кількість. Рендерте вміст на сервері." },
  },
  cap_overflow: {
    title: { en: "Text fell past the 26-passage cap", uk: "Текст вийшов за ліміт у 26 уривків" },
    what: { en: (v) => `${fmtN(v.charsPastCap ?? v.charsUnread)} characters after passage #${v.last} are never stored.`, uk: (v) => `${uk(v.charsPastCap ?? v.charsUnread, "символ", "символи", "символів")} після уривка #${v.last} ніколи не зберігаються.` },
    tell: { en: "Move what matters earlier, cut repetition, or split the page so each part has its own 26 slots.", uk: "Перенесіть важливе вище, приберіть повтори або розділіть сторінку, щоб кожна частина мала власні 26 місць." },
  },
  lost_faq_questions: {
    title: { en: "FAQ answers without their questions", uk: "Відповіді FAQ без запитань" },
    what: { en: (v) => `${v.answers} sentences open with an answer ("Yes.", "No.") and the passage holds ${v.questions} question mark(s).`, uk: (v) => `${v.answers} речень починаються з відповіді («Так.», «Ні.»), а в уривку лише ${v.questions} знак(и) питання.` },
    tell: { en: "The questions are probably in buttons or accordions the extractor drops. Put each question as visible text (an h3 or a bold line) right before its answer.", uk: "Запитання, імовірно, сидять у кнопках чи акордеонах, які екстрактор відкидає. Зробіть кожне запитання видимим текстом (h3 або жирний рядок) просто перед відповіддю." },
  },
  dominant_heading: {
    title: { en: "One heading carries too much of the page", uk: "Один заголовок несе забагато сторінки" },
    what: { en: (v) => `${v.heading ? `“${v.heading}”` : "Text with no heading"} holds ${pct(v.share)} of the indexed text.`, uk: (v) => `${v.heading ? `«${v.heading}»` : "Текст без заголовка"} містить ${pct(v.share)} індексованого тексту.` },
    tell: { en: "The chunker splits only at h2. If this part has subtopics, they are h3s or styled text; make them real h2 headings so each becomes its own passage.", uk: "Нарізувач ділить лише за h2. Якщо в цій частині є підтеми, вони оформлені як h3 або стилізований текст; зробіть їх справжніми h2, щоб кожна стала окремим уривком." },
  },
  mid_sentence_start: {
    title: { en: "Passages that start mid-sentence", uk: "Уривки, що починаються посеред речення" },
    what: { en: (v) => `${v.count} passage(s) open on a lowercase word or a punctuation mark.`, uk: (v) => `Уривків, що починаються з малої літери чи розділового знака: ${v.count}.` },
    tell: { en: "The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.", uk: "Розділ був довший за 2 000 символів, і вікно його розрізало. Розбийте довгі розділи заголовками h2, щоб уривки починалися там, де починається тема." },
  },
  nav_in_content: {
    title: { en: "Navigation inside the content", uk: "Навігація всередині вмісту" },
    what: { en: (v) => `${v.runs} run(s) of four or more one-or-two-word lines.`, uk: (v) => `Серій із чотирьох і більше рядків по одному-два слова: ${v.runs}.` },
    tell: { en: "Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.", uk: "Меню, списки тегів чи таблиці підписів у головній області стають текстом уривків. Загорніть їх у nav або винесіть з main." },
  },
  thin_section: {
    title: { en: "Thin sections", uk: "Тонкі розділи" },
    what: { en: (v) => `${v.count} heading(s) with fewer than 150 characters under them.`, uk: (v) => `Заголовків, під якими менше 150 символів: ${v.count}.` },
    tell: { en: "A passage this short cannot answer much on its own. Merge it into a neighbour or say what the heading promises.", uk: "Такий короткий уривок мало що може відповісти сам. Об’єднайте його з сусіднім або напишіть те, що обіцяє заголовок." },
  },
  truncated_teaser: {
    title: { en: "Truncated teasers", uk: "Обрізані анонси" },
    what: { en: (v) => `${v.count} line(s) end in “…”.`, uk: (v) => `Рядків, що закінчуються на «…»: ${v.count}.` },
    tell: { en: "A cut-off teaser gives the retriever half a claim. Finish the sentence or drop the teaser.", uk: "Обрізаний анонс дає ретриверу половину твердження. Допишіть речення або приберіть анонс." },
  },
  repeated_claim: {
    title: { en: "The same words in most groups", uk: "Ті самі слова в більшості груп" },
    what: { en: (v) => `${v.n} phrase(s) recur across at least half of the ${v.groupCount} groups.`, uk: (v) => `Фраз, що повторюються щонайменше в половині з ${v.groupCount} груп: ${v.n}.` },
    tell: { en: "Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.", uk: "Повтори витрачають уривки на вже сказане й розмивають групи. Скажіть це один раз, там, де йому місце." },
  },
  canonical_other: {
    title: { en: "Canonical points elsewhere", uk: "Canonical вказує на іншу сторінку" },
    what: { en: (v) => `rel=canonical names ${v.href}.`, uk: (v) => `rel=canonical називає ${v.href}.` },
    tell: { en: "Search indexes will prefer that URL; the passages here may be stored under it or not at all. Point canonical at this page if it is the original.", uk: "Пошукові індекси віддадуть перевагу тій адресі; уривки звідси можуть зберегтися під нею або не зберегтися взагалі. Вкажіть canonical на цю сторінку, якщо вона оригінал." },
  },
  canonical_multiple: {
    title: { en: "More than one canonical", uk: "Більше одного canonical" },
    what: { en: (v) => `${v.count} rel=canonical links.`, uk: (v) => `Посилань rel=canonical: ${v.count}.` },
    tell: { en: "Conflicting canonicals are usually ignored. Keep exactly one.", uk: "Суперечливі canonical зазвичай ігнорують. Залиште рівно один." },
  },
  canonical_relative: {
    title: { en: "Relative canonical", uk: "Відносний canonical" },
    what: { en: (v) => `rel=canonical is “${v.href}”.`, uk: (v) => `rel=canonical — «${v.href}».` },
    tell: { en: "It works, but an absolute URL leaves nothing to resolve. Write the full https:// address.", uk: "Це працює, але абсолютна адреса не залишає місця для помилки. Напишіть повну адресу https://." },
  },
  canonical_missing: {
    title: { en: "No canonical", uk: "Немає canonical" },
    what: { en: "The page has no rel=canonical link.", uk: "На сторінці немає посилання rel=canonical." },
    tell: { en: "Add one pointing at this URL, so copies with tracking parameters fold into it.", uk: "Додайте його з адресою цієї сторінки, щоб копії з параметрами відстеження зводилися до неї." },
  },
  jsonld_invalid: {
    title: { en: "Broken structured data", uk: "Зламані структуровані дані" },
    what: { en: (v) => `${v.invalid} of ${v.blocks} JSON-LD block(s) are not valid JSON.`, uk: (v) => `${v.invalid} з ${v.blocks} блоків JSON-LD — невалідний JSON.` },
    tell: { en: "An unparseable block is ignored whole. Validate it.", uk: "Блок, який не розбирається, ігнорують повністю. Перевірте його валідатором." },
  },
  jsonld_none: {
    title: { en: "No structured data", uk: "Немає структурованих даних" },
    what: { en: "No JSON-LD on the page.", uk: "На сторінці немає JSON-LD." },
    tell: { en: "Not needed for the passages, but FAQPage, HowTo, Product or Article markup states what the page is in a form machines read without guessing.", uk: "Для уривків це не обов’язково, але розмітка FAQPage, HowTo, Product чи Article каже, що це за сторінка, у формі, яку машини читають без здогадок." },
  },
  meta_description_missing: {
    title: { en: "No meta description", uk: "Немає meta description" },
    what: { en: "The intro passage (#0) has only the title and h1.", uk: "Вступний уривок (#0) має лише title і h1." },
    tell: { en: "The chunker puts the description into passage #0. Write one or two sentences that say what the page answers.", uk: "Нарізувач додає опис в уривок #0. Напишіть одне-два речення про те, на що відповідає сторінка." },
  },
  meta_description_short: {
    title: { en: "Short meta description", uk: "Короткий meta description" },
    what: { en: (v) => `${v.length} characters.`, uk: (v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.` },
    tell: { en: "It is part of passage #0. Say what the page answers, in 70–160 characters.", uk: "Він входить в уривок #0. Скажіть, на що відповідає сторінка, у 70–160 символах." },
  },
  meta_description_long: {
    title: { en: "Long meta description", uk: "Довгий meta description" },
    what: { en: (v) => `${v.length} characters.`, uk: (v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.` },
    tell: { en: "Snippets cut it at about 160 characters. Put the answer first.", uk: "Сніпети обрізають його приблизно на 160 символах. Поставте відповідь на початок." },
  },
  robots_not_checked: {
    title: { en: "robots.txt not checked", uk: "robots.txt не перевірено" },
    what: { en: "This run read a saved page.", uk: "Цей запуск читав збережену сторінку." },
    tell: { en: "Run read.mjs on the live URL to check the AI crawlers.", uk: "Запустіть read.mjs на живій адресі, щоб перевірити ШІ-краулерів." },
  },
};

/** One string in one language. */
export function tr(key, lang, values = {}) {
  const entry = S[key];
  if (!entry) throw new Error(`no copy for ${key}`);
  const value = entry[lang] ?? entry.en;
  return typeof value === "function" ? value(values) : value;
}

/** A check's copy in one language: { title, what, tell }. */
export function checkCopy(code, lang, evidence = {}) {
  const copy = CHECK_COPY[code];
  if (!copy) return { title: code, what: "", tell: "" };
  const pick = (part) => {
    const value = copy[part][lang] ?? copy[part].en;
    return typeof value === "function" ? value(evidence) : value;
  };
  return { title: pick("title"), what: pick("what"), tell: pick("tell") };
}
