# @raijinlabs/lucid-skills-embedded

All 18 Lucid Skills MCP server factories bundled for in-process embedding via InMemoryTransport. Zero network overhead — tool calls execute in ~1-5ms.

## Install

```bash
npm install @raijinlabs/lucid-skills-embedded @modelcontextprotocol/sdk
```

## Quick Start

```ts
import {
  EmbeddedRegistry,
  createTradeServer,
  createPredictServer,
} from '@raijinlabs/lucid-skills-embedded'

// 1. Create registry
const registry = new EmbeddedRegistry()

// 2. Register servers
registry.register(createTradeServer(), 'trade')
registry.register(createPredictServer(), 'predict')

// 3. Call tools (client connects lazily on first call)
const result = await registry.callTool('trade', 'analyze_market', {
  symbol: 'BTC',
})
console.log(result.content) // [{ type: 'text', text: '...' }]

// 4. Clean up when done
await registry.closeAll()
```

## Available Servers

| Factory | Slug | Domain |
|---------|------|--------|
| `createAuditServer()` | audit | Smart contract security |
| `createBridgeServer()` | bridge | Startup ops (Notion/Linear/Slack) |
| `createCompeteServer()` | compete | Competitive intelligence |
| `createFeedbackServer()` | feedback | Customer feedback / NPS |
| `createHypeServer()` | hype | Growth hacking / social |
| `createInvoiceServer()` | invoice | Billing / revenue |
| `createMeetServer()` | meet | Meeting intelligence |
| `createMetricsServer()` | metrics | Product analytics |
| `createObservabilityServer()` | observability | Production monitoring |
| `createPredictServer()` | predict | Prediction markets |
| `createProposeServer()` | propose | RFP / proposal engine |
| `createProspectServer()` | prospect | Sales prospecting |
| `createQuantumServer()` | quantum | Bitcoin quantum search |
| `createRecruitServer()` | recruit | ATS / hiring pipeline |
| `createSeoServer()` | seo | SEO intelligence |
| `createTaxServer()` | tax | Crypto tax compliance |
| `createTradeServer()` | trade | Crypto trading |
| `createVeilleServer()` | veille | Content monitoring |
| `createVideoServer()` | video | Video generation |

## API

### `EmbeddedRegistry`

```ts
class EmbeddedRegistry {
  register(server: McpServer, name: string): void
  has(name: string): boolean
  size: number
  list(): Array<{ name: string; connected: boolean; connectedAt?: number }>
  callTool(server: string, tool: string, args?: Record<string, unknown>):
    Promise<{ content: unknown[]; isError: boolean }>
  closeAll(): Promise<void>
}
```

## How It Works

Each `createXxxServer()` returns a bare `McpServer` from `@modelcontextprotocol/sdk`. The `EmbeddedRegistry` connects to it via `InMemoryTransport` — an in-process pipe with no serialization overhead. The MCP client is created lazily on the first tool call and reused for subsequent calls.

## License

MIT
