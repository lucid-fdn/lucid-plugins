import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { listMappings, updateMappingStatus } from '../../domain/db/mappings.js';
import { createSyncLog } from '../../domain/db/sync-logs.js';
import { syncEntity } from '../../domain/analysis/sync-engine.js';
import { nowISO } from '../utils/date.js';
import { logger } from '../utils/logger.js';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export interface SchedulerDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

async function runSyncCycle(deps: SchedulerDeps): Promise<void> {
  logger.info('Starting scheduled sync cycle...');

  try {
    const db = getSupabaseClient();
    const mappings = await listMappings(db, deps.config.tenantId);

    const activeMappings = mappings.filter(
      (m) => m.status !== 'failed',
    );

    logger.info(`Syncing ${activeMappings.length} active mappings`);

    for (const mapping of activeMappings) {
      try {
        const result = await syncEntity(mapping, deps.providerRegistry);

        await createSyncLog(db, deps.config.tenantId, {
          mapping_id: mapping.id,
          action: 'scheduled_sync',
          status: result.status,
          error_message: result.error_message ?? undefined,
          details: result.details,
        });

        await updateMappingStatus(
          db,
          deps.config.tenantId,
          mapping.id,
          result.status === 'success' ? 'synced' : 'failed',
          result.status === 'success' ? nowISO() : undefined,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to sync mapping ${mapping.id}`, { error: message });
      }
    }

    logger.info('Sync cycle complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Sync cycle failed', { error: message });
  }
}

/**
 * Parse a basic cron-like schedule to milliseconds interval.
 * Supports simple patterns like "* /N * * * *" for every N minutes.
 * Falls back to 30 minutes.
 */
function cronToMs(schedule: string): number {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length >= 1) {
    const minutePart = parts[0]!;
    const match = minutePart.match(/^\*\/(\d+)$/);
    if (match?.[1]) {
      return parseInt(match[1], 10) * 60 * 1000;
    }
  }
  // Default: 30 minutes
  return 30 * 60 * 1000;
}

export function startScheduler(deps: SchedulerDeps): void {
  if (schedulerInterval) {
    logger.warn('Scheduler already running');
    return;
  }

  const intervalMs = cronToMs(deps.config.syncSchedule);
  schedulerInterval = setInterval(() => {
    void runSyncCycle(deps);
  }, intervalMs);

  logger.info(`Scheduler started (interval: ${intervalMs}ms, schedule: ${deps.config.syncSchedule})`);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Scheduler stopped');
  }
}
