import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useBullion } from '../context/BullionContext';

const COUNTRIES = [
  'Singapore',
  'United States',
  'United Kingdom',
  'Australia',
  'Switzerland',
  'Hong Kong',
  'Japan',
  'Malaysia',
  'Indonesia',
  'Germany',
  'Canada',
  'United Arab Emirates',
  'Other',
];

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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setInfoMsg('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full legal name.');
        return;
      }
      if (phone.trim().length < 6) {
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
        phone: phone.trim(),
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+65 9123 4567"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
