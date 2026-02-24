import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, getConfig, resetConfig } from '../../../src/core/config/loader.js';

describe('config loader', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('loads config with defaults', () => {
    const config = loadConfig({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    });
    expect(config.tenantId).toBe('personal');
    expect(config.timezone).toBe('Europe/Paris');
    expect(config.language).toBe('fr');
  });

  it('overrides defaults with provided values', () => {
    const config = loadConfig({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      tenantId: 'custom',
      language: 'en',
    });
    expect(config.tenantId).toBe('custom');
    expect(config.language).toBe('en');
  });

  it('getConfig throws if not loaded', () => {
    expect(() => getConfig()).toThrow('Plugin config not loaded');
  });

  it('getConfig returns loaded config', () => {
    loadConfig({ supabaseUrl: 'url', supabaseKey: 'key' });
    expect(getConfig().supabaseUrl).toBe('url');
  });
});
