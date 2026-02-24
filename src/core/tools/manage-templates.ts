import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { TEMPLATE_CATEGORIES, PRICING_MODELS, SECTION_TYPES } from '../types/common.js';
import { getSupabaseClient } from '../db/client.js';
import { createTemplate, getTemplate, listTemplates, updateTemplate } from '../db/templates.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const sectionSchema = z.object({
  section_type: z.enum(SECTION_TYPES),
  title: z.string(),
  content: z.string(),
  sort_order: z.number(),
  is_included: z.boolean().default(true),
});

const inputSchema = z.object({
  action: z.enum(['create', 'list', 'get', 'update']),
  template_id: z.string().optional(),
  name: z.string().optional(),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  description: z.string().optional(),
  sections: z.array(sectionSchema).optional(),
  default_pricing: z.enum(PRICING_MODELS).optional(),
  is_active: z.boolean().optional(),
});

export const manageTemplatesTool: ToolDefinition = {
  name: 'propose_manage_templates',
  description:
    'Manage proposal templates: create, list, get, or update templates. Templates provide reusable section structures for consistent proposal creation.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const config = loadConfig();
      const db = getSupabaseClient();

      switch (input.action) {
        case 'create': {
          if (!input.name) return toolError('Name is required to create a template');
          if (!input.category) return toolError('Category is required to create a template');

          const template = await createTemplate(db, {
            tenant_id: config.tenantId,
            name: input.name,
            category: input.category,
            description: input.description ?? '',
            sections: input.sections ?? [],
            default_pricing: input.default_pricing ?? 'fixed',
          });

          return toolResult({
            message: `Template "${template.name}" created successfully`,
            template,
          });
        }

        case 'list': {
          const templates = await listTemplates(db, config.tenantId, {
            category: input.category,
          });

          return toolResult({
            message: `Found ${templates.length} template(s)`,
            templates,
          });
        }

        case 'get': {
          if (!input.template_id) return toolError('template_id is required for get action');

          const template = await getTemplate(db, input.template_id);

          return toolResult({
            message: `Template "${template.name}" retrieved`,
            template,
          });
        }

        case 'update': {
          if (!input.template_id) return toolError('template_id is required for update action');

          const updates: Record<string, unknown> = {};
          if (input.name !== undefined) updates['name'] = input.name;
          if (input.category !== undefined) updates['category'] = input.category;
          if (input.description !== undefined) updates['description'] = input.description;
          if (input.sections !== undefined) updates['sections'] = input.sections;
          if (input.default_pricing !== undefined) updates['default_pricing'] = input.default_pricing;
          if (input.is_active !== undefined) updates['is_active'] = input.is_active;

          const template = await updateTemplate(db, input.template_id, updates);

          return toolResult({
            message: `Template "${template.name}" updated successfully`,
            template,
          });
        }

        default:
          return toolError(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to manage templates');
      return toolError(wrapped.message);
    }
  },
};
