export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;
  linkedinApiKey?: string;
  githubToken?: string;
  leverApiKey?: string;
  greenhouseApiKey?: string;
  slackWebhookUrl?: string;
  autoScreenEnabled: boolean;
  screenSchedule: string;
}

export const DEFAULT_CONFIG: Partial<PluginConfig> = {
  autoScreenEnabled: true,
  screenSchedule: '0 8 * * *',
};
