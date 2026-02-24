/**
 * Normalize a URL by trimming whitespace, removing the trailing slash,
 * and stripping the fragment (hash) portion.
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Remove fragment
  const hashIndex = normalized.indexOf('#');
  if (hashIndex !== -1) {
    normalized = normalized.slice(0, hashIndex);
  }

  // Remove trailing slash (but not for root paths like "https://example.com/")
  if (normalized.endsWith('/') && !normalized.endsWith('://')) {
    const withoutTrailing = normalized.slice(0, -1);
    // Keep the trailing slash if the path is just the origin (e.g. https://example.com)
    const afterProtocol = normalized.replace(/^https?:\/\//, '');
    if (afterProtocol.includes('/')) {
      normalized = withoutTrailing;
    }
  }

  return normalized;
}

/**
 * Extract the hostname (domain) from a URL string.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname;
  } catch {
    // Fallback: try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?([^/:?#]+)/i);
    return match ? match[1] : '';
  }
}

/**
 * Validate whether a string is a well-formed URL with http or https protocol.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
