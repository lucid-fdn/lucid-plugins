import { describe, it, expect, vi } from 'vitest';

// Mock all external dependencies so register() can run without a real Supabase
vi.mock('../../src/core/db/client.js', () => ({
  initSupabase: vi.fn(),
  getSupabase: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    storage: { from: vi.fn().mockReturnThis() },
  })),
  resetSupabase: vi.fn(),
}));

vi.mock('../../src/core/db/tenants.js', () => ({
  ensureTenant: vi.fn().mockResolvedValue(undefined),
  getTenant: vi.fn(),
}));

vi.mock('../../src/core/db/sources.js', () => ({
  createSource: vi.fn(),
  getSource: vi.fn(),
  listSources: vi.fn(),
  updateSource: vi.fn(),
  deleteSource: vi.fn(),
  updateSourceFetchStatus: vi.fn(),
}));

vi.mock('../../src/core/db/items.js', () => ({
  upsertItem: vi.fn(),
  upsertItems: vi.fn(),
  listItems: vi.fn(),
  getItemsForDigest: vi.fn(),
  updateItemStatus: vi.fn(),
  searchItems: vi.fn(),
}));

vi.mock('../../src/core/db/digests.js', () => ({
  createDigest: vi.fn(),
  getLatestDigest: vi.fn(),
  listDigests: vi.fn(),
}));

vi.mock('../../src/core/db/publish-log.js', () => ({
  createPublishLog: vi.fn(),
  updatePublishLog: vi.fn(),
  listPublishLogs: vi.fn(),
}));

vi.mock('bottleneck', () => ({
  default: vi.fn().mockImplementation(() => ({
    schedule: vi.fn((fn: () => Promise<any>) => fn()),
    disconnect: vi.fn(),
  })),
}));

import register from '../../src/index.js';

describe('Plugin smoke test', () => {
  it('registers without errors when Supabase is not configured', () => {
    const api = {
      config: {},
      registerTool: vi.fn(),
      registerCommand: vi.fn(),
      registerService: vi.fn(),
    };

    expect(() => register(api)).not.toThrow();
    expect(api.registerTool).toHaveBeenCalled();
    expect(api.registerCommand).toHaveBeenCalled();
    expect(api.registerService).toHaveBeenCalled();
  });

  it('registers 10 core tools', () => {
    const api = {
      config: { supabaseUrl: 'https://test.supabase.co', supabaseKey: 'key' },
      registerTool: vi.fn(),
      registerCommand: vi.fn(),
      registerService: vi.fn(),
    };

    register(api);

    expect(api.registerTool).toHaveBeenCalledTimes(10);
    expect(api.registerCommand).toHaveBeenCalledTimes(3);
    expect(api.registerService).toHaveBeenCalledTimes(1);
  });
});
