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
    expect(config.digestSchedule).toBe('0 9 * * 1-5');
    expect(config.autoFollowUpDays).toBe(3);
  });

  it('throws without supabaseUrl', () => {
    expect(() => {
      const origUrl = process.env.MEET_SUPABASE_URL;
      const origKey = process.env.MEET_SUPABASE_KEY;
      delete process.env.MEET_SUPABASE_URL;
      delete process.env.MEET_SUPABASE_KEY;
      try {
        loadConfig({} as any);
      } finally {
        process.env.MEET_SUPABASE_URL = origUrl;
        process.env.MEET_SUPABASE_KEY = origKey;
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
      calendarApiKey: 'cal-key',
      slackBotToken: 'slack-token',
    });
    expect(config.calendarApiKey).toBe('cal-key');
    expect(config.slackBotToken).toBe('slack-token');
  });

  it('omits undefined optional fields', () => {
    const config = loadConfig({ supabaseUrl: 'http://test.co', supabaseKey: 'key' });
    expect(config.calendarApiKey).toBeUndefined();
    expect(config.slackWebhookUrl).toBeUndefined();
  });

  it('parses autoFollowUpDays from env as number', () => {
    const orig = process.env.MEET_AUTO_FOLLOW_UP_DAYS;
    process.env.MEET_AUTO_FOLLOW_UP_DAYS = '7';
    try {
      resetConfig();
      const config = loadConfig();
      expect(config.autoFollowUpDays).toBe(7);
    } finally {
      if (orig !== undefined) {
        process.env.MEET_AUTO_FOLLOW_UP_DAYS = orig;
      } else {
        delete process.env.MEET_AUTO_FOLLOW_UP_DAYS;
      }
    }
  });
});
