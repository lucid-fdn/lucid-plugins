# Lucid Veille

Content monitoring, AI digest generation, and multi-platform publishing — available as an OpenClaw plugin or standalone MCP server. Works with Claude Desktop, ChatGPT, Cursor, VS Code, and any MCP-compatible client.

## Features

- **Multi-source monitoring**: RSS, Twitter/X, Reddit, Hacker News, web pages
- **AI-powered digests**: Daily and weekly digests with intelligent ranking
- **Content transformation**: Blog posts, X threads, LinkedIn posts, newsletters
- **Multi-platform publishing**: Ghost, WordPress, Twitter, LinkedIn, dev.to, Telegram, Slack, Discord
- **Scheduled automation**: Configurable cron-based fetch and digest schedules
- **Full-text search**: Search across all collected items
- **Dual entry points**: Use as an MCP server or OpenClaw plugin from the same package

## Usage

### As MCP Server (Claude Desktop, Cursor, ChatGPT, etc.)

Add to your MCP client config:

```json
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
```

### As OpenClaw Plugin

```bash
npm install @raijinlabs/veille
```

Or add to your OpenClaw workspace config.

## Configuration

### MCP Server (Environment Variables)

| Variable | Description | Default |
|----------|-------------|---------|
| `VEILLE_SUPABASE_URL` | Supabase project URL | (required) |
| `VEILLE_SUPABASE_KEY` | Supabase service role key | (required) |
| `VEILLE_TENANT_ID` | Tenant ID for data scoping | `default` |
| `VEILLE_FETCH_SCHEDULE` | Fetch cron schedule | `0 */6 * * *` |
| `VEILLE_DIGEST_SCHEDULE` | Daily digest cron schedule | `0 8 * * *` |
| `VEILLE_WEEKLY_DIGEST_SCHEDULE` | Weekly digest cron schedule | `0 9 * * 1` |

### OpenClaw Plugin

See `.env.example` for all available configuration options including Twitter, Ghost, WordPress, LinkedIn, dev.to, Telegram, Slack, and Discord credentials.

## Database Setup

Run the SQL migrations in order against your Supabase database:

```bash
# In Supabase SQL editor, run:
migrations/001_veille_mvp.sql
migrations/002_schema_evolution.sql
migrations/003_publish_log.sql
```

## Development

```bash
npm install
npm run typecheck    # Type checking
npm run lint         # Linting
npm run test         # Run tests
npm run test:coverage # Coverage report
npm run build        # Build for distribution
```

## Tools

Lucid Veille provides **10 tools** available on both MCP and OpenClaw entry points:

| Tool | Description |
|------|-------------|
| `veille_add_source` | Add a content source to monitor |
| `veille_list_sources` | List monitored sources |
| `veille_update_source` | Update source configuration |
| `veille_remove_source` | Remove a source |
| `veille_fetch_now` | Fetch content immediately |
| `veille_generate_digest` | Generate a daily or weekly digest |
| `veille_transform_content` | Transform digest into blog post, thread, etc. |
| `veille_publish` | Publish content to a platform |
| `veille_search` | Search collected items |
| `veille_status` | View system status |

## Architecture

Lucid Veille uses a single-package, dual entry point architecture:

```
src/
├── core/           All business logic (tools, fetchers, publishers, DB, etc.)
├── adapters/       Schema adapters (Zod for MCP, TypeBox for OpenClaw)
├── mcp.ts          MCP server entry point
├── openclaw.ts     OpenClaw plugin entry point
├── index.ts        Re-exports OpenClaw (backward compat)
└── bin.ts          CLI binary for npx
```

- **Fetcher registry**: Each source type implements the `Fetcher` interface
- **Publisher registry**: Each platform implements the `Publisher` interface
- **Content transformers**: Each output format implements `ContentTransformer`
- **Graceful degradation**: Unconfigured fetchers/publishers simply don't register
- **LLM via agent context**: Tools return prompts; the agent's LLM generates content

## License

MIT
