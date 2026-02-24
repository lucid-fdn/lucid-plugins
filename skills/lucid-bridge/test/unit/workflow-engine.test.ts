import { describe, it, expect, vi } from 'vitest';
import { evaluateCondition } from '../../src/domain/analysis/workflow-engine.js';
import type { WorkflowCondition } from '../../src/domain/types/database.js';

describe('workflow engine', () => {
  describe('evaluateCondition', () => {
    it('evaluates equals condition', () => {
      const condition: WorkflowCondition = { field: 'status', operator: 'equals', value: 'open' };
      expect(evaluateCondition(condition, { status: 'open' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'closed' })).toBe(false);
    });

    it('evaluates not_equals condition', () => {
      const condition: WorkflowCondition = { field: 'status', operator: 'not_equals', value: 'closed' };
      expect(evaluateCondition(condition, { status: 'open' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'closed' })).toBe(false);
    });

    it('evaluates contains condition for strings', () => {
      const condition: WorkflowCondition = { field: 'title', operator: 'contains', value: 'bug' };
      expect(evaluateCondition(condition, { title: 'Fix bug in API' })).toBe(true);
      expect(evaluateCondition(condition, { title: 'Add feature' })).toBe(false);
    });

    it('evaluates contains condition for arrays', () => {
      const condition: WorkflowCondition = { field: 'labels', operator: 'contains', value: 'critical' };
      expect(evaluateCondition(condition, { labels: ['bug', 'critical'] })).toBe(true);
      expect(evaluateCondition(condition, { labels: ['enhancement'] })).toBe(false);
    });

    it('evaluates gt condition', () => {
      const condition: WorkflowCondition = { field: 'priority', operator: 'gt', value: 3 };
      expect(evaluateCondition(condition, { priority: 5 })).toBe(true);
      expect(evaluateCondition(condition, { priority: 2 })).toBe(false);
    });

    it('evaluates lt condition', () => {
      const condition: WorkflowCondition = { field: 'count', operator: 'lt', value: 10 };
      expect(evaluateCondition(condition, { count: 5 })).toBe(true);
      expect(evaluateCondition(condition, { count: 15 })).toBe(false);
    });

    it('evaluates exists condition', () => {
      const condition: WorkflowCondition = { field: 'assignee', operator: 'exists', value: true };
      expect(evaluateCondition(condition, { assignee: 'Alice' })).toBe(true);
      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('handles nested field access', () => {
      const condition: WorkflowCondition = { field: 'user.name', operator: 'equals', value: 'Bob' };
      expect(evaluateCondition(condition, { user: { name: 'Bob' } })).toBe(true);
      expect(evaluateCondition(condition, { user: { name: 'Alice' } })).toBe(false);
    });

    it('returns false for gt with non-numeric values', () => {
      const condition: WorkflowCondition = { field: 'name', operator: 'gt', value: 5 };
      expect(evaluateCondition(condition, { name: 'hello' })).toBe(false);
    });

    it('returns false for contains with non-string/array field', () => {
      const condition: WorkflowCondition = { field: 'count', operator: 'contains', value: '5' };
      expect(evaluateCondition(condition, { count: 5 })).toBe(false);
    });

    it('returns false for unknown operator', () => {
      const condition = { field: 'x', operator: 'unknown' as any, value: 1 };
      expect(evaluateCondition(condition, { x: 1 })).toBe(false);
    });
  });
});
