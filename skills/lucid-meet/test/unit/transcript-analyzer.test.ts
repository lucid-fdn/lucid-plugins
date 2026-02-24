// ---------------------------------------------------------------------------
// transcript-analyzer.test.ts -- Tests for transcript analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  extractActionItems,
  extractDecisions,
  extractKeyTopics,
  analyzeSentiment,
  generateSummary,
} from '../../src/core/analysis/transcript-analyzer.js';
import {
  SAMPLE_TRANSCRIPT,
  SAMPLE_TRANSCRIPT_NEGATIVE,
  SAMPLE_TRANSCRIPT_NEUTRAL,
  SAMPLE_TRANSCRIPT_MIXED,
} from '../helpers/fixtures.js';

// ---------------------------------------------------------------------------
// extractActionItems
// ---------------------------------------------------------------------------

describe('extractActionItems', () => {
  it('extracts action items with assignees', () => {
    const actions = extractActionItems(SAMPLE_TRANSCRIPT);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('detects "will" pattern as action item', () => {
    const actions = extractActionItems('Bob will finish the report by Friday.');
    expect(actions.length).toBeGreaterThanOrEqual(1);
    const bobAction = actions.find((a) => a.assignee.toLowerCase() === 'bob');
    expect(bobAction).toBeDefined();
  });

  it('detects "should" pattern', () => {
    const actions = extractActionItems('Charlie should prepare the slides by Monday.');
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "needs to" pattern', () => {
    const actions = extractActionItems('Alice needs to review the code before release.');
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "action item:" prefix', () => {
    const actions = extractActionItems('Action item: complete the auth module by Friday.');
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it('deduplicates similar action items', () => {
    const actions = extractActionItems(
      'Bob will finish the report. Bob will finish the report again.',
    );
    // Should not have perfect duplicates
    const titles = actions.map((a) => a.title.toLowerCase().slice(0, 30));
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it('returns empty array for transcript with no actions', () => {
    const actions = extractActionItems('The weather is nice today. The sky is blue.');
    expect(actions).toEqual([]);
  });

  it('infers urgent priority from urgent language', () => {
    const actions = extractActionItems('Bob needs to fix this urgent issue asap.');
    const urgentAction = actions.find((a) => a.priority === 'urgent');
    expect(urgentAction).toBeDefined();
  });

  it('infers high priority from important language', () => {
    const actions = extractActionItems('Alice will handle this important task.');
    const highAction = actions.find((a) => a.priority === 'high' || a.priority === 'medium');
    expect(highAction).toBeDefined();
  });

  it('infers low priority from optional language', () => {
    const actions = extractActionItems(
      'Bob should look into this nice to have feature optional cleanup.',
    );
    const lowAction = actions.find((a) => a.priority === 'low');
    expect(lowAction).toBeDefined();
  });

  it('extracts due date hints', () => {
    const actions = extractActionItems('Bob will complete the report by Friday.');
    const withDue = actions.find((a) => a.dueHint !== null);
    expect(withDue).toBeDefined();
    expect(withDue?.dueHint?.toLowerCase()).toContain('friday');
  });

  it('handles "by end of week" due hint', () => {
    const actions = extractActionItems('Alice will finalize the plan by end of week.');
    const withDue = actions.find((a) => a.dueHint !== null);
    expect(withDue).toBeDefined();
  });

  it('truncates very long action titles', () => {
    const longText = 'Bob will ' + 'do something very important '.repeat(20);
    const actions = extractActionItems(longText);
    for (const a of actions) {
      expect(a.title.length).toBeLessThanOrEqual(200);
    }
  });
});

// ---------------------------------------------------------------------------
// extractDecisions
// ---------------------------------------------------------------------------

describe('extractDecisions', () => {
  it('extracts decisions from transcript', () => {
    const decisions = extractDecisions(SAMPLE_TRANSCRIPT);
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('detects "decided to" pattern', () => {
    const decisions = extractDecisions('We decided to use TypeScript for the new project.');
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "agreed" pattern', () => {
    const decisions = extractDecisions('The team agreed to postpone the release by one week.');
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "the team will" pattern', () => {
    const decisions = extractDecisions('The team will adopt the new coding standards.');
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "we will" pattern', () => {
    const decisions = extractDecisions("We will switch to monthly releases going forward.");
    expect(decisions.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for no decisions', () => {
    const decisions = extractDecisions('The weather is nice today.');
    expect(decisions).toEqual([]);
  });

  it('skips very short matches', () => {
    const decisions = extractDecisions('Decided to go.');
    // "go" is only 2 chars, below 5-char threshold
    expect(decisions.length).toBe(0);
  });

  it('deduplicates decisions', () => {
    const decisions = extractDecisions(
      'Decided to use React. Also decided to use React for the frontend.',
    );
    const titles = decisions.map((d) => d.title.toLowerCase().slice(0, 30));
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it('truncates long decision titles', () => {
    const longDecision = 'Decided to ' + 'implement a very important feature '.repeat(10);
    const decisions = extractDecisions(longDecision);
    for (const d of decisions) {
      expect(d.title.length).toBeLessThanOrEqual(100);
    }
  });

  it('defaults decidedBy to team', () => {
    const decisions = extractDecisions('Decided to use React.');
    for (const d of decisions) {
      expect(d.decidedBy).toBe('team');
    }
  });
});

// ---------------------------------------------------------------------------
// extractKeyTopics
// ---------------------------------------------------------------------------

describe('extractKeyTopics', () => {
  it('extracts topics from transcript', () => {
    const topics = extractKeyTopics(SAMPLE_TRANSCRIPT);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.length).toBeLessThanOrEqual(10);
  });

  it('filters out stop words', () => {
    const topics = extractKeyTopics('the the the and and or but in on at to for');
    expect(topics.length).toBe(0);
  });

  it('filters out short words', () => {
    const topics = extractKeyTopics('a is it we he up so if as no');
    expect(topics.length).toBe(0);
  });

  it('returns topics sorted by frequency', () => {
    const text = 'database database database api api frontend';
    const topics = extractKeyTopics(text);
    expect(topics[0]).toBe('database');
    expect(topics[1]).toBe('api');
  });

  it('returns max 10 topics', () => {
    const words = Array.from({ length: 20 }, (_, i) => `topic${i} `.repeat(5)).join(' ');
    const topics = extractKeyTopics(words);
    expect(topics.length).toBeLessThanOrEqual(10);
  });

  it('handles empty transcript', () => {
    const topics = extractKeyTopics('');
    expect(topics).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// analyzeSentiment
// ---------------------------------------------------------------------------

describe('analyzeSentiment', () => {
  it('returns positive for positive text', () => {
    const sentiment = analyzeSentiment('This is great and excellent work. We achieved amazing progress.');
    expect(sentiment).toBe('positive');
  });

  it('returns negative for negative text', () => {
    const sentiment = analyzeSentiment(SAMPLE_TRANSCRIPT_NEGATIVE);
    expect(sentiment).toBe('negative');
  });

  it('returns neutral for neutral text', () => {
    const sentiment = analyzeSentiment(SAMPLE_TRANSCRIPT_NEUTRAL);
    expect(sentiment).toBe('neutral');
  });

  it('returns mixed for mixed text', () => {
    const sentiment = analyzeSentiment(SAMPLE_TRANSCRIPT_MIXED);
    expect(sentiment).toBe('mixed');
  });

  it('returns neutral for empty text', () => {
    const sentiment = analyzeSentiment('');
    expect(sentiment).toBe('neutral');
  });

  it('returns neutral for no sentiment words', () => {
    const sentiment = analyzeSentiment('The meeting started at 10am and lasted one hour.');
    expect(sentiment).toBe('neutral');
  });

  it('returns positive when positive words dominate', () => {
    const sentiment = analyzeSentiment(
      'Great progress, excellent work, amazing results, good job, wonderful achievement, positive outcome.',
    );
    expect(sentiment).toBe('positive');
  });
});

// ---------------------------------------------------------------------------
// generateSummary
// ---------------------------------------------------------------------------

describe('generateSummary', () => {
  it('generates a summary from transcript', () => {
    const summary = generateSummary(SAMPLE_TRANSCRIPT);
    expect(summary.length).toBeGreaterThan(0);
  });

  it('returns no content message for empty text', () => {
    const summary = generateSummary('');
    expect(summary).toBe('No substantial content to summarize.');
  });

  it('returns no content for short sentences', () => {
    const summary = generateSummary('Hi. Ok. Done.');
    expect(summary).toBe('No substantial content to summarize.');
  });

  it('returns full text for 3 or fewer sentences', () => {
    const text = 'The project is on track for delivery. We need to finalize the requirements. Testing starts next week.';
    const summary = generateSummary(text);
    expect(summary).toContain('project is on track');
  });

  it('picks first, middle, and last sentences for longer text', () => {
    const text =
      'First sentence about the project. Second sentence about progress. Third sentence about issues. Fourth sentence about solutions. Fifth sentence about timeline.';
    const summary = generateSummary(text);
    expect(summary).toContain('First sentence');
    expect(summary).toContain('Fifth sentence');
  });
});
