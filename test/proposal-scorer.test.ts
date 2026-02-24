import { describe, it, expect } from 'vitest';
import {
  scoreProposal,
  checkCompleteness,
  assessClarity,
  evaluatePricingAlignment,
  checkCompliance,
} from '../src/core/analysis/proposal-scorer.js';
import type { Proposal, ProposalSectionData } from '../src/core/types/database.js';

function makeSection(
  type: string,
  content: string,
  title: string = 'Test Section',
): ProposalSectionData {
  return {
    section_type: type as ProposalSectionData['section_type'],
    title,
    content,
    sort_order: 0,
    is_included: true,
  };
}

function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 'test-id',
    tenant_id: 'tenant-1',
    title: 'Test Proposal',
    client_name: 'Acme Corp',
    client_email: 'client@acme.com',
    status: 'draft',
    rfp_content: null,
    sections: [],
    pricing_model: 'fixed',
    total_amount: null,
    currency: 'USD',
    valid_until: null,
    submitted_at: null,
    viewed_at: null,
    decided_at: null,
    template_id: null,
    win_probability: null,
    tags: [],
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('proposal-scorer', () => {
  describe('checkCompleteness', () => {
    it('returns 0 for empty sections', () => {
      expect(checkCompleteness([])).toBe(0);
    });

    it('scores higher with key sections present', () => {
      const sections = [
        makeSection('executive_summary', 'This is a comprehensive executive summary that covers all the key points of our proposal and demonstrates our understanding of the project requirements.'),
        makeSection('solution', 'Our solution addresses all the requirements specified in the RFP by implementing a comprehensive platform that integrates seamlessly with existing systems.'),
        makeSection('pricing', 'The total project cost is $150,000 broken down by phase with clear deliverables and payment milestones for each stage of the engagement.'),
      ];
      const score = checkCompleteness(sections);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(30);
    });

    it('gives max points for all key sections with rich content', () => {
      const longContent = 'This is detailed content. '.repeat(20);
      const sections = [
        makeSection('executive_summary', longContent),
        makeSection('problem_statement', longContent),
        makeSection('solution', longContent),
        makeSection('pricing', longContent),
        makeSection('timeline', longContent),
      ];
      const score = checkCompleteness(sections);
      expect(score).toBeGreaterThanOrEqual(20);
      expect(score).toBeLessThanOrEqual(30);
    });

    it('ignores excluded sections', () => {
      const sections = [
        { ...makeSection('executive_summary', 'content'), is_included: false },
      ];
      expect(checkCompleteness(sections)).toBe(0);
    });
  });

  describe('assessClarity', () => {
    it('returns 0 for empty sections', () => {
      expect(assessClarity([])).toBe(0);
    });

    it('scores readable content higher', () => {
      const clearContent = 'We build great software. Our team is experienced. The project will take three months. We deliver on time.';
      const sections = [makeSection('solution', clearContent, 'Our Solution')];
      const score = assessClarity(sections);
      expect(score).toBeGreaterThan(0);
    });

    it('gives structure points for titled sections', () => {
      const sections = [
        makeSection('solution', 'We propose a comprehensive solution.', 'Solution Overview'),
        makeSection('timeline', 'The project spans six months.', 'Project Timeline'),
      ];
      const score = assessClarity(sections);
      expect(score).toBeGreaterThan(0);
    });

    it('caps at 25', () => {
      const sections = Array.from({ length: 10 }, (_, i) =>
        makeSection('custom', 'Clear simple text here.', `Section ${i + 1}`),
      );
      const score = assessClarity(sections);
      expect(score).toBeLessThanOrEqual(25);
    });
  });

  describe('evaluatePricingAlignment', () => {
    it('gives 0 when no pricing model and no amount', () => {
      expect(evaluatePricingAlignment(null, '')).toBe(0);
    });

    it('gives points for pricing model', () => {
      const score = evaluatePricingAlignment(null, 'fixed');
      expect(score).toBe(10);
    });

    it('gives maximum points for model + reasonable amount', () => {
      const score = evaluatePricingAlignment(50000, 'fixed');
      expect(score).toBe(25);
    });

    it('gives partial points for extreme amounts', () => {
      const score = evaluatePricingAlignment(50, 'hourly');
      expect(score).toBe(20); // has model + amount, but not "reasonable"
    });
  });

  describe('checkCompliance', () => {
    it('gives base points when no RFP requirements', () => {
      const proposal = makeProposal({ sections: [makeSection('solution', 'content')] });
      const score = checkCompliance(proposal, []);
      expect(score).toBe(15);
    });

    it('gives lower base when no content and no requirements', () => {
      const proposal = makeProposal({ sections: [] });
      const score = checkCompliance(proposal, []);
      expect(score).toBe(5);
    });

    it('scores based on requirement coverage', () => {
      const proposal = makeProposal({
        sections: [
          makeSection('solution', 'Our cloud-based platform provides security and analytics.'),
        ],
      });
      const requirements = [
        'Must provide cloud infrastructure',
        'Must include security features',
        'Should have reporting capabilities',
      ];
      const score = checkCompliance(proposal, requirements);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(20);
    });
  });

  describe('scoreProposal', () => {
    it('returns a complete score object', () => {
      const proposal = makeProposal({
        sections: [makeSection('executive_summary', 'Our proposal summary.', 'Executive Summary')],
        total_amount: 50000,
        pricing_model: 'fixed',
      });
      const result = scoreProposal(proposal);

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('suggestions');
      expect(result.breakdown).toHaveProperty('completeness');
      expect(result.breakdown).toHaveProperty('clarity');
      expect(result.breakdown).toHaveProperty('pricing_alignment');
      expect(result.breakdown).toHaveProperty('compliance');
      expect(result.total).toBe(
        result.breakdown.completeness +
          result.breakdown.clarity +
          result.breakdown.pricing_alignment +
          result.breakdown.compliance,
      );
    });

    it('gives suggestions for incomplete proposals', () => {
      const proposal = makeProposal({ sections: [] });
      const result = scoreProposal(proposal);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});
