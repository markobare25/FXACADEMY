import pg from 'pg';
import {
  db,
  DESIGNATED_ADMIN_EMAIL,
  ensureDesignatedAdminUser,
  getWelcomeSeedReactions,
  SIGNAL_MESSAGE_TTL_MS,
  syncLocalTotalPublishedSignalsIfHigher,
  WELCOME_SEED_VIEWS,
} from './db.ts';

const { Pool } = pg;

export interface SyncOptions {
  strict?: boolean;
}

function getPgConfig(): string | null {
  const conn = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
  return conn || null;
}

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

function getKvConfig(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url || !token) return null;
  return { url, token };
}

export function isRemotePersistentStoreEnabled(): boolean {
  return Boolean(getPgConfig() || getSupabaseConfig() || getKvConfig());
}

export function assertPersistentDatabaseReady(): void {
  if (process.env.VERCEL && !isRemotePersistentStoreEnabled()) {
    throw new Error(
      'External database persistence is not configured. Set DATABASE_URL, POSTGRES_URL, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or KV_REST_API_URL + KV_REST_API_TOKEN.'
    );
  }
}

// ---------- PostgreSQL Client (DATABASE_URL / POSTGRES_URL) ----------
let pgPool: pg.Pool | null = null;
let pgSchemaPromise: Promise<void> | null = null;

async function getPgPool(strict = false): Promise<pg.Pool | null> {
  const conn = getPgConfig();
  if (!conn) return null;

  try {
    if (!pgPool) {
      const isLocal = /localhost|127\.0\.0\.1/i.test(conn);
      pgPool = new Pool({
        connectionString: conn,
        max: 5,
        connectionTimeoutMillis: 6000,
        idleTimeoutMillis: 20_000,
        ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
      });
    }

    if (!pgSchemaPromise) {
      pgSchemaPromise = (async () => {
        await pgPool!.query(`
          CREATE TABLE IF NOT EXISTS signal_messages (
            id TEXT PRIMARY KEY,
            author_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            image_url TEXT,
            image_name TEXT,
            media_url TEXT,
            media_type TEXT,
            media_name TEXT,
            message_type TEXT NOT NULL DEFAULT 'update',
            priority TEXT NOT NULL DEFAULT 'normal',
            status TEXT NOT NULL DEFAULT 'active',
            pinned INTEGER NOT NULL DEFAULT 0,
            edited_at TEXT,
            completed_at TEXT,
            completed_summary TEXT,
            source_type TEXT,
            source_id TEXT,
            is_welcome INTEGER NOT NULL DEFAULT 0,
            seed_love INTEGER NOT NULL DEFAULT 0,
            seed_like INTEGER NOT NULL DEFAULT 0,
            seed_fire INTEGER NOT NULL DEFAULT 0,
            seed_hundred INTEGER NOT NULL DEFAULT 0,
            love_count INTEGER NOT NULL DEFAULT 0,
            like_count INTEGER NOT NULL DEFAULT 0,
            fire_count INTEGER NOT NULL DEFAULT 0,
            hundred_count INTEGER NOT NULL DEFAULT 0,
            seed_views INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS signal_message_reactions (
            message_id TEXT NOT NULL,
            actor_key TEXT NOT NULL,
            user_id TEXT,
            visitor_id TEXT,
            reaction TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (message_id, actor_key)
          );
          CREATE TABLE IF NOT EXISTS signals (
            id TEXT PRIMARY KEY,
            pair TEXT NOT NULL,
            direction TEXT NOT NULL,
            entry_price TEXT NOT NULL,
            stop_loss TEXT NOT NULL,
            tp1 TEXT NOT NULL,
            tp2 TEXT,
            tp3 TEXT,
            tp4 TEXT,
            risk_reward TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            classification TEXT NOT NULL DEFAULT 'Educational',
            analysis TEXT NOT NULL,
            chart_image_url TEXT,
            admin_remarks TEXT,
            is_premium INTEGER NOT NULL DEFAULT 0,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS signal_updates (
            id TEXT PRIMARY KEY,
            signal_id TEXT NOT NULL,
            note TEXT NOT NULL,
            status_snapshot TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS market_updates (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0,
            is_premium INTEGER NOT NULL DEFAULT 0,
            image_url TEXT,
            video_url TEXT,
            attachment_url TEXT,
            attachment_name TEXT,
            external_link TEXT,
            scheduled_at TEXT,
            published INTEGER NOT NULL DEFAULT 1,
            author_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            visitor_id TEXT,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            user_agent TEXT,
            platform TEXT,
            transport TEXT NOT NULL DEFAULT 'web_push',
            token TEXT,
            browser_name TEXT,
            device_label TEXT,
            prefs_json TEXT,
            sound_enabled INTEGER NOT NULL DEFAULT 1,
            is_muted INTEGER NOT NULL DEFAULT 0,
            failure_count INTEGER NOT NULL DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            last_error TEXT,
            last_success_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS platform_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
        `);
      })().catch((err) => {
        pgSchemaPromise = null;
        throw err;
      });
    }

    await pgSchemaPromise;
    return pgPool;
  } catch (err) {
    if (strict) {
      throw new Error(
        `Postgres connection failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return null;
  }
}

// ---------- Supabase REST Client ----------
async function restRequest<T = unknown>(
  pathWithQuery: string,
  init: RequestInit = {},
  timeoutMs = 6000,
  strict = false
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
    if (!res.ok) {
      if (strict) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Supabase write failed (${res.status}): ${errBody.slice(0, 220) || res.statusText}`);
      }
      return null;
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (err) {
    if (strict) {
      throw err instanceof Error ? err : new Error(`Supabase request failed: ${String(err)}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Upstash Redis / Vercel KV REST Client ----------
const KV_KEYS = {
  signalMessages: 'mfx:signal_messages',
  reactions: 'mfx:signal_message_reactions',
  signals: 'mfx:signals',
  signalUpdates: 'mfx:signal_updates',
  marketUpdates: 'mfx:market_updates',
  pushSubs: 'mfx:push_subscriptions',
  totalPublishedSignals: 'mfx:total_published_signals',
};

async function kvCommand<T = unknown>(
  args: Array<string | number>,
  strict = false,
  timeoutMs = 6000
): Promise<T | null> {
  const cfg = getKvConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const text = await res.text().catch(() => '');
    let parsed: { result?: T; error?: string } | null = null;
    try {
      parsed = text ? (JSON.parse(text) as { result?: T; error?: string }) : null;
    } catch {
      parsed = null;
    }
    if (!res.ok || parsed?.error) {
      if (strict) {
        throw new Error(
          `KV database write failed (${res.status}): ${parsed?.error || text.slice(0, 200) || res.statusText}`
        );
      }
      return null;
    }
    return parsed?.result ?? null;
  } catch (err) {
    if (strict) {
      throw err instanceof Error ? err : new Error(`KV database error: ${String(err)}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function kvHvals(hashKey: string): Promise<Array<Record<string, unknown>> | null> {
  const rawList = await kvCommand<string[]>(['HVALS', hashKey], false);
  if (!Array.isArray(rawList)) return null;
  const out: Array<Record<string, unknown>> = [];
  for (const item of rawList) {
    try {
      const parsed = typeof item === 'string' ? JSON.parse(item) : item;
      if (parsed && typeof parsed === 'object') {
        out.push(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore malformed record
    }
  }
  return out;
}

// ---------- Local SQLite Upsert Helpers ----------
function getFallbackAdminId(): string {
  const row = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1')
    .get(DESIGNATED_ADMIN_EMAIL) as { id: string } | undefined;
  return row?.id || ensureDesignatedAdminUser();
}

function isExpiredNonPinnedActiveMessage(row: Record<string, unknown>): boolean {
  const status = String(row.status || 'active');
  if (status !== 'active') return false;
  const isWelcome = Number(row.is_welcome || 0) === 1 || String(row.source_type || '') === 'welcome';
  const isPinned = Number(row.pinned || 0) === 1;
  if (isWelcome || isPinned) return false;
  const createdMs = Date.parse(String(row.created_at || ''));
  if (!Number.isFinite(createdMs)) return false;
  return Date.now() - createdMs >= SIGNAL_MESSAGE_TTL_MS;
}

function cleanWelcomeContent(content: string): string {
  return content.replace(/•\s*Tap .*? to react on any alert\n?/gi, '').trim();
}

function upsertLocalSignalMessage(row: Record<string, unknown>): void {
  const id = String(row.id || '').trim();
  if (!id) return;
  if (isExpiredNonPinnedActiveMessage(row)) {
    db.prepare('DELETE FROM signal_messages WHERE id = ?').run(id);
    return;
  }

  const fallbackAdminId = getFallbackAdminId();
  const rawAuthorId = row.author_id ? String(row.author_id) : fallbackAdminId;
  const authorExists = db.prepare('SELECT 1 FROM users WHERE id = ?').get(rawAuthorId);
  const authorId = authorExists ? rawAuthorId : fallbackAdminId;

  const isWelcomeMsg = Number(row.is_welcome || 0) === 1 || String(row.source_type || '') === 'welcome';
  const welcomeSeeds = isWelcomeMsg ? getWelcomeSeedReactions() : null;
  const seedLove = welcomeSeeds ? welcomeSeeds.love : Number(row.seed_love || 0);
  const seedLike = welcomeSeeds ? welcomeSeeds.like : Number(row.seed_like || 0);
  const seedFire = welcomeSeeds ? welcomeSeeds.fire : Number(row.seed_fire || 0);
  const seedHundred = welcomeSeeds ? welcomeSeeds.hundred : Number(row.seed_hundred || 0);
  const seedViews = isWelcomeMsg ? WELCOME_SEED_VIEWS : Number(row.seed_views || 0);
  const loveCount = Math.max(Number(row.love_count ?? seedLove), seedLove);
  const likeCount = Math.max(Number(row.like_count ?? seedLike), seedLike);
  const fireCount = Math.max(Number(row.fire_count ?? seedFire), seedFire);
  const hundredCount = Math.max(Number(row.hundred_count ?? seedHundred), seedHundred);
  const rawContent = String(row.content || '');
  const finalContent = isWelcomeMsg ? cleanWelcomeContent(rawContent) : rawContent;

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
    finalContent,
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
    isWelcomeMsg ? 1 : 0,
    seedLove,
    seedLike,
    seedFire,
    seedHundred,
    loveCount,
    likeCount,
    fireCount,
    hundredCount,
    seedViews,
    String(row.created_at || new Date().toISOString())
  );
}

function upsertLocalSignal(row: Record<string, unknown>): void {
  const id = String(row.id || '').trim();
  if (!id) return;
  const fallbackAdminId = getFallbackAdminId();
  db.prepare(
    `INSERT INTO signals (
      id, pair, direction, entry_price, stop_loss, tp1, tp2, tp3, tp4,
      risk_reward, timeframe, status, classification, analysis, chart_image_url,
      admin_remarks, is_premium, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      pair = excluded.pair,
      direction = excluded.direction,
      entry_price = excluded.entry_price,
      stop_loss = excluded.stop_loss,
      tp1 = excluded.tp1,
      tp2 = excluded.tp2,
      tp3 = excluded.tp3,
      tp4 = excluded.tp4,
      risk_reward = excluded.risk_reward,
      timeframe = excluded.timeframe,
      status = excluded.status,
      classification = excluded.classification,
      analysis = excluded.analysis,
      chart_image_url = excluded.chart_image_url,
      admin_remarks = excluded.admin_remarks,
      is_premium = excluded.is_premium,
      updated_at = excluded.updated_at`
  ).run(
    id,
    String(row.pair || 'EURUSD'),
    String(row.direction || 'BUY'),
    String(row.entry_price || ''),
    String(row.stop_loss || ''),
    String(row.tp1 || ''),
    row.tp2 ? String(row.tp2) : null,
    row.tp3 ? String(row.tp3) : null,
    row.tp4 ? String(row.tp4) : null,
    String(row.risk_reward || '1 : 2.0'),
    String(row.timeframe || 'H1'),
    String(row.status || 'Active'),
    String(row.classification || 'Educational'),
    String(row.analysis || ''),
    row.chart_image_url ? String(row.chart_image_url) : null,
    row.admin_remarks ? String(row.admin_remarks) : null,
    Number(row.is_premium || 0) ? 1 : 0,
    row.created_by ? String(row.created_by) : fallbackAdminId,
    String(row.created_at || new Date().toISOString()),
    String(row.updated_at || new Date().toISOString())
  );
}

function upsertLocalSignalUpdate(row: Record<string, unknown>): void {
  const id = String(row.id || '').trim();
  const signalId = String(row.signal_id || '').trim();
  if (!id || !signalId) return;
  const sigExists = db.prepare('SELECT 1 FROM signals WHERE id = ?').get(signalId);
  if (!sigExists) return;
  db.prepare(
    `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       note = excluded.note,
       status_snapshot = excluded.status_snapshot`
  ).run(
    id,
    signalId,
    String(row.note || ''),
    String(row.status_snapshot || 'Active'),
    String(row.created_by || 'MeridianFX Desk'),
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
      is_muted, failure_count, active, last_error, last_success_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      is_muted = excluded.is_muted,
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
    Number(row.is_muted ?? row.isMuted ?? 0) ? 1 : 0,
    Number(row.failure_count || 0),
    Number(row.active ?? 1) ? 1 : 0,
    row.last_error ? String(row.last_error) : null,
    row.last_success_at ? String(row.last_success_at) : null,
    String(row.created_at || new Date().toISOString()),
    String(row.updated_at || new Date().toISOString())
  );
}

// ---------- Multi-Backend Read / Hydration ----------
async function fetchAllRemoteSnapshot(): Promise<{
  msgs: Array<Record<string, unknown>> | null;
  reacts: Array<Record<string, unknown>> | null;
  updates: Array<Record<string, unknown>> | null;
  subs: Array<Record<string, unknown>> | null;
  signals: Array<Record<string, unknown>> | null;
  signalUpdates: Array<Record<string, unknown>> | null;
  totalPublishedSignals: number | null;
}> {
  let msgs: Array<Record<string, unknown>> | null = null;
  let reacts: Array<Record<string, unknown>> | null = null;
  let updates: Array<Record<string, unknown>> | null = null;
  let subs: Array<Record<string, unknown>> | null = null;
  let signals: Array<Record<string, unknown>> | null = null;
  let signalUpdates: Array<Record<string, unknown>> | null = null;
  let totalPublishedSignals: number | null = null;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      const [mR, rR, uR, pR, sR, suR, cR] = await Promise.all([
        pool.query('SELECT * FROM signal_messages ORDER BY created_at ASC LIMIT 500'),
        pool.query('SELECT * FROM signal_message_reactions LIMIT 5000'),
        pool.query('SELECT * FROM market_updates ORDER BY created_at DESC LIMIT 300'),
        pool.query('SELECT * FROM push_subscriptions LIMIT 1000'),
        pool.query('SELECT * FROM signals ORDER BY created_at DESC LIMIT 300'),
        pool.query('SELECT * FROM signal_updates ORDER BY created_at DESC LIMIT 500'),
        pool.query("SELECT value FROM platform_settings WHERE key = 'total_published_signals' LIMIT 1"),
      ]);
      msgs = mR.rows;
      reacts = rR.rows;
      updates = uR.rows;
      subs = pR.rows;
      signals = sR.rows;
      signalUpdates = suR.rows;
      if (cR.rows[0]?.value) {
        const parsed = Number.parseInt(String(cR.rows[0].value), 10);
        if (Number.isFinite(parsed)) totalPublishedSignals = parsed;
      }
      return { msgs, reacts, updates, subs, signals, signalUpdates, totalPublishedSignals };
    } catch {
      // fall through to other configured adapters if any
    }
  }

  if (getSupabaseConfig()) {
    const [mR, rR, uR, pR, sR, suR, cR] = await Promise.all([
      restRequest<Array<Record<string, unknown>>>('signal_messages?select=*&order=created_at.asc&limit=500'),
      restRequest<Array<Record<string, unknown>>>('signal_message_reactions?select=*&limit=5000'),
      restRequest<Array<Record<string, unknown>>>('market_updates?select=*&order=created_at.desc&limit=300'),
      restRequest<Array<Record<string, unknown>>>('push_subscriptions?select=*&limit=1000'),
      restRequest<Array<Record<string, unknown>>>('signals?select=*&order=created_at.desc&limit=300'),
      restRequest<Array<Record<string, unknown>>>('signal_updates?select=*&order=created_at.desc&limit=500'),
      restRequest<Array<{ key?: string; value?: string }>>(
        'platform_settings?select=key,value&key=eq.total_published_signals&limit=1'
      ),
    ]);
    msgs = mR;
    reacts = rR;
    updates = uR;
    subs = pR;
    signals = sR;
    signalUpdates = suR;
    if (Array.isArray(cR) && cR[0]?.value) {
      const parsed = Number.parseInt(String(cR[0].value), 10);
      if (Number.isFinite(parsed)) totalPublishedSignals = parsed;
    }
    return { msgs, reacts, updates, subs, signals, signalUpdates, totalPublishedSignals };
  }

  if (getKvConfig()) {
    const [mR, rR, uR, pR, sR, suR, cR] = await Promise.all([
      kvHvals(KV_KEYS.signalMessages),
      kvHvals(KV_KEYS.reactions),
      kvHvals(KV_KEYS.marketUpdates),
      kvHvals(KV_KEYS.pushSubs),
      kvHvals(KV_KEYS.signals),
      kvHvals(KV_KEYS.signalUpdates),
      kvCommand<string | null>(['GET', KV_KEYS.totalPublishedSignals], false),
    ]);
    msgs = mR;
    reacts = rR;
    updates = uR;
    subs = pR;
    signals = sR;
    signalUpdates = suR;
    if (cR !== null && cR !== undefined) {
      const parsed = Number.parseInt(String(cR), 10);
      if (Number.isFinite(parsed)) totalPublishedSignals = parsed;
    }
  }

  return { msgs, reacts, updates, subs, signals, signalUpdates, totalPublishedSignals };
}

let hydrationDone = false;
let hydrationInFlight: Promise<void> | null = null;

export async function ensureRemoteHydrated(): Promise<void> {
  if (!isRemotePersistentStoreEnabled() || hydrationDone) return;
  if (hydrationInFlight) return hydrationInFlight;

  hydrationInFlight = (async () => {
    try {
      const snap = await fetchAllRemoteSnapshot();

      const expiredRemoteIds: string[] = [];
      const tx = db.transaction(() => {
        if (Array.isArray(snap.msgs)) {
          for (const row of snap.msgs) {
            if (isExpiredNonPinnedActiveMessage(row)) {
              const id = String(row.id || '').trim();
              if (id) expiredRemoteIds.push(id);
            } else {
              upsertLocalSignalMessage(row);
            }
          }
        }
        if (Array.isArray(snap.reacts)) {
          for (const row of snap.reacts) upsertLocalReaction(row);
        }
        if (Array.isArray(snap.updates)) {
          for (const row of snap.updates) upsertLocalMarketUpdate(row);
        }
        if (Array.isArray(snap.subs)) {
          for (const row of snap.subs) upsertLocalPushSubscription(row);
        }
        if (Array.isArray(snap.signals)) {
          for (const row of snap.signals) upsertLocalSignal(row);
        }
        if (Array.isArray(snap.signalUpdates)) {
          for (const row of snap.signalUpdates) upsertLocalSignalUpdate(row);
        }
        if (snap.totalPublishedSignals !== null) {
          syncLocalTotalPublishedSignalsIfHigher(snap.totalPublishedSignals);
        }
      });
      tx();

      if (expiredRemoteIds.length > 0) {
        void Promise.allSettled(expiredRemoteIds.map((id) => deleteRemoteSignalMessage(id)));
      }
      hydrationDone = true;
    } finally {
      hydrationInFlight = null;
    }
  })();

  return hydrationInFlight;
}

export async function refreshSignalsAndStatsFromRemote(): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  try {
    let remoteMsgs: Array<Record<string, unknown>> | null = null;
    let remoteSignals: Array<Record<string, unknown>> | null = null;
    let remoteCounter: number | null = null;

    const pool = await getPgPool(false);
    if (pool) {
      const [mR, sR, cR] = await Promise.all([
        pool.query('SELECT * FROM signal_messages ORDER BY created_at ASC LIMIT 500'),
        pool.query('SELECT * FROM signals ORDER BY created_at DESC LIMIT 300'),
        pool.query("SELECT value FROM platform_settings WHERE key = 'total_published_signals' LIMIT 1"),
      ]);
      remoteMsgs = mR.rows;
      remoteSignals = sR.rows;
      if (cR.rows[0]?.value) {
        const parsed = Number.parseInt(String(cR.rows[0].value), 10);
        if (Number.isFinite(parsed)) remoteCounter = parsed;
      }
    } else if (getSupabaseConfig()) {
      const [mR, sR, cR] = await Promise.all([
        restRequest<Array<Record<string, unknown>>>(
          'signal_messages?select=*&order=created_at.asc&limit=500'
        ),
        restRequest<Array<Record<string, unknown>>>('signals?select=*&order=created_at.desc&limit=300'),
        restRequest<Array<{ key?: string; value?: string }>>(
          'platform_settings?select=key,value&key=eq.total_published_signals&limit=1'
        ),
      ]);
      remoteMsgs = mR;
      remoteSignals = sR;
      if (Array.isArray(cR) && cR[0]?.value) {
        const parsed = Number.parseInt(String(cR[0].value), 10);
        if (Number.isFinite(parsed)) remoteCounter = parsed;
      }
    } else if (getKvConfig()) {
      const [mR, sR, cR] = await Promise.all([
        kvHvals(KV_KEYS.signalMessages),
        kvHvals(KV_KEYS.signals),
        kvCommand<string | null>(['GET', KV_KEYS.totalPublishedSignals], false),
      ]);
      remoteMsgs = mR;
      remoteSignals = sR;
      if (cR !== null && cR !== undefined) {
        const parsed = Number.parseInt(String(cR), 10);
        if (Number.isFinite(parsed)) remoteCounter = parsed;
      }
    }

    const expiredRemoteIds: string[] = [];
    const tx = db.transaction(() => {
      if (Array.isArray(remoteMsgs)) {
        for (const row of remoteMsgs) {
          if (isExpiredNonPinnedActiveMessage(row)) {
            const id = String(row.id || '').trim();
            if (id) expiredRemoteIds.push(id);
          } else {
            upsertLocalSignalMessage(row);
          }
        }
      }
      if (Array.isArray(remoteSignals)) {
        for (const row of remoteSignals) upsertLocalSignal(row);
      }
      if (remoteCounter !== null) {
        syncLocalTotalPublishedSignalsIfHigher(remoteCounter);
      }
    });
    tx();

    if (expiredRemoteIds.length > 0) {
      void Promise.allSettled(expiredRemoteIds.map((id) => deleteRemoteSignalMessage(id)));
    }
  } catch {
    // Allow local SQLite read when remote read fails transiently
  }
}

export async function fetchRemoteSignalMessageById(idOrSourceId: string): Promise<boolean> {
  if (!isRemotePersistentStoreEnabled() || !idOrSourceId) return false;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      const mRes = await pool.query(
        'SELECT * FROM signal_messages WHERE id = $1 OR source_id = $1 LIMIT 1',
        [idOrSourceId]
      );
      if (mRes.rows.length === 0) return false;
      const remoteMsg = mRes.rows[0] as Record<string, unknown>;
      const rRes = await pool.query(
        'SELECT * FROM signal_message_reactions WHERE message_id = $1 LIMIT 2000',
        [String(remoteMsg.id)]
      );
      const tx = db.transaction(() => {
        upsertLocalSignalMessage(remoteMsg);
        for (const r of rRes.rows) upsertLocalReaction(r as Record<string, unknown>);
      });
      tx();
      return true;
    } catch {
      return false;
    }
  }

  if (getSupabaseConfig()) {
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

  if (getKvConfig()) {
    const msgs = await kvHvals(KV_KEYS.signalMessages);
    if (!Array.isArray(msgs)) return false;
    const remoteMsg = msgs.find(
      (m) => String(m.id || '') === idOrSourceId || String(m.source_id || '') === idOrSourceId
    );
    if (!remoteMsg) return false;
    upsertLocalSignalMessage(remoteMsg);
    return true;
  }

  return false;
}

// ---------- Multi-Backend Write / Sync (Strict Support) ----------
export async function syncSignalMessageToRemote(
  messageId: string,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const row = db.prepare('SELECT * FROM signal_messages WHERE id = ?').get(messageId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO signal_messages (
          id, author_id, author_name, content, image_url, image_name,
          media_url, media_type, media_name, message_type, priority, status, pinned,
          edited_at, completed_at, completed_summary, source_type, source_id, is_welcome,
          seed_love, seed_like, seed_fire, seed_hundred,
          love_count, like_count, fire_count, hundred_count, seed_views, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23,
          $24, $25, $26, $27, $28, $29
        )
        ON CONFLICT(id) DO UPDATE SET
          author_name = EXCLUDED.author_name,
          content = EXCLUDED.content,
          image_url = EXCLUDED.image_url,
          image_name = EXCLUDED.image_name,
          media_url = EXCLUDED.media_url,
          media_type = EXCLUDED.media_type,
          media_name = EXCLUDED.media_name,
          message_type = EXCLUDED.message_type,
          priority = EXCLUDED.priority,
          status = EXCLUDED.status,
          pinned = EXCLUDED.pinned,
          edited_at = EXCLUDED.edited_at,
          completed_at = EXCLUDED.completed_at,
          completed_summary = EXCLUDED.completed_summary,
          source_type = EXCLUDED.source_type,
          source_id = EXCLUDED.source_id,
          is_welcome = EXCLUDED.is_welcome,
          seed_love = EXCLUDED.seed_love,
          seed_like = EXCLUDED.seed_like,
          seed_fire = EXCLUDED.seed_fire,
          seed_hundred = EXCLUDED.seed_hundred,
          love_count = EXCLUDED.love_count,
          like_count = EXCLUDED.like_count,
          fire_count = EXCLUDED.fire_count,
          hundred_count = EXCLUDED.hundred_count,
          seed_views = EXCLUDED.seed_views,
          created_at = EXCLUDED.created_at`,
        [
          row.id,
          row.author_id,
          row.author_name,
          row.content,
          row.image_url ?? null,
          row.image_name ?? null,
          row.media_url ?? null,
          row.media_type ?? null,
          row.media_name ?? null,
          row.message_type ?? 'update',
          row.priority ?? 'normal',
          row.status ?? 'active',
          Number(row.pinned || 0),
          row.edited_at ?? null,
          row.completed_at ?? null,
          row.completed_summary ?? null,
          row.source_type ?? null,
          row.source_id ?? null,
          Number(row.is_welcome || 0),
          Number(row.seed_love || 0),
          Number(row.seed_like || 0),
          Number(row.seed_fire || 0),
          Number(row.seed_hundred || 0),
          Number(row.love_count || 0),
          Number(row.like_count || 0),
          Number(row.fire_count || 0),
          Number(row.hundred_count || 0),
          Number(row.seed_views || 0),
          row.created_at,
        ]
      );
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (signal_messages): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      'signal_messages?on_conflict=id',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([row]),
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['HSET', KV_KEYS.signalMessages, messageId, JSON.stringify(row)], strict);
  }
}

export async function syncSignalReactionToRemote(
  messageId: string,
  actorKey: string,
  action: 'upsert' | 'delete'
): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      if (action === 'delete') {
        await pool.query(
          'DELETE FROM signal_message_reactions WHERE message_id = $1 AND actor_key = $2',
          [messageId, actorKey]
        );
      } else {
        const row = db
          .prepare('SELECT * FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
          .get(messageId, actorKey) as Record<string, unknown> | undefined;
        if (row) {
          await pool.query(
            `INSERT INTO signal_message_reactions (message_id, actor_key, user_id, visitor_id, reaction, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT(message_id, actor_key) DO UPDATE SET
               user_id = COALESCE(EXCLUDED.user_id, signal_message_reactions.user_id),
               visitor_id = COALESCE(EXCLUDED.visitor_id, signal_message_reactions.visitor_id),
               reaction = EXCLUDED.reaction,
               created_at = EXCLUDED.created_at`,
            [row.message_id, row.actor_key, row.user_id ?? null, row.visitor_id ?? null, row.reaction, row.created_at]
          );
        }
      }
    } catch {
      // ignore transient error
    }
  }

  if (getSupabaseConfig()) {
    if (action === 'delete') {
      await restRequest(
        `signal_message_reactions?message_id=eq.${encodeURIComponent(messageId)}&actor_key=eq.${encodeURIComponent(actorKey)}`,
        {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        }
      );
    } else {
      const row = db
        .prepare('SELECT * FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
        .get(messageId, actorKey) as Record<string, unknown> | undefined;
      if (row) {
        await restRequest('signal_message_reactions?on_conflict=message_id,actor_key', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([row]),
        });
      }
    }
  }

  if (getKvConfig()) {
    const field = `${messageId}::${actorKey}`;
    if (action === 'delete') {
      await kvCommand(['HDEL', KV_KEYS.reactions, field], false);
    } else {
      const row = db
        .prepare('SELECT * FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
        .get(messageId, actorKey) as Record<string, unknown> | undefined;
      if (row) {
        await kvCommand(['HSET', KV_KEYS.reactions, field, JSON.stringify(row)], false);
      }
    }
  }
}

export async function deleteRemoteSignalMessage(
  messageId: string,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query('DELETE FROM signal_messages WHERE id = $1', [messageId]);
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database delete failed (signal_messages): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      `signal_messages?id=eq.${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['HDEL', KV_KEYS.signalMessages, messageId], strict);
  }
}

export async function syncSignalToRemote(
  signalId: string,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const row = db.prepare('SELECT * FROM signals WHERE id = ?').get(signalId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO signals (
          id, pair, direction, entry_price, stop_loss, tp1, tp2, tp3, tp4,
          risk_reward, timeframe, status, classification, analysis, chart_image_url,
          admin_remarks, is_premium, created_by, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        ON CONFLICT(id) DO UPDATE SET
          pair = EXCLUDED.pair,
          direction = EXCLUDED.direction,
          entry_price = EXCLUDED.entry_price,
          stop_loss = EXCLUDED.stop_loss,
          tp1 = EXCLUDED.tp1,
          tp2 = EXCLUDED.tp2,
          tp3 = EXCLUDED.tp3,
          tp4 = EXCLUDED.tp4,
          risk_reward = EXCLUDED.risk_reward,
          timeframe = EXCLUDED.timeframe,
          status = EXCLUDED.status,
          classification = EXCLUDED.classification,
          analysis = EXCLUDED.analysis,
          chart_image_url = EXCLUDED.chart_image_url,
          admin_remarks = EXCLUDED.admin_remarks,
          is_premium = EXCLUDED.is_premium,
          updated_at = EXCLUDED.updated_at`,
        [
          row.id,
          row.pair,
          row.direction,
          row.entry_price,
          row.stop_loss,
          row.tp1,
          row.tp2 ?? null,
          row.tp3 ?? null,
          row.tp4 ?? null,
          row.risk_reward,
          row.timeframe,
          row.status,
          row.classification,
          row.analysis,
          row.chart_image_url ?? null,
          row.admin_remarks ?? null,
          Number(row.is_premium || 0),
          row.created_by,
          row.created_at,
          row.updated_at,
        ]
      );
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (signals): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      'signals?on_conflict=id',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([row]),
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['HSET', KV_KEYS.signals, signalId, JSON.stringify(row)], strict);
  }
}

export async function syncSignalUpdateToRemote(
  updateId: string,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const row = db.prepare('SELECT * FROM signal_updates WHERE id = ?').get(updateId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET
           note = EXCLUDED.note,
           status_snapshot = EXCLUDED.status_snapshot`,
        [row.id, row.signal_id, row.note, row.status_snapshot, row.created_by, row.created_at]
      );
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (signal_updates): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      'signal_updates?on_conflict=id',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([row]),
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['HSET', KV_KEYS.signalUpdates, updateId, JSON.stringify(row)], strict);
  }
}

export async function deleteRemoteSignal(
  signalId: string,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query('DELETE FROM signals WHERE id = $1', [signalId]);
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database delete failed (signals): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      `signals?id=eq.${encodeURIComponent(signalId)}`,
      {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['HDEL', KV_KEYS.signals, signalId], strict);
  }
}

export async function syncTotalPublishedSignalsToRemote(
  count: number,
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO platform_settings (key, value) VALUES ('total_published_signals', $1)
         ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
        [String(count)]
      );
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (counter): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(
      'platform_settings?on_conflict=key',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ key: 'total_published_signals', value: String(count) }]),
      },
      6000,
      strict
    );
  }

  if (getKvConfig()) {
    await kvCommand(['SET', KV_KEYS.totalPublishedSignals, String(count)], strict);
  }
}

export async function syncMarketUpdateToRemote(updateId: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(updateId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO market_updates (
          id, title, content, category, pinned, is_premium, image_url, video_url,
          attachment_url, attachment_name, external_link, scheduled_at, published,
          author_name, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT(id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          category = EXCLUDED.category,
          pinned = EXCLUDED.pinned,
          is_premium = EXCLUDED.is_premium,
          image_url = EXCLUDED.image_url,
          video_url = EXCLUDED.video_url,
          attachment_url = EXCLUDED.attachment_url,
          attachment_name = EXCLUDED.attachment_name,
          external_link = EXCLUDED.external_link,
          scheduled_at = EXCLUDED.scheduled_at,
          published = EXCLUDED.published,
          author_name = EXCLUDED.author_name,
          updated_at = EXCLUDED.updated_at`,
        [
          row.id,
          row.title,
          row.content,
          row.category,
          Number(row.pinned || 0),
          Number(row.is_premium || 0),
          row.image_url ?? null,
          row.video_url ?? null,
          row.attachment_url ?? null,
          row.attachment_name ?? null,
          row.external_link ?? null,
          row.scheduled_at ?? null,
          Number(row.published ?? 1),
          row.author_name,
          row.created_at,
          row.updated_at,
        ]
      );
    } catch {
      // ignore transient failure
    }
  }

  if (getSupabaseConfig()) {
    await restRequest('market_updates?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([row]),
    });
  }

  if (getKvConfig()) {
    await kvCommand(['HSET', KV_KEYS.marketUpdates, updateId, JSON.stringify(row)], false);
  }
}

export async function syncPushSubscriptionToRemote(endpoint: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  const row = db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?').get(endpoint) as
    | Record<string, unknown>
    | undefined;
  if (!row) return;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO push_subscriptions (
          id, user_id, visitor_id, endpoint, p256dh, auth, user_agent, platform,
          transport, token, browser_name, device_label, prefs_json, sound_enabled,
          is_muted, failure_count, active, last_error, last_success_at, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT(endpoint) DO UPDATE SET
          user_id = COALESCE(EXCLUDED.user_id, push_subscriptions.user_id),
          visitor_id = COALESCE(EXCLUDED.visitor_id, push_subscriptions.visitor_id),
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          platform = COALESCE(EXCLUDED.platform, push_subscriptions.platform),
          transport = EXCLUDED.transport,
          token = EXCLUDED.token,
          browser_name = EXCLUDED.browser_name,
          device_label = EXCLUDED.device_label,
          prefs_json = EXCLUDED.prefs_json,
          sound_enabled = EXCLUDED.sound_enabled,
          is_muted = EXCLUDED.is_muted,
          active = EXCLUDED.active,
          updated_at = EXCLUDED.updated_at`,
        [
          row.id,
          row.user_id ?? null,
          row.visitor_id ?? null,
          row.endpoint,
          row.p256dh,
          row.auth,
          row.user_agent ?? null,
          row.platform ?? 'web',
          row.transport ?? 'web_push',
          row.token ?? null,
          row.browser_name ?? null,
          row.device_label ?? null,
          row.prefs_json ?? null,
          Number(row.sound_enabled ?? 1),
          Number(row.is_muted ?? 0),
          Number(row.failure_count || 0),
          Number(row.active ?? 1),
          row.last_error ?? null,
          row.last_success_at ?? null,
          row.created_at,
          row.updated_at,
        ]
      );
    } catch {
      // ignore transient failure
    }
  }

  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
        method: 'POST',
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify([row]),
      });
      if (!res.ok && 'is_muted' in row) {
        const legacyRow = { ...row };
        delete legacyRow.is_muted;
        await restRequest('push_subscriptions?on_conflict=endpoint', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([legacyRow]),
        });
      }
    } catch {
      // ignore transient remote sync failures
    }
  }

  if (getKvConfig()) {
    await kvCommand(['HSET', KV_KEYS.pushSubs, endpoint, JSON.stringify(row)], false);
  }
}

export async function deleteRemotePushSubscription(endpoint: string): Promise<void> {
  if (!isRemotePersistentStoreEnabled() || !endpoint) return;

  const pool = await getPgPool(false);
  if (pool) {
    try {
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    } catch {
      // ignore
    }
  }

  if (getSupabaseConfig()) {
    await restRequest(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });
  }

  if (getKvConfig()) {
    await kvCommand(['HDEL', KV_KEYS.pushSubs, endpoint], false);
  }
}
