import React from 'react';
import { Globe, Mail } from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { LanguageCode } from '../types/bullion';
import { BullionStarLogo } from './BullionStarLogo';

export const Footer: React.FC = () => {
  const { setView, setCatalogFilter, scrollToContact, openHiddenAdmin, language, setLanguage, t } =
    useBullion();

  return (
    <footer className="bg-[#0A162B] text-slate-300 border-t border-[#1D3A68] no-print">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="mb-3.5">
            <BullionStarLogo variant="dark" size="sm" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{t('footer.brandDesc')}</p>
          <p className="text-xs text-slate-400 mt-3">
            {t('showroom.centerAddr')}
            <br />
            {t('showroom.hoursText')}
          </p>
          <div className="mt-3 space-y-1.5 text-xs">
            <a
              href="mailto:info@bullionstar.in.net"
              className="inline-flex items-center gap-1.5 font-semibold text-[#F2D06B] hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>info@bullionstar.in.net</span>
            </a>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>bullionstar.in.net</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            {t('footer.col1Title')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Gold');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B] text-start"
              >
                {t('footer.goldLink')}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Silver');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B] text-start"
              >
                {t('footer.silverLink')}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Platinum');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B] text-start"
              >
                {t('footer.platinumLink')}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCatalogFilter('Diamond');
                  setView('catalog');
                }}
                className="hover:text-[#F2D06B] text-start"
              >
                {t('footer.diamondsLink')}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            {t('footer.col2Title')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => setView('vaults')} className="hover:text-[#F2D06B] text-start">
                {t('footer.vaultStorageLink')}
              </button>
            </li>
            <li>
              <button onClick={() => setView('account')} className="hover:text-[#F2D06B] text-start">
                {t('footer.certsLink')}
              </button>
            </li>
            <li>
              <button onClick={() => setView('charts')} className="hover:text-[#F2D06B] text-start">
                {t('footer.chartsLink')}
              </button>
            </li>
            <li>
              <button
                onClick={scrollToContact}
                className="hover:text-[#F2D06B] text-[#F2D06B] font-semibold text-start"
              >
                {t('footer.contactLink')}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
            {t('footer.col3Title')}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{t('footer.insuranceDesc')}</p>
          <div className="flex flex-col items-start gap-2.5">
            <a
              href="mailto:info@bullionstar.in.net"
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-[#13294B] border border-[#C59B27]/40 text-xs font-semibold text-[#F2D06B] hover:bg-[#193561] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>info@bullionstar.in.net</span>
            </a>

            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#13294B] border border-[#1D3A68] text-xs text-slate-200">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-slate-400">{t('footer.languageLabel')}</span>
              <select
                aria-label={t('footer.languageLabel')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0D1F3C] text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1A2D4D] py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <span onDoubleClick={openHiddenAdmin} className="select-none">
          {t('footer.copyright')}
        </span>
        <span>{t('footer.locationTag')}</span>
      </div>
    </footer>
  );
};
