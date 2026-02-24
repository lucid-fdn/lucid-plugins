// ---------------------------------------------------------------------------
// fixtures.ts -- Test fixtures for Meet
// ---------------------------------------------------------------------------

import type {
  Meeting,
  ActionItem,
  Decision,
  FollowUp,
  MeetingTemplate,
  Attendee,
  AgendaItem,
} from '../../src/core/types/index.js';

export const mockAttendees: Attendee[] = [
  { name: 'Alice', email: 'alice@example.com', role: 'lead' },
  { name: 'Bob', email: 'bob@example.com', role: 'developer' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'designer' },
];

export const mockMeetingCompleted: Meeting = {
  id: 1,
  tenant_id: 'default',
  title: 'Sprint Planning Q1',
  type: 'planning',
  status: 'completed',
  scheduled_at: '2026-01-15T10:00:00Z',
  ended_at: '2026-01-15T11:00:00Z',
  duration_minutes: 60,
  attendees: mockAttendees,
  transcript:
    'Alice: Welcome everyone. Let us review last sprint outcomes. We achieved great progress on the API.\n' +
    'Bob: I will finish the auth module by Friday. Action item: complete auth module.\n' +
    'Charlie: The design system needs to be updated. I should update the component library by end of week.\n' +
    'Alice: Decided to use React for the frontend rewrite. We agreed to prioritize mobile first.\n' +
    'Bob: There is a blocker on the database migration. This is urgent and needs to be resolved asap.\n' +
    'Alice: The team will adopt the new coding standards starting next sprint.',
  summary: 'Sprint planning session covering API progress, auth module, and design system updates.',
  key_topics: ['api', 'auth', 'design', 'react', 'mobile'],
  sentiment: 'positive',
  recording_url: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T11:00:00Z',
};

export const mockMeetingScheduled: Meeting = {
  id: 2,
  tenant_id: 'default',
  title: 'Weekly Standup',
  type: 'standup',
  status: 'scheduled',
  scheduled_at: '2026-02-01T09:00:00Z',
  ended_at: null,
  duration_minutes: null,
  attendees: [{ name: 'Alice' }, { name: 'Bob' }],
  transcript: null,
  summary: null,
  key_topics: [],
  sentiment: null,
  recording_url: null,
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
};

export const mockMeetingNoTranscript: Meeting = {
  id: 3,
  tenant_id: 'default',
  title: 'Client Review',
  type: 'client',
  status: 'completed',
  scheduled_at: '2026-01-20T14:00:00Z',
  ended_at: '2026-01-20T15:00:00Z',
  duration_minutes: 45,
  attendees: mockAttendees.slice(0, 2),
  transcript: null,
  summary: 'Reviewed client deliverables.',
  key_topics: ['deliverables'],
  sentiment: 'neutral',
  recording_url: null,
  created_at: '2026-01-20T14:00:00Z',
  updated_at: '2026-01-20T15:00:00Z',
};

export const mockMeetingReview: Meeting = {
  id: 4,
  tenant_id: 'default',
  title: 'Sprint Review',
  type: 'review',
  status: 'completed',
  scheduled_at: '2026-01-22T14:00:00Z',
  ended_at: '2026-01-22T15:30:00Z',
  duration_minutes: 90,
  attendees: mockAttendees,
  transcript: 'Alice: Let us demo the completed work.\nBob: I have finished the auth module.',
  summary: null,
  key_topics: ['demo', 'auth'],
  sentiment: null,
  recording_url: null,
  created_at: '2026-01-22T14:00:00Z',
  updated_at: '2026-01-22T15:30:00Z',
};

export const mockActionItemPending: ActionItem = {
  id: 1,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Complete auth module',
  description: 'Finish the authentication module implementation',
  assignee: 'Bob',
  due_date: '2026-01-20T00:00:00Z',
  status: 'pending',
  priority: 'high',
  completed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

export const mockActionItemCompleted: ActionItem = {
  id: 2,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Update design system',
  description: 'Update the component library',
  assignee: 'Charlie',
  due_date: '2026-01-19T00:00:00Z',
  status: 'completed',
  priority: 'medium',
  completed_at: '2026-01-18T15:00:00Z',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-18T15:00:00Z',
};

export const mockActionItemOverdue: ActionItem = {
  id: 3,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Fix database migration',
  description: 'Resolve the blocker on DB migration',
  assignee: 'Bob',
  due_date: '2026-01-16T00:00:00Z',
  status: 'pending',
  priority: 'urgent',
  completed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

export const mockActionItemInProgress: ActionItem = {
  id: 4,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Mobile-first redesign',
  description: null,
  assignee: 'Charlie',
  due_date: '2026-02-01T00:00:00Z',
  status: 'in_progress',
  priority: 'medium',
  completed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-20T10:00:00Z',
};

export const mockActionItemCancelled: ActionItem = {
  id: 5,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Legacy cleanup',
  description: null,
  assignee: 'Alice',
  due_date: null,
  status: 'cancelled',
  priority: 'low',
  completed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-17T10:00:00Z',
};

export const mockDecisionApproved: Decision = {
  id: 1,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Use React for frontend rewrite',
  description: 'The team decided to use React for the upcoming frontend rewrite',
  status: 'approved',
  decided_by: 'Alice',
  decided_at: '2026-01-15T10:30:00Z',
  context: 'Framework evaluation',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

export const mockDecisionDeferred: Decision = {
  id: 2,
  tenant_id: 'default',
  meeting_id: 1,
  title: 'Migrate to microservices',
  description: 'Deferred migration until Q2',
  status: 'deferred',
  decided_by: 'team',
  decided_at: null,
  context: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

export const mockFollowUpPending: FollowUp = {
  id: 1,
  tenant_id: 'default',
  meeting_id: 1,
  action_item_id: 1,
  recipient: 'Bob',
  message: 'Reminder: Please complete the auth module by Friday.',
  scheduled_for: '2026-01-18T09:00:00Z',
  sent_at: null,
  status: 'pending',
  created_at: '2026-01-15T10:00:00Z',
};

export const mockFollowUpSent: FollowUp = {
  id: 2,
  tenant_id: 'default',
  meeting_id: 1,
  action_item_id: 2,
  recipient: 'Charlie',
  message: 'Thanks for updating the design system!',
  scheduled_for: '2026-01-19T09:00:00Z',
  sent_at: '2026-01-19T09:05:00Z',
  status: 'sent',
  created_at: '2026-01-15T10:00:00Z',
};

export const mockFollowUpFailed: FollowUp = {
  id: 3,
  tenant_id: 'default',
  meeting_id: 1,
  action_item_id: null,
  recipient: 'team@example.com',
  message: 'Weekly meeting summary.',
  scheduled_for: '2026-01-15T17:00:00Z',
  sent_at: null,
  status: 'failed',
  created_at: '2026-01-15T10:00:00Z',
};

export const mockTemplate: MeetingTemplate = {
  id: 1,
  tenant_id: 'default',
  name: 'Standard Standup',
  type: 'standup',
  agenda_items: [
    { title: 'Yesterday', duration_minutes: 5 },
    { title: 'Today', duration_minutes: 5 },
    { title: 'Blockers', duration_minutes: 5 },
  ],
  default_duration: 15,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const SAMPLE_TRANSCRIPT = `Alice: Good morning everyone. Let's start our sprint planning session.
Bob: Good morning. I want to discuss the progress on the API integration.
Alice: Great. We had excellent progress last week. The API module is almost complete.
Charlie: I agree. The design system is looking good too. I will update the component library by end of week.
Bob: Action item: complete the auth module by Friday. This is high priority.
Alice: Decided to use React for the frontend rewrite.
Charlie: I should prepare the mobile wireframes by next Monday.
Bob: There's a problem with the database migration. It's a blocker and needs to be resolved urgently.
Alice: The team will adopt the new coding standards starting next sprint.
Bob: I will fix the database migration issue by end of day. This is critical and needs to happen asap.
Alice: Let's wrap up. Great session everyone. We accomplished a lot today.`;

export const SAMPLE_TRANSCRIPT_NEGATIVE = `Alice: I'm frustrated with the lack of progress.
Bob: The project has failed to meet deadlines again.
Charlie: This is terrible. We're facing too many problems.
Alice: I'm worried about the timeline. The issues keep piling up.
Bob: We disagree on the approach. This is a blocker.`;

export const SAMPLE_TRANSCRIPT_NEUTRAL = `The meeting covered several topics including project updates and timeline review.
No major concerns were raised during the discussion.
The team reviewed the current status of deliverables.`;

export const SAMPLE_TRANSCRIPT_MIXED = `Alice: Great progress on the frontend. The new design looks amazing.
Bob: However, I'm concerned about the backend performance. There are serious issues with the database.
Charlie: The user feedback has been positive overall, but we're worried about the launch timeline.
Alice: We achieved our sprint goals, which is excellent. But the technical debt is becoming a problem.`;
