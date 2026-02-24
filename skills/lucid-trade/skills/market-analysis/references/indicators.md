# Technical Indicator Formulas

Complete formulas for all supported technical analysis indicators.

## Simple Moving Average (SMA)

```
SMA[i] = sum(values[i - period + 1 : i + 1]) / period
```

- Requires at least `period` data points
- Returns one value per bar starting from index `period - 1`

## Exponential Moving Average (EMA)

```
k = 2 / (period + 1)
EMA[0] = SMA of first `period` values (seed)
EMA[i] = values[i] * k + EMA[i-1] * (1 - k)
```

- The smoothing factor `k` gives more weight to recent prices
- Seed the first EMA value with the SMA of the first `period` values

## Relative Strength Index (RSI)

Default period: **14**

```
deltas[i] = close[i] - close[i-1]
avgGain = mean of positive deltas over first `period` bars
avgLoss = mean of absolute negative deltas over first `period` bars

For subsequent bars (Wilder smoothing):
  avgGain = (avgGain * (period - 1) + currentGain) / period
  avgLoss = (avgLoss * (period - 1) + currentLoss) / period

RS = avgGain / avgLoss
RSI = 100 - 100 / (1 + RS)
```

If avgLoss = 0, RSI = 100.

**Thresholds:**
- RSI < 30 = Oversold (bullish reversal signal)
- RSI > 70 = Overbought (bearish reversal signal)
- RSI 30-70 = Neutral zone

## MACD (Moving Average Convergence Divergence)

Default parameters: **Fast=12, Slow=26, Signal=9**

```
MACD Line = EMA(close, 12) - EMA(close, 26)
Signal Line = EMA(MACD Line, 9)
Histogram = MACD Line - Signal Line
```

Array alignment: the slow EMA starts later than the fast EMA. Offset = slowPeriod - fastPeriod. Align the fast EMA array by this offset before subtraction.

**Interpretation:**
- Positive histogram = bullish momentum
- Negative histogram = bearish momentum
- MACD crossing above signal = bullish crossover
- MACD crossing below signal = bearish crossover

## Bollinger Bands

Default parameters: **Period=20, Standard Deviations=2**

```
Middle Band = SMA(close, 20)
StdDev = sqrt(sum((close[i] - Middle)^2 for i in window) / period)
Upper Band = Middle + 2 * StdDev
Lower Band = Middle - 2 * StdDev
```

**Interpretation:**
- Price below lower band = oversold
- Price above upper band = overbought
- Band Width = (Upper - Lower) / Middle * 100 (measures relative volatility)
- Narrow bands (squeeze) often precede a breakout

## Average True Range (ATR)

Default period: **14**

```
True Range[i] = max(
  high[i] - low[i],
  |high[i] - close[i-1]|,
  |low[i] - close[i-1]|
)

ATR[0] = SMA of first `period` True Range values
ATR[i] = (ATR[i-1] * (period - 1) + TR[i]) / period   (Wilder smoothing)

ATR% = ATR / Price * 100
```

- ATR% normalizes ATR for comparison across assets with different price levels
- Higher ATR% means higher volatility relative to price

## Historical Volatility

Default lookback: **20 periods**

```
logReturns[i] = ln(close[i] / close[i-1])
mean = average(logReturns)
variance = average((logReturns[i] - mean)^2)
Historical Volatility = sqrt(variance * 365) * 100
```

- Uses 365 annualization factor (crypto markets trade 24/7/365)
- Result is expressed as a percentage

## Trend Detection (SMA 20/50 Crossover)

Requires at least 50 data points.

```
Compute SMA(20) and SMA(50)
tolerance = SMA20 * 0.005 (0.5% dead zone)
pctAbove20 = (Price - SMA20) / SMA20 * 100

Classification:
  Strong Uptrend:   Price > SMA20 > SMA50 AND pctAbove20 > 5%
  Uptrend:          Price > SMA20 AND SMA20 > SMA50
  Strong Downtrend: Price < SMA20 < SMA50 AND pctAbove20 < -5%
  Downtrend:        Price < SMA20 AND SMA20 < SMA50
  Sideways:         Everything else (within tolerance zone)
```

All comparisons use the tolerance zone to avoid whipsaw signals near crossover points.

## Support and Resistance Levels

Default lookback: **50 bars**

```
For each bar[i] where i >= 2 and i < length - 2:

  Swing Low (Support):
    bar[i].low < bar[i-1].low AND
    bar[i].low < bar[i-2].low AND
    bar[i].low < bar[i+1].low AND
    bar[i].low < bar[i+2].low

  Swing High (Resistance):
    bar[i].high > bar[i-1].high AND
    bar[i].high > bar[i-2].high AND
    bar[i].high > bar[i+1].high AND
    bar[i].high > bar[i+2].high
```

- Support levels are sorted descending (strongest/nearest first)
- Resistance levels are sorted ascending (nearest first)
- A 5-bar window (2 bars on each side) confirms the swing point
