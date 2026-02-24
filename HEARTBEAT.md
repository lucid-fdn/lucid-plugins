# Heartbeat Checks

Periodic health checks to run for active trading operations.

## 1. Market Data Freshness

Verify that price data is recent and reliable.

- Fetch the current price for each tracked token using Birdeye or another market data provider
- Check the `lastUpdated` timestamp on each price response
- **Alert** if any price data is older than 5 minutes for actively traded tokens
- **Alert** if any price API returns an error or timeout
- Stale data can lead to incorrect position sizing and missed stop losses

## 2. Open Position Monitoring

Check PnL on all open positions and alert on excessive losses.

- For each open position, calculate current PnL using the portfolio skill formulas:
  - LONG: `(Current Price - Entry Price) * Amount`
  - SHORT: `(Entry Price - Current Price) * Amount`
- **Alert** if any position's loss exceeds the risk threshold (default: Risk Per Trade = 2% of portfolio)
- **Alert** if any position has hit its stop loss price but was not closed
- **Alert** if total portfolio drawdown exceeds 10%
- Report summary: number of positions, total PnL, largest winner, largest loser

## 3. Alert Conditions

Check if any configured price alerts have triggered.

- For each active alert, fetch current price and evaluate:
  - `above`: Current Price >= Target Price
  - `below`: Current Price <= Target Price
  - `pct_change`: |Price Change %| >= Threshold
- **Notify** the user of any triggered alerts with: token, chain, alert type, target, current price, timestamp
- Mark triggered alerts as fired so they do not repeat (unless configured as recurring)

## 4. Strategy Health

Check active DCA and grid strategy execution.

- For each active DCA strategy:
  - Verify the next scheduled buy is on track
  - **Alert** if a scheduled execution was missed (more than 1 interval overdue)
  - Report: current step, total invested, average price, next execution time
- For each active grid strategy:
  - Check if any grid levels have been triggered
  - **Alert** if the current price is outside the grid range (below bottom or above top)
  - Report: active levels, filled levels, estimated profit from completed grid trades
- **Alert** if any strategy has an error state or failed execution
