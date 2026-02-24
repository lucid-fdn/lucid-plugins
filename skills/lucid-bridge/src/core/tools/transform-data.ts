import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { mapEntity } from '../../domain/analysis/mapper.js';
import { isPlatform, PLATFORMS, ENTITY_TYPES } from '../../domain/types/common.js';
import type { EntityType } from '../../domain/types/common.js';
import { logger } from '../utils/logger.js';

export interface TransformDataDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createTransformDataTool(_deps: TransformDataDeps): ToolDefinition {
  return {
    name: 'bridge_transform_data',
    description:
      'Transform data between platform formats (e.g., Linear issue to GitHub issue, Notion page to Jira task).',
    parameters: {
      data: {
        type: 'object',
        description: 'The source data to transform',
        required: true,
      },
      source_platform: {
        type: 'string',
        description: 'Platform the data comes from',
        required: true,
        enum: PLATFORMS,
      },
      target_platform: {
        type: 'string',
        description: 'Platform to transform the data for',
        required: true,
        enum: PLATFORMS,
      },
      entity_type: {
        type: 'string',
        description: 'Type of entity',
        required: false,
        enum: ENTITY_TYPES,
        default: 'task',
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const data = params['data'] as Record<string, unknown>;
        const sourcePlatform = params['source_platform'] as string;
        const targetPlatform = params['target_platform'] as string;
        const entityType = (params['entity_type'] as string) ?? 'task';

        if (!data || !sourcePlatform || !targetPlatform) {
          return { success: false, error: 'data, source_platform, and target_platform are required' };
        }

        if (!isPlatform(sourcePlatform) || !isPlatform(targetPlatform)) {
          return { success: false, error: 'Invalid platform specified' };
        }

        const transformed = mapEntity(data, sourcePlatform, targetPlatform, entityType as EntityType);

        logger.info('Data transformed', { from: sourcePlatform, to: targetPlatform, entityType });

        return {
          success: true,
          data: {
            source_platform: sourcePlatform,
            target_platform: targetPlatform,
            entity_type: entityType,
            original: data,
            transformed,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_transform_data failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
