// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;
  mixpanelApiKey?: string;
  mixpanelSecret?: string;
  amplitudeApiKey?: string;
  amplitudeSecret?: string;
  posthogApiKey?: string;
  posthogHost?: string;
  gaPropertyId?: string;
  gaCredentials?: string;
  slackWebhookUrl?: string;
  reportSchedule: string;
  retentionWindow: number;
}
