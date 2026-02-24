import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_BUILDER_PROMPT,
  SYNC_STATUS_PROMPT,
  CROSS_PLATFORM_SEARCH_PROMPT,
  ACTIVITY_FEED_PROMPT,
} from '../../src/domain/analysis/prompts.js';

describe('prompts', () => {
  it('WORKFLOW_BUILDER_PROMPT is a non-empty string', () => {
    expect(typeof WORKFLOW_BUILDER_PROMPT).toBe('string');
    expect(WORKFLOW_BUILDER_PROMPT.length).toBeGreaterThan(100);
    expect(WORKFLOW_BUILDER_PROMPT).toContain('workflow');
  });

  it('SYNC_STATUS_PROMPT is a non-empty string', () => {
    expect(typeof SYNC_STATUS_PROMPT).toBe('string');
    expect(SYNC_STATUS_PROMPT.length).toBeGreaterThan(50);
    expect(SYNC_STATUS_PROMPT).toContain('sync');
  });

  it('CROSS_PLATFORM_SEARCH_PROMPT is a non-empty string', () => {
    expect(typeof CROSS_PLATFORM_SEARCH_PROMPT).toBe('string');
    expect(CROSS_PLATFORM_SEARCH_PROMPT.length).toBeGreaterThan(50);
    expect(CROSS_PLATFORM_SEARCH_PROMPT).toContain('search');
  });

  it('ACTIVITY_FEED_PROMPT is a non-empty string', () => {
    expect(typeof ACTIVITY_FEED_PROMPT).toBe('string');
    expect(ACTIVITY_FEED_PROMPT.length).toBeGreaterThan(50);
    expect(ACTIVITY_FEED_PROMPT).toContain('activity');
  });

  it('WORKFLOW_BUILDER_PROMPT mentions supported platforms', () => {
    expect(WORKFLOW_BUILDER_PROMPT).toContain('notion');
    expect(WORKFLOW_BUILDER_PROMPT).toContain('linear');
    expect(WORKFLOW_BUILDER_PROMPT).toContain('slack');
    expect(WORKFLOW_BUILDER_PROMPT).toContain('github');
  });

  it('WORKFLOW_BUILDER_PROMPT mentions trigger events', () => {
    expect(WORKFLOW_BUILDER_PROMPT).toContain('issue_created');
    expect(WORKFLOW_BUILDER_PROMPT).toContain('pr_opened');
  });
});
