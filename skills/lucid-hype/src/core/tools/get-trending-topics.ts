// ---------------------------------------------------------------------------
// get-trending-topics.ts -- Trending topics by platform
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, type Platform, type TrendingTopic } from '../types/common.js';
import { log } from '../utils/logger.js';

/**
 * Generate mock trending topics based on platform.
 * In production, this would use platform APIs.
 */
function getMockTrending(platform: Platform, query?: string): TrendingTopic[] {
  const baseTopics: Record<Platform, TrendingTopic[]> = {
    twitter: [
      {
        topic: 'AI Agents',
        platform: 'twitter',
        velocity: 85,
        volume: 125000,
        relatedKeywords: ['LLM', 'automation', 'claude'],
        sentiment: { positive: 0.6, neutral: 0.3, negative: 0.1 },
      },
      {
        topic: 'Developer Tools',
        platform: 'twitter',
        velocity: 72,
        volume: 89000,
        relatedKeywords: ['devtools', 'productivity', 'coding'],
        sentiment: { positive: 0.7, neutral: 0.2, negative: 0.1 },
      },
    ],
    linkedin: [
      {
        topic: 'Remote Work',
        platform: 'linkedin',
        velocity: 68,
        volume: 200000,
        relatedKeywords: ['WFH', 'hybrid', 'flexibility'],
        sentiment: { positive: 0.5, neutral: 0.35, negative: 0.15 },
      },
    ],
    reddit: [
      {
        topic: 'Open Source',
        platform: 'reddit',
        velocity: 75,
        volume: 45000,
        relatedKeywords: ['FOSS', 'GitHub', 'community'],
        sentiment: { positive: 0.65, neutral: 0.25, negative: 0.1 },
      },
    ],
    producthunt: [
      {
        topic: 'AI Tools',
        platform: 'producthunt',
        velocity: 90,
        volume: 15000,
        relatedKeywords: ['productivity', 'SaaS', 'launch'],
        sentiment: { positive: 0.8, neutral: 0.15, negative: 0.05 },
      },
    ],
    hackernews: [
      {
        topic: 'Systems Programming',
        platform: 'hackernews',
        velocity: 60,
        volume: 8000,
        relatedKeywords: ['Rust', 'performance', 'low-level'],
        sentiment: { positive: 0.55, neutral: 0.35, negative: 0.1 },
      },
    ],
    tiktok: [
      {
        topic: 'Tech Reviews',
        platform: 'tiktok',
        velocity: 95,
        volume: 500000,
        relatedKeywords: ['gadgets', 'unboxing', 'tech'],
        sentiment: { positive: 0.7, neutral: 0.2, negative: 0.1 },
      },
    ],
    youtube: [
      {
        topic: 'Tutorial Content',
        platform: 'youtube',
        velocity: 70,
        volume: 300000,
        relatedKeywords: ['how-to', 'learn', 'guide'],
        sentiment: { positive: 0.75, neutral: 0.2, negative: 0.05 },
      },
    ],
    instagram: [
      {
        topic: 'Behind The Scenes',
        platform: 'instagram',
        velocity: 80,
        volume: 400000,
        relatedKeywords: ['BTS', 'startup', 'authentic'],
        sentiment: { positive: 0.7, neutral: 0.25, negative: 0.05 },
      },
    ],
    discord: [
      {
        topic: 'Community Building',
        platform: 'discord',
        velocity: 55,
        volume: 20000,
        relatedKeywords: ['server', 'engagement', 'members'],
        sentiment: { positive: 0.6, neutral: 0.3, negative: 0.1 },
      },
    ],
    telegram: [
      {
        topic: 'Crypto Updates',
        platform: 'telegram',
        velocity: 88,
        volume: 150000,
        relatedKeywords: ['blockchain', 'DeFi', 'web3'],
        sentiment: { positive: 0.5, neutral: 0.3, negative: 0.2 },
      },
    ],
  };

  let topics = baseTopics[platform] ?? [];
  if (query) {
    const lower = query.toLowerCase();
    topics = topics.filter(
      (t) =>
        t.topic.toLowerCase().includes(lower) ||
        t.relatedKeywords.some((k) => k.toLowerCase().includes(lower)),
    );
  }
  return topics;
}

export function createGetTrendingTopicsTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_get_trending_topics',
    description:
      'Get trending topics by platform with velocity scores, volume, and sentiment data.',
    params: {
      platform: {
        type: 'enum',
        required: true,
        values: [...PLATFORMS],
        description: 'Platform to check trends',
      },
      query: {
        type: 'string',
        required: false,
        description: 'Optional search query to filter topics',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const platform = params.platform as Platform;
        const query = params.query as string | undefined;
        const topics = getMockTrending(platform, query);

        if (topics.length === 0) {
          return `No trending topics found for ${platform}${query ? ` matching "${query}"` : ''}.`;
        }

        const lines = [
          `## Trending on ${platform}${query ? ` (query: "${query}")` : ''}`,
          '',
        ];

        for (const t of topics) {
          lines.push(`### ${t.topic}`);
          lines.push(`- **Velocity**: ${t.velocity}/100`);
          lines.push(`- **Volume**: ${t.volume.toLocaleString()}`);
          lines.push(`- **Related**: ${t.relatedKeywords.join(', ')}`);
          lines.push(
            `- **Sentiment**: +${(t.sentiment.positive * 100).toFixed(0)}% / ~${(t.sentiment.neutral * 100).toFixed(0)}% / -${(t.sentiment.negative * 100).toFixed(0)}%`,
          );
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_get_trending_topics failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
