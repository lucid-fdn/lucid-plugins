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
