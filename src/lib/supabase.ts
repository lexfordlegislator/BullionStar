import { createClient } from '@supabase/supabase-js';

interface RuntimeEnvWindow {
  __BULLIONSTAR_ENV__?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };
}

const runtimeEnv =
  typeof window !== 'undefined'
    ? (window as unknown as RuntimeEnvWindow).__BULLIONSTAR_ENV__ || {}
    : {};

const SUPABASE_URL =
  runtimeEnv.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://mjkaifaiviuxmjvebugy.supabase.co';
const SUPABASE_ANON_KEY =
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_Urpnge4qTjLpwR5DdbvEWA_2OWp1l2t';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const TROY_OZ_PER_KG = 32.1507466;

export interface SpotPriceMap {
  Gold: { oz: number; kg: number };
  Silver: { oz: number; kg: number };
  Platinum: { oz: number; kg: number };
  Palladium: { oz: number; kg: number };
}
