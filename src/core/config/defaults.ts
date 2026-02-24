import type { PluginConfig } from '../types/config.js';

export const DEFAULT_CONFIG: Partial<PluginConfig> = {
  tenantId: 'personal',
  timezone: 'Europe/Paris',
  language: 'fr',
  fetchCron: '0 6 * * *',
  dailyDigestCron: '0 8 * * *',
  weeklyDigestCron: '0 9 * * 1',
  autoPublish: false,
  digestTrustThreshold: 30,
  digestMaxItems: 50,
};
