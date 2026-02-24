import type { Platform, EntityType } from '../types/common.js';
import { logger } from '../../core/utils/logger.js';

/**
 * Normalized representation of a task across platforms.
 */
export interface NormalizedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  labels: string[];
  url: string;
  created_at: string;
  updated_at: string;
  source_platform: Platform;
  raw: Record<string, unknown>;
}

/** Status mapping across platforms */
const STATUS_MAP: Record<Platform, Record<string, string>> = {
  notion: { 'Not started': 'todo', 'In progress': 'in_progress', Done: 'done' },
  linear: { Backlog: 'backlog', Todo: 'todo', 'In Progress': 'in_progress', Done: 'done', Canceled: 'cancelled' },
  github: { open: 'todo', closed: 'done' },
  jira: { 'To Do': 'todo', 'In Progress': 'in_progress', Done: 'done' },
  slack: {},
  google_workspace: {},
  discord: {},
  trello: { 'To Do': 'todo', Doing: 'in_progress', Done: 'done' },
};

/** Priority mapping across platforms */
const PRIORITY_MAP: Record<Platform, Record<string, string>> = {
  notion: {},
  linear: { '0': 'none', '1': 'urgent', '2': 'high', '3': 'medium', '4': 'low' },
  github: {},
  jira: { Highest: 'urgent', High: 'high', Medium: 'medium', Low: 'low', Lowest: 'none' },
  slack: {},
  google_workspace: {},
  discord: {},
  trello: {},
};

/**
 * Normalize a task from a platform-specific format to a universal format.
 */
export function normalizeTask(platform: Platform, data: Record<string, unknown>): NormalizedTask {
  logger.debug('Normalizing task', { platform });

  switch (platform) {
    case 'linear':
      return normalizeLinearTask(data);
    case 'github':
      return normalizeGithubTask(data);
    case 'jira':
      return normalizeJiraTask(data);
    case 'notion':
      return normalizeNotionTask(data);
    default:
      return normalizeGenericTask(platform, data);
  }
}

/**
 * Denormalize a universal task to a platform-specific format.
 */
export function denormalizeTask(
  platform: Platform,
  normalized: NormalizedTask,
): Record<string, unknown> {
  logger.debug('Denormalizing task', { platform });

  const reverseStatusMap = buildReverseMap(STATUS_MAP[platform] ?? {});
  const reversePriorityMap = buildReverseMap(PRIORITY_MAP[platform] ?? {});

  const platformStatus = reverseStatusMap[normalized.status] ?? normalized.status;
  const platformPriority = reversePriorityMap[normalized.priority] ?? normalized.priority;

  switch (platform) {
    case 'linear':
      return {
        title: normalized.title,
        description: normalized.description,
        priority: platformPriority,
        labels: normalized.labels,
      };
    case 'github':
      return {
        title: normalized.title,
        body: normalized.description,
        state: platformStatus === 'done' ? 'closed' : 'open',
        labels: normalized.labels,
      };
    case 'jira':
      return {
        fields: {
          summary: normalized.title,
          description: normalized.description,
          priority: { name: platformPriority },
          labels: normalized.labels,
        },
      };
    case 'notion':
      return {
        properties: {
          title: { title: [{ text: { content: normalized.title } }] },
          Status: { select: { name: platformStatus } },
        },
      };
    default:
      return {
        title: normalized.title,
        description: normalized.description,
        status: platformStatus,
        priority: platformPriority,
        labels: normalized.labels,
      };
  }
}

/**
 * Map an entity from one format to another.
 */
export function mapEntity(
  data: Record<string, unknown>,
  sourcePlatform: Platform,
  targetPlatform: Platform,
  _entityType: EntityType = 'task',
): Record<string, unknown> {
  const normalized = normalizeTask(sourcePlatform, data);
  return denormalizeTask(targetPlatform, normalized);
}

// --- Internal normalizers ---

function normalizeLinearTask(data: Record<string, unknown>): NormalizedTask {
  const statusMap = STATUS_MAP['linear'] ?? {};
  const priorityMap = PRIORITY_MAP['linear'] ?? {};

  return {
    id: String(data['id'] ?? ''),
    title: String(data['title'] ?? ''),
    description: String(data['description'] ?? ''),
    status: statusMap[String(data['status'] ?? '')] ?? String(data['status'] ?? 'unknown'),
    priority: priorityMap[String(data['priority'] ?? '')] ?? String(data['priority'] ?? 'none'),
    assignee: String(data['assignee'] ?? ''),
    labels: Array.isArray(data['labels']) ? data['labels'].map(String) : [],
    url: String(data['url'] ?? ''),
    created_at: String(data['createdAt'] ?? data['created_at'] ?? ''),
    updated_at: String(data['updatedAt'] ?? data['updated_at'] ?? ''),
    source_platform: 'linear',
    raw: data,
  };
}

function normalizeGithubTask(data: Record<string, unknown>): NormalizedTask {
  const statusMap = STATUS_MAP['github'] ?? {};
  const labels = Array.isArray(data['labels'])
    ? data['labels'].map((l) =>
        typeof l === 'string' ? l : String((l as Record<string, unknown>)['name'] ?? ''),
      )
    : [];

  return {
    id: String(data['id'] ?? data['number'] ?? ''),
    title: String(data['title'] ?? ''),
    description: String(data['body'] ?? ''),
    status: statusMap[String(data['state'] ?? '')] ?? String(data['state'] ?? 'unknown'),
    priority: 'none',
    assignee: data['assignee']
      ? String((data['assignee'] as Record<string, unknown>)['login'] ?? '')
      : '',
    labels,
    url: String(data['html_url'] ?? data['url'] ?? ''),
    created_at: String(data['created_at'] ?? ''),
    updated_at: String(data['updated_at'] ?? ''),
    source_platform: 'github',
    raw: data,
  };
}

function normalizeJiraTask(data: Record<string, unknown>): NormalizedTask {
  const fields = (data['fields'] ?? {}) as Record<string, unknown>;
  const statusMap = STATUS_MAP['jira'] ?? {};
  const priorityMap = PRIORITY_MAP['jira'] ?? {};

  const statusObj = fields['status'] as Record<string, unknown> | undefined;
  const priorityObj = fields['priority'] as Record<string, unknown> | undefined;
  const assigneeObj = fields['assignee'] as Record<string, unknown> | undefined;

  return {
    id: String(data['key'] ?? data['id'] ?? ''),
    title: String(fields['summary'] ?? ''),
    description: String(fields['description'] ?? ''),
    status: statusMap[String(statusObj?.['name'] ?? '')] ?? String(statusObj?.['name'] ?? 'unknown'),
    priority: priorityMap[String(priorityObj?.['name'] ?? '')] ?? String(priorityObj?.['name'] ?? 'none'),
    assignee: String(assigneeObj?.['displayName'] ?? ''),
    labels: Array.isArray(fields['labels']) ? fields['labels'].map(String) : [],
    url: String(data['self'] ?? ''),
    created_at: String(fields['created'] ?? ''),
    updated_at: String(fields['updated'] ?? ''),
    source_platform: 'jira',
    raw: data,
  };
}

function normalizeNotionTask(data: Record<string, unknown>): NormalizedTask {
  const properties = (data['properties'] ?? {}) as Record<string, unknown>;
  const statusMap = STATUS_MAP['notion'] ?? {};

  // Extract title from title property
  const titleProp = Object.values(properties).find(
    (p) => (p as Record<string, unknown>)['type'] === 'title',
  ) as Record<string, unknown> | undefined;
  const titleArr = (titleProp?.['title'] ?? []) as Array<Record<string, unknown>>;
  const title = titleArr.map((t) => String(t['plain_text'] ?? '')).join('');

  // Extract status
  const statusProp = properties['Status'] as Record<string, unknown> | undefined;
  const statusSelect = statusProp?.['select'] as Record<string, unknown> | undefined;
  const statusName = String(statusSelect?.['name'] ?? '');

  return {
    id: String(data['id'] ?? ''),
    title,
    description: '',
    status: statusMap[statusName] ?? (statusName || 'unknown'),
    priority: 'none',
    assignee: '',
    labels: [],
    url: String(data['url'] ?? ''),
    created_at: String(data['created_time'] ?? ''),
    updated_at: String(data['last_edited_time'] ?? ''),
    source_platform: 'notion',
    raw: data,
  };
}

function normalizeGenericTask(platform: Platform, data: Record<string, unknown>): NormalizedTask {
  return {
    id: String(data['id'] ?? ''),
    title: String(data['title'] ?? data['name'] ?? ''),
    description: String(data['description'] ?? data['body'] ?? data['text'] ?? ''),
    status: String(data['status'] ?? 'unknown'),
    priority: String(data['priority'] ?? 'none'),
    assignee: String(data['assignee'] ?? ''),
    labels: Array.isArray(data['labels']) ? data['labels'].map(String) : [],
    url: String(data['url'] ?? ''),
    created_at: String(data['created_at'] ?? ''),
    updated_at: String(data['updated_at'] ?? ''),
    source_platform: platform,
    raw: data,
  };
}

function buildReverseMap(map: Record<string, string>): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [key, value] of Object.entries(map)) {
    reverse[value] = key;
  }
  return reverse;
}
