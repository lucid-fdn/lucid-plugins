// ---------------------------------------------------------------------------
// fixtures.ts -- Test fixtures
// ---------------------------------------------------------------------------

import type { KeywordData, SerpResultData, BacklinkData, DomainAuthorityData, CompetitorData } from '../../src/core/types/provider.js';

export const MOCK_KEYWORD_DATA: KeywordData[] = [
  { keyword: 'seo tools', search_volume: 12000, cpc: 3.50, competition: 0.72, difficulty: 65 },
  { keyword: 'keyword research', search_volume: 8500, cpc: 4.20, competition: 0.68, difficulty: 60 },
  { keyword: 'backlink checker', search_volume: 5200, cpc: 2.80, competition: 0.55, difficulty: 45 },
];

export const MOCK_SERP_RESULTS: SerpResultData[] = [
  {
    position: 1,
    url: 'https://example.com/seo-guide',
    title: 'The Complete SEO Guide 2024',
    description: 'Everything you need to know about SEO in one comprehensive guide.',
    domain: 'example.com',
    serp_features: ['featured_snippet'],
  },
  {
    position: 2,
    url: 'https://anothersite.com/seo-tips',
    title: 'Top 10 SEO Tips for Beginners',
    description: 'Learn the basics of search engine optimization with our beginner guide.',
    domain: 'anothersite.com',
    serp_features: [],
  },
  {
    position: 3,
    url: 'https://seoexpert.com/strategies',
    title: 'Advanced SEO Strategies',
    description: 'Expert-level SEO strategies for experienced marketers.',
    domain: 'seoexpert.com',
    serp_features: ['sitelinks'],
  },
];

export const MOCK_BACKLINK_DATA: BacklinkData = {
  domain: 'example.com',
  referring_domains: 1500,
  total_backlinks: 25000,
  domain_authority: 45,
  page_authority: 38,
  spam_score: 5,
  dofollow_count: 20000,
  nofollow_count: 5000,
  top_links: [
    { source_url: 'https://blog.tech.com/article', source_domain: 'blog.tech.com', anchor_text: 'example tools', link_type: 'dofollow' },
    { source_url: 'https://news.site.com/review', source_domain: 'news.site.com', anchor_text: 'click here', link_type: 'nofollow' },
  ],
};

export const MOCK_AUTHORITY_DATA: DomainAuthorityData = {
  domain: 'example.com',
  domain_authority: 45,
  page_authority: 38,
  spam_score: 5,
  linking_root_domains: 1200,
};

export const MOCK_COMPETITOR_DATA: CompetitorData[] = [
  { domain: 'competitor1.com', shared_keywords: 250, competitor_keywords: 800, visibility_score: 65 },
  { domain: 'competitor2.com', shared_keywords: 180, competitor_keywords: 1200, visibility_score: 72 },
];

export const MOCK_HTML_GOOD = `<!DOCTYPE html>
<html>
<head>
  <title>Best SEO Tools for 2024 - Complete Guide</title>
  <meta name="description" content="Discover the best SEO tools for 2024. Our comprehensive guide covers keyword research, backlink analysis, and technical SEO auditing tools.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Best SEO Tools for 2024</h1>
  <p>Search engine optimization requires the right seo tools to succeed. In this guide, we cover the essential seo tools every marketer needs.</p>
  <h2>Keyword Research Tools</h2>
  <p>Keyword research is the foundation of any SEO strategy. These seo tools help you find the right keywords to target.</p>
  <h2>Backlink Analysis Tools</h2>
  <p>Understanding your backlink profile is crucial. Use these seo tools to monitor and improve your link building efforts.</p>
  <img src="tools.jpg" alt="SEO tools dashboard">
  <script type="application/ld+json">{"@type":"Article"}</script>
</body>
</html>`;

export const MOCK_HTML_BAD = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <h3>Some page</h3>
  <p>Short content.</p>
  <img src="photo.jpg">
  <a href="https://external.com" target="_blank">Link</a>
</body>
</html>`;
