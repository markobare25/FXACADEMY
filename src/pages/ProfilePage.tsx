import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  History,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import {
  DEFAULT_DEVICE_PREFS,
  getCurrentPushSubscription,
  sendTestPushNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushClient';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { NotificationPreferences } from '../types';

export const ProfilePage: React.FC = () => {
  const {
    user,
    authLoading,
    settings,
    setUser,
    navigate,
    logout,
    logoutAllSessions,
    theme,
    toggleTheme,
    showNotifModal,
    setShowNotifModal,
  } = usePlatform();

  // Authenticated profile state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.notification_prefs || DEFAULT_DEVICE_PREFS
  );
  const [testingPush, setTestingPush] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activity, setActivity] = useState<
    Array<{ id: string; action: string; details: string; created_at: string }>
  >([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Membership application inquiry form (unauthenticated visitors)
  const [appForm, setAppForm] = useState({
    name: '',
    email: '',
    experience: 'Intermediate Forex & Gold Trader',
    message: '',
  });
  const [appLoading, setAppLoading] = useState(false);
  const [appSent, setAppSent] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPushSubscription()
      .then((s) => setPushSubscribed(Boolean(s)))
      .catch(() => setPushSubscribed(false));
  }, [showNotifModal]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio || '');
    setTimezone(user.timezone || 'UTC');
    setPrefs(user.notification_prefs);
    apiFetch<{ activity: typeof activity }>('/api/users/activity')
      .then((res) => setActivity(res.activity))
      .catch(() => undefined);
  }, [user]);

  if (authLoading && !user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
        Loading profile...
      </div>
    );
  }

  // =========================================================================
  // VISITOR VIEW: WELCOME TO MERIDIANFX + SIGN IN + APPLY FOR PREMIUM MEMBERSHIP
  // =========================================================================
  if (!user) {
    const whatsappClean = (settings.contact_whatsapp || '').trim();
    const whatsappDigits = whatsappClean.replace(/\D/g, '');
    const whatsappUrl = whatsappDigits
      ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
          `Hello ${settings.brand_name}, I would like to apply for Premium Membership.`
        )}`
      : null;

    const mailtoUrl = `mailto:${encodeURIComponent(
      settings.contact_email
    )}?subject=${encodeURIComponent(`${settings.brand_name} Premium Membership Application`)}`;

    const handleApplicationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (appLoading) return;
      setAppLoading(true);
      setAppError(null);
      setAppSent(false);
      try {
        await apiFetch('/api/contact', {
          method: 'POST',
          body: JSON.stringify({
            name: appForm.name.trim(),
            email: appForm.email.trim(),
            subject: 'Premium Membership Application',
            message: `Trading Profile: ${appForm.experience}\n\n${appForm.message.trim()}`,
          }),
        });
        setAppSent(true);
        setAppForm({
          name: '',
          email: '',
          experience: 'Intermediate Forex & Gold Trader',
          message: '',
        });
      } catch (err) {
        setAppError(err instanceof Error ? err.message : 'Unable to send membership request.');
      } finally {
        setAppLoading(false);
      }
    };

    return (
      <div className="space-y-6 max-w-4xl">
        {/* 1. WELCOME TO MERIDIANFX */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#881337] dark:text-rose-400">
                Welcome to {settings.brand_name}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Forex Education, Market Intelligence &amp; Premium Membership
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {settings.brand_name} provides structured Forex and commodities education, real-time session market intelligence, an open public Signals channel with live updates, and administrator-approved premium membership services.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <PWAInstallButton variant="compact" label="INSTALL APP" />
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-start gap-2.5 pt-2">
              <TrendingUp className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Open Signals Channel</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse live public setups, charts, and historical outcomes without login.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2">
              <BookOpen className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Structured Academy</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  15 Forex, Gold, Crypto &amp; risk engineering courses with interactive labs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2">
              <BellRing className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Instant Push Alerts</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Receive live signal alerts directly on Android, iPhone, or desktop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SIGN IN (ADMIN & APPROVED PREMIUM MEMBERS) + DEVICE PUSH ALERTS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#881337] dark:text-rose-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Member &amp; Administrator Sign In
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Already an approved {settings.brand_name} premium member or administrator? Sign in using your assigned email or username to access your member workspace and premium briefings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to {settings.brand_name}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/signals')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
              >
                <span>Open Public Signals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          <section className="md:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#15803D] dark:text-emerald-400">
                <BellRing className="w-4 h-4" />
                <span>Signal Push Alerts</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {pushSubscribed ? 'Notifications Active' : 'Enable Notifications'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Get instant lock-screen alerts whenever a new message or setup is published in the public Signals channel — no account required.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px] ${
                pushSubscribed
                  ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-[#15803D] dark:text-emerald-400'
                  : 'bg-[#15803D] text-white hover:bg-[#166534]'
              }`}
            >
              {pushSubscribed ? <CheckCircle2 className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
              <span>{pushSubscribed ? 'Manage Device Alerts' : 'Enable Notifications'}</span>
            </button>
          </section>
        </div>

        {/* 3. APPLY FOR PREMIUM MEMBERSHIP */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#881337] dark:text-rose-400">
              Apply for Premium Membership
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Request Approved Premium Member Access
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {settings.brand_name} membership is personally reviewed and provisioned by our desk administrator. Approved members receive dedicated sign-in credentials directly from the administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Benefits, Steps, and Verified Contact Details */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Premium Membership Benefits
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Access to member-exclusive trading signals, deep macro briefings, and premium Academy modules.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Personal Trader Dashboard with synced pair watchlists and cross-device learning progress.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct administrator onboarding, password support, and dedicated membership management.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  How to Apply (3 Steps)
                </h3>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>01. Contact the {settings.brand_name} desk via official email, WhatsApp (if listed), or the application form.</li>
                  <li>02. Our administrator reviews your request and confirms membership terms directly with you.</li>
                  <li>03. Once approved, you receive your private username, email, and temporary password to sign in.</li>
                </ol>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official {settings.brand_name} Contact Details
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                    <span className="font-mono">{settings.contact_email}</span>
                  </div>
                  {whatsappClean && (
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                      <span className="font-mono">{whatsappClean}</span>
                    </div>
                  )}
                  {settings.contact_phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                      <span className="font-mono">{settings.contact_phone}</span>
                    </div>
                  )}
                  {settings.contact_address && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                      <span>{settings.contact_address}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[40px]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Membership Desk</span>
                  </a>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] transition-colors min-h-[40px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contact via WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Direct Inquiry Form */}
            <div className="lg:col-span-6">
              <form
                onSubmit={handleApplicationSubmit}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-5 space-y-3.5"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Direct Membership Request Form
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sends your request straight to the administrator inbox. Submitting this form does not create an account automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={appForm.name}
                    onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={appForm.email}
                    onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                    placeholder="you@domain.com"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Trading Experience
                  </label>
                  <select
                    value={appForm.experience}
                    onChange={(e) => setAppForm({ ...appForm, experience: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Beginner (Learning Forex Foundations)">
                      Beginner (Learning Forex Foundations)
                    </option>
                    <option value="Intermediate Forex & Gold Trader">
                      Intermediate Forex &amp; Gold Trader
                    </option>
                    <option value="Experienced / Prop Desk Trader">
                      Experienced / Prop Desk Trader
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Membership Request Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    value={appForm.message}
                    onChange={(e) => setAppForm({ ...appForm, message: e.target.value })}
                    placeholder="Share your goals, preferred contact method, and questions about premium membership..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                {appError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{appError}</span>
                  </div>
                )}

                {appSent && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-[#15803D] dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Membership request submitted. The {settings.brand_name} administrator will review your inquiry and follow up directly.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={appLoading}
                  className="w-full rounded-lg bg-[#881337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[44px]"
                >
                  {appLoading ? 'Submitting Request...' : 'Submit Membership Request'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED VIEW: ADMINISTRATOR OR APPROVED PREMIUM MEMBER
  // =========================================================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, bio, timezone }),
      });
      if (res.user) setUser(res.user);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const handleSavePrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/notifications-prefs', {
        method: 'PATCH',
        body: JSON.stringify(next),
      });
      if (res.user) setUser(res.user);
      setMessage('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences.');
    }
  };

  const handleToggleDevicePush = async () => {
    setError(null);
    if (pushSubscribed) {
      await unsubscribeFromPushNotifications();
      setPushSubscribed(false);
      setMessage('Push notifications disabled on this device.');
    } else {
      const res = await subscribeToPushNotifications(prefs);
      if (res.ok) {
        setPushSubscribed(true);
        setMessage('Push notifications enabled on this device.');
      } else {
        setError(res.error || 'Could not enable push notifications.');
      }
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    setError(null);
    setMessage(null);
    try {
      await sendTestPushNotification();
      setMessage('Test push notification sent to this device.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test push delivery failed.');
    } finally {
      setTestingPush(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiFetch('/api/users/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed.');
    }
  };

  const isAdmin = user.role === 'admin';
  const membershipExpiresLabel = user.membership_expires_at
    ? formatLocalDateTime(user.membership_expires_at)
    : 'No Expiry';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile &amp; Account Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin ? 'Administrator' : 'Approved Premium Member'}
            {user.username ? ` · @${user.username}` : ''} · {user.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton variant="compact" label="INSTALL APP" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={logoutAllSessions}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Sign Out All Devices
          </button>
        </div>
      </div>

      {/* Membership Summary Bar */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Account Category</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <span>{isAdmin ? 'Platform Administrator' : 'Premium Member'}</span>
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Membership Status</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#15803D] dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{user.membership_active !== false ? 'Active' : 'Inactive'}</span>
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Membership Expiry</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-slate-900 dark:text-white">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span>{isAdmin ? 'Permanent' : membershipExpiresLabel}</span>
          </span>
        </div>
      </section>

      {user.needs_password_setup && !isAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-300">
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>
            You are using an administrator-assigned temporary password. Update your personal password in Account Security below.
          </span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Info */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Personal Details</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Trading Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Account credentials and status are managed by the {settings.brand_name} administrator.
            </span>
            <button
              type="submit"
              className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Push Notification Preferences */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Push Notification Preferences
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pushSubscribed && (
              <button
                type="button"
                disabled={testingPush}
                onClick={handleSendTestPush}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 min-h-[40px]"
              >
                {testingPush ? 'Sending Test...' : 'Send Test Push'}
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleDevicePush}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors min-h-[40px] ${
                pushSubscribed
                  ? 'bg-emerald-50 text-[#15803D] border border-emerald-200 dark:bg-emerald-600/15 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-[#15803D] text-white hover:bg-[#166534]'
              }`}
            >
              {pushSubscribed ? 'Device Push Active (Disable)' : 'Enable Push on This Device'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(
            [
              { key: 'signals', label: 'New Forex Signals' },
              { key: 'signal_updates', label: 'TP Hit, SL Hit & Signal Updates' },
              { key: 'signal_chat', label: 'Signal Chat Channel Messages' },
              { key: 'market_updates', label: 'Breaking Market Updates' },
              { key: 'announcements', label: 'Platform Announcements' },
              { key: 'academy', label: 'New Academy Lessons' },
              { key: 'economic_calendar', label: 'Economic Calendar Reminders' },
              { key: 'sound_enabled', label: 'Notification Sounds & Vibration' },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 cursor-pointer"
            >
              <span className="text-sm text-slate-800 dark:text-slate-200">{item.label}</span>
              <input
                type="checkbox"
                checked={prefs[item.key]}
                onChange={(e) =>
                  handleSavePrefs({ ...prefs, [item.key]: e.target.checked })
                }
                className="w-4 h-4 accent-[#881337]"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Security / Change Password */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Security</h2>
        </div>

        {isAdmin ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This administrator account uses permanent credentials protected by server policy.
          </p>
        ) : (
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current or temporary password"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-slate-900 dark:text-white"
            />
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (8+ chars, letter & num)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
            >
              Update Password
            </button>
          </form>
        )}
      </section>

      {/* Account Activity */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Activity</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
          {activity.map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</span>
                <span className="text-slate-500"> · {act.details}</span>
              </div>
              <span className="font-mono text-slate-400 shrink-0">
                {formatLocalDateTime(act.created_at)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
