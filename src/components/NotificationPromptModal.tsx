import React, { useState } from 'react';
import { BellRing, CheckCircle2, ShieldAlert, TrendingUp, BookOpen, Newspaper, X } from 'lucide-react';
import { subscribeToPushNotifications } from '../lib/pushClient';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationPromptModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleEnable = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await subscribeToPushNotifications();
    setLoading(false);

    if (res.ok) {
      setStatusMsg('Push alerts are now active on this device.');
      onSuccess?.();
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Could not enable push notifications.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enable Real-Time Market Alerts"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#881337]/10 text-[#881337] dark:text-rose-400">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Activate Instant Market Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Delivered in real time—even when the app is closed
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

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                New Trading Signals & TP/SL Outcomes
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Receive immediate alerts when new setups are published or when TP/SL levels are updated.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <Newspaper className="h-5 w-5 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Breaking Market Updates & Session Briefs
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Stay informed on central bank shifts, Gold volatility, and risk warnings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
            <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                New Academy Lessons & Custom Preferences
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Choose exactly which categories you want in your Profile settings at any time.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          On iPhone/iPad (iOS 16.4+), add MeridianFX to your Home Screen via Safari Share first to receive lock-screen push notifications.
        </p>

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

        <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Maybe Later
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleEnable}
            className="w-full sm:w-auto rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
          >
            {loading ? 'Activating...' : 'Allow Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
};
