import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProposalSection } from '../types/database.js';
import type { SectionType } from '../types/common.js';
import { ProposeError } from '../utils/errors.js';

const TABLE = 'propose_sections';

export interface CreateSectionInput {
  proposal_id: string;
  section_type: SectionType;
  title: string;
  content: string;
  sort_order: number;
  is_included?: boolean;
}

export async function createSection(
  db: SupabaseClient,
  input: CreateSectionInput,
): Promise<ProposalSection> {
  const record = {
    ...input,
    is_included: input.is_included ?? true,
  };

  const { data, error } = await db.from(TABLE).insert(record).select().single();

  if (error) {
    throw ProposeError.internal(`Failed to create section: ${error.message}`);
  }

  return data as ProposalSection;
}

export async function listSections(
  db: SupabaseClient,
  proposalId: string,
): Promise<ProposalSection[]> {
  const { data, error } = await db
    .from(TABLE)
    .select('*')
    .eq('proposal_id', proposalId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw ProposeError.internal(`Failed to list sections: ${error.message}`);
  }

  return (data ?? []) as ProposalSection[];
}

export async function updateSection(
  db: SupabaseClient,
  id: string,
  updates: Partial<Omit<ProposalSection, 'id' | 'proposal_id'>>,
): Promise<ProposalSection> {
  const { data, error } = await db.from(TABLE).update(updates).eq('id', id).select().single();

  if (error || !data) {
    throw ProposeError.internal(`Failed to update section: ${error?.message ?? 'not found'}`);
  }

  return data as ProposalSection;
}

export async function deleteSection(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', id);

  if (error) {
    throw ProposeError.internal(`Failed to delete section: ${error.message}`);
  }
}
