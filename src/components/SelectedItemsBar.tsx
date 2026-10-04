import React, { useState } from 'react';
import { CS2Item } from '../types/index.js';
import { CheckCheck, ShoppingBag, Trash2, Loader2, ArrowLeft } from 'lucide-react';

interface SelectedItemsBarProps {
  selectedItems: CS2Item[];
  onClearSelection: () => void;
  onSaveToSellList: () => Promise<boolean>;
  onViewSelectedList: () => void;
}

export const SelectedItemsBar: React.FC<SelectedItemsBarProps> = ({
  selectedItems,
  onClearSelection,
  onSaveToSellList,
  onViewSelectedList,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await onSaveToSellList();
    setIsSaving(false);

    if (ok) {
      setSuccessSaved(true);
      setTimeout(() => setSuccessSaved(false), 3000);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#12141A]/95 backdrop-blur-md border-t border-[#91A8F5]/30 p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Right Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#BACAff] text-[#0B0C10] flex items-center justify-center font-black text-sm">
              {selectedItems.length}
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-[#F5F5F5]">
                {selectedItems.length} اسکین انتخاب شده برای فروش
              </span>
              <span className="text-[10px] text-[#9CA3AF]">
                برای ادامه، آیتم‌ها را به لیست فروش خود اضافه کنید
              </span>
            </div>
          </div>

          <button
            onClick={onClearSelection}
            className="text-xs text-[#9CA3AF] hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer sm:hidden"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>لغو</span>
          </button>
        </div>

        {/* Left Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClearSelection}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#1A1D26] hover:bg-[#242832] text-[#9CA3AF] hover:text-[#F5F5F5] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>لغو انتخاب‌ها</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-black rounded-lg shadow-lg shadow-[#91A8F5]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ثبت...</span>
              </>
            ) : successSaved ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-950" />
                <span>به لیست فروش اضافه شد!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>افزودن به لیست فروش</span>
              </>
            )}
          </button>

          <button
            onClick={onViewSelectedList}
            className="px-3.5 py-2.5 bg-[#242832] hover:bg-[#2e3340] text-[#BACAff] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="مشاهده لیست کامل آیتم‌های انتخاب شده"
          >
            <span>مشاهده لیست</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
