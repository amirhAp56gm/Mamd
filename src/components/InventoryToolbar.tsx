import React from 'react';
import { Search, Filter, ArrowUpDown, RefreshCw, CheckSquare, Square } from 'lucide-react';

export type CategoryFilterType = 'all' | 'knife_glove' | 'rifle_sniper' | 'pistol' | 'container_sticker' | 'stattrak' | 'tradable';
export type SortOptionType = 'default' | 'name_asc' | 'name_desc' | 'rarity_desc';

interface InventoryToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryFilterType;
  setSelectedCategory: (cat: CategoryFilterType) => void;
  sortOption: SortOptionType;
  setSortOption: (sort: SortOptionType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
  onRefresh,
  isRefreshing,
  totalCount,
  filteredCount,
  selectedCount,
  onSelectAllFiltered,
  onDeselectAll,
}) => {
  const categories: Array<{ id: CategoryFilterType; label: string }> = [
    { id: 'all', label: 'همه آیتم‌ها' },
    { id: 'knife_glove', label: 'چاقو و دستکش' },
    { id: 'rifle_sniper', label: 'تفنگ و اسنایپر' },
    { id: 'pistol', label: 'کلت‌ها' },
    { id: 'container_sticker', label: 'کیس و استیکر' },
    { id: 'stattrak', label: 'StatTrak™' },
    { id: 'tradable', label: 'قابل معامله' },
  ];

  return (
    <div className="bg-[#12141A] border border-[#242832] rounded-xl p-4 mb-6 space-y-4">
      {/* Top row: Search, Sort, Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام اسکین (مانند AK-47, AWP, Printstream...)"
            className="w-full pl-3.5 pr-10 py-2 bg-[#0B0C10] border border-[#242832] rounded-lg text-xs text-[#F5F5F5] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#91A8F5] transition-colors"
          />
        </div>

        {/* Sort & Refresh controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOptionType)}
              className="appearance-none bg-[#0B0C10] border border-[#242832] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#91A8F5] cursor-pointer"
            >
              <option value="default">ترتیب پیش‌فرض</option>
              <option value="rarity_desc">بر اساس کمیابی و ارزش</option>
              <option value="name_asc">نام (الف تا ی)</option>
              <option value="name_desc">نام (ی تا الف)</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-[#1A1D26] hover:bg-[#242832] text-[#BACAff] text-xs font-medium rounded-lg border border-[#242832] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="دریافت مجدد آخرین وضعیت موجودی از استیم"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#BACAff] text-[#0B0C10] font-bold shadow-sm shadow-[#BACAff]/20'
                : 'bg-[#0B0C10] text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1D26] border border-[#242832]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Stats and Batch selection row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#242832]/60 text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-3">
          <span>
            نمایش <strong className="text-[#F5F5F5]">{filteredCount}</strong> از{' '}
            <strong className="text-[#F5F5F5]">{totalCount}</strong> آیتم
          </span>

          {selectedCount > 0 && (
            <span className="text-[#91A8F5] font-semibold bg-[#91A8F5]/10 px-2 py-0.5 rounded border border-[#91A8F5]/20">
              {selectedCount} آیتم انتخاب شده
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filteredCount > 0 && (
            <button
              onClick={onSelectAllFiltered}
              className="text-xs text-[#BACAff] hover:text-[#91A8F5] flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>انتخاب همه موارد فیلتر شده</span>
            </button>
          )}

          {selectedCount > 0 && (
            <button
              onClick={onDeselectAll}
              className="text-xs text-[#9CA3AF] hover:text-[#F5F5F5] flex items-center gap-1 cursor-pointer mr-2"
            >
              <Square className="w-3.5 h-3.5" />
              <span>لغو انتخاب همه</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
