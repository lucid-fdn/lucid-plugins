import type {
  PluginConfig,
  SourceType,
  Fetcher,
  PublishPlatform,
  Publisher,
} from '../types/index.js';
import { listSources, listItems, getLatestDigest } from '../db/index.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface StatusDeps {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  publisherRegistry: Map<PublishPlatform, Publisher>;
}

export function createStatusTool(deps: StatusDeps): ToolDefinition {
  return {
    name: 'veille_status' as const,
    description: 'Show Lucid Veille system status: source count, item count, latest digests, configured fetchers and publishers, schedule info',
    params: {},
    execute: async (): Promise<string> => {
      try {
        const { config, fetcherRegistry, publisherRegistry } = deps;

        // Gather data in parallel
        const [sources, items, latestDaily, latestWeekly] = await Promise.all([
          listSources(config.tenantId),
          listItems(config.tenantId, { limit: 0 }),
          getLatestDigest(config.tenantId, 'daily'),
          getLatestDigest(config.tenantId, 'weekly'),
        ]);

        const enabledSources = sources.filter((s) => s.enabled);
        const sourcesByType = new Map<string, number>();
        for (const s of sources) {
          sourcesByType.set(s.source_type, (sourcesByType.get(s.source_type) ?? 0) + 1);
        }

        // Format source breakdown
        const sourceBreakdown = [...sourcesByType.entries()]
          .map(([type, count]) => `    ${type}: ${count}`)
          .join('\n');

        // Configured fetchers
        const fetcherList = [...fetcherRegistry.entries()]
          .map(([type, f]) => `    ${type}: ${f.name}`)
          .join('\n');

        // Configured publishers
        const publisherList = [...publisherRegistry.entries()]
          .map(([platform, p]) => `    ${platform}: ${p.name}`)
          .join('\n');

        // Latest digest info
        const formatDigest = (label: string, digest: typeof latestDaily) => {
          if (!digest) return `  ${label}: (none)`;
          return [
            `  ${label}:`,
            `    Date: ${digest.date}`,
            `    Title: ${digest.title ?? '(untitled)'}`,
            `    Items: ${digest.item_count ?? 'N/A'}`,
            `    Created: ${digest.created_at}`,
          ].join('\n');
        };

        const report = [
          `=== Lucid Veille Status ===`,
          ``,
          `Tenant: ${config.tenantId}`,
          `Language: ${config.language}`,
          `Timezone: ${config.timezone}`,
          ``,
          `--- Sources ---`,
          `  Total: ${sources.length} (${enabledSources.length} enabled)`,
          sourceBreakdown ? `  By type:\n${sourceBreakdown}` : '',
          ``,
          `--- Items ---`,
          `  Total items in database: ${items.length}`,
          ``,
          `--- Latest Digests ---`,
          formatDigest('Daily', latestDaily),
          formatDigest('Weekly', latestWeekly),
          ``,
          `--- Configured Fetchers ---`,
          fetcherList || '    (none)',
          ``,
          `--- Configured Publishers ---`,
          publisherList || '    (none)',
          ``,
          `--- Schedule ---`,
          `  Fetch: ${config.fetchCron}`,
          `  Daily digest: ${config.dailyDigestCron}`,
          `  Weekly digest: ${config.weeklyDigestCron}`,
          `  Auto-publish: ${config.autoPublish ? 'enabled' : 'disabled'}`,
          ``,
          `--- Digest Settings ---`,
          `  Trust threshold: ${config.digestTrustThreshold}`,
          `  Max items per digest: ${config.digestMaxItems}`,
        ].filter((line) => line !== undefined).join('\n');

        return report;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_status failed', msg);
        return `Error getting status: ${msg}`;
      }
    },
  };
}
