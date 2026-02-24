import type { ToolParamDef } from '../core/tools/types.js';

/**
 * Convert tool param definitions to a plain JSON-Schema-like object.
 * This avoids a hard dependency on @sinclair/typebox for Bridge.
 */
export function toTypeBoxSchema(params: Record<string, ToolParamDef>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, def] of Object.entries(params)) {
    const prop: Record<string, unknown> = {
      type: def.type,
    };

    if (def.description) {
      prop['description'] = def.description;
    }

    if (def.enum) {
      prop['enum'] = [...def.enum];
    }

    if (def.default !== undefined) {
      prop['default'] = def.default;
    }

    if (def.items) {
      prop['items'] = { type: def.items.type };
    }

    if (def.properties) {
      prop['properties'] = toTypeBoxSchema(def.properties);
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
