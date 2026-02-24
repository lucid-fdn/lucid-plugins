// ---------------------------------------------------------------------------
// agenda-builder.test.ts -- Tests for agenda builder
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  buildAgenda,
  suggestTopics,
  estimateDuration,
} from '../../src/core/analysis/agenda-builder.js';
import type { MeetingType } from '../../src/core/types/common.js';
import { MEETING_TYPES } from '../../src/core/types/common.js';
import {
  mockMeetingCompleted,
  mockMeetingReview,
  mockActionItemPending,
  mockActionItemInProgress,
  mockActionItemCompleted,
} from '../helpers/fixtures.js';

// ---------------------------------------------------------------------------
// buildAgenda
// ---------------------------------------------------------------------------

describe('buildAgenda', () => {
  it('builds a standup agenda', () => {
    const agenda = buildAgenda('standup');
    expect(agenda.title).toContain('Standup');
    expect(agenda.type).toBe('standup');
    expect(agenda.items.length).toBeGreaterThan(0);
    expect(agenda.estimatedDuration).toBeGreaterThan(0);
  });

  it('builds a planning agenda', () => {
    const agenda = buildAgenda('planning');
    expect(agenda.title).toContain('Planning');
    expect(agenda.type).toBe('planning');
    expect(agenda.items.length).toBeGreaterThan(0);
  });

  it('builds agendas for all meeting types', () => {
    for (const type of MEETING_TYPES) {
      const agenda = buildAgenda(type);
      expect(agenda.type).toBe(type);
      expect(agenda.items.length).toBeGreaterThan(0);
      expect(agenda.estimatedDuration).toBeGreaterThan(0);
    }
  });

  it('includes carry-over items from pending actions', () => {
    const agenda = buildAgenda('standup', [], [mockActionItemPending, mockActionItemInProgress]);
    const carryOver = agenda.items.find((item) => item.title.includes('pending action'));
    expect(carryOver).toBeDefined();
  });

  it('does not include carry-over for completed actions', () => {
    const agenda = buildAgenda('standup', [], [mockActionItemCompleted]);
    const carryOver = agenda.items.find((item) => item.title.includes('pending action'));
    expect(carryOver).toBeUndefined();
  });

  it('limits carry-over duration', () => {
    const manyActions = Array(10).fill(mockActionItemPending);
    const agenda = buildAgenda('standup', [], manyActions);
    const carryOver = agenda.items.find((item) => item.title.includes('pending action'));
    expect(carryOver).toBeDefined();
    expect(carryOver!.duration_minutes).toBeLessThanOrEqual(15);
  });

  it('estimates duration correctly', () => {
    const agenda = buildAgenda('standup');
    const manualTotal = agenda.items.reduce((sum, item) => sum + item.duration_minutes, 0);
    expect(agenda.estimatedDuration).toBe(manualTotal);
  });

  it('capitalizes the meeting title', () => {
    const agenda = buildAgenda('one_on_one');
    expect(agenda.title.charAt(0)).toBe(agenda.title.charAt(0).toUpperCase());
  });

  it('carry-over includes assignee names', () => {
    const agenda = buildAgenda('standup', [], [mockActionItemPending]);
    const carryOver = agenda.items.find((item) => item.description?.includes('Bob'));
    expect(carryOver).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// suggestTopics
// ---------------------------------------------------------------------------

describe('suggestTopics', () => {
  it('returns topics from recent meetings', () => {
    const topics = suggestTopics([mockMeetingCompleted]);
    expect(topics.length).toBeGreaterThan(0);
  });

  it('deduplicates topics', () => {
    const topics = suggestTopics([mockMeetingCompleted, mockMeetingCompleted]);
    const unique = new Set(topics.map((t) => t.toLowerCase()));
    expect(unique.size).toBe(topics.length);
  });

  it('suggests planning when only review is recent', () => {
    const topics = suggestTopics([mockMeetingReview]);
    const planSuggestion = topics.find((t) => t.toLowerCase().includes('planning'));
    expect(planSuggestion).toBeDefined();
  });

  it('suggests review when only planning is recent', () => {
    const topics = suggestTopics([mockMeetingCompleted]);
    const reviewSuggestion = topics.find((t) => t.toLowerCase().includes('review'));
    expect(reviewSuggestion).toBeDefined();
  });

  it('returns max 10 topics', () => {
    const manyMeetings = Array(20).fill({
      ...mockMeetingCompleted,
      key_topics: ['topic1', 'topic2', 'topic3', 'topic4', 'topic5'],
    });
    const topics = suggestTopics(manyMeetings);
    expect(topics.length).toBeLessThanOrEqual(10);
  });

  it('handles empty meeting list', () => {
    const topics = suggestTopics([]);
    expect(topics).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// estimateDuration
// ---------------------------------------------------------------------------

describe('estimateDuration', () => {
  it('adds 10% buffer', () => {
    const items = [
      { title: 'A', duration_minutes: 10 },
      { title: 'B', duration_minutes: 20 },
    ];
    const duration = estimateDuration(items);
    expect(duration).toBe(Math.ceil(30 * 1.1)); // 33
  });

  it('returns 0 for empty agenda', () => {
    expect(estimateDuration([])).toBe(0);
  });

  it('rounds up', () => {
    const items = [{ title: 'A', duration_minutes: 7 }];
    const duration = estimateDuration(items);
    expect(duration).toBe(Math.ceil(7 * 1.1)); // 8
  });
});
