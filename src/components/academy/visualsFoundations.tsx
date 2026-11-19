import React from 'react';

export interface VisualDiagramResult {
  title: string;
  caption: string;
  svg: React.ReactNode;
}

const SVG_BASE = 'w-full h-auto block select-none';
const CARD_FILL = 'fill-slate-50 dark:fill-slate-900/70 stroke-slate-200 dark:stroke-slate-700';
const TXT_MAIN = 'fill-slate-900 dark:fill-slate-100';
const TXT_MUTED = 'fill-slate-500 dark:fill-slate-400';

export function renderFoundationVisual(key: string): VisualDiagramResult | null {
  switch (key) {
    case 'forex-ecosystem':
      return {
        title: 'Decentralized OTC FX Liquidity Hierarchy',
        caption: 'Unlike centralized stock exchanges, spot FX operates as a tiered global OTC dealer and ECN network.',
        svg: (
          <svg viewBox="0 0 820 360" className={SVG_BASE} role="img" aria-label="Decentralized FX liquidity hierarchy">
            <rect x="24" y="22" width="772" height="72" rx="10" className={CARD_FILL} strokeWidth="1.5" />
            <text x="410" y="52" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[15px] font-bold">
              Tier 1 Interbank Liquidity Providers (Global Money-Center Banks)
            </text>
            <text x="410" y="75" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>
              Bilateral credit lines, FX prime brokerage, and core interdealer matching (EBS / Refinitiv)
            </text>

            <path d="M410 94 L410 128" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="90" y="128" width="640" height="72" rx="10" className={CARD_FILL} strokeWidth="1.5" />
            <text x="410" y="158" textAnchor="middle" className={`${TXT_MAIN} text-[14px] font-bold`}>
              Non-Bank Market Makers, ECNs, Corporate Hedgers & Asset Managers
            </text>
            <text x="410" y="181" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>
              Aggregate multi-bank quotes, provide electronic depth, and settle cross-border flows
            </text>

            <path d="M250 200 L250 238 M570 200 L570 238" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="44" y="238" width="350" height="94" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="219" y="270" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[14px] font-bold">
              Regulated Retail Broker / Counterparty
            </text>
            <text x="219" y="293" textAnchor="middle" className={`${TXT_MUTED} text-[11.5px]`}>
              Passes or internalizes flow, quotes Bid/Ask + spread
            </text>
            <text x="219" y="313" textAnchor="middle" className={`${TXT_MUTED} text-[11.5px]`}>
              Margin rules governed by CFTC / FCA / ASIC / CySEC
            </text>

            <rect x="426" y="238" width="350" height="94" rx="10" className={CARD_FILL} strokeWidth="1.5" />
            <text x="601" y="270" textAnchor="middle" className={`${TXT_MAIN} text-[14px] font-bold`}>
              Individual Trader Execution Terminal
            </text>
            <text x="601" y="293" textAnchor="middle" className={`${TXT_MUTED} text-[11.5px]`}>
              Places Market, Limit & Stop orders in lot units
            </text>
            <text x="601" y="313" textAnchor="middle" className={`${TXT_MUTED} text-[11.5px]`}>
              24h×5d trading from Sydney open to NY close
            </text>
          </svg>
        ),
      };

    case 'fx-participants':
      return {
        title: 'Who Participates in Currency Markets & Why',
        caption: 'Speculators are only one slice of FX turnover; commercial hedging, reserves, and tourism move huge daily volumes.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="FX market participants diagram">
            {[
              { x: 24, y: 24, t: 'Central Banks & Sovereigns', d: 'Manage policy rates, reserves, & FX stability', tag: 'Policy Anchors' },
              { x: 422, y: 24, t: 'Global Multinationals', d: 'Hedge export invoices & supply-chain FX exposure', tag: 'Non-Speculative Flow' },
              { x: 24, y: 128, t: 'Commercial & Investment Banks', d: 'Make continuous two-way Bid/Ask quotes', tag: 'Liquidity Core' },
              { x: 422, y: 128, t: 'Pension & Institutional Funds', d: 'Rebalance international equity & bond allocations', tag: 'Portfolio Hedging' },
              { x: 24, y: 232, t: 'Speculative Hedge & Macro Funds', d: 'Express directional rate & macro views', tag: 'Price Discovery' },
              { x: 422, y: 232, t: 'Retail Traders & Platforms', d: 'Small leveraged accounts via regulated brokers', tag: 'Marginal Share' },
            ].map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width="374" height="84" rx="10" className={CARD_FILL} strokeWidth="1.5" />
                <text x={b.x + 18} y={b.y + 30} className={`${TXT_MAIN} text-[14px] font-bold`}>{b.t}</text>
                <text x={b.x + 18} y={b.y + 52} className={`${TXT_MUTED} text-[12px]`}>{b.d}</text>
                <text x={b.x + 18} y={b.y + 71} className="fill-[#881337] dark:fill-rose-400 text-[11px] font-semibold font-mono">{b.tag}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'currency-quote-anatomy':
      return {
        title: 'Currency Pair Quote Anatomy (EUR / USD = 1.08452)',
        caption: 'One unit of the Base currency (left) is priced in units of the Quote currency (right).',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Currency pair quote anatomy">
            <rect x="60" y="34" width="210" height="100" rx="12" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-[#881337]/40" strokeWidth="1.5" />
            <text x="165" y="78" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[30px] font-bold font-mono">EUR</text>
            <text x="165" y="106" textAnchor="middle" className={`${TXT_MAIN} text-[13px] font-semibold`}>Base Currency (1.00 Unit)</text>

            <text x="295" y="92" textAnchor="middle" className={`${TXT_MUTED} text-[28px] font-mono`}>/</text>

            <rect x="320" y="34" width="210" height="100" rx="12" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="425" y="78" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[30px] font-bold font-mono">USD</text>
            <text x="425" y="106" textAnchor="middle" className={`${TXT_MAIN} text-[13px] font-semibold`}>Quote / Counter Currency</text>

            <text x="556" y="92" textAnchor="middle" className={`${TXT_MUTED} text-[28px] font-mono`}>=</text>

            <rect x="580" y="34" width="180" height="100" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="670" y="80" textAnchor="middle" className={`${TXT_MAIN} text-[26px] font-bold font-mono`}>1.0845<tspan className="fill-[#881337] dark:fill-rose-400">2</tspan></text>
            <text x="670" y="106" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Exchange Rate</text>

            <rect x="60" y="168" width="700" height="140" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="410" y="200" textAnchor="middle" className={`${TXT_MAIN} text-[14px] font-bold`}>Reading Price Direction</text>
            <text x="90" y="232" className="fill-[#15803D] dark:fill-emerald-400 text-[13px] font-semibold">BUY EUR/USD (Long):</text>
            <text x="255" y="232" className={`${TXT_MUTED} text-[13px]`}>Profits if EUR strengthens vs USD (rate rises 1.0845 → 1.0920)</text>
            <text x="90" y="264" className="fill-[#9F1239] dark:fill-rose-400 text-[13px] font-semibold">SELL EUR/USD (Short):</text>
            <text x="255" y="264" className={`${TXT_MUTED} text-[13px]`}>Profits if EUR weakens vs USD (rate falls 1.0845 → 1.0770)</text>
            <text x="90" y="292" className={`${TXT_MUTED} text-[11.5px] font-mono`}>5th decimal ("2") = Pipette (0.1 pip) · 4th decimal ("5") = 1 Full Pip (0.0001)</text>
          </svg>
        ),
      };

    case 'bid-ask-spread':
      return {
        title: 'Bid, Ask & Spread Mechanics (Simulated Quote)',
        caption: 'Buy orders fill at the higher Ask price; Sell orders fill at the lower Bid price. Spread is an immediate negative P&L at entry.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Bid Ask Spread diagram">
            <rect x="44" y="42" width="320" height="140" rx="12" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="204" y="76" textAnchor="middle" className="fill-[#9F1239] dark:fill-rose-400 text-[13px] font-bold">BID PRICE (Sell Execution)</text>
            <text x="204" y="122" textAnchor="middle" className={`${TXT_MAIN} text-[34px] font-bold font-mono`}>1.08400</text>
            <text x="204" y="156" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Broker buys Base from you here</text>

            <rect x="456" y="42" width="320" height="140" rx="12" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="616" y="76" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[13px] font-bold">ASK PRICE (Buy Execution)</text>
            <text x="616" y="122" textAnchor="middle" className={`${TXT_MAIN} text-[34px] font-bold font-mono`}>1.08414</text>
            <text x="616" y="156" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Broker sells Base to you here</text>

            <path d="M364 112 L456 112" stroke="#881337" strokeWidth="2.5" />
            <rect x="366" y="88" width="88" height="26" rx="6" className="fill-[#881337]" />
            <text x="410" y="105" textAnchor="middle" className="fill-white text-[11.5px] font-mono font-bold">1.4 Pips</text>

            <rect x="44" y="210" width="732" height="100" rx="10" className={CARD_FILL} strokeWidth="1.5" />
            <text x="68" y="242" className={`${TXT_MAIN} text-[13px] font-bold`}>Execution Cost Impact at Entry (1.00 Standard Lot EUR/USD):</text>
            <text x="68" y="268" className={`${TXT_MUTED} text-[12.5px]`}>• 1.4 pip spread × $10/pip = -$14.00 unrealized open cost immediately upon clicking Buy or Sell.</text>
            <text x="68" y="292" className={`${TXT_MUTED} text-[12.5px]`}>• During rollover (22:00 UTC) or major CPI news, spreads can widen temporarily by 3x–10x.</text>
          </svg>
        ),
      };

    case 'pip-lot-diagram':
      return {
        title: 'Standard, Mini & Micro Lot Scaling (USD-Quoted Pairs)',
        caption: 'Position sizing translates stop-loss pips into exact dollar risk using lot increments.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Standard mini micro lot comparison">
            {[
              { x: 30, title: '1.00 Standard Lot', units: '100,000 units', pip: '$10.00 / pip', ex: '20-pip stop = $200 risk', barW: 210 },
              { x: 295, title: '0.10 Mini Lot', units: '10,000 units', pip: '$1.00 / pip', ex: '20-pip stop = $20 risk', barW: 90 },
              { x: 560, title: '0.01 Micro Lot', units: '1,000 units', pip: '$0.10 / pip', ex: '20-pip stop = $2 risk', barW: 32 },
            ].map((l, idx) => (
              <g key={idx}>
                <rect x={l.x} y="30" width="230" height="220" rx="12" className={CARD_FILL} strokeWidth="1.5" />
                <text x={l.x + 115} y="66" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[15px] font-bold">{l.title}</text>
                <text x={l.x + 115} y="92" textAnchor="middle" className={`${TXT_MUTED} text-[12px] font-mono`}>{l.units}</text>
                <text x={l.x + 115} y="138" textAnchor="middle" className={`${TXT_MAIN} text-[22px] font-bold font-mono`}>{l.pip}</text>
                <rect x={l.x + 16} y="164" width="198" height="10" rx="5" className="fill-slate-200 dark:fill-slate-800" />
                <rect x={l.x + 16} y="164" width={l.barW * 0.9} height="10" rx="5" className="fill-[#15803D]" />
                <text x={l.x + 115} y="210" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>{l.ex}</text>
              </g>
            ))}
            <rect x="30" y="268" width="760" height="46" rx="8" className={CARD_FILL} strokeWidth="1" />
            <text x="410" y="296" textAnchor="middle" className={`${TXT_MAIN} text-[12.5px] font-mono`}>
              Formula: Lot Size = Risk Dollars ÷ (Stop-Loss Pips × $10)  |  Example: $50 ÷ (25 pips × $10) = 0.20 Lots
            </text>
          </svg>
        ),
      };

    case 'order-types-diagram':
      return {
        title: 'Market, Limit & Stop Orders Relative to Current Price',
        caption: 'Choose Limit orders for pullback price improvement and Stop orders for breakout confirmation or stop-loss protection.',
        svg: (
          <svg viewBox="0 0 820 350" className={SVG_BASE} role="img" aria-label="Forex order types diagram">
            <line x1="60" y1="175" x2="760" y2="175" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" strokeDasharray="6 4" />
            <rect x="320" y="159" width="180" height="32" rx="6" className="fill-slate-900 dark:fill-slate-100" />
            <text x="410" y="180" textAnchor="middle" className="fill-white dark:fill-slate-900 text-[12px] font-mono font-bold">Current Market: 1.1000</text>

            {/* Above Market */}
            <rect x="44" y="34" width="340" height="104" rx="10" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="214" y="64" textAnchor="middle" className="fill-[#9F1239] dark:fill-rose-400 text-[14px] font-bold">SELL LIMIT (Above Market @ 1.1050)</text>
            <text x="214" y="88" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Sell into rally at resistance (or better)</text>
            <text x="214" y="112" textAnchor="middle" className={`${TXT_MUTED} text-[11px] font-mono`}>Price climbs ↑ fills Limit → expects reversal ↓</text>

            <rect x="436" y="34" width="340" height="104" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="606" y="64" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[14px] font-bold">BUY STOP (Above Market @ 1.1050)</text>
            <text x="606" y="88" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Buy upside breakout continuation above high</text>
            <text x="606" y="112" textAnchor="middle" className={`${TXT_MUTED} text-[11px] font-mono`}>Also acts as Stop-Loss for open Short positions</text>

            {/* Below Market */}
            <rect x="44" y="212" width="340" height="104" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" strokeWidth="1.5" />
            <text x="214" y="242" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[14px] font-bold">BUY LIMIT (Below Market @ 1.0950)</text>
            <text x="214" y="266" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Buy pullback dip at support (or lower)</text>
            <text x="214" y="290" textAnchor="middle" className={`${TXT_MUTED} text-[11px] font-mono`}>Price dips ↓ fills Limit → expects bounce ↑</text>

            <rect x="436" y="212" width="340" height="104" rx="10" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" strokeWidth="1.5" />
            <text x="606" y="242" textAnchor="middle" className="fill-[#9F1239] dark:fill-rose-400 text-[14px] font-bold">SELL STOP (Below Market @ 1.0950)</text>
            <text x="606" y="266" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>Sell downside breakdown below support</text>
            <text x="606" y="290" textAnchor="middle" className={`${TXT_MUTED} text-[11px] font-mono`}>Also acts as Stop-Loss for open Long positions</text>
          </svg>
        ),
      };

    case 'margin-leverage-diagram':
      return {
        title: 'Margin Anatomy, Free Margin & Stop-Out Risk',
        caption: 'Max broker leverage (e.g. 50:1) is not a mandate—only effective leverage (Position Notional ÷ Equity) determines ruin risk.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Margin and leverage diagram">
            <rect x="34" y="34" width="752" height="110" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="60" y="64" className={`${TXT_MAIN} text-[14px] font-bold`}>Account Equity ($2,000) Split While Holding 0.50 Lots EUR/USD ($50,000 Notional @ 50:1)</text>
            <rect x="60" y="84" width="350" height="32" rx="6" className="fill-[#881337]" />
            <text x="235" y="105" textAnchor="middle" className="fill-white text-[12px] font-mono font-bold">Used Margin: $1,000 (Locked)</text>
            <rect x="414" y="84" width="346" height="32" rx="6" className="fill-[#15803D]" />
            <text x="587" y="105" textAnchor="middle" className="fill-white text-[12px] font-mono font-bold">Free Margin: $1,000 (Buffer)</text>

            <rect x="34" y="168" width="366" height="136" rx="10" className={CARD_FILL} strokeWidth="1.5" />
            <text x="56" y="198" className={`${TXT_MAIN} text-[14px] font-bold`}>Key Ratios</text>
            <text x="56" y="226" className={`${TXT_MUTED} text-[12.5px] font-mono`}>Effective Leverage = $50,000 ÷ $2,000 = 25:1</text>
            <text x="56" y="252" className={`${TXT_MUTED} text-[12.5px] font-mono`}>Margin Level = ($2,000 ÷ $1,000) × 100 = 200%</text>
            <text x="56" y="278" className="fill-[#9F1239] dark:fill-rose-400 text-[12px] font-semibold">Stop-Out (e.g. 50%): Broker force-closes losing trades</text>

            <rect x="420" y="168" width="366" height="136" rx="10" className="fill-amber-50/70 dark:fill-amber-950/20 stroke-amber-500/40" strokeWidth="1.5" />
            <text x="442" y="198" className="fill-amber-700 dark:fill-amber-400 text-[14px] font-bold">Why Over-Leveraging Fails</text>
            <text x="442" y="226" className={`${TXT_MUTED} text-[12.5px]`}>• At 25:1 effective leverage, just a 4% adverse move wipes equity.</text>
            <text x="442" y="252" className={`${TXT_MUTED} text-[12.5px]`}>• Institutional managers often cap portfolio leverage below 3:1–5:1.</text>
            <text x="442" y="278" className={`${TXT_MUTED} text-[12.5px]`}>• Always define Stop-Loss BEFORE calculating position size.</text>
          </svg>
        ),
      };

    case 'trading-sessions-timeline':
      return {
        title: '24-Hour Global FX Sessions (UTC Timeline)',
        caption: 'Liquidity, spread tightness, and breakout follow-through peak during the London–New York overlap (13:00–17:00 UTC).',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="24-hour trading sessions timeline in UTC">
            <line x1="60" y1="255" x2="770" y2="255" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => {
              const x = 60 + (h / 24) * 710;
              return (
                <g key={h}>
                  <line x1={x} y1="40" x2={x} y2="262" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <text x={x} y="280" textAnchor="middle" className={`${TXT_MUTED} text-[11px] font-mono`}>{String(h).padStart(2, '0')}:00</text>
                </g>
              );
            })}

            {/* Highlight Overlap */}
            <rect x={60 + (13 / 24) * 710} y="36" width={(4 / 24) * 710} height="220" className="fill-emerald-500/15 stroke-emerald-600/40" strokeDasharray="3 3" />
            <text x={60 + (15 / 24) * 710} y="54" textAnchor="middle" className="fill-[#15803D] dark:fill-emerald-400 text-[11px] font-bold">LDN–NY Overlap</text>

            {/* Sydney */}
            <rect x="60" y="72" width={(8 / 24) * 710} height="34" rx="6" className="fill-slate-600/80" />
            <text x="155" y="94" textAnchor="middle" className="fill-white text-[12px] font-semibold">Sydney (22:00–07:00)</text>

            {/* Tokyo */}
            <rect x="60" y="114" width={(9 / 24) * 710} height="34" rx="6" className="fill-sky-700" />
            <text x="180" y="136" textAnchor="middle" className="fill-white text-[12px] font-semibold">Tokyo / Asia (00:00–09:00)</text>

            {/* London */}
            <rect x={60 + (8 / 24) * 710} y="156" width={(9 / 24) * 710} height="34" rx="6" className="fill-[#881337]" />
            <text x={60 + (12.5 / 24) * 710} y="178" textAnchor="middle" className="fill-white text-[12px] font-semibold">London (08:00–17:00)</text>

            {/* New York */}
            <rect x={60 + (13 / 24) * 710} y="198" width={(9 / 24) * 710} height="34" rx="6" className="fill-[#15803D]" />
            <text x={60 + (17.5 / 24) * 710} y="220" textAnchor="middle" className="fill-white text-[12px] font-semibold">New York (13:00–22:00)</text>

            <text x="410" y="310" textAnchor="middle" className={`${TXT_MUTED} text-[11.5px]`}>
              Note: 21:00–23:00 UTC rollover hour exhibits thinner liquidity and wider spreads. Times shift ±1h during DST changes.
            </text>
          </svg>
        ),
      };

    case 'broker-due-diligence':
      return {
        title: 'Broker Verification & Counterparty Safety Checklist',
        caption: 'Verify primary regulatory licenses directly on official national registries—never rely on website footer logos.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Broker verification checklist">
            {[
              { x: 24, y: 28, n: '01', t: 'Tier-1 Licensing Check', d: 'Cross-check firm ID on FCA, CFTC/NFA BASIC, ASIC, or BaFin.' },
              { x: 422, y: 28, n: '02', t: 'Segregated Client Accounts', d: 'Client deposits separated from broker operating expenses.' },
              { x: 24, y: 132, n: '03', t: 'All-In Fee Transparency', d: 'Compare spread + commission + overnight swap charges.' },
              { x: 422, y: 132, n: '04', t: 'Negative Balance Protection', d: 'Prevents account equity from dropping below zero during gaps.' },
              { x: 24, y: 236, n: '05', t: 'Execution & Slippage Policy', d: 'Consistent limit fills without asymmetric re-quotes.' },
              { x: 422, y: 236, n: '06', t: 'Red-Flag Warning Signs', d: 'Avoid guaranteed returns, bonus traps, or blocked withdrawals.' },
            ].map((item) => (
              <g key={item.n}>
                <rect x={item.x} y={item.y} width="374" height="84" rx="10" className={CARD_FILL} strokeWidth="1.5" />
                <text x={item.x + 20} y={item.y + 34} className="fill-[#881337] dark:fill-rose-400 text-[16px] font-bold font-mono">{item.n}</text>
                <text x={item.x + 54} y={item.y + 33} className={`${TXT_MAIN} text-[14px] font-bold`}>{item.t}</text>
                <text x={item.x + 20} y={item.y + 60} className={`${TXT_MUTED} text-[12px]`}>{item.d}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'order-ticket-mockup':
      return {
        title: 'Anatomy of a Safe Pre-Trade Order Ticket (Simulated)',
        caption: 'Verify symbol, lot size, protective Stop-Loss, Take-Profit, and total dollar risk before confirming.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Order ticket workflow diagram">
            <rect x="80" y="24" width="660" height="292" rx="14" className={CARD_FILL} strokeWidth="1.5" />
            <text x="112" y="60" className={`${TXT_MAIN} text-[16px] font-bold font-mono`}>ORDER TICKET · EUR/USD · SIMULATED EXAMPLE</text>
            <line x1="112" y1="74" x2="708" y2="74" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

            <rect x="112" y="92" width="180" height="56" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="128" y="114" className={`${TXT_MUTED} text-[11px]`}>Order Type</text>
            <text x="128" y="136" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>Buy Limit @ 1.0840</text>

            <rect x="312" y="92" width="180" height="56" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="328" y="114" className={`${TXT_MUTED} text-[11px]`}>Calculated Size</text>
            <text x="328" y="136" className="fill-[#881337] dark:fill-rose-400 text-[14px] font-mono font-bold">0.25 Lots (25k)</text>

            <rect x="512" y="92" width="196" height="56" rx="8" className="fill-white dark:fill-slate-950 stroke-slate-300 dark:stroke-slate-700" />
            <text x="528" y="114" className={`${TXT_MUTED} text-[11px]`}>Max Capital Risk</text>
            <text x="528" y="136" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>$50.00 (1.0% Equity)</text>

            <rect x="112" y="168" width="286" height="58" rx="8" className="fill-rose-50/70 dark:fill-rose-950/20 stroke-rose-600/40" />
            <text x="128" y="191" className="fill-[#9F1239] dark:fill-rose-400 text-[11px] font-bold">MANDATORY STOP-LOSS</text>
            <text x="128" y="213" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>1.0820 (-20 pips = -$50.00)</text>

            <rect x="422" y="168" width="286" height="58" rx="8" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-600/40" />
            <text x="438" y="191" className="fill-[#15803D] dark:fill-emerald-400 text-[11px] font-bold">TAKE-PROFIT TARGET</text>
            <text x="438" y="213" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>1.0890 (+50 pips = +$125 · 1:2.5 R:R)</text>

            <rect x="112" y="246" width="596" height="46" rx="8" className="fill-[#15803D]" />
            <text x="410" y="274" textAnchor="middle" className="fill-white text-[13px] font-semibold">
              Pre-Flight Verified: Invalidation Defined · Size Calculated · No Overlapping USD Duplicate Risk
            </text>
          </svg>
        ),
      };

    case 'pair-categories-matrix':
      return {
        title: 'Major, Minor (Cross) & Exotic Pair Characteristics',
        caption: 'Pair selection directly impacts spread cost, intraday volatility, and overnight slippage risk.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Major Minor Exotic pairs matrix">
            {[
              {
                x: 24,
                head: 'Major Pairs',
                sub: 'Includes USD + G7 FX',
                examples: 'EURUSD · USDJPY · GBPUSD · USDCHF',
                p1: 'Highest daily turnover',
                p2: 'Tightest spreads (0.1–1.2 pips)',
                p3: 'Best execution for beginners',
                accent: 'fill-[#15803D] dark:fill-emerald-400',
              },
              {
                x: 292,
                head: 'Minor / Cross Pairs',
                sub: 'Major Currencies, No USD',
                examples: 'EURGBP · EURJPY · GBPJPY · AUDNZD',
                p1: 'Reflects regional rate divergence',
                p2: 'Moderate spreads (1.2–3.0 pips)',
                p3: 'Pip values require cross conversion',
                accent: 'fill-[#881337] dark:fill-rose-400',
              },
              {
                x: 560,
                head: 'Exotic Pairs',
                sub: 'Major + Emerging Economy',
                examples: 'USDTRY · USDZAR · USDMXN · USDSEK',
                p1: 'Lower order-book depth',
                p2: 'Wide spreads & sharp gaps',
                p3: 'Requires smaller position sizing',
                accent: 'fill-amber-600 dark:fill-amber-400',
              },
            ].map((col) => (
              <g key={col.head}>
                <rect x={col.x} y="24" width="236" height="292" rx="12" className={CARD_FILL} strokeWidth="1.5" />
                <text x={col.x + 118} y="60" textAnchor="middle" className={`${col.accent} text-[16px] font-bold`}>{col.head}</text>
                <text x={col.x + 118} y="82" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>{col.sub}</text>
                <line x1={col.x + 20} y1="100" x2={col.x + 216} y2="100" className="stroke-slate-200 dark:stroke-slate-700" />
                <text x={col.x + 118} y="128" textAnchor="middle" className={`${TXT_MAIN} text-[11px] font-mono font-bold`}>{col.examples}</text>
                <text x={col.x + 20} y="176" className={`${TXT_MUTED} text-[12px]`}>• {col.p1}</text>
                <text x={col.x + 20} y="216" className={`${TXT_MUTED} text-[12px]`}>• {col.p2}</text>
                <text x={col.x + 20} y="256" className={`${TXT_MUTED} text-[12px]`}>• {col.p3}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'currency-strength-bars':
      return {
        title: 'Relative Strength Pairing: Strongest vs Weakest Currency',
        caption: 'Pairs trend cleanest when pairing a fundamentally strong currency against a lagging currency.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Currency relative strength bars">
            <rect x="30" y="24" width="760" height="282" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="60" y="58" className={`${TXT_MAIN} text-[14px] font-bold`}>Illustrative G8 Relative Strength Snapshot (Simulated)</text>
            {[
              { c: 'USD', v: 82, w: 320, pos: true },
              { c: 'GBP', v: 64, w: 230, pos: true },
              { c: 'EUR', v: 32, w: 120, pos: true },
              { c: 'AUD', v: -28, w: 105, pos: false },
              { c: 'JPY', v: -76, w: 295, pos: false },
            ].map((row, idx) => {
              const y = 84 + idx * 38;
              return (
                <g key={row.c}>
                  <text x="64" y={y + 18} className={`${TXT_MAIN} text-[13px] font-mono font-bold`}>{row.c}</text>
                  <line x1="410" y1={y} x2="410" y2={y + 26} className="stroke-slate-300 dark:stroke-slate-700" />
                  <rect
                    x={row.pos ? 412 : 408 - row.w}
                    y={y + 3}
                    width={row.w}
                    height="20"
                    rx="4"
                    className={row.pos ? 'fill-[#15803D]' : 'fill-[#9F1239]'}
                  />
                  <text x={row.pos ? 412 + row.w + 10 : 408 - row.w - 42} y={y + 18} className={`${TXT_MUTED} text-[12px] font-mono`}>
                    {row.pos ? `+${row.v}` : row.v}
                  </text>
                </g>
              );
            })}
            <text x="410" y="290" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12.5px] font-semibold">
              Insight: Strong USD (+82) vs Weak JPY (-76) produces cleaner directional trend in USD/JPY than flat EUR vs GBP.
            </text>
          </svg>
        ),
      };

    case 'direct-indirect-quotes':
      return {
        title: 'Direct vs Indirect Quotes & Cross-Rate Synthesis',
        caption: 'Non-USD crosses (e.g. EUR/JPY) derive their fair value mathematically from the two USD legs.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Direct indirect quotes and cross rates">
            <rect x="40" y="34" width="350" height="120" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="64" y="68" className="fill-[#15803D] dark:fill-emerald-400 text-[14px] font-bold">USD as Quote Currency</text>
            <text x="64" y="96" className={`${TXT_MAIN} text-[13px] font-mono`}>EUR/USD · GBP/USD · AUD/USD</text>
            <text x="64" y="124" className={`${TXT_MUTED} text-[12px]`}>Pip value fixed in USD ($10 / std lot on USD account)</text>

            <rect x="430" y="34" width="350" height="120" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="454" y="68" className="fill-[#881337] dark:fill-rose-400 text-[14px] font-bold">USD as Base Currency</text>
            <text x="454" y="96" className={`${TXT_MAIN} text-[13px] font-mono`}>USD/JPY · USD/CHF · USD/CAD</text>
            <text x="454" y="124" className={`${TXT_MUTED} text-[12px]`}>USD pip value fluctuates slightly with exchange rate</text>

            <rect x="40" y="182" width="740" height="114" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="410" y="216" textAnchor="middle" className={`${TXT_MAIN} text-[14px] font-bold`}>Synthetic Cross-Rate Identity</text>
            <text x="410" y="250" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[16px] font-mono font-bold">
              EUR/JPY = EUR/USD × USD/JPY  |  EUR/GBP = EUR/USD ÷ GBP/USD
            </text>
            <text x="410" y="278" textAnchor="middle" className={`${TXT_MUTED} text-[12px]`}>
              Example: 1.0850 × 154.00 = 167.09 synthetic EUR/JPY price
            </text>
          </svg>
        ),
      };

    case 'pip-conversion-formula':
      return {
        title: 'Dynamic Pip Value Conversion Across Quote Currencies',
        caption: 'When the quote currency differs from your account currency, pip value scales by the exchange rate.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Pip conversion formula diagram">
            <rect x="34" y="28" width="752" height="274" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="410" y="66" textAnchor="middle" className={`${TXT_MAIN} text-[15px] font-bold`}>
              Universal Pip Value Formula (1.00 Standard Lot = 100,000 Units)
            </text>
            <rect x="90" y="88" width="640" height="54" rx="8" className="fill-[#881337]" />
            <text x="410" y="121" textAnchor="middle" className="fill-white text-[15px] font-mono font-bold">
              Pip Value ($) = (One Pip ÷ Pair Quote-to-USD Rate) × Position Units
            </text>

            <rect x="70" y="168" width="320" height="108" rx="10" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
            <text x="90" y="198" className="fill-[#15803D] dark:fill-emerald-400 text-[13px] font-bold">Example A: USD/JPY @ 150.00</text>
            <text x="90" y="224" className={`${TXT_MUTED} text-[12px] font-mono`}>(0.01 ÷ 150.00) × 100,000</text>
            <text x="90" y="250" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>= $6.67 per pip (not $10!)</text>

            <rect x="430" y="168" width="320" height="108" rx="10" className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-700" />
            <text x="450" y="198" className="fill-[#881337] dark:fill-rose-400 text-[13px] font-bold">Example B: EUR/GBP @ 0.8550 (GBP/USD 1.27)</text>
            <text x="450" y="224" className={`${TXT_MUTED} text-[12px] font-mono`}>£10 per pip × 1.2700</text>
            <text x="450" y="250" className={`${TXT_MAIN} text-[14px] font-mono font-bold`}>= $12.70 per pip</text>
          </svg>
        ),
      };

    case 'pair-cost-comparison':
      return {
        title: 'Spread Cost vs Daily Range Ratio (Cost Drag Analysis)',
        caption: 'Tight stops on wide-spread exotic pairs suffer disproportionate transaction cost drag.',
        svg: (
          <svg viewBox="0 0 820 330" className={SVG_BASE} role="img" aria-label="Pair spread cost comparison chart">
            <rect x="30" y="24" width="760" height="282" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="60" y="58" className={`${TXT_MAIN} text-[14px] font-bold`}>Illustrative Spread as % of 20-Pip Scalp Target</text>
            {[
              { pair: 'EUR/USD (Major)', spr: '0.8 pips spread', pct: '4.0% cost drag', w: 48, c: 'fill-[#15803D]' },
              { pair: 'GBP/JPY (Cross)', spr: '2.2 pips spread', pct: '11.0% cost drag', w: 132, c: 'fill-amber-500' },
              { pair: 'USD/ZAR (Exotic)', spr: '14.0 pips spread', pct: '70.0% cost drag', w: 390, c: 'fill-[#9F1239]' },
            ].map((r, i) => {
              const y = 90 + i * 64;
              return (
                <g key={r.pair}>
                  <text x="60" y={y + 18} className={`${TXT_MAIN} text-[13px] font-bold font-mono`}>{r.pair}</text>
                  <text x="60" y={y + 38} className={`${TXT_MUTED} text-[11.5px]`}>{r.spr}</text>
                  <rect x="260" y={y + 8} width="420" height="22" rx="5" className="fill-slate-200 dark:fill-slate-800" />
                  <rect x="260" y={y + 8} width={r.w} height="22" rx="5" className={r.c} />
                  <text x={270 + r.w} y={y + 24} className={`${TXT_MAIN} text-[12px] font-mono font-semibold`}>{r.pct}</text>
                </g>
              );
            })}
          </svg>
        ),
      };

    case 'correlation-matrix':
      return {
        title: 'Currency Pair Correlation Matrix (Illustrative Structure)',
        caption: 'Simultaneous trades in positively or negatively correlated pairs stack directional exposure.',
        svg: (
          <svg viewBox="0 0 820 340" className={SVG_BASE} role="img" aria-label="Currency correlation matrix diagram">
            <rect x="34" y="24" width="752" height="292" rx="12" className={CARD_FILL} strokeWidth="1.5" />
            <text x="64" y="58" className={`${TXT_MAIN} text-[14px] font-bold`}>Correlation Coefficients (-1.00 Inverse to +1.00 Tandem)</text>
            {[
              ['Pair Matrix', 'EUR/USD', 'GBP/USD', 'USD/CHF', 'USD/JPY'],
              ['EUR/USD', '+1.00', '+0.85', '-0.92', '-0.48'],
              ['GBP/USD', '+0.85', '+1.00', '-0.79', '-0.41'],
              ['USD/CHF', '-0.92', '-0.79', '+1.00', '+0.52'],
              ['USD/JPY', '-0.48', '-0.41', '+0.52', '+1.00'],
            ].map((row, rIdx) => (
              <g key={rIdx}>
                {row.map((cell, cIdx) => {
                  const x = 64 + cIdx * 138;
                  const y = 78 + rIdx * 40;
                  const isPos = cell.startsWith('+0.8') || cell === '+1.00';
                  const isNeg = cell.startsWith('-0.9') || cell.startsWith('-0.7');
                  return (
                    <g key={cIdx}>
                      <rect
                        x={x}
                        y={y}
                        width="132"
                        height="34"
                        rx="6"
                        className={
                          rIdx === 0 || cIdx === 0
                            ? 'fill-slate-200 dark:fill-slate-800'
                            : isPos
                            ? 'fill-emerald-100 dark:fill-emerald-950/50'
                            : isNeg
                            ? 'fill-rose-100 dark:fill-rose-950/50'
                            : 'fill-white dark:fill-slate-950'
                        }
                      />
                      <text
                        x={x + 66}
                        y={y + 22}
                        textAnchor="middle"
                        className={`${
                          rIdx === 0 || cIdx === 0 ? `${TXT_MAIN} font-bold` : TXT_MAIN
                        } text-[12px] font-mono`}
                      >
                        {cell}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
            <text x="410" y="298" textAnchor="middle" className="fill-[#881337] dark:fill-rose-400 text-[12px] font-semibold">
              Buying EUR/USD + Selling USD/CHF simultaneously duplicates USD-short risk (~1.9x).
            </text>
          </svg>
        ),
      };

    default:
      return null;
  }
}
