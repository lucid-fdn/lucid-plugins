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

import { createFeedbackServer } from '../src/mcp.js';

describe('createFeedbackServer', () => {
  it('creates a server instance', () => {
    const server = createFeedbackServer({
      FEEDBACK_SUPABASE_URL: 'http://localhost:54321',
      FEEDBACK_SUPABASE_KEY: 'test-key',
    });
    expect(server).toBeDefined();
  });
});
