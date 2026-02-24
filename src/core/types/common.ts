export const PROPOSAL_STATUSES = [
  'draft',
  'review',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const SECTION_TYPES = [
  'executive_summary',
  'problem_statement',
  'solution',
  'methodology',
  'timeline',
  'team',
  'pricing',
  'case_study',
  'references',
  'terms',
  'appendix',
  'custom',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const PRICING_MODELS = [
  'fixed',
  'hourly',
  'retainer',
  'milestone',
  'value_based',
  'subscription',
] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const TEMPLATE_CATEGORIES = [
  'saas',
  'consulting',
  'development',
  'marketing',
  'design',
  'infrastructure',
  'general',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
