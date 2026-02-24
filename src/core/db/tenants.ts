import type { Tenant } from '../types/index.js';
import { DatabaseError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { getSupabase } from './client.js';

/**
 * Retrieve a tenant by ID.
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    log.error('Failed to get tenant', tenantId, error.message);
    throw new DatabaseError(`Failed to get tenant "${tenantId}": ${error.message}`);
  }

  return data as Tenant | null;
}

/**
 * Ensure a tenant exists, creating it if necessary (upsert).
 */
export async function ensureTenant(tenantId: string, name?: string): Promise<Tenant> {
  const supabase = getSupabase();

  const tenantName = name ?? tenantId;

  const { data, error } = await supabase
    .from('tenants')
    .upsert({ id: tenantId, name: tenantName }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    log.error('Failed to upsert tenant', tenantId, error.message);
    throw new DatabaseError(`Failed to ensure tenant "${tenantId}": ${error.message}`);
  }

  log.info('Tenant ensured:', tenantId);

  const tenant = data as Tenant;

  return tenant;
}
