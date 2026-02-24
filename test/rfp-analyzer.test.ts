import { describe, it, expect } from 'vitest';
import {
  analyzeRfp,
  extractRequirements,
  detectEvaluationCriteria,
  identifyKeyThemes,
  estimateWinProbability,
} from '../src/core/analysis/rfp-analyzer.js';

const SAMPLE_RFP = `
REQUEST FOR PROPOSAL: Cloud Migration Project

OVERVIEW
We are seeking proposals for a comprehensive cloud migration project.
The solution must include security and compliance features.
The vendor shall provide 24/7 support services.
Teams should have experience with AWS and Azure.

REQUIREMENTS
The system must integrate with our existing API infrastructure.
Data migration is required for all legacy databases.
The platform shall support at least 10,000 concurrent users.
Performance monitoring is preferred but optional.
The solution may include a mobile application if possible.

EVALUATION CRITERIA
Technical Approach: 30%
Experience & Qualifications: 25%
Cost / Price: 20%
Team & Resources: 15%
Timeline & Schedule: 10%

BUDGET
The total budget allocation is not to exceed $500,000.
Budget for Phase 1 should not exceed $200,000.

TIMELINE
Proposals must be submitted by 2025-06-15.
Project kickoff is expected January 15, 2026.
`;

describe('rfp-analyzer', () => {
  describe('analyzeRfp', () => {
    it('returns a complete analysis structure', () => {
      const analysis = analyzeRfp(SAMPLE_RFP);

      expect(analysis).toHaveProperty('requirements');
      expect(analysis).toHaveProperty('evaluation_criteria');
      expect(analysis).toHaveProperty('deadlines');
      expect(analysis).toHaveProperty('budget_hints');
      expect(analysis).toHaveProperty('key_themes');
    });

    it('identifies multiple requirements', () => {
      const analysis = analyzeRfp(SAMPLE_RFP);
      expect(analysis.requirements.length).toBeGreaterThan(3);
    });

    it('identifies budget hints', () => {
      const analysis = analyzeRfp(SAMPLE_RFP);
      expect(analysis.budget_hints.length).toBeGreaterThan(0);
    });
  });

  describe('extractRequirements', () => {
    it('identifies must-have requirements', () => {
      const reqs = extractRequirements(SAMPLE_RFP);
      const mustHaves = reqs.filter((r) => r.priority === 'must_have');
      expect(mustHaves.length).toBeGreaterThan(0);
    });

    it('identifies nice-to-have requirements', () => {
      const reqs = extractRequirements(SAMPLE_RFP);
      const niceToHaves = reqs.filter((r) => r.priority === 'nice_to_have');
      expect(niceToHaves.length).toBeGreaterThan(0);
    });

    it('identifies optional requirements', () => {
      const reqs = extractRequirements(SAMPLE_RFP);
      const optionals = reqs.filter((r) => r.priority === 'optional');
      expect(optionals.length).toBeGreaterThan(0);
    });

    it('assigns sequential IDs', () => {
      const reqs = extractRequirements(SAMPLE_RFP);
      expect(reqs[0]?.id).toBe('REQ-001');
      if (reqs.length > 1) {
        expect(reqs[1]?.id).toBe('REQ-002');
      }
    });

    it('categorizes requirements', () => {
      const reqs = extractRequirements(SAMPLE_RFP);
      const categories = reqs.map((r) => r.category);
      expect(categories.some((c) => c !== 'general')).toBe(true);
    });
  });

  describe('detectEvaluationCriteria', () => {
    it('detects criteria from RFP text', () => {
      const criteria = detectEvaluationCriteria(SAMPLE_RFP);
      expect(criteria.length).toBeGreaterThan(0);
    });

    it('normalizes weights to 100', () => {
      const criteria = detectEvaluationCriteria(SAMPLE_RFP);
      if (criteria.length > 0) {
        const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
        expect(totalWeight).toBeGreaterThanOrEqual(98); // Allow rounding
        expect(totalWeight).toBeLessThanOrEqual(102);
      }
    });
  });

  describe('identifyKeyThemes', () => {
    it('identifies relevant themes', () => {
      const themes = identifyKeyThemes(SAMPLE_RFP);
      expect(themes.length).toBeGreaterThan(0);
    });

    it('detects cloud theme', () => {
      const themes = identifyKeyThemes(SAMPLE_RFP);
      expect(themes).toContain('Cloud & Infrastructure');
    });

    it('detects security theme', () => {
      const themes = identifyKeyThemes(SAMPLE_RFP);
      expect(themes).toContain('Security & Compliance');
    });
  });

  describe('estimateWinProbability', () => {
    it('returns a probability between 5 and 95', () => {
      const prob = estimateWinProbability(5, 8, 10, true);
      expect(prob).toBeGreaterThanOrEqual(5);
      expect(prob).toBeLessThanOrEqual(95);
    });

    it('gives higher probability for more requirements met', () => {
      const low = estimateWinProbability(3, 2, 10, false);
      const high = estimateWinProbability(5, 9, 10, true);
      expect(high).toBeGreaterThan(low);
    });
  });
});
