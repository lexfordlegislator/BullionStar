import React from 'react';
import { Minus, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { ResilientImage } from './ResilientImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    formatMoney,
    getProductPriceUSD,
    checkoutCart,
    currency,
  } = useBullion();

  if (!cartOpen) return null;

  const subtotalUSD = cart.reduce((sum, item) => sum + getProductPriceUSD(item.product) * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 no-print">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200">
        <div className="px-5 py-4 bg-[#0D1F3C] text-white flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Bullion Order Cart</h2>
            <p className="text-xs text-slate-300">Live spot lock · Settlement in {currency}</p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close Cart"
            className="p-1.5 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              onClick={checkoutCart}
              className="w-full py-3 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-bold text-sm rounded transition-colors"
            >
              Execute Order & Allocate to Vault
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Issues instant serialized Vault Certificate in Your Account</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
