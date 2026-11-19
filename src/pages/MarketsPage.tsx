import React, { useEffect, useState } from 'react';
import { RefreshCw, Star, AlertTriangle } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { CandlestickChart } from '../components/CandlestickChart';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import type { MarketCandle, MarketInstrument } from '../types';

export const MarketsPage: React.FC = () => {
  const { user, setUser, theme, navigate } = usePlatform();
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EURUSD');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [chartStatus, setChartStatus] = useState<'live' | 'delayed' | 'unavailable'>('delayed');
  const [chartSource, setChartSource] = useState<string>('');
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'All' | MarketInstrument['category']>('All');

  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await apiFetch<{ instruments: MarketInstrument[] }>('/api/markets');
      setInstruments(res.instruments);
    } catch {
      // ignore
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchCandles = async (sym: string, tf: string) => {
    setLoadingChart(true);
    try {
      const res = await apiFetch<{
        candles: MarketCandle[];
        status: 'live' | 'delayed' | 'unavailable';
        source: string;
      }>(`/api/markets/${encodeURIComponent(sym)}/candles?timeframe=${encodeURIComponent(tf)}`);
      setCandles(res.candles);
      setChartStatus(res.status);
      setChartSource(res.source);
    } catch {
      setCandles([]);
      setChartStatus('unavailable');
      setChartSource('Feed unavailable');
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    fetchCandles(selectedSymbol, timeframe);
  }, [selectedSymbol, timeframe]);

  const activeInstrument = instruments.find((i) => i.symbol === selectedSymbol);
  const filteredInstruments = instruments.filter(
    (i) => categoryFilter === 'All' || i.category === categoryFilter
  );

  const toggleWatchlist = async (symbol: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const exists = user.watchlist.includes(symbol);
    const next = exists ? user.watchlist.filter((s) => s !== symbol) : [...user.watchlist, symbol];
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/watchlist', {
        method: 'PATCH',
        body: JSON.stringify({ watchlist: next }),
      });
      if (res.user) setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Live Market Overview & Charts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Forex majors, Gold (XAUUSD), Silver (XAGUSD), Indices, and Crypto sourced from external market APIs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchQuotes();
            fetchCandles(selectedSymbol, timeframe);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQuotes ? 'animate-spin' : ''}`} />
          <span>Refresh Quotes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Candlestick Chart */}
        <section className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1321] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {selectedSymbol}
                </h2>
                {activeInstrument?.price !== null && activeInstrument?.price !== undefined && (
                  <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                    {activeInstrument.price.toFixed(activeInstrument.decimals)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeInstrument?.name || selectedSymbol} · Feed Status:{' '}
                <strong className="capitalize">{chartStatus}</strong> ({chartSource || 'External API'})
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {['15m', '1H', '4H', '1D', '1W'].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-[#881337] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {loadingChart ? (
            <div className="h-[380px] flex items-center justify-center text-sm text-slate-500">
              Loading market candles...
            </div>
          ) : candles.length > 0 ? (
            <CandlestickChart
              candles={candles}
              theme={theme}
              decimals={activeInstrument?.decimals ?? 4}
              height={380}
            />
          ) : (
            <div className="h-[380px] flex flex-col items-center justify-center text-center px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                Historical candle feed currently unavailable for {selectedSymbol}.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                MeridianFX never displays invented or simulated prices.
              </p>
            </div>
          )}
        </section>

        {/* Instrument Selector & Watchlist */}
        <section className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-col">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-100 dark:border-slate-800">
            {(['All', 'Forex', 'Commodities', 'Indices', 'Crypto'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#881337] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[420px]">
            {filteredInstruments.map((inst) => {
              const watched = user?.watchlist.includes(inst.symbol);
              const selected = selectedSymbol === inst.symbol;
              return (
                <div
                  key={inst.symbol}
                  className={`py-3 px-2 flex items-center justify-between gap-2 transition-colors ${
                    selected ? 'bg-rose-50/80 dark:bg-rose-950/20 rounded-lg' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSymbol(inst.symbol)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {inst.symbol}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {inst.category} · <span className="capitalize">{inst.status}</span>
                    </p>
                  </button>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                      {inst.price !== null ? inst.price.toFixed(inst.decimals) : 'N/A'}
                    </p>
                    {inst.change_pct !== null ? (
                      <p
                        className={`font-mono text-[11px] tabular-nums ${
                          inst.change_pct >= 0
                            ? 'text-[#15803D] dark:text-emerald-400'
                            : 'text-[#9F1239] dark:text-rose-400'
                        }`}
                      >
                        {inst.change_pct >= 0 ? '+' : ''}
                        {inst.change_pct}%
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">{inst.source}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWatchlist(inst.symbol)}
                    aria-label={`Toggle ${inst.symbol} watchlist`}
                    className={`p-2 rounded-lg shrink-0 ${
                      watched ? 'text-[#881337] dark:text-rose-400' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={watched ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
          </div>
          {activeInstrument && (
            <p className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Updated {formatLocalDateTime(activeInstrument.updated_at)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
