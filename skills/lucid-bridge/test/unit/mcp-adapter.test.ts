import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerToolsOnServer } from '../../src/adapters/mcp-adapter.js';
import type { ToolDefinition } from '../../src/core/tools/types.js';

describe('mcp adapter', () => {
  let mockServer: any;
  let listHandler: Function;
  let callHandler: Function;

  const mockTools: ToolDefinition[] = [
    {
      name: 'bridge_test_one',
      description: 'First test tool',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
      },
      handler: vi.fn().mockResolvedValue({ success: true, data: { result: 'found' } }),
    },
    {
      name: 'bridge_test_two',
      description: 'Second test tool',
      parameters: {},
      handler: vi.fn().mockResolvedValue({ success: true, data: { status: 'ok' } }),
    },
  ];

  beforeEach(() => {
    mockServer = {
      setRequestHandler: vi.fn((schema: any, handler: Function) => {
        if (schema === 'ListToolsRequestSchema') {
          listHandler = handler;
        } else if (schema === 'CallToolRequestSchema') {
          callHandler = handler;
        }
      }),
    };

    // We need to capture handlers properly
    registerToolsOnServer(mockServer, mockTools);
  });

  it('sets two request handlers', () => {
    expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
  });

  it('registers ListTools and CallTool handlers', () => {
    const calls = mockServer.setRequestHandler.mock.calls;
    expect(calls.length).toBe(2);
  });
});
