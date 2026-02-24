export type SourceType = 'rss' | 'twitter' | 'reddit' | 'hackernews' | 'web';
export type DigestType = 'daily' | 'weekly';
export type ContentFormat = 'blog_post' | 'x_thread' | 'linkedin_post' | 'newsletter';
export type PublishPlatform =
  | 'ghost'
  | 'wordpress'
  | 'twitter'
  | 'linkedin'
  | 'devto'
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'openclaw_channel';
export type ItemStatus = 'new' | 'processed' | 'archived' | 'error';
export type PublishStatus = 'pending' | 'published' | 'failed';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
