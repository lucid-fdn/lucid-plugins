import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient {
  if (client) return client;

  const supabaseUrl = url ?? process.env['PROPOSE_SUPABASE_URL'];
  const supabaseKey = key ?? process.env['PROPOSE_SUPABASE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('PROPOSE_SUPABASE_URL and PROPOSE_SUPABASE_KEY are required');
  }

  client = createClient(supabaseUrl, supabaseKey);
  logger.debug('Supabase client initialized');
  return client;
}

export function resetClient(): void {
  client = null;
}
