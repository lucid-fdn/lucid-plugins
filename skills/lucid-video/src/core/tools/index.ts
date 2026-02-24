import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';
import { createRenderVideoTool } from './render-video.js';
import { createListTemplatesTool } from './list-templates.js';
import { createGetRenderStatusTool } from './get-render-status.js';
import { createPreviewThumbnailTool } from './preview-thumbnail.js';
import { createCancelRenderTool } from './cancel-render.js';

export interface ToolDependencies {
  engine: EngineClient;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createRenderVideoTool({ engine: deps.engine }),
    createListTemplatesTool({ engine: deps.engine }),
    createGetRenderStatusTool({ engine: deps.engine }),
    createPreviewThumbnailTool({ engine: deps.engine }),
    createCancelRenderTool({ engine: deps.engine }),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
export { createRenderVideoTool } from './render-video.js';
export { createListTemplatesTool } from './list-templates.js';
export { createGetRenderStatusTool } from './get-render-status.js';
export { createPreviewThumbnailTool } from './preview-thumbnail.js';
export { createCancelRenderTool } from './cancel-render.js';
