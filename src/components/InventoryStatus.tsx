import React from 'react';
import { InventoryErrorType } from '../types/index.js';
import { SteamLoginButton } from './SteamLoginButton.js';
import { 
  Lock, 
  Clock, 
  AlertTriangle, 
  PackageOpen, 
  ShieldAlert, 
  RefreshCw, 
  ExternalLink, 
  Loader2, 
  HelpCircle, 
  ServerCrash,
  AlertOctagon
} from 'lucide-react';

interface InventoryStatusProps {
  state: 'loading' | 'unauthenticated' | 'error';
  errorType?: InventoryErrorType;
  errorMessage?: string;
  onRetry?: () => void;
  steamId?: string;
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({
  state,
  errorType,
  errorMessage,
  onRetry,
  steamId,
}) => {
  // 1. Loading State
  if (state === 'loading') {
    return (
      <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-12 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#242832] border-t-[#91A8F5] animate-spin flex items-center justify-center" />
          <div className="absolute inset-0 flex items-center justify-center text-[#BACAff]">
            <Loader2 className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">در حال دریافت موجودی...</h3>
        <p className="text-xs text-[#9CA3AF] max-w-md leading-relaxed">
          در حال برقراری ارتباط مستقیم با سرورهای استیم جهت خواندن آیتم‌های CS2 شما. لطفاً شکیبا باشید.
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (state === 'unauthenticated') {
    return (
      <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-10 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mb-5">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">ابتدا وارد حساب استیم خود شوید</h3>
        <p className="text-xs text-[#9CA3AF] max-w-md mb-6 leading-relaxed">
          برای مشاهده موجودی واقعی CS2 و انتخاب اسکین‌ها برای فروش، از طریق دکمه امن زیر وارد حساب استیم خود شوید.
        </p>
        <SteamLoginButton size="lg" />
      </div>
    );
  }

  // 3. Specific Error States

  // Private Inventory (403 or explicit private error)
  if (errorType === 'STEAM_PRIVATE_INVENTORY' || errorType === 'PRIVATE_INVENTORY') {
    return (
      <div className="bg-[#12141A] border border-amber-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
          موجودی استیم شما عمومی نیست (Private)
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-lg mb-5 leading-relaxed">
          برای نمایش آیتم‌ها، در بخش تنظیمات حریم خصوصی استیم مقدار <span className="text-[#BACAff] font-semibold">Inventory</span> را روی <span className="text-[#BACAff] font-semibold">Public</span> قرار دهید.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://steamcommunity.com/my/edit/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#242832] hover:bg-[#2e3340] text-[#BACAff] text-xs font-bold rounded-lg transition-colors"
          >
            <span>تنظیمات حریم خصوصی در استیم</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بررسی مجدد موجودی</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Rate Limiting (429)
  if (errorType === 'STEAM_RATE_LIMIT' || errorType === 'RATE_LIMITED') {
    return (
      <div className="bg-[#12141A] border border-sky-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
          محدودیت موقت نرخ درخواست استیم (Rate Limit)
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-md mb-5 leading-relaxed">
          سرورهای استیم به صورت موقت درخواست‌های مکرر را محدود کرده‌اند. لطفاً ۱ تا ۲ دقیقه صبر کرده و سپس دوباره دکمه بروزرسانی را بزنید.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تلاش مجدد</span>
          </button>
        )}
      </div>
    );
  }

  // Steam Server Unavailable (5xx)
  if (errorType === 'STEAM_UNAVAILABLE') {
    return (
      <div className="bg-[#12141A] border border-amber-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
          <ServerCrash className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
          عدم پاسخگویی سرورهای استیم (Steam Unavailable)
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-md mb-5 leading-relaxed">
          سرورهای کامیونیتی شرکت ولو موقتاً با ترافیک سنگین یا قطعی مواجه شده‌اند.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تلاش مجدد</span>
          </button>
        )}
      </div>
    );
  }

  // Invalid Response from Steam
  if (errorType === 'INVALID_STEAM_RESPONSE') {
    return (
      <div className="bg-[#12141A] border border-rose-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
          <AlertOctagon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
          خطا در پردازش پاسخ سرور استیم
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-lg mb-5 leading-relaxed">
          {errorMessage || 'پاسخ دریافتی از استیم ناقص یا دارای ساختار غیرمنتظره بود.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {steamId && (
            <a
              href={`https://steamcommunity.com/profiles/${steamId}/inventory/#730_2`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#242832] hover:bg-[#2e3340] text-[#BACAff] text-xs font-bold rounded-lg transition-colors"
            >
              <span>بررسی مستقیم موجودی در استیم</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تلاش دوباره</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Truly Empty Inventory
  if (errorType === 'EMPTY_INVENTORY') {
    return (
      <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-8 my-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mb-4">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
            موجودی CS2 شما خالی است
          </h3>
          <p className="text-xs text-[#9CA3AF] max-w-md leading-relaxed">
            هیچ اسکین یا آیتمی در بخش بازی Counter-Strike 2 حساب استیم شما یافت نشد.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://steamcommunity.com/my/edit/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#242832] hover:bg-[#2e3340] text-[#BACAff] text-xs font-bold rounded-lg transition-colors"
          >
            <span>تنظیمات حریم خصوصی استیم</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {steamId && (
            <a
              href={`https://steamcommunity.com/profiles/${steamId}/inventory/#730_2`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1D26] hover:bg-[#242832] text-[#9CA3AF] hover:text-[#F5F5F5] text-xs font-medium rounded-lg transition-colors"
            >
              <span>مشاهده اینونتوری در سایت استیم</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-black rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بروزرسانی مجدد موجودی</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (errorType === 'NOT_CONFIGURED') {
    return (
      <div className="bg-[#12141A] border border-amber-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
          سرویس دریافت موجودی هنوز پیکربندی نشده است
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-md leading-relaxed">
          لطفاً با پشتیبانی سیستم تماس بگیرید یا تنظیمات سرویس‌دهنده را بررسی فرمایید.
        </p>
      </div>
    );
  }

  // Generic Steam / API / Network Error
  return (
    <div className="bg-[#12141A] border border-rose-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-8 shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#F5F5F5] mb-2">
        {errorMessage || 'دریافت موجودی با خطا مواجه شد.'}
      </h3>
      <p className="text-xs text-[#9CA3AF] max-w-md mb-5 leading-relaxed">
        ممکن است سرورهای کامیونیتی استیم به صورت موقت پاسخگو نباشند یا ارتباط شبکه قطع شده باشد.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </button>
      )}
    </div>
  );
};
