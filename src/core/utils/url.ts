export function isValidUrl(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    input = 'https://' + input;
  }
  try {
    const url = new URL(input);
    return url.toString().replace(/\/+$/, '');
  } catch {
    return input;
  }
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
