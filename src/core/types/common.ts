// ---------------------------------------------------------------------------
// common.ts -- Shared constants and types
// ---------------------------------------------------------------------------

export const SEARCH_ENGINES = ['google', 'bing', 'yahoo'] as const;
export type SearchEngine = (typeof SEARCH_ENGINES)[number];

export const COUNTRIES = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'br', 'in', 'jp'] as const;
export type Country = (typeof COUNTRIES)[number];

export const LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'zh', 'ko', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

export const KEYWORD_INTENTS = ['informational', 'navigational', 'transactional', 'commercial'] as const;
export type KeywordIntent = (typeof KEYWORD_INTENTS)[number];

export const CONTENT_TYPES = [
  'blog_post',
  'landing_page',
  'product_page',
  'category_page',
  'guide',
  'faq',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'very_hard'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const AUDIT_SEVERITIES = ['critical', 'warning', 'info', 'pass'] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const LINK_TYPES = ['dofollow', 'nofollow', 'ugc', 'sponsored'] as const;
export type LinkType = (typeof LINK_TYPES)[number];
