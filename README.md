# Lucid Trade

Crypto trading intelligence skills for AI agents. Pure markdown domain knowledge covering technical analysis, position sizing, risk management, backtesting, and portfolio tracking.

Part of the [Lucid Foundation](https://github.com/lucid-foundation) AgentSkills ecosystem.

## Install

### Claude Code

```bash
claude install lucid-trade
```

### OpenClaw

```bash
openclaw install lucid-trade
```

## Skills

| Skill | Description |
|-------|-------------|
| **market-analysis** | Technical analysis indicators (RSI, MACD, Bollinger Bands), volatility metrics, trend detection, and exchange comparison |
| **trading** | Position sizing (fixed-percentage risk model, Kelly Criterion), risk/reward ratio, order types, slippage management |
| **portfolio** | Portfolio tracking, PnL calculation (long/short), price alerts, trade history, performance metrics |
| **backtesting** | Strategy backtesting with SMA crossover and RSI mean-reversion, equity curves, result metrics |

## Project Structure

```
lucid-trade/
  skill.yaml                              # Package manifest
  HEARTBEAT.md                            # Periodic health checks
  skills/
    market-analysis/
      SKILL.md                            # Technical analysis procedures
      references/
        indicators.md                     # All indicator formulas
        providers.md                      # API reference for data providers
    trading/
      SKILL.md                            # Position sizing and risk management
      references/
        risk-parameters.md                # Default parameters and ranges
    portfolio/
      SKILL.md                            # PnL calculation and portfolio tracking
      references/
        performance-metrics.md            # Sharpe, drawdown, profit factor formulas
    backtesting/
      SKILL.md                            # Backtest engine and strategy rules
      references/
        strategies.md                     # Full strategy pseudocode
  .claude-plugin/
    plugin.json                           # Claude Code manifest
  openclaw.plugin.json                    # OpenClaw manifest
```

## License

MIT
