declare module '@tryghost/admin-api' {
  interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
  }

  interface GhostPost {
    id: string;
    url?: string;
    title?: string;
    html?: string;
    status?: string;
    [key: string]: unknown;
  }

  interface PostsAPI {
    add(
      data: { title: string; html: string; status: string },
      options?: { source?: string },
    ): Promise<GhostPost>;
    edit(data: Partial<GhostPost> & { id: string }): Promise<GhostPost>;
    browse(options?: Record<string, unknown>): Promise<GhostPost[]>;
    read(data: { id: string } | { slug: string }): Promise<GhostPost>;
    delete(data: { id: string }): Promise<void>;
  }

  class GhostAdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: PostsAPI;
  }

  export default GhostAdminAPI;
}
