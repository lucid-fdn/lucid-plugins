export const PLATFORMS = [
  'notion',
  'linear',
  'slack',
  'github',
  'jira',
  'google_workspace',
  'discord',
  'trello',
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const SYNC_STATUSES = ['synced', 'pending', 'failed', 'conflict'] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const ENTITY_TYPES = ['task', 'document', 'message', 'issue', 'pr', 'page', 'channel'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const SYNC_DIRECTIONS = ['bidirectional', 'source_to_target', 'target_to_source'] as const;
export type SyncDirection = (typeof SYNC_DIRECTIONS)[number];

export const WORKFLOW_STATUSES = ['active', 'paused', 'error', 'draft'] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}

export function isSyncDirection(value: string): value is SyncDirection {
  return (SYNC_DIRECTIONS as readonly string[]).includes(value);
}
