import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Download,
  ExternalLink,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    reminderDismissed,
    showGuideModal,
    install,
    dismissReminder,
    closeGuideModal,
  } = usePWAInstall();

  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    if (isInstalled || reminderDismissed) {
      setReadyToShow(false);
      return;
    }
    const timer = window.setTimeout(() => setReadyToShow(true), 1000);
    return () => window.clearTimeout(timer);
  }, [isInstalled, reminderDismissed]);

  if (isInstalled) {
    return null;
  }

  const inIframe =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  return (
    <>
      {/* Non-obstructive Floating Installation Reminder Card */}
      {readyToShow && !reminderDismissed && (
        <aside
          aria-label="Install MeridianFX App Reminder"
          className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-5 lg:bottom-5 z-40 sm:w-[360px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <img
              src="/pwa-192x192.png"
              alt="MeridianFX App Icon"
              className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#881337] dark:text-rose-400">
                    MeridianFX App
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    Install for Faster Access & Alerts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={dismissReminder}
                  aria-label="Dismiss install reminder"
                  className="p-1.5 -mt-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Launch straight from your home screen with instant Forex signal push notifications and offline Academy study.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void install();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-bold tracking-wide text-white hover:bg-[#166534] transition-colors min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>INSTALL APP</span>
                </button>
                <button
                  type="button"
                  onClick={dismissReminder}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Guided Native / iOS Installation Modal */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install MeridianFX App Guide"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="MeridianFX App Icon"
                  className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Install MeridianFX App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standalone experience · Live signals · Push notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGuideModal}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-3 rounded-xl border border-rose-200 dark:border-slate-800 bg-rose-50/60 dark:bg-slate-900/60 p-4">
                  <p className="font-bold text-[#881337] dark:text-rose-400">
                    Install on iPhone & iPad (Safari):
                  </p>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#881337] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="flex items-start gap-2">
                      <Share className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
                      <p>
                        Tap the <strong>Share</strong> button in Safari&apos;s toolbar (bottom on iPhone, top-right on iPad).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#881337] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="flex items-start gap-2">
                      <PlusSquare className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
                      <p>
                        Scroll down the menu and tap <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#15803D] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p>
                        Tap <strong>Add</strong> in the top-right corner, then open MeridianFX from your Home Screen to enable push alerts.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-emerald-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/60 p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {isAndroid ? 'Install on Android (Chrome / Edge):' : 'Install on Desktop or Mobile Browser:'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {isInstallable
                          ? 'Your browser install prompt is ready—tap Install Now below to launch the installation dialog.'
                          : inIframe
                            ? 'Browsers require opening the standalone HTTPS page outside an embedded preview frame to trigger the native OS install dialog. Open this page in a top-level browser tab or tap the browser menu (⋮) → Install App.'
                            : 'Tap the browser menu (⋮) or the Install App icon in the address bar and choose "Install MeridianFX" or "Add to Home Screen".'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#15803D] dark:text-emerald-400 pt-1">
                    <BellRing className="w-4 h-4 shrink-0" />
                    <span>Includes full-screen standalone launch & instant push alerts.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              {isInstallable && !isIOS && (
                <button
                  type="button"
                  onClick={() => {
                    void install();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] py-2.5 text-sm font-bold text-white hover:bg-[#166534] transition-colors min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Now</span>
                </button>
              )}
              {inIframe && (
                <a
                  href={window.location.href}
                  target="_top"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#881337] py-2.5 px-4 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Standalone Tab</span>
                </a>
              )}
              <button
                type="button"
                onClick={closeGuideModal}
                className={`${isInstallable || inIframe ? 'px-4' : 'w-full'} rounded-lg border border-slate-300 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
