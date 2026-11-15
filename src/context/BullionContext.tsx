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

  // Auth & Client Portal (single `clients` table)
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  isLoggedIn: boolean;
  isDemoMode: boolean;
  authLoading: boolean;
  refreshingClient: boolean;
  registerAccount: (
    input: RegisterInput
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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
      if (data.session?.user) {
        const u = data.session.user;
        await loadClientRow(u.id, u.email, (u.user_metadata || {}) as Record<string, string>);
      }
      setAuthLoading(false);
    };
    boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setIsDemoMode(false);
        setClient(EMPTY_CLIENT);
        setTransactions([]);
        setNotifications([]);
      } else if (session?.user && event === 'SIGNED_IN') {
        const u = session.user;
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

  const registerAccount = async (input: RegisterInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    const vaultId = `BS-SG-${Math.floor(10000 + Math.random() * 89999)}`;

    // Check duplicate email in `clients`
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

    const userId = data.user?.id;
    if (!userId) {
      return { ok: false, error: 'Registration did not return a valid Auth user ID.' };
    }

    // Save one row into `clients` matching Auth user ID with all balances starting at 0
    const { error: insertErr } = await supabase.from('clients').upsert(
      {
        id: userId,
        full_name: input.fullName.trim(),
        email: cleanEmail,
        phone: input.phone.trim(),
        country: input.country,
        vault_id: vaultId,
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

    if (data.session) {
      await loadClientRow(userId, cleanEmail, {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        country: input.country,
        vault_id: vaultId,
      });
      pushLocalNotification(
        `Vault Account ${vaultId} Created`,
        'Initialized with $0.00 cash and 0.00 kg gold, silver, and diamonds.',
        'Portfolio'
      );
      setAuthModalOpen(false);
      setView('account');
      pushToast('Account Created', `Signed in as ${input.fullName.trim()} (${vaultId})`);
      return { ok: true };
    }

    return {
      ok: true,
      needsConfirmation: true,
    };
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: 'Unable to retrieve user session.' };
    }

    await loadClientRow(
      data.user.id,
      data.user.email,
      (data.user.user_metadata || {}) as Record<string, string>
    );
    setAuthModalOpen(false);
    setView('account');
    pushToast('Signed In', 'Loaded your vault balances from Supabase.');
    return { ok: true };
  };

  const demoLogin = () => {
    setClient(DEMO_CLIENT);
    setTransactions(DEMO_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setIsDemoMode(true);
    setIsLoggedIn(true);
    setAuthModalOpen(false);
    setView('account');
    pushToast('Demo Account Active', `Previewing ${DEMO_CLIENT.full_name} (${DEMO_CLIENT.vault_id})`);
  };

  const logout = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    setIsDemoMode(false);
    setClient(EMPTY_CLIENT);
    setTransactions([]);
    setNotifications([]);
    pushToast('Signed Out', 'Securely signed out of your vault account.');
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
        registerAccount,
        loginWithCredentials,
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
