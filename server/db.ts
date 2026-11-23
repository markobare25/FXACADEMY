import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ALL_CURRICULUM_COURSES } from './curriculum/index.ts';

function resolveDataDir(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'meridianfx-data');
  }
  const localDir = path.resolve(process.cwd(), 'data');
  try {
    fs.mkdirSync(localDir, { recursive: true });
    return localDir;
  } catch {
    return path.join(os.tmpdir(), 'meridianfx-data');
  }
}

const DATA_DIR = resolveDataDir();
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'meridianfx.db');
export const UPLOAD_DIR = UPLOADS_DIR;
export const BACKUP_DIR = BACKUPS_DIR;

export const DESIGNATED_ADMIN_EMAIL = (
  process.env.DESIGNATED_ADMIN_EMAIL || 'markobare25@gmail.com'
).toLowerCase();

export const DESIGNATED_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6
    ? process.env.ADMIN_PASSWORD
    : 'Slate#1206';

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      email_verified INTEGER NOT NULL DEFAULT 0,
      avatar_url TEXT,
      bio TEXT,
      timezone TEXT DEFAULT 'UTC',
      notification_prefs TEXT NOT NULL DEFAULT '{"signals":true,"signal_updates":true,"signal_chat":true,"market_updates":true,"academy":true,"economic_calendar":true,"announcements":true,"sound_enabled":true}',
      watchlist TEXT NOT NULL DEFAULT '["EURUSD","GBPUSD","XAUUSD","BTCUSD"]',
      needs_password_setup INTEGER NOT NULL DEFAULT 0,
      tokens_valid_after TEXT,
      terms_accepted_at TEXT,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token_hash TEXT,
      prev_refresh_token_hash TEXT,
      prev_grace_until TEXT,
      remember_me INTEGER NOT NULL DEFAULT 1,
      user_agent TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, revoked_at);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_exp ON user_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token_hash TEXT PRIMARY KEY,
      expires_at TEXT NOT NULL,
      revoked_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE
    );

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
      created_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_signal_messages_status_created
      ON signal_messages(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS signal_message_reactions (
      message_id TEXT NOT NULL,
      actor_key TEXT NOT NULL,
      user_id TEXT,
      visitor_id TEXT,
      reaction TEXT NOT NULL CHECK (reaction IN ('love', 'like', 'fire', 'hundred', 'dislike')),
      created_at TEXT NOT NULL,
      PRIMARY KEY (message_id, actor_key),
      FOREIGN KEY (message_id) REFERENCES signal_messages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_signal_reactions_msg
      ON signal_message_reactions(message_id);

    CREATE TABLE IF NOT EXISTS market_updates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS update_reactions (
      update_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (update_id, user_id, emoji),
      FOREIGN KEY (update_id) REFERENCES market_updates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS update_bookmarks (
      update_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (update_id, user_id),
      FOREIGN KEY (update_id) REFERENCES market_updates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      slug TEXT,
      course_number INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      level_label TEXT,
      prerequisites TEXT,
      learning_outcomes_json TEXT DEFAULT '[]',
      estimated_hours REAL DEFAULT 3.0,
      status TEXT NOT NULL DEFAULT 'published',
      assessment_json TEXT DEFAULT '[]',
      cover_image_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      learning_objective TEXT,
      introduction TEXT,
      content TEXT NOT NULL,
      demonstration TEXT,
      common_mistakes_json TEXT DEFAULT '[]',
      summary_recap TEXT,
      practical_exercise_json TEXT,
      visual_key TEXT,
      video_url TEXT,
      audio_url TEXT,
      transcript TEXT,
      pdf_url TEXT,
      image_url TEXT,
      sources_json TEXT DEFAULT '[]',
      tags_json TEXT DEFAULT '[]',
      duration_minutes INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'published',
      scheduled_at TEXT,
      published_at TEXT,
      updated_at TEXT,
      material_version INTEGER NOT NULL DEFAULT 1,
      quiz_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      enrolled_at TEXT NOT NULL,
      last_lesson_id TEXT,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      bookmarked INTEGER NOT NULL DEFAULT 0,
      quiz_score INTEGER,
      scroll_pct INTEGER NOT NULL DEFAULT 0,
      needs_review INTEGER NOT NULL DEFAULT 0,
      needs_review_note TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_academy_state (
      user_id TEXT PRIMARY KEY,
      last_course_id TEXT,
      last_lesson_id TEXT,
      last_scroll_pct INTEGER NOT NULL DEFAULT 0,
      flashcard_progress_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_assessments (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      certificate_id TEXT,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_versions (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      change_note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS academy_audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_content_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reporter_name TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      lesson_title TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolution_note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      hidden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      comment_id TEXT,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      link_url TEXT NOT NULL DEFAULT '/',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (notification_id, user_id),
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      prefs_json TEXT NOT NULL DEFAULT '{"signals":true,"signal_updates":true,"signal_chat":true,"market_updates":true,"academy":true,"economic_calendar":true,"announcements":true,"sound_enabled":true}',
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      failure_count INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      last_error TEXT,
      last_success_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS push_jobs (
      id TEXT PRIMARY KEY,
      dedup_key TEXT NOT NULL UNIQUE,
      signal_message_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      link_url TEXT NOT NULL DEFAULT '/signals',
      image_url TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      published_at TEXT NOT NULL,
      sound INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'queued',
      total_targeted INTEGER NOT NULL DEFAULT 0,
      queued_count INTEGER NOT NULL DEFAULT 0,
      delivered_count INTEGER NOT NULL DEFAULT 0,
      confirmed_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_job_deliveries (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      subscription_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      transport TEXT NOT NULL DEFAULT 'web_push',
      status TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 4,
      next_attempt_at TEXT NOT NULL,
      last_error TEXT,
      status_code INTEGER,
      delivered_at TEXT,
      device_received_at TEXT,
      opened_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(job_id, subscription_id),
      FOREIGN KEY (job_id) REFERENCES push_jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_push_deliveries_pending
      ON push_job_deliveries(status, next_attempt_at);

    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      link_url TEXT NOT NULL DEFAULT '/',
      target_user_ids TEXT,
      scheduled_at TEXT NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_dispatch_logs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      total_targeted INTEGER NOT NULL DEFAULT 0,
      delivered_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      reference_code TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      admin_reply TEXT,
      replied_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_applications (
      id TEXT PRIMARY KEY,
      reference_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL,
      preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('Email', 'WhatsApp', 'Phone Call')),
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      member_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_conversations (
      id TEXT PRIMARY KEY,
      reference_code TEXT NOT NULL UNIQUE,
      visitor_name TEXT NOT NULL,
      visitor_email TEXT,
      visitor_phone TEXT,
      visitor_id TEXT,
      access_token_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
      unread_admin INTEGER NOT NULL DEFAULT 0,
      unread_visitor INTEGER NOT NULL DEFAULT 0,
      last_message_preview TEXT,
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin')),
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      attachment_url TEXT,
      attachment_name TEXT,
      read_by_admin INTEGER NOT NULL DEFAULT 0,
      read_by_visitor INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure backward-compatible column upgrades on pre-existing databases
  const ensureColumn = (table: string, column: string, definition: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  ensureColumn('courses', 'slug', 'TEXT');
  ensureColumn('courses', 'course_number', 'INTEGER');
  ensureColumn('courses', 'level_label', 'TEXT');
  ensureColumn('courses', 'prerequisites', 'TEXT');
  ensureColumn('courses', 'learning_outcomes_json', "TEXT DEFAULT '[]'");
  ensureColumn('courses', 'estimated_hours', 'REAL DEFAULT 3.0');
  ensureColumn('courses', 'status', "TEXT NOT NULL DEFAULT 'published'");
  ensureColumn('courses', 'assessment_json', "TEXT DEFAULT '[]'");
  ensureColumn('courses', 'updated_at', 'TEXT');

  ensureColumn('lessons', 'learning_objective', 'TEXT');
  ensureColumn('lessons', 'introduction', 'TEXT');
  ensureColumn('lessons', 'demonstration', 'TEXT');
  ensureColumn('lessons', 'common_mistakes_json', "TEXT DEFAULT '[]'");
  ensureColumn('lessons', 'summary_recap', 'TEXT');
  ensureColumn('lessons', 'practical_exercise_json', 'TEXT');
  ensureColumn('lessons', 'visual_key', 'TEXT');
  ensureColumn('lessons', 'audio_url', 'TEXT');
  ensureColumn('lessons', 'transcript', 'TEXT');
  ensureColumn('lessons', 'sources_json', "TEXT DEFAULT '[]'");
  ensureColumn('lessons', 'tags_json', "TEXT DEFAULT '[]'");
  ensureColumn('lessons', 'status', "TEXT NOT NULL DEFAULT 'published'");
  ensureColumn('lessons', 'scheduled_at', 'TEXT');
  ensureColumn('lessons', 'published_at', 'TEXT');
  ensureColumn('lessons', 'updated_at', 'TEXT');
  ensureColumn('lessons', 'material_version', 'INTEGER NOT NULL DEFAULT 1');

  ensureColumn('lesson_progress', 'scroll_pct', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('lesson_progress', 'needs_review', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('lesson_progress', 'needs_review_note', 'TEXT');
  ensureColumn('users', 'needs_password_setup', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('signal_messages', 'source_type', 'TEXT');
  ensureColumn('signal_messages', 'source_id', 'TEXT');
  ensureColumn('signal_messages', 'media_url', 'TEXT');
  ensureColumn('signal_messages', 'media_type', 'TEXT');
  ensureColumn('signal_messages', 'media_name', 'TEXT');
  ensureColumn('signal_messages', 'priority', "TEXT NOT NULL DEFAULT 'normal'");
  ensureColumn('push_subscriptions', 'visitor_id', 'TEXT');
  ensureColumn('push_subscriptions', 'active', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('push_subscriptions', 'platform', 'TEXT');
  ensureColumn('push_subscriptions', 'transport', "TEXT NOT NULL DEFAULT 'web_push'");
  ensureColumn('push_subscriptions', 'token', 'TEXT');
  ensureColumn('push_subscriptions', 'browser_name', 'TEXT');
  ensureColumn('push_subscriptions', 'device_label', 'TEXT');
  ensureColumn('push_subscriptions', 'prefs_json', 'TEXT');
  ensureColumn('push_subscriptions', 'sound_enabled', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('push_subscriptions', 'failure_count', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('push_subscriptions', 'last_error', 'TEXT');
  ensureColumn('push_subscriptions', 'last_success_at', 'TEXT');
  ensureColumn('push_subscriptions', 'updated_at', 'TEXT');
  ensureColumn('users', 'username', 'TEXT');
  ensureColumn('users', 'membership_expires_at', 'TEXT');
  ensureColumn('users', 'membership_notes', 'TEXT');
  ensureColumn('users', 'tokens_valid_after', 'TEXT');
  ensureColumn('users', 'terms_accepted_at', 'TEXT');
  ensureColumn('signals', 'is_premium', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('market_updates', 'is_premium', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('courses', 'is_premium', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('lessons', 'is_premium', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('user_sessions', 'refresh_token_hash', 'TEXT');
  ensureColumn('user_sessions', 'prev_refresh_token_hash', 'TEXT');
  ensureColumn('user_sessions', 'prev_grace_until', 'TEXT');
  ensureColumn('user_sessions', 'remember_me', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('push_jobs', 'sound', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('push_jobs', 'priority', "TEXT NOT NULL DEFAULT 'normal'");
  ensureColumn('push_jobs', 'confirmed_count', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('push_job_deliveries', 'transport', "TEXT NOT NULL DEFAULT 'web_push'");
  ensureColumn('push_job_deliveries', 'device_received_at', 'TEXT');
  ensureColumn('push_job_deliveries', 'opened_at', 'TEXT');
  ensureColumn('contact_messages', 'reference_code', 'TEXT');
  ensureColumn('contact_messages', 'phone', 'TEXT');
  ensureColumn('contact_messages', 'admin_reply', 'TEXT');
  ensureColumn('contact_messages', 'replied_at', 'TEXT');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh
      ON user_sessions(refresh_token_hash);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
      ON users(LOWER(username))
      WHERE username IS NOT NULL AND username != '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_messages_source
      ON signal_messages(source_type, source_id)
      WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_membership_apps_status
      ON membership_applications(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_support_convs_last
      ON support_conversations(status, last_message_at);
    CREATE INDEX IF NOT EXISTS idx_support_msgs_conv
      ON support_messages(conversation_id, created_at);
  `);

  // Migrate legacy signal_message_reactions table (2 reactions + user_id PK) to 5-reaction public actor_key schema
  const reactionTableMeta = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'signal_message_reactions'")
    .get() as { sql?: string } | undefined;

  if (
    reactionTableMeta?.sql &&
    (!reactionTableMeta.sql.includes('actor_key') || !reactionTableMeta.sql.includes("'fire'"))
  ) {
    const migrateReactions = db.transaction(() => {
      db.exec(`
        CREATE TABLE signal_message_reactions_migrated (
          message_id TEXT NOT NULL,
          actor_key TEXT NOT NULL,
          user_id TEXT,
          visitor_id TEXT,
          reaction TEXT NOT NULL CHECK (reaction IN ('love', 'like', 'fire', 'hundred', 'dislike')),
          created_at TEXT NOT NULL,
          PRIMARY KEY (message_id, actor_key),
          FOREIGN KEY (message_id) REFERENCES signal_messages(id) ON DELETE CASCADE
        );
        INSERT INTO signal_message_reactions_migrated (message_id, actor_key, user_id, visitor_id, reaction, created_at)
        SELECT message_id, 'user:' || user_id, user_id, NULL, reaction, created_at
        FROM signal_message_reactions
        WHERE reaction IN ('love', 'like', 'fire', 'hundred', 'dislike');
        DROP TABLE signal_message_reactions;
        ALTER TABLE signal_message_reactions_migrated RENAME TO signal_message_reactions;
        CREATE INDEX IF NOT EXISTS idx_signal_reactions_msg ON signal_message_reactions(message_id);
      `);
    });
    migrateReactions();
  }

  // Migrate legacy dark hero image references to the bright daylight desk asset
  db.prepare(
    `UPDATE signals SET chart_image_url = '/src/assets/images/hero_light_trading_1795086732029.jpg' WHERE chart_image_url = '/src/assets/images/hero_trading_desk_1795085837463.jpg'`
  ).run();
  db.prepare(
    `UPDATE market_updates SET image_url = '/src/assets/images/hero_light_trading_1795086732029.jpg' WHERE image_url = '/src/assets/images/hero_trading_desk_1795085837463.jpg'`
  ).run();
  db.prepare(
    `UPDATE courses SET cover_image_url = '/src/assets/images/hero_light_trading_1795086732029.jpg' WHERE cover_image_url = '/src/assets/images/hero_trading_desk_1795085837463.jpg'`
  ).run();

  seedInitialData();
}

function seedInitialData(): void {
  const now = new Date().toISOString();

  // Default Platform Settings
  const defaultSettings: Record<string, string> = {
    brand_name: 'MeridianFX',
    tagline: 'Institutional Forex Signals, Real-Time Intelligence & Structured Education',
    logo_url: '/icon.svg',
    hero_title: 'Disciplined Forex Signals & Institutional Market Education',
    hero_subtitle:
      'Real-time trade ideas with transparent risk parameters, live session intelligence, macroeconomic tracking, and a structured trading curriculum built for serious market participants.',
    about_text:
      'MeridianFX bridges institutional market analysis and retail trader discipline. Every published signal documents clear entry levels, invalidation stops, multi-tier profit targets, and underlying technical & macroeconomic rationale. All setups are published strictly for educational and informational purposes.',
    contact_email: 'desk@meridianfx.com',
    contact_phone: '+44 20 7946 0821',
    contact_whatsapp: '',
    contact_address: '22 Bishopsgate, Level 18, London EC2N 4BQ, United Kingdom',
    seo_title: 'MeridianFX — Forex Signals, Market Intelligence & Trading Academy',
    seo_description:
      'Institutional-grade Forex trading signals, real-time market updates, interactive charts, economic calendar, and structured trading academy.',
    push_enabled: 'true',
    market_api_provider: 'Yahoo Finance / Frankfurter / CoinGecko',
    calendar_api_provider: 'ForexFactory Economic Feed',
  };

  const upsertSetting = db.prepare(
    'INSERT OR IGNORE INTO platform_settings (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(defaultSettings)) {
    upsertSetting.run(key, value);
  }

  // Ensure JWT secret exists
  const jwtRow = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('jwt_secret') as { value: string } | undefined;
  if (!jwtRow) {
    upsertSetting.run('jwt_secret', crypto.randomBytes(48).toString('hex'));
  }

  // Ensure designated administrator account (markobare25@gmail.com) is permanently provisioned as sole admin
  const designatedUser = db
    .prepare(
      'SELECT id, password_hash, role, status, email_verified, needs_password_setup FROM users WHERE LOWER(email) = ?'
    )
    .get(DESIGNATED_ADMIN_EMAIL) as
    | {
        id: string;
        password_hash: string;
        role: string;
        status: string;
        email_verified: number;
        needs_password_setup: number;
      }
    | undefined;

  let adminId = '';
  if (designatedUser) {
    adminId = designatedUser.id;
    const passwordMatches = verifyPassword(DESIGNATED_ADMIN_PASSWORD, designatedUser.password_hash);
    if (
      !passwordMatches ||
      designatedUser.role !== 'admin' ||
      designatedUser.status !== 'active' ||
      !designatedUser.email_verified ||
      Number(designatedUser.needs_password_setup || 0) !== 0
    ) {
      db.prepare(
        `UPDATE users SET
          email = ?,
          password_hash = ?,
          role = 'admin',
          status = 'active',
          email_verified = 1,
          needs_password_setup = 0
         WHERE id = ?`
      ).run(
        DESIGNATED_ADMIN_EMAIL,
        passwordMatches ? designatedUser.password_hash : hashPassword(DESIGNATED_ADMIN_PASSWORD),
        designatedUser.id
      );
    }
  } else {
    adminId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO users (
        id, name, email, password_hash, role, status, email_verified,
        needs_password_setup, bio, created_at
      ) VALUES (?, ?, ?, ?, 'admin', 'active', 1, 0, ?, ?)`
    ).run(
      adminId,
      'MeridianFX Admin',
      DESIGNATED_ADMIN_EMAIL,
      hashPassword(DESIGNATED_ADMIN_PASSWORD),
      'Head of Trading Desk & Signals Strategy at MeridianFX.',
      now
    );
  }

  // Reassign any legacy fallback admin records and ensure only DESIGNATED_ADMIN_EMAIL holds admin role
  const legacyAdmin = db
    .prepare("SELECT id FROM users WHERE LOWER(email) = 'admin@meridianfx.com' AND id != ?")
    .get(adminId) as { id: string } | undefined;
  if (legacyAdmin) {
    db.prepare('UPDATE signals SET created_by = ? WHERE created_by = ?').run(adminId, legacyAdmin.id);
    db.prepare('UPDATE signal_messages SET author_id = ? WHERE author_id = ?').run(adminId, legacyAdmin.id);
    db.prepare('UPDATE community_posts SET user_id = ? WHERE user_id = ?').run(adminId, legacyAdmin.id);
    db.prepare('UPDATE community_comments SET user_id = ? WHERE user_id = ?').run(adminId, legacyAdmin.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(legacyAdmin.id);
  }
  db.prepare("UPDATE users SET role = 'user' WHERE role = 'admin' AND LOWER(email) != ?").run(
    DESIGNATED_ADMIN_EMAIL
  );

  // Seed initial Educational Signals if table is empty
  const signalCount = db.prepare('SELECT COUNT(*) as cnt FROM signals').get() as { cnt: number };
  if (signalCount.cnt === 0) {
    const insertSignal = db.prepare(`
      INSERT INTO signals (
        id, pair, direction, entry_price, stop_loss, tp1, tp2, tp3, tp4,
        risk_reward, timeframe, status, classification, analysis, chart_image_url,
        admin_remarks, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const s1 = crypto.randomUUID();
    insertSignal.run(
      s1,
      'EURUSD',
      'BUY',
      '1.0580',
      '1.0535',
      '1.0625',
      '1.0670',
      '1.0715',
      '1.0760',
      '1 : 3.0',
      'H4',
      'Active',
      'Educational',
      'Price swept London session sell-side liquidity near 1.0565 and reclaimed the 4H bullish order block with diverging RSI momentum. Looking for continuation toward weekly imbalance.',
      '/src/assets/images/hero_light_trading_1795086732029.jpg',
      'Move SL to breakeven once TP1 (1.0625) is reached.',
      adminId,
      new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      new Date(Date.now() - 1000 * 60 * 30).toISOString()
    );

    const s2 = crypto.randomUUID();
    insertSignal.run(
      s2,
      'XAUUSD',
      'BUY',
      '2635.00',
      '2618.00',
      '2652.00',
      '2670.00',
      '2690.00',
      null,
      '1 : 3.2',
      'H1',
      'Active',
      'Educational',
      'Spot Gold defended the 200-EMA dynamic support during New York open alongside softening US 10Y real yields. Watch for breakout above 2648 intraday resistance.',
      '/src/assets/images/gold_commodity_analysis_1795085837457.jpg',
      'Keep position sizing conservative ahead of US CPI release.',
      adminId,
      new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      new Date(Date.now() - 1000 * 60 * 120).toISOString()
    );

    const s3 = crypto.randomUUID();
    insertSignal.run(
      s3,
      'GBPUSD',
      'SELL',
      '1.2695',
      '1.2740',
      '1.2650',
      '1.2605',
      '1.2560',
      null,
      '1 : 2.5',
      'H4',
      'TP Hit',
      'Educational',
      'Rejection at daily bearish supply zone aligned with 61.8% Fibonacci retracement and hawkish USD yield differential.',
      null,
      'TP1 and TP2 cleared cleanly during London/NY overlap.',
      adminId,
      new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
    );

    const s4 = crypto.randomUUID();
    insertSignal.run(
      s4,
      'USDJPY',
      'BUY',
      '154.20',
      '153.50',
      '154.90',
      '155.60',
      null,
      null,
      '1 : 2.0',
      'H1',
      'Pending',
      'Educational',
      'Limit buy order resting at prior breakout structure and VWAP confluence. Waiting for pullback before Tokyo session.',
      null,
      'Cancel pending order if H4 candle closes below 153.60 prior to trigger.',
      adminId,
      new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      new Date(Date.now() - 1000 * 60 * 45).toISOString()
    );

    db.prepare(
      `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      s1,
      'Initial educational setup published. Entry zone holding above 1.0575.',
      'Active',
      'Chief Market Strategist',
      new Date(Date.now() - 1000 * 60 * 95).toISOString()
    );
    db.prepare(
      `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      s3,
      'TP1 (1.2650) and TP2 (1.2605) reached. Setup marked as TP Hit for educational archive.',
      'TP Hit',
      'Chief Market Strategist',
      new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
    );
  }

  // Seed initial Market Updates if empty
  const updateCount = db.prepare('SELECT COUNT(*) as cnt FROM market_updates').get() as { cnt: number };
  if (updateCount.cnt === 0) {
    const insertUpdate = db.prepare(`
      INSERT INTO market_updates (
        id, title, content, category, pinned, image_url, video_url, attachment_url,
        attachment_name, external_link, scheduled_at, published, author_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUpdate.run(
      crypto.randomUUID(),
      'London & New York Session Risk Protocol & Weekly Outlook',
      'High-impact inflation and central bank rate commentary are scheduled mid-week across USD, EUR, and GBP pairs. Remember to cap per-trade risk at 0.5% to 1.0% of account equity, avoid widening stop-loss orders during volatility spikes, and review the Economic Calendar before opening intraday positions.',
      'Daily Outlook',
      1,
      '/src/assets/images/hero_light_trading_1795086732029.jpg',
      null,
      null,
      null,
      null,
      null,
      1,
      'Chief Market Strategist',
      new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      new Date(Date.now() - 1000 * 60 * 180).toISOString()
    );

    insertUpdate.run(
      crypto.randomUUID(),
      'XAUUSD Gold Liquidity Sweep & Institutional Demand Zone',
      'Spot Gold continues to attract institutional bids on pullbacks into the 2620–2635 demand pocket while sovereign bond yields consolidate. Watch the 2652 intraday inflection level for momentum continuation.',
      'Gold & Crypto',
      0,
      '/src/assets/images/gold_commodity_analysis_1795085837457.jpg',
      null,
      null,
      null,
      null,
      null,
      1,
      'Chief Market Strategist',
      new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      new Date(Date.now() - 1000 * 60 * 75).toISOString()
    );

    insertUpdate.run(
      crypto.randomUUID(),
      'Enable Real-Time Push Alerts for Instant Signal Delivery',
      'Make sure Push Notifications are enabled in your Profile settings or Notification prompt. Android and Desktop users receive instant background alerts; iPhone/iPad users on iOS 16.4+ can install MeridianFX via Safari Share -> Add to Home Screen to unlock native lock-screen alerts.',
      'Platform Announcement',
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      1,
      'Chief Market Strategist',
      new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      new Date(Date.now() - 1000 * 60 * 35).toISOString()
    );
  }

  // Seed or upgrade to full 15-course Forex Academy Curriculum
  const hasCanonical = db
    .prepare("SELECT id FROM courses WHERE id = 'course-01-intro-forex'")
    .get() as { id: string } | undefined;

  if (!hasCanonical) {
    // Remove legacy pre-curriculum 3 placeholder sample courses only if canonical curriculum wasn't seeded yet
    db.prepare('DELETE FROM courses WHERE course_number IS NULL').run();
  }

  const upsertCourse = db.prepare(`
    INSERT INTO courses (
      id, slug, course_number, title, description, category, level, level_label,
      prerequisites, learning_outcomes_json, estimated_hours, status, assessment_json,
      cover_image_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      course_number = excluded.course_number,
      level_label = COALESCE(courses.level_label, excluded.level_label),
      prerequisites = COALESCE(courses.prerequisites, excluded.prerequisites),
      learning_outcomes_json = CASE WHEN courses.learning_outcomes_json IS NULL OR courses.learning_outcomes_json = '[]' THEN excluded.learning_outcomes_json ELSE courses.learning_outcomes_json END,
      estimated_hours = COALESCE(courses.estimated_hours, excluded.estimated_hours),
      assessment_json = CASE WHEN courses.assessment_json IS NULL OR courses.assessment_json = '[]' THEN excluded.assessment_json ELSE courses.assessment_json END
  `);

  const insertSeedLesson = db.prepare(`
    INSERT OR IGNORE INTO lessons (
      id, course_id, title, category, summary, learning_objective, introduction, content,
      demonstration, common_mistakes_json, summary_recap, practical_exercise_json,
      visual_key, duration_minutes, order_index, status, published_at, updated_at,
      material_version, sources_json, tags_json, quiz_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, 1, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    for (const c of ALL_CURRICULUM_COURSES) {
      upsertCourse.run(
        c.id,
        c.slug,
        c.course_number,
        c.title,
        c.description,
        c.category,
        c.level,
        c.level_label,
        c.prerequisites,
        JSON.stringify(c.learning_outcomes),
        c.estimated_hours,
        JSON.stringify(c.assessment),
        c.cover_image_url,
        now,
        now
      );

      c.lessons.forEach((l, idx) => {
        insertSeedLesson.run(
          l.id,
          c.id,
          l.title,
          l.category,
          l.summary,
          l.learning_objective,
          l.introduction,
          l.content,
          l.demonstration,
          JSON.stringify(l.common_mistakes),
          l.summary_recap,
          JSON.stringify(l.practical_exercise),
          l.visual_key,
          l.duration_minutes,
          idx + 1,
          now,
          now,
          JSON.stringify(l.sources),
          JSON.stringify(l.tags),
          JSON.stringify(l.quiz),
          now
        );
      });
    }
  });
  seedTransaction();

  // Fix any legacy dark cover images on seeded records
  db.prepare(
    `UPDATE courses SET cover_image_url = '/src/assets/images/hero_light_trading_1795086732029.jpg' WHERE cover_image_url = '/src/assets/images/hero_trading_desk_1795085837463.jpg'`
  ).run();

  // Seed initial Community Post if empty
  const postCount = db.prepare('SELECT COUNT(*) as cnt FROM community_posts').get() as { cnt: number };
  if (postCount.cnt === 0) {
    db.prepare(
      `INSERT INTO community_posts (id, user_id, category, title, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      adminId,
      'Market Discussion',
      'Welcome to the MeridianFX Community Desk',
      'Share your clean chart markups, ask questions on Academy lessons, and discuss macroeconomic setups respectfully. Spam, affiliate links, and guaranteed-profit claims are strictly prohibited and moderated.',
      now
    );
  }

  // Seed public Signal Channel messages if empty so visitors immediately see live channel history
  const signalMsgCount = db.prepare('SELECT COUNT(*) as cnt FROM signal_messages').get() as { cnt: number };
  if (signalMsgCount.cnt === 0) {
    const insertSignalMsg = db.prepare(`
      INSERT OR IGNORE INTO signal_messages (
        id, author_id, author_name, content, image_url, image_name,
        media_url, media_type, media_name, message_type, priority,
        status, pinned, completed_at, completed_summary, source_type, source_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const publicSignals = db
      .prepare('SELECT * FROM signals WHERE COALESCE(is_premium, 0) = 0 ORDER BY created_at ASC')
      .all() as Array<Record<string, unknown>>;

    for (const sig of publicSignals) {
      const tpList = [sig.tp1, sig.tp2, sig.tp3, sig.tp4].filter(Boolean).join(' · ');
      const content = [
        `${String(sig.direction)} ${String(sig.pair)} (${String(sig.timeframe)} · ${String(sig.classification)})`,
        `Entry: ${String(sig.entry_price)} | SL: ${String(sig.stop_loss)} | TP: ${tpList} | R:R ${String(sig.risk_reward)}`,
        String(sig.analysis || ''),
        sig.admin_remarks ? `Note: ${String(sig.admin_remarks)}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const sigStatus = String(sig.status || 'Active');
      const isCompleted = sigStatus === 'TP Hit' || sigStatus === 'SL Hit' || sigStatus === 'Closed';
      const imgUrl = sig.chart_image_url ? String(sig.chart_image_url) : null;
      const imgName = imgUrl ? `${String(sig.pair)} Chart` : null;

      insertSignalMsg.run(
        crypto.randomUUID(),
        adminId,
        'MeridianFX Desk',
        content,
        imgUrl,
        imgName,
        imgUrl,
        imgUrl ? 'image' : null,
        imgName,
        'signal',
        'normal',
        isCompleted ? 'completed' : 'active',
        0,
        isCompleted ? String(sig.updated_at || sig.created_at) : null,
        isCompleted ? String(sig.admin_remarks || sigStatus) : null,
        'signal',
        String(sig.id),
        String(sig.created_at)
      );
    }

    const publicUpdates = db
      .prepare('SELECT * FROM market_updates WHERE published = 1 AND COALESCE(is_premium, 0) = 0 ORDER BY created_at ASC')
      .all() as Array<Record<string, unknown>>;

    for (const upd of publicUpdates) {
      const cat = String(upd.category || 'Market Update');
      const isAnnouncement = cat === 'Platform Announcement' || cat === 'Risk Warning';
      const content = [`${cat}: ${String(upd.title)}`, String(upd.content || '')].join('\n\n');
      const imgUrl = upd.image_url ? String(upd.image_url) : null;
      const imgName = imgUrl ? String(upd.title) : null;

      insertSignalMsg.run(
        crypto.randomUUID(),
        adminId,
        'MeridianFX Desk',
        content,
        imgUrl,
        imgName,
        imgUrl,
        imgUrl ? 'image' : null,
        imgName,
        isAnnouncement ? 'announcement' : 'update',
        'normal',
        'active',
        Number(upd.pinned || 0) ? 1 : 0,
        null,
        null,
        'market_update',
        String(upd.id),
        String(upd.created_at)
      );
    }
  }
}

export function createDatabaseBackup(): { filename: string; path: string; created_at: string } {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `meridianfx-backup-${stamp}.json`;
  const targetPath = path.join(BACKUPS_DIR, filename);

  const snapshot = {
    exported_at: new Date().toISOString(),
    users: db
      .prepare(
        'SELECT id, name, username, email, role, status, email_verified, membership_expires_at, membership_notes, timezone, notification_prefs, watchlist, created_at, last_login_at FROM users'
      )
      .all(),
    signals: db.prepare('SELECT * FROM signals').all(),
    signal_updates: db.prepare('SELECT * FROM signal_updates').all(),
    signal_messages: db.prepare('SELECT * FROM signal_messages').all(),
    signal_message_reactions: db.prepare('SELECT * FROM signal_message_reactions').all(),
    market_updates: db.prepare('SELECT * FROM market_updates').all(),
    courses: db.prepare('SELECT * FROM courses').all(),
    lessons: db.prepare('SELECT * FROM lessons').all(),
    community_posts: db.prepare('SELECT * FROM community_posts').all(),
    platform_settings: db.prepare('SELECT key, value FROM platform_settings WHERE key NOT IN (\'jwt_secret\', \'vapid_private_key\')').all(),
  };

  fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Keep only the latest 14 backups on disk
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();
  for (const old of files.slice(14)) {
    fs.unlinkSync(path.join(BACKUPS_DIR, old));
  }

  return { filename, path: targetPath, created_at: snapshot.exported_at };
}

export function logSystemEvent(level: 'info' | 'warn' | 'error', source: string, message: string): void {
  try {
    db.prepare(
      'INSERT INTO system_logs (id, level, source, message, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), level, source, message.slice(0, 1000), new Date().toISOString());
  } catch {
    // avoid recursive logging crashes
  }
}
