// ---------------------------------------------------------------------------
// influencer-ranker.ts -- Rank influencers by engagement quality and relevance
// ---------------------------------------------------------------------------

import type { InfluencerProfile, RankedInfluencer, Platform } from '../types/index.js';

export interface RankingWeights {
  engagementRate: number;
  audienceQuality: number;
  relevance: number;
  followerCount: number;
  postFrequency: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  engagementRate: 0.30,
  audienceQuality: 0.25,
  relevance: 0.20,
  followerCount: 0.15,
  postFrequency: 0.10,
};

/**
 * Normalize a value to 0-100 scale.
 */
export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Score engagement rate (0-100).
 * Industry average ~1-3%, high is 5%+, viral 10%+
 */
export function scoreEngagementRate(rate: number): number {
  if (rate >= 10) return 100;
  if (rate >= 5) return 80 + ((rate - 5) / 5) * 20;
  if (rate >= 3) return 60 + ((rate - 3) / 2) * 20;
  if (rate >= 1) return 30 + ((rate - 1) / 2) * 30;
  return Math.max(0, rate * 30);
}

/**
 * Score audience quality (0-100).
 * Based on the audience quality metric (0-1).
 */
export function scoreAudienceQuality(quality: number): number {
  return Math.max(0, Math.min(100, quality * 100));
}

/**
 * Score follower count (0-100) with logarithmic scale.
 * More followers is better but with diminishing returns.
 */
export function scoreFollowerCount(count: number): number {
  if (count <= 0) return 0;
  // log10(1000) = 3, log10(1M) = 6, log10(100M) = 8
  const logScore = Math.log10(count);
  return Math.max(0, Math.min(100, (logScore / 7) * 100));
}

/**
 * Score post frequency (0-100).
 * Sweet spot is 3-10 posts per week.
 */
export function scorePostFrequency(postsPerWeek: number): number {
  if (postsPerWeek <= 0) return 0;
  if (postsPerWeek >= 3 && postsPerWeek <= 10) return 100;
  if (postsPerWeek < 3) return Math.max(0, (postsPerWeek / 3) * 80);
  // More than 10 per week -- slight penalty for flooding
  return Math.max(40, 100 - (postsPerWeek - 10) * 5);
}

/**
 * Calculate composite score for a single influencer.
 */
export function computeCompositeScore(
  influencer: InfluencerProfile,
  weights: RankingWeights = DEFAULT_WEIGHTS,
): number {
  const engScore = scoreEngagementRate(influencer.engagementRate);
  const qualScore = scoreAudienceQuality(influencer.audienceQuality);
  const relScore = influencer.relevanceScore * 100;
  const follScore = scoreFollowerCount(influencer.followers);
  const freqScore = scorePostFrequency(influencer.postFrequency);

  const composite =
    engScore * weights.engagementRate +
    qualScore * weights.audienceQuality +
    relScore * weights.relevance +
    follScore * weights.followerCount +
    freqScore * weights.postFrequency;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

/**
 * Estimate expected reach for an influencer.
 */
export function estimateReach(influencer: InfluencerProfile): number {
  // Conservative: reach = followers * engagement rate * amplification
  const amplification = 1.5; // assumes some viral spread
  return Math.round(influencer.followers * (influencer.engagementRate / 100) * amplification);
}

/**
 * Rank a list of influencers by composite score.
 */
export function rankInfluencers(
  influencers: InfluencerProfile[],
  weights: RankingWeights = DEFAULT_WEIGHTS,
): RankedInfluencer[] {
  const scored = influencers.map((inf) => ({
    ...inf,
    compositeScore: computeCompositeScore(inf, weights),
    expectedReach: estimateReach(inf),
    rank: 0,
  }));

  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  return scored.map((inf, idx) => ({
    ...inf,
    rank: idx + 1,
  }));
}

/**
 * Filter influencers by minimum thresholds.
 */
export function filterInfluencers(
  influencers: InfluencerProfile[],
  opts: {
    minFollowers?: number;
    minEngagementRate?: number;
    minAudienceQuality?: number;
    platform?: Platform;
    niche?: string;
  },
): InfluencerProfile[] {
  return influencers.filter((inf) => {
    if (opts.minFollowers && inf.followers < opts.minFollowers) return false;
    if (opts.minEngagementRate && inf.engagementRate < opts.minEngagementRate) return false;
    if (opts.minAudienceQuality && inf.audienceQuality < opts.minAudienceQuality) return false;
    if (opts.platform && inf.platform !== opts.platform) return false;
    if (opts.niche && !inf.niche.includes(opts.niche)) return false;
    return true;
  });
}
