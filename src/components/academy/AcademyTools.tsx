import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

type CalcTab = 'position' | 'pip' | 'expectancy' | 'drawdown';

const INSTRUMENT_SPECS: Record<string, { label: string; pipPerStdLotUsd: number; note: string }> = {
  EURUSD: { label: 'EUR/USD (USD Quote)', pipPerStdLotUsd: 10, note: '1 pip = 0.0001 ($10 / std lot)' },
  GBPUSD: { label: 'GBP/USD (USD Quote)', pipPerStdLotUsd: 10, note: '1 pip = 0.0001 ($10 / std lot)' },
  AUDUSD: { label: 'AUD/USD (USD Quote)', pipPerStdLotUsd: 10, note: '1 pip = 0.0001 ($10 / std lot)' },
  USDJPY: { label: 'USD/JPY (@ ~154.00)', pipPerStdLotUsd: 6.49, note: '1 pip = 0.01 (~$6.49 / std lot at 154)' },
  USDCAD: { label: 'USD/CAD (@ ~1.3900)', pipPerStdLotUsd: 7.19, note: '1 pip = 0.0001 (~$7.19 / std lot at 1.39)' },
  EURGBP: { label: 'EUR/GBP (GBPUSD ~1.27)', pipPerStdLotUsd: 12.7, note: '1 pip = 0.0001 (£10 × 1.27 ≈ $12.70)' },
  XAUUSD: { label: 'XAU/USD Gold ($0.10 pip)', pipPerStdLotUsd: 10, note: '100 oz std lot: $0.10 move = $10 ($1.00 = $100)' },
};

export const AcademyTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalcTab>('position');

  // 1. Position Size
  const [balance, setBalance] = useState(5000);
  const [riskPct, setRiskPct] = useState(1.0);
  const [stopPips, setStopPips] = useState(25);
  const [pairKey, setPairKey] = useState('EURUSD');
  const [customPipVal, setCustomPipVal] = useState(10);

  const spec = INSTRUMENT_SPECS[pairKey] || INSTRUMENT_SPECS.EURUSD;
  const activePipValue = pairKey === 'CUSTOM' ? customPipVal : spec.pipPerStdLotUsd;

  const posMetrics = useMemo(() => {
    const riskDollars = (Math.max(0, balance) * Math.max(0, riskPct)) / 100;
    const denom = Math.max(0.1, stopPips) * Math.max(0.1, activePipValue);
    const lots = riskDollars / denom;
    const units = Math.round(lots * (pairKey === 'XAUUSD' ? 100 : 100_000));
    const notional = pairKey === 'XAUUSD' ? lots * 100 * 2600 : lots * 100_000;
    const effLev = balance > 0 ? notional / balance : 0;
    return {
      riskDollars,
      lots,
      units,
      effLev,
    };
  }, [balance, riskPct, stopPips, activePipValue, pairKey]);

  // 2. Pip Converter
  const [pipLots, setPipLots] = useState(0.5);
  const [pipPair, setPipPair] = useState('USDJPY');
  const [quoteToUsd, setQuoteToUsd] = useState(154.0);
  const [quoteMode, setQuoteMode] = useState<'usd_quote' | 'jpy_base' | 'usd_base'>('jpy_base');

  const pipPerMove = useMemo(() => {
    const units = Math.max(0, pipLots) * 100_000;
    const rate = Math.max(0.01, quoteToUsd);
    if (quoteMode === 'usd_quote') return 0.0001 * units;
    if (quoteMode === 'jpy_base') return (0.01 / rate) * units;
    return (0.0001 / rate) * units;
  }, [pipLots, quoteToUsd, quoteMode]);

  // 3. Risk-Reward & Expectancy
  const [winRate, setWinRate] = useState(45);
  const [avgWinR, setAvgWinR] = useState(2.2);
  const [avgLossR, setAvgLossR] = useState(1.0);
  const [costR, setCostR] = useState(0.05);

  const expMetrics = useMemo(() => {
    const w = Math.min(100, Math.max(0, winRate)) / 100;
    const l = 1 - w;
    const grossR = w * avgWinR - l * avgLossR;
    const netR = grossR - Math.max(0, costR);
    const breakEvenWin = avgWinR + avgLossR > 0 ? (avgLossR / (avgWinR + avgLossR)) * 100 : 50;
    return { grossR, netR, breakEvenWin, hundredTradesR: netR * 100 };
  }, [winRate, avgWinR, avgLossR, costR]);

  // 4. Drawdown & Losing Streak
  const [ddEquity, setDdEquity] = useState(10000);
  const [ddRiskPct, setDdRiskPct] = useState(1.5);
  const [streakLen, setStreakLen] = useState(8);

  const ddRows = useMemo(() => {
    const rows: Array<{ trades: number; equity: number; drawdownPct: number; recoveryNeededPct: number }> = [];
    let cur = Math.max(100, ddEquity);
    const r = Math.min(25, Math.max(0.1, ddRiskPct)) / 100;
    const count = Math.min(20, Math.max(1, streakLen));
    for (let i = 1; i <= count; i++) {
      cur = cur * (1 - r);
      const ddPct = ((ddEquity - cur) / ddEquity) * 100;
      const recPct = cur > 0 ? ((ddEquity - cur) / cur) * 100 : 0;
      rows.push({ trades: i, equity: cur, drawdownPct: ddPct, recoveryNeededPct: recPct });
    }
    return rows;
  }, [ddEquity, ddRiskPct, streakLen]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#881337] dark:text-rose-400" />
              <span>Interactive Risk &amp; Sizing Calculators</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Educational modeling tools using mathematical formulas. Verify exact contract specifications inside your live broker terminal before ordering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {[
              { id: 'position' as const, label: 'Position Size' },
              { id: 'pip' as const, label: 'Pip Converter' },
              { id: 'expectancy' as const, label: 'R:R & Expectancy' },
              { id: 'drawdown' as const, label: 'Drawdown Simulator' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#881337] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Position Size Calculator */}
        {activeTab === 'position' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Account Equity (USD)</span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Risk Per Trade (%)</span>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={riskPct}
                    onChange={(e) => setRiskPct(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Stop-Loss Distance (Pips)</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    value={stopPips}
                    onChange={(e) => setStopPips(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Instrument / Pair</span>
                  <select
                    value={pairKey}
                    onChange={(e) => setPairKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                  >
                    {Object.entries(INSTRUMENT_SPECS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom $/Pip per 1.0 Lot</option>
                  </select>
                </label>
              </div>

              {pairKey === 'CUSTOM' ? (
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Custom Pip Value per 1.00 Std Lot ($)</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={customPipVal}
                    onChange={(e) => setCustomPipVal(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{spec.note}</p>
              )}
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Recommended Position Size (Hypothetical Calculation)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Standard Lots</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#881337] dark:text-rose-400">
                    {posMetrics.lots.toFixed(2)} lots
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Max Capital Risk</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    ${posMetrics.riskDollars.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contract Units</p>
                  <p className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {posMetrics.units.toLocaleString()} {pairKey === 'XAUUSD' ? 'oz' : 'units'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Est. Effective Leverage</p>
                  <p className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {posMetrics.effLev.toFixed(1)} : 1
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                Formula: (${balance} × {riskPct}%) ÷ ({stopPips} pips × ${activePipValue.toFixed(2)}/pip) = {posMetrics.lots.toFixed(3)} lots
              </p>
            </div>
          </div>
        )}

        {/* 2. Pip Value & Conversion Calculator */}
        {activeTab === 'pip' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Quote Structure</span>
                  <select
                    value={quoteMode}
                    onChange={(e) => {
                      const val = e.target.value as 'usd_quote' | 'jpy_base' | 'usd_base';
                      setQuoteMode(val);
                      if (val === 'jpy_base') {
                        setPipPair('USDJPY');
                        setQuoteToUsd(154.0);
                      } else if (val === 'usd_base') {
                        setPipPair('USDCAD');
                        setQuoteToUsd(1.39);
                      } else {
                        setPipPair('EURUSD');
                        setQuoteToUsd(1.085);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                  >
                    <option value="usd_quote">USD Quote (EUR/USD, GBP/USD)</option>
                    <option value="jpy_base">JPY Quote (USD/JPY, EUR/JPY)</option>
                    <option value="usd_base">USD Base Non-JPY (USD/CAD, USD/CHF)</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Position Size (Lots)</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={pipLots}
                    onChange={(e) => setPipLots(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
              </div>

              {quoteMode !== 'usd_quote' && (
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Current {pipPair} Rate (for USD Conversion)
                  </span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.01}
                    value={quoteToUsd}
                    onChange={(e) => setQuoteToUsd(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
              )}
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500">Converted Pip Value ({pipLots} Lots)</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">
                ${pipPerMove.toFixed(2)} USD per 1.0 pip
              </p>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums">
                {[10, 25, 50, 100].map((p) => (
                  <div key={p}>
                    <p className="text-slate-500">{p} pips</p>
                    <p className="font-bold text-slate-900 dark:text-white">${(pipPerMove * p).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Expectancy Calculator */}
        {activeTab === 'expectancy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Assumed Win Rate (%)</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={winRate}
                    onChange={(e) => setWinRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Average Winner (R-Multiple)</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={avgWinR}
                    onChange={(e) => setAvgWinR(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Average Loss (R-Multiple)</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={avgLossR}
                    onChange={(e) => setAvgLossR(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Spread/Slippage Drag (R)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={costR}
                    onChange={(e) => setCostR(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500">Hypothetical Educational Expectancy Output</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Net Expectancy / Trade</p>
                  <p
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      expMetrics.netR >= 0 ? 'text-[#15803D] dark:text-emerald-400' : 'text-[#9F1239] dark:text-rose-400'
                    }`}
                  >
                    {expMetrics.netR >= 0 ? '+' : ''}
                    {expMetrics.netR.toFixed(3)}R
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Break-Even Win Rate (Gross)</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {expMetrics.breakEvenWin.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono pt-2 border-t border-slate-200 dark:border-slate-800">
                100-Trade Hypothetical Model: {expMetrics.hundredTradesR >= 0 ? '+' : ''}
                {expMetrics.hundredTradesR.toFixed(1)}R net (not a live guarantee)
              </p>
            </div>
          </div>
        )}

        {/* 4. Drawdown Simulator */}
        {activeTab === 'drawdown' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Starting Equity ($)</span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={ddEquity}
                  onChange={(e) => setDdEquity(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Risk Per Losing Trade (%)</span>
                <input
                  type="number"
                  min={0.1}
                  max={25}
                  step={0.1}
                  value={ddRiskPct}
                  onChange={(e) => setDdRiskPct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Losing Streak Length</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={streakLen}
                  onChange={(e) => setStreakLen(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </label>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Consecutive Losses</th>
                    <th className="py-2.5 px-3 text-right">Remaining Equity</th>
                    <th className="py-2.5 px-3 text-right">Drawdown</th>
                    <th className="py-2.5 px-3 text-right">Gain Needed to Recover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  {ddRows.map((row) => (
                    <tr key={row.trades}>
                      <td className="py-2 px-3">{row.trades} losses</td>
                      <td className="py-2 px-3 text-right">${row.equity.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-[#9F1239] dark:text-rose-400">
                        -{row.drawdownPct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
                        +{row.recoveryNeededPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
