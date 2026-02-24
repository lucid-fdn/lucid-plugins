// ---------------------------------------------------------------------------
// posts.ts -- CRUD for hype_posts table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { ContentPost, ContentPostInsert } from '../types/index.js';
import type { Platform, EngagementLevel } from '../types/index.js';

const TABLE = 'hype_posts';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createPost(data: ContentPostInsert): Promise<ContentPost> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create post: ${error.message}`);
  return row as ContentPost;
}

export async function getPostById(id: string): Promise<ContentPost | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get post: ${error.message}`);
  return (data as ContentPost) ?? null;
}

export interface ListPostsOptions {
  campaign_id?: string;
  platform?: Platform;
  engagement_level?: EngagementLevel;
  limit?: number;
  offset?: number;
}

export async function listPosts(opts: ListPostsOptions = {}): Promise<ContentPost[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.campaign_id) query = query.eq('campaign_id', opts.campaign_id);
  if (opts.platform) query = query.eq('platform', opts.platform);
  if (opts.engagement_level) query = query.eq('engagement_level', opts.engagement_level);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list posts: ${error.message}`);
  return (data as ContentPost[]) ?? [];
}

export async function updatePost(
  id: string,
  updates: Partial<ContentPostInsert> & {
    impressions?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    clicks?: number;
    engagement_level?: EngagementLevel;
  },
): Promise<ContentPost> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update post: ${error.message}`);
  return data as ContentPost;
}
