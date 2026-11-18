import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  Bell,
  Camera,
  CheckCircle2,
  Download,
  FileCheck2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Wallet,
  X,
  ZoomIn,
} from 'lucide-react';
import { AUDIT_REPORTS } from '../data/initialData';
import { useBullion } from '../context/BullionContext';
import { CurrencyCode, VaultCertificateSummary, VaultHoldingItem } from '../types/bullion';
import { ResilientImage } from './ResilientImage';

type AccountTab = 'overview' | 'holdings' | 'certificates' | 'photos' | 'audits' | 'history' | 'security';

export const ClientPortal: React.FC = () => {
  const {
    isLoggedIn,
    isDemoMode,
    authLoading,
    refreshingClient,
    lastSignInAt,
    openAuthModal,
    demoLogin,
    logout,
    refreshClientSession,
    updateAccountPassword,
    requestAccountEmailChange,
    verifyAccountEmailChange,
    client,
    holdings,
    certificate,
    transactions,
    notifications,
    markAllNotificationsRead,
    currency,
    formatMoney,
    spotPriceMap,
    totalPortfolioUSD,
    products,
    getProductPriceUSD,
    executeFunding,
    executeSpotTrade,
    setView,
  } = useBullion();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [certPreview, setCertPreview] = useState<VaultCertificateSummary | null>(null);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('');

  // Funding Modal
  const [fundingModal, setFundingModal] = useState(false);
  const [fundingAction, setFundingAction] = useState<'Deposit' | 'Withdraw'>('Deposit');
  const [fundingCurrency, setFundingCurrency] = useState<CurrencyCode>('USD');
  const [fundingAmount, setFundingAmount] = useState('10000');
  const [fundingMethod, setFundingMethod] = useState('FAST Bank Transfer (Singapore)');
  const [fundingError, setFundingError] = useState('');
  const [fundingBusy, setFundingBusy] = useState(false);

  // Spot Trade Modal
  const [tradeModal, setTradeModal] = useState(false);
  const [tradeSide, setTradeSide] = useState<'Buy' | 'Sell'>('Buy');
  const [tradeProductId, setTradeProductId] = useState(products[0].id);
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeError, setTradeError] = useState('');
  const [tradeBusy, setTradeBusy] = useState(false);

  const [txFilter, setTxFilter] = useState('All');
  const [txSearch, setTxSearch] = useState('');

  // Security & Account Settings State
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secPwdBusy, setSecPwdBusy] = useState(false);
  const [secPwdErr, setSecPwdErr] = useState('');
  const [secPwdSuccess, setSecPwdSuccess] = useState('');

  const [secNewEmail, setSecNewEmail] = useState('');
  const [secEmailOtpStep, setSecEmailOtpStep] = useState(false);
  const [secEmailOtpCode, setSecEmailOtpCode] = useState('');
  const [secEmailBusy, setSecEmailBusy] = useState(false);
  const [secEmailErr, setSecEmailErr] = useState('');
  const [secEmailSuccess, setSecEmailSuccess] = useState('');

  const cashUSD = Number(client.cash_usd || 0);
  const goldKg = Number(client.gold_kg || 0);
  const silverKg = Number(client.silver_kg || 0);
  const diamondCarats = Number(client.diamond_carats || 0);
  const diamondValueUSD = Number(client.diamond_value_usd || 0);

  const goldValueUSD = Number((goldKg * spotPriceMap.Gold.kg).toFixed(2));
  const silverValueUSD = Number((silverKg * spotPriceMap.Silver.kg).toFixed(2));

  const categoryBreakdown = useMemo(() => {
    const entries: [string, number][] = [
      ['Cash (USD)', cashUSD],
      ['Gold', goldValueUSD],
      ['Silver', silverValueUSD],
      ['Certified Diamonds', diamondValueUSD],
    ];
    return entries.filter(([, v]) => v > 0);
  }, [cashUSD, goldValueUSD, silverValueUSD, diamondValueUSD]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const activePhotoHolding: VaultHoldingItem | null =
    holdings.find((h) => h.id === selectedPhotoId) || holdings[0] || null;

  const filteredTx = transactions.filter((t) => {
    const matchStatus = txFilter === 'All' || t.status === txFilter;
    const matchSearch =
      !txSearch.trim() ||
      t.tx_type.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.status.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(txSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const downloadBarListCSV = () => {
    const header = 'Item Name,Weight / Carats,Purity / GIA Grade,Serial Number,Vault Bay,Estimated USD\n';
    const rows = holdings
      .map((h) =>
        [
          `"${h.item_name}"`,
          `"${h.weight_or_carats}"`,
          `"${h.purity_or_grade}"`,
          `"${h.serial_number}"`,
          `"${h.vault_bay}"`,
          h.usd_value.toFixed(2),
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BullionStar_Holdings_${client.vault_id || 'Vault'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCertificateTxt = (cert: VaultCertificateSummary) => {
    const text = [
      'BULLIONSTAR SINGAPORE — OFFICIAL VAULT SAFEKEEPING CERTIFICATE',
      '====================================================================',
      `Certificate Number : ${cert.certificate_no}`,
      `Legal Title Holder : ${client.full_name}`,
      `Vault Account ID   : ${client.vault_id}`,
      `Email              : ${client.email}`,
      `Insured Value      : US$${Number(cert.insured_value_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `Independent Auditor: ${cert.auditor_name}`,
      `Verification Status: ${cert.audit_status}`,
      `Issued Timestamp   : ${new Date(cert.issued_at).toLocaleString()}`,
      '',
      'REGISTERED ASSET TOTALS:',
      `  Cash Balance      : US$${cashUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `  Stored Gold       : ${goldKg.toFixed(2)} kg (US$${goldValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      `  Stored Silver     : ${silverKg.toFixed(2)} kg (US$${silverValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      `  Certified Diamonds: ${diamondCarats.toFixed(2)} ct (Appraised US$${diamondValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      '',
      '45 New Bridge Road, Singapore 059398 · All-Risks Specie Insurance Underwritten at Lloyd’s of London.',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificate_no}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-16 text-center text-sm text-slate-500">
        Loading your depository account...
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12">
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#0D1F3C] px-6 py-5 text-white">
            <p className="text-xs font-medium text-[#F2D06B]">BullionStar Singapore Depository</p>
            <h1 className="font-serif text-2xl font-bold mt-1">Your Account Client Portal</h1>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in or create a depository account to view your Vault ID, USD cash balance, gold and silver kilogram holdings, certified diamonds, and official safekeeping certificates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => openAuthModal('signin')}
                className="py-3 px-4 bg-[#0D1F3C] hover:bg-[#193561] text-white font-semibold text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#F2D06B]" />
                <span>Sign In with Email</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="py-3 px-4 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Want to preview a populated institutional portfolio first?
              </div>
              <button
                onClick={demoLogin}
                className="px-3.5 py-2 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
              >
                One-Click Demo Client Login
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 space-y-6">
      {/* Client Summary Header */}
      <div className="bg-[#0D1F3C] text-white rounded-md p-6 border border-[#1D3A68]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#F2D06B] mb-1">
              <span className="font-mono font-semibold">{client.vault_id || 'BS-SG'}</span>
              <span aria-hidden="true">·</span>
              <span>{isDemoMode ? 'Demo Preview Mode' : 'Singapore Segregated Vault'}</span>
              <span aria-hidden="true">·</span>
              <span>{client.country}</span>
              {client.created_at && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Opened {client.created_at.slice(0, 10)}</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">{client.full_name}</h1>
            <p className="text-xs text-slate-300 mt-1">
              {client.email} {client.phone ? `· ${client.phone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={refreshClientSession}
              disabled={refreshingClient}
              title="Re-fetch your latest balances from Supabase"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#13294B] hover:bg-[#1E3D6E] disabled:opacity-60 border border-white/15 rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#F2D06B] ${refreshingClient ? 'animate-spin' : ''}`} />
              <span>{refreshingClient ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => {
                setFundingError('');
                setFundingModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#193561] hover:bg-[#22457C] border border-white/15 rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4 text-[#F2D06B]" />
              <span>Deposit / Withdraw Cash</span>
            </button>
            <button
              onClick={() => {
                setTradeError('');
                setTradeModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownUp className="w-4 h-4" />
              <span>Buy / Sell Bullion</span>
            </button>
          </div>
        </div>

        {/* 5 Portfolio KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-5 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-300">Total Portfolio Value ({currency})</p>
            <p className="text-2xl font-mono font-bold text-white tabular-nums mt-1">
              {formatMoney(totalPortfolioUSD)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Cash Balance (USD)</p>
            <p className="text-xl font-mono font-semibold text-[#F2D06B] tabular-nums mt-1">
              {formatMoney(cashUSD)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Stored Gold</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {goldKg.toFixed(2)} kg
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(goldValueUSD)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Stored Silver</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {silverKg.toFixed(2)} kg
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(silverValueUSD)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Certified Diamonds</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {diamondCarats.toFixed(2)} ct
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(diamondValueUSD)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded p-1.5 flex flex-wrap gap-1">
        {[
          { id: 'overview' as AccountTab, label: 'Cash & Asset Dashboard' },
          { id: 'holdings' as AccountTab, label: `Vault Holdings (${holdings.length})` },
          { id: 'certificates' as AccountTab, label: `Vault Certificate` },
          { id: 'photos' as AccountTab, label: 'High-Res Photo Verification' },
          { id: 'audits' as AccountTab, label: 'Audit & Insurance Reports' },
          { id: 'history' as AccountTab, label: `Transactions (${transactions.length})` },
          { id: 'security' as AccountTab, label: 'Security & Account Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#0D1F3C] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#0D1F3C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Cash & Asset Dashboard */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0D1F3C]">Vault Asset Summary</h2>
              <button
                onClick={refreshClientSession}
                disabled={refreshingClient}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B38818] hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${refreshingClient ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#0D1F3C]">Cash Balance (USD)</span>
                  <span className="block text-xs text-slate-500">Available for instant bullion execution</span>
                </div>
                <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                  {formatMoney(cashUSD)}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-[#0D1F3C]">Stored Gold ({goldKg.toFixed(2)} kg)</span>
                  <span className="block text-xs text-slate-500">LBMA 999.9 Fine Gold Custody</span>
                </div>
                <span className="font-mono font-bold text-[#0D1F3C] tabular-nums shrink-0">
                  {formatMoney(goldValueUSD)}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-[#0D1F3C]">Stored Silver ({silverKg.toFixed(2)} kg)</span>
                  <span className="block text-xs text-slate-500">LBMA 999.0 Fine Silver Bars</span>
                </div>
                <span className="font-mono font-bold text-[#0D1F3C] tabular-nums shrink-0">
                  {formatMoney(silverValueUSD)}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-[#0D1F3C]">
                    Certified Diamonds ({diamondCarats.toFixed(2)} ct)
                  </span>
                  <span className="block text-xs text-slate-500">Appraised GIA investment diamonds</span>
                </div>
                <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                  {formatMoney(diamondValueUSD)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">Portfolio Composition</h3>
              {totalPortfolioUSD <= 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Balance is $0.00 across cash and metals. Fund cash or await vault allocation.
                </p>
              ) : (
                <>
                  <div className="h-3 w-full rounded overflow-hidden flex bg-slate-100">
                    {categoryBreakdown.map(([cat, val]) => {
                      const pct = totalPortfolioUSD > 0 ? (val / totalPortfolioUSD) * 100 : 0;
                      const color =
                        cat === 'Gold'
                          ? 'bg-[#C59B27]'
                          : cat === 'Silver'
                          ? 'bg-slate-400'
                          : cat === 'Certified Diamonds'
                          ? 'bg-indigo-600'
                          : 'bg-[#0D1F3C]';
                      return <div key={cat} style={{ width: `${pct}%` }} className={color} />;
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 text-xs">
                    {categoryBreakdown.map(([cat, val]) => {
                      const pct = totalPortfolioUSD > 0 ? (val / totalPortfolioUSD) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-slate-600">{cat}</span>
                          <span className="font-mono font-semibold text-[#0D1F3C] tabular-nums">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Holdings Preview & Alerts */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-base font-bold text-[#0D1F3C]">
                  Allocated Bullion & Certified Diamonds
                </h2>
                <button
                  onClick={() => setActiveTab('holdings')}
                  className="text-xs font-semibold text-[#0D1F3C] hover:text-[#B38818] underline"
                >
                  View Breakdown ({holdings.length})
                </button>
              </div>

              {holdings.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-[#FAFBFD] border border-dashed border-slate-200 rounded">
                  <p className="text-sm font-semibold text-[#0D1F3C]">
                    No allocated bullion or diamond holdings yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your Singapore depository account ({client.vault_id}) is initialized at $0.00. Deposit cash to trade bullion or click Refresh after custodian allocation.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setFundingModal(true)}
                      className="px-3.5 py-2 bg-[#0D1F3C] text-white text-xs font-semibold rounded"
                    >
                      Deposit Cash
                    </button>
                    <button
                      onClick={() => setView('catalog')}
                      className="px-3.5 py-2 bg-[#C59B27] text-[#0A162B] text-xs font-bold rounded"
                    >
                      Browse Bullion Store
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {holdings.map((h) => (
                    <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                          <ResilientImage src={h.photo_url} alt={h.item_name} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#0D1F3C] truncate">
                            {h.item_name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {h.weight_or_carats} · {h.purity_or_grade} · {h.vault_bay}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">Ref: {h.serial_number}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-[#0D1F3C] tabular-nums">
                          {formatMoney(h.usd_value)}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPhotoId(h.id);
                            setActiveTab('photos');
                          }}
                          className="text-[11px] font-semibold text-[#B38818] hover:underline"
                        >
                          Inspect Photo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="bg-white border border-slate-200 rounded p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#B38818]" />
                    <h2 className="text-base font-bold text-[#0D1F3C]">Vault Notifications</h2>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-slate-600 hover:text-[#0D1F3C]"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded border text-xs ${
                        n.read ? 'bg-white border-slate-100' : 'bg-[#FAF7EC] border-[#C59B27]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-[#0D1F3C]">{n.title}</span>
                        <span className="font-mono text-[11px] text-slate-500">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Vault Holdings */}
      {activeTab === 'holdings' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">Allocated Vault Holdings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical bullion and certified diamonds stored under {client.vault_id}
              </p>
            </div>
            {holdings.length > 0 && (
              <button
                onClick={downloadBarListCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-[#0D1F3C] hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Holdings CSV</span>
              </button>
            )}
          </div>

          {holdings.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No allocated bullion or diamonds in your vault yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200 text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">Photo</th>
                    <th className="py-3 px-4 text-left font-semibold">Item Name</th>
                    <th className="py-3 px-4 text-left font-semibold">Weight / Carats</th>
                    <th className="py-3 px-4 text-left font-semibold">Purity / GIA Grade</th>
                    <th className="py-3 px-4 text-left font-semibold">Serial / Ref</th>
                    <th className="py-3 px-4 text-left font-semibold">Vault Bay</th>
                    <th className="py-3 px-4 text-right font-semibold">Live Value ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holdings.map((h) => (
                    <tr key={h.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedPhotoId(h.id);
                            setActiveTab('photos');
                          }}
                          className="w-12 h-10 rounded border border-slate-200 overflow-hidden bg-slate-50 block"
                          title="Inspect holding photo"
                        >
                          <ResilientImage src={h.photo_url} alt={h.item_name} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0D1F3C]">{h.item_name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{h.weight_or_carats}</td>
                      <td className="py-3 px-4 text-xs text-slate-700">{h.purity_or_grade}</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#0D1F3C]">{h.serial_number}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{h.vault_bay}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0D1F3C] tabular-nums">
                        {formatMoney(h.usd_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Official Vault Certificate */}
      {activeTab === 'certificates' && (
        <div className="bg-white border border-slate-200 rounded p-5">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-[#0D1F3C]">Official Vault Safekeeping Certificate</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Custody certificate for {client.full_name} ({client.vault_id})
            </p>
          </div>

          {!certificate ? (
            <div className="py-10 text-center bg-[#FAFBFD] border border-dashed border-slate-200 rounded text-sm text-slate-500">
              No custody certificate active while portfolio value is $0.00.
            </div>
          ) : (
            <div className="max-w-xl border-2 border-[#0D1F3C]/20 rounded-md p-5 bg-[#FAFBFD] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-500 block">Certificate Number</span>
                  <span className="font-mono text-sm font-bold text-[#0D1F3C]">
                    {certificate.certificate_no}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{certificate.audit_status}</span>
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">Insured Value</dt>
                  <dd className="font-mono text-base font-bold text-[#0D1F3C] tabular-nums">
                    {formatMoney(certificate.insured_value_usd)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Independent Auditor</dt>
                  <dd className="font-semibold text-slate-900">{certificate.auditor_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Legal Title Holder</dt>
                  <dd className="font-semibold text-slate-900">{client.full_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Issued Date</dt>
                  <dd className="font-mono text-slate-700">{certificate.issued_at.slice(0, 10)}</dd>
                </div>
              </dl>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCertPreview(certificate)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0D1F3C] hover:bg-[#193561] text-white text-xs font-semibold rounded"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#F2D06B]" />
                  <span>View & Print</span>
                </button>
                <button
                  onClick={() => downloadCertificateTxt(certificate)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: High-Resolution Photo Verification */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-4 space-y-2">
            <h2 className="text-sm font-bold text-[#0D1F3C] pb-2 border-b border-slate-100">
              Select Vaulted Item for Photo Audit
            </h2>
            {holdings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No physical items allocated yet.</p>
            ) : (
              holdings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setSelectedPhotoId(h.id);
                    setPhotoZoomed(false);
                  }}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    activePhotoHolding?.id === h.id
                      ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                      : 'bg-white hover:bg-[#F8FAFC] border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="truncate">{h.item_name}</span>
                    <span className="font-mono shrink-0">{h.weight_or_carats}</span>
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-1 ${
                      activePhotoHolding?.id === h.id ? 'text-[#F2D06B]' : 'text-slate-500'
                    }`}
                  >
                    {h.serial_number}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded overflow-hidden">
            {activePhotoHolding ? (
              <div>
                <div className="px-5 py-3.5 bg-[#0D1F3C] text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#F2D06B]" />
                    <span className="text-sm font-bold">
                      Documentary Vault Verification · {activePhotoHolding.vault_bay}
                    </span>
                  </div>
                  <button
                    onClick={() => setPhotoZoomed(!photoZoomed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{photoZoomed ? 'Reset Zoom' : 'Inspect 2x Magnification'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 overflow-hidden aspect-[4/3] max-h-[440px] relative">
                  <div
                    className={`w-full h-full transition-transform duration-300 ${
                      photoZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                    }`}
                    onClick={() => setPhotoZoomed(!photoZoomed)}
                  >
                    <ResilientImage
                      src={activePhotoHolding.photo_url}
                      alt={`Vault verification of ${activePhotoHolding.item_name}`}
                    />
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F8FAFC] border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Item Name</span>
                    <span className="font-bold text-[#0D1F3C]">{activePhotoHolding.item_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stamped Serial / GIA</span>
                    <span className="font-mono font-bold text-[#0D1F3C]">
                      {activePhotoHolding.serial_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Weight / Grade</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {activePhotoHolding.weight_or_carats} · {activePhotoHolding.purity_or_grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estimated Value</span>
                    <span className="font-mono font-bold text-[#0D1F3C]">
                      {formatMoney(activePhotoHolding.usd_value)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                No vaulted holdings available for photographic verification yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Audit & Insurance Reports */}
      {activeTab === 'audits' && (
        <div className="bg-white border border-slate-200 rounded p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">
                Independent Depository Audit & All-Risks Specie Insurance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Singapore Vault at 45 New Bridge Road · Audited by Bureau Veritas Singapore & BDO LLP
              </p>
            </div>
            {holdings.length > 0 && (
              <button
                onClick={downloadBarListCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-semibold text-xs rounded"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Holdings CSV</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AUDIT_REPORTS.map((rep) => (
              <div key={rep.id} className="border border-slate-200 rounded p-5 bg-[#FAFBFD] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#B38818]">
                    Policy #{rep.insurancePolicyId}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{rep.status}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0D1F3C]">{rep.auditor}</h3>
                <p className="text-xs text-slate-600">{rep.scope}</p>
                <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <dt className="text-slate-500">Audit Completion Date</dt>
                    <dd className="font-mono font-semibold text-slate-900">{rep.reportDate}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Underwriter</dt>
                    <dd className="font-semibold text-slate-900">{rep.underwriter}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Units / Bars Verified</dt>
                    <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                      {rep.barsInspected.toLocaleString()} ({rep.discrepancies} discrepancies)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Policy Coverage Limit</dt>
                    <dd className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                      {formatMoney(rep.coverageLimitUSD)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Transaction History */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">Session Activity & Ledger</h2>
              <p className="text-xs text-slate-500">Deposits, withdrawals, and spot executions</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded w-48"
                />
              </div>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Settled">Settled</option>
              </select>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No transactions recorded yet in this session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-semibold">Date & Time</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Transaction Type</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Status</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0D1F3C]">{tx.tx_type}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-emerald-700">{tx.status}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0D1F3C] tabular-nums whitespace-nowrap">
                        {formatMoney(tx.amount_usd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Security & Account Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">Security &amp; Account Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage login credentials, verified depository email, and mandatory 6-digit Email OTP protection for {client.vault_id || 'your account'}.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Active — 6-Digit Email OTP Enforced on Every Login</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Change Account Password */}
            <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
              <div className="bg-[#0D1F3C] px-5 py-3.5 text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F2D06B]" />
                <h3 className="text-sm font-bold">Change Account Password</h3>
              </div>
              <form
                autoComplete="on"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSecPwdErr('');
                  setSecPwdSuccess('');
                  if (secNewPassword.length < 6) {
                    setSecPwdErr('New password must be at least 6 characters.');
                    return;
                  }
                  if (secNewPassword !== secConfirmPassword) {
                    setSecPwdErr('New password and confirmation do not match.');
                    return;
                  }
                  setSecPwdBusy(true);
                  const res = await updateAccountPassword(secNewPassword);
                  setSecPwdBusy(false);
                  if (!res.ok) {
                    setSecPwdErr(res.error || 'Could not update password.');
                    return;
                  }
                  setSecNewPassword('');
                  setSecConfirmPassword('');
                  setSecPwdSuccess('Account password updated successfully.');
                }}
                className="p-5 space-y-4 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="sec-new-pwd" className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      id="sec-new-pwd"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={secNewPassword}
                      onChange={(e) => setSecNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                    />
                  </div>
                  <div>
                    <label htmlFor="sec-confirm-pwd" className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      id="sec-confirm-pwd"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={secConfirmPassword}
                      onChange={(e) => setSecConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                    />
                  </div>

                  {secPwdErr && (
                    <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{secPwdErr}</span>
                    </div>
                  )}

                  {secPwdSuccess && (
                    <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{secPwdSuccess}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={secPwdBusy}
                  className="w-full py-2.5 bg-[#0D1F3C] hover:bg-[#193561] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded transition-colors"
                >
                  {secPwdBusy ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Card 2: Update Registered Email */}
            <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
              <div className="bg-[#0D1F3C] px-5 py-3.5 text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F2D06B]" />
                <h3 className="text-sm font-bold">Update Registered Email</h3>
              </div>
              <form
                autoComplete="on"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSecEmailErr('');
                  setSecEmailSuccess('');

                  if (!secEmailOtpStep) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(secNewEmail.trim())) {
                      setSecEmailErr('Please enter a valid new email address.');
                      return;
                    }
                    if (secNewEmail.trim().toLowerCase() === (client.email || '').toLowerCase()) {
                      setSecEmailErr('New email address matches your current registered email.');
                      return;
                    }
                    setSecEmailBusy(true);
                    const res = await requestAccountEmailChange(secNewEmail.trim());
                    setSecEmailBusy(false);
                    if (!res.ok) {
                      setSecEmailErr(res.error || 'Could not initiate email change.');
                      return;
                    }
                    setSecEmailOtpCode('');
                    setSecEmailOtpStep(true);
                    return;
                  }

                  const cleanCode = secEmailOtpCode.replace(/\s+/g, '');
                  if (cleanCode.length !== 6) {
                    setSecEmailErr('Enter the 6-digit verification code sent to your new email.');
                    return;
                  }
                  setSecEmailBusy(true);
                  const res = await verifyAccountEmailChange(secNewEmail.trim(), cleanCode);
                  setSecEmailBusy(false);
                  if (!res.ok) {
                    setSecEmailErr(res.error || 'Email verification code was invalid or expired.');
                    return;
                  }
                  setSecEmailOtpStep(false);
                  setSecEmailOtpCode('');
                  setSecNewEmail('');
                  setSecEmailSuccess('Registered email verified and updated across Auth & vault records.');
                }}
                className="p-5 space-y-4 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="text-xs bg-[#F8FAFC] border border-slate-200 rounded p-2.5">
                    <span className="text-slate-500 block">Current Registered Email</span>
                    <span className="font-semibold text-[#0D1F3C] break-all">{client.email}</span>
                  </div>

                  <div>
                    <label htmlFor="sec-new-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      id="sec-new-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={secEmailOtpStep}
                      value={secNewEmail}
                      onChange={(e) => setSecNewEmail(e.target.value)}
                      placeholder="new.address@domain.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C] disabled:bg-slate-50"
                    />
                  </div>

                  {secEmailOtpStep && (
                    <div>
                      <label htmlFor="sec-email-otp" className="block text-xs font-semibold text-slate-700 mb-1">
                        6-Digit Verification Code
                      </label>
                      <input
                        id="sec-email-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        autoFocus
                        value={secEmailOtpCode}
                        onChange={(e) => setSecEmailOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 py-2 text-center text-base font-mono font-bold tracking-[0.35em] border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter the 6-digit confirmation code sent to {secNewEmail.trim()}.
                      </p>
                    </div>
                  )}

                  {secEmailErr && (
                    <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{secEmailErr}</span>
                    </div>
                  )}

                  {secEmailSuccess && (
                    <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{secEmailSuccess}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {secEmailOtpStep && (
                    <button
                      type="button"
                      onClick={() => {
                        setSecEmailOtpStep(false);
                        setSecEmailOtpCode('');
                        setSecEmailErr('');
                      }}
                      className="px-3 py-2.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={secEmailBusy}
                    className="flex-1 py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-xs sm:text-sm rounded transition-colors"
                  >
                    {secEmailBusy
                      ? 'Verifying...'
                      : secEmailOtpStep
                      ? 'Confirm 6-Digit Email Code'
                      : 'Send Verification Code'}
                  </button>
                </div>
              </form>
            </div>

            {/* Card 3: Two-Factor Email OTP Status & Strict Sign-Out */}
            <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
              <div className="bg-[#0A162B] px-5 py-3.5 text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#F2D06B]" />
                <h3 className="text-sm font-bold">Two-Factor OTP &amp; Session</h3>
              </div>
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Active — 6-Digit Email OTP Enforced on Every Login</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                      Every sign-in verifies both your saved password and a fresh single-use 6-digit email passcode before granting vault custody access.
                    </p>
                  </div>

                  <dl className="divide-y divide-slate-100 text-xs border border-slate-200 rounded px-3 bg-[#FAFBFD]">
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Vault Account ID</dt>
                      <dd className="font-mono font-bold text-[#0D1F3C]">{client.vault_id || 'BS-SG'}</dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Last Sign-In Timestamp</dt>
                      <dd className="font-mono text-slate-800 text-right">
                        {lastSignInAt ? new Date(lastSignInAt).toLocaleString() : 'Current Session'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm rounded transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out / Log Out Securely</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {certPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0D1F3C] rounded-md max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="bg-[#0D1F3C] text-white px-6 py-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#F2D06B]" />
                <span className="font-bold text-sm">Official Vault Safekeeping Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCertificateTxt(certPreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C59B27] text-[#0A162B] rounded text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setCertPreview(null)} aria-label="Close certificate">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between border-b-2 border-[#C59B27] pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#0D1F3C]">BullionStar Singapore</h3>
                  <p className="text-xs text-slate-500">
                    45 New Bridge Road, Singapore 059398 · Allocated Depository Certificate
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Certificate Number</span>
                  <span className="font-mono text-sm font-bold text-[#0D1F3C]">
                    {certPreview.certificate_no}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Legal Title Holder</span>
                  <span className="font-bold text-sm text-[#0D1F3C]">{client.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vault Account ID</span>
                  <span className="font-mono font-bold text-sm text-[#0D1F3C]">{client.vault_id}</span>
                </div>

                <div className="col-span-2 bg-[#F8FAFC] border border-slate-200 rounded p-4 space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Insured Custody Value</span>
                    <span className="font-mono font-bold text-[#0D1F3C]">
                      {formatMoney(certPreview.insured_value_usd)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Independent Auditor</span>
                    <span className="font-semibold text-slate-900">{certPreview.auditor_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Verification Status</span>
                    <span className="font-semibold text-emerald-700">{certPreview.audit_status}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between gap-4">
                    <span className="text-slate-500">Allocated Totals</span>
                    <span className="font-mono text-slate-900 text-right">
                      {goldKg.toFixed(2)} kg Gold · {silverKg.toFixed(2)} kg Silver · {diamondCarats.toFixed(2)} ct Diamonds
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
                BullionStar Pte. Ltd. certifies that the precious metals and certified diamonds summarized above are held in 100% segregated custody at 45 New Bridge Road, Singapore, independently verified by {certPreview.auditor_name} and insured under Lloyd’s of London Specie Policy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Funding Modal */}
      {fundingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-[#0D1F3C] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Deposit / Withdraw Cash</h3>
              <button onClick={() => setFundingModal(false)} aria-label="Close funding modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFundingError('');
                const amt = Number(fundingAmount);
                if (!amt || amt <= 0) {
                  setFundingError('Enter a valid positive amount.');
                  return;
                }
                setFundingBusy(true);
                const res = await executeFunding(fundingAction, fundingCurrency, amt, fundingMethod);
                setFundingBusy(false);
                if (!res.ok) {
                  setFundingError(res.error || 'Funding request failed.');
                  return;
                }
                setFundingModal(false);
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded">
                {(['Deposit', 'Withdraw'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setFundingAction(act)}
                    className={`py-2 text-xs font-bold rounded-sm ${
                      fundingAction === act ? 'bg-[#0D1F3C] text-white' : 'text-slate-600'
                    }`}
                  >
                    {act} Funds
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={fundingCurrency}
                    onChange={(e) => setFundingCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                  >
                    {(['USD', 'SGD', 'EUR'] as CurrencyCode[]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Rail</label>
                <select
                  value={fundingMethod}
                  onChange={(e) => setFundingMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
                >
                  <option>FAST Bank Transfer (Singapore)</option>
                  <option>PayNow Corporate (SGD Instant)</option>
                  <option>SWIFT International Wire</option>
                </select>
              </div>

              {fundingError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fundingError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={fundingBusy}
                className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors"
              >
                {fundingBusy ? 'Updating...' : `Confirm ${fundingAction}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spot Trade Modal */}
      {tradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-[#0D1F3C] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Instant Bullion Spot Execution</h3>
              <button onClick={() => setTradeModal(false)} aria-label="Close trade modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTradeError('');
                setTradeBusy(true);
                const res = await executeSpotTrade(tradeSide, tradeProductId, tradeQty, 'USD');
                setTradeBusy(false);
                if (!res.ok) {
                  setTradeError(res.error || 'Trade could not be executed.');
                  return;
                }
                setTradeModal(false);
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded">
                {(['Buy', 'Sell'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setTradeSide(side)}
                    className={`py-2 text-xs font-bold rounded-sm ${
                      tradeSide === side ? 'bg-[#0D1F3C] text-white' : 'text-slate-600'
                    }`}
                  >
                    {side} Against Cash
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Bullion / Diamond Product
                </label>
                <select
                  value={tradeProductId}
                  onChange={(e) => setTradeProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatMoney(getProductPriceUSD(p))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded"
                />
              </div>

              {(() => {
                const prod = products.find((p) => p.id === tradeProductId);
                if (!prod) return null;
                const estUSD = getProductPriceUSD(prod) * tradeQty * (tradeSide === 'Sell' ? 0.992 : 1);
                return (
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3 text-xs flex justify-between items-center">
                    <span className="text-slate-600">
                      {tradeSide === 'Buy' ? 'Debit from Cash Balance' : 'Credit to Cash Balance'} (Avail:{' '}
                      {formatMoney(cashUSD)})
                    </span>
                    <span className="font-mono text-sm font-bold text-[#0D1F3C] tabular-nums">
                      {formatMoney(estUSD)}
                    </span>
                  </div>
                );
              })()}

              {tradeError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tradeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={tradeBusy}
                className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors"
              >
                {tradeBusy ? 'Executing...' : `Execute ${tradeSide} Order Now`}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
