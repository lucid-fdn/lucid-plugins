import { describe, it, expect } from 'vitest';
import { toTypeBoxSchema } from '../../src/adapters/typebox-schema.js';
import type { ToolParamDef } from '../../src/core/tools/types.js';

describe('toTypeBoxSchema', () => {
  it('creates a JSON schema structure', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema['type']).toBe('object');
    expect(schema['required']).toEqual(['name']);
    expect(schema['properties']).toBeDefined();
  });

  it('includes description in properties', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'The name', required: true },
    };
    const schema = toTypeBoxSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['name']!['description']).toBe('The name');
  });

  it('includes enum values', () => {
    const params: Record<string, ToolParamDef> = {
      status: { type: 'string', description: 'Status', required: true, enum: ['a', 'b'] },
    };
    const schema = toTypeBoxSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['status']!['enum']).toEqual(['a', 'b']);
  });

  it('includes default values', () => {
    const params: Record<string, ToolParamDef> = {
      limit: { type: 'number', description: 'Limit', default: 50 },
    };
    const schema = toTypeBoxSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['limit']!['default']).toBe(50);
  });

  it('omits required when no required params', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', description: 'Label' },
    };
    const schema = toTypeBoxSchema(params);
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
    const schema = toTypeBoxSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const nested = props['config']!['properties'] as Record<string, unknown>;
    expect(nested['type']).toBe('object');
  });

  it('handles items in arrays', () => {
    const params: Record<string, ToolParamDef> = {
      tags: {
        type: 'array',
        description: 'Tags',
        items: { type: 'string', description: 'Tag' },
      },
    };
    const schema = toTypeBoxSchema(params);
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['tags']!['items']).toEqual({ type: 'string' });
  });

  it('handles empty params', () => {
    const schema = toTypeBoxSchema({});
    expect(schema['type']).toBe('object');
    expect(schema['properties']).toEqual({});
  });
});
