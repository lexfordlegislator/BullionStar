import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  Bell,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserPlus,
  Vault,
  Wallet,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { AUDIT_REPORTS } from '../data/initialData';
import {
  BUY_PAYMENT_METHODS,
  BuyPaymentMethod,
  DEPOSIT_ORIGINATING_FIELDS,
  getDefaultFieldValues,
  getTreasuryInstructions,
  PHYSICAL_DEPOSIT_ASSET_TYPES,
  SETTLEMENT_RAILS,
  SettlementRailId,
  validateRailFields,
  VAULT_FACILITY_REGIONS,
  WITHDRAWAL_RAIL_FIELDS,
} from '../data/settlementRails';
import { PendingVaultTransactionDraft, useBullion } from '../context/BullionContext';
import {
  CurrencyCode,
  UploadedMediaItem,
  VaultCertificateSummary,
  VaultHoldingItem,
} from '../types/bullion';
import { ResilientImage } from './ResilientImage';
import { TransactionOtpModal } from './TransactionOtpModal';

type AccountTab =
  | 'overview'
  | 'holdings'
  | 'certificates'
  | 'photos'
  | 'documents'
  | 'audits'
  | 'history'
  | 'security';

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
    transactionsLoading,
    refreshClientTransactions,
    notifications,
    markAllNotificationsRead,
    currency,
    convertToUSD,
    formatMoney,
    spotPriceMap,
    totalPortfolioUSD,
    products,
    getProductPriceUSD,
    sendTransactionOtp,
    cancelClientTransaction,
    setView,
    t,
  } = useBullion();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [certPreview, setCertPreview] = useState<VaultCertificateSummary | null>(null);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('');

  // OTP Modal Draft for Withdraw, Deposit, Buy/Sell, and Physical Vault Appointment
  const [txOtpDraft, setTxOtpDraft] = useState<PendingVaultTransactionDraft | null>(null);

  // Funding Modal (Deposit / Withdraw Cash)
  const [fundingModal, setFundingModal] = useState(false);
  const [fundingAction, setFundingAction] = useState<'Deposit' | 'Withdraw'>('Deposit');
  const [fundingCurrency, setFundingCurrency] = useState<CurrencyCode>('USD');
  const [fundingAmount, setFundingAmount] = useState('10000');
  const [fundingRail, setFundingRail] = useState<SettlementRailId>('SWIFT / International Wire');
  const [fundingFields, setFundingFields] = useState<Record<string, string>>(() =>
    getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire'])
  );
  const [fundingError, setFundingError] = useState('');
  const [fundingBusy, setFundingBusy] = useState(false);

  // Buy / Sell Bullion & Diamonds Modal
  const [tradeModal, setTradeModal] = useState(false);
  const [tradeSide, setTradeSide] = useState<'Buy' | 'Sell'>('Buy');
  const [tradeProductId, setTradeProductId] = useState(products[0].id);
  const [tradeQty, setTradeQty] = useState(1);
  const [tradePaymentMethod, setTradePaymentMethod] = useState<BuyPaymentMethod>(
    'SWIFT / International Wire'
  );
  const [tradeFields, setTradeFields] = useState<Record<string, string>>(() =>
    getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire'])
  );
  const [tradeError, setTradeError] = useState('');
  const [tradeBusy, setTradeBusy] = useState(false);

  // Physical Gold / Bullion Vault Deposit Modal (Regional Appointment)
  const [physicalModal, setPhysicalModal] = useState(false);
  const [physRegion, setPhysRegion] = useState<string>(VAULT_FACILITY_REGIONS[0]);
  const [physAssetType, setPhysAssetType] = useState<string>(PHYSICAL_DEPOSIT_ASSET_TYPES[0]);
  const [physEstimatedWeight, setPhysEstimatedWeight] = useState('');
  const [physPreferredDate, setPhysPreferredDate] = useState('');
  const [physPhone, setPhysPhone] = useState('');
  const [physEmail, setPhysEmail] = useState('');
  const [physNotes, setPhysNotes] = useState('');
  const [physSendEmailCopy, setPhysSendEmailCopy] = useState(true);
  const [physError, setPhysError] = useState('');
  const [physBusy, setPhysBusy] = useState(false);

  // Physical Precious Metals Release Modal (Armored Delivery / Vault Release)
  type ReleaseAssetType = 'Gold Bullion' | 'Silver Bullion' | 'GIA Certified Diamonds';
  type ReleaseMethodType = 'Insured Armored Delivery' | 'Vault Counter Collection';

  const [releaseModal, setReleaseModal] = useState(false);
  const [releaseAsset, setReleaseAsset] = useState<ReleaseAssetType>('Gold Bullion');
  const [releaseQuantity, setReleaseQuantity] = useState('');
  const [releaseMethod, setReleaseMethod] = useState<ReleaseMethodType>('Insured Armored Delivery');
  const [relRecipientName, setRelRecipientName] = useState('');
  const [relPhone, setRelPhone] = useState('');
  const [relStreet, setRelStreet] = useState('');
  const [relCity, setRelCity] = useState('');
  const [relState, setRelState] = useState('');
  const [relPostal, setRelPostal] = useState('');
  const [relCountry, setRelCountry] = useState('');
  const [relNotes, setRelNotes] = useState('');
  const [relError, setRelError] = useState('');
  const [relBusy, setRelBusy] = useState(false);

  const [txFilter, setTxFilter] = useState('All');
  const [txSearch, setTxSearch] = useState('');
  const [confirmCancelTxId, setConfirmCancelTxId] = useState<string | null>(null);
  const [cancellingTxId, setCancellingTxId] = useState<string | null>(null);
  const [txCancelError, setTxCancelError] = useState('');

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

  // Photos & Documents Modals
  const [lightboxMedia, setLightboxMedia] = useState<{
    title: string;
    file_url: string;
    badge?: string;
    subtitle?: string;
  } | null>(null);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedMediaItem | null>(null);

  const uploadedMedia: UploadedMediaItem[] = Array.isArray(client.uploaded_media)
    ? client.uploaded_media
    : [];

  const isPhotoMedia = (item: UploadedMediaItem): boolean => {
    const cat = (item.category || '').toLowerCase();
    const mime = (item.file_type || '').toLowerCase();
    const url = (item.file_url || '').toLowerCase();
    if (cat.includes('photo')) return true;
    if (mime.startsWith('image/')) return true;
    return /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(url);
  };

  const photoBadgeLabel = (category: UploadedMediaItem['category']): string => {
    if (category === 'Gold Photo') return 'Gold Bullion';
    if (category === 'Silver Photo') return 'Silver Bullion';
    if (category === 'Diamond Photo') return 'GIA Diamond';
    return 'Vault Custody';
  };

  const docBadgeLabel = (category: UploadedMediaItem['category']): string => {
    if (category === 'Assay / Insurance Report') return 'Assay / Insurance Report';
    if (category === 'Vault Certificate / PDF Document') return 'Vault Certificate';
    return category;
  };

  const uploadedPhotos = uploadedMedia.filter(isPhotoMedia);
  const uploadedDocuments = uploadedMedia.filter((item) => !isPhotoMedia(item));

  const triggerDownload = async (url: string, filename: string) => {
    try {
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

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

  const openReleaseModal = () => {
    const initialAsset: ReleaseAssetType =
      goldKg > 0
        ? 'Gold Bullion'
        : silverKg > 0
        ? 'Silver Bullion'
        : diamondCarats > 0
        ? 'GIA Certified Diamonds'
        : 'Gold Bullion';
    const maxQty =
      initialAsset === 'Gold Bullion'
        ? goldKg
        : initialAsset === 'Silver Bullion'
        ? silverKg
        : diamondCarats;

    setReleaseAsset(initialAsset);
    setReleaseQuantity(maxQty > 0 ? String(Number(maxQty.toFixed(3))) : '');
    setReleaseMethod('Insured Armored Delivery');
    setRelRecipientName(client.full_name || '');
    setRelPhone(client.phone || '');
    setRelStreet('');
    setRelCity('');
    setRelState('');
    setRelPostal('');
    setRelCountry(client.country || '');
    setRelNotes('');
    setRelError('');
    setReleaseModal(true);
  };

  const formatDetailKey = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const filteredTx = transactions.filter((t) => {
    const matchStatus = txFilter === 'All' || t.status === txFilter;
    const q = txSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.tx_type.toLowerCase().includes(q) ||
      (t.asset_summary || '').toLowerCase().includes(q) ||
      (t.settlement_rail || '').toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);
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
            <p className="text-xs font-medium text-[#F2D06B]">{t('auth.depository')}</p>
            <h1 className="font-serif text-2xl font-bold mt-1">{t('portal.guestTitle')}</h1>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">{t('portal.guestDesc')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => openAuthModal('signin')}
                className="py-3 px-4 bg-[#0D1F3C] hover:bg-[#193561] text-white font-semibold text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#F2D06B]" />
                <span>{t('portal.signInEmail')}</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="py-3 px-4 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('header.createAccount')}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">{t('portal.demoPreviewPrompt')}</div>
              <button
                onClick={demoLogin}
                className="px-3.5 py-2 bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold text-[#0D1F3C] transition-colors whitespace-nowrap shrink-0"
              >
                {t('portal.demoLogin')}
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
              <span>{isDemoMode ? t('portal.demoMode') : t('portal.segregatedVault')}</span>
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
              <span>{refreshingClient ? t('common.refreshing') : t('common.refresh')}</span>
            </button>
            <button
              onClick={() => {
                setFundingAction('Deposit');
                setFundingRail('SWIFT / International Wire');
                setFundingFields(getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire']));
                setFundingError('');
                setFundingModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#193561] hover:bg-[#22457C] border border-white/15 rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4 text-[#F2D06B]" />
              <span>{t('portal.btnDepositWithdraw')}</span>
            </button>
            <button
              onClick={() => {
                setPhysPhone(client.phone || '');
                setPhysEmail(client.email || '');
                setPhysEstimatedWeight('');
                setPhysPreferredDate('');
                setPhysNotes('');
                setPhysError('');
                setPhysicalModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#193561] hover:bg-[#22457C] border border-white/15 rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Vault className="w-4 h-4 text-[#F2D06B]" />
              <span>{t('portal.btnDepositPhysical')}</span>
            </button>
            <button
              onClick={openReleaseModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#193561] hover:bg-[#22457C] border border-[#C59B27]/50 rounded text-xs sm:text-sm font-semibold text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              <Truck className="w-4 h-4 text-[#F2D06B]" />
              <span>{t('portal.btnReleaseMetals')}</span>
            </button>
            <button
              onClick={() => {
                setTradeSide('Buy');
                setTradePaymentMethod('SWIFT / International Wire');
                setTradeFields(getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire']));
                setTradeError('');
                setTradeModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowDownUp className="w-4 h-4" />
              <span>{t('portal.btnBuySell')}</span>
            </button>
          </div>
        </div>

        {/* 5 Portfolio KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-5 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-300">{t('portal.kpiTotalPortfolio', { currency })}</p>
            <p className="text-2xl font-mono font-bold text-white tabular-nums mt-1">
              {formatMoney(totalPortfolioUSD)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">{t('portal.kpiCash')}</p>
            <p className="text-xl font-mono font-semibold text-[#F2D06B] tabular-nums mt-1">
              {formatMoney(cashUSD)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">{t('portal.kpiGold')}</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {goldKg.toFixed(2)} kg
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(goldValueUSD)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">{t('portal.kpiSilver')}</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {silverKg.toFixed(2)} kg
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(silverValueUSD)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">{t('portal.kpiDiamonds')}</p>
            <p className="text-xl font-mono font-semibold text-white tabular-nums mt-1">
              {diamondCarats.toFixed(2)} ct
              <span className="block text-[11px] text-slate-300 font-normal">
                {formatMoney(diamondValueUSD)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Left Navigation Sidebar + Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-md overflow-hidden lg:sticky lg:top-40">
          <div className="bg-[#0A162B] px-4 py-3 text-white border-b border-[#1D3A68]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F2D06B]">
              {t('portal.menuTitle')}
            </p>
          </div>
          <nav aria-label="Client dashboard navigation" className="p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {[
              { id: 'overview' as AccountTab, label: t('portal.tabOverview') },
              { id: 'holdings' as AccountTab, label: t('portal.tabHoldings', { count: holdings.length }) },
              { id: 'certificates' as AccountTab, label: t('portal.tabCertificates') },
              { id: 'photos' as AccountTab, label: t('portal.tabPhotos') },
              { id: 'documents' as AccountTab, label: t('portal.tabDocuments', { count: uploadedMedia.length }) },
              { id: 'audits' as AccountTab, label: t('portal.tabAudits') },
              { id: 'history' as AccountTab, label: t('portal.tabHistory', { count: transactions.length }) },
              { id: 'security' as AccountTab, label: t('portal.tabSecurity') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'history') {
                    refreshClientTransactions();
                  }
                }}
                className={`px-3.5 py-2.5 text-start text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap lg:whitespace-normal shrink-0 flex items-center justify-between gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#0D1F3C] text-[#F2D06B] border-s-4 border-[#C59B27]'
                    : 'text-slate-700 hover:bg-[#F4F6F9] hover:text-[#0D1F3C] border-s-4 border-transparent'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-9 min-w-0 space-y-6">

      {/* TAB 1: Cash & Asset Dashboard */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0D1F3C]">
                {t('portal.vaultAssetSummary')}
              </h2>
              <button
                onClick={refreshClientSession}
                disabled={refreshingClient}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B38818] hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${refreshingClient ? 'animate-spin' : ''}`} />
                <span>{t('common.refresh')}</span>
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
              <h3 className="text-xs font-semibold text-slate-700 mb-2">
                {t('portal.portfolioComposition')}
              </h3>
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-base font-bold text-[#0D1F3C]">
                  {t('portal.allocatedTitle')}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={openReleaseModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1F3C] hover:bg-[#193561] text-[#F2D06B] text-xs font-semibold rounded transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('portal.btnReleaseMetals')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('holdings')}
                    className="text-xs font-semibold text-[#0D1F3C] hover:text-[#B38818] underline"
                  >
                    {t('portal.viewBreakdown', { count: holdings.length })}
                  </button>
                </div>
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
                      onClick={() => {
                        setFundingAction('Deposit');
                        setFundingRail('SWIFT / International Wire');
                        setFundingFields(getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire']));
                        setFundingError('');
                        setFundingModal(true);
                      }}
                      className="px-3.5 py-2 bg-[#0D1F3C] text-white text-xs font-semibold rounded"
                    >
                      Deposit Cash
                    </button>
                    <button
                      onClick={() => {
                        setPhysPhone(client.phone || '');
                        setPhysEmail(client.email || '');
                        setPhysError('');
                        setPhysicalModal(true);
                      }}
                      className="px-3.5 py-2 border border-slate-300 bg-white text-[#0D1F3C] text-xs font-semibold rounded hover:bg-slate-50"
                    >
                      Deposit Physical Bullion
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
                    <h2 className="text-base font-bold text-[#0D1F3C]">{t('portal.notificationsTitle')}</h2>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-slate-600 hover:text-[#0D1F3C]"
                    >
                      {t('portal.markAllRead')}
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
              <h2 className="text-base font-bold text-[#0D1F3C]">
                {t('portal.tabHoldings', { count: holdings.length })}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical bullion and certified diamonds stored under {client.vault_id}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openReleaseModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded text-xs font-bold transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t('portal.btnReleaseMetals')}</span>
              </button>
              {holdings.length > 0 && (
                <button
                  onClick={downloadBarListCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded text-xs font-semibold text-[#0D1F3C] hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('portal.exportCsv')}</span>
                </button>
              )}
            </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPhotoZoomed(!photoZoomed)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>{photoZoomed ? 'Reset Zoom' : 'Inspect 2x Magnification'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setLightboxZoomed(false);
                        setLightboxMedia({
                          title: activePhotoHolding.item_name,
                          file_url: activePhotoHolding.photo_url,
                          badge: activePhotoHolding.weight_or_carats,
                          subtitle: `${activePhotoHolding.serial_number} · ${activePhotoHolding.vault_bay}`,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Full-Screen</span>
                    </button>
                    <button
                      onClick={() =>
                        triggerDownload(
                          activePhotoHolding.photo_url,
                          `${client.vault_id || 'Vault'}_${activePhotoHolding.serial_number}.jpg`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] rounded text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#090D16] overflow-hidden aspect-[10/7] relative">
                  <div
                    className={`w-full h-full transition-transform duration-300 ${
                      photoZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                    }`}
                    onClick={() => setPhotoZoomed(!photoZoomed)}
                  >
                    <ResilientImage
                      src={activePhotoHolding.photo_url}
                      alt={`Vault verification of ${activePhotoHolding.item_name}`}
                      className="w-full h-full object-contain"
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

      {/* TAB 5: Photos & Documents (Admin-uploaded real client files) */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">Photos &amp; Documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical intake photos, assay certificates, GIA dossiers, and custody receipts issued for {client.vault_id || 'your account'}
              </p>
            </div>
            <button
              onClick={refreshClientSession}
              disabled={refreshingClient}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold text-[#0D1F3C]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B38818] ${refreshingClient ? 'animate-spin' : ''}`} />
              <span>{refreshingClient ? 'Refreshing...' : 'Refresh Files'}</span>
            </button>
          </div>

          {uploadedMedia.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-md p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F6F9] border border-slate-200 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6 text-[#B38818]" />
              </div>
              <p className="text-sm font-semibold text-[#0D1F3C]">
                No custom physical intake photos or signed documents uploaded yet.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When your custody officer uploads intake photographs, GIA reports, or signed vault certificates, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section A: Uploaded Vault Asset Photos */}
              <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#B38818]" />
                    <h3 className="text-base font-bold text-[#0D1F3C]">
                      Uploaded Vault Asset Photos ({uploadedPhotos.length})
                    </h3>
                  </div>
                </div>

                {uploadedPhotos.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No physical asset photographs uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {uploadedPhotos.map((item) => (
                      <div
                        key={item.id}
                        className="border-2 border-[#0D1F3C]/15 rounded-md overflow-hidden bg-[#FAFBFD] flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div
                            onClick={() => {
                              setLightboxZoomed(false);
                              setLightboxMedia({
                                title: item.title,
                                file_url: item.file_url,
                                badge: photoBadgeLabel(item.category),
                                subtitle: `Uploaded ${new Date(item.uploaded_at).toLocaleDateString()}`,
                              });
                            }}
                            className="aspect-[4/3] bg-slate-900 relative overflow-hidden cursor-zoom-in group"
                          >
                            <img
                              src={item.file_url}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-[#0A162B]/90 border border-[#C59B27]/50 text-[#F2D06B] text-[11px] font-bold">
                              {photoBadgeLabel(item.category)}
                            </span>
                            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-sm bg-black/70 text-white text-[11px] font-medium inline-flex items-center gap-1">
                              <ZoomIn className="w-3 h-3" />
                              <span>Inspect Full-Screen</span>
                            </span>
                          </div>
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-[#0D1F3C] leading-snug">{item.title}</h4>
                            <p className="text-[11px] font-mono text-slate-500 mt-1">
                              Uploaded {new Date(item.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="px-4 pb-4 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setLightboxZoomed(false);
                              setLightboxMedia({
                                title: item.title,
                                file_url: item.file_url,
                                badge: photoBadgeLabel(item.category),
                                subtitle: `Uploaded ${new Date(item.uploaded_at).toLocaleDateString()}`,
                              });
                            }}
                            className="flex-1 py-2 px-3 bg-[#0D1F3C] hover:bg-[#193561] text-white text-xs font-semibold rounded inline-flex items-center justify-center gap-1.5"
                          >
                            <ZoomIn className="w-3.5 h-3.5 text-[#F2D06B]" />
                            <span>Full-Screen Zoom</span>
                          </button>
                          <button
                            onClick={() => triggerDownload(item.file_url, item.file_name || `${item.title}.jpg`)}
                            className="py-2 px-3 border border-slate-300 hover:bg-white text-[#0D1F3C] text-xs font-semibold rounded inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section B: Official Vault Documents & Certificates */}
              <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B38818]" />
                    <h3 className="text-base font-bold text-[#0D1F3C]">
                      Official Vault Documents &amp; Certificates ({uploadedDocuments.length})
                    </h3>
                  </div>
                </div>

                {uploadedDocuments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No official vault certificates or PDF documents uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-slate-200 rounded p-4 bg-[#FAFBFD] flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded bg-[#0D1F3C] text-[#F2D06B] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-sm bg-[#FAF7EC] border border-[#C59B27]/40 text-[#9A720F] text-[10px] font-bold uppercase tracking-wide mb-1">
                              {docBadgeLabel(doc.category)}
                            </span>
                            <h4 className="text-sm font-bold text-[#0D1F3C] leading-snug break-words">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                              {doc.file_name || 'Vault Document'} · {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="flex-1 py-2 px-3 bg-[#0D1F3C] hover:bg-[#193561] text-white text-xs font-semibold rounded inline-flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#F2D06B]" />
                            <span>View Document</span>
                          </button>
                          <button
                            onClick={() => triggerDownload(doc.file_url, doc.file_name || doc.title)}
                            className="py-2 px-3 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] text-xs font-bold rounded inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* TAB 6: Transaction History (Synced live from Supabase vault_transactions) */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0D1F3C]">{t('portal.txTitle')}</h2>
              <p className="text-xs text-slate-500">{t('portal.txSubtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={refreshClientTransactions}
                disabled={transactionsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold text-[#0D1F3C]"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#B38818] ${transactionsLoading ? 'animate-spin' : ''}`} />
                <span>{transactionsLoading ? t('common.refreshing') : t('common.refresh')}</span>
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder={t('portal.txSearchPlaceholder')}
                  className="ps-8 pe-3 py-1.5 text-xs border border-slate-300 rounded w-44 sm:w-48"
                />
              </div>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-semibold"
              >
                <option value="All">{t('status.All')}</option>
                <option value="Pending">{t('status.Pending')}</option>
                <option value="Completed">{t('status.Completed')}</option>
                <option value="Declined">{t('status.Declined')}</option>
                <option value="Cancelled">{t('status.Cancelled')}</option>
              </select>
            </div>
          </div>

          {txCancelError && (
            <div className="mx-4 mt-4 flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{txCancelError}</span>
            </div>
          )}

          {filteredTx.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {transactionsLoading
                ? 'Loading transactions from vault ledger...'
                : 'No matching transactions recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-start font-semibold">{t('portal.txColDate')}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{t('portal.txColType')}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{t('portal.txColRail')}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{t('portal.txColStatus')}</th>
                    <th className="py-2.5 px-4 text-end font-semibold">
                      {t('portal.txColAmount', { currency })}
                    </th>
                    <th className="py-2.5 px-4 text-end font-semibold">{t('portal.txColAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTx.map((tx) => {
                    const st = (tx.status || 'Pending').trim();
                    const isPending = st === 'Pending';
                    const isDeclined = st === 'Declined';
                    const isCancelled = st === 'Cancelled';
                    const statusLabel =
                      st === 'Pending'
                        ? t('status.Pending')
                        : st === 'Completed'
                        ? t('status.Completed')
                        : st === 'Declined'
                        ? t('status.Declined')
                        : st === 'Cancelled'
                        ? t('status.Cancelled')
                        : st;
                    const detailEntries = tx.account_details
                      ? Object.entries(tx.account_details).filter(([, val]) => String(val).trim() !== '')
                      : [];
                    return (
                      <tr key={tx.id} className="hover:bg-[#F8FAFC] align-top">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0D1F3C]">{tx.tx_type}</div>
                          {tx.asset_summary && (
                            <div className="text-[11px] text-slate-600 mt-0.5">{tx.asset_summary}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {tx.settlement_rail || 'Treasury Settlement'}
                          </div>
                          {detailEntries.length > 0 && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                              {detailEntries.slice(0, 5).map(([k, v]) => (
                                <div key={k}>
                                  <span className="font-medium text-slate-600">
                                    {formatDetailKey(k)}:
                                  </span>{' '}
                                  <span className="font-mono">{v}</span>
                                </div>
                              ))}
                              {detailEntries.length > 5 && (
                                <div className="text-[10px] text-slate-400">
                                  +{detailEntries.length - 5} more submitted detail(s)
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[11px] font-bold ${
                              isPending
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : isDeclined
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : isCancelled
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            }`}
                          >
                            {isPending ? (
                              <Clock className="w-3 h-3" />
                            ) : isDeclined || isCancelled ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end font-mono font-bold text-[#0D1F3C] tabular-nums whitespace-nowrap">
                          {tx.amount_usd > 0 ? formatMoney(tx.amount_usd) : 'Vault Intake'}
                        </td>
                        <td className="py-3 px-4 text-end whitespace-nowrap">
                          {isPending ? (
                            confirmCancelTxId === tx.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={cancellingTxId === tx.id}
                                  onClick={async () => {
                                    setTxCancelError('');
                                    setCancellingTxId(tx.id);
                                    const res = await cancelClientTransaction(tx.id);
                                    setCancellingTxId(null);
                                    setConfirmCancelTxId(null);
                                    if (!res.ok) {
                                      setTxCancelError(res.error || 'Failed to cancel transaction request.');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded text-[11px] font-bold transition-colors"
                                >
                                  {cancellingTxId === tx.id
                                    ? t('portal.cancelling')
                                    : t('portal.confirmCancel')}
                                </button>
                                <button
                                  type="button"
                                  disabled={cancellingTxId === tx.id}
                                  onClick={() => setConfirmCancelTxId(null)}
                                  className="px-2 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold"
                                >
                                  {t('portal.keepRequest')}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTxCancelError('');
                                  setConfirmCancelTxId(tx.id);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 rounded text-[11px] font-semibold transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{t('portal.cancelRequest')}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              <h2 className="text-base font-bold text-[#0D1F3C]">{t('portal.securityTitle')}</h2>
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
                <h3 className="text-sm font-bold">{t('portal.changePassword')}</h3>
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
                <h3 className="text-sm font-bold">{t('portal.updateEmail')}</h3>
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
                <h3 className="text-sm font-bold">{t('portal.twoFactorCard')}</h3>
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
                  <span>{t('portal.signOutSecure')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

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

      {/* Funding Modal: Deposit & Cash Withdrawal with Rail-Specific Account Details & OTP Gate */}
      {fundingModal && (() => {
        const activeFieldDefs =
          fundingAction === 'Withdraw'
            ? WITHDRAWAL_RAIL_FIELDS[fundingRail]
            : DEPOSIT_ORIGINATING_FIELDS[fundingRail];
        const treasuryInfo =
          fundingAction === 'Deposit' ? getTreasuryInstructions(fundingRail, client.vault_id) : null;
        const parsedAmt = Number(fundingAmount) || 0;
        const amtUSD = parsedAmt > 0 ? Number(convertToUSD(parsedAmt, fundingCurrency).toFixed(2)) : 0;
        const fieldsValidation = validateRailFields(activeFieldDefs, fundingFields);
        const canContinueFunding =
          parsedAmt > 0 &&
          fieldsValidation.valid &&
          (fundingAction !== 'Withdraw' || amtUSD <= cashUSD);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 no-print">
            <div className="bg-white border border-slate-200 rounded-md max-w-xl w-full overflow-hidden shadow-xl max-h-[92vh] flex flex-col">
              <div className="bg-[#0D1F3C] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-base">
                    {fundingAction === 'Deposit' ? 'Deposit Cash Funds' : 'Withdraw Cash Balance'}
                  </h3>
                  <p className="text-[11px] text-[#F2D06B]">
                    {fundingAction === 'Deposit'
                      ? 'Originating account verification + Treasury instructions + 6-Digit Email OTP'
                      : 'Destination bank/wallet verification + 6-Digit Email OTP'}
                  </p>
                </div>
                <button
                  onClick={() => setFundingModal(false)}
                  aria-label="Close funding modal"
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFundingError('');
                  if (parsedAmt <= 0) {
                    setFundingError('Enter a valid positive amount.');
                    return;
                  }
                  if (fundingAction === 'Withdraw' && amtUSD > cashUSD) {
                    setFundingError(
                      `Withdrawal (${formatMoney(amtUSD)}) exceeds available cash balance (${formatMoney(cashUSD)}).`
                    );
                    return;
                  }
                  if (!fieldsValidation.valid) {
                    setFundingError(fieldsValidation.error || 'Please fill in all required account fields.');
                    return;
                  }

                  setFundingBusy(true);
                  const otpRes = await sendTransactionOtp();
                  setFundingBusy(false);

                  if (!otpRes.ok) {
                    setFundingError(otpRes.error || 'Failed to send 6-digit security code.');
                    return;
                  }

                  setFundingModal(false);
                  setTxOtpDraft({
                    tx_type: fundingAction === 'Withdraw' ? 'Cash Withdrawal' : 'Cash Deposit',
                    asset_summary: `${fundingCurrency} ${parsedAmt.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    amount_usd: amtUSD,
                    currency: fundingCurrency,
                    settlement_rail: fundingRail,
                    account_details: {
                      ...fundingFields,
                      'Declared Amount': `${fundingCurrency} ${parsedAmt.toFixed(2)} (≈ US$${amtUSD.toFixed(2)})`,
                    },
                  });
                }}
                className="p-5 space-y-4 overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded">
                  {(['Deposit', 'Withdraw'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => {
                        setFundingAction(act);
                        setFundingError('');
                        setFundingFields(
                          getDefaultFieldValues(
                            act === 'Withdraw'
                              ? WITHDRAWAL_RAIL_FIELDS[fundingRail]
                              : DEPOSIT_ORIGINATING_FIELDS[fundingRail]
                          )
                        );
                      }}
                      className={`py-2 text-xs font-bold rounded-sm transition-colors ${
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
                      required
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded"
                    />
                  </div>
                </div>

                {fundingAction === 'Withdraw' && (
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Available Withdrawable Cash</span>
                    <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                      {formatMoney(cashUSD)}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Settlement Rail
                  </label>
                  <select
                    value={fundingRail}
                    onChange={(e) => {
                      const nextRail = e.target.value as SettlementRailId;
                      setFundingRail(nextRail);
                      setFundingError('');
                      setFundingFields(
                        getDefaultFieldValues(
                          fundingAction === 'Withdraw'
                            ? WITHDRAWAL_RAIL_FIELDS[nextRail]
                            : DEPOSIT_ORIGINATING_FIELDS[nextRail]
                        )
                      );
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C]"
                  >
                    {SETTLEMENT_RAILS.map((rail) => (
                      <option key={rail} value={rail}>
                        {rail}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receiving Treasury Instructions for Deposit */}
                {treasuryInfo && (
                  <div className="bg-[#0A162B] text-white rounded p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#F2D06B] font-bold">
                      <Building2 className="w-4 h-4" />
                      <span>{treasuryInfo.headline}</span>
                    </div>
                    <div className="space-y-1 border-t border-white/10 pt-2 text-[11px]">
                      {treasuryInfo.rows.map((r) => (
                        <div key={r.label} className="flex justify-between gap-3">
                          <span className="text-slate-300 shrink-0">{r.label}:</span>
                          <span className="font-mono text-right break-all">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-300 pt-1">{treasuryInfo.note}</p>
                  </div>
                )}

                {/* Dynamic Rail-Specific Account Fields */}
                <div className="border-t border-slate-200 pt-3 space-y-3">
                  <p className="text-xs font-bold text-[#0D1F3C]">
                    {fundingAction === 'Withdraw'
                      ? `Destination Account Details (${fundingRail})`
                      : `Originating Sender Account Details (${fundingRail})`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeFieldDefs.map((field) => (
                      <div
                        key={field.key}
                        className={activeFieldDefs.length % 2 === 1 && field.key === activeFieldDefs[activeFieldDefs.length - 1].key ? 'sm:col-span-2' : ''}
                      >
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {field.label} *
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            required={field.required}
                            value={fundingFields[field.key] || ''}
                            onChange={(e) =>
                              setFundingFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            required={field.required}
                            value={fundingFields[field.key] || ''}
                            onChange={(e) =>
                              setFundingFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {fundingAction === 'Withdraw' && amtUSD > cashUSD && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Requested withdrawal ({formatMoney(amtUSD)}) exceeds available cash ({formatMoney(cashUSD)}).
                    </span>
                  </div>
                )}

                {fundingError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fundingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={fundingBusy || !canContinueFunding}
                  className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-50 text-[#0A162B] font-bold text-sm rounded transition-colors"
                >
                  {fundingBusy
                    ? 'Sending 6-Digit Email OTP...'
                    : 'Continue to Security Verification'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Buy / Sell Bullion & GIA Diamonds Modal (Payment Rail + Account Details + OTP Gate) */}
      {tradeModal && (() => {
        const prod = products.find((p) => p.id === tradeProductId) || products[0];
        const estUSD = Number(
          (getProductPriceUSD(prod) * tradeQty * (tradeSide === 'Sell' ? 0.992 : 1)).toFixed(2)
        );
        const externalRail: SettlementRailId | null =
          tradePaymentMethod === 'Available Cash Balance' ? null : tradePaymentMethod;
        const activeTradeFields = externalRail
          ? tradeSide === 'Buy'
            ? DEPOSIT_ORIGINATING_FIELDS[externalRail]
            : WITHDRAWAL_RAIL_FIELDS[externalRail]
          : [];
        const tradeTreasuryInfo =
          tradeSide === 'Buy' && externalRail
            ? getTreasuryInstructions(externalRail, client.vault_id)
            : null;
        const fieldsValidation = externalRail
          ? validateRailFields(activeTradeFields, tradeFields)
          : { valid: true };
        const hasCashForBuy =
          tradeSide !== 'Buy' ||
          tradePaymentMethod !== 'Available Cash Balance' ||
          cashUSD >= estUSD;
        const canContinueTrade = tradeQty > 0 && fieldsValidation.valid && hasCashForBuy;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 no-print">
            <div className="bg-white border border-slate-200 rounded-md max-w-xl w-full overflow-hidden shadow-xl max-h-[92vh] flex flex-col">
              <div className="bg-[#0D1F3C] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-base">
                    {tradeSide === 'Buy'
                      ? 'Buy Gold, Silver or GIA Diamonds'
                      : 'Sell Vault Bullion / Diamonds'}
                  </h3>
                  <p className="text-[11px] text-[#F2D06B]">
                    Payment rail verification + Mandatory 6-Digit Email OTP
                  </p>
                </div>
                <button
                  onClick={() => setTradeModal(false)}
                  aria-label="Close trade modal"
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTradeError('');
                  if (tradeSide === 'Buy' && tradePaymentMethod === 'Available Cash Balance' && cashUSD < estUSD) {
                    setTradeError(
                      `Insufficient Available Cash Balance (${formatMoney(cashUSD)} available vs ${formatMoney(estUSD)} order total).`
                    );
                    return;
                  }
                  if (!fieldsValidation.valid) {
                    setTradeError(fieldsValidation.error || 'Please complete all account details.');
                    return;
                  }

                  setTradeBusy(true);
                  const otpRes = await sendTransactionOtp();
                  setTradeBusy(false);

                  if (!otpRes.ok) {
                    setTradeError(otpRes.error || 'Failed to dispatch 6-digit verification code.');
                    return;
                  }

                  const accountDetails: Record<string, string> =
                    tradePaymentMethod === 'Available Cash Balance'
                      ? {
                          'Settlement Source': `Vault Cash Balance (${client.vault_id})`,
                          Product: `${tradeQty}x ${prod.name}`,
                          SKU: prod.sku,
                        }
                      : {
                          ...tradeFields,
                          Product: `${tradeQty}x ${prod.name}`,
                          SKU: prod.sku,
                        };

                  setTradeModal(false);
                  setTxOtpDraft({
                    tx_type: tradeSide === 'Buy' ? 'Buy Bullion' : 'Sell Bullion',
                    asset_summary: `${tradeQty}x ${prod.name}`,
                    amount_usd: estUSD,
                    currency,
                    settlement_rail: tradePaymentMethod,
                    account_details: accountDetails,
                  });
                }}
                className="p-5 space-y-4 overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded">
                  {(['Buy', 'Sell'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => {
                        setTradeSide(side);
                        setTradeError('');
                        if (externalRail) {
                          setTradeFields(
                            getDefaultFieldValues(
                              side === 'Buy'
                                ? DEPOSIT_ORIGINATING_FIELDS[externalRail]
                                : WITHDRAWAL_RAIL_FIELDS[externalRail]
                            )
                          );
                        }
                      }}
                      className={`py-2 text-xs font-bold rounded-sm transition-colors ${
                        tradeSide === side ? 'bg-[#0D1F3C] text-white' : 'text-slate-600'
                      }`}
                    >
                      {side} Gold / Silver / Diamonds
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
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
                </div>

                <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3 text-xs flex justify-between items-center">
                  <span className="text-slate-600">
                    {tradeSide === 'Buy' ? 'Order Total' : 'Estimated Liquidation Value'} (Cash Avail:{' '}
                    {formatMoney(cashUSD)})
                  </span>
                  <span className="font-mono text-sm font-bold text-[#0D1F3C] tabular-nums">
                    {formatMoney(estUSD)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tradeSide === 'Buy'
                      ? 'Payment / Settlement Method'
                      : 'Payout Settlement Method'}
                  </label>
                  <select
                    value={tradePaymentMethod}
                    onChange={(e) => {
                      const nextMethod = e.target.value as BuyPaymentMethod;
                      setTradePaymentMethod(nextMethod);
                      setTradeError('');
                      if (nextMethod !== 'Available Cash Balance') {
                        setTradeFields(
                          getDefaultFieldValues(
                            tradeSide === 'Buy'
                              ? DEPOSIT_ORIGINATING_FIELDS[nextMethod]
                              : WITHDRAWAL_RAIL_FIELDS[nextMethod]
                          )
                        );
                      } else {
                        setTradeFields({});
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C]"
                  >
                    {BUY_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {tradePaymentMethod === 'Available Cash Balance' ? (
                  <div className="border border-slate-200 rounded p-3 bg-[#FAFBFD] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available Vault Cash</span>
                      <span className="font-mono font-bold text-[#0D1F3C]">{formatMoney(cashUSD)}</span>
                    </div>
                    {!hasCashForBuy && (
                      <p className="text-rose-700 font-medium">
                        Insufficient available cash balance for this purchase. Choose an external wire/bank/crypto rail or deposit funds first.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {tradeTreasuryInfo && (
                      <div className="bg-[#0A162B] text-white rounded p-3.5 space-y-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-[#F2D06B] font-bold">
                          <Building2 className="w-4 h-4" />
                          <span>{tradeTreasuryInfo.headline}</span>
                        </div>
                        <div className="space-y-1 border-t border-white/10 pt-2">
                          {tradeTreasuryInfo.rows.map((r) => (
                            <div key={r.label} className="flex justify-between gap-2">
                              <span className="text-slate-300 shrink-0">{r.label}:</span>
                              <span className="font-mono text-right break-all">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-1">
                      <p className="text-xs font-bold text-[#0D1F3C]">
                        {tradeSide === 'Buy'
                          ? `Originating Payment Account / Wallet Details (${tradePaymentMethod})`
                          : `Destination Payout Account Details (${tradePaymentMethod})`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeTradeFields.map((field) => (
                          <div
                            key={field.key}
                            className={activeTradeFields.length % 2 === 1 && field.key === activeTradeFields[activeTradeFields.length - 1].key ? 'sm:col-span-2' : ''}
                          >
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              {field.label} *
                            </label>
                            {field.type === 'select' && field.options ? (
                              <select
                                required={field.required}
                                value={tradeFields[field.key] || ''}
                                onChange={(e) =>
                                  setTradeFields((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                required={field.required}
                                value={tradeFields[field.key] || ''}
                                onChange={(e) =>
                                  setTradeFields((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {tradeError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{tradeError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={tradeBusy || !canContinueTrade}
                  className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-50 text-[#0A162B] font-bold text-sm rounded transition-colors"
                >
                  {tradeBusy
                    ? 'Sending 6-Digit Email OTP...'
                    : 'Continue to Security Verification'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Physical Gold / Bullion Vault Deposit Modal (Regional Intake Appointment) */}
      {physicalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-md max-w-xl w-full overflow-hidden shadow-xl max-h-[92vh] flex flex-col">
            <div className="bg-[#0D1F3C] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Vault className="w-5 h-5 text-[#F2D06B]" />
                <div>
                  <h3 className="font-bold text-base">Deposit Physical Gold / Bullion</h3>
                  <p className="text-[11px] text-[#F2D06B]">
                    Insured Intake, Ultrasonic Assay &amp; Custody Allocation Appointment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPhysicalModal(false)}
                aria-label="Close physical bullion deposit modal"
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPhysError('');
                if (!physEstimatedWeight.trim() || !physPreferredDate || !physPhone.trim() || !physEmail.trim()) {
                  setPhysError('Please complete all required regional vault appointment fields.');
                  return;
                }

                setPhysBusy(true);
                const otpRes = await sendTransactionOtp();
                setPhysBusy(false);

                if (!otpRes.ok) {
                  setPhysError(otpRes.error || 'Failed to send 6-digit security verification code.');
                  return;
                }

                setPhysicalModal(false);
                setTxOtpDraft({
                  tx_type: 'Physical Vault Appointment',
                  asset_summary: `${physAssetType} · ${physEstimatedWeight.trim()} (${physRegion})`,
                  amount_usd: 0,
                  currency: 'USD',
                  settlement_rail: physRegion,
                  sendEmailToTreasury: physSendEmailCopy,
                  account_details: {
                    'Vault Region': physRegion,
                    'Metal / Asset Type': physAssetType,
                    'Estimated Weight / Quantity': physEstimatedWeight.trim(),
                    'Preferred Intake Date': physPreferredDate,
                    'Contact Phone': physPhone.trim(),
                    'Contact Email': physEmail.trim(),
                    ...(physNotes.trim() ? { 'Assay / Armored Notes': physNotes.trim() } : {}),
                    'Confirmation to info@bullionstar.in.net': physSendEmailCopy ? 'Yes' : 'No',
                  },
                });
              }}
              className="p-5 space-y-4 overflow-y-auto"
            >
              <div className="bg-[#FAF7EC] border border-[#C59B27]/40 rounded p-3.5 text-xs text-slate-700 leading-relaxed">
                <strong className="text-[#0D1F3C] block mb-0.5">
                  Insured Intake &amp; Assay Protocol Required
                </strong>
                Physical gold, silver, platinum, or GIA diamond deposits cannot be credited remotely. Book a private intake &amp; ultrasonic XRF assay appointment at your nearest regional vault facility below.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nearest Vault Region *
                  </label>
                  <select
                    value={physRegion}
                    onChange={(e) => setPhysRegion(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C]"
                  >
                    {VAULT_FACILITY_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metal / Asset Type *
                  </label>
                  <select
                    value={physAssetType}
                    onChange={(e) => setPhysAssetType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C]"
                  >
                    {PHYSICAL_DEPOSIT_ASSET_TYPES.map((asset) => (
                      <option key={asset} value={asset}>
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Weight / Quantity *
                  </label>
                  <input
                    type="text"
                    required
                    value={physEstimatedWeight}
                    onChange={(e) => setPhysEstimatedWeight(e.target.value)}
                    placeholder="e.g. 5 kg (5x 1 kg Gold Bars)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Appointment Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={physPreferredDate}
                      onChange={(e) => setPhysPreferredDate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={physPhone}
                    onChange={(e) => setPhysPhone(e.target.value)}
                    placeholder="+65 9123 4567"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={physEmail}
                    onChange={(e) => setPhysEmail(e.target.value)}
                    placeholder="client@domain.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Armored Logistics / Bar Serial Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={physNotes}
                    onChange={(e) => setPhysNotes(e.target.value)}
                    placeholder="Optional refiner brands, serial list, or armored courier carrier (e.g. Brink's / Malca-Amit)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer bg-[#F8FAFC] border border-slate-200 rounded p-3">
                <input
                  type="checkbox"
                  checked={physSendEmailCopy}
                  onChange={(e) => setPhysSendEmailCopy(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#0D1F3C]"
                />
                <span>
                  Send vault intake appointment confirmation directly to BullionStar Custody Desk (
                  <strong className="text-[#0D1F3C]">info@bullionstar.in.net</strong>) upon OTP verification.
                </span>
              </label>

              {physError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{physError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  physBusy ||
                  !physEstimatedWeight.trim() ||
                  !physPreferredDate ||
                  !physPhone.trim() ||
                  !physEmail.trim()
                }
                className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-50 text-[#0A162B] font-bold text-sm rounded transition-colors"
              >
                {physBusy
                  ? 'Sending 6-Digit Email OTP...'
                  : 'Continue to Security Verification'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Physical Precious Metals Release Modal (Armored Delivery / Vault Release + Mandatory Address + OTP Gate) */}
      {releaseModal && (() => {
        const assetOptions: {
          id: ReleaseAssetType;
          label: string;
          unit: 'kg' | 'ct';
          available: number;
          usdTotal: number;
        }[] = [
          {
            id: 'Gold Bullion',
            label: 'Gold Bullion (LBMA 999.9)',
            unit: 'kg',
            available: goldKg,
            usdTotal: goldValueUSD,
          },
          {
            id: 'Silver Bullion',
            label: 'Silver Bullion (LBMA 999.0)',
            unit: 'kg',
            available: silverKg,
            usdTotal: silverValueUSD,
          },
          {
            id: 'GIA Certified Diamonds',
            label: 'GIA Certified Diamonds',
            unit: 'ct',
            available: diamondCarats,
            usdTotal: diamondValueUSD,
          },
        ];

        const hasAnyPhysicalHoldings = goldKg > 0 || silverKg > 0 || diamondCarats > 0;
        const selectedOption =
          assetOptions.find((a) => a.id === releaseAsset) || assetOptions[0];
        const qtyNum = Number(releaseQuantity) || 0;
        const exceedsBalance = qtyNum > selectedOption.available;
        const estReleaseUSD =
          selectedOption.available > 0 && qtyNum > 0
            ? Number(
                ((Math.min(qtyNum, selectedOption.available) / selectedOption.available) *
                  selectedOption.usdTotal).toFixed(2)
              )
            : 0;

        const courierShort =
          releaseMethod === 'Insured Armored Delivery'
            ? 'Armored Courier'
            : 'Vault Counter Collection';

        const addressComplete =
          Boolean(relRecipientName.trim()) &&
          Boolean(relPhone.trim()) &&
          Boolean(relStreet.trim()) &&
          Boolean(relCity.trim()) &&
          Boolean(relState.trim()) &&
          Boolean(relPostal.trim()) &&
          Boolean(relCountry.trim());

        const canSubmitRelease =
          hasAnyPhysicalHoldings &&
          selectedOption.available > 0 &&
          qtyNum > 0 &&
          !exceedsBalance &&
          addressComplete;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 no-print">
            <div className="bg-white border border-slate-200 rounded-md max-w-2xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
              <div className="bg-[#0A162B] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-[#F2D06B]" />
                  <div>
                    <h3 className="font-serif font-bold text-lg">
                      Vault Metal Release Request
                    </h3>
                    <p className="text-[11px] text-[#F2D06B]">
                      Physical Allocation Withdrawal · Armored Delivery or Counter Release · 6-Digit Email OTP
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReleaseModal(false)}
                  aria-label="Close metal release modal"
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRelError('');
                  if (!hasAnyPhysicalHoldings || selectedOption.available <= 0) {
                    setRelError(
                      `You have 0 ${selectedOption.unit} of ${selectedOption.id} available in vault storage.`
                    );
                    return;
                  }
                  if (qtyNum <= 0) {
                    setRelError('Enter a valid positive quantity to physically release.');
                    return;
                  }
                  if (exceedsBalance) {
                    setRelError(
                      `Requested quantity (${qtyNum} ${selectedOption.unit}) exceeds your stored vault balance (${selectedOption.available} ${selectedOption.unit}).`
                    );
                    return;
                  }
                  if (!addressComplete) {
                    setRelError(
                      'Please fill in all mandatory recipient and physical destination address fields.'
                    );
                    return;
                  }

                  setRelBusy(true);
                  const otpRes = await sendTransactionOtp();
                  setRelBusy(false);

                  if (!otpRes.ok) {
                    setRelError(
                      otpRes.error || 'Failed to dispatch 6-digit security verification code.'
                    );
                    return;
                  }

                  const formattedQty = `${qtyNum.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                  })} ${selectedOption.unit}`;

                  setReleaseModal(false);
                  setTxOtpDraft({
                    tx_type: 'Physical Metal Release',
                    asset_summary: `Physical Release: ${formattedQty} ${selectedOption.id} (${courierShort})`,
                    amount_usd: estReleaseUSD,
                    currency: 'USD',
                    settlement_rail: releaseMethod,
                    account_details: {
                      recipient_name: relRecipientName.trim(),
                      phone: relPhone.trim(),
                      street_address: relStreet.trim(),
                      city: relCity.trim(),
                      state: relState.trim(),
                      postal_code: relPostal.trim(),
                      country: relCountry.trim(),
                      ...(relNotes.trim() ? { delivery_notes: relNotes.trim() } : {}),
                      metal_type: selectedOption.id,
                      release_quantity: formattedQty,
                    },
                  });
                }}
                className="p-5 space-y-5 overflow-y-auto"
              >
                {!hasAnyPhysicalHoldings ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3 text-xs text-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-amber-950">
                        No Physical Holdings Available to Release
                      </p>
                      <p className="leading-relaxed">
                        Your depository account ({client.vault_id}) currently holds 0.00 kg Gold, 0.00 kg Silver, and 0.00 ct GIA Diamonds. Purchase or deposit physical bullion into custody before scheduling a physical metal release.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Step 1: Select Asset, Quantity & Release Method */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D1F3C]">
                      Step 1 · Select Stored Asset &amp; Quantity
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      Vault {client.vault_id || 'BS-SG'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {assetOptions.map((opt) => {
                      const active = releaseAsset === opt.id;
                      const empty = opt.available <= 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setReleaseAsset(opt.id);
                            setReleaseQuantity(
                              opt.available > 0 ? String(Number(opt.available.toFixed(3))) : ''
                            );
                            setRelError('');
                          }}
                          className={`p-3 rounded border text-left transition-colors ${
                            active
                              ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                              : empty
                              ? 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                              : 'bg-white text-[#0D1F3C] border-slate-300 hover:bg-[#FAFBFD]'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{opt.id}</div>
                          <div
                            className={`text-sm font-mono font-bold tabular-nums mt-1 ${
                              active ? 'text-[#F2D06B]' : empty ? 'text-slate-400' : 'text-[#0D1F3C]'
                            }`}
                          >
                            {opt.available.toFixed(2)} {opt.unit}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              active ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {empty ? 'No balance held' : formatMoney(opt.usdTotal)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption.available <= 0 && hasAnyPhysicalHoldings && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        You currently hold 0 {selectedOption.unit} of {selectedOption.id}. Select an asset with an active balance above.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="release-qty-input"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Quantity to Release ({selectedOption.unit}) *
                        </label>
                        {selectedOption.available > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setReleaseQuantity(String(Number(selectedOption.available.toFixed(3))))
                            }
                            className="text-[11px] font-bold text-[#B38818] hover:underline"
                          >
                            Max: {selectedOption.available.toFixed(2)} {selectedOption.unit}
                          </button>
                        )}
                      </div>
                      <input
                        id="release-qty-input"
                        type="number"
                        min="0.001"
                        step="0.001"
                        max={selectedOption.available > 0 ? selectedOption.available : undefined}
                        required
                        disabled={selectedOption.available <= 0}
                        value={releaseQuantity}
                        onChange={(e) => setReleaseQuantity(e.target.value)}
                        placeholder={`e.g. 1.00 ${selectedOption.unit}`}
                        className="w-full px-3 py-2 text-sm font-mono font-semibold border border-slate-300 rounded bg-white disabled:bg-slate-100 focus:outline-none focus:border-[#0D1F3C]"
                      />
                      {qtyNum > 0 && selectedOption.available > 0 && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Estimated custody release value:{' '}
                          <span className="font-mono font-bold text-[#0D1F3C]">
                            {formatMoney(estReleaseUSD)}
                          </span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="release-method-select"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Release Method *
                      </label>
                      <select
                        id="release-method-select"
                        value={releaseMethod}
                        onChange={(e) => setReleaseMethod(e.target.value as ReleaseMethodType)}
                        className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C] focus:outline-none focus:border-[#0D1F3C]"
                      >
                        <option value="Insured Armored Delivery">
                          Insured Armored Courier Delivery (Brink&apos;s / Loomis / Malca-Amit)
                        </option>
                        <option value="Vault Counter Collection">
                          In-Person Vault Counter Collection
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Mandatory Destination Delivery Address Details */}
                <div className="space-y-3.5 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#B38818]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D1F3C]">
                      Step 2 · Mandatory Destination Delivery &amp; Recipient Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Recipient Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={relRecipientName}
                        onChange={(e) => setRelRecipientName(e.target.value)}
                        placeholder="Matching vault account holder"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Recipient Phone Number (with country code) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={relPhone}
                        onChange={(e) => setRelPhone(e.target.value)}
                        placeholder="e.g. +65 9123 4567"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Street Address / Building &amp; Suite *
                      </label>
                      <input
                        type="text"
                        required
                        value={relStreet}
                        onChange={(e) => setRelStreet(e.target.value)}
                        placeholder="e.g. 10 Marina Boulevard, Tower 2, Suite 39-01"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={relCity}
                        onChange={(e) => setRelCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        State / Province *
                      </label>
                      <input
                        type="text"
                        required
                        value={relState}
                        onChange={(e) => setRelState(e.target.value)}
                        placeholder="State or Province"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Postal / ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={relPostal}
                        onChange={(e) => setRelPostal(e.target.value)}
                        placeholder="Postal or ZIP Code"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Destination Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={relCountry}
                        onChange={(e) => setRelCountry(e.target.value)}
                        placeholder="e.g. Singapore / United States / Switzerland"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Preferred Delivery Date / Customs &amp; Armored Security Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={relNotes}
                        onChange={(e) => setRelNotes(e.target.value)}
                        placeholder="Optional preferred delivery window, customs broker details, or building loading-bay clearance notes"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </div>
                  </div>
                </div>

                {exceedsBalance && selectedOption.available > 0 && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Requested release ({qtyNum} {selectedOption.unit}) exceeds your available {selectedOption.id} balance ({selectedOption.available.toFixed(2)} {selectedOption.unit}).
                    </span>
                  </div>
                )}

                {relError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{relError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={relBusy || !canSubmitRelease}
                  className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-50 text-[#0A162B] font-bold text-sm rounded transition-colors"
                >
                  {relBusy
                    ? 'Sending 6-Digit Email OTP...'
                    : 'Continue to Security Verification'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Mandatory 6-Digit Email OTP Verification & Confirmation Modal */}
      <TransactionOtpModal
        draft={txOtpDraft}
        onClose={() => setTxOtpDraft(null)}
        onViewTransactions={() => setActiveTab('history')}
      />

      {/* Full-Screen Photo Zoom Inspection Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col p-4 sm:p-6">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 pb-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {lightboxMedia.badge && (
                  <span className="px-2 py-0.5 rounded bg-[#C59B27] text-[#0A162B] text-[11px] font-bold">
                    {lightboxMedia.badge}
                  </span>
                )}
                <h3 className="text-sm sm:text-base font-bold truncate">{lightboxMedia.title}</h3>
              </div>
              {lightboxMedia.subtitle && (
                <p className="text-xs font-mono text-slate-300 mt-0.5">{lightboxMedia.subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setLightboxZoomed(!lightboxZoomed)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{lightboxZoomed ? '1x Fit' : '2x Zoom'}</span>
              </button>
              <button
                onClick={() => triggerDownload(lightboxMedia.file_url, `${lightboxMedia.title}.jpg`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C59B27] text-[#0A162B] rounded text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setLightboxMedia(null)}
                aria-label="Close full-screen photo inspection"
                className="p-1.5 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            onClick={() => setLightboxZoomed(!lightboxZoomed)}
            className="flex-1 max-w-6xl w-full mx-auto bg-black/60 border border-white/10 rounded overflow-auto flex items-center justify-center p-2"
          >
            <img
              src={lightboxMedia.file_url}
              alt={lightboxMedia.title}
              referrerPolicy="no-referrer"
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                lightboxZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
            />
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#0D1F3C] text-white px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#F2D06B]">
                  {docBadgeLabel(previewDoc.category)}
                </p>
                <h3 className="text-sm font-bold truncate">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
                <button
                  onClick={() =>
                    triggerDownload(previewDoc.file_url, previewDoc.file_name || previewDoc.title)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C59B27] text-[#0A162B] rounded text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  aria-label="Close document preview"
                  className="p-1.5 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 overflow-hidden">
              {previewDoc.file_type?.includes('pdf') ||
              previewDoc.file_url.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewDoc.file_url}
                  title={previewDoc.title}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <FileText className="w-12 h-12 text-[#0D1F3C]" />
                  <div>
                    <h4 className="text-base font-bold text-[#0D1F3C]">{previewDoc.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {previewDoc.file_name || 'Custody Document'} · Ready to open or download
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={previewDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#0D1F3C] text-white text-xs font-semibold rounded inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Document</span>
                    </a>
                    <button
                      onClick={() =>
                        triggerDownload(previewDoc.file_url, previewDoc.file_name || previewDoc.title)
                      }
                      className="px-4 py-2 bg-[#C59B27] text-[#0A162B] text-xs font-bold rounded inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
