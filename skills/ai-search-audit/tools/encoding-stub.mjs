// Stands in for encoding-sniffer (and with it iconv-lite and its codepage tables) inside the dist/
// bundles. cheerio imports it only for loadBuffer() and the stream loaders, which this skill never
// calls: every page arrives as text from Node's own fetch and goes to cheerio.load(). Anything
// that does reach it fails loudly instead of silently.
function unavailable() {
  throw new Error("encoding-sniffer is not bundled into the ai-search-audit skill; cheerio.loadBuffer() and the stream loaders are not available here.");
}
export const decodeBuffer = unavailable;
export class DecodeStream {
  constructor() {
    unavailable();
  }
}
export const getEncoding = unavailable;
