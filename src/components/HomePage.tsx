import React from 'react';
import { User } from '../types/index.js';
import { SteamLoginButton } from './SteamLoginButton.js';
import { 
  ShieldCheck, 
  Layers, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  RefreshCw,
  Globe2
} from 'lucide-react';

interface HomePageProps {
  user: User | null;
  onGoToSell: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, onGoToSell }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#12141A] to-[#0B0C10] border border-[#242832] p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#91A8F5]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#BACAff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>پلتفرم تخصصی معامله اسکین‌های کانتر استرایک ۲</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F5F5] tracking-tight leading-tight mb-4">
            بازار مستقیم و امن <span className="text-[#BACAff]">تهران CS</span>
          </h1>

          <p className="text-sm sm:text-base text-[#9CA3AF] leading-relaxed mb-8 max-w-2xl">
            اتصال مستقیم به موجودی واقعی حساب استیم، استخراج دقیق آیتم‌های CS2، اعتبارسنجی لینک ترید و آماده‌سازی برای فروش بدون نیاز به پسورد یا اطلاعات حساس.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {user ? (
              <button
                onClick={onGoToSell}
                className="px-6 py-3.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] font-black text-sm rounded-xl transition-all shadow-lg shadow-[#91A8F5]/20 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>مشاهده موجودی و فروش اسکین</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <SteamLoginButton size="lg" />
                <span className="text-xs text-[#9CA3AF]">
                  احراز هویت استاندارد Steam OpenID
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature / Architecture pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Card 1 */}
        <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-6 hover:border-[#91A8F5]/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5] mb-2">احراز هویت واقعی با OpenID</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            هیچ رمز عبور، کوکی نشست یا کد دو مرحله‌ای از شما خواسته نمی‌شود. ورود مستقیماً در دامنه رسمی استیم انجام و در سرور راستی‌آزمایی می‌شود.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-6 hover:border-[#91A8F5]/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5] mb-2">موجودی زنده و تفکیک شده</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            برقراری ارتباط مستقیم سرور با اینونتوری CS2 استیم (AppID: 730) و تفکیک پیشرفته آیتم‌ها بر اساس کیفیت، وضعیت استهلاک و قابلیت معامله.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#12141A] border border-[#242832] rounded-2xl p-6 hover:border-[#91A8F5]/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#F5F5F5] mb-2">معماری مقیاس‌پذیر و مدرن</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            طراحی شده با ساختار ارائه‌دهنده ماژولار (Provider Abstraction) برای اتصال بدون وقفه به سیستم‌های قیمت‌گذاری و ربات‌های آینده.
          </p>
        </div>
      </div>

      {/* How it works steps */}
      <div className="mt-16 bg-[#12141A] border border-[#242832] rounded-2xl p-8">
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-6 text-center">
          مراحل کار در پلتفرم تهران CS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center p-4 bg-[#0B0C10] border border-[#242832] rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#BACAff] text-[#0B0C10] font-black text-xs flex items-center justify-center mb-3">
              ۱
            </div>
            <h4 className="text-xs font-bold text-[#F5F5F5] mb-1">ورود با استیم</h4>
            <p className="text-[11px] text-[#9CA3AF]">
              تأیید هویت از طریق OpenID رسمی شرکت ولو
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 bg-[#0B0C10] border border-[#242832] rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#BACAff] text-[#0B0C10] font-black text-xs flex items-center justify-center mb-3">
              ۲
            </div>
            <h4 className="text-xs font-bold text-[#F5F5F5] mb-1">ثبت Trade URL</h4>
            <p className="text-[11px] text-[#9CA3AF]">
              ثبت و اعتبارسنجی لینک معامله جهت مبادلات بعدی
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 bg-[#0B0C10] border border-[#242832] rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#BACAff] text-[#0B0C10] font-black text-xs flex items-center justify-center mb-3">
              ۳
            </div>
            <h4 className="text-xs font-bold text-[#F5F5F5] mb-1">مشاهده موجودی</h4>
            <p className="text-[11px] text-[#9CA3AF]">
              بارگذاری خودکار و بدون تاخیر موجودی اسکین‌های CS2
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 bg-[#0B0C10] border border-[#242832] rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#BACAff] text-[#0B0C10] font-black text-xs flex items-center justify-center mb-3">
              ۴
            </div>
            <h4 className="text-xs font-bold text-[#F5F5F5] mb-1">انتخاب برای فروش</h4>
            <p className="text-[11px] text-[#9CA3AF]">
              علامت‌گذاری اسکین‌های دلخواه و افزودن به لیست
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
