import { db, DESIGNATED_ADMIN_EMAIL, ensureDesignatedAdminUser } from './db.ts';

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();
  if (!url || !key) return null;
  return { url, key };
}

export function isRemotePersistentStoreEnabled(): boolean {
  return Boolean(getSupabaseConfig());
}

async function restRequest<T = unknown>(
  pathWithQuery: string,
  init: RequestInit = {},
  timeoutMs = 5000
): Promise<T | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cfg.url}/rest/v1/${pathWithQuery}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function getFallbackAdminId(): string {
  const row = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1')
    .get(DESIGNATED_ADMIN_EMAIL) as { id: string } | undefined;
  return row?.id || ensureDesignatedAdminUser();
}

function upsertLocalSignalMessage(row: Record<string, unknown>): void {
  const id = String(row.id || '').trim();
  if (!id) return;

  const fallbackAdminId = getFallbackAdminId();
  const rawAuthorId = row.author_id ? String(row.author_id) : fallbackAdminId;
  const authorExists = db.prepare('SELECT 1 FROM users WHERE id = ?').get(rawAuthorId);
  const authorId = authorExists ? rawAuthorId : fallbackAdminId;

  const seedLove = Number(row.seed_love || 0);
  const seedLike = Number(row.seed_like || 0);
  const seedFire = Number(row.seed_fire || 0);
  const seedHundred = Number(row.seed_hundred || 0);
  const loveCount = Number(row.love_count ?? seedLove);
  const likeCount = Number(row.like_count ?? seedLike);
  const fireCount = Number(row.fire_count ?? seedFire);
  const hundredCount = Number(row.hundred_count ?? seedHundred);

  db.prepare(
    `INSERT INTO signal_messages (
      id, author_id, author_name, content, image_url, image_name,
      media_url, media_type, media_name, message_type, priority, status, pinned,
      edited_at, completed_at, completed_summary, source_type, source_id, is_welcome,
      seed_love, seed_like, seed_fire, seed_hundred,
      love_count, like_count, fire_count, hundred_count, seed_views, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      author_name = excluded.author_name,
      content = excluded.content,
      image_url = excluded.image_url,
      image_name = excluded.image_name,
      media_url = excluded.media_url,
      media_type = excluded.media_type,
      media_name = excluded.media_name,
      message_type = excluded.message_type,
      priority = excluded.priority,
      status = excluded.status,
      pinned = excluded.pinned,
      edited_at = excluded.edited_at,
      completed_at = excluded.completed_at,
      completed_summary = excluded.completed_summary,
      source_type = excluded.source_type,
      source_id = excluded.source_id,
      is_welcome = excluded.is_welcome,
      seed_love = excluded.seed_love,
      seed_like = excluded.seed_like,
      seed_fire = excluded.seed_fire,
      seed_hundred = excluded.seed_hundred,
      love_count = excluded.love_count,
      like_count = excluded.like_count,
      fire_count = excluded.fire_count,
      hundred_count = excluded.hundred_count,
      seed_views = excluded.seed_views`
  ).run(
    id,
    authorId,
    String(row.author_name || 'MeridianFX Desk'),
    String(row.content || ''),
    row.image_url ? String(row.image_url) : null,
    row.image_name ? String(row.image_name) : null,
    row.media_url ? String(row.media_url) : null,
    row.media_type ? String(row.media_type) : null,
    row.media_name ? String(row.media_name) : null,
    String(row.message_type || 'update'),
    row.priority === 'urgent' ? 'urgent' : 'normal',
    String(row.status || 'active'),
    Number(row.pinned || 0) ? 1 : 0,
    row.edited_at ? String(row.edited_at) : null,
    row.completed_at ? String(row.completed_at) : null,
    row.completed_summary ? String(row.completed_summary) : null,
    row.source_type ? String(row.source_type) : null,
    row.source_id ? String(row.source_id) : null,
    Number(row.is_welcome || 0) ? 1 : 0,
    seedLove,
    seedLike,
    seedFire,
    seedHundred,
    loveCount,
    likeCount,
    fireCount,
    hundredCount,
    Number(row.seed_views || 0),
    String(row.created_at || new Date().toISOString())
  );
}

function upsertLocalReaction(row: Record<string, unknown>): void {
  const messageId = String(row.message_id || '').trim();
  const actorKey = String(row.actor_key || '').trim();
  const reaction = String(row.reaction || '').trim();
  if (!messageId || !actorKey || !['love', 'like', 'fire', 'hundred'].includes(reaction)) {
    return;
  }
  const msgExists = db.prepare('SELECT 1 FROM signal_messages WHERE id = ?').get(messageId);
  if (!msgExists) return;

  db.prepare(
    `INSERT INTO signal_message_reactions (message_id, actor_key, user_id, visitor_id, reaction, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(message_id, actor_key) DO UPDATE SET
       user_id = COALESCE(excluded.user_id, signal_message_reactions.user_id),
       visitor_id = COALESCE(excluded.visitor_id, signal_message_reactions.visitor_id),
       reaction = excluded.reaction,
       created_at = excluded.created_at`
  ).run(
    messageId,
    actorKey,
    row.user_id ? String(row.user_id) : null,
    row.visitor_id ? String(row.visitor_id) : null,
    reaction,
    String(row.created_at || new Date().toISOString())
  );
}

function upsertLocalMarketUpdate(row: Record<string, unknown>): void {
  const id = String(row.id || '').trim();
  if (!id) return;
  db.prepare(
    `INSERT INTO market_updates (
      id, title, content, category, pinned, is_premium, image_url, video_url,
      attachment_url, attachment_name, external_link, scheduled_at, published,
      author_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      category = excluded.category,
      pinned = excluded.pinned,
      is_premium = excluded.is_premium,
      image_url = excluded.image_url,
      video_url = excluded.video_url,
      attachment_url = excluded.attachment_url,
      attachment_name = excluded.attachment_name,
      external_link = excluded.external_link,
      scheduled_at = excluded.scheduled_at,
      published = excluded.published,
      author_name = excluded.author_name,
      updated_at = excluded.updated_at`
  ).run(
    id,
    String(row.title || ''),
    String(row.content || ''),
    String(row.category || 'Forex Update'),
    Number(row.pinned || 0) ? 1 : 0,
    Number(row.is_premium || 0) ? 1 : 0,
    row.image_url ? String(row.image_url) : null,
    row.video_url ? String(row.video_url) : null,
    row.attachment_url ? String(row.attachment_url) : null,
    row.attachment_name ? String(row.attachment_name) : null,
    row.external_link ? String(row.external_link) : null,
    row.scheduled_at ? String(row.scheduled_at) : null,
    Number(row.published ?? 1) ? 1 : 0,
    String(row.author_name || 'Chief Market Strategist'),
    String(row.created_at || new Date().toISOString()),
    String(row.updated_at || new Date().toISOString())
  );
}

function upsertLocalPushSubscription(row: Record<string, unknown>): void {
  const endpoint = String(row.endpoint || '').trim();
  const id = String(row.id || '').trim();
  if (!endpoint || !id) return;

  let validUserId: string | null = null;
  if (row.user_id) {
    const exists = db.prepare('SELECT 1 FROM users WHERE id = ?').get(String(row.user_id));
    if (exists) validUserId = String(row.user_id);
  }

  db.prepare(
    `INSERT INTO push_subscriptions (
      id, user_id, visitor_id, endpoint, p256dh, auth, user_agent, platform,
      transport, token, browser_name, device_label, prefs_json, sound_enabled,
      failure_count, active, last_error, last_success_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = COALESCE(excluded.user_id, push_subscriptions.user_id),
      visitor_id = COALESCE(excluded.visitor_id, push_subscriptions.visitor_id),
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      platform = COALESCE(excluded.platform, push_subscriptions.platform),
      transport = excluded.transport,
      token = excluded.token,
      browser_name = excluded.browser_name,
      device_label = excluded.device_label,
      prefs_json = excluded.prefs_json,
      sound_enabled = excluded.sound_enabled,
      active = excluded.active,
      updated_at = excluded.updated_at`
  ).run(
    id,
    validUserId,
    row.visitor_id ? String(row.visitor_id) : null,
    endpoint,
    String(row.p256dh || ''),
    String(row.auth || ''),
    row.user_agent ? String(row.user_agent) : null,
    row.platform ? String(row.platform) : 'web',
    String(row.transport || 'web_push'),
    row.token ? String(row.token) : null,
    row.browser_name ? String(row.browser_name) : null,
    row.device_label ? String(row.device_label) : null,
    String(
      row.prefs_json ||
        '{"signals":true,"signal_updates":true,"signal_chat":true,"market_updates":true,"academy":true,"economic_calendar":true,"announcements":true,"sound_enabled":true}'
    ),
    Number(row.sound_enabled ?? 1) ? 1 : 0,
    Number(row.failure_count || 0),
    Number(row.active ?? 1) ? 1 : 0,
    row.last_error ? String(row.last_error) : null,
    row.last_success_at ? String(row.last_success_at) : null,
    String(row.created_at || new Date().toISOString()),
    String(row.updated_at || new Date().toISOString())
  );
}

let hydrationDone = false;
let hydrationInFlight: Promise<void> | null = null;

export async function ensureRemoteHydrated(): Promise<void> {
  if (!isRemotePersistentStoreEnabled() || hydrationDone) return;
  if (hydrationInFlight) return hydrationInFlight;

  hydrationInFlight = (async () => {
    try {
      const [remoteMsgs, remoteReacts, remoteUpdates, remoteSubs] = await Promise.all([
        restRequest<Array<Record<string, unknown>>>(
          'signal_messages?select=*&order=created_at.asc&limit=500'
        ),
        restRequest<Array<Record<string, unknown>>>(
          'signal_message_reactions?select=*&limit=5000'
        ),
        restRequest<Array<Record<string, unknown>>>(
          'market_updates?select=*&order=created_at.desc&limit=300'
        ),
        restRequest<Array<Record<string, unknown>>>(
          'push_subscriptions?select=*&limit=1000'
        ),
      ]);

      const tx = db.transaction(() => {
        if (Array.isArray(remoteMsgs)) {
          for (const row of remoteMsgs) upsertLocalSignalMessage(row);
        }
        if (Array.isArray(remoteReacts)) {
          for (const row of remoteReacts) upsertLocalReaction(row);
        }
        if (Array.isArray(remoteUpdates)) {
          for (const row of remoteUpdates) upsertLocalMarketUpdate(row);
        }
        if (Array.isArray(remoteSubs)) {
          for (const row of remoteSubs) upsertLocalPushSubscription(row);
        }
      });
      tx();
      hydrationDone = true;
    } finally {
      hydrationInFlight = null;
    }
  })();

  return hydrationInFlight;
}

export async function fetchRemoteSignalMessageById(idOrSourceId: string): Promise<boolean> {
  if (!isRemotePersistentStoreEnabled() || !idOrSourceId) return false;
  const enc = encodeURIComponent(idOrSourceId);
  const rows = await restRequest<Array<Record<string, unknown>>>(
    `signal_messages?select=*&or=(id.eq.${enc},source_id.eq.${enc})&limit=1`
  );
  if (!Array.isArray(rows) || rows.length === 0) return false;

  const remoteMsg = rows[0];
  const msgId = String(remoteMsg.id);
  const remoteReacts = await restRequest<Array<Record<string, unknown>>>(
    `signal_message_reactions?select=*&message_id=eq.${encodeURIComponent(msgId)}&limit=2000`
  );

  const tx = db.transaction(() => {
    upsertLocalSignalMessage(remoteMsg);
    if (Array.isArray(remoteReacts)) {
      for (const r of remoteReacts) upsertLocalReaction(r);
    }
  });
  tx();
  return true;
}

export async function syncSignalMessageToRemote(messageId: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  const row = db.prepare('SELECT * FROM signal_messages WHERE id = ?').get(messageId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  await restRequest('signal_messages?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
}

export async function syncSignalReactionToRemote(
  messageId: string,
  actorKey: string,
  action: 'upsert' | 'delete'
): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  if (action === 'delete') {
    await restRequest(
      `signal_message_reactions?message_id=eq.${encodeURIComponent(messageId)}&actor_key=eq.${encodeURIComponent(actorKey)}`,
      {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      }
    );
    return;
  }

  const row = db
    .prepare('SELECT * FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
    .get(messageId, actorKey) as Record<string, unknown> | undefined;
  if (!row) return;

  await restRequest('signal_message_reactions?on_conflict=message_id,actor_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
}

export async function deleteRemoteSignalMessage(messageId: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  await restRequest(`signal_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}

export async function syncMarketUpdateToRemote(updateId: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(updateId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  await restRequest('market_updates?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
}

export async function syncPushSubscriptionToRemote(endpoint: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  const row = db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?').get(endpoint) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  await restRequest('push_subscriptions?on_conflict=endpoint', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
}
