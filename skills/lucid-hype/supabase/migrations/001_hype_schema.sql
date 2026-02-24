-- ---------------------------------------------------------------------------
-- 001_hype_schema.sql -- Lucid Hype database schema
-- ---------------------------------------------------------------------------

-- Campaigns
CREATE TABLE IF NOT EXISTS hype_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL DEFAULT 'default',
  name          text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  platforms     text[] NOT NULL DEFAULT '{}',
  goals         text[] NOT NULL DEFAULT '{}',
  start_date    timestamptz,
  end_date      timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hype_campaigns_tenant ON hype_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hype_campaigns_status ON hype_campaigns(tenant_id, status);

-- Content Posts
CREATE TABLE IF NOT EXISTS hype_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         text NOT NULL DEFAULT 'default',
  campaign_id       uuid REFERENCES hype_campaigns(id) ON DELETE SET NULL,
  platform          text NOT NULL,
  content_type      text NOT NULL DEFAULT 'post',
  url               text,
  title             text,
  body              text,
  hashtags          text[] NOT NULL DEFAULT '{}',
  impressions       bigint NOT NULL DEFAULT 0,
  likes             bigint NOT NULL DEFAULT 0,
  shares            bigint NOT NULL DEFAULT 0,
  comments          bigint NOT NULL DEFAULT 0,
  clicks            bigint NOT NULL DEFAULT 0,
  engagement_level  text NOT NULL DEFAULT 'low' CHECK (engagement_level IN ('viral','high','medium','low','dead')),
  posted_at         timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hype_posts_tenant ON hype_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hype_posts_campaign ON hype_posts(tenant_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_hype_posts_platform ON hype_posts(tenant_id, platform);
CREATE INDEX IF NOT EXISTS idx_hype_posts_engagement ON hype_posts(tenant_id, engagement_level);

-- Engagement Metrics (time series)
CREATE TABLE IF NOT EXISTS hype_metrics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         text NOT NULL DEFAULT 'default',
  post_id           uuid NOT NULL REFERENCES hype_posts(id) ON DELETE CASCADE,
  period            text NOT NULL CHECK (period IN ('1h','6h','24h','7d','30d','90d')),
  impressions       bigint NOT NULL DEFAULT 0,
  likes             bigint NOT NULL DEFAULT 0,
  shares            bigint NOT NULL DEFAULT 0,
  comments          bigint NOT NULL DEFAULT 0,
  clicks            bigint NOT NULL DEFAULT 0,
  engagement_rate   real NOT NULL DEFAULT 0,
  recorded_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hype_metrics_post ON hype_metrics(tenant_id, post_id);
CREATE INDEX IF NOT EXISTS idx_hype_metrics_period ON hype_metrics(tenant_id, period);

-- Influencers
CREATE TABLE IF NOT EXISTS hype_influencers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         text NOT NULL DEFAULT 'default',
  handle            text NOT NULL,
  name              text NOT NULL,
  platform          text NOT NULL,
  followers         bigint NOT NULL DEFAULT 0,
  engagement_rate   real NOT NULL DEFAULT 0,
  niche             text[] NOT NULL DEFAULT '{}',
  audience_quality  real NOT NULL DEFAULT 0.5,
  relevance_score   real NOT NULL DEFAULT 0.5,
  metadata          jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_hype_influencers_tenant ON hype_influencers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hype_influencers_platform ON hype_influencers(tenant_id, platform);

-- Campaign Analytics (aggregated snapshots)
CREATE TABLE IF NOT EXISTS hype_campaign_analytics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           text NOT NULL DEFAULT 'default',
  campaign_id         uuid NOT NULL REFERENCES hype_campaigns(id) ON DELETE CASCADE,
  total_posts         int NOT NULL DEFAULT 0,
  total_impressions   bigint NOT NULL DEFAULT 0,
  total_engagement    bigint NOT NULL DEFAULT 0,
  avg_engagement_rate real NOT NULL DEFAULT 0,
  top_platform        text,
  virality_avg        real NOT NULL DEFAULT 0,
  computed_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hype_analytics_campaign ON hype_campaign_analytics(tenant_id, campaign_id);

-- Row Level Security (enable for multi-tenancy)
ALTER TABLE hype_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE hype_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hype_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hype_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hype_campaign_analytics ENABLE ROW LEVEL SECURITY;
