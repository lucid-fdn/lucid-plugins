import type { ToolDefinition } from './types.js';
import type {
  PluginConfig,
  SourceType,
  Fetcher,
  PublishPlatform,
  Publisher,
  ContentFormat,
  ContentTransformer,
} from '../types/index.js';
import {
  createAddSourceTool,
  createListSourcesTool,
  createUpdateSourceTool,
  createRemoveSourceTool,
} from './manage-sources.js';
import { createFetchNowTool } from './fetch-now.js';
import { createGenerateDigestTool } from './generate-digest.js';
import { createTransformContentTool } from './transform-content.js';
import { createPublishContentTool } from './publish-content.js';
import { createSearchItemsTool } from './search-items.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  publisherRegistry: Map<PublishPlatform, Publisher>;
  transformerRegistry: Map<ContentFormat, ContentTransformer>;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createAddSourceTool({ config: deps.config }),
    createListSourcesTool({ config: deps.config }),
    createUpdateSourceTool({ config: deps.config }),
    createRemoveSourceTool({ config: deps.config }),
    createFetchNowTool({ config: deps.config, fetcherRegistry: deps.fetcherRegistry }),
    createGenerateDigestTool({ config: deps.config }),
    createTransformContentTool({ config: deps.config, transformerRegistry: deps.transformerRegistry }),
    createPublishContentTool({ config: deps.config, publisherRegistry: deps.publisherRegistry }),
    createSearchItemsTool({ config: deps.config }),
    createStatusTool({ config: deps.config, fetcherRegistry: deps.fetcherRegistry, publisherRegistry: deps.publisherRegistry }),
  ];
}

// Re-export types
export type { ToolDefinition, ToolParamDef } from './types.js';

// Re-export factory functions for individual tool usage
export { createAddSourceTool, createListSourcesTool, createUpdateSourceTool, createRemoveSourceTool } from './manage-sources.js';
export { createFetchNowTool } from './fetch-now.js';
export { createGenerateDigestTool } from './generate-digest.js';
export { createTransformContentTool } from './transform-content.js';
export { createPublishContentTool } from './publish-content.js';
export { createSearchItemsTool } from './search-items.js';
export { createStatusTool } from './status.js';
