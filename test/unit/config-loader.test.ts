// ---------------------------------------------------------------------------
// config-loader.test.ts -- Tests for configuration loader
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, resetConfig } from '../../src/core/config/loader.js';

describe('loadConfig', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('loads config from raw input', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key123' });
    expect(config.supabaseUrl).toBe('http://test.co');
    expect(config.supabaseKey).toBe('key123');
  });

  it('applies defaults', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    expect(config.tenantId).toBe('default');
    expect(config.crawlSchedule).toBe('0 3 * * 0');
  });

  it('throws without supabaseUrl', () => {
    expect(() => {
      const origUrl = process.env.SEO_SUPABASE_URL;
      const origKey = process.env.SEO_SUPABASE_KEY;
      delete process.env.SEO_SUPABASE_URL;
      delete process.env.SEO_SUPABASE_KEY;
      try {
        loadConfig({} as any);
      } finally {
        process.env.SEO_SUPABASE_URL = origUrl;
        process.env.SEO_SUPABASE_KEY = origKey;
      }
    }).toThrow('supabaseUrl is required');
  });

  it('loads from env vars', () => {
    const config = loadConfig();
    expect(config.supabaseUrl).toBe('http://localhost:54321');
    expect(config.supabaseKey).toBe('test-key');
  });

  it('raw overrides env vars', () => {
    const config = loadConfig({ supabaseUrl: 'http://override.co', supabaseKey: 'override-key' });
    expect(config.supabaseUrl).toBe('http://override.co');
  });

  it('includes optional fields when provided', () => {
    const config = loadConfig({
      supabaseUrl: 'http://test.co',
      supabaseKey: 'key',
      semrushApiKey: 'sr-key',
      ahrefsApiKey: 'ah-key',
    });
    expect(config.semrushApiKey).toBe('sr-key');
    expect(config.ahrefsApiKey).toBe('ah-key');
  });

  it('omits undefined optional fields', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    expect(config.semrushApiKey).toBeUndefined();
    expect(config.slackWebhookUrl).toBeUndefined();
  });
});
