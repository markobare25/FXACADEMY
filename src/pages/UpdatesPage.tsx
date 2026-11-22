import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  FileText,
  Pin,
  Radio,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import type { MarketUpdate, MarketUpdateCategory } from '../types';

const CATEGORIES: Array<'All' | MarketUpdateCategory> = [
  'All',
  'Breaking News',
  'Forex Update',
  'Economic Announcement',
  'Trading Opportunity',
  'Gold & Crypto',
  'Risk Warning',
  'Daily Outlook',
  'Session Alert',
  'Platform Announcement',
];

export const UpdatesPage: React.FC = () => {
  const { user, updates, setUpdates, navigate } = usePlatform();
  const [categoryFilter, setCategoryFilter] = useState<'All' | MarketUpdateCategory>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const filtered = useMemo(() => {
    return updates.filter((u) => {
      if (categoryFilter !== 'All' && u.category !== categoryFilter) return false;
      if (onlyBookmarked && !u.bookmarked) return false;
      return true;
    });
  }, [updates, categoryFilter, onlyBookmarked]);

  const handleReact = async (updateId: string, emoji: string) => {
    if (!user) {
      navigate('/login');
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
      navigate('/login');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Live Market Updates & Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time macro desk briefings, session alerts, and pinned risk notices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOnlyBookmarked((b) => !b)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors min-h-[40px] ${
            onlyBookmarked
              ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{onlyBookmarked ? 'Showing Bookmarked' : 'Bookmarked Only'}</span>
        </button>
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              categoryFilter === cat
                ? 'bg-[#881337] text-white'
                : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
          <Radio className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No market updates found in this view.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((upd) => (
            <article
              key={upd.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    {upd.pinned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#881337] dark:text-rose-400">
                        <Pin className="w-3.5 h-3.5" /> Pinned
                      </span>
                    )}
                    {upd.pinned && <span aria-hidden="true">·</span>}
                    <span className="font-semibold text-[#15803D] dark:text-emerald-400">
                      {upd.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{upd.author_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{formatLocalDateTime(upd.created_at)}</span>
                    {upd.is_premium && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#881337] dark:text-rose-400">
                          Premium
                        </span>
                      </>
                    )}
                  </p>
                  <h2 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                    {upd.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleBookmark(upd.id)}
                  aria-label="Bookmark update"
                  className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
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
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-80 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={upd.image_url}
                    alt={upd.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              )}

              {upd.video_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <video src={upd.video_url} controls className="w-full max-h-80" />
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

              {/* Reactions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleReact(upd.id, 'like')}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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
          ))}
        </div>
      )}
    </div>
  );
};
