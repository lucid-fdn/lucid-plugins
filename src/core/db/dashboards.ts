// ---------------------------------------------------------------------------
// dashboards.ts -- DashboardWidget CRUD
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { DashboardWidget, ChartType } from '../types/index.js';

export interface CreateWidgetParams {
  tenant_id: string;
  dashboard_name: string;
  widget_type: ChartType;
  config: Record<string, unknown>;
  position?: number;
}

export async function createWidget(params: CreateWidgetParams): Promise<DashboardWidget> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    dashboard_name: params.dashboard_name,
    widget_type: params.widget_type,
    config: params.config,
    position: params.position ?? 0,
    created_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_dashboard_widgets').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create widget: ${error.message}`);
  return data as DashboardWidget;
}

export async function listWidgets(tenantId: string, dashboardName?: string): Promise<DashboardWidget[]> {
  const db = getSupabase();
  let query = db.from('metrics_dashboard_widgets').select('*').eq('tenant_id', tenantId);
  if (dashboardName) query = query.eq('dashboard_name', dashboardName);
  query = query.order('position', { ascending: true });

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list widgets: ${error.message}`);
  return (data ?? []) as DashboardWidget[];
}

export async function deleteWidgets(tenantId: string, dashboardName: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from('metrics_dashboard_widgets')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('dashboard_name', dashboardName);
  if (error) throw new DatabaseError(`Failed to delete widgets: ${error.message}`);
}
