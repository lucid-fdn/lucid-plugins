// ---------------------------------------------------------------------------
// database.ts -- Entity types for Supabase tables
// ---------------------------------------------------------------------------

import type {
  Platform,
  CampaignStatus,
  ContentType,
  EngagementLevel,
  MetricsPeriod,
} from './common.js';

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  platforms: Platform[];
  goals: string[];
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  tenant_id?: string;
  name: string;
  description?: string | null;
  status?: CampaignStatus;
  platforms: Platform[];
  goals?: string[];
  start_date?: string | null;
  end_date?: string | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Content Posts
// ---------------------------------------------------------------------------

export interface ContentPost {
  id: string;
  tenant_id: string;
  campaign_id: string | null;
  platform: Platform;
  content_type: ContentType;
  url: string | null;
  title: string | null;
  body: string | null;
  hashtags: string[];
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagement_level: EngagementLevel;
  posted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentPostInsert {
  tenant_id?: string;
  campaign_id?: string | null;
  platform: Platform;
  content_type?: ContentType;
  url?: string | null;
  title?: string | null;
  body?: string | null;
  hashtags?: string[];
  impressions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  engagement_level?: EngagementLevel;
  posted_at?: string | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Engagement Metrics
// ---------------------------------------------------------------------------

export interface EngagementMetric {
  id: string;
  tenant_id: string;
  post_id: string;
  period: MetricsPeriod;
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagement_rate: number;
  recorded_at: string;
  created_at: string;
}

export interface EngagementMetricInsert {
  tenant_id?: string;
  post_id: string;
  period: MetricsPeriod;
  impressions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  engagement_rate?: number;
  recorded_at?: string;
}

// ---------------------------------------------------------------------------
// Influencers
// ---------------------------------------------------------------------------

export interface Influencer {
  id: string;
  tenant_id: string;
  handle: string;
  name: string;
  platform: Platform;
  followers: number;
  engagement_rate: number;
  niche: string[];
  audience_quality: number;
  relevance_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InfluencerInsert {
  tenant_id?: string;
  handle: string;
  name: string;
  platform: Platform;
  followers?: number;
  engagement_rate?: number;
  niche?: string[];
  audience_quality?: number;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Campaign Analytics (aggregated)
// ---------------------------------------------------------------------------

export interface CampaignAnalytics {
  id: string;
  tenant_id: string;
  campaign_id: string;
  total_posts: number;
  total_impressions: number;
  total_engagement: number;
  avg_engagement_rate: number;
  top_platform: Platform | null;
  virality_avg: number;
  computed_at: string;
  created_at: string;
}

export interface CampaignAnalyticsInsert {
  tenant_id?: string;
  campaign_id: string;
  total_posts?: number;
  total_impressions?: number;
  total_engagement?: number;
  avg_engagement_rate?: number;
  top_platform?: Platform | null;
  virality_avg?: number;
  computed_at?: string;
}
