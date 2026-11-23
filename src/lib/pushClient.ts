import { apiFetch } from './api';
import { VAPID_PUBLIC_KEY } from '../../lib/vapidPublic';
import type { NotificationPreferences } from '../types';

export const DEFAULT_DEVICE_PREFS: NotificationPreferences = {
  signals: true,
  signal_updates: true,
  signal_chat: true,
  market_updates: true,
  academy: true,
  economic_calendar: true,
  announcements: true,
  sound_enabled: true,
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function getReadyServiceWorkerRegistration(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js').catch(() => undefined)
    || await navigator.serviceWorker.getRegistration().catch(() => undefined);
  if (existing && existing.active) return existing;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (reg.active) return reg;
  } catch {
    // ignore and await navigator.serviceWorker.ready
  }

  return await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error('Service worker is still initializing. Reload the page once and try again.')
          ),
        timeoutMs
      )
    ),
  ]);
}

async function resolveVapidPublicKey(): Promise<string> {
  try {
    const res = await apiFetch<{ publicKey?: string }>('/api/push/vapid-public-key');
    if (res?.publicKey) return res.publicKey;
  } catch {
    // Fallback to shared VAPID public key
  }
  return VAPID_PUBLIC_KEY;
}

const SIGNALS_MUTED_KEY = 'mfx_signals_muted_v1';

export function isSignalsMuted(): boolean {
  try {
    return localStorage.getItem(SIGNALS_MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSignalsMutedLocal(muted: boolean): void {
  try {
    localStorage.setItem(SIGNALS_MUTED_KEY, muted ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

export function detectPushPlatform(): 'android' | 'ios' | 'web' {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  ) {
    return 'ios';
  }
  return 'web';
}

export function detectBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Browser';
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/crios|chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Browser';
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await getReadyServiceWorkerRegistration(3000);
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function syncExistingPushSubscriptionIfGranted(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  try {
    const registration = await getReadyServiceWorkerRegistration(4000);
    let sub = await registration.pushManager.getSubscription();
    const publicKey = await resolveVapidPublicKey();
    const expectedKey = urlBase64ToUint8Array(publicKey);

    let oldEndpoint: string | undefined;
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expectedKey as unknown as BufferSource,
      });
    } else if (sub.options?.applicationServerKey) {
      const currentKey = new Uint8Array(sub.options.applicationServerKey);
      if (!uint8ArraysEqual(currentKey, expectedKey)) {
        oldEndpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => undefined);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: expectedKey as unknown as BufferSource,
        });
      }
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const status = await apiFetch<{ subscribed: boolean }>(
      `/api/push/status?endpoint=${encodeURIComponent(json.endpoint)}`
    ).catch(() => ({ subscribed: false }));

    if (!status.subscribed || oldEndpoint) {
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
          platform: detectPushPlatform(),
          browser_name: detectBrowserName(),
          ...(oldEndpoint ? { old_endpoint: oldEndpoint } : {}),
        }),
      });
    }
    return true;
  } catch {
    return false;
  }
}

let autoPushGestureBound = false;
let autoPushAttemptedThisLoad = false;

export async function autoEnablePushNotifications(): Promise<void> {
  if (!isPushSupported() || isSignalsMuted()) return;

  if (Notification.permission === 'granted') {
    await syncExistingPushSubscriptionIfGranted().catch(() => false);
    return;
  }

  if (Notification.permission === 'denied') return;

  const trySubscribe = async () => {
    if (Notification.permission === 'granted') {
      await syncExistingPushSubscriptionIfGranted().catch(() => false);
      return;
    }
    if (Notification.permission !== 'default') return;
    try {
      const res = await subscribeToPushNotifications();
      if (res.ok) return;
    } catch {
      // Browser may require a user gesture for Notification.requestPermission()
    }
  };

  if (!autoPushAttemptedThisLoad) {
    autoPushAttemptedThisLoad = true;
    await trySubscribe();
  }

  if (Notification.permission === 'default' && !autoPushGestureBound && typeof window !== 'undefined') {
    autoPushGestureBound = true;
    const onFirstGesture = () => {
      window.removeEventListener('pointerdown', onFirstGesture, true);
      window.removeEventListener('keydown', onFirstGesture, true);
      trySubscribe().catch(() => undefined);
    };
    window.addEventListener('pointerdown', onFirstGesture, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', onFirstGesture, { capture: true, once: true, passive: true });
  }
}

export async function subscribeToPushNotifications(
  prefs?: Partial<NotificationPreferences>
): Promise<{
  ok: boolean;
  permission: NotificationPermission;
  prefs?: NotificationPreferences;
  error?: string;
}> {
  if (!isPushSupported()) {
    const iosNotStandalone = detectPushPlatform() === 'ios' && !isStandalonePWA();
    return {
      ok: false,
      permission: 'denied',
      error: iosNotStandalone
        ? 'On iPhone/iPad, tap Safari Share → Add to Home Screen first, then open the installed MeridianFX app to enable push notifications.'
        : 'Push notifications require a modern browser or installed iOS 16.4+ Home Screen Web App.',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      permission,
      error:
        permission === 'denied'
          ? 'Notifications are blocked in your browser or device settings. Enable them to receive instant signal alerts.'
          : 'Notification permission was not granted.',
    };
  }

  try {
    const publicKey = await resolveVapidPublicKey();
    const expectedKey = urlBase64ToUint8Array(publicKey);
    const registration = await getReadyServiceWorkerRegistration();

    let subscription = await registration.pushManager.getSubscription();
    let oldEndpoint: string | undefined;

    if (subscription && subscription.options?.applicationServerKey) {
      const currentKey = new Uint8Array(subscription.options.applicationServerKey);
      if (!uint8ArraysEqual(currentKey, expectedKey)) {
        oldEndpoint = subscription.endpoint;
        await subscription.unsubscribe().catch(() => undefined);
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expectedKey as unknown as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error('Browser generated an incomplete push subscription.');
    }

    const res = await apiFetch<{ prefs?: NotificationPreferences }>('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        platform: detectPushPlatform(),
        browser_name: detectBrowserName(),
        ...(oldEndpoint ? { old_endpoint: oldEndpoint } : {}),
        ...(prefs ? { prefs } : {}),
      }),
    });

    return { ok: true, permission, prefs: res.prefs };
  } catch (err) {
    return {
      ok: false,
      permission,
      error: err instanceof Error ? err.message : 'Failed to register push subscription.',
    };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await getReadyServiceWorkerRegistration(3000);
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await apiFetch('/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
  } catch {
    // ignore errors
  }
}

export async function getDevicePushPreferences(): Promise<{
  prefs: NotificationPreferences;
  subscribed: boolean;
  isMuted?: boolean;
}> {
  const sub = await getCurrentPushSubscription();
  const query = sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : '';
  return apiFetch<{ prefs: NotificationPreferences; subscribed: boolean; isMuted?: boolean }>(
    `/api/push/preferences${query}`,
    { cache: 'no-store' }
  );
}

export async function saveDevicePushPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ ok: boolean; prefs: NotificationPreferences }> {
  const sub = await getCurrentPushSubscription();
  return apiFetch<{ ok: boolean; prefs: NotificationPreferences }>('/api/push/preferences', {
    method: 'PATCH',
    body: JSON.stringify({
      ...(sub ? { endpoint: sub.endpoint } : {}),
      prefs,
    }),
  });
}

export async function sendTestPushNotification(): Promise<{ ok: boolean; statusCode?: number }> {
  const sub = await getCurrentPushSubscription();
  return apiFetch<{ ok: boolean; statusCode?: number }>('/api/push/test', {
    method: 'POST',
    body: JSON.stringify(sub ? { endpoint: sub.endpoint } : {}),
  });
}

export async function muteSignalChannelPush(): Promise<{ muted: boolean }> {
  setSignalsMutedLocal(true);
  try {
    const sub = await getCurrentPushSubscription();
    await apiFetch('/api/push/mute', {
      method: 'POST',
      body: JSON.stringify({
        ...(sub ? { endpoint: sub.endpoint } : {}),
        muted: true,
      }),
    });
  } catch {
    // localStorage state still tracks client preference if offline
  }
  return { muted: true };
}

export async function unmuteSignalChannelPush(): Promise<{
  muted: boolean;
  permission?: NotificationPermission;
  error?: string;
}> {
  setSignalsMutedLocal(false);
  const unmutedPrefs: Partial<NotificationPreferences> = {
    signals: true,
    signal_updates: true,
    signal_chat: true,
    market_updates: true,
    announcements: true,
    sound_enabled: true,
  };
  let permission: NotificationPermission | undefined;
  let error: string | undefined;

  if (isPushSupported()) {
    const subRes = await subscribeToPushNotifications(unmutedPrefs);
    permission = subRes.permission;
    if (!subRes.ok) {
      error = subRes.error;
    }
  }

  try {
    const sub = await getCurrentPushSubscription();
    await apiFetch('/api/push/mute', {
      method: 'POST',
      body: JSON.stringify({
        ...(sub ? { endpoint: sub.endpoint } : {}),
        muted: false,
      }),
    });
  } catch {
    // ignore transient network failure
  }
  return { muted: false, permission, error };
}
