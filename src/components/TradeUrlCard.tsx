import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle2, AlertCircle, ExternalLink, ShieldAlert, Loader2 } from 'lucide-react';

interface TradeUrlCardProps {
  currentTradeUrl: string | null;
  onSave: (tradeUrl: string) => Promise<{ success: boolean; error?: string }>;
}

export const TradeUrlCard: React.FC<TradeUrlCardProps> = ({ currentTradeUrl, onSave }) => {
  const [url, setUrl] = useState(currentTradeUrl || '');
  const [isEditing, setIsEditing] = useState(!currentTradeUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentTradeUrl) {
      setUrl(currentTradeUrl);
      setIsEditing(false);
    }
  }, [currentTradeUrl]);

  const validateUrlFormat = (val: string): boolean => {
    if (!val.trim()) return false;
    try {
      const parsed = new URL(val.trim());
      if (parsed.hostname !== 'steamcommunity.com') return false;
      if (parsed.pathname !== '/tradeoffer/new' && parsed.pathname !== '/tradeoffer/new/') return false;
      const partner = parsed.searchParams.get('partner');
      const token = parsed.searchParams.get('token');
      return Boolean(partner && /^\d+$/.test(partner) && token && /^[a-zA-Z0-9_-]+$/.test(token));
    } catch {
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('لطفاً لینک ترید استیم خود را وارد کنید.');
      return;
    }

    if (!validateUrlFormat(trimmed)) {
      setError('فرمت لینک ترید نامعتبر است. نمونه صحیح: https://steamcommunity.com/tradeoffer/new/?partner=XXXXX&token=YYYYY');
      return;
    }

    setSaving(true);
    const res = await onSave(trimmed);
    setSaving(false);

    if (res.success) {
      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 4000);
    } else {
      setError(res.error || 'خطا در ذخیره لینک ترید.');
    }
  };

  return (
    <div className="bg-[#12141A] border border-[#242832] rounded-xl p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#242832]/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[#BACAff]/10 border border-[#BACAff]/20 text-[#BACAff] mt-0.5">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F5F5F5]">لینک معامله استیم (Steam Trade URL)</h3>
              {currentTradeUrl && !isEditing && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  ثبت شده
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
              برای ارسال خودکار یا تبادل آیتم‌ها در معاملات بعدی نیاز است. دریافت موجودی نیازی به لینک ترید ندارد.
            </p>
          </div>
        </div>

        <a
          href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#91A8F5] hover:text-[#BACAff] hover:underline whitespace-nowrap self-start md:self-auto"
        >
          <span>یافتن Trade URL در استیم</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Form or Display View */}
      <div className="mt-4">
        {isEditing ? (
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
                className="w-full px-3.5 py-2.5 bg-[#0B0C10] border border-[#242832] rounded-lg text-xs font-mono text-[#F5F5F5] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#91A8F5] focus:ring-1 focus:ring-[#91A8F5] transition-colors text-left"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#BACAff] hover:bg-[#91A8F5] text-[#0B0C10] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer min-w-[110px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <span>ذخیره لینک ترید</span>
                )}
              </button>

              {currentTradeUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl(currentTradeUrl);
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="px-3 py-2.5 bg-[#1A1D26] hover:bg-[#242832] text-[#9CA3AF] hover:text-[#F5F5F5] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0C10] border border-[#242832] rounded-lg p-3">
            <div className="font-mono text-xs text-[#9CA3AF] truncate max-w-xl text-left" dir="ltr">
              {currentTradeUrl}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-[#1A1D26] hover:bg-[#242832] text-[#BACAff] text-xs font-medium rounded-md transition-colors self-end sm:self-auto cursor-pointer"
            >
              ویرایش لینک
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {savedSuccess && (
          <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>لینک ترید شما با موفقیت ذخیره شد.</span>
          </div>
        )}
      </div>
    </div>
  );
};
