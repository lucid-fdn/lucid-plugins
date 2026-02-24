import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition } from '../core/tools/types.js';
import { toolParamsToJsonSchema } from '../core/tools/types.js';
import { logger } from '../core/utils/logger.js';
import { BridgeError } from '../core/utils/errors.js';

export function registerToolsOnServer(server: Server, tools: ToolDefinition[]): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: toolParamsToJsonSchema(tool.parameters),
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools.find((t) => t.name === name);

    if (!tool) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      logger.info(`Invoking tool: ${name}`);
      const result = await tool.handler((args ?? {}) as Record<string, unknown>);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      const message = error instanceof BridgeError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);

      logger.error(`Tool ${name} failed: ${message}`);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: message }) }],
        isError: true,
      };
    }
  });
}
