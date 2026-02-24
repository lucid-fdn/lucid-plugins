# Veille MCP Dual Entry Point Refactor

**Date:** 2026-02-21
**Status:** Approved
**Author:** RaijinLabs

## Goal

Refactor `@raijinlabs/veille` so it works as both an OpenClaw plugin AND a standalone MCP server, with a shared core. Any AI client (Claude Desktop, ChatGPT, Cursor, OpenClaw) can use veille tools.

## Architecture: Single Package, Dual Entry Points

```
src/
├── core/                          All business logic
│   ├── config/                    (schema, defaults, loader)
│   ├── db/                        (client, sources, items, digests, publish-log, tenants)
│   ├── fetchers/                  (base, rss, twitter, reddit, hackernews, web, rate-limiter)
│   ├── digest/                    (ranker, formatter, prompts, daily, weekly)
│   ├── content/                   (base, blog-post, x-thread, linkedin-post, newsletter, prompts)
│   ├── publishers/                (base, ghost, wordpress, twitter, linkedin, devto, telegram, slack, discord, openclaw-channel)
│   ├── services/                  (veille-scheduler)
│   ├── tools/                     (manage-sources, fetch-now, generate-digest, transform-content, publish-content, search-items, status)
│   ├── utils/                     (errors, logger, retry, url, text, date)
│   ├── types/                     (all type definitions)
│   └── index.ts                   barrel export
│
├── mcp.ts                         MCP server entry point
├── openclaw.ts                    OpenClaw plugin entry point
├── index.ts                       Re-exports openclaw default (backward compat)
├── bin.ts                         CLI entry for npx
└── adapters/
    ├── zod-schema.ts              Converts tool params to Zod schemas
    └── typebox-schema.ts          Converts tool params to TypeBox schemas
```

## Tool Definition Pattern

Tools return framework-agnostic definitions. Adapters convert to Zod (MCP) or TypeBox (OpenClaw).

```typescript
// core/tools/types.ts
interface ToolParamDef {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  required?: boolean;
  description?: string;
  values?: string[];           // for enum
  min?: number; max?: number;  // for number
  properties?: Record<string, ToolParamDef>; // for object
}

interface ToolDefinition {
  name: string;
  description: string;
  params: Record<string, ToolParamDef>;
  execute: (params: any) => Promise<string>;
}
```

## Entry Points

### MCP (src/mcp.ts)
- Creates `McpServer` from `@modelcontextprotocol/sdk`
- Iterates all tool factories from core, converts params to Zod via adapter
- Wraps execute to return `{ content: [{ type: 'text', text: result }] }`
- Exports `createServer()` for programmatic use

### OpenClaw (src/openclaw.ts)
- Same as current `index.ts` but imports from `./core/`
- Converts params to TypeBox via adapter
- Registers tools, commands, services via `api`

### CLI (src/bin.ts)
- `npx @raijinlabs/veille` starts stdio transport (default)
- `npx @raijinlabs/veille --http --port 3001` starts Streamable HTTP
- Reads config from env vars

## Package.json Exports

```json
{
  "bin": { "veille-mcp": "./dist/bin.js" },
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./mcp": { "import": "./dist/mcp.js", "types": "./dist/mcp.d.ts" },
    "./core": { "import": "./dist/core/index.js", "types": "./dist/core/index.d.ts" }
  }
}
```

## Config

MCP mode reads from environment variables only:
- `VEILLE_SUPABASE_URL`
- `VEILLE_SUPABASE_KEY`
- `VEILLE_TENANT_ID` (default: "default")
- `VEILLE_FETCH_SCHEDULE` (default: "0 */6 * * *")
- `VEILLE_DIGEST_SCHEDULE` (default: "0 8 * * *")
- `VEILLE_WEEKLY_DIGEST_SCHEDULE` (default: "0 9 * * 1")

OpenClaw mode reads from plugin config object + env vars (unchanged).

## Removals

- `src/saas/` entire folder (event-bus, webhooks, api-keys, bridge-registry, types)
- `src/tools/manage-tenants.ts`
- `src/tools/manage-webhooks.ts`
- `src/tools/manage-api-keys.ts`
- `saasMode` config option
- Related tests (~8 tests)

Multi-tenancy is handled by Lucid platform infrastructure (TrustGate + Passport), not the plugin.

## New Dependencies

- `@modelcontextprotocol/sdk` (MCP server SDK)
- `zod` (MCP schema validation)

## Kept Dependencies

- `@sinclair/typebox` (still used in OpenClaw adapter)
- All existing deps (supabase, rss-parser, bottleneck, croner, marked, etc.)

## Final Tool Count

10 core tools (unchanged):
1. `veille_add_source`
2. `veille_list_sources`
3. `veille_update_source`
4. `veille_remove_source`
5. `veille_fetch_now`
6. `veille_generate_digest`
7. `veille_transform_content`
8. `veille_publish`
9. `veille_search`
10. `veille_status`

## Test Strategy

- Existing unit/integration tests: update import paths from `../src/` to `../src/core/`
- Remove SaaS-specific tests
- Add MCP-specific tests:
  - Server starts and exposes 10 tools
  - Tool calls return correct MCP content format
  - stdio transport works end-to-end
  - Zod schema adapter produces valid schemas
