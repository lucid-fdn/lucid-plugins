// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;

  // Integration API keys
  intercomApiKey?: string;
  zendeskApiKey?: string;
  typeformApiKey?: string;

  // Notifications
  slackWebhookUrl?: string;

  // NPS settings
  npsThreshold: number;

  // Scheduling
  collectSchedule: string;
}
