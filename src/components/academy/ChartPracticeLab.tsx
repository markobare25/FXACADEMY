import React, { useEffect, useMemo, useState } from 'react';
import { CandlestickChart as CandlestickChartIcon, CheckCircle2, Eye, RefreshCw, Target } from 'lucide-react';
import { CandlestickChart } from '../CandlestickChart';
import { usePlatform } from '../../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../../lib/api';
import type { MarketCandle } from '../../types';

interface SimBar {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface PracticeScenario {
  id: string;
  title: string;
  symbol: string;
  timeframe: string;
  decimals: number;
  biasPrompt: string;
  recommendedDirection: 'BUY' | 'SELL';
  idealRange: { entryMin: number; entryMax: number; slLimit: number; minRr: number };
  expertExplanation: string;
  bars: SimBar[];
}

const SCENARIOS: PracticeScenario[] = [
  {
    id: 'role-reversal',
    title: '01. Resistance-to-Support Role Reversal',
    symbol: 'EUR/USD (Simulated)',
    timeframe: 'H4 Educational',
    decimals: 4,
    biasPrompt:
      'Price previously rejected 1.0880 twice before closing decisively above 1.0920 and pulling back into the 1.0880 flip zone with a bullish rejection wick. Mark your hypothetical Long Entry, Stop-Loss, and Take-Profit.',
    recommendedDirection: 'BUY',
    idealRange: { entryMin: 1.087, entryMax: 1.0895, slLimit: 1.086, minRr: 2.0 },
    expertExplanation:
      'Role reversal places the Long Entry near 1.0880–1.0885, Stop-Loss safely below the structural flip band (1.0845–1.0855), and Take-Profit into the prior swing high above 1.0955+ for ≥ 1:2.0 R:R.',
    bars: [
      { o: 1.0830, h: 1.0852, l: 1.0822, c: 1.0848 },
      { o: 1.0848, h: 1.0882, l: 1.0844, c: 1.0876 },
      { o: 1.0876, h: 1.0884, l: 1.0850, c: 1.0856 },
      { o: 1.0856, h: 1.0868, l: 1.0838, c: 1.0842 },
      { o: 1.0842, h: 1.0878, l: 1.0840, c: 1.0874 },
      { o: 1.0874, h: 1.0881, l: 1.0858, c: 1.0862 },
      { o: 1.0862, h: 1.0908, l: 1.0860, c: 1.0904 },
      { o: 1.0904, h: 1.0938, l: 1.0900, c: 1.0932 },
      { o: 1.0932, h: 1.0942, l: 1.0910, c: 1.0915 },
      { o: 1.0915, h: 1.0920, l: 1.0882, c: 1.0890 },
      { o: 1.0890, h: 1.0894, l: 1.0874, c: 1.0888 },
    ],
  },
  {
    id: 'liquidity-sweep',
    title: '02. Equal-Highs Liquidity Sweep (Bull Trap)',
    symbol: 'GBP/USD (Simulated)',
    timeframe: 'H1 Educational',
    decimals: 4,
    biasPrompt:
      'Price carved equal highs near 1.2740, wicked above to 1.2758 trapping breakout buyers, and closed cleanly back below 1.2735. Mark a hypothetical Short Entry, Stop-Loss above the sweep wick, and Take-Profit.',
    recommendedDirection: 'SELL',
    idealRange: { entryMin: 1.2715, entryMax: 1.2745, slLimit: 1.2755, minRr: 2.0 },
    expertExplanation:
      'After a failed breakout sweeps Buy-Side Liquidity at 1.2758 and closes back inside the range (1.2724), protective Stops belong above the sweep wick (1.2764+), targeting prior range support around 1.2640–1.2660.',
    bars: [
      { o: 1.2675, h: 1.2702, l: 1.2668, c: 1.2698 },
      { o: 1.2698, h: 1.2740, l: 1.2694, c: 1.2734 },
      { o: 1.2734, h: 1.2738, l: 1.2705, c: 1.2712 },
      { o: 1.2712, h: 1.2720, l: 1.2682, c: 1.2688 },
      { o: 1.2688, h: 1.2739, l: 1.2686, c: 1.2735 },
      { o: 1.2735, h: 1.2741, l: 1.2712, c: 1.2718 },
      { o: 1.2718, h: 1.2736, l: 1.2714, c: 1.2732 },
      { o: 1.2732, h: 1.2758, l: 1.2716, c: 1.2724 },
      { o: 1.2724, h: 1.2730, l: 1.2698, c: 1.2704 },
    ],
  },
  {
    id: 'xauusd-demand',
    title: '03. Gold ATR-Buffered Demand Pullback',
    symbol: 'XAU/USD (Simulated)',
    timeframe: 'H1 Educational',
    decimals: 2,
    biasPrompt:
      'Spot Gold broke above $2,480 resistance with impulse momentum and returned to test the $2,468–$2,472 demand origin. Remember Gold requires ATR buffer room below the swing low.',
    recommendedDirection: 'BUY',
    idealRange: { entryMin: 2467, entryMax: 2475, slLimit: 2465, minRr: 2.0 },
    expertExplanation:
      'Entry near the demand base ($2,470–$2,472) with Stop-Loss buffered beyond recent swing structure ($2,458–$2,463, avoiding tight $2 stops) targeting upper liquidity above $2,495+ preserves healthy 1:2+ R:R.',
    bars: [
      { o: 2454, h: 2462, l: 2451, c: 2460 },
      { o: 2460, h: 2468, l: 2458, c: 2465 },
      { o: 2465, h: 2472, l: 2463, c: 2469 },
      { o: 2469, h: 2484, l: 2468, c: 2482 },
      { o: 2482, h: 2494, l: 2480, c: 2491 },
      { o: 2491, h: 2493, l: 2481, c: 2483 },
      { o: 2483, h: 2485, l: 2472, c: 2474 },
      { o: 2474, h: 2477, l: 2468, c: 2475 },
    ],
  },
];

export const ChartPracticeLab: React.FC = () => {
  const { theme } = usePlatform();
  const [labMode, setLabMode] = useState<'simulated' | 'market'>('simulated');

  // Simulated chart practice state
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];
  const [activeTool, setActiveTool] = useState<'entry' | 'sl' | 'tp'>('entry');
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [slPrice, setSlPrice] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Market candle study state
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [feedMeta, setFeedMeta] = useState<{ source?: string; status?: string; updated_at?: string }>({});
  const [loadingMarket, setLoadingMarket] = useState(false);

  const bounds = useMemo(() => {
    const highs = scenario.bars.map((b) => b.h);
    const lows = scenario.bars.map((b) => b.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const pad = (max - min) * 0.25;
    return { top: max + pad, bottom: min - pad };
  }, [scenario]);

  const toY = (price: number) => {
    const ratio = (bounds.top - price) / Math.max(1e-6, bounds.top - bounds.bottom);
    return 24 + ratio * 292;
  };

  const toPrice = (ySvg: number) => {
    const clamped = Math.min(316, Math.max(24, ySvg));
    const ratio = (clamped - 24) / 292;
    return Number((bounds.top - ratio * (bounds.top - bounds.bottom)).toFixed(scenario.decimals));
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ySvg = ((e.clientY - rect.top) / rect.height) * 340;
    const price = toPrice(ySvg);
    if (activeTool === 'entry') {
      setEntryPrice(price);
      setActiveTool('sl');
    } else if (activeTool === 'sl') {
      setSlPrice(price);
      setActiveTool('tp');
    } else {
      setTpPrice(price);
    }
  };

  const rrMetrics = useMemo(() => {
    if (entryPrice === null || slPrice === null || tpPrice === null) return null;
    const risk = Math.abs(entryPrice - slPrice);
    const reward = Math.abs(tpPrice - entryPrice);
    if (risk <= 0) return null;
    const ratio = reward / risk;
    const side = tpPrice > entryPrice ? 'BUY' : 'SELL';
    const slConsistent = side === 'BUY' ? slPrice < entryPrice : slPrice > entryPrice;
    return { ratio, side, slConsistent };
  }, [entryPrice, slPrice, tpPrice]);

  const loadCandles = async (sym: string, tf: string) => {
    setLoadingMarket(true);
    try {
      const res = await apiFetch<{
        candles: MarketCandle[];
        source?: string;
        status?: string;
        updated_at?: string;
      }>(`/api/markets/${encodeURIComponent(sym)}/candles?timeframe=${encodeURIComponent(tf)}`);
      setCandles(res.candles || []);
      setFeedMeta({ source: res.source, status: res.status, updated_at: res.updated_at });
    } catch {
      setCandles([]);
    } finally {
      setLoadingMarket(false);
    }
  };

  useEffect(() => {
    if (labMode === 'market') {
      loadCandles(symbol, timeframe);
    }
  }, [labMode, symbol, timeframe]);

  const resetScenario = (idx: number) => {
    setScenarioIdx(idx);
    setEntryPrice(null);
    setSlPrice(null);
    setTpPrice(null);
    setActiveTool('entry');
    setShowAnswer(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CandlestickChartIcon className="w-5 h-5 text-[#881337] dark:text-rose-400" />
              <span>Interactive Chart Practice Lab</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Practice marking Entry, Stop-Loss, and Take-Profit geometry on simulated setups or study live/delayed market structure.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setLabMode('simulated')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                labMode === 'simulated'
                  ? 'bg-[#881337] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Simulated Scenarios
            </button>
            <button
              type="button"
              onClick={() => setLabMode('market')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                labMode === 'market'
                  ? 'bg-[#881337] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Market Chart Study
            </button>
          </div>
        </div>

        {labMode === 'simulated' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => resetScenario(idx)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      scenarioIdx === idx
                        ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Simulated chart practice · Not live quotes
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {scenario.biasPrompt}
            </p>

            {/* Level Placement Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {[
                  { id: 'entry' as const, label: `1. Place Entry${entryPrice ? ` (${entryPrice.toFixed(scenario.decimals)})` : ''}` },
                  { id: 'sl' as const, label: `2. Place SL${slPrice ? ` (${slPrice.toFixed(scenario.decimals)})` : ''}` },
                  { id: 'tp' as const, label: `3. Place TP${tpPrice ? ` (${tpPrice.toFixed(scenario.decimals)})` : ''}` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTool(t.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                      activeTool === t.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[38px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showAnswer ? 'Hide Reference Answer' : 'Check Analysis'}</span>
              </button>
            </div>

            {/* Interactive SVG Candlestick Canvas */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] overflow-hidden">
              <svg
                viewBox="0 0 820 340"
                onClick={handleSvgClick}
                className="w-full h-auto cursor-crosshair select-none"
                role="img"
                aria-label="Interactive simulated candlestick chart canvas"
              >
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                  const y = 24 + g * 292;
                  const p = bounds.top - g * (bounds.top - bounds.bottom);
                  return (
                    <g key={g}>
                      <line x1="20" y1={y} x2="736" y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                      <text x="744" y={y + 4} className="fill-slate-500 dark:fill-slate-400 text-[10.5px] font-mono">
                        {p.toFixed(scenario.decimals)}
                      </text>
                    </g>
                  );
                })}

                {/* Candles */}
                {scenario.bars.map((bar, i) => {
                  const x = 66 + i * ((650) / Math.max(1, scenario.bars.length - 1));
                  const yH = toY(bar.h);
                  const yL = toY(bar.l);
                  const yO = toY(bar.o);
                  const yC = toY(bar.c);
                  const bull = bar.c >= bar.o;
                  const color = bull ? '#15803D' : '#9F1239';
                  return (
                    <g key={i}>
                      <line x1={x} y1={yH} x2={x} y2={yL} stroke={color} strokeWidth="2.5" />
                      <rect
                        x={x - 14}
                        y={Math.min(yO, yC)}
                        width="28"
                        height={Math.max(4, Math.abs(yC - yO))}
                        rx="2"
                        fill={color}
                      />
                    </g>
                  );
                })}

                {/* User Markers */}
                {entryPrice !== null && (
                  <g>
                    <line x1="20" y1={toY(entryPrice)} x2="736" y2={toY(entryPrice)} stroke="#0284C7" strokeWidth="2" strokeDasharray="5 3" />
                    <text x="30" y={toY(entryPrice) - 6} className="fill-sky-600 dark:fill-sky-400 text-[11px] font-mono font-bold">
                      ENTRY {entryPrice.toFixed(scenario.decimals)}
                    </text>
                  </g>
                )}
                {slPrice !== null && (
                  <g>
                    <line x1="20" y1={toY(slPrice)} x2="736" y2={toY(slPrice)} stroke="#9F1239" strokeWidth="2" />
                    <text x="30" y={toY(slPrice) - 6} className="fill-[#9F1239] dark:fill-rose-400 text-[11px] font-mono font-bold">
                      STOP LOSS {slPrice.toFixed(scenario.decimals)}
                    </text>
                  </g>
                )}
                {tpPrice !== null && (
                  <g>
                    <line x1="20" y1={toY(tpPrice)} x2="736" y2={toY(tpPrice)} stroke="#15803D" strokeWidth="2" />
                    <text x="30" y={toY(tpPrice) - 6} className="fill-[#15803D] dark:fill-emerald-400 text-[11px] font-mono font-bold">
                      TAKE PROFIT {tpPrice.toFixed(scenario.decimals)}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {rrMetrics && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Target className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                  Hypothetical Bias: {rrMetrics.side} · Planned R:R = 1 : {rrMetrics.ratio.toFixed(2)}
                </span>
                <span
                  className={
                    rrMetrics.slConsistent && rrMetrics.ratio >= 2
                      ? 'text-[#15803D] dark:text-emerald-400 font-semibold'
                      : 'text-amber-600 dark:text-amber-400 font-semibold'
                  }
                >
                  {!rrMetrics.slConsistent
                    ? 'Stop-Loss is on the wrong side of your Entry!'
                    : rrMetrics.ratio >= 2
                    ? 'Healthy ≥ 1:2.0 R:R geometry'
                    : 'Below 1:2.0 R:R target'}
                </span>
              </div>
            )}

            {showAnswer && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-1.5 text-xs">
                <p className="font-bold text-[#15803D] dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reference Solution ({scenario.recommendedDirection} Setup)</span>
                </p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {scenario.expertExplanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                      symbol === sym
                        ? 'bg-[#881337] text-white border-[#881337]'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
                >
                  <option value="15M">15M</option>
                  <option value="1H">1H</option>
                  <option value="4H">4H</option>
                  <option value="1D">1D</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => loadCandles(symbol, timeframe)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMarket ? 'animate-spin' : ''}`} />
                <span>Refresh Feed</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {candles.length > 0 ? (
                <CandlestickChart
                  candles={candles}
                  theme={theme}
                  decimals={symbol === 'USDJPY' ? 2 : symbol === 'XAUUSD' || symbol === 'BTCUSD' ? 2 : 4}
                  height={360}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-xs text-slate-500">
                  {loadingMarket ? 'Loading market candles...' : 'Market candle data temporarily unavailable.'}
                </div>
              )}
            </div>

            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Feed Source: {feedMeta.source || 'Market Feed'} · Status: {feedMeta.status || 'delayed'}
              {feedMeta.updated_at ? ` · Updated: ${formatLocalDateTime(feedMeta.updated_at)}` : ''} · Educational structure study only
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
