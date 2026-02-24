// ---------------------------------------------------------------------------
// agenda-builder.ts -- Generate meeting agendas from context
// ---------------------------------------------------------------------------

import type { MeetingType } from '../types/common.js';
import type { AgendaItem, Meeting, ActionItem } from '../types/database.js';
import { capitalizeFirst } from '../utils/text.js';

export interface BuiltAgenda {
  title: string;
  type: MeetingType;
  estimatedDuration: number;
  items: AgendaItem[];
}

const DEFAULT_AGENDAS: Record<MeetingType, AgendaItem[]> = {
  standup: [
    { title: 'What did you work on yesterday?', duration_minutes: 5 },
    { title: 'What are you working on today?', duration_minutes: 5 },
    { title: 'Any blockers?', duration_minutes: 5 },
  ],
  planning: [
    { title: 'Review previous sprint outcomes', duration_minutes: 10 },
    { title: 'Discuss upcoming priorities', duration_minutes: 20 },
    { title: 'Estimate and assign tasks', duration_minutes: 20 },
    { title: 'Identify risks and dependencies', duration_minutes: 10 },
  ],
  review: [
    { title: 'Demo completed work', duration_minutes: 20 },
    { title: 'Feedback and discussion', duration_minutes: 15 },
    { title: 'Action items from feedback', duration_minutes: 10 },
    { title: 'Retrospective highlights', duration_minutes: 15 },
  ],
  one_on_one: [
    { title: 'Check-in and wellbeing', duration_minutes: 5 },
    { title: 'Progress updates', duration_minutes: 10 },
    { title: 'Challenges and support needed', duration_minutes: 10 },
    { title: 'Career development', duration_minutes: 10 },
    { title: 'Action items', duration_minutes: 5 },
  ],
  all_hands: [
    { title: 'Company updates', duration_minutes: 15 },
    { title: 'Team highlights', duration_minutes: 15 },
    { title: 'Q&A', duration_minutes: 15 },
    { title: 'Upcoming milestones', duration_minutes: 10 },
  ],
  client: [
    { title: 'Introductions', duration_minutes: 5 },
    { title: 'Project status update', duration_minutes: 15 },
    { title: 'Client feedback', duration_minutes: 15 },
    { title: 'Next steps and action items', duration_minutes: 10 },
  ],
  interview: [
    { title: 'Introduction and role overview', duration_minutes: 10 },
    { title: 'Technical/behavioral questions', duration_minutes: 30 },
    { title: 'Candidate questions', duration_minutes: 10 },
    { title: 'Wrap-up and next steps', duration_minutes: 5 },
  ],
  brainstorm: [
    { title: 'Define the problem', duration_minutes: 10 },
    { title: 'Individual ideation', duration_minutes: 10 },
    { title: 'Group discussion', duration_minutes: 20 },
    { title: 'Prioritize ideas', duration_minutes: 10 },
    { title: 'Next steps', duration_minutes: 5 },
  ],
  custom: [
    { title: 'Opening', duration_minutes: 5 },
    { title: 'Main discussion', duration_minutes: 30 },
    { title: 'Action items', duration_minutes: 10 },
    { title: 'Wrap-up', duration_minutes: 5 },
  ],
};

/**
 * Build a meeting agenda based on type, participants, and previous action items.
 */
export function buildAgenda(
  type: MeetingType,
  _participants: string[] = [],
  previousActions: ActionItem[] = [],
): BuiltAgenda {
  const baseItems = [...DEFAULT_AGENDAS[type]];

  // Add carry-over items from previous meetings
  const pendingActions = previousActions.filter(
    (a) => a.status === 'pending' || a.status === 'in_progress',
  );

  if (pendingActions.length > 0) {
    baseItems.unshift({
      title: `Review ${pendingActions.length} pending action item(s) from previous meeting`,
      duration_minutes: Math.min(15, pendingActions.length * 3),
      description: pendingActions.map((a) => `- ${a.title} (${a.assignee})`).join('\n'),
    });
  }

  const estimatedDuration = baseItems.reduce((sum, item) => sum + item.duration_minutes, 0);

  return {
    title: `${capitalizeFirst(type.replace(/_/g, ' '))} Meeting`,
    type,
    estimatedDuration,
    items: baseItems,
  };
}

/**
 * Suggest discussion topics based on recent meeting history.
 */
export function suggestTopics(recentMeetings: Meeting[]): string[] {
  const topics: string[] = [];
  const topicSet = new Set<string>();

  // Collect unresolved topics from recent meetings
  for (const meeting of recentMeetings) {
    if (meeting.key_topics) {
      for (const topic of meeting.key_topics) {
        const normalized = topic.toLowerCase().trim();
        if (!topicSet.has(normalized) && normalized.length > 0) {
          topicSet.add(normalized);
          topics.push(topic);
        }
      }
    }
  }

  // Suggest follow-up on recent meeting types
  const recentTypes = new Set(recentMeetings.map((m) => m.type));
  if (recentTypes.has('planning') && !recentTypes.has('review')) {
    topics.push('Sprint review (planning was done recently)');
  }
  if (recentTypes.has('review') && !recentTypes.has('planning')) {
    topics.push('Next sprint planning (review was done recently)');
  }

  return topics.slice(0, 10);
}

/**
 * Estimate total duration for a set of agenda items.
 */
export function estimateDuration(agenda: AgendaItem[]): number {
  const base = agenda.reduce((sum, item) => sum + item.duration_minutes, 0);
  // Add 10% buffer for transitions
  return Math.ceil(base * 1.1);
}
