// ---------------------------------------------------------------------------
// common.ts -- Shared enums and composite types for Lucid Hype
// ---------------------------------------------------------------------------

export const PLATFORMS = [
  'twitter',
  'linkedin',
  'reddit',
  'tiktok',
  'youtube',
  'instagram',
  'discord',
  'telegram',
  'hackernews',
  'producthunt',
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CONTENT_TYPES = [
  'post',
  'thread',
  'video',
  'article',
  'story',
  'reel',
  'newsletter',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const METRICS_PERIODS = ['1h', '6h', '24h', '7d', '30d', '90d'] as const;
export type MetricsPeriod = (typeof METRICS_PERIODS)[number];

export const ENGAGEMENT_LEVELS = ['viral', 'high', 'medium', 'low', 'dead'] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

/* ---------- Composite types used across the plugin ---------- */

export interface ViralityScore {
  score: number; // 0-100
  level: EngagementLevel;
  velocity: number; // engagements per hour
  shareRatio: number; // shares / total engagements
  commentDepth: number; // avg reply depth
  factors: ViralityFactor[];
}

export interface ViralityFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

export interface EngagementAnalysis {
  totalEngagement: number;
  engagementRate: number;
  bestPostingTimes: PostingTime[];
  audienceSegments: AudienceSegment[];
  sentimentBreakdown: SentimentBreakdown;
  topContentTypes: ContentTypePerformance[];
}

export interface PostingTime {
  dayOfWeek: number; // 0=Sun
  hourUtc: number;
  avgEngagement: number;
  platform: Platform;
}

export interface AudienceSegment {
  name: string;
  percentage: number;
  topInterests: string[];
  engagementRate: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ContentTypePerformance {
  contentType: ContentType;
  avgEngagement: number;
  count: number;
}

export interface ContentOptimization {
  platform: Platform;
  overallScore: number; // 0-100
  suggestions: ContentSuggestion[];
  optimalLength: number;
  recommendedHashtags: string[];
  recommendedFormat: ContentType;
  bestPostingTime: PostingTime | null;
}

export interface ContentSuggestion {
  area: string;
  current: string;
  recommended: string;
  impact: number; // 0-100
}

export interface InfluencerProfile {
  handle: string;
  name: string;
  platform: Platform;
  followers: number;
  engagementRate: number;
  niche: string[];
  relevanceScore: number;
  audienceQuality: number;
  avgLikes: number;
  avgComments: number;
  postFrequency: number;
}

export interface RankedInfluencer extends InfluencerProfile {
  rank: number;
  compositeScore: number;
  expectedReach: number;
}

export interface TrendingTopic {
  topic: string;
  platform: Platform;
  velocity: number;
  volume: number;
  relatedKeywords: string[];
  sentiment: SentimentBreakdown;
}

export interface CompetitorAnalysis {
  handle: string;
  platform: Platform;
  followers: number;
  engagementRate: number;
  postFrequency: number;
  topContentTypes: ContentTypePerformance[];
  strengths: string[];
  weaknesses: string[];
  contentThemes: string[];
}

export interface ContentCalendarEntry {
  date: string;
  platform: Platform;
  contentType: ContentType;
  topic: string;
  suggestedContent: string;
  hashtags: string[];
  bestTime: PostingTime | null;
}

export interface CampaignReport {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPlatform: Platform | null;
  topPost: { url: string; engagement: number } | null;
  viralityAvg: number;
  timeline: { date: string; engagement: number; impressions: number }[];
  recommendations: string[];
}
