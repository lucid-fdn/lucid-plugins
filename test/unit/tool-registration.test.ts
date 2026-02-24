// ---------------------------------------------------------------------------
// tool-registration.test.ts -- Verify all 14 tools register correctly
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createAllTools } from '../../src/core/tools/index.js';
import type { PluginConfig } from '../../src/core/types/config.js';
import type { SeoProviderRegistry } from '../../src/core/types/provider.js';

const mockConfig: PluginConfig = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  tenantId: 'default',
  crawlSchedule: '0 3 * * 0',
};

const mockProviderRegistry: SeoProviderRegistry = {
  providers: [],
  getConfigured: () => [],
  getKeywordProvider: () => null,
  getSerpProvider: () => null,
  getBacklinkProvider: () => null,
  getAuthorityProvider: () => null,
};

describe('tool registration', () => {
  it('creates exactly 14 tools', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    expect(tools.length).toBe(14);
  });

  it('all tools have unique names', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all tools have seo_ prefix', () => {
    const tools = createAllTools({ config: mockConfig, providerRegistry: mockProviderRegistry });
    for (const tool of tools) {
      expect(tool.name).toMatch(/^seo_/);
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
    expect(names).toContain('seo_research_keywords');
    expect(names).toContain('seo_analyze_serp');
    expect(names).toContain('seo_track_rankings');
    expect(names).toContain('seo_analyze_backlinks');
    expect(names).toContain('seo_find_link_opportunities');
    expect(names).toContain('seo_audit_technical');
    expect(names).toContain('seo_optimize_content');
    expect(names).toContain('seo_analyze_competitor');
    expect(names).toContain('seo_get_content_brief');
    expect(names).toContain('seo_find_content_gaps');
    expect(names).toContain('seo_check_indexing');
    expect(names).toContain('seo_get_domain_overview');
    expect(names).toContain('seo_generate_sitemap_analysis');
    expect(names).toContain('seo_status');
  });
});
