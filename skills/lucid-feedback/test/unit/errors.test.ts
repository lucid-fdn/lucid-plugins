// ---------------------------------------------------------------------------
// errors.test.ts -- Tests for custom error classes
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  FeedbackError,
  DatabaseError,
  ConfigError,
  AnalysisError,
  ChannelError,
} from '../../src/core/utils/errors.js';

describe('FeedbackError', () => {
  it('has correct name and code', () => {
    const err = new FeedbackError('test');
    expect(err.name).toBe('FeedbackError');
    expect(err.code).toBe('FEEDBACK_ERROR');
    expect(err.message).toBe('test');
  });

  it('is an instance of Error', () => {
    expect(new FeedbackError('test')).toBeInstanceOf(Error);
  });
});

describe('DatabaseError', () => {
  it('has correct name and code', () => {
    const err = new DatabaseError('db fail');
    expect(err.name).toBe('DatabaseError');
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.message).toBe('db fail');
  });
});

describe('ConfigError', () => {
  it('has correct name and code', () => {
    const err = new ConfigError('bad config');
    expect(err.name).toBe('ConfigError');
    expect(err.code).toBe('CONFIG_ERROR');
    expect(err.message).toBe('bad config');
  });
});

describe('AnalysisError', () => {
  it('has correct name and code', () => {
    const err = new AnalysisError('analysis fail');
    expect(err.name).toBe('AnalysisError');
    expect(err.code).toBe('ANALYSIS_ERROR');
    expect(err.message).toBe('analysis fail');
  });
});

describe('ChannelError', () => {
  it('has correct name, code, and channel', () => {
    const err = new ChannelError('intercom', 'connection failed');
    expect(err.name).toBe('ChannelError');
    expect(err.code).toBe('CHANNEL_ERROR');
    expect(err.channel).toBe('intercom');
    expect(err.message).toBe('[intercom] connection failed');
  });
});
