import type {
  PublishLog,
  PublishLogInsert,
  PublishStatus,
  PublishPlatform,
} from '../types/index.js';
import { DatabaseError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
import { getSupabase } from './client.js';

/**
 * Create a publish log entry.
 */
export async function createPublishLog(data: PublishLogInsert): Promise<PublishLog> {
  const supabase = getSupabase();

  const { data: entry, error } = await supabase
    .from('publish_log')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    log.error('Failed to create publish log', error.message);
    throw new DatabaseError(`Failed to create publish log: ${error.message}`);
  }

  log.info('Publish log created:', entry.id, data.platform);
  return entry as PublishLog;
}

/**
 * Update a publish log entry by ID.
 */
export async function updatePublishLog(
  id: number,
  data: {
    status: PublishStatus;
    external_url?: string;
    error_message?: string;
    published_at?: string;
  },
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('publish_log')
    .update(data)
    .eq('id', id);

  if (error) {
    log.error('Failed to update publish log', id, error.message);
    throw new DatabaseError(`Failed to update publish log ${id}: ${error.message}`);
  }
}

/**
 * List publish log entries for a tenant, optionally filtered by digest ID and platform.
 */
export async function listPublishLogs(
  tenantId: string,
  opts?: {
    digestId?: number;
    platform?: PublishPlatform;
    limit?: number;
  },
): Promise<PublishLog[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('publish_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (opts?.digestId != null) {
    query = query.eq('digest_id', opts.digestId);
  }

  if (opts?.platform) {
    query = query.eq('platform', opts.platform);
  }

  if (opts?.limit != null) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to list publish logs', tenantId, error.message);
    throw new DatabaseError(
      `Failed to list publish logs for tenant "${tenantId}": ${error.message}`,
    );
  }

  return (data ?? []) as PublishLog[];
}
