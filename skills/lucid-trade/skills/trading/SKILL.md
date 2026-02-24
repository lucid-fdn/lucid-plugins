---
name: trading
description: "Position sizing, risk management, and order execution for crypto trading"
---

# Trading

Calculate optimal position sizes, manage risk with stop losses and take profits, and execute orders across DEX and CEX venues.

## Position Sizing (Fixed-Percentage Risk Model)

The core risk model: risk a fixed percentage of portfolio value per trade.

### Formulas

```
Risk Amount = Portfolio Value * (Risk Per Trade % / 100)
Stop Loss Distance = |Entry Price - Stop Loss Price|
Position Size (units) = Risk Amount / Stop Loss Distance
Position Value = Position Size * Entry Price
Max Allowed Value = Portfolio Value * (Max Position % / 100)
```

If `Position Value > Max Allowed Value`, cap the position:
```
Position Value = Max Allowed Value
Position Size = Max Allowed Value / Entry Price
```

### Example

Portfolio: $50,000. Risk per trade: 2%. Entry: $100. Stop loss: $95.

```
Risk Amount = $50,000 * 0.02 = $1,000
Stop Loss Distance = |$100 - $95| = $5
Position Size = $1,000 / $5 = 200 units
Position Value = 200 * $100 = $20,000
Max Allowed (10%) = $50,000 * 0.10 = $5,000
Since $20,000 > $5,000 → cap at $5,000 → 50 units
```

## Kelly Criterion (Half-Kelly)

Optimal position sizing based on historical win rate and average win/loss.

```
kelly = (WinRate * AvgWin% - (1 - WinRate) * AvgLoss%) / AvgWin%
half_kelly = max(0, kelly / 2)
Position Value = Portfolio * half_kelly
```

**Default estimates** (when no historical data available):
- Win Rate: 55%
- Average Win: 3%
- Average Loss: 2%

Half-Kelly is used instead of full Kelly to reduce the risk of ruin. Full Kelly is mathematically optimal but assumes perfect knowledge of probabilities, which is unrealistic in practice.

## Risk/Reward Ratio

```
Risk = |Entry Price - Stop Loss Price|
Reward = |Take Profit Price - Entry Price|
R:R = Reward / Risk
```

| R:R Rating | Ratio | Guidance |
|-----------|-------|---------|
| Excellent | >= 3:1 | High confidence trades |
| Good | >= 2:1 | Standard target |
| Acceptable | >= 1:1 | Only with high win rate |
| Poor | < 1:1 | Avoid unless special circumstances |

## Order Types

| Order Type | Description |
|-----------|-------------|
| `market` | Execute immediately at current market price |
| `limit` | Execute only at specified price or better |
| `stop_loss` | Sell when price drops to stop level (risk management) |
| `take_profit` | Sell when price rises to target level (lock in gains) |
| `trailing_stop` | Stop loss that moves up with price (follows by fixed % or amount) |

## Slippage Management

- **Default slippage**: 0.5%
- Slippage is the difference between expected and actual execution price
- For DEX swaps, set slippage tolerance per exchange:
  - Jupiter (Solana): specified in **basis points** (0.5% = 50 bps)
  - 1inch (EVM): specified as **percentage** (0.5 = 0.5%)
- Higher volatility tokens may need higher slippage tolerance (1-3%)
- Very low liquidity tokens may need 5%+ or should be avoided

## Default Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Default Slippage | 0.5% | Slippage tolerance for swaps |
| Max Position Size | 10% | Maximum % of portfolio in a single position |
| Risk Per Trade | 2% | Maximum % of portfolio risked per trade |
| RSI Oversold | 30 | RSI level considered oversold |
| RSI Overbought | 70 | RSI level considered overbought |

See `references/risk-parameters.md` for the full parameter table with valid ranges.
