import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { IMAGE_PATHS } from '../data/initialData';
import { useBullion } from '../context/BullionContext';
import { ResilientImage } from './ResilientImage';

interface Slide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  secondaryLabel: string;
  image: string;
  onCta: () => void;
  onSecondary: () => void;
}

export const HeroCarousel: React.FC = () => {
  const { setView, setCatalogFilter, openAuthModal, isLoggedIn } = useBullion();
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      id: 'vault-custody',
      kicker: 'Singapore Non-Bank Bullion Depository · 45 New Bridge Road',
      title: 'Allocated Gold, Silver & Platinum Vaulted Tax-Free in Singapore',
      subtitle:
        'Acquire LBMA-accredited bullion bars and sovereign coins with 0% GST, direct legal title, independent BDO physical audits, and full photographic verification.',
      ctaLabel: isLoggedIn ? 'Open Client Portal' : 'Create Account',
      secondaryLabel: isLoggedIn ? 'Explore Precious Metals' : 'Sign In',
      image: IMAGE_PATHS.heroVault,
      onCta: () => {
        if (isLoggedIn) setView('account');
        else openAuthModal('signup');
      },
      onSecondary: () => {
        if (isLoggedIn) {
          setCatalogFilter('All');
          setView('catalog');
        } else {
          openAuthModal('signin');
        }
      },
    },
    {
      id: 'gia-diamonds',
      kicker: 'GIA Certified Investment Diamonds · Tamper-Evident Vault Custody',
      title: 'D–E Color, Internally Flawless Investment Diamonds',
      subtitle:
        'Ultra-portable wealth preservation backed by GIA laser-inscribed dossiers, Global Gem Audit verification, and Lloyd’s of London specie underwriting.',
      ctaLabel: 'Browse Certified Diamonds',
      secondaryLabel: isLoggedIn ? 'Your Vault Certificates' : 'Create Account',
      image: IMAGE_PATHS.diamond,
      onCta: () => {
        setCatalogFilter('Diamond');
        setView('catalog');
      },
      onSecondary: () => {
        if (isLoggedIn) setView('account');
        else openAuthModal('signup');
      },
    },
    {
      id: 'showroom-exchange',
      kicker: 'Retail Showroom & Live Spot Execution · Singapore CBD',
      title: 'Instant Live Spot Pricing with Immediate Vault Allocation',
      subtitle:
        'Visit our flagship bullion center across from Clarke Quay or execute 24/7 online trades against SGD, USD, and EUR cash balances.',
      ctaLabel: 'View Live Spot Charts',
      secondaryLabel: 'Singapore Vault Showroom',
      image: IMAGE_PATHS.showroom,
      onCta: () => setView('charts'),
      onSecondary: () => setView('vaults'),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-5 pb-6">
        <div className="relative rounded-md overflow-hidden border border-slate-200 bg-[#0D1F3C] min-h-[380px] lg:h-[430px] flex items-center">
          <div className="absolute inset-0">
            <ResilientImage
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#091529]/95 via-[#0D1F3C]/80 to-[#0D1F3C]/25" />
          </div>

          <div className="relative z-10 max-w-2xl px-6 sm:px-10 lg:px-14 py-10">
            <p className="text-xs sm:text-sm font-medium text-[#F2D06B] tracking-wide mb-3">
              {current.kicker}
            </p>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight [text-wrap:balance] mb-4">
              {current.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-7 max-w-xl">
              {current.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={current.onCta}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C59B27] hover:bg-[#B38818] text-[#0A162B] font-semibold text-sm rounded transition-colors whitespace-nowrap shrink-0"
              >
                <span>{current.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={current.onSecondary}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-medium text-sm rounded transition-colors whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-[#F2D06B]" />
                <span>{current.secondaryLabel}</span>
              </button>
            </div>
          </div>

          {/* Carousel Controls */}
          <button
            onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            aria-label="Previous Slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A162B]/70 hover:bg-[#0A162B] text-white items-center justify-center border border-white/15 transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
            aria-label="Next Slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A162B]/70 hover:bg-[#0A162B] text-white items-center justify-center border border-white/15 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Slide Dots */}
          <div className="absolute bottom-4 right-6 flex items-center gap-2 z-10">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === index ? 'w-7 bg-[#C59B27]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Institutional Trust Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded mt-4 overflow-hidden">
          {[
            {
              title: '0% GST Investment Metals',
              desc: 'Singapore IPM tax exemption on qualifying gold, silver & platinum',
            },
            {
              title: '100% Allocated Legal Title',
              desc: 'Segregated bars with stamped serials & individual custody certificates',
            },
            {
              title: 'All-Risks Vault Insurance',
              desc: 'Underwritten up to US$500M by Lloyd’s of London & Chubb',
            },
            {
              title: 'Physical & Photo Audits',
              desc: 'Independent BDO bar counts plus high-resolution tray verification',
            },
          ].map((stat) => (
            <div key={stat.title} className="bg-[#F8FAFC] px-4 py-3 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#B38818] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#0D1F3C]">{stat.title}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
