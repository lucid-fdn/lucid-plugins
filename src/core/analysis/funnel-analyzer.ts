// ---------------------------------------------------------------------------
// funnel-analyzer.ts -- Funnel conversion analysis
// ---------------------------------------------------------------------------

export interface FunnelAnalysis {
  conversion_rates: number[];
  drop_off_rates: number[];
  bottleneck_step: number;
  overall_conversion: number;
}

export interface FunnelComparison {
  period_a: FunnelAnalysis;
  period_b: FunnelAnalysis;
  conversion_change: number[];
  overall_change: number;
  improved_steps: number[];
  degraded_steps: number[];
}

export function analyzeFunnel(stepCounts: number[]): FunnelAnalysis {
  if (stepCounts.length === 0) {
    return { conversion_rates: [], drop_off_rates: [], bottleneck_step: -1, overall_conversion: 0 };
  }

  const conversion_rates: number[] = [];
  const drop_off_rates: number[] = [];
  let maxDropOff = -1;
  let bottleneck_step = 0;

  for (let i = 0; i < stepCounts.length; i++) {
    if (i === 0) {
      conversion_rates.push(100);
      drop_off_rates.push(0);
    } else {
      const prev = stepCounts[i - 1];
      const current = stepCounts[i];
      const rate = prev > 0 ? (current / prev) * 100 : 0;
      const dropOff = prev > 0 ? ((prev - current) / prev) * 100 : 0;

      conversion_rates.push(rate);
      drop_off_rates.push(dropOff);

      if (dropOff > maxDropOff) {
        maxDropOff = dropOff;
        bottleneck_step = i;
      }
    }
  }

  const first = stepCounts[0];
  const last = stepCounts[stepCounts.length - 1];
  const overall_conversion = first > 0 ? (last / first) * 100 : 0;

  return { conversion_rates, drop_off_rates, bottleneck_step, overall_conversion };
}

export function compareFunnels(stepsA: number[], stepsB: number[]): FunnelComparison {
  const period_a = analyzeFunnel(stepsA);
  const period_b = analyzeFunnel(stepsB);

  const maxLen = Math.max(period_a.conversion_rates.length, period_b.conversion_rates.length);
  const conversion_change: number[] = [];
  const improved_steps: number[] = [];
  const degraded_steps: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    const rateA = period_a.conversion_rates[i] ?? 0;
    const rateB = period_b.conversion_rates[i] ?? 0;
    const change = rateB - rateA;
    conversion_change.push(change);

    if (change > 1) improved_steps.push(i);
    if (change < -1) degraded_steps.push(i);
  }

  const overall_change = period_b.overall_conversion - period_a.overall_conversion;

  return { period_a, period_b, conversion_change, overall_change, improved_steps, degraded_steps };
}
