import { describe, it, expect, vi } from 'vitest';
import { SlackPublisher } from '../../src/core/publishers/slack.js';
import { DiscordPublisher } from '../../src/core/publishers/discord.js';

describe('Publish pipeline', () => {
  it('publishes to Slack via webhook', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('ok') });
    const publisher = new SlackPublisher({ webhookUrl: 'https://hooks.slack.com/test' });
    const result = await publisher.publish({
      content: 'Test digest content',
      title: 'Daily Digest',
      format: 'blog_post',
    });
    expect(result.success).toBe(true);
  });

  it('handles publish failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const publisher = new DiscordPublisher({ webhookUrl: 'https://discord.com/api/webhooks/test' });
    const result = await publisher.publish({
      content: 'Test',
      title: 'Test',
      format: 'blog_post',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
