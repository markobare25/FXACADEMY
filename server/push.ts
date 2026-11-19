import crypto from 'node:crypto';
import * as webpush from 'web-push';
import { db, logSystemEvent } from './db.ts';
import type { NotificationPreferences, PushJobSummary } from '../src/types.ts';

let vapidReady = false;
let wsBroadcaster: ((event: string, data: unknown) => void) | null = null;
let queueProcessingPromise: Promise<void> | null = null;

const RETRY_BACKOFF_MS = [5_000, 30_000, 120_000];
const DEFAULT_MAX_ATTEMPTS = 4;

export function setPushWsBroadcaster(fn: (event: string, data: unknown) => void): void {
  wsBroadcaster = fn;
}

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
    const rawEmail = (contactEmailRow?.value || 'desk@meridianfx.com').trim();
    const safeEmail = rawEmail.includes('@') ? rawEmail : 'desk@meridianfx.com';
    webpush.setVapidDetails(`mailto:${safeEmail}`, publicKey, privateKey);
    vapidReady = true;
  }

  return { publicKey, privateKey };
}

export interface DispatchPayload {
  title: string;
  body: string;
  category: keyof NotificationPreferences | 'general';
  linkUrl?: string;
  signalMessageId?: string | null;
  imageUrl?: string | null;
  publishedAt?: string;
  dedupKey?: string;
  targetUserIds?: string[] | null;
  broadcastWs?: (event: string, data: unknown) => void;
}

export interface DispatchResult {
  notificationIds: string[];
  targetedSubscriptions: number;
  queued: number;
  delivered: number;
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
    published_at: String(row.published_at),
    status: String(row.status) as PushJobSummary['status'],
    total_targeted: Number(row.total_targeted || 0),
    queued_count: Number(row.queued_count || 0),
    delivered_count: Number(row.delivered_count || 0),
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

export function listRecentPushJobs(limit = 20): PushJobSummary[] {
  const rows = db
    .prepare('SELECT * FROM push_jobs ORDER BY created_at DESC LIMIT ?')
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map(mapPushJobRow);
}

function formatUtcShortTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false,
    }).format(d) + ' UTC';
  } catch {
    return '';
  }
}

function buildNotificationPreviewBody(title: string, rawBody: string, publishedAt: string): string {
  const cleanBody = rawBody.replace(/\s+/g, ' ').trim();
  const cleanTitle = title.replace(/\s+/g, ' ').trim();
  let preview = cleanBody;

  if (
    cleanTitle &&
    cleanTitle.toLowerCase() !== 'meridianfx' &&
    !cleanBody.toLowerCase().startsWith(cleanTitle.toLowerCase())
  ) {
    preview = cleanBody ? `${cleanTitle}: ${cleanBody}` : cleanTitle;
  }

  if (!preview) {
    preview = 'New update published in the MeridianFX Signals channel.';
  }

  const trimmedPreview = preview.length > 160 ? `${preview.slice(0, 157)}...` : preview;
  const timeLabel = formatUtcShortTime(publishedAt);
  return timeLabel ? `${trimmedPreview} · ${timeLabel}` : trimmedPreview;
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
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_cnt
       FROM push_job_deliveries
       WHERE job_id = ?`
    )
    .get(jobId) as {
    total_cnt: number;
    queued_cnt: number | null;
    delivered_cnt: number | null;
    failed_cnt: number | null;
  };

  const total = Number(counts.total_cnt || 0);
  const queued = Number(counts.queued_cnt || 0);
  const delivered = Number(counts.delivered_cnt || 0);
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
       failed_count = ?,
       updated_at = ?
     WHERE id = ?`
  ).run(status, total, queued, delivered, failed, now, jobId);

  // Keep push_dispatch_logs synchronized for Overview / History views
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

export async function dispatchNotification(payload: DispatchPayload): Promise<DispatchResult> {
  ensureVapidKeys();
  const now = new Date().toISOString();
  const publishedAt = payload.publishedAt || now;
  const linkUrl = payload.linkUrl || '/signals';
  const dedupKey = payload.dedupKey || `auto:${crypto.randomUUID()}`;
  const emit = payload.broadcastWs || wsBroadcaster || undefined;
  if (payload.broadcastWs && !wsBroadcaster) {
    wsBroadcaster = payload.broadcastWs;
  }

  // Strict idempotency check: never send duplicate notifications for the same dedup_key
  const existingJob = getPushJobByDedupKey(dedupKey);
  if (existingJob) {
    return {
      notificationIds: [],
      targetedSubscriptions: existingJob.total_targeted,
      queued: existingJob.queued_count,
      delivered: existingJob.delivered_count,
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
  const pushBody = buildNotificationPreviewBody(payload.title, payload.body, publishedAt);

  const enqueueTx = db.transaction(() => {
    // Re-check inside transaction to eliminate races
    const raceCheck = db.prepare('SELECT * FROM push_jobs WHERE dedup_key = ?').get(dedupKey) as
      | Record<string, unknown>
      | undefined;
    if (raceCheck) {
      return { duplicate: mapPushJobRow(raceCheck), targetedCount: Number(raceCheck.total_targeted || 0) };
    }

    // 1. Insert persistent in-app notification(s)
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
      const nid = crypto.randomUUID();
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, body, category, link_url, is_read, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, 0, ?)`
      ).run(nid, payload.title, payload.body, payload.category, linkUrl, now);
      notificationIds.push(nid);
    }

    // 2. Query active push subscriptions (anonymous visitors + registered users)
    let eligibleSubs: Array<{
      id: string;
      user_id: string | null;
      endpoint: string;
      notification_prefs: string | null;
      status: string | null;
    }> = [];

    if (isPushEnabled) {
      const subs = db
        .prepare(
          `SELECT ps.id, ps.user_id, ps.endpoint, u.notification_prefs, u.status
           FROM push_subscriptions ps
           LEFT JOIN users u ON ps.user_id = u.id
           WHERE COALESCE(ps.active, 1) = 1`
        )
        .all() as Array<{
        id: string;
        user_id: string | null;
        endpoint: string;
        notification_prefs: string | null;
        status: string | null;
      }>;

      eligibleSubs = subs.filter((sub) => {
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
    }

    const initialStatus: PushJobSummary['status'] =
      eligibleSubs.length > 0 ? 'queued' : 'completed';

    db.prepare(
      `INSERT INTO push_jobs (
        id, dedup_key, signal_message_id, title, body, category, link_url,
        image_url, published_at, status, total_targeted, queued_count,
        delivered_count, failed_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
    ).run(
      jobId,
      dedupKey,
      payload.signalMessageId || null,
      payload.title,
      pushBody,
      payload.category,
      linkUrl,
      payload.imageUrl || null,
      publishedAt,
      initialStatus,
      eligibleSubs.length,
      eligibleSubs.length,
      now,
      now
    );

    const insertDelivery = db.prepare(
      `INSERT OR IGNORE INTO push_job_deliveries (
        id, job_id, subscription_id, endpoint, status, attempts, max_attempts,
        next_attempt_at, updated_at
      ) VALUES (?, ?, ?, ?, 'queued', 0, ?, ?, ?)`
    );

    for (const sub of eligibleSubs) {
      insertDelivery.run(
        crypto.randomUUID(),
        jobId,
        sub.id,
        sub.endpoint,
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
      target_user_ids: payload.targetUserIds || null,
      created_at: now,
    });
  }

  if (txResult.targetedCount > 0) {
    // Run initial delivery pass immediately, bounded by a 2.5s timeout so publishing stays snappy
    // while small/normal audiences return immediate delivery counts. Remaining/retry items continue in worker.
    await Promise.race([
      processPendingPushDeliveries({ jobId, broadcastWs: emit }),
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
    failed: finalSummary.failed_count,
    push_job: finalSummary,
  };
}

export type WebPushSendFn = (
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  options?: { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }
) => Promise<unknown>;

export async function processPendingPushDeliveries(options?: {
  jobId?: string;
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
      options?.sendFn ||
      ((sub, msg, opts) => webpush.sendNotification(sub, msg, opts));

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
           ps.active as sub_active,
           pj.title as job_title,
           pj.body as job_body,
           pj.category as job_category,
           pj.link_url,
           pj.signal_message_id,
           pj.image_url,
           pj.published_at
         FROM push_job_deliveries d
         JOIN push_jobs pj ON pj.id = d.job_id
         JOIN push_subscriptions ps ON ps.id = d.subscription_id
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
      sub_active: number;
      job_title: string;
      job_body: string;
      job_category: string;
      link_url: string;
      signal_message_id: string | null;
      image_url: string | null;
      published_at: string;
    }>;

    if (dueRows.length === 0) return 0;

    const affectedJobs = new Set<string>();

    // Process in bounded batches of 15 concurrent sends
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

          const payloadJson = JSON.stringify({
            title: 'MeridianFX',
            body: item.job_body,
            subtitle: item.job_title,
            category: item.job_category,
            url: item.link_url || '/signals',
            messageId: item.signal_message_id,
            publishedAt: item.published_at,
            image: item.image_url || undefined,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `mfx-job-${item.job_id}`,
          });

          try {
            await sendFn(
              {
                endpoint: item.endpoint,
                keys: { p256dh: item.p256dh, auth: item.auth },
              },
              payloadJson,
              { TTL: 86400, urgency: 'high' }
            );

            db.prepare(
              `UPDATE push_job_deliveries
               SET status = 'delivered',
                   attempts = attempts + 1,
                   status_code = 201,
                   last_error = NULL,
                   delivered_at = ?,
                   updated_at = ?
               WHERE id = ? AND status IN ('queued', 'retrying')`
            ).run(attemptNow, attemptNow, item.delivery_id);

            db.prepare(
              `UPDATE push_subscriptions
               SET last_success_at = ?, last_error = NULL, updated_at = ?
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

            const isPermanentSubscriptionGone = statusCode === 404 || statusCode === 410;
            const isPermanentClientError =
              statusCode !== null && statusCode >= 400 && statusCode < 500 && statusCode !== 429 && statusCode !== 408;

            if (isPermanentSubscriptionGone) {
              db.prepare(
                `UPDATE push_subscriptions
                 SET active = 0, last_error = ?, updated_at = ?
                 WHERE id = ?`
              ).run(`HTTP ${statusCode}: ${errMsg.slice(0, 240)}`, attemptNow, item.subscription_id);

              db.prepare(
                `UPDATE push_job_deliveries
                 SET status = 'failed',
                     attempts = ?,
                     status_code = ?,
                     last_error = ?,
                     updated_at = ?
                 WHERE id = ?`
              ).run(nextAttempts, statusCode, errMsg.slice(0, 300), attemptNow, item.delivery_id);
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
                `UPDATE push_subscriptions SET last_error = ?, updated_at = ? WHERE id = ?`
              ).run(errMsg.slice(0, 240), attemptNow, item.subscription_id);

              logSystemEvent(
                'warn',
                'web-push',
                `Permanent push failure (${statusCode || 'err'}) on sub ${item.subscription_id}: ${errMsg.slice(0, 200)}`
              );
            } else {
              // Transient error (429, 408, 5xx, network timeout): schedule retry with backoff
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
                'web-push-retry',
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
