// ---------------------------------------------------------------------------
// experiment-analyzer.ts -- A/B test statistical analysis
// ---------------------------------------------------------------------------

import type { ExperimentVariant } from '../types/database.js';

export interface ExperimentResult {
  winner: string | null;
  confidence: number;
  lift: number;
  sample_size_adequate: boolean;
  variants: VariantResult[];
}

export interface VariantResult {
  name: string;
  conversion_rate: number;
  users: number;
  conversions: number;
}

export interface SignificanceResult {
  p_value: number;
  significant: boolean;
  z_score: number;
}

const MIN_SAMPLE_SIZE = 100;
const SIGNIFICANCE_THRESHOLD = 0.05;

export function analyzeExperiment(variants: ExperimentVariant[]): ExperimentResult {
  if (variants.length < 2) {
    return {
      winner: null,
      confidence: 0,
      lift: 0,
      sample_size_adequate: false,
      variants: variants.map((v) => ({
        name: v.name,
        conversion_rate: v.conversion_rate,
        users: v.users,
        conversions: v.conversions,
      })),
    };
  }

  const control = variants[0];
  const sample_size_adequate = variants.every((v) => v.users >= MIN_SAMPLE_SIZE);

  let bestVariant = control;
  let bestLift = 0;
  let bestSignificance: SignificanceResult = { p_value: 1, significant: false, z_score: 0 };

  for (let i = 1; i < variants.length; i++) {
    const variant = variants[i];
    const sig = computeStatisticalSignificance(control, variant);

    const lift = control.conversion_rate > 0 ? ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100 : 0;

    if (variant.conversion_rate > bestVariant.conversion_rate && sig.significant) {
      bestVariant = variant;
      bestLift = lift;
      bestSignificance = sig;
    } else if (variant.conversion_rate > bestVariant.conversion_rate && !bestSignificance.significant) {
      bestVariant = variant;
      bestLift = lift;
      bestSignificance = sig;
    }
  }

  const winner = bestSignificance.significant && bestVariant !== control ? bestVariant.name : null;
  const confidence = (1 - bestSignificance.p_value) * 100;

  return {
    winner,
    confidence,
    lift: bestLift,
    sample_size_adequate,
    variants: variants.map((v) => ({
      name: v.name,
      conversion_rate: v.conversion_rate,
      users: v.users,
      conversions: v.conversions,
    })),
  };
}

export function computeStatisticalSignificance(
  control: ExperimentVariant,
  variant: ExperimentVariant,
): SignificanceResult {
  const p1 = control.users > 0 ? control.conversions / control.users : 0;
  const p2 = variant.users > 0 ? variant.conversions / variant.users : 0;
  const n1 = control.users;
  const n2 = variant.users;

  if (n1 === 0 || n2 === 0) {
    return { p_value: 1, significant: false, z_score: 0 };
  }

  const pPooled = (control.conversions + variant.conversions) / (n1 + n2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return { p_value: 1, significant: false, z_score: 0 };
  }

  const z_score = (p2 - p1) / se;
  const p_value = 2 * (1 - normalCdf(Math.abs(z_score)));

  return {
    p_value,
    significant: p_value < SIGNIFICANCE_THRESHOLD,
    z_score,
  };
}

/**
 * Approximation of the standard normal CDF using the Abramowitz and Stegun formula.
 */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);

  return 0.5 * (1 + sign * y);
}
