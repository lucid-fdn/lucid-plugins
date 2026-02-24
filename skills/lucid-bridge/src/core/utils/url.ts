/**
 * Validate a URL string.
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Join URL path segments safely.
 */
export function joinUrl(base: string, ...segments: string[]): string {
  let result = base.replace(/\/+$/, '');
  for (const seg of segments) {
    result += '/' + seg.replace(/^\/+/, '').replace(/\/+$/, '');
  }
  return result;
}

/**
 * Extract query params from a URL string.
 */
export function getQueryParams(urlStr: string): Record<string, string> {
  try {
    const url = new URL(urlStr);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    return {};
  }
}
