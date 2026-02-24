import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  resolveConflicts,
  buildChangeSet,
} from '../../src/domain/analysis/sync-engine.js';

describe('sync engine', () => {
  describe('detectConflicts', () => {
    it('detects no conflicts for identical objects', () => {
      const source = { title: 'Hello', status: 'open' };
      const target = { title: 'Hello', status: 'open' };
      const conflicts = detectConflicts(source, target);
      expect(conflicts).toEqual([]);
    });

    it('detects conflicts for differing fields', () => {
      const source = { title: 'Hello', status: 'open' };
      const target = { title: 'Hello', status: 'closed' };
      const conflicts = detectConflicts(source, target);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.field).toBe('status');
      expect(conflicts[0]!.sourceValue).toBe('open');
      expect(conflicts[0]!.targetValue).toBe('closed');
    });

    it('skips metadata fields (id, created_at, updated_at, url)', () => {
      const source = { id: '1', created_at: 'a', updated_at: 'b', url: 'c', title: 'Same' };
      const target = { id: '2', created_at: 'x', updated_at: 'y', url: 'z', title: 'Same' };
      const conflicts = detectConflicts(source, target);
      expect(conflicts).toHaveLength(0);
    });

    it('includes lastSynced in conflict info', () => {
      const source = { name: 'A' };
      const target = { name: 'B' };
      const conflicts = detectConflicts(source, target, '2025-01-01');
      expect(conflicts[0]!.lastSynced).toBe('2025-01-01');
    });

    it('handles empty objects', () => {
      expect(detectConflicts({}, {})).toEqual([]);
    });

    it('does not treat missing fields as conflicts', () => {
      const source = { title: 'Hello', extra: 'field' };
      const target = { title: 'Hello' };
      // extra is only in source, so no conflict (undefined !== 'field' but undefined check)
      const conflicts = detectConflicts(source, target);
      // extra is only in source (target undefined), so no conflict since targetVal is undefined
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('resolveConflicts', () => {
    const conflicts = [
      { field: 'title', sourceValue: 'Source Title', targetValue: 'Target Title', lastSynced: null },
      { field: 'status', sourceValue: 'open', targetValue: 'closed', lastSynced: null },
    ];

    it('resolves with source_wins', () => {
      const resolved = resolveConflicts(conflicts, 'source_wins');
      expect(resolved).toHaveLength(2);
      expect(resolved[0]!.resolvedValue).toBe('Source Title');
      expect(resolved[1]!.resolvedValue).toBe('open');
    });

    it('resolves with target_wins', () => {
      const resolved = resolveConflicts(conflicts, 'target_wins');
      expect(resolved[0]!.resolvedValue).toBe('Target Title');
      expect(resolved[1]!.resolvedValue).toBe('closed');
    });

    it('resolves with newest_wins (defaults to source)', () => {
      const resolved = resolveConflicts(conflicts, 'newest_wins');
      expect(resolved[0]!.resolvedValue).toBe('Source Title');
    });

    it('resolves with manual (defaults to source)', () => {
      const resolved = resolveConflicts(conflicts, 'manual');
      expect(resolved[0]!.resolvedValue).toBe('Source Title');
    });

    it('handles empty conflicts array', () => {
      expect(resolveConflicts([], 'source_wins')).toEqual([]);
    });
  });

  describe('buildChangeSet', () => {
    it('detects added fields', () => {
      const before = {};
      const after = { title: 'New', status: 'open' };
      const changes = buildChangeSet(before, after);
      expect(changes.added).toHaveLength(2);
      expect(changes.modified).toHaveLength(0);
      expect(changes.removed).toHaveLength(0);
    });

    it('detects modified fields', () => {
      const before = { title: 'Old', status: 'open' };
      const after = { title: 'New', status: 'open' };
      const changes = buildChangeSet(before, after);
      expect(changes.modified).toHaveLength(1);
      expect(changes.modified[0]!.field).toBe('title');
      expect(changes.modified[0]!.before).toBe('Old');
      expect(changes.modified[0]!.after).toBe('New');
    });

    it('detects removed fields', () => {
      const before = { title: 'Hello', extra: 'data' };
      const after = { title: 'Hello' };
      const changes = buildChangeSet(before, after);
      expect(changes.removed).toEqual(['extra']);
    });

    it('handles no changes', () => {
      const obj = { a: 1, b: 2 };
      const changes = buildChangeSet(obj, obj);
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
      expect(changes.removed).toHaveLength(0);
    });

    it('handles empty objects', () => {
      const changes = buildChangeSet({}, {});
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
      expect(changes.removed).toHaveLength(0);
    });
  });
});
