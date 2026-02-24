import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';
import { parseVideoBrief } from '../types/video-brief.js';

export interface RenderVideoToolDeps {
  engine: EngineClient;
}

export function createRenderVideoTool(deps: RenderVideoToolDeps): ToolDefinition {
  return {
    name: 'render_video',
    description: 'Render a video from a VideoBrief. Provide template_id, scenes (JSON array), output format, and resolution. Returns a render_id to track progress.',
    params: {
      template_id: { type: 'string', required: true, description: 'Template ID (e.g. "social-clip-v1")' },
      scenes: { type: 'string', required: true, description: 'JSON array of scenes: [{type, duration, props}]' },
      format: { type: 'enum', required: true, values: ['mp4', 'webm', 'gif'], description: 'Output format' },
      resolution: { type: 'enum', required: true, values: ['1080p', '720p', 'square', 'story', 'reel'], description: 'Output resolution' },
      priority: { type: 'enum', required: false, values: ['burst', 'standard'], description: 'Rendering priority (burst=Lambda, standard=Railway)' },
      brand_colors: { type: 'string', required: false, description: 'JSON: {primary, secondary, background}' },
      data_bindings: { type: 'string', required: false, description: 'JSON object of data to bind into the template' },
    },
    async execute(params: Record<string, unknown>): Promise<string> {
      try {
        const scenes = JSON.parse(params.scenes as string);
        const brand = params.brand_colors ? { colors: JSON.parse(params.brand_colors as string) } : undefined;
        const dataBindings = params.data_bindings ? JSON.parse(params.data_bindings as string) : undefined;

        const brief = {
          template_id: params.template_id,
          scenes,
          brand,
          output: { format: params.format, resolution: params.resolution },
          data_bindings: dataBindings,
          priority: params.priority,
        };

        const parsed = parseVideoBrief(brief);
        if (!parsed.success) {
          return `Error: Invalid VideoBrief — ${parsed.error.issues.map((i) => i.message).join(', ')}`;
        }

        const result = await deps.engine.render(parsed.data);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
