import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the MCP SDK before importing
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation((opts: { name: string; version: string }) => {
      const toolRegistrations: Array<{
        name: string;
        description: string;
        schema: any;
        handler: Function;
      }> = [];
      return {
        name: opts.name,
        version: opts.version,
        tool: vi.fn((name: string, description: string, schema: any, handler: Function) => {
          toolRegistrations.push({ name, description, schema, handler });
        }),
        connect: vi.fn(),
        _toolRegistrations: toolRegistrations,
      };
    }),
  };
});

// Mock supabase client
vi.mock('../src/core/db/client.js', () => ({
  getSupabaseClient: vi.fn().mockReturnValue({}),
  resetClient: vi.fn(),
}));

// Mock the scheduler
vi.mock('../src/core/services/index.js', () => ({
  startScheduler: vi.fn(),
  stopScheduler: vi.fn(),
}));

// Mock the providers
vi.mock('../src/domain/providers/index.js', () => ({
  createProviderRegistry: vi.fn().mockReturnValue(new Map()),
}));

describe('MCP server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure env vars are set
    process.env['BRIDGE_SUPABASE_URL'] = 'http://localhost:54321';
    process.env['BRIDGE_SUPABASE_KEY'] = 'test-key';
    process.env['BRIDGE_TENANT_ID'] = 'test-tenant';
  });

  it('creates a server with correct name and version', async () => {
    const { createBridgeServer } = await import('../src/mcp.js');
    const server = createBridgeServer();
    expect((server as any).name).toBe('Lucid Bridge');
    expect((server as any).version).toBe('1.0.0');
  });

  it('registers all 12 tools on the server', async () => {
    const { createBridgeServer } = await import('../src/mcp.js');
    const server = createBridgeServer();
    const registrations = (server as any)._toolRegistrations as Array<{ name: string }>;
    expect(registrations.length).toBe(12);
  });

  it('registers tools with bridge_ prefix', async () => {
    const { createBridgeServer } = await import('../src/mcp.js');
    const server = createBridgeServer();
    const registrations = (server as any)._toolRegistrations as Array<{ name: string }>;
    for (const reg of registrations) {
      expect(reg.name).toMatch(/^bridge_/);
    }
  });

  it('each registered tool has a description', async () => {
    const { createBridgeServer } = await import('../src/mcp.js');
    const server = createBridgeServer();
    const registrations = (server as any)._toolRegistrations as Array<{
      name: string;
      description: string;
    }>;
    for (const reg of registrations) {
      expect(typeof reg.description).toBe('string');
      expect(reg.description.length).toBeGreaterThan(0);
    }
  });

  it('each registered tool has a handler', async () => {
    const { createBridgeServer } = await import('../src/mcp.js');
    const server = createBridgeServer();
    const registrations = (server as any)._toolRegistrations as Array<{
      handler: Function;
    }>;
    for (const reg of registrations) {
      expect(typeof reg.handler).toBe('function');
    }
  });

  it('starts the scheduler', async () => {
    const { startScheduler } = await import('../src/core/services/index.js');
    const { createBridgeServer } = await import('../src/mcp.js');
    createBridgeServer();
    expect(startScheduler).toHaveBeenCalled();
  });

  it('initializes the supabase client', async () => {
    const { getSupabaseClient } = await import('../src/core/db/client.js');
    const { createBridgeServer } = await import('../src/mcp.js');
    createBridgeServer();
    expect(getSupabaseClient).toHaveBeenCalled();
  });
});
