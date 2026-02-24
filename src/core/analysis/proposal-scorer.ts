import type { Proposal, ProposalSectionData, ProposalScore } from '../types/database.js';
import { SECTION_TYPES, type SectionType } from '../types/common.js';
import { readabilityScore, wordCount } from '../utils/text.js';

/** Key section types that a complete proposal should include. */
const KEY_SECTIONS: SectionType[] = [
  'executive_summary',
  'problem_statement',
  'solution',
  'pricing',
  'timeline',
];

/**
 * Score a proposal on completeness, clarity, pricing alignment, and compliance.
 * Returns a total score (0-100) and a breakdown.
 */
export function scoreProposal(
  proposal: Proposal,
  rfpRequirements: string[] = [],
): ProposalScore {
  const completeness = checkCompleteness(proposal.sections);
  const clarity = assessClarity(proposal.sections);
  const pricingAlignment = evaluatePricingAlignment(proposal.total_amount, proposal.pricing_model);
  const compliance = checkCompliance(proposal, rfpRequirements);

  const total = completeness + clarity + pricingAlignment + compliance;
  const suggestions = generateSuggestions(proposal, {
    completeness,
    clarity,
    pricing_alignment: pricingAlignment,
    compliance,
  });

  return {
    total,
    breakdown: {
      completeness,
      clarity,
      pricing_alignment: pricingAlignment,
      compliance,
    },
    suggestions,
  };
}

/**
 * Check completeness of the proposal sections (0-30 points).
 */
export function checkCompleteness(sections: ProposalSectionData[]): number {
  if (!sections || sections.length === 0) return 0;

  const includedSections = sections.filter((s) => s.is_included);
  const includedTypes = new Set(includedSections.map((s) => s.section_type));

  // Points for having key sections
  let keySectionPoints = 0;
  for (const keyType of KEY_SECTIONS) {
    if (includedTypes.has(keyType)) {
      keySectionPoints += 4; // 5 key sections * 4 = 20 max
    }
  }

  // Points for section content depth
  let contentPoints = 0;
  for (const section of includedSections) {
    const wc = wordCount(section.content);
    if (wc >= 100) contentPoints += 2;
    else if (wc >= 50) contentPoints += 1;
  }
  contentPoints = Math.min(contentPoints, 10);

  return Math.min(30, keySectionPoints + contentPoints);
}

/**
 * Assess clarity of the proposal content (0-25 points).
 */
export function assessClarity(sections: ProposalSectionData[]): number {
  if (!sections || sections.length === 0) return 0;

  const includedSections = sections.filter((s) => s.is_included && s.content.trim().length > 0);
  if (includedSections.length === 0) return 0;

  // Average readability across sections
  let totalReadability = 0;
  for (const section of includedSections) {
    totalReadability += readabilityScore(section.content);
  }
  const avgReadability = totalReadability / includedSections.length;

  // Readability points (0-15)
  const readabilityPoints = Math.round((avgReadability / 100) * 15);

  // Structure points — sections with proper titles get points (0-10)
  let structurePoints = 0;
  for (const section of includedSections) {
    if (section.title && section.title.trim().length > 0) {
      structurePoints += 2;
    }
  }
  structurePoints = Math.min(structurePoints, 10);

  return Math.min(25, readabilityPoints + structurePoints);
}

/**
 * Evaluate pricing alignment (0-25 points).
 */
export function evaluatePricingAlignment(
  totalAmount: number | null,
  pricingModel: string,
): number {
  let points = 0;

  // Has a pricing model defined
  if (pricingModel) points += 10;

  // Has a total amount specified
  if (totalAmount != null && totalAmount > 0) points += 10;

  // Reasonable amount check (not $0, not absurdly high)
  if (totalAmount != null && totalAmount > 100 && totalAmount < 10_000_000) {
    points += 5;
  }

  return Math.min(25, points);
}

/**
 * Check compliance against RFP requirements (0-20 points).
 */
export function checkCompliance(
  proposal: Proposal,
  rfpRequirements: string[] = [],
): number {
  if (rfpRequirements.length === 0) {
    // If no RFP requirements provided, give base points for having content
    const hasContent = proposal.sections && proposal.sections.length > 0;
    return hasContent ? 15 : 5;
  }

  const allContent = proposal.sections
    .filter((s) => s.is_included)
    .map((s) => `${s.title} ${s.content}`)
    .join(' ')
    .toLowerCase();

  let metRequirements = 0;
  for (const req of rfpRequirements) {
    const keywords = req.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matched = keywords.some((kw) => allContent.includes(kw));
    if (matched) metRequirements++;
  }

  const complianceRate = rfpRequirements.length > 0
    ? metRequirements / rfpRequirements.length
    : 0;

  return Math.round(complianceRate * 20);
}

function generateSuggestions(
  proposal: Proposal,
  breakdown: ProposalScore['breakdown'],
): string[] {
  const suggestions: string[] = [];

  if (breakdown.completeness < 15) {
    const includedTypes = new Set(
      (proposal.sections ?? []).filter((s) => s.is_included).map((s) => s.section_type),
    );
    const missing = KEY_SECTIONS.filter((t) => !includedTypes.has(t));
    if (missing.length > 0) {
      suggestions.push(`Add missing key sections: ${missing.join(', ')}`);
    }
  }

  if (breakdown.clarity < 12) {
    suggestions.push('Improve readability: use shorter sentences and simpler language');
  }

  if (breakdown.pricing_alignment < 15) {
    if (!proposal.total_amount) {
      suggestions.push('Add a total amount to the proposal pricing');
    }
    if (!proposal.pricing_model) {
      suggestions.push('Specify a pricing model');
    }
  }

  if (breakdown.compliance < 10) {
    suggestions.push('Review RFP requirements and ensure all are addressed in the proposal');
  }

  if (suggestions.length === 0 && breakdown.completeness + breakdown.clarity + breakdown.pricing_alignment + breakdown.compliance >= 80) {
    suggestions.push('Proposal looks strong! Consider adding case studies for extra impact.');
  }

  return suggestions;
}
