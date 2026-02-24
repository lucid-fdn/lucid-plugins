import { LinearClient } from '@linear/sdk';
import { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
import { logger } from '../../core/utils/logger.js';

export class LinearProvider extends BaseProvider {
  private client: LinearClient;

  constructor(apiKey: string) {
    super('linear', 10, 100);
    this.client = new LinearClient({ apiKey });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.rateLimited(() => this.client.viewer);
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<ProviderSearchResult[]> {
    try {
      const issues = await this.rateLimited(() =>
        this.client.issueSearch({ query, first: 20 }),
      );

      const nodes = issues.nodes ?? [];
      return nodes.map((issue) => ({
        id: issue.id,
        title: issue.title,
        url: issue.url,
        description: issue.description ?? undefined,
        platform: 'linear' as const,
        entity_type: 'issue',
        updated_at: issue.updatedAt?.toISOString(),
      }));
    } catch (error) {
      this.handleError('Search failed', error);
    }
  }

  async getEntity(id: string): Promise<Record<string, unknown> | null> {
    try {
      const issue = await this.rateLimited(() => this.client.issue(id));
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        url: issue.url,
        createdAt: issue.createdAt?.toISOString(),
        updatedAt: issue.updatedAt?.toISOString(),
      };
    } catch {
      return null;
    }
  }

  async createTask(task: Partial<ProviderTask>): Promise<ProviderTask> {
    try {
      // Need a team ID; get the first team
      const teams = await this.rateLimited(() => this.client.teams());
      const team = teams.nodes[0];
      if (!team) {
        this.handleError('No teams found in Linear workspace');
      }

      const result = await this.rateLimited(() =>
        this.client.createIssue({
          teamId: team.id,
          title: task.title ?? 'Untitled Task',
          description: task.description,
        }),
      );

      const issue = await result.issue;

      logger.info('Created Linear issue', { id: issue?.id });

      return {
        id: issue?.id ?? '',
        title: issue?.title ?? task.title ?? '',
        description: issue?.description ?? task.description,
        url: issue?.url,
        created_at: issue?.createdAt?.toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No teams found')) throw error;
      this.handleError('Failed to create issue', error);
    }
  }

  async sendNotification(_target: string, _message: string): Promise<boolean> {
    logger.warn('Linear does not support direct notifications');
    return false;
  }
}
