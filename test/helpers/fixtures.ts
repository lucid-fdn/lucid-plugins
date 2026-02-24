import type { Source, Item, Digest, PluginConfig } from '../../src/core/types/index.js';

export const TEST_TENANT_ID = 'test-tenant';

export const mockConfig: PluginConfig = {
  supabaseUrl: 'https://test.supabase.co',
  supabaseKey: 'test-key',
  tenantId: TEST_TENANT_ID,
  timezone: 'UTC',
  language: 'en',
  fetchCron: '0 6 * * *',
  dailyDigestCron: '0 8 * * *',
  weeklyDigestCron: '0 9 * * 1',
  autoPublish: false,
  digestTrustThreshold: 30,
  digestMaxItems: 50,
};

export const mockSource: Source = {
  id: 1,
  tenant_id: TEST_TENANT_ID,
  url: 'https://example.com/feed.xml',
  source_type: 'rss',
  label: 'Example Feed',
  trust_score: 75,
  enabled: true,
  fetch_config: null,
  last_fetched_at: null,
  last_error: null,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockItem: Item = {
  id: 1,
  tenant_id: TEST_TENANT_ID,
  source_id: 1,
  canonical_url: 'https://example.com/article-1',
  title: 'Test Article',
  summary: 'This is a test article about AI and technology.',
  author: 'Test Author',
  tags: ['ai', 'tech'],
  published_at: new Date().toISOString(),
  source: 'https://example.com/feed.xml',
  storage_text_path: null,
  status: 'new',
  relevance_score: 0.8,
  created_at: new Date().toISOString(),
};

export const mockDigest: Digest = {
  id: 1,
  tenant_id: TEST_TENANT_ID,
  date: '2024-01-15',
  digest_type: 'daily',
  title: 'Daily Digest - Jan 15',
  item_count: 10,
  storage_md_path: 'digests/test-tenant/2024-01-15/daily.md',
  storage_html_path: 'digests/test-tenant/2024-01-15/daily.html',
  metadata: null,
  created_at: '2024-01-15T08:00:00Z',
};

export function createMockItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockItem,
    id: i + 1,
    canonical_url: `https://example.com/article-${i + 1}`,
    title: `Test Article ${i + 1}`,
    relevance_score: Math.random(),
    published_at: new Date(Date.now() - i * 3600000).toISOString(),
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}
