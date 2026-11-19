import { OFFICIAL_SOURCES, type CurriculumCourseSeed } from './types.ts';

export const COURSE_14_CRYPTO: CurriculumCourseSeed = {
  id: 'course-14-crypto-trading',
  slug: 'cryptocurrency-trading',
  course_number: 14,
  title: '14. Cryptocurrency Trading',
  category: 'Cryptocurrency Trading',
  level: 'Advanced',
  level_label: 'Advanced',
  description:
    'Master digital-asset markets safely and honestly: blockchain fundamentals, Bitcoin vs. Ether vs. altcoins vs. stablecoins, market cap & order-book liquidity, spot vs. margin/futures/perpetuals, funding rates & liquidations, 24/7 volatility, exchange counterparty risk, custody & seed security, gas/finality, protocol/depeg risks, crypto market cycles, and scam defence.',
  prerequisites: 'Courses 01–12 recommended. High-volatility risk warning applies throughout.',
  learning_outcomes: [
    'Clearly separate unleveraged spot ownership from high-risk margin, futures, and perpetual swap contracts.',
    'Explain funding rates, basis, order-book depth, and cascading liquidation mechanics.',
    'Audit exchange counterparty risks, private-key/hardware custody security, and never share seed phrases.',
    'Identify token dilution, smart-contract exploits, stablecoin depeg risks, and common crypto phishing/rug-pull scams.',
  ],
  estimated_hours: 4.5,
  cover_image_url: '/src/assets/images/hero_trading_desk_1795085837463.jpg',
  assessment: [
    {
      id: 'c14-a1',
      question: 'What is the fundamental risk difference between holding 100% unleveraged Spot Bitcoin vs. trading a 10× leveraged Perpetual Swap contract?',
      options: [
        'Spot owns the underlying asset without liquidation price risk (though spot can still fall sharply), whereas a 10× perp risks forced liquidation on roughly a <10% adverse swing plus ongoing funding fees',
        'Perpetual swaps pay zero fees and cannot liquidate',
        'Spot automatically earns 50% APY safely',
        'They carry identical risk',
      ],
      correct_index: 0,
      explanation: 'Leverage on volatile 24/7 perpetual contracts introduces rapid forced liquidation before price can recover.',
    },
    {
      id: 'c14-a2',
      question: 'If an exchange collapses or freezes withdrawals (counterparty insolvency), which crypto holders face immediate asset loss/freeze risk?',
      options: [
        'Users leaving coins sitting inside custodial exchange accounts rather than self-custody wallets',
        'Holders storing private keys offline in verified cold hardware wallets',
        'Anyone reading blockchain explorers',
        'Bitcoin miners only',
      ],
      correct_index: 0,
      explanation: 'On centralized exchanges, you hold an IOU subject to exchange solvency—not direct on-chain control.',
    },
    {
      id: 'c14-a3',
      question: 'When a legitimate customer-support agent asks for your 12-word or 24-word recovery seed phrase to "fix a stuck transaction," what is happening?',
      options: [
        'A 100% scam—no legitimate wallet provider, exchange, or support agent will EVER ask for your seed phrase',
        'Routine regulatory KYC verification',
        'Normal gas fee calibration',
        'Hardware firmware updating',
      ],
      correct_index: 0,
      explanation: 'Anyone possessing your seed phrase owns every asset across that wallet irreversibly.',
    },
    {
      id: 'c14-a4',
      question: 'Why can a token with a "cheap $0.001 coin price" actually be massively inflated or risky compared to Bitcoin?',
      options: [
        'Unit price means nothing without Circulating Supply and Fully Diluted Valuation (FDV)—billions/trillions of tokens or massive upcoming insider unlocks create heavy supply overhang',
        'Cheap coins cannot fall below $0.001',
        'Low unit price guarantees a 100× rally',
        'Small prices have deeper liquidity',
      ],
      correct_index: 0,
      explanation: 'Market capitalization = Price × Circulating Supply; unit price alone misleads beginners.',
    },
    {
      id: 'c14-a5',
      question: 'What does a sharply positive Perpetual Futures Funding Rate indicate?',
      options: [
        'Perpetual contracts trade above spot price and leveraged LONG traders are periodically paying SHORT holders—warning of crowded bullish positioning',
        'Exchanges are shutting down',
        'Short sellers are paying long holders',
        'Zero volatility ahead',
      ],
      correct_index: 0,
      explanation: 'Positive funding incentives shorts and penalizes crowded leveraged longs to anchor perps near spot.',
    },
  ],
  lessons: [
    {
      id: 'lesson-14-01',
      title: 'Blockchain and Crypto Asset Basics',
      category: 'Cryptocurrency Trading',
      summary: 'Understand distributed ledgers, public/private keys, consensus (PoW vs. PoS), and why digital assets trade very differently from fiat FX.',
      learning_objective: 'Explain how public blockchains verify transactions without a central clearinghouse and why crypto carries extreme volatility and security responsibilities.',
      introduction:
        'Unlike Forex pairs issued and backstopped by sovereign central banks, cryptocurrencies settle on decentralized software networks using cryptography. Understanding the plumbing keeps you safe.',
      content:
        '### Core Mechanics\n- **Blockchain**: A shared, append-only public ledger maintained across thousands of independent nodes.\n- **Consensus**: Bitcoin uses **Proof of Work (PoW)** (miners); Ethereum uses **Proof of Stake (PoS)** (staked validators).\n- **Cryptographic Keys**: Public addresses receive funds (like an email address); **private keys** authorize transfers irreversibly.\n\n**Crucial Contrast vs. Forex**: Bank wires or credit cards have dispute/chargeback desks. On-chain crypto transfers are **irreversible**—send to a scammer or wrong network and nobody can reverse it.',
      demonstration:
        '1. Review the Blockchain & Key Flow diagram showing Transaction Signed Locally (Private Key) → Broadcast to Nodes → Validated in Block → Irreversible Settlement.',
      common_mistakes: [
        'Assuming crypto works like a traditional bank with customer-service reversals.',
        'Buying obscure tokens without understanding whether a real network exists.',
      ],
      summary_recap:
        'Blockchains verify transfers cryptographically without central chargeback desks—requiring strict personal security and higher risk humility.',
      practical_exercise: {
        title: 'Blockchain Explorer Literacy',
        objective: 'Learn to read public transparent on-chain data safely without touching private keys.',
        steps: [
          'Identify the difference between a public transaction hash/address and a secret private key.',
          'List 3 irreversible consequences of broadcasting an incorrect on-chain transfer.',
        ],
        deliverable: 'Public vs. Private key security summary.',
      },
      visual_key: 'crypto-blockchain-basics',
      duration_minutes: 15,
      tags: ['blockchain', 'crypto-basics', 'settlement'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FINRA_EDU],
      quiz: [
        {
          id: 'q-14-01-1',
          question: 'Can a typical confirmed Bitcoin or Ethereum blockchain transfer be reversed by calling customer support?',
          options: [
            'No—confirmed on-chain transactions are generally irreversible without recipient cooperation',
            'Yes within 30 days like a credit card',
            'Yes by contacting the BIS',
            'Yes on Tuesdays',
          ],
          correct_index: 0,
          explanation: 'Decentralized settlement has no chargeback desk; verification before clicking send is vital.',
        },
        {
          id: 'q-14-01-2',
          question: 'What is safe to share publicly when someone wants to send you crypto?',
          options: [
            'Your Public Wallet Receiving Address (after verifying exact network)',
            'Your 12-word recovery seed phrase',
            'Your raw Private Key',
            'Your hardware PIN',
          ],
          correct_index: 0,
          explanation: 'Public addresses only permit deposits; private keys and seed phrases control withdrawals.',
        },
        {
          id: 'q-14-01-3',
          question: 'Why does Proof of Work differ from Proof of Stake?',
          options: [
            'PoW relies on computational energy/miners while PoS secures consensus via staked validator collateral',
            'PoW guarantees fixed token prices',
            'PoS eliminates market risk',
            'Both are controlled by one commercial bank',
          ],
          correct_index: 0,
          explanation: 'Consensus models define how blocks are proposed, verified, and incentivized.',
        },
      ],
    },
    {
      id: 'lesson-14-02',
      title: 'Bitcoin, Ether, Altcoins, and Stablecoins',
      category: 'Cryptocurrency Trading',
      summary: 'Categorize digital assets cleanly across BTC, ETH, higher-beta altcoins, and pegged stablecoins—recognizing sharp risk differences.',
      learning_objective: 'Differentiate Bitcoin, Ether, altcoins, and stablecoin designs (fiat-backed vs. crypto/algorithmic) along the risk spectrum.',
      introduction:
        'Treating Bitcoin and a 2-week-old micro-cap memecoin as the same asset class is a classic mistake. Risk, liquidity, and failure odds jump orders of magnitude down the cap curve.',
      content:
        '### Four Asset Tiers\n1. **Bitcoin (`BTC`)**: Largest crypto by market cap; deep global liquidity; fixed 21M supply schedule; often viewed as the sector’s primary macro benchmark.\n2. **Ether (`ETH`)**: Native asset of Ethereum smart-contract network paying transaction fees (`gas`) and staking security.\n3. **Altcoins**: Layer-1 rivals, DeFi tokens, gaming/AI tokens, and memecoins—extreme volatility, thin order books, high failure/dilution rates (`80%–99%` drawdowns common!).\n4. **Stablecoins (`USDC`, `USDT`, etc.)**: Tokens designed to track `$1.00 USD` via reserve assets (`Treasury bills/cash`), crypto over-collateralization, or risky algorithmic mechanisms—**not insured like bank deposits**.',
      demonstration:
        '1. Review the Crypto Risk Spectrum comparing BTC/ETH spot depth against thin small-cap altcoins where single whale orders crash prices 35% in minutes.',
      common_mistakes: [
        'Assuming "$1.00 stablecoins" carry zero default or depeg risk.',
        'Loading oversized positions into illiquid micro-cap altcoins expecting easy 10× gains.',
      ],
      summary_recap:
        'BTC and ETH carry deep market structure compared to fragile altcoins; even stablecoins carry reserve, issuer, and depeg risks.',
      practical_exercise: {
        title: 'Asset Tier Risk Audit',
        objective: 'Classify assets strictly by liquidity and structural risk.',
        steps: [
          'Compare BTC, ETH, one large altcoin, and a USD stablecoin across: (a) daily volatility, (b) dilution/supply schedule, and (c) issuer/smart-contract dependency.',
        ],
        deliverable: '4-asset crypto risk classification matrix.',
      },
      visual_key: 'crypto-blockchain-basics',
      duration_minutes: 16,
      tags: ['bitcoin', 'ethereum', 'altcoins', 'stablecoins'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FINRA_EDU],
      quiz: [
        {
          id: 'q-14-02-1',
          question: 'Why are major USD stablecoins NOT identical to FDIC/FSCS-insured bank checking deposits?',
          options: [
            'They rely on private issuer reserve quality, custodial banking partners, smart-contract code, or collateral mechanisms that can suffer depegs or redemptions freezes',
            'Stablecoins cannot be transferred on weekends',
            'Stablecoins pay central bank policy rates directly',
            'They fluctuate by 50% daily normally',
          ],
          correct_index: 0,
          explanation: 'Historical depegs proved stablecoins carry real reserve, banking, and structural risks.',
        },
        {
          id: 'q-14-02-2',
          question: 'Compared to BTC and ETH, small-cap altcoins generally carry:',
          options: [
            'Much thinner liquidity, severe slippage, heavy token unlock dilution, and drastic drawdown risk',
            'Lower volatility and higher certainty',
            'Central bank protection',
            'Zero counterparty risk',
          ],
          correct_index: 0,
          explanation: 'Micro/mid-cap altcoins routinely plunge 80%–95%+ during bear markets.',
        },
        {
          id: 'q-14-02-3',
          question: 'What primary role does Ether (ETH) serve inside the Ethereum ecosystem?',
          options: [
            'Native asset used for network transaction fees (gas) and validator staking security',
            'Sovereign European currency',
            'Zero-fee bank card',
            'Fixed-rate government bond',
          ],
          correct_index: 0,
          explanation: 'ETH fuels blockspace computation and Proof-of-Stake security.',
        },
      ],
    },
    {
      id: 'lesson-14-03',
      title: 'Market Capitalisation, Liquidity, and Order Books',
      category: 'Cryptocurrency Trading',
      summary: 'Read order-book bid/ask depth, circulating vs. fully diluted valuation (FDV), and why thin order books cause vicious slippage.',
      learning_objective: 'Distinguish Circulating Market Cap from FDV and inspect order-book depth before trading.',
      introduction:
        'Seeing a token up "+40%" on thin $50,000 order-book depth hides a brutal truth: trying to sell $20,000 collapses the price 15% immediately.',
      content:
        '### Key Valuation & Depth Metrics\n- **Circulating Market Cap**: `Current Price × Actively Circulating Tokens`.\n- **Fully Diluted Valuation (FDV)**: `Current Price × Total Max Supply` (including locked VC/team/emission tokens!). If Circulating Cap is `$50M` while FDV is `$2 Billion`, massive supply unlocks sit poised to dilute holders!\n- **Order-Book Liquidity**: Check `±2%` depth on reliable venues—not fake wash-traded 24h volume numbers.\n\nWide bid-ask spreads and thin order books amplify slippage on market orders and stop-losses drastically.',
      demonstration:
        '1. Review the Crypto Order-Book Depth diagram contrasting deep BTC/USD `±2%` book liquidity (`millions resting per level`) vs. a fragile altcoin book (`gaps of 1%–3% between thin bids`) where market stops suffer devastating slippage.',
      common_mistakes: [
        'Confusing "low coin price ($0.05)" with "cheap valuation."',
        'Ignoring massive upcoming insider token unlocks (`low float / high FDV`).',
      ],
      summary_recap:
        'Always evaluate Market Cap vs. FDV (upcoming dilution) and genuine order-book depth rather than headline token price or flashy volume.',
      practical_exercise: {
        title: 'FDV Dilution Check',
        objective: 'Avoid high-FDV supply overhang traps.',
        steps: [
          'Calculate Circulating Cap (`Price × Circulating`) vs. FDV (`Price × Max Supply`) for an illustrative project with 10% circulating supply.',
          'Note how much new capital must enter merely to keep price flat as the other 90% unlocks.',
        ],
        deliverable: 'Circulating vs. FDV dilution worksheet.',
      },
      visual_key: 'crypto-orderbook-liquidity',
      duration_minutes: 16,
      tags: ['market-cap', 'fdv', 'order-book', 'liquidity'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.CME_EDU],
      quiz: [
        {
          id: 'q-14-03-1',
          question: 'Token X costs $0.10 with 10 billion circulating supply ($1B Cap). Token Y costs $20.00 with 10 million supply ($200M Cap). Which has the LARGER market capitalization?',
          options: ['Token X ($1 Billion Cap > $200 Million)', 'Token Y ($20 > $0.10)', 'They are equal', 'Cannot tell'],
          correct_index: 0,
          explanation: 'Unit price without supply is meaningless; Token X is 5× larger by total capitalization.',
        },
        {
          id: 'q-14-03-2',
          question: 'What does a huge gap between Circulating Market Cap ($100M) and Fully Diluted Valuation ($2.5B) warn about?',
          options: [
            'Massive locked supply (96%) remains unissued and could create heavy ongoing sell pressure as tokens unlock',
            'Supply is permanently maxed out',
            'Liquidity is guaranteed forever',
            'Zero dilution ahead',
          ],
          correct_index: 0,
          explanation: 'Low-float / high-FDV schedules dilute existing buyers steadily during unlock waves.',
        },
        {
          id: 'q-14-03-3',
          question: 'What risk occurs when placing market orders or stop-losses in a thin crypto order book?',
          options: [
            'Severe execution slippage slicing quickly across empty price levels',
            'Zero spread bonus',
            'Guaranteed fill at mid-price',
            'Automatic fee refund',
          ],
          correct_index: 0,
          explanation: 'Thin order books force market/stop orders to walk down levels at steeply worse prices.',
        },
      ],
    },
    {
      id: 'lesson-14-04',
      title: 'Spot vs. Margin, Futures, and Perpetual Swaps',
      category: 'Cryptocurrency Trading',
      summary: 'Contrast unleveraged Spot ownership against leveraged Margin, Dated Futures, and Perpetual Swap derivatives.',
      learning_objective: 'Understand exact structural differences, margin types (isolated vs. cross), and liquidation risks across spot and crypto derivatives.',
      introduction:
        'Beginners frequently wander onto perpetual futures screens thinking they are simply buying Bitcoin—accidentally exposing themselves to leverage and liquidation.',
      content:
        '### Four Instrument Types\n1. **Spot**: Outright asset purchase (`1×`). Zero liquidation risk (`unless selling`), zero ongoing funding fees.\n2. **Margin**: Borrowing exchange funds against collateral (`2×–5×+`) to buy/short spot—accruing hourly borrow interest + liquidation risk.\n3. **Dated Futures**: Standardized contracts expiring on a set calendar date (`basis convergence`).\n4. **Perpetual Swaps ("Perps")**: Crypto derivatives with **no expiration date**, kept tethered to spot via periodic **Funding Rates**.\n\n**Isolated vs. Cross Margin**: Isolated caps margin loss strictly to that single trade’s allocated collateral; **Cross Margin** exposes your *entire derivatives wallet balance* to a single runaway loss!',
      demonstration:
        '1. Review the Spot vs. Perps diagram comparing `1× Spot` surviving a sharp `-30%` crypto flash wick vs. `10× Leveraged Perp` getting liquidated completely (`-100%` of margin lost) before price bounces back!',
      common_mistakes: [
        'Using Cross Margin recklessly without hard stop-losses (risking entire derivatives wallet).',
        'Trading 20×–50× leverage where a routine 2%–4% crypto wiggle triggers instant liquidation.',
      ],
      summary_recap:
        'Spot owns assets cleanly without liquidation; leveraged perps and cross-margin carry acute liquidation risk during routine crypto volatility.',
      practical_exercise: {
        title: 'Spot vs. Perp Risk Comparison',
        objective: 'Calculate liquidation vulnerability at different leverage levels.',
        steps: [
          'Compare approximate adverse drop causing liquidation at 2×, 5×, 10×, and 25× leverage.',
          'Note against Bitcoin’s typical weekly volatility why beginners should avoid high leverage entirely.',
        ],
        deliverable: 'Leverage liquidation sensitivity table.',
      },
      visual_key: 'crypto-spot-vs-perps',
      duration_minutes: 18,
      tags: ['spot', 'perpetuals', 'futures', 'isolated-margin'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.CFTC_FX],
      quiz: [
        {
          id: 'q-14-04-1',
          question: 'Why does Cross Margin pose higher total-account peril than Isolated Margin if a stop fails or is omitted?',
          options: [
            'Cross Margin drains your entire eligible derivatives wallet balance to defend one losing position before liquidating everything',
            'Isolated Margin shares funds across all trades',
            'Cross Margin pays zero fees',
            'Isolated Margin triples leverage automatically',
          ],
          correct_index: 0,
          explanation: 'Isolated limits collateral exposure per position; Cross exposes shared wallet equity.',
        },
        {
          id: 'q-14-04-2',
          question: 'With 20× leverage on a crypto perpetual contract, roughly what adverse move (including fees) triggers forced liquidation?',
          options: ['Roughly ~4.5%–5% (a totally routine single-hour crypto swing!)', '50%', '95%', '0.01%'],
          correct_index: 0,
          explanation: 'High leverage leaves zero room for ordinary crypto wicks.',
        },
        {
          id: 'q-14-04-3',
          question: 'Which product lets you hold Bitcoin 1:1 without periodic funding fees or margin liquidation risk?',
          options: ['Unleveraged Spot purchase', '50× Perpetual Swap', '10× Cross Margin', 'Daily binary options'],
          correct_index: 0,
          explanation: 'Spot trading involves 100% upfront cash/asset exchange with no debt or liquidation price.',
        },
      ],
    },
    {
      id: 'lesson-14-05',
      title: 'Funding Rates, Basis, and Liquidation',
      category: 'Cryptocurrency Trading',
      summary: 'Read perpetual funding rates and futures basis as sentiment gauges and understand why cascading liquidations trigger brutal flash wicks.',
      learning_objective: 'Explain how funding rates tether perpetual contracts to spot and how forced liquidation cascades drive violent spikes.',
      introduction:
        'Why does crypto suddenly flash-crash 12% in four minutes and bounce half of it back inside ten minutes? Often it is not news—it is a leveraged liquidation cascade.',
      content:
        '### Funding & Liquidation Mechanics\n- **Funding Rate**: Periodic payment (commonly every 8 hours) exchanged directly between longs and shorts (not the exchange):\n  - **Positive Funding**: Perp trades above Spot → Longs pay Shorts.\n  - **Negative Funding**: Perp trades below Spot → Shorts pay Longs.\n- **Basis**: Difference between dated futures price and spot price (positive in contango).\n- **Liquidation Cascades**: When crowded `10×–50×` longs get pushed down to their liquidation price, the exchange engine fires automatic **forced market sells**—pushing price lower into the *next* tier of long liquidations in a domino avalanche!',
      demonstration:
        '1. Follow the Liquidation Cascade step-by-step on the Spot-vs-Perps visual: Crowded Long Open Interest + High Positive Funding → Dip triggers Tier-1 Long Forced Market Sells → Price cascades violently through thin bids → Exhaustion bounce.',
      common_mistakes: [
        'Holding long perp positions for months while paying steep positive funding rates (quietly bleeding capital).',
        'Using tight stops right inside obvious crowded liquidation clusters.',
      ],
      summary_recap:
        'Extreme funding exposes crowded leverage; cascading forced liquidations create violent wicks—stay conservatively sized with wide breathing room.',
      practical_exercise: {
        title: 'Funding Drag Calculation',
        objective: 'See how high positive funding eats into long perp holding returns.',
        steps: [
          'Suppose a perp charges +0.05% funding every 8 hours (3 times/day = +0.15%/day).',
          'Multiply over 30 days (`+4.5%` on full *notional* size!) and note the difference between 1× spot ($0 funding) vs. holding leveraged perps.',
        ],
        deliverable: '30-day perp funding cost calculation.',
      },
      visual_key: 'crypto-spot-vs-perps',
      duration_minutes: 17,
      tags: ['funding-rates', 'basis', 'liquidation-cascade'],
      sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.CFTC_FX],
      quiz: [
        {
          id: 'q-14-05-1',
          question: 'When Perpetual Funding Rates turn sharply POSITIVE, who pays whom?',
          options: [
            'Long position holders periodically pay Short position holders',
            'Short holders pay Long holders',
            'Exchanges pay both sides bonuses',
            'Nobody pays anything',
          ],
          correct_index: 0,
          explanation: 'Positive funding discourages excess long leverage and incentivizes arbitrage shorts to align perp and spot prices.',
        },
        {
          id: 'q-14-05-2',
          question: 'Why do crypto flash crashes often accelerate abruptly before snapping partway back?',
          options: [
            'Forced automatic liquidation market-sell orders cascade through leveraged tiers until excess leverage clears out',
            'Blockchains turn off for 10 minutes',
            'Central banks intervene instantly',
            'Spot buyers are banned',
          ],
          correct_index: 0,
          explanation: 'Forced liquidation engines dump market orders regardless of order-book depth.',
        },
        {
          id: 'q-14-05-3',
          question: 'Funding payments on leveraged positions apply to your:',
          options: [
            'Total Notional Position Value (including borrowed leverage), not merely your initial margin deposit',
            'Initial margin divided by 10',
            'Bank savings balance',
            'Commission rebate only',
          ],
          correct_index: 0,
          explanation: 'On a 10× position, a 0.05% funding rate equals 0.50% of your posted margin per period!',
        },
      ],
    },
    {
      id: 'lesson-14-06',
      title: 'Volatility, Gaps, and 24/7 Trading',
      category: 'Cryptocurrency Trading',
      summary: 'Adapt risk management and sleep sanity to a market that never closes—including thin weekend moves and CME futures gaps.',
      learning_objective: 'Manage 24/7 crypto volatility without burnout while respecting weekend liquidity dips and Monday CME gaps.',
      introduction:
        'Forex pauses Friday evening to Sunday evening. Crypto runs 24 hours a day, 365 days a year—including Christmas morning and 3:00 AM Sunday.',
      content:
        '### 24/7 Market Peculiarities\n- **Weekend Liquidity Dip**: Institutional desks and Spot ETF flows operate primarily Mon–Fri business hours. Saturday/Sunday books are noticeably thinner, making weekend moves choppy and prone to sudden spikes.\n- **CME Bitcoin Futures Gaps**: Institutional CME crypto futures close Friday afternoon and reopen Sunday evening (`ET`). If spot crypto runs sharply over the weekend, a visible **CME Futures Gap** appears on Sunday open.\n- **Burnout Trap**: Checking prices at 3 AM ruins judgment! Trade **Higher Timeframes (H4/Daily)** with server-side limit/stop brackets so you sleep undisturbed.',
      demonstration:
        '1. Compare healthy H4/Daily crypto swing workflow (morning & evening checks + server SL/TP) vs. sleep-deprived 24/7 staring at M5 charts.',
      common_mistakes: [
        'Never sleeping cleanly because crypto stays open 24/7.',
        'Confusing thin Saturday breakout wicks with institutional weekday participation.',
      ],
      summary_recap:
        'Respect thinner weekend liquidity, watch Weekday institutional hours, and use higher timeframes + hard server brackets to protect sleep and sanity.',
      practical_exercise: {
        title: '24/7 Boundary Schedule',
        objective: 'Protect personal sleep in an always-open market.',
        steps: [
          'Define fixed screen-off hours every night and weekend despite 24/7 market availability.',
          'Confirm server-side SL/TP rules cover all overnight hours.',
        ],
        deliverable: 'Written 24/7 Crypto Screen-Off Schedule.',
      },
      visual_key: 'crypto-orderbook-liquidity',
      duration_minutes: 14,
      tags: ['24-7-markets', 'weekend-liquidity', 'cme-gaps'],
      sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.SEC_CRYPTO],
      quiz: [
        {
          id: 'q-14-06-1',
          question: 'Why are weekend cryptocurrency breakouts often choppier or prone to whipsaws than weekday moves?',
          options: [
            'Institutional desks, Spot ETFs, and traditional market makers scale down over weekends, thinning order-book depth',
            'Blockchains slow down intentionally on Saturdays',
            'Bitcoin fees double every Sunday',
            'Charts switch to 10-minute bars',
          ],
          correct_index: 0,
          explanation: 'Thinner weekend books amplify erratic moves on smaller order flow.',
        },
        {
          id: 'q-14-06-2',
          question: 'What creates a "CME Bitcoin Futures Gap" on Sunday evening?',
          options: [
            'Spot crypto continues trading 24/7 while regulated CME futures pause from Friday close until Sunday open',
            'Miners stop mining on Saturdays',
            'Exchanges delete Friday candles',
            'Smart contracts freeze every weekend',
          ],
          correct_index: 0,
          explanation: 'Price movement on 24/7 spot exchanges over the weekend creates a gap when CME futures reopen.',
        },
        {
          id: 'q-14-06-3',
          question: 'How should traders protect sleep in a 24/7 market?',
          options: [
            'Keep risk strictly bounded with pre-placed server stop-losses and avoid micromanaging low timeframes overnight',
            'Set alarms every 30 minutes all night',
            'Trade 25× leverage before bed',
            'Leave zero stops on margin trades',
          ],
          correct_index: 0,
          explanation: 'Conservative sizing plus automated server stops allow healthy rest.',
        },
      ],
    },
    {
      id: 'lesson-14-07',
      title: 'Exchange Due Diligence and Counterparty Risk',
      category: 'Cryptocurrency Trading',
      summary: 'Evaluate exchanges critically after historic exchange failures—remembering "Not your keys, not your coins."',
      learning_objective: 'Conduct strict exchange due diligence and avoid parking idle long-term capital on unregulated custodial venues.',
      introduction:
        'History proved repeatedly—from Mt. Gox to FTX—that even massive, heavily marketed crypto exchanges can freeze withdrawals and lose customer funds overnight.',
      content:
        '### Counterparty Risk Checklist\n- **Regulatory Standing & Jurisdiction**: Is the venue licensed/registered transparently in reputable jurisdictions with segregated client rules, or operating behind opaque offshore shells?\n- **Proof of Reserves vs. Proof of Liabilities**: Snapshot reserve attestations mean far less without audited **liabilities** (what the exchange owes!).\n- **Capital Separation Rule**: Keep **only active trading margin** on an exchange; move long-term spot holdings promptly into verified self-custody hardware wallets.\n- Avoid "too-good-to-be-true" 15% APY "risk-free yield" custody promos—high yields almost always signal hidden counterparty/lending risk.',
      demonstration:
        '1. Review the Custody & Counterparty architecture diagram: Active Trading Capital (small capped % on vetted venue) vs. Long-Term Reserves (offline hardware self-custody).',
      common_mistakes: [
        'Leaving 100% of net worth sitting on one offshore derivatives exchange earning flashy promotional yield.',
        'Falling for fake clone exchange domains in search ads.',
      ],
      summary_recap:
        'Custodial exchanges introduce counterparty insolvency risk; vet jurisdictions strictly and keep long-term holdings off exchanges.',
      practical_exercise: {
        title: 'Exchange Safety Audit',
        objective: 'Apply due diligence criteria before depositing on any platform.',
        steps: [
          'List 4 concrete criteria you must verify (licensing jurisdiction, withdrawal history, security 2FA options, segregated terms) before funding an exchange.',
        ],
        deliverable: '4-point Exchange Counterparty Checklist.',
      },
      visual_key: 'crypto-custody-security',
      duration_minutes: 15,
      tags: ['counterparty-risk', 'exchanges', 'due-diligence'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.CFTC_FX],
      quiz: [
        {
          id: 'q-14-07-1',
          question: 'Why does an exchange publishing a "Proof of Reserves" wallet snapshot WITHOUT independently audited Liabilities remain incomplete?',
          options: [
            'Without knowing total customer obligations/debts owed, showing asset wallets alone cannot prove solvency',
            'Wallets cannot show Bitcoin balances',
            'Liabilities never exist on exchanges',
            'Reserves double weekly',
          ],
          correct_index: 0,
          explanation: 'Assets minus Liabilities determines solvency; reserves alone hide hidden debt.',
        },
        {
          id: 'q-14-07-2',
          question: 'Where should long-term un-traded crypto holdings ideally reside rather than sitting idle on an exchange?',
          options: [
            'In verified self-custody cold/hardware wallets backed up safely offline',
            'Inside a public browser text note',
            'On a brand-new promotional yield app paying 25% APY',
            'Inside an email draft',
          ],
          correct_index: 0,
          explanation: 'Self-custody removes exchange bankruptcy and withdrawal-freeze risk.',
        },
        {
          id: 'q-14-07-3',
          question: 'What is a classic warning sign of hidden counterparty risk on a crypto platform?',
          options: [
            'Promises of high "guaranteed" fixed APY yields on deposits with opaque lending strategies',
            'Requiring hardware 2FA security keys',
            'Transparent fee schedules',
            'Clear risk disclaimers',
          ],
          correct_index: 0,
          explanation: 'High fixed yields typically fund risky uncollateralized rehypothecation behind the scenes.',
        },
      ],
    },
    {
      id: 'lesson-14-08',
      title: 'Wallets, Custody, Private Keys, and Seed Phrases',
      category: 'Cryptocurrency Trading',
      summary: 'Master hot vs. cold custody, hardware wallets, offline paper/metal backups, and strict seed-phrase hygiene.',
      learning_objective: 'Set up and safeguard wallet keys cleanly without falling for digital backup leaks or hardware supply-chain tampering.',
      introduction:
        'Taking self-custody shifts bank-level responsibility onto your shoulders. Simple security habits protect holdings cleanly; sloppy digital backups destroy them.',
      content:
        '### Custody Layers\n- **Hot Wallets** (browser extensions / mobile apps): Private keys live on internet-connected devices—convenient for small active gas/DeFi amounts, vulnerable to malware and phishing.\n- **Cold / Hardware Wallets**: Keys remain isolated inside a dedicated offline chip that signs transactions physically on device.\n\n### Seed-Phrase Laws (12/24 Words)\n1. **Write physically on paper/stamped steel**—**NEVER** photograph it, save it in cloud notes, type it into websites, or email it to yourself!\n2. Buy hardware wallets strictly from official manufacturers directly (never second-hand or pre-initialized with a pre-printed seed card!).\n3. Always send a **tiny test transaction first** before moving meaningful sums.',
      demonstration:
        '1. Review the Crypto Custody visual comparing Hot Browser Wallet (daily pocket wallet) vs. Cold Hardware Vault + Offline Metal Seed Backup (never touching internet keyboards).',
      common_mistakes: [
        'Screenshotting your 24-word seed phrase and syncing it automatically to iCloud / Google Photos.',
        'Buying a hardware wallet from a third-party reseller with a scratch-off "already filled" seed card (guaranteed theft trap!).',
      ],
      summary_recap:
        'Keep daily pocket funds in hot wallets, meaningful holdings on genuine cold hardware devices, and seed phrases 100% offline forever.',
      practical_exercise: {
        title: 'Self-Custody Hygiene Check',
        objective: 'Audit personal habits against common key-loss errors.',
        steps: [
          'Verify whether you have an offline backup checklist: (a) No cloud photos of seeds, (b) Small test-send rule, (c) Official device sourcing only.',
        ],
        deliverable: 'Personal 5-Rule Custody Safety Checklist.',
      },
      visual_key: 'crypto-custody-security',
      duration_minutes: 16,
      tags: ['wallets', 'hardware-wallet', 'seed-phrase', 'custody'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FINRA_EDU],
      quiz: [
        {
          id: 'q-14-08-1',
          question: 'Why must you NEVER take a screenshot or store your 12/24-word recovery phrase in cloud drives or password managers synced online?',
          options: [
            'Any cloud breach, synced photo backup, or device malware exposes those words and lets attackers drain every wallet remotely',
            'Cloud drives scramble alphabetical order',
            'Exchanges ban digital photos',
            'Blockchains expire photos after 7 days',
          ],
          correct_index: 0,
          explanation: 'Offline physical storage eliminates remote internet theft surfaces.',
        },
        {
          id: 'q-14-08-2',
          question: 'If a brand-new hardware wallet arrives inside a box containing a pre-printed scratch-off seed phrase card ready for you to use, what is it?',
          options: [
            'A stolen/compromised scam trap—the attacker already recorded those words and waits for you to deposit funds!',
            'Helpful factory setup convenience',
            'Normal official customer onboarding',
            'Extra security insurance',
          ],
          correct_index: 0,
          explanation: 'Genuine hardware devices ALWAYS generate a fresh random seed directly on screen during setup.',
        },
        {
          id: 'q-14-08-3',
          question: 'What simple habit protects large on-chain transfers from typo or wrong-network errors?',
          options: [
            'Sending a tiny test amount first and confirming arrival before sending the remainder',
            'Sending the maximum amount immediately to save time',
            'Guessing network chains',
            'Turning off confirmation screens',
          ],
          correct_index: 0,
          explanation: 'Tiny test transfers cost minimal fees and prevent irreversible full-balance mistakes.',
        },
      ],
    },
    {
      id: 'lesson-14-09',
      title: 'Network Fees and Transaction Finality',
      category: 'Cryptocurrency Trading',
      summary: 'Navigate gas fees, Layer-2 networks, multi-chain address mismatches, and block confirmations safely.',
      learning_objective: 'Select matching deposit/withdrawal networks cleanly and understand fee congestion and probabilistic vs. economic finality.',
      introduction:
        'A surprisingly common beginner mistake is sending tokens over the wrong blockchain network—or getting stuck unable to move stablecoins because a wallet has zero native gas token.',
      content:
        '### Network & Gas Mechanics\n- **Native Gas Requirement**: Sending `USDC` on Ethereum requires `ETH` for gas; on Arbitrum/Base requires Layer-2 `ETH`; on Solana requires `SOL`.\n- **Network Matching Rule**: Sending funds on `Arbitrum` to an exchange deposit address listening strictly on `Ethereum Mainnet` (or picking `TRC20` vs `ERC20` mismatch) can lock or permanently lose funds unless costly recovery applies!\n- **Finality**: Confirmations take seconds to ~60 minutes depending on network consensus (`Bitcoin ~1–6 blocks`, L2/PoS chains faster, though bridges can carry longer challenge periods).',
      demonstration:
        '1. Check a clean Deposit Verification workflow: Confirm Token (`USDC`) + Confirm Exact Chain (`Arbitrum One`) + Confirm Destination Supports That Exact Chain + Send Tiny Test Amount First.',
      common_mistakes: [
        'Selecting the cheapest withdrawal chain blindly without checking whether the receiving wallet/exchange supports that chain.',
        'Sending 100% of ETH out of a wallet while leaving $0 gas to move remaining ERC-20 tokens.',
      ],
      summary_recap:
        'Always verify matching blockchain networks, keep small native gas balances, and wait for full block finality confirmations.',
      practical_exercise: {
        title: 'Multi-Chain Deposit Verification',
        objective: 'Build an unbreakable 3-check routine before any on-chain transfer.',
        steps: [
          'Write down the 3 mandatory matches before clicking Send: Asset Match, Network/Chain Match, Destination Character Check + Test Send.',
        ],
        deliverable: 'On-Chain Transfer Verification Checklist.',
      },
      visual_key: 'crypto-blockchain-basics',
      duration_minutes: 14,
      tags: ['gas-fees', 'finality', 'networks', 'layer-2'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO],
      quiz: [
        {
          id: 'q-14-09-1',
          question: 'To send USDC sitting inside a self-custody Ethereum mainnet wallet, which token must also sit in that wallet to pay network transaction fees?',
          options: ['ETH (native Ether for gas)', 'BTC', 'EUR', 'Another USDC coin strictly'],
          correct_index: 0,
          explanation: 'Layer-1/Layer-2 networks consume their native gas asset to process token smart-contract transfers.',
        },
        {
          id: 'q-14-09-2',
          question: 'What critical detail must match between sender and receiver BEFORE withdrawing crypto from an exchange?',
          options: [
            'The exact blockchain network (e.g., ERC-20 vs Arbitrum vs Solana), not just the token name',
            'Your internet browser brand',
            'Time of day in London',
            'Hardware color',
          ],
          correct_index: 0,
          explanation: 'Mismatched chain selection is a leading cause of stuck or lost transfers.',
        },
        {
          id: 'q-14-09-3',
          question: 'During extreme network congestion, what happens to on-chain gas fees and confirmation speed?',
          options: [
            'Fees spike competitively as users bid for scarce block space and low-fee transfers stall',
            'Fees drop to zero',
            'Confirmations become instant free',
            'Blockchains double supply',
          ],
          correct_index: 0,
          explanation: 'Blockspace auctions push fees sharply higher during peak demand.',
        },
      ],
    },
    {
      id: 'lesson-14-10',
      title: 'Token, Protocol, Stablecoin, and Smart-Contract Risks',
      category: 'Cryptocurrency Trading',
      summary: 'Evaluate hidden on-chain hazards: smart-contract bugs, bridge hacks, oracle manipulation, governance centralization, and depeg loops.',
      learning_objective: 'Identify protocol-layer technical and economic failure modes before interacting with DeFi or lesser-known tokens.',
      introduction:
        'Beyond price volatility, crypto introduces software and token-design failure risks unheard of in spot EUR/USD—where a single line of buggy code drains an entire protocol in one block.',
      content:
        '### Four Non-Price Crypto Hazards\n1. **Smart-Contract Exploits**: Reentrancy, flash-loan logic bugs, or bridge exploits draining locked pools instantly (even "audited" code has been hacked!).\n2. **Admin Keys / Centralization**: A "decentralized" protocol controlled by one multisig wallet able to pause, upgrade, or drain contracts.\n3. **Depeg Spirals**: Algorithmic or thinly backed stablecoins losing `$1.00` parity in confidence runs.\n4. **Unlimited Token Approvals**: Signing careless DeFi "infinite spend" permissions allows malicious/compromised contracts later to sweep your wallet’s approved tokens!',
      demonstration:
        '1. Review the Protocol Hazard Matrix comparing Centralized Exchange Risk vs. Smart-Contract Bug vs. Unlimited Approval Drain vs. Stablecoin Depeg.',
      common_mistakes: [
        'Assuming "Audited!" badge on a protocol website guarantees bug-free immunity.',
        'Clicking "Approve Unlimited" blindly on unfamiliar websites.',
      ],
      summary_recap:
        'Software bugs, admin keys, depegs, and malicious token approvals create catastrophic risks—limit approvals, diversify, and treat audits as baseline hygiene, not guarantees.',
      practical_exercise: {
        title: 'Protocol Risk Checklist',
        objective: 'Spot hidden technical and centralization points of failure.',
        steps: [
          'List 3 questions to check before trusting any DeFi app or token: (1) Open-source verified code & multiple audits + time live? (2) Token approval scoped strictly to exact amount? (3) Realistic collateral reserve vs. circular algorithmic yield?',
        ],
        deliverable: '3-Gate Protocol Risk Filter.',
      },
      visual_key: 'crypto-custody-security',
      duration_minutes: 15,
      tags: ['smart-contracts', 'defi-risk', 'depeg', 'token-approvals'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FINRA_EDU],
      quiz: [
        {
          id: 'q-14-10-1',
          question: 'Does a smart-contract security audit guarantee a DeFi protocol cannot be hacked?',
          options: [
            'No—numerous audited protocols have still suffered catastrophic exploits and economic attacks',
            'Yes, audits provide 100% insurance',
            'Yes, audited code blocks market price drops',
            'Audits eliminate private keys',
          ],
          correct_index: 0,
          explanation: 'Audits reduce obvious flaws at a point in time; they never eliminate exploit risk.',
        },
        {
          id: 'q-14-10-2',
          question: 'What hazard arises from blindly signing "Unlimited Spend Approval" transactions on random DeFi sites?',
          options: [
            'If that contract is malicious or later compromised, it can drain up to your entire balance of that approved token without further signatures',
            'It doubles your wallet balance',
            'It freezes gas fees',
            'It improves staking APY',
          ],
          correct_index: 0,
          explanation: 'Always cap approvals to exact needed amounts and revoke stale permissions regularly.',
        },
        {
          id: 'q-14-10-3',
          question: 'Why are cross-chain token bridges historically frequent hack targets?',
          options: [
            'They concentrate massive locked collateral pools behind complex multi-chain verification contracts',
            'Bridges only hold zero value',
            'Bridges use paper receipts',
            'Bitcoin miners control all bridges',
          ],
          correct_index: 0,
          explanation: 'Large concentrated treasuries + complex cross-chain validation make bridges high-value targets.',
        },
      ],
    },
    {
      id: 'lesson-14-11',
      title: 'Crypto Market Cycles and Bitcoin Dominance',
      category: 'Cryptocurrency Trading',
      summary: 'Study macro liquidity sensitivity, Bitcoin halving/cycle narratives responsibly, and Bitcoin Dominance (BTC.D) capital rotation without assuming fixed calendar guarantees.',
      learning_objective: 'Track Bitcoin Dominance and global liquidity cycles objectively without treating 4-year cycle rhymes as deterministic guarantees.',
      introduction:
        'Crypto exhibits sweeping boom-and-bust cycles driven by global monetary liquidity, leverage expansion/washouts, and speculative rotation between BTC and altcoins.',
      content:
        '### Reading Bitcoin Dominance (`BTC.D`)\n- **BTC.D = Bitcoin Market Cap ÷ Total Crypto Market Cap**.\n- When fear strikes or early macro recoveries begin, capital often crowds into **BTC** first (`BTC.D rising`, altcoins lagging).\n- During speculative euphoric phases when BTC stabilizes high, risk appetite sometimes rotates outward into **ETH and altcoins** (`BTC.D falling`).\n\n### Objective Caution on "Cycles"\nPast 4-year Bitcoin halving rhythms coincided closely with global liquidity waves (`interest rates, ETFs, macro growth`). **Never assume** every cycle repeats the exact same months or percentages—80% bear crashes regularly punish late-cycle altcoin buyers!',
      demonstration:
        '1. View the Crypto Cycle & BTC Dominance diagram tracing Macro Liquidity & Fear/Greed swings alongside rising vs. falling BTC.D capital rotation—explicitly noting past cycles do not guarantee identical future timing.',
      common_mistakes: [
        'Holding risky altcoins blindly down -85% believing "the 4-year cycle says alt season starts next Tuesday."',
        'Ignoring macro US Fed/dollar liquidity trends in crypto.',
      ],
      summary_recap:
        'Monitor Bitcoin Dominance and macro liquidity context while using hard risk management against violent crypto bear drawdowns.',
      practical_exercise: {
        title: 'BTC vs. Altcoin Relative Strength Study',
        objective: 'Check relative performance against Bitcoin before touching altcoins.',
        steps: [
          'Compare an altcoin/USD chart vs. the same altcoin/BTC ratio chart.',
          'Verify whether holding a particular altcoin even outperformed simple BTC spot risk-adjusted.',
        ],
        deliverable: 'ALT/BTC relative-strength reflection.',
      },
      visual_key: 'crypto-cycles-dominance',
      duration_minutes: 16,
      tags: ['bitcoin-dominance', 'market-cycles', 'rotation'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FED_MONETARY],
      quiz: [
        {
          id: 'q-14-11-1',
          question: 'What does Bitcoin Dominance (BTC.D) measure?',
          options: [
            'Bitcoin’s share (%) of total global cryptocurrency market capitalization',
            'Bitcoin’s daily hash rate',
            'Average transaction fee in dollars',
            'Number of exchanges worldwide',
          ],
          correct_index: 0,
          explanation: 'BTC.D tracks relative capital concentration in Bitcoin versus the broader altcoin market.',
        },
        {
          id: 'q-14-11-2',
          question: 'During sharp crypto risk-off selloffs, how do high-beta altcoins typically behave relative to Bitcoin?',
          options: [
            'They frequently drop far steeper in percentage terms while BTC Dominance ticks higher as altcoin liquidity evaporates',
            'Altcoins stay pegged at $1.00',
            'Altcoins automatically rally 50%',
            'BTC falls while memecoins double',
          ],
          correct_index: 0,
          explanation: 'Risk-off shocks hit thinner altcoin books hardest.',
        },
        {
          id: 'q-14-11-3',
          question: 'True or False: Past 4-year crypto market cycles guarantee identical future peak dates and percentage gains.',
          options: ['False', 'True'],
          correct_index: 0,
          explanation: 'False. Global interest rates, institutional ETFs, regulation, and market maturity evolve continuously.',
        },
      ],
    },
    {
      id: 'lesson-14-12',
      title: 'Security, Scams, Phishing, and Recovery Phrases',
      category: 'Cryptocurrency Trading',
      summary: 'Defend permanently against phishing links, drainer signatures, rug pulls, fake support DMs, SIM swaps, and address poisoning.',
      learning_objective: 'Spot and neutralize every major crypto scam vector before connecting a wallet or signing transactions.',
      introduction:
        'In crypto, you can pick the winning market direction for three years—and lose 100% of your net worth in five seconds by clicking one fake bookmark or signing one drainer signature.',
      content:
        '### Top 6 Scam Vectors to Neutralize Permanently\n1. **Fake Support DMs**: Discord/Telegram/X "Support Mods" asking you to "sync/validate wallet" → **100% SCAM**.\n2. **Search-Ad Phishing Clones**: Paid Google/social ads mimicking legitimate exchanges or wallets with typos (`metamask-update...`). Bookmark official URLs!\n3. **Wallet Drainers & Blind Signatures**: Malicious sites popping a transaction asking you to sign `Permit` / `SetApprovalForAll` or mystery hex bytes.\n4. **Address Poisoning**: Scammers send `$0.00` dust transfers from an address sharing the **first 4 and last 4 characters** of someone you paid, hoping you blindly copy from history!\n5. **SIM-Swap Attacks**: Use hardware keys (`YubiKey`) or authenticator apps (`TOTP`) for exchange 2FA—**never SMS texts**!\n6. **Rug Pulls / Honeypots**: Tokens engineered so buyers cannot sell or dev teams dump unlocked mints.',
      demonstration:
        '1. Inspect an Address Poisoning comparison (`0xAb49...91F2` vs. attacker clone `0xAb49...91F2` differing in the middle 32 hex chars!): Never copy addresses blindly from recent transaction history—check every character via trusted address book.',
      common_mistakes: [
        'Using SMS text messages for exchange Two-Factor Authentication.',
        'Connecting your main hardware/vault wallet to unknown airdrop claim websites.',
      ],
      summary_recap:
        'Use hardware-key/TOTP 2FA (no SMS), bookmark verified URLs, keep a dedicated empty burner wallet for web exploration, and guard seed phrases offline forever.',
      practical_exercise: {
        title: 'Zero-Trust Security Hardening',
        objective: 'Eliminate personal single points of failure.',
        steps: [
          'Audit every account/exchange: switch any SMS 2FA to an Authenticator App or Hardware Security Key.',
          'Adopt a strict rule: Never click crypto support DMs and verify full addresses before sending.',
        ],
        deliverable: 'Completed Security Hardening Verification List.',
      },
      visual_key: 'crypto-custody-security',
      duration_minutes: 17,
      tags: ['scam-defence', 'phishing', '2fa', 'address-poisoning'],
      sources: [OFFICIAL_SOURCES.SEC_CRYPTO, OFFICIAL_SOURCES.FINRA_EDU],
      quiz: [
        {
          id: 'q-14-12-1',
          question: 'Why should you replace SMS text-message 2FA with an Authenticator App or Hardware Key on crypto exchanges?',
          options: [
            'Attackers can hijack phone numbers via telecom SIM-swapping to intercept SMS codes and reset passwords',
            'SMS codes cost $50 per text',
            'Authenticator apps generate free Bitcoin',
            'Hardware keys increase leverage',
          ],
          correct_index: 0,
          explanation: 'SIM swapping bypasses SMS easily; offline TOTP or FIDO2 hardware keys block remote telecom theft.',
        },
        {
          id: 'q-14-12-2',
          question: 'How does an "Address Poisoning" scam trick careful users?',
          options: [
            'Scammers send tiny/zero transfers from vanity addresses matching your real destination’s first & last characters so you accidentally copy the fake address from transaction history',
            'It physically melts hardware wallets',
            'It breaks Bitcoin math',
            'It lowers gas fees',
          ],
          correct_index: 0,
          explanation: 'Always verify the full middle characters from trusted saved address books—never copy blindly from history logs.',
        },
        {
          id: 'q-14-12-3',
          question: 'What is the safest habit if you ever test unfamiliar Web3 applications?',
          options: [
            'Use a separate empty "burner" wallet holding strictly tiny disposable test funds—never connect your main storage vault',
            'Connect your entire life-savings cold storage directly',
            'Enter your seed phrase to prove ownership',
            'Disable wallet warnings',
          ],
          correct_index: 0,
          explanation: 'Compartmentalization caps worst-case drainer exposure cleanly.',
        },
      ],
    },
  ],
};
