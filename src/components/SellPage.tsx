import React, { useState, useMemo } from 'react';
import { User, CS2Item, InventoryResult } from '../types/index.js';
import { TradeUrlCard } from './TradeUrlCard.js';
import { InventoryToolbar, CategoryFilterType, SortOptionType } from './InventoryToolbar.js';
import { InventoryCard } from './InventoryCard.js';
import { InventoryStatus } from './InventoryStatus.js';
import { SelectedItemsBar } from './SelectedItemsBar.js';
import { ItemDetailModal } from './ItemDetailModal.js';
import { SteamLoginButton } from './SteamLoginButton.js';
import { 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

interface SellPageProps {
  user: User | null;
  inventoryResult: InventoryResult | null;
  isLoadingInventory: boolean;
  onRefreshInventory: () => void;
  onSaveTradeUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  selectedItems: CS2Item[];
  onToggleSelectItem: (item: CS2Item) => void;
  onSelectAllFiltered: (items: CS2Item[]) => void;
  onClearSelection: () => void;
  onSaveToSellList: () => Promise<boolean>;
  onViewSelectedList: () => void;
}

export const SellPage: React.FC<SellPageProps> = ({
  user,
  inventoryResult,
  isLoadingInventory,
  onRefreshInventory,
  onSaveTradeUrl,
  selectedItems,
  onToggleSelectItem,
  onSelectAllFiltered,
  onClearSelection,
  onSaveToSellList,
  onViewSelectedList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>('all');
  const [sortOption, setSortOption] = useState<SortOptionType>('default');
  const [detailItem, setDetailItem] = useState<CS2Item | null>(null);

  // Set of selected asset IDs for O(1) lookups
  const selectedAssetIds = useMemo(() => {
    return new Set(selectedItems.map((i) => i.assetId));
  }, [selectedItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!inventoryResult || !inventoryResult.items) return [];

    let list = [...inventoryResult.items];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const hashMatch = item.marketHashName.toLowerCase().includes(q);
        const typeMatch = item.type ? item.type.toLowerCase().includes(q) : false;
        return nameMatch || hashMatch || typeMatch;
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((item) => {
        const typeStr = (item.type || '').toLowerCase();
        const nameStr = (item.name || '').toLowerCase();

        switch (selectedCategory) {
          case 'knife_glove':
            return (
              typeStr.includes('knife') ||
              typeStr.includes('glove') ||
              typeStr.includes('چاقو') ||
              typeStr.includes('دستکش') ||
              nameStr.includes('★')
            );
          case 'rifle_sniper':
            return (
              typeStr.includes('rifle') ||
              typeStr.includes('sniper') ||
              nameStr.includes('ak-47') ||
              nameStr.includes('m4a4') ||
              nameStr.includes('m4a1-s') ||
              nameStr.includes('awp')
            );
          case 'pistol':
            return (
              typeStr.includes('pistol') ||
              nameStr.includes('usps') ||
              nameStr.includes('usp-s') ||
              nameStr.includes('glock') ||
              nameStr.includes('desert eagle') ||
              nameStr.includes('deagle')
            );
          case 'container_sticker':
            return (
              typeStr.includes('container') ||
              typeStr.includes('case') ||
              typeStr.includes('sticker') ||
              typeStr.includes('کپسول') ||
              typeStr.includes('استیکر') ||
              typeStr.includes('جعبه')
            );
          case 'stattrak':
            return item.statTrak === true;
          case 'tradable':
            return item.tradable === true;
          default:
            return true;
        }
      });
    }

    // Sort
    if (sortOption === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'rarity_desc') {
      const rarityRank: Record<string, number> = {
        Contraband: 8,
        Extraordinary: 7,
        Covert: 6,
        Classified: 5,
        Restricted: 4,
        'Mil-Spec Grade': 3,
        'Industrial Grade': 2,
        'Consumer Grade': 1,
      };
      list.sort((a, b) => {
        const rankA = a.rarity ? (rarityRank[a.rarity] || 0) : 0;
        const rankB = b.rarity ? (rarityRank[b.rarity] || 0) : 0;
        return rankB - rankA;
      });
    }

    return list;
  }, [inventoryResult, searchQuery, selectedCategory, sortOption]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <InventoryStatus state="unauthenticated" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* User Header Profile Banner */}
      <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.steamAvatar}
              alt={user.steamName}
              className="w-16 h-16 rounded-xl border-2 border-[#BACAff]/30 object-cover shadow-lg"
            />
            <div className="absolute -bottom-1 -left-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#12141A]" title="متصل به استیم" />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#F5F5F5]">{user.steamName}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#BACAff] bg-[#BACAff]/10 border border-[#BACAff]/20 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                احراز هویت استیم
              </span>
            </div>
            
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#9CA3AF]">
              <span className="font-mono">SteamID64: <strong className="text-[#F5F5F5]">{user.steamId}</strong></span>
              <a
                href={`https://steamcommunity.com/profiles/${user.steamId}/inventory/#730_2`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#91A8F5] hover:text-[#BACAff] hover:underline flex items-center gap-1"
              >
                <span>مشاهده در استیم</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#0B0C10] border border-[#242832] px-4 py-2.5 rounded-xl self-stretch md:self-auto justify-between md:justify-start">
          <span>کل آیتم‌های موجودی:</span>
          <strong className="text-[#BACAff] font-bold text-sm">
            {inventoryResult?.totalCount ?? (isLoadingInventory ? '...' : 0)}
          </strong>
        </div>
      </div>

      {/* Trade URL configuration card */}
      <TradeUrlCard
        currentTradeUrl={user.tradeUrl}
        onSave={onSaveTradeUrl}
      />

      {/* Real Inventory Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#BACAff]" />
            <h3 className="text-base font-black text-[#F5F5F5]">موجودی واقعی اسکین‌های CS2</h3>
          </div>
          {inventoryResult?.cached && (
            <span className="text-[11px] text-[#9CA3AF]">
              ذخیره موقت ({new Date(inventoryResult.cachedAt || '').toLocaleTimeString('fa-IR')})
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoadingInventory && (
          <InventoryStatus state="loading" />
        )}

        {/* Error / Empty State */}
        {!isLoadingInventory && inventoryResult && (!inventoryResult.success || inventoryResult.items.length === 0) && (
          <InventoryStatus
            state="error"
            errorType={inventoryResult.errorType}
            errorMessage={inventoryResult.message}
            onRetry={onRefreshInventory}
            steamId={user.steamId}
          />
        )}

        {/* Successful inventory items display */}
        {!isLoadingInventory && inventoryResult && inventoryResult.success && inventoryResult.items.length > 0 && (
          <div>
            {/* Toolbar for Search, Filter, Sort, Select all */}
            <InventoryToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortOption={sortOption}
              setSortOption={setSortOption}
              onRefresh={onRefreshInventory}
              isRefreshing={isLoadingInventory}
              totalCount={inventoryResult.items.length}
              filteredCount={filteredAndSortedItems.length}
              selectedCount={selectedItems.length}
              onSelectAllFiltered={() => onSelectAllFiltered(filteredAndSortedItems)}
              onDeselectAll={onClearSelection}
            />

            {/* Inventory Grid */}
            {filteredAndSortedItems.length === 0 ? (
              <div className="bg-[#12141A] border border-[#242832] rounded-xl p-8 text-center my-6">
                <p className="text-xs text-[#9CA3AF]">
                  هیچ اسکینی با فیلترها یا عبارت جستجوی وارد شده یافت نشد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {filteredAndSortedItems.map((item) => (
                  <InventoryCard
                    key={item.assetId}
                    item={item}
                    isSelected={selectedAssetIds.has(item.assetId)}
                    onToggleSelect={onToggleSelectItem}
                    onOpenDetails={setDetailItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Bar for Selected Items */}
      <SelectedItemsBar
        selectedItems={selectedItems}
        onClearSelection={onClearSelection}
        onSaveToSellList={onSaveToSellList}
        onViewSelectedList={onViewSelectedList}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        isSelected={detailItem ? selectedAssetIds.has(detailItem.assetId) : false}
        onToggleSelect={onToggleSelectItem}
      />
    </div>
  );
};
