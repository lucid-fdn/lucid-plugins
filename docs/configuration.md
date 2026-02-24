# Configuration Reference

Lucid Veille configuration can be provided through three mechanisms, listed in order of precedence:

1. **OpenClaw plugin config** -- passed via `api.config` in the `register()` function
2. **Environment variables** -- read from `process.env`
3. **Built-in defaults** -- hardcoded fallback values

## Required Settings

Only two settings are required. Point the plugin at your own Supabase instance and you're ready to go:

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `supabaseUrl` | `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `supabaseKey` | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key for server-side access |

## Core Settings

| Setting | Env Variable | Default | Description |
|---------|-------------|---------|-------------|
| `supabaseUrl` | `SUPABASE_URL` | _(required)_ | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `supabaseKey` | `SUPABASE_SERVICE_ROLE_KEY` | _(required)_ | Supabase service role key for server-side access |
| `tenantId` | `VEILLE_TENANT_ID` | `personal` | Tenant identifier for data scoping |
| `timezone` | -- | `Europe/Paris` | Timezone for schedule evaluation and digest dating |
| `language` | -- | `fr` | Language for generated digests (ISO 639-1 code) |

## Schedule Settings

All schedule settings use standard cron syntax (`minute hour day-of-month month day-of-week`).

| Setting | Default | Description |
|---------|---------|-------------|
| `fetchCron` | `0 6 * * *` | When to fetch all enabled sources (daily at 06:00) |
| `dailyDigestCron` | `0 8 * * *` | When to generate the daily digest (daily at 08:00) |
| `weeklyDigestCron` | `0 9 * * 1` | When to generate the weekly digest (Mondays at 09:00) |

## Digest Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autoPublish` | `false` | Automatically publish digests after generation |
| `digestTrustThreshold` | `30` | Minimum source trust score (0-100) for item inclusion in digests |
| `digestMaxItems` | `50` | Maximum number of items to include per digest |

## Twitter / X Settings

Used for both fetching tweets and publishing to Twitter.

| Setting | Env Variable | Required For | Description |
|---------|-------------|-------------|-------------|
| `twitterBearerToken` | `TWITTER_BEARER_TOKEN` | Fetching | Bearer token for Twitter API v2 read access |
| `twitterApiKey` | `TWITTER_API_KEY` | Publishing | OAuth 1.0a consumer API key |
| `twitterApiSecret` | `TWITTER_API_SECRET` | Publishing | OAuth 1.0a consumer API secret |
| `twitterAccessToken` | `TWITTER_ACCESS_TOKEN` | Publishing | OAuth 1.0a access token |
| `twitterAccessSecret` | `TWITTER_ACCESS_SECRET` | Publishing | OAuth 1.0a access token secret |

**Note**: The bearer token is used for read-only search operations (fetching). The four OAuth credentials are required for write operations (publishing tweets and threads).

## Ghost CMS Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `ghostUrl` | `GHOST_URL` | Ghost site URL (e.g., `https://your-blog.ghost.io`) |
| `ghostAdminApiKey` | `GHOST_ADMIN_API_KEY` | Ghost Admin API key (format: `id:secret`) |

Both settings are required for the Ghost publisher to register.

## WordPress Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `wordpressUrl` | `WORDPRESS_URL` | WordPress site URL |
| `wordpressUsername` | `WORDPRESS_USERNAME` | WordPress username with publishing permissions |
| `wordpressPassword` | `WORDPRESS_PASSWORD` | WordPress application password |

All three settings are required for the WordPress publisher to register. Uses the WordPress REST API v2 with Basic authentication.

## LinkedIn Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `linkedinAccessToken` | `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 access token with `w_member_social` scope |

The access token is required for the LinkedIn publisher to register. Posts are created via the LinkedIn UGC API.

## dev.to Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `devtoApiKey` | `DEVTO_API_KEY` | dev.to API key (from Settings > Extensions > DEV Community API Keys) |

The API key is required for the dev.to publisher to register. Articles are created as published by default.

## Telegram Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `telegramBotToken` | `TELEGRAM_BOT_TOKEN` | Telegram Bot API token (from @BotFather) |
| `telegramChatId` | `TELEGRAM_CHAT_ID` | Target chat, group, or channel ID |

Both settings are required for the Telegram publisher to register. Messages are sent with Markdown formatting. Maximum message length is 4096 characters.

## Slack Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `slackWebhookUrl` | `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |

The webhook URL is required for the Slack publisher to register. Messages use Slack's mrkdwn formatting.

## Discord Settings

| Setting | Env Variable | Description |
|---------|-------------|-------------|
| `discordWebhookUrl` | `DISCORD_WEBHOOK_URL` | Discord webhook URL |

The webhook URL is required for the Discord publisher to register. Messages use Discord's markdown formatting. Maximum message length is 2000 characters.

## Example .env File

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional: tenant
VEILLE_TENANT_ID=personal

# Optional: Twitter (fetching)
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAA...

# Optional: Twitter (publishing)
TWITTER_API_KEY=abc123
TWITTER_API_SECRET=def456
TWITTER_ACCESS_TOKEN=789-ghi
TWITTER_ACCESS_SECRET=jkl012

# Optional: Ghost CMS
GHOST_URL=https://your-blog.ghost.io
GHOST_ADMIN_API_KEY=64chars:hexstring

# Optional: WordPress
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=xxxx xxxx xxxx xxxx

# Optional: LinkedIn
LINKEDIN_ACCESS_TOKEN=AQVh...

# Optional: dev.to
DEVTO_API_KEY=abc123def456

# Optional: Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890

# Optional: Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX

# Optional: Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefg

# SaaS Mode (opt-in, for platforms like LucidMerged)
# VEILLE_SAAS_MODE=false
```

---

## SaaS Mode Configuration

The settings below only apply when SaaS mode is enabled. Set `saasMode: true` in the plugin config or `VEILLE_SAAS_MODE=true` in the environment to activate these features.

| Setting | Env Variable | Default | Description |
|---------|-------------|---------|-------------|
| `saasMode` | `VEILLE_SAAS_MODE` | `false` | Enable multi-tenant SaaS features (webhooks, API keys, bridge). Default: false |
| `tenantId` | `VEILLE_TENANT_ID` | `personal` | Tenant identifier for multi-tenant isolation |

When `saasMode` is `false` (the default), the `tenantId` is still used internally for data scoping but multi-tenant features (dynamic tenant resolution, webhooks, API keys, and the bridge interface) are disabled.

### SaaS Bridge Settings

The SaaS bridge is configured programmatically when calling `register()`. It is not set via environment variables.

```typescript
register(api, {
  saasMode: true,
  bridge: {
    resolveTenantId: async (ctx) => ctx.userId,
    onEvent: async (event) => { /* handle events */ },
    getAgentCapabilities: () => [/* additional tools */],
    getStorageAdapter: () => myStorageAdapter,
  },
});
```

### Bridge Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `resolveTenantId` | Yes | Async function that maps a context object to a tenant ID |
| `onEvent` | No | Async callback that receives all plugin events |
| `getAgentCapabilities` | No | Returns additional agent tools to inject |
| `getStorageAdapter` | No | Returns a custom storage adapter (e.g., S3, GCS) |

### Webhook Configuration

Webhook subscriptions are managed at runtime via the `veille_manage_webhooks` tool (not via environment variables). Each subscription includes:

- **URL**: The endpoint to POST events to
- **Events**: Which event types to deliver
- **Secret**: Optional HMAC shared secret for signature verification

### API Key Configuration

API keys are managed at runtime via the `veille_manage_api_keys` tool (not via environment variables). Each key includes:

- **Label**: Human-readable identifier
- **Scopes**: Permission scopes (empty means all permissions)
- **Expiration**: Optional expiration date

## Graceful Degradation

The plugin is designed to work with partial configuration:

- If Supabase is not configured, the plugin operates in **limited mode** (no persistence).
- If a fetcher's credentials are missing, that source type is simply unavailable.
- If a publisher's credentials are missing, that platform is simply unavailable.
- If `saasMode` is `false` (the default), no webhook delivery, bridge events, or SaaS tools are registered.
- The `register()` function logs which fetchers and publishers are active at startup.
