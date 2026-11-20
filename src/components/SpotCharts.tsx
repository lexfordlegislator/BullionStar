import React, { useMemo, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { CURRENCY_SYMBOLS, generateSpotSeries } from '../data/initialData';

interface SpotChartsProps {
  selectedMetal: 'Gold' | 'Silver' | 'Platinum' | 'Palladium';
  onSelectMetal: (metal: 'Gold' | 'Silver' | 'Platinum' | 'Palladium') => void;
}

type Timeframe = '1D' | '1W' | '1M' | '1Y' | '5Y';
type WeightUnit = 'oz' | 'g' | 'kg';

const UNIT_MULTIPLIER: Record<WeightUnit, number> = {
  oz: 1,
  g: 1 / 31.1034768,
  kg: 32.1507466,
};

const UNIT_LABEL: Record<WeightUnit, string> = {
  oz: 'Troy Oz',
  g: 'Gram',
  kg: 'Kilogram',
};

export const SpotCharts: React.FC<SpotChartsProps> = ({ selectedMetal, onSelectMetal }) => {
  const {
    spotPricesUSD,
    spotChangesPct,
    currency,
    convertFromUSD,
    liveTickerActive,
    setLiveTickerActive,
    t,
  } = useBullion();

  const unitLabel = (u: WeightUnit) => t(`charts.unit.${u}`);

  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [unit, setUnit] = useState<WeightUnit>('oz');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const metalSeed = selectedMetal === 'Gold' ? 1 : selectedMetal === 'Silver' ? 2 : selectedMetal === 'Platinum' ? 3 : 4;
  const baseSpotUSD = spotPricesUSD[selectedMetal];

  const series = useMemo(() => {
    const raw = generateSpotSeries(baseSpotUSD, timeframe, metalSeed);
    return raw.map((pt) => ({
      label: pt.label,
      value: convertFromUSD(pt.priceUSD) * UNIT_MULTIPLIER[unit],
    }));
  }, [baseSpotUSD, timeframe, metalSeed, currency, unit]);

  const values = series.map((s) => s.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = (maxVal - minVal) * 0.12 || 1;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const width = 820;
  const height = 260;
  const padX = 16;
  const padY = 18;

  const coords = series.map((pt, i) => {
    const x = padX + (i / (series.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (pt.value - yMin) / (yMax - yMin)) * (height - padY * 2);
    return { x, y, ...pt };
  });

  const linePath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`;

  const currentVal = series[series.length - 1].value;
  const hoveredPoint = hoverIdx !== null ? coords[hoverIdx] : null;
  const sym = CURRENCY_SYMBOLS[currency];
  const changePct = spotChangesPct[selectedMetal];
  const isUp = changePct >= 0;

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-6 pt-10">
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-4 bg-[#0D1F3C] text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">{t('charts.title')}</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {t('charts.subtitle', { currency, unit: unitLabel(unit) })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiveTickerActive(!liveTickerActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                liveTickerActive
                  ? 'bg-[#193561] border-[#C59B27]/60 text-[#F2D06B]'
                  : 'bg-[#0A162B] border-slate-700 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveTickerActive ? 'animate-spin' : ''}`} style={{ animationDuration: '5s' }} />
              <span>{liveTickerActive ? t('charts.liveActive') : t('charts.feedPaused')}</span>
            </button>
          </div>
        </div>

        {/* Metal Selector + KPI Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
          <div className="lg:col-span-5 flex border-b lg:border-b-0 lg:border-r border-slate-200 divide-x divide-slate-200">
            {(['Gold', 'Silver', 'Platinum', 'Palladium'] as const).map((m) => {
              const active = selectedMetal === m;
              const chg = spotChangesPct[m];
              return (
                <button
                  key={m}
                  onClick={() => {
                    onSelectMetal(m);
                    setHoverIdx(null);
                  }}
                  className={`flex-1 px-3 py-3 text-start transition-colors ${
                    active ? 'bg-[#F8FAFC] border-b-2 border-[#C59B27]' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-[#0D1F3C]">{t(`metal.${m}`)}</div>
                  <div className="text-xs font-mono font-bold text-slate-800 tabular-nums mt-0.5">
                    {sym}
                    {(convertFromUSD(spotPricesUSD[m]) * UNIT_MULTIPLIER[unit]).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={`text-[11px] font-mono tabular-nums ${
                      chg >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {chg >= 0 ? '+' : ''}
                    {chg.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls: Timeframe & Unit */}
          <div className="lg:col-span-7 px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
            <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded">
              {(['1D', '1W', '1M', '1Y', '5Y'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                    timeframe === tf ? 'bg-[#0D1F3C] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded">
              {(['oz', 'g', 'kg'] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                    unit === u ? 'bg-[#C59B27] text-[#0A162B]' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {unitLabel(u)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Metal Readout + Interactive Chart */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#0D1F3C] tabular-nums">
                {sym}
                {(hoveredPoint ? hoveredPoint.value : currentVal).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {hoveredPoint
                  ? hoveredPoint.label
                  : t('charts.currentSpot', { metal: t(`metal.${selectedMetal}`), unit: unitLabel(unit) })}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums ${
                  isUp ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? '+' : ''}
                {changePct.toFixed(2)}% ({timeframe})
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono tabular-nums text-slate-600">
              <div>
                <span className="text-slate-400 me-1.5">{t('charts.periodHigh')}</span>
                <strong className="text-slate-900">
                  {sym}
                  {maxVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 me-1.5">{t('charts.periodLow')}</span>
                <strong className="text-slate-900">
                  {sym}
                  {minVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-400 me-1.5">{t('charts.bidAsk')}</span>
                <strong className="text-slate-900">
                  {sym}
                  {(currentVal * 0.9985).toFixed(2)} / {sym}
                  {(currentVal * 1.0015).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="relative w-full h-[250px] bg-[#FAFBFD] border border-slate-200 rounded p-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C59B27" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#C59B27" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const y = padY + ratio * (height - padY * 2);
                return (
                  <line
                    key={ratio}
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                  />
                );
              })}

              <path d={areaPath} fill="url(#spotGrad)" />
              <path d={linePath} fill="none" stroke="#0D1F3C" strokeWidth="2.5" strokeLinejoin="round" />

              {hoveredPoint && (
                <>
                  <line
                    x1={hoveredPoint.x}
                    y1={padY}
                    x2={hoveredPoint.x}
                    y2={height - padY}
                    stroke="#C59B27"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#C59B27" stroke="#0D1F3C" strokeWidth="2" />
                </>
              )}

              {/* Invisible hover hit strips */}
              {coords.map((pt, i) => {
                const colWidth = (width - padX * 2) / coords.length;
                return (
                  <rect
                    key={pt.label}
                    x={pt.x - colWidth / 2}
                    y={0}
                    width={colWidth}
                    height={height}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoverIdx(i)}
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-slate-400">
            {series.filter((_, idx) => idx % 2 === 0 || idx === series.length - 1).map((pt) => (
              <span key={pt.label}>{pt.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
