import { describe, it, expect, vi } from 'vitest';
import { SlackPublisher } from '../../../src/core/publishers/slack.js';

describe('SlackPublisher', () => {
  it('is not configured without webhook URL', () => {
    const p = new SlackPublisher({});
    expect(p.isConfigured()).toBe(false);
  });

  it('is configured with webhook URL', () => {
    const p = new SlackPublisher({ webhookUrl: 'https://hooks.slack.com/test' });
    expect(p.isConfigured()).toBe(true);
  });

  it('publishes successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('ok') });
    const p = new SlackPublisher({ webhookUrl: 'https://hooks.slack.com/test' });
    const result = await p.publish({
      content: 'Test content',
      title: 'Test',
      format: 'blog_post',
    });
    expect(result.success).toBe(true);
    expect(result.platform).toBe('slack');
  });
});
