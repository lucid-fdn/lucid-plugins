// ---------------------------------------------------------------------------
// meeting-scorer.test.ts -- Tests for meeting effectiveness scoring
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  scoreMeetingEffectiveness,
  calculateActionCompletionRate,
  identifyBottlenecks,
  measureFollowUpRate,
} from '../../src/core/analysis/meeting-scorer.js';
import {
  mockMeetingCompleted,
  mockMeetingScheduled,
  mockMeetingNoTranscript,
  mockActionItemPending,
  mockActionItemCompleted,
  mockActionItemOverdue,
  mockActionItemInProgress,
  mockActionItemCancelled,
  mockFollowUpPending,
  mockFollowUpSent,
  mockFollowUpFailed,
} from '../helpers/fixtures.js';

// ---------------------------------------------------------------------------
// scoreMeetingEffectiveness
// ---------------------------------------------------------------------------

describe('scoreMeetingEffectiveness', () => {
  it('scores a completed meeting with full data', () => {
    const score = scoreMeetingEffectiveness(mockMeetingCompleted, 3, 2);
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('awards points for having a summary', () => {
    const withSummary = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    const withoutSummary = scoreMeetingEffectiveness(mockMeetingScheduled, 0, 0);
    expect(withSummary.hasSummary).toBe(true);
    expect(withoutSummary.hasSummary).toBe(false);
    expect(withSummary.overall).toBeGreaterThan(withoutSummary.overall);
  });

  it('awards points for action items', () => {
    const withActions = scoreMeetingEffectiveness(mockMeetingCompleted, 3, 0);
    const withoutActions = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    expect(withActions.hasActionItems).toBe(true);
    expect(withoutActions.hasActionItems).toBe(false);
    expect(withActions.overall).toBeGreaterThan(withoutActions.overall);
  });

  it('awards points for decisions', () => {
    const withDecisions = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 2);
    const withoutDecisions = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    expect(withDecisions.hasDecisions).toBe(true);
    expect(withoutDecisions.hasDecisions).toBe(false);
    expect(withDecisions.overall).toBeGreaterThan(withoutDecisions.overall);
  });

  it('awards points for key topics / agenda', () => {
    const score = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    expect(score.hasAgenda).toBe(true);
    expect(score.topicsCovered).toBeGreaterThan(0);
  });

  it('awards points for optimal attendee count (2-8)', () => {
    const score = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    expect(score.attendeeCount).toBe(3);
  });

  it('handles short meeting duration (30 min or less)', () => {
    const shortMeeting = { ...mockMeetingCompleted, duration_minutes: 25 };
    const score = scoreMeetingEffectiveness(shortMeeting, 0, 0);
    expect(score.durationEfficiency).toBe(100);
  });

  it('handles medium meeting duration (31-60 min)', () => {
    const score = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    expect(score.durationEfficiency).toBe(80);
  });

  it('handles long meeting duration (61-90 min)', () => {
    const longMeeting = { ...mockMeetingCompleted, duration_minutes: 75 };
    const score = scoreMeetingEffectiveness(longMeeting, 0, 0);
    expect(score.durationEfficiency).toBe(50);
  });

  it('handles very long meeting duration (90+ min)', () => {
    const veryLongMeeting = { ...mockMeetingCompleted, duration_minutes: 120 };
    const score = scoreMeetingEffectiveness(veryLongMeeting, 0, 0);
    expect(score.durationEfficiency).toBe(20);
  });

  it('awards points for completed status', () => {
    const completed = scoreMeetingEffectiveness(mockMeetingCompleted, 0, 0);
    const scheduled = scoreMeetingEffectiveness(mockMeetingScheduled, 0, 0);
    expect(completed.overall).toBeGreaterThan(scheduled.overall);
  });

  it('caps score at 100', () => {
    const maxMeeting = { ...mockMeetingCompleted, duration_minutes: 25 };
    const score = scoreMeetingEffectiveness(maxMeeting, 10, 10);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('handles meeting with no duration', () => {
    const score = scoreMeetingEffectiveness(mockMeetingScheduled, 0, 0);
    expect(score.durationEfficiency).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateActionCompletionRate
// ---------------------------------------------------------------------------

describe('calculateActionCompletionRate', () => {
  it('returns zero metrics for empty actions', () => {
    const metrics = calculateActionCompletionRate([]);
    expect(metrics.total).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.completionRate).toBe(0);
    expect(metrics.averageCompletionDays).toBe(0);
  });

  it('calculates correct completion rate', () => {
    const metrics = calculateActionCompletionRate([
      mockActionItemCompleted,
      mockActionItemPending,
    ]);
    expect(metrics.total).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.completionRate).toBe(50);
  });

  it('counts pending and in_progress items', () => {
    const metrics = calculateActionCompletionRate([
      mockActionItemPending,
      mockActionItemInProgress,
      mockActionItemCompleted,
    ]);
    expect(metrics.pending).toBe(2);
    expect(metrics.completed).toBe(1);
  });

  it('detects overdue items', () => {
    const metrics = calculateActionCompletionRate([
      mockActionItemOverdue,
      mockActionItemPending,
    ]);
    expect(metrics.overdue).toBeGreaterThanOrEqual(1);
  });

  it('calculates average completion days', () => {
    const metrics = calculateActionCompletionRate([mockActionItemCompleted]);
    expect(metrics.averageCompletionDays).toBeGreaterThan(0);
  });

  it('handles all completed items', () => {
    const metrics = calculateActionCompletionRate([mockActionItemCompleted]);
    expect(metrics.completionRate).toBe(100);
  });

  it('handles mixed statuses', () => {
    const metrics = calculateActionCompletionRate([
      mockActionItemPending,
      mockActionItemCompleted,
      mockActionItemInProgress,
      mockActionItemOverdue,
      mockActionItemCancelled,
    ]);
    expect(metrics.total).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// identifyBottlenecks
// ---------------------------------------------------------------------------

describe('identifyBottlenecks', () => {
  it('returns empty for no actions', () => {
    const bottlenecks = identifyBottlenecks([]);
    expect(bottlenecks).toEqual([]);
  });

  it('returns empty when no overdue items', () => {
    const futureAction = {
      ...mockActionItemPending,
      due_date: '2099-01-01T00:00:00Z',
    };
    const bottlenecks = identifyBottlenecks([futureAction]);
    expect(bottlenecks).toEqual([]);
  });

  it('identifies assignees with overdue items', () => {
    const bottlenecks = identifyBottlenecks([mockActionItemOverdue]);
    expect(bottlenecks.length).toBeGreaterThanOrEqual(1);
    expect(bottlenecks[0].assignee).toBe('Bob');
    expect(bottlenecks[0].overdueCount).toBeGreaterThanOrEqual(1);
  });

  it('sorts by overdue count descending', () => {
    const extraOverdue = {
      ...mockActionItemOverdue,
      id: 99,
      assignee: 'Dave',
      due_date: '2020-01-01T00:00:00Z',
    };
    const bottlenecks = identifyBottlenecks([
      mockActionItemOverdue,
      extraOverdue,
      { ...extraOverdue, id: 100 },
    ]);
    // Dave has 2 overdue, Bob has 1
    if (bottlenecks.length >= 2) {
      expect(bottlenecks[0].overdueCount).toBeGreaterThanOrEqual(bottlenecks[1].overdueCount);
    }
  });

  it('excludes completed and cancelled items', () => {
    const bottlenecks = identifyBottlenecks([
      mockActionItemCompleted,
      mockActionItemCancelled,
    ]);
    expect(bottlenecks).toEqual([]);
  });

  it('calculates oldest overdue days', () => {
    const bottlenecks = identifyBottlenecks([mockActionItemOverdue]);
    expect(bottlenecks[0].oldestOverdueDays).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// measureFollowUpRate
// ---------------------------------------------------------------------------

describe('measureFollowUpRate', () => {
  it('returns zero metrics for empty follow-ups', () => {
    const metrics = measureFollowUpRate([]);
    expect(metrics.total).toBe(0);
    expect(metrics.sent).toBe(0);
    expect(metrics.followUpRate).toBe(0);
  });

  it('calculates correct follow-up rate', () => {
    const metrics = measureFollowUpRate([mockFollowUpSent, mockFollowUpPending]);
    expect(metrics.total).toBe(2);
    expect(metrics.sent).toBe(1);
    expect(metrics.followUpRate).toBe(50);
  });

  it('counts pending follow-ups', () => {
    const metrics = measureFollowUpRate([mockFollowUpPending]);
    expect(metrics.pending).toBe(1);
  });

  it('counts failed follow-ups', () => {
    const metrics = measureFollowUpRate([mockFollowUpFailed]);
    expect(metrics.failed).toBe(1);
  });

  it('handles all sent', () => {
    const metrics = measureFollowUpRate([mockFollowUpSent]);
    expect(metrics.followUpRate).toBe(100);
  });

  it('handles mix of statuses', () => {
    const metrics = measureFollowUpRate([
      mockFollowUpPending,
      mockFollowUpSent,
      mockFollowUpFailed,
    ]);
    expect(metrics.total).toBe(3);
    expect(metrics.sent).toBe(1);
    expect(metrics.pending).toBe(1);
    expect(metrics.failed).toBe(1);
  });
});
