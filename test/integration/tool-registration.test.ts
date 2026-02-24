// ---------------------------------------------------------------------------
// tool-registration.test.ts -- Verify all 12 tools register correctly
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createAllTools } from '../../src/core/tools/index.js';
import type { PluginConfig, ProviderRegistry } from '../../src/core/types/index.js';

const mockConfig: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'default',
  reportSchedule: '0 9 * * 1',
  retentionWindow: 30,
};

const mockProviderRegistry: ProviderRegistry = {
  providers: [],
  getConfigured: () => [],
};

describe('tool registration', () => {
  it('creates exactly 12 tools', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    expect(tools.length).toBe(12);
  });

  it('all tools have unique names', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all tools have metrics_ prefix', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(tool.name).toMatch(/^metrics_/);
    }
  });

  it('all tools have descriptions', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('all tools have execute functions', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(typeof tool.execute).toBe('function');
    }
  });

  it('includes all expected tool names', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    const names = tools.map((t) => t.name);
    expect(names).toContain('metrics_track_event');
    expect(names).toContain('metrics_query_metric');
    expect(names).toContain('metrics_analyze_funnel');
    expect(names).toContain('metrics_get_retention');
    expect(names).toContain('metrics_get_active_users');
    expect(names).toContain('metrics_analyze_experiment');
    expect(names).toContain('metrics_track_feature');
    expect(names).toContain('metrics_get_feature_adoption');
    expect(names).toContain('metrics_create_dashboard');
    expect(names).toContain('metrics_get_insights');
    expect(names).toContain('metrics_compare_periods');
    expect(names).toContain('metrics_status');
  });
});
