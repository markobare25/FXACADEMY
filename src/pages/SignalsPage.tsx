import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { formatLocalDateTime } from '../lib/api';
import type { SignalStatus } from '../types';

export const SignalsPage: React.FC = () => {
  const { signals } = usePlatform();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [pairFilter, setPairFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const pairs = useMemo(() => {
    const set = new Set<string>(signals.map((s) => s.pair));
    return ['ALL', ...Array.from(set).sort()];
  }, [signals]);

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      if (statusFilter === 'active' && !['Active', 'Pending'].includes(s.status)) return false;
      if (statusFilter === 'completed' && !['TP Hit', 'SL Hit', 'Closed'].includes(s.status)) return false;
      if (statusFilter === 'cancelled' && s.status !== 'Cancelled') return false;
      if (pairFilter !== 'ALL' && s.pair !== pairFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !s.pair.toLowerCase().includes(q) &&
          !s.analysis.toLowerCase().includes(q) &&
          !(s.admin_remarks || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [signals, statusFilter, pairFilter, search]);

  const renderStatusLabel = (status: SignalStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#881337] dark:text-rose-400">
            <Clock className="w-3.5 h-3.5" /> Active
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'TP Hit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> TP Hit
          </span>
        );
      case 'SL Hit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9F1239] dark:text-rose-400">
            <XCircle className="w-3.5 h-3.5" /> SL Hit
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Closed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Live Forex Trading Signals
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time channel synchronized automatically with desk updates and historical archive.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pair or analysis..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
          />
        </div>
      </div>

      {/* Transparency Notice distinguishing Educational vs Verified */}
      <div className="rounded-xl border border-rose-200 dark:border-slate-800 bg-rose-50/60 dark:bg-[#111827] px-4 py-3 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <Info className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
        <p>
          <strong>Educational Transparency:</strong> Each signal explicitly states whether it is an{' '}
          <strong>Educational</strong> market study or <strong>Verified</strong> track record entry. All setups carry risk of loss; manage lot size responsibly.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          {(
            [
              { key: 'all', label: 'All Signals' },
              { key: 'active', label: 'Active & Pending' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[#881337] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Pair:</label>
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-1.5 text-xs font-mono font-medium text-slate-900 dark:text-white"
          >
            {pairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Signal Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            No signals match the current filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((sig) => {
            const isBuy = sig.direction === 'BUY';
            const isExpanded = expandedId === sig.id;
            return (
              <article
                key={sig.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {sig.pair}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${
                          isBuy
                            ? 'bg-emerald-50 border border-emerald-200 text-[#15803D] dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400'
                            : 'bg-rose-50 border border-rose-200 text-[#9F1239] dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-400'
                        }`}
                      >
                        {isBuy ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {sig.direction}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {sig.classification} Signal · Timeframe {sig.timeframe} · R:R {sig.risk_reward} ·{' '}
                      {formatLocalDateTime(sig.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0">{renderStatusLabel(sig.status)}</div>
                </div>

                {/* Price Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-slate-100 dark:border-slate-800 py-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Entry Price</span>
                    <span className="mt-0.5 block font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                      {sig.entry_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Stop Loss</span>
                    <span className="mt-0.5 block font-mono text-sm font-semibold text-[#9F1239] dark:text-rose-400 tabular-nums">
                      {sig.stop_loss}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Take Profit 1</span>
                    <span className="mt-0.5 block font-mono text-sm font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                      {sig.tp1}
                    </span>
                  </div>
                  {sig.tp2 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Take Profit 2</span>
                      <span className="mt-0.5 block font-mono text-sm font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                        {sig.tp2}
                      </span>
                    </div>
                  )}
                  {sig.tp3 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Take Profit 3</span>
                      <span className="mt-0.5 block font-mono text-sm font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                        {sig.tp3}
                      </span>
                    </div>
                  )}
                  {sig.tp4 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Take Profit 4</span>
                      <span className="mt-0.5 block font-mono text-sm font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                        {sig.tp4}
                      </span>
                    </div>
                  )}
                </div>

                {/* Analysis */}
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {sig.analysis}
                </p>

                {sig.admin_remarks && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">Desk Note:</strong>{' '}
                    {sig.admin_remarks}
                  </p>
                )}

                {sig.chart_image_url && (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(sig.chart_image_url!)}
                    className="block w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-52 bg-slate-100 dark:bg-slate-900"
                  >
                    <img
                      src={sig.chart_image_url}
                      alt={`${sig.pair} technical chart`}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover hover:opacity-95 transition-opacity"
                    />
                  </button>
                )}

                {/* Follow-up updates timeline */}
                {sig.updates && sig.updates.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : sig.id)}
                      className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                    >
                      {isExpanded
                        ? 'Hide update log'
                        : `View update log (${sig.updates.length})`}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {sig.updates.map((u) => (
                          <div key={u.id} className="text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-mono text-slate-400">
                              {formatLocalDateTime(u.created_at)}
                            </span>{' '}
                            · <span className="font-semibold">{u.status_snapshot}</span> — {u.note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Signal chart attachment"
            className="max-w-4xl max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
