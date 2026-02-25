// ---------------------------------------------------------------------------
// tools/index.ts -- Tool registry for Lucid Trade MCP
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../config.js';
import type { AdapterRegistry } from '../adapters/registry.js';

// -- Tool type definitions ---------------------------------------------------

export type ParamType = 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';

export interface ToolParamDef {
  type: ParamType;
  required?: boolean;
  description?: string;
  values?: string[];
  min?: number;
  max?: number;
  default?: unknown;
  properties?: Record<string, ToolParamDef>;
  items?: ToolParamDef;
}

export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  params: Record<string, ToolParamDef>;
  execute: (params: T) => Promise<string>;
}

// -- Tool dependencies -------------------------------------------------------

export interface ToolDependencies {
  config: PluginConfig;
  registry: AdapterRegistry;
}

// -- Create all tools --------------------------------------------------------

/**
 * Instantiate every tool the trade MCP exposes.
 * Returns an empty array for now — tools will be added in Phase 2/3.
 */
export function createAllTools(_deps: ToolDependencies): ToolDefinition[] {
  return [];
}
