import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncMapping } from '../types/database.js';
import type { Platform, SyncDirection, EntityType } from '../types/common.js';
import { BridgeError } from '../../core/utils/errors.js';
import { logger } from '../../core/utils/logger.js';
import { nowISO } from '../../core/utils/date.js';

const TABLE = 'bridge_sync_mappings';

export async function createMapping(
  db: SupabaseClient,
  tenantId: string,
  params: {
    source_platform: Platform;
    source_id: string;
    target_platform: Platform;
    target_id: string;
    entity_type: EntityType;
    direction: SyncDirection;
  },
): Promise<SyncMapping> {
  const { data, error } = await db
    .from(TABLE)
    .insert({
      tenant_id: tenantId,
      ...params,
      status: 'pending',
      metadata: {},
      created_at: nowISO(),
      updated_at: nowISO(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create sync mapping', { error: error.message });
    throw BridgeError.syncError(`Failed to create mapping: ${error.message}`);
  }

  return data as SyncMapping;
}

export async function getMapping(
  db: SupabaseClient,
  tenantId: string,
  mappingId: string,
): Promise<SyncMapping | null> {
  const { data, error } = await db
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId)
    .eq('id', mappingId)
    .single();

  if (error) return null;
  return data as SyncMapping;
}

export async function listMappings(
  db: SupabaseClient,
  tenantId: string,
  platform?: Platform,
): Promise<SyncMapping[]> {
  let query = db.from(TABLE).select().eq('tenant_id', tenantId);

  if (platform) {
    query = query.or(`source_platform.eq.${platform},target_platform.eq.${platform}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to list mappings', { error: error.message });
    throw BridgeError.syncError(`Failed to list mappings: ${error.message}`);
  }

  return (data ?? []) as SyncMapping[];
}

export async function updateMappingStatus(
  db: SupabaseClient,
  tenantId: string,
  mappingId: string,
  status: string,
  lastSynced?: string,
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({
      status,
      ...(lastSynced ? { last_synced: lastSynced } : {}),
      updated_at: nowISO(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', mappingId);

  if (error) {
    logger.error('Failed to update mapping status', { error: error.message });
    throw BridgeError.syncError(`Failed to update mapping: ${error.message}`);
  }
}

export async function deleteMapping(
  db: SupabaseClient,
  tenantId: string,
  mappingId: string,
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', mappingId);

  if (error) {
    logger.error('Failed to delete mapping', { error: error.message });
    throw BridgeError.syncError(`Failed to delete mapping: ${error.message}`);
  }
}
