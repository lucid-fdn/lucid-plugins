import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { listSyncLogs, getRecentErrors } from '../../domain/db/sync-logs.js';
import { logger } from '../utils/logger.js';

export interface GetLogsDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createGetLogsTool(deps: GetLogsDeps): ToolDefinition {
  return {
    name: 'bridge_get_logs',
    description: 'Get workflow execution and sync logs, optionally filtered by mapping.',
    parameters: {
      mapping_id: {
        type: 'string',
        description: 'Filter logs by sync mapping ID',
        required: false,
      },
      errors_only: {
        type: 'boolean',
        description: 'Show only error logs',
        required: false,
        default: false,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of logs to return',
        required: false,
        default: 50,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const mappingId = params['mapping_id'] as string | undefined;
        const errorsOnly = (params['errors_only'] as boolean) ?? false;
        const limit = (params['limit'] as number) ?? 50;
        const db = getSupabaseClient();

        let logs;
        if (errorsOnly) {
          logs = await getRecentErrors(db, deps.config.tenantId, limit);
        } else {
          logs = await listSyncLogs(db, deps.config.tenantId, mappingId, limit);
        }

        return {
          success: true,
          data: {
            count: logs.length,
            logs: logs.map((log) => ({
              id: log.id,
              mapping_id: log.mapping_id,
              action: log.action,
              status: log.status,
              error_message: log.error_message,
              details: log.details,
              created_at: log.created_at,
            })),
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_get_logs failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
