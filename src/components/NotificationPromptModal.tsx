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
  detectPushPlatform,
  dismissNotificationPrompt,
  getCurrentPushSubscription,
  getDevicePushPreferences,
  isPushSupported,
  isStandalonePWA,
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
  const platform = detectPushPlatform();
  const standalone = isStandalonePWA();
  const iosNeedsInstall = platform === 'ios' && !standalone;

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
      setStatusMsg('Notifications Enabled — instant alerts will arrive even when the app is closed.');
      onSuccess?.();
    } else {
      setErrorMsg(res.error || 'Could not enable push notifications.');
    }
  };

  const handleMaybeLater = () => {
    if (!subscribed) {
      dismissNotificationPrompt();
    }
    onClose();
  };

  const handleDisable = async () => {
    setLoading(true);
    setErrorMsg(null);
    await unsubscribeFromPushNotifications();
    setSubscribed(false);
    setLoading(false);
    setStatusMsg('Notifications paused for this device. You can re-enable them anytime.');
  };

  const handleSendTest = async () => {
    setTesting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await sendTestPushNotification();
      setStatusMsg('Test notification dispatched to this device! Check your system notification tray.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send test notification.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="NEVER MISS A TRADING UPDATE"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                subscribed
                  ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-[#881337]/10 text-[#881337] dark:text-rose-400'
              }`}
            >
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {subscribed ? 'Notifications Enabled' : 'NEVER MISS A TRADING UPDATE'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {subscribed
                  ? 'This device is subscribed to the public MeridianFX Signals Channel.'
                  : 'Get instant notifications whenever MeridianFX publishes new Forex signals, market analysis and important announcements.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMaybeLater}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
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
                  Buy/Sell setups, entry, stop loss & target hits.
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
                  Live Signals Channel Broadcasts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant alerts with preview when desk analysis or setups go live.
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
                  Market News & Important Announcements
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Economic calendar releases, macro news & desk notices.
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

          {iosNeedsInstall && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-3">
              <Smartphone className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-300 text-xs">
                  iPhone / iPad Required Step (iOS 16.4+)
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Tap Safari Share → Add to Home Screen first, then open MeridianFX from your Home Screen icon to enable lock-screen alerts.
                </p>
              </div>
            </div>
          )}
        </div>

        {!supported && !iosNeedsInstall && (
          <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            This browser session does not support Web Push directly. Try Chrome, Edge, Android browser, or iOS 16.4+ installed Home Screen Web App.
          </div>
        )}

        {permission === 'denied' && (
          <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs text-[#881337] dark:text-rose-300">
            Notifications are currently blocked in your browser/OS site settings. Allow notifications for MeridianFX to subscribe.
          </div>
        )}

        {statusMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs font-medium text-[#881337] dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleMaybeLater}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            {subscribed ? 'DONE' : 'MAYBE LATER'}
          </button>

          {subscribed && (
            <button
              type="button"
              disabled={testing}
              onClick={handleSendTest}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#15803D] dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-60 transition-colors min-h-[44px]"
            >
              <Send className="h-4 w-4" />
              <span>{testing ? 'SENDING...' : 'SEND TEST NOTIFICATION'}</span>
            </button>
          )}

          {subscribed ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleDisable}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#881337] dark:text-rose-300 hover:bg-rose-100 disabled:opacity-60 transition-colors min-h-[44px]"
            >
              <BellOff className="h-4 w-4" />
              <span>{loading ? 'UPDATING...' : 'DISABLE NOTIFICATIONS'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !supported}
              onClick={handleEnable}
              className="w-full sm:w-auto rounded-lg bg-[#881337] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
            >
              {loading ? 'ACTIVATING...' : 'ENABLE NOTIFICATIONS'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
