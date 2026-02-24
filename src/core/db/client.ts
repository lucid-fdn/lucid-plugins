import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../utils/errors.js';

let client: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with the given project URL and service role key.
 */
export function initSupabase(url: string, key: string): SupabaseClient {
  client = createClient(url, key);
  return client;
}

/**
 * Get the current Supabase client instance. Throws if not initialized.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new DatabaseError('Supabase client not initialized. Call initSupabase() first.');
  }
  return client;
}

/**
 * Reset the Supabase client (for testing or teardown).
 */
export function resetSupabase(): void {
  client = null;
}

export type { SupabaseClient };
