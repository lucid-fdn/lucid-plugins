// ---------------------------------------------------------------------------
// google-analytics.ts -- Google Analytics 4 Data API provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { MetricDataPoint, ActiveUserData, DateRange } from '../types/provider.js';
import type { MetricDefinition } from '../types/database.js';
import { log } from '../utils/logger.js';

export class GoogleAnalyticsProvider extends BaseProvider {
  name = 'google-analytics';
  private propertyId: string | undefined;
  private credentials: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 2, minTime: 500 });
    this.propertyId = config.gaPropertyId;
    this.credentials = config.gaCredentials;
  }

  isConfigured(): boolean {
    return !!(this.propertyId && this.credentials);
  }

  private async getAccessToken(): Promise<string> {
    // In production, this would use Google's OAuth2 JWT flow
    // with the service account credentials to get an access token
    const creds = JSON.parse(this.credentials ?? '{}');
    log.debug(`GA4: Using service account ${creds.client_email ?? 'unknown'}`);
    // Simplified: return a placeholder that would be replaced with real JWT logic
    return creds.access_token ?? 'token';
  }

  async queryMetric(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]> {
    return this.scheduleWithRetry(async () => {
      const token = await this.getAccessToken();
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`;

      const data = await this.fetchJson<{
        rows?: Array<{
          dimensionValues: Array<{ value: string }>;
          metricValues: Array<{ value: string }>;
        }>;
      }>(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period.start, endDate: period.end }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: metric.event_name }],
        }),
      });

      return (data.rows ?? []).map((row) => ({
        timestamp: row.dimensionValues[0]?.value ?? '',
        value: parseFloat(row.metricValues[0]?.value ?? '0'),
        label: metric.name,
      }));
    });
  }

  async getActiveUsers(period: DateRange): Promise<ActiveUserData> {
    return this.scheduleWithRetry(async () => {
      const token = await this.getAccessToken();
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runRealtimeReport`;

      const data = await this.fetchJson<{
        rows?: Array<{ metricValues: Array<{ value: string }> }>;
      }>(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }],
        }),
      });

      const count = parseInt(data.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10);

      return {
        period: `${period.start} to ${period.end}`,
        count,
        previous_count: 0,
        growth_rate: 0,
      };
    });
  }
}
