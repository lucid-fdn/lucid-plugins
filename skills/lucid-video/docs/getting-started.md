# Getting Started with lucid-video

## Prerequisites

- Node.js >= 18
- A running Remotion rendering engine (see [Rendering Engine Setup](#rendering-engine))
- (Optional) Supabase project for template/render persistence

## Installation

```bash
# In the lucid-skills monorepo
cd skills/lucid-video
npm install

# Standalone
npm install @raijinlabs/video
```

## Running the MCP Server

```bash
# Direct
VIDEO_ENGINE_URL=http://localhost:4030 npx @raijinlabs/video

# With Claude Code config
# Add to .claude/mcp.json — see README
```

## Your First Render

Once the MCP server is running, an AI agent can:

1. **List available templates:**
   ```
   list_templates(category: "marketing")
   ```

2. **Preview before rendering:**
   ```
   preview_thumbnail(
     template_id: "social-clip-v1",
     scenes: '[{"type":"title","duration":3,"props":{"text":"Launch Day!"}}]',
     format: "mp4",
     resolution: "reel"
   )
   ```

3. **Render the video:**
   ```
   render_video(
     template_id: "social-clip-v1",
     scenes: '[...]',
     format: "mp4",
     resolution: "reel",
     priority: "burst"
   )
   ```

4. **Check progress:**
   ```
   get_render_status(render_id: "r_abc123")
   ```

## Rendering Engine

The plugin does NOT include Remotion rendering — it calls a rendering engine API over HTTP. You need to deploy a rendering engine separately. The engine is a Fastify service on Railway that runs Remotion's bundler and renderer.

See [Deployment Guide](deployment.md) for complete engine setup and deployment instructions across all 3 layers.

## Development

```bash
npm run build        # Build with tsup
npm run test         # Run tests with vitest
npm run typecheck    # TypeScript check
npm run lint         # Prettier check
```
