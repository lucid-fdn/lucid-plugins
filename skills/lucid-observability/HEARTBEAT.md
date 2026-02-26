# Heartbeat Checks

Autonomous monitoring checks to run periodically. These checks use the brain tools (lucid_triage, lucid_diagnose, lucid_readiness, lucid_outbox_health) combined with the official Sentry MCP and Supabase MCP servers for data retrieval.

## Check 1: Outbox Health

**Data retrieval**: Supabase MCP `execute_sql`

Run the outbox health query from [skills/billing-health/references/outbox-queries.md](skills/billing-health/references/outbox-queries.md):

```sql
SELECT
  COUNT(*) FILTER (WHERE sent_at IS NULL AND attempts < 10) AS pending,
  COUNT(*) FILTER (WHERE sent_at IS NOT NULL) AS sent,
  COUNT(*) FILTER (WHERE attempts >= 10) AS dead_letter,
  COUNT(*) FILTER (WHERE lease_until IS NOT NULL AND lease_until > now()) AS leased,
  COUNT(*) AS total
FROM openmeter_event_ledger
WHERE created_at > now() - interval '24 hours'
```

**Analysis**: Pass the query results to the `lucid_outbox_health` brain tool for threshold analysis. It will detect queue backup, dead letters, stuck leases, and zero throughput automatically.

**Action**: If `lucid_outbox_health` returns `isHealthy: false`, follow [billing-health skill](skills/billing-health/SKILL.md) for diagnosis and recovery.

## Check 2: Error Spike Detection

**Data retrieval**: Sentry MCP `list_issues`

Query: `is:unresolved`, sort by `freq`, limit 10, for each project:
- `lucid-web`
- `lucid-worker`
- `lucid-l2`
- `lucid-trustgate`
- `lucid-mcpgate`
- `javascript-nextjs`

**Analysis**: For each issue with `count > 100`, any `fatal` level issue, or any issue flagged `isRegression: true`, run the `lucid_triage` brain tool with the issue's title, level, count, userCount, and lastSeen. The brain tool will return severity, category, temporal pattern, and a recommendation.

**Action**: If any triaged issue returns severity `critical` or `high`, follow [incident-response skill](skills/incident-response/SKILL.md).

## Check 3: Config Health

**Analysis**: Run the `lucid_readiness` brain tool with the current environment variables. It validates 9 variables (SENTRY_DSN, SENTRY_AUTH_TOKEN, OTEL_ENABLED, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_HASH_SALT, OPENMETER_ENABLED, OPENMETER_API_KEY, DATABASE_URL, LUCID_ENV) and returns a score with pass/warn/fail per variable.

**Action**: If `lucid_readiness` returns `isReady: false` or any `criticalFailures`, follow [production-readiness skill](skills/production-readiness/SKILL.md) for full audit.

## Check 4: Diagnosis

If any alerts were triggered in Checks 1-3:
1. For Sentry issues not yet triaged: run `lucid_diagnose` with the error title, culprit, and stack trace to classify against 12 known diagnosis patterns
2. Severity is already scored by `lucid_triage` from Check 2
3. If CRITICAL or HIGH: follow [incident-response skill](skills/incident-response/SKILL.md)
4. Report findings with severity, category, temporal pattern, confidence, and recommended next steps
