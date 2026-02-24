import { PLUGIN_ID, PLUGIN_NAME } from './core/plugin-id.js';
import { loadConfig } from './core/config/loader.js';
import { createToolDefinitions } from './core/tools/definitions.js';
import { toTypeBoxSchema } from './adapters/typebox-schema.js';
import type { PluginConfig } from './core/types/config.js';

export function getOpenClawManifest(overrides?: Partial<PluginConfig>) {
  const config = loadConfig(overrides);
  const tools = createToolDefinitions(config);

  return {
    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    version: '1.0.0',
    description: 'AI-powered ATS & hiring pipeline manager',
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: toTypeBoxSchema(tool.params),
      execute: tool.execute,
    })),
  };
}
