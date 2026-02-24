import type {
  PluginConfig,
  SourceType,
  Fetcher,
  DigestType,
} from '../types/index.js';
import { createFetchNowTool } from '../tools/fetch-now.js';
import { createGenerateDigestTool } from '../tools/generate-digest.js';
import { toISODate } from '../utils/date.js';
import { log } from '../utils/logger.js';

export interface VeilleRunCommandDeps {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
}

/**
 * Handler for the /veille-run command.
 *
 * Usage: /veille-run [daily|weekly|fetch-only]
 *
 * - `fetch-only`: triggers fetch for all enabled sources
 * - `daily` (default): fetch + generate daily digest prompt
 * - `weekly`: fetch + generate weekly digest prompt
 *
 * Returns status messages at each step.
 */
export function createVeilleRunHandler(deps: VeilleRunCommandDeps) {
  return async (args?: string): Promise<string> => {
    try {
      const mode = (args?.trim().toLowerCase() || 'daily') as 'daily' | 'weekly' | 'fetch-only';

      if (!['daily', 'weekly', 'fetch-only'].includes(mode)) {
        return `Unknown mode "${mode}". Usage: /veille-run [daily|weekly|fetch-only]`;
      }

      log.info(`Running /veille-run command with mode: ${mode}`);

      const output: string[] = [];
      output.push(`=== Veille Run (${mode}) ===`);
      output.push('');

      // Step 1: Fetch from all sources
      output.push('Step 1: Fetching from all enabled sources...');

      const fetchTool = createFetchNowTool({
        config: deps.config,
        fetcherRegistry: deps.fetcherRegistry,
      });

      const fetchResult = await fetchTool.execute({});
      output.push(fetchResult);
      output.push('');

      // Step 2: Generate digest (unless fetch-only)
      if (mode === 'fetch-only') {
        output.push('Fetch-only mode: skipping digest generation.');
        return output.join('\n');
      }

      const digestType: DigestType = mode;
      const date = toISODate(new Date());

      output.push(`Step 2: Generating ${digestType} digest for ${date}...`);

      const digestTool = createGenerateDigestTool({
        config: deps.config,
      });

      const digestResult = await digestTool.execute({
        digest_type: digestType,
        date,
      });

      // The digest result is a JSON string; parse it for display
      const result = JSON.parse(digestResult) as Record<string, unknown>;
      if (result.error) {
        output.push(`Digest generation error: ${result.error}`);
      } else if (result.itemCount === 0) {
        output.push(result.message as string || 'No items available for digest.');
      } else {
        output.push(`Digest prompt generated with ${result.itemCount} items.`);
        output.push('The agent LLM will now use the prompt data to generate the digest content.');
      }

      return output.join('\n');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('/veille-run command failed', msg);
      return `Error running veille-run: ${msg}`;
    }
  };
}
