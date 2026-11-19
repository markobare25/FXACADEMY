import { OFFICIAL_SOURCES, type CurriculumCourseSeed } from './types.ts';

export const COURSES_11_13: CurriculumCourseSeed[] = [
  {
    id: 'course-11-risk-management',
    slug: 'risk-management',
    course_number: 11,
    title: '11. Risk Management',
    category: 'Risk Management',
    level: 'Intermediate',
    level_label: 'Essential',
    description:
      'Protect your capital above all else: master % risk per trade, exact lot-size formulas, pip-value conversion, structural stop-losses, R:R expectancy, asymmetric drawdown math, correlated exposure, margin close-out, slippage/gap risks, news/weekend risk, losing-streak survival, and written emergency stop rules.',
    prerequisites: 'Courses 01 and 02 recommended. Mandatory before live trading.',
    learning_outcomes: [
      'Calculate exact position sizes in standard, mini, and micro lots across any account currency.',
      'Explain why drawdown recovery math is dangerously asymmetric (-50% loss requires +100% gain).',
      'Identify hidden correlated exposure across pairs sharing USD, EUR, or JPY.',
      'Account honestly for leverage, margin call/stop-out thresholds, spreads, swaps, gaps, and losing streaks.',
    ],
    estimated_hours: 5,
    cover_image_url: '/src/assets/images/hero_trading_desk_1795085837463.jpg',
    assessment: [
      {
        id: 'c11-a1',
        question: 'If an account suffers a 50% drawdown (dropping from $10,000 to $5,000), what percentage return is required merely to get back to $10,000?',
        options: ['100%', '50%', '75%', '25%'],
        correct_index: 0,
        explanation: 'Recovering $5,000 from a remaining $5,000 base requires doubling (+100%) your capital.',
      },
      {
        id: 'c11-a2',
        question: 'With a $5,000 USD account, a strict 1% risk limit ($50), and a 25-pip stop-loss on EUR/USD ($10/pip per standard lot), what is the correct lot size?',
        options: ['0.20 lots (2 mini lots)', '1.00 lot', '0.50 lots', '2.00 lots'],
        correct_index: 0,
        explanation: 'Lot Size = $50 / (25 pips × $10) = $50 / $250 = 0.20 standard lots.',
      },
      {
        id: 'c11-a3',
        question: 'Why does opening Buy EUR/USD (1% risk), Buy GBP/USD (1% risk), and Sell USD/CHF (1% risk) simultaneously create hidden concentration?',
        options: [
          'All three positions heavily short the US Dollar simultaneously—meaning a sudden USD rally could trigger roughly 3% correlated loss at once',
          'They completely hedge each other to zero risk',
          'Brokers forbid trading CHF alongside EUR',
          'Pip values drop by 50%',
        ],
        correct_index: 0,
        explanation: 'Correlated pairs move largely on the shared USD leg, concentrating portfolio exposure.',
      },
      {
        id: 'c11-a4',
        question: 'Can a standard stop-loss guarantee zero slippage during a weekend gap or surprise central bank shock?',
        options: [
          'No—when markets gap across a stop level, standard stop orders execute at the next available price',
          'Yes, standard stops always fill at exact limit prices regardless of gaps',
          'Only on Mondays',
          'Yes if leverage is high',
        ],
        correct_index: 0,
        explanation: 'Fast gaps cause slippage because standard stops convert into market orders once triggered.',
      },
      {
        id: 'c11-a5',
        question: 'What is the purpose of a hard daily and weekly maximum loss rule?',
        options: [
          'To automatically halt trading during tilt, hostile market regimes, or bad streaks before permanent capital damage occurs',
          'To force bigger lot sizes to recover losses the same afternoon',
          'To avoid broker swap fees',
          'To boost win rate mathematically',
        ],
        correct_index: 0,
        explanation: 'Circuit-breaker loss limits preserve both account equity and emotional clarity.',
      },
    ],
    lessons: [
      {
        id: 'lesson-11-01',
        title: 'Risk Per Trade and Capital Preservation',
        category: 'Risk Management',
        summary: 'Learn why keeping single-trade risk strictly at 0.25%–1.0% ensures survival across inevitable losing streaks.',
        learning_objective: 'Choose a conservative fixed fractional risk percentage and defend capital preservation as Priority #1.',
        introduction:
          'You cannot compound money you no longer have. Professional traders measure survival first and upside second by capping how much any single trade can cost.',
        content:
          '### Fixed Fractional Risk (`0.25% – 1.0%`)\n- **Beginner / Developing**: `0.25% – 0.50%` per trade gives wide cushion while building consistency.\n- **Experienced Standard**: `0.50% – 1.00%` max per trade.\n- **Never Risk `5%–20%` per Trade**: Even a skilled 50%-win trader faces ~1-in-16 odds of 4 consecutive losses within a short stretch—at 10% risk, just 5 losses shred ~41% of equity!\n\nEvery trade is simply one sample in a long series. Small fixed % risk keeps emotions calm and lets probabilities play out.',
        demonstration:
          '1. Compare two $10,000 accounts through a realistic 6-trade losing streak:\n2. **Trader A (`0.5%` risk)**: Account stands at `$9,703` (`-2.97%`)—calm and intact.\n3. **Trader B (`10%` risk)**: Account plunges to `$5,314` (`-46.86%`)—now needing `+88%` just to recover.',
        common_mistakes: [
          'Scaling risk up aggressively after a win streak ("I feel hot").',
          'Using fixed lot sizes (like always trading 0.50 lots) regardless of stop-loss width.',
        ],
        summary_recap:
          'Cap risk per trade at 0.25%–1% of current equity so routine losing streaks never threaten survival.',
        practical_exercise: {
          title: 'Personal Max Risk Mandate',
          objective: 'Define your hard single-trade loss limit.',
          steps: [
            'Write down your exact % risk cap per demo/live trade (e.g., 0.5%).',
            'Test a 10-loss streak at that % inside the Academy Drawdown Simulator.',
          ],
          deliverable: 'Signed risk-per-trade rule + 10-loss simulation screenshot/note.',
        },
        visual_key: 'drawdown-recovery-curve',
        duration_minutes: 16,
        tags: ['capital-preservation', 'risk-per-trade', 'fixed-fractional'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-11-01-1',
            question: 'Why is 0.5% to 1.0% per trade widely recommended over 5% to 10%?',
            options: [
              'Inevitably recurring losing streaks cause shallow, recoverable dips instead of catastrophic drawdowns',
              'Brokers forbid 1% risk',
              'It eliminates losing trades',
              'It increases spread cost',
            ],
            correct_index: 0,
            explanation: 'Low per-trade risk makes losing streaks statistically survivable without panic.',
          },
          {
            id: 'q-11-01-2',
            question: 'Should lot size stay identical when one setup needs a 20-pip stop and another needs a 60-pip stop?',
            options: [
              'No—adjust lot size inversely with stop distance so dollar risk stays constant',
              'Yes, always trade 1.00 lot',
              'Double lot size on wider stops',
              'Skip stop-losses',
            ],
            correct_index: 0,
            explanation: 'Equalizing % dollar risk requires scaling lots down when stops widen.',
          },
          {
            id: 'q-11-01-3',
            question: 'What is the primary job of a risk manager before thinking about profits?',
            options: ['Stay in the game through capital preservation', 'Predict tops to the exact tick', 'Maximize leverage', 'Avoid stops'],
            correct_index: 0,
            explanation: 'Survival precedes compounding.',
          },
        ],
      },
      {
        id: 'lesson-11-02',
        title: 'Position Sizing and Lot-Size Calculations',
        category: 'Risk Management',
        summary: 'Compute exact Forex lot sizes dynamically from Account Equity, Risk %, Stop Distance in Pips, and Pip Value.',
        learning_objective: 'Solve the universal lot-size formula cleanly before placing every single trade.',
        introduction:
          'Stop distance should come from market structure—not from "how tight does my stop have to be to fit 1 lot?" Position sizing adapts your lot size to the chart, never the other way around.',
        content:
          '### Universal Position Size Formula\n`Dollar Risk = Account Balance × Risk %`\n`Lot Size = Dollar Risk ÷ (Stop Distance in Pips × Pip Value per 1.00 Standard Lot)`\n\n### Worked Step-by-Step Example\n- Balance = `$4,000 USD`, Risk = `1%` (`$40`)\n- Setup Stop Distance = `40 pips` on `GBP/USD` (`$10/pip` per standard lot)\n- `Lot Size = $40 ÷ (40 × $10) = $40 ÷ $400 = 0.10 standard lots` (1 mini lot = 10,000 units).\n\nRounding **down** (never up!) ensures you never exceed your risk budget.',
        demonstration:
          '1. Review the Position Sizing Equation diagram and verify `$4,000` at `1%` across three stop widths: `20 pips → 0.20 lots`, `40 pips → 0.10 lots`, `80 pips → 0.05 lots`. Notice Risk stays fixed at `$40` across all three!',
        common_mistakes: [
          'Guessing lot sizes by habit ("I always click 0.2 lots") instead of calculating per stop width.',
          'Rounding lot sizes upward when decimals fall between increments.',
        ],
        summary_recap:
          'Calculate Lot Size = Risk Dollars ÷ (Stop Pips × Pip Value/Lot) every trade and always round down to respect your risk ceiling.',
        practical_exercise: {
          title: 'Three-Scenario Sizing Drill',
          objective: 'Gain speed and accuracy using the Academy Position Size Calculator.',
          steps: [
            'Open the Academy Position Size Calculator.',
            'Solve for: (a) $2,500 at 0.5% with 25-pip stop, (b) $12,000 at 1% with 60-pip stop, (c) $1,000 at 1% with 50-pip stop.',
          ],
          deliverable: '3 calculated lot sizes verified cleanly.',
        },
        visual_key: 'position-sizing-equation',
        duration_minutes: 18,
        tags: ['position-sizing', 'lot-size', 'formula'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-11-02-1',
            question: 'Account = $2,000, Risk = 1% ($20), Stop = 20 pips, Pip Value = $10/lot. What is the exact lot size?',
            options: ['0.10 standard lots', '0.20 standard lots', '1.00 standard lot', '0.01 standard lots'],
            correct_index: 0,
            explanation: '$20 ÷ (20 × $10) = $20 ÷ $200 = 0.10 standard lots.',
          },
          {
            id: 'q-11-02-2',
            question: 'If your calculation returns 0.147 lots and your broker allows 0.01 increments, which size protects your rule?',
            options: ['0.14 lots (round down)', '0.15 lots (round up)', '0.20 lots', '1.00 lot'],
            correct_index: 0,
            explanation: 'Rounding down ensures actual dollar risk never slightly breaches your hard limit.',
          },
          {
            id: 'q-11-02-3',
            question: 'What dictates stop distance first—your preferred lot size or chart invalidation structure?',
            options: [
              'Chart invalidation structure—position size then adapts mathematically to fit that stop',
              'Always pick 1.00 lot and shrink stops to 3 pips',
              'Random integer stops',
              'Social media rules',
            ],
            correct_index: 0,
            explanation: 'Structure sets the stop; math scales the lot size.',
          },
        ],
      },
      {
        id: 'lesson-11-03',
        title: 'Pip Value and Account-Currency Conversion',
        category: 'Risk Management',
        summary: 'Compute exact pip values on non-USD crosses (EUR/GBP, USD/JPY, CAD/CHF) for USD, EUR, or GBP accounts.',
        learning_objective: 'Convert quote-currency pip values accurately into your account base currency.',
        introduction:
          'Pip value is NOT always $10 per standard lot! Ignoring quote-currency conversion on pairs like EUR/GBP or USD/JPY causes accidental over-sizing.',
        content:
          '### Pip Value Rules\n- **XXX/USD pairs** (`EUR/USD`, `GBP/USD`, `AUD/USD`): 1 pip (`0.0001`) = `$10` per standard lot in a USD account.\n- **USD/JPY** (JPY quote): 1 pip (`0.01` of `100,000 = ¥1,000`). Divide `¥1,000 ÷ USD/JPY rate` (e.g., at `150.00`, 1 pip ≈ `$6.67` per standard lot!).\n- **EUR/GBP** (GBP quote): 1 pip = `£10` per standard lot. Multiply `£10 × GBP/USD` (e.g., at `1.2700`, 1 pip = `$12.70` USD!).\n\nNotice how `EUR/GBP` moves cost nearly **twice** as much per pip as `USD/JPY` at those illustrative rates!',
        demonstration:
          '1. Compare 30-pip stops on `0.10` lots in a USD account: `EUR/USD` = `$30` risk; `USD/JPY (@150)` = `~$20` risk; `EUR/GBP (@1.27 GBP/USD)` = `$38.10` risk—always verify pip value first!',
        common_mistakes: [
          'Assuming every pair on earth equals $10 per pip per lot.',
          'Forgetting JPY pairs quote pips at the 2nd decimal place (`0.01`), not 4th.',
        ],
        summary_recap:
          'Pip values always originate in the quote currency and must convert into your account currency before sizing lots.',
        practical_exercise: {
          title: 'Cross-Pair Pip Value Lab',
          objective: 'Use the Academy Pip Value Converter to compare 4 pairs.',
          steps: [
            'Open the Academy Pip Value Calculator.',
            'Compare pip value per 0.10 lot on EUR/USD, USD/JPY, EUR/GBP, and USD/CAD.',
          ],
          deliverable: '4-pair pip value comparison sheet.',
        },
        visual_key: 'pip-conversion-formula',
        duration_minutes: 17,
        tags: ['pip-value', 'currency-conversion', 'cross-pairs'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'q-11-03-1',
            question: 'In a USD-denominated account, which pair has a pip value HIGHER than $10 per standard lot (assuming GBP/USD = 1.28)?',
            options: ['EUR/GBP (1 pip = £10 ≈ $12.80)', 'EUR/USD ($10)', 'USD/JPY (@150 ≈ $6.67)', 'NZD/USD ($10)'],
            correct_index: 0,
            explanation: 'Because GBP is worth more than USD (`1.28`), £10 per pip converts to ~$12.80 USD.',
          },
          {
            id: 'q-11-03-2',
            question: 'For 1 standard lot of USD/JPY when USD/JPY trades around 150.00, approximately what is 1 pip worth in USD?',
            options: ['About $6.67 (¥1,000 ÷ 150)', 'Exactly $10.00', 'About $150.00', '$1.00'],
            correct_index: 0,
            explanation: '0.01 × 100,000 = ¥1,000; ¥1,000 ÷ 150 ≈ $6.67 USD.',
          },
          {
            id: 'q-11-03-3',
            question: 'Why must you convert pip value into your account currency BEFORE calculating lot size?',
            options: [
              'So your true dollar/euro loss matches your intended risk %',
              'To waive overnight swap fees',
              'To unlock higher leverage',
              'Brokers convert charts automatically',
            ],
            correct_index: 0,
            explanation: 'Using $10 mistakenly on EUR/GBP risks ~28% more money than planned.',
          },
        ],
      },
      {
        id: 'lesson-11-04',
        title: 'Stop-Loss Placement and Invalidation',
        category: 'Risk Management',
        summary: 'Place stop-losses objectively beyond structural invalidation using volatility context rather than arbitrary fixed pip numbers.',
        learning_objective: 'Distinguish structural stop placement from emotional or arbitrary pip stops.',
        introduction:
          'A stop-loss is not a defeat—it is the exact market price proving your trade idea is wrong. Placing it logically saves capital from random noise AND catastrophic drops.',
        content:
          '### Three Stop-Placement Guidelines\n1. **Structural Invalidation First**: For a long at support, the stop belongs *beyond* the support zone and protecting swing low—not halfway inside the zone.\n2. **Volatility Buffer (`ATR`)**: Add `0.25–0.50 × ATR` plus spread cushion beyond obvious wicks or round numbers so normal noise does not clip your order.\n3. **Never Widen a Stop After Entry**: Tightening risk when thesis changes is fine; moving a stop *further away* hoping price turns back destroys account discipline.\n\n**Reality Check**: Standard stop-loss orders protect under normal liquidity—during sudden gaps or major shocks, slippage can occur (guaranteed stops may cost an extra premium where offered).',
        demonstration:
          '1. Compare two stops on a `1.0800` support bounce (swing low `1.0785`, H1 ATR `18` pips):\n2. **Naive 10-pip stop (`1.0790`)**: Sits inside routine support noise and gets swept harmlessly before rallying.\n3. **Structural + Buffer stop (`1.0774`, `26` pips)**: Sits cleanly beyond `1.0785` + spread + small ATR cushion, with lot size scaled slightly smaller to keep dollar risk identical.',
        common_mistakes: [
          'Setting an arbitrary "always 15 pips" stop regardless of timeframe or ATR.',
          'Trading with "mental stops" instead of real server-side protective orders.',
        ],
        summary_recap:
          'Set real server-side stop-losses beyond structural invalidation + volatility buffer, scale lot size accordingly, and never widen stops.',
        practical_exercise: {
          title: 'Structural Stop Buffer Drill',
          objective: 'Practice calculating stops from structure + ATR.',
          steps: [
            'Mark a swing support zone on an H4 chart and read H1/H4 ATR(14).',
            'Calculate exact structural stop price including a 0.25×ATR buffer and verify lot size.',
          ],
          deliverable: 'Annotated structural stop distance calculation.',
        },
        visual_key: 'risk-reward-geometry',
        duration_minutes: 17,
        tags: ['stop-loss', 'invalidation', 'atr-buffer'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-11-04-1',
            question: 'What does your stop-loss price represent conceptually?',
            options: [
              'The objective price where your setup thesis is invalidated and continuing to hold no longer makes sense',
              'The maximum pain your mood can endure arbitrarily',
              'A line you should push further back whenever price gets close',
              'Always 15 pips below entry',
            ],
            correct_index: 0,
            explanation: 'Stops belong at structural invalidation, never random dollar numbers.',
          },
          {
            id: 'q-11-04-2',
            question: 'Why are "mental stops" dangerous compared to actual server-side stop-loss orders?',
            options: [
              'Emotions cause hesitation when price hits invalidation—and power/internet outages leave accounts unprotected during spikes',
              'Mental stops pay extra spread',
              'Brokers disable take-profits without mental stops',
              'Server stops guarantee zero gaps always',
            ],
            correct_index: 0,
            explanation: 'Human hesitation and technical outages turn mental stops into uncontained losses.',
          },
          {
            id: 'q-11-04-3',
            question: 'Why adjust lot size downward rather than tightening the stop inside structure if the structural stop looks "wide"?',
            options: [
              'Keeping the stop logically placed preserves setup integrity while smaller lot size preserves identical % dollar risk',
              'It makes targets closer automatically',
              'Wide stops always win',
              'Lot size cannot be adjusted',
            ],
            correct_index: 0,
            explanation: 'Never sacrifice structural safety just to trade a bigger lot size.',
          },
        ],
      },
      {
        id: 'lesson-11-05',
        title: 'Risk-to-Reward and Expectancy',
        category: 'Risk Management',
        summary: 'Structure asymmetric 1:2+ Risk-to-Reward trades around realistic market obstacles rather than imaginary targets.',
        learning_objective: 'Balance Risk-to-Reward targets realistically against higher-timeframe resistance and compute net expectancy.',
        introduction:
          'Chasing arbitrary "1:10 Risk-to-Reward" targets straight through multi-month resistance walls fails because price turns long before fantasy targets fill. Realism matters.',
        content:
          '### Realistic R:R Engineering\n- Measure **Reward** strictly to the next realistic opposing structural target (prior swing extreme or S&R zone)—never blindly placing TP 300 pips past a Weekly wall just to brag about "1:5 R:R".\n- If clear room yields `< 1.5:1 R:R` before major traffic, **skip the trade** cleanly.\n- Aim generally for `1.8:1 – 3:1` structural payoff where target probabilities remain realistic.\n\nRemember: **Positive Expectancy** requires both feasible targets *and* disciplined loss caps.',
        demonstration:
          '1. Review the Risk-to-Reward Geometry diagram: `Stop = 30 pips (-1R)` beneath support; major resistance sits `75 pips` overhead (`+2.5R`). Setting TP at `70 pips` (`+2.33R`, cleanly ahead of the `75-pip` wall) balances realistic fill odds with strong asymmetry.',
        common_mistakes: [
          'Forcing 1:5 targets right through heavy opposing S&R so winners turn around into stop-outs.',
          'Cutting winners hastily at +0.4R out of fear while letting losers run full -1R.',
        ],
        summary_recap:
          'Target realistic structural zones offering >= 1.5:1–2:1 room ahead of barriers—never inflate fantasy targets to force R:R ratios.',
        practical_exercise: {
          title: 'Realistic Target Audit',
          objective: 'Test R:R feasibility before entering.',
          steps: [
            'Open the Academy R:R & Expectancy Calculator.',
            'Check how a 45% win rate behaves at 1.2:1 vs. 2.2:1 R:R over 100 trades.',
          ],
          deliverable: 'Expectancy calculator findings note.',
        },
        visual_key: 'risk-reward-geometry',
        duration_minutes: 16,
        tags: ['risk-reward', 'expectancy', 'targets'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'q-11-05-1',
            question: 'What happens if you regularly cut 2:1 winners early at +0.5R out of fear while holding full -1R stops?',
            options: [
              'Your actual realized R:R drops to 0.5:1, requiring >67% wins just to break even before costs',
              'Expectancy improves automatically',
              'You eliminate slippage',
              'Drawdowns vanish',
            ],
            correct_index: 0,
            explanation: 'Cutting winners early destroys the payoff asymmetry your system depends on.',
          },
          {
            id: 'q-11-05-2',
            question: 'Should you place a 1:4 take-profit directly behind a strong Weekly resistance wall just to make the ratio look good?',
            options: [
              'No—place targets realistically ahead of major barriers, or skip the setup if room is insufficient',
              'Yes, always force 1:4 minimum',
              'Yes, Weekly walls rarely matter',
              'Only on Friday',
            ],
            correct_index: 0,
            explanation: 'Unreachable targets beyond major opposing resistance routinely reverse and turn gains into losses.',
          },
          {
            id: 'q-11-05-3',
            question: 'Wait-or-Skip Discipline: If next structural resistance gives only 0.9:1 R:R, what is the disciplined decision?',
            options: ['Pass on the trade and wait for higher-room alignment', 'Widen TP through the wall anyway', 'Double lot size', 'Delete the stop'],
            correct_index: 0,
            explanation: 'Filtering low-R:R setups is one of the highest-impact habits in trading.',
          },
        ],
      },
      {
        id: 'lesson-11-06',
        title: 'Daily/Weekly Loss Limits and Drawdown',
        category: 'Risk Management',
        summary: 'Master asymmetric drawdown recovery math and install strict daily, weekly, and monthly equity circuit breakers.',
        learning_objective: 'Explain drawdown recovery asymmetry and enforce pre-set daily/weekly loss circuit breakers.',
        introduction:
          'Losing 20% and losing 60% do not feel merely 3× different—mathematically, recovering from deep drawdowns grows exponentially harder.',
        content:
          '### Asymmetric Recovery Table\n- `-10%` loss → needs `+11.1%` to break even\n- `-20%` loss → needs `+25.0%` to break even\n- `-30%` loss → needs `+42.9%` to break even\n- `-50%` loss → needs `+100.0%` to break even\n- `-80%` loss → needs `+400.0%` to break even!\n\n### Circuit-Breaker Rules\n- **Daily Max Loss**: e.g., `2%` (or 2–3 full R losses) → **close platform for the day**.\n- **Weekly Max Loss**: e.g., `4%–5%` → step back until next week and audit every trade.\n- **Drawdown Throttle**: If total drawdown reaches `8%–10%`, cut per-trade risk in half (`1% → 0.5%`) until equity stabilizes.',
        demonstration:
          '1. Inspect the Drawdown Recovery Curve showing the sharp hockey-stick acceleration past `-25%`, illustrating why cutting risk early during rough streaks protects recovery speed.',
        common_mistakes: [
          'Doubling risk when down on the day to "get back to green before sleep."',
          'Thinking you can out-trade a tilt streak without a forced cooling-off break.',
        ],
        summary_recap:
          'Drawdown recovery is harshly asymmetric; use strict daily/weekly circuit breakers and cut size during drawdowns.',
        practical_exercise: {
          title: 'Circuit-Breaker Charter',
          objective: 'Define personal equity drawdown tiers before taking live risk.',
          steps: [
            'Open the Academy Drawdown Simulator and observe recovery requirements from -10% to -70%.',
            'Write explicit Daily (-2R), Weekly (-4R), and Throttle (-8% equity) rules.',
          ],
          deliverable: '3-tier personal drawdown protection protocol.',
        },
        visual_key: 'drawdown-recovery-curve',
        duration_minutes: 17,
        tags: ['drawdown', 'circuit-breaker', 'recovery-math'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-11-06-1',
            question: 'If an account drops 80% from $10,000 down to $2,000, what percentage gain is required just to recover back to $10,000?',
            options: ['+400%', '+80%', '+100%', '+160%'],
            correct_index: 0,
            explanation: 'Turning $2,000 back into $10,000 requires gaining $8,000—which is 400% of $2,000.',
          },
          {
            id: 'q-11-06-2',
            question: 'What should you do when you hit your Daily Maximum Loss limit?',
            options: [
              'Stop placing new trades immediately for the day and review calmly later',
              'Double your lot size on one last revenge setup',
              'Deposit extra money to keep trading',
              'Switch to 1-minute crypto scalps',
            ],
            correct_index: 0,
            explanation: 'Circuit breakers only protect you if you honor them immediately without exceptions.',
          },
          {
            id: 'q-11-06-3',
            question: 'During a sustained 8%–10% equity drawdown, what happens if you reduce risk per trade by half (e.g., 1% to 0.5%)?',
            options: [
              'Drawdown acceleration slows dramatically while protecting psychology during review',
              'Losses accelerate',
              'Spreads double',
              'Account locks forever',
            ],
            correct_index: 0,
            explanation: 'Risk throttling buys time and preserves remaining capital during unfavorable market regimes.',
          },
        ],
      },
      {
        id: 'lesson-11-07',
        title: 'Multiple Positions and Correlated Exposure',
        category: 'Risk Management',
        summary: 'Prevent accidental 3×–5× overexposure caused by holding several correlated currency pairs simultaneously.',
        learning_objective: 'Audit open positions by net currency exposure rather than treating every ticker symbol as independent.',
        introduction:
          'Risking 1% each on four different pairs feels safe—until you realize all four positions effectively bet on US Dollar weakness simultaneously.',
        content:
          '### Portfolio Correlation Trap\nImagine opening at the exact same moment:\n- Long `EUR/USD` (`1%` risk) → Long EUR / **Short USD**\n- Long `GBP/USD` (`1%` risk) → Long GBP / **Short USD**\n- Long `AUD/USD` (`1%` risk) → Long AUD / **Short USD**\n- Short `USD/CHF` (`1%` risk) → Long CHF / **Short USD**\n\nIf US CPI surprises hot and USD rallies sharply across the board, **all four trades likely stop out together (`-4%`)**!\n\n### Practical Rule\nCap total **correlated portfolio risk** (e.g., max `1.5%–2%` combined exposure to any single currency like USD or Gold at one time) or pick only the **single cleanest** USD setup.',
        demonstration:
          '1. Review the Correlated Exposure diagram illustrating four separate currency charts funneling into one concentrated `USD Short` basket—turning four "1% trades" into one 4% macro bet.',
        common_mistakes: [
          'Adding Long EUR/USD + Long GBP/USD + Long XAU/USD all at 1% each thinking risk is diversified.',
          'Forgetting correlations shift dynamically during central-bank shocks.',
        ],
        summary_recap:
          'Always sum open risk by shared currency exposure; limit total correlated risk or select only the single highest-quality setup.',
        practical_exercise: {
          title: 'Portfolio Net-Exposure Check',
          objective: 'Audit hypothetical multi-pair tickets for hidden concentration.',
          steps: [
            'List 3 trades: Long AUD/USD (1%), Long NZD/USD (1%), Short USD/JPY (1%).',
            'Break each into base/quote currency legs and calculate total USD directional exposure.',
          ],
          deliverable: 'Net currency exposure tally.',
        },
        visual_key: 'correlated-exposure-diagram',
        duration_minutes: 16,
        tags: ['correlation', 'portfolio-risk', 'exposure'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-11-07-1',
            question: 'If you open Long EUR/USD (1%), Long AUD/USD (1%), and Short USD/CAD (1%) simultaneously, your portfolio is heavily concentrated in:',
            options: [
              'Short US Dollar exposure (~3% combined correlated risk if USD surges)',
              'Three completely independent outcomes',
              'Zero market risk',
              'Japanese Yen carry',
            ],
            correct_index: 0,
            explanation: 'All three positions benefit from USD weakness and suffer together if USD strengthens sharply.',
          },
          {
            id: 'q-11-07-2',
            question: 'What is the cleanest way to handle seeing identical bullish setups on both EUR/USD and GBP/USD simultaneously?',
            options: [
              'Either pick the single cleanest chart at 1% risk OR split 0.5% risk across each so total USD risk remains 1%',
              'Risk 2% on both plus 2% on Gold',
              'Open opposite directions simultaneously',
              'Ignore correlation completely',
            ],
            correct_index: 0,
            explanation: 'Splitting risk or picking only the cleanest chart keeps aggregate portfolio risk intact.',
          },
          {
            id: 'q-11-07-3',
            question: 'True or False: Historical correlations remain permanently fixed forever.',
            options: ['False', 'True'],
            correct_index: 0,
            explanation: 'False. Correlations shift across economic cycles and crisis periods.',
          },
        ],
      },
      {
        id: 'lesson-11-08',
        title: 'Leverage, Margin, Margin Call, and Stop-Out',
        category: 'Risk Management',
        summary: 'Understand effective leverage vs. maximum broker leverage, Margin Level %, Margin Call warnings, and involuntary broker Stop-Out liquidation.',
        learning_objective: 'Distinguish maximum account leverage from effective leverage and calculate Margin Level safety thresholds.',
        introduction:
          'Brokers advertise "1:500 leverage" as if higher numbers help you. In reality, using excessive effective leverage guarantees one normal price swing triggers automatic liquidation.',
        content:
          '### Key Equations\n- **Used Margin**: Collateral locked by open positions (`Notional Value ÷ Max Leverage`).\n- **Free Margin**: `Equity − Used Margin` (available cushion for new trades and floating losses).\n- **Margin Level %**: `(Equity ÷ Used Margin) × 100%`.\n\n### Margin Call & Stop-Out\n- **Margin Call** (commonly `100%` or `80%` Margin Level depending on regulator): Warning that Equity has fallen down near Used Margin; new positions blocked.\n- **Stop-Out** (e.g., `50%` under many major regulations): Broker **forcibly closes losing positions** at market price to stop negative balances.\n\n**Golden Distinction**: Having `1:100` max broker leverage does NOT mean you must use it! Sizing strictly to `1%` risk keeps **effective leverage** low (`~1:2` to `1:10`).',
        demonstration:
          '1. Compare Account A (`$1,000` opening `0.50 lots` = `$50,000` notional, `50:1` effective leverage—just a `15-pip` adverse move triggers margin pain!) vs. Account B (`$1,000` risking `1%` = `$10` with a `25-pip` stop = `0.04 lots`, only `4:1` effective leverage!).',
        common_mistakes: [
          'Thinking high broker leverage increases your edge—it only reduces required collateral so you can over-size dangerously.',
          'Adding extra deposits repeatedly into an active margin-call trade instead of respecting stop-losses.',
        ],
        summary_recap:
          'Never confuse maximum broker leverage with safe effective leverage; proper risk-based sizing naturally keeps margin utilization low and far from Stop-Out.',
        practical_exercise: {
          title: 'Effective Leverage Audit',
          objective: 'Verify your effective leverage when sticking strictly to 1% risk.',
          steps: [
            'Take a $5,000 account risking $50 (1%) with a 50-pip EUR/USD stop (`0.10 lots` = `$10,000` notional).',
            'Divide `$10,000 ÷ $5,000 = 2:1` effective leverage—confirm how safe that cushion stays even if account max leverage is 1:30 or 1:100.',
          ],
          deliverable: 'Effective leverage calculation sheet.',
        },
        visual_key: 'margin-leverage-diagram',
        duration_minutes: 17,
        tags: ['leverage', 'margin-call', 'stop-out'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-11-08-1',
            question: 'If you have a $2,000 account and hold a $10,000 EUR/USD position (0.10 lots), what is your true Effective Leverage?',
            options: ['5:1 ($10,000 ÷ $2,000)', '100:1', '50:1', '1:5'],
            correct_index: 0,
            explanation: 'Effective leverage equals total open notional position value divided by actual account equity.',
          },
          {
            id: 'q-11-08-2',
            question: 'What happens when your Margin Level % drops down to your broker’s mandatory Stop-Out threshold?',
            options: [
              'The broker automatically begins closing your open positions at current market prices to limit further deficit',
              'The broker gives you a free bonus',
              'Spreads turn negative',
              'Your stop-loss widens automatically',
            ],
            correct_index: 0,
            explanation: 'Stop-out protects the broker and client from deeper insolvency by involuntarily liquidating open trades.',
          },
          {
            id: 'q-11-08-3',
            question: 'Does negative balance protection apply identically across every offshore and onshore broker globally?',
            options: [
              'No—protections depend strictly on jurisdiction and client classification; verify your regulator’s rules',
              'Yes universally worldwide',
              'Only on Fridays',
              'Never anywhere',
            ],
            correct_index: 0,
            explanation: 'Regulatory protections vary sharply by jurisdiction (e.g., EU/UK/AU retail rules vs. unregulated offshore entities).',
          },
        ],
      },
      {
        id: 'lesson-11-09',
        title: 'Spread, Commission, Swap, Slippage, and Gaps',
        category: 'Risk Management',
        summary: 'Account honestly for all five silent execution costs that separate theoretical chart drawings from live account statements.',
        learning_objective: 'Factor spread, commissions, overnight swaps, execution slippage, and gaps accurately into trade planning.',
        introduction:
          'New traders often calculate profits purely from mid-chart price points, then wonder why live fills hurt more and targets miss by a pip. Meet the five real-world execution frictions.',
        content:
          '### The Five Friction Costs\n1. **Bid–Ask Spread**: Immediate entry cost; **Remember**: charts typically plot **Bid** prices! Buy orders trigger/close at **Ask**, and Short stops trigger at **Ask** (meaning a Short SL must add spread buffer above the wick!).\n2. **Commission**: Explicit per-lot fee on raw-spread/ECN accounts (e.g., `$6–$7` round-turn per standard lot).\n3. **Swap / Rollover**: Daily interest adjustment held past `17:00 ET` (triple on Wednesday).\n4. **Slippage**: Difference between requested order/stop price and actual market fill during fast volatility.\n5. **Price Gaps**: Weekends or shocks jumping directly past order levels without trading intermediate prices.',
        demonstration:
          '1. Review the Execution Costs diagram showing why a Short stop-loss placed strictly at `1.0900` Bid gets triggered if Bid reaches `1.0898` with a `2.5-pip` spread (`Ask = 1.09005`)!',
        common_mistakes: [
          'Forgetting Short positions open on Bid and close (SL/TP) on **Ask**—getting tagged by spread widening at rollover!',
          'Holding ultra-tight stops across `17:00 ET` rollover when spreads briefly balloon.',
        ],
        summary_recap:
          'Add spread buffer to short stop-losses and long limit entries, account for commissions/swaps, and respect rollover & gap slippage risks.',
        practical_exercise: {
          title: 'Ask-Side Stop Buffer Check',
          objective: 'Remember to include spread cleanly on short stops.',
          steps: [
            'Check current typical spread plus rollover spread widening on a chosen pair.',
            'Practice adding spread + structural buffer above swing highs when planning hypothetical short stop-losses.',
          ],
          deliverable: 'Short vs. Long spread-adjustment checklist.',
        },
        visual_key: 'execution-costs-slippage',
        duration_minutes: 17,
        tags: ['spread', 'commission', 'swap', 'slippage', 'gaps'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-11-09-1',
            question: 'On standard Forex charts plotting BID prices, which price triggers a SHORT position’s Stop-Loss?',
            options: [
              'The ASK price (Bid + Spread)—meaning your short stop can fill before the Bid candle ever visibly touches the line',
              'The Mid price',
              'Yesterday’s close',
              'The Bid price strictly',
            ],
            correct_index: 0,
            explanation: 'Closing a short trade requires buying back at the Ask price, so always add spread buffer above short stops.',
          },
          {
            id: 'q-11-09-2',
            question: 'When do variable Forex spreads frequently widen sharply even on calm days?',
            options: [
              'Around the daily 17:00 ET rollover transition and right before/during major economic news',
              'During peak London-NY overlap on normal hours',
              'Only on Tuesdays at 14:00 UTC',
              'Never—spreads are always frozen',
            ],
            correct_index: 0,
            explanation: 'Liquidity providers briefly pull quotes during daily settlement rollover and Tier-1 announcements.',
          },
          {
            id: 'q-11-09-3',
            question: 'What is positive vs. negative slippage?',
            options: [
              'Execution at a better or worse price than requested when market liquidity shifts mid-fill',
              'A broker software update',
              'A dividend payment',
              'A chart pattern',
            ],
            correct_index: 0,
            explanation: 'Market and stop orders fill at available book liquidity, which can diverge from requested price in fast moves.',
          },
        ],
      },
      {
        id: 'lesson-11-10',
        title: 'News and Weekend Risk',
        category: 'Risk Management',
        summary: 'Protect swing and intraday accounts from binary policy shocks, liquidity freezes, and Sunday opening gaps.',
        learning_objective: 'Apply practical protocols for managing exposure ahead of Tier-1 macro events and weekend closes.',
        introduction:
          'Markets pause retail access over Saturday and Sunday, yet geopolitical events, elections, and central-bank emergencies keep happening—producing Monday/Sunday opening gaps.',
        content:
          '### Managing Event & Weekend Exposure\n- **Intraday Traders**: Close or trim exposure ahead of scheduled `FOMC`, `ECB`, `CPI`, and `NFP` announcements unless explicitly running an event-buffered wider swing.\n- **Swing Traders Holding Over Weekends**: Recognize stops do **not** fill during weekend closure! If `EUR/USD` closes Friday at `1.0850` with your stop at `1.0810` and Sunday opens at `1.0730`, your stop fills at `1.0730` (`3×` planned loss!).\n- **Mitigation**: Keep weekend position sizing conservative (`≤0.5%`), avoid fragile tight stops over weekends, and reduce exposure ahead of major elections or central-bank weekends.',
        demonstration:
          '1. Compute the math of a surprise `120-pip` Sunday gap past a `40-pip` stop on a `1%` position → realizes `-3%` (`3R`) loss instantly on open—proof why tight weekend stops are an illusion.',
        common_mistakes: [
          'Assuming a stop-loss shields a weekend position from 100-pip opening gaps.',
          'Leaving tight 15-pip intraday stops open across FOMC rate announcements.',
        ],
        summary_recap:
          'Stops cannot execute while markets are closed; reduce risk or stay flat before binary macro shocks and high-uncertainty weekends.',
        practical_exercise: {
          title: 'Weekend & News Exposure Policy',
          objective: 'Draft clear Friday close and Red-News management rules.',
          steps: [
            'Check Sunday/Friday historical gaps on one currency chart.',
            'Write your personal rule on maximum allowed weekend risk and when to flatten ahead of major macro releases.',
          ],
          deliverable: 'Written News & Weekend Risk Policy.',
        },
        visual_key: 'execution-costs-slippage',
        duration_minutes: 15,
        tags: ['weekend-risk', 'news-risk', 'gap-risk'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'q-11-10-1',
            question: 'If you have a 30-pip stop-loss risking $100 and the market gaps 90 pips past your stop on Sunday open, what is your approximate realized loss?',
            options: ['~$300 (3× planned risk) plus any opening spread widening', '$100 exact guarantee', '$0', '$30'],
            correct_index: 0,
            explanation: 'Stop orders fill at the first available market price upon reopen when price jumps cleanly past the stop.',
          },
          {
            id: 'q-11-10-2',
            question: 'What is a practical mitigation if a swing trade remains open over a quiet weekend?',
            options: [
              'Keep risk sizing modest (e.g., 0.25%–0.5%), avoid major election/event weekends, and avoid tight stops',
              'Increase leverage 5x on Friday afternoon',
              'Delete the stop-loss completely',
              'Hold 6 correlated pairs simultaneously',
            ],
            correct_index: 0,
            explanation: 'Modest sizing and wider structural cushions help absorb moderate opening gaps safely.',
          },
          {
            id: 'q-11-10-3',
            question: 'True or False: Tight 10-pip intraday stops survive NFP or CPI spikes cleanly most of the time.',
            options: ['False', 'True'],
            correct_index: 0,
            explanation: 'False. Spread expansion plus instantaneous 30–80 pip volatility sweeps tight stops routinely.',
          },
        ],
      },
      {
        id: 'lesson-11-11',
        title: 'Consecutive Losses and Risk of Ruin Concepts',
        category: 'Risk Management',
        summary: 'Understand probability streaks mathematically so an ordinary 7-loss streak never catches you off guard or ruins your account.',
        learning_objective: 'Calculate realistic consecutive losing-streak odds over 100+ trades and understand Risk of Ruin drivers.',
        introduction:
          'Even flipping a fair 50/50 coin across 100 trials almost always produces a streak of 5 to 7 tails in a row. In trading, streaks are mathematically normal—not proof the market is cursed.',
        content:
          '### Normal Probability Streaks (50% Win Rate over 100 Trades)\n- Probability of experiencing at least **5 losses in a row**: very high (`>80%` across 100 independent trades!).\n- Probability of **7+ losses in a row** across a full year (`200+` trades): genuinely common.\n\n### Risk of Ruin Drivers\n**Risk of Ruin** rises steeply with three factors: (1) **larger % risk per trade**, (2) **lower win rate / poor R:R expectancy**, and (3) **refusing to throttle risk** during drawdowns.\nKeeping risk at `0.5%–1.0%` drives catastrophic ruin odds near zero for a positive-expectancy disciplined trader.',
        demonstration:
          '1. Test `Win Rate = 45%`, `R:R = 2:1`, `Risk = 0.5%` vs. `Risk = 5%` inside the Academy Drawdown & Losing-Streak Simulator across 8 consecutive losses: `-3.9%` vs. `-33.7%`!',
        common_mistakes: [
          'Abandoning a valid strategy permanently after 4 normal losses.',
          'Using Martingale (doubling lot size after every loss)—which mathematically guarantees eventual blowup when a 7–9 loss streak hits!',
        ],
        summary_recap:
          'Long losing streaks happen naturally in every strategy; low fixed risk % keeps Risk of Ruin negligible while Martingale doubling guarantees ruin.',
        practical_exercise: {
          title: 'Streak Stress Simulation',
          objective: 'Measure psychological and equity resilience across realistic streaks.',
          steps: [
            'Run 6, 8, and 10 consecutive losses in the Academy Drawdown & Losing-Streak Simulator at 0.5%, 1%, and 3% risk.',
            'Record at which % risk level you would personally begin feeling panicked or tempted to break rules.',
          ],
          deliverable: 'Losing-streak comfort threshold note.',
        },
        visual_key: 'drawdown-recovery-curve',
        duration_minutes: 17,
        tags: ['losing-streaks', 'risk-of-ruin', 'martingale'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-11-11-1',
            question: 'Why is the "Martingale" tactic (doubling trade size after every loss to recover all prior losses on one win) fatally dangerous?',
            options: [
              'Inevitably recurring 7–10 loss streaks multiply required lot size exponentially until margin call or total wipeout',
              'Brokers pay extra interest on doubled trades',
              'It lowers win rate to 0%',
              'It only fails on Wednesdays',
            ],
            correct_index: 0,
            explanation: '2^9 = 512× initial size! Finite accounts always eventually encounter a streak long enough to wipe out Martingale progression.',
          },
          {
            id: 'q-11-11-2',
            question: 'With a 50% win rate over 100–200 trades, encountering 6 consecutive losses is:',
            options: [
              'Statistically normal and expected—not necessarily a broken strategy',
              'Mathematically impossible',
              'Proof of exchange fraud',
              'Guaranteed never to happen',
            ],
            correct_index: 0,
            explanation: 'Random clustering produces multi-trade losing streaks even in genuinely profitable systems.',
          },
          {
            id: 'q-11-11-3',
            question: 'Which single change slashes Risk of Ruin most powerfully?',
            options: [
              'Lowering % risk per trade (e.g., 5% down to 0.5%–1%) and enforcing daily/weekly loss caps',
              'Raising leverage to 1:1000',
              'Removing take-profits',
              'Switching indicators weekly',
            ],
            correct_index: 0,
            explanation: 'Small fractional risk creates deep mathematical armor against variance.',
          },
        ],
      },
      {
        id: 'lesson-11-12',
        title: 'Trading Plan and Emergency Stop Rules',
        category: 'Risk Management',
        summary: 'Draft an ironclad Risk Charter and Emergency Stop Protocol for technical failures, life stress, or emotional loss of control.',
        learning_objective: 'Establish unambiguous emergency circuit-breaker rules covering platform, connectivity, drawdown, and personal crises.',
        introduction:
          'Risk plans are easy to write on sunny Sundays—and hardest to remember when internet drops, surprise news explodes, or three losses happen before lunch. Pre-commit emergency protocols now.',
        content:
          '### Emergency Stop Protocol (Red-Button Rules)\n1. **Max Trade Risk**: Never exceed `1.0%` (strictly `0.25%–0.5%` while developing).\n2. **Correlated Portfolio Cap**: Max `1.5%–2.0%` combined risk on any single currency.\n3. **Daily / Weekly Loss Halt**: Hit `-2R` today or `-4R` this week → **immediate trading freeze**.\n4. **Technical Contingency**: Have broker mobile app or phone-desk emergency number ready in case desktop internet/power fails while managing open trades—remembering **every order always carries a hard server-side SL already!**\n5. **Personal Life Rule**: Never trade exhausted, angry, intoxicated, or during major personal emergencies.',
        demonstration:
          '1. Walk through a real-world emergency checklist: Desktop Wi-Fi drops during an active setup → Zero panic because hard server-side SL & TP are already resting on the broker server; confirm cleanly via mobile cellular data.',
        common_mistakes: [
          'Trading with un-hedged, stop-less orders assuming home internet will never disconnect.',
          'Trading angry right after personal conflict or sleep deprivation.',
        ],
        summary_recap:
          'Hard server-side stops, drawdown halts, mobile backups, and personal-state gates keep emergencies from turning into disasters.',
        practical_exercise: {
          title: 'Emergency Stop Charter',
          objective: 'Finalize your complete Risk & Emergency Plan.',
          steps: [
            'Write out your 5 Emergency Stop Rules (Max Risk, Correlated Cap, Daily Halt, Technical Backup, Personal Gate).',
            'Save it beside your trading workspace.',
          ],
          deliverable: '1-page Risk & Emergency Protocol document.',
        },
        visual_key: 'strategy-rulebook-blueprint',
        duration_minutes: 15,
        tags: ['risk-charter', 'emergency-rules', 'discipline'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-11-12-1',
            question: 'Why does placing your Stop-Loss and Take-Profit directly on the broker server protect you during a power or internet outage?',
            options: [
              'Server-side orders execute automatically on the broker’s infrastructure even if your laptop shuts off completely',
              'Internet routers refund losses',
              'Mobile data blocks market orders',
              'Markets pause when your Wi-Fi drops',
            ],
            correct_index: 0,
            explanation: 'Once accepted by the server, SL/TP orders do not rely on your local device staying online.',
          },
          {
            id: 'q-11-12-2',
            question: 'Should you trade normally after getting only 2 hours of sleep or during extreme emotional distress?',
            options: [
              'No—fatigue and stress impair impulse control and checklist discipline; enforce a personal stand-aside rule',
              'Yes, just double coffee intake',
              'Yes, trade smaller timeframes',
              'Only trade Gold',
            ],
            correct_index: 0,
            explanation: 'Mental state directly governs execution discipline.',
          },
          {
            id: 'q-11-12-3',
            question: 'Who is ultimately responsible for honoring your daily loss halt and emergency stop rules?',
            options: ['You—through pre-commitment and disciplined review', 'Social media mentors', 'Your internet provider', 'Chart indicators'],
            correct_index: 0,
            explanation: 'Self-governance is the backbone of sustainable risk management.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-12-trading-psychology',
    slug: 'trading-psychology',
    course_number: 12,
    title: '12. Trading Psychology',
    category: 'Trading Psychology',
    level: 'Intermediate',
    level_label: 'Essential',
    description:
      'Master emotional discipline and probabilistic thinking: conquer fear, greed, FOMO, revenge trading, loss aversion, overconfidence, cognitive biases, pre-trade routines, streak handling, emotional journaling, process-based grading, and knowing when to pause.',
    prerequisites: 'Course 11 recommended.',
    learning_outcomes: [
      'Recognize how fear, greed, FOMO, and loss aversion hijack analytical decision-making.',
      'Eliminate revenge trading and overtrading through hard session caps and pre-trade routines.',
      'Spot confirmation bias and hindsight bias inside chart reviews and market commentary.',
      'Maintain a trading journal tracking both technical execution and emotional state, grading process separately from short-term trade outcomes.',
    ],
    estimated_hours: 4,
    cover_image_url: '/src/assets/images/hero_light_trading_1795086732029.jpg',
    assessment: [
      {
        id: 'c12-a1',
        question: 'Why does judging trade quality solely by whether it made or lost money poison long-term discipline?',
        options: [
          'A reckless FOMO trade can randomly win ("bad process, good outcome"), reinforcing terrible habits that later wipe accounts—while a textbook setup can stop out cleanly',
          'Winning trades pay extra taxes',
          'Losing trades never happen in good systems',
          'Journals only record winning numbers',
        ],
        correct_index: 0,
        explanation: 'Separating process quality from short-term random variance rewards repeatable discipline rather than lucky rule-breaking.',
      },
      {
        id: 'c12-a2',
        question: 'What classic psychological trap occurs when a trader closes winning trades far too early out of fear while letting losers run past their planned stop?',
        options: ['Loss aversion / Disposition effect', 'Hindsight bias', 'Trend following', 'Walk-forward validation'],
        correct_index: 0,
        explanation: 'Loss aversion makes realizing a small loss feel disproportionately painful, inverting healthy risk-reward.',
      },
      {
        id: 'c12-a3',
        question: 'What is the most effective immediate antidote when you feel the urge to "make back" a sharp loss right away?',
        options: [
          'Step away physically from screens under a pre-set cooling-off rule until emotional arousal subsides',
          'Double position size on a 1-minute chart',
          'Open three random pairs simultaneously',
          'Remove stop-losses',
        ],
        correct_index: 0,
        explanation: 'Revenge impulses stem from fight-or-flight arousal; forced screen separation breaks the feedback loop.',
      },
      {
        id: 'c12-a4',
        question: 'How does "confirmation bias" distort technical analysis?',
        options: [
          'Searching selectively only for lines or opinions supporting your existing bias while ignoring opposing S&R or invalidation signals',
          'Waiting for candle close confirmation',
          'Checking the Economic Calendar',
          'Recording exact entry prices',
        ],
        correct_index: 0,
        explanation: 'Pre-deciding direction makes traders blind to contradictory evidence right in front of them.',
      },
      {
        id: 'c12-a5',
        question: 'When should a trader temporarily pause live trading entirely and seek constructive support or return to study?',
        options: [
          'When repeatedly violating risk limits, trading out of financial desperation/bill-paying pressure, or experiencing chronic distress/compulsion',
          'After a single normal -1R planned stop-loss',
          'Every time spreads widen by 0.2 pips',
          'Only once a decade',
        ],
        correct_index: 0,
        explanation: 'Financial desperation and compulsive rule-breaking require an immediate pause and healthy outside support.',
      },
    ],
    lessons: [
      {
        id: 'lesson-12-01',
        title: 'Fear, Greed, and Uncertainty',
        category: 'Trading Psychology',
        summary: 'Understand why human evolution wired brains poorly for probabilistic uncertainty—and how probabilistic framing calms emotional swings.',
        learning_objective: 'Reframe individual trades as uncertain probabilistic trials rather than personal validation or guaranteed paydays.',
        introduction:
          'Human brains crave certainty and safety. Markets offer neither on any single trade. Conflict between those two facts drives nearly every psychological mistake in trading.',
        content:
          '### The Twin Emotional Poles\n- **Fear** triggers hesitation on clean setups, premature profit-taking (`+0.3R`), and refusal to accept valid stops.\n- **Greed** fuels over-leveraging, moving profit targets unrealistically upward, and chasing extended rallies.\n\n### Probabilistic Thinking\nNo single setup knows whether it will win or lose. Only across a **large sample of 30–100+ consistent executions** does an edge express itself. When you accept uncertainty *before* clicking buy or sell—and pre-fund a `0.5%–1%` risk limit you genuinely accept losing—emotional noise drops dramatically.',
        demonstration:
          '1. Review the Emotional Cycle diagram contrasting naive euphoria → panic capitulation against calm, small-risk probabilistic execution.',
        common_mistakes: [
          'Trying to suppress emotions by pretending "robots feel nothing" instead of resizing risk until emotions stay manageable.',
          'Attaching self-worth to today’s P&L.',
        ],
        summary_recap:
          'Embrace uncertainty upfront, size risk conservatively enough that stops feel routine, and think in 50-trade blocks rather than single outcomes.',
        practical_exercise: {
          title: 'Pre-Acceptance Check',
          objective: 'Test whether your risk size triggers calm acceptance or stress.',
          steps: [
            'Imagine entering your next setup and watching it hit stop-loss immediately 2 hours later.',
            'If that mental scenario spikes your pulse or anger, cut position risk in half until the scenario feels boring.',
          ],
          deliverable: 'Calibrated comfort-risk percentage note.',
        },
        visual_key: 'psychology-emotional-cycle',
        duration_minutes: 16,
        tags: ['psychology', 'fear', 'greed', 'probability'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.CFTC_FX],
        quiz: [
          {
            id: 'q-12-01-1',
            question: 'If watching a hypothetical stop-loss hit causes intense anxiety or anger, what practical lever fixes the root cause fastest?',
            options: [
              'Reducing your % risk per trade until the dollar loss feels emotionally insignificant',
              'Deleting your stop-loss',
              'Doubling leverage to make it back faster',
              'Adding more indicators',
            ],
            correct_index: 0,
            explanation: 'Over-sized risk is the #1 driver of emotional trading panic.',
          },
          {
            id: 'q-12-01-2',
            question: 'True or False: Even an institutional trader with a genuine edge knows accurately which single trade will win next.',
            options: ['False', 'True'],
            correct_index: 0,
            explanation: 'False. Any individual trade outcome remains uncertain; edges operate strictly over large samples.',
          },
          {
            id: 'q-12-01-3',
            question: 'Greed commonly manifests as:',
            options: [
              'Over-leveraging, skipping checklists, and chasing extended trends far past planned levels',
              'Reducing risk during drawdowns',
              'Standing aside ahead of news',
              'Honoring stop-losses cleanly',
            ],
            correct_index: 0,
            explanation: 'Greed prioritizes instant large upside while dismissing structural invalidation.',
          },
        ],
      },
      {
        id: 'lesson-12-02',
        title: 'FOMO and Impulsive Entries',
        category: 'Trading Psychology',
        summary: 'Break the Fear of Missing Out (FOMO) cycle when big candles take off without you.',
        learning_objective: 'Spot FOMO triggers immediately and substitute planned alert/retest rules for impulsive market-clicks.',
        introduction:
          'Watching a pair rally 90 pips straight past the zone you forgot to alert hurts—and tempts traders to click Market Buy right at the very peak before a sharp pullback.',
        content:
          '### Why FOMO Strikes\n- Watching live 1-minute or 5-minute flashing candles creates urgency ("it’s getting away forever!").\n- Social media screenshots exaggerate fast profits while hiding losses.\n\n### Four Practical FOMO Vaccines\n1. **Price Alerts, Not Chart Staring**: Set alerts at pre-planned S&R zones and close charts until alerts chime.\n2. **"Wait for Close + Pullback" Rule**: If a move already left your zone by >0.5 ATR, it is *gone*—wait for a clean retest or catch the next bus.\n3. **Abundance Mindset**: Forex trades 24/5 across dozens of clean instruments for decades—missing today’s train costs $0.',
        demonstration:
          '1. Compare entering late out of FOMO at candle peak (wide stop, terrible 0.6:1 R:R, stopped by routine pullback) vs. letting missed setups go with $0 lost and calm readiness for the next valid structure.',
        common_mistakes: [
          'Staring passively at M1 charts during lunch until boredom + FOMO triggers a random trade.',
          'Checking social media "live profit screenshots" mid-session.',
        ],
        summary_recap:
          'Missing a trade costs zero dollars; chasing out of FOMO ruins R:R and drains capital. Use alerts and let missed trains pass.',
        practical_exercise: {
          title: 'Missed-Move Grace Log',
          objective: 'Rewire missed trades from regret into relief.',
          steps: [
            'The next time you miss a clean move, record it calmly in a "Missed Without Chasing" column.',
            'Notice how keeping $0 drawdown protects readiness for tomorrow’s setup.',
          ],
          deliverable: 'Written FOMO Pause Rule.',
        },
        visual_key: 'psychology-emotional-cycle',
        duration_minutes: 15,
        tags: ['fomo', 'impulse-control', 'alerts'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-02-1',
            question: 'What does missing a trade you planned correctly—because price moved faster than expected—actually cost your account balance?',
            options: ['$0', '-1R', '-5%', 'Margin call'],
            correct_index: 0,
            explanation: 'Zero loss! Chasing late converts a harmless $0 miss into an unfavorable-R:R loss.',
          },
          {
            id: 'q-12-02-2',
            question: 'Which workflow change cuts FOMO most effectively?',
            options: [
              'Using higher-timeframe alerts at key S&R zones instead of staring continuously at ticking lower-timeframe candles',
              'Opening 12 charts on 1-minute timeframe',
              'Following random live streams while trading',
              'Removing stop-losses',
            ],
            correct_index: 0,
            explanation: 'Alerts keep your attention anchored to planned locations rather than flashing candles.',
          },
          {
            id: 'q-12-02-3',
            question: 'True or False: There will always be future setups next week and next month if you preserve capital today.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Markets continuously produce fresh setups across sessions and years.',
          },
        ],
      },
      {
        id: 'lesson-12-03',
        title: 'Revenge Trading and Overtrading',
        category: 'Trading Psychology',
        summary: 'Interrupt destructive tilt loops where anger after a loss sparks rapid, oversized, low-quality trades.',
        learning_objective: 'Identify early physical and mental tilt cues and apply mandatory post-loss cooling-off timers.',
        introduction:
          'Most catastrophic account blowups do not happen from one calm bad analysis—they happen inside a single 2-hour emotional tilt storm after an annoying loss.',
        content:
          '### Warning Signs of Revenge / Overtrading\n- Clicking into a second trade 3 minutes after stopping out just to "win back that $50."\n- Quietly doubling lot size ("just this once") to break even quicker.\n- Dropping down from H4 to M1 trying to force action inside messy afternoon chop.\n\n### Mechanical Circuit Breakers\n1. **Mandatory 30-Minute Break After Any Stop-Loss** (minimum).\n2. **Hard Trade Cap**: Max `2` trades per day or `6` per week—preventing boredom overtrading.\n3. **Daily `-2R` Lockout**: If down 2R, log out immediately; tomorrow always brings a fresh chart.',
        demonstration:
          '1. Trace the Revenge Spiral diagram: `-1%` normal loss → anger → rushed `-2%` entry → panic → `-4%` doubled bet → `-7%` session catastrophe vs. calm `-1%` loss → 30-min walk → protected week.',
        common_mistakes: [
          'Telling yourself "I feel totally calm" right after taking two quick stops when heart rate and frustration are elevated.',
          'Trading out of boredom on slow holiday afternoons.',
        ],
        summary_recap:
          'Enforce mechanical cooling-off timers, daily trade caps, and strict -2R session shutdowns to stop revenge spirals before they start.',
        practical_exercise: {
          title: 'Tilt Early-Warning Profile',
          objective: 'Know your personal tilt symptoms before they hijack clicks.',
          steps: [
            'List 3 signs you notice when frustrated after a loss (e.g., faster breathing, scanning unfamiliar pairs, zooming to M1).',
            'Attach an automatic 60-minute screen-lock rule whenever any sign appears.',
          ],
          deliverable: '3-symptom Tilt Trigger & Lockout Plan.',
        },
        visual_key: 'psychology-emotional-cycle',
        duration_minutes: 16,
        tags: ['revenge-trading', 'overtrading', 'tilt'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-12-03-1',
            question: 'What typically causes more total account wipeouts than a flawed initial chart setup?',
            options: [
              'Emotional revenge trading and oversized "make-it-back" bets right after a loss',
              'Taking a 0.5% planned stop-loss',
              'Reading an economic calendar',
              'Using Daily charts',
            ],
            correct_index: 0,
            explanation: 'Tilt storms erase weeks of disciplined compounding inside hours.',
          },
          {
            id: 'q-12-03-2',
            question: 'Why enforce a hard maximum daily trade count (e.g., max 2–3 setups per day)?',
            options: [
              'It filters out boredom clicks and forces high selectivity toward A+ structural setups only',
              'Brokers charge $500 on trade #4',
              'Charts stop updating after 3 trades',
              'It guarantees all 3 trades win',
            ],
            correct_index: 0,
            explanation: 'Scarcity of bullets raises selectivity and prevents impulsive churn.',
          },
          {
            id: 'q-12-03-3',
            question: 'If you catch yourself thinking "I just need one quick trade to end the day green," what should you do?',
            options: [
              'Shut down the trading platform immediately—that thought is pure revenge/tilt fuel',
              'Switch to Gold with 3x normal size',
              'Trade the next 1-minute candle',
              'Ask random chatrooms for a signal',
            ],
            correct_index: 0,
            explanation: 'Needing to end an arbitrary day "green" forces terrible low-probability entries.',
          },
        ],
      },
      {
        id: 'lesson-12-04',
        title: 'Loss Aversion and Reluctance to Exit',
        category: 'Trading Psychology',
        summary: 'Overcome Kahneman & Tversky’s Prospect Theory trap where pain of locking in a loss pushes traders to move stops and cut winners.',
        learning_objective: 'Counteract human loss aversion through pre-committed server-side orders and process adherence.',
        introduction:
          'Behavioral economists proved humans feel the pain of losing $100 roughly twice as intensely as the joy of winning $100. Left unchecked, that asymmetry flips trading upside down.',
        content:
          '### How Loss Aversion Damages Traders\n1. **Refusing to Close Invalidated Losers**: Closing locks the loss in as "real," so traders delete or widen stops hoping price comes back—turning `-1R` paper cuts into `-8R` amputations.\n2. **Snatching Tiny Winners Too Early**: Fear of watching `+$60` evaporate makes traders kill `+2R` setups at `+0.4R`.\n\n### Practical Countermeasures\n- **Set-and-Respect Brackets**: Enter Stop-Loss and Target simultaneously when placing the order and refuse to widen SL or move TP closer without objective structural cause.\n- Think strictly in **R-multiples** during live management rather than dollar signs (`-$50` feels less personal as `-1R`!).',
        demonstration:
          '1. Compare Mindset A ("Oh no I’m losing $85 right now, let me push the stop down 20 pips") vs. Mindset B ("Risk was pre-funded at -1R before click; if structure fails, exit cleanly and move on").',
        common_mistakes: [
          'Watching live floating dollar P&L tick up and down every second during a swing trade.',
          'Moving stop-loss further away because "it’s just a wick, it’ll bounce soon."',
        ],
        summary_recap:
          'Loss aversion makes traders hold losers and cut winners; counter it by pre-setting server SL/TP, hiding live dollar P&L noise, and thinking in R.',
        practical_exercise: {
          title: 'Hide Floating Dollar P&L Experiment',
          objective: 'Shift focus from dollar swings back to chart structure.',
          steps: [
            'On demo/practice, evaluate open positions strictly by whether price structure remains intact rather than checking floating dollars every minute.',
            'Write down how much calmer holding toward planned targets feels.',
          ],
          deliverable: 'Short reflection on R-based vs. dollar-watching execution.',
        },
        visual_key: 'cognitive-biases-matrix',
        duration_minutes: 16,
        tags: ['loss-aversion', 'prospect-theory', 'exit-discipline'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-04-1',
            question: 'What behavioral pattern does "loss aversion" commonly create in untrained traders?',
            options: [
              'Cutting winning trades prematurely out of fear while letting losing trades run past invalidation hoping they recover',
              'Letting winners run while cutting losers promptly',
              'Never placing market orders',
              'Calculating lot sizes accurately',
            ],
            correct_index: 0,
            explanation: 'Pain avoidance drives risk-seeking in losses (widening stops) and risk-aversion in gains (snatching crumbs).',
          },
          {
            id: 'q-12-04-2',
            question: 'Why does thinking in "R multiples" instead of raw grocery/bill dollars help manage open trades?',
            options: [
              'It detaches routine risk units from personal spending emotion so structure governs exits',
              'It changes tax rules',
              'It lowers broker commissions',
              'It stops market gaps',
            ],
            correct_index: 0,
            explanation: 'Seeing -0.5R instead of "half a week of groceries" keeps rational chart assessment intact.',
          },
          {
            id: 'q-12-04-3',
            question: 'Once your trade hits original structural invalidation, what is the only disciplined move?',
            options: [
              'Accept the planned -1R exit immediately',
              'Widen the stop twice',
              'Add another buy to lower average entry',
              'Turn off the screen',
            ],
            correct_index: 0,
            explanation: 'Small losses are cheap insurance against catastrophic losses.',
          },
        ],
      },
      {
        id: 'lesson-12-05',
        title: 'Overconfidence After Wins',
        category: 'Trading Psychology',
        summary: 'Spot how hot streaks breed complacency, rule-skipping, and oversized bets—right before market regimes shift.',
        learning_objective: 'Stay strictly within risk rules during winning streaks instead of mistaking favorable market variance for invincibility.',
        introduction:
          'Surprisingly, some of traders’ largest losses arrive **right after** their best winning month. Euphoria lowers caution right when variance normalizes.',
        content:
          '### The Post-Win Overconfidence Trap\n- **4 wins in a row** can happen purely from favorable trend conditions aligning cleanly with your style.\n- **The Trap**: Mistaking temporary market alignment for personal perfection → tripling lot size, skipping the pre-trade checklist, and holding sloppy entries.\n\n### Discipline During Hot Streaks\nKeep `%` risk **unchanged** regardless of yesterday’s wins (scaling lot size smoothly only because fixed `%` naturally grows modestly with higher account equity!). Treat trade #5 after four wins with the exact same caution as trade #1.',
        demonstration:
          '1. Illustrate how a trader winning 4 × `+2R` at `1%` (`+8%`) suddenly risks `6%` on trade 5 out of euphoria and wipes most of the month in one sloppy loss.',
        common_mistakes: [
          'Jumping lot sizes dramatically after a single great week.',
          'Thinking you "finally cracked the market" and no longer need your checklist.',
        ],
        summary_recap:
          'Winning streaks test discipline just as fiercely as losing streaks; keep % risk constant and honor every checklist gate.',
        practical_exercise: {
          title: 'Post-Win Guardrail Check',
          objective: 'Pre-commit rules preventing euphoric position sizing jumps.',
          steps: [
            'Write a rule stating: "My risk % stays capped at X% even after 5 consecutive wins."',
            'Audit whether your journal tracks checklist compliance during wins, not just losses.',
          ],
          deliverable: 'Post-Win Risk Stability rule.',
        },
        visual_key: 'psychology-emotional-cycle',
        duration_minutes: 14,
        tags: ['overconfidence', 'winning-streaks', 'ego'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-05-1',
            question: 'Why do big drawdowns frequently happen immediately AFTER a trader’s best winning streak?',
            options: [
              'Overconfidence leads to skipping checklists and jumping position size far above normal limits right before routine variance turns',
              'Brokers sabotage winning accounts mathematically',
              'Charts stop trending after wins',
              'Indicators invert after 5 wins',
            ],
            correct_index: 0,
            explanation: 'Euphoria dismantles the exact discipline that generated the streak.',
          },
          {
            id: 'q-12-05-2',
            question: 'How should fixed % risk (e.g., 1%) grow your position size cleanly over time?',
            options: [
              'Naturally and gradually as actual settled account equity rises—never via sudden emotional jumps to 5% risk',
              'Double risk % after every single win',
              'Jump straight to maximum margin after 3 wins',
              'Never withdraw or review risk',
            ],
            correct_index: 0,
            explanation: 'Fixed fractional compounding grows position sizes smoothly with verified equity growth.',
          },
          {
            id: 'q-12-05-3',
            question: 'Should checklist discipline remain identical after 4 straight wins as after 4 losses?',
            options: ['Yes—every trade passes the identical binary gates', 'No—winners can skip rules', 'Only on Mondays', 'Only on demo'],
            correct_index: 0,
            explanation: 'Consistent execution defines professionalism.',
          },
        ],
      },
      {
        id: 'lesson-12-06',
        title: 'Confirmation Bias and Hindsight Bias',
        category: 'Trading Psychology',
        summary: 'Defend objective chart reading against selective perception (confirmation bias) and "I knew it all along" illusions (hindsight bias).',
        learning_objective: 'Actively seek invalidation cases (steel-manning the opposite side) and document live predictions vs. hindsight memories.',
        introduction:
          'Once you click Buy, your brain subtly starts filtering every piece of news and every candlestick exclusively to prove you right. That blindfold is confirmation bias.',
        content:
          '### Two Subtle Cognitive Traps\n1. **Confirmation Bias**: Actively seeking bullish opinions, ignoring bearish Daily resistance 15 pips overhead, and squinting until a neutral bar looks bullish.\n   - *Antidote*: Write out **one clear reason the opposite side could work** and exact invalidation *before* entering.\n2. **Hindsight Bias**: Looking back at a historical chart and thinking "that breakout was so obvious!" while forgetting how messy and uncertain the live right-edge candle actually looked before completion.\n   - *Antidote*: Practice bar-by-bar replay without peeking forward and screenshot live entries at entry time.',
        demonstration:
          '1. Review the Cognitive Biases matrix showing how Confirmation Bias blocks warning signs in real time while Hindsight Bias creates false certainty when reviewing old charts.',
        common_mistakes: [
          'Reading trader chatrooms exclusively to validate a position you already hold.',
          'Reviewing past charts passively with the future candles visible and believing "I would have caught every single swing!"',
        ],
        summary_recap:
          'Counter confirmation bias by stating the bear case against your long setup; counter hindsight bias using blind bar-by-bar replay and live timestamps.',
        practical_exercise: {
          title: 'Pre-Trade Devil’s Advocate Drill',
          objective: 'Force balanced two-sided evaluation before entering.',
          steps: [
            'On your next 3 practice setups, write: (1) Why my direction works AND (2) The strongest structural argument against it.',
          ],
          deliverable: '3 two-sided Devil’s Advocate trade notes.',
        },
        visual_key: 'cognitive-biases-matrix',
        duration_minutes: 15,
        tags: ['confirmation-bias', 'hindsight-bias', 'objectivity'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-06-1',
            question: 'What is the best practical habit to counteract confirmation bias before opening a long trade?',
            options: [
              'Explicitly identify the strongest bearish obstacles/risks against your idea and exact price invalidation',
              'Only follow accounts agreeing with your buy bias',
              'Hide higher-timeframe resistance lines',
              'Enter first, analyze later',
            ],
            correct_index: 0,
            explanation: 'Actively testing the opposing thesis exposes flaws before capital is risked.',
          },
          {
            id: 'q-12-06-2',
            question: 'Why can scrolling back over completed historical charts create dangerous overconfidence?',
            options: [
              'Hindsight bias makes past turns look effortless because the messy live uncertainty at the right edge is already resolved',
              'Historical candles delete all wicks',
              'Old charts invert colors',
              'Charts hide spreads only in hindsight',
            ],
            correct_index: 0,
            explanation: 'Test strategies bar-by-bar without seeing future bars to avoid hindsight delusion.',
          },
          {
            id: 'q-12-06-3',
            question: 'Looking up bullish social-media posts strictly to feel better about a losing long trade is an example of:',
            options: ['Confirmation bias', 'Position sizing', 'Walk-forward testing', 'Role reversal'],
            correct_index: 0,
            explanation: 'Seeking validating noise while holding an endangered position delays necessary risk action.',
          },
        ],
      },
      {
        id: 'lesson-12-07',
        title: 'Following a Written Plan',
        category: 'Trading Psychology',
        summary: 'Bridge the gap between knowing good rules and actually obeying them when real money fluctuates.',
        learning_objective: 'Turn abstract trading knowledge into an enforceable written plan with clear consequences for rule breaks.',
        introduction:
          'Most struggling traders know risk rules intellectually—they lose money because they abandon their rules under live pressure.',
        content:
          '### Why Written Plans Hold Power\nMemory shifts convenience when stress rises. A printed or pinned **Written Trading Plan** acts as an external referee:\n- Defines **eligible setups** (anything outside the plan is forbidden, even if tempting).\n- Defines **non-negotiable risk rules**.\n- Establishes **consequences for rule-breaking**: e.g., any deliberate rule violation forces mandatory demo-only trading for 5 sessions.\n\n**Accountability**: Grade every week first by *Rule Compliance %* before looking at monetary P&L.',
        demonstration:
          '1. Contrast unplanned reactive trading (switching rules hourly based on emotion) vs. adhering to a 1-page pinned Execution Charter reviewed each Sunday.',
        common_mistakes: [
          'Treating your trading plan as a "rough suggestion" whenever an impulsive trade looks shiny.',
          'Writing an overly complex 40-page plan nobody actually opens daily.',
        ],
        summary_recap:
          'Keep your written plan concise, visible during every session, and enforce clear accountability when rules are broken.',
        practical_exercise: {
          title: '1-Page Execution Charter',
          objective: 'Condense your rules into an actually usable daily guide.',
          steps: [
            'Combine your Strategy Rulebook (Course 10) + Risk Charter (Course 11) onto a single concise sheet.',
            'Include a mandatory Rule-Break Consequence clause.',
          ],
          deliverable: 'Concise 1-Page Execution Charter.',
        },
        visual_key: 'pre-trade-routine-flow',
        duration_minutes: 14,
        tags: ['written-plan', 'compliance', 'execution'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-07-1',
            question: 'Why should a written trading plan stay concise (1–2 pages) rather than an unread 50-page manual?',
            options: [
              'So you actually consult and verify every rule calmly before placing trades',
              'Platforms forbid >2 pages',
              'Longer plans increase spread',
              'Short plans eliminate drawdown',
            ],
            correct_index: 0,
            explanation: 'Practical usability beats encyclopedic unread binders.',
          },
          {
            id: 'q-12-07-2',
            question: 'What metric matters most during your first months following a plan?',
            options: [
              'Rule Compliance Percentage (how faithfully you obeyed planned setups, stops, and limits)',
              'Total lottery dollars won in 1 lucky week',
              'Number of indicators stacked',
              'Daily screenshot count',
            ],
            correct_index: 0,
            explanation: 'Consistent compliance builds valid statistical data you can actually evaluate and refine.',
          },
          {
            id: 'q-12-07-3',
            question: 'True or False: Taking a profitable trade that broke your core risk rules is still a dangerous habit.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Rewarding broken rules reinforces reckless gambling behavior.',
          },
        ],
      },
      {
        id: 'lesson-12-08',
        title: 'Pre-Trade Checklist and Daily Routine',
        category: 'Trading Psychology',
        summary: 'Build a calm, repeatable daily ritual separating objective preparation from live execution.',
        learning_objective: 'Follow a structured pre-session routine (Rest & Mindset → Calendar → Top-Down Maps → Alerts → Execution Gate).',
        introduction:
          'Rushing straight from waking up or finishing a stressful commute into immediate live orders guarantees erratic clicks. A 15-minute routine centers focus.',
        content:
          '### 5-Step Daily Trading Routine\n1. **Personal Check-In (1 min)**: Rested, calm, zero tilt? If no → stand aside.\n2. **Economic Calendar Check (2 min)**: Mark today’s High/Medium impact releases and blackout windows.\n3. **Higher-Timeframe Map Review (5 min)**: Update Daily/H4 S&R zones and PDH/PDL on your 2–4 core focus pairs (never 30 random charts!).\n4. **Alert Placement (3 min)**: Place price alerts at key locations so you wait patiently.\n5. **Pre-Trade Binary Checklist (1 min per setup)**: Verify Context, Location, R:R Room, Candle Confirmation, and Exact Lot Size *before* order entry.',
        demonstration:
          '1. Follow the Pre-Trade Routine Flowchart illustrating how moving preparation *before* market engagement turns execution into calm button-pressing when alerts arrive.',
        common_mistakes: [
          'Scanning 25 random pairs impulsively when your primary 3 pairs are consolidating.',
          'Skipping the Economic Calendar check until CPI whips out your position.',
        ],
        summary_recap:
          'A consistent daily preparation routine filters noise, respects event windows, and keeps trading intentional rather than reactive.',
        practical_exercise: {
          title: '5-Day Routine Consistency Log',
          objective: 'Practice executing the 5-step prep sequence for five straight sessions.',
          steps: [
            'Follow the 5 steps before looking at lower timeframes for 5 weekdays.',
            'Track how pre-set alerts reduce impulsive screen-staring.',
          ],
          deliverable: '5-day daily routine completion log.',
        },
        visual_key: 'pre-trade-routine-flow',
        duration_minutes: 15,
        tags: ['routine', 'checklist', 'preparation'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-08-1',
            question: 'Why focus deeply on 2 to 4 familiar instruments rather than scanning 30 random assets continuously?',
            options: [
              'Deep familiarity with session behavior, spread rhythm, and clean key levels prevents rushed shallow setups',
              'Brokers block more than 4 charts',
              '30 pairs always correlate 100%',
              'Less focus improves execution',
            ],
            correct_index: 0,
            explanation: 'Specialization beats scattered attention.',
          },
          {
            id: 'q-12-08-2',
            question: 'What step belongs near the VERY START of any trading session?',
            options: [
              'Personal mindset check + Economic Calendar high-impact release check',
              'Placing a quick blind market order to warm up',
              'Checking social media predictions',
              'Doubling risk size',
            ],
            correct_index: 0,
            explanation: 'Checking personal readiness and scheduled volatility events sets safe boundaries upfront.',
          },
          {
            id: 'q-12-08-3',
            question: 'Placing price alerts at pre-mapped zones primarily prevents:',
            options: [
              'Boredom-induced overtrading while waiting for price to reach quality locations',
              'Weekend gaps',
              'Overnight swaps',
              'Central bank rate changes',
            ],
            correct_index: 0,
            explanation: 'Alerts liberate you from staring at mid-range chop.',
          },
        ],
      },
      {
        id: 'lesson-12-09',
        title: 'Handling Losing and Winning Streaks',
        category: 'Trading Psychology',
        summary: 'Maintain steady execution habits across both freezing drawdowns and hot runs without swinging between extremes.',
        learning_objective: 'Apply objective protocols for riding out normal losing runs and staying grounded during hot streaks.',
        introduction:
          'Variance clusters unpredictably. How you behave during a 5-trade losing streak—and a 5-trade winning streak—determines long-term equity curves far more than entry tweaks.',
        content:
          '### Surviving a Losing Streak\n- **Verify Execution First**: Were these 5 losses valid A+ plan trades (normal variance) OR angry revenge/FOMO rule breaks?\n- **If Valid Variance**: Keep trusting rules, throttle risk down slightly (`1% → 0.5%`) if drawdown hits threshold, take a brief rest day.\n- **If Rule Violations**: Halt immediately and practice 10 clean setups on demo before returning.\n- **Never Strategy-Hop Mid-Streak**: Dumping a tested approach every 6 trades guarantees collecting *only* drawdowns across endless random systems!\n\n### Navigating a Winning Streak\nStay humble, honor identical position risk caps, and refuse lifestyle spending illusions off one lucky week.',
        demonstration:
          '1. Compare two traders hitting 5 normal losses: Trader A switches to a completely new indicator strategy on trade 6 (catching the next drawdown there too); Trader B audits compliance, confirms valid variance at `0.5%` risk, and catches the next clean `+3R` wave cleanly.',
        common_mistakes: [
          'System-hopping every two weeks right at the trough of a normal drawdown.',
          'Ignoring whether losses came from bad variance vs. broken rules.',
        ],
        summary_recap:
          'Separate plan-compliant losses from undisciplined errors; avoid system-hopping mid-drawdown and keep risk steady across streaks.',
        practical_exercise: {
          title: 'Streak Diagnostic Tree',
          objective: 'Separate variance troubleshooting from compliance troubleshooting.',
          steps: [
            'Draw a simple 2-branch decision chart: "Are losses following my rules?" → Branch A (Yes: throttle softly, hold rules, review sample size) vs. Branch B (No: pause immediately, fix discipline).',
          ],
          deliverable: 'Losing-Streak Diagnostic Flowchart.',
        },
        visual_key: 'journal-process-outcome',
        duration_minutes: 15,
        tags: ['streaks', 'system-hopping', 'variance'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-09-1',
            question: 'What tragic pattern happens when traders constantly abandon their strategy after every 4–5 normal losses?',
            options: [
              'They collect the losing streak of Method A, jump to Method B just as Method A recovers, and catch Method B’s losing streak too',
              'They discover a 100% win-rate system quickly',
              'They pay zero commission',
              'Their expectancy rises linearly',
            ],
            correct_index: 0,
            explanation: 'Strategy-hopping turns temporary drawdowns across multiple systems into permanent losses.',
          },
          {
            id: 'q-12-09-2',
            question: 'Before tweaking any technical entry rule during a drawdown, what question must come first?',
            options: [
              '"Did these losses actually follow my written plan, or were they caused by FOMO, revenge, and oversized rule breaks?"',
              '"Which new indicator color should I try?"',
              '"Can I remove stops temporarily?"',
              '"Who can I copy signals from?"',
            ],
            correct_index: 0,
            explanation: 'Never blame technical strategy rules for losses caused by breaking the rules.',
          },
          {
            id: 'q-12-09-3',
            question: 'When experiencing a hot winning streak, maintaining humility means:',
            options: [
              'Keeping risk % capped and remembering future trades remain uncertain probabilistic trials',
              'Quitting your plan immediately',
              'Spending unrealized money aggressively',
              'Using max margin',
            ],
            correct_index: 0,
            explanation: 'Consistent discipline protects hard-earned streak gains.',
          },
        ],
      },
      {
        id: 'lesson-12-10',
        title: 'Trading Journal and Emotional Tags',
        category: 'Trading Psychology',
        summary: 'Maintain a rich trading journal capturing charts, R-outcomes, rule compliance, and emotional tags to reveal hidden self-sabotage patterns.',
        learning_objective: 'Log every trade with objective technical fields alongside emotional tags so data—not memory—guides self-improvement.',
        introduction:
          'Human memory selectively forgets messy mistakes and exaggerates smooth wins. A structured journal turns raw trading history into your most honest personal coach.',
        content:
          '### Essential Trading Journal Fields\n1. **Core Metrics**: Date/Time, Pair, Direction, Session, Strategy Tag, Entry/SL/TP prices, Risk %, Net R-Multiple (after spread/commission).\n2. **Visual Snapshots**: Screenshot at Entry AND Screenshot at Exit.\n3. **Process Grade (`Pass / Minor Slip / Rule Break`)**: Did it follow every checklist item?\n4. **Emotional Tags**: Tag pre-entry and in-trade mindset (`Calm`, `Patient`, `FOMO`, `Frustrated`, `Bored`, `Hesitant`, `Revenge`).\n\nAfter just 30 logged trades, sorting your journal by Emotional Tag instantly reveals the exact dollar cost of `FOMO` or `Bored` trades!',
        demonstration:
          '1. Review an illustrative Journal Audit table: `Calm/Patient` setups (`22 trades`): steady net positive R; `FOMO/Revenge` setups (`8 trades`): `-9.5R` erasing nearly all disciplined progress—exposing the exact leak immediately.',
        common_mistakes: [
          'Logging only winning trades or quitting your journal during losing weeks.',
          'Recording only entry/exit prices with zero screenshots or emotional notes.',
        ],
        summary_recap:
          'Journal every trade—wins, losses, screenshots, rule-grade, and emotional tags—so your biggest leaks become undeniable.',
        practical_exercise: {
          title: 'Journal Template Setup',
          objective: 'Build a personal journal structure ready for demo and review.',
          steps: [
            'Create a spreadsheet or notebook with the 4 essential column groups above (including Emotional Tags and Net R).',
            'Log 3 historical practice scenarios from the Chart Practice Lab cleanly.',
          ],
          deliverable: '3-entry completed trading journal log.',
        },
        visual_key: 'journal-process-outcome',
        duration_minutes: 16,
        tags: ['trading-journal', 'emotional-tags', 'self-review'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-10-1',
            question: 'Why include "Emotional Tags" (e.g., Calm, FOMO, Bored, Frustrated) alongside prices inside a trading journal?',
            options: [
              'Sorting performance by emotional state exposes exactly how much money impulsive rule-breaking costs you',
              'Brokers require emotional tags for payouts',
              'It lowers swap costs',
              'It predicts CPI releases',
            ],
            correct_index: 0,
            explanation: 'Quantifying the cost of FOMO or frustration motivates real behavioral change.',
          },
          {
            id: 'q-12-10-2',
            question: 'Why save screenshots BOTH at Entry AND at Exit?',
            options: [
              'To verify objectively whether your setup looked clean live (avoiding hindsight distortion) and review post-entry management',
              'To fill up hard drives',
              'Charts vanish after 24 hours',
              'To prove wins on social media',
            ],
            correct_index: 0,
            explanation: 'Live entry screenshots preserve exact context before future candles arrive.',
          },
          {
            id: 'q-12-10-3',
            question: 'When is journaling MOST valuable?',
            options: [
              'During losing streaks and rule breaks—even though temptation to hide from the journal is highest then',
              'Only after big winning weeks',
              'Once per year',
              'Never on demo accounts',
            ],
            correct_index: 0,
            explanation: 'Skipping losses blinds you to your highest-leverage fixes.',
          },
        ],
      },
      {
        id: 'lesson-12-11',
        title: 'Weekly Review and Process-Based Goals',
        category: 'Trading Psychology',
        summary: 'Replace toxic outcome-focused targets ("make $500 this week") with healthy process goals under your direct control.',
        learning_objective: 'Conduct structured weekend reviews separating Process Quality from P&L Outcomes and set process KPIs.',
        introduction:
          'Setting a goal to "make 5% every week" puts immense pressure on slow choppy weeks—pushing you to force awful trades on Friday just to hit a quota. Process goals cure that.',
        content:
          '### Process Goals vs. Outcome Goals\n- **Outcome Goal (Toxic)**: "Make $1,000 this month" → forces reckless overtrading in bad markets.\n- **Process Goals (Controllable)**:\n  - `100%` of trades had server-side SL & calculated lot size.\n  - `0` FOMO/Revenge trades.\n  - Logged `100%` of entries with screenshots and emotional tags.\n\n### The 2×2 Process/Outcome Grid\n- **Good Process + Good Outcome**: Ideal.\n- **Good Process + Bad Outcome**: Routine variance—**reward yourself!**\n- **Bad Process + Good Outcome**: Dangerous luck—**flag and correct immediately!**\n- **Bad Process + Bad Outcome**: Enforce corrective consequence.',
        demonstration:
          '1. Inspect the 2×2 Process-vs-Outcome diagram showing why grading the weekend review on **Rule Compliance Score** first breaks emotional P&L obsession.',
        common_mistakes: [
          'Setting daily/weekly dollar profit quotas.',
          'Celebrating a rule-breaking lucky windfall instead of recognizing its danger.',
        ],
        summary_recap:
          'Focus weekly reviews and goals on 100% controllable process compliance—never arbitrary weekly profit quotas.',
        practical_exercise: {
          title: '3 Process KPI Charter',
          objective: 'Define measurable weekly habits you control completely.',
          steps: [
            'Write 3 weekly process KPIs (zero dollar figures!).',
            'Design a Sunday 30-minute review checklist rating last week across the 2×2 Process/Outcome grid.',
          ],
          deliverable: 'Weekly Process Review Scorecard.',
        },
        visual_key: 'journal-process-outcome',
        duration_minutes: 15,
        tags: ['weekly-review', 'process-goals', 'kpi'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-11-1',
            question: 'Why are fixed weekly dollar profit quotas (e.g., "I must make $500 every Friday") harmful?',
            options: [
              'Markets do not deliver steady weekly setups on demand; quotas push you into forcing low-quality trades during chop',
              'Brokers confiscate fixed profits',
              'Markets are closed on Fridays',
              'Dollars convert inaccurately',
            ],
            correct_index: 0,
            explanation: 'Profit happens sporadically when market opportunity meets good execution—never on a salaried schedule.',
          },
          {
            id: 'q-12-11-2',
            question: 'How should you classify a trade where you broke risk rules, skipped your checklist, and accidentally got lucky with a +3R profit?',
            options: [
              'Bad Process / Good Outcome—treat it as a serious red-flag warning rather than repeating the behavior',
              'A+ textbook trade to repeat with larger size',
              'Proof rules are unnecessary',
              'A technical breakout',
            ],
            correct_index: 0,
            explanation: 'Lucky breaks on broken rules train deadly habits.',
          },
          {
            id: 'q-12-11-3',
            question: 'Which goal is 100% under your personal control every single week?',
            options: [
              'Completing your pre-trade checklist, sizing every trade strictly, and logging every trade honestly',
              'Making +10% return guaranteed',
              'Having zero stop-outs',
              'Getting EUR/USD to trend 300 pips',
            ],
            correct_index: 0,
            explanation: 'Execution and preparation are yours to control; market movement is not.',
          },
        ],
      },
      {
        id: 'lesson-12-12',
        title: 'When to Stop Trading and Seek Support',
        category: 'Trading Psychology',
        summary: 'Recognize serious financial and mental-health boundaries—knowing when pausing completely protects life, family, and well-being.',
        learning_objective: 'Identify unmistakable warning signs that require halting live risk immediately and seeking trusted financial or personal support.',
        introduction:
          'No curriculum is complete without honesty about human limits. Trading leveraged markets should never jeopardize rent, family stability, mental health, or financial solvency.',
        content:
          '### Hard Stop Red Flags (Pause Immediately)\n1. **Trading with Scared / Essential Money**: Using rent, tuition, medical funds, borrowed money, or credit cards.\n2. **Compulsive Behavior**: Secretly hiding losses from family, lying about account balances, chasing losses uncontrollably.\n3. **Persistent Rule Collapse**: Repeatedly violating risk limits and blowing past drawdown halts.\n4. **Severe Emotional Distress**: Insomnia, panic attacks, depression, or inability to step away from charts.\n\n### Healthy Next Steps\nClose open risk safely, step completely away from live markets, return purely to zero-risk education/demo only after stability returns, and speak openly with a trusted loved one, financial counselor, or licensed mental-health professional.',
        demonstration:
          '1. Review a straightforward personal safeguard pledge: Never trade borrowed/bill money, honor hard loss limits, and seek outside human support whenever compulsion or secrecy appears.',
        common_mistakes: [
          'Trying to trade your way out of personal debt or urgent life expenses (desperation breaks every rule!).',
          'Isolating silently in shame when losses mount.',
        ],
        summary_recap:
          'Never risk essential living money or trade in distress; stepping away permanently or temporarily is a sign of maturity and strength.',
        practical_exercise: {
          title: 'Capital Separation & Support Pledge',
          objective: 'Ensure trading funds remain 100% strictly disposable risk capital.',
          steps: [
            'Verify that any future practice or capital allocation stays completely isolated from living expenses, emergency savings, and debt.',
            'Write down one trusted person you commit to speaking openly with if trading stress ever hurts your daily life.',
          ],
          deliverable: 'Personal Well-Being & Risk-Capital Boundary Statement.',
        },
        visual_key: 'pre-trade-routine-flow',
        duration_minutes: 14,
        tags: ['wellbeing', 'responsible-trading', 'support'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-12-12-1',
            question: 'What kind of money is strictly UNSUITABLE for leveraged Forex, Gold, or Crypto trading?',
            options: [
              'Rent/mortgage money, emergency savings, tuition, borrowed loans, or credit-card cash',
              'Strictly disposable risk capital you can afford to lose without altering living standards',
              'Demo virtual practice money',
              'None—all money should be leveraged',
            ],
            correct_index: 0,
            explanation: 'Trading essential or borrowed funds creates paralyzing fear and desperation.',
          },
          {
            id: 'q-12-12-2',
            question: 'Hiding trading losses from family, trading aggressively to pay urgent bills, and feeling unable to stop checking charts at 3 a.m. signal:',
            options: [
              'Serious warning signs requiring an immediate halt to live trading and honest support from trusted people/professionals',
              'Normal dedication toward becoming a pro',
              'Need to switch indicators',
              'Time to increase leverage',
            ],
            correct_index: 0,
            explanation: 'Compulsive loss-chasing and secrecy require stepping back cleanly for personal health and safety.',
          },
          {
            id: 'q-12-12-3',
            question: 'True or False: Choosing to pause trading temporarily or step back when life conditions or rules break down is wise risk management.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Protecting life and solvency always outweighs any market trade.',
          },
        ],
      },
    ],
  },
  {
    id: 'course-13-gold-trading',
    slug: 'gold-trading-xauusd',
    course_number: 13,
    title: '13. Gold Trading (XAUUSD)',
    category: 'Gold Trading (XAUUSD)',
    level: 'Advanced',
    level_label: 'Advanced',
    description:
      'Master spot Gold (XAU/USD) mechanics without misconceptions: broker-specific contract specs, why tick/point/pip conventions vary, liquidity/spread behavior, USD & real yields, central-bank/jewelry/ETF flows, geopolitical spikes, London/NY timing, key levels, news slippage, Gold-adjusted sizing, and Gold-specific backtesting.',
    prerequisites: 'Courses 01–12 recommended—especially Risk Management and Fundamental Analysis.',
    learning_outcomes: [
      'Verify exact broker contract size (100 oz standard vs. micro contracts) and point/pip conventions before sizing XAU/USD.',
      'Explain how US real yields, US Dollar strength, central-bank buying, and safe-haven shocks interact—including why correlations sometimes decouple.',
      'Adapt stop distances, spread cushions, and position sizes safely to Gold’s sharper intraday volatility.',
      'Design and backtest Gold-specific rules around London/New York liquidity windows and round-number price bands.',
    ],
    estimated_hours: 4.5,
    cover_image_url: '/src/assets/images/gold_commodity_analysis_1795085837457.jpg',
    assessment: [
      {
        id: 'c13-a1',
        question: 'Why must you NEVER assume a universal "1 pip = $10" rule when trading XAU/USD across different brokers?',
        options: [
          'Brokers define XAU/USD decimal formatting (0.01 vs 0.10 pip conventions) and contract sizes differently—so always verify specs directly in the broker ticket',
          'Gold prices never change by less than $100',
          'Gold pays zero swaps',
          'Gold only trades in Tokyo',
        ],
        correct_index: 0,
        explanation: 'Assuming EUR/USD pip shortcuts on XAU/USD frequently causes 10× sizing disasters when decimal definitions differ.',
      },
      {
        id: 'c13-a2',
        question: 'In standard 100-ounce spot Gold contracts (1.00 lot = 100 troy oz), how much does a $10.00 price move in XAU/USD affect P&L?',
        options: ['$1,000 USD', '$100 USD', '$10 USD', '$50 USD'],
        correct_index: 0,
        explanation: '100 oz × $10.00 move per oz = $1,000 USD (so 0.01 lots = 1 oz, where $10 move = $10!).',
      },
      {
        id: 'c13-a3',
        question: 'Why do rising US REAL interest yields (nominal yields minus inflation expectations) often create a macro headwind for Gold?',
        options: [
          'Gold pays no interest or dividend, so higher inflation-adjusted bond yields increase the opportunity cost of holding non-yielding bullion',
          'Gold melts when interest rises',
          'Mines shut down automatically',
          'Spread drops to zero',
        ],
        correct_index: 0,
        explanation: 'Non-yielding bullion competes with real returns on sovereign bonds—though geopolitical or central-bank demand can temporarily override yield relationships.',
      },
      {
        id: 'c13-a4',
        question: 'Which intraday transition typically concentrates peak global XAU/USD liquidity and price discovery?',
        options: [
          'London AM/PM price benchmarks into New York COMEX/spot overlap',
          'Late Friday market close',
          'Daily 17:00 ET settlement rollover window',
          'Sunday 22:05 UTC open',
        ],
        correct_index: 0,
        explanation: 'London bullion clearing and New York COMEX/macro data overlap concentrate Gold order flow.',
      },
      {
        id: 'c13-a5',
        question: 'Can geopolitical safe-haven spikes in Gold retrace violently within hours once immediate panic fades?',
        options: [
          'Yes—headline geopolitical spikes often produce wild two-way wicks and wide spreads, demanding disciplined sizing and stand-aside caution',
          'No—safe-haven spikes always move in a straight line forever',
          'Only if RSI is below 20',
          'Gold never retraces after news',
        ],
        correct_index: 0,
        explanation: 'Emotional crisis spikes often overshoot equilibrium before sharp mean-reversion snaps.',
      },
    ],
    lessons: [
      {
        id: 'lesson-13-01',
        title: 'XAUUSD Quote and Broker Contract Specifications',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Learn what XAU/USD prices represent (1 troy ounce in USD) and why verifying exact contract size per 1.00 lot is mandatory.',
        learning_objective: 'Read XAU/USD quotes accurately and verify lot contract size (100 troy ounces typical vs. broker variations) before opening any order.',
        introduction:
          'One of the costliest errors beginners make when moving from EUR/USD to Gold is clicking the same lot size without checking contract specifications. Gold moves far more dollars per lot than beginners realize.',
        content:
          '### Decoding XAU/USD\n- **XAU** is the ISO currency code for **1 troy ounce of Gold**; **USD** is US Dollars.\n- Quote `XAU/USD = 2,650.00` means 1 troy ounce of Gold costs `$2,650.00 USD`.\n\n### Contract Size Math (Verify Your Broker!)\nTypically on CFD/spot retail platforms, **1.00 standard lot = 100 troy ounces**:\n- At `1.00 lot`: every `$1.00` move in Gold price = **`$100`** P&L (`100 oz × $1`).\n- At `0.10 lots` (10 oz): every `$1.00` move = **`$10`**.\n- At `0.01 lots` (1 oz): every `$1.00` move = **`$1`**.\n\n*Warning*: Some brokers offer 10-oz or 1-oz contract specs—**always read the Contract Specification window** on your exact platform before placing your first trade.',
        demonstration:
          '1. Inspect the XAU/USD Contract Spec diagram: Account = `$1,000`, `1%` Risk (`$10`), Stop Distance = `$10.00` (`e.g., $2,640 to $2,630`). Using `100 oz/lot`: `Lot Size = $10 ÷ ($10 move × 100 oz) = 0.01 lots`! Notice that `0.10 lots` would have risked `$100` (`10%`) silently!',
        common_mistakes: [
          'Clicking 0.10 lots on Gold out of EUR/USD habit without realizing a routine $15 Gold swing equals $150!',
          'Skipping the platform’s Symbol Specification sheet before switching brokers.',
        ],
        summary_recap:
          '1.00 typical spot XAU/USD lot controls 100 troy ounces ($100 per $1 move); always confirm exact broker contract size and calculate risk in dollar price move × ounces.',
        practical_exercise: {
          title: 'Gold Dollar-Move Sizing Drill',
          objective: 'Calculate safe Gold lot sizes using dollar price distance directly.',
          steps: [
            'Take a $3,000 USD account with a strict 1% risk limit ($30).',
            'Compute exact max lot size (assuming 100 oz/lot) for a $15.00 stop distance and a $30.00 stop distance.',
          ],
          deliverable: 'Written Gold sizing calculation (`$30 ÷ ($15 × 100) = 0.02 lots`, etc.).',
        },
        visual_key: 'xauusd-contract-specs',
        duration_minutes: 18,
        tags: ['xauusd', 'contract-specs', 'gold-lots'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'q-13-01-1',
            question: 'Assuming a standard 100 troy ounce contract (1.00 lot = 100 oz), how much P&L does a $12.00 move in Gold produce on 0.05 lots (5 oz)?',
            options: ['$60.00 USD', '$12.00 USD', '$600.00 USD', '$5.00 USD'],
            correct_index: 0,
            explanation: '0.05 lots × 100 oz = 5 troy ounces; 5 oz × $12.00 = $60.00 USD.',
          },
          {
            id: 'q-13-01-2',
            question: 'Why is copying your usual EUR/USD lot size blindly onto XAU/USD hazardous?',
            options: [
              'Gold’s dollar move per ounce multiplied by 100 oz/lot and wide daily dollar swings can accidentally multiply dollar risk many times over',
              'Gold stops trading on Tuesdays',
              'Gold pip value is always $0.01',
              'Brokers lock Gold spreads at zero',
            ],
            correct_index: 0,
            explanation: 'Gold frequently swings $25–$50/oz intraday, demanding exact ounce-based sizing.',
          },
          {
            id: 'q-13-01-3',
            question: 'Where should you ALWAYS confirm contract size (ounces per 1.00 lot) before trading Gold on a new broker?',
            options: [
              'Inside the broker platform’s Symbol / Contract Specification window',
              'From an unrelated social media chart',
              'By guessing with a live market order',
              'From EUR/USD settings',
            ],
            correct_index: 0,
            explanation: 'Contract sizes vary by platform (e.g., 100 oz CFD vs. 10 oz mini futures vs. 1 oz micro).',
          },
        ],
      },
      {
        id: 'lesson-13-02',
        title: 'Tick, Point, and Pip Conventions Differ by Broker',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Eliminate confusion between points, ticks, 0.01 cents, and 0.10 "Gold pips" so you never misread signals or calculators by 10×.',
        learning_objective: 'Communicate and calculate Gold price distances strictly in clear USD per ounce (e.g., "$12.50 move") rather than ambiguous "pips."',
        introduction:
          'Ask three traders how many "pips" a move from `$2,640.00` to `$2,650.00` equals on Gold and you might hear "100 pips," "1,000 pips," or "10 pips" depending on their broker’s decimal digits!',
        content:
          '### Why Gold "Pip" Terminology Confuses Everyone\n- On a **2-decimal** broker (`2650.00`), the smallest tick is `0.01` (`$0.01`), so some call `0.10` a "pip" (`100 pips` for `$10`) while others call `0.01` a pip (`1,000 points` for `$10`).\n- On a **3-decimal** broker (`2650.000`), `0.001` adds an extra zero (`10,000 points`!).\n\n### Bulletproof Professional Habit\n**Drop ambiguous "pip" guesses on Gold—always verify distances in USD per troy ounce!** Moving from `2,640.00` to `2,652.00` is unambiguously a **`$12.00` move** on every broker in the world. `Dollar Risk = Dollar Move × Ounces Held`.',
        demonstration:
          '1. Compare Broker A (`2,650.00`, 2 decimals) vs. Broker B (`2,650.000`, 3 decimals) on the visual spec card: Both measure identical `$12.00` risk per oz—removing 10× calculator errors forever.',
        common_mistakes: [
          'Reading someone’s "30-pip Gold stop" online without knowing whether they mean $3.00 or $30.00!',
          'Typing 1,000 pips vs. 100 pips into a generic Forex pip calculator.',
        ],
        summary_recap:
          'Gold pip definitions vary across 2-decimal and 3-decimal brokers; measure Gold stops and targets strictly in USD/oz (`$X.XX`) and ounces.',
        practical_exercise: {
          title: 'Ambiguity Elimination Check',
          objective: 'Practice converting ambiguous "pip/point" quotes into exact USD/oz distance.',
          steps: [
            'Check how many decimal places XAU/USD uses on your practice platform.',
            'Practice writing Gold trade setups using exact USD price distance (e.g., Entry $2,640.00 / Stop $2,625.00 = $15.00 risk/oz).',
          ],
          deliverable: 'Standardized USD/oz Gold ticket template.',
        },
        visual_key: 'xauusd-contract-specs',
        duration_minutes: 14,
        tags: ['gold-pips', 'ticks', 'points', 'decimals'],
        sources: [OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-13-02-1',
            question: 'What is the clearest, least error-prone unit for measuring Gold stop-loss and target distances?',
            options: [
              'Exact USD per troy ounce price move (e.g., "$15.00 move") paired with number of ounces held',
              'Generic "pips" copied from EUR/USD',
              'Broker tick counts without checking decimals',
              'Percentage points of RSI',
            ],
            correct_index: 0,
            explanation: 'USD per ounce is universal regardless of 2-decimal vs 3-decimal platform formatting.',
          },
          {
            id: 'q-13-02-2',
            question: 'Why does seeing "1,000 points" on one XAU/USD chart and "100 pips" on another sometimes refer to the exact same $10.00 move?',
            options: [
              'Because 0.01 increments equal 1,000 steps per $10 while 0.10 increments equal 100 steps per $10',
              'One chart is broken',
              'Gold trades at two different prices per ounce simultaneously',
              'Swap rates shift decimals',
            ],
            correct_index: 0,
            explanation: 'Decimal granularity differs across brokers; always check raw dollar price difference.',
          },
          {
            id: 'q-13-02-3',
            question: 'If you hold 2 troy ounces (0.02 standard lots on a 100-oz contract) and Gold rises $18.00, your gross gain is:',
            options: ['$36.00 USD', '$180.00 USD', '$1,800.00 USD', '$9.00 USD'],
            correct_index: 0,
            explanation: '2 troy oz × $18.00/oz = $36.00 gross profit before spread/swap.',
          },
        ],
      },
      {
        id: 'lesson-13-03',
        title: 'Gold Liquidity, Spreads, and Volatility',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Understand why Gold spikes faster, throws longer wicks, and carries wider spreads during rollover and macro shocks than major FX pairs.',
        learning_objective: 'Account accurately for Gold’s ATR expansion, rollover spread widening, and sharper liquidity sweeps.',
        introduction:
          'Gold attracts intense speculative futures, ETF, physical bullion, and algorithmic flows—giving it noticeably sharper intraday whipsaws than EUR/USD.',
        content:
          '### Gold Microstructure Realities\n- **Higher Daily Dollar ATR**: Routine quiet days move `$20–$35/oz`; CPI/FOMC or geopolitical days frequently stretch `$50–$90+/oz`.\n- **Longer Rejection Wicks**: Liquidity gaps around London/NY openings and round handles (`$2,600`, `$2,650`) produce sharp wick probes.\n- **Rollover Widening (`17:00 ET`)**: Gold spreads frequently widen sharply during the daily settlement transition hour (often 5:00–6:00 PM ET)—tight stops left open across rollover are vulnerable.',
        demonstration:
          '1. Compare Daily ATR relative scale: `EUR/USD` oscillating peacefully (`~0.6%` daily move) versus `XAU/USD` (`~1.2%–2.2%` on active macro days)—requiring wider structural buffers and smaller lot sizes.',
        common_mistakes: [
          'Using fragile `$3.00` stops on Gold during New York open when 15-minute ATR alone exceeds `$6.00`.',
          'Opening trades during the thin `17:00–18:00 ET` daily settlement spread spike.',
        ],
        summary_recap:
          'Respect Gold’s sharper volatility, wider rollover spreads, and frequent wick sweeps with ATR-scaled buffers and calm session timing.',
        practical_exercise: {
          title: 'XAU/USD Volatility & Spread Audit',
          objective: 'Measure realistic Gold intraday swings before setting stops.',
          steps: [
            'Check H1 and Daily ATR(14) on XAU/USD in the Markets/Chart view.',
            'Notice typical spread during peak London/NY overlap vs. rollover.',
          ],
          deliverable: 'XAU/USD ATR & spread reference note.',
        },
        visual_key: 'xauusd-sessions-liquidity',
        duration_minutes: 15,
        tags: ['gold-volatility', 'spreads', 'rollover'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.CFTC_FX],
        quiz: [
          {
            id: 'q-13-03-1',
            question: 'When is XAU/USD spot/CFD spread typically widest and liquidity thinnest on weekdays?',
            options: [
              'During the daily 17:00–18:00 ET settlement/rollover transition window and major Tier-1 news releases',
              'Mid-morning London-New York overlap',
              '14:00 UTC on quiet normal days',
              'Never—Gold spreads are always fixed at 0.01',
            ],
            correct_index: 0,
            explanation: 'Settlement rollover pauses major liquidity feeds briefly, widening variable spreads sharply.',
          },
          {
            id: 'q-13-03-2',
            question: 'If H1 ATR(14) on Gold is $8.50, placing a $2.50 intraday stop-loss is likely to:',
            options: [
              'Get clipped continuously by routine single-candle noise',
              'Achieve 95% win rate',
              'Eliminate market slippage',
              'Halve commission fees',
            ],
            correct_index: 0,
            explanation: 'Stops tighter than routine bar noise fail systematically.',
          },
          {
            id: 'q-13-03-3',
            question: 'True or False: Gold generally exhibits sharper wick extensions around obvious round handles than quiet FX crosses like EUR/GBP.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Heavy COMEX futures and options/algorithmic activity drives sharper spikes around round benchmarks.',
          },
        ],
      },
      {
        id: 'lesson-13-04',
        title: 'US Dollar, Real Yields, and Interest-Rate Expectations',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Understand the classic macro relationship linking US real yields, Fed policy pricing, DXY, and Gold—plus why relationships occasionally diverge.',
        learning_objective: 'Track US real yields and US Dollar direction as macro context for Gold without treating any single inverse correlation as automatic.',
        introduction:
          'Because global Gold is priced primarily in US Dollars and earns zero interest yield, Federal Reserve rate expectations and inflation-adjusted Treasury yields heavily influence Gold’s medium-term tide.',
        content:
          '### The Opportunity-Cost Mechanism\n- **Real Yield = Nominal Treasury Yield − Expected Inflation**.\n- When US real yields rise (hawkish Fed / sticky higher real rates), holding cash or Treasuries pays attractive inflation-beating interest—creating a **headwind** for non-yielding Gold.\n- When real yields fall (dovish rate-cut expectations or rising inflation with capped rates), Gold’s opportunity cost shrinks—creating a **tailwind**.\n- **US Dollar Link**: A surging `USD` generally pressures `XAU/USD` lower (since Gold becomes pricier in foreign currencies).\n\n**Important Nuance**: Gold does **not** obey a mechanical `-1.0` inverse rule! During intense sovereign central-bank buying or debt/geopolitical stress, Gold and USD or Gold and yields can rally **together**.',
        demonstration:
          '1. Review the XAU/USD Macro Drivers diagram showing how Real Yields (`opportunity cost`), DXY (`denominator currency`), Central-Bank Purchases, and Safe-Haven Shocks interact dynamically.',
        common_mistakes: [
          'Shorting Gold blindly solely because DXY ticked up 0.2% while Gold’s own chart sits in a strong uptrend.',
          'Confusing nominal yields with real (inflation-adjusted) yields.',
        ],
        summary_recap:
          'Rising US real yields and strong USD often pressure Gold, while falling real yields support it—yet central-bank and crisis flows can cause temporary decoupling.',
        practical_exercise: {
          title: 'Macro Alignment Overlay Check',
          objective: 'Compare XAU/USD macro direction with DXY and Fed rate shifts.',
          steps: [
            'Compare XAU/USD Daily chart direction against USD strength (e.g., EUR/USD inverse or USD/JPY) across the past month.',
            'Note whether they moved inversely or decoupled.',
          ],
          deliverable: 'Short monthly Gold vs. USD macro correlation note.',
        },
        visual_key: 'xauusd-macro-drivers',
        duration_minutes: 17,
        tags: ['real-yields', 'usd', 'fomc', 'gold-macro'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-13-04-1',
            question: 'Why does Gold often face selling pressure when US real interest yields climb sharply?',
            options: [
              'Gold generates no yield, so higher inflation-adjusted bond returns raise the opportunity cost of holding Gold',
              'Treasury yields physically replace Gold mines',
              'Higher interest rates raise swap profits on short Gold',
              'Central banks sell all gold at 5%',
            ],
            correct_index: 0,
            explanation: 'Real yields represent the return sacrificed by holding non-interest-bearing bullion.',
          },
          {
            id: 'q-13-04-2',
            question: 'Can Gold and the US Dollar ever rise simultaneously?',
            options: [
              'Yes—for example during intense global crisis safe-haven demand for both USD liquidity and Gold, or heavy central-bank accumulation',
              'No, it is mathematically impossible',
              'Only on Saturdays',
              'Never in history',
            ],
            correct_index: 0,
            explanation: 'Multiple simultaneous drivers can override single-variable inverse correlations.',
          },
          {
            id: 'q-13-04-3',
            question: 'How is "Real Yield" defined?',
            options: [
              'Nominal interest rate/yield minus expected or realized inflation',
              'Gross dividend divided by spread',
              'Gold price divided by EUR/USD',
              'Nominal yield plus broker commission',
            ],
            correct_index: 0,
            explanation: 'Real yield measures purchasing-power return after accounting for inflation.',
          },
        ],
      },
      {
        id: 'lesson-13-05',
        title: 'Central-Bank Demand, Jewelry, and Investment Demand',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Understand the multi-pillar physical demand landscape underpinning Gold beyond short-term speculative charts.',
        learning_objective: 'Identify the four structural demand pillars for Gold (Central Banks, Investment/ETFs, Jewelry, Technology) and how they affect macro floors.',
        introduction:
          'Unlike paper FX rates purely reflecting monetary policy, Gold is a physical commodity bought by central banks, jewelers, ETF investors, and electronics manufacturers.',
        content:
          '### Four Structural Demand Pillars\n1. **Central-Bank Reserves**: Sovereign central banks hold and diversify reserves into physical Gold to reduce single-currency concentration risk—creating steady multi-year underlying accumulation.\n2. **Investment & ETF Flows**: Gold-backed ETFs (`physically allocated funds`), coins, and bars respond rapidly to interest rates, inflation fears, and equity volatility.\n3. **Jewelry Demand**: Largest share of physical fabrication demand seasonally (especially around major Indian and Chinese cultural/wedding seasons), providing gradual price elasticity on deep dips.\n4. **Industrial / Tech**: Electronics and medical applications (smaller, steady share).\n\nPhysical demand rarely triggers 15-minute scalp moves—it shapes major **multi-month support floors**.',
        demonstration:
          '1. Review the XAU/USD Macro Drivers chart connecting short-term paper futures/yield shocks (intraday–weeks) vs. structural central-bank & physical fabrication demand (months–years).',
        common_mistakes: [
          'Trying to time a 5-minute chart off an annual central-bank reserve headline.',
          'Ignoring ETF outflows vs. sovereign reserve accumulation when assessing long-term bias.',
        ],
        summary_recap:
          'Paper yields/USD govern short-term Gold swings while central banks, ETFs, and physical jewelry demand shape long-term structural tides.',
        practical_exercise: {
          title: 'Horizon-to-Driver Mapping',
          objective: 'Match Gold drivers to appropriate chart timeframes.',
          steps: [
            'Classify 4 Gold drivers (US CPI surprise, H1 London liquidity, ETF weekly flows, Central bank multi-year buying) by the chart timeframe they primarily influence.',
          ],
          deliverable: '4-row Gold driver timeframe map.',
        },
        visual_key: 'xauusd-macro-drivers',
        duration_minutes: 14,
        tags: ['central-banks', 'gold-demand', 'etfs'],
        sources: [OFFICIAL_SOURCES.BIS_HUB, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-13-05-1',
            question: 'Which demand pillar primarily influences Gold’s multi-quarter/multi-year reserve foundation rather than 15-minute candles?',
            options: [
              'Central-bank reserve diversification and long-term physical fabrication trends',
              '5-minute RSI divergence',
              'Daily 17:00 ET rollover spreads',
              'Intraday NFP tick spikes',
            ],
            correct_index: 0,
            explanation: 'Sovereign accumulation operates systematically over quarters and years.',
          },
          {
            id: 'q-13-05-2',
            question: 'How do Gold-backed ETFs typically react when real interest yields tumble or financial stress spikes?',
            options: [
              'Investor inflows often push ETFs to add physical bullion allocations, reinforcing upside moves',
              'ETFs shut down',
              'Jewelry prices drop to zero',
              'Contract sizes shrink',
            ],
            correct_index: 0,
            explanation: 'Investment ETF flows transmit financial sentiment directly into bullion demand.',
          },
          {
            id: 'q-13-05-3',
            question: 'Why are jewelry purchases generally price-elastic on sharp Gold selloffs?',
            options: [
              'Physical retail buyers and jewelers often step in opportunistically at discounted prices during seasonal festivals',
              'Jewelry must be bought every Friday at 15:00',
              'Mines close when price rises',
              'Brokers discount gold spreads',
            ],
            correct_index: 0,
            explanation: 'Deep dips attract physical fabrication restocking in major bullion markets.',
          },
        ],
      },
      {
        id: 'lesson-13-06',
        title: 'Geopolitical and Safe-Haven Narratives',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Navigate sudden crisis/war/banking headlines calmly—understanding why crisis spikes frequently snap back once fear stabilizes.',
        learning_objective: 'Manage sudden geopolitical gap/spike volatility without chasing parabolic headlines at terrible risk-reward.',
        introduction:
          'When unexpected geopolitical conflicts or banking scares break, algorithms and nervous buyers bid Gold sharply higher within minutes—and just as suddenly dump it if tensions de-escalate.',
        content:
          '### Headline Spike Reality\n- Initial crisis headlines trigger instantaneous **liquidity vacuum gaps** where spreads blow out and price jumps `$25–$60` before human traders finish reading the first paragraph.\n- **Buy-the-Rumor / Sell-the-Fact Reversals**: If escalation stops short of worst-case fears, late retail buyers chasing headline peaks routinely suffer painful rapid retracements.\n\n### Practical Rule\nNever chase unconfirmed crisis spikes mid-air without a clean structural base and affordable stop. Standing flat during chaotic unscheduled headline volatility preserves capital.',
        demonstration:
          '1. Examine a simulated crisis spike scenario: Gold gaps `$35` higher on breaking weekend headlines, peaks with a long upper wick as short covering finishes, then retraces `60%` of the gap once liquidity restores.',
        common_mistakes: [
          'Buying blindly at the peak of an emotional news spike because "war started, Gold must double!"',
          'Leaving tight stops over high-tension geopolitical weekends.',
        ],
        summary_recap:
          'Headline geopolitical spikes create dangerous spread blowouts and sharp two-way snapbacks; never chase ungrounded news spikes.',
        practical_exercise: {
          title: 'Safe-Haven Spike Protocol',
          objective: 'Pre-plan rational behavior when breaking headlines hit Gold.',
          steps: [
            'Write a personal rule covering maximum stop-distance / stand-aside threshold when unscheduled geopolitical spikes widen XAU/USD spreads.',
          ],
          deliverable: 'Geopolitical Volatility Safety Protocol.',
        },
        visual_key: 'xauusd-macro-drivers',
        duration_minutes: 15,
        tags: ['safe-haven', 'geopolitics', 'headline-risk'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-13-06-1',
            question: 'Why is immediately market-buying Gold right after a surprise geopolitical headline has already pushed price up $45 in 10 minutes risky?',
            options: [
              'Spreads are abnormally wide, structural stop distance is huge, and de-escalation often sparks violent fast snapbacks',
              'Gold cannot fall once geopolitical news appears',
              'Brokers freeze profits permanently',
              'Real yields instantly drop to negative 50%',
            ],
            correct_index: 0,
            explanation: 'Chasing wide-spread vertical spikes ruins R:R and risks instant headline mean reversion.',
          },
          {
            id: 'q-13-06-2',
            question: 'What happens to weekend gap risk on XAU/USD when geopolitical tensions escalate Friday evening?',
            options: [
              'Sunday opening gaps can easily jump right over resting stops, realizing losses larger than planned',
              'Stops guarantee exact price protection even across closed weekends',
              'Gold opens identically to Friday close always',
              'Swap credits erase losses',
            ],
            correct_index: 0,
            explanation: 'Closed-market shocks open with instant price discontinuities.',
          },
          {
            id: 'q-13-06-3',
            question: 'True or False: Standing aside flat during chaotic, illiquid breaking-news swings is a valid professional choice.',
            options: ['True', 'False'],
            correct_index: 0,
            explanation: 'True. Preserving capital when risk cannot be cleanly quantified is essential.',
          },
        ],
      },
      {
        id: 'lesson-13-07',
        title: 'London and New York Trading Periods',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Time XAU/USD setups around peak London bullion fixes, COMEX open, and U.S. macro release windows.',
        learning_objective: 'Identify high-quality London and New York Gold execution windows and avoid thin off-peak chop.',
        introduction:
          'Gold wakes up dramatically when London opens—and shifts into top gear as New York COMEX futures and U.S. economic prints come online.',
        content:
          '### Gold Session Rhythm (UTC Context)\n- **Asian Session**: Generally tighter ranges around prior day close (though Chinese physical market opens can add periodic bursts).\n- **London Morning (`~07:00–11:30 UTC`)**: Strong European participation; Asian high/low often swept or cleanly broken; LBMA morning price benchmark (`10:30` London).\n- **New York Open & Overlap (`~12:30–16:30 UTC`)**: **Peak Gold volatility**—US macro prints (`12:30/13:30 UTC`), COMEX futures volume, and LBMA PM benchmark (`15:00` London) drive dominant directional expansion or key daily reversals.',
        demonstration:
          '1. Review the XAU/USD Session Timeline marking quiet Asian range building, London morning expansion/probe, and NY COMEX/macro data peak liquidity.',
        common_mistakes: [
          'Trading tight intraday breakouts on Gold during dead late-NY afternoons after 16:30 NY time.',
          'Forgetting U.S. data releases (`08:30 ET` / `10:00 ET`) routinely whipsaw Gold before choosing trend.',
        ],
        summary_recap:
          'Focus active Gold analysis around London open and the London–New York COMEX/macro overlap while avoiding thin rollover windows.',
        practical_exercise: {
          title: 'Gold Intraday Clock Mapping',
          objective: 'Align your personal timezone directly to Gold’s peak windows.',
          steps: [
            'Convert 07:00–11:00 UTC (London) and 12:30–16:30 UTC (NY Overlap) into your exact local city time.',
            'Confirm which window fits your daily routine cleanly.',
          ],
          deliverable: 'Local-time Gold Session Schedule.',
        },
        visual_key: 'xauusd-sessions-liquidity',
        duration_minutes: 15,
        tags: ['gold-sessions', 'comex', 'london-ny'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'q-13-07-1',
            question: 'Which daily period concentrates the highest Gold volume and U.S. macro catalysts?',
            options: [
              'New York open and London–New York overlap',
              'Daily 17:00–18:00 ET settlement window',
              'Late Friday afternoon after London closes',
              'Sunday 22:00 UTC opening tick',
            ],
            correct_index: 0,
            explanation: 'COMEX futures, U.S. Treasury yield moves, and London bullion desks overlap simultaneously then.',
          },
          {
            id: 'q-13-07-2',
            question: 'What often happens around Asian session highs/lows when London Gold desks open?',
            options: [
              'Probes/sweeps of Asian extremes or directional breakouts into morning trend moves',
              'Gold halts completely until Tuesday',
              'Spreads vanish to zero',
              'Charts invert vertically',
            ],
            correct_index: 0,
            explanation: 'Fresh European liquidity tests overnight boundaries before establishing morning direction.',
          },
          {
            id: 'q-13-07-3',
            question: 'Should you open new tight-stop intraday XAU/USD trades 5 minutes before U.S. CPI or FOMC?',
            options: [
              'No—wait for the release and post-event candle stabilization',
              'Yes, always gamble ahead of CPI',
              'Only with max leverage',
              'Yes if RSI equals 50',
            ],
            correct_index: 0,
            explanation: 'Gold routinely jumps $20–$50/oz in seconds on major US inflation/Fed surprises.',
          },
        ],
      },
      {
        id: 'lesson-13-08',
        title: 'Gold Chart Structure and Key Levels',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Apply structural S&R, previous day/week extremes, and major $50/$100 psychological price levels accurately to XAU/USD.',
        learning_objective: 'Map high-respect Gold reference zones including $50/$100 handles, PDH/PDL, and Weekly swing zones.',
        introduction:
          'Gold respects clean structural analysis exceptionally well—when plotted on the right scale. Big $50 and $100 increments act like institutional magnets and reaction bands.',
        content:
          '### Gold Key-Level Hierarchy\n1. **Weekly / Daily Structural Swings**: Primary institutional supply/demand battlegrounds.\n2. **Major Round Handles (`$100` & `$50` steps)**: e.g., `$2,500`, `$2,550`, `$2,600`, `$2,650`, `$2,700`. Heavy options strikes and resting orders gather near `$50`/`$100` zones (treat them as `$5–$12` wide zones, never single-cent lines!).\n3. **Previous Day High/Low (PDH/PDL) & Asian High/Low**: Objective intraday inflection points.\n\n**Patience**: Gold frequently pokes `$3–$8` beyond an obvious high before snapping back inside—waiting for H1/M15 candle close back inside or retest protects against wick traps.',
        demonstration:
          '1. Review the simulated XAU/USD Chart Structure diagram highlighting `$2,600` psychological zone, PDH sweep & MSS reversal, and break-and-retest continuation.',
        common_mistakes: [
          'Using tiny $1-wide lines on Gold when a $50 handle needs a broader reaction band.',
          'Ignoring Daily/Weekly structure while over-analyzing 1-minute wicks.',
        ],
        summary_recap:
          'Anchor Gold charts on Daily/Weekly structure, $50/$100 psychological bands, and objective PDH/PDL benchmarks.',
        practical_exercise: {
          title: 'XAU/USD Top-Down Map',
          objective: 'Build a clean uncluttered Gold chart map.',
          steps: [
            'Open XAU/USD Daily and mark the nearest major Weekly/Daily S&R zones and nearest $50/$100 handles.',
            'Drop to H1 and add only PDH/PDL—verify clean visual sightlines.',
          ],
          deliverable: 'Annotated clean Gold chart plan.',
        },
        visual_key: 'xauusd-chart-structure',
        duration_minutes: 16,
        tags: ['gold-structure', 'round-numbers', 'xauusd-levels'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-13-08-1',
            question: 'Which psychological price handles carry heightened institutional options and order focus on Gold?',
            options: ['Major $50 and $100 increments (e.g., $2,500, $2,550, $2,600)', 'Every $0.37 increment', 'Odd cents like .13', 'Random decimals'],
            correct_index: 0,
            explanation: 'Large round dollar levels concentrate options strikes, media focus, and resting orders.',
          },
          {
            id: 'q-13-08-2',
            question: 'Why treat a level like $2,600 on Gold as a $5–$10 reaction zone rather than a 1-cent razor line?',
            options: [
              'Gold’s larger tick volatility creates $3–$8 overshoots and undershoots around major benchmarks',
              'Charts cannot display single cents',
              'Brokers ban horizontal lines on Gold',
              'Zones double profit automatically',
            ],
            correct_index: 0,
            explanation: 'Realistic zone width respects Gold’s natural wick dispersion.',
          },
          {
            id: 'q-13-08-3',
            question: 'What helps avoid Gold’s frequent $4–$6 stop-hunt wicks above PDH?',
            options: [
              'Waiting for H1/M15 candle close confirmation beyond or back inside the level before entering',
              'Entering instantly on tick touches',
              'Trading on 1-second charts',
              'Removing stop-losses',
            ],
            correct_index: 0,
            explanation: 'Close confirmation keeps you out of intrabar spike traps.',
          },
        ],
      },
      {
        id: 'lesson-13-09',
        title: 'News Risk and Spread Widening on Gold',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Prepare specifically for extreme XAU/USD spread explosions and slippage during U.S. CPI, NFP, PCE, and FOMC events.',
        learning_objective: 'Protect open Gold trades or flatten proactively around Tier-1 US macro calendars.',
        introduction:
          'Because Gold reacts instantaneously to U.S. interest-rate expectations and dollar swings, U.S. macro releases turn XAU/USD into one of the fastest-moving instruments on earth.',
        content:
          '### Gold’s Highest-Impact Macro Releases\n1. **FOMC Rate Decisions & Press Conferences** (extreme two-way whipsaws common as statement vs. Powell Q&A shift!).\n2. **U.S. CPI & Core PCE Inflation** (directly shifts Fed & real-yield pricing).\n3. **Non-Farm Payrolls (NFP) & Unemployment**.\n\n### News Survival Tactics on Gold\n- Spreads routinely jump from `~$0.20` to `$1.50–$4.00+` for seconds during release!\n- Tight intraday stops slip severely.\n- **Stand-Aside Window**: Close or avoid new intraday positions 15–30 minutes ahead of Red USD events and wait 15–30 minutes *after* until spreads return to normal and H1 candles reveal real direction.',
        demonstration:
          '1. Illustrate a classic FOMC double-whip on Gold: Statement triggers an instant `+$22` spike (`14:00 ET`), Powell Q&A reverses Gold `-$38` (`14:35 ET`), stopping both sides before settling trend—showing why patience beats pre-news guessing.',
        common_mistakes: [
          'Leaving tight intraday Gold stops open across CPI expecting clean fills at exact ticket prices.',
          'Thinking the first 60-second spike after FOMC statement always defines the rest of the day.',
        ],
        summary_recap:
          'U.S. Fed, CPI, PCE, and NFP prints produce extreme Gold spreads and two-way reversals—stand aside until liquidity stabilizes.',
        practical_exercise: {
          title: 'Monthly US-Gold Event Audit',
          objective: 'Spot high-hazard macro days ahead of time.',
          steps: [
            'Open the MeridianFX Economic Calendar and highlight this month’s USD High-Impact CPI, NFP, and FOMC dates.',
            'Mark your 30-minute blackout windows directly on your Gold study plan.',
          ],
          deliverable: 'Monthly Gold Macro Blackout Calendar.',
        },
        visual_key: 'execution-costs-slippage',
        duration_minutes: 15,
        tags: ['gold-news', 'cpi', 'fomc', 'spread-widening'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.FED_MONETARY],
        quiz: [
          {
            id: 'q-13-09-1',
            question: 'Which macro category drives the sharpest routine intraday Gold volatility spikes?',
            options: [
              'U.S. Federal Reserve (FOMC) decisions, U.S. CPI/PCE inflation data, and U.S. NFP employment reports',
              'Swiss retail sales only',
              'New Zealand milk auctions',
              'Canadian holiday openings',
            ],
            correct_index: 0,
            explanation: 'U.S. inflation, employment, and Fed policy directly reprice US real yields and USD simultaneously.',
          },
          {
            id: 'q-13-09-2',
            question: 'Why does the FOMC press conference (30 minutes after statement release) frequently trap premature Gold traders?',
            options: [
              'Nuanced comments from the Fed Chair routinely reverse the initial 14:00 ET algorithmic spike',
              'Markets close during Q&A',
              'Spreads turn negative',
              'Gold prices freeze during speeches',
            ],
            correct_index: 0,
            explanation: 'Forward guidance Q&A frequently changes rate expectations beyond the headline statement.',
          },
          {
            id: 'q-13-09-3',
            question: 'What happens to a tight $4.00 Gold stop during an instant $20.00 CPI price gap?',
            options: [
              'It can slip substantially past $4.00 and fill at the next available post-gap market price',
              'It guarantees $4.00 max loss in all scenarios',
              'It moves back to break-even automatically',
              'It cancels itself with $0 loss',
            ],
            correct_index: 0,
            explanation: 'Standard stop orders suffer slippage whenever markets gap cleanly past trigger levels.',
          },
        ],
      },
      {
        id: 'lesson-13-10',
        title: 'Position Sizing for Gold and Stop-Distance Selection',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Combine ATR-realistic Gold stop distances with exact ounce-based lot calculations so Gold never blows your risk budget.',
        learning_objective: 'Scale XAU/USD stop distances safely for volatility while shrinking lot sizes proportionally to cap account risk at ≤1%.',
        introduction:
          'Gold does not blow accounts because it is "untradable"—it blows accounts because traders refuse to shrink lot size when stops widen to fit Gold’s realistic swing size.',
        content:
          '### Gold Sizing Blueprint\n1. **Pick Structural + ATR Stop First**: Suppose H4 swing support sits `$18.00` below a clean entry (`e.g., $2,640 entry / $2,622 stop`, matching `~0.75 × Daily ATR`).\n2. **Determine Fixed Dollar Risk**: `$2,000` account at `0.5%` risk = `$10.00` max risk (or `$4,000` at `1%` = `$40.00`).\n3. **Solve Ounces (`Risk $ ÷ Stop $`)**: `$40.00 ÷ $18.00 = 2.22 troy oz` → round down to **`2 oz` (`0.02 lots` on standard 100-oz CFD)**!\n\n*Lesson*: If `$18` risk requires `0.02` lots and your account only supports `0.01` min lot (`$18` min risk on a `$500` account = `3.6%`), **Gold is currently too large for that small account on H4 swing stops—stick to demo or lower-volatility FX micros!**',
        demonstration:
          '1. Compare two accounts attempting a `$20` Gold swing stop: `$5,000` account (`1% = $50` → `0.02 lots` = `0.8%` risk, clean!) vs. `$300` account (`0.01` min lot = `$20` = `6.7%` risk on ONE trade—too small for swing Gold without fractional micro-gram contracts!).',
        common_mistakes: [
          'Forcing tiny `$3` stops on Gold just because your account is small—getting stopped out 10 times in a row by normal candle noise.',
          'Failing to check minimum lot increments (`0.01`) against account size.',
        ],
        summary_recap:
          'Size Gold by dividing Risk Dollars by Dollar Stop Distance (per oz); if minimum 0.01 lot exceeds your % risk limit for structural stops, stick to demo or lighter FX pairs.',
        practical_exercise: {
          title: 'Minimum-Account Gold Viability Test',
          objective: 'Test honestly whether a given account size supports safe structural Gold stops.',
          steps: [
            'Assume 1% max risk, 100 oz/lot contract, 0.01 minimum lot (1 oz), and a realistic $20.00 swing Gold stop.',
            'Calculate the minimum account balance needed so 0.01 lots ($20 risk) stays <= 1% risk (`$20 / 0.01 = $2,000`).',
          ],
          deliverable: 'Minimum viable Gold swing balance calculation.',
        },
        visual_key: 'xauusd-contract-specs',
        duration_minutes: 17,
        tags: ['gold-sizing', 'minimum-balance', 'atr-stops'],
        sources: [OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'q-13-10-1',
            question: 'Assuming 100 oz/lot and 0.01 minimum lot (1 oz), if your structural Gold stop is $25.00 and your max risk per trade is 1%, what minimum balance keeps 0.01 lots within 1% risk?',
            options: ['$2,500 USD', '$250 USD', '$500 USD', '$100 USD'],
            correct_index: 0,
            explanation: '1 oz × $25.00 = $25.00 minimum risk; for $25 to equal <=1% of equity, equity must be at least $2,500.',
          },
          {
            id: 'q-13-10-2',
            question: 'What mistake happens when a $300 account tries to force a 1% risk ($3) trade on Gold (0.01 min lot = 1 oz)?',
            options: [
              'Stop distance gets squeezed to $3.00, far smaller than routine hourly noise—causing constant premature stop-outs',
              'Win rate rises to 90%',
              'Spreads vanish',
              'Ounces shrink automatically',
            ],
            correct_index: 0,
            explanation: 'Forcing stops smaller than market noise guarantees repeated death-by-a-thousand-cuts losses.',
          },
          {
            id: 'q-13-10-3',
            question: 'With a $10,000 account, 0.5% risk ($50), and a $20.00 structural stop on standard 100-oz XAU/USD, what is the exact lot size rounded down?',
            options: ['0.02 lots (2 oz = $40 risk)', '0.20 lots', '0.50 lots', '1.00 lot'],
            correct_index: 0,
            explanation: '$50 ÷ $20 = 2.5 oz → round down to 0.02 lots (2 oz) = $40 risk (0.4%).',
          },
        ],
      },
      {
        id: 'lesson-13-11',
        title: 'Backtesting Gold-Specific Rules',
        category: 'Gold Trading (XAUUSD)',
        summary: 'Test Gold strategies specifically across Gold’s trending, range, high-inflation, and shock periods with honest spread/swap friction.',
        learning_objective: 'Run a dedicated Gold-only backtest sample accounting for wider spreads, larger gaps, and session behavior.',
        introduction:
          'A strategy tuned on EUR/USD behaves differently on XAU/USD. Gold’s sharper trends, deeper liquidity probes, and wider spreads require Gold-specific validation.',
        content:
          '### Gold Backtesting Essentials\n1. **Use Gold-Specific Cost Friction**: Model realistic spread (`~$0.20–$0.35`), rollover spread spikes, and overnight short/long swaps accurately.\n2. **Test Across Contrasting Gold Regimes**: Include sharp bull run periods, messy sideways consolidations (`months of chop!`), and sharp rate-hike selloffs.\n3. **Track Sweep Tendency**: Record whether immediate breakout entries vs. break-and-retest or post-sweep MSS perform noticeably cleaner on your tested Gold timeframe.\n4. **Sample Size & Honesty**: Aim for `100+` clean bar-by-bar occurrences with zero peeking forward and zero cherry-picking.',
        demonstration:
          '1. Compare two simulated Gold test logs across 60 trades: immediate breakout chasing suffers repeated fakeouts around PDH/round handles, while waiting for candle-close acceptance + retest cuts false triggers noticeably—always remembering past tests inform rules, never guarantee future returns.',
        common_mistakes: [
          'Assuming EUR/USD parameters work identically on XAU/USD without separate testing.',
          'Running Gold backtests assuming zero spread and zero overnight swap.',
        ],
        summary_recap:
          'Validate Gold setups exclusively on Gold history across multiple regimes, factoring realistic Gold spreads, sweeps, and swaps.',
        practical_exercise: {
          title: '20-Setup Gold Historical Audit',
          objective: 'Evaluate Gold’s specific reaction patterns honestly via replay.',
          steps: [
            'Replay 20 occurrences of Gold breaking or sweeping PDH/PDL around London/NY open.',
            'Log how many followed through directly vs. swept and reversed vs. paused to retest.',
          ],
          deliverable: '20-sample Gold PDH/PDL behavior table.',
        },
        visual_key: 'xauusd-chart-structure',
        duration_minutes: 18,
        tags: ['gold-backtesting', 'validation', 'regime-testing'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'q-13-11-1',
            question: 'Why can you NOT blindly assume a profitable EUR/USD strategy performs identically on XAU/USD?',
            options: [
              'Gold has higher daily volatility, sharper wick sweeps, different session peaks, and unique spread/swap friction requiring separate testing',
              'Gold does not use candlesticks',
              'Brokers block tested strategies on Gold',
              'Indicators invert on commodities',
            ],
            correct_index: 0,
            explanation: 'Instrument microstructure and macro drivers differ substantially between FX pairs and Gold.',
          },
          {
            id: 'q-13-11-2',
            question: 'Which historical period should ALWAYS be included alongside bull trends when backtesting Gold?',
            options: [
              'Messy multi-month sideways Gold consolidations and sharp rate-driven pullbacks',
              'Only the single best rally month of the decade',
              'Weekends only',
              'Holiday weeks only',
            ],
            correct_index: 0,
            explanation: 'Sideways Gold ranges expose whether a system survives chop without bleeding out.',
          },
          {
            id: 'q-13-11-3',
            question: 'Does a positive 100-trade Gold backtest guarantee identical live profits next month?',
            options: [
              'No—backtesting helps calibrate discipline and realistic drawdown expectations, never guarantees future markets',
              'Yes, guaranteed 100%',
              'Only on H1 charts',
              'Yes if spread is ignored',
            ],
            correct_index: 0,
            explanation: 'Live markets evolve and involve execution psychology and unexpected macro shifts.',
          },
        ],
      },
    ],
  },
];
