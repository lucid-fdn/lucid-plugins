import type { ToolDefinition, ToolResult } from '../core/tools/types.js';
import { logger } from '../core/utils/logger.js';
import { BridgeError } from '../core/utils/errors.js';

export interface OpenClawToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export function toOpenClawTools(tools: ToolDefinition[]): OpenClawToolSpec[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: Object.fromEntries(
      Object.entries(tool.parameters).map(([key, def]) => [
        key,
        {
          type: def.type,
          description: def.description,
          required: def.required ?? false,
          ...(def.enum ? { enum: [...def.enum] } : {}),
          ...(def.default !== undefined ? { default: def.default } : {}),
        },
      ]),
    ),
    execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        return await tool.handler(params);
      } catch (error) {
        const message = error instanceof BridgeError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
        logger.error(`OpenClaw tool ${tool.name} failed: ${message}`);
        return { success: false, error: message };
      }
    },
  }));
}
