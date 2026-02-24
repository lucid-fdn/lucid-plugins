import type { ProposalStatus, PricingModel, SectionType, TemplateCategory } from './common.js';

export interface Proposal {
  id: string;
  tenant_id: string;
  title: string;
  client_name: string;
  client_email: string;
  status: ProposalStatus;
  rfp_content: string | null;
  sections: ProposalSectionData[];
  pricing_model: PricingModel;
  total_amount: number | null;
  currency: string;
  valid_until: string | null;
  submitted_at: string | null;
  viewed_at: string | null;
  decided_at: string | null;
  template_id: string | null;
  win_probability: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalSectionData {
  section_type: SectionType;
  title: string;
  content: string;
  sort_order: number;
  is_included: boolean;
}

export interface ProposalSection {
  id: string;
  proposal_id: string;
  section_type: SectionType;
  title: string;
  content: string;
  sort_order: number;
  is_included: boolean;
}

export interface Template {
  id: string;
  tenant_id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  sections: ProposalSectionData[];
  default_pricing: PricingModel;
  is_active: boolean;
  use_count: number;
  win_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type AnalyticsEventType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'section_viewed'
  | 'accepted'
  | 'rejected';

export interface ProposalAnalytics {
  id: string;
  proposal_id: string;
  event_type: AnalyticsEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RfpAnalysis {
  requirements: Requirement[];
  evaluation_criteria: Criterion[];
  deadlines: string[];
  budget_hints: string[];
  key_themes: string[];
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'must_have' | 'nice_to_have' | 'optional';
  category: string;
}

export interface Criterion {
  name: string;
  weight: number;
  description: string;
}

export interface PricingBreakdown {
  subtotal: number;
  contingency: number;
  total: number;
  currency: string;
  line_items: PricingLineItem[];
}

export interface PricingLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RetainerPricing {
  monthly_hours: number;
  hourly_rate: number;
  monthly_total: number;
  discount_percentage: number;
  discounted_monthly: number;
  annual_total: number;
  currency: string;
}

export interface MilestoneItem {
  name: string;
  percentage: number;
  amount: number;
  description: string;
}

export interface ProposalScore {
  total: number;
  breakdown: {
    completeness: number;
    clarity: number;
    pricing_alignment: number;
    compliance: number;
  };
  suggestions: string[];
}

export interface ProposalComparison {
  proposals: Array<{
    id: string;
    title: string;
    client_name: string;
    status: ProposalStatus;
    total_amount: number | null;
    win_probability: number | null;
    score: ProposalScore;
    section_count: number;
    created_at: string;
  }>;
  summary: {
    highest_value: string;
    best_score: string;
    most_complete: string;
  };
}

export interface AnalyticsSummary {
  total_proposals: number;
  proposals_by_status: Record<string, number>;
  win_rate: number;
  avg_deal_size: number;
  total_pipeline_value: number;
  avg_time_to_close_days: number;
  recent_activity: ProposalAnalytics[];
}
