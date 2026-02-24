// ---------------------------------------------------------------------------
// tool-registration.test.ts -- Verify all 14 tools register correctly
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createAllTools } from '../src/core/tools/index.js';
import type { PluginConfig } from '../src/core/types/index.js';

const mockConfig: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'default',
  productName: 'Test Product',
  productDescription: 'Test',
  productUrl: 'https://test.com',
  postSchedule: '0 9,12,15,18 * * 1-5',
};

describe('tool registration', () => {
  it('creates exactly 14 tools', () => {
    const tools = createAllTools({ config: mockConfig });
    expect(tools.length).toBe(14);
  });

  it('all tools have unique names', () => {
    const tools = createAllTools({ config: mockConfig });
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all tools have hype_ prefix', () => {
    const tools = createAllTools({ config: mockConfig });
    for (const tool of tools) {
      expect(tool.name).toMatch(/^hype_/);
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
    expect(names).toContain('hype_create_campaign');
    expect(names).toContain('hype_track_post');
    expect(names).toContain('hype_get_virality_score');
    expect(names).toContain('hype_analyze_engagement');
    expect(names).toContain('hype_optimize_content');
    expect(names).toContain('hype_find_influencers');
    expect(names).toContain('hype_rank_influencers');
    expect(names).toContain('hype_get_best_times');
    expect(names).toContain('hype_get_campaign_report');
    expect(names).toContain('hype_list_campaigns');
    expect(names).toContain('hype_get_trending_topics');
    expect(names).toContain('hype_analyze_competitor');
    expect(names).toContain('hype_get_content_calendar');
    expect(names).toContain('hype_status');
  });
});
