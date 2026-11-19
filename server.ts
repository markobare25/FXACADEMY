import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import {
  BACKUP_DIR,
  UPLOAD_DIR,
  createDatabaseBackup,
  db,
  hashPassword,
  initDatabase,
  logSystemEvent,
  verifyPassword,
} from './server/db.ts';
import {
  type AuthRequest,
  logUserActivity,
  mapDbUser,
  optionalAuth,
  rateLimit,
  requireAuth,
  requireRole,
  signToken,
} from './server/auth.ts';
import { dispatchNotification, ensureVapidKeys } from './server/push.ts';
import { getEconomicCalendar, getMarketCandles, getMarketQuotes } from './server/markets.ts';
import type { NotificationPreferences, PlatformSettings, PublicStats } from './src/types.ts';

initDatabase();
ensureVapidKeys();

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

const wsClients = new Set<WebSocket>();
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ event: 'connected', data: { timestamp: new Date().toISOString() } }));
  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
});

function broadcastWs(event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Serve uploaded media/PDFs
app.use('/uploads', express.static(UPLOAD_DIR));

// File upload handler via Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/webm',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: images, PDF, MP4, WebM.'));
    }
  },
});

function setSessionCookie(res: Response, token: string): void {
  res.cookie('mfx_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function getPlatformSettings(): PlatformSettings {
  const rows = db.prepare('SELECT key, value FROM platform_settings').all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    brand_name: map.brand_name || 'MeridianFX',
    tagline: map.tagline || '',
    logo_url: map.logo_url || '/icon.svg',
    hero_title: map.hero_title || '',
    hero_subtitle: map.hero_subtitle || '',
    about_text: map.about_text || '',
    contact_email: map.contact_email || 'desk@meridianfx.com',
    contact_phone: map.contact_phone || '',
    contact_address: map.contact_address || '',
    seo_title: map.seo_title || 'MeridianFX',
    seo_description: map.seo_description || '',
    push_enabled: map.push_enabled !== 'false',
    market_api_provider: map.market_api_provider || 'Yahoo Finance / Frankfurter / CoinGecko',
    calendar_api_provider: map.calendar_api_provider || 'ForexFactory Weekly Feed',
  };
}

function getPublicStats(): PublicStats {
  const totalSignals = (db.prepare('SELECT COUNT(*) as c FROM signals').get() as { c: number }).c;
  const activeSignals = (
    db.prepare("SELECT COUNT(*) as c FROM signals WHERE status IN ('Active','Pending')").get() as { c: number }
  ).c;
  const completedSignals = (
    db.prepare("SELECT COUNT(*) as c FROM signals WHERE status IN ('TP Hit','SL Hit','Closed')").get() as { c: number }
  ).c;
  const totalUpdates = (
    db.prepare('SELECT COUNT(*) as c FROM market_updates WHERE published = 1').get() as { c: number }
  ).c;
  const totalCourses = (db.prepare('SELECT COUNT(*) as c FROM courses').get() as { c: number }).c;
  const totalLessons = (db.prepare('SELECT COUNT(*) as c FROM lessons').get() as { c: number }).c;
  const totalUsers = (
    db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'active'").get() as { c: number }
  ).c;
  const communityPosts = (
    db.prepare('SELECT COUNT(*) as c FROM community_posts WHERE hidden = 0').get() as { c: number }
  ).c;

  return {
    total_signals: totalSignals,
    active_signals: activeSignals,
    completed_signals: completedSignals,
    total_updates: totalUpdates,
    total_courses: totalCourses,
    total_lessons: totalLessons,
    total_users: totalUsers,
    community_posts: communityPosts,
  };
}

// ---------- Health & Public Config ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/settings', (_req, res) => {
  res.json({
    settings: getPlatformSettings(),
    stats: getPublicStats(),
  });
});

// ---------- Upload ----------
app.post('/api/upload', requireAuth, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    original_name: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// ---------- Authentication & Accounts ----------
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  timezone: z.string().max(64).optional(),
});

app.post('/api/auth/register', rateLimit(15, 60_000), (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data.' });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const verifyToken = crypto.randomBytes(24).toString('hex');
  const verifyCode = String(crypto.randomInt(100000, 999999));

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, status, email_verified, timezone, created_at, last_login_at)
     VALUES (?, ?, ?, ?, 'user', 'active', 0, ?, ?, ?)`
  ).run(
    userId,
    parsed.data.name,
    email,
    hashPassword(parsed.data.password),
    parsed.data.timezone || 'UTC',
    now,
    now
  );

  db.prepare(
    `INSERT INTO email_verifications (id, user_id, token, code, expires_at, used)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(
    crypto.randomUUID(),
    userId,
    verifyToken,
    verifyCode,
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );

  logUserActivity(userId, 'Account Registered', 'New MeridianFX trader account created.', req.ip);

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  const token = signToken({ sub: userId, role: 'user' });
  setSessionCookie(res, token);

  res.status(201).json({
    user: mapDbUser(userRow),
    token,
    verification_code: verifyCode,
    verification_token: verifyToken,
  });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

app.post('/api/auth/login', rateLimit(20, 60_000), (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email and password are required.' });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | Record<string, unknown>
    | undefined;
  if (!row || !verifyPassword(parsed.data.password, String(row.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (row.status === 'suspended') {
    res.status(403).json({ error: 'Your account has been suspended. Contact platform support.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, String(row.id));
  logUserActivity(String(row.id), 'Sign In', 'Authenticated session started.', req.ip);

  const user = mapDbUser({ ...row, last_login_at: now });
  const token = signToken({ sub: user.id, role: user.role });
  setSessionCookie(res, token);

  res.json({ user, token });
});

app.post('/api/auth/logout', optionalAuth, (req: AuthRequest, res: Response) => {
  if (req.user) {
    logUserActivity(req.user.id, 'Sign Out', 'Session terminated.', req.ip);
  }
  res.clearCookie('mfx_session', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', optionalAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user || null });
});

app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  const { token, code, email } = req.body as { token?: string; code?: string; email?: string };
  let record:
    | { id: string; user_id: string; expires_at: string; used: number }
    | undefined;

  if (token) {
    record = db
      .prepare('SELECT * FROM email_verifications WHERE token = ? AND used = 0')
      .get(token) as typeof record;
  } else if (code && email) {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as
      | { id: string }
      | undefined;
    if (user) {
      record = db
        .prepare('SELECT * FROM email_verifications WHERE user_id = ? AND code = ? AND used = 0 ORDER BY expires_at DESC LIMIT 1')
        .get(user.id, code.trim()) as typeof record;
    }
  }

  if (!record || new Date(record.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Invalid or expired verification code/token.' });
    return;
  }

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(record.user_id);
  db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(record.id);
  logUserActivity(record.user_id, 'Email Verified', 'Email address verified successfully.', req.ip);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(record.user_id) as Record<string, unknown>;
  res.json({ ok: true, user: mapDbUser(updated) });
});

app.post('/api/auth/resend-verification', requireAuth, rateLimit(5, 60_000), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const verifyToken = crypto.randomBytes(24).toString('hex');
  const verifyCode = String(crypto.randomInt(100000, 999999));

  db.prepare(
    `INSERT INTO email_verifications (id, user_id, token, code, expires_at, used)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(
    crypto.randomUUID(),
    user.id,
    verifyToken,
    verifyCode,
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );

  res.json({ ok: true, verification_code: verifyCode, verification_token: verifyToken });
});

app.post('/api/auth/forgot-password', rateLimit(10, 60_000), (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

  if (!user) {
    res.json({ ok: true, message: 'If an account exists for that email, a reset code has been generated.' });
    return;
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const resetCode = String(crypto.randomInt(100000, 999999));
  db.prepare(
    `INSERT INTO password_resets (id, user_id, token, code, expires_at, used)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).run(
    crypto.randomUUID(),
    user.id,
    resetToken,
    resetCode,
    new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );
  logUserActivity(user.id, 'Password Reset Requested', 'Reset code issued.', req.ip);

  res.json({
    ok: true,
    message: 'Password reset code generated.',
    reset_code: resetCode,
    reset_token: resetToken,
  });
});

app.post('/api/auth/reset-password', rateLimit(10, 60_000), (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().trim().email(),
    code: z.string().trim().min(4),
    new_password: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reset parameters.' });
    return;
  }

  const user = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(parsed.data.email.toLowerCase()) as { id: string } | undefined;
  if (!user) {
    res.status(400).json({ error: 'Invalid reset code or email.' });
    return;
  }

  const resetRow = db
    .prepare(
      'SELECT * FROM password_resets WHERE user_id = ? AND (code = ? OR token = ?) AND used = 0 ORDER BY expires_at DESC LIMIT 1'
    )
    .get(user.id, parsed.data.code, parsed.data.code) as
    | { id: string; expires_at: string }
    | undefined;

  if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Invalid or expired reset code.' });
    return;
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    hashPassword(parsed.data.new_password),
    user.id
  );
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);
  logUserActivity(user.id, 'Password Reset Completed', 'Password updated via reset token.', req.ip);

  res.json({ ok: true });
});

// ---------- User Account Management ----------
app.patch('/api/users/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(80),
    bio: z.string().max(400).optional().nullable(),
    timezone: z.string().max(64).optional(),
    avatar_url: z.string().max(400).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data.' });
    return;
  }

  db.prepare('UPDATE users SET name = ?, bio = ?, timezone = ?, avatar_url = ? WHERE id = ?').run(
    parsed.data.name,
    parsed.data.bio ?? null,
    parsed.data.timezone || 'UTC',
    parsed.data.avatar_url ?? null,
    req.user!.id
  );
  logUserActivity(req.user!.id, 'Profile Updated', 'Updated display name or preferences.', req.ip);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  res.json({ user: mapDbUser(updated) });
});

app.patch('/api/users/password', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as {
    password_hash: string;
  };
  if (!verifyPassword(parsed.data.current_password, row.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    hashPassword(parsed.data.new_password),
    req.user!.id
  );
  logUserActivity(req.user!.id, 'Password Changed', 'User changed account password.', req.ip);
  res.json({ ok: true });
});

app.patch('/api/users/notifications-prefs', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    signals: z.boolean(),
    signal_updates: z.boolean(),
    market_updates: z.boolean(),
    academy: z.boolean(),
    economic_calendar: z.boolean(),
    announcements: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid notification preferences.' });
    return;
  }

  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(
    JSON.stringify(parsed.data),
    req.user!.id
  );
  logUserActivity(req.user!.id, 'Notification Preferences Updated', 'Updated push category alerts.', req.ip);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  res.json({ user: mapDbUser(updated) });
});

app.patch('/api/users/watchlist', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({ watchlist: z.array(z.string().max(16)).max(30) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid watchlist payload.' });
    return;
  }

  db.prepare('UPDATE users SET watchlist = ? WHERE id = ?').run(
    JSON.stringify(parsed.data.watchlist),
    req.user!.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  res.json({ user: mapDbUser(updated) });
});

app.get('/api/users/activity', requireAuth, (req: AuthRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 40')
    .all(req.user!.id);
  res.json({ activity: rows });
});

app.delete('/api/users/account', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'admin') {
    const adminCount = (
      db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get() as { c: number }
    ).c;
    if (adminCount <= 1) {
      res.status(400).json({ error: 'Cannot delete the sole administrator account.' });
      return;
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);
  res.clearCookie('mfx_session', { path: '/' });
  res.json({ ok: true });
});

// ---------- Trading Signals ----------
function hydrateSignals(rows: Array<Record<string, unknown>>) {
  const updateStmt = db.prepare(
    'SELECT * FROM signal_updates WHERE signal_id = ? ORDER BY created_at DESC'
  );
  return rows.map((row) => ({
    ...row,
    updates: updateStmt.all(String(row.id)),
  }));
}

app.get('/api/signals', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM signals ORDER BY created_at DESC').all() as Array<
    Record<string, unknown>
  >;
  res.json({ signals: hydrateSignals(rows) });
});

const signalSchema = z.object({
  pair: z.string().trim().min(3).max(20),
  direction: z.enum(['BUY', 'SELL']),
  entry_price: z.string().trim().min(1).max(32),
  stop_loss: z.string().trim().min(1).max(32),
  tp1: z.string().trim().min(1).max(32),
  tp2: z.string().trim().max(32).optional().nullable(),
  tp3: z.string().trim().max(32).optional().nullable(),
  tp4: z.string().trim().max(32).optional().nullable(),
  risk_reward: z.string().trim().min(1).max(32),
  timeframe: z.string().trim().min(1).max(16),
  status: z.enum(['Active', 'Pending', 'TP Hit', 'SL Hit', 'Closed', 'Cancelled']).default('Active'),
  classification: z.enum(['Educational', 'Verified']).default('Educational'),
  analysis: z.string().trim().min(5).max(4000),
  chart_image_url: z.string().max(400).optional().nullable(),
  admin_remarks: z.string().max(1000).optional().nullable(),
  send_push: z.boolean().optional(),
});

app.post('/api/signals', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const parsed = signalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid signal data.' });
    return;
  }

  const d = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO signals (
      id, pair, direction, entry_price, stop_loss, tp1, tp2, tp3, tp4,
      risk_reward, timeframe, status, classification, analysis, chart_image_url,
      admin_remarks, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    d.pair.toUpperCase(),
    d.direction,
    d.entry_price,
    d.stop_loss,
    d.tp1,
    d.tp2 || null,
    d.tp3 || null,
    d.tp4 || null,
    d.risk_reward,
    d.timeframe,
    d.status,
    d.classification,
    d.analysis,
    d.chart_image_url || null,
    d.admin_remarks || null,
    req.user!.id,
    now,
    now
  );

  db.prepare(
    `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    id,
    `Signal published (${d.classification}): ${d.direction} ${d.pair.toUpperCase()} @ ${d.entry_price}`,
    d.status,
    req.user!.name,
    now
  );

  const row = db.prepare('SELECT * FROM signals WHERE id = ?').get(id) as Record<string, unknown>;
  const hydrated = hydrateSignals([row])[0];
  broadcastWs('signal:created', hydrated);

  if (d.send_push !== false) {
    await dispatchNotification({
      title: `New ${d.direction} Signal: ${d.pair.toUpperCase()}`,
      body: `Entry ${d.entry_price} · SL ${d.stop_loss} · TP1 ${d.tp1} (${d.timeframe})`,
      category: 'signals',
      linkUrl: '/signals',
      broadcastWs,
    });
  }

  res.status(201).json({ signal: hydrated });
});

app.patch('/api/signals/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Signal not found.' });
    return;
  }

  const parsed = signalSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid update payload.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const nextStatus = d.status ?? String(existing.status);
  const nextPair = (d.pair ?? String(existing.pair)).toUpperCase();

  db.prepare(
    `UPDATE signals SET
      pair = ?, direction = ?, entry_price = ?, stop_loss = ?,
      tp1 = ?, tp2 = ?, tp3 = ?, tp4 = ?, risk_reward = ?, timeframe = ?,
      status = ?, classification = ?, analysis = ?, chart_image_url = ?,
      admin_remarks = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    nextPair,
    d.direction ?? existing.direction,
    d.entry_price ?? existing.entry_price,
    d.stop_loss ?? existing.stop_loss,
    d.tp1 ?? existing.tp1,
    d.tp2 !== undefined ? d.tp2 : existing.tp2,
    d.tp3 !== undefined ? d.tp3 : existing.tp3,
    d.tp4 !== undefined ? d.tp4 : existing.tp4,
    d.risk_reward ?? existing.risk_reward,
    d.timeframe ?? existing.timeframe,
    nextStatus,
    d.classification ?? existing.classification,
    d.analysis ?? existing.analysis,
    d.chart_image_url !== undefined ? d.chart_image_url : existing.chart_image_url,
    d.admin_remarks !== undefined ? d.admin_remarks : existing.admin_remarks,
    now,
    req.params.id
  );

  if (d.status && d.status !== existing.status) {
    db.prepare(
      `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      req.params.id,
      `Status updated to ${nextStatus}.${d.admin_remarks ? ` ${d.admin_remarks}` : ''}`,
      nextStatus,
      req.user!.name,
      now
    );

    if (d.send_push !== false) {
      await dispatchNotification({
        title: `${nextPair} Signal Update: ${nextStatus}`,
        body: d.admin_remarks || `${nextPair} status changed from ${String(existing.status)} to ${nextStatus}.`,
        category: 'signal_updates',
        linkUrl: '/signals',
        broadcastWs,
      });
    }
  }

  const updatedRow = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateSignals([updatedRow])[0];
  broadcastWs('signal:updated', hydrated);

  res.json({ signal: hydrated });
});

app.post('/api/signals/:id/updates', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Signal not found.' });
    return;
  }

  const schema = z.object({
    note: z.string().trim().min(2).max(1000),
    status: z.enum(['Active', 'Pending', 'TP Hit', 'SL Hit', 'Closed', 'Cancelled']).optional(),
    send_push: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Follow-up note is required.' });
    return;
  }

  const now = new Date().toISOString();
  const nextStatus = parsed.data.status || String(existing.status);

  db.prepare('UPDATE signals SET status = ?, admin_remarks = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    parsed.data.note,
    now,
    req.params.id
  );
  db.prepare(
    `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), req.params.id, parsed.data.note, nextStatus, req.user!.name, now);

  const updatedRow = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateSignals([updatedRow])[0];
  broadcastWs('signal:updated', hydrated);

  if (parsed.data.send_push !== false) {
    await dispatchNotification({
      title: `${String(existing.pair)} Update (${nextStatus})`,
      body: parsed.data.note,
      category: 'signal_updates',
      linkUrl: '/signals',
      broadcastWs,
    });
  }

  res.status(201).json({ signal: hydrated });
});

app.delete('/api/signals/:id', requireRole('admin'), (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM signals WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Signal not found.' });
    return;
  }
  broadcastWs('signal:deleted', { id: req.params.id });
  res.json({ ok: true });
});

// ---------- Live Market Updates & Announcements ----------
function hydrateUpdates(rows: Array<Record<string, unknown>>, userId?: string) {
  const reactRows = db
    .prepare('SELECT update_id, emoji, COUNT(*) as cnt FROM update_reactions GROUP BY update_id, emoji')
    .all() as Array<{ update_id: string; emoji: string; cnt: number }>;

  const reactMap = new Map<string, Record<string, number>>();
  for (const r of reactRows) {
    const cur = reactMap.get(r.update_id) || {};
    cur[r.emoji] = r.cnt;
    reactMap.set(r.update_id, cur);
  }

  const userReactSet = new Map<string, string[]>();
  const userBookmarkSet = new Set<string>();
  if (userId) {
    const uReacts = db
      .prepare('SELECT update_id, emoji FROM update_reactions WHERE user_id = ?')
      .all(userId) as Array<{ update_id: string; emoji: string }>;
    for (const ur of uReacts) {
      const list = userReactSet.get(ur.update_id) || [];
      list.push(ur.emoji);
      userReactSet.set(ur.update_id, list);
    }
    const uBm = db
      .prepare('SELECT update_id FROM update_bookmarks WHERE user_id = ?')
      .all(userId) as Array<{ update_id: string }>;
    for (const b of uBm) userBookmarkSet.add(b.update_id);
  }

  return rows.map((row) => ({
    ...row,
    pinned: Boolean(row.pinned),
    published: Boolean(row.published),
    reactions: reactMap.get(String(row.id)) || {},
    user_reacted: userReactSet.get(String(row.id)) || [],
    bookmarked: userBookmarkSet.has(String(row.id)),
  }));
}

app.get('/api/updates', optionalAuth, (req: AuthRequest, res: Response) => {
  const includeUnpublished = req.user?.role === 'admin' && req.query.includeAll === 'true';
  const rows = db
    .prepare(
      includeUnpublished
        ? 'SELECT * FROM market_updates ORDER BY pinned DESC, created_at DESC'
        : 'SELECT * FROM market_updates WHERE published = 1 ORDER BY pinned DESC, created_at DESC'
    )
    .all() as Array<Record<string, unknown>>;
  res.json({ updates: hydrateUpdates(rows, req.user?.id) });
});

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(5).max(8000),
  category: z.enum([
    'Breaking News',
    'Forex Update',
    'Economic Announcement',
    'Trading Opportunity',
    'Gold & Crypto',
    'Risk Warning',
    'Daily Outlook',
    'Session Alert',
    'Platform Announcement',
  ]),
  pinned: z.boolean().default(false),
  image_url: z.string().max(500).optional().nullable(),
  video_url: z.string().max(500).optional().nullable(),
  attachment_url: z.string().max(500).optional().nullable(),
  attachment_name: z.string().max(200).optional().nullable(),
  external_link: z.string().max(500).optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
  send_push: z.boolean().optional(),
});

app.post('/api/updates', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid market update.' });
    return;
  }

  const d = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const isScheduledFuture = Boolean(d.scheduled_at && new Date(d.scheduled_at).getTime() > Date.now());
  const published = isScheduledFuture ? 0 : 1;

  db.prepare(
    `INSERT INTO market_updates (
      id, title, content, category, pinned, image_url, video_url, attachment_url,
      attachment_name, external_link, scheduled_at, published, author_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    d.title,
    d.content,
    d.category,
    d.pinned ? 1 : 0,
    d.image_url || null,
    d.video_url || null,
    d.attachment_url || null,
    d.attachment_name || null,
    d.external_link || null,
    d.scheduled_at || null,
    published,
    req.user!.name,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateUpdates([row], req.user!.id)[0];

  if (published === 1) {
    broadcastWs('update:created', hydrated);
    if (d.send_push !== false) {
      const isAnnouncement =
        d.category === 'Platform Announcement' || d.category === 'Risk Warning';
      await dispatchNotification({
        title: `${d.category}: ${d.title}`,
        body: d.content.slice(0, 140),
        category: isAnnouncement ? 'announcements' : 'market_updates',
        linkUrl: '/updates',
        broadcastWs,
      });
    }
  }

  res.status(201).json({ update: hydrated });
});

app.patch('/api/updates/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Market update not found.' });
    return;
  }

  const parsed = updateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid update payload.' });
    return;
  }
  const d = parsed.data;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE market_updates SET
      title = ?, content = ?, category = ?, pinned = ?, image_url = ?,
      video_url = ?, attachment_url = ?, attachment_name = ?, external_link = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    d.title ?? existing.title,
    d.content ?? existing.content,
    d.category ?? existing.category,
    d.pinned !== undefined ? (d.pinned ? 1 : 0) : existing.pinned,
    d.image_url !== undefined ? d.image_url : existing.image_url,
    d.video_url !== undefined ? d.video_url : existing.video_url,
    d.attachment_url !== undefined ? d.attachment_url : existing.attachment_url,
    d.attachment_name !== undefined ? d.attachment_name : existing.attachment_name,
    d.external_link !== undefined ? d.external_link : existing.external_link,
    now,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateUpdates([row], req.user!.id)[0];
  broadcastWs('update:updated', hydrated);
  res.json({ update: hydrated });
});

app.delete('/api/updates/:id', requireRole('admin'), (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM market_updates WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Market update not found.' });
    return;
  }
  broadcastWs('update:deleted', { id: req.params.id });
  res.json({ ok: true });
});

app.post('/api/updates/:id/react', requireAuth, (req: AuthRequest, res: Response) => {
  const emoji = String(req.body?.emoji || 'like').slice(0, 16);
  const existing = db
    .prepare('SELECT 1 FROM update_reactions WHERE update_id = ? AND user_id = ? AND emoji = ?')
    .get(req.params.id, req.user!.id, emoji);

  if (existing) {
    db.prepare('DELETE FROM update_reactions WHERE update_id = ? AND user_id = ? AND emoji = ?').run(
      req.params.id,
      req.user!.id,
      emoji
    );
  } else {
    db.prepare(
      'INSERT INTO update_reactions (update_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, req.user!.id, emoji, new Date().toISOString());
  }

  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  res.json({ update: hydrateUpdates([row], req.user!.id)[0] });
});

app.post('/api/updates/:id/bookmark', requireAuth, (req: AuthRequest, res: Response) => {
  const existing = db
    .prepare('SELECT 1 FROM update_bookmarks WHERE update_id = ? AND user_id = ?')
    .get(req.params.id, req.user!.id);

  if (existing) {
    db.prepare('DELETE FROM update_bookmarks WHERE update_id = ? AND user_id = ?').run(
      req.params.id,
      req.user!.id
    );
  } else {
    db.prepare(
      'INSERT INTO update_bookmarks (update_id, user_id, created_at) VALUES (?, ?, ?)'
    ).run(req.params.id, req.user!.id, new Date().toISOString());
  }

  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  res.json({ update: hydrateUpdates([row], req.user!.id)[0] });
});

// ---------- Forex Trading Academy ----------
app.get('/api/academy/courses', optionalAuth, (req: AuthRequest, res: Response) => {
  const courseRows = db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all() as Array<
    Record<string, unknown>
  >;
  const lessonRows = db.prepare('SELECT * FROM lessons ORDER BY order_index ASC, created_at ASC').all() as Array<
    Record<string, unknown>
  >;

  const enrolledSet = new Set<string>();
  const progressMap = new Map<string, { completed: boolean; bookmarked: boolean; quiz_score: number | null }>();

  if (req.user) {
    const enrolls = db
      .prepare('SELECT course_id FROM enrollments WHERE user_id = ?')
      .all(req.user.id) as Array<{ course_id: string }>;
    for (const e of enrolls) enrolledSet.add(e.course_id);

    const progs = db
      .prepare('SELECT lesson_id, completed, bookmarked, quiz_score FROM lesson_progress WHERE user_id = ?')
      .all(req.user.id) as Array<{
      lesson_id: string;
      completed: number;
      bookmarked: number;
      quiz_score: number | null;
    }>;
    for (const p of progs) {
      progressMap.set(p.lesson_id, {
        completed: Boolean(p.completed),
        bookmarked: Boolean(p.bookmarked),
        quiz_score: p.quiz_score,
      });
    }
  }

  const courses = courseRows.map((c) => {
    const courseLessons = lessonRows
      .filter((l) => l.course_id === c.id)
      .map((l) => {
        const prog = progressMap.get(String(l.id));
        return {
          ...l,
          quiz: JSON.parse(String(l.quiz_json || '[]')),
          completed: prog?.completed || false,
          bookmarked: prog?.bookmarked || false,
          quiz_score: prog?.quiz_score ?? null,
        };
      });

    return {
      ...c,
      enrolled: enrolledSet.has(String(c.id)),
      total_lessons: courseLessons.length,
      completed_lessons: courseLessons.filter((l) => l.completed).length,
      lessons: courseLessons,
    };
  });

  res.json({ courses });
});

app.post('/api/academy/courses/:id/enroll', requireAuth, (req: AuthRequest, res: Response) => {
  db.prepare(
    'INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)'
  ).run(req.user!.id, req.params.id, new Date().toISOString());
  logUserActivity(req.user!.id, 'Course Enrolled', `Enrolled in course ${req.params.id}`, req.ip);
  res.json({ ok: true });
});

app.post('/api/academy/lessons/:id/progress', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    completed: z.boolean().optional(),
    bookmarked: z.boolean().optional(),
    quiz_answers: z.array(z.number()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid lesson progress payload.' });
    return;
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  const existing = db
    .prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?')
    .get(req.user!.id, req.params.id) as
    | { completed: number; bookmarked: number; quiz_score: number | null }
    | undefined;

  let quizScore = existing?.quiz_score ?? null;
  if (parsed.data.quiz_answers) {
    const questions = JSON.parse(String(lesson.quiz_json || '[]')) as Array<{
      correct_index: number;
    }>;
    if (questions.length > 0) {
      let correct = 0;
      questions.forEach((q, idx) => {
        if (parsed.data.quiz_answers![idx] === q.correct_index) correct++;
      });
      quizScore = Math.round((correct / questions.length) * 100);
    }
  }

  const completed =
    parsed.data.completed !== undefined
      ? parsed.data.completed
        ? 1
        : 0
      : existing?.completed ?? 0;
  const bookmarked =
    parsed.data.bookmarked !== undefined
      ? parsed.data.bookmarked
        ? 1
        : 0
      : existing?.bookmarked ?? 0;

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, bookmarked, quiz_score, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       completed = excluded.completed,
       bookmarked = excluded.bookmarked,
       quiz_score = excluded.quiz_score,
       updated_at = excluded.updated_at`
  ).run(req.user!.id, req.params.id, completed, bookmarked, quizScore, now);

  // Auto-enroll & save resume checkpoint
  db.prepare(
    `INSERT INTO enrollments (user_id, course_id, enrolled_at, last_lesson_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET last_lesson_id = excluded.last_lesson_id`
  ).run(req.user!.id, String(lesson.course_id), now, req.params.id);

  res.json({
    ok: true,
    completed: Boolean(completed),
    bookmarked: Boolean(bookmarked),
    quiz_score: quizScore,
  });
});

app.post('/api/academy/courses', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
    category: z.string().trim().min(2).max(80),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    cover_image_url: z.string().max(400).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid course data.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO courses (id, title, description, category, level, cover_image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    parsed.data.title,
    parsed.data.description,
    parsed.data.category,
    parsed.data.level,
    parsed.data.cover_image_url || '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    now
  );

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  broadcastWs('academy:updated', { type: 'course', id });
  res.status(201).json({ course });
});

app.delete('/api/academy/courses/:id', requireRole('admin'), (req: Request, res: Response) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  broadcastWs('academy:updated', { type: 'course_deleted', id: req.params.id });
  res.json({ ok: true });
});

app.post('/api/academy/lessons', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    course_id: z.string().min(1),
    title: z.string().trim().min(3).max(160),
    category: z.string().trim().min(2).max(80),
    summary: z.string().trim().min(5).max(500),
    content: z.string().trim().min(10).max(20000),
    video_url: z.string().max(400).optional().nullable(),
    pdf_url: z.string().max(400).optional().nullable(),
    image_url: z.string().max(400).optional().nullable(),
    duration_minutes: z.number().int().min(1).max(240).default(12),
    order_index: z.number().int().min(1).default(1),
    quiz: z
      .array(
        z.object({
          id: z.string(),
          question: z.string(),
          options: z.array(z.string()).min(2),
          correct_index: z.number().int().min(0),
          explanation: z.string().optional(),
        })
      )
      .optional(),
    send_push: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson payload.' });
    return;
  }

  const d = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO lessons (id, course_id, title, category, summary, content, video_url, pdf_url, image_url, duration_minutes, order_index, quiz_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    d.course_id,
    d.title,
    d.category,
    d.summary,
    d.content,
    d.video_url || null,
    d.pdf_url || null,
    d.image_url || null,
    d.duration_minutes,
    d.order_index,
    JSON.stringify(d.quiz || []),
    now
  );

  broadcastWs('academy:updated', { type: 'lesson', id });
  if (d.send_push !== false) {
    await dispatchNotification({
      title: `New Academy Lesson: ${d.title}`,
      body: `${d.category} · ${d.duration_minutes} min study module published.`,
      category: 'academy',
      linkUrl: '/academy',
      broadcastWs,
    });
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
  res.status(201).json({ lesson });
});

app.delete('/api/academy/lessons/:id', requireRole('admin'), (req: Request, res: Response) => {
  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
  broadcastWs('academy:updated', { type: 'lesson_deleted', id: req.params.id });
  res.json({ ok: true });
});

// ---------- Live Market Data & Economic Calendar ----------
app.get('/api/markets', async (_req: Request, res: Response) => {
  const instruments = await getMarketQuotes();
  res.json({ instruments });
});

app.get('/api/markets/:symbol/candles', async (req: Request, res: Response) => {
  const timeframe = String(req.query.timeframe || '1H');
  const data = await getMarketCandles(String(req.params.symbol), timeframe);
  res.json(data);
});

app.get('/api/calendar', async (_req: Request, res: Response) => {
  const data = await getEconomicCalendar();
  res.json(data);
});

// ---------- User Community ----------
app.get('/api/community/posts', optionalAuth, (req: AuthRequest, res: Response) => {
  const includeHidden = req.user && ['admin', 'moderator'].includes(req.user.role);
  const posts = db
    .prepare(
      `SELECT p.*, u.name as author_name, u.role as author_role,
        (SELECT COUNT(*) FROM community_likes cl WHERE cl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = p.id) as comments_count
       FROM community_posts p
       JOIN users u ON p.user_id = u.id
       ${includeHidden ? '' : 'WHERE p.hidden = 0'}
       ORDER BY p.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const commentStmt = db.prepare(
    `SELECT c.*, u.name as author_name, u.role as author_role
     FROM community_comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`
  );

  const likedSet = new Set<string>();
  if (req.user) {
    const likes = db
      .prepare('SELECT post_id FROM community_likes WHERE user_id = ?')
      .all(req.user.id) as Array<{ post_id: string }>;
    for (const l of likes) likedSet.add(l.post_id);
  }

  res.json({
    posts: posts.map((p) => ({
      ...p,
      hidden: Boolean(p.hidden),
      liked_by_me: likedSet.has(String(p.id)),
      comments: commentStmt.all(String(p.id)),
    })),
  });
});

app.post('/api/community/posts', requireAuth, rateLimit(10, 60_000), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    category: z.string().trim().min(2).max(60),
    title: z.string().trim().min(3).max(180),
    content: z.string().trim().min(5).max(4000),
    image_url: z.string().max(400).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid post content.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO community_posts (id, user_id, category, title, content, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.user!.id,
    parsed.data.category,
    parsed.data.title,
    parsed.data.content,
    parsed.data.image_url || null,
    now
  );

  const created = {
    id,
    user_id: req.user!.id,
    author_name: req.user!.name,
    author_role: req.user!.role,
    category: parsed.data.category,
    title: parsed.data.title,
    content: parsed.data.content,
    image_url: parsed.data.image_url || null,
    likes_count: 0,
    liked_by_me: false,
    comments_count: 0,
    comments: [],
    hidden: false,
    created_at: now,
  };
  broadcastWs('community:created', created);
  res.status(201).json({ post: created });
});

app.post('/api/community/posts/:id/comments', requireAuth, rateLimit(20, 60_000), (req: AuthRequest, res: Response) => {
  const content = String(req.body?.content || '').trim();
  if (content.length < 2 || content.length > 2000) {
    res.status(400).json({ error: 'Comment must be between 2 and 2000 characters.' });
    return;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO community_comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.params.id, req.user!.id, content, now);

  const comment = {
    id,
    post_id: req.params.id,
    user_id: req.user!.id,
    author_name: req.user!.name,
    author_role: req.user!.role,
    content,
    created_at: now,
  };
  broadcastWs('community:comment', comment);
  res.status(201).json({ comment });
});

app.post('/api/community/posts/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  const existing = db
    .prepare('SELECT 1 FROM community_likes WHERE post_id = ? AND user_id = ?')
    .get(req.params.id, req.user!.id);
  if (existing) {
    db.prepare('DELETE FROM community_likes WHERE post_id = ? AND user_id = ?').run(
      req.params.id,
      req.user!.id
    );
  } else {
    db.prepare('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)').run(
      req.params.id,
      req.user!.id
    );
  }
  const count = (
    db.prepare('SELECT COUNT(*) as c FROM community_likes WHERE post_id = ?').get(req.params.id) as {
      c: number;
    }
  ).c;
  res.json({ liked: !existing, likes_count: count });
});

app.post('/api/community/posts/:id/report', requireAuth, (req: AuthRequest, res: Response) => {
  const reason = String(req.body?.reason || '').trim();
  if (reason.length < 3) {
    res.status(400).json({ error: 'Please provide a reason for reporting.' });
    return;
  }
  db.prepare(
    'INSERT INTO community_reports (id, post_id, reporter_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), req.params.id, req.user!.id, reason.slice(0, 500), 'pending', new Date().toISOString());
  res.status(201).json({ ok: true });
});

app.delete('/api/community/posts/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const post = db.prepare('SELECT user_id FROM community_posts WHERE id = ?').get(req.params.id) as
    | { user_id: string }
    | undefined;
  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  if (post.user_id !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Not authorized to remove this post.' });
    return;
  }
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(req.params.id);
  broadcastWs('community:deleted', { id: req.params.id });
  res.json({ ok: true });
});

// ---------- Notifications & Push Subscriptions ----------
app.get('/api/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT n.*,
        CASE WHEN n.user_id IS NOT NULL THEN n.is_read
             WHEN EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = ?) THEN 1
             ELSE 0 END as resolved_read
       FROM notifications n
       WHERE n.user_id IS NULL OR n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 80`
    )
    .all(req.user!.id, req.user!.id) as Array<Record<string, unknown>>;

  const notifications = rows.map((r) => ({
    id: String(r.id),
    user_id: r.user_id ? String(r.user_id) : null,
    title: String(r.title),
    body: String(r.body),
    category: String(r.category),
    link_url: String(r.link_url),
    is_read: Boolean(r.resolved_read),
    created_at: String(r.created_at),
  }));

  res.json({
    notifications,
    unread_count: notifications.filter((n) => !n.is_read).length,
  });
});

app.post('/api/notifications/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const notif = db.prepare('SELECT id, user_id FROM notifications WHERE id = ?').get(req.params.id) as
    | { id: string; user_id: string | null }
    | undefined;
  if (!notif) {
    res.status(404).json({ error: 'Notification not found.' });
    return;
  }
  if (notif.user_id === req.user!.id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notif.id);
  } else {
    db.prepare(
      'INSERT OR IGNORE INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, ?)'
    ).run(notif.id, req.user!.id, new Date().toISOString());
  }
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthRequest, res: Response) => {
  const now = new Date().toISOString();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  const globals = db
    .prepare('SELECT id FROM notifications WHERE user_id IS NULL')
    .all() as Array<{ id: string }>;
  const insertRead = db.prepare(
    'INSERT OR IGNORE INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, ?)'
  );
  for (const g of globals) {
    insertRead.run(g.id, req.user!.id, now);
  }
  res.json({ ok: true });
});

app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
  const { publicKey } = ensureVapidKeys();
  res.json({ publicKey });
});

app.post('/api/push/subscribe', optionalAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(10),
      auth: z.string().min(6),
    }),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid push subscription object.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = COALESCE(excluded.user_id, push_subscriptions.user_id),
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       user_agent = excluded.user_agent`
  ).run(
    crypto.randomUUID(),
    req.user?.id || null,
    parsed.data.endpoint,
    parsed.data.keys.p256dh,
    parsed.data.keys.auth,
    String(req.headers['user-agent'] || '').slice(0, 250),
    now
  );

  res.status(201).json({ ok: true });
});

app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
  const endpoint = String(req.body?.endpoint || '');
  if (endpoint) {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  }
  res.json({ ok: true });
});

// ---------- Contact Form ----------
app.post('/api/contact', rateLimit(8, 60_000), (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(160),
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(3000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contact inquiry.' });
    return;
  }

  db.prepare(
    'INSERT INTO contact_messages (id, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    parsed.data.name,
    parsed.data.email,
    parsed.data.subject,
    parsed.data.message,
    'new',
    new Date().toISOString()
  );

  res.status(201).json({ ok: true });
});

// ---------- Administrator Dashboard APIs (/api/admin/*) ----------
app.get('/api/admin/overview', requireRole('admin'), (_req: AuthRequest, res: Response) => {
  const stats = getPublicStats();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newRegistrations = (
    db.prepare('SELECT COUNT(*) as c FROM users WHERE created_at >= ?').get(sevenDaysAgo) as { c: number }
  ).c;
  const pushSubscribers = (
    db.prepare('SELECT COUNT(*) as c FROM push_subscriptions').get() as { c: number }
  ).c;
  const dispatchLogs = db
    .prepare('SELECT * FROM push_dispatch_logs ORDER BY created_at DESC LIMIT 20')
    .all();
  const systemLogs = db
    .prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 30')
    .all();
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, 10);

  const studentProgress = db
    .prepare(
      `SELECT u.id, u.name, u.email,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as courses_enrolled,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = u.id AND lp.completed = 1) as lessons_completed,
        (SELECT ROUND(AVG(lp.quiz_score)) FROM lesson_progress lp WHERE lp.user_id = u.id AND lp.quiz_score IS NOT NULL) as avg_quiz_score
       FROM users u
       WHERE u.role = 'user'
       ORDER BY lessons_completed DESC
       LIMIT 30`
    )
    .all();

  res.json({
    stats: {
      ...stats,
      new_registrations_7d: newRegistrations,
      push_subscribers: pushSubscribers,
    },
    dispatch_logs: dispatchLogs,
    system_logs: systemLogs,
    backups,
    student_progress: studentProgress,
  });
});

app.get('/api/admin/users', requireRole('admin'), (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as Array<
    Record<string, unknown>
  >;
  res.json({ users: rows.map(mapDbUser) });
});

app.patch('/api/admin/users/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    role: z.enum(['user', 'moderator', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    email_verified: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user update fields.' });
    return;
  }

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (req.params.id === req.user!.id && parsed.data.status === 'suspended') {
    res.status(400).json({ error: 'You cannot suspend your own administrator account.' });
    return;
  }

  db.prepare('UPDATE users SET role = ?, status = ?, email_verified = ? WHERE id = ?').run(
    parsed.data.role ?? target.role,
    parsed.data.status ?? target.status,
    parsed.data.email_verified !== undefined ? (parsed.data.email_verified ? 1 : 0) : target.email_verified,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  res.json({ user: mapDbUser(updated) });
});

app.post('/api/admin/notifications/send', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(4).max(500),
    category: z.enum([
      'signals',
      'signal_updates',
      'market_updates',
      'academy',
      'economic_calendar',
      'announcements',
    ]),
    link_url: z.string().max(200).optional(),
    target_user_ids: z.array(z.string()).optional().nullable(),
    scheduled_at: z.string().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid notification payload.' });
    return;
  }

  const d = parsed.data;
  if (d.scheduled_at && new Date(d.scheduled_at).getTime() > Date.now()) {
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO scheduled_notifications (id, title, body, category, link_url, target_user_ids, scheduled_at, sent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).run(
      id,
      d.title,
      d.body,
      d.category,
      d.link_url || '/',
      d.target_user_ids && d.target_user_ids.length > 0 ? JSON.stringify(d.target_user_ids) : null,
      d.scheduled_at,
      new Date().toISOString()
    );
    res.status(201).json({ scheduled: true, id });
    return;
  }

  const result = await dispatchNotification({
    title: d.title,
    body: d.body,
    category: d.category as keyof NotificationPreferences,
    linkUrl: d.link_url || '/',
    targetUserIds: d.target_user_ids && d.target_user_ids.length > 0 ? d.target_user_ids : null,
    broadcastWs,
  });

  res.status(201).json({ scheduled: false, result });
});

app.get('/api/admin/reports', requireRole('admin', 'moderator'), (_req: Request, res: Response) => {
  const reports = db
    .prepare(
      `SELECT r.*, u.name as reporter_name, p.title as post_title, p.content as post_content
       FROM community_reports r
       JOIN users u ON r.reporter_id = u.id
       LEFT JOIN community_posts p ON r.post_id = p.id
       ORDER BY r.created_at DESC`
    )
    .all();
  res.json({ reports });
});

app.patch('/api/admin/reports/:id', requireRole('admin', 'moderator'), (req: Request, res: Response) => {
  const action = String(req.body?.action || 'dismiss');
  const report = db.prepare('SELECT * FROM community_reports WHERE id = ?').get(req.params.id) as
    | { post_id: string | null }
    | undefined;
  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  if (action === 'hide_post' && report.post_id) {
    db.prepare('UPDATE community_posts SET hidden = 1 WHERE id = ?').run(report.post_id);
    broadcastWs('community:deleted', { id: report.post_id });
  }
  db.prepare('UPDATE community_reports SET status = ? WHERE id = ?').run(
    action === 'hide_post' ? 'resolved' : 'dismissed',
    req.params.id
  );
  res.json({ ok: true });
});

app.get('/api/admin/contacts', requireRole('admin'), (_req: Request, res: Response) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ messages });
});

app.patch('/api/admin/settings', requireRole('admin'), (req: Request, res: Response) => {
  const allowedKeys = [
    'brand_name',
    'tagline',
    'logo_url',
    'hero_title',
    'hero_subtitle',
    'about_text',
    'contact_email',
    'contact_phone',
    'contact_address',
    'seo_title',
    'seo_description',
    'push_enabled',
    'market_api_provider',
    'calendar_api_provider',
  ];

  const upsert = db.prepare('INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)');
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      upsert.run(key, String(req.body[key]));
    }
  }

  const settings = getPlatformSettings();
  broadcastWs('settings:updated', settings);
  res.json({ settings });
});

app.post('/api/admin/backup', requireRole('admin'), (_req: Request, res: Response) => {
  const info = createDatabaseBackup();
  res.json(info);
});

app.get('/api/admin/backups/:filename', requireRole('admin'), (req: Request, res: Response) => {
  const safeName = path.basename(String(req.params.filename));
  const fullPath = path.join(BACKUP_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Backup file not found.' });
    return;
  }
  res.download(fullPath, safeName);
});

// Global API Error Handler
app.use('/api', (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logSystemEvent('error', 'api', err.message || 'Unhandled API error');
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Background Scheduler: Scheduled Market Updates, Scheduled Push Notifications, Periodic Backups
let lastAutoBackupDay = '';
setInterval(async () => {
  const nowIso = new Date().toISOString();

  try {
    // 1. Publish due scheduled market updates
    const dueUpdates = db
      .prepare('SELECT * FROM market_updates WHERE published = 0 AND scheduled_at IS NOT NULL AND scheduled_at <= ?')
      .all(nowIso) as Array<Record<string, unknown>>;

    for (const u of dueUpdates) {
      db.prepare('UPDATE market_updates SET published = 1, updated_at = ? WHERE id = ?').run(nowIso, String(u.id));
      const hydrated = { ...u, pinned: Boolean(u.pinned), published: true, reactions: {}, user_reacted: [], bookmarked: false };
      broadcastWs('update:created', hydrated);
      await dispatchNotification({
        title: `${String(u.category)}: ${String(u.title)}`,
        body: String(u.content).slice(0, 140),
        category: 'market_updates',
        linkUrl: '/updates',
        broadcastWs,
      });
    }

    // 2. Dispatch due scheduled push notifications
    const dueNotifs = db
      .prepare('SELECT * FROM scheduled_notifications WHERE sent = 0 AND scheduled_at <= ?')
      .all(nowIso) as Array<{
      id: string;
      title: string;
      body: string;
      category: string;
      link_url: string;
      target_user_ids: string | null;
    }>;

    for (const n of dueNotifs) {
      db.prepare('UPDATE scheduled_notifications SET sent = 1 WHERE id = ?').run(n.id);
      await dispatchNotification({
        title: n.title,
        body: n.body,
        category: n.category as keyof NotificationPreferences,
        linkUrl: n.link_url,
        targetUserIds: n.target_user_ids ? (JSON.parse(n.target_user_ids) as string[]) : null,
        broadcastWs,
      });
    }

    // 3. Automated daily backup snapshot
    const today = nowIso.slice(0, 10);
    if (today !== lastAutoBackupDay) {
      createDatabaseBackup();
      lastAutoBackupDay = today;
    }
  } catch (err) {
    logSystemEvent('error', 'scheduler', String(err));
  }
}, 30_000);

// ---------- Frontend Serving (Vite Dev Middleware vs Production Static) ----------
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MeridianFX server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
