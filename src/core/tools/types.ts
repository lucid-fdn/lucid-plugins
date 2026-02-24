export interface ToolParamDef {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  enum?: readonly string[];
  items?: { type: 'string' | 'number' };
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  params: Record<string, ToolParamDef>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}
