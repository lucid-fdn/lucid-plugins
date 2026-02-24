// ---------------------------------------------------------------------------
// virality-scorer.test.ts -- Tests for virality scoring engine
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  calculateViralityScore,
  scoreToLevel,
  engagementVelocity,
  shareRatio,
  engagementRate,
  amplificationRatio,
  predictViralPotential,
  type ViralityInput,
} from '../src/core/analysis/virality-scorer.js';

const baseInput: ViralityInput = {
  impressions: 10000,
  likes: 500,
  shares: 200,
  comments: 100,
  clicks: 50,
  hoursLive: 24,
};

describe('scoreToLevel', () => {
  it('returns "viral" for scores >= 80', () => {
    expect(scoreToLevel(80)).toBe('viral');
    expect(scoreToLevel(100)).toBe('viral');
  });

  it('returns "high" for scores 60-79', () => {
    expect(scoreToLevel(60)).toBe('high');
    expect(scoreToLevel(79)).toBe('high');
  });

  it('returns "medium" for scores 35-59', () => {
    expect(scoreToLevel(35)).toBe('medium');
    expect(scoreToLevel(59)).toBe('medium');
  });

  it('returns "low" for scores 15-34', () => {
    expect(scoreToLevel(15)).toBe('low');
    expect(scoreToLevel(34)).toBe('low');
  });

  it('returns "dead" for scores < 15', () => {
    expect(scoreToLevel(0)).toBe('dead');
    expect(scoreToLevel(14)).toBe('dead');
  });
});

describe('engagementVelocity', () => {
  it('calculates engagements per hour', () => {
    const v = engagementVelocity(baseInput);
    // (500+200+100+50) / 24 = 35.42
    expect(v).toBeCloseTo(35.42, 1);
  });

  it('returns 0 when hoursLive is 0', () => {
    expect(engagementVelocity({ ...baseInput, hoursLive: 0 })).toBe(0);
  });

  it('returns higher velocity for same engagement in fewer hours', () => {
    const v1 = engagementVelocity({ ...baseInput, hoursLive: 24 });
    const v2 = engagementVelocity({ ...baseInput, hoursLive: 1 });
    expect(v2).toBeGreaterThan(v1);
  });
});

describe('shareRatio', () => {
  it('calculates shares / total engagements', () => {
    const r = shareRatio(baseInput);
    // 200 / (500+200+100+50) = 0.2353
    expect(r).toBeCloseTo(0.2353, 3);
  });

  it('returns 0 when no engagements', () => {
    expect(
      shareRatio({ ...baseInput, likes: 0, shares: 0, comments: 0, clicks: 0 }),
    ).toBe(0);
  });
});

describe('engagementRate', () => {
  it('calculates rate relative to impressions', () => {
    const r = engagementRate(baseInput);
    // (500+200+100+50) / 10000 * 100 = 8.5%
    expect(r).toBeCloseTo(8.5, 1);
  });

  it('returns 0 when no impressions', () => {
    expect(engagementRate({ ...baseInput, impressions: 0 })).toBe(0);
  });
});

describe('amplificationRatio', () => {
  it('calculates shares / (likes + comments)', () => {
    const r = amplificationRatio(baseInput);
    // 200 / (500 + 100) = 0.333
    expect(r).toBeCloseTo(0.333, 2);
  });

  it('returns 0 when no likes or comments', () => {
    expect(amplificationRatio({ ...baseInput, likes: 0, comments: 0 })).toBe(0);
  });
});

describe('calculateViralityScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = calculateViralityScore(baseInput);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns level matching the score', () => {
    const result = calculateViralityScore(baseInput);
    expect(result.level).toBe(scoreToLevel(result.score));
  });

  it('includes velocity in output', () => {
    const result = calculateViralityScore(baseInput);
    expect(result.velocity).toBeCloseTo(35.42, 1);
  });

  it('includes 5 factors', () => {
    const result = calculateViralityScore(baseInput);
    expect(result.factors).toHaveLength(5);
  });

  it('returns higher score for viral content', () => {
    const viral: ViralityInput = {
      impressions: 100000,
      likes: 20000,
      shares: 15000,
      comments: 5000,
      clicks: 3000,
      hoursLive: 2,
      replyDepthAvg: 4,
    };
    const result = calculateViralityScore(viral);
    expect(result.score).toBeGreaterThan(70);
  });

  it('returns low score for dead content', () => {
    const dead: ViralityInput = {
      impressions: 10000,
      likes: 5,
      shares: 0,
      comments: 1,
      clicks: 0,
      hoursLive: 72,
    };
    const result = calculateViralityScore(dead);
    expect(result.score).toBeLessThan(20);
  });

  it('handles zero engagement gracefully', () => {
    const zero: ViralityInput = {
      impressions: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      clicks: 0,
      hoursLive: 1,
    };
    const result = calculateViralityScore(zero);
    expect(result.score).toBe(0);
    expect(result.level).toBe('dead');
  });
});

describe('predictViralPotential', () => {
  it('returns higher score with media', () => {
    const withMedia = predictViralPotential({
      textLength: 150,
      hasMedia: true,
      hasHashtags: true,
      hasMentions: false,
      hasEmoji: false,
      hasQuestion: false,
      hasNumbers: false,
      platform: 'twitter',
    });
    const withoutMedia = predictViralPotential({
      textLength: 150,
      hasMedia: false,
      hasHashtags: true,
      hasMentions: false,
      hasEmoji: false,
      hasQuestion: false,
      hasNumbers: false,
      platform: 'twitter',
    });
    expect(withMedia).toBeGreaterThan(withoutMedia);
  });

  it('returns score between 0 and 100', () => {
    const score = predictViralPotential({
      textLength: 200,
      hasMedia: true,
      hasHashtags: true,
      hasMentions: true,
      hasEmoji: true,
      hasQuestion: true,
      hasNumbers: true,
      platform: 'twitter',
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
