import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { AdminClientBalanceUpdate, useBullion } from '../context/BullionContext';

export const AdminPanel: React.FC = () => {
  const {
    adminAuthenticated,
    adminClients,
    adminLoading,
    adminLogin,
    adminLogout,
    adminUpdatePasscode,
    adminResetToDefaultPasscode,
    fetchAdminClients,
    adminSaveClientRow,
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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, AdminClientBalanceUpdate> = {};
    adminClients.forEach((c) => {
      nextDrafts[c.id] = {
        cash_usd: Number(c.cash_usd) || 0,
        gold_kg: Number(c.gold_kg) || 0,
        silver_kg: Number(c.silver_kg) || 0,
        diamond_carats: Number(c.diamond_carats) || 0,
        diamond_value_usd: Number(c.diamond_value_usd) || 0,
      };
    });
    setDrafts(nextDrafts);
  }, [adminClients]);

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

  const updateDraftField = (
    clientId: string,
    field: keyof AdminClientBalanceUpdate,
    value: string
  ) => {
    const num = value === '' ? 0 : Number(value);
    setSavedIds((prev) => ({ ...prev, [clientId]: false }));
    setRowErrors((prev) => ({ ...prev, [clientId]: '' }));
    setDrafts((prev) => ({
      ...prev,
      [clientId]: {
        ...(prev[clientId] || {
          cash_usd: 0,
          gold_kg: 0,
          silver_kg: 0,
          diamond_carats: 0,
          diamond_value_usd: 0,
        }),
        [field]: Number.isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSaveRow = async (clientId: string) => {
    const payload = drafts[clientId];
    if (!payload) return;
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

  if (!adminAuthenticated) {
    return (
      <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <div className="bg-[#0A162B] px-6 py-5 text-white">
            <div className="flex items-center gap-2 text-xs text-[#F2D06B] font-semibold mb-1">
              <Shield className="w-4 h-4" />
              <span>BullionStar Singapore Depository</span>
            </div>
            <h1 className="font-serif text-2xl font-bold">Staff &amp; Vault Operations Login</h1>
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
            className="p-6 space-y-4"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized custody personnel only. Enter the operations passcode to manage registered client balances in the Supabase <span className="font-mono">clients</span> table.
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
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
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
              className="w-full py-2.5 bg-[#0D1F3C] hover:bg-[#193561] disabled:opacity-60 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
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
    <section className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A162B] text-white rounded-md p-6 border border-[#1D3A68] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F2D06B] mb-1">
            <Shield className="w-4 h-4" />
            <span>Staff &amp; Vault Operations · Supabase clients Table</span>
          </div>
          <h1 className="font-serif text-2xl font-bold">Client Balances &amp; Custody Allocation</h1>
          <p className="text-xs text-slate-300 mt-1">
            Edit Cash ($), Gold (kg), Silver (kg), Diamond Carats, and Diamond Value ($) directly for any registered client.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchAdminClients()}
            disabled={adminLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#13294B] hover:bg-[#1E3D6E] border border-white/15 rounded text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${adminLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Clients</span>
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
          <div>
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
              className="px-3 py-2 text-xs font-mono border border-slate-300 rounded w-52"
            />
          </div>
          <div>
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
              className="px-3 py-2 text-xs font-mono border border-slate-300 rounded w-52"
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
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B38818]" />
            <h2 className="text-base font-bold text-[#0D1F3C]">
              Registered Clients ({adminClients.length})
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, or vault ID..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded w-64 focus:outline-none focus:border-[#0D1F3C]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Client Name &amp; Email</th>
                <th className="py-3 px-3 text-left font-semibold">Cash ($)</th>
                <th className="py-3 px-3 text-left font-semibold">Gold (kg)</th>
                <th className="py-3 px-3 text-left font-semibold">Silver (kg)</th>
                <th className="py-3 px-3 text-left font-semibold">Diamond Carats</th>
                <th className="py-3 px-3 text-left font-semibold">Diamond Value ($)</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => {
                const draft = drafts[c.id] || {
                  cash_usd: Number(c.cash_usd) || 0,
                  gold_kg: Number(c.gold_kg) || 0,
                  silver_kg: Number(c.silver_kg) || 0,
                  diamond_carats: Number(c.diamond_carats) || 0,
                  diamond_value_usd: Number(c.diamond_value_usd) || 0,
                };
                const isSaving = savingId === c.id;
                const isSaved = Boolean(savedIds[c.id]);
                const rowErr = rowErrors[c.id];

                return (
                  <tr key={c.id} className="hover:bg-[#FAFBFD] align-middle">
                    <td className="py-3.5 px-4 min-w-[210px]">
                      <div className="font-bold text-sm text-[#0D1F3C]">{c.full_name}</div>
                      <div className="text-slate-600 font-medium">{c.email}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {c.vault_id} · {c.country}
                      </div>
                      {rowErr && (
                        <div className="text-[11px] text-rose-700 mt-1">{rowErr}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Cash USD for ${c.full_name}`}
                        value={draft.cash_usd}
                        onChange={(e) => updateDraftField(c.id, 'cash_usd', e.target.value)}
                        className="w-28 px-2.5 py-2 text-xs font-mono font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                      />
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
                      <div className="inline-flex items-center gap-2.5">
                        {isSaved && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <Check className="w-4 h-4" />
                            <span>Saved!</span>
                          </span>
                        )}
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
                  <td colSpan={7} className="py-10 text-center text-slate-500">
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
    </section>
  );
};
