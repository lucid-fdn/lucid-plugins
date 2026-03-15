// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

import type { Severity } from './common.js';

/** Configuration for the @lucid-fdn/compete plugin. */
export interface PluginConfig {
  /** Supabase project URL. */
  supabaseUrl: string;

  /** Supabase anon / service-role key. */
  supabaseKey: string;

  /** Tenant identifier for multi-tenant isolation. */
  tenantId: string;

  /**
   * Cron expression controlling how often monitors fetch new data.
   * @default "0 *\/6 * * *"   (every 6 hours)
   */
  fetchSchedule: string;

  /**
   * Cron expression controlling when weekly/monthly briefs are generated.
   * @default "0 9 * * 1"   (Monday 09:00 UTC)
   */
  briefSchedule: string;

  // -- Optional provider tokens ------------------------------------------------

  /** GitHub personal-access or fine-grained token for GitHub monitors. */
  githubToken?: string;

  /** Twitter / X API v2 bearer token. */
  twitterBearerToken?: string;

  // -- Alert delivery ----------------------------------------------------------

  /** Slack incoming-webhook URL for alert delivery. */
  slackWebhookUrl?: string;

  /** Generic webhook URL for alert delivery. */
  alertWebhookUrl?: string;

  /** Email address to receive alert notifications. */
  alertEmail?: string;

  // -- SMTP (required when alertEmail is set) -----------------------------------

  /** SMTP server hostname. */
  smtpHost?: string;

  /** SMTP server port. */
  smtpPort?: number;

  /** SMTP authentication username. */
  smtpUser?: string;

  /** SMTP authentication password. */
  smtpPass?: string;

  /**
   * Minimum signal severity that triggers an alert.
   * @default "high"
   */
  alertSeverity: Severity;
}
