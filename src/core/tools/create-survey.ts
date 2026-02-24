// ---------------------------------------------------------------------------
// create-survey.ts -- Create a feedback survey with questions
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { CHANNELS } from '../types/common.js';
import type { SurveyQuestion } from '../types/database.js';
import { createSurvey } from '../db/surveys.js';
import { log } from '../utils/logger.js';

export function createCreateSurveyTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_create_survey',
    description:
      'Create a new feedback survey with customizable questions. Supports text, rating, NPS, and multiple choice question types.',
    params: {
      name: { type: 'string', required: true, description: 'Name of the survey' },
      channel: {
        type: 'enum',
        required: false,
        values: [...CHANNELS],
        description: 'Distribution channel (default: survey)',
      },
      questions: {
        type: 'array',
        required: true,
        description: 'Array of questions, each with id, text, type, and optional options',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true, description: 'Unique question ID' },
            text: { type: 'string', required: true, description: 'Question text' },
            type: {
              type: 'enum',
              required: true,
              values: ['text', 'rating', 'nps', 'multiple_choice'],
              description: 'Question type',
            },
            options: {
              type: 'array',
              required: false,
              items: { type: 'string' },
              description: 'Options for multiple_choice questions',
            },
            required: { type: 'boolean', required: false, description: 'Whether the question is required' },
          },
        },
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const name = params.name as string;
        const channel = (params.channel as any) ?? 'survey';
        const questions = params.questions as SurveyQuestion[];

        if (!questions || questions.length === 0) {
          return 'Error: At least one question is required.';
        }

        const survey = await createSurvey({
          name,
          channel,
          questions,
        });

        const lines: string[] = [
          '## Survey Created',
          '',
          `- **ID**: ${survey.id}`,
          `- **Name**: ${survey.name}`,
          `- **Channel**: ${survey.channel}`,
          `- **Questions**: ${survey.questions.length}`,
          `- **Active**: ${survey.active}`,
          '',
          '### Questions',
        ];

        for (const q of survey.questions) {
          lines.push(`- [${q.type}] ${q.text}${q.required ? ' (required)' : ''}`);
          if (q.options) {
            lines.push(`  Options: ${q.options.join(', ')}`);
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_create_survey failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
