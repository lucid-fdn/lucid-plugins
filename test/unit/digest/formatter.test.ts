import { describe, it, expect } from 'vitest';
import { markdownToHtml, buildStoragePath } from '../../../src/core/digest/formatter.js';

describe('formatter', () => {
  describe('markdownToHtml', () => {
    it('converts markdown to HTML', async () => {
      const html = await markdownToHtml('# Hello\n\nWorld');
      expect(html).toContain('<h1>');
      expect(html).toContain('Hello');
    });
  });

  describe('buildStoragePath', () => {
    it('builds correct path', () => {
      const path = buildStoragePath('tenant1', '2024-01-15', 'daily', 'md');
      expect(path).toBe('digests/tenant1/2024-01-15/daily.md');
    });
  });
});
