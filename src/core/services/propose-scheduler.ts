import type { SupabaseClient } from '@supabase/supabase-js';
import type { Proposal } from '../types/database.js';
import { listProposals, updateProposal } from '../db/proposals.js';
import { isPast, isWithinDays } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export interface ExpiringProposal {
  id: string;
  title: string;
  client_name: string;
  valid_until: string;
  days_remaining: number;
}

/**
 * Check for proposals that are expiring soon.
 */
export async function getExpiringProposals(
  db: SupabaseClient,
  tenantId: string,
  withinDays: number = 7,
): Promise<ExpiringProposal[]> {
  const proposals = await listProposals(db, tenantId, { status: 'sent' });
  const expiring: ExpiringProposal[] = [];

  for (const proposal of proposals) {
    if (!proposal.valid_until) continue;

    if (isWithinDays(proposal.valid_until, withinDays)) {
      const validUntil = new Date(proposal.valid_until);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      expiring.push({
        id: proposal.id,
        title: proposal.title,
        client_name: proposal.client_name,
        valid_until: proposal.valid_until,
        days_remaining: Math.max(0, daysRemaining),
      });
    }
  }

  logger.info(`Found ${expiring.length} expiring proposal(s) within ${withinDays} days`);
  return expiring;
}

/**
 * Mark expired proposals.
 */
export async function markExpiredProposals(
  db: SupabaseClient,
  tenantId: string,
): Promise<number> {
  const proposals = await listProposals(db, tenantId, { status: 'sent' });
  let expiredCount = 0;

  for (const proposal of proposals) {
    if (proposal.valid_until && isPast(proposal.valid_until)) {
      await updateProposal(db, proposal.id, { status: 'expired' });
      expiredCount++;
      logger.info(`Marked proposal "${proposal.title}" as expired`);
    }
  }

  return expiredCount;
}
