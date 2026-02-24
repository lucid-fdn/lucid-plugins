-- ============================================================================
-- Lucid SEO: Search Intelligence Schema
-- ============================================================================

CREATE TABLE seo_keywords (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  competition NUMERIC(5,4) DEFAULT 0,
  difficulty INTEGER DEFAULT 50,
  intent TEXT NOT NULL DEFAULT 'informational',
  serp_features JSONB DEFAULT '[]',
  current_rank INTEGER,
  previous_rank INTEGER,
  url TEXT,
  tracked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, keyword)
);

CREATE TABLE seo_serp_results (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  keyword_id INTEGER NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL DEFAULT '',
  serp_features JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seo_backlink_profiles (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  domain TEXT NOT NULL,
  referring_domains INTEGER DEFAULT 0,
  total_backlinks INTEGER DEFAULT 0,
  domain_authority INTEGER DEFAULT 0,
  page_authority INTEGER DEFAULT 0,
  spam_score INTEGER DEFAULT 0,
  dofollow_count INTEGER DEFAULT 0,
  nofollow_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, domain)
);

CREATE TABLE seo_backlinks (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES seo_backlink_profiles(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT DEFAULT '',
  link_type TEXT NOT NULL DEFAULT 'dofollow',
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_lost BOOLEAN DEFAULT FALSE
);

CREATE TABLE seo_content_analyses (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  word_count INTEGER DEFAULT 0,
  readability_score INTEGER DEFAULT 0,
  keyword_density NUMERIC(5,2) DEFAULT 0,
  heading_structure JSONB DEFAULT '{}',
  meta_description TEXT DEFAULT '',
  meta_title TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  suggestions JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seo_technical_audits (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  domain TEXT NOT NULL,
  issues JSONB DEFAULT '[]',
  pages_crawled INTEGER DEFAULT 0,
  healthy_pages INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  redirect_chains INTEGER DEFAULT 0,
  missing_meta INTEGER DEFAULT 0,
  slow_pages INTEGER DEFAULT 0,
  mobile_issues INTEGER DEFAULT 0,
  schema_errors INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  audited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seo_competitor_tracks (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  domain TEXT NOT NULL,
  our_domain TEXT NOT NULL,
  shared_keywords INTEGER DEFAULT 0,
  competitor_keywords INTEGER DEFAULT 0,
  our_keywords INTEGER DEFAULT 0,
  overlap_pct NUMERIC(5,2) DEFAULT 0,
  visibility_score NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX seo_keywords_tenant_idx ON seo_keywords(tenant_id);
CREATE INDEX seo_keywords_intent_idx ON seo_keywords(intent);
CREATE INDEX seo_keywords_volume_idx ON seo_keywords(search_volume DESC);
CREATE INDEX seo_keywords_rank_idx ON seo_keywords(current_rank) WHERE current_rank IS NOT NULL;

CREATE INDEX seo_serp_results_keyword_idx ON seo_serp_results(keyword_id, position);
CREATE INDEX seo_serp_results_checked_idx ON seo_serp_results(checked_at DESC);

CREATE INDEX seo_backlink_profiles_domain_idx ON seo_backlink_profiles(domain);
CREATE INDEX seo_backlink_profiles_authority_idx ON seo_backlink_profiles(domain_authority DESC);

CREATE INDEX seo_backlinks_profile_idx ON seo_backlinks(profile_id, is_lost);
CREATE INDEX seo_backlinks_source_idx ON seo_backlinks(source_domain);

CREATE INDEX seo_content_analyses_url_idx ON seo_content_analyses(url, analyzed_at DESC);
CREATE INDEX seo_content_analyses_score_idx ON seo_content_analyses(score DESC);

CREATE INDEX seo_technical_audits_domain_idx ON seo_technical_audits(domain, audited_at DESC);
CREATE INDEX seo_technical_audits_score_idx ON seo_technical_audits(score);

CREATE INDEX seo_competitor_tracks_domains_idx ON seo_competitor_tracks(our_domain, domain);
CREATE INDEX seo_competitor_tracks_overlap_idx ON seo_competitor_tracks(overlap_pct DESC);
