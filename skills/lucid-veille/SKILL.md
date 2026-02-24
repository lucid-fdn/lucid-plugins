---
name: lucid-veille
description: Content monitoring, AI digest generation, and multi-platform auto-publishing
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - SUPABASE_URL
        - SUPABASE_SERVICE_ROLE_KEY
    primaryEnv: SUPABASE_URL
---

# Lucid Veille

AI-powered content monitoring and digest generation plugin. You bring your own Supabase database -- the plugin connects directly to it.

## What it does

- Monitors multiple content sources (RSS, Twitter/X, Reddit, Hacker News, web pages)
- Generates daily and weekly AI-powered digests
- Transforms digests into blog posts, X threads, LinkedIn posts, and newsletters
- Auto-publishes to multiple platforms (Ghost, WordPress, Twitter, LinkedIn, dev.to, Telegram, Slack, Discord)

## Core Tools (10)

| Tool | Description |
|------|-------------|
| `veille_add_source` | Add a content source |
| `veille_list_sources` | List monitored sources |
| `veille_update_source` | Update source configuration |
| `veille_remove_source` | Remove a source |
| `veille_fetch_now` | Fetch content immediately |
| `veille_generate_digest` | Generate a daily or weekly digest |
| `veille_transform_content` | Transform digest into blog post, thread, etc. |
| `veille_publish` | Publish content to a platform |
| `veille_search` | Search collected items |
| `veille_status` | View system status |

### SaaS Tools (available when `saasMode: true`)

When SaaS mode is enabled, 3 additional tools are registered for multi-tenant management, webhook subscriptions, and API key management:

| Tool | Description |
|------|-------------|
| `veille_manage_tenant` | Create or view tenant information |
| `veille_manage_webhooks` | Manage webhook subscriptions for event delivery |
| `veille_manage_api_keys` | Manage API keys for external authentication |

## Commands

- `/veille-status` -- Show system health
- `/veille-run [daily|weekly|fetch-only]` -- Run pipeline manually
- `/veille-config` -- Show current configuration

## Quick Start

1. Configure Supabase credentials
2. Add sources: "Add this RSS feed as a source: https://example.com/feed.xml"
3. Fetch content: "Fetch all sources now"
4. Generate digest: "Generate a daily digest"
5. Transform: "Transform the digest into a blog post"
6. Publish: "Publish the blog post to Ghost"

## Example Prompts

- "Add https://news.ycombinator.com as a Hacker News source with trust score 80"
- "Show me all my sources"
- "Fetch all sources and generate a daily digest"
- "Transform the latest digest into an X thread"
- "Publish the newsletter to Telegram"
- "Search my items for 'AI agents'"
