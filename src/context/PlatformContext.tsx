import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiFetch, setStoredToken } from '../lib/api';
import type {
  AppNotification,
  Course,
  MarketUpdate,
  PlatformSettings,
  PublicStats,
  TradingSignal,
  User,
} from '../types';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

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
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ notifications: AppNotification[]; unread_count: number }>(
        '/api/notifications'
      );
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {
      // unauthenticated or offline
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [meRes, settingsRes, sigRes, updRes, acadRes] = await Promise.all([
        apiFetch<{ user: User | null }>('/api/auth/me').catch(() => ({ user: null })),
        apiFetch<{ settings: PlatformSettings; stats: PublicStats }>('/api/settings'),
        apiFetch<{ signals: TradingSignal[] }>('/api/signals'),
        apiFetch<{ updates: MarketUpdate[] }>('/api/updates'),
        apiFetch<{ courses: Course[] }>('/api/academy/courses'),
      ]);

      setUser(meRes.user);
      setSettings(settingsRes.settings);
      setStats(settingsRes.stats);
      setSignals(sigRes.signals);
      setUpdates(updRes.updates);
      setCourses(acadRes.courses);

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

      if (meRes.user) {
        await refreshNotifications();
      }
    } catch {
      // Load cached snapshot if offline
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
    } finally {
      setAuthLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Real-Time WebSocket Sync with auto-reconnect
  useEffect(() => {
    let active = true;

    const connect = () => {
      if (!active) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as { event: string; data: unknown };
          switch (msg.event) {
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
              apiFetch<{ courses: Course[] }>('/api/academy/courses')
                .then((res) => setCourses(res.courses))
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
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!active) return;
        reconnectTimer.current = window.setTimeout(() => {
          connect();
          refreshAll();
        }, 3000);
      };
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [refreshAll, refreshNotifications]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    await refreshAll();
    return res.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const res = await apiFetch<{ user: User; token: string; verification_code?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password, timezone }),
      }
    );
    setStoredToken(res.token);
    setUser(res.user);
    await refreshAll();
    return { user: res.user, verification_code: res.verification_code };
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setStoredToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    navigate('/');
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
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
