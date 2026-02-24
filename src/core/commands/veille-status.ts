import type {
  PluginConfig,
  SourceType,
  Fetcher,
  PublishPlatform,
  Publisher,
} from '../types/index.js';
import { createStatusTool } from '../tools/status.js';
import { log } from '../utils/logger.js';

export interface VeilleStatusCommandDeps {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  publisherRegistry: Map<PublishPlatform, Publisher>;
}

/**
 * Handler for the /veille-status command.
 *
 * Invokes the status tool logic and returns the formatted output for display.
 */
export function createVeilleStatusHandler(deps: VeilleStatusCommandDeps) {
  return async (): Promise<string> => {
    try {
      log.info('Running /veille-status command');

      const statusTool = createStatusTool({
        config: deps.config,
        fetcherRegistry: deps.fetcherRegistry,
        publisherRegistry: deps.publisherRegistry,
      });

      const result = await statusTool.execute({});

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('/veille-status command failed', msg);
      return `Error running veille-status: ${msg}`;
    }
  };
}
