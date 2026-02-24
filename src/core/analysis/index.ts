export {
  aggregateEvents,
  computeGrowthRate,
  computePercentile,
  buildTimeSeries,
  type TimeSeriesPoint,
} from './metric-calculator.js';

export { analyzeFunnel, compareFunnels, type FunnelAnalysis, type FunnelComparison } from './funnel-analyzer.js';

export {
  buildCohortMatrix,
  computeRetentionCurve,
  findChurnPoints,
  type RetentionCurve,
  type ChurnPoint,
} from './retention-analyzer.js';

export {
  analyzeExperiment,
  computeStatisticalSignificance,
  type ExperimentResult,
  type VariantResult,
  type SignificanceResult,
} from './experiment-analyzer.js';

export {
  METRIC_INSIGHT_PROMPT,
  FUNNEL_ANALYSIS_PROMPT,
  RETENTION_ANALYSIS_PROMPT,
  buildMetricInsightPrompt,
  buildFunnelInsightPrompt,
  buildRetentionInsightPrompt,
} from './prompts.js';
