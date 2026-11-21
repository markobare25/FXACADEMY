import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, MailCheck, ShieldAlert } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch } from '../lib/api';

function getSafeRedirectTarget(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('redirect');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
    const basePath = raw.split('?')[0];
    if (basePath === '/login' || basePath === '/register' || basePath === '/forgot-password') {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export const LoginPage: React.FC = () => {
  const { user, authLoading, login, logout, navigate } = usePlatform();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTarget = getSafeRedirectTarget();

  if (!authLoading && user) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#15803D] dark:text-emerald-400 mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Already Signed In</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> ({user.email})
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/signals')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              Open Signals Channel
            </button>
            <button
              type="button"
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
            >
              {user.role === 'admin' ? 'Open Admin Desk' : 'Open Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-medium text-slate-500 hover:text-red-600 py-1.5"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(email.trim(), password);
      if (redirectTarget && (redirectTarget !== '/admin' || loggedUser.role === 'admin')) {
        navigate(redirectTarget);
      } else {
        navigate(loggedUser.role === 'admin' ? '/signals' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Member Sign In</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Access live trading signals, saved courses, and personalized alerts.
        </p>
        {redirectTarget && (
          <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Please sign in to access <span className="font-mono font-semibold">{redirectTarget}</span>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-medium text-[#881337] dark:text-rose-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2 text-xs font-medium text-[#9F1239] dark:text-red-400">
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

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
          >
            Create free account
          </button>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { user, authLoading, register, logout, navigate } = usePlatform();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && user) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#15803D] dark:text-emerald-400 mx-auto" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Account Active</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You are already signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/signals')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              Open Signals Channel
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Open Dashboard
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-medium text-slate-500 hover:text-red-600 py-1.5"
            >
              Sign Out to Register Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await register(name, email, password);
      const redirectTarget = getSafeRedirectTarget();
      if (redirectTarget && redirectTarget !== '/admin') {
        navigate(redirectTarget);
      } else {
        navigate(res.user.role === 'admin' ? '/signals' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Trader Account</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Optional free membership to track Academy progress, save watchlists, and sync alerts across devices. Signals are open to everyone without registration.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Vance"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@domain.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password (minimum 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-red-500/10 dark:border-red-500/30 px-3 py-2 text-xs font-medium text-[#9F1239] dark:text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const { user, setUser, navigate } = usePlatform();
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(Boolean(user?.email_verified));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue new code.');
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <MailCheck className="w-6 h-6 text-[#881337] dark:text-rose-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Verify Email Address</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Confirm your email ownership to secure your account and recovery options.
        </p>

        {verified ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your email address is verified.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                Verification code issued: <span className="font-mono font-bold">{issuedCode}</span>
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Generate New Verification Code
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:underline mt-1"
              >
                Skip for now & open dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = usePlatform();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIssuedCode(null);
    try {
      const res = await apiFetch<{ reset_code?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      if (res.reset_code) {
        setIssuedCode(res.reset_code);
      }
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code, new_password: newPassword }),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-[#881337] dark:text-rose-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
        </div>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="mt-6 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your registered email address to request a recovery code.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              {loading ? 'Requesting...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            {issuedCode && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs text-[#881337] dark:text-rose-400">
                Recovery code issued: <span className="font-mono font-bold">{issuedCode}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reset Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              {loading ? 'Updating...' : 'Confirm Password Reset'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Your password has been updated successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
