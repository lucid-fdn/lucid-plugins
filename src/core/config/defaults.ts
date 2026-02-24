// ---------------------------------------------------------------------------
// defaults.ts -- Default config values
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';

export const CONFIG_DEFAULTS: Omit<PluginConfig, 'supabaseUrl' | 'supabaseKey'> = {
  tenantId: 'default',
  reportSchedule: '0 9 * * 1',
  retentionWindow: 30,
};
