const VISITOR_ID_KEY = 'mfx_visitor_id';
const LEGACY_STORAGE_KEYS = ['mfx_auth_token', 'mfx_token', 'mfx_cached_user_v1', 'mfx_installed_at_v1'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryVisitorId: string | null = null;
let memoryAccessToken: string | null = null;
let memoryAccessExpiresAt = 0;

let authRefreshHandler: (() => Promise<string | null>) | null = null;

export function clearLegacyAuthStorage(): void {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage access errors
  }
}

// Clear any stale legacy token/session artifacts on module boot
clearLegacyAuthStorage();

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateVisitorId(): string {
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored && UUID_RE.test(stored)) {
      memoryVisitorId = stored;
      return stored;
    }
    const created = memoryVisitorId && UUID_RE.test(memoryVisitorId) ? memoryVisitorId : generateUuidV4();
    memoryVisitorId = created;
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    if (!memoryVisitorId) memoryVisitorId = generateUuidV4();
    return memoryVisitorId;
  }
}


export function getAccessToken(): string | null {
  if (memoryAccessToken && memoryAccessToken.split('.').length === 3) {
    return memoryAccessToken;
  }
  return null;
}

export function getAccessTokenRemainingMs(): number {
  if (!memoryAccessToken || !memoryAccessExpiresAt) return 0;
  return Math.max(0, memoryAccessExpiresAt - Date.now());
}

export function setAccessToken(token: string | null, expiresInSec = 900): void {
  const valid = Boolean(token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3);
  if (valid && token) {
    memoryAccessToken = token;
    memoryAccessExpiresAt = Date.now() + Math.max(30, expiresInSec) * 1000;
  } else {
    memoryAccessToken = null;
    memoryAccessExpiresAt = 0;
  }
  clearLegacyAuthStorage();
}

export function clearAccessToken(): void {
  memoryAccessToken = null;
  memoryAccessExpiresAt = 0;
  clearLegacyAuthStorage();
}

export function setAuthRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  authRefreshHandler = handler;
}

function buildRequestHeaders(
  options: RequestInit,
  tokenOverride?: string | null
): Headers {
  const token = tokenOverride !== undefined ? tokenOverride : getAccessToken();
  const visitorId = getOrCreateVisitorId();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'MeridianFX');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (visitorId && !headers.has('X-Visitor-Id')) {
    headers.set('X-Visitor-Id', visitorId);
  }
  return headers;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isAuthEndpoint = url.startsWith('/api/auth/');
  const skipAutoRefresh =
    url.startsWith('/api/auth/login') ||
    url.startsWith('/api/auth/register') ||
    url.startsWith('/api/auth/refresh') ||
    url.startsWith('/api/auth/logout') ||
    url.startsWith('/api/auth/forgot-password') ||
    url.startsWith('/api/auth/reset-password');

  let res = await fetch(url, {
    ...options,
    headers: buildRequestHeaders(options),
    credentials: 'include',
    ...(isAuthEndpoint ? { cache: 'no-store' as RequestCache } : {}),
  });

  if (res.status === 401 && !skipAutoRefresh && authRefreshHandler) {
    const refreshedToken = await authRefreshHandler().catch(() => null);
    if (refreshedToken) {
      res = await fetch(url, {
        ...options,
        headers: buildRequestHeaders(options, refreshedToken),
        credentials: 'include',
        ...(isAuthEndpoint ? { cache: 'no-store' as RequestCache } : {}),
      });
    }
  }

  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAutoRefresh) {
      window.dispatchEvent(new CustomEvent('mfx:auth-expired'));
    }
    const errMsg = (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}

export async function uploadMediaFile(file: File): Promise<{
  url: string;
  original_name: string;
  mimetype: string;
  size: number;
}> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/api/upload', {
    method: 'POST',
    body: form,
  });
}

export function formatLocalDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatLocalDateTime(iso);
  } catch {
    return iso;
  }
}
