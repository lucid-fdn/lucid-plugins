# Publishing

Publishers are responsible for sending transformed content to external platforms. Each publisher implements the `Publisher` interface and extends `BasePublisher`.

## Common Behavior

All publishers share the following characteristics via `BasePublisher`:

- **Graceful registration**: Only publishers with complete credentials are added to the registry.
- **Error handling**: Publish failures are caught and returned as `PublishResult` with `success: false` rather than throwing exceptions.
- **Audit logging**: Each publish operation can be logged in the `publish_log` table with platform, status, external URL, and error details.

### PublishInput

```typescript
interface PublishInput {
  content: string;                    // The content to publish
  title: string;                      // Title for the publication
  format: ContentFormat;              // Content format (blog_post, x_thread, etc.)
  metadata?: Record<string, unknown>; // Optional extra metadata
}
```

### PublishResult

```typescript
interface PublishResult {
  success: boolean;          // Whether the publish succeeded
  platform: PublishPlatform; // Which platform was targeted
  externalUrl?: string;      // URL of the published content (if available)
  error?: string;            // Error message (if failed)
}
```

---

## Ghost CMS

**Platform**: `ghost`
**Required credentials**: `ghostUrl`, `ghostAdminApiKey`

### Behavior

- Creates published posts via the Ghost Admin API v5.0 using the `@tryghost/admin-api` library.
- Content is sent as HTML.
- Posts are created with `status: 'published'` (immediately visible).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `blog_post` | Yes | Primary use case |
| `newsletter` | Yes | Works well as a Ghost post |
| `x_thread` | Partial | Thread formatting may not render ideally |
| `linkedin_post` | Partial | Short-form content may seem sparse |

### Credential Format

The Ghost Admin API key has the format `{id}:{secret}` where both parts are hex strings. Generate this from Ghost Admin > Settings > Integrations.

### Limitations

- Does not support image uploads in the current implementation.
- Posts are created as standalone entries (no series or tag assignment via the tool).

---

## WordPress

**Platform**: `wordpress`
**Required credentials**: `wordpressUrl`, `wordpressUsername`, `wordpressPassword`

### Behavior

- Creates published posts via the WordPress REST API v2 (`/wp-json/wp/v2/posts`).
- Uses HTTP Basic authentication with application passwords.
- Content is sent as HTML in the `content` field.
- Posts are created with `status: 'publish'` (immediately visible).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `blog_post` | Yes | Primary use case |
| `newsletter` | Yes | Works well as a WordPress post |
| `x_thread` | Partial | Thread formatting renders as plain text |
| `linkedin_post` | Partial | Short-form content |

### Credential Format

Use WordPress application passwords (Settings > Users > Application Passwords). The password format is `xxxx xxxx xxxx xxxx` (space-separated groups).

### Limitations

- Does not assign categories, tags, or featured images.
- Requires the WordPress REST API to be enabled and accessible.
- Basic authentication must be enabled (default in WordPress 5.6+).

---

## Twitter / X

**Platform**: `twitter`
**Required credentials**: `twitterApiKey`, `twitterApiSecret`, `twitterAccessToken`, `twitterAccessSecret`

### Behavior

- Posts tweets and threads via the Twitter API v2 using the `twitter-api-v2` library.
- For `x_thread` format: splits content on numbered markers (e.g., `1/ ...`, `2/ ...`) and posts as a reply chain.
- For other formats: posts a single tweet, truncated to 280 characters.
- Each tweet in a thread is individually truncated to 280 characters.

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `x_thread` | Yes | Primary use case; posts as a threaded reply chain |
| `blog_post` | Minimal | Truncated to 280 chars; use for link sharing only |
| `linkedin_post` | Minimal | Truncated to 280 chars |
| `newsletter` | Minimal | Truncated to 280 chars |

### Thread Format

Threads should be formatted with numbered prefixes:

```
1/ First tweet of the thread...

2/ Second tweet continues the discussion...

3/ Final tweet with a conclusion.
```

### Limitations

- Twitter API v2 rate limits apply (tweet creation: 200 per 15 minutes for app-level).
- Media attachments are not supported in the current implementation.
- The four OAuth 1.0a credentials are all required for write access.

---

## LinkedIn

**Platform**: `linkedin`
**Required credentials**: `linkedinAccessToken`

### Behavior

- Creates text posts via the LinkedIn UGC API.
- Automatically fetches the authenticated user's profile URN.
- Content is formatted as `{title}\n\n{content}` and truncated to 1300 characters.
- Posts are set to public visibility.

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `linkedin_post` | Yes | Primary use case |
| `blog_post` | Partial | Truncated to 1300 chars |
| `newsletter` | Partial | Truncated to 1300 chars |
| `x_thread` | Partial | Thread formatting lost; truncated |

### Credential Format

Requires an OAuth 2.0 access token with `w_member_social` scope. Tokens typically expire after 60 days and need to be refreshed.

### Limitations

- Maximum post length is 1300 characters.
- Does not support images, articles, or rich media attachments.
- The LinkedIn UGC API does not return a direct URL to the created post; a best-effort feed URL is returned.
- Access tokens expire and must be manually refreshed.

---

## dev.to

**Platform**: `devto`
**Required credentials**: `devtoApiKey`

### Behavior

- Creates published articles via the dev.to REST API.
- Content is sent as Markdown in the `body_markdown` field.
- Articles are created with `published: true` (immediately visible).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `blog_post` | Yes | Primary use case; Markdown renders natively |
| `newsletter` | Yes | Works well as a dev.to article |
| `x_thread` | Partial | Thread formatting renders as plain text |
| `linkedin_post` | Partial | Short-form but functional |

### Credential Format

Generate an API key from dev.to Settings > Extensions > DEV Community API Keys.

### Limitations

- Does not support tags, series, cover images, or canonical URL assignment via the tool.
- Rate limits apply per dev.to's API guidelines.

---

## Telegram

**Platform**: `telegram`
**Required credentials**: `telegramBotToken`, `telegramChatId`

### Behavior

- Sends messages via the Telegram Bot API (`/sendMessage` endpoint).
- Content is formatted as `*{title}*\n\n{content}` with Markdown parse mode.
- Messages are truncated to 4096 characters (Telegram's limit).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `newsletter` | Yes | Works well for channel updates |
| `blog_post` | Partial | Truncated to 4096 chars; loses rich formatting |
| `linkedin_post` | Yes | Short-form fits well |
| `x_thread` | Partial | Thread markers visible but functional |

### Credential Format

- **Bot token**: Created via @BotFather (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
- **Chat ID**: The numeric ID of the target chat, group, or channel (e.g., `-1001234567890` for groups/channels)

### Limitations

- Maximum message length is 4096 characters.
- Uses Markdown v1 parse mode (limited formatting support).
- Does not support media attachments, buttons, or inline keyboards.
- The external URL returned is a best-effort link using the chat ID and message ID.

---

## Slack

**Platform**: `slack`
**Required credentials**: `slackWebhookUrl`

### Behavior

- Sends messages via Slack incoming webhooks.
- Content is formatted as `*{title}*\n\n{content}` using Slack's mrkdwn syntax.
- No message length limit is enforced by the plugin (Slack's webhook limit is approximately 40,000 characters).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `newsletter` | Yes | Works well for channel notifications |
| `blog_post` | Yes | Full content renders in Slack |
| `linkedin_post` | Yes | Short-form fits well |
| `x_thread` | Partial | Thread formatting visible but no threading |

### Credential Format

Create an incoming webhook from Slack Apps > Incoming Webhooks. The URL format is:
`https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX`

### Limitations

- No external URL is returned (webhooks are fire-and-forget).
- Does not support Slack Block Kit formatting.
- Messages appear as the webhook bot user, not as a specific user.

---

## Discord

**Platform**: `discord`
**Required credentials**: `discordWebhookUrl`

### Behavior

- Sends messages via Discord webhooks.
- Content is formatted as `**{title}**\n\n{content}` using Discord's markdown syntax.
- Messages are truncated to 2000 characters (Discord's limit).

### Content Format Compatibility

| Format | Supported | Notes |
|--------|-----------|-------|
| `newsletter` | Partial | Truncated to 2000 chars |
| `blog_post` | Partial | Truncated to 2000 chars |
| `linkedin_post` | Yes | Short-form fits well |
| `x_thread` | Partial | Truncated; thread formatting visible |

### Credential Format

Create a webhook from Discord Server Settings > Integrations > Webhooks. The URL format is:
`https://discord.com/api/webhooks/123456789/abcdefghijklmnop`

### Limitations

- Maximum message length is 2000 characters.
- No external URL is returned (webhooks are fire-and-forget).
- Does not support embeds, attachments, or rich formatting beyond basic markdown.
- Messages appear as the webhook bot, not as a specific user.

---

## OpenClaw Channel

**Platform**: `openclaw_channel`
**Required**: OpenClaw API with `registerChannel` support

### Behavior

- Publishes content through the OpenClaw internal channel system.
- If the API supports `sendMessage`, sends structured content with title, content, format, and metadata.
- Falls back to a local-only stub that logs the publication.

### Limitations

- Depends on the OpenClaw channel API being available.
- No external URL is returned.
- This publisher is primarily for internal agent-to-agent communication.
