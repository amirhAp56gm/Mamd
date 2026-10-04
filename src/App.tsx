import React, { useState, useEffect, useCallback } from 'react';
import { User, CS2Item, InventoryResult, SelectedItem } from './types/index.js';
import { Header } from './components/Header.js';
import { HomePage } from './components/HomePage.js';
import { SellPage } from './components/SellPage.js';
import { SelectedListPage } from './components/SelectedListPage.js';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'sell' | 'home' | 'selected'>('home');
  const [inventoryResult, setInventoryResult] = useState<InventoryResult | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CS2Item[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Parse path & query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('auth_error');
    if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (window.location.pathname === '/sell') {
      setActiveTab('sell');
    }
  }, []);

  // Fetch current user from /api/me
  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.user && window.location.pathname === '/sell') {
          setActiveTab('sell');
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('[App] Failed to fetch current user:', err);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Listen for popup authentication postMessage from Steam OpenID callback
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Validate data structure
      if (event.data?.type === 'STEAM_AUTH_SUCCESS') {
        setAuthError(null);
        fetchCurrentUser();
        setActiveTab('sell');
        window.history.pushState({}, '', '/sell');
      } else if (event.data?.type === 'STEAM_AUTH_ERROR') {
        setAuthError(event.data.error || 'خطا در احراز هویت استیم.');
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [fetchCurrentUser]);

  // Fetch saved selected items from server
  const fetchSavedSelectedItems = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/me/sell-items');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          // Map to CS2Item structure
          const mapped: CS2Item[] = data.items.map((i: SelectedItem) => ({
            assetId: i.assetId,
            classId: i.classId,
            instanceId: i.instanceId,
            name: i.itemName,
            marketHashName: i.marketHashName,
            iconUrl: i.iconUrl,
            rarity: i.rarity,
            rarityColor: null,
            exterior: i.exterior,
            type: null,
            statTrak: i.statTrak,
            souvenir: i.souvenir,
            tradable: i.tradable,
            marketable: true,
          }));
          setSelectedItems(mapped);
        }
      }
    } catch (err) {
      console.error('[App] Failed to fetch selected items:', err);
    }
  }, [user]);

  // Fetch CS2 inventory
  const fetchInventory = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    try {
      setIsLoadingInventory(true);
      const url = forceRefresh ? '/api/me/cs2/inventory?refresh=true' : '/api/me/cs2/inventory';
      const res = await fetch(url);
      const data: InventoryResult = await res.json();
      setInventoryResult(data);
    } catch (err) {
      console.error('[App] Failed to fetch inventory:', err);
      setInventoryResult({
        success: false,
        items: [],
        errorType: 'NETWORK_ERROR',
        message: 'خطای شبکه در ارتباط با سرور.',
      });
    } finally {
      setIsLoadingInventory(false);
    }
  }, [user]);

  // When user is authenticated and on 'sell' tab, fetch inventory & saved items
  useEffect(() => {
    if (user && activeTab === 'sell' && !inventoryResult && !isLoadingInventory) {
      fetchInventory();
      fetchSavedSelectedItems();
    }
  }, [user, activeTab, inventoryResult, isLoadingInventory, fetchInventory, fetchSavedSelectedItems]);

  // Handle saving Trade URL
  const handleSaveTradeUrl = async (tradeUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/me/trade-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'خطا در ذخیره لینک ترید.' };
    } catch (err) {
      return { success: false, error: 'خطای شبکه در ذخیره لینک ترید.' };
    }
  };

  // Selection handlers
  const handleToggleSelectItem = (item: CS2Item) => {
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.assetId === item.assetId);
      if (exists) {
        return prev.filter((i) => i.assetId !== item.assetId);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAllFiltered = (items: CS2Item[]) => {
    setSelectedItems((prev) => {
      const currentMap = new Map(prev.map((i) => [i.assetId, i]));
      for (const item of items) {
        currentMap.set(item.assetId, item);
      }
      return Array.from(currentMap.values());
    });
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleRemoveSingleSelectedItem = (assetId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.assetId !== assetId));
  };

  // Save selected items to backend
  const handleSaveToSellList = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/me/sell-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems }),
      });
      const data = await res.json();
      return Boolean(res.ok && data.success);
    } catch (err) {
      console.error('[App] Failed to save sell list:', err);
      return false;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setInventoryResult(null);
      setSelectedItems([]);
      setActiveTab('home');
      window.history.pushState({}, '', '/');
    } catch (err) {
      console.error('[App] Logout error:', err);
    }
  };

  const handleTabChange = (tab: 'sell' | 'home' | 'selected') => {
    setActiveTab(tab);
    if (tab === 'sell') {
      window.history.pushState({}, '', '/sell');
    } else if (tab === 'home') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F5F5F5] flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedCount={selectedItems.length}
        onLogout={handleLogout}
      />

      {/* Auth error notification banner */}
      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            user={user}
            onGoToSell={() => handleTabChange('sell')}
          />
        )}

        {activeTab === 'sell' && (
          <SellPage
            user={user}
            inventoryResult={inventoryResult}
            isLoadingInventory={isLoadingInventory}
            onRefreshInventory={() => fetchInventory(true)}
            onSaveTradeUrl={handleSaveTradeUrl}
            selectedItems={selectedItems}
            onToggleSelectItem={handleToggleSelectItem}
            onSelectAllFiltered={handleSelectAllFiltered}
            onClearSelection={handleClearSelection}
            onSaveToSellList={handleSaveToSellList}
            onViewSelectedList={() => handleTabChange('selected')}
          />
        )}

        {activeTab === 'selected' && (
          <SelectedListPage
            user={user}
            selectedItems={selectedItems}
            onRemoveItem={handleRemoveSingleSelectedItem}
            onClearAll={handleClearSelection}
            onBackToSell={() => handleTabChange('sell')}
            onSaveToSellList={handleSaveToSellList}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#242832] bg-[#12141A] py-6 text-center text-xs text-[#9CA3AF]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F5F5]">تهران CS</span>
            <span>—</span>
            <span>پلتفرم تخصصی معامله اسکین‌های CS2</span>
          </div>
          <div className="text-[11px] text-[#9CA3AF]">
            کلیه حقوق اسکین‌ها، نام‌ها و تصاویر متعلق به شرکت Valve Corporation و استیم می‌باشد.
          </div>
        </div>
      </footer>
    </div>
  );
}
