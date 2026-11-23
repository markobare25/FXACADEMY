import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  BACKUP_DIR,
  DESIGNATED_ADMIN_EMAIL,
  UPLOAD_DIR,
  createDatabaseBackup,
  db,
  ensureDesignatedAdminUser,
  generateSeededReactions,
  generateSeededViews,
  hashPassword,
  initDatabase,
  logSystemEvent,
  verifyAdminFallbackPassword,
  verifyPassword,
} from './server/db.ts';
import {
  type AuthRequest,
  ADMIN_SESSION_REMEMBER_TTL_SEC,
  ADMIN_SESSION_SHORT_TTL_SEC,
  REFRESH_REMEMBER_TTL_SEC,
  cleanupExpiredAuthRecords,
  createAdminSession,
  createAuthSession,
  extractAdminAuthContext,
  extractAuthContext,
  extractBearerContext,
  isActivePremiumUser,
  isUserMembershipExpired,
  logUserActivity,
  mapDbUser,
  normalizeNotificationPrefs,
  optionalAuth,
  parseCookies,
  rateLimit,
  requireAuth,
  requireRole,
  revokeAccessToken,
  revokeAllUserSessions,
  revokeRefreshToken,
  rotateRefreshSession,
  signVisitorCookie,
  validateStrongPassword,
  verifyRefreshToken,
  verifyVisitorCookie,
} from './server/auth.ts';
import {
  cleanupInactivePushSubscriptions,
  dispatchNotification,
  ensureVapidKeys,
  getPushInfrastructureStatus,
  getPushJobSummary,
  listPushSubscriptions,
  listRecentPushDeliveries,
  listRecentPushJobs,
  processPendingPushDeliveries,
  recordPushReceipt,
  sendDirectTestPush,
  setPushWsBroadcaster,
  type PushCategory,
  type PushTargetGroup,
} from './server/push.ts';
import {
  deleteRemoteSignalMessage,
  ensureRemoteHydrated,
  fetchRemoteSignalMessageById,
  syncMarketUpdateToRemote,
  syncPushSubscriptionToRemote,
  syncSignalMessageToRemote,
  syncSignalReactionToRemote,
} from './server/persistentStore.ts';
import { getEconomicCalendar, getMarketCandles, getMarketQuotes } from './server/markets.ts';
import type {
  NotificationPreferences,
  PlatformSettings,
  PublicStats,
  SignalReactionType,
  SignalReactionsMap,
} from './src/types.ts';

initDatabase();
ensureVapidKeys();

const app = express();
app.set('trust proxy', true);
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch {
    socket.destroy();
  }
});

const wsClients = new Set<WebSocket>();
const wsAliveMap = new WeakMap<WebSocket, boolean>();
const wsMetaMap = new WeakMap<WebSocket, { isAdmin: boolean; conversationIds: Set<string> }>();

function hashSupportToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function verifySupportToken(rawToken: string, expectedHash: string): boolean {
  if (!rawToken || !expectedHash) return false;
  const actualBuf = Buffer.from(hashSupportToken(rawToken), 'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (actualBuf.length === 0 || actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

wss.on('connection', (ws) => {
  wsClients.add(ws);
  wsAliveMap.set(ws, true);
  wsMetaMap.set(ws, { isAdmin: false, conversationIds: new Set() });
  ws.send(
    JSON.stringify({
      event: 'connected',
      data: { timestamp: new Date().toISOString(), online_count: wsClients.size },
    })
  );
  broadcastWs('presence:update', { online_count: wsClients.size });

  ws.on('pong', () => {
    wsAliveMap.set(ws, true);
  });

  ws.on('message', (raw) => {
    wsAliveMap.set(ws, true);
    try {
      const parsed = JSON.parse(String(raw)) as {
        event?: string;
        token?: string;
        conversation_id?: string;
      };
      if (parsed?.event === 'ping' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'pong', data: { timestamp: new Date().toISOString() } }));
        return;
      }
      if (parsed?.event === 'admin:subscribe' && parsed.token) {
        const ctx = extractBearerContext(parsed.token);
        const meta = wsMetaMap.get(ws);
        if (
          meta &&
          ctx.user &&
          ctx.user.role === 'admin' &&
          ctx.user.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL
        ) {
          meta.isAdmin = true;
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'admin:subscribed', data: { ok: true } }));
          }
        }
        return;
      }
      if (parsed?.event === 'support:subscribe' && parsed.conversation_id && parsed.token) {
        const conv = db
          .prepare('SELECT id, access_token_hash FROM support_conversations WHERE id = ?')
          .get(String(parsed.conversation_id)) as
          | { id: string; access_token_hash: string }
          | undefined;
        const meta = wsMetaMap.get(ws);
        if (conv && meta && verifySupportToken(String(parsed.token), conv.access_token_hash)) {
          meta.conversationIds.add(conv.id);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                event: 'support:subscribed',
                data: { conversation_id: conv.id },
              })
            );
          }
        }
      }
    } catch {
      // ignore non-JSON frames
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    broadcastWs('presence:update', { online_count: wsClients.size });
  });
  ws.on('error', () => {
    wsClients.delete(ws);
    broadcastWs('presence:update', { online_count: wsClients.size });
  });
});

if (!process.env.VERCEL) {
  setInterval(() => {
    for (const client of wsClients) {
      if (wsAliveMap.get(client) === false) {
        wsClients.delete(client);
        client.terminate();
        broadcastWs('presence:update', { online_count: wsClients.size });
        continue;
      }
      wsAliveMap.set(client, false);
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    }
  }, 25_000);
}

const sseClients = new Set<Response>();

function broadcastWs(event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastSignalChatEvent(event: string, data: unknown): void {
  broadcastWs(event, data);
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(frame);
    } catch {
      sseClients.delete(res);
    }
  }
}

function emitAdminWs(event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN && wsMetaMap.get(client)?.isAdmin) {
      client.send(payload);
    }
  }
}

function emitSupportWs(conversationId: string, event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data });
  for (const client of wsClients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    const meta = wsMetaMap.get(client);
    if (meta && (meta.isAdmin || meta.conversationIds.has(conversationId))) {
      client.send(payload);
    }
  }
}

setPushWsBroadcaster(broadcastWs);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Ensure persistent remote store is hydrated before handling API requests on cold starts
app.use('/api', async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureRemoteHydrated();
  } catch {
    // Fall back cleanly to local SQLite if remote store is unavailable
  }
  next();
});

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
  limits: { fileSize: 25 * 1024 * 1024 },
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
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: images, PDF, MP4, WebM, MP3, WAV, OGG.'));
    }
  },
});

const supportImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedImages.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Customer chat accepts image files only (JPG, PNG, WebP, GIF up to 5MB).'));
    }
  },
});

function isHttpsRequest(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const forwarded = String(req.headers['forwarded'] || '').toLowerCase();
  return Boolean(
    req.secure ||
      proto === 'https' ||
      forwarded.includes('proto=https') ||
      req.headers['x-forwarded-ssl'] === 'on'
  );
}

function buildRefreshCookieOptions(
  req: Request,
  cookiePath: string,
  rememberMe?: boolean
) {
  const isHttps = isHttpsRequest(req);
  return {
    httpOnly: true,
    sameSite: isHttps ? ('none' as const) : ('lax' as const),
    secure: isHttps,
    ...(isHttps ? { partitioned: true } : {}),
    ...(rememberMe ? { maxAge: REFRESH_REMEMBER_TTL_SEC * 1000 } : {}),
    path: cookiePath,
  };
}

function clearCookieVariants(req: Request, res: Response, cookieName: string, cookiePath: string): void {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: cookiePath,
  });
  if (isHttps) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: cookiePath,
    });
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: cookiePath,
    });
  }
}

function setRefreshCookie(
  req: Request,
  res: Response,
  refreshToken: string,
  rememberMe: boolean
): void {
  res.cookie('mfx_refresh', refreshToken, buildRefreshCookieOptions(req, '/', rememberMe));
}

function clearRefreshCookie(req: Request, res: Response): void {
  for (const cookieName of ['mfx_refresh', 'mfx_session']) {
    clearCookieVariants(req, res, cookieName, '/');
  }
}

function buildAdminCookieOptions(req: Request, rememberMe: boolean) {
  const isSecure =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    isHttpsRequest(req);
  const maxAgeMs =
    (rememberMe ? ADMIN_SESSION_REMEMBER_TTL_SEC : ADMIN_SESSION_SHORT_TTL_SEC) * 1000;
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeMs,
  };
}

function setAdminRefreshCookie(
  req: Request,
  res: Response,
  sessionToken: string,
  rememberMe: boolean
): void {
  clearCookieVariants(req, res, 'mfx_admin_refresh', '/api/admin');
  res.cookie('mfx_admin_session', sessionToken, buildAdminCookieOptions(req, rememberMe));
}

function clearAdminRefreshCookie(req: Request, res: Response): void {
  clearCookieVariants(req, res, 'mfx_admin_session', '/');
  clearCookieVariants(req, res, 'mfx_admin_refresh', '/');
  clearCookieVariants(req, res, 'mfx_admin_refresh', '/api/admin');
}

// Verify Origin/Host or X-Requested-With on cookie-authenticated state-changing API requests
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }
  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ') && authHeader.length > 10;
  if (hasBearer || req.headers['x-requested-with']) {
    next();
    return;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies['mfx_refresh'] && !cookies['mfx_admin_session'] && !cookies['mfx_admin_refresh']) {
    next();
    return;
  }
  const originHeader = req.headers.origin || req.headers.referer;
  const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  if (originHeader && hostHeader) {
    try {
      const originHost = new URL(String(originHeader)).host.toLowerCase();
      if (originHost === hostHeader) {
        next();
        return;
      }
    } catch {
      // fall through to deny
    }
    res.status(403).json({ error: 'Cross-origin request rejected.' });
    return;
  }
  next();
});

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
    contact_whatsapp: map.contact_whatsapp || '',
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
  const totalCourses = (
    db.prepare("SELECT COUNT(*) as c FROM courses WHERE status = 'published'").get() as { c: number }
  ).c;
  const totalLessons = (
    db.prepare("SELECT COUNT(*) as c FROM lessons WHERE status = 'published'").get() as { c: number }
  ).c;
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
app.use('/api/auth', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.post('/api/auth/register', rateLimit(20, 60_000), (_req: Request, res: Response) => {
  res.status(403).json({
    error:
      'Public account registration is closed. Please apply for Premium Membership via the Profile page or contact the MeridianFX administrator.',
  });
});

const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Please enter your email or username.').max(160).optional(),
    email: z.string().trim().min(1).max(160).optional(),
    password: z.string().min(1, 'Password is required.'),
    remember_me: z.boolean().optional(),
  })
  .refine((data) => Boolean((data.identifier || data.email || '').trim()), {
    message: 'Please enter your email address or username.',
  });

app.post('/api/auth/login', rateLimit(40, 60_000), (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Valid credentials are required.' });
    return;
  }

  const identifier = (parsed.data.identifier || parsed.data.email || '').trim().toLowerCase();
  const row = db
    .prepare(
      `SELECT * FROM users
       WHERE LOWER(email) = ?
          OR (username IS NOT NULL AND username != '' AND LOWER(username) = ?)
       LIMIT 1`
    )
    .get(identifier, identifier) as Record<string, unknown> | undefined;

  if (!row || !verifyPassword(parsed.data.password, String(row.password_hash))) {
    res.status(401).json({ error: 'Invalid email, username, or password.' });
    return;
  }

  const resolvedEmail = String(row.email).toLowerCase();
  const isDesignatedAdmin = resolvedEmail === DESIGNATED_ADMIN_EMAIL || row.role === 'admin';

  // Strictly block administrator sign-in via the public/member login endpoint
  if (isDesignatedAdmin) {
    res.status(403).json({
      error: 'Administrator authentication is isolated to the dedicated /admin website.',
    });
    return;
  }

  if (row.status === 'suspended') {
    res.status(403).json({ error: 'Your membership has been suspended. Please contact the MeridianFX administrator.' });
    return;
  }

  if (isUserMembershipExpired(row)) {
    res.status(403).json({ error: 'Your premium membership has expired. Contact the MeridianFX administrator to renew.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, String(row.id));
  logUserActivity(String(row.id), 'Sign In', 'Premium member session started.', req.ip);

  const user = mapDbUser({ ...row, last_login_at: now });
  const rememberMe = parsed.data.remember_me !== false;
  const session = createAuthSession(user.id, user.role, {
    rememberMe,
    userAgent: String(req.headers['user-agent'] || ''),
    ip: req.ip,
  });
  setRefreshCookie(req, res, session.refreshToken, session.rememberMe);

  res.json({
    user,
    access_token: session.accessToken,
    expires_in: session.expiresIn,
    remember_me: session.rememberMe,
  });
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const rawRefresh = cookies['mfx_refresh'] || '';
  if (!rawRefresh) {
    clearRefreshCookie(req, res);
    res.status(401).json({ error: 'No active session found.' });
    return;
  }

  const rotated = rotateRefreshSession(rawRefresh, {
    userAgent: String(req.headers['user-agent'] || ''),
    ip: req.ip,
    blockAdmin: true,
  });

  if (!rotated) {
    clearRefreshCookie(req, res);
    res.status(401).json({ error: 'Session expired or revoked. Please sign in again.' });
    return;
  }

  if (rotated.rotated) {
    setRefreshCookie(req, res, rotated.refreshToken, rotated.rememberMe);
  }

  res.json({
    user: rotated.user,
    access_token: rotated.accessToken,
    expires_in: rotated.expiresIn,
    remember_me: rotated.rememberMe,
  });
});

// ---------- Isolated Administrator Portal Authentication (/api/admin/auth/*) ----------
app.use('/api/admin/auth', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.post('/api/admin/auth/login', rateLimit(25, 60_000), (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Administrator credentials are required.' });
    return;
  }

  const identifier = (parsed.data.identifier || parsed.data.email || '').trim().toLowerCase();
  let row = db
    .prepare(
      `SELECT * FROM users
       WHERE LOWER(email) = ?
          OR (username IS NOT NULL AND username != '' AND LOWER(username) = ?)
       LIMIT 1`
    )
    .get(identifier, identifier) as Record<string, unknown> | undefined;

  if (!row && identifier === DESIGNATED_ADMIN_EMAIL) {
    ensureDesignatedAdminUser();
    row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1')
      .get(DESIGNATED_ADMIN_EMAIL) as Record<string, unknown> | undefined;
  }

  if (!row) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const resolvedEmail = String(row.email).toLowerCase();
  if (resolvedEmail !== DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Only authorised MeridianFX administrators can access /admin.' });
    return;
  }

  const matchesDbHash = verifyPassword(parsed.data.password, String(row.password_hash));
  const matchesDesignatedFallback = verifyAdminFallbackPassword(parsed.data.password);
  if (!matchesDbHash && !matchesDesignatedFallback) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const now = new Date().toISOString();
  const nextHash = matchesDbHash ? String(row.password_hash) : hashPassword(parsed.data.password);
  db.prepare(
    "UPDATE users SET password_hash = ?, role = 'admin', status = 'active', email_verified = 1, needs_password_setup = 0, last_login_at = ? WHERE id = ?"
  ).run(nextHash, now, String(row.id));

  const user = mapDbUser({
    ...row,
    password_hash: nextHash,
    role: 'admin',
    status: 'active',
    email_verified: 1,
    needs_password_setup: 0,
    last_login_at: now,
  });
  logUserActivity(user.id, 'Admin Sign In', 'Dedicated /admin portal session started.', req.ip);

  const rememberMe = parsed.data.remember_me !== false;
  const session = createAdminSession(user.id, {
    rememberMe,
    userAgent: String(req.headers['user-agent'] || ''),
    ip: req.ip,
  });
  setAdminRefreshCookie(req, res, session.accessToken, session.rememberMe);

  res.json({
    user,
    token: session.accessToken,
    access_token: session.accessToken,
    expires_in: session.expiresIn,
    remember_me: session.rememberMe,
  });
});

app.post('/api/admin/auth/refresh', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const authCtx = extractAdminAuthContext(req);

  if (authCtx.user && authCtx.token) {
    const refreshClaims = verifyRefreshToken(authCtx.token);
    const rememberMe = refreshClaims ? Boolean(refreshClaims.rm) : true;
    const session = createAdminSession(authCtx.user.id, {
      rememberMe,
      userAgent: String(req.headers['user-agent'] || ''),
      ip: req.ip,
      sessionId: authCtx.sid,
    });
    setAdminRefreshCookie(req, res, session.accessToken, session.rememberMe);
    res.json({
      user: authCtx.user,
      token: session.accessToken,
      access_token: session.accessToken,
      expires_in: session.expiresIn,
      remember_me: session.rememberMe,
    });
    return;
  }

  const rawLegacyRefresh = cookies['mfx_admin_refresh'] || '';
  if (!rawLegacyRefresh) {
    clearAdminRefreshCookie(req, res);
    res.status(401).json({ error: 'No active administrator session found.' });
    return;
  }

  const rotated = rotateRefreshSession(rawLegacyRefresh, {
    userAgent: String(req.headers['user-agent'] || ''),
    ip: req.ip,
    requireAdmin: true,
  });

  if (!rotated) {
    clearAdminRefreshCookie(req, res);
    res.status(401).json({ error: 'Administrator session expired. Please sign in again.' });
    return;
  }

  const session = createAdminSession(rotated.user.id, {
    rememberMe: rotated.rememberMe,
    userAgent: String(req.headers['user-agent'] || ''),
    ip: req.ip,
    sessionId: rotated.sessionId,
  });
  setAdminRefreshCookie(req, res, session.accessToken, session.rememberMe);

  res.json({
    user: rotated.user,
    token: session.accessToken,
    access_token: session.accessToken,
    expires_in: session.expiresIn,
    remember_me: session.rememberMe,
  });
});

app.post('/api/admin/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookieToken = cookies['mfx_admin_session'] || '';
  const refreshToken = cookies['mfx_admin_refresh'] || '';
  const ctx = extractAdminAuthContext(req);

  if (bearerToken) {
    revokeAccessToken(bearerToken);
  }
  if (sessionCookieToken) {
    revokeAccessToken(sessionCookieToken);
    revokeRefreshToken(sessionCookieToken);
  }
  const revokedUserId = revokeRefreshToken(refreshToken);
  const actorId = ctx.user?.id || revokedUserId;

  if (actorId) {
    logUserActivity(actorId, 'Admin Sign Out', 'Dedicated /admin session terminated.', req.ip);
  }

  clearAdminRefreshCookie(req, res);
  res.json({ ok: true });
});

app.get('/api/admin/auth/me', (req: Request, res: Response) => {
  const ctx = extractAdminAuthContext(req);
  if (
    !ctx.user ||
    ctx.user.role !== 'admin' ||
    ctx.user.email.toLowerCase() !== DESIGNATED_ADMIN_EMAIL
  ) {
    res.status(401).json({ user: null, error: 'Administrator authentication required.' });
    return;
  }
  const expiresIn = ctx.expiresAt
    ? Math.max(0, ctx.expiresAt - Math.floor(Date.now() / 1000))
    : ADMIN_SESSION_SHORT_TTL_SEC;
  res.json({
    user: ctx.user,
    token: ctx.token,
    access_token: ctx.token,
    expires_in: expiresIn,
  });
});

app.post('/api/auth/logout', optionalAuth, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies['mfx_refresh'] || '';

  if (bearerToken) {
    revokeAccessToken(bearerToken);
  }
  const revokedUserId = revokeRefreshToken(refreshToken);
  const actorId = req.user?.id || revokedUserId;

  if (actorId) {
    logUserActivity(actorId, 'Sign Out', 'Session terminated.', req.ip);
  }

  clearRefreshCookie(req, res);
  res.json({ ok: true });
});

app.post('/api/auth/logout-all', requireAuth, (req: AuthRequest, res: Response) => {
  revokeAllUserSessions(req.user!.id);
  logUserActivity(req.user!.id, 'Sign Out All Devices', 'All active sessions revoked.', req.ip);
  clearRefreshCookie(req, res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const ctx = extractAuthContext(req);
  if (!ctx.user) {
    res.status(401).json({ user: null, error: 'Authentication required.' });
    return;
  }
  res.json({ user: ctx.user });
});

app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  const { token, code, email } = req.body as { token?: string; code?: string; email?: string };
  let record:
    | { id: string; user_id: string; expires_at: string; used: number }
    | undefined;

  if (token) {
    record = db
      .prepare('SELECT * FROM email_verifications WHERE token = ? AND used = 0')
      .get(token.trim()) as typeof record;
  } else if (code && email) {
    const user = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase()) as
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

  res.json({
    ok: true,
    verification_code: verifyCode,
    verification_token: verifyToken,
    verification_url: `/verify-email?token=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(user.email)}`,
  });
});

app.post('/api/auth/forgot-password', rateLimit(10, 60_000), (_req: Request, res: Response) => {
  res.status(403).json({
    error:
      'Self-service password resets are disabled. Please contact the MeridianFX administrator via the Profile page to request a temporary password reset.',
  });
});

app.post('/api/auth/reset-password', rateLimit(10, 60_000), (_req: Request, res: Response) => {
  res.status(403).json({
    error:
      'Password resets are managed by the MeridianFX administrator. Please contact support via the Profile page.',
  });
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
  if (req.user!.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'The designated administrator password is permanent.' });
    return;
  }

  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'New password must be at least 8 characters.').max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'New password must be at least 8 characters.' });
    return;
  }

  const passwordErr = validateStrongPassword(parsed.data.new_password);
  if (passwordErr) {
    res.status(400).json({ error: passwordErr });
    return;
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as {
    password_hash: string;
  };
  if (!verifyPassword(parsed.data.current_password, row.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  db.prepare('UPDATE users SET password_hash = ?, needs_password_setup = 0 WHERE id = ?').run(
    hashPassword(parsed.data.new_password),
    req.user!.id
  );
  const ctx = extractAuthContext(req);
  revokeAllUserSessions(req.user!.id, ctx.sid);
  logUserActivity(req.user!.id, 'Password Changed', 'User changed account password.', req.ip);
  res.json({ ok: true });
});

app.patch('/api/users/notifications-prefs', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    signals: z.boolean().optional(),
    signal_updates: z.boolean().optional(),
    signal_chat: z.boolean().optional(),
    market_updates: z.boolean().optional(),
    academy: z.boolean().optional(),
    economic_calendar: z.boolean().optional(),
    announcements: z.boolean().optional(),
    sound_enabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid notification preferences.' });
    return;
  }

  const currentPrefs = normalizeNotificationPrefs(req.user!.notification_prefs);
  const nextPrefs = normalizeNotificationPrefs({ ...currentPrefs, ...parsed.data });
  const prefsJson = JSON.stringify(nextPrefs);

  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(prefsJson, req.user!.id);
  db.prepare(
    'UPDATE push_subscriptions SET prefs_json = ?, sound_enabled = ?, updated_at = ? WHERE user_id = ?'
  ).run(prefsJson, nextPrefs.sound_enabled ? 1 : 0, new Date().toISOString(), req.user!.id);

  logUserActivity(req.user!.id, 'Notification Preferences Updated', 'Updated push category alerts & sound.', req.ip);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  res.json({ user: mapDbUser(updated), prefs: nextPrefs });
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

app.post('/api/users/installed-at', requireAuth, (req: AuthRequest, res: Response) => {
  const raw = typeof req.body?.installed_at === 'string' ? req.body.installed_at.trim() : '';
  const parsedMs = raw ? Date.parse(raw) : NaN;
  const candidateIso = Number.isFinite(parsedMs) ? new Date(parsedMs).toISOString() : new Date().toISOString();

  db.prepare('UPDATE users SET installed_at = COALESCE(installed_at, ?) WHERE id = ?').run(
    candidateIso,
    req.user!.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  const mapped = mapDbUser(updated);
  res.json({ installed_at: mapped.installed_at || candidateIso, user: mapped });
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
  revokeAllUserSessions(req.user!.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);
  clearRefreshCookie(req, res);
  res.json({ ok: true });
});

// ---------- Signals Community Chat (Active Live Stream & Completed Archive) ----------
const recentSignalChatDedup = new Map<string, number>();
const reactionBurstBuckets = new Map<string, number[]>();
const REACTION_TYPES: readonly SignalReactionType[] = ['love', 'like', 'fire', 'hundred'];
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function emptyReactions(): SignalReactionsMap {
  return { love: 0, like: 0, fire: 0, hundred: 0 };
}

function hashActorKey(actorKey: string): string {
  return crypto.createHash('sha256').update(actorKey).digest('hex').slice(0, 24);
}

function resolveReactionActor(
  req: AuthRequest,
  res: Response,
  issueCookieIfMissing: boolean
): { actorKey: string; userId: string | null; visitorId: string | null } | null {
  if (req.user) {
    return {
      actorKey: `user:${req.user.id}`,
      userId: req.user.id,
      visitorId: null,
    };
  }

  const cookies = parseCookies(req.headers.cookie);
  const signedVisitorId = verifyVisitorCookie(cookies['mfx_vid']);
  const headerVisitorRaw = String(req.headers['x-visitor-id'] || '').trim();
  const validHeaderVisitor = UUID_V4_RE.test(headerVisitorRaw) ? headerVisitorRaw.toLowerCase() : null;

  let visitorId = validHeaderVisitor || signedVisitorId;
  if (!visitorId && issueCookieIfMissing) {
    visitorId = crypto.randomUUID();
  }
  if (!visitorId) {
    return null;
  }

  if (issueCookieIfMissing && signedVisitorId !== visitorId) {
    const isHttps = isHttpsRequest(req);
    res.cookie('mfx_vid', signVisitorCookie(visitorId), {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  return {
    actorKey: `visitor:${visitorId}`,
    userId: null,
    visitorId,
  };
}

function checkReactionBurst(actorKey: string, ip: string): boolean {
  const now = Date.now();
  const bucketKey = `${actorKey}|${ip}`;
  const recent = (reactionBurstBuckets.get(bucketKey) || []).filter((ts) => now - ts < 15_000);
  if (recent.length >= 15) {
    reactionBurstBuckets.set(bucketKey, recent);
    return false;
  }
  recent.push(now);
  reactionBurstBuckets.set(bucketKey, recent);
  if (reactionBurstBuckets.size > 5000) {
    for (const [k, list] of reactionBurstBuckets.entries()) {
      if (list.every((ts) => now - ts >= 15_000)) reactionBurstBuckets.delete(k);
    }
  }
  return true;
}

function hydrateSignalMessages(rows: Array<Record<string, unknown>>, actorKey?: string | null) {
  if (rows.length === 0) return [];

  const messageIds = rows.map((r) => String(r.id));
  const placeholders = messageIds.map(() => '?').join(',');

  const reactRows = db
    .prepare(
      `SELECT message_id, reaction, COUNT(*) as cnt
       FROM signal_message_reactions
       WHERE message_id IN (${placeholders})
       GROUP BY message_id, reaction`
    )
    .all(...messageIds) as Array<{ message_id: string; reaction: SignalReactionType; cnt: number }>;

  const reactMap = new Map<string, SignalReactionsMap>();
  const actorMap = new Map<string, SignalReactionsMap>();
  for (const r of reactRows) {
    const cur = actorMap.get(r.message_id) || emptyReactions();
    if (REACTION_TYPES.includes(r.reaction)) {
      cur[r.reaction] += r.cnt;
    }
    actorMap.set(r.message_id, cur);
  }
  for (const row of rows) {
    const id = String(row.id);
    const actor = actorMap.get(id) || emptyReactions();
    reactMap.set(id, {
      love: Math.max(Number(row.love_count || 0), Number(row.seed_love || 0) + actor.love),
      like: Math.max(Number(row.like_count || 0), Number(row.seed_like || 0) + actor.like),
      fire: Math.max(Number(row.fire_count || 0), Number(row.seed_fire || 0) + actor.fire),
      hundred: Math.max(Number(row.hundred_count || 0), Number(row.seed_hundred || 0) + actor.hundred),
    });
  }

  const userReactMap = new Map<string, SignalReactionType>();
  if (actorKey) {
    const uRows = db
      .prepare(
        `SELECT message_id, reaction
         FROM signal_message_reactions
         WHERE actor_key = ? AND message_id IN (${placeholders})`
      )
      .all(actorKey, ...messageIds) as Array<{ message_id: string; reaction: SignalReactionType }>;
    for (const ur of uRows) {
      if (REACTION_TYPES.includes(ur.reaction)) {
        userReactMap.set(ur.message_id, ur.reaction);
      }
    }
  }

  return rows.map((row) => {
    const imgUrl = row.image_url ? String(row.image_url) : null;
    const imgName = row.image_name ? String(row.image_name) : null;
    const mediaUrl = row.media_url ? String(row.media_url) : imgUrl;
    const mediaType = row.media_type
      ? (String(row.media_type) as 'image' | 'video')
      : imgUrl
        ? 'image'
        : null;
    const mediaName = row.media_name ? String(row.media_name) : imgName;

    return {
      id: String(row.id),
      author_id: String(row.author_id),
      author_name: String(row.author_name),
      content: String(row.content || ''),
      image_url: mediaType === 'video' ? null : imgUrl || mediaUrl,
      image_name: mediaType === 'video' ? null : imgName || mediaName,
      media_url: mediaUrl,
      media_type: mediaType,
      media_name: mediaName,
      message_type: String(row.message_type || 'update'),
      priority: row.priority === 'urgent' ? 'urgent' : 'normal',
      status: String(row.status || 'active'),
      pinned: Boolean(row.pinned),
      edited_at: row.edited_at ? String(row.edited_at) : null,
      completed_at: row.completed_at ? String(row.completed_at) : null,
      completed_summary: row.completed_summary ? String(row.completed_summary) : null,
      source_type: row.source_type ? String(row.source_type) : null,
      source_id: row.source_id ? String(row.source_id) : null,
      is_welcome: Boolean(row.is_welcome),
      views: Number(row.seed_views || 0),
      created_at: String(row.created_at),
      reactions: reactMap.get(String(row.id)) || emptyReactions(),
      user_reaction: userReactMap.get(String(row.id)) || null,
    };
  });
}

function getDesignatedAdminIdentity(): { id: string; name: string } | null {
  const row = db
    .prepare('SELECT id, name FROM users WHERE LOWER(email) = ? LIMIT 1')
    .get(DESIGNATED_ADMIN_EMAIL) as { id: string; name: string } | undefined;
  return row || null;
}

function publishMirrorToSignalChannel(params: {
  sourceType: string;
  sourceId: string;
  authorId?: string;
  authorName?: string;
  messageType: 'signal' | 'setup' | 'update' | 'analysis' | 'announcement' | 'news';
  priority?: 'normal' | 'urgent';
  content: string;
  imageUrl?: string | null;
  imageName?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  mediaName?: string | null;
  pinned?: boolean;
  createdAt?: string;
}) {
  const existing = db
    .prepare('SELECT * FROM signal_messages WHERE source_type = ? AND source_id = ?')
    .get(params.sourceType, params.sourceId) as Record<string, unknown> | undefined;
  if (existing) {
    return {
      message: hydrateSignalMessages([existing], null)[0],
      created: false,
    };
  }

  const adminIdentity = getDesignatedAdminIdentity();
  const authorId = params.authorId || adminIdentity?.id;
  if (!authorId) return null;

  const id = crypto.randomUUID();
  const createdAt = params.createdAt || new Date().toISOString();
  const resolvedMediaUrl = params.mediaUrl || params.imageUrl || null;
  const resolvedMediaType = params.mediaType || (params.imageUrl ? 'image' : null);
  const resolvedMediaName = params.mediaName || params.imageName || null;

  const seeds = generateSeededReactions();
  const views = generateSeededViews(seeds.love + seeds.like + seeds.fire + seeds.hundred);

  db.prepare(
    `INSERT OR IGNORE INTO signal_messages (
      id, author_id, author_name, content, image_url, image_name,
      media_url, media_type, media_name, message_type, priority, status, pinned,
      source_type, source_id, seed_love, seed_like, seed_fire, seed_hundred,
      love_count, like_count, fire_count, hundred_count, seed_views, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    authorId,
    params.authorName || adminIdentity?.name || 'MeridianFX Desk',
    params.content.trim(),
    resolvedMediaType === 'video' ? null : resolvedMediaUrl,
    resolvedMediaType === 'video' ? null : resolvedMediaName,
    resolvedMediaUrl,
    resolvedMediaType,
    resolvedMediaName,
    params.messageType,
    params.priority === 'urgent' ? 'urgent' : 'normal',
    params.pinned ? 1 : 0,
    params.sourceType,
    params.sourceId,
    seeds.love,
    seeds.like,
    seeds.fire,
    seeds.hundred,
    seeds.love,
    seeds.like,
    seeds.fire,
    seeds.hundred,
    views,
    createdAt
  );

  const row = db
    .prepare('SELECT * FROM signal_messages WHERE source_type = ? AND source_id = ?')
    .get(params.sourceType, params.sourceId) as Record<string, unknown> | undefined;
  if (!row) return null;

  const hydrated = hydrateSignalMessages([row], null)[0];
  broadcastSignalChatEvent('signals_chat:created', hydrated);
  void syncSignalMessageToRemote(String(row.id));
  return { message: hydrated, created: String(row.id) === id };
}

function mapMessageTypeToPushCategory(messageType: string): PushCategory {
  if (messageType === 'signal' || messageType === 'setup') return 'signals';
  if (messageType === 'news') return 'market_updates';
  if (messageType === 'announcement') return 'announcements';
  return 'signal_chat';
}

function buildSignalChannelPushTitle(
  messageType: string,
  priority: 'normal' | 'urgent',
  content: string
): string {
  const prefix = priority === 'urgent' ? 'URGENT · ' : '';
  const firstLine = content.split('\n')[0]?.trim() || '';
  const pairMatch = firstLine.match(/\b(BUY|SELL)?\s*([A-Z]{3,6}\/?[A-Z]{3}|XAUUSD|XAGUSD|US30|NAS100|SPX500|BTCUSD|ETHUSD)\b/i);
  if (pairMatch) {
    const headline = pairMatch[0].replace(/\s+/g, ' ').trim().toUpperCase();
    return `${prefix}MeridianFX Signal · ${headline}`;
  }
  if (messageType === 'signal' || messageType === 'setup') {
    return `${prefix}MeridianFX Signal Alert`;
  }
  return `${prefix}MeridianFX Signals`;
}

function buildSignalChannelPushPreview(
  messageType: string,
  content: string,
  mediaType: 'image' | 'video' | null,
  authorName?: string
): string {
  const label =
    messageType === 'signal'
      ? 'Signal'
      : messageType === 'setup'
        ? 'Trade Setup'
        : messageType === 'analysis'
          ? 'Chart Analysis'
          : messageType === 'news'
            ? 'News Alert'
            : messageType === 'announcement'
              ? 'Announcement'
              : 'Desk Update';
  const sender = (authorName || 'MeridianFX').trim();
  const snippet = content.replace(/\s+/g, ' ').trim();
  if (snippet) {
    return `${sender} (${label}): ${snippet.slice(0, 175)}`;
  }
  if (mediaType === 'video') {
    return `${sender} (${label}): Shared a new video briefing in Signal Channel.`;
  }
  if (mediaType === 'image') {
    return `${sender} (${label}): Shared a new chart image in Signal Channel.`;
  }
  return `${sender} (${label}): New message posted in Signal Channel.`;
}

function parseInstalledAtParam(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

app.get('/api/signals/messages', optionalAuth, (req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const requestedStatus = String(req.query.status || 'active');
  const isAdmin =
    Boolean(req.user) &&
    req.user!.role === 'admin' &&
    req.user!.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL;
  const isAdminScope =
    isAdmin && (String(req.query.scope || '') === 'admin' || String(req.query.includeAll || '') === 'true');

  if (requestedStatus === 'draft' && !isAdmin) {
    res.status(403).json({ error: 'Draft posts are restricted to administrators.' });
    return;
  }

  const status =
    requestedStatus === 'completed'
      ? 'completed'
      : requestedStatus === 'draft'
        ? 'draft'
        : 'active';

  let effectiveInstalledAt: string | null = null;
  if (!isAdminScope) {
    const clientInstalledAt =
      parseInstalledAtParam(req.query.installed_at) ||
      parseInstalledAtParam(req.headers['x-installed-at']);

    if (req.user) {
      const dbInstalled = parseInstalledAtParam(req.user.installed_at);
      if (dbInstalled) {
        effectiveInstalledAt = dbInstalled;
      } else {
        effectiveInstalledAt = clientInstalledAt || new Date().toISOString();
        db.prepare('UPDATE users SET installed_at = COALESCE(installed_at, ?) WHERE id = ?').run(
          effectiveInstalledAt,
          req.user.id
        );
      }
    } else {
      effectiveInstalledAt = clientInstalledAt || new Date().toISOString();
    }
  }

  const limitRaw = Number(req.query.limit || 40);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 40;
  const before = typeof req.query.before === 'string' && req.query.before.trim() ? req.query.before.trim() : null;
  const after = typeof req.query.after === 'string' && req.query.after.trim() ? req.query.after.trim() : null;
  const search = typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : null;

  const orderCol = status === 'completed' ? 'COALESCE(completed_at, created_at)' : 'created_at';
  const conditions: string[] = ['status = ?'];
  const params: unknown[] = [status];

  if (effectiveInstalledAt) {
    if (status === 'active') {
      // Non-welcome messages must be created at or after the user's install time
      conditions.push('COALESCE(is_welcome, 0) = 0');
    }
    conditions.push('created_at >= ?');
    params.push(effectiveInstalledAt);
  }
  if (before) {
    conditions.push(`${orderCol} < ?`);
    params.push(before);
  }
  if (after) {
    conditions.push(`${orderCol} > ?`);
    params.push(after);
  }
  if (search) {
    conditions.push('(LOWER(content) LIKE ? OR LOWER(COALESCE(completed_summary, \'\')) LIKE ?)');
    const likeTerm = `%${search.toLowerCase()}%`;
    params.push(likeTerm, likeTerm);
  }

  const rows = db
    .prepare(
      `SELECT * FROM signal_messages
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderCol} ${after ? 'ASC' : 'DESC'}
       LIMIT ?`
    )
    .all(...params, limit + 1) as Array<Record<string, unknown>>;

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  let ordered = after ? sliced : status === 'active' ? sliced.reverse() : sliced;

  // For public channel active view, always keep the single canonical Welcome Message at the top of the feed
  if (!isAdminScope && status === 'active' && !before && !after && !search) {
    const welcomeRow = db
      .prepare("SELECT * FROM signal_messages WHERE status = 'active' AND COALESCE(is_welcome, 0) = 1 LIMIT 1")
      .get() as Record<string, unknown> | undefined;
    if (welcomeRow && !ordered.some((r) => String(r.id) === String(welcomeRow.id))) {
      ordered = [welcomeRow, ...ordered];
    }
  }

  const pinnedRows =
    status === 'active'
      ? effectiveInstalledAt
        ? (db
            .prepare(
              `SELECT * FROM signal_messages
               WHERE status = 'active' AND pinned = 1
                 AND (COALESCE(is_welcome, 0) = 1 OR created_at >= ?)
               ORDER BY COALESCE(is_welcome, 0) ASC, created_at DESC
               LIMIT 5`
            )
            .all(effectiveInstalledAt) as Array<Record<string, unknown>>)
        : (db
            .prepare(
              "SELECT * FROM signal_messages WHERE status = 'active' AND pinned = 1 ORDER BY created_at DESC LIMIT 5"
            )
            .all() as Array<Record<string, unknown>>)
      : [];

  const activeCount = effectiveInstalledAt
    ? (
        db
          .prepare(
            "SELECT COUNT(*) as c FROM signal_messages WHERE status = 'active' AND (COALESCE(is_welcome, 0) = 1 OR created_at >= ?)"
          )
          .get(effectiveInstalledAt) as { c: number }
      ).c
    : (
        db.prepare("SELECT COUNT(*) as c FROM signal_messages WHERE status = 'active'").get() as {
          c: number;
        }
      ).c;

  const completedCount = effectiveInstalledAt
    ? (
        db
          .prepare(
            "SELECT COUNT(*) as c FROM signal_messages WHERE status = 'completed' AND created_at >= ?"
          )
          .get(effectiveInstalledAt) as { c: number }
      ).c
    : (
        db.prepare("SELECT COUNT(*) as c FROM signal_messages WHERE status = 'completed'").get() as {
          c: number;
        }
      ).c;

  const draftCount = isAdmin
    ? (db.prepare("SELECT COUNT(*) as c FROM signal_messages WHERE status = 'draft'").get() as { c: number }).c
    : 0;
  const subscriberCount = (
    db
      .prepare('SELECT COUNT(*) as c FROM push_subscriptions WHERE COALESCE(active, 1) = 1')
      .get() as { c: number }
  ).c;

  const actor = resolveReactionActor(req, res, true);

  res.json({
    messages: hydrateSignalMessages(ordered, actor?.actorKey),
    pinned: hydrateSignalMessages(pinnedRows, actor?.actorKey),
    has_more: hasMore,
    counts: {
      active: activeCount,
      completed: completedCount,
      draft: draftCount,
    },
    online_count: wsClients.size,
    subscriber_count: subscriberCount,
    viewer_key: actor ? hashActorKey(actor.actorKey) : null,
    installed_at: effectiveInstalledAt,
    server_time: new Date().toISOString(),
  });
});

function handleSignalsStream(req: Request, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, server_time: new Date().toISOString() })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 15_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
}

app.get('/api/signals/stream', handleSignalsStream);
app.get('/api/signals/messages/stream', handleSignalsStream);

app.get('/api/signals/messages/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const lookupId = String(req.params.id || '').trim();
  let row = db
    .prepare('SELECT * FROM signal_messages WHERE id = ? OR source_id = ? LIMIT 1')
    .get(lookupId, lookupId) as Record<string, unknown> | undefined;
  if (!row) {
    const recovered = await fetchRemoteSignalMessageById(lookupId);
    if (recovered) {
      row = db
        .prepare('SELECT * FROM signal_messages WHERE id = ? OR source_id = ? LIMIT 1')
        .get(lookupId, lookupId) as Record<string, unknown> | undefined;
    }
  }
  if (!row) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  const isAdmin =
    Boolean(req.user) &&
    req.user!.role === 'admin' &&
    req.user!.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL;
  if (String(row.status) === 'draft' && !isAdmin) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  const actor = resolveReactionActor(req, res, true);
  const hydrated = hydrateSignalMessages([row], actor?.actorKey)[0];
  res.json({ message: hydrated });
});

const signalMessageCreateSchema = z
  .object({
    content: z.string().max(8000).optional().default(''),
    image_url: z.string().max(500).optional().nullable(),
    image_name: z.string().max(250).optional().nullable(),
    media_url: z.string().max(500).optional().nullable(),
    media_type: z.enum(['image', 'video']).optional().nullable(),
    media_name: z.string().max(250).optional().nullable(),
    message_type: z
      .enum(['signal', 'setup', 'update', 'analysis', 'announcement', 'news'])
      .default('update'),
    priority: z.enum(['normal', 'urgent']).default('normal'),
    status: z.enum(['active', 'draft']).default('active'),
    pinned: z.boolean().default(false),
    send_push: z.boolean().default(true),
    client_request_id: z.string().max(80).optional(),
  })
  .refine(
    (d) => d.content.trim().length > 0 || Boolean(d.media_url) || Boolean(d.image_url),
    {
      message: 'Enter a message or attach a media file before publishing.',
    }
  );

app.post('/api/signals/messages', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  if (req.user!.email.toLowerCase() !== DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Only the designated administrator can publish signal channel messages.' });
    return;
  }
  const parsed = signalMessageCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid signal chat message.' });
    return;
  }

  const d = parsed.data;
  const trimmedContent = d.content.trim();
  const resolvedMediaUrl = d.media_url || d.image_url || null;
  const resolvedMediaType: 'image' | 'video' | null = resolvedMediaUrl
    ? d.media_type || (/\.(mp4|webm)(\?|$)/i.test(resolvedMediaUrl) ? 'video' : 'image')
    : null;
  const resolvedMediaName = d.media_name || d.image_name || null;

  const dedupKey = d.client_request_id
    ? `req:${req.user!.id}:${d.client_request_id}`
    : `msg:${req.user!.id}:${d.status}:${trimmedContent}:${resolvedMediaUrl || ''}`;
  const lastSentAt = recentSignalChatDedup.get(dedupKey);
  if (lastSentAt && Date.now() - lastSentAt < 5000) {
    res.status(409).json({ error: 'Duplicate message submission ignored.' });
    return;
  }
  recentSignalChatDedup.set(dedupKey, Date.now());
  for (const [k, ts] of recentSignalChatDedup.entries()) {
    if (Date.now() - ts > 15_000) recentSignalChatDedup.delete(k);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const initialStatus = d.status === 'draft' ? 'draft' : 'active';
  const seeds =
    initialStatus === 'active'
      ? generateSeededReactions()
      : { love: 0, like: 0, fire: 0, hundred: 0 };
  const views =
    initialStatus === 'active'
      ? generateSeededViews(seeds.love + seeds.like + seeds.fire + seeds.hundred)
      : 0;

  db.prepare(
    `INSERT INTO signal_messages (
      id, author_id, author_name, content, image_url, image_name,
      media_url, media_type, media_name, message_type, priority, status, pinned,
      seed_love, seed_like, seed_fire, seed_hundred,
      love_count, like_count, fire_count, hundred_count, seed_views, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.user!.id,
    req.user!.name,
    trimmedContent,
    resolvedMediaType === 'video' ? null : resolvedMediaUrl,
    resolvedMediaType === 'video' ? null : resolvedMediaName,
    resolvedMediaUrl,
    resolvedMediaType,
    resolvedMediaName,
    d.message_type,
    d.priority,
    initialStatus,
    initialStatus === 'active' && d.pinned ? 1 : 0,
    seeds.love,
    seeds.like,
    seeds.fire,
    seeds.hundred,
    seeds.love,
    seeds.like,
    seeds.fire,
    seeds.hundred,
    views,
    now
  );

  await syncSignalMessageToRemote(id);

  const row = db.prepare('SELECT * FROM signal_messages WHERE id = ?').get(id) as Record<string, unknown>;
  const hydrated = hydrateSignalMessages([row], `user:${req.user!.id}`)[0];

  let pushJob = null;
  if (initialStatus === 'active') {
    broadcastSignalChatEvent('signals_chat:created', hydrated);

    const preview = buildSignalChannelPushPreview(
      d.message_type,
      trimmedContent,
      resolvedMediaType,
      req.user!.name
    );
    if (d.send_push !== false) {
      const dispatchRes = await dispatchNotification({
        title: buildSignalChannelPushTitle(d.message_type, d.priority, trimmedContent),
        body: preview,
        category: mapMessageTypeToPushCategory(d.message_type),
        linkUrl: `/signals?message=${id}`,
        signalMessageId: id,
        imageUrl: resolvedMediaType === 'image' ? resolvedMediaUrl : null,
        priority: d.priority,
        publishedAt: now,
        dedupKey: `signal_message:${id}`,
        broadcastWs,
      });
      pushJob = dispatchRes.push_job;
    }
  }

  res.status(201).json({ message: hydrated, push_job: pushJob });
});

const signalMessagePatchSchema = z.object({
  content: z.string().max(8000).optional(),
  image_url: z.string().max(500).optional().nullable(),
  image_name: z.string().max(250).optional().nullable(),
  media_url: z.string().max(500).optional().nullable(),
  media_type: z.enum(['image', 'video']).optional().nullable(),
  media_name: z.string().max(250).optional().nullable(),
  message_type: z
    .enum(['signal', 'setup', 'update', 'analysis', 'announcement', 'news'])
    .optional(),
  priority: z.enum(['normal', 'urgent']).optional(),
  pinned: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'completed']).optional(),
  completed_summary: z.string().max(1000).optional().nullable(),
  send_push: z.boolean().optional(),
});

app.patch('/api/signals/messages/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  if (req.user!.email.toLowerCase() !== DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Only the designated administrator can modify signal channel messages.' });
    return;
  }
  const existing = db.prepare('SELECT * FROM signal_messages WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  const parsed = signalMessagePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid message update.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const nextContent = d.content !== undefined ? d.content.trim() : String(existing.content || '');
  const nextMediaUrl =
    d.media_url !== undefined
      ? d.media_url
      : d.image_url !== undefined
        ? d.image_url
        : ((existing.media_url || existing.image_url) as string | null);
  const nextMediaType: 'image' | 'video' | null = nextMediaUrl
    ? d.media_type !== undefined
      ? d.media_type
      : ((existing.media_type as 'image' | 'video' | null) ||
        (/\.(mp4|webm)(\?|$)/i.test(nextMediaUrl) ? 'video' : 'image'))
    : null;
  const nextMediaName =
    d.media_name !== undefined
      ? d.media_name
      : d.image_name !== undefined
        ? d.image_name
        : ((existing.media_name || existing.image_name) as string | null);

  if (!nextContent && !nextMediaUrl) {
    res.status(400).json({ error: 'Message cannot be empty without a media attachment.' });
    return;
  }

  const prevStatus = String(existing.status);
  const nextStatus = d.status ?? prevStatus;
  const publishingFromDraft = prevStatus === 'draft' && nextStatus === 'active';

  const contentEdited = d.content !== undefined && nextContent !== String(existing.content || '');
  const mediaEdited =
    (d.media_url !== undefined || d.image_url !== undefined) &&
    nextMediaUrl !== (existing.media_url || existing.image_url);
  const nextEditedAt =
    !publishingFromDraft && (contentEdited || mediaEdited) ? now : (existing.edited_at as string | null);

  let nextCompletedAt = existing.completed_at as string | null;
  let nextPinned = d.pinned !== undefined ? (d.pinned ? 1 : 0) : Number(existing.pinned || 0);
  if (nextStatus === 'completed' && prevStatus !== 'completed') {
    nextCompletedAt = now;
    nextPinned = 0;
  } else if (nextStatus === 'active' && prevStatus !== 'active') {
    nextCompletedAt = null;
  } else if (nextStatus === 'draft') {
    nextPinned = 0;
  }

  const nextCreatedAt = publishingFromDraft ? now : String(existing.created_at);
  const nextType = d.message_type ?? String(existing.message_type || 'update');
  const nextPriority = d.priority ?? (existing.priority === 'urgent' ? 'urgent' : 'normal');

  const existingSeedSum =
    Number(existing.seed_love || 0) +
    Number(existing.seed_like || 0) +
    Number(existing.seed_fire || 0) +
    Number(existing.seed_hundred || 0);
  const nextSeeds =
    publishingFromDraft && existingSeedSum === 0
      ? generateSeededReactions()
      : {
          love: Number(existing.seed_love || 0),
          like: Number(existing.seed_like || 0),
          fire: Number(existing.seed_fire || 0),
          hundred: Number(existing.seed_hundred || 0),
        };
  const nextSeedViews =
    Number(existing.seed_views || 0) > 0
      ? Number(existing.seed_views)
      : nextStatus === 'active'
        ? generateSeededViews(nextSeeds.love + nextSeeds.like + nextSeeds.fire + nextSeeds.hundred)
        : 0;

  const actorCountRows = db
    .prepare(
      `SELECT reaction, COUNT(*) as cnt
       FROM signal_message_reactions
       WHERE message_id = ?
       GROUP BY reaction`
    )
    .all(req.params.id) as Array<{ reaction: SignalReactionType; cnt: number }>;
  const actorTotals: SignalReactionsMap = {
    love: nextSeeds.love,
    like: nextSeeds.like,
    fire: nextSeeds.fire,
    hundred: nextSeeds.hundred,
  };
  for (const r of actorCountRows) {
    if (REACTION_TYPES.includes(r.reaction)) {
      actorTotals[r.reaction] += r.cnt;
    }
  }

  db.prepare(
    `UPDATE signal_messages SET
      content = ?,
      image_url = ?,
      image_name = ?,
      media_url = ?,
      media_type = ?,
      media_name = ?,
      message_type = ?,
      priority = ?,
      pinned = ?,
      status = ?,
      edited_at = ?,
      completed_at = ?,
      completed_summary = ?,
      seed_love = ?,
      seed_like = ?,
      seed_fire = ?,
      seed_hundred = ?,
      love_count = ?,
      like_count = ?,
      fire_count = ?,
      hundred_count = ?,
      seed_views = ?,
      created_at = ?
     WHERE id = ?`
  ).run(
    nextContent,
    nextMediaType === 'video' ? null : nextMediaUrl || null,
    nextMediaType === 'video' ? null : nextMediaName || null,
    nextMediaUrl || null,
    nextMediaType,
    nextMediaName || null,
    nextType,
    nextPriority,
    nextPinned,
    nextStatus,
    nextEditedAt,
    nextCompletedAt,
    d.completed_summary !== undefined ? d.completed_summary : existing.completed_summary,
    nextSeeds.love,
    nextSeeds.like,
    nextSeeds.fire,
    nextSeeds.hundred,
    actorTotals.love,
    actorTotals.like,
    actorTotals.fire,
    actorTotals.hundred,
    nextSeedViews,
    nextCreatedAt,
    req.params.id
  );

  await syncSignalMessageToRemote(String(req.params.id));

  const updatedRow = db.prepare('SELECT * FROM signal_messages WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateSignalMessages([updatedRow], `user:${req.user!.id}`)[0];

  let pushJob = null;
  if (publishingFromDraft) {
    broadcastSignalChatEvent('signals_chat:created', hydrated);
    if (d.send_push !== false) {
      const preview = buildSignalChannelPushPreview(
        nextType,
        nextContent,
        nextMediaType,
        String(existing.author_name || req.user!.name)
      );
      const dispatchRes = await dispatchNotification({
        title: buildSignalChannelPushTitle(nextType, nextPriority, nextContent),
        body: preview,
        category: mapMessageTypeToPushCategory(nextType),
        linkUrl: `/signals?message=${hydrated.id}`,
        signalMessageId: hydrated.id,
        imageUrl: nextMediaType === 'image' ? nextMediaUrl : null,
        priority: nextPriority,
        publishedAt: nextCreatedAt,
        dedupKey: `signal_message:${hydrated.id}`,
        broadcastWs,
      });
      pushJob = dispatchRes.push_job;
    }
  } else if (nextStatus !== 'draft') {
    broadcastSignalChatEvent('signals_chat:updated', hydrated);
  }

  res.json({ message: hydrated, push_job: pushJob });
});

app.delete('/api/signals/messages/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  if (req.user!.email.toLowerCase() !== DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Only the designated administrator can delete signal channel messages.' });
    return;
  }
  const info = db.prepare('DELETE FROM signal_messages WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }
  await deleteRemoteSignalMessage(String(req.params.id));
  broadcastSignalChatEvent('signals_chat:deleted', { id: req.params.id });
  res.json({ ok: true });
});

async function handleSignalMessageReaction(req: AuthRequest, res: Response): Promise<void> {
  const schema = z.object({
    reaction: z.enum(['love', 'like', 'fire', 'hundred']).nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid reaction (love, like, fire, or hundred) is required.' });
    return;
  }

  const targetId = String(req.params.id || '').trim();
  let msg = db
    .prepare(
      `SELECT id, seed_love, seed_like, seed_fire, seed_hundred
       FROM signal_messages
       WHERE id = ? OR source_id = ?
       LIMIT 1`
    )
    .get(targetId, targetId) as
    | {
        id: string;
        seed_love: number | null;
        seed_like: number | null;
        seed_fire: number | null;
        seed_hundred: number | null;
      }
    | undefined;

  if (!msg && targetId) {
    const recovered = await fetchRemoteSignalMessageById(targetId);
    if (recovered) {
      msg = db
        .prepare(
          `SELECT id, seed_love, seed_like, seed_fire, seed_hundred
           FROM signal_messages
           WHERE id = ? OR source_id = ?
           LIMIT 1`
        )
        .get(targetId, targetId) as typeof msg;
    }
  }

  if (!msg) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  const actor = resolveReactionActor(req, res, true);
  if (!actor) {
    res.status(400).json({ error: 'Unable to establish visitor session.' });
    return;
  }

  if (!checkReactionBurst(actor.actorKey, req.ip || 'unknown')) {
    res.status(429).json({ error: 'Too many reaction updates. Please wait a few seconds.' });
    return;
  }

  const reactTx = db.transaction(() => {
    const existing = db
      .prepare('SELECT reaction FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?')
      .get(msg!.id, actor.actorKey) as { reaction: SignalReactionType } | undefined;

    let nextUserReaction: SignalReactionType | null = null;
    let action: 'upsert' | 'delete' = 'upsert';
    if (parsed.data.reaction === null || (existing && existing.reaction === parsed.data.reaction)) {
      db.prepare('DELETE FROM signal_message_reactions WHERE message_id = ? AND actor_key = ?').run(
        msg!.id,
        actor.actorKey
      );
      nextUserReaction = null;
      action = 'delete';
    } else {
      db.prepare(
        `INSERT INTO signal_message_reactions (message_id, actor_key, user_id, visitor_id, reaction, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(message_id, actor_key) DO UPDATE SET
           user_id = COALESCE(excluded.user_id, signal_message_reactions.user_id),
           visitor_id = COALESCE(excluded.visitor_id, signal_message_reactions.visitor_id),
           reaction = excluded.reaction,
           created_at = excluded.created_at`
      ).run(
        msg!.id,
        actor.actorKey,
        actor.userId,
        actor.visitorId,
        parsed.data.reaction,
        new Date().toISOString()
      );
      nextUserReaction = parsed.data.reaction;
      action = 'upsert';
    }

    const counts = db
      .prepare(
        `SELECT reaction, COUNT(*) as cnt
         FROM signal_message_reactions
         WHERE message_id = ?
         GROUP BY reaction`
      )
      .all(msg!.id) as Array<{ reaction: SignalReactionType; cnt: number }>;

    const reactions: SignalReactionsMap = {
      love: Number(msg!.seed_love || 0),
      like: Number(msg!.seed_like || 0),
      fire: Number(msg!.seed_fire || 0),
      hundred: Number(msg!.seed_hundred || 0),
    };
    for (const c of counts) {
      if (REACTION_TYPES.includes(c.reaction)) {
        reactions[c.reaction] += c.cnt;
      }
    }

    // Permanently save updated reaction totals on the message row in the database
    db.prepare(
      `UPDATE signal_messages
       SET love_count = ?, like_count = ?, fire_count = ?, hundred_count = ?
       WHERE id = ?`
    ).run(reactions.love, reactions.like, reactions.fire, reactions.hundred, msg!.id);

    return { reactions, nextUserReaction, action };
  });

  const { reactions, nextUserReaction, action } = reactTx();

  await Promise.all([
    syncSignalReactionToRemote(msg.id, actor.actorKey, action),
    syncSignalMessageToRemote(msg.id),
  ]);

  const viewerKey = hashActorKey(actor.actorKey);
  broadcastSignalChatEvent('signals_chat:reacted', {
    message_id: msg.id,
    reactions,
    viewer_key: viewerKey,
    reaction: nextUserReaction,
  });

  res.json({
    message_id: msg.id,
    reactions,
    user_reaction: nextUserReaction,
    viewer_key: viewerKey,
  });
}

app.post(
  '/api/signals/messages/:id/react',
  optionalAuth,
  rateLimit(45, 60_000),
  handleSignalMessageReaction
);

app.post(
  '/api/signals/:id/react',
  optionalAuth,
  rateLimit(45, 60_000),
  handleSignalMessageReaction
);

// ---------- Legacy Structured Trading Signals (Home / Dashboard summary compatibility) ----------
function hydrateSignals(rows: Array<Record<string, unknown>>) {
  const updateStmt = db.prepare(
    'SELECT * FROM signal_updates WHERE signal_id = ? ORDER BY created_at DESC'
  );
  return rows.map((row) => ({
    ...row,
    is_premium: Boolean(row.is_premium),
    updates: updateStmt.all(String(row.id)),
  }));
}

app.get('/api/signals', optionalAuth, (req: AuthRequest, res: Response) => {
  const canViewPremium = isActivePremiumUser(req.user);
  const rows = db
    .prepare(
      canViewPremium
        ? 'SELECT * FROM signals ORDER BY created_at DESC'
        : 'SELECT * FROM signals WHERE COALESCE(is_premium, 0) = 0 ORDER BY created_at DESC'
    )
    .all() as Array<Record<string, unknown>>;
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
  is_premium: z.boolean().optional().default(false),
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
  const isPremium = Boolean(d.is_premium);

  db.prepare(
    `INSERT INTO signals (
      id, pair, direction, entry_price, stop_loss, tp1, tp2, tp3, tp4,
      risk_reward, timeframe, status, classification, analysis, chart_image_url,
      admin_remarks, is_premium, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    isPremium ? 1 : 0,
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
  if (!isPremium) {
    broadcastWs('signal:created', hydrated);
  }

  const tpList = [d.tp1, d.tp2, d.tp3, d.tp4].filter(Boolean).join(' · ');
  const mirrorText = [
    `${d.direction} ${d.pair.toUpperCase()} (${d.timeframe} · ${d.classification})`,
    `Entry: ${d.entry_price} | SL: ${d.stop_loss} | TP: ${tpList} | R:R ${d.risk_reward}`,
    d.analysis,
    d.admin_remarks ? `Note: ${d.admin_remarks}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const mirrored = !isPremium
    ? publishMirrorToSignalChannel({
        sourceType: 'signal',
        sourceId: id,
        authorId: req.user!.id,
        authorName: req.user!.name,
        messageType: 'signal',
        content: mirrorText,
        imageUrl: d.chart_image_url || null,
        imageName: d.chart_image_url ? `${d.pair.toUpperCase()} chart` : null,
        createdAt: now,
      })
    : null;

  const targetUrl = isPremium
    ? '/dashboard'
    : mirrored
      ? `/signals?message=${mirrored.message.id}`
      : '/signals';
  let pushJob = null;
  if (d.send_push !== false) {
    const dispatchRes = await dispatchNotification({
      title: `${isPremium ? '[Premium] ' : ''}${d.direction} ${d.pair.toUpperCase()} · ${d.entry_price}`,
      body: `Entry ${d.entry_price} · SL ${d.stop_loss} · TP1 ${d.tp1} (${d.timeframe} · ${d.classification})`,
      category: 'signals',
      linkUrl: targetUrl,
      signalMessageId: mirrored?.message.id || null,
      imageUrl: d.chart_image_url || null,
      targetGroup: isPremium ? 'registered' : 'all',
      publishedAt: now,
      dedupKey: `signal:${id}`,
      broadcastWs,
    });
    pushJob = dispatchRes.push_job;
  }

  res.status(201).json({
    signal: hydrated,
    signal_message: mirrored?.message || null,
    push_job: pushJob,
  });
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
  const nextIsPremium = d.is_premium !== undefined ? Boolean(d.is_premium) : Boolean(existing.is_premium);

  db.prepare(
    `UPDATE signals SET
      pair = ?, direction = ?, entry_price = ?, stop_loss = ?,
      tp1 = ?, tp2 = ?, tp3 = ?, tp4 = ?, risk_reward = ?, timeframe = ?,
      status = ?, classification = ?, analysis = ?, chart_image_url = ?,
      admin_remarks = ?, is_premium = ?, updated_at = ?
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
    nextIsPremium ? 1 : 0,
    now,
    req.params.id
  );

  let pushJob = null;
  let mirroredMsg = null;

  const statusChanged = Boolean(d.status && d.status !== existing.status);
  const levelsOrNotesChanged = Boolean(
    (d.stop_loss && d.stop_loss !== existing.stop_loss) ||
      (d.entry_price && d.entry_price !== existing.entry_price) ||
      (d.tp1 && d.tp1 !== existing.tp1) ||
      (d.admin_remarks && d.admin_remarks !== existing.admin_remarks)
  );

  if (statusChanged || (d.send_push === true && levelsOrNotesChanged)) {
    const signalUpdateId = crypto.randomUUID();
    const noteText = statusChanged
      ? `Status updated to ${nextStatus}.${d.admin_remarks ? ` ${d.admin_remarks}` : ''}`
      : `Trade parameters updated (Entry ${d.entry_price ?? existing.entry_price} · SL ${d.stop_loss ?? existing.stop_loss} · TP1 ${d.tp1 ?? existing.tp1}).${d.admin_remarks ? ` ${d.admin_remarks}` : ''}`;
    db.prepare(
      `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(signalUpdateId, req.params.id, noteText, nextStatus, req.user!.name, now);

    const mirrored = !nextIsPremium
      ? publishMirrorToSignalChannel({
          sourceType: 'signal_update',
          sourceId: signalUpdateId,
          authorId: req.user!.id,
          authorName: req.user!.name,
          messageType: 'update',
          content: `${nextPair} Signal Update (${nextStatus}): ${noteText}`,
          createdAt: now,
        })
      : null;
    mirroredMsg = mirrored?.message || null;

    if (d.send_push !== false) {
      const dispatchRes = await dispatchNotification({
        title: `${nextIsPremium ? '[Premium] ' : ''}${nextPair} Signal · ${nextStatus}`,
        body:
          d.admin_remarks ||
          (statusChanged
            ? `${nextPair} status changed from ${String(existing.status)} to ${nextStatus}.`
            : noteText),
        category: 'signal_updates',
        linkUrl: nextIsPremium
          ? '/dashboard'
          : mirrored
            ? `/signals?message=${mirrored.message.id}`
            : '/signals',
        signalMessageId: mirrored?.message.id || null,
        targetGroup: nextIsPremium ? 'registered' : 'all',
        publishedAt: now,
        dedupKey: `signal_update:${signalUpdateId}`,
        broadcastWs,
      });
      pushJob = dispatchRes.push_job;
    }
  }

  const updatedRow = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateSignals([updatedRow])[0];
  if (!nextIsPremium) {
    broadcastWs('signal:updated', hydrated);
  }

  res.json({ signal: hydrated, signal_message: mirroredMsg, push_job: pushJob });
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
  const isPremium = Boolean(existing.is_premium);
  const signalUpdateId = crypto.randomUUID();

  db.prepare('UPDATE signals SET status = ?, admin_remarks = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    parsed.data.note,
    now,
    req.params.id
  );
  db.prepare(
    `INSERT INTO signal_updates (id, signal_id, note, status_snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(signalUpdateId, req.params.id, parsed.data.note, nextStatus, req.user!.name, now);

  const updatedRow = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateSignals([updatedRow])[0];
  if (!isPremium) {
    broadcastWs('signal:updated', hydrated);
  }

  const mirrored = !isPremium
    ? publishMirrorToSignalChannel({
        sourceType: 'signal_update',
        sourceId: signalUpdateId,
        authorId: req.user!.id,
        authorName: req.user!.name,
        messageType: 'update',
        content: `${String(existing.pair)} Update (${nextStatus}): ${parsed.data.note}`,
        createdAt: now,
      })
    : null;

  let pushJob = null;
  if (parsed.data.send_push !== false) {
    const dispatchRes = await dispatchNotification({
      title: `${isPremium ? '[Premium] ' : ''}${String(existing.pair)} Signal · ${nextStatus}`,
      body: parsed.data.note,
      category: 'signal_updates',
      linkUrl: isPremium
        ? '/dashboard'
        : mirrored
          ? `/signals?message=${mirrored.message.id}`
          : '/signals',
      signalMessageId: mirrored?.message.id || null,
      targetGroup: isPremium ? 'registered' : 'all',
      publishedAt: now,
      dedupKey: `signal_update:${signalUpdateId}`,
      broadcastWs,
    });
    pushJob = dispatchRes.push_job;
  }

  res.status(201).json({
    signal: hydrated,
    signal_message: mirrored?.message || null,
    push_job: pushJob,
  });
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
    is_premium: Boolean(row.is_premium),
    reactions: reactMap.get(String(row.id)) || {},
    user_reacted: userReactSet.get(String(row.id)) || [],
    bookmarked: userBookmarkSet.has(String(row.id)),
  }));
}

app.get('/api/updates', optionalAuth, (req: AuthRequest, res: Response) => {
  const includeUnpublished = req.user?.role === 'admin' && req.query.includeAll === 'true';
  const canViewPremium = isActivePremiumUser(req.user);
  let sql = 'SELECT * FROM market_updates WHERE 1=1';
  if (!includeUnpublished) sql += ' AND published = 1';
  if (!canViewPremium) sql += ' AND COALESCE(is_premium, 0) = 0';
  sql += ' ORDER BY pinned DESC, created_at DESC';
  const rows = db.prepare(sql).all() as Array<Record<string, unknown>>;
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
  is_premium: z.boolean().optional().default(false),
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
  const isPremium = Boolean(d.is_premium);

  db.prepare(
    `INSERT INTO market_updates (
      id, title, content, category, pinned, is_premium, image_url, video_url, attachment_url,
      attachment_name, external_link, scheduled_at, published, author_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    d.title,
    d.content,
    d.category,
    d.pinned ? 1 : 0,
    isPremium ? 1 : 0,
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

  await syncMarketUpdateToRemote(id);

  let pushJob = null;
  let mirroredMsg = null;

  if (published === 1) {
    if (!isPremium) {
      broadcastWs('update:created', hydrated);
    }
    const isAnnouncement =
      d.category === 'Platform Announcement' || d.category === 'Risk Warning';
    const mirrorContent = [
      `${d.category}: ${d.title}`,
      d.content,
      d.external_link ? `Reference: ${d.external_link}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const mirrored = !isPremium
      ? publishMirrorToSignalChannel({
          sourceType: 'market_update',
          sourceId: id,
          authorId: req.user!.id,
          authorName: req.user!.name,
          messageType: isAnnouncement ? 'announcement' : 'update',
          content: mirrorContent,
          imageUrl: d.image_url || null,
          imageName: d.title,
          pinned: Boolean(d.pinned),
          createdAt: now,
        })
      : null;
    mirroredMsg = mirrored?.message || null;

    if (d.send_push !== false) {
      const dispatchRes = await dispatchNotification({
        title: `${isPremium ? '[Premium] ' : ''}${d.category}: ${d.title}`,
        body: d.content.slice(0, 140),
        category: isAnnouncement ? 'announcements' : 'market_updates',
        linkUrl: '/updates',
        signalMessageId: mirrored?.message.id || null,
        imageUrl: d.image_url || null,
        targetGroup: isPremium ? 'registered' : 'all',
        publishedAt: now,
        dedupKey: `market_update:${id}`,
        broadcastWs,
      });
      pushJob = dispatchRes.push_job;
    }
  }

  res.status(201).json({
    update: hydrated,
    signal_message: mirroredMsg,
    push_job: pushJob,
  });
});

app.patch('/api/updates/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
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
  const nextIsPremium = d.is_premium !== undefined ? Boolean(d.is_premium) : Boolean(existing.is_premium);
  const wasPublished = Boolean(existing.published);
  const nextScheduledAt =
    d.scheduled_at !== undefined ? d.scheduled_at || null : (existing.scheduled_at as string | null);
  const stillScheduledFuture = Boolean(
    nextScheduledAt && new Date(nextScheduledAt).getTime() > Date.now()
  );
  const nextPublished = wasPublished ? 1 : stillScheduledFuture ? 0 : 1;

  db.prepare(
    `UPDATE market_updates SET
      title = ?, content = ?, category = ?, pinned = ?, is_premium = ?, image_url = ?,
      video_url = ?, attachment_url = ?, attachment_name = ?, external_link = ?,
      scheduled_at = ?, published = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    d.title ?? existing.title,
    d.content ?? existing.content,
    d.category ?? existing.category,
    d.pinned !== undefined ? (d.pinned ? 1 : 0) : existing.pinned,
    nextIsPremium ? 1 : 0,
    d.image_url !== undefined ? d.image_url : existing.image_url,
    d.video_url !== undefined ? d.video_url : existing.video_url,
    d.attachment_url !== undefined ? d.attachment_url : existing.attachment_url,
    d.attachment_name !== undefined ? d.attachment_name : existing.attachment_name,
    d.external_link !== undefined ? d.external_link : existing.external_link,
    nextScheduledAt,
    nextPublished,
    now,
    req.params.id
  );

  await syncMarketUpdateToRemote(String(req.params.id));

  const row = db.prepare('SELECT * FROM market_updates WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  const hydrated = hydrateUpdates([row], req.user!.id)[0];

  if (!wasPublished && nextPublished === 1) {
    if (!nextIsPremium) {
      broadcastWs('update:created', hydrated);
    }
    const nextCategory = String(row.category || 'Forex Update');
    const nextTitle = String(row.title || '');
    const nextContent = String(row.content || '');
    const nextExternalLink = row.external_link ? String(row.external_link) : null;
    const nextImageUrl = row.image_url ? String(row.image_url) : null;
    const isAnnouncement =
      nextCategory === 'Platform Announcement' || nextCategory === 'Risk Warning';
    const mirrorContent = [
      `${nextCategory}: ${nextTitle}`,
      nextContent,
      nextExternalLink ? `Reference: ${nextExternalLink}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const mirrored = !nextIsPremium
      ? publishMirrorToSignalChannel({
          sourceType: 'market_update',
          sourceId: String(req.params.id),
          authorId: req.user!.id,
          authorName: req.user!.name,
          messageType: isAnnouncement ? 'announcement' : 'update',
          content: mirrorContent,
          imageUrl: nextImageUrl,
          imageName: nextTitle,
          pinned: Boolean(row.pinned),
          createdAt: now,
        })
      : null;

    if (d.send_push !== false) {
      await dispatchNotification({
        title: `${nextIsPremium ? '[Premium] ' : ''}${nextCategory}: ${nextTitle}`,
        body: nextContent.slice(0, 140),
        category: isAnnouncement ? 'announcements' : 'market_updates',
        linkUrl: '/updates',
        signalMessageId: mirrored?.message.id || null,
        imageUrl: nextImageUrl,
        targetGroup: nextIsPremium ? 'registered' : 'all',
        publishedAt: now,
        dedupKey: `market_update:${String(req.params.id)}`,
        broadcastWs,
      });
    }
  } else if (!nextIsPremium) {
    broadcastWs('update:updated', hydrated);
  }
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
function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function logAcademyAudit(
  actorId: string,
  actorName: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string
): void {
  try {
    db.prepare(
      `INSERT INTO academy_audit_logs (id, actor_id, actor_name, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(crypto.randomUUID(), actorId, actorName, action, targetType, targetId, details.slice(0, 600), new Date().toISOString());
  } catch {
    // non-fatal audit log write
  }
}

app.get('/api/academy/courses', optionalAuth, (req: AuthRequest, res: Response) => {
  const includeAll = req.user?.role === 'admin' && req.query.includeAll === 'true';
  const canViewPremium = isActivePremiumUser(req.user);

  let courseSql = 'SELECT * FROM courses WHERE 1=1';
  if (!includeAll) courseSql += " AND status = 'published'";
  if (!canViewPremium) courseSql += ' AND COALESCE(is_premium, 0) = 0';
  courseSql += ' ORDER BY COALESCE(course_number, 999) ASC, created_at ASC';

  let lessonSql = 'SELECT * FROM lessons WHERE 1=1';
  if (!includeAll) lessonSql += " AND status = 'published'";
  if (!canViewPremium) lessonSql += ' AND COALESCE(is_premium, 0) = 0';
  lessonSql += ' ORDER BY order_index ASC, created_at ASC';

  const courseRows = db.prepare(courseSql).all() as Array<Record<string, unknown>>;
  const lessonRows = db.prepare(lessonSql).all() as Array<Record<string, unknown>>;

  const enrollMap = new Map<string, string | null>();
  const progressMap = new Map<
    string,
    {
      completed: boolean;
      bookmarked: boolean;
      quiz_score: number | null;
      scroll_pct: number;
      needs_review: boolean;
      needs_review_note: string | null;
    }
  >();
  const assessmentMap = new Map<
    string,
    {
      best_score: number;
      passed: boolean;
      attempts: number;
      completed_at: string | null;
      certificate_id: string | null;
    }
  >();
  let resumeState: {
    last_course_id: string | null;
    last_lesson_id: string | null;
    last_scroll_pct: number;
    flashcard_progress: Record<string, 'mastered' | 'review'>;
    updated_at: string | null;
  } | null = null;

  if (req.user) {
    const enrolls = db
      .prepare('SELECT course_id, last_lesson_id FROM enrollments WHERE user_id = ?')
      .all(req.user.id) as Array<{ course_id: string; last_lesson_id: string | null }>;
    for (const e of enrolls) enrollMap.set(e.course_id, e.last_lesson_id);

    const progs = db
      .prepare(
        'SELECT lesson_id, completed, bookmarked, quiz_score, scroll_pct, needs_review, needs_review_note FROM lesson_progress WHERE user_id = ?'
      )
      .all(req.user.id) as Array<{
      lesson_id: string;
      completed: number;
      bookmarked: number;
      quiz_score: number | null;
      scroll_pct: number | null;
      needs_review: number | null;
      needs_review_note: string | null;
    }>;
    for (const p of progs) {
      progressMap.set(p.lesson_id, {
        completed: Boolean(p.completed),
        bookmarked: Boolean(p.bookmarked),
        quiz_score: p.quiz_score,
        scroll_pct: p.scroll_pct ?? 0,
        needs_review: Boolean(p.needs_review),
        needs_review_note: p.needs_review_note || null,
      });
    }

    const assessRows = db
      .prepare('SELECT course_id, best_score, passed, attempts, completed_at, certificate_id FROM course_assessments WHERE user_id = ?')
      .all(req.user.id) as Array<{
      course_id: string;
      best_score: number;
      passed: number;
      attempts: number;
      completed_at: string | null;
      certificate_id: string | null;
    }>;
    for (const a of assessRows) {
      assessmentMap.set(a.course_id, {
        best_score: a.best_score,
        passed: Boolean(a.passed),
        attempts: a.attempts,
        completed_at: a.completed_at,
        certificate_id: a.certificate_id,
      });
    }

    const st = db
      .prepare('SELECT * FROM user_academy_state WHERE user_id = ?')
      .get(req.user.id) as
      | {
          last_course_id: string | null;
          last_lesson_id: string | null;
          last_scroll_pct: number;
          flashcard_progress_json: string;
          updated_at: string;
        }
      | undefined;
    if (st) {
      resumeState = {
        last_course_id: st.last_course_id,
        last_lesson_id: st.last_lesson_id,
        last_scroll_pct: st.last_scroll_pct || 0,
        flashcard_progress: safeJsonParse(st.flashcard_progress_json, {}),
        updated_at: st.updated_at,
      };
    }
  }

  const courses = courseRows.map((c) => {
    const courseLessons = lessonRows
      .filter((l) => l.course_id === c.id)
      .map((l) => {
        const prog = progressMap.get(String(l.id));
        return {
          ...l,
          status: (l.status as string) || 'published',
          is_premium: Boolean(l.is_premium),
          common_mistakes: safeJsonParse<string[]>(l.common_mistakes_json, []),
          practical_exercise: safeJsonParse(l.practical_exercise_json, null),
          sources: safeJsonParse(l.sources_json, []),
          tags: safeJsonParse<string[]>(l.tags_json, []),
          quiz: safeJsonParse(l.quiz_json, []),
          completed: prog?.completed || false,
          bookmarked: prog?.bookmarked || false,
          quiz_score: prog?.quiz_score ?? null,
          scroll_pct: prog?.scroll_pct ?? 0,
          needs_review: prog?.needs_review || false,
          needs_review_note: prog?.needs_review_note || null,
        };
      });

    return {
      ...c,
      status: (c.status as string) || 'published',
      is_premium: Boolean(c.is_premium),
      learning_outcomes: safeJsonParse<string[]>(c.learning_outcomes_json, []),
      assessment: safeJsonParse(c.assessment_json, []),
      assessment_record: assessmentMap.get(String(c.id)) || null,
      enrolled: enrollMap.has(String(c.id)),
      last_lesson_id: enrollMap.get(String(c.id)) || null,
      total_lessons: courseLessons.filter((l) => l.status === 'published').length || courseLessons.length,
      completed_lessons: courseLessons.filter((l) => l.completed).length,
      lessons: courseLessons,
    };
  });

  res.json({ courses, resume_state: resumeState });
});

app.put('/api/academy/resume', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    last_course_id: z.string().nullable().optional(),
    last_lesson_id: z.string().nullable().optional(),
    last_scroll_pct: z.number().int().min(0).max(100).default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid resume state payload.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO user_academy_state (user_id, last_course_id, last_lesson_id, last_scroll_pct, flashcard_progress_json, updated_at)
     VALUES (?, ?, ?, ?, '{}', ?)
     ON CONFLICT(user_id) DO UPDATE SET
       last_course_id = COALESCE(excluded.last_course_id, user_academy_state.last_course_id),
       last_lesson_id = COALESCE(excluded.last_lesson_id, user_academy_state.last_lesson_id),
       last_scroll_pct = excluded.last_scroll_pct,
       updated_at = excluded.updated_at`
  ).run(
    req.user!.id,
    parsed.data.last_course_id ?? null,
    parsed.data.last_lesson_id ?? null,
    parsed.data.last_scroll_pct,
    now
  );

  if (parsed.data.last_lesson_id && parsed.data.last_scroll_pct > 0) {
    db.prepare(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, bookmarked, scroll_pct, updated_at)
       VALUES (?, ?, 0, 0, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         scroll_pct = MAX(lesson_progress.scroll_pct, excluded.scroll_pct),
         updated_at = excluded.updated_at`
    ).run(req.user!.id, parsed.data.last_lesson_id, parsed.data.last_scroll_pct, now);
  }

  res.json({ ok: true });
});

app.post('/api/academy/flashcards/progress', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    card_id: z.string().min(1).max(80),
    status: z.enum(['mastered', 'review']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid flashcard progress payload.' });
    return;
  }

  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT flashcard_progress_json FROM user_academy_state WHERE user_id = ?')
    .get(req.user!.id) as { flashcard_progress_json: string } | undefined;

  const progress = safeJsonParse<Record<string, 'mastered' | 'review'>>(
    existing?.flashcard_progress_json,
    {}
  );
  progress[parsed.data.card_id] = parsed.data.status;

  db.prepare(
    `INSERT INTO user_academy_state (user_id, flashcard_progress_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       flashcard_progress_json = excluded.flashcard_progress_json,
       updated_at = excluded.updated_at`
  ).run(req.user!.id, JSON.stringify(progress), now);

  res.json({ ok: true, flashcard_progress: progress });
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
    scroll_pct: z.number().int().min(0).max(100).optional(),
    clear_review: z.boolean().optional(),
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
    | {
        completed: number;
        bookmarked: number;
        quiz_score: number | null;
        scroll_pct: number | null;
        needs_review: number | null;
      }
    | undefined;

  let quizScore = existing?.quiz_score ?? null;
  if (parsed.data.quiz_answers) {
    const questions = safeJsonParse<Array<{ correct_index: number }>>(lesson.quiz_json, []);
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
  const scrollPct = parsed.data.scroll_pct !== undefined ? parsed.data.scroll_pct : existing?.scroll_pct ?? 0;
  const needsReview = parsed.data.clear_review || parsed.data.completed ? 0 : existing?.needs_review ?? 0;

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, bookmarked, quiz_score, scroll_pct, needs_review, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       completed = excluded.completed,
       bookmarked = excluded.bookmarked,
       quiz_score = excluded.quiz_score,
       scroll_pct = MAX(lesson_progress.scroll_pct, excluded.scroll_pct),
       needs_review = excluded.needs_review,
       updated_at = excluded.updated_at`
  ).run(req.user!.id, req.params.id, completed, bookmarked, quizScore, scrollPct, needsReview, now);

  // Auto-enroll & save resume checkpoint
  db.prepare(
    `INSERT INTO enrollments (user_id, course_id, enrolled_at, last_lesson_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET last_lesson_id = excluded.last_lesson_id`
  ).run(req.user!.id, String(lesson.course_id), now, req.params.id);

  db.prepare(
    `INSERT INTO user_academy_state (user_id, last_course_id, last_lesson_id, last_scroll_pct, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       last_course_id = excluded.last_course_id,
       last_lesson_id = excluded.last_lesson_id,
       last_scroll_pct = excluded.last_scroll_pct,
       updated_at = excluded.updated_at`
  ).run(req.user!.id, String(lesson.course_id), req.params.id, scrollPct, now);

  res.json({
    ok: true,
    completed: Boolean(completed),
    bookmarked: Boolean(bookmarked),
    quiz_score: quizScore,
    scroll_pct: scrollPct,
    needs_review: Boolean(needsReview),
  });
});

app.post('/api/academy/courses/:id/assessment', requireAuth, (req: AuthRequest, res: Response) => {
  const schema = z.object({
    answers: z.array(z.number().int()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assessment submission.' });
    return;
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const questions = safeJsonParse<Array<{ id: string; correct_index: number; explanation?: string }>>(
    course.assessment_json,
    []
  );
  if (questions.length === 0) {
    res.status(400).json({ error: 'No assessment questions configured for this course.' });
    return;
  }

  let correct = 0;
  const breakdown = questions.map((q, idx) => {
    const picked = parsed.data.answers[idx];
    const isCorrect = picked === q.correct_index;
    if (isCorrect) correct++;
    return {
      question_id: q.id,
      correct_index: q.correct_index,
      picked_index: picked,
      is_correct: isCorrect,
      explanation: q.explanation || '',
    };
  });
  const score = Math.round((correct / questions.length) * 100);
  const passedScore = score >= 70;

  const totalPublishedLessons = (
    db.prepare("SELECT COUNT(*) as c FROM lessons WHERE course_id = ? AND status = 'published'").get(req.params.id) as {
      c: number;
    }
  ).c;
  const completedLessons = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM lesson_progress lp
         JOIN lessons l ON lp.lesson_id = l.id
         WHERE lp.user_id = ? AND l.course_id = ? AND l.status = 'published' AND lp.completed = 1`
      )
      .get(req.user!.id, req.params.id) as { c: number }
  ).c;

  const allLessonsCompleted = totalPublishedLessons === 0 || completedLessons >= totalPublishedLessons;
  const passed = passedScore && allLessonsCompleted;

  const existing = db
    .prepare('SELECT * FROM course_assessments WHERE user_id = ? AND course_id = ?')
    .get(req.user!.id, req.params.id) as
    | {
        best_score: number;
        passed: number;
        attempts: number;
        completed_at: string | null;
        certificate_id: string | null;
      }
    | undefined;

  const now = new Date().toISOString();
  const nextBest = Math.max(existing?.best_score ?? 0, score);
  const nextPassed = existing?.passed === 1 || passed ? 1 : 0;
  const certId =
    existing?.certificate_id ||
    (nextPassed === 1 ? `MFX-EDU-${String(course.course_number || 'C').padStart(2, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null);
  const completedAt = existing?.completed_at || (nextPassed === 1 ? now : null);

  db.prepare(
    `INSERT INTO course_assessments (user_id, course_id, best_score, passed, attempts, completed_at, certificate_id)
     VALUES (?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET
       best_score = excluded.best_score,
       passed = excluded.passed,
       attempts = course_assessments.attempts + 1,
       completed_at = COALESCE(course_assessments.completed_at, excluded.completed_at),
       certificate_id = COALESCE(course_assessments.certificate_id, excluded.certificate_id)`
  ).run(req.user!.id, req.params.id, nextBest, nextPassed, completedAt, certId);

  logUserActivity(
    req.user!.id,
    'Course Assessment Attempted',
    `Scored ${score}% on ${String(course.title)} (${passed ? 'Passed' : 'Review'})`,
    req.ip
  );

  res.json({
    score,
    correct,
    total: questions.length,
    passed_score: passedScore,
    all_lessons_completed: allLessonsCompleted,
    passed: Boolean(nextPassed),
    certificate_id: certId,
    breakdown,
  });
});

app.post('/api/academy/lessons/:id/report', optionalAuth, rateLimit(10, 60_000), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    reason: z.string().trim().min(5).max(1000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please describe the issue (at least 5 characters).' });
    return;
  }

  const lesson = db.prepare('SELECT id, title FROM lessons WHERE id = ?').get(req.params.id) as
    | { id: string; title: string }
    | undefined;
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  db.prepare(
    `INSERT INTO academy_content_reports (id, user_id, reporter_name, lesson_id, lesson_title, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`
  ).run(
    crypto.randomUUID(),
    req.user?.id || null,
    req.user?.name || 'Academy Learner',
    lesson.id,
    lesson.title,
    parsed.data.reason,
    new Date().toISOString()
  );

  res.status(201).json({ ok: true });
});

app.post('/api/academy/courses', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
    category: z.string().trim().min(2).max(80),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    level_label: z.string().max(80).optional(),
    prerequisites: z.string().max(400).optional(),
    learning_outcomes: z.array(z.string()).optional(),
    estimated_hours: z.number().min(0.5).max(100).optional(),
    status: z.enum(['draft', 'published', 'unpublished', 'archived', 'scheduled']).default('published'),
    is_premium: z.boolean().optional().default(false),
    cover_image_url: z.string().max(400).optional().nullable(),
    assessment: z
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
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid course data.' });
    return;
  }

  const maxNum = (
    db.prepare('SELECT COALESCE(MAX(course_number), 0) as m FROM courses').get() as { m: number }
  ).m;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const slug = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  db.prepare(
    `INSERT INTO courses (
      id, slug, course_number, title, description, category, level, level_label,
      prerequisites, learning_outcomes_json, estimated_hours, status, is_premium, assessment_json,
      cover_image_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    slug,
    maxNum + 1,
    parsed.data.title,
    parsed.data.description,
    parsed.data.category,
    parsed.data.level,
    parsed.data.level_label || parsed.data.level,
    parsed.data.prerequisites || 'None',
    JSON.stringify(parsed.data.learning_outcomes || []),
    parsed.data.estimated_hours ?? 3.0,
    parsed.data.status,
    parsed.data.is_premium ? 1 : 0,
    JSON.stringify(parsed.data.assessment || []),
    parsed.data.cover_image_url || '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    now,
    now
  );

  logAcademyAudit(req.user!.id, req.user!.name, 'Course Created', 'course', id, parsed.data.title);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  broadcastWs('academy:updated', { type: 'course', id });
  res.status(201).json({ course });
});

app.patch('/api/academy/courses/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const schema = z.object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    category: z.string().trim().min(2).max(80).optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    level_label: z.string().max(80).optional(),
    prerequisites: z.string().max(400).optional(),
    learning_outcomes: z.array(z.string()).optional(),
    estimated_hours: z.number().min(0.5).max(100).optional(),
    status: z.enum(['draft', 'published', 'unpublished', 'archived', 'scheduled']).optional(),
    is_premium: z.boolean().optional(),
    cover_image_url: z.string().max(400).optional().nullable(),
    assessment: z
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
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid course update payload.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE courses SET
      title = ?, description = ?, category = ?, level = ?, level_label = ?,
      prerequisites = ?, learning_outcomes_json = ?, estimated_hours = ?, status = ?, is_premium = ?,
      assessment_json = ?, cover_image_url = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    d.title ?? existing.title,
    d.description ?? existing.description,
    d.category ?? existing.category,
    d.level ?? existing.level,
    d.level_label ?? existing.level_label,
    d.prerequisites ?? existing.prerequisites,
    d.learning_outcomes ? JSON.stringify(d.learning_outcomes) : existing.learning_outcomes_json,
    d.estimated_hours ?? existing.estimated_hours,
    d.status ?? existing.status,
    d.is_premium !== undefined ? (d.is_premium ? 1 : 0) : existing.is_premium,
    d.assessment ? JSON.stringify(d.assessment) : existing.assessment_json,
    d.cover_image_url !== undefined ? d.cover_image_url : existing.cover_image_url,
    now,
    req.params.id
  );

  logAcademyAudit(req.user!.id, req.user!.name, 'Course Updated', 'course', req.params.id, String(d.title ?? existing.title));
  broadcastWs('academy:updated', { type: 'course_updated', id: req.params.id });
  res.json({ ok: true });
});

app.delete('/api/academy/courses/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  logAcademyAudit(req.user!.id, req.user!.name, 'Course Deleted', 'course', req.params.id, 'Removed course');
  broadcastWs('academy:updated', { type: 'course_deleted', id: req.params.id });
  res.json({ ok: true });
});

const lessonInputSchema = z.object({
  course_id: z.string().min(1),
  title: z.string().trim().min(3).max(180),
  category: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(5).max(800),
  learning_objective: z.string().max(600).optional(),
  introduction: z.string().max(3000).optional(),
  content: z.string().trim().min(10).max(30000),
  demonstration: z.string().max(6000).optional(),
  common_mistakes: z.array(z.string()).optional(),
  summary_recap: z.string().max(2000).optional(),
  practical_exercise: z
    .object({
      title: z.string(),
      objective: z.string(),
      steps: z.array(z.string()),
      deliverable: z.string(),
    })
    .nullable()
    .optional(),
  visual_key: z.string().max(120).optional().nullable(),
  video_url: z.string().max(500).optional().nullable(),
  audio_url: z.string().max(500).optional().nullable(),
  transcript: z.string().max(20000).optional().nullable(),
  pdf_url: z.string().max(500).optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
  duration_minutes: z.number().int().min(1).max(240).default(15),
  order_index: z.number().int().min(1).default(1),
  status: z.enum(['draft', 'published', 'unpublished', 'archived', 'scheduled']).default('published'),
  is_premium: z.boolean().optional().default(false),
  scheduled_at: z.string().optional().nullable(),
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

app.post('/api/academy/lessons', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const parsed = lessonInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson payload.' });
    return;
  }

  const d = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt = d.status === 'published' ? now : null;

  db.prepare(
    `INSERT INTO lessons (
      id, course_id, title, category, summary, learning_objective, introduction, content,
      demonstration, common_mistakes_json, summary_recap, practical_exercise_json,
      visual_key, video_url, audio_url, transcript, pdf_url, image_url, sources_json, tags_json,
      duration_minutes, order_index, status, is_premium, scheduled_at, published_at, updated_at, material_version,
      quiz_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(
    id,
    d.course_id,
    d.title,
    d.category,
    d.summary,
    d.learning_objective || null,
    d.introduction || null,
    d.content,
    d.demonstration || null,
    JSON.stringify(d.common_mistakes || []),
    d.summary_recap || null,
    d.practical_exercise ? JSON.stringify(d.practical_exercise) : null,
    d.visual_key || null,
    d.video_url || null,
    d.audio_url || null,
    d.transcript || null,
    d.pdf_url || null,
    d.image_url || null,
    JSON.stringify(d.sources || []),
    JSON.stringify(d.tags || []),
    d.duration_minutes,
    d.order_index,
    d.status,
    d.is_premium ? 1 : 0,
    d.scheduled_at || null,
    publishedAt,
    now,
    JSON.stringify(d.quiz || []),
    now
  );

  db.prepare(
    `INSERT INTO lesson_versions (id, lesson_id, version_number, title, content, changed_by, change_note, created_at)
     VALUES (?, ?, 1, ?, ?, ?, 'Initial lesson creation', ?)`
  ).run(crypto.randomUUID(), id, d.title, d.content, req.user!.name, now);

  logAcademyAudit(req.user!.id, req.user!.name, 'Lesson Created', 'lesson', id, `${d.title} (${d.status})`);
  broadcastWs('academy:updated', { type: 'lesson', id });

  const parentCourse = db
    .prepare('SELECT is_premium FROM courses WHERE id = ?')
    .get(d.course_id) as { is_premium?: number } | undefined;
  const lessonIsPremium = Boolean(d.is_premium) || Boolean(parentCourse?.is_premium);

  if (d.status === 'published' && d.send_push !== false) {
    await dispatchNotification({
      title: `${lessonIsPremium ? '[Premium] ' : ''}New Academy Lesson: ${d.title}`,
      body: `${d.category} · ${d.duration_minutes} min study module published.`,
      category: 'academy',
      linkUrl: '/academy',
      targetGroup: lessonIsPremium ? 'registered' : 'all',
      broadcastWs,
    });
  }

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
  res.status(201).json({ lesson });
});

app.patch('/api/academy/lessons/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  const updateSchema = lessonInputSchema.partial().extend({
    material_update: z.boolean().optional(),
    change_note: z.string().max(400).optional(),
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson update payload.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const nextVersion = Number(existing.material_version || 1) + 1;
  const nextStatus = d.status ?? String(existing.status || 'published');
  const nextPublishedAt =
    nextStatus === 'published' && !existing.published_at ? now : existing.published_at;
  const nextIsPremium = d.is_premium !== undefined ? Boolean(d.is_premium) : Boolean(existing.is_premium);

  db.prepare(
    `UPDATE lessons SET
      course_id = ?, title = ?, category = ?, summary = ?, learning_objective = ?,
      introduction = ?, content = ?, demonstration = ?, common_mistakes_json = ?,
      summary_recap = ?, practical_exercise_json = ?, visual_key = ?, video_url = ?,
      audio_url = ?, transcript = ?, pdf_url = ?, image_url = ?, sources_json = ?,
      tags_json = ?, duration_minutes = ?, order_index = ?, status = ?, is_premium = ?, scheduled_at = ?,
      published_at = ?, updated_at = ?, material_version = ?, quiz_json = ?
     WHERE id = ?`
  ).run(
    d.course_id ?? existing.course_id,
    d.title ?? existing.title,
    d.category ?? existing.category,
    d.summary ?? existing.summary,
    d.learning_objective !== undefined ? d.learning_objective : existing.learning_objective,
    d.introduction !== undefined ? d.introduction : existing.introduction,
    d.content ?? existing.content,
    d.demonstration !== undefined ? d.demonstration : existing.demonstration,
    d.common_mistakes ? JSON.stringify(d.common_mistakes) : existing.common_mistakes_json,
    d.summary_recap !== undefined ? d.summary_recap : existing.summary_recap,
    d.practical_exercise !== undefined
      ? d.practical_exercise
        ? JSON.stringify(d.practical_exercise)
        : null
      : existing.practical_exercise_json,
    d.visual_key !== undefined ? d.visual_key : existing.visual_key,
    d.video_url !== undefined ? d.video_url : existing.video_url,
    d.audio_url !== undefined ? d.audio_url : existing.audio_url,
    d.transcript !== undefined ? d.transcript : existing.transcript,
    d.pdf_url !== undefined ? d.pdf_url : existing.pdf_url,
    d.image_url !== undefined ? d.image_url : existing.image_url,
    d.sources ? JSON.stringify(d.sources) : existing.sources_json,
    d.tags ? JSON.stringify(d.tags) : existing.tags_json,
    d.duration_minutes ?? existing.duration_minutes,
    d.order_index ?? existing.order_index,
    nextStatus,
    nextIsPremium ? 1 : 0,
    d.scheduled_at !== undefined ? d.scheduled_at : existing.scheduled_at,
    nextPublishedAt,
    now,
    nextVersion,
    d.quiz ? JSON.stringify(d.quiz) : existing.quiz_json,
    req.params.id
  );

  db.prepare(
    `INSERT INTO lesson_versions (id, lesson_id, version_number, title, content, changed_by, change_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    req.params.id,
    nextVersion,
    String(d.title ?? existing.title),
    String(d.content ?? existing.content),
    req.user!.name,
    d.change_note || (d.material_update ? 'Material curriculum update' : 'Lesson edit'),
    now
  );

  // Preserve learner completion records; optionally flag for review if materially updated
  if (d.material_update) {
    db.prepare(
      'UPDATE lesson_progress SET needs_review = 1, needs_review_note = ? WHERE lesson_id = ? AND completed = 1'
    ).run(d.change_note || 'Curriculum updated by Academy Admin — recommended review.', req.params.id);
  }

  logAcademyAudit(
    req.user!.id,
    req.user!.name,
    'Lesson Updated',
    'lesson',
    req.params.id,
    `${String(d.title ?? existing.title)} · v${nextVersion} (${nextStatus})${d.material_update ? ' [Review Flagged]' : ''}`
  );
  broadcastWs('academy:updated', { type: 'lesson_updated', id: req.params.id });

  if (nextStatus === 'published' && existing.status !== 'published' && d.send_push) {
    await dispatchNotification({
      title: `Academy Lesson Published: ${String(d.title ?? existing.title)}`,
      body: `${String(d.category ?? existing.category)} lesson is now live.`,
      category: 'academy',
      linkUrl: '/academy',
      broadcastWs,
    });
  }

  const updated = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
  res.json({ lesson: updated });
});

app.post('/api/academy/lessons/reorder', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    course_id: z.string().min(1),
    lesson_ids: z.array(z.string().min(1)).min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid reorder payload.' });
    return;
  }

  const updateOrder = db.prepare('UPDATE lessons SET order_index = ?, updated_at = ? WHERE id = ? AND course_id = ?');
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    parsed.data.lesson_ids.forEach((lid, idx) => {
      updateOrder.run(idx + 1, now, lid, parsed.data.course_id);
    });
  });
  tx();

  logAcademyAudit(req.user!.id, req.user!.name, 'Lessons Reordered', 'course', parsed.data.course_id, `${parsed.data.lesson_ids.length} lessons arranged`);
  broadcastWs('academy:updated', { type: 'lessons_reordered', course_id: parsed.data.course_id });
  res.json({ ok: true });
});

app.get('/api/academy/lessons/:id/versions', requireRole('admin'), (req: Request, res: Response) => {
  const versions = db
    .prepare('SELECT * FROM lesson_versions WHERE lesson_id = ? ORDER BY version_number DESC LIMIT 20')
    .all(req.params.id);
  res.json({ versions });
});

app.get('/api/admin/academy/audit', requireRole('admin'), (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM academy_audit_logs ORDER BY created_at DESC LIMIT 60').all();
  const reports = db.prepare('SELECT * FROM academy_content_reports ORDER BY created_at DESC LIMIT 60').all();
  res.json({ logs, reports });
});

app.patch('/api/admin/academy/reports/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(['resolved', 'dismissed']),
    resolution_note: z.string().max(400).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid report resolution.' });
    return;
  }
  db.prepare('UPDATE academy_content_reports SET status = ?, resolution_note = ? WHERE id = ?').run(
    parsed.data.status,
    parsed.data.resolution_note || null,
    req.params.id
  );
  logAcademyAudit(req.user!.id, req.user!.name, `Content Report ${parsed.data.status}`, 'report', req.params.id, parsed.data.resolution_note || '');
  res.json({ ok: true });
});

app.post('/api/admin/academy/generate-illustration', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    topic: z.string().trim().min(3).max(200),
    description: z.string().trim().min(5).max(800),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide a topic and brief concept description.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY or upload a custom diagram image directly.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a clean, crisp, publication-grade educational SVG diagram (width="820" height="420" viewBox="0 0 820 420") illustrating the following Forex trading concept clearly:\nTopic: ${parsed.data.topic}\nConcept: ${parsed.data.description}\n\nDesign rules:\n- Use clean slate (#0F172A, #475569, #F8FAFC), maroon (#881337), and emerald (#15803D) vector palette with light #FFFFFF card background.\n- Label key elements, price zones, entry/stop levels, or structure points legibly using Plus Jakarta Sans / sans-serif font.\n- Include a small subtle label in the top-right corner: "SIMULATED EDUCATIONAL DIAGRAM".\n- Never fabricate real market historical quotes or promise profits.\n- Return ONLY valid raw <svg ...>...</svg> markup with zero markdown backticks or commentary.`,
    });

    const raw = (response.text || '').trim();
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      res.status(502).json({ error: 'Model response did not return valid SVG diagram markup.' });
      return;
    }

    // Strip any unsafe script tags if present
    const cleanSvg = svgMatch[0].replace(/<script[\s\S]*?<\/script>/gi, '');
    const filename = `illustration-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.svg`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), cleanSvg, 'utf-8');

    const url = `/uploads/${filename}`;
    logAcademyAudit(req.user!.id, req.user!.name, 'Generated Educational Illustration', 'illustration', filename, parsed.data.topic);
    res.status(201).json({ url, filename });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Illustration generation failed.' });
  }
});

app.delete('/api/academy/lessons/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
  logAcademyAudit(req.user!.id, req.user!.name, 'Lesson Deleted', 'lesson', req.params.id, 'Removed lesson');
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

app.get('/api/push/status', optionalAuth, (req: AuthRequest, res: Response) => {
  const endpoint = typeof req.query.endpoint === 'string' ? req.query.endpoint.trim() : '';
  const actor = resolveReactionActor(req, res, false);
  let subscribed = false;

  if (endpoint) {
    const row = db
      .prepare('SELECT active FROM push_subscriptions WHERE endpoint = ?')
      .get(endpoint) as { active: number } | undefined;
    subscribed = Boolean(row && Number(row.active) === 1);
  } else if (actor?.userId) {
    const row = db
      .prepare('SELECT 1 FROM push_subscriptions WHERE user_id = ? AND COALESCE(active, 1) = 1 LIMIT 1')
      .get(actor.userId);
    subscribed = Boolean(row);
  } else if (actor?.visitorId) {
    const row = db
      .prepare('SELECT 1 FROM push_subscriptions WHERE visitor_id = ? AND COALESCE(active, 1) = 1 LIMIT 1')
      .get(actor.visitorId);
    subscribed = Boolean(row);
  }

  res.json({ subscribed });
});

const pushPrefsSchema = z.object({
  signals: z.boolean().optional(),
  signal_updates: z.boolean().optional(),
  signal_chat: z.boolean().optional(),
  market_updates: z.boolean().optional(),
  academy: z.boolean().optional(),
  economic_calendar: z.boolean().optional(),
  announcements: z.boolean().optional(),
  sound_enabled: z.boolean().optional(),
});

function isAllowedPushEndpointUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true;
    return false;
  } catch {
    return false;
  }
}

function parseDeviceMetadata(ua: string, explicitPlatform?: string): {
  platform: 'android' | 'ios' | 'web';
  browserName: string;
  deviceLabel: string;
} {
  const lower = ua.toLowerCase();
  const platform: 'android' | 'ios' | 'web' =
    explicitPlatform === 'android' || explicitPlatform === 'ios' || explicitPlatform === 'web'
      ? explicitPlatform
      : explicitPlatform === 'desktop'
        ? 'web'
        : /android/.test(lower)
          ? 'android'
          : /iphone|ipad|ipod/.test(lower)
            ? 'ios'
            : 'web';

  let browserName = 'Browser';
  if (/edg\//i.test(ua)) browserName = 'Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browserName = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browserName = 'Samsung Internet';
  else if (/firefox|fxios/i.test(ua)) browserName = 'Firefox';
  else if (/crios|chrome/i.test(ua)) browserName = 'Chrome';
  else if (/safari/i.test(ua)) browserName = 'Safari';

  const osLabel =
    platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : /mac/i.test(ua) ? 'macOS' : /win/i.test(ua) ? 'Windows' : /linux/i.test(ua) ? 'Linux' : 'Web';
  return {
    platform,
    browserName,
    deviceLabel: `${osLabel} · ${browserName}`,
  };
}

app.post('/api/push/subscribe', optionalAuth, rateLimit(30, 60_000), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    endpoint: z.string().url().refine(isAllowedPushEndpointUrl, 'Invalid push endpoint protocol.'),
    keys: z.object({
      p256dh: z.string().min(10).max(512),
      auth: z.string().min(6).max(256),
    }),
    platform: z.enum(['android', 'ios', 'web', 'desktop']).optional(),
    browser_name: z.string().max(60).optional(),
    old_endpoint: z.string().url().optional(),
    prefs: pushPrefsSchema.optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid push subscription object.' });
    return;
  }

  const actor = resolveReactionActor(req, res, !req.user);
  const visitorId = actor?.visitorId || null;
  const now = new Date().toISOString();
  const ua = String(req.headers['user-agent'] || '').slice(0, 250);
  const meta = parseDeviceMetadata(ua, parsed.data.platform);
  const browserName = parsed.data.browser_name?.trim() || meta.browserName;
  const deviceLabel = `${meta.platform === 'android' ? 'Android' : meta.platform === 'ios' ? 'iOS PWA' : 'Web'} · ${browserName}`;

  if (parsed.data.old_endpoint && parsed.data.old_endpoint !== parsed.data.endpoint) {
    db.prepare('UPDATE push_subscriptions SET active = 0, updated_at = ? WHERE endpoint = ?').run(
      now,
      parsed.data.old_endpoint
    );
  }

  const existingSub = db
    .prepare('SELECT prefs_json, sound_enabled FROM push_subscriptions WHERE endpoint = ?')
    .get(parsed.data.endpoint) as { prefs_json?: string; sound_enabled?: number } | undefined;

  const visitorPrefRow = visitorId
    ? (db
        .prepare('SELECT prefs_json FROM visitor_preferences WHERE visitor_id = ?')
        .get(visitorId) as { prefs_json?: string } | undefined)
    : undefined;

  const effectivePrefs = normalizeNotificationPrefs({
    ...(visitorPrefRow?.prefs_json ? normalizeNotificationPrefs(visitorPrefRow.prefs_json) : {}),
    ...(existingSub?.prefs_json ? normalizeNotificationPrefs(existingSub.prefs_json) : {}),
    ...(req.user ? req.user.notification_prefs : {}),
    ...(parsed.data.prefs || {}),
  });
  const prefsJson = JSON.stringify(effectivePrefs);

  db.prepare(
    `INSERT INTO push_subscriptions (
      id, user_id, visitor_id, endpoint, p256dh, auth, user_agent, platform,
      transport, token, browser_name, device_label,
      prefs_json, sound_enabled, failure_count, active, last_error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'web_push', NULL, ?, ?, ?, ?, 0, 1, NULL, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = COALESCE(excluded.user_id, push_subscriptions.user_id),
      visitor_id = COALESCE(excluded.visitor_id, push_subscriptions.visitor_id),
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      user_agent = excluded.user_agent,
      platform = COALESCE(excluded.platform, push_subscriptions.platform),
      transport = 'web_push',
      browser_name = excluded.browser_name,
      device_label = excluded.device_label,
      prefs_json = excluded.prefs_json,
      sound_enabled = excluded.sound_enabled,
      failure_count = 0,
      active = 1,
      last_error = NULL,
      updated_at = excluded.updated_at`
  ).run(
    crypto.randomUUID(),
    req.user?.id || null,
    visitorId,
    parsed.data.endpoint,
    parsed.data.keys.p256dh,
    parsed.data.keys.auth,
    ua,
    meta.platform,
    browserName,
    deviceLabel,
    prefsJson,
    effectivePrefs.sound_enabled ? 1 : 0,
    now,
    now
  );

  await syncPushSubscriptionToRemote(parsed.data.endpoint);

  const subRow = db
    .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
    .get(parsed.data.endpoint) as { id: string } | undefined;

  res.status(201).json({
    ok: true,
    subscription_id: subRow?.id || null,
    active: true,
    platform: meta.platform,
    device_label: deviceLabel,
    prefs: effectivePrefs,
  });
});

app.post('/api/push/register-native', optionalAuth, rateLimit(30, 60_000), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    transport: z.enum(['fcm', 'apns']),
    token: z.string().trim().min(16).max(512),
    platform: z.enum(['android', 'ios', 'web']),
    device_label: z.string().max(120).optional(),
    prefs: pushPrefsSchema.optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid native push token registration.' });
    return;
  }

  const actor = resolveReactionActor(req, res, !req.user);
  const now = new Date().toISOString();
  const ua = String(req.headers['user-agent'] || '').slice(0, 250);
  const syntheticEndpoint = `${parsed.data.transport}://${parsed.data.token}`;
  const effectivePrefs = normalizeNotificationPrefs({
    ...(req.user ? req.user.notification_prefs : {}),
    ...(parsed.data.prefs || {}),
  });
  const prefsJson = JSON.stringify(effectivePrefs);
  const label =
    parsed.data.device_label?.trim() ||
    `${parsed.data.platform.toUpperCase()} (${parsed.data.transport.toUpperCase()})`;

  db.prepare(
    `INSERT INTO push_subscriptions (
      id, user_id, visitor_id, endpoint, p256dh, auth, user_agent, platform,
      transport, token, browser_name, device_label,
      prefs_json, sound_enabled, failure_count, active, last_error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'native', 'native', ?, ?, ?, ?, 'Native', ?, ?, ?, 0, 1, NULL, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = COALESCE(excluded.user_id, push_subscriptions.user_id),
      visitor_id = COALESCE(excluded.visitor_id, push_subscriptions.visitor_id),
      platform = excluded.platform,
      transport = excluded.transport,
      token = excluded.token,
      device_label = excluded.device_label,
      prefs_json = excluded.prefs_json,
      sound_enabled = excluded.sound_enabled,
      failure_count = 0,
      active = 1,
      last_error = NULL,
      updated_at = excluded.updated_at`
  ).run(
    crypto.randomUUID(),
    req.user?.id || null,
    actor?.visitorId || null,
    syntheticEndpoint,
    ua,
    parsed.data.platform,
    parsed.data.transport,
    parsed.data.token,
    label,
    prefsJson,
    effectivePrefs.sound_enabled ? 1 : 0,
    now,
    now
  );

  res.status(201).json({
    ok: true,
    transport: parsed.data.transport,
    platform: parsed.data.platform,
    infrastructure: getPushInfrastructureStatus(),
  });
});

app.post('/api/push/ack', rateLimit(120, 60_000), (req: Request, res: Response) => {
  const deliveryId = typeof req.body?.deliveryId === 'string' ? req.body.deliveryId.trim() : '';
  const event = req.body?.event === 'clicked' ? 'clicked' : 'received';
  if (deliveryId && !deliveryId.startsWith('test-')) {
    recordPushReceipt(deliveryId, event);
  }
  res.json({ ok: true });
});

app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
  const endpoint = String(req.body?.endpoint || '').trim();
  if (endpoint) {
    db.prepare('UPDATE push_subscriptions SET active = 0, updated_at = ? WHERE endpoint = ?').run(
      new Date().toISOString(),
      endpoint
    );
  }
  res.json({ ok: true });
});

app.get('/api/push/preferences', optionalAuth, (req: AuthRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const endpoint = typeof req.query.endpoint === 'string' ? req.query.endpoint.trim() : '';
  const actor = resolveReactionActor(req, res, false);

  let row: { prefs_json?: string; sound_enabled?: number; active?: number } | undefined;
  if (endpoint) {
    row = db
      .prepare('SELECT prefs_json, sound_enabled, active FROM push_subscriptions WHERE endpoint = ?')
      .get(endpoint) as typeof row;
  } else if (actor?.userId) {
    row = db
      .prepare(
        'SELECT prefs_json, sound_enabled, active FROM push_subscriptions WHERE user_id = ? AND COALESCE(active, 1) = 1 ORDER BY updated_at DESC LIMIT 1'
      )
      .get(actor.userId) as typeof row;
  } else if (actor?.visitorId) {
    row = db
      .prepare(
        'SELECT prefs_json, sound_enabled, active FROM push_subscriptions WHERE visitor_id = ? AND COALESCE(active, 1) = 1 ORDER BY updated_at DESC LIMIT 1'
      )
      .get(actor.visitorId) as typeof row;
  }

  let fallbackVisitorPrefs: { prefs_json?: string; sound_enabled?: number } | undefined;
  if (!row && actor?.visitorId) {
    fallbackVisitorPrefs = db
      .prepare('SELECT prefs_json, sound_enabled FROM visitor_preferences WHERE visitor_id = ?')
      .get(actor.visitorId) as typeof fallbackVisitorPrefs;
  }

  const base = req.user
    ? req.user.notification_prefs
    : normalizeNotificationPrefs(row?.prefs_json ?? fallbackVisitorPrefs?.prefs_json);
  const soundFlag =
    row?.sound_enabled !== undefined
      ? Boolean(row.sound_enabled)
      : fallbackVisitorPrefs?.sound_enabled !== undefined
        ? Boolean(fallbackVisitorPrefs.sound_enabled)
        : undefined;
  const prefs = normalizeNotificationPrefs({
    ...base,
    ...(soundFlag !== undefined ? { sound_enabled: soundFlag } : {}),
  });
  res.json({ prefs, subscribed: Boolean(row && row.active !== 0) });
});

app.patch('/api/push/preferences', optionalAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    endpoint: z.string().url().optional(),
    prefs: pushPrefsSchema,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid device notification preferences.' });
    return;
  }

  const actor = resolveReactionActor(req, res, true);
  const now = new Date().toISOString();
  let existingRaw: unknown = req.user?.notification_prefs;

  if (!existingRaw && parsed.data.endpoint) {
    const sub = db
      .prepare('SELECT prefs_json FROM push_subscriptions WHERE endpoint = ?')
      .get(parsed.data.endpoint) as { prefs_json?: string } | undefined;
    existingRaw = sub?.prefs_json;
  } else if (!existingRaw && actor?.visitorId) {
    const sub = db
      .prepare('SELECT prefs_json FROM push_subscriptions WHERE visitor_id = ? ORDER BY updated_at DESC LIMIT 1')
      .get(actor.visitorId) as { prefs_json?: string } | undefined;
    if (sub?.prefs_json) {
      existingRaw = sub.prefs_json;
    } else {
      const vp = db
        .prepare('SELECT prefs_json FROM visitor_preferences WHERE visitor_id = ?')
        .get(actor.visitorId) as { prefs_json?: string } | undefined;
      existingRaw = vp?.prefs_json;
    }
  }

  const nextPrefs = normalizeNotificationPrefs({
    ...normalizeNotificationPrefs(existingRaw),
    ...parsed.data.prefs,
  });
  const prefsJson = JSON.stringify(nextPrefs);
  const soundVal = nextPrefs.sound_enabled ? 1 : 0;

  if (parsed.data.endpoint) {
    db.prepare(
      'UPDATE push_subscriptions SET prefs_json = ?, sound_enabled = ?, updated_at = ? WHERE endpoint = ?'
    ).run(prefsJson, soundVal, now, parsed.data.endpoint);
    await syncPushSubscriptionToRemote(parsed.data.endpoint);
  }
  if (req.user) {
    db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(prefsJson, req.user.id);
    db.prepare(
      'UPDATE push_subscriptions SET prefs_json = ?, sound_enabled = ?, updated_at = ? WHERE user_id = ?'
    ).run(prefsJson, soundVal, now, req.user.id);
  }
  if (actor?.visitorId) {
    db.prepare(
      'UPDATE push_subscriptions SET prefs_json = ?, sound_enabled = ?, updated_at = ? WHERE visitor_id = ?'
    ).run(prefsJson, soundVal, now, actor.visitorId);
    db.prepare(
      `INSERT INTO visitor_preferences (visitor_id, prefs_json, sound_enabled, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(visitor_id) DO UPDATE SET
         prefs_json = excluded.prefs_json,
         sound_enabled = excluded.sound_enabled,
         updated_at = excluded.updated_at`
    ).run(actor.visitorId, prefsJson, soundVal, now);
  }

  res.json({ ok: true, prefs: nextPrefs });
});

app.post('/api/push/test', optionalAuth, rateLimit(8, 60_000), async (req: AuthRequest, res: Response) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';
  const actor = resolveReactionActor(req, res, false);

  let sub: { id: string } | undefined;
  if (endpoint) {
    sub = db
      .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ? AND COALESCE(active, 1) = 1')
      .get(endpoint) as { id: string } | undefined;
  } else if (actor?.userId) {
    sub = db
      .prepare(
        'SELECT id FROM push_subscriptions WHERE user_id = ? AND COALESCE(active, 1) = 1 ORDER BY updated_at DESC LIMIT 1'
      )
      .get(actor.userId) as { id: string } | undefined;
  } else if (actor?.visitorId) {
    sub = db
      .prepare(
        'SELECT id FROM push_subscriptions WHERE visitor_id = ? AND COALESCE(active, 1) = 1 ORDER BY updated_at DESC LIMIT 1'
      )
      .get(actor.visitorId) as { id: string } | undefined;
  }

  if (!sub) {
    res.status(404).json({ error: 'No active push subscription found on this device. Enable notifications first.' });
    return;
  }

  const result = await sendDirectTestPush(sub.id);
  if (!result.ok) {
    res.status(502).json({ error: result.error || 'Push delivery failed.', statusCode: result.statusCode });
    return;
  }
  res.json({ ok: true, statusCode: result.statusCode });
});

function generateUniqueRefCode(
  prefix: string,
  table: 'membership_applications' | 'support_conversations' | 'contact_messages'
): string {
  for (let i = 0; i < 8; i += 1) {
    const code = `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const exists = db.prepare(`SELECT 1 FROM ${table} WHERE reference_code = ?`).get(code);
    if (!exists) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// ---------- Premium Membership Applications ----------
app.post('/api/applications', rateLimit(10, 60_000), async (req: Request, res: Response) => {
  const schema = z.object({
    full_name: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100),
    email: z.string().trim().email('Please enter a valid email address.').max(160),
    phone: z.string().trim().min(5, 'Phone number with country code is required.').max(40),
    country: z.string().trim().min(2, 'Please enter your country.').max(80),
    preferred_contact: z.enum(['Email', 'WhatsApp', 'Phone Call']),
    message: z.string().trim().min(5, 'Please briefly explain your membership enquiry.').max(3000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid application details.' });
    return;
  }

  const d = parsed.data;
  const id = crypto.randomUUID();
  const referenceCode = generateUniqueRefCode('MFX-APP', 'membership_applications');
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO membership_applications (
      id, reference_code, full_name, email, phone, country, preferred_contact, message, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(
    id,
    referenceCode,
    d.full_name,
    d.email.toLowerCase(),
    d.phone,
    d.country,
    d.preferred_contact,
    d.message,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM membership_applications WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  emitAdminWs('admin:application_created', created);

  await dispatchNotification({
    title: `New Premium Application (${referenceCode})`,
    body: `${d.full_name} (${d.country}) applied via ${d.preferred_contact}.`,
    category: 'announcements',
    linkUrl: '/admin',
    targetGroup: 'admins_mods',
    priority: 'urgent',
    publishedAt: now,
    dedupKey: `application:${id}`,
    broadcastWs: emitAdminWs,
  });

  res.status(201).json({
    ok: true,
    application: created,
    reference_code: referenceCode,
  });
});

app.get('/api/admin/applications', requireRole('admin'), (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT a.*, u.username as member_username, u.status as member_status
       FROM membership_applications a
       LEFT JOIN users u ON a.member_user_id = u.id
       ORDER BY a.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const r of rows) {
    if (r.status === 'pending') pending += 1;
    else if (r.status === 'approved') approved += 1;
    else if (r.status === 'rejected') rejected += 1;
  }

  res.json({
    summary: {
      total: rows.length,
      pending,
      approved,
      rejected,
    },
    applications: rows,
  });
});

app.patch('/api/admin/applications/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const existing = db
    .prepare('SELECT * FROM membership_applications WHERE id = ?')
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Membership application not found.' });
    return;
  }

  const schema = z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    admin_notes: z.string().max(1000).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid application update.' });
    return;
  }

  const now = new Date().toISOString();
  const nextStatus = parsed.data.status ?? String(existing.status);
  const nextNotes =
    parsed.data.admin_notes !== undefined ? parsed.data.admin_notes?.trim() || null : existing.admin_notes;

  db.prepare(
    `UPDATE membership_applications SET
      status = ?,
      admin_notes = ?,
      reviewed_by = ?,
      reviewed_at = ?,
      updated_at = ?
     WHERE id = ?`
  ).run(nextStatus, nextNotes, req.user!.name, now, now, req.params.id);

  const updated = db
    .prepare(
      `SELECT a.*, u.username as member_username, u.status as member_status
       FROM membership_applications a
       LEFT JOIN users u ON a.member_user_id = u.id
       WHERE a.id = ?`
    )
    .get(req.params.id);
  emitAdminWs('admin:application_updated', updated);
  res.json({ application: updated });
});

app.post(
  '/api/admin/applications/:id/create-member',
  requireRole('admin'),
  (req: AuthRequest, res: Response) => {
    const appRow = db
      .prepare('SELECT * FROM membership_applications WHERE id = ?')
      .get(req.params.id) as Record<string, unknown> | undefined;
    if (!appRow) {
      res.status(404).json({ error: 'Membership application not found.' });
      return;
    }

    if (appRow.member_user_id) {
      const existingMember = db
        .prepare('SELECT id FROM users WHERE id = ?')
        .get(String(appRow.member_user_id));
      if (existingMember) {
        res.status(409).json({ error: 'A Premium Member account has already been created for this application.' });
        return;
      }
    }

    const schema = z.object({
      username: z
        .string()
        .trim()
        .min(3)
        .max(40)
        .regex(/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, or hyphens.')
        .optional(),
      email: z.string().trim().email().max(160).optional(),
      password: z.string().max(128).optional(),
      membership_expires_at: z.string().nullable().optional(),
      membership_notes: z.string().max(500).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid member details.' });
      return;
    }

    const targetEmail = (parsed.data.email || String(appRow.email)).trim().toLowerCase();
    if (targetEmail === DESIGNATED_ADMIN_EMAIL) {
      res.status(400).json({ error: 'Cannot create a member with the designated administrator email.' });
      return;
    }

    const dupEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(targetEmail);
    if (dupEmail) {
      res.status(409).json({ error: 'A member account with this email address already exists.' });
      return;
    }

    let baseUsername = (
      parsed.data.username ||
      String(appRow.full_name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 20) ||
      targetEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '')
    ).toLowerCase();
    if (baseUsername.length < 3) baseUsername = `member.${crypto.randomBytes(2).toString('hex')}`;

    let resolvedUsername = baseUsername;
    if (parsed.data.username) {
      const dupUsername = db
        .prepare('SELECT id FROM users WHERE username IS NOT NULL AND LOWER(username) = ?')
        .get(resolvedUsername);
      if (dupUsername) {
        res.status(409).json({ error: 'This username is already assigned to another member.' });
        return;
      }
    } else {
      let attempt = 0;
      while (
        db
          .prepare('SELECT id FROM users WHERE username IS NOT NULL AND LOWER(username) = ?')
          .get(resolvedUsername)
      ) {
        attempt += 1;
        resolvedUsername = `${baseUsername.slice(0, 22)}${attempt}`;
      }
    }

    const expiry = normalizeOptionalExpiry(parsed.data.membership_expires_at);
    if (expiry === 'invalid') {
      res.status(400).json({ error: 'Invalid membership expiry date.' });
      return;
    }

    const rawPassword = (parsed.data.password || '').trim() || generateTemporaryPassword();
    const pwError = validateStrongPassword(rawPassword);
    if (pwError) {
      res.status(400).json({ error: pwError });
      return;
    }

    const now = new Date().toISOString();
    const memberId = crypto.randomUUID();
    const notes =
      parsed.data.membership_notes?.trim() ||
      `Approved from application ${String(appRow.reference_code)} (${String(appRow.country)})`;

    db.prepare(
      `INSERT INTO users (
        id, name, username, email, password_hash, role, status, email_verified,
        membership_expires_at, membership_notes, needs_password_setup,
        terms_accepted_at, timezone, created_at
      ) VALUES (?, ?, ?, ?, ?, 'user', 'active', 1, ?, ?, 1, ?, 'UTC', ?)`
    ).run(
      memberId,
      String(appRow.full_name),
      resolvedUsername,
      targetEmail,
      hashPassword(rawPassword),
      expiry,
      notes,
      now,
      now
    );

    db.prepare(
      `UPDATE membership_applications SET
        status = 'approved',
        member_user_id = ?,
        reviewed_by = ?,
        reviewed_at = ?,
        updated_at = ?
       WHERE id = ?`
    ).run(memberId, req.user!.name, now, now, req.params.id);

    logUserActivity(
      memberId,
      'Membership Created',
      `Approved from application ${String(appRow.reference_code)} by ${req.user!.name}.`,
      req.ip
    );

    const createdMember = db.prepare('SELECT * FROM users WHERE id = ?').get(memberId) as Record<
      string,
      unknown
    >;
    const updatedApp = db
      .prepare(
        `SELECT a.*, u.username as member_username, u.status as member_status
         FROM membership_applications a
         LEFT JOIN users u ON a.member_user_id = u.id
         WHERE a.id = ?`
      )
      .get(req.params.id);

    emitAdminWs('admin:application_updated', updatedApp);
    res.status(201).json({
      application: updatedApp,
      member: mapDbUser(createdMember),
      temporary_password: rawPassword,
    });
  }
);

// ---------- Contact Form ----------
app.post('/api/contact', rateLimit(8, 60_000), async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(40).optional().nullable(),
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(3000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contact inquiry.' });
    return;
  }

  const id = crypto.randomUUID();
  const referenceCode = generateUniqueRefCode('MFX-ENQ', 'contact_messages');
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO contact_messages (id, reference_code, name, email, phone, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    referenceCode,
    parsed.data.name,
    parsed.data.email.toLowerCase(),
    parsed.data.phone?.trim() || null,
    parsed.data.subject,
    parsed.data.message,
    'new',
    now
  );

  const created = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
  emitAdminWs('admin:contact_created', created);

  await dispatchNotification({
    title: `New Contact Enquiry (${referenceCode})`,
    body: `${parsed.data.name}: ${parsed.data.subject}`,
    category: 'announcements',
    linkUrl: '/admin',
    targetGroup: 'admins_mods',
    publishedAt: now,
    dedupKey: `contact:${id}`,
    broadcastWs: emitAdminWs,
  });

  res.status(201).json({ ok: true, reference_code: referenceCode, contact: created });
});

app.patch('/api/admin/contacts/:id', requireRole('admin'), (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Contact enquiry not found.' });
    return;
  }

  const schema = z.object({
    status: z.enum(['new', 'reviewed', 'replied']).optional(),
    admin_reply: z.string().max(2000).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid contact update.' });
    return;
  }

  const now = new Date().toISOString();
  const nextStatus = parsed.data.status ?? String(existing.status || 'new');
  const nextReply =
    parsed.data.admin_reply !== undefined ? parsed.data.admin_reply?.trim() || null : existing.admin_reply;
  const repliedAt = parsed.data.admin_reply ? now : existing.replied_at;

  db.prepare(
    'UPDATE contact_messages SET status = ?, admin_reply = ?, replied_at = ? WHERE id = ?'
  ).run(nextStatus, nextReply, repliedAt, req.params.id);

  const updated = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(req.params.id);
  emitAdminWs('admin:contact_updated', updated);
  res.json({ contact: updated });
});

// ---------- Two-Way Customer Chat (Public Visitor <-> Admin) ----------
function mapSupportConversation(row: Record<string, unknown>, includeTokenHash = false) {
  const mapped: Record<string, unknown> = {
    id: String(row.id),
    reference_code: String(row.reference_code),
    visitor_name: String(row.visitor_name),
    visitor_email: row.visitor_email ? String(row.visitor_email) : null,
    visitor_phone: row.visitor_phone ? String(row.visitor_phone) : null,
    status: String(row.status || 'open'),
    unread_admin: Number(row.unread_admin || 0),
    unread_visitor: Number(row.unread_visitor || 0),
    last_message_preview: row.last_message_preview ? String(row.last_message_preview) : '',
    last_message_at: String(row.last_message_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
  if (includeTokenHash) {
    mapped.visitor_id = row.visitor_id ? String(row.visitor_id) : null;
  }
  return mapped;
}

function mapSupportMessage(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    sender_type: String(row.sender_type) as 'visitor' | 'admin',
    sender_name: String(row.sender_name),
    content: String(row.content || ''),
    attachment_url: row.attachment_url ? String(row.attachment_url) : null,
    attachment_name: row.attachment_name ? String(row.attachment_name) : null,
    read_by_admin: Boolean(row.read_by_admin),
    read_by_visitor: Boolean(row.read_by_visitor),
    created_at: String(row.created_at),
  };
}

function resolveSupportConversationForVisitor(req: Request, conversationId: string) {
  const token = String(
    req.headers['x-support-token'] || req.query.token || req.body?.visitor_token || ''
  ).trim();
  if (!token) return null;
  const row = db
    .prepare('SELECT * FROM support_conversations WHERE id = ?')
    .get(conversationId) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (!verifySupportToken(token, String(row.access_token_hash))) return null;
  return row;
}

function verifySupportUploadAuth(req: Request, res: Response, next: NextFunction): void {
  const convId = String(req.headers['x-support-conversation-id'] || '').trim();
  const token = String(req.headers['x-support-token'] || '').trim();
  if (!convId || !token) {
    res.status(401).json({ error: 'Customer chat session token is required to attach images.' });
    return;
  }
  const conv = db
    .prepare('SELECT id, access_token_hash FROM support_conversations WHERE id = ?')
    .get(convId) as { id: string; access_token_hash: string } | undefined;
  if (!conv || !verifySupportToken(token, conv.access_token_hash)) {
    res.status(403).json({ error: 'Invalid customer chat session token.' });
    return;
  }
  next();
}

app.post(
  '/api/support/upload',
  rateLimit(15, 60_000),
  verifySupportUploadAuth,
  supportImageUpload.single('file'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded.' });
      return;
    }
    res.json({
      url: `/uploads/${req.file.filename}`,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  }
);

app.post('/api/support/conversations', optionalAuth, rateLimit(10, 60_000), async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    visitor_name: z.string().trim().max(100).optional(),
    visitor_email: z.union([z.string().trim().email().max(160), z.literal('')]).optional(),
    visitor_phone: z.string().trim().max(40).optional(),
    initial_message: z.string().trim().max(4000).optional(),
    attachment_url: z.string().max(500).optional().nullable(),
    attachment_name: z.string().max(200).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid chat enquiry details.' });
    return;
  }

  const d = parsed.data;
  const resolvedVisitorName = (d.visitor_name || req.user?.name || 'Visitor').trim() || 'Visitor';
  const resolvedVisitorEmail = d.visitor_email ? d.visitor_email.toLowerCase() : req.user?.email || null;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const referenceCode = generateUniqueRefCode('MFX-CHAT', 'support_conversations');
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashSupportToken(rawToken);
  const actor = resolveReactionActor(req, res, true);
  const initialMsg = (d.initial_message || '').trim();
  const hasInitial = Boolean(initialMsg || d.attachment_url);
  const preview = initialMsg
    ? initialMsg.slice(0, 140)
    : d.attachment_url
      ? 'Shared an image attachment'
      : 'Started a direct conversation';

  db.prepare(
    `INSERT INTO support_conversations (
      id, reference_code, visitor_name, visitor_email, visitor_phone, visitor_id,
      access_token_hash, status, unread_admin, unread_visitor,
      last_message_preview, last_message_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, 0, ?, ?, ?, ?)`
  ).run(
    id,
    referenceCode,
    resolvedVisitorName,
    resolvedVisitorEmail,
    d.visitor_phone?.trim() || null,
    actor?.visitorId || null,
    tokenHash,
    hasInitial ? 1 : 0,
    preview,
    now,
    now,
    now
  );

  const messages: Array<ReturnType<typeof mapSupportMessage>> = [];
  if (hasInitial) {
    const msgId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO support_messages (
        id, conversation_id, sender_type, sender_name, content,
        attachment_url, attachment_name, read_by_admin, read_by_visitor, created_at
      ) VALUES (?, ?, 'visitor', ?, ?, ?, ?, 0, 1, ?)`
    ).run(
      msgId,
      id,
      resolvedVisitorName,
      initialMsg,
      d.attachment_url || null,
      d.attachment_name || null,
      now
    );
    const msgRow = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId) as Record<
      string,
      unknown
    >;
    messages.push(mapSupportMessage(msgRow));
  }

  const convRow = db.prepare('SELECT * FROM support_conversations WHERE id = ?').get(id) as Record<
    string,
    unknown
  >;
  const mappedConv = mapSupportConversation(convRow);
  emitAdminWs('admin:support_conversation_created', mappedConv);
  if (messages[0]) {
    emitAdminWs('admin:support_message', { conversation: mappedConv, message: messages[0] });
  }

  await dispatchNotification({
    title: `Customer Enquiry (${referenceCode})`,
    body: `${d.visitor_name}: ${preview}`,
    category: 'announcements',
    linkUrl: '/admin',
    targetGroup: 'admins_mods',
    publishedAt: now,
    dedupKey: `support_conv:${id}`,
    broadcastWs: emitAdminWs,
  });

  res.status(201).json({
    conversation: mappedConv,
    messages,
    visitor_token: rawToken,
  });
});

app.get('/api/support/conversations/:id', (req: Request, res: Response) => {
  const convRow = resolveSupportConversationForVisitor(req, String(req.params.id));
  if (!convRow) {
    res.status(403).json({ error: 'Conversation not found or invalid session token.' });
    return;
  }

  const msgRows = db
    .prepare('SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(String(convRow.id)) as Array<Record<string, unknown>>;

  res.json({
    conversation: mapSupportConversation(convRow),
    messages: msgRows.map(mapSupportMessage),
  });
});

app.post(
  '/api/support/conversations/:id/messages',
  rateLimit(30, 60_000),
  async (req: AuthRequest, res: Response) => {
    const convRow = resolveSupportConversationForVisitor(req, String(req.params.id));
    if (!convRow) {
      res.status(403).json({ error: 'Conversation not found or invalid session token.' });
      return;
    }

    const schema = z
      .object({
        content: z.string().max(4000).optional().default(''),
        attachment_url: z.string().max(500).optional().nullable(),
        attachment_name: z.string().max(200).optional().nullable(),
      })
      .refine((d) => d.content.trim().length > 0 || Boolean(d.attachment_url), {
        message: 'Enter a message or attach an image before sending.',
      });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid message payload.' });
      return;
    }

    const now = new Date().toISOString();
    const content = parsed.data.content.trim();
    const preview = content ? content.slice(0, 140) : 'Sent an image attachment';
    const msgId = crypto.randomUUID();
    const convId = String(convRow.id);
    const actor = resolveReactionActor(req, res, false);

    db.prepare(
      `INSERT INTO support_messages (
        id, conversation_id, sender_type, sender_name, content,
        attachment_url, attachment_name, read_by_admin, read_by_visitor, created_at
      ) VALUES (?, ?, 'visitor', ?, ?, ?, ?, 0, 1, ?)`
    ).run(
      msgId,
      convId,
      String(convRow.visitor_name),
      content,
      parsed.data.attachment_url || null,
      parsed.data.attachment_name || null,
      now
    );

    db.prepare(
      `UPDATE support_conversations SET
        status = 'open',
        unread_admin = unread_admin + 1,
        visitor_id = COALESCE(visitor_id, ?),
        last_message_preview = ?,
        last_message_at = ?,
        updated_at = ?
       WHERE id = ?`
    ).run(actor?.visitorId || null, preview, now, now, convId);

    const updatedConvRow = db
      .prepare('SELECT * FROM support_conversations WHERE id = ?')
      .get(convId) as Record<string, unknown>;
    const msgRow = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId) as Record<
      string,
      unknown
    >;

    const mappedConv = mapSupportConversation(updatedConvRow);
    const mappedMsg = mapSupportMessage(msgRow);

    emitSupportWs(convId, 'support:message', { conversation: mappedConv, message: mappedMsg });
    emitAdminWs('admin:support_message', { conversation: mappedConv, message: mappedMsg });

    await dispatchNotification({
      title: `Reply from ${String(convRow.visitor_name)} (${String(convRow.reference_code)})`,
      body: preview,
      category: 'announcements',
      linkUrl: '/admin',
      targetGroup: 'admins_mods',
      publishedAt: now,
      dedupKey: `support_msg:${msgId}`,
      broadcastWs: emitAdminWs,
    });

    res.status(201).json({ conversation: mappedConv, message: mappedMsg });
  }
);

app.post('/api/support/conversations/:id/read', (req: Request, res: Response) => {
  const convRow = resolveSupportConversationForVisitor(req, String(req.params.id));
  if (!convRow) {
    res.status(403).json({ error: 'Conversation not found or invalid session token.' });
    return;
  }

  const convId = String(convRow.id);
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE support_messages SET read_by_visitor = 1 WHERE conversation_id = ? AND sender_type = 'admin' AND read_by_visitor = 0`
  ).run(convId);
  db.prepare('UPDATE support_conversations SET unread_visitor = 0, updated_at = ? WHERE id = ?').run(
    now,
    convId
  );

  emitSupportWs(convId, 'support:read', { conversation_id: convId, reader: 'visitor' });
  res.json({ ok: true });
});

app.get('/api/admin/support/conversations', requireRole('admin'), (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM support_conversations ORDER BY last_message_at DESC')
    .all() as Array<Record<string, unknown>>;

  let unreadMessages = 0;
  let openCount = 0;
  for (const r of rows) {
    unreadMessages += Number(r.unread_admin || 0);
    if (r.status === 'open') openCount += 1;
  }

  res.json({
    conversations: rows.map((r) => mapSupportConversation(r, true)),
    summary: {
      total: rows.length,
      open: openCount,
      resolved: rows.length - openCount,
      unread_messages: unreadMessages,
    },
  });
});

app.get('/api/admin/support/conversations/:id', requireRole('admin'), (req: Request, res: Response) => {
  const convRow = db
    .prepare('SELECT * FROM support_conversations WHERE id = ?')
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!convRow) {
    res.status(404).json({ error: 'Customer conversation not found.' });
    return;
  }

  const markRead = req.query.markRead !== 'false';
  if (markRead && Number(convRow.unread_admin || 0) > 0) {
    db.prepare(
      `UPDATE support_messages SET read_by_admin = 1 WHERE conversation_id = ? AND sender_type = 'visitor' AND read_by_admin = 0`
    ).run(String(convRow.id));
    db.prepare('UPDATE support_conversations SET unread_admin = 0 WHERE id = ?').run(
      String(convRow.id)
    );
    convRow.unread_admin = 0;
    emitSupportWs(String(convRow.id), 'support:read', {
      conversation_id: String(convRow.id),
      reader: 'admin',
    });
  }

  const msgRows = db
    .prepare('SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(String(convRow.id)) as Array<Record<string, unknown>>;

  res.json({
    conversation: mapSupportConversation(convRow, true),
    messages: msgRows.map(mapSupportMessage),
  });
});

app.post(
  '/api/admin/support/conversations/:id/messages',
  requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    const convRow = db
      .prepare('SELECT * FROM support_conversations WHERE id = ?')
      .get(req.params.id) as Record<string, unknown> | undefined;
    if (!convRow) {
      res.status(404).json({ error: 'Customer conversation not found.' });
      return;
    }

    const schema = z
      .object({
        content: z.string().max(4000).optional().default(''),
        attachment_url: z.string().max(500).optional().nullable(),
        attachment_name: z.string().max(200).optional().nullable(),
      })
      .refine((d) => d.content.trim().length > 0 || Boolean(d.attachment_url), {
        message: 'Enter a reply or attach an image before sending.',
      });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reply payload.' });
      return;
    }

    const now = new Date().toISOString();
    const convId = String(convRow.id);
    const content = parsed.data.content.trim();
    const preview = content ? content.slice(0, 140) : 'Desk sent an image attachment';
    const msgId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO support_messages (
        id, conversation_id, sender_type, sender_name, content,
        attachment_url, attachment_name, read_by_admin, read_by_visitor, created_at
      ) VALUES (?, ?, 'admin', ?, ?, ?, ?, 1, 0, ?)`
    ).run(
      msgId,
      convId,
      'MeridianFX Desk',
      content,
      parsed.data.attachment_url || null,
      parsed.data.attachment_name || null,
      now
    );

    db.prepare(
      `UPDATE support_messages SET read_by_admin = 1 WHERE conversation_id = ? AND sender_type = 'visitor' AND read_by_admin = 0`
    ).run(convId);

    db.prepare(
      `UPDATE support_conversations SET
        unread_admin = 0,
        unread_visitor = unread_visitor + 1,
        last_message_preview = ?,
        last_message_at = ?,
        updated_at = ?
       WHERE id = ?`
    ).run(preview, now, now, convId);

    const updatedConvRow = db
      .prepare('SELECT * FROM support_conversations WHERE id = ?')
      .get(convId) as Record<string, unknown>;
    const msgRow = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId) as Record<
      string,
      unknown
    >;

    const mappedConv = mapSupportConversation(updatedConvRow);
    const mappedMsg = mapSupportMessage(msgRow);

    emitSupportWs(convId, 'support:message', { conversation: mappedConv, message: mappedMsg });

    if (convRow.visitor_id) {
      await dispatchNotification({
        title: `MeridianFX Support Reply (${String(convRow.reference_code)})`,
        body: preview,
        category: 'announcements',
        linkUrl: `/profile?chat=${encodeURIComponent(convId)}`,
        imageUrl: parsed.data.attachment_url || null,
        priority: 'urgent',
        respectPrefs: false,
        targetVisitorIds: [String(convRow.visitor_id)],
        publishedAt: now,
        dedupKey: `support_reply:${msgId}`,
        broadcastWs: emitAdminWs,
      });
    }

    res.status(201).json({ conversation: mappedConv, message: mappedMsg });
  }
);

app.patch('/api/admin/support/conversations/:id', requireRole('admin'), (req: Request, res: Response) => {
  const existing = db
    .prepare('SELECT * FROM support_conversations WHERE id = ?')
    .get(req.params.id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Customer conversation not found.' });
    return;
  }

  const schema = z.object({
    status: z.enum(['open', 'resolved']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid status (open or resolved) is required.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE support_conversations SET status = ?, updated_at = ? WHERE id = ?').run(
    parsed.data.status,
    now,
    req.params.id
  );

  const updatedRow = db
    .prepare('SELECT * FROM support_conversations WHERE id = ?')
    .get(req.params.id) as Record<string, unknown>;
  const mapped = mapSupportConversation(updatedRow);
  emitSupportWs(String(req.params.id), 'support:conversation_updated', mapped);
  res.json({ conversation: mapped });
});

// ---------- Administrator Dashboard APIs (/api/admin/*) ----------
app.get('/api/admin/overview', requireRole('admin'), (_req: AuthRequest, res: Response) => {
  const stats = getPublicStats();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newRegistrations = (
    db.prepare('SELECT COUNT(*) as c FROM users WHERE created_at >= ?').get(sevenDaysAgo) as { c: number }
  ).c;
  const pushSubscribers = (
    db.prepare('SELECT COUNT(*) as c FROM push_subscriptions WHERE COALESCE(active, 1) = 1').get() as {
      c: number;
    }
  ).c;

  const totalApplications = (
    db.prepare('SELECT COUNT(*) as c FROM membership_applications').get() as { c: number }
  ).c;
  const pendingApplications = (
    db
      .prepare("SELECT COUNT(*) as c FROM membership_applications WHERE status = 'pending'")
      .get() as { c: number }
  ).c;
  const approvedApplications = (
    db
      .prepare("SELECT COUNT(*) as c FROM membership_applications WHERE status = 'approved'")
      .get() as { c: number }
  ).c;
  const activePremiumMembers = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM users
         WHERE LOWER(email) != ?
           AND status = 'active'
           AND (membership_expires_at IS NULL OR membership_expires_at = '' OR datetime(membership_expires_at) > datetime('now'))`
      )
      .get(DESIGNATED_ADMIN_EMAIL) as { c: number }
  ).c;
  const unreadCustomerChat = (
    db.prepare('SELECT COALESCE(SUM(unread_admin), 0) as c FROM support_conversations').get() as {
      c: number;
    }
  ).c;
  const newContacts = (
    db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'new'").get() as {
      c: number;
    }
  ).c;
  const totalConversations = (
    db.prepare('SELECT COUNT(*) as c FROM support_conversations').get() as { c: number }
  ).c;
  const totalContacts = (
    db.prepare('SELECT COUNT(*) as c FROM contact_messages').get() as { c: number }
  ).c;

  const dispatchLogs = db
    .prepare('SELECT * FROM push_dispatch_logs ORDER BY created_at DESC LIMIT 20')
    .all();
  const pushJobs = listRecentPushJobs(20);
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
      total_applications: totalApplications,
      pending_applications: pendingApplications,
      approved_applications: approvedApplications,
      active_premium_members: activePremiumMembers,
      unread_customer_messages: unreadCustomerChat + newContacts,
      total_enquiries: totalConversations + totalContacts,
    },
    dispatch_logs: dispatchLogs,
    push_jobs: pushJobs,
    system_logs: systemLogs,
    backups,
    student_progress: studentProgress,
  });
});

app.get('/api/admin/push-jobs/:id', requireRole('admin'), (req: Request, res: Response) => {
  const job = getPushJobSummary(String(req.params.id));
  if (!job) {
    res.status(404).json({ error: 'Push job not found.' });
    return;
  }
  res.json({ job });
});

app.get('/api/admin/push-subscriptions', requireRole('admin'), (_req: Request, res: Response) => {
  res.json({
    ...listPushSubscriptions(100),
    infrastructure: getPushInfrastructureStatus(),
  });
});

app.get('/api/admin/push-diagnostics', requireRole('admin'), (_req: Request, res: Response) => {
  const subsData = listPushSubscriptions(100);
  res.json({
    infrastructure: getPushInfrastructureStatus(),
    summary: subsData.summary,
    subscriptions: subsData.subscriptions,
    jobs: listRecentPushJobs(30),
    deliveries: listRecentPushDeliveries(40),
  });
});

app.post('/api/admin/push/test-all', requireRole('admin'), async (_req: Request, res: Response) => {
  const now = new Date().toISOString();
  const result = await dispatchNotification({
    title: 'MeridianFX · Test Notification',
    body: 'Administrator live push test — tapping opens the MeridianFX Signals Channel.',
    category: 'announcements',
    linkUrl: '/signals',
    priority: 'urgent',
    forceShow: true,
    respectPrefs: false,
    sound: true,
    publishedAt: now,
    dedupKey: `admin_test:${Date.now()}`,
    broadcastWs,
  });
  res.status(201).json({
    ok: true,
    push_job: result.push_job,
    targeted: result.targetedSubscriptions,
    delivered: result.delivered,
    confirmed: result.confirmed,
    failed: result.failed,
  });
});

app.post('/api/admin/push-subscriptions/prune', requireRole('admin'), (req: Request, res: Response) => {
  const daysRaw = Number(req.body?.older_than_days ?? 0);
  const days = Number.isFinite(daysRaw) && daysRaw >= 0 ? daysRaw : 0;
  const result = cleanupInactivePushSubscriptions(days);
  res.json({ ok: true, ...result });
});

app.get('/api/admin/users', requireRole('admin'), (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as Array<
    Record<string, unknown>
  >;
  res.json({ users: rows.map(mapDbUser) });
});

function buildRegistrationAnalytics() {
  const rows = db
    .prepare('SELECT * FROM users WHERE LOWER(email) != ? ORDER BY created_at DESC')
    .all(DESIGNATED_ADMIN_EMAIL) as Array<Record<string, unknown>>;

  const records = rows.map(mapDbUser);
  const now = new Date();
  const todayUtcKey = now.toISOString().slice(0, 10);
  const ms7d = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const ms30d = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let activeUsers = 0;
  let suspendedUsers = 0;
  let verifiedUsers = 0;
  let unverifiedUsers = 0;
  let newToday = 0;
  let new7d = 0;
  let new30d = 0;

  const dailyCounts = new Map<string, number>();
  const weeklyCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();

  const getMondayKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
  };

  for (const u of records) {
    if (u.status === 'active') activeUsers += 1;
    else suspendedUsers += 1;
    if (u.email_verified) verifiedUsers += 1;
    else unverifiedUsers += 1;

    const createdMs = new Date(u.created_at).getTime();
    if (u.created_at.slice(0, 10) === todayUtcKey) newToday += 1;
    if (createdMs >= ms7d) new7d += 1;
    if (createdMs >= ms30d) new30d += 1;

    const dObj = new Date(u.created_at);
    if (!Number.isNaN(dObj.getTime())) {
      const dayKey = dObj.toISOString().slice(0, 10);
      dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);

      const weekKey = getMondayKey(dObj);
      weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);

      const monthKey = dObj.toISOString().slice(0, 7);
      monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
    }
  }

  const daily: Array<{ key: string; label: string; count: number }> = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    daily.push({ key, label, count: dailyCounts.get(key) || 0 });
  }

  const weekly: Array<{ key: string; label: string; count: number }> = [];
  const currentMonday = new Date(`${getMondayKey(now)}T00:00:00.000Z`);
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(currentMonday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    weekly.push({ key, label, count: weeklyCounts.get(key) || 0 });
  }

  const monthly: Array<{ key: string; label: string; count: number }> = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    monthly.push({ key, label, count: monthlyCounts.get(key) || 0 });
  }

  return {
    summary: {
      total_users: records.length,
      active_users: activeUsers,
      suspended_users: suspendedUsers,
      verified_users: verifiedUsers,
      unverified_users: unverifiedUsers,
      new_today: newToday,
      new_7d: new7d,
      new_30d: new30d,
    },
    trends: { daily, weekly, monthly },
    records,
  };
}

app.get('/api/admin/registrations', requireRole('admin'), (_req: Request, res: Response) => {
  res.json(buildRegistrationAnalytics());
});

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

app.get('/api/admin/registrations/export', requireRole('admin'), (_req: Request, res: Response) => {
  const analytics = buildRegistrationAnalytics();
  const headers = [
    'User ID',
    'Name',
    'Email',
    'Role',
    'Status',
    'Email Verified',
    'Timezone',
    'Bio',
    'Registered At (UTC)',
    'Last Login At (UTC)',
  ];
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const r of analytics.records) {
    lines.push(
      [
        r.id,
        r.name,
        r.email,
        r.role,
        r.status,
        r.email_verified ? 'Verified' : 'Unverified',
        r.timezone || 'UTC',
        r.bio || '',
        r.created_at,
        r.last_login_at || '',
      ]
        .map((v) => escapeCsvCell(String(v)))
        .join(',')
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="meridianfx-registrations-${stamp}.csv"`);
  res.send(lines.join('\r\n'));
});

function generateTemporaryPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = letters + digits + symbols;
  const pick = (pool: string) => pool[crypto.randomInt(0, pool.length)];
  const chars = [
    pick('ABCDEFGHJKLMNPQRSTUVWXYZ'),
    pick('abcdefghijkmnopqrstuvwxyz'),
    pick(digits),
    pick(symbols),
  ];
  for (let i = 0; i < 8; i += 1) {
    chars.push(pick(all));
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function normalizeOptionalExpiry(raw?: string | null): string | null | 'invalid' {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Support YYYY-MM-DD date input by setting end of that UTC day
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T23:59:59.999Z` : trimmed;
  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) return 'invalid';
  return new Date(ms).toISOString();
}

function buildAdminMembersPayload() {
  const rows = db
    .prepare('SELECT * FROM users WHERE LOWER(email) != ? ORDER BY created_at DESC')
    .all(DESIGNATED_ADMIN_EMAIL) as Array<Record<string, unknown>>;
  const members = rows.map(mapDbUser);

  let activeMembers = 0;
  let suspendedMembers = 0;
  let expiredMembers = 0;

  for (const m of members) {
    const expired = isUserMembershipExpired(m);
    if (m.status === 'suspended') {
      suspendedMembers += 1;
    } else if (expired) {
      expiredMembers += 1;
    } else {
      activeMembers += 1;
    }
  }

  return {
    summary: {
      total_members: members.length,
      active_members: activeMembers,
      suspended_members: suspendedMembers,
      expired_members: expiredMembers,
      inactive_members: suspendedMembers + expiredMembers,
    },
    members,
  };
}

app.get('/api/admin/members', requireRole('admin'), (_req: Request, res: Response) => {
  res.json(buildAdminMembersPayload());
});

app.post('/api/admin/members', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().trim().min(2, 'Member name must be at least 2 characters.').max(80),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, or hyphens.'),
    email: z.string().trim().email('Please enter a valid email address.').max(160),
    password: z.string().max(128).optional(),
    status: z.enum(['active', 'suspended']).default('active'),
    membership_expires_at: z.string().nullable().optional(),
    membership_notes: z.string().max(500).nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid member details.' });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const username = parsed.data.username.trim().toLowerCase();
  if (email === DESIGNATED_ADMIN_EMAIL) {
    res.status(400).json({ error: 'Cannot create a member with the designated administrator email.' });
    return;
  }

  const dupEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email) as
    | { id: string }
    | undefined;
  if (dupEmail) {
    res.status(409).json({ error: 'A member account with this email address already exists.' });
    return;
  }

  const dupUsername = db
    .prepare('SELECT id FROM users WHERE username IS NOT NULL AND LOWER(username) = ?')
    .get(username) as { id: string } | undefined;
  if (dupUsername) {
    res.status(409).json({ error: 'This username is already assigned to another member.' });
    return;
  }

  const expiry = normalizeOptionalExpiry(parsed.data.membership_expires_at);
  if (expiry === 'invalid') {
    res.status(400).json({ error: 'Invalid membership expiry date.' });
    return;
  }

  const rawPassword = (parsed.data.password || '').trim() || generateTemporaryPassword();
  const pwError = validateStrongPassword(rawPassword);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO users (
      id, name, username, email, password_hash, role, status, email_verified,
      membership_expires_at, membership_notes, needs_password_setup,
      terms_accepted_at, timezone, created_at
    ) VALUES (?, ?, ?, ?, ?, 'user', ?, 1, ?, ?, 1, ?, 'UTC', ?)`
  ).run(
    id,
    parsed.data.name,
    username,
    email,
    hashPassword(rawPassword),
    parsed.data.status,
    expiry,
    parsed.data.membership_notes?.trim() || null,
    now,
    now
  );

  logUserActivity(id, 'Membership Created', `Premium member account provisioned by ${req.user!.name}.`, req.ip);
  const createdRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json({
    member: mapDbUser(createdRow),
    temporary_password: rawPassword,
  });
});

app.patch('/api/admin/members/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'Member account not found.' });
    return;
  }
  if (String(target.email).toLowerCase() === DESIGNATED_ADMIN_EMAIL) {
    res.status(400).json({ error: 'Designated administrator account cannot be modified here.' });
    return;
  }

  const schema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, or hyphens.')
      .optional(),
    email: z.string().trim().email().max(160).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    membership_expires_at: z.string().nullable().optional(),
    membership_notes: z.string().max(500).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid member update fields.' });
    return;
  }

  const d = parsed.data;
  const nextEmail = d.email ? d.email.trim().toLowerCase() : String(target.email).toLowerCase();
  if (nextEmail === DESIGNATED_ADMIN_EMAIL) {
    res.status(400).json({ error: 'Cannot assign designated administrator email to a member.' });
    return;
  }

  if (d.email && nextEmail !== String(target.email).toLowerCase()) {
    const dupEmail = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?')
      .get(nextEmail, req.params.id);
    if (dupEmail) {
      res.status(409).json({ error: 'Another member already uses that email address.' });
      return;
    }
  }

  const nextUsername =
    d.username !== undefined
      ? d.username.trim().toLowerCase()
      : target.username
        ? String(target.username).toLowerCase()
        : null;
  if (d.username !== undefined && nextUsername) {
    const dupUser = db
      .prepare('SELECT id FROM users WHERE username IS NOT NULL AND LOWER(username) = ? AND id != ?')
      .get(nextUsername, req.params.id);
    if (dupUser) {
      res.status(409).json({ error: 'Another member already uses that username.' });
      return;
    }
  }

  let nextExpiry: string | null = target.membership_expires_at ? String(target.membership_expires_at) : null;
  if (d.membership_expires_at !== undefined) {
    const resolvedExpiry = normalizeOptionalExpiry(d.membership_expires_at);
    if (resolvedExpiry === 'invalid') {
      res.status(400).json({ error: 'Invalid membership expiry date.' });
      return;
    }
    nextExpiry = resolvedExpiry;
  }

  const nextStatus = d.status ?? (String(target.status) as 'active' | 'suspended');
  db.prepare(
    `UPDATE users SET
      name = ?,
      username = ?,
      email = ?,
      role = 'user',
      status = ?,
      email_verified = 1,
      membership_expires_at = ?,
      membership_notes = ?
     WHERE id = ?`
  ).run(
    d.name ?? target.name,
    nextUsername,
    nextEmail,
    nextStatus,
    nextExpiry,
    d.membership_notes !== undefined ? d.membership_notes?.trim() || null : target.membership_notes ?? null,
    req.params.id
  );

  const nowExpired = isUserMembershipExpired({ role: 'user', membership_expires_at: nextExpiry });
  if (nextStatus === 'suspended' || nowExpired) {
    revokeAllUserSessions(String(req.params.id));
  }

  logUserActivity(
    String(req.params.id),
    'Membership Updated',
    `Updated by administrator (${nextStatus}${nextExpiry ? `, expires ${nextExpiry.slice(0, 10)}` : ''}).`,
    req.ip
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  res.json({ member: mapDbUser(updated) });
});

app.post('/api/admin/members/:id/reset-password', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'Member account not found.' });
    return;
  }
  if (String(target.email).toLowerCase() === DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Designated administrator credentials cannot be reset via member tools.' });
    return;
  }

  const rawProvided = typeof req.body?.new_password === 'string' ? req.body.new_password.trim() : '';
  const temporaryPassword = rawProvided || generateTemporaryPassword();
  const pwError = validateStrongPassword(temporaryPassword);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }

  db.prepare('UPDATE users SET password_hash = ?, needs_password_setup = 1 WHERE id = ?').run(
    hashPassword(temporaryPassword),
    req.params.id
  );
  revokeAllUserSessions(String(req.params.id));
  logUserActivity(
    String(req.params.id),
    'Password Reset by Admin',
    `Temporary password assigned by ${req.user!.name}.`,
    req.ip
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as Record<
    string,
    unknown
  >;
  res.json({
    ok: true,
    temporary_password: temporaryPassword,
    member: mapDbUser(updated),
  });
});

app.delete('/api/admin/members/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id) as
    | { id: string; email: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'Member account not found.' });
    return;
  }
  if (target.id === req.user!.id || target.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL) {
    res.status(403).json({ error: 'The administrator account cannot be deleted.' });
    return;
  }

  revokeAllUserSessions(target.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ ok: true });
});

app.get('/api/admin/members/export', requireRole('admin'), (_req: Request, res: Response) => {
  const payload = buildAdminMembersPayload();
  const headers = [
    'Member ID',
    'Name',
    'Username',
    'Email',
    'Account Status',
    'Membership Access',
    'Expiry Date (UTC)',
    'Notes',
    'Registered At (UTC)',
    'Last Sign In (UTC)',
  ];
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const m of payload.members) {
    lines.push(
      [
        m.id,
        m.name,
        m.username || '',
        m.email,
        m.status,
        m.membership_active ? 'Active' : m.status === 'suspended' ? 'Suspended' : 'Expired',
        m.membership_expires_at || 'No expiry',
        m.membership_notes || '',
        m.created_at,
        m.last_login_at || '',
      ]
        .map((v) => escapeCsvCell(String(v)))
        .join(',')
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="meridianfx-members-${stamp}.csv"`);
  res.send(lines.join('\r\n'));
});

app.patch('/api/admin/users/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const schema = z.object({
    role: z.enum(['user', 'admin']).optional(),
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

  if (
    String(target.email).toLowerCase() === DESIGNATED_ADMIN_EMAIL &&
    ((parsed.data.role && parsed.data.role !== 'admin') || parsed.data.status === 'suspended')
  ) {
    res.status(400).json({ error: 'Cannot revoke privileges from the designated primary administrator account.' });
    return;
  }

  if (parsed.data.role === 'admin' && String(target.email).toLowerCase() !== DESIGNATED_ADMIN_EMAIL) {
    res.status(400).json({ error: 'Only the designated administrator account can hold the admin role.' });
    return;
  }

  db.prepare('UPDATE users SET role = ?, status = ?, email_verified = ? WHERE id = ?').run(
    parsed.data.role ?? target.role,
    parsed.data.status ?? target.status,
    parsed.data.email_verified !== undefined ? (parsed.data.email_verified ? 1 : 0) : target.email_verified,
    req.params.id
  );

  if (parsed.data.status === 'suspended' || (parsed.data.role && parsed.data.role !== target.role)) {
    revokeAllUserSessions(String(req.params.id));
  }

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
      'signal_chat',
      'market_updates',
      'academy',
      'economic_calendar',
      'announcements',
    ]),
    link_url: z.string().max(200).optional(),
    image_url: z.string().max(500).optional().nullable(),
    target_group: z.enum(['all', 'registered', 'verified', 'admins_mods', 'selected']).optional(),
    target_user_ids: z.array(z.string()).optional().nullable(),
    respect_prefs: z.boolean().optional(),
    sound: z.boolean().optional(),
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

  const now = new Date().toISOString();
  const result = await dispatchNotification({
    title: d.title,
    body: d.body,
    category: d.category as PushCategory,
    linkUrl: d.link_url || '/signals',
    imageUrl: d.image_url || null,
    targetGroup: (d.target_group || (d.target_user_ids?.length ? 'selected' : 'all')) as PushTargetGroup,
    targetUserIds: d.target_user_ids && d.target_user_ids.length > 0 ? d.target_user_ids : null,
    respectPrefs: d.respect_prefs !== false,
    sound: d.sound !== false,
    publishedAt: now,
    broadcastWs,
  });

  res.status(201).json({ scheduled: false, result, push_job: result.push_job });
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
    'contact_whatsapp',
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

// Unmatched /api/* routes return JSON 404 rather than falling through to SPA HTML
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global API Error Handler
app.use('/api', (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logSystemEvent('error', 'api', err.message || 'Unhandled API error');
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Background Scheduler: Scheduled Market Updates, Scheduled Push Notifications, Periodic Backups
let lastAutoBackupDay = '';
if (!process.env.VERCEL) {
  setInterval(async () => {
    const nowIso = new Date().toISOString();

    try {
      // 1. Publish due scheduled market updates
      const dueUpdates = db
        .prepare('SELECT * FROM market_updates WHERE published = 0 AND scheduled_at IS NOT NULL AND scheduled_at <= ?')
        .all(nowIso) as Array<Record<string, unknown>>;

      for (const u of dueUpdates) {
        const uid = String(u.id);
        const isPremium = Boolean(u.is_premium);
        db.prepare('UPDATE market_updates SET published = 1, updated_at = ? WHERE id = ?').run(nowIso, uid);
        const hydrated = {
          ...u,
          pinned: Boolean(u.pinned),
          published: true,
          is_premium: isPremium,
          reactions: {},
          user_reacted: [],
          bookmarked: false,
        };
        if (!isPremium) {
          broadcastWs('update:created', hydrated);
        }

        const category = String(u.category || 'Market Update');
        const isAnnouncement =
          category === 'Platform Announcement' || category === 'Risk Warning';
        const mirrorContent = [
          `${category}: ${String(u.title)}`,
          String(u.content),
          u.external_link ? `Reference: ${String(u.external_link)}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');

        const mirrored = !isPremium
          ? publishMirrorToSignalChannel({
              sourceType: 'market_update',
              sourceId: uid,
              authorName: String(u.author_name || 'MeridianFX'),
              messageType: isAnnouncement ? 'announcement' : 'update',
              content: mirrorContent,
              imageUrl: u.image_url ? String(u.image_url) : null,
              imageName: String(u.title),
              pinned: Boolean(u.pinned),
              createdAt: nowIso,
            })
          : null;

        await syncMarketUpdateToRemote(uid);

        await dispatchNotification({
          title: `${isPremium ? '[Premium] ' : ''}${category}: ${String(u.title)}`,
          body: String(u.content).slice(0, 140),
          category: isAnnouncement ? 'announcements' : 'market_updates',
          linkUrl: '/updates',
          signalMessageId: mirrored?.message.id || null,
          imageUrl: u.image_url ? String(u.image_url) : null,
          targetGroup: isPremium ? 'registered' : 'all',
          publishedAt: nowIso,
          dedupKey: `market_update:${uid}`,
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
          category: n.category as PushCategory,
          linkUrl: n.link_url,
          targetUserIds: n.target_user_ids ? (JSON.parse(n.target_user_ids) as string[]) : null,
          publishedAt: nowIso,
          dedupKey: `scheduled_notif:${n.id}`,
          broadcastWs,
        });
      }

      // 2.5 Publish due scheduled Academy lessons
      const dueLessons = db
        .prepare("SELECT * FROM lessons WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?")
        .all(nowIso) as Array<Record<string, unknown>>;

      for (const l of dueLessons) {
        db.prepare("UPDATE lessons SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?").run(
          nowIso,
          nowIso,
          String(l.id)
        );
        broadcastWs('academy:updated', { type: 'lesson_published', id: String(l.id) });
        await dispatchNotification({
          title: `New Academy Lesson: ${String(l.title)}`,
          body: `${String(l.category)} lesson is now available in the Trading Academy.`,
          category: 'academy',
          linkUrl: '/academy',
          publishedAt: nowIso,
          dedupKey: `lesson_publish:${String(l.id)}`,
          broadcastWs,
        });
      }

      // 3. Automated daily backup snapshot & expired auth cleanup
      const today = nowIso.slice(0, 10);
      if (today !== lastAutoBackupDay) {
        createDatabaseBackup();
        cleanupExpiredAuthRecords();
        lastAutoBackupDay = today;
      }
    } catch (err) {
      logSystemEvent('error', 'scheduler', String(err));
    }
  }, 30_000);

  // Fast 10-second Push Delivery Retry Worker (zero duplicates guaranteed via SQLite delivery state)
  setInterval(async () => {
    try {
      await processPendingPushDeliveries({ broadcastWs });
    } catch (err) {
      logSystemEvent('error', 'push-worker', String(err));
    }
  }, 10_000);
}

// ---------- Frontend Serving (Vite Dev Middleware vs Production Static) ----------
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

async function startServer() {
  if (!isProduction) {
    const viteModuleName = 'vite';
    const { createServer: createViteServer } = (await import(
      /* @vite-ignore */ viteModuleName
    )) as typeof import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer, path: '/__vite_hmr' },
        hmr: !hmrDisabled,
        watch: hmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MeridianFX server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
