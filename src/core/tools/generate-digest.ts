import type { PluginConfig, DigestType } from '../types/index.js';
import { getItemsForDigest, listSources } from '../db/index.js';
import { buildDailyDigest, buildWeeklyDigest } from '../digest/index.js';
import { toISODate } from '../utils/date.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface GenerateDigestDeps {
  config: PluginConfig;
}

export function createGenerateDigestTool(deps: GenerateDigestDeps): ToolDefinition {
  return {
    name: 'veille_generate_digest' as const,
    description: 'Generate a daily or weekly digest of monitored content. Returns prompt data for the agent LLM to produce the digest text.',
    params: {
      digest_type: { type: 'enum', values: ['daily', 'weekly'], required: false, description: 'Type of digest (default: daily)' },
      date: { type: 'string', required: false, description: 'Date for digest (YYYY-MM-DD, defaults to today)' },
    },
    execute: async (params: {
      digest_type?: DigestType;
      date?: string;
    }): Promise<string> => {
      try {
        const { config } = deps;
        const digestType: DigestType = params.digest_type ?? 'daily';
        const date = params.date ?? toISODate(new Date());
        const daysBack = digestType === 'weekly' ? 7 : 1;

        log.info(`Generating ${digestType} digest for ${date} (${daysBack} day(s) back)`);

        // Get eligible items from the database
        const items = await getItemsForDigest(config.tenantId, {
          trustThreshold: config.digestTrustThreshold,
          maxItems: config.digestMaxItems,
          daysBack,
          digestType,
        });

        if (items.length === 0) {
          return JSON.stringify({
            _action: 'generate_digest',
            digestType,
            date,
            itemCount: 0,
            prompt: null,
            message: `No items found for ${digestType} digest on ${date}. Try fetching new content first with veille_fetch_now.`,
          }, null, 2);
        }

        // Build source trust map for the ranker
        const allSources = await listSources(config.tenantId);
        const sourcesMap = new Map<number, { trust_score: number }>();
        for (const source of allSources) {
          sourcesMap.set(source.id, { trust_score: source.trust_score });
        }

        // Build the digest prompt data
        const buildOpts = {
          tenantId: config.tenantId,
          language: config.language,
          timezone: config.timezone,
          date,
          items,
          sources: sourcesMap,
          maxItems: config.digestMaxItems,
        };

        const promptData = digestType === 'weekly'
          ? buildWeeklyDigest(buildOpts)
          : buildDailyDigest(buildOpts);

        log.info(`Digest prompt built: ${promptData.itemCount} items for ${digestType} digest`);

        return JSON.stringify({
          _action: 'generate_digest',
          digestType: promptData.digestType,
          date: promptData.date,
          itemCount: promptData.itemCount,
          prompt: {
            systemPrompt: promptData.systemPrompt,
            userPrompt: promptData.userPrompt,
          },
        }, null, 2);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_generate_digest failed', msg);
        return JSON.stringify({
          _action: 'generate_digest',
          error: `Error generating digest: ${msg}`,
        }, null, 2);
      }
    },
  };
}
