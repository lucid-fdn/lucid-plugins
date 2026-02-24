import { z } from 'zod';
import type { ToolParamDef } from '../core/tools/types.js';

function paramToZod(def: ToolParamDef): z.ZodType {
  let schema: z.ZodType;

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
    case 'object':
      if (def.properties) {
        schema = toZodSchema(def.properties);
      } else {
        schema = z.record(z.string(), z.unknown());
      }
      break;
    case 'array':
      schema = z.array(def.items ? paramToZod(def.items) : z.unknown());
      break;
    default:
      schema = z.unknown();
  }

  if (def.description) {
    schema = schema.describe(def.description);
  }

  return schema;
}

export function toZodSchema(params: Record<string, ToolParamDef>): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, def] of Object.entries(params)) {
    const fieldSchema = paramToZod(def);
    shape[key] = def.required ? fieldSchema : fieldSchema.optional();
  }
  return z.object(shape);
}
