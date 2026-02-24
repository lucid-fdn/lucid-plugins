import type { PluginConfig, SourceType, Fetcher } from '../types/index.js';
import { listSources, getSource, upsertItems, updateSourceFetchStatus } from '../db/index.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface FetchNowDeps {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
}

export function createFetchNowTool(deps: FetchNowDeps): ToolDefinition {
  return {
    name: 'veille_fetch_now' as const,
    description: 'Fetch new content from sources immediately. Optionally specify a single source ID, or omit to fetch from all enabled sources.',
    params: {
      source_id: { type: 'number', required: false, description: 'Specific source ID to fetch (omit for all)' },
    },
    execute: async (params: { source_id?: number }): Promise<string> => {
      try {
        const { config, fetcherRegistry } = deps;
        const results: string[] = [];
        let totalItems = 0;
        let totalErrors = 0;

        // Determine which sources to fetch
        let sourcesToFetch;
        if (params.source_id !== undefined) {
          const source = await getSource(params.source_id);
          if (!source) {
            return `Error: Source with ID ${params.source_id} not found.`;
          }
          if (!source.enabled) {
            return `Error: Source ${params.source_id} is disabled. Enable it first with veille_update_source.`;
          }
          sourcesToFetch = [source];
        } else {
          sourcesToFetch = await listSources(config.tenantId, { enabledOnly: true });
        }

        if (sourcesToFetch.length === 0) {
          return 'No enabled sources to fetch. Add sources with veille_add_source first.';
        }

        log.info(`Fetching from ${sourcesToFetch.length} source(s)...`);

        for (const source of sourcesToFetch) {
          const fetcher = fetcherRegistry.get(source.source_type);

          if (!fetcher) {
            const msg = `No fetcher configured for source type "${source.source_type}"`;
            results.push(`[${source.id}] ${source.url} — SKIPPED: ${msg}`);
            await updateSourceFetchStatus(source.id, new Date().toISOString(), msg);
            totalErrors++;
            continue;
          }

          try {
            const fetchResult = await fetcher.fetch(source);

            // Upsert fetched items
            if (fetchResult.items.length > 0) {
              // Ensure tenant_id is set on all items
              const itemsWithTenant = fetchResult.items.map((item) => ({
                ...item,
                tenant_id: config.tenantId,
                source_id: source.id,
              }));

              const upsertResult = await upsertItems(itemsWithTenant);
              totalItems += upsertResult.inserted;

              if (upsertResult.errors.length > 0) {
                totalErrors += upsertResult.errors.length;
                results.push(
                  `[${source.id}] ${source.url} — ${upsertResult.inserted} items, ${upsertResult.errors.length} upsert error(s)`,
                );
              } else {
                results.push(
                  `[${source.id}] ${source.url} — ${upsertResult.inserted} items`,
                );
              }
            } else {
              results.push(`[${source.id}] ${source.url} — 0 new items`);
            }

            // Record fetch errors from the fetcher itself
            if (fetchResult.errors.length > 0) {
              totalErrors += fetchResult.errors.length;
              for (const fe of fetchResult.errors) {
                results.push(`  Warning: ${fe}`);
              }
            }

            // Update source status
            const lastError = fetchResult.errors.length > 0
              ? fetchResult.errors.join('; ')
              : null;
            await updateSourceFetchStatus(source.id, new Date().toISOString(), lastError);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            totalErrors++;
            results.push(`[${source.id}] ${source.url} — ERROR: ${msg}`);
            await updateSourceFetchStatus(source.id, new Date().toISOString(), msg);
          }
        }

        const summary = [
          `Fetch complete.`,
          `  Sources processed: ${sourcesToFetch.length}`,
          `  Total items fetched: ${totalItems}`,
          `  Total errors: ${totalErrors}`,
          ``,
          `Details:`,
          ...results,
        ].join('\n');

        log.info(`Fetch complete: ${totalItems} items, ${totalErrors} errors`);

        return summary;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_fetch_now failed', msg);
        return `Error during fetch: ${msg}`;
      }
    },
  };
}
