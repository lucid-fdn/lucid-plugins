import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  PROPOSAL_STATUSES,
  SECTION_TYPES,
  PRICING_MODELS,
  PRIORITY_LEVELS,
  TEMPLATE_CATEGORIES,
} from '../src/core/types/common.js';

describe('zod-schema validation', () => {
  describe('PROPOSAL_STATUSES', () => {
    const schema = z.enum(PROPOSAL_STATUSES);

    it('accepts valid statuses', () => {
      expect(schema.parse('draft')).toBe('draft');
      expect(schema.parse('accepted')).toBe('accepted');
      expect(schema.parse('rejected')).toBe('rejected');
    });

    it('rejects invalid statuses', () => {
      expect(() => schema.parse('invalid')).toThrow();
    });

    it('has 7 statuses', () => {
      expect(PROPOSAL_STATUSES.length).toBe(7);
    });
  });

  describe('SECTION_TYPES', () => {
    const schema = z.enum(SECTION_TYPES);

    it('accepts valid section types', () => {
      expect(schema.parse('executive_summary')).toBe('executive_summary');
      expect(schema.parse('pricing')).toBe('pricing');
      expect(schema.parse('custom')).toBe('custom');
    });

    it('rejects invalid section types', () => {
      expect(() => schema.parse('nonexistent')).toThrow();
    });

    it('has 12 section types', () => {
      expect(SECTION_TYPES.length).toBe(12);
    });
  });

  describe('PRICING_MODELS', () => {
    const schema = z.enum(PRICING_MODELS);

    it('accepts valid pricing models', () => {
      expect(schema.parse('fixed')).toBe('fixed');
      expect(schema.parse('hourly')).toBe('hourly');
      expect(schema.parse('subscription')).toBe('subscription');
    });

    it('rejects invalid models', () => {
      expect(() => schema.parse('per_word')).toThrow();
    });

    it('has 6 models', () => {
      expect(PRICING_MODELS.length).toBe(6);
    });
  });

  describe('PRIORITY_LEVELS', () => {
    const schema = z.enum(PRIORITY_LEVELS);

    it('accepts valid priorities', () => {
      expect(schema.parse('low')).toBe('low');
      expect(schema.parse('critical')).toBe('critical');
    });

    it('has 4 levels', () => {
      expect(PRIORITY_LEVELS.length).toBe(4);
    });
  });

  describe('TEMPLATE_CATEGORIES', () => {
    const schema = z.enum(TEMPLATE_CATEGORIES);

    it('accepts valid categories', () => {
      expect(schema.parse('saas')).toBe('saas');
      expect(schema.parse('consulting')).toBe('consulting');
      expect(schema.parse('general')).toBe('general');
    });

    it('rejects invalid categories', () => {
      expect(() => schema.parse('crypto')).toThrow();
    });

    it('has 7 categories', () => {
      expect(TEMPLATE_CATEGORIES.length).toBe(7);
    });
  });
});
