// The published rules each check rests on. The Lite report does not show them (it is a picture
// of the problems, not an explanation of them); the JSON export carries them with every finding
// so a fuller report can be rendered from the same data. Where no published source states the
// rule (a threshold this skill chose), the source is "This skill's rule" and points at the README,
// which names the threshold and the reason for it. Nothing is attributed to Google, the W3C or
// anyone else unless their page says it.

const SKILL_README = "https://github.com/Olexan-art/getlooploop-skills/blob/main/README.md#ai-search-audit-lite";

export const SOURCES = {
  skill: ["This skill's rule (README, the thresholds)", SKILL_README],
  vs: ["This skill: the Vectorscope reading (h2 sections, 2,000-character windows, a 26-passage cap)", "https://github.com/Olexan-art/getlooploop-skills/blob/main/skills/vectorscope/SKILL.md"],
  rfc: ["RFC 9309: Robots Exclusion Protocol", "https://www.rfc-editor.org/rfc/rfc9309"],
  gRobots: ["Google Search Central: introduction to robots.txt", "https://developers.google.com/search/docs/crawling-indexing/robots/intro"],
  gCrawlers: ["Google Search Central: Google's common crawlers", "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers"],
  bing: ["Bing Webmaster: which crawlers Bing uses", "https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0"],
  openai: ["OpenAI: overview of OpenAI crawlers", "https://developers.openai.com/api/docs/bots"],
  anthropic: ["Anthropic: does Anthropic crawl data from the web", "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"],
  perplexity: ["Perplexity: Perplexity crawlers", "https://docs.perplexity.ai/guides/bots"],
  ccbot: ["Common Crawl: CCBot", "https://commoncrawl.org/ccbot"],
  gNoindex: ["Google Search Central: block indexing with noindex", "https://developers.google.com/search/docs/crawling-indexing/block-indexing"],
  gRobotsMeta: ["Google Search Central: robots meta tag and X-Robots-Tag", "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"],
  gSitemap: ["Google Search Central: sitemaps overview", "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview"],
  sitemaps: ["sitemaps.org: the sitemap protocol", "https://www.sitemaps.org/protocol.html"],
  llms: ["The llms.txt proposal", "https://llmstxt.org/"],
  gHttp: ["Google Search Central: HTTP status codes and network errors", "https://developers.google.com/search/docs/crawling-indexing/http-network-errors"],
  gRedirects: ["Google Search Central: redirects and Google Search", "https://developers.google.com/search/docs/crawling-indexing/301-redirects"],
  gPageExp: ["Google Search Central: page experience (HTTPS)", "https://developers.google.com/search/docs/appearance/page-experience"],
  gTitle: ["Google Search Central: title links", "https://developers.google.com/search/docs/appearance/title-link"],
  gSnippet: ["Google Search Central: meta descriptions and snippets", "https://developers.google.com/search/docs/appearance/snippet"],
  gCanon: ["Google Search Central: consolidate duplicate URLs", "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls"],
  gLinks: ["Google Search Central: crawlable links", "https://developers.google.com/search/docs/crawling-indexing/links-crawlable"],
  gImages: ["Google Search Central: image SEO best practices", "https://developers.google.com/search/docs/appearance/google-images"],
  wImages: ["W3C WAI: images tutorial", "https://www.w3.org/WAI/tutorials/images/"],
  gMobile: ["Google Search Central: mobile-first indexing", "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing"],
  i18n: ["W3C Internationalization: declaring language in HTML", "https://www.w3.org/International/questions/qa-html-language-declarations"],
  ogp: ["The Open Graph protocol", "https://ogp.me/"],
  gUrl: ["Google Search Central: URL structure", "https://developers.google.com/search/docs/crawling-indexing/url-structure"],
  wHead: ["W3C WAI: headings", "https://www.w3.org/WAI/tutorials/page-structure/headings/"],
  gSdIntro: ["Google Search Central: introduction to structured data", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
  gSdPol: ["Google Search Central: general structured data guidelines", "https://developers.google.com/search/docs/appearance/structured-data/sd-policies"],
  sFaq: ["schema.org: FAQPage", "https://schema.org/FAQPage"],
  gUpdates: ["Google Search Central: documentation updates (FAQ rich result, 7 May 2026)", "https://developers.google.com/search/updates"],
  gProduct: ["Google Search Central: product snippet structured data", "https://developers.google.com/search/docs/appearance/structured-data/product-snippet"],
  gSoftware: ["Google Search Central: software app structured data", "https://developers.google.com/search/docs/appearance/structured-data/software-app"],
  gArticle: ["Google Search Central: article structured data", "https://developers.google.com/search/docs/appearance/structured-data/article"],
  gBread: ["Google Search Central: breadcrumb structured data", "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb"],
  gOrg: ["Google Search Central: organization structured data", "https://developers.google.com/search/docs/appearance/structured-data/organization"],
  sHowTo: ["schema.org: HowTo", "https://schema.org/HowTo"],
  gJs: ["Google Search Central: JavaScript SEO basics", "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics"],
  header: ["HTML Standard: the header element", "https://html.spec.whatwg.org/multipage/sections.html#the-header-element"],
  hidden: ["HTML Standard: the hidden attribute", "https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute"],
  nav: ["HTML Standard: the nav element", "https://html.spec.whatwg.org/multipage/sections.html#the-nav-element"],
  dom: ["DOM Standard: descendant text content", "https://dom.spec.whatwg.org/#concept-descendant-text-content"],
  cssText: ["W3C CSS Text Level 3: white space processing", "https://www.w3.org/TR/css-text-3/#white-space-processing"],
  apgAcc: ["W3C WAI-ARIA APG: accordion pattern", "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/"],
  gHreflang: ["Google Search Central: localized versions (hreflang)", "https://developers.google.com/search/docs/specialty/international/localized-versions"],
  gMulti: ["Google Search Central: multi-regional and multilingual sites", "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites"],
  gAi: ["Google Search Central: AI features and your website", "https://developers.google.com/search/docs/appearance/ai-features"],
  gHelpful: ["Google Search Central: creating helpful, reliable, people-first content", "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"],
  gStarter: ["Google Search Central: SEO starter guide", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide"],
  gReview: ["Google Search Central: review snippet structured data", "https://developers.google.com/search/docs/appearance/structured-data/review-snippet"],
  sRating: ["schema.org: AggregateRating", "https://schema.org/AggregateRating"],
  gEvent: ["Google Search Central: event structured data", "https://developers.google.com/search/docs/appearance/structured-data/event"],
  gJob: ["Google Search Central: job posting structured data", "https://developers.google.com/search/docs/appearance/structured-data/job-posting"],
  gLocal: ["Google Search Central: local business structured data", "https://developers.google.com/search/docs/appearance/structured-data/local-business"],
  gVideo: ["Google Search Central: video structured data", "https://developers.google.com/search/docs/appearance/structured-data/video"],
  gQa: ["Google Search Central: Q&A page structured data", "https://developers.google.com/search/docs/appearance/structured-data/qapage"],
  gVariants: ["Google Search Central: product variant structured data", "https://developers.google.com/search/docs/appearance/structured-data/product-variants"],
  gSiteName: ["Google Search Central: site names (WebSite structured data on the home page)", "https://developers.google.com/search/docs/appearance/site-names"],
  gFavicon: ["Google Search Central: favicon in Search results", "https://developers.google.com/search/docs/appearance/favicon-in-search"],
  sPerson: ["schema.org: Person", "https://schema.org/Person"],
  wCls: ["web.dev: optimize Cumulative Layout Shift (width and height on images)", "https://web.dev/articles/optimize-cls"],
  wLcpLazy: ["web.dev: the performance effects of too much lazy loading", "https://web.dev/articles/lcp-lazy-loading"],
  mixed: ["W3C: Mixed Content", "https://www.w3.org/TR/mixed-content/"],
  hsts: ["RFC 6797: HTTP Strict Transport Security", "https://www.rfc-editor.org/rfc/rfc6797"],
  indexnow: ["IndexNow: documentation (the key file)", "https://www.indexnow.org/documentation"],
  gCwv: ["Google Search Central: Core Web Vitals", "https://developers.google.com/search/docs/appearance/core-web-vitals"],
  gInspect: ["Search Console Help: URL Inspection tool", "https://support.google.com/webmasters/answer/9012289"],
};

/** A source key as { name, url }. */
export const source = (key) => {
  const s = SOURCES[key];
  if (!s) throw new Error(`no source ${key}`);
  return { name: s[0], url: s[1] };
};
