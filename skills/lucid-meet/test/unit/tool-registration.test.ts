// ---------------------------------------------------------------------------
// tool-registration.test.ts -- Verify all 12 tools register correctly
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createAllTools } from '../../src/core/tools/index.js';
import type { PluginConfig } from '../../src/core/types/config.js';
import type { ProviderRegistry } from '../../src/core/types/provider.js';

const mockConfig: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'default',
  digestSchedule: '0 9 * * 1-5',
  autoFollowUpDays: 3,
};

const mockProviderRegistry: ProviderRegistry = {
  calendar: null,
  notification: null,
  notes: null,
  getConfiguredNames: () => [],
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

  it('all tools have meet_ prefix', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(tool.name).toMatch(/^meet_/);
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
    expect(names).toContain('meet_analyze_transcript');
    expect(names).toContain('meet_extract_action_items');
    expect(names).toContain('meet_create_summary');
    expect(names).toContain('meet_track_followup');
    expect(names).toContain('meet_list_meetings');
    expect(names).toContain('meet_search_meetings');
    expect(names).toContain('meet_get_participant_stats');
    expect(names).toContain('meet_detect_sentiment');
    expect(names).toContain('meet_generate_agenda');
    expect(names).toContain('meet_create_meeting');
    expect(names).toContain('meet_get_insights');
    expect(names).toContain('meet_status');
  });

  it('all tools have params as objects', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(typeof tool.params).toBe('object');
    }
  });
});
