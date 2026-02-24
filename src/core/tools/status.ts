import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { PLUGIN_ID, PLUGIN_NAME } from '../plugin-id.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({});

export const statusTool: ToolDefinition = {
  name: 'propose_status',
  description:
    'Check the health and configuration status of the Lucid Propose plugin. Returns plugin info, configuration state, and connectivity status.',
  inputSchema,
  handler: async (_params) => {
    try {
      let configOk = false;
      let configError: string | null = null;
      let tenantId = '';
      let companyName = '';

      try {
        const config = loadConfig();
        configOk = true;
        tenantId = config.tenantId;
        companyName = config.companyName;
      } catch (err) {
        configError = err instanceof Error ? err.message : 'Unknown config error';
      }

      return toolResult({
        plugin_id: PLUGIN_ID,
        plugin_name: PLUGIN_NAME,
        version: '0.1.0',
        status: configOk ? 'healthy' : 'degraded',
        configuration: {
          loaded: configOk,
          error: configError,
          tenant_id: tenantId,
          company_name: companyName,
        },
        tools_registered: 10,
        capabilities: [
          'proposal_creation',
          'rfp_analysis',
          'section_generation',
          'proposal_scoring',
          'template_management',
          'content_search',
          'pricing_calculation',
          'analytics',
          'proposal_comparison',
        ],
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to get status');
      return toolError(wrapped.message);
    }
  },
};
