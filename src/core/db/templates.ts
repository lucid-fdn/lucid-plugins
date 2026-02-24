import type { SupabaseClient } from '@supabase/supabase-js';
import type { Template, ProposalSectionData } from '../types/database.js';
import type { PricingModel, TemplateCategory } from '../types/common.js';
import { ProposeError } from '../utils/errors.js';
import { now } from '../utils/date.js';

const TABLE = 'propose_templates';

export interface CreateTemplateInput {
  tenant_id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  sections: ProposalSectionData[];
  default_pricing: PricingModel;
}

export async function createTemplate(
  db: SupabaseClient,
  input: CreateTemplateInput,
): Promise<Template> {
  const record = {
    ...input,
    is_active: true,
    use_count: 0,
    win_rate: null,
    created_at: now(),
    updated_at: now(),
  };

  const { data, error } = await db.from(TABLE).insert(record).select().single();

  if (error) {
    throw ProposeError.internal(`Failed to create template: ${error.message}`);
  }

  return data as Template;
}

export async function getTemplate(db: SupabaseClient, id: string): Promise<Template> {
  const { data, error } = await db.from(TABLE).select('*').eq('id', id).single();

  if (error || !data) {
    throw ProposeError.notFound('Template', id);
  }

  return data as Template;
}

export async function listTemplates(
  db: SupabaseClient,
  tenantId: string,
  options: { category?: TemplateCategory; active_only?: boolean } = {},
): Promise<Template[]> {
  let query = db.from(TABLE).select('*').eq('tenant_id', tenantId);

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.active_only !== false) {
    query = query.eq('is_active', true);
  }

  query = query.order('use_count', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw ProposeError.internal(`Failed to list templates: ${error.message}`);
  }

  return (data ?? []) as Template[];
}

export async function updateTemplate(
  db: SupabaseClient,
  id: string,
  updates: Partial<Omit<Template, 'id' | 'tenant_id' | 'created_at'>>,
): Promise<Template> {
  const { data, error } = await db
    .from(TABLE)
    .update({ ...updates, updated_at: now() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw ProposeError.internal(`Failed to update template: ${error?.message ?? 'not found'}`);
  }

  return data as Template;
}

export async function incrementTemplateUsage(db: SupabaseClient, id: string): Promise<void> {
  const template = await getTemplate(db, id);
  await updateTemplate(db, id, { use_count: template.use_count + 1 });
}
