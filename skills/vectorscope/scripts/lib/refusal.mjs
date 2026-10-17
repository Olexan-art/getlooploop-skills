// Pages in Russian are not analysed. This module is the one place the refusal's words, facts and
// sources live, in English and Ukrainian, so a later version updates them here and nowhere else.
// The text was approved word for word: change it only with the same approval.
// **…** marks the spans shown in bold; html.mjs and lens.mjs turn them into <b> or keep them.
// tests/refusal.test.mjs checks that both languages carry the same links and the same numbers.

export const REFUSAL_CODE = "refused_language_ru";

// The date the Prosecutor General's figures were published; update it with them.
export const PROSECUTOR_FIGURES_AS_OF = "2025-11-05";

export const REFUSAL_COPY = {
  title: { en: "This page was not analysed", uk: "Цю сторінку не проаналізовано" },
  lead: {
    en: "Vectorscope does not analyse pages written in Russian, or sites in Russia's domain zone, hosted in Russia or with a Russian-language version. This is the publisher's decision, made because of Russia's war against Ukraine. These are the findings it rests on:",
    uk: "Vectorscope не аналізує сторінки російською мовою, а також сайти в доменній зоні Росії, розміщені в Росії або з російськомовною версією. Це рішення автора інструмента через війну Росії проти України. Воно спирається на такі висновки:",
  },
  sanctionsLabel: { en: "Sanctions", uk: "Санкції" },
  sanctions: {
    en: "If this site is operated by people or companies in Russia, it may be subject to sanctions. Check the official lists:",
    uk: "Якщо сайт належить особам чи компаніям у Росії, він може підпадати під санкції. Перевірте офіційні списки:",
  },
};

// 2.110: four signals refuse, checked in this order; the reading names the one that fired, and
// the report adds its one reason line under the same refusal block.
export const REFUSED_RU_DOMAIN = "refused_ru_domain";
export const REFUSED_RU_HOSTING = "refused_ru_hosting";
export const REFUSED_RU_AUDIENCE = "refused_ru_audience";
export const REFUSAL_CODES = [REFUSED_RU_DOMAIN, REFUSED_RU_HOSTING, REFUSED_RU_AUDIENCE, REFUSAL_CODE];

/** True for every code that renders the refusal block. */
export const isRefusalCode = (code) => REFUSAL_CODES.includes(code);

/** The one reason line per code, in each report language. */
export const REFUSAL_REASON = {
  [REFUSED_RU_DOMAIN]: { en: "Why: the address is in Russia's domain zone.", uk: "Чому: адреса в доменній зоні Росії." },
  [REFUSED_RU_HOSTING]: { en: "Why: the site is hosted in Russia.", uk: "Чому: сайт розміщено в Росії." },
  [REFUSED_RU_AUDIENCE]: { en: "Why: the site has a Russian-language version.", uk: "Чому: сайт має російськомовну версію." },
  [REFUSAL_CODE]: { en: "Why: the page is in Russian.", uk: "Чому: сторінка російською мовою." },
};

/** The reason line for a code in one language, or "" for a code that is not a refusal. */
export const refusalReason = (code, lang) => REFUSAL_REASON[code]?.[lang] ?? "";

/**
 * The findings, in the approved order. A finding with `items` is a source heading with a list
 * under it; otherwise `text` follows the source name, joined by `joiner` (the English reads
 * "Source: …", the Ukrainian sentences mostly run on from the name).
 */
export const FINDINGS = [
  {
    id: "unga",
    source: { en: "United Nations General Assembly", uk: "Генеральна Асамблея ООН" },
    items: [
      {
        id: "es-11-1",
        text: {
          en: "Deplored Russia's aggression against Ukraine and demanded the withdrawal of its forces: **141 states in favour, 5 against, 35 abstentions** (resolution ES-11/1, 2 March 2022).",
          uk: "Засудила агресію Росії проти України й вимагала вивести її війська: **141 держава «за», 5 «проти», 35 утрималися** (резолюція ES-11/1, 2 березня 2022 р.).",
        },
        url: "https://news.un.org/en/story/2022/03/1113152",
      },
      {
        id: "es-11-4",
        text: {
          en: "Declared the attempted annexation of four Ukrainian regions invalid: **143 in favour, 5 against, 35 abstentions** (resolution ES-11/4, 12 October 2022).",
          uk: "Визнала недійсною спробу анексії чотирьох областей України: **143 «за», 5 «проти», 35 утрималися** (резолюція ES-11/4, 12 жовтня 2022 р.).",
        },
        url: "https://news.un.org/en/story/2022/10/1129492",
      },
    ],
  },
  {
    id: "europarl",
    source: { en: "European Parliament", uk: "Європейський парламент" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: "recognised Russia as a **state sponsor of terrorism** (494 votes to 58, 23 November 2022).",
      uk: "визнав Росію **державою — спонсором тероризму** (494 голоси проти 58, 23 листопада 2022 р.).",
    },
    url: "https://www.europarl.europa.eu/news/en/press-room/20221118IPR55707/european-parliament-declares-russia-to-be-a-state-sponsor-of-terrorism",
  },
  {
    id: "icc",
    source: { en: "International Criminal Court", uk: "Міжнародний кримінальний суд" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: "issued arrest warrants for Vladimir Putin and Maria Lvova-Belova for the **war crime of unlawfully deporting Ukrainian children** (17 March 2023).",
      uk: "видав ордери на арешт Володимира Путіна та Марії Львової-Бєлової за **воєнний злочин — незаконну депортацію українських дітей** (17 березня 2023 р.).",
    },
    url: "https://www.icc-cpi.int/news/situation-ukraine-icc-judges-issue-arrest-warrants-against-vladimir-vladimirovich-putin-and",
  },
  {
    id: "coi",
    source: { en: "UN Commission of Inquiry on Ukraine", uk: "Комісія ООН з розслідування щодо України" },
    joiner: { en: ": ", uk: " " },
    text: {
      en: 'found that enforced disappearances of civilians by Russian authorities were "widespread and systematic" and amount to **crimes against humanity**, as does its torture of detainees (March 2025).',
      uk: "встановила, що насильницькі зникнення цивільних, які чинить російська влада, «масові й систематичні» і є **злочинами проти людяності**, як і катування утримуваних (березень 2025 р.).",
    },
    url: "https://news.un.org/en/story/2025/03/1161281",
  },
  {
    id: "pgo",
    source: { en: "Office of the Prosecutor General of Ukraine", uk: "Офіс Генерального прокурора України" },
    joiner: { en: ": ", uk: ": " },
    asOf: PROSECUTOR_FIGURES_AS_OF,
    text: {
      en: "**over 190,000 war crimes** registered since the full-scale invasion, **747 indictments** sent to court and **206 people convicted** (5 November 2025).",
      uk: "зареєстровано **понад 190 000 воєнних злочинів** від початку повномасштабного вторгнення, **747 обвинувальних актів** скеровано до суду, **206 осіб засуджено** (5 листопада 2025 р.).",
    },
    url: "https://gp.gov.ua/en/posts/ponad-190-tisyac-vojennix-zlociniv-ofis-genprokurora-predstaviv-komisiyi-oon-masstabi-zlociniv-rf-proti-ukrayini",
  },
];

export const SANCTIONS_LINKS = [
  { id: "eu", name: "EU Sanctions Map", url: "https://sanctionsmap.eu" },
  { id: "ofac", name: "US OFAC Sanctions List Search", url: "https://sanctionssearch.ofac.treas.gov" },
];

/** Every link the refusal cites, in order. */
export function refusalLinks() {
  const out = [];
  for (const f of FINDINGS) {
    if (f.items) for (const item of f.items) out.push(item.url);
    else out.push(f.url);
  }
  return [...out, ...SANCTIONS_LINKS.map((l) => l.url)];
}

/** The refusal as plain text in one language, ** kept: the sentences, in order. */
export function refusalSentences(lang) {
  const out = [];
  for (const f of FINDINGS) {
    if (f.items) {
      out.push(f.source[lang]);
      for (const item of f.items) out.push(item.text[lang]);
    } else {
      out.push(`${f.source[lang]}${f.joiner[lang]}${f.text[lang]}`);
    }
  }
  return out;
}
