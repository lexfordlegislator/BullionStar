import React, { useState } from 'react';
import {
  ChevronDown,
  Globe,
  Mail,
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
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { CurrencyCode, LanguageCode, MetalType, StockLocation } from '../types/bullion';
import { BullionStarLogo } from './BullionStarLogo';

interface HeaderProps {
  onSelectMetalChart: (metal: 'Gold' | 'Silver' | 'Platinum' | 'Palladium') => void;
}

const CURRENCIES: CurrencyCode[] = ['USD', 'SGD', 'EUR', 'AUD', 'GBP', 'CHF'];
const LOCATIONS: StockLocation[] = ['Singapore', 'New Zealand', 'United States'];

export const Header: React.FC<HeaderProps> = ({ onSelectMetalChart }) => {
  const {
    view,
    setView,
    scrollToContact,
    setCatalogFilter,
    language,
    setLanguage,
    t,
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
      {/* 1. Top Utility Bar (Tablet & Desktop >= 768px) */}
      <div className="hidden md:block bg-[#0A162B] text-slate-200 text-xs border-b border-[#1A2D4D]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="sr-only">Language</span>
              <select
                aria-label={t('footer.languageLabel')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0D1F3C] text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <span className="text-slate-600" aria-hidden="true">|</span>

            <label className="flex items-center gap-1 whitespace-nowrap shrink-0">
              <span className="text-slate-400">{t('header.currency')}</span>
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

            <span className="text-slate-600" aria-hidden="true">|</span>

            <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="text-slate-400">{t('header.stockLocation')}</span>
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
            <a
              href="mailto:info@bullionstar.in.net"
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0 font-medium"
              title="Email BullionStar Support"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>info@bullionstar.in.net</span>
            </a>
            <span className="hidden xl:inline text-slate-600" aria-hidden="true">|</span>
            <div className="hidden xl:flex items-center gap-2">
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
                    title={`${t(`metal.${metal}`)}`}
                  >
                    <span className="text-slate-300 font-medium">{t(`metal.${metal}`)}</span>
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

      {/* 2. Primary Header: Logo, Search, Language (Mobile), Sign In / Account, Cart, Hamburger */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        <button
          onClick={() => navigateCategory('All', 'home')}
          className="flex items-center text-left group whitespace-nowrap shrink-0 max-w-[155px] sm:max-w-[220px] focus:outline-none"
          aria-label="BullionStar Home"
        >
          <BullionStarLogo variant="light" size="md" />
        </button>

        {/* Search Bar (Tablet & Desktop >= 768px) */}
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
              placeholder={t('header.searchPlaceholder')}
              className="w-full h-10 ps-4 pe-11 text-sm bg-[#F4F6F9] border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0D1F3C]"
            />
            <button
              type="submit"
              aria-label="Search Catalog"
              className="absolute end-1 top-1 bottom-1 px-3 bg-[#0D1F3C] text-white rounded-sm hover:bg-[#183563] transition-colors flex items-center justify-center"
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

        {/* Right Controls: Mobile Language, Sign In / Client Portal, Cart, Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Compact Mobile Language Switcher (< 768px) */}
          <div className="relative md:hidden inline-flex items-center justify-center gap-1 h-9 px-2 bg-[#F4F6F9] border border-slate-200 rounded text-xs font-semibold text-[#0D1F3C]">
            <Globe className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
            <span className="uppercase">{language}</span>
            <select
              aria-label={t('footer.languageLabel')}
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {!isLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="h-9 sm:h-auto px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-xs sm:text-sm font-semibold text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
              >
                {t('header.signIn')}
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-[#0D1F3C] hover:bg-[#193561] text-white rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F2D06B]" />
                <span>{t('header.createAccount')}</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setAccountDropdown(!accountDropdown)}
                className="h-9 sm:h-auto flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-xs sm:text-sm font-medium text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
                aria-label={t('header.yourAccountDashboard')}
              >
                <User className="w-4 h-4 text-[#B38818] shrink-0" />
                <span className="sm:hidden text-xs font-semibold text-[#0D1F3C]">
                  {(client.full_name || 'Portal').split(' ')[0]}
                </span>
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
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {accountDropdown && (
                <div className="absolute right-0 top-11 sm:top-12 w-64 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded shadow-lg z-50 py-1.5">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{client.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{client.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setView('account');
                      setAccountDropdown(false);
                    }}
                    className="w-full text-start px-4 py-2.5 text-sm text-slate-700 hover:bg-[#F4F6F9]"
                  >
                    {t('header.yourAccountDashboard')}
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setAccountDropdown(false);
                    }}
                    className="w-full text-start px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 border-t border-slate-100 mt-1"
                  >
                    {t('header.signOut')}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open Cart"
            className="h-9 sm:h-auto flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">{totalCartItems}</span>
            <span className="hidden lg:inline border-l border-[#0A162B]/20 pl-2 font-mono text-xs tabular-nums">
              {formatMoney(totalCartUSD)}
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 flex items-center justify-center text-[#0D1F3C] hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Multi-Category Navigation Bar */}
      <nav className="bg-[#13294B] text-white border-t border-[#1D3A68]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 hidden lg:flex items-center justify-between">
          <div className="flex items-center">
            {[
              { label: t('nav.preciousMetals'), active: view === 'catalog' || view === 'home', action: () => navigateCategory('All', 'catalog') },
              { label: t('nav.goldBullion'), active: false, action: () => navigateCategory('Gold', 'catalog') },
              { label: t('nav.silverBullion'), active: false, action: () => navigateCategory('Silver', 'catalog') },
              { label: t('nav.platinumPalladium'), active: false, action: () => navigateCategory('Platinum', 'catalog') },
              { label: t('nav.certifiedDiamonds'), active: false, action: () => navigateCategory('Diamond', 'catalog') },
              { label: t('nav.storageVaults'), active: view === 'vaults', action: () => navigateCategory('All', 'vaults') },
              { label: t('nav.spotChartsResearch'), active: view === 'charts', action: () => navigateCategory('All', 'charts') },
              { label: t('nav.yourAccount'), active: view === 'account', action: () => navigateCategory('All', 'account') },
              { label: t('nav.contact'), active: false, action: () => { setMobileMenuOpen(false); scrollToContact(); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`px-3 xl:px-3.5 py-3 text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  item.active
                    ? 'border-[#C59B27] text-[#F2D06B] bg-[#0D1F3C]'
                    : 'border-transparent text-slate-200 hover:text-white hover:bg-[#193561]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="hidden 2xl:block text-xs text-slate-300 font-medium whitespace-nowrap shrink-0">
            {t('header.gstNotice')}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D1F3C] px-4 py-4 space-y-2 border-t border-[#1D3A68] max-h-[calc(100vh-64px)] overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                setView('catalog');
              }}
              className="flex items-center gap-2 pb-1"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.mobileSearchPlaceholder')}
                className="flex-1 min-w-0 h-11 px-3.5 text-base bg-[#13294B] border border-[#274980] rounded text-white placeholder:text-slate-400 focus:outline-none focus:border-[#C59B27]"
              />
              <button
                type="submit"
                aria-label="Search Catalog"
                className="h-11 px-4 bg-[#C59B27] text-[#0A162B] rounded font-semibold flex items-center justify-center shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {!isLoggedIn && (
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#1D3A68]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="min-h-[44px] px-3 py-2.5 bg-[#13294B] border border-[#274980] text-white rounded text-sm font-semibold"
                >
                  {t('header.signIn')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#C59B27] text-[#0A162B] rounded text-sm font-semibold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('header.createAccount')}</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              {[
                { label: t('nav.homeExchange'), action: () => navigateCategory('All', 'home') },
                { label: t('nav.allPreciousMetals'), action: () => navigateCategory('All', 'catalog') },
                { label: t('nav.goldBullion'), action: () => navigateCategory('Gold', 'catalog') },
                { label: t('nav.silverBullion'), action: () => navigateCategory('Silver', 'catalog') },
                { label: t('nav.platinumPalladium'), action: () => navigateCategory('Platinum', 'catalog') },
                { label: t('nav.certifiedDiamonds'), action: () => navigateCategory('Diamond', 'catalog') },
                { label: t('nav.storageSingaporeVaults'), action: () => navigateCategory('All', 'vaults') },
                { label: t('nav.liveSpotCharts'), action: () => navigateCategory('All', 'charts') },
                { label: t('nav.yourAccountPortal'), action: () => navigateCategory('All', 'account') },
                { label: t('nav.contactUs'), action: () => { setMobileMenuOpen(false); scrollToContact(); } },
              ].map((nav) => (
                <button
                  key={nav.label}
                  onClick={nav.action}
                  className="flex items-center w-full min-h-[44px] text-start px-3.5 py-2.5 text-sm font-medium text-slate-100 hover:bg-[#193561] rounded transition-colors"
                >
                  {nav.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1D3A68]">
              <label className="flex flex-col gap-1 text-[11px] text-slate-400">
                <span>{t('header.currency')}</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="h-10 px-2.5 bg-[#13294B] border border-[#274980] rounded text-sm font-semibold text-[#F2D06B]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] text-slate-400">
                <span>{t('header.stockLocation')}</span>
                <select
                  value={stockLocation}
                  onChange={(e) => setStockLocation(e.target.value as StockLocation)}
                  className="h-10 px-2.5 bg-[#13294B] border border-[#274980] rounded text-sm font-medium text-white"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-300">
              <a
                href="mailto:info@bullionstar.in.net"
                className="inline-flex items-center gap-1.5 text-[#F2D06B] font-medium"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>info@bullionstar.in.net</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
