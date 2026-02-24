// ---------------------------------------------------------------------------
// text.ts -- Text utilities
// ---------------------------------------------------------------------------

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatUsd(n: number): string {
  return `$${formatNumber(n)}`;
}

export function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}
