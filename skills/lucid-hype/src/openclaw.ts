import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { createAllTools } from './core/tools/index.js';
import { startScheduler, stopScheduler } from './core/services/index.js';
import { toTypeBoxSchema } from './adapters/typebox-schema.js';
import { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';
import { log } from './core/utils/logger.js';

export default function register(api: any): void {
  const config = loadConfig();
  initSupabase(config.supabaseUrl, config.supabaseKey);

  const tools = createAllTools({ config });

  for (const tool of tools) {
    api.registerTool({
      id: `${PLUGIN_ID}:${tool.name}`,
      name: tool.name,
      description: tool.description,
      parameters: toTypeBoxSchema(tool.params),
      execute: async (params: Record<string, unknown>) => {
        return await tool.execute(params);
      },
    });
  }

  api.registerService({
    id: `${PLUGIN_ID}:scheduler`,
    name: `${PLUGIN_NAME} Scheduler`,
    start: () => startScheduler({ config }),
    stop: () => stopScheduler(),
  });

  log.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} registered (${tools.length} tools)`);
}
