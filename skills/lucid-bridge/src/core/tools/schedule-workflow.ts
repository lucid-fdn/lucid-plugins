import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { getWorkflow, updateWorkflow } from '../../domain/db/workflows.js';
import { isValidCron, nowISO } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export interface ScheduleWorkflowDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createScheduleWorkflowTool(deps: ScheduleWorkflowDeps): ToolDefinition {
  return {
    name: 'bridge_schedule_workflow',
    description: 'Schedule a workflow for recurring execution using a cron expression.',
    parameters: {
      workflow_id: {
        type: 'string',
        description: 'ID of the workflow to schedule',
        required: true,
      },
      schedule: {
        type: 'string',
        description: 'Cron expression for schedule (e.g., "*/30 * * * *" for every 30 minutes)',
        required: true,
      },
      enabled: {
        type: 'boolean',
        description: 'Whether to enable or disable the schedule',
        required: false,
        default: true,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const workflowId = params['workflow_id'] as string;
        const schedule = params['schedule'] as string;
        const enabled = (params['enabled'] as boolean) ?? true;

        if (!workflowId || !schedule) {
          return { success: false, error: 'workflow_id and schedule are required' };
        }

        if (!isValidCron(schedule)) {
          return { success: false, error: `Invalid cron expression: ${schedule}` };
        }

        const db = getSupabaseClient();
        const workflow = await getWorkflow(db, deps.config.tenantId, workflowId);

        if (!workflow) {
          return { success: false, error: `Workflow not found: ${workflowId}` };
        }

        // Store schedule metadata in the workflow
        const { error } = await db
          .from('bridge_workflow_schedules')
          .upsert({
            workflow_id: workflowId,
            tenant_id: deps.config.tenantId,
            cron_expression: schedule,
            is_active: enabled,
            updated_at: nowISO(),
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: `Failed to schedule workflow: ${error.message}` };
        }

        if (enabled) {
          await updateWorkflow(db, deps.config.tenantId, workflowId, {
            is_active: true,
            status: 'active',
          });
        }

        logger.info('Workflow scheduled', { workflowId, schedule, enabled });

        return {
          success: true,
          data: {
            workflow_id: workflowId,
            workflow_name: workflow.name,
            schedule,
            enabled,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_schedule_workflow failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
