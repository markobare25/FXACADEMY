import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'mfx_pwa_install_dismissed_v1';
const INSTALLED_KEY = 'mfx_pwa_installed_v1';

interface PWAState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  reminderDismissed: boolean;
  showGuideModal: boolean;
}

const detectStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

const detectIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isAppleMobile = /iphone|ipad|ipod/.test(ua);
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && (window.navigator.maxTouchPoints || 0) > 1;
  return isAppleMobile || isIPadOS;
};

const detectAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /android/.test(window.navigator.userAgent.toLowerCase());
};

const readStorage = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const writeStorage = (key: string, val: boolean) => {
  try {
    if (val) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

let state: PWAState = {
  deferredPrompt: null,
  isInstalled: detectStandalone() || readStorage(INSTALLED_KEY),
  isIOS: detectIOS(),
  isAndroid: detectAndroid(),
  reminderDismissed: readStorage(DISMISS_KEY),
  showGuideModal: false,
};

const listeners = new Set<(s: PWAState) => void>();

function emit(patch: Partial<PWAState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

let initialized = false;
function initGlobalListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Capture browser's native install prompt immediately at page boot
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    writeStorage(INSTALLED_KEY, false);
    emit({
      deferredPrompt: e as BeforeInstallPromptEvent,
      isInstalled: false,
    });
  });

  window.addEventListener('appinstalled', () => {
    writeStorage(INSTALLED_KEY, true);
    emit({
      deferredPrompt: null,
      isInstalled: true,
      showGuideModal: false,
    });
    window.dispatchEvent(new Event('mfx:pwa-installed'));
  });

  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const onDisplayChange = (evt: MediaQueryListEvent) => {
    if (evt.matches) {
      writeStorage(INSTALLED_KEY, true);
      emit({ isInstalled: true, deferredPrompt: null, showGuideModal: false });
      window.dispatchEvent(new Event('mfx:pwa-installed'));
    }
  };
  mediaQuery.addEventListener?.('change', onDisplayChange);

  // Also check getInstalledRelatedApps if supported by Chromium
  const nav = window.navigator as unknown as {
    getInstalledRelatedApps?: () => Promise<Array<{ id?: string; platform?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps === 'function') {
    nav
      .getInstalledRelatedApps()
      .then((apps) => {
        if (Array.isArray(apps) && apps.length > 0) {
          writeStorage(INSTALLED_KEY, true);
          emit({ isInstalled: true });
        }
      })
      .catch(() => undefined);
  }
}

initGlobalListeners();

export async function triggerPWAInstall(): Promise<'accepted' | 'dismissed' | 'guide'> {
  if (state.isInstalled) return 'accepted';

  if (state.deferredPrompt) {
    try {
      await state.deferredPrompt.prompt();
      const { outcome } = await state.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        writeStorage(INSTALLED_KEY, true);
        emit({ deferredPrompt: null, isInstalled: true, showGuideModal: false });
        return 'accepted';
      }
      emit({ deferredPrompt: null });
      return 'dismissed';
    } catch {
      emit({ showGuideModal: true });
      return 'guide';
    }
  }

  // Fallback for iOS Safari or browsers where native prompt hasn't fired / isn't supported
  emit({ showGuideModal: true });
  return 'guide';
}

export function dismissInstallReminder(): void {
  writeStorage(DISMISS_KEY, true);
  emit({ reminderDismissed: true });
}

export function openInstallGuideModal(): void {
  emit({ showGuideModal: true });
}

export function closeInstallGuideModal(): void {
  emit({ showGuideModal: false });
}

export function usePWAInstall() {
  const [snap, setSnap] = useState<PWAState>(state);

  useEffect(() => {
    initGlobalListeners();
    setSnap(state);
    listeners.add(setSnap);
    return () => {
      listeners.delete(setSnap);
    };
  }, []);

  return {
    isInstallable: Boolean(snap.deferredPrompt),
    isInstalled: snap.isInstalled,
    isIOS: snap.isIOS,
    isAndroid: snap.isAndroid,
    reminderDismissed: snap.reminderDismissed,
    showGuideModal: snap.showGuideModal,
    install: triggerPWAInstall,
    dismissReminder: dismissInstallReminder,
    openGuideModal: openInstallGuideModal,
    closeGuideModal: closeInstallGuideModal,
  };
}
