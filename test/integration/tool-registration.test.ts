import { describe, it, expect, vi } from 'vitest';
import { mockConfig } from '../helpers/fixtures.js';
import { createAllTools } from '../../src/core/tools/index.js';
import {
  createAddSourceTool,
  createListSourcesTool,
  createUpdateSourceTool,
  createRemoveSourceTool,
} from '../../src/core/tools/manage-sources.js';

// Mock the db module so tool creation does not require a live DB
vi.mock('../../src/core/db/index.js', () => ({
  initSupabase: vi.fn(),
  getSupabase: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    storage: { from: vi.fn().mockReturnThis() },
  })),
  resetSupabase: vi.fn(),
  getTenant: vi.fn(),
  ensureTenant: vi.fn(),
  createSource: vi.fn(),
  getSource: vi.fn(),
  listSources: vi.fn(),
  updateSource: vi.fn(),
  deleteSource: vi.fn(),
  updateSourceFetchStatus: vi.fn(),
  upsertItem: vi.fn(),
  upsertItems: vi.fn(),
  listItems: vi.fn(),
  getItemsForDigest: vi.fn(),
  updateItemStatus: vi.fn(),
  searchItems: vi.fn(),
  createDigest: vi.fn(),
  getLatestDigest: vi.fn(),
  listDigests: vi.fn(),
  createPublishLog: vi.fn(),
  updatePublishLog: vi.fn(),
  listPublishLogs: vi.fn(),
}));

describe('Tool registration', () => {
  it('creates 10 core tools', () => {
    const deps = {
      config: mockConfig,
      fetcherRegistry: new Map(),
      publisherRegistry: new Map(),
      transformerRegistry: new Map(),
    };

    const tools = createAllTools(deps);

    expect(tools).toHaveLength(10);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain('veille_add_source');
    expect(toolNames).toContain('veille_list_sources');
    expect(toolNames).toContain('veille_update_source');
    expect(toolNames).toContain('veille_remove_source');
    expect(toolNames).toContain('veille_fetch_now');
    expect(toolNames).toContain('veille_generate_digest');
    expect(toolNames).toContain('veille_transform_content');
    expect(toolNames).toContain('veille_publish');
    expect(toolNames).toContain('veille_search');
    expect(toolNames).toContain('veille_status');
  });

  it('creates the 4 source-management tools with correct names', () => {
    const deps = { config: mockConfig };

    const addTool = createAddSourceTool(deps);
    const listTool = createListSourcesTool(deps);
    const updateTool = createUpdateSourceTool(deps);
    const removeTool = createRemoveSourceTool(deps);

    expect(addTool.name).toBe('veille_add_source');
    expect(listTool.name).toBe('veille_list_sources');
    expect(updateTool.name).toBe('veille_update_source');
    expect(removeTool.name).toBe('veille_remove_source');
  });

  it('each tool has a description and execute function', () => {
    const deps = { config: mockConfig };

    const tools = [
      createAddSourceTool(deps),
      createListSourcesTool(deps),
      createUpdateSourceTool(deps),
      createRemoveSourceTool(deps),
    ];

    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.execute).toBe('function');
    }
  });
});
