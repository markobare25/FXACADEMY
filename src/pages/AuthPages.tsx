import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MailCheck,
  ShieldAlert,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch } from '../lib/api';

const AUTH_ROUTE_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
]);

function getQueryParams(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

function getSafeRedirectTarget(): string | null {
  try {
    const raw = getQueryParams().get('redirect');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
    const basePath = raw.split('?')[0];
    if (AUTH_ROUTE_PATHS.has(basePath)) return null;
    return raw;
  } catch {
    return null;
  }
}

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

function isStrongPassword(password: string): boolean {
  const c = getPasswordChecks(password);
  return c.minLength && c.hasLetter && c.hasNumber;
}

const AuthBrandHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const { settings } = usePlatform();
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#881337] dark:text-rose-400">
        <Lock className="w-3.5 h-3.5" />
        <span>{settings.brand_name} Account Security</span>
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { user, authLoading, login, logout, navigate } = usePlatform();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = getQueryParams();
  const redirectTarget = getSafeRedirectTarget();
  const resetSuccess = params.get('reset') === 'success';

  if (!authLoading && user) {
    return (
      <div className="mx-auto max-w-md py-10 px-1">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#15803D] dark:text-emerald-400 mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Already Signed In</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Signed in as{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> (
              {user.email})
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              {user.role === 'admin' ? 'Open Admin Desk' : 'Open Member Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signals')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Open Signals Channel
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-medium text-slate-500 hover:text-red-600 py-2 min-h-[36px]"
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(cleanIdentifier, password, rememberMe);
      if (redirectTarget && (redirectTarget !== '/admin' || loggedUser.role === 'admin')) {
        navigate(redirectTarget);
      } else {
        navigate(loggedUser.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8 sm:py-12 px-1">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs">
        <AuthBrandHeader
          title="Sign In to MeridianFX"
          subtitle="Secure sign in for MeridianFX administrators and approved premium members."
        />

        {resetSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/25 px-3 py-2.5 text-xs font-medium text-[#15803D] dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password updated. Sign in below with your credentials.</span>
          </div>
        )}

        {redirectTarget && (
          <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Sign in to continue to <span className="font-mono font-semibold">{redirectTarget}</span>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email or Username
            </label>
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username or you@domain.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-medium text-[#881337] dark:text-rose-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-11 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded accent-[#881337]"
            />
            <span>Remember me on this device (30 days)</span>
          </label>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2.5 text-xs font-medium text-[#9F1239] dark:text-red-400"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Interested in premium access?{' '}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
          >
            Apply for Premium Membership
          </button>
        </p>
      </div>
    </div>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const { user, setUser, navigate } = usePlatform();
  const params = getQueryParams();
  const urlToken = params.get('token') || '';
  const urlCode = params.get('code') || '';
  const urlEmail = params.get('email') || '';
  const isWelcome = params.get('welcome') === '1';

  const [email, setEmail] = useState(urlEmail || user?.email || '');
  const [code, setCode] = useState(urlCode);
  const [loading, setLoading] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(urlCode || null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(Boolean(user?.email_verified));

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (user?.email_verified) setVerified(true);
  }, [user, email]);

  useEffect(() => {
    if (!urlToken || verified) return;
    let active = true;
    setLoading(true);
    apiFetch<{ user?: typeof user }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: urlToken }),
    })
      .then((res) => {
        if (!active) return;
        if (res.user) setUser(res.user);
        setVerified(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Verification link invalid or expired.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [urlToken, verified, setUser]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      if (res.user) setUser(res.user);
      setVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const res = await apiFetch<{ verification_code?: string }>('/api/auth/resend-verification', {
        method: 'POST',
      });
      if (res.verification_code) {
        setIssuedCode(res.verification_code);
        setCode(res.verification_code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue new code.');
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 px-1">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3">
          <MailCheck className="w-6 h-6 text-[#881337] dark:text-rose-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isWelcome ? 'Account Created — Verify Email' : 'Verify Email Address'}
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isWelcome
            ? 'Your account session is active. Confirm your verification code below or head straight to your dashboard.'
            : 'Confirm your email ownership to secure your account and password recovery options.'}
        </p>

        {verified ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-[#15803D] dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your email address is verified.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              {user ? 'Continue to Dashboard' : 'Sign In'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>

            {issuedCode && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs text-[#881337] dark:text-rose-400">
                Verification code: <span className="font-mono font-bold">{issuedCode}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2 text-xs font-medium text-[#9F1239] dark:text-red-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              {user && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                >
                  Generate New Verification Code
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:underline mt-1 py-1.5"
              >
                Skip for now &amp; open dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { settings, navigate } = usePlatform();

  return (
    <div className="mx-auto max-w-md py-8 sm:py-12 px-1">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-6 h-6 text-[#881337] dark:text-rose-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Password Reset Assistance
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            For account security, MeridianFX member passwords are reset exclusively by the platform administrator. Self-service password resets are disabled.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">How to recover access</p>
          <p>
            Contact the {settings.brand_name} administrator using our official desk email (
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {settings.contact_email}
            </span>
            ) or via the Profile membership contact desk to receive a new temporary password.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
          >
            <span>Open Official Contact Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = usePlatform();
  const params = getQueryParams();
  const urlToken = params.get('token') || '';
  const urlEmail = params.get('email') || '';

  const [mode, setMode] = useState<'token' | 'code'>(urlToken ? 'token' : 'code');
  const [token] = useState(urlToken);
  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const checks = getPasswordChecks(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!isStrongPassword(newPassword)) {
      setError('New password must be at least 8 characters and include a letter and a number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(
          mode === 'token' && token
            ? { token, new_password: newPassword, confirm_password: confirmPassword }
            : {
                email: email.trim().toLowerCase(),
                code: code.trim(),
                new_password: newPassword,
                confirm_password: confirmPassword,
              }
        ),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8 sm:py-12 px-1">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-6 h-6 text-[#881337] dark:text-rose-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Set New Password</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose a strong new password for your MeridianFX account. All active sessions will be signed out.
        </p>

        {done ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm font-medium text-[#15803D] dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your password has been updated cleanly.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login?reset=success')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              Sign In with New Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {token && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  {mode === 'token' ? 'Verified reset link active' : 'Using recovery code'}
                </span>
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === 'token' ? 'code' : 'token'))}
                  className="font-medium text-[#881337] dark:text-rose-400 hover:underline"
                >
                  {mode === 'token' ? 'Use code instead' : 'Use reset link'}
                </button>
              </div>
            )}

            {mode === 'code' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    6-Digit Recovery Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars, letter & number"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-11 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 ${
                    checks.minLength ? 'text-[#15803D] dark:text-emerald-400 font-medium' : 'text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3" /> 8+ characters
                </span>
                <span
                  className={`inline-flex items-center gap-1 ${
                    checks.hasLetter ? 'text-[#15803D] dark:text-emerald-400 font-medium' : 'text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3" /> Letter
                </span>
                <span
                  className={`inline-flex items-center gap-1 ${
                    checks.hasNumber ? 'text-[#15803D] dark:text-emerald-400 font-medium' : 'text-slate-400'
                  }`}
                >
                  <Check className="w-3 h-3" /> Number
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-11 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2 text-xs font-medium text-[#9F1239] dark:text-red-400"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[44px]"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
