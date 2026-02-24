import { describe, it, expect } from 'vitest';
import { truncate, slugify, stripHtml, capitalize, isBlank, safeId, extractSummary } from '../../src/core/utils/text.js';

describe('text utils', () => {
  // --- truncate ---
  describe('truncate', () => {
    it('returns the original string when under limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates and adds ellipsis when over limit', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('returns exact length string unchanged', () => {
      expect(truncate('abc', 3)).toBe('abc');
    });

    it('handles empty string', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('handles single character maxLength', () => {
      // maxLength - 3 = -2, so slice(0, -2) => empty + "..."
      expect(truncate('abcdef', 3)).toBe('...');
    });
  });

  // --- slugify ---
  describe('slugify', () => {
    it('converts to lowercase with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('replaces underscores with hyphens', () => {
      expect(slugify('hello_world_test')).toBe('hello-world-test');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
      expect(slugify('-hello-world-')).toBe('hello-world');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles whitespace-only input', () => {
      expect(slugify('   ')).toBe('');
    });
  });

  // --- stripHtml ---
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('removes nested tags', () => {
      expect(stripHtml('<div><span>Text</span></div>')).toBe('Text');
    });

    it('handles self-closing tags', () => {
      expect(stripHtml('Line<br/>Break')).toBe('LineBreak');
    });

    it('leaves plain text unchanged', () => {
      expect(stripHtml('plain text')).toBe('plain text');
    });

    it('handles empty string', () => {
      expect(stripHtml('')).toBe('');
    });
  });

  // --- capitalize ---
  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('handles already capitalized', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('preserves the rest of the string', () => {
      expect(capitalize('hELLO wORLD')).toBe('HELLO wORLD');
    });
  });

  // --- isBlank ---
  describe('isBlank', () => {
    it('returns true for null', () => {
      expect(isBlank(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isBlank(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isBlank('')).toBe(true);
    });

    it('returns true for whitespace only', () => {
      expect(isBlank('   ')).toBe(true);
    });

    it('returns false for non-blank string', () => {
      expect(isBlank('hello')).toBe(false);
    });

    it('returns false for string with content and spaces', () => {
      expect(isBlank('  hello  ')).toBe(false);
    });
  });

  // --- safeId ---
  describe('safeId', () => {
    it('replaces special characters with underscores', () => {
      expect(safeId('hello@world.com')).toBe('hello_world_com');
    });

    it('collapses multiple underscores', () => {
      expect(safeId('hello!!!world')).toBe('hello_world');
    });

    it('lowercases the result', () => {
      expect(safeId('Hello-World')).toBe('hello-world');
    });

    it('trims leading/trailing underscores', () => {
      expect(safeId('_hello_')).toBe('hello');
    });

    it('preserves hyphens', () => {
      expect(safeId('my-id-123')).toBe('my-id-123');
    });
  });

  // --- extractSummary ---
  describe('extractSummary', () => {
    it('extracts first N sentences', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const result = extractSummary(text, 2);
      expect(result).toContain('First sentence.');
      expect(result).toContain('Second sentence.');
      expect(result).not.toContain('Third sentence.');
    });

    it('returns single sentence when requested', () => {
      const text = 'Hello world. Goodbye world.';
      expect(extractSummary(text, 1)).toBe('Hello world.');
    });

    it('handles text without sentences', () => {
      const text = 'no punctuation here';
      const result = extractSummary(text, 2);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('defaults to 2 sentences', () => {
      const text = 'One. Two. Three.';
      const result = extractSummary(text);
      expect(result).toContain('One.');
      expect(result).toContain('Two.');
      expect(result).not.toContain('Three.');
    });
  });
});
