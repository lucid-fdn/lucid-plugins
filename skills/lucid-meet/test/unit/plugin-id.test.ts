// ---------------------------------------------------------------------------
// plugin-id.test.ts -- Tests for plugin identity constants
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from '../../src/core/plugin-id.js';

describe('plugin identity', () => {
  it('has correct plugin ID', () => {
    expect(PLUGIN_ID).toBe('lucid-meet');
  });

  it('has correct plugin name', () => {
    expect(PLUGIN_NAME).toBe('Lucid Meet');
  });

  it('has a version string', () => {
    expect(PLUGIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
