import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workflow, WorkflowAction } from '../types/database.js';
import type { Platform } from '../types/common.js';
import { BridgeError } from '../../core/utils/errors.js';
import { logger } from '../../core/utils/logger.js';
import { nowISO } from '../../core/utils/date.js';

const TABLE = 'bridge_workflows';

export async function createWorkflow(
  db: SupabaseClient,
  tenantId: string,
  params: {
    name: string;
    trigger_platform: Platform;
    trigger_event: string;
    actions: WorkflowAction[];
  },
): Promise<Workflow> {
  const { data, error } = await db
    .from(TABLE)
    .insert({
      tenant_id: tenantId,
      name: params.name,
      trigger_platform: params.trigger_platform,
      trigger_event: params.trigger_event,
      actions: params.actions,
      is_active: true,
      status: 'active',
      run_count: 0,
      created_at: nowISO(),
      updated_at: nowISO(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create workflow', { error: error.message });
    throw new BridgeError(`Failed to create workflow: ${error.message}`, 'DB_ERROR');
  }

  return data as Workflow;
}

export async function getWorkflow(
  db: SupabaseClient,
  tenantId: string,
  workflowId: string,
): Promise<Workflow | null> {
  const { data, error } = await db
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId)
    .eq('id', workflowId)
    .single();

  if (error) return null;
  return data as Workflow;
}

export async function listWorkflows(
  db: SupabaseClient,
  tenantId: string,
): Promise<Workflow[]> {
  const { data, error } = await db
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to list workflows', { error: error.message });
    throw new BridgeError(`Failed to list workflows: ${error.message}`, 'DB_ERROR');
  }

  return (data ?? []) as Workflow[];
}

export async function updateWorkflow(
  db: SupabaseClient,
  tenantId: string,
  workflowId: string,
  updates: Partial<Pick<Workflow, 'name' | 'is_active' | 'status' | 'actions' | 'error_message'>>,
): Promise<Workflow> {
  const { data, error } = await db
    .from(TABLE)
    .update({ ...updates, updated_at: nowISO() })
    .eq('tenant_id', tenantId)
    .eq('id', workflowId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update workflow', { error: error.message });
    throw new BridgeError(`Failed to update workflow: ${error.message}`, 'DB_ERROR');
  }

  return data as Workflow;
}

export async function deleteWorkflow(
  db: SupabaseClient,
  tenantId: string,
  workflowId: string,
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', workflowId);

  if (error) {
    logger.error('Failed to delete workflow', { error: error.message });
    throw new BridgeError(`Failed to delete workflow: ${error.message}`, 'DB_ERROR');
  }
}

export async function incrementWorkflowRunCount(
  db: SupabaseClient,
  tenantId: string,
  workflowId: string,
): Promise<void> {
  // Use RPC or manual increment
  const workflow = await getWorkflow(db, tenantId, workflowId);
  if (!workflow) return;

  await db
    .from(TABLE)
    .update({
      run_count: workflow.run_count + 1,
      last_run: nowISO(),
      updated_at: nowISO(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', workflowId);
}
