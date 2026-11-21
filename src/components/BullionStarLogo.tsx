import React, { useId } from 'react';

export interface BullionStarLogoProps {
  /** 'dark' renders white wordmark for dark navy headers; 'light' renders deep obsidian wordmark for light backgrounds */
  variant?: 'dark' | 'light';
  /** Controls emblem and typography proportions */
  size?: 'sm' | 'md' | 'lg';
  /** Toggle sub-caption underneath BULLIONSTAR */
  showSubcaption?: boolean;
  /** Render emblem icon only without wordmark */
  iconOnly?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    icon: 'w-7 h-7 sm:w-8 sm:h-8',
    wordmark: 'text-sm sm:text-base tracking-[0.14em] sm:tracking-[0.18em]',
    subcaption: 'text-[7px] sm:text-[8.5px] tracking-[0.12em] sm:tracking-[0.2em]',
    gap: 'gap-2 sm:gap-2.5',
  },
  md: {
    icon: 'w-8 h-8 sm:w-10 sm:h-10',
    wordmark: 'text-[14px] sm:text-[21px] tracking-[0.13em] sm:tracking-[0.18em]',
    subcaption: 'text-[7px] sm:text-[9.5px] tracking-[0.11em] sm:tracking-[0.21em]',
    gap: 'gap-2 sm:gap-3',
  },
  lg: {
    icon: 'w-10 h-10 sm:w-12 sm:h-12',
    wordmark: 'text-xl sm:text-2xl tracking-[0.16em] sm:tracking-[0.2em]',
    subcaption: 'text-[9px] sm:text-[10.5px] tracking-[0.18em] sm:tracking-[0.22em]',
    gap: 'gap-2.5 sm:gap-3.5',
  },
} as const;

export const BullionStarEmblem: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  const rawId = useId();
  const maskId = `bs-emblem-mask-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#000000" />
          {/* Geometric "B" silhouette with sculpted upper-left curve */}
          <path
            d="M 10 21 C 10 11, 15.5 6, 25 6 L 35.5 6 C 46.8 6, 52.5 11.4, 52.5 19.2 C 52.5 25.4, 48.6 29.4, 43.4 30.8 C 50.4 32.5, 55 37.3, 55 44.5 C 55 52.8, 48.6 58, 36.8 58 L 10 58 Z"
            fill="#FFFFFF"
          />
          {/* Negative-space five-pointed star nestled in the upper-left curve */}
          <polygon
            points="19.2,11.3 20.64,15.52 25.1,15.58 21.53,18.26 22.84,22.52 19.2,19.95 15.56,22.52 16.87,18.26 13.3,15.58 17.76,15.52"
            fill="#000000"
          />
          {/* Upper bowl counter cutout */}
          <path
            d="M 28 14.5 L 34.8 14.5 C 40 14.5, 42.5 16.8, 42.5 20.5 C 42.5 24.2, 40 26.5, 34.8 26.5 L 28 26.5 Z"
            fill="#000000"
          />
          {/* Lower bowl counter cutout */}
          <path
            d="M 28 35.5 L 36.2 35.5 C 42.1 35.5, 45 38.2, 45 42.5 C 45 46.8, 42.1 49.5, 36.2 49.5 L 28 49.5 Z"
            fill="#000000"
          />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Deep burnished bronze lower-right half */}
        <rect width="64" height="64" fill="#9A6B26" />
        {/* Bright bullion gold upper-left diagonal half */}
        <polygon points="0,0 56,0 8,58 0,58" fill="#D4AF37" />
      </g>
    </svg>
  );
};

export const BullionStarLogo: React.FC<BullionStarLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showSubcaption = true,
  iconOnly = false,
  className = '',
}) => {
  const s = SIZE_MAP[size];
  const wordmarkColor = variant === 'dark' ? 'text-white' : 'text-[#0A162B]';

  return (
    <div
      dir="ltr"
      className={`inline-flex items-center ${s.gap} select-none shrink-0 ${className}`}
    >
      <BullionStarEmblem className={s.icon} />
      {!iconOnly && (
        <div className="flex flex-col leading-none text-left">
          <span
            className={`font-sans font-extrabold uppercase whitespace-nowrap leading-none ${s.wordmark} ${wordmarkColor}`}
          >
            BULLIONSTAR
          </span>
          {showSubcaption && (
            <span
              className={`font-sans font-semibold uppercase whitespace-nowrap leading-none mt-1.5 text-[#D4AF37] ${s.subcaption}`}
            >
              GOLD • SILVER • DIAMONDS • VAULT
            </span>
          )}
        </div>
      )}
    </div>
  );
};
