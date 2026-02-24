import { Type, type TSchema } from '@sinclair/typebox';
import type { ToolParamDef } from '../core/tools/types.js';

export function toTypeBoxSchema(params: Record<string, ToolParamDef>): TSchema {
  const properties: Record<string, TSchema> = {};
  const required: string[] = [];

  for (const [key, def] of Object.entries(params)) {
    let schema: TSchema;

    switch (def.type) {
      case 'string':
        schema = def.enum
          ? Type.Union(
              (def.enum as readonly string[]).map((v) => Type.Literal(v)),
              { description: def.description },
            )
          : Type.String({ description: def.description });
        break;
      case 'number':
        schema = Type.Number({ description: def.description });
        break;
      case 'boolean':
        schema = Type.Boolean({ description: def.description });
        break;
      case 'array':
        schema =
          def.items?.type === 'number'
            ? Type.Array(Type.Number(), { description: def.description })
            : Type.Array(Type.String(), { description: def.description });
        break;
      default:
        schema = Type.Unknown({ description: def.description });
    }

    if (def.default !== undefined) {
      schema = { ...schema, default: def.default };
    }

    properties[key] = schema;

    if (def.required) {
      required.push(key);
    }
  }

  return Type.Object(properties, { required });
}
