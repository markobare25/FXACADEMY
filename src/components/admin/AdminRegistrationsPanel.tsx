import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatLocalDateTime, getOrCreateVisitorId } from '../../lib/api';
import { getAdminAccessToken, refreshAdminSession } from '../../lib/adminApi';
import type { RegistrationAnalyticsPayload } from '../../types';

interface AdminRegistrationsPanelProps {
  analytics: RegistrationAnalyticsPayload | null;
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
}

type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export const AdminRegistrationsPanel: React.FC<AdminRegistrationsPanelProps> = ({
  analytics,
  onRefresh,
  onError,
}) => {
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const trendPoints = useMemo(() => {
    if (!analytics) return [];
    return analytics.trends[granularity] || [];
  }, [analytics, granularity]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...trendPoints.map((p) => p.count));
  }, [trendPoints]);

  const filteredRecords = useMemo(() => {
    if (!analytics) return [];
    const q = search.trim().toLowerCase();
    return analytics.records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (verifiedFilter === 'verified' && !r.email_verified) return false;
      if (verifiedFilter === 'unverified' && r.email_verified) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.timezone || '').toLowerCase().includes(q) ||
        (r.bio || '').toLowerCase().includes(q)
      );
    });
  }, [analytics, search, statusFilter, verifiedFilter]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      let token = getAdminAccessToken();
      if (!token) {
        const refreshed = await refreshAdminSession();
        token = refreshed?.token || null;
      }
      const headers = new Headers({
        'X-Visitor-Id': getOrCreateVisitorId(),
        'X-Requested-With': 'MeridianFX-Admin',
      });
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch('/api/admin/registrations/export', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meridianfx-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to export registration CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
        Loading registration analytics...
      </div>
    );
  }

  const { summary } = analytics;
  const verifiedPct =
    summary.total_users > 0
      ? Math.round((summary.verified_users / summary.total_users) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Member Account Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracks administrator-managed member accounts. Self-service public registration is disabled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Member Accounts</span>
            <Users className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.total_users}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Provisioned member accounts
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>New Member Additions</span>
            <CalendarDays className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            +{summary.new_7d}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary.new_today} today · {summary.new_30d} in 30d
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Account Status</span>
            <UserCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.active_users}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Active · {summary.suspended_users} suspended
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Verified Accounts</span>
            <ShieldCheck className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.verified_users}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {verifiedPct}% verified · {summary.unverified_users} unverified
          </p>
        </div>
      </div>

      {/* Registration Trends Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Registration Trends ({granularity === 'daily' ? 'Last 14 Days' : granularity === 'weekly' ? 'Last 12 Weeks' : 'Last 12 Months'})
            </h3>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            {(['daily', 'weekly', 'monthly'] as TrendGranularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  granularity === g
                    ? 'bg-[#881337] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 lg:grid-cols-14 gap-2 items-end h-44 pt-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          {trendPoints.map((pt) => {
            const pct = pt.count === 0 ? 4 : Math.max(12, Math.round((pt.count / maxCount) * 100));
            return (
              <div
                key={pt.key}
                className="flex flex-col items-center justify-end h-full gap-1 min-w-0"
                title={`${pt.label}: ${pt.count} registration${pt.count === 1 ? '' : 's'}`}
              >
                <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {pt.count}
                </span>
                <div className="w-full max-w-[26px] flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      pt.count > 0
                        ? 'bg-[#881337] dark:bg-rose-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Records Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Registration Records ({filteredRecords.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, timezone..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter by account status"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
              aria-label="Filter by verification status"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-4">Member</th>
                <th className="py-2 pr-4">Voluntary Profile Info</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Registered At</th>
                <th className="py-2">Last Sign In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No registered community members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{r.email}</p>
                    </td>
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        TZ: {r.timezone || 'UTC'}
                      </p>
                      {r.bio ? (
                        <p className="text-[11px] text-slate-500 truncate">{r.bio}</p>
                      ) : (
                        <p className="text-[11px] text-slate-400">No bio provided</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.email_verified && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatLocalDateTime(r.created_at)}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {r.last_login_at ? formatLocalDateTime(r.last_login_at) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
