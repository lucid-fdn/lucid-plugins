import { describe, it, expect } from 'vitest';
import { normalizeUrl, extractDomain, isValidUrl } from '../../../src/core/utils/url.js';

describe('url utils', () => {
  describe('normalizeUrl', () => {
    it('trims and removes trailing slash', () => {
      expect(normalizeUrl('  https://example.com/  ')).toBe('https://example.com');
    });
    it('removes fragment', () => {
      expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
    });
  });

  describe('extractDomain', () => {
    it('extracts hostname', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    });
  });

  describe('isValidUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });
    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });
});
