/**
 * Embedded Skills Bundle
 *
 * Re-exports all lucid-skills MCP server factory functions for in-process
 * embedding via InMemoryTransport. Each factory creates a bare McpServer
 * that can be connected to any MCP transport.
 *
 * Usage:
 *   import { createTradeServer } from '@raijinlabs/lucid-skills-embedded'
 *   const server = createTradeServer()
 *   // Connect via InMemoryTransport for in-process execution
 */

export const VERSION = '1.4.0'

// Registry for managing embedded MCP servers
export { EmbeddedRegistry } from './registry.js'

export { createAuditServer } from '@raijinlabs/audit'
export { createBridgeServer } from '@raijinlabs/bridge'
export { createCompeteServer } from '@raijinlabs/compete'
export { createFeedbackServer } from '@raijinlabs/feedback'
export { createHypeServer } from '@raijinlabs/hype'
export { createInvoiceServer } from '@raijinlabs/invoice'
export { createMeetServer } from '@raijinlabs/meet'
export { createMetricsServer } from '@raijinlabs/metrics'
export { createObservabilityServer } from '@raijinlabs/observability'
export { createPredictServer } from '@raijinlabs/predict'
export { createProposeServer } from '@raijinlabs/propose'
export { createProspectServer } from '@raijinlabs/prospect'
export { createQuantumServer } from '@raijinlabs/quantum'
export { createRecruitServer } from '@raijinlabs/recruit'
export { createSeoServer } from '@raijinlabs/seo'
export { createTaxServer } from '@raijinlabs/tax'
export { createTradeServer } from '@raijinlabs/trade'
export { createVeilleServer } from '@raijinlabs/veille'
export { createVideoServer } from '@raijinlabs/video'
