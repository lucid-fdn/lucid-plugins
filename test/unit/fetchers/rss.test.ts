import { describe, it, expect, vi } from 'vitest';
import { mockSource } from '../../helpers/fixtures.js';

// Mock rss-parser
vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockResolvedValue({
      items: [
        {
          title: 'Test Post',
          link: 'https://example.com/post-1',
          contentSnippet: 'A test post content',
          creator: 'Author',
          isoDate: '2024-01-15T10:00:00Z',
        },
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

describe('RssFetcher', () => {
  it('is always configured', async () => {
    const { RssFetcher } = await import('../../../src/core/fetchers/rss.js');
    const fetcher = new RssFetcher();
    expect(fetcher.isConfigured()).toBe(true);
    expect(fetcher.sourceType).toBe('rss');
  });

  it('fetches and maps RSS items', async () => {
    const { RssFetcher } = await import('../../../src/core/fetchers/rss.js');
    const fetcher = new RssFetcher();
    const result = await fetcher.fetch(mockSource);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].canonical_url).toBe('https://example.com/post-1');
    expect(result.items[0].title).toBe('Test Post');
    expect(result.errors).toHaveLength(0);
  });
});
