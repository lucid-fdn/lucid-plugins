// ---------------------------------------------------------------------------
// brain/formatter.ts -- Format brain results into structured plaintext
// ---------------------------------------------------------------------------
import type {
  ThinkResult,
  ProtectResult,
  ReviewResult,
  ScanResult,
} from './types.js';

export function formatThinkResult(r: ThinkResult): string {
  const lines: string[] = [];
  lines.push(`${r.symbol} — ${r.verdict} (Score: ${r.score}/100)`);
  lines.push('');
  lines.push('WHY:');
  if (r.rulesTriggered.length > 0) {
    for (const rule of r.rulesTriggered) {
      const sign = rule.contribution > 0 ? '+' : '';
      lines.push(`  • [${sign}${rule.contribution}] ${rule.description}`);
    }
  } else {
    lines.push('  • No rules triggered');
  }
  lines.push('');
  lines.push('EVIDENCE:');
  lines.push(`  • Trend: ${r.evidence.trend.type} (${r.evidence.trend.pctFromSma}% from SMA)`);
  lines.push(`  • RSI(14): ${r.evidence.rsi.value.toFixed(1)}`);
  lines.push(`  • MACD: ${r.evidence.macd.line.toFixed(2)} / ${r.evidence.macd.signal.toFixed(2)} (hist: ${r.evidence.macd.histogram.toFixed(2)})`);
  lines.push(`  • BB: $${r.evidence.bollingerBands.lower.toFixed(2)} / $${r.evidence.bollingerBands.middle.toFixed(2)} / $${r.evidence.bollingerBands.upper.toFixed(2)} (pos: ${r.evidence.bollingerBands.position.toFixed(2)})`);
  lines.push(`  • Volatility: ${r.evidence.volatility.regime} (HV: ${r.evidence.volatility.hv}%, ATR: ${r.evidence.volatility.atrPct}%)`);
  if (r.how) {
    lines.push('');
    lines.push('HOW:');
    lines.push(`  • Best venue: ${r.how.venue}`);
    lines.push(`  • Position: $${r.how.positionValue} (${r.how.riskPct}% risk${r.how.capped ? ', capped at 25%' : ''})`);
    lines.push(
      `  • Entry: $${r.how.entry} | SL: $${r.how.stopLoss} | TP: $${r.how.takeProfit}`,
    );
    lines.push(
      `  • R:R: ${r.how.riskReward}:1 (${r.how.riskRewardRating}) | Leverage: ${r.how.leverage > 1 ? r.how.leverage + 'x' : 'none'}`,
    );
  }
  lines.push('');
  lines.push('RISKS:');
  for (const risk of r.risks) lines.push(`  • ${risk}`);
  return lines.join('\n');
}

export function formatScanResult(r: ScanResult): string {
  const lines: string[] = [];
  lines.push(
    `Scan: "${r.criteria}" — ${r.matches.length} matches (${r.scannedPairs} pairs across ${r.scannedExchanges.join(', ')})`,
  );
  lines.push('');
  for (const m of r.matches) {
    lines.push(
      `  ${m.symbol} (${m.exchange}) — ${m.signal} [${m.confidence}/100]`,
    );
  }
  if (r.matches.length === 0) lines.push('  No matches found.');
  return lines.join('\n');
}

export function formatProtectResult(r: ProtectResult): string {
  const lines: string[] = [];
  lines.push(`Risk Level: ${r.overallRisk}`);
  lines.push('');
  for (const c of r.checks) {
    const icon =
      c.status === 'ok' ? 'OK' : c.status === 'warning' ? 'WARN' : 'DANGER';
    lines.push(`  [${icon}] ${c.name}: ${c.detail}`);
  }
  return lines.join('\n');
}

export function formatReviewResult(r: ReviewResult): string {
  const lines: string[] = [];
  lines.push(`Performance Review (${r.period})`);
  lines.push('');
  lines.push(`  PnL: ${r.totalPnl}`);
  lines.push(`  Win Rate: ${r.winRate}`);
  lines.push(`  Sharpe: ${r.sharpe}`);
  lines.push(`  Best: ${r.bestSetup}`);
  lines.push(`  Worst: ${r.worstSetup}`);
  lines.push('');
  lines.push(`Suggestion: ${r.suggestion}`);
  return lines.join('\n');
}
