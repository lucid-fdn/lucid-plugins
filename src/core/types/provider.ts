// ---------------------------------------------------------------------------
// provider.ts -- SEO provider interface
// ---------------------------------------------------------------------------

import type { Country } from './common.js';

export interface KeywordData {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  trend?: number[];
}

export interface SerpResultData {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  serp_features: string[];
}

export interface BacklinkData {
  domain: string;
  referring_domains: number;
  total_backlinks: number;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  dofollow_count: number;
  nofollow_count: number;
  top_links: Array<{
    source_url: string;
    source_domain: string;
    anchor_text: string;
    link_type: string;
  }>;
}

export interface DomainAuthorityData {
  domain: string;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  linking_root_domains: number;
}

export interface CompetitorData {
  domain: string;
  shared_keywords: number;
  competitor_keywords: number;
  visibility_score: number;
}

export interface SeoProvider {
  name: string;
  isConfigured(): boolean;
  getKeywordData?(keywords: string[], country?: Country): Promise<KeywordData[]>;
  getSerpResults?(keyword: string, country?: Country): Promise<SerpResultData[]>;
  getBacklinks?(domain: string): Promise<BacklinkData>;
  getDomainAuthority?(domain: string): Promise<DomainAuthorityData>;
  getCompetitors?(domain: string): Promise<CompetitorData[]>;
}

export interface SeoProviderRegistry {
  providers: SeoProvider[];
  getConfigured(): SeoProvider[];
  getKeywordProvider(): SeoProvider | null;
  getSerpProvider(): SeoProvider | null;
  getBacklinkProvider(): SeoProvider | null;
  getAuthorityProvider(): SeoProvider | null;
}
