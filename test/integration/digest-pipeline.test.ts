import { describe, it, expect } from 'vitest';
import { buildDailyDigest } from '../../src/core/digest/daily.js';
import { createMockItems } from '../helpers/fixtures.js';

describe('Digest pipeline', () => {
  it('builds daily digest prompt data', () => {
    const items = createMockItems(10);
    const sources = new Map([[1, { trust_score: 80 }]]);

    const result = buildDailyDigest({
      tenantId: 'test',
      language: 'en',
      timezone: 'UTC',
      date: '2024-01-15',
      items,
      sources,
      maxItems: 5,
    });

    expect(result.digestType).toBe('daily');
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userPrompt).toBeTruthy();
    expect(result.itemCount).toBeLessThanOrEqual(5);
  });
});
