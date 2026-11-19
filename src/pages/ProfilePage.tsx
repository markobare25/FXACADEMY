import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, History, KeyRound, LogOut, ShieldAlert, Trash2, User as UserIcon } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import {
  getCurrentPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushClient';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { NotificationPreferences } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, setUser, navigate, logout, theme, toggleTheme } = usePlatform();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.notification_prefs || {
      signals: true,
      signal_updates: true,
      market_updates: true,
      academy: true,
      economic_calendar: true,
      announcements: true,
    }
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activity, setActivity] = useState<
    Array<{ id: string; action: string; details: string; created_at: string }>
  >([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio || '');
    setTimezone(user.timezone || 'UTC');
    setPrefs(user.notification_prefs);
    apiFetch<{ activity: typeof activity }>('/api/users/activity')
      .then((res) => setActivity(res.activity))
      .catch(() => undefined);
    getCurrentPushSubscription().then((s) => setPushSubscribed(Boolean(s)));
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Account Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage your profile and push preferences.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-4 rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B]"
        >
          Sign In
        </button>
      </div>
    );
  }

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
      const res = await subscribeToPushNotifications();
      if (res.ok) {
        setPushSubscribed(true);
        setMessage('Push notifications enabled on this device.');
      } else {
        setError(res.error || 'Could not enable push notifications.');
      }
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

  const handleDeleteAccount = async () => {
    try {
      await apiFetch('/api/users/account', { method: 'DELETE' });
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account deletion failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile & Account Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user.email} · {user.email_verified ? 'Email Verified' : 'Email Pending Verification'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton variant="compact" label="Install App" />
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
        </div>
      </div>

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
            {!user.email_verified ? (
              <button
                type="button"
                onClick={() => navigate('/verify-email')}
                className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                Verify Email Address
              </button>
            ) : (
              <span className="text-xs text-[#15803D] dark:text-emerald-400 font-medium">
                Email verified
              </span>
            )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(
            [
              { key: 'signals', label: 'New Trading Signals' },
              { key: 'signal_updates', label: 'TP Hit, SL Hit & Signal Updates' },
              { key: 'market_updates', label: 'Breaking Market Updates' },
              { key: 'academy', label: 'New Academy Lessons' },
              { key: 'economic_calendar', label: 'Economic Calendar Reminders' },
              { key: 'announcements', label: 'Platform Announcements' },
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
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
          >
            Update Password
          </button>
        </form>
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

      {/* Delete Account */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-red-600 dark:text-red-400">
              Delete Account Permanently
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Removes your profile, bookmarks, learning progress, and notification subscriptions.
            </p>
          </div>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm Permanent Delete
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
