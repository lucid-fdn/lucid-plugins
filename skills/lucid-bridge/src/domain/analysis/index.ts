export {
  syncEntity,
  detectConflicts,
  resolveConflicts,
  buildChangeSet,
  type ChangeSet,
  type ConflictInfo,
  type ConflictStrategy,
} from './sync-engine.js';

export {
  executeWorkflow,
  evaluateCondition,
  executeAction,
  type WorkflowTrigger,
  type WorkflowExecutionResult,
} from './workflow-engine.js';

export {
  normalizeTask,
  denormalizeTask,
  mapEntity,
  type NormalizedTask,
} from './mapper.js';

export {
  WORKFLOW_BUILDER_PROMPT,
  SYNC_STATUS_PROMPT,
  CROSS_PLATFORM_SEARCH_PROMPT,
  ACTIVITY_FEED_PROMPT,
} from './prompts.js';
