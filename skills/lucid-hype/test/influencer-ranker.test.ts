// ---------------------------------------------------------------------------
// influencer-ranker.test.ts -- Tests for influencer ranking engine
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  scoreEngagementRate,
  scoreAudienceQuality,
  scoreFollowerCount,
  scorePostFrequency,
  computeCompositeScore,
  estimateReach,
  rankInfluencers,
  filterInfluencers,
  normalize,
  type RankingWeights,
} from '../src/core/analysis/influencer-ranker.js';
import type { InfluencerProfile } from '../src/core/types/index.js';

const sampleInfluencer: InfluencerProfile = {
  handle: 'testuser',
  name: 'Test User',
  platform: 'twitter',
  followers: 50000,
  engagementRate: 3.5,
  niche: ['tech', 'ai'],
  relevanceScore: 0.8,
  audienceQuality: 0.75,
  avgLikes: 500,
  avgComments: 50,
  postFrequency: 5,
};

describe('normalize', () => {
  it('normalizes values to 0-100 range', () => {
    expect(normalize(5, 0, 10)).toBe(50);
    expect(normalize(0, 0, 10)).toBe(0);
    expect(normalize(10, 0, 10)).toBe(100);
  });

  it('clamps to 0-100', () => {
    expect(normalize(-5, 0, 10)).toBe(0);
    expect(normalize(15, 0, 10)).toBe(100);
  });

  it('returns 50 when min equals max', () => {
    expect(normalize(5, 5, 5)).toBe(50);
  });
});

describe('scoreEngagementRate', () => {
  it('returns 100 for 10%+ engagement', () => {
    expect(scoreEngagementRate(10)).toBe(100);
    expect(scoreEngagementRate(15)).toBe(100);
  });

  it('returns high score for 5%+ engagement', () => {
    const score = scoreEngagementRate(5);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('returns moderate score for average engagement', () => {
    const score = scoreEngagementRate(2);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(80);
  });

  it('returns low score for poor engagement', () => {
    expect(scoreEngagementRate(0)).toBe(0);
  });
});

describe('scoreAudienceQuality', () => {
  it('converts 0-1 quality to 0-100', () => {
    expect(scoreAudienceQuality(0.5)).toBe(50);
    expect(scoreAudienceQuality(1)).toBe(100);
    expect(scoreAudienceQuality(0)).toBe(0);
  });
});

describe('scoreFollowerCount', () => {
  it('returns higher scores for more followers', () => {
    const small = scoreFollowerCount(1000);
    const medium = scoreFollowerCount(100000);
    const large = scoreFollowerCount(1000000);
    expect(large).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(small);
  });

  it('returns 0 for 0 followers', () => {
    expect(scoreFollowerCount(0)).toBe(0);
  });
});

describe('scorePostFrequency', () => {
  it('returns 100 for optimal frequency (3-10/week)', () => {
    expect(scorePostFrequency(5)).toBe(100);
    expect(scorePostFrequency(7)).toBe(100);
  });

  it('returns lower score for infrequent posting', () => {
    expect(scorePostFrequency(1)).toBeLessThan(100);
  });

  it('returns 0 for no posting', () => {
    expect(scorePostFrequency(0)).toBe(0);
  });
});

describe('computeCompositeScore', () => {
  it('returns score between 0 and 100', () => {
    const score = computeCompositeScore(sampleInfluencer);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('accepts custom weights', () => {
    const weights: RankingWeights = {
      engagementRate: 1.0,
      audienceQuality: 0,
      relevance: 0,
      followerCount: 0,
      postFrequency: 0,
    };
    const score = computeCompositeScore(sampleInfluencer, weights);
    // Score should be purely based on engagement rate
    expect(score).toBeGreaterThan(0);
  });
});

describe('estimateReach', () => {
  it('estimates reach based on followers and engagement', () => {
    const reach = estimateReach(sampleInfluencer);
    expect(reach).toBeGreaterThan(0);
    expect(reach).toBeLessThan(sampleInfluencer.followers);
  });
});

describe('rankInfluencers', () => {
  it('ranks influencers by composite score', () => {
    const influencers: InfluencerProfile[] = [
      { ...sampleInfluencer, handle: 'low', engagementRate: 0.5, followers: 100 },
      { ...sampleInfluencer, handle: 'high', engagementRate: 8, followers: 500000 },
      sampleInfluencer,
    ];
    const ranked = rankInfluencers(influencers);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].compositeScore).toBeGreaterThanOrEqual(ranked[1].compositeScore);
    expect(ranked[1].compositeScore).toBeGreaterThanOrEqual(ranked[2].compositeScore);
  });

  it('assigns sequential ranks', () => {
    const ranked = rankInfluencers([sampleInfluencer, sampleInfluencer]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });
});

describe('filterInfluencers', () => {
  it('filters by minimum followers', () => {
    const influencers = [
      { ...sampleInfluencer, followers: 1000 },
      { ...sampleInfluencer, followers: 100000 },
    ];
    const filtered = filterInfluencers(influencers, { minFollowers: 50000 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].followers).toBe(100000);
  });

  it('filters by platform', () => {
    const influencers = [
      { ...sampleInfluencer, platform: 'twitter' as const },
      { ...sampleInfluencer, platform: 'linkedin' as const },
    ];
    const filtered = filterInfluencers(influencers, { platform: 'twitter' });
    expect(filtered).toHaveLength(1);
  });
});
