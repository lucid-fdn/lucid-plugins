# Tools Reference

Lucid Veille registers **10 core tools** by default with the OpenClaw agent framework. When `saasMode: true` is enabled, **3 additional SaaS tools** are also registered, for a total of 13. Each tool is invocable by the agent in response to user prompts.

---

# Core Tools (10)

These tools are always available.

---

## veille_add_source

Add a new content source to monitor.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL of the content source |
| `source_type` | string | Yes | One of: `rss`, `twitter`, `reddit`, `hackernews`, `web` |
| `label` | string | No | Human-readable label for the source |
| `trust_score` | number | No | Trust score from 0-100 (default: 50) |
| `enabled` | boolean | No | Whether the source is active (default: true) |
| `fetch_config` | object | No | Source-type-specific configuration |

### Example Usage

```
"Add https://feeds.arstechnica.com/arstechnica/index as an RSS source labeled 'Ars Technica' with trust score 85"
```

```
"Add https://www.reddit.com/r/MachineLearning as a Reddit source with trust score 70"
```

---

## veille_list_sources

List all monitored content sources for the current tenant.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled_only` | boolean | No | Filter to only enabled sources (default: false) |
| `source_type` | string | No | Filter by source type |

### Example Usage

```
"Show me all my sources"
```

```
"List only my enabled RSS sources"
```

---

## veille_update_source

Update the configuration of an existing source.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_id` | number | Yes | ID of the source to update |
| `url` | string | No | New URL |
| `label` | string | No | New label |
| `trust_score` | number | No | New trust score (0-100) |
| `enabled` | boolean | No | Enable or disable the source |
| `fetch_config` | object | No | Updated fetch configuration |

### Example Usage

```
"Disable source 3"
```

```
"Update source 5 trust score to 90"
```

---

## veille_remove_source

Remove a content source permanently.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_id` | number | Yes | ID of the source to remove |

### Example Usage

```
"Remove source 7"
```

---

## veille_fetch_now

Trigger an immediate fetch of content from sources.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_id` | number | No | Fetch a specific source only. If omitted, fetches all enabled sources. |
| `source_type` | string | No | Fetch only sources of this type |

### Example Usage

```
"Fetch all sources now"
```

```
"Fetch source 3 now"
```

```
"Fetch all RSS sources"
```

---

## veille_generate_digest

Generate an AI-powered digest from collected items.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest_type` | string | Yes | One of: `daily`, `weekly` |
| `date` | string | No | Date for the digest (ISO 8601, defaults to today) |
| `max_items` | number | No | Override maximum items to include |
| `trust_threshold` | number | No | Override minimum trust score for inclusion |

### Example Usage

```
"Generate a daily digest"
```

```
"Generate a weekly digest for last week"
```

```
"Generate a daily digest with max 20 items and trust threshold 60"
```

---

## veille_transform_content

Transform a digest into a specific content format for publishing.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest_id` | number | No | ID of the digest to transform. If omitted, uses the latest digest. |
| `format` | string | Yes | One of: `blog_post`, `x_thread`, `linkedin_post`, `newsletter` |
| `language` | string | No | Override output language (default: plugin config language) |

### Example Usage

```
"Transform the latest digest into a blog post"
```

```
"Transform digest 12 into an X thread"
```

```
"Transform the latest digest into a LinkedIn post in English"
```

---

## veille_publish

Publish content to a platform.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | Yes | One of: `ghost`, `wordpress`, `twitter`, `linkedin`, `devto`, `telegram`, `slack`, `discord` |
| `content` | string | Yes | The content to publish |
| `title` | string | Yes | Title for the publication |
| `format` | string | Yes | Content format: `blog_post`, `x_thread`, `linkedin_post`, `newsletter` |
| `digest_id` | number | No | Link publication to a digest for audit logging |

### Example Usage

```
"Publish the blog post to Ghost"
```

```
"Publish the newsletter to Telegram and Slack"
```

---

## veille_search

Search across all collected items.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query (matched against title, summary, tags) |
| `source_type` | string | No | Filter by source type |
| `limit` | number | No | Maximum results to return (default: 20) |
| `offset` | number | No | Pagination offset |

### Example Usage

```
"Search my items for 'AI agents'"
```

```
"Search for 'Rust programming' in HN sources, limit 10"
```

---

## veille_status

View the current system status, including configured fetchers, publishers, source counts, item counts, and recent digest history.

### Parameters

None.

### Example Usage

```
"Show me the veille status"
```

```
"What's the current state of my monitoring system?"
```

---

# SaaS Tools (3, Opt-In)

The following tools are only registered when `saasMode: true` is set in the plugin configuration. They provide multi-tenant management, webhook subscriptions, and API key management for SaaS platforms.

---

## veille_manage_tenant

Create or view tenant information for multi-tenant isolation.

**Requires**: `saasMode: true`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `create`, `info` |
| `tenant_id` | string | No | Tenant ID (defaults to current tenant from config) |
| `name` | string | No | Tenant display name (used with `create` action) |

### Example Usage

```
"Create a new tenant called 'acme-corp'"
```

```
"Show me info about the current tenant"
```

```
"Show me tenant info for 'team-alpha'"
```

---

## veille_manage_webhooks

Manage webhook subscriptions for async event delivery. Webhooks receive POST requests when plugin events occur.

**Requires**: `saasMode: true`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `add`, `list`, `remove` |
| `url` | string | For `add` | Webhook endpoint URL |
| `events` | string[] | For `add` | Event types to subscribe to (e.g., `source.created`, `digest.generated`) |
| `secret` | string | No | Shared secret for HMAC signature verification (for `add`) |
| `webhook_id` | number | For `remove` | ID of the webhook subscription to remove |

### Available Events

`source.created`, `source.updated`, `source.deleted`, `items.fetched`, `digest.generated`, `content.transformed`, `content.published`, `tenant.created`

### Example Usage

```
"List all webhook subscriptions"
```

```
"Add a webhook for digest.generated events to https://example.com/hook"
```

```
"Remove webhook subscription 5"
```

---

## veille_manage_api_keys

Manage API keys for external service authentication. Keys use SHA-256 hashing and are only shown once at creation.

**Requires**: `saasMode: true`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `create`, `list`, `revoke` |
| `label` | string | No | Human-readable label for the key (for `create`) |
| `scopes` | string[] | No | Permission scopes for the key (for `create`) |
| `key_id` | number | For `revoke` | ID of the API key to revoke |

### Example Usage

```
"Create an API key labeled 'CI pipeline'"
```

```
"List all API keys"
```

```
"Revoke API key 3"
```

---

## Tool Interaction Patterns

### Full Pipeline

A typical workflow chains multiple tools:

1. `veille_add_source` -- Set up sources
2. `veille_fetch_now` -- Pull content
3. `veille_generate_digest` -- Create a digest
4. `veille_transform_content` -- Format for a platform
5. `veille_publish` -- Send to the platform

### Iterative Refinement

The agent can call tools iteratively:

1. `veille_generate_digest` -- Generate initial digest
2. User: "Make it shorter and focus on AI topics"
3. Agent regenerates with adjusted parameters or prompt guidance
4. `veille_transform_content` -- Transform the refined digest
5. `veille_publish` -- Publish the final version
