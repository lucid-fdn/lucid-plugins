import { describe, it, expect } from 'vitest';
import {
  PLATFORMS,
  SYNC_STATUSES,
  ENTITY_TYPES,
  SYNC_DIRECTIONS,
  WORKFLOW_STATUSES,
  isPlatform,
  isEntityType,
  isSyncDirection,
} from '../../src/domain/types/common.js';

describe('common types', () => {
  describe('constants', () => {
    it('PLATFORMS has expected values', () => {
      expect(PLATFORMS).toContain('notion');
      expect(PLATFORMS).toContain('linear');
      expect(PLATFORMS).toContain('slack');
      expect(PLATFORMS).toContain('github');
      expect(PLATFORMS).toContain('jira');
      expect(PLATFORMS.length).toBeGreaterThanOrEqual(5);
    });

    it('SYNC_STATUSES has expected values', () => {
      expect(SYNC_STATUSES).toContain('synced');
      expect(SYNC_STATUSES).toContain('pending');
      expect(SYNC_STATUSES).toContain('failed');
      expect(SYNC_STATUSES).toContain('conflict');
    });

    it('ENTITY_TYPES has expected values', () => {
      expect(ENTITY_TYPES).toContain('task');
      expect(ENTITY_TYPES).toContain('document');
      expect(ENTITY_TYPES).toContain('message');
      expect(ENTITY_TYPES).toContain('issue');
    });

    it('SYNC_DIRECTIONS has expected values', () => {
      expect(SYNC_DIRECTIONS).toContain('bidirectional');
      expect(SYNC_DIRECTIONS).toContain('source_to_target');
      expect(SYNC_DIRECTIONS).toContain('target_to_source');
    });

    it('WORKFLOW_STATUSES has expected values', () => {
      expect(WORKFLOW_STATUSES).toContain('active');
      expect(WORKFLOW_STATUSES).toContain('paused');
      expect(WORKFLOW_STATUSES).toContain('error');
      expect(WORKFLOW_STATUSES).toContain('draft');
    });
  });

  describe('isPlatform', () => {
    it('returns true for valid platforms', () => {
      expect(isPlatform('notion')).toBe(true);
      expect(isPlatform('linear')).toBe(true);
      expect(isPlatform('slack')).toBe(true);
      expect(isPlatform('github')).toBe(true);
    });

    it('returns false for invalid platforms', () => {
      expect(isPlatform('invalid')).toBe(false);
      expect(isPlatform('')).toBe(false);
      expect(isPlatform('NOTION')).toBe(false);
    });
  });

  describe('isEntityType', () => {
    it('returns true for valid entity types', () => {
      expect(isEntityType('task')).toBe(true);
      expect(isEntityType('document')).toBe(true);
      expect(isEntityType('message')).toBe(true);
    });

    it('returns false for invalid entity types', () => {
      expect(isEntityType('invalid')).toBe(false);
      expect(isEntityType('')).toBe(false);
    });
  });

  describe('isSyncDirection', () => {
    it('returns true for valid directions', () => {
      expect(isSyncDirection('bidirectional')).toBe(true);
      expect(isSyncDirection('source_to_target')).toBe(true);
      expect(isSyncDirection('target_to_source')).toBe(true);
    });

    it('returns false for invalid directions', () => {
      expect(isSyncDirection('invalid')).toBe(false);
      expect(isSyncDirection('')).toBe(false);
    });
  });
});
