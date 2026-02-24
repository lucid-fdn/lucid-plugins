import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (params: unknown) => Promise<ToolResult>;
}

export interface ToolResult {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export function toolResult(data: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function toolError(message: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message }),
      },
    ],
    isError: true,
  };
}
