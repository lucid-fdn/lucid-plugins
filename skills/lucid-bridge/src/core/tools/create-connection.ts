import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { isPlatform, PLATFORMS } from '../../domain/types/common.js';
import { nowISO } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export interface CreateConnectionDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createCreateConnectionTool(deps: CreateConnectionDeps): ToolDefinition {
  return {
    name: 'bridge_create_connection',
    description:
      'Set up a platform connection (Slack, GitHub, Notion, Linear, Jira, etc.).',
    parameters: {
      platform: {
        type: 'string',
        description: 'Platform to connect',
        required: true,
        enum: PLATFORMS,
      },
      account_name: {
        type: 'string',
        description: 'Friendly name for this connection',
        required: true,
      },
      config: {
        type: 'object',
        description: 'Platform-specific configuration (tokens, keys, etc.)',
        required: false,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const platform = params['platform'] as string;
        const accountName = params['account_name'] as string;
        const connectionConfig = (params['config'] as Record<string, unknown>) ?? {};

        if (!platform || !accountName) {
          return { success: false, error: 'platform and account_name are required' };
        }

        if (!isPlatform(platform)) {
          return { success: false, error: `Invalid platform: ${platform}` };
        }

        // Verify provider is available
        const provider = deps.providerRegistry.get(platform);
        let isConnected = false;

        if (provider) {
          try {
            isConnected = await provider.isConnected();
          } catch {
            isConnected = false;
          }
        }

        const db = getSupabaseClient();
        const { data, error } = await db
          .from('bridge_connected_accounts')
          .insert({
            tenant_id: deps.config.tenantId,
            platform,
            account_name: accountName,
            is_active: isConnected,
            config: connectionConfig,
            last_verified: isConnected ? nowISO() : null,
            created_at: nowISO(),
            updated_at: nowISO(),
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: `Failed to create connection: ${error.message}` };
        }

        logger.info('Created connection', { platform, accountName, isConnected });

        return {
          success: true,
          data: {
            id: (data as Record<string, unknown>)['id'],
            platform,
            account_name: accountName,
            is_active: isConnected,
            last_verified: isConnected ? nowISO() : null,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_create_connection failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
