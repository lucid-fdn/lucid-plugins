# Strategy Pseudocode

Full algorithm pseudocode for all backtesting strategies.

## SMA Crossover Strategy

```
function backtestSmaCrossover(bars, fastPeriod=10, slowPeriod=30):
    closes = bars.map(bar => bar.close)

    # Compute moving averages
    fastSma = SMA(closes, fastPeriod)
    slowSma = SMA(closes, slowPeriod)

    # Align arrays: slow SMA has fewer values than fast SMA
    offset = slowPeriod - fastPeriod

    trades = []
    position = null  # { entryPrice, entryTime }

    for i = 1 to length(slowSma) - 1:
        prevFast = fastSma[i - 1 + offset]
        prevSlow = slowSma[i - 1]
        currFast = fastSma[i + offset]
        currSlow = slowSma[i]
        barIndex = i + slowPeriod - 1
        bar = bars[barIndex]

        # Golden Cross: fast crosses above slow → BUY
        if prevFast <= prevSlow AND currFast > currSlow AND position is null:
            position = { entryPrice: bar.close, entryTime: bar.timestamp }

        # Death Cross: fast crosses below slow → SELL
        if prevFast >= prevSlow AND currFast < currSlow AND position is not null:
            pnl = bar.close - position.entryPrice
            pnlPct = (pnl / position.entryPrice) * 100
            trades.append({
                entryPrice: position.entryPrice,
                exitPrice: bar.close,
                side: "buy",
                pnl: pnl,
                pnlPct: pnlPct,
                entryTime: position.entryTime,
                exitTime: bar.timestamp
            })
            position = null

    return buildResult(trades)
```

## RSI Mean-Reversion Strategy

```
function backtestRsi(bars, period=14, oversold=30, overbought=70):
    closes = bars.map(bar => bar.close)

    # Compute RSI
    rsiValues = RSI(closes, period)

    trades = []
    position = null  # { entryPrice, entryTime }

    for i = 1 to length(rsiValues) - 1:
        barIndex = i + period
        bar = bars[barIndex]
        prevRsi = rsiValues[i - 1]
        currRsi = rsiValues[i]

        # RSI crosses above oversold → BUY (mean reversion entry)
        if prevRsi <= oversold AND currRsi > oversold AND position is null:
            position = { entryPrice: bar.close, entryTime: bar.timestamp }

        # RSI crosses above overbought → SELL (take profit)
        if prevRsi <= overbought AND currRsi > overbought AND position is not null:
            pnl = bar.close - position.entryPrice
            pnlPct = (pnl / position.entryPrice) * 100
            trades.append({
                entryPrice: position.entryPrice,
                exitPrice: bar.close,
                side: "buy",
                pnl: pnl,
                pnlPct: pnlPct,
                entryTime: position.entryTime,
                exitTime: bar.timestamp
            })
            position = null

    return buildResult(trades)
```

## Build Backtest Result

```
function buildResult(trades, startingEquity=10000):
    # Build equity curve
    equity = startingEquity
    equitySeries = [equity]
    dailyReturns = []

    for each trade in trades:
        dailyReturns.append(trade.pnlPct / 100)
        equity = equity * (1 + trade.pnlPct / 100)
        equitySeries.append(equity)

    totalReturnPct = ((equity - startingEquity) / startingEquity) * 100

    # Max Drawdown
    peak = equitySeries[0]
    maxDD = 0
    for value in equitySeries:
        if value > peak: peak = value
        dd = (peak - value) / peak
        if dd > maxDD: maxDD = dd
    maxDrawdown = maxDD * 100

    # Sharpe Ratio
    if length(dailyReturns) >= 2:
        meanReturn = average(dailyReturns)
        variance = average((r - meanReturn)^2 for r in dailyReturns)
        stdDev = sqrt(variance)
        if stdDev > 0:
            sharpe = (meanReturn * 365) / (stdDev * sqrt(365))
        else:
            sharpe = 0
    else:
        sharpe = 0

    # Win Rate
    winners = count(trade for trade in trades if trade.pnl > 0)
    winRate = (winners / length(trades)) * 100 if trades else 0

    # Profit Factor
    grossProfit = sum(trade.pnl for trade in trades if trade.pnl > 0)
    grossLoss = sum(|trade.pnl| for trade in trades if trade.pnl < 0)
    profitFactor = grossProfit / grossLoss if grossLoss > 0 else Infinity

    return {
        totalReturn: totalReturnPct,
        sharpeRatio: sharpe,
        maxDrawdown: maxDrawdown,
        winRate: winRate,
        totalTrades: length(trades),
        profitFactor: profitFactor,
        trades: trades
    }
```

## DCA Strategy

```
function executeDca(token, chain, investmentPerTrade, frequency, totalSteps):
    avgPrice = 0
    totalInvested = 0
    totalAmount = 0

    for step = 1 to totalSteps:
        currentPrice = getPrice(token, chain)
        amountBought = investmentPerTrade / currentPrice
        totalAmount = totalAmount + amountBought
        totalInvested = totalInvested + investmentPerTrade
        avgPrice = totalInvested / totalAmount

        record {
            stepNumber: step,
            amountBought: amountBought,
            priceAtExecution: currentPrice,
            totalInvested: totalInvested,
            avgPrice: avgPrice,
            nextExecutionAt: now + frequency
        }

        wait(frequency)
```

## Grid Trading Strategy

```
function setupGrid(bottomPrice, topPrice, gridLevels, investmentAmount):
    gridSpacing = (topPrice - bottomPrice) / gridLevels
    investmentPerLevel = investmentAmount / gridLevels

    levels = []
    for i = 0 to gridLevels:
        price = bottomPrice + (i * gridSpacing)
        levels.append({
            level: i,
            price: price,
            buyAmount: investmentPerLevel / price,
            side: "buy",   # buy at this level
            sellPrice: price + gridSpacing,  # sell at next level up
            status: "pending"
        })

    # Monitor price and execute:
    # When price drops to a grid level → execute buy
    # When price rises to next grid level → execute sell
    # Profit per grid = gridSpacing * amount per level
```
