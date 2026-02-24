import { z } from 'zod';
import type { ToolParamDef } from '../core/tools/types.js';

export function toZodSchema(params: Record<string, ToolParamDef>): z.ZodType {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, def] of Object.entries(params)) {
    let schema: z.ZodTypeAny;

    switch (def.type) {
      case 'string':
        schema = def.enum ? z.enum(def.enum as [string, ...string[]]) : z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'array':
        schema =
          def.items?.type === 'number' ? z.array(z.number()) : z.array(z.string());
        break;
      default:
        schema = z.unknown();
    }

    if (def.default !== undefined) {
      schema = schema.default(def.default);
    } else if (!def.required) {
      schema = schema.optional();
    }

    shape[key] = schema.describe(def.description);
  }

  return z.object(shape);
}
