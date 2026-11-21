import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Mail, MapPin, ShieldCheck, X } from 'lucide-react';
import { IMAGE_PATHS, MARKET_ARTICLES } from '../data/initialData';
import { MarketArticle } from '../types/bullion';
import { useBullion } from '../context/BullionContext';
import { ResilientImage } from './ResilientImage';

interface ShowroomAndNewsProps {
  showVaultDetails?: boolean;
}

export const ShowroomAndNews: React.FC<ShowroomAndNewsProps> = ({ showVaultDetails = false }) => {
  const { setView, isLoggedIn, demoLogin, t } = useBullion();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingName, setBookingName] = useState('Marcus Tan');
  const [bookingDate, setBookingDate] = useState('2026-11-18');
  const [bookingPurpose, setBookingPurpose] = useState('Physical Audit & Vault Inspection');
  const [activeArticle, setActiveArticle] = useState<MarketArticle | null>(null);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Singapore Physical Vault Showroom Showcase Card */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 min-h-[240px] sm:min-h-[280px] relative bg-[#0D1F3C]">
            <ResilientImage
              src={IMAGE_PATHS.showroom}
              alt="BullionStar Singapore Bullion Showroom at 45 New Bridge Road"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-[#B38818] tracking-wide mb-2">
                {t('showroom.kicker')}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1F3C] [text-wrap:balance] mb-3">
                {t('showroom.title')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{t('showroom.desc')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-b border-slate-100 py-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#B38818] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{t('showroom.centerTitle')}</p>
                    <p className="text-slate-600 mt-0.5">{t('showroom.centerAddr')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#B38818] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{t('showroom.hoursTitle')}</p>
                    <p className="text-slate-600 mt-0.5">{t('showroom.hoursText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{t('showroom.archTitle')}</p>
                    <p className="text-slate-600 mt-0.5">{t('showroom.archText')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{t('showroom.auditTitle')}</p>
                    <p className="text-slate-600 mt-0.5">{t('showroom.auditText')}</p>
                  </div>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="font-semibold text-[#0D1F3C]">
                      {t('showroom.directSupport')}
                    </span>
                    <a
                      href="mailto:info@bullionstar.in.net"
                      className="font-semibold text-[#B38818] hover:text-[#0D1F3C] underline underline-offset-2"
                    >
                      info@bullionstar.in.net
                    </a>
                  </div>
                  <span className="text-slate-500">bullionstar.in.net</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
              <button
                onClick={() => {
                  setBookingConfirmed(false);
                  setBookingModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-[44px] bg-[#0D1F3C] hover:bg-[#193561] text-white font-semibold text-sm rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Calendar className="w-4 h-4 text-[#F2D06B]" />
                <span>{t('showroom.bookBtn')}</span>
              </button>
              <button
                onClick={() => {
                  if (!isLoggedIn) demoLogin();
                  setView('account');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-[44px] bg-[#F4F6F9] hover:bg-slate-200 border border-slate-200 text-[#0D1F3C] font-semibold text-sm rounded transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t('showroom.inspectPhotosBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {showVaultDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {[
              {
                title: t('showroom.vault1.title'),
                rate: t('showroom.vault1.rate'),
                desc: t('showroom.vault1.desc'),
              },
              {
                title: t('showroom.vault2.title'),
                rate: t('showroom.vault2.rate'),
                desc: t('showroom.vault2.desc'),
              },
              {
                title: t('showroom.vault3.title'),
                rate: t('showroom.vault3.rate'),
                desc: t('showroom.vault3.desc'),
              },
            ].map((opt) => (
              <div key={opt.title} className="bg-white border border-slate-200 rounded p-5">
                <h3 className="text-base font-bold text-[#0D1F3C]">{opt.title}</h3>
                <p className="text-xs font-mono font-semibold text-[#B38818] mt-1 mb-2">{opt.rate}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Market News & Bullion Research */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D1F3C]">
              {t('showroom.newsTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">{t('showroom.newsSub')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MARKET_ARTICLES.map((art) => (
            <article
              key={art.id}
              onClick={() => setActiveArticle(art)}
              className="bg-white border border-slate-200 rounded p-5 hover:border-[#C59B27]/80 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-[#B38818]">{art.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{art.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{art.readTime}</span>
                </div>
                <h3 className="text-base font-bold text-[#0D1F3C] leading-snug mb-2 hover:text-[#B38818] transition-colors">
                  {art.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{art.summary}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{art.author}</span>
                <span className="font-semibold text-[#0D1F3C]">{t('showroom.readBrief')}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Book Private Vault Viewing Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-md w-[94vw] max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 bg-[#0D1F3C] text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-base">{t('showroom.modalTitle')}</h3>
              <button onClick={() => setBookingModalOpen(false)} aria-label="Close booking modal" className="p-1 hover:bg-white/10 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            {bookingConfirmed ? (
              <div className="p-5 sm:p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h4 className="text-lg font-bold text-[#0D1F3C]">{t('showroom.apptConfirmed')}</h4>
                <p className="text-sm text-slate-600">
                  Reserved for <strong>{bookingName}</strong> on <strong>{bookingDate}</strong> at 45 New Bridge Road ({bookingPurpose}). Please bring photo identification for vault biometric clearance.
                </p>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="mt-2 w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-[#0D1F3C] text-white text-sm font-semibold rounded"
                >
                  {t('common.done')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('showroom.fullNameId')}
                  </label>
                  <input
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('showroom.prefDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('showroom.purpose')}
                  </label>
                  <select
                    value={bookingPurpose}
                    onChange={(e) => setBookingPurpose(e.target.value)}
                    className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white"
                  >
                    <option>Physical Audit & Vault Inspection</option>
                    <option>GIA Diamond Loupe Verification</option>
                    <option>Over-the-Counter Bullion Acquisition</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 min-h-[44px] bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-semibold text-sm rounded transition-colors"
                >
                  {t('showroom.confirmAppt')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-md w-[94vw] max-w-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-[#0D1F3C] text-white flex items-center justify-between shrink-0">
              <div className="text-xs text-[#F2D06B] font-medium">
                {activeArticle.category} · {activeArticle.publishedAt}
              </div>
              <button onClick={() => setActiveArticle(null)} aria-label="Close article" className="p-1 hover:bg-white/10 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0D1F3C] leading-snug">
                {activeArticle.title}
              </h3>
              <p className="text-xs text-slate-500 border-b border-slate-100 pb-3">
                {activeArticle.author} · {activeArticle.readTime}
              </p>
              {activeArticle.content.map((para, i) => (
                <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
