// ---------------------------------------------------------------------------
// url.ts -- URL utilities
// ---------------------------------------------------------------------------

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.toString().replace(/\/+$/, '');
  } catch {
    return url;
  }
}

export function extractPlatformFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('discord.com') || hostname.includes('discord.gg')) return 'discord';
    if (hostname.includes('t.me') || hostname.includes('telegram.org')) return 'telegram';
    if (hostname.includes('news.ycombinator.com')) return 'hackernews';
    if (hostname.includes('producthunt.com')) return 'producthunt';
    return null;
  } catch {
    return null;
  }
}
