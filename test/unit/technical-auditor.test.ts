// ---------------------------------------------------------------------------
// technical-auditor.test.ts -- Tests for technical SEO auditor
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  checkMeta,
  checkHeadings,
  checkImages,
  checkLinks,
  checkSchema,
  checkMobile,
  auditHtml,
  calculateTechScore,
  createIssue,
} from '../../src/core/analysis/technical-auditor.js';
import { MOCK_HTML_GOOD, MOCK_HTML_BAD } from '../helpers/fixtures.js';

describe('checkMeta', () => {
  it('finds no meta issues in good HTML', () => {
    const issues = checkMeta(MOCK_HTML_GOOD);
    const criticals = issues.filter((i) => i.severity === 'critical');
    expect(criticals).toHaveLength(0);
  });

  it('detects missing title and description', () => {
    const issues = checkMeta(MOCK_HTML_BAD);
    const criticals = issues.filter((i) => i.severity === 'critical');
    expect(criticals.length).toBeGreaterThanOrEqual(2);
  });

  it('warns about long titles', () => {
    const html = `<title>${'A'.repeat(80)}</title>`;
    const issues = checkMeta(html);
    expect(issues.some((i) => i.message.includes('too long'))).toBe(true);
  });
});

describe('checkHeadings', () => {
  it('passes for proper heading structure', () => {
    const issues = checkHeadings(MOCK_HTML_GOOD);
    const criticals = issues.filter((i) => i.severity === 'critical');
    expect(criticals).toHaveLength(0);
  });

  it('detects missing H1', () => {
    const html = '<h2>No H1 here</h2>';
    const issues = checkHeadings(html);
    expect(issues.some((i) => i.message.includes('No H1'))).toBe(true);
  });

  it('detects heading hierarchy skips', () => {
    const html = '<h1>Title</h1><h3>Skipped H2</h3>';
    const issues = checkHeadings(html);
    expect(issues.some((i) => i.message.includes('skip'))).toBe(true);
  });
});

describe('checkImages', () => {
  it('detects missing alt attributes', () => {
    const issues = checkImages(MOCK_HTML_BAD);
    expect(issues.some((i) => i.message.includes('alt'))).toBe(true);
  });

  it('passes when all images have alt', () => {
    const html = '<img src="test.jpg" alt="Test image">';
    const issues = checkImages(html);
    expect(issues).toHaveLength(0);
  });
});

describe('checkLinks', () => {
  it('detects target=_blank without noopener', () => {
    const issues = checkLinks(MOCK_HTML_BAD);
    expect(issues.some((i) => i.message.includes('noopener'))).toBe(true);
  });

  it('passes for safe links', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const issues = checkLinks(html);
    const warnings = issues.filter((i) => i.severity === 'warning');
    expect(warnings).toHaveLength(0);
  });
});

describe('checkSchema', () => {
  it('passes when JSON-LD is present', () => {
    const issues = checkSchema(MOCK_HTML_GOOD);
    expect(issues).toHaveLength(0);
  });

  it('warns when no structured data found', () => {
    const issues = checkSchema(MOCK_HTML_BAD);
    expect(issues.some((i) => i.message.includes('structured data'))).toBe(true);
  });
});

describe('checkMobile', () => {
  it('passes when viewport is present', () => {
    const issues = checkMobile(MOCK_HTML_GOOD);
    expect(issues).toHaveLength(0);
  });

  it('detects missing viewport', () => {
    const issues = checkMobile(MOCK_HTML_BAD);
    expect(issues.some((i) => i.message.includes('viewport'))).toBe(true);
  });
});

describe('auditHtml', () => {
  it('finds fewer issues in good HTML', () => {
    const goodIssues = auditHtml(MOCK_HTML_GOOD);
    const badIssues = auditHtml(MOCK_HTML_BAD);
    expect(goodIssues.length).toBeLessThan(badIssues.length);
  });
});

describe('calculateTechScore', () => {
  it('returns 100 for no issues', () => {
    expect(calculateTechScore([])).toBe(100);
  });

  it('reduces score for critical issues', () => {
    const issues = [createIssue('critical', 'meta', 'Missing title')];
    expect(calculateTechScore(issues)).toBe(85);
  });

  it('never goes below 0', () => {
    const issues = Array(20).fill(null).map(() => createIssue('critical', 'meta', 'Issue'));
    expect(calculateTechScore(issues)).toBe(0);
  });
});
