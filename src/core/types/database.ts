import type { SourceType, DigestType, ItemStatus, PublishStatus, PublishPlatform, ContentFormat } from './common.js';

export interface Tenant {
  id: string;
  name: string;
}

export interface Source {
  id: number;
  tenant_id: string;
  url: string;
  source_type: SourceType;
  label: string | null;
  trust_score: number;
  enabled: boolean;
  fetch_config: Record<string, unknown> | null;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface SourceInsert {
  tenant_id: string;
  url: string;
  source_type: SourceType;
  label?: string;
  trust_score?: number;
  enabled?: boolean;
  fetch_config?: Record<string, unknown>;
}

export interface SourceUpdate {
  url?: string;
  source_type?: SourceType;
  label?: string;
  trust_score?: number;
  enabled?: boolean;
  fetch_config?: Record<string, unknown>;
  last_fetched_at?: string;
  last_error?: string | null;
}

export interface Item {
  id: number;
  tenant_id: string;
  source_id: number | null;
  canonical_url: string;
  title: string | null;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  published_at: string | null;
  source: string | null;
  storage_text_path: string | null;
  status: ItemStatus;
  relevance_score: number | null;
  created_at: string;
}

export interface ItemInsert {
  tenant_id: string;
  source_id?: number;
  canonical_url: string;
  title?: string;
  summary?: string;
  author?: string;
  tags?: string[];
  published_at?: string;
  source?: string;
  storage_text_path?: string;
  status?: ItemStatus;
  relevance_score?: number;
}

export interface Digest {
  id: number;
  tenant_id: string;
  date: string;
  digest_type: DigestType;
  title: string | null;
  item_count: number | null;
  storage_md_path: string;
  storage_html_path: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DigestInsert {
  tenant_id: string;
  date: string;
  digest_type: DigestType;
  title?: string;
  item_count?: number;
  storage_md_path: string;
  storage_html_path: string;
  metadata?: Record<string, unknown>;
}

export interface PublishLog {
  id: number;
  tenant_id: string;
  digest_id: number | null;
  platform: PublishPlatform;
  content_format: ContentFormat;
  status: PublishStatus;
  external_url: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
}

export interface PublishLogInsert {
  tenant_id: string;
  digest_id?: number;
  platform: PublishPlatform;
  content_format: ContentFormat;
  status?: PublishStatus;
  external_url?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  published_at?: string;
}
