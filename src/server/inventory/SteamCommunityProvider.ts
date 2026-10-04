import { CS2InventoryProvider } from './CS2InventoryProvider.js';
import { CS2Item, CS2ItemTag, InventoryResult } from '../../types/index.js';

interface SteamAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount?: string;
}

interface SteamDescriptionTag {
  category: string;
  internal_name: string;
  localized_category_name: string;
  localized_tag_name: string;
  color?: string;
}

interface SteamDescriptionAction {
  link: string;
  name: string;
}

interface SteamDescription {
  appid: number;
  classid: string;
  instanceid: string;
  icon_url: string;
  icon_url_large?: string;
  name: string;
  market_name?: string;
  market_hash_name: string;
  type?: string;
  tradable: number | boolean;
  marketable: number | boolean;
  tags?: SteamDescriptionTag[];
  actions?: SteamDescriptionAction[];
  descriptions?: Array<{ type: string; value: string; color?: string }>;
  owner_descriptions?: Array<{ type: string; value: string; color?: string }>;
}

interface SteamAssetPropertyItem {
  propertyid: number;
  int_value?: string | number;
  float_value?: string | number;
  name: string;
}

interface SteamAssetPropertyContainer {
  appid: number;
  contextid: string;
  assetid: string;
  asset_properties?: SteamAssetPropertyItem[];
}

interface SteamInventoryApiResponse {
  assets?: SteamAsset[];
  descriptions?: SteamDescription[];
  asset_properties?: SteamAssetPropertyContainer[];
  total_inventory_count?: number;
  success?: number | boolean;
  error?: string;
  rwgrsn?: number;
  more_items?: number;
  last_assetid?: string;
}

export class SteamCommunityProvider implements CS2InventoryProvider {
  public readonly name = 'steam_community';

  private static readonly CS2_APP_ID = 730;
  private static readonly CS2_CONTEXT_ID = 2;
  private static readonly STEAM_CDN_BASE = 'https://community.cloudflare.steamstatic.com/economy/image/';

  /**
   * Helper to acquire an anonymous Steam session cookie without splitting date strings in Set-Cookie
   */
  private async getSteamSessionCookies(steamId: string): Promise<string> {
    try {
      const pageUrl = `https://steamcommunity.com/profiles/${steamId}/inventory/`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      // Extract cookies cleanly without breaking commas inside Expires dates
      const cookiePairs: string[] = [];

      // Use getSetCookie() if available (Node 18.14.0+)
      if (typeof res.headers.getSetCookie === 'function') {
        const rawList = res.headers.getSetCookie();
        for (const raw of rawList) {
          const match = raw.match(/^\s*([^=;]+)=([^;]+)/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim();
            if (!['expires', 'path', 'domain', 'samesite', 'secure', 'httponly', 'max-age'].includes(key.toLowerCase())) {
              cookiePairs.push(`${key}=${val}`);
            }
          }
        }
      } else {
        const header = res.headers.get('set-cookie');
        if (header) {
          const matches = header.matchAll(/([a-zA-Z0-9_-]+)=([^;,\s]+)/g);
          for (const m of matches) {
            const key = m[1].trim();
            const val = m[2].trim();
            if (!['expires', 'path', 'domain', 'samesite', 'secure', 'httponly', 'max-age'].includes(key.toLowerCase())) {
              cookiePairs.push(`${key}=${val}`);
            }
          }
        }
      }

      if (cookiePairs.length > 0) {
        return cookiePairs.join('; ');
      }
    } catch {
      // Ignore cookie fetch failure and proceed
    }
    return '';
  }

  /**
   * Normalizes raw Steam API data into clean CS2Item models
   */
  public normalizeInventoryData(data: SteamInventoryApiResponse, steamId: string): CS2Item[] {
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const descriptions = Array.isArray(data.descriptions) ? data.descriptions : [];
    const assetProps = Array.isArray(data.asset_properties) ? data.asset_properties : [];

    // 1. Index Asset Properties by assetid
    const propMap = new Map<string, { float: number | null; paintSeed: number | null }>();
    for (const container of assetProps) {
      if (!container || !container.assetid) continue;
      let floatVal: number | null = null;
      let seedVal: number | null = null;

      if (Array.isArray(container.asset_properties)) {
        for (const prop of container.asset_properties) {
          if (!prop) continue;
          // Wear Rating -> float
          if (prop.name === 'Wear Rating' || prop.propertyid === 2) {
            if (prop.float_value !== undefined && prop.float_value !== null) {
              const parsed = parseFloat(String(prop.float_value));
              if (!isNaN(parsed)) floatVal = parsed;
            }
          }
          // Pattern Template -> paintSeed
          else if (prop.name === 'Pattern Template' || prop.propertyid === 1) {
            if (prop.int_value !== undefined && prop.int_value !== null) {
              const parsed = parseInt(String(prop.int_value), 10);
              if (!isNaN(parsed)) seedVal = parsed;
            }
          }
        }
      }

      propMap.set(String(container.assetid), { float: floatVal, paintSeed: seedVal });
    }

    // 2. Index Descriptions by classid_instanceid and classid
    const descMap = new Map<string, SteamDescription>();
    for (const desc of descriptions) {
      if (!desc || !desc.classid) continue;
      const keyWithInstance = `${desc.classid}_${desc.instanceid || '0'}`;
      descMap.set(keyWithInstance, desc);
      if (!descMap.has(String(desc.classid))) {
        descMap.set(String(desc.classid), desc);
      }
    }

    // 3. Normalize each asset into a CS2Item
    const normalizedItems: CS2Item[] = [];

    for (const asset of assets) {
      if (!asset || !asset.assetid) continue;

      const keyWithInstance = `${asset.classid}_${asset.instanceid || '0'}`;
      const desc = descMap.get(keyWithInstance) || descMap.get(String(asset.classid));
      const props = propMap.get(String(asset.assetid)) || { float: null, paintSeed: null };

      if (!desc) {
        normalizedItems.push({
          assetId: String(asset.assetid),
          classId: String(asset.classid),
          instanceId: String(asset.instanceid || '0'),
          name: `CS2 Item #${asset.classid}`,
          marketHashName: `CS2 Item #${asset.classid}`,
          iconUrl: '',
          rarity: null,
          rarityColor: null,
          exterior: null,
          type: null,
          statTrak: false,
          souvenir: false,
          tradable: true,
          marketable: true,
          float: props.float,
          paintSeed: props.paintSeed,
        });
        continue;
      }

      // Parse tags
      let rarity: string | null = null;
      let rarityColor: string | null = null;
      let exterior: string | null = null;
      let itemType: string | null = desc.type || null;
      let collection: string | null = null;
      let isStatTrak = false;
      let isSouvenir = false;

      const parsedTags: CS2ItemTag[] = [];

      if (Array.isArray(desc.tags)) {
        for (const tag of desc.tags) {
          if (!tag) continue;
          parsedTags.push({
            category: tag.category,
            internal_name: tag.internal_name,
            localized_category_name: tag.localized_category_name,
            localized_tag_name: tag.localized_tag_name,
            color: tag.color ? `#${tag.color}` : undefined,
          });

          if (tag.category === 'Rarity') {
            rarity = tag.localized_tag_name;
            if (tag.color) {
              rarityColor = `#${tag.color}`;
            }
          } else if (tag.category === 'Exterior') {
            exterior = tag.localized_tag_name;
          } else if (tag.category === 'Type') {
            itemType = tag.localized_tag_name;
          } else if (tag.category === 'ItemSet') {
            collection = tag.localized_tag_name;
          } else if (tag.category === 'Quality') {
            if (tag.internal_name === 'strange' || tag.localized_tag_name?.includes('StatTrak')) {
              isStatTrak = true;
            } else if (tag.internal_name === 'tournament' || tag.localized_tag_name?.includes('Souvenir')) {
              isSouvenir = true;
            }
          }
        }
      }

      // Fallback detection for StatTrak and Souvenir
      const marketName = desc.market_name || desc.name || '';
      const marketHashName = desc.market_hash_name || marketName;
      const displayName = desc.name || marketName || marketHashName;

      if (marketHashName.includes('StatTrak™') || displayName.includes('StatTrak™') || (desc.type && desc.type.includes('StatTrak™'))) {
        isStatTrak = true;
      }
      if (marketHashName.includes('Souvenir') || displayName.includes('Souvenir') || (desc.type && desc.type.includes('Souvenir'))) {
        isSouvenir = true;
      }

      // Inspect Link
      let inspectLink: string | null = null;
      if (Array.isArray(desc.actions) && desc.actions.length > 0) {
        const inspectAction = desc.actions.find((a) => a.name?.toLowerCase().includes('inspect') || a.link?.includes('preview'));
        if (inspectAction?.link) {
          inspectLink = inspectAction.link
            .replace('%owner_steamid%', steamId)
            .replace('%assetid%', String(asset.assetid));
        }
      }

      // Icon URL
      const rawIcon = desc.icon_url_large || desc.icon_url;
      const iconUrl = rawIcon
        ? (rawIcon.startsWith('http') ? rawIcon : `${SteamCommunityProvider.STEAM_CDN_BASE}${rawIcon}`)
        : '';

      const isTradable = desc.tradable === 1 || desc.tradable === true;
      const isMarketable = desc.marketable === 1 || desc.marketable === true;

      normalizedItems.push({
        assetId: String(asset.assetid),
        classId: String(asset.classid),
        instanceId: String(asset.instanceid || '0'),
        name: displayName,
        marketName: marketName,
        marketHashName: marketHashName,
        iconUrl,
        rarity,
        rarityColor,
        exterior,
        type: itemType,
        collection,
        statTrak: isStatTrak,
        souvenir: isSouvenir,
        tradable: isTradable,
        marketable: isMarketable,
        tags: parsedTags,
        inspectLink,
        float: props.float,
        paintSeed: props.paintSeed,
        paintIndex: null,
        stickers: null,
        phase: null,
        pattern: props.paintSeed ? String(props.paintSeed) : null,
        price: null,
      });
    }

    return normalizedItems;
  }

  /**
   * Fetches CS2 inventory for a steamId with detailed error categorization
   */
  public async getInventory(steamId: string): Promise<InventoryResult> {
    if (!steamId || !/^\d{17,20}$/.test(steamId)) {
      return {
        success: false,
        items: [],
        errorType: 'INVALID_STEAM_ID',
        message: 'شناسه استیم نامعتبر است.',
      };
    }

    const sessionCookies = await this.getSteamSessionCookies(steamId);

    const countLimits = [2000, 1000, 75];
    let workingCount = countLimits[0];
    let startAssetId: string | undefined = undefined;
    let page = 0;
    const maxPages = 50; // Support full pagination with safety cap

    const accumulatedAssets: SteamAsset[] = [];
    const accumulatedDescriptions: SteamDescription[] = [];
    const accumulatedAssetProps: SteamAssetPropertyContainer[] = [];
    let reportedTotalCount: number | undefined = undefined;

    try {
      while (page < maxPages) {
        page++;

        let res: Response | null = null;
        let lastStatus = 0;

        for (const count of countLimits) {
          if (count > workingCount) continue;

          let url = `https://steamcommunity.com/inventory/${steamId}/${SteamCommunityProvider.CS2_APP_ID}/${SteamCommunityProvider.CS2_CONTEXT_ID}?l=english&count=${count}`;
          if (startAssetId) {
            url += `&start_assetid=${startAssetId}`;
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': `https://steamcommunity.com/profiles/${steamId}/inventory/`,
                'Cookie': sessionCookies,
                'X-Requested-With': 'XMLHttpRequest',
              },
              signal: controller.signal,
            });

            clearTimeout(timeout);
            lastStatus = response.status;

            if (response.status === 400) {
              continue;
            }

            res = response;
            workingCount = count;
            break;
          } catch (e: any) {
            clearTimeout(timeout);
            if (e?.name === 'AbortError') throw e;
          }
        }

        if (!res) {
          const fallbackUrl = `https://steamcommunity.com/inventory/${steamId}/${SteamCommunityProvider.CS2_APP_ID}/${SteamCommunityProvider.CS2_CONTEXT_ID}?l=english${startAssetId ? `&start_assetid=${startAssetId}` : ''}`;
          
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          
          res = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/javascript, */*; q=0.01',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': `https://steamcommunity.com/profiles/${steamId}/inventory/`,
              'Cookie': sessionCookies,
              'X-Requested-With': 'XMLHttpRequest',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          lastStatus = res.status;
        }

        // 1. Explicit HTTP Error Classification
        if (res.status === 403) {
          return {
            success: false,
            items: [],
            errorType: 'STEAM_PRIVATE_INVENTORY',
            message: 'موجودی استیم شما عمومی نیست. برای نمایش آیتم‌ها، Inventory استیم خود را روی Public قرار دهید.',
          };
        }

        if (res.status === 429) {
          return {
            success: false,
            items: [],
            errorType: 'STEAM_RATE_LIMIT',
            message: 'دریافت موجودی از استیم موقتاً محدود شده است (Rate Limit). لطفاً چند دقیقه بعد دوباره تلاش کنید.',
          };
        }

        if (res.status >= 500) {
          return {
            success: false,
            items: [],
            errorType: 'STEAM_UNAVAILABLE',
            message: 'سرورهای کامیونیتی استیم موقتاً در دسترس نیستند. لطفاً بعداً دوباره امتحان کنید.',
          };
        }

        if (!res.ok) {
          return {
            success: false,
            items: [],
            errorType: 'STEAM_API_ERROR',
            message: `خطای دریافت از استیم (کد وضعیت: ${res.status}).`,
          };
        }

        // 2. Parse JSON safely
        let data: SteamInventoryApiResponse;
        try {
          data = (await res.json()) as SteamInventoryApiResponse;
        } catch {
          return {
            success: false,
            items: [],
            errorType: 'INVALID_STEAM_RESPONSE',
            message: 'پاسخ دریافتی از سرور استیم ساختار نامعتبر دارد.',
          };
        }

        // Log diagnostic info (safe, without logging credentials)
        console.log('Steam status:', res.status);
        console.log('Steam content-type:', res.headers.get('content-type'));
        console.log('Steam response:', JSON.stringify(data, null, 2));

        if (!data || typeof data !== 'object') {
          return {
            success: false,
            items: [],
            errorType: 'INVALID_STEAM_RESPONSE',
            message: 'پاسخ دریافتی از سرور استیم نامعتبر است.',
          };
        }

        // 3. Steam error field check
        if (data.success === 0 || data.success === false) {
          if (data.error && (data.error.toLowerCase().includes('private') || data.error.toLowerCase().includes('null'))) {
            return {
              success: false,
              items: [],
              errorType: 'STEAM_PRIVATE_INVENTORY',
              message: 'موجودی استیم شما عمومی نیست. برای نمایش آیتم‌ها، Inventory استیم خود را روی Public قرار دهید.',
            };
          }
          return {
            success: false,
            items: [],
            errorType: 'STEAM_API_ERROR',
            message: data.error || 'دریافت موجودی با خطا مواجه شد.',
          };
        }

        if (typeof data.total_inventory_count === 'number') {
          reportedTotalCount = data.total_inventory_count;
        }

        // 4. Strict check: If assets field is missing or undefined
        if (data.assets === undefined) {
          // If total_inventory_count > 0, Steam acknowledged items exist in CS2 app profile, but didn't provide assets array in economy payload
          if (reportedTotalCount !== undefined && reportedTotalCount > 0) {
            return {
              success: false,
              items: [],
              errorType: 'INVALID_STEAM_RESPONSE',
              message: `استیم وجود ${reportedTotalCount} آیتم در CS2 را تأیید کرد اما آرایه جزئیات آیتم‌ها (assets) در پاسخ وب‌سرویس اقتصاد استیم ارائه نشد.`,
              totalCount: reportedTotalCount,
            };
          }

          // If assets is undefined and count is 0 or undefined, return INVALID_STEAM_RESPONSE rather than false EMPTY_INVENTORY
          return {
            success: false,
            items: [],
            errorType: 'INVALID_STEAM_RESPONSE',
            message: 'پاسخ دریافتی از استیم فاقد لیست دارایی‌ها (assets) بود.',
          };
        }

        const pageAssets = Array.isArray(data.assets) ? data.assets : [];
        const pageDescriptions = Array.isArray(data.descriptions) ? data.descriptions : [];
        const pageAssetProps = Array.isArray(data.asset_properties) ? data.asset_properties : [];

        accumulatedAssets.push(...pageAssets);
        accumulatedDescriptions.push(...pageDescriptions);
        accumulatedAssetProps.push(...pageAssetProps);

        if (data.more_items && data.last_assetid) {
          startAssetId = data.last_assetid;
        } else {
          break;
        }
      }

      // Aggregate full response object for normalization
      const fullResponse: SteamInventoryApiResponse = {
        assets: accumulatedAssets,
        descriptions: accumulatedDescriptions,
        asset_properties: accumulatedAssetProps,
        total_inventory_count: reportedTotalCount ?? accumulatedAssets.length,
        success: 1,
      };

      const normalizedItems = this.normalizeInventoryData(fullResponse, steamId);

      // Diagnostic logging (safe, no secrets)
      console.log(
        `[CS2InventoryProvider] Steam inventory fetch: success = 1, assets = ${accumulatedAssets.length}, descriptions = ${accumulatedDescriptions.length}, asset_properties = ${accumulatedAssetProps.length}, normalizedItems = ${normalizedItems.length}`
      );

      // Authoritative item list check: If items were found, return them
      if (normalizedItems.length > 0) {
        return {
          success: true,
          items: normalizedItems,
          totalCount: normalizedItems.length,
        };
      }

      // ONLY return EMPTY_INVENTORY if Steam explicitly returned an empty assets array AND total_inventory_count is 0
      if (accumulatedAssets.length === 0 && (reportedTotalCount === 0 || reportedTotalCount === undefined)) {
        return {
          success: true,
          items: [],
          errorType: 'EMPTY_INVENTORY',
          message: 'موجودی CS2 شما خالی است.',
          totalCount: 0,
        };
      }

      // If assets array was empty but total_inventory_count > 0
      return {
        success: false,
        items: [],
        errorType: 'INVALID_STEAM_RESPONSE',
        message: `استیم تعداد ${reportedTotalCount} آیتم را گزارش کرده اما داده‌های اسکین‌ها ارسال نشده است.`,
        totalCount: reportedTotalCount,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: false,
          items: [],
          errorType: 'NETWORK_ERROR',
          message: 'زمان اتصال به سرور استیم به پایان رسید (Timeout).',
        };
      }

      console.error(`[SteamCommunityProvider] Error fetching inventory for ${steamId}:`, err);
      return {
        success: false,
        items: [],
        errorType: 'NETWORK_ERROR',
        message: 'خطای شبکه در ارتباط با سرور استیم.',
      };
    }
  }
}
