import { apiFetch } from './api';

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
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function syncExistingPushSubscriptionIfGranted(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  try {
    const sub = await getCurrentPushSubscription();
    if (!sub) return false;
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const status = await apiFetch<{ subscribed: boolean }>(
      `/api/push/status?endpoint=${encodeURIComponent(json.endpoint)}`
    ).catch(() => ({ subscribed: false }));

    if (!status.subscribed) {
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
          platform: detectPushPlatform(),
        }),
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function subscribeToPushNotifications(): Promise<{
  ok: boolean;
  permission: NotificationPermission;
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
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error('Browser generated an incomplete push subscription.');
    }

    await apiFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        platform: detectPushPlatform(),
      }),
    });

    return { ok: true, permission };
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
    const registration = await navigator.serviceWorker.ready;
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
