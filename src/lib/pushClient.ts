import { apiFetch } from './api';
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

async function getReadyServiceWorkerRegistration(timeoutMs = 6000): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing && existing.active) return existing;

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

export function detectPushPlatform(): 'android' | 'ios' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  ) {
    return 'ios';
  }
  return 'desktop';
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
    if (!sub) return false;

    const { publicKey } = await apiFetch<{ publicKey: string }>('/api/push/vapid-public-key');
    const expectedKey = urlBase64ToUint8Array(publicKey);
    const currentKeyBuf = sub.options?.applicationServerKey;

    let oldEndpoint: string | undefined;
    if (currentKeyBuf) {
      const currentKey = new Uint8Array(currentKeyBuf);
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
          ...(oldEndpoint ? { old_endpoint: oldEndpoint } : {}),
        }),
      });
    }
    return true;
  } catch {
    return false;
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
    return {
      ok: false,
      permission: 'denied',
      error: 'Push notifications require a modern browser or installed iOS 16.4+ Home Screen Web App.',
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
    const { publicKey } = await apiFetch<{ publicKey: string }>('/api/push/vapid-public-key');
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
}> {
  const sub = await getCurrentPushSubscription();
  const query = sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : '';
  return apiFetch<{ prefs: NotificationPreferences; subscribed: boolean }>(
    `/api/push/preferences${query}`
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
