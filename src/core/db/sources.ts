import type { Source, SourceInsert, SourceUpdate, SourceType } from '../types/index.js';
import { DatabaseError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { getSupabase } from './client.js';

/**
 * Create a new source.
 */
export async function createSource(data: SourceInsert): Promise<Source> {
  const supabase = getSupabase();

  const { data: source, error } = await supabase
    .from('sources')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    log.error('Failed to create source', error.message);
    throw new DatabaseError(`Failed to create source: ${error.message}`);
  }

  log.info('Source created:', source.id, data.url);
  return source as Source;
}

/**
 * Get a source by ID.
 */
export async function getSource(id: number): Promise<Source | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    log.error('Failed to get source', id, error.message);
    throw new DatabaseError(`Failed to get source ${id}: ${error.message}`);
  }

  return data as Source | null;
}

/**
 * List sources for a tenant, optionally filtered by enabled status and source type.
 */
export async function listSources(
  tenantId: string,
  opts?: { enabledOnly?: boolean; sourceType?: SourceType },
): Promise<Source[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('sources')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (opts?.enabledOnly) {
    query = query.eq('enabled', true);
  }

  if (opts?.sourceType) {
    query = query.eq('source_type', opts.sourceType);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to list sources', tenantId, error.message);
    throw new DatabaseError(`Failed to list sources for tenant "${tenantId}": ${error.message}`);
  }

  return (data ?? []) as Source[];
}

/**
 * Update a source by ID.
 */
export async function updateSource(id: number, data: SourceUpdate): Promise<Source> {
  const supabase = getSupabase();

  const { data: source, error } = await supabase
    .from('sources')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    log.error('Failed to update source', id, error.message);
    throw new DatabaseError(`Failed to update source ${id}: ${error.message}`);
  }

  return source as Source;
}

/**
 * Delete a source by ID.
 */
export async function deleteSource(id: number): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id);

  if (error) {
    log.error('Failed to delete source', id, error.message);
    throw new DatabaseError(`Failed to delete source ${id}: ${error.message}`);
  }

  log.info('Source deleted:', id);
}

/**
 * Update the fetch status of a source (last_fetched_at and optional last_error).
 */
export async function updateSourceFetchStatus(
  id: number,
  lastFetchedAt: string,
  lastError?: string | null,
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('sources')
    .update({
      last_fetched_at: lastFetchedAt,
      last_error: lastError ?? null,
    })
    .eq('id', id);

  if (error) {
    log.error('Failed to update source fetch status', id, error.message);
    throw new DatabaseError(`Failed to update source fetch status ${id}: ${error.message}`);
  }
}
