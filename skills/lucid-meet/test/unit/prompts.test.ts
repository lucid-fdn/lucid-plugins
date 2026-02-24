// ---------------------------------------------------------------------------
// prompts.test.ts -- Tests for prompt builders
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  buildMeetingSummaryPrompt,
  buildTranscriptAnalysisPrompt,
  buildFollowUpPrompt,
  MEETING_SUMMARY_PROMPT,
  ACTION_EXTRACTION_PROMPT,
  DECISION_EXTRACTION_PROMPT,
  FOLLOW_UP_PROMPT,
} from '../../src/core/analysis/prompts.js';
import {
  mockMeetingCompleted,
  mockMeetingScheduled,
  mockActionItemPending,
  mockDecisionApproved,
} from '../helpers/fixtures.js';

describe('prompt constants', () => {
  it('MEETING_SUMMARY_PROMPT is a non-empty string', () => {
    expect(MEETING_SUMMARY_PROMPT.length).toBeGreaterThan(50);
  });

  it('ACTION_EXTRACTION_PROMPT is a non-empty string', () => {
    expect(ACTION_EXTRACTION_PROMPT.length).toBeGreaterThan(50);
  });

  it('DECISION_EXTRACTION_PROMPT is a non-empty string', () => {
    expect(DECISION_EXTRACTION_PROMPT.length).toBeGreaterThan(50);
  });

  it('FOLLOW_UP_PROMPT is a non-empty string', () => {
    expect(FOLLOW_UP_PROMPT.length).toBeGreaterThan(50);
  });
});

describe('buildMeetingSummaryPrompt', () => {
  it('includes meeting title', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain(mockMeetingCompleted.title);
  });

  it('includes meeting type', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain(mockMeetingCompleted.type);
  });

  it('includes transcript when present', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain('Transcript');
  });

  it('includes attendees when present', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain('Alice');
    expect(prompt).toContain('Bob');
  });

  it('includes key topics when present', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain('Key Topics');
  });

  it('includes duration when present', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain('Duration');
  });

  it('handles meeting without transcript', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingScheduled);
    expect(prompt).not.toContain('## Transcript');
  });

  it('includes summary when present', () => {
    const prompt = buildMeetingSummaryPrompt(mockMeetingCompleted);
    expect(prompt).toContain('Existing Summary');
  });
});

describe('buildTranscriptAnalysisPrompt', () => {
  it('includes the transcript text', () => {
    const prompt = buildTranscriptAnalysisPrompt('Test transcript content here.');
    expect(prompt).toContain('Test transcript content here.');
  });

  it('asks for specific analysis outputs', () => {
    const prompt = buildTranscriptAnalysisPrompt('Some text');
    expect(prompt).toContain('summary');
    expect(prompt).toContain('action items');
    expect(prompt).toContain('decisions');
    expect(prompt).toContain('sentiment');
  });
});

describe('buildFollowUpPrompt', () => {
  it('includes meeting title', () => {
    const prompt = buildFollowUpPrompt(mockMeetingCompleted, [], []);
    expect(prompt).toContain(mockMeetingCompleted.title);
  });

  it('includes action items when provided', () => {
    const prompt = buildFollowUpPrompt(mockMeetingCompleted, [mockActionItemPending], []);
    expect(prompt).toContain('Action Items');
    expect(prompt).toContain(mockActionItemPending.title);
  });

  it('includes decisions when provided', () => {
    const prompt = buildFollowUpPrompt(mockMeetingCompleted, [], [mockDecisionApproved]);
    expect(prompt).toContain('Decisions');
    expect(prompt).toContain(mockDecisionApproved.title);
  });

  it('includes attendees', () => {
    const prompt = buildFollowUpPrompt(mockMeetingCompleted, [], []);
    expect(prompt).toContain('Alice');
  });

  it('includes summary when present', () => {
    const prompt = buildFollowUpPrompt(mockMeetingCompleted, [], []);
    expect(prompt).toContain('Summary');
  });
});
