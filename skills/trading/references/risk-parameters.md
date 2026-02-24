# Risk Parameters Reference

All configurable parameters with defaults, valid ranges, and formulas.

## Parameter Table

| Parameter | Default | Min | Max | Description |
|-----------|---------|-----|-----|-------------|
| Default Slippage | 0.5% | - | - | Slippage tolerance for DEX swaps |
| Max Position Size | 10% | 1% | 100% | Maximum portfolio allocation per position |
| Risk Per Trade | 2% | 0.1% | 10% | Maximum portfolio risk per individual trade |
| RSI Oversold | 30 | 10 | 40 | RSI level for oversold signal |
| RSI Overbought | 70 | 60 | 90 | RSI level for overbought signal |
| SMA Fast Period | 20 | 5 | 50 | Fast moving average for trend detection |
| SMA Slow Period | 50 | 20 | 200 | Slow moving average for trend detection |
| Bollinger Period | 20 | 10 | 50 | Lookback period for Bollinger Bands |
| Bollinger StdDev | 2.0 | 1.0 | 3.0 | Standard deviations for Bollinger Bands |
| ATR Period | 14 | 7 | 28 | Average True Range lookback |
| Volatility Lookback | 20 | 10 | 60 | Periods for historical volatility calc |

## Position Sizing Formulas

### Fixed-Percentage Risk Model

```
Risk Amount = Portfolio Value * (Risk Per Trade % / 100)
Stop Loss Distance = |Entry Price - Stop Loss Price|
Stop Loss Distance % = (Stop Loss Distance / Entry Price) * 100
Position Size (units) = Risk Amount / Stop Loss Distance
Position Value = Position Size * Entry Price
Max Allowed = Portfolio Value * (Max Position % / 100)

If Position Value > Max Allowed:
  Position Value = Max Allowed
  Position Size = Max Allowed / Entry Price
```

### Kelly Criterion (Half-Kelly)

```
kelly = (WinRate * AvgWin% - (1 - WinRate) * AvgLoss%) / AvgWin%
half_kelly = max(0, kelly / 2)
Position Value = Portfolio Value * half_kelly
```

Default estimates when no trade history exists:
- Win Rate: 0.55 (55%)
- Average Win %: 3.0
- Average Loss %: 2.0

### Risk/Reward Ratio

```
Risk = |Entry Price - Stop Loss Price|
Reward = |Take Profit Price - Entry Price|
R:R Ratio = Reward / Risk
```

Minimum acceptable R:R is 1:1. Target R:R is 2:1 or better.

## Volatility-Adjusted Position Sizing

Reduce position size when volatility is elevated:

| Volatility Regime | Historical Vol | Position Size Multiplier |
|-------------------|---------------|------------------------|
| Low | < 30% | 1.0x (full size) |
| Moderate | 30% - 60% | 1.0x (standard) |
| High | 60% - 100% | 0.5x (half size) |
| Extreme | > 100% | 0.25x (quarter size) |

Apply as: `Adjusted Position = Base Position Size * Multiplier`

## Order Type Reference

| Type | Trigger | Use Case |
|------|---------|----------|
| market | Immediate | Urgent entries/exits |
| limit | Price reaches target | Planned entries at specific levels |
| stop_loss | Price falls to level | Risk management, cap downside |
| take_profit | Price rises to level | Lock in gains at target |
| trailing_stop | Price reverses by % | Follow trends, protect profits |
