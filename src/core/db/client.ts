// ---------------------------------------------------------------------------
// client.ts -- Supabase client singleton
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../utils/errors.js';

let client: SupabaseClient | null = null;

export function initSupabase(url: string, key: string): SupabaseClient {
  client = createClient(url, key);
  return client;
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new DatabaseError('Supabase client not initialized. Call initSupabase() first.');
  }
  return client;
}

export function resetSupabase(): void {
  client = null;
}

export type { SupabaseClient };
