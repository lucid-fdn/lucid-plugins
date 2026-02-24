import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BridgeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = url ?? process.env['BRIDGE_SUPABASE_URL'];
  const supabaseKey = key ?? process.env['BRIDGE_SUPABASE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    throw BridgeError.configError(
      'Missing BRIDGE_SUPABASE_URL or BRIDGE_SUPABASE_KEY environment variables',
    );
  }

  _client = createClient(supabaseUrl, supabaseKey);
  logger.info('Supabase client initialized');
  return _client;
}

export function resetClient(): void {
  _client = null;
}
