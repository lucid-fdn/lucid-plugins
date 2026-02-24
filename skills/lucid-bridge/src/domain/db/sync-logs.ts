import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncLog } from '../types/database.js';
import { BridgeError } from '../../core/utils/errors.js';
import { logger } from '../../core/utils/logger.js';
import { nowISO } from '../../core/utils/date.js';

const TABLE = 'bridge_sync_logs';

export async function createSyncLog(
  db: SupabaseClient,
  tenantId: string,
  params: {
    mapping_id: string;
    action: string;
    status: 'success' | 'failure';
    error_message?: string;
    details?: Record<string, unknown>;
  },
): Promise<SyncLog> {
  const { data, error } = await db
    .from(TABLE)
    .insert({
      tenant_id: tenantId,
      mapping_id: params.mapping_id,
      action: params.action,
      status: params.status,
      error_message: params.error_message ?? null,
      details: params.details ?? {},
      created_at: nowISO(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create sync log', { error: error.message });
    throw new BridgeError(`Failed to create sync log: ${error.message}`, 'DB_ERROR');
  }

  return data as SyncLog;
}

export async function listSyncLogs(
  db: SupabaseClient,
  tenantId: string,
  mappingId?: string,
  limit: number = 50,
): Promise<SyncLog[]> {
  let query = db
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mappingId) {
    query = query.eq('mapping_id', mappingId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to list sync logs', { error: error.message });
    throw new BridgeError(`Failed to list sync logs: ${error.message}`, 'DB_ERROR');
  }

  return (data ?? []) as SyncLog[];
}

export async function getRecentErrors(
  db: SupabaseClient,
  tenantId: string,
  limit: number = 10,
): Promise<SyncLog[]> {
  const { data, error } = await db
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId)
    .eq('status', 'failure')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to get recent errors', { error: error.message });
    return [];
  }

  return (data ?? []) as SyncLog[];
}
