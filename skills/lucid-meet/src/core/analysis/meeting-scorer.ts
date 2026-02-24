// ---------------------------------------------------------------------------
// meeting-scorer.ts -- Meeting effectiveness scoring and analytics
// ---------------------------------------------------------------------------

import type { Meeting, ActionItem, FollowUp } from '../types/database.js';

export interface MeetingScore {
  overall: number;
  hasAgenda: boolean;
  hasSummary: boolean;
  hasActionItems: boolean;
  hasDecisions: boolean;
  durationEfficiency: number;
  attendeeCount: number;
  topicsCovered: number;
}

export interface ActionMetrics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageCompletionDays: number;
}

export interface BottleneckInfo {
  assignee: string;
  overdueCount: number;
  pendingCount: number;
  oldestOverdueDays: number;
}

export interface FollowUpMetrics {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  followUpRate: number;
}

/**
 * Score a meeting's effectiveness on a 0-100 scale.
 */
export function scoreMeetingEffectiveness(
  meeting: Meeting,
  actionCount: number = 0,
  decisionCount: number = 0,
): MeetingScore {
  let score = 0;

  const hasAgenda = (meeting.key_topics?.length ?? 0) > 0;
  const hasSummary = !!meeting.summary;
  const hasActionItems = actionCount > 0;
  const hasDecisions = decisionCount > 0;
  const attendeeCount = meeting.attendees?.length ?? 0;
  const topicsCovered = meeting.key_topics?.length ?? 0;

  // Summary present (20 points)
  if (hasSummary) score += 20;

  // Action items captured (20 points)
  if (hasActionItems) score += Math.min(20, actionCount * 5);

  // Decisions documented (15 points)
  if (hasDecisions) score += Math.min(15, decisionCount * 5);

  // Topics/agenda coverage (15 points)
  if (hasAgenda) score += Math.min(15, topicsCovered * 3);

  // Reasonable attendee count: 2-8 is ideal (10 points)
  if (attendeeCount >= 2 && attendeeCount <= 8) {
    score += 10;
  } else if (attendeeCount > 0) {
    score += 5;
  }

  // Duration efficiency: meetings under 60 min (10 points)
  let durationEfficiency = 0;
  if (meeting.duration_minutes) {
    if (meeting.duration_minutes <= 30) {
      durationEfficiency = 100;
      score += 10;
    } else if (meeting.duration_minutes <= 60) {
      durationEfficiency = 80;
      score += 8;
    } else if (meeting.duration_minutes <= 90) {
      durationEfficiency = 50;
      score += 5;
    } else {
      durationEfficiency = 20;
      score += 2;
    }
  }

  // Meeting completed (10 points)
  if (meeting.status === 'completed') score += 10;

  return {
    overall: Math.min(100, score),
    hasAgenda,
    hasSummary,
    hasActionItems,
    hasDecisions,
    durationEfficiency,
    attendeeCount,
    topicsCovered,
  };
}

/**
 * Calculate action item completion rate and metrics.
 */
export function calculateActionCompletionRate(actions: ActionItem[]): ActionMetrics {
  if (actions.length === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0,
      averageCompletionDays: 0,
    };
  }

  const completed = actions.filter((a) => a.status === 'completed');
  const pending = actions.filter((a) => a.status === 'pending' || a.status === 'in_progress');
  const now = Date.now();
  const overdue = pending.filter((a) => a.due_date && new Date(a.due_date).getTime() < now);

  // Average completion days
  let totalCompletionDays = 0;
  let completionCount = 0;
  for (const a of completed) {
    if (a.completed_at) {
      const created = new Date(a.created_at).getTime();
      const completedAt = new Date(a.completed_at).getTime();
      const days = (completedAt - created) / (1000 * 60 * 60 * 24);
      totalCompletionDays += days;
      completionCount++;
    }
  }

  return {
    total: actions.length,
    completed: completed.length,
    pending: pending.length,
    overdue: overdue.length,
    completionRate: actions.length > 0 ? (completed.length / actions.length) * 100 : 0,
    averageCompletionDays: completionCount > 0 ? totalCompletionDays / completionCount : 0,
  };
}

/**
 * Identify bottlenecks in action item completion.
 */
export function identifyBottlenecks(actions: ActionItem[]): BottleneckInfo[] {
  const byAssignee = new Map<string, { overdue: ActionItem[]; pending: ActionItem[] }>();
  const now = Date.now();

  for (const action of actions) {
    if (action.status === 'completed' || action.status === 'cancelled') continue;

    const existing = byAssignee.get(action.assignee) ?? { overdue: [], pending: [] };

    if (action.due_date && new Date(action.due_date).getTime() < now) {
      existing.overdue.push(action);
    }
    existing.pending.push(action);

    byAssignee.set(action.assignee, existing);
  }

  const bottlenecks: BottleneckInfo[] = [];
  for (const [assignee, data] of byAssignee) {
    if (data.overdue.length === 0) continue;

    let oldestOverdueDays = 0;
    for (const a of data.overdue) {
      if (a.due_date) {
        const days = (now - new Date(a.due_date).getTime()) / (1000 * 60 * 60 * 24);
        if (days > oldestOverdueDays) oldestOverdueDays = days;
      }
    }

    bottlenecks.push({
      assignee,
      overdueCount: data.overdue.length,
      pendingCount: data.pending.length,
      oldestOverdueDays: Math.round(oldestOverdueDays),
    });
  }

  return bottlenecks.sort((a, b) => b.overdueCount - a.overdueCount);
}

/**
 * Measure follow-up rate.
 */
export function measureFollowUpRate(followUps: FollowUp[]): FollowUpMetrics {
  if (followUps.length === 0) {
    return {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      followUpRate: 0,
    };
  }

  const sent = followUps.filter((f) => f.status === 'sent').length;
  const pending = followUps.filter((f) => f.status === 'pending').length;
  const failed = followUps.filter((f) => f.status === 'failed').length;

  return {
    total: followUps.length,
    sent,
    pending,
    failed,
    followUpRate: (sent / followUps.length) * 100,
  };
}
