import { describe, it, expect, vi } from 'vitest';
import { createRenderVideoTool } from '../../../src/core/tools/render-video.js';

const mockEngine = {
  render: vi.fn().mockResolvedValue({ render_id: 'r_abc', estimated_seconds: 120, status: 'queued' }),
  getStatus: vi.fn(),
  listTemplates: vi.fn(),
  thumbnail: vi.fn(),
  cancel: vi.fn(),
};

describe('render_video tool', () => {
  const tool = createRenderVideoTool({ engine: mockEngine as any });

  it('has correct name and description', () => {
    expect(tool.name).toBe('render_video');
    expect(tool.description).toContain('video');
  });

  it('validates and renders a brief', async () => {
    const result = await tool.execute({
      template_id: 'social-clip-v1',
      scenes: JSON.stringify([{ type: 'title', duration: 3, props: { text: 'Hi' } }]),
      format: 'mp4',
      resolution: '1080p',
      priority: 'standard',
    });

    expect(mockEngine.render).toHaveBeenCalled();
    expect(result).toContain('r_abc');
  });

  it('rejects invalid input', async () => {
    const result = await tool.execute({
      template_id: '',
      scenes: '[]',
      format: 'mp4',
      resolution: '1080p',
    });

    expect(result).toContain('Error');
  });
});
