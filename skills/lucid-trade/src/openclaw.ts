// ---------------------------------------------------------------------------
// openclaw.ts -- OpenClaw plugin registration for Lucid Trade
// ---------------------------------------------------------------------------

import { loadConfig } from './config.js';
import { AdapterRegistry } from './adapters/registry.js';
import { createAllTools } from './tools/index.js';
import { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from './plugin-id.js';
import { log } from './utils/logger.js';

export default function register(api: any): void {
  const config = loadConfig();
  log.setLevel(config.logLevel);

  const registry = new AdapterRegistry();

  const tools = createAllTools({ config, registry });

  for (const tool of tools) {
    api.registerTool({
      id: `${PLUGIN_ID}:${tool.name}`,
      name: tool.name,
      description: tool.description,
      parameters: tool.params,
      execute: async (params: Record<string, unknown>) => {
        return await tool.execute(params);
      },
    });
  }

  log.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} registered (${tools.length} tools)`);
}
