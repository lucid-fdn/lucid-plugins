import { z } from 'zod';

/** Definition for a single tool parameter */
export interface ToolParamDef {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: readonly string[];
  default?: unknown;
  items?: ToolParamDef;
  properties?: Record<string, ToolParamDef>;
}

/** Full tool definition including handler */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParamDef>;
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

/** Result returned from a tool invocation */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Convert tool parameters to a Zod schema */
export function toolParamsToZodSchema(
  params: Record<string, ToolParamDef>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, def] of Object.entries(params)) {
    let fieldSchema: z.ZodTypeAny;

    switch (def.type) {
      case 'string':
        fieldSchema = def.enum ? z.enum(def.enum as [string, ...string[]]) : z.string();
        break;
      case 'number':
        fieldSchema = z.number();
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'object':
        fieldSchema = z.record(z.unknown());
        break;
      case 'array':
        fieldSchema = z.array(z.unknown());
        break;
      default:
        fieldSchema = z.unknown();
    }

    if (def.default !== undefined) {
      fieldSchema = fieldSchema.default(def.default);
    }

    if (!def.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[key] = fieldSchema;
  }

  return z.object(shape);
}

/** Convert ToolParamDef to JSON Schema for MCP */
export function toolParamsToJsonSchema(
  params: Record<string, ToolParamDef>,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, def] of Object.entries(params)) {
    const prop: Record<string, unknown> = {
      type: def.type,
      description: def.description,
    };

    if (def.enum) {
      prop['enum'] = [...def.enum];
    }

    if (def.default !== undefined) {
      prop['default'] = def.default;
    }

    if (def.items) {
      prop['items'] = { type: def.items.type, description: def.items.description };
    }

    if (def.properties) {
      prop['properties'] = toolParamsToJsonSchema(def.properties);
    }

    properties[key] = prop;

    if (def.required) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}
