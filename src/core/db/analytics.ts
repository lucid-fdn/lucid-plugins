import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProposalAnalytics, AnalyticsEventType, AnalyticsSummary } from '../types/database.js';
import { ProposeError } from '../utils/errors.js';
import { now } from '../utils/date.js';

const TABLE = 'propose_analytics';

export async function recordEvent(
  db: SupabaseClient,
  proposalId: string,
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown> = {},
): Promise<ProposalAnalytics> {
  const record = {
    proposal_id: proposalId,
    event_type: eventType,
    metadata,
    created_at: now(),
  };

  const { data, error } = await db.from(TABLE).insert(record).select().single();

  if (error) {
    throw ProposeError.internal(`Failed to record event: ${error.message}`);
  }

  return data as ProposalAnalytics;
}

export async function getProposalEvents(
  db: SupabaseClient,
  proposalId: string,
): Promise<ProposalAnalytics[]> {
  const { data, error } = await db
    .from(TABLE)
    .select('*')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: false });

  if (error) {
    throw ProposeError.internal(`Failed to get events: ${error.message}`);
  }

  return (data ?? []) as ProposalAnalytics[];
}

export async function getRecentEvents(
  db: SupabaseClient,
  tenantId: string,
  days: number = 30,
): Promise<ProposalAnalytics[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from(TABLE)
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw ProposeError.internal(`Failed to get recent events: ${error.message}`);
  }

  return (data ?? []) as ProposalAnalytics[];
}

export function computeAnalyticsSummary(
  proposals: Array<{
    status: string;
    total_amount: number | null;
    created_at: string;
    decided_at: string | null;
  }>,
  events: ProposalAnalytics[],
): AnalyticsSummary {
  const statusCounts: Record<string, number> = {};
  let acceptedCount = 0;
  let decidedCount = 0;
  let totalAmount = 0;
  let amountCount = 0;
  let totalDaysToClose = 0;
  let closedCount = 0;

  for (const p of proposals) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;

    if (p.status === 'accepted') acceptedCount++;
    if (p.status === 'accepted' || p.status === 'rejected') decidedCount++;

    if (p.total_amount != null && p.total_amount > 0) {
      totalAmount += p.total_amount;
      amountCount++;
    }

    if (p.decided_at && p.created_at) {
      const days =
        (new Date(p.decided_at).getTime() - new Date(p.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      totalDaysToClose += days;
      closedCount++;
    }
  }

  const pipelineValue = proposals
    .filter((p) => p.status === 'draft' || p.status === 'review' || p.status === 'sent')
    .reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

  return {
    total_proposals: proposals.length,
    proposals_by_status: statusCounts,
    win_rate: decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0,
    avg_deal_size: amountCount > 0 ? Math.round(totalAmount / amountCount) : 0,
    total_pipeline_value: pipelineValue,
    avg_time_to_close_days: closedCount > 0 ? Math.round(totalDaysToClose / closedCount) : 0,
    recent_activity: events.slice(0, 10),
  };
}
