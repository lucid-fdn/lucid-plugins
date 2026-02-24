// ---------------------------------------------------------------------------
// analyze-funnel.ts -- Funnel conversion analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { getFunnelByName, createFunnel } from '../db/funnels.js';
import { queryEvents } from '../db/events.js';
import { analyzeFunnel } from '../analysis/funnel-analyzer.js';
import { buildFunnelInsightPrompt } from '../analysis/prompts.js';
import { formatPct } from '../utils/text.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

interface AnalyzeFunnelParams {
  funnel_name?: string;
  steps?: Array<{ event_name: string; filters?: Record<string, unknown> }>;
  conversion_window?: number;
  start_date?: string;
  end_date?: string;
}

export function createAnalyzeFunnelTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition<AnalyzeFunnelParams> {
  return {
    name: 'metrics_analyze_funnel',
    description:
      'Analyze a conversion funnel. Shows step-by-step conversion rates, drop-off rates, and identifies the bottleneck step. Can use saved funnels or ad-hoc step definitions.',
    params: {
      funnel_name: {
        type: 'string',
        required: false,
        description: 'Name of a saved funnel definition to analyze',
      },
      steps: {
        type: 'array',
        required: false,
        description: 'Ad-hoc funnel steps (array of {event_name, filters?})',
        items: {
          type: 'object',
          properties: {
            event_name: { type: 'string', required: true, description: 'Event name for this step' },
            filters: { type: 'object', required: false, description: 'Optional filters' },
          },
        },
      },
      conversion_window: {
        type: 'number',
        required: false,
        description: 'Conversion window in hours (default 72)',
        default: 72,
      },
      start_date: { type: 'string', required: false, description: 'Start date (ISO format)' },
      end_date: { type: 'string', required: false, description: 'End date (ISO format)' },
    },
    execute: async (params: AnalyzeFunnelParams): Promise<string> => {
      try {
        const startDate = params.start_date ?? isoDate(daysAgo(30));
        const endDate = params.end_date ?? isoDate(new Date());

        let steps = params.steps;

        if (params.funnel_name) {
          const funnel = await getFunnelByName(deps.config.tenantId, params.funnel_name);
          if (funnel) {
            steps = funnel.steps;
          }
        }

        if (!steps || steps.length < 2) {
          // If steps provided inline, save as funnel
          if (params.funnel_name && params.steps && params.steps.length >= 2) {
            await createFunnel({
              tenant_id: deps.config.tenantId,
              name: params.funnel_name,
              steps: params.steps,
              conversion_window: params.conversion_window,
            });
            steps = params.steps;
          } else {
            return 'Error: At least 2 funnel steps are required. Provide either a funnel_name or steps array.';
          }
        }

        // Count users at each step
        const stepCounts: number[] = [];
        for (const step of steps) {
          const events = await queryEvents({
            tenant_id: deps.config.tenantId,
            event_name: step.event_name,
            start_date: startDate,
            end_date: endDate,
          });
          const uniqueUsers = new Set(events.map((e) => e.user_id).filter(Boolean));
          stepCounts.push(uniqueUsers.size);
        }

        const analysis = analyzeFunnel(stepCounts);

        const stepDetails = steps.map((step, i) => ({
          name: step.event_name,
          count: stepCounts[i],
          conversion: analysis.conversion_rates[i],
          dropOff: analysis.drop_off_rates[i],
        }));

        const lines = [
          `## Funnel Analysis${params.funnel_name ? `: ${params.funnel_name}` : ''}`,
          '',
          `- **Period**: ${startDate} to ${endDate}`,
          `- **Overall Conversion**: ${formatPct(analysis.overall_conversion)}`,
          `- **Bottleneck Step**: ${analysis.bottleneck_step >= 0 ? steps[analysis.bottleneck_step].event_name : 'N/A'} (Step ${analysis.bottleneck_step + 1})`,
          '',
          '### Steps',
          ...stepDetails.map(
            (s, i) =>
              `${i + 1}. **${s.name}**: ${s.count} users | Conversion: ${formatPct(s.conversion)} | Drop-off: ${formatPct(s.dropOff)}`,
          ),
          '',
          '### AI Insight Prompt',
          buildFunnelInsightPrompt(stepDetails),
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_analyze_funnel failed', msg);
        return `Error analyzing funnel: ${msg}`;
      }
    },
  };
}
