import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';

export interface ListTemplatesToolDeps {
  engine: EngineClient;
}

export function createListTemplatesTool(deps: ListTemplatesToolDeps): ToolDefinition {
  return {
    name: 'list_templates',
    description: 'List available video templates. Optionally filter by category.',
    params: {
      category: { type: 'enum', required: false, values: ['marketing', 'data-report', 'outreach', 'product', 'internal'], description: 'Filter by template category' },
    },
    async execute(params: Record<string, unknown>): Promise<string> {
      try {
        const templates = await deps.engine.listTemplates(params.category as string | undefined);
        if (templates.length === 0) return 'No templates found.';
        return JSON.stringify(templates, null, 2);
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
