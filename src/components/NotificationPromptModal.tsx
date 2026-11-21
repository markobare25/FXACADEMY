import React, { useEffect, useState } from 'react';
import {
  BellOff,
  BellRing,
  CheckCircle2,
  MessageSquareText,
  Newspaper,
  Send,
  ShieldAlert,
  Smartphone,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  DEFAULT_DEVICE_PREFS,
  getCurrentPushSubscription,
  getDevicePushPreferences,
  isPushSupported,
  saveDevicePushPreferences,
  sendTestPushNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushClient';
import { usePlatform } from '../context/PlatformContext';
import type { NotificationPreferences } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationPromptModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const { user, setUser } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.notification_prefs || DEFAULT_DEVICE_PREFS
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setStatusMsg(null);
    getCurrentPushSubscription().then((sub) => setSubscribed(Boolean(sub)));
    getDevicePushPreferences()
      .then((res) => setPrefs(res.prefs))
      .catch(() => {
        if (user?.notification_prefs) setPrefs(user.notification_prefs);
      });
  }, [open, user?.notification_prefs]);

  if (!open) return null;

  const permission =
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  const supported = isPushSupported();

  const handleTogglePref = async (key: keyof NotificationPreferences, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    if (subscribed || user) {
      try {
        const res = await saveDevicePushPreferences({ [key]: val });
        setPrefs(res.prefs);
        if (user) {
          setUser({ ...user, notification_prefs: res.prefs });
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to save preference.');
      }
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await subscribeToPushNotifications(prefs);
    setLoading(false);

    if (res.ok) {
      setSubscribed(true);
      if (res.prefs) {
        setPrefs(res.prefs);
        if (user) setUser({ ...user, notification_prefs: res.prefs });
      }
      setStatusMsg('Push alerts are now active on this device — works even when closed.');
      onSuccess?.();
    } else {
      setErrorMsg(res.error || 'Could not enable push notifications.');
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setErrorMsg(null);
    await unsubscribeFromPushNotifications();
    setSubscribed(false);
    setLoading(false);
    setStatusMsg('Push alerts disabled on this device. All posts remain visible in Signals.');
  };

  const handleSendTest = async () => {
    setTesting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await sendTestPushNotification();
      setStatusMsg('Test push sent! Minimize or lock your screen if testing background delivery.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send test push notification.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enable Real-Time Market Alerts"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#881337]/10 text-[#881337] dark:text-rose-400">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Instant MeridianFX Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Native OS banners & lock-screen delivery — even when closed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close notification prompt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Forex Signals & TP/SL Updates
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pair, BUY/SELL direction, entry, stop loss & target hits.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.signals}
              onChange={(e) => {
                const checked = e.target.checked;
                handleTogglePref('signals', checked);
                handleTogglePref('signal_updates', checked);
              }}
              className="w-4 h-4 accent-[#881337]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageSquareText className="h-5 w-5 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Signal Chat Channel
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant alerts with preview whenever a desk message is posted.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.signal_chat}
              onChange={(e) => handleTogglePref('signal_chat', e.target.checked)}
              className="w-4 h-4 accent-[#881337]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer">
            <div className="flex items-start gap-3">
              <Newspaper className="h-5 w-5 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Market Updates & Announcements
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Breaking macro news, session briefings & platform broadcasts.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.market_updates}
              onChange={(e) => {
                const checked = e.target.checked;
                handleTogglePref('market_updates', checked);
                handleTogglePref('announcements', checked);
              }}
              className="w-4 h-4 accent-[#881337]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer">
            <div className="flex items-start gap-3">
              {prefs.sound_enabled ? (
                <Volume2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Notification Sound & Vibration
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Play OS chime & vibrate on incoming alerts (silent mode if off).
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.sound_enabled}
              onChange={(e) => handleTogglePref('sound_enabled', e.target.checked)}
              className="w-4 h-4 accent-[#881337]"
            />
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3">
            <Smartphone className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">
                Android, Desktop & iPhone/iPad (iOS 16.4+)
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                On iPhone/iPad, tap Safari Share → Add to Home Screen first, then open the installed app to enable lock-screen alerts.
              </p>
            </div>
          </div>
        </div>

        {!supported && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            This browser session does not support Web Push directly. On iPhone/iPad, install via Safari Share → Add to Home Screen, then reopen the app to enable push alerts.
          </div>
        )}

        {permission === 'denied' && (
          <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs text-[#881337] dark:text-rose-300">
            Notifications are currently blocked in your browser/OS site permissions. Allow notifications for MeridianFX in site settings to subscribe.
          </div>
        )}

        {statusMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-[#881337]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            {subscribed ? 'Done' : 'Maybe Later'}
          </button>

          {subscribed && (
            <button
              type="button"
              disabled={testing}
              onClick={handleSendTest}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-semibold text-[#15803D] dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-60 transition-colors min-h-[44px]"
            >
              <Send className="h-4 w-4" />
              <span>{testing ? 'Sending...' : 'Test Push'}</span>
            </button>
          )}

          {subscribed ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleDisable}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-sm font-semibold text-[#881337] dark:text-rose-300 hover:bg-rose-100 disabled:opacity-60 transition-colors min-h-[44px]"
            >
              <BellOff className="h-4 w-4" />
              <span>{loading ? 'Updating...' : 'Disable Push'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !supported}
              onClick={handleEnable}
              className="w-full sm:w-auto rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
            >
              {loading ? 'Activating...' : 'Allow Notifications'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
