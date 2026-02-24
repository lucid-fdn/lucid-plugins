// ---------------------------------------------------------------------------
// technical-audits.ts -- CRUD for seo_technical_audits table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { TechnicalAudit, TechnicalAuditInsert } from '../types/index.js';

const TABLE = 'seo_technical_audits';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createTechnicalAudit(data: TechnicalAuditInsert): Promise<TechnicalAudit> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create technical audit: ${error.message}`);
  return row as TechnicalAudit;
}

export async function getLatestAuditForDomain(domain: string): Promise<TechnicalAudit | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('domain', domain.toLowerCase())
    .order('audited_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get technical audit: ${error.message}`);
  return (data as TechnicalAudit) ?? null;
}

export async function listTechnicalAudits(limit = 20): Promise<TechnicalAudit[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('audited_at', { ascending: false })
    .limit(limit);
  if (error) throw new DatabaseError(`Failed to list technical audits: ${error.message}`);
  return (data as TechnicalAudit[]) ?? [];
}
