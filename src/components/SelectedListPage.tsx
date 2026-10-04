import React from 'react';
import { User, CS2Item } from '../types/index.js';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Tag, Lock, Sparkles, ExternalLink } from 'lucide-react';

interface SelectedListPageProps {
  user: User | null;
  selectedItems: CS2Item[];
  onRemoveItem: (assetId: string) => void;
  onClearAll: () => void;
  onBackToSell: () => void;
  onSaveToSellList: () => Promise<boolean>;
}

export const SelectedListPage: React.FC<SelectedListPageProps> = ({
  user,
  selectedItems,
  onRemoveItem,
  onClearAll,
  onBackToSell,
  onSaveToSellList,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#242832]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSell}
            className="p-2 bg-[#12141A] hover:bg-[#242832] border border-[#242832] rounded-lg text-[#BACAff] transition-colors cursor-pointer"
            title="بازگشت به موجودی"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-[#F5F5F5] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#BACAff]" />
              <span>لیست آیتم‌های آماده برای فروش</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              آیتم‌های انتخاب شده از موجودی واقعی استیم شما برای ارائه در بازار تهران CS
            </p>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-end sm:self-auto px-3 py-1.5 bg-[#1A1D26] hover:bg-rose-950/40 text-[#9CA3AF] hover:text-rose-400 border border-[#242832] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف همه آیتم‌ها</span>
          </button>
        )}
      </div>

      {/* Info notice about current phase */}
      <div className="bg-[#12141A] border border-[#91A8F5]/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#BACAff] shrink-0 mt-0.5" />
        <div className="text-xs text-[#9CA3AF] leading-relaxed">
          <strong className="text-[#F5F5F5] block mb-0.5">تأییدیه مالکیت آیتم‌ها از استیم</strong>
          این آیتم‌ها مستقیماً از موجودی عمومی استیم شما خوانده شده و برای فروش در سیستم ذخیره شده‌اند. در فاز بعدی پلتفرم تهران CS، سیستم قیمت‌گذاری و ارسال آفر ترید فعال خواهد شد.
        </div>
      </div>

      {/* Item List or Empty State */}
      {selectedItems.length === 0 ? (
        <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-12 text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5] mb-2">هنوز هیچ اسکینی انتخاب نکرده‌اید</h3>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto mb-6">
            به بخش موجودی استیم بروید و اسکین‌هایی که قصد فروش آن‌ها را دارید انتخاب کنید.
          </p>
          <button
            onClick={onBackToSell}
            className="px-6 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            مشاهده موجودی و انتخاب اسکین
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedItems.map((item) => (
            <div
              key={item.assetId}
              className="bg-[#12141A] border border-[#242832] hover:border-[#91A8F5]/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="w-16 h-16 rounded-lg bg-[#0B0C10] border border-[#242832] flex items-center justify-center p-1 relative shrink-0">
                  {item.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <span className="text-[10px] text-[#9CA3AF]">بدون عکس</span>
                  )}
                  {item.rarityColor && (
                    <div
                      className="absolute bottom-0 inset-x-0 h-1 rounded-b-lg"
                      style={{ backgroundColor: item.rarityColor }}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-[#F5F5F5]" dir="ltr">
                      {item.name}
                    </h4>
                    {item.statTrak && (
                      <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                        ST™
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
                    {item.rarity && (
                      <span style={{ color: item.rarityColor || '#9CA3AF' }} className="font-semibold">
                        {item.rarity}
                      </span>
                    )}
                    {item.exterior && (
                      <span className="bg-[#0B0C10] px-1.5 py-0.5 rounded border border-[#242832]">
                        {item.exterior}
                      </span>
                    )}
                    <span className="font-mono text-[10px]">Asset ID: {item.assetId}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onRemoveItem(item.assetId)}
                  className="px-3 py-1.5 bg-[#1A1D26] hover:bg-rose-950/40 text-[#9CA3AF] hover:text-rose-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={onBackToSell}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1A1D26] hover:bg-[#242832] text-[#BACAff] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              افزودن اسکین‌های بیشتر از موجودی
            </button>

            <span className="text-xs text-[#9CA3AF]">
              مجموع آیتم‌های انتخابی: <strong className="text-[#F5F5F5]">{selectedItems.length}</strong> عدد
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
