// ---------------------------------------------------------------------------
// database.ts -- Entity types for Supabase tables
// ---------------------------------------------------------------------------

import type {
  MeetingType,
  MeetingStatus,
  ActionStatus,
  ActionPriority,
  DecisionStatus,
  SentimentType,
} from './common.js';

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export interface Attendee {
  name: string;
  email?: string;
  role?: string;
}

export interface Meeting {
  id: number;
  tenant_id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  attendees: Attendee[];
  transcript: string | null;
  summary: string | null;
  key_topics: string[];
  sentiment: SentimentType | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingInsert {
  tenant_id?: string;
  title: string;
  type: MeetingType;
  status?: MeetingStatus;
  scheduled_at: string;
  ended_at?: string | null;
  duration_minutes?: number | null;
  attendees?: Attendee[];
  transcript?: string | null;
  summary?: string | null;
  key_topics?: string[];
  sentiment?: SentimentType | null;
  recording_url?: string | null;
}

// ---------------------------------------------------------------------------
// Action Items
// ---------------------------------------------------------------------------

export interface ActionItem {
  id: number;
  tenant_id: string;
  meeting_id: number;
  title: string;
  description: string | null;
  assignee: string;
  due_date: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionItemInsert {
  tenant_id?: string;
  meeting_id: number;
  title: string;
  description?: string | null;
  assignee: string;
  due_date?: string | null;
  status?: ActionStatus;
  priority?: ActionPriority;
  completed_at?: string | null;
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export interface Decision {
  id: number;
  tenant_id: string;
  meeting_id: number;
  title: string;
  description: string | null;
  status: DecisionStatus;
  decided_by: string;
  decided_at: string | null;
  context: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionInsert {
  tenant_id?: string;
  meeting_id: number;
  title: string;
  description?: string | null;
  status?: DecisionStatus;
  decided_by: string;
  decided_at?: string | null;
  context?: string | null;
}

// ---------------------------------------------------------------------------
// Follow-Ups
// ---------------------------------------------------------------------------

export interface FollowUp {
  id: number;
  tenant_id: string;
  meeting_id: number | null;
  action_item_id: number | null;
  recipient: string;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface FollowUpInsert {
  tenant_id?: string;
  meeting_id?: number | null;
  action_item_id?: number | null;
  recipient: string;
  message: string;
  scheduled_for: string;
  sent_at?: string | null;
  status?: 'pending' | 'sent' | 'failed';
}

// ---------------------------------------------------------------------------
// Meeting Templates
// ---------------------------------------------------------------------------

export interface AgendaItem {
  title: string;
  duration_minutes: number;
  description?: string;
}

export interface MeetingTemplate {
  id: number;
  tenant_id: string;
  name: string;
  type: MeetingType;
  agenda_items: AgendaItem[];
  default_duration: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingTemplateInsert {
  tenant_id?: string;
  name: string;
  type: MeetingType;
  agenda_items?: AgendaItem[];
  default_duration?: number;
}
