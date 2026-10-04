import React from 'react';
import { CS2Item } from '../types/index.js';
import { X, ExternalLink, Sparkles, Shield, Tag, Eye } from 'lucide-react';

interface ItemDetailModalProps {
  item: CS2Item | null;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: (item: CS2Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  isSelected,
  onToggleSelect,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#12141A] border border-[#242832] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#242832]">
          <h3 className="text-sm font-bold text-[#F5F5F5] truncate max-w-sm" dir="ltr">
            {item.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#242832] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Image with rarity glow */}
          <div className="relative w-full h-48 bg-[#0B0C10] rounded-xl border border-[#242832] flex items-center justify-center p-4 overflow-hidden">
            {item.rarityColor && (
              <div
                className="absolute inset-0 opacity-20 blur-2xl"
                style={{ backgroundColor: item.rarityColor }}
              />
            )}
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt={item.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <span className="text-xs text-[#9CA3AF]">بدون تصویر</span>
            )}
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
              <span className="text-[#9CA3AF] block mb-1">کمیابی (Rarity)</span>
              <span className="font-bold" style={{ color: item.rarityColor || '#F5F5F5' }}>
                {item.rarity || 'نامشخص'}
              </span>
            </div>

            <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
              <span className="text-[#9CA3AF] block mb-1">میزان استهلاک (Exterior)</span>
              <span className="font-bold text-[#F5F5F5]">{item.exterior || 'ندارد'}</span>
            </div>

            {item.float !== undefined && item.float !== null && (
              <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
                <span className="text-[#9CA3AF] block mb-1">شاخص استهلاک (Wear Float)</span>
                <span className="font-mono font-bold text-[#BACAff]">{item.float}</span>
              </div>
            )}

            {item.paintSeed !== undefined && item.paintSeed !== null && (
              <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
                <span className="text-[#9CA3AF] block mb-1">الگوی رنگ (Pattern Template)</span>
                <span className="font-mono font-bold text-[#F5F5F5]">{item.paintSeed}</span>
              </div>
            )}

            <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
              <span className="text-[#9CA3AF] block mb-1">نوع آیتم (Type)</span>
              <span className="font-bold text-[#F5F5F5]">{item.type || 'اسکین CS2'}</span>
            </div>

            <div className="bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
              <span className="text-[#9CA3AF] block mb-1">وضعیت معامله</span>
              <span className={`font-bold ${item.tradable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.tradable ? 'قابل معامله در استیم' : 'قفل موقت معامله'}
              </span>
            </div>

            {item.collection && (
              <div className="col-span-2 bg-[#0B0C10] p-3 rounded-lg border border-[#242832]">
                <span className="text-[#9CA3AF] block mb-1">مجموعه (Collection)</span>
                <span className="font-bold text-[#F5F5F5]">{item.collection}</span>
              </div>
            )}
          </div>

          {/* Tags list */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#9CA3AF] mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#BACAff]" />
                <span>برچسب‌های رسمی استیم</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-[#0B0C10] border border-[#242832] rounded-md text-[11px] text-[#9CA3AF]"
                  >
                    {t.localized_category_name}: <strong className="text-[#F5F5F5]">{t.localized_tag_name}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inspect link if available */}
          {item.inspectLink && (
            <div className="pt-2">
              <a
                href={item.inspectLink}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#1A1D26] hover:bg-[#242832] border border-[#242832] rounded-lg text-xs font-bold text-[#BACAff] transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>مشاهده و Inspect در محیط بازی CS2</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#0B0C10] border-t border-[#242832] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onToggleSelect(item);
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#242832] text-rose-400 hover:bg-rose-950/40'
                : 'bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10]'
            }`}
          >
            {isSelected ? 'حذف از انتخاب‌ها' : 'انتخاب این آیتم برای فروش'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#1A1D26] hover:bg-[#242832] text-[#9CA3AF] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
