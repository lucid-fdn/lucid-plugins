// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;

  // Integration API keys
  calendarApiKey?: string;
  slackBotToken?: string;
  notionToken?: string;
  linearApiKey?: string;

  // Notifications
  slackWebhookUrl?: string;

  // Scheduling
  digestSchedule: string;
  autoFollowUpDays: number;
}
