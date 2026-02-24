import { ALL_TOOLS } from '../core/tools/index.js';
import { PLUGIN_ID, PLUGIN_NAME } from '../core/plugin-id.js';
import { logger } from '../core/utils/logger.js';

export interface OpenClawPlugin {
  id: string;
  name: string;
  version: string;
  tools: Array<{
    name: string;
    description: string;
    handler: (params: unknown) => Promise<unknown>;
  }>;
}

/**
 * Create an OpenClaw-compatible plugin registration.
 */
export function createOpenClawPlugin(): OpenClawPlugin {
  logger.info(`Creating OpenClaw plugin: ${PLUGIN_NAME}`);

  return {
    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    version: '0.1.0',
    tools: ALL_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      handler: tool.handler,
    })),
  };
}
