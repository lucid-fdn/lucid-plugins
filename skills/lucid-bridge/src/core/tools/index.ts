import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { createCreateWorkflowTool } from './create-workflow.js';
import { createListWorkflowsTool } from './list-workflows.js';
import { createRunWorkflowTool } from './run-workflow.js';
import { createCreateConnectionTool } from './create-connection.js';
import { createListConnectionsTool } from './list-connections.js';
import { createSyncDataTool } from './sync-data.js';
import { createGetLogsTool } from './get-logs.js';
import { createCreateWebhookTool } from './create-webhook.js';
import { createTransformDataTool } from './transform-data.js';
import { createScheduleWorkflowTool } from './schedule-workflow.js';
import { createGetMetricsTool } from './get-metrics.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createCreateWorkflowTool(deps),
    createListWorkflowsTool(deps),
    createRunWorkflowTool(deps),
    createCreateConnectionTool(deps),
    createListConnectionsTool(deps),
    createSyncDataTool(deps),
    createGetLogsTool(deps),
    createCreateWebhookTool(deps),
    createTransformDataTool(deps),
    createScheduleWorkflowTool(deps),
    createGetMetricsTool(deps),
    createStatusTool(deps),
  ];
}

export {
  type ToolParamDef,
  type ToolDefinition,
  type ToolResult,
  toolParamsToZodSchema,
  toolParamsToJsonSchema,
} from './types.js';
