import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATALOG_PRODUCTS,
  CURRENCY_RATES_FROM_USD,
  CURRENCY_SYMBOLS,
  DEMO_CERTIFICATE,
  DEMO_CLIENT,
  DEMO_HOLDINGS,
  DEMO_TRANSACTIONS,
  IMAGE_PATHS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SPOT_CHANGES_PCT,
  INITIAL_SPOT_PRICES_USD,
} from '../data/initialData';
import { SpotPriceMap, supabase, TROY_OZ_PER_KG } from '../lib/supabase';
import {
  formatTransactionEmailAmountText,
  sendTransactionNotificationEmail,
} from '../lib/notifications';
import { isValidLanguageCode, translate, TranslationKey } from '../data/translations';
import {
  AppView,
  CartItem,
  ClientRow,
  CurrencyCode,
  LanguageCode,
  MetalType,
  PortfolioNotification,
  Product,
  SpotPricesUSD,
  StockLocation,
  TransactionLogItem,
  UploadedMediaCategory,
  UploadedMediaItem,
  VaultCertificateSummary,
  VaultHoldingItem,
  VaultTransactionStatus,
} from '../types/bullion';
import { generateVaultVerificationPhoto } from '../utils/vaultPhotoGenerator';
import { collectLoginSessionMetadata } from '../utils/sessionMetadata';

interface ToastMessage {
  id: string;
  title: string;
  body: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
}

export interface AdminClientBalanceUpdate {
  cash_usd: number;
  gold_kg: number;
  silver_kg: number;
  diamond_carats: number;
  diamond_value_usd: number;
}

export interface PendingVaultTransactionDraft {
  tx_type:
    | 'Cash Withdrawal'
    | 'Cash Deposit'
    | 'Buy Bullion'
    | 'Sell Bullion'
    | 'Physical Vault Appointment'
    | 'Physical Metal Release';
  asset_summary: string;
  amount_usd: number;
  currency: string;
  settlement_rail: string;
  account_details: Record<string, string>;
  sendEmailToTreasury?: boolean;
}

interface BullionContextType {
  view: AppView;
  setView: (v: AppView) => void;
  scrollToContact: () => void;
  openHiddenAdmin: () => void;
  exitHiddenAdmin: () => void;
  catalogFilter: MetalType | 'All';
  setCatalogFilter: (f: MetalType | 'All') => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  stockLocation: StockLocation;
  setStockLocation: (loc: StockLocation) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  spotPricesUSD: SpotPricesUSD;
  spotPriceMap: SpotPriceMap;
  spotChangesPct: Record<keyof SpotPricesUSD, number>;
  liveTickerActive: boolean;
  setLiveTickerActive: (v: boolean) => void;

  products: Product[];
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, fulfillment?: CartItem['fulfillment']) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkoutCart: () => Promise<void>;

  // Auth & Client Portal (single `clients` table + mandatory Email OTP)
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  isLoggedIn: boolean;
  isDemoMode: boolean;
  authLoading: boolean;
  refreshingClient: boolean;
  lastSignInAt: string;
  startSignupWithOtp: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  verifySignupOtp: (
    email: string,
    token: string,
    meta: { fullName: string; phone: string; country: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  resendSignupOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  startLoginWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  verifyLoginOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  resendLoginOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  requestPasswordResetOtp: (email: string) => Promise<{ ok: boolean; error?: string }>;
  completePasswordResetWithOtp: (
    email: string,
    token: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateAccountPassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  requestAccountEmailChange: (newEmail: string) => Promise<{ ok: boolean; error?: string }>;
  verifyAccountEmailChange: (newEmail: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  demoLogin: () => void;
  logout: () => Promise<void>;
  refreshClientSession: () => Promise<void>;

  client: ClientRow;
  holdings: VaultHoldingItem[];
  certificate: VaultCertificateSummary | null;
  transactions: TransactionLogItem[];
  transactionsLoading: boolean;
  refreshClientTransactions: () => Promise<void>;
  notifications: PortfolioNotification[];
  markAllNotificationsRead: () => void;

  // Helpers
  convertFromUSD: (usd: number, target?: CurrencyCode) => number;
  convertToUSD: (amount: number, fromCurrency: CurrencyCode) => number;
  formatMoney: (usd: number, targetCurrency?: CurrencyCode) => string;
  formatNativeMoney: (amount: number, code: CurrencyCode) => string;
  getProductPriceUSD: (product: Product) => number;
  totalPortfolioUSD: number;

  // Client Actions (Mandatory 6-digit Email OTP -> vault_transactions with Pending status)
  sendTransactionOtp: () => Promise<{ ok: boolean; error?: string }>;
  verifyAndSubmitTransaction: (
    otpCode: string,
    draft: PendingVaultTransactionDraft
  ) => Promise<{ ok: boolean; error?: string; transaction?: TransactionLogItem }>;
  cancelClientTransaction: (txId: string) => Promise<{ ok: boolean; error?: string }>;
  executeFunding: (
    action: 'Deposit' | 'Withdraw',
    currencyCode: CurrencyCode,
    amount: number,
    method: string
  ) => Promise<{ ok: boolean; error?: string }>;
  executeSpotTrade: (
    side: 'Buy' | 'Sell',
    productId: string,
    quantity: number,
    payCurrency: CurrencyCode
  ) => Promise<{ ok: boolean; error?: string }>;

  // Hidden Staff & Vault Operations (`clients` & `vault_transactions` tables)
  adminAuthenticated: boolean;
  adminClients: ClientRow[];
  adminLoading: boolean;
  adminTransactions: TransactionLogItem[];
  adminTxLoading: boolean;
  adminTxError: string;
  adminLogin: (passcode: string) => Promise<{ ok: boolean; error?: string }>;
  adminLogout: () => void;
  adminUpdatePasscode: (newPasscode: string) => { ok: boolean; error?: string };
  adminResetToDefaultPasscode: () => void;
  fetchAdminClients: () => Promise<{ ok: boolean; error?: string }>;
  fetchAdminTransactions: () => Promise<{ ok: boolean; error?: string }>;
  adminUpdateTransactionStatus: (
    txId: string,
    status: VaultTransactionStatus
  ) => Promise<{ ok: boolean; error?: string }>;
  adminSaveClientRow: (
    clientId: string,
    updates: AdminClientBalanceUpdate
  ) => Promise<{ ok: boolean; error?: string }>;
  adminUploadClientMedia: (
    clientId: string,
    input: { title: string; category: UploadedMediaCategory; file: File }
  ) => Promise<{ ok: boolean; error?: string }>;
  adminDeleteClientMedia: (
    clientId: string,
    item: UploadedMediaItem
  ) => Promise<{ ok: boolean; error?: string }>;

  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const ADMIN_AUTH_KEY = 'bs_staff_ops_unlocked_v1';
const ADMIN_PASSCODE_KEY = 'bs_staff_ops_passcode_v1';
const PREFS_KEY = 'bs_prefs_v4';

const normalizeUploadedMedia = (raw: unknown): UploadedMediaItem[] => {
  if (Array.isArray(raw)) return raw as UploadedMediaItem[];
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as UploadedMediaItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeAccountDetails = (raw: unknown): Record<string, string> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
      out[k] = v === null || v === undefined ? '' : String(v);
    });
    return out;
  }
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const out: Record<string, string> = {};
        Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
          out[k] = v === null || v === undefined ? '' : String(v);
        });
        return out;
      }
    } catch {
      // ignore
    }
  }
  return {};
};

const normalizeTransactionRow = (row: Record<string, unknown>): TransactionLogItem => ({
  id: String(row.id || ''),
  client_id: row.client_id ? String(row.client_id) : undefined,
  client_name: row.client_name ? String(row.client_name) : undefined,
  client_email: row.client_email ? String(row.client_email) : undefined,
  vault_id: row.vault_id ? String(row.vault_id) : undefined,
  tx_type: String(row.tx_type || 'Transaction'),
  asset_summary: row.asset_summary ? String(row.asset_summary) : undefined,
  amount_usd: Number(row.amount_usd) || 0,
  currency: row.currency ? String(row.currency) : 'USD',
  settlement_rail: row.settlement_rail ? String(row.settlement_rail) : undefined,
  account_details: normalizeAccountDetails(row.account_details),
  status: String(row.status || 'Pending'),
  created_at: String(row.created_at || new Date().toISOString()),
});

const EMPTY_CLIENT: ClientRow = {
  id: '',
  full_name: '',
  email: '',
  phone: '',
  country: 'Singapore',
  vault_id: '',
  cash_usd: 0,
  gold_kg: 0,
  silver_kg: 0,
  diamond_carats: 0,
  diamond_value_usd: 0,
  uploaded_media: [],
  created_at: '',
};

const BullionContext = createContext<BullionContextType | null>(null);

export const BullionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedPrefs = (() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const [view, setView] = useState<AppView>('home');
  const [catalogFilter, setCatalogFilter] = useState<MetalType | 'All'>('All');
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const explicitLang = localStorage.getItem('bs_language');
      if (isValidLanguageCode(explicitLang)) return explicitLang;
    } catch {
      // ignore
    }
    return isValidLanguageCode(savedPrefs.language) ? savedPrefs.language : 'EN';
  });
  const [currency, setCurrency] = useState<CurrencyCode>(savedPrefs.currency || 'USD');
  const [stockLocation, setStockLocation] = useState<StockLocation>(
    savedPrefs.stockLocation || 'Singapore'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [spotPricesUSD, setSpotPricesUSD] = useState<SpotPricesUSD>(INITIAL_SPOT_PRICES_USD);
  const [spotChangesPct] = useState<Record<keyof SpotPricesUSD, number>>(INITIAL_SPOT_CHANGES_PCT);
  const [liveTickerActive, setLiveTickerActive] = useState<boolean>(true);

  const [cart, setCart] = useState<CartItem[]>(savedPrefs.cart || []);
  const [cartOpen, setCartOpen] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [refreshingClient, setRefreshingClient] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [lastSignInAt, setLastSignInAt] = useState<string>('');
  const authFlowPendingRef = React.useRef<boolean>(false);
  const signupVerifyTypeRef = React.useRef<'signup' | 'email'>('signup');
  const pendingVaultIdRef = React.useRef<string>('');

  const [client, setClient] = useState<ClientRow>(EMPTY_CLIENT);
  const [transactions, setTransactions] = useState<TransactionLogItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<PortfolioNotification[]>([]);

  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  );
  const [adminClients, setAdminClients] = useState<ClientRow[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTransactions, setAdminTransactions] = useState<TransactionLogItem[]>([]);
  const [adminTxLoading, setAdminTxLoading] = useState(false);
  const [adminTxError, setAdminTxError] = useState('');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const spotPriceMap: SpotPriceMap = useMemo(
    () => ({
      Gold: {
        oz: spotPricesUSD.Gold,
        kg: Number((spotPricesUSD.Gold * TROY_OZ_PER_KG).toFixed(2)),
      },
      Silver: {
        oz: spotPricesUSD.Silver,
        kg: Number((spotPricesUSD.Silver * TROY_OZ_PER_KG).toFixed(2)),
      },
      Platinum: {
        oz: spotPricesUSD.Platinum,
        kg: Number((spotPricesUSD.Platinum * TROY_OZ_PER_KG).toFixed(2)),
      },
      Palladium: {
        oz: spotPricesUSD.Palladium,
        kg: Number((spotPricesUSD.Palladium * TROY_OZ_PER_KG).toFixed(2)),
      },
    }),
    [spotPricesUSD]
  );

  const pushToast = (title: string, body: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, body }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushLocalNotification = (
    title: string,
    message: string,
    category: PortfolioNotification['category']
  ) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-SG', { hour12: false }),
        title,
        message,
        category,
        read: false,
      },
      ...prev,
    ]);
  };

  // Ensure #admin never remains in the URL
  useEffect(() => {
    if (window.location.hash.toLowerCase().includes('admin')) {
      window.history.replaceState(null, '', window.location.pathname || '/');
    }
  }, []);

  const openHiddenAdmin = () => {
    setView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitHiddenAdmin = () => {
    setView('home');
  };

  const scrollToContact = () => {
    const scrollTarget = () => {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (view !== 'home') {
      setView('home');
      setTimeout(scrollTarget, 80);
    } else {
      scrollTarget();
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ language, currency, stockLocation, cart }));
    } catch {
      // ignore
    }
  }, [language, currency, stockLocation, cart]);

  useEffect(() => {
    try {
      localStorage.setItem('bs_language', language);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'AR' ? 'rtl' : 'ltr';
      document.documentElement.lang = language.toLowerCase();
    }
  }, [language]);

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(language, key, vars);

  // Subtle realistic spot price drift every 12 seconds when ticker is active
  useEffect(() => {
    if (!liveTickerActive) return;
    const interval = setInterval(() => {
      setSpotPricesUSD((prev) => ({
        Gold: Number((prev.Gold + (Math.random() - 0.49) * 1.4).toFixed(2)),
        Silver: Number((prev.Silver + (Math.random() - 0.49) * 0.06).toFixed(2)),
        Platinum: Number((prev.Platinum + (Math.random() - 0.49) * 0.9).toFixed(2)),
        Palladium: Number((prev.Palladium + (Math.random() - 0.49) * 1.1).toFixed(2)),
      }));
    }, 12000);
    return () => clearInterval(interval);
  }, [liveTickerActive]);

  const loadClientRow = async (
    userId: string,
    fallbackEmail?: string,
    fallbackMeta?: Record<string, string>
  ): Promise<ClientRow | null> => {
    // 1. Fetch single row by `id` from `clients`
    let { data: rows, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .limit(1);

    // 2. Fallback lookup by `email` if needed
    if ((!rows || rows.length === 0) && fallbackEmail) {
      const byEmail = await supabase
        .from('clients')
        .select('*')
        .ilike('email', fallbackEmail.trim().toLowerCase())
        .limit(1);
      if (byEmail.data && byEmail.data.length > 0) {
        rows = byEmail.data;
        error = byEmail.error;
      }
    }

    let row = rows && rows.length > 0 ? (rows[0] as ClientRow) : null;

    // 3. Create starting row with 0 balances if authenticated user has no row yet
    if (!row && !error) {
      const generatedVaultId =
        fallbackMeta?.vault_id || `BS-SG-${Math.floor(10000 + Math.random() * 89999)}`;
      const newRow = {
        id: userId,
        full_name: fallbackMeta?.full_name || fallbackEmail?.split('@')[0] || 'Vault Client',
        email: (fallbackEmail || '').trim().toLowerCase(),
        phone: fallbackMeta?.phone || '',
        country: fallbackMeta?.country || 'Singapore',
        vault_id: generatedVaultId,
        cash_usd: 0,
        gold_kg: 0,
        silver_kg: 0,
        diamond_carats: 0,
        diamond_value_usd: 0,
      };
      const { data: inserted } = await supabase
        .from('clients')
        .upsert(newRow, { onConflict: 'id' })
        .select('*')
        .limit(1);
      if (inserted && inserted.length > 0) {
        row = inserted[0] as ClientRow;
      }
    }

    if (row) {
      setClient({
        ...row,
        cash_usd: Number(row.cash_usd) || 0,
        gold_kg: Number(row.gold_kg) || 0,
        silver_kg: Number(row.silver_kg) || 0,
        diamond_carats: Number(row.diamond_carats) || 0,
        diamond_value_usd: Number(row.diamond_value_usd) || 0,
        uploaded_media: normalizeUploadedMedia(row.uploaded_media),
      });
      setIsDemoMode(false);
      setIsLoggedIn(true);
      await fetchClientTransactionsById(row.id);
    }

    return row;
  };

  const fetchClientTransactionsById = async (clientId: string) => {
    if (!clientId) return;
    setTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setTransactions(data.map((r) => normalizeTransactionRow(r as Record<string, unknown>)));
      }
    } finally {
      setTransactionsLoading(false);
    }
  };

  const refreshClientTransactions = async () => {
    if (isDemoMode || !client.id) return;
    await fetchClientTransactionsById(client.id);
  };

  // Boot: restore Supabase Auth session & fetch row from `clients`
  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user && !authFlowPendingRef.current) {
        const u = data.session.user;
        setLastSignInAt(u.last_sign_in_at || new Date().toISOString());
        await loadClientRow(u.id, u.email, (u.user_metadata || {}) as Record<string, string>);
      }
      setAuthLoading(false);
    };
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (authFlowPendingRef.current) return;

      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setIsDemoMode(false);
        setLastSignInAt('');
        setClient(EMPTY_CLIENT);
        setTransactions([]);
        setNotifications([]);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const u = session.user;
        if (u.last_sign_in_at) setLastSignInAt(u.last_sign_in_at);
        await loadClientRow(u.id, u.email, (u.user_metadata || {}) as Record<string, string>);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const refreshClientSession = async () => {
    if (isDemoMode) {
      pushToast('Demo Preview', 'Demo balances are active.');
      return;
    }
    setRefreshingClient(true);
    try {
      const { data } = await supabase.auth.getUser();
      const targetId = data.user?.id || client.id;
      const targetEmail = data.user?.email || client.email;
      if (data.user?.last_sign_in_at) setLastSignInAt(data.user.last_sign_in_at);
      if (targetId) {
        const updated = await loadClientRow(
          targetId,
          targetEmail,
          (data.user?.user_metadata || {}) as Record<string, string>
        );
        if (updated) {
          pushToast('Vault Refreshed', `Loaded latest balances for ${updated.vault_id} from clients.`);
        }
      }
    } finally {
      setRefreshingClient(false);
    }
  };

  // Sign Up Step 1: Register with Supabase Auth and require 6-digit email OTP verification
  const startSignupWithOtp = async (input: RegisterInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    const vaultId = `BS-SG-${Math.floor(10000 + Math.random() * 89999)}`;
    pendingVaultIdRef.current = vaultId;
    signupVerifyTypeRef.current = 'signup';

    const { data: existingRows } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', cleanEmail)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      return {
        ok: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    authFlowPendingRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName.trim(),
            phone: input.phone.trim(),
            country: input.country,
            vault_id: vaultId,
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          ok: false,
          error: 'An account with this email address already exists. Please sign in instead.',
        };
      }

      if (!data.user?.id) {
        return { ok: false, error: 'Registration did not return a valid Auth user ID.' };
      }

      // Never grant dashboard session before 6-digit email OTP verification
      if (data.session) {
        await supabase.auth.signOut();
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        if (otpErr) {
          return { ok: false, error: otpErr.message };
        }
        signupVerifyTypeRef.current = 'email';
      }

      return { ok: true };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  // Sign Up Step 2: Verify 6-digit signup OTP, create clients row, and grant dashboard access
  const verifySignupOtp = async (
    email: string,
    token: string,
    meta: { fullName: string; phone: string; country: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    const vaultId = pendingVaultIdRef.current || `BS-SG-${Math.floor(10000 + Math.random() * 89999)}`;

    authFlowPendingRef.current = true;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: signupVerifyTypeRef.current,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user || data.session?.user;
      if (!user) {
        return { ok: false, error: 'Verification succeeded, but user session could not be loaded.' };
      }

      const userMeta = (user.user_metadata || {}) as Record<string, string>;
      const resolvedVaultId = userMeta.vault_id || vaultId;
      const resolvedFullName = meta.fullName.trim() || userMeta.full_name || 'Vault Client';
      const resolvedPhone = meta.phone.trim() || userMeta.phone || '';
      const resolvedCountry = meta.country || userMeta.country || 'Singapore';

      // Create profile row in `clients` if not already created
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .limit(1);

      if (!existingClient || existingClient.length === 0) {
        const { error: insertErr } = await supabase.from('clients').upsert(
          {
            id: user.id,
            full_name: resolvedFullName,
            email: cleanEmail,
            phone: resolvedPhone,
            country: resolvedCountry,
            vault_id: resolvedVaultId,
            cash_usd: 0,
            gold_kg: 0,
            silver_kg: 0,
            diamond_carats: 0,
            diamond_value_usd: 0,
          },
          { onConflict: 'id' }
        );
        if (insertErr) {
          return { ok: false, error: `Could not create clients record: ${insertErr.message}` };
        }
      }

      setLastSignInAt(user.last_sign_in_at || new Date().toISOString());
      await loadClientRow(user.id, cleanEmail, {
        full_name: resolvedFullName,
        phone: resolvedPhone,
        country: resolvedCountry,
        vault_id: resolvedVaultId,
      });

      pushLocalNotification(
        `Vault Account ${resolvedVaultId} Verified`,
        'Email OTP verified. Account initialized with $0.00 cash and 0.00 kg bullion.',
        'Portfolio'
      );
      setAuthModalOpen(false);
      setView('account');
      pushToast('Account Verified', `Signed in as ${resolvedFullName} (${resolvedVaultId})`);
      return { ok: true };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  const resendSignupOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (signupVerifyTypeRef.current === 'email') {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  // Sign In Step 1 & 2: Verify password, save session metadata, sign out, and dispatch 6-digit Email OTP
  const startLoginWithPassword = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    authFlowPendingRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      if (!data.user) {
        return { ok: false, error: 'Unable to verify credentials.' };
      }

      // Detect real Device/OS, IP-based City & Country (2s timeout + timezone fallback), and timestamp
      const { device, location, loginTime } = await collectLoginSessionMetadata();
      const sessionMeta = {
        last_device: device,
        last_location: location,
        last_login_time: loginTime,
      };

      // Save session details into user_metadata while the password session is active
      try {
        await supabase.auth.updateUser({ data: sessionMeta });
      } catch {
        // Non-blocking: options.data below also carries the session metadata to signInWithOtp
      }

      // Step 2: Sign out immediately so no dashboard access is granted prior to Email OTP
      await supabase.auth.signOut();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          data: sessionMeta,
        },
      });

      if (otpError) {
        return { ok: false, error: otpError.message };
      }

      return { ok: true };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  // Sign In Step 3: Verify 6-digit Email OTP and grant dashboard access
  const verifyLoginOtp = async (email: string, token: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    authFlowPendingRef.current = true;
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user || data.session?.user;
      if (!user) {
        return { ok: false, error: 'Unable to establish verified session.' };
      }

      setLastSignInAt(user.last_sign_in_at || new Date().toISOString());
      await loadClientRow(
        user.id,
        user.email,
        (user.user_metadata || {}) as Record<string, string>
      );
      setAuthModalOpen(false);
      setView('account');
      pushToast('Signed In', '6-digit email OTP verified. Welcome to your vault.');
      return { ok: true };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  const resendLoginOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { device, location, loginTime } = await collectLoginSessionMetadata();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
        data: {
          last_device: device,
          last_location: location,
          last_login_time: loginTime,
        },
      },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  // Forgot Password Step 1: Send 6-digit recovery OTP
  const requestPasswordResetOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  // Forgot Password Step 2: Verify recovery OTP, update password, sign out to require fresh Sign In + OTP
  const completePasswordResetWithOtp = async (
    email: string,
    token: string,
    newPassword: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    authFlowPendingRef.current = true;
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'recovery',
      });
      if (verifyErr) {
        return { ok: false, error: verifyErr.message };
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) {
        return { ok: false, error: updateErr.message };
      }

      await supabase.auth.signOut();
      return { ok: true };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  // Security Settings: Change Password
  const updateAccountPassword = async (newPassword: string) => {
    if (isDemoMode) {
      return { ok: false, error: 'Demo preview accounts cannot modify live Supabase passwords.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, error: error.message };
    }
    pushLocalNotification('Password Updated', 'Your depository account password was updated.', 'Portfolio');
    pushToast('Password Updated', 'Your account password has been changed successfully.');
    return { ok: true };
  };

  // Security Settings: Request Email Change
  const requestAccountEmailChange = async (newEmail: string) => {
    if (isDemoMode) {
      return { ok: false, error: 'Demo preview accounts cannot modify registered email addresses.' };
    }
    const cleanEmail = newEmail.trim().toLowerCase();
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  // Security Settings: Verify 6-digit Email Change OTP & sync `clients` table
  const verifyAccountEmailChange = async (newEmail: string, token: string) => {
    if (isDemoMode) {
      return { ok: false, error: 'Demo preview accounts cannot verify live email changes.' };
    }
    const cleanEmail = newEmail.trim().toLowerCase();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: token.trim(),
      type: 'email_change',
    });
    if (verifyErr) {
      return { ok: false, error: verifyErr.message };
    }

    const { error: dbErr } = await supabase
      .from('clients')
      .update({ email: cleanEmail })
      .eq('id', client.id);

    if (dbErr) {
      return { ok: false, error: `Auth email verified, but clients table update failed: ${dbErr.message}` };
    }

    setClient((prev) => ({ ...prev, email: cleanEmail }));
    pushLocalNotification(
      'Email Address Updated',
      `Your registered account email is now ${cleanEmail}.`,
      'Portfolio'
    );
    pushToast('Email Updated', `Registered email changed to ${cleanEmail}.`);
    return { ok: true };
  };

  const demoLogin = () => {
    setClient(DEMO_CLIENT);
    setTransactions(DEMO_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLastSignInAt(new Date().toISOString());
    setIsDemoMode(true);
    setIsLoggedIn(true);
    setAuthModalOpen(false);
    setView('account');
    pushToast('Demo Account Active', `Previewing ${DEMO_CLIENT.full_name} (${DEMO_CLIENT.vault_id})`);
  };

  const logout = async () => {
    authFlowPendingRef.current = true;
    try {
      if (!isDemoMode) {
        await supabase.auth.signOut();
      }
      setIsLoggedIn(false);
      setIsDemoMode(false);
      setLastSignInAt('');
      setClient(EMPTY_CLIENT);
      setTransactions([]);
      setNotifications([]);
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      pushToast('Signed Out', 'Securely signed out. Next login requires password + email OTP.');
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const convertFromUSD = (usd: number, target: CurrencyCode = currency) => {
    return usd * CURRENCY_RATES_FROM_USD[target];
  };

  const convertToUSD = (amount: number, fromCurrency: CurrencyCode) => {
    return amount / CURRENCY_RATES_FROM_USD[fromCurrency];
  };

  const formatNativeMoney = (amount: number, code: CurrencyCode) => {
    const sym = CURRENCY_SYMBOLS[code];
    return `${sym}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatMoney = (usd: number, targetCurrency: CurrencyCode = currency) => {
    const val = convertFromUSD(usd, targetCurrency);
    return formatNativeMoney(val, targetCurrency);
  };

  const getProductPriceUSD = (product: Product): number => {
    if (product.category === 'Diamond' && product.fixedPriceUSD) {
      return product.fixedPriceUSD;
    }
    const spot = spotPricesUSD[product.category as keyof SpotPricesUSD] || spotPricesUSD.Gold;
    return Number((spot * product.weightOz * (1 + product.premiumPct / 100)).toFixed(2));
  };

  const totalPortfolioUSD = useMemo(() => {
    const cashVal = Number(client.cash_usd || 0);
    const holdingsVal = Number(
      (
        Number(client.gold_kg || 0) * spotPriceMap.Gold.kg +
        Number(client.silver_kg || 0) * spotPriceMap.Silver.kg +
        Number(client.diamond_value_usd || 0)
      ).toFixed(2)
    );
    if (isDemoMode) {
      return Number((cashVal + holdingsVal).toFixed(2));
    }
    return Math.max(cashVal, holdingsVal);
  }, [isDemoMode, client, spotPriceMap]);

  // Derive itemized holdings + unique quantity-matched vault verification photography per client
  const holdings: VaultHoldingItem[] = useMemo(() => {
    if (isDemoMode) {
      return DEMO_HOLDINGS.map((h) => {
        const isGold = h.item_name.toLowerCase().includes('gold');
        const isSilver = h.item_name.toLowerCase().includes('silver');
        const cat: 'Gold' | 'Silver' | 'Diamond' = isGold ? 'Gold' : isSilver ? 'Silver' : 'Diamond';
        const qty = isGold
          ? h.id === 'hld-001'
            ? 2.0
            : 0.3
          : isSilver
          ? Number(client.silver_kg || 15.55)
          : Number(client.diamond_carats || 1.52);
        const dynamicPhoto = generateVaultVerificationPhoto({
          clientId: client.id || DEMO_CLIENT.id,
          vaultId: client.vault_id || DEMO_CLIENT.vault_id,
          clientName: client.full_name || DEMO_CLIENT.full_name,
          category: cat,
          quantityValue: qty,
          diamondValueUSD: h.usd_value,
          serialNumber: h.serial_number,
          vaultBay: h.vault_bay,
        });
        return {
          ...h,
          photo_url: dynamicPhoto || h.photo_url,
        };
      });
    }

    const list: VaultHoldingItem[] = [];
    const suffix = (client.vault_id || client.id || 'SG001').replace(/[^A-Z0-9]/gi, '').slice(-5).toUpperCase();
    const goldKg = Number(client.gold_kg || 0);
    const silverKg = Number(client.silver_kg || 0);
    const diamondCt = Number(client.diamond_carats || 0);
    const diamondVal = Number(client.diamond_value_usd || 0);

    if (goldKg > 0) {
      const serial = `BS-AU-${suffix}`;
      const bay = `SG-VAULT-BAY04 · Locker ${suffix}`;
      const photo = generateVaultVerificationPhoto({
        clientId: client.id,
        vaultId: client.vault_id,
        clientName: client.full_name,
        category: 'Gold',
        quantityValue: goldKg,
        serialNumber: serial,
        vaultBay: bay,
      });
      list.push({
        id: 'alloc-gold',
        item_name: `Allocated 999.9 Fine Gold Bullion`,
        weight_or_carats: `${goldKg.toFixed(3)} kg`,
        purity_or_grade: '999.9 Fine Gold (LBMA)',
        serial_number: serial,
        vault_bay: bay,
        photo_url: photo || IMAGE_PATHS.vaultVerification,
        usd_value: Number((goldKg * spotPriceMap.Gold.kg).toFixed(2)),
      });
    }
    if (silverKg > 0) {
      const serial = `BS-AG-${suffix}`;
      const bay = `SG-VAULT-SEC2 · Rack ${suffix}`;
      const photo = generateVaultVerificationPhoto({
        clientId: client.id,
        vaultId: client.vault_id,
        clientName: client.full_name,
        category: 'Silver',
        quantityValue: silverKg,
        serialNumber: serial,
        vaultBay: bay,
      });
      list.push({
        id: 'alloc-silver',
        item_name: `Allocated 999.0 Fine Silver Cast Bars`,
        weight_or_carats: `${silverKg.toFixed(3)} kg`,
        purity_or_grade: '999.0 Fine Silver (LBMA)',
        serial_number: serial,
        vault_bay: bay,
        photo_url: photo || IMAGE_PATHS.silverBar,
        usd_value: Number((silverKg * spotPriceMap.Silver.kg).toFixed(2)),
      });
    }
    if (diamondCt > 0 || diamondVal > 0) {
      const serial = `GIA-${suffix}884`;
      const bay = `SG-VAULT-BAY04 · Locker ${suffix}`;
      const photo = generateVaultVerificationPhoto({
        clientId: client.id,
        vaultId: client.vault_id,
        clientName: client.full_name,
        category: 'Diamond',
        quantityValue: diamondCt > 0 ? diamondCt : 1.0,
        diamondValueUSD: diamondVal,
        serialNumber: serial,
        vaultBay: bay,
      });
      list.push({
        id: 'alloc-diamond',
        item_name: `GIA-Certified Investment Diamond Parcel`,
        weight_or_carats: `${diamondCt.toFixed(2)} ct`,
        purity_or_grade: 'GIA Certified · 3x Excellent',
        serial_number: serial,
        vault_bay: bay,
        photo_url: photo || IMAGE_PATHS.diamond,
        usd_value: diamondVal,
      });
    }
    return list;
  }, [isDemoMode, client, spotPriceMap]);

  const certificate: VaultCertificateSummary | null = useMemo(() => {
    if (isDemoMode) return DEMO_CERTIFICATE;
    if (!isLoggedIn || totalPortfolioUSD <= 0) return null;
    return {
      certificate_no: `CERT-${client.vault_id || 'BS-SG'}`,
      insured_value_usd: totalPortfolioUSD,
      auditor_name: 'Bureau Veritas Singapore',
      audit_status: 'Verified',
      issued_at: client.created_at || new Date().toISOString(),
    };
  }, [isDemoMode, isLoggedIn, totalPortfolioUSD, client]);

  const addToCart = (
    product: Product,
    quantity = 1,
    fulfillment: CartItem['fulfillment'] = 'Vault Storage (Singapore)'
  ) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, fulfillment }];
    });
    pushToast('Added to Cart', `${quantity}× ${product.name}`);
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const checkoutCart = async () => {
    if (cart.length === 0) return;
    if (!isLoggedIn) {
      setCartOpen(false);
      openAuthModal('signin');
      pushToast('Sign In Required', 'Please sign in or create an account to submit your order.');
      return;
    }

    const totalUSD = Number(
      cart.reduce((sum, item) => sum + getProductPriceUSD(item.product) * item.quantity, 0).toFixed(2)
    );
    const summary = cart.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');

    if (!isDemoMode) {
      let nextGold = Number(client.gold_kg || 0);
      let nextSilver = Number(client.silver_kg || 0);
      let nextDiaCt = Number(client.diamond_carats || 0);
      let nextDiaVal = Number(client.diamond_value_usd || 0);

      cart.forEach((item) => {
        if (item.product.category === 'Gold') {
          nextGold += (item.product.weightOz * item.quantity) / TROY_OZ_PER_KG;
        } else if (item.product.category === 'Silver') {
          nextSilver += (item.product.weightOz * item.quantity) / TROY_OZ_PER_KG;
        } else if (item.product.category === 'Diamond') {
          nextDiaCt += (item.product.carat || 1) * item.quantity;
          nextDiaVal += getProductPriceUSD(item.product) * item.quantity;
        }
      });

      const { data: updated, error } = await supabase
        .from('clients')
        .update({
          gold_kg: Number(nextGold.toFixed(4)),
          silver_kg: Number(nextSilver.toFixed(4)),
          diamond_carats: Number(nextDiaCt.toFixed(2)),
          diamond_value_usd: Number(nextDiaVal.toFixed(2)),
        })
        .eq('id', client.id)
        .select('*')
        .limit(1);

      if (error) {
        pushToast('Order Error', error.message);
        return;
      }
      if (updated && updated[0]) setClient(updated[0] as ClientRow);
    }

    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        tx_type: `Order: ${summary}`,
        amount_usd: totalUSD,
        status: 'Completed',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setCart([]);
    setCartOpen(false);
    setView('account');
    pushToast('Order Executed', 'Updated your holdings in Supabase clients.');
  };

  const executeFunding = async (
    action: 'Deposit' | 'Withdraw',
    currencyCode: CurrencyCode,
    amount: number,
    method: string
  ) => {
    if (!isLoggedIn) return { ok: false, error: 'Please sign in first.' };
    const amountUSD = Number(convertToUSD(amount, currencyCode).toFixed(2));
    const curCash = Number(client.cash_usd || 0);
    if (action === 'Withdraw' && amountUSD > curCash) {
      return {
        ok: false,
        error: `Withdrawal exceeds available cash balance (${formatMoney(curCash)}).`,
      };
    }

    const nextCash =
      action === 'Deposit'
        ? Number((curCash + amountUSD).toFixed(2))
        : Number((curCash - amountUSD).toFixed(2));

    if (isDemoMode) {
      setClient((prev) => ({ ...prev, cash_usd: nextCash }));
    } else {
      const { data, error } = await supabase
        .from('clients')
        .update({ cash_usd: nextCash })
        .eq('id', client.id)
        .select('*')
        .limit(1);
      if (error) return { ok: false, error: error.message };
      if (data && data[0]) setClient(data[0] as ClientRow);
    }

    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        tx_type: `${action} (${currencyCode} · ${method})`,
        amount_usd: amountUSD,
        status: 'Completed',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    pushLocalNotification(
      `${action} Processed`,
      `${formatMoney(amountUSD)} via ${method}. Updated cash balance: ${formatMoney(nextCash)}.`,
      'Cash'
    );
    pushToast(`${action} Completed`, `Cash balance updated to ${formatMoney(nextCash)}.`);
    return { ok: true };
  };

  const executeSpotTrade = async (
    side: 'Buy' | 'Sell',
    productId: string,
    quantity: number,
    _payCurrency: CurrencyCode
  ) => {
    if (!isLoggedIn) return { ok: false, error: 'Please sign in first.' };
    const product = CATALOG_PRODUCTS.find((p) => p.id === productId);
    if (!product || quantity <= 0) return { ok: false, error: 'Invalid product or quantity.' };

    const unitUSD = getProductPriceUSD(product);
    const totalUSD = Number((unitUSD * quantity).toFixed(2));

    if (side === 'Buy' && totalUSD > Number(client.cash_usd || 0)) {
      return {
        ok: false,
        error: `Insufficient cash balance (${formatMoney(client.cash_usd)} available).`,
      };
    }

    const kgDelta =
      product.weightOz > 0 ? Number(((product.weightOz * quantity) / TROY_OZ_PER_KG).toFixed(4)) : 0;

    if (side === 'Sell') {
      if (product.category === 'Gold' && kgDelta > Number(client.gold_kg || 0)) {
        return { ok: false, error: `Insufficient Gold in vault (${Number(client.gold_kg).toFixed(2)} kg).` };
      }
      if (product.category === 'Silver' && kgDelta > Number(client.silver_kg || 0)) {
        return { ok: false, error: `Insufficient Silver in vault (${Number(client.silver_kg).toFixed(2)} kg).` };
      }
      if (product.category === 'Diamond' && (product.carat || 0) * quantity > Number(client.diamond_carats || 0)) {
        return { ok: false, error: 'Insufficient Diamond carats in vault.' };
      }
    }

    const nextCash =
      side === 'Buy'
        ? Number((Number(client.cash_usd) - totalUSD).toFixed(2))
        : Number((Number(client.cash_usd) + totalUSD * 0.992).toFixed(2));
    const nextGoldKg =
      product.category === 'Gold'
        ? Math.max(0, Number((Number(client.gold_kg) + (side === 'Buy' ? kgDelta : -kgDelta)).toFixed(4)))
        : Number(client.gold_kg);
    const nextSilverKg =
      product.category === 'Silver'
        ? Math.max(
            0,
            Number((Number(client.silver_kg) + (side === 'Buy' ? kgDelta : -kgDelta)).toFixed(4))
          )
        : Number(client.silver_kg);
    const nextDiaCt =
      product.category === 'Diamond'
        ? Math.max(
            0,
            Number(
              (
                Number(client.diamond_carats) +
                (side === 'Buy' ? (product.carat || 0) * quantity : -(product.carat || 0) * quantity)
              ).toFixed(2)
            )
          )
        : Number(client.diamond_carats);
    const nextDiaVal =
      product.category === 'Diamond'
        ? Math.max(
            0,
            Number((Number(client.diamond_value_usd) + (side === 'Buy' ? totalUSD : -totalUSD)).toFixed(2))
          )
        : Number(client.diamond_value_usd);

    if (isDemoMode) {
      setClient((prev) => ({
        ...prev,
        cash_usd: nextCash,
        gold_kg: nextGoldKg,
        silver_kg: nextSilverKg,
        diamond_carats: nextDiaCt,
        diamond_value_usd: nextDiaVal,
      }));
    } else {
      const { data, error } = await supabase
        .from('clients')
        .update({
          cash_usd: nextCash,
          gold_kg: nextGoldKg,
          silver_kg: nextSilverKg,
          diamond_carats: nextDiaCt,
          diamond_value_usd: nextDiaVal,
        })
        .eq('id', client.id)
        .select('*')
        .limit(1);
      if (error) return { ok: false, error: error.message };
      if (data && data[0]) setClient(data[0] as ClientRow);
    }

    const txLabel = `${side} ${quantity}x ${product.name}`;
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        tx_type: txLabel,
        amount_usd: totalUSD,
        status: 'Completed',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    pushLocalNotification(`Spot ${side} Executed`, `${txLabel} (${formatMoney(totalUSD)})`, 'Portfolio');
    pushToast(`Spot ${side} Executed`, txLabel);
    return { ok: true };
  };

  // ============================================================================
  // TRANSACTION 6-DIGIT EMAIL OTP & `vault_transactions` PERSISTENCE
  // ============================================================================
  const getCurrentAuthEmail = async (): Promise<string> => {
    const { data } = await supabase.auth.getUser();
    return (data.user?.email || client.email || '').trim().toLowerCase();
  };

  const sendTransactionOtp = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isLoggedIn) {
      return { ok: false, error: 'Please sign in to verify transactions.' };
    }
    if (isDemoMode) {
      return {
        ok: false,
        error: 'Live 6-digit Email OTP verification requires signing in with a real registered account.',
      };
    }
    const targetEmail = await getCurrentAuthEmail();
    if (!targetEmail) {
      return { ok: false, error: 'No verified account email found for OTP delivery.' };
    }
    const { device, location, loginTime } = await collectLoginSessionMetadata();
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false,
        data: {
          last_device: device,
          last_location: location,
          last_login_time: loginTime,
        },
      },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const applyClientLedgerDelta = async (
    targetClientId: string,
    delta: {
      cash_usd: number;
      gold_kg: number;
      silver_kg: number;
      diamond_carats: number;
      diamond_value_usd: number;
    },
    direction: 'refund' | 'deduct'
  ): Promise<{ ok: boolean; error?: string; updatedClient?: ClientRow }> => {
    if (!targetClientId) return { ok: false, error: 'Missing client ID for balance adjustment.' };
    const { data: rows, error: fetchErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', targetClientId)
      .limit(1);

    if (fetchErr || !rows?.[0]) {
      return {
        ok: false,
        error: fetchErr?.message || 'Unable to locate client balance record in Supabase.',
      };
    }

    const cur = rows[0] as ClientRow;
    const sign = direction === 'refund' ? 1 : -1;

    const nextBalances = {
      cash_usd: Math.max(0, Number(((Number(cur.cash_usd) || 0) + sign * (delta.cash_usd || 0)).toFixed(2))),
      gold_kg: Math.max(0, Number(((Number(cur.gold_kg) || 0) + sign * (delta.gold_kg || 0)).toFixed(4))),
      silver_kg: Math.max(0, Number(((Number(cur.silver_kg) || 0) + sign * (delta.silver_kg || 0)).toFixed(4))),
      diamond_carats: Math.max(
        0,
        Number(((Number(cur.diamond_carats) || 0) + sign * (delta.diamond_carats || 0)).toFixed(2))
      ),
      diamond_value_usd: Math.max(
        0,
        Number(((Number(cur.diamond_value_usd) || 0) + sign * (delta.diamond_value_usd || 0)).toFixed(2))
      ),
    };

    const { data: updatedRows, error: updErr } = await supabase
      .from('clients')
      .update(nextBalances)
      .eq('id', targetClientId)
      .select('*')
      .limit(1);

    if (updErr) {
      return { ok: false, error: updErr.message };
    }

    const updatedClient: ClientRow = updatedRows?.[0]
      ? ({
          ...(updatedRows[0] as ClientRow),
          uploaded_media: normalizeUploadedMedia((updatedRows[0] as ClientRow).uploaded_media),
        } as ClientRow)
      : { ...cur, ...nextBalances };

    setAdminClients((prev) =>
      prev.map((row) => (row.id === targetClientId ? updatedClient : row))
    );
    if (isLoggedIn && !isDemoMode && client.id === targetClientId) {
      setClient(updatedClient);
    }
    return { ok: true, updatedClient };
  };

  const extractLedgerDeduction = (details?: Record<string, string> | null) => {
    const d = details || {};
    const active = d._ledger_deducted === 'true';
    const refunded = d._ledger_refunded === 'true';
    return {
      active,
      refunded,
      delta: {
        cash_usd: Math.max(0, Number(d._deducted_cash_usd || 0)),
        gold_kg: Math.max(0, Number(d._deducted_gold_kg || 0)),
        silver_kg: Math.max(0, Number(d._deducted_silver_kg || 0)),
        diamond_carats: Math.max(0, Number(d._deducted_diamond_carats || 0)),
        diamond_value_usd: Math.max(0, Number(d._deducted_diamond_value_usd || 0)),
      },
    };
  };

  const verifyAndSubmitTransaction = async (
    otpCode: string,
    draft: PendingVaultTransactionDraft
  ): Promise<{ ok: boolean; error?: string; transaction?: TransactionLogItem }> => {
    if (!isLoggedIn || isDemoMode) {
      return { ok: false, error: 'Please sign in with a live account before verifying transactions.' };
    }
    const cleanToken = otpCode.replace(/\s+/g, '');
    if (cleanToken.length !== 6) {
      return { ok: false, error: 'Please enter the 6-digit one-time passcode from your email.' };
    }

    const targetEmail = await getCurrentAuthEmail();
    if (!targetEmail) {
      return { ok: false, error: 'Unable to determine account email for OTP verification.' };
    }

    authFlowPendingRef.current = true;
    try {
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanToken,
        type: 'email',
      });
      if (otpErr) {
        return { ok: false, error: otpErr.message };
      }

      // Compute & apply immediate balance deductions for Cash Withdrawal & Physical Metal Release
      let ledgerAccountDetails: Record<string, string> = { ...(draft.account_details || {}) };
      let effectiveAmountUsd = Number(draft.amount_usd) || 0;
      let rollbackBalances: {
        cash_usd: number;
        gold_kg: number;
        silver_kg: number;
        diamond_carats: number;
        diamond_value_usd: number;
      } | null = null;
      let latestUpdatedClient: ClientRow | null = null;

      if (
        draft.tx_type === 'Cash Withdrawal' ||
        draft.tx_type === 'Physical Metal Release'
      ) {
        const { data: freshRows, error: freshErr } = await supabase
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .limit(1);

        if (freshErr || !freshRows?.[0]) {
          return {
            ok: false,
            error: freshErr?.message || 'Unable to verify current account balance in database.',
          };
        }

        const freshClient = freshRows[0] as ClientRow;
        const curCash = Number(freshClient.cash_usd || 0);
        const curGold = Number(freshClient.gold_kg || 0);
        const curSilver = Number(freshClient.silver_kg || 0);
        const curDiaCt = Number(freshClient.diamond_carats || 0);
        const curDiaVal = Number(freshClient.diamond_value_usd || 0);

        const goldSpotKg = spotPriceMap.Gold.kg > 0 ? spotPriceMap.Gold.kg : 86871.3;
        const silverSpotKg = spotPriceMap.Silver.kg > 0 ? spotPriceMap.Silver.kg : 1077.05;

        let deductedCash = 0;
        let deductedGoldKg = 0;
        let deductedSilverKg = 0;
        let deductedDiaCt = 0;
        let deductedDiaVal = 0;

        if (draft.tx_type === 'Cash Withdrawal') {
          const withdrawUSD = Number((Number(draft.amount_usd) || 0).toFixed(2));
          if (withdrawUSD <= 0) {
            return { ok: false, error: 'Withdrawal amount must be greater than zero.' };
          }
          if (withdrawUSD > curCash + 0.01) {
            return {
              ok: false,
              error: `Insufficient withdrawable cash balance (${formatMoney(curCash)} available).`,
            };
          }

          deductedCash = Math.min(curCash, withdrawUSD);

          // Deduct standalone cash buffer first (if any), then proportionally reduce backing metals at live spot prices
          const holdingsValUSD = Number(
            (curGold * goldSpotKg + curSilver * silverSpotKg + curDiaVal).toFixed(2)
          );
          const standaloneCashBuffer = Math.max(
            0,
            Number((curCash - holdingsValUSD).toFixed(2))
          );
          let metalBackedRemainingUSD = Math.max(
            0,
            Number((deductedCash - standaloneCashBuffer).toFixed(2))
          );

          if (metalBackedRemainingUSD > 0.01 && curGold > 0) {
            const maxGoldUSD = curGold * goldSpotKg;
            const goldDeductUSD = Math.min(metalBackedRemainingUSD, maxGoldUSD);
            deductedGoldKg = Math.min(
              curGold,
              Number((goldDeductUSD / goldSpotKg).toFixed(4))
            );
            metalBackedRemainingUSD = Math.max(
              0,
              Number((metalBackedRemainingUSD - goldDeductUSD).toFixed(2))
            );
          }

          if (metalBackedRemainingUSD > 0.01 && curSilver > 0) {
            const maxSilverUSD = curSilver * silverSpotKg;
            const silverDeductUSD = Math.min(metalBackedRemainingUSD, maxSilverUSD);
            deductedSilverKg = Math.min(
              curSilver,
              Number((silverDeductUSD / silverSpotKg).toFixed(4))
            );
            metalBackedRemainingUSD = Math.max(
              0,
              Number((metalBackedRemainingUSD - silverDeductUSD).toFixed(2))
            );
          }

          if (metalBackedRemainingUSD > 0.01 && curDiaVal > 0) {
            const diaDeductUSD = Math.min(metalBackedRemainingUSD, curDiaVal);
            deductedDiaVal = Number(diaDeductUSD.toFixed(2));
            if (curDiaCt > 0) {
              deductedDiaCt = Math.min(
                curDiaCt,
                Number(((diaDeductUSD / curDiaVal) * curDiaCt).toFixed(2))
              );
            }
          }

          effectiveAmountUsd = deductedCash;
        } else {
          // Physical Metal Release
          const metalType = String(draft.account_details?.metal_type || '').toLowerCase();
          const rawQty =
            Number(draft.account_details?.release_qty_num) ||
            Number(String(draft.account_details?.release_quantity || '').replace(/[^\d.]/g, '')) ||
            0;

          if (rawQty <= 0) {
            return { ok: false, error: 'Physical release quantity must be greater than zero.' };
          }

          let releaseMarketUSD = 0;

          if (metalType.includes('gold')) {
            if (rawQty > curGold + 0.0001) {
              return {
                ok: false,
                error: `Insufficient Gold in vault (${curGold.toFixed(3)} kg available).`,
              };
            }
            deductedGoldKg = Math.min(curGold, Number(rawQty.toFixed(4)));
            releaseMarketUSD = Number((deductedGoldKg * goldSpotKg).toFixed(2));
          } else if (metalType.includes('silver')) {
            if (rawQty > curSilver + 0.0001) {
              return {
                ok: false,
                error: `Insufficient Silver in vault (${curSilver.toFixed(3)} kg available).`,
              };
            }
            deductedSilverKg = Math.min(curSilver, Number(rawQty.toFixed(4)));
            releaseMarketUSD = Number((deductedSilverKg * silverSpotKg).toFixed(2));
          } else {
            if (rawQty > curDiaCt + 0.001) {
              return {
                ok: false,
                error: `Insufficient GIA Diamonds in vault (${curDiaCt.toFixed(2)} ct available).`,
              };
            }
            deductedDiaCt = Math.min(curDiaCt, Number(rawQty.toFixed(2)));
            deductedDiaVal =
              curDiaCt > 0
                ? Math.min(curDiaVal, Number(((deductedDiaCt / curDiaCt) * curDiaVal).toFixed(2)))
                : Number((Number(draft.amount_usd) || 0).toFixed(2));
            releaseMarketUSD =
              deductedDiaVal > 0 ? deductedDiaVal : Number((Number(draft.amount_usd) || 0).toFixed(2));
          }

          deductedCash = Math.min(curCash, releaseMarketUSD);
          effectiveAmountUsd = releaseMarketUSD;
        }

        const nextClientBalances = {
          cash_usd: Math.max(0, Number((curCash - deductedCash).toFixed(2))),
          gold_kg: Math.max(0, Number((curGold - deductedGoldKg).toFixed(4))),
          silver_kg: Math.max(0, Number((curSilver - deductedSilverKg).toFixed(4))),
          diamond_carats: Math.max(0, Number((curDiaCt - deductedDiaCt).toFixed(2))),
          diamond_value_usd: Math.max(0, Number((curDiaVal - deductedDiaVal).toFixed(2))),
        };

        rollbackBalances = {
          cash_usd: curCash,
          gold_kg: curGold,
          silver_kg: curSilver,
          diamond_carats: curDiaCt,
          diamond_value_usd: curDiaVal,
        };

        const { data: deductedClientRows, error: deductErr } = await supabase
          .from('clients')
          .update(nextClientBalances)
          .eq('id', client.id)
          .select('*')
          .limit(1);

        if (deductErr) {
          return {
            ok: false,
            error: `Failed to reserve client vault balances (${deductErr.message}).`,
          };
        }

        latestUpdatedClient = deductedClientRows?.[0]
          ? ({
              ...(deductedClientRows[0] as ClientRow),
              uploaded_media: normalizeUploadedMedia((deductedClientRows[0] as ClientRow).uploaded_media),
            } as ClientRow)
          : { ...freshClient, ...nextClientBalances };

        ledgerAccountDetails = {
          ...ledgerAccountDetails,
          _ledger_deducted: 'true',
          _ledger_refunded: 'false',
          _deducted_cash_usd: String(deductedCash),
          _deducted_gold_kg: String(deductedGoldKg),
          _deducted_silver_kg: String(deductedSilverKg),
          _deducted_diamond_carats: String(deductedDiaCt),
          _deducted_diamond_value_usd: String(deductedDiaVal),
        };
      }

      const txId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const rowPayload = {
        id: txId,
        client_id: client.id,
        client_name: client.full_name || targetEmail,
        client_email: client.email || targetEmail,
        vault_id: client.vault_id || '',
        tx_type: draft.tx_type,
        asset_summary: draft.asset_summary,
        amount_usd: effectiveAmountUsd,
        currency: draft.currency || 'USD',
        settlement_rail: draft.settlement_rail,
        account_details: ledgerAccountDetails,
        status: 'Pending' as const,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('vault_transactions')
        .insert(rowPayload)
        .select('*')
        .limit(1);

      if (insertErr) {
        if (rollbackBalances) {
          await supabase.from('clients').update(rollbackBalances).eq('id', client.id);
        }
        return {
          ok: false,
          error: `OTP verified, but saving to vault_transactions failed (${insertErr.message}). Please ensure the "vault_transactions" table and policies are created in Supabase.`,
        };
      }

      if (latestUpdatedClient) {
        setClient(latestUpdatedClient);
        setAdminClients((prev) =>
          prev.map((row) => (row.id === client.id ? latestUpdatedClient! : row))
        );
      }

      const savedRow = inserted?.[0]
        ? normalizeTransactionRow(inserted[0] as Record<string, unknown>)
        : normalizeTransactionRow(rowPayload as unknown as Record<string, unknown>);

      // Optional confirmation copy to BullionStar Treasury (info@bullionstar.in.net) for physical appointments
      if (draft.sendEmailToTreasury) {
        try {
          const detailLines = Object.entries(draft.account_details || {})
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
          await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: '5375b8ac-0f4d-48a1-ab67-4db45eda5f3c',
              subject: `Physical Bullion Vault Intake Request · ${client.vault_id || client.full_name}`,
              from_name: 'BullionStar Client Portal',
              name: client.full_name,
              email: client.email,
              vault_id: client.vault_id,
              message: `Physical Vault Deposit Appointment Submitted (OTP Verified · Status: Pending)\n\nReference: ${savedRow.id}\nAsset Summary: ${draft.asset_summary}\n${detailLines}`,
            }),
          });
        } catch {
          // Non-blocking: transaction is already saved in Supabase `vault_transactions`
        }
      }

      // Trigger A: Await automated transaction submission email immediately after DB insert
      const { data: authUserResult } = await supabase.auth.getUser();
      const currentUserEmail =
        authUserResult?.user?.email || targetEmail || client.email || savedRow.client_email || '';
      const txRecipientName = client.full_name || savedRow.client_name || currentUserEmail;
      await sendTransactionNotificationEmail({
        to: currentUserEmail,
        clientName: txRecipientName,
        txType: savedRow.tx_type || draft.tx_type,
        assetSummary: savedRow.asset_summary || draft.asset_summary,
        amountText: formatTransactionEmailAmountText({
          amountUsd: savedRow.amount_usd,
          currency: savedRow.currency,
          assetSummary: savedRow.asset_summary || draft.asset_summary,
          accountDetails: savedRow.account_details || draft.account_details,
        }),
        status: 'Pending',
        referenceId: savedRow.id,
        isStatusUpdate: false,
      });

      setTransactions((prev) => [savedRow, ...prev]);
      pushLocalNotification(
        `${draft.tx_type} Submitted (Pending)`,
        `${draft.asset_summary} via ${draft.settlement_rail} — Pending Admin & Treasury Review.`,
        'Portfolio'
      );
      pushToast(
        'Transaction Submitted',
        `${draft.tx_type} recorded with status: Pending Admin & Treasury Review.`
      );
      return { ok: true, transaction: savedRow };
    } finally {
      authFlowPendingRef.current = false;
    }
  };

  const cancelClientTransaction = async (
    txId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isLoggedIn || isDemoMode) {
      return { ok: false, error: 'Please sign in with a live account to cancel pending requests.' };
    }
    const existing = transactions.find((tx) => tx.id === txId);
    if (!existing) {
      return { ok: false, error: 'Transaction record not found.' };
    }
    if ((existing.status || 'Pending') !== 'Pending') {
      return { ok: false, error: 'Only Pending transactions can be cancelled.' };
    }

    const { data, error } = await supabase
      .from('vault_transactions')
      .update({ status: 'Cancelled' })
      .eq('id', txId)
      .eq('client_id', client.id)
      .eq('status', 'Pending')
      .select('*')
      .limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.[0]) {
      return { ok: false, error: 'Transaction is no longer Pending and cannot be cancelled.' };
    }

    let updatedRow = normalizeTransactionRow(data[0] as Record<string, unknown>);
    const ledger = extractLedgerDeduction(updatedRow.account_details);

    if (ledger.active && !ledger.refunded) {
      const refundRes = await applyClientLedgerDelta(client.id, ledger.delta, 'refund');
      if (refundRes.ok) {
        const nextDetails = {
          ...(updatedRow.account_details || {}),
          _ledger_refunded: 'true',
        };
        await supabase
          .from('vault_transactions')
          .update({ account_details: nextDetails })
          .eq('id', txId);
        updatedRow = { ...updatedRow, account_details: nextDetails };
      }
    }

    setTransactions((prev) =>
      prev.map((row) => (row.id === txId ? updatedRow : row))
    );
    setAdminTransactions((prev) =>
      prev.map((row) => (row.id === txId ? updatedRow : row))
    );

    pushLocalNotification(
      `${existing.tx_type} Cancelled`,
      ledger.active && !ledger.refunded
        ? `Request ${existing.id.slice(0, 8)} cancelled — deducted cash and metal balances were automatically refunded.`
        : `Request ${existing.id.slice(0, 8)} was cancelled by client.`,
      'Portfolio'
    );
    pushToast(
      'Request Cancelled',
      ledger.active && !ledger.refunded
        ? `${existing.tx_type} cancelled and balances automatically restored.`
        : `${existing.tx_type} status updated to Cancelled.`
    );
    return { ok: true };
  };

  // ============================================================================
  // HIDDEN STAFF & VAULT OPERATIONS (`clients` & `vault_transactions` tables)
  // ============================================================================
  const fetchAdminClients = async () => {
    setAdminLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { ok: false, error: error.message };
      }
      const normalized = ((data as ClientRow[]) || []).map((row) => ({
        ...row,
        uploaded_media: normalizeUploadedMedia(row.uploaded_media),
      }));
      setAdminClients(normalized);
      return { ok: true };
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminTransactions = async () => {
    setAdminTxLoading(true);
    setAdminTxError('');
    try {
      const { data, error } = await supabase
        .from('vault_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setAdminTxError(error.message);
        return { ok: false, error: error.message };
      }
      const normalized = Array.isArray(data)
        ? data.map((r) => normalizeTransactionRow(r as Record<string, unknown>))
        : [];
      setAdminTransactions(normalized);
      return { ok: true };
    } finally {
      setAdminTxLoading(false);
    }
  };

  const adminUpdateTransactionStatus = async (
    txId: string,
    nextStatus: VaultTransactionStatus
  ) => {
    // Query authoritative row first so ledger refund/re-deduction state is exact
    const { data: currentRows, error: fetchErr } = await supabase
      .from('vault_transactions')
      .select('*')
      .eq('id', txId)
      .limit(1);

    if (fetchErr) {
      return { ok: false, error: fetchErr.message };
    }

    const currentTx = currentRows?.[0]
      ? normalizeTransactionRow(currentRows[0] as Record<string, unknown>)
      : adminTransactions.find((row) => row.id === txId) || null;

    let nextDetails: Record<string, string> | undefined = currentTx?.account_details
      ? { ...currentTx.account_details }
      : undefined;

    if (currentTx && currentTx.client_id) {
      const ledger = extractLedgerDeduction(currentTx.account_details);
      if (nextStatus === 'Declined' && ledger.active && !ledger.refunded) {
        const refundRes = await applyClientLedgerDelta(
          currentTx.client_id,
          ledger.delta,
          'refund'
        );
        if (!refundRes.ok) {
          return {
            ok: false,
            error: `Failed to refund client balances before declining (${refundRes.error}).`,
          };
        }
        nextDetails = { ...(nextDetails || {}), _ledger_refunded: 'true' };
      } else if (
        (nextStatus === 'Pending' || nextStatus === 'Completed') &&
        currentTx.status === 'Declined' &&
        ledger.active &&
        ledger.refunded
      ) {
        const deductRes = await applyClientLedgerDelta(
          currentTx.client_id,
          ledger.delta,
          'deduct'
        );
        if (!deductRes.ok) {
          return {
            ok: false,
            error: `Failed to re-apply balance deduction (${deductRes.error}).`,
          };
        }
        nextDetails = { ...(nextDetails || {}), _ledger_refunded: 'false' };
      }
    }

    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (nextDetails) {
      updatePayload.account_details = nextDetails;
    }

    const { data, error } = await supabase
      .from('vault_transactions')
      .update(updatePayload)
      .eq('id', txId)
      .select('*')
      .limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }

    const updatedTx = data?.[0]
      ? normalizeTransactionRow(data[0] as Record<string, unknown>)
      : null;

    const existingTx = adminTransactions.find((row) => row.id === txId) || currentTx;
    const targetTx = updatedTx || (existingTx ? { ...existingTx, status: nextStatus } : null);

    setAdminTransactions((prev) =>
      prev.map((row) =>
        row.id === txId ? updatedTx || { ...row, status: nextStatus } : row
      )
    );

    if (isLoggedIn && !isDemoMode) {
      setTransactions((prev) =>
        prev.map((row) =>
          row.id === txId ? updatedTx || { ...row, status: nextStatus } : row
        )
      );
    }

    // Trigger B: Await automated status-update email when Admin updates status
    if (targetTx) {
      const matchedAdminClient = adminClients.find(
        (c) =>
          (targetTx.client_id && c.id === targetTx.client_id) ||
          (targetTx.vault_id && c.vault_id === targetTx.vault_id)
      );
      const adminRecipientEmail =
        (targetTx.client_email || '').trim() || (matchedAdminClient?.email || '').trim();
      const adminRecipientName =
        (targetTx.client_name || '').trim() ||
        (matchedAdminClient?.full_name || '').trim() ||
        adminRecipientEmail;
      const adminAmountText =
        Number(targetTx.amount_usd) > 0
          ? `$${Number(targetTx.amount_usd).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${targetTx.currency || 'USD'}`
          : formatTransactionEmailAmountText({
              amountUsd: targetTx.amount_usd,
              currency: targetTx.currency,
              assetSummary: targetTx.asset_summary,
              accountDetails: targetTx.account_details,
            });

      await sendTransactionNotificationEmail({
        to: adminRecipientEmail,
        clientName: adminRecipientName,
        txType: targetTx.tx_type,
        assetSummary: targetTx.asset_summary || targetTx.tx_type,
        amountText: adminAmountText,
        status: nextStatus,
        referenceId: targetTx.id,
        isStatusUpdate: true,
      });
    }

    pushToast(
      'Status Updated',
      nextStatus === 'Declined' && currentTx && extractLedgerDeduction(currentTx.account_details).active
        ? `Transaction Declined and reserved client balances automatically refunded.`
        : `Transaction status changed to ${nextStatus}.`
    );
    return { ok: true };
  };

  const getActiveAdminPasscode = (): string => {
    try {
      return localStorage.getItem(ADMIN_PASSCODE_KEY) || 'admin123';
    } catch {
      return 'admin123';
    }
  };

  const adminLogin = async (passcode: string) => {
    if (passcode.trim() !== getActiveAdminPasscode()) {
      return { ok: false, error: 'Invalid staff operations passcode.' };
    }
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setAdminAuthenticated(true);
    await Promise.all([fetchAdminClients(), fetchAdminTransactions()]);
    return { ok: true };
  };

  const adminUpdatePasscode = (newPasscode: string) => {
    const clean = newPasscode.trim();
    if (clean.length < 4) {
      return { ok: false, error: 'New passcode must be at least 4 characters.' };
    }
    try {
      localStorage.setItem(ADMIN_PASSCODE_KEY, clean);
    } catch {
      return { ok: false, error: 'Unable to persist passcode in browser storage.' };
    }
    pushToast('Passcode Updated', 'Your Staff & Vault Operations passcode has been updated.');
    return { ok: true };
  };

  const adminResetToDefaultPasscode = () => {
    try {
      localStorage.removeItem(ADMIN_PASSCODE_KEY);
    } catch {
      // ignore
    }
    pushToast('Passcode Reset', 'Restored default operations passcode.');
  };

  const adminLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setAdminAuthenticated(false);
    setAdminClients([]);
    setAdminTransactions([]);
  };

  const adminSaveClientRow = async (clientId: string, updates: AdminClientBalanceUpdate) => {
    const cleanPayload = {
      cash_usd: Math.max(0, Number(updates.cash_usd) || 0),
      gold_kg: Math.max(0, Number(updates.gold_kg) || 0),
      silver_kg: Math.max(0, Number(updates.silver_kg) || 0),
      diamond_carats: Math.max(0, Number(updates.diamond_carats) || 0),
      diamond_value_usd: Math.max(0, Number(updates.diamond_value_usd) || 0),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(cleanPayload)
      .eq('id', clientId)
      .select('*')
      .limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }

    const updatedRow = data?.[0]
      ? ({
          ...(data[0] as ClientRow),
          uploaded_media: normalizeUploadedMedia((data[0] as ClientRow).uploaded_media),
        } as ClientRow)
      : null;
    setAdminClients((prev) =>
      prev.map((row) => (row.id === clientId ? updatedRow || { ...row, ...cleanPayload } : row))
    );

    if (isLoggedIn && !isDemoMode && client.id === clientId) {
      setClient((prev) => updatedRow || { ...prev, ...cleanPayload });
    }

    pushToast('Saved!', `Updated balances in clients table.`);
    return { ok: true };
  };

  const adminUploadClientMedia = async (
    clientId: string,
    input: { title: string; category: UploadedMediaCategory; file: File }
  ) => {
    const targetClient = adminClients.find((c) => c.id === clientId);
    const currentMedia = normalizeUploadedMedia(targetClient?.uploaded_media);

    const safeFileName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${clientId}/${Date.now()}-${safeFileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('vault-files')
      .upload(filePath, input.file, {
        upsert: false,
        contentType: input.file.type || undefined,
      });

    if (uploadErr) {
      return {
        ok: false,
        error: `Storage upload failed (${uploadErr.message}). Ensure the "vault-files" bucket exists in Supabase Storage with public read & upload policies.`,
      };
    }

    const { data: urlData } = supabase.storage.from('vault-files').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const newItem: UploadedMediaItem = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title.trim() || input.file.name,
      category: input.category,
      file_url: publicUrl,
      file_type:
        input.file.type ||
        (input.file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      storage_path: filePath,
      file_name: input.file.name,
      uploaded_at: new Date().toISOString(),
    };

    const nextMedia = [newItem, ...currentMedia];

    const { data, error: dbErr } = await supabase
      .from('clients')
      .update({ uploaded_media: nextMedia })
      .eq('id', clientId)
      .select('*')
      .limit(1);

    if (dbErr) {
      return {
        ok: false,
        error: `File uploaded to storage, but updating clients.uploaded_media failed (${dbErr.message}). Ensure an "uploaded_media" jsonb column exists on the clients table.`,
      };
    }

    const updatedRow = data?.[0]
      ? ({
          ...(data[0] as ClientRow),
          uploaded_media: normalizeUploadedMedia((data[0] as ClientRow).uploaded_media),
        } as ClientRow)
      : null;

    setAdminClients((prev) =>
      prev.map((row) =>
        row.id === clientId ? updatedRow || { ...row, uploaded_media: nextMedia } : row
      )
    );

    if (isLoggedIn && !isDemoMode && client.id === clientId) {
      setClient((prev) => updatedRow || { ...prev, uploaded_media: nextMedia });
    }

    pushToast('Media Uploaded', `"${newItem.title}" saved to client vault.`);
    return { ok: true };
  };

  const adminDeleteClientMedia = async (clientId: string, item: UploadedMediaItem) => {
    const targetClient = adminClients.find((c) => c.id === clientId);
    const currentMedia = normalizeUploadedMedia(targetClient?.uploaded_media);
    const nextMedia = currentMedia.filter((m) => m.id !== item.id);

    // Best-effort storage cleanup
    let storagePath = item.storage_path || '';
    if (!storagePath && item.file_url.includes('/vault-files/')) {
      storagePath = decodeURIComponent(item.file_url.split('/vault-files/')[1].split('?')[0]);
    }
    if (storagePath) {
      await supabase.storage.from('vault-files').remove([storagePath]);
    }

    const { data, error: dbErr } = await supabase
      .from('clients')
      .update({ uploaded_media: nextMedia })
      .eq('id', clientId)
      .select('*')
      .limit(1);

    if (dbErr) {
      return { ok: false, error: dbErr.message };
    }

    const updatedRow = data?.[0]
      ? ({
          ...(data[0] as ClientRow),
          uploaded_media: normalizeUploadedMedia((data[0] as ClientRow).uploaded_media),
        } as ClientRow)
      : null;

    setAdminClients((prev) =>
      prev.map((row) =>
        row.id === clientId ? updatedRow || { ...row, uploaded_media: nextMedia } : row
      )
    );

    if (isLoggedIn && !isDemoMode && client.id === clientId) {
      setClient((prev) => updatedRow || { ...prev, uploaded_media: nextMedia });
    }

    pushToast('Item Removed', `Removed "${item.title}" from client media.`);
    return { ok: true };
  };

  useEffect(() => {
    if (adminAuthenticated && view === 'admin') {
      if (adminClients.length === 0) fetchAdminClients();
      if (adminTransactions.length === 0) fetchAdminTransactions();
    }
  }, [adminAuthenticated, view]);

  return (
    <BullionContext.Provider
      value={{
        view,
        setView,
        scrollToContact,
        openHiddenAdmin,
        exitHiddenAdmin,
        catalogFilter,
        setCatalogFilter,
        language,
        setLanguage,
        t,
        currency,
        setCurrency,
        stockLocation,
        setStockLocation,
        searchQuery,
        setSearchQuery,
        spotPricesUSD,
        spotPriceMap,
        spotChangesPct,
        liveTickerActive,
        setLiveTickerActive,
        products: CATALOG_PRODUCTS,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        checkoutCart,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isLoggedIn,
        isDemoMode,
        authLoading,
        refreshingClient,
        lastSignInAt,
        startSignupWithOtp,
        verifySignupOtp,
        resendSignupOtp,
        startLoginWithPassword,
        verifyLoginOtp,
        resendLoginOtp,
        requestPasswordResetOtp,
        completePasswordResetWithOtp,
        updateAccountPassword,
        requestAccountEmailChange,
        verifyAccountEmailChange,
        demoLogin,
        logout,
        refreshClientSession,
        client,
        holdings,
        certificate,
        transactions,
        transactionsLoading,
        refreshClientTransactions,
        notifications,
        markAllNotificationsRead,
        convertFromUSD,
        convertToUSD,
        formatMoney,
        formatNativeMoney,
        getProductPriceUSD,
        totalPortfolioUSD,
        sendTransactionOtp,
        verifyAndSubmitTransaction,
        cancelClientTransaction,
        executeFunding,
        executeSpotTrade,
        adminAuthenticated,
        adminClients,
        adminLoading,
        adminTransactions,
        adminTxLoading,
        adminTxError,
        adminLogin,
        adminLogout,
        adminUpdatePasscode,
        adminResetToDefaultPasscode,
        fetchAdminClients,
        fetchAdminTransactions,
        adminUpdateTransactionStatus,
        adminSaveClientRow,
        adminUploadClientMedia,
        adminDeleteClientMedia,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </BullionContext.Provider>
  );
};

export const useBullion = (): BullionContextType => {
  const ctx = useContext(BullionContext);
  if (!ctx) throw new Error('useBullion must be used inside BullionProvider');
  return ctx;
};
