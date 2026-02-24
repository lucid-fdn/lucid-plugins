// ---------------------------------------------------------------------------
// analyze-sentiment.ts -- Analyze sentiment of feedback text
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { analyzeSentiment, detectUrgency } from '../analysis/sentiment-analyzer.js';
import { categorize } from '../analysis/categorizer.js';
import { log } from '../utils/logger.js';

export function createAnalyzeSentimentTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_analyze_sentiment',
    description:
      'Analyze the sentiment of a feedback text. Returns sentiment label (positive/negative/neutral), confidence score, detected keywords, category, and urgency.',
    params: {
      text: { type: 'string', required: true, description: 'The text to analyze for sentiment' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const text = params.text as string;
        const result = analyzeSentiment(text);
        const category = categorize(text);
        const urgency = detectUrgency(text);

        const lines: string[] = [
          '## Sentiment Analysis',
          '',
          `- **Sentiment**: ${result.sentiment}`,
          `- **Confidence**: ${(result.confidence * 100).toFixed(1)}%`,
          `- **Category**: ${category}`,
          `- **Urgency**: ${urgency}`,
        ];

        if (result.keywords.length > 0) {
          lines.push(`- **Keywords**: ${result.keywords.join(', ')}`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_analyze_sentiment failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
