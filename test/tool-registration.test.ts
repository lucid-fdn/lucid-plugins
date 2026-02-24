import { describe, it, expect } from 'vitest';
import { ALL_TOOLS } from '../src/core/tools/index.js';

describe('tool-registration', () => {
  it('registers exactly 10 tools', () => {
    expect(ALL_TOOLS.length).toBe(10);
  });

  it('all tools have unique names', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all tool names start with propose_', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.name.startsWith('propose_')).toBe(true);
    }
  });

  it('all tools have descriptions', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('all tools have input schemas', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it('all tools have handler functions', () => {
    for (const tool of ALL_TOOLS) {
      expect(typeof tool.handler).toBe('function');
    }
  });
});
