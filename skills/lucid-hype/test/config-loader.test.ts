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
    // Temporarily clear env vars that override defaults
    const origProduct = process.env.HYPE_PRODUCT_NAME;
    const origDesc = process.env.HYPE_PRODUCT_DESCRIPTION;
    const origUrl = process.env.HYPE_PRODUCT_URL;
    delete process.env.HYPE_PRODUCT_NAME;
    delete process.env.HYPE_PRODUCT_DESCRIPTION;
    delete process.env.HYPE_PRODUCT_URL;
    try {
      const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
      expect(config.tenantId).toBe('default');
      expect(config.postSchedule).toBe('0 9,12,15,18 * * 1-5');
      expect(config.productName).toBe('My Product');
    } finally {
      process.env.HYPE_PRODUCT_NAME = origProduct;
      process.env.HYPE_PRODUCT_DESCRIPTION = origDesc;
      process.env.HYPE_PRODUCT_URL = origUrl;
    }
  });

  it('throws without supabaseUrl', () => {
    expect(() => {
      const origUrl = process.env.HYPE_SUPABASE_URL;
      const origKey = process.env.HYPE_SUPABASE_KEY;
      delete process.env.HYPE_SUPABASE_URL;
      delete process.env.HYPE_SUPABASE_KEY;
      try {
        loadConfig({} as any);
      } finally {
        process.env.HYPE_SUPABASE_URL = origUrl;
        process.env.HYPE_SUPABASE_KEY = origKey;
      }
    }).toThrow('supabaseUrl is required');
  });

  it('loads from env vars', () => {
    const config = loadConfig(); // Uses env vars from test/setup.ts
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
      twitterApiKey: 'tw-key',
      youtubeApiKey: 'yt-key',
    });
    expect(config.twitterApiKey).toBe('tw-key');
    expect(config.youtubeApiKey).toBe('yt-key');
  });

  it('omits undefined optional fields', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    expect(config.twitterApiKey).toBeUndefined();
    expect(config.slackWebhookUrl).toBeUndefined();
  });
});
