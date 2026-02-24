import { describe, it, expect } from 'vitest';
import { BlogPostTransformer } from '../../../src/core/content/blog-post.js';

describe('BlogPostTransformer', () => {
  it('has correct format and name', () => {
    const t = new BlogPostTransformer();
    expect(t.format).toBe('blog_post');
    expect(t.name).toBe('Blog Post');
  });

  it('builds prompt with system and user prompts', () => {
    const t = new BlogPostTransformer();
    const result = t.buildPrompt({
      digestMarkdown: '# Test Digest\n\nContent here',
      digestTitle: 'Test Digest',
      format: 'blog_post',
      language: 'en',
    });
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userPrompt).toContain('Test Digest');
    expect(result.format).toBe('blog_post');
  });
});
