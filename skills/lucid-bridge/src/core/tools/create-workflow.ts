import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { createWorkflow } from '../../domain/db/workflows.js';
import { isPlatform } from '../../domain/types/common.js';
import { PLATFORMS } from '../../domain/types/common.js';
import { logger } from '../utils/logger.js';

export interface CreateWorkflowDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createCreateWorkflowTool(deps: CreateWorkflowDeps): ToolDefinition {
  return {
    name: 'bridge_create_workflow',
    description:
      'Create an automation workflow with a trigger platform/event and one or more actions across platforms.',
    parameters: {
      name: { type: 'string', description: 'Workflow name', required: true },
      trigger_platform: {
        type: 'string',
        description: 'Platform that triggers the workflow',
        required: true,
        enum: PLATFORMS,
      },
      trigger_event: {
        type: 'string',
        description:
          'Event that triggers the workflow (e.g., issue_created, pr_opened, message_posted)',
        required: true,
      },
      actions: {
        type: 'array',
        description: 'List of actions to execute',
        required: true,
        items: {
          type: 'object',
          description: 'Action definition with platform, action type, and params',
        },
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const name = params['name'] as string;
        const triggerPlatform = params['trigger_platform'] as string;
        const triggerEvent = params['trigger_event'] as string;
        const actions = params['actions'] as Array<Record<string, unknown>>;

        if (!name || !triggerPlatform || !triggerEvent) {
          return { success: false, error: 'name, trigger_platform, and trigger_event are required' };
        }

        if (!isPlatform(triggerPlatform)) {
          return { success: false, error: `Invalid platform: ${triggerPlatform}` };
        }

        if (!Array.isArray(actions) || actions.length === 0) {
          return { success: false, error: 'At least one action is required' };
        }

        const db = getSupabaseClient();
        const workflow = await createWorkflow(db, deps.config.tenantId, {
          name,
          trigger_platform: triggerPlatform,
          trigger_event: triggerEvent,
          actions: actions.map((a) => ({
            platform: a['platform'] as string as any,
            action: a['action'] as string,
            params: (a['params'] as Record<string, unknown>) ?? {},
            condition: a['condition'] as any,
          })),
        });

        logger.info('Created workflow', { id: workflow.id, name: workflow.name });

        return {
          success: true,
          data: {
            id: workflow.id,
            name: workflow.name,
            trigger: `${workflow.trigger_platform}:${workflow.trigger_event}`,
            action_count: workflow.actions.length,
            status: workflow.status,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_create_workflow failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
