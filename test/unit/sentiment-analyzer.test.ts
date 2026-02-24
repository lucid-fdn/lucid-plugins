// ---------------------------------------------------------------------------
// sentiment-analyzer.test.ts -- Tests for sentiment analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  analyzeSentiment,
  classifyNps,
  extractThemes,
  detectUrgency,
} from '../../src/core/analysis/sentiment-analyzer.js';

describe('analyzeSentiment', () => {
  it('detects very positive sentiment', () => {
    const result = analyzeSentiment('I love this product! It is amazing and excellent!');
    expect(result.sentiment).toBe('very_positive');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects positive sentiment', () => {
    // 2 positive (good, nice) + 1 negative (slow) = score 0.33 -> positive
    const result = analyzeSentiment('It is a good and nice tool, though a bit slow');
    expect(result.sentiment).toBe('positive');
  });

  it('detects very negative sentiment', () => {
    const result = analyzeSentiment('I hate this terrible awful product. It is the worst and completely unusable.');
    expect(result.sentiment).toBe('very_negative');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects negative sentiment', () => {
    // 2 negative (annoying, slow) + 1 positive (good) = score -0.33 -> negative
    const result = analyzeSentiment('The tool is good but annoying and slow');
    expect(result.sentiment).toBe('negative');
  });

  it('detects neutral sentiment', () => {
    const result = analyzeSentiment('I used the product today. It was delivered on time.');
    expect(result.sentiment).toBe('neutral');
  });

  it('returns keywords found in text', () => {
    const result = analyzeSentiment('The product is amazing and fantastic');
    expect(result.keywords).toContain('amazing');
    expect(result.keywords).toContain('fantastic');
  });

  it('returns unique keywords', () => {
    const result = analyzeSentiment('great great great');
    const unique = new Set(result.keywords);
    expect(unique.size).toBe(result.keywords.length);
  });

  it('handles empty string', () => {
    const result = analyzeSentiment('');
    expect(result.sentiment).toBe('neutral');
    expect(result.confidence).toBe(0.3);
    expect(result.keywords).toEqual([]);
  });

  it('handles mixed sentiment text', () => {
    const result = analyzeSentiment('I love the design but hate the performance');
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it('confidence increases with more signal words', () => {
    const few = analyzeSentiment('good product');
    const many = analyzeSentiment('great excellent amazing wonderful fantastic superb product');
    expect(many.confidence).toBeGreaterThan(few.confidence);
  });

  it('strips punctuation before matching', () => {
    const result = analyzeSentiment('This is amazing!!! Absolutely fantastic...');
    expect(result.keywords).toContain('amazing');
    expect(result.keywords).toContain('fantastic');
  });

  it('is case insensitive', () => {
    const result = analyzeSentiment('AMAZING and EXCELLENT');
    expect(result.sentiment).toBe('very_positive');
  });

  it('detects single very positive word as very_positive when score is high', () => {
    const result = analyzeSentiment('This is absolutely perfect');
    expect(['very_positive', 'positive']).toContain(result.sentiment);
  });

  it('detects single very negative word', () => {
    const result = analyzeSentiment('The product is completely broken');
    expect(['very_negative', 'negative']).toContain(result.sentiment);
  });

  it('confidence is capped at 0.95', () => {
    const result = analyzeSentiment(
      'love amazing excellent awesome fantastic wonderful perfect best outstanding brilliant superb delightful',
    );
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });
});

describe('classifyNps', () => {
  it('classifies 0 as detractor', () => {
    expect(classifyNps(0)).toBe('detractor');
  });

  it('classifies 6 as detractor', () => {
    expect(classifyNps(6)).toBe('detractor');
  });

  it('classifies 7 as passive', () => {
    expect(classifyNps(7)).toBe('passive');
  });

  it('classifies 8 as passive', () => {
    expect(classifyNps(8)).toBe('passive');
  });

  it('classifies 9 as promoter', () => {
    expect(classifyNps(9)).toBe('promoter');
  });

  it('classifies 10 as promoter', () => {
    expect(classifyNps(10)).toBe('promoter');
  });

  it('classifies 3 as detractor', () => {
    expect(classifyNps(3)).toBe('detractor');
  });
});

describe('extractThemes', () => {
  it('returns empty array for empty input', () => {
    expect(extractThemes([])).toEqual([]);
  });

  it('detects performance theme', () => {
    const themes = extractThemes([
      { content: 'The app is slow and the loading takes forever' },
      { content: 'Performance is terrible, so much lag' },
    ]);
    const perfTheme = themes.find((t) => t.name === 'performance');
    expect(perfTheme).toBeDefined();
    expect(perfTheme!.count).toBe(2);
  });

  it('detects usability theme', () => {
    const themes = extractThemes([
      { content: 'The interface is confusing and not intuitive' },
    ]);
    const uxTheme = themes.find((t) => t.name === 'usability');
    expect(uxTheme).toBeDefined();
  });

  it('detects reliability theme', () => {
    const themes = extractThemes([
      { content: 'The app keeps crashing with errors' },
    ]);
    const reliabilityTheme = themes.find((t) => t.name === 'reliability');
    expect(reliabilityTheme).toBeDefined();
  });

  it('detects pricing theme', () => {
    const themes = extractThemes([
      { content: 'The pricing is too expensive for what you get' },
    ]);
    const pricingTheme = themes.find((t) => t.name === 'pricing');
    expect(pricingTheme).toBeDefined();
  });

  it('detects support theme', () => {
    const themes = extractThemes([
      { content: 'Customer support response time is too long' },
    ]);
    const supportTheme = themes.find((t) => t.name === 'support');
    expect(supportTheme).toBeDefined();
  });

  it('detects features theme', () => {
    const themes = extractThemes([
      { content: 'The feature I need is missing. Please add API integration.' },
    ]);
    const featuresTheme = themes.find((t) => t.name === 'features');
    expect(featuresTheme).toBeDefined();
  });

  it('detects documentation theme', () => {
    const themes = extractThemes([
      { content: 'The docs and documentation need more examples and tutorials' },
    ]);
    const docsTheme = themes.find((t) => t.name === 'documentation');
    expect(docsTheme).toBeDefined();
  });

  it('detects onboarding theme', () => {
    const themes = extractThemes([
      { content: 'The onboarding process and setup was difficult for a beginner' },
    ]);
    const onboardingTheme = themes.find((t) => t.name === 'onboarding');
    expect(onboardingTheme).toBeDefined();
  });

  it('sorts themes by count descending', () => {
    const themes = extractThemes([
      { content: 'slow performance lag' },
      { content: 'slow loading speed' },
      { content: 'confusing interface' },
    ]);
    for (let i = 1; i < themes.length; i++) {
      expect(themes[i - 1].count).toBeGreaterThanOrEqual(themes[i].count);
    }
  });

  it('calculates sentiment average per theme', () => {
    const themes = extractThemes([
      { content: 'The performance is slow', sentiment: 'negative' },
      { content: 'Great speed and fast loading', sentiment: 'positive' },
    ]);
    const perfTheme = themes.find((t) => t.name === 'performance');
    expect(perfTheme).toBeDefined();
    expect(perfTheme!.sentiment_avg).toBeDefined();
  });

  it('collects unique keywords per theme', () => {
    const themes = extractThemes([
      { content: 'slow loading speed' },
      { content: 'slow performance lag' },
    ]);
    const perfTheme = themes.find((t) => t.name === 'performance');
    expect(perfTheme).toBeDefined();
    expect(perfTheme!.keywords.length).toBeGreaterThan(0);
  });

  it('handles items with null sentiment', () => {
    const themes = extractThemes([
      { content: 'The interface is confusing', sentiment: null },
    ]);
    expect(themes.length).toBeGreaterThan(0);
  });
});

describe('detectUrgency', () => {
  it('returns low for normal text', () => {
    expect(detectUrgency('Just a general comment about the product')).toBe('low');
  });

  it('returns medium for slightly urgent text', () => {
    expect(detectUrgency('I cannot access my account')).toBe('medium');
  });

  it('returns high for moderately urgent text', () => {
    // 'urgent' + 'blocking' = 2 urgency words = high
    expect(detectUrgency('This is urgent and blocking our workflow')).toBe('high');
  });

  it('returns critical for very urgent text', () => {
    expect(detectUrgency('URGENT!!! Critical emergency, production is down, blocker, data loss, security issue')).toBe(
      'critical',
    );
  });

  it('detects urgency markers like !!!', () => {
    const priority = detectUrgency('This is a problem!!!');
    expect(['medium', 'high', 'critical']).toContain(priority);
  });

  it('detects ASAP keyword', () => {
    const priority = detectUrgency('We need this fixed ASAP');
    expect(['medium', 'high', 'critical']).toContain(priority);
  });

  it('is case insensitive for most words', () => {
    expect(detectUrgency('This is URGENT and blocking us')).not.toBe('low');
  });
});
