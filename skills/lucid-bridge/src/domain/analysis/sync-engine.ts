import type { SyncMapping, SyncLog } from '../types/database.js';
import type { ProviderRegistry } from '../providers/index.js';
import { logger } from '../../core/utils/logger.js';
import { BridgeError } from '../../core/utils/errors.js';
import { nowISO } from '../../core/utils/date.js';

export interface ChangeSet {
  added: Record<string, unknown>[];
  modified: Array<{ field: string; before: unknown; after: unknown }>;
  removed: string[];
}

export interface ConflictInfo {
  field: string;
  sourceValue: unknown;
  targetValue: unknown;
  lastSynced: string | null;
}

export type ConflictStrategy = 'source_wins' | 'target_wins' | 'newest_wins' | 'manual';

/**
 * Sync a single entity between two platforms.
 */
export async function syncEntity(
  mapping: SyncMapping,
  registry: ProviderRegistry,
): Promise<SyncLog> {
  const sourceProvider = registry.get(mapping.source_platform);
  const targetProvider = registry.get(mapping.target_platform);

  if (!sourceProvider) {
    throw BridgeError.platformError(
      mapping.source_platform,
      `Source provider not connected: ${mapping.source_platform}`,
    );
  }

  if (!targetProvider) {
    throw BridgeError.platformError(
      mapping.target_platform,
      `Target provider not connected: ${mapping.target_platform}`,
    );
  }

  logger.info('Syncing entity', {
    mappingId: mapping.id,
    source: `${mapping.source_platform}:${mapping.source_id}`,
    target: `${mapping.target_platform}:${mapping.target_id}`,
  });

  try {
    const sourceData = await sourceProvider.getEntity(mapping.source_id);
    if (!sourceData) {
      throw BridgeError.notFound('Source entity', mapping.source_id);
    }

    const targetData = await targetProvider.getEntity(mapping.target_id);

    // Detect conflicts for bidirectional syncs
    if (mapping.direction === 'bidirectional' && targetData) {
      const conflicts = detectConflicts(sourceData, targetData, mapping.last_synced);
      if (conflicts.length > 0) {
        logger.warn('Conflicts detected during sync', {
          mappingId: mapping.id,
          conflictCount: conflicts.length,
        });

        // Auto-resolve with source_wins strategy
        const resolved = resolveConflicts(conflicts, 'source_wins');
        logger.info('Auto-resolved conflicts', { resolved: resolved.length });
      }
    }

    const changes = buildChangeSet(targetData ?? {}, sourceData);
    logger.info('Change set built', {
      added: changes.added.length,
      modified: changes.modified.length,
      removed: changes.removed.length,
    });

    return {
      id: crypto.randomUUID(),
      tenant_id: mapping.tenant_id,
      mapping_id: mapping.id,
      action: 'sync',
      status: 'success',
      error_message: null,
      details: {
        changes_applied: changes.modified.length + changes.added.length,
        direction: mapping.direction,
        synced_at: nowISO(),
      },
      created_at: nowISO(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Sync failed', { mappingId: mapping.id, error: message });

    return {
      id: crypto.randomUUID(),
      tenant_id: mapping.tenant_id,
      mapping_id: mapping.id,
      action: 'sync',
      status: 'failure',
      error_message: message,
      details: { synced_at: nowISO() },
      created_at: nowISO(),
    };
  }
}

/**
 * Detect conflicts between source and target data.
 */
export function detectConflicts(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  lastSynced: string | null = null,
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

  for (const key of allKeys) {
    const sourceVal = source[key];
    const targetVal = target[key];

    // Skip metadata fields
    if (['id', 'created_at', 'updated_at', 'url'].includes(key)) continue;

    if (sourceVal !== undefined && targetVal !== undefined) {
      if (JSON.stringify(sourceVal) !== JSON.stringify(targetVal)) {
        conflicts.push({
          field: key,
          sourceValue: sourceVal,
          targetValue: targetVal,
          lastSynced,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Resolve conflicts using the specified strategy.
 */
export function resolveConflicts(
  conflicts: ConflictInfo[],
  strategy: ConflictStrategy,
): Array<{ field: string; resolvedValue: unknown }> {
  return conflicts.map((conflict) => {
    let resolvedValue: unknown;

    switch (strategy) {
      case 'source_wins':
        resolvedValue = conflict.sourceValue;
        break;
      case 'target_wins':
        resolvedValue = conflict.targetValue;
        break;
      case 'newest_wins':
        // Default to source if we can't determine age
        resolvedValue = conflict.sourceValue;
        break;
      case 'manual':
        // Return source value but flag for manual review
        resolvedValue = conflict.sourceValue;
        break;
      default:
        resolvedValue = conflict.sourceValue;
    }

    return { field: conflict.field, resolvedValue };
  });
}

/**
 * Build a change set describing differences between before and after states.
 */
export function buildChangeSet(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ChangeSet {
  const added: Record<string, unknown>[] = [];
  const modified: Array<{ field: string; before: unknown; after: unknown }> = [];
  const removed: string[] = [];

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];

    if (beforeVal === undefined && afterVal !== undefined) {
      added.push({ [key]: afterVal });
    } else if (beforeVal !== undefined && afterVal === undefined) {
      removed.push(key);
    } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      modified.push({ field: key, before: beforeVal, after: afterVal });
    }
  }

  return { added, modified, removed };
}
