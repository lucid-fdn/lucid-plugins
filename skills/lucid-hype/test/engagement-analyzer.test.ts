// ---------------------------------------------------------------------------
// engagement-analyzer.test.ts -- Tests for engagement analysis engine
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  totalEngagement,
  postEngagementRate,
  findBestPostingTimes,
  analyzeSentiment,
  contentTypePerformance,
  generateAudienceSegments,
  analyzeEngagement,
  type PostData,
} from '../src/core/analysis/engagement-analyzer.js';

const samplePosts: PostData[] = [
  {
    platform: 'twitter',
    contentType: 'post',
    impressions: 10000,
    likes: 500,
    shares: 200,
    comments: 100,
    clicks: 50,
    postedAt: '2025-01-15T14:00:00Z',
  },
  {
    platform: 'twitter',
    contentType: 'thread',
    impressions: 20000,
    likes: 1500,
    shares: 800,
    comments: 400,
    clicks: 200,
    postedAt: '2025-01-16T14:00:00Z',
  },
  {
    platform: 'linkedin',
    contentType: 'article',
    impressions: 5000,
    likes: 200,
    shares: 100,
    comments: 50,
    clicks: 30,
    postedAt: '2025-01-15T10:00:00Z',
  },
  {
    platform: 'twitter',
    contentType: 'post',
    impressions: 1000,
    likes: 5,
    shares: 1,
    comments: 0,
    clicks: 2,
    postedAt: '2025-01-17T03:00:00Z',
  },
];

describe('totalEngagement', () => {
  it('sums likes, shares, comments, and clicks', () => {
    expect(totalEngagement(samplePosts[0])).toBe(850);
  });

  it('returns 0 for zero-engagement post', () => {
    const zero: PostData = {
      ...samplePosts[0],
      likes: 0,
      shares: 0,
      comments: 0,
      clicks: 0,
    };
    expect(totalEngagement(zero)).toBe(0);
  });
});

describe('postEngagementRate', () => {
  it('calculates rate as percentage', () => {
    const rate = postEngagementRate(samplePosts[0]);
    expect(rate).toBeCloseTo(8.5, 1);
  });

  it('returns 0 for zero impressions', () => {
    const zero: PostData = { ...samplePosts[0], impressions: 0 };
    expect(postEngagementRate(zero)).toBe(0);
  });
});

describe('findBestPostingTimes', () => {
  it('returns posting times sorted by engagement', () => {
    const times = findBestPostingTimes(samplePosts);
    expect(times.length).toBeGreaterThan(0);
    expect(times[0].avgEngagement).toBeGreaterThanOrEqual(
      times[times.length - 1].avgEngagement,
    );
  });

  it('respects limit parameter', () => {
    const times = findBestPostingTimes(samplePosts, 2);
    expect(times.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array for empty input', () => {
    expect(findBestPostingTimes([])).toEqual([]);
  });

  it('includes platform in results', () => {
    const times = findBestPostingTimes(samplePosts);
    for (const t of times) {
      expect(t.platform).toBeDefined();
    }
  });
});

describe('analyzeSentiment', () => {
  it('returns breakdown summing to approximately 1', () => {
    const s = analyzeSentiment(samplePosts);
    const total = s.positive + s.neutral + s.negative;
    expect(total).toBeCloseTo(1, 5);
  });

  it('returns all neutral for empty input', () => {
    const s = analyzeSentiment([]);
    expect(s.neutral).toBe(1);
  });
});

describe('contentTypePerformance', () => {
  it('groups performance by content type', () => {
    const perf = contentTypePerformance(samplePosts);
    expect(perf.length).toBeGreaterThan(0);
    const types = perf.map((p) => p.contentType);
    expect(types).toContain('post');
  });

  it('sorts by average engagement descending', () => {
    const perf = contentTypePerformance(samplePosts);
    for (let i = 0; i < perf.length - 1; i++) {
      expect(perf[i].avgEngagement).toBeGreaterThanOrEqual(perf[i + 1].avgEngagement);
    }
  });
});

describe('generateAudienceSegments', () => {
  it('returns segments with percentages', () => {
    const segments = generateAudienceSegments(samplePosts);
    expect(segments.length).toBeGreaterThan(0);
    for (const seg of segments) {
      expect(seg.percentage).toBeGreaterThan(0);
    }
  });

  it('returns empty for no posts', () => {
    expect(generateAudienceSegments([])).toEqual([]);
  });
});

describe('analyzeEngagement', () => {
  it('returns complete analysis', () => {
    const analysis = analyzeEngagement({ posts: samplePosts });
    expect(analysis.totalEngagement).toBeGreaterThan(0);
    expect(analysis.engagementRate).toBeGreaterThan(0);
    expect(analysis.bestPostingTimes).toBeDefined();
    expect(analysis.sentimentBreakdown).toBeDefined();
    expect(analysis.topContentTypes).toBeDefined();
    expect(analysis.audienceSegments).toBeDefined();
  });

  it('filters by platform when specified', () => {
    const twitter = analyzeEngagement({ posts: samplePosts, platform: 'twitter' });
    const all = analyzeEngagement({ posts: samplePosts });
    expect(twitter.totalEngagement).toBeLessThanOrEqual(all.totalEngagement);
  });
});
