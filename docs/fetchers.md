# Fetchers

Fetchers are responsible for pulling content from external sources and normalizing it into `ItemInsert` records for storage. Each fetcher implements the `Fetcher` interface and extends `BaseFetcher`.

## Common Behavior

All fetchers share the following characteristics via `BaseFetcher`:

- **Rate limiting**: Each source type has its own rate limiter (powered by Bottleneck) to prevent hitting API limits.
- **Automatic retry**: Failed fetches are retried up to 2 times with exponential backoff.
- **Error isolation**: Individual item processing errors are collected in the `errors` array without aborting the entire fetch.
- **Tenant scoping**: Every item is tagged with the source's `tenant_id`.

### FetchResult

Every fetcher returns:

```typescript
interface FetchResult {
  items: ItemInsert[];  // Successfully parsed items
  errors: string[];     // Non-fatal errors encountered during fetch
}
```

---

## RSS Fetcher

**Source type**: `rss`
**Always configured**: Yes (no external credentials needed)

### Behavior

- Parses RSS and Atom feeds using the `rss-parser` library.
- Extracts title, link, summary (from `contentSnippet` or stripped HTML content), author, and publication date.
- Summaries are truncated to 500 characters.
- HTML entities in content are decoded.
- Request timeout: 15 seconds.

### Source URL Format

Any valid RSS or Atom feed URL:
```
https://feeds.arstechnica.com/arstechnica/index
https://hnrss.org/frontpage
https://blog.example.com/feed.xml
```

### fetch_config Options

No additional configuration needed. The RSS fetcher works with any standard RSS/Atom feed URL.

---

## Twitter / X Fetcher

**Source type**: `twitter`
**Requires**: `twitterBearerToken` in plugin config

### Behavior

- Uses the Twitter API v2 search endpoint via the `twitter-api-v2` library.
- Extracts the search query from the source URL or `fetch_config.query`.
- Returns tweets with text, author ID, creation date, and hashtags.
- Canonical URLs point to the tweet status page.

### Source URL Format

```
https://twitter.com/username          -> Translates to "from:username"
https://twitter.com/search?q=AI+news  -> Uses the q parameter as the search query
```

### fetch_config Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `query` | string | _(derived from URL)_ | Explicit Twitter search query (overrides URL parsing) |
| `maxResults` | number | `20` | Number of tweets to fetch (10-100) |

### Example

```json
{
  "url": "https://twitter.com/OpenAI",
  "source_type": "twitter",
  "fetch_config": {
    "query": "from:OpenAI",
    "maxResults": 50
  }
}
```

---

## Reddit Fetcher

**Source type**: `reddit`
**Always configured**: Yes (uses public JSON API)

### Behavior

- Fetches subreddit listings via Reddit's public JSON API (no authentication required).
- Automatically appends `.json` to the source URL if not already present.
- Extracts post title, selftext (truncated to 500 chars), author, permalink, subreddit, flair, and creation timestamp.
- Only processes `t3` (link) type entries; skips "more" and comment types.
- Tags include the subreddit name and link flair text.

### Source URL Format

```
https://www.reddit.com/r/MachineLearning
https://www.reddit.com/r/programming/hot
https://www.reddit.com/r/netsec/top?t=week
```

### fetch_config Options

No additional configuration needed. Sort order and time range are controlled via the source URL path and query parameters.

### User Agent

Requests include the user agent string `lucid-veille:1.0.0 (OpenClaw Plugin)` as recommended by Reddit's API guidelines.

---

## Hacker News Fetcher

**Source type**: `hackernews`
**Always configured**: Yes (uses public Algolia API)

### Behavior

- Uses the Hacker News Algolia API (`hn.algolia.com/api/v1/search`) for fast, structured search.
- By default fetches front page stories (`tags=front_page`).
- Extracts title, URL (falls back to HN discussion URL), author, creation date, story text, and tags.
- Auto-generated Algolia tags like `story`, `comment`, and `author_*` are filtered out from the item tags.
- Story text HTML is stripped and truncated to 500 characters.

### Source URL Format

The source URL is used as an identifier but the actual API call is constructed internally:

```
https://news.ycombinator.com
https://news.ycombinator.com/front
```

### fetch_config Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `query` | string | _(none)_ | Search query string for Algolia search |
| `tags` | string | `front_page` | Algolia tag filter (e.g., `story`, `show_hn`, `ask_hn`, `front_page`) |
| `hitsPerPage` | number | `30` | Number of results per request |

### Example

```json
{
  "url": "https://news.ycombinator.com",
  "source_type": "hackernews",
  "fetch_config": {
    "query": "LLM agents",
    "tags": "story",
    "hitsPerPage": 50
  }
}
```

---

## Web Fetcher

**Source type**: `web`
**Always configured**: Yes (no external credentials needed)

### Behavior

- Fetches a single web page and extracts article content.
- Uses a two-pass extraction strategy:
  1. **Readability** (primary): Mozilla's Readability library extracts the main article content from the DOM, providing title, byline, and clean text.
  2. **Cheerio** (fallback): If Readability fails or produces incomplete results, falls back to parsing Open Graph meta tags, Twitter Card meta tags, and standard HTML meta elements.
- Extracts published date from `article:published_time`, `date`, `publish-date` meta tags, or `<time datetime>` elements.
- Summaries are truncated to 500 characters.
- Each web page produces a single item (unlike feed-based fetchers which produce multiple items).

### Source URL Format

Any publicly accessible web page URL:

```
https://example.com/blog/my-article
https://arxiv.org/abs/2401.12345
```

### fetch_config Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `timeoutMs` | number | `15000` | Request timeout in milliseconds |

### User Agent

Requests include: `Mozilla/5.0 (compatible; Lucid-Veille/1.0; +https://github.com/openclaw)`

### Limitations

- Does not execute JavaScript. Pages that require client-side rendering will return incomplete content.
- Cannot bypass paywalls or login walls.
- Extracts a single page per source; does not crawl links or paginate.
