# Deployment Guide

Complete guide for deploying all 3 layers of the lucid-video system.

## Layer 1: Plugin (lucid-skills)

The MCP plugin is distributed via npm as `@raijinlabs/video`.

```bash
npm publish  # from skills/lucid-video/
```

For Claude Code users, add to MCP config (`.claude/mcp.json`):
```json
{
  "mcpServers": {
    "lucid-video": {
      "command": "npx",
      "args": ["@raijinlabs/video"],
      "env": {
        "VIDEO_ENGINE_URL": "https://video-engine.your-domain.railway.app",
        "VIDEO_ENGINE_API_KEY": "your-api-key"
      }
    }
  }
}
```

The `npx @raijinlabs/video` command invokes the `video-mcp` binary (`dist/bin.js`), which starts an MCP server over stdio.

**Optional env vars for the plugin:**
- `VIDEO_SUPABASE_URL` / `VIDEO_SUPABASE_KEY` -- Direct Supabase access for template/render storage
- `VIDEO_TENANT_ID` -- Tenant identifier (default: "default")
- `VIDEO_DEFAULT_PRIORITY` -- Default render priority: "burst" or "standard" (default: "standard")
- `VIDEO_DEFAULT_FORMAT` -- Default output format: "mp4", "webm", or "gif" (default: "mp4")
- `VIDEO_DEFAULT_RESOLUTION` -- Default resolution: "1080p", "720p", "square", "story", or "reel" (default: "1080p")

## Layer 2: Rendering Engine (Railway)

Deploy `Dockerfile.video-engine` from `lucid-plateform-core` to Railway.

**Required env vars:**
- `DATABASE_URL` -- PostgreSQL connection string (same Supabase project as the gateway: `lucid-gateway`)
- `PORT` -- Railway assigns automatically

**Optional env vars:**
- `AWS_REGION` -- AWS region for Lambda rendering (default: us-east-1)
- `AWS_LAMBDA_FUNCTION_NAME` -- Set to any truthy value to enable Lambda burst routing
- `REMOTION_LAMBDA_FUNCTION` -- Lambda function name passed to Remotion SDK
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` -- AWS credentials for Lambda
- `SENTRY_DSN` -- Error tracking
- `VIDEO_ENGINE_SEED_KEYS` -- Bootstrap API keys (format: `name:key,name:key`)

**Run migrations** before first deploy:
```sql
-- Run in order against the lucid-gateway database:
-- migrations/012_video_templates.sql
-- migrations/013_video_renders.sql
-- migrations/014_video_quotas.sql
```

Or via the monorepo migration runner:
```bash
npm run migrate  # from lucid-plateform-core root
```

## Layer 3: Control Plane (Vercel)

The video dashboard deploys automatically with LucidMerged. The routes are:

| Next.js Route | Engine Proxy Target |
|---|---|
| `POST /api/video/renders` | `POST /v1/render` |
| `GET /api/video/renders/[id]` | `GET /v1/render/:id` |
| `POST /api/video/renders/[id]/cancel` | `POST /v1/render/:id/cancel` |
| `GET /api/video/templates` | `GET /v1/templates` |
| `GET /api/video/templates/[id]` | `GET /v1/templates/:id` |

**Add env vars to Vercel:**
- `VIDEO_ENGINE_URL` -- URL of the Railway video-engine service (e.g., `https://video-engine.your-domain.railway.app`)
- `VIDEO_ENGINE_API_KEY` -- API key for the engine

The Video Studio entry in workspace navigation is at `/{workspace-slug}/video` (configured in `src/config/workspace-nav.ts`).

## End-to-End Verification

1. **Deploy video-engine** to Railway with `DATABASE_URL` configured
2. **Run migrations** 012-014 against the lucid-gateway database
3. **Test engine health:**
   ```bash
   curl https://your-engine.railway.app/health
   ```
4. **Seed an API key** via `VIDEO_ENGINE_SEED_KEYS=test:sk_test_123` or create one in the database
5. **Test templates endpoint:**
   ```bash
   curl -H "Authorization: Bearer sk_test_123" \
     https://your-engine.railway.app/v1/templates
   ```
6. **Add env vars to Vercel** (`VIDEO_ENGINE_URL`, `VIDEO_ENGINE_API_KEY`) and redeploy
7. **Verify dashboard:** navigate to `/{workspace}/video` in the app
8. **Configure MCP plugin** with the engine URL and API key
9. **Test agent workflow:**
   ```
   list_templates → render_video → get_render_status
   ```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `503 Database not available` | `DATABASE_URL` not set or unreachable | Verify connection string and network access |
| `401 Unauthorized` | Missing or invalid API key | Check `Authorization: Bearer` header; seed keys with `VIDEO_ENGINE_SEED_KEYS` |
| Burst renders always use Railway | `AWS_LAMBDA_FUNCTION_NAME` not set | Set env var to enable Lambda routing |
| Lambda renders fail | Missing `REMOTION_LAMBDA_FUNCTION` or AWS creds | Set all three: function name, access key ID, secret key |
| Thumbnail returns placeholder | Frame-0 rendering not yet implemented | Expected in current version; full rendering is implemented |
