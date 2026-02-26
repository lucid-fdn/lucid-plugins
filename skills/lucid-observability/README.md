# Lucid Observability

Production observability intelligence with 5 brain tools for incident triage, severity scoring, temporal pattern detection, production readiness checks, and outbox health analysis.

## v5.0 --- TypeScript Brain Layer

Lucid Observability v5 is a full TypeScript MCP server with a brain layer that combines severity scoring, temporal pattern detection, diagnosis pattern matching, readiness checking, and outbox health analysis into structured verdicts. 7 markdown sub-skills remain as domain knowledge reference for the AI agent.

### Brain Tools

| Tool | Description |
|------|-------------|
| **lucid_triage** | Full triage of a Sentry issue --- severity scoring, temporal pattern detection, and root cause diagnosis combined into a structured result |
| **lucid_readiness** | Production readiness check --- validates 9 environment variables against the observability checklist, returns score + pass/warn/fail per variable |
| **lucid_outbox_health** | OpenMeter outbox health analysis --- applies thresholds to detect queue backup, dead letters, stuck leases, and zero throughput |
| **lucid_diagnose** | Pattern-match an error against 12 known diagnosis categories with confidence scoring |
| **lucid_obs_pro** | Direct access to 5 math functions (score_severity, detect_temporal, diagnose_issue, check_readiness, analyze_outbox) |

### Severity Scoring

| Level | Thresholds |
|-------|------------|
| **CRITICAL** | Fatal level, count > 1000, or count > 100 within last hour |
| **HIGH** | Error with count > 100 or userCount > 10 |
| **MEDIUM** | Error with count > 10 |
| **LOW** | Everything else |

### Markdown Sub-Skills (7)

Domain knowledge consumed by the brain layer and available to the AI agent for deeper investigation:

| Skill | Description |
|-------|-------------|
| **triage** | Root cause analysis with pattern matching, temporal detection, severity scoring |
| **incident-response** | 4-phase workflow (assess/diagnose/mitigate/document) with 10 category runbooks |
| **correlation** | Cross-service error correlation using trace IDs across 6 platform services |
| **billing-health** | OpenMeter outbox monitoring, dead letter recovery, usage anomaly detection |
| **conventions** | OTel span names, attribute keys, PII rules, sampling configuration |
| **production-readiness** | Env var audit checklist with scoring and deployment verification |
| **alerting** | Sentry alert rule templates, frequency heuristics, notification routing |

### Math Modules

| Module | Purpose |
|--------|---------|
| `severity.ts` | CRITICAL / HIGH / MEDIUM / LOW scoring based on level, count, user count, recency |
| `temporal.ts` | Burst, steady, regression, sporadic, unknown pattern detection from event timestamps |
| `diagnosis.ts` | 12-pattern matching engine (4 Lucid-specific + 8 built-in) with confidence scoring |
| `readiness.ts` | 9 environment variable checks with pass/warn/fail and environment-aware logic |
| `outbox.ts` | Threshold analysis for queue depth, dead letters, stuck leases, zero throughput |

## Install

### Claude Code

```bash
claude install lucid-observability
```

### OpenClaw

```bash
openclaw install lucid-observability
```

### MCP Server (stdio)

```bash
npx @raijinlabs/observability
```

## Configuration

All configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_AUTH_TOKEN` | _(none)_ | Sentry API token (required for Sentry MCP server) |
| `SENTRY_ORG` | _(none)_ | Sentry organization slug (required for Sentry MCP server) |
| `OBSERVABILITY_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `OBSERVABILITY_ENVIRONMENT` | `development` | Target environment (production/staging/development) |

### Required External MCP Servers

| MCP Server | Purpose | Env Vars |
|------------|---------|----------|
| [Sentry MCP](https://github.com/getsentry/sentry-mcp) | Error tracking, issue management | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` |
| [Supabase MCP](https://github.com/supabase/supabase-mcp) | Database queries for billing pipeline | `DATABASE_URL` |

## Project Structure

```
lucid-observability/
  package.json                     # @raijinlabs/observability v5.0.0
  tsconfig.json                    # TypeScript strict, ES2022
  tsup.config.ts                   # 4 entry points (index, mcp, openclaw, bin)
  vitest.config.ts                 # 63 tests
  skill.yaml                       # Plugin manifest
  HEARTBEAT.md                     # Autonomous monitoring checks
  src/
    index.ts                       # Barrel exports
    bin.ts                         # MCP stdio entry point
    mcp.ts                         # MCP server factory
    openclaw.ts                    # OpenClaw plugin registration
    config.ts                      # Zod-validated env config
    plugin-id.ts                   # Plugin metadata constants
    types/
      index.ts                     # Severity, TemporalPattern, SentryIssue, TriageResult, etc.
    utils/
      logger.ts                    # [observability] prefixed logger
    math/
      severity.ts                  # CRITICAL/HIGH/MEDIUM/LOW scoring
      severity.test.ts             # Severity scoring tests
      temporal.ts                  # Burst/steady/regression/sporadic detection
      temporal.test.ts             # Temporal pattern tests
      diagnosis.ts                 # 12-pattern matching engine
      diagnosis.test.ts            # Diagnosis pattern tests
      readiness.ts                 # 9 env var checks
      readiness.test.ts            # Readiness scoring tests
      outbox.ts                    # Threshold analysis
      outbox.test.ts               # Outbox health tests
      index.ts                     # Math barrel export
    brain/
      types.ts                     # Brain-specific types
      analysis.ts                  # runTriage() --- combines severity + temporal + diagnosis
      analysis.test.ts             # Triage analysis tests
      tools.ts                     # 5 brain MCP tools
      tools.test.ts                # Brain tools tests
      formatter.ts                 # Human-readable output formatters
      index.ts                     # Brain barrel export
    tools/
      index.ts                     # ToolDefinition, ToolDependencies, createAllTools
  skills/
    triage/
      SKILL.md                     # Triage procedure
      references/
        diagnosis-patterns.md      # 12 error patterns (4 Lucid + 8 built-in)
        temporal-patterns.md       # Burst/steady/regression/sporadic detection
        known-bugs.md              # Known bug registry
        severity-matrix.md         # CRITICAL/HIGH/MEDIUM/LOW scoring
    incident-response/
      SKILL.md                     # 4-phase IR workflow
      references/runbooks/         # 10 category-specific runbooks
    correlation/
      SKILL.md                     # Cross-service correlation procedure
      references/
        services.md                # 6-service topology + dependency graph
        trace-flow.md              # W3C trace propagation paths
    billing-health/
      SKILL.md                     # Metering pipeline monitoring
      references/
        outbox-queries.md          # Outbox SQL queries
        usage-queries.md           # Per-org usage SQL
        anomaly-detection.md       # Spike/drop algorithm
        thresholds.md              # All threshold constants
    conventions/
      SKILL.md                     # 6 convention rules
      references/
        span-names.md              # 20 canonical OTel span names
        attributes.md              # 19 attribute keys with PII flags
        sampling.md                # Head + tail sampling config
    production-readiness/
      SKILL.md                     # Env var checklist + scoring
    alerting/
      SKILL.md                     # Alert rule templates + heuristics
  .claude-plugin/
    plugin.json                    # Claude Code manifest
  openclaw.plugin.json             # OpenClaw manifest
```

## Development

```bash
npm install
npm run typecheck          # tsc --noEmit
npm test                   # vitest run (63 tests)
npm run build              # tsup (CJS + ESM + DTS)
```

## Part of Lucid Skills

This package is part of the [lucid-skills](https://github.com/raijinlabs/lucid-skills) monorepo.

## License

MIT
