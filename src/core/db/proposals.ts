import type { SupabaseClient } from '@supabase/supabase-js';
import type { Proposal, ProposalSectionData } from '../types/database.js';
import type { PricingModel, ProposalStatus } from '../types/common.js';
import { ProposeError } from '../utils/errors.js';
import { now, addDays } from '../utils/date.js';

const TABLE = 'propose_proposals';

export interface CreateProposalInput {
  tenant_id: string;
  title: string;
  client_name: string;
  client_email: string;
  pricing_model: PricingModel;
  template_id?: string;
  sections?: ProposalSectionData[];
  currency?: string;
  expiry_days?: number;
}

export async function createProposal(
  db: SupabaseClient,
  input: CreateProposalInput,
): Promise<Proposal> {
  const record = {
    tenant_id: input.tenant_id,
    title: input.title,
    client_name: input.client_name,
    client_email: input.client_email,
    status: 'draft' as ProposalStatus,
    pricing_model: input.pricing_model,
    sections: input.sections ?? [],
    currency: input.currency ?? 'USD',
    valid_until: addDays(new Date(), input.expiry_days ?? 30),
    template_id: input.template_id ?? null,
    tags: [],
    created_at: now(),
    updated_at: now(),
  };

  const { data, error } = await db.from(TABLE).insert(record).select().single();

  if (error) {
    throw ProposeError.internal(`Failed to create proposal: ${error.message}`);
  }

  return data as Proposal;
}

export async function getProposal(db: SupabaseClient, id: string): Promise<Proposal> {
  const { data, error } = await db.from(TABLE).select('*').eq('id', id).single();

  if (error || !data) {
    throw ProposeError.notFound('Proposal', id);
  }

  return data as Proposal;
}

export async function listProposals(
  db: SupabaseClient,
  tenantId: string,
  options: { status?: ProposalStatus; limit?: number } = {},
): Promise<Proposal[]> {
  let query = db.from(TABLE).select('*').eq('tenant_id', tenantId);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  query = query.order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw ProposeError.internal(`Failed to list proposals: ${error.message}`);
  }

  return (data ?? []) as Proposal[];
}

export async function updateProposal(
  db: SupabaseClient,
  id: string,
  updates: Partial<Omit<Proposal, 'id' | 'tenant_id' | 'created_at'>>,
): Promise<Proposal> {
  const { data, error } = await db
    .from(TABLE)
    .update({ ...updates, updated_at: now() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw ProposeError.internal(`Failed to update proposal: ${error?.message ?? 'not found'}`);
  }

  return data as Proposal;
}

export async function deleteProposal(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', id);

  if (error) {
    throw ProposeError.internal(`Failed to delete proposal: ${error.message}`);
  }
}
