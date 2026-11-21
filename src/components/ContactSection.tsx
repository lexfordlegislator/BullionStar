import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { useBullion } from '../context/BullionContext';

const INQUIRY_TOPICS = [
  { value: 'Private Vault Storage', key: 'contact.topic1' as const },
  { value: 'Buying Gold & Silver Bullion', key: 'contact.topic2' as const },
  { value: 'GIA Certified Diamonds', key: 'contact.topic3' as const },
  { value: 'Account & Security Support', key: 'contact.topic4' as const },
  { value: 'Other', key: 'contact.topic5' as const },
] as const;

const WEB3FORMS_ACCESS_KEY = '5375b8ac-0f4d-48a1-ab67-4db45eda5f3c';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export const ContactSection: React.FC = () => {
  const { t } = useBullion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState<string>(INQUIRY_TOPICS[0].value);
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmittedSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setSubmitError('Please complete all required fields before submitting your inquiry.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'New BullionStar Website Inquiry',
          from_name: 'BullionStar Website',
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || 'Not provided',
          topic,
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to deliver inquiry right now.');
      }

      setSubmittedSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setTopic(INQUIRY_TOPICS[0].value);
      setMessage('');
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? `${err.message} You may also email us directly at info@bullionstar.in.net.`
          : 'Unable to send your inquiry right now. Please email us directly at info@bullionstar.in.net.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact-section"
      className="scroll-mt-40 bg-[#F4F6F9] border-t border-slate-200 py-10 sm:py-14 no-print"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B38818] mb-2">
            {t('contact.kicker')}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1F3C] [text-wrap:balance]">
            {t('contact.title')}
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t('contact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel: Luxury Navy Contact Directory */}
          <div className="lg:col-span-5 bg-[#0A162B] text-white rounded-md border border-[#1D3A68] p-5 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F2D06B] mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t('contact.depository')}</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-white">{t('contact.deskTitle')}</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {t('contact.deskDesc')}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#1D3A68] text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-[#13294B] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t('contact.supportEmail')}
                    </p>
                    <a
                      href="mailto:info@bullionstar.in.net"
                      className="text-sm font-semibold text-[#F2D06B] hover:text-white transition-colors break-all"
                    >
                      info@bullionstar.in.net
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-[#13294B] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t('contact.officialPortal')}
                    </p>
                    <a
                      href="https://bullionstar.in.net"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-[#F2D06B] transition-colors"
                    >
                      bullionstar.in.net
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-[#13294B] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t('contact.locationTitle')}
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {t('showroom.centerAddr')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('contact.locationNote')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-[#13294B] border border-[#C59B27]/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t('contact.hoursTitle')}
                    </p>
                    <p className="text-xs text-slate-200 mt-0.5">{t('contact.hoursWeek')}</p>
                    <p className="text-xs text-slate-200">{t('contact.hoursSat')}</p>
                    <p className="text-xs text-slate-400">{t('contact.hoursSun')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#1D3A68] text-xs text-slate-400 flex items-center justify-between gap-2">
              <span>{t('contact.allocatedTag')}</span>
              <span className="font-mono text-[#F2D06B]">0% IPM GST</span>
            </div>
          </div>

          {/* Right Panel: Interactive Send an Inquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-md border border-slate-200 p-5 sm:p-8 shadow-xs">
            <div className="border-b border-slate-100 pb-4 mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0D1F3C]">
                  {t('contact.formTitle')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('contact.formRoute')}{' '}
                  <a
                    href="mailto:info@bullionstar.in.net"
                    className="font-semibold text-[#0D1F3C] hover:text-[#B38818] underline underline-offset-2"
                  >
                    info@bullionstar.in.net
                  </a>
                </p>
              </div>
            </div>

            {submittedSuccess && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>{t('contact.successMsg')}</span>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded p-3.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('contact.fieldName')} <span className="text-rose-600">*</span>
                  </label>
                    <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sophia Lim Hui Ling"
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('contact.fieldEmail')} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('contact.fieldPhone')}{' '}
                    <span className="text-slate-400 font-normal">{t('contact.optional')}</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+65 9123 4567"
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#0D1F3C]"
                  />
                </div>

                <div>
                  <label htmlFor="contact-topic" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('contact.fieldTopic')}
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#0D1F3C]"
                  >
                    {INQUIRY_TOPICS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.key)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('contact.fieldMessage')} <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('contact.messagePlaceholder')}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#0D1F3C] resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-slate-500">{t('contact.confidentialNote')}</p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 min-h-[44px] bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors whitespace-nowrap shrink-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('contact.sendingBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('common.sendInquiry')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
