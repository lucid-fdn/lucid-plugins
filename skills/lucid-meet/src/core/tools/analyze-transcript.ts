// ---------------------------------------------------------------------------
// analyze-transcript.ts -- Analyze meeting transcript
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getMeetingById, updateMeeting } from '../db/meetings.js';
import {
  extractActionItems,
  extractDecisions,
  extractKeyTopics,
  analyzeSentiment,
  generateSummary,
} from '../analysis/transcript-analyzer.js';
import { log } from '../utils/logger.js';

export interface AnalyzeTranscriptDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createAnalyzeTranscriptTool(_deps: AnalyzeTranscriptDeps): ToolDefinition {
  return {
    name: 'meet_analyze_transcript',
    description:
      'Analyze a meeting transcript to extract key topics, decisions, action items, and sentiment. Provide either a meeting_id (to analyze stored transcript) or raw transcript text.',
    params: {
      meeting_id: {
        type: 'number',
        required: false,
        description: 'ID of the meeting whose transcript to analyze',
      },
      transcript: {
        type: 'string',
        required: false,
        description: 'Raw transcript text to analyze (used if meeting_id not provided)',
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

        const actions = extractActionItems(transcript);
        const decisions = extractDecisions(transcript);
        const topics = extractKeyTopics(transcript);
        const sentiment = analyzeSentiment(transcript);
        const summary = generateSummary(transcript);

        // Update meeting record if we have an ID
        if (params.meeting_id) {
          await updateMeeting(params.meeting_id, {
            summary,
            key_topics: topics,
            sentiment,
          }).catch((err) => log.warn('Failed to update meeting with analysis:', err));
        }

        const lines: string[] = [
          '## Transcript Analysis',
          '',
          '### Summary',
          summary,
          '',
          `### Sentiment: **${sentiment}**`,
          '',
        ];

        if (topics.length > 0) {
          lines.push(`### Key Topics (${topics.length})`);
          for (const topic of topics) {
            lines.push(`- ${topic}`);
          }
          lines.push('');
        }

        if (actions.length > 0) {
          lines.push(`### Action Items (${actions.length})`);
          for (const action of actions) {
            const due = action.dueHint ? ` (due: ${action.dueHint})` : '';
            lines.push(`- **${action.title}** -- ${action.assignee}${due} [${action.priority}]`);
          }
          lines.push('');
        }

        if (decisions.length > 0) {
          lines.push(`### Decisions (${decisions.length})`);
          for (const decision of decisions) {
            lines.push(`- **${decision.title}**: ${decision.description} (by ${decision.decidedBy})`);
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_analyze_transcript failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
