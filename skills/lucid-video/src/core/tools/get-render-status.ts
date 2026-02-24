import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';

export interface GetRenderStatusToolDeps {
  engine: EngineClient;
}

export function createGetRenderStatusTool(deps: GetRenderStatusToolDeps): ToolDefinition {
  return {
    name: 'get_render_status',
    description: 'Check the status and progress of a video render job. Returns status, progress percentage, and video URL when complete.',
    params: {
      render_id: { type: 'string', required: true, description: 'The render job ID returned by render_video' },
    },
    async execute(params: Record<string, unknown>): Promise<string> {
      try {
        const status = await deps.engine.getStatus(params.render_id as string);
        return JSON.stringify(status, null, 2);
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
