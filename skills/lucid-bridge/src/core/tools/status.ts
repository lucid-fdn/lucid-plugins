import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../plugin-id.js';
import { logger } from '../utils/logger.js';

export interface StatusDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createStatusTool(deps: StatusDeps): ToolDefinition {
  return {
    name: 'bridge_status',
    description: 'System health and status: connected platforms, configuration, and uptime info.',
    parameters: {},
    handler: async (_params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const connectedPlatforms: string[] = [];
        const disconnectedPlatforms: string[] = [];

        for (const [platform, provider] of deps.providerRegistry) {
          try {
            const connected = await provider.isConnected();
            if (connected) {
              connectedPlatforms.push(platform);
            } else {
              disconnectedPlatforms.push(platform);
            }
          } catch {
            disconnectedPlatforms.push(platform);
          }
        }

        return {
          success: true,
          data: {
            name: PLUGIN_NAME,
            version: PLUGIN_VERSION,
            tenant_id: deps.config.tenantId,
            platforms: {
              connected: connectedPlatforms,
              disconnected: disconnectedPlatforms,
              total: deps.providerRegistry.size,
            },
            configuration: {
              has_notion: !!deps.config.notionToken,
              has_linear: !!deps.config.linearApiKey,
              has_slack: !!deps.config.slackBotToken,
              has_github: !!deps.config.githubToken,
              has_jira: !!deps.config.jiraHost,
              sync_schedule: deps.config.syncSchedule,
            },
            health: connectedPlatforms.length > 0 ? 'healthy' : 'degraded',
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_status failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
