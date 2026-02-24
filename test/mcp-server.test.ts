import { describe, it, expect } from 'vitest';
import { createRecruitServer } from '../src/mcp.js';

describe('MCP Server', () => {
  it('creates a server instance without throwing', () => {
    const server = createRecruitServer({
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key',
      tenantId: 'test',
      autoScreenEnabled: true,
      screenSchedule: '0 8 * * *',
    });
    expect(server).toBeDefined();
  });
});
