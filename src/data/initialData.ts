import {
  AuditReportItem,
  ClientRow,
  CurrencyCode,
  MarketArticle,
  PortfolioNotification,
  Product,
  SpotHistoryPoint,
  SpotPricesUSD,
  TransactionLogItem,
  VaultCertificateSummary,
  VaultHoldingItem,
} from '../types/bullion';

import heroVaultImg from '../assets/images/hero_singapore_vault_1794678607935.jpg';
import showroomImg from '../assets/images/singapore_showroom_interior_1794678609157.jpg';
import goldBarImg from '../assets/images/product_gold_bullion_bar_1794678608657.jpg';
import goldCoinImg from '../assets/images/product_gold_bullion_coin_1794678608786.jpg';
import silverBarImg from '../assets/images/product_silver_cast_bar_1794678609902.jpg';
import platinumBarImg from '../assets/images/product_platinum_bar_1794678610386.jpg';
import diamondImg from '../assets/images/product_certified_diamond_1794678611357.jpg';
import vaultVerificationImg from '../assets/images/vault_verification_holdings_1794678610782.jpg';

export const IMAGE_PATHS = {
  heroVault: heroVaultImg,
  showroom: showroomImg,
  goldBar: goldBarImg,
  goldCoin: goldCoinImg,
  silverBar: silverBarImg,
  platinumBar: platinumBarImg,
  diamond: diamondImg,
  vaultVerification: vaultVerificationImg,
};

export const CURRENCY_RATES_FROM_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  SGD: 1.342,
  EUR: 0.928,
  AUD: 1.518,
  GBP: 0.786,
  CHF: 0.882,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: 'US$',
  SGD: 'S$',
  EUR: '€',
  AUD: 'A$',
  GBP: '£',
  CHF: 'CHF ',
};

export const INITIAL_SPOT_PRICES_USD: SpotPricesUSD = {
  Gold: 2684.50,
  Silver: 31.42,
  Platinum: 988.20,
  Palladium: 1046.80,
};

export const INITIAL_SPOT_CHANGES_PCT: Record<keyof SpotPricesUSD, number> = {
  Gold: 0.84,
  Silver: 1.38,
  Platinum: -0.42,
  Palladium: 0.61,
};

export const CATALOG_PRODUCTS: Product[] = [
  {
    id: 'bs-gold-100g-pamp',
    sku: 'BS-AU-PAMP100G',
    name: 'PAMP Suisse 100g Gold Minted Bar 999.9',
    category: 'Gold',
    subType: 'Minted Bar',
    mintOrLab: 'PAMP Suisse (LBMA)',
    weightOz: 3.21507,
    weightLabel: '100 Grams (3.215 oz)',
    purityOrGrade: '999.9 Fine Gold',
    premiumPct: 2.35,
    locations: ['Singapore', 'New Zealand', 'United States'],
    inStock: true,
    trending: true,
    gstExempt: true,
    image: IMAGE_PATHS.goldBar,
    description:
      'LBMA Good Delivery certified 100 gram minted gold bar produced by PAMP Suisse. Individually serialized with Veriscan security assay and eligible for 0% GST Investment Precious Metals exemption in Singapore.',
  },
  {
    id: 'bs-gold-1kg-cast',
    sku: 'BS-AU-CAST1KG',
    name: 'BullionStar 1 kg Cast Gold Bar 999.9',
    category: 'Gold',
    subType: 'Cast Bar',
    mintOrLab: 'Heraeus / BullionStar',
    weightOz: 32.1507,
    weightLabel: '1 Kilogram (32.151 oz)',
    purityOrGrade: '999.9 Fine Gold',
    premiumPct: 1.15,
    locations: ['Singapore', 'New Zealand'],
    inStock: true,
    trending: true,
    gstExempt: true,
    image: IMAGE_PATHS.goldBar,
    description:
      'Institutional 1,000 gram cast gold bullion bar offering ultra-low spot spreads for private wealth vaulting in Singapore. Includes stamped assay hallmark and individual serial certificate.',
  },
  {
    id: 'bs-gold-1oz-britannia',
    sku: 'BS-AU-COIN1OZ',
    name: '1 oz Gold Sovereign Bullion Coin 999.9',
    category: 'Gold',
    subType: 'Bullion Coin',
    mintOrLab: 'The Royal Mint (UK)',
    weightOz: 1.0,
    weightLabel: '1 Troy Oz (31.103g)',
    purityOrGrade: '999.9 Fine Gold',
    premiumPct: 3.45,
    locations: ['Singapore', 'New Zealand', 'United States'],
    inStock: true,
    trending: true,
    gstExempt: true,
    image: IMAGE_PATHS.goldCoin,
    description:
      'Legal tender 1 troy ounce 24-karat bullion coin featuring radial security engraving and latent hologram relief. Exempt from Singapore Goods & Services Tax (IPM).',
  },
  {
    id: 'bs-silver-100oz-cast',
    sku: 'BS-AG-CAST100OZ',
    name: '100 oz Fine Silver Cast Bullion Bar 999.0',
    category: 'Silver',
    subType: 'Cast Bar',
    mintOrLab: 'Nadir / BullionStar',
    weightOz: 100.0,
    weightLabel: '100 Troy Oz (3.11 kg)',
    purityOrGrade: '999.0 Fine Silver',
    premiumPct: 4.85,
    locations: ['Singapore', 'United States'],
    inStock: true,
    trending: true,
    gstExempt: true,
    image: IMAGE_PATHS.silverBar,
    description:
      'Heavy-format 100 troy ounce investment silver bar stamped with refinery hallmark, purity, and unique audit serial number. Directly allocated into BullionStar Singapore racks.',
  },
  {
    id: 'bs-silver-1kg-bar',
    sku: 'BS-AG-CAST1KG',
    name: '1 kg Fine Silver Cast Bar 999.9',
    category: 'Silver',
    subType: 'Cast Bar',
    mintOrLab: 'Perth Mint (LBMA)',
    weightOz: 32.1507,
    weightLabel: '1 Kilogram (32.151 oz)',
    purityOrGrade: '999.9 Fine Silver',
    premiumPct: 5.9,
    locations: ['Singapore', 'New Zealand'],
    inStock: true,
    trending: false,
    gstExempt: true,
    image: IMAGE_PATHS.silverBar,
    description:
      'Compact 1 kg investment silver cast bar from LBMA-accredited refinery, ideal for physical delivery or segregated vault custody.',
  },
  {
    id: 'bs-platinum-1oz-pamp',
    sku: 'BS-PT-PAMP1OZ',
    name: 'PAMP Suisse 1 oz Platinum Bar 999.5',
    category: 'Platinum',
    subType: 'Minted Bar',
    mintOrLab: 'PAMP Suisse (LPPM)',
    weightOz: 1.0,
    weightLabel: '1 Troy Oz (31.103g)',
    purityOrGrade: '999.5 Fine Platinum',
    premiumPct: 6.5,
    locations: ['Singapore', 'New Zealand'],
    inStock: true,
    trending: true,
    gstExempt: true,
    image: IMAGE_PATHS.platinumBar,
    description:
      'LPPM-accredited 1 troy ounce 999.5 fine platinum bar sealed with numbered assay certification. Eligible for GST-exempt IPM status in Singapore.',
  },
  {
    id: 'bs-palladium-1oz-bar',
    sku: 'BS-PD-BAR1OZ',
    name: 'Valcambi 1 oz Palladium Minted Bar 999.5',
    category: 'Palladium',
    subType: 'Minted Bar',
    mintOrLab: 'Valcambi Suisse (LPPM)',
    weightOz: 1.0,
    weightLabel: '1 Troy Oz (31.103g)',
    purityOrGrade: '999.5 Fine Palladium',
    premiumPct: 7.2,
    locations: ['Singapore'],
    inStock: true,
    trending: false,
    gstExempt: false,
    image: IMAGE_PATHS.platinumBar,
    description:
      'Swiss-refined 999.5 fine palladium bullion bar stored inside BullionStar Singapore Class-1 depository with serialized custody tracking.',
  },
  {
    id: 'bs-dia-152-d-if',
    sku: 'BS-DIA-2185679410',
    name: '1.52 ct Round Brilliant Investment Diamond — D / IF',
    category: 'Diamond',
    subType: 'Certified Diamond',
    mintOrLab: 'GIA Certified',
    weightOz: 0,
    carat: 1.52,
    weightLabel: '1.52 Carat',
    purityOrGrade: 'Color D · Internally Flawless',
    giaNumber: '2185679410',
    cutGrade: '3x Excellent · No Fluorescence',
    premiumPct: 0,
    fixedPriceUSD: 24850,
    locations: ['Singapore'],
    inStock: true,
    trending: true,
    gstExempt: false,
    image: IMAGE_PATHS.diamond,
    description:
      'Top-tier investment diamond independently graded by the Gemological Institute of America (GIA). Triple Excellent cut, polish, and symmetry, laser-inscribed girdle #2185679410, sealed in tamper-evident audit packaging.',
  },
  {
    id: 'bs-dia-204-e-vvs1',
    sku: 'BS-DIA-6429103847',
    name: '2.04 ct Round Brilliant Investment Diamond — E / VVS1',
    category: 'Diamond',
    subType: 'Certified Diamond',
    mintOrLab: 'GIA Certified',
    weightOz: 0,
    carat: 2.04,
    weightLabel: '2.04 Carat',
    purityOrGrade: 'Color E · VVS1 Clarity',
    giaNumber: '6429103847',
    cutGrade: '3x Excellent · Faint Fluorescence',
    premiumPct: 0,
    fixedPriceUSD: 33400,
    locations: ['Singapore'],
    inStock: true,
    trending: false,
    gstExempt: false,
    image: IMAGE_PATHS.diamond,
    description:
      'High-liquidity 2-carat institutional diamond parcel graded E Color, VVS1 Clarity by GIA. Ideal for concentrated portable wealth allocation within Singapore vault custody.',
  },
  {
    id: 'bs-dia-108-d-fl',
    sku: 'BS-DIA-5190842311',
    name: '1.08 ct Type IIa Investment Diamond — D / Flawless',
    category: 'Diamond',
    subType: 'Certified Diamond',
    mintOrLab: 'GIA Certified',
    weightOz: 0,
    carat: 1.08,
    weightLabel: '1.08 Carat',
    purityOrGrade: 'Color D · Flawless (Type IIa)',
    giaNumber: '5190842311',
    cutGrade: '3x Excellent · None',
    premiumPct: 0,
    fixedPriceUSD: 21200,
    locations: ['Singapore'],
    inStock: true,
    trending: false,
    gstExempt: false,
    image: IMAGE_PATHS.diamond,
    description:
      'Rare optically pure Type IIa D-Flawless round brilliant diamond with full GIA dossier and Singapore vault photo verification.',
  },
];

export const DEMO_CLIENT: ClientRow = {
  id: 'demo-usr-88412',
  full_name: 'Marcus Tan Wei Ming',
  email: 'm.tan@pacificcapital.sg',
  phone: '+65 9812 4401',
  country: 'Singapore',
  vault_id: 'BS-SG-88412',
  cash_usd: 42350.0,
  gold_kg: 2.3,
  silver_kg: 15.55,
  diamond_carats: 1.52,
  diamond_value_usd: 24850.0,
  account_opened_date: '2026-03-14',
  created_at: '2026-03-14T08:00:00Z',
};

export const DEMO_HOLDINGS: VaultHoldingItem[] = [
  {
    id: 'hld-001',
    item_name: 'BullionStar 1 kg Cast Gold Bar (x2)',
    weight_or_carats: '2.00 kg',
    purity_or_grade: '999.9 Fine Gold',
    serial_number: 'AA-123456 / AA-123457',
    vault_bay: 'SG-VAULT-BAY04 · Locker A-048',
    photo_url: IMAGE_PATHS.vaultVerification,
    usd_value: 172327.76,
  },
  {
    id: 'hld-002',
    item_name: 'PAMP Suisse 100g Gold Minted Bar (x3)',
    weight_or_carats: '0.30 kg',
    purity_or_grade: '999.9 Fine Gold',
    serial_number: 'PAMP-A023456 – A023458',
    vault_bay: 'SG-VAULT-BAY04 · Locker A-048',
    photo_url: IMAGE_PATHS.goldBar,
    usd_value: 25849.16,
  },
  {
    id: 'hld-003',
    item_name: '100 oz Fine Silver Cast Bullion Bar (x5)',
    weight_or_carats: '15.55 kg',
    purity_or_grade: '999.0 Fine Silver',
    serial_number: 'NY-482101 – NY-482105',
    vault_bay: 'SG-VAULT-SEC2 · Rack S-112',
    photo_url: IMAGE_PATHS.silverBar,
    usd_value: 15748.26,
  },
  {
    id: 'hld-004',
    item_name: '1.52 ct Round Brilliant Investment Diamond',
    weight_or_carats: '1.52 ct',
    purity_or_grade: 'GIA D / IF · 3x Excellent',
    serial_number: 'GIA-2185679410',
    vault_bay: 'SG-VAULT-BAY04 · Locker A-048',
    photo_url: IMAGE_PATHS.diamond,
    usd_value: 24850.0,
  },
];

export const DEMO_TRANSACTIONS: TransactionLogItem[] = [
  {
    id: 'tx-9014',
    tx_type: 'Vault Allocation (1.52 ct GIA Diamond)',
    amount_usd: 24850.0,
    status: 'Approved',
    created_at: '2026-11-12T14:22:00Z',
  },
  {
    id: 'tx-9013',
    tx_type: 'Buy Gold (2 kg BullionStar Cast Bars)',
    amount_usd: 172327.76,
    status: 'Settled',
    created_at: '2026-11-10T09:45:00Z',
  },
  {
    id: 'tx-9012',
    tx_type: 'Cash Deposit (SWIFT USD)',
    amount_usd: 42350.0,
    status: 'Approved',
    created_at: '2026-11-05T16:10:00Z',
  },
];

export const DEMO_CERTIFICATE: VaultCertificateSummary = {
  certificate_no: 'CERT-SG-2026-04811',
  insured_value_usd: 281094.19,
  auditor_name: 'Bureau Veritas Singapore',
  audit_status: 'Verified',
  issued_at: '2026-11-12T14:30:00Z',
};

export const INITIAL_NOTIFICATIONS: PortfolioNotification[] = [
  {
    id: 'notif-101',
    timestamp: '2026-11-12 14:30 SGT',
    title: 'High-Resolution Audit Photo Uploaded',
    message: 'Tray A-048 photographic verification completed for GIA #2185679410 and 1 kg Gold Bars.',
    category: 'Audit',
    read: false,
  },
  {
    id: 'notif-102',
    timestamp: '2026-11-10 10:02 SGT',
    title: 'Vault Certificate CERT-SG-2026-04811 Issued',
    message: 'Segregated custody certificate issued for 2 kg fine gold bars at 45 New Bridge Road.',
    category: 'Certificate',
    read: false,
  },
  {
    id: 'notif-103',
    timestamp: '2026-11-05 16:12 SGT',
    title: 'SGD Cash Deposit Credited',
    message: 'FAST transfer of S$84,500.00 cleared and available for immediate bullion execution.',
    category: 'Cash',
    read: true,
  },
];

export const AUDIT_REPORTS: AuditReportItem[] = [
  {
    id: 'aud-2026-q4',
    reportDate: '2026-11-10',
    auditor: 'BDO LLP Singapore & Inspectorate International',
    scope: 'Full Physical Bar-by-Bar Count & Ultrasonic Purity Verification',
    barsInspected: 14820,
    discrepancies: 0,
    insurancePolicyId: 'SG-INS-2026-9941',
    underwriter: 'Lloyd’s of London Syndicate / Chubb Singapore',
    coverageLimitUSD: 500000000,
    status: '100% Reconciled',
  },
  {
    id: 'aud-2026-gem',
    reportDate: '2026-11-12',
    auditor: 'Global Gemological Audit Singapore',
    scope: 'GIA Laser Girdle Inscription & Tamper-Seal Inspection',
    barsInspected: 642,
    discrepancies: 0,
    insurancePolicyId: 'SG-DIA-2026-4410',
    underwriter: 'Lloyd’s of London Specie Underwriters',
    coverageLimitUSD: 150000000,
    status: 'Active Coverage',
  },
];

export const MARKET_ARTICLES: MarketArticle[] = [
  {
    id: 'art-1',
    title: 'ASEAN Central Bank Gold Accumulation Reaches Multi-Decade High in Q4 2026',
    category: 'Monetary Research',
    author: 'Ronan Manly · BullionStar Research',
    publishedAt: 'November 12, 2026',
    readTime: '5 min read',
    summary:
      'Sovereign reserve diversification across Singapore, Thailand, and Malaysia continues to tighten physical London and Zurich 400 oz bar liquidity.',
    content: [
      'Central bank net bullion purchases across Southeast Asia accelerated sharply in the third and fourth quarters of 2026, reinforcing Singapore’s emergence as the region’s primary physical clearing and vaulting hub.',
      'Unlike paper derivative contracts, sovereign and family office buyers in Singapore overwhelmingly require 100% allocated, unencumbered physical delivery stored outside the commercial banking system.',
      'Under Singapore’s Investment Precious Metals (IPM) framework, qualifying investment gold, silver, and platinum bars remain completely exempt from GST, driving sustained inflows into 1 kg cast gold and 100 oz silver formats.',
    ],
  },
  {
    id: 'art-2',
    title: 'Why GIA D-Flawless Diamonds Complement Physical Precious Metals Portfolios',
    category: 'Gemological Insight',
    author: 'Elena Lim · Senior Gemologist',
    publishedAt: 'November 8, 2026',
    readTime: '4 min read',
    summary:
      'High-value density and standardized GIA laser-inscribed grading allow ultra-portable wealth preservation alongside allocated bullion bars.',
    content: [
      'A single 2.0-carat D-Color Internally Flawless round brilliant diamond packs over US$35,000 of internationally recognized value into less than 0.4 grams of physical mass.',
      'Every investment diamond custodied by BullionStar Singapore undergoes dual verification: an independent GIA dossier matching the microscopic girdle laser inscription and tamper-evident sealed parcel photography.',
      'Stored alongside gold and platinum inside our 45 New Bridge Road vault, certified diamonds benefit from comprehensive Lloyd’s of London specie underwriting.',
    ],
  },
  {
    id: 'art-3',
    title: 'Inside Singapore’s Non-Bank Vault Architecture at 45 New Bridge Road',
    category: 'Vault Security',
    author: 'BullionStar Depository Operations',
    publishedAt: 'November 3, 2026',
    readTime: '3 min read',
    summary:
      'How multi-layer biometric access, ultrasonic bullion testing, and client photographic verification create complete custody transparency.',
    content: [
      'True bullion ownership requires direct legal title to specific serial-numbered bars rather than unallocated bank promises.',
      'Every item stored under BullionStar’s Vault Storage program is photographed on a calibrated audit tray, weighed to 0.01g tolerance, and logged against an independently audited bar list.',
      'Clients can inspect their holdings in person at our Singapore showroom or download certified custody documentation directly from their online portal.',
    ],
  },
];

export function generateSpotSeries(
  basePrice: number,
  timeframe: '1D' | '1W' | '1M' | '1Y' | '5Y',
  metalSeed: number
): SpotHistoryPoint[] {
  const configs: Record<'1D' | '1W' | '1M' | '1Y' | '5Y', { count: number; vol: number; labels: string[] }> = {
    '1D': {
      count: 13,
      vol: 0.0045,
      labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', 'Now'],
    },
    '1W': {
      count: 7,
      vol: 0.012,
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    },
    '1M': {
      count: 10,
      vol: 0.028,
      labels: ['Oct 15', 'Oct 18', 'Oct 21', 'Oct 24', 'Oct 27', 'Oct 30', 'Nov 03', 'Nov 07', 'Nov 10', 'Nov 14'],
    },
    '1Y': {
      count: 12,
      vol: 0.075,
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    },
    '5Y': {
      count: 11,
      vol: 0.16,
      labels: ['2022 H1', '2022 H2', '2023 H1', '2023 H2', '2024 H1', '2024 H2', '2025 H1', '2025 H2', '2026 Q1', '2026 Q2', '2026 Q4'],
    },
  };

  const cfg = configs[timeframe];
  const points: SpotHistoryPoint[] = [];
  const startFactor = timeframe === '5Y' ? 0.68 : timeframe === '1Y' ? 0.82 : timeframe === '1M' ? 0.96 : 0.992;

  for (let i = 0; i < cfg.count; i++) {
    const progress = i / (cfg.count - 1);
    const wave =
      Math.sin((i + metalSeed) * 1.45) * cfg.vol * 0.6 +
      Math.cos((i * 2.1 + metalSeed) * 0.9) * cfg.vol * 0.4;
    const trend = startFactor + (1 - startFactor) * progress;
    const price = i === cfg.count - 1 ? basePrice : Number((basePrice * (trend + wave)).toFixed(2));
    points.push({
      label: cfg.labels[i],
      priceUSD: price,
    });
  }
  return points;
}
