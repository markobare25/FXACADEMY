import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { renderFoundationVisual, type VisualDiagramResult } from './visualsFoundations';
import { renderTechnicalVisual } from './visualsTechnical';
import { renderRiskMacroVisual } from './visualsRiskMacro';

interface AcademyVisualsProps {
  visualKey?: string | null;
  imageUrl?: string | null;
  title: string;
}

export function resolveVisualDiagram(key?: string | null): VisualDiagramResult | null {
  if (!key) return null;
  return (
    renderFoundationVisual(key) ||
    renderTechnicalVisual(key) ||
    renderRiskMacroVisual(key) ||
    null
  );
}

export const ALL_VISUAL_KEYS: Array<{ key: string; label: string }> = [
  { key: 'forex-ecosystem', label: '01 · Decentralized OTC FX Liquidity' },
  { key: 'fx-participants', label: '01 · Market Participants' },
  { key: 'currency-quote-anatomy', label: '01 · Quote Anatomy (Base/Quote)' },
  { key: 'bid-ask-spread', label: '01 · Bid/Ask Spread' },
  { key: 'pip-lot-diagram', label: '01 · Pips & Lot Sizing' },
  { key: 'order-types-diagram', label: '01 · Market, Limit & Stop Orders' },
  { key: 'margin-leverage-diagram', label: '01 · Margin & Leverage Anatomy' },
  { key: 'trading-sessions-timeline', label: '01 · Global FX Sessions (UTC)' },
  { key: 'broker-due-diligence', label: '01 · Broker Due Diligence' },
  { key: 'order-ticket-mockup', label: '01 · Order Ticket Pre-Flight' },
  { key: 'pair-categories-matrix', label: '02 · Majors, Minors & Exotics' },
  { key: 'currency-strength-bars', label: '02 · Relative Strength Bars' },
  { key: 'direct-indirect-quotes', label: '02 · Direct/Indirect & Cross Rates' },
  { key: 'pip-conversion-formula', label: '02 · Dynamic Pip Conversion' },
  { key: 'pair-cost-comparison', label: '02 · Spread Cost Drag Comparison' },
  { key: 'correlation-matrix', label: '02 · Pair Correlation Matrix' },
  { key: 'candlestick-anatomy', label: '03 · Candlestick OHLC Anatomy' },
  { key: 'candlestick-single-patterns', label: '03 · Single-Candle Patterns' },
  { key: 'candlestick-multi-patterns', label: '03 · Multi-Candle Reversals' },
  { key: 'inside-outside-marubozu', label: '03 · Marubozu, Inside & Outside Bars' },
  { key: 'candlestick-context-comparison', label: '03 · Pattern Context Filter' },
  { key: 'market-structure-phases', label: '04 · Market Structure Phases' },
  { key: 'bos-mss-diagram', label: '04 · BOS vs MSS Structure Shift' },
  { key: 'top-down-timeframes', label: '04 · Top-Down Timeframe Workflow' },
  { key: 'chart-patterns-reversals', label: '04 · Reversal Chart Patterns' },
  { key: 'chart-patterns-continuation', label: '04 · Continuation Chart Patterns' },
  { key: 'fibonacci-retracement', label: '04 · Fibonacci Retracement Grid' },
  { key: 'volatility-atr-diagram', label: '04 · Volatility-Adjusted ATR Stops' },
  { key: 'fundamentals-transmission', label: '05 · Macro Transmission Chain' },
  { key: 'central-bank-spectrum', label: '05 · Hawkish vs Dovish Spectrum' },
  { key: 'sr-zones-diagram', label: '06 · Support & Resistance Zones' },
  { key: 'sr-role-reversal', label: '06 · S/R Role Reversal Flip' },
  { key: 'sr-false-breakout', label: '06 · True Breakout vs Bull Trap' },
  { key: 'supply-demand-zones', label: '06 · Supply & Demand Origin Zones' },
  { key: 'sr-confluence-checklist', label: '06 · S/R Confluence Scoring' },
  { key: 'trendline-anatomy', label: '07 · Trendline Construction' },
  { key: 'trend-channels-diagram', label: '07 · Parallel Trend Channels' },
  { key: 'trendline-break-retest', label: '07 · Trendline Break & Retest' },
  { key: 'trendline-false-break', label: '07 · Steep vs Sustainable Trendlines' },
  { key: 'indicator-regime-matrix', label: '08 · Indicator Regime Matrix' },
  { key: 'sma-ema-comparison', label: '08 · SMA vs EMA Responsiveness' },
  { key: 'rsi-zones-divergence', label: '08 · RSI Thresholds & Divergence' },
  { key: 'macd-components', label: '08 · MACD Line, Signal & Histogram' },
  { key: 'stochastic-oscillator', label: '08 · Stochastic Oscillator (%K/%D)' },
  { key: 'bollinger-bands-squeeze', label: '08 · Bollinger Band Squeeze' },
  { key: 'adx-ichimoku-overview', label: '08 · ADX & Ichimoku Cloud' },
  { key: 'price-action-rejection-momentum', label: '09 · Momentum vs Rejection' },
  { key: 'liquidity-sweeps-diagram', label: '09 · BSL/SSL Liquidity Sweeps' },
  { key: 'fvg-imbalance-diagram', label: '09 · Fair Value Gap (FVG)' },
  { key: 'order-block-mitigation', label: '09 · Order Block Mitigation' },
  { key: 'premium-discount-equilibrium', label: '09 · Premium vs Discount Equilibrium' },
  { key: 'strategy-trend-pullback', label: '10 · Trend Pullback Strategy' },
  { key: 'strategy-break-retest', label: '10 · Break & Retest Blueprint' },
  { key: 'strategy-range-reversion', label: '10 · Range Mean-Reversion' },
  { key: 'strategy-session-windows', label: '10 · London/NY Session Windows' },
  { key: 'strategy-rulebook-blueprint', label: '10 · Written System Playbook' },
  { key: 'expectancy-costs-diagram', label: '11 · Expectancy & Costs Equation' },
  { key: 'risk-reward-geometry', label: '11 · Risk-to-Reward Geometry' },
  { key: 'position-sizing-equation', label: '11 · Risk-First Sizing Pipeline' },
  { key: 'drawdown-recovery-curve', label: '11 · Drawdown Recovery Asymmetry' },
  { key: 'correlated-exposure-diagram', label: '11 · Correlated Exposure Heat' },
  { key: 'execution-costs-slippage', label: '11 · All-In Execution Friction' },
  { key: 'psychology-emotional-cycle', label: '12 · Tilt vs Disciplined Circuit' },
  { key: 'cognitive-biases-matrix', label: '12 · Cognitive Biases & Fixes' },
  { key: 'pre-trade-routine-flow', label: '12 · Pre-Trade Checklist Flow' },
  { key: 'journal-process-outcome', label: '12 · Process vs Outcome Matrix' },
  { key: 'xauusd-contract-specs', label: '13 · Gold (XAUUSD) Lot Specs' },
  { key: 'xauusd-macro-drivers', label: '13 · Gold Macro Drivers' },
  { key: 'xauusd-sessions-liquidity', label: '13 · Gold Liquidity Windows' },
  { key: 'xauusd-chart-structure', label: '13 · Gold ATR-Buffered Stops' },
  { key: 'crypto-blockchain-basics', label: '14 · Blockchain & Key Custody' },
  { key: 'crypto-spot-vs-perps', label: '14 · Crypto Spot vs Perpetuals' },
  { key: 'crypto-orderbook-liquidity', label: '14 · Crypto Order Book Depth' },
  { key: 'crypto-custody-security', label: '14 · Hot vs Cold Custody Tiers' },
  { key: 'crypto-cycles-dominance', label: '14 · Crypto Cycles & Dominance' },
  { key: 'volume-profile-auction', label: '15 · Volume Profile & POC' },
  { key: 'portfolio-correlation-hedging', label: '15 · Factor Risk Budgeting' },
  { key: 'walk-forward-validation', label: '15 · Walk-Forward Testing' },
  { key: 'overfitting-vs-robustness', label: '15 · Overfitting vs Robustness' },
  { key: 'monte-carlo-drawdown', label: '15 · Monte Carlo Drawdowns' },
];

export const AcademyVisuals: React.FC<AcademyVisualsProps> = ({
  visualKey,
  imageUrl,
  title,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const diagram = resolveVisualDiagram(visualKey);

  if (!diagram && (!imageUrl || imgFailed)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {imageUrl && !imgFailed && (
        <figure className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1321] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {title} — Visual Reference
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
              Simulated educational diagram
            </span>
          </div>
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full max-h-96 object-contain bg-slate-50 dark:bg-slate-950 p-2"
          />
        </figure>
      )}

      {diagram && (
        <figure
          className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1321] overflow-hidden ${
            expanded ? 'fixed inset-4 z-50 flex flex-col shadow-2xl p-4' : ''
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {diagram.title}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Simulated educational diagram · Not a live market price quote
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[36px] shrink-0"
              title={expanded ? 'Exit full view' : 'Inspect full view'}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{expanded ? 'Close View' : 'Enlarge Diagram'}</span>
            </button>
          </div>

          <div className={`p-3 sm:p-4 bg-white dark:bg-[#0D1321] ${expanded ? 'flex-1 overflow-auto flex items-center justify-center' : ''}`}>
            <div className={expanded ? 'w-full max-w-5xl' : 'w-full'}>{diagram.svg}</div>
          </div>

          <figcaption className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {diagram.caption}
          </figcaption>
        </figure>
      )}
    </div>
  );
};
