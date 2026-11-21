import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';
import type { User, UserRole } from '../src/types.ts';

export interface AuthRequest extends Request {
  user?: User;
}

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET;
  }
  const row = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('jwt_secret') as { value: string } | undefined;
  if (row?.value) return row.value;
  const fallback = crypto.randomBytes(48).toString('hex');
  db.prepare('INSERT OR REPLACE INTO platform_settings (key, value) VALUES (?, ?)').run(
    'jwt_secret',
    fallback
  );
  return fallback;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function signToken(payload: { sub: string; role: UserRole }, expiresInSec = 60 * 60 * 24 * 14): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSec,
    })
  );
  const sig = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${header}.${body}`)
    .digest();
  return `${header}.${body}.${base64UrlEncode(sig)}`;
}

export function verifyToken(token: string): { sub: string; role: UserRole; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = base64UrlEncode(
      crypto.createHmac('sha256', getJwtSecret()).update(`${header}.${body}`).digest()
    );
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(base64UrlDecode(body)) as { sub: string; role: UserRole; exp: number };
    if (!decoded.sub || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

export const DEFAULT_NOTIFICATION_PREFS = {
  signals: true,
  signal_updates: true,
  signal_chat: true,
  market_updates: true,
  academy: true,
  economic_calendar: true,
  announcements: true,
  sound_enabled: true,
};

export function normalizeNotificationPrefs(raw: unknown) {
  let parsed: Record<string, unknown> = {};
  if (typeof raw === 'string' && raw.trim()) {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (raw && typeof raw === 'object') {
    parsed = raw as Record<string, unknown>;
  }
  return {
    signals: parsed.signals !== false,
    signal_updates: parsed.signal_updates !== false,
    signal_chat: parsed.signal_chat !== false,
    market_updates: parsed.market_updates !== false,
    academy: parsed.academy !== false,
    economic_calendar: parsed.economic_calendar !== false,
    announcements: parsed.announcements !== false,
    sound_enabled: parsed.sound_enabled !== false,
  };
}

export function mapDbUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as UserRole,
    status: row.status as 'active' | 'suspended',
    email_verified: Boolean(row.email_verified),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    bio: row.bio ? String(row.bio) : null,
    timezone: row.timezone ? String(row.timezone) : 'UTC',
    notification_prefs: normalizeNotificationPrefs(row.notification_prefs),
    watchlist: JSON.parse(String(row.watchlist || '[]')),
    created_at: String(row.created_at),
    last_login_at: row.last_login_at ? String(row.last_login_at) : null,
  };
}

export interface AuthContext {
  user?: User;
  token?: string;
  source?: 'bearer' | 'cookie';
  expiresAt?: number;
}

export function signVisitorCookie(visitorId: string): string {
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(`vid:${visitorId}`).digest()
  );
  return `${visitorId}.${sig}`;
}

export function verifyVisitorCookie(cookieValue?: string): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [visitorId, sig] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
    return null;
  }
  const expected = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(`vid:${visitorId}`).digest()
  );
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  return visitorId;
}

export function extractAuthContext(req: Request): AuthContext {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const rawBearer =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const bearerToken =
    rawBearer && rawBearer !== 'null' && rawBearer !== 'undefined' ? rawBearer : '';
  const cookieToken =
    cookies['mfx_session'] &&
    cookies['mfx_session'] !== 'null' &&
    cookies['mfx_session'] !== 'undefined'
      ? cookies['mfx_session']
      : '';

  const candidates: Array<{ token: string; source: 'bearer' | 'cookie' }> = [];
  if (bearerToken) candidates.push({ token: bearerToken, source: 'bearer' });
  if (cookieToken && cookieToken !== bearerToken) {
    candidates.push({ token: cookieToken, source: 'cookie' });
  }

  for (const candidate of candidates) {
    const claims = verifyToken(candidate.token);
    if (!claims) continue;

    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(claims.sub) as Record<string, unknown> | undefined;
    if (!row || row.status === 'suspended') continue;

    return {
      user: mapDbUser(row),
      token: candidate.token,
      source: candidate.source,
      expiresAt: claims.exp,
    };
  }

  return {};
}

function extractUserFromRequest(req: Request): User | undefined {
  return extractAuthContext(req).user;
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  req.user = extractUserFromRequest(req);
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user ?? extractUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    req.user = user;
    next();
  };
}

// Sliding window rate limiter
const rateBuckets = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'unknown'}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const arr = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (arr.length >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
      return;
    }
    arr.push(now);
    rateBuckets.set(key, arr);
    next();
  };
}

export function logUserActivity(userId: string, action: string, details: string, ip?: string): void {
  db.prepare(
    'INSERT INTO user_activity (id, user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), userId, action, details, ip || '', new Date().toISOString());
}
