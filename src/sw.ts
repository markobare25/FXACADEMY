/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

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

// Web Push Notification listener (works even when app/website is closed)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    url?: string;
    category?: string;
    tag?: string;
    icon?: string;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MeridianFX Alert', body: event.data.text() };
  }

  const title = payload.title || 'MeridianFX Market Alert';
  const options: NotificationOptions = {
    body: payload.body || 'New market intelligence available.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag || `meridianfx-${payload.category || 'alert'}-${Date.now()}`,
    data: {
      url: payload.url || '/signals',
      category: payload.category || 'general',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return (client as WindowClient).navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
