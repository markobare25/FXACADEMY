/* MeridianFX Background Web Push Service Worker */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function ackDelivery(deliveryId, eventName) {
  if (!deliveryId || String(deliveryId).startsWith('test-')) return Promise.resolve();
  return fetch('/api/push/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryId, event: eventName }),
    keepalive: true,
  }).catch(() => undefined);
}

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'MeridianFX', body: event.data.text() };
    }
  }

  const title = String(payload.title || 'MeridianFX Alert').trim();
  const body = String(payload.body || 'New trading update is live on MeridianFX.').trim();
  const url = String(payload.url || '/signals').trim() || '/signals';
  const tag = String(
    payload.tag ||
      (payload.messageId ? `mfx-signal-${payload.messageId}` : `mfx-alert-${Date.now()}`)
  );

  const notificationPromise = self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag,
    data: {
      url,
      messageId: payload.messageId || null,
      deliveryId: payload.deliveryId || null,
    },
  });

  const badgePromise = (async () => {
    const nav = self.navigator;
    if (nav && typeof nav.setAppBadge === 'function') {
      try {
        const current = await self.registration.getNotifications();
        await nav.setAppBadge(Math.max(current.length, 1));
      } catch {
        // Badging API not supported on this platform
      }
    }
  })();

  event.waitUntil(
    Promise.all([
      notificationPromise,
      badgePromise,
      ackDelivery(payload.deliveryId, 'received'),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = (event.notification && event.notification.data) || {};
  const targetUrl = String(data.url || '/signals');
  const absoluteTarget = new URL(targetUrl, self.location.origin).href;

  const openOrFocus = async () => {
    const ackPromise = ackDelivery(data.deliveryId, 'clicked');

    const nav = self.navigator;
    if (nav && typeof nav.clearAppBadge === 'function') {
      try {
        const remaining = await self.registration.getNotifications();
        if (remaining.length === 0) {
          await nav.clearAppBadge();
        }
      } catch {
        // Ignore badge clear failure
      }
    }

    const clientList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of clientList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        try {
          client.postMessage({
            type: 'mfx:open-notification-url',
            url: targetUrl,
            messageId: data.messageId || null,
          });
        } catch {
          // Ignore postMessage failure
        }
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

  event.waitUntil(openOrFocus());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  const renew = async () => {
    let subscription = event.newSubscription;
    if (!subscription) {
      let appServerKey = event.oldSubscription && event.oldSubscription.options
        ? event.oldSubscription.options.applicationServerKey
        : undefined;

      if (!appServerKey) {
        const res = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const base64String = String(json.publicKey || '');
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = self.atob(base64);
        const bytes = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) {
          bytes[i] = rawData.charCodeAt(i);
        }
        appServerKey = bytes;
      }

      subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys || !subJson.keys.p256dh || !subJson.keys.auth) {
      return;
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
        old_endpoint: event.oldSubscription ? event.oldSubscription.endpoint : undefined,
      }),
    });
  };

  event.waitUntil(renew().catch(() => undefined));
});
