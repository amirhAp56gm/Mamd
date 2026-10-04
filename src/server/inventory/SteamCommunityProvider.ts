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
  descriptions?: Array<{
    type: string;
    value: string;
    color?: string;
  }>;
  owner_descriptions?: Array<{
    type: string;
    value: string;
    color?: string;
  }>;
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

  private static readonly STEAM_CDN_BASE =
    'https://community.cloudflare.steamstatic.com/economy/image/';

  /**
   * Normalize Steam inventory response into the application's CS2Item format.
   */
  public normalizeInventoryData(
    data: SteamInventoryApiResponse,
    steamId: string
  ): CS2Item[] {
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const descriptions = Array.isArray(data.descriptions)
      ? data.descriptions
      : [];
    const assetProps = Array.isArray(data.asset_properties)
      ? data.asset_properties
      : [];

    // ---------------------------------------------------------
    // Asset properties
    // ---------------------------------------------------------

    const propMap = new Map<
      string,
      {
        float: number | null;
        paintSeed: number | null;
      }
    >();

    for (const container of assetProps) {
      if (!container || !container.assetid) continue;

      let floatVal: number | null = null;
      let seedVal: number | null = null;

      if (Array.isArray(container.asset_properties)) {
        for (const prop of container.asset_properties) {
          if (!prop) continue;

          // Wear Rating
          if (
            prop.name === 'Wear Rating' ||
            prop.propertyid === 2
          ) {
            if (
              prop.float_value !== undefined &&
              prop.float_value !== null
            ) {
              const parsed = parseFloat(String(prop.float_value));

              if (!Number.isNaN(parsed)) {
                floatVal = parsed;
              }
            }
          }

          // Pattern Template
          if (
            prop.name === 'Pattern Template' ||
            prop.propertyid === 1
          ) {
            if (
              prop.int_value !== undefined &&
              prop.int_value !== null
            ) {
              const parsed = parseInt(
                String(prop.int_value),
                10
              );

              if (!Number.isNaN(parsed)) {
                seedVal = parsed;
              }
            }
          }
        }
      }

      propMap.set(String(container.assetid), {
        float: floatVal,
        paintSeed: seedVal,
      });
    }

    // ---------------------------------------------------------
    // Description lookup
    // ---------------------------------------------------------

    const descMap = new Map<string, SteamDescription>();

    for (const desc of descriptions) {
      if (!desc || !desc.classid) continue;

      const instanceId = desc.instanceid || '0';

      const keyWithInstance =
        `${String(desc.classid)}_${String(instanceId)}`;

      descMap.set(keyWithInstance, desc);

      if (!descMap.has(String(desc.classid))) {
        descMap.set(String(desc.classid), desc);
      }
    }

    // ---------------------------------------------------------
    // Convert assets into CS2Item
    // ---------------------------------------------------------

    const normalizedItems: CS2Item[] = [];

    for (const asset of assets) {
      if (!asset || !asset.assetid) continue;

      const instanceId = asset.instanceid || '0';

      const keyWithInstance =
        `${String(asset.classid)}_${String(instanceId)}`;

      const desc =
        descMap.get(keyWithInstance) ||
        descMap.get(String(asset.classid));

      const props =
        propMap.get(String(asset.assetid)) || {
          float: null,
          paintSeed: null,
        };

      // -------------------------------------------------------
      // If description is missing
      // -------------------------------------------------------

      if (!desc) {
        normalizedItems.push({
          assetId: String(asset.assetid),
          classId: String(asset.classid),
          instanceId: String(instanceId),

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

      // -------------------------------------------------------
      // Tags
      // -------------------------------------------------------

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
            localized_category_name:
              tag.localized_category_name,
            localized_tag_name:
              tag.localized_tag_name,
            color: tag.color
              ? `#${tag.color}`
              : undefined,
          });

          if (tag.category === 'Rarity') {
            rarity = tag.localized_tag_name;

            if (tag.color) {
              rarityColor = `#${tag.color}`;
            }
          }

          if (tag.category === 'Exterior') {
            exterior = tag.localized_tag_name;
          }

          if (tag.category === 'Type') {
            itemType = tag.localized_tag_name;
          }

          if (tag.category === 'ItemSet') {
            collection = tag.localized_tag_name;
          }

          if (tag.category === 'Quality') {
            if (
              tag.internal_name === 'strange' ||
              tag.localized_tag_name
                ?.toLowerCase()
                .includes('stattrak')
            ) {
              isStatTrak = true;
            }

            if (
              tag.internal_name === 'tournament' ||
              tag.localized_tag_name
                ?.toLowerCase()
                .includes('souvenir')
            ) {
              isSouvenir = true;
            }
          }
        }
      }

      // -------------------------------------------------------
      // Fallback StatTrak / Souvenir detection
      // -------------------------------------------------------

      const marketName =
        desc.market_name ||
        desc.name ||
        '';

      const marketHashName =
        desc.market_hash_name ||
        marketName;

      const displayName =
        desc.name ||
        marketName ||
        marketHashName;

      if (
        marketHashName.includes('StatTrak™') ||
        displayName.includes('StatTrak™') ||
        (desc.type &&
          desc.type.includes('StatTrak™'))
      ) {
        isStatTrak = true;
      }

      if (
        marketHashName.includes('Souvenir') ||
        displayName.includes('Souvenir') ||
        (desc.type &&
          desc.type.includes('Souvenir'))
      ) {
        isSouvenir = true;
      }

      // -------------------------------------------------------
      // Inspect link
      // -------------------------------------------------------

      let inspectLink: string | null = null;

      if (
        Array.isArray(desc.actions) &&
        desc.actions.length > 0
      ) {
        const inspectAction = desc.actions.find(
          (action) =>
            action.name
              ?.toLowerCase()
              .includes('inspect') ||
            action.link?.includes('preview')
        );

        if (inspectAction?.link) {
          inspectLink = inspectAction.link
            .replace(
              '%owner_steamid%',
              steamId
            )
            .replace(
              '%assetid%',
              String(asset.assetid)
            );
        }
      }

      // -------------------------------------------------------
      // Icon URL
      // -------------------------------------------------------

      const rawIcon =
        desc.icon_url_large ||
        desc.icon_url;

      const iconUrl = rawIcon
        ? rawIcon.startsWith('http')
          ? rawIcon
          : `${SteamCommunityProvider.STEAM_CDN_BASE}${rawIcon}`
        : '';

      // -------------------------------------------------------
      // Tradable / Marketable
      // -------------------------------------------------------

      const isTradable =
        desc.tradable === 1 ||
        desc.tradable === true;

      const isMarketable =
        desc.marketable === 1 ||
        desc.marketable === true;

      // -------------------------------------------------------
      // Final item
      // -------------------------------------------------------

      normalizedItems.push({
        assetId: String(asset.assetid),
        classId: String(asset.classid),
        instanceId: String(instanceId),

        name: displayName,
        marketName,
        marketHashName,

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

        pattern:
          props.paintSeed !== null
            ? String(props.paintSeed)
            : null,

        price: null,
      });
    }

    return normalizedItems;
  }

  /**
   * Fetch CS2 inventory directly from Steam.
   *
   * Important:
   * - No extra profile request
   * - No session cookie request
   * - No count=2000 / count=1000 fallback
   * - Uses count=75
   * - Pagination only when Steam explicitly asks for it
   */
  public async getInventory(
    steamId: string
  ): Promise<InventoryResult> {
    // ---------------------------------------------------------
    // Validate SteamID64
    // ---------------------------------------------------------

    if (
      !steamId ||
      !/^\d{17,20}$/.test(steamId)
    ) {
      return {
        success: false,
        items: [],
        errorType: 'INVALID_STEAM_ID',
        message: 'شناسه استیم نامعتبر است.',
      };
    }

    const accumulatedAssets: SteamAsset[] = [];
    const accumulatedDescriptions: SteamDescription[] = [];
    const accumulatedAssetProps: SteamAssetPropertyContainer[] = [];

    let startAssetId: string | undefined;
    let reportedTotalCount: number | undefined;

    // Safety limit
    const maxPages = 50;

    try {
      // -------------------------------------------------------
      // Pagination
      // -------------------------------------------------------

      for (
        let page = 1;
        page <= maxPages;
        page++
      ) {
        let url =
          `https://steamcommunity.com/inventory/` +
          `${steamId}/` +
          `${SteamCommunityProvider.CS2_APP_ID}/` +
          `${SteamCommunityProvider.CS2_CONTEXT_ID}` +
          `?l=english&count=75`;

        if (startAssetId) {
          url += `&start_assetid=${encodeURIComponent(
            startAssetId
          )}`;
        }

        console.log(
          `[CS2] Steam inventory request page=${page}`
        );

        const controller =
          new AbortController();

        const timeout = setTimeout(
          () => controller.abort(),
          15000
        );

        let res: Response;

        try {
          res = await fetch(url, {
            method: 'GET',

            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',

              'Accept':
                'application/json,text/plain,*/*',

              'Accept-Language':
                'en-US,en;q=0.9',
            },

            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        // -----------------------------------------------------
        // Diagnostic information
        // -----------------------------------------------------

        console.log(
          '[CS2] Steam HTTP status:',
          res.status
        );

        console.log(
          '[CS2] Steam Content-Type:',
          res.headers.get('content-type')
        );

        // -----------------------------------------------------
        // HTTP errors
        // -----------------------------------------------------

        if (res.status === 429) {
          return {
            success: false,
            items: [],
            errorType: 'STEAM_RATE_LIMIT',
            message:
              'استیم موقتاً درخواست‌های سایت را محدود کرده است. لطفاً چند دقیقه بعد دوباره تلاش کنید.',
          };
        }

        if (res.status === 403) {
          return {
            success: false,
            items: [],
            errorType:
              'STEAM_PRIVATE_INVENTORY',
            message:
              'موجودی استیم شما عمومی نیست. برای نمایش آیتم‌ها، Inventory استیم خود را روی Public قرار دهید.',
          };
        }

        if (res.status >= 500) {
          return {
            success: false,
            items: [],
            errorType:
              'STEAM_UNAVAILABLE',
            message:
              'سرورهای Steam Community موقتاً در دسترس نیستند. لطفاً بعداً دوباره تلاش کنید.',
          };
        }

        if (!res.ok) {
          return {
            success: false,
            items: [],
            errorType:
              'STEAM_API_ERROR',
            message:
              `خطای دریافت موجودی از استیم. HTTP ${res.status}`,
          };
        }

        // -----------------------------------------------------
        // Parse JSON
        // -----------------------------------------------------

        let data: SteamInventoryApiResponse;

        try {
          data =
            (await res.json()) as SteamInventoryApiResponse;
        } catch {
          return {
            success: false,
            items: [],
            errorType:
              'INVALID_STEAM_RESPONSE',
            message:
              'استیم پاسخ JSON معتبر ارسال نکرد.',
          };
        }

        // -----------------------------------------------------
        // Diagnostic information
        // -----------------------------------------------------

        console.log(
          '[CS2] Steam success:',
          data?.success
        );

        console.log(
          '[CS2] Steam total_inventory_count:',
          data?.total_inventory_count
        );

        console.log(
          '[CS2] Steam assets exists:',
          'assets' in data
        );

        console.log(
          '[CS2] Steam assets count:',
          Array.isArray(data?.assets)
            ? data.assets.length
            : 'NOT_ARRAY'
        );

        console.log(
          '[CS2] Steam descriptions count:',
          Array.isArray(data?.descriptions)
            ? data.descriptions.length
            : 'NOT_ARRAY'
        );

        console.log(
          '[CS2] Steam more_items:',
          data?.more_items
        );

        console.log(
          '[CS2] Steam last_assetid:',
          data?.last_assetid
        );

        // -----------------------------------------------------
        // Invalid response
        // -----------------------------------------------------

        if (
          !data ||
          typeof data !== 'object'
        ) {
          return {
            success: false,
            items: [],
            errorType:
              'INVALID_STEAM_RESPONSE',
            message:
              'پاسخ دریافتی از Steam معتبر نیست.',
          };
        }

        // -----------------------------------------------------
        // Steam reported an error
        // -----------------------------------------------------

        if (
          data.success === 0 ||
          data.success === false
        ) {
          const errorText =
            String(data.error || '')
              .toLowerCase();

          if (
            errorText.includes('private') ||
            errorText.includes('null')
          ) {
            return {
              success: false,
              items: [],
              errorType:
                'STEAM_PRIVATE_INVENTORY',
              message:
                'موجودی استیم شما عمومی نیست. Inventory خود را روی Public قرار دهید.',
            };
          }

          return {
            success: false,
            items: [],
            errorType:
              'STEAM_API_ERROR',
            message:
              data.error ||
              'استیم هنگام دریافت Inventory خطا برگرداند.',
          };
        }

        // -----------------------------------------------------
        // Total count
        // -----------------------------------------------------

        if (
          typeof data.total_inventory_count ===
          'number'
        ) {
          reportedTotalCount =
            data.total_inventory_count;
        }

        // -----------------------------------------------------
        // IMPORTANT:
        // assets MUST exist.
        // Do not silently convert missing assets to [].
        // -----------------------------------------------------

        if (!Array.isArray(data.assets)) {
          if (
            typeof reportedTotalCount ===
              'number' &&
            reportedTotalCount > 0
          ) {
            return {
              success: false,
              items: [],
              errorType:
                'INVALID_STEAM_RESPONSE',
              message:
                `استیم وجود ${reportedTotalCount} آیتم در CS2 را گزارش کرد، اما آرایه assets در پاسخ ارسال نشده است.`,
              totalCount:
                reportedTotalCount,
            };
          }

          return {
            success: false,
            items: [],
            errorType:
              'INVALID_STEAM_RESPONSE',
            message:
              'پاسخ Steam فاقد آرایه assets است.',
          };
        }

        // -----------------------------------------------------
        // Accumulate current page
        // -----------------------------------------------------

        accumulatedAssets.push(
          ...data.assets
        );

        if (
          Array.isArray(data.descriptions)
        ) {
          accumulatedDescriptions.push(
            ...data.descriptions
          );
        }

        if (
          Array.isArray(
            data.asset_properties
          )
        ) {
          accumulatedAssetProps.push(
            ...data.asset_properties
          );
        }

        // -----------------------------------------------------
        // Pagination
        // -----------------------------------------------------

        if (
          data.more_items &&
          data.last_assetid
        ) {
          startAssetId =
            data.last_assetid;

          console.log(
            `[CS2] More items available. Next page starts at ${startAssetId}`
          );

          continue;
        }

        // No more pages
        break;
      }

      // -------------------------------------------------------
      // Normalize all received items
      // -------------------------------------------------------

      const fullResponse: SteamInventoryApiResponse =
        {
          assets: accumulatedAssets,
          descriptions:
            accumulatedDescriptions,
          asset_properties:
            accumulatedAssetProps,

          total_inventory_count:
            reportedTotalCount ??
            accumulatedAssets.length,

          success: 1,
        };

      const normalizedItems =
        this.normalizeInventoryData(
          fullResponse,
          steamId
        );

      console.log(
        '[CS2] Final inventory:',
        {
          steamTotal:
            reportedTotalCount,
          assets:
            accumulatedAssets.length,
          descriptions:
            accumulatedDescriptions.length,
          assetProperties:
            accumulatedAssetProps.length,
          normalized:
            normalizedItems.length,
        }
      );

      // -------------------------------------------------------
      // Successful inventory
      // -------------------------------------------------------

      if (normalizedItems.length > 0) {
        return {
          success: true,
          items: normalizedItems,
          totalCount:
            normalizedItems.length,
        };
      }

      // -------------------------------------------------------
      // Truly empty inventory
      // -------------------------------------------------------

      if (
        accumulatedAssets.length === 0 &&
        (
          reportedTotalCount === 0 ||
          reportedTotalCount === undefined
        )
      ) {
        return {
          success: true,
          items: [],
          errorType:
            'EMPTY_INVENTORY',
          message:
            'موجودی CS2 شما خالی است.',
          totalCount: 0,
        };
      }

      // -------------------------------------------------------
      // Steam said there are items but no usable items
      // -------------------------------------------------------

      return {
        success: false,
        items: [],
        errorType:
          'INVALID_STEAM_RESPONSE',
        message:
          `استیم تعداد ${reportedTotalCount ?? accumulatedAssets.length} آیتم را گزارش کرد، اما اطلاعات قابل استفاده آیتم‌ها دریافت نشد.`,
        totalCount:
          reportedTotalCount ??
          accumulatedAssets.length,
      };
    } catch (err: any) {
      // -------------------------------------------------------
      // Timeout
      // -------------------------------------------------------

      if (
        err?.name === 'AbortError'
      ) {
        return {
          success: false,
          items: [],
          errorType:
            'NETWORK_ERROR',
          message:
            'زمان اتصال به سرور استیم به پایان رسید. لطفاً دوباره تلاش کنید.',
        };
      }

      console.error(
        '[SteamCommunityProvider] Inventory error:',
        err
      );

      return {
        success: false,
        items: [],
        errorType:
          'NETWORK_ERROR',
        message:
          'خطای شبکه در ارتباط با سرور استیم رخ داد.',
      };
    }
  }
}