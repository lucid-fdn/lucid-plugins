import { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
import { logger } from '../../core/utils/logger.js';

interface JiraConfig {
  host: string;
  email: string;
  token: string;
}

export class JiraProvider extends BaseProvider {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: JiraConfig) {
    super('jira', 5, 200);
    this.config = config;
    this.baseUrl = `https://${config.host}/rest/api/3`;
    this.authHeader = `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`;
  }

  private async jiraFetch(path: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.rateLimited(() => this.jiraFetch('/myself'));
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string): Promise<ProviderSearchResult[]> {
    try {
      const jql = `text ~ "${query}" ORDER BY updated DESC`;
      const result = (await this.rateLimited(() =>
        this.jiraFetch(`/search?jql=${encodeURIComponent(jql)}&maxResults=20`),
      )) as Record<string, unknown>;

      const issues = (result['issues'] ?? []) as Array<Record<string, unknown>>;
      return issues.map((issue) => {
        const fields = (issue['fields'] ?? {}) as Record<string, unknown>;
        return {
          id: issue['key'] as string,
          title: fields['summary'] as string,
          url: `https://${this.config.host}/browse/${issue['key']}`,
          description: (fields['description'] as string)?.slice(0, 200),
          platform: 'jira' as const,
          entity_type: 'issue',
          updated_at: fields['updated'] as string | undefined,
        };
      });
    } catch (error) {
      this.handleError('Search failed', error);
    }
  }

  async getEntity(id: string): Promise<Record<string, unknown> | null> {
    try {
      const result = (await this.rateLimited(() =>
        this.jiraFetch(`/issue/${id}`),
      )) as Record<string, unknown>;
      return result;
    } catch {
      return null;
    }
  }

  async createTask(task: Partial<ProviderTask>): Promise<ProviderTask> {
    try {
      const projectKey = (task as Record<string, unknown>)['projectKey'] as string ?? '';
      if (!projectKey) {
        this.handleError('projectKey is required to create a Jira issue');
      }

      const result = (await this.rateLimited(() =>
        this.jiraFetch('/issue', {
          method: 'POST',
          body: JSON.stringify({
            fields: {
              project: { key: projectKey },
              summary: task.title ?? 'Untitled Issue',
              description: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: task.description ?? '' }],
                  },
                ],
              },
              issuetype: { name: 'Task' },
            },
          }),
        }),
      )) as Record<string, unknown>;

      logger.info('Created Jira issue', { key: result['key'] });

      return {
        id: result['key'] as string,
        title: task.title ?? 'Untitled Issue',
        description: task.description,
        url: `https://${this.config.host}/browse/${result['key']}`,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) throw error;
      this.handleError('Failed to create issue', error);
    }
  }

  async sendNotification(_target: string, _message: string): Promise<boolean> {
    logger.warn('Jira does not support direct notifications');
    return false;
  }
}
