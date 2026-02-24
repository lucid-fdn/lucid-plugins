-- Add columns to sources
ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'rss';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS fetch_config jsonb;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_fetched_at timestamptz;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_error text;

-- Add columns to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS source_id bigint REFERENCES sources(id) ON DELETE SET NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE items ADD COLUMN IF NOT EXISTS relevance_score real;

-- Full-text search
ALTER TABLE items ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(fts);

-- Add columns to digests
ALTER TABLE digests ADD COLUMN IF NOT EXISTS digest_type text NOT NULL DEFAULT 'daily';
ALTER TABLE digests ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE digests ADD COLUMN IF NOT EXISTS item_count integer;
ALTER TABLE digests ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Update unique constraint on digests
ALTER TABLE digests DROP CONSTRAINT IF EXISTS digests_tenant_id_date_key;
ALTER TABLE digests ADD CONSTRAINT digests_tenant_id_date_type_key UNIQUE (tenant_id, date, digest_type);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sources_tenant_enabled ON sources(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_items_tenant_status ON items(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_items_source_id ON items(source_id);
