// ---------------------------------------------------------------------------
// config-loader.test.ts -- Tests for configuration loader
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, resetConfig } from '../src/core/config/loader.js';

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
    expect(config.npsThreshold).toBe(7);
    expect(config.collectSchedule).toBe('0 */6 * * *');
  });

  it('throws without supabaseUrl', () => {
    expect(() => {
      const origUrl = process.env.FEEDBACK_SUPABASE_URL;
      const origKey = process.env.FEEDBACK_SUPABASE_KEY;
      delete process.env.FEEDBACK_SUPABASE_URL;
      delete process.env.FEEDBACK_SUPABASE_KEY;
      try {
        loadConfig({} as any);
      } finally {
        process.env.FEEDBACK_SUPABASE_URL = origUrl;
        process.env.FEEDBACK_SUPABASE_KEY = origKey;
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
      intercomApiKey: 'ic-key',
      zendeskApiKey: 'zd-key',
    });
    expect(config.intercomApiKey).toBe('ic-key');
    expect(config.zendeskApiKey).toBe('zd-key');
  });

  it('omits undefined optional fields', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    expect(config.intercomApiKey).toBeUndefined();
    expect(config.slackWebhookUrl).toBeUndefined();
  });

  it('getConfig returns cached config after loadConfig', async () => {
    const { getConfig } = await import('../src/core/config/loader.js');
    loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    const cached = getConfig();
    expect(cached.supabaseUrl).toBe('http://test.co');
  });

  it('resets cache correctly', () => {
    loadConfig({ supabaseUrl: 'http://first.co', supabaseKey: 'key' });
    resetConfig();
    const config = loadConfig({ supabaseUrl: 'http://second.co', supabaseKey: 'key2' });
    expect(config.supabaseUrl).toBe('http://second.co');
  });
});
