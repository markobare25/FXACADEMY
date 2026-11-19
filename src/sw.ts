/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  timestamp?: number;
  renotify?: boolean;
}

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache previously loaded educational materials, signals, and updates for offline reading
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/academy') ||
    url.pathname.startsWith('/api/signals') ||
    url.pathname.startsWith('/api/updates') ||
    url.pathname.startsWith('/api/settings'),
  new NetworkFirst({
    cacheName: 'meridianfx-content-cache',
    networkTimeoutSeconds: 4,
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

// Web Push Notification listener (works even when app/website is closed or backgrounded)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    subtitle?: string;
    url?: string;
    messageId?: string | null;
    publishedAt?: string;
    category?: string;
    tag?: string;
    icon?: string;
    image?: string;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MeridianFX', body: event.data.text() };
  }

  const title = payload.title || 'MeridianFX';
  const rawBody = (payload.body || 'New market update published in the Signals channel.').trim();
  const localTime = formatLocalTime(payload.publishedAt);
  const body =
    localTime && !rawBody.includes('UTC') && !rawBody.includes(localTime)
      ? `${rawBody} · ${localTime}`
      : rawBody;

  const publishedMs = payload.publishedAt ? Date.parse(payload.publishedAt) : Date.now();
  const targetUrl =
    payload.url || (payload.messageId ? `/signals?message=${payload.messageId}` : '/signals');

  const options: ExtendedNotificationOptions = {
    body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag:
      payload.tag ||
      (payload.messageId ? `mfx-msg-${payload.messageId}` : `mfx-${payload.category || 'alert'}`),
    renotify: false,
    timestamp: Number.isFinite(publishedMs) ? publishedMs : Date.now(),
    data: {
      url: targetUrl,
      messageId: payload.messageId || null,
      category: payload.category || 'general',
    },
    ...(payload.image ? { image: payload.image } : {}),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data || {}) as { url?: string; messageId?: string | null };
  const targetUrl =
    data.url || (data.messageId ? `/signals?message=${data.messageId}` : '/signals');
  const absoluteTarget = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          client.postMessage({
            type: 'mfx:open-notification-url',
            url: targetUrl,
            messageId: data.messageId || null,
          });
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTarget);
      }
      return undefined;
    })
  );
});
