// Small synthetic readings for the tests: a page object and passages, nothing fetched.

export function reading(texts, { headings = [], title = "Test page", technical, robots, layout, render, page = {} } = {}) {
  const passages = texts.map((text, index) => ({
    index,
    heading: headings[index] ?? null,
    rawHeading: headings[index] ?? null,
    contentRole: "main",
    charCount: text.length,
    text,
  }));
  return {
    ok: true,
    page: {
      url: "https://example.org/page",
      requestedUrl: "https://example.org/page",
      title,
      wordCount: texts.join(" ").split(/\s+/).length,
      chunksIndexed: passages.length,
      charsIndexed: texts.reduce((s, t) => s + t.length, 0),
      charsUnread: 0,
      capReached: false,
      noindex: false,
      headings: headings.filter(Boolean).length,
      chunkCap: 26,
      h1: [title],
      ...page,
    },
    passages,
    ...(technical ? { technical } : {}),
    ...(robots ? { robots } : {}),
    ...(layout ? { layout } : {}),
    ...(render ? { render } : {}),
  };
}

export const filler = (n, word = "content") => Array.from({ length: n }, (_, i) => `${word}${i % 7} sentence number ${i}.`).join(" ");
