// ---------------------------------------------------------------------------
// index.ts -- Provider registry
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry, AnalyticsProvider } from '../types/provider.js';
import { MixpanelProvider } from './mixpanel.js';
import { AmplitudeProvider } from './amplitude.js';
import { PosthogProvider } from './posthog.js';
import { GoogleAnalyticsProvider } from './google-analytics.js';
import { log } from '../utils/logger.js';

export function createProviderRegistry(config: PluginConfig): ProviderRegistry {
  const providers: AnalyticsProvider[] = [
    new MixpanelProvider(config),
    new AmplitudeProvider(config),
    new PosthogProvider(config),
    new GoogleAnalyticsProvider(config),
  ];

  const configured = providers.filter((p) => p.isConfigured());
  log.info(`Provider registry: ${configured.length}/${providers.length} providers configured`);

  return {
    providers,

    getConfigured(): AnalyticsProvider[] {
      return providers.filter((p) => p.isConfigured());
    },
  };
}

export { MixpanelProvider } from './mixpanel.js';
export { AmplitudeProvider } from './amplitude.js';
export { PosthogProvider } from './posthog.js';
export { GoogleAnalyticsProvider } from './google-analytics.js';
export { BaseProvider } from './base.js';
