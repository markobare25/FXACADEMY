import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import type { EconomicEvent } from '../types';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [status, setStatus] = useState<'live' | 'unavailable'>('live');
  const [source, setSource] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        status: 'live' | 'unavailable';
        source: string;
        events: EconomicEvent[];
        message?: string;
      }>('/api/calendar');
      setEvents(res.events);
      setStatus(res.status);
      setSource(res.source);
      setMessage(res.message);
    } catch {
      setStatus('unavailable');
      setMessage('Unable to reach economic calendar API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const currencies = useMemo(() => {
    const s = new Set(events.map((e) => e.currency));
    return ['ALL', ...Array.from(s).sort()];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (currencyFilter !== 'ALL' && ev.currency !== currencyFilter) return false;
      if (impactFilter !== 'ALL' && ev.impact !== impactFilter) return false;
      if (dateFilter) {
        const localDate = new Date(ev.date_iso).toISOString().slice(0, 10);
        if (localDate !== dateFilter) return false;
      }
      return true;
    });
  }, [events, currencyFilter, impactFilter, dateFilter]);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Global Economic Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Displayed in your local timezone ({localTz}) · Source: {source || 'External Macro Feed'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadCalendar}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'All Currencies' : c}
            </option>
          ))}
        </select>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          {(['ALL', 'High', 'Medium', 'Low'] as const).map((imp) => (
            <button
              key={imp}
              type="button"
              onClick={() => setImpactFilter(imp)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                impactFilter === imp
                  ? 'bg-[#881337] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {imp === 'ALL' ? 'All Impact' : imp}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter('')}
            className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
          >
            Clear Date
          </button>
        )}
      </div>

      {status === 'unavailable' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {message || 'Economic calendar feed unavailable.'}
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
          Fetching global economic releases...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center">
          <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">No economic events match the selected filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-medium">Local Time</th>
                <th className="py-3 px-4 font-medium">Currency</th>
                <th className="py-3 px-4 font-medium">Impact</th>
                <th className="py-3 px-4 font-medium">Event</th>
                <th className="py-3 px-4 font-medium text-right">Previous</th>
                <th className="py-3 px-4 font-medium text-right">Forecast</th>
                <th className="py-3 px-4 font-medium text-right">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatLocalDateTime(ev.date_iso)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {ev.currency}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold">
                    <span
                      className={
                        ev.impact === 'High'
                          ? 'text-[#9F1239] dark:text-rose-400'
                          : ev.impact === 'Medium'
                            ? 'text-[#15803D] dark:text-emerald-400'
                            : 'text-slate-500'
                      }
                    >
                      {ev.impact}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                    {ev.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-right tabular-nums text-slate-500">
                    {ev.previous}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {ev.forecast}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-right tabular-nums font-semibold text-[#881337] dark:text-rose-400">
                    {ev.actual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
