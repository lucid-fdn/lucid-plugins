import { marked } from 'marked';
import type { DigestType } from '../types/index.js';

/**
 * Convert a markdown string to HTML using the `marked` library.
 *
 * The parser is configured with GFM (GitHub Flavored Markdown) enabled and
 * line breaks preserved.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const html = await marked.parse(markdown, {
    gfm: true,
    breaks: true,
  });

  return html;
}

/**
 * Build a deterministic storage path for a digest artefact.
 *
 * Returns paths of the form:
 *   digests/{tenantId}/{date}/{digestType}.{ext}
 *
 * @param tenantId - The tenant identifier.
 * @param date - The date string (typically YYYY-MM-DD).
 * @param digestType - 'daily' or 'weekly'.
 * @param ext - The file extension ('md' or 'html').
 */
export function buildStoragePath(
  tenantId: string,
  date: string,
  digestType: DigestType,
  ext: 'md' | 'html',
): string {
  return `digests/${tenantId}/${date}/${digestType}.${ext}`;
}
