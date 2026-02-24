import { describe, it, expect } from 'vitest';
import { VeilleError, ConfigError, FetchError, DatabaseError, PublishError } from '../../../src/core/utils/errors.js';

describe('Custom errors', () => {
  it('VeilleError has code property', () => {
    const err = new VeilleError('test', 'TEST_CODE');
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err).toBeInstanceOf(Error);
  });

  it('ConfigError has CONFIG_ERROR code', () => {
    const err = new ConfigError('bad config');
    expect(err.code).toBe('CONFIG_ERROR');
  });

  it('FetchError has FETCH_ERROR code', () => {
    const err = new FetchError('fetch failed');
    expect(err.code).toBe('FETCH_ERROR');
  });

  it('DatabaseError has DATABASE_ERROR code', () => {
    const err = new DatabaseError('db error');
    expect(err.code).toBe('DATABASE_ERROR');
  });

  it('PublishError has PUBLISH_ERROR code', () => {
    const err = new PublishError('publish failed');
    expect(err.code).toBe('PUBLISH_ERROR');
  });
});
