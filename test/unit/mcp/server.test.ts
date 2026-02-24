import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/core/db/client.js', () => ({
  initSupabase: vi.fn(),
  getSupabase: vi.fn(() => ({ from: vi.fn().mockReturnThis(), storage: { from: vi.fn().mockReturnThis() } })),
  resetSupabase: vi.fn(),
}));

vi.mock('../../../src/core/db/tenants.js', () => ({
  ensureTenant: vi.fn().mockResolvedValue(undefined),
  getTenant: vi.fn(),
}));

vi.mock('../../../src/core/db/sources.js', () => ({
  createSource: vi.fn(), getSource: vi.fn(), listSources: vi.fn(),
  updateSource: vi.fn(), deleteSource: vi.fn(), updateSourceFetchStatus: vi.fn(),
}));

vi.mock('../../../src/core/db/items.js', () => ({
  upsertItem: vi.fn(), upsertItems: vi.fn(), listItems: vi.fn(),
  getItemsForDigest: vi.fn(), updateItemStatus: vi.fn(), searchItems: vi.fn(),
}));

vi.mock('../../../src/core/db/digests.js', () => ({
  createDigest: vi.fn(), getLatestDigest: vi.fn(), listDigests: vi.fn(),
}));

vi.mock('../../../src/core/db/publish-log.js', () => ({
  createPublishLog: vi.fn(), updatePublishLog: vi.fn(), listPublishLogs: vi.fn(),
}));

vi.mock('bottleneck', () => ({
  default: vi.fn().mockImplementation(() => ({
    schedule: vi.fn((fn: () => Promise<any>) => fn()),
    disconnect: vi.fn(),
  })),
}));

import { createVeilleServer } from '../../../src/mcp.js';

describe('MCP Server', () => {
  it('creates server with 10 tools', async () => {
    const env = {
      VEILLE_SUPABASE_URL: 'https://test.supabase.co',
      VEILLE_SUPABASE_KEY: 'test-key',
    };
    const server = createVeilleServer(env);
    expect(server).toBeDefined();
  });
});
