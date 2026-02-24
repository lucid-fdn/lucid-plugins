// ---------------------------------------------------------------------------
// database.ts -- Database row types
// ---------------------------------------------------------------------------

import type { KeywordIntent, LinkType, AuditSeverity } from './common.js';

export interface Keyword {
  id: number;
  tenant_id: string;
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: KeywordIntent;
  serp_features: string[];
  current_rank: number | null;
  previous_rank: number | null;
  url: string | null;
  tracked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeywordInsert {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  difficulty: number;
  intent: KeywordIntent;
  serp_features?: string[];
  current_rank?: number | null;
  previous_rank?: number | null;
  url?: string | null;
  tracked_at?: string | null;
}

export interface SerpResult {
  id: number;
  tenant_id: string;
  keyword_id: number;
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  serp_features: string[];
  checked_at: string;
}

export interface SerpResultInsert {
  keyword_id: number;
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
  serp_features?: string[];
  checked_at?: string;
}

export interface BacklinkProfile {
  id: number;
  tenant_id: string;
  domain: string;
  referring_domains: number;
  total_backlinks: number;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  dofollow_count: number;
  nofollow_count: number;
  created_at: string;
  updated_at: string;
}

export interface BacklinkProfileInsert {
  domain: string;
  referring_domains: number;
  total_backlinks: number;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  dofollow_count: number;
  nofollow_count: number;
}

export interface Backlink {
  id: number;
  profile_id: number;
  source_url: string;
  source_domain: string;
  target_url: string;
  anchor_text: string;
  link_type: LinkType;
  first_seen: string;
  last_seen: string;
  is_lost: boolean;
}

export interface BacklinkInsert {
  profile_id: number;
  source_url: string;
  source_domain: string;
  target_url: string;
  anchor_text: string;
  link_type: LinkType;
  first_seen?: string;
  last_seen?: string;
  is_lost?: boolean;
}

export interface ContentAnalysis {
  id: number;
  tenant_id: string;
  url: string;
  title: string;
  word_count: number;
  readability_score: number;
  keyword_density: number;
  heading_structure: Record<string, unknown>;
  meta_description: string;
  meta_title: string;
  score: number;
  suggestions: Record<string, unknown>;
  analyzed_at: string;
}

export interface ContentAnalysisInsert {
  url: string;
  title: string;
  word_count: number;
  readability_score: number;
  keyword_density: number;
  heading_structure: Record<string, unknown>;
  meta_description: string;
  meta_title: string;
  score: number;
  suggestions: Record<string, unknown>;
  analyzed_at?: string;
}

export interface TechnicalAudit {
  id: number;
  tenant_id: string;
  domain: string;
  issues: AuditIssue[];
  pages_crawled: number;
  healthy_pages: number;
  broken_links: number;
  redirect_chains: number;
  missing_meta: number;
  slow_pages: number;
  mobile_issues: number;
  schema_errors: number;
  score: number;
  audited_at: string;
}

export interface AuditIssue {
  severity: AuditSeverity;
  category: string;
  message: string;
  url?: string;
}

export interface TechnicalAuditInsert {
  domain: string;
  issues: AuditIssue[];
  pages_crawled: number;
  healthy_pages: number;
  broken_links: number;
  redirect_chains: number;
  missing_meta: number;
  slow_pages: number;
  mobile_issues: number;
  schema_errors: number;
  score: number;
  audited_at?: string;
}

export interface CompetitorTrack {
  id: number;
  tenant_id: string;
  domain: string;
  our_domain: string;
  shared_keywords: number;
  competitor_keywords: number;
  our_keywords: number;
  overlap_pct: number;
  visibility_score: number;
  created_at: string;
}

export interface CompetitorTrackInsert {
  domain: string;
  our_domain: string;
  shared_keywords: number;
  competitor_keywords: number;
  our_keywords: number;
  overlap_pct: number;
  visibility_score: number;
}
