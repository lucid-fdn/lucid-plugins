-- SaaS mode only: Run this migration if you're using the plugin in multi-tenant SaaS mode.
-- Not needed for standard single-tenant plugin usage.

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so the plugin (using service_role key) has full access.
-- These policies are for when we expose the API via anon/authenticated roles.

-- Tenants: users can only see their own tenant
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true));

-- Sources: tenant isolation
CREATE POLICY "source_tenant_isolation" ON sources
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Items: tenant isolation
CREATE POLICY "item_tenant_isolation" ON items
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Digests: tenant isolation
CREATE POLICY "digest_tenant_isolation" ON digests
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Publish log: tenant isolation
CREATE POLICY "publish_log_tenant_isolation" ON publish_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- API keys table for SaaS integration (external services authenticate via API key)
CREATE TABLE IF NOT EXISTS api_keys (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  label text,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_tenant_isolation" ON api_keys
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Webhook subscriptions table for SaaS event delivery
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_tenant ON webhook_subscriptions(tenant_id);

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_subs_tenant_isolation" ON webhook_subscriptions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));
