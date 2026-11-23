import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  Bookmark,
  CandlestickChart,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime, formatRelativeTime } from '../lib/api';
import { getCurrentPushSubscription } from '../lib/pushClient';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { MarketInstrument } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, authLoading, signals, updates, courses, navigate, setShowNotifModal } = usePlatform();
  const [watchlistQuotes, setWatchlistQuotes] = useState<MarketInstrument[]>([]);
  const [pushActive, setPushActive] = useState(false);

  useEffect(() => {
    getCurrentPushSubscription().then((sub) => setPushActive(Boolean(sub)));
    apiFetch<{ instruments: MarketInstrument[] }>('/api/markets')
      .then((res) => setWatchlistQuotes(res.instruments))
      .catch(() => undefined);
  }, []);

  if (authLoading && !user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
        Restoring your workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Premium Member Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Approved Premium Members can sign in on the Profile page to access synced watchlists and member briefings, or apply for membership.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B]"
          >
            Premium Member Sign In &amp; Apply
          </button>
          <button
            type="button"
            onClick={() => navigate('/signals')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Open Public Signals
          </button>
        </div>
      </div>
    );
  }

  const activeSignals = signals.filter((s) => s.status === 'Active' || s.status === 'Pending');
  const bookmarkedUpdates = updates.filter((u) => u.bookmarked);
  const enrolledCourses = courses.filter((c) => c.enrolled);
  const watchedInstruments = watchlistQuotes.filter((q) => user.watchlist.includes(q.symbol));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Synchronized workspace · Timezone {user.timezone || 'UTC'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton variant="compact" label="INSTALL APP" />
          {!pushActive && (
            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] transition-colors min-h-[40px]"
            >
              <BellRing className="w-4 h-4" />
              <span>Enable Push Alerts</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold">
              {user.role === 'admin' ? 'Administrator Account' : 'Approved Premium Membership'}
            </strong>
            {user.username ? ` · @${user.username}` : ''} · Active
            {user.membership_expires_at
              ? ` · Expires ${formatLocalDateTime(user.membership_expires_at)}`
              : user.role === 'admin'
                ? ''
                : ' · No Expiry'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="font-semibold text-[#881337] dark:text-rose-400 hover:underline shrink-0"
        >
          Manage Profile &amp; Security
        </button>
      </div>

      {/* Watchlist Strip */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CandlestickChart className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Watchlist</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/markets')}
            className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
          >
            Open Live Charts
          </button>
        </div>

        {watchedInstruments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No watchlist instruments selected yet. Add pairs from Live Markets.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {watchedInstruments.map((inst) => (
              <button
                key={inst.symbol}
                type="button"
                onClick={() => navigate('/markets')}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-[#881337]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {inst.symbol}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">{inst.status}</span>
                </div>
                <p className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {inst.price !== null ? inst.price.toFixed(inst.decimals) : 'Unavailable'}
                </p>
                {inst.change_pct !== null && (
                  <p
                    className={`text-xs font-mono tabular-nums ${
                      inst.change_pct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {inst.change_pct >= 0 ? '+' : ''}
                    {inst.change_pct}%
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Signals Feed */}
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active & Pending Signals ({activeSignals.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/signals')}
              className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeSignals.slice(0, 4).map((sig) => {
              const isBuy = sig.direction === 'BUY';
              return (
                <div key={sig.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {sig.pair}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          isBuy ? 'text-[#15803D] dark:text-emerald-400' : 'text-[#9F1239] dark:text-rose-400'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {sig.direction}
                      </span>
                      <span className="text-xs text-slate-500">
                        {sig.status}
                        {sig.is_premium ? ' · Premium' : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      Entry {sig.entry_price} · SL {sig.stop_loss} · TP1 {sig.tp1}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/signals')}
                    className="text-xs font-medium text-[#881337] dark:text-rose-400 hover:underline shrink-0"
                  >
                    Details
                  </button>
                </div>
              );
            })}
            {activeSignals.length === 0 && (
              <p className="text-sm text-slate-500 py-4">No active signals right now. Check recent completed setups in Signals.</p>
            )}
          </div>
        </section>

        {/* Academy Progress & Bookmarks */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Learning Progress
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/academy')}
                className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                Academy
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>You have not started a course yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/academy')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                >
                  <span>Start Foundation Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((c) => {
                  const total = c.total_lessons || 0;
                  const done = c.completed_lessons || 0;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {c.title}
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums shrink-0">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#15803D] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bookmarked Updates ({bookmarkedUpdates.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/updates')}
                className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                Updates Feed
              </button>
            </div>
            {bookmarkedUpdates.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bookmark important market briefings from the Live Updates feed to access them quickly here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {bookmarkedUpdates.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => navigate('/updates')}
                    className="w-full text-left text-xs hover:underline text-slate-700 dark:text-slate-200 block"
                  >
                    <span className="font-semibold">{u.title}</span> ·{' '}
                    <span className="text-slate-500">{formatRelativeTime(u.created_at)}</span>
                  </button>
                ))}
              </div>
            )}
            {pushActive && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Background push notifications enabled on this device.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
