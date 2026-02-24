// ---------------------------------------------------------------------------
// provider.ts -- Social provider interface
// ---------------------------------------------------------------------------

import type { Platform } from './common.js';

export interface SocialMetrics {
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagementRate: number;
}

export interface SocialProvider {
  /** Provider name (e.g. 'twitter', 'linkedin'). */
  name: string;

  /** Platform this provider covers. */
  platform: Platform;

  /** Whether the provider has necessary credentials configured. */
  isConfigured(): boolean;

  /** Fetch metrics for a given post URL. */
  getPostMetrics(url: string): Promise<SocialMetrics>;

  /** Search for trending topics on this platform. */
  getTrending(query?: string): Promise<{ topic: string; volume: number }[]>;
}
