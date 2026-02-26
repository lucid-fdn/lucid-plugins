# Lucid Audit

Smart contract security brain — AI-powered vulnerability detection, gas optimization, and security scoring with structured verdicts across 7 EVM chains.

## v2.0 — Brain Layer

Lucid Audit v2 is a full TypeScript MCP server with a brain layer that combines 9 vulnerability detectors, 6 gas analyzers, and a security scoring engine into structured verdicts.

### Brain Tools

| Tool | Description |
|------|-------------|
| **lucid_audit** | Deep security audit of a single contract — runs all detectors + analyzers, returns verdict (SAFE / CAUTION / RISKY / CRITICAL), score (0-100), grade (A-F), top vulnerabilities, gas analysis, and risk factors |
| **lucid_audit_compare** | Compare two contract versions — identifies fixed, new, and persistent issues with score delta and trend (IMPROVED / REGRESSED / UNCHANGED) |
| **lucid_audit_batch** | Batch scan multiple contracts — aggregate scores, verdicts, finding counts, and worst contract identification |
| **lucid_gas** | Focused gas optimization analysis — storage inefficiencies, loop issues, packing problems, visibility improvements with estimated savings per issue |
| **lucid_audit_pro** | Direct access to individual vulnerability detectors, gas analyzers, and scoring functions (20 sub-tools) |

### Verdicts

| Verdict | Condition | Meaning |
|---------|-----------|---------|
| **SAFE** | Score >= 75 | No critical issues, minor findings only |
| **CAUTION** | Score >= 40 | Medium-severity issues found, review recommended |
| **RISKY** | Score < 40 | High-severity issues detected, significant risk |
| **CRITICAL** | Any critical finding | Critical vulnerability found, do not deploy |

### Core Analysis Engines

**9 Vulnerability Detectors**

| Detector | What It Catches |
|----------|-----------------|
| Reentrancy | State changes after external calls, cross-function reentrancy |
| Access Control | Missing onlyOwner, open initializers, unprotected selfdestruct |
| Overflow | Unchecked arithmetic in Solidity < 0.8, unsafe casts |
| Unchecked Returns | Ignored return values from low-level calls and transfers |
| Front-Running | Transaction ordering dependence, sandwich attack vectors |
| Oracle Manipulation | Price oracle single-source reliance, stale data usage |
| Flash Loans | Unprotected flash loan callbacks, price manipulation via flash borrows |
| Logic Errors | Off-by-one, incorrect comparisons, missing edge cases |
| Centralization | Single admin keys, no timelock, upgradeable without governance |

**6 Gas Analyzers**

| Analyzer | What It Detects |
|----------|-----------------|
| Storage in Loops | SSTORE/SLOAD inside loops, should cache in memory |
| Unnecessary SLOADs | Repeated storage reads of the same slot |
| Packing Issues | Struct fields not ordered for optimal slot packing |
| Loop Optimizations | Unbounded loops, redundant length checks, missing unchecked increments |
| Visibility Optimization | Public functions that could be external, missing view/pure |
| Misc Patterns | Redundant zero checks, string vs bytes32, calldata vs memory |

**Security Scoring**

Score starts at 100 and deducts per finding severity:

| Severity | Deduction |
|----------|-----------|
| Critical | -25 |
| High | -15 |
| Medium | -8 |
| Low | -3 |

Grades: **A** (90-100), **B** (75-89), **C** (60-74), **D** (40-59), **F** (0-39)

### Supported Chains

Ethereum, BSC, Polygon, Arbitrum, Optimism, Avalanche, Base

## Install

### Claude Code

```bash
claude install lucid-audit
```

### OpenClaw

```bash
openclaw install lucid-audit
```

### MCP Server (stdio)

```bash
npx @raijinlabs/audit
```

## Configuration

All configuration via environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `AUDIT_SUPABASE_URL` | Yes | Supabase project URL for audit storage |
| `AUDIT_SUPABASE_KEY` | Yes | Supabase service role key |
| `AUDIT_ETHERSCAN_API_KEY` | Yes | Etherscan API key for contract source verification |
| `AUDIT_LOG_LEVEL` | No | Log level: debug / info / warn / error (default: info) |

Database uses Supabase with tenant isolation via Row Level Security (RLS).

## Project Structure

```
lucid-audit/
  package.json                                 # @raijinlabs/audit v2.0.0
  tsconfig.json                                # TypeScript strict, ES2022
  tsup.config.ts                               # 4 entry points (index, mcp, openclaw, bin)
  vitest.config.ts                             # 157 tests across 8 suites
  skill.yaml                                   # Plugin manifest
  src/
    index.ts                                   # Barrel exports
    bin.ts                                     # MCP stdio entry point
    mcp.ts                                     # MCP server factory
    openclaw.ts                                # OpenClaw plugin registration
    brain/
      types.ts                                 # AuditResult, CompareResult, BatchScanResult, GasResult, AuditVerdict
      analysis.ts                              # runAudit(), runCompare(), runBatchScan(), runGasAnalysis()
      tools.ts                                 # 5 brain MCP tools (lucid_ prefix)
      formatter.ts                             # Human-readable output formatters
      index.ts                                 # Brain barrel export
    core/
      index.ts                                 # Core barrel export
      plugin-id.ts                             # Plugin metadata constants
      analysis/
        vulnerability-detector.ts              # 9 detectors + fullVulnerabilityScan()
        gas-analyzer.ts                        # 6 analyzers + fullGasAnalysis()
        security-scorer.ts                     # computeSecurityScore(), scoreToGrade(), buildScoreBreakdown()
        prompts.ts                             # Prompt templates for analysis
        index.ts                               # Analysis barrel export
      config/
        defaults.ts                            # Default configuration values
        loader.ts                              # Environment variable loader
        schema.ts                              # Zod validation schema
        index.ts                               # Config barrel export
      db/
        client.ts                              # Supabase client factory
        audits.ts                              # Audit record CRUD
        contracts.ts                           # Contract record CRUD
        gas-reports.ts                         # Gas report CRUD
        vulnerabilities.ts                     # Vulnerability record CRUD
        index.ts                               # DB barrel export
      providers/
        etherscan.ts                           # Etherscan API adapter (source verification)
        index.ts                               # Provider barrel export
      services/
        audit-scheduler.ts                     # Scheduled audit orchestration
        index.ts                               # Services barrel export
      tools/
        scan-contract.ts                       # audit_scan_contract
        get-security-score.ts                  # audit_get_security_score
        check-reentrancy.ts                    # audit_check_reentrancy
        check-access-control.ts                # audit_check_access_control
        analyze-gas.ts                         # audit_analyze_gas
        verify-contract.ts                     # audit_verify_contract
        get-audit-report.ts                    # audit_get_audit_report
        list-audits.ts                         # audit_list_audits
        compare-contracts.ts                   # audit_compare_contracts
        check-upgradability.ts                 # audit_check_upgradability
        get-known-vulnerabilities.ts           # audit_get_known_vulnerabilities
        analyze-dependencies.ts                # audit_analyze_dependencies
        generate-findings.ts                   # audit_generate_findings
        status.ts                              # audit_status
        types.ts                               # ToolDefinition, ToolParamDef
        index.ts                               # Tool barrel export + createAllTools()
      types/
        common.ts                              # VulnerabilitySeverity, Chain, shared enums
        config.ts                              # PluginConfig type
        database.ts                            # Database row types
        provider.ts                            # Provider interface
        index.ts                               # Types barrel export
      utils/
        date.ts                                # Date formatting helpers
        errors.ts                              # Custom error classes
        logger.ts                              # [audit] prefixed logger
        retry.ts                               # Retry with backoff utility
        text.ts                                # Text normalization helpers
        url.ts                                 # URL construction helpers
        index.ts                               # Utils barrel export
    adapters/
      typebox-schema.ts                        # TypeBox schema adapter
      zod-schema.ts                            # Zod schema adapter
      index.ts                                 # Adapter barrel export
  test/
    brain/
      analysis.test.ts                         # Brain analysis tests
    config-loader.test.ts                      # Config loading tests
    gas-analyzer.test.ts                       # Gas analyzer tests
    mcp-server.test.ts                         # MCP server integration tests
    security-scorer.test.ts                    # Security scoring tests
    text-utils.test.ts                         # Text utility tests
    tool-registration.test.ts                  # Tool registration tests
    vulnerability-detector.test.ts             # Vulnerability detector tests
  .claude-plugin/
    plugin.json                                # Claude Code manifest
  openclaw.plugin.json                         # OpenClaw manifest
```

## Development

```bash
npm install
npm run typecheck          # tsc --noEmit
npm test                   # vitest run (157 tests)
npm run build              # tsup (CJS + ESM + DTS)
```

## Part of Lucid Skills

This package is part of the [lucid-skills](https://github.com/raijinlabs/lucid-skills) monorepo — 19 total tools (14 core + 5 brain).

## License

MIT
