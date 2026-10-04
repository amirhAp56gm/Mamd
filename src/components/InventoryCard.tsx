import React from 'react';
import { CS2Item } from '../types/index.js';
import { Check, ShieldCheck, Lock, ExternalLink, Sparkles, Info } from 'lucide-react';

interface InventoryCardProps {
  item: CS2Item;
  isSelected: boolean;
  onToggleSelect: (item: CS2Item) => void;
  onOpenDetails: (item: CS2Item) => void;
}

// Persian translations for CS2 Exteriors
const EXTERIOR_FA: Record<string, string> = {
  'Factory New': 'کارخانه‌ای نو (FN)',
  'Minimal Wear': 'کم‌استهلاک (MW)',
  'Field-Tested': 'میدان‌آزموده (FT)',
  'Well-Worn': 'فرسوده (WW)',
  'Battle-Scarred': 'جنگ‌زده (BS)',
  'Not Applicable': 'بدون استهلاک',
};

// Persian translations for CS2 Rarities
const RARITY_FA: Record<string, string> = {
  'Covert': 'سری (Covert)',
  'Classified': 'طبقه‌بندی (Classified)',
  'Restricted': 'محدود (Restricted)',
  'Mil-Spec Grade': 'نظامی (Mil-Spec)',
  'Industrial Grade': 'صنعتی (Industrial)',
  'Consumer Grade': 'عمومی (Consumer)',
  'Extraordinary': 'فوق‌العاده (Extraordinary)',
  'Contraband': 'قاچاق (Contraband)',
  'Base Grade': 'پایه (Base)',
  'High Grade': 'درجه بالا (High)',
  'Remarkable': 'چشمگیر (Remarkable)',
  'Exotic': 'خاص (Exotic)',
};

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onOpenDetails,
}) => {
  const exteriorLabel = item.exterior ? (EXTERIOR_FA[item.exterior] || item.exterior) : null;
  const rarityLabel = item.rarity ? (RARITY_FA[item.rarity] || item.rarity) : null;
  const rarityColor = item.rarityColor || '#9CA3AF';

  return (
    <div
      onClick={() => onToggleSelect(item)}
      className={`group relative flex flex-col justify-between bg-[#12141A] rounded-xl p-3.5 border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
        isSelected
          ? 'border-[#91A8F5] ring-2 ring-[#91A8F5]/30 bg-[#151824] shadow-lg shadow-[#91A8F5]/10 translate-y-[-2px]'
          : 'border-[#242832] hover:border-[#BACAff]/40 hover:bg-[#161821] hover:translate-y-[-1px]'
      }`}
    >
      {/* Top Bar inside Card */}
      <div className="flex items-center justify-between w-full z-10">
        {/* Badges: StatTrak / Souvenir / Tradable */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.statTrak && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              StatTrak™
            </span>
          )}
          {item.souvenir && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
              سوغات
            </span>
          )}
          {!item.tradable && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" />
              قفل ترید
            </span>
          )}
        </div>

        {/* Selection Checkbox */}
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#BACAff] border-[#BACAff] text-[#0B0C10]'
              : 'border-[#242832] bg-[#0B0C10]/60 group-hover:border-[#91A8F5]'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* Item Image with background glow matching rarity */}
      <div className="relative w-full aspect-square my-2 flex items-center justify-center">
        {/* Subtle rarity backdrop glow */}
        {rarityColor && (
          <div
            className="absolute inset-0 rounded-full opacity-10 blur-xl pointer-events-none group-hover:opacity-20 transition-opacity"
            style={{ backgroundColor: rarityColor }}
          />
        )}
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-16 h-16 rounded bg-[#242832] flex items-center justify-center text-[#9CA3AF] text-xs">
            بدون تصویر
          </div>
        )}
      </div>

      {/* Item Metadata */}
      <div className="w-full text-right mt-1 pt-2 border-t border-[#242832]/50">
        {/* Rarity & Type Indicator */}
        <div className="flex items-center justify-between text-[11px] mb-1">
          {rarityLabel ? (
            <span
              className="font-semibold text-[10px] truncate max-w-[130px]"
              style={{ color: rarityColor }}
            >
              {rarityLabel}
            </span>
          ) : (
            <span className="text-[#9CA3AF] text-[10px]">{item.type || 'اسکین CS2'}</span>
          )}

          {exteriorLabel && (
            <span className="text-[10px] text-[#9CA3AF] bg-[#0B0C10] px-1.5 py-0.5 rounded border border-[#242832]/80">
              {exteriorLabel}
            </span>
          )}
        </div>

        {/* Skin Full Name */}
        <h4
          className="text-xs font-bold text-[#F5F5F5] truncate leading-snug group-hover:text-[#BACAff] transition-colors"
          title={item.marketHashName || item.name}
          dir="ltr"
        >
          {item.name}
        </h4>

        {/* Details & Actions Footer */}
        <div className="mt-2.5 pt-2 border-t border-[#242832]/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {item.float !== undefined && item.float !== null ? (
              <span className="text-[10px] text-[#BACAff] font-mono bg-[#0B0C10] px-1.5 py-0.2 rounded border border-[#242832]" title={`Float (Wear Rating): ${item.float}`}>
                Float: {item.float.toFixed(4)}
              </span>
            ) : item.paintSeed !== undefined && item.paintSeed !== null ? (
              <span className="text-[10px] text-[#9CA3AF] font-mono bg-[#0B0C10] px-1.5 py-0.2 rounded border border-[#242832]" title={`Pattern: ${item.paintSeed}`}>
                الگو: {item.paintSeed}
              </span>
            ) : (
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                ID: {item.assetId.slice(-6)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(item);
            }}
            className="text-[10px] text-[#91A8F5] hover:text-[#BACAff] flex items-center gap-1 hover:underline cursor-pointer shrink-0"
          >
            <Info className="w-3 h-3" />
            <span>جزئیات</span>
          </button>
        </div>
      </div>

      {/* Rarity bottom accent bar */}
      <div
        className="absolute bottom-0 inset-x-0 h-0.5"
        style={{ backgroundColor: rarityColor }}
      />
    </div>
  );
};
