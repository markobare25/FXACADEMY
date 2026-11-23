import crypto from 'node:crypto';
import type { EconomicEvent, LiveNewsArticle, MarketCandle, MarketInstrument } from '../src/types.ts';
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
const calendarCache: { entry: CacheEntry<{ status: 'live' | 'unavailable'; source: string; fetched_at: string; events: EconomicEvent[]; message?: string }> | null } = { entry: null };
const newsCache: { entry: CacheEntry<{ status: 'live' | 'unavailable'; fetched_at: string; sources: string[]; articles: LiveNewsArticle[]; message?: string }> | null } = { entry: null };

async function fetchWithTimeout(
  url: string,
  timeoutMs = 5000,
  extraHeaders: Record<string, string> = {}
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        ...extraHeaders,
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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

function htmlToCleanText(raw: string, preserveParagraphs = false): string {
  if (!raw) return '';
  let text = decodeHtmlEntities(raw);
  // Decode double-encoded HTML entities (common in RSS description payloads)
  text = decodeHtmlEntities(text);
  if (preserveParagraphs) {
    text = text
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ');
  }
  text = text.replace(/<[^>]+>/g, ' ');
  if (preserveParagraphs) {
    return text
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return text.replace(/\s+/g, ' ').trim();
}

function extractXmlTag(block: string, tagNames: string[]): string {
  for (const tag of tagNames) {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
    const match = block.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function extractXmlAttr(block: string, tagNames: string[], attrName: string): string {
  for (const tag of tagNames) {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<${escaped}\\s+[^>]*${attrName}=["']([^"']+)["'][^>]*>`, 'i');
    const match = block.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function detectAssetTags(text: string): string[] {
  const tags: string[] = [];
  const rules: Array<{ tag: string; re: RegExp }> = [
    { tag: 'XAU/USD', re: /\b(xau\/?usd|gold|bullion|precious metal|xau)\b/i },
    { tag: 'EUR/USD', re: /\b(eur\/?usd|eur\/?[a-z]{3}|eurozone|ecb|euro\b|lagarde)\b/i },
    { tag: 'GBP/USD', re: /\b(gbp\/?usd|gbp\/?[a-z]{3}|sterling|pound|boe|bank of england|uk economy|uk cpi)\b/i },
    { tag: 'USD/JPY', re: /\b(usd\/?jpy|[a-z]{3}\/?jpy|yen|boj|bank of japan|japanese)\b/i },
    { tag: 'Oil', re: /\b(wti|brent|crude oil|oil prices|opec|barrel)\b/i },
    { tag: 'Crypto', re: /\b(btc|bitcoin|eth|ethereum|crypto|solana|xrp|digital asset)\b/i },
  ];
  for (const rule of rules) {
    if (rule.re.test(text)) tags.push(rule.tag);
  }
  if (tags.length === 0) {
    tags.push('Macro');
  }
  return tags.slice(0, 3);
}

interface NewsFeedSourceConfig {
  url: string;
  source: string;
  category: 'News' | 'Analysis' | 'Macro';
  isGoogleFxStreet?: boolean;
}

const NEWS_PRIMARY_FEEDS: NewsFeedSourceConfig[] = [
  { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet', category: 'News' },
  { url: 'https://www.fxstreet.com/rss/analysis', source: 'FXStreet', category: 'Analysis' },
];

const NEWS_FALLBACK_FEEDS: NewsFeedSourceConfig[] = [
  {
    url: 'https://news.google.com/rss/search?q=site:fxstreet.com+(forex+OR+gold+OR+XAU+OR+EUR+OR+GBP+OR+USD+OR+JPY+OR+Bitcoin+OR+Oil)&hl=en-US&gl=US&ceid=US:en',
    source: 'FXStreet',
    category: 'News',
    isGoogleFxStreet: true,
  },
  { url: 'https://www.forexlive.com/feed/news', source: 'ForexLive', category: 'News' },
  { url: 'https://www.actionforex.com/feed/', source: 'ActionForex', category: 'Analysis' },
  { url: 'https://www.investing.com/rss/news_1.rss', source: 'Investing.com', category: 'News' },
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X,GC=F,GBPUSD=X,USDJPY=X,CL=F,BTC-USD&region=US&lang=en-US',
    source: 'Yahoo Finance',
    category: 'Macro',
  },
];

function parseRssFeed(xml: string, cfg: NewsFeedSourceConfig): LiveNewsArticle[] {
  const trimmed = xml.trim();
  if (!trimmed || (!trimmed.includes('<rss') && !trimmed.includes('<feed'))) {
    return [];
  }

  const itemMatches = [
    ...trimmed.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi),
    ...trimmed.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi),
  ];

  const articles: LiveNewsArticle[] = [];
  for (const match of itemMatches.slice(0, 20)) {
    const block = match[1];
    let title = htmlToCleanText(extractXmlTag(block, ['title']));
    if (!title) continue;

    if (cfg.isGoogleFxStreet) {
      title = title.replace(/\s*[-–|]\s*FXStreet\s*$/i, '').trim();
    }

    let link = htmlToCleanText(extractXmlTag(block, ['link', 'guid']));
    if (!link) {
      link = extractXmlAttr(block, ['link'], 'href');
    }
    if (!link || !/^https?:\/\//i.test(link)) {
      link = 'https://www.fxstreet.com/news';
    }

    const rawPubDate = htmlToCleanText(extractXmlTag(block, ['pubDate', 'published', 'updated', 'dc:date']));
    const parsedTime = rawPubDate ? Date.parse(rawPubDate) : NaN;
    const publishedAt = Number.isFinite(parsedTime) ? new Date(parsedTime).toISOString() : new Date().toISOString();

    const rawContent =
      extractXmlTag(block, ['content:encoded', 'content']) || extractXmlTag(block, ['description', 'summary']);
    const cleanedParagraphs = htmlToCleanText(rawContent, true);
    const cleanedFlat = htmlToCleanText(rawContent, false);

    const imgFromTag =
      extractXmlAttr(block, ['media:content', 'media:thumbnail', 'enclosure'], 'url') ||
      (rawContent.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i)?.[1] ?? '');
    const imageUrl =
      imgFromTag && /^https?:\/\//i.test(imgFromTag) && !imgFromTag.includes('il-logo-colorful')
        ? imgFromTag
        : null;

    const tags = detectAssetTags(`${title} ${cleanedFlat}`);
    const authorRaw = htmlToCleanText(extractXmlTag(block, ['dc:creator', 'author']));
    const author =
      authorRaw && authorRaw.toLowerCase() !== cfg.source.toLowerCase()
        ? authorRaw.slice(0, 80)
        : null;

    // Google News RSS descriptions often repeat just the headline + publisher name.
    const looksLikeTitleEcho =
      !cleanedFlat ||
      cleanedFlat.length < 48 ||
      cleanedFlat.toLowerCase().startsWith(title.slice(0, 28).toLowerCase());

    const summary = looksLikeTitleEcho
      ? `${cfg.source} real-time market dispatch covering ${tags.join(' & ')} momentum, session drivers, and key technical levels.`
      : cleanedFlat.length > 220
        ? `${cleanedFlat.slice(0, 217).trim()}...`
        : cleanedFlat;

    const fullSummary = looksLikeTitleEcho
      ? `${title}.\n\nSource: ${cfg.source} live forex news desk (${tags.join(', ')}). Open the full external dispatch below for chart embeds and live desk commentary.`
      : cleanedParagraphs.slice(0, 2400);

    const idHash = crypto
      .createHash('sha1')
      .update(`${cfg.source}:${title.toLowerCase()}:${publishedAt.slice(0, 13)}`)
      .digest('hex')
      .slice(0, 16);

    articles.push({
      id: `news-${idHash}`,
      title,
      summary,
      full_summary: fullSummary,
      source: cfg.source,
      author,
      published_at: publishedAt,
      url: link,
      image_url: imageUrl,
      tags,
      category: cfg.category,
    });
  }
  return articles;
}

export async function getLiveForexNews(forceRefresh = false): Promise<{
  status: 'live' | 'unavailable';
  fetched_at: string;
  sources: string[];
  articles: LiveNewsArticle[];
  message?: string;
}> {
  if (!forceRefresh && newsCache.entry && newsCache.entry.expiresAt > Date.now()) {
    return newsCache.entry.data;
  }

  const fetchSource = async (cfg: NewsFeedSourceConfig): Promise<LiveNewsArticle[]> => {
    try {
      const res = await fetchWithTimeout(cfg.url, 4500);
      if (!res.ok) return [];
      const text = await res.text();
      return parseRssFeed(text, cfg);
    } catch {
      return [];
    }
  };

  // Try FXStreet RSS feeds first alongside fallback aggregation if FXStreet is Cloudflare-gated or rate-limited
  const primaryResults = await Promise.all(NEWS_PRIMARY_FEEDS.map(fetchSource));
  const primaryArticles = primaryResults.flat();

  // Always aggregate fallback feeds when FXStreet RSS is gated/empty, or blend for 24/7 pair coverage
  const fallbackResults = await Promise.all(NEWS_FALLBACK_FEEDS.map(fetchSource));
  const combined = [...primaryArticles, ...fallbackResults.flat()];

  if (combined.length === 0) {
    if (newsCache.entry?.data.articles.length) {
      return newsCache.entry.data;
    }
    return {
      status: 'unavailable',
      fetched_at: new Date().toISOString(),
      sources: [],
      articles: [],
      message: 'Live Forex news feeds are temporarily unreachable. Retrying automatically.',
    };
  }

  // Deduplicate by normalized headline, preferring FXStreet or richer summaries
  const dedup = new Map<string, LiveNewsArticle>();
  for (const item of combined) {
    const key = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .slice(0, 72);
    const existing = dedup.get(key);
    if (!existing) {
      dedup.set(key, item);
    } else {
      const itemScore = (item.source === 'FXStreet' ? 2 : 0) + (item.full_summary.length > existing.full_summary.length ? 1 : 0);
      const existingScore = (existing.source === 'FXStreet' ? 2 : 0) + (existing.full_summary.length > item.full_summary.length ? 1 : 0);
      if (itemScore > existingScore) {
        dedup.set(key, item);
      }
    }
  }

  const articles = Array.from(dedup.values())
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 45);

  const sources = Array.from(new Set(articles.map((a) => a.source)));
  const payload = {
    status: 'live' as const,
    fetched_at: new Date().toISOString(),
    sources,
    articles,
  };

  newsCache.entry = {
    data: payload,
    expiresAt: Date.now() + 55_000,
  };
  return payload;
}

function parseNumericMetric(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const cleaned = String(raw).trim().replace(/,/g, '');
  if (!cleaned || cleaned === '—' || cleaned === '-') return null;
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*([KMBT%])?/i);
  if (!match) return null;
  let val = Number.parseFloat(match[1]);
  if (!Number.isFinite(val)) return null;
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') val *= 1e3;
  else if (suffix === 'M') val *= 1e6;
  else if (suffix === 'B') val *= 1e9;
  else if (suffix === 'T') val *= 1e12;
  return val;
}

function computeActualOutcome(
  title: string,
  actual: string,
  forecast: string,
  explicitBetter?: boolean | null
): 'better' | 'worse' | 'inline' | 'pending' {
  if (!actual || actual === '—') return 'pending';
  if (explicitBetter === true) return 'better';
  if (explicitBetter === false) return 'worse';

  const actNum = parseNumericMetric(actual);
  const fcstNum = parseNumericMetric(forecast);
  if (actNum === null || fcstNum === null) return 'inline';
  if (Math.abs(actNum - fcstNum) < 1e-9) return 'inline';

  const lowerIsBetter = /\b(unemployment|jobless|claims|deficit)\b/i.test(title);
  if (lowerIsBetter) {
    return actNum < fcstNum ? 'better' : 'worse';
  }
  return actNum > fcstNum ? 'better' : 'worse';
}

function formatTvMetric(val: number | null | undefined, unit?: string | null, scale?: string | null): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  const unitStr = unit === '%' ? '%' : '';
  const scaleStr = scale && unit !== '%' ? scale : '';
  const formatted = Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)));
  return `${formatted}${scaleStr}${unitStr}`;
}

export async function getEconomicCalendar(forceRefresh = false): Promise<{
  status: 'live' | 'unavailable';
  source: string;
  fetched_at: string;
  events: EconomicEvent[];
  message?: string;
}> {
  if (!forceRefresh && calendarCache.entry && calendarCache.entry.expiresAt > Date.now()) {
    return calendarCache.entry.data;
  }

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
  const endOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 23, 59, 59));

  // 1. Try FXStreet Economic Calendar API
  try {
    const fxsUrl = `https://calendar-api.fxstreet.com/en/api/v1/eventDates/${startOfToday.toISOString()}/${endOfWeek.toISOString()}`;
    const res = await fetchWithTimeout(fxsUrl, 4500, {
      Accept: 'application/json',
      Origin: 'https://www.fxstreet.com',
      Referer: 'https://www.fxstreet.com/',
    });
    if (res.ok) {
      const raw = (await res.json()) as Array<{
        id?: string;
        name?: string;
        countryCode?: string;
        currencyCode?: string;
        dateUtc?: string;
        volatility?: string;
        actual?: number | null;
        consensus?: number | null;
        previous?: number | null;
        unit?: string | null;
        potency?: string | null;
        isBetterThanExpected?: boolean | null;
      }>;

      if (Array.isArray(raw) && raw.length > 0) {
        const events: EconomicEvent[] = raw
          .filter((item) => item.name && item.dateUtc && item.currencyCode)
          .map((item, idx) => {
            const vol = (item.volatility || 'LOW').toUpperCase();
            const impact: 'Low' | 'Medium' | 'High' =
              vol === 'HIGH' ? 'High' : vol === 'MEDIUM' ? 'Medium' : 'Low';
            const potencyUpper = (item.potency || '').trim().toUpperCase();
            const potencySuffix = ['K', 'M', 'B', 'T'].includes(potencyUpper) ? potencyUpper : '';
            const unit = item.unit === '%' ? '%' : item.unit && item.unit !== 'ZERO' ? item.unit : potencySuffix;
            const fmt = (v: number | null | undefined) =>
              v === null || v === undefined ? '—' : `${v}${unit}`;
            const actual = fmt(item.actual);
            const forecast = fmt(item.consensus);
            const previous = fmt(item.previous);
            const currency = (item.currencyCode || item.countryCode || 'USD').toUpperCase();
            return {
              id: item.id || `fxs-${currency}-${idx}`,
              title: item.name || 'Economic Release',
              country: (item.countryCode || currency).toUpperCase(),
              currency,
              date_iso: item.dateUtc || now.toISOString(),
              impact,
              forecast,
              previous,
              actual,
              actual_outcome: computeActualOutcome(
                item.name || '',
                actual,
                forecast,
                item.isBetterThanExpected
              ),
              source: 'FXStreet Calendar',
            };
          })
          .sort((a, b) => new Date(a.date_iso).getTime() - new Date(b.date_iso).getTime());

        if (events.length > 0) {
          const payload = {
            status: 'live' as const,
            source: 'FXStreet Economic Calendar',
            fetched_at: new Date().toISOString(),
            events,
          };
          calendarCache.entry = { data: payload, expiresAt: Date.now() + 55_000 };
          return payload;
        }
      }
    }
  } catch {
    // Fall through to ForexFactory / TradingView
  }

  // 2. Try TradingView Live Macro Calendar (reliable, zero Cloudflare block, full actual/forecast/previous)
  try {
    const tvUrl = `https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(startOfToday.toISOString())}&to=${encodeURIComponent(endOfWeek.toISOString())}&countries=US,EU,GB,JP,AU,CA,CH,NZ`;
    const res = await fetchWithTimeout(tvUrl, 5000, {
      Accept: 'application/json',
      Origin: 'https://www.tradingview.com',
      Referer: 'https://www.tradingview.com/',
    });
    if (res.ok) {
      const json = (await res.json()) as {
        status?: string;
        result?: Array<{
          id?: string;
          title?: string;
          country?: string;
          currency?: string;
          date?: string;
          importance?: number;
          actual?: number | null;
          forecast?: number | null;
          previous?: number | null;
          unit?: string | null;
          scale?: string | null;
          comment?: string;
        }>;
      };
      if (Array.isArray(json.result) && json.result.length > 0) {
        const events: EconomicEvent[] = json.result
          .filter((item) => item.title && item.date)
          .map((item, idx) => {
            const impact: 'Low' | 'Medium' | 'High' =
              item.importance === 1 ? 'High' : item.importance === 0 ? 'Medium' : 'Low';
            const actual = formatTvMetric(item.actual, item.unit, item.scale);
            const forecast = formatTvMetric(item.forecast, item.unit, item.scale);
            const previous = formatTvMetric(item.previous, item.unit, item.scale);
            const currency = (item.currency || 'USD').toUpperCase();
            return {
              id: item.id || `tv-${currency}-${idx}`,
              title: item.title || 'Economic Release',
              country: (item.country || currency).toUpperCase(),
              currency,
              date_iso: item.date || now.toISOString(),
              impact,
              forecast,
              previous,
              actual,
              actual_outcome: computeActualOutcome(item.title || '', actual, forecast),
              source: 'TradingView Macro Feed',
              comment: item.comment,
            };
          })
          .sort((a, b) => new Date(a.date_iso).getTime() - new Date(b.date_iso).getTime());

        const payload = {
          status: 'live' as const,
          source: 'TradingView / Macro Economic Feed',
          fetched_at: new Date().toISOString(),
          events,
        };
        calendarCache.entry = { data: payload, expiresAt: Date.now() + 55_000 };
        return payload;
      }
    }
  } catch {
    // Fall through to FairEconomy
  }

  // 3. Fallback: ForexFactory / FairEconomy Weekly JSON
  try {
    const res = await fetchWithTimeout('https://nfs.faireconomy.media/ff_calendar_thisweek.json', 5000);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error('FairEconomy rate limited');
    }
    const raw = JSON.parse(text) as Array<{
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
        const actual = item.actual || '—';
        const forecast = item.forecast || '—';
        const previous = item.previous || '—';
        return {
          id: `ff-${currency}-${idx}-${item.date}`,
          title: item.title || 'Economic Release',
          country: currency,
          currency,
          date_iso: item.date || now.toISOString(),
          impact,
          forecast,
          previous,
          actual,
          actual_outcome: computeActualOutcome(item.title || '', actual, forecast),
          source: 'ForexFactory Weekly Feed',
        };
      })
      .sort((a, b) => new Date(a.date_iso).getTime() - new Date(b.date_iso).getTime());

    const payload = {
      status: 'live' as const,
      source: 'ForexFactory Weekly Feed',
      fetched_at: new Date().toISOString(),
      events,
    };
    calendarCache.entry = { data: payload, expiresAt: Date.now() + 55_000 };
    return payload;
  } catch (err) {
    logSystemEvent('warn', 'calendar', `Failed to fetch external calendar: ${String(err)}`);
    if (calendarCache.entry?.data.events.length) {
      return calendarCache.entry.data;
    }
    return {
      status: 'unavailable',
      source: 'Economic Calendar Feed',
      fetched_at: new Date().toISOString(),
      events: [],
      message: 'Unable to reach external economic calendar feed right now. Retrying automatically.',
    };
  }
}
