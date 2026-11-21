import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  TOKEN_KEY,
  apiFetch,
  getCachedUser,
  getStoredToken,
  setCachedUser,
  setStoredToken,
} from '../lib/api';
import {
  isPushSupported,
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
  showNotifModal: boolean;
  setShowNotifModal: (v: boolean) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; verification_code?: string }>;
  logout: () => Promise<void>;
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
  contact_address: '',
  seo_title: 'MeridianFX — Forex Signals, Market Intelligence & Trading Academy',
  seo_description: '',
  push_enabled: true,
  market_api_provider: 'Yahoo Finance / Frankfurter / CoinGecko',
  calendar_api_provider: 'ForexFactory Weekly Feed',
};

const DEFAULT_STATS: PublicStats = {
  total_signals: 0,
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
  const [user, setUser] = useState<User | null>(() => (getStoredToken() ? getCachedUser() : null));
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
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const hasConnectedOnceRef = useRef<boolean>(false);
  const authEpochRef = useRef<number>(0);
  const signalChatListenersRef = useRef<Set<(event: SignalChatWsEvent) => void>>(new Set());
  const pushJobListenersRef = useRef<Set<(job: PushJobSummary) => void>>(new Set());

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

  // Keep cached user profile aligned after initial auth check resolves
  useEffect(() => {
    if (!authLoading) {
      setCachedUser(user);
    }
  }, [user, authLoading]);

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
        apiFetch<{ settings: PlatformSettings; stats: PublicStats }>('/api/settings'),
        apiFetch<{ signals: TradingSignal[] }>('/api/signals'),
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

  const initializeAuth = useCallback(async () => {
    const epoch = authEpochRef.current;
    try {
      const meRes = await apiFetch<{ user: User | null; session_token?: string }>('/api/auth/me');
      if (authEpochRef.current !== epoch) return;

      if (meRes.user) {
        if (meRes.session_token) {
          setStoredToken(meRes.session_token);
        }
        setUser(meRes.user);
        setCachedUser(meRes.user);
        await refreshNotifications();
      } else {
        setStoredToken(null);
        setCachedUser(null);
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // Network or transient server error: preserve cached user if token still exists
      if (authEpochRef.current === epoch) {
        const cached = getStoredToken() ? getCachedUser() : null;
        if (cached) {
          setUser(cached);
        }
      }
    } finally {
      if (authEpochRef.current === epoch) {
        setAuthLoading(false);
      }
    }
  }, [refreshNotifications]);

  const refreshAll = useCallback(async () => {
    await refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    initializeAuth();
    refreshPublicData();
    syncExistingPushSubscriptionIfGranted().catch(() => undefined);
  }, [initializeAuth, refreshPublicData]);

  // Keep already-granted push subscription synced when auth user changes
  useEffect(() => {
    if (!authLoading) {
      syncExistingPushSubscriptionIfGranted().catch(() => undefined);
    }
  }, [user?.id, authLoading]);

  // Listen for Service Worker notification clicks & PWA install to encourage notifications
  useEffect(() => {
    const promptKey = 'mfx_post_install_notif_prompted_v1';

    const maybeEncourageAfterInstall = () => {
      try {
        if (!isPushSupported()) return;
        if (Notification.permission !== 'default') return;
        if (localStorage.getItem(promptKey) === '1') return;
        localStorage.setItem(promptKey, '1');
        setShowNotifModal(true);
      } catch {
        // ignore storage errors
      }
    };

    const isStandaloneNow =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    let standaloneTimer: number | undefined;
    if (isStandaloneNow) {
      standaloneTimer = window.setTimeout(maybeEncourageAfterInstall, 1200);
    }

    const onSwMessage = (evt: MessageEvent) => {
      const data = evt.data as { type?: string; url?: string; messageId?: string | null } | undefined;
      if (data?.type === 'mfx:open-notification-url' && data.url) {
        navigate(data.url);
        if (data.messageId) {
          window.dispatchEvent(
            new CustomEvent('mfx:highlight-signal-message', { detail: { messageId: data.messageId } })
          );
        }
      }
    };

    window.addEventListener('mfx:pwa-installed', maybeEncourageAfterInstall);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      if (standaloneTimer) clearTimeout(standaloneTimer);
      window.removeEventListener('mfx:pwa-installed', maybeEncourageAfterInstall);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, [navigate]);

  // Synchronize auth state across open browser tabs without redirect loops
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY || e.newValue === e.oldValue) return;
      if (!e.newValue) {
        authEpochRef.current += 1;
        setCachedUser(null);
        setUser(null);
        setResumeState(null);
        setNotifications([]);
        setUnreadCount(0);
        setAuthLoading(false);
      } else {
        initializeAuth();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [initializeAuth]);

  // Real-Time WebSocket Sync with auto-reconnect (never resets auth state)
  useEffect(() => {
    let active = true;

    const connect = () => {
      if (!active) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (hasConnectedOnceRef.current) {
          emitSignalChatEvent({ type: 'reconnected' });
        }
        hasConnectedOnceRef.current = true;
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as { event: string; data: unknown };
          switch (msg.event) {
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
        if (!active) return;
        reconnectTimer.current = window.setTimeout(() => {
          connect();
          refreshPublicData();
        }, 3000);
      };
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [refreshPublicData, refreshNotifications, emitSignalChatEvent, emitPushJobEvent]);

  const login = async (email: string, password: string): Promise<User> => {
    authEpochRef.current += 1;
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setStoredToken(res.token);
    setCachedUser(res.user);
    setUser(res.user);
    setAuthLoading(false);
    await Promise.all([refreshPublicData(), refreshNotifications()]);
    return res.user;
  };

  const register = async (name: string, email: string, password: string) => {
    authEpochRef.current += 1;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const res = await apiFetch<{ user: User; token: string; verification_code?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          timezone,
        }),
      }
    );
    setStoredToken(res.token);
    setCachedUser(res.user);
    setUser(res.user);
    setAuthLoading(false);
    await Promise.all([refreshPublicData(), refreshNotifications()]);
    return { user: res.user, verification_code: res.verification_code };
  };

  const logout = async () => {
    authEpochRef.current += 1;
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setStoredToken(null);
    setCachedUser(null);
    try {
      localStorage.removeItem('mfx_token');
    } catch {
      // ignore
    }
    setUser(null);
    setAuthLoading(false);
    setResumeState(null);
    setNotifications([]);
    setUnreadCount(0);
    navigate('/login');
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
        showNotifModal,
        setShowNotifModal,
        login,
        register,
        logout,
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
