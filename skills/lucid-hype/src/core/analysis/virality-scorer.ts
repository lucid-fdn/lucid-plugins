// ---------------------------------------------------------------------------
// virality-scorer.ts -- Calculate virality scores based on engagement metrics
// ---------------------------------------------------------------------------

import type { ViralityScore, ViralityFactor, EngagementLevel } from '../types/common.js';

/** Map numeric score (0-100) to engagement level */
export function scoreToLevel(score: number): EngagementLevel {
  if (score >= 80) return 'viral';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'dead';
}

export interface ViralityInput {
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  hoursLive: number;
  replyDepthAvg?: number;
  followerCount?: number;
}

/**
 * Calculate engagement velocity (interactions per hour).
 */
export function engagementVelocity(input: ViralityInput): number {
  const totalEngagement = input.likes + input.shares + input.comments + input.clicks;
  if (input.hoursLive <= 0) return 0;
  return totalEngagement / input.hoursLive;
}

/**
 * Calculate share ratio: shares / total engagements.
 * Higher share ratios indicate content people want to spread.
 */
export function shareRatio(input: ViralityInput): number {
  const total = input.likes + input.shares + input.comments + input.clicks;
  if (total === 0) return 0;
  return input.shares / total;
}

/**
 * Calculate engagement rate relative to impressions.
 */
export function engagementRate(input: ViralityInput): number {
  if (input.impressions === 0) return 0;
  const total = input.likes + input.shares + input.comments + input.clicks;
  return (total / input.impressions) * 100;
}

/**
 * Calculate amplification ratio: shares / (likes + comments).
 * Measures how much content gets redistributed vs just acknowledged.
 */
export function amplificationRatio(input: ViralityInput): number {
  const base = input.likes + input.comments;
  if (base === 0) return 0;
  return input.shares / base;
}

/**
 * Calculate overall virality score from engagement metrics.
 *
 * Factors:
 * - Engagement velocity (30% weight)
 * - Share ratio (25% weight)
 * - Engagement rate (20% weight)
 * - Amplification ratio (15% weight)
 * - Comment depth (10% weight)
 */
export function calculateViralityScore(input: ViralityInput): ViralityScore {
  const factors: ViralityFactor[] = [];

  // Factor 1: Engagement velocity
  const velocity = engagementVelocity(input);
  const velocityScore = Math.min(100, (velocity / 50) * 100); // 50 eng/hr = max
  factors.push({
    name: 'Engagement Velocity',
    weight: 0.3,
    value: velocityScore,
    description: `${velocity.toFixed(1)} engagements/hour`,
  });

  // Factor 2: Share ratio
  const sRatio = shareRatio(input);
  const shareScore = Math.min(100, (sRatio / 0.4) * 100); // 40% share ratio = max
  factors.push({
    name: 'Share Ratio',
    weight: 0.25,
    value: shareScore,
    description: `${(sRatio * 100).toFixed(1)}% of engagements are shares`,
  });

  // Factor 3: Engagement rate
  const eRate = engagementRate(input);
  const engagementScore = Math.min(100, (eRate / 10) * 100); // 10% engagement rate = max
  factors.push({
    name: 'Engagement Rate',
    weight: 0.2,
    value: engagementScore,
    description: `${eRate.toFixed(2)}% of impressions engage`,
  });

  // Factor 4: Amplification ratio
  const ampRatio = amplificationRatio(input);
  const ampScore = Math.min(100, (ampRatio / 2) * 100); // 2x amplification = max
  factors.push({
    name: 'Amplification Ratio',
    weight: 0.15,
    value: ampScore,
    description: `${ampRatio.toFixed(2)}x redistribution ratio`,
  });

  // Factor 5: Comment depth
  const depth = input.replyDepthAvg ?? 0;
  const depthScore = Math.min(100, (depth / 5) * 100); // 5 avg depth = max
  factors.push({
    name: 'Comment Depth',
    weight: 0.1,
    value: depthScore,
    description: `${depth.toFixed(1)} average reply depth`,
  });

  // Calculate weighted score
  const score = Math.round(
    factors.reduce((sum, f) => sum + f.value * f.weight, 0),
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    level: scoreToLevel(clampedScore),
    velocity,
    shareRatio: sRatio,
    commentDepth: depth,
    factors,
  };
}

/**
 * Predict viral potential before posting based on content characteristics.
 */
export function predictViralPotential(params: {
  textLength: number;
  hasMedia: boolean;
  hasHashtags: boolean;
  hasMentions: boolean;
  hasEmoji: boolean;
  hasQuestion: boolean;
  hasNumbers: boolean;
  platform: string;
}): number {
  let score = 30; // base score

  // Media boosts engagement significantly
  if (params.hasMedia) score += 20;

  // Optimal text length by platform
  const platformLengths: Record<string, { min: number; max: number }> = {
    twitter: { min: 80, max: 240 },
    linkedin: { min: 200, max: 1500 },
    reddit: { min: 100, max: 800 },
    instagram: { min: 50, max: 300 },
  };
  const range = platformLengths[params.platform] ?? { min: 50, max: 500 };
  if (params.textLength >= range.min && params.textLength <= range.max) {
    score += 15;
  } else if (params.textLength > range.max) {
    score -= 5;
  }

  if (params.hasHashtags) score += 5;
  if (params.hasMentions) score += 5;
  if (params.hasEmoji) score += 5;
  if (params.hasQuestion) score += 10;
  if (params.hasNumbers) score += 5;

  return Math.max(0, Math.min(100, score));
}
