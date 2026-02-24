import { Client as NotionClient } from '@notionhq/client';
import { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
import { logger } from '../../core/utils/logger.js';

export class NotionProvider extends BaseProvider {
  private client: NotionClient;

  constructor(token: string) {
    super('notion', 3, 334); // Notion rate limit: ~3 req/sec
    this.client = new NotionClient({ auth: token });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.rateLimited(() => this.client.users.me({}));
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<ProviderSearchResult[]> {
    try {
      const response = await this.rateLimited(() =>
        this.client.search({
          query,
          page_size: 20,
        }),
      );

      return response.results.map((result) => {
        const isPage = result.object === 'page';
        const page = result as Record<string, unknown>;
        const properties = (page['properties'] ?? {}) as Record<string, unknown>;
        const titleProp = Object.values(properties).find(
          (p) => (p as Record<string, unknown>)['type'] === 'title',
        ) as Record<string, unknown> | undefined;
        const titleArr = (titleProp?.['title'] ?? []) as Array<Record<string, unknown>>;
        const title = titleArr.map((t) => t['plain_text'] ?? '').join('') || 'Untitled';

        return {
          id: result.id,
          title,
          url: (page['url'] as string) ?? undefined,
          platform: 'notion' as const,
          entity_type: isPage ? 'page' : 'document',
          updated_at: (page['last_edited_time'] as string) ?? undefined,
        };
      });
    } catch (error) {
      this.handleError('Search failed', error);
    }
  }

  async getEntity(id: string): Promise<Record<string, unknown> | null> {
    try {
      const page = await this.rateLimited(() => this.client.pages.retrieve({ page_id: id }));
      return page as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async createTask(task: Partial<ProviderTask>): Promise<ProviderTask> {
    try {
      // Create a page in the default workspace
      const response = await this.rateLimited(() =>
        this.client.pages.create({
          parent: { page_id: task.id ?? '' },
          properties: {
            title: {
              title: [{ text: { content: task.title ?? 'Untitled Task' } }],
            },
          },
        }),
      );

      logger.info('Created Notion page', { id: response.id });

      return {
        id: response.id,
        title: task.title ?? 'Untitled Task',
        description: task.description,
        url: (response as Record<string, unknown>)['url'] as string | undefined,
        created_at: (response as Record<string, unknown>)['created_time'] as string | undefined,
      };
    } catch (error) {
      this.handleError('Failed to create task', error);
    }
  }

  async sendNotification(_target: string, _message: string): Promise<boolean> {
    // Notion doesn't support direct notifications; create a page comment instead
    logger.warn('Notion does not support direct notifications');
    return false;
  }

  async queryDatabase(databaseId: string, filter?: Record<string, unknown>): Promise<unknown[]> {
    try {
      const response = await this.rateLimited(() =>
        this.client.databases.query({
          database_id: databaseId,
          ...(filter ? { filter: filter as any } : {}),
        }),
      );
      return response.results;
    } catch (error) {
      this.handleError('Database query failed', error);
    }
  }
}
