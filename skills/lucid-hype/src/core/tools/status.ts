// ---------------------------------------------------------------------------
// status.ts -- System health and stats
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../plugin-id.js';
import { log } from '../utils/logger.js';

export function createStatusTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_status',
    description:
      'System health and statistics: plugin version, configuration status, and connected platforms.',
    params: {},
    execute: async (): Promise<string> => {
      try {
        const configuredPlatforms: string[] = [];
        if (deps.config.twitterApiKey) configuredPlatforms.push('Twitter');
        if (deps.config.linkedinAccessToken) configuredPlatforms.push('LinkedIn');
        if (deps.config.redditClientId) configuredPlatforms.push('Reddit');
        if (deps.config.tiktokAccessToken) configuredPlatforms.push('TikTok');
        if (deps.config.youtubeApiKey) configuredPlatforms.push('YouTube');
        if (deps.config.instagramAccessToken) configuredPlatforms.push('Instagram');

        const lines: string[] = [
          `## ${PLUGIN_NAME} v${PLUGIN_VERSION}`,
          '',
          '### Configuration',
          `- **Product**: ${deps.config.productName}`,
          `- **Product URL**: ${deps.config.productUrl || 'Not set'}`,
          `- **Tenant**: ${deps.config.tenantId}`,
          '',
          '### Connected Platforms',
          configuredPlatforms.length > 0
            ? configuredPlatforms.map((p) => `- ${p}`).join('\n')
            : '- No platform APIs configured (prompts still work)',
          '',
          '### Integrations',
          `- **Supabase**: ${deps.config.supabaseUrl ? 'Configured' : 'Not configured'}`,
          `- **Slack**: ${deps.config.slackWebhookUrl ? 'Configured' : 'Not configured'}`,
          '',
          '### Schedule',
          `- **Post Schedule**: ${deps.config.postSchedule}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_status failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
