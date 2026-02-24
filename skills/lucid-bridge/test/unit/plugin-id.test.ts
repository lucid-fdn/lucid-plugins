import { describe, it, expect } from 'vitest';
import { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from '../../src/core/plugin-id.js';

describe('plugin-id', () => {
  it('PLUGIN_ID is lucid-bridge', () => {
    expect(PLUGIN_ID).toBe('lucid-bridge');
  });

  it('PLUGIN_NAME is Lucid Bridge', () => {
    expect(PLUGIN_NAME).toBe('Lucid Bridge');
  });

  it('PLUGIN_VERSION is a semver string', () => {
    expect(PLUGIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
