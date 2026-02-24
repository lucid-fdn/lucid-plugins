// ---------------------------------------------------------------------------
// create-dashboard.ts -- Create a dashboard with widgets
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { createWidget, deleteWidgets } from '../db/dashboards.js';
import { CHART_TYPES } from '../types/common.js';
import type { ChartType } from '../types/common.js';
import { log } from '../utils/logger.js';

interface WidgetInput {
  type: string;
  metric?: string;
  config?: Record<string, unknown>;
}

interface CreateDashboardParams {
  name: string;
  widgets: WidgetInput[];
}

export function createCreateDashboardTool(deps: { config: PluginConfig }): ToolDefinition<CreateDashboardParams> {
  return {
    name: 'metrics_create_dashboard',
    description:
      'Create or replace a dashboard with multiple widgets. Each widget can be a line chart, bar chart, pie chart, funnel, cohort, or heatmap.',
    params: {
      name: { type: 'string', required: true, description: 'Dashboard name' },
      widgets: {
        type: 'array',
        required: true,
        description: 'Array of widget definitions',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'enum',
              required: true,
              description: 'Widget chart type',
              values: [...CHART_TYPES],
            },
            metric: { type: 'string', required: false, description: 'Metric name for this widget' },
            config: { type: 'object', required: false, description: 'Widget-specific configuration' },
          },
        },
      },
    },
    execute: async (params: CreateDashboardParams): Promise<string> => {
      try {
        // Remove existing widgets for this dashboard
        await deleteWidgets(deps.config.tenantId, params.name).catch(() => {
          // Dashboard may not exist yet
        });

        const createdWidgets = [];
        for (let i = 0; i < params.widgets.length; i++) {
          const w = params.widgets[i];
          const widget = await createWidget({
            tenant_id: deps.config.tenantId,
            dashboard_name: params.name,
            widget_type: (w.type as ChartType) ?? 'line',
            config: {
              ...(w.config ?? {}),
              ...(w.metric ? { metric: w.metric } : {}),
            },
            position: i,
          });
          createdWidgets.push(widget);
        }

        const lines = [
          `## Dashboard Created: ${params.name}`,
          '',
          `- **Widgets**: ${createdWidgets.length}`,
          '',
          '### Widgets',
          ...createdWidgets.map(
            (w, i) =>
              `${i + 1}. **${w.widget_type}** — ${(w.config as Record<string, unknown>).metric ?? 'custom'} (position ${w.position})`,
          ),
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_create_dashboard failed', msg);
        return `Error creating dashboard: ${msg}`;
      }
    },
  };
}
