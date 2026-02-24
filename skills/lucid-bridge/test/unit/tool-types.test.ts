import { describe, it, expect } from 'vitest';
import { toolParamsToZodSchema, toolParamsToJsonSchema } from '../../src/core/tools/types.js';
import type { ToolParamDef } from '../../src/core/tools/types.js';

describe('toolParamsToZodSchema', () => {
  it('creates schema for string params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'A name', required: true },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({ name: 'test' });
    expect(result.success).toBe(true);
  });

  it('creates schema for number params', () => {
    const params: Record<string, ToolParamDef> = {
      count: { type: 'number', description: 'A count', required: true },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({ count: 42 });
    expect(result.success).toBe(true);
  });

  it('creates schema for boolean params', () => {
    const params: Record<string, ToolParamDef> = {
      active: { type: 'boolean', description: 'Is active', required: true },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({ active: true });
    expect(result.success).toBe(true);
  });

  it('creates schema with enum', () => {
    const params: Record<string, ToolParamDef> = {
      status: { type: 'string', description: 'Status', required: true, enum: ['active', 'inactive'] },
    };
    const schema = toolParamsToZodSchema(params);
    expect(schema.safeParse({ status: 'active' }).success).toBe(true);
    expect(schema.safeParse({ status: 'other' }).success).toBe(false);
  });

  it('handles optional params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
      label: { type: 'string', description: 'Label', required: false },
    };
    const schema = toolParamsToZodSchema(params);
    expect(schema.safeParse({ name: 'test' }).success).toBe(true);
  });

  it('handles default values', () => {
    const params: Record<string, ToolParamDef> = {
      limit: { type: 'number', description: 'Limit', default: 50 },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('handles object params', () => {
    const params: Record<string, ToolParamDef> = {
      data: { type: 'object', description: 'Data object', required: true },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({ data: { key: 'value' } });
    expect(result.success).toBe(true);
  });

  it('handles array params', () => {
    const params: Record<string, ToolParamDef> = {
      items: { type: 'array', description: 'Item list', required: true },
    };
    const schema = toolParamsToZodSchema(params);
    const result = schema.safeParse({ items: [1, 2, 3] });
    expect(result.success).toBe(true);
  });
});

describe('toolParamsToJsonSchema', () => {
  it('creates JSON schema for simple params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'A name', required: true },
      count: { type: 'number', description: 'A count', required: false },
    };
    const schema = toolParamsToJsonSchema(params);
    expect(schema['type']).toBe('object');
    expect(schema['required']).toEqual(['name']);

    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['name']!['type']).toBe('string');
    expect(props['count']!['type']).toBe('number');
  });

  it('includes enum values', () => {
    const params: Record<string, ToolParamDef> = {
      status: { type: 'string', description: 'Status', required: true, enum: ['a', 'b'] },
    };
    const schema = toolParamsToJsonSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['status']!['enum']).toEqual(['a', 'b']);
  });

  it('includes default values', () => {
    const params: Record<string, ToolParamDef> = {
      limit: { type: 'number', description: 'Limit', default: 50 },
    };
    const schema = toolParamsToJsonSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['limit']!['default']).toBe(50);
  });

  it('omits required array when no required params', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', description: 'Label' },
    };
    const schema = toolParamsToJsonSchema(params);
    expect(schema['required']).toBeUndefined();
  });

  it('handles nested properties', () => {
    const params: Record<string, ToolParamDef> = {
      config: {
        type: 'object',
        description: 'Config',
        required: true,
        properties: {
          key: { type: 'string', description: 'Key', required: true },
        },
      },
    };
    const schema = toolParamsToJsonSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['config']!['properties']).toBeDefined();
  });

  it('handles array with items', () => {
    const params: Record<string, ToolParamDef> = {
      tags: {
        type: 'array',
        description: 'Tags',
        items: { type: 'string', description: 'Tag' },
      },
    };
    const schema = toolParamsToJsonSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['tags']!['items']).toEqual({ type: 'string', description: 'Tag' });
  });
});
