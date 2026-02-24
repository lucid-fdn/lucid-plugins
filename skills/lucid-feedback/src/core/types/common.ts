// ---------------------------------------------------------------------------
// common.ts -- Enums and constants for the feedback plugin
// ---------------------------------------------------------------------------

export type Channel =
  | 'email'
  | 'survey'
  | 'nps'
  | 'app_store'
  | 'g2'
  | 'trustpilot'
  | 'twitter'
  | 'support_ticket'
  | 'intercom'
  | 'manual';
export const CHANNELS: Channel[] = [
  'email',
  'survey',
  'nps',
  'app_store',
  'g2',
  'trustpilot',
  'twitter',
  'support_ticket',
  'intercom',
  'manual',
];

export type Sentiment = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
export const SENTIMENTS: Sentiment[] = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'];

export type FeedbackStatus = 'new' | 'reviewed' | 'actioned' | 'archived';
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'actioned', 'archived'];

export type Category =
  | 'bug'
  | 'feature_request'
  | 'ux'
  | 'performance'
  | 'pricing'
  | 'support'
  | 'documentation'
  | 'general';
export const CATEGORIES: Category[] = [
  'bug',
  'feature_request',
  'ux',
  'performance',
  'pricing',
  'support',
  'documentation',
  'general',
];

export type NpsType = 'detractor' | 'passive' | 'promoter';
export const NPS_TYPES: NpsType[] = ['detractor', 'passive', 'promoter'];

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export const PRIORITY_LEVELS: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];
