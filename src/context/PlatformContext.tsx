import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  apiFetch,
  clearAccessToken,
  getAccessToken,
  getAccessTokenRemainingMs,
  setAccessToken,
  setAuthRefreshHandler,
} from '../lib/api';
import {
  autoEnablePushNotifications,
  syncExistingPushSubscriptionIfGranted,
} from '../lib/pushClient';
import type {
  AcademyResumeState,
  AppNotification,
  Course,
  MarketUpdate,
  PlatformSettings,
  PublicStats,
  PushJobSummary,
  SignalChatMessage,
  SignalReactionType,
  SignalReactionsMap,
  TradingSignal,
  User,
} from '../types';

export type SignalChatWsEvent =
  | { type: 'created'; message: SignalChatMessage }
  | { type: 'updated'; message: SignalChatMessage }
  | { type: 'deleted'; id: string }
  | {
      type: 'reacted';
      message_id: string;
      reactions: SignalReactionsMap;
      viewer_key: string;
      reaction: SignalReactionType | null;
    }
  | { type: 'reconnected' };

interface PlatformContextValue {
  user: User | null;
  authLoading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  route: string;
  navigate: (path: string) => void;
  settings: PlatformSettings;
  stats: PublicStats;
  signals: TradingSignal[];
  updates: MarketUpdate[];
  courses: Course[];
  resumeState: AcademyResumeState | null;
  notifications: AppNotification[];
  unreadCount: number;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setSignals: React.Dispatch<React.SetStateAction<TradingSignal[]>>;
  setUpdates: React.Dispatch<React.SetStateAction<MarketUpdate[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setResumeState: React.Dispatch<React.SetStateAction<AcademyResumeState | null>>;
  onlineCount: number;
  wsConnected: boolean;
  subscribeSignalChatEvents: (listener: (event: SignalChatWsEvent) => void) => () => void;
  subscribePushJobEvents: (listener: (job: PushJobSummary) => void) => () => void;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  brand_name: 'MeridianFX',
  tagline: 'Institutional Forex Signals, Real-Time Intelligence & Structured Education',
  logo_url: '/icon.svg',
  hero_title: 'Disciplined Forex Signals & Institutional Market Education',
  hero_subtitle:
    'Real-time trade ideas with transparent risk parameters, live session intelligence, macroeconomic tracking, and a structured trading curriculum.',
  about_text: '',
  contact_email: 'desk@meridianfx.com',
  contact_phone: '',
  contact_whatsapp: '',
  contact_address: '',
  seo_title: 'MeridianFX — Forex Signals, Market Intelligence & Trading Academy',
  seo_description: '',
  push_enabled: true,
  market_api_provider: 'Yahoo Finance / Frankfurter / CoinGecko',
  calendar_api_provider: 'ForexFactory Weekly Feed',
};

const DEFAULT_STATS: PublicStats = {
  total_signals: 0,
  total_published_signals: 18782,
  active_signals: 0,
  completed_signals: 0,
  total_updates: 0,
  total_courses: 0,
  total_lessons: 0,
  total_users: 0,
  community_posts: 0,
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}

const OFFLINE_CACHE_KEY = 'mfx_offline_snapshot_v1';

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('mfx_theme_v2');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [route, setRoute] = useState<string>(() => window.location.pathname || '/');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<PublicStats>(DEFAULT_STATS);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [updates, setUpdates] = useState<MarketUpdate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resumeState, setResumeState] = useState<AcademyResumeState | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const proactiveRefreshTimer = useRef<number | null>(null);
  const hasConnectedOnceRef = useRef<boolean>(false);
  const authEpochRef = useRef<number>(0);
  const refreshInFlightRef = useRef<{ epoch: number; promise: Promise<string | null> } | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);
  const authChannelRef = useRef<BroadcastChannel | null>(null);
  const userRef = useRef<User | null>(user);
  const signalChatListenersRef = useRef<Set<(event: SignalChatWsEvent) => void>>(new Set());
  const pushJobListenersRef = useRef<Set<(job: PushJobSummary) => void>>(new Set());

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const subscribeSignalChatEvents = useCallback((listener: (event: SignalChatWsEvent) => void) => {
    signalChatListenersRef.current.add(listener);
    return () => {
      signalChatListenersRef.current.delete(listener);
    };
  }, []);

  const subscribePushJobEvents = useCallback((listener: (job: PushJobSummary) => void) => {
    pushJobListenersRef.current.add(listener);
    return () => {
      pushJobListenersRef.current.delete(listener);
    };
  }, []);

  const emitSignalChatEvent = useCallback((event: SignalChatWsEvent) => {
    for (const fn of signalChatListenersRef.current) {
      try {
        fn(event);
      } catch {
        // isolate listener errors
      }
    }
  }, []);

  const emitPushJobEvent = useCallback((job: PushJobSummary) => {
    for (const fn of pushJobListenersRef.current) {
      try {
        fn(job);
      } catch {
        // isolate listener errors
      }
    }
  }, []);

  // Sync dark class & theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#090D16' : '#881337');

    try {
      localStorage.setItem('mfx_theme_v2', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // Browser history navigation
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    const cleanRoute = path.split('?')[0] || '/';
    if (`${window.location.pathname}${window.location.search}` !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(cleanRoute);
    window.dispatchEvent(new Event('mfx:locationchange'));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const syncAppBadge = useCallback((count: number) => {
    const nav = navigator as Navigator & {
      setAppBadge?: (c?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (count > 0 && typeof nav.setAppBadge === 'function') {
      nav.setAppBadge(count).catch(() => undefined);
    } else if (count === 0 && typeof nav.clearAppBadge === 'function') {
      nav.clearAppBadge().catch(() => undefined);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ notifications: AppNotification[]; unread_count: number }>(
        '/api/notifications'
      );
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
      syncAppBadge(res.unread_count);
    } catch {
      // unauthenticated or offline
    }
  }, [syncAppBadge]);

  const refreshPublicData = useCallback(async () => {
    try {
      const [settingsRes, sigRes, updRes, acadRes] = await Promise.all([
        apiFetch<{ settings: PlatformSettings; stats: PublicStats }>('/api/settings', { cache: 'no-store' }),
        apiFetch<{ signals: TradingSignal[] }>('/api/signals', { cache: 'no-store' }),
        apiFetch<{ updates: MarketUpdate[] }>('/api/updates'),
        apiFetch<{ courses: Course[]; resume_state?: AcademyResumeState | null }>('/api/academy/courses'),
      ]);

      setSettings(settingsRes.settings);
      setStats(settingsRes.stats);
      setSignals(sigRes.signals);
      setUpdates(updRes.updates);
      setCourses(acadRes.courses);
      setResumeState(acadRes.resume_state ?? null);

      if (settingsRes.settings.seo_title) {
        document.title = settingsRes.settings.seo_title;
      }

      try {
        localStorage.setItem(
          OFFLINE_CACHE_KEY,
          JSON.stringify({
            settings: settingsRes.settings,
            stats: settingsRes.stats,
            signals: sigRes.signals,
            updates: updRes.updates,
            courses: acadRes.courses,
          })
        );
      } catch {
        // ignore quota limits
      }
    } catch {
      try {
        const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            settings?: PlatformSettings;
            stats?: PublicStats;
            signals?: TradingSignal[];
            updates?: MarketUpdate[];
            courses?: Course[];
          };
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.stats) setStats(parsed.stats);
          if (parsed.signals) setSignals(parsed.signals);
          if (parsed.updates) setUpdates(parsed.updates);
          if (parsed.courses) setCourses(parsed.courses);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await refreshPublicData();
  }, [refreshPublicData]);

  const clearProactiveRefreshTimer = useCallback(() => {
    if (proactiveRefreshTimer.current) {
      clearTimeout(proactiveRefreshTimer.current);
      proactiveRefreshTimer.current = null;
    }
  }, []);

  const clearLocalSessionState = useCallback(() => {
    clearProactiveRefreshTimer();
    clearAccessToken();
    setUser(null);
    setResumeState(null);
    setNotifications([]);
    setUnreadCount(0);
    syncAppBadge(0);
  }, [clearProactiveRefreshTimer, syncAppBadge]);

  const scheduleProactiveRefreshRef = useRef<(expiresInSec: number) => void>(() => undefined);

  const performSessionRefresh = useCallback(async (): Promise<string | null> => {
    const epoch = authEpochRef.current;
    if (refreshInFlightRef.current && refreshInFlightRef.current.epoch === epoch) {
      return refreshInFlightRef.current.promise;
    }

    const run = (async (): Promise<string | null> => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'MeridianFX',
          },
        });

        if (authEpochRef.current !== epoch) {
          return getAccessToken();
        }

        if (!res.ok) {
          clearLocalSessionState();
          return null;
        }

        const data = (await res.json()) as {
          user?: User;
          access_token?: string;
          expires_in?: number;
        };

        if (!data.user || !data.access_token) {
          clearLocalSessionState();
          return null;
        }

        const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 900;
        setAccessToken(data.access_token, expiresIn);
        setUser(data.user);
        scheduleProactiveRefreshRef.current(expiresIn);
        refreshNotifications().catch(() => undefined);
        return data.access_token;
      } catch {
        // Transient offline failure: keep current in-memory state until connectivity returns
        return getAccessToken();
      } finally {
        if (refreshInFlightRef.current?.epoch === epoch) {
          refreshInFlightRef.current = null;
        }
        if (authEpochRef.current === epoch) {
          setAuthLoading(false);
        }
      }
    })();

    refreshInFlightRef.current = { epoch, promise: run };
    return run;
  }, [clearLocalSessionState, refreshNotifications]);

  useEffect(() => {
    scheduleProactiveRefreshRef.current = (expiresInSec: number) => {
      clearProactiveRefreshTimer();
      // Renew 2 minutes before short-lived access token expires (minimum 30s delay)
      const delayMs = Math.max(30_000, expiresInSec * 1000 - 120_000);
      proactiveRefreshTimer.current = window.setTimeout(() => {
        performSessionRefresh().catch(() => undefined);
      }, delayMs);
    };
  }, [clearProactiveRefreshTimer, performSessionRefresh]);

  // Register automatic 401 refresh handler & boot session from HttpOnly refresh cookie
  useEffect(() => {
    setAuthRefreshHandler(performSessionRefresh);
    performSessionRefresh();
    refreshPublicData();
    autoEnablePushNotifications().catch(() => undefined);

    return () => {
      setAuthRefreshHandler(null);
      clearProactiveRefreshTimer();
    };
  }, [performSessionRefresh, refreshPublicData, clearProactiveRefreshTimer]);

  // Keep push subscription tied to current user state
  useEffect(() => {
    if (!authLoading && user?.id) {
      autoEnablePushNotifications().catch(() => undefined);
    }
  }, [user?.id, authLoading]);

  // Listen for Service Worker notification clicks and foreground push sync
  useEffect(() => {
    const onSwMessage = (evt: MessageEvent) => {
      const data = evt.data as { type?: string; url?: string; messageId?: string | null } | undefined;
      if (data?.type === 'mfx:open-notification-url' && data.url) {
        navigate(data.url);
        if (data.messageId) {
          window.dispatchEvent(
            new CustomEvent('mfx:highlight-signal-message', { detail: { messageId: data.messageId } })
          );
        }
      } else if (data?.type === 'mfx:push-received-foreground') {
        emitSignalChatEvent({ type: 'reconnected' });
        window.dispatchEvent(
          new CustomEvent('mfx:push-received-foreground', {
            detail: { messageId: data.messageId || null },
          })
        );
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, [navigate, emitSignalChatEvent]);

  // Cross-tab BroadcastChannel sync, tab visibility renewal, and expired-session cleanup
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const ch = new BroadcastChannel('mfx_auth_sync');
        authChannelRef.current = ch;
        ch.onmessage = (evt) => {
          const msg = evt.data as { type?: string } | undefined;
          if (msg?.type === 'logout') {
            authEpochRef.current += 1;
            refreshInFlightRef.current = null;
            clearLocalSessionState();
            setAuthLoading(false);
          } else if (msg?.type === 'login') {
            authEpochRef.current += 1;
            refreshInFlightRef.current = null;
            performSessionRefresh().catch(() => undefined);
          }
        };
      } catch {
        // ignore if unsupported
      }
    }

    const onVisibleOrFocus = () => {
      if (document.visibilityState === 'hidden') return;
      if (userRef.current && getAccessTokenRemainingMs() < 3 * 60_000) {
        performSessionRefresh().catch(() => undefined);
      }
    };

    const onExpired = () => {
      if (userRef.current) {
        clearLocalSessionState();
      }
    };

    window.addEventListener('focus', onVisibleOrFocus);
    document.addEventListener('visibilitychange', onVisibleOrFocus);
    window.addEventListener('mfx:auth-expired', onExpired);
    return () => {
      window.removeEventListener('focus', onVisibleOrFocus);
      document.removeEventListener('visibilitychange', onVisibleOrFocus);
      window.removeEventListener('mfx:auth-expired', onExpired);
      authChannelRef.current?.close();
      authChannelRef.current = null;
    };
  }, [clearLocalSessionState, performSessionRefresh]);

  // Real-Time WebSocket Sync with keepalive, exponential backoff, & PWA/mobile wake recovery
  useEffect(() => {
    let active = true;
    let retryAttempt = 0;
    let pingTimer: number | null = null;

    const clearTimers = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
    };

    const connect = () => {
      if (!active) return;
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryAttempt = 0;
        setWsConnected(true);
        if (hasConnectedOnceRef.current) {
          emitSignalChatEvent({ type: 'reconnected' });
        }
        hasConnectedOnceRef.current = true;

        if (pingTimer) clearInterval(pingTimer);
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ event: 'ping' }));
            } catch {
              // socket will close and trigger reconnect
            }
          }
        }, 25_000);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as { event: string; data: unknown };
          switch (msg.event) {
            case 'pong':
              break;
            case 'connected': {
              const payload = msg.data as { online_count?: number };
              if (typeof payload?.online_count === 'number') {
                setOnlineCount(payload.online_count);
              }
              break;
            }
            case 'presence:update': {
              const payload = msg.data as { online_count?: number };
              if (typeof payload?.online_count === 'number') {
                setOnlineCount(payload.online_count);
              }
              break;
            }
            case 'signals_chat:created': {
              emitSignalChatEvent({ type: 'created', message: msg.data as SignalChatMessage });
              break;
            }
            case 'signals_chat:updated': {
              emitSignalChatEvent({ type: 'updated', message: msg.data as SignalChatMessage });
              break;
            }
            case 'signals_chat:deleted': {
              const { id } = msg.data as { id: string };
              emitSignalChatEvent({ type: 'deleted', id });
              break;
            }
            case 'signals_chat:reacted': {
              const payload = msg.data as {
                message_id: string;
                reactions: SignalReactionsMap;
                viewer_key: string;
                reaction: SignalReactionType | null;
              };
              emitSignalChatEvent({ type: 'reacted', ...payload });
              break;
            }
            case 'signal:created': {
              const incoming = msg.data as TradingSignal;
              setSignals((prev) =>
                prev.some((s) => s.id === incoming.id) ? prev : [incoming, ...prev]
              );
              setStats((st) => ({
                ...st,
                total_signals: st.total_signals + 1,
                active_signals:
                  incoming.status === 'Active' || incoming.status === 'Pending'
                    ? st.active_signals + 1
                    : st.active_signals,
              }));
              break;
            }
            case 'signal:updated': {
              const updated = msg.data as TradingSignal;
              setSignals((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              break;
            }
            case 'signal:deleted': {
              const { id } = msg.data as { id: string };
              setSignals((prev) => prev.filter((s) => s.id !== id));
              break;
            }
            case 'update:created': {
              const incoming = msg.data as MarketUpdate;
              setUpdates((prev) =>
                prev.some((u) => u.id === incoming.id)
                  ? prev
                  : [incoming, ...prev].sort((a, b) => Number(b.pinned) - Number(a.pinned))
              );
              setStats((st) => ({ ...st, total_updates: st.total_updates + 1 }));
              break;
            }
            case 'update:updated': {
              const updated = msg.data as MarketUpdate;
              setUpdates((prev) =>
                prev
                  .map((u) => (u.id === updated.id ? updated : u))
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned))
              );
              break;
            }
            case 'update:deleted': {
              const { id } = msg.data as { id: string };
              setUpdates((prev) => prev.filter((u) => u.id !== id));
              break;
            }
            case 'academy:updated': {
              apiFetch<{ courses: Course[]; resume_state?: AcademyResumeState | null }>('/api/academy/courses')
                .then((res) => {
                  setCourses(res.courses);
                  if (res.resume_state !== undefined) {
                    setResumeState(res.resume_state);
                  }
                })
                .catch(() => undefined);
              break;
            }
            case 'settings:updated': {
              setSettings(msg.data as PlatformSettings);
              break;
            }
            case 'stats:updated': {
              const payload = msg.data as Partial<PublicStats>;
              if (payload && typeof payload === 'object') {
                setStats((st) => ({
                  ...st,
                  ...(typeof payload.total_published_signals === 'number'
                    ? { total_published_signals: payload.total_published_signals }
                    : {}),
                }));
              }
              break;
            }
            case 'notification:new': {
              refreshNotifications();
              break;
            }
            case 'push:job_updated': {
              emitPushJobEvent(msg.data as PushJobSummary);
              break;
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (!active) return;
        const delayMs = Math.min(15_000, 1000 * Math.pow(2, Math.min(retryAttempt, 4)));
        retryAttempt += 1;
        reconnectTimer.current = window.setTimeout(() => {
          connect();
          refreshPublicData();
        }, delayMs);
      };
    };

    const handleResumeOrOnline = () => {
      if (!active || document.visibilityState === 'hidden') return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
        retryAttempt = 0;
        connect();
      } else if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ event: 'ping' }));
        } catch {
          // ignore
        }
        emitSignalChatEvent({ type: 'reconnected' });
      }
    };

    window.addEventListener('online', handleResumeOrOnline);
    document.addEventListener('visibilitychange', handleResumeOrOnline);

    connect();
    return () => {
      active = false;
      clearTimers();
      window.removeEventListener('online', handleResumeOrOnline);
      document.removeEventListener('visibilitychange', handleResumeOrOnline);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [refreshPublicData, refreshNotifications, emitSignalChatEvent, emitPushJobEvent]);

  const login = async (identifier: string, password: string, rememberMe = true): Promise<User> => {
    authEpochRef.current += 1;
    refreshInFlightRef.current = null;
    const res = await apiFetch<{ user: User; access_token: string; expires_in?: number }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          remember_me: rememberMe,
        }),
      }
    );
    const expiresIn = typeof res.expires_in === 'number' ? res.expires_in : 900;
    setAccessToken(res.access_token, expiresIn);
    setUser(res.user);
    setAuthLoading(false);
    scheduleProactiveRefreshRef.current(expiresIn);
    try {
      authChannelRef.current?.postMessage({ type: 'login' });
    } catch {
      // ignore
    }
    await Promise.all([refreshPublicData(), refreshNotifications()]);
    return res.user;
  };

  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      authEpochRef.current += 1;
      refreshInFlightRef.current = null;
      const currentToken = getAccessToken();

      clearLocalSessionState();
      setAuthLoading(false);

      try {
        authChannelRef.current?.postMessage({ type: 'logout' });
      } catch {
        // ignore
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'MeridianFX',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: '{}',
      }).catch(() => undefined);

      await refreshPublicData();
      navigate('/profile');
    } finally {
      isLoggingOutRef.current = false;
    }
  };

  const logoutAllSessions = async () => {
    authEpochRef.current += 1;
    refreshInFlightRef.current = null;
    await apiFetch('/api/auth/logout-all', { method: 'POST' }).catch(() => undefined);
    clearLocalSessionState();
    setAuthLoading(false);
    try {
      authChannelRef.current?.postMessage({ type: 'logout' });
    } catch {
      // ignore
    }
    await refreshPublicData();
    navigate('/profile');
  };

  return (
    <PlatformContext.Provider
      value={{
        user,
        authLoading,
        theme,
        toggleTheme,
        route,
        navigate,
        settings,
        stats,
        signals,
        updates,
        courses,
        resumeState,
        notifications,
        unreadCount,
        login,
        logout,
        logoutAllSessions,
        setUser,
        refreshAll,
        refreshNotifications,
        setSignals,
        setUpdates,
        setCourses,
        setResumeState,
        onlineCount,
        wsConnected,
        subscribeSignalChatEvents,
        subscribePushJobEvents,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
