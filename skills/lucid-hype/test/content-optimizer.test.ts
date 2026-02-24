// ---------------------------------------------------------------------------
// content-optimizer.test.ts -- Tests for content optimization engine
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  scoreLengthFit,
  scoreHashtags,
  scoreReadability,
  scoreCTA,
  generateSuggestions,
  recommendContentType,
  optimizeContent,
} from '../src/core/analysis/content-optimizer.js';

describe('scoreLengthFit', () => {
  it('gives high score for ideal-length twitter content', () => {
    const text = 'x'.repeat(200); // ideal for twitter
    const score = scoreLengthFit(text, 'twitter');
    expect(score).toBeGreaterThan(60);
  });

  it('gives lower score for too-short content', () => {
    const score = scoreLengthFit('Hi', 'twitter');
    expect(score).toBeLessThan(60);
  });

  it('gives lower score for too-long content', () => {
    const text = 'x'.repeat(500); // over twitter max
    const score = scoreLengthFit(text, 'twitter');
    expect(score).toBeLessThan(60);
  });

  it('returns score between 0 and 100', () => {
    const score = scoreLengthFit('Hello world test content', 'linkedin');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles empty text', () => {
    const score = scoreLengthFit('', 'twitter');
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('scoreHashtags', () => {
  it('gives high score for optimal twitter hashtags', () => {
    const text = 'Hello world #AI #tech';
    const score = scoreHashtags(text, 'twitter');
    expect(score).toBeGreaterThan(70);
  });

  it('gives low score for no hashtags on twitter', () => {
    const score = scoreHashtags('Just a plain tweet', 'twitter');
    expect(score).toBeLessThan(60);
  });

  it('gives high score for no hashtags on reddit', () => {
    const score = scoreHashtags('Just a reddit post', 'reddit');
    expect(score).toBe(100);
  });

  it('penalizes hashtags on reddit', () => {
    const score = scoreHashtags('Post #tag #tag2', 'reddit');
    expect(score).toBeLessThan(100);
  });

  it('handles instagram with many hashtags', () => {
    const tags = Array.from({ length: 15 }, (_, i) => `#tag${i}`).join(' ');
    const score = scoreHashtags(`Photo ${tags}`, 'instagram');
    expect(score).toBeGreaterThan(50);
  });
});

describe('scoreReadability', () => {
  it('gives higher score for well-structured text', () => {
    const good =
      'This is a clear sentence. It has proper structure. The ideas flow well.\n\nA new paragraph starts here.';
    const score = scoreReadability(good);
    expect(score).toBeGreaterThan(60);
  });

  it('returns 0 for empty text', () => {
    expect(scoreReadability('')).toBe(0);
  });

  it('returns score between 0 and 100', () => {
    const score = scoreReadability('Just a simple sentence here.');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('scoreCTA', () => {
  it('gives high score when CTA is present', () => {
    const score = scoreCTA('Check out our new feature! Sign up today.');
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('gives low score when no CTA', () => {
    const score = scoreCTA('The weather is nice today in London.');
    expect(score).toBeLessThan(50);
  });

  it('handles single CTA', () => {
    const score = scoreCTA('What do you think about this approach?');
    expect(score).toBe(80);
  });
});

describe('generateSuggestions', () => {
  it('suggests hashtags when missing', () => {
    const suggestions = generateSuggestions({
      text: 'Great product launch today',
      platform: 'twitter',
    });
    const hashtagSug = suggestions.find((s) => s.area === 'Hashtags');
    expect(hashtagSug).toBeDefined();
  });

  it('suggests CTA when missing', () => {
    const suggestions = generateSuggestions({
      text: 'The weather is beautiful today.',
      platform: 'twitter',
    });
    const ctaSug = suggestions.find((s) => s.area === 'Call to Action');
    expect(ctaSug).toBeDefined();
  });

  it('suggests length fix for short content', () => {
    const suggestions = generateSuggestions({
      text: 'Hi',
      platform: 'linkedin',
    });
    const lengthSug = suggestions.find((s) => s.area === 'Content Length');
    expect(lengthSug).toBeDefined();
  });

  it('sorts suggestions by impact descending', () => {
    const suggestions = generateSuggestions({
      text: 'Hi',
      platform: 'linkedin',
    });
    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i].impact).toBeGreaterThanOrEqual(suggestions[i + 1].impact);
    }
  });

  it('does not suggest hashtags for hackernews', () => {
    const suggestions = generateSuggestions({
      text: 'Show HN: My new project for developers',
      platform: 'hackernews',
    });
    const hashtagSug = suggestions.find((s) => s.area === 'Hashtags');
    expect(hashtagSug).toBeUndefined();
  });
});

describe('recommendContentType', () => {
  it('recommends video for tiktok', () => {
    expect(recommendContentType('tiktok')).toBe('video');
  });

  it('recommends post for twitter', () => {
    expect(recommendContentType('twitter')).toBe('post');
  });

  it('recommends reel for instagram', () => {
    expect(recommendContentType('instagram')).toBe('reel');
  });

  it('recommends article for linkedin', () => {
    expect(recommendContentType('linkedin')).toBe('article');
  });
});

describe('optimizeContent', () => {
  it('returns overall score between 0 and 100', () => {
    const result = optimizeContent({
      text: 'Check out our amazing new AI tool #AI #startup',
      platform: 'twitter',
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('includes platform in result', () => {
    const result = optimizeContent({
      text: 'Hello world',
      platform: 'linkedin',
    });
    expect(result.platform).toBe('linkedin');
  });

  it('includes recommended hashtags', () => {
    const result = optimizeContent({
      text: 'Building an AI startup from scratch',
      platform: 'twitter',
    });
    expect(result.recommendedHashtags).toBeDefined();
    expect(Array.isArray(result.recommendedHashtags)).toBe(true);
  });
});
