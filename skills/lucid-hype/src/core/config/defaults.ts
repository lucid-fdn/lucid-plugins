// ---------------------------------------------------------------------------
// defaults.ts -- Default config values
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';

export const CONFIG_DEFAULTS: Omit<PluginConfig, 'supabaseUrl' | 'supabaseKey'> = {
  tenantId: 'default',
  productName: 'My Product',
  productDescription: '',
  productUrl: '',
  postSchedule: '0 9,12,15,18 * * 1-5',
};
