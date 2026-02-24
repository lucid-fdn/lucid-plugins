import { describe, it, expect } from 'vitest';
import { rankItems } from '../../../src/core/digest/ranker.js';
import { createMockItems } from '../../helpers/fixtures.js';

describe('rankItems', () => {
  it('ranks items by composite score', () => {
    const items = createMockItems(5);
    const sources = new Map([[1, { trust_score: 80 }]]);
    const ranked = rankItems(items, sources);

    expect(ranked).toHaveLength(5);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  it('handles items without relevance score', () => {
    const items = createMockItems(2);
    items[0].relevance_score = null;
    const sources = new Map([[1, { trust_score: 50 }]]);
    const ranked = rankItems(items, sources);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].relevanceScore).toBeDefined();
  });
});
