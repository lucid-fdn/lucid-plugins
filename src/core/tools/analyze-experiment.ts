// ---------------------------------------------------------------------------
// analyze-experiment.ts -- A/B test analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { getExperimentById, getExperimentByName } from '../db/experiments.js';
import { analyzeExperiment as runAnalysis } from '../analysis/experiment-analyzer.js';
import { formatPct } from '../utils/text.js';
import { log } from '../utils/logger.js';

interface AnalyzeExperimentParams {
  experiment_id?: string;
  experiment_name?: string;
}

export function createAnalyzeExperimentTool(deps: { config: PluginConfig }): ToolDefinition<AnalyzeExperimentParams> {
  return {
    name: 'metrics_analyze_experiment',
    description:
      'Analyze an A/B test experiment. Performs statistical significance testing, determines winner, and provides confidence intervals and lift metrics.',
    params: {
      experiment_id: { type: 'string', required: false, description: 'Experiment ID to analyze' },
      experiment_name: { type: 'string', required: false, description: 'Experiment name to look up' },
    },
    execute: async (params: AnalyzeExperimentParams): Promise<string> => {
      try {
        let experiment = null;

        if (params.experiment_id) {
          experiment = await getExperimentById(params.experiment_id);
        } else if (params.experiment_name) {
          experiment = await getExperimentByName(deps.config.tenantId, params.experiment_name);
        }

        if (!experiment) {
          return 'Error: Experiment not found. Provide a valid experiment_id or experiment_name.';
        }

        if (!experiment.variants || experiment.variants.length < 2) {
          return `Error: Experiment "${experiment.name}" has fewer than 2 variants. Cannot perform analysis.`;
        }

        const result = runAnalysis(experiment.variants);

        const lines = [
          `## Experiment Analysis: ${experiment.name}`,
          '',
          `- **Status**: ${experiment.status}`,
          `- **Hypothesis**: ${experiment.hypothesis || 'Not specified'}`,
          `- **Winner**: ${result.winner ?? 'No statistically significant winner yet'}`,
          `- **Confidence**: ${formatPct(result.confidence)}`,
          `- **Lift**: ${formatPct(result.lift)}`,
          `- **Sample size adequate**: ${result.sample_size_adequate ? 'Yes' : 'No (< 100 users per variant)'}`,
          '',
          '### Variants',
          ...result.variants.map(
            (v) =>
              `- **${v.name}**: ${v.conversions}/${v.users} users (${formatPct(v.conversion_rate)} conversion)`,
          ),
        ];

        if (experiment.start_date) lines.push(``, `- **Started**: ${experiment.start_date}`);
        if (experiment.end_date) lines.push(`- **Ended**: ${experiment.end_date}`);

        if (!result.sample_size_adequate) {
          lines.push('', '> **Warning**: Sample sizes are below the recommended minimum of 100 users per variant. Results may not be reliable.');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_analyze_experiment failed', msg);
        return `Error analyzing experiment: ${msg}`;
      }
    },
  };
}
