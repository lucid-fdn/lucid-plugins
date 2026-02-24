# Performance Metrics Formulas

Complete formulas for all portfolio performance metrics.

## Max Drawdown

The maximum observed loss from a peak to a trough before a new peak is reached.

```
For each value in the portfolio series:
  If value > peak: peak = value
  drawdown[i] = (peak - value[i]) / peak

Max Drawdown = max(drawdown[i]) * 100%
```

- Expressed as a percentage
- A max drawdown of 25% means the portfolio lost 25% from its highest point
- Lower is better; > 50% drawdown requires 100% gain to recover

## Sharpe Ratio

Measures risk-adjusted return. Uses risk-free rate of 0 for simplicity (common in crypto).

```
returns[] = array of period returns (e.g., per-trade PnL %)
mean_return = average(returns)
variance = average((returns[i] - mean_return)^2)
std_dev = sqrt(variance)

Annualized Return = mean_return * 365
Annualized StdDev = std_dev * sqrt(365)

Sharpe Ratio = Annualized Return / Annualized StdDev
```

- Uses 365-day annualization (crypto trades 24/7/365)
- If std_dev = 0, Sharpe Ratio = 0
- Sharpe > 1.0 is good, > 2.0 is excellent, < 0 means negative returns

## Profit Factor

Ratio of gross profits to gross losses.

```
Gross Profit = sum of PnL for all winning trades (PnL > 0)
Gross Loss = sum of |PnL| for all losing trades (PnL < 0)

Profit Factor = Gross Profit / Gross Loss
```

- If Gross Loss = 0 and Gross Profit > 0: Profit Factor = Infinity (all winners)
- If Gross Loss = 0 and Gross Profit = 0: Profit Factor = 0 (no trades)
- Profit Factor > 1.0 means overall profitable
- Profit Factor > 1.5 is good, > 2.0 is excellent

## Win Rate

Percentage of trades that were profitable.

```
Winning Trades = count of trades where PnL > 0
Total Trades = count of all closed trades

Win Rate = (Winning Trades / Total Trades) * 100%
```

- Win rate alone is not sufficient; must consider average win size vs average loss size
- A 40% win rate is fine if average win is 3x average loss (positive expectancy)
- A 70% win rate is bad if average loss is 5x average win (negative expectancy)

## Expected Value (Expectancy)

Combines win rate with average win/loss to determine if a strategy has positive expectancy.

```
Expectancy = (Win Rate * Average Win) - ((1 - Win Rate) * Average Loss)
```

- Positive expectancy = profitable strategy over time
- This is the basis for the Kelly Criterion position sizing

## Annualized Return

```
Total Return % = ((Final Value - Initial Value) / Initial Value) * 100
Days in Period = (End Date - Start Date) in days
Annualized Return = Total Return % * (365 / Days in Period)
```

## Calmar Ratio

Return relative to maximum drawdown risk.

```
Calmar Ratio = Annualized Return % / Max Drawdown %
```

- Higher is better; indicates more return per unit of drawdown risk
