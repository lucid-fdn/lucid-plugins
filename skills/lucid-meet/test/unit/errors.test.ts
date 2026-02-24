// ---------------------------------------------------------------------------
// errors.test.ts -- Tests for custom error classes
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  MeetError,
  FetchError,
  DatabaseError,
  ConfigError,
  ProviderError,
  AnalysisError,
} from '../../src/core/utils/errors.js';

describe('MeetError', () => {
  it('has correct name and code', () => {
    const err = new MeetError('TEST_CODE', 'test message');
    expect(err.name).toBe('MeetError');
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('FetchError', () => {
  it('has correct name and code', () => {
    const err = new FetchError('fetch failed');
    expect(err.name).toBe('FetchError');
    expect(err.code).toBe('FETCH_ERROR');
    expect(err.message).toBe('fetch failed');
  });
});

describe('DatabaseError', () => {
  it('has correct name and code', () => {
    const err = new DatabaseError('db error');
    expect(err.name).toBe('DatabaseError');
    expect(err.code).toBe('DATABASE_ERROR');
  });
});

describe('ConfigError', () => {
  it('has correct name and code', () => {
    const err = new ConfigError('config missing');
    expect(err.name).toBe('ConfigError');
    expect(err.code).toBe('CONFIG_ERROR');
  });
});

describe('ProviderError', () => {
  it('has correct name, code, and provider', () => {
    const err = new ProviderError('google-calendar', 'api failed');
    expect(err.name).toBe('ProviderError');
    expect(err.code).toBe('PROVIDER_ERROR');
    expect(err.provider).toBe('google-calendar');
    expect(err.message).toContain('google-calendar');
    expect(err.message).toContain('api failed');
  });
});

describe('AnalysisError', () => {
  it('has correct name and code', () => {
    const err = new AnalysisError('analysis failed');
    expect(err.name).toBe('AnalysisError');
    expect(err.code).toBe('ANALYSIS_ERROR');
  });
});
