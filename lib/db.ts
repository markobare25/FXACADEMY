import { Redis } from '@upstash/redis';
import pg from 'pg';
import {
  db,
  DEFAULT_TOTAL_PUBLISHED_SIGNALS,
  DESIGNATED_ADMIN_EMAIL,
  ensureDesignatedAdminUser,
  getTotalPublishedSignals,
  getWelcomeSeedReactions,
  setTotalPublishedSignals,
  SIGNAL_MESSAGE_TTL_MS,
  syncLocalTotalPublishedSignalsIfHigher,
  WELCOME_SEED_VIEWS,
} from '../server/db.ts';

const { Pool } = pg;

export interface SyncOptions {
  strict?: boolean;
}

export type DetectedBackendType = 'postgres' | 'upstash-redis' | 'supabase' | 'sqlite';

const WELCOME_ID = '00000000-0000-4000-8000-000000000001';

const KV_KEYS = {
  signalMessages: 'mfx:signal_messages',
  reactions: 'mfx:signal_message_reactions',
  signals: 'mfx:signals',
  signalUpdates: 'mfx:signal_updates',
  marketUpdates: 'mfx:market_updates',
  pushSubs: 'mfx:push_subscriptions',
  totalPublishedSignals: 'mfx:total_published_signals',
};

const DDL_STATEMENTS = `
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
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS is_welcome INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS seed_love INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS seed_like INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS seed_fire INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS seed_hundred INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS love_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS fire_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS hundred_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE signal_messages ADD COLUMN IF NOT EXISTS seed_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS is_muted INTEGER NOT NULL DEFAULT 0;
`;

function cleanEnv(raw: string | undefined): string {
  if (!raw) return '';
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

// ---------- Universal Vercel Marketplace Environment Auto-Detection ----------
export function getPgConfig(): string | null {
  const priorityKeys = [
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_URL_NO_SSL',
    'DATABASE_URL_UNPOOLED',
    'NEON_DATABASE_URL',
    'SUPABASE_POSTGRES_URL',
    'SUPABASE_DB_URL',
  ];

  for (const key of priorityKeys) {
    const val = cleanEnv(process.env[key]);
    if (val && /^postgres(ql)?:\/\//i.test(val)) {
      return val;
    }
  }

  // Scan dynamically for custom-prefixed Vercel Marketplace Postgres / Neon variables
  for (const key of Object.keys(process.env)) {
    if (/(^|_)(POSTGRES|DATABASE|NEON|PG)(_.*)?_URL$/i.test(key)) {
      const val = cleanEnv(process.env[key]);
      if (val && /^postgres(ql)?:\/\//i.test(val)) {
        return val;
      }
    }
  }

  return null;
}

export function getRedisConfig(): { url: string; token: string } | null {
  const directPairs: Array<[string, string]> = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['STORAGE_REST_API_URL', 'STORAGE_REST_API_TOKEN'],
    ['REDIS_REST_API_URL', 'REDIS_REST_API_TOKEN'],
  ];

  for (const [urlKey, tokenKey] of directPairs) {
    const url = cleanEnv(process.env[urlKey]).replace(/\/+$/, '');
    const token = cleanEnv(process.env[tokenKey]);
    if (url && token && /^https?:\/\//i.test(url)) {
      return { url, token };
    }
  }

  // Scan dynamically for custom-prefixed Vercel Marketplace Redis / KV variables
  const envKeys = Object.keys(process.env);
  for (const key of envKeys) {
    let tokenKey: string | null = null;
    if (key.endsWith('_UPSTASH_REDIS_REST_URL')) {
      tokenKey = `${key.slice(0, -4)}_TOKEN`;
    } else if (key.endsWith('_KV_REST_API_URL')) {
      tokenKey = `${key.slice(0, -4)}_TOKEN`;
    } else if (key.endsWith('_REST_API_URL')) {
      tokenKey = `${key.slice(0, -4)}_TOKEN`;
    }

    if (tokenKey) {
      const url = cleanEnv(process.env[key]).replace(/\/+$/, '');
      const token = cleanEnv(process.env[tokenKey]);
      if (url && token && /^https?:\/\//i.test(url)) {
        return { url, token };
      }
    }
  }

  // Support Upstash TCP URLs (rediss://default:<token>@<host>.upstash.io:<port>) by upgrading to REST API
  const tcpKeys = ['UPSTASH_REDIS_URL', 'KV_URL', 'REDIS_URL'];
  for (const key of envKeys) {
    if (/(^|_)(UPSTASH_REDIS|KV|REDIS)_URL$/i.test(key) && !tcpKeys.includes(key)) {
      tcpKeys.push(key);
    }
  }
  for (const key of tcpKeys) {
    const raw = cleanEnv(process.env[key]);
    if (!raw) continue;
    if (/^rediss?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        if (parsed.hostname.endsWith('.upstash.io') && parsed.password) {
          return {
            url: `https://${parsed.hostname}`,
            token: decodeURIComponent(parsed.password),
          };
        }
      } catch {
        // ignore malformed URL
      }
    }
  }

  return null;
}

export function getSupabaseConfig(): { url: string; key: string } | null {
  const urlKeys = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'];
  for (const key of Object.keys(process.env)) {
    if (key.endsWith('_SUPABASE_URL') && !urlKeys.includes(key)) {
      urlKeys.push(key);
    }
  }

  let url = '';
  for (const k of urlKeys) {
    const candidate = cleanEnv(process.env[k]).replace(/\/+$/, '');
    if (candidate && /^https?:\/\//i.test(candidate)) {
      url = candidate;
      break;
    }
  }
  if (!url) return null;

  const keyPriority = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  for (const key of Object.keys(process.env)) {
    if (
      (key.endsWith('_SUPABASE_SERVICE_ROLE_KEY') ||
        key.endsWith('_SUPABASE_SERVICE_KEY') ||
        key.endsWith('_SUPABASE_SECRET_KEY')) &&
      !keyPriority.includes(key)
    ) {
      keyPriority.unshift(key);
    }
  }

  let apiKey = '';
  for (const k of keyPriority) {
    const candidate = cleanEnv(process.env[k]);
    if (candidate) {
      apiKey = candidate;
      break;
    }
  }

  if (!apiKey) return null;
  return { url, key: apiKey };
}

export function getDetectedBackends(): DetectedBackendType[] {
  const active: DetectedBackendType[] = [];
  if (getPgConfig()) active.push('postgres');
  if (getRedisConfig()) active.push('upstash-redis');
  if (getSupabaseConfig()) active.push('supabase');
  if (active.length === 0) active.push('sqlite');
  return active;
}

export function isRemotePersistentStoreEnabled(): boolean {
  return Boolean(getPgConfig() || getRedisConfig() || getSupabaseConfig());
}

export function assertPersistentDatabaseReady(): void {
  if (process.env.VERCEL && !isRemotePersistentStoreEnabled()) {
    throw new Error(
      'External database persistence is not configured. Connect a Vercel Marketplace database (Upstash Redis / Vercel KV, Postgres / Neon, or Supabase) so its environment variables are available.'
    );
  }
}

// ---------- Upstash Redis Client (@upstash/redis) ----------
let redisClient: Redis | null = null;
let redisFingerprint = '';

function getRedisClient(): Redis | null {
  const cfg = getRedisConfig();
  if (!cfg) {
    redisClient = null;
    redisFingerprint = '';
    return null;
  }
  const fp = `${cfg.url}|${cfg.token}`;
  if (!redisClient || redisFingerprint !== fp) {
    redisClient = new Redis({ url: cfg.url, token: cfg.token });
    redisFingerprint = fp;
  }
  return redisClient;
}

async function redisHvals(hashKey: string): Promise<Array<Record<string, unknown>> | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const rawList = (await redis.hvals(hashKey)) as unknown;
    if (!Array.isArray(rawList)) return [];
    const out: Array<Record<string, unknown>> = [];
    for (const item of rawList) {
      try {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
        if (parsed && typeof parsed === 'object') {
          out.push(parsed as Record<string, unknown>);
        }
      } catch {
        // skip malformed value
      }
    }
    return out;
  } catch {
    return null;
  }
}

// ---------- PostgreSQL / Neon Client (Auto DDL) ----------
let pgPool: pg.Pool | null = null;
let pgFingerprint = '';
let pgSchemaPromise: Promise<void> | null = null;

async function getPgPool(strict = false): Promise<pg.Pool | null> {
  const conn = getPgConfig();
  if (!conn) return null;

  try {
    if (!pgPool || pgFingerprint !== conn) {
      const oldPool = pgPool;
      if (oldPool) {
        void oldPool.end().catch(() => {});
      }
      const isLocal = /localhost|127\.0\.0\.1/i.test(conn);
      pgPool = new Pool({
        connectionString: conn,
        max: 5,
        connectionTimeoutMillis: 8000,
        idleTimeoutMillis: 20_000,
        ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
      });
      pgFingerprint = conn;
      pgSchemaPromise = null;
    }

    if (!pgSchemaPromise) {
      pgSchemaPromise = pgPool
        .query(DDL_STATEMENTS)
        .then(() => undefined)
        .catch((err) => {
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

// ---------- Supabase REST Client (Auto Schema Attempt) ----------
let supabaseSchemaAttempted = false;

async function ensureSupabaseSchema(): Promise<void> {
  if (supabaseSchemaAttempted) return;
  const cfg = getSupabaseConfig();
  if (!cfg) return;
  supabaseSchemaAttempted = true;

  // If Postgres connection string is also injected (default on Vercel Supabase Marketplace), DDL already ran
  if (getPgConfig()) {
    await getPgPool(false);
    return;
  }

  // Otherwise attempt pg-meta SQL bootstrap with service role key (fails quietly if disallowed)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${cfg.url}/pg/query`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: DDL_STATEMENTS }),
    });
  } catch {
    // ignore if pg-meta is disabled
  } finally {
    clearTimeout(timer);
  }
}

async function restRequest<T = unknown>(
  pathWithQuery: string,
  init: RequestInit = {},
  timeoutMs = 7000,
  strict = false
): Promise<T | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  await ensureSupabaseSchema();

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
    String(row.author_name || row.senderName || 'MeridianFX Desk'),
    finalContent,
    row.image_url ? String(row.image_url) : row.imageUrl ? String(row.imageUrl) : null,
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
    String(row.created_at || row.createdAt || new Date().toISOString())
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

// ---------- Multi-Backend Hydration & Live Refresh ----------
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
      // fall through to other configured backends
    }
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const [mR, rR, uR, pR, sR, suR, cR] = await Promise.all([
        redisHvals(KV_KEYS.signalMessages),
        redisHvals(KV_KEYS.reactions),
        redisHvals(KV_KEYS.marketUpdates),
        redisHvals(KV_KEYS.pushSubs),
        redisHvals(KV_KEYS.signals),
        redisHvals(KV_KEYS.signalUpdates),
        redis.get<string | number | null>(KV_KEYS.totalPublishedSignals),
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
      return { msgs, reacts, updates, subs, signals, signalUpdates, totalPublishedSignals };
    } catch {
      // fall through to supabase if configured
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

      // Seed Welcome Message and baseline counter into fresh remote databases on first boot
      const hasRemoteWelcome = Array.isArray(snap.msgs)
        ? snap.msgs.some((m) => Number(m.is_welcome || 0) === 1 || String(m.source_type || '') === 'welcome')
        : false;
      if (!hasRemoteWelcome) {
        const localWelcome = db
          .prepare("SELECT id FROM signal_messages WHERE is_welcome = 1 OR source_type = 'welcome' LIMIT 1")
          .get() as { id: string } | undefined;
        if (localWelcome?.id) {
          await syncSignalMessageToRemote(localWelcome.id, { strict: false }).catch(() => {});
        }
      }
      if (snap.totalPublishedSignals === null) {
        await syncTotalPublishedSignalsToRemote(getTotalPublishedSignals(), { strict: false }).catch(() => {});
      }

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
    let remoteReacts: Array<Record<string, unknown>> | null = null;
    let remoteSignals: Array<Record<string, unknown>> | null = null;
    let remoteSubs: Array<Record<string, unknown>> | null = null;
    let remoteCounter: number | null = null;

    const pool = await getPgPool(false);
    if (pool) {
      const [mR, rR, sR, pR, cR] = await Promise.all([
        pool.query('SELECT * FROM signal_messages ORDER BY created_at ASC LIMIT 500'),
        pool.query('SELECT * FROM signal_message_reactions LIMIT 5000'),
        pool.query('SELECT * FROM signals ORDER BY created_at DESC LIMIT 300'),
        pool.query('SELECT * FROM push_subscriptions LIMIT 1000'),
        pool.query("SELECT value FROM platform_settings WHERE key = 'total_published_signals' LIMIT 1"),
      ]);
      remoteMsgs = mR.rows;
      remoteReacts = rR.rows;
      remoteSignals = sR.rows;
      remoteSubs = pR.rows;
      if (cR.rows[0]?.value) {
        const parsed = Number.parseInt(String(cR.rows[0].value), 10);
        if (Number.isFinite(parsed)) remoteCounter = parsed;
      }
    } else {
      const redis = getRedisClient();
      if (redis) {
        const [mR, rR, sR, pR, cR] = await Promise.all([
          redisHvals(KV_KEYS.signalMessages),
          redisHvals(KV_KEYS.reactions),
          redisHvals(KV_KEYS.signals),
          redisHvals(KV_KEYS.pushSubs),
          redis.get<string | number | null>(KV_KEYS.totalPublishedSignals),
        ]);
        remoteMsgs = mR;
        remoteReacts = rR;
        remoteSignals = sR;
        remoteSubs = pR;
        if (cR !== null && cR !== undefined) {
          const parsed = Number.parseInt(String(cR), 10);
          if (Number.isFinite(parsed)) remoteCounter = parsed;
        }
      } else if (getSupabaseConfig()) {
        const [mR, rR, sR, pR, cR] = await Promise.all([
          restRequest<Array<Record<string, unknown>>>(
            'signal_messages?select=*&order=created_at.asc&limit=500'
          ),
          restRequest<Array<Record<string, unknown>>>(
            'signal_message_reactions?select=*&limit=5000'
          ),
          restRequest<Array<Record<string, unknown>>>('signals?select=*&order=created_at.desc&limit=300'),
          restRequest<Array<Record<string, unknown>>>('push_subscriptions?select=*&limit=1000'),
          restRequest<Array<{ key?: string; value?: string }>>(
            'platform_settings?select=key,value&key=eq.total_published_signals&limit=1'
          ),
        ]);
        remoteMsgs = mR;
        remoteReacts = rR;
        remoteSignals = sR;
        remoteSubs = pR;
        if (Array.isArray(cR) && cR[0]?.value) {
          const parsed = Number.parseInt(String(cR[0].value), 10);
          if (Number.isFinite(parsed)) remoteCounter = parsed;
        }
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
      if (Array.isArray(remoteReacts)) {
        for (const row of remoteReacts) upsertLocalReaction(row);
      }
      if (Array.isArray(remoteSignals)) {
        for (const row of remoteSignals) upsertLocalSignal(row);
      }
      if (Array.isArray(remoteSubs)) {
        for (const row of remoteSubs) upsertLocalPushSubscription(row);
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

export async function refreshPushSubscriptionsFromRemote(): Promise<void> {
  if (!isRemotePersistentStoreEnabled()) return;
  try {
    let remoteSubs: Array<Record<string, unknown>> | null = null;
    const pool = await getPgPool(false);
    if (pool) {
      const pR = await pool.query('SELECT * FROM push_subscriptions LIMIT 1000');
      remoteSubs = pR.rows;
    } else if (getRedisClient()) {
      remoteSubs = await redisHvals(KV_KEYS.pushSubs);
    } else if (getSupabaseConfig()) {
      remoteSubs = await restRequest<Array<Record<string, unknown>>>('push_subscriptions?select=*&limit=1000');
    }

    if (Array.isArray(remoteSubs)) {
      const tx = db.transaction(() => {
        for (const row of remoteSubs!) {
          upsertLocalPushSubscription(row);
        }
      });
      tx();
    }
  } catch {
    // ignore transient failure
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
      if (mRes.rows.length > 0) {
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
      }
    } catch {
      // fall through
    }
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      let remoteMsg: Record<string, unknown> | null = null;
      const direct = await redis.hget<unknown>(KV_KEYS.signalMessages, idOrSourceId);
      if (direct) {
        const parsed = typeof direct === 'string' ? JSON.parse(direct) : direct;
        if (parsed && typeof parsed === 'object') {
          remoteMsg = parsed as Record<string, unknown>;
        }
      }
      if (!remoteMsg) {
        const msgs = await redisHvals(KV_KEYS.signalMessages);
        if (Array.isArray(msgs)) {
          remoteMsg =
            msgs.find(
              (m) => String(m.id || '') === idOrSourceId || String(m.source_id || '') === idOrSourceId
            ) || null;
        }
      }
      if (remoteMsg) {
        const allReacts = await redisHvals(KV_KEYS.reactions);
        const msgId = String(remoteMsg.id || '');
        const tx = db.transaction(() => {
          upsertLocalSignalMessage(remoteMsg!);
          if (Array.isArray(allReacts)) {
            for (const r of allReacts) {
              if (String(r.message_id || '') === msgId) {
                upsertLocalReaction(r);
              }
            }
          }
        });
        tx();
        return true;
      }
    } catch {
      // fall through
    }
  }

  if (getSupabaseConfig()) {
    const enc = encodeURIComponent(idOrSourceId);
    const rows = await restRequest<Array<Record<string, unknown>>>(
      `signal_messages?select=*&or=(id.eq.${enc},source_id.eq.${enc})&limit=1`
    );
    if (Array.isArray(rows) && rows.length > 0) {
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
  }

  return false;
}

// ---------- Atomic Published Counter Increment ----------
export async function incrementTotalPublishedSignalsRemote(
  localFallbackNext?: number,
  options: SyncOptions = {}
): Promise<number> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();

  let syncedValue: number | null = null;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      const res = await pool.query<{ value: string }>(
        `INSERT INTO platform_settings (key, value)
         VALUES ('total_published_signals', $1)
         ON CONFLICT(key) DO UPDATE SET
           value = (GREATEST(
             COALESCE(NULLIF(platform_settings.value, '')::integer, $2),
             $2
           ) + 1)::text
         RETURNING value`,
        [String(DEFAULT_TOTAL_PUBLISHED_SIGNALS + 1), DEFAULT_TOTAL_PUBLISHED_SIGNALS]
      );
      const parsed = Number.parseInt(String(res.rows[0]?.value || ''), 10);
      if (Number.isFinite(parsed)) {
        syncedValue = parsed;
      }
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (counter): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const currentRaw = await redis.get<string | number | null>(KV_KEYS.totalPublishedSignals);
      const currentParsed =
        currentRaw !== null && currentRaw !== undefined
          ? Number.parseInt(String(currentRaw), 10)
          : NaN;
      if (!Number.isFinite(currentParsed) || currentParsed < DEFAULT_TOTAL_PUBLISHED_SIGNALS) {
        await redis.set(KV_KEYS.totalPublishedSignals, DEFAULT_TOTAL_PUBLISHED_SIGNALS, { nx: true });
      }
      const nextRedis = await redis.incr(KV_KEYS.totalPublishedSignals);
      if (Number.isFinite(nextRedis)) {
        syncedValue = syncedValue !== null ? Math.max(syncedValue, nextRedis) : nextRedis;
      }
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (counter): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig() && !pool) {
    const nextVal =
      syncedValue ??
      localFallbackNext ??
      Math.max(getTotalPublishedSignals(), DEFAULT_TOTAL_PUBLISHED_SIGNALS + 1);
    await restRequest(
      'platform_settings?on_conflict=key',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ key: 'total_published_signals', value: String(nextVal) }]),
      },
      7000,
      strict
    );
    syncedValue = nextVal;
  }

  if (syncedValue !== null) {
    setTotalPublishedSignals(syncedValue);
    return syncedValue;
  }

  return localFallbackNext ?? getTotalPublishedSignals();
}

// ---------- Multi-Backend Write / Sync (Strict Support) ----------
function serializeMessageForStore(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    senderName: String(row.author_name || 'MeridianFX Desk'),
    category: 'Trading Signal',
    imageUrl: row.image_url ?? row.media_url ?? null,
    isPinned: Boolean(row.pinned),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hset(KV_KEYS.signalMessages, {
        [messageId]: JSON.stringify(serializeMessageForStore(row)),
      });
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (signal_messages): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
  }
}

export async function syncSignalReactionToRemote(
  messageId: string,
  actorKey: string,
  action: 'upsert' | 'delete',
  options: SyncOptions = {}
): Promise<void> {
  const strict = Boolean(options.strict);
  if (strict) assertPersistentDatabaseReady();
  if (!isRemotePersistentStoreEnabled()) return;

  const row =
    action === 'upsert'
      ? (db
          .prepare('SELECT * FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
          .get(messageId, actorKey) as Record<string, unknown> | undefined)
      : undefined;

  const pool = await getPgPool(strict);
  if (pool) {
    try {
      if (action === 'delete') {
        await pool.query(
          'DELETE FROM signal_message_reactions WHERE message_id = $1 AND actor_key = $2',
          [messageId, actorKey]
        );
      } else if (row) {
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
    } catch (err) {
      if (strict) {
        throw new Error(
          `Database write failed (reactions): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const field = `${messageId}::${actorKey}`;
      if (action === 'delete') {
        await redis.hdel(KV_KEYS.reactions, field);
      } else if (row) {
        await redis.hset(KV_KEYS.reactions, { [field]: JSON.stringify(row) });
      }
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (reactions): ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (getSupabaseConfig()) {
    if (action === 'delete') {
      await restRequest(
        `signal_message_reactions?message_id=eq.${encodeURIComponent(messageId)}&actor_key=eq.${encodeURIComponent(actorKey)}`,
        {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        },
        7000,
        strict
      );
    } else if (row) {
      await restRequest(
        'signal_message_reactions?on_conflict=message_id,actor_key',
        {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([row]),
        },
        7000,
        strict
      );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hdel(KV_KEYS.signalMessages, messageId);
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis delete failed (signal_messages): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hset(KV_KEYS.signals, { [signalId]: JSON.stringify(row) });
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (signals): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hset(KV_KEYS.signalUpdates, { [updateId]: JSON.stringify(row) });
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (signal_updates): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hdel(KV_KEYS.signals, signalId);
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis delete failed (signals): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(KV_KEYS.totalPublishedSignals, String(count));
    } catch (err) {
      if (strict) {
        throw new Error(
          `Redis write failed (counter): ${err instanceof Error ? err.message : String(err)}`
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
      7000,
      strict
    );
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hset(KV_KEYS.marketUpdates, { [updateId]: JSON.stringify(row) });
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hset(KV_KEYS.pushSubs, { [endpoint]: JSON.stringify(row) });
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
      // ignore transient failure
    }
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.hdel(KV_KEYS.pushSubs, endpoint);
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
}

export { WELCOME_ID };
