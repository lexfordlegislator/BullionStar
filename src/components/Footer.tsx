import React from 'react';
import { useBullion } from '../context/BullionContext';

export const Footer: React.FC = () => {
  const { setView, setCatalogFilter, openHiddenAdmin } = useBullion();

  return (
    <footer className="bg-[#0A162B] text-slate-300 border-t border-[#1D3A68] no-print">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded bg-[#13294B] border border-[#C59B27]/50 flex items-center justify-center">
              <span className="font-serif font-bold text-[#D4AF37]">B</span>
            </div>
            <span className="text-base font-bold text-white">BullionStar Singapore</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Singapore’s premier bullion dealer and non-bank precious metals depository. 100% allocated, segregated, and insured physical custody.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            45 New Bridge Road, Singapore 059398
            <br />
            Mon–Fri 10:00–19:00 · Sat 10:00–15:00 SGT
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            Bullion & Diamonds
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Gold');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B]"
              >
                Gold Bars & Coins (0% GST)
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Silver');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B]"
              >
                Silver Cast Bars (0% GST)
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Platinum');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B]"
              >
                Platinum & Palladium
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Diamond');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B]"
              >
                GIA-Certified Investment Diamonds
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            Depository & Audits
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => setView('vaults')} className="hover:text-[#F2D06B]">
                Singapore Vault Storage
              </button>
            </li>
            <li>
              <button onClick={() => setView('account')} className="hover:text-[#F2D06B]">
                Client Custody Certificates
              </button>
            </li>
            <li>
              <button onClick={() => setView('account')} className="hover:text-[#F2D06B]">
                High-Res Holding Photo Verification
              </button>
            </li>
            <li>
              <button onClick={() => setView('charts')} className="hover:text-[#F2D06B]">
                Live Spot Charts & Research
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            Custody & Insurance
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All vaulted bullion and GIA-certified diamonds are covered under an all-risks specie policy underwritten at Lloyd’s of London & Chubb Singapore. Biannual independent bar counts conducted by BDO LLP.
          </p>
        </div>
      </div>

      <div className="border-t border-[#1A2D4D] py-4 px-4 lg:px-6 text-xs text-slate-500 max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <span onDoubleClick={openHiddenAdmin} className="select-none">
          © 2026 BullionStar Pte. Ltd. (Singapore UEN 201217896W) · Precious Stones &amp; Precious Metals Dealer
        </span>
        <span>45 New Bridge Road · Institutional Custody &amp; Exchange</span>
      </div>
    </footer>
  );
};
