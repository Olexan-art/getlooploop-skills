// Interface copy for the HTML report, in English (the default), Ukrainian and Polish. Page content
// is never translated; only the report's own words are. Every entry is { en, uk, pl }, each a
// string or a function of the values it needs. Values passed in are already HTML-safe.

import { REFUSAL_COPY } from "./refusal.mjs";

export const LANGS = ["en", "uk", "pl"];

const fmtN = (n) => Number(n).toLocaleString("en-US");
const fmtUk = (n) => Number(n).toLocaleString("en-US").replace(/,/g, " ");

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
/** Polish groups thousands as Ukrainian does. */
export const fmtPl = (n) => fmtUk(n);
/** Polish plural: 1 fragment, 2–4 fragmenty, 5+ fragmentów; 12–14 and 21, 31… take the many form. */
export function plForm(n, one, few, many) {
  const abs = Math.abs(Number(n));
  const d10 = abs % 10;
  const d100 = abs % 100;
  if (abs === 1) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}
const pl = (n, one, few, many) => `${fmtPl(n)} ${plForm(n, one, few, many)}`;
const pct = (x) => `${Math.round(x * 1000) / 10}%`;

export const S = {
  // ── chrome
  eyebrow: { en: "Vectorscope · local reading", uk: "Vectorscope · локальне читання", pl: "Vectorscope · odczyt lokalny" },
  eyebrowCompare: { en: "Vectorscope · comparison", uk: "Vectorscope · порівняння", pl: "Vectorscope · porównanie" },
  themeGroup: { en: "Theme", uk: "Тема", pl: "Motyw" },
  dark: { en: "Dark", uk: "Темна", pl: "Ciemny" },
  light: { en: "Light", uk: "Світла", pl: "Jasny" },
  langGroup: { en: "Language", uk: "Мова", pl: "Język" },
  askedFor: { en: (v) => `Asked for ${v.url}, redirected here.`, uk: (v) => `Запитано ${v.url}, переспрямовано сюди.`, pl: (v) => `Żądano ${v.url}, przekierowano tutaj.` },
  words: { en: (v) => `<b>${fmtN(v.n)}</b> words`, uk: (v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "слово", "слова", "слів")}`, pl: (v) => `<b>${fmtPl(v.n)}</b> ${plForm(v.n, "słowo", "słowa", "słów")}` },
  headingsFound: { en: (v) => `<b>${fmtN(v.n)}</b> headings found`, uk: (v) => `<b>${fmtUk(v.n)}</b> ${ukForm(v.n, "заголовок", "заголовки", "заголовків")}`, pl: (v) => `<b>${fmtPl(v.n)}</b> ${plForm(v.n, "nagłówek", "nagłówki", "nagłówków")}` },
  noindexYes: { en: "<b>noindex</b>: the page asks search engines not to index it", uk: "<b>noindex</b>: сторінка просить пошуковики її не індексувати", pl: "<b>noindex</b>: strona prosi wyszukiwarki, by jej nie indeksowały" },
  noindexNo: { en: "noindex <b>no</b>", uk: "noindex <b>ні</b>", pl: "noindex <b>nie</b>" },

  // ── how to read this report: three different claims, kept apart
  infoAria: { en: "How to read this report", uk: "Як читати цей звіт", pl: "Jak czytać ten raport" },
  infoSameTitle: { en: "Same for everyone", uk: "Однаково для всіх", pl: "Tak samo dla wszystkich" },
  infoSameBody: {
    en: (v) => `The fetch, the text extraction, the cut (at h2 headings, then 2,000-character windows), the ${v.cap}-passage cap, robots.txt and the automatic checks are scripts: identical whichever model runs the skill.`,
    uk: (v) => `Завантаження, видобування тексту, нарізання (за заголовками h2, далі вікнами по 2 000 символів), ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, robots.txt і автоматичні перевірки виконують скрипти: результат однаковий, хоч би яка модель запускала навичку.`,
    pl: (v) => `Pobranie strony, wyodrębnienie tekstu, cięcie (na nagłówkach h2, potem w oknach po 2 000 znaków), limit ${v.cap} ${plForm(v.cap, "fragmentu", "fragmentów", "fragmentów")}, robots.txt i automatyczne sprawdzenia wykonują skrypty: wynik jest taki sam niezależnie od modelu, który uruchamia skill.`,
  },
  infoJudgeTitle: { en: "Your model's judgement", uk: "Судження вашої моделі", pl: "Ocena twojego modelu" },
  infoJudgeBody: {
    en: (v) => `The groups, their names, the rewrite plan, the query test and the facts are the reading of the model that ran this skill (${v.by}). Another model may group a little differently. For the embedding-based reading with the map, run the page at ${v.link}.`,
    uk: (v) => `Групи, їхні назви, план переписування, тест запитів і факти — це прочитання моделі, яка запустила цю навичку (${v.by}). Інша модель може згрупувати трохи інакше. Читання на ембедингах із картою — на ${v.link}.`,
    pl: (v) => `Grupy, ich nazwy, plan przeredagowania, test zapytań i fakty to odczyt modelu, który uruchomił ten skill (${v.by}). Inny model może pogrupować trochę inaczej. Odczyt oparty na embeddingach, z mapą, znajdziesz na ${v.link}.`,
  },
  // agent and model arrive HTML-safe; either may be null, and then it is said, never guessed.
  infoBy: {
    en: (v) => [v.model ? `model: <b>${v.model}</b>` : "model not stated by the agent", v.agent ? `agent: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "),
    uk: (v) => [v.model ? `модель: <b>${v.model}</b>` : "агент не вказав модель", v.agent ? `агент: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "),
    pl: (v) => [v.model ? `model: <b>${v.model}</b>` : "agent nie podał modelu", v.agent ? `agent: <b>${v.agent}</b>` : null].filter(Boolean).join(" · "),
  },
  infoByPage: { en: (v) => `page ${v.n}: ${v.by}`, uk: (v) => `сторінка ${v.n}: ${v.by}`, pl: (v) => `strona ${v.n}: ${v.by}` },
  infoNotTitle: { en: "Not any assistant's pipeline", uk: "Не конвеєр жодного асистента", pl: "To nie potok żadnego konkretnego asystenta" },
  infoNotBody: {
    en: (v) => `ChatGPT, Gemini, Perplexity, Copilot and others use their own crawlers, cuts and embeddings, and do not publish them. The principle is the same (fetch → text → passages → retrieval); the details differ. This reading is a working model of a typical retriever, not a copy of any one of them; the ${v.cap}-passage cap is this tool's.`,
    uk: (v) => `ChatGPT, Gemini, Perplexity, Copilot та інші мають власні краулери, власне нарізання й ембединги і не публікують їх. Принцип той самий (завантаження → текст → уривки → пошук), деталі різняться. Це читання — робоча модель типового ретривера, а не копія котрогось із них; ліміт у ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")} — правило цього інструмента.`,
    pl: (v) => `ChatGPT, Gemini, Perplexity, Copilot i inne mają własne crawlery, własne cięcie i embeddingi, i ich nie publikują. Zasada jest ta sama (pobranie → tekst → fragmenty → wyszukiwanie), szczegóły się różnią. Ten odczyt to roboczy model typowego systemu wyszukiwania (retrievera), a nie kopia któregokolwiek z nich; limit ${v.cap} ${plForm(v.cap, "fragmentu", "fragmentów", "fragmentów")} to reguła tego narzędzia.`,
  },

  // ── the refusal (its copy lives in refusal.mjs)
  refusalTitle: REFUSAL_COPY.title,
  refusedTag: { en: "not analysed", uk: "не проаналізовано", pl: "nie przeanalizowano" },

  // ── blocked banner
  bannerTitle: { en: "AI crawlers are blocked from this page", uk: "ШІ-краулерам закрито доступ до цієї сторінки", pl: "Crawlery AI nie mają dostępu do tej strony" },
  bannerBody: {
    en: (v) => `robots.txt disallows this path for ${v.bots}. Those assistants cannot fetch the page for search or for a user's question, so everything below is moot for them until the rule changes.`,
    uk: (v) => `robots.txt забороняє цей шлях для ${v.bots}. Ці асистенти не можуть завантажити сторінку ні для пошуку, ні на запит користувача, тож усе нижче для них не має значення, доки правило не зміниться.`,
    pl: (v) => `robots.txt blokuje tę ścieżkę dla ${v.bots}. Ci asystenci nie mogą pobrać strony ani do wyszukiwania, ani w odpowiedzi na pytanie użytkownika, więc wszystko poniżej nie ma dla nich znaczenia, dopóki reguła się nie zmieni.`,
  },
  bannerUnreachable: {
    en: "robots.txt could not be read (a server error or no answer). RFC 9309 tells a crawler to assume it may fetch nothing in that case, so compliant AI crawlers treat the whole site as blocked until robots.txt answers.",
    uk: "robots.txt не вдалося прочитати (помилка сервера або немає відповіді). За RFC 9309 краулер у такому разі вважає, що не може завантажувати нічого, тож сумлінні ШІ-краулери вважають увесь сайт закритим, доки robots.txt не відповість.",
    pl: "Nie udało się odczytać robots.txt (błąd serwera lub brak odpowiedzi). Według RFC 9309 crawler ma wtedy założyć, że nie może pobierać niczego, więc crawlery AI przestrzegające reguł traktują cały serwis jako zablokowany, dopóki robots.txt nie odpowie.",
  },

  // ── result
  result: { en: "Result", uk: "Результат", pl: "Wynik" },
  whatMachineReads: { en: "what the machine reads", uk: "що читає машина", pl: "co czyta maszyna" },
  fetched: { en: "Fetched", uk: "Завантажено", pl: "Pobrano" },
  extracted: { en: "Extracted", uk: "Видобуто", pl: "Wyodrębniono" },
  chunked: { en: "Chunked", uk: "Нарізано", pl: "Pocięto" },
  grouped: { en: "Grouped", uk: "Згруповано", pl: "Pogrupowano" },
  nWords: { en: (v) => en(v.n, "word", "words"), uk: (v) => uk(v.n, "слово", "слова", "слів"), pl: (v) => pl(v.n, "słowo", "słowa", "słów") },
  nPassages: { en: (v) => en(v.n, "passage", "passages"), uk: (v) => uk(v.n, "уривок", "уривки", "уривків"), pl: (v) => pl(v.n, "fragment", "fragmenty", "fragmentów") },
  nGroups: { en: (v) => en(v.n, "group", "groups"), uk: (v) => uk(v.n, "група", "групи", "груп"), pl: (v) => pl(v.n, "grupa", "grupy", "grup") },
  pipelineNote: {
    en: (v) => `${fmtN(v.headings)} headings · ${fmtN(v.chars)} characters indexed · ${en(v.repeats, "repeat", "repeats")} · grouped by reading, no embedding step`,
    uk: (v) => `${uk(v.headings, "заголовок", "заголовки", "заголовків")} · ${uk(v.chars, "символ", "символи", "символів")} в індексі · ${uk(v.repeats, "повтор", "повтори", "повторів")} · групування читанням, без ембедингів`,
    pl: (v) => `${pl(v.headings, "nagłówek", "nagłówki", "nagłówków")} · ${pl(v.chars, "znak", "znaki", "znaków")} w indeksie · ${pl(v.repeats, "powtórzenie", "powtórzenia", "powtórzeń")} · grupowanie przez lekturę, bez embeddingów`,
  },
  passagesRead: { en: "passages read", uk: "уривків прочитано", pl: "przeczytane fragmenty" },
  slotsUsed: { en: (v) => `slots used of the ${v.cap}-passage cap${v.full ? ": every slot filled" : ""}`, uk: (v) => `місць зайнято з ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}${v.full ? ": усі місця зайняті" : ""}`, pl: (v) => `zajętych miejsc z limitu ${v.cap} ${plForm(v.cap, "fragmentu", "fragmentów", "fragmentów")}${v.full ? ": wszystkie miejsca zajęte" : ""}` },
  pastCap: { en: "characters past the cap (0 when the page fits)", uk: "символів за лімітом (0, коли сторінка вміщується)", pl: "znaków poza limitem (0, gdy strona się mieści)" },
  pastCapLegacy: { en: "characters past the cap (2.101 estimate: this reading has no loss measurement)", uk: "символів за лімітом (оцінка 2.101: у цьому читанні немає вимірювання втрат)", pl: "znaków poza limitem (szacunek 2.101: ten odczyt nie ma pomiaru strat)" },
  uniqueInPassages: { en: "characters of unique text in passages", uk: "символів унікального тексту в уривках", pl: "znaków unikalnego tekstu we fragmentach" },
  totalInPassages: { en: "characters in passages, overlap and intro included", uk: "символів в уривках, з перекриттям і вступом", pl: "znaków we fragmentach, łącznie z zakładką i wstępem" },

  // ── 2.102: the three layers, the "?" beside each number
  infoLayersTitle: { en: "Three kinds of number", uk: "Три види чисел", pl: "Trzy rodzaje liczb" },
  infoLayersBody: {
    en: (v) => `Every section and every number carries a tag. ${v.measured} is what the parser saw. ${v.derived} is computed from those by a fixed formula. ${v.judgement} is the reading of the agent that ran the skill. The ${v.help} beside a number opens its formula, unit, threshold and limits.`,
    uk: (v) => `Кожен розділ і кожне число мають позначку. ${v.measured} — те, що побачив парсер. ${v.derived} — обчислено з цього за сталою формулою. ${v.judgement} — прочитання агента, що запустив навичку. ${v.help} біля числа відкриває його формулу, одиницю, поріг і обмеження.`,
    pl: (v) => `Każda sekcja i każda liczba ma etykietę. ${v.measured} to to, co zobaczył parser. ${v.derived} to wartości wyliczone z nich według stałego wzoru. ${v.judgement} to odczyt agenta, który uruchomił skill. ${v.help} obok liczby pokazuje jej wzór, jednostkę, próg i ograniczenia.`,
  },
  helpAria: { en: "How this number is computed", uk: "Як обчислено це число", pl: "Jak obliczono tę liczbę" },
  helpFormula: { en: "Formula", uk: "Формула", pl: "Wzór" },
  helpUnit: { en: "Unit", uk: "Одиниця", pl: "Jednostka" },
  helpThreshold: { en: "Threshold", uk: "Поріг", pl: "Próg" },
  helpLimits: { en: "Known limits", uk: "Обмеження", pl: "Znane ograniczenia" },
  kOverlap: { en: "overlap", uk: "перекриття", pl: "zakładka" },
  kIntro: { en: "intro", uk: "вступ", pl: "wstęp" },
  helpColumns: { en: "How these numbers are computed:", uk: "Як обчислено ці числа:", pl: "Jak obliczono te liczby:" },

  // ── 2.102: where the text goes
  lossesTitle: { en: "Where the text goes", uk: "Куди дівається текст", pl: "Dokąd trafia tekst" },
  lossesSub: { en: "every stage from the raw HTML to the passages, in characters", uk: "кожен етап від сирого HTML до уривків, у символах", pl: "każdy etap od surowego HTML do fragmentów, w znakach" },
  // 2.103: the panel is folded at the end of the report; its summary line says what is inside.
  lossesFold: { en: "what the cleaner removed and what reached the passages", uk: "що прибрав очищувач і що дійшло до уривків", pl: "co usunięto podczas czyszczenia i co trafiło do fragmentów" },
  lossTableFold: { en: "what the cleaner removed and what reached the passages, page by page", uk: "що прибрав очищувач і що дійшло до уривків, сторінка за сторінкою", pl: "co usunięto podczas czyszczenia i co trafiło do fragmentów, strona po stronie" },
  foldPastCap: {
    en: (v) => en(v.n, "character past the cap", "characters past the cap"),
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} за лімітом`,
    pl: (v) => `${pl(v.n, "znak", "znaki", "znaków")} poza limitem`,
  },
  foldPastCapAll: {
    en: (v) => `${en(v.n, "character", "characters")} past the cap across the pages`,
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} за лімітом на всіх сторінках`,
    pl: (v) => `${pl(v.n, "znak", "znaki", "znaków")} poza limitem na wszystkich stronach`,
  },
  wfRaw: { en: "Text in the raw HTML (estimate)", uk: "Текст у сирому HTML (оцінка)", pl: "Tekst w surowym HTML (szacunek)" },
  wfRemoved: { en: "Removed by the cleaner", uk: "Видалено очищувачем", pl: "Usunięte podczas czyszczenia" },
  wfKept: { en: "Kept: the chunker's input", uk: "Збережено: вхід нарізувача", pl: "Zachowany tekst: wejście do cięcia" },
  wfUnique: { en: "In passages, unique", uk: "В уривках, унікально", pl: "We fragmentach, unikalny" },
  wfNotIn: { en: "Kept, in no passage text", uk: "Збережено, але не в тексті уривків", pl: "Zachowany, ale w żadnym fragmencie" },
  wfPastCap: { en: "Past the cap", uk: "За лімітом", pl: "Poza limitem" },
  wfAria: {
    en: (v) => `Character waterfall: ${v.raw} in the raw HTML, ${v.removed} removed, ${v.kept} kept, ${v.unique} in passages, ${v.notIn} in no passage text, ${v.pastCap} past the cap.`,
    uk: (v) => `Каскад символів: у сирому HTML ${v.raw}, видалено ${v.removed}, збережено ${v.kept}, в уривках ${v.unique}, поза текстом уривків ${v.notIn}, за лімітом ${v.pastCap}.`,
    pl: (v) => `Kaskada znaków: w surowym HTML ${v.raw}, usunięto ${v.removed}, zachowano ${v.kept}, we fragmentach ${v.unique}, poza tekstem fragmentów ${v.notIn}, poza limitem ${v.pastCap}.`,
  },
  wfOfRaw: { en: (v) => `${v.p} of the raw text`, uk: (v) => `${v.p} сирого тексту`, pl: (v) => `${v.p} surowego tekstu` },
  wfOfKept: { en: (v) => `${v.p} of the kept text`, uk: (v) => `${v.p} збереженого тексту`, pl: (v) => `${v.p} zachowanego tekstu` },
  wfNote: {
    en: (v) => `The passages hold ${fmtN(v.total)} characters in all: ${fmtN(v.unique)} unique, plus ${fmtN(v.overlap)} of overlap between neighbours and ${fmtN(v.intro)} of intro (title, h1, description) in passage #0. Of the kept text in no passage: ${fmtN(v.headings)} in h2 heading lines, ${fmtN(v.spaces)} spaces between sections${v.other ? `, ${fmtN(v.other)} other` : ""}.`,
    uk: (v) => `Загалом в уривках ${uk(v.total, "символ", "символи", "символів")}: ${fmtUk(v.unique)} унікальних, плюс ${fmtUk(v.overlap)} перекриття між сусідами і ${fmtUk(v.intro)} вступу (title, h1, опис) в уривку #0. Зі збереженого тексту поза уривками: ${fmtUk(v.headings)} — рядки заголовків h2, ${fmtUk(v.spaces)} — пробіли між розділами${v.other ? `, ${fmtUk(v.other)} — інше` : ""}.`,
    pl: (v) => `Łącznie fragmenty zawierają ${pl(v.total, "znak", "znaki", "znaków")}: ${fmtPl(v.unique)} unikalnych, do tego ${fmtPl(v.overlap)} zakładki między sąsiednimi fragmentami i ${fmtPl(v.intro)} wstępu (title, h1, opis) we fragmencie #0. Z zachowanego tekstu poza fragmentami: ${fmtPl(v.headings)} to wiersze nagłówków h2, ${fmtPl(v.spaces)} to odstępy między sekcjami${v.other ? `, ${fmtPl(v.other)} to inne` : ""}.`,
  },
  wfUnlocated: {
    en: (v) => `${fmtN(v.n)} characters of passage text could not be placed in the kept text; they are left out of the unique count rather than guessed.`,
    uk: (v) => `${uk(v.n, "символ", "символи", "символів")} тексту уривків не вдалося знайти в збереженому тексті; їх не враховано в унікальному числі, а не вгадано.`,
    pl: (v) => `Nie udało się umiejscowić w zachowanym tekście: ${pl(v.n, "znak", "znaki", "znaków")} tekstu fragmentów; pominięto je w liczbie unikalnych znaków, zamiast zgadywać.`,
  },
  wfInconsistent: {
    en: "The observed extraction did not match the one the chunker used, so these numbers may not describe this reading. Please report it.",
    uk: "Спостережене видобування не збіглося з тим, яке використав нарізувач, тож ці числа можуть не описувати це читання. Повідомте про це, будь ласка.",
    pl: "Zaobserwowane wyodrębnienie tekstu nie zgadza się z tym, którego użyto przy cięciu, więc te liczby mogą nie opisywać tego odczytu. Zgłoś to, proszę.",
  },
  noLosses: {
    en: "This reading has no loss measurement: it was read with 2.101 or earlier. Read the page again with this version to see where its text goes.",
    uk: "У цьому читанні немає вимірювання втрат: його зроблено версією 2.101 або старшою. Прочитайте сторінку знову цією версією, щоб побачити, куди дівається текст.",
    pl: "Ten odczyt nie ma pomiaru strat: wykonano go wersją 2.101 lub starszą. Odczytaj stronę ponownie tą wersją, aby zobaczyć, dokąd trafia jej tekst.",
  },
  removalsTitle: { en: "What the cleaner removed", uk: "Що видалив очищувач", pl: "Co usunięto podczas czyszczenia" },
  removalsSub: {
    en: (v) => `${en(v.n, "element", "elements")} with text, ${fmtN(v.chars)} characters, largest first`,
    uk: (v) => `${uk(v.n, "елемент", "елементи", "елементів")} з текстом, ${uk(v.chars, "символ", "символи", "символів")}, від найбільшого`,
    pl: (v) => `${pl(v.n, "element", "elementy", "elementów")} z tekstem, ${pl(v.chars, "znak", "znaki", "znaków")}, od największego`,
  },
  removalsEmpty: {
    en: (v) => `${en(v.n, "more matched element", "more matched elements")} held no text.`,
    uk: (v) => `Ще ${uk(v.n, "елемент", "елементи", "елементів")} без тексту.`,
    pl: (v) => `Jeszcze ${pl(v.n, "element", "elementy", "elementów")} bez tekstu.`,
  },
  removalsMore: {
    en: (v) => `${en(v.n, "more element", "more elements")}, ${en(v.chars, "character", "characters")}, not listed here (all in export.json up to 200; the rest summed there).`,
    uk: (v) => `Ще ${uk(v.n, "елемент", "елементи", "елементів")}, ${uk(v.chars, "символ", "символи", "символів")}, тут не показано (у export.json — до 200, решту там підсумовано).`,
    pl: (v) => `Jeszcze ${pl(v.n, "element", "elementy", "elementów")}, ${pl(v.chars, "znak", "znaki", "znaków")}, nie pokazano tutaj (w export.json do 200, reszta tam zsumowana).`,
  },
  removalsNone: { en: "The cleaner removed no text from this page.", uk: "Очищувач не видалив з цієї сторінки жодного тексту.", pl: "Podczas czyszczenia nie usunięto z tej strony żadnego tekstu." },
  removalsByReason: { en: "By reason", uk: "За причиною", pl: "Według przyczyny" },
  colReason: { en: "Reason", uk: "Причина", pl: "Przyczyna" },
  colElement: { en: "Element", uk: "Елемент", pl: "Element" },
  colChars: { en: "Chars", uk: "Символи", pl: "Znaki" },
  colSample: { en: "Its text begins", uk: "Його текст починається", pl: "Początek tekstu" },
  colElements: { en: "Elements", uk: "Елементи", pl: "Elementy" },
  rs_script_style: { en: "script, style, noscript, template", uk: "script, style, noscript, template", pl: "script, style, noscript, template" },
  rs_embedded: { en: "svg, canvas, iframe, embed", uk: "svg, canvas, iframe, embed", pl: "svg, canvas, iframe, embed" },
  rs_head_meta: { en: "head (title, meta)", uk: "head (title, meta)", pl: "head (title, meta)" },
  rs_hidden: { en: "[hidden] or aria-hidden", uk: "[hidden] або aria-hidden", pl: "[hidden] lub aria-hidden" },
  rs_header_chrome: { en: "page header (site banner)", uk: "шапка сторінки (банер сайту)", pl: "nagłówek strony (baner serwisu)" },
  rs_banner_role: { en: "role=banner", uk: "role=banner", pl: "role=banner" },
  rs_header_controls: { en: "controls inside a kept header", uk: "елементи керування в збереженій шапці", pl: "kontrolki w zachowanym nagłówku strony" },
  rs_nav: { en: "navigation (nav, role=navigation)", uk: "навігація (nav, role=navigation)", pl: "nawigacja (nav, role=navigation)" },
  rs_footer: { en: "footer", uk: "футер", pl: "stopka" },
  rs_aside: { en: "aside, role=complementary", uk: "aside, role=complementary", pl: "aside, role=complementary" },
  rs_contentinfo_role: { en: "role=contentinfo", uk: "role=contentinfo", pl: "role=contentinfo" },
  rs_form_control: { en: "form, button, select, input", uk: "form, button, select, input", pl: "form, button, select, input" },
  rs_overlay_class: { en: "cookie, newsletter, popup or modal class", uk: "клас cookie, newsletter, popup чи modal", pl: "klasa cookie, newsletter, popup lub modal" },
  rs_outside_main: { en: "outside the chosen main region", uk: "поза обраною основною областю", pl: "poza wybranym obszarem głównym" },
  sectionsTitle: { en: "How much of each section reached a passage", uk: "Скільки з кожного розділу дійшло до уривків", pl: "Ile z każdej sekcji trafiło do fragmentów" },
  sectionsSub: { en: "the chunker's own sections, in page order", uk: "розділи самого нарізувача, у порядку сторінки", pl: "sekcje wyznaczone przy cięciu, w kolejności na stronie" },
  secIntro: { en: "Intro: title, h1, description", uk: "Вступ: title, h1, опис", pl: "Wstęp: title, h1, opis" },
  secBefore: { en: "Before the first h2", uk: "До першого h2", pl: "Przed pierwszym h2" },
  secBody: { en: "The body (not split at h2)", uk: "Основний текст (без поділу за h2)", pl: "Treść główna (bez podziału na h2)" },
  secUnlocated: { en: "not located", uk: "не знайдено", pl: "nie odnaleziono" },
  secReached: { en: (v) => `${fmtN(v.n)} of ${fmtN(v.of)}`, uk: (v) => `${fmtUk(v.n)} з ${fmtUk(v.of)}`, pl: (v) => `${fmtPl(v.n)} z ${fmtPl(v.of)}` },
  secCutSummary: {
    en: (v) => `${en(v.n, "section", "sections")} lost text; ${en(v.zero, "section", "sections")} reached no passage at all.`,
    uk: (v) => `Утратили текст: ${uk(v.n, "розділ", "розділи", "розділів")}; зовсім не дійшли до уривків: ${uk(v.zero, "розділ", "розділи", "розділів")}.`,
    pl: (v) => `Straciły tekst: ${pl(v.n, "sekcja", "sekcje", "sekcji")}; nie trafiły do żadnego fragmentu: ${pl(v.zero, "sekcja", "sekcje", "sekcji")}.`,
  },
  secAllIn: { en: "Every section reached a passage in full.", uk: "Кожен розділ повністю дійшов до уривків.", pl: "Każda sekcja w całości trafiła do fragmentów." },
  lossTable: { en: "Losses by page", uk: "Втрати за сторінками", pl: "Straty według stron" },
  lossTableSub: { en: "the same waterfall for every page, in characters", uk: "той самий каскад для кожної сторінки, у символах", pl: "ta sama kaskada dla każdej strony, w znakach" },
  colRaw: { en: "Raw (est.)", uk: "Сирий (оцінка)", pl: "Surowy (szac.)" },
  colRemoved: { en: "Removed", uk: "Видалено", pl: "Usunięto" },
  colKept: { en: "Kept", uk: "Збережено", pl: "Zachowano" },
  colUnique: { en: "In passages", uk: "В уривках", pl: "We fragmentach" },
  colSectionsCut: { en: "Sections cut", uk: "Урізані розділи", pl: "Przycięte sekcje" },
  wfDiff: { en: "Waterfall, baseline → now", uk: "Каскад: було → зараз", pl: "Kaskada: było → teraz" },
  wfDiffNone: { en: "The baseline reading has no loss measurement (2.101 or earlier), so only this reading's waterfall is shown above.", uk: "Базове читання не має вимірювання втрат (2.101 або старше), тому вище показано лише каскад цього читання.", pl: "Odczyt bazowy nie ma pomiaru strat (2.101 lub starszy), dlatego powyżej pokazano tylko kaskadę tego odczytu." },
  colChange: { en: "Change", uk: "Зміна", pl: "Zmiana" },

  // ── strip
  strip: { en: "The reading strip", uk: "Смуга читання", pl: "Pasek odczytu" },
  stripSub: { en: (v) => `one cell per passage, in reading order, inside the ${v.cap}-slot cap`, uk: (v) => `одна клітинка на уривок, у порядку читання, у межах ліміту в ${v.cap} місць`, pl: (v) => `jedna komórka na fragment, w kolejności czytania, w granicach limitu ${v.cap} miejsc` },
  stripAria: { en: (v) => `Passages inside the ${v.cap}-passage cap`, uk: (v) => `Уривки в межах ліміту в ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}`, pl: (v) => `Fragmenty w granicach limitu ${v.cap} ${plForm(v.cap, "fragmentu", "fragmentów", "fragmentów")}` },
  pastCapShort: { en: "characters past the cap", uk: "символів за лімітом", pl: "znaków poza limitem" },
  notRead: { en: "not read", uk: "не прочитано", pl: "nieprzeczytane" },
  cap: { en: "cap", uk: "ліміт", pl: "limit" },
  readoutIdle: {
    en: "Hover or focus a cell to see its passage, heading and group. Striped cells are side-path content. Select a cell to jump to the passage.",
    uk: "Наведіть курсор або перейдіть на клітинку, щоб побачити її уривок, заголовок і групу. Смугасті клітинки — побічний вміст. Натисніть клітинку, щоб перейти до уривка.",
    pl: "Najedź na komórkę lub ustaw na niej fokus, aby zobaczyć jej fragment, nagłówek i grupę. Komórki w paski to treść poboczna. Kliknij komórkę, aby przejść do fragmentu.",
  },
  noHeading: { en: "no heading", uk: "без заголовка", pl: "bez nagłówka" },
  group: { en: "group", uk: "група", pl: "grupa" },
  chars: { en: "chars", uk: "симв.", pl: "zn." },
  cellTip: {
    en: (v) => `<b>#${v.i}</b> · ${v.heading} · group ${v.g}: <b>${v.label}</b> · ${fmtN(v.chars)} chars${v.role}`,
    uk: (v) => `<b>#${v.i}</b> · ${v.heading} · група ${v.g}: <b>${v.label}</b> · ${fmtUk(v.chars)} симв.${v.role}`,
    pl: (v) => `<b>#${v.i}</b> · ${v.heading} · grupa ${v.g}: <b>${v.label}</b> · ${fmtPl(v.chars)} zn.${v.role}`,
  },
  cellAria: {
    en: (v) => `Passage ${v.i}, ${v.heading}, group ${v.g}: ${v.label}, ${v.chars} characters${v.role}`,
    uk: (v) => `Уривок ${v.i}, ${v.heading}, група ${v.g}: ${v.label}, ${v.chars} символів${v.role}`,
    pl: (v) => `Fragment ${v.i}, ${v.heading}, grupa ${v.g}: ${v.label}, ${v.chars} znaków${v.role}`,
  },
  roleMain: { en: "main", uk: "основний", pl: "główny" },
  roleRelated: { en: "related", uk: "пов’язане", pl: "powiązane" },
  roleUtility: { en: "utility", uk: "службове", pl: "pomocnicze" },

  // ── checks
  checks: { en: "Checks", uk: "Перевірки", pl: "Sprawdzenia" },
  checksSub: { en: "automatic, ranked by severity; each names the passages it rests on", uk: "автоматичні, за важливістю; кожна називає уривки, на яких ґрунтується", pl: "automatyczne, według wagi; każde wskazuje fragmenty, na których się opiera" },
  aiCrawlers: { en: "AI crawlers and robots.txt", uk: "ШІ-краулери і robots.txt", pl: "Crawlery AI i robots.txt" },
  robotsFor: { en: (v) => `rules for the path ${v.path}`, uk: (v) => `правила для шляху ${v.path}`, pl: (v) => `reguły dla ścieżki ${v.path}` },
  colCrawler: { en: "Crawler", uk: "Краулер", pl: "Crawler" },
  colVendor: { en: "Vendor", uk: "Компанія", pl: "Firma" },
  colPurpose: { en: "What it does", uk: "Що робить", pl: "Do czego służy" },
  colVerdict: { en: "This page", uk: "Ця сторінка", pl: "Ta strona" },
  colRule: { en: "Deciding rule", uk: "Вирішальне правило", pl: "Rozstrzygająca reguła" },
  allowed: { en: "allowed", uk: "дозволено", pl: "dozwolone" },
  blocked: { en: "blocked", uk: "заблоковано", pl: "zablokowane" },
  noRule: { en: "no rule matches", uk: "жодне правило не підходить", pl: "żadna reguła nie pasuje" },
  groupStar: { en: "via *", uk: "через *", pl: "przez *" },
  kindSearch: { en: "search index for the assistant", uk: "пошуковий індекс асистента", pl: "indeks wyszukiwania asystenta" },
  kindUser: { en: "fetches when a user asks", uk: "завантажує на запит користувача", pl: "pobiera na prośbę użytkownika" },
  kindTraining: { en: "collects training data", uk: "збирає дані для навчання", pl: "zbiera dane treningowe" },
  kindIndex: { en: "web search index assistants answer from", uk: "вебіндекс, з якого відповідають асистенти", pl: "indeks wyszukiwarki, z którego odpowiadają asystenci" },
  mayIgnore: { en: "the vendor says robots.txt may not apply to it", uk: "компанія зазначає, що robots.txt може на нього не діяти", pl: "firma zaznacza, że robots.txt może go nie dotyczyć" },
  robotsNone: { en: (v) => `No robots.txt (HTTP ${v.status}): nothing is disallowed.`, uk: (v) => `robots.txt немає (HTTP ${v.status}): нічого не заборонено.`, pl: (v) => `Brak robots.txt (HTTP ${v.status}): nic nie jest zablokowane.` },
  robotsNotChecked: { en: "robots.txt was not checked in this run (a saved page, or --no-robots).", uk: "robots.txt у цьому запуску не перевірявся (збережена сторінка або --no-robots).", pl: "W tym uruchomieniu nie sprawdzono robots.txt (zapisana strona lub --no-robots)." },
  robotsSource: { en: (v) => `Read from ${v.url}. Groups matched by product token, case-insensitively; longest matching rule wins, Allow wins a tie (RFC 9309).`, uk: (v) => `Прочитано з ${v.url}. Групи зіставлено за токеном продукту без огляду на регістр; перемагає найдовше правило, за рівної довжини — Allow (RFC 9309).`, pl: (v) => `Odczytano z ${v.url}. Grupy dopasowano po tokenie produktu, bez rozróżniania wielkości liter; wygrywa najdłuższa pasująca reguła, przy remisie Allow (RFC 9309).` },
  technical: { en: "Technical markup", uk: "Технічна розмітка", pl: "Znaczniki techniczne" },
  jsonLd: { en: "Structured data (JSON-LD)", uk: "Структуровані дані (JSON-LD)", pl: "Dane strukturalne (JSON-LD)" },
  jsonLdNone: { en: "none", uk: "немає", pl: "brak" },
  jsonLdInvalid: { en: (v) => `${v.n} block(s) not valid JSON`, uk: (v) => `блоків з невалідним JSON: ${v.n}`, pl: (v) => `bloki z niepoprawnym JSON: ${v.n}` },
  canonical: { en: "Canonical", uk: "Canonical", pl: "Canonical" },
  canonicalMissing: { en: "missing", uk: "немає", pl: "brak" },
  canonicalSelf: { en: "points to this page", uk: "вказує на цю сторінку", pl: "wskazuje na tę stronę" },
  canonicalOther: { en: "points to another URL", uk: "вказує на іншу адресу", pl: "wskazuje na inny URL" },
  canonicalRelative: { en: "relative", uk: "відносна адреса", pl: "względny" },
  metaDescription: { en: "Meta description", uk: "Meta description", pl: "Meta description" },
  metaChars: { en: (v) => `${v.n} characters`, uk: (v) => `${v.n} ${ukForm(v.n, "символ", "символи", "символів")}`, pl: (v) => `${v.n} ${plForm(v.n, "znak", "znaki", "znaków")}` },
  metaNone: { en: "missing", uk: "немає", pl: "brak" },
  headerXRobotsTag: { en: "X-Robots-Tag", uk: "X-Robots-Tag", pl: "X-Robots-Tag" },
  headerCacheControl: { en: "Cache-Control", uk: "Cache-Control", pl: "Cache-Control" },
  headerNone: { en: "none", uk: "немає", pl: "brak" },
  accessibility: { en: "Accessibility", uk: "Доступність", pl: "Dostępność" },
  accessibilitySummary: {
    en: (v) => `${v.images} image(s), ${v.missingAlt} without alt · ${v.headings} heading(s), ${v.skipped} level jump(s)`,
    uk: (v) => `Зображень: ${v.images}, без alt: ${v.missingAlt} · заголовків: ${v.headings}, стрибків рівня: ${v.skipped}`,
    pl: (v) => `Obrazy: ${v.images}, bez alt: ${v.missingAlt} · nagłówki: ${v.headings}, przeskoki poziomu: ${v.skipped}`,
  },
  render: { en: "With JavaScript", uk: "З JavaScript", pl: "Z JavaScript" },
  renderDone: {
    en: (v) => `${fmtN(v.js)} words and ${v.jsp} passages with JavaScript, against ${fmtN(v.plain)} words and ${v.plainp} passages from the plain fetch. The reading above is the plain fetch.`,
    uk: (v) => `${uk(v.js, "слово", "слова", "слів")} і ${uk(v.jsp, "уривок", "уривки", "уривків")} з JavaScript проти ${uk(v.plain, "слова", "слів", "слів")} і ${uk(v.plainp, "уривка", "уривків", "уривків")} у звичайному завантаженні. Читання вище — звичайне завантаження.`,
    pl: (v) => `Z JavaScript: ${pl(v.js, "słowo", "słowa", "słów")} i ${pl(v.jsp, "fragment", "fragmenty", "fragmentów")}; przy zwykłym pobraniu: ${pl(v.plain, "słowo", "słowa", "słów")} i ${pl(v.plainp, "fragment", "fragmenty", "fragmentów")}. Odczyt powyżej pochodzi ze zwykłego pobrania.`,
  },
  renderNoBrowser: { en: "Not rendered: no local Chrome or Chromium was found (set CHROME_PATH).", uk: "Не відрендерено: локальний Chrome чи Chromium не знайдено (задайте CHROME_PATH).", pl: "Nie wyrenderowano: nie znaleziono lokalnego Chrome ani Chromium (ustaw CHROME_PATH)." },
  renderFailed: { en: (v) => `Not rendered: the browser run failed (${v.reason}).`, uk: (v) => `Не відрендерено: запуск браузера не вдався (${v.reason}).`, pl: (v) => `Nie wyrenderowano: uruchomienie przeglądarki się nie powiodło (${v.reason}).` },
  findings: { en: "Findings", uk: "Знахідки", pl: "Wyniki" },
  noFindings: { en: "No automatic check found anything on this page.", uk: "Автоматичні перевірки нічого не знайшли на цій сторінці.", pl: "Automatyczne sprawdzenia niczego nie wykryły na tej stronie." },
  sevHigh: { en: "high", uk: "високий", pl: "wysoki" },
  sevMedium: { en: "medium", uk: "середній", pl: "średni" },
  sevLow: { en: "low", uk: "низький", pl: "niski" },
  sevInfo: { en: "info", uk: "довідка", pl: "informacyjny" },
  passagesLabel: { en: "Passages", uk: "Уривки", pl: "Fragmenty" },
  whatToDo: { en: "What to do", uk: "Що зробити", pl: "Co zrobić" },

  // ── plan
  plan: { en: "Rewrite plan", uk: "План переписування", pl: "Plan przeredagowania" },
  planSub: { en: "the agent's judgement, in priority order; every passage must stand on its own, because a retriever sees it alone", uk: "судження агента, за пріоритетом; кожен уривок має бути самодостатнім, бо ретривер бачить його окремо", pl: "ocena agenta, według priorytetu; każdy fragment musi być zrozumiały sam w sobie, bo system wyszukiwania widzi go w oderwaniu od reszty" },
  problem: { en: "Problem", uk: "Проблема", pl: "Problem" },
  fix: { en: "Fix", uk: "Виправлення", pl: "Poprawka" },
  before: { en: "Before", uk: "Було", pl: "Przed" },
  after: { en: "After", uk: "Стало", pl: "Po" },
  page: { en: "page", uk: "сторінка", pl: "strona" },
  pageN: { en: (v) => `Page ${v.n}`, uk: (v) => `Сторінка ${v.n}`, pl: (v) => `Strona ${v.n}` },

  // ── queries
  queries: { en: "Query test", uk: "Тест запитів", pl: "Test zapytań" },
  queriesSub: { en: "the agent's judgement: for each typical query, the best passage and whether it answers on its own", uk: "судження агента: для кожного типового запиту — найкращий уривок і чи відповідає він сам по собі", pl: "ocena agenta: dla każdego typowego zapytania najlepszy fragment i to, czy odpowiada samodzielnie" },
  colQuery: { en: "Query", uk: "Запит", pl: "Zapytanie" },
  colBest: { en: "Best passage", uk: "Найкращий уривок", pl: "Najlepszy fragment" },
  colAnswer: { en: "Answer", uk: "Відповідь", pl: "Odpowiedź" },
  colCitable: { en: "Citable", uk: "Цитовне", pl: "Do cytowania" },
  colQuote: { en: "The words that answer", uk: "Слова, що відповідають", pl: "Słowa, które odpowiadają" },
  srcUser: { en: "your query", uk: "ваш запит", pl: "twoje zapytanie" },
  srcGenerated: { en: "written by the agent", uk: "запит від агента", pl: "napisane przez agenta" },
  vComplete: { en: "complete", uk: "повна", pl: "pełna" },
  vPartial: { en: "partial", uk: "часткова", pl: "częściowa" },
  vMissing: { en: "missing", uk: "немає", pl: "brak" },
  yes: { en: "yes", uk: "так", pl: "tak" },
  no: { en: "no", uk: "ні", pl: "nie" },
  querySummary: {
    en: (v) => `${v.complete} of ${v.total} queries answered completely, ${v.partial} partly, ${v.missing} not at all; ${v.citable} with a citable passage.`,
    uk: (v) => `Повна відповідь: ${v.complete} з ${v.total}, часткова: ${v.partial}, немає: ${v.missing}; придатний до цитування уривок: ${v.citable}.`,
    pl: (v) => `Pełna odpowiedź: ${v.complete} z ${v.total}, częściowa: ${v.partial}, brak: ${v.missing}; fragment do cytowania: ${v.citable}.`,
  },
  winners: { en: "Who wins each query", uk: "Хто виграє кожен запит", pl: "Kto wygrywa każde zapytanie" },
  colWinner: { en: "Winner", uk: "Переможець", pl: "Zwycięzca" },
  citableMark: { en: "citable", uk: "цитовне", pl: "do cytowania" },
  tie: { en: "tie", uk: "нічия", pl: "remis" },
  nobody: { en: "nobody answers", uk: "ніхто не відповідає", pl: "nikt nie odpowiada" },

  // ── groups
  groupsTitle: { en: "The groups this page falls into", uk: "Групи, на які розпадається сторінка", pl: "Grupy, na które dzieli się strona" },
  groupsSub: { en: (v) => `${en(v.n, "group", "groups")}, by the agent's reading`, uk: (v) => `${uk(v.n, "група", "групи", "груп")}, за прочитанням агента`, pl: (v) => `${pl(v.n, "grupa", "grupy", "grup")}, według odczytu agenta` },
  groupN: { en: (v) => `Group ${v.n}`, uk: (v) => `Група ${v.n}`, pl: (v) => `Grupa ${v.n}` },
  labelSource: { en: "label source", uk: "джерело мітки", pl: "źródło etykiety" },
  srcHeading: { en: "heading", uk: "заголовок", pl: "nagłówek" },
  srcKeywords: { en: "keywords (a hint)", uk: "ключові слова (підказка)", pl: "słowa kluczowe (wskazówka)" },
  srcNone: { en: "no label", uk: "без мітки", pl: "bez etykiety" },
  srcHeadingTitle: { en: "The page's own section heading", uk: "Власний заголовок розділу сторінки", pl: "Własny nagłówek sekcji na stronie" },
  srcKeywordsTitle: { en: "The group's two most distinctive words: a hint, not the section's name", uk: "Два найхарактерніші слова групи: підказка, а не назва розділу", pl: "Dwa najbardziej charakterystyczne słowa grupy: wskazówka, a nie nazwa sekcji" },
  ofIndexed: { en: "of the indexed text", uk: "індексованого тексту", pl: "zaindeksowanego tekstu" },
  groupsExplain: {
    en: "The large name is the agent's label for the group. Under it, the <b>label source</b>: a <b>heading</b> is the page's own section heading and can be quoted; <b>keywords</b> are the group's two most distinctive words, a hint and not what the section is called.",
    uk: "Велика назва — мітка групи від агента. Під нею <b>джерело мітки</b>: <b>заголовок</b> — власний заголовок розділу сторінки, його можна цитувати; <b>ключові слова</b> — два найхарактерніші слова групи, підказка, а не назва розділу.",
    pl: "Duża nazwa to etykieta grupy nadana przez agenta. Pod nią <b>źródło etykiety</b>: <b>nagłówek</b> to własny nagłówek sekcji na stronie i można go cytować; <b>słowa kluczowe</b> to dwa najbardziej charakterystyczne słowa grupy, wskazówka, a nie nazwa sekcji.",
  },

  // ── passages
  passagesTitle: { en: "Passages, by group", uk: "Уривки за групами", pl: "Fragmenty według grup" },
  passagesSub: { en: (v) => `in reading order inside each group; each opens with its first ${v.n} characters`, uk: (v) => `у порядку читання всередині групи; кожен показано першими ${v.n} символами`, pl: (v) => `w kolejności czytania w obrębie grupy; każdy pokazany przez pierwsze ${v.n} ${plForm(v.n, "znak", "znaki", "znaków")}` },
  showFull: { en: "Show the full passage", uk: "Показати весь уривок", pl: "Pokaż cały fragment" },
  repeats: { en: (v) => `repeats #${v.n}`, uk: (v) => `повторює #${v.n}`, pl: (v) => `powtarza #${v.n}` },
  outsideCap: {
    en: (v) => `<b>Outside cap: ${fmtN(v.n)} characters</b> at the end of the page fell past the cap. They are not passages of this reading: nothing there can be retrieved.`,
    uk: (v) => `<b>За лімітом: ${uk(v.n, "символ", "символи", "символів")}</b> наприкінці сторінки. Це не уривки цього читання: звідти нічого не можна дістати.`,
    pl: (v) => `<b>Poza limitem: ${pl(v.n, "znak", "znaki", "znaków")}</b> na końcu strony. Nie są fragmentami tego odczytu: nic stamtąd nie może zostać wyszukane.`,
  },

  // ── side path / keywords
  sideTitle: { en: "Side-path content", uk: "Побічний вміст", pl: "Treść poboczna" },
  sideSome: { en: (v) => `${en(v.n, "passage looks", "passages look")} like related links or utility copy; they are still indexed.`, uk: (v) => `${uk(v.n, "уривок схожий", "уривки схожі", "уривків схожі")} на пов’язані посилання чи службовий текст; їх однаково проіндексовано.`, pl: (v) => `${pl(v.n, "fragment wygląda", "fragmenty wyglądają", "fragmentów wygląda")} jak powiązane linki lub tekst pomocniczy; mimo to są indeksowane.` },
  sideNone: { en: "No passage looks like related links or utility copy.", uk: "Жоден уривок не схожий на пов’язані посилання чи службовий текст.", pl: "Żaden fragment nie wygląda jak powiązane linki ani tekst pomocniczy." },
  relatedLink: { en: "related link", uk: "пов’язане посилання", pl: "powiązany link" },
  utilityCopy: { en: "utility copy", uk: "службовий текст", pl: "tekst pomocniczy" },
  kwTitle: { en: "The page's vocabulary", uk: "Словник сторінки", pl: "Słownictwo strony" },
  kwHonest: {
    en: (v) => `What the page says, not search demand — for how people ask, use the query test or ${v.link}.`,
    uk: (v) => `Це те, що каже сторінка, а не пошуковий попит. Як питають люди — покаже тест запитів або ${v.link}.`,
    pl: (v) => `To, co mówi strona, a nie popyt w wyszukiwarce. Jak pytają ludzie, pokaże test zapytań lub ${v.link}.`,
  },
  phrasesTitle: { en: "Phrases this page owns", uk: "Фрази, що належать цій сторінці", pl: "Frazy charakterystyczne dla tej strony" },
  phrasesNote: {
    en: "Two to four words the page writes together, in at least two passages (or three times in one), never across punctuation or a stopword. Ranked by passages covered, then uses. A highlighted phrase reaches most of the page's groups.",
    uk: "Від двох до чотирьох слів, які сторінка пише разом, щонайменше у двох уривках (або тричі в одному), ніколи через розділовий знак чи службове слово. Порядок — за кількістю уривків, далі за вживаннями. Виділена фраза охоплює більшість груп сторінки.",
    pl: "Od dwóch do czterech słów, które strona pisze razem, w co najmniej dwóch fragmentach (lub trzy razy w jednym), nigdy przez znak interpunkcyjny ani słowo funkcyjne. Kolejność według liczby fragmentów, potem liczby użyć. Wyróżniona fraza obejmuje większość grup strony.",
  },
  narrativeTitle: { en: "Narrative words", uk: "Слова розповіді", pl: "Słowa narracji" },
  narrativeNote: {
    en: "Single words, counted only where no phrase above already used them. They say what the page talks about; they are rarely what anybody types or asks.",
    uk: "Окремі слова, пораховані лише там, де їх не використала жодна фраза вище. Вони кажуть, про що говорить сторінка; але люди рідко саме так пишуть чи питають.",
    pl: "Pojedyncze słowa, liczone tylko tam, gdzie nie użyła ich już żadna fraza powyżej. Mówią, o czym jest strona; rzadko jednak ktoś tak właśnie wpisuje albo pyta.",
  },
  noPhrases: { en: "No phrase is written often enough to count.", uk: "Жодну фразу не написано достатньо часто, щоб її врахувати.", pl: "Żadna fraza nie występuje dość często, by ją uwzględnić." },
  none: { en: "None.", uk: "Немає.", pl: "Brak." },
  kwTitleAttr: {
    en: (v) => `${v.count} uses, in ${v.passages} passages and ${v.groups} of ${v.total} groups`,
    uk: (v) => `вживань: ${v.count}, уривків: ${v.passages}, груп: ${v.groups} з ${v.total}`,
    pl: (v) => `użycia: ${v.count}, fragmenty: ${v.passages}, grupy: ${v.groups} z ${v.total}`,
  },

  // ── facts
  facts: { en: "Citable facts", uk: "Факти для цитування", pl: "Fakty do cytowania" },
  factsSub: { en: "the agent's list of the concrete facts, figures and claims the passages state", uk: "перелік конкретних фактів, чисел і тверджень з уривків, складений агентом", pl: "lista konkretnych faktów, liczb i twierdzeń z fragmentów, sporządzona przez agenta" },
  colFact: { en: "Fact", uk: "Факт", pl: "Fakt" },
  stated: { en: "stated", uk: "є", pl: "jest" },
  notStated: { en: "not stated", uk: "немає", pl: "brak" },
  onlyHere: { en: "only this page", uk: "лише тут", pl: "tylko tutaj" },

  // ── diff
  diff: { en: "Since the baseline", uk: "Порівняно з базовою версією", pl: "W porównaniu z wersją bazową" },
  diffSub: { en: (v) => `against the reading of ${v.url}`, uk: (v) => `відносно читання ${v.url}`, pl: (v) => `względem odczytu ${v.url}` },
  diffCounts: {
    en: (v) => `${v.same} unchanged · ${v.changed} changed · ${v.added} added · ${v.removed} removed`,
    uk: (v) => `без змін: ${v.same} · змінено: ${v.changed} · додано: ${v.added} · вилучено: ${v.removed}`,
    pl: (v) => `bez zmian: ${v.same} · zmienione: ${v.changed} · dodane: ${v.added} · usunięte: ${v.removed}`,
  },
  colMeasure: { en: "Measure", uk: "Показник", pl: "Wskaźnik" },
  colBefore: { en: "Baseline", uk: "Було", pl: "Było" },
  colAfter: { en: "Now", uk: "Зараз", pl: "Teraz" },
  mPassages: { en: "Passages", uk: "Уривки", pl: "Fragmenty" },
  mWords: { en: "Words", uk: "Слова", pl: "Słowa" },
  mCap: { en: "Cap reached", uk: "Ліміт досягнуто", pl: "Osiągnięto limit" },
  mUnread: { en: "Characters past the cap", uk: "Символи за лімітом", pl: "Znaki poza limitem" },
  stSame: { en: "unchanged", uk: "без змін", pl: "bez zmian" },
  stChanged: { en: "changed", uk: "змінено", pl: "zmieniony" },
  stAdded: { en: "added", uk: "додано", pl: "dodany" },
  stRemoved: { en: "removed", uk: "вилучено", pl: "usunięty" },
  groupChanges: { en: "Group changes", uk: "Зміни груп", pl: "Zmiany grup" },
  cameFrom: { en: "came from", uk: "походить з", pl: "pochodzi z" },
  newText: { en: "new text", uk: "новий текст", pl: "nowy tekst" },
  wasN: { en: (v) => `was #${v.n}`, uk: (v) => `було #${v.n}`, pl: (v) => `było #${v.n}` },

  // ── compare
  compareTitle: { en: (v) => `${v.n} pages, one topic dictionary`, uk: (v) => `${v.n} ${ukForm(v.n, "сторінка", "сторінки", "сторінок")}, один словник тем`, pl: (v) => `${v.n} ${plForm(v.n, "strona", "strony", "stron")}, jeden słownik tematów` },
  pagesTitle: { en: "The pages", uk: "Сторінки", pl: "Strony" },
  colPage: { en: "Page", uk: "Сторінка", pl: "Strona" },
  colWords: { en: "Words", uk: "Слова", pl: "Słowa" },
  colPassages: { en: "Passages", uk: "Уривки", pl: "Fragmenty" },
  colPastCap: { en: "Past cap", uk: "За лімітом", pl: "Poza limitem" },
  colBlocked: { en: "AI crawlers blocked", uk: "Заблоковані ШІ-краулери", pl: "Zablokowane crawlery AI" },
  colFindings: { en: "Findings", uk: "Знахідки", pl: "Wyniki" },
  topicTable: { en: "Topics × pages", uk: "Теми × сторінки", pl: "Tematy × strony" },
  topicTableSub: { en: "passages and characters each page spends on each shared topic", uk: "скільки уривків і символів кожна сторінка віддає кожній спільній темі", pl: "ile fragmentów i znaków każda strona poświęca każdemu wspólnemu tematowi" },
  colTopic: { en: "Topic", uk: "Тема", pl: "Temat" },
  topicGaps: { en: "Topic gaps", uk: "Прогалини в темах", pl: "Luki w tematach" },
  topicGapsSub: { en: "topics the other pages cover and this one does not", uk: "теми, які мають інші сторінки, а ця — ні", pl: "tematy, które poruszają inne strony, a ta nie" },
  noGaps: { en: "no gaps", uk: "прогалин немає", pl: "brak luk" },
  factGaps: { en: "Fact gaps", uk: "Прогалини у фактах", pl: "Luki w faktach" },
  factGapsSub: { en: "which page states a fact the others lack", uk: "яка сторінка має факт, якого бракує іншим", pl: "która strona podaje fakt, którego brakuje pozostałym" },
  crawlersByPage: { en: "AI crawlers by page", uk: "ШІ-краулери за сторінками", pl: "Crawlery AI według stron" },
  findingsByPage: { en: "Findings by page", uk: "Знахідки за сторінками", pl: "Wyniki według stron" },
  readingByPage: { en: "Each page's reading", uk: "Читання кожної сторінки", pl: "Odczyt każdej strony" },

  // ── closing / footer
  closingCut: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot: ${fmtN(v.n)} characters at the end of it are not indexed and cannot be retrieved to answer anything.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця: ${uk(v.n, "символ", "символи", "символів")} наприкінці не потрапили в індекс і не можуть стати відповіддю ні на що.`,
    pl: (v) => `Strona wnosi najwyżej ${v.cap} ${plForm(v.cap, "fragment", "fragmenty", "fragmentów")}, a ta zajęła wszystkie miejsca: tekst na jej końcu (${pl(v.n, "znak", "znaki", "znaków")}) nie trafia do indeksu i nie może zostać wyszukany jako odpowiedź na cokolwiek.`,
  },
  closingFull: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot. The character count shows nothing past the cap, but because passages overlap, a short tail at the end of the page may still have gone unread.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця. Лічильник не показує тексту за лімітом, але через перекриття уривків короткий хвіст сторінки все ж міг лишитися непрочитаним.`,
    pl: (v) => `Strona wnosi najwyżej ${v.cap} ${plForm(v.cap, "fragment", "fragmenty", "fragmentów")}, a ta zajęła wszystkie miejsca. Licznik znaków nie pokazuje niczego poza limitem, ale ponieważ fragmenty na siebie zachodzą, krótka końcówka strony mogła mimo to zostać nieprzeczytana.`,
  },
  closingFullExact: {
    en: (v) => `A page contributes at most ${v.cap} passages, and this one filled every slot; the last passage reaches the end of the kept text, so nothing fell past the cap.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}, і ця зайняла всі місця; останній уривок доходить до кінця збереженого тексту, тож за ліміт нічого не вийшло.`,
    pl: (v) => `Strona wnosi najwyżej ${v.cap} ${plForm(v.cap, "fragment", "fragmenty", "fragmentów")}, a ta zajęła wszystkie miejsca; ostatni fragment sięga końca zachowanego tekstu, więc nic nie znalazło się poza limitem.`,
  },
  closingFits: {
    en: (v) => `A page contributes at most ${v.cap} passages; this one needed ${v.n}, so none of its extracted text fell past the cap.`,
    uk: (v) => `Сторінка дає щонайбільше ${v.cap} ${ukForm(v.cap, "уривок", "уривки", "уривків")}; цій знадобилося ${v.n}, тож жоден видобутий текст не вийшов за ліміт.`,
    pl: (v) => `Strona wnosi najwyżej ${v.cap} ${plForm(v.cap, "fragment", "fragmenty", "fragmentów")}; ta potrzebowała ${v.n}, więc żaden wyodrębniony tekst nie znalazł się poza limitem.`,
  },
  fine: {
    en: "This is a preview of the machine's view, not a guarantee of what any assistant does with it: it does not establish that any assistant has indexed the page, and each system chunks, embeds and caps in its own way.",
    uk: "Це попередній перегляд того, що бачить машина, а не гарантія того, що з цим зробить будь-який асистент: звідси не випливає, що якийсь асистент проіндексував сторінку, а кожна система нарізає, вбудовує й обмежує по-своєму.",
    pl: "To podgląd tego, co widzi maszyna, a nie gwarancja tego, co zrobi z tym którykolwiek asystent: nie wynika stąd, że jakikolwiek asystent zaindeksował stronę, a każdy system tnie, tworzy embeddingi i ustala limity po swojemu.",
  },
  footerMadeRefused: {
    en: "Made with the vectorscope skill: the scripts fetched the page, found it was in Russian and kept nothing of it; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку, визначили, що вона російською, і нічого з неї не зберегли; жодної моделі чи ембедингів не викликано.",
    pl: "Wykonano skillem vectorscope: skrypty pobrały stronę, ustaliły, że jest po rosyjsku, i nic z niej nie zachowały; nie wywołano żadnego modelu ani embeddingów.",
  },
  footerMade: {
    en: "Made with the vectorscope skill: the scripts fetched the page and its robots.txt and sent nothing anywhere; no model or embedding was called.",
    uk: "Зроблено навичкою vectorscope: скрипти завантажили сторінку та її robots.txt і нікуди нічого не надсилали; жодної моделі чи ембедингів не викликано.",
    pl: "Wykonano skillem vectorscope: skrypty pobrały stronę i jej robots.txt i nigdzie niczego nie wysłały; nie wywołano żadnego modelu ani embeddingów.",
  },
  footerAuthor: { en: "the author", uk: "автор", pl: "autor" },
};

/**
 * Copy for each check code: a title and what to tell the user. `what` turns the evidence into a
 * sentence (values arrive HTML-safe); `tell` is the advice.
 */
export const CHECK_COPY = {
  robots_unreachable: {
    title: { en: "robots.txt did not answer", uk: "robots.txt не відповідає", pl: "robots.txt nie odpowiada" },
    what: { en: (v) => `${v.url || "robots.txt"} returned ${v.httpStatus ? `HTTP ${v.httpStatus}` : "no answer"}.`, uk: (v) => `${v.url || "robots.txt"} повернув ${v.httpStatus ? `HTTP ${v.httpStatus}` : "порожнечу"}.`, pl: (v) => `${v.url || "robots.txt"} zwrócił ${v.httpStatus ? `HTTP ${v.httpStatus}` : "brak odpowiedzi"}.` },
    tell: { en: "Under RFC 9309 a crawler that cannot read robots.txt assumes it may fetch nothing. Make robots.txt answer 200 (or 404 if you want no rules).", uk: "За RFC 9309 краулер, який не може прочитати robots.txt, вважає, що не може завантажувати нічого. Зробіть так, щоб robots.txt відповідав 200 (або 404, якщо правил не треба).", pl: "Według RFC 9309 crawler, który nie może odczytać robots.txt, zakłada, że nie może pobierać niczego. Niech robots.txt odpowiada kodem 200 (lub 404, jeśli nie chcesz żadnych reguł)." },
  },
  ai_search_blocked: {
    title: { en: "AI search and answer crawlers are blocked", uk: "Заблоковано пошукових ШІ-краулерів і тих, що відповідають", pl: "Zablokowane są crawlery AI do wyszukiwania i odpowiedzi" },
    what: { en: (v) => `Blocked for this path: ${v.bots}.`, uk: (v) => `Для цього шляху заблоковано: ${v.bots}.`, pl: (v) => `Zablokowane dla tej ścieżki: ${v.bots}.` },
    tell: { en: "These crawlers fetch pages to answer people. While they are disallowed, the rest of this report is moot for those assistants. Remove the Disallow for them if you want to be cited.", uk: "Ці краулери завантажують сторінки, щоб відповідати людям. Поки їм заборонено, решта звіту для цих асистентів не має значення. Зніміть Disallow для них, якщо хочете, щоб вас цитували.", pl: "Te crawlery pobierają strony, żeby odpowiadać ludziom. Dopóki są zablokowane, reszta raportu nie ma dla tych asystentów znaczenia. Usuń dla nich Disallow, jeśli chcesz być cytowany." },
  },
  ai_training_blocked: {
    title: { en: "Training crawlers are blocked", uk: "Краулерів для навчання заблоковано", pl: "Crawlery treningowe są zablokowane" },
    what: { en: (v) => `Blocked: ${v.bots}.`, uk: (v) => `Заблоковано: ${v.bots}.`, pl: (v) => `Zablokowane: ${v.bots}.` },
    tell: { en: "Usually a deliberate choice: these collect model-training data and do not decide whether an assistant can cite you today. Keep it if it was meant.", uk: "Зазвичай це свідомий вибір: ці краулери збирають дані для навчання моделей і не вирішують, чи процитує вас асистент сьогодні. Залиште, якщо так і задумано.", pl: "Zwykle to świadomy wybór: te crawlery zbierają dane do trenowania modeli i nie decydują o tym, czy asystent może cię dziś zacytować. Zostaw tak, jeśli to zamierzone." },
  },
  noindex: {
    title: { en: "The page asks not to be indexed", uk: "Сторінка просить її не індексувати", pl: "Strona prosi, by jej nie indeksować" },
    what: { en: "meta robots carries noindex.", uk: "meta robots містить noindex.", pl: "meta robots zawiera noindex." },
    tell: { en: "Search indexes that assistants answer from will drop the page. Remove noindex unless that is the intent.", uk: "Пошукові індекси, з яких відповідають асистенти, викинуть сторінку. Приберіть noindex, якщо це не навмисно.", pl: "Indeksy wyszukiwarek, z których odpowiadają asystenci, pominą tę stronę. Usuń noindex, chyba że to zamierzone." },
  },
  header_noindex: {
    title: { en: "The response header says not to index", uk: "Заголовок відповіді каже не індексувати", pl: "Nagłówek odpowiedzi zabrania indeksowania" },
    what: { en: (v) => `X-Robots-Tag is “${v.value}”.`, uk: (v) => `X-Robots-Tag — «${v.value}».`, pl: (v) => `X-Robots-Tag to „${v.value}”.` },
    tell: { en: "Same effect as meta robots noindex: search indexes that assistants answer from will drop the page. Remove it unless that is the intent.", uk: "Такий самий ефект, як noindex у meta robots: пошукові індекси, з яких відповідають асистенти, викинуть сторінку. Приберіть його, якщо це не навмисно.", pl: "Ten sam skutek co noindex w meta robots: indeksy wyszukiwarek, z których odpowiadają asystenci, pominą tę stronę. Usuń go, chyba że to zamierzone." },
  },
  js_dependent: {
    title: { en: "Most of the page needs JavaScript", uk: "Більша частина сторінки потребує JavaScript", pl: "Większość strony wymaga JavaScript" },
    what: { en: (v) => `${fmtN(v.withJs)} words with JavaScript, ${fmtN(v.withoutJs)} without.`, uk: (v) => `${fmtUk(v.withJs)} слів з JavaScript, ${fmtUk(v.withoutJs)} без нього.`, pl: (v) => `Z JavaScript: ${pl(v.withJs, "słowo", "słowa", "słów")}, bez niego: ${fmtPl(v.withoutJs)}.` },
    tell: { en: "A retriever that does not run JavaScript reads the smaller number. Render the content on the server.", uk: "Ретривер, який не виконує JavaScript, читає меншу кількість. Рендерте вміст на сервері.", pl: "System wyszukiwania, który nie uruchamia JavaScript, odczyta mniejszą liczbę. Renderuj treść po stronie serwera." },
  },
  cap_overflow: {
    title: { en: "Text fell past the 26-passage cap", uk: "Текст вийшов за ліміт у 26 уривків", pl: "Tekst wyszedł poza limit 26 fragmentów" },
    what: { en: (v) => `${fmtN(v.charsPastCap ?? v.charsUnread)} characters after passage #${v.last} are never stored.`, uk: (v) => `${uk(v.charsPastCap ?? v.charsUnread, "символ", "символи", "символів")} після уривка #${v.last} ніколи не зберігаються.`, pl: (v) => `Po fragmencie #${v.last} nigdy nie zostaje zapisane: ${pl(v.charsPastCap ?? v.charsUnread, "znak", "znaki", "znaków")}.` },
    tell: { en: "Move what matters earlier, cut repetition, or split the page so each part has its own 26 slots.", uk: "Перенесіть важливе вище, приберіть повтори або розділіть сторінку, щоб кожна частина мала власні 26 місць.", pl: "Przenieś to, co ważne, wyżej, usuń powtórzenia albo podziel stronę, aby każda część miała własne 26 miejsc." },
  },
  lost_faq_questions: {
    title: { en: "FAQ answers without their questions", uk: "Відповіді FAQ без запитань", pl: "Odpowiedzi FAQ bez pytań" },
    what: { en: (v) => `${v.answers} sentences open with an answer ("Yes.", "No.") and the passage holds ${v.questions} question mark(s).`, uk: (v) => `${v.answers} речень починаються з відповіді («Так.», «Ні.»), а в уривку лише ${v.questions} знак(и) питання.`, pl: (v) => `Zdania zaczynające się od odpowiedzi („Tak.”, „Nie.”): ${v.answers}; znaki zapytania we fragmencie: ${v.questions}.` },
    tell: { en: "The questions are probably in buttons or accordions the extractor drops. Put each question as visible text (an h3 or a bold line) right before its answer.", uk: "Запитання, імовірно, сидять у кнопках чи акордеонах, які екстрактор відкидає. Зробіть кожне запитання видимим текстом (h3 або жирний рядок) просто перед відповіддю.", pl: "Pytania są prawdopodobnie w przyciskach lub akordeonach, które ekstraktor pomija. Umieść każde pytanie jako widoczny tekst (h3 lub pogrubiony wiersz) tuż przed odpowiedzią." },
  },
  dominant_heading: {
    title: { en: "One heading carries too much of the page", uk: "Один заголовок несе забагато сторінки", pl: "Jeden nagłówek obejmuje zbyt dużą część strony" },
    what: { en: (v) => `${v.heading ? `“${v.heading}”` : "Text with no heading"} holds ${pct(v.share)} of the indexed text.`, uk: (v) => `${v.heading ? `«${v.heading}»` : "Текст без заголовка"} містить ${pct(v.share)} індексованого тексту.`, pl: (v) => `${v.heading ? `„${v.heading}”` : "Tekst bez nagłówka"} obejmuje ${pct(v.share)} zaindeksowanego tekstu.` },
    tell: { en: "The chunker splits only at h2. If this part has subtopics, they are h3s or styled text; make them real h2 headings so each becomes its own passage.", uk: "Нарізувач ділить лише за h2. Якщо в цій частині є підтеми, вони оформлені як h3 або стилізований текст; зробіть їх справжніми h2, щоб кожна стала окремим уривком.", pl: "Cięcie następuje tylko na h2. Jeśli ta część ma podtematy, są one oznaczone jako h3 lub stylizowany tekst; zrób z nich prawdziwe nagłówki h2, aby każdy stał się osobnym fragmentem." },
  },
  mid_sentence_start: {
    title: { en: "Passages that start mid-sentence", uk: "Уривки, що починаються посеред речення", pl: "Fragmenty zaczynające się w środku zdania" },
    what: { en: (v) => `${v.count} passage(s) open on a lowercase word or a punctuation mark.`, uk: (v) => `Уривків, що починаються з малої літери чи розділового знака: ${v.count}.`, pl: (v) => `Fragmenty zaczynające się od małej litery lub znaku interpunkcyjnego: ${v.count}.` },
    tell: { en: "The section was longer than 2,000 characters and the window cut it. Break long sections with h2 headings so passages start where a topic starts.", uk: "Розділ був довший за 2 000 символів, і вікно його розрізало. Розбийте довгі розділи заголовками h2, щоб уривки починалися там, де починається тема.", pl: "Sekcja była dłuższa niż 2 000 znaków i okno ją przecięło. Podziel długie sekcje nagłówkami h2, aby fragmenty zaczynały się tam, gdzie zaczyna się temat." },
  },
  nav_in_content: {
    title: { en: "Navigation inside the content", uk: "Навігація всередині вмісту", pl: "Nawigacja wewnątrz treści" },
    what: { en: (v) => `${v.runs} run(s) of four or more one-or-two-word lines.`, uk: (v) => `Серій із чотирьох і більше рядків по одному-два слова: ${v.runs}.`, pl: (v) => `Ciągi czterech lub więcej wierszy po jedno-dwa słowa: ${v.runs}.` },
    tell: { en: "Menus, tag lists or label tables inside the main region become passage text. Wrap them in nav or move them out of main.", uk: "Меню, списки тегів чи таблиці підписів у головній області стають текстом уривків. Загорніть їх у nav або винесіть з main.", pl: "Menu, listy tagów czy tabele etykiet w obszarze głównym stają się tekstem fragmentów. Umieść je w nav albo przenieś poza main." },
  },
  thin_section: {
    title: { en: "Thin sections", uk: "Тонкі розділи", pl: "Ubogie sekcje" },
    what: { en: (v) => `${v.count} heading(s) with fewer than 150 characters under them.`, uk: (v) => `Заголовків, під якими менше 150 символів: ${v.count}.`, pl: (v) => `Nagłówki, pod którymi jest mniej niż 150 znaków: ${v.count}.` },
    tell: { en: "A passage this short cannot answer much on its own. Merge it into a neighbour or say what the heading promises.", uk: "Такий короткий уривок мало що може відповісти сам. Об’єднайте його з сусіднім або напишіть те, що обіцяє заголовок.", pl: "Tak krótki fragment niewiele wyjaśni sam. Połącz go z sąsiednim albo napisz to, co zapowiada nagłówek." },
  },
  truncated_teaser: {
    title: { en: "Truncated teasers", uk: "Обрізані анонси", pl: "Ucięte zajawki" },
    what: { en: (v) => `${v.count} line(s) end in “…”.`, uk: (v) => `Рядків, що закінчуються на «…»: ${v.count}.`, pl: (v) => `Wiersze kończące się na „…”: ${v.count}.` },
    tell: { en: "A cut-off teaser gives the retriever half a claim. Finish the sentence or drop the teaser.", uk: "Обрізаний анонс дає ретриверу половину твердження. Допишіть речення або приберіть анонс.", pl: "Ucięta zajawka daje systemowi wyszukiwania pół twierdzenia. Dokończ zdanie albo usuń zajawkę." },
  },
  repeated_claim: {
    title: { en: "The same words in most groups", uk: "Ті самі слова в більшості груп", pl: "Te same słowa w większości grup" },
    what: { en: (v) => `${v.n} phrase(s) recur across at least half of the ${v.groupCount} groups.`, uk: (v) => `Фраз, що повторюються щонайменше в половині з ${v.groupCount} груп: ${v.n}.`, pl: (v) => `Frazy powtarzające się w co najmniej połowie z ${v.groupCount} ${plForm(v.groupCount, "grupy", "grup", "grup")}: ${v.n}.` },
    tell: { en: "Repetition spends passages on what was already said and blurs the groups. Say it once, where it belongs.", uk: "Повтори витрачають уривки на вже сказане й розмивають групи. Скажіть це один раз, там, де йому місце.", pl: "Powtórzenia zużywają fragmenty na to, co już powiedziano, i rozmywają grupy. Powiedz to raz, tam, gdzie pasuje." },
  },
  canonical_other: {
    title: { en: "Canonical points elsewhere", uk: "Canonical вказує на іншу сторінку", pl: "Canonical wskazuje gdzie indziej" },
    what: { en: (v) => `rel=canonical names ${v.href}.`, uk: (v) => `rel=canonical називає ${v.href}.`, pl: (v) => `rel=canonical wskazuje ${v.href}.` },
    tell: { en: "Search indexes will prefer that URL; the passages here may be stored under it or not at all. Point canonical at this page if it is the original.", uk: "Пошукові індекси віддадуть перевагу тій адресі; уривки звідси можуть зберегтися під нею або не зберегтися взагалі. Вкажіть canonical на цю сторінку, якщо вона оригінал.", pl: "Indeksy wyszukiwarek wybiorą tamten URL; fragmenty z tej strony mogą zostać zapisane pod nim albo wcale. Wskaż w canonical tę stronę, jeśli to ona jest oryginałem." },
  },
  canonical_multiple: {
    title: { en: "More than one canonical", uk: "Більше одного canonical", pl: "Więcej niż jeden canonical" },
    what: { en: (v) => `${v.count} rel=canonical links.`, uk: (v) => `Посилань rel=canonical: ${v.count}.`, pl: (v) => `Linki rel=canonical: ${v.count}.` },
    tell: { en: "Conflicting canonicals are usually ignored. Keep exactly one.", uk: "Суперечливі canonical зазвичай ігнорують. Залиште рівно один.", pl: "Sprzeczne canonical są zwykle ignorowane. Zostaw dokładnie jeden." },
  },
  canonical_relative: {
    title: { en: "Relative canonical", uk: "Відносний canonical", pl: "Względny canonical" },
    what: { en: (v) => `rel=canonical is “${v.href}”.`, uk: (v) => `rel=canonical — «${v.href}».`, pl: (v) => `rel=canonical to „${v.href}”.` },
    tell: { en: "It works, but an absolute URL leaves nothing to resolve. Write the full https:// address.", uk: "Це працює, але абсолютна адреса не залишає місця для помилки. Напишіть повну адресу https://.", pl: "To działa, ale bezwzględny URL nie zostawia niczego do rozwiązywania. Wpisz pełny adres https://." },
  },
  canonical_missing: {
    title: { en: "No canonical", uk: "Немає canonical", pl: "Brak canonical" },
    what: { en: "The page has no rel=canonical link.", uk: "На сторінці немає посилання rel=canonical.", pl: "Strona nie ma linku rel=canonical." },
    tell: { en: "Add one pointing at this URL, so copies with tracking parameters fold into it.", uk: "Додайте його з адресою цієї сторінки, щоб копії з параметрами відстеження зводилися до неї.", pl: "Dodaj go z adresem tej strony, aby kopie z parametrami śledzenia były do niej sprowadzane." },
  },
  jsonld_invalid: {
    title: { en: "Broken structured data", uk: "Зламані структуровані дані", pl: "Uszkodzone dane strukturalne" },
    what: { en: (v) => `${v.invalid} of ${v.blocks} JSON-LD block(s) are not valid JSON.`, uk: (v) => `${v.invalid} з ${v.blocks} блоків JSON-LD — невалідний JSON.`, pl: (v) => `${v.invalid} z ${v.blocks} ${plForm(v.blocks, "bloku", "bloków", "bloków")} JSON-LD to niepoprawny JSON.` },
    tell: { en: "An unparseable block is ignored whole. Validate it.", uk: "Блок, який не розбирається, ігнорують повністю. Перевірте його валідатором.", pl: "Blok, którego nie da się sparsować, jest ignorowany w całości. Sprawdź go walidatorem." },
  },
  jsonld_none: {
    title: { en: "No structured data", uk: "Немає структурованих даних", pl: "Brak danych strukturalnych" },
    what: { en: "No JSON-LD on the page.", uk: "На сторінці немає JSON-LD.", pl: "Na stronie nie ma JSON-LD." },
    tell: { en: "Not needed for the passages, but FAQPage, HowTo, Product or Article markup states what the page is in a form machines read without guessing.", uk: "Для уривків це не обов’язково, але розмітка FAQPage, HowTo, Product чи Article каже, що це за сторінка, у формі, яку машини читають без здогадок.", pl: "Fragmentom nie jest to potrzebne, ale znaczniki FAQPage, HowTo, Product czy Article mówią, czym jest strona, w formie, którą maszyny czytają bez zgadywania." },
  },
  meta_description_missing: {
    title: { en: "No meta description", uk: "Немає meta description", pl: "Brak meta description" },
    what: { en: "The intro passage (#0) has only the title and h1.", uk: "Вступний уривок (#0) має лише title і h1.", pl: "Fragment wstępny (#0) zawiera tylko title i h1." },
    tell: { en: "The chunker puts the description into passage #0. Write one or two sentences that say what the page answers.", uk: "Нарізувач додає опис в уривок #0. Напишіть одне-два речення про те, на що відповідає сторінка.", pl: "Przy cięciu opis trafia do fragmentu #0. Napisz jedno lub dwa zdania o tym, na co strona odpowiada." },
  },
  meta_description_short: {
    title: { en: "Short meta description", uk: "Короткий meta description", pl: "Krótki meta description" },
    what: { en: (v) => `${v.length} characters.`, uk: (v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.`, pl: (v) => `${v.length} ${plForm(v.length, "znak", "znaki", "znaków")}.` },
    tell: { en: "It is part of passage #0. Say what the page answers, in 70–160 characters.", uk: "Він входить в уривок #0. Скажіть, на що відповідає сторінка, у 70–160 символах.", pl: "Jest częścią fragmentu #0. Napisz, na co strona odpowiada, w 70–160 znakach." },
  },
  meta_description_long: {
    title: { en: "Long meta description", uk: "Довгий meta description", pl: "Długi meta description" },
    what: { en: (v) => `${v.length} characters.`, uk: (v) => `${v.length} ${ukForm(v.length, "символ", "символи", "символів")}.`, pl: (v) => `${v.length} ${plForm(v.length, "znak", "znaki", "znaków")}.` },
    tell: { en: "Snippets cut it at about 160 characters. Put the answer first.", uk: "Сніпети обрізають його приблизно на 160 символах. Поставте відповідь на початок.", pl: "Fragmenty w wynikach wyszukiwania ucinają go po około 160 znakach. Zacznij od odpowiedzi." },
  },
  cache_control_no_store: {
    title: { en: "The page says not to store it", uk: "Сторінка каже не зберігати її", pl: "Strona prosi, by jej nie przechowywać" },
    what: { en: (v) => `Cache-Control is “${v.value}”.`, uk: (v) => `Cache-Control — «${v.value}».`, pl: (v) => `Cache-Control to „${v.value}”.` },
    tell: { en: "no-store tells caches not to keep a copy. It does not by itself hide the page from assistants, but a crawler that honours it reads the page fresh every time.", uk: "no-store каже кешам не зберігати копію. Саме по собі це не ховає сторінку від асистентів, але краулер, який це поважає, читає її заново щоразу.", pl: "no-store każe pamięciom podręcznym nie przechowywać kopii. Samo w sobie nie ukrywa to strony przed asystentami, ale crawler, który tego przestrzega, za każdym razem czyta stronę od nowa." },
  },
  img_missing_alt: {
    title: { en: "Images with no alt text", uk: "Зображення без alt-тексту", pl: "Obrazy bez tekstu alt" },
    what: { en: (v) => `${v.count} image(s) have no alt attribute.`, uk: (v) => `Зображень без атрибута alt: ${v.count}.`, pl: (v) => `Obrazy bez atrybutu alt: ${v.count}.` },
    tell: { en: "A retriever and a screen reader both read the alt. Describe what the image shows, or set alt=\"\" if it is purely decorative.", uk: "І ретривер, і скрінрідер читають alt. Опишіть, що на зображенні, або поставте alt=\"\", якщо воно суто декоративне.", pl: "Zarówno system wyszukiwania, jak i czytnik ekranu czytają alt. Opisz, co przedstawia obraz, albo ustaw alt=\"\", jeśli jest czysto dekoracyjny." },
  },
  img_filename_alt: {
    title: { en: "Alt text that is only a filename", uk: "Alt-текст — лише назва файлу", pl: "Tekst alt to tylko nazwa pliku" },
    what: { en: (v) => `${v.count} image(s) have an alt that is only a file name.`, uk: (v) => `Зображень, де alt — лише назва файлу: ${v.count}.`, pl: (v) => `Obrazy, w których alt to tylko nazwa pliku: ${v.count}.` },
    tell: { en: "A file name says nothing about the image. Write what it shows.", uk: "Назва файлу нічого не каже про зображення. Напишіть, що на ньому.", pl: "Nazwa pliku nic nie mówi o obrazie. Napisz, co on przedstawia." },
  },
  heading_skip: {
    title: { en: "Headings that skip a level", uk: "Заголовки, що пропускають рівень", pl: "Nagłówki pomijające poziom" },
    what: { en: (v) => `${v.count} heading(s) jump a level (h1 → h3, h2 → h4).`, uk: (v) => `Заголовків, що стрибають через рівень (h1 → h3, h2 → h4): ${v.count}.`, pl: (v) => `Nagłówki przeskakujące poziom (h1 → h3, h2 → h4): ${v.count}.` },
    tell: { en: "A retriever and a screen reader both follow the heading order. Keep the levels consecutive.", uk: "І ретривер, і скрінрідер ідуть за порядком заголовків. Тримайте рівні послідовними.", pl: "Zarówno system wyszukiwania, jak i czytnik ekranu idą za kolejnością nagłówków. Zachowuj kolejne poziomy bez przeskoków." },
  },
  multiple_h1: {
    title: { en: "More than one h1", uk: "Більше одного h1", pl: "Więcej niż jeden h1" },
    what: { en: (v) => `${v.count} h1 headings.`, uk: (v) => `Заголовків h1: ${v.count}.`, pl: (v) => `Nagłówki h1: ${v.count}.` },
    tell: { en: "One page, one main subject: keep a single h1 and let the rest be h2 and below.", uk: "Одна сторінка — один головний предмет: лишіть один h1, а решта нехай буде h2 і нижче.", pl: "Jedna strona, jeden główny temat: zostaw jeden h1, a resztę niech stanowią h2 i niższe." },
  },
  robots_not_checked: {
    title: { en: "robots.txt not checked", uk: "robots.txt не перевірено", pl: "Nie sprawdzono robots.txt" },
    what: { en: "This run read a saved page.", uk: "Цей запуск читав збережену сторінку.", pl: "To uruchomienie odczytało zapisaną stronę." },
    tell: { en: "Run read.mjs on the live URL to check the AI crawlers.", uk: "Запустіть read.mjs на живій адресу, щоб перевірити ШІ-краулерів.", pl: "Uruchom read.mjs na aktywnym URL, aby sprawdzić crawlery AI." },
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
