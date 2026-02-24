// ---------------------------------------------------------------------------
// notion.ts -- Notion API integration for creating meeting notes pages
// ---------------------------------------------------------------------------

import type { NotesProvider } from '../types/provider.js';
import { ProviderError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export class NotionProvider implements NotesProvider {
  readonly name = 'notion';
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token;
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  async createPage(title: string, content: string, parentId?: string): Promise<string> {
    if (!this.token) {
      throw new ProviderError(this.name, 'Notion token not configured');
    }

    log.debug(`Creating Notion page: ${title}`);

    try {
      const parent = parentId
        ? { page_id: parentId }
        : { page_id: 'default' };

      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent,
          properties: {
            title: {
              title: [{ type: 'text', text: { content: title } }],
            },
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content } }],
              },
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as { id?: string };
      return data.id ?? '';
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Failed to create page: ${msg}`);
    }
  }
}
