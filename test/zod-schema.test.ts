import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { toZodSchema } from '../src/adapters/zod-schema.js';
import type { ToolParamDef } from '../src/core/tools/types.js';

describe('toZodSchema', () => {
  it('creates a schema from string params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ name: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('creates a schema from number params', () => {
    const params: Record<string, ToolParamDef> = {
      age: { type: 'number', description: 'Age', required: true },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ age: 30 });
    expect(result.success).toBe(true);
  });

  it('handles optional params', () => {
    const params: Record<string, ToolParamDef> = {
      name: { type: 'string', description: 'Name', required: true },
      bio: { type: 'string', description: 'Bio' },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ name: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('validates enum params', () => {
    const params: Record<string, ToolParamDef> = {
      status: { type: 'string', description: 'Status', required: true, enum: ['open', 'closed'] },
    };
    const schema = toZodSchema(params);
    const valid = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ status: 'open' });
    expect(valid.success).toBe(true);
    const invalid = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ status: 'invalid' });
    expect(invalid.success).toBe(false);
  });

  it('handles array params', () => {
    const params: Record<string, ToolParamDef> = {
      skills: { type: 'array', description: 'Skills', required: true, items: { type: 'string' } },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ skills: ['ts', 'react'] });
    expect(result.success).toBe(true);
  });

  it('handles boolean params', () => {
    const params: Record<string, ToolParamDef> = {
      active: { type: 'boolean', description: 'Active', required: true },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({ active: true });
    expect(result.success).toBe(true);
  });

  it('applies default values', () => {
    const params: Record<string, ToolParamDef> = {
      limit: { type: 'number', description: 'Limit', default: 25 },
    };
    const schema = toZodSchema(params);
    const result = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['limit']).toBe(25);
    }
  });
});
