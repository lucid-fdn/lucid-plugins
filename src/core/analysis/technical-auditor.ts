// ---------------------------------------------------------------------------
// technical-auditor.ts -- Technical SEO audit logic
// ---------------------------------------------------------------------------

import type { AuditIssue } from '../types/database.js';
import type { AuditSeverity } from '../types/common.js';

export interface TechnicalAuditResult {
  issues: AuditIssue[];
  score: number;
  pages_crawled: number;
  healthy_pages: number;
  broken_links: number;
  redirect_chains: number;
  missing_meta: number;
  slow_pages: number;
  mobile_issues: number;
  schema_errors: number;
}

export function createIssue(
  severity: AuditSeverity,
  category: string,
  message: string,
  url?: string,
): AuditIssue {
  return { severity, category, message, url };
}

export function checkMeta(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push(createIssue('critical', 'meta', 'Missing or empty title tag', url));
  } else {
    const titleLen = titleMatch[1].trim().length;
    if (titleLen > 60) {
      issues.push(createIssue('warning', 'meta', `Title tag too long (${titleLen} chars, max 60)`, url));
    }
    if (titleLen < 20) {
      issues.push(createIssue('warning', 'meta', `Title tag too short (${titleLen} chars, min 20)`, url));
    }
  }

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    issues.push(createIssue('critical', 'meta', 'Missing or empty meta description', url));
  } else {
    const descLen = descMatch[1].trim().length;
    if (descLen > 160) {
      issues.push(createIssue('warning', 'meta', `Meta description too long (${descLen} chars, max 160)`, url));
    }
    if (descLen < 50) {
      issues.push(createIssue('warning', 'meta', `Meta description too short (${descLen} chars, min 50)`, url));
    }
  }

  return issues;
}

export function checkHeadings(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const h1Matches = html.match(/<h1[^>]*>/gi);
  if (!h1Matches) {
    issues.push(createIssue('critical', 'headings', 'No H1 tag found', url));
  } else if (h1Matches.length > 1) {
    issues.push(createIssue('warning', 'headings', `Multiple H1 tags found (${h1Matches.length})`, url));
  }

  // Check heading hierarchy
  const headingTags = html.match(/<h([1-6])[^>]*>/gi) ?? [];
  const levels = headingTags.map((t) => parseInt(t.match(/h([1-6])/i)?.[1] ?? '1', 10));

  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      issues.push(
        createIssue('warning', 'headings', `Heading hierarchy skip: H${levels[i - 1]} to H${levels[i]}`, url),
      );
      break;
    }
  }

  return issues;
}

export function checkImages(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const imgTags = html.match(/<img[^>]*>/gi) ?? [];
  let missingAlt = 0;

  for (const img of imgTags) {
    if (!/alt=["'][^"']*["']/i.test(img)) {
      missingAlt++;
    }
  }

  if (missingAlt > 0) {
    issues.push(
      createIssue(
        missingAlt > 3 ? 'warning' : 'info',
        'images',
        `${missingAlt} image(s) missing alt attributes`,
        url,
      ),
    );
  }

  return issues;
}

export function checkLinks(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const links = html.match(/<a[^>]*>/gi) ?? [];
  let nofollow = 0;
  let blankWithoutNoopener = 0;

  for (const link of links) {
    if (/rel=["'][^"']*nofollow[^"']*["']/i.test(link)) nofollow++;
    if (/target=["']_blank["']/i.test(link) && !/rel=["'][^"']*noopener[^"']*["']/i.test(link)) {
      blankWithoutNoopener++;
    }
  }

  if (blankWithoutNoopener > 0) {
    issues.push(
      createIssue(
        'warning',
        'links',
        `${blankWithoutNoopener} link(s) with target="_blank" missing rel="noopener"`,
        url,
      ),
    );
  }

  if (nofollow > links.length * 0.5 && links.length > 5) {
    issues.push(createIssue('info', 'links', `High percentage of nofollow links (${nofollow}/${links.length})`, url));
  }

  return issues;
}

export function checkSchema(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
  const hasMicrodata = /itemscope|itemtype/i.test(html);

  if (!hasJsonLd && !hasMicrodata) {
    issues.push(createIssue('warning', 'schema', 'No structured data (JSON-LD or Microdata) found', url));
  }

  return issues;
}

export function checkMobile(html: string, url?: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
  if (!hasViewport) {
    issues.push(createIssue('critical', 'mobile', 'Missing viewport meta tag', url));
  }

  return issues;
}

export function auditHtml(html: string, url?: string): AuditIssue[] {
  return [
    ...checkMeta(html, url),
    ...checkHeadings(html, url),
    ...checkImages(html, url),
    ...checkLinks(html, url),
    ...checkSchema(html, url),
    ...checkMobile(html, url),
  ];
}

export function calculateTechScore(issues: AuditIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 15;
        break;
      case 'warning':
        score -= 8;
        break;
      case 'info':
        score -= 2;
        break;
      case 'pass':
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}
