import crypto from 'node:crypto';
import http2 from 'node:http2';
import * as webpush from 'web-push';
import { db, logSystemEvent } from './db.ts';
import { normalizeNotificationPrefs } from './auth.ts';
import type {
  NotificationPreferences,
  PushDeliveryRecord,
  PushInfrastructureStatus,
  PushJobSummary,
  PushSubscriptionSummary,
  SignalChatPriority,
} from '../src/types.ts';

let vapidReady = false;
let lastVapidFingerprint = '';
let vapidSource: 'env' | 'database' = 'database';
let cachedVapidPublic = '';
let wsBroadcaster: ((event: string, data: unknown) => void) | null = null;
let queueProcessingPromise: Promise<void> | null = null;

// Cached FCM OAuth2 access token when using FIREBASE_SERVICE_ACCOUNT_JSON
let cachedFcmAccessToken: { token: string; expiresAtMs: number; projectId: string } | null = null;

const RETRY_BACKOFF_MS = [5_000, 30_000, 120_000];
const DEFAULT_MAX_ATTEMPTS = 4;

export type PushCategory = keyof Omit<NotificationPreferences, 'sound_enabled'> | 'general';
export type PushTargetGroup = 'all' | 'registered' | 'verified' | 'admins_mods' | 'selected';

export function setPushWsBroadcaster(fn: (event: string, data: unknown) => void): void {
  wsBroadcaster = fn;
}

export function ensureVapidKeys(): { publicKey: string; privateKey: string; source: 'env' | 'database' } {
  const envPublic = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const envPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();

  let publicKey = '';
  let privateKey = '';

  if (envPublic && envPrivate) {
    publicKey = envPublic;
    privateKey = envPrivate;
    vapidSource = 'env';
  } else {
    vapidSource = 'database';
    const pubRow = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('vapid_public_key') as { value: string } | undefined;
    const privRow = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('vapid_private_key') as { value: string } | undefined;

    publicKey = pubRow?.value || '';
    privateKey = privRow?.value || '';

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
  }

  cachedVapidPublic = publicKey;
  const fingerprint = `${publicKey}:${privateKey.slice(0, 8)}`;
  if (!vapidReady || lastVapidFingerprint !== fingerprint) {
    const contactEmailRow = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('contact_email') as { value: string } | undefined;
    const rawEmail = (contactEmailRow?.value || 'desk@meridianfx.com').trim();
    const safeEmail = rawEmail.includes('@') ? rawEmail : 'desk@meridianfx.com';
    webpush.setVapidDetails(`mailto:${safeEmail}`, publicKey, privateKey);
    vapidReady = true;
    lastVapidFingerprint = fingerprint;
  }

  return { publicKey, privateKey, source: vapidSource };
}

function parseServiceAccountJson(): {
  project_id: string;
  client_email: string;
  private_key: string;
} | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function getPushInfrastructureStatus(): PushInfrastructureStatus {
  const vapid = ensureVapidKeys();
  const sa = parseServiceAccountJson();
  const fcmServerKey = (process.env.FCM_SERVER_KEY || '').trim();

  const apnsKeyId = (process.env.APNS_KEY_ID || '').trim();
  const apnsTeamId = (process.env.APNS_TEAM_ID || '').trim();
  const apnsBundleId = (process.env.APNS_BUNDLE_ID || '').trim();
  const apnsPrivateKey = (process.env.APNS_PRIVATE_KEY || '').trim();
  const apnsMissing: string[] = [];
  if (!apnsKeyId) apnsMissing.push('APNS_KEY_ID');
  if (!apnsTeamId) apnsMissing.push('APNS_TEAM_ID');
  if (!apnsBundleId) apnsMissing.push('APNS_BUNDLE_ID');
  if (!apnsPrivateKey) apnsMissing.push('APNS_PRIVATE_KEY');

  return {
    web_push: {
      ready: Boolean(vapid.publicKey && vapid.privateKey),
      source: vapid.source,
      public_key_prefix: `${(cachedVapidPublic || vapid.publicKey).slice(0, 14)}...`,
      supports: 'Desktop Browsers, Android Chrome/Edge & iOS 16.4+ Home Screen PWA',
    },
    fcm: {
      ready: Boolean(sa || fcmServerKey),
      mode: sa ? 'service_account' : fcmServerKey ? 'legacy_server_key' : 'unconfigured',
      missing_env: sa || fcmServerKey ? [] : ['FIREBASE_SERVICE_ACCOUNT_JSON (or FCM_SERVER_KEY)'],
    },
    apns: {
      ready: apnsMissing.length === 0,
      environment:
        apnsMissing.length === 0
          ? process.env.APNS_PRODUCTION === 'true'
            ? 'production'
            : 'sandbox'
          : 'unconfigured',
      missing_env: apnsMissing,
    },
  };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getFcmOAuthToken(): Promise<{ token: string; projectId: string }> {
  const sa = parseServiceAccountJson();
  if (!sa) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  }
  if (cachedFcmAccessToken && Date.now() < cachedFcmAccessToken.expiresAtMs - 60_000) {
    return { token: cachedFcmAccessToken.token, projectId: cachedFcmAccessToken.projectId };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const signature = base64UrlEncode(signer.sign(sa.private_key));
  const assertion = `${header}.${claim}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || 'Failed to obtain FCM OAuth2 access token.');
  }
  cachedFcmAccessToken = {
    token: tokenData.access_token,
    expiresAtMs: Date.now() + Number(tokenData.expires_in || 3600) * 1000,
    projectId: sa.project_id,
  };
  return { token: cachedFcmAccessToken.token, projectId: sa.project_id };
}

async function sendFcmNativePush(
  token: string,
  payload: {
    title: string;
    body: string;
    url: string;
    messageId: string | null;
    priority: SignalChatPriority;
    imageUrl?: string | null;
    deliveryId: string;
  }
): Promise<number> {
  const sa = parseServiceAccountJson();
  const legacyKey = (process.env.FCM_SERVER_KEY || '').trim();

  if (sa) {
    const { token: oauthToken, projectId } = await getFcmOAuthToken();
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
          },
          android: {
            priority: payload.priority === 'urgent' ? 'HIGH' : 'NORMAL',
            ttl: '86400s',
            notification: {
              channel_id: 'meridianfx_signals',
              click_action: 'OPEN_SIGNAL',
            },
          },
          data: {
            url: payload.url,
            messageId: payload.messageId || '',
            deliveryId: payload.deliveryId,
            priority: payload.priority,
          },
        },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`FCM v1 error (${res.status}): ${txt.slice(0, 220)}`) as Error & {
        statusCode?: number;
      };
      err.statusCode = res.status;
      throw err;
    }
    return res.status;
  }

  if (legacyKey) {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${legacyKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        priority: payload.priority === 'urgent' ? 'high' : 'normal',
        time_to_live: 86400,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          url: payload.url,
          messageId: payload.messageId || '',
          deliveryId: payload.deliveryId,
        },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`FCM legacy error (${res.status}): ${txt.slice(0, 220)}`) as Error & {
        statusCode?: number;
      };
      err.statusCode = res.status;
      throw err;
    }
    return res.status;
  }

  const err = new Error(
    'Native FCM credentials missing (supply FIREBASE_SERVICE_ACCOUNT_JSON or FCM_SERVER_KEY).'
  ) as Error & { statusCode?: number };
  err.statusCode = 503;
  throw err;
}

async function sendApnsNativePush(
  deviceToken: string,
  payload: {
    title: string;
    body: string;
    url: string;
    messageId: string | null;
    priority: SignalChatPriority;
    sound: boolean;
    deliveryId: string;
  }
): Promise<number> {
  const keyId = (process.env.APNS_KEY_ID || '').trim();
  const teamId = (process.env.APNS_TEAM_ID || '').trim();
  const bundleId = (process.env.APNS_BUNDLE_ID || '').trim();
  const rawPrivateKey = (process.env.APNS_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');

  if (!keyId || !teamId || !bundleId || !rawPrivateKey) {
    const err = new Error(
      'Native APNs credentials missing (supply APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY).'
    ) as Error & { statusCode?: number };
    err.statusCode = 503;
    throw err;
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const claims = base64UrlEncode(
    JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) })
  );
  const sign = crypto.createSign('SHA256');
  sign.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${base64UrlEncode(sign.sign({ key: rawPrivateKey, dsaEncoding: 'ieee-p1363' }))}`;

  const host =
    process.env.APNS_PRODUCTION === 'true'
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';

  const apnsBody = JSON.stringify({
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: payload.sound ? 'default' : undefined,
      'mutable-content': 1,
    },
    url: payload.url,
    messageId: payload.messageId,
    deliveryId: payload.deliveryId,
  });

  return await new Promise<number>((resolve, reject) => {
    const client = http2.connect(host);
    client.on('error', (err) => {
      client.close();
      reject(err);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': payload.priority === 'urgent' ? '10' : '5',
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400),
      'content-type': 'application/json',
    });

    let statusCode = 500;
    let body = '';
    req.on('response', (headers) => {
      statusCode = Number(headers[':status'] || 500);
    });
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      client.close();
      if (statusCode >= 200 && statusCode < 300) {
        resolve(statusCode);
      } else {
        const err = new Error(`APNs error (${statusCode}): ${body.slice(0, 220)}`) as Error & {
          statusCode?: number;
        };
        err.statusCode = statusCode;
        reject(err);
      }
    });
    req.on('error', (err) => {
      client.close();
      reject(err);
    });
    req.write(apnsBody);
    req.end();
  });
}

export interface DispatchPayload {
  title: string;
  body: string;
  category: PushCategory;
  linkUrl?: string;
  signalMessageId?: string | null;
  imageUrl?: string | null;
  priority?: SignalChatPriority;
  forceShow?: boolean;
  publishedAt?: string;
  dedupKey?: string;
  targetUserIds?: string[] | null;
  targetGroup?: PushTargetGroup;
  respectPrefs?: boolean;
  sound?: boolean;
  broadcastWs?: (event: string, data: unknown) => void;
}

export interface DispatchResult {
  notificationIds: string[];
  targetedSubscriptions: number;
  queued: number;
  delivered: number;
  confirmed: number;
  failed: number;
  alreadyProcessed?: boolean;
  push_job: PushJobSummary;
}

function mapPushJobRow(row: Record<string, unknown>): PushJobSummary {
  return {
    id: String(row.id),
    dedup_key: String(row.dedup_key),
    signal_message_id: row.signal_message_id ? String(row.signal_message_id) : null,
    title: String(row.title),
    category: String(row.category),
    link_url: String(row.link_url || '/signals'),
    priority: (row.priority === 'urgent' ? 'urgent' : 'normal') as SignalChatPriority,
    published_at: String(row.published_at),
    status: String(row.status) as PushJobSummary['status'],
    total_targeted: Number(row.total_targeted || 0),
    queued_count: Number(row.queued_count || 0),
    delivered_count: Number(row.delivered_count || 0),
    confirmed_count: Number(row.confirmed_count || 0),
    failed_count: Number(row.failed_count || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function getPushJobSummary(jobId: string): PushJobSummary | null {
  const row = db.prepare('SELECT * FROM push_jobs WHERE id = ?').get(jobId) as
    | Record<string, unknown>
    | undefined;
  return row ? mapPushJobRow(row) : null;
}

export function getPushJobByDedupKey(dedupKey: string): PushJobSummary | null {
  const row = db.prepare('SELECT * FROM push_jobs WHERE dedup_key = ?').get(dedupKey) as
    | Record<string, unknown>
    | undefined;
  return row ? mapPushJobRow(row) : null;
}

export function listRecentPushJobs(limit = 30): PushJobSummary[] {
  const rows = db
    .prepare('SELECT * FROM push_jobs ORDER BY created_at DESC LIMIT ?')
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map(mapPushJobRow);
}

export function listRecentPushDeliveries(limit = 40): PushDeliveryRecord[] {
  const rows = db
    .prepare(
      `SELECT d.id, d.job_id, d.subscription_id, d.transport, d.status, d.attempts,
              d.status_code, d.last_error, d.delivered_at, d.device_received_at, d.opened_at, d.updated_at,
              ps.platform, ps.device_label
       FROM push_job_deliveries d
       LEFT JOIN push_subscriptions ps ON ps.id = d.subscription_id
       ORDER BY d.updated_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    job_id: String(r.job_id),
    subscription_id: String(r.subscription_id),
    platform: String(r.platform || 'web'),
    transport: String(r.transport || 'web_push'),
    device_label: r.device_label ? String(r.device_label) : null,
    status: String(r.status) as PushDeliveryRecord['status'],
    attempts: Number(r.attempts || 0),
    status_code: r.status_code !== null && r.status_code !== undefined ? Number(r.status_code) : null,
    last_error: r.last_error ? String(r.last_error) : null,
    delivered_at: r.delivered_at ? String(r.delivered_at) : null,
    device_received_at: r.device_received_at ? String(r.device_received_at) : null,
    opened_at: r.opened_at ? String(r.opened_at) : null,
    updated_at: String(r.updated_at),
  }));
}

export function listPushSubscriptions(limit = 100): {
  summary: {
    total_active: number;
    total_inactive: number;
    android: number;
    ios: number;
    web: number;
    desktop: number;
    by_transport: {
      web_push: number;
      fcm: number;
      apns: number;
    };
    last_sent_at: string | null;
    totals: {
      queued: number;
      delivered: number;
      confirmed: number;
      failed: number;
    };
  };
  subscriptions: PushSubscriptionSummary[];
} {
  const countsRow = db
    .prepare(
      `SELECT
         SUM(CASE WHEN COALESCE(active, 1) = 1 THEN 1 ELSE 0 END) as active_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 0 THEN 1 ELSE 0 END) as inactive_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND platform = 'android' THEN 1 ELSE 0 END) as android_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND platform = 'ios' THEN 1 ELSE 0 END) as ios_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND (platform IN ('web', 'desktop') OR platform IS NULL) THEN 1 ELSE 0 END) as web_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND COALESCE(transport, 'web_push') = 'web_push' THEN 1 ELSE 0 END) as web_push_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND transport = 'fcm' THEN 1 ELSE 0 END) as fcm_cnt,
         SUM(CASE WHEN COALESCE(active, 1) = 1 AND transport = 'apns' THEN 1 ELSE 0 END) as apns_cnt
       FROM push_subscriptions`
    )
    .get() as Record<string, number | null>;

  const jobTotals = db
    .prepare(
      `SELECT
         SUM(queued_count) as queued_cnt,
         SUM(delivered_count) as delivered_cnt,
         SUM(COALESCE(confirmed_count, 0)) as confirmed_cnt,
         SUM(failed_count) as failed_cnt,
         MAX(created_at) as last_sent_at
       FROM push_jobs`
    )
    .get() as {
    queued_cnt: number | null;
    delivered_cnt: number | null;
    confirmed_cnt: number | null;
    failed_cnt: number | null;
    last_sent_at: string | null;
  };

  const rows = db
    .prepare(
      `SELECT ps.id, ps.user_id, ps.platform, ps.transport, ps.browser_name, ps.device_label,
              ps.active, ps.sound_enabled, ps.failure_count, ps.last_error, ps.last_success_at,
              ps.created_at, ps.updated_at, u.name as user_name, u.email as user_email
       FROM push_subscriptions ps
       LEFT JOIN users u ON ps.user_id = u.id
       ORDER BY COALESCE(ps.updated_at, ps.created_at) DESC
       LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  const webCnt = Number(countsRow.web_cnt || 0);

  return {
    summary: {
      total_active: Number(countsRow.active_cnt || 0),
      total_inactive: Number(countsRow.inactive_cnt || 0),
      android: Number(countsRow.android_cnt || 0),
      ios: Number(countsRow.ios_cnt || 0),
      web: webCnt,
      desktop: webCnt,
      by_transport: {
        web_push: Number(countsRow.web_push_cnt || 0),
        fcm: Number(countsRow.fcm_cnt || 0),
        apns: Number(countsRow.apns_cnt || 0),
      },
      last_sent_at: jobTotals.last_sent_at || null,
      totals: {
        queued: Number(jobTotals.queued_cnt || 0),
        delivered: Number(jobTotals.delivered_cnt || 0),
        confirmed: Number(jobTotals.confirmed_cnt || 0),
        failed: Number(jobTotals.failed_cnt || 0),
      },
    },
    subscriptions: rows.map((r) => ({
      id: String(r.id),
      user_id: r.user_id ? String(r.user_id) : null,
      user_name: r.user_name ? String(r.user_name) : null,
      user_email: r.user_email ? String(r.user_email) : null,
      platform: String(r.platform === 'desktop' ? 'web' : r.platform || 'web'),
      transport: String(r.transport || 'web_push'),
      browser_name: r.browser_name ? String(r.browser_name) : null,
      device_label: r.device_label ? String(r.device_label) : null,
      active: Boolean(r.active),
      sound_enabled:
        r.sound_enabled === null || r.sound_enabled === undefined ? true : Boolean(r.sound_enabled),
      failure_count: Number(r.failure_count || 0),
      last_error: r.last_error ? String(r.last_error) : null,
      last_success_at: r.last_success_at ? String(r.last_success_at) : null,
      created_at: String(r.created_at),
      updated_at: r.updated_at ? String(r.updated_at) : null,
    })),
  };
}

export function cleanupInactivePushSubscriptions(olderThanDays = 30): { deleted: number } {
  const cutoffIso = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const info = db
    .prepare(
      `DELETE FROM push_subscriptions
       WHERE COALESCE(active, 1) = 0
         AND COALESCE(updated_at, created_at) <= ?`
    )
    .run(cutoffIso);
  return { deleted: info.changes };
}

function buildNotificationPreviewBody(rawBody: string): string {
  const cleanBody = rawBody.replace(/\s+/g, ' ').trim();
  if (!cleanBody) {
    return 'New update published in MeridianFX.';
  }
  return cleanBody.length > 220 ? `${cleanBody.slice(0, 217)}...` : cleanBody;
}

function recomputeAndPersistJobStats(
  jobId: string,
  broadcaster?: ((event: string, data: unknown) => void) | null
): PushJobSummary | null {
  const job = db.prepare('SELECT * FROM push_jobs WHERE id = ?').get(jobId) as
    | Record<string, unknown>
    | undefined;
  if (!job) return null;

  const counts = db
    .prepare(
      `SELECT
         COUNT(*) as total_cnt,
         SUM(CASE WHEN status IN ('queued', 'retrying') THEN 1 ELSE 0 END) as queued_cnt,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_cnt,
         SUM(CASE WHEN device_received_at IS NOT NULL THEN 1 ELSE 0 END) as confirmed_cnt,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_cnt
       FROM push_job_deliveries
       WHERE job_id = ?`
    )
    .get(jobId) as {
    total_cnt: number;
    queued_cnt: number | null;
    delivered_cnt: number | null;
    confirmed_cnt: number | null;
    failed_cnt: number | null;
  };

  const total = Number(counts.total_cnt || 0);
  const queued = Number(counts.queued_cnt || 0);
  const delivered = Number(counts.delivered_cnt || 0);
  const confirmed = Number(counts.confirmed_cnt || 0);
  const failed = Number(counts.failed_cnt || 0);

  let status: PushJobSummary['status'] = 'completed';
  if (queued > 0) {
    status = 'processing';
  } else if (failed > 0 && delivered === 0) {
    status = 'failed';
  } else if (failed > 0 && delivered > 0) {
    status = 'partial';
  } else {
    status = 'completed';
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE push_jobs SET
       status = ?,
       total_targeted = ?,
       queued_count = ?,
       delivered_count = ?,
       confirmed_count = ?,
       failed_count = ?,
       updated_at = ?
     WHERE id = ?`
  ).run(status, total, queued, delivered, confirmed, failed, now, jobId);

  db.prepare(
    `INSERT INTO push_dispatch_logs (id, title, category, total_targeted, delivered_count, failed_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       total_targeted = excluded.total_targeted,
       delivered_count = excluded.delivered_count,
       failed_count = excluded.failed_count`
  ).run(jobId, String(job.title), String(job.category), total, delivered, failed, String(job.created_at));

  const updated = getPushJobSummary(jobId);
  const emit = broadcaster || wsBroadcaster;
  if (updated && emit) {
    emit('push:job_updated', updated);
  }
  return updated;
}

export function recordPushReceipt(
  deliveryId: string,
  event: 'received' | 'clicked'
): PushJobSummary | null {
  if (!deliveryId) return null;
  const row = db
    .prepare('SELECT id, job_id, device_received_at, opened_at FROM push_job_deliveries WHERE id = ?')
    .get(deliveryId) as
    | { id: string; job_id: string; device_received_at: string | null; opened_at: string | null }
    | undefined;
  if (!row) return null;

  const now = new Date().toISOString();
  if (event === 'clicked') {
    db.prepare(
      `UPDATE push_job_deliveries
       SET device_received_at = COALESCE(device_received_at, ?),
           opened_at = COALESCE(opened_at, ?),
           updated_at = ?
       WHERE id = ?`
    ).run(now, now, now, deliveryId);
  } else {
    db.prepare(
      `UPDATE push_job_deliveries
       SET device_received_at = COALESCE(device_received_at, ?),
           updated_at = ?
       WHERE id = ?`
    ).run(now, now, deliveryId);
  }

  return recomputeAndPersistJobStats(row.job_id, wsBroadcaster);
}

function resolveGroupTargetUserIds(targetGroup?: PushTargetGroup): string[] | null {
  if (!targetGroup || targetGroup === 'all' || targetGroup === 'selected') {
    return null;
  }
  if (targetGroup === 'registered') {
    const rows = db
      .prepare(
        `SELECT id FROM users
         WHERE status = 'active'
           AND (role = 'admin' OR membership_expires_at IS NULL OR membership_expires_at = '' OR datetime(membership_expires_at) > datetime('now'))`
      )
      .all() as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }
  if (targetGroup === 'verified') {
    const rows = db
      .prepare(
        `SELECT id FROM users
         WHERE status = 'active' AND email_verified = 1
           AND (role = 'admin' OR membership_expires_at IS NULL OR membership_expires_at = '' OR datetime(membership_expires_at) > datetime('now'))`
      )
      .all() as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }
  if (targetGroup === 'admins_mods') {
    const rows = db
      .prepare("SELECT id FROM users WHERE status = 'active' AND role IN ('admin', 'moderator')")
      .all() as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }
  return null;
}

export async function dispatchNotification(payload: DispatchPayload): Promise<DispatchResult> {
  ensureVapidKeys();
  const now = new Date().toISOString();
  const publishedAt = payload.publishedAt || now;
  const linkUrl = payload.linkUrl || '/signals';
  const dedupKey = payload.dedupKey || `auto:${crypto.randomUUID()}`;
  const respectPrefs = payload.respectPrefs !== false;
  const soundAllowed = payload.sound !== false;
  const priority: SignalChatPriority = payload.priority === 'urgent' ? 'urgent' : 'normal';
  const targetGroup: PushTargetGroup =
    payload.targetGroup || (payload.targetUserIds?.length ? 'selected' : 'all');
  const resolvedTargetUsers =
    payload.targetUserIds && payload.targetUserIds.length > 0
      ? payload.targetUserIds
      : resolveGroupTargetUserIds(targetGroup);

  const emit = payload.broadcastWs || wsBroadcaster || undefined;
  if (payload.broadcastWs && !wsBroadcaster) {
    wsBroadcaster = payload.broadcastWs;
  }

  // Strict idempotency check
  const existingJob = getPushJobByDedupKey(dedupKey);
  if (existingJob) {
    return {
      notificationIds: [],
      targetedSubscriptions: existingJob.total_targeted,
      queued: existingJob.queued_count,
      delivered: existingJob.delivered_count,
      confirmed: existingJob.confirmed_count,
      failed: existingJob.failed_count,
      alreadyProcessed: true,
      push_job: existingJob,
    };
  }

  const pushEnabledSetting = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('push_enabled') as { value: string } | undefined;
  const isPushEnabled = pushEnabledSetting ? pushEnabledSetting.value === 'true' : true;

  const notificationIds: string[] = [];
  const jobId = crypto.randomUUID();
  const pushBody = buildNotificationPreviewBody(payload.body);

  const enqueueTx = db.transaction(() => {
    const raceCheck = db.prepare('SELECT * FROM push_jobs WHERE dedup_key = ?').get(dedupKey) as
      | Record<string, unknown>
      | undefined;
    if (raceCheck) {
      return {
        duplicate: mapPushJobRow(raceCheck),
        targetedCount: Number(raceCheck.total_targeted || 0),
      };
    }

    if (resolvedTargetUsers && resolvedTargetUsers.length > 0) {
      const insertNotif = db.prepare(
        `INSERT INTO notifications (id, user_id, title, body, category, link_url, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
      );
      for (const uid of resolvedTargetUsers) {
        const nid = crypto.randomUUID();
        insertNotif.run(nid, uid, payload.title, payload.body, payload.category, linkUrl, now);
        notificationIds.push(nid);
      }
    } else if (!resolvedTargetUsers) {
      const nid = crypto.randomUUID();
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, body, category, link_url, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, 0, ?)`
      ).run(nid, payload.title, payload.body, payload.category, linkUrl, now);
      notificationIds.push(nid);
    }

    let eligibleSubs: Array<{
      id: string;
      user_id: string | null;
      endpoint: string;
      transport: string | null;
      prefs_json: string | null;
      notification_prefs: string | null;
      status: string | null;
      role: string | null;
      email_verified: number | null;
    }> = [];

    if (isPushEnabled) {
      const subs = db
        .prepare(
          `SELECT ps.id, ps.user_id, ps.endpoint, ps.transport, ps.prefs_json,
                  u.notification_prefs, u.status, u.role, u.email_verified
           FROM push_subscriptions ps
           LEFT JOIN users u ON ps.user_id = u.id
           WHERE COALESCE(ps.active, 1) = 1`
        )
        .all() as typeof eligibleSubs;

      eligibleSubs = subs.filter((sub) => {
        if (sub.status === 'suspended') return false;
        if (targetGroup === 'registered' && !sub.user_id) return false;
        if (targetGroup === 'verified' && (!sub.user_id || !sub.email_verified)) return false;
        if (targetGroup === 'admins_mods' && sub.role !== 'admin' && sub.role !== 'moderator') {
          return false;
        }
        if (resolvedTargetUsers && resolvedTargetUsers.length > 0) {
          if (!sub.user_id || !resolvedTargetUsers.includes(sub.user_id)) return false;
        } else if (resolvedTargetUsers && resolvedTargetUsers.length === 0) {
          return false;
        }

        // Urgent broadcasts still respect category opt-outs unless respectPrefs === false
        if (respectPrefs && payload.category !== 'general') {
          const effectivePrefs = normalizeNotificationPrefs(
            sub.notification_prefs || sub.prefs_json || '{}'
          );
          const catKey = payload.category as keyof Omit<NotificationPreferences, 'sound_enabled'>;
          if (effectivePrefs[catKey] === false) {
            return false;
          }
        }
        return true;
      });
    }

    const initialStatus: PushJobSummary['status'] =
      eligibleSubs.length > 0 ? 'queued' : 'completed';

    db.prepare(
      `INSERT INTO push_jobs (
        id, dedup_key, signal_message_id, title, body, category, link_url,
        image_url, priority, published_at, sound, status, total_targeted, queued_count,
        delivered_count, confirmed_count, failed_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`
    ).run(
      jobId,
      dedupKey,
      payload.signalMessageId || null,
      payload.title,
      pushBody,
      payload.category,
      linkUrl,
      payload.imageUrl || null,
      priority,
      publishedAt,
      soundAllowed ? 1 : 0,
      initialStatus,
      eligibleSubs.length,
      eligibleSubs.length,
      now,
      now
    );

    const insertDelivery = db.prepare(
      `INSERT OR IGNORE INTO push_job_deliveries (
        id, job_id, subscription_id, endpoint, transport, status, attempts, max_attempts,
        next_attempt_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'queued', 0, ?, ?, ?)`
    );

    for (const sub of eligibleSubs) {
      insertDelivery.run(
        crypto.randomUUID(),
        jobId,
        sub.id,
        sub.endpoint,
        sub.transport || 'web_push',
        DEFAULT_MAX_ATTEMPTS,
        now,
        now
      );
    }

    db.prepare(
      `INSERT OR IGNORE INTO push_dispatch_logs (id, title, category, total_targeted, delivered_count, failed_count, created_at)
       VALUES (?, ?, ?, ?, 0, 0, ?)`
    ).run(jobId, payload.title, payload.category, eligibleSubs.length, now);

    return { duplicate: null as PushJobSummary | null, targetedCount: eligibleSubs.length };
  });

  const txResult = enqueueTx();
  if (txResult.duplicate) {
    return {
      notificationIds: [],
      targetedSubscriptions: txResult.duplicate.total_targeted,
      queued: txResult.duplicate.queued_count,
      delivered: txResult.duplicate.delivered_count,
      confirmed: txResult.duplicate.confirmed_count,
      failed: txResult.duplicate.failed_count,
      alreadyProcessed: true,
      push_job: txResult.duplicate,
    };
  }

  if (emit && notificationIds.length > 0) {
    emit('notification:new', {
      id: notificationIds[0],
      title: payload.title,
      body: payload.body,
      category: payload.category,
      link_url: linkUrl,
      target_user_ids: resolvedTargetUsers || null,
      created_at: now,
    });
  }

  if (txResult.targetedCount > 0) {
    await Promise.race([
      processPendingPushDeliveries({ jobId, forceShow: payload.forceShow, broadcastWs: emit }),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  }

  const finalSummary = getPushJobSummary(jobId)!;
  if (emit) {
    emit('push:job_updated', finalSummary);
  }

  return {
    notificationIds,
    targetedSubscriptions: finalSummary.total_targeted,
    queued: finalSummary.queued_count,
    delivered: finalSummary.delivered_count,
    confirmed: finalSummary.confirmed_count,
    failed: finalSummary.failed_count,
    push_job: finalSummary,
  };
}

export type WebPushSendFn = (
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  options?: { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }
) => Promise<unknown>;

function isPermanentInvalidSubscriptionError(statusCode: number | null, errMsg: string): boolean {
  if (statusCode === 404 || statusCode === 410) return true;
  if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
    const lower = errMsg.toLowerCase();
    return (
      lower.includes('unsubscribed') ||
      lower.includes('expired') ||
      lower.includes('not registered') ||
      lower.includes('unregistered') ||
      lower.includes('invalid') ||
      lower.includes('vapid') ||
      lower.includes('badjwt') ||
      lower.includes('baddevicetoken') ||
      lower.includes('mismatched')
    );
  }
  return false;
}

export async function sendDirectTestPush(subscriptionId: string): Promise<{
  ok: boolean;
  statusCode?: number;
  error?: string;
}> {
  ensureVapidKeys();
  const row = db
    .prepare(
      `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.transport, ps.token, ps.active, ps.sound_enabled, u.notification_prefs
       FROM push_subscriptions ps
       LEFT JOIN users u ON ps.user_id = u.id
       WHERE ps.id = ?`
    )
    .get(subscriptionId) as
    | {
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        transport: string | null;
        token: string | null;
        active: number;
        sound_enabled: number | null;
        notification_prefs: string | null;
      }
    | undefined;

  if (!row || !row.active) {
    return { ok: false, error: 'No active push subscription found for this device.' };
  }

  const userPrefs = row.notification_prefs ? normalizeNotificationPrefs(row.notification_prefs) : null;
  const soundEnabled = row.sound_enabled !== 0 && (userPrefs ? userPrefs.sound_enabled : true);
  const now = new Date().toISOString();
  const deliveryId = `test-${crypto.randomUUID()}`;

  const payloadObj = {
    title: 'MeridianFX · Test Notification',
    body: 'OS background & lock-screen push alerts are active for this device.',
    category: 'announcements',
    url: '/signals',
    priority: 'urgent' as const,
    forceShow: true,
    deliveryId,
    publishedAt: now,
    silent: !soundEnabled,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `mfx-test-${Date.now()}`,
  };

  try {
    let statusCode = 201;
    const transport = row.transport || 'web_push';
    if (transport === 'fcm' && row.token) {
      statusCode = await sendFcmNativePush(row.token, {
        title: payloadObj.title,
        body: payloadObj.body,
        url: payloadObj.url,
        messageId: null,
        priority: 'urgent',
        deliveryId,
      });
    } else if (transport === 'apns' && row.token) {
      statusCode = await sendApnsNativePush(row.token, {
        title: payloadObj.title,
        body: payloadObj.body,
        url: payloadObj.url,
        messageId: null,
        priority: 'urgent',
        sound: soundEnabled,
        deliveryId,
      });
    } else {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify(payloadObj),
        { TTL: 300, urgency: 'high' }
      );
    }
    db.prepare(
      'UPDATE push_subscriptions SET last_success_at = ?, last_error = NULL, failure_count = 0, updated_at = ? WHERE id = ?'
    ).run(now, now, row.id);
    return { ok: true, statusCode };
  } catch (err: unknown) {
    const statusCode =
      typeof (err as { statusCode?: unknown })?.statusCode === 'number'
        ? Number((err as { statusCode: number }).statusCode)
        : undefined;
    const errMsg = err instanceof Error ? err.message : String(err || 'Test push failed');

    if (isPermanentInvalidSubscriptionError(statusCode ?? null, errMsg)) {
      db.prepare(
        'UPDATE push_subscriptions SET active = 0, failure_count = COALESCE(failure_count, 0) + 1, last_error = ?, updated_at = ? WHERE id = ?'
      ).run(`HTTP ${statusCode ?? 'err'}: ${errMsg.slice(0, 240)}`, now, row.id);
    } else {
      db.prepare('UPDATE push_subscriptions SET last_error = ?, updated_at = ? WHERE id = ?').run(
        errMsg.slice(0, 240),
        now,
        row.id
      );
    }
    return { ok: false, statusCode, error: errMsg };
  }
}

export async function processPendingPushDeliveries(options?: {
  jobId?: string;
  forceShow?: boolean;
  sendFn?: WebPushSendFn;
  broadcastWs?: (event: string, data: unknown) => void;
}): Promise<number> {
  if (queueProcessingPromise && !options?.sendFn) {
    await queueProcessingPromise;
    return 0;
  }

  const run = async (): Promise<number> => {
    ensureVapidKeys();
    const sendFn: WebPushSendFn =
      options?.sendFn || ((sub, msg, opts) => webpush.sendNotification(sub, msg, opts));

    const nowIso = new Date().toISOString();
    const dueRows = db
      .prepare(
        `SELECT
           d.id as delivery_id,
           d.job_id,
           d.subscription_id,
           d.attempts,
           d.max_attempts,
           ps.endpoint,
           ps.p256dh,
           ps.auth,
           ps.transport,
           ps.token,
           ps.active as sub_active,
           ps.sound_enabled as sub_sound_enabled,
           u.notification_prefs as user_notification_prefs,
           pj.title as job_title,
           pj.body as job_body,
           pj.category as job_category,
           pj.link_url,
           pj.signal_message_id,
           pj.image_url,
           pj.priority as job_priority,
           pj.published_at,
           pj.sound as job_sound
         FROM push_job_deliveries d
         JOIN push_jobs pj ON pj.id = d.job_id
         JOIN push_subscriptions ps ON ps.id = d.subscription_id
         LEFT JOIN users u ON ps.user_id = u.id
         WHERE d.status IN ('queued', 'retrying')
           AND d.next_attempt_at <= ?
           ${options?.jobId ? 'AND d.job_id = ?' : ''}
         ORDER BY d.next_attempt_at ASC
         LIMIT 200`
      )
      .all(...(options?.jobId ? [nowIso, options.jobId] : [nowIso])) as Array<{
      delivery_id: string;
      job_id: string;
      subscription_id: string;
      attempts: number;
      max_attempts: number;
      endpoint: string;
      p256dh: string;
      auth: string;
      transport: string | null;
      token: string | null;
      sub_active: number;
      sub_sound_enabled: number | null;
      user_notification_prefs: string | null;
      job_title: string;
      job_body: string;
      job_category: string;
      link_url: string;
      signal_message_id: string | null;
      image_url: string | null;
      job_priority: string | null;
      published_at: string;
      job_sound: number | null;
    }>;

    if (dueRows.length === 0) return 0;

    const affectedJobs = new Set<string>();
    const BATCH_SIZE = 15;

    for (let i = 0; i < dueRows.length; i += BATCH_SIZE) {
      const batch = dueRows.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          affectedJobs.add(item.job_id);
          const attemptNow = new Date().toISOString();

          if (!item.sub_active) {
            db.prepare(
              `UPDATE push_job_deliveries
               SET status = 'failed', last_error = 'Subscription unsubscribed or inactive', updated_at = ?
               WHERE id = ? AND status IN ('queued', 'retrying')`
            ).run(attemptNow, item.delivery_id);
            return;
          }

          const userPrefs = item.user_notification_prefs
            ? normalizeNotificationPrefs(item.user_notification_prefs)
            : null;
          const jobAllowsSound = item.job_sound !== 0;
          const subAllowsSound = item.sub_sound_enabled !== 0;
          const userAllowsSound = userPrefs ? userPrefs.sound_enabled : true;
          const isSilent = !(jobAllowsSound && subAllowsSound && userAllowsSound);
          const priority: SignalChatPriority =
            item.job_priority === 'urgent' ? 'urgent' : 'normal';

          const payloadJson = JSON.stringify({
            title: item.job_title || 'MeridianFX',
            body: item.job_body,
            category: item.job_category,
            url: item.link_url || '/signals',
            messageId: item.signal_message_id,
            jobId: item.job_id,
            deliveryId: item.delivery_id,
            priority,
            forceShow: Boolean(options?.forceShow),
            publishedAt: item.published_at,
            silent: isSilent,
            image: item.image_url || undefined,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: item.signal_message_id
              ? `mfx-msg-${item.signal_message_id}`
              : `mfx-job-${item.job_id}`,
          });

          try {
            let statusCode = 201;
            const transport = item.transport || 'web_push';
            if (transport === 'fcm' && item.token && !options?.sendFn) {
              statusCode = await sendFcmNativePush(item.token, {
                title: item.job_title || 'MeridianFX',
                body: item.job_body,
                url: item.link_url || '/signals',
                messageId: item.signal_message_id,
                priority,
                imageUrl: item.image_url,
                deliveryId: item.delivery_id,
              });
            } else if (transport === 'apns' && item.token && !options?.sendFn) {
              statusCode = await sendApnsNativePush(item.token, {
                title: item.job_title || 'MeridianFX',
                body: item.job_body,
                url: item.link_url || '/signals',
                messageId: item.signal_message_id,
                priority,
                sound: !isSilent,
                deliveryId: item.delivery_id,
              });
            } else {
              await sendFn(
                {
                  endpoint: item.endpoint,
                  keys: { p256dh: item.p256dh, auth: item.auth },
                },
                payloadJson,
                {
                  TTL: 86400,
                  urgency: priority === 'urgent' ? 'high' : 'normal',
                }
              );
            }

            db.prepare(
              `UPDATE push_job_deliveries
               SET status = 'delivered',
                   attempts = attempts + 1,
                   status_code = ?,
                   last_error = NULL,
                   delivered_at = ?,
                   updated_at = ?
               WHERE id = ? AND status IN ('queued', 'retrying')`
            ).run(statusCode, attemptNow, attemptNow, item.delivery_id);

            db.prepare(
              `UPDATE push_subscriptions
               SET last_success_at = ?, last_error = NULL, failure_count = 0, updated_at = ?
               WHERE id = ?`
            ).run(attemptNow, attemptNow, item.subscription_id);
          } catch (err: unknown) {
            const statusCode =
              typeof (err as { statusCode?: unknown })?.statusCode === 'number'
                ? Number((err as { statusCode: number }).statusCode)
                : null;
            const errMsg =
              err instanceof Error ? err.message : String(err || 'Unknown push delivery error');
            const nextAttempts = item.attempts + 1;

            const permanentInvalid = isPermanentInvalidSubscriptionError(statusCode, errMsg);
            const isPermanentClientError =
              statusCode !== null &&
              statusCode >= 400 &&
              statusCode < 500 &&
              statusCode !== 429 &&
              statusCode !== 408;

            if (permanentInvalid) {
              db.prepare(
                `UPDATE push_subscriptions
                 SET active = 0,
                     failure_count = COALESCE(failure_count, 0) + 1,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(
                `HTTP ${statusCode ?? 'err'}: ${errMsg.slice(0, 240)}`,
                attemptNow,
                item.subscription_id
              );

              db.prepare(
                `UPDATE push_job_deliveries
                 SET status = 'failed',
                     attempts = ?,
                     status_code = ?,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(nextAttempts, statusCode, errMsg.slice(0, 300), attemptNow, item.delivery_id);

              logSystemEvent(
                'info',
                'push-cleanup',
                `Deactivated invalid push token (${statusCode || 'err'}) for subscription ${item.subscription_id}`
              );
            } else if (isPermanentClientError || nextAttempts >= item.max_attempts) {
              db.prepare(
                `UPDATE push_job_deliveries
                 SET status = 'failed',
                     attempts = ?,
                     status_code = ?,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(nextAttempts, statusCode, errMsg.slice(0, 300), attemptNow, item.delivery_id);

              db.prepare(
                `UPDATE push_subscriptions
                 SET failure_count = COALESCE(failure_count, 0) + 1,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(errMsg.slice(0, 240), attemptNow, item.subscription_id);

              logSystemEvent(
                'warn',
                'push-delivery',
                `Push delivery failure (${statusCode || 'err'}) on sub ${item.subscription_id}: ${errMsg.slice(0, 200)}`
              );
            } else {
              const delayMs =
                RETRY_BACKOFF_MS[Math.min(nextAttempts - 1, RETRY_BACKOFF_MS.length - 1)] || 120_000;
              const nextAttemptIso = new Date(Date.now() + delayMs).toISOString();

              db.prepare(
                `UPDATE push_job_deliveries
                 SET status = 'retrying',
                     attempts = ?,
                     status_code = ?,
                     next_attempt_at = ?,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(
                nextAttempts,
                statusCode,
                nextAttemptIso,
                errMsg.slice(0, 300),
                attemptNow,
                item.delivery_id
              );

              logSystemEvent(
                'info',
                'push-retry',
                `Retry #${nextAttempts} scheduled in ${Math.round(delayMs / 1000)}s (${statusCode || 'net'}): ${errMsg.slice(0, 150)}`
              );
            }
          }
        })
      );
    }

    for (const jid of affectedJobs) {
      recomputeAndPersistJobStats(jid, options?.broadcastWs || wsBroadcaster);
    }

    return dueRows.length;
  };

  if (options?.sendFn) {
    return run();
  }

  let processed = 0;
  queueProcessingPromise = run()
    .then((count) => {
      processed = count;
    })
    .finally(() => {
      queueProcessingPromise = null;
    });
  await queueProcessingPromise;
  return processed;
}
