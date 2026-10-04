import { InventoryResult } from '../../types/index.js';

export interface CS2InventoryProvider {
  /**
   * Unique name of the provider (e.g. 'steam_community', 'third_party_provider')
   */
  readonly name: string;

  /**
   * Fetches the user's real CS2 inventory.
   * @param steamId 64-bit Steam ID
   */
  getInventory(steamId: string): Promise<InventoryResult>;
}
