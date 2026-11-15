import React, { useState } from 'react';
import {
  ChevronDown,
  Globe,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { CurrencyCode, LanguageCode, MetalType, StockLocation } from '../types/bullion';

interface HeaderProps {
  onSelectMetalChart: (metal: 'Gold' | 'Silver' | 'Platinum' | 'Palladium') => void;
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'EN', label: 'English' },
  { code: 'ZH', label: '中文 (简体)' },
  { code: 'MS', label: 'Bahasa' },
  { code: 'JA', label: '日本語' },
];

const CURRENCIES: CurrencyCode[] = ['USD', 'SGD', 'EUR', 'AUD', 'GBP', 'CHF'];
const LOCATIONS: StockLocation[] = ['Singapore', 'New Zealand', 'United States'];

export const Header: React.FC<HeaderProps> = ({ onSelectMetalChart }) => {
  const {
    view,
    setView,
    setCatalogFilter,
    language,
    setLanguage,
    currency,
    setCurrency,
    stockLocation,
    setStockLocation,
    searchQuery,
    setSearchQuery,
    spotPricesUSD,
    spotChangesPct,
    formatMoney,
    products,
    getProductPriceUSD,
    cart,
    setCartOpen,
    isLoggedIn,
    openAuthModal,
    logout,
    client,
    notifications,
  } = useBullion();

  const [searchFocused, setSearchFocused] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartUSD = cart.reduce((acc, item) => acc + getProductPriceUSD(item.product) * item.quantity, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.giaNumber && p.giaNumber.includes(searchQuery))
        )
        .slice(0, 6)
    : [];

  const navigateCategory = (
    filter: MetalType | 'All',
    targetView: 'catalog' | 'home' | 'charts' | 'vaults' | 'account' | 'admin'
  ) => {
    setCatalogFilter(filter);
    setView(targetView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      {/* 1. Top Utility Bar */}
      <div className="bg-[#0A162B] text-slate-200 text-xs border-b border-[#1A2D4D]">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="sr-only">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0D1F3C] text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <span className="text-slate-600" aria-hidden="true">|</span>

            <label className="flex items-center gap-1 whitespace-nowrap shrink-0">
              <span className="text-slate-400">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-[#F2D06B] font-semibold focus:outline-none cursor-pointer tabular-nums"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0D1F3C] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>

            <label className="hidden sm:flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="text-slate-400">Stock Location:</span>
              <select
                value={stockLocation}
                onChange={(e) => setStockLocation(e.target.value as StockLocation)}
                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-[#0D1F3C] text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-3">
              {(['Gold', 'Silver', 'Platinum', 'Palladium'] as const).map((metal) => {
                const change = spotChangesPct[metal];
                const isUp = change >= 0;
                return (
                  <button
                    key={metal}
                    onClick={() => {
                      onSelectMetalChart(metal);
                      setView('charts');
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#13294B] hover:bg-[#1C3863] transition-colors whitespace-nowrap shrink-0"
                    title={`View ${metal} Spot Chart`}
                  >
                    <span className="text-slate-300 font-medium">{metal}</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {formatMoney(spotPricesUSD[metal])}
                    </span>
                    <span
                      className={`flex items-center gap-0.5 font-mono text-[11px] tabular-nums ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Header: Logo, Search, Sign In / Create Account / Your Account, Cart */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4 lg:gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-[#0D1F3C] hover:bg-slate-100 rounded-md"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigateCategory('All', 'home')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0"
          >
            <div className="w-9 h-9 rounded bg-[#0D1F3C] flex items-center justify-center border border-[#C59B27]/50">
              <span className="font-serif text-lg font-bold text-[#D4AF37] tracking-tight">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#0D1F3C] leading-none">
                BullionStar
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 tracking-wide">
                Singapore · 45 New Bridge Rd
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-lg relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchFocused(false);
              setView('catalog');
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gold bars, silver coins, platinum, or GIA report..."
              className="w-full h-10 pl-4 pr-11 text-sm bg-[#F4F6F9] border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0D1F3C]"
            />
            <button
              type="submit"
              aria-label="Search Catalog"
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#0D1F3C] text-white rounded-sm hover:bg-[#183563] transition-colors flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded shadow-lg z-50 divide-y divide-slate-100">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onMouseDown={() => {
                    setCatalogFilter(item.category);
                    setView('catalog');
                    setSearchFocused(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F4F6F9] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.mintOrLab} · {item.weightLabel}
                      {item.giaNumber ? ` · GIA #${item.giaNumber}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-[#0D1F3C] tabular-nums shrink-0">
                    {formatMoney(getProductPriceUSD(item))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Account Auth & Cart Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-2 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-xs sm:text-sm font-semibold text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0D1F3C] hover:bg-[#193561] text-white rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F2D06B]" />
                <span>Create Account</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setAccountDropdown(!accountDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-sm font-medium text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4 text-[#B38818]" />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#0D1F3C] leading-tight">
                    {(client.full_name || 'Vault Client').split(' ')[0]}
                    {unreadCount > 0 && (
                      <span className="ml-1 text-[#B38818] font-mono">({unreadCount})</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 leading-tight">
                    {client.vault_id || 'BS-SG'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {accountDropdown && (
                <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded shadow-lg z-50 py-1.5">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{client.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{client.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setView('account');
                      setAccountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-[#F4F6F9]"
                  >
                    Your Account & Dashboard
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setAccountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 border-t border-slate-100 mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="tabular-nums">{totalCartItems}</span>
            <span className="hidden lg:inline border-l border-[#0A162B]/20 pl-2 font-mono text-xs tabular-nums">
              {formatMoney(totalCartUSD)}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Multi-Category Navigation Bar */}
      <nav className="bg-[#13294B] text-white border-t border-[#1D3A68]">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 hidden lg:flex items-center justify-between">
          <div className="flex items-center">
            {[
              { label: 'Precious Metals', active: view === 'catalog' || view === 'home', action: () => navigateCategory('All', 'catalog') },
              { label: 'Gold Bullion', active: false, action: () => navigateCategory('Gold', 'catalog') },
              { label: 'Silver Bullion', active: false, action: () => navigateCategory('Silver', 'catalog') },
              { label: 'Platinum & Palladium', active: false, action: () => navigateCategory('Platinum', 'catalog') },
              { label: 'Certified Diamonds', active: false, action: () => navigateCategory('Diamond', 'catalog') },
              { label: 'Storage & Vaults', active: view === 'vaults', action: () => navigateCategory('All', 'vaults') },
              { label: 'Spot Charts & Research', active: view === 'charts', action: () => navigateCategory('All', 'charts') },
              { label: 'Your Account', active: view === 'account', action: () => navigateCategory('All', 'account') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  item.active
                    ? 'border-[#C59B27] text-[#F2D06B] bg-[#0D1F3C]'
                    : 'border-transparent text-slate-200 hover:text-white hover:bg-[#193561]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-300 font-medium whitespace-nowrap shrink-0">
            0% GST on Investment Precious Metals in Singapore
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D1F3C] px-4 py-3 space-y-1 border-t border-[#1D3A68]">
            <div className="pb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bullion or GIA number..."
                className="w-full px-3 py-2 text-sm bg-[#13294B] border border-[#274980] rounded text-white placeholder:text-slate-400"
              />
            </div>
            {[
              { label: 'Home Exchange', action: () => navigateCategory('All', 'home') },
              { label: 'All Precious Metals', action: () => navigateCategory('All', 'catalog') },
              { label: 'Gold Bullion', action: () => navigateCategory('Gold', 'catalog') },
              { label: 'Silver Bullion', action: () => navigateCategory('Silver', 'catalog') },
              { label: 'Certified Diamonds (GIA)', action: () => navigateCategory('Diamond', 'catalog') },
              { label: 'Storage & Singapore Vaults', action: () => navigateCategory('All', 'vaults') },
              { label: 'Live Spot Charts & Research', action: () => navigateCategory('All', 'charts') },
              { label: 'Your Account Portal', action: () => navigateCategory('All', 'account') },
            ].map((nav) => (
              <button
                key={nav.label}
                onClick={nav.action}
                className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#193561] rounded"
              >
                {nav.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};
