// ---------------------------------------------------------------------------
// retention-analyzer.ts -- Retention cohort analysis
// ---------------------------------------------------------------------------

export interface RetentionCurve {
  periods: number[];
  rates: number[];
  average_retention: number;
}

export interface ChurnPoint {
  period: number;
  churn_rate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function buildCohortMatrix(
  cohortSizes: number[],
  returnCounts: number[][],
): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < cohortSizes.length; i++) {
    const size = cohortSizes[i];
    const returns = returnCounts[i] ?? [];
    const row: number[] = returns.map((count) => (size > 0 ? (count / size) * 100 : 0));
    matrix.push(row);
  }

  return matrix;
}

export function computeRetentionCurve(matrix: number[][]): RetentionCurve {
  if (matrix.length === 0) {
    return { periods: [], rates: [], average_retention: 0 };
  }

  const maxPeriods = Math.max(...matrix.map((row) => row.length));
  const periods: number[] = [];
  const rates: number[] = [];

  for (let col = 0; col < maxPeriods; col++) {
    const values = matrix.filter((row) => row.length > col).map((row) => row[col]);
    if (values.length === 0) continue;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    periods.push(col);
    rates.push(avg);
  }

  const average_retention = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

  return { periods, rates, average_retention };
}

export function findChurnPoints(curve: RetentionCurve): ChurnPoint[] {
  const points: ChurnPoint[] = [];

  for (let i = 1; i < curve.rates.length; i++) {
    const prev = curve.rates[i - 1];
    const curr = curve.rates[i];
    const churn_rate = prev - curr;

    if (churn_rate > 0) {
      let severity: ChurnPoint['severity'];
      if (churn_rate >= 30) severity = 'critical';
      else if (churn_rate >= 20) severity = 'high';
      else if (churn_rate >= 10) severity = 'medium';
      else severity = 'low';

      points.push({
        period: curve.periods[i],
        churn_rate,
        severity,
      });
    }
  }

  return points.sort((a, b) => b.churn_rate - a.churn_rate);
}
