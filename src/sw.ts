/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface ExtendedNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  timestamp?: number;
  renotify?: boolean;
  vibrate?: number[];
  actions?: ExtendedNotificationAction[];
}

interface PushSubscriptionChangeEvent extends ExtendableEvent {
  readonly newSubscription?: PushSubscription;
  readonly oldSubscription?: PushSubscription;
}

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Never cache auth, admin APIs, push registration/ack, live signal feeds, or dynamic counters
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/push/') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/admin/') ||
    url.pathname === '/api/signals/stream' ||
    url.pathname.startsWith('/api/signals/messages') ||
    url.pathname === '/api/signals' ||
    url.pathname === '/api/settings' ||
    url.pathname === '/api/updates/news' ||
    url.pathname === '/api/updates/calendar' ||
    url.searchParams.get('includeAll') === 'true',
  new NetworkOnly()
);

// Cache previously loaded educational materials and updates for offline reading
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/academy') ||
    url.pathname.startsWith('/api/updates'),
  new NetworkFirst({
    cacheName: 'meridianfx-content-cache',
    networkTimeoutSeconds: 2,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/src/assets/'),
  new CacheFirst({
    cacheName: 'meridianfx-media-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);

function formatLocalTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function ackPushEvent(deliveryId: string | undefined, eventName: 'received' | 'clicked') {
  if (!deliveryId || deliveryId.startsWith('test-')) return;
  try {
    await fetch('/api/push/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryId, event: eventName }),
      keepalive: true,
    });
  } catch {
    // Ignore transient offline ack errors
  }
}

// Web Push Notification listener (works when app/website is closed, backgrounded, or phone screen is locked)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    subtitle?: string;
    url?: string;
    messageId?: string | null;
    jobId?: string | null;
    deliveryId?: string;
    priority?: 'normal' | 'urgent';
    forceShow?: boolean;
    publishedAt?: string;
    category?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    image?: string;
    silent?: boolean;
    badgeCount?: number;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MeridianFX', body: event.data.text() };
  }

  const title = (payload.title || 'MeridianFX').trim();
  const rawBody = (payload.body || 'New market update published in MeridianFX.').trim();
  const localTime = formatLocalTime(payload.publishedAt);
  const body =
    localTime && !rawBody.includes('UTC') && !rawBody.includes(localTime)
      ? `${rawBody} · ${localTime}`
      : rawBody;

  const publishedMs = payload.publishedAt ? Date.parse(payload.publishedAt) : Date.now();
  const targetUrl =
    payload.url || (payload.messageId ? `/signals?message=${payload.messageId}` : '/signals');
  const silent = Boolean(payload.silent);
  const isUrgent = payload.priority === 'urgent';

  const options: ExtendedNotificationOptions = {
    body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag:
      payload.tag ||
      (payload.messageId
        ? `mfx-msg-${payload.messageId}`
        : `mfx-${payload.category || 'alert'}-${Date.now()}`),
    renotify: !silent,
    silent,
    ...(silent
      ? {}
      : { vibrate: isUrgent ? [260, 90, 260, 90, 260] : [220, 90, 220] }),
    timestamp: Number.isFinite(publishedMs) ? publishedMs : Date.now(),
    actions: [{ action: 'open', title: 'Open Message' }],
    data: {
      url: targetUrl,
      messageId: payload.messageId || null,
      deliveryId: payload.deliveryId || null,
      category: payload.category || 'general',
    },
    ...(payload.image ? { image: payload.image } : {}),
  };

  const work = async () => {
    const ackPromise = ackPushEvent(payload.deliveryId, 'received');

    // Show OS top-of-phone notification whenever the user is not actively viewing that feed
    if (!payload.forceShow) {
      const targetPath = (() => {
        try {
          return new URL(targetUrl, self.location.origin).pathname;
        } catch {
          return '/signals';
        }
      })();
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const activeViewingClients = allClients.filter((client) => {
        try {
          const u = new URL(client.url);
          const samePath =
            u.pathname === targetPath ||
            u.pathname === `${targetPath}/` ||
            (targetPath.startsWith('/signals') &&
              (u.pathname === '/signals' || u.pathname === '/signals/')) ||
            (targetPath.startsWith('/updates') &&
              (u.pathname === '/updates' || u.pathname === '/updates/'));
          return (
            client.focused &&
            client.visibilityState === 'visible' &&
            u.origin === self.location.origin &&
            samePath
          );
        } catch {
          return false;
        }
      });

      if (activeViewingClients.length > 0) {
        for (const client of activeViewingClients) {
          client.postMessage({
            type: 'mfx:push-received-foreground',
            messageId: payload.messageId || null,
            url: targetUrl,
          });
        }
        await ackPromise;
        return;
      }
    }

    await self.registration.showNotification(title, options);
    const nav = self.navigator as Navigator & {
      setAppBadge?: (contents?: number) => Promise<void>;
    };
    if (typeof nav?.setAppBadge === 'function') {
      try {
        const activeNotifs = await self.registration.getNotifications();
        const count =
          typeof payload.badgeCount === 'number' && payload.badgeCount > 0
            ? payload.badgeCount
            : Math.max(activeNotifs.length, 1);
        await nav.setAppBadge(count);
      } catch {
        // Badging API unsupported in this browser context
      }
    }
    await ackPromise;
  };

  event.waitUntil(work());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data || {}) as {
    url?: string;
    messageId?: string | null;
    deliveryId?: string | null;
  };
  const targetUrl =
    data.url || (data.messageId ? `/signals?message=${data.messageId}` : '/signals');
  const absoluteTarget = new URL(targetUrl, self.location.origin).href;

  const work = async () => {
    const ackPromise = ackPushEvent(data.deliveryId || undefined, 'clicked');
    const nav = self.navigator as Navigator & {
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav?.clearAppBadge === 'function') {
      try {
        const remaining = await self.registration.getNotifications();
        if (remaining.length === 0) {
          await nav.clearAppBadge();
        }
      } catch {
        // ignore
      }
    }

    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        client.postMessage({
          type: 'mfx:open-notification-url',
          url: targetUrl,
          messageId: data.messageId || null,
        });
        await ackPromise;
        return client;
      }
    }
    await ackPromise;
    if (self.clients.openWindow) {
      return self.clients.openWindow(absoluteTarget);
    }
    return undefined;
  };

  event.waitUntil(work());
});

// Automatically re-subscribe if browser/OS rotates the Web Push token in the background
self.addEventListener('pushsubscriptionchange', (rawEvent) => {
  const event = rawEvent as PushSubscriptionChangeEvent;
  const renew = async () => {
    let subscription = event.newSubscription;
    if (!subscription) {
      let appServerKey: BufferSource | undefined =
        event.oldSubscription?.options?.applicationServerKey || undefined;
      if (!appServerKey) {
        const res = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
        if (!res.ok) return;
        const { publicKey } = (await res.json()) as { publicKey: string };
        appServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
      }
      subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        old_endpoint: event.oldSubscription?.endpoint,
      }),
    });
  };

  event.waitUntil(renew().catch(() => undefined));
});
