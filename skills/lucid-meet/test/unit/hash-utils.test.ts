// ---------------------------------------------------------------------------
// hash-utils.test.ts -- Tests for hash utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { sha256 } from '../../src/core/utils/hash.js';

describe('sha256', () => {
  it('returns a 64-char hex string', () => {
    const hash = sha256('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns consistent results', () => {
    expect(sha256('test')).toBe(sha256('test'));
  });

  it('returns different hashes for different inputs', () => {
    expect(sha256('hello')).not.toBe(sha256('world'));
  });

  it('handles empty string', () => {
    const hash = sha256('');
    expect(hash).toHaveLength(64);
  });
});
