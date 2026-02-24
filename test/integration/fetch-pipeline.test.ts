import { describe, it, expect, vi } from 'vitest';
import { mockSource } from '../helpers/fixtures.js';

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockResolvedValue({
      items: [
        { title: 'Post 1', link: 'https://example.com/1', contentSnippet: 'Content 1', isoDate: new Date().toISOString() },
        { title: 'Post 2', link: 'https://example.com/2', contentSnippet: 'Content 2', isoDate: new Date().toISOString() },
      ],
    }),
  })),
}));

// Mock bottleneck to bypass rate limiting in tests
vi.mock('bottleneck', () => ({
  default: vi.fn().mockImplementation(() => ({
    schedule: vi.fn((fn: () => Promise<any>) => fn()),
    disconnect: vi.fn(),
  })),
}));

describe('Fetch pipeline', () => {
  it('fetches RSS items end-to-end', async () => {
    const { RssFetcher } = await import('../../src/core/fetchers/rss.js');
    const fetcher = new RssFetcher();
    const result = await fetcher.fetch(mockSource);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('canonical_url');
    expect(result.items[0]).toHaveProperty('title');
    expect(result.items[0].tenant_id).toBe(mockSource.tenant_id);
  });
});
