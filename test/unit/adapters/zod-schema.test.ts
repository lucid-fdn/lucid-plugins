import { describe, it, expect } from 'vitest';
import { toZodSchema } from '../../../src/adapters/zod-schema.js';
import type { ToolParamDef } from '../../../src/core/tools/types.js';

describe('toZodSchema', () => {
  it('converts string param to zod string', () => {
    const params: Record<string, ToolParamDef> = {
      url: { type: 'string', required: true, description: 'The URL' },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ url: 'https://example.com' })).toEqual({ url: 'https://example.com' });
  });

  it('converts enum param to zod enum', () => {
    const params: Record<string, ToolParamDef> = {
      source_type: { type: 'enum', values: ['rss', 'web'], required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ source_type: 'rss' })).toEqual({ source_type: 'rss' });
    expect(() => schema.parse({ source_type: 'invalid' })).toThrow();
  });

  it('makes params optional when required is false', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', required: false },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({})).toEqual({});
  });

  it('converts number param with min/max', () => {
    const params: Record<string, ToolParamDef> = {
      score: { type: 'number', required: true, min: 0, max: 100 },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ score: 50 })).toEqual({ score: 50 });
    expect(() => schema.parse({ score: 101 })).toThrow();
  });
});
