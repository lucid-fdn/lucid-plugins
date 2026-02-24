import type { Item, ItemInsert, ItemStatus, DigestType } from '../types/index.js';
import { DatabaseError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { getSupabase } from './client.js';

/**
 * Upsert a single item. Conflicts on (tenant_id, canonical_url) trigger an update.
 */
export async function upsertItem(data: ItemInsert): Promise<Item> {
  const supabase = getSupabase();

  const { data: item, error } = await supabase
    .from('items')
    .upsert(data, { onConflict: 'tenant_id,canonical_url' })
    .select('*')
    .single();

  if (error) {
    log.error('Failed to upsert item', data.canonical_url, error.message);
    throw new DatabaseError(`Failed to upsert item "${data.canonical_url}": ${error.message}`);
  }

  return item as Item;
}

/**
 * Batch upsert items. Returns the count of successfully inserted items and any errors.
 */
export async function upsertItems(
  data: ItemInsert[],
): Promise<{ inserted: number; errors: string[] }> {
  if (data.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const supabase = getSupabase();
  const errors: string[] = [];
  let inserted = 0;

  // Process in batches to avoid payload limits
  const BATCH_SIZE = 100;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    const { data: result, error } = await supabase
      .from('items')
      .upsert(batch, { onConflict: 'tenant_id,canonical_url' })
      .select('id');

    if (error) {
      const msg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`;
      log.error('Batch upsert error', msg);
      errors.push(msg);
    } else {
      inserted += result?.length ?? 0;
    }
  }

  log.info(`Upserted ${inserted} items with ${errors.length} errors`);
  return { inserted, errors };
}

/**
 * List items for a tenant, with optional filtering and pagination.
 */
export async function listItems(
  tenantId: string,
  opts?: {
    status?: ItemStatus;
    sourceId?: number;
    limit?: number;
    offset?: number;
  },
): Promise<Item[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (opts?.status) {
    query = query.eq('status', opts.status);
  }

  if (opts?.sourceId != null) {
    query = query.eq('source_id', opts.sourceId);
  }

  if (opts?.limit != null) {
    query = query.limit(opts.limit);
  }

  if (opts?.offset != null) {
    const limit = opts?.limit ?? 50;
    query = query.range(opts.offset, opts.offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to list items', tenantId, error.message);
    throw new DatabaseError(`Failed to list items for tenant "${tenantId}": ${error.message}`);
  }

  return (data ?? []) as Item[];
}

/**
 * Get items eligible for digest generation.
 * Joins with sources to filter by trust_score, filters by status ('new' or 'processed'),
 * and returns items within the specified number of days.
 */
export async function getItemsForDigest(
  tenantId: string,
  opts: {
    trustThreshold: number;
    maxItems: number;
    daysBack: number;
    digestType: DigestType;
  },
): Promise<Item[]> {
  const supabase = getSupabase();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - opts.daysBack);
  const cutoffIso = cutoffDate.toISOString();

  // Query items joining with sources for trust_score filtering
  const { data, error } = await supabase
    .from('items')
    .select('*, sources!items_source_id_fkey(trust_score)')
    .eq('tenant_id', tenantId)
    .in('status', ['new', 'processed'])
    .gte('created_at', cutoffIso)
    .order('created_at', { ascending: false })
    .limit(opts.maxItems);

  if (error) {
    log.error('Failed to get items for digest', error.message);
    throw new DatabaseError(`Failed to get items for digest: ${error.message}`);
  }

  // Filter by trust threshold on the joined source
  const items = (data ?? []).filter((row) => {
    const source = row.sources as { trust_score: number } | null;
    // Include items without a source (trust_score defaults to passing)
    if (!source) return true;
    return source.trust_score >= opts.trustThreshold;
  });

  // Strip the joined sources data and return clean Item objects
  return items.map(({ sources: _sources, ...item }) => item) as Item[];
}

/**
 * Update the status of an item by ID.
 */
export async function updateItemStatus(id: number, status: ItemStatus): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', id);

  if (error) {
    log.error('Failed to update item status', id, error.message);
    throw new DatabaseError(`Failed to update item ${id} status: ${error.message}`);
  }
}

/**
 * Search items by title using ILIKE as a full-text search fallback.
 */
export async function searchItems(
  tenantId: string,
  query: string,
  limit?: number,
): Promise<Item[]> {
  const supabase = getSupabase();

  const searchPattern = `%${query}%`;

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('tenant_id', tenantId)
    .ilike('title', searchPattern)
    .order('created_at', { ascending: false })
    .limit(limit ?? 20);

  if (error) {
    log.error('Failed to search items', query, error.message);
    throw new DatabaseError(`Failed to search items: ${error.message}`);
  }

  return (data ?? []) as Item[];
}
