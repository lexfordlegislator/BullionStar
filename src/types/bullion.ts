export type CurrencyCode = 'SGD' | 'USD' | 'EUR' | 'AUD' | 'GBP' | 'CHF';
export type StockLocation = 'Singapore' | 'New Zealand' | 'United States';
export type LanguageCode = 'EN' | 'ZH' | 'MS' | 'JA';
export type MetalType = 'Gold' | 'Silver' | 'Platinum' | 'Palladium' | 'Diamond';
export type AppView = 'home' | 'catalog' | 'charts' | 'vaults' | 'account' | 'admin';

export interface SpotPricesUSD {
  Gold: number;
  Silver: number;
  Platinum: number;
  Palladium: number;
}

export interface SpotHistoryPoint {
  label: string;
  priceUSD: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: MetalType;
  subType: 'Cast Bar' | 'Minted Bar' | 'Bullion Coin' | 'Certified Diamond';
  mintOrLab: string;
  weightOz: number;
  weightLabel: string;
  purityOrGrade: string;
  giaNumber?: string;
  cutGrade?: string;
  carat?: number;
  premiumPct: number;
  fixedPriceUSD?: number;
  locations: StockLocation[];
  inStock: boolean;
  trending?: boolean;
  gstExempt: boolean;
  image: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  fulfillment: 'Vault Storage (Singapore)' | 'Showroom Pickup (45 New Bridge Rd)' | 'Insured Delivery';
}

/**
 * Single authoritative Supabase table: `clients`
 */
export interface ClientRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  vault_id: string;
  cash_usd: number;
  gold_kg: number;
  silver_kg: number;
  diamond_carats: number;
  diamond_value_usd: number;
  created_at?: string;
}

export interface VaultHoldingItem {
  id: string;
  item_name: string;
  weight_or_carats: string;
  purity_or_grade: string;
  serial_number: string;
  vault_bay: string;
  photo_url: string;
  usd_value: number;
}

export interface TransactionLogItem {
  id: string;
  tx_type: string;
  amount_usd: number;
  status: string;
  created_at: string;
}

export interface VaultCertificateSummary {
  certificate_no: string;
  insured_value_usd: number;
  auditor_name: string;
  audit_status: string;
  issued_at: string;
}

export interface PortfolioNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  category: 'Portfolio' | 'Certificate' | 'Audit' | 'Cash' | 'Admin';
  read: boolean;
}

export interface AuditReportItem {
  id: string;
  reportDate: string;
  auditor: string;
  scope: string;
  barsInspected: number;
  discrepancies: number;
  insurancePolicyId: string;
  underwriter: string;
  coverageLimitUSD: number;
  status: '100% Reconciled' | 'Active Coverage';
}

export interface MarketArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  content: string[];
}
