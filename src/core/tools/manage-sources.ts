import type { PluginConfig, SourceType } from '../types/index.js';
import {
  createSource,
  listSources,
  updateSource,
  deleteSource,
} from '../db/index.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface ManageSourcesDeps {
  config: PluginConfig;
}

export function createAddSourceTool(deps: ManageSourcesDeps): ToolDefinition {
  return {
    name: 'veille_add_source' as const,
    description: 'Add a new content source to monitor (RSS feed, subreddit, Twitter search, Hacker News, or web page)',
    params: {
      url: { type: 'string', required: true, description: 'Source URL (RSS feed, subreddit, Twitter search, HN, or web page)' },
      source_type: { type: 'enum', values: ['rss', 'twitter', 'reddit', 'hackernews', 'web'], required: true, description: 'Type of source' },
      label: { type: 'string', required: false, description: 'Human-readable label' },
      trust_score: { type: 'number', required: false, min: 0, max: 100, description: 'Trust score 0-100 (default 50)' },
      fetch_config: { type: 'object', required: false, description: 'Source-specific fetch configuration' },
    },
    execute: async (params: {
      url: string;
      source_type: SourceType;
      label?: string;
      trust_score?: number;
      fetch_config?: Record<string, unknown>;
    }): Promise<string> => {
      try {
        const source = await createSource({
          tenant_id: deps.config.tenantId,
          url: params.url,
          source_type: params.source_type,
          label: params.label,
          trust_score: params.trust_score ?? 50,
          fetch_config: params.fetch_config,
        });

        log.info(`Source added: [${source.id}] ${source.url}`);

        return [
          `Source added successfully.`,
          `  ID: ${source.id}`,
          `  URL: ${source.url}`,
          `  Type: ${source.source_type}`,
          `  Label: ${source.label ?? '(none)'}`,
          `  Trust score: ${source.trust_score}`,
          `  Enabled: ${source.enabled}`,
        ].join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_add_source failed', msg);
        return `Error adding source: ${msg}`;
      }
    },
  };
}

export function createListSourcesTool(deps: ManageSourcesDeps): ToolDefinition {
  return {
    name: 'veille_list_sources' as const,
    description: 'List all monitored content sources, optionally filtered by status or type',
    params: {
      enabled_only: { type: 'boolean', required: false, description: 'Only show enabled sources' },
      source_type: { type: 'enum', values: ['rss', 'twitter', 'reddit', 'hackernews', 'web'], required: false, description: 'Type of source' },
    },
    execute: async (params: {
      enabled_only?: boolean;
      source_type?: SourceType;
    }): Promise<string> => {
      try {
        const sources = await listSources(deps.config.tenantId, {
          enabledOnly: params.enabled_only,
          sourceType: params.source_type,
        });

        if (sources.length === 0) {
          return 'No sources found matching the given filters.';
        }

        const lines = sources.map((s) => {
          const status = s.enabled ? 'enabled' : 'disabled';
          const lastFetch = s.last_fetched_at
            ? `last fetched ${s.last_fetched_at}`
            : 'never fetched';
          const error = s.last_error ? ` | error: ${s.last_error}` : '';
          return [
            `[${s.id}] ${s.source_type} — ${s.url}`,
            `     Label: ${s.label ?? '(none)'} | Trust: ${s.trust_score} | ${status}`,
            `     ${lastFetch}${error}`,
          ].join('\n');
        });

        return `Found ${sources.length} source(s):\n\n${lines.join('\n\n')}`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_list_sources failed', msg);
        return `Error listing sources: ${msg}`;
      }
    },
  };
}

export function createUpdateSourceTool(_deps: ManageSourcesDeps): ToolDefinition {
  return {
    name: 'veille_update_source' as const,
    description: 'Update an existing content source (enable/disable, change trust score, label, or fetch config)',
    params: {
      id: { type: 'number', required: true, description: 'Source ID to update' },
      enabled: { type: 'boolean', required: false },
      trust_score: { type: 'number', required: false, min: 0, max: 100 },
      label: { type: 'string', required: false },
      fetch_config: { type: 'object', required: false },
    },
    execute: async (params: {
      id: number;
      enabled?: boolean;
      trust_score?: number;
      label?: string;
      fetch_config?: Record<string, unknown>;
    }): Promise<string> => {
      try {
        const updateData: Record<string, unknown> = {};
        if (params.enabled !== undefined) updateData.enabled = params.enabled;
        if (params.trust_score !== undefined) updateData.trust_score = params.trust_score;
        if (params.label !== undefined) updateData.label = params.label;
        if (params.fetch_config !== undefined) updateData.fetch_config = params.fetch_config;

        if (Object.keys(updateData).length === 0) {
          return 'No fields to update. Provide at least one of: enabled, trust_score, label, fetch_config.';
        }

        const source = await updateSource(params.id, updateData);

        log.info(`Source updated: [${source.id}] ${source.url}`);

        return [
          `Source updated successfully.`,
          `  ID: ${source.id}`,
          `  URL: ${source.url}`,
          `  Type: ${source.source_type}`,
          `  Label: ${source.label ?? '(none)'}`,
          `  Trust score: ${source.trust_score}`,
          `  Enabled: ${source.enabled}`,
        ].join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_update_source failed', msg);
        return `Error updating source ${params.id}: ${msg}`;
      }
    },
  };
}

export function createRemoveSourceTool(deps: ManageSourcesDeps): ToolDefinition {
  return {
    name: 'veille_remove_source' as const,
    description: `Remove a content source by ID (tenant: ${deps.config.tenantId})`,
    params: {
      id: { type: 'number', required: true, description: 'Source ID to delete' },
    },
    execute: async (params: { id: number }): Promise<string> => {
      try {
        await deleteSource(params.id);
        log.info(`Source deleted: ${params.id}`);

        return `Source ${params.id} has been removed.`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_remove_source failed', msg);
        return `Error removing source ${params.id}: ${msg}`;
      }
    },
  };
}
