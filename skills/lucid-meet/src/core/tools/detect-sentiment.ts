// ---------------------------------------------------------------------------
// detect-sentiment.ts -- Sentiment analysis of meeting
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getMeetingById, updateMeeting } from '../db/meetings.js';
import { analyzeSentiment, extractKeyTopics } from '../analysis/transcript-analyzer.js';
import { log } from '../utils/logger.js';

function analyzeSentimentPerSection(
  transcript: string,
): Array<{ section: string; sentiment: string; excerpt: string }> {
  const paragraphs = transcript.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  if (paragraphs.length === 0) return [];

  return paragraphs.slice(0, 10).map((p, i) => {
    const sentiment = analyzeSentiment(p);
    const excerpt = p.trim().slice(0, 80);
    return {
      section: `Section ${i + 1}`,
      sentiment,
      excerpt,
    };
  });
}

export function createDetectSentimentTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_detect_sentiment',
    description:
      'Analyze the sentiment of a meeting, both overall and per section/topic. Identifies positive, negative, neutral, and mixed tones.',
    params: {
      meeting_id: {
        type: 'number',
        required: false,
        description: 'Meeting ID to analyze',
      },
      transcript: {
        type: 'string',
        required: false,
        description: 'Raw transcript text (used if meeting_id not provided)',
      },
    },
    execute: async (params: { meeting_id?: number; transcript?: string }): Promise<string> => {
      try {
        let transcript: string;

        if (params.meeting_id) {
          const meeting = await getMeetingById(params.meeting_id);
          if (!meeting) return `Error: Meeting #${params.meeting_id} not found.`;
          if (!meeting.transcript) return `Error: Meeting #${params.meeting_id} has no transcript.`;
          transcript = meeting.transcript;
        } else if (params.transcript) {
          transcript = params.transcript;
        } else {
          return 'Error: Provide either meeting_id or transcript text.';
        }

        const overall = analyzeSentiment(transcript);
        const topics = extractKeyTopics(transcript);
        const sections = analyzeSentimentPerSection(transcript);

        // Update meeting if we have an ID
        if (params.meeting_id) {
          await updateMeeting(params.meeting_id, { sentiment: overall }).catch((err) =>
            log.warn('Failed to update meeting sentiment:', err),
          );
        }

        const lines: string[] = [
          '## Sentiment Analysis',
          '',
          `### Overall Sentiment: **${overall}**`,
          '',
        ];

        if (sections.length > 0) {
          lines.push('### Sentiment by Section');
          for (const s of sections) {
            lines.push(`- **${s.section}** (${s.sentiment}): "${s.excerpt}..."` );
          }
          lines.push('');
        }

        if (topics.length > 0) {
          lines.push('### Key Topics Detected');
          for (const topic of topics.slice(0, 5)) {
            lines.push(`- ${topic}`);
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_detect_sentiment failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
