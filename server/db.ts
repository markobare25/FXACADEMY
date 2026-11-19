import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'meridianfx.db');
export const UPLOAD_DIR = UPLOADS_DIR;
export const BACKUP_DIR = BACKUPS_DIR;

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
      notification_prefs TEXT NOT NULL DEFAULT '{"signals":true,"signal_updates":true,"market_updates":true,"academy":true,"economic_calendar":true,"announcements":true}',
      watchlist TEXT NOT NULL DEFAULT '["EURUSD","GBPUSD","XAUUSD","BTCUSD"]',
      created_at TEXT NOT NULL,
      last_login_at TEXT
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
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      cover_image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      video_url TEXT,
      pdf_url TEXT,
      image_url TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 1,
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
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
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
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

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
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
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

  // Seed primary Administrator if zero admins exist
  const adminCount = db
    .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'")
    .get() as { cnt: number };
  let adminId = '';
  if (adminCount.cnt === 0) {
    adminId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, status, email_verified, bio, created_at)
       VALUES (?, ?, ?, ?, 'admin', 'active', 1, ?, ?)`
    ).run(
      adminId,
      'Chief Market Strategist',
      'admin@meridianfx.com',
      hashPassword('Admin!Meridian2026'),
      'Head of Macro Research & FX Strategy at MeridianFX.',
      now
    );
  } else {
    const existingAdmin = db
      .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
      .get() as { id: string };
    adminId = existingAdmin.id;
  }

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

  // Seed Forex Trading Academy courses & lessons across the 15 categories
  const courseCount = db.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number };
  if (courseCount.cnt === 0) {
    const insertCourse = db.prepare(
      `INSERT INTO courses (id, title, description, category, level, cover_image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertLesson = db.prepare(
      `INSERT INTO lessons (id, course_id, title, category, summary, content, duration_minutes, order_index, quiz_json, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const c1 = crypto.randomUUID();
    insertCourse.run(
      c1,
      'Foundations of Global Foreign Exchange',
      'Master currency market mechanics, pip valuation, spread dynamics, major/cross pairs, and candlestick anatomy from first principles.',
      'Introduction to Forex',
      'Beginner',
      '/src/assets/images/academy_forex_cover_1795085836938.jpg',
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c1,
      'How the $7.5T Forex Market Operates',
      'Introduction to Forex',
      'Understand interbank liquidity, trading sessions (Tokyo, London, New York), and why currency pairs move.',
      'The foreign exchange (Forex) market is the largest decentralized financial market globally, operating 24 hours a day across five business days.\n\n### Core Trading Sessions\n1. **Sydney & Tokyo (Asian Session)**: Characterized by tighter ranges in European pairs and heightened liquidity in JPY, AUD, and NZD crosses.\n2. **London Session**: Accounts for roughly 38% of global FX turnover, frequently establishing daily highs or lows and breaking Asian ranges.\n3. **New York Overlap (12:00–16:00 UTC)**: Highest liquidity and tightest spreads as London and New York desks trade simultaneously.\n\n### Market Participants\nCentral banks, commercial banks, institutional hedge funds, multinational corporations, and retail traders interact through liquidity providers. Always align your trading activity with liquid session overlaps to avoid erratic spreads.',
      12,
      1,
      JSON.stringify([
        {
          id: 'q1',
          question: 'Which trading overlap typically provides the highest Forex liquidity and tightest spreads?',
          options: [
            'Sydney and Tokyo overlap',
            'London and New York overlap',
            'Weekend futures open',
            'Late Friday close',
          ],
          correct_index: 1,
          explanation: 'London and New York together represent the majority of daily global FX volume.',
        },
        {
          id: 'q2',
          question: 'What is a pip in most non-JPY currency pairs like EURUSD?',
          options: ['0.01', '0.001', '0.0001', '1.00'],
          correct_index: 2,
          explanation: 'Standard non-JPY pairs quote pips at the fourth decimal place (0.0001).',
        },
      ]),
      '/src/assets/images/academy_forex_cover_1795085836938.jpg',
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c1,
      'Decoding Currency Pairs, Lots & Leverage',
      'Understanding currency pairs',
      'Learn base vs quote currencies, pip value calculation, and responsible leverage sizing.',
      'Every Forex trade involves simultaneously buying one currency and selling another.\n\n### Base vs. Quote Currency\nIn **EUR/USD = 1.0580**, EUR is the **base currency** and USD is the **quote currency**. Buying EUR/USD means you expect the Euro to strengthen relative to the US Dollar.\n\n### Position Sizing & Lot Units\n- **Standard Lot**: 100,000 units (~$10 per pip on USD-quoted pairs)\n- **Mini Lot**: 10,000 units (~$1 per pip)\n- **Micro Lot**: 1,000 units (~$0.10 per pip)\n\nNever size a position by arbitrary lot numbers—calculate lot size from your Stop Loss distance and maximum account risk percentage.',
      14,
      2,
      JSON.stringify([
        {
          id: 'q3',
          question: 'In GBP/JPY, which currency is the quote currency?',
          options: ['GBP', 'JPY', 'USD', 'Both'],
          correct_index: 1,
          explanation: 'The second currency listed in a pair is always the quote (counter) currency.',
        },
      ]),
      null,
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c1,
      'Reading Japanese Candlestick Patterns with Context',
      'Candlestick patterns',
      'Identify engulfing bars, pin bars, inside bars, and why candle location matters more than isolated shapes.',
      'Japanese candlesticks compress Open, High, Low, and Close (OHLC) auction dynamics into a single visual unit.\n\n### High-Probability Formations\n- **Pin Bar (Rejection Wick)**: A long wick extending into key support or resistance shows aggressive order absorption and rejection.\n- **Engulfing Candle**: A body that completely engulfs the prior candle body signals a decisive shift in short-term order flow.\n\n### Context Rule\nA bullish pin bar in the middle of choppy consolidation carries low predictive value. The exact same candle sweeping a prior daily low at structural support carries strong institutional significance.',
      15,
      3,
      JSON.stringify([
        {
          id: 'q4',
          question: 'What determines whether a candlestick pattern is high probability?',
          options: [
            'Bright chart colors',
            'Structural location at key support/resistance or liquidity levels',
            'Trading on the 1-second chart only',
            'Ignoring the prevailing trend',
          ],
          correct_index: 1,
          explanation: 'Candlestick signals are only meaningful when anchored at significant market structure.',
        },
      ]),
      null,
      now
    );

    const c2 = crypto.randomUUID();
    insertCourse.run(
      c2,
      'Price Action, Market Structure & Risk Engineering',
      'Transition from indicator overload to institutional market structure, support & resistance, trendlines, and mathematical risk management.',
      'Technical analysis',
      'Intermediate',
      '/src/assets/images/hero_light_trading_1795086732029.jpg',
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c2,
      'Multi-Timeframe Support, Resistance & Trendlines',
      'Support and resistance',
      'Map high-timeframe supply/demand zones, clean trendlines, and role reversals.',
      'Institutional order flow respects higher-timeframe levels (Weekly, Daily, H4) far more reliably than M5 noise.\n\n### Top-Down Workflow\n1. Mark Weekly and Daily swing highs/lows and consolidation ranges.\n2. Identify dynamic trendlines connecting at least two confirmed impulse lows/highs.\n3. Wait for price to reach your zone on H4/H1 before refining execution on M15.\n\nRemember: support and resistance are **zones**, not razor-thin single lines.',
      18,
      1,
      JSON.stringify([
        {
          id: 'q5',
          question: 'Which timeframes provide the strongest structural support and resistance zones?',
          options: ['1-minute and 5-minute', 'Weekly, Daily, and 4-Hour', 'Tick charts', 'All timeframes have equal weight'],
          correct_index: 1,
          explanation: 'Higher timeframes reflect larger institutional capital commitments.',
        },
      ]),
      null,
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c2,
      'Position Sizing, Expectancy & Trading Psychology',
      'Risk management',
      'Build mathematical expectancy with fixed fractional risk (0.5%-1%), asymmetric R:R, and emotional discipline.',
      'Even a strategy with a 45% win rate is consistently profitable when average winners are 2.5R to 3R and losses are strictly capped at 1R.\n\n### Expectancy Formula\n`Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)`\n\n### Non-Negotiable Risk Rules\n- Risk **0.5% to 1.0%** maximum per trade idea.\n- Never add to a losing position or remove a protective Stop Loss.\n- Cap daily drawdown at 2%—walk away after two consecutive full stop-outs to protect decision clarity.',
      16,
      2,
      JSON.stringify([
        {
          id: 'q6',
          question: 'With a 1:3 Risk-to-Reward ratio, what minimum win rate is needed just to break even (before spreads)?',
          options: ['50%', '25%', '75%', '60%'],
          correct_index: 1,
          explanation: 'At 1:3 R:R, 1 winner (+3R) offsets 3 losers (-3R), so 25% is breakeven.',
        },
      ]),
      null,
      now
    );

    const c3 = crypto.randomUUID();
    insertCourse.run(
      c3,
      'Macroeconomics, Gold (XAUUSD) & Digital Assets',
      'Trade central bank policy divergence, real yields, Gold volatility, and Bitcoin macro liquidity cycles.',
      'Gold trading',
      'Advanced',
      '/src/assets/images/gold_commodity_analysis_1795085837457.jpg',
      now
    );

    insertLesson.run(
      crypto.randomUUID(),
      c3,
      'Trading XAUUSD Around Real Yields & US CPI',
      'Gold trading',
      'Understand the inverse correlation between US 10Y TIPS real yields, DXY strength, and Spot Gold.',
      'Gold (XAUUSD) behaves as both a non-yielding monetary asset and a geopolitical safe haven.\n\n### Key Macro Drivers\n- **US Real Yields (Nominal Yield minus Inflation Expectations)**: Rising real yields raise the opportunity cost of holding Gold, often pressuring XAUUSD lower.\n- **US Dollar Index (DXY)**: Because Gold is priced in USD, broad dollar strength generally creates headwinds.\n- **ATR-Adjusted Stops**: Gold routinely moves $20–$40 intraday; always scale stop distances using 14-period Average True Range (ATR) and reduce lot size accordingly.',
      20,
      1,
      JSON.stringify([
        {
          id: 'q7',
          question: 'Why must traders typically use wider stops and smaller lot sizes on XAUUSD compared to EURUSD?',
          options: [
            'Gold has lower tick value',
            'Gold exhibits significantly higher intraday ATR volatility',
            'Gold only trades on weekends',
            'Gold has no spread',
          ],
          correct_index: 1,
          explanation: 'High intraday pip/dollar swings require ATR-adjusted stop placement and scaled position sizing.',
        },
      ]),
      '/src/assets/images/gold_commodity_analysis_1795085837457.jpg',
      now
    );
  }

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
}

export function createDatabaseBackup(): { filename: string; path: string; created_at: string } {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `meridianfx-backup-${stamp}.json`;
  const targetPath = path.join(BACKUPS_DIR, filename);

  const snapshot = {
    exported_at: new Date().toISOString(),
    users: db.prepare('SELECT id, name, email, role, status, email_verified, timezone, notification_prefs, watchlist, created_at, last_login_at FROM users').all(),
    signals: db.prepare('SELECT * FROM signals').all(),
    signal_updates: db.prepare('SELECT * FROM signal_updates').all(),
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
