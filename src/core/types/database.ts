// ---------------------------------------------------------------------------
// database.ts -- Entity types for Supabase tables
// ---------------------------------------------------------------------------

import type { Channel, Sentiment, Category, FeedbackStatus, PriorityLevel } from './common.js';

// ---------------------------------------------------------------------------
// Feedback Items
// ---------------------------------------------------------------------------

export interface FeedbackItem {
  id: number;
  tenant_id: string;
  channel: Channel;
  content: string;
  author_name: string | null;
  author_email: string | null;
  rating: number | null;
  nps_score: number | null;
  sentiment: Sentiment | null;
  category: Category | null;
  tags: string[];
  status: FeedbackStatus;
  priority: PriorityLevel | null;
  response: string | null;
  responded_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItemInsert {
  tenant_id?: string;
  channel: Channel;
  content: string;
  author_name?: string | null;
  author_email?: string | null;
  rating?: number | null;
  nps_score?: number | null;
  sentiment?: Sentiment | null;
  category?: Category | null;
  tags?: string[];
  status?: FeedbackStatus;
  priority?: PriorityLevel | null;
  response?: string | null;
  responded_at?: string | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Feedback Surveys
// ---------------------------------------------------------------------------

export interface FeedbackSurvey {
  id: number;
  tenant_id: string;
  name: string;
  questions: SurveyQuestion[];
  channel: Channel;
  response_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'nps' | 'multiple_choice';
  options?: string[];
  required?: boolean;
}

export interface FeedbackSurveyInsert {
  tenant_id?: string;
  name: string;
  questions: SurveyQuestion[];
  channel: Channel;
  response_count?: number;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Feedback Trends
// ---------------------------------------------------------------------------

export interface FeedbackTrend {
  id: number;
  tenant_id: string;
  period: string;
  category: Category | null;
  sentiment_avg: number;
  volume: number;
  nps_score: number | null;
  top_themes: string[];
  created_at: string;
}

export interface FeedbackTrendInsert {
  tenant_id?: string;
  period: string;
  category?: Category | null;
  sentiment_avg: number;
  volume: number;
  nps_score?: number | null;
  top_themes?: string[];
}

// ---------------------------------------------------------------------------
// Feedback Responses
// ---------------------------------------------------------------------------

export interface FeedbackResponse {
  id: number;
  tenant_id: string;
  feedback_id: number;
  responder: string;
  content: string;
  sent_via: string | null;
  created_at: string;
}

export interface FeedbackResponseInsert {
  tenant_id?: string;
  feedback_id: number;
  responder: string;
  content: string;
  sent_via?: string | null;
}
