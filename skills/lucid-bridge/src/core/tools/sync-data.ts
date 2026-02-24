import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { getMapping, listMappings, updateMappingStatus, createMapping } from '../../domain/db/mappings.js';
import { createSyncLog } from '../../domain/db/sync-logs.js';
import { syncEntity } from '../../domain/analysis/sync-engine.js';
import { isPlatform, isEntityType, isSyncDirection, PLATFORMS, ENTITY_TYPES, SYNC_DIRECTIONS } from '../../domain/types/common.js';
import { logger } from '../utils/logger.js';
import { nowISO } from '../utils/date.js';

export interface SyncDataDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createSyncDataTool(deps: SyncDataDeps): ToolDefinition {
  return {
    name: 'bridge_sync_data',
    description: 'Sync data between two platforms. Creates a sync mapping and performs the sync.',
    parameters: {
      mapping_id: {
        type: 'string',
        description: 'Existing mapping ID to sync (if re-syncing)',
        required: false,
      },
      source_platform: {
        type: 'string',
        description: 'Source platform',
        required: false,
        enum: PLATFORMS,
      },
      source_id: {
        type: 'string',
        description: 'Source entity ID',
        required: false,
      },
      target_platform: {
        type: 'string',
        description: 'Target platform',
        required: false,
        enum: PLATFORMS,
      },
      target_id: {
        type: 'string',
        description: 'Target entity ID',
        required: false,
      },
      entity_type: {
        type: 'string',
        description: 'Type of entity being synced',
        required: false,
        enum: ENTITY_TYPES,
      },
      direction: {
        type: 'string',
        description: 'Sync direction',
        required: false,
        enum: SYNC_DIRECTIONS,
        default: 'source_to_target',
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const mappingId = params['mapping_id'] as string | undefined;
        const db = getSupabaseClient();

        let mapping;

        if (mappingId) {
          mapping = await getMapping(db, deps.config.tenantId, mappingId);
          if (!mapping) {
            return { success: false, error: `Mapping not found: ${mappingId}` };
          }
        } else {
          const sourcePlatform = params['source_platform'] as string;
          const sourceId = params['source_id'] as string;
          const targetPlatform = params['target_platform'] as string;
          const targetId = params['target_id'] as string;
          const entityType = (params['entity_type'] as string) ?? 'task';
          const direction = (params['direction'] as string) ?? 'source_to_target';

          if (!sourcePlatform || !sourceId || !targetPlatform || !targetId) {
            return {
              success: false,
              error: 'Either mapping_id or source_platform/source_id/target_platform/target_id are required',
            };
          }

          if (!isPlatform(sourcePlatform) || !isPlatform(targetPlatform)) {
            return { success: false, error: 'Invalid platform specified' };
          }

          if (!isEntityType(entityType)) {
            return { success: false, error: `Invalid entity_type: ${entityType}` };
          }

          if (!isSyncDirection(direction)) {
            return { success: false, error: `Invalid direction: ${direction}` };
          }

          mapping = await createMapping(db, deps.config.tenantId, {
            source_platform: sourcePlatform,
            source_id: sourceId,
            target_platform: targetPlatform,
            target_id: targetId,
            entity_type: entityType,
            direction,
          });
        }

        const syncResult = await syncEntity(mapping, deps.providerRegistry);

        await createSyncLog(db, deps.config.tenantId, {
          mapping_id: mapping.id,
          action: 'sync',
          status: syncResult.status,
          error_message: syncResult.error_message ?? undefined,
          details: syncResult.details,
        });

        await updateMappingStatus(
          db,
          deps.config.tenantId,
          mapping.id,
          syncResult.status === 'success' ? 'synced' : 'failed',
          syncResult.status === 'success' ? nowISO() : undefined,
        );

        logger.info('Sync completed', {
          mappingId: mapping.id,
          status: syncResult.status,
        });

        return {
          success: syncResult.status === 'success',
          data: {
            mapping_id: mapping.id,
            source: `${mapping.source_platform}:${mapping.source_id}`,
            target: `${mapping.target_platform}:${mapping.target_id}`,
            status: syncResult.status,
            details: syncResult.details,
          },
          ...(syncResult.error_message ? { error: syncResult.error_message } : {}),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_sync_data failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
