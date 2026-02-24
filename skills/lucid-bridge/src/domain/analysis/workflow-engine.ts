import type { Workflow, WorkflowAction, WorkflowCondition } from '../types/database.js';
import type { ProviderRegistry } from '../providers/index.js';
import { logger } from '../../core/utils/logger.js';
import { BridgeError } from '../../core/utils/errors.js';
import { nowISO } from '../../core/utils/date.js';

export interface WorkflowTrigger {
  platform: string;
  event: string;
  data: Record<string, unknown>;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  success: boolean;
  actionsExecuted: number;
  actionsSkipped: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
}

/**
 * Execute a workflow based on a trigger event.
 */
export async function executeWorkflow(
  workflow: Workflow,
  trigger: WorkflowTrigger,
  registry: ProviderRegistry,
): Promise<WorkflowExecutionResult> {
  const startedAt = nowISO();
  const errors: string[] = [];
  let actionsExecuted = 0;
  let actionsSkipped = 0;

  logger.info('Executing workflow', {
    workflowId: workflow.id,
    name: workflow.name,
    trigger: `${trigger.platform}:${trigger.event}`,
  });

  if (!workflow.is_active) {
    return {
      workflowId: workflow.id,
      success: false,
      actionsExecuted: 0,
      actionsSkipped: workflow.actions.length,
      errors: ['Workflow is not active'],
      startedAt,
      completedAt: nowISO(),
    };
  }

  for (const action of workflow.actions) {
    try {
      // Check condition
      if (action.condition) {
        const conditionMet = evaluateCondition(action.condition, trigger.data);
        if (!conditionMet) {
          actionsSkipped++;
          logger.info('Skipping action due to condition', {
            action: action.action,
            condition: action.condition,
          });
          continue;
        }
      }

      await executeAction(action, trigger.data, registry);
      actionsExecuted++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Action ${action.action} on ${action.platform}: ${message}`);
      logger.error('Workflow action failed', {
        workflowId: workflow.id,
        action: action.action,
        error: message,
      });
    }
  }

  const result: WorkflowExecutionResult = {
    workflowId: workflow.id,
    success: errors.length === 0,
    actionsExecuted,
    actionsSkipped,
    errors,
    startedAt,
    completedAt: nowISO(),
  };

  logger.info('Workflow execution complete', {
    workflowId: workflow.id,
    success: result.success,
    actionsExecuted,
    actionsSkipped,
    errorCount: errors.length,
  });

  return result;
}

/**
 * Evaluate a workflow condition against data.
 */
export function evaluateCondition(
  condition: WorkflowCondition,
  data: Record<string, unknown>,
): boolean {
  const fieldValue = getNestedValue(data, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;
    case 'gt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue > condition.value
        : false;
    case 'lt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue < condition.value
        : false;
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return false;
  }
}

/**
 * Execute a single workflow action.
 */
export async function executeAction(
  action: WorkflowAction,
  data: Record<string, unknown>,
  registry: ProviderRegistry,
): Promise<void> {
  const provider = registry.get(action.platform);
  if (!provider) {
    throw BridgeError.platformError(
      action.platform,
      `Provider not connected: ${action.platform}`,
    );
  }

  logger.info('Executing action', {
    platform: action.platform,
    action: action.action,
  });

  // Interpolate params with trigger data
  const interpolatedParams = interpolateParams(action.params, data);

  switch (action.action) {
    case 'create_task':
      await provider.createTask({
        title: interpolatedParams['title'] as string,
        description: interpolatedParams['description'] as string,
        labels: interpolatedParams['labels'] as string[] | undefined,
      });
      break;

    case 'send_notification':
      await provider.sendNotification(
        interpolatedParams['target'] as string,
        interpolatedParams['message'] as string,
      );
      break;

    case 'search':
      await provider.search(interpolatedParams['query'] as string);
      break;

    default:
      throw BridgeError.badRequest(`Unknown action: ${action.action}`);
  }
}

/**
 * Get a nested value from an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Interpolate template strings in params with data values.
 * Supports {{field}} syntax.
 */
function interpolateParams(
  params: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      result[key] = value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
        const val = getNestedValue(data, path);
        return val !== undefined ? String(val) : `{{${path}}}`;
      });
    } else {
      result[key] = value;
    }
  }

  return result;
}
