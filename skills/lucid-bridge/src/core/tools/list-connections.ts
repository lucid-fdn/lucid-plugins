import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { PLATFORMS } from '../../domain/types/common.js';
import { logger } from '../utils/logger.js';

export interface ListConnectionsDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createListConnectionsTool(deps: ListConnectionsDeps): ToolDefinition {
  return {
    name: 'bridge_list_connections',
    description: 'List configured platform connections with their status.',
    parameters: {
      platform: {
        type: 'string',
        description: 'Filter by platform',
        required: false,
        enum: PLATFORMS,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const platform = params['platform'] as string | undefined;
        const db = getSupabaseClient();

        let query = db
          .from('bridge_connected_accounts')
          .select()
          .eq('tenant_id', deps.config.tenantId)
          .order('created_at', { ascending: false });

        if (platform) {
          query = query.eq('platform', platform);
        }

        const { data, error } = await query;

        if (error) {
          return { success: false, error: `Failed to list connections: ${error.message}` };
        }

        const connections = (data ?? []) as Array<Record<string, unknown>>;

        return {
          success: true,
          data: {
            count: connections.length,
            connections: connections.map((c) => ({
              id: c['id'],
              platform: c['platform'],
              account_name: c['account_name'],
              is_active: c['is_active'],
              last_verified: c['last_verified'],
              created_at: c['created_at'],
            })),
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_list_connections failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
