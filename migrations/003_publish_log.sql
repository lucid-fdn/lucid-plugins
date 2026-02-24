CREATE TABLE IF NOT EXISTS publish_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id text NOT NULL,
  digest_id bigint REFERENCES digests(id) ON DELETE SET NULL,
  platform text NOT NULL,
  content_format text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  external_url text,
  error_message text,
  metadata jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_log_tenant ON publish_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_publish_log_digest ON publish_log(digest_id);
