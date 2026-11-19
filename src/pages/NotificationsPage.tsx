import React, { useState } from 'react';
import { Bell, BellRing, Check, CheckCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';

export const NotificationsPage: React.FC = () => {
  const {
    user,
    authLoading,
    notifications,
    unreadCount,
    refreshNotifications,
    navigate,
    setShowNotifModal,
  } = usePlatform();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (authLoading && !user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
        Loading notifications...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notification Centre</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to view your real-time signal and platform alerts.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-4 rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const markRead = async (id: string, targetUrl: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    await refreshNotifications();
    if (targetUrl && targetUrl !== '/notifications') {
      navigate(targetUrl);
    }
  };

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    await refreshNotifications();
  };

  const visible = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notification Centre
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount} unread alerts across signals, updates, and Academy releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNotifModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
          >
            <BellRing className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
            <span>Device Push Setup</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            filter === 'all'
              ? 'bg-[#881337] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          All Alerts
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            filter === 'unread'
              ? 'bg-[#881337] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
        {visible.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">No notifications in this view.</p>
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 ${
                n.is_read ? 'opacity-75' : 'bg-rose-50/50 dark:bg-rose-950/15'
              }`}
            >
              <button
                type="button"
                onClick={() => markRead(n.id, n.link_url)}
                className="text-left flex-1 min-w-0"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize font-semibold text-[#881337] dark:text-rose-400">
                    {n.category.replace('_', ' ')}
                  </span>{' '}
                  · {formatLocalDateTime(n.created_at)} {!n.is_read ? '· Unread' : ''}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {n.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
              </button>

              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id, '/notifications')}
                  className="p-2 rounded-lg text-slate-400 hover:text-[#15803D] shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
