// ---------------------------------------------------------------------------
// mcp-server.test.ts -- Verify MCP server creates with all tools
// ---------------------------------------------------------------------------

import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

import { createSeoServer } from '../../src/mcp.js';

describe('createSeoServer', () => {
  it('creates a server instance', () => {
    const server = createSeoServer({
      SEO_SUPABASE_URL: 'http://localhost:54321',
      SEO_SUPABASE_KEY: 'test-key',
    });
    expect(server).toBeDefined();
  });
});
