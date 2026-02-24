import { describe, it, expect } from 'vitest';
import {
  truncate,
  normalizeWhitespace,
  slugify,
  extractEmails,
  extractPhones,
  wordSimilarity,
  normalizeSkill,
  skillsMatch,
} from '../src/core/utils/text.js';

describe('truncate', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('normalizeWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeWhitespace('hello   world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('handles tabs and newlines', () => {
    expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
  });
});

describe('slugify', () => {
  it('creates a URL-safe slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Senior Engineer (React/Node.js)')).toBe('senior-engineer-reactnodejs');
  });

  it('handles multiple dashes', () => {
    expect(slugify('hello -- world')).toBe('hello-world');
  });
});

describe('extractEmails', () => {
  it('extracts email addresses from text', () => {
    const emails = extractEmails('Contact alice@example.com or bob@test.org');
    expect(emails).toContain('alice@example.com');
    expect(emails).toContain('bob@test.org');
  });

  it('returns empty array for no emails', () => {
    expect(extractEmails('no emails here')).toEqual([]);
  });

  it('deduplicates emails', () => {
    const emails = extractEmails('alice@test.com and alice@test.com');
    expect(emails).toHaveLength(1);
  });
});

describe('extractPhones', () => {
  it('extracts phone numbers', () => {
    const phones = extractPhones('Call (555) 123-4567 or 555.987.6543');
    expect(phones.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for no phones', () => {
    expect(extractPhones('no phone numbers here')).toEqual([]);
  });
});

describe('wordSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(wordSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(wordSimilarity('hello world', 'foo bar')).toBe(0);
  });

  it('returns partial score for overlap', () => {
    const score = wordSimilarity('hello world foo', 'hello world bar');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe('normalizeSkill / skillsMatch', () => {
  it('normalizes skill strings', () => {
    expect(normalizeSkill('Node.js')).toBe('nodejs');
    expect(normalizeSkill('C++')).toBe('c++');
    expect(normalizeSkill('CI/CD')).toBe('cicd');
  });

  it('matches equivalent skills', () => {
    expect(skillsMatch('Node.js', 'nodejs')).toBe(true);
    expect(skillsMatch('TypeScript', 'typescript')).toBe(true);
    expect(skillsMatch('CI/CD', 'cicd')).toBe(true);
  });

  it('does not match different skills', () => {
    expect(skillsMatch('python', 'javascript')).toBe(false);
  });
});
