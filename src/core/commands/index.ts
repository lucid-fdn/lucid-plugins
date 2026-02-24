import type {
  PluginConfig,
  SourceType,
  Fetcher,
  PublishPlatform,
  Publisher,
} from '../types/index.js';
import { createVeilleStatusHandler } from './veille-status.js';
import { createVeilleRunHandler } from './veille-run.js';
import { createVeilleConfigHandler } from './veille-config.js';

export interface CommandDependencies {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  publisherRegistry: Map<PublishPlatform, Publisher>;
}

/**
 * Register all Lucid Veille slash commands with the OpenClaw API.
 */
export function registerAllCommands(api: any, deps: CommandDependencies): void {
  api.registerCommand({
    name: 'veille-status',
    description: 'Show Lucid Veille system status (sources, items, digests, schedule)',
    handler: createVeilleStatusHandler({
      config: deps.config,
      fetcherRegistry: deps.fetcherRegistry,
      publisherRegistry: deps.publisherRegistry,
    }),
  });

  api.registerCommand({
    name: 'veille-run',
    description: 'Run veille pipeline: /veille-run [daily|weekly|fetch-only]',
    handler: createVeilleRunHandler({
      config: deps.config,
      fetcherRegistry: deps.fetcherRegistry,
    }),
  });

  api.registerCommand({
    name: 'veille-config',
    description: 'Show current Lucid Veille configuration (secrets redacted)',
    handler: createVeilleConfigHandler({
      config: deps.config,
    }),
  });
}

// Re-export for individual usage
export { createVeilleStatusHandler } from './veille-status.js';
export { createVeilleRunHandler } from './veille-run.js';
export { createVeilleConfigHandler } from './veille-config.js';
