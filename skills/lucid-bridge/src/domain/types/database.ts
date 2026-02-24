import type { Platform, SyncStatus, EntityType, SyncDirection, WorkflowStatus } from './common.js';

export interface SyncMapping {
  id: string;
  tenant_id: string;
  source_platform: Platform;
  source_id: string;
  target_platform: Platform;
  target_id: string;
  entity_type: EntityType;
  direction: SyncDirection;
  last_synced: string | null;
  status: SyncStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  trigger_platform: Platform;
  trigger_event: string;
  actions: WorkflowAction[];
  is_active: boolean;
  status: WorkflowStatus;
  last_run: string | null;
  run_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  platform: Platform;
  action: string;
  params: Record<string, unknown>;
  condition?: WorkflowCondition;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'exists';
  value: unknown;
}

export interface SyncLog {
  id: string;
  tenant_id: string;
  mapping_id: string;
  action: string;
  status: 'success' | 'failure';
  error_message: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  tenant_id: string;
  platform: Platform;
  account_name: string;
  is_active: boolean;
  config: Record<string, unknown>;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}
