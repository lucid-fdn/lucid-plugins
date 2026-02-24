// ---------------------------------------------------------------------------
// get-participant-stats.ts -- Speaking time, contribution metrics
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getMeetingById } from '../db/meetings.js';
import { listActionItems } from '../db/action-items.js';
import { wordCount } from '../utils/text.js';
import { log } from '../utils/logger.js';

interface ParticipantStat {
  name: string;
  lineCount: number;
  wordCount: number;
  actionItemCount: number;
  speakingPercent: number;
}

function parseTranscriptByParticipant(transcript: string): Map<string, string[]> {
  const lines = transcript.split('\n');
  const byParticipant = new Map<string, string[]>();

  let currentSpeaker = 'Unknown';
  for (const line of lines) {
    const speakerMatch = line.match(/^([A-Za-z][A-Za-z\s.'-]{0,40}):\s+(.+)/);
    if (speakerMatch) {
      currentSpeaker = speakerMatch[1].trim();
      const content = speakerMatch[2].trim();
      const existing = byParticipant.get(currentSpeaker) ?? [];
      existing.push(content);
      byParticipant.set(currentSpeaker, existing);
    } else if (line.trim() && currentSpeaker) {
      const existing = byParticipant.get(currentSpeaker) ?? [];
      existing.push(line.trim());
      byParticipant.set(currentSpeaker, existing);
    }
  }

  return byParticipant;
}

export function createGetParticipantStatsTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_get_participant_stats',
    description:
      'Get speaking time and contribution metrics per participant in a meeting. Analyzes transcript for line count, word count, and assigned action items.',
    params: {
      meeting_id: {
        type: 'number',
        required: true,
        description: 'Meeting ID to analyze participant stats for',
      },
    },
    execute: async (params: { meeting_id: number }): Promise<string> => {
      try {
        const meeting = await getMeetingById(params.meeting_id);
        if (!meeting) return `Error: Meeting #${params.meeting_id} not found.`;
        if (!meeting.transcript)
          return `Error: Meeting #${params.meeting_id} has no transcript for analysis.`;

        const byParticipant = parseTranscriptByParticipant(meeting.transcript);

        if (byParticipant.size === 0) {
          return 'Could not identify any participants in the transcript. Ensure transcript uses "Name: text" format.';
        }

        const actions = await listActionItems({ meeting_id: meeting.id }).catch(() => []);

        const totalWords = Array.from(byParticipant.values())
          .flat()
          .reduce((sum, line) => sum + wordCount(line), 0);

        const stats: ParticipantStat[] = [];
        for (const [name, lines] of byParticipant) {
          const wc = lines.reduce((sum, line) => sum + wordCount(line), 0);
          stats.push({
            name,
            lineCount: lines.length,
            wordCount: wc,
            actionItemCount: actions.filter(
              (a) => a.assignee.toLowerCase() === name.toLowerCase(),
            ).length,
            speakingPercent: totalWords > 0 ? Math.round((wc / totalWords) * 100) : 0,
          });
        }

        stats.sort((a, b) => b.wordCount - a.wordCount);

        const lines: string[] = [
          `## Participant Stats: ${meeting.title}`,
          '',
          `Total participants: ${stats.length} | Total words: ${totalWords}`,
          '',
        ];

        for (const s of stats) {
          lines.push(`### ${s.name}`);
          lines.push(`- Speaking share: ${s.speakingPercent}%`);
          lines.push(`- Words: ${s.wordCount} | Lines: ${s.lineCount}`);
          lines.push(`- Action items assigned: ${s.actionItemCount}`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_get_participant_stats failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
