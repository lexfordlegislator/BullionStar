import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Truck,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminClientBalanceUpdate, useBullion } from '../context/BullionContext';
import {
  TransactionLogItem,
  UploadedMediaCategory,
  UploadedMediaItem,
  VaultTransactionStatus,
} from '../types/bullion';
import { BullionStarLogo } from './BullionStarLogo';

const VAULT_TRANSACTIONS_SETUP_SQL = `create table if not exists public.vault_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  client_name text,
  client_email text,
  vault_id text,
  tx_type text not null,
  asset_summary text not null,
  amount_usd numeric default 0,
  currency text default 'USD',
  settlement_rail text,
  account_details jsonb default '{}'::jsonb,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

alter table public.vault_transactions enable row level security;

create policy "Allow all authenticated & anon access to vault_transactions"
  on public.vault_transactions
  for all
  using (true)
  with check (true);`;

const MEDIA_CATEGORY_OPTIONS: { value: UploadedMediaCategory; label: string }[] = [
  { value: 'Gold Photo', label: 'Gold Photo' },
  { value: 'Silver Photo', label: 'Silver Photo' },
  { value: 'Diamond Photo', label: 'Diamond Photo' },
  { value: 'Vault Certificate / PDF Document', label: 'Vault Certificate / PDF Document' },
  { value: 'Assay / Insurance Report', label: 'Assay / Insurance Report' },
];

export const AdminPanel: React.FC = () => {
  const {
    adminAuthenticated,
    adminClients,
    adminLoading,
    adminTransactions,
    adminTxLoading,
    adminTxError,
    spotPriceMap,
    adminLogin,
    adminLogout,
    adminUpdatePasscode,
    adminResetToDefaultPasscode,
    fetchAdminClients,
    fetchAdminTransactions,
    adminUpdateTransactionStatus,
    adminSaveClientRow,
    adminUploadClientMedia,
    adminDeleteClientMedia,
    exitHiddenAdmin,
  } = useBullion();

  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState('');
  const [passcodeErr, setPasscodeErr] = useState('');

  // Draft input values keyed by client.id
  const [drafts, setDrafts] = useState<Record<string, AdminClientBalanceUpdate>>({});
  const [extraCashOffsets, setExtraCashOffsets] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const calcHoldingsValuation = (d: {
    gold_kg: number;
    silver_kg: number;
    diamond_value_usd: number;
  }) => {
    const goldVal = Number(((Number(d.gold_kg) || 0) * spotPriceMap.Gold.kg).toFixed(2));
    const silverVal = Number(((Number(d.silver_kg) || 0) * spotPriceMap.Silver.kg).toFixed(2));
    const diamondVal = Number((Number(d.diamond_value_usd) || 0).toFixed(2));
    const totalVal = Number((goldVal + silverVal + diamondVal).toFixed(2));
    return { goldVal, silverVal, diamondVal, totalVal };
  };

  // Per-client Photos & Documents Manager state
  const [selectedMediaClientId, setSelectedMediaClientId] = useState<string>('');
  const [mediaCategory, setMediaCategory] = useState<UploadedMediaCategory>('Gold Photo');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaNotice, setMediaNotice] = useState('');
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client Transactions & Orders Regulation state
  const [txStatusFilter, setTxStatusFilter] = useState<'All' | VaultTransactionStatus>('All');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('All');
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [updatingTxId, setUpdatingTxId] = useState<string | null>(null);
  const [txActionErrors, setTxActionErrors] = useState<Record<string, string>>({});
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const nextDrafts: Record<string, AdminClientBalanceUpdate> = {};
    const nextOffsets: Record<string, number> = {};
    const todayFallback = new Date().toISOString().slice(0, 10);
    adminClients.forEach((c) => {
      const resolvedDate =
        (c.account_opened_date || '').trim().slice(0, 10) ||
        (c.created_at || '').trim().slice(0, 10) ||
        todayFallback;
      const d: AdminClientBalanceUpdate = {
        account_opened_date: resolvedDate,
        cash_usd: Number(c.cash_usd) || 0,
        gold_kg: Number(c.gold_kg) || 0,
        silver_kg: Number(c.silver_kg) || 0,
        diamond_carats: Number(c.diamond_carats) || 0,
        diamond_value_usd: Number(c.diamond_value_usd) || 0,
      };
      nextDrafts[c.id] = d;
      const hVal = calcHoldingsValuation(d).totalVal;
      nextOffsets[c.id] = d.cash_usd <= 0 ? 0 : Number((d.cash_usd - hVal).toFixed(2));
    });
    setDrafts(nextDrafts);
    setExtraCashOffsets(nextOffsets);
  }, [adminClients]);

  useEffect(() => {
    if (adminClients.length === 0) {
      setSelectedMediaClientId('');
      return;
    }
    const stillExists = adminClients.some((c) => c.id === selectedMediaClientId);
    if (!stillExists) {
      setSelectedMediaClientId(adminClients[0].id);
    }
  }, [adminClients, selectedMediaClientId]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return adminClients;
    return adminClients.filter(
      (c) =>
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.vault_id || '').toLowerCase().includes(q)
    );
  }, [adminClients, searchTerm]);

  const selectedMediaClient = useMemo(
    () => adminClients.find((c) => c.id === selectedMediaClientId) || null,
    [adminClients, selectedMediaClientId]
  );

  const selectedClientMedia: UploadedMediaItem[] = useMemo(
    () => (Array.isArray(selectedMediaClient?.uploaded_media) ? selectedMediaClient.uploaded_media : []),
    [selectedMediaClient]
  );

  const txCounts = useMemo(() => {
    const counts = { All: adminTransactions.length, Pending: 0, Completed: 0, Declined: 0, Cancelled: 0 };
    adminTransactions.forEach((tx) => {
      if (tx.status === 'Pending') counts.Pending += 1;
      else if (tx.status === 'Completed') counts.Completed += 1;
      else if (tx.status === 'Declined') counts.Declined += 1;
      else if (tx.status === 'Cancelled') counts.Cancelled += 1;
    });
    return counts;
  }, [adminTransactions]);

  const filteredTransactions = useMemo(() => {
    const q = txSearchTerm.trim().toLowerCase();
    return adminTransactions.filter((tx) => {
      if (txStatusFilter !== 'All' && tx.status !== txStatusFilter) return false;
      if (txTypeFilter !== 'All' && tx.tx_type !== txTypeFilter) return false;
      if (!q) return true;
      const detailsText = tx.account_details
        ? Object.entries(tx.account_details)
            .map(([k, v]) => `${k} ${v}`)
            .join(' ')
            .toLowerCase()
        : '';
      return (
        (tx.client_name || '').toLowerCase().includes(q) ||
        (tx.client_email || '').toLowerCase().includes(q) ||
        (tx.vault_id || '').toLowerCase().includes(q) ||
        (tx.tx_type || '').toLowerCase().includes(q) ||
        (tx.asset_summary || '').toLowerCase().includes(q) ||
        (tx.settlement_rail || '').toLowerCase().includes(q) ||
        (tx.id || '').toLowerCase().includes(q) ||
        detailsText.includes(q)
      );
    });
  }, [adminTransactions, txStatusFilter, txTypeFilter, txSearchTerm]);

  const handleUpdateTransactionStatus = async (
    tx: TransactionLogItem,
    nextStatus: VaultTransactionStatus
  ) => {
    if (tx.status === nextStatus) return;
    setUpdatingTxId(tx.id);
    setTxActionErrors((prev) => ({ ...prev, [tx.id]: '' }));
    const res = await adminUpdateTransactionStatus(tx.id, nextStatus);
    setUpdatingTxId(null);
    if (!res.ok) {
      setTxActionErrors((prev) => ({
        ...prev,
        [tx.id]: res.error || 'Failed to update transaction status.',
      }));
    }
  };

  const formatFieldLabel = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const updateDraftField = (
    clientId: string,
    field: keyof AdminClientBalanceUpdate,
    value: string
  ) => {
    setSavedIds((prev) => ({ ...prev, [clientId]: false }));
    setRowErrors((prev) => ({ ...prev, [clientId]: '' }));

    const currentDraft: AdminClientBalanceUpdate = drafts[clientId] || {
      account_opened_date: new Date().toISOString().slice(0, 10),
      cash_usd: 0,
      gold_kg: 0,
      silver_kg: 0,
      diamond_carats: 0,
      diamond_value_usd: 0,
    };

    if (field === 'account_opened_date') {
      setDrafts((prev) => ({
        ...prev,
        [clientId]: { ...currentDraft, account_opened_date: value.trim().slice(0, 10) },
      }));
      return;
    }

    const rawNum = value === '' ? 0 : Number(value);
    const cleanNum = Number.isNaN(rawNum) ? 0 : Math.max(0, rawNum);

    if (field === 'cash_usd') {
      const currentHoldingsVal = calcHoldingsValuation(currentDraft).totalVal;
      setExtraCashOffsets((prev) => ({
        ...prev,
        [clientId]: Number((cleanNum - currentHoldingsVal).toFixed(2)),
      }));
      setDrafts((prev) => ({
        ...prev,
        [clientId]: { ...currentDraft, cash_usd: cleanNum },
      }));
      return;
    }

    const updatedDraft: AdminClientBalanceUpdate = {
      ...currentDraft,
      [field]: cleanNum,
    };

    if (field === 'gold_kg' || field === 'silver_kg' || field === 'diamond_value_usd') {
      const newHoldingsVal = calcHoldingsValuation(updatedDraft).totalVal;
      const extraOffset = extraCashOffsets[clientId] ?? 0;
      updatedDraft.cash_usd = Math.max(0, Number((newHoldingsVal + extraOffset).toFixed(2)));
    }

    setDrafts((prev) => ({
      ...prev,
      [clientId]: updatedDraft,
    }));
  };

  const syncRowCashToSpot = (clientId: string) => {
    const curDraft = drafts[clientId];
    if (!curDraft) return;
    const hVal = calcHoldingsValuation(curDraft).totalVal;
    setSavedIds((prev) => ({ ...prev, [clientId]: false }));
    setExtraCashOffsets((prev) => ({ ...prev, [clientId]: 0 }));
    setDrafts((prev) => ({
      ...prev,
      [clientId]: { ...curDraft, cash_usd: hVal },
    }));
  };

  const handleSaveRow = async (clientId: string) => {
    const payload = drafts[clientId];
    if (!payload) return;
    const cleanDate = (payload.account_opened_date || '').trim().slice(0, 10);
    if (cleanDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        setRowErrors((prev) => ({
          ...prev,
          [clientId]: 'Account Opened Date must use YYYY-MM-DD format.',
        }));
        return;
      }
      const yr = Number(cleanDate.slice(0, 4));
      if (yr < 1990 || yr > 2030) {
        setRowErrors((prev) => ({
          ...prev,
          [clientId]: 'Account Opened Date year must be between 1990 and 2030.',
        }));
        return;
      }
    }
    setSavingId(clientId);
    setRowErrors((prev) => ({ ...prev, [clientId]: '' }));
    const res = await adminSaveClientRow(clientId, payload);
    setSavingId(null);
    if (!res.ok) {
      setRowErrors((prev) => ({ ...prev, [clientId]: res.error || 'Failed to save changes.' }));
      return;
    }
    setSavedIds((prev) => ({ ...prev, [clientId]: true }));
    setTimeout(() => {
      setSavedIds((prev) => ({ ...prev, [clientId]: false }));
    }, 3500);
  };

  const handleOpenMediaManagerForClient = (clientId: string) => {
    setSelectedMediaClientId(clientId);
    setMediaError('');
    setMediaNotice('');
    setTimeout(() => {
      const el = document.getElementById('admin-media-manager');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMediaError('');
    setMediaNotice('');
    if (!selectedMediaClient) {
      setMediaError('Please select a registered client first.');
      return;
    }
    if (!mediaFile) {
      setMediaError('Please select an image or document file to upload.');
      return;
    }
    setMediaUploading(true);
    const res = await adminUploadClientMedia(selectedMediaClient.id, {
      title: mediaTitle.trim() || mediaFile.name,
      category: mediaCategory,
      file: mediaFile,
    });
    setMediaUploading(false);
    if (!res.ok) {
      setMediaError(res.error || 'Failed to upload file.');
      return;
    }
    setMediaTitle('');
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMediaNotice(
      `Uploaded and attached to ${selectedMediaClient.full_name} (${selectedMediaClient.vault_id}).`
    );
  };

  const handleDeleteMedia = async (item: UploadedMediaItem) => {
    if (!selectedMediaClient) return;
    setMediaError('');
    setMediaNotice('');
    setDeletingMediaId(item.id);
    const res = await adminDeleteClientMedia(selectedMediaClient.id, item);
    setDeletingMediaId(null);
    if (!res.ok) {
      setMediaError(res.error || 'Failed to delete media item.');
      return;
    }
    setMediaNotice(`Deleted "${item.title}" from ${selectedMediaClient.full_name}.`);
  };

  const isImageItem = (item: UploadedMediaItem) => {
    if (item.file_type?.startsWith('image/')) return true;
    return (
      item.category === 'Gold Photo' ||
      item.category === 'Silver Photo' ||
      item.category === 'Diamond Photo'
    );
  };

  if (!adminAuthenticated) {
    return (
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#0A162B] px-5 sm:px-6 py-5 text-white space-y-3">
            <BullionStarLogo variant="dark" size="sm" />
            <div className="pt-1 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-[#F2D06B] font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Vault &amp; Custody Operations Gate</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold">Staff &amp; Vault Operations Login</h1>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError('');
              setAuthBusy(true);
              const res = await adminLogin(passcode);
              setAuthBusy(false);
              if (!res.ok) {
                setAuthError(res.error || 'Invalid staff passcode.');
              }
            }}
            className="p-5 sm:p-6 space-y-4"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized custody personnel only. Enter the operations passcode to manage registered client balances and vault files in the Supabase <span className="font-mono">clients</span> table.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operations Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm font-mono border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>{authNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full py-3 sm:py-2.5 min-h-[44px] bg-[#0D1F3C] hover:bg-[#193561] disabled:opacity-60 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-[#F2D06B]" />
              <span>{authBusy ? 'Loading clients...' : 'Unlock Staff & Vault Operations'}</span>
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={exitHiddenAdmin}
                className="py-1.5 text-xs font-medium text-slate-500 hover:text-[#0D1F3C] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  adminResetToDefaultPasscode();
                  setAuthError('');
                  setAuthNotice('Custom passcode cleared. Enter the default operations passcode.');
                }}
                className="py-1.5 text-xs font-medium text-[#B38818] hover:underline"
              >
                Reset custom passcode
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A162B] text-white rounded-md p-4 sm:p-6 border border-[#1D3A68] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2.5 min-w-0">
          <BullionStarLogo variant="dark" size="sm" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F2D06B] mb-1">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Staff &amp; Vault Operations · Supabase clients Table</span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold">Client Balances, Photos &amp; Custody Allocation</h1>
            <p className="text-xs text-slate-300 mt-1">
              Edit Cash ($), Gold (kg), Silver (kg), Diamond Carats, Diamond Value ($), and upload client intake photos or signed documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              void Promise.all([fetchAdminClients(), fetchAdminTransactions()]);
            }}
            disabled={adminLoading || adminTxLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#13294B] hover:bg-[#1E3D6E] border border-white/15 rounded text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${adminLoading || adminTxLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh All</span>
          </button>
          <button
            onClick={() => {
              setShowChangePasscode(!showChangePasscode);
              setPasscodeErr('');
              setPasscodeMsg('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#13294B] hover:bg-[#1E3D6E] border border-white/15 rounded text-xs font-semibold"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#F2D06B]" />
            <span>Change Passcode</span>
          </button>
          <button
            onClick={() => {
              adminLogout();
              exitHiddenAdmin();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-transparent hover:bg-white/10 border border-white/20 rounded text-xs font-medium text-slate-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit</span>
          </button>
        </div>
      </div>

      {/* Inline Change Passcode Panel */}
      {showChangePasscode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPasscodeErr('');
            setPasscodeMsg('');
            if (newPasscode.trim() !== confirmPasscode.trim()) {
              setPasscodeErr('Passcodes do not match.');
              return;
            }
            const res = adminUpdatePasscode(newPasscode);
            if (!res.ok) {
              setPasscodeErr(res.error || 'Failed to update passcode.');
              return;
            }
            setNewPasscode('');
            setConfirmPasscode('');
            setPasscodeMsg('New operations passcode saved.');
          }}
          className="bg-white border border-slate-200 rounded p-5 flex flex-wrap items-end gap-4"
        >
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Operations Passcode
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="Minimum 4 characters"
              className="px-3 py-2 text-base sm:text-xs font-mono border border-slate-300 rounded w-full sm:w-52"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Passcode
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
              placeholder="Re-enter passcode"
              className="px-3 py-2 text-base sm:text-xs font-mono border border-slate-300 rounded w-full sm:w-52"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0D1F3C] hover:bg-[#193561] text-white text-xs font-bold rounded"
          >
            Save New Passcode
          </button>
          <button
            type="button"
            onClick={() => {
              adminResetToDefaultPasscode();
              setPasscodeErr('');
              setPasscodeMsg('Reset to default operations passcode.');
            }}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded"
          >
            Reset to Default
          </button>
          {passcodeErr && <span className="text-xs font-medium text-rose-700">{passcodeErr}</span>}
          {passcodeMsg && (
            <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {passcodeMsg}
            </span>
          )}
        </form>
      )}

      {/* Clients Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B38818]" />
              <h2 className="text-base font-bold text-[#0D1F3C]">
                Registered Clients ({adminClients.length})
              </h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FAF7EC] border border-[#C59B27]/40 text-[#0D1F3C] font-semibold">
                Live Gold Spot: ${spotPriceMap.Gold.kg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                <span className="text-slate-500 font-normal">
                  (${spotPriceMap.Gold.oz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz)
                </span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#0D1F3C] font-semibold">
                Live Silver Spot: ${spotPriceMap.Silver.kg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                <span className="text-slate-500 font-normal">
                  (${spotPriceMap.Silver.oz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/oz)
                </span>
              </span>
              <span className="text-slate-500 font-sans">
                Editing weights auto-updates Cash / Portfolio Balance ($)
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, or vault ID..."
              className="pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded w-full focus:outline-none focus:border-[#0D1F3C]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Client Name &amp; Email</th>
                <th className="py-3 px-3 text-left font-semibold">Account Opened Date</th>
                <th className="py-3 px-3 text-left font-semibold">Cash / Portfolio Balance ($)</th>
                <th className="py-3 px-3 text-left font-semibold">Gold (kg)</th>
                <th className="py-3 px-3 text-left font-semibold">Silver (kg)</th>
                <th className="py-3 px-3 text-left font-semibold">Diamond Carats</th>
                <th className="py-3 px-3 text-left font-semibold">Diamond Value ($)</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => {
                const defaultDate =
                  (c.account_opened_date || '').trim().slice(0, 10) ||
                  (c.created_at || '').trim().slice(0, 10) ||
                  new Date().toISOString().slice(0, 10);
                const draft = drafts[c.id] || {
                  account_opened_date: defaultDate,
                  cash_usd: Number(c.cash_usd) || 0,
                  gold_kg: Number(c.gold_kg) || 0,
                  silver_kg: Number(c.silver_kg) || 0,
                  diamond_carats: Number(c.diamond_carats) || 0,
                  diamond_value_usd: Number(c.diamond_value_usd) || 0,
                };
                const valuation = calcHoldingsValuation(draft);
                const cashOffset = Number((draft.cash_usd - valuation.totalVal).toFixed(2));
                const showSyncBtn = Math.abs(cashOffset) >= 0.01 && valuation.totalVal > 0;
                const isSaving = savingId === c.id;
                const isSaved = Boolean(savedIds[c.id]);
                const rowErr = rowErrors[c.id];
                const mediaCount = Array.isArray(c.uploaded_media) ? c.uploaded_media.length : 0;
                const isMediaSelected = selectedMediaClientId === c.id;

                return (
                  <tr
                    key={c.id}
                    className={`align-top transition-colors ${
                      isMediaSelected ? 'bg-[#FFFDF5]' : 'hover:bg-[#FAFBFD]'
                    }`}
                  >
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <div className="font-bold text-sm text-[#0D1F3C]">{c.full_name}</div>
                      <div className="text-slate-600 font-medium">{c.email}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {c.vault_id} · {c.country}
                      </div>

                      {/* Live Spot Price Breakdown */}
                      <div className="mt-2 bg-[#F8FAFC] border border-slate-200 rounded p-2 space-y-0.5 text-[11px]">
                        <div className="font-semibold text-[#0D1F3C]">
                          Live Spot Breakdown:
                        </div>
                        {draft.gold_kg > 0 && (
                          <div className="font-mono text-slate-700">
                            {draft.gold_kg.toFixed(2)} kg Gold @ $
                            {spotPriceMap.Gold.kg.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /kg ={' '}
                            <span className="font-bold text-[#0D1F3C]">
                              $
                              {valuation.goldVal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        {draft.silver_kg > 0 && (
                          <div className="font-mono text-slate-700">
                            {draft.silver_kg.toFixed(2)} kg Silver @ $
                            {spotPriceMap.Silver.kg.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /kg ={' '}
                            <span className="font-bold text-[#0D1F3C]">
                              $
                              {valuation.silverVal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        {valuation.diamondVal > 0 && (
                          <div className="font-mono text-slate-700">
                            {draft.diamond_carats.toFixed(2)} ct Diamonds ={' '}
                            <span className="font-bold text-[#0D1F3C]">
                              $
                              {valuation.diamondVal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        {valuation.totalVal === 0 && (
                          <div className="text-slate-400 italic">No precious metals held</div>
                        )}
                        {Math.abs(cashOffset) >= 0.01 && (
                          <div className="font-mono text-[10px] text-[#9A720F] pt-0.5 border-t border-slate-200">
                            {cashOffset > 0 ? '+' : ''}
                            ${cashOffset.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            standalone cash / override
                          </div>
                        )}
                      </div>

                      {rowErr && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 mt-1.5 space-y-1">
                          <div>{rowErr}</div>
                          {rowErr.toLowerCase().includes('account_opened_date') && (
                            <div className="font-mono text-[10px] bg-slate-900 text-slate-100 p-1.5 rounded">
                              alter table public.clients add column if not exists account_opened_date text;
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="date"
                        min="1990-01-01"
                        max="2030-12-31"
                        aria-label={`Account Opened Date for ${c.full_name}`}
                        value={draft.account_opened_date}
                        onChange={(e) =>
                          updateDraftField(c.id, 'account_opened_date', e.target.value)
                        }
                        className="w-36 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C] focus:outline-none focus:border-[#0D1F3C]"
                      />
                      <span className="mt-1 block text-[10px] font-mono text-slate-400">
                        YYYY-MM-DD (1990–2030)
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Cash USD for ${c.full_name}`}
                        value={draft.cash_usd}
                        onChange={(e) => updateDraftField(c.id, 'cash_usd', e.target.value)}
                        className="w-32 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
                      {showSyncBtn && (
                        <button
                          type="button"
                          onClick={() => syncRowCashToSpot(c.id)}
                          className="mt-1 block text-[10px] font-bold text-[#B38818] hover:underline"
                        >
                          Sync to Spot ($
                          {valuation.totalVal.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          )
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        aria-label={`Gold kg for ${c.full_name}`}
                        value={draft.gold_kg}
                        onChange={(e) => updateDraftField(c.id, 'gold_kg', e.target.value)}
                        className="w-24 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        aria-label={`Silver kg for ${c.full_name}`}
                        value={draft.silver_kg}
                        onChange={(e) => updateDraftField(c.id, 'silver_kg', e.target.value)}
                        className="w-24 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Diamond Carats for ${c.full_name}`}
                        value={draft.diamond_carats}
                        onChange={(e) => updateDraftField(c.id, 'diamond_carats', e.target.value)}
                        className="w-24 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Diamond Value USD for ${c.full_name}`}
                        value={draft.diamond_value_usd}
                        onChange={(e) => updateDraftField(c.id, 'diamond_value_usd', e.target.value)}
                        className="w-28 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {isSaved && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <Check className="w-4 h-4" />
                            <span>Saved!</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenMediaManagerForClient(c.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded text-xs font-semibold transition-colors ${
                            isMediaSelected
                              ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                              : 'bg-white text-[#0D1F3C] border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Photos &amp; Docs ({mediaCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRow(c.id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded shadow-xs transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    {adminLoading
                      ? 'Loading registered users from clients table...'
                      : 'No registered users found in the clients table yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 6: Client Transactions & Orders Regulation */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="bg-[#0A162B] px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F2D06B]">
              <ArrowDownUp className="w-4 h-4" />
              <span>Supabase `vault_transactions` · OTP-Verified Settlement Queue</span>
            </div>
            <h2 className="font-serif text-xl font-bold mt-0.5">
              Client Transactions &amp; Orders Regulation
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchAdminTransactions()}
              disabled={adminTxLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13294B] hover:bg-[#1E3D6E] border border-white/20 rounded text-xs font-semibold text-white disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${adminTxLoading ? 'animate-spin' : ''}`} />
              <span>{adminTxLoading ? 'Syncing...' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Pending', 'Completed', 'Declined', 'Cancelled'] as const).map((tab) => {
              const active = txStatusFilter === tab;
              const count = txCounts[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTxStatusFilter(tab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
                    active
                      ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                      active ? 'bg-white/15 text-[#F2D06B]' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
              aria-label="Filter by transaction type"
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C] focus:outline-none focus:border-[#0D1F3C]"
            >
              <option value="All">All Operation Types</option>
              <option value="Physical Metal Release">Physical Metal Release</option>
              <option value="Cash Deposit">Cash Deposit</option>
              <option value="Cash Withdrawal">Cash Withdrawal</option>
              <option value="Buy Bullion">Buy Bullion</option>
              <option value="Sell Bullion">Sell Bullion</option>
              <option value="Physical Vault Appointment">Physical Vault Appointment</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearchTerm}
                onChange={(e) => setTxSearchTerm(e.target.value)}
                placeholder="Search client, address, rail, IBAN..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded w-64 sm:w-72 bg-white focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>
          </div>
        </div>

        {/* Missing table / Fetch Error Notice */}
        {adminTxError && (
          <div className="m-5 bg-rose-50 border border-rose-200 rounded p-4 text-xs text-rose-800 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <div className="space-y-1">
                <div className="font-bold">Unable to load `vault_transactions` from Supabase</div>
                <div>{adminTxError}</div>
              </div>
            </div>
            {(adminTxError.toLowerCase().includes('vault_transactions') ||
              adminTxError.toLowerCase().includes('relation') ||
              adminTxError.toLowerCase().includes('schema cache')) && (
              <div className="bg-white border border-rose-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#0D1F3C]">
                    Run this SQL in Supabase SQL Editor to create `vault_transactions`:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(VAULT_TRANSACTIONS_SETUP_SQL);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0D1F3C] text-white rounded text-[11px] font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2.5 rounded overflow-x-auto">
                  {VAULT_TRANSACTIONS_SETUP_SQL}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Date &amp; Client</th>
                <th className="py-3 px-3 text-left font-semibold">Type &amp; Asset / Amount</th>
                <th className="py-3 px-3 text-left font-semibold">Settlement Rail &amp; Account Details</th>
                <th className="py-3 px-3 text-left font-semibold">Current Status</th>
                <th className="py-3 px-4 text-right font-semibold">Regulate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isUpdating = updatingTxId === tx.id;
                const actionErr = txActionErrors[tx.id];
                const accountEntries = tx.account_details
                  ? Object.entries(tx.account_details).filter(
                      ([key, val]) =>
                        !key.startsWith('_') &&
                        key !== 'release_qty_num' &&
                        val !== undefined &&
                        val !== null &&
                        String(val).trim() !== ''
                    )
                  : [];
                const ledgerActive = tx.account_details?._ledger_deducted === 'true';
                const ledgerRefunded = tx.account_details?._ledger_refunded === 'true';

                return (
                  <tr key={tx.id} className="align-top hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-3.5 px-4 min-w-[205px]">
                      <div className="font-mono text-[11px] text-slate-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                      <div className="font-bold text-sm text-[#0D1F3C] mt-0.5">
                        {tx.client_name || 'Registered Client'}
                      </div>
                      <div className="text-slate-600">{tx.client_email || '—'}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {tx.vault_id || tx.client_id}
                      </div>
                      {actionErr && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 mt-1.5">
                          {actionErr}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 min-w-[210px]">
                      {tx.tx_type === 'Physical Metal Release' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#0D1F3C] text-[#F2D06B] border border-[#C59B27]/50 rounded">
                          <Truck className="w-3 h-3" />
                          <span>{tx.tx_type}</span>
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-[#0D1F3C]/5 text-[#0D1F3C] border border-[#0D1F3C]/15 rounded">
                          {tx.tx_type}
                        </span>
                      )}
                      <div className="font-semibold text-[#0D1F3C] mt-1.5 leading-snug">
                        {tx.asset_summary || '—'}
                      </div>
                      <div className="font-mono font-bold text-sm text-[#0D1F3C] tabular-nums mt-1">
                        {tx.amount_usd > 0
                          ? `US$${tx.amount_usd.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : 'Intake Appointment'}
                        {tx.currency && tx.amount_usd > 0 && (
                          <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                            ({tx.currency})
                          </span>
                        )}
                      </div>
                      {ledgerActive && (
                        <div
                          className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            ledgerRefunded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {ledgerRefunded ? 'Balances Refunded' : 'Balances Deducted'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 min-w-[290px] max-w-[400px]">
                      <div className="font-bold text-[#0D1F3C] mb-1.5 flex items-center gap-1.5">
                        {tx.tx_type === 'Physical Metal Release' && (
                          <MapPin className="w-3.5 h-3.5 text-[#B38818] shrink-0" />
                        )}
                        <span>{tx.settlement_rail || 'Treasury Settlement'}</span>
                      </div>
                      {tx.tx_type === 'Physical Metal Release' && tx.account_details ? (
                        <div className="bg-[#FAF7EC] border border-[#C59B27]/40 rounded p-2.5 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#C59B27]/25">
                            <span className="font-semibold text-[#9A720F]">Release Allocation:</span>
                            <span className="font-mono font-bold text-[#0D1F3C]">
                              {tx.account_details.release_quantity || '—'} ·{' '}
                              {tx.account_details.metal_type || 'Precious Metal'}
                            </span>
                          </div>
                          <div className="text-[#0D1F3C] space-y-0.5 leading-relaxed">
                            <div>
                              <span className="text-slate-500">Recipient:</span>{' '}
                              <span className="font-bold">
                                {tx.account_details.recipient_name || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Phone:</span>{' '}
                              <span className="font-mono font-semibold">
                                {tx.account_details.phone || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Street:</span>{' '}
                              <span className="font-medium">
                                {tx.account_details.street_address || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">City / State / ZIP:</span>{' '}
                              <span className="font-medium">
                                {[
                                  tx.account_details.city,
                                  tx.account_details.state,
                                  tx.account_details.postal_code,
                                ]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Country:</span>{' '}
                              <span className="font-bold">
                                {tx.account_details.country || '—'}
                              </span>
                            </div>
                            {tx.account_details.delivery_notes && (
                              <div className="pt-1 text-slate-600">
                                <span className="text-slate-500">Instructions:</span>{' '}
                                {tx.account_details.delivery_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : accountEntries.length > 0 ? (
                        <div className="bg-[#F8FAFC] border border-slate-200 rounded p-2.5 space-y-1 text-[11px]">
                          {accountEntries.map(([key, val]) => (
                            <div key={key} className="flex items-start justify-between gap-3">
                              <span className="text-slate-500 shrink-0">
                                {formatFieldLabel(key)}:
                              </span>
                              <span className="font-mono text-[#0D1F3C] font-medium text-right break-all">
                                {String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          No additional bank/wallet fields provided.
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {tx.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold bg-amber-50 border-amber-300 text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                      {tx.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold bg-emerald-50 border-emerald-300 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                      {tx.status === 'Declined' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold bg-rose-50 border-rose-300 text-rose-700">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Declined</span>
                        </span>
                      )}
                      {tx.status === 'Cancelled' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold bg-slate-100 border-slate-300 text-slate-700">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isUpdating || tx.status === 'Pending'}
                          onClick={() => void handleUpdateTransactionStatus(tx, 'Pending')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold border transition-colors ${
                            tx.status === 'Pending'
                              ? 'bg-amber-600 text-white border-amber-600 cursor-default'
                              : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50 disabled:opacity-60'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || tx.status === 'Completed'}
                          onClick={() => void handleUpdateTransactionStatus(tx, 'Completed')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold border transition-colors ${
                            tx.status === 'Completed'
                              ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
                              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 disabled:opacity-60'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || tx.status === 'Declined'}
                          onClick={() => void handleUpdateTransactionStatus(tx, 'Declined')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold border transition-colors ${
                            tx.status === 'Declined'
                              ? 'bg-rose-600 text-white border-rose-600 cursor-default'
                              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50 disabled:opacity-60'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Declined</span>
                        </button>
                      </div>
                      {isUpdating && (
                        <div className="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1 justify-end w-full">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Updating...</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    {adminTxLoading
                      ? 'Loading client transactions from vault_transactions...'
                      : 'No matching client transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 3: Client Photos & Documents Uploader & Manager */}
      <div
        id="admin-media-manager"
        className="bg-white border border-slate-200 rounded overflow-hidden"
      >
        <div className="bg-[#0A162B] px-6 py-4 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F2D06B]">
              <Upload className="w-4 h-4" />
              <span>Supabase Storage (`vault-files`) · Per-Client Media Manager</span>
            </div>
            <h2 className="font-serif text-xl font-bold mt-0.5">
              Client Photos &amp; Documents Uploader
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="admin-media-client-select" className="text-xs text-slate-300 font-medium">
              Selected Client:
            </label>
            <select
              id="admin-media-client-select"
              value={selectedMediaClientId}
              onChange={(e) => {
                setSelectedMediaClientId(e.target.value);
                setMediaError('');
                setMediaNotice('');
              }}
              disabled={adminClients.length === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-[#13294B] text-white border border-white/20 rounded focus:outline-none focus:border-[#D4AF37]"
            >
              {adminClients.length === 0 && <option value="">No clients available</option>}
              {adminClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.vault_id}) — {c.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {selectedMediaClient ? (
            <>
              <div className="bg-[#F8FAFC] border border-slate-200 rounded px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Managing vault files for: </span>
                  <span className="font-bold text-[#0D1F3C]">{selectedMediaClient.full_name}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="font-mono text-[#B38818] font-semibold">
                    {selectedMediaClient.vault_id}
                  </span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-600">{selectedMediaClient.email}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {selectedClientMedia.length} uploaded item{selectedClientMedia.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Upload Form */}
              <form
                onSubmit={handleUploadMedia}
                className="grid md:grid-cols-12 gap-4 items-end border border-slate-200 rounded p-4 bg-[#FAFBFD]"
              >
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Type / Category
                  </label>
                  <select
                    value={mediaCategory}
                    onChange={(e) => setMediaCategory(e.target.value as UploadedMediaCategory)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                  >
                    {MEDIA_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    placeholder="e.g. 10kg Gold Bars Intake or GIA Dossier #21948572"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Choose Photo or Document
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    required
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0D1F3C] file:text-white hover:file:bg-[#193561]"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={mediaUploading}
                    className="w-full py-2.5 px-4 bg-[#D4AF37] hover:bg-[#B89225] disabled:opacity-60 text-[#0A162B] font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    {mediaUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {mediaError && (
                <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{mediaError}</span>
                </div>
              )}

              {mediaNotice && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{mediaNotice}</span>
                </div>
              )}

              {/* Existing Uploaded Media List */}
              <div>
                <h3 className="text-sm font-bold text-[#0D1F3C] mb-3">
                  Uploaded Photos &amp; Documents for {selectedMediaClient.full_name}
                </h3>

                {selectedClientMedia.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded p-8 text-center text-xs text-slate-500">
                    No custom photos or documents uploaded for this client yet. Use the form above to attach files to{' '}
                    <span className="font-mono">{selectedMediaClient.vault_id}</span>.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedClientMedia.map((item) => {
                      const img = isImageItem(item);
                      const isDeleting = deletingMediaId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded overflow-hidden bg-white flex flex-col"
                        >
                          {img ? (
                            <div className="aspect-[16/10] bg-slate-900 overflow-hidden">
                              <img
                                src={item.file_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/10] bg-[#F8FAFC] border-b border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                              <FileText className="w-10 h-10 text-[#0D1F3C] mb-2" />
                              <span className="text-[11px] font-mono text-slate-500 break-all line-clamp-2">
                                {item.file_name || item.title}
                              </span>
                            </div>
                          )}

                          <div className="p-3.5 flex-1 flex flex-col justify-between gap-3 text-xs">
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#0D1F3C]/5 text-[#0D1F3C] border border-[#0D1F3C]/15 rounded mb-1.5">
                                {img ? (
                                  <ImageIcon className="w-3 h-3 text-[#B38818]" />
                                ) : (
                                  <FileText className="w-3 h-3 text-[#B38818]" />
                                )}
                                {item.category}
                              </span>
                              <div className="font-bold text-[#0D1F3C] line-clamp-2">{item.title}</div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                Uploaded {new Date(item.uploaded_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D1F3C] hover:text-[#B38818]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open File</span>
                              </a>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteMedia(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 text-center py-6">
              Select a client from the table or dropdown above to upload photos and documents.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
