/**
 * Get the current ISO timestamp.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Add days to a date and return ISO string.
 */
export function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

/**
 * Calculate the difference in days between two dates.
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if a date is within N days from now.
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const futureLimit = new Date();
  futureLimit.setDate(futureLimit.getDate() + days);
  return d.getTime() <= futureLimit.getTime() && d.getTime() >= Date.now();
}

/**
 * Format a date as a human-readable string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
