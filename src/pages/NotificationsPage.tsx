import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle2,
  Send,
  ShieldAlert,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import {
  DEFAULT_DEVICE_PREFS,
  detectPushPlatform,
  getCurrentPushSubscription,
  getDevicePushPreferences,
  isPushSupported,
  saveDevicePushPreferences,
  sendTestPushNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushClient';
import type { NotificationPreferences } from '../types';

export const NotificationsPage: React.FC = () => {
  const {
    user,
    authLoading,
    notifications,
    unreadCount,
    refreshNotifications,
    navigate,
    setUser,
  } = usePlatform();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.notification_prefs || DEFAULT_DEVICE_PREFS
  );
  const [busyPush, setBusyPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPushSubscription().then((s) => setDeviceSubscribed(Boolean(s)));
    getDevicePushPreferences()
      .then((res) => {
        setPrefs(res.prefs);
      })
      .catch(() => {
        if (user?.notification_prefs) setPrefs(user.notification_prefs);
      });
  }, [user?.id, user?.notification_prefs]);

  const supported = isPushSupported();
  const platform = detectPushPlatform();
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  const handleToggleDevicePush = async () => {
    setBusyPush(true);
    setErrorMsg(null);
    setStatusMsg(null);
    if (deviceSubscribed) {
      await unsubscribeFromPushNotifications();
      setDeviceSubscribed(false);
      setStatusMsg('Push notifications disabled on this device.');
    } else {
      const res = await subscribeToPushNotifications(prefs);
      if (res.ok) {
        setDeviceSubscribed(true);
        if (res.prefs) {
          setPrefs(res.prefs);
          if (user) setUser({ ...user, notification_prefs: res.prefs });
        }
        setStatusMsg('Device push notifications activated — alerts will arrive even when MeridianFX is closed.');
      } else {
        setErrorMsg(res.error || 'Could not enable push notifications.');
      }
    }
    setBusyPush(false);
  };

  const handlePrefChange = async (key: keyof NotificationPreferences, checked: boolean) => {
    const next = { ...prefs, [key]: checked };
    setPrefs(next);
    setErrorMsg(null);
    try {
      const res = await saveDevicePushPreferences({ [key]: checked });
      setPrefs(res.prefs);
      if (user) {
        setUser({ ...user, notification_prefs: res.prefs });
      }
      setStatusMsg('Notification preferences saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update preferences.');
    }
  };

  const handleSendTest = async () => {
    setTestingPush(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await sendTestPushNotification();
      setStatusMsg('Test push delivered to push service! Check your phone notification tray.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Test push failed.');
    } finally {
      setTestingPush(false);
    }
  };

  const markRead = async (id: string, targetUrl: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    await refreshNotifications();
    if (targetUrl && targetUrl !== '/notifications') {
      navigate(targetUrl);
    }
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    await refreshNotifications();
  };

  const visible = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications & Mobile Push Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure native lock-screen & background push alerts for signals, Signal Chat, and market updates.
          </p>
        </div>

        {user && unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Device Push & Category Subscription Settings (works for both visitors & signed-in traders) */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                deviceSubscribed
                  ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-[#881337]/10 text-[#881337] dark:text-rose-400'
              }`}
            >
              {deviceSubscribed ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {deviceSubscribed ? 'Push Notifications Active on This Device' : 'Enable Real-Time Push Notifications'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {deviceSubscribed
                  ? 'Alerts arrive in background, locked screen, and when the app is closed.'
                  : 'Receive instant WhatsApp-style mobile alerts whenever new signals or updates go live.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {deviceSubscribed && (
              <button
                type="button"
                disabled={testingPush}
                onClick={handleSendTest}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 min-h-[40px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingPush ? 'Sending...' : 'Send Test Alert'}</span>
              </button>
            )}
            <button
              type="button"
              disabled={busyPush || !supported}
              onClick={handleToggleDevicePush}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors min-h-[40px] disabled:opacity-60 ${
                deviceSubscribed
                  ? 'border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-[#881337] dark:text-rose-300 hover:bg-rose-100'
                  : 'bg-[#15803D] text-white hover:bg-[#166534]'
              }`}
            >
              {busyPush
                ? 'Updating...'
                : deviceSubscribed
                  ? 'Disable Push'
                  : 'Enable Push Notifications'}
            </button>
          </div>
        </div>

        {platform === 'ios' && !isStandalone && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-300">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>iPhone / iPad Notice:</strong> Apple iOS requires adding MeridianFX to your Home Screen (Safari Share → Add to Home Screen) and opening it from the Home Screen icon before Web Push can be activated.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {(
            [
              { key: 'signals', label: 'Forex Signals', desc: 'New BUY/SELL entries & levels' },
              { key: 'signal_updates', label: 'Signal Updates', desc: 'TP Hit, SL Hit & closures' },
              { key: 'signal_chat', label: 'Signal Chat', desc: 'Real-time desk chat alerts' },
              { key: 'market_updates', label: 'Market Updates', desc: 'News, sessions & outlook' },
              { key: 'announcements', label: 'Announcements', desc: 'Admin broadcasts & notices' },
              { key: 'academy', label: 'Academy Releases', desc: 'New trading lessons' },
              { key: 'economic_calendar', label: 'Economic Calendar', desc: 'High-impact macro events' },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs[item.key]}
                onChange={(e) => handlePrefChange(item.key, e.target.checked)}
                className="w-4 h-4 accent-[#881337] shrink-0"
              />
            </label>
          ))}

          <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center gap-2 min-w-0">
              {prefs.sound_enabled ? (
                <Volume2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Alert Sounds</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Chime & vibration</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.sound_enabled}
              onChange={(e) => handlePrefChange('sound_enabled', e.target.checked)}
              className="w-4 h-4 accent-[#881337] shrink-0"
            />
          </label>
        </div>

        {statusMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs font-medium text-[#881337] dark:text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {/* Alert History */}
      {authLoading && !user ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
          Loading notification history...
        </div>
      ) : !user ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">In-App Notification History</h2>
          <p className="mt-1 text-xs text-slate-500">
            Real-time push notifications work above without an account. Approved Premium Members can sign in via Profile to view synced unread history.
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-4 rounded-lg bg-[#881337] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
          >
            Open Profile
          </button>
        </div>
      ) : (
        <>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-[#881337] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All Alerts
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filter === 'unread'
                  ? 'bg-[#881337] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
            {visible.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="mt-3 text-sm text-slate-500">No notifications in this view.</p>
              </div>
            ) : (
              visible.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${
                    n.is_read ? 'opacity-75' : 'bg-rose-50/50 dark:bg-rose-950/15'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => markRead(n.id, n.link_url)}
                    className="text-left flex-1 min-w-0"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize font-semibold text-[#881337] dark:text-rose-400">
                        {n.category.replace('_', ' ')}
                      </span>{' '}
                      · {formatLocalDateTime(n.created_at)} {!n.is_read ? '· Unread' : ''}
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
                  </button>

                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id, '/notifications')}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#15803D] shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
