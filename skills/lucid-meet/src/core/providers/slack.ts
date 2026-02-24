// ---------------------------------------------------------------------------
// slack.ts -- Slack API integration for sending summaries
// ---------------------------------------------------------------------------

import type { NotificationProvider } from '../types/provider.js';
import { ProviderError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export class SlackProvider implements NotificationProvider {
  readonly name = 'slack';
  private botToken: string | undefined;
  private webhookUrl: string | undefined;

  constructor(botToken?: string, webhookUrl?: string) {
    this.botToken = botToken;
    this.webhookUrl = webhookUrl;
  }

  isConfigured(): boolean {
    return !!(this.botToken || this.webhookUrl);
  }

  async sendMessage(channel: string, message: string): Promise<void> {
    if (this.webhookUrl) {
      await this.sendViaWebhook(message);
      return;
    }

    if (!this.botToken) {
      throw new ProviderError(this.name, 'Slack bot token or webhook URL not configured');
    }

    log.debug(`Sending Slack message to ${channel}`);

    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({ channel, text: message }),
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        throw new ProviderError(this.name, `Slack API error: ${data.error ?? 'unknown'}`);
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Failed to send message: ${msg}`);
    }
  }

  async createChannel(name: string): Promise<string> {
    if (!this.botToken) {
      throw new ProviderError(this.name, 'Slack bot token not configured');
    }

    log.debug(`Creating Slack channel: ${name}`);

    try {
      const res = await fetch('https://slack.com/api/conversations.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as { ok: boolean; channel?: { id: string }; error?: string };
      if (!data.ok) {
        throw new ProviderError(this.name, `Slack API error: ${data.error ?? 'unknown'}`);
      }

      return data.channel?.id ?? '';
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Failed to create channel: ${msg}`);
    }
  }

  private async sendViaWebhook(message: string): Promise<void> {
    if (!this.webhookUrl) return;

    log.debug('Sending Slack message via webhook');

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `Webhook HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Webhook failed: ${msg}`);
    }
  }
}
