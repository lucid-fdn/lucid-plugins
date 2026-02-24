import { z } from 'zod';
import type { PluginConfig } from '../types/config.js';
import { ProposeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const configSchema = z.object({
  supabaseUrl: z.string().url('PROPOSE_SUPABASE_URL must be a valid URL'),
  supabaseKey: z.string().min(1, 'PROPOSE_SUPABASE_KEY is required'),
  tenantId: z.string().min(1, 'PROPOSE_TENANT_ID is required').default('default'),
  companyName: z.string().min(1, 'PROPOSE_COMPANY_NAME is required').default('My Company'),
  companyDescription: z.string().optional(),
  slackWebhookUrl: z.string().url().optional(),
  defaultCurrency: z.string().min(3).max(3).default('USD'),
  expiryDays: z.coerce.number().int().positive().default(30),
});

export function loadConfig(env: Record<string, string | undefined> = process.env): PluginConfig {
  const raw = {
    supabaseUrl: env['PROPOSE_SUPABASE_URL'],
    supabaseKey: env['PROPOSE_SUPABASE_KEY'],
    tenantId: env['PROPOSE_TENANT_ID'] ?? 'default',
    companyName: env['PROPOSE_COMPANY_NAME'] ?? 'My Company',
    companyDescription: env['PROPOSE_COMPANY_DESCRIPTION'],
    slackWebhookUrl: env['PROPOSE_SLACK_WEBHOOK_URL'],
    defaultCurrency: env['PROPOSE_DEFAULT_CURRENCY'] ?? 'USD',
    expiryDays: env['PROPOSE_EXPIRY_DAYS'] ?? '30',
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new ProposeError(
      `Invalid configuration:\n${issues.join('\n')}`,
      'CONFIG_ERROR',
      500,
    );
  }

  logger.debug('Configuration loaded successfully');
  return result.data;
}

export { configSchema };
