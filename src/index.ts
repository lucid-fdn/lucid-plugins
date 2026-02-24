// Core exports
export { PLUGIN_ID, PLUGIN_NAME } from './core/plugin-id.js';
export * from './core/types/index.js';
export * from './core/utils/index.js';
export * from './core/analysis/index.js';
export * from './core/tools/index.js';

// Adapter exports
export { createMcpServer, registerTools } from './adapters/mcp-adapter.js';
export { createOpenClawPlugin, type OpenClawPlugin } from './adapters/openclaw-adapter.js';

// Server export
export { createProposeServer } from './mcp.js';
