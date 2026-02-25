# lucid-video

Agent-native video generation using [Remotion](https://remotion.dev). Generate marketing content, data reports, and personalized outreach videos through AI agents via MCP tools.

## Features

- **5 MCP tools**: `render_video`, `list_templates`, `get_render_status`, `preview_thumbnail`, `cancel_render`
- **VideoBrief protocol**: Standardized schema for cross-plugin video generation
- **Hybrid rendering**: Lambda (burst, ~2min) + Railway (standard, ~5min)
- **3 skill domains**: Social content, data reports, personalized outreach
- **Dual adapter**: MCP (Claude Code) + OpenClaw

## Quick Start

### As MCP Server (Claude Code)

```json
{
  "mcpServers": {
    "lucid-video": {
      "command": "npx",
      "args": ["@raijinlabs/video"],
      "env": {
        "VIDEO_ENGINE_URL": "https://your-engine.railway.app",
        "VIDEO_ENGINE_API_KEY": "your-key"
      }
    }
  }
}
```

### As OpenClaw Plugin

```bash
npm install @raijinlabs/video
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `render_video` | Submit a VideoBrief for rendering. Returns render_id for tracking. |
| `list_templates` | Browse available templates, optionally filtered by category. |
| `get_render_status` | Poll render progress. Returns status, progress %, and video URL when done. |
| `preview_thumbnail` | Render frame 0 only (<3s) to preview before full render. |
| `cancel_render` | Cancel a running render job. |

## VideoBrief Schema

```typescript
{
  template_id: string;        // Which template to use
  scenes: Scene[];            // Ordered scenes with type, duration, props
  brand?: Brand;              // Colors, fonts, logo
  audio?: Audio;              // Background track, voiceover
  output: Output;             // Format, resolution, fps
  data_bindings?: object;     // Data from other plugins
  priority?: 'burst' | 'standard';
}
```

See [VideoBrief Reference](docs/video-brief-reference.md) for full schema docs.

## Cross-Plugin Integration

Other Lucid plugins can generate videos by emitting a VideoBrief:

| Plugin | Use Case | Brief Type |
|--------|----------|-----------|
| lucid-metrics | Weekly KPI video | metrics-weekly-v1 |
| lucid-prospect | Personalized sales video | personalized-outreach-v1 |
| lucid-hype | Social content clips | social-clip-v1 |
| lucid-veille | News digest video | news-digest-v1 |
| lucid-compete | Competitor update video | competitor-update-v1 |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VIDEO_ENGINE_URL` | Yes | URL of the Remotion rendering engine |
| `VIDEO_ENGINE_API_KEY` | No | API key for engine authentication |
| `VIDEO_SUPABASE_URL` | No | Supabase URL for template/render storage |
| `VIDEO_SUPABASE_KEY` | No | Supabase service key |
| `VIDEO_TENANT_ID` | No | Tenant ID (default: "default") |
| `VIDEO_DEFAULT_PRIORITY` | No | Default render priority (default: "standard") |
| `VIDEO_DEFAULT_FORMAT` | No | Default output format (default: "mp4") |
| `VIDEO_DEFAULT_RESOLUTION` | No | Default output resolution (default: "1080p") |

## Architecture

```
Agent → MCP Tool → Engine Client → Rendering Engine (Railway)
                                     ├── Lambda (burst renders)
                                     └── Local (standard renders)
```

## License

MIT
