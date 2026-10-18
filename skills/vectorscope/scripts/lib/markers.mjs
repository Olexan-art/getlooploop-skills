// Marker words: vocabulary that language models reach for far more often than people do, counted
// per 1,000 words. A signal beside the Pattern score, never inside it: the score is PatternScope's
// and must match what the product says about the same text.
//
// Where the lists come from. The English core is the excess vocabulary measured in published text
// after 2023 (Kobak et al., "Delving into ChatGPT usage in academic writing through excess
// vocabulary", 2024: delve, showcase, underscore, pivotal, intricate, meticulous, realm…), plus the
// marketing words the same models overuse in product copy (seamless, unlock, elevate, empower…).
// Ukrainian and Spanish are written natively for how those languages' generated copy actually
// reads, not translated from the English list.
//
// What a hit is not: proof of authorship. People write "seamless" too. The density is what the
// report shows, and its thresholds are stated as not yet calibrated.
//
// Matching: case-folded, at letter/digit boundaries (so it works for Cyrillic, where \b does not),
// each entry a small pattern so inflected forms count once per occurrence. Pure; no network.

export const MARKER_SET_VERSION = "markers-1";
export const MARKER_LANGUAGES = ["en", "uk", "es"];
/** Bands, in hits per 1,000 words. Not yet calibrated against a labelled set; the report says so. */
export const MARKER_BANDS = [
  [25, "frequent"],
  [10, "noticeable"],
  [0, "rare"],
];

const L = "\\p{L}";

/** [display term, pattern source]. The pattern is matched case-insensitively between non-letters. */
const LISTS = {
  en: [
    ["delve", "delv(?:e|es|ed|ing)"],
    ["tapestry", "tapestr(?:y|ies)"],
    ["testament to", "(?:a )?testament to"],
    ["realm", "realms?"],
    ["intricate", "intricate(?:ly)?"],
    ["meticulous", "meticulous(?:ly)?"],
    ["pivotal", "pivotal"],
    ["showcase", "showcas(?:e|es|ed|ing)"],
    ["underscore", "underscor(?:e|es|ed|ing)"],
    ["multifaceted", "multi-?faceted"],
    ["nuanced", "nuanced"],
    ["ever-evolving", "ever-(?:evolving|changing)"],
    ["landscape", "(?:digital|competitive|evolving|modern|business) landscape"],
    ["navigate the complexities", "navigat(?:e|es|ing) (?:the )?complexit(?:y|ies)"],
    ["seamless", "seamless(?:ly)?"],
    ["unlock", "unlock(?:s|ed|ing)?"],
    ["unleash", "unleash(?:es|ed|ing)?"],
    ["elevate", "elevat(?:e|es|ed|ing)"],
    ["empower", "empower(?:s|ed|ing|ment)?"],
    ["leverage", "leverag(?:e|es|ed|ing)"],
    ["harness", "harness(?:es|ed|ing)? the power"],
    ["foster", "foster(?:s|ed|ing)?"],
    ["streamline", "streamlin(?:e|es|ed|ing)"],
    ["supercharge", "supercharg(?:e|es|ed|ing)"],
    ["revolutionize", "revolutioni[sz](?:e|es|ed|ing)"],
    ["transformative", "transformative"],
    ["game-changer", "game[- ]chang(?:er|ers|ing)"],
    ["cutting-edge", "cutting-edge"],
    ["next level", "(?:to )?the next level"],
    ["unparalleled", "unparall?eled"],
    ["holistic", "holistic(?:ally)?"],
    ["synergy", "synerg(?:y|ies|istic)"],
    ["vibrant", "vibrant"],
    ["embark", "embark(?:s|ed|ing)?"],
    ["effortless", "effortless(?:ly)?"],
    ["hassle-free", "hassle-free"],
    ["peace of mind", "peace of mind"],
    ["above and beyond", "above and beyond"],
    ["look no further", "look no further"],
    ["robust", "robust(?:ly|ness)?"],
    ["intuitive", "intuitive(?:ly)?"],
    ["innovative", "innovative"],
    ["ecosystem", "ecosystems?"],
    ["frictionless", "frictionless"],
    ["unwavering", "unwavering"],
    ["industry-leading", "industry-leading"],
    ["transformed the way", "transform(?:s|ed)? the way"],
    ["truly", "truly"],
    ["whether you're", "whether you(?:'|’)re"],
  ],
  uk: [
    ["безшовний", `безшовн${L}*`],
    ["екосистема", `екосистем${L}*`],
    ["інноваційний", `інноваційн${L}*`],
    ["революційний", `революційн${L}*`],
    ["передові технології", `передов${L}* технологі${L}*`],
    ["на новий рівень", "на (?:новий|наступний|якісно новий) рівень"],
    ["розкрити потенціал", `розкри${L}*(?: ${L}+)? потенціал${L}*`],
    ["відіграє ключову роль", `відігра${L}* (?:ключову|важливу|вирішальну|значну) роль`],
    ["у сучасному світі", "(?:у|в) сучасному світі"],
    ["світ, що змінюється", "(?:у|в) світі,? що (?:швидко |стрімко )?змінюється"],
    ["зануритися", `(?:зануримося|зануритися|занурмося|поринемо|поринути)`],
    ["незамінний помічник", `незамінн${L}* (?:помічник|інструмент)${L}*`],
    ["комплексний підхід", `комплексн${L}* підх(?:і|о)д${L}*`],
    ["ключовий аспект", `ключов${L}* аспект${L}*`],
    ["надійний партнер", `надійн${L}* партнер${L}*`],
    ["широкий спектр", `широк${L}* спектр${L}*`],
    ["бездоганний", `бездоганн${L}*`],
    ["неперевершений", `неперевершен${L}*`],
    ["підвищити ефективність", `підвищ${L}* ефективн${L}*`],
    ["трансформувати", `трансформу${L}*`],
    ["без зайвих зусиль", "без зайвих (?:зусиль|клопотів)"],
    ["у кілька кліків", "(?:у|в|за) (?:кілька|декілька|лічені) клік(?:ів|и)"],
    ["задовольнити будь-які потреби", `задовольн${L}* (?:будь-які|усі|всі) (?:ваші )?потреби`],
    ["у цій статті ми розглянемо", "(?:у|в) цій статті (?:ми )?розглянемо"],
    ["давайте розберемося", "давайте (?:розберемося|розглянемо|з'ясуємо|зʼясуємо)"],
    ["підсумовуючи", "підсумовуючи"],
    ["змінити правила гри", `змін${L}* правила гри`],
  ],
  es: [
    ["sin fisuras", "sin fisuras"],
    ["experiencia fluida", `(?:experiencia|integración|manera) fluida`],
    ["ecosistema", "ecosistemas?"],
    ["innovador", `innovador${L}*`],
    ["revolucionar", `revolucion(?:ar|a|an|ario|aria|arios|arias)`],
    ["de vanguardia", "de vanguardia"],
    ["al siguiente nivel", "(?:al|a un) (?:siguiente|próximo|otro) nivel"],
    ["desbloquear", `desbloque${L}*`],
    ["potencial", `(?:todo |el )?(?:su|tu|el) (?:máximo |verdadero |pleno )?potencial`],
    ["desempeña un papel clave", `desempeñ${L}* un papel (?:crucial|clave|fundamental|esencial)`],
    ["panorama actual", "(?:panorama|entorno) (?:actual|digital|competitivo)"],
    ["adentrarse", "(?:adentr(?:émonos|arnos|arse|ándonos)|sumerj(?:ámonos|irse|irnos))"],
    ["en este artículo", "en este artículo (?:exploraremos|veremos|analizaremos)"],
    ["potenciar", `potenci(?:ar|a|an|ando)`],
    ["sin esfuerzo", "sin esfuerzo"],
    ["en pocos clics", "en (?:pocos|unos pocos|un par de) clics"],
    ["aliado perfecto", "(?:aliado|socio) (?:perfecto|ideal|de confianza)"],
    ["amplia gama", "amplia gama"],
    ["inigualable", "(?:inigualable|incomparable|sin igual)"],
    ["en conclusión", "en conclusión"],
    ["tapiz", "tapiz"],
    ["testimonio de", "(?:un )?testimonio de"],
    ["navegar por las complejidades", "naveg(?:ar|ando) (?:por )?(?:las )?complejidades"],
  ],
};

const COMPILED = Object.fromEntries(
  Object.entries(LISTS).map(([lang, list]) => [lang, list.map(([term, src]) => ({ term, re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, "giu") }))])
);

/** The display terms of a language's list (for the "?" and the tests). */
export const markerTerms = (language) => (LISTS[language] || []).map(([term]) => term);

/** Every marker in the text: [{term, count}], largest first, and the total. Unknown language → null. */
export function countMarkers(text, language) {
  const list = COMPILED[language];
  if (!list) return null;
  const s = String(text ?? "");
  const terms = [];
  for (const { term, re } of list) {
    re.lastIndex = 0;
    const n = (s.match(re) || []).length;
    if (n) terms.push({ term, count: n });
  }
  terms.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
  return { total: terms.reduce((sum, t) => sum + t.count, 0), terms };
}

/** Hits per 1,000 words, one decimal; null when there are no words. */
export function perThousand(hits, words) {
  return words ? Math.round((hits / words) * 10000) / 10 : null;
}

export function markerBand(per1k) {
  if (per1k === null || per1k === undefined) return null;
  return MARKER_BANDS.find(([floor]) => per1k >= floor)[1];
}
