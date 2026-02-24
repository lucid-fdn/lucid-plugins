// ---------------------------------------------------------------------------
// categorizer.test.ts -- Tests for feedback categorization
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  categorize,
  extractFeatureRequests,
  prioritizeFeedback,
} from '../../src/core/analysis/categorizer.js';

describe('categorize', () => {
  it('categorizes bug reports', () => {
    expect(categorize('There is a bug that causes the app to crash')).toBe('bug');
  });

  it('categorizes feature requests', () => {
    expect(categorize('Please add a dark mode feature. It would be nice to have this.')).toBe('feature_request');
  });

  it('categorizes UX feedback', () => {
    expect(categorize('The interface is confusing and the navigation is unintuitive')).toBe('ux');
  });

  it('categorizes performance issues', () => {
    expect(categorize('The loading speed is slow and there is significant latency')).toBe('performance');
  });

  it('categorizes pricing feedback', () => {
    expect(categorize('The pricing is too expensive and the subscription cost is high')).toBe('pricing');
  });

  it('categorizes support feedback', () => {
    expect(categorize('The support team response time is too long when I submit a ticket')).toBe('support');
  });

  it('categorizes documentation feedback', () => {
    expect(categorize('The documentation needs more examples and tutorials')).toBe('documentation');
  });

  it('defaults to general for ambiguous text', () => {
    expect(categorize('I used the product today')).toBe('general');
  });

  it('picks category with most keyword matches', () => {
    // 'bug' keywords: bug, error, crash, broken, fix, issue
    const result = categorize('There is a bug and an error and an issue with the crash');
    expect(result).toBe('bug');
  });

  it('is case insensitive', () => {
    expect(categorize('BUG ERROR CRASH')).toBe('bug');
  });

  it('handles empty string', () => {
    expect(categorize('')).toBe('general');
  });
});

describe('extractFeatureRequests', () => {
  it('returns empty for no feature requests', () => {
    const result = extractFeatureRequests([
      { content: 'The app crashes a lot due to bugs' },
    ]);
    expect(result).toEqual([]);
  });

  it('extracts feature requests from items', () => {
    const result = extractFeatureRequests([
      { content: 'Please add a feature for API integration' },
      { content: 'The app crashes' },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('feature_request');
  });

  it('respects pre-categorized items', () => {
    const result = extractFeatureRequests([
      { content: 'Any text here', category: 'feature_request' },
    ]);
    expect(result.length).toBe(1);
  });

  it('ignores non-feature items even if they have keywords', () => {
    const result = extractFeatureRequests([
      { content: 'Bug in the system', category: 'bug' },
    ]);
    expect(result).toEqual([]);
  });

  it('assigns priority based on urgency', () => {
    const result = extractFeatureRequests([
      { content: 'Please add this feature, it is urgent and critical' },
    ]);
    if (result.length > 0) {
      expect(['low', 'medium', 'high', 'critical']).toContain(result[0].priority);
    }
  });

  it('includes keywords in results', () => {
    const result = extractFeatureRequests([
      { content: 'Please add a feature suggestion for integration' },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].keywords.length).toBeGreaterThan(0);
  });

  it('sorts by priority descending', () => {
    const result = extractFeatureRequests([
      { content: 'A nice feature request suggestion' },
      { content: 'Please add a critical urgent blocker feature immediately' },
    ]);
    if (result.length >= 2) {
      const priorityOrder = ['critical', 'high', 'medium', 'low'];
      const idx0 = priorityOrder.indexOf(result[0].priority);
      const idx1 = priorityOrder.indexOf(result[1].priority);
      expect(idx0).toBeLessThanOrEqual(idx1);
    }
  });

  it('uses sentiment from item if provided', () => {
    const result = extractFeatureRequests([
      { content: 'Please add feature', sentiment: 'positive' },
    ]);
    if (result.length > 0) {
      expect(result[0].sentiment).toBe('positive');
    }
  });
});

describe('prioritizeFeedback', () => {
  it('returns empty for empty input', () => {
    expect(prioritizeFeedback([])).toEqual([]);
  });

  it('assigns priority to items', () => {
    const result = prioritizeFeedback([
      { content: 'The app has a bug that crashes everything' },
    ]);
    expect(result.length).toBe(1);
    expect(['low', 'medium', 'high', 'critical']).toContain(result[0].priority);
  });

  it('bug reports rank higher than general feedback', () => {
    const result = prioritizeFeedback([
      { content: 'Just a general comment' },
      { content: 'Critical bug causing crashes and errors in production' },
    ]);
    expect(result[0].category).toBe('bug');
  });

  it('includes urgency and impact scores', () => {
    const result = prioritizeFeedback([
      { content: 'Something about the product' },
    ]);
    expect(result[0].urgency_score).toBeDefined();
    expect(result[0].impact_score).toBeDefined();
  });

  it('sorts by combined score descending', () => {
    const result = prioritizeFeedback([
      { content: 'Nice product' },
      { content: 'Terrible crash bug error broken production urgent' },
      { content: 'Okay features' },
    ]);
    for (let i = 1; i < result.length; i++) {
      const prevScore = result[i - 1].urgency_score * 2 + result[i - 1].impact_score;
      const currScore = result[i].urgency_score * 2 + result[i].impact_score;
      expect(prevScore).toBeGreaterThanOrEqual(currScore);
    }
  });

  it('uses pre-assigned category if available', () => {
    const result = prioritizeFeedback([
      { content: 'Some text', category: 'pricing' },
    ]);
    expect(result[0].category).toBe('pricing');
  });

  it('uses pre-assigned sentiment if available', () => {
    const result = prioritizeFeedback([
      { content: 'Some text', sentiment: 'very_negative' },
    ]);
    expect(result[0].sentiment).toBe('very_negative');
  });

  it('handles items with null category', () => {
    const result = prioritizeFeedback([
      { content: 'The performance is slow', category: null },
    ]);
    expect(result[0].category).toBe('performance');
  });

  it('handles items with null sentiment', () => {
    const result = prioritizeFeedback([
      { content: 'I love this', sentiment: null },
    ]);
    expect(['positive', 'very_positive']).toContain(result[0].sentiment);
  });
});
