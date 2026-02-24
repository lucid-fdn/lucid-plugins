import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';

export interface CancelRenderToolDeps {
  engine: EngineClient;
}

export function createCancelRenderTool(deps: CancelRenderToolDeps): ToolDefinition {
  return {
    name: 'cancel_render',
    description: 'Cancel a running video render job.',
    params: {
      render_id: { type: 'string', required: true, description: 'The render job ID to cancel' },
    },
    async execute(params: Record<string, unknown>): Promise<string> {
      try {
        const result = await deps.engine.cancel(params.render_id as string);
        return result.cancelled
          ? `Render ${params.render_id} cancelled successfully.`
          : `Render ${params.render_id} could not be cancelled (may have already completed).`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
