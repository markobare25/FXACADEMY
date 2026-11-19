import type { EconomicEvent, MarketCandle, MarketInstrument } from '../src/types.ts';
import { logSystemEvent } from './db.ts';

interface InstrumentDef {
  symbol: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto';
  yahooSymbol: string;
  decimals: number;
  baseCurrency?: string;
  quoteCurrency?: string;
  coingeckoId?: string;
}

export const TRACKED_INSTRUMENTS: InstrumentDef[] = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Forex', yahooSymbol: 'EURUSD=X', decimals: 5, baseCurrency: 'EUR', quoteCurrency: 'USD' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'Forex', yahooSymbol: 'GBPUSD=X', decimals: 5, baseCurrency: 'GBP', quoteCurrency: 'USD' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'Forex', yahooSymbol: 'USDJPY=X', decimals: 3, baseCurrency: 'USD', quoteCurrency: 'JPY' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'Forex', yahooSymbol: 'AUDUSD=X', decimals: 5, baseCurrency: 'AUD', quoteCurrency: 'USD' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'Forex', yahooSymbol: 'USDCAD=X', decimals: 5, baseCurrency: 'USD', quoteCurrency: 'CAD' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'Forex', yahooSymbol: 'USDCHF=X', decimals: 5, baseCurrency: 'USD', quoteCurrency: 'CHF' },
  { symbol: 'XAUUSD', name: 'Gold Spot / US Dollar', category: 'Commodities', yahooSymbol: 'GC=F', decimals: 2 },
  { symbol: 'XAGUSD', name: 'Silver Spot / US Dollar', category: 'Commodities', yahooSymbol: 'SI=F', decimals: 3 },
  { symbol: 'SPX500', name: 'S&P 500 Index', category: 'Indices', yahooSymbol: '^GSPC', decimals: 2 },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', category: 'Indices', yahooSymbol: '^NDX', decimals: 2 },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'Crypto', yahooSymbol: 'BTC-USD', decimals: 2, coingeckoId: 'bitcoin' },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'Crypto', yahooSymbol: 'ETH-USD', decimals: 2, coingeckoId: 'ethereum' },
];

const TIMEFRAME_MAP: Record<string, { interval: string; range: string }> = {
  '15m': { interval: '15m', range: '5d' },
  '1H': { interval: '60m', range: '1mo' },
  '4H': { interval: '60m', range: '3mo' },
  '1D': { interval: '1d', range: '6mo' },
  '1W': { interval: '1wk', range: '2y' },
};

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const quotesCache: { entry: CacheEntry<MarketInstrument[]> | null } = { entry: null };
const candlesCache = new Map<string, CacheEntry<{ candles: MarketCandle[]; status: 'live' | 'delayed' | 'unavailable'; source: string }>>();
const calendarCache: { entry: CacheEntry<{ status: 'live' | 'unavailable'; source: string; events: EconomicEvent[]; message?: string }> | null } = { entry: null };

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MeridianFX-Platform/1.0',
        Accept: 'application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYahooChart(yahooSymbol: string, interval: string, range: string): Promise<{
  price: number | null;
  prevClose: number | null;
  candles: MarketCandle[];
  isLive: boolean;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
    const res = await fetchWithTimeout(url, 4500);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            marketState?: string;
          };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
              close?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];

    const candles: MarketCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      if (o != null && h != null && l != null && c != null && Number.isFinite(c)) {
        candles.push({
          time: timestamps[i],
          open: o,
          high: h,
          low: l,
          close: c,
        });
      }
    }

    const price =
      typeof meta.regularMarketPrice === 'number'
        ? meta.regularMarketPrice
        : candles.length > 0
          ? candles[candles.length - 1].close
          : null;
    const prevClose =
      typeof meta.chartPreviousClose === 'number'
        ? meta.chartPreviousClose
        : typeof meta.previousClose === 'number'
          ? meta.previousClose
          : candles.length > 1
            ? candles[0].open
            : null;

    return {
      price,
      prevClose,
      candles,
      isLive: meta.marketState === 'REGULAR',
    };
  } catch {
    return null;
  }
}

async function fetchExchangeRatesFallback(): Promise<Record<string, number> | null> {
  try {
    const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 4000);
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    return data.rates || null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoFallback(): Promise<Record<string, { usd?: number; usd_24h_change?: number }> | null> {
  try {
    const res = await fetchWithTimeout(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      4000
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  } catch {
    return null;
  }
}

export async function getMarketQuotes(): Promise<MarketInstrument[]> {
  if (quotesCache.entry && quotesCache.entry.expiresAt > Date.now()) {
    return quotesCache.entry.data;
  }

  const nowIso = new Date().toISOString();
  const results = await Promise.all(
    TRACKED_INSTRUMENTS.map(async (inst) => {
      const yahoo = await fetchYahooChart(inst.yahooSymbol, '1d', '5d');
      if (yahoo && yahoo.price !== null) {
        const change = yahoo.prevClose !== null ? yahoo.price - yahoo.prevClose : null;
        const changePct =
          change !== null && yahoo.prevClose && yahoo.prevClose !== 0
            ? (change / yahoo.prevClose) * 100
            : null;
        return {
          symbol: inst.symbol,
          name: inst.name,
          category: inst.category,
          price: Number(yahoo.price.toFixed(inst.decimals)),
          change: change !== null ? Number(change.toFixed(inst.decimals)) : null,
          change_pct: changePct !== null ? Number(changePct.toFixed(2)) : null,
          status: yahoo.isLive ? ('live' as const) : ('delayed' as const),
          source: 'Yahoo Finance',
          updated_at: nowIso,
          decimals: inst.decimals,
        };
      }
      return null;
    })
  );

  // Fallback for missing Forex / Crypto quotes via ExchangeRate-API & CoinGecko
  const needFx = results.some((r, idx) => r === null && TRACKED_INSTRUMENTS[idx].category === 'Forex');
  const needCrypto = results.some((r, idx) => r === null && TRACKED_INSTRUMENTS[idx].category === 'Crypto');

  const fxRates = needFx ? await fetchExchangeRatesFallback() : null;
  const cgRates = needCrypto ? await fetchCoinGeckoFallback() : null;

  const finalInstruments: MarketInstrument[] = TRACKED_INSTRUMENTS.map((inst, idx) => {
    const existing = results[idx];
    if (existing) return existing;

    if (inst.category === 'Forex' && fxRates && inst.baseCurrency && inst.quoteCurrency) {
      let price: number | null = null;
      if (inst.baseCurrency === 'USD' && fxRates[inst.quoteCurrency]) {
        price = fxRates[inst.quoteCurrency];
      } else if (inst.quoteCurrency === 'USD' && fxRates[inst.baseCurrency]) {
        price = 1 / fxRates[inst.baseCurrency];
      }
      if (price !== null) {
        return {
          symbol: inst.symbol,
          name: inst.name,
          category: inst.category,
          price: Number(price.toFixed(inst.decimals)),
          change: null,
          change_pct: null,
          status: 'delayed',
          source: 'ExchangeRate-API',
          updated_at: nowIso,
          decimals: inst.decimals,
        };
      }
    }

    if (inst.category === 'Crypto' && cgRates && inst.coingeckoId && cgRates[inst.coingeckoId]?.usd) {
      const cg = cgRates[inst.coingeckoId];
      const price = cg.usd!;
      const pct = typeof cg.usd_24h_change === 'number' ? cg.usd_24h_change : null;
      return {
        symbol: inst.symbol,
        name: inst.name,
        category: inst.category,
        price: Number(price.toFixed(inst.decimals)),
        change: pct !== null ? Number(((price * pct) / 100).toFixed(inst.decimals)) : null,
        change_pct: pct !== null ? Number(pct.toFixed(2)) : null,
        status: 'live',
        source: 'CoinGecko',
        updated_at: nowIso,
        decimals: inst.decimals,
      };
    }

    return {
      symbol: inst.symbol,
      name: inst.name,
      category: inst.category,
      price: null,
      change: null,
      change_pct: null,
      status: 'unavailable',
      source: 'Upstream feed unavailable',
      updated_at: nowIso,
      decimals: inst.decimals,
    };
  });

  quotesCache.entry = {
    data: finalInstruments,
    expiresAt: Date.now() + 45_000,
  };
  return finalInstruments;
}

function aggregate4HCandles(hourly: MarketCandle[]): MarketCandle[] {
  const buckets = new Map<number, MarketCandle>();
  for (const c of hourly) {
    const bucketTime = Math.floor(c.time / (4 * 3600)) * (4 * 3600);
    const existing = buckets.get(bucketTime);
    if (!existing) {
      buckets.set(bucketTime, { ...c, time: bucketTime });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

export async function getMarketCandles(
  symbol: string,
  timeframe: string
): Promise<{ candles: MarketCandle[]; status: 'live' | 'delayed' | 'unavailable'; source: string }> {
  const inst = TRACKED_INSTRUMENTS.find((i) => i.symbol === symbol.toUpperCase());
  if (!inst) {
    return { candles: [], status: 'unavailable', source: 'Unknown instrument' };
  }

  const tf = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1H'];
  const cacheKey = `${inst.symbol}:${timeframe}`;
  const cached = candlesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const yahoo = await fetchYahooChart(inst.yahooSymbol, tf.interval, tf.range);
  if (yahoo && yahoo.candles.length > 0) {
    const candles = timeframe === '4H' ? aggregate4HCandles(yahoo.candles) : yahoo.candles;
    const payload = {
      candles,
      status: yahoo.isLive ? ('live' as const) : ('delayed' as const),
      source: 'Yahoo Finance',
    };
    candlesCache.set(cacheKey, { data: payload, expiresAt: Date.now() + 60_000 });
    return payload;
  }

  // Fallback for Forex daily candles via Frankfurter ECB historical rates
  if (inst.category === 'Forex' && inst.baseCurrency && inst.quoteCurrency) {
    try {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
      const url = `https://api.frankfurter.app/${start}..${end}?from=${inst.baseCurrency}&to=${inst.quoteCurrency}`;
      const res = await fetchWithTimeout(url, 4500);
      if (res.ok) {
        const data = (await res.json()) as { rates?: Record<string, Record<string, number>> };
        if (data.rates) {
          const entries = Object.entries(data.rates).sort(([a], [b]) => a.localeCompare(b));
          const candles: MarketCandle[] = [];
          let prev = 0;
          for (const [dateStr, rateObj] of entries) {
            const close = rateObj[inst.quoteCurrency];
            if (typeof close !== 'number') continue;
            const open = prev || close;
            const high = Math.max(open, close);
            const low = Math.min(open, close);
            candles.push({
              time: Math.floor(new Date(dateStr).getTime() / 1000),
              open,
              high,
              low,
              close,
            });
            prev = close;
          }
          if (candles.length > 0) {
            const payload = { candles, status: 'delayed' as const, source: 'European Central Bank (Frankfurter)' };
            candlesCache.set(cacheKey, { data: payload, expiresAt: Date.now() + 300_000 });
            return payload;
          }
        }
      }
    } catch {
      // fall through
    }
  }

  return { candles: [], status: 'unavailable', source: 'Market chart feed unavailable' };
}

export async function getEconomicCalendar(): Promise<{
  status: 'live' | 'unavailable';
  source: string;
  events: EconomicEvent[];
  message?: string;
}> {
  if (calendarCache.entry && calendarCache.entry.expiresAt > Date.now()) {
    return calendarCache.entry.data;
  }

  try {
    const res = await fetchWithTimeout('https://nfs.faireconomy.media/ff_calendar_thisweek.json', 5000);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const raw = (await res.json()) as Array<{
      title?: string;
      country?: string;
      date?: string;
      impact?: string;
      forecast?: string;
      previous?: string;
      actual?: string;
    }>;

    const events: EconomicEvent[] = raw
      .filter((item) => item.title && item.date)
      .map((item, idx) => {
        const impactRaw = (item.impact || 'Low').toLowerCase();
        const impact: 'Low' | 'Medium' | 'High' =
          impactRaw.includes('high') ? 'High' : impactRaw.includes('medium') ? 'Medium' : 'Low';
        const currency = (item.country || 'USD').toUpperCase();
        return {
          id: `${currency}-${idx}-${item.date}`,
          title: item.title || 'Economic Release',
          country: currency,
          currency,
          date_iso: item.date || new Date().toISOString(),
          impact,
          forecast: item.forecast || '—',
          previous: item.previous || '—',
          actual: item.actual || '—',
        };
      });

    const payload = {
      status: 'live' as const,
      source: 'ForexFactory Weekly Feed',
      events,
    };
    calendarCache.entry = { data: payload, expiresAt: Date.now() + 15 * 60 * 1000 };
    return payload;
  } catch (err) {
    logSystemEvent('warn', 'calendar', `Failed to fetch external calendar: ${String(err)}`);
    return {
      status: 'unavailable',
      source: 'ForexFactory Weekly Feed',
      events: [],
      message: 'Unable to reach external economic calendar feed right now. Please try again shortly.',
    };
  }
}
