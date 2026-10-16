// The reading, shaped to be pasted into an assistant: the Vectorscope
// "getlooploop/vectorscope-reading@1" shape, with every vector-derived field set to null.

export const VECTORSCOPE_EXPORT_SCHEMA = "getlooploop/vectorscope-reading@1";

export const PRODUCED_BY = "vectorscope-skill (local, no embeddings)";

const GROUPING_NOTE =
  "Grouped by the agent's reading, not by embeddings; groups are a judgement, chunking and the 26-passage cap are the product's exact rules.";

function round(value) {
  return Math.round(value * 1000) / 1000;
}

/**
 * Build the export object.
 * `page` is the product's page object; `lens` holds { chunks, groups, keywords, duplicates }
 * with chunks carrying { chunkIndex, group, heading, charCount, duplicateOf, preview }.
 */
// ; vector-only fields are null and say why.
export function buildVectorscopeExport(page, lens, now = new Date()) {
  const indexedChars = lens.groups.reduce((sum, group) => sum + group.charCount, 0);
  const exportedChars = lens.chunks.reduce((sum, chunk) => sum + (chunk.preview?.length || 0), 0);
  const share = indexedChars > 0 ? exportedChars / indexedChars : 0;
  const sharePercent = Math.round(share * 100);

  const headingsPresent = lens.chunks.some((chunk) => Boolean(chunk.heading));

  return {
    schema: VECTORSCOPE_EXPORT_SCHEMA,
    generatedAt: now.toISOString(),
    producedBy: {
      tool: PRODUCED_BY,
      what: `One page, put through the GetLoopLoop Vectorscope's fetch, extract and chunk steps locally, with the product's 26-passage cap, and no embedding step. ${GROUPING_NOTE}`,
      url: "https://www.getlooploop.com/vectorscope",
    },

    howToRead: {
      grouping: `${GROUPING_NOTE} The product groups passages by average-link clustering over embedding similarity; here the passages were read and grouped by subject instead, so two runs can group the same page differently. For the embedding-based reading with the map, run the page at https://www.getlooploop.com/vectorscope.`,
      unitOfAnalysis:
        "A chunk is one passage as the pipeline split it — roughly 2000 characters, following the page's own headings where it has them. Chunks overlap by about 200 characters, so their lengths sum to more than the page.",
      textHead: `Only the first 240 characters of each chunk are included. Across this page that is ${exportedChars} of ${indexedChars} indexed characters, about ${sharePercent}%, and always the opening of each passage rather than a sample spread through it.`,
      phrases:
        "Counted over the page's whole text, not the excerpts below. A phrase is two to four content words the page writes side by side — never across a stopword, punctuation or a number — at least twice and in at least two passages (or three times in one), and cohesive enough that the words are not merely neighbours. A shorter phrase nearly always inside a longer one is folded into it. Ranked by `passages` (how many distinct passages use it), then `count`. `groups` is how many of the page's groups it reaches and `describesWholePage` is true when it reaches most of them. These are what the page says, not search demand: nothing here measures how often anybody searches or asks for them. The group counts rest on the grouping above, which is a judgement.",
      narrativeWords:
        "Single words, counted only where none of the listed phrases already used them, so the occurrences still add up. Reporting verbs, connectives and markup residue ([edit] links, TeX) are left out. They say what the page talks about; they are rarely what anybody types or asks.",
      keywords:
        "`phrases` followed by `narrativeWords` as one list, in the shape earlier exports had. Prefer the two lists above.",
      agentLabel:
        "v2: the name the agent gave the group after reading it, or null. It is a judgement, like the grouping; `label` and `labelSource` are the computed label as in v1.",
      groupLabels: headingsPresent
        ? "`labelSource` says where each name came from. \"heading\" is the page's own section heading and can be quoted. \"keywords\" is a computed guess — the group's most distinctive words — and is a hint, not a topic; do not quote it back as what the section is called."
        : "Every `labelSource` here is \"keywords\": a computed guess at the group's most distinctive two words, not a heading the page carries. Treat it as a hint and never quote it as the section's name.",
      cohesion: "null: cohesion is the mean cosine between a group's passage embeddings, and no embeddings were computed.",
      selfSimilarity: "null: the median cosine between passages needs embeddings, and none were computed.",
      groupFloor: "null: there was no similarity cut; the groups are a reading of the passages.",
      duplicateOf:
        "The index of an earlier, non-adjacent chunk this one repeats nearly word for word, as judged by reading — the product judges it from embeddings at cosine 0.94. The chunker's own overlap between neighbours is excluded.",
      projectionExplained: "null: there is no projection without vectors.",
      whatCapReachedMeans: page.chunkCap
        ? `The pipeline indexes at most ${page.chunkCap} chunks per page. \`capReached\` true with \`charsUnread\` above zero means an assistant reading this page never sees that tail.`
        : "`capReached` true with `charsUnread` above zero means the page has a tail the pipeline never indexed, which an assistant reading this page never sees.",
      noindex:
        "True when the page asks search engines not to index it. Says nothing about whether an assistant can read it, but it is often unintentional.",
    },

    // What this reading cannot answer, plus one line about the grouping.
    cannotAnswer: [
      `Sentiment or tone of the page. Only about ${sharePercent}% of the text is here, taken from the opening of each passage — enough to produce a confident-sounding verdict from an unrepresentative sample. If asked, say what the sample supports and that it is a sample.`,
      "Anything about competitors, or how this page compares to another. One page was read; no other page was fetched.",
      "Which search or assistant prompts this page ranks or gets cited for. That needs a query inventory and measurement over time, neither of which is in this export.",
      "How often people search for or ask about any phrase listed here. The counts are how often the page says them, not demand.",
      "Whether the page is factually correct, current, or original. Nothing here checked any claim on it.",
      "How the page renders for a browser running JavaScript. This is a plain fetch, which is also what an assistant that does not run JavaScript sees.",
      "How close any two passages are in an embedding space, or whether any assistant has indexed this page. No embeddings were computed, and this is a preview of the machine's view, not a guarantee of what any assistant does with it.",
    ],

    suggestedPrompt:
      "This is a retrieval read-out of one web page. Using it, tell me: (1) what this page is about — lean on `phrases` first, and on those where `describesWholePage` is true most, since they are counted over the full text rather than the excerpts — group by group, naming groups only where labelSource is \"heading\"; (2) what someone asking an assistant about this subject would find here, and what they would not; (3) what to change first, ordered by how much it would change what an assistant retrieves — cite the chunk indexes or group ids your answer rests on. Where the payload's cannotAnswer list says the data does not support a claim, say so instead of estimating.",

    page: {
      url: page.url,
      requestedUrl: page.requestedUrl,
      title: page.title,
      wordCount: page.wordCount,
      headingsFound: page.headings,
      noindex: page.noindex,
    },

    retrieval: {
      embeddingModel: null,
      dimensions: null,
      chunkCap: page.chunkCap ?? null,
      chunksIndexed: page.chunksIndexed,
      charsIndexed: page.charsIndexed,
      charsUnread: page.charsUnread,
      capReached: page.capReached,
      duplicateChunks: lens.duplicates,
      // The product counts groups its clustering was forced to merge past six; a judged grouping has no such count.
      groupsMergedByPaletteLimit: null,
    },

    textCoverage: { exportedChars, indexedChars, share: round(share) },

    geometry: {
      selfSimilarity: null,
      groupFloor: null,
      projectionExplained: null,
      projectionBasis: null,
    },

    phrases: Array.isArray(lens.phrases) ? lens.phrases.map(exportTerm) : [],
    narrativeWords: Array.isArray(lens.narrative) ? lens.narrative.map(exportTerm) : [],
    keywords: Array.isArray(lens.keywords)
      ? lens.keywords.map((keyword) => ({
          term: keyword.term,
          count: keyword.count,
          groups: keyword.groups,
          spread: keyword.spread,
          describesWholePage: keyword.scope,
        }))
      : [],

    groups: lens.groups.map((group) => ({
      id: group.id,
      label: group.label,
      labelSource: group.labelSource ?? "unstated",
      chunkCount: group.chunkCount,
      charCount: group.charCount,
      shareOfIndexedChars: indexedChars > 0 ? round(group.charCount / indexedChars) : 0,
      cohesion: null,
      // v2, additive: the agent's own name and note for the group, and its shared topic in
      // compare mode. `label` keeps its v1 meaning (the computed heading/keyword label).
      agentLabel: group.agentLabel ?? null,
      note: group.note ?? null,
      topic: group.topic ?? null,
    })),

    chunks: lens.chunks.map((chunk) => ({
      index: chunk.chunkIndex,
      group: chunk.group,
      heading: chunk.heading ?? null,
      charCount: chunk.charCount,
      duplicateOf: chunk.duplicateOf,
      textHead: chunk.preview,
    })),
  };
}

/** One vocabulary entry as the export carries it. */
function exportTerm(term) {
  return {
    term: term.term,
    count: term.count,
    passages: term.passages,
    groups: term.groups,
    spread: term.spread,
    describesWholePage: term.scope,
  };
}

/** A filename for the reading: host and path, never a timestamp. */
export function vectorscopeExportName(page) {
  let slug = "page";
  try {
    const parsed = new URL(page.url);
    slug = `${parsed.hostname}${parsed.pathname}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  } catch {
    // A URL we cannot parse still gets a file.
  }
  return `vectorscope-${slug.slice(0, 80) || "page"}.json`;
}
