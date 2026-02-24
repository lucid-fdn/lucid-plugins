import { describe, it, expect } from 'vitest';
import { toZodSchema } from '../../src/adapters/zod-schema.js';
import type { ToolParamDef } from '../../src/core/tools/types.js';

describe('toZodSchema', () => {
  it('creates a zod schema from simple params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ name: 'test' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('handles optional fields', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
      label: { type: 'string', description: 'Label' },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ name: 'test' }).success).toBe(true);
  });

  it('handles enum fields', () => {
    const params: Record<string, ToolParamDef> = {
      status: { type: 'string', description: 'Status', required: true, enum: ['active', 'inactive'] },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ status: 'active' }).success).toBe(true);
    expect(schema.safeParse({ status: 'unknown' }).success).toBe(false);
  });

  it('handles number fields', () => {
    const params: Record<string, ToolParamDef> = {
      count: { type: 'number', description: 'Count', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ count: 42 }).success).toBe(true);
    expect(schema.safeParse({ count: 'not a number' }).success).toBe(false);
  });

  it('handles boolean fields', () => {
    const params: Record<string, ToolParamDef> = {
      active: { type: 'boolean', description: 'Active', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ active: true }).success).toBe(true);
  });

  it('handles object fields', () => {
    const params: Record<string, ToolParamDef> = {
      data: { type: 'object', description: 'Data', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ data: { key: 'val' } }).success).toBe(true);
  });

  it('handles object fields with properties', () => {
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
    const schema = toZodSchema(params);
    expect(schema.safeParse({ config: { key: 'val' } }).success).toBe(true);
  });

  it('handles array fields', () => {
    const params: Record<string, ToolParamDef> = {
      items: { type: 'array', description: 'Items', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ items: [1, 2, 3] }).success).toBe(true);
  });

  it('handles array fields with items', () => {
    const params: Record<string, ToolParamDef> = {
      tags: {
        type: 'array',
        description: 'Tags',
        required: true,
        items: { type: 'string', description: 'Tag' },
      },
    };
    const schema = toZodSchema(params);
    expect(schema.safeParse({ tags: ['a', 'b'] }).success).toBe(true);
  });

  it('returns schema with shape property', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.shape).toBeDefined();
    expect(schema.shape['name']).toBeDefined();
  });
});
