import type { User } from '../types';

let adminAccessToken: string | null = null;
let adminAccessExpiresAt = 0;
let adminAuthEpoch = 0;
let adminRefreshInFlight: { epoch: number; promise: Promise<AdminRefreshOutcome> } | null = null;

const ADMIN_SYNC_CHANNEL = 'mfx_admin_auth_sync';

export type AdminRefreshOutcome =
  | { status: 'ok'; user: User; token: string; expiresIn: number; rememberMe: boolean }
  | { status: 'unauthorized' }
  | { status: 'network_error' };

export type AdminBootstrapOutcome =
  | { status: 'authenticated'; user: User; expiresInMs: number }
  | { status: 'unauthenticated' }
  | { status: 'network_error' };

function postAdminSyncMessage(type: 'login' | 'logout'): void {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel(ADMIN_SYNC_CHANNEL);
    ch.postMessage({ type });
    ch.close();
  } catch {
    // ignore BroadcastChannel errors
  }
}

export function subscribeAdminAuthSync(
  onEvent: (type: 'login' | 'logout') => void
): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  try {
    const ch = new BroadcastChannel(ADMIN_SYNC_CHANNEL);
    ch.onmessage = (evt) => {
      const msg = evt.data as { type?: string } | undefined;
      if (msg?.type === 'login' || msg?.type === 'logout') {
        onEvent(msg.type);
      }
    };
    return () => {
      try {
        ch.close();
      } catch {
        // ignore
      }
    };
  } catch {
    return () => undefined;
  }
}

export function getAdminAuthEpoch(): number {
  return adminAuthEpoch;
}

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

export async function refreshAdminSessionDetailed(): Promise<AdminRefreshOutcome> {
  const startEpoch = adminAuthEpoch;
  if (adminRefreshInFlight && adminRefreshInFlight.epoch === startEpoch) {
    return adminRefreshInFlight.promise;
  }

  const promise = (async (): Promise<AdminRefreshOutcome> => {
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

      if (adminAuthEpoch !== startEpoch) {
        const currentToken = getAdminAccessToken();
        if (currentToken) {
          return { status: 'network_error' };
        }
        return { status: 'unauthorized' };
      }

      if (res.status === 401 || res.status === 403) {
        clearAdminAccessToken();
        return { status: 'unauthorized' };
      }

      if (!res.ok) {
        return { status: 'network_error' };
      }

      const data = (await res.json()) as {
        user?: User;
        access_token?: string;
        expires_in?: number;
        remember_me?: boolean;
      };

      if (data.access_token && data.user && data.user.role === 'admin') {
        const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 900;
        setAdminAccessToken(data.access_token, expiresIn);
        return {
          status: 'ok',
          user: data.user,
          token: data.access_token,
          expiresIn,
          rememberMe: data.remember_me !== false,
        };
      }

      clearAdminAccessToken();
      return { status: 'unauthorized' };
    } catch {
      return { status: 'network_error' };
    } finally {
      if (adminRefreshInFlight?.epoch === startEpoch) {
        adminRefreshInFlight = null;
      }
    }
  })();

  adminRefreshInFlight = { epoch: startEpoch, promise };
  return promise;
}

export async function refreshAdminSession(): Promise<{ user: User; token: string } | null> {
  const outcome = await refreshAdminSessionDetailed();
  if (outcome.status === 'ok') {
    return { user: outcome.user, token: outcome.token };
  }
  return null;
}

export async function bootstrapAdminSessionDetailed(): Promise<AdminBootstrapOutcome> {
  const startEpoch = adminAuthEpoch;
  const current = getAdminAccessToken();

  if (current && getAdminAccessTokenRemainingMs() > 15_000) {
    try {
      const res = await fetch('/api/admin/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${current}`,
          'X-Requested-With': 'MeridianFX-Admin',
        },
      });
      if (adminAuthEpoch !== startEpoch) {
        return { status: 'network_error' };
      }
      if (res.ok) {
        const data = (await res.json()) as { user?: User | null };
        if (data.user && data.user.role === 'admin') {
          return {
            status: 'authenticated',
            user: data.user,
            expiresInMs: getAdminAccessTokenRemainingMs(),
          };
        }
      }
      if (res.status !== 401 && res.status !== 403 && !res.ok) {
        return { status: 'network_error' };
      }
    } catch {
      return { status: 'network_error' };
    }
  }

  const refreshed = await refreshAdminSessionDetailed();
  if (refreshed.status === 'ok') {
    return {
      status: 'authenticated',
      user: refreshed.user,
      expiresInMs: refreshed.expiresIn * 1000,
    };
  }
  if (refreshed.status === 'network_error') {
    return { status: 'network_error' };
  }
  return { status: 'unauthenticated' };
}

export async function bootstrapAdminSession(): Promise<User | null> {
  const res = await bootstrapAdminSessionDetailed();
  return res.status === 'authenticated' ? res.user : null;
}

export async function loginAdmin(
  identifier: string,
  password: string,
  rememberMe = true
): Promise<{ user: User; access_token: string; expires_in: number }> {
  adminAuthEpoch += 1;
  adminRefreshInFlight = null;

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
  adminAuthEpoch += 1;
  adminRefreshInFlight = null;
  setAdminAccessToken(typed.access_token, typed.expires_in || 900);
  postAdminSyncMessage('login');
  return typed;
}

export async function logoutAdmin(): Promise<void> {
  adminAuthEpoch += 1;
  adminRefreshInFlight = null;
  const token = getAdminAccessToken();
  clearAdminAccessToken();
  postAdminSyncMessage('logout');

  try {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'MeridianFX-Admin',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: '{}',
    });
  } catch {
    // ignore network failure during sign-out
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
  const callEpoch = adminAuthEpoch;
  const skipAutoRefresh =
    url.startsWith('/api/admin/auth/login') ||
    url.startsWith('/api/admin/auth/refresh') ||
    url.startsWith('/api/admin/auth/logout');

  if (!skipAutoRefresh && (!getAdminAccessToken() || getAdminAccessTokenRemainingMs() < 60_000)) {
    const preRefresh = await refreshAdminSessionDetailed();
    if (preRefresh.status === 'unauthorized') {
      if (adminAuthEpoch === callEpoch) {
        clearAdminAccessToken();
        window.dispatchEvent(new CustomEvent('mfx:admin-auth-expired'));
      }
      throw new Error('Administrator session expired. Please sign in again.');
    }
    if (preRefresh.status === 'network_error' && !getAdminAccessToken()) {
      throw new Error(
        'Network connection unavailable. Your administrator session is preserved and will resume once connected.'
      );
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: buildAdminHeaders(options),
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new Error('Network connection interrupted. Please check your connection and retry.');
  }

  if (res.status === 401 && !skipAutoRefresh) {
    const refreshed = await refreshAdminSessionDetailed();
    if (refreshed.status === 'ok') {
      try {
        res = await fetch(url, {
          ...options,
          headers: buildAdminHeaders(options, refreshed.token),
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {
        throw new Error('Network connection interrupted. Please check your connection and retry.');
      }
    } else if (refreshed.status === 'unauthorized') {
      if (adminAuthEpoch === callEpoch) {
        clearAdminAccessToken();
        window.dispatchEvent(new CustomEvent('mfx:admin-auth-expired'));
      }
      throw new Error('Administrator session expired. Please sign in again.');
    } else {
      throw new Error('Network unavailable while renewing administrator session. Please retry.');
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
    if (res.status === 401 && !skipAutoRefresh && adminAuthEpoch === callEpoch) {
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
