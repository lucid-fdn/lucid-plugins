# Architecture

## Dual Entry Point Design

Lucid Veille is a single npm package with two entry points:

1. **MCP Server** (`src/mcp.ts`): Standalone stdio-based MCP server for Claude Desktop, Cursor, ChatGPT, and other MCP-compatible clients. Launched via `npx @raijinlabs/veille`.
2. **OpenClaw Plugin** (`src/openclaw.ts`): Traditional OpenClaw plugin entry point via `register(api, config)`.

Both entry points share the same core business logic in `src/core/`. Schema adapters in `src/adapters/` convert between Zod (MCP) and TypeBox (OpenClaw) formats.

```
src/
├── core/               All business logic
│   ├── config/         Configuration schema, defaults, and loader
│   ├── content/        Content transformers (blog post, X thread, LinkedIn post, newsletter)
│   ├── commands/       OpenClaw slash command registrations
│   ├── db/             Supabase database layer (sources, items, digests, publish log)
│   ├── digest/         Digest generation (ranking, prompts, formatting)
│   ├── fetchers/       Source fetchers (RSS, Twitter, Reddit, HN, Web)
│   ├── publishers/     Platform publishers (Ghost, WordPress, Twitter, LinkedIn, dev.to, Telegram, Slack, Discord)
│   ├── services/       Background services (scheduler)
│   ├── tools/          Framework-agnostic tool definitions (10 tools)
│   ├── types/          TypeScript interfaces and type aliases
│   └── utils/          Shared utilities (logger, errors, retry, URL, text, date)
├── adapters/           Schema adapters (Zod for MCP, TypeBox for OpenClaw)
├── mcp.ts              MCP server entry point (stdio transport)
├── openclaw.ts         OpenClaw plugin entry point (register function)
├── index.ts            Re-exports OpenClaw plugin (backward compatibility)
└── bin.ts              CLI binary for npx invocation
```

## Default Architecture: Single-Tenant

The standard deployment model is **one user, one Supabase instance, one configuration**. The user provides their own Supabase URL and service role key. The plugin connects directly to their database and stores everything there.

```
User -> MCP Client or OpenClaw Agent -> Lucid Veille -> User's Supabase DB
```

There is no shared backend and no external service dependencies beyond the user's own Supabase project. The `tenantId` configuration option (default: `default`) is used internally for data scoping but does not imply multi-tenant infrastructure.

## Registry Pattern

Fetchers, publishers, and content transformers all follow the same registry pattern:

1. Each implementation is instantiated with its required configuration.
2. Each instance exposes an `isConfigured()` method that returns `true` only when all required credentials or settings are present.
3. A `create*Registry()` function iterates over all implementations and adds only the configured ones to a `Map` keyed by type.
4. At runtime, callers look up the registry by type key to find the appropriate handler.

This ensures **graceful degradation**: if Twitter credentials are not set, the Twitter fetcher and publisher simply do not register. The rest of the system continues to function normally.

### Fetcher Registry

```
Map<SourceType, Fetcher>
```

Source types: `rss`, `twitter`, `reddit`, `hackernews`, `web`.

Each fetcher implements:
- `sourceType` -- the source type key
- `name` -- human-readable name
- `isConfigured()` -- whether the fetcher has everything it needs
- `fetch(source)` -- fetch items from a source, returning `FetchResult`

All fetchers extend `BaseFetcher`, which provides rate limiting (via Bottleneck) and automatic retry logic.

### Publisher Registry

```
Map<PublishPlatform, Publisher>
```

Platforms: `ghost`, `wordpress`, `twitter`, `linkedin`, `devto`, `telegram`, `slack`, `discord`, `openclaw_channel`.

Each publisher implements:
- `platform` -- the platform key
- `name` -- human-readable name
- `isConfigured()` -- whether credentials are present
- `publish(input)` -- publish content, returning `PublishResult`

All publishers extend `BasePublisher`, which provides error handling and logging.

### Transformer Registry

```
Map<ContentFormat, ContentTransformer>
```

Formats: `blog_post`, `x_thread`, `linkedin_post`, `newsletter`.

Each transformer implements:
- `format` -- the content format key
- `name` -- human-readable name
- `buildPrompt(input)` -- build system and user prompts for the LLM

## Data Flow

The core pipeline follows this sequence:

```
Sources -> Fetch -> Items -> Rank -> Digest -> Transform -> Publish
```

### Step by step:

1. **Sources**: Users add content sources (RSS feeds, Twitter accounts, subreddits, etc.) which are stored in the `sources` table.

2. **Fetch**: The fetcher registry dispatches each source to its corresponding fetcher. Fetchers pull content and return normalized `ItemInsert` objects.

3. **Items**: Fetched items are deduplicated by `canonical_url` and stored in the `items` table.

4. **Rank**: When generating a digest, items are scored using a composite formula:
   - `score = 0.4 * relevance + 0.35 * trust + 0.25 * recency`
   - Recency uses exponential decay with a 3-day half-life.
   - Trust comes from the source's `trust_score` (0-100).
   - Relevance comes from the item's `relevance_score` (0-1), defaulting to 0.5.

5. **Digest**: The top-ranked items are formatted into system and user prompts. The LLM (provided by the MCP client or OpenClaw agent) generates the digest markdown. The result is stored alongside an HTML conversion.

6. **Transform**: A digest can be transformed into different content formats (blog post, X thread, LinkedIn post, newsletter). Each transformer builds format-specific prompts; the LLM generates the output.

7. **Publish**: Transformed content is dispatched to the appropriate publisher, which handles platform-specific API calls. Results are logged in the `publish_log` table.

## LLM Delegation Pattern

Lucid Veille does **not** call any LLM API directly. Instead:

- Tools build structured prompts (system prompt + user prompt) based on the data.
- These prompts are returned to the calling framework (MCP client or OpenClaw agent).
- The framework's configured LLM generates the content.
- The tool then processes the LLM output (e.g., storing the digest or publishing the result).

This means the system is LLM-agnostic and works with whatever model the client is configured to use.

## Database Schema

The system uses these tables in Supabase, scoped by `tenant_id`:

| Table | Purpose |
|-------|---------|
| `tenants` | Tenant identity and configuration |
| `sources` | Content source definitions (URL, type, trust score, fetch config) |
| `items` | Fetched content items (title, summary, URL, tags, scores) |
| `digests` | Generated digest records (markdown/HTML paths, metadata) |
| `publish_log` | Publication audit trail (platform, status, external URL) |

## Scheduler

The background scheduler uses `croner` to run three cron jobs:

1. **Fetch job** (`fetchCron`, default `0 */6 * * *`): Fetches all enabled sources.
2. **Daily digest** (`dailyDigestCron`, default `0 8 * * *`): Generates a daily digest from recent items.
3. **Weekly digest** (`weeklyDigestCron`, default `0 9 * * 1`): Generates a weekly digest every Monday.

In MCP mode, the scheduler is started automatically when the server launches. In OpenClaw mode, it is registered as an OpenClaw service, allowing the framework to manage its lifecycle.

## Tool Definition Pattern

Tools are defined as framework-agnostic factories in `src/core/tools/`. Each tool factory returns a `ToolDefinition` object containing:

- `name` -- tool identifier (e.g., `veille_add_source`)
- `description` -- human-readable description
- `parameters` -- plain object schema (converted to Zod or TypeBox by adapters)
- `execute(params, context)` -- the handler function

The `src/adapters/` layer converts these definitions into the format expected by each framework:
- **MCP adapter**: Converts parameter schemas to Zod and registers tools with the MCP SDK
- **OpenClaw adapter**: Converts parameter schemas to TypeBox and registers tools with the OpenClaw API
