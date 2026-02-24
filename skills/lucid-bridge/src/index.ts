export { default } from './openclaw.js';

// Re-export core types and utilities for library consumers
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';
export { loadConfig, validateConfig } from './core/config/index.js';
export { createAllTools, type ToolDependencies } from './core/tools/index.js';
export type { ToolDefinition, ToolResult, ToolParamDef } from './core/tools/types.js';
export { createBridgeServer } from './mcp.js';
export { createProviderRegistry, type ProviderRegistry } from './domain/providers/index.js';
export { BaseProvider, type ProviderSearchResult, type ProviderTask } from './domain/providers/base.js';

export {
  PLATFORMS,
  type Platform,
  SYNC_STATUSES,
  type SyncStatus,
  ENTITY_TYPES,
  type EntityType,
  SYNC_DIRECTIONS,
  type SyncDirection,
  WORKFLOW_STATUSES,
  type WorkflowStatus,
} from './domain/types/common.js';

export type {
  PluginConfig,
} from './domain/types/config.js';

export type {
  SyncMapping,
  Workflow,
  WorkflowAction,
  WorkflowCondition,
  SyncLog,
  ConnectedAccount,
} from './domain/types/database.js';

export {
  BridgeError,
  isBridgeError,
  logger,
  retry,
  sleep,
} from './core/utils/index.js';
