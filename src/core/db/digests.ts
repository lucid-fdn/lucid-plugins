import type { Digest, DigestInsert, DigestType } from '../types/index.js';
import { DatabaseError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { getSupabase } from './client.js';

/**
 * Create a digest, upserting on (tenant_id, date, digest_type).
 */
export async function createDigest(data: DigestInsert): Promise<Digest> {
  const supabase = getSupabase();

  const { data: digest, error } = await supabase
    .from('digests')
    .upsert(data, { onConflict: 'tenant_id,date,digest_type' })
    .select('*')
    .single();

  if (error) {
    log.error('Failed to create digest', error.message);
    throw new DatabaseError(`Failed to create digest: ${error.message}`);
  }

  log.info('Digest created:', digest.id, data.digest_type, data.date);
  return digest as Digest;
}

/**
 * Get the latest digest for a tenant, optionally filtered by digest type.
 */
export async function getLatestDigest(
  tenantId: string,
  digestType?: DigestType,
): Promise<Digest | null> {
  const supabase = getSupabase();

  let query = supabase
    .from('digests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (digestType) {
    query = query.eq('digest_type', digestType);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    log.error('Failed to get latest digest', tenantId, error.message);
    throw new DatabaseError(`Failed to get latest digest for tenant "${tenantId}": ${error.message}`);
  }

  return data as Digest | null;
}

/**
 * List digests for a tenant, optionally filtered by digest type, with a limit.
 */
export async function listDigests(
  tenantId: string,
  opts?: { digestType?: DigestType; limit?: number },
): Promise<Digest[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('digests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (opts?.digestType) {
    query = query.eq('digest_type', opts.digestType);
  }

  if (opts?.limit != null) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to list digests', tenantId, error.message);
    throw new DatabaseError(`Failed to list digests for tenant "${tenantId}": ${error.message}`);
  }

  return (data ?? []) as Digest[];
}
