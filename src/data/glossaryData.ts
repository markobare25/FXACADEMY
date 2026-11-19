export interface GlossaryEntry {
  id: string;
  term: string;
  aliases?: string[];
  category:
    | 'Foundations'
    | 'Price Action & Charting'
    | 'Indicators & Macro'
    | 'Risk & Psychology'
    | 'Gold & Crypto'
    | 'Quantitative & Portfolio';
  shortDefinition: string;
  fullExplanation: string;
  example?: string;
}

export const ACADEMY_GLOSSARY: GlossaryEntry[] = [
  {
    id: 'pip',
    term: 'Pip',
    aliases: ['pips', 'percentage in point'],
    category: 'Foundations',
    shortDefinition: 'Standard unit of price movement in FX, typically 0.0001 for non-JPY pairs and 0.01 for JPY pairs.',
    fullExplanation:
      'A pip (Percentage in Point) is the fourth decimal place in most currency quotes (EURUSD 1.0850 to 1.0851 is 1 pip) and the second decimal place in Japanese Yen quotes (USDJPY 154.20 to 154.21 is 1 pip). Fractional pricing adds a fifth (or third) decimal called a pipette.',
    example: 'On 1.00 standard lot of EURUSD, 1 pip equals $10.00.',
  },
  {
    id: 'pipette',
    term: 'Pipette',
    aliases: ['fractional pip'],
    category: 'Foundations',
    shortDefinition: 'One-tenth of a pip (the 5th decimal in EURUSD or 3rd decimal in USDJPY).',
    fullExplanation:
      'Modern electronic liquidity feeds quote prices to an extra fractional digit called a pipette so spreads can tighten below a full pip (e.g., 0.8 pips rather than 1.0 pip).',
  },
  {
    id: 'bid-ask-spread',
    term: 'Bid-Ask Spread',
    aliases: ['spread', 'bid price', 'ask price'],
    category: 'Foundations',
    shortDefinition: 'The transaction cost difference between the Ask (buy) price and the Bid (sell) price.',
    fullExplanation:
      'Market participants buy at the higher Ask price and sell at the lower Bid price. Spreads narrow during high-liquidity London/New York overlap and widen sharply around rollover or high-impact news releases.',
    example: 'If EURUSD Bid is 1.08400 and Ask is 1.08412, the spread is 1.2 pips.',
  },
  {
    id: 'lot-size',
    term: 'Lot Size',
    aliases: ['standard lot', 'mini lot', 'micro lot'],
    category: 'Foundations',
    shortDefinition: 'Standardized contract unit: Standard (100,000), Mini (10,000), or Micro (1,000) base currency units.',
    fullExplanation:
      'Position volume in Forex is expressed in lots. Choosing lot size based on stop-loss distance and fixed dollar risk keeps losses uniform across volatile and quiet pairs.',
    example: 'Risking $100 with a 25-pip stop on EURUSD requires 0.40 lots (4 mini lots).',
  },
  {
    id: 'leverage',
    term: 'Leverage',
    aliases: ['effective leverage'],
    category: 'Foundations',
    shortDefinition: 'Using borrowed margin capital to control a larger notional position than account equity.',
    fullExplanation:
      'Leverage magnifies both percentage gains and percentage losses equally. Maximum broker leverage (e.g., 30:1 or 100:1) is only a ceiling; true risk comes from your effective leverage and stop-loss distance.',
  },
  {
    id: 'margin',
    term: 'Margin',
    aliases: ['free margin', 'margin level', 'margin call', 'stop out'],
    category: 'Foundations',
    shortDefinition: 'Collateral held by a broker to keep open leveraged positions active.',
    fullExplanation:
      'Used margin is locked collateral, Free Margin is equity minus used margin, and Margin Level (%) equals (Equity / Used Margin) × 100. Dropping below broker thresholds triggers a margin call or automatic stop-out liquidation.',
  },
  {
    id: 'liquidity',
    term: 'Liquidity',
    aliases: ['market depth', 'slippage'],
    category: 'Foundations',
    shortDefinition: 'How easily size can trade near the quoted price without causing large price jumps or slippage.',
    fullExplanation:
      'Deep liquidity means tight spreads and reliable fills. Thin liquidity—common at market rollover (22:00 UTC), holidays, or central bank shocks—causes spread widening and slippage.',
  },
  {
    id: 'base-quote-currency',
    term: 'Base & Quote Currency',
    aliases: ['base currency', 'quote currency'],
    category: 'Foundations',
    shortDefinition: 'In AAA/BBB, AAA is the Base currency (1 unit) and BBB is the Quote currency pricing it.',
    fullExplanation:
      'EUR/USD = 1.0850 means 1 Euro costs 1.0850 US Dollars. Buying the pair expresses bullish bias on the Base currency relative to the Quote currency.',
  },
  {
    id: 'major-minor-exotic',
    term: 'Major, Minor & Exotic Pairs',
    aliases: ['cross pair', 'majors', 'crosses'],
    category: 'Foundations',
    shortDefinition: 'Majors include USD + G7 FX; Minors/Crosses exclude USD; Exotics pair a major with an emerging currency.',
    fullExplanation:
      'Majors (EURUSD, USDJPY, GBPUSD) deliver the highest liquidity and tightest spreads. Crosses (EURGBP, GBPJPY) skip USD, while Exotics (USDTRY, USDZAR) carry wider spreads and overnight gap risk.',
  },
  {
    id: 'currency-correlation',
    term: 'Currency Correlation',
    aliases: ['positive correlation', 'negative correlation'],
    category: 'Foundations',
    shortDefinition: 'Statistical measure (-1.0 to +1.0) of how two currency pairs move together over time.',
    fullExplanation:
      'Taking long EURUSD and long GBPUSD simultaneously often doubles USD-short exposure because both share the same USD denominator. Always measure aggregate currency exposure rather than treating correlated pairs as independent bets.',
  },
  {
    id: 'rollover-swap',
    term: 'Rollover & Swap',
    aliases: ['swap rate', 'carry trade'],
    category: 'Foundations',
    shortDefinition: 'Overnight interest credit or debit based on the interest rate differential between two currencies.',
    fullExplanation:
      'Positions held past 17:00 ET (22:00 UTC) incur or earn an overnight swap adjustment. Wednesdays typically carry triple swap (3x) to account for weekend settlement.',
  },
  {
    id: 'market-limit-stop-order',
    term: 'Market, Limit & Stop Orders',
    aliases: ['limit order', 'stop order', 'stop loss', 'take profit'],
    category: 'Foundations',
    shortDefinition: 'Execution instructions: immediate fill (Market), price improvement (Limit), or momentum/protection trigger (Stop).',
    fullExplanation:
      'Limit orders execute at your price or better; Stop orders become market orders once price crosses the trigger level, which makes them subject to slippage in fast markets.',
  },
  {
    id: 'candlestick-ohlc',
    term: 'Candlestick (OHLC)',
    aliases: ['OHLC', 'wick', 'shadow', 'real body'],
    category: 'Price Action & Charting',
    shortDefinition: 'Visual price bar showing Open, High, Low, and Close within a single timeframe interval.',
    fullExplanation:
      'The Real Body captures the distance between Open and Close, while Upper and Lower Wicks reveal intraday price rejection beyond the body.',
  },
  {
    id: 'engulfing-pattern',
    term: 'Engulfing Pattern',
    aliases: ['bullish engulfing', 'bearish engulfing'],
    category: 'Price Action & Charting',
    shortDefinition: 'Two-candle reversal formation where the second candle body completely covers the prior body.',
    fullExplanation:
      'An engulfing candle at a higher-timeframe key level signals an aggressive shift in order flow from sellers to buyers (or vice versa). Context and close confirmation matter more than the shape alone.',
  },
  {
    id: 'pin-bar-hammer',
    term: 'Pin Bar / Hammer',
    aliases: ['hammer', 'shooting star', 'doji'],
    category: 'Price Action & Charting',
    shortDefinition: 'Single candle with a long rejection wick (≥2x body) and small body near one extreme.',
    fullExplanation:
      'Long lower wicks at demand suggest buyers absorbed selling pressure; long upper wicks at resistance indicate supply rejection.',
  },
  {
    id: 'market-structure',
    term: 'Market Structure',
    aliases: ['higher highs', 'lower lows', 'uptrend', 'downtrend'],
    category: 'Price Action & Charting',
    shortDefinition: 'Sequence of swing highs and swing lows defining uptrend (HH/HL), downtrend (LH/LL), or range.',
    fullExplanation:
      'Reading swing structure objectively prevents fighting prevailing order flow and anchors stop placement behind logical invalidation swings.',
  },
  {
    id: 'bos-mss',
    term: 'Break of Structure (BOS) & MSS',
    aliases: ['BOS', 'MSS', 'CHoCH', 'market structure shift'],
    category: 'Price Action & Charting',
    shortDefinition: 'BOS confirms trend continuation past a structural swing; MSS/CHoCH signals potential trend reversal.',
    fullExplanation:
      'A decisive candle close beyond a prior swing high in an uptrend is a Break of Structure (BOS). A displacement close through the most recent protected Higher Low signals a Market Structure Shift (MSS).',
  },
  {
    id: 'support-resistance',
    term: 'Support & Resistance',
    aliases: ['support', 'resistance', 'role reversal', 'S/R flip'],
    category: 'Price Action & Charting',
    shortDefinition: 'Price zones where historical buying or selling interest repeatedly slowed or reversed price.',
    fullExplanation:
      'Support and resistance are zones rather than razor-thin lines. When cleanly broken and retested, former resistance often flips into support (Role Reversal).',
  },
  {
    id: 'supply-demand',
    term: 'Supply & Demand Zones',
    aliases: ['supply zone', 'demand zone'],
    category: 'Price Action & Charting',
    shortDefinition: 'Price origins of sharp impulsive moves where unfilled institutional limit orders may rest.',
    fullExplanation:
      'Marked from the consolidation base before an explosive departure candle. Fresh zones (first retest) tend to react more reliably than repeatedly tested zones.',
  },
  {
    id: 'trendline-channel',
    term: 'Trendline & Channel',
    aliases: ['trendline', 'parallel channel'],
    category: 'Price Action & Charting',
    shortDefinition: 'Diagonal boundary connecting at least 2–3 valid structural swings to frame slope and dynamic support.',
    fullExplanation:
      'Trendlines become actionable when paired with horizontal structure or moving averages; steep vertical trendlines usually break quickly.',
  },
  {
    id: 'fibonacci-retracement',
    term: 'Fibonacci Retracement',
    aliases: ['38.2%', '50%', '61.8%', 'golden pocket'],
    category: 'Price Action & Charting',
    shortDefinition: 'Proportional pullback grid (38.2%, 50%, 61.8%, 78.6%) drawn from impulse swing start to end.',
    fullExplanation:
      'Fibonacci ratios work best as confluence with horizontal S/R or demand zones rather than standalone mechanical triggers.',
  },
  {
    id: 'liquidity-sweep',
    term: 'Liquidity Sweep (Stop Run)',
    aliases: ['stop hunt', 'BSL', 'SSL', 'equal highs'],
    category: 'Price Action & Charting',
    shortDefinition: 'Brief price push beyond obvious highs/lows that triggers resting stop orders before snapping back.',
    fullExplanation:
      'Retail stop-losses cluster just above equal highs (buy-side liquidity) and below equal lows (sell-side liquidity). Waiting for a sweep plus displacement back inside the range helps avoid breakout traps.',
  },
  {
    id: 'fair-value-gap',
    term: 'Fair Value Gap (FVG)',
    aliases: ['FVG', 'imbalance'],
    category: 'Price Action & Charting',
    shortDefinition: 'Three-candle price inefficiency where candle 1 wick and candle 3 wick do not overlap.',
    fullExplanation:
      'Represents rapid one-sided displacement where little two-way volume traded. Price frequently rebalances partially into the gap during pullbacks.',
  },
  {
    id: 'order-block',
    term: 'Order Block (OB)',
    aliases: ['mitigation block'],
    category: 'Price Action & Charting',
    shortDefinition: 'Final opposite-colored candle prior to an impulsive move that creates a Break of Structure.',
    fullExplanation:
      'Highlights the footprint of aggressive accumulation or distribution. Most reliable when aligned with higher-timeframe bias and an adjacent imbalance.',
  },
  {
    id: 'moving-average-ema',
    term: 'SMA & EMA',
    aliases: ['EMA', 'SMA', 'exponential moving average'],
    category: 'Indicators & Macro',
    shortDefinition: 'Trend-following averages smoothing price; EMA weights recent closes more heavily than SMA.',
    fullExplanation:
      'Useful as dynamic trend filters and mean-reversion guides (e.g., 20/50/200 EMA), though they lag during sudden V-shaped reversals and whipsaw in sideways ranges.',
  },
  {
    id: 'rsi-divergence',
    term: 'RSI & Divergence',
    aliases: ['RSI', 'relative strength index', 'overbought', 'oversold'],
    category: 'Indicators & Macro',
    shortDefinition: 'Momentum oscillator (0–100) comparing average gains vs losses; tracks strength and momentum divergence.',
    fullExplanation:
      'Readings above 70 or below 30 do not automatically mean reverse—in strong trends RSI stays extreme. Bullish/bearish divergence occurs when price makes a new extreme while RSI fails to confirm.',
  },
  {
    id: 'macd',
    term: 'MACD',
    aliases: ['MACD line', 'signal line', 'histogram'],
    category: 'Indicators & Macro',
    shortDefinition: 'Trend-momentum indicator plotting the difference between 12-EMA and 26-EMA against a 9-EMA signal line.',
    fullExplanation:
      'MACD crossovers and zero-line shifts measure momentum acceleration and trend alignment.',
  },
  {
    id: 'bollinger-bands',
    term: 'Bollinger Bands',
    aliases: ['volatility squeeze'],
    category: 'Indicators & Macro',
    shortDefinition: 'Dynamic volatility envelope set ±2 standard deviations around a 20-period SMA.',
    fullExplanation:
      'Narrow bands ("squeeze") signal compressed volatility that frequently precedes directional expansion; band walks occur during powerful trends.',
  },
  {
    id: 'atr',
    term: 'ATR (Average True Range)',
    aliases: ['average true range', 'true range'],
    category: 'Indicators & Macro',
    shortDefinition: 'Non-directional volatility metric measuring average candle range including overnight gaps.',
    fullExplanation:
      'Essential for sizing dynamic stop-losses (e.g., 1.5× ATR beyond structure) and adapting target distance to current market noise.',
  },
  {
    id: 'central-bank-policy',
    term: 'Central Bank Rate & Guidance',
    aliases: ['FOMC', 'ECB', 'BOE', 'BOJ', 'hawkish', 'dovish'],
    category: 'Indicators & Macro',
    shortDefinition: 'Monetary policy decisions and forward guidance driving sovereign bond yields and currency trends.',
    fullExplanation:
      'Currencies tend to strengthen when central banks surprise hawkish (higher-for-longer rates) because real yield differentials attract global capital.',
  },
  {
    id: 'cpi-nfp',
    term: 'CPI & NFP Releases',
    aliases: ['CPI', 'NFP', 'inflation', 'nonfarm payrolls'],
    category: 'Indicators & Macro',
    shortDefinition: 'Flagship inflation (CPI) and US employment (NFP) reports causing rapid repricing of rate expectations.',
    fullExplanation:
      'Markets move most on the surprise gap between Actual and Consensus Forecast—plus revisions and wage/core inflation sub-components.',
  },
  {
    id: 'risk-reward-ratio',
    term: 'Risk-to-Reward Ratio (R:R)',
    aliases: ['R-multiple', 'R:R'],
    category: 'Risk & Psychology',
    shortDefinition: 'Ratio of potential target distance to defined stop-loss risk distance.',
    fullExplanation:
      'Risking 1 unit (1R) to target 2.5 units (+2.5R) creates a 1:2.5 R:R, requiring a lower win rate to achieve positive expectancy after costs.',
  },
  {
    id: 'expectancy',
    term: 'Trading Expectancy',
    aliases: ['expected value', 'edge'],
    category: 'Risk & Psychology',
    shortDefinition: 'Average net R-multiple gained or lost per trade over a large sample after spreads and slippage.',
    fullExplanation:
      'Formula: (Win Rate × Avg Win R) − (Loss Rate × Avg Loss R) − Execution Costs. Positive expectancy over 100+ trades beats chasing high win rate with uncapped losses.',
  },
  {
    id: 'drawdown-asymmetry',
    term: 'Drawdown Recovery Asymmetry',
    aliases: ['max drawdown'],
    category: 'Risk & Psychology',
    shortDefinition: 'Mathematical asymmetry where losing 50% of equity requires a +100% gain merely to break even.',
    fullExplanation:
      'Keeping single-trade risk at 0.5%–1.5% limits peak-to-trough drawdowns so recovery remains mathematically realistic.',
  },
  {
    id: 'fomo-revenge-trading',
    term: 'FOMO & Revenge Trading',
    aliases: ['FOMO', 'revenge trading', 'tilt'],
    category: 'Risk & Psychology',
    shortDefinition: 'Emotional errors: chasing extended moves out of fear of missing out or doubling risk after a loss.',
    fullExplanation:
      'Prevented through hard daily loss caps, written pre-trade checklists, and mandatory cooldown timers following consecutive stop-outs.',
  },
  {
    id: 'process-vs-outcome',
    term: 'Process vs Outcome Bias',
    aliases: ['trading journal'],
    category: 'Risk & Psychology',
    shortDefinition: 'Judging trade quality by rule adherence rather than whether a single random outcome was green or red.',
    fullExplanation:
      'A disciplined trade can hit stop-loss (Good Loss), while breaking rules can accidentally win (Bad Win). Grading execution in a journal separates skill from variance.',
  },
  {
    id: 'xauusd-real-yields',
    term: 'XAUUSD & Real Yields',
    aliases: ['gold', 'real yield', 'TIPS'],
    category: 'Gold & Crypto',
    shortDefinition: 'Spot Gold priced in USD; inversely sensitive to US real (inflation-adjusted) Treasury yields and DXY.',
    fullExplanation:
      'Because gold pays no coupon interest, rising US real yields raise its opportunity cost and pressure XAUUSD lower, while falling real yields or geopolitical safe-haven demand support gold.',
  },
  {
    id: 'crypto-spot-vs-perps',
    term: 'Crypto Spot vs Perpetual Futures',
    aliases: ['perpetuals', 'funding rate', 'liquidation'],
    category: 'Gold & Crypto',
    shortDefinition: 'Spot owns the underlying asset directly; Perpetuals are leveraged derivatives anchored via periodic funding fees.',
    fullExplanation:
      'Crowded leveraged positioning on perpetual futures creates cascading liquidations when funding spikes and price sweeps key levels.',
  },
  {
    id: 'self-custody-keys',
    term: 'Hot vs Cold Custody & Private Keys',
    aliases: ['hardware wallet', 'seed phrase'],
    category: 'Gold & Crypto',
    shortDefinition: 'Security architecture separating internet-connected hot wallets from offline hardware cold storage.',
    fullExplanation:
      'Exchanges carry counterparty risk; long-term holdings belong in hardware custody with offline seed phrase backups, 2FA, and withdrawal allowlists.',
  },
  {
    id: 'overfitting-walk-forward',
    term: 'Overfitting & Walk-Forward Testing',
    aliases: ['curve fitting', 'out-of-sample'],
    category: 'Quantitative & Portfolio',
    shortDefinition: 'Overfitting memorizes past historical noise; walk-forward tests out-of-sample robustness across rolling periods.',
    fullExplanation:
      'Always evaluate strategies on unseen out-of-sample data with realistic spread, commission, and slippage deductions.',
  },
  {
    id: 'monte-carlo-simulation',
    term: 'Monte Carlo Resampling',
    aliases: ['risk of ruin'],
    category: 'Quantitative & Portfolio',
    shortDefinition: 'Reordering historical trade returns thousands of times to estimate worst-case drawdown distributions.',
    fullExplanation:
      'Even a profitable edge experiences brutal losing streaks purely by random sequencing. Monte Carlo testing sizes risk so equity survives worst-case 95th-percentile streaks.',
  },
];

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category: string;
  hint?: string;
}

export const ACADEMY_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-01',
    category: 'Foundations',
    front: 'What is a Pip in EUR/USD vs USD/JPY?',
    hint: 'Decimal precision rule',
    back: '0.0001 (4th decimal) on non-JPY pairs like EUR/USD; 0.01 (2nd decimal) on JPY pairs like USD/JPY. The 5th/3rd decimal is a pipette (0.1 pip).',
  },
  {
    id: 'fc-02',
    category: 'Foundations',
    front: 'Which side of the quote do you pay when opening a BUY vs SELL?',
    hint: 'Bid vs Ask rule',
    back: 'You BUY at the higher ASK price and close (sell) at the BID. You SELL at the lower BID price and close (buy back) at the ASK.',
  },
  {
    id: 'fc-03',
    category: 'Foundations',
    front: 'Position Size Formula (Standard Lots)',
    hint: 'Account Risk $ ÷ Stop Distance',
    back: 'Lots = (Account Equity × Risk %) ÷ (Stop-Loss Pips × Pip Value per Standard Lot). Example: $100 risk ÷ (20 pips × $10) = 0.50 lots.',
  },
  {
    id: 'fc-04',
    category: 'Foundations',
    front: 'When is global FX liquidity deepest and spreads typically tightest?',
    hint: 'Session overlap hours',
    back: 'The London–New York session overlap (13:00–17:00 UTC / 08:00–12:00 ET), when both European and North American desks are simultaneously active.',
  },
  {
    id: 'fc-05',
    category: 'Price Action & Charting',
    front: 'Distinguish Break of Structure (BOS) from Market Structure Shift (MSS).',
    hint: 'Continuation vs Reversal',
    back: 'BOS breaks a swing high in an uptrend (continuation). MSS/CHoCH closes decisively past the most recent protected swing low (potential reversal).',
  },
  {
    id: 'fc-06',
    category: 'Price Action & Charting',
    front: 'What defines an authentic Bearish Engulfing pattern?',
    hint: 'Context + real body comparison',
    back: 'At a key resistance/supply zone, a bearish candle opens near/above the prior close and closes decisively below the prior bullish real body.',
  },
  {
    id: 'fc-07',
    category: 'Price Action & Charting',
    front: 'What is a Fair Value Gap (FVG) / Imbalance?',
    hint: '3-candle geometry',
    back: 'A 3-candle displacement sequence where Candle 1 high and Candle 3 low (bullish) do not overlap, leaving an unmitigated price gap.',
  },
  {
    id: 'fc-08',
    category: 'Price Action & Charting',
    front: 'Why are Support & Resistance zones superior to exact horizontal lines?',
    hint: 'Order clustering',
    back: 'Institutional buy/sell liquidity sits across price bands rather than exact single ticks. Treating S/R as zones prevents premature entries and premature stop-outs.',
  },
  {
    id: 'fc-09',
    category: 'Indicators & Macro',
    front: 'Why does RSI above 70 NOT mean "automatically sell"?',
    hint: 'Trend momentum behavior',
    back: 'In strong impulsive uptrends, RSI can stay above 70 for weeks ("embedded momentum"). Oscillators require structural resistance or divergence before reversal setups.',
  },
  {
    id: 'fc-10',
    category: 'Indicators & Macro',
    front: 'What does a Bollinger Band Squeeze indicate?',
    hint: 'Volatility regime cycle',
    back: 'Compressed standard deviation signals unusually quiet volatility, which frequently precedes a high-energy directional breakout expansion.',
  },
  {
    id: 'fc-11',
    category: 'Indicators & Macro',
    front: 'What drives major currency trends over multi-week horizons?',
    hint: 'Interest rate differential',
    back: 'Diverging central bank policy paths and real sovereign yield differentials—especially when inflation (CPI) or jobs (NFP) shift rate expectations.',
  },
  {
    id: 'fc-12',
    category: 'Risk & Psychology',
    front: 'Calculate Trade Expectancy Formula',
    hint: 'Win rate × Avg Win minus Loss rate × Avg Loss',
    back: 'Expectancy (R) = (Win% × AvgWinR) − (Loss% × AvgLossR) − CostR. A 40% win rate with +2.5R winners yields +0.40R gross expectancy per trade.',
  },
  {
    id: 'fc-13',
    category: 'Risk & Psychology',
    front: 'How much gain is required to recover from a 20% vs 50% drawdown?',
    hint: 'Drawdown asymmetry math',
    back: 'A 20% loss requires +25% to recover. A 50% loss requires +100% (doubling the remaining capital) merely to reach break-even.',
  },
  {
    id: 'fc-14',
    category: 'Risk & Psychology',
    front: 'What is the correlation trap when trading EUR/USD and GBP/USD?',
    hint: 'Shared USD denominator',
    back: 'Buying both EUR/USD and GBP/USD at 1% risk each often creates ~1.8%–2.0% concentrated short-USD exposure during USD macro surprises.',
  },
  {
    id: 'fc-15',
    category: 'Gold & Crypto',
    front: 'Why does XAU/USD (Gold) often drop when US 10-Year Real Yields spike?',
    hint: 'Opportunity cost of non-yielding assets',
    back: 'Gold pays no yield. When inflation-adjusted Treasury yields rise alongside USD strength, holding non-yielding bullion becomes less attractive.',
  },
  {
    id: 'fc-16',
    category: 'Gold & Crypto',
    front: 'How much price movement is $1.00 on 1.00 standard lot (100 oz) of XAU/USD?',
    hint: '100 troy ounces',
    back: '1.00 standard lot = 100 oz, so a $1.00 move in Gold equals $100 P&L (and $0.10 move = $10). 0.01 micro lot = $1.00 per $1 move.',
  },
  {
    id: 'fc-17',
    category: 'Gold & Crypto',
    front: 'What does a strongly positive Crypto Perpetual Funding Rate warn about?',
    hint: 'Crowded long leverage',
    back: 'Long perpetual traders are paying shorts heavily to hold leveraged longs, increasing vulnerability to sharp long-squeeze liquidations.',
  },
  {
    id: 'fc-18',
    category: 'Quantitative & Portfolio',
    front: 'Why is Walk-Forward validation preferred over a single In-Sample backtest?',
    hint: 'Out-of-sample overfitting defense',
    back: 'Single-pass parameter optimization fits historical noise. Walk-forward testing repeatedly optimizes on window A and verifies on unseen future window B.',
  },
];
