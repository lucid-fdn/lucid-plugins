import { WebClient } from '@slack/web-api';
import { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
import { logger } from '../../core/utils/logger.js';

export class SlackProvider extends BaseProvider {
  private client: WebClient;

  constructor(token: string) {
    super('slack', 5, 200);
    this.client = new WebClient(token);
  }

  async isConnected(): Promise<boolean> {
    try {
      const result = await this.rateLimited(() => this.client.auth.test());
      return result.ok === true;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<ProviderSearchResult[]> {
    try {
      const result = await this.rateLimited(() =>
        this.client.search.messages({ query, count: 20 }),
      );

      const matches = (result.messages as Record<string, unknown>)?.['matches'] as Array<Record<string, unknown>> ?? [];
      return matches.map((msg) => ({
        id: (msg['ts'] as string) ?? '',
        title: ((msg['text'] as string) ?? '').slice(0, 100),
        platform: 'slack' as const,
        entity_type: 'message',
        updated_at: msg['ts'] as string | undefined,
      }));
    } catch (error) {
      this.handleError('Search failed', error);
    }
  }

  async getEntity(id: string): Promise<Record<string, unknown> | null> {
    try {
      // id should be in format "channel:ts"
      const [channel, ts] = id.split(':');
      if (!channel || !ts) return null;

      const result = await this.rateLimited(() =>
        this.client.conversations.history({ channel, latest: ts, limit: 1, inclusive: true }),
      );

      const messages = (result.messages ?? []) as Array<Record<string, unknown>>;
      return messages[0] ?? null;
    } catch {
      return null;
    }
  }

  async createTask(task: Partial<ProviderTask>): Promise<ProviderTask> {
    // Slack doesn't have native tasks; post a message instead
    logger.warn('Slack does not support native tasks; posting message instead');
    return {
      id: '',
      title: task.title ?? '',
      description: task.description,
    };
  }

  async sendNotification(target: string, message: string): Promise<boolean> {
    try {
      const result = await this.rateLimited(() =>
        this.client.chat.postMessage({
          channel: target,
          text: message,
        }),
      );
      logger.info('Sent Slack notification', { channel: target, ts: result.ts });
      return result.ok === true;
    } catch (error) {
      logger.error('Failed to send Slack notification', { error: String(error) });
      return false;
    }
  }

  async listChannels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const result = await this.rateLimited(() =>
        this.client.conversations.list({ types: 'public_channel', limit: 100 }),
      );
      return (result.channels ?? []).map((ch) => ({
        id: ch.id ?? '',
        name: ch.name ?? '',
      }));
    } catch (error) {
      this.handleError('Failed to list channels', error);
    }
  }
}
