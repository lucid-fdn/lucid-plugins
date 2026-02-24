import type { PluginConfig, ContentFormat, PublishPlatform, Publisher } from '../types/index.js';
import { createPublishLog, updatePublishLog } from '../db/index.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface PublishContentDeps {
  config: PluginConfig;
  publisherRegistry: Map<PublishPlatform, Publisher>;
}

export function createPublishContentTool(deps: PublishContentDeps): ToolDefinition {
  return {
    name: 'veille_publish' as const,
    description: 'Publish content to a specific platform (Ghost, WordPress, Twitter, LinkedIn, Dev.to, Telegram, Slack, or Discord)',
    params: {
      content: { type: 'string', required: true, description: 'Content to publish' },
      title: { type: 'string', required: true, description: 'Content title' },
      format: { type: 'enum', values: ['blog_post', 'x_thread', 'linkedin_post', 'newsletter'], required: true, description: 'Content format' },
      platform: { type: 'enum', values: ['ghost', 'wordpress', 'twitter', 'linkedin', 'devto', 'telegram', 'slack', 'discord'], required: true, description: 'Target platform' },
      digest_id: { type: 'number', required: false, description: 'Associated digest ID for audit trail' },
    },
    execute: async (params: {
      content: string;
      title: string;
      format: ContentFormat;
      platform: PublishPlatform;
      digest_id?: number;
    }): Promise<string> => {
      try {
        const { config, publisherRegistry } = deps;
        const publisher = publisherRegistry.get(params.platform);

        if (!publisher) {
          const available = [...publisherRegistry.keys()];
          return `Error: No publisher configured for platform "${params.platform}". Configured platforms: ${available.length > 0 ? available.join(', ') : '(none)'}. Check your plugin configuration.`;
        }

        log.info(`Publishing "${params.title}" to ${params.platform}`);

        // Create an audit trail entry in pending state
        const logEntry = await createPublishLog({
          tenant_id: config.tenantId,
          digest_id: params.digest_id,
          platform: params.platform,
          content_format: params.format,
          status: 'pending',
        });

        // Perform the publish
        const result = await publisher.publish({
          content: params.content,
          title: params.title,
          format: params.format,
        });

        // Update the audit trail
        if (result.success) {
          await updatePublishLog(logEntry.id, {
            status: 'published',
            external_url: result.externalUrl,
            published_at: new Date().toISOString(),
          });

          log.info(`Published successfully to ${params.platform}: ${result.externalUrl ?? '(no URL)'}`);

          return [
            `Published successfully to ${params.platform}.`,
            result.externalUrl ? `  URL: ${result.externalUrl}` : '',
            `  Publish log ID: ${logEntry.id}`,
          ].filter(Boolean).join('\n');
        } else {
          await updatePublishLog(logEntry.id, {
            status: 'failed',
            error_message: result.error,
          });

          log.error(`Publish to ${params.platform} failed: ${result.error}`);

          return `Publish to ${params.platform} failed: ${result.error ?? 'Unknown error'}`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_publish failed', msg);
        return `Error publishing content: ${msg}`;
      }
    },
  };
}
