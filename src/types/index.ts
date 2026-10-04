export interface User {
  id: string;
  steamId: string;
  steamName: string;
  steamAvatar: string;
  tradeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CS2ItemTag {
  category: string;
  internal_name: string;
  localized_category_name: string;
  localized_tag_name: string;
  color?: string;
}

export interface CS2Item {
  assetId: string;
  classId: string;
  instanceId: string;
  name: string;
  marketName?: string;
  marketHashName: string;
  iconUrl: string;
  rarity: string | null;
  rarityColor: string | null;
  exterior: string | null;
  type: string | null;
  statTrak: boolean;
  souvenir: boolean;
  tradable: boolean;
  marketable: boolean;
  tradableAfter?: string | null;
  tags?: CS2ItemTag[];
  
  // Extension points for future providers (float/inspect/paint/stickers)
  float?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  inspectLink?: string | null;
  stickers?: Array<{ name: string; iconUrl: string; slot?: number }> | null;
  collection?: string | null;
  phase?: string | null;
  pattern?: string | null;
  price?: number | null;
}

export type InventoryErrorType = 
  | 'EMPTY_INVENTORY'
  | 'STEAM_PRIVATE_INVENTORY'
  | 'PRIVATE_INVENTORY'
  | 'STEAM_RATE_LIMIT'
  | 'RATE_LIMITED'
  | 'STEAM_API_ERROR'
  | 'STEAM_ERROR'
  | 'INVALID_STEAM_RESPONSE'
  | 'STEAM_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'NOT_CONFIGURED'
  | 'INVALID_STEAM_ID';

export interface InventoryResult {
  success: boolean;
  items: CS2Item[];
  cached?: boolean;
  cachedAt?: string;
  errorType?: InventoryErrorType;
  message?: string;
  totalCount?: number;
}

export interface SelectedItem {
  id: string;
  userId: string;
  assetId: string;
  classId: string;
  instanceId: string;
  marketHashName: string;
  itemName: string;
  iconUrl: string;
  rarity: string | null;
  exterior: string | null;
  statTrak: boolean;
  souvenir: boolean;
  tradable: boolean;
  createdAt: string;
}
