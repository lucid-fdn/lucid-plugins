---
name: market-analysis
description: "Technical analysis indicators, volatility metrics, market overview, and exchange comparison for crypto tokens"
---

# Market Analysis

Perform technical analysis on crypto tokens using standard indicators, assess volatility regimes, and compare prices across exchanges for best execution.

## Technical Analysis Procedure

When the user asks to analyze a token, follow this procedure:

1. **Fetch OHLCV data** for the requested token and timeframe using a blockchain explorer MCP (Alchemy, Etherscan) or market data API (Birdeye). Minimum 50 bars for trend detection, 100+ bars recommended.

2. **Compute indicators** using the formulas in `references/indicators.md`:
   - **RSI (14)** -- Momentum oscillator, range 0-100
   - **MACD (12, 26, 9)** -- Trend-following momentum
   - **Bollinger Bands (20, 2 sigma)** -- Volatility envelope
   - **Trend Detection** -- SMA 20/50 crossover classification
   - **Support/Resistance** -- Swing high/low detection

3. **Interpret signals** and produce a recommendation:

| Indicator | Bullish Signal | Bearish Signal |
|-----------|---------------|----------------|
| RSI | < 30 (oversold) | > 70 (overbought) |
| MACD | Positive histogram, MACD above signal | Negative histogram, MACD below signal |
| Bollinger Bands | Price below lower band (oversold) | Price above upper band (overbought) |
| Trend | Price > SMA20 > SMA50 | Price < SMA20 < SMA50 |
| Support/Resistance | Price bouncing off support | Price rejected at resistance |

4. **Score confidence** (0-100) based on how many indicators agree on direction.

5. **Present recommendation**: strong_buy, buy, neutral, sell, or strong_sell.

## Volatility Analysis

Volatility determines position sizing and risk. Compute these metrics:

- **Historical Volatility**: Annualized standard deviation of log returns over the last 20 periods. Formula: `sqrt(variance_of_log_returns * 365) * 100`. See `references/indicators.md` for full detail.
- **ATR (Average True Range)**: Smoothed average of true range over 14 periods. True Range = max(high-low, |high-prevClose|, |low-prevClose|).
- **ATR%**: ATR / Price * 100. Normalizes ATR for cross-asset comparison.
- **Bollinger Band Width**: (Upper - Lower) / Middle * 100. Measures relative volatility.

### Volatility Regimes

| Regime | Historical Volatility | Position Sizing Implication |
|--------|----------------------|----------------------------|
| Low | < 30% | Can use larger positions (up to max) |
| Moderate | 30% - 60% | Standard position sizing |
| High | 60% - 100% | Reduce position size by 50% |
| Extreme | > 100% | Reduce position size by 75% or avoid |

## Exchange Comparison

To find the best execution price for a swap:

1. Query multiple DEX aggregators for the same pair and amount (see `references/providers.md` for API details):
   - **Jupiter** for Solana tokens
   - **1inch** for EVM tokens (Ethereum, BSC, Arbitrum, Base, Polygon)

2. Compare quotes on: output amount, price impact, estimated gas, and route.

3. Recommend the exchange with the best net output (output amount minus fees and gas).

## Data Sources

Use blockchain explorer MCPs (Alchemy, Etherscan) or market data APIs for live data. See `references/providers.md` for supported providers, endpoints, and chain coverage.
