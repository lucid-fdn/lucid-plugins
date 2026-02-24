import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { ensureTenant } from './core/db/tenants.js';
import { createFetcherRegistry } from './core/fetchers/index.js';
import { createTransformerRegistry } from './core/content/index.js';
import { createPublisherRegistry } from './core/publishers/index.js';
import { createAllTools } from './core/tools/index.js';
import { registerAllCommands } from './core/commands/index.js';
import { startScheduler, stopScheduler } from './core/services/index.js';
import { toTypeBoxSchema } from './adapters/typebox-schema.js';
import { log } from './core/utils/logger.js';
import { PLUGIN_NAME } from './core/plugin-id.js';

export default function register(api: any): void {
  log.info(`Registering ${PLUGIN_NAME} plugin...`);

  const rawConfig = api.config ?? {};
  const config = loadConfig(rawConfig);

  if (!config.supabaseUrl || !config.supabaseKey) {
    log.warn('Supabase not configured — plugin will operate in limited mode');
  } else {
    initSupabase(config.supabaseUrl, config.supabaseKey);
    ensureTenant(config.tenantId).catch((err) => {
      log.error('Failed to ensure tenant:', err);
    });
  }

  const fetcherRegistry = createFetcherRegistry(config);
  const transformerRegistry = createTransformerRegistry();
  const publisherRegistry = createPublisherRegistry(config, api);

  log.info(`Fetchers: ${[...fetcherRegistry.keys()].join(', ') || 'none'}`);
  log.info(`Publishers: ${[...publisherRegistry.keys()].join(', ') || 'none'}`);

  // Register tools via TypeBox adapter
  const tools = createAllTools({ config, fetcherRegistry, publisherRegistry, transformerRegistry });
  for (const tool of tools) {
    api.registerTool(tool.name, {
      description: tool.description,
      parameters: toTypeBoxSchema(tool.params),
      execute: tool.execute,
    });
  }

  // Register commands
  registerAllCommands(api, { config, fetcherRegistry, publisherRegistry });

  // Register scheduler
  api.registerService({
    id: 'veille-scheduler',
    start: () => {
      startScheduler({
        config,
        fetcherRegistry,
        onFetch: async () => { log.info('Scheduler: Running fetch job'); },
        onDailyDigest: async () => { log.info('Scheduler: Running daily digest job'); },
        onWeeklyDigest: async () => { log.info('Scheduler: Running weekly digest job'); },
      });
    },
    stop: () => { stopScheduler(); },
  });

  log.info(`${PLUGIN_NAME} plugin registered successfully`);
}
