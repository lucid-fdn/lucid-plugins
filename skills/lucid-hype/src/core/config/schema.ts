// ---------------------------------------------------------------------------
// schema.ts -- Zod schema for plugin config validation
// ---------------------------------------------------------------------------

import { z } from 'zod';

export const PluginConfigSchema = z.object({
  supabaseUrl: z.string().describe('Supabase project URL'),
  supabaseKey: z.string().describe('Supabase anon/service key'),
  tenantId: z.string().default('default').describe('Multi-tenancy ID'),
  twitterApiKey: z.string().optional().describe('Twitter API key'),
  twitterApiSecret: z.string().optional().describe('Twitter API secret'),
  linkedinAccessToken: z.string().optional().describe('LinkedIn access token'),
  redditClientId: z.string().optional().describe('Reddit client ID'),
  redditClientSecret: z.string().optional().describe('Reddit client secret'),
  tiktokAccessToken: z.string().optional().describe('TikTok access token'),
  youtubeApiKey: z.string().optional().describe('YouTube API key'),
  instagramAccessToken: z.string().optional().describe('Instagram access token'),
  productName: z.string().default('My Product').describe('Product name'),
  productDescription: z.string().default('').describe('Product description'),
  productUrl: z.string().default('').describe('Product URL'),
  slackWebhookUrl: z.string().optional().describe('Slack incoming webhook URL'),
  postSchedule: z.string().default('0 9,12,15,18 * * 1-5').describe('Cron for posting schedule'),
});

export type PluginConfigInput = z.infer<typeof PluginConfigSchema>;
