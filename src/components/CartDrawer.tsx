import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { PendingVaultTransactionDraft, useBullion } from '../context/BullionContext';
import {
  BUY_PAYMENT_METHODS,
  BuyPaymentMethod,
  DEPOSIT_ORIGINATING_FIELDS,
  getDefaultFieldValues,
  getTreasuryInstructions,
  SettlementRailId,
  validateRailFields,
} from '../data/settlementRails';
import { ResilientImage } from './ResilientImage';
import { TransactionOtpModal } from './TransactionOtpModal';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    clearCart,
    formatMoney,
    getProductPriceUSD,
    currency,
    isLoggedIn,
    openAuthModal,
    client,
    sendTransactionOtp,
    setView,
  } = useBullion();

  const [step, setStep] = useState<'cart' | 'settlement'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<BuyPaymentMethod>('SWIFT / International Wire');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS['SWIFT / International Wire'])
  );
  const [formError, setFormError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpDraft, setOtpDraft] = useState<PendingVaultTransactionDraft | null>(null);

  useEffect(() => {
    if (!cartOpen) {
      setStep('cart');
      setFormError('');
    }
  }, [cartOpen]);

  const handlePaymentMethodChange = (next: BuyPaymentMethod) => {
    setPaymentMethod(next);
    setFormError('');
    if (next !== 'Available Cash Balance') {
      setFieldValues(getDefaultFieldValues(DEPOSIT_ORIGINATING_FIELDS[next]));
    } else {
      setFieldValues({});
    }
  };

  if (!cartOpen && !otpDraft) return null;

  const subtotalUSD = Number(
    cart.reduce((sum, item) => sum + getProductPriceUSD(item.product) * item.quantity, 0).toFixed(2)
  );
  const cashUSD = Number(client.cash_usd || 0);
  const externalRail: SettlementRailId | null =
    paymentMethod === 'Available Cash Balance' ? null : paymentMethod;
  const activeFields = externalRail ? DEPOSIT_ORIGINATING_FIELDS[externalRail] : [];
  const treasuryInfo = externalRail ? getTreasuryInstructions(externalRail, client.vault_id) : null;

  const isSettlementValid = (() => {
    if (cart.length === 0 || subtotalUSD <= 0) return false;
    if (paymentMethod === 'Available Cash Balance') {
      return cashUSD >= subtotalUSD;
    }
    return validateRailFields(activeFields, fieldValues).valid;
  })();

  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isLoggedIn) {
      setCartOpen(false);
      openAuthModal('signin');
      return;
    }

    if (paymentMethod === 'Available Cash Balance') {
      if (cashUSD < subtotalUSD) {
        setFormError(
          `Insufficient Available Cash Balance (${formatMoney(cashUSD)} available vs ${formatMoney(subtotalUSD)} order total).`
        );
        return;
      }
    } else if (externalRail) {
      const check = validateRailFields(activeFields, fieldValues);
      if (!check.valid) {
        setFormError(check.error || 'Please complete all originating payment account details.');
        return;
      }
    }

    const itemsSummary = cart.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
    const accountDetails: Record<string, string> =
      paymentMethod === 'Available Cash Balance'
        ? {
            'Funding Source': `Vault Cash Balance (${client.vault_id})`,
            'Available Cash at Submission': formatMoney(cashUSD),
            'Fulfillment Preferences': cart
              .map((i) => `${i.product.sku}: ${i.fulfillment}`)
              .join(' | '),
          }
        : {
            ...fieldValues,
            'Fulfillment Preferences': cart
              .map((i) => `${i.product.sku}: ${i.fulfillment}`)
              .join(' | '),
          };

    setSendingOtp(true);
    const otpRes = await sendTransactionOtp();
    setSendingOtp(false);

    if (!otpRes.ok) {
      setFormError(otpRes.error || 'Failed to dispatch 6-digit email verification code.');
      return;
    }

    setOtpDraft({
      tx_type: 'Buy Bullion',
      asset_summary: itemsSummary,
      amount_usd: subtotalUSD,
      currency,
      settlement_rail: paymentMethod,
      account_details: accountDetails,
    });
  };

  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 no-print">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200">
            <div className="px-5 py-4 bg-[#0D1F3C] text-white flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">
                  {step === 'cart' ? 'Bullion Order Cart' : 'Payment Method & Settlement'}
                </h2>
                <p className="text-xs text-slate-300">
                  {step === 'cart'
                    ? `Live spot lock · Settlement in ${currency}`
                    : 'Enter originating payment details before 6-digit OTP'}
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close Cart"
                className="p-1.5 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'cart' ? (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-sm font-semibold text-[#0D1F3C]">Your order cart is empty</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Add gold, silver, platinum, or GIA-certified diamonds to allocate or ship.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => {
                      const unitUSD = getProductPriceUSD(item.product);
                      return (
                        <div key={item.product.id} className="border border-slate-200 rounded p-3.5 flex gap-3">
                          <div className="w-16 h-16 rounded bg-[#F8FAFC] border border-slate-100 overflow-hidden shrink-0">
                            <ResilientImage src={item.product.image} alt={item.product.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs font-semibold text-[#0D1F3C] leading-snug line-clamp-2">
                                {item.product.name}
                              </h3>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                aria-label="Remove item"
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.fulfillment}</p>

                            <div className="flex items-center justify-between mt-3">
                              <div className="inline-flex items-center border border-slate-200 rounded">
                                <button
                                  onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                                  className="p-1 hover:bg-slate-100 text-slate-600"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 text-xs font-mono font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                                  className="p-1 hover:bg-slate-100 text-slate-600"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-sm font-mono font-bold text-[#0D1F3C] tabular-nums">
                                {formatMoney(unitUSD * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-5 border-t border-slate-200 bg-[#F8FAFC] space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Singapore IPM GST</span>
                      <span className="font-semibold text-emerald-700">0% Exempt</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-[#0D1F3C]">
                      <span>Order Total ({currency})</span>
                      <span className="font-mono tabular-nums">{formatMoney(subtotalUSD)}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          setCartOpen(false);
                          openAuthModal('signin');
                          return;
                        }
                        setFormError('');
                        setStep('settlement');
                      }}
                      className="w-full py-3 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-bold text-sm rounded transition-colors"
                    >
                      Proceed to Settlement &amp; OTP Verification
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>6-digit email OTP &amp; treasury review required on all orders</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleProceedToOtp} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('cart');
                      setFormError('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0D1F3C]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Order Items ({cart.length})</span>
                  </button>

                  <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Total Order Settlement</span>
                    <span className="font-mono text-base font-bold text-[#0D1F3C] tabular-nums">
                      {formatMoney(subtotalUSD)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment / Settlement Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as BuyPaymentMethod)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-[#0D1F3C] focus:outline-none focus:border-[#0D1F3C]"
                    >
                      {BUY_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {paymentMethod === 'Available Cash Balance' ? (
                    <div className="border border-slate-200 rounded p-3.5 bg-[#FAFBFD] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Available Vault Cash</span>
                        <span className="font-mono font-bold text-[#0D1F3C] tabular-nums">
                          {formatMoney(cashUSD)}
                        </span>
                      </div>
                      {cashUSD < subtotalUSD && (
                        <p className="text-rose-700 font-medium">
                          Available cash balance is lower than this order total. Choose an external bank/crypto rail or deposit funds first.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {treasuryInfo && (
                        <div className="bg-[#0A162B] text-white rounded p-3.5 space-y-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-[#F2D06B] font-bold">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{treasuryInfo.headline}</span>
                          </div>
                          <div className="space-y-1 border-t border-white/10 pt-2">
                            {treasuryInfo.rows.map((r) => (
                              <div key={r.label} className="flex justify-between gap-2">
                                <span className="text-slate-300 shrink-0">{r.label}:</span>
                                <span className="font-mono text-right break-all">{r.value}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-slate-300 text-[10px] pt-1">{treasuryInfo.note}</p>
                        </div>
                      )}

                      <div className="space-y-3 pt-1">
                        <p className="text-xs font-bold text-[#0D1F3C]">
                          Originating Payment Account / Wallet Details
                        </p>
                        {activeFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              {field.label} *
                            </label>
                            {field.type === 'select' && field.options ? (
                              <select
                                required={field.required}
                                value={fieldValues[field.key] || ''}
                                onChange={(e) =>
                                  setFieldValues((prev) => ({
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
                                value={fieldValues[field.key] || ''}
                                onChange={(e) =>
                                  setFieldValues((prev) => ({
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
                    </>
                  )}

                  {formError && (
                    <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-slate-200 bg-[#F8FAFC] space-y-2.5">
                  <button
                    type="submit"
                    disabled={sendingOtp || !isSettlementValid}
                    className="w-full py-3 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-50 text-[#0A162B] font-bold text-xs sm:text-sm rounded transition-colors"
                  >
                    {sendingOtp
                      ? 'Dispatching 6-Digit Email OTP...'
                      : 'Continue to Security Verification'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <TransactionOtpModal
        draft={otpDraft}
        onClose={() => setOtpDraft(null)}
        onSuccess={() => {
          clearCart();
          setCartOpen(false);
        }}
        onViewTransactions={() => {
          setView('account');
        }}
      />
    </>
  );
};
