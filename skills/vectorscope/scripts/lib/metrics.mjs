// Every number the report shows, documented once: what layer it belongs to, how it is computed,
// its unit, its threshold (if any) and what it cannot tell you. 2.102.
//
// One source of truth for three outputs: the HTML report's "?" beside each number (EN and UK),
// the Markdown's "How each number is computed" section, and the export's `metrics` dictionary.
//
// Layers:
//   measured   what the parser saw: words, passages, characters, robots.txt, markup;
//   derived    computed from measured values (and, where it says so, from the agent's groups):
//              shares, characters past the cap, check verdicts;
//   judgement  the agent's reading: groups, labels, the plan, the query test, the facts.

import { CHUNKS_PER_PAGE } from "./chunk.mjs";

export const LAYERS = ["measured", "derived", "judgement"];

export const LAYER_COPY = {
  measured: {
    label: { en: "Measured", uk: "Виміряно" },
    what: {
      en: "What the parser saw: words, passages, characters, robots.txt, markup. A script counted it; any model running the skill gets the same number.",
      uk: "Те, що побачив парсер: слова, уривки, символи, robots.txt, розмітка. Порахував скрипт; з будь-якою моделлю число те саме.",
    },
  },
  derived: {
    label: { en: "Derived", uk: "Обчислено" },
    what: {
      en: "Computed from measured values by a fixed formula: shares, characters past the cap, check verdicts. Deterministic; where it rests on the agent's groups, the metric says so.",
      uk: "Обчислено з виміряних значень за сталою формулою: частки, символи за лімітом, вердикти перевірок. Детерміновано; якщо в основі групи агента, це сказано в описі метрики.",
    },
  },
  judgement: {
    label: { en: "Agent's judgement", uk: "Судження агента" },
    what: {
      en: "The agent's reading of the passages: groups, labels, the rewrite plan, the query test, the facts. The scripts validate its shape and quotes; another model may judge differently.",
      uk: "Прочитання уривків агентом: групи, назви, план переписування, тест запитів, факти. Скрипти перевіряють форму й цитати; інша модель може судити інакше.",
    },
  },
};

const CHARS = { en: "characters, whitespace runs folded to one space", uk: "символи; кожну послідовність пробілів пораховано як один пробіл" };
const CHARS_RAW = { en: "characters, as the passage text holds them", uk: "символи — так, як вони є в тексті уривка" };
const NONE = null;
const cap = CHUNKS_PER_PAGE;

/** id → { layer, label, formula, unit, threshold, limits }, each text { en, uk }. */
export const METRICS = {
  words: {
    layer: "measured",
    label: { en: "Words", uk: "Слова" },
    formula: { en: "The extracted body text split on whitespace; every non-empty piece is a word.", uk: "Видобутий текст сторінки, поділений за пробілами; кожен непорожній шматок — слово." },
    unit: { en: "words", uk: "слова" },
    threshold: NONE,
    limits: { en: "Counted after the cleaner, so menus, footers and hidden text are not in it. A page drawn by JavaScript reads low here; compare with --render.", uk: "Рахується після очищення, тож меню, футери й прихований текст сюди не входять. Сторінка, яку малює JavaScript, тут виглядає бідною; порівняйте з --render." },
  },
  headings: {
    layer: "measured",
    label: { en: "Headings found", uk: "Знайдені заголовки" },
    formula: { en: "h1 elements plus h2 elements (the first 40) left after the cleaner, with empty ones dropped.", uk: "Елементи h1 плюс h2 (перші 40), що лишилися після очищення, без порожніх." },
    unit: { en: "headings", uk: "заголовки" },
    threshold: NONE,
    limits: { en: "h3 and styled text are not counted: the chunker splits only at h2.", uk: "h3 і стилізований текст не рахуються: нарізувач ділить лише за h2." },
  },
  passages: {
    layer: "measured",
    label: { en: "Passages read", uk: "Прочитані уривки" },
    formula: { en: `Sections at h2 headings (or paragraph blocks), long ones cut into 2,000-character windows with about 200 characters of overlap, slivers under 40 characters folded into the passage before, then the first ${cap} kept.`, uk: `Розділи за заголовками h2 (або блоки абзаців); довгі розрізано на вікна по 2 000 символів із перекриттям близько 200, уривки коротші за 40 символів приєднано до попереднього, далі лишено перші ${cap}.` },
    unit: { en: "passages", uk: "уривки" },
    threshold: { en: `At most ${cap} per page (this tool's cap).`, uk: `Не більше ${cap} на сторінку (ліміт цього інструмента).` },
    limits: { en: "Other systems cut and cap differently; this is a working model of a typical retriever.", uk: "Інші системи ріжуть і обмежують інакше; це робоча модель типового ретривера." },
  },
  slots: {
    layer: "measured",
    label: { en: "Cap slots used", uk: "Використані слоти ліміту" },
    formula: { en: `Passages kept, out of the ${cap}-passage cap. "Every slot filled" when the chunker produced ${cap} or more.`, uk: `Збережені уривки з ліміту в ${cap}. «Усі слоти заповнено», коли нарізувач дав ${cap} або більше.` },
    unit: { en: "slots", uk: "слоти" },
    threshold: { en: `${cap}: a full cap means text may have been left out (see characters past the cap).`, uk: `${cap}: повний ліміт означає, що частина тексту могла випасти (див. символи за лімітом).` },
    limits: { en: "A full cap does not by itself mean text was lost: the last passage may end exactly at the end of the page.", uk: "Повний ліміт сам по собі не означає втрат: останній уривок може закінчуватися саме там, де закінчується сторінка." },
  },
  passage_chars: {
    layer: "measured",
    label: { en: "Passage length", uk: "Довжина уривка" },
    formula: { en: "The length of one passage's text, as the chunker emitted it.", uk: "Довжина тексту одного уривка — так, як його видав нарізувач." },
    unit: CHARS_RAW,
    threshold: { en: "At most about 2,000, unless a sliver was folded in.", uk: "Близько 2 000 максимум, якщо до нього не приєднано короткий уривок." },
    limits: { en: "Neighbouring passages share about 200 characters by design.", uk: "Сусідні уривки за задумом мають близько 200 спільних символів." },
  },
  chars_in_passages: {
    layer: "measured",
    label: { en: "Text in passages, overlap and intro included", uk: "Текст в уривках, з перекриттям і вступом" },
    formula: { en: "The sum of every passage's length (page.charsIndexed). Passage #0 repeats the title, h1 and meta description; neighbours repeat about 200 characters.", uk: "Сума довжин усіх уривків (page.charsIndexed). Уривок #0 повторює title, h1 і meta description; сусіди повторюють близько 200 символів." },
    unit: CHARS_RAW,
    threshold: NONE,
    limits: { en: "Counts repeated text more than once, so it can exceed the page's own text. For how much of the page reached a passage, read the unique number.", uk: "Повторений текст рахується кілька разів, тож число може перевищити текст сторінки. Скільки сторінки дійшло до уривків, показує унікальне число." },
  },
  chars_unique: {
    layer: "derived",
    label: { en: "Unique text in passages", uk: "Унікальний текст в уривках" },
    formula: { en: "Each passage is located in the kept text (the intro part, title, h1 and description, set aside); the union of the located spans is counted once, so overlap is not counted twice.", uk: "Кожен уривок знайдено в збереженому тексті (вступну частину — title, h1, опис — відкладено); об’єднання знайдених проміжків пораховано один раз, тож перекриття не подвоюється." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "A passage the locator cannot place is reported as unlocated rather than guessed. Heading lines the chunker carries only as a passage's heading are not in it.", uk: "Уривок, який не вдалося знайти, позначено як незнайдений, а не вгадано. Рядки заголовків, які нарізувач несе лише як заголовок уривка, сюди не входять." },
  },
  chars_past_cap: {
    layer: "derived",
    label: { en: "Characters past the cap", uk: "Символи за лімітом" },
    formula: { en: `Only when every one of the ${cap} slots is filled: the kept text after the end of the last passage. Equivalently, kept text − unique text in passages − text between passages, counted after the last one.`, uk: `Лише коли всі ${cap} слотів заповнено: збережений текст після кінця останнього уривка. Інакше кажучи, збережений текст − унікальний текст в уривках − текст між уривками, після останнього.` },
    unit: CHARS,
    threshold: { en: "Above 0 means a tail no retriever using this cap can return.", uk: "Більше за 0 — є хвіст, який ретривер із таким лімітом не поверне ніколи." },
    limits: { en: "Replaces the 2.101 estimate, which subtracted the overlapping total and so undercounted, often to 0. That old number is still exported as charsUnread.", uk: "Замінює оцінку 2.101, яка віднімала суму з перекриттям і тому занижувала, часто до 0. Старе число досі є в експорті як charsUnread." },
  },
  chars_unread_legacy: {
    layer: "derived",
    label: { en: "charsUnread (2.101 meaning)", uk: "charsUnread (як у 2.101)" },
    formula: { en: "When the cap is reached: extracted body characters − text in passages including overlap and intro; otherwise 0.", uk: "Коли ліміт досягнуто: символи тексту сторінки − текст в уривках з перекриттям і вступом; інакше 0." },
    unit: CHARS_RAW,
    threshold: NONE,
    limits: { en: "Undercounts and can read 0 even when the cap cut a tail. Kept unchanged for compatibility; use characters past the cap.", uk: "Занижує і може показувати 0, навіть коли ліміт відрізав хвіст. Лишається без змін для сумісності; користуйтеся символами за лімітом." },
  },
  text_raw: {
    layer: "derived",
    label: { en: "Text in the raw HTML", uk: "Текст у сирому HTML" },
    formula: { en: "Kept text plus every removal in the table below. An estimate of the document's text, defined so the waterfall sums exactly.", uk: "Збережений текст плюс кожне видалення з таблиці нижче. Оцінка тексту документа, визначена так, щоб каскад сходився точно." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "Script and style bodies count as text here because the cleaner has to remove them; it is not the text a reader sees.", uk: "Вміст script і style тут рахується як текст, бо очищувач мусить його видалити; це не той текст, який бачить читач." },
  },
  text_removed: {
    layer: "measured",
    label: { en: "Removed by the cleaner", uk: "Видалено очищувачем" },
    formula: { en: "For every element the cleaner removed (outermost only, so nothing counts twice): its own text at the moment of removal. Plus, when a main region was chosen, the text of everything outside it.", uk: "Для кожного видаленого елемента (лише зовнішнього, тож нічого не рахується двічі): його текст у момент видалення. Плюс, коли обрано основну область, текст усього поза нею." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "Observed on a second copy of the extraction, checked to give the same text; the removal itself is the product's rule and is not tuned here.", uk: "Спостерігається на другій копії видобування, яка дає той самий текст; саме видалення — правило продукту, тут його не змінено." },
  },
  text_kept: {
    layer: "measured",
    label: { en: "Kept text", uk: "Збережений текст" },
    formula: { en: "The extractor's body text (the chunker's input), whitespace folded.", uk: "Текст сторінки після видобування (вхід нарізувача), пробіли згорнуто." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "Differs slightly from page.bodyChars, which counts line breaks as they are.", uk: "Трохи відрізняється від page.bodyChars, де розриви рядків пораховано як є." },
  },
  not_in_passages: {
    layer: "derived",
    label: { en: "Kept, but in no passage text", uk: "Збережено, але не в тексті уривка" },
    formula: { en: "Kept text before the end of the last passage that no passage holds: h2 heading lines (carried as a passage's heading, not its text), the spaces between sections, and anything else (should be 0).", uk: "Збережений текст до кінця останнього уривка, якого немає в жодному уривку: рядки заголовків h2 (їх нарізувач несе як заголовок уривка, а не текст), пробіли між розділами та інше (має бути 0)." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "A retriever may still see a heading as the passage's metadata; this tool does not assume either way.", uk: "Ретривер може бачити заголовок як метадані уривка; цей інструмент не припускає ні того, ні іншого." },
  },
  overlap_chars: {
    layer: "derived",
    label: { en: "Overlap", uk: "Перекриття" },
    formula: { en: "Located passage text − unique text in passages: what neighbouring windows repeat.", uk: "Знайдений текст уривків − унікальний текст в уривках: те, що повторюють сусідні вікна." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "By design, about 200 per cut inside a long section.", uk: "За задумом близько 200 на кожен розріз довгого розділу." },
  },
  intro_chars: {
    layer: "measured",
    label: { en: "Intro", uk: "Вступ" },
    formula: { en: "The title, h1 and meta description the chunker puts at the start of passage #0.", uk: "Title, h1 і meta description, які нарізувач ставить на початок уривка #0." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "Not part of the body text, so it is outside the waterfall's kept stage.", uk: "Не входить у текст сторінки, тому поза етапом «збережено» в каскаді." },
  },
  removal_chars: {
    layer: "measured",
    label: { en: "Characters removed by one element", uk: "Символи, видалені одним елементом" },
    formula: { en: "The removed element's text, whitespace folded, at the moment the cleaner removed it.", uk: "Текст видаленого елемента зі згорнутими пробілами — у момент видалення." },
    unit: CHARS,
    threshold: NONE,
    limits: { en: "Elements with no text are counted but not listed. Beyond the first 200 the rest are summed, never dropped.", uk: "Елементи без тексту пораховано, але не перелічено. Понад перші 200 решту підсумовано, а не відкинуто." },
  },
  section_reached: {
    layer: "derived",
    label: { en: "Section text that reached a passage", uk: "Текст розділу, що дійшов до уривка" },
    formula: { en: "For each section the chunker made (the intro, the text before the first h2, each h2), the part of its text inside some passage, over its length.", uk: "Для кожного розділу нарізувача (вступ, текст до першого h2, кожен h2) — частина його тексту, що є в якомусь уривку, від його довжини." },
    unit: CHARS,
    threshold: { en: "Under 100% means that section lost text, almost always to the cap.", uk: "Менше 100% — розділ утратив текст, майже завжди через ліміт." },
    limits: { en: "When the page has no usable h2 split, the body is one row.", uk: "Коли сторінка не ділиться за h2, увесь текст — один рядок." },
  },
  robots_verdict: {
    layer: "measured",
    label: { en: "robots.txt verdict", uk: "Вердикт robots.txt" },
    formula: { en: "RFC 9309 over the site's /robots.txt: the group naming the token replaces *; the longest matching Allow or Disallow wins; Allow wins a tie.", uk: "RFC 9309 для /robots.txt сайту: група з токеном замінює *; перемагає найдовше правило Allow чи Disallow; при рівності — Allow." },
    unit: { en: "allowed / blocked per crawler", uk: "дозволено / заблоковано для кожного краулера" },
    threshold: NONE,
    limits: { en: "A 4xx robots.txt means no rules; 5xx or no answer means all blocked. Some user-fetch crawlers say they may ignore robots.txt.", uk: "robots.txt із 4xx — правил немає; 5xx або без відповіді — заблоковано все. Деякі краулери на запит користувача кажуть, що можуть ігнорувати robots.txt." },
  },
  markup: {
    layer: "measured",
    label: { en: "Technical markup", uk: "Технічна розмітка" },
    formula: { en: "From the raw HTML: every @type in application/ld+json blocks (through @graph), rel=canonical links, the meta description's length.", uk: "Із сирого HTML: кожен @type у блоках application/ld+json (через @graph), посилання rel=canonical, довжина meta description." },
    unit: { en: "types, links, characters", uk: "типи, посилання, символи" },
    threshold: { en: "Meta description: 70–160 characters.", uk: "Meta description: 70–160 символів." },
    limits: { en: "Read, not validated against schema.org.", uk: "Прочитано, але не перевірено за schema.org." },
  },
  render_words: {
    layer: "measured",
    label: { en: "Words with JavaScript", uk: "Слова з JavaScript" },
    formula: { en: "The same extraction and chunking over the DOM a local headless Chrome dumped after running the page's scripts.", uk: "Те саме видобування й нарізання на DOM, який локальний headless Chrome вивантажив після виконання скриптів сторінки." },
    unit: { en: "words, passages", uk: "слова, уривки" },
    threshold: { en: "50% more words and at least 150 more raises js_dependent.", uk: "На 50% більше слів і щонайменше на 150 — спрацьовує js_dependent." },
    limits: { en: "Only with --render. The reading itself stays the plain fetch.", uk: "Лише з --render. Саме читання лишається звичайним завантаженням." },
  },
  group_chars: {
    layer: "derived",
    label: { en: "Group size", uk: "Розмір групи" },
    formula: { en: "Passages in the group, and the sum of their lengths.", uk: "Уривки в групі та сума їхніх довжин." },
    unit: CHARS_RAW,
    threshold: NONE,
    limits: { en: "Computed over the agent's groups, so it moves with the grouping.", uk: "Обчислено за групами агента, тож змінюється разом із групуванням." },
  },
  group_share: {
    layer: "derived",
    label: { en: "Share of indexed text", uk: "Частка індексованого тексту" },
    formula: { en: "The group's characters over the characters of every passage (overlap included).", uk: "Символи групи від символів усіх уривків (з перекриттям)." },
    unit: { en: "percent", uk: "відсотки" },
    threshold: NONE,
    limits: { en: "Computed over the agent's groups. Overlap counts in both neighbours.", uk: "Обчислено за групами агента. Перекриття рахується в обох сусідів." },
  },
  vocabulary: {
    layer: "derived",
    label: { en: "Phrase and word counts", uk: "Лічильники фраз і слів" },
    formula: { en: "Over the passages' text with the overlap removed: ×uses, the passages that use it (p), and how many groups it reaches (g/total).", uk: "За текстом уривків без перекриття: ×вживання, уривки, де вона є (p), і скільки груп охоплює (g/усього)." },
    unit: { en: "occurrences, passages, groups", uk: "вживання, уривки, групи" },
    threshold: { en: "A phrase needs 2 uses in 2 passages, or 3 in one.", uk: "Фразі потрібно 2 вживання у 2 уривках або 3 в одному." },
    limits: { en: "What the page says, not search demand. The group count rests on the agent's groups.", uk: "Це те, що каже сторінка, а не попит. Кількість груп спирається на групи агента." },
  },
  check_verdicts: {
    layer: "derived",
    label: { en: "Check verdicts", uk: "Вердикти перевірок" },
    formula: { en: "Fixed rules over the measured values, each a named constant in checks.mjs with its reason; every finding names the passages it rests on.", uk: "Сталі правила над виміряними значеннями, кожне — іменована константа в checks.mjs зі своєю причиною; кожна знахідка називає уривки, на яких тримається." },
    unit: { en: "findings, by severity", uk: "знахідки за серйозністю" },
    threshold: { en: "Each check's threshold is in the check table of SKILL.md.", uk: "Поріг кожної перевірки — у таблиці перевірок SKILL.md." },
    limits: { en: "repeated_claim uses the agent's groups; every other check does not.", uk: "repeated_claim спирається на групи агента; решта — ні." },
  },
  groups: {
    layer: "judgement",
    label: { en: "Groups and labels", uk: "Групи та назви" },
    formula: { en: "The agent read every passage and grouped them by subject (at most 6); its label is its own. The label source is computed: a heading most members share, else two distinctive words.", uk: "Агент прочитав кожен уривок і згрупував їх за темою (не більше 6); назва — його власна. Джерело назви обчислено: заголовок, спільний для більшості, або два характерні слова." },
    unit: { en: "groups", uk: "групи" },
    threshold: { en: "At most 6 groups.", uk: "Не більше 6 груп." },
    limits: { en: "Not an embedding clustering; another model may group a little differently.", uk: "Це не кластеризація ембедингів; інша модель може згрупувати трохи інакше." },
  },
  duplicates: {
    layer: "judgement",
    label: { en: "Repeats", uk: "Повтори" },
    formula: { en: "Passages the agent marked as repeating an earlier, non-adjacent passage almost word for word.", uk: "Уривки, які агент позначив як майже дослівний повтор раннішого, не сусіднього уривка." },
    unit: { en: "passages", uk: "уривки" },
    threshold: NONE,
    limits: { en: "The product judges this from embeddings at cosine 0.94; here it is read.", uk: "Продукт визначає це за ембедингами при косинусі 0.94; тут — прочитанням." },
  },
  query_verdicts: {
    layer: "judgement",
    label: { en: "Query test", uk: "Тест запитів" },
    formula: { en: "For 5 to 10 typical queries, the agent names the best passage and a verdict (complete, partial, missing) and quotes the answer; the quote is checked verbatim.", uk: "Для 5–10 типових запитів агент називає найкращий уривок, вердикт (повна, часткова, немає) і цитує відповідь; цитату перевірено дослівно." },
    unit: { en: "queries", uk: "запити" },
    threshold: NONE,
    limits: { en: "Judged from the passages only; it is not a measurement of what any assistant returns.", uk: "Оцінено лише за уривками; це не вимірювання того, що повертає будь-який асистент." },
  },
  plan: {
    layer: "judgement",
    label: { en: "Rewrite plan", uk: "План переписування" },
    formula: { en: "The agent's fixes in priority order; each 'before' is checked verbatim against its passage, each cited check against the checks that fired.", uk: "Виправлення агента за пріоритетом; кожне «було» перевірено дослівно за уривком, кожну згадану перевірку — за тими, що спрацювали." },
    unit: { en: "items", uk: "пункти" },
    threshold: NONE,
    limits: { en: "Advice, not a measurement.", uk: "Порада, а не вимірювання." },
  },
  facts: {
    layer: "judgement",
    label: { en: "Citable facts", uk: "Факти для цитування" },
    formula: { en: "The agent's list of concrete facts the passages state, each with the passages that state it.", uk: "Перелік конкретних фактів, які подають уривки, складений агентом, з уривками, де кожен із них є." },
    unit: { en: "facts", uk: "факти" },
    threshold: NONE,
    limits: { en: "Fact gaps are only as fair as this list is complete.", uk: "Прогалини у фактах чесні рівно настільки, наскільки повний цей перелік." },
  },
  topic_cells: {
    layer: "derived",
    label: { en: "Topic × page cells", uk: "Клітинки тема × сторінка" },
    formula: { en: "Passages and characters of the groups the agent assigned to each shared topic.", uk: "Уривки й символи груп, які агент відніс до кожної спільної теми." },
    unit: CHARS_RAW,
    threshold: NONE,
    limits: { en: "Computed over the agent's groups and topics.", uk: "Обчислено за групами й темами агента." },
  },
  diff_counts: {
    layer: "derived",
    label: { en: "Changes since the baseline", uk: "Зміни від базового читання" },
    formula: { en: "Passages matched by identical text, then by the same heading in order; the rest are added or removed.", uk: "Уривки зіставлено за однаковим текстом, далі за тим самим заголовком по порядку; решта — додані або вилучені." },
    unit: { en: "passages", uk: "уривки" },
    threshold: NONE,
    limits: { en: "A passage that moved and changed heading counts as removed plus added.", uk: "Уривок, що змістився і змінив заголовок, рахується як вилучений плюс доданий." },
  },
};

/** The export's dictionary, in English: id → { layer, label, formula, unit, threshold, limits }. */
export function metricsDictionary(lang = "en") {
  const out = {};
  for (const [id, m] of Object.entries(METRICS)) {
    out[id] = {
      layer: m.layer,
      label: m.label[lang],
      formula: m.formula[lang],
      unit: m.unit[lang],
      threshold: m.threshold ? m.threshold[lang] : null,
      limits: m.limits[lang],
    };
  }
  return out;
}
