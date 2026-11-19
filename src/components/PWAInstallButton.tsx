import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'primary' | 'outline' | 'compact';
  label?: string;
}

export const PWAInstallButton: React.FC<Props> = ({
  variant = 'outline',
  label = 'Install App',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  const btnClass =
    variant === 'primary'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors whitespace-nowrap shrink-0 min-h-[44px]'
      : variant === 'compact'
        ? 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#881337]/40 hover:text-[#881337] transition-colors whitespace-nowrap shrink-0 min-h-[40px]'
        : 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-[#881337]/40 hover:bg-rose-50/40 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 min-h-[44px]';

  return (
    <>
      <button type="button" onClick={handleClick} className={btnClass}>
        <Download className="w-4 h-4 shrink-0 text-[#881337] dark:text-rose-400" />
        <span>{isIOS ? 'Install on iPhone' : label}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install MeridianFX App"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="MeridianFX Icon"
                  className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Install MeridianFX App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standalone experience with offline lessons & push alerts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    iPhone & iPad (Safari):
                  </p>
                  <div className="flex items-start gap-3">
                    <Share className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                    <p>
                      1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar (bottom or top bar).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <PlusSquare className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                    <p>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>, then confirm <strong>Add</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      3. Launch MeridianFX from your Home Screen to enable lock-screen push alerts (iOS 16.4+).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-[#881337] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Android (Chrome / Edge) & Desktop:
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Open your browser menu (<span className="font-mono">⋮</span> or address bar install icon) and select{' '}
                        <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    On iOS Safari, tap Share then Add to Home Screen.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
