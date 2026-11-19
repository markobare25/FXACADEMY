import React from 'react';
import type { VisualDiagramResult } from './visualsFoundations';

const SVG_BASE = 'w-full h-auto block select-none';
const CARD = 'fill-slate-50 dark:fill-slate-900/70 stroke-slate-200 dark:stroke-slate-700';
const TXT = 'fill-slate-900 dark:fill-slate-100';
const MUTED = 'fill-slate-500 dark:fill-slate-400';
const BULL = '#15803D';
const BEAR = '#9F1239';

function Candle({ x, hY, lY, oY, cY, bull }: { x: number; hY: number; lY: number; oY: number; cY: number; bull: boolean }) {
  const top = Math.min(oY, cY);
  const h = Math.max(4, Math.abs(cY - oY));
  const color = bull ? BULL : BEAR;
  return (
    <g>
      <line x1={x} y1={hY} x2={x} y2={lY} stroke={color} strokeWidth="2.5" />
      <rect x={x - 12} y={top} width="24" height={h} rx="2" fill={color} />
    </g>
  );
}

export function renderTechnicalVisual(key: string): VisualDiagramResult | null {
  switch (key) {
    case 'candlestick-anatomy':
      return {
        title: 'Bullish vs Bearish Candlestick Anatomy (OHLC)',
        caption: 'Wicks measure rejected price extremes; the real body tracks net buyer-vs-seller progress from Open to Close.',
        svg: (
          <svg viewBox="0 0 820 350" className={SVG_BASE} role="img" aria-label="Candlestick OHLC anatomy">
            <rect x="28" y="24" width="368" height="302" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="212" y="56" textAnchor="middle" fill={BULL} className="text-[15px] font-bold">Bullish Candle (Close &gt; Open)</text>
            <line x1="160" y1="86" x2="160" y2="288" stroke={BULL} strokeWidth="3" />
            <rect x="136" y="132" width="48" height="108" rx="3" fill={BULL} />
            <text x="200" y="94" className={`${TXT} text-[12px] font-mono`}>High (Upper Wick Peak)</text>
            <text x="200" y="138" className={`${TXT} text-[12px] font-mono font-bold`}>Close</text>
            <text x="200" y="190" className={`${MUTED} text-[12px]`}>Real Body (Buyer Control)</text>
            <text x="200" y="242" className={`${TXT} text-[12px] font-mono font-bold`}>Open</text>
            <text x="200" y="290" className={`${TXT} text-[12px] font-mono`}>Low (Lower Wick Rejection)</text>

            <rect x="424" y="24" width="368" height="302" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="608" y="56" textAnchor="middle" fill={BEAR} className="text-[15px] font-bold">Bearish Candle (Close &lt; Open)</text>
            <line x1="556" y1="86" x2="556" y2="288" stroke={BEAR} strokeWidth="3" />
            <rect x="532" y="132" width="48" height="108" rx="3" fill={BEAR} />
            <text x="596" y="94" className={`${TXT} text-[12px] font-mono`}>High (Upper Shadow Peak)</text>
            <text x="596" y="138" className={`${TXT} text-[12px] font-mono font-bold`}>Open</text>
            <text x="596" y="190" className={`${MUTED} text-[12px]`}>Real Body (Seller Control)</text>
            <text x="596" y="242" className={`${TXT} text-[12px] font-mono font-bold`}>Close</text>
            <text x="596" y="290" className={`${TXT} text-[12px] font-mono`}>Low (Lower Wick)</text>
          </svg>
        ),
      };

    case 'candlestick-single-patterns':
      return {
        title: 'Key Single-Candle Formations (Hammer, Shooting Star, Doji, Spinning Top)',
        caption: 'Long wicks indicate order absorption or rejection; Doji candles signal temporary indecision between buyers and sellers.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Single candlestick patterns">
            {[
              { x: 112, name: 'Bullish Hammer', sub: 'Lower rejection ≥2× body', h: 92, l: 256, o: 124, c: 96, bull: true },
              { x: 310, name: 'Shooting Star', sub: 'Upper rejection ≥2× body', h: 78, l: 244, o: 210, c: 238, bull: false },
              { x: 508, name: 'Doji Indecision', sub: 'Open ≈ Close equilibrium', h: 86, l: 250, o: 168, c: 168, bull: true },
              { x: 706, name: 'Spinning Top', sub: 'Small body + two-sided wicks', h: 90, l: 248, o: 154, c: 184, bull: false },
            ].map((p) => (
              <g key={p.name}>
                <rect x={p.x - 86} y="24" width="172" height="292" rx="10" className={CARD} strokeWidth="1.5" />
                <Candle x={p.x} hY={p.h} lY={p.l} oY={p.o} cY={p.c} bull={p.bull} />
                <text x={p.x} y="282" textAnchor="middle" className={`${TXT} text-[13px] font-bold`}>{p.name}</text>
                <text x={p.x} y="302" textAnchor="middle" className={`${MUTED} text-[11px]`}>{p.sub}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'candlestick-multi-patterns':
      return {
        title: 'Multi-Candle Reversal Formations (Engulfing, Morning Star, Evening Star)',
        caption: 'Wait for final candle close confirmation at a higher-timeframe level before treating a reversal pattern as complete.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Multi candlestick patterns">
            <rect x="24" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="146" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Bullish Engulfing</text>
            <Candle x={120} hY={124} lY={210} oY={136} cY={194} bull={false} />
            <Candle x={166} hY={92} lY={220} oY={204} cY={104} bull={true} />
            <text x="146" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>2nd body fully covers prior</text>
            <text x="146" y="290" textAnchor="middle" fill={BULL} className="text-[11.5px] font-semibold">Demand shift after close</text>

            <rect x="288" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="410" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Morning Star (3-Bar)</text>
            <Candle x={364} hY={96} lY={200} oY={108} cY={190} bull={false} />
            <Candle x={410} hY={194} lY={248} oY={210} cY={218} bull={true} />
            <Candle x={456} hY={100} lY={216} oY={202} cY={114} bull={true} />
            <text x="410" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Drop → Pause → Bullish Push</text>
            <text x="410" y="290" textAnchor="middle" fill={BULL} className="text-[11.5px] font-semibold">Closes &gt; 50% of Bar 1</text>

            <rect x="552" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="674" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Evening Star (3-Bar)</text>
            <Candle x={628} hY={100} lY={212} oY={200} cY={110} bull={true} />
            <Candle x={674} hY={76} lY={126} oY={106} cY={98} bull={false} />
            <Candle x={720} hY={104} lY={224} oY={114} cY={206} bull={false} />
            <text x="674" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Push → Exhaustion → Sell-off</text>
            <text x="674" y="290" textAnchor="middle" fill={BEAR} className="text-[11.5px] font-semibold">Resistance confirmation</text>
          </svg>
        ),
      };

    case 'inside-outside-marubozu':
      return {
        title: 'Momentum (Marubozu), Compression (Inside Bar) & Expansion (Outside Bar)',
        caption: 'Inside bars show volatility contraction; Marubozu bars show uninterrupted one-sided order flow.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Inside bar, outside bar and marubozu">
            <rect x="24" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="146" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Marubozu (Momentum)</text>
            <Candle x={146} hY={92} lY={232} oY={232} cY={92} bull={true} />
            <text x="146" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Minimal/zero wicks; closes at extreme</text>

            <rect x="288" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="410" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Inside Bar (Compression)</text>
            <Candle x={386} hY={86} lY={234} oY={210} cY={110} bull={true} />
            <Candle x={434} hY={120} lY={198} oY={140} cY={175} bull={false} />
            <text x="410" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Bar 2 sits inside Bar 1 High–Low</text>

            <rect x="552" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="674" y="54" textAnchor="middle" className={`${TXT} text-[13.5px] font-bold`}>Outside Bar (Expansion)</text>
            <Candle x={650} hY={128} lY={204} oY={144} cY={186} bull={false} />
            <Candle x={698} hY={84} lY={240} oY={216} cY={96} bull={true} />
            <text x="674" y="270" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Clears both prior High &amp; Low</text>
          </svg>
        ),
      };

    case 'candlestick-context-comparison':
      return {
        title: 'Why Context Beats Isolated Candle Shapes (Same Hammer, Different Location)',
        caption: 'Identical candlestick shapes produce sharply different reliability depending on trend alignment and nearby support/resistance.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Candlestick context comparison">
            <rect x="24" y="24" width="374" height="292" rx="12" className="fill-emerald-50/50 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">HIGH QUALITY: Hammer at Demand Zone</text>
            <rect x="52" y="216" width="318" height="36" rx="4" className="fill-emerald-500/20 stroke-emerald-600/40" />
            <text x="211" y="239" textAnchor="middle" fill={BULL} className="text-[11px] font-mono font-bold">HTF SUPPORT / DEMAND ZONE</text>
            <Candle x={130} hY={118} lY={186} oY={126} cY={176} bull={false} />
            <Candle x={176} hY={162} lY={246} oY={184} cY={166} bull={true} />
            <path d="M196 164 L268 104" stroke={BULL} strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="211" y="290" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Aligned with uptrend pullback into buyers</text>

            <rect x="422" y="24" width="374" height="292" rx="12" className="fill-rose-50/50 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">LOW QUALITY: Hammer Mid-Air in Downtrend</text>
            <rect x="450" y="96" width="318" height="28" rx="4" className="fill-rose-500/15 stroke-rose-600/40" />
            <text x="609" y="114" textAnchor="middle" fill={BEAR} className="text-[11px] font-mono">Overhead Resistance Nearby</text>
            <Candle x={530} hY={132} lY={210} oY={140} cY={200} bull={false} />
            <Candle x={576} hY={180} lY={252} oY={198} cY={184} bull={true} />
            <path d="M596 184 L670 250" stroke={BEAR} strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="609" y="290" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Counter-trend noise with no nearby demand</text>
          </svg>
        ),
      };

    case 'market-structure-phases':
      return {
        title: 'Market Structure Phases: Uptrend, Range & Downtrend',
        caption: 'Classify price objectively using swing highs (HH/LH) and swing lows (HL/LL) before choosing trend or range tactics.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Market structure phases">
            <rect x="24" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="146" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Uptrend (HH + HL)</text>
            <polyline points="50,248 96,178 130,206 186,120 214,148 250,82" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="96" y="166" className={`${TXT} text-[11px] font-mono font-bold`}>HH</text>
            <text x="128" y="224" className={`${TXT} text-[11px] font-mono font-bold`}>HL</text>
            <text x="186" y="108" className={`${TXT} text-[11px] font-mono font-bold`}>HH</text>
            <text x="146" y="290" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Buyers defend higher lows</text>

            <rect x="288" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="410" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Consolidation Range</text>
            <line x1="312" y1="118" x2="508" y2="118" stroke={BEAR} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="312" y1="224" x2="508" y2="224" stroke={BULL} strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points="320,218 358,124 398,218 438,124 476,220 504,132" fill="none" className="stroke-amber-500" strokeWidth="3" />
            <text x="410" y="290" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Equilibrium between S &amp; R</text>

            <rect x="552" y="24" width="244" height="292" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="674" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Downtrend (LH + LL)</text>
            <polyline points="576,90 618,162 652,134 706,216 736,184 776,256" fill="none" stroke={BEAR} strokeWidth="3" />
            <text x="616" y="180" className={`${TXT} text-[11px] font-mono font-bold`}>LL</text>
            <text x="650" y="122" className={`${TXT} text-[11px] font-mono font-bold`}>LH</text>
            <text x="706" y="234" className={`${TXT} text-[11px] font-mono font-bold`}>LL</text>
            <text x="674" y="290" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Sellers cap lower highs</text>
          </svg>
        ),
      };

    case 'bos-mss-diagram':
      return {
        title: 'Break of Structure (BOS) vs Market Structure Shift (MSS / CHoCH)',
        caption: 'BOS confirms trend continuation; MSS breaks the protected structural swing to warn of a potential reversal.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="BOS and MSS diagram">
            <rect x="24" y="24" width="772" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <polyline points="72,256 144,176 196,214 294,114 348,168 452,82 528,196 588,156 694,264" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="3" />
            {/* BOS lines */}
            <line x1="144" y1="176" x2="260" y2="176" stroke={BULL} strokeWidth="2" strokeDasharray="4 4" />
            <text x="195" y="166" fill={BULL} className="text-[11px] font-mono font-bold">BOS (Bullish)</text>
            <line x1="294" y1="114" x2="430" y2="114" stroke={BULL} strokeWidth="2" strokeDasharray="4 4" />
            <text x="355" y="104" fill={BULL} className="text-[11px] font-mono font-bold">BOS (Continuation)</text>
            {/* Protected HL & MSS */}
            <line x1="348" y1="168" x2="570" y2="168" stroke={BEAR} strokeWidth="2.5" strokeDasharray="5 3" />
            <text x="415" y="188" fill={BEAR} className="text-[12px] font-mono font-bold">MSS / CHoCH (Protected HL Broken)</text>
            <text x="588" y="144" fill={BEAR} className="text-[11px] font-mono font-bold">Lower High Entry Zone</text>
          </svg>
        ),
      };

    case 'top-down-timeframes':
      return {
        title: 'Multi-Timeframe Top-Down Workflow (Macro → Structure → Execution)',
        caption: 'Establish bias on Higher Timeframes (Weekly/Daily), mark zones on H4/H1, and refine entry triggers on M15.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Top-down multi-timeframe pyramid">
            {[
              { x: 60, y: 30, w: 700, tf: 'Weekly / Daily (HTF Bias)', d: 'Macro trend, key S/R levels, & major weekly highs/lows', badge: '1. Direction' },
              { x: 110, y: 126, w: 600, tf: 'H4 / H1 (Setup Structure)', d: 'Swing structure, BOS/MSS, trendlines & supply/demand zones', badge: '2. Zone Mapping' },
              { x: 160, y: 222, w: 500, tf: 'M15 / M5 (Precision Execution)', d: 'Entry candlestick confirmation, tight stop & R:R calculation', badge: '3. Entry Trigger' },
            ].map((tier) => (
              <g key={tier.tf}>
                <rect x={tier.x} y={tier.y} width={tier.w} height="78" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={tier.x + 24} y={tier.y + 32} className="fill-[#881337] dark:fill-rose-400 text-[14px] font-bold">{tier.tf}</text>
                <text x={tier.x + 24} y={tier.y + 56} className={`${MUTED} text-[12px]`}>{tier.d}</text>
                <text x={tier.x + tier.w - 24} y={tier.y + 44} textAnchor="end" className={`${TXT} text-[12px] font-mono font-bold`}>{tier.badge}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'chart-patterns-reversals':
      return {
        title: 'Reversal Chart Patterns: Double Top/Bottom & Head and Shoulders',
        caption: 'Require a decisive neckline break and volume/displacement shift—never pre-enter before the neckline breaks.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Reversal chart patterns">
            <rect x="24" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Double Top ("M") Reversal</text>
            <polyline points="56,238 118,108 178,186 238,110 318,266" fill="none" stroke={BEAR} strokeWidth="3" />
            <line x1="60" y1="186" x2="360" y2="186" className="stroke-slate-400" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="211" y="176" textAnchor="middle" className={`${MUTED} text-[11px] font-mono`}>Neckline Support → Breaks ↓</text>
            <text x="211" y="294" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Target projection ≈ Peak-to-Neckline height</text>

            <rect x="422" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Head &amp; Shoulders Top</text>
            <polyline points="452,238 504,142 544,196 594,88 644,196 686,146 756,268" fill="none" stroke={BEAR} strokeWidth="3" />
            <line x1="460" y1="196" x2="758" y2="196" className="stroke-slate-400" strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="504" y="130" textAnchor="middle" className={`${MUTED} text-[10.5px]`}>L.Shoulder</text>
            <text x="594" y="78" textAnchor="middle" className={`${TXT} text-[11px] font-bold`}>Head</text>
            <text x="686" y="134" textAnchor="middle" className={`${MUTED} text-[10.5px]`}>R.Shoulder</text>
            <text x="609" y="294" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Confirm via candle close below Neckline</text>
          </svg>
        ),
      };

    case 'chart-patterns-continuation':
      return {
        title: 'Continuation Structures: Bull Flag & Ascending Triangle',
        caption: 'Flags and triangles represent orderly pause/compression phases inside an existing directional trend.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Continuation chart patterns">
            <rect x="24" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Bull Flag Pause &amp; Breakout</text>
            <line x1="120" y1="124" x2="264" y2="152" className="stroke-slate-400" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="120" y1="176" x2="264" y2="204" className="stroke-slate-400" strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points="62,258 128,128 164,178 198,144 234,194 316,86" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="211" y="294" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Gentle counter-channel pause after strong impulse</text>

            <rect x="422" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Ascending Triangle Compression</text>
            <line x1="470" y1="116" x2="736" y2="116" stroke={BEAR} strokeWidth="2" strokeDasharray="4 4" />
            <line x1="470" y1="244" x2="736" y2="116" stroke={BULL} strokeWidth="2" strokeDasharray="4 4" />
            <polyline points="476,240 520,120 562,202 604,120 638,162 678,120 738,76" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="609" y="294" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Higher lows pressing repeatedly against flat resistance</text>
          </svg>
        ),
      };

    case 'fibonacci-retracement':
      return {
        title: 'Fibonacci Retracement Pullback Grid (38.2% · 50% · 61.8% · 78.6%)',
        caption: 'Draw from Swing Low (100%) to Swing High (0%) in an uptrend to map proportional discount pullback levels.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Fibonacci retracement diagram">
            <rect x="24" y="24" width="772" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { y: 66, lbl: '0.0% (Swing High)', c: 'stroke-slate-400' },
              { y: 124, lbl: '38.2% Shallow Pullback', c: 'stroke-sky-500/60' },
              { y: 162, lbl: '50.0% Equilibrium Midpoint', c: 'stroke-amber-500/70' },
              { y: 202, lbl: '61.8% Golden Ratio Zone', c: 'stroke-[#881337]' },
              { y: 250, lbl: '78.6% Deep Retracement', c: 'stroke-slate-400' },
              { y: 288, lbl: '100.0% (Impulse Origin / Invalidation)', c: 'stroke-rose-600' },
            ].map((lvl) => (
              <g key={lvl.lbl}>
                <line x1="180" y1={lvl.y} x2="740" y2={lvl.y} className={lvl.c} strokeWidth="1.5" strokeDasharray="5 4" />
                <text x="48" y={lvl.y + 4} className={`${TXT} text-[11px] font-mono`}>{lvl.lbl}</text>
              </g>
            ))}
            <polyline points="200,288 330,66 474,202 640,56" fill="none" stroke={BULL} strokeWidth="3.5" />
            <circle cx="474" cy="202" r="7" fill="#881337" />
            <text x="490" y="220" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Confluence Zone Entry</text>
          </svg>
        ),
      };

    case 'volatility-atr-diagram':
      return {
        title: 'ATR Volatility-Adjusted Stop Placement vs Fixed Pip Stops',
        caption: 'Sizing stop distance with Average True Range (e.g., 1.5× ATR) prevents premature stop-outs during high volatility.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="ATR volatility stop diagram">
            <rect x="24" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="56" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Low-ATR Regime (14-ATR = 12 pips)</text>
            <text x="211" y="92" textAnchor="middle" fill={BULL} className="text-[18px] font-mono font-bold">1.5 × ATR = 18 pip Stop</text>
            <text x="211" y="132" textAnchor="middle" className={`${MUTED} text-[12px]`}>Tighter range allows larger lot size</text>
            <text x="211" y="160" textAnchor="middle" className={`${MUTED} text-[12px]`}>for the exact same $100 fixed risk</text>
            <rect x="64" y="198" width="294" height="72" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
            <text x="211" y="238" textAnchor="middle" className={`${TXT} text-[13px] font-mono font-bold`}>$100 ÷ (18 pips × $10) = 0.55 Lots</text>

            <rect x="422" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="56" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>High-ATR Regime (14-ATR = 40 pips)</text>
            <text x="609" y="92" textAnchor="middle" fill={BEAR} className="text-[18px] font-mono font-bold">1.5 × ATR = 60 pip Stop</text>
            <text x="609" y="132" textAnchor="middle" className={`${MUTED} text-[12px]`}>Wider noise buffer protects from whipsaws;</text>
            <text x="609" y="160" textAnchor="middle" className={`${MUTED} text-[12px]`}>lot size scales down to keep dollar risk flat</text>
            <rect x="462" y="198" width="294" height="72" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
            <text x="609" y="238" textAnchor="middle" className={`${TXT} text-[13px] font-mono font-bold`}>$100 ÷ (60 pips × $10) = 0.16 Lots</text>
          </svg>
        ),
      };

    case 'fundamentals-transmission':
      return {
        title: 'Macro Transmission Chain: Data Surprise → Policy Expectations → Yield Spread → FX',
        caption: 'Currencies react to how economic data changes expected central bank interest rates, not just good or bad headlines.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Macro transmission chain">
            {[
              { x: 24, t: '1. Macro Release', b: 'CPI / NFP / GDP / PMI Actual vs Consensus Forecast' },
              { x: 222, t: '2. Rate Repricing', b: 'Swap & Fed Funds futures adjust hike/cut odds' },
              { x: 420, t: '3. Sovereign Yields', b: '2Y & 10Y bond yield differentials widen or narrow' },
              { x: 618, t: '4. FX Capital Flow', b: 'Capital rotates toward higher real-yield currency' },
            ].map((s, idx) => (
              <g key={s.t}>
                <rect x={s.x} y="66" width="178" height="196" rx="12" className={CARD} strokeWidth="1.5" />
                <text x={s.x + 89} y="108" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[14px] font-bold">{s.t}</text>
                <text x={s.x + 89} y="152" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>
                  {s.b.slice(0, 24)}
                </text>
                <text x={s.x + 89} y="174" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>
                  {s.b.slice(24)}
                </text>
                {idx < 3 && (
                  <text x={s.x + 188} y="168" textAnchor="middle" className={`${TXT} text-[18px] font-bold`}>→</text>
                )}
              </g>
            ))}
          </svg>
        ),
      };

    case 'central-bank-spectrum':
      return {
        title: 'Hawkish vs Dovish Central Bank Policy Spectrum',
        caption: 'Currency direction strengthens when forward guidance shifts unexpectedly from Dovish toward Hawkish.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Hawkish vs Dovish central bank spectrum">
            <rect x="28" y="28" width="764" height="264" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="64" y="138" width="330" height="20" rx="10" fill={BEAR} />
            <rect x="426" y="138" width="330" height="20" rx="10" fill={BULL} />
            <circle cx="410" cy="148" r="14" className="fill-slate-800 dark:fill-slate-200" />
            <text x="64" y="106" fill={BEAR} className="text-[15px] font-bold">DOVISH (Easing Bias)</text>
            <text x="64" y="190" className={`${MUTED} text-[12px]`}>Rate cuts · Lower real yields · Growth priority</text>
            <text x="64" y="214" className={`${MUTED} text-[12px]`}>Tends to weaken domestic currency over time</text>
            <text x="756" y="106" textAnchor="end" fill={BULL} className="text-[15px] font-bold">HAWKISH (Tightening Bias)</text>
            <text x="756" y="190" textAnchor="end" className={`${MUTED} text-[12px]`}>Rate hikes / Higher-for-longer · Inflation fight</text>
            <text x="756" y="214" textAnchor="end" className={`${MUTED} text-[12px]`}>Tends to attract capital and strengthen currency</text>
            <text x="410" y="262" textAnchor="middle" className={`${TXT} text-[12.5px] font-semibold`}>
              Key Market Rule: FX reprices policy SURPRISES relative to what swaps had already priced in.
            </text>
          </svg>
        ),
      };

    case 'sr-zones-diagram':
      return {
        title: 'Support & Resistance Zones vs Exact Thin Lines',
        caption: 'Institutional limit orders cluster across bands. Plotting S/R as shaded zones prevents premature stop-outs.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Support and resistance zones diagram">
            <rect x="24" y="24" width="772" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="52" y="64" width="716" height="44" rx="4" className="fill-rose-500/15 stroke-rose-600/40" />
            <text x="72" y="90" fill={BEAR} className="text-[12px] font-mono font-bold">RESISTANCE ZONE (1.0940 – 1.0955): Selling supply</text>
            <rect x="52" y="234" width="716" height="44" rx="4" className="fill-emerald-500/15 stroke-emerald-600/40" />
            <text x="72" y="260" fill={BULL} className="text-[12px] font-mono font-bold">SUPPORT ZONE (1.0810 – 1.0825): Buying demand</text>
            <polyline points="84,244 176,94 268,254 360,82 456,238 564,98 672,248 738,142" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="3" />
          </svg>
        ),
      };

    case 'sr-role-reversal':
      return {
        title: 'Support & Resistance Role Reversal (Break & Retest Flip)',
        caption: 'Once buyers absorb all resting supply and close above resistance, that former ceiling frequently flips into support.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Support resistance role reversal diagram">
            <rect x="24" y="24" width="772" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="52" y="150" width="716" height="32" rx="4" className="fill-amber-500/15 stroke-amber-500/40" />
            <text x="72" y="170" className="fill-amber-700 dark:fill-amber-400 text-[11.5px] font-mono font-bold">KEY FLIP ZONE: Old Resistance → New Support</text>
            <polyline points="72,268 158,178 232,242 308,176 410,84 494,154 640,56" fill="none" stroke={BULL} strokeWidth="3.5" />
            <circle cx="494" cy="154" r="8" fill="#881337" />
            <text x="514" y="198" className="fill-[#881337] dark:fill-rose-400 text-[12.5px] font-bold">Retest + Rejection Entry</text>
          </svg>
        ),
      };

    case 'sr-false-breakout':
      return {
        title: 'Breakout Confirmation vs Bull Trap (Fakeout)',
        caption: 'True breakouts close firmly outside the zone with follow-through; fakeouts wick past stops and snap back inside.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="False breakout vs true breakout">
            <rect x="24" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Valid Break &amp; Retest</text>
            <line x1="48" y1="162" x2="374" y2="162" className="stroke-slate-400" strokeDasharray="4 4" />
            <polyline points="62,232 146,166 220,104 268,160 356,82" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="211" y="286" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Decisive close above level + retest holds</text>

            <rect x="422" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">False Breakout (Bull Trap)</text>
            <line x1="446" y1="162" x2="772" y2="162" className="stroke-slate-400" strokeDasharray="4 4" />
            <polyline points="462,226 534,166 576,120 612,188 732,272" fill="none" stroke={BEAR} strokeWidth="3" />
            <text x="609" y="286" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Stop sweep above high snaps back inside range</text>
          </svg>
        ),
      };

    case 'supply-demand-zones':
      return {
        title: 'Supply & Demand Order Origin Zones (Rally-Base-Rally / Drop-Base-Drop)',
        caption: 'Institutional origin zones mark the tight consolidation base directly preceding an explosive departure.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Supply and demand zones">
            <rect x="24" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Fresh Demand Zone (Origin of Rally)</text>
            <rect x="64" y="196" width="290" height="44" rx="4" className="fill-emerald-500/15 stroke-emerald-600/40" />
            <Candle x={110} hY={198} lY={238} oY={204} cY={230} bull={false} />
            <Candle x={144} hY={132} lY={230} oY={224} cY={138} bull={true} />
            <Candle x={178} hY={88} lY={148} oY={140} cY={94} bull={true} />
            <path d="M196 106 L252 206 L330 112" fill="none" stroke={BULL} strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="211" y="288" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>First return to origin base invites unfilled bids</text>

            <rect x="422" y="24" width="374" height="292" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Fresh Supply Zone (Origin of Drop)</text>
            <rect x="462" y="88" width="290" height="44" rx="4" className="fill-rose-500/15 stroke-rose-600/40" />
            <Candle x={508} hY={92} lY={132} oY={126} cY={98} bull={true} />
            <Candle x={542} hY={98} lY={196} oY={104} cY={188} bull={false} />
            <Candle x={576} hY={180} lY={248} oY={186} cY={240} bull={false} />
            <path d="M594 226 L650 120 L730 228" fill="none" stroke={BEAR} strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="609" y="288" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>First return re-engages resting supply orders</text>
          </svg>
        ),
      };

    case 'sr-confluence-checklist':
      return {
        title: 'Confluence Scoring: Stacking Independent Structural Factors',
        caption: 'High-conviction levels combine multiple independent clues rather than relying on one isolated line.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Support resistance confluence checklist">
            <rect x="34" y="24" width="752" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="410" y="60" textAnchor="middle" className={`${TXT} text-[15px] font-bold`}>4-Pillar Zone Confluence Filter</text>
            {[
              { x: 64, y: 88, t: 'HTF Horizontal Level', d: 'Weekly/Daily swing flip' },
              { x: 424, y: 88, t: 'Round Number / Psych', d: '1.0800 · 1.1000 · 2300.00' },
              { x: 64, y: 184, t: 'Dynamic Moving Avg / Fib', d: '50-EMA or 61.8% overlap' },
              { x: 424, y: 184, t: 'Reaction Trigger', d: 'Pin bar / Engulfing close' },
            ].map((c) => (
              <g key={c.t}>
                <rect x={c.x} y={c.y} width="332" height="76" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
                <text x={c.x + 20} y={c.y + 32} fill={BULL} className="text-[13.5px] font-bold">{c.t}</text>
                <text x={c.x + 20} y={c.y + 56} className={`${MUTED} text-[12px]`}>{c.d}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'trendline-anatomy':
      return {
        title: 'Valid Diagonal Trendline Construction Rules',
        caption: 'Connect at least 2 decisive swing anchors (3rd touch confirms); avoid forcing lines through candle bodies.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trendline construction diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="76" y1="268" x2="720" y2="86" stroke={BULL} strokeWidth="3" />
            <polyline points="82,258 148,184 198,232 290,144 352,188 452,96 512,144 646,62" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2.5" />
            {[
              { x: 198, y: 232, l: 'Anchor 1' },
              { x: 352, y: 188, l: 'Anchor 2' },
              { x: 512, y: 144, l: '3rd Touch (Confirmation)' },
            ].map((pt) => (
              <g key={pt.l}>
                <circle cx={pt.x} cy={pt.y} r="7" fill="#881337" />
                <text x={pt.x + 10} y={pt.y + 18} className="fill-[#881337] dark:fill-rose-400 text-[11.5px] font-bold">{pt.l}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'trend-channels-diagram':
      return {
        title: 'Parallel Ascending & Descending Trend Channels',
        caption: 'Parallel channels frame both trend support (buy zone) and parallel return line targets.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trend channels diagram">
            <rect x="24" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Ascending Channel</text>
            <line x1="58" y1="184" x2="364" y2="86" stroke={BULL} strokeWidth="2" />
            <line x1="58" y1="256" x2="364" y2="158" stroke={BULL} strokeWidth="2" />
            <polyline points="72,248 128,164 176,216 244,128 288,180 352,96" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2.5" />

            <rect x="422" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Descending Channel</text>
            <line x1="458" y1="88" x2="764" y2="186" stroke={BEAR} strokeWidth="2" />
            <line x1="458" y1="160" x2="764" y2="258" stroke={BEAR} strokeWidth="2" />
            <polyline points="472,96 522,178 572,126 632,214 684,162 750,248" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2.5" />
          </svg>
        ),
      };

    case 'trendline-break-retest':
      return {
        title: 'Trendline Break, Retest & Structure Confluence',
        caption: 'Combine a broken trendline retest with a horizontal Break of Structure to filter false early breaks.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trendline break and retest">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="78" y1="268" x2="540" y2="84" stroke={BULL} strokeWidth="2.5" strokeDasharray="5 4" />
            <line x1="250" y1="162" x2="680" y2="162" stroke={BEAR} strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points="96,256 176,176 232,202 318,108 380,152 442,92 524,186 574,158 688,268" fill="none" stroke={BEAR} strokeWidth="3" />
            <circle cx="574" cy="158" r="7" fill="#881337" />
            <text x="590" y="150" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Underside Retest + Horizontal Flip</text>
          </svg>
        ),
      };

    case 'trendline-false-break':
      return {
        title: 'Overly Steep Trendlines vs Sustainable Slope',
        caption: 'Ultra-steep trendlines break on normal consolidations without reversing the primary trend.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trendline angle comparison">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="90" y1="266" x2="264" y2="62" stroke={BEAR} strokeWidth="2.5" strokeDasharray="5 3" />
            <line x1="90" y1="266" x2="730" y2="118" stroke={BULL} strokeWidth="3" />
            <polyline points="96,260 156,192 178,196 226,112 310,168 388,194 494,132 560,156 692,98" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2.5" />
            <text x="278" y="84" fill={BEAR} className="text-[12px] font-bold">75° Exhaustion Line Breaks Quickly</text>
            <text x="530" y="198" fill={BULL} className="text-[12px] font-bold">30°–45° Primary Trendline Remains Intact</text>
          </svg>
        ),
      };

    case 'indicator-regime-matrix':
      return {
        title: 'Matching Indicator Type to Market Regime (Trend vs Range)',
        caption: 'Trend indicators whip-saw in ranges; overbought/oversold oscillators fail during strong trends.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Indicator regime matrix">
            <rect x="24" y="28" width="374" height="274" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="64" textAnchor="middle" fill={BULL} className="text-[15px] font-bold">Trending Regime Tools</text>
            <text x="52" y="106" className={`${TXT} text-[13px] font-semibold`}>• 20 / 50 / 200 EMA Alignment</text>
            <text x="52" y="142" className={`${TXT} text-[13px] font-semibold`}>• MACD Trend Momentum</text>
            <text x="52" y="178" className={`${TXT} text-[13px] font-semibold`}>• ADX (&gt;25) + Ichimoku Cloud</text>
            <text x="52" y="232" fill={BEAR} className="text-[12px]">Pitfall: Selling RSI &gt;70 against strong uptrend</text>

            <rect x="422" y="28" width="374" height="274" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="64" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[15px] font-bold">Ranging / Mean-Reversion Tools</text>
            <text x="450" y="106" className={`${TXT} text-[13px] font-semibold`}>• RSI Divergence at Range Edges</text>
            <text x="450" y="142" className={`${TXT} text-[13px] font-semibold`}>• Stochastic (%K/%D) Crosses</text>
            <text x="450" y="178" className={`${TXT} text-[13px] font-semibold`}>• Bollinger Band Outer Mean Reversion</text>
            <text x="450" y="232" fill={BEAR} className="text-[12px]">Pitfall: Trading MA crossovers in choppy ranges</text>
          </svg>
        ),
      };

    case 'sma-ema-comparison':
      return {
        title: 'SMA vs EMA Responsiveness & Dynamic Pullback Support',
        caption: 'EMA weights recent bars more heavily, reacting faster than SMA during pullbacks and momentum shifts.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="SMA vs EMA comparison">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <polyline points="60,256 150,210 230,226 320,162 410,180 510,114 600,140 730,72" fill="none" className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="2" />
            <path d="M60 264 Q260 218 420 182 T730 92" fill="none" stroke={BULL} strokeWidth="3" />
            <path d="M60 278 Q280 246 440 214 T730 132" fill="none" stroke="#881337" strokeWidth="3" strokeDasharray="6 4" />
            <text x="530" y="84" fill={BULL} className="text-[12px] font-bold">20-EMA (Faster Dynamic Pullback Guide)</text>
            <text x="530" y="160" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">50-SMA (Slower Baseline Trend Filter)</text>
          </svg>
        ),
      };

    case 'rsi-zones-divergence':
      return {
        title: 'RSI Bullish Divergence & Range Thresholds (70 / 50 / 30)',
        caption: 'Divergence warns that selling momentum is weakening while price makes a marginally lower low.',
        svg: (
          <svg viewBox="0 0 820 350" className={SVG_BASE} role="img" aria-label="RSI divergence diagram">
            <rect x="24" y="20" width="772" height="148" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="48" y="44" className={`${TXT} text-[12px] font-bold`}>PRICE CHART: Lower Low (LL)</text>
            <polyline points="72,64 210,136 336,86 484,152 680,68" fill="none" stroke={BULL} strokeWidth="3" />
            <line x1="210" y1="136" x2="484" y2="152" stroke={BEAR} strokeWidth="2" strokeDasharray="4 4" />

            <rect x="24" y="180" width="772" height="148" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="48" y="204" className={`${TXT} text-[12px] font-bold`}>RSI (14): Higher Low (Bullish Divergence)</text>
            <line x1="48" y1="224" x2="770" y2="224" stroke={BEAR} strokeWidth="1" strokeDasharray="4 4" />
            <line x1="48" y1="296" x2="770" y2="296" stroke={BULL} strokeWidth="1" strokeDasharray="4 4" />
            <polyline points="72,228 210,304 336,248 484,282 680,222" fill="none" stroke="#881337" strokeWidth="3" />
            <line x1="210" y1="304" x2="484" y2="282" stroke={BULL} strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        ),
      };

    case 'macd-components':
      return {
        title: 'MACD Anatomy: 12/26 EMA Spread, 9-EMA Signal & Histogram',
        caption: 'Zero-line crossovers reflect major EMA trend shifts; histogram bars show whether momentum is accelerating or fading.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="MACD components diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="56" y1="172" x2="764" y2="172" className="stroke-slate-400" strokeWidth="1.5" />
            <text x="74" y="164" className={`${MUTED} text-[11px] font-mono`}>Zero Line (12-EMA = 26-EMA)</text>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
              const x = 90 + i * 44;
              const v = Math.sin((i - 4) * 0.48) * 68;
              return (
                <rect
                  key={i}
                  x={x}
                  y={v >= 0 ? 172 - v : 172}
                  width="18"
                  height={Math.max(4, Math.abs(v))}
                  fill={v >= 0 ? BULL : BEAR}
                  opacity="0.7"
                />
              );
            })}
            <path d="M90 218 Q260 230 390 156 T720 112" fill="none" stroke="#0284C7" strokeWidth="3" />
            <path d="M90 200 Q260 222 410 170 T720 128" fill="none" stroke="#D97706" strokeWidth="2.5" strokeDasharray="5 3" />
            <text x="530" y="64" className="fill-sky-600 dark:fill-sky-400 text-[12px] font-bold">MACD Line (12-26 EMA)</text>
            <text x="530" y="84" className="fill-amber-600 dark:fill-amber-400 text-[12px] font-bold">Signal Line (9-EMA)</text>
          </svg>
        ),
      };

    case 'stochastic-oscillator':
      return {
        title: 'Stochastic Oscillator (%K & %D) in Range Boundaries',
        caption: 'Measures close location inside recent High-Low range; most effective when reversing off horizontal S/R.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Stochastic oscillator diagram">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="60" y1="86" x2="760" y2="86" stroke={BEAR} strokeDasharray="4 4" />
            <text x="72" y="78" fill={BEAR} className="text-[11px] font-mono font-bold">80 Overbought Threshold</text>
            <line x1="60" y1="234" x2="760" y2="234" stroke={BULL} strokeDasharray="4 4" />
            <text x="72" y="252" fill={BULL} className="text-[11px] font-mono font-bold">20 Oversold Threshold</text>
            <path d="M80 248 Q160 60 240 124 T400 244 T560 76 T720 224" fill="none" stroke="#0284C7" strokeWidth="3" />
            <path d="M80 238 Q168 74 248 132 T408 238 T568 92 T720 212" fill="none" stroke="#881337" strokeWidth="2.5" strokeDasharray="4 3" />
          </svg>
        ),
      };

    case 'bollinger-bands-squeeze':
      return {
        title: 'Bollinger Band Volatility Squeeze → Directional Expansion',
        caption: 'Low-volatility band compression ("Squeeze") stores energy before price expands forcefully out of equilibrium.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Bollinger bands squeeze diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <path d="M60 90 C180 120 260 156 420 156 C540 156 620 82 750 62" fill="none" stroke="#0284C7" strokeWidth="2.5" />
            <path d="M60 240 C180 210 260 186 420 186 C540 186 620 218 750 218" fill="none" stroke="#0284C7" strokeWidth="2.5" />
            <path d="M60 165 L750 140" fill="none" className="stroke-amber-500" strokeWidth="2" strokeDasharray="4 4" />
            <polyline points="72,188 150,148 240,174 320,162 400,172 470,152 580,96 710,74" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="340" y="132" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Volatility Squeeze</text>
            <text x="640" y="54" textAnchor="middle" fill={BULL} className="text-[12px] font-bold">Breakout Band Walk</text>
          </svg>
        ),
      };

    case 'adx-ichimoku-overview':
      return {
        title: 'ADX Trend Strength Meter & Ichimoku Cloud Structure',
        caption: 'ADX measures trend strength (not direction) above 25; Ichimoku Cloud frames multi-horizon dynamic S/R.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="ADX and Ichimoku overview">
            <rect x="24" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>ADX (14) Trend Strength Gauge</text>
            <text x="60" y="110" className={`${MUTED} text-[13px]`}>• ADX &lt; 20 → Range / Mean Reversion</text>
            <text x="60" y="150" fill={BULL} className="text-[13px] font-semibold">• ADX 25–45 → Healthy Active Trend</text>
            <text x="60" y="190" fill={BEAR} className="text-[13px] font-semibold">• ADX &gt; 50 → Overextended / Exhaustion</text>
            <text x="60" y="242" className={`${MUTED} text-[12px]`}>Use +DI vs -DI for direction bias</text>

            <rect x="422" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Ichimoku Kumo (Cloud) Filter</text>
            <polygon points="462,218 580,168 756,120 756,178 580,214 462,250" className="fill-emerald-500/20 stroke-emerald-600/40" />
            <polyline points="468,184 560,144 630,152 746,84" fill="none" stroke={BULL} strokeWidth="3" />
            <text x="609" y="264" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Price above Kumo Cloud favors bullish setups</text>
          </svg>
        ),
      };

    case 'price-action-rejection-momentum':
      return {
        title: 'Pure Price Action: Strong Momentum Displacement vs Wick Rejection',
        caption: 'Large bodies closing near extremes show aggressive initiative; long wicks show resting limit absorption.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Rejection vs momentum bars">
            <rect x="24" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="54" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Initiative Momentum Displacement</text>
            <Candle x={134} hY={164} lY={232} oY={216} cY={172} bull={true} />
            <Candle x={184} hY={118} lY={184} oY={174} cY={124} bull={true} />
            <Candle x={234} hY={76} lY={132} oY={126} cY={82} bull={true} />
            <text x="211" y="274" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Expanding bodies closing cleanly near highs</text>

            <rect x="422" y="24" width="374" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="54" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Responsive Rejection Wick</text>
            <line x1="454" y1="106" x2="762" y2="106" stroke={BEAR} strokeDasharray="4 4" />
            <Candle x={580} hY={86} lY={228} oY={198} cY={216} bull={false} />
            <Candle x={630} hY={192} lY={262} oY={214} cY={254} bull={false} />
            <text x="609" y="286" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Long upper wick signals supply defense at level</text>
          </svg>
        ),
      };

    case 'liquidity-sweeps-diagram':
      return {
        title: 'Buy-Side (BSL) & Sell-Side (SSL) Liquidity Pools + Stop Sweeps',
        caption: 'Wait for price to sweep obvious equal highs/lows and displace back inside structure before aligning with the trap reversal.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Liquidity sweeps diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="64" y1="126" x2="640" y2="126" stroke={BEAR} strokeDasharray="5 4" strokeWidth="1.5" />
            <text x="80" y="114" fill={BEAR} className="text-[11.5px] font-mono font-bold">Equal Highs = Buy-Side Liquidity (Stop Clusters)</text>
            <polyline points="84,224 176,128 248,196 334,128 402,190 468,78 548,192 678,272" fill="none" stroke={BEAR} strokeWidth="3" />
            <circle cx="468" cy="78" r="8" fill="#881337" />
            <text x="486" y="78" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Liquidity Sweep + Snapback</text>
          </svg>
        ),
      };

    case 'fvg-imbalance-diagram':
      return {
        title: '3-Candle Fair Value Gap (FVG / Price Imbalance)',
        caption: 'The non-overlapping gap between Candle 1 High and Candle 3 Low represents fast one-sided displacement.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Fair Value Gap diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="200" y="136" width="520" height="48" className="fill-emerald-500/15 stroke-emerald-600/40" />
            <text x="530" y="164" fill={BULL} className="text-[12px] font-mono font-bold">FAIR VALUE GAP (Imbalance Zone)</text>
            <Candle x={220} hY={184} lY={260} oY={240} cY={196} bull={true} />
            <Candle x={280} hY={102} lY={212} oY={198} cY={112} bull={true} />
            <Candle x={340} hY={72} lY={136} oY={114} cY={80} bull={true} />
            <path d="M364 88 L434 156 L500 72" fill="none" stroke={BULL} strokeWidth="2.5" strokeDasharray="4 4" />
            <text x="220" y="284" textAnchor="middle" className={`${MUTED} text-[11px]`}>Candle 1</text>
            <text x="280" y="284" textAnchor="middle" className={`${MUTED} text-[11px]`}>Candle 2 Impulse</text>
            <text x="340" y="284" textAnchor="middle" className={`${MUTED} text-[11px]`}>Candle 3</text>
          </svg>
        ),
      };

    case 'order-block-mitigation':
      return {
        title: 'Bullish Order Block Origin & Pullback Mitigation',
        caption: 'An Order Block is the final down-candle directly preceding an impulsive rally that creates a Break of Structure.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Order block mitigation diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="166" y="190" width="490" height="54" className="fill-rose-500/10 stroke-[#881337]/40" />
            <text x="480" y="222" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-mono font-bold">Bullish Order Block (Last Sell Candle Before BOS)</text>
            <Candle x={190} hY={190} lY={244} oY={196} cY={234} bull={false} />
            <Candle x={240} hY={114} lY={230} oY={224} cY={124} bull={true} />
            <Candle x={290} hY={74} lY={138} oY={126} cY={82} bull={true} />
            <line x1="150" y1="110" x2="430" y2="110" stroke={BULL} strokeDasharray="4 4" />
            <text x="370" y="102" fill={BULL} className="text-[11px] font-mono font-bold">BOS Confirmed ↑</text>
            <path d="M312 84 L416 198 L546 72" fill="none" stroke={BULL} strokeWidth="2.5" strokeDasharray="4 4" />
          </svg>
        ),
      };

    case 'premium-discount-equilibrium':
      return {
        title: 'Dealing Range Equilibrium: Premium (>50%) vs Discount (<50%)',
        caption: 'Buyers seek discount pricing below 50% of the impulse leg; sellers seek premium pricing above 50%.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Premium and discount range diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="120" y="56" width="580" height="108" className="fill-rose-500/12" />
            <text x="144" y="92" fill={BEAR} className="text-[13px] font-bold">PREMIUM ZONE (50% – 100%) → Favor Short / Partial Profit Targets</text>
            <line x1="120" y1="164" x2="700" y2="164" className="stroke-slate-500" strokeWidth="2" strokeDasharray="5 4" />
            <text x="410" y="156" textAnchor="middle" className={`${TXT} text-[11px] font-mono font-bold`}>50% Equilibrium</text>
            <rect x="120" y="164" width="580" height="108" className="fill-emerald-500/12" />
            <text x="144" y="236" fill={BULL} className="text-[13px] font-bold">DISCOUNT ZONE (0% – 50%) → Favor Long Continuation Entries</text>
          </svg>
        ),
      };

    default:
      return null;
  }
}
