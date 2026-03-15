/**
 * risk_check — Portfolio-aware risk assessment before execution.
 *
 * Evaluates a proposed trade against:
 *   1. Portfolio concentration (don't put 80% in one asset)
 *   2. Daily exposure (don't exceed daily trading limits)
 *   3. Token safety (freeze authority, low liquidity, etc.)
 *   4. Slippage / price impact
 *   5. Stablecoin runway (keep enough for gas + safety margin)
 *
 * Output: structured RiskAssessment consumed by the Reason lane.
 */

import type {
  Chain,
  PortfolioState,
  RiskAssessment,
  RiskCheck,
  RouteCandidate,
  TokenSafety,
} from '@lucid-fdn/web3-types'
import { checkTokenSafety } from '../read/search-token.js'

export interface RiskCheckArgs {
  /** Current portfolio state */
  portfolio: PortfolioState
  /** What we're buying */
  outputToken: string
  /** What we're selling */
  inputToken: string
  /** Amount in USD */
  amountUsd: number
  /** Chain of the trade */
  chain: Chain
  /** Best route quote */
  route?: RouteCandidate
  /** Daily trades already executed (USD total) */
  dailyVolumeUsd?: number
  /** Daily limit from policy (USD) */
  dailyLimitUsd?: number
}

export async function evaluateRisk(args: RiskCheckArgs): Promise<RiskAssessment> {
  const checks: RiskCheck[] = []
  let level: RiskAssessment['level'] = 'low'

  // Run checks in parallel where possible
  const [tokenSafetyResult] = await Promise.all([
    checkTokenSafety(args.outputToken).catch((): TokenSafety => ({
      risk: 'unknown', flags: [], warnings: [],
    })),
  ])

  // ── 1. Balance check ───────────────────────────────────────────────
  const inputBalance = args.portfolio.balances.find(
    b => b.asset.symbol.toUpperCase() === args.inputToken.toUpperCase()
      || b.asset.address === args.inputToken,
  )
  const inputValueUsd = inputBalance?.valueUsd || 0
  checks.push({
    name: 'balance_sufficient',
    passed: inputValueUsd >= args.amountUsd,
    detail: inputValueUsd >= args.amountUsd
      ? `Have $${inputValueUsd.toFixed(2)} of ${args.inputToken}`
      : `Insufficient: have $${inputValueUsd.toFixed(2)}, need $${args.amountUsd.toFixed(2)}`,
  })
  if (inputValueUsd < args.amountUsd) level = 'critical'

  // ── 2. Concentration check ─────────────────────────────────────────
  const totalValue = args.portfolio.totalValueUsd
  let concentrationAfter: number | undefined
  if (totalValue > 0) {
    const existingOutputValue = args.portfolio.balances.find(
      b => b.asset.symbol.toUpperCase() === args.outputToken.toUpperCase()
        || b.asset.address === args.outputToken,
    )?.valueUsd || 0

    const newOutputValue = existingOutputValue + args.amountUsd
    concentrationAfter = (newOutputValue / totalValue) * 100

    checks.push({
      name: 'concentration',
      passed: concentrationAfter < 50,
      detail: concentrationAfter < 50
        ? `Post-trade concentration: ${concentrationAfter.toFixed(1)}% (OK)`
        : `High concentration: ${concentrationAfter.toFixed(1)}% of portfolio in ${args.outputToken}`,
    })
    if (concentrationAfter >= 80) level = bump(level, 'high')
    else if (concentrationAfter >= 50) level = bump(level, 'medium')
  }

  // ── 3. Token safety ────────────────────────────────────────────────
  checks.push({
    name: 'token_safety',
    passed: tokenSafetyResult.risk !== 'danger',
    detail: tokenSafetyResult.risk === 'safe'
      ? 'Token verified and safe'
      : tokenSafetyResult.risk === 'danger'
        ? `Dangerous: ${tokenSafetyResult.warnings.join('; ')}`
        : tokenSafetyResult.warnings.length > 0
          ? `Warnings: ${tokenSafetyResult.warnings.join('; ')}`
          : 'Token safety unknown',
  })
  if (tokenSafetyResult.risk === 'danger') level = bump(level, 'high')
  else if (tokenSafetyResult.risk === 'warning') level = bump(level, 'medium')

  // ── 4. Slippage / price impact ─────────────────────────────────────
  if (args.route) {
    const impactOk = args.route.priceImpactBps < 300 // 3%
    checks.push({
      name: 'price_impact',
      passed: impactOk,
      detail: impactOk
        ? `Price impact: ${(args.route.priceImpactBps / 100).toFixed(2)}% (OK)`
        : `High price impact: ${(args.route.priceImpactBps / 100).toFixed(2)}%`,
    })
    if (args.route.priceImpactBps >= 500) level = bump(level, 'high')
    else if (args.route.priceImpactBps >= 300) level = bump(level, 'medium')
  }

  // ── 5. Daily volume limit ──────────────────────────────────────────
  let dailyExposureAfter: number | undefined
  if (args.dailyLimitUsd && args.dailyLimitUsd > 0) {
    const currentDaily = args.dailyVolumeUsd || 0
    const afterDaily = currentDaily + args.amountUsd
    dailyExposureAfter = (afterDaily / args.dailyLimitUsd) * 100

    checks.push({
      name: 'daily_limit',
      passed: afterDaily <= args.dailyLimitUsd,
      detail: afterDaily <= args.dailyLimitUsd
        ? `Daily usage: $${afterDaily.toFixed(0)} / $${args.dailyLimitUsd.toFixed(0)} (${dailyExposureAfter.toFixed(0)}%)`
        : `Daily limit exceeded: $${afterDaily.toFixed(0)} > $${args.dailyLimitUsd.toFixed(0)}`,
    })
    if (afterDaily > args.dailyLimitUsd) level = bump(level, 'critical')
    else if (dailyExposureAfter > 80) level = bump(level, 'medium')
  }

  // ── 6. Stablecoin runway ───────────────────────────────────────────
  const STABLECOINS = new Set(['USDC', 'USDT', 'DAI', 'USDbC', 'BUSD'])
  const stablecoinTotal = args.portfolio.balances
    .filter(b => STABLECOINS.has(b.asset.symbol.toUpperCase()))
    .reduce((sum, b) => sum + (b.valueUsd || 0), 0)

  const isSellingStable = STABLECOINS.has(args.inputToken.toUpperCase())
  const stablecoinAfter = isSellingStable ? stablecoinTotal - args.amountUsd : stablecoinTotal

  checks.push({
    name: 'stablecoin_runway',
    passed: stablecoinAfter >= 10, // At least $10 for gas
    detail: stablecoinAfter >= 10
      ? `Stablecoin runway after trade: $${stablecoinAfter.toFixed(2)}`
      : `Low stablecoin runway after trade: $${stablecoinAfter.toFixed(2)} — may not cover gas`,
  })
  if (stablecoinAfter < 1) level = bump(level, 'high')
  else if (stablecoinAfter < 10) level = bump(level, 'medium')

  // ── 7. Trade size relative to portfolio ────────────────────────────
  if (totalValue > 0) {
    const tradePct = (args.amountUsd / totalValue) * 100
    checks.push({
      name: 'trade_size',
      passed: tradePct < 50,
      detail: tradePct < 50
        ? `Trade is ${tradePct.toFixed(1)}% of portfolio`
        : `Large trade: ${tradePct.toFixed(1)}% of portfolio`,
    })
    if (tradePct >= 75) level = bump(level, 'high')
    else if (tradePct >= 50) level = bump(level, 'medium')
  }

  return {
    level,
    checks,
    concentrationAfter,
    dailyExposureAfter,
    stablecoinRunway: stablecoinAfter,
  }
}

// ── Tool entry point ─────────────────────────────────────────────────

export interface RiskCheckToolArgs {
  /** Token being purchased (symbol or address) */
  outputToken: string
  /** Token being sold (symbol or address) */
  inputToken: string
  /** Trade amount in USD */
  amountUsd: number
  /** Chain */
  chain: Chain
  /** Price impact in basis points (from quote) */
  priceImpactBps?: number
}

/**
 * Standalone risk check tool — can be called independently.
 * For the full Reason lane, use evaluateRisk() directly with portfolio state.
 */
export async function toolRiskCheck(args: RiskCheckToolArgs): Promise<string> {
  // Minimal portfolio state for standalone check
  const mockPortfolio: PortfolioState = {
    wallet: '',
    chain: args.chain,
    balances: [],
    totalValueUsd: 0,
    timestamp: new Date().toISOString(),
  }

  const route: RouteCandidate | undefined = args.priceImpactBps !== undefined
    ? {
        provider: 'unknown',
        expectedOutput: '0',
        priceImpactBps: args.priceImpactBps,
        slippageBps: 100,
        feesUsd: 0,
        minimumOutput: '0',
        routePath: [],
      }
    : undefined

  const result = await evaluateRisk({
    portfolio: mockPortfolio,
    outputToken: args.outputToken,
    inputToken: args.inputToken,
    amountUsd: args.amountUsd,
    chain: args.chain,
    route,
  })

  return JSON.stringify({
    risk: result,
    recommendation: result.level === 'critical' ? 'abort'
      : result.level === 'high' ? 'review'
      : 'proceed',
    formatted: formatRiskReport(result),
  })
}

function formatRiskReport(risk: RiskAssessment): string {
  const icon = { low: 'OK', medium: 'CAUTION', high: 'WARNING', critical: 'BLOCKED' }
  const lines = [`Risk Level: ${icon[risk.level]} (${risk.level})`]
  for (const check of risk.checks) {
    lines.push(`  ${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`)
  }
  return lines.join('\n')
}

// ── Helpers ──────────────────────────────────────────────────────────

const RISK_ORDER: RiskAssessment['level'][] = ['low', 'medium', 'high', 'critical']

function bump(current: RiskAssessment['level'], proposed: RiskAssessment['level']): RiskAssessment['level'] {
  return RISK_ORDER.indexOf(proposed) > RISK_ORDER.indexOf(current) ? proposed : current
}
