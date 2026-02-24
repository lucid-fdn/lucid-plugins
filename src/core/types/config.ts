export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;
  companyName: string;
  companyDescription?: string;
  slackWebhookUrl?: string;
  defaultCurrency: string;
  expiryDays: number;
}

export const DEFAULT_CONFIG: Partial<PluginConfig> = {
  defaultCurrency: 'USD',
  expiryDays: 30,
};
