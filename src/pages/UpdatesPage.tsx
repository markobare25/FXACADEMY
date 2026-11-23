import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Newspaper,
  Pin,
  Radio,
  RefreshCw,
  ThumbsUp,
  TrendingUp,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import type { EconomicEvent, LiveNewsArticle, MarketUpdate } from '../types';

type UpdatesSubTab = 'news' | 'calendar';
type NewsAssetFilter =
  | 'All'
  | 'XAU/USD'
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'Oil'
  | 'Crypto'
  | 'Desk Briefings';
type CalendarQuickFilter = 'all' | 'high' | 'today' | 'week';

const ASSET_FILTERS: NewsAssetFilter[] = [
  'All',
  'XAU/USD',
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'Oil',
  'Crypto',
  'Desk Briefings',
];

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  NZD: '🇳🇿',
  CNY: '🇨🇳',
};

const ASSET_TAG_STYLES: Record<string, string> = {
  'XAU/USD':
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  'EUR/USD':
    'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  'GBP/USD':
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  'USD/JPY':
    'bg-rose-50 text-[#881337] border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  Oil: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
  Crypto:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  Macro:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

function formatNewsRelativeTime(iso: string, nowMs: number): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSec < 45) return 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hr ago';
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return formatLocalDateTime(iso);
}

function getLocalDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatCalendarLocalTime(iso: string): { time: string; dayLabel: string; isToday: boolean } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { time: iso, dayLabel: '', isToday: false };
  }
  const now = new Date();
  const todayKey = getLocalDateKey(now.toISOString());
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = getLocalDateKey(tomorrow.toISOString());
  const eventKey = getLocalDateKey(iso);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

  if (eventKey === todayKey) {
    return { time, dayLabel: 'Today', isToday: true };
  }
  if (eventKey === tomorrowKey) {
    return { time, dayLabel: 'Tomorrow', isToday: false };
  }
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
  return { time, dayLabel, isToday: false };
}

function getImpactBadgeClasses(impact: EconomicEvent['impact']): string {
  if (impact === 'High') {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
  }
  if (impact === 'Medium') {
    return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60';
  }
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/35 dark:text-yellow-300 dark:border-yellow-800/60';
}

function getActualValueClasses(outcome?: EconomicEvent['actual_outcome']): string {
  if (outcome === 'better') {
    return 'text-emerald-700 dark:text-emerald-400 font-bold';
  }
  if (outcome === 'worse') {
    return 'text-rose-700 dark:text-rose-400 font-bold';
  }
  return 'text-slate-900 dark:text-white font-semibold';
}

export const UpdatesPage: React.FC = () => {
  const { user, updates, setUpdates } = usePlatform();

  const [activeTab, setActiveTab] = useState<UpdatesSubTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') === 'calendar' ? 'calendar' : 'news';
    } catch {
      return 'news';
    }
  });

  // Live Market News state
  const [newsArticles, setNewsArticles] = useState<LiveNewsArticle[]>([]);
  const [newsStatus, setNewsStatus] = useState<'live' | 'unavailable'>('live');
  const [newsSources, setNewsSources] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsMessage, setNewsMessage] = useState<string | undefined>();
  const [assetFilter, setAssetFilter] = useState<NewsAssetFilter>('All');
  const [selectedArticle, setSelectedArticle] = useState<LiveNewsArticle | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Live Economic Calendar state
  const [calendarEvents, setCalendarEvents] = useState<EconomicEvent[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<'live' | 'unavailable'>('live');
  const [calendarSource, setCalendarSource] = useState('');
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarMessage, setCalendarMessage] = useState<string | undefined>();
  const [calendarQuickFilter, setCalendarQuickFilter] = useState<CalendarQuickFilter>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Shared live polling state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const mountedRef = useRef(true);

  const fetchLiveFeeds = useCallback(
    async (opts?: { forceRefresh?: boolean; silent?: boolean }) => {
      const force = Boolean(opts?.forceRefresh);
      const silent = Boolean(opts?.silent);
      if (!silent) {
        setIsRefreshing(true);
      }

      const suffix = force ? '?refresh=1' : '';

      const [newsRes, calRes, adminUpdatesRes] = await Promise.allSettled([
        apiFetch<{
          status: 'live' | 'unavailable';
          fetched_at: string;
          sources: string[];
          articles: LiveNewsArticle[];
          message?: string;
        }>(`/api/updates/news${suffix}`),
        apiFetch<{
          status: 'live' | 'unavailable';
          source: string;
          fetched_at?: string;
          events: EconomicEvent[];
          message?: string;
        }>(`/api/updates/calendar${suffix}`),
        apiFetch<{ updates: MarketUpdate[] }>('/api/updates'),
      ]);

      if (!mountedRef.current) return;

      if (newsRes.status === 'fulfilled') {
        setNewsStatus(newsRes.value.status);
        setNewsSources(newsRes.value.sources || []);
        setNewsArticles(newsRes.value.articles || []);
        setNewsMessage(newsRes.value.message);
      } else {
        setNewsStatus('unavailable');
        setNewsMessage('Unable to reach live Forex news endpoint right now.');
      }
      setNewsLoading(false);

      if (calRes.status === 'fulfilled') {
        setCalendarStatus(calRes.value.status);
        setCalendarSource(calRes.value.source || '');
        setCalendarEvents(calRes.value.events || []);
        setCalendarMessage(calRes.value.message);
      } else {
        setCalendarStatus('unavailable');
        setCalendarMessage('Unable to reach live economic calendar endpoint right now.');
      }
      setCalendarLoading(false);

      if (adminUpdatesRes.status === 'fulfilled' && Array.isArray(adminUpdatesRes.value.updates)) {
        setUpdates(adminUpdatesRes.value.updates);
      }

      setLastSyncedAt(new Date().toISOString());
      setNowTick(Date.now());
      setIsRefreshing(false);
    },
    [setUpdates]
  );

  // Initial load + continuous 60-second background polling
  useEffect(() => {
    mountedRef.current = true;
    void fetchLiveFeeds({ silent: false });

    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchLiveFeeds({ silent: true });
      }
    }, 60_000);

    const clockTimer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchLiveFeeds({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      window.clearInterval(pollTimer);
      window.clearInterval(clockTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchLiveFeeds]);

  // Close reader modal on Escape
  useEffect(() => {
    if (!selectedArticle) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedArticle(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedArticle]);

  const pinnedAdminUpdates = useMemo(() => {
    return updates.filter((u) => u.pinned);
  }, [updates]);

  const unpinnedAdminUpdates = useMemo(() => {
    return updates.filter((u) => !u.pinned);
  }, [updates]);

  const filteredNewsArticles = useMemo(() => {
    if (assetFilter === 'Desk Briefings') return [];
    if (assetFilter === 'All') return newsArticles;
    return newsArticles.filter((article) => article.tags.includes(assetFilter));
  }, [newsArticles, assetFilter]);

  const currencies = useMemo(() => {
    const preferred = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
    const present = new Set(calendarEvents.map((e) => e.currency));
    const ordered = preferred.filter((c) => present.has(c));
    const extras = Array.from(present)
      .filter((c) => !preferred.includes(c))
      .sort();
    return ['ALL', ...ordered, ...extras];
  }, [calendarEvents]);

  const filteredCalendarEvents = useMemo(() => {
    const now = new Date(nowTick);
    const todayKey = getLocalDateKey(now.toISOString());

    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 1);
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return calendarEvents.filter((ev) => {
      if (currencyFilter !== 'ALL' && ev.currency !== currencyFilter) return false;
      if (calendarQuickFilter === 'high' && ev.impact !== 'High') return false;
      if (calendarQuickFilter === 'today') {
        if (getLocalDateKey(ev.date_iso) !== todayKey) return false;
      }
      if (calendarQuickFilter === 'week') {
        const ts = new Date(ev.date_iso).getTime();
        if (ts < weekStart.getTime() || ts > weekEnd.getTime()) return false;
      }
      return true;
    });
  }, [calendarEvents, currencyFilter, calendarQuickFilter, nowTick]);

  const handleReact = async (updateId: string, emoji: string) => {
    if (!user) {
      setUpdates((prev) =>
        prev.map((u) => {
          if (u.id !== updateId) return u;
          const nextReactions = { ...(u.reactions || {}) };
          nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
          return { ...u, reactions: nextReactions };
        })
      );
      return;
    }
    try {
      const res = await apiFetch<{ update: MarketUpdate }>(`/api/updates/${updateId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      setUpdates((prev) => prev.map((u) => (u.id === updateId ? res.update : u)));
    } catch {
      // ignore
    }
  };

  const handleBookmark = async (updateId: string) => {
    if (!user) {
      setUpdates((prev) =>
        prev.map((u) => (u.id === updateId ? { ...u, bookmarked: !u.bookmarked } : u))
      );
      return;
    }
    try {
      const res = await apiFetch<{ update: MarketUpdate }>(`/api/updates/${updateId}/bookmark`, {
        method: 'POST',
      });
      setUpdates((prev) => prev.map((u) => (u.id === updateId ? res.update : u)));
    } catch {
      // ignore
    }
  };

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

  const renderAdminUpdateCard = (upd: MarketUpdate) => (
    <article
      key={upd.id}
      className="rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-[#111827] p-5 sm:p-6 space-y-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
            {upd.pinned && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#881337] dark:text-rose-400">
                <Pin className="w-3.5 h-3.5" /> Pinned Announcement
              </span>
            )}
            {upd.pinned && <span aria-hidden="true">·</span>}
            <span className="font-semibold text-[#15803D] dark:text-emerald-400">
              {upd.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{upd.author_name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{formatNewsRelativeTime(upd.created_at, nowTick)}</span>
            {upd.is_premium && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#881337] dark:text-rose-400">Premium</span>
              </>
            )}
          </p>
          <h2 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {upd.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => handleBookmark(upd.id)}
          aria-label="Bookmark update"
          className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 ${
            upd.bookmarked
              ? 'text-[#881337] bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" fill={upd.bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
        {upd.content}
      </p>

      {upd.image_url && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72 bg-slate-100 dark:bg-slate-900">
          <img
            src={upd.image_url}
            alt={upd.title}
            referrerPolicy="no-referrer"
            className="w-full max-h-72 object-cover"
          />
        </div>
      )}

      {upd.video_url && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
          <video src={upd.video_url} controls className="w-full max-h-72" />
        </div>
      )}

      {(upd.attachment_url || upd.external_link) && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {upd.attachment_url && (
            <a
              href={upd.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FileText className="w-4 h-4 text-[#881337] dark:text-rose-400" />
              <span>{upd.attachment_name || 'Download Attachment'}</span>
            </a>
          )}
          {upd.external_link && (
            <a
              href={upd.external_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
            >
              <span>Reference Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleReact(upd.id, 'like')}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
            upd.user_reacted?.includes('like')
              ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{upd.reactions?.like || 0}</span>
        </button>

        <button
          type="button"
          onClick={() => handleReact(upd.id, 'bullish')}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
            upd.user_reacted?.includes('bullish')
              ? 'border-[#15803D] bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{upd.reactions?.bullish || 0}</span>
        </button>
      </div>
    </article>
  );

  return (
    <div className="space-y-5">
      {/* Header + Live Auto-Refresh Pill */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Market Updates &amp; Economic Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time Forex &amp; Gold dispatches, pinned desk notices, and live macroeconomic releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0"
            title="Automatically polling live feeds every 60 seconds"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>● Live Auto-Refresh</span>
          </span>

          <button
            type="button"
            onClick={() => void fetchLiveFeeds({ forceRefresh: true })}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top Two-Tab Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div
          role="tablist"
          aria-label="Updates sections"
          className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/75 dark:bg-slate-800/80 w-full sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 min-h-[44px] transition-colors ${
              activeTab === 'news'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 shrink-0" />
            <span>Live Market News</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 min-h-[44px] transition-colors ${
              activeTab === 'calendar'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span>Economic Calendar</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            {lastSyncedAt
              ? `Updated ${formatNewsRelativeTime(lastSyncedAt, nowTick)}`
              : 'Connecting live feed...'}
          </span>
          {activeTab === 'news' && newsSources.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[220px]">{newsSources.join(', ')}</span>
            </>
          )}
          {activeTab === 'calendar' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[220px]">{localTz}</span>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: LIVE MARKET NEWS */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          {/* Pinned Admin Announcements always anchored at the very top */}
          {pinnedAdminUpdates.length > 0 && (
            <section aria-label="Pinned Desk Announcements" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide text-[#881337] dark:text-rose-400 uppercase flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pinned MeridianFX Announcements</span>
                </h2>
              </div>
              <div className="space-y-4">
                {pinnedAdminUpdates.map((upd) => renderAdminUpdateCard(upd))}
              </div>
            </section>
          )}

          {/* Trending Pair / Asset Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {ASSET_FILTERS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setAssetFilter(tag)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  assetFilter === tag
                    ? 'bg-[#881337] text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Desk Briefings View (if selected) */}
          {assetFilter === 'Desk Briefings' ? (
            unpinnedAdminUpdates.length === 0 && pinnedAdminUpdates.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
                <Radio className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No MeridianFX desk briefings posted yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpinnedAdminUpdates.map((upd) => renderAdminUpdateCard(upd))}
              </div>
            )
          ) : newsLoading && newsArticles.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 animate-pulse"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-5 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              ))}
            </div>
          ) : newsStatus === 'unavailable' && newsArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                {newsMessage || 'Live Forex news feeds are temporarily unavailable.'}
              </p>
            </div>
          ) : filteredNewsArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
              <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No recent headlines matched {assetFilter}. Try selecting All to view the full stream.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredNewsArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setSelectedArticle(article)}
                  className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 hover:border-[#881337]/40 dark:hover:border-rose-500/40 active:scale-[0.995] transition-all flex flex-col justify-between gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337]"
                >
                  <div className="space-y-2.5">
                    {/* Pair/Asset Tag Pills + Relative Timestamp */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                              ASSET_TAG_STYLES[tag] || ASSET_TAG_STYLES.Macro
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                        {formatNewsRelativeTime(article.published_at, nowTick)}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Concise 2-line Summary */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {article.summary}
                    </p>
                  </div>

                  {/* Source Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {article.source}
                      {article.author ? ` · ${article.author}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#881337] dark:text-rose-400 whitespace-nowrap shrink-0">
                      <span>Read brief</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE ECONOMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Quick Filter Pills + Currency Strip */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCalendarQuickFilter('all')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  calendarQuickFilter === 'all'
                    ? 'bg-[#881337] text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setCalendarQuickFilter('high')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  calendarQuickFilter === 'high'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    calendarQuickFilter === 'high' ? 'bg-white' : 'bg-rose-600'
                  }`}
                  aria-hidden="true"
                />
                <span>High Impact (Red)</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarQuickFilter('today')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  calendarQuickFilter === 'today'
                    ? 'bg-[#881337] text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setCalendarQuickFilter('week')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  calendarQuickFilter === 'week'
                    ? 'bg-[#881337] text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                This Week
              </button>
            </div>

            {/* Currency Filter Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {currencies.map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrencyFilter(cur)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap shrink-0 min-h-[36px] transition-colors ${
                    currencyFilter === cur
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cur !== 'ALL' && CURRENCY_FLAGS[cur] && (
                    <span aria-hidden="true">{CURRENCY_FLAGS[cur]}</span>
                  )}
                  <span>{cur === 'ALL' ? 'All Currencies' : cur}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Local Timezone + Source Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400 shrink-0" />
              <span>
                Local phone timezone: <strong className="text-slate-800 dark:text-slate-200">{localTz}</strong>
              </span>
            </div>
            <span className="truncate">
              Feed: {calendarSource || 'FXStreet / Macro Economic Feed'} · {filteredCalendarEvents.length} events
            </span>
          </div>

          {calendarLoading && calendarEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Syncing live economic calendar releases...
            </div>
          ) : calendarStatus === 'unavailable' && calendarEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                {calendarMessage || 'Economic calendar feed unavailable.'}
              </p>
            </div>
          ) : filteredCalendarEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No economic events match the active filter. Try switching to This Week or All.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Interactive Card List (< md) */}
              <div className="md:hidden space-y-3">
                {filteredCalendarEvents.map((ev) => {
                  const local = formatCalendarLocalTime(ev.date_iso);
                  const flag = CURRENCY_FLAGS[ev.currency] || '';
                  return (
                    <div
                      key={ev.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {local.time}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={
                              local.isToday
                                ? 'font-semibold text-[#881337] dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {local.dayLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {flag && <span aria-hidden="true">{flag}</span>}
                            <span>{ev.currency}</span>
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getImpactBadgeClasses(
                              ev.impact
                            )}`}
                          >
                            {ev.impact}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {ev.title}
                      </h3>

                      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Actual</div>
                          <div
                            className={`mt-0.5 font-mono text-xs tabular-nums flex items-center gap-1 ${getActualValueClasses(
                              ev.actual_outcome
                            )}`}
                          >
                            <span>{ev.actual}</span>
                            {ev.actual_outcome === 'better' && <span aria-label="Better than forecast">▲</span>}
                            {ev.actual_outcome === 'worse' && <span aria-label="Worse than forecast">▼</span>}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Forecast</div>
                          <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                            {ev.forecast}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Previous</div>
                          <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {ev.previous}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (md+) */}
              <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 font-semibold">Local Time</th>
                      <th className="py-3 px-4 font-semibold">Currency</th>
                      <th className="py-3 px-4 font-semibold">Impact</th>
                      <th className="py-3 px-4 font-semibold">Event</th>
                      <th className="py-3 px-4 font-semibold text-right">Actual</th>
                      <th className="py-3 px-4 font-semibold text-right">Forecast</th>
                      <th className="py-3 px-4 font-semibold text-right">Previous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCalendarEvents.map((ev) => {
                      const local = formatCalendarLocalTime(ev.date_iso);
                      const flag = CURRENCY_FLAGS[ev.currency] || '';
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              {local.time}
                            </span>{' '}
                            <span
                              className={
                                local.isToday
                                  ? 'text-[#881337] dark:text-rose-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }
                            >
                              · {local.dayLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              {flag && <span aria-hidden="true">{flag}</span>}
                              <span>{ev.currency}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getImpactBadgeClasses(
                                ev.impact
                              )}`}
                            >
                              {ev.impact}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                            {ev.title}
                          </td>
                          <td
                            className={`py-3 px-4 font-mono text-xs text-right tabular-nums whitespace-nowrap ${getActualValueClasses(
                              ev.actual_outcome
                            )}`}
                          >
                            {ev.actual}
                            {ev.actual_outcome === 'better' && ' ▲'}
                            {ev.actual_outcome === 'worse' && ' ▼'}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-right tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {ev.forecast}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-right tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {ev.previous}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* IN-APP NEWS READER DRAWER / MODAL */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-article-title"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />
            </div>

            {/* Reader Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-[#881337] dark:text-rose-400">
                  {selectedArticle.source}
                </span>
                <span className="text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatNewsRelativeTime(selectedArticle.published_at, nowTick)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Close article reader"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reader Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      ASSET_TAG_STYLES[tag] || ASSET_TAG_STYLES.Macro
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  {formatLocalDateTime(selectedArticle.published_at)}
                </span>
              </div>

              <h2
                id="reader-article-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug"
              >
                {selectedArticle.title}
              </h2>

              {selectedArticle.author && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By <strong className="text-slate-700 dark:text-slate-200">{selectedArticle.author}</strong> ·{' '}
                  {selectedArticle.source}
                </p>
              )}

              {selectedArticle.image_url && !brokenImages[selectedArticle.id] && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 max-h-64">
                  <img
                    src={selectedArticle.image_url}
                    alt={selectedArticle.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [selectedArticle.id]: true }))
                    }
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedArticle.full_summary || selectedArticle.summary}
              </div>

              {/* Reader Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  <span>View Source on {selectedArticle.source}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#881337] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
                >
                  Back to Live Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
