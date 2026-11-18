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
  VaultCertificateSummary,
  VaultHoldingItem,
} from '../types/bullion';

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
  notifications: PortfolioNotification[];
  markAllNotificationsRead: () => void;

  // Helpers
  convertFromUSD: (usd: number, target?: CurrencyCode) => number;
  convertToUSD: (amount: number, fromCurrency: CurrencyCode) => number;
  formatMoney: (usd: number, targetCurrency?: CurrencyCode) => string;
  formatNativeMoney: (amount: number, code: CurrencyCode) => string;
  getProductPriceUSD: (product: Product) => number;
  totalPortfolioUSD: number;

  // Client Actions
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

  // Hidden Staff & Vault Operations (`clients` table)
  adminAuthenticated: boolean;
  adminClients: ClientRow[];
  adminLoading: boolean;
  adminLogin: (passcode: string) => Promise<{ ok: boolean; error?: string }>;
  adminLogout: () => void;
  adminUpdatePasscode: (newPasscode: string) => { ok: boolean; error?: string };
  adminResetToDefaultPasscode: () => void;
  fetchAdminClients: () => Promise<{ ok: boolean; error?: string }>;
  adminSaveClientRow: (
    clientId: string,
    updates: AdminClientBalanceUpdate
  ) => Promise<{ ok: boolean; error?: string }>;

  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const ADMIN_AUTH_KEY = 'bs_staff_ops_unlocked_v1';
const ADMIN_PASSCODE_KEY = 'bs_staff_ops_passcode_v1';
const PREFS_KEY = 'bs_prefs_v4';

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
  const [language, setLanguage] = useState<LanguageCode>(savedPrefs.language || 'EN');
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
  const [notifications, setNotifications] = useState<PortfolioNotification[]>([]);

  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  );
  const [adminClients, setAdminClients] = useState<ClientRow[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

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
      });
      setIsDemoMode(false);
      setIsLoggedIn(true);
    }

    return row;
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

  // Sign In Step 1 & 2: Verify password, immediately sign out, and dispatch mandatory 6-digit Email OTP
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

      // Step 2: Sign out immediately so no dashboard access is granted prior to Email OTP
      await supabase.auth.signOut();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
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
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: false },
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
    return Number(
      (
        Number(client.cash_usd || 0) +
        Number(client.gold_kg || 0) * spotPriceMap.Gold.kg +
        Number(client.silver_kg || 0) * spotPriceMap.Silver.kg +
        Number(client.diamond_value_usd || 0)
      ).toFixed(2)
    );
  }, [client, spotPriceMap]);

  // Derive itemized holdings view cleanly from the `clients` row balances (or demo holdings)
  const holdings: VaultHoldingItem[] = useMemo(() => {
    if (isDemoMode) return DEMO_HOLDINGS;
    const list: VaultHoldingItem[] = [];
    const suffix = (client.vault_id || 'SG001').slice(-4);
    if (Number(client.gold_kg) > 0) {
      list.push({
        id: 'alloc-gold',
        item_name: `Allocated 999.9 Fine Gold Bullion`,
        weight_or_carats: `${Number(client.gold_kg).toFixed(3)} kg`,
        purity_or_grade: '999.9 Fine Gold (LBMA)',
        serial_number: `BS-AU-${suffix}`,
        vault_bay: `SG-VAULT-BAY04 · Locker ${suffix}`,
        photo_url: IMAGE_PATHS.vaultVerification,
        usd_value: Number((Number(client.gold_kg) * spotPriceMap.Gold.kg).toFixed(2)),
      });
    }
    if (Number(client.silver_kg) > 0) {
      list.push({
        id: 'alloc-silver',
        item_name: `Allocated 999.0 Fine Silver Cast Bars`,
        weight_or_carats: `${Number(client.silver_kg).toFixed(3)} kg`,
        purity_or_grade: '999.0 Fine Silver (LBMA)',
        serial_number: `BS-AG-${suffix}`,
        vault_bay: `SG-VAULT-SEC2 · Rack ${suffix}`,
        photo_url: IMAGE_PATHS.silverBar,
        usd_value: Number((Number(client.silver_kg) * spotPriceMap.Silver.kg).toFixed(2)),
      });
    }
    if (Number(client.diamond_carats) > 0 || Number(client.diamond_value_usd) > 0) {
      list.push({
        id: 'alloc-diamond',
        item_name: `GIA-Certified Investment Diamond Parcel`,
        weight_or_carats: `${Number(client.diamond_carats).toFixed(2)} ct`,
        purity_or_grade: 'GIA Certified · 3x Excellent',
        serial_number: `GIA-${suffix}884`,
        vault_bay: `SG-VAULT-BAY04 · Locker ${suffix}`,
        photo_url: IMAGE_PATHS.diamond,
        usd_value: Number(client.diamond_value_usd || 0),
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
  // HIDDEN STAFF & VAULT OPERATIONS (`clients` table ONLY)
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
      setAdminClients((data as ClientRow[]) || []);
      return { ok: true };
    } finally {
      setAdminLoading(false);
    }
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
    await fetchAdminClients();
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

    const updatedRow = (data?.[0] as ClientRow) || null;
    setAdminClients((prev) =>
      prev.map((row) => (row.id === clientId ? updatedRow || { ...row, ...cleanPayload } : row))
    );

    if (isLoggedIn && !isDemoMode && client.id === clientId) {
      setClient((prev) => updatedRow || { ...prev, ...cleanPayload });
    }

    pushToast('Saved!', `Updated balances in clients table.`);
    return { ok: true };
  };

  useEffect(() => {
    if (adminAuthenticated && view === 'admin' && adminClients.length === 0) {
      fetchAdminClients();
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
        notifications,
        markAllNotificationsRead,
        convertFromUSD,
        convertToUSD,
        formatMoney,
        formatNativeMoney,
        getProductPriceUSD,
        totalPortfolioUSD,
        executeFunding,
        executeSpotTrade,
        adminAuthenticated,
        adminClients,
        adminLoading,
        adminLogin,
        adminLogout,
        adminUpdatePasscode,
        adminResetToDefaultPasscode,
        fetchAdminClients,
        adminSaveClientRow,
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
