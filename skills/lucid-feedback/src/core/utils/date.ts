// ---------------------------------------------------------------------------
// date.ts -- Date formatting utilities
// ---------------------------------------------------------------------------

export function isoNow(): string {
  return new Date().toISOString();
}

export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function periodLabel(days: number): string {
  if (days <= 7) return 'week';
  if (days <= 30) return 'month';
  if (days <= 90) return 'quarter';
  return 'year';
}
