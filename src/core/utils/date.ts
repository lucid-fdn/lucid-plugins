/**
 * Return current ISO timestamp.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Calculate days between two date strings.
 */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return Math.abs(Math.round((dateB - dateA) / msPerDay));
}

/**
 * Check if a date string is in the past.
 */
export function isPast(date: string): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Format a date string for display.
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Add days to a date string, returning ISO string.
 */
export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
