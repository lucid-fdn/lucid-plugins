import { describe, it, expect } from 'vitest';
import { truncate, stripHtml, slugify } from '../../../src/core/utils/text.js';

describe('text utils', () => {
  describe('truncate', () => {
    it('truncates long strings with ellipsis', () => {
      expect(truncate('hello world', 5)).toBe('he...');
    });
    it('returns short strings unchanged', () => {
      expect(truncate('hi', 10)).toBe('hi');
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });
  });

  describe('slugify', () => {
    it('creates URL-safe slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
    });
  });
});
