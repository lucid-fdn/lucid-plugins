# lucid-trade v5 — Universal Trading MCP Design

**Date:** 2026-02-25
**Status:** Draft
**Author:** DaishizenSensei / Claude
**Package:** `@raijinlabs/trade`
**Replaces:** lucid-trade v4.0.0 (pure AgentSkills → TypeScript MCP server)

---

## 1. Problem Statement

Our competitor Senpi ($4.5M seed from Coinbase Ventures / Lemniscap) ships 44 MCP tools wrapping Hyperliquid's API — trader discovery, momentum intelligence, strategy management, execution, and autonomous trading. They have $100M+ volume and 65% win rate claims.

Our current lucid-trade v4 is pure markdown — zero executable tools. An agent reads our instructions but must figure out API calls on its own. We have superior TA, risk management, and backtesting knowledge, but no execution layer.

**Goal:** Build a TypeScript MCP server with 125+ tools across 7+ exchanges that does everything Senpi does on one exchange, across ALL major venues, while retaining our intelligence advantages.

---

## 2. Competitive Analysis

### Senpi Architecture (3 layers)

```
Layer 1: MCP Toolkit (44 proprietary tools wrapping Hyperliquid API)
Layer 2: Agent Skills (8 open-source Python strategies — WOLF, DSL, Scanner, etc.)
Layer 3: Platform (Railway deploy, Telegram, Privy auth, Points/leaderboard)
```

### Senpi Strengths
- Deep Hyperliquid integration (leaderboard, SM tracking, mirror trading)
- Battle-tested autonomous trading (WOLF v6 — 7 cron jobs, 65% win rate)
- DSL v4 trailing stops with ROE-based tier ratcheting
- Smart money concentration detection via HL leaderboard
- Production maturity ($100M+ volume)

### Senpi Weaknesses (Our Attack Surface)
1. **Single exchange lock-in** — Hyperliquid ONLY
2. **Perps only** — No spot, no DeFi, no yield, no LP
3. **Zero backtesting** — Can't test strategies before deploying
4. **Zero TA library** — No RSI, MACD, Bollinger — relies on SM signals only
5. **Zero risk framework** — No Kelly Criterion, no portfolio VaR, no volatility-adjusted sizing
6. **Python scripts + JSON state** — Not a real MCP server architecture
7. **Eliza framework dependency** — Heavy (Node 23+, pnpm, Turbo, Docker)
8. **No cross-exchange intelligence** — Can't detect funding arb, price divergence, or capital flow
9. **Proprietary MCP** — Skills are open, but the 44 tools are closed-source

### Our Existing Advantages (Retained from v4)
- Multi-chain support (6 chains)
- Full TA indicator library with exact formulas (RSI, MACD, Bollinger, ATR, trend, S/R)
- Backtesting framework (SMA crossover, RSI mean-reversion, DCA, Grid)
- Kelly Criterion + fixed-% + volatility-adjusted position sizing
- Performance metrics (Sharpe, Calmar, max drawdown, profit factor, win rate)
- MIT license, standalone MCP (any client)

---

## 3. Architecture

### Package Structure

```
skills/lucid-trade/                    # Upgraded from pure AgentSkills to TypeScript MCP
├── src/
│   ├── bin.ts                         # CLI entry: trade-mcp
│   ├── mcp.ts                         # MCP server factory + tool registration
│   ├── index.ts                       # Exports
│   ├── config.ts                      # Env validation (Zod)
│   │
│   ├── adapters/                      # Exchange adapters (unified interface)
│   │   ├── types.ts                   # IExchangeAdapter interface
│   │   ├── registry.ts               # Adapter registry + factory
│   │   ├── hyperliquid/
│   │   │   ├── client.ts             # HL REST + WebSocket client
│   │   │   ├── adapter.ts            # IExchangeAdapter implementation
│   │   │   ├── leaderboard.ts        # Trader discovery (unique to HL)
│   │   │   └── types.ts
│   │   ├── dydx/
│   │   │   ├── client.ts
│   │   │   ├── adapter.ts
│   │   │   └── types.ts
│   │   ├── gmx/
│   │   │   ├── client.ts
│   │   │   ├── adapter.ts
│   │   │   └── types.ts
│   │   ├── drift/
│   │   │   ├── client.ts
│   │   │   ├── adapter.ts
│   │   │   └── types.ts
│   │   ├── aevo/
│   │   │   ├── client.ts
│   │   │   ├── adapter.ts
│   │   │   └── types.ts
│   │   ├── jupiter/
│   │   │   ├── client.ts             # Jupiter v6 API
│   │   │   ├── adapter.ts
│   │   │   └── types.ts
│   │   └── oneinch/
│   │       ├── client.ts             # 1inch v6 API
│   │       ├── adapter.ts
│   │       └── types.ts
│   │
│   ├── tools/                         # MCP tool definitions (125+ tools)
│   │   ├── trader-discovery.ts        # 12 tools
│   │   ├── momentum.ts               # 10 tools
│   │   ├── strategy.ts               # 18 tools
│   │   ├── execution.ts              # 14 tools
│   │   ├── simulation.ts             # 8 tools
│   │   ├── market-data.ts            # 15 tools
│   │   ├── technical-analysis.ts     # 10 tools
│   │   ├── portfolio.ts              # 12 tools
│   │   ├── risk.ts                   # 8 tools
│   │   ├── autonomous.ts             # 10 tools
│   │   ├── audit.ts                  # 5 tools
│   │   └── guides.ts                 # 3 tools
│   │
│   ├── intelligence/                  # Brain layer (our moat)
│   │   ├── technical-analysis.ts     # RSI, MACD, Bollinger, ATR, trend, S/R
│   │   ├── risk-engine.ts            # Kelly, fixed-%, VaR, volatility-adjusted sizing
│   │   ├── backtester.ts             # SMA, RSI, custom strategy backtesting
│   │   ├── momentum-detector.ts      # Cross-exchange momentum detection
│   │   ├── arbitrage-scanner.ts      # Funding rate + price divergence arb
│   │   ├── trader-scorer.ts          # Universal trader ranking algorithm
│   │   ├── liquidation-mapper.ts     # Liquidation cluster detection
│   │   └── correlation-engine.ts     # Asset correlation + decorrelation detection
│   │
│   ├── portfolio/                     # Unified portfolio engine
│   │   ├── tracker.ts                # Cross-exchange position tracking
│   │   ├── pnl.ts                    # PnL calculation (long/short, with fees)
│   │   ├── metrics.ts                # Sharpe, Calmar, drawdown, profit factor
│   │   ├── alerts.ts                 # Price/PnL/drawdown alerts
│   │   └── tax.ts                    # Capital gains/loss reporting
│   │
│   ├── autonomous/                    # Autonomous trading engine
│   │   ├── bot.ts                    # Bot lifecycle management
│   │   ├── scanner.ts               # Opportunity scanning (our v of Senpi's scanner)
│   │   ├── dsl.ts                    # Dynamic Stop Loss (our v of Senpi's DSL)
│   │   ├── decision-engine.ts        # Entry/exit logic with TA confirmation
│   │   └── howl.ts                   # Self-improvement analysis loop
│   │
│   ├── audit/                         # Decision logging
│   │   ├── logger.ts                 # Decision log with reasoning + timestamps
│   │   └── reporter.ts              # Performance reports + exports
│   │
│   └── test/                          # Tests
│       ├── adapters/
│       ├── intelligence/
│       ├── tools/
│       └── fixtures/
│
├── skills/                            # RETAINED: Pure AgentSkills knowledge base
│   ├── market-analysis/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── trading/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── portfolio/
│   │   ├── SKILL.md
│   │   └── references/
│   └── backtesting/
│       ├── SKILL.md
│       └── references/
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── skill.yaml                         # Updated: requires.mcps includes our own tools
├── openclaw.plugin.json
├── HEARTBEAT.md
└── README.md
```

### Exchange Adapter Interface

Every exchange implements the same interface:

```typescript
interface IExchangeAdapter {
  // Identity
  readonly id: ExchangeId;
  readonly name: string;
  readonly chains: Chain[];
  readonly capabilities: ExchangeCapability[];

  // Market data (read-only, no auth needed)
  getCandles(params: CandleParams): Promise<OHLCV[]>;
  getOrderbook(symbol: string, depth?: number): Promise<Orderbook>;
  getFundingRate(symbol: string): Promise<FundingRate>;
  getOpenInterest(symbol: string): Promise<OpenInterest>;
  getPrice(symbol: string): Promise<Price>;
  getInstruments(): Promise<Instrument[]>;
  getTicker(symbol: string): Promise<Ticker>;
  getRecentTrades(symbol: string, limit?: number): Promise<Trade[]>;

  // Trader discovery (where available)
  getLeaderboard?(params: LeaderboardParams): Promise<TraderProfile[]>;
  getTraderPositions?(address: string): Promise<Position[]>;
  getTraderHistory?(address: string): Promise<ClosedTrade[]>;

  // Execution (requires auth)
  openPosition(params: OpenPositionParams): Promise<OrderResult>;
  closePosition(params: ClosePositionParams): Promise<OrderResult>;
  resizePosition(params: ResizeParams): Promise<OrderResult>;
  placeOrder(params: OrderParams): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<void>;
  cancelAllOrders(symbol?: string): Promise<void>;

  // Account (requires auth)
  getBalances(): Promise<Balance[]>;
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<Order[]>;
  getTradeHistory(params?: HistoryParams): Promise<ClosedTrade[]>;

  // Strategy (where available — HL, dYdX)
  createStrategy?(params: StrategyParams): Promise<Strategy>;
  mirrorTrader?(params: MirrorParams): Promise<Strategy>;
  closeStrategy?(strategyId: string): Promise<void>;
  getStrategyState?(strategyId: string): Promise<StrategyState>;

  // Bridging (where available)
  bridgeUSDC?(params: BridgeParams): Promise<BridgeResult>;
}
```

### Supported Exchanges

| Exchange | Type | Chains | Trader Discovery | Mirror Trading | Notes |
|----------|------|--------|-----------------|----------------|-------|
| **Hyperliquid** | Perps | Arbitrum L1 | Yes (leaderboard) | Yes (vaults) | Direct Senpi competitor |
| **dYdX** | Perps | dYdX chain | Yes (leaderboard) | No | Second largest perp DEX |
| **GMX** | Perps + Spot | Arbitrum, Avalanche | No | No | Major Arbitrum perp venue |
| **Drift** | Perps + Spot | Solana | Yes (leaderboard) | No | Largest Solana perp DEX |
| **Aevo** | Perps + Options | Ethereum L2 | No | No | Options = unique edge |
| **Jupiter** | Spot swap | Solana | No | No | #1 Solana DEX aggregator |
| **1inch** | Spot swap | EVM (6 chains) | No | No | #1 EVM DEX aggregator |

---

## 4. Tool Catalog (125 tools, 12 categories)

### Category 1: Trader Discovery (12 tools)

| Tool | Description | Exchanges |
|------|-------------|-----------|
| `trader_discover_top` | Rank traders by composite score across timeframes | HL, dYdX, Drift |
| `trader_get_profile` | Full profile: labels, style, risk score, track record | HL, dYdX, Drift |
| `trader_get_positions` | Live open positions with entry, leverage, unrealized PnL | HL, dYdX, Drift |
| `trader_get_history` | Closed trade history with per-trade PnL and fees | HL, dYdX, Drift |
| `trader_compare` | Side-by-side comparison of 2+ traders | ALL with leaderboard |
| `trader_classify` | Behavioral labeling (scalper, swing, degen, whale, sniper) | ALL with leaderboard |
| `trader_get_pnl_attribution` | Which assets/strategies drive returns | HL, dYdX |
| `trader_correlation_matrix` | Position overlap detection between traders | ALL with leaderboard |
| `trader_rank_cross_exchange` | Same trader unified score across venues | ALL with leaderboard |
| `trader_get_smart_money_flow` | Smart money direction across ALL exchanges | ALL with leaderboard |
| `trader_get_whale_alerts` | Large position alerts (>$100k) cross-exchange | ALL |
| `trader_leaderboard_snapshot` | Raw leaderboard snapshot with scoring | HL, dYdX, Drift |

### Category 2: Live Momentum Intelligence (10 tools)

| Tool | Description |
|------|-------------|
| `momentum_get_movers` | Top movers across all exchanges ranked by velocity |
| `momentum_get_events` | Threshold-crossing events tiered by significance |
| `momentum_get_smart_money_concentration` | SM concentration per asset across all exchanges |
| `momentum_get_funding_divergence` | Funding rate divergence between exchanges (arb signal) |
| `momentum_get_oi_flow` | Open interest flow — money entering or leaving |
| `momentum_get_liquidation_heatmap` | Liquidation cluster locations (price magnets) |
| `momentum_get_cross_exchange_flow` | Capital flowing between exchanges in real-time |
| `momentum_get_correlation_break` | Asset decorrelation from BTC/ETH (alpha signal) |
| `momentum_get_volume_profile` | Volume at price levels — demand/supply zones |
| `momentum_get_whale_positioning` | Aggregate whale long/short ratio cross-exchange |

### Category 3: Strategy Management (18 tools)

| Tool | Description |
|------|-------------|
| `strategy_create` | Create strategy on any supported exchange |
| `strategy_fund` | Fund strategy wallet/subaccount |
| `strategy_mirror` | Mirror a trader with configurable multiplier, SL/TP, filters |
| `strategy_close` | Close strategy and withdraw funds |
| `strategy_pause` | Pause (stop new entries, keep existing) |
| `strategy_resume` | Resume paused strategy |
| `strategy_get_state` | Full state: positions, orders, PnL, fees, status |
| `strategy_set_risk` | Strategy-level risk params (max drawdown, daily loss cap) |
| `strategy_get_orders` | All open/pending orders |
| `strategy_cancel_orders` | Cancel all or specific orders |
| `strategy_rebalance` | Rebalance allocations across positions |
| `strategy_clone` | Clone strategy config to a different exchange |
| `strategy_create_dca` | Create DCA strategy (periodic buys) |
| `strategy_create_grid` | Create grid trading strategy |
| `strategy_create_arb` | Cross-exchange arbitrage strategy |
| `strategy_backtest` | Backtest strategy against historical data before deploying |
| `strategy_get_lifecycle` | Full lifecycle timeline with status transitions |
| `strategy_compare_performance` | Compare two strategies side-by-side |

### Category 4: Execution (14 tools)

| Tool | Description | Scope |
|------|-------------|-------|
| `trade_open_perp` | Open perpetual position | All perp exchanges |
| `trade_close_perp` | Close perpetual position | All perp exchanges |
| `trade_resize_perp` | Resize position (add/reduce) | All perp exchanges |
| `trade_set_sl_tp` | Set stop-loss / take-profit | All perp exchanges |
| `trade_set_trailing_stop` | Dynamic trailing stop (DSL equivalent) | All perp exchanges |
| `trade_swap_spot` | Spot swap via DEX aggregator | Jupiter, 1inch |
| `trade_limit_order` | Place limit order | ALL |
| `trade_cancel_order` | Cancel order | ALL |
| `trade_cancel_all` | Cancel all orders on exchange | ALL |
| `trade_get_optimal_route` | Best execution route across DEXs | ALL spot |
| `trade_calculate_position_size` | Kelly/fixed-% sizing with volatility adjustment | Pure calc |
| `trade_calculate_risk_reward` | R:R analysis with probability estimates | Pure calc |
| `trade_bridge_usdc` | Bridge USDC between chains | 8+ EVM chains |
| `trade_get_gas_estimate` | Gas cost estimation | All EVM |

### Category 5: Simulation & Backtesting (8 tools)

| Tool | Description |
|------|-------------|
| `sim_preview_trade` | Preview any trade (slippage, fees, price impact) |
| `sim_preview_mirror` | Preview mirror strategy positions |
| `sim_backtest_sma` | SMA crossover backtest on historical data |
| `sim_backtest_rsi` | RSI mean-reversion backtest |
| `sim_backtest_custom` | Custom strategy backtest with user-defined rules |
| `sim_monte_carlo` | Monte Carlo simulation for strategy risk profiling |
| `sim_what_if` | Scenario analysis (price → X, impact on portfolio) |
| `sim_compare_exchanges` | Compare execution on same trade across exchanges |

### Category 6: Market Data (15 tools)

| Tool | Description | Scope |
|------|-------------|-------|
| `market_get_candles` | OHLCV candles (1m to 1M) | ALL |
| `market_get_orderbook` | Order book depth | ALL |
| `market_get_funding_rate` | Current and historical funding | All perps |
| `market_get_open_interest` | OI current and historical | All perps |
| `market_get_price` | Current price for any token | ALL |
| `market_get_instruments` | List all tradeable instruments | Per exchange |
| `market_get_ticker` | 24h stats (volume, high, low, change) | ALL |
| `market_get_trades` | Recent trade history | ALL |
| `market_get_liquidations` | Recent liquidation events | HL, dYdX |
| `market_get_funding_comparison` | Compare funding across exchanges for same asset | ALL perps |
| `market_get_price_comparison` | Price across all venues (spread detection) | ALL |
| `market_get_volume_profile` | Volume-at-price distribution | ALL |
| `market_get_correlation` | Asset correlation matrix | ALL |
| `market_get_volatility` | Historical vol, ATR, Bollinger width | ALL |
| `market_get_support_resistance` | Auto-detected S/R levels | ALL |

### Category 7: Technical Analysis (10 tools)

| Tool | Description |
|------|-------------|
| `ta_analyze` | Full TA report: RSI, MACD, Bollinger, trend, S/R, confidence score |
| `ta_get_rsi` | RSI(14) with oversold/overbought signals |
| `ta_get_macd` | MACD(12,26,9) with histogram and crossover detection |
| `ta_get_bollinger` | Bollinger Bands(20,2) with squeeze detection |
| `ta_get_trend` | Trend classification (strong up → strong down) via SMA 20/50 |
| `ta_get_support_resistance` | Swing high/low based S/R levels |
| `ta_get_volatility_regime` | Low/Moderate/High/Extreme with sizing multiplier |
| `ta_get_atr` | ATR and ATR% for stop-loss distance and sizing |
| `ta_get_ema_crossover` | EMA crossover signals (configurable periods) |
| `ta_score_setup` | Composite setup score (0-100) combining all indicators |

### Category 8: Portfolio Intelligence (12 tools)

| Tool | Description |
|------|-------------|
| `portfolio_get_overview` | Unified portfolio across ALL exchanges + wallets |
| `portfolio_get_positions` | All open positions across all venues |
| `portfolio_get_pnl` | PnL tracking (daily/weekly/monthly/all-time) |
| `portfolio_get_allocation` | Allocation breakdown by exchange/asset/strategy |
| `portfolio_get_risk_metrics` | Sharpe, Calmar, max drawdown, profit factor |
| `portfolio_get_risk_level` | Risk classification (Low/Medium/High/Critical) |
| `portfolio_get_correlation_risk` | Concentration and correlation risk analysis |
| `portfolio_get_trade_history` | Complete trade log across all venues |
| `portfolio_get_fee_analysis` | Fee analysis — which exchange is cheapest? |
| `portfolio_set_alert` | Price/PnL/drawdown alerts |
| `portfolio_get_tax_report` | Capital gains/loss report for tax |
| `portfolio_bridge_usdc` | Bridge USDC across 8+ EVM chains |

### Category 9: Risk Management (8 tools)

| Tool | Description |
|------|-------------|
| `risk_calculate_position_size` | Fixed-%, Kelly Criterion, or volatility-adjusted sizing |
| `risk_get_portfolio_var` | Portfolio Value at Risk |
| `risk_get_max_drawdown` | Current and historical max drawdown |
| `risk_check_exposure` | Directional exposure guard (long/short cap) |
| `risk_check_concentration` | Single-asset concentration warning |
| `risk_get_liquidation_price` | Liquidation price for any leveraged position |
| `risk_set_daily_loss_cap` | Daily loss circuit breaker |
| `risk_get_health_report` | Full portfolio health check |

### Category 10: Autonomous Trading (10 tools)

| Tool | Description |
|------|-------------|
| `auto_create_bot` | Create autonomous trading bot with strategy + risk params |
| `auto_start` | Start autonomous execution loop |
| `auto_pause` | Pause bot (keep positions, stop new entries) |
| `auto_stop` | Stop bot and optionally close all positions |
| `auto_get_status` | Bot status, open positions, performance |
| `auto_set_dsl` | Configure dynamic trailing stop |
| `auto_get_decision_log` | Every decision with reasoning |
| `auto_howl` | Self-improvement analysis of bot performance |
| `auto_set_scanner` | Configure opportunity scanner parameters |
| `auto_get_scanner_results` | Latest scanner output with scored opportunities |

### Category 11: Audit Trail (5 tools)

| Tool | Description |
|------|-------------|
| `audit_get_decision_log` | Full decision log with reasoning + timestamps |
| `audit_get_strategy_timeline` | Per-strategy event timeline |
| `audit_get_fee_breakdown` | Fee breakdown per trade/strategy |
| `audit_get_performance_report` | Full performance report with Sharpe/drawdown |
| `audit_export` | Export to CSV/JSON for external analysis |

### Category 12: Guides & Reference (3 tools)

| Tool | Description |
|------|-------------|
| `guide_list` | List all available guides |
| `guide_read` | Read a specific guide |
| `guide_get_exchange_info` | Exchange-specific setup/limits/fees reference |

---

## 5. Unique Differentiators (Things Only We Have)

### 5.1 Cross-Exchange Intelligence
- **Funding rate arbitrage detection**: When HL funding is -50% and dYdX is +20%, alert
- **Price divergence scanning**: Same asset, different prices across venues
- **Capital flow tracking**: Detect when smart money migrates between exchanges
- **Correlation break detection**: When an asset decorrelates from BTC (alpha signal)
- **Liquidation heatmapping**: Where are the liquidation clusters across all venues?

### 5.2 Full Technical Analysis Engine
Senpi has ZERO TA. We compute: RSI, MACD, Bollinger Bands, ATR, EMA crossovers, trend detection, support/resistance, volatility regimes, and a composite setup score. All with exact formulas from our v4 knowledge base.

### 5.3 Backtesting Engine
Senpi can't test strategies before deploying. We can backtest SMA crossover, RSI mean-reversion, custom strategies, AND run Monte Carlo simulations. An agent can evaluate 100 variations before risking capital.

### 5.4 Risk Management Framework
Senpi has no risk tooling. We have: Kelly Criterion sizing, fixed-% risk model, volatility-adjusted position sizing, portfolio VaR, directional exposure guards, concentration warnings, and daily loss circuit breakers.

### 5.5 Multi-Venue Execution
Trade perps on 5 exchanges + spot on 2 DEX aggregators + bridge across 8+ chains. One unified interface. Senpi does perps on one exchange.

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Package scaffold (tsup, vitest, TypeScript strict)
- MCP server factory with tool registration
- IExchangeAdapter interface + types
- Hyperliquid adapter (market data + execution — direct Senpi competitor)
- Intelligence layer: TA engine (port v4 formulas to TypeScript)
- Tools: market_data (15), ta (10) = 25 tools

### Phase 2: Execution + Strategy (Week 3-4)
- Hyperliquid adapter: trader discovery + strategy management + mirror trading
- Jupiter adapter (spot swaps)
- 1inch adapter (EVM spot swaps)
- Backtesting engine (SMA, RSI, custom)
- Tools: trader_discovery (12), execution (14), simulation (8), strategy (partial 10) = 44 tools
- **Milestone: Feature parity with Senpi on Hyperliquid + multi-chain spot**

### Phase 3: Multi-Exchange + Portfolio (Week 5-6)
- dYdX adapter
- GMX adapter
- Drift adapter
- Unified portfolio engine
- Risk management engine
- Tools: portfolio (12), risk (8), strategy (remaining 8) = 28 tools

### Phase 4: Autonomous + Intelligence (Week 7-8)
- Autonomous bot engine (scanner, DSL, decision engine, HOWL)
- Cross-exchange intelligence (arb scanner, momentum, flow tracking)
- Aevo adapter (options edge)
- Audit trail
- Tools: autonomous (10), momentum (10), audit (5), guides (3) = 28 tools
- **Milestone: 125 tools, 7 exchanges, full autonomous capability**

---

## 7. Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.26.0",
  "@supabase/supabase-js": "^2.49.0",
  "zod": "^3.24.0",
  "bottleneck": "^2.19.5",
  "ethers": "^6.13.0",
  "@solana/web3.js": "^1.95.0",
  "decimal.js": "^10.4.0"
}
```

### Environment Variables

```
# Required
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Per-exchange (optional — market data works without auth)
HYPERLIQUID_PRIVATE_KEY=
HYPERLIQUID_WALLET_ADDRESS=
DYDX_MNEMONIC=
DRIFT_PRIVATE_KEY=
GMX_PRIVATE_KEY=
AEVO_API_KEY=
AEVO_API_SECRET=
JUPITER_API_KEY=           # Optional, improves rate limits
ONEINCH_API_KEY=
BIRDEYE_API_KEY=

# Bridging
BRIDGE_PRIVATE_KEY=        # For cross-chain USDC bridging
```

---

## 8. Data Storage (Supabase)

Tables needed in `lucid-gateway` database:

- `trade_strategies` — Strategy configs and lifecycle state
- `trade_positions` — Open position tracking across exchanges
- `trade_history` — Closed trade log
- `trade_alerts` — Price/PnL/drawdown alerts
- `trade_decisions` — Audit trail (decision log with reasoning)
- `trade_scanner_results` — Opportunity scanner outputs
- `trade_bot_state` — Autonomous bot state
- `trade_backtest_results` — Backtest results cache

---

## 9. Success Metrics

| Metric | Senpi | Our Target |
|--------|-------|------------|
| Tool count | 44 | 125+ |
| Exchanges | 1 | 7+ |
| Asset types | Perps only | Perps + Spot + Options |
| TA tools | 0 | 10 |
| Risk tools | 0 | 8 |
| Backtesting | 0 | 5+ strategies |
| Cross-exchange tools | 0 | 8 unique |
| Chains | 1 | 8+ |
| License | Proprietary MCP | MIT (everything) |

---

## 10. Migration from v4

The pure AgentSkills (SKILL.md files) are **retained** in the `skills/` directory. They serve as:
1. Documentation for the TA formulas the MCP tools implement
2. Standalone AgentSkills for platforms that don't support MCP
3. Reference material accessible via `guide_read` tool

The package transitions from `"name": "lucid-trade"` to `"name": "@raijinlabs/trade"` with a `bin` entry for `trade-mcp`.
