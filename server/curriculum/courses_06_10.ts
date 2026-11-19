import { OFFICIAL_SOURCES, type CurriculumCourseSeed } from './types.ts';

export const COURSES_06_10: CurriculumCourseSeed[] = [
  {
    id: 'course-06-support-resistance',
    slug: 'support-and-resistance',
    course_number: 6,
    title: '06. Support and Resistance',
    category: 'Support and Resistance',
    level: 'Intermediate',
    level_label: 'Beginner to Intermediate',
    description:
      'Master horizontal support and resistance zones, swing highs and lows, previous session levels, round numbers, role reversal, breakouts, false breakouts, and multi-factor confluence.',
    prerequisites: 'Courses 01–04 recommended.',
    learning_outcomes: [
      'Draw support and resistance as realistic price zones rather than fragile single-pip lines.',
      'Identify meaningful swing highs, swing lows, and key previous day, week, and month reference levels.',
      'Distinguish confirmed candle-close breakouts from false breakouts and failed retests.',
      'Apply role reversal and multi-factor zone confluence to plan clear invalidation levels.',
    ],
    estimated_hours: 3.5,
    cover_image_url: '/src/assets/images/hero_light_trading_1795086732029.jpg',
    assessment: [
      {
        id: 'c6-a1',
        question: 'Why should support and resistance generally be drawn as horizontal zones instead of exact single-pip lines?',
        options: [
          'Because institutional limit orders and market reactions cluster across small price bands rather than stopping at an identical pip every time',
          'Because brokers prohibit drawing thin horizontal lines',
          'Because support levels only work on monthly charts',
          'Because zones double leverage automatically',
        ],
        correct_index: 0,
        explanation:
          'Order flow from different participants clusters around price areas, creating slight overshoot and undershoot. Treating levels as zones prevents premature invalidation.',
      },
      {
        id: 'c6-a2',
        question: 'What does "role reversal" (polarity flip) mean after a decisive breakout?',
        options: [
          'A broken resistance zone can transition into potential support on a retest, and broken support can act as resistance',
          'Buy orders automatically turn into sell orders in your account',
          'Spreads drop to zero after every breakout',
          'Daily charts reverse direction every Friday',
        ],
        correct_index: 0,
        explanation:
          'When price breaks decisively through an established zone, trapped participants and breakout traders often defend the retest from the opposite side.',
      },
      {
        id: 'c6-a3',
        question: 'Which confirmation typically helps filter out a wick-only false breakout above resistance?',
        options: [
          'Waiting for a full candle body close beyond the zone and observing follow-through or retest behaviour',
          'Entering immediately whenever price moves 1 pipette above resistance',
          'Removing your stop-loss order',
          'Switching to a 5-second chart to force an entry',
        ],
        correct_index: 0,
        explanation:
          'Wick-only spikes above a level frequently trap aggressive breakout buyers before closing back inside the range.',
      },
      {
        id: 'c6-a4',
        question: 'Why are previous day, previous week, and previous month highs and lows widely monitored?',
        options: [
          'They serve as objective, universally visible reference points where liquidity, alerts, and order flow concentrate',
          'They guarantee a 100-pip bounce on every touch',
          'Central banks set daily interest rates at those exact prices',
          'They only exist in cryptocurrency markets',
        ],
        correct_index: 0,
        explanation:
          'Objective calendar swing extremes appear identically on institutional and retail charts, making them natural decision areas—not guaranteed reversal points.',
      },
      {
        id: 'c6-a5',
        question: 'What invalidates a support zone on a long setup?',
        options: [
          'Decisive acceptance (multiple closes or sustained trading) cleanly below the lower boundary of the support zone',
          'A single small lower wick touching the zone',
          'A flat candlestick inside the zone',
          'Low volume during the Asian session',
        ],
        correct_index: 0,
        explanation:
          'Every analytical zone must have clear invalidation: sustained closes beyond the far boundary signal buyers failed to defend the area.',
      },
    ],
    lessons: [
      {
        id: 'lesson-06-01',
        title: 'Horizontal Support and Resistance Zones',
        category: 'Support and Resistance',
        summary: 'Understand why S&R represents areas of supply/demand imbalance and how to plot clean horizontal zones.',
        learning_objective: 'Define support and resistance and draw clean horizontal zones incorporating candle bodies and wicks.',
        introduction:
          'Support and resistance are the foundation of chart reading. Rather than magic lines, they mark price areas where buyers or sellers previously overpowered the opposite side.',
        content:
          '### Support vs. Resistance\n- **Support** is a price area below current market price where buying interest previously slowed, halted, or reversed a decline.\n- **Resistance** is a price area above current market price where selling supply previously slowed, halted, or reversed an advance.\n\n### Zones Rather Than Exact Lines\nFinancial markets involve thousands of participants placing market, limit, and stop orders at slightly different prices. Price rarely reverses at the exact same fifth decimal place twice. Drawing a shaded **zone** between candle closes and extreme wicks reflects this real-world tolerance and keeps charts readable.',
        demonstration:
          '1. On a simulated Daily EUR/USD chart, locate two swing highs around `1.0942` (wick) and `1.0928` (body close).\n2. Shade a horizontal resistance band from `1.0928` to `1.0942` rather than agonizing over a single line.\n3. Observe how subsequent approaches interact with that 14-pip band.',
        common_mistakes: [
          'Covering the chart with 15 minor horizontal lines until price touches something everywhere.',
          'Ignoring candle bodies and anchoring zones solely to outlier news wicks.',
          'Assuming support must hold forever—every zone eventually breaks when opposing order flow overwhelms it.',
        ],
        summary_recap:
          'Support and resistance mark historical areas of buying or selling concentration; treating them as zones reflects real order-flow dispersion.',
        practical_exercise: {
          title: 'Clean Three-Zone Mapping',
          objective: 'Plot only the three most obvious horizontal zones on a Daily chart.',
          steps: [
            'Open a clean EUR/USD or GBP/USD Daily chart.',
            'Zoom out to 6 months of price history.',
            'Draw at most three horizontal zones covering clear multi-touch turning points.',
          ],
          deliverable: 'Annotated chart with 3 clearly bounded S&R zones and written rationale for each.',
        },
        visual_key: 'sr-zones-diagram',
        duration_minutes: 18,
        tags: ['support', 'resistance', 'zones'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-06-01-1',
            question: 'What defines a resistance zone?',
            options: [
              'An area above price where selling pressure previously halted or reversed advances',
              'A guaranteed ceiling price cannot cross',
              'The broker bid-ask spread width',
              'A moving average with period 200',
            ],
            correct_index: 0,
            explanation: 'Resistance reflects historical selling supply at higher prices; it is probabilistic, never guaranteed.',
          },
          {
            id: 'q-06-01-2',
            question: 'How is a zone typically bounded when plotting S&R?',
            options: [
              'Between the clustered candle closes and the nearby swing wick extremes',
              'At least 500 pips wide on a 15-minute chart',
              'Only using closing prices on Sunday night',
              'Using a random Fibonacci extension',
            ],
            correct_index: 0,
            explanation: 'Including both body closes and wick extremes captures the realistic price region where orders reacted.',
          },
          {
            id: 'q-06-01-3',
            question: 'Why is drawing too many S&R lines harmful?',
            options: [
              'It creates confirmation bias and visual clutter where every candle seems to hit a level',
              'It increases broker swap charges',
              'It disables stop-loss orders',
              'It slows down central bank policy',
            ],
            correct_index: 0,
            explanation: 'Fewer, higher-timeframe, obvious zones keep analysis objective and uncluttered.',
          },
        ],
      },
      {
        id: 'lesson-06-02',
        title: 'Swing Highs and Swing Lows',
        category: 'Support and Resistance',
        summary: 'Learn how to identify major structural swing points versus minor intraday noise.',
        learning_objective: 'Distinguish primary swing highs and lows from minor fluctuations to build reliable S&R levels.',
        introduction:
          'Not every peak or trough deserves a level. Knowing which swing points matter prevents clutter and keeps your focus on structural turning points.',
        content:
          '### Defining a Swing Point\nA **swing high** is a peak higher than the candles immediately before and after it; a **swing low** is a trough lower than surrounding candles.\n\n### Major vs. Minor Swings\n- **Major swings** produce substantial directional moves, often visible immediately when zooming out on H4, Daily, or Weekly charts.\n- **Minor swings** sit inside larger consolidations and are frequently swept without changing the broader trend.\n\nPrioritizing swings that launched strong impulsive moves highlights where institutional participation was decisive.',
        demonstration:
          '1. Compare a simulated 4-hour chart showing five minor ripples inside a range versus two pronounced swing highs that started 180-pip selloffs.\n2. Anchor resistance to the pronounced swing highs first, keeping minor ripples unmarked.',
        common_mistakes: [
          'Marking every 3-bar pullback as a major structural swing.',
          'Looking at 5-minute charts before identifying Daily swing highs and lows.',
        ],
        summary_recap:
          'Focus S&R levels on prominent swing points that generated meaningful directional displacement.',
        practical_exercise: {
          title: 'Major vs. Minor Swing Filter',
          objective: 'Separate high-significance swings from noise.',
          steps: [
            'Open an H4 chart and label 4 major swing highs/lows that led to large moves.',
            'Compare them against small intra-range ripples and verify why major swings stand out visually.',
          ],
          deliverable: 'Labeled H4 chart contrasting major swings vs. minor noise.',
        },
        visual_key: 'sr-zones-diagram',
        duration_minutes: 15,
        tags: ['swing-high', 'swing-low', 'structure'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-02-1',
            question: 'Which swing highs usually carry the highest analytical weight?',
            options: [
              'Prominent higher-timeframe swing highs that initiated strong directional moves',
              'Tiny 1-minute ripples inside a dead Asian session',
              'Any candle with a green body',
              'Only Monday 00:00 candles',
            ],
            correct_index: 0,
            explanation: 'Higher-timeframe swings that preceded strong displacement reflect significant order-flow reactions.',
          },
          {
            id: 'q-06-02-2',
            question: 'What happens if you mark every minor swing on a low timeframe?',
            options: [
              'Chart paralysis and false signals at insignificant levels',
              'Guaranteed breakout accuracy',
              'Lower spread from the liquidity provider',
              'Elimination of market risk',
            ],
            correct_index: 0,
            explanation: 'Too many minor lines obscure genuine high-probability decision areas.',
          },
          {
            id: 'q-06-02-3',
            question: 'Zooming out on the chart primarily helps you:',
            options: [
              'Spot dominant swing extremes that stand out clearly across weeks or months',
              'Increase leverage on open trades',
              'Hide historical gaps',
              'Predict exact NFP numbers',
            ],
            correct_index: 0,
            explanation: 'Zooming out reveals which turning points truly shifted broader market direction.',
          },
        ],
      },
      {
        id: 'lesson-06-03',
        title: 'Previous Day, Week, and Month Highs and Lows',
        category: 'Support and Resistance',
        summary: 'Use objective calendar highs and lows (PDH, PDL, PWH, PWL, PMH, PML) as intraday and swing reference levels.',
        learning_objective: 'Plot Previous Day, Week, and Month highs/lows and interpret reactions around them.',
        introduction:
          'Subjectivity causes disagreement between traders—two people may draw trendlines differently. Previous Day High (PDH) and Previous Day Low (PDL) are 100% objective.',
        content:
          '### Objective Calendar Extremes\n- **PDH / PDL** (Previous Day High / Low): Key intraday inflection points where breakout orders and resting stops often sit.\n- **PWH / PWL** (Previous Week High / Low): Widely watched swing boundaries.\n- **PMH / PML** (Previous Month High / Low): Major institutional macro reference benchmarks.\n\nBecause every trader using a consistent session rollover sees the exact same high and low, reactions (sweeps, rejections, or breakouts) frequently occur near these benchmarks.',
        demonstration:
          '1. At London open on a simulated EUR/USD chart, mark yesterday’s high (`1.0890`) and low (`1.0835`).\n2. Watch how price pokes 5 pips above `1.0890` (liquidity probe) before closing back inside yesterday’s range—a classic warning not to chase an unconfirmed breakout.',
        common_mistakes: [
          'Forgetting which broker timezone defines daily candle close (New York 17:00 ET is standard FX rollover).',
          'Blindly placing counter-trend orders at PDH/PDL without reaction confirmation.',
        ],
        summary_recap:
          'PDH/PDL, PWH/PWL, and PMH/PML provide objective, universal reference levels free from drawing bias.',
        practical_exercise: {
          title: 'Daily Benchmark Tracking',
          objective: 'Track how price reacts around PDH and PDL across 5 consecutive sessions.',
          steps: [
            'Mark PDH and PDL on EUR/USD H1 at the start of 5 trading days.',
            'Record whether price rejected, cleanly broke and held, or briefly wicked past each level.',
          ],
          deliverable: '5-day PDH/PDL observation log.',
        },
        visual_key: 'sr-false-breakout',
        duration_minutes: 16,
        tags: ['pdh', 'pdl', 'pwh', 'calendar-levels'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-03-1',
            question: 'What is the primary advantage of PDH/PDL levels over subjective trendlines?',
            options: [
              'They are completely objective prices visible identically to most FX participants',
              'They guarantee a 50-pip reversal at 08:00 London time',
              'They remove spreads on Gold',
              'They eliminate news volatility',
            ],
            correct_index: 0,
            explanation: 'Objective highs/lows eliminate drawing bias and concentrate market attention at identical numbers.',
          },
          {
            id: 'q-06-03-2',
            question: 'What is the industry-standard daily FX rollover close used by most institutional charts?',
            options: ['17:00 New York time (ET)', '12:00 Tokyo time', '03:00 Zurich time', 'Sunday 10:00 UTC'],
            correct_index: 0,
            explanation: '17:00 ET marks the end of the traditional FX trading day and settlement rollover.',
          },
          {
            id: 'q-06-03-3',
            question: 'If price spikes briefly above PDH and immediately closes back below it on H1, that suggests:',
            options: [
              'A potential failed breakout / liquidity sweep above yesterday’s high rather than confirmed acceptance',
              'An automatic long entry without stop-loss',
              'Market closure',
              'Broker platform corruption',
            ],
            correct_index: 0,
            explanation: 'Failure to hold above PDH warns that breakout buyers lacked follow-through.',
          },
        ],
      },
      {
        id: 'lesson-06-04',
        title: 'Round Numbers and Psychological Levels',
        category: 'Support and Resistance',
        summary: 'See why institutional options barriers, retail orders, and human psychology cluster around 00 and 50 price handles.',
        learning_objective: 'Explain why big round numbers (e.g., 1.1000, 150.00, $2,500) act as liquidity magnets and reaction zones.',
        introduction:
          'Human beings think in round numbers. When setting take-profits, hedging budgets, or structuring options, both corporate treasurers and retail traders gravitate toward clean zeros.',
        content:
          '### Psychological Price Handles\n- **Double-Zero / Parity Levels**: e.g., `1.0000`, `1.1000`, `150.00` on USD/JPY, or `$3,000` on Gold.\n- **Mid-Figure Levels**: `.0050` / `.50` levels such as `1.0850`.\n\n### Practical Consequence\nBecause limit orders and stop-loss orders frequently cluster right at or just beyond round numbers, price often experiences brief hesitation, sharp wicks, or volatility near major handles. Never place a naive stop-loss squarely on `1.1000`—give structural levels breathing room.',
        demonstration:
          '1. Inspect a simulated USD/JPY chart approaching `150.00`.\n2. Notice how options barriers and protective stops create choppy rejection wicks between `149.90` and `150.15` rather than a razor-clean bounce at `150.000`.',
        common_mistakes: [
          'Trading blindly against a trend simply because price touched a round number.',
          'Putting stop-loss orders right on `.00` numbers where brief liquidity probes occur.',
        ],
        summary_recap:
          'Round numbers attract clustered orders and hedging flow; treat them as supporting confluence rather than standalone signals.',
        practical_exercise: {
          title: 'Round Number Confluence Check',
          objective: 'Evaluate how major round handles align with existing structural S&R.',
          steps: [
            'Plot `.0000` and `.0050` handles on EUR/USD H4.',
            'Highlight instances where a round number overlaps with an existing swing high or low.',
          ],
          deliverable: 'List of 3 historical overlaps between round handles and structural swings.',
        },
        visual_key: 'sr-zones-diagram',
        duration_minutes: 14,
        tags: ['psychological-levels', 'round-numbers', 'confluence'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-06-04-1',
            question: 'Why do levels like 1.1000 or 150.00 often see reactions?',
            options: [
              'Orders, options barriers, and human decision benchmarks cluster around round handles',
              'Central banks ban trading past round numbers',
              'Spread drops to zero at `.00` levels',
              'Trendlines automatically reset at round numbers',
            ],
            correct_index: 0,
            explanation: 'Both institutional options/hedging desks and retail traders use round numbers as reference benchmarks.',
          },
          {
            id: 'q-06-04-2',
            question: 'Should you sell automatically whenever price reaches a `.00` handle during a strong uptrend?',
            options: [
              'No—use round numbers as confluence with structure and price confirmation, not blind counter-trend triggers',
              'Yes, always sell at every round number with max leverage',
              'Only on Sundays',
              'Yes, because trends cannot cross `.00` prices',
            ],
            correct_index: 0,
            explanation: 'Strong trends routinely slice through round handles; confirmation and structure always come first.',
          },
          {
            id: 'q-06-04-3',
            question: 'Why is placing a stop-loss directly on `1.1000` often risky?',
            options: [
              'Liquidity probes around obvious round handles can tag exact-number stops before reversing',
              'Trading platforms reject numbers ending in zero',
              'Broker commissions double at `.00` levels',
              'It voids demo account balances',
            ],
            correct_index: 0,
            explanation: 'Buffer stops slightly beyond the full zone rather than sitting squarely on obvious round numbers.',
          },
        ],
      },
      {
        id: 'lesson-06-05',
        title: 'Role Reversal After a Break',
        category: 'Support and Resistance',
        summary: 'Learn the mechanics of polarity flips where old resistance becomes new support and old support becomes new resistance.',
        learning_objective: 'Explain why broken S&R zones flip polarity and how to recognize healthy retests.',
        introduction:
          'One of the highest-utility concepts in technical analysis is role reversal: when buyers finally conquer a stubborn ceiling, that former ceiling often becomes the new floor.',
        content:
          '### Why Polarity Flips Happen\n1. **Sellers trapped or covering**: Traders who shorted at resistance face losses once price breaks out decisively; if price returns to their entry zone, many close at break-even, removing supply and adding buy orders.\n2. **Missed-move buyers**: Traders who waited for confirmation often place buy limit orders at the broken resistance zone.\n\n### Quality Filters\nA role-reversal level is strongest when the initial break showed **decisive displacement** (large full-bodied candles closing cleanly beyond the zone) rather than a sluggish drift.',
        demonstration:
          '1. Simulated GBP/USD resistance sits at `1.2700–1.2715`.\n2. A strong H4 bullish candle closes cleanly at `1.2760`.\n3. Two days later price pulls back into `1.2710`, prints a bullish rejection candle, and resumes higher—demonstrating textbook resistance-turned-support.',
        common_mistakes: [
          'Expecting role reversal after a weak, indecisive 2-pip poke outside a level.',
          'Entering blindly on a retest after price has already sliced deeply back inside the old range.',
        ],
        summary_recap:
          'Decisive breakouts often turn former resistance into support (and former support into resistance) upon disciplined retests.',
        practical_exercise: {
          title: 'Polarity Flip Case Study',
          objective: 'Document three clean resistance-to-support or support-to-resistance flips.',
          steps: [
            'Scan Daily and H4 charts for levels broken by strong full-bodied candles.',
            'Trace price back to the first retest and record whether the zone flipped roles cleanly.',
          ],
          deliverable: '3 annotated charts showing break + retest polarity transitions.',
        },
        visual_key: 'sr-role-reversal',
        duration_minutes: 18,
        tags: ['role-reversal', 'polarity', 'break-and-retest'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-05-1',
            question: 'What is "role reversal" in S&R analysis?',
            options: [
              'Broken resistance acting as support (or broken support acting as resistance) on a subsequent retest',
              'Switching from Forex to crypto',
              'Turning a stop-loss into a take-profit',
              'Reversing your account currency',
            ],
            correct_index: 0,
            explanation: 'Polarity flips reflect shifting order flow from participants who missed or were caught offside on the breakout.',
          },
          {
            id: 'q-06-05-2',
            question: 'Which breakout increases confidence that a zone might hold on a role-reversal retest?',
            options: [
              'A strong, decisive candle close well beyond the zone showing real displacement',
              'A tiny doji candle closing 1 pipette above resistance',
              'A Sunday market gap that immediately fills',
              'Zero movement during a bank holiday',
            ],
            correct_index: 0,
            explanation: 'Decisive displacement signals genuine imbalance rather than noise.',
          },
          {
            id: 'q-06-05-3',
            question: 'If price drops sharply all the way back through the broken resistance zone and closes deep inside the old range, the role-reversal idea is:',
            options: [
              'Invalidated—stay aside or re-evaluate for a failed breakout',
              'Confirmed as a stronger buy signal',
              'Converted into a guaranteed 5:1 setup',
              'Protected by broker insurance',
            ],
            correct_index: 0,
            explanation: 'Failure to hold the retest invalidates the polarity flip.',
          },
        ],
      },
      {
        id: 'lesson-06-06',
        title: 'Supply and Demand Zones as Analytical Concepts',
        category: 'Support and Resistance',
        summary: 'Understand supply and demand zones objectively as origin areas of strong impulsive moves, without mystifying language.',
        learning_objective: 'Define supply and demand zones clearly and explain their relationship to traditional S&R.',
        introduction:
          'You will frequently hear traders speak of "supply and demand zones." Stripped of marketing jargon, these are simply consolidation bases from which price launched a sharp impulsive move.',
        content:
          '### Origin of the Concept\n- A **demand zone** is the tight consolidation or base candle immediately preceding a sharp upward rally (indicating unfilled buy orders overwhelmed available supply).\n- A **supply zone** is the tight base immediately preceding a sharp downward drop.\n\n### Objective Perspective\nSupply/demand zoning is a **visual framework** for locating fresh S&R origin areas—not a secret institutional algorithm. Like classic S&R, "fresh" untested zones often react more sharply than heavily retested ones, yet any zone can fail cleanly when macroeconomic news or larger order flow shifts.',
        demonstration:
          '1. Spot a narrow two-candle pause around `1.0780–1.0792` followed by three large bullish H4 candles surging 140 pips.\n2. Box that origin base (`1.0780–1.0792`) as a demand zone.\n3. Compare how it sits right beside traditional swing support, confirming both methods describe the same price imbalance.',
        common_mistakes: [
          'Believing every drawn supply/demand box represents "bank orders guaranteed to bounce."',
          'Using zones from 2 years ago on a 5-minute chart as if old limit orders still sit there unchanged.',
        ],
        summary_recap:
          'Supply and demand zones frame S&R around bases that launched strong impulsive moves; treat them as probabilistic analysis tools.',
        practical_exercise: {
          title: 'Impulse Origin Identification',
          objective: 'Map high-displacement base zones alongside standard swing S&R.',
          steps: [
            'Locate two sharp 100+ pip directional impulses on an H4 chart.',
            'Highlight the tight pause/base right before each impulse and compare with nearby swing S&R.',
          ],
          deliverable: 'Comparison notes showing overlap between traditional S&R and base zones.',
        },
        visual_key: 'supply-demand-zones',
        duration_minutes: 17,
        tags: ['supply-and-demand', 'imbalance', 'displacement'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-06-1',
            question: 'How is a "demand zone" typically identified on a price chart?',
            options: [
              'The consolidation base or origin candle immediately before a sharp bullish impulse',
              'Any green moving average',
              'A random zone below zero',
              'The daily spread histogram',
            ],
            correct_index: 0,
            explanation: 'Demand zones highlight the price origin where buying overwhelmed selling to launch an impulse.',
          },
          {
            id: 'q-06-06-2',
            question: 'What is the most accurate way to view supply and demand zones?',
            options: [
              'As a structured visual framework for potential imbalance areas that still require risk limits and confirmation',
              'As foolproof institutional signals with 95% win rates',
              'As replacements for stop-losses',
              'As regulatory filings',
            ],
            correct_index: 0,
            explanation: 'No visual zone guarantees reaction; disciplined invalidation and confirmation remain mandatory.',
          },
          {
            id: 'q-06-06-3',
            question: 'Why do repeatedly tested zones often weaken over time?',
            options: [
              'Each return absorbs more resting orders sitting at that price level',
              'Brokers delete old zones automatically',
              'Candlesticks shrink after three touches',
              'Spreads widen permanently after three touches',
            ],
            correct_index: 0,
            explanation: 'Repeated tests consume resting liquidity; once absorbed, breakouts become more likely.',
          },
        ],
      },
      {
        id: 'lesson-06-07',
        title: 'Breakouts and Candle-Close Confirmation',
        category: 'Support and Resistance',
        summary: 'Learn how to validate genuine breakouts using timeframe alignment, candle closes, and expansion quality.',
        learning_objective: 'Differentiate tentative intraday pokes from confirmed candle-close breakouts.',
        introduction:
          'Trading breakouts blindly is one of the fastest ways beginners lose money in ranging markets. Waiting for candle close confirmation filters countless traps.',
        content:
          '### What Makes a Breakout Credible?\n1. **Full Body Close**: The candle closes decisively beyond the far edge of the S&R zone on your chosen structural timeframe (e.g., H4 or Daily), not just a momentary wick poke.\n2. **Expansion / Momentum**: Breakout candles show healthy body size relative to preceding compression candles.\n3. **Alignment**: Breakouts moving in the direction of the higher-timeframe trend carry stronger follow-through potential than breakouts slamming directly into an opposing higher-timeframe barrier 15 pips away.',
        demonstration:
          '1. Resistance holds EUR/USD below `1.0920`.\n2. Candle A spikes to `1.0932` intraday on H4 then closes at `1.0912` (unconfirmed).\n3. Later, Candle B expands strongly and closes cleanly at `1.0955`, clearing the zone with room to the next Daily ceiling at `1.1040`.',
        common_mistakes: [
          'Buying the first millisecond price crosses a line before the candle closes.',
          'Trading a breakout directly into a major Weekly resistance zone 10 pips ahead (poor Reward-to-Risk).',
        ],
        summary_recap:
          'Require decisive candle-close acceptance beyond the zone and confirm sufficient space before the next major obstacle.',
        practical_exercise: {
          title: 'Breakout Quality Scoring',
          objective: 'Evaluate 5 historical breakouts against candle-close and overhead space criteria.',
          steps: [
            'Find 5 breaks of H4 S&R zones.',
            'Score each on: (a) strong body close beyond zone, (b) clear room to next barrier.',
          ],
          deliverable: '5-trade breakout quality checklist.',
        },
        visual_key: 'sr-role-reversal',
        duration_minutes: 17,
        tags: ['breakouts', 'candle-close', 'confirmation'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-07-1',
            question: 'Why wait for the candle to close before declaring a breakout?',
            options: [
              'Intraday wicks frequently pull back inside the zone before the bar completes',
              'Brokers do not allow trades mid-candle',
              'Waiting eliminates transaction fees',
              'Closed candles guarantee future direction',
            ],
            correct_index: 0,
            explanation: 'Price acceptance is measured by where a candle closes, not merely where it spiked temporarily.',
          },
          {
            id: 'q-06-07-2',
            question: 'What should you check immediately ahead of a breakout level?',
            options: [
              'Whether another higher-timeframe barrier sits too close to allow reasonable Risk-to-Reward',
              'Whether the asset name starts with E',
              'Your friend’s opinion on social media',
              'Whether spreads were tight three years ago',
            ],
            correct_index: 0,
            explanation: 'Breaking an H1 level directly into Daily resistance 12 pips higher leaves poor asymmetric payoff.',
          },
          {
            id: 'q-06-07-3',
            question: 'Which candle shape provides stronger breakout confirmation?',
            options: [
              'A wide full-bodied candle closing near its extreme cleanly beyond the zone',
              'A tiny spinning top straddling the middle of the zone',
              'A long upper wick closing back inside the old range',
              'A gap with zero body',
            ],
            correct_index: 0,
            explanation: 'Strong body expansion closing near the extreme reflects sustained conviction.',
          },
        ],
      },
      {
        id: 'lesson-06-08',
        title: 'False Breakouts and Liquidity Probes',
        category: 'Support and Resistance',
        summary: 'Recognize stop-runs, fakeouts, and why price frequently pokes beyond obvious levels before reversing.',
        learning_objective: 'Identify false breakouts early and avoid being trapped by liquidity probes above highs or below lows.',
        introduction:
          'Markets often poke just past an obvious high or low, trigger resting stop and breakout orders, and snap sharply back inside the range. Understanding why prevents emotional frustration.',
        content:
          '### Anatomy of a False Breakout\n1. An obvious level develops (e.g., triple-top resistance at `1.3000`).\n2. Buy-stop orders (from breakout buyers and short sellers’ stop-losses) accumulate just above `1.3000`.\n3. Price spikes through `1.3000` to `1.3018`, executing those resting buy orders.\n4. Without sustained new buyers to absorb remaining supply, price stalls, prints a sharp upper wick, and closes firmly back below `1.3000`.\n\n### Practical Defence\nWaiting for candle close or waiting for a clean retest keeps you out of most fakeouts—and helps experienced traders recognize when trapped breakout traders may fuel a move back toward the opposite side of the range.',
        demonstration:
          '1. Examine the simulated false-breakout diagram where price spikes above a triple-top high during high volatility.\n2. Notice the sudden failure to close above `1.3000`, followed by a bearish engulfing bar closing back at `1.2980`.',
        common_mistakes: [
          'Assuming every false breakout is personal broker manipulation rather than natural order-book liquidity mechanics.',
          'Fading a breakout blindly without waiting for price to actually fail back inside the zone.',
        ],
        summary_recap:
          'False breakouts occur when price probes beyond obvious extremes, triggers resting stops/breakouts, and fails to sustain acceptance.',
        practical_exercise: {
          title: 'Fakeout Anatomy Log',
          objective: 'Contrast a confirmed breakout against a failed liquidity probe.',
          steps: [
            'Find one failed breakout above a Daily or H4 swing high.',
            'Measure how far price poked past the level and where the candle actually closed.',
          ],
          deliverable: 'Annotated comparison of wick probe distance vs. closing price.',
        },
        visual_key: 'sr-false-breakout',
        duration_minutes: 19,
        tags: ['false-breakout', 'fakeout', 'liquidity-probe'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'q-06-08-1',
            question: 'What typically fuels a sharp reversal right after a false breakout above resistance?',
            options: [
              'Trapped breakout buyers exiting and lack of follow-through demand above the high',
              'Brokers shutting down servers',
              'Central banks printing coins',
              'A weekend rollover error',
            ],
            correct_index: 0,
            explanation: 'Once stops and breakout entries fill without sustained demand, trapped longs liquidate as price falls back inside.',
          },
          {
            id: 'q-06-08-2',
            question: 'How do you confirm a false breakout has occurred rather than an early pause in a real breakout?',
            options: [
              'Wait for price to close back decisively inside the broken range/zone rather than guessing at the wick high',
              'Short the exact moment price goes 1 pip above resistance',
              'Use 1:500 leverage',
              'Ignore candle closes altogether',
            ],
            correct_index: 0,
            explanation: 'Wait for failure confirmation—price closing back inside—before concluding a breakout failed.',
          },
          {
            id: 'q-06-08-3',
            question: 'What simple habit helps avoid entering most false breakouts long?',
            options: [
              'Waiting for candle-close confirmation and/or a successful retest above the broken zone',
              'Removing take-profit levels',
              'Only trading during low-liquidity hours',
              'Trading without a chart',
            ],
            correct_index: 0,
            explanation: 'Waiting for acceptance or retest filters out spike-and-reverse traps.',
          },
        ],
      },
      {
        id: 'lesson-06-09',
        title: 'Retests and Failed Retests',
        category: 'Support and Resistance',
        summary: 'Compare disciplined break-and-retest entries with failed retests that signal range return.',
        learning_objective: 'Distinguish a constructive retest holding a broken zone from a failed retest requiring exit or stand-aside.',
        introduction:
          'Even after a genuine breakout, price frequently pulls back to "test" the broken level. Knowing how price should behave on that retest is critical.',
        content:
          '### Constructive Retest Behaviour\n- Pullback candles toward the broken level are typically smaller and slower than the breakout impulse.\n- Price enters or kisses the broken zone and prints clear rejection (wick + directional close away from the zone).\n\n### Failed Retest\nIf price slices straight back through the broken zone on strong opposing momentum and closes deeply back inside the prior range, the retest has **failed**. Protect capital immediately—do not average down hoping the level magically recovers.',
        demonstration:
          '1. Compare two scenarios after a `1.0920` breakout:\n2. **Scenario A (Healthy Retest)**: Slow 3-bar pullback to `1.0922` followed by a bullish pin bar closing at `1.0940`.\n3. **Scenario B (Failed Retest)**: Sharp bearish bar plunging straight back to `1.0885` and closing below `1.0900`. Trade idea invalidated.',
        common_mistakes: [
          'Moving your stop-loss further away when a retest fails back inside the range.',
          'Treating a deep crash back through support as "an even better discount."',
        ],
        summary_recap:
          'Healthy retests show slowing counter-momentum and clean rejection at the flipped zone; deep closes back inside signal failure.',
        practical_exercise: {
          title: 'Retest Pass/Fail Drill',
          objective: 'Develop objective invalidation criteria for retest trades.',
          steps: [
            'Draw a breakout zone on a chart.',
            'Write two exact sentences defining (1) what constitutes a valid retest bounce and (2) what exact close invalidates the retest.',
          ],
          deliverable: 'Written pass/fail retest validation rule.',
        },
        visual_key: 'sr-role-reversal',
        duration_minutes: 16,
        tags: ['retest', 'failed-retest', 'invalidation'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-06-09-1',
            question: 'What characterizes a healthy break-and-retest pullback?',
            options: [
              'Controlled pullback to the broken zone followed by rejection/continuation away from it',
              'A violent crash straight back across the entire prior range',
              'Ten consecutive margin calls',
              'Price freezing for two weeks',
            ],
            correct_index: 0,
            explanation: 'Controlled retracement plus clean rejection indicates buyers (or sellers) defending the flipped level.',
          },
          {
            id: 'q-06-09-2',
            question: 'What should you do if a retest slices cleanly back inside the old range and hits your invalidation?',
            options: [
              'Respect your stop-loss and accept the invalidation without averaging down',
              'Double your position size to lower your average entry',
              'Delete your stop-loss',
              'Switch timeframes until it looks bullish again',
            ],
            correct_index: 0,
            explanation: 'Failed retests turn into bull/bear traps quickly; strict stop-loss discipline protects capital.',
          },
          {
            id: 'q-06-09-3',
            question: 'Do all valid breakouts always give a neat retest?',
            options: [
              'No—strong momentum breakouts sometimes continue without pulling all the way back',
              'Yes, 100% of breakouts retest identically',
              'Only on Fridays',
              'Only in GBP pairs',
            ],
            correct_index: 0,
            explanation: 'Never force chases if price runs away without a retest; missing a trade is far cheaper than taking an undisciplined entry.',
          },
        ],
      },
      {
        id: 'lesson-06-10',
        title: 'Confluence and Zone Invalidation',
        category: 'Support and Resistance',
        summary: 'Combine independent technical clues at one S&R zone while keeping clear invalidation boundaries.',
        learning_objective: 'Build high-clarity confluence zones and avoid stacking redundant correlated signals.',
        introduction:
          'Single indicators or isolated lines are fragile. Confluence occurs when genuinely independent technical factors align at the same price area.',
        content:
          '### Genuine Confluence vs. Illusionary Confluence\n- **Genuine Confluence** combines distinct analytical inputs: e.g., a Daily horizontal S&R zone + a `50%` Fibonacci retracement + a rising trendline + a psychological round number (`1.0800`).\n- **Illusionary Confluence** stacks three variations of the exact same data (e.g., RSI + Stochastic + CCI all reading "oversold" simultaneously—those are three momentum oscillators measuring the same price swing).\n\n### Zone Invalidation Discipline\nEven a 5-factor confluence zone is only a probability tilt, never certainty. Always place protective invalidation cleanly beyond the far edge of the zone before entering.',
        demonstration:
          '1. On a simulated AUD/USD H4 chart, `0.6600` aligns with: (a) Weekly resistance-turned-support, (b) `61.8%` retracement of the prior rally, and (c) round handle `0.6600`.\n2. Invalidated if H4 closes cleanly below `0.6575` (beyond the zone).',
        common_mistakes: [
          'Counting 4 correlated oscillators as "4 independent confirmations."',
          'Taking extra leverage simply because a zone has strong confluence.',
        ],
        summary_recap:
          'Stack truly independent factors (structure, calendar levels, trendlines, retracements) at S&R zones and always define exact invalidation.',
        practical_exercise: {
          title: '3-Factor Confluence Audit',
          objective: 'Score a chart zone using non-redundant criteria.',
          steps: [
            'Pick a higher-timeframe horizontal S&R zone.',
            'Check whether a round handle, Fib level, or trendline intersects it.',
            'Write out exact entry confirmation and exact invalidation price.',
          ],
          deliverable: 'Completed Confluence & Invalidation Audit card.',
        },
        visual_key: 'sr-confluence-checklist',
        duration_minutes: 18,
        tags: ['confluence', 'invalidation', 'risk-planning'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-06-10-1',
            question: 'Which pair represents genuine independent confluence?',
            options: [
              'A Daily horizontal S&R zone aligning with a trendline and a round number',
              'RSI(14), Stochastic(14), and CCI(14) all looking at the same 14 bars',
              'Two identical 20-period moving averages plotted twice',
              'A bullish tweet plus a green button',
            ],
            correct_index: 0,
            explanation: 'True confluence brings together distinct structural dimensions rather than duplicating the same oscillator math.',
          },
          {
            id: 'q-06-10-2',
            question: 'Should strong 4-factor confluence allow you to risk 20% of your account on one trade?',
            options: [
              'No—confluence improves setup selectivity, never certainty; fixed risk limits remain mandatory',
              'Yes, high confluence eliminates risk',
              'Yes, if spreads are below 1 pip',
              'Only on Gold',
            ],
            correct_index: 0,
            explanation: 'Any individual trade can fail regardless of confluence; consistent risk sizing preserves capital.',
          },
          {
            id: 'q-06-10-3',
            question: 'Where does logical invalidation sit for a confluence support zone?',
            options: [
              'Cleanly beyond the far edge of the zone so noise does not stop you prematurely, yet failure exits promptly',
              'In the exact middle of the zone',
              '1,000 pips away',
              'Nowhere—use mental stops only',
            ],
            correct_index: 0,
            explanation: 'Stops belong outside the structure boundary where the thesis is proven wrong.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-07-trendlines',
    slug: 'trendlines',
    course_number: 7,
    title: '07. Trendlines',
    category: 'Trendlines',
    level: 'Intermediate',
    level_label: 'Intermediate',
    description:
      'Construct objective bullish and bearish trendlines and channels, assess line slope and touch quality, validate breaks vs. false breaks, and know when to redraw or discard.',
    prerequisites: 'Courses 04 and 06 recommended.',
    learning_outcomes: [
      'Anchor bullish and bearish trendlines accurately across meaningful swing lows and highs.',
      'Construct ascending, descending, and horizontal trading channels without forcing angles.',
      'Interpret changing trendline slope as acceleration or momentum exhaustion.',
      'Differentiate clean trendline breaks and retests from volatility-spike false breaks.',
    ],
    estimated_hours: 3,
    cover_image_url: '/src/assets/images/hero_trading_desk_1795085837463.jpg',
    assessment: [
      {
        id: 'c7-a1',
        question: 'How many touch points are minimum to draw a tentative trendline, and how many validate it?',
        options: [
          'Two points connect to form a tentative line; a third clean reaction touch validates it',
          'One candle forms a trendline; two guarantee reversal',
          'Ten touches are required before drawing anything',
          'Trendlines require no price touches',
        ],
        correct_index: 0,
        explanation: 'Any two points can connect a straight line; waiting for a third reaction touch confirms the market is respecting that diagonal slope.',
      },
      {
        id: 'c7-a2',
        question: 'Where is a standard bullish (uptrend) trendline drawn?',
        options: [
          'Connecting rising swing lows beneath price action',
          'Connecting falling swing highs above price action',
          'Through the middle of every candle body',
          'Vertically at midnight',
        ],
        correct_index: 0,
        explanation: 'Bullish trendlines connect ascending swing lows to track dynamic support underneath an uptrend.',
      },
      {
        id: 'c7-a3',
        question: 'What does an overly steep, near-vertical trendline typically indicate?',
        options: [
          'Unsustainable acceleration that frequently breaks abruptly once momentum cools',
          'Permanent zero-volatility trending',
          'Guaranteed continuation for several years',
          'Lower broker spreads',
        ],
        correct_index: 0,
        explanation: 'Parabolic slopes rarely persist long term; a break of an ultra-steep line often signals a return to a gentler pace rather than an immediate major reversal.',
      },
      {
        id: 'c7-a4',
        question: 'What should you do if price slices effortlessly back and forth across your trendline multiple times?',
        options: [
          'Discard the trendline—it has lost descriptive validity rather than forcing it to fit',
          'Keep shifting it every hour until a trade triggers',
          'Double position size inside the chop',
          'Ignore horizontal support altogether',
        ],
        correct_index: 0,
        explanation: 'Valid trendlines respect price cleanly; repeated violations show the market is ranging or shifting slope.',
      },
      {
        id: 'c7-a5',
        question: 'When does trendline confluence become strongest?',
        options: [
          'When a validated trendline touch intersects an established horizontal S&R zone',
          'When drawn on a 15-second chart with no horizontal context',
          'When price ignores the line three times in a row',
          'When using bright neon colors',
        ],
        correct_index: 0,
        explanation: 'Intersection of diagonal trend support/resistance with horizontal structural zones focuses multiple participants at the same price-time coordinate.',
      },
    ],
    lessons: [
      {
        id: 'lesson-07-01',
        title: 'Selecting Meaningful Swing Points',
        category: 'Trendlines',
        summary: 'Learn how choosing genuine structural swing points prevents forced, arbitrary trendlines.',
        learning_objective: 'Identify valid anchor swings for trendlines without cutting through candle bodies.',
        introduction:
          'Trendlines get a bad reputation when traders force a ruler through random candlesticks to justify a bias. Objectivity begins with anchor selection.',
        content:
          '### Rules for Objective Anchoring\n1. **Connect true structural swings**—noticeable turning points separated by meaningful swings in time and price.\n2. **Avoid slicing through multiple candle bodies** between anchor points; minor wick overhangs are normal, but cutting cleanly across solid closes invalidates the line.\n3. **Consistency**: Whether anchoring strictly to wick extremes or outer body edges, apply the rule consistently rather than cherry-picking.',
        demonstration:
          '1. On a simulated H4 USD/CAD chart, compare a clean line connecting two clear reaction lows spaced 6 days apart vs. a forced line cutting through four bullish bodies.\n2. Only the clean anchor line reflects true trend rhythm.',
        common_mistakes: [
          'Drawing trendlines through the middle of candle bodies to force a third touch.',
          'Connecting two candles sitting right next to each other (too narrow in time).',
        ],
        summary_recap:
          'Anchor trendlines to well-spaced structural swing extremes without cutting through intervening candle bodies.',
        practical_exercise: {
          title: 'Clean Anchor Inspection',
          objective: 'Practice rejecting invalid, body-cutting trendlines.',
          steps: [
            'Open any trending Daily currency chart.',
            'Draw a candidate trendline across two clear swing lows and inspect whether any intervening candle bodies cut right through it.',
          ],
          deliverable: 'Verified clean anchor diagram.',
        },
        visual_key: 'trendline-anatomy',
        duration_minutes: 15,
        tags: ['trendlines', 'swing-points', 'anchoring'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-01-1',
            question: 'What is a red flag that a trendline is forced and unreliable?',
            options: [
              'The line slices straight through multiple solid candle bodies between its anchor points',
              'The line rests underneath two clear swing lows',
              'The line has a gentle 35-degree slope',
              'The line aligns with a Daily swing low',
            ],
            correct_index: 0,
            explanation: 'Cutting through multiple candle bodies indicates you are forcing a line that price does not respect.',
          },
          {
            id: 'q-07-01-2',
            question: 'Why should anchor points be spaced reasonably apart in time?',
            options: [
              'Close-together candles produce erratic, overly steep lines sensitive to tiny noise',
              'Platforms forbid drawing lines shorter than 50 pixels',
              'Spacing increases swap rates',
              'It disables stop-loss orders',
            ],
            correct_index: 0,
            explanation: 'Broader spacing across distinct swing waves establishes meaningful directional slope.',
          },
          {
            id: 'q-07-01-3',
            question: 'Minor wick pokes slightly beyond a trendline are:',
            options: [
              'Normal price dispersion around diagonal zones, provided candle bodies largely respect the line',
              'Impossible in regulated markets',
              'Always proof of a 1,000-pip reversal',
              'Broker platform errors',
            ],
            correct_index: 0,
            explanation: 'Like horizontal S&R, trendlines represent diagonal reaction zones rather than laser beams.',
          },
        ],
      },
      {
        id: 'lesson-07-02',
        title: 'Bullish and Bearish Trendlines',
        category: 'Trendlines',
        summary: 'Draw rising support trendlines in uptrends and falling resistance trendlines in downtrends.',
        learning_objective: 'Construct bullish and bearish trendlines accurately and interpret what each communicates.',
        introduction:
          'In an uptrend, buyers step in at progressively higher lows. Connecting those higher lows visualizes the rising floor supporting the trend.',
        content:
          '### Bullish Trendline (Uptrend Support)\nDrawn **below** price connecting at least two ascending swing lows (`L1 < L2`). It tracks dynamic buying support as long as the market prints higher highs and higher lows.\n\n### Bearish Trendline (Downtrend Resistance)\nDrawn **above** price connecting at least two descending swing highs (`H1 > H2`). It tracks dynamic selling pressure capping bounces during a downtrend.',
        demonstration:
          '1. Simulated Uptrend: Swing Low 1 (`1.0700`) → Swing High 1 (`1.0840`) → Swing Low 2 (`1.0760`) → Swing High 2 (`1.0910`).\n2. Connect `1.0700` to `1.0760` and extend forward to watch where a future pullback meets rising trendline support.',
        common_mistakes: [
          'Drawing an uptrend line across the highs instead of beneath the rising lows.',
          'Trading a downtrend line break as an automatic buy while structure still prints lower highs.',
        ],
        summary_recap:
          'Bullish trendlines connect rising lows beneath price; bearish trendlines connect falling highs above price.',
        practical_exercise: {
          title: 'Dual Trendline Sketch',
          objective: 'Identify one clean bullish trendline and one clean bearish trendline.',
          steps: [
            'Find an uptrending segment on EUR/USD H4 and plot the rising support trendline.',
            'Find a downtrending segment on USD/CHF H4 and plot the falling resistance trendline.',
          ],
          deliverable: 'Two annotated trendline charts showing proper placement above/below price.',
        },
        visual_key: 'trendline-anatomy',
        duration_minutes: 15,
        tags: ['bullish-trendline', 'bearish-trendline'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-02-1',
            question: 'A bearish trendline connects:',
            options: [
              'Descending swing highs above price action',
              'Ascending swing lows beneath price action',
              'Random doji wicks inside a range',
              'Previous day lows only',
            ],
            correct_index: 0,
            explanation: 'Downtrend lines sit above price connecting lower highs to track falling dynamic resistance.',
          },
          {
            id: 'q-07-02-2',
            question: 'Before connecting a bullish trendline from L1 to L2, what should price ideally have done between them?',
            options: [
              'Created a higher high above the intervening peak to confirm an active uptrend wave',
              'Dropped below L1',
              'Stayed completely flat for 10 days',
              'Closed the account',
            ],
            correct_index: 0,
            explanation: 'Confirming a higher high between L1 and L2 verifies genuine upward structure.',
          },
          {
            id: 'q-07-02-3',
            question: 'Does touching a bullish trendline guarantee price will bounce upward?',
            options: [
              'No—look for reaction candles, horizontal confluence, and respect risk rules',
              'Yes, trendlines never break',
              'Yes, if the line is colored green',
              'Only during Tokyo hours',
            ],
            correct_index: 0,
            explanation: 'Trendlines guide attention; confirmation and risk limits are always required.',
          },
        ],
      },
      {
        id: 'lesson-07-03',
        title: 'Touches, Validation, and Line Quality',
        category: 'Trendlines',
        summary: 'Separate speculative two-point lines from three-touch validated trendlines and evaluate quality.',
        learning_objective: 'Apply the three-touch validation principle and assess trendline reliability.',
        introduction:
          'Any two random dots on a page make a straight line. A trendline only becomes meaningful when the market acknowledges it a third time.',
        content:
          '### The Three-Touch Standard\n- **2 Touches (Tentative)**: You can project the line forward as a hypothesis.\n- **3+ Touches (Validated)**: Price reacts respectfully off the line a third time, confirming market participants are acknowledging that tempo.\n\n### Quality Factors\nHigh-quality trendlines feature: (1) higher-timeframe visibility (H4/Daily/Weekly), (2) balanced 25°–45° visual pace rather than near-vertical spikes, and (3) clean directional reactions following each touch.',
        demonstration:
          '1. Draw a tentative bearish line connecting H1 (`1.2900`) and H2 (`1.2810`).\n2. Price rallies to `1.2725`, touches the projected line, prints a bearish rejection wick, and sells off to a new low—validating the third touch.',
        common_mistakes: [
          'Treating a brand-new two-point line with equal confidence to a multi-week 4-touch line.',
          'Forgetting that even a 5-touch trendline will eventually break—the later the touch, the more crowded it becomes.',
        ],
        summary_recap:
          'Two points draw a tentative trendline; a third clean reaction validates it, with higher timeframes carrying superior reliability.',
        practical_exercise: {
          title: 'Touch Counter Exercise',
          objective: 'Catalog trendline lifespan from touch 2 through eventual break.',
          steps: [
            'Find a historical trendline that received 3 or more touches before breaking.',
            'Measure the pip reaction after Touch 3 vs. the eventual Touch 5 break.',
          ],
          deliverable: 'Lifecycle notes on a multi-touch trendline.',
        },
        visual_key: 'trendline-anatomy',
        duration_minutes: 14,
        tags: ['validation', 'touches', 'line-quality'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-03-1',
            question: 'Why are two points alone insufficient to call a trendline "validated"?',
            options: [
              'Any two points can form a straight line mathematically; a third reaction confirms the market respects that slope',
              'TradingView locks lines until 3 touches',
              'Two-point lines always reverse immediately',
              'Spread doubles on two-point lines',
            ],
            correct_index: 0,
            explanation: 'A third respectful bounce demonstrates the slope reflects genuine market rhythm rather than coincidence.',
          },
          {
            id: 'q-07-03-2',
            question: 'Which timeframe generally produces stronger, less noisy trendlines?',
            options: ['H4, Daily, and Weekly', '15-second', '1-minute', 'Tick charts'],
            correct_index: 0,
            explanation: 'Higher timeframes filter erratic intraday noise and align broader participation.',
          },
          {
            id: 'q-07-03-3',
            question: 'True or False: A trendline with 6 touches can still break cleanly on the 7th touch.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. No trend continues indefinitely; crowded late-stage lines routinely snap when trend exhaustion sets in.',
          },
        ],
      },
      {
        id: 'lesson-07-04',
        title: 'Trend Channels (Ascending, Descending, Horizontal)',
        category: 'Trendlines',
        summary: 'Project parallel channel boundaries to frame both trend support and overextended profit-taking targets.',
        learning_objective: 'Draw ascending, descending, and horizontal channels and avoid counter-trend overreach inside strong trends.',
        introduction:
          'When you clone a trendline parallel to the opposite side of price action, you create a channel—helping visualize where rallies stretch and pullbacks stabilize.',
        content:
          '### Three Channel Types\n1. **Ascending Channel**: Parallel upward support line (connecting lows) and upper return line (connecting highs). Favor longs near the lower support rail and manage/take partial profits near the upper rail.\n2. **Descending Channel**: Parallel downward resistance rail and lower target rail. Favor shorts near the upper rail.\n3. **Horizontal Channel (Range)**: Flat parallel floor and ceiling.\n\n**Caution**: Shorting the upper rail of a strong ascending channel is counter-trend and hazardous—use upper rails primarily for profit targets or warning of short-term overextension.',
        demonstration:
          '1. Anchor an ascending trendline across L1 and L2 on simulated EUR/USD.\n2. Duplicate the exact slope parallel across H1.\n3. Observe how price oscillates cleanly between the lower support boundary and upper target rail.',
        common_mistakes: [
          'Aggressively shorting the upper rail of a booming ascending channel.',
          'Adjusting the angle of the upper rail independently instead of keeping it parallel.',
        ],
        summary_recap:
          'Parallel channels frame trend boundaries for both trend-aligned entries and objective target management.',
        practical_exercise: {
          title: 'Parallel Channel Mapping',
          objective: 'Construct and evaluate an ascending or descending channel.',
          steps: [
            'Draw a validated trendline on an H4 chart.',
            'Clone the line parallel to the opposite swing extreme and observe whether subsequent swings respect the channel midline or opposite rail.',
          ],
          deliverable: 'Parallel channel chart highlighting entry rail vs. target rail.',
        },
        visual_key: 'trend-channels-diagram',
        duration_minutes: 16,
        tags: ['channels', 'ascending-channel', 'descending-channel'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-04-1',
            question: 'What is the safest primary use for the upper boundary of an ascending channel?',
            options: [
              'As a target/profit-taking zone or pause warning for existing long positions',
              'As an automatic zero-confirmation short entry with high leverage',
              'As a stop-loss location',
              'To calculate account margin',
            ],
            correct_index: 0,
            explanation: 'Trading with the trend (long near lower support, scaling/managing near upper rail) respects the dominant direction.',
          },
          {
            id: 'q-07-04-2',
            question: 'How should the return line of a classic parallel trend channel be angled?',
            options: [
              'Parallel to the primary trendline',
              'Perpendicular to the primary trendline',
              'Randomly angled to touch more wicks',
              'Always strictly horizontal',
            ],
            correct_index: 0,
            explanation: 'Parallel geometry defines a true channel rather than a converging wedge or broadening pattern.',
          },
          {
            id: 'q-07-04-3',
            question: 'What is another common name for a horizontal channel?',
            options: ['A trading range or consolidation box', 'A parabolic blow-off', 'A carry trade', 'A flash crash'],
            correct_index: 0,
            explanation: 'Horizontal support and resistance form a range-bound channel.',
          },
        ],
      },
      {
        id: 'lesson-07-05',
        title: 'Trendline Slope and Changing Momentum',
        category: 'Trendlines',
        summary: 'Read shallow, balanced, and parabolic slopes to recognize trend acceleration and early exhaustion.',
        learning_objective: 'Interpret what accelerating (steeper) and decelerating (flatter) trendline angles signal about trend health.',
        introduction:
          'Trends rarely climb at one constant speed forever. Observing shifts in trendline angle alerts you early when momentum heats up unsustainably or fades.',
        content:
          '### Slope Diagnostic\n- **Shallow / Healthy (~25°–45° visual pace)**: Balanced pullbacks and advances; often sustainable over weeks or months.\n- **Steepening / Fanning**: Price surges faster, forcing traders to draw a second, steeper internal trendline. Watch carefully: breaking the steep inner line frequently precedes a pullback back to the gentler outer trendline—not necessarily a full reversal.\n- **Flattening / Rollover**: Rallies grow shorter and fail to reach the upper channel, warning buyers are losing strength.',
        demonstration:
          '1. Trace an outer 30° uptrend line alongside a steeper 60° inner trendline.\n2. When the 60° line snaps, price drops smoothly down to retest the original 30° outer line before stabilizing.',
        common_mistakes: [
          'Assuming breaking a 75° parabolic trendline automatically signals a massive new bear market instead of a correction to a flatter pace.',
          'Measuring exact degrees on zoomed charts (always treat angle visually, since zoom ratio changes pixels!).',
        ],
        summary_recap:
          'Monitor outer vs. inner trendline slopes to spot unsustainable acceleration or tiring momentum—keeping chart zoom effects in mind.',
        practical_exercise: {
          title: 'Zoom-Proof Slope Comparison',
          objective: 'See how inner steep trendlines resolve back toward outer trendlines.',
          steps: [
            'Locate a strong rally with an initial gentle slope followed by an accelerating surge.',
            'Draw both the outer and steeper inner lines and note where price paused after breaking the inner line.',
          ],
          deliverable: 'Two-slope diagram notes.',
        },
        visual_key: 'trendline-anatomy',
        duration_minutes: 15,
        tags: ['slope', 'momentum', 'trend-pace'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-05-1',
            question: 'Why is measuring literal trendline "degrees" on screen misleading if you change chart zoom?',
            options: [
              'Scrolling/zooming stretches or compresses axes visually without changing actual price-per-day slope',
              'Monitors distort percentages at night',
              'Brokers alter historical timestamps',
              'Trendlines automatically rotate at market open',
            ],
            correct_index: 0,
            explanation: 'Visual angle changes with aspect ratio; evaluate relative pace and price/time velocity rather than literal protractor degrees.',
          },
          {
            id: 'q-07-05-2',
            question: 'When an ultra-steep inner trendline breaks, what commonly happens next?',
            options: [
              'Price pulls back toward the flatter outer structural trendline or horizontal S&R before deciding direction',
              'The currency ceases trading permanently',
              'Price teleports straight to zero',
              'Margins double',
            ],
            correct_index: 0,
            explanation: 'Unsustainable parabolic bursts often normalize back to the primary trend pace before either resuming or reversing.',
          },
          {
            id: 'q-07-05-3',
            question: 'Successive rallies failing to reach the upper channel rail signal:',
            options: [
              'Potential loss of buying momentum inside the uptrend',
              'Stronger accelerating upside strength',
              'Lower volatility spread guarantee',
              'Central bank intervention certainty',
            ],
            correct_index: 0,
            explanation: 'Failing to reach channel highs reflects waning impulse strength.',
          },
        ],
      },
      {
        id: 'lesson-07-06',
        title: 'Break, Close, and Retest',
        category: 'Trendlines',
        summary: 'Trade or interpret trendline breaks responsibly by pairing candle closes with horizontal structural confirmation.',
        learning_objective: 'Apply candle-close and structural confirmation before acting on a trendline break.',
        introduction:
          'Just because a candle touches or briefly pierces a trendline does not mean the trend has reversed. Confirmation separates patience from whipsaw.',
        content:
          '### Three-Step Trendline Break Protocol\n1. **Decisive Candle Close**: Wait for a full candle body close clearly beyond the trendline on the timeframe you drew the line.\n2. **Structural Confirmation**: Watch for an accompanying shift—such as breaking the last protective swing low (in an uptrend) rather than merely crossing a diagonal line.\n3. **Retest Behavior**: Price often retests the underside of a broken bullish trendline (now acting as diagonal resistance) or pulls back into a horizontal breakdown zone.',
        demonstration:
          '1. Simulated uptrend breaks its rising trendline cleanly with a strong bearish H4 close below both the line and the prior swing low at `1.0860`.\n2. Price rallies lightly back to `1.0860` / underside of the line, prints a bearish rejection candle, and continues lower.',
        common_mistakes: [
          'Reversing your bias immediately on a trendline poke while higher lows remain unbroken.',
          'Ignoring nearby horizontal support waiting 10 pips below the trendline break.',
        ],
        summary_recap:
          'Combine a decisive candle close across the trendline with horizontal swing structure and patient retests.',
        practical_exercise: {
          title: 'Break + Swing Structure Verification',
          objective: 'Confirm why combining trendline break with horizontal swing breaks improves clarity.',
          steps: [
            'Find 3 trendline breaks on H4.',
            'Note which breaks also broke a nearby horizontal swing low/high vs. those that immediately bounced into support.',
          ],
          deliverable: '3-case comparison note.',
        },
        visual_key: 'trendline-break-retest',
        duration_minutes: 17,
        tags: ['trendline-break', 'retest', 'confirmation'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-06-1',
            question: 'Why pair a trendline break with a horizontal swing high/low break?',
            options: [
              'A trendline break alone can merely pause a trend; breaking horizontal structure confirms buyers/sellers lost control',
              'To double broker fees',
              'Because trendlines cannot break on Mondays',
              'To hide stop-losses',
            ],
            correct_index: 0,
            explanation: 'Horizontal swing shifts confirm structural change alongside diagonal trendline breaks.',
          },
          {
            id: 'q-07-06-2',
            question: 'During a trendline break-and-retest short setup, where does price often pull back to test?',
            options: [
              'The underside of the broken bullish trendline and/or the broken horizontal swing low',
              'The next decade high',
              'Exactly 0.0000',
              'Your account balance',
            ],
            correct_index: 0,
            explanation: 'Broken dynamic support often acts as resistance on retest, especially alongside horizontal role reversal.',
          },
          {
            id: 'q-07-06-3',
            question: 'Should you enter immediately on a wick poke beneath a trendline before candle close?',
            options: ['No—wait for candle close confirmation', 'Yes, always chase wicks', 'Only with zero stop-loss', 'Yes during NFP releases'],
            correct_index: 0,
            explanation: 'Waiting for candle close prevents falling for intrabar spring wicks.',
          },
        ],
      },
      {
        id: 'lesson-07-07',
        title: 'False Breaks and Volatility Spikes',
        category: 'Trendlines',
        summary: 'Spot liquidity spikes that snap back across trendlines during news releases or thin liquidity.',
        learning_objective: 'Avoid panic exits and trap entries during temporary trendline spikes.',
        introduction:
          'High-impact economic releases or session opens frequently throw temporary wicks through trendlines before the underlying trend resumes.',
        content:
          '### Why Diagonal False Breaks Happen\nBecause trendlines sit at shifting prices every bar, automated alerts and trailing stops frequently hug them tightly. A sudden news spike can push price 15 pips through the line for two minutes, fill stops, and snap right back inside the channel before the H1 or H4 candle closes.\n\n### Practical Habits\n- Give stops sensible structural room (horizontal swing protection rather than hugging a diagonal pixel).\n- Evaluate breaks on candle closes—especially around CPI, FOMC, or NFP.',
        demonstration:
          '1. Simulated CPI print throws a 25-pip downward spike below an uptrend line.\n2. Within 20 minutes buyers absorb the spike, closing the H1 candle as a long lower hammer tail back above the trendline.',
        common_mistakes: [
          'Trailing a stop-loss 2 pips beneath a rising trendline right before major economic data.',
          'Shorting a news wick across a trendline without waiting for the bar to close.',
        ],
        summary_recap:
          'Wick spikes across trendlines often reflect temporary volatility; protect stops behind horizontal structure and judge breaks by candle close.',
        practical_exercise: {
          title: 'News Wick Inspection',
          objective: 'Observe how scheduled news spikes interact with trendlines.',
          steps: [
            'Check two past CPI or NFP candles on an H1 chart near an active trendline.',
            'Observe wick extension vs. final H1 close.',
          ],
          deliverable: 'Short journal entry on news wick resilience.',
        },
        visual_key: 'trendline-false-break',
        duration_minutes: 15,
        tags: ['false-break', 'volatility', 'news-spikes'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-07-07-1',
            question: 'Why is hugging a trailing stop 2 pips beneath a diagonal trendline fragile before news?',
            options: [
              'Brief volatility spikes and spread widening easily sweep tight diagonal stops before trend resumes',
              'Trendlines vanish during CPI',
              'Brokers lock profit targets',
              'Volatility always moves strictly upward',
            ],
            correct_index: 0,
            explanation: 'Brief spikes plus widened spreads routinely sweep overly tight diagonal stops.',
          },
          {
            id: 'q-07-07-2',
            question: 'What suggests a trendline pierce was a false break?',
            options: [
              'Price quickly snaps back and closes firmly inside the prior trend boundary',
              'Five consecutive full-bodied candles close far outside the line',
              'The market stays closed for a week',
              'Volume drops permanently to zero',
            ],
            correct_index: 0,
            explanation: 'Immediate rejection and recovery close inside the trendline points to a failed break.',
          },
          {
            id: 'q-07-07-3',
            question: 'Where do structural stops generally sit more reliably than pixel-tight trendline stops?',
            options: [
              'Beyond an objective prior swing low/high or horizontal S&R buffer',
              'At 0.0001',
              'Inside the bid-ask spread',
              'Nowhere',
            ],
            correct_index: 0,
            explanation: 'Horizontal swing boundaries provide clearer structural invalidation than tight diagonal lines.',
          },
        ],
      },
      {
        id: 'lesson-07-08',
        title: 'Trendline Confluence with Horizontal Levels',
        category: 'Trendlines',
        summary: 'Locate high-clarity price/time intersections where rising or falling trendlines meet static horizontal S&R.',
        learning_objective: 'Identify diagonal + horizontal intersection zones and plan structured trades around them.',
        introduction:
          'When a horizontal support zone meets an ascending trendline at the exact same price window, both trendline traders and horizontal S&R traders watch the same coordinate.',
        content:
          '### Why Intersections Matter\n- Horizontal S&R identifies **where** buyers or sellers reacted historically (`price`).\n- A trendline estimates **when** the active trend pace reaches that price (`time + price`).\n\nWhen price pulls back into an intersection of a horizontal role-reversal level AND a validated third-touch trendline, your invalidation boundary is crisp and multiple independent buyers often converge.',
        demonstration:
          '1. Horizontal resistance at `1.0820` breaks upward and turns into potential support.\n2. An ascending H4 trendline rises right through `1.0820` two days later.\n3. Price pulls back to `1.0822`, forms a bullish engulfing candle at the exact intersection, and resumes the trend.',
        common_mistakes: [
          'Forcing a horizontal line or bending a trendline just to create a fake intersection.',
          'Skipping confirmation candles at intersections.',
        ],
        summary_recap:
          'Intersecting a valid trendline with an established horizontal S&R zone unites time and price confluence cleanly.',
        practical_exercise: {
          title: 'Crosshair Confluence Hunt',
          objective: 'Locate natural trendline + horizontal S&R intersections.',
          steps: [
            'Plot horizontal S&R zones first on a Daily or H4 chart.',
            'Add valid trendlines second and highlight points where both cross naturally.',
          ],
          deliverable: 'Annotated chart showing 2 natural horizontal + diagonal intersections.',
        },
        visual_key: 'sr-confluence-checklist',
        duration_minutes: 15,
        tags: ['confluence', 'horizontal-sr', 'intersections'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-07-08-1',
            question: 'Which analytical element should generally be mapped FIRST before adding trendlines?',
            options: [
              'Major horizontal S&R zones and swing structure',
              'Intraday 1-minute trendlines',
              'Indicator colors',
              'Social media sentiment',
            ],
            correct_index: 0,
            explanation: 'Horizontal swing levels anchor objective structure; diagonal lines refine timing and pace.',
          },
          {
            id: 'q-07-08-2',
            question: 'Why does a horizontal + trendline intersection draw wider attention?',
            options: [
              'Both trendline-oriented traders and horizontal-level traders observe the same price area simultaneously',
              'Brokers advertise intersections on billboards',
              'It disables slippage',
              'It guarantees a 3:1 target',
            ],
            correct_index: 0,
            explanation: 'Overlapping distinct analytical perspectives increases participant attention at that price window.',
          },
          {
            id: 'q-07-08-3',
            question: 'Should you force an angle change on a trendline to make it touch a horizontal line?',
            options: ['No—never distort objective anchors to fabricate confluence', 'Yes, always bend lines', 'Only on Gold', 'Only on Fridays'],
            correct_index: 0,
            explanation: 'Fabricated confluence destroys analytical objectivity.',
          },
        ],
      },
      {
        id: 'lesson-07-09',
        title: 'When to Redraw or Discard a Line',
        category: 'Trendlines',
        summary: 'Maintain clean charts by adjusting legitimately as new swings print—and deleting obsolete lines promptly.',
        learning_objective: 'Decide objectively when a trendline requires a one-time fan adjustment versus total deletion.',
        introduction:
          'Old, broken trendlines clutter charts and anchor your brain to outdated market conditions. Knowing when to let a line go is a hallmark of clean chart hygiene.',
        content:
          '### Redraw vs. Discard Rules\n- **Adjust once** only if a genuine early trend widens slightly into a cleaner outer swing low while keeping the same directional trend intact.\n- **Discard immediately** if price breaks the line cleanly and shifts horizontal structure, or enters a messy sideways range chopping back and forth across the line.\n\n**Golden Rule**: Never repeatedly tweak a losing trendline five times while holding an underwater trade just to pretend "price is still holding support."',
        demonstration:
          '1. Compare healthy chart maintenance: delete broken 2-week-old trendlines once a new horizontal range forms, leaving clear sightlines for current price structure.',
        common_mistakes: [
          'Micro-adjusting a trendline slightly lower every hour to avoid taking a planned stop-loss.',
          'Leaving 12 obsolete lines from 6 months ago obscuring live candles.',
        ],
        summary_recap:
          'Discard broken or choppy trendlines promptly; never adjust lines retroactively to rationalize holding a losing position.',
        practical_exercise: {
          title: 'Chart Hygiene Declutter',
          objective: 'Practice removing expired analytical objects.',
          steps: [
            'Open your saved practice chart and delete any trendline that has been sliced cleanly more than twice.',
            'Keep only active, respected higher-timeframe lines.',
          ],
          deliverable: 'Cleaned chart before-and-after comparison.',
        },
        visual_key: 'trendline-break-retest',
        duration_minutes: 13,
        tags: ['chart-hygiene', 'redraw', 'discipline'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-07-09-1',
            question: 'What is the worst reason to adjust a trendline slightly lower?',
            options: [
              'To justify moving your stop-loss further away on a losing trade',
              'To include a clean major higher-timeframe swing low when the market settles',
              'To align Daily chart perspective',
              'During weekly chart cleanup before market open',
            ],
            correct_index: 0,
            explanation: 'Moving lines to excuse an invalidated trade destroys risk discipline.',
          },
          {
            id: 'q-07-09-2',
            question: 'When should a trendline be deleted completely?',
            options: [
              'When price transitions into a sideways range cutting repeatedly back and forth across it, or reverses structure',
              'Immediately after Touch 3',
              'Every 5 minutes',
              'Never—keep lines forever',
            ],
            correct_index: 0,
            explanation: 'Obsolete diagonal lines create noise once the market enters a range or new trend.',
          },
          {
            id: 'q-07-09-3',
            question: 'Keeping charts clean and uncluttered improves:',
            options: [
              'Decision clarity, objectivity, and rapid recognition of real horizontal S&R',
              'Account leverage limit',
              'Commission rebates',
              'Server speed on exchanges',
            ],
            correct_index: 0,
            explanation: 'Clean charts keep attention on raw price structure and unambiguous risk boundaries.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-08-indicators-oscillators',
    slug: 'indicators-and-oscillators',
    course_number: 8,
    title: '08. Indicators and Oscillators',
    category: 'Indicators and Oscillators',
    level: 'Intermediate',
    level_label: 'Intermediate',
    description:
      'Master moving averages (SMA/EMA), RSI, MACD, Stochastic, Bollinger Bands, ATR, ADX, Parabolic SAR, Ichimoku, divergence, redundancy avoidance, and regime-aware indicator testing.',
    prerequisites: 'Courses 03, 04, and 06 recommended.',
    learning_outcomes: [
      'Explain the mathematical inputs and lag vs. lead behaviour of common technical indicators.',
      'Use SMA/EMA trend filters, RSI momentum regimes, MACD crossovers/histograms, and Bollinger volatility bands accurately.',
      'Calculate volatility-adjusted stops and targets using Average True Range (ATR).',
      'Eliminate indicator redundancy and evaluate performance across trending versus ranging regimes.',
    ],
    estimated_hours: 4.5,
    cover_image_url: '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    assessment: [
      {
        id: 'c8-a1',
        question: 'Why are moving averages classified as lagging indicators?',
        options: [
          'They average past closing prices, so they turn after price has already started moving',
          'They delay broker order execution by 5 minutes',
          'They predict upcoming central bank hikes automatically',
          'They ignore historical candle closes',
        ],
        correct_index: 0,
        explanation: 'Every moving average computes past prices; lag increases as lookback period lengthens.',
      },
      {
        id: 'c8-a2',
        question: 'In a strong sustained uptrend, what common mistake do traders make with RSI above 70?',
        options: [
          'Blindly shorting "overbought" readings even though strong trends can keep RSI elevated between 55 and 85 for weeks',
          'Using RSI to measure volume on Gold',
          'Thinking RSI 70 means the market is closed',
          'Checking candle closes',
        ],
        correct_index: 0,
        explanation: 'During strong trends, RSI shifts into bullish momentum territory rather than acting as an immediate reversal cap.',
      },
      {
        id: 'c8-a3',
        question: 'What does Average True Range (ATR) measure?',
        options: [
          'Average price movement magnitude (volatility) per candle—not market direction',
          'Buyers vs. sellers win percentage',
          'Exact spread in US dollars',
          'Interest rate differential',
        ],
        correct_index: 0,
        explanation: 'ATR measures realized volatility (including gaps) so traders can adapt stop distances and expectations objectively.',
      },
      {
        id: 'c8-a4',
        question: 'Which setup suffers from severe indicator redundancy (multicollinearity)?',
        options: [
          'Putting RSI(14), Stochastic(14,3,3), and CCI(14) together as "3 separate confirmations"',
          'Pairing Daily horizontal S&R with a 50 EMA trend filter and ATR volatility sizing',
          'Reading ADX alongside candle structure',
          'Combining Bollinger Bands with clear swing support',
        ],
        correct_index: 0,
        explanation: 'Three momentum oscillators calculated over the same lookback window echo essentially identical information.',
      },
      {
        id: 'c8-a5',
        question: 'What does ADX reading above ~25–30 indicate on its own (without checking +DI/-DI)?',
        options: [
          'Strong trend strength/directional movement—in either upward or downward direction',
          'Guaranteed uptrend',
          'Zero market volatility',
          'Mandatory range reversal',
        ],
        correct_index: 0,
        explanation: 'ADX measures trend strength regardless of whether direction is up or down; +DI vs -DI indicates direction.',
      },
    ],
    lessons: [
      {
        id: 'lesson-08-01',
        title: 'Leading vs. Lagging Indicators',
        category: 'Indicators and Oscillators',
        summary: 'Understand how indicators derive exclusively from past price/volume data and why lag vs. responsiveness is a deliberate trade-off.',
        learning_objective: 'Differentiate trend-following lagging overlays from momentum oscillators and understand indicator trade-offs.',
        introduction:
          'Every technical indicator on a retail Forex chart is simply a mathematical transformation of past Open, High, Low, Close, or tick volume data. None possesses mystical predictive power.',
        content:
          '### Two Core Indicator Families\n1. **Lagging / Trend-Following Indicators** (e.g., Moving Averages, MACD crossovers): Smooth out noise to clarify trend direction. Trade-off: slower signals after moves begin, but fewer whipsaws in trends.\n2. **Bounded / Momentum Oscillators** (e.g., RSI, Stochastic): React quickly near turning points by measuring rate-of-change within recent bars. Trade-off: frequent false signals during powerful trends.\n\nIndicators **summarize** price—they never replace raw price structure and risk limits.',
        demonstration:
          '1. Observe a slow 50-bar moving average lagging behind a sudden 150-pip reversal, while RSI drops immediately on bar 2.\n2. Conversely, observe RSI whipsawing inside a strong uptrend while the 50-bar average calmly keeps you aligned with trend direction.',
        common_mistakes: [
          'Searching endlessly for a "zero-lag, never-wrong" magic indicator.',
          'Hiding candlesticks behind 6 overlapping indicators so raw price structure disappears.',
        ],
        summary_recap:
          'Trend indicators trade early entry for noise filtering; oscillators trade speed for higher whipsaw sensitivity in trends.',
        practical_exercise: {
          title: 'Indicator Family Categorization',
          objective: 'Classify indicators before applying them to a chart.',
          steps: [
            'List 4 indicators you have seen traders use.',
            'Label each as trend-lagging, momentum-oscillator, or volatility-measuring, and note its primary limitation.',
          ],
          deliverable: '2-column indicator strengths & limitations table.',
        },
        visual_key: 'indicator-regime-matrix',
        duration_minutes: 15,
        tags: ['indicators', 'lagging', 'oscillators'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-08-01-1',
            question: 'All standard price indicators are calculated from:',
            options: [
              'Historical price (OHLC) and/or volume data',
              'Confidential upcoming central bank memos',
              'Individual trader account sizes',
              'Future closing prices',
            ],
            correct_index: 0,
            explanation: 'Indicators transform historical market data mathematically to aid interpretation.',
          },
          {
            id: 'q-08-01-2',
            question: 'What is the main weakness of trend-following lagging indicators inside a flat sideways range?',
            options: [
              'Frequent late crossovers ("whipsaws") buying highs and selling lows',
              'They stop rendering on screen',
              'They eliminate leverage',
              'They guarantee profits',
            ],
            correct_index: 0,
            explanation: 'In chop, lagging trend crossovers trigger right as swings reverse.',
          },
          {
            id: 'q-08-01-3',
            question: 'What is the main weakness of fast oscillators inside a runaway trend?',
            options: [
              'Staying pinned "overbought" or "oversold" while the trend keeps running against counter-trend fades',
              'Moving too slowly over 200 days',
              'Measuring only spreads',
              'Missing weekend gaps',
            ],
            correct_index: 0,
            explanation: 'Strong momentum keeps oscillators extreme far longer than counter-trend traders expect.',
          },
        ],
      },
      {
        id: 'lesson-08-02',
        title: 'SMA and EMA (Periods and Crossovers)',
        category: 'Indicators and Oscillators',
        summary: 'Compare Simple and Exponential Moving Averages, common lookbacks (20, 50, 200), dynamic support, and crossover traps.',
        learning_objective: 'Calculate the difference between SMA and EMA and apply moving averages as trend filters rather than blind crossover triggers.',
        introduction:
          'Moving averages smooth erratic candle-to-candle noise into a clean visual curve showing average closing price over N bars.',
        content:
          '### SMA vs. EMA\n- **Simple Moving Average (SMA)**: Equal weight on every closing price in the window (e.g., last 50 closes divided by 50). Smoother, widely followed on Daily 50/200 charts.\n- **Exponential Moving Average (EMA)**: Applies extra weight to recent closes, hugging current price changes faster.\n\n### Practical Usage\n- **Trend Filter**: Price trading sustainably above rising 50/200 EMAs favors long setups; below falling EMAs favors shorts.\n- **Dynamic Pullback Zone**: Fast 20/50 EMAs often act as pullback zones during steady trends.\n- **Crossover Caution**: Trading 9/21 crossovers blindly in sideways chop produces heavy whipsaw losses unless paired with trend filters.',
        demonstration:
          '1. Inspect the simulated SMA vs. EMA comparison diagram.\n2. Notice how the `20 EMA` bends sharply after three strong bullish bars while the `50 SMA` responds gradually—demonstrating responsiveness vs. smoothing.',
        common_mistakes: [
          'Optimizing odd lookbacks like "EMA 37 & 114" on past data (curve fitting).',
          'Buying every moving-average crossover inside a tight horizontal range.',
        ],
        summary_recap:
          'EMAs react faster to recent candles than SMAs; use moving averages primarily as trend filters and pullback context.',
        practical_exercise: {
          title: '20 EMA vs. 50 SMA Observation',
          objective: 'Compare moving average behavior in a trend vs. a range.',
          steps: [
            'Overlay a 20 EMA and 50 SMA on EUR/USD Daily.',
            'Count how many times they crossed harmlessly during a 2-month range versus how cleanly they fanned apart during a clear trend.',
          ],
          deliverable: 'Trend vs. Range moving average log.',
        },
        visual_key: 'sma-ema-comparison',
        duration_minutes: 18,
        tags: ['sma', 'ema', 'moving-average'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-02-1',
            question: 'How does an EMA differ mathematically from an SMA of the same period?',
            options: [
              'EMA gives greater weight to the most recent closing prices',
              'EMA averages highs instead of closes',
              'SMA excludes the last candle',
              'EMA eliminates all market lag completely',
            ],
            correct_index: 0,
            explanation: 'Exponential weighting emphasizes recent bars so the EMA responds faster to price turns.',
          },
          {
            id: 'q-08-02-2',
            question: 'During a messy sideways range, what happens to fast moving-average crossover strategies?',
            options: [
              'They generate frequent false crossovers and consecutive small losses (whipsaws)',
              'They achieve 90% win rates',
              'They stay completely flat and take zero trades',
              'They halve spread costs',
            ],
            correct_index: 0,
            explanation: 'Without directional follow-through, crossovers repeatedly trigger near range boundaries right before reversing.',
          },
          {
            id: 'q-08-02-3',
            question: 'Which periods are standard benchmarks tracked broadly across institutional Daily charts?',
            options: ['20, 50, 100, and 200', '3, 7, and 11 only', '17 and 93', '1,000 and 5,000'],
            correct_index: 0,
            explanation: 'Standard benchmarks create shared visibility rather than cherry-picked curve-fit numbers.',
          },
        ],
      },
      {
        id: 'lesson-08-03',
        title: 'RSI and Overbought/Oversold Interpretation',
        category: 'Indicators and Oscillators',
        summary: 'Read the Relative Strength Index (0–100) correctly across both ranging markets and momentum trends.',
        learning_objective: 'Interpret RSI zones contextually instead of treating 70 and 30 as automatic buy/sell signals.',
        introduction:
          'Developed by J. Welles Wilder, the Relative Strength Index (RSI) measures the speed and magnitude of recent upward vs. downward closing changes on a 0–100 scale.',
        content:
          '### Contextual RSI Regimes\n- **In Range-Bound Markets**: Moves toward `70+` near horizontal resistance and `30-` near horizontal support can reflect stretched swings likely to revert toward the range midpoint.\n- **In Strong Trends**: RSI frequently shifts range—in uptrends oscillating between `40` and `80` (using `40–50` as pullback support rather than dropping to `30`). Shorting blindly because RSI hits `72` during a breakout is a classic beginner trap.\n\n### The 50 Midline\nSustained RSI holding above `50` indicates bullish average momentum; below `50` indicates bearish average momentum.',
        demonstration:
          '1. Study the RSI diagram showing two halves: Range Regime (`30–70` oscillation) vs. Bullish Trend Regime (`45–80` range where `45` acts as a pullback floor while `75` persists during the rally).',
        common_mistakes: [
          'Shorting immediately whenever RSI crosses above 70 regardless of trend strength.',
          'Ignoring horizontal S&R when reading RSI.',
        ],
        summary_recap:
          'RSI measures momentum speed on a 0–100 scale; interpret 70/30 within market regime (range vs. trend) rather than blindly fading extremes.',
        practical_exercise: {
          title: 'RSI Regime Shift Audit',
          objective: 'Verify how RSI behaves differently in ranges vs. strong trends.',
          steps: [
            'Plot RSI(14) on GBP/USD Daily.',
            'Identify one 6-week trend and record the lowest RSI level reached on healthy pullbacks (often 40–50, not 30).',
          ],
          deliverable: 'Observed RSI pullback floor notes.',
        },
        visual_key: 'rsi-zones-divergence',
        duration_minutes: 18,
        tags: ['rsi', 'momentum', 'overbought-oversold'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-03-1',
            question: 'During a strong uptrend, where does RSI often stabilize during healthy pullbacks?',
            options: ['Around 40–50 rather than reaching 30', 'Below 10', 'Exactly at 0', 'Strictly at 95'],
            correct_index: 0,
            explanation: 'Bullish trend regimes lift the typical RSI floor toward the 40–50 zone.',
          },
          {
            id: 'q-08-03-2',
            question: 'When are classic 70/30 overbought/oversold signals most relevant?',
            options: [
              'Inside well-defined sideways ranges aligned with horizontal resistance and support',
              'Right after a major surprise central bank rate hike breakout',
              'On every 1-minute candle',
              'During illiquid Sunday opens',
            ],
            correct_index: 0,
            explanation: 'Mean-reversion oscillator levels shine in range-bound conditions, not runaway breakouts.',
          },
          {
            id: 'q-08-03-3',
            question: 'What does RSI sustainably above 50 indicate mathematically?',
            options: [
              'Average upward gains exceeded average downward losses over the lookback period',
              'Price must crash immediately',
              'Broker spreads are widening',
              'A double top has formed',
            ],
            correct_index: 0,
            explanation: 'Above 50 signifies net positive momentum across the calculation window.',
          },
        ],
      },
      {
        id: 'lesson-08-04',
        title: 'MACD Line, Signal Line, and Histogram',
        category: 'Indicators and Oscillators',
        summary: 'Decode the three parts of Moving Average Convergence Divergence (12, 26, 9) and use momentum shifts properly.',
        learning_objective: 'Explain how the MACD line, Signal line, Zero line, and Histogram derive from EMAs and reflect momentum acceleration.',
        introduction:
          'MACD turns moving-average distance into an oscillator, helping traders visualize when trend momentum is accelerating, flattening, or shifting.',
        content:
          '### Three Components (Default 12, 26, 9)\n1. **MACD Line**: `12 EMA - 26 EMA` (distance between fast and slow averages).\n2. **Signal Line**: `9 EMA` of the MACD line itself.\n3. **Histogram**: `MACD Line - Signal Line` plotted as vertical bars above/below zero.\n\n### Practical Readings\n- **Zero-Line Cross**: Marks where the `12 EMA` crosses the `26 EMA` (macro momentum shift).\n- **Histogram Shrinking**: Shows impulse momentum slowing before a crossover occurs—useful warning to tighten management or watch S&R.\n- **Trend Crossovers**: MACD crossing above Signal *above or near zero* in an existing uptrend filters out noisy counter-trend crossovers.',
        demonstration:
          '1. View the MACD component diagram showing expanding bullish histogram bars during an impulse, shrinking histogram bars signaling consolidation, and a bullish signal cross aligned above the zero line.',
        common_mistakes: [
          'Treating every MACD crossover inside a flat range as an automatic directional entry.',
          'Not realizing the MACD zero line is simply a `12/26 EMA` crossover.',
        ],
        summary_recap:
          'MACD tracks convergence/divergence between 12 and 26 EMAs; use the histogram for momentum tempo and zero-line context for trend alignment.',
        practical_exercise: {
          title: 'MACD Zero-Line Alignment Study',
          objective: 'Compare trend-aligned MACD crosses vs. counter-trend crosses.',
          steps: [
            'Apply MACD(12,26,9) to EUR/USD H4.',
            'Highlight 3 signal crossovers occurring in the direction of the Daily trend and compare follow-through against 3 counter-trend crosses.',
          ],
          deliverable: '6-crossover comparison note.',
        },
        visual_key: 'macd-components',
        duration_minutes: 18,
        tags: ['macd', 'histogram', 'momentum'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-04-1',
            question: 'What does the standard MACD line represent mathematically?',
            options: [
              'The difference between a 12-period EMA and a 26-period EMA',
              'Price divided by volume',
              'ATR multiplied by RSI',
              'Today’s spread minus yesterday’s spread',
            ],
            correct_index: 0,
            explanation: 'MACD = EMA(12) - EMA(26); when positive, the fast EMA sits above the slow EMA.',
          },
          {
            id: 'q-08-04-2',
            question: 'What does a shrinking MACD histogram above zero indicate?',
            options: [
              'Upward momentum acceleration is slowing down as the MACD and Signal lines converge',
              'Price has halted trading',
              'A guaranteed 500-pip crash is starting',
              'The 200 SMA flipped upside down',
            ],
            correct_index: 0,
            explanation: 'Histogram bars narrow when gap between MACD and its Signal line closes—warning of deceleration.',
          },
          {
            id: 'q-08-04-3',
            question: 'What happens physically on the price chart whenever the MACD line crosses the zero line?',
            options: [
              'The 12 EMA crosses the 26 EMA',
              'Price returns to 1.0000',
              'Volume hits zero',
              'Spread reaches 10 pips',
            ],
            correct_index: 0,
            explanation: 'Since MACD = EMA12 - EMA26, MACD = 0 precisely when EMA12 equals EMA26.',
          },
        ],
      },
      {
        id: 'lesson-08-05',
        title: 'Stochastic Oscillator',
        category: 'Indicators and Oscillators',
        summary: 'Understand how Stochastic (%K and %D) measures closing location within the recent high-low range.',
        learning_objective: 'Explain Stochastic calculation logic and pair %K/%D signals with structural S&R in ranges or pullbacks.',
        introduction:
          'Unlike RSI (which compares close-to-close changes), the Stochastic Oscillator asks a simple question: *Where did price close relative to its recent N-bar high-low range?*',
        content:
          '### How Stochastic Works\n- In strong uptrends, candles tend to close near the **top** of their recent 14-bar range (`80–100`).\n- In downtrends, candles close near the **bottom** (`0–20`).\n- **%K** is the fast sensitivity line; **%D** is its smoothed moving average.\n\n### Best Practices\n- In a **horizontal range**, `%K` crossing above `%D` out of `<20` *at horizontal support* offers cleaner timing than mid-range crosses.\n- In a **strong uptrend**, use Stochastic dips into `<20` followed by upward cross *only in the trend direction* as pullback timing—never short simply because Stochastic sits above `80`.',
        demonstration:
          '1. Inspect the Stochastic diagram contrasting: (a) clean pullback dip to 18 inside an uptrend resuming upward vs. (b) failed counter-trend short attempt while Stochastic stays above 80 for 12 straight bars.',
        common_mistakes: [
          'Using both Stochastic and RSI simultaneously thinking they give independent edge—they correlate heavily.',
          'Fading Stochastic >80 in a breakout trend.',
        ],
        summary_recap:
          'Stochastic tracks where price closes inside its recent range; use it at S&R boundaries or for trend pullback timing.',
        practical_exercise: {
          title: 'Pullback Timing Drill',
          objective: 'Test Stochastic exclusively in the direction of a Daily trend.',
          steps: [
            'Mark a clear H4 uptrend above a rising 50 EMA.',
            'Observe Stochastic(14,3,3) dips below 30 followed by upward %K/%D crossovers near swing support.',
          ],
          deliverable: '3 trend-aligned Stochastic pullback notes.',
        },
        visual_key: 'stochastic-oscillator',
        duration_minutes: 15,
        tags: ['stochastic', 'oscillator', 'pullback-timing'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-05-1',
            question: 'What does a Stochastic reading near 95 tell you about recent candle closes?',
            options: [
              'Recent prices are closing near the top of their N-bar high-low range',
              'Buyers have completely run out of money',
              'The trend has already reversed downward',
              'Spread is 9.5 pips',
            ],
            correct_index: 0,
            explanation: 'High readings reflect strong closes near recent highs, common in strong uptrends.',
          },
          {
            id: 'q-08-05-2',
            question: 'How should Stochastic be filtered during a clean uptrend?',
            options: [
              'Look for dips/crosses back upward in the trend direction rather than shorting overbought readings',
              'Short every time %K hits 80',
              'Turn off all price candles',
              'Trade only 1-second charts',
            ],
            correct_index: 0,
            explanation: 'Trend-aligned pullback timing aligns oscillator swings with structural direction.',
          },
          {
            id: 'q-08-05-3',
            question: 'Why avoid running RSI and Stochastic together as "double confirmation"?',
            options: [
              'Both measure momentum within recent bars and tend to give simultaneous signals (redundancy)',
              'They cancel each other’s signals out',
              'Platforms charge extra fees for two oscillators',
              'Stochastic is only for stocks',
            ],
            correct_index: 0,
            explanation: 'Pick one primary momentum oscillator so you do not mistake duplicate math for extra evidence.',
          },
        ],
      },
      {
        id: 'lesson-08-06',
        title: 'Bollinger Bands and Volatility Contraction/Expansion',
        category: 'Indicators and Oscillators',
        summary: 'Use John Bollinger’s standard-deviation envelopes (20, 2) to identify volatility squeezes and band walks.',
        learning_objective: 'Explain how Bollinger Bands adapt dynamically to volatility and distinguish a Bollinger Squeeze from a range touch.',
        introduction:
          'Markets alternate endlessly between quiet consolidation and explosive expansion. Bollinger Bands wrap a moving average with dynamic standard-deviation bands that widen and tighten with volatility.',
        content:
          '### Construction (Default 20, 2)\n- **Middle Band**: 20-period SMA.\n- **Upper/Lower Bands**: `±2 standard deviations` above and below the 20 SMA.\n\n### Crucial Principles\n1. **Volatility Cycles**: Tightly pinched bands (**the Bollinger Squeeze**) indicate unusually low volatility—warning that directional expansion may soon arrive (though *not* which direction!).\n2. **Band Walking**: In strong trends, price can "walk the upper or lower band" repeatedly. Touching the upper band is **not** an automatic sell signal—it reflects strength unless rejected back inside near clear horizontal resistance.',
        demonstration:
          '1. Examine the Bollinger Squeeze diagram showing narrow compressed bands across a tight range, followed by an expansion breakout where bands flare wide apart as price walks the upper band.',
        common_mistakes: [
          'Shorting immediately whenever a candle touches the upper Bollinger Band during an expansion breakout.',
          'Assuming a tight Squeeze tells you whether price will break UP or DOWN (wait for structural confirmation).',
        ],
        summary_recap:
          'Bollinger Bands adapt to volatility; tight squeezes foreshadow expansion, while outer touches require S&R context—never automatic fades.',
        practical_exercise: {
          title: 'Volatility Cycle Inspection',
          objective: 'Observe transitions from tight Bollinger Squeezes into expansion moves.',
          steps: [
            'Plot Bollinger Bands (20, 2) on EUR/USD H4.',
            'Locate two narrow pinch periods and watch how price moved once bands began flaring apart.',
          ],
          deliverable: 'Annotated squeeze-to-expansion examples.',
        },
        visual_key: 'bollinger-bands-squeeze',
        duration_minutes: 17,
        tags: ['bollinger-bands', 'volatility', 'squeeze'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-08-06-1',
            question: 'What does a tight "Bollinger Squeeze" indicate?',
            options: [
              'Abnormally low volatility contraction, often preceding a period of stronger price expansion',
              'A guaranteed upward rally',
              'Broker platform freeze',
              'Zero commission trading',
            ],
            correct_index: 0,
            explanation: 'Low volatility regimes tend to cycle into high volatility expansion, though direction still requires breakout confirmation.',
          },
          {
            id: 'q-08-06-2',
            question: 'Why is automatically selling every upper Bollinger Band touch dangerous?',
            options: [
              'During strong trends, price can repeatedly "walk the upper band" for many consecutive candles',
              'Upper bands only update once a month',
              'Lower bands disappear during trends',
              'It reverses your stop-loss',
            ],
            correct_index: 0,
            explanation: 'Standard deviation bands expand outward and can be walked continuously during strong directional thrusts.',
          },
          {
            id: 'q-08-06-3',
            question: 'What determines the distance of the upper and lower Bollinger Bands from the 20 SMA?',
            options: [
              'Recent closing-price standard deviation (volatility)',
              'Fixed 50-pip offset',
              'Central bank interest rate',
              'Broker spread width',
            ],
            correct_index: 0,
            explanation: 'Standard deviation automatically scales band width to current market volatility.',
          },
        ],
      },
      {
        id: 'lesson-08-07',
        title: 'ATR for Volatility and Stop-Distance Context',
        category: 'Indicators and Oscillators',
        summary: 'Measure realistic candle volatility using Average True Range (ATR) to size stops objectively and avoid arbitrary fixed pip stops.',
        learning_objective: 'Use ATR(14) to compare instrument volatility, set sensible stop buffers, and recognize quiet vs. hyper-volatile regimes.',
        introduction:
          'Placing an identical 15-pip stop-loss on EUR/USD during a sleepy August week and on GBP/JPY during high inflation volatility makes zero mathematical sense. ATR solves this.',
        content:
          '### Measuring True Volatility\nAverage True Range (**ATR**, default 14 periods) averages the **True Range** of each bar—accounting for candle high-to-low range plus any gaps from the previous close.\n\n### Practical Applications\n1. **Volatility-Adjusted Stop Buffers**: Adding `0.5 × ATR` to `1 × ATR` beyond a structural S&R level helps keep normal market noise from grazing your stop.\n2. **Adaptive Position Sizing**: When Daily ATR jumps from 55 pips to 110 pips, widening stops safely requires reducing lot size proportionally so dollar risk stays constant!\n3. **Target Realism**: If Daily ATR(14) on EUR/USD is 65 pips and price has already moved 60 pips today, expecting another 80 pips intraday without a catalyst ignores typical range reality.',
        demonstration:
          '1. Simulated Pair A has Daily `ATR(14) = 60 pips`; Pair B has `ATR(14) = 120 pips`.\n2. Using a `1.0 × ATR` stop-distance buffer with a `$100` risk cap: Pair A gets `0.16 lots` (`60 pip stop`), while Pair B gets `0.08 lots` (`120 pip stop`)—equal dollar risk adjusted to volatility.',
        common_mistakes: [
          'Forgetting that ATR shows magnitude only—an rising ATR can occur in either crashes or rallies.',
          'Forcing tiny fixed 10-pip stops when H1 ATR alone is 28 pips.',
        ],
        summary_recap:
          'ATR quantifies realized candle volatility so stops, targets, and lot sizes adapt intelligently across instruments and regimes.',
        practical_exercise: {
          title: 'ATR-Normalized Risk Audit',
          objective: 'Compare Daily ATR across three pairs and scale position sizes inversely.',
          steps: [
            'Check Daily ATR(14) on EUR/USD, GBP/JPY, and XAU/USD in the Markets view or chart.',
            'Use the Academy Position Size Calculator to see how lot size changes when stop distance scales with ATR.',
          ],
          deliverable: '3-instrument ATR-adjusted position size table.',
        },
        visual_key: 'volatility-atr-diagram',
        duration_minutes: 18,
        tags: ['atr', 'volatility', 'stop-placement'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-07-1',
            question: 'Does a rising ATR indicate prices are rising or falling?',
            options: [
              'Neither—ATR measures volatility magnitude regardless of direction',
              'Strictly bullish uptrends',
              'Strictly bearish crashes',
              'Falling spreads',
            ],
            correct_index: 0,
            explanation: 'ATR captures range expansion in either upward or downward moves.',
          },
          {
            id: 'q-08-07-2',
            question: 'If Daily ATR doubles and you widen your stop from 50 pips to 100 pips while risking the exact same $100, what happens to your lot size?',
            options: [
              'It is cut in half',
              'It doubles',
              'It stays identical',
              'It goes to zero',
            ],
            correct_index: 0,
            explanation: 'Position size = Dollar Risk / (Stop Pips × Pip Value). Doubling stop distance halves lot size to maintain fixed risk.',
          },
          {
            id: 'q-08-07-3',
            question: 'Why does True Range include the prior bar’s close rather than only High minus Low?',
            options: [
              'To capture overnight or weekend price gaps accurately',
              'To double ATR visually',
              'To hide large wicks',
              'To calculate broker commission',
            ],
            correct_index: 0,
            explanation: 'True Range takes the greatest of (H-L), |H - PrevClose|, and |L - PrevClose| so gaps count toward volatility.',
          },
        ],
      },
      {
        id: 'lesson-08-08',
        title: 'ADX and Directional Movement',
        category: 'Indicators and Oscillators',
        summary: 'Separate trending environments from sleepy ranges objectively using Wilder’s Average Directional Index.',
        learning_objective: 'Read ADX trend-strength thresholds alongside +DI and -DI directional lines.',
        introduction:
          'Most indicator disasters occur when traders run trend-following strategies inside a sideways range. ADX helps answer: *Is this market actually trending?*',
        content:
          '### Three Lines of DMI/ADX\n- **+DI**: Upward directional pressure.\n- **-DI**: Downward directional pressure.\n- **ADX**: Non-directional trend **strength** (`0–100`).\n\n### Practical Guidelines\n- **ADX < 20**: Weak directional trend / consolidation—avoid breakout chases and trend-following moving-average crossovers.\n- **ADX rising above 25**: Strengthening directional trend (upward if `+DI > -DI`; downward if `-DI > +DI`).\n- **ADX > 45–50 and flattening**: Mature extended trend—watch for pullback or exhaustion rather than late chasing.',
        demonstration:
          '1. View the ADX diagram illustrating `ADX = 14` during a flat horizontal range (trend-crossover filter turns OFF), then `ADX` climbing past `28` with `+DI > -DI` confirming emerging bullish trend strength.',
        common_mistakes: [
          'Assuming ADX turning upward means price is rising—it can mean a fierce downtrend (`-DI > +DI`)!',
          'Ignoring ADX lag after sudden V-shaped reversals.',
        ],
        summary_recap:
          'ADX quantifies trend strength (<20 range vs. >25 trend), while +DI vs -DI indicates upward or downward bias.',
        practical_exercise: {
          title: 'Regime Filter Test',
          objective: 'Use ADX(14) to distinguish choppy vs. trending weeks.',
          steps: [
            'Plot ADX(14) with +DI/-DI on EUR/USD H4.',
            'Highlight periods where ADX stayed under 20 and verify how moving-average crossovers behaved there.',
          ],
          deliverable: 'Annotated ADX < 20 filter observation.',
        },
        visual_key: 'adx-ichimoku-overview',
        duration_minutes: 15,
        tags: ['adx', 'dmi', 'trend-strength'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-08-1',
            question: 'If ADX rises sharply from 18 to 36 while -DI is far above +DI, what is happening?',
            options: [
              'A strengthening downtrend',
              'A strengthening uptrend',
              'A completely flat sideways market',
              'Market closure',
            ],
            correct_index: 0,
            explanation: 'Rising ADX signals strengthening directional flow; -DI above +DI identifies bearish direction.',
          },
          {
            id: 'q-08-08-2',
            question: 'An ADX reading lingering around 14 generally favors:',
            options: [
              'Range boundaries or standing aside rather than trend-following crossovers',
              'High-leverage trend pyramid entries',
              'Eliminating stop-losses',
              'Expecting instant 300-pip trend waves',
            ],
            correct_index: 0,
            explanation: 'Low ADX reflects weak directional commitment typical of range-bound markets.',
          },
          {
            id: 'q-08-08-3',
            question: 'What is ADX’s primary limitation?',
            options: [
              'It lags sharp V-shaped reversals because it averages multiple bars of directional movement',
              'It changes spread fees',
              'It only works on 1-minute charts',
              'It cannot be plotted on EUR/USD',
            ],
            correct_index: 0,
            explanation: 'Smoothing makes ADX reliable for regime filtering but slow on sudden reversals.',
          },
        ],
      },
      {
        id: 'lesson-08-09',
        title: 'Parabolic SAR and Ichimoku Overview',
        category: 'Indicators and Oscillators',
        summary: 'Survey two distinct systematic visual tools: trailing Parabolic SAR dots and multi-component Ichimoku Kinko Hyo.',
        learning_objective: 'Understand the role and range-whipsaw weakness of Parabolic SAR and the core cloud framework of Ichimoku.',
        introduction:
          'Beyond single-line moving averages, systems like Parabolic SAR and Ichimoku pack trend direction, support/resistance clouds, and trailing exit cues into visual overlays.',
        content:
          '### Parabolic SAR (Stop and Reverse)\nPlots accelerating dots below price in uptrends and above price in downtrends. Works cleanly as a **trailing stop-management guide** during strong trends, but flips continuously back and forth (whipsaw) inside horizontal ranges.\n\n### Ichimoku Kinko Hyo ("One Glance Equilibrium")\nCombines five calculations, centered around the **Kumo (Cloud)** formed between Senkou Span A and Span B:\n- Price above a bullish cloud indicates broader upward bias; inside the cloud signals consolidation/indecision.\n- **Tenkan-sen / Kijun-sen** track short- vs. medium-term equilibrium.\n- Note: Ichimoku looks visually dense at first—only adopt it if you learn every component rather than cherry-picking crosses.',
        demonstration:
          '1. Review the diagram contrasting Ichimoku Cloud trend clarity (price cleanly above cloud) vs. messy mid-cloud chop, alongside Parabolic SAR trailing dots.',
        common_mistakes: [
          'Using Parabolic SAR dots as standalone reversal signals in flat ranges.',
          'Adding Ichimoku on top of 4 other indicators—Ichimoku is already a complete multi-factor system.',
        ],
        summary_recap:
          'Parabolic SAR offers accelerating trailing guides in strong trends; Ichimoku frames multi-horizon equilibrium around the Kumo cloud.',
        practical_exercise: {
          title: 'Cloud Equilibrium Observation',
          objective: 'Evaluate how price behaves above, inside, and below the Ichimoku Cloud.',
          steps: [
            'Apply standard Ichimoku (9, 26, 52) on a clean H4 USD/JPY chart.',
            'Note whether choppy consolidations correspond to price sitting directly inside the cloud.',
          ],
          deliverable: 'Short note on cloud-interior vs. cloud-breakout regimes.',
        },
        visual_key: 'adx-ichimoku-overview',
        duration_minutes: 16,
        tags: ['ichimoku', 'parabolic-sar', 'kumo'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-09-1',
            question: 'In Ichimoku analysis, when price trades directly inside the Kumo (Cloud), market conditions typically reflect:',
            options: [
              'Consolidation, equilibrium, or noisy transition where trend signals carry higher risk',
              'The strongest guaranteed uptrend possible',
              'Zero market spread',
              'Imminent exchange shutdown',
            ],
            correct_index: 0,
            explanation: 'Inside the cloud, short- and medium-term trend balances overlap, signaling consolidation.',
          },
          {
            id: 'q-08-09-2',
            question: 'What is Parabolic SAR’s biggest vulnerability?',
            options: [
              'Repeatedly flipping above and below price during sideways ranges',
              'Ignoring price highs and lows',
              'Working only on Gold',
              'Refusing to update during London hours',
            ],
            correct_index: 0,
            explanation: 'Parabolic SAR assumes price is always trending and whipsaws badly in tight ranges.',
          },
          {
            id: 'q-08-09-3',
            question: 'If you adopt Ichimoku on a chart, should you also stack MACD, Bollinger Bands, Stochastic, and 3 EMAs?',
            options: [
              'No—Ichimoku already summarizes multiple trend horizons; stacking extras causes clutter and confusion',
              'Yes, the more lines the higher the profit',
              'Only if each line is red',
              'Yes, to slow down the computer',
            ],
            correct_index: 0,
            explanation: 'Ichimoku is designed as a self-contained visual framework.',
          },
        ],
      },
      {
        id: 'lesson-08-10',
        title: 'Divergence and Hidden Divergence',
        category: 'Indicators and Oscillators',
        summary: 'Detect weakening impulse momentum (regular divergence) and trend-continuation setups (hidden divergence) on RSI or MACD.',
        learning_objective: 'Distinguish regular reversal divergence from hidden continuation divergence without blindly front-running trends.',
        introduction:
          'When price pushes to a fresh high while an oscillator makes a lower high, momentum is diverging from price—acting like a yellow caution light rather than a guaranteed stop sign.',
        content:
          '### Two Forms of Divergence\n1. **Regular Divergence (Momentum Slowing / Reversal Warning)**:\n   - *Bearish*: Price prints a **Higher High**, oscillator prints a **Lower High**.\n   - *Bullish*: Price prints a **Lower Low**, oscillator prints a **Higher Low**.\n2. **Hidden Divergence (Trend Continuation)**:\n   - *Bullish Hidden*: In an uptrend, price prints a **Higher Low**, while the oscillator dips to a **Lower Low** (showing the pullback reset oscillator energy while structure held higher!).\n\n### Critical Warning\nStrong trends routinely print triple regular divergence while marching higher. Never short divergence alone—require a **price-structure break or horizontal resistance reaction** first.',
        demonstration:
          '1. Study the side-by-side RSI divergence diagram comparing Regular Bearish Divergence at major resistance vs. Bullish Hidden Divergence at a higher-low trend pullback.',
        common_mistakes: [
          'Shorting immediately on the first regular bearish divergence during a booming uptrend without structural confirmation.',
          'Confusing highs vs. lows when checking hidden divergence.',
        ],
        summary_recap:
          'Regular divergence warns of fading momentum at key levels; hidden divergence flags trend-continuation pullbacks—always pair with price confirmation.',
        practical_exercise: {
          title: 'Divergence Filter Check',
          objective: 'Compare failed divergence traps vs. confirmed divergence reactions at S&R.',
          steps: [
            'Spot 2 regular divergences in an open chart.',
            'Check which sat directly at higher-timeframe S&R + broke minor structure vs. which happened mid-trend and got steamrolled.',
          ],
          deliverable: 'Annotated divergence comparison notes.',
        },
        visual_key: 'rsi-zones-divergence',
        duration_minutes: 18,
        tags: ['divergence', 'hidden-divergence', 'rsi'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-08-10-1',
            question: 'What defines Regular Bearish Divergence?',
            options: [
              'Price makes a Higher High while the oscillator makes a Lower High',
              'Price makes a Lower Low while the oscillator makes a Higher Low',
              'Price and oscillator both make Higher Highs',
              'Price stays flat while volume drops',
            ],
            correct_index: 0,
            explanation: 'Price reaching higher while momentum peaks lower signals waning upside thrust.',
          },
          {
            id: 'q-08-10-2',
            question: 'What does Bullish Hidden Divergence signify inside an active uptrend?',
            options: [
              'Price holds a Higher Low while the oscillator drops to a Lower Low—a potential trend-continuation reset',
              'Immediate downtrend crash',
              'Guaranteed range market',
              'Broker spread widening',
            ],
            correct_index: 0,
            explanation: 'Hidden divergence aligns with trend continuation after a deeper oscillator pullback.',
          },
          {
            id: 'q-08-10-3',
            question: 'Why must you wait for price confirmation before acting on regular divergence?',
            options: [
              'Trends can stack multiple consecutive divergences before finally turning',
              'Oscillators update two weeks late',
              'Brokers forbid divergence trades',
              'Divergence only works in crypto',
            ],
            correct_index: 0,
            explanation: 'Divergence warns of deceleration, not the exact moment a trend turns.',
          },
        ],
      },
      {
        id: 'lesson-08-11',
        title: 'Indicator Combinations, Redundancy, and Parameter Selection',
        category: 'Indicators and Oscillators',
        summary: 'Design clean, non-redundant indicator pairings and avoid overfitting parameters to yesterday’s chart.',
        learning_objective: 'Build a minimal, complementary indicator toolkit (at most 1 trend + 1 momentum/volatility tool) with robust standard parameters.',
        introduction:
          'New traders often build "Christmas tree" charts stuffed with eight indicators. More indicators rarely improve accuracy—they usually create paralysis or false confidence from duplicated math.',
        content:
          '### Avoiding Multicollinearity (Redundancy)\nPutting RSI + Stochastic + CCI + Williams %R together gives you four versions of one momentum question. If they all agree, you haven’t found four reasons—you found **one** reason counted four times.\n\n### Complementary Combination Principle\nPair **distinct dimensions** alongside price structure:\n- **Dimension 1 (Structure)**: Clean S&R zones and swing highs/lows (mandatory foundation).\n- **Dimension 2 (Trend Filter)**: e.g., `50 EMA` or `ADX`.\n- **Dimension 3 (Volatility or Timing)**: e.g., `ATR(14)` for stop sizing OR `RSI(14)` for timing.\n\nStick to standard parameters (`14`, `20`, `50`, `200`) rather than curve-fitting `RSI(11)` and `EMA(43)` to match last Tuesday’s wiggle.',
        demonstration:
          '1. Compare Chart A (7 overlapping oscillators/lines obscuring candles) against Chart B (clean candles + S&R zones + 50 EMA + ATR(14) readout).\n2. Notice how Chart B answers Direction, Location, Trigger, and Volatility Risk in under 3 seconds.',
        common_mistakes: [
          'Tweaking indicator settings every week after a losing streak (parameter hopping).',
          'Using zero price structure and relying 100% on indicator crossovers.',
        ],
        summary_recap:
          'Select at most 1–2 complementary, non-redundant indicators with standard settings to support—never obscure—price structure.',
        practical_exercise: {
          title: 'Chart Minimalist Audit',
          objective: 'Strip redundant indicators down to one clean, purposeful stack.',
          steps: [
            'Write down your ideal simplified template: Price Structure + maximum 2 indicators covering different dimensions.',
            'Explain in one sentence what unique question each indicator answers.',
          ],
          deliverable: '3-item minimal chart template card.',
        },
        visual_key: 'indicator-regime-matrix',
        duration_minutes: 16,
        tags: ['redundancy', 'parameters', 'chart-template'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-08-11-1',
            question: 'Which indicator combination avoids redundancy by covering distinct analytical dimensions?',
            options: [
              'Horizontal S&R + 50 EMA (trend) + ATR(14) (volatility)',
              'RSI(14) + Stochastic(14) + CCI(14)',
              'SMA(20) + EMA(20) + WMA(20)',
              'Three identical MACDs with slightly shifted colors',
            ],
            correct_index: 0,
            explanation: 'Structure, trend direction, and volatility size answer three genuinely different questions.',
          },
          {
            id: 'q-08-11-2',
            question: 'What danger arises from constantly tuning indicator parameters (e.g., testing EMA 37 vs. 39) until last month looks profitable?',
            options: [
              'Curve fitting / overfitting to past noise that breaks forward in live markets',
              'Permanent guaranteed accuracy',
              'Lower spread charges',
              'Elimination of risk',
            ],
            correct_index: 0,
            explanation: 'Tailoring odd parameters to historical wiggles usually fails out-of-sample.',
          },
          {
            id: 'q-08-11-3',
            question: 'Should indicator lines ever hide or obscure candle highs, lows, and closes?',
            options: ['No—price action and structure remain primary', 'Yes, candles are optional', 'Only on weekends', 'Yes on 5-minute charts'],
            correct_index: 0,
            explanation: 'Indicators serve price context, never the reverse.',
          },
        ],
      },
      {
        id: 'lesson-08-12',
        title: 'Testing Indicators Across Market Regimes',
        category: 'Indicators and Oscillators',
        summary: 'Evaluate how every indicator performs across trending, ranging, high-volatility, and quiet regimes before relying on it.',
        learning_objective: 'Test an indicator systematically across contrasting market regimes and record regime-specific failure modes.',
        introduction:
          'An indicator setup that shines during a clean 3-month macro trend can bleed relentlessly during a choppy summer consolidation. Testing across regimes cures unrealistic expectations.',
        content:
          '### Four Core Market Regimes\n1. **Clean Directional Trend** (trend indicators thrive; naive counter-trend oscillators suffer).\n2. **Wide Horizontal Range** (oscillators at S&R boundaries thrive; trend crossovers whipsaw).\n3. **High-Volatility Event Shock** (news spikes distort moving averages and widen spreads).\n4. **Tight Low-Volatility Compression** (small chop generates noise until a Bollinger/ATR expansion breaks out).\n\nAlways test rules across **all four environments** across at least 100+ historical sample occurrences rather than cherry-picking one flattering week.',
        demonstration:
          '1. Review the Regime Matrix showing Trend vs. Range vs. High-Vol behavior for Moving Averages, RSI, Bollinger Bands, and ATR.\n2. Notice there is no universal "all-weather indicator"—the skill lies in matching the tool to current regime.',
        common_mistakes: [
          'Testing a trend strategy solely on a huge 2022-style dollar rally and believing it works identically during sideways quarters.',
          'Abandoning a sound indicator rule after 3 losses during an incompatible regime.',
        ],
        summary_recap:
          'No indicator performs identically in trends and ranges; evaluate tools across multiple regimes and recognize when conditions say stand aside.',
        practical_exercise: {
          title: 'Two-Regime Stress Test',
          objective: 'Test one indicator rule in both a trending month and a ranging month.',
          steps: [
            'Pick one pair on H4 and mark a 4-week trending period and a 4-week sideways period.',
            'Log theoretical signals from a 20/50 EMA cross or RSI(14) across both periods and compare outcome quality.',
          ],
          deliverable: 'Trending vs. Ranging regime comparison log.',
        },
        visual_key: 'indicator-regime-matrix',
        duration_minutes: 17,
        tags: ['market-regimes', 'backtesting', 'evaluation'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-08-12-1',
            question: 'Why must an indicator method be tested across both trending and ranging historical windows?',
            options: [
              'Most methods perform well in one regime and struggle in the other; testing both reveals true expectancy and drawdown behavior',
              'To make charts look longer',
              'Because regulators check H4 colors',
              'To guarantee future returns',
            ],
            correct_index: 0,
            explanation: 'Regime awareness prevents mistaking favorable temporary conditions for permanent edge.',
          },
          {
            id: 'q-08-12-2',
            question: 'Which market regime tends to challenge pure trend-following moving-average crossovers most?',
            options: ['Low-directional sideways ranges', 'Steady multi-month macro trends', 'Clean post-breakout pullbacks', 'Balanced channel trends'],
            correct_index: 0,
            explanation: 'Sideways chop reverses moves right after lagging crossovers fire.',
          },
          {
            id: 'q-08-12-3',
            question: 'Does passing a historical indicator test guarantee future live profits?',
            options: [
              'No—past behavior provides discipline and realistic expectations, not guarantees, and live trading involves slippage and psychology',
              'Yes, 100% guaranteed',
              'Yes if sample size is 5 trades',
              'Only on demo accounts',
            ],
            correct_index: 0,
            explanation: 'Historical testing builds statistical familiarity while respecting future market uncertainty.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-09-price-action',
    slug: 'price-action',
    course_number: 9,
    title: '09. Price Action',
    category: 'Price Action',
    level: 'Intermediate',
    level_label: 'Intermediate',
    description:
      'Analyze raw candlestick behavior, swing structure, BOS/MSS shifts, inside/outside bars, liquidity sweeps, Fair Value Gaps, Order Blocks (framed honestly as interpretive frameworks), premium/discount zones, and repeatable price-action checklists.',
    prerequisites: 'Courses 03, 04, and 06 recommended.',
    learning_outcomes: [
      'Read swing structure, momentum vs. rejection candles, and inside/outside volatility contractions.',
      'Differentiate Break of Structure (BOS) continuations from Market Structure Shifts (MSS / ChoCh).',
      'Critically apply liquidity sweeps, Fair Value Gaps (FVG), and Order Blocks as analytical price-action frameworks—not guaranteed bank footprints.',
      'Execute clean multi-timeframe top-down price-action plans using a repeatable written checklist.',
    ],
    estimated_hours: 4.5,
    cover_image_url: '/src/assets/images/hero_light_trading_1795086732029.jpg',
    assessment: [
      {
        id: 'c9-a1',
        question: 'What distinguishes raw price-action trading from indicator-driven trading?',
        options: [
          'Decisions rely primarily on candle behavior, market structure, swing highs/lows, and S&R context rather than lagging indicator signals',
          'Price-action traders do not use stop-losses',
          'Price-action trading eliminates market risk',
          'Price-action charts hide candlesticks',
        ],
        correct_index: 0,
        explanation: 'Price action emphasizes reading structure, location, and candle reactions directly from OHLC price history.',
      },
      {
        id: 'c9-a2',
        question: 'In structured market terminology, what does a Market Structure Shift (MSS / ChoCh) warn about?',
        options: [
          'A break of the opposing key swing point suggesting the prior intraday/swing trend direction may be shifting',
          'Automatic central bank rate change',
          'Continuation of the existing trend without pullback',
          'Mandatory spread reduction',
        ],
        correct_index: 0,
        explanation: 'While BOS extends the prevailing trend, MSS breaks the opposing structural low/high that protected that trend.',
      },
      {
        id: 'c9-a3',
        question: 'What is the balanced, objective truth regarding concepts like "Order Blocks", "FVGs", and "Liquidity Sweeps"?',
        options: [
          'They are useful structured price-action vocabulary for imbalance and stop-cluster zones—not verified knowledge of exact bank order books',
          'They show literal live institutional order tickets inside retail brokers',
          'They never fail when drawn correctly',
          'They are regulated trading guarantees',
        ],
        correct_index: 0,
        explanation: 'Retail candlestick charts show price history, not institutional identity; Smart Money Concepts are interpretive frameworks requiring confirmation and risk limits.',
      },
      {
        id: 'c9-a4',
        question: 'In a bullish impulse leg from $100 to $110, what does the "Discount Zone" represent?',
        options: [
          'The lower 50% of the range ($100–$105), offering better structural value and tighter invalidation than chasing near $110',
          'A coupon code from a broker',
          'Prices above $110',
          'Negative spread hours',
        ],
        correct_index: 0,
        explanation: 'Buying pullbacks in the lower half of an upswing offers better Reward-to-Risk geometry than buying extended highs.',
      },
      {
        id: 'c9-a5',
        question: 'When dropping from a Daily/H4 bias down to M15 for execution, which timeframe takes priority?',
        options: [
          'The higher timeframe (Daily/H4) dictates major zones and direction; M15 refines entry timing only',
          'M15 dictates Daily direction',
          '1-minute overrides Weekly resistance',
          'Whichever chart looks prettier',
        ],
        correct_index: 0,
        explanation: 'Top-down discipline respects higher-timeframe structure first and uses lower timeframes for precision.',
      },
    ],
    lessons: [
      {
        id: 'lesson-09-01',
        title: 'Price-Action Principles and Context',
        category: 'Price Action',
        summary: 'Learn why location and trend context give every candlestick pattern its meaning.',
        learning_objective: 'Evaluate price action through the lens of Context (Trend/Range), Location (Key Zones), and Reaction (Candles).',
        introduction:
          'A bullish pin bar sitting in empty space in the middle of nowhere means almost nothing. That identical pin bar rejecting a Weekly support zone means everything.',
        content:
          '### The Three Pillars of Price Action\n1. **Context (Regime & Bias)**: Is the higher timeframe trending bullishly, trending bearishly, or consolidating inside a wide range?\n2. **Location (Key Reference Zones)**: Is price interacting with horizontal S&R, PDH/PDL, a trendline, or a structural swing boundary?\n3. **Reaction (Candle Behaviour)**: How are candles printing *at* that location—strong absorption wicks, engulfing displacement, or sluggish indecision?\n\nWithout Context and Location, candlestick patterns become random coin flips.',
        demonstration:
          '1. Compare two identical bullish hammers: Hammer A sits randomly mid-range on M15; Hammer B forms right on H4 broken-resistance-turned-support after an orderly pullback.\n2. Only Hammer B carries clean Context + Location alignment.',
        common_mistakes: [
          'Memorizing candle shapes without checking *where* on the chart they appeared.',
          'Calling a trade "price action" as an excuse for having no structured plan.',
        ],
        summary_recap:
          'Price action is never just candle shapes—it is Context + Location + Reaction working together.',
        practical_exercise: {
          title: 'Context-Location-Reaction Labeling',
          objective: 'Practice rejecting mid-range candles that lack key level context.',
          steps: [
            'Locate two engulfing candles on an H1 chart.',
            'Grade each on whether it occurred at a meaningful higher-timeframe level or randomly mid-swing.',
          ],
          deliverable: '2-example Context-Location scorecard.',
        },
        visual_key: 'price-action-rejection-momentum',
        duration_minutes: 15,
        tags: ['price-action', 'context', 'location'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-09-01-1',
            question: 'What are the three sequential questions of sound price-action analysis?',
            options: [
              'Context (trend/range) → Location (key level) → Reaction (candle behavior)',
              'Leverage → Indicator Color → Social Media',
              'Entry → Hope → Pray',
              'Spread → Swap → Logo',
            ],
            correct_index: 0,
            explanation: 'Location and broader structure validate what any individual candle reaction implies.',
          },
          {
            id: 'q-09-01-2',
            question: 'Why should an isolated pin bar in the middle of nowhere be ignored?',
            options: [
              'Without a key S&R level or structural zone, a single wick reflects routine intraday noise',
              'Brokers block orders in mid-range',
              'Pin bars are illegal in Europe',
              'Mid-range candles have double spreads',
            ],
            correct_index: 0,
            explanation: 'Reaction candles require meaningful structural location to signal real defense.',
          },
          {
            id: 'q-09-01-3',
            question: 'Does price action eliminate the need for stop-losses?',
            options: ['No—strict invalidation stops remain mandatory', 'Yes, price action never loses', 'Only on Daily charts', 'Yes during London session'],
            correct_index: 0,
            explanation: 'Every trading approach faces uncertainty and requires defined risk limits.',
          },
        ],
      },
      {
        id: 'lesson-09-02',
        title: 'Swing Structure and Market Phases',
        category: 'Price Action',
        summary: 'Connect higher-high/higher-low sequencing with the four phases: accumulation, markup, distribution, and markdown.',
        learning_objective: 'Map real-time swing structure across phases to align with expansion legs and step back during choppy transitions.',
        introduction:
          'Price moves in recognizable phases—expanding cleanly when one side dominates, then pausing in sideways boxes when equilibrium returns.',
        content:
          '### Four Cyclical Phases\n1. **Range / Accumulation**: Sideways equilibrium after a decline where selling pressure exhausts and range boundaries form.\n2. **Bullish Trend (Markup)**: Ascending sequence of **Higher Highs (HH)** and **Higher Lows (HL)**.\n3. **Range / Distribution**: Sideways equilibrium after a prolonged rally where upside momentum stalls.\n4. **Bearish Trend (Markdown)**: Descending sequence of **Lower Lows (LL)** and **Lower Highs (LH)**.\n\n**Note**: Transitions do not always follow a textbook 4-step loop—ranges can break back into continuation (re-accumulation or re-distribution), so follow actual breakout closes rather than guessing.',
        demonstration:
          '1. Trace an idealized market phase diagram showing a range breaking higher into HH/HL markup, stalling into a broad ceiling, breaking a key HL, and shifting into LH/LL markdown.',
        common_mistakes: [
          'Assuming every sideways box after a rally MUST break downward (many resolve as continuations!).',
          'Forgetting which swing low/high is currently protecting the trend.',
        ],
        summary_recap:
          'Track market phases objectively through HH/HL vs. LH/LL sequencing and range breakouts rather than forcing cyclical predictions.',
        practical_exercise: {
          title: 'Phase Boundary Mapping',
          objective: 'Label trending waves and sideways transitions on a live chart.',
          steps: [
            'Open a Daily chart spanning 12 months.',
            'Box any sideways consolidation >3 weeks and label trending segments as HH/HL or LH/LL.',
          ],
          deliverable: 'Annotated 12-month phase timeline.',
        },
        visual_key: 'market-structure-phases',
        duration_minutes: 16,
        tags: ['market-phases', 'swing-structure', 'cycles'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-09-02-1',
            question: 'Can a sideways pause after a strong uptrend break higher instead of reversing downward?',
            options: [
              'Yes—consolidation pauses frequently resolve as trend continuations (re-accumulation)',
              'No, ranges always reverse trends',
              'Only on USD/JPY',
              'Only during leap years',
            ],
            correct_index: 0,
            explanation: 'Wait for an actual range breakout close rather than presuming every pause is a top.',
          },
          {
            id: 'q-09-02-2',
            question: 'What defines an active bearish trend structurally?',
            options: [
              'Consistent sequence of Lower Highs (LH) and Lower Lows (LL)',
              'Higher Highs and Higher Lows',
              'Equal highs and equal lows',
              'High RSI',
            ],
            correct_index: 0,
            explanation: 'Descending peaks and troughs define downward market structure.',
          },
          {
            id: 'q-09-02-3',
            question: 'When price sits locked inside a tight sideways range, what is often the highest-discipline choice?',
            options: [
              'Either trade extreme edges carefully or stand aside waiting for decisive breakout confirmation',
              'Chop rapidly in the dead center of the range',
              'Increase leverage 5x',
              'Remove stop-losses',
            ],
            correct_index: 0,
            explanation: 'The middle of a range carries poor risk-to-reward and random noise.',
          },
        ],
      },
      {
        id: 'lesson-09-03',
        title: 'Rejection and Momentum Candles',
        category: 'Price Action',
        summary: 'Read the story of intrabar supply/demand battles through rejection wicks and strong directional momentum closes.',
        learning_objective: 'Distinguish genuine directional momentum bars and rejection tails from weak, balanced indecision bars.',
        introduction:
          'Every candle summarizes a battle between buyers and sellers during that time slice. Comparing wick-to-body proportions reveals who won the close.',
        content:
          '### Two Core Price-Action Signatures\n- **Rejection Candle**: Price pushes aggressively into a zone, encounters fierce opposing orders, and snaps back to leave a long protruding tail (wick) and small body closed away from the extreme.\n- **Momentum / Displacement Candle**: Large directional body closing firmly near its extreme with minimal counter-wick—showing clean dominance with little opposing resistance.\n\nCombining both—e.g., a **rejection wick at support followed immediately by a bullish momentum engulfing close**—gives clearer confirmation than an isolated wick alone.',
        demonstration:
          '1. Inspect the Price-Action Rejection & Momentum diagram showing: (a) clean lower rejection wick sweeping support, (b) follow-through bullish momentum bar confirming buyer control.',
        common_mistakes: [
          'Treating small choppy wicks inside consolidation as high-conviction pin bars.',
          'Chasing an overextended momentum candle after it has already traveled 2× Daily ATR straight into resistance.',
        ],
        summary_recap:
          'Rejection tails signal failed probes at levels; momentum bodies show directional commitment—evaluate both relative to nearby S&R.',
        practical_exercise: {
          title: 'Rejection vs. Indecision Sorting',
          objective: 'Separate high-clarity rejection bars from noisy indecision bars.',
          steps: [
            'Find 3 candles with long wicks at key H4 levels.',
            'Measure whether the close finished clearly near the favorable end of the bar and led to follow-through.',
          ],
          deliverable: '3-candle rejection quality review.',
        },
        visual_key: 'price-action-rejection-momentum',
        duration_minutes: 15,
        tags: ['rejection-candles', 'momentum-candles', 'wicks'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'q-09-03-1',
            question: 'What story does a long upper wick closing near its low right at major resistance tell?',
            options: [
              'Buyers pushed price up into resistance, where sellers aggressively pushed price back down before the close',
              'Sellers lost control completely',
              'Trading halted mid-bar',
              'A guaranteed 500-pip crash',
            ],
            correct_index: 0,
            explanation: 'Long upper tails at resistance reflect intrabar rejection of higher prices.',
          },
          {
            id: 'q-09-03-2',
            question: 'When is chasing a giant momentum candle dangerous?',
            options: [
              'When the candle has already stretched far from support directly into major opposing higher-timeframe resistance',
              'Never—always buy the biggest candle',
              'Only on EUR/USD',
              'When spreads are tight',
            ],
            correct_index: 0,
            explanation: 'Entering at the end of a huge extended bar forces a wide stop-loss directly beneath nearby resistance.',
          },
          {
            id: 'q-09-03-3',
            question: 'A candle with long wicks on BOTH top and bottom and a tiny central body typically signals:',
            options: ['Indecision / balance between buyers and sellers', 'Clean one-sided dominance', 'Market gap fill', 'High-certainty breakout'],
            correct_index: 0,
            explanation: 'Long opposing wicks show neither side held control into the close.',
          },
        ],
      },
      {
        id: 'lesson-09-04',
        title: 'Inside Bars and Outside Bars',
        category: 'Price Action',
        summary: 'Use inside-bar volatility contractions and outside-bar volatility expansions cleanly within trend context.',
        learning_objective: 'Identify inside bars and outside bars and interpret breakouts from inside-bar compression.',
        introduction:
          'Price constantly breathes in (contraction) and breathes out (expansion). Inside bars and outside bars are two simple, objective candle footprints of that cycle.',
        content:
          '### Definitions\n- **Inside Bar**: A candle whose High is **lower** than the previous candle’s High AND whose Low is **higher** than the previous candle’s Low (completely contained inside the "mother bar"). Signals brief pause/compression.\n- **Outside Bar**: A candle whose High exceeds the prior High AND Low drops below the prior Low, engulfing the prior range. Signals sudden expansion or two-sided volatility sweep.\n\n### Best Usage\nInside bars work cleanest as **continuation pauses** inside an active trend near support/resistance—not inside messy dead ranges where inside bars stack endlessly.',
        demonstration:
          '1. Review the Inside/Outside Bar diagram: Mother Bar establishes range `1.0840–1.0885`; Inside Bar compresses at `1.0852–1.0875`; next candle breaks cleanly above `1.0885` in the Daily uptrend direction.',
        common_mistakes: [
          'Trading inside bars during dead Asian-session consolidation where volatility is naturally asleep.',
          'Ignoring the mother bar range and placing stops tighter than routine candle noise.',
        ],
        summary_recap:
          'Inside bars compress volatility before potential trend continuation; outside bars expand volatility and often sweep both sides.',
        practical_exercise: {
          title: 'Trend-Aligned Inside Bar Hunt',
          objective: 'Spot Daily inside bars forming after strong trend legs.',
          steps: [
            'Locate two Daily inside bars inside clear trends.',
            'Check whether breaking the mother-bar high/low in the trend direction led to clean continuation.',
          ],
          deliverable: '2-example inside bar outcome notes.',
        },
        visual_key: 'inside-outside-marubozu',
        duration_minutes: 15,
        tags: ['inside-bar', 'outside-bar', 'compression'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'q-09-04-1',
            question: 'What defines an Inside Bar?',
            options: [
              'A candle whose entire high-to-low range stays strictly within the high-to-low range of the immediately preceding mother bar',
              'Any small green candle',
              'A candle sitting below a moving average',
              'A candle that opens inside a gap',
            ],
            correct_index: 0,
            explanation: 'Lower high + higher low relative to the prior candle defines volatility compression.',
          },
          {
            id: 'q-09-04-2',
            question: 'Where do inside-bar breakout strategies face the highest failure rate?',
            options: [
              'Inside low-liquidity sideways ranges or directly into major opposing S&R',
              'During strong higher-timeframe trends after healthy pullbacks',
              'On Daily charts during trending macro cycles',
              'When aligned with Weekly structure',
            ],
            correct_index: 0,
            explanation: 'Inside bars inside choppy ranges lack directional momentum follow-through.',
          },
          {
            id: 'q-09-04-3',
            question: 'An Outside Bar closing firmly near its bullish high after dipping slightly below the prior bar’s low resembles:',
            options: ['A bullish engulfing sweep and expansion', 'A flat doji', 'A bearish marubozu', 'A spinning top'],
            correct_index: 0,
            explanation: 'Sweeping the prior low before expanding above the prior high shows strong bullish reversal momentum.',
          },
        ],
      },
      {
        id: 'lesson-09-05',
        title: 'Break of Structure (BOS) and Market-Structure Shifts (MSS)',
        category: 'Price Action',
        summary: 'Apply clear, unambiguous rules to distinguish trend-continuing BOS from trend-warning MSS (Change of Character).',
        learning_objective: 'Label BOS and MSS consistently using candle-close rules rather than arbitrary minor wicks.',
        introduction:
          'Modern price-action traders use concise shorthand—BOS and MSS (often called ChoCh)—to distinguish continuation from potential reversal. Precision prevents false labels.',
        content:
          '### Clear Definitions\n- **Break of Structure (BOS)**: A **continuation** break where price closes decisively past the prior trend-aligned extreme (e.g., breaking above the previous Higher High in an uptrend).\n- **Market Structure Shift (MSS / ChoCh)**: A **counter-trend warning** where price closes decisively past the key Higher Low (in an uptrend) or Lower High (in a downtrend) that launched the last extreme.\n\n### Candle Close vs. Wick Rule\nRequiring a **candle body close** past the structural swing—especially on your anchor timeframe—eliminates countless false MSS calls caused by brief liquidity wicks.',
        demonstration:
          '1. Trace the BOS vs. MSS diagram: Uptrend prints `HL1 → HH1 → HL2 → HH2`. Passing `HH1` is **BOS**. Later, dropping and closing firmly below `HL2` is **MSS** (first structural shift warning buyers lost control).',
        common_mistakes: [
          'Labeling every tiny M1 pullback break as an "MSS" while Daily and H4 trends stay strongly intact.',
          'Calling a 1-pip wick poke a confirmed MSS without a body close.',
        ],
        summary_recap:
          'BOS confirms trend continuation; MSS warns the protecting swing point has broken on a candle close.',
        practical_exercise: {
          title: 'BOS vs. MSS Chart Labeling',
          objective: 'Trace an entire trend from early MSS through sequential BOS legs until the next MSS.',
          steps: [
            'Open a clean H4 chart and pick one complete trend swing.',
            'Mark every continuation BOS and the eventual structural MSS that ended the swing.',
          ],
          deliverable: 'Labeled H4 BOS/MSS map.',
        },
        visual_key: 'bos-mss-diagram',
        duration_minutes: 17,
        tags: ['bos', 'mss', 'choch', 'structure'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-09-05-1',
            question: 'In an uptrend (`HL1 → HH1 → HL2 → HH2`), what constitutes a valid Break of Structure (BOS)?',
            options: [
              'Price closing decisively above HH1 to establish the new HH2 continuation',
              'Price dipping briefly below HL2',
              'Two inside bars forming mid-swing',
              'Price stalling flat for 3 hours',
            ],
            correct_index: 0,
            explanation: 'BOS extends structure in the prevailing trend direction.',
          },
          {
            id: 'q-09-05-2',
            question: 'What would signal a potential Market Structure Shift (MSS) in that same uptrend?',
            options: [
              'A decisive candle close beneath HL2—the swing low that launched the last Higher High',
              'Price printing another Higher High',
              'RSI crossing 60',
              'A small green hammer on HL2',
            ],
            correct_index: 0,
            explanation: 'Closing below the key Higher Low signals sellers overwhelmed the trend’s defending floor.',
          },
          {
            id: 'q-09-05-3',
            question: 'Why require candle-body closes for structural breaks rather than any intrabar wick?',
            options: [
              'To filter temporary stop-runs/sweeps that fail to achieve acceptance beyond the swing',
              'Because wicks do not appear on Forex charts',
              'To increase broker leverage',
              'To eliminate all losing trades',
            ],
            correct_index: 0,
            explanation: 'Wicks often snap right back; closes measure genuine price acceptance.',
          },
        ],
      },
      {
        id: 'lesson-09-06',
        title: 'Liquidity Concepts (Equal Highs/Lows and Stop Clusters)',
        category: 'Price Action',
        summary: 'Understand why obvious double-top highs and triple-bottom lows accumulate resting stop and breakout orders.',
        learning_objective: 'Explain retail order clustering around equal highs/lows objectively without conspiracy narratives.',
        introduction:
          'In order-driven markets, large participants need counterparties to fill sizable orders. Resting stop-loss and breakout orders often sit predictably around clean visual extremes.',
        content:
          '### Where Liquidity Naturally Clusters\n- **Above Equal Highs / Resistance Ceilings**: Short sellers place protective **buy-stop** orders just above highs; breakout buyers also place **buy-stop** entries there.\n- **Below Equal Lows / Support Floors**: Long traders place protective **sell-stop** orders just below lows; breakdown sellers place **sell-stop** entries there.\n\n### Objective Framing\n"Liquidity pools" are simply **concentrations of predictable resting orders** arising from human chart behavior—not proof of secret retail-targeting cartels. Recognizing where stops cluster helps you place yours safely outside obvious spikes and understand sudden sweeps.',
        demonstration:
          '1. Simulated GBP/USD prints triple bottoms near `1.2600`.\n2. Thousands of traders place long stops at `1.2592–1.2598`.\n3. Price dips briefly to `1.2586`, clears that cluster of resting sell orders, and snaps back above `1.2605`.',
        common_mistakes: [
          'Leaving stop-losses tightly hugged 2 pips behind clean equal highs/lows.',
          'Thinking every equal high MUST sweep before dropping—sometimes true breaks hold and run.',
        ],
        summary_recap:
          'Equal highs, equal lows, and clean S&R ceilings naturally concentrate resting stop/breakout orders.',
        practical_exercise: {
          title: 'Stop-Cluster Awareness Check',
          objective: 'Spot equal highs/lows where obvious stops accumulate.',
          steps: [
            'Locate two instances of double or triple highs/lows on an H1 or H4 chart.',
            'Record whether price sliced past by 5–20 pips before reversing or broke cleanly and kept trending.',
          ],
          deliverable: '2-case equal-extreme behavior notes.',
        },
        visual_key: 'liquidity-sweeps-diagram',
        duration_minutes: 16,
        tags: ['liquidity', 'equal-highs', 'equal-lows'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'q-09-06-1',
            question: 'What types of orders typically cluster just above obvious Equal Highs?',
            options: [
              'Short sellers’ protective buy-stop orders and breakout traders’ buy-stop entries',
              'Dividend payout checks',
              'Long traders’ take-profit market shorts only',
              'Margin call rebates',
            ],
            correct_index: 0,
            explanation: 'Both stop-losses on short positions and breakout buys execute as buy orders above highs.',
          },
          {
            id: 'q-09-06-2',
            question: 'How does understanding stop clusters improve your own risk placement?',
            options: [
              'You avoid parking stops tightly right behind obvious double tops/bottoms—using sensible ATR/structural buffers',
              'You stop using stop-loss orders completely',
              'You enter 10x larger lots',
              'You only trade weekends',
            ],
            correct_index: 0,
            explanation: 'Sensible structural buffers protect positions from shallow sweep probes.',
          },
          {
            id: 'q-09-06-3',
            question: 'Do equal highs ALWAYS sweep and reverse downward?',
            options: [
              'No—strong trends frequently break straight through equal highs and continue higher',
              'Yes, 100% of the time',
              'Yes on EUR/USD only',
              'Only when RSI is 50',
            ],
            correct_index: 0,
            explanation: 'Sweeps require confirmation (reversal close + structure shift); never short blindly above highs.',
          },
        ],
      },
      {
        id: 'lesson-09-07',
        title: 'Liquidity Sweep Terminology and Limitations',
        category: 'Price Action',
        summary: 'Examine how sweep-and-MSS setups work and learn their real limitations so you avoid confirmation bias.',
        learning_objective: 'Identify a clean liquidity sweep followed by structure shift while understanding when sweeps are merely real breakouts.',
        introduction:
          'Once you learn the term "liquidity sweep," it becomes tempting to call every breakout a sweep and fight strong trends. Patience and confirmation keep that mistake away.',
        content:
          '### Sweep vs. Real Breakout\n- **Sweep (Stop Hunt / Turtle Soup)**: Price pushes quickly beyond a high/low, fails to sustain acceptance (leaves a sharp wick or reverses rapidly), and breaks an opposing lower-timeframe swing (**MSS**).\n- **Real Breakout**: Price clears the high, holds above it with full-bodied closes, and converts the zone into new support.\n\n### Critical Limitation\nYou **cannot** know in real time at the instant a high breaks whether it is a sweep or a breakout. Wait for the candle close back inside + structural shift before acting.',
        demonstration:
          '1. Inspect the Liquidity Sweep diagram: Sweep pokes past `PDH` with a sharp rejection wick, closes back beneath `PDH`, then breaks the minor higher low (`MSS`) before pulling back—completing confirmation **before** entry.',
        common_mistakes: [
          'Calling a real breakout a "liquidity sweep" and endlessly shorting all the way up a 300-pip trend.',
          'Trading sweeps against massive Daily/Weekly momentum without higher-timeframe ceiling confluence.',
        ],
        summary_recap:
          'Never label a breakout a "sweep" until price actually fails back inside the level and prints a structural shift.',
        practical_exercise: {
          title: 'Sweep Confirmation Checklist',
          objective: 'Separate pre-mature guessing from post-failure confirmation.',
          steps: [
            'Write out the exact 3 sequential events required before considering a liquidity-sweep setup (1. Key level swept, 2. Quick rejection/close back inside, 3. Opposing swing MSS).',
          ],
          deliverable: '3-step written sweep verification rule.',
        },
        visual_key: 'liquidity-sweeps-diagram',
        duration_minutes: 17,
        tags: ['liquidity-sweep', 'limitations', 'confirmation'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-09-07-1',
            question: 'When can you objectively distinguish a liquidity sweep from a genuine upward breakout?',
            options: [
              'Only AFTER price fails to hold above the level, closes back inside, and shifts opposing structure',
              'The exact microsecond price ticks 1 pipette above resistance',
              'By checking social media comments',
              'When spread is 0.1 pips',
            ],
            correct_index: 0,
            explanation: 'Confirmation happens *after* failure back inside the level—not before.',
          },
          {
            id: 'q-09-07-2',
            question: 'What happens if you keep shorting above highs believing "this breakout must be a sweep" during a macro trend?',
            options: [
              'Severe drawdown from fighting sustained trend momentum',
              'Guaranteed win on the 5th try',
              'Automatic margin refund',
              'Zero commission charges',
            ],
            correct_index: 0,
            explanation: 'Fighting confirmed breakouts without reversal structure is classic counter-trend gambling.',
          },
          {
            id: 'q-09-07-3',
            question: 'Where are sweep reversals generally highest quality?',
            options: [
              'At major higher-timeframe S&R or PDH/PDL extremes rather than random mid-range bars',
              'Inside the dead center of a 5-minute range',
              'Every 10 minutes regardless of chart levels',
              'On market holidays',
            ],
            correct_index: 0,
            explanation: 'Higher-timeframe location makes a sweep failure meaningfully significant.',
          },
        ],
      },
      {
        id: 'lesson-09-08',
        title: 'Fair Value Gap (FVG) and Imbalance Concepts',
        category: 'Price Action',
        summary: 'Define the 3-candle Fair Value Gap (FVG) / price imbalance objectively and integrate it as pullback context rather than an isolated trigger.',
        learning_objective: 'Identify a 3-candle FVG accurately and understand why imbalances often—but not always—partially retrace.',
        introduction:
          'When price surges forcefully on a big middle candle, buyers or sellers move faster than two-sided trading could settle—leaving a visible 3-candle gap between outer wicks.',
        content:
          '### 3-Candle FVG Mechanics\nIn a **bullish FVG** across candles 1, 2, and 3:\n- Candle 2 is a large upward expansion bar.\n- **Candle 1’s High** sits strictly below **Candle 3’s Low**—leaving an untouched vertical pocket in between where Candle 2 traded almost one-sidedly.\n\n### Practical Perspective\nAn FVG highlights **imbalance velocity**, often acting as a magnet or pullback area during trends—similar to classic gap-fill behavior. **Limitations**: FVGs appear on almost every timeframe continuously; only pay attention to FVGs aligned with higher-timeframe bias, displacement, and structural S&R—and remember price frequently slices straight through minor FVGs.',
        demonstration:
          '1. Review the FVG Imbalance diagram: Candle 1 high = `1.0840`, Candle 2 surges from `1.0835` to `1.0895`, Candle 3 low = `1.0868`.\n2. The `1.0840–1.0868` gap marks the bullish FVG zone where a later pullback stabilizes before continuing upward.',
        common_mistakes: [
          'Placing blind limit orders in every tiny 3-candle FVG on a 5-minute chart.',
          'Thinking every FVG must fill completely—strong impulses often leave gaps unvisited for months.',
        ],
        summary_recap:
          'FVGs highlight one-sided 3-candle displacement pockets; use higher-timeframe FVGs as confluence areas, never blind auto-entries.',
        practical_exercise: {
          title: 'FVG + Horizontal S&R Alignment',
          objective: 'Filter noisy FVGs using structural alignment.',
          steps: [
            'Locate two clean H4 bullish or bearish FVGs created during a breakout.',
            'Check whether the FVG sits right over a broken horizontal S&R level (doubling as a classic break-and-retest zone!).',
          ],
          deliverable: 'Annotated alignment of FVG with break-and-retest structure.',
        },
        visual_key: 'fvg-imbalance-diagram',
        duration_minutes: 17,
        tags: ['fvg', 'imbalance', 'displacement'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-09-08-1',
            question: 'How is a bullish 3-candle Fair Value Gap (FVG) bounded visually?',
            options: [
              'Between Candle 1’s High and Candle 3’s Low across an energetic upward Candle 2',
              'Between two moving averages',
              'Inside a single doji body',
              'Between Friday close and Monday morning spread only',
            ],
            correct_index: 0,
            explanation: 'Non-overlapping wicks between Candle 1 and Candle 3 leave an untouched vertical imbalance pocket on Candle 2.',
          },
          {
            id: 'q-09-08-2',
            question: 'Why is blindly putting limit orders inside every M5 FVG risky?',
            options: [
              'Low-timeframe FVGs form constantly and are routinely violated without higher-timeframe structure',
              'Platforms forbid limit orders inside FVGs',
              'FVGs cannot form on EUR/USD',
              'Spreads triple inside FVGs',
            ],
            correct_index: 0,
            explanation: 'Without higher-timeframe direction and S&R alignment, small gaps offer no meaningful edge.',
          },
          {
            id: 'q-09-08-3',
            question: 'True or False: Every FVG on a chart is guaranteed to fill 100% eventually.',
            options: ['False', 'True'],
            correct_index: 0,
            explanation: 'False. Strong trend breakaway gaps frequently remain unfilled for long periods or indefinitely.',
          },
        ],
      },
      {
        id: 'lesson-09-09',
        title: 'Order Blocks, Breaker Blocks, and Mitigation Concepts',
        category: 'Price Action',
        summary: 'Demystify Order Blocks and Breakers as visual origin/flipped zones, understanding both their structure and empirical limits.',
        learning_objective: 'Identify candidate order blocks and breaker blocks cleanly while framing them strictly as interpretive zones rather than hidden institutional truths.',
        introduction:
          'Terms like "Order Block" and "Breaker Block" sound exotic, yet visually they map closely to classic consolidation origins and failed role-reversal zones.',
        content:
          '### Clear Definitions\n- **Bullish Order Block (OB)**: Commonly defined as the **last bearish candle** right before an aggressive bullish displacement that breaks market structure (BOS)—overlapping closely with a demand origin zone.\n- **Mitigation**: Simply a fancy word for price **retesting/returning** into that origin zone before resuming.\n- **Breaker Block**: A failed Order Block that gets sliced cleanly through and flips polarity—essentially classic **S&R role reversal**!\n\n### Honest Framing\nRetail charts do not display proprietary institutional trading desks’ internal order tickets. These labels serve as consistent **visual heuristics** for finding high-displacement origin zones and broken flipped zones. Confirmation and stop-losses remain essential.',
        demonstration:
          '1. Examine the Order Block & Mitigation diagram: Last down-candle (`1.0800–1.0818`) precedes a forceful 140-pip rally breaking prior swing high (`BOS`).\n2. Later pullback into `1.0815` stabilizes and launches upward—whereas a clean close below `1.0800` would invalidate it (or convert it into a bearish breaker).',
        common_mistakes: [
          'Drawing an Order Block on every single red candle regardless of whether it caused a strong BOS.',
          'Treating marketing claims about "bank algorithms" as guarantees.',
        ],
        summary_recap:
          'Order Blocks and Breakers are visual frameworks for displacement origins and polarity flips; demand structural BOS + risk control.',
        practical_exercise: {
          title: 'Order Block vs. Supply/Demand Bridge',
          objective: 'Recognize how Order Blocks align with traditional supply/demand and role-reversal rules.',
          steps: [
            'Find one displacement candle sequence that produced a clear H4 BOS.',
            'Highlight the origin candle (OB) and see how it overlaps with traditional base/S&R mapping.',
          ],
          deliverable: 'Comparison note bridging SMC terms with classic S&R.',
        },
        visual_key: 'order-block-mitigation',
        duration_minutes: 18,
        tags: ['order-block', 'breaker-block', 'mitigation'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-09-09-1',
            question: 'What visually differentiates a high-quality candidate Bullish Order Block from any random red candle?',
            options: [
              'It immediately precedes a forceful bullish impulse that creates an imbalance and breaks market structure',
              'It has the longest upper wick on Sunday night',
              'It sits inside a flat range with zero breakout',
              'It coincides with RSI = 50',
            ],
            correct_index: 0,
            explanation: 'Without subsequent strong displacement and structural break, an isolated down-candle has no special significance.',
          },
          {
            id: 'q-09-09-2',
            question: 'A "Breaker Block" is functionally closest to which classic technical concept?',
            options: [
              'S&R Role Reversal (failed zone flipping polarity after a clean break)',
              'A moving average crossover',
              'A carry trade swap',
              'A calendar news release',
            ],
            correct_index: 0,
            explanation: 'When a candidate OB fails and is broken decisively, its retest from the opposite side mirrors classic polarity flip.',
          },
          {
            id: 'q-09-09-3',
            question: 'Do Order Blocks on retail charts prove the exact orders of specific named banks?',
            options: [
              'No—OTC spot retail charts reflect aggregated price feeds without institutional trader identities',
              'Yes, every bar displays bank IDs',
              'Yes on paid accounts only',
              'Only on Gold',
            ],
            correct_index: 0,
            explanation: 'Keep terminology grounded: these are visual price-action frameworks, not literal bank order transparency.',
          },
        ],
      },
      {
        id: 'lesson-09-10',
        title: 'Premium and Discount Frameworks',
        category: 'Price Action',
        summary: 'Use the 50% equilibrium midpoint of a swing range to avoid buying expensive highs or selling cheap lows.',
        learning_objective: 'Divide a structural impulse range into Premium (>50%) and Discount (<50%) zones to enforce favorable Reward-to-Risk.',
        introduction:
          'Even if an uptrend is healthy, buying right after price rallies 150 pips without resting forces an awful stop distance. Thinking in Premium vs. Discount fixes entry discipline.',
        content:
          '### Equilibrium Geometry\nMeasure from the active swing low (`0%`) to swing high (`100%`):\n- **Equilibrium (`50%`)**: Fair midpoint of the recent impulse range.\n- **Discount Zone (Lower `0%–50%`)**: Preferred area to look for **long** pullback setups during uptrends—closer to invalidation, better Risk-to-Reward.\n- **Premium Zone (Upper `50%–100%`)**: Preferred area to look for **short** pullback setups during downtrends (or taking partial profits on longs).\n\n**Nuance**: Strong runaway trends occasionally bounce from `38.2%` shallow retracements inside Premium—so treat `50%` as a value preference guideline, not an iron law.',
        demonstration:
          '1. Uptrend impulse runs from `1.0700` to `1.0900` (200-pip range; `50%` equilibrium = `1.0800`).\n2. Buying a bullish reaction at `1.0780` (Discount) with stop at `1.0695` (`85` pips) targeting `1.0950` (`170` pips) yields `2:1 R:R`, whereas buying extended at `1.0880` ruins payoff geometry.',
        common_mistakes: [
          'Shorting purely because price is in "Premium" even though the trend is strongly bullish (buying Discount in uptrends, selling Premium in downtrends!).',
          'Measuring random tiny 5-minute swings instead of active structural ranges.',
        ],
        summary_recap:
          'Look for uptrend longs in Discount (<50%) and downtrend shorts in Premium (>50%) to naturally protect Risk-to-Reward geometry.',
        practical_exercise: {
          title: '50% Range Value Audit',
          objective: 'Verify how buying Discount improves R:R.',
          steps: [
            'Draw a Fib tool (with 0%, 50%, 100% marked) across the latest complete Daily swing.',
            'Compare hypothetical stop distance and R:R for an entry at 30% retracement vs. 61.8% retracement.',
          ],
          deliverable: 'R:R comparison calculation.',
        },
        visual_key: 'premium-discount-equilibrium',
        duration_minutes: 15,
        tags: ['premium-discount', 'equilibrium', 'risk-reward'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-09-10-1',
            question: 'In a confirmed uptrend impulse from 1.1000 to 1.1200, what price region is the "Discount" zone?',
            options: ['Below 1.1100 (the 50% equilibrium midpoint)', 'Above 1.1200', 'Between 1.1150 and 1.1200', 'At 1.1300'],
            correct_index: 0,
            explanation: 'The lower half of an upswing sits below the 50% midpoint (1.1100), offering value closer to structural support.',
          },
          {
            id: 'q-09-10-2',
            question: 'Should you short an uptrend simply because price is sitting in the "Premium" zone above 50%?',
            options: [
              'No—Premium/Discount is applied WITH trend direction (sell Premium in downtrends, buy Discount in uptrends)',
              'Yes, always sell above 50%',
              'Yes, use max leverage',
              'Only on Friday afternoons',
            ],
            correct_index: 0,
            explanation: 'Trend alignment comes first; Premium/Discount filters entry value within the trend.',
          },
          {
            id: 'q-09-10-3',
            question: 'What is the main mathematical benefit of waiting for Discount pullbacks in an uptrend?',
            options: [
              'Closer proximity to structural invalidation improves Risk-to-Reward ratio',
              'Spread drops to zero',
              'Brokers refund swap fees',
              'Trends become guaranteed',
            ],
            correct_index: 0,
            explanation: 'Tighter distance to logical invalidation improves payoff relative to targets.',
          },
        ],
      },
      {
        id: 'lesson-09-11',
        title: 'Multi-Timeframe Price-Action Planning',
        category: 'Price Action',
        summary: 'Connect Weekly/Daily macro levels, H4/H1 setup maps, and M15 execution triggers into one unified workflow.',
        learning_objective: 'Execute a disciplined three-timeframe top-down analysis sequence without losing big-picture orientation.',
        introduction:
          'Switching randomly between 15 timeframes creates conflicting impulses. A fixed three-tier timeframe stack keeps your narrative calm and consistent.',
        content:
          '### Example Swing/Intraday Three-Tier Stack\n1. **Anchor / Map Timeframe (Daily / Weekly)**: Mark primary horizontal S&R zones, macro trend bias, and PDH/PWH.\n2. **Structure / Setup Timeframe (H4 / H1)**: Track current swing sequence, Discount/Premium zones, and key pullback areas.\n3. **Trigger / Execution Timeframe (M15 / H1)**: Wait until price reaches your Higher-Timeframe Map Zone, then look for rejection, engulfing, or MSS confirmation to refine entry and stop.\n\n**Golden Rule**: Never let an M15 candle tempt you into taking a trade straight into an opposing Daily S&R wall sitting 12 pips ahead.',
        demonstration:
          '1. Follow the Top-Down Workflow diagram: Daily identifies bullish trend pulling back to `1.0800` support → H4 shows clean `50%` Discount zone + trendline → M15 waits for price to enter `1.0800`, prints a clean bullish MSS + engulfing close, triggering execution.',
        common_mistakes: [
          'Mixing Weekly charts with 1-minute triggers (too big a gap—noise overwhelms signal).',
          'Forgetting to check higher-timeframe resistance overhead before pulling an M15 long trigger.',
        ],
        summary_recap:
          'Use Higher Timeframes for Bias and Location, Middle Timeframes for Setup Structure, and Lower Timeframes strictly for disciplined Execution inside planned zones.',
        practical_exercise: {
          title: 'Three-Tier Top-Down Routine',
          objective: 'Walk one currency pair cleanly from Daily → H4 → M15.',
          steps: [
            'Choose EUR/USD or GBP/USD.',
            'Write 1 line for Daily Bias/S&R, 1 line for H4 Swing Zone, and 1 line defining what M15 trigger you would wait for.',
          ],
          deliverable: 'Completed 3-tier top-down plan.',
        },
        visual_key: 'top-down-timeframes',
        duration_minutes: 17,
        tags: ['multi-timeframe', 'top-down', 'planning'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-09-11-1',
            question: 'In top-down price action planning, what is the ONLY time you should look for an M15 entry trigger?',
            options: [
              'After price has arrived inside a pre-mapped Higher-Timeframe (Daily/H4) Location zone',
              'Continuously all day anywhere on the chart',
              'Only when M15 contradicts the Daily direction',
              'During weekend market closure',
            ],
            correct_index: 0,
            explanation: 'Lower timeframes refine triggers *inside* higher-timeframe locations—never in random mid-air.',
          },
          {
            id: 'q-09-11-2',
            question: 'Why avoid pairing a Monthly bias chart directly with a 1-minute execution chart?',
            options: [
              'The scale mismatch is extreme—dozens of chaotic 1-minute swings occur inside a single Monthly pullback wick',
              'Monthly charts are upside down',
              '1-minute charts forbid stop-losses',
              'Monthly bars have no closing price',
            ],
            correct_index: 0,
            explanation: 'Stick to sensible 4× to 6× timeframe step ratios (e.g., Daily → H4 → H1/M15).',
          },
          {
            id: 'q-09-11-3',
            question: 'What happens if an M15 buy setup targets 60 pips, yet Daily resistance sits just 15 pips higher?',
            options: [
              'Skip the trade—higher-timeframe resistance blocks realistic Reward-to-Risk',
              'Force a 100-pip target through the Daily ceiling',
              'Double leverage',
              'Delete the Daily chart',
            ],
            correct_index: 0,
            explanation: 'Always honor opposing higher-timeframe obstacles.',
          },
        ],
      },
      {
        id: 'lesson-09-12',
        title: 'Building a Repeatable Price-Action Checklist',
        category: 'Price Action',
        summary: 'Assemble every price-action concept into a strict 6-point pre-trade checklist that curbs impulsivity.',
        learning_objective: 'Create and apply an objective binary Yes/No pre-trade checklist covering structure, location, confirmation, news, and risk.',
        introduction:
          'Airline pilots never rely on memory before takeoff regardless of how many hours they have flown. Professional traders use written checklists for the exact same reason.',
        content:
          '### Complete Price-Action Pre-Trade Checklist\n1. **Higher-Timeframe Context**: Is Daily/H4 direction clear (Trend or defined Range)?\n2. **Key Location**: Is price sitting at a pre-planned S&R zone, PDH/PDL, or Discount/Premium area?\n3. **Clear Space (Traffic)**: Is there at least `2:1` realistic room before the next major opposing barrier?\n4. **Price Confirmation**: Did a candle close confirm rejection, engulfing, or MSS?\n5. **Event Risk Check**: Are high-impact CPI/FOMC/NFP releases about to hit in the next 30 minutes?\n6. **Defined Risk**: Exact Stop-Loss beyond invalidation, exact Lot Size calculated (`≤1%` risk), exact Target.',
        demonstration:
          '1. Walk through a mock checklist on a candidate setup: Items 1–4 pass (`Yes`), Item 5 reveals US CPI prints in 12 minutes (`Fail`). Result: **Stand aside cleanly**—the checklist prevented a volatility gamble.',
        common_mistakes: [
          'Skipping the checklist when excited by a fast moving candle (FOMO).',
          'Having vague checklist items like "chart looks good" instead of objective Yes/No rules.',
        ],
        summary_recap:
          'A binary Yes/No checklist enforces consistent quality and blocks emotional trades before capital hits the market.',
        practical_exercise: {
          title: 'Personal 6-Point Checklist Card',
          objective: 'Finalize your own written price-action filter.',
          steps: [
            'Adapt the 6-point checklist into a concise desktop/phone note.',
            'Score 3 historical setups in the Chart Practice Lab using every single point.',
          ],
          deliverable: 'Finalized 6-point price-action checklist + 3 practice scores.',
        },
        visual_key: 'strategy-rulebook-blueprint',
        duration_minutes: 15,
        tags: ['checklist', 'process', 'discipline'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-09-12-1',
            question: 'Why must checklist items be framed as objective Yes/No criteria?',
            options: [
              'So emotions cannot bend vague criteria into excuses for impulsive trades',
              'So platforms run faster',
              'Because regulators grade checklists weekly',
              'To replace stop-loss orders',
            ],
            correct_index: 0,
            explanation: 'Objective binary questions curb emotional rationalization.',
          },
          {
            id: 'q-09-12-2',
            question: 'If 5 items pass on your checklist, yet a Tier-1 central bank rate decision drops in 10 minutes (failing the event-risk check), what should you do?',
            options: [
              'Stand aside until volatility and spreads normalize after the release',
              'Increase size to catch the spike',
              'Ignore item 5',
              'Remove your stop-loss',
            ],
            correct_index: 0,
            explanation: 'A pre-trade checklist works only when all mandatory safety gates must pass.',
          },
          {
            id: 'q-09-12-3',
            question: 'Checking "Clear Space (Traffic)" before entering ensures:',
            options: [
              'Your realistic target sits safely before the next major opposing S&R obstacle',
              'Internet bandwidth is fast',
              'No other traders are online',
              'Spread stays below 0.5 pips',
            ],
            correct_index: 0,
            explanation: 'Never place targets past unyielding opposing higher-timeframe walls.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-10-trading-strategies',
    slug: 'trading-strategies',
    course_number: 10,
    title: '10. Trading Strategies',
    category: 'Trading Strategies',
    level: 'Advanced',
    level_label: 'Intermediate to Advanced',
    description:
      'Build complete, testable trading strategies: trend pullbacks, break-and-retest, range mean reversion, momentum, MA/oscillator systems, Fibonacci pullbacks, session setups, news discipline, carry fundamentals, trader timeframes, full strategy rulebooks, and expectancy math—zero fabricated win rates.',
    prerequisites: 'Courses 04–09 recommended.',
    learning_outcomes: [
      'Specify all eight components of a valid trading strategy: market condition, instrument/timeframe, trigger, stop-loss, exit, sizing, costs, and failure mode.',
      'Differentiate trend-following, breakout-retest, mean-reversion, session, and carry strategies and know when each fails.',
      'Select a trading horizon (scalping, day, swing, position) that matches your schedule, spread tolerance, and temperament.',
      'Calculate strategy expectancy accounting honestly for spreads, commissions, slippage, and swaps.',
    ],
    estimated_hours: 5,
    cover_image_url: '/src/assets/images/hero_trading_desk_1795085837463.jpg',
    assessment: [
      {
        id: 'c10-a1',
        question: 'Which complete list defines an actionable, testable trading strategy rulebook?',
        options: [
          'Regime filter, instruments/timeframes, exact entry trigger, structural stop-loss, target/exit rules, position sizing, transaction cost check, and when to stand aside',
          'Just an indicator crossover plus a hopeful profit target',
          'A social media tip plus maximum leverage',
          'A martingale doubling sequence without stops',
        ],
        correct_index: 0,
        explanation: 'Every complete strategy specifies conditions, triggers, exits, sizing, costs, and failure states.',
      },
      {
        id: 'c10-a2',
        question: 'When does a range mean-reversion strategy face its greatest failure risk?',
        options: [
          'When a range breaks out decisively into a strong directional macro trend and the trader keeps fading extremes',
          'During quiet sideways consolidation between strong walls',
          'When ADX stays below 18',
          'During balanced Asian ranges',
        ],
        correct_index: 0,
        explanation: 'Fading breakouts once range boundaries fail creates catastrophic losses if a new trend begins.',
      },
      {
        id: 'c10-a3',
        question: 'Why does transaction cost (spread + commission + slippage) hit high-frequency 1-minute scalping disproportionately harder than Daily swing trading?',
        options: [
          'Fixed pip costs consume a much larger percentage of a tiny 8-pip scalp target than a 180-pip swing target',
          'Brokers forbid stop-losses on Daily charts',
          'Daily charts pay zero spread',
          'Scalping eliminates leverage',
        ],
        correct_index: 0,
        explanation: 'A 1.5-pip round-turn cost consumes ~19% of an 8-pip scalp move versus <1% of a 180-pip swing move.',
      },
      {
        id: 'c10-a4',
        question: 'What is the primary risk of high-yield Currency Carry Trades during sudden global "risk-off" panics?',
        options: [
          'Spot exchange rates can drop sharply in days, wiping out months or years of accumulated positive swap interest',
          'Interest rates never change',
          'Carry trades are protected by deposit insurance',
          'Swaps double in your favor during crashes',
        ],
        correct_index: 0,
        explanation: 'Carry trades tend to climb gradually ("up the stairs") and unwind violently ("down the elevator") during risk-off shocks.',
      },
      {
        id: 'c10-a5',
        question: 'What is the correct formula for Strategy Expectancy per trade (in R multiples or currency)?',
        options: [
          '(Win Rate × Average Win) - (Loss Rate × Average Loss) minus average trading costs',
          'Win Rate × Total Account Balance',
          'Average Win ÷ Leverage',
          'Highest Win - Lowest Loss',
        ],
        correct_index: 0,
        explanation: 'Expectancy blends win frequency with payoff asymmetry after subtracting real execution costs.',
      },
    ],
    lessons: [
      {
        id: 'lesson-10-01',
        title: 'Trend Following and Pullback Entries',
        category: 'Trading Strategies',
        summary: 'Design a rules-based trend-pullback strategy defining conditions, triggers, stops, exits, costs, and range failure states.',
        learning_objective: 'Apply an end-to-end trend pullback blueprint rather than chasing extended breakouts.',
        introduction:
          'Trend following aims to ride established directional moves by entering constructively after temporary counter-trend pullbacks exhaust.',
        content:
          '### Complete Strategy Specification\n- **Market Conditions**: Confirmed HH/HL (uptrend) or LH/LL (downtrend) on Daily/H4 with rising/falling 50 EMA and `ADX > 22`.\n- **Instruments & Timeframes**: Liquid majors (`EUR/USD`, `USD/JPY`, `GBP/USD`); map H4/Daily, trigger H1.\n- **Entry Trigger**: Pullback into a horizontal role-reversal zone + Discount/Premium (`<50%`) + bullish/bearish engulfing or pin-bar close.\n- **Stop / Invalidation**: Beyond the protecting swing low/high + `0.5 × ATR` buffer.\n- **Exit**: `2:1 R:R` target at prior/projected swing boundary or partial scale + trailing stop under newly formed Higher Lows.\n- **Sizing & Costs**: `0.5%–1.0%` fixed risk per trade; check spread <10% of stop distance.\n- **Failure Conditions**: Fails when market transitions into choppy range (`ADX < 18`) or hits opposing Weekly S&R.',
        demonstration:
          '1. Review the simulated Trend Pullback schematic: H4 uptrend pulls back cleanly to broken resistance `1.0840` + `50 EMA`, prints a bullish engulfing H1 bar (`trigger`), SL below `1.0805` (`35` pips), TP at `1.0910` (`70` pips, `2:1`).',
        common_mistakes: [
          'Calling a chaotic sideways range an "uptrend" just to force pullback trades.',
          'Moving profit targets too close (0.5:1) out of impatience while keeping full stops.',
        ],
        summary_recap:
          'Trend pullbacks seek asymmetric entries inside established trends at structural Discount/Premium zones—standing aside once ADX/structure turns choppy.',
        practical_exercise: {
          title: 'Pullback Rulebook Check',
          objective: 'Verify all 8 specification elements on one historical H4 trend.',
          steps: [
            'Locate an H4 trend on EUR/USD.',
            'Document the exact trigger, invalidation price, target, and cost ratio on one historical pullback.',
          ],
          deliverable: 'Complete 8-field strategy test sheet.',
        },
        visual_key: 'strategy-trend-pullback',
        duration_minutes: 19,
        tags: ['trend-following', 'pullback-strategy', 'rulebook'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-10-01-1',
            question: 'When does a Trend Pullback strategy struggle most severely?',
            options: [
              'During low-directional sideways ranges where pullbacks turn into opposite-wall reversals',
              'During steady multi-week macro trends',
              'When Higher Highs and Higher Lows follow cleanly',
              'When spreads are tight',
            ],
            correct_index: 0,
            explanation: 'Trend rules require directional expansion; range regimes generate repeated false starts.',
          },
          {
            id: 'q-10-01-2',
            question: 'Where should invalidation sit on a bullish trend pullback?',
            options: [
              'Cleanly beyond the protecting swing low / support zone rather than arbitrarily tight inside the pullback',
              '2 pips below entry regardless of pair',
              'At 0.0000',
              'No stop needed in uptrends',
            ],
            correct_index: 0,
            explanation: 'If the defending Higher Low breaks decisively, the pullback thesis is invalidated.',
          },
          {
            id: 'q-10-01-3',
            question: 'True or False: A valid strategy must explicitly specify both trading costs and failure conditions.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Knowing when a strategy breaks down prevents bleeding capital in the wrong regime.',
          },
        ],
      },
      {
        id: 'lesson-10-02',
        title: 'Breakout and Break-and-Retest Strategies',
        category: 'Trading Strategies',
        summary: 'Contrast immediate breakout strategies against patient break-and-retest entries with full structural risk rules.',
        learning_objective: 'Execute break-and-retest rules safely after prolonged consolidation while avoiding fakeouts and illiquid hours.',
        introduction:
          'When tight consolidation energy finally releases, breakouts launch new trend waves. Filtering fakeouts requires patience around candle closes and retests.',
        content:
          '### Strategy Specification (Break-and-Retest)\n- **Market Conditions**: Clear multi-touch horizontal range or triangle compression (`Bollinger Squeeze`) breaking out during active **London or New York liquidity**.\n- **Instruments & Timeframes**: Major FX pairs or XAU/USD; map H4 range, confirm break & retest on H1.\n- **Entry Trigger**: Full-bodied candle closes decisively outside the level; price pulls back lightly to test the flipped zone and prints rejection confirmation.\n- **Stop / Invalidation**: Cleanly back inside the prior range beyond the flipped zone (`0.5 × ATR` buffer).\n- **Exit**: Measured range projection or next Daily S&R zone (`≥ 2:1 R:R`).\n- **Sizing & Costs**: `0.5%–1%` risk; avoid entering right before Tier-1 news spreads blow out.\n- **Failure Conditions**: Fails during low-volume summer chop or sudden whipsaw reversals snapping back inside the range.',
        demonstration:
          '1. Simulated consolidation `1.2600–1.2680` breaks upward cleanly at London open (`1.2705` close).\n2. Retest dips to `1.2682` (former ceiling), prints bullish pin close (`1.2695`), stop at `1.2655` (`40` pips), target `1.2780` (`85` pips, `2.1:1`).',
        common_mistakes: [
          'Chasing breakouts late during sleepy Friday afternoons.',
          'Skipping confirmation on the retest when momentum slams violently back inside the box.',
        ],
        summary_recap:
          'Break-and-retest trades exchange catching every runaway breakout for superior invalidation structure and lower fakeout rates.',
        practical_exercise: {
          title: 'Compression Breakout Audit',
          objective: 'Measure breakout + retest geometry on two past ranges.',
          steps: [
            'Find two clear multi-day consolidations followed by H4 breakouts.',
            'Note whether waiting for the retest improved Risk-to-Reward compared to chasing the initial break candle.',
          ],
          deliverable: '2-case breakout vs. retest R:R table.',
        },
        visual_key: 'strategy-break-retest',
        duration_minutes: 18,
        tags: ['breakout-strategy', 'break-and-retest', 'squeeze'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-10-02-1',
            question: 'Why is the Break-and-Retest variation often preferred over instant breakout market orders?',
            options: [
              'It filters wick-only fakeouts and places stop-loss closer to the flipped structural boundary',
              'It wins 100% of trades',
              'It never misses any move',
              'It eliminates commission fees',
            ],
            correct_index: 0,
            explanation: 'Confirming polarity hold reduces fakeout frequency and tightens structural invalidation.',
          },
          {
            id: 'q-10-02-2',
            question: 'Which trading hours offer healthier breakout follow-through on major USD/EUR pairs?',
            options: [
              'Active London and New York sessions',
              'Last hour before Friday market close',
              'Sunday opening tick',
              'Major bank holidays',
            ],
            correct_index: 0,
            explanation: 'Institutional volume during London/NY drives sustained directional acceptance.',
          },
          {
            id: 'q-10-02-3',
            question: 'What invalidates a bullish Break-and-Retest long trade?',
            options: [
              'Price closing firmly back inside the prior range past your zone buffer',
              'A small red pullback candle stopping above the broken ceiling',
              'RSI reading 62',
              'Tightening spreads',
            ],
            correct_index: 0,
            explanation: 'Re-entering the old range signals failure of the flipped support.',
          },
        ],
      },
      {
        id: 'lesson-10-03',
        title: 'Range Trading and Mean Reversion',
        category: 'Trading Strategies',
        summary: 'Trade horizontal range boundaries safely with tight invalidation and strict no-fading rules once boundaries break.',
        learning_objective: 'Execute boundary mean-reversion setups when ADX is low and horizontal walls are clearly respected.',
        introduction:
          'Markets spend substantial periods oscillating sideways between clear ceilings and floors. Range strategies buy support, sell resistance, and target the opposite boundary—with one iron survival rule.',
        content:
          '### Strategy Specification (Range Mean Reversion)\n- **Market Conditions**: At least two clear tests of horizontal support AND two of resistance; `ADX < 20`, flat 50 EMA running horizontally through the range middle.\n- **Instruments & Timeframes**: Lower-volatility crosses or majors (`EUR/GBP`, `AUD/NZD`, `EUR/USD` in quiet macro periods) on H1/H4.\n- **Entry Trigger**: Approach to outer `15%` range boundary + rejection candle + optional RSI extreme (`<30` at support / `>70` at resistance).\n- **Stop / Invalidation**: Strictly outside the range wall (`0.5–0.75 × ATR`) so a true breakout exits promptly.\n- **Exit**: Conservative target just *before* range midpoint (`50%`) or opposite range wall (`75–85%` of range width)—don’t demand exact boundary touches.\n- **Sizing & Costs**: `0.5%` risk; confirm spread/commission stays small relative to range width.\n- **Failure Conditions**: **FATAL FAILURE MODE** — removing stops or averaging down when a clean breakout begins a new macro trend.',
        demonstration:
          '1. Review the Range Reversion schematic: `1.0780–1.0880` (`100`-pip box). Sell rejection at `1.0875`, stop cleanly outside at `1.0905` (`30` pips), target `1.0800` (`75` pips, `2.5:1 R:R`).',
        common_mistakes: [
          'Entering in the dead middle of the range (50% midpoint) where R:R is terrible.',
          'Refusing to stop out when a fundamental catalyst shatters the range wall.',
        ],
        summary_recap:
          'Trade range boundaries only with confirmation and hard stops outside the box—never average down against a range breakout.',
        practical_exercise: {
          title: 'Range Geometry Check',
          objective: 'Measure why entering inside the middle of a range destroys R:R.',
          steps: [
            'Draw a 100-pip horizontal box.',
            'Calculate R:R for buying at the bottom `10%` vs. buying at the `50%` midpoint with stop outside the floor.',
          ],
          deliverable: 'Boundary vs. Midpoint R:R comparison.',
        },
        visual_key: 'strategy-range-reversion',
        duration_minutes: 17,
        tags: ['range-trading', 'mean-reversion', 'boundaries'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-10-03-1',
            question: 'What is the deadliest mistake a range trader can make?',
            options: [
              'Averaging down / removing stops when price decisively breaks out of the range into a new trend',
              'Taking partial profits slightly ahead of the opposite range wall',
              'Standing aside in the middle of the box',
              'Checking ADX below 20',
            ],
            correct_index: 0,
            explanation: 'Mean reversion without hard breakout stops blows accounts when a trend launches.',
          },
          {
            id: 'q-10-03-2',
            question: 'Why avoid initiating trades near the exact 50% middle of a sideways box?',
            options: [
              'Stop distance to the outer wall equals or exceeds distance to target, destroying Reward-to-Risk',
              'Brokers freeze mid-range orders',
              'Candles turn invisible at 50%',
              'Spreads double at midpoints',
            ],
            correct_index: 0,
            explanation: 'Edge exists near outer boundaries where stops are tight and room to target is wide.',
          },
          {
            id: 'q-10-03-3',
            question: 'Why target 80% across the range rather than demanding an exact touch of the far boundary?',
            options: [
              'Price frequently stalls slightly shy of old walls; buffering targets captures reliable fills',
              'Platforms block orders near old highs',
              'Commission drops by 80%',
              'It increases leverage',
            ],
            correct_index: 0,
            explanation: 'Front-running targets slightly avoids frustrating 2-pip misses before reversals.',
          },
        ],
      },
      {
        id: 'lesson-10-04',
        title: 'Momentum Strategies',
        category: 'Trading Strategies',
        summary: 'Understand directional momentum expansion strategies after volatility compression or post-news structural acceptance.',
        learning_objective: 'Apply disciplined momentum rules that demand structural compression and stop-protection rather than reckless chasing.',
        introduction:
          'Momentum traders seek moves where directional strength feeds on itself after clearing key consolidation thresholds—never blind emotional chasing.',
        content:
          '### Strategy Specification (Volatility-Compression Momentum)\n- **Market Conditions**: Low-volatility pinch (`Bollinger Squeeze` / narrow Daily ranges / `ATR` at multi-week lows) near a major structural level.\n- **Instruments & Timeframes**: Trending pairs (`USD/JPY`, `GBP/USD`, `XAU/USD`); H1/H4.\n- **Entry Trigger**: Expansion bar (`>1.5 × ATR`) closing cleanly outside compression zone with `ADX` turning upward past `20–25` and MACD/RSI confirming directional shift.\n- **Stop / Invalidation**: Below the opposite boundary of the compression box (or `1.5 × ATR` trailing base).\n- **Exit**: Trail behind newly formed H1/H4 swing lows/highs or scale out at `2R` and `3R`.\n- **Sizing & Costs**: Smaller risk (`0.5%`) when expansion stop is wider.\n- **Failure Conditions**: False breakout traps when impulse stalls immediately into an adjacent Daily barrier.',
        demonstration:
          '1. Compare reckless chasing (buying late after 3 giant bars hit resistance) vs. structured momentum (entering cleanly right on the first H1 close escaping a 4-day narrow Bollinger Squeeze with open space overhead).',
        common_mistakes: [
          'Confusing "momentum trading" with buying randomly whenever a candle turns bright green.',
          'Ignoring nearby higher-timeframe resistance walls directly in front of the breakout.',
        ],
        summary_recap:
          'Structured momentum trades start from tight compression with open structural space and trail risk behind swing levels.',
        practical_exercise: {
          title: 'Compression vs. Exhaustion Check',
          objective: 'Spot the difference between early momentum birth and late exhaustion.',
          steps: [
            'Find one narrow compression breakout followed by a multi-day trend.',
            'Contrast stop distance at Bar 1 of expansion vs. Bar 6 after 250 pips.',
          ],
          deliverable: 'Early vs. late momentum entry geometry notes.',
        },
        visual_key: 'bollinger-bands-squeeze',
        duration_minutes: 16,
        tags: ['momentum-strategy', 'compression', 'trailing-stop'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-10-04-1',
            question: 'What differentiates disciplined momentum trading from emotional FOMO chasing?',
            options: [
              'Pre-planned entry immediately out of volatility compression with defined stop and clear room ahead',
              'Buying after price already ran 3× Daily ATR straight into Weekly resistance',
              'Ignoring risk sizing',
              'Trading without a chart',
            ],
            correct_index: 0,
            explanation: 'Structured momentum captures expansion *early* out of tight consolidation with clear invalidation.',
          },
          {
            id: 'q-10-04-2',
            question: 'Why does trailing a stop behind H1/H4 swings complement momentum trades well?',
            options: [
              'Strong momentum waves can stretch well beyond fixed 2:1 targets when permitted to run',
              'Trailing stops guarantee zero losses',
              'Trailing removes spread costs',
              'Fixed stops are illegal on USD/JPY',
            ],
            correct_index: 0,
            explanation: 'Trailing protects gains while allowing tail-event trend runs to pay out.',
          },
          {
            id: 'q-10-04-3',
            question: 'When should a momentum breakout be skipped?',
            options: [
              'When an immediate higher-timeframe S&R ceiling sits right ahead blocking realistic Reward-to-Risk',
              'When volatility just emerged from a tight squeeze',
              'During London/NY liquidity',
              'When ADX begins rising past 22',
            ],
            correct_index: 0,
            explanation: 'Running straight into major overhead barriers stunts follow-through.',
          },
        ],
      },
      {
        id: 'lesson-10-05',
        title: 'Moving-Average and Oscillator-Based Systems',
        category: 'Trading Strategies',
        summary: 'Combine one moving-average trend filter with one momentum oscillator trigger and ATR risk sizing—avoiding mechanical crossover traps.',
        learning_objective: 'Build an objective hybrid ruleset integrating Trend Filter + Pullback Zone + Oscillator Timing + ATR Stop.',
        introduction:
          'Pure moving-average crossovers bleed in ranges, and pure oscillators get run over in trends. Pairing them strictly by distinct roles creates far cleaner rules.',
        content:
          '### Clean Hybrid System Specification\n- **Market Conditions**: Trend regime where `Price > 50 EMA > 200 EMA` (bullish) and `50 EMA` slopes clearly upward.\n- **Instruments & Timeframes**: Major liquid pairs on H4 or Daily.\n- **Entry Trigger**: Price pulls back near the rising `20/50 EMA` dynamic zone (aligned with horizontal S&R) while `RSI(14)` dips into `40–50` and hooks upward with a bullish candle close.\n- **Stop / Invalidation**: Below the pullback swing low or `1.5 × ATR(14)`.\n- **Exit**: `2:1 R:R` or partial close at `1.5R` + trail under `20 EMA`.\n- **Sizing & Costs**: Fixed `0.5%–1%` equity risk; max 1 position per correlated currency group.\n- **Failure Conditions**: Fails when `50 EMA` and `200 EMA` flatten and tangle repeatedly inside a broad range.',
        demonstration:
          '1. Trace an H4 uptrend: `200 EMA` rising underneath, `50 EMA` trending higher.\n2. Pullback taps `50 EMA` + prior swing high; `RSI(14)` drops to `44` and turns up on a bullish engulfing bar—all rules align cleanly.',
        common_mistakes: [
          'Trading when the 50 and 200 EMAs are flat and intertwined like spaghetti.',
          'Over-optimizing exact EMA periods on past charts.',
        ],
        summary_recap:
          'Let moving averages filter macro direction, horizontal S&R anchor location, RSI time pullback momentum, and ATR scale risk.',
        practical_exercise: {
          title: 'Spaghetti Filter Drill',
          objective: 'Spot flat, tangled EMA zones to skip automatically.',
          steps: [
            'Plot 20, 50, and 200 EMAs on an H4 chart.',
            'Box periods where EMAs weave flatly sideways and confirm why the system rule forbids trading inside them.',
          ],
          deliverable: 'Annotated trend vs. spaghetti-range comparison.',
        },
        visual_key: 'sma-ema-comparison',
        duration_minutes: 17,
        tags: ['hybrid-system', 'ema', 'rsi', 'atr'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-10-05-1',
            question: 'In a hybrid EMA + RSI pullback system, what does a flat, intertwined 50 and 200 EMA signal?',
            options: [
              'Stand aside—trend clarity is absent and whipsaws are likely',
              'Double lot size',
              'Trade every single bar',
              'Short regardless of support',
            ],
            correct_index: 0,
            explanation: 'Tangled, flat averages visually expose sideways chop where trend-pullback filters do not apply.',
          },
          {
            id: 'q-10-05-2',
            question: 'In this system, what specific role does RSI(14) play?',
            options: [
              'Timing pullback exhaustion (`40–50` reset) *in the direction of the rising EMAs*',
              'Predicting exact interest rates',
              'Calculating account margin',
              'Fading strong trends at 70',
            ],
            correct_index: 0,
            explanation: 'Using RSI to confirm pullback resets *with* the EMA trend blends trend and timing logically.',
          },
          {
            id: 'q-10-05-3',
            question: 'What role does ATR(14) serve inside the system?',
            options: [
              'Scaling stop-loss buffer to current volatility so position sizing remains consistent',
              'Guessing news dates',
              'Measuring Fibonacci ratios',
              'Changing broker account currency',
            ],
            correct_index: 0,
            explanation: 'ATR ensures stops respect active market noise without altering dollar risk.',
          },
        ],
      },
      {
        id: 'lesson-10-06',
        title: 'Fibonacci Pullback Framework',
        category: 'Trading Strategies',
        summary: 'Apply Fibonacci retracement pullbacks strictly as structured confluence with horizontal S&R and market structure.',
        learning_objective: 'Integrate 38.2%–61.8% retracement zones into a disciplined pullback rulebook without treating ratios as standalone magic.',
        introduction:
          'Fibonacci ratios work best when they overlap with horizontal structural zones—giving clear, disciplined pullback zones inside an active impulse.',
        content:
          '### Strategy Specification (Fib + S&R Pullback)\n- **Market Conditions**: Clean impulsive wave that broke prior market structure (`BOS`) leaving a clear swing anchor `A → B`.\n- **Instruments & Timeframes**: Trending FX pairs and Gold on H4/Daily.\n- **Entry Trigger**: Retracement reaches `50%` or `61.8%` **AND** overlaps with a broken horizontal S&R / order-origin zone, confirmed by a rejection or engulfing close.\n- **Stop / Invalidation**: Below the `78.6%` level or cleanly past the `100%` swing origin (`A`).\n- **Exit**: Prior extreme (`0% / B`) for `TP1`, `-27.2%` extension for `TP2`.\n- **Sizing & Costs**: `0.5%–1%` risk; skip if `50%/61.8%` floats in empty chart air with no horizontal S&R.\n- **Failure Conditions**: Deep violent retracement slicing past `78.6%` warns the impulse lacked conviction.',
        demonstration:
          '1. Impulse `1.0700 → 1.0900` breaks prior resistance at `1.0780`.\n2. `61.8%` retracement sits squarely at `1.0776`—aligning directly with flipped horizontal support `1.0780`. Confirmation candle triggers entry with clear stop below `1.0740`.',
        common_mistakes: [
          'Trading blind limit orders at 61.8% in empty space without horizontal S&R or candle confirmation.',
          'Dragging Fib anchors from minor random bars until a ratio touches current price.',
        ],
        summary_recap:
          'Anchor Fibonacci strictly across true BOS impulse legs and require horizontal S&R overlap plus candle confirmation.',
        practical_exercise: {
          title: 'Confluent Fib Filter',
          objective: 'Practice rejecting floating Fib levels that lack horizontal confluence.',
          steps: [
            'Draw Fib retracement across a recent BOS swing on Daily/H4.',
            'Identify whether 38.2%, 50%, or 61.8% overlaps directly with an existing horizontal S&R zone.',
          ],
          deliverable: 'Annotated Fib + S&R alignment example.',
        },
        visual_key: 'fibonacci-retracement',
        duration_minutes: 16,
        tags: ['fibonacci', 'pullback', 'confluence'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-10-06-1',
            question: 'When does a 61.8% Fibonacci retracement level become significantly more meaningful?',
            options: [
              'When it aligns directly with a historical horizontal S&R zone and trend structure',
              'Whenever drawn across any 2-bar M1 wiggle',
              'When placed upside down',
              'When isolated in empty chart space with no prior swings nearby',
            ],
            correct_index: 0,
            explanation: 'Confluence with horizontal support/resistance turns a geometric ratio into an actionable zone.',
          },
          {
            id: 'q-10-06-2',
            question: 'If price slices cleanly all the way past the 100% swing origin A, the Fibonacci pullback setup is:',
            options: [
              'Completely invalidated because the underlying impulse leg failed',
              'Ready for a stronger buy',
              'Converted into a 161.8% buy',
              'Protected by broker guarantee',
            ],
            correct_index: 0,
            explanation: 'Full retracement past the impulse origin negates the upward leg thesis.',
          },
          {
            id: 'q-10-06-3',
            question: 'What are common extension targets used when an impulse resumes from a Fib pullback?',
            options: ['0% (retest of extreme B) and -27.2% / 127.2% extension', '500%', '0.1%', '1,000%'],
            correct_index: 0,
            explanation: 'Retesting extreme B and targeting conservative measured extensions respects natural swing projections.',
          },
        ],
      },
      {
        id: 'lesson-10-07',
        title: 'Session-Based Approaches (Asia, London, New York)',
        category: 'Trading Strategies',
        summary: 'Match trading tactics to liquidity rhythms: quiet Asian consolidation vs. London expansion and NY continuation/reversal windows.',
        learning_objective: 'Explain session liquidity cycles and apply an objective Asian-range breakout/sweep framework safely.',
        introduction:
          'Because Forex liquidity rises and falls as major financial centers wake up, time of day changes how pairs behave.',
        content:
          '### Session Rhythms (UTC Context)\n- **Asian Session**: Often lower volatility for European pairs (`EUR/USD`, `GBP/USD`), frequently forming tight consolidation boxes—while JPY/AUD/NZD pairs respond to Tokyo/Sydney flows.\n- **London Open**: Surge in European institutional order flow often breaks or sweeps the Asian High/Low, establishing intraday directional bias.\n- **London–NY Overlap**: Highest daily volume, handling U.S. data releases and either extending the London move or reversing if London hit a major Daily S&R extreme.\n\n### Session Discipline\nNever assume London *must* fake out the Asian high before dropping—treat Asian High/Low as objective intraday reference levels requiring H1/M15 candle confirmation and clear higher-timeframe bias.',
        demonstration:
          '1. Review the Session-Window strategy diagram: Asian box forms between `1.0840` and `1.0865`.\n2. At London open, Daily bias is bullish; price sweeps slightly below `1.0840` (`1.0834`), snaps back inside cleanly with an M15 MSS, and rallies past `1.0865` into NY.',
        common_mistakes: [
          'Forgetting Daylight Saving Time shifts between London, New York, and Sydney across spring and autumn.',
          'Trading low-spread European strategies late in Friday’s illiquid afternoon.',
        ],
        summary_recap:
          'Align intraday session strategies with true liquidity windows, check DST timezone offsets, and require higher-timeframe bias.',
        practical_exercise: {
          title: 'Asian Range Behaviour Log',
          objective: 'Observe London open behavior around Asian session boundaries.',
          steps: [
            'Box the Asian session high/low on EUR/USD M15 across 3 days.',
            'Record whether London swept one side first, broke out cleanly, or stayed range-bound.',
          ],
          deliverable: '3-day session behavior tally.',
        },
        visual_key: 'strategy-session-windows',
        duration_minutes: 17,
        tags: ['sessions', 'london-open', 'asian-range'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-10-07-1',
            question: 'Why do European pairs (EUR/USD, GBP/USD) often expand sharply around the London Open?',
            options: [
              'European banking and institutional liquidity enters simultaneously after lower-volume Asian consolidation',
              'Brokers turn off spreads',
              'Asian traders ban EUR trading',
              'Interest rates reset every morning at 08:00 London',
            ],
            correct_index: 0,
            explanation: 'London is the largest global FX hub by turnover (per BIS surveys), injecting sharp morning liquidity.',
          },
          {
            id: 'q-10-07-2',
            question: 'Why must session-based traders monitor Daylight Saving Time (DST) transitions in March/April and October/November?',
            options: [
              'US and European clocks shift on different weekends, temporarily altering the London–New York overlap in UTC',
              'Calendars vanish for a week',
              'Swap charges turn negative forever',
              'Chart candles invert',
            ],
            correct_index: 0,
            explanation: 'Clock shifts briefly alter session overlap windows by 1 hour across transition weeks.',
          },
          {
            id: 'q-10-07-3',
            question: 'True or False: London ALWAYS reverses the Asian range trend.',
            options: ['False', 'True'],
            correct_index: 0,
            explanation: 'False. Strong macro days often break directly out of Asia and continue straight through New York.',
          },
        ],
      },
      {
        id: 'lesson-10-08',
        title: 'News-Event Approaches and Reasons to Stand Aside',
        category: 'Trading Strategies',
        summary: 'Understand why trading the raw instant of Tier-1 economic prints is hazardous—and how post-news stabilization setups work safely.',
        learning_objective: 'Manage open exposure around Tier-1 announcements and apply a patient post-news stabilization framework.',
        introduction:
          'Social media glamorizes catching 100-pip NFP spikes in two seconds. In reality, spreads widen violently, slippage blows past stops, and dual-sided whipsaws frequently stop out both buyers and sellers.',
        content:
          '### Why Standing Aside Before High-Impact News Is Professional\n- **Spread Expansion**: Spreads on EUR/USD or XAU/USD can jump 5×–20× normal levels around releases.\n- **Stop Slippage & Gapping**: Stop-loss orders become market orders once triggered; during a 40-pip price gap, fills occur at the *next available price*, creating losses larger than planned.\n- **Revisions & Nuance**: Headline CPI vs. Core CPI vs. Fed commentary can reverse the initial 60-second spike violently.\n\n### Post-News Approach (Wait 15–30+ Minutes)\nAllow the initial algorithmic spike to clear, wait for spreads to normalize, observe where H1/M15 candles **close** relative to Daily S&R, and evaluate structural retests only after dust settles.',
        demonstration:
          '1. Compare two traders on CPI day: Trader A holds tight 12-pip stops directly through the release and suffers heavy slippage; Trader B stands flat, waits 20 minutes until spreads return to 0.8 pips, and evaluates a clean post-news break-and-retest.',
        common_mistakes: [
          'Placing opposing "straddle" buy-stop and sell-stop orders 5 pips apart before NFP (both get triggered and stopped in a whipsaw).',
          'Underestimating how much a surprise rate decision can gap through stops.',
        ],
        summary_recap:
          'Standing aside ahead of Tier-1 news avoids spread explosions and stop slippage; trade post-release acceptance only after liquidity normalizes.',
        practical_exercise: {
          title: 'Pre-News Calendar Protocol',
          objective: 'Integrate the MeridianFX Economic Calendar into daily risk checks.',
          steps: [
            'Open the Economic Calendar page and filter for High-Impact USD/EUR/GBP events this week.',
            'Write a personal rule stating how many minutes before/after Red events you halt new intraday entries.',
          ],
          deliverable: 'Written High-Impact News Standing-Aside Rule.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 17,
        tags: ['news-trading', 'slippage', 'standing-aside'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.BLS_DATA],
        quiz: [
          {
            id: 'q-10-08-1',
            question: 'Why does a stop-loss NOT guarantee your exact fill price during a violent news spike?',
            options: [
              'When price gaps past a stop order, it executes at the next available market price (slippage)',
              'Brokers freeze all stops on Wednesdays',
              'Spreads shrink to zero during gaps',
              'Stop orders cancel automatically during news',
            ],
            correct_index: 0,
            explanation: 'Standard stop-loss orders execute as market orders once triggered and can fill noticeably worse during gaps or thin liquidity.',
          },
          {
            id: 'q-10-08-2',
            question: 'Why do "straddle" breakout traps (placing close buy-stop + sell-stop orders before NFP) routinely fail?',
            options: [
              'Rapid two-way spikes + widened spreads frequently trigger and stop out BOTH sides within seconds',
              'Exchanges prohibit placing two orders',
              'NFP never moves currencies',
              'Straddles cut swap fees',
            ],
            correct_index: 0,
            explanation: 'Initial whipsaw volatility and wide spreads routinely fill both legs at terrible prices.',
          },
          {
            id: 'q-10-08-3',
            question: 'What is the safest course when a major surprise CPI print hits while you have no open position?',
            options: [
              'Stand aside until spreads normalize and post-news candle structure clarifies',
              'Click Market Buy immediately blindly',
              'Increase leverage to 1:500',
              'Turn off your monitor',
            ],
            correct_index: 0,
            explanation: 'Patience lets institutional digestion clarify genuine direction before risking capital.',
          },
        ],
      },
      {
        id: 'lesson-10-09',
        title: 'Carry Trade Fundamentals',
        category: 'Trading Strategies',
        summary: 'Understand interest-rate differential investing (carry trades), overnight swap realities, and sudden risk-off unwind crashes.',
        learning_objective: 'Explain how carry trades earn rate differentials, why retail broker markups shrink raw swap yields, and why carry unwinds turn violent.',
        introduction:
          'When one central bank pays 5% interest and another pays 0%, borrowing the low-yield currency to hold the high-yield currency collects daily interest—until panic strikes.',
        content:
          '### How Carry Trades Work\n- **Concept**: Go **long** a high-interest-rate currency funded by a low-interest-rate currency (historically pairs like `AUD/JPY` or `USD/JPY` during positive yield gaps).\n- **Macro Tailwind**: Works best in calm, low-volatility global "risk-on" growth environments where rate differentials stay wide.\n\n### Critical Retail Realities & Failure Modes\n1. **Broker Swap Markups**: Retail CFDs charge financing spreads on overnight swaps—meaning raw policy differentials rarely pass through 100%, and **both** long and short swaps can sometimes be negative on narrow-gap pairs!\n2. **Triple Swap Wednesday**: Overnight rollover triples on Wednesday nights (standard T+2 settlement).\n3. **Risk-Off Elevator**: When recessions, geopolitical shocks, or sudden central-bank pivots hit, crowded carry trades unwind rapidly—erasing months of swap income in days.',
        demonstration:
          '1. Compare earning `+0.4 pips/day` in swap over 100 days (`+40 pips`) versus a single `350-pip` sudden JPY risk-off rally when carry positions stampede out simultaneously.',
        common_mistakes: [
          'Assuming holding a positive-swap pair is "risk-free passive income like a savings account."',
          'Neglecting to check actual broker swap rates before holding multi-week swing positions.',
        ],
        summary_recap:
          'Carry trades harvest yield differentials during calm macro periods—always check actual broker swaps and stay prepared for rapid risk-off unwinds.',
        practical_exercise: {
          title: 'Swap Spec Reality Check',
          objective: 'Compare policy rate gaps against realistic spot volatility.',
          steps: [
            'Check current Daily ATR(14) on USD/JPY or AUD/JPY.',
            'Compare one day’s normal spot fluctuation (e.g., 100 pips) to typical modest daily carry interest.',
          ],
          deliverable: 'Carry vs. Spot Volatility ratio calculation.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 16,
        tags: ['carry-trade', 'swaps', 'interest-rates'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.FED_MONETARY],
        quiz: [
          {
            id: 'q-10-09-1',
            question: 'What is the core hazard of treating a positive-swap FX carry trade like a risk-free bank deposit?',
            options: [
              'Spot exchange-rate declines during risk-off shocks can rapidly wipe out months of accumulated swap payments',
              'Banks pay swap on Sundays only',
              'Currencies cannot move down when swaps are positive',
              'Carry trades carry zero margin requirements',
            ],
            correct_index: 0,
            explanation: 'FX spot volatility dwarfs daily swap payments whenever macro sentiment turns risk-off.',
          },
          {
            id: 'q-10-09-2',
            question: 'Why do most spot Forex brokers apply triple overnight swap on Wednesday rollover?',
            options: [
              'To account for weekend settlement across the standard T+2 spot value date cycle',
              'As a mid-week penalty fee',
              'Because liquidity triples on Wednesdays',
              'Due to European holidays every week',
            ],
            correct_index: 0,
            explanation: 'T+2 settlement rolls Wednesday spot positions across Saturday and Sunday.',
          },
          {
            id: 'q-10-09-3',
            question: 'Which macro environment tends to be most hostile to classic high-yield carry trades?',
            options: [
              'Sudden global risk-off stress, banking fear, or narrowing rate differentials',
              'Calm steady global growth with stable wide yield spreads',
              'Low volatility ranges',
              'Gradual tightening by the high-yield central bank',
            ],
            correct_index: 0,
            explanation: 'Panic triggers forced deleveraging out of carry positions into funding currencies.',
          },
        ],
      },
      {
        id: 'lesson-10-10',
        title: 'Scalping, Day Trading, Swing, and Position Trading',
        category: 'Trading Strategies',
        summary: 'Compare the four core trading styles across holding periods, screen time, cost sensitivity, and lifestyle fit.',
        learning_objective: 'Select a realistic trading timeframe aligned with your job/schedule, spread constraints, and psychological stamina.',
        introduction:
          'Trying to scalp 5-minute charts during sneak breaks at a full-time office job guarantees burnout and sloppy execution. Your strategy horizon must fit your real life.',
        content:
          '### Comparing the Four Horizons\n1. **Scalping (Seconds–Minutes | M1–M5)**: Ultra-short holding times, dozens of trades, extreme sensitivity to spread/commission/slippage, high mental stress. **Not recommended for beginners.**\n2. **Day Trading (Minutes–Hours | M15–H1)**: Flat before daily rollover; captures single session swings; requires dedicated 2–3 hour focused window during London or NY.\n3. **Swing Trading (Days–Weeks | H4–Daily)**: Captures multi-day structure swings; low cost drag, low screen stress, fits seamlessly around full-time jobs/studies; requires accounting for overnight swaps and weekend gap risk.\n4. **Position Trading (Weeks–Months | Daily–Weekly)**: Macro fundamental + Weekly trend positioning; requires wide stops and patience.',
        demonstration:
          '1. Compare Transaction Cost Drag: `1.2 pip` spread+commission on a `10-pip` scalp target = `12%` instant friction per trade. On a `150-pip` swing target = `0.8%` friction.',
        common_mistakes: [
          'Choosing 1-minute scalping out of impatience for quick cash.',
          'Switching styles every three days after normal drawdowns.',
        ],
        summary_recap:
          'Match your trading horizon to your real availability and cost tolerance—Swing and measured Day Trading offer far healthier beginner foundations than high-frequency scalping.',
        practical_exercise: {
          title: 'Schedule & Cost Fit Profile',
          objective: 'Identify your optimal trading timeframe based on honest daily constraints.',
          steps: [
            'Write down your reliable daily focused chart hours in UTC.',
            'Select whether Swing (H4/Daily) or Session Day Trading (H1/M15) fits without interrupting work or sleep.',
          ],
          deliverable: 'Personal Trading Horizon Fit Statement.',
        },
        visual_key: 'pair-cost-comparison',
        duration_minutes: 15,
        tags: ['scalping', 'day-trading', 'swing-trading', 'position-trading'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-10-10-1',
            question: 'Which trading style faces the heaviest mathematical drag from spreads, commissions, and slippage?',
            options: ['High-frequency 1-minute scalping', 'Daily swing trading', 'Weekly position trading', 'Monthly macro investing'],
            correct_index: 0,
            explanation: 'Tiny profit targets lose a large proportion of upside to fixed execution friction.',
          },
          {
            id: 'q-10-10-2',
            question: 'Which style is generally most compatible with a full-time daytime job or university schedule?',
            options: ['H4 / Daily Swing Trading', '1-minute London-open scalping', '5-second tick scalping', 'News-spike straddling'],
            correct_index: 0,
            explanation: 'Checking H4/Daily bars at scheduled evening/morning transitions prevents rushed workplace mistakes.',
          },
          {
            id: 'q-10-10-3',
            question: 'What distinct cost/risk factor affects Swing/Position traders more than pure intraday Day Traders?',
            options: [
              'Overnight swap financing and weekend gap risk',
              'Ultra-fast click speed',
              'Need for 100 trades per day',
              'Intraday 1-minute noise',
            ],
            correct_index: 0,
            explanation: 'Holding across daily rollovers and weekends introduces swap costs and Sunday gap exposure.',
          },
        ],
      },
      {
        id: 'lesson-10-11',
        title: 'Strategy Rules (Market, Setup, Trigger, Stop, Target, Exit)',
        category: 'Trading Strategies',
        summary: 'Draft an airtight, unambiguous trading plan document so two different people reading your rules identify identical setups.',
        learning_objective: 'Write a complete 6-block strategy rulebook removing fuzzy discretion and guesswork.',
        introduction:
          'If your strategy relies on "I enter when it feels ready," you cannot backtest it, review it, or trust it during a losing streak. Clarity turns ideas into repeatable systems.',
        content:
          '### The 6 Non-Negotiable Strategy Rule Blocks\n1. **Market Universe & Regime**: Exact instruments, timeframes, and allowed regimes (e.g., Trending vs. Range) plus prohibited conditions.\n2. **Setup Conditions**: Objective location criteria (S&R zone, EMA alignment, ADX threshold).\n3. **Entry Trigger**: Exact candle-close or retest event authorizing entry.\n4. **Stop-Loss & Invalidation**: Exact placement formula beyond structure + `ATR` buffer; zero widening allowed.\n5. **Target & Exit Rules**: Exact `TP1/TP2`, trailing rule, or time-based exit.\n6. **Risk & Cost Cap**: Risk % per trade, max open correlated positions, and max acceptable spread.',
        demonstration:
          '1. Review the Strategy Rulebook Blueprint diagram translating vague intuition ("buy dips when up") into strict objective clauses ready for demo forward testing.',
        common_mistakes: [
          'Writing fuzzy exits like "close when I get nervous" instead of objective structural rules.',
          'Changing rules mid-trade to avoid taking a normal stop-loss.',
        ],
        summary_recap:
          'A complete strategy document leaves zero ambiguity around market filter, setup, trigger, stop, exit, and risk budget.',
        practical_exercise: {
          title: 'One-Page Strategy Rulebook Draft',
          objective: 'Author a crisp 1-page rulebook for your chosen primary style.',
          steps: [
            'Fill out all 6 blocks for either a Trend Pullback or Break-and-Retest approach.',
            'Verify whether a study partner reading only your page could mark the same setup on a chart.',
          ],
          deliverable: 'Complete 6-block Strategy Rulebook.',
        },
        visual_key: 'strategy-rulebook-blueprint',
        duration_minutes: 17,
        tags: ['strategy-rules', 'trading-plan', 'systematization'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-10-11-1',
            question: 'What is a good litmus test that your strategy rules are objective enough?',
            options: [
              'Another trained person reading only your rules marks largely the same entries and stops on a chart',
              'Only you can understand it depending on your mood',
              'It uses zero stop-losses',
              'It changes every morning',
            ],
            correct_index: 0,
            explanation: 'Reproducibility removes emotional rationalization and makes statistical review possible.',
          },
          {
            id: 'q-10-11-2',
            question: 'Should "Market Conditions to Avoid (Stand-Aside Rules)" be part of your strategy rulebook?',
            options: [
              'Yes—knowing when NOT to trade prevents massive drawdowns in hostile regimes',
              'No, trade every single hour',
              'Only on holidays',
              'Only for crypto',
            ],
            correct_index: 0,
            explanation: 'Filtering incompatible chop/news windows protects expectancy.',
          },
          {
            id: 'q-10-11-3',
            question: 'When should exit rules be finalized?',
            options: ['Before placing the entry order', 'Only after price turns against you', 'Next week', 'Never—exit randomly'],
            correct_index: 0,
            explanation: 'Pre-defining both stop and exit removes panic decision-making while capital is exposed.',
          },
        ],
      },
      {
        id: 'lesson-10-12',
        title: 'Transaction Costs, Execution, and Strategy Expectancy',
        category: 'Trading Strategies',
        summary: 'Compute true mathematical expectancy honestly after spreads, commissions, swaps, and slippage—understanding why win rate alone misleads.',
        learning_objective: 'Calculate net expectancy in R-multiples and see how both win rate and payoff ratio work together.',
        introduction:
          'A strategy winning 75% of the time can still lose money steadily if losses are 4× bigger than wins. Conversely, a 45% win-rate strategy can thrive with disciplined 2.5R winners.',
        content:
          '### The Expectancy Formula\n`Expectancy (E) = (Win% × Avg Win R) − (Loss% × Avg Loss R) − Cost Drag (in R)`\n\n### Illustrative Scenarios (Strictly Educational Examples)\n- **High Win Rate, Bad Payoff**: Win `70%` making `+0.5R`, lose `30%` losing `-1.5R` → `(0.70 × 0.5) - (0.30 × 1.5) = 0.35 - 0.45 = -0.10R` (loses money over time even at 70% wins!).\n- **Moderate Win Rate, Strong Discipline**: Win `45%` making `+2.0R`, lose `55%` losing `-1.0R` → `(0.45 × 2.0) - (0.55 × 1.0) = 0.90 - 0.55 = +0.35R` before costs.\n\n**Reality Check**: Always subtract realistic round-turn costs (spread + commission + slippage in R) because thin edges shrink fast under real execution.',
        demonstration:
          '1. Plug those exact hypothetical numbers into the Academy Expectancy Calculator to observe break-even win rates at `1:1`, `1:2`, and `1:3` Risk-to-Reward ratios.',
        common_mistakes: [
          'Bragging about "80% win rate" while hiding huge losing trades held without stops.',
          'Ignoring spread and slippage when computing theoretical backtest expectancy.',
        ],
        summary_recap:
          'Expectancy combines Win Rate, Payoff Ratio, and Execution Costs—focus on positive net R-expectancy rather than vanity win percentages.',
        practical_exercise: {
          title: 'Expectancy Sensitivity Lab',
          objective: 'Test how costs and payoff shifts affect strategy survival.',
          steps: [
            'Open the Academy Risk-to-Reward & Expectancy Calculator.',
            'Compute break-even win rate at 1:1, 1:2, and 1:3 R:R, then test adding 0.10R transaction cost per trade.',
          ],
          deliverable: 'Completed expectancy sensitivity worksheet.',
        },
        visual_key: 'expectancy-costs-diagram',
        duration_minutes: 18,
        tags: ['expectancy', 'transaction-costs', 'win-rate'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-10-12-1',
            question: 'Assuming 0 costs, what is the break-even win rate for a consistent 1:2 Risk-to-Reward strategy (+2R wins, -1R losses)?',
            options: ['33.4%', '50.0%', '66.7%', '20.0%'],
            correct_index: 0,
            explanation: 'At 2:1 R:R, 1/(1+2) = 33.33% breaks even before transaction costs.',
          },
          {
            id: 'q-10-12-2',
            question: 'Can a trader with a 75% win rate still lose money overall?',
            options: [
              'Yes—if their 25% losing trades average more than 3× the size of their winning trades',
              'No, anything over 50% always profits',
              'Only if they use EUR/USD',
              'Only on leap years',
            ],
            correct_index: 0,
            explanation: 'Large uncontained losses routinely destroy high-win-rate accounts ("picking up pennies in front of a steamroller").',
          },
          {
            id: 'q-10-12-3',
            question: 'Why must transaction costs be expressed relative to stop-loss risk (in R)?',
            options: [
              'Because a 2-pip spread consumes 20% of a 10-pip stop (0.2R cost drag), severely eroding narrow-stop edges',
              'To inflate historical returns',
              'To waive swap fees',
              'To double position leverage',
            ],
            correct_index: 0,
            explanation: 'Measuring costs in R exposes how devastating wide spreads are on ultra-tight stops.',
          },
        ],
      },
    ],
  },
];
