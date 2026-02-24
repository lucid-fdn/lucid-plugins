// ---------------------------------------------------------------------------
// prompts.ts -- AI prompt templates for analytics insights
// ---------------------------------------------------------------------------

import type { MetricDataPoint } from '../types/provider.js';

export const METRIC_INSIGHT_PROMPT = `You are an expert product analyst. Analyze the following metric data and provide:
1. Key trends and patterns
2. Anomalies or outliers
3. Possible explanations
4. Actionable recommendations

Be concise and data-driven in your analysis.`;

export const FUNNEL_ANALYSIS_PROMPT = `You are an expert conversion rate optimization analyst. Analyze this funnel data and provide:
1. Which step has the highest drop-off and why it might be happening
2. Comparison to typical industry benchmarks
3. Specific, actionable recommendations to improve conversion at each step
4. Priority of changes based on potential impact

Focus on actionable insights.`;

export const RETENTION_ANALYSIS_PROMPT = `You are an expert product retention analyst. Analyze the retention data and provide:
1. Overall retention health assessment
2. Key churn points and their likely causes
3. Comparison to industry benchmarks
4. Strategies to improve retention at critical periods
5. Early warning signals to watch for

Be specific about timing and magnitudes.`;

export function buildMetricInsightPrompt(dataPoints: MetricDataPoint[]): string {
  const dataStr = dataPoints
    .map((p) => `${p.timestamp}: ${p.value}${p.label ? ` (${p.label})` : ''}`)
    .join('\n');

  return `${METRIC_INSIGHT_PROMPT}

## Data
${dataStr}

## Analysis`;
}

export function buildFunnelInsightPrompt(
  steps: Array<{ name: string; count: number; conversion: number; dropOff: number }>,
): string {
  const dataStr = steps
    .map((s) => `${s.name}: ${s.count} users, ${s.conversion.toFixed(1)}% conversion, ${s.dropOff.toFixed(1)}% drop-off`)
    .join('\n');

  return `${FUNNEL_ANALYSIS_PROMPT}

## Funnel Steps
${dataStr}

## Analysis`;
}

export function buildRetentionInsightPrompt(
  retentionRates: number[],
  churnPoints: Array<{ period: number; rate: number }>,
): string {
  const rateStr = retentionRates
    .map((r, i) => `Period ${i}: ${r.toFixed(1)}%`)
    .join('\n');

  const churnStr = churnPoints
    .map((c) => `Period ${c.period}: ${c.rate.toFixed(1)}% churn`)
    .join('\n');

  return `${RETENTION_ANALYSIS_PROMPT}

## Retention Rates
${rateStr}

## Key Churn Points
${churnStr}

## Analysis`;
}
