// ---------------------------------------------------------------------------
// common-types.test.ts -- Tests for common type constants
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  MEETING_TYPES,
  MEETING_STATUSES,
  ACTION_STATUSES,
  ACTION_PRIORITIES,
  DECISION_STATUSES,
  SENTIMENT_TYPES,
} from '../../src/core/types/common.js';

describe('MEETING_TYPES', () => {
  it('includes all expected types', () => {
    expect(MEETING_TYPES).toContain('standup');
    expect(MEETING_TYPES).toContain('planning');
    expect(MEETING_TYPES).toContain('review');
    expect(MEETING_TYPES).toContain('one_on_one');
    expect(MEETING_TYPES).toContain('all_hands');
    expect(MEETING_TYPES).toContain('client');
    expect(MEETING_TYPES).toContain('interview');
    expect(MEETING_TYPES).toContain('brainstorm');
    expect(MEETING_TYPES).toContain('custom');
  });

  it('has 9 types', () => {
    expect(MEETING_TYPES.length).toBe(9);
  });
});

describe('MEETING_STATUSES', () => {
  it('includes all expected statuses', () => {
    expect(MEETING_STATUSES).toContain('scheduled');
    expect(MEETING_STATUSES).toContain('in_progress');
    expect(MEETING_STATUSES).toContain('completed');
    expect(MEETING_STATUSES).toContain('cancelled');
  });

  it('has 4 statuses', () => {
    expect(MEETING_STATUSES.length).toBe(4);
  });
});

describe('ACTION_STATUSES', () => {
  it('includes all expected statuses', () => {
    expect(ACTION_STATUSES).toContain('pending');
    expect(ACTION_STATUSES).toContain('in_progress');
    expect(ACTION_STATUSES).toContain('completed');
    expect(ACTION_STATUSES).toContain('cancelled');
  });

  it('has 4 statuses', () => {
    expect(ACTION_STATUSES.length).toBe(4);
  });
});

describe('ACTION_PRIORITIES', () => {
  it('includes all expected priorities', () => {
    expect(ACTION_PRIORITIES).toContain('low');
    expect(ACTION_PRIORITIES).toContain('medium');
    expect(ACTION_PRIORITIES).toContain('high');
    expect(ACTION_PRIORITIES).toContain('urgent');
  });

  it('has 4 priorities', () => {
    expect(ACTION_PRIORITIES.length).toBe(4);
  });
});

describe('DECISION_STATUSES', () => {
  it('includes all expected statuses', () => {
    expect(DECISION_STATUSES).toContain('proposed');
    expect(DECISION_STATUSES).toContain('approved');
    expect(DECISION_STATUSES).toContain('rejected');
    expect(DECISION_STATUSES).toContain('deferred');
  });

  it('has 4 statuses', () => {
    expect(DECISION_STATUSES.length).toBe(4);
  });
});

describe('SENTIMENT_TYPES', () => {
  it('includes all expected types', () => {
    expect(SENTIMENT_TYPES).toContain('positive');
    expect(SENTIMENT_TYPES).toContain('neutral');
    expect(SENTIMENT_TYPES).toContain('negative');
    expect(SENTIMENT_TYPES).toContain('mixed');
  });

  it('has 4 types', () => {
    expect(SENTIMENT_TYPES.length).toBe(4);
  });
});
