import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { DESIGNATED_ADMIN_EMAIL, db } from './db.ts';
import type { User, UserRole } from '../src/types.ts';

export const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 minutes
export const REFRESH_REMEMBER_TTL_SEC = 30 * 24 * 60 * 60; // 30 days
export const REFRESH_SESSION_TTL_SEC = 12 * 60 * 60; // 12 hours when Remember Me is unchecked
export const REFRESH_ROTATION_GRACE_MS = 15_000; // 15s grace for concurrent tab reloads

export interface AuthRequest extends Request {
  user?: User;
  authContext?: AuthContext;
}

let cachedJwtSecret: string | null = null;

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET;
  }
  if (cachedJwtSecret) return cachedJwtSecret;

  const row = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('jwt_secret') as { value: string } | undefined;
  if (row?.value) {
    cachedJwtSecret = row.value;
    return cachedJwtSecret;
  }

  const fallback = crypto.randomBytes(48).toString('hex');
  db.prepare('INSERT OR IGNORE INTO platform_settings (key, value) VALUES (?, ?)').run(
    'jwt_secret',
    fallback
  );
  const resolved = db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .get('jwt_secret') as { value: string } | undefined;
  cachedJwtSecret = resolved?.value || fallback;
  return cachedJwtSecret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueRefreshToken(): string {
  return `mfx_rt_${crypto.randomBytes(48).toString('hex')}`;
}

export function validateStrongPassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

export interface AccessJwtClaims {
  sub: string;
  role: UserRole;
  sid: string;
  jti: string;
  typ: 'access';
  iat: number;
  exp: number;
}

export function signAccessToken(
  payload: { sub: string; role: UserRole; sid: string; jti?: string },
  expiresInSec = ACCESS_TOKEN_TTL_SEC
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      sub: payload.sub,
      role: payload.role,
      sid: payload.sid,
      jti: payload.jti || crypto.randomUUID(),
      typ: 'access',
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

export function verifyAccessToken(token: string): AccessJwtClaims | null {
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
    const decoded = JSON.parse(base64UrlDecode(body)) as AccessJwtClaims;
    if (
      !decoded.sub ||
      !decoded.sid ||
      decoded.typ !== 'access' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  refreshExpiresAt: string;
  rememberMe: boolean;
}

export function createAuthSession(
  userId: string,
  role: UserRole,
  options?: { rememberMe?: boolean; userAgent?: string; ip?: string }
): AuthSessionResult {
  const rememberMe = options?.rememberMe !== false;
  const ttlSec = rememberMe ? REFRESH_REMEMBER_TTL_SEC : REFRESH_SESSION_TTL_SEC;
  const sessionId = crypto.randomUUID();
  const refreshToken = generateOpaqueRefreshToken();
  const refreshHash = hashToken(refreshToken);

  const now = new Date();
  const nowIso = now.toISOString();
  const refreshExpiresAt = new Date(now.getTime() + ttlSec * 1000).toISOString();

  db.prepare(
    `INSERT INTO user_sessions (
      id, user_id, refresh_token_hash, prev_refresh_token_hash, prev_grace_until,
      remember_me, user_agent, ip_address, created_at, last_seen_at, expires_at, revoked_at
    ) VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, NULL)`
  ).run(
    sessionId,
    userId,
    refreshHash,
    rememberMe ? 1 : 0,
    (options?.userAgent || '').slice(0, 250),
    (options?.ip || '').slice(0, 80),
    nowIso,
    nowIso,
    refreshExpiresAt
  );

  const accessToken = signAccessToken(
    { sub: userId, role, sid: sessionId },
    ACCESS_TOKEN_TTL_SEC
  );

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    refreshExpiresAt,
    rememberMe,
  };
}

export interface RotateRefreshResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  rememberMe: boolean;
  rotated: boolean;
}

export function rotateRefreshSession(
  rawRefreshToken: string,
  meta?: { userAgent?: string; ip?: string; blockAdmin?: boolean; requireAdmin?: boolean }
): RotateRefreshResult | null {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string' || rawRefreshToken.length < 24) {
    return null;
  }

  const tokenHash = hashToken(rawRefreshToken);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const session = db
    .prepare(
      `SELECT id, user_id, refresh_token_hash, prev_refresh_token_hash, prev_grace_until,
              remember_me, expires_at, revoked_at
       FROM user_sessions
       WHERE refresh_token_hash = ? OR prev_refresh_token_hash = ?
       LIMIT 1`
    )
    .get(tokenHash, tokenHash) as
    | {
        id: string;
        user_id: string;
        refresh_token_hash: string | null;
        prev_refresh_token_hash: string | null;
        prev_grace_until: string | null;
        remember_me: number;
        expires_at: string;
        revoked_at: string | null;
      }
    | undefined;

  if (!session || session.revoked_at || session.expires_at <= nowIso) {
    return null;
  }

  const userRow = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(session.user_id) as Record<string, unknown> | undefined;

  if (!userRow || userRow.status === 'suspended' || isUserMembershipExpired(userRow)) {
    return null;
  }

  const user = mapDbUser(userRow);
  const isDesignatedAdmin =
    user.role === 'admin' && user.email.toLowerCase() === DESIGNATED_ADMIN_EMAIL;
  if (meta?.blockAdmin && (isDesignatedAdmin || user.role === 'admin')) {
    return null;
  }
  if (meta?.requireAdmin && !isDesignatedAdmin) {
    return null;
  }
  const rememberMe = Boolean(session.remember_me);

  // Concurrent-tab grace check if matched via previous refresh token
  if (session.refresh_token_hash !== tokenHash) {
    const withinGrace = Boolean(
      session.prev_refresh_token_hash === tokenHash &&
        session.prev_grace_until &&
        session.prev_grace_until > nowIso
    );
    if (!withinGrace) {
      // Refresh token replay detected outside grace window: revoke the entire session
      db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(
        nowIso,
        session.id
      );
      return null;
    }

    const accessToken = signAccessToken(
      { sub: user.id, role: user.role, sid: session.id },
      ACCESS_TOKEN_TTL_SEC
    );
    return {
      user,
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: session.id,
      expiresIn: ACCESS_TOKEN_TTL_SEC,
      rememberMe,
      rotated: false,
    };
  }

  // Rotate refresh token atomically with 15s grace on previous hash
  const nextRefreshToken = generateOpaqueRefreshToken();
  const nextHash = hashToken(nextRefreshToken);
  const graceUntilIso = new Date(nowMs + REFRESH_ROTATION_GRACE_MS).toISOString();
  const ttlSec = rememberMe ? REFRESH_REMEMBER_TTL_SEC : REFRESH_SESSION_TTL_SEC;
  const nextExpiresAt = new Date(nowMs + ttlSec * 1000).toISOString();

  const updateRes = db
    .prepare(
      `UPDATE user_sessions
       SET prev_refresh_token_hash = refresh_token_hash,
           prev_grace_until = ?,
           refresh_token_hash = ?,
           last_seen_at = ?,
           expires_at = ?,
           user_agent = COALESCE(NULLIF(?, ''), user_agent),
           ip_address = COALESCE(NULLIF(?, ''), ip_address)
       WHERE id = ? AND refresh_token_hash = ? AND revoked_at IS NULL`
    )
    .run(
      graceUntilIso,
      nextHash,
      nowIso,
      nextExpiresAt,
      (meta?.userAgent || '').slice(0, 250),
      (meta?.ip || '').slice(0, 80),
      session.id,
      tokenHash
    );

  if (updateRes.changes === 0) {
    // Another request concurrently rotated this session; verify if grace applies
    const latest = db
      .prepare('SELECT prev_refresh_token_hash, prev_grace_until, revoked_at FROM user_sessions WHERE id = ?')
      .get(session.id) as
      | { prev_refresh_token_hash: string | null; prev_grace_until: string | null; revoked_at: string | null }
      | undefined;
    if (
      latest &&
      !latest.revoked_at &&
      latest.prev_refresh_token_hash === tokenHash &&
      latest.prev_grace_until &&
      latest.prev_grace_until > nowIso
    ) {
      const accessToken = signAccessToken(
        { sub: user.id, role: user.role, sid: session.id },
        ACCESS_TOKEN_TTL_SEC
      );
      return {
        user,
        accessToken,
        refreshToken: rawRefreshToken,
        sessionId: session.id,
        expiresIn: ACCESS_TOKEN_TTL_SEC,
        rememberMe,
        rotated: false,
      };
    }
    return null;
  }

  const accessToken = signAccessToken(
    { sub: user.id, role: user.role, sid: session.id },
    ACCESS_TOKEN_TTL_SEC
  );

  return {
    user,
    accessToken,
    refreshToken: nextRefreshToken,
    sessionId: session.id,
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    rememberMe,
    rotated: true,
  };
}

export function revokeAccessToken(token?: string | null): void {
  if (!token || token === 'null' || token === 'undefined') return;
  const nowIso = new Date().toISOString();
  const claims = verifyAccessToken(token);
  const expiresAtIso = claims
    ? new Date(claims.exp * 1000).toISOString()
    : new Date(Date.now() + ACCESS_TOKEN_TTL_SEC * 1000).toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at, revoked_at)
     VALUES (?, ?, ?)`
  ).run(hashToken(token), expiresAtIso, nowIso);

  if (claims?.sid) {
    db.prepare(
      'UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL'
    ).run(nowIso, claims.sid);
  }
}

export function revokeRefreshToken(rawRefreshToken?: string | null): string | null {
  if (!rawRefreshToken || rawRefreshToken === 'null' || rawRefreshToken === 'undefined') {
    return null;
  }
  const nowIso = new Date().toISOString();
  const tokenHash = hashToken(rawRefreshToken);
  const row = db
    .prepare(
      `SELECT id, user_id FROM user_sessions
       WHERE refresh_token_hash = ? OR prev_refresh_token_hash = ?
       LIMIT 1`
    )
    .get(tokenHash, tokenHash) as { id: string; user_id: string } | undefined;

  if (row) {
    db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(
      nowIso,
      row.id
    );
    return row.user_id;
  }
  return null;
}

export function revokeAllUserSessions(userId: string, exceptSessionId?: string): void {
  const nowIso = new Date().toISOString();
  if (exceptSessionId) {
    db.prepare(
      'UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND id != ? AND revoked_at IS NULL'
    ).run(nowIso, userId, exceptSessionId);
  } else {
    db.prepare(
      'UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL'
    ).run(nowIso, userId);
    db.prepare('UPDATE users SET tokens_valid_after = ? WHERE id = ?').run(nowIso, userId);
  }
}

export function cleanupExpiredAuthRecords(): void {
  const nowIso = new Date().toISOString();
  db.prepare('DELETE FROM revoked_tokens WHERE expires_at <= ?').run(nowIso);
  db.prepare('DELETE FROM user_sessions WHERE expires_at <= ?').run(nowIso);
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const rawVal = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(rawVal);
    } catch {
      out[key] = rawVal;
    }
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

export function isUserMembershipExpired(row: {
  role?: unknown;
  membership_expires_at?: unknown;
}): boolean {
  if (String(row.role || '') === 'admin') return false;
  const raw = row.membership_expires_at ? String(row.membership_expires_at).trim() : '';
  if (!raw) return false;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) && ms <= Date.now();
}

export function isActivePremiumUser(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.status !== 'active') return false;
  return !isUserMembershipExpired(user);
}

export function mapDbUser(row: Record<string, unknown>): User {
  const expired = isUserMembershipExpired(row);
  const status = (row.status as 'active' | 'suspended') || 'active';
  return {
    id: String(row.id),
    name: String(row.name),
    username: row.username ? String(row.username) : null,
    email: String(row.email),
    role: row.role as UserRole,
    status,
    email_verified: Boolean(row.email_verified),
    membership_expires_at: row.membership_expires_at ? String(row.membership_expires_at) : null,
    membership_notes: row.membership_notes ? String(row.membership_notes) : null,
    needs_password_setup: Boolean(row.needs_password_setup),
    membership_active: String(row.role) === 'admin' || (status === 'active' && !expired),
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
  sid?: string;
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

export function extractBearerContext(rawBearer?: string | null): AuthContext {
  const bearerToken =
    rawBearer && rawBearer !== 'null' && rawBearer !== 'undefined' ? rawBearer.trim() : '';

  if (!bearerToken) return {};

  const claims = verifyAccessToken(bearerToken);
  if (!claims) return {};

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // 1. Reject explicitly revoked access tokens immediately
  const revoked = db
    .prepare('SELECT 1 FROM revoked_tokens WHERE token_hash = ? LIMIT 1')
    .get(hashToken(bearerToken));
  if (revoked) return {};

  // 2. Verify active, unrevoked session in DB
  const session = db
    .prepare('SELECT id, user_id, revoked_at, expires_at, last_seen_at FROM user_sessions WHERE id = ?')
    .get(claims.sid) as
    | { id: string; user_id: string; revoked_at: string | null; expires_at: string; last_seen_at: string }
    | undefined;
  if (!session || session.user_id !== claims.sub || session.revoked_at || session.expires_at <= nowIso) {
    return {};
  }

  if (nowMs - Date.parse(session.last_seen_at) > 5 * 60_000) {
    db.prepare('UPDATE user_sessions SET last_seen_at = ? WHERE id = ?').run(nowIso, session.id);
  }

  // 3. Load user and verify active status, membership expiry & password-reset token epoch
  const row = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(claims.sub) as Record<string, unknown> | undefined;
  if (!row || row.status === 'suspended' || isUserMembershipExpired(row)) return {};

  if (row.tokens_valid_after && typeof claims.iat === 'number') {
    const validAfterSec = Math.floor(Date.parse(String(row.tokens_valid_after)) / 1000);
    if (Number.isFinite(validAfterSec) && claims.iat < validAfterSec) {
      return {};
    }
  }

  return {
    user: mapDbUser(row),
    token: bearerToken,
    sid: claims.sid,
    expiresAt: claims.exp,
  };
}

export function extractAuthContext(req: Request): AuthContext {
  const authHeader = req.headers.authorization;
  const rawBearer =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return extractBearerContext(rawBearer);
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const ctx = extractAuthContext(req);
  req.authContext = ctx;
  req.user = ctx.user;
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const ctx = extractAuthContext(req);
  if (!ctx.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.authContext = ctx;
  req.user = ctx.user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const ctx = req.authContext ?? extractAuthContext(req);
    if (!ctx.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(ctx.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    req.authContext = ctx;
    req.user = ctx.user;
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
