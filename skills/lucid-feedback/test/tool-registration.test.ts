// ---------------------------------------------------------------------------
// tool-registration.test.ts -- Verify all 12 tools register correctly
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createAllTools } from '../src/core/tools/index.js';
import type { PluginConfig } from '../src/core/types/config.js';

const mockConfig: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'default',
  npsThreshold: 7,
  collectSchedule: '0 */6 * * *',
};

describe('tool registration', () => {
  it('creates exactly 12 tools', () => {
    const tools = createAllTools({ config: mockConfig });
    expect(tools.length).toBe(12);
  });

  it('all tools have unique names', () => {
    const tools = createAllTools({ config: mockConfig });
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all tools have feedback_ prefix', () => {
    const tools = createAllTools({ config: mockConfig });
    for (const tool of tools) {
      expect(tool.name).toMatch(/^feedback_/);
    }
  });

  it('all tools have descriptions', () => {
    const tools = createAllTools({ config: mockConfig });
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('all tools have execute functions', () => {
    const tools = createAllTools({ config: mockConfig });
    for (const tool of tools) {
      expect(typeof tool.execute).toBe('function');
    }
  });

  it('includes all expected tool names', () => {
    const tools = createAllTools({ config: mockConfig });
    const names = tools.map((t) => t.name);
    expect(names).toContain('feedback_submit');
    expect(names).toContain('feedback_list');
    expect(names).toContain('feedback_analyze_sentiment');
    expect(names).toContain('feedback_get_nps');
    expect(names).toContain('feedback_get_csat');
    expect(names).toContain('feedback_track_feature_request');
    expect(names).toContain('feedback_list_feature_requests');
    expect(names).toContain('feedback_get_trends');
    expect(names).toContain('feedback_categorize');
    expect(names).toContain('feedback_get_insights');
    expect(names).toContain('feedback_create_survey');
    expect(names).toContain('feedback_status');
  });

  it('all tools have params objects', () => {
    const tools = createAllTools({ config: mockConfig });
    for (const tool of tools) {
      expect(typeof tool.params).toBe('object');
    }
  });

  it('feedback_submit has required content param', () => {
    const tools = createAllTools({ config: mockConfig });
    const submit = tools.find((t) => t.name === 'feedback_submit');
    expect(submit).toBeDefined();
    expect(submit!.params.content).toBeDefined();
    expect(submit!.params.content.required).toBe(true);
  });

  it('feedback_analyze_sentiment has required text param', () => {
    const tools = createAllTools({ config: mockConfig });
    const analyze = tools.find((t) => t.name === 'feedback_analyze_sentiment');
    expect(analyze).toBeDefined();
    expect(analyze!.params.text).toBeDefined();
    expect(analyze!.params.text.required).toBe(true);
  });

  it('feedback_status has no required params', () => {
    const tools = createAllTools({ config: mockConfig });
    const status = tools.find((t) => t.name === 'feedback_status');
    expect(status).toBeDefined();
    expect(Object.keys(status!.params).length).toBe(0);
  });
});
