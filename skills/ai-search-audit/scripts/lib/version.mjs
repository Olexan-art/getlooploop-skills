// The skill's version, written once here and once in package.json; tests/version.test.mjs holds
// the two together. Versions count in thousandths (2.101, 2.102, …): the first number moves only
// on a breaking change.
export const SKILL_VERSION = "2.101";

export const READING_SCHEMA = "getlooploop/ai-search-audit-reading@1";
export const EXPORT_SCHEMA = "getlooploop/ai-search-audit@1";
export const PRODUCED_BY = "ai-search-audit skill, Lite (local; deterministic checks, and the agent's own judgement where marked; the scripts call no model)";
