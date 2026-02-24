// ---------------------------------------------------------------------------
// templates.ts -- CRUD for meet_templates table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { MeetingTemplate, MeetingTemplateInsert } from '../types/index.js';
import type { MeetingType } from '../types/index.js';

const TABLE = 'meet_templates';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createTemplate(data: MeetingTemplateInsert): Promise<MeetingTemplate> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create template: ${error.message}`);
  return row as MeetingTemplate;
}

export async function getTemplateById(id: number): Promise<MeetingTemplate | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get template: ${error.message}`);
  return (data as MeetingTemplate) ?? null;
}

export async function getTemplateByType(type: MeetingType): Promise<MeetingTemplate | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get template: ${error.message}`);
  return (data as MeetingTemplate) ?? null;
}

export async function listTemplates(): Promise<MeetingTemplate[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('name', { ascending: true });
  if (error) throw new DatabaseError(`Failed to list templates: ${error.message}`);
  return (data as MeetingTemplate[]) ?? [];
}
