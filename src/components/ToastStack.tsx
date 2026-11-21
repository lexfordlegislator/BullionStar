import React from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { useBullion } from '../context/BullionContext';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useBullion();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((t) => {
        const isSuccess = t.variant === 'success';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded shadow-lg p-3.5 flex items-start gap-3 border ${
              isSuccess
                ? 'bg-emerald-700 text-white border-emerald-400'
                : 'bg-[#0D1F3C] text-white border-[#C59B27]/60'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-4 h-4 text-[#F2D06B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">{t.title}</p>
              <p className={`text-[11px] mt-0.5 leading-snug ${isSuccess ? 'text-emerald-50' : 'text-slate-200'}`}>
                {t.body}
              </p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-white/70 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
