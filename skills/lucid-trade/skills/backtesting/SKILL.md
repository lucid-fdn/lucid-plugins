---
name: backtesting
description: "Strategy backtesting with SMA crossover and RSI mean-reversion against historical crypto data"
---

# Backtesting

Test trading strategies against historical OHLCV data to evaluate performance before risking real capital.

## SMA Crossover Strategy

A trend-following strategy based on moving average crossovers.

### Rules

- **Entry (Golden Cross)**: Fast SMA crosses above Slow SMA (previous bar: Fast <= Slow, current bar: Fast > Slow)
- **Exit (Death Cross)**: Fast SMA crosses below Slow SMA (previous bar: Fast >= Slow, current bar: Fast < Slow)
- **Direction**: Long only (buy on golden cross, sell on death cross)

### Default Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Fast Period | 10 | Fast SMA lookback |
| Slow Period | 30 | Slow SMA lookback |
| Minimum Bars | 500 | Minimum OHLCV bars needed |

### How It Works

1. Compute SMA(fastPeriod) and SMA(slowPeriod) on close prices
2. Align arrays: offset = slowPeriod - fastPeriod
3. Walk through bars starting from slowPeriod:
   - If fast SMA crosses above slow SMA and no open position: **BUY** at close price
   - If fast SMA crosses below slow SMA and position is open: **SELL** at close price, record trade PnL
4. Calculate performance metrics on all completed trades

See `references/strategies.md` for full pseudocode.

## RSI Mean-Reversion Strategy

A mean-reversion strategy that buys oversold conditions and sells overbought conditions.

### Rules

- **Entry**: RSI crosses above the oversold level (previous bar: RSI <= oversold, current bar: RSI > oversold)
- **Exit**: RSI crosses above the overbought level (previous bar: RSI <= overbought, current bar: RSI > overbought)
- **Direction**: Long only

### Default Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| RSI Period | 14 | RSI calculation lookback |
| Oversold Level | 30 | Entry trigger level |
| Overbought Level | 70 | Exit trigger level |

### How It Works

1. Compute RSI(period) on close prices
2. Walk through RSI values starting from index 1:
   - If RSI crosses above oversold threshold and no open position: **BUY** at close price
   - If RSI crosses above overbought threshold and position is open: **SELL** at close price, record trade PnL
3. Calculate performance metrics on all completed trades

See `references/strategies.md` for full pseudocode.

## Backtest Engine

### Equity Calculation

Starting equity: **$10,000**

```
equity = 10000
For each completed trade:
  equity = equity * (1 + trade_pnl_pct / 100)
Total Return % = ((final_equity - 10000) / 10000) * 100
```

This models fully invested equity (each trade uses 100% of current equity).

### Result Metrics

Every backtest produces these metrics:

| Metric | Formula |
|--------|---------|
| Total Return % | ((Final Equity - 10000) / 10000) * 100 |
| Sharpe Ratio | Annualized mean return / annualized std dev (365-day) |
| Max Drawdown % | Maximum peak-to-trough decline in equity series |
| Win Rate % | Winning trades / total trades * 100 |
| Profit Factor | Gross profit / gross loss |
| Total Trades | Count of completed round-trip trades |

Plus the full trade list with entry/exit prices, times, and PnL for each trade.

## Additional Strategy Configs

### DCA (Dollar-Cost Averaging)

| Parameter | Description |
|-----------|-------------|
| investmentPerTrade | Fixed USD amount per buy |
| frequency | Interval between buys (e.g., "daily", "weekly", "monthly") |

DCA buys a fixed dollar amount at regular intervals regardless of price. Effective for reducing impact of volatility on average entry price.

### Grid Trading

| Parameter | Description |
|-----------|-------------|
| bottomPrice | Lower bound of the grid |
| topPrice | Upper bound of the grid |
| gridLevels | Number of grid lines between bottom and top |
| investmentAmount | Total capital allocated to the grid |

Grid spacing: `(topPrice - bottomPrice) / gridLevels`

Each grid level has a buy order (when price drops to that level) and a sell order (at the next level up). Investment per level = investmentAmount / gridLevels.
