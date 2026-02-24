import type { ToolDefinition, ToolResult } from './types.js';
import type { PluginConfig } from '../../domain/types/config.js';
import type { ProviderRegistry } from '../../domain/providers/index.js';
import { getSupabaseClient } from '../db/client.js';
import { isPlatform, PLATFORMS } from '../../domain/types/common.js';
import { nowISO } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export interface CreateWebhookDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createCreateWebhookTool(deps: CreateWebhookDeps): ToolDefinition {
  return {
    name: 'bridge_create_webhook',
    description: 'Create an incoming webhook endpoint for triggering workflows from external sources.',
    parameters: {
      name: {
        type: 'string',
        description: 'Webhook name',
        required: true,
      },
      platform: {
        type: 'string',
        description: 'Associated platform',
        required: true,
        enum: PLATFORMS,
      },
      event: {
        type: 'string',
        description: 'Event type this webhook listens for',
        required: true,
      },
      workflow_id: {
        type: 'string',
        description: 'Workflow to trigger when webhook is called',
        required: false,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        const name = params['name'] as string;
        const platform = params['platform'] as string;
        const event = params['event'] as string;
        const workflowId = params['workflow_id'] as string | undefined;

        if (!name || !platform || !event) {
          return { success: false, error: 'name, platform, and event are required' };
        }

        if (!isPlatform(platform)) {
          return { success: false, error: `Invalid platform: ${platform}` };
        }

        const webhookId = crypto.randomUUID();
        const secret = crypto.randomUUID().replace(/-/g, '');

        const db = getSupabaseClient();
        const { data, error } = await db
          .from('bridge_webhooks')
          .insert({
            id: webhookId,
            tenant_id: deps.config.tenantId,
            name,
            platform,
            event,
            workflow_id: workflowId ?? null,
            secret,
            is_active: true,
            created_at: nowISO(),
            updated_at: nowISO(),
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: `Failed to create webhook: ${error.message}` };
        }

        logger.info('Created webhook', { id: webhookId, name, platform });

        return {
          success: true,
          data: {
            id: (data as Record<string, unknown>)['id'],
            name,
            platform,
            event,
            workflow_id: workflowId,
            secret,
            is_active: true,
            endpoint: `/webhooks/${webhookId}`,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('bridge_create_webhook failed', { error: message });
        return { success: false, error: message };
      }
    },
  };
}
