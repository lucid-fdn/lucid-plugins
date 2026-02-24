import { describe, it, expect } from 'vitest';
import { isValidUrl, joinUrl, getQueryParams } from '../../src/core/utils/url.js';

describe('url utils', () => {
  // --- isValidUrl ---
  describe('isValidUrl', () => {
    it('returns true for valid https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('returns true for valid http URL', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('returns true for URL with path', () => {
      expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    it('returns true for URL with query string', () => {
      expect(isValidUrl('https://example.com?foo=bar&baz=qux')).toBe(true);
    });

    it('returns false for invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('returns false for relative path', () => {
      expect(isValidUrl('/path/to/page')).toBe(false);
    });
  });

  // --- joinUrl ---
  describe('joinUrl', () => {
    it('joins base and segment', () => {
      expect(joinUrl('https://api.example.com', 'v1')).toBe('https://api.example.com/v1');
    });

    it('joins multiple segments', () => {
      expect(joinUrl('https://api.example.com', 'v1', 'users', '123')).toBe(
        'https://api.example.com/v1/users/123',
      );
    });

    it('handles trailing slash on base', () => {
      expect(joinUrl('https://api.example.com/', 'v1')).toBe('https://api.example.com/v1');
    });

    it('handles leading slash on segment', () => {
      expect(joinUrl('https://api.example.com', '/v1')).toBe('https://api.example.com/v1');
    });

    it('handles both trailing and leading slashes', () => {
      expect(joinUrl('https://api.example.com/', '/v1/')).toBe('https://api.example.com/v1');
    });

    it('handles base with no segments', () => {
      expect(joinUrl('https://api.example.com')).toBe('https://api.example.com');
    });
  });

  // --- getQueryParams ---
  describe('getQueryParams', () => {
    it('extracts query parameters', () => {
      expect(getQueryParams('https://example.com?foo=bar&baz=qux')).toEqual({
        foo: 'bar',
        baz: 'qux',
      });
    });

    it('returns empty object for no query', () => {
      expect(getQueryParams('https://example.com')).toEqual({});
    });

    it('returns empty object for invalid URL', () => {
      expect(getQueryParams('not-a-url')).toEqual({});
    });

    it('handles URL-encoded values', () => {
      const params = getQueryParams('https://example.com?name=hello%20world');
      expect(params['name']).toBe('hello world');
    });

    it('handles single parameter', () => {
      expect(getQueryParams('https://example.com?key=value')).toEqual({ key: 'value' });
    });
  });
});
