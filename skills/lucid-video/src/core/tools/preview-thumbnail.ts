import type { ToolDefinition } from './types.js';
import type { EngineClient } from '../engine/client.js';
import { parseVideoBrief } from '../types/video-brief.js';

export interface PreviewThumbnailToolDeps {
  engine: EngineClient;
}

export function createPreviewThumbnailTool(deps: PreviewThumbnailToolDeps): ToolDefinition {
  return {
    name: 'preview_thumbnail',
    description: 'Generate a thumbnail preview (frame 0) of a video brief without rendering the full video. Fast (<3s). Use to confirm visual before committing to a full render.',
    params: {
      template_id: { type: 'string', required: true, description: 'Template ID' },
      scenes: { type: 'string', required: true, description: 'JSON array of scenes' },
      format: { type: 'enum', required: true, values: ['mp4', 'webm', 'gif'], description: 'Output format' },
      resolution: { type: 'enum', required: true, values: ['1080p', '720p', 'square', 'story', 'reel'], description: 'Output resolution' },
      brand_colors: { type: 'string', required: false, description: 'JSON: {primary, secondary, background}' },
    },
    async execute(params: Record<string, unknown>): Promise<string> {
      try {
        const scenes = JSON.parse(params.scenes as string);
        const brand = params.brand_colors ? { colors: JSON.parse(params.brand_colors as string) } : undefined;

        const brief = {
          template_id: params.template_id,
          scenes,
          brand,
          output: { format: params.format, resolution: params.resolution },
        };

        const parsed = parseVideoBrief(brief);
        if (!parsed.success) {
          return `Error: Invalid brief — ${parsed.error.issues.map((i) => i.message).join(', ')}`;
        }

        const result = await deps.engine.thumbnail(parsed.data);
        return JSON.stringify(result, null, 2);
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  };
}
