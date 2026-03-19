// ---------------------------------------------------------------------------
// brain/tools.ts -- 7 brain MCP tools for Lucid Trade
// ---------------------------------------------------------------------------

import type { ToolDefinition } from '../tools/index.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import type { ExchangeId, Timeframe } from '../types/index.js';
import type { ScanItem, ProtectCheck } from './types.js';
import { runAnalysis } from './analysis.js';
import {
  formatThinkResult,
  formatScanResult,
  formatProtectResult,
  formatReviewResult,
} from './formatter.js';
import { createTaTools } from '../tools/technical-analysis.js';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface BrainDeps {
  registry: AdapterRegistry;
  portfolioValue: number;
  riskPct: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse exchange and symbol from natural language query. */
function parseQuery(
  query: string,
  exchanges: string[],
): { exchange?: string; symbol?: string; timeframe: string } {
  const q = query.toLowerCase();

  // Find exchange
  let exchange: string | undefined;
  for (const ex of exchanges) {
    if (q.includes(ex.toLowerCase())) {
      exchange = ex;
      break;
    }
  }

  // Find symbol (common patterns: SOL, BTC/USDT, ETH, etc.)
  // Try uppercase first (most common in crypto), then fallback for known tickers
  const symbolMatch = query.match(/\b([A-Z]{2,10})(\/[A-Z]{2,6})?\b/);
  let symbol = symbolMatch ? symbolMatch[0]!.toUpperCase() : undefined;
  if (!symbol) {
    // Fallback: check for common tickers in any case
    const knownTickers = ['btc', 'eth', 'sol', 'avax', 'bnb', 'xrp', 'ada', 'dot', 'doge', 'link', 'matic', 'arb', 'op', 'apt', 'sui', 'near', 'atom', 'uni', 'aave', 'jup', 'wif', 'pepe', 'bonk'];
    for (const ticker of knownTickers) {
      if (q.includes(ticker)) { symbol = `${ticker.toUpperCase()}/USDT`; break; }
    }
  }
  if (symbol && !symbol.includes('/')) symbol = `${symbol}/USDT`;

  // Find timeframe
  const tfMatch = q.match(/\b(\d+[mhd]|1[wM])\b/);
  const timeframe = tfMatch?.[1] ?? '4h';

  return { exchange, symbol, timeframe };
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Create the 7 brain MCP tools.
 *
 * 1. lucid_think  — Deep analysis on a single pair
 * 2. lucid_scan   — Market scanning across instruments
 * 3. lucid_execute — Execute a trade (Phase 1: deferred)
 * 4. lucid_watch   — Set up alerts (Phase 1: deferred)
 * 5. lucid_protect — Risk check across open positions
 * 6. lucid_review  — Performance review (Phase 1: placeholder)
 * 7. lucid_pro     — Escape hatch to granular TA tools
 */
export function createBrainTools(deps: BrainDeps): ToolDefinition[] {
  const { registry, portfolioValue, riskPct } = deps;
  const proTools = createTaTools(registry);

  // ---- 1. lucid_think -------------------------------------------------------

  const think: ToolDefinition = {
    name: 'lucid_think',
    description:
      'Deep analysis on a single trading pair. Provide a natural language query ' +
      'like "analyze SOL on hyperliquid" or explicit exchange/symbol/timeframe params. ' +
      'Returns structured JSON by default, or prose text with format=text.',
    params: {
      query: {
        type: 'string',
        required: true,
        description:
          'Natural language query, e.g. "analyze SOL on hyperliquid 4h"',
      },
      format: {
        type: 'enum',
        values: ['json', 'text'],
        default: 'json',
        required: false,
        description: 'Output format: json (default) returns raw ThinkResult, text returns prose',
      },
      detail: {
        type: 'enum',
        values: ['compact', 'full'],
        default: 'full',
        required: false,
        description: 'Detail level: full (default) or compact',
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const query = (params.query as string) || '';
      const format = (params.format as string) || 'json';
      const detail = (params.detail as string) || 'full';
      const exchangeIds = registry.list().map((a) => a.exchangeId);
      const parsed = parseQuery(query, exchangeIds);

      // Resolve exchange
      const exchangeId = parsed.exchange ?? exchangeIds[0];
      if (!exchangeId) {
        return 'No exchanges configured. Register at least one adapter.';
      }

      const adapter = registry.get(exchangeId as ExchangeId);
      if (!adapter) {
        return `Exchange "${exchangeId}" not configured.`;
      }

      // Resolve symbol
      const symbol = parsed.symbol ?? 'BTC/USDT';

      // Fetch candles
      const candles = await adapter.getCandles({
        exchange: exchangeId as ExchangeId,
        symbol,
        timeframe: parsed.timeframe as Timeframe,
        limit: 60,
      });

      // Run analysis
      const result = runAnalysis({
        symbol,
        candles,
        portfolioValue,
        riskPct,
        venue: exchangeId,
        exchange: exchangeId,
        timeframe: parsed.timeframe,
      });

      if (format === 'text') {
        return formatThinkResult(result);
      }

      // Compact mode: strip evidence details and reduce rulesTriggered
      if (detail === 'compact') {
        const { evidence: _ev, ...rest } = result;
        return JSON.stringify({
          ...rest,
          rulesTriggered: result.rulesTriggered.map((r) => ({
            id: r.id,
            contribution: r.contribution,
          })),
        });
      }

      return JSON.stringify(result);
    },
  };

  // ---- 2. lucid_scan --------------------------------------------------------

  const scan: ToolDefinition = {
    name: 'lucid_scan',
    description:
      'Scan multiple instruments across connected exchanges for trading opportunities. ' +
      'Filters by confidence >= 60 and returns up to 10 results.',
    params: {
      criteria: {
        type: 'string',
        required: true,
        description:
          'Scan criteria, e.g. "oversold altcoins", "high volume breakouts"',
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const criteria = (params.criteria as string) || 'all';
      const adapters = registry.list();
      const scannedExchanges: string[] = [];
      let scannedPairs = 0;
      const matches: ScanItem[] = [];

      for (const adapter of adapters) {
        scannedExchanges.push(adapter.exchangeId);
        let instruments: Awaited<ReturnType<typeof adapter.getInstruments>>;
        try {
          instruments = await adapter.getInstruments();
        } catch {
          continue;
        }

        // Limit to 10 instruments per exchange to keep response times reasonable
        const toScan = instruments.slice(0, 10);
        scannedPairs += toScan.length;

        for (const inst of toScan) {
          try {
            const candles = await adapter.getCandles({
              exchange: adapter.exchangeId,
              symbol: inst.symbol,
              timeframe: '4h' as Timeframe,
              limit: 60,
            });

            const analysis = runAnalysis({
              symbol: inst.symbol,
              candles,
              portfolioValue,
              riskPct,
            });

            if (analysis.score >= 60) {
              const signalDesc = analysis.rulesTriggered[0]?.description ?? 'technical signal';
              matches.push({
                symbol: inst.symbol,
                exchange: adapter.exchangeId,
                signal: `${analysis.verdict} (${signalDesc})`,
                confidence: analysis.score,
              });
            }
          } catch {
            // Skip instruments that fail to fetch
            continue;
          }
        }
      }

      // Sort by confidence descending
      matches.sort((a, b) => b.confidence - a.confidence);

      return formatScanResult({
        criteria,
        matches: matches.slice(0, 10),
        scannedExchanges,
        scannedPairs,
      });
    },
  };

  // ---- 3. lucid_execute -----------------------------------------------------

  const execute: ToolDefinition = {
    name: 'lucid_execute',
    description:
      'Execute a trade based on analysis. Phase 1: deferred — returns guidance ' +
      'message. Full execution requires adapter placeOrder support.',
    params: {
      action: {
        type: 'string',
        required: true,
        description:
          'Trade action, e.g. "buy SOL on hyperliquid", "sell BTC"',
      },
    },
    execute: async (_params: Record<string, unknown>) => {
      return (
        'Trade execution is deferred in Phase 1. ' +
        'Exchange adapters with placeOrder support are not yet available. ' +
        'Use lucid_think to generate a trade plan, then execute manually on your preferred venue.'
      );
    },
  };

  // ---- 4. lucid_watch -------------------------------------------------------

  const watch: ToolDefinition = {
    name: 'lucid_watch',
    description:
      'Set up price alerts and monitoring. Phase 1: deferred — persistence ' +
      'layer not yet available.',
    params: {
      condition: {
        type: 'string',
        required: true,
        description:
          'Alert condition, e.g. "SOL drops below $120", "BTC RSI < 30"',
      },
    },
    execute: async (_params: Record<string, unknown>) => {
      return (
        'Alert/watch functionality is deferred in Phase 1. ' +
        'A persistence layer is required for alert storage and monitoring. ' +
        'Use lucid_think for one-time analysis instead.'
      );
    },
  };

  // ---- 5. lucid_protect -----------------------------------------------------

  const protect: ToolDefinition = {
    name: 'lucid_protect',
    description:
      'Risk check across all connected exchanges. Inspects open positions, ' +
      'concentration, leverage, and drawdown.',
    params: {},
    execute: async (_params: Record<string, unknown>) => {
      const checks: ProtectCheck[] = [];
      const adapters = registry.list();
      let totalExposure = 0;
      let maxLeverage = 0;

      for (const adapter of adapters) {
        if (!adapter.getPositions) continue;

        try {
          const positions = await adapter.getPositions();
          for (const pos of positions) {
            const notional = Math.abs(pos.size * pos.markPrice);
            totalExposure += notional;
            if (pos.leverage > maxLeverage) maxLeverage = pos.leverage;

            // Per-position check
            const pnlPct =
              pos.entryPrice > 0
                ? ((pos.markPrice - pos.entryPrice) / pos.entryPrice) * 100
                : 0;
            const status =
              Math.abs(pnlPct) > 10
                ? 'danger'
                : Math.abs(pnlPct) > 5
                  ? 'warning'
                  : 'ok';
            checks.push({
              name: `${adapter.exchangeId}:${pos.symbol}`,
              status,
              detail: `${pos.side} ${pos.size} @ $${pos.entryPrice} | Mark: $${pos.markPrice} | PnL: ${pnlPct.toFixed(1)}% | Lev: ${pos.leverage}x`,
            });
          }
        } catch {
          checks.push({
            name: `${adapter.exchangeId}:positions`,
            status: 'warning',
            detail: 'Failed to fetch positions',
          });
        }
      }

      // Overall concentration check
      if (portfolioValue > 0 && totalExposure > 0) {
        const exposurePct = (totalExposure / portfolioValue) * 100;
        const status =
          exposurePct > 100 ? 'danger' : exposurePct > 50 ? 'warning' : 'ok';
        checks.push({
          name: 'Total Exposure',
          status,
          detail: `$${totalExposure.toFixed(0)} (${exposurePct.toFixed(1)}% of portfolio)`,
        });
      }

      // Leverage check
      if (maxLeverage > 1) {
        const status =
          maxLeverage > 10 ? 'danger' : maxLeverage > 5 ? 'warning' : 'ok';
        checks.push({
          name: 'Max Leverage',
          status,
          detail: `${maxLeverage}x`,
        });
      }

      // If no adapters with getPositions or no positions found
      if (checks.length === 0) {
        checks.push({
          name: 'Positions',
          status: 'ok',
          detail: 'No open positions detected',
        });
      }

      // Determine overall risk
      const hasDanger = checks.some((c) => c.status === 'danger');
      const hasWarning = checks.some((c) => c.status === 'warning');
      const overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = hasDanger
        ? maxLeverage > 10
          ? 'CRITICAL'
          : 'HIGH'
        : hasWarning
          ? 'MEDIUM'
          : 'LOW';

      return formatProtectResult({ overallRisk, checks });
    },
  };

  // ---- 6. lucid_review ------------------------------------------------------

  const review: ToolDefinition = {
    name: 'lucid_review',
    description:
      'Performance review of trading history. Phase 1: placeholder — ' +
      'requires memory layer for trade history.',
    params: {
      period: {
        type: 'string',
        required: false,
        description: 'Review period, e.g. "7d", "30d", "all"',
        default: '7d',
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const period = (params.period as string) || '7d';
      return formatReviewResult({
        period,
        totalPnl: '$0.00 (no history)',
        winRate: 'N/A',
        sharpe: 0,
        bestSetup: 'N/A — no trades recorded yet',
        worstSetup: 'N/A — no trades recorded yet',
        suggestion:
          'Connect a persistence layer to track trade history and generate performance reviews.',
      });
    },
  };

  // ---- 7. lucid_pro ---------------------------------------------------------

  const pro: ToolDefinition = {
    name: 'lucid_pro',
    description:
      'Escape hatch to granular TA tools. Use tool="list_tools" to see available ' +
      'tools, or specify a tool name and params to execute directly.',
    params: {
      tool: {
        type: 'string',
        required: true,
        description:
          'Tool name to execute, or "list_tools" to list available tools',
      },
      params: {
        type: 'object',
        required: false,
        description: 'Parameters to pass to the selected tool',
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const toolName = params.tool as string;

      if (toolName === 'list_tools') {
        const lines = proTools.map(
          (t) => `  ${t.name} — ${t.description.slice(0, 80)}`,
        );
        return `Available pro tools (${proTools.length}):\n${lines.join('\n')}`;
      }

      const target = proTools.find((t) => t.name === toolName);
      if (!target) {
        const names = proTools.map((t) => t.name).join(', ');
        return `Tool "${toolName}" not found. Available: ${names}`;
      }

      const toolParams = (params.params as Record<string, unknown>) ?? {};
      return target.execute(toolParams);
    },
  };

  return [think, scan, execute, watch, protect, review, pro];
}
