import { describe, it, expect } from 'vitest';
import { createProposeServer } from '../src/mcp.js';

describe('mcp-server', () => {
  it('creates a server instance', () => {
    const server = createProposeServer();
    expect(server).toBeDefined();
  });
});
