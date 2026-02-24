import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/core/config/loader.js';

describe('loadConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['RECRUIT_SUPABASE_URL'] = 'http://localhost:54321';
    process.env['RECRUIT_SUPABASE_KEY'] = 'test-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('loads config from environment variables', () => {
    const config = loadConfig();
    expect(config.supabaseUrl).toBe('http://localhost:54321');
    expect(config.supabaseKey).toBe('test-key');
  });

  it('applies default values', () => {
    const config = loadConfig();
    expect(config.autoScreenEnabled).toBe(true);
    expect(config.screenSchedule).toBe('0 8 * * *');
    expect(config.tenantId).toBe('default');
  });

  it('overrides with provided values', () => {
    const config = loadConfig({
      tenantId: 'custom-tenant',
      autoScreenEnabled: false,
    });
    expect(config.tenantId).toBe('custom-tenant');
    expect(config.autoScreenEnabled).toBe(false);
  });

  it('throws when SUPABASE_URL is missing', () => {
    delete process.env['RECRUIT_SUPABASE_URL'];
    expect(() => loadConfig({ supabaseUrl: '' })).toThrow();
  });

  it('throws when SUPABASE_KEY is missing', () => {
    delete process.env['RECRUIT_SUPABASE_KEY'];
    expect(() => loadConfig({ supabaseKey: '' })).toThrow();
  });

  it('reads optional provider keys', () => {
    process.env['RECRUIT_GITHUB_TOKEN'] = 'gh-token';
    const config = loadConfig();
    expect(config.githubToken).toBe('gh-token');
  });

  it('reads auto screen from env', () => {
    process.env['RECRUIT_AUTO_SCREEN_ENABLED'] = 'false';
    const config = loadConfig();
    expect(config.autoScreenEnabled).toBe(false);
  });
});
