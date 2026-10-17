// Locale facts: do the language versions state the same numbers? Deterministic. Each version's
// kept text is split into its h2 sections (the Vectorscope chunker's own sections); sections are
// aligned by order, and only when both versions have the same number of them; then the numbers in
// each aligned pair are compared as sets. A number one version states and the aligned section of
// the other replaces with a different number is reported.
//
// Limits, reported with the result: a version whose sections do not line up is not compared;
// numbers written as words ("three") are not read; a number may legitimately differ (a local
// price, a local phone number), and this cannot tell; years and figures inside headings count
// like any other number.

/** Numbers as written in the locales this site publishes: 2,000 · 2 000 · 2.000 are one number; 0.5 and 0,5 too. */
export function numbersIn(text) {
  const out = [];
  const re = /(?<![\p{L}\p{N}]-?)\d{1,3}(?:[,.\u00a0\u202f ]\d{3})+(?![\p{N}])|(?<![\p{L}\p{N}]-?)\d+(?:[.,]\d+)?(?![\p{N}])/gu;
  for (const m of String(text || "").matchAll(re)) {
    const raw = m[0];
    let value;
    if (/^\d{1,3}(?:[,.\u00a0\u202f ]\d{3})+$/.test(raw)) value = Number(raw.replace(/[^\d]/g, ""));
    else value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value)) continue;
    const at = m.index;
    out.push({ value, raw: raw.replace(/[\u00a0\u202f]/g, " "), context: String(text).slice(Math.max(0, at - 30), at + raw.length + 30).replace(/\s+/g, " ").trim() });
  }
  return out;
}

/** The h2 sections of a version: [{position, heading, numbers}]. `sections` from the chunker's extractSections; the intro (title, h1, description) is left out. */
export function sectionNumbers(sections) {
  const body = (sections || []).filter((s, i) => !(i === 0 && s.intro));
  return body
    .filter((s) => s.heading)
    .map((s, position) => ({ position, heading: String(s.heading).slice(0, 160), numbers: numbersIn(s.text).slice(0, 40) }));
}

/**
 * Compare this page's sections with each alternate's. `self` and every `alternates[].sections`
 * are sectionNumbers() lists. Returns { compared: [{hreflang, aligned, sections, differ: [...]}], findings }.
 */
export function compareLocales(selfLang, self, alternates) {
  const compared = [];
  const differ = [];
  for (const a of alternates) {
    if (!a.sections) continue;
    if (!self.length || a.sections.length !== self.length) {
      compared.push({ hreflang: a.hreflang, aligned: false, reason: !self.length && !a.sections.length ? "no_sections" : "sections_differ", sections: [self.length, a.sections.length], differ: 0 });
      continue;
    }
    let n = 0;
    self.forEach((s, i) => {
      const t = a.sections[i];
      const mine = new Set(s.numbers.map((x) => x.value));
      const theirs = new Set(t.numbers.map((x) => x.value));
      if (!mine.size || !theirs.size) return;
      const onlyMine = s.numbers.filter((x) => !theirs.has(x.value));
      const onlyTheirs = t.numbers.filter((x) => !mine.has(x.value));
      if (!onlyMine.length || !onlyTheirs.length) return;
      n += 1;
      differ.push({ hreflang: a.hreflang, position: i + 1, heading: s.heading, theirHeading: t.heading, self: onlyMine.slice(0, 3).map((x) => x.context), other: onlyTheirs.slice(0, 3).map((x) => x.context), values: [onlyMine[0].raw, onlyTheirs[0].raw] });
    });
    compared.push({ hreflang: a.hreflang, aligned: true, sections: [self.length, a.sections.length], differ: n });
  }
  const findings = differ.length ? [{ code: "locale_facts_differ", evidence: { selfLang, count: differ.length, items: differ.slice(0, 8), method: "h2 sections aligned by order when both versions have the same count; numbers compared as sets", compared } }] : [];
  return { compared, differ, findings };
}
