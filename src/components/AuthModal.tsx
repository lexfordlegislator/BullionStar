import React, { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Lock, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useBullion } from '../context/BullionContext';

interface CountryDialInfo {
  name: string;
  iso: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

const COUNTRY_DIAL_LIST: CountryDialInfo[] = [
  { name: 'Singapore', iso: 'SG', dialCode: '+65', flag: '🇸🇬', placeholder: '9123 4567' },
  { name: 'United States', iso: 'US', dialCode: '+1', flag: '🇺🇸', placeholder: '555 234 5678' },
  { name: 'United Kingdom', iso: 'GB', dialCode: '+44', flag: '🇬🇧', placeholder: '7700 900123' },
  { name: 'Ghana', iso: 'GH', dialCode: '+233', flag: '🇬🇭', placeholder: '24 123 4567' },
  { name: 'Nigeria', iso: 'NG', dialCode: '+234', flag: '🇳🇬', placeholder: '803 123 4567' },
  { name: 'Australia', iso: 'AU', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { name: 'Canada', iso: 'CA', dialCode: '+1', flag: '🇨🇦', placeholder: '416 555 0198' },
  { name: 'Germany', iso: 'DE', dialCode: '+49', flag: '🇩🇪', placeholder: '151 2345 6789' },
  { name: 'France', iso: 'FR', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { name: 'United Arab Emirates', iso: 'AE', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
  { name: 'India', iso: 'IN', dialCode: '+91', flag: '🇮🇳', placeholder: '98123 45678' },
  { name: 'China', iso: 'CN', dialCode: '+86', flag: '🇨🇳', placeholder: '138 0013 8000' },
  { name: 'Japan', iso: 'JP', dialCode: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { name: 'South Africa', iso: 'ZA', dialCode: '+27', flag: '🇿🇦', placeholder: '82 123 4567' },
  { name: 'Switzerland', iso: 'CH', dialCode: '+41', flag: '🇨🇭', placeholder: '79 123 45 67' },
  { name: 'Hong Kong', iso: 'HK', dialCode: '+852', flag: '🇭🇰', placeholder: '9123 4567' },
  { name: 'Malaysia', iso: 'MY', dialCode: '+60', flag: '🇲🇾', placeholder: '12 345 6789' },
  { name: 'Indonesia', iso: 'ID', dialCode: '+62', flag: '🇮🇩', placeholder: '812 3456 7890' },
  { name: 'South Korea', iso: 'KR', dialCode: '+82', flag: '🇰🇷', placeholder: '10 1234 5678' },
  { name: 'New Zealand', iso: 'NZ', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567' },
  { name: 'Kenya', iso: 'KE', dialCode: '+254', flag: '🇰🇪', placeholder: '712 345678' },
  { name: 'Netherlands', iso: 'NL', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678' },
  { name: 'Ireland', iso: 'IE', dialCode: '+353', flag: '🇮🇪', placeholder: '85 123 4567' },
  { name: 'Brazil', iso: 'BR', dialCode: '+55', flag: '🇧🇷', placeholder: '11 91234 5678' },
  { name: 'Other', iso: 'INTL', dialCode: '+', flag: '🌐', placeholder: 'Enter with country code (e.g. 65 9123 4567)' },
];

const getCountryDialInfo = (countryName: string): CountryDialInfo =>
  COUNTRY_DIAL_LIST.find((item) => item.name === countryName) ?? COUNTRY_DIAL_LIST[0];

const formatCombinedPhone = (rawPhone: string, dialCode: string): string => {
  const trimmed = rawPhone.trim().replace(/\s+/g, ' ');
  if (dialCode === '+') {
    return trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/^\++/, '')}`;
  }
  const codeDigits = dialCode.replace(/\D/g, '');
  let local = trimmed;
  if (local.startsWith(dialCode)) {
    local = local.slice(dialCode.length).trim();
  } else if (local.startsWith(`+${codeDigits}`)) {
    local = local.slice(codeDigits.length + 1).trim();
  } else if (local.startsWith('00' + codeDigits)) {
    local = local.slice(codeDigits.length + 2).trim();
  }
  return `${dialCode} ${local}`.trim();
};

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    registerAccount,
    loginWithCredentials,
    demoLogin,
  } = useBullion();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Singapore');
  const [phoneCodeCountry, setPhoneCodeCountry] = useState('Singapore');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedDialInfo = getCountryDialInfo(phoneCodeCountry);

  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setInfoMsg('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    setPhoneCodeCountry(nextCountry);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    const formattedPhone = formatCombinedPhone(phone, selectedDialInfo.dialCode);

    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full legal name.');
        return;
      }
      const localDigits = phone.replace(/\D/g, '');
      const fullDigits = formattedPhone.replace(/\D/g, '');
      if (localDigits.length < 6 || fullDigits.length < 7) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);
    if (mode === 'signup') {
      const res = await registerAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: formattedPhone,
        country,
        password,
      });
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error || 'Registration failed.');
      } else if (res.needsConfirmation) {
        setInfoMsg(
          'Account registered! Please check your email inbox to confirm your address, then sign in.'
        );
      }
    } else {
      const res = await loginWithCredentials(email.trim(), password);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error || 'Sign in failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-md max-w-md w-full overflow-hidden shadow-2xl">
        <div className="bg-[#0D1F3C] px-6 py-4 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#F2D06B]">BullionStar Singapore Depository</p>
            <h2 className="font-serif text-xl font-bold">
              {mode === 'signup' ? 'Create Depository Account' : 'Sign In to Your Account'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Close authentication dialog"
            className="p-1.5 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              openAuthModal('signin');
              setError('');
            }}
            className={`py-2.5 text-xs font-bold border-b-2 transition-colors ${
              mode === 'signin'
                ? 'border-[#C59B27] text-[#0D1F3C] bg-white'
                : 'border-transparent text-slate-500 hover:text-[#0D1F3C]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              openAuthModal('signup');
              setError('');
            }}
            className={`py-2.5 text-xs font-bold border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-[#C59B27] text-[#0D1F3C] bg-white'
                : 'border-transparent text-slate-500 hover:text-[#0D1F3C]'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sophia Lim Hui Ling"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                >
                  {COUNTRY_DIAL_LIST.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name} {c.dialCode !== '+' ? `(${c.dialCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-stretch rounded border border-slate-300 focus-within:border-[#0D1F3C] bg-white overflow-hidden">
                  <div className="relative flex items-center gap-1.5 px-2.5 py-2 bg-[#F8FAFC] border-r border-slate-300 text-sm font-semibold text-[#0D1F3C] shrink-0 select-none hover:bg-slate-100 transition-colors">
                    <span aria-hidden="true">{selectedDialInfo.flag}</span>
                    <span className="font-mono text-xs">{selectedDialInfo.dialCode}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      aria-label="Country dialing code"
                      value={phoneCodeCountry}
                      onChange={(e) => setPhoneCodeCountry(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      {COUNTRY_DIAL_LIST.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={selectedDialInfo.placeholder}
                    className="w-full px-3 py-2 text-sm focus:outline-none bg-white"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
          >
            {mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Authenticating...'
                : mode === 'signup'
                ? 'Create Account & Open Vault'
                : 'Sign In to Vault'}
            </span>
          </button>

          {mode === 'signup' && (
            <p className="text-[11px] text-slate-500 text-center leading-snug">
              New accounts initialize with $0.00 cash and 0.00 kg bullion custody until funded or allocated.
            </p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Encrypted Session</span>
            </span>
            <button
              type="button"
              onClick={demoLogin}
              className="text-xs font-semibold text-[#0D1F3C] hover:text-[#B38818] underline underline-offset-2"
            >
              Quick Preview: Demo Client Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
