import { describe, it, expect } from 'vitest';
import { normalizeTask, denormalizeTask, mapEntity } from '../../src/domain/analysis/mapper.js';
import type { NormalizedTask } from '../../src/domain/analysis/mapper.js';

describe('mapper', () => {
  describe('normalizeTask', () => {
    it('normalizes a Linear task', () => {
      const data = {
        id: 'LIN-123',
        title: 'Fix bug',
        description: 'A bug fix',
        status: 'In Progress',
        priority: '2',
        assignee: 'Alice',
        labels: ['bug', 'critical'],
        url: 'https://linear.app/issue/LIN-123',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
      };
      const result = normalizeTask('linear', data);
      expect(result.id).toBe('LIN-123');
      expect(result.title).toBe('Fix bug');
      expect(result.status).toBe('in_progress');
      expect(result.priority).toBe('high');
      expect(result.source_platform).toBe('linear');
    });

    it('normalizes a GitHub task', () => {
      const data = {
        id: 456,
        title: 'Feature request',
        body: 'Need a new feature',
        state: 'open',
        labels: [{ name: 'enhancement' }],
        html_url: 'https://github.com/org/repo/issues/456',
        created_at: '2025-01-01',
        updated_at: '2025-01-02',
      };
      const result = normalizeTask('github', data);
      expect(result.id).toBe('456');
      expect(result.title).toBe('Feature request');
      expect(result.status).toBe('todo');
      expect(result.labels).toEqual(['enhancement']);
      expect(result.source_platform).toBe('github');
    });

    it('normalizes a Jira task', () => {
      const data = {
        key: 'PROJ-789',
        fields: {
          summary: 'Implement feature',
          description: 'Details here',
          status: { name: 'To Do' },
          priority: { name: 'High' },
          assignee: { displayName: 'Bob' },
          labels: ['backend'],
          created: '2025-01-01',
          updated: '2025-01-02',
        },
      };
      const result = normalizeTask('jira', data);
      expect(result.id).toBe('PROJ-789');
      expect(result.title).toBe('Implement feature');
      expect(result.status).toBe('todo');
      expect(result.priority).toBe('high');
      expect(result.assignee).toBe('Bob');
      expect(result.source_platform).toBe('jira');
    });

    it('normalizes a Notion task', () => {
      const data = {
        id: 'notion-abc',
        properties: {
          Name: {
            type: 'title',
            title: [{ plain_text: 'My Page' }],
          },
          Status: {
            select: { name: 'In progress' },
          },
        },
        url: 'https://notion.so/page',
        created_time: '2025-01-01',
        last_edited_time: '2025-01-02',
      };
      const result = normalizeTask('notion', data);
      expect(result.id).toBe('notion-abc');
      expect(result.title).toBe('My Page');
      expect(result.status).toBe('in_progress');
      expect(result.source_platform).toBe('notion');
    });

    it('normalizes a generic task', () => {
      const data = {
        id: 'gen-1',
        name: 'Generic Task',
        body: 'Some body',
        status: 'active',
      };
      const result = normalizeTask('discord', data);
      expect(result.id).toBe('gen-1');
      expect(result.title).toBe('Generic Task');
      expect(result.description).toBe('Some body');
      expect(result.source_platform).toBe('discord');
    });

    it('handles missing fields gracefully', () => {
      const result = normalizeTask('linear', {});
      expect(result.id).toBe('');
      expect(result.title).toBe('');
      expect(result.labels).toEqual([]);
    });
  });

  describe('denormalizeTask', () => {
    const baseNormalized: NormalizedTask = {
      id: 'test-1',
      title: 'Test Task',
      description: 'Test description',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Alice',
      labels: ['bug'],
      url: 'https://example.com',
      created_at: '2025-01-01',
      updated_at: '2025-01-02',
      source_platform: 'linear',
      raw: {},
    };

    it('denormalizes to Linear format', () => {
      const result = denormalizeTask('linear', baseNormalized);
      expect(result['title']).toBe('Test Task');
      expect(result['description']).toBe('Test description');
    });

    it('denormalizes to GitHub format', () => {
      const result = denormalizeTask('github', baseNormalized);
      expect(result['title']).toBe('Test Task');
      expect(result['body']).toBe('Test description');
      expect(result['labels']).toEqual(['bug']);
    });

    it('denormalizes to Jira format', () => {
      const result = denormalizeTask('jira', baseNormalized);
      const fields = result['fields'] as Record<string, unknown>;
      expect(fields['summary']).toBe('Test Task');
    });

    it('denormalizes to Notion format', () => {
      const result = denormalizeTask('notion', baseNormalized);
      const props = result['properties'] as Record<string, unknown>;
      expect(props).toBeDefined();
    });

    it('denormalizes to generic format', () => {
      const result = denormalizeTask('discord', baseNormalized);
      expect(result['title']).toBe('Test Task');
      expect(result['description']).toBe('Test description');
    });
  });

  describe('mapEntity', () => {
    it('maps from Linear to GitHub', () => {
      const linearData = {
        id: 'LIN-1',
        title: 'Bug',
        description: 'Fix it',
        status: 'Todo',
        priority: '2',
        labels: [],
      };
      const result = mapEntity(linearData, 'linear', 'github');
      expect(result['title']).toBe('Bug');
      expect(result['body']).toBe('Fix it');
    });

    it('maps from GitHub to Jira', () => {
      const ghData = {
        id: 1,
        title: 'Issue',
        body: 'Details',
        state: 'open',
        labels: [],
      };
      const result = mapEntity(ghData, 'github', 'jira');
      const fields = result['fields'] as Record<string, unknown>;
      expect(fields['summary']).toBe('Issue');
    });

    it('maps from Jira to Notion', () => {
      const jiraData = {
        key: 'PROJ-1',
        fields: {
          summary: 'Task',
          description: 'Desc',
          status: { name: 'Done' },
        },
      };
      const result = mapEntity(jiraData, 'jira', 'notion');
      expect(result['properties']).toBeDefined();
    });
  });
});
