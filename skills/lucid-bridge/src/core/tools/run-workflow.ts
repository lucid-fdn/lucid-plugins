import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { getWorkflow, incrementWorkflowRunCount } from '../../domain/db/workflows.js';
import { executeWorkflow } from '../../domain/analysis/workflow-engine.js';
import { logger } from '../utils/logger.js';

export interface RunWorkflowDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createRunWorkflowTool(deps: RunWorkflowDeps): ToolDefinition {
  return {
    name: 'bridge_run_workflow',
    description: 'Execute a workflow manually by providing a workflow ID and optional trigger data.',
    parameters: {
      workflow_id: {
        type: 'string',
        description: 'ID of the workflow to execute',
        required: true,
      },
      trigger_data: {
        type: 'object',
        description: 'Data to pass as trigger context',
        required: false,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const workflowId = params['workflow_id'] as string;
        const triggerData = (params['trigger_data'] as Record<string, unknown>) ?? {};

        if (!workflowId) {
          return { success: false, error: 'workflow_id is required' };
        }

        const db = getSupabaseClient();
        const workflow = await getWorkflow(db, deps.config.tenantId, workflowId);

        if (!workflow) {
          return { success: false, error: `Workflow not found: ${workflowId}` };
        }

        const result = await executeWorkflow(
          workflow,
          {
            platform: workflow.trigger_platform,
            event: workflow.trigger_event,
            data: triggerData,
          },
          deps.providerRegistry,
        );

        if (result.success) {
          await incrementWorkflowRunCount(db, deps.config.tenantId, workflowId);
        }

        logger.info('Workflow executed', {
          workflowId,
          success: result.success,
          actionsExecuted: result.actionsExecuted,
        });

        return {
          success: result.success,
          data: {
            workflow_id: result.workflowId,
            actions_executed: result.actionsExecuted,
            actions_skipped: result.actionsSkipped,
            errors: result.errors,
            started_at: result.startedAt,
            completed_at: result.completedAt,
          },
          ...(result.errors.length > 0 ? { error: result.errors.join('; ') } : {}),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_run_workflow failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
