import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { ensureTenant } from './core/db/tenants.js';
import { createFetcherRegistry } from './core/fetchers/index.js';
import { createTransformerRegistry } from './core/content/index.js';
import { createPublisherRegistry } from './core/publishers/index.js';
import { createAllTools } from './core/tools/index.js';
import { toZodSchema } from './adapters/zod-schema.js';
import { log } from './core/utils/logger.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';

export function createVeilleServer(env: Record<string, string | undefined> = process.env) {
  const server = new McpServer({
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
  });

  const config = loadConfig({
    supabaseUrl: env.VEILLE_SUPABASE_URL,
    supabaseKey: env.VEILLE_SUPABASE_KEY,
    tenantId: env.VEILLE_TENANT_ID ?? 'default',
    fetchSchedule: env.VEILLE_FETCH_SCHEDULE,
    digestSchedule: env.VEILLE_DIGEST_SCHEDULE,
    weeklyDigestSchedule: env.VEILLE_WEEKLY_DIGEST_SCHEDULE,
  });

  if (config.supabaseUrl && config.supabaseKey) {
    initSupabase(config.supabaseUrl, config.supabaseKey);
    ensureTenant(config.tenantId).catch((err) => {
      log.error('Failed to ensure tenant:', err);
    });
  } else {
    log.warn('Supabase not configured — MCP server in limited mode');
  }

  const fetcherRegistry = createFetcherRegistry(config);
  const transformerRegistry = createTransformerRegistry();
  const publisherRegistry = createPublisherRegistry(config);

  const tools = createAllTools({ config, fetcherRegistry, publisherRegistry, transformerRegistry });

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      toZodSchema(tool.params).shape,
      async (params: Record<string, unknown>) => {
        const result = await tool.execute(params);
        return { content: [{ type: 'text' as const, text: result }] };
      },
    );
  }

  log.info(`${PLUGIN_NAME} MCP server created with ${tools.length} tools`);

  return server;
}
