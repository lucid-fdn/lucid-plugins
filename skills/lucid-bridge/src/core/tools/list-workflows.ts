import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { listWorkflows } from '../../domain/db/workflows.js';
import { logger } from '../utils/logger.js';

export interface ListWorkflowsDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createListWorkflowsTool(deps: ListWorkflowsDeps): ToolDefinition {
  return {
    name: 'bridge_list_workflows',
    description: 'List automation workflows with optional status filter.',
    parameters: {
      status: {
        type: 'string',
        description: 'Filter by workflow status',
        required: false,
        enum: ['active', 'paused', 'error', 'draft'] as const,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const status = params['status'] as string | undefined;
        const db = getSupabaseClient();
        let workflows = await listWorkflows(db, deps.config.tenantId);

        if (status) {
          workflows = workflows.filter((w) => w.status === status);
        }

        return {
          success: true,
          data: {
            count: workflows.length,
            workflows: workflows.map((w) => ({
              id: w.id,
              name: w.name,
              trigger: `${w.trigger_platform}:${w.trigger_event}`,
              status: w.status,
              is_active: w.is_active,
              run_count: w.run_count,
              last_run: w.last_run,
              action_count: w.actions.length,
            })),
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_list_workflows failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
