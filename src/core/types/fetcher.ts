import type { SourceType } from './common.js';
import type { Source, ItemInsert } from './database.js';

export interface FetchResult {
  items: ItemInsert[];
  errors: string[];
}

export interface Fetcher {
  readonly sourceType: SourceType;
  readonly name: string;
  isConfigured(): boolean;
  fetch(source: Source): Promise<FetchResult>;
}

export interface FetcherConstructorOptions {
  tenantId: string;
  config: Record<string, unknown>;
}
