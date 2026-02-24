import { describe, it, expect } from 'vitest';
import { toTypeBoxSchema } from '../../../src/adapters/typebox-schema.js';
import type { ToolParamDef } from '../../../src/core/tools/types.js';

describe('toTypeBoxSchema', () => {
  it('converts string param to TypeBox string', () => {
    const params: Record<string, ToolParamDef> = {
      url: { type: 'string', required: true, description: 'The URL' },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.type).toBe('object');
    expect(schema.properties.url.type).toBe('string');
    expect(schema.required).toContain('url');
  });

  it('converts enum param to TypeBox union', () => {
    const params: Record<string, ToolParamDef> = {
      source_type: { type: 'enum', values: ['rss', 'web'], required: true },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.properties.source_type).toBeDefined();
  });

  it('marks optional params correctly', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', required: false },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.required ?? []).not.toContain('label');
  });
});
