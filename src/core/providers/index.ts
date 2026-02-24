// ---------------------------------------------------------------------------
// index.ts -- Provider registry
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/config.js';
import type { SeoProvider, SeoProviderRegistry } from '../types/provider.js';
import { SemrushProvider } from './semrush.js';
import { AhrefsProvider } from './ahrefs.js';
import { MozProvider } from './moz.js';
import { SerpApiProvider } from './serpapi.js';
import { log } from '../utils/logger.js';

export function createProviderRegistry(config: PluginConfig): SeoProviderRegistry {
  const providers: SeoProvider[] = [
    new SemrushProvider(config),
    new AhrefsProvider(config),
    new MozProvider(config),
    new SerpApiProvider(config),
  ];

  const configured = providers.filter((p) => p.isConfigured());
  log.info(`Provider registry: ${configured.length}/${providers.length} providers configured`);

  return {
    providers,

    getConfigured(): SeoProvider[] {
      return providers.filter((p) => p.isConfigured());
    },

    getKeywordProvider(): SeoProvider | null {
      return providers.find((p) => p.isConfigured() && p.getKeywordData) ?? null;
    },

    getSerpProvider(): SeoProvider | null {
      return providers.find((p) => p.isConfigured() && p.getSerpResults) ?? null;
    },

    getBacklinkProvider(): SeoProvider | null {
      return providers.find((p) => p.isConfigured() && p.getBacklinks) ?? null;
    },

    getAuthorityProvider(): SeoProvider | null {
      return providers.find((p) => p.isConfigured() && p.getDomainAuthority) ?? null;
    },
  };
}

export { SemrushProvider } from './semrush.js';
export { AhrefsProvider } from './ahrefs.js';
export { MozProvider } from './moz.js';
export { SerpApiProvider } from './serpapi.js';
export { BaseProvider } from './base.js';
