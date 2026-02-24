import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = url ?? process.env['RECRUIT_SUPABASE_URL'];
  const supabaseKey = key ?? process.env['RECRUIT_SUPABASE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing RECRUIT_SUPABASE_URL or RECRUIT_SUPABASE_KEY');
  }

  logger.info('Initializing Supabase client');
  _client = createClient(supabaseUrl, supabaseKey);
  return _client;
}

export function resetClient(): void {
  _client = null;
}
