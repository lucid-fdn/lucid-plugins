// ---------------------------------------------------------------------------
// typebox-schema.test.ts -- Tests for TypeBox schema adapter
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { toTypeBoxSchema } from '../../src/adapters/typebox-schema.js';

describe('toTypeBoxSchema', () => {
  it('handles string params', () => {
    const schema = toTypeBoxSchema({ name: { type: 'string' } });
    expect(Value.Check(schema, { name: 'hello' })).toBe(true);
    expect(Value.Check(schema, { name: 123 })).toBe(false);
  });

  it('handles enum params', () => {
    const schema = toTypeBoxSchema({ type: { type: 'enum', values: ['standup', 'planning'] } });
    expect(Value.Check(schema, { type: 'standup' })).toBe(true);
    expect(Value.Check(schema, { type: 'invalid' })).toBe(false);
  });

  it('handles optional params', () => {
    const schema = toTypeBoxSchema({
      name: { type: 'string' },
      label: { type: 'string', required: false },
    });
    expect(Value.Check(schema, { name: 'test' })).toBe(true);
    expect(Value.Check(schema, { name: 'test', label: 'l' })).toBe(true);
  });

  it('handles array params', () => {
    const schema = toTypeBoxSchema({
      items: { type: 'array', items: { type: 'string' } },
    });
    expect(Value.Check(schema, { items: ['a', 'b'] })).toBe(true);
    expect(Value.Check(schema, { items: [1, 2] })).toBe(false);
  });

  it('handles number params', () => {
    const schema = toTypeBoxSchema({ count: { type: 'number' } });
    expect(Value.Check(schema, { count: 42 })).toBe(true);
    expect(Value.Check(schema, { count: 'abc' })).toBe(false);
  });

  it('handles boolean params', () => {
    const schema = toTypeBoxSchema({ active: { type: 'boolean' } });
    expect(Value.Check(schema, { active: true })).toBe(true);
    expect(Value.Check(schema, { active: 'yes' })).toBe(false);
  });

  it('handles object params', () => {
    const schema = toTypeBoxSchema({
      meta: { type: 'object' },
    });
    expect(Value.Check(schema, { meta: { key: 'val' } })).toBe(true);
  });
});
