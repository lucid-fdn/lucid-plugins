// ---------------------------------------------------------------------------
// engagement-analyzer.ts -- Analyze engagement patterns and audience behavior
// ---------------------------------------------------------------------------

import type {
  EngagementAnalysis,
  PostingTime,
  AudienceSegment,
  SentimentBreakdown,
  ContentTypePerformance,
  Platform,
  ContentType,
  ContentPost,
} from '../types/index.js';

export interface EngagementInput {
  posts: PostData[];
  platform?: Platform;
}

export interface PostData {
  platform: Platform;
  contentType: ContentType;
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  postedAt: string;
  body?: string;
}

/**
 * Calculate total engagement for a post.
 */
export function totalEngagement(post: PostData): number {
  return post.likes + post.shares + post.comments + post.clicks;
}

/**
 * Calculate engagement rate for a post.
 */
export function postEngagementRate(post: PostData): number {
  if (post.impressions === 0) return 0;
  return (totalEngagement(post) / post.impressions) * 100;
}

/**
 * Find best posting times from historical data.
 */
export function findBestPostingTimes(posts: PostData[], limit: number = 5): PostingTime[] {
  // Group by day of week + hour
  const slots = new Map<string, { total: number; count: number; platform: Platform }>();

  for (const post of posts) {
    const date = new Date(post.postedAt);
    if (isNaN(date.getTime())) continue;
    const key = `${post.platform}-${date.getUTCDay()}-${date.getUTCHours()}`;
    const existing = slots.get(key) ?? { total: 0, count: 0, platform: post.platform };
    existing.total += totalEngagement(post);
    existing.count += 1;
    slots.set(key, existing);
  }

  const times: PostingTime[] = [];
  for (const [key, data] of slots) {
    const parts = key.split('-');
    const platform = parts.slice(0, -2).join('-') as Platform;
    const dayOfWeek = parseInt(parts[parts.length - 2], 10);
    const hourUtc = parseInt(parts[parts.length - 1], 10);
    times.push({
      platform,
      dayOfWeek,
      hourUtc,
      avgEngagement: data.count > 0 ? data.total / data.count : 0,
    });
  }

  return times.sort((a, b) => b.avgEngagement - a.avgEngagement).slice(0, limit);
}

/**
 * Analyze sentiment breakdown from posts.
 */
export function analyzeSentiment(posts: PostData[]): SentimentBreakdown {
  if (posts.length === 0) return { positive: 0, neutral: 1, negative: 0 };

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const post of posts) {
    const rate = postEngagementRate(post);
    // High engagement often correlates with positive/polarizing content
    if (rate > 5) {
      positive++;
    } else if (rate > 1) {
      neutral++;
    } else {
      negative++;
    }
  }

  const total = positive + neutral + negative;
  return {
    positive: positive / total,
    neutral: neutral / total,
    negative: negative / total,
  };
}

/**
 * Get content type performance breakdown.
 */
export function contentTypePerformance(posts: PostData[]): ContentTypePerformance[] {
  const byType = new Map<ContentType, { totalEng: number; count: number }>();

  for (const post of posts) {
    const existing = byType.get(post.contentType) ?? { totalEng: 0, count: 0 };
    existing.totalEng += totalEngagement(post);
    existing.count += 1;
    byType.set(post.contentType, existing);
  }

  const results: ContentTypePerformance[] = [];
  for (const [contentType, data] of byType) {
    results.push({
      contentType,
      avgEngagement: data.count > 0 ? data.totalEng / data.count : 0,
      count: data.count,
    });
  }

  return results.sort((a, b) => b.avgEngagement - a.avgEngagement);
}

/**
 * Generate basic audience segments from engagement patterns.
 */
export function generateAudienceSegments(posts: PostData[]): AudienceSegment[] {
  if (posts.length === 0) return [];

  const highEngagement = posts.filter((p) => postEngagementRate(p) > 5);
  const medEngagement = posts.filter(
    (p) => postEngagementRate(p) > 1 && postEngagementRate(p) <= 5,
  );
  const lowEngagement = posts.filter((p) => postEngagementRate(p) <= 1);

  const segments: AudienceSegment[] = [];

  if (highEngagement.length > 0) {
    const platforms = [...new Set(highEngagement.map((p) => p.platform))];
    segments.push({
      name: 'Power Engagers',
      percentage: (highEngagement.length / posts.length) * 100,
      topInterests: platforms,
      engagementRate:
        highEngagement.reduce((s, p) => s + postEngagementRate(p), 0) / highEngagement.length,
    });
  }

  if (medEngagement.length > 0) {
    const platforms = [...new Set(medEngagement.map((p) => p.platform))];
    segments.push({
      name: 'Casual Followers',
      percentage: (medEngagement.length / posts.length) * 100,
      topInterests: platforms,
      engagementRate:
        medEngagement.reduce((s, p) => s + postEngagementRate(p), 0) / medEngagement.length,
    });
  }

  if (lowEngagement.length > 0) {
    const platforms = [...new Set(lowEngagement.map((p) => p.platform))];
    segments.push({
      name: 'Passive Viewers',
      percentage: (lowEngagement.length / posts.length) * 100,
      topInterests: platforms,
      engagementRate:
        lowEngagement.reduce((s, p) => s + postEngagementRate(p), 0) / lowEngagement.length,
    });
  }

  return segments;
}

/**
 * Full engagement analysis from a set of posts.
 */
export function analyzeEngagement(input: EngagementInput): EngagementAnalysis {
  const posts = input.platform
    ? input.posts.filter((p) => p.platform === input.platform)
    : input.posts;

  const totalEng = posts.reduce((sum, p) => sum + totalEngagement(p), 0);
  const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
  const avgRate = totalImpressions > 0 ? (totalEng / totalImpressions) * 100 : 0;

  return {
    totalEngagement: totalEng,
    engagementRate: avgRate,
    bestPostingTimes: findBestPostingTimes(posts),
    audienceSegments: generateAudienceSegments(posts),
    sentimentBreakdown: analyzeSentiment(posts),
    topContentTypes: contentTypePerformance(posts),
  };
}

/**
 * Convert a ContentPost DB record to PostData for analysis.
 */
export function contentPostToPostData(post: ContentPost): PostData {
  return {
    platform: post.platform,
    contentType: post.content_type,
    impressions: post.impressions,
    likes: post.likes,
    shares: post.shares,
    comments: post.comments,
    clicks: post.clicks,
    postedAt: post.posted_at ?? post.created_at,
    body: post.body ?? undefined,
  };
}
