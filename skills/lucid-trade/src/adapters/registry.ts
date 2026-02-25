// ---------------------------------------------------------------------------
// adapters/registry.ts -- AdapterRegistry: register & query exchange adapters
// ---------------------------------------------------------------------------

import type { ExchangeId, ExchangeCapability } from '../types/index.js';
import type { IExchangeAdapter } from './types.js';

/**
 * Central registry for exchange adapters.
 *
 * Adapters self-declare their capabilities on registration. Consumers can
 * query by exchange ID or filter by capability (e.g. "give me all adapters
 * that support perpetual funding rates").
 */
export class AdapterRegistry {
  private readonly adapters = new Map<ExchangeId, IExchangeAdapter>();

  /** Register an adapter. Overwrites any previous adapter for the same exchange. */
  register(adapter: IExchangeAdapter): void {
    this.adapters.set(adapter.exchangeId, adapter);
  }

  /** Retrieve adapter by exchange ID, or undefined if not registered. */
  get(exchangeId: ExchangeId): IExchangeAdapter | undefined {
    return this.adapters.get(exchangeId);
  }

  /** List all registered adapters. */
  list(): IExchangeAdapter[] {
    return [...this.adapters.values()];
  }

  /** Return adapters that have a specific capability. */
  withCapability(capability: ExchangeCapability): IExchangeAdapter[] {
    return this.list().filter((a) => a.capabilities.has(capability));
  }

  /** Number of registered adapters. */
  get size(): number {
    return this.adapters.size;
  }
}
