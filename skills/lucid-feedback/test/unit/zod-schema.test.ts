// ---------------------------------------------------------------------------
// zod-schema.test.ts -- Tests for Zod schema adapter
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { toZodSchema } from '../../src/adapters/zod-schema.js';

describe('toZodSchema', () => {
  it('handles string params', () => {
    const schema = toZodSchema({ name: { type: 'string', description: 'A name' } });
    expect(schema.parse({ name: 'test' })).toEqual({ name: 'test' });
  });

  it('handles number params with min/max', () => {
    const schema = toZodSchema({ count: { type: 'number', min: 1, max: 100 } });
    expect(schema.parse({ count: 50 })).toEqual({ count: 50 });
    expect(() => schema.parse({ count: 0 })).toThrow();
  });

  it('handles enum params', () => {
    const schema = toZodSchema({ channel: { type: 'enum', values: ['email', 'survey'] } });
    expect(schema.parse({ channel: 'email' })).toEqual({ channel: 'email' });
    expect(() => schema.parse({ channel: 'invalid' })).toThrow();
  });

  it('handles optional params', () => {
    const schema = toZodSchema({
      name: { type: 'string' },
      label: { type: 'string', required: false },
    });
    expect(schema.parse({ name: 'test' })).toEqual({ name: 'test' });
    expect(schema.parse({ name: 'test', label: 'l' })).toEqual({ name: 'test', label: 'l' });
  });

  it('handles boolean params', () => {
    const schema = toZodSchema({ enabled: { type: 'boolean' } });
    expect(schema.parse({ enabled: true })).toEqual({ enabled: true });
  });

  it('handles array params', () => {
    const schema = toZodSchema({
      tags: { type: 'array', items: { type: 'string' } },
    });
    expect(schema.parse({ tags: ['a', 'b'] })).toEqual({ tags: ['a', 'b'] });
  });

  it('handles object params', () => {
    const schema = toZodSchema({
      metadata: { type: 'object' },
    });
    expect(schema.parse({ metadata: { key: 'value' } })).toBeDefined();
  });
});
