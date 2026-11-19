import React from 'react';
import type { VisualDiagramResult } from './visualsFoundations';

const SVG_BASE = 'w-full h-auto block select-none';
const CARD = 'fill-slate-50 dark:fill-slate-900/70 stroke-slate-200 dark:stroke-slate-700';
const TXT = 'fill-slate-900 dark:fill-slate-100';
const MUTED = 'fill-slate-500 dark:fill-slate-400';
const BULL = '#15803D';
const BEAR = '#9F1239';

export function renderRiskMacroVisual(key: string): VisualDiagramResult | null {
  switch (key) {
    case 'strategy-trend-pullback':
      return {
        title: 'Rule-Based Trend Pullback Strategy Blueprint',
        caption: 'Only execute pullbacks into aligned EMA/demand structure after a decisive higher-timeframe Break of Structure.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trend pullback strategy diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <path d="M60 274 Q290 218 480 162 T740 84" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="5 4" />
            <polyline points="72,258 186,162 246,196 364,108 424,158 594,68" fill="none" stroke={BULL} strokeWidth="3.5" />
            <rect x="382" y="144" width="84" height="32" rx="4" className="fill-emerald-500/20 stroke-emerald-600/40" />
            <text x="424" y="198" textAnchor="middle" fill={BULL} className="text-[12px] font-bold">Entry @ Pullback + Rejection</text>
            <line x1="382" y1="216" x2="478" y2="216" stroke={BEAR} strokeWidth="2" />
            <text x="492" y="220" fill={BEAR} className="text-[11px] font-mono">Stop below HL</text>
          </svg>
        ),
      };

    case 'strategy-break-retest':
      return {
        title: 'Breakout & Role-Reversal Retest Execution Model',
        caption: 'Let initial breakout stops clear, wait for the pullback retest to hold the broken zone, and place invalidation inside.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Break and retest strategy">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="52" y="154" width="716" height="26" className="fill-amber-500/15 stroke-amber-500/40" />
            <polyline points="72,248 164,178 242,232 326,174 420,96 496,158 672,58" fill="none" stroke={BULL} strokeWidth="3.5" />
            <circle cx="496" cy="158" r="7" fill="#881337" />
            <text x="514" y="148" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Retest Entry (Stop below box)</text>
          </svg>
        ),
      };

    case 'strategy-range-reversion':
      return {
        title: 'Mean-Reversion Range Framework (Fade Edges Toward Midpoint)',
        caption: 'Only active when price stays flat between clear boundaries with ADX < 20; avoid fighting impulsive breakouts.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Range mean reversion strategy">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="60" y1="88" x2="760" y2="88" stroke={BEAR} strokeWidth="2.5" strokeDasharray="5 4" />
            <line x1="60" y1="168" x2="760" y2="168" className="stroke-slate-400" strokeDasharray="4 4" />
            <line x1="60" y1="248" x2="760" y2="248" stroke={BULL} strokeWidth="2.5" strokeDasharray="5 4" />
            <polyline points="82,242 184,92 288,244 402,94 514,244 636,92 718,176" fill="none" className="stroke-amber-600 dark:stroke-amber-400" strokeWidth="3" />
            <text x="410" y="76" textAnchor="middle" fill={BEAR} className="text-[12px] font-bold">Resistance Edge (Short Target: Mid/Support)</text>
            <text x="410" y="274" textAnchor="middle" fill={BULL} className="text-[12px] font-bold">Support Edge (Long Target: Mid/Resistance)</text>
          </svg>
        ),
      };

    case 'strategy-session-windows':
      return {
        title: 'London & NY Opening Breakout Windows (Session Filtering)',
        caption: 'Focus execution during liquid institutional open windows rather than thin Asian or late Friday drift.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Session breakout windows">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="64" y="128" width="230" height="84" rx="6" className="fill-slate-200/70 dark:fill-slate-800/70" />
            <text x="179" y="166" textAnchor="middle" className={`${TXT} text-[12px] font-bold`}>Asian Box High / Low</text>
            <rect x="294" y="64" width="240" height="214" rx="6" className="fill-emerald-500/10 stroke-emerald-600/40" />
            <text x="414" y="88" textAnchor="middle" fill={BULL} className="text-[12px] font-bold">London Open Killzone (07:00–10:00 UTC)</text>
            <polyline points="78,176 132,146 196,192 268,150 326,214 378,124 498,74 686,98" fill="none" stroke={BULL} strokeWidth="3" />
          </svg>
        ),
      };

    case 'strategy-rulebook-blueprint':
      return {
        title: '5-Module Written Trading System Playbook Architecture',
        caption: 'A professional strategy explicitly states universe, setup filters, exact triggers, sizing math, and trade-halt rules.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Trading strategy rulebook blueprint">
            {[
              { x: 24, n: '01 Universe', d: 'Pairs, spreads & session windows' },
              { x: 180, n: '02 Bias Filter', d: 'HTF structure & macro filter' },
              { x: 336, n: '03 Trigger', d: 'Objective zone + candle close' },
              { x: 492, n: '04 Risk Math', d: '0.5–1% sizing + min 1:2 R:R' },
              { x: 648, n: '05 Review', d: 'Journal tagging & daily cap' },
            ].map((m) => (
              <g key={m.n}>
                <rect x={m.x} y="64" width="144" height="202" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={m.x + 72} y="108" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[13.5px] font-bold">{m.n}</text>
                <text x={m.x + 72} y="160" textAnchor="middle" className={`${MUTED} text-[11px]`}>{m.d.slice(0, 18)}</text>
                <text x={m.x + 72} y="180" textAnchor="middle" className={`${MUTED} text-[11px]`}>{m.d.slice(18)}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'expectancy-costs-diagram':
      return {
        title: 'Trading Expectancy Balance: Win Rate × Payoff Ratio Minus Costs',
        caption: 'High win rate with tiny winners and huge stops produces negative expectancy; modest win rate with 1:2.5+ R:R compounds.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Expectancy and execution costs diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="64" y="54" width="692" height="54" rx="8" className="fill-[#881337]" />
            <text x="410" y="87" textAnchor="middle" className="fill-white text-[15px] font-mono font-bold">
              Net Expectancy (R) = (Win% × AvgWinR) − (Loss% × 1.0R) − FrictionCostR
            </text>
            <rect x="64" y="132" width="330" height="142" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" />
            <text x="229" y="164" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Positive Asymmetric Edge (42% Win @ 2.5R)</text>
            <text x="229" y="198" textAnchor="middle" className={`${TXT} text-[13px] font-mono`}>(0.42 × 2.5) − (0.58 × 1.0) − 0.04</text>
            <text x="229" y="232" textAnchor="middle" fill={BULL} className="text-[18px] font-mono font-bold">+0.43R Net Per Trade</text>

            <rect x="426" y="132" width="330" height="142" rx="10" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" />
            <text x="591" y="164" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">High Win-Rate Trap (70% Win @ 0.35R)</text>
            <text x="591" y="198" textAnchor="middle" className={`${TXT} text-[13px] font-mono`}>(0.70 × 0.35) − (0.30 × 1.0) − 0.05</text>
            <text x="591" y="232" textAnchor="middle" fill={BEAR} className="text-[18px] font-mono font-bold">-0.105R Negative Expectancy</text>
          </svg>
        ),
      };

    case 'risk-reward-geometry':
      return {
        title: 'Risk-to-Reward Geometry & Break-Even Win Rate Curve',
        caption: 'As Reward multiple rises (1:1 → 1:2 → 1:3), the minimum win rate required simply to break even drops sharply.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Risk reward geometry">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { x: 64, rr: '1 : 1.0', be: '50.0% Win Rate', h: 160, c: 'fill-amber-500' },
              { x: 248, rr: '1 : 2.0', be: '33.3% Win Rate', h: 108, c: 'fill-sky-600' },
              { x: 432, rr: '1 : 3.0', be: '25.0% Win Rate', h: 80, c: 'fill-[#15803D]' },
              { x: 616, rr: '1 : 4.0', be: '20.0% Win Rate', h: 64, c: 'fill-[#881337]' },
            ].map((b) => (
              <g key={b.rr}>
                <text x={b.x + 68} y={248 - b.h - 14} textAnchor="middle" className={`${TXT} text-[12px] font-mono font-bold`}>{b.be}</text>
                <rect x={b.x + 28} y={248 - b.h} width="80" height={b.h} rx="6" className={b.c} />
                <text x={b.x + 68} y="276" textAnchor="middle" className={`${MUTED} text-[13px] font-mono font-bold`}>{b.rr} R:R</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'position-sizing-equation':
      return {
        title: 'Risk-First Position Sizing Pipeline (Stop First, Lots Second)',
        caption: 'Never pick an arbitrary lot size first; derive exact units from Equity %, Stop Distance, and Pip Value.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Position sizing pipeline">
            {[
              { x: 24, t: '1. Dollar Risk', v: '$10,000 × 1% = $100' },
              { x: 222, t: '2. Stop Distance', v: 'Chart SL = 25 Pips' },
              { x: 420, t: '3. Pip Value', v: '$10 / pip (1.0 Lot)' },
              { x: 618, t: '4. Output Size', v: '0.40 Standard Lots' },
            ].map((s, i) => (
              <g key={s.t}>
                <rect x={s.x} y="76" width="178" height="168" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={s.x + 89} y="122" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[13.5px] font-bold">{s.t}</text>
                <text x={s.x + 89} y="168" textAnchor="middle" className={`${TXT} text-[13px] font-mono font-bold`}>{s.v}</text>
                {i < 3 && <text x={s.x + 188} y="164" textAnchor="middle" className={`${TXT} text-[18px] font-bold`}>→</text>}
              </g>
            ))}
          </svg>
        ),
      };

    case 'drawdown-recovery-curve':
      return {
        title: 'Exponential Drawdown Recovery Asymmetry',
        caption: 'Losses shrink the capital base geometrically: recovering from a -50% drawdown demands a +100% return.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Drawdown recovery asymmetry curve">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { dd: '-10% DD', gain: '+11.1%', h: 24, x: 76, c: 'fill-[#15803D]' },
              { dd: '-20% DD', gain: '+25.0%', h: 48, x: 214, c: 'fill-sky-600' },
              { dd: '-30% DD', gain: '+42.9%', h: 78, x: 352, c: 'fill-amber-500' },
              { dd: '-50% DD', gain: '+100.0%', h: 146, x: 490, c: 'fill-[#9F1239]' },
              { dd: '-75% DD', gain: '+300.0%', h: 204, x: 628, c: 'fill-[#881337]' },
            ].map((b) => (
              <g key={b.dd}>
                <text x={b.x + 42} y={258 - b.h - 10} textAnchor="middle" className={`${TXT} text-[12px] font-mono font-bold`}>{b.gain}</text>
                <rect x={b.x} y={258 - b.h} width="84" height={b.h} rx="6" className={b.c} />
                <text x={b.x + 42} y="284" textAnchor="middle" className={`${MUTED} text-[12px] font-mono font-bold`}>{b.dd}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'correlated-exposure-diagram':
      return {
        title: 'Aggregate Portfolio Risk vs Single-Trade Illusion',
        caption: 'Three simultaneous 1% long USD-short trades create 3% hidden single-factor macro exposure.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Correlated portfolio exposure diagram">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="64" y="64" width="210" height="80" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="169" y="102" textAnchor="middle" className={`${TXT} text-[13px] font-bold font-mono`}>Long EUR/USD (1%)</text>
            <rect x="305" y="64" width="210" height="80" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="410" y="102" textAnchor="middle" className={`${TXT} text-[13px] font-bold font-mono`}>Long GBP/USD (1%)</text>
            <rect x="546" y="64" width="210" height="80" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="651" y="102" textAnchor="middle" className={`${TXT} text-[13px] font-bold font-mono`}>Short USD/CHF (1%)</text>
            <rect x="64" y="188" width="692" height="72" rx="10" className="fill-[#9F1239]" />
            <text x="410" y="230" textAnchor="middle" className="fill-white text-[15px] font-bold">
              Hidden Reality: ~2.7% Concentrated Short-USD Macro Bet if US CPI Surprises Hot
            </text>
          </svg>
        ),
      };

    case 'execution-costs-slippage':
      return {
        title: 'All-In Trade Friction: Spread + Commission + Swap + Slippage',
        caption: 'Account for total round-turn friction when computing realistic break-even and R:R targets.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Execution costs and slippage">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { x: 60, y: 74, w: 260, t: 'Spread Cost', c: 'fill-[#881337]' },
              { x: 326, y: 74, w: 140, t: 'Commission', c: 'fill-sky-700' },
              { x: 472, y: 74, w: 140, t: 'Swap / Funding', c: 'fill-amber-600' },
              { x: 618, y: 74, w: 142, t: 'News Slippage', c: 'fill-[#9F1239]' },
            ].map((s) => (
              <g key={s.t}>
                <rect x={s.x} y={s.y} width={s.w} height="48" rx="6" className={s.c} />
                <text x={s.x + s.w / 2} y={s.y + 29} textAnchor="middle" className="fill-white text-[12px] font-bold">{s.t}</text>
              </g>
            ))}
            <text x="410" y="182" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Net Profit = Gross Strategy Edge − Total Execution Drag</text>
            <text x="410" y="216" textAnchor="middle" className={`${MUTED} text-[12.5px]`}>Avoid market orders during rollover (22:00 UTC) and major tier-1 macro spikes.</text>
          </svg>
        ),
      };

    case 'psychology-emotional-cycle':
      return {
        title: 'Emotional Decision Loop vs Rule-Governed Process Loop',
        caption: 'Interrupting tilt after losses requires pre-defined stop-trading thresholds rather than willpower in the heat of the moment.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Trading psychology emotional loop">
            <rect x="24" y="24" width="374" height="272" rx="12" className="fill-rose-50/60 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="211" y="58" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Reactive Tilt Cycle</text>
            <text x="211" y="106" textAnchor="middle" className={`${TXT} text-[13px]`}>Impulsive Loss → Frustration</text>
            <text x="211" y="146" textAnchor="middle" className={`${TXT} text-[13px]`}>↓</text>
            <text x="211" y="182" textAnchor="middle" className={`${TXT} text-[13px]`}>Double Risk ("Make It Back")</text>
            <text x="211" y="222" textAnchor="middle" className={`${TXT} text-[13px]`}>↓</text>
            <text x="211" y="256" textAnchor="middle" fill={BEAR} className="text-[13px] font-bold">Severe Drawdown Breach</text>

            <rect x="422" y="24" width="374" height="272" rx="12" className="fill-emerald-50/60 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="609" y="58" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Disciplined Process Circuit</text>
            <text x="609" y="106" textAnchor="middle" className={`${TXT} text-[13px]`}>Planned 1R Loss → Accepted Variance</text>
            <text x="609" y="146" textAnchor="middle" className={`${TXT} text-[13px]`}>↓</text>
            <text x="609" y="182" textAnchor="middle" className={`${TXT} text-[13px]`}>Daily Cap Reached → Mandatory Reset</text>
            <text x="609" y="222" textAnchor="middle" className={`${TXT} text-[13px]`}>↓</text>
            <text x="609" y="256" textAnchor="middle" fill={BULL} className="text-[13px] font-bold">Equity Preserved for Next Setup</text>
          </svg>
        ),
      };

    case 'cognitive-biases-matrix':
      return {
        title: 'Four Core Trading Cognitive Biases & Written Safeguards',
        caption: 'Behavioral engineering beats self-discipline alone by making rule breaks structurally harder to execute.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Cognitive biases matrix">
            {[
              { x: 24, y: 24, b: 'FOMO Chasing', s: 'Fix: Limit orders at planned zones only; never chase extended candles.' },
              { x: 422, y: 24, b: 'Loss Aversion / Moving SL', s: 'Fix: Never widen stop-loss after fill; hard invalidation stands.' },
              { x: 24, y: 174, b: 'Recency Bias', s: 'Fix: Judge edge across 30–50 trade blocks, never the last 1 trade.' },
              { x: 422, y: 174, b: 'Overconfidence After Wins', s: 'Fix: Maintain fixed 0.5%–1% sizing after winning streaks.' },
            ].map((item) => (
              <g key={item.b}>
                <rect x={item.x} y={item.y} width="374" height="132" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={item.x + 20} y={item.y + 42} fill={BEAR} className="text-[14px] font-bold">{item.b}</text>
                <text x={item.x + 20} y={item.y + 78} className={`${MUTED} text-[12px]`}>{item.s.slice(0, 44)}</text>
                <text x={item.x + 20} y={item.y + 100} className={`${MUTED} text-[12px]`}>{item.s.slice(44)}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'pre-trade-routine-flow':
      return {
        title: '6-Step Pre-Trade Execution Checklist',
        caption: 'Run every potential idea through the same mechanical gatekeeper before opening the order ticket.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Pre-trade checklist flow">
            {[
              { x: 24, y: 24, s: '1. Calendar Check', d: 'No imminent CPI / NFP spike?' },
              { x: 290, y: 24, s: '2. HTF Alignment', d: 'Trade matches Daily/H4 bias?' },
              { x: 556, y: 24, s: '3. Key Zone', d: 'Price at clear S/R or demand?' },
              { x: 24, y: 176, s: '4. Trigger Close', d: 'Candle closed cleanly with signal?' },
              { x: 290, y: 176, s: '5. R:R & Sizing', d: '≥ 1:2 R:R and ≤ 1% risk?' },
              { x: 556, y: 176, s: '6. Correlation Cap', d: 'Total portfolio heat safe?' },
            ].map((c) => (
              <g key={c.s}>
                <rect x={c.x} y={c.y} width="240" height="126" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={c.x + 20} y={c.y + 46} fill={BULL} className="text-[14px] font-bold">{c.s}</text>
                <text x={c.x + 20} y={c.y + 82} className={`${MUTED} text-[12.5px]`}>{c.d}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'journal-process-outcome':
      return {
        title: 'Process vs Outcome Matrix for Post-Trade Journaling',
        caption: 'Separate rule adherence (skill) from single-trade profit/loss (short-term variance).',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Process vs outcome matrix">
            <rect x="64" y="34" width="336" height="130" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="232" y="80" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Deserved Win (Rules + Profit)</text>
            <text x="232" y="112" textAnchor="middle" className={`${MUTED} text-[12px]`}>Archive &amp; reinforce behavior</text>

            <rect x="420" y="34" width="336" height="130" rx="10" className="fill-amber-50/70 dark:fill-amber-950/20 stroke-amber-500/40" strokeWidth="1.5" />
            <text x="588" y="80" textAnchor="middle" className="fill-amber-700 dark:fill-amber-400 text-[14px] font-bold">Bad Win (Broke Rules, Got Lucky)</text>
            <text x="588" y="112" textAnchor="middle" className={`${MUTED} text-[12px]`}>Danger: rewards bad habits!</text>

            <rect x="64" y="180" width="336" height="130" rx="10" className={CARD} strokeWidth="1.5" />
            <text x="232" y="226" textAnchor="middle" className="fill-sky-600 dark:fill-sky-400 text-[14px] font-bold">Good Loss (Rules Followed, Normal 1R)</text>
            <text x="232" y="258" textAnchor="middle" className={`${MUTED} text-[12px]`}>Cost of doing business — zero tilt</text>

            <rect x="420" y="180" width="336" height="130" rx="10" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="588" y="226" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Bad Loss (Tilt / No Plan / Oversized)</text>
            <text x="588" y="258" textAnchor="middle" className={`${MUTED} text-[12px]`}>Eliminate via checklist enforcement</text>
          </svg>
        ),
      };

    case 'xauusd-contract-specs':
      return {
        title: 'Spot Gold (XAU/USD) Contract & Volatility Mechanics',
        caption: '1.00 Standard Lot of XAU/USD represents 100 troy ounces—every $1.00 move equals $100 P&L.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="XAUUSD contract specifications">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { x: 54, t: '1.00 Lot (100 oz)', v: '$100 per $1 move', s: '$10 move = $1,000' },
              { x: 300, t: '0.10 Lot (10 oz)', v: '$10 per $1 move', s: '$10 move = $100' },
              { x: 546, t: '0.01 Lot (1 oz)', v: '$1 per $1 move', s: '$10 move = $10' },
            ].map((b) => (
              <g key={b.t}>
                <rect x={b.x} y="60" width="220" height="148" rx="10" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
                <text x={b.x + 110} y="100" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[15px] font-bold">{b.t}</text>
                <text x={b.x + 110} y="138" textAnchor="middle" className={`${TXT} text-[14px] font-mono font-bold`}>{b.v}</text>
                <text x={b.x + 110} y="174" textAnchor="middle" className={`${MUTED} text-[12px]`}>{b.s}</text>
              </g>
            ))}
            <text x="410" y="256" textAnchor="middle" fill={BEAR} className="text-[13px] font-semibold">
              Because Gold swings $15–$40+ daily, divide standard EUR/USD lot size down accordingly.
            </text>
          </svg>
        ),
      };

    case 'xauusd-macro-drivers':
      return {
        title: 'Gold (XAU/USD) Macro Drivers: Real Yields, DXY & Safe-Haven Demand',
        caption: 'Gold typically trades inversely to US 10-Year Real (TIPS) Yields and US Dollar strength.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Gold macro drivers">
            {[
              { x: 24, h: 'US Real Yields (TIPS)', rel: 'Inverse Relationship ↓↑', d: 'Rising real yields increase opportunity cost of holding non-yielding Gold.' },
              { x: 292, h: 'US Dollar (DXY)', rel: 'Inverse Relationship ↓↑', d: 'Stronger USD makes dollar-denominated Gold costlier for global buyers.' },
              { x: 560, h: 'Central Bank & Risk Hedge', rel: 'Direct Support ↑↑', d: 'Reserve diversification and geopolitical stress lift physical & spot demand.' },
            ].map((c) => (
              <g key={c.h}>
                <rect x={c.x} y="34" width="236" height="252" rx="12" className={CARD} strokeWidth="1.5" />
                <text x={c.x + 118} y="76" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[14px] font-bold">{c.h}</text>
                <text x={c.x + 118} y="112" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-mono font-bold">{c.rel}</text>
                <text x={c.x + 18} y="160" className={`${MUTED} text-[12px]`}>{c.d.slice(0, 32)}</text>
                <text x={c.x + 18} y="184" className={`${MUTED} text-[12px]`}>{c.d.slice(32, 64)}</text>
                <text x={c.x + 18} y="208" className={`${MUTED} text-[12px]`}>{c.d.slice(64)}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'xauusd-sessions-liquidity':
      return {
        title: 'XAU/USD Intraday Liquidity Windows & Round-Number Sweeps',
        caption: 'Gold liquidity peaks around London Fix/Open and NY COMEX open (13:20–15:30 UTC), where sweep reversals frequently occur.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Gold intraday liquidity windows">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <line x1="60" y1="106" x2="760" y2="106" stroke={BEAR} strokeDasharray="5 4" />
            <text x="72" y="94" fill={BEAR} className="text-[11.5px] font-mono font-bold">Psychological Level ($2,500.00 / Round 10s)</text>
            <polyline points="82,214 190,148 280,188 370,114 438,78 518,164 678,248" fill="none" className="stroke-amber-600 dark:stroke-amber-400" strokeWidth="3.5" />
            <text x="438" y="64" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">NY COMEX Open Liquidity Sweep</text>
          </svg>
        ),
      };

    case 'xauusd-chart-structure':
      return {
        title: 'XAU/USD ATR-Buffered Structural Stop Placement',
        caption: 'Tight FX-style stops fail on Gold; anchor stops past swing extremes plus 1.0–1.5× H1 ATR.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="XAUUSD chart structure example">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <rect x="64" y="182" width="692" height="36" className="fill-emerald-500/15 stroke-emerald-600/40" />
            <polyline points="82,238 190,132 276,188 416,84 486,192 670,74" fill="none" stroke={BULL} strokeWidth="3.5" />
            <line x1="420" y1="238" x2="620" y2="238" stroke={BEAR} strokeWidth="2.5" />
            <text x="520" y="260" textAnchor="middle" fill={BEAR} className="text-[12px] font-mono font-bold">Stop Buffered Below Zone + ATR</text>
          </svg>
        ),
      };

    case 'crypto-blockchain-basics':
      return {
        title: 'Distributed Ledger, Public Address vs Private Key Ownership',
        caption: 'Assets live on-chain, not inside your phone or hardware device—your private key proves cryptographic signing authority.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Blockchain and private key basics">
            <rect x="24" y="34" width="236" height="252" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="142" y="76" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Public Address</text>
            <text x="142" y="114" textAnchor="middle" className={`${MUTED} text-[12px]`}>Shareable deposit destination</text>
            <text x="142" y="148" textAnchor="middle" className={`${TXT} text-[11px] font-mono`}>0x742d...91B4 / bc1q...</text>

            <rect x="292" y="34" width="236" height="252" rx="12" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="410" y="76" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Private Key / Seed</text>
            <text x="410" y="114" textAnchor="middle" className={`${MUTED} text-[12px]`}>12/24-word recovery secret</text>
            <text x="410" y="148" textAnchor="middle" fill={BEAR} className="text-[12px] font-bold">NEVER enter online or share</text>

            <rect x="560" y="34" width="236" height="252" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="678" y="76" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>24/7 Ledger Finality</text>
            <text x="678" y="114" textAnchor="middle" className={`${MUTED} text-[12px]`}>Continuous global settlement</text>
            <text x="678" y="148" textAnchor="middle" className={`${MUTED} text-[12px]`}>Zero market close / weekend gap</text>
          </svg>
        ),
      };

    case 'crypto-spot-vs-perps':
      return {
        title: 'Spot Holding vs Leveraged Perpetual Futures & Funding Rates',
        caption: 'Perpetual swaps have zero expiration and rely on periodic Funding payments plus liquidation engines.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Crypto Spot vs Perpetual Futures">
            <rect x="24" y="28" width="374" height="264" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="64" textAnchor="middle" fill={BULL} className="text-[15px] font-bold">Spot Market (1x Ownership)</text>
            <text x="54" y="108" className={`${MUTED} text-[12.5px]`}>• Own underlying BTC / ETH directly</text>
            <text x="54" y="144" className={`${MUTED} text-[12.5px]`}>• Zero forced liquidation risk</text>
            <text x="54" y="180" className={`${MUTED} text-[12.5px]`}>• Can withdraw to hardware cold wallet</text>
            <text x="54" y="216" className={`${MUTED} text-[12.5px]`}>• Zero ongoing funding fees</text>

            <rect x="422" y="28" width="374" height="264" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="64" textAnchor="middle" fill={BEAR} className="text-[15px] font-bold">Perpetual Futures (Margin Derivative)</text>
            <text x="452" y="108" className={`${MUTED} text-[12.5px]`}>• Synthetic exposure with posted margin</text>
            <text x="452" y="144" className={`${MUTED} text-[12.5px]`}>• Periodic 8h Funding Rate cost/credit</text>
            <text x="452" y="180" fill={BEAR} className="text-[12.5px] font-semibold">• Liquidation cascade risk on volatile wicks</text>
            <text x="452" y="216" className={`${MUTED} text-[12.5px]`}>• Counterparty &amp; ADL exchange risk</text>
          </svg>
        ),
      };

    case 'crypto-orderbook-liquidity':
      return {
        title: 'Crypto Order Book Depth, Maker/Taker Fees & Slippage',
        caption: 'Thin altcoin order books suffer severe market-order slippage; prefer Limit (Maker) execution inside liquid depth.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Crypto orderbook liquidity diagram">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="410" y="56" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>Cumulative Order Book Depth Profile</text>
            <polygon points="402,240 280,224 190,174 86,86 86,240" className="fill-emerald-500/25 stroke-emerald-600" strokeWidth="2" />
            <polygon points="418,240 536,220 632,168 734,86 734,240" className="fill-rose-500/25 stroke-rose-600" strokeWidth="2" />
            <text x="230" y="268" textAnchor="middle" fill={BULL} className="text-[12px] font-bold">Bid Wall (Resting Limit Buys)</text>
            <text x="590" y="268" textAnchor="middle" fill={BEAR} className="text-[12px] font-bold">Ask Wall (Resting Limit Sells)</text>
          </svg>
        ),
      };

    case 'crypto-custody-security':
      return {
        title: 'Cryptocurrency Security Layers: Hot vs Cold Hardware Custody',
        caption: 'Minimize exchange balances; protect recovery phrases offline on metal/paper and use hardware-key 2FA.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Crypto custody and security tiers">
            {[
              { x: 24, t: 'Exchange Hot Balance', r: 'High Counterparty Risk', d: 'Active trading margin only' },
              { x: 292, t: 'Software Wallet', r: 'Moderate Device Risk', d: 'Verify URLs & token approvals' },
              { x: 560, t: 'Hardware Cold Storage', r: 'Highest Safety Standard', d: 'Offline key signing + seed backup' },
            ].map((c) => (
              <g key={c.t}>
                <rect x={c.x} y="44" width="236" height="232" rx="12" className={CARD} strokeWidth="1.5" />
                <text x={c.x + 118} y="92" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>{c.t}</text>
                <text x={c.x + 118} y="138" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">{c.r}</text>
                <text x={c.x + 118} y="184" textAnchor="middle" className={`${MUTED} text-[12px]`}>{c.d}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'crypto-cycles-dominance':
      return {
        title: 'Crypto Liquidity Rotation & Bitcoin Dominance (BTC.D)',
        caption: 'Capital typically flows into BTC first before rotating into large-caps and higher-beta altcoins during expansions.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Crypto capital rotation cycles">
            {[
              { x: 24, t: 'Phase 1: BTC Led', d: 'BTC outperforms; BTC.D rises' },
              { x: 222, t: 'Phase 2: ETH / Large Cap', d: 'Major L1 rotation begins' },
              { x: 420, t: 'Phase 3: Broad Risk-On', d: 'High-beta altcoins spike' },
              { x: 618, t: 'Phase 4: De-Risking', d: 'Correlation → 1.0 on dumps' },
            ].map((p, idx) => (
              <g key={p.t}>
                <rect x={p.x} y="66" width="178" height="188" rx="10" className={CARD} strokeWidth="1.5" />
                <text x={p.x + 89} y="114" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[13px] font-bold">{p.t}</text>
                <text x={p.x + 89} y="158" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>{p.d}</text>
                {idx < 3 && <text x={p.x + 188} y="164" textAnchor="middle" className={`${TXT} text-[18px] font-bold`}>→</text>}
              </g>
            ))}
          </svg>
        ),
      };

    case 'volume-profile-auction':
      return {
        title: 'Auction Market Theory & Volume Profile (POC, VAH, VAL, LVN)',
        caption: 'Price tends to linger around High-Volume Nodes (fair value) and slice rapidly through Low-Volume Nodes.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Volume profile auction market diagram">
            <rect x="24" y="24" width="772" height="282" rx="12" className={CARD} strokeWidth="1.5" />
            {[
              { y: 74, w: 60 },
              { y: 100, w: 120 },
              { y: 126, w: 220 },
              { y: 152, w: 310, poc: true },
              { y: 178, w: 240 },
              { y: 204, w: 80, lvn: true },
              { y: 230, w: 150 },
              { y: 256, w: 70 },
            ].map((bar, i) => (
              <rect
                key={i}
                x="60"
                y={bar.y}
                width={bar.w}
                height="18"
                rx="3"
                className={bar.poc ? 'fill-[#881337]' : bar.lvn ? 'fill-amber-500/70' : 'fill-slate-400/60 dark:fill-slate-600'}
              />
            ))}
            <line x1="60" y1="161" x2="750" y2="161" stroke="#881337" strokeDasharray="5 3" strokeWidth="2" />
            <text x="410" y="152" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-bold">Point of Control (POC — Highest Volume Value)</text>
            <text x="410" y="216" className="fill-amber-700 dark:fill-amber-400 text-[12px] font-bold">Low-Volume Node (LVN — Fast Rejection / Air Pocket)</text>
          </svg>
        ),
      };

    case 'portfolio-correlation-hedging':
      return {
        title: 'Portfolio Heat & Currency Factor Risk Budgeting',
        caption: 'Budget net exposure by underlying currency factor (USD, EUR, JPY, Gold) rather than per-ticket count.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Portfolio factor risk budgeting">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="60" y="64" className={`${TXT} text-[14px] font-bold`}>Hard Portfolio Heat Cap: Max 2.5% Aggregate Open Risk</text>
            <rect x="60" y="96" width="690" height="32" rx="6" className="fill-slate-200 dark:fill-slate-800" />
            <rect x="60" y="96" width="220" height="32" rx="6" fill={BULL} />
            <rect x="284" y="96" width="180" height="32" rx="6" className="fill-sky-600" />
            <rect x="468" y="96" width="140" height="32" rx="6" className="fill-amber-500" />
            <text x="170" y="117" textAnchor="middle" className="fill-white text-[11px] font-bold">USD Factor: 0.8%</text>
            <text x="374" y="117" textAnchor="middle" className="fill-white text-[11px] font-bold">JPY Cross: 0.6%</text>
            <text x="538" y="117" textAnchor="middle" className="fill-white text-[11px] font-bold">Gold: 0.5%</text>
            <text x="410" y="186" textAnchor="middle" className={`${MUTED} text-[12.5px]`}>
              Total Open Heat = 1.9% (Within 2.5% Hard Ceiling). True hedges offset factor delta cleanly; avoid fake "hedge lock" fees.
            </text>
          </svg>
        ),
      };

    case 'walk-forward-validation':
      return {
        title: 'Rolling Walk-Forward Out-of-Sample Testing Cycle',
        caption: 'Prevent hindsight bias by validating rules sequentially on unseen future data segments.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Walk-forward validation timeline">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            {[0, 1, 2].map((row) => {
              const y = 70 + row * 68;
              const offset = row * 120;
              return (
                <g key={row}>
                  <text x="50" y={y + 24} className={`${MUTED} text-[11.5px] font-mono`}>Fold {row + 1}</text>
                  <rect x={120 + offset} y={y} width="260" height="36" rx="6" className="fill-slate-600" />
                  <text x={250 + offset} y={y + 23} textAnchor="middle" className="fill-white text-[11.5px] font-semibold">In-Sample Design</text>
                  <rect x={386 + offset} y={y} width="120" height="36" rx="6" fill={BULL} />
                  <text x={446 + offset} y={y + 23} textAnchor="middle" className="fill-white text-[11.5px] font-semibold">Unseen Test</text>
                </g>
              );
            })}
          </svg>
        ),
      };

    case 'overfitting-vs-robustness':
      return {
        title: 'Curve-Fitted Fragility vs Broad Parameter Robustness',
        caption: 'If a strategy works only on EMA=17 and collapses on EMA=15 or 20, it memorized past noise rather than a real edge.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Overfitting vs robustness diagram">
            <rect x="24" y="24" width="374" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="211" y="56" textAnchor="middle" fill={BEAR} className="text-[14px] font-bold">Fragile Overfit Spike</text>
            <polyline points="60,248 164,244 211,88 256,246 360,248" fill="none" stroke={BEAR} strokeWidth="3.5" />
            <text x="211" y="276" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Sharp isolated peak collapses live</text>

            <rect x="422" y="24" width="374" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="609" y="56" textAnchor="middle" fill={BULL} className="text-[14px] font-bold">Robust Parameter Plateau</text>
            <path d="M460 248 Q510 112 609 112 Q708 112 758 248" fill="none" stroke={BULL} strokeWidth="3.5" />
            <text x="609" y="276" textAnchor="middle" className={`${MUTED} text-[11.5px]`}>Stable positive expectancy across neighbor inputs</text>
          </svg>
        ),
      };

    case 'monte-carlo-drawdown':
      return {
        title: 'Monte Carlo Resampling: Expecting Worst-Case Losing Streaks',
        caption: 'Random trade ordering creates severe losing streaks even with positive expectancy; size risk for 95th-percentile drawdowns.',
        svg: (
          <svg viewBox="0 0 820 320" className={SVG_BASE} role="img" aria-label="Monte Carlo equity simulation paths">
            <rect x="24" y="24" width="772" height="272" rx="12" className={CARD} strokeWidth="1.5" />
            <text x="410" y="54" textAnchor="middle" className={`${TXT} text-[14px] font-bold`}>1,000 Shuffled Equity Sequences (Illustrative Simulation)</text>
            <polyline points="72,216 180,192 280,152 380,126 490,104 620,76 748,58" fill="none" stroke={BULL} strokeWidth="3" />
            <polyline points="72,216 180,198 280,180 380,162 490,148 620,124 748,108" fill="none" className="stroke-sky-600" strokeWidth="2.5" />
            <polyline points="72,216 180,236 280,262 380,224 490,248 620,206 748,176" fill="none" stroke={BEAR} strokeWidth="3" strokeDasharray="5 3" />
            <text x="515" y="268" textAnchor="middle" fill={BEAR} className="text-[12px] font-bold">95th-Percentile Stress Path (Size Risk to Survive Here)</text>
          </svg>
        ),
      };

    default:
      return null;
  }
}
