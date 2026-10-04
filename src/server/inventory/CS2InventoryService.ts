import { CS2InventoryProvider } from './CS2InventoryProvider.js';
import { SteamCommunityProvider } from './SteamCommunityProvider.js';
import { InventoryResult } from '../../types/index.js';

interface CacheEntry {
  result: InventoryResult;
  timestamp: number;
}

export class CS2InventoryService {
  private provider: CS2InventoryProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private inFlightRequests: Map<string, Promise<InventoryResult>> = new Map();
  private lastRefreshRequests: Map<string, number> = new Map();

  // Cache TTL: 3 minutes
  private static readonly CACHE_TTL_MS = 3 * 60 * 1000;
  // Manual refresh cooldown: 10 seconds
  private static readonly REFRESH_COOLDOWN_MS = 10 * 1000;

  constructor(customProvider?: CS2InventoryProvider) {
    this.provider = customProvider || new SteamCommunityProvider();
  }

  /**
   * Sets a custom inventory provider (e.g. for future external provider integration)
   */
  public setProvider(provider: CS2InventoryProvider): void {
    this.provider = provider;
  }

  /**
   * Gets current provider name
   */
  public getProviderName(): string {
    return this.provider ? this.provider.name : 'none';
  }

  /**
   * Retrieves CS2 inventory for a steamId with caching and deduplication.
   */
  public async getInventory(steamId: string, forceRefresh = false): Promise<InventoryResult> {
    if (!this.provider) {
      return {
        success: false,
        items: [],
        errorType: 'NOT_CONFIGURED',
        message: 'سرویس دریافت موجودی هنوز پیکربندی نشده است.',
      };
    }

    const now = Date.now();

    // Check manual refresh cooldown
    if (forceRefresh) {
      const lastRefresh = this.lastRefreshRequests.get(steamId) || 0;
      if (now - lastRefresh < CS2InventoryService.REFRESH_COOLDOWN_MS) {
        // Return existing cache if refreshed too quickly
        const cached = this.cache.get(steamId);
        if (cached) {
          return {
            ...cached.result,
            cached: true,
            cachedAt: new Date(cached.timestamp).toISOString(),
          };
        }
      }
      this.lastRefreshRequests.set(steamId, now);
      this.cache.delete(steamId);
    } else {
      // Check cache
      const cached = this.cache.get(steamId);
      if (cached && now - cached.timestamp < CS2InventoryService.CACHE_TTL_MS) {
        return {
          ...cached.result,
          cached: true,
          cachedAt: new Date(cached.timestamp).toISOString(),
        };
      }
    }

    // Deduplicate concurrent requests
    const inFlight = this.inFlightRequests.get(steamId);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = (async () => {
      try {
        const result = await this.provider.getInventory(steamId);

        if (result.success) {
          this.cache.set(steamId, {
            result,
            timestamp: Date.now(),
          });
        }

        return result;
      } finally {
        this.inFlightRequests.delete(steamId);
      }
    })();

    this.inFlightRequests.set(steamId, fetchPromise);
    return fetchPromise;
  }

  /**
   * Clears cache for a specific user or completely.
   */
  public clearCache(steamId?: string): void {
    if (steamId) {
      this.cache.delete(steamId);
      this.lastRefreshRequests.delete(steamId);
    } else {
      this.cache.clear();
      this.lastRefreshRequests.clear();
    }
  }
}

export const cs2InventoryService = new CS2InventoryService();
