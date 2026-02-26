# Lucid Tax

Crypto Tax & DeFi Accounting MCP -- AI brain layer with structured verdicts, multi-method cost-basis optimization, tax-loss harvesting with wash sale detection, and multi-jurisdiction support across 9 tax regimes.

## v2.0 -- Brain Layer

Lucid Tax v2 is a full TypeScript MCP server with a brain layer that combines capital gains calculation, cost-basis method comparison, tax-loss harvesting analysis, wallet health scoring, and pro-level direct access into structured verdicts.

### Brain Tools

| Tool | Description |
|------|-------------|
| **lucid_tax_analyze** | Full tax analysis for a year -- gains, method comparison, optimization recommendations -> OPTIMIZE / COMPLIANT / ACTION_NEEDED / AUDIT_RISK |
| **lucid_tax_optimize** | Compare all cost basis methods (FIFO, LIFO, HIFO, ACB) to find the one that minimizes tax for a given year |
| **lucid_tax_harvest** | Find tax-loss harvesting opportunities with wash sale detection and estimated tax savings |
| **lucid_tax_health** | Wallet and data health check -- unclassified transactions, missing prices, high-value items, health score |
| **lucid_tax_pro** | Direct access to 10 tax computation sub-tools (calculate_taxable_events, calculate_income, aggregate_by_year, estimate_tax, build_positions, find_harvesting, wash_sale_risk, calculate_cost_basis, classify_gain_type, holding_period) |

### Verdicts

| Verdict | Meaning |
|---------|---------|
| **AUDIT_RISK** | High-value transactions (>=3 over $100k) combined with many unclassified or missing-price entries (>10). Immediate attention required. |
| **ACTION_NEEDED** | More than 5 unclassified transactions or more than 5 with missing price data. Data quality must improve before filing. |
| **OPTIMIZE** | All data is clean but potential tax savings exceed $100. Switch cost basis method or harvest losses. |
| **COMPLIANT** | Data is complete, no significant optimization available. Ready to file. |

### Core Capabilities

- **5 cost basis methods**: FIFO, LIFO, HIFO, ACB (Average Cost Basis), Specific ID
- **9 jurisdictions**: US, UK, CA, AU, DE, FR, JP, SG, AE -- each with jurisdiction-specific long-term thresholds and tax rates
- **4 data providers**: Etherscan (Ethereum, BSC, Arbitrum, Base, Polygon, Avalanche), Solscan (Solana), CoinGecko (prices), CoinMarketCap (backup prices)
- **Transaction classifier**: 17 transaction types -- buy, sell, swap, transfer_in, transfer_out, stake, unstake, claim, mint, burn, bridge, airdrop, income, gift_received, gift_sent, lost, stolen
- **Report formats**: summary, detailed, form_8949, schedule_d, csv

### Core Tools (12)

| Tool | Description |
|------|-------------|
| `tax_import_wallet` | Import a crypto wallet and fetch all its transactions (8 chains) |
| `tax_classify_transactions` | Auto-classify transactions by type using on-chain data analysis |
| `tax_calculate_gains` | Calculate capital gains/losses for a tax year with specified cost basis method |
| `tax_get_summary` | Full tax summary for a year and jurisdiction with estimated tax |
| `tax_generate_report` | Generate formatted tax reports (Form 8949, Schedule D, CSV, summary, detailed) |
| `tax_find_harvesting` | Find tax-loss harvesting opportunities in current holdings |
| `tax_get_cost_basis` | Get current cost basis for a specific token across all lots |
| `tax_track_income` | Record crypto income events (mining, staking, airdrop, DeFi yield, salary, bounty, referral) |
| `tax_compare_methods` | Compare tax outcomes across FIFO, LIFO, and HIFO for a given tax year |
| `tax_get_unrealized` | Get unrealized gains and losses for all current holdings |
| `tax_audit_transactions` | Audit transactions for unclassified, missing price, or suspicious entries |
| `tax_status` | Check health and status of the Lucid Tax system |

**17 total tools** (12 core + 5 brain).

## Install

### Claude Code

```bash
claude install lucid-tax
```

### OpenClaw

```bash
openclaw install lucid-tax
```

### MCP Server (stdio)

```bash
npx @raijinlabs/tax
```

## Configuration

All configuration via environment variables (TAX_ prefix):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAX_SUPABASE_URL` | Yes | -- | Supabase project URL |
| `TAX_SUPABASE_KEY` | Yes | -- | Supabase service role key |
| `TAX_TENANT_ID` | Yes | -- | Tenant identifier for multi-tenancy |
| `TAX_DEFAULT_JURISDICTION` | No | `us` | Default tax jurisdiction (us, uk, ca, au, de, fr, jp, sg, ae) |
| `TAX_DEFAULT_COST_BASIS_METHOD` | No | `fifo` | Default cost basis method (fifo, lifo, hifo, acb, specific_id) |
| `TAX_YEAR` | No | Current year | Tax year for calculations (2009-2100) |
| `TAX_ETHERSCAN_API_KEY` | No | -- | Etherscan API key (Ethereum, BSC, Arbitrum, Base, Polygon, Avalanche) |
| `TAX_SOLSCAN_API_KEY` | No | -- | Solscan API key (Solana transactions) |
| `TAX_BIRDEYE_API_KEY` | No | -- | Birdeye API key (token prices) |
| `TAX_COINGECKO_API_KEY` | No | -- | CoinGecko API key (token prices) |
| `TAX_COINMARKETCAP_API_KEY` | No | -- | CoinMarketCap API key (backup prices) |
| `TAX_SLACK_WEBHOOK_URL` | No | -- | Slack webhook for notifications |

## Project Structure

```
lucid-tax/
  package.json                         # @raijinlabs/tax v2.0.0
  tsconfig.json                        # TypeScript strict, ES2022
  tsup.config.ts                       # 4 entry points (index, mcp, openclaw, bin)
  vitest.config.ts                     # 129 tests across 10 suites
  skill.yaml                           # Plugin manifest
  sql/                                 # Database migration scripts
  src/
    index.ts                           # Barrel exports
    bin.ts                             # MCP stdio entry point (tax-mcp binary)
    mcp.ts                             # MCP server factory
    openclaw.ts                        # OpenClaw plugin registration
    adapters/
      index.ts                         # Adapter barrel export
      mcp.ts                           # MCP adapter (tool registration)
      openclaw.ts                      # OpenClaw adapter
    brain/
      types.ts                         # TaxVerdict, TaxAnalysisResult, MethodComparisonResult, etc.
      analysis.ts                      # runTaxAnalysis, runMethodComparison, runHarvestingAnalysis, runWalletHealth
      tools.ts                         # 5 brain MCP tools (lucid_tax_*)
      formatter.ts                     # Human-readable output formatters
      index.ts                         # Brain barrel export
    core/
      plugin-id.ts                     # Plugin metadata constants
      config/
        index.ts                       # Config barrel export
        loader.ts                      # loadConfig() from TAX_* env vars
      db/
        client.ts                      # Supabase client factory
        wallets.ts                     # Wallet CRUD operations
        transactions.ts                # Transaction CRUD operations
        cost-basis.ts                  # Cost basis lot operations
        tax-events.ts                  # Tax event storage
        summaries.ts                   # Year summary storage
        prices.ts                      # Price data cache
        index.ts                       # DB barrel export
      providers/
        base.ts                        # Base provider interface
        etherscan.ts                   # Etherscan adapter (6 EVM chains)
        solscan.ts                     # Solscan adapter (Solana)
        coingecko.ts                   # CoinGecko price provider
        coinmarketcap.ts               # CoinMarketCap price provider (backup)
        index.ts                       # Provider registry factory
      services/
        tax-scheduler.ts               # Scheduled tax computation jobs
        index.ts                       # Services barrel export
      analysis/
        cost-basis-calculator.ts       # FIFO/LIFO/HIFO/ACB/Specific ID cost basis engine
        tax-calculator.ts              # Taxable events, income, yearly aggregation, tax estimation
        tax-loss-harvester.ts          # Position builder, harvesting finder, wash sale detection
        transaction-classifier.ts      # 17-type auto-classifier
        prompts.ts                     # LLM prompt templates
        index.ts                       # Analysis barrel export
      tools/
        handlers.ts                    # 12 core tool definitions
        types.ts                       # ToolDefinition, ToolResult, ToolContent
        index.ts                       # Tools barrel export
      types/
        common.ts                      # Chains, TxTypes, CostBasisMethods, Jurisdictions, etc.
        config.ts                      # PluginConfig interface
        database.ts                    # Transaction, CostBasisLot, TaxEvent, Wallet types
        provider.ts                    # Provider interfaces
        index.ts                       # Types barrel export
      utils/
        date.ts                        # Date/tax-year helpers
        errors.ts                      # ConfigError, custom error types
        logger.ts                      # [tax] prefixed logger
        retry.ts                       # Retry with backoff utility
        text.ts                        # formatUsd, abbreviateAddress, snakeToTitle
        url.ts                         # URL utilities
        index.ts                       # Utils barrel export
  test/
    setup.ts                           # Test environment setup
    brain/
      analysis.test.ts                 # Brain analysis engine tests
    config-loader.test.ts              # Config validation tests
    cost-basis-calculator.test.ts      # Cost basis method tests
    date-utils.test.ts                 # Date utility tests
    mcp-server.test.ts                 # MCP server integration tests
    tax-calculator.test.ts             # Tax calculation tests
    tax-loss-harvester.test.ts         # Harvesting and wash sale tests
    text-utils.test.ts                 # Text formatting tests
    tool-registration.test.ts          # Tool registration tests
    transaction-classifier.test.ts     # Transaction type classifier tests
  .claude-plugin/
    plugin.json                        # Claude Code manifest
  openclaw.plugin.json                 # OpenClaw manifest
```

## Development

```bash
npm install
npm run typecheck          # tsc --noEmit
npm test                   # vitest run (129 tests)
npm run build              # tsup (ESM + DTS)
```

## Part of Lucid Skills

This package is part of the [lucid-skills](https://github.com/raijinlabs/lucid-skills) monorepo.

## License

MIT
