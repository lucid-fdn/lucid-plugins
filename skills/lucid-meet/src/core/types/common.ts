// ---------------------------------------------------------------------------
// common.ts -- Enums and constants for the meet plugin
// ---------------------------------------------------------------------------

export type MeetingType =
  | 'standup'
  | 'planning'
  | 'review'
  | 'one_on_one'
  | 'all_hands'
  | 'client'
  | 'interview'
  | 'brainstorm'
  | 'custom';
export const MEETING_TYPES: MeetingType[] = [
  'standup',
  'planning',
  'review',
  'one_on_one',
  'all_hands',
  'client',
  'interview',
  'brainstorm',
  'custom',
];

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export const MEETING_STATUSES: MeetingStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export const ACTION_STATUSES: ActionStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export const ACTION_PRIORITIES: ActionPriority[] = ['low', 'medium', 'high', 'urgent'];

export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'deferred';
export const DECISION_STATUSES: DecisionStatus[] = ['proposed', 'approved', 'rejected', 'deferred'];

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';
export const SENTIMENT_TYPES: SentimentType[] = ['positive', 'neutral', 'negative', 'mixed'];
