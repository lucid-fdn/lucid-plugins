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
  isPlatform,
  isEntityType,
  isSyncDirection,
} from './common.js';

export type { PluginConfig } from './config.js';

export type {
  SyncMapping,
  Workflow,
  WorkflowAction,
  WorkflowCondition,
  SyncLog,
  ConnectedAccount,
} from './database.js';
