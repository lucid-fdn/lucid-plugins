import { describe, it, expect } from 'vitest';
import { createToolDefinitions } from '../src/core/tools/definitions.js';
import type { PluginConfig } from '../src/core/types/config.js';

const TEST_CONFIG: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'test',
  autoScreenEnabled: true,
  screenSchedule: '0 8 * * *',
};

describe('tool registration', () => {
  it('creates all 13 tool definitions', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    expect(tools).toHaveLength(13);
  });

  it('each tool has a name, description, params, and execute', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.params).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    }
  });

  it('tool names follow naming convention', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    for (const tool of tools) {
      expect(tool.name).toMatch(/^recruit_/);
    }
  });

  it('has no duplicate tool names', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes expected tools', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    const names = tools.map((t) => t.name);
    expect(names).toContain('recruit_create_job');
    expect(names).toContain('recruit_search_candidates');
    expect(names).toContain('recruit_screen_candidate');
    expect(names).toContain('recruit_status');
  });

  it('recruit_status tool has no required params', () => {
    const tools = createToolDefinitions(TEST_CONFIG);
    const statusTool = tools.find((t) => t.name === 'recruit_status');
    expect(statusTool).toBeDefined();
    expect(Object.keys(statusTool!.params)).toHaveLength(0);
  });
});
