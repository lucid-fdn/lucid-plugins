import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { listWorkflows } from '../../domain/db/workflows.js';
import { listSyncLogs, getRecentErrors } from '../../domain/db/sync-logs.js';
import { listMappings } from '../../domain/db/mappings.js';
import { logger } from '../utils/logger.js';

export interface GetMetricsDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createGetMetricsTool(deps: GetMetricsDeps): ToolDefinition {
  return {
    name: 'bridge_get_metrics',
    description: 'Get workflow execution metrics, sync stats, and overall system statistics.',
    parameters: {},
    handler: async (_params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const db = getSupabaseClient();

        const [workflows, mappings, recentLogs, recentErrors] = await Promise.all([
          listWorkflows(db, deps.config.tenantId),
          listMappings(db, deps.config.tenantId),
          listSyncLogs(db, deps.config.tenantId, undefined, 100),
          getRecentErrors(db, deps.config.tenantId, 100),
        ]);

        const activeWorkflows = workflows.filter((w) => w.is_active);
        const totalRuns = workflows.reduce((sum, w) => sum + w.run_count, 0);
        const syncedMappings = mappings.filter((m) => m.status === 'synced');
        const failedMappings = mappings.filter((m) => m.status === 'failed');

        const successLogs = recentLogs.filter((l) => l.status === 'success');
        const successRate = recentLogs.length > 0
          ? Math.round((successLogs.length / recentLogs.length) * 100)
          : 100;

        return {
          success: true,
          data: {
            workflows: {
              total: workflows.length,
              active: activeWorkflows.length,
              total_runs: totalRuns,
            },
            sync_mappings: {
              total: mappings.length,
              synced: syncedMappings.length,
              failed: failedMappings.length,
            },
            recent_activity: {
              total_logs: recentLogs.length,
              errors: recentErrors.length,
              success_rate: `${successRate}%`,
            },
            platforms_connected: deps.providerRegistry.size,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_get_metrics failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
