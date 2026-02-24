import { describe, it, expect } from 'vitest';
import {
  truncate,
  slugify,
  stripHtml,
  readingTimeMinutes,
  wordCount,
  readabilityScore,
  extractSentences,
  titleCase,
} from '../src/core/utils/text.js';

describe('text utilities', () => {
  describe('truncate', () => {
    it('returns text unchanged if shorter than limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates and adds ellipsis', () => {
      const result = truncate('This is a long string that needs truncating', 20);
      expect(result.length).toBe(20);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('slugify', () => {
    it('converts to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Price: $100!')).toBe('price-100');
    });

    it('handles multiple spaces', () => {
      expect(slugify('Too   many   spaces')).toBe('too-many-spaces');
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('handles text without HTML', () => {
      expect(stripHtml('plain text')).toBe('plain text');
    });
  });

  describe('readingTimeMinutes', () => {
    it('returns 1 for very short text', () => {
      expect(readingTimeMinutes('Short text.')).toBe(1);
    });

    it('calculates based on word count', () => {
      const longText = 'word '.repeat(400);
      expect(readingTimeMinutes(longText)).toBe(2);
    });
  });

  describe('wordCount', () => {
    it('counts words correctly', () => {
      expect(wordCount('one two three four')).toBe(4);
    });

    it('handles empty string', () => {
      expect(wordCount('')).toBe(0);
    });
  });

  describe('readabilityScore', () => {
    it('returns 0 for empty text', () => {
      expect(readabilityScore('')).toBe(0);
    });

    it('scores simple text higher than complex text', () => {
      const simple = 'We build great apps. Our team is experienced. We deliver on time.';
      const complex =
        'Notwithstanding the aforementioned stipulations regarding the implementation methodology of the sophisticated technological infrastructure, the systematically comprehensive approach necessitates extraordinary deliberation.';

      expect(readabilityScore(simple)).toBeGreaterThan(readabilityScore(complex));
    });

    it('returns a score between 0 and 100', () => {
      const score = readabilityScore('A good sentence. Another one. Short and clear.');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('extractSentences', () => {
    it('extracts specified number of sentences', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const result = extractSentences(text, 2);
      expect(result).toContain('First sentence.');
      expect(result).toContain('Second sentence.');
      expect(result).not.toContain('Third sentence.');
    });
  });

  describe('titleCase', () => {
    it('capitalizes first letter of each word', () => {
      expect(titleCase('hello world')).toBe('Hello World');
    });
  });
});
