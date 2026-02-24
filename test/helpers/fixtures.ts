// ---------------------------------------------------------------------------
// fixtures.ts -- Mock data for tests
// ---------------------------------------------------------------------------

import type { MetricEvent, MetricDefinition, FunnelDefinition, Experiment, Feature, ExperimentVariant } from '../../src/core/types/index.js';

export function mockEvent(overrides?: Partial<MetricEvent>): MetricEvent {
  return {
    id: 'evt-001',
    tenant_id: 'default',
    event_name: 'page_view',
    event_type: 'page_view',
    user_id: 'user-001',
    session_id: 'session-001',
    properties: {},
    timestamp: '2024-06-15T10:00:00Z',
    created_at: '2024-06-15T10:00:00Z',
    ...overrides,
  };
}

export function mockEvents(count: number, eventName = 'page_view'): MetricEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date('2024-06-01T00:00:00Z');
    date.setDate(date.getDate() + Math.floor(i / 3));
    date.setHours(i % 24);
    return mockEvent({
      id: `evt-${String(i + 1).padStart(3, '0')}`,
      event_name: eventName,
      user_id: `user-${String((i % 10) + 1).padStart(3, '0')}`,
      session_id: `session-${String(i + 1).padStart(3, '0')}`,
      properties: { value: (i + 1) * 10 },
      timestamp: date.toISOString(),
      created_at: date.toISOString(),
    });
  });
}

export function mockMetricDefinition(overrides?: Partial<MetricDefinition>): MetricDefinition {
  return {
    id: 'metric-001',
    tenant_id: 'default',
    name: 'page_views',
    description: 'Total page views',
    event_name: 'page_view',
    aggregation: 'count',
    filters: {},
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

export function mockFunnelDefinition(overrides?: Partial<FunnelDefinition>): FunnelDefinition {
  return {
    id: 'funnel-001',
    tenant_id: 'default',
    name: 'signup_flow',
    steps: [
      { event_name: 'landing_page' },
      { event_name: 'signup_start' },
      { event_name: 'signup_complete' },
      { event_name: 'first_action' },
    ],
    conversion_window: 72,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

export function mockExperiment(overrides?: Partial<Experiment>): Experiment {
  return {
    id: 'exp-001',
    tenant_id: 'default',
    name: 'cta_color_test',
    description: 'Testing CTA button color',
    hypothesis: 'A green CTA will increase conversions by 15%',
    status: 'running',
    variants: mockExperimentVariants(),
    metric_id: 'metric-001',
    start_date: '2024-06-01T00:00:00Z',
    end_date: null,
    results: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
    ...overrides,
  };
}

export function mockExperimentVariants(): ExperimentVariant[] {
  return [
    { name: 'control', weight: 0.5, users: 1000, conversions: 50, conversion_rate: 5.0 },
    { name: 'variant_a', weight: 0.5, users: 1000, conversions: 70, conversion_rate: 7.0 },
  ];
}

export function mockFeature(overrides?: Partial<Feature>): Feature {
  return {
    id: 'feat-001',
    tenant_id: 'default',
    name: 'dark_mode',
    description: 'Dark mode toggle for the app',
    status: 'beta',
    adoption_metric_id: null,
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
    ...overrides,
  };
}
