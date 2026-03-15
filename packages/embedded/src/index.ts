/**
 * Embedded Skills Bundle
 *
 * Re-exports all lucid-skills MCP server factory functions for in-process
 * embedding via InMemoryTransport. Each factory creates a bare McpServer
 * that can be connected to any MCP transport.
 *
 * Usage:
 *   import { createTradeServer } from '@lucid-fdn/skills-embedded'
 *   const server = createTradeServer()
 *   // Connect via InMemoryTransport for in-process execution
 */

export const VERSION = '1.4.0'

// Registry for managing embedded MCP servers
export { EmbeddedRegistry } from './registry.js'

export { createAuditServer } from '@lucid-fdn/audit'
export { createBridgeServer } from '@lucid-fdn/bridge'
export { createCompeteServer } from '@lucid-fdn/compete'
export { createFeedbackServer } from '@lucid-fdn/feedback'
export { createHypeServer } from '@lucid-fdn/hype'
export { createInvoiceServer } from '@lucid-fdn/invoice'
export { createMeetServer } from '@lucid-fdn/meet'
export { createMetricsServer } from '@lucid-fdn/metrics'
export { createObservabilityServer } from '@lucid-fdn/observability'
export { createPredictServer } from '@lucid-fdn/predict'
export { createProposeServer } from '@lucid-fdn/propose'
export { createProspectServer } from '@lucid-fdn/prospect'
export { createQuantumServer } from '@lucid-fdn/quantum'
export { createRecruitServer } from '@lucid-fdn/recruit'
export { createSeoServer } from '@lucid-fdn/seo'
export { createTaxServer } from '@lucid-fdn/tax'
export { createTradeServer } from '@lucid-fdn/trade'
export { createVeilleServer } from '@lucid-fdn/veille'
export { createVideoServer } from '@lucid-fdn/video'
