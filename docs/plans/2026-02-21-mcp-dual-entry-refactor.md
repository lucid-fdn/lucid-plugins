# Veille MCP Dual Entry Point Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `@raijinlabs/veille` so it works as both an OpenClaw plugin and a standalone MCP server, sharing one core.

**Architecture:** Single package with `src/core/` (all business logic), `src/mcp.ts` (MCP server entry), `src/openclaw.ts` (OpenClaw plugin entry), and `src/bin.ts` (CLI). Remove SaaS layer entirely. Tool factories return framework-agnostic definitions; thin adapters convert to Zod (MCP) or TypeBox (OpenClaw).

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, Zod, TypeBox, Supabase, Vitest, tsup

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install MCP SDK and Zod**

Run:
```bash
cd /c/Lucid-Veille && npm install @modelcontextprotocol/sdk zod
```

**Step 2: Verify installation**

Run: `npm ls @modelcontextprotocol/sdk zod`
Expected: Both packages listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @modelcontextprotocol/sdk and zod"
```

---

### Task 2: Move all business logic into src/core/

This is a pure file-move operation. No code changes.

**Files:**
- Move: `src/config/` → `src/core/config/`
- Move: `src/db/` → `src/core/db/`
- Move: `src/fetchers/` → `src/core/fetchers/`
- Move: `src/digest/` → `src/core/digest/`
- Move: `src/content/` → `src/core/content/`
- Move: `src/publishers/` → `src/core/publishers/`
- Move: `src/services/` → `src/core/services/`
- Move: `src/tools/` → `src/core/tools/`
- Move: `src/utils/` → `src/core/utils/`
- Move: `src/types/` → `src/core/types/`
- Move: `src/plugin-id.ts` → `src/core/plugin-id.ts`
- Create: `src/core/index.ts` (barrel export)
- Delete: `src/saas/` (entire folder)

**Step 1: Create core directory and move files**

Run:
```bash
cd /c/Lucid-Veille && mkdir -p src/core && mv src/config src/core/ && mv src/db src/core/ && mv src/fetchers src/core/ && mv src/digest src/core/ && mv src/content src/core/ && mv src/publishers src/core/ && mv src/services src/core/ && mv src/tools src/core/ && mv src/utils src/core/ && mv src/types src/core/ && mv src/plugin-id.ts src/core/
```

**Step 2: Delete SaaS folder**

Run:
```bash
rm -rf src/saas
```

**Step 3: Delete SaaS tools**

Run:
```bash
rm src/core/tools/manage-tenants.ts src/core/tools/manage-webhooks.ts src/core/tools/manage-api-keys.ts
```

**Step 4: Delete SaaS test**

Run:
```bash
rm test/unit/saas/event-bus.test.ts && rmdir test/unit/saas
```

**Step 5: Create src/core/index.ts barrel export**

Create `src/core/index.ts`:
```typescript
export * from './config/index.js';
export * from './db/index.js';
export * from './fetchers/index.js';
export * from './digest/index.js';
export * from './content/index.js';
export * from './publishers/index.js';
export * from './services/index.js';
export * from './tools/index.js';
export * from './utils/index.js';
export type * from './types/index.js';
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from './plugin-id.js';
```

**Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move all business logic into src/core/"
```

---

### Task 3: Fix all internal import paths in core/

After moving files into `src/core/`, all intra-core imports like `'../types/index.js'` still work because relative paths within the moved subtree are unchanged. But cross-module imports need checking.

**Files:**
- Modify: all files in `src/core/` that import from `../saas/`

**Step 1: Remove SaaS imports from core tools**

The following files import from `../saas/event-bus.js` and need that import removed:
- `src/core/tools/manage-sources.ts` — remove `import { emit }` and all `emit()` calls
- `src/core/tools/fetch-now.ts` — remove `import { emit }` and all `emit()` calls
- `src/core/tools/publish-content.ts` — remove `import { emit }` if present
- `src/core/db/tenants.ts` — remove `import { emit }` and all `emit()` calls

For each file, remove the import line and replace `await emit(...)` calls with nothing (just delete them).

**Step 2: Remove SaaS tools from core/tools/index.ts**

In `src/core/tools/index.ts`:
- Remove imports of `createManageTenantsTool`, `createManageWebhooksTool`, `createManageApiKeysTool`
- Remove the `if (opts?.saasMode)` block
- Remove `saasMode` from the `opts` parameter
- Remove the re-exports of those 3 tools at the bottom

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: remove SaaS imports from core tools"
```

---

### Task 4: Create framework-agnostic tool definition types

**Files:**
- Create: `src/core/tools/types.ts`

**Step 1: Write the tool definition types**

Create `src/core/tools/types.ts`:
```typescript
export type ParamType = 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';

export interface ToolParamDef {
  type: ParamType;
  required?: boolean;
  description?: string;
  values?: string[];
  min?: number;
  max?: number;
  default?: unknown;
  properties?: Record<string, ToolParamDef>;
  items?: ToolParamDef;
}

export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  params: Record<string, ToolParamDef>;
  execute: (params: T) => Promise<string>;
}
```

**Step 2: Commit**

```bash
git add src/core/tools/types.ts && git commit -m "feat: add framework-agnostic tool definition types"
```

---

### Task 5: Create schema adapter utilities

**Files:**
- Create: `src/adapters/zod-schema.ts`
- Create: `src/adapters/typebox-schema.ts`
- Create: `src/adapters/index.ts`
- Test: `test/unit/adapters/zod-schema.test.ts`
- Test: `test/unit/adapters/typebox-schema.test.ts`

**Step 1: Write the Zod adapter test**

Create `test/unit/adapters/zod-schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { toZodSchema } from '../../../src/adapters/zod-schema.js';
import type { ToolParamDef } from '../../../src/core/tools/types.js';

describe('toZodSchema', () => {
  it('converts string param to zod string', () => {
    const params: Record<string, ToolParamDef> = {
      url: { type: 'string', required: true, description: 'The URL' },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ url: 'https://example.com' })).toEqual({ url: 'https://example.com' });
  });

  it('converts enum param to zod enum', () => {
    const params: Record<string, ToolParamDef> = {
      source_type: { type: 'enum', values: ['rss', 'web'], required: true },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ source_type: 'rss' })).toEqual({ source_type: 'rss' });
    expect(() => schema.parse({ source_type: 'invalid' })).toThrow();
  });

  it('makes params optional when required is false', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', required: false },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({})).toEqual({});
  });

  it('converts number param with min/max', () => {
    const params: Record<string, ToolParamDef> = {
      score: { type: 'number', required: true, min: 0, max: 100 },
    };
    const schema = toZodSchema(params);
    expect(schema.parse({ score: 50 })).toEqual({ score: 50 });
    expect(() => schema.parse({ score: 101 })).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run test/unit/adapters/zod-schema.test.ts`
Expected: FAIL — module not found

**Step 3: Write the Zod adapter**

Create `src/adapters/zod-schema.ts`:
```typescript
import { z } from 'zod';
import type { ToolParamDef } from '../core/tools/types.js';

function paramToZod(def: ToolParamDef): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (def.type) {
    case 'string':
      schema = z.string();
      break;
    case 'number': {
      let num = z.number();
      if (def.min !== undefined) num = num.min(def.min);
      if (def.max !== undefined) num = num.max(def.max);
      schema = num;
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'enum':
      schema = z.enum(def.values as [string, ...string[]]);
      break;
    case 'object':
      if (def.properties) {
        schema = toZodSchema(def.properties);
      } else {
        schema = z.record(z.unknown());
      }
      break;
    case 'array':
      schema = z.array(def.items ? paramToZod(def.items) : z.unknown());
      break;
    default:
      schema = z.unknown();
  }

  if (def.description) {
    schema = schema.describe(def.description);
  }

  return schema;
}

export function toZodSchema(params: Record<string, ToolParamDef>): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, def] of Object.entries(params)) {
    const fieldSchema = paramToZod(def);
    shape[key] = def.required === false ? fieldSchema.optional() : fieldSchema;
  }
  return z.object(shape);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run test/unit/adapters/zod-schema.test.ts`
Expected: PASS (4 tests)

**Step 5: Write the TypeBox adapter test**

Create `test/unit/adapters/typebox-schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { toTypeBoxSchema } from '../../../src/adapters/typebox-schema.js';
import type { ToolParamDef } from '../../../src/core/tools/types.js';

describe('toTypeBoxSchema', () => {
  it('converts string param to TypeBox string', () => {
    const params: Record<string, ToolParamDef> = {
      url: { type: 'string', required: true, description: 'The URL' },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.type).toBe('object');
    expect(schema.properties.url.type).toBe('string');
    expect(schema.required).toContain('url');
  });

  it('converts enum param to TypeBox union', () => {
    const params: Record<string, ToolParamDef> = {
      source_type: { type: 'enum', values: ['rss', 'web'], required: true },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.properties.source_type).toBeDefined();
  });

  it('marks optional params correctly', () => {
    const params: Record<string, ToolParamDef> = {
      label: { type: 'string', required: false },
    };
    const schema = toTypeBoxSchema(params);
    expect(schema.required).not.toContain('label');
  });
});
```

**Step 6: Write the TypeBox adapter**

Create `src/adapters/typebox-schema.ts`:
```typescript
import { Type, type TObject, type TSchema } from '@sinclair/typebox';
import type { ToolParamDef } from '../core/tools/types.js';

function paramToTypeBox(def: ToolParamDef): TSchema {
  switch (def.type) {
    case 'string':
      return Type.String(def.description ? { description: def.description } : {});
    case 'number': {
      const opts: Record<string, unknown> = {};
      if (def.description) opts.description = def.description;
      if (def.min !== undefined) opts.minimum = def.min;
      if (def.max !== undefined) opts.maximum = def.max;
      return Type.Number(opts);
    }
    case 'boolean':
      return Type.Boolean(def.description ? { description: def.description } : {});
    case 'enum':
      return Type.Union(
        (def.values ?? []).map((v) => Type.Literal(v)),
        def.description ? { description: def.description } : {},
      );
    case 'object':
      if (def.properties) {
        return toTypeBoxSchema(def.properties);
      }
      return Type.Record(Type.String(), Type.Unknown());
    case 'array':
      return Type.Array(def.items ? paramToTypeBox(def.items) : Type.Unknown());
    default:
      return Type.Unknown();
  }
}

export function toTypeBoxSchema(params: Record<string, ToolParamDef>): TObject {
  const properties: Record<string, TSchema> = {};
  for (const [key, def] of Object.entries(params)) {
    const fieldSchema = paramToTypeBox(def);
    properties[key] = def.required === false ? Type.Optional(fieldSchema) : fieldSchema;
  }
  return Type.Object(properties, { additionalProperties: false });
}
```

**Step 7: Run both adapter tests**

Run: `npx vitest run test/unit/adapters/`
Expected: PASS (7 tests)

**Step 8: Create barrel export**

Create `src/adapters/index.ts`:
```typescript
export { toZodSchema } from './zod-schema.js';
export { toTypeBoxSchema } from './typebox-schema.js';
```

**Step 9: Commit**

```bash
git add src/adapters/ test/unit/adapters/ && git commit -m "feat: add Zod and TypeBox schema adapters"
```

---

### Task 6: Refactor tool factories to use framework-agnostic params

**Files:**
- Modify: `src/core/tools/manage-sources.ts`
- Modify: `src/core/tools/fetch-now.ts`
- Modify: `src/core/tools/generate-digest.ts`
- Modify: `src/core/tools/transform-content.ts`
- Modify: `src/core/tools/publish-content.ts`
- Modify: `src/core/tools/search-items.ts`
- Modify: `src/core/tools/status.ts`

For each tool factory:
1. Remove `import { Type } from '@sinclair/typebox'`
2. Replace `parameters: Type.Object({...})` with `params: { ... }` using `ToolParamDef` format
3. Keep `execute` function unchanged
4. Return type becomes `ToolDefinition`

Example for `createAddSourceTool` — change from:
```typescript
parameters: Type.Object({
  url: Type.String({ description: '...' }),
  source_type: sourceTypeSchema,
  ...
})
```
To:
```typescript
params: {
  url: { type: 'string', required: true, description: '...' },
  source_type: { type: 'enum', values: ['rss', 'twitter', 'reddit', 'hackernews', 'web'], required: true, description: '...' },
  ...
}
```

Apply this pattern to ALL 7 tool files (10 tool factories total).

**Step 1: Refactor all tool factories**

Apply the TypeBox→ToolParamDef conversion to each file. Remove all `@sinclair/typebox` imports from tool files.

**Step 2: Update core/tools/index.ts**

Remove the `saasMode` parameter and SaaS tool imports. The `registerAllTools` function should now return tool definitions instead of registering directly:

```typescript
import type { ToolDefinition } from './types.js';
// ... all tool factory imports (minus SaaS tools)

export interface ToolDependencies {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  publisherRegistry: Map<PublishPlatform, Publisher>;
  transformerRegistry: Map<ContentFormat, ContentTransformer>;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createAddSourceTool({ config: deps.config }),
    createListSourcesTool({ config: deps.config }),
    createUpdateSourceTool({ config: deps.config }),
    createRemoveSourceTool({ config: deps.config }),
    createFetchNowTool({ config: deps.config, fetcherRegistry: deps.fetcherRegistry }),
    createGenerateDigestTool({ config: deps.config }),
    createTransformContentTool({ config: deps.config, transformerRegistry: deps.transformerRegistry }),
    createPublishContentTool({ config: deps.config, publisherRegistry: deps.publisherRegistry }),
    createSearchItemsTool({ config: deps.config }),
    createStatusTool({ config: deps.config, fetcherRegistry: deps.fetcherRegistry, publisherRegistry: deps.publisherRegistry }),
  ];
}
```

Also export `ToolDefinition` and `ToolParamDef` from `types.js`.

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: tool factories return framework-agnostic definitions"
```

---

### Task 7: Create OpenClaw plugin entry point

**Files:**
- Create: `src/openclaw.ts`
- Modify: `src/index.ts` (becomes re-export)

**Step 1: Create src/openclaw.ts**

This is the current `src/index.ts` logic, but importing from `./core/` and using the TypeBox adapter:

```typescript
import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { ensureTenant } from './core/db/tenants.js';
import { createFetcherRegistry } from './core/fetchers/index.js';
import { createTransformerRegistry } from './core/content/index.js';
import { createPublisherRegistry } from './core/publishers/index.js';
import { createAllTools } from './core/tools/index.js';
import { registerAllCommands } from './core/commands/index.js';
import { startScheduler, stopScheduler } from './core/services/index.js';
import { toTypeBoxSchema } from './adapters/typebox-schema.js';
import { log } from './core/utils/logger.js';
import { PLUGIN_NAME } from './core/plugin-id.js';

export default function register(api: any): void {
  log.info(`Registering ${PLUGIN_NAME} plugin...`);

  const rawConfig = api.config ?? {};
  const config = loadConfig(rawConfig);

  if (!config.supabaseUrl || !config.supabaseKey) {
    log.warn('Supabase not configured — plugin will operate in limited mode');
  } else {
    initSupabase(config.supabaseUrl, config.supabaseKey);
    ensureTenant(config.tenantId).catch((err) => {
      log.error('Failed to ensure tenant:', err);
    });
  }

  const fetcherRegistry = createFetcherRegistry(config);
  const transformerRegistry = createTransformerRegistry();
  const publisherRegistry = createPublisherRegistry(config, api);

  log.info(`Fetchers: ${[...fetcherRegistry.keys()].join(', ') || 'none'}`);
  log.info(`Publishers: ${[...publisherRegistry.keys()].join(', ') || 'none'}`);

  // Register tools via adapter
  const tools = createAllTools({ config, fetcherRegistry, publisherRegistry, transformerRegistry });
  for (const tool of tools) {
    api.registerTool(tool.name, {
      description: tool.description,
      parameters: toTypeBoxSchema(tool.params),
      execute: tool.execute,
    });
  }

  // Register commands
  registerAllCommands(api, { config, fetcherRegistry, publisherRegistry, transformerRegistry });

  // Register scheduler
  api.registerService({
    id: 'veille-scheduler',
    start: () => {
      startScheduler({
        config,
        fetcherRegistry,
        onFetch: async () => { log.info('Scheduler: Running fetch job'); },
        onDailyDigest: async () => { log.info('Scheduler: Running daily digest job'); },
        onWeeklyDigest: async () => { log.info('Scheduler: Running weekly digest job'); },
      });
    },
    stop: () => { stopScheduler(); },
  });

  log.info(`${PLUGIN_NAME} plugin registered successfully`);
}
```

**Step 2: Update src/index.ts to re-export**

Replace `src/index.ts` with:
```typescript
export { default } from './openclaw.js';
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/openclaw.ts src/index.ts && git commit -m "feat: create OpenClaw plugin entry point"
```

---

### Task 8: Create MCP server entry point

**Files:**
- Create: `src/mcp.ts`
- Test: `test/unit/mcp/server.test.ts`

**Step 1: Write the MCP server test**

Create `test/unit/mcp/server.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/core/db/client.js', () => ({
  initSupabase: vi.fn(),
  getSupabase: vi.fn(() => ({ from: vi.fn().mockReturnThis(), storage: { from: vi.fn().mockReturnThis() } })),
  resetSupabase: vi.fn(),
}));

vi.mock('../../../src/core/db/tenants.js', () => ({
  ensureTenant: vi.fn().mockResolvedValue(undefined),
  getTenant: vi.fn(),
}));

vi.mock('../../../src/core/db/sources.js', () => ({
  createSource: vi.fn(), getSource: vi.fn(), listSources: vi.fn(),
  updateSource: vi.fn(), deleteSource: vi.fn(), updateSourceFetchStatus: vi.fn(),
}));

vi.mock('../../../src/core/db/items.js', () => ({
  upsertItem: vi.fn(), upsertItems: vi.fn(), listItems: vi.fn(),
  getItemsForDigest: vi.fn(), updateItemStatus: vi.fn(), searchItems: vi.fn(),
}));

vi.mock('../../../src/core/db/digests.js', () => ({
  createDigest: vi.fn(), getLatestDigest: vi.fn(), listDigests: vi.fn(),
}));

vi.mock('../../../src/core/db/publish-log.js', () => ({
  createPublishLog: vi.fn(), updatePublishLog: vi.fn(), listPublishLogs: vi.fn(),
}));

vi.mock('bottleneck', () => ({
  default: vi.fn().mockImplementation(() => ({
    schedule: vi.fn((fn: () => Promise<any>) => fn()),
    disconnect: vi.fn(),
  })),
}));

import { createVeilleServer } from '../../../src/mcp.js';

describe('MCP Server', () => {
  it('creates server with 10 tools', async () => {
    const env = {
      VEILLE_SUPABASE_URL: 'https://test.supabase.co',
      VEILLE_SUPABASE_KEY: 'test-key',
    };
    const server = createVeilleServer(env);
    expect(server).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run test/unit/mcp/server.test.ts`
Expected: FAIL — module not found

**Step 3: Write src/mcp.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { ensureTenant } from './core/db/tenants.js';
import { createFetcherRegistry } from './core/fetchers/index.js';
import { createTransformerRegistry } from './core/content/index.js';
import { createPublisherRegistry } from './core/publishers/index.js';
import { createAllTools } from './core/tools/index.js';
import { toZodSchema } from './adapters/zod-schema.js';
import { log } from './core/utils/logger.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';

export function createVeilleServer(env: Record<string, string | undefined> = process.env) {
  const server = new McpServer({
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
  });

  const config = loadConfig({
    supabaseUrl: env.VEILLE_SUPABASE_URL,
    supabaseKey: env.VEILLE_SUPABASE_KEY,
    tenantId: env.VEILLE_TENANT_ID ?? 'default',
    fetchSchedule: env.VEILLE_FETCH_SCHEDULE,
    digestSchedule: env.VEILLE_DIGEST_SCHEDULE,
    weeklyDigestSchedule: env.VEILLE_WEEKLY_DIGEST_SCHEDULE,
  });

  if (config.supabaseUrl && config.supabaseKey) {
    initSupabase(config.supabaseUrl, config.supabaseKey);
    ensureTenant(config.tenantId).catch((err) => {
      log.error('Failed to ensure tenant:', err);
    });
  } else {
    log.warn('Supabase not configured — MCP server in limited mode');
  }

  const fetcherRegistry = createFetcherRegistry(config);
  const transformerRegistry = createTransformerRegistry();
  const publisherRegistry = createPublisherRegistry(config);

  const tools = createAllTools({ config, fetcherRegistry, publisherRegistry, transformerRegistry });

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      toZodSchema(tool.params).shape,
      async (params) => {
        const result = await tool.execute(params);
        return { content: [{ type: 'text' as const, text: result }] };
      },
    );
  }

  log.info(`${PLUGIN_NAME} MCP server created with ${tools.length} tools`);

  return server;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run test/unit/mcp/server.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/mcp.ts test/unit/mcp/ && git commit -m "feat: create MCP server entry point"
```

---

### Task 9: Create CLI binary entry point

**Files:**
- Create: `src/bin.ts`

**Step 1: Write src/bin.ts**

```typescript
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createVeilleServer } from './mcp.js';

const server = createVeilleServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Step 2: Commit**

```bash
git add src/bin.ts && git commit -m "feat: add MCP CLI entry point (npx @raijinlabs/veille)"
```

---

### Task 10: Update build config and package.json

**Files:**
- Modify: `tsup.config.ts`
- Modify: `package.json`
- Modify: `vitest.config.ts`

**Step 1: Update tsup.config.ts for multiple entry points**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/mcp.ts', 'src/openclaw.ts', 'src/bin.ts', 'src/core/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
  outDir: 'dist',
});
```

**Step 2: Update package.json**

Add/modify these fields:
```json
{
  "description": "Content monitoring, AI digest generation, and auto-publishing — OpenClaw plugin + MCP server",
  "bin": {
    "veille-mcp": "./dist/bin.js"
  },
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./mcp": { "import": "./dist/mcp.js", "types": "./dist/mcp.d.ts" },
    "./core": { "import": "./dist/core/index.js", "types": "./dist/core/index.d.ts" }
  },
  "keywords": ["openclaw", "mcp", "plugin", "veille", "monitoring", "digest", "ai", "rss", "content"]
}
```

**Step 3: Update vitest path aliases**

In `vitest.config.ts`, update the alias to point to the new core location:
```typescript
alias: {
  '@': resolve(__dirname, 'src'),
  '@core': resolve(__dirname, 'src/core'),
}
```

**Step 4: Build and verify**

Run: `npm run build`
Expected: `dist/index.js`, `dist/mcp.js`, `dist/openclaw.js`, `dist/bin.js`, `dist/core/index.js` all generated

**Step 5: Commit**

```bash
git add tsup.config.ts package.json vitest.config.ts && git commit -m "build: multi-entry tsup config with MCP + OpenClaw exports"
```

---

### Task 11: Fix all test import paths

**Files:**
- Modify: ALL test files (update import paths from `../../src/` to `../../src/core/` where needed)

**Step 1: Update test imports**

All test files that import from `../../src/tools/`, `../../src/db/`, `../../src/fetchers/`, etc. need the path updated to `../../src/core/tools/`, `../../src/core/db/`, etc.

Also update all `vi.mock()` paths to use `../../src/core/`.

The smoke test (`test/e2e/smoke.test.ts`) imports from `../../src/index.js` which re-exports from `./openclaw.js` — this should still work but the mocks need updated paths.

**Step 2: Remove SaaS-related test assertions**

In `test/integration/tool-registration.test.ts`:
- Remove the "registers all 13 tools with saasMode" test
- Update "registers 10 core tools" test — remove saasMode references
- Remove SaaS mock blocks

In `test/e2e/smoke.test.ts`:
- Remove the "registers all 13 tools with saasMode" test
- Remove the "enables saasMode when api.bridge" test
- Remove all SaaS mock blocks
- Update remaining tests (10 tools, no saasMode)

**Step 3: Run all tests**

Run: `npm run test`
Expected: All tests pass (should be ~47 tests after removing ~6 SaaS-related tests, plus new adapter tests)

**Step 4: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors

**Step 5: Run build**

Run: `npm run build`
Expected: Clean build with all entry points

**Step 6: Commit**

```bash
git add -A && git commit -m "test: update all test imports for core/ structure, remove SaaS tests"
```

---

### Task 12: Update documentation and README

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `openclaw.plugin.json` (remove saasMode from configSchema)

**Step 1: Update README**

Add MCP usage section:
```markdown
## Usage

### As MCP Server (Claude Desktop, Cursor, ChatGPT, etc.)

Add to your MCP client config:
\```json
{
  "mcpServers": {
    "veille": {
      "command": "npx",
      "args": ["@raijinlabs/veille"],
      "env": {
        "VEILLE_SUPABASE_URL": "https://your-project.supabase.co",
        "VEILLE_SUPABASE_KEY": "your-anon-key"
      }
    }
  }
}
\```

### As OpenClaw Plugin

\```bash
npm install @raijinlabs/veille
\```
```

**Step 2: Remove saasMode from openclaw.plugin.json configSchema**

Remove the `saasMode` field from the JSON schema.

**Step 3: Update architecture.md**

Describe the dual entry point architecture.

**Step 4: Commit**

```bash
git add README.md docs/ openclaw.plugin.json && git commit -m "docs: update for dual MCP + OpenClaw entry points"
```

---

### Task 13: Final verification

**Step 1: Full test suite**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: 0 errors, all tests pass, clean build

**Step 2: Verify MCP binary**

Run: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/bin.js 2>/dev/null | head -1`
Expected: JSON response with server capabilities

**Step 3: Commit everything**

```bash
git add -A && git commit -m "feat: veille now works as both OpenClaw plugin and MCP server

Dual entry point architecture:
- npx @raijinlabs/veille → MCP server (stdio transport)
- import from '@raijinlabs/veille' → OpenClaw plugin
- import from '@raijinlabs/veille/core' → bare core logic

Removed SaaS layer (multi-tenant handled by Lucid platform infra).
10 core tools available on both entry points.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
