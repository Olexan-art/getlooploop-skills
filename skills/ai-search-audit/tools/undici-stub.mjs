// Stands in for undici inside the dist/ bundles. cheerio imports undici only for cheerio.fromURL(),
// which this skill never calls (it fetches with Node's own fetch in scripts/lib/net.mjs), and
// undici is most of the bundle's size. Anything that does reach it fails loudly instead of silently.
function unavailable() {
  throw new Error("undici is not bundled into the ai-search-audit skill; cheerio.fromURL() is not available here.");
}
export const Client = unavailable;
export const interceptors = { redirect: unavailable };
export const errors = { ResponseError: unavailable };
