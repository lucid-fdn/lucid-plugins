-- ============================================================================
-- Lucid Metrics -- Database schema
-- ============================================================================

-- Events table
CREATE TABLE IF NOT EXISTS metrics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'custom',
  user_id TEXT,
  session_id TEXT,
  properties JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_events_tenant ON metrics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_events_name ON metrics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_metrics_events_user ON metrics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_events_timestamp ON metrics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_events_type ON metrics_events(event_type);

-- Metric definitions table
CREATE TABLE IF NOT EXISTS metrics_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_name TEXT NOT NULL,
  aggregation TEXT NOT NULL DEFAULT 'count',
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_definitions_name ON metrics_definitions(tenant_id, name);

-- Funnel definitions table
CREATE TABLE IF NOT EXISTS metrics_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  conversion_window INTEGER NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_funnels_name ON metrics_funnels(tenant_id, name);

-- Funnel results table
CREATE TABLE IF NOT EXISTS metrics_funnel_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES metrics_funnels(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  step_counts INTEGER[] NOT NULL DEFAULT '{}',
  conversion_rates NUMERIC[] NOT NULL DEFAULT '{}',
  total_entered INTEGER NOT NULL DEFAULT 0,
  total_converted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_funnel_results_funnel ON metrics_funnel_results(funnel_id);

-- Cohort definitions table
CREATE TABLE IF NOT EXISTS metrics_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  entry_event TEXT NOT NULL,
  return_event TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'week',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_cohorts_name ON metrics_cohorts(tenant_id, name);

-- Experiments table
CREATE TABLE IF NOT EXISTS metrics_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hypothesis TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  variants JSONB NOT NULL DEFAULT '[]',
  metric_id TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_experiments_name ON metrics_experiments(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_metrics_experiments_status ON metrics_experiments(status);

-- Features table
CREATE TABLE IF NOT EXISTS metrics_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  adoption_metric_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_features_name ON metrics_features(tenant_id, name);

-- Dashboard widgets table
CREATE TABLE IF NOT EXISTS metrics_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  dashboard_name TEXT NOT NULL,
  widget_type TEXT NOT NULL DEFAULT 'line',
  config JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_widgets_dashboard ON metrics_dashboard_widgets(tenant_id, dashboard_name);
