import React from 'react';
import { User } from '../types/index.js';
import { SteamLoginButton } from './SteamLoginButton.js';
import { LogOut, ShieldCheck, Tag, ExternalLink, RefreshCw } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: 'sell' | 'home' | 'selected';
  setActiveTab: (tab: 'sell' | 'home' | 'selected') => void;
  selectedCount: number;
  onLogout: () => void;
  onOpenTradeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  selectedCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#12141A]/90 backdrop-blur-md border-b border-[#242832]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Right: Branding (Tehran CS) */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 group text-right cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#BACAff] to-[#91A8F5] flex items-center justify-center shadow-lg shadow-[#91A8F5]/10 group-hover:scale-105 transition-transform">
              <span className="text-[#0B0C10] font-black text-sm tracking-tighter">TCS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[#F5F5F5] group-hover:text-[#BACAff] transition-colors leading-tight">
                تهران CS
              </span>
              <span className="text-[10px] text-[#9CA3AF] tracking-tight">
                بازار اسکین‌های کانتر ۲
              </span>
            </div>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#242832] text-[#BACAff]'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1D26]'
              }`}
            >
              صفحه اصلی
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sell'
                  ? 'bg-[#242832] text-[#BACAff]'
                  : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1D26]'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>فروش اسکین</span>
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('selected')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'selected'
                    ? 'bg-[#242832] text-[#BACAff]'
                    : 'text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#1A1D26]'
                }`}
              >
                <span>آیتم‌های انتخابی</span>
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#BACAff] text-[#0B0C10] text-xs font-bold rounded-full">
                    {selectedCount}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Left: Steam Login or Authenticated User */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="flex items-center gap-2.5 bg-[#0B0C10] border border-[#242832] rounded-lg px-2.5 py-1.5">
                <img
                  src={user.steamAvatar}
                  alt={user.steamName}
                  className="w-7 h-7 rounded-full border border-[#242832] object-cover"
                />
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-[#F5F5F5] max-w-[120px] sm:max-w-[160px] truncate leading-tight">
                    {user.steamName}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono leading-tight">
                    {user.steamId.slice(0, 7)}...{user.steamId.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#242832] rounded-lg transition-colors cursor-pointer"
                title="خروج از حساب استیم"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <SteamLoginButton size="md" />
          )}
        </div>

      </div>
    </header>
  );
};
