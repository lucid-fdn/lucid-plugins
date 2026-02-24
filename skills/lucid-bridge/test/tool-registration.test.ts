import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAllTools } from '../src/core/tools/index.js';
import type { PluginConfig } from '../src/domain/types/config.js';
import type { ProviderRegistry } from '../src/domain/providers/index.js';

describe('tool registration', () => {
  let tools: ReturnType<typeof createAllTools>;
  let mockConfig: PluginConfig;
  let mockRegistry: ProviderRegistry;

  beforeEach(() => {
    mockConfig = {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key',
      tenantId: 'test-tenant',
      syncSchedule: '*/30 * * * *',
    };

    mockRegistry = new Map() as ProviderRegistry;
    tools = createAllTools({ config: mockConfig, providerRegistry: mockRegistry });
  });

  it('creates all 12 tools', () => {
    expect(tools).toHaveLength(12);
  });

  it('all tools have bridge_ prefix', () => {
    for (const tool of tools) {
      expect(tool.name).toMatch(/^bridge_/);
    }
  });

  it('all tools have a description', () => {
    for (const tool of tools) {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('all tools have a handler function', () => {
    for (const tool of tools) {
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('all tools have parameters object', () => {
    for (const tool of tools) {
      expect(typeof tool.parameters).toBe('object');
    }
  });

  const expectedTools = [
    'bridge_create_workflow',
    'bridge_list_workflows',
    'bridge_run_workflow',
    'bridge_create_connection',
    'bridge_list_connections',
    'bridge_sync_data',
    'bridge_get_logs',
    'bridge_create_webhook',
    'bridge_transform_data',
    'bridge_schedule_workflow',
    'bridge_get_metrics',
    'bridge_status',
  ];

  for (const toolName of expectedTools) {
    it(`registers ${toolName}`, () => {
      const tool = tools.find((t) => t.name === toolName);
      expect(tool).toBeDefined();
      expect(tool!.name).toBe(toolName);
    });
  }

  it('tool names are unique', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  describe('parameter validation', () => {
    it('bridge_create_workflow has required name parameter', () => {
      const tool = tools.find((t) => t.name === 'bridge_create_workflow')!;
      expect(tool.parameters['name']).toBeDefined();
      expect(tool.parameters['name']!.required).toBe(true);
    });

    it('bridge_create_workflow has trigger_platform parameter with enum', () => {
      const tool = tools.find((t) => t.name === 'bridge_create_workflow')!;
      expect(tool.parameters['trigger_platform']!.enum).toBeDefined();
      expect(tool.parameters['trigger_platform']!.enum!.length).toBeGreaterThan(0);
    });

    it('bridge_list_workflows has optional status parameter', () => {
      const tool = tools.find((t) => t.name === 'bridge_list_workflows')!;
      expect(tool.parameters['status']).toBeDefined();
      expect(tool.parameters['status']!.required).toBe(false);
    });

    it('bridge_run_workflow has required workflow_id parameter', () => {
      const tool = tools.find((t) => t.name === 'bridge_run_workflow')!;
      expect(tool.parameters['workflow_id']!.required).toBe(true);
    });

    it('bridge_sync_data has source_platform parameter with enum', () => {
      const tool = tools.find((t) => t.name === 'bridge_sync_data')!;
      expect(tool.parameters['source_platform']!.enum).toBeDefined();
    });

    it('bridge_transform_data has required data parameter', () => {
      const tool = tools.find((t) => t.name === 'bridge_transform_data')!;
      expect(tool.parameters['data']!.required).toBe(true);
      expect(tool.parameters['data']!.type).toBe('object');
    });

    it('bridge_schedule_workflow has schedule parameter', () => {
      const tool = tools.find((t) => t.name === 'bridge_schedule_workflow')!;
      expect(tool.parameters['schedule']!.required).toBe(true);
    });

    it('bridge_status has no required parameters', () => {
      const tool = tools.find((t) => t.name === 'bridge_status')!;
      const requiredParams = Object.values(tool.parameters).filter((p) => p.required);
      expect(requiredParams).toHaveLength(0);
    });

    it('bridge_get_metrics has no required parameters', () => {
      const tool = tools.find((t) => t.name === 'bridge_get_metrics')!;
      const requiredParams = Object.values(tool.parameters).filter((p) => p.required);
      expect(requiredParams).toHaveLength(0);
    });
  });
});
