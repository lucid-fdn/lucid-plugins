// ---------------------------------------------------------------------------
// mocks.ts -- Mock providers and utilities for tests
// ---------------------------------------------------------------------------

import type { SeoProvider, SeoProviderRegistry } from '../../src/core/types/provider.js';

export function createMockProviderRegistry(providers: SeoProvider[] = []): SeoProviderRegistry {
  return {
    providers,
    getConfigured: () => providers.filter((p) => p.isConfigured()),
    getKeywordProvider: () => providers.find((p) => p.isConfigured() && p.getKeywordData) ?? null,
    getSerpProvider: () => providers.find((p) => p.isConfigured() && p.getSerpResults) ?? null,
    getBacklinkProvider: () => providers.find((p) => p.isConfigured() && p.getBacklinks) ?? null,
    getAuthorityProvider: () => providers.find((p) => p.isConfigured() && p.getDomainAuthority) ?? null,
  };
}

export function createMockConfig() {
  return {
    supabaseUrl: 'http://localhost:54321',
    supabaseKey: 'test-key',
    tenantId: 'default',
    crawlSchedule: '0 3 * * 0',
  };
}
