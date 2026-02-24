import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/core/config/index.js';

describe('config-loader', () => {
  it('loads valid configuration', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'http://localhost:54321',
      PROPOSE_SUPABASE_KEY: 'test-key',
      PROPOSE_TENANT_ID: 'tenant-1',
      PROPOSE_COMPANY_NAME: 'Test Corp',
    };

    const config = loadConfig(env);
    expect(config.supabaseUrl).toBe('http://localhost:54321');
    expect(config.supabaseKey).toBe('test-key');
    expect(config.tenantId).toBe('tenant-1');
    expect(config.companyName).toBe('Test Corp');
  });

  it('applies default values', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'http://localhost:54321',
      PROPOSE_SUPABASE_KEY: 'test-key',
    };

    const config = loadConfig(env);
    expect(config.defaultCurrency).toBe('USD');
    expect(config.expiryDays).toBe(30);
    expect(config.tenantId).toBe('default');
    expect(config.companyName).toBe('My Company');
  });

  it('throws on missing SUPABASE_URL', () => {
    const env = {
      PROPOSE_SUPABASE_KEY: 'test-key',
    };

    expect(() => loadConfig(env)).toThrow();
  });

  it('throws on missing SUPABASE_KEY', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'http://localhost:54321',
      PROPOSE_SUPABASE_KEY: '',
    };

    expect(() => loadConfig(env)).toThrow();
  });

  it('throws on invalid SUPABASE_URL', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'not-a-url',
      PROPOSE_SUPABASE_KEY: 'test-key',
    };

    expect(() => loadConfig(env)).toThrow();
  });

  it('accepts optional fields', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'http://localhost:54321',
      PROPOSE_SUPABASE_KEY: 'test-key',
      PROPOSE_COMPANY_DESCRIPTION: 'A great company',
      PROPOSE_SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
    };

    const config = loadConfig(env);
    expect(config.companyDescription).toBe('A great company');
    expect(config.slackWebhookUrl).toBe('https://hooks.slack.com/test');
  });

  it('parses expiry days as number', () => {
    const env = {
      PROPOSE_SUPABASE_URL: 'http://localhost:54321',
      PROPOSE_SUPABASE_KEY: 'test-key',
      PROPOSE_EXPIRY_DAYS: '60',
    };

    const config = loadConfig(env);
    expect(config.expiryDays).toBe(60);
  });
});
