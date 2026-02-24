// ---------------------------------------------------------------------------
// defaults.ts -- Default config values
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';

export const CONFIG_DEFAULTS: Omit<PluginConfig, 'supabaseUrl' | 'supabaseKey'> = {
  tenantId: 'default',
  npsThreshold: 7,
  collectSchedule: '0 */6 * * *',
};
