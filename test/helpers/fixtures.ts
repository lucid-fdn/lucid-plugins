// ---------------------------------------------------------------------------
// fixtures.ts -- Test fixtures for Feedback
// ---------------------------------------------------------------------------

import type { FeedbackItem, FeedbackSurvey, FeedbackTrend, FeedbackResponse, SurveyQuestion } from '../../src/core/types/index.js';

export const mockFeedbackPositive: FeedbackItem = {
  id: 1,
  tenant_id: 'default',
  channel: 'email',
  content: 'I love this product! It is amazing and works perfectly. The best tool I have ever used.',
  author_name: 'Jane Doe',
  author_email: 'jane@example.com',
  rating: 5,
  nps_score: 10,
  sentiment: 'very_positive',
  category: 'general',
  tags: ['positive', 'happy'],
  status: 'new',
  priority: 'low',
  response: null,
  responded_at: null,
  metadata: {},
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

export const mockFeedbackNegative: FeedbackItem = {
  id: 2,
  tenant_id: 'default',
  channel: 'support_ticket',
  content: 'This app is terrible. It crashes every time I try to use it. Broken and unusable. I hate it.',
  author_name: 'John Smith',
  author_email: 'john@example.com',
  rating: 1,
  nps_score: 1,
  sentiment: 'very_negative',
  category: 'bug',
  tags: ['bug', 'crash'],
  status: 'new',
  priority: 'critical',
  response: null,
  responded_at: null,
  metadata: {},
  created_at: '2026-01-16T10:00:00Z',
  updated_at: '2026-01-16T10:00:00Z',
};

export const mockFeedbackNeutral: FeedbackItem = {
  id: 3,
  tenant_id: 'default',
  channel: 'survey',
  content: 'The product is okay. It does what it says. Nothing special.',
  author_name: null,
  author_email: null,
  rating: 3,
  nps_score: 7,
  sentiment: 'neutral',
  category: 'general',
  tags: [],
  status: 'reviewed',
  priority: 'low',
  response: null,
  responded_at: null,
  metadata: {},
  created_at: '2026-01-17T10:00:00Z',
  updated_at: '2026-01-17T10:00:00Z',
};

export const mockFeedbackFeatureRequest: FeedbackItem = {
  id: 4,
  tenant_id: 'default',
  channel: 'intercom',
  content: 'Please add dark mode. I wish you could add an API integration feature. It would be nice to have webhooks.',
  author_name: 'Alice',
  author_email: 'alice@example.com',
  rating: 4,
  nps_score: 8,
  sentiment: 'positive',
  category: 'feature_request',
  tags: ['feature', 'dark-mode'],
  status: 'new',
  priority: 'medium',
  response: null,
  responded_at: null,
  metadata: { type: 'feature_request' },
  created_at: '2026-01-18T10:00:00Z',
  updated_at: '2026-01-18T10:00:00Z',
};

export const mockFeedbackBug: FeedbackItem = {
  id: 5,
  tenant_id: 'default',
  channel: 'app_store',
  content: 'The app has a bug where the login page crashes. This error happens every time. The issue is critical and urgent.',
  author_name: 'Bob',
  author_email: 'bob@example.com',
  rating: 1,
  nps_score: 2,
  sentiment: 'negative',
  category: 'bug',
  tags: ['bug', 'login', 'crash'],
  status: 'new',
  priority: 'high',
  response: null,
  responded_at: null,
  metadata: {},
  created_at: '2026-01-19T10:00:00Z',
  updated_at: '2026-01-19T10:00:00Z',
};

export const mockFeedbackPerformance: FeedbackItem = {
  id: 6,
  tenant_id: 'default',
  channel: 'email',
  content: 'The loading speed is very slow. Performance issues with latency make it frustrating.',
  author_name: 'Charlie',
  author_email: null,
  rating: 2,
  nps_score: 3,
  sentiment: 'negative',
  category: 'performance',
  tags: ['performance', 'slow'],
  status: 'new',
  priority: 'medium',
  response: null,
  responded_at: null,
  metadata: {},
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-20T10:00:00Z',
};

export const mockSurvey: FeedbackSurvey = {
  id: 1,
  tenant_id: 'default',
  name: 'Q1 Customer Survey',
  questions: [
    { id: 'q1', text: 'How satisfied are you?', type: 'rating', required: true },
    { id: 'q2', text: 'Would you recommend us?', type: 'nps', required: true },
    { id: 'q3', text: 'Any additional comments?', type: 'text', required: false },
  ],
  channel: 'survey',
  response_count: 42,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

export const mockSurveyQuestion: SurveyQuestion = {
  id: 'q1',
  text: 'How satisfied are you with our product?',
  type: 'rating',
  required: true,
};

export const mockTrend: FeedbackTrend = {
  id: 1,
  tenant_id: 'default',
  period: '2026-01',
  category: null,
  sentiment_avg: 0.3,
  volume: 150,
  nps_score: 35,
  top_themes: ['usability', 'performance', 'support'],
  created_at: '2026-01-31T00:00:00Z',
};

export const mockResponse: FeedbackResponse = {
  id: 1,
  tenant_id: 'default',
  feedback_id: 1,
  responder: 'support-agent',
  content: 'Thank you for your feedback! We appreciate your kind words.',
  sent_via: 'email',
  created_at: '2026-01-15T12:00:00Z',
};

export const allMockFeedback: FeedbackItem[] = [
  mockFeedbackPositive,
  mockFeedbackNegative,
  mockFeedbackNeutral,
  mockFeedbackFeatureRequest,
  mockFeedbackBug,
  mockFeedbackPerformance,
];
