// ---------------------------------------------------------------------------
// track-feature.ts -- Create or update feature tracking
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { createFeature, getFeatureByName, updateFeature } from '../db/features.js';
import { FEATURE_STATUSES } from '../types/common.js';
import { log } from '../utils/logger.js';

interface TrackFeatureParams {
  feature_name: string;
  status?: string;
  description?: string;
}

export function createTrackFeatureTool(deps: { config: PluginConfig }): ToolDefinition<TrackFeatureParams> {
  return {
    name: 'metrics_track_feature',
    description:
      'Create or update a feature for adoption tracking. Set feature status and description to monitor feature lifecycle.',
    params: {
      feature_name: { type: 'string', required: true, description: 'Name of the feature to track' },
      status: {
        type: 'enum',
        required: false,
        description: 'Feature lifecycle status',
        values: [...FEATURE_STATUSES],
        default: 'planned',
      },
      description: { type: 'string', required: false, description: 'Feature description' },
    },
    execute: async (params: TrackFeatureParams): Promise<string> => {
      try {
        const existing = await getFeatureByName(deps.config.tenantId, params.feature_name);

        if (existing) {
          const updates: Record<string, unknown> = {};
          if (params.status) updates.status = params.status;
          if (params.description) updates.description = params.description;

          const updated = await updateFeature(existing.id, updates);
          const lines = [
            '## Feature Updated',
            '',
            `- **Name**: ${updated.name}`,
            `- **Status**: ${updated.status}`,
            `- **Description**: ${updated.description || 'N/A'}`,
            `- **Updated**: ${updated.updated_at}`,
          ];
          return lines.join('\n');
        }

        const feature = await createFeature({
          tenant_id: deps.config.tenantId,
          name: params.feature_name,
          status: (params.status as (typeof FEATURE_STATUSES)[number]) ?? 'planned',
          description: params.description,
        });

        const lines = [
          '## Feature Created',
          '',
          `- **Name**: ${feature.name}`,
          `- **Status**: ${feature.status}`,
          `- **Description**: ${feature.description || 'N/A'}`,
          `- **ID**: ${feature.id}`,
        ];
        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_track_feature failed', msg);
        return `Error tracking feature: ${msg}`;
      }
    },
  };
}
