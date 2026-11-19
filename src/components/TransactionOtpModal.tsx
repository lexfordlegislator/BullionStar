import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PendingVaultTransactionDraft, useBullion } from '../context/BullionContext';
import { TransactionLogItem } from '../types/bullion';

interface TransactionOtpModalProps {
  draft: PendingVaultTransactionDraft | null;
  onClose: () => void;
  onSuccess?: (tx: TransactionLogItem) => void;
  onViewTransactions?: () => void;
}

export const TransactionOtpModal: React.FC<TransactionOtpModalProps> = ({
  draft,
  onClose,
  onSuccess,
  onViewTransactions,
}) => {
  const { client, formatMoney, sendTransactionOtp, verifyAndSubmitTransaction } = useBullion();

  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [confirmedTx, setConfirmedTx] = useState<TransactionLogItem | null>(null);

  useEffect(() => {
    if (draft) {
      setOtpCode('');
      setError('');
      setInfoMsg(
        `A 6-digit one-time security passcode has been dispatched to ${client.email}. Enter it below to authorize and submit this request.`
      );
      setResendCooldown(60);
      setConfirmedTx(null);
    }
  }, [draft, client.email]);

  useEffect(() => {
    if (!draft || resendCooldown <= 0 || confirmedTx) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [draft, resendCooldown, confirmedTx]);

  if (!draft) return null;

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setInfoMsg('');
    setResending(true);
    const res = await sendTransactionOtp();
    setResending(false);
    if (!res.ok) {
      setError(res.error || 'Could not resend 6-digit passcode. Please wait a moment and try again.');
      return;
    }
    setResendCooldown(60);
    setInfoMsg(`A fresh 6-digit verification code has been sent to ${client.email}.`);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    const cleaned = otpCode.replace(/\s+/g, '');
    if (cleaned.length !== 6) {
      setError('Please enter the 6-digit one-time passcode from your email.');
      return;
    }

    setSubmitting(true);
    const res = await verifyAndSubmitTransaction(cleaned, draft);
    setSubmitting(false);

    if (!res.ok || !res.transaction) {
      setError(res.error || 'Invalid or expired 6-digit security passcode.');
      return;
    }

    setConfirmedTx(res.transaction);
    if (onSuccess) {
      onSuccess(res.transaction);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/75 flex items-center justify-center p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full overflow-hidden shadow-2xl max-h-[94vh] overflow-y-auto">
        <div className="bg-[#0A162B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#F2D06B]" />
            <div>
              <p className="text-[11px] font-medium text-[#F2D06B]">
                BullionStar Treasury Security Gate
              </p>
              <h3 className="font-serif text-lg font-bold">
                {confirmedTx
                  ? 'Vault Transaction Submitted'
                  : 'Transaction Security Verification'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction verification modal"
            className="p-1.5 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedTx ? (
          <div className="p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="text-sm font-bold text-amber-950">
                  Transaction Submitted — Status: Pending Admin &amp; Treasury Review
                </p>
                <p className="leading-relaxed">
                  Your 6-digit email OTP verification succeeded and this request has been logged into the BullionStar treasury ledger for compliance review.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-amber-100 border border-amber-300 text-amber-900 font-bold">
                  <Clock className="w-3 h-3" />
                  <span>{confirmedTx.status}</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Transaction Type</span>
                <span className="font-bold text-[#0D1F3C]">{confirmedTx.tx_type}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Asset / Order</span>
                <span className="font-semibold text-[#0D1F3C] text-right">
                  {confirmedTx.asset_summary || draft.asset_summary}
                </span>
              </div>
              {confirmedTx.amount_usd > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Equivalent Value</span>
                  <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                    {formatMoney(confirmedTx.amount_usd)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Settlement Rail</span>
                <span className="font-semibold text-slate-800 text-right">
                  {confirmedTx.settlement_rail}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-mono text-[11px] text-slate-600">{confirmedTx.id}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              {onViewTransactions && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewTransactions();
                  }}
                  className="px-4 py-2.5 bg-[#0D1F3C] hover:bg-[#193561] text-white text-xs font-bold rounded inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F2D06B]" />
                  <span>View in Transactions Tab</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] text-xs font-bold rounded"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Operation</span>
                <span className="font-bold text-[#0D1F3C]">{draft.tx_type}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Details</span>
                <span className="font-semibold text-[#0D1F3C] text-right">{draft.asset_summary}</span>
              </div>
              {draft.amount_usd > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Amount (USD Eq.)</span>
                  <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                    {formatMoney(draft.amount_usd)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Settlement Rail</span>
                <span className="font-semibold text-slate-800 text-right">
                  {draft.settlement_rail}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-3.5 flex items-start gap-3">
              <MailCheck className="w-5 h-5 text-[#B38818] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-[#0D1F3C]">Mandatory 6-Digit Email One-Time Passcode</p>
                <p className="mt-0.5">
                  Enter the 6-digit security code sent to{' '}
                  <strong className="text-[#0D1F3C]">{client.email}</strong>.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="tx-otp-code-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                6-Digit Verification Code
              </label>
              <input
                id="tx-otp-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.45em] border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && !error && (
              <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || otpCode.length !== 6}
              className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting ? 'Verifying & Submitting...' : 'Verify 6-Digit Code & Submit Request'}
              </span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-600 hover:text-[#0D1F3C] font-medium"
              >
                Cancel Request
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 font-semibold text-[#0D1F3C] hover:text-[#B38818] disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
