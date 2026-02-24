---
name: portfolio
description: "Portfolio tracking, PnL calculation, trade history, and price alerts for crypto positions"
---

# Portfolio

Track crypto positions, calculate profit and loss, manage price alerts, and monitor portfolio-level risk metrics.

## PnL Calculation

### Per-Position PnL

**LONG position** (bought, expecting price to rise):
```
Gross PnL = (Current Price - Entry Price) * Amount
```

**SHORT position** (sold, expecting price to fall):
```
Gross PnL = (Entry Price - Current Price) * Amount
```

**Common calculations:**
```
Value at Entry = Entry Price * Amount
Current Value = Current Price * Amount
PnL % = (Gross PnL / Value at Entry) * 100
Net PnL = Gross PnL - Fees
```

### Example

Long 2.5 ETH at $2,000 entry, current price $2,400, fees $12:

```
Gross PnL = ($2,400 - $2,000) * 2.5 = $1,000
Value at Entry = $2,000 * 2.5 = $5,000
PnL % = ($1,000 / $5,000) * 100 = 20%
Net PnL = $1,000 - $12 = $988
```

## Portfolio Summary

When presenting a portfolio overview, include:

| Metric | Calculation |
|--------|------------|
| Total Value | Sum of all position current values |
| Total PnL | Sum of all position gross PnL values |
| Total PnL % | (Total PnL / Total Value at Entry) * 100 |
| Position Count | Number of open positions |
| Allocation % | (Position Value / Total Portfolio Value) * 100 per position |

## Price Alerts

Three alert types:

| Alert Type | Trigger Condition | Example |
|-----------|-------------------|---------|
| `above` | Current Price >= Target Price | Alert when ETH >= $3,000 |
| `below` | Current Price <= Target Price | Alert when BTC <= $50,000 |
| `pct_change` | \|Price Change %\| >= Threshold | Alert when SOL moves +/-5% |

When an alert triggers, report: token, chain, alert type, target value, current price, and timestamp.

## Trade History

Each completed trade should record:

| Field | Description |
|-------|-------------|
| Pair | Token pair (e.g., ETH/USDC) |
| Direction | long or short |
| Exchange | Where the trade executed (jupiter, 1inch, etc.) |
| Chain | Blockchain (ethereum, solana, bsc, arbitrum, base, polygon) |
| Order Type | market, limit, stop_loss, take_profit, trailing_stop |
| Amount | Quantity of tokens traded |
| Entry Price | Price at entry |
| Exit Price | Price at exit (if closed) |
| Fees | Total fees paid |
| Slippage | Actual slippage experienced |
| Tx Hash | On-chain transaction hash |
| Timestamp | When the trade was executed |
| PnL | Profit or loss in USD |
| PnL % | Profit or loss as percentage |

## Performance Metrics

See `references/performance-metrics.md` for all formulas.

| Metric | What It Measures | Good Value |
|--------|-----------------|------------|
| Max Drawdown | Worst peak-to-trough decline | < 20% |
| Sharpe Ratio | Risk-adjusted return | > 1.0 |
| Profit Factor | Gross profit / gross loss | > 1.5 |
| Win Rate | Percentage of profitable trades | > 50% |

## Risk Levels

Based on portfolio metrics, classify overall risk:

| Risk Level | Conditions |
|-----------|------------|
| Low | Drawdown < 10%, diversified across 5+ positions, no single position > 20% |
| Medium | Drawdown 10-20%, 3-5 positions, largest position 20-35% |
| High | Drawdown 20-35%, concentrated in 1-2 positions, largest > 35% |
| Critical | Drawdown > 35%, single position dominance, correlation risk |
