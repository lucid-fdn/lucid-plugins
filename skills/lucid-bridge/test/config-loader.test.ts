import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig } from '../src/core/config/loader.js';

describe('config loader', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['BRIDGE_SUPABASE_URL'] = 'http://localhost:54321';
    process.env['BRIDGE_SUPABASE_KEY'] = 'test-key';
    process.env['BRIDGE_TENANT_ID'] = 'tenant-1';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('loadConfig', () => {
    it('loads required config from env vars', () => {
      const config = loadConfig();
      expect(config.supabaseUrl).toBe('http://localhost:54321');
      expect(config.supabaseKey).toBe('test-key');
      expect(config.tenantId).toBe('tenant-1');
    });

    it('loads optional config from env vars', () => {
      process.env['BRIDGE_NOTION_TOKEN'] = 'notion-token';
      process.env['BRIDGE_LINEAR_API_KEY'] = 'linear-key';
      const config = loadConfig();
      expect(config.notionToken).toBe('notion-token');
      expect(config.linearApiKey).toBe('linear-key');
    });

    it('uses overrides when provided', () => {
      const config = loadConfig({
        supabaseUrl: 'http://override.com',
        tenantId: 'override-tenant',
      });
      expect(config.supabaseUrl).toBe('http://override.com');
      expect(config.tenantId).toBe('override-tenant');
    });

    it('throws when required env var is missing', () => {
      delete process.env['BRIDGE_SUPABASE_URL'];
      expect(() => loadConfig()).toThrow('BRIDGE_SUPABASE_URL');
    });

    it('sets default sync schedule', () => {
      const config = loadConfig();
      expect(config.syncSchedule).toBe('*/30 * * * *');
    });

    it('uses custom sync schedule from env', () => {
      process.env['BRIDGE_SYNC_SCHEDULE'] = '*/15 * * * *';
      const config = loadConfig();
      expect(config.syncSchedule).toBe('*/15 * * * *');
    });

    it('loads all platform tokens', () => {
      process.env['BRIDGE_SLACK_BOT_TOKEN'] = 'slack-token';
      process.env['BRIDGE_GITHUB_TOKEN'] = 'github-token';
      process.env['BRIDGE_JIRA_HOST'] = 'jira.example.com';
      process.env['BRIDGE_JIRA_EMAIL'] = 'user@example.com';
      process.env['BRIDGE_JIRA_TOKEN'] = 'jira-token';
      const config = loadConfig();
      expect(config.slackBotToken).toBe('slack-token');
      expect(config.githubToken).toBe('github-token');
      expect(config.jiraHost).toBe('jira.example.com');
    });
  });

  describe('validateConfig', () => {
    it('returns no errors for valid config', () => {
      const config = loadConfig();
      expect(validateConfig(config)).toEqual([]);
    });

    it('returns errors for missing supabaseUrl', () => {
      const config = loadConfig();
      (config as any).supabaseUrl = '';
      const errors = validateConfig(config);
      expect(errors).toContain('supabaseUrl is required');
    });

    it('returns errors for missing supabaseKey', () => {
      const config = loadConfig();
      (config as any).supabaseKey = '';
      const errors = validateConfig(config);
      expect(errors).toContain('supabaseKey is required');
    });

    it('returns errors for missing tenantId', () => {
      const config = loadConfig();
      (config as any).tenantId = '';
      const errors = validateConfig(config);
      expect(errors).toContain('tenantId is required');
    });

    it('validates Jira requires email and token when host is set', () => {
      const config = loadConfig();
      config.jiraHost = 'jira.example.com';
      config.jiraEmail = undefined;
      config.jiraToken = undefined;
      const errors = validateConfig(config);
      expect(errors.some((e) => e.includes('jiraEmail'))).toBe(true);
    });

    it('validates Trello requires token when apiKey is set', () => {
      const config = loadConfig();
      config.trelloApiKey = 'key';
      config.trelloToken = undefined;
      const errors = validateConfig(config);
      expect(errors.some((e) => e.includes('trelloToken'))).toBe(true);
    });
  });
});
