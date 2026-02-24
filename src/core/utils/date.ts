/**
 * Format a Date or date string as an ISO date-time string,
 * or as a specific format token string.
 *
 * Supported format tokens:
 * - 'iso'          -> full ISO 8601 string (default)
 * - 'YYYY-MM-DD'   -> date only
 * - 'YYYY-MM-DDTHH:mm:ss' -> date + time without timezone
 */
export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const fmt = format ?? 'iso';

  if (fmt === 'iso') {
    return d.toISOString();
  }

  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');

  if (fmt === 'YYYY-MM-DD') {
    return `${yyyy}-${mm}-${dd}`;
  }

  if (fmt === 'YYYY-MM-DDTHH:mm:ss') {
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  // Default fallback: ISO string
  return d.toISOString();
}

/**
 * Get a Date that is N days ago from now.
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Check whether a given date falls within the last N days.
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return false;
  }

  const threshold = daysAgo(days);
  return d >= threshold;
}

/**
 * Format a Date as a YYYY-MM-DD string (local time).
 */
export function toISODate(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
