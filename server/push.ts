import crypto from 'node:crypto';
import * as webpush from 'web-push';
import { db, logSystemEvent } from './db.ts';
import type { NotificationPreferences } from '../src/types.ts';

let vapidReady = false;

export function ensureVapidKeys(): { publicKey: string; privateKey: string } {
  const pubRow = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('vapid_public_key') as { value: string } | undefined;
  const privRow = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('vapid_private_key') as { value: string } | undefined;

  let publicKey = pubRow?.value || process.env.VAPID_PUBLIC_KEY || '';
  let privateKey = privRow?.value || process.env.VAPID_PRIVATE_KEY || '';

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    db.prepare('INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)').run(
      'vapid_public_key',
      publicKey
    );
    db.prepare('INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)').run(
      'vapid_private_key',
      privateKey
    );
  }

  if (!vapidReady) {
    const contactEmailRow = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('contact_email') as { value: string } | undefined;
    const contactEmail = contactEmailRow?.value || 'desk@meridianfx.com';
    webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
    vapidReady = true;
  }

  return { publicKey, privateKey };
}

export interface DispatchPayload {
  title: string;
  body: string;
  category: keyof NotificationPreferences | 'general';
  linkUrl?: string;
  targetUserIds?: string[] | null;
  broadcastWs?: (event: string, data: unknown) => void;
}

export async function dispatchNotification(payload: DispatchPayload): Promise<{
  notificationIds: string[];
  targetedSubscriptions: number;
  delivered: number;
  failed: number;
}> {
  ensureVapidKeys();
  const now = new Date().toISOString();
  const linkUrl = payload.linkUrl || '/';
  const notificationIds: string[] = [];

  const pushEnabledSetting = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('push_enabled') as { value: string } | undefined;
  const isPushEnabled = pushEnabledSetting ? pushEnabledSetting.value === 'true' : true;

  // 1. Insert in-app notification(s)
  if (payload.targetUserIds && payload.targetUserIds.length > 0) {
    const insertNotif = db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, category, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    );
    for (const uid of payload.targetUserIds) {
      const nid = crypto.randomUUID();
      insertNotif.run(nid, uid, payload.title, payload.body, payload.category, linkUrl, now);
      notificationIds.push(nid);
    }
  } else {
    // Global broadcast notification (user_id IS NULL)
    const nid = crypto.randomUUID();
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, category, link_url, is_read, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, 0, ?)`
    ).run(nid, payload.title, payload.body, payload.category, linkUrl, now);
    notificationIds.push(nid);
  }

  if (payload.broadcastWs) {
    payload.broadcastWs('notification:new', {
      id: notificationIds[0],
      title: payload.title,
      body: payload.body,
      category: payload.category,
      link_url: linkUrl,
      target_user_ids: payload.targetUserIds || null,
      created_at: now,
    });
  }

  if (!isPushEnabled) {
    return { notificationIds, targetedSubscriptions: 0, delivered: 0, failed: 0 };
  }

  // 2. Query matching push subscriptions respecting user category preferences
  const subs = db
    .prepare(
      `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth, u.notification_prefs, u.status
       FROM push_subscriptions ps
       LEFT JOIN users u ON ps.user_id = u.id`
    )
    .all() as Array<{
    id: string;
    user_id: string | null;
    endpoint: string;
    p256dh: string;
    auth: string;
    notification_prefs: string | null;
    status: string | null;
  }>;

  const eligibleSubs = subs.filter((sub) => {
    if (sub.status === 'suspended') return false;
    if (payload.targetUserIds && payload.targetUserIds.length > 0) {
      if (!sub.user_id || !payload.targetUserIds.includes(sub.user_id)) return false;
    }
    if (sub.notification_prefs && payload.category !== 'general') {
      try {
        const prefs = JSON.parse(sub.notification_prefs) as Partial<NotificationPreferences>;
        if (prefs[payload.category as keyof NotificationPreferences] === false) {
          return false;
        }
      } catch {
        // default allow
      }
    }
    return true;
  });

  const pushMessage = JSON.stringify({
    title: payload.title,
    body: payload.body,
    category: payload.category,
    url: linkUrl,
    icon: '/pwa-192x192.png',
    tag: `meridianfx-${payload.category}-${Date.now()}`,
  });

  let delivered = 0;
  let failed = 0;

  await Promise.all(
    eligibleSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushMessage
        );
        delivered++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
        } else {
          logSystemEvent('warn', 'web-push', `Push delivery failed (${statusCode || 'err'}): ${String(err)}`);
        }
      }
    })
  );

  db.prepare(
    `INSERT INTO push_dispatch_logs (id, title, category, total_targeted, delivered_count, failed_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    payload.title,
    payload.category,
    eligibleSubs.length,
    delivered,
    failed,
    now
  );

  return {
    notificationIds,
    targetedSubscriptions: eligibleSubs.length,
    delivered,
    failed,
  };
}
