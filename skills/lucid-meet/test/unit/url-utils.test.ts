// ---------------------------------------------------------------------------
// url-utils.test.ts -- Tests for URL utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { isValidUrl, normalizeUrl } from '../../src/core/utils/url.js';

describe('isValidUrl', () => {
  it('returns true for valid HTTP URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('returns true for valid HTTPS URL', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('returns false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('strips trailing slashes', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('returns original for invalid URL', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });

  it('normalizes URL', () => {
    const result = normalizeUrl('https://example.com/path/');
    expect(result).toBe('https://example.com/path');
  });
});
