import { describe, it, expect } from 'vitest';
import { BridgeError, isBridgeError } from '../../src/core/utils/errors.js';

describe('BridgeError', () => {
  it('creates a basic error', () => {
    const err = new BridgeError('something went wrong');
    expect(err.message).toBe('something went wrong');
    expect(err.code).toBe('BRIDGE_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('BridgeError');
  });

  it('creates an error with custom code and status', () => {
    const err = new BridgeError('bad', 'CUSTOM_CODE', 400);
    expect(err.code).toBe('CUSTOM_CODE');
    expect(err.statusCode).toBe(400);
  });

  it('creates an error with context', () => {
    const err = new BridgeError('failed', 'ERR', 500, { key: 'value' });
    expect(err.context).toEqual({ key: 'value' });
  });

  describe('static factory methods', () => {
    it('notFound creates a 404 error', () => {
      const err = BridgeError.notFound('Workflow', 'abc');
      expect(err.code).toBe('NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('Workflow');
      expect(err.message).toContain('abc');
    });

    it('notFound without ID', () => {
      const err = BridgeError.notFound('Connection');
      expect(err.message).toBe('Connection not found');
    });

    it('badRequest creates a 400 error', () => {
      const err = BridgeError.badRequest('invalid input');
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.statusCode).toBe(400);
    });

    it('unauthorized creates a 401 error', () => {
      const err = BridgeError.unauthorized();
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
    });

    it('unauthorized with custom message', () => {
      const err = BridgeError.unauthorized('token expired');
      expect(err.message).toBe('token expired');
    });

    it('platformError creates a 502 error', () => {
      const err = BridgeError.platformError('slack', 'API timeout', 'ETIMEOUT');
      expect(err.code).toBe('PLATFORM_ERROR');
      expect(err.statusCode).toBe(502);
      expect(err.message).toContain('[slack]');
      expect(err.context?.['platform']).toBe('slack');
    });

    it('syncError creates a 500 error', () => {
      const err = BridgeError.syncError('sync failed', 'mapping-123');
      expect(err.code).toBe('SYNC_ERROR');
      expect(err.context?.['mappingId']).toBe('mapping-123');
    });

    it('configError creates a 500 error', () => {
      const err = BridgeError.configError('missing key');
      expect(err.code).toBe('CONFIG_ERROR');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('toJSON', () => {
    it('serializes correctly', () => {
      const err = new BridgeError('test', 'TEST', 418, { foo: 'bar' });
      const json = err.toJSON();
      expect(json).toEqual({
        name: 'BridgeError',
        message: 'test',
        code: 'TEST',
        statusCode: 418,
        context: { foo: 'bar' },
      });
    });
  });

  describe('isBridgeError', () => {
    it('returns true for BridgeError', () => {
      expect(isBridgeError(new BridgeError('test'))).toBe(true);
    });

    it('returns false for regular Error', () => {
      expect(isBridgeError(new Error('test'))).toBe(false);
    });

    it('returns false for non-error', () => {
      expect(isBridgeError('string')).toBe(false);
      expect(isBridgeError(null)).toBe(false);
      expect(isBridgeError(undefined)).toBe(false);
    });
  });

  it('is instanceof Error', () => {
    const err = new BridgeError('test');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof BridgeError).toBe(true);
  });
});
