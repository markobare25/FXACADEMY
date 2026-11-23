import type { User } from '../types';

let adminAccessToken: string | null = null;
let adminAccessExpiresAt = 0;
let adminRefreshInFlight: Promise<{ user: User; token: string } | null> | null = null;

export function getAdminAccessToken(): string | null {
  if (adminAccessToken && adminAccessToken.split('.').length === 3) {
    return adminAccessToken;
  }
  return null;
}

export function getAdminAccessTokenRemainingMs(): number {
  if (!adminAccessToken || !adminAccessExpiresAt) return 0;
  return Math.max(0, adminAccessExpiresAt - Date.now());
}

export function setAdminAccessToken(token: string | null, expiresInSec = 900): void {
  const valid = Boolean(
    token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3
  );
  if (valid && token) {
    adminAccessToken = token;
    adminAccessExpiresAt = Date.now() + Math.max(30, expiresInSec) * 1000;
  } else {
    adminAccessToken = null;
    adminAccessExpiresAt = 0;
  }
}

export function clearAdminAccessToken(): void {
  adminAccessToken = null;
  adminAccessExpiresAt = 0;
}

export async function refreshAdminSession(): Promise<{ user: User; token: string } | null> {
  if (adminRefreshInFlight) {
    return adminRefreshInFlight;
  }

  adminRefreshInFlight = (async () => {
    try {
      const res = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'MeridianFX-Admin',
        },
        body: '{}',
      });
      if (!res.ok) {
        clearAdminAccessToken();
        return null;
      }
      const data = (await res.json()) as {
        user?: User;
        access_token?: string;
        expires_in?: number;
      };
      if (data.access_token && data.user && data.user.role === 'admin') {
        setAdminAccessToken(data.access_token, data.expires_in || 900);
        return { user: data.user, token: data.access_token };
      }
      clearAdminAccessToken();
      return null;
    } catch {
      return null;
    } finally {
      adminRefreshInFlight = null;
    }
  })();

  return adminRefreshInFlight;
}

export async function bootstrapAdminSession(): Promise<User | null> {
  const current = getAdminAccessToken();
  if (current) {
    try {
      const res = await fetch('/api/admin/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${current}`,
          'X-Requested-With': 'MeridianFX-Admin',
        },
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: User | null };
        if (data.user && data.user.role === 'admin') {
          return data.user;
        }
      }
    } catch {
      // fall through to refresh
    }
  }

  const refreshed = await refreshAdminSession();
  return refreshed ? refreshed.user : null;
}

export async function loginAdmin(
  identifier: string,
  password: string,
  rememberMe = true
): Promise<{ user: User; access_token: string; expires_in: number }> {
  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'MeridianFX-Admin',
    },
    body: JSON.stringify({
      identifier,
      password,
      remember_me: rememberMe,
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    throw new Error(String(data.error || `Administrator sign-in failed (${res.status})`));
  }

  const typed = data as {
    user: User;
    access_token: string;
    expires_in: number;
  };
  setAdminAccessToken(typed.access_token, typed.expires_in || 900);
  return typed;
}

export async function logoutAdmin(): Promise<void> {
  const token = getAdminAccessToken();
  try {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'MeridianFX-Admin',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: '{}',
    });
  } catch {
    // ignore network failure during sign-out
  } finally {
    clearAdminAccessToken();
  }
}

function buildAdminHeaders(options: RequestInit, tokenOverride?: string | null): Headers {
  const token = tokenOverride !== undefined ? tokenOverride : getAdminAccessToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'MeridianFX-Admin');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function adminApiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const skipAutoRefresh =
    url.startsWith('/api/admin/auth/login') ||
    url.startsWith('/api/admin/auth/refresh') ||
    url.startsWith('/api/admin/auth/logout');

  if (!skipAutoRefresh && (!getAdminAccessToken() || getAdminAccessTokenRemainingMs() < 30_000)) {
    await refreshAdminSession();
  }

  let res = await fetch(url, {
    ...options,
    headers: buildAdminHeaders(options),
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 401 && !skipAutoRefresh) {
    const refreshed = await refreshAdminSession();
    if (refreshed?.token) {
      res = await fetch(url, {
        ...options,
        headers: buildAdminHeaders(options, refreshed.token),
        credentials: 'include',
        cache: 'no-store',
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
      clearAdminAccessToken();
      window.dispatchEvent(new CustomEvent('mfx:admin-auth-expired'));
    }
    const errMsg = (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}

export async function adminUploadMediaFile(file: File): Promise<{
  url: string;
  original_name: string;
  mimetype: string;
  size: number;
}> {
  const form = new FormData();
  form.append('file', file);
  return adminApiFetch('/api/upload', {
    method: 'POST',
    body: form,
  });
}
