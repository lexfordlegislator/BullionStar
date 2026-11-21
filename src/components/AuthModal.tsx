import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  KeyRound,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useBullion } from '../context/BullionContext';
import { BullionStarLogo } from './BullionStarLogo';

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

type AuthStep = 'form' | 'signup-otp' | 'signin-otp' | 'forgot-email' | 'forgot-verify';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    startSignupWithOtp,
    verifySignupOtp,
    resendSignupOtp,
    startLoginWithPassword,
    verifyLoginOtp,
    resendLoginOtp,
    requestPasswordResetOtp,
    completePasswordResetWithOtp,
    t,
  } = useBullion();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);
  const [step, setStep] = useState<AuthStep>('form');

  // Form credentials & profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Singapore');
  const [phoneCodeCountry, setPhoneCodeCountry] = useState('Singapore');
  const [password, setPassword] = useState('');

  // 6-digit OTP verification
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Forgot password recovery
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedDialInfo = getCountryDialInfo(phoneCodeCountry);

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode);
      setStep('form');
      setOtpCode('');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      setInfoMsg('');
    }
  }, [authModalMode, authModalOpen]);

  // 60-second cooldown countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!authModalOpen) return null;

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    setPhoneCodeCountry(nextCountry);
  };

  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (mode === 'signup') {
      const formattedPhone = formatCombinedPhone(phone, selectedDialInfo.dialCode);
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

      setSubmitting(true);
      const res = await startSignupWithOtp({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: formattedPhone,
        country,
        password,
      });
      setSubmitting(false);

      if (!res.ok) {
        setError(res.error || 'Registration failed.');
        return;
      }

      setOtpCode('');
      setResendCooldown(60);
      setInfoMsg(`A 6-digit security verification code has been sent to ${email.trim()}.`);
      setStep('signup-otp');
      return;
    }

    // Sign In Step 1 & 2: Verify password, sign out immediately, send 6-digit Email OTP
    if (password.length < 6) {
      setError('Please enter your account password.');
      return;
    }
    setSubmitting(true);
    const res = await startLoginWithPassword(email.trim(), password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Invalid email or password.');
      return;
    }

    setOtpCode('');
    setResendCooldown(60);
    setInfoMsg(`Password verified. Enter the 6-digit one-time passcode sent to ${email.trim()}.`);
    setStep('signin-otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanedCode = otpCode.replace(/\s+/g, '');
    if (cleanedCode.length !== 6) {
      setError('Please enter the 6-digit security code from your email.');
      return;
    }

    setSubmitting(true);
    if (step === 'signup-otp') {
      const formattedPhone = formatCombinedPhone(phone, selectedDialInfo.dialCode);
      const res = await verifySignupOtp(email.trim(), cleanedCode, {
        fullName: fullName.trim(),
        phone: formattedPhone,
        country,
      });
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error || 'Invalid or expired 6-digit verification code.');
      }
    } else {
      const res = await verifyLoginOtp(email.trim(), cleanedCode);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error || 'Invalid or expired 6-digit one-time passcode.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setInfoMsg('');
    setResending(true);

    const targetEmail = step === 'forgot-verify' ? resetEmail.trim() : email.trim();
    const res =
      step === 'signup-otp'
        ? await resendSignupOtp(targetEmail)
        : step === 'forgot-verify'
        ? await requestPasswordResetOtp(targetEmail)
        : await resendLoginOtp(targetEmail);

    setResending(false);
    if (!res.ok) {
      setError(res.error || 'Could not resend code. Please wait a moment and try again.');
      return;
    }
    setResendCooldown(60);
    setInfoMsg(`A fresh 6-digit code has been sent to ${targetEmail}.`);
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setError('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    const res = await requestPasswordResetOtp(resetEmail.trim());
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Could not send password reset code.');
      return;
    }

    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResendCooldown(60);
    setInfoMsg(`We sent a 6-digit password reset code to ${resetEmail.trim()}.`);
    setStep('forgot-verify');
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanedCode = resetCode.replace(/\s+/g, '');
    if (cleanedCode.length !== 6) {
      setError('Please enter the 6-digit reset code from your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    const res = await completePasswordResetWithOtp(resetEmail.trim(), cleanedCode, newPassword);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Failed to verify reset code or update password.');
      return;
    }

    setEmail(resetEmail.trim());
    setPassword('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setMode('signin');
    setStep('form');
    setInfoMsg(
      'Your password has been updated. Please sign in with your new password and verify via email OTP.'
    );
  };

  const headerTitle =
    step === 'signup-otp'
      ? t('auth.titleSignupOtp')
      : step === 'signin-otp'
      ? t('auth.titleSigninOtp')
      : step === 'forgot-email' || step === 'forgot-verify'
      ? t('auth.titleForgot')
      : mode === 'signup'
      ? t('auth.titleSignUp')
      : t('auth.titleSignIn');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-md w-[94vw] max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#0D1F3C] px-5 sm:px-6 py-4 text-white flex items-start justify-between gap-3 sticky top-0 z-10">
          <div className="space-y-2 min-w-0">
            <BullionStarLogo variant="dark" size="sm" />
            <h2 className="font-serif text-lg sm:text-xl font-bold leading-snug">{headerTitle}</h2>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Close authentication dialog"
            className="p-1.5 hover:bg-white/10 rounded shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher (only on primary Sign In / Create Account view) */}
        {step === 'form' && (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-[#F8FAFC]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                openAuthModal('signin');
                setError('');
                setInfoMsg('');
              }}
              className={`py-2.5 text-xs font-bold border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-[#C59B27] text-[#0D1F3C] bg-white'
                  : 'border-transparent text-slate-500 hover:text-[#0D1F3C]'
              }`}
            >
              {t('header.signIn')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                openAuthModal('signup');
                setError('');
                setInfoMsg('');
              }}
              className={`py-2.5 text-xs font-bold border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-[#C59B27] text-[#0D1F3C] bg-white'
                  : 'border-transparent text-slate-500 hover:text-[#0D1F3C]'
              }`}
            >
              {t('header.createAccount')}
            </button>
          </div>
        )}

        {/* STEP A: Primary Sign In / Create Account Form */}
        {step === 'form' && (
          <form onSubmit={handlePrimarySubmit} autoComplete="on" className="p-5 sm:p-6 space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-full-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.fullLegalName')}
                </label>
                <input
                  id="auth-full-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sophia Lim Hui Ling"
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="auth-country" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('auth.country')}
                  </label>
                  <select
                    id="auth-country"
                    name="country"
                    autoComplete="country-name"
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0D1F3C]"
                  >
                    {COUNTRY_DIAL_LIST.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.flag} {c.name} {c.dialCode !== '+' ? `(${c.dialCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="auth-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('auth.phone')}
                  </label>
                  <div className="flex items-stretch rounded border border-slate-300 focus-within:border-[#0D1F3C] bg-white overflow-hidden">
                    <div className="relative flex items-center gap-1.5 px-2.5 py-2 bg-[#F8FAFC] border-e border-slate-300 text-sm font-semibold text-[#0D1F3C] shrink-0 select-none hover:bg-slate-100 transition-colors">
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
                      id="auth-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel-national"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={selectedDialInfo.placeholder}
                      className="w-full min-w-0 px-3 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
              {mode === 'signin' && (
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email.trim());
                      setError('');
                      setInfoMsg('');
                      setStep('forgot-email');
                    }}
                    className="text-xs font-semibold text-[#B38818] hover:text-[#0D1F3C] hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}
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
                  ? mode === 'signup'
                    ? t('common.sending')
                    : t('common.sending')
                  : mode === 'signup'
                  ? t('auth.createSubmit')
                  : t('auth.signinSubmit')}
              </span>
            </button>

            {mode === 'signup' && (
              <p className="text-[11px] text-slate-500 text-center leading-snug">
                Mandatory 6-digit email verification required before vault access. New accounts initialize with $0.00 cash and 0.00 kg bullion.
              </p>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-center">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('auth.otp2faBadge')}</span>
              </span>
            </div>
          </form>
        )}

        {/* STEP B: 6-Digit Email OTP Verification Screen (Sign Up & Sign In) */}
        {(step === 'signup-otp' || step === 'signin-otp') && (
          <form onSubmit={handleVerifyOtp} className="p-5 sm:p-6 space-y-4">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-4 flex items-start gap-3">
              <MailCheck className="w-5 h-5 text-[#B38818] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed min-w-0">
                <p className="font-bold text-[#0D1F3C]">
                  {step === 'signup-otp' ? t('auth.titleSignupOtp') : t('auth.titleSigninOtp')}
                </p>
                <p className="mt-1">
                  Enter the 6-digit verification code sent to{' '}
                  <strong className="text-[#0D1F3C] break-all">{email.trim()}</strong> to unlock your Singapore depository dashboard.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="otp-code-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('auth.otpLabel')}
              </label>
              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.45em] border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
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
              disabled={submitting || otpCode.length !== 6}
              className="w-full py-2.5 bg-[#C59B27] hover:bg-[#B38818] disabled:opacity-60 text-[#0A162B] font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Verifying 6-Digit Code...'
                  : step === 'signup-otp'
                  ? t('auth.verifySignupBtn')
                  : t('auth.verifySigninBtn')}
              </span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtpCode('');
                  setError('');
                  setInfoMsg('');
                }}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0D1F3C] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('common.back')}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 font-semibold text-[#0D1F3C] hover:text-[#B38818] disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>
                  {resending
                    ? t('common.sending')
                    : resendCooldown > 0
                    ? t('auth.resendCooldown', { sec: resendCooldown })
                    : t('auth.resendCode')}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* STEP C1: Forgot Password — Request 6-Digit Reset Code */}
        {step === 'forgot-email' && (
          <form onSubmit={handleForgotEmailSubmit} autoComplete="on" className="p-5 sm:p-6 space-y-4">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-4 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-[#B38818] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-[#0D1F3C]">Password Recovery Verification</p>
                <p className="mt-1">
                  Enter your registered BullionStar email address and we will send a 6-digit reset verification code.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="forgot-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <input
                id="forgot-email-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 sm:py-2.5 min-h-[44px] bg-[#0D1F3C] hover:bg-[#193561] disabled:opacity-60 text-white font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <MailCheck className="w-4 h-4 text-[#F2D06B]" />
              <span>{submitting ? t('common.sending') : t('auth.sendResetCode')}</span>
            </button>

            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setMode('signin');
                  setError('');
                  setInfoMsg('');
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#0D1F3C]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('auth.backToSignIn')}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP C2: Forgot Password — Enter 6-Digit Reset Code & New Password */}
        {step === 'forgot-verify' && (
          <form onSubmit={handleForgotResetSubmit} autoComplete="on" className="p-5 sm:p-6 space-y-3.5">
            <div>
              <label htmlFor="reset-code-input" className="block text-xs font-semibold text-slate-700 mb-1 break-all">
                {t('auth.otpLabel')} ({resetEmail.trim()})
              </label>
              <input
                id="reset-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[0.4em] border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="reset-new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="reset-confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0D1F3C]"
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
              <KeyRound className="w-4 h-4" />
              <span>{submitting ? t('common.sending') : t('auth.resetPasswordSubmit')}</span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('forgot-email');
                  setError('');
                  setInfoMsg('');
                }}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0D1F3C] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('common.back')}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 font-semibold text-[#0D1F3C] hover:text-[#B38818] disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>
                  {resending
                    ? t('common.sending')
                    : resendCooldown > 0
                    ? t('auth.resendCooldown', { sec: resendCooldown })
                    : t('auth.resendCode')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
