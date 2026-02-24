// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;

  // Provider API keys
  semrushApiKey?: string;
  ahrefsApiKey?: string;
  mozAccessId?: string;
  mozSecretKey?: string;
  serpApiKey?: string;
  googleSearchConsoleCredentials?: string;
  dataportalApiKey?: string;

  // Notifications
  slackWebhookUrl?: string;

  // Scheduling
  crawlSchedule: string;
}
