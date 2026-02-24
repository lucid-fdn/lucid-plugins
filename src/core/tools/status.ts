// ---------------------------------------------------------------------------
// status.ts -- System health and stats
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../plugin-id.js';
import { log } from '../utils/logger.js';

export function createStatusTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_status',
    description: 'System health and statistics: provider status, configuration, scheduler info, and database connectivity.',
    params: {},
    execute: async (): Promise<string> => {
      try {
        const configuredProviders = deps.providerRegistry.getConfigured();

        const lines: string[] = [
          `## ${PLUGIN_NAME} v${PLUGIN_VERSION}`,
          '',
          '### Providers',
          `- Configured: ${configuredProviders.length}/${deps.providerRegistry.providers.length}`,
          `- Active: ${configuredProviders.map((p) => p.name).join(', ') || 'None'}`,
          '',
          '### Configuration',
          `- Slack webhook: ${deps.config.slackWebhookUrl ? 'Configured' : 'Not configured'}`,
          `- Crawl schedule: ${deps.config.crawlSchedule}`,
          `- Tenant: ${deps.config.tenantId}`,
          '',
          '### Available Providers',
          `- SEMrush: ${deps.providerRegistry.providers.find((p) => p.name === 'semrush')?.isConfigured() ? 'Active' : 'Not configured'}`,
          `- Ahrefs: ${deps.providerRegistry.providers.find((p) => p.name === 'ahrefs')?.isConfigured() ? 'Active' : 'Not configured'}`,
          `- Moz: ${deps.providerRegistry.providers.find((p) => p.name === 'moz')?.isConfigured() ? 'Active' : 'Not configured'}`,
          `- SerpAPI: ${deps.providerRegistry.providers.find((p) => p.name === 'serpapi')?.isConfigured() ? 'Active' : 'Not configured'}`,
          '',
          '### Capabilities',
          `- Keyword Research: ${deps.providerRegistry.getKeywordProvider() ? 'Available' : 'Needs provider'}`,
          `- SERP Analysis: ${deps.providerRegistry.getSerpProvider() ? 'Available' : 'Needs provider'}`,
          `- Backlink Analysis: ${deps.providerRegistry.getBacklinkProvider() ? 'Available' : 'Needs provider'}`,
          `- Authority Metrics: ${deps.providerRegistry.getAuthorityProvider() ? 'Available' : 'Needs provider'}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_status failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
