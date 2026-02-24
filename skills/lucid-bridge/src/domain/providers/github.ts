import { Octokit } from '@octokit/rest';
import { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
import { logger } from '../../core/utils/logger.js';

export class GitHubProvider extends BaseProvider {
  private client: Octokit;

  constructor(token: string) {
    super('github', 10, 100);
    this.client = new Octokit({ auth: token });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.rateLimited(() => this.client.users.getAuthenticated());
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<ProviderSearchResult[]> {
    try {
      const result = await this.rateLimited(() =>
        this.client.search.issuesAndPullRequests({
          q: query,
          per_page: 20,
        }),
      );

      return result.data.items.map((item) => ({
        id: String(item.id),
        title: item.title,
        url: item.html_url,
        description: item.body?.slice(0, 200) ?? undefined,
        platform: 'github' as const,
        entity_type: item.pull_request ? 'pr' : 'issue',
        updated_at: item.updated_at ?? undefined,
      }));
    } catch (error) {
      this.handleError('Search failed', error);
    }
  }

  async getEntity(id: string): Promise<Record<string, unknown> | null> {
    try {
      // id format: "owner/repo#number"
      const match = id.match(/^(.+?)\/(.+?)#(\d+)$/);
      if (!match) return null;
      const [, owner, repo, number] = match;

      const result = await this.rateLimited(() =>
        this.client.issues.get({
          owner: owner!,
          repo: repo!,
          issue_number: parseInt(number!, 10),
        }),
      );

      return result.data as unknown as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async createTask(task: Partial<ProviderTask>): Promise<ProviderTask> {
    try {
      // Requires owner/repo in task metadata
      const owner = (task as Record<string, unknown>)['owner'] as string ?? '';
      const repo = (task as Record<string, unknown>)['repo'] as string ?? '';

      if (!owner || !repo) {
        this.handleError('owner and repo are required to create a GitHub issue');
      }

      const result = await this.rateLimited(() =>
        this.client.issues.create({
          owner,
          repo,
          title: task.title ?? 'Untitled Issue',
          body: task.description,
          labels: task.labels,
        }),
      );

      logger.info('Created GitHub issue', { id: result.data.id });

      return {
        id: String(result.data.id),
        title: result.data.title,
        description: result.data.body ?? undefined,
        url: result.data.html_url,
        created_at: result.data.created_at,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) throw error;
      this.handleError('Failed to create issue', error);
    }
  }

  async sendNotification(_target: string, _message: string): Promise<boolean> {
    logger.warn('GitHub does not support direct notifications');
    return false;
  }
}
