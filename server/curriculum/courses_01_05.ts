import { OFFICIAL_SOURCES, type CurriculumCourseSeed } from './types.ts';

export const COURSES_01_05: CurriculumCourseSeed[] = [
  {
    id: 'course-01-intro-forex',
    slug: 'introduction-to-forex',
    course_number: 1,
    title: '01. Introduction to Forex',
    category: 'Introduction to Forex',
    level: 'Beginner',
    level_label: 'Beginner',
    description:
      'Understand how the global foreign-exchange market operates, who participates, how quotes, spreads, pips, lot sizes, order types, margin, trading sessions, and broker due diligence work before placing a single trade.',
    prerequisites: 'None — designed for complete beginners.',
    learning_outcomes: [
      'Explain how over-the-counter (OTC) currency exchange works and who drives liquidity.',
      'Read any Forex quote, identify base and quote currencies, and compute spread and pip changes.',
      'Differentiate market, limit, and stop orders and configure protective stop-loss and take-profit levels.',
      'Understand leverage, margin close-out, broker regulation checks, and how to practice safely on a demo account.',
    ],
    estimated_hours: 3.5,
    cover_image_url: '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    assessment: [
      {
        id: 'c1-a1',
        question: 'In the Forex quote EUR/USD = 1.0850, what does 1.0850 represent?',
        options: [
          'How many Euros equal 1 US Dollar',
          'How many US Dollars are needed to buy 1 Euro',
          'The broker commission in pips',
          'The daily interest rate on Euros',
        ],
        correct_index: 1,
        explanation:
          'In EUR/USD, EUR is the base currency (always 1 unit) and USD is the quote currency. Thus 1 EUR costs 1.0850 USD.',
      },
      {
        id: 'c1-a2',
        question: 'If a broker quotes EUR/USD Bid 1.0848 / Ask 1.0850, what is the spread?',
        options: ['0.2 pips', '2.0 pips', '20 pips', '0.02 pips'],
        correct_index: 1,
        explanation: '1.0850 - 1.0848 = 0.0002, which equals 2.0 standard pips (fourth decimal place).',
      },
      {
        id: 'c1-a3',
        question: 'Which order type guarantees execution immediately at the best available current market price (subject to slippage)?',
        options: ['Buy Limit order', 'Sell Stop order', 'Market order', 'Take-Profit order'],
        correct_index: 2,
        explanation: 'A Market order requests immediate execution at the prevailing Bid (sell) or Ask (buy) price.',
      },
      {
        id: 'c1-a4',
        question: 'Why does high financial leverage require strict risk control?',
        options: [
          'It eliminates spreads during news releases',
          'It magnifies both potential profits and potential losses relative to your deposited margin',
          'It guarantees negative-balance protection in every country',
          'It locks in a fixed win rate',
        ],
        correct_index: 1,
        explanation:
          'Leverage lets a small margin deposit control a large notional position, amplifying gains and losses equally. Margin close-out and negative-balance protection rules vary by jurisdiction and provider.',
      },
      {
        id: 'c1-a5',
        question: 'Which session overlap generally experiences the highest global Forex liquidity and tightest spreads?',
        options: [
          'Sydney open and late Friday close',
          'London and New York overlap',
          'Sunday market gap open',
          'Midday Tokyo lunch hour',
        ],
        correct_index: 1,
        explanation:
          'The London and New York overlap (approx. 13:00–17:00 UTC in winter / 12:00–16:00 UTC during DST) concentrates the largest institutional order flow.',
      },
      {
        id: 'c1-a6',
        question: 'Which statement accurately describes a demo account versus a live trading account?',
        options: [
          'Demo accounts always replicate live slippage, spread widening, and trader psychology identically',
          'Demo accounts execute in a simulated environment and may not reflect real-money slippage, liquidity gaps, or emotional pressure',
          'Demo profits can be withdrawn once 100 trades are completed',
          'Demo accounts require regulatory licensing from the BIS',
        ],
        correct_index: 1,
        explanation:
          'Demo accounts are essential for learning platform mechanics, but live markets involve real slippage, variable liquidity, commissions, and psychological stress.',
      },
    ],
    lessons: [
      {
        id: 'lesson-01-01',
        title: 'What Forex Is and How Currency Exchange Works',
        category: 'Introduction to Forex',
        summary: 'Learn what the foreign-exchange market is in plain language, why currencies trade in pairs, and how decentralized OTC trading functions.',
        learning_objective: 'Define the foreign-exchange (Forex) market and explain how one currency is priced and exchanged against another.',
        introduction:
          'Whenever you travel abroad or buy an item priced in a foreign currency, you participate in foreign exchange. At a global scale, banks, businesses, governments, and traders exchange trillions of dollars of currencies every day.',
        content:
          '### Plain-Language Foundation\nThe **foreign exchange market** (commonly shortened to **Forex** or **FX**) is the global marketplace where national currencies are bought and sold against one another.\n\nUnlike a stock exchange such as the New York Stock Exchange, spot Forex has **no single central building or physical floor**. Instead, it operates as an **over-the-counter (OTC)** electronic network connecting major banks, liquidity providers, brokers, and market participants worldwide, 24 hours a day from Sunday evening to Friday evening (UTC).\n\n### Why Currencies Always Trade in Pairs\nA currency only has value relative to something else. Therefore, every Forex transaction simultaneously buys one currency and sells another:\n- If you expect the Euro (**EUR**) to gain value relative to the US Dollar (**USD**), you buy **EUR/USD**.\n- If you expect the US Dollar to strengthen relative to the Japanese Yen (**JPY**), you buy **USD/JPY**.\n\n### Official Scale Context (BIS Data)\nAccording to the **Bank for International Settlements (BIS)** Triennial Central Bank Survey, global foreign-exchange turnover averages multiple trillions of US dollars per day across spot, outright forwards, FX swaps, and options—making it the world’s largest financial market by daily turnover. Note: BIS turnover figures reflect interbank and institutional hedging/funding flows as well as speculative trading.',
        demonstration:
          '1. Imagine a European electronics importer needs to pay a U.S. supplier $100,000 USD.\n2. At an illustrative rate of **EUR/USD = 1.1000**, the importer exchanges roughly €90,909 EUR for $100,000 USD.\n3. In retail spot Forex (via Contracts for Difference or rolling spot FX), traders speculate on whether that exchange rate (1.1000) will rise or fall without physically delivering banknotes.',
        common_mistakes: [
          'Assuming spot Forex trades on a single centralized exchange like stocks—OTC pricing varies slightly between liquidity providers and brokers.',
          'Confusing real-world international trade settlement with leveraged retail CFD trading.',
          'Thinking the 24-hour market means every hour has equal liquidity—off-peak hours carry wider spreads.',
        ],
        summary_recap:
          'Forex is a decentralized, 24/5 OTC market where currencies are priced in pairs. Every transaction buys one currency while selling another.',
        practical_exercise: {
          title: 'Spot vs. Real-World Currency Exchange Mapping',
          objective: 'Connect everyday currency conversion to Forex pair notation.',
          steps: [
            'Write down three real-world situations where currencies must be exchanged (e.g., tourism, importing goods, investing abroad).',
            'Express each conversion as a currency pair (e.g., GBP/USD or USD/CAD).',
            'Note whether the transaction exchanges physical money or speculates on rate movement via an OTC broker.',
          ],
          deliverable: 'A 3-row personal study table linking real currency needs to standard 3-letter ISO currency codes.',
        },
        visual_key: 'forex-ecosystem',
        duration_minutes: 14,
        tags: ['forex basics', 'OTC', 'currency exchange'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CFTC_FX],
        quiz: [
          {
            id: 'l0101-q1',
            question: 'Why does spot Forex trade over-the-counter (OTC) rather than on a single physical exchange?',
            options: [
              'Because currencies are traded across an electronic global network of banks and liquidity providers',
              'Because Forex is only open two hours per day',
              'Because governments forbid electronic trading',
              'Because all trades are settled in gold bars',
            ],
            correct_index: 0,
            explanation: 'Spot FX operates across interconnected dealer and electronic communication networks globally rather than a single central exchange.',
          },
          {
            id: 'l0101-q2',
            question: 'What does buying the EUR/USD pair mean conceptually?',
            options: [
              'Buying Euros and simultaneously selling US Dollars',
              'Selling Euros and buying US Dollars',
              'Buying physical stock in European banks',
              'Exchanging USD for Gold',
            ],
            correct_index: 0,
            explanation: 'Every Forex quote pairs two currencies: buying the pair buys the first (base) currency and sells the second (quote) currency.',
          },
          {
            id: 'l0101-q3',
            question: 'During which days does the global spot Forex market normally operate?',
            options: [
              '24 hours a day, 7 days a week including Saturday',
              '24 hours a day across 5 business days (Sunday evening to Friday evening UTC)',
              'Only 9:30 AM to 4:00 PM New York time',
              'Monday through Wednesday only',
            ],
            correct_index: 1,
            explanation: 'Spot FX follows banking hours across Asia, Europe, and North America from Sunday evening until Friday close.',
          },
        ],
      },
      {
        id: 'lesson-01-02',
        title: 'Who Participates: Banks, Central Banks, Businesses, Funds & Retail Traders',
        category: 'Introduction to Forex',
        summary: 'Discover the distinct motivations of tier-1 commercial banks, central banks, multinational corporations, hedge funds, and retail traders.',
        learning_objective: 'Distinguish between commercial/hedging participants and speculative participants in the FX market.',
        introduction:
          'Not everyone in the Forex market is trying to predict short-term charts. In fact, a large portion of currency volume comes from companies paying overseas invoices and central banks managing national reserves.',
        content:
          '### The FX Participant Hierarchy\n1. **Tier-1 Commercial & Investment Banks**: Institutions such as JPMorgan, Citi, UBS, and Deutsche Bank provide liquidity, quote bid/ask prices on the interbank market, and execute large client orders.\n2. **Central Banks**: Authorities such as the **Federal Reserve (Fed)**, **European Central Bank (ECB)**, **Bank of England (BoE)**, and **Bank of Japan (BoJ)** set interest rates, manage foreign-exchange reserves, and occasionally intervene to stabilize disorderly currency moves.\n3. **Multinational Corporations & Importers/Exporters**: Businesses convert revenues and hedge currency risk so exchange-rate swings do not wipe out operating margins.\n4. **Institutional Funds & Asset Managers**: Pension funds, sovereign wealth funds, and hedge funds rebalance international portfolios or execute macro currency strategies.\n5. **Retail Traders**: Individual participants accessing spot FX or CFDs (**Contracts for Difference**) through regulated online brokers. Retail traders represent a small fraction of total daily FX turnover.\n\n### Why This Matters to You\nBecause banks, funds, and corporations execute massive orders around month-end, quarter-end, and central-bank announcements, price movements are heavily shaped by institutional liquidity needs rather than retail chart patterns alone.',
        demonstration:
          'Consider an automaker in Germany exporting cars to the United States:\n- It earns USD from U.S. buyers but pays factory wages in EUR.\n- It sells USD and buys EUR through its bank regardless of whether a 15-minute RSI indicator looks "overbought".\n- Understanding non-speculative flows prevents beginners from treating every price wiggle as a retail chart pattern.',
        common_mistakes: [
          'Believing retail traders move major currency pairs—retail order flow is tiny compared to institutional FX swaps and corporate hedging.',
          'Assuming "market makers" are always trading against you personally rather than managing aggregated order books.',
          'Ignoring central-bank policy announcements because you consider yourself a "pure technical trader".',
        ],
        summary_recap:
          'The FX market serves global commerce, reserve management, hedging, and speculation. Recognizing commercial and central-bank flows builds realistic market expectations.',
        practical_exercise: {
          title: 'Participant Motivation Classification',
          objective: 'Identify whether real-world FX flows are commercial, policy-driven, or speculative.',
          steps: [
            'List all five major FX participant categories.',
            'Assign each participant one primary reason they exchange currency (liquidity provision, monetary policy, business hedging, portfolio rebalancing, or speculation).',
            'Note which participants trade regardless of chart patterns.',
          ],
          deliverable: 'A participant matrix contrasting hedging/commercial flows vs. speculative retail flows.',
        },
        visual_key: 'fx-participants',
        duration_minutes: 12,
        tags: ['liquidity', 'central banks', 'market participants'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.BIS_HUB],
        quiz: [
          {
            id: 'l0102-q1',
            question: 'Which group accounts for the core pricing and liquidity backbone of the interbank FX market?',
            options: [
              'Retail smartphone traders',
              'Major tier-1 commercial and investment banks',
              'Cryptocurrency miners',
              'Local currency exchange kiosks at airports',
            ],
            correct_index: 1,
            explanation: 'Large dealer banks quote prices and warehouse liquidity across the global interbank market.',
          },
          {
            id: 'l0102-q2',
            question: 'Why do multinational corporations participate heavily in Forex?',
            options: [
              'To scalp 5-minute charts',
              'To convert overseas revenue and hedge exchange-rate exposure on real business operations',
              'To set national interest rates',
              'To avoid paying taxes',
            ],
            correct_index: 1,
            explanation: 'Businesses use FX spot and forward contracts to pay suppliers, repatriate earnings, and protect profit margins from currency swings.',
          },
          {
            id: 'l0102-q3',
            question: 'How do central banks primarily influence exchange rates over time?',
            options: [
              'By setting monetary policy interest rates and managing currency reserves',
              'By drawing trendlines on MT4',
              'By guaranteeing retail broker spreads',
              'By banning currency pairs',
            ],
            correct_index: 0,
            explanation: 'Central banks adjust policy rates, issue forward guidance, and manage reserves to fulfill inflation and employment mandates.',
          },
        ],
      },
      {
        id: 'lesson-01-03',
        title: 'How a Forex Quote Works: Base and Quote Currency',
        category: 'Introduction to Forex',
        summary: 'Learn how to read three-letter ISO currency codes and accurately interpret base versus quote currencies on any pair.',
        learning_objective: 'Identify the base currency and quote currency in any Forex quote and calculate exchange amounts.',
        introduction:
          'When you open a trading platform, you see pairs like EUR/USD 1.0845 or USD/JPY 152.30. Learning to read those six letters in under two seconds is your first essential skill.',
        content:
          '### Anatomy of a Currency Quote\nEvery Forex quote uses standardized three-letter **ISO 4217** currency codes (for example: **USD** = US Dollar, **EUR** = Euro, **GBP** = British Pound, **JPY** = Japanese Yen, **CHF** = Swiss Franc, **CAD** = Canadian Dollar, **AUD** = Australian Dollar, **NZD** = New Zealand Dollar).\n\nIn any pair **AAA/BBB = Price**:\n- **First currency (AAA)** = **Base Currency** (always represents **1 unit**).\n- **Second currency (BBB)** = **Quote (Counter) Currency** (how many units of BBB are required to buy 1 unit of AAA).\n\n### Illustrative Quote Examples\n- **EUR/USD = 1.0850** (illustrative): 1 Euro equals **1.0850 US Dollars**. If EUR/USD rises from 1.0850 to 1.0920, the Euro strengthened (or USD weakened) because 1 Euro now buys more US Dollars.\n- **USD/JPY = 151.40** (illustrative): 1 US Dollar equals **151.40 Japanese Yen**. If USD/JPY falls from 151.40 to 150.10, the US Dollar weakened relative to the Yen.',
        demonstration:
          'Let us convert €2,500 EUR into USD using an illustrative quote **EUR/USD = 1.0850**:\n1. Base = EUR (1 unit), Quote = USD (1.0850 units).\n2. Multiply base units by the rate: `2,500 × 1.0850 = $2,712.50 USD`.\n3. Now reverse it: How many GBP are needed to buy $1,270 USD if **GBP/USD = 1.2700**? Divide USD by the rate: `1,270 / 1.2700 = £1,000 GBP`.',
        common_mistakes: [
          'Reversing the base and quote currency—thinking USD/JPY rising means JPY is getting stronger (it actually means USD is strengthening vs JPY).',
          'Forgetting that the base currency is always fixed at 1 unit while the quoted number expresses the quote currency.',
          'Assuming a rising EUR/USD automatically means EUR is rising against GBP or JPY too.',
        ],
        summary_recap:
          'The first currency is the Base (1 unit); the second is the Quote. A rising pair means the base strengthens relative to the quote currency.',
        practical_exercise: {
          title: 'Base & Quote Translation Drill',
          objective: 'Accurately read and convert four major Forex quotes.',
          steps: [
            'Given illustrative quotes: EUR/USD = 1.0900, GBP/USD = 1.2650, USD/JPY = 152.00, USD/CAD = 1.3800.',
            'Identify the base and quote currency for each of the four pairs.',
            'State which currency strengthened if each quote increases by 0.0100 (or 1.00 for USD/JPY).',
          ],
          deliverable: 'Four written interpretations verifying directional meaning.',
        },
        visual_key: 'currency-quote-anatomy',
        duration_minutes: 12,
        tags: ['base currency', 'quote currency', 'ISO codes'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0103-q1',
            question: 'In the pair GBP/JPY, which currency is the base currency?',
            options: ['JPY', 'GBP', 'USD', 'EUR'],
            correct_index: 1,
            explanation: 'The base currency is always the first currency listed in the pair—GBP in GBP/JPY.',
          },
          {
            id: 'l0103-q2',
            question: 'If USD/CAD rises from 1.3600 to 1.3850, what occurred?',
            options: [
              'The US Dollar strengthened relative to the Canadian Dollar',
              'The Canadian Dollar strengthened relative to the US Dollar',
              'Both currencies lost value equally',
              'The spread doubled',
            ],
            correct_index: 0,
            explanation: '1 USD now buys 1.3850 CAD instead of 1.3600 CAD, meaning USD appreciated against CAD.',
          },
          {
            id: 'l0103-q3',
            question: 'Using illustrative rate EUR/USD = 1.1000, how many US Dollars equal €500?',
            options: ['$454.55', '$550.00', '$500.00', '$610.00'],
            correct_index: 1,
            explanation: '500 EUR × 1.1000 USD/EUR = $550.00 USD.',
          },
        ],
      },
      {
        id: 'lesson-01-04',
        title: 'Bid, Ask, Spread, Commission and Swap/Financing',
        category: 'Introduction to Forex',
        summary: 'Understand the two prices shown on every order ticket and every real transaction cost charged by brokers.',
        learning_objective: 'Calculate spread cost, recognize commission structures, and understand overnight swap/financing charges.',
        introduction:
          'When you look at a currency quote at an airport booth or on a trading platform, you always see two prices: a lower price if you are selling and a higher price if you are buying. That difference is the spread.',
        content:
          '### Bid vs. Ask (Offer) Price\n- **Bid Price**: The price at which the broker/market will **buy** the base currency from you—i.e., the price you receive when you open a **SELL** trade.\n- **Ask Price**: The price at which the broker/market will **sell** the base currency to you—i.e., the price you pay when you open a **BUY** trade.\n- **Spread**: `Ask − Bid`. Because you buy at the Ask and immediately exit by selling at the Bid, every new trade starts slightly negative by the cost of the spread.\n\n### Commissions & Overnight Financing (Swap)\n- **Standard (Spread-Only) Accounts**: Broker markup is built into a slightly wider spread with $0 separate commission.\n- **Raw / ECN-Style Accounts**: Tighter raw spreads (e.g., 0.1–0.4 pips) plus a fixed round-turn commission (e.g., $6–$7 per standard lot).\n- **Swap / Rollover Financing**: Holding a leveraged spot/CFD position past the daily rollover cutoff (typically 17:00 New York time) incurs or earns overnight financing based on the interest-rate differential between the two currencies plus a broker fee. Wednesday rollover typically triples to account for the weekend settlement cycle (T+2).',
        demonstration:
          'Illustrative example on EUR/USD:\n- Quoted **Bid = 1.0848**, **Ask = 1.0850**.\n- Spread = `1.0850 − 1.0848 = 0.0002` (**2.0 pips**).\n- If you buy 1 standard lot (where 1 pip ≈ $10), entering the trade immediately reflects an unrealized cost of `2.0 pips × $10 = $20`.\n- On a chart that plots Bid prices by default, a BUY trade opens slightly *above* the visible candle price (at the Ask) and a SELL trade closes *above* the visible candle price (at the Ask).',
        common_mistakes: [
          'Forgetting that BUY positions close at the Bid and SELL positions close at the Ask—causing stop-losses on SELL trades to trigger before the Bid-only chart line visually touches the stop.',
          'Ignoring spread widening during low-liquidity rollover (17:00 NY) or high-impact news releases.',
          'Assuming "zero commission" means zero trading cost—the cost is simply embedded inside the spread.',
        ],
        summary_recap:
          'You buy at the Ask and sell at the Bid. Total trading cost includes spread, any explicit commission, and overnight swap financing if held past rollover.',
        practical_exercise: {
          title: 'Bid/Ask Cost & Chart Line Verification',
          objective: 'Calculate exact entry cost and verify how Bid vs. Ask affects Stop Loss placement.',
          steps: [
            'Given illustrative quote GBP/USD Bid 1.2640 / Ask 1.2643, calculate the spread in pips.',
            'Compute the immediate dollar spread cost for a 0.10 mini lot (where 1 pip ≈ $1).',
            'Explain why a Sell trade stop-loss at 1.2660 can be triggered when the Bid price only reaches 1.2657.',
          ],
          deliverable: 'Written calculation showing spread = 3 pips ($3 cost) and Ask-trigger explanation.',
        },
        visual_key: 'bid-ask-spread',
        duration_minutes: 15,
        tags: ['bid', 'ask', 'spread', 'swap', 'commission'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0104-q1',
            question: 'When you click BUY (Market Execution) on EUR/USD, which price is your trade opened at?',
            options: ['The Bid price', 'The Ask price', 'The midpoint', 'Yesterday’s close'],
            correct_index: 1,
            explanation: 'Buyers purchase at the Ask (higher) price and later sell to close at the Bid price.',
          },
          {
            id: 'l0104-q2',
            question: 'Why might a SELL trade Stop Loss get triggered even though the Bid-only candle wick on your chart never touched it?',
            options: [
              'Charts normally plot the Bid price, while SELL positions close at the higher Ask price',
              'Sell trades ignore stop losses',
              'Because pipettes are not counted',
              'Because demo accounts only use Ask prices',
            ],
            correct_index: 0,
            explanation: 'A SELL position closes by buying back at the Ask price (Bid + Spread). If the spread widens, the Ask can cross your stop before the Bid reaches it.',
          },
          {
            id: 'l0104-q3',
            question: 'What is swap/rollover in spot Forex?',
            options: [
              'An overnight financing debit or credit applied when holding a leveraged position past daily rollover',
              'A fee charged only when deleting a chart',
              'A guarantee of positive interest',
              'The difference between MT4 and MT5',
            ],
            correct_index: 0,
            explanation: 'Swap reflects interest-rate differentials and broker financing charges for holding positions overnight past 17:00 NY time.',
          },
        ],
      },
      {
        id: 'lesson-01-05',
        title: 'Pips, Pipettes, Contract Sizes and Lot Types',
        category: 'Introduction to Forex',
        summary: 'Learn how price increments (pips and fractional pipettes) and position sizes (standard, mini, micro, nano lots) work together.',
        learning_objective: 'Compute price movement in pips/pipettes and convert between standard, mini, and micro lot contract sizes.',
        introduction:
          'Instead of saying "EUR/USD went up by 0.0025", traders say "EUR/USD moved 25 pips". Understanding pips and lot sizes turns small decimal changes into exact dollar risk.',
        content:
          '### Pips and Pipettes\n- **Pip (Percentage in Point)**: For most currency pairs (EUR/USD, GBP/USD, AUD/USD), a pip is the **4th decimal place (`0.0001`)**. For Japanese Yen pairs (USD/JPY, EUR/JPY, GBP/JPY), a pip is the **2nd decimal place (`0.01`)**.\n- **Pipette (Fractional Pip)**: Most modern brokers quote an extra 5th decimal place (or 3rd decimal place on JPY pairs). One pipette equals **1/10th of a pip** (`0.00001`, or `0.001` on JPY pairs).\n\n### Contract Sizes & Lot Types\nIn spot FX, 1 **Standard Lot** equals **100,000 units** of the base currency. Brokers divide lots for smaller account risk:\n| Lot Type | Lot Value | Base Currency Units | Approx. USD Pip Value (XXX/USD) |\n|---|---|---|---|\n| **Standard** | `1.00` | 100,000 units | ~$10.00 / pip |\n| **Mini** | `0.10` | 10,000 units | ~$1.00 / pip |\n| **Micro** | `0.01` | 1,000 units | ~$0.10 / pip |\n\n*Important broker caveat*: Contract sizes for Gold (XAU/USD), indices, and crypto differ significantly by broker and must always be verified in the platform contract specification window.',
        demonstration:
          'Illustrative price move on EUR/USD:\n1. Price rises from `1.08205` to `1.08455`.\n2. Subtract: `1.08455 − 1.08205 = 0.00250`.\n3. Because the 4th decimal place is 1 pip, `0.00250` = **25.0 pips** (250 pipettes).\n4. With a **0.10 mini lot** (10,000 EUR), `25 pips × $1.00/pip = $25.00` gross move before spread/commissions.',
        common_mistakes: [
          'Misreading the 5th decimal place (pipette) as a full pip—mistaking a 20-pipette move (2.0 pips) for 20 pips.',
          'Applying JPY 2-decimal pip rules to 4-decimal pairs or vice versa.',
          'Assuming 1.00 lot on Gold or Indices has the same contract size as 1.00 lot on EUR/USD.',
        ],
        summary_recap:
          'Pips measure standard price movement (4th decimal for most FX, 2nd for JPY). Lots scale exposure from Micro (0.01 = 1,000 units) up to Standard (1.00 = 100,000 units).',
        practical_exercise: {
          title: 'Pip & Lot Size Calculation Drill',
          objective: 'Measure pip distances and dollar impact across different lot sizes.',
          steps: [
            'Calculate the pip change when GBP/USD moves from 1.25400 to 1.25825.',
            'Calculate the pip change when USD/JPY moves from 151.205 to 150.755.',
            'Determine the approximate USD move on GBP/USD for 0.05 lots (5 micro lots).',
          ],
          deliverable: 'Answers verified: +42.5 pips on GBP/USD, -45.0 pips on USD/JPY, and ~$21.25 gross value at 0.05 lots.',
        },
        visual_key: 'pip-lot-diagram',
        duration_minutes: 14,
        tags: ['pips', 'pipettes', 'lots', 'contract size'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'l0105-q1',
            question: 'In USD/JPY = 152.345, which digit represents 1 standard pip?',
            options: ['The 2nd decimal place (4)', 'The 3rd decimal place (5)', 'The 4th decimal place', 'The hundreds digit (1)'],
            correct_index: 0,
            explanation: 'JPY pairs quote pips at the 2nd decimal place (0.01), with the 3rd decimal place representing pipettes.',
          },
          {
            id: 'l0105-q2',
            question: 'How many base currency units are in 0.03 lots (3 micro lots)?',
            options: ['300 units', '3,000 units', '30,000 units', '300,000 units'],
            correct_index: 1,
            explanation: '0.01 lot = 1,000 units, so 0.03 lots = 3,000 units of the base currency.',
          },
          {
            id: 'l0105-q3',
            question: 'EUR/USD moves from 1.07100 to 1.07355. How many pips is that?',
            options: ['255 pips', '25.5 pips', '2.55 pips', '0.255 pips'],
            correct_index: 1,
            explanation: '1.07355 - 1.07100 = 0.00255 = 25.5 pips (the trailing 5 is 5 pipettes = 0.5 pip).',
          },
        ],
      },
      {
        id: 'lesson-01-06',
        title: 'Market Orders, Limit Orders, Stop Orders and Execution',
        category: 'Introduction to Forex',
        summary: 'Master how Market, Limit, and Stop orders behave, when each is used, and how slippage impacts execution.',
        learning_objective: 'Select the right order type (Market, Buy/Sell Limit, Buy/Sell Stop) and explain positive and negative slippage.',
        introduction:
          'Placing a trade is not just clicking Buy or Sell immediately. You can instruct your platform to wait until price reaches a better level or breaks past a key barrier.',
        content:
          '### Core Order Types\n1. **Market Order**: Executes immediately at the best available current price (Ask for Buy, Bid for Sell). Fast entry, but exact fill price can vary during volatility (**slippage**).\n2. **Limit Order (Entry at a Better Price)**:\n   - **Buy Limit**: Placed *below* current market price, expecting price to dip into support and bounce higher.\n   - **Sell Limit**: Placed *above* current market price, expecting price to rally into resistance and turn lower.\n3. **Stop Order (Entry on Momentum / Breakout)**:\n   - **Buy Stop**: Placed *above* current market price, entering long only if price breaks upward.\n   - **Sell Stop**: Placed *below* current market price, entering short only if price breaks downward.\n\n### Execution Realities: Slippage & Liquidity\nA **Stop order** becomes a market order once its trigger price is hit. Therefore, in fast-moving markets or weekend gaps, stop orders can fill at a worse price than requested (**negative slippage**). Conversely, limit orders guarantee your price or better, though price may touch your level without filling if liquidity is thin.',
        demonstration:
          'Illustrative setup on EUR/USD currently trading at `1.0850`:\n- Want to buy immediately? -> **Market Buy**.\n- Want to buy only if price pulls back down to `1.0810`? -> **Buy Limit** at `1.0810`.\n- Want to buy only if price breaks upward above resistance at `1.0880`? -> **Buy Stop** at `1.0880`.',
        common_mistakes: [
          'Confusing Buy Limit with Buy Stop (placing a Buy Limit above current price causes instant market fill or rejection).',
          'Assuming a Stop-Loss order guarantees exact exit price during major news gaps.',
          'Leaving old pending orders active over the weekend or ahead of scheduled central-bank announcements.',
        ],
        summary_recap:
          'Market orders prioritize speed; Limit orders target better prices; Stop orders trigger on breakouts or protect losses (becoming market orders when triggered).',
        practical_exercise: {
          title: 'Order Ticket Placement Scenarios',
          objective: 'Match four trade plans to the exact pending or market order type.',
          steps: [
            'Current illustrative USD/CAD price = 1.3750.',
            'Determine the order type to: (a) sell immediately, (b) sell on a rally to 1.3800, (c) sell on a breakdown below 1.3710, (d) buy on a pullback to 1.3700.',
            'Practice entering and cancelling one pending order on a demo account.',
          ],
          deliverable: 'Correct mapping: (a) Market Sell, (b) Sell Limit, (c) Sell Stop, (d) Buy Limit.',
        },
        visual_key: 'order-types-diagram',
        duration_minutes: 14,
        tags: ['market order', 'limit order', 'stop order', 'slippage'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0106-q1',
            question: 'EUR/USD is at 1.0850. You want to sell if price rallies up to resistance at 1.0900. Which order do you place?',
            options: ['Sell Stop at 1.0900', 'Sell Limit at 1.0900', 'Buy Limit at 1.0900', 'Market Sell'],
            correct_index: 1,
            explanation: 'A Sell Limit is placed above the current price to sell at a more favorable higher level.',
          },
          {
            id: 'l0106-q2',
            question: 'What happens when a Buy Stop or Stop-Loss trigger price is reached during a sudden price gap?',
            options: [
              'The broker refunds the gap',
              'The stop order executes at the next available market price, which may include slippage',
              'The platform freezes the market',
              'The trade converts into a risk-free position',
            ],
            correct_index: 1,
            explanation: 'Standard stop orders convert into market orders upon trigger and fill at the prevailing liquidity available.',
          },
          {
            id: 'l0106-q3',
            question: 'Which order type is placed BELOW current market price to buy if price breaks downward?',
            options: ['No order does that—selling below price is a Sell Stop; buying below price is a Buy Limit', 'Buy Stop', 'Sell Limit', 'Market Buy'],
            correct_index: 0,
            explanation: 'Buying below current price is a Buy Limit (hoping for a bounce); selling on a breakdown below current price is a Sell Stop.',
          },
        ],
      },
      {
        id: 'lesson-01-07',
        title: 'Stop-Loss, Take-Profit, Margin and Leverage',
        category: 'Introduction to Forex',
        summary: 'Learn how protective stop-loss and take-profit orders work, and why leverage magnifies losses alongside margin call and stop-out mechanics.',
        learning_objective: 'Explain margin, free margin, margin level, leverage, stop-loss, take-profit, margin close-out, and negative-balance protection.',
        introduction:
          'Leverage allows you to control a large currency position with a small deposit, much like a security deposit. While that sounds convenient, it is the single fastest way unprepared beginners lose their accounts.',
        content:
          '### Protective Orders\n- **Stop-Loss (SL)**: Pre-set exit order designed to cap loss if price moves against your thesis (subject to slippage/gaps).\n- **Take-Profit (TP)**: Pre-set limit exit order to lock in gains if price reaches your target zone.\n\n### Margin & Leverage Mechanics\n- **Leverage** (e.g., 1:30 or 1:100): Ratio of total position value to required deposit (**Used Margin**). At 1:30 leverage, a $10,000 mini-lot requires `$10,000 / 30 = $333.33` in used margin.\n- **Account Equity**: `Balance + Floating Unrealized Profit/Loss`.\n- **Free Margin**: `Equity − Used Margin` (available buffer to sustain drawdowns or open new trades).\n- **Margin Level (%)**: `(Equity / Used Margin) × 100%`.\n\n### Margin Call, Stop-Out & Regulatory Protections\n**Professional Note**: Leverage magnifies losses as well as gains! If unrealized losses push your Margin Level down to a broker’s **Margin Call** threshold (e.g., 100%), you cannot open new trades. If it drops to the **Stop-Out / Margin Close-Out** level (e.g., 50%), the broker automatically liquidates open positions to prevent the account from falling further negative.\n\nRegulated retail jurisdictions (such as the UK FCA, EU ESMA, or ASIC) mandate leverage caps and **Negative-Balance Protection** for retail clients, whereas offshore or professional accounts may have no negative-balance protection—meaning you could owe money after an extreme gap. Always check your jurisdiction and provider rules.',
        demonstration:
          'Illustrative leverage comparison on a **$1,000** account:\n- **Position A (Over-leveraged)**: 1.00 standard lot on EUR/USD (~$10/pip). A modest 50-pip adverse move equals `-$500` (**-50% of account equity** in one trade!).\n- **Position B (Controlled Risk)**: 0.02 micro lots (~$0.20/pip). The exact same 50-pip move equals `-$10` (**-1% of account equity**). The leverage *available* on your account does not force you to use large lot sizes.',
        common_mistakes: [
          'Using maximum broker leverage to trade oversized lots instead of sizing by stop-loss distance.',
          'Trading without a Stop-Loss and relying on "margin stop-out" as your exit plan.',
          'Assuming negative-balance protection applies universally across all brokers and account classifications.',
        ],
        summary_recap:
          'Always attach Stop-Loss and Take-Profit orders. Leverage amplifies both gains and losses; small lot sizing protects your margin level from stop-out.',
        practical_exercise: {
          title: 'Margin Level & Leverage Stress Test',
          objective: 'Calculate used margin and margin level under adverse price movement.',
          steps: [
            'Assume an illustrative $2,000 account with 1:30 maximum leverage.',
            'Calculate the required margin for a $30,000 position (0.30 lots of EUR/USD).',
            'Compute Equity and Margin Level if the trade suffers a -$1,200 drawdown, and check whether it hits a 100% Margin Call.',
          ],
          deliverable: 'Required margin = $1,000; Equity = $800; Margin Level = 80% (below 100% margin call).',
        },
        visual_key: 'margin-leverage-diagram',
        duration_minutes: 16,
        tags: ['leverage', 'margin', 'stop-loss', 'stop-out'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0107-q1',
            question: 'If Account Equity is $1,500 and Used Margin is $500, what is the Margin Level?',
            options: ['33.3%', '300%', '100%', '50%'],
            correct_index: 1,
            explanation: 'Margin Level = (Equity / Used Margin) × 100% = (1500 / 500) × 100% = 300%.',
          },
          {
            id: 'l0107-q2',
            question: 'Which statement about Negative-Balance Protection is accurate?',
            options: [
              'It exists identically on every broker worldwide',
              'It prevents retail accounts in certain regulated jurisdictions from going below zero, though protections differ by provider and jurisdiction',
              'It guarantees you can never lose your initial deposit',
              'It removes the need for a stop-loss order',
            ],
            correct_index: 1,
            explanation: 'Negative-balance protection is mandated in specific jurisdictions (e.g., EU/UK/AU retail) and not guaranteed everywhere or on professional/offshore accounts.',
          },
          {
            id: 'l0107-q3',
            question: 'What is the primary purpose of a Stop-Loss order?',
            options: [
              'To double position size on losses',
              'To pre-define the price where your trade thesis is invalidated and cap potential loss (subject to slippage)',
              'To waive broker spreads',
              'To lock in guaranteed profits',
            ],
            correct_index: 1,
            explanation: 'A Stop-Loss establishes clear risk boundaries before entering a trade.',
          },
        ],
      },
      {
        id: 'lesson-01-08',
        title: 'Trading Sessions and Market Hours (Including Daylight Saving Changes)',
        category: 'Introduction to Forex',
        summary: 'Map the four major FX sessions—Sydney, Tokyo, London, and New York—and handle seasonal Daylight Saving Time (DST) shifts.',
        learning_objective: 'Identify active hours for each global session, pinpoint high-liquidity overlaps, and adjust for DST shifts.',
        introduction:
          'Even though Forex runs 24 hours a day on weekdays, trading activity rises and falls as financial centers open and close across the globe.',
        content:
          '### The Four Major FX Sessions (Standard UTC Reference)\n1. **Sydney Session**: ~21:00–06:00 UTC (Quiet open; AUD & NZD focus; wider spreads around market open).\n2. **Tokyo (Asian) Session**: ~00:00–09:00 UTC (JPY, AUD, NZD crosses active; EUR/GBP often consolidate in ranges).\n3. **London (European) Session**: ~08:00–17:00 UTC (Largest share of global FX turnover; major trend initiations and breakouts).\n4. **New York Session**: ~13:00–22:00 UTC (USD macro releases at 12:30/13:30 UTC; strong continuation or reversal flows).\n\n### Session Overlaps & Daylight Saving Shifts\n- **London–New York Overlap (~13:00–17:00 UTC standard time)**: Peak volume, tightest spreads, fastest price discovery.\n- **Daylight Saving Time (DST) Trap**: The U.S. switches clocks in **March and November**, while Europe/UK switch in **late March and late October**. For 2–3 weeks each spring and autumn, the London–NY overlap shifts by one hour in UTC, and New York rollover (17:00 ET) shifts between **21:00 UTC (EDT)** and **22:00 UTC (EST)**.',
        demonstration:
          'Practical daily schedule check:\n- Always set your Economic Calendar and charting platform to your local timezone.\n- Avoid opening trades between **21:45 and 22:15 UTC** (winter) or **20:45 and 21:15 UTC** (summer) during daily bank rollover, when liquidity thins and spreads spike temporarily.',
        common_mistakes: [
          'Trading wide-spread illiquid hours at 17:00 NY rollover with tight intraday stop-losses.',
          'Forgetting the 2-to-3-week U.S./EU DST mismatch in March and late October.',
          'Expecting explosive London-style breakouts in EUR/USD during mid-Tokyo quiet ranges.',
        ],
        summary_recap:
          'Liquidity concentrates in London and New York sessions and peaks during their overlap. Always account for daily rollover and spring/autumn DST transitions.',
        practical_exercise: {
          title: 'Local Timezone Session Map',
          objective: 'Convert UTC session hours to your own local clock.',
          steps: [
            'Check your current UTC offset (e.g., UTC+0, UTC+3, UTC-5).',
            'Write down your local start and end times for Tokyo, London, New York, and the London–NY overlap.',
            'Mark the 17:00 New York daily rollover window in your local time as a "wide-spread caution window".',
          ],
          deliverable: 'A personal local-time session reference card.',
        },
        visual_key: 'trading-sessions-timeline',
        duration_minutes: 13,
        tags: ['sessions', 'London', 'New York', 'Tokyo', 'DST'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0108-q1',
            question: 'Why does the London–New York session overlap shift temporarily in March and October/November?',
            options: [
              'The U.S. and Europe change Daylight Saving Time clocks on different dates',
              'London closes permanently in October',
              'Central banks pause trading',
              'Computers reset every month',
            ],
            correct_index: 0,
            explanation: 'North America and Europe transition between standard and daylight time weeks apart, shifting UTC session alignments.',
          },
          {
            id: 'l0108-q2',
            question: 'What commonly happens around daily bank rollover (17:00 New York time)?',
            options: [
              'Spreads temporarily widen due to thin liquidity and swap accounting',
              'All stop-losses are waived',
              'Spreads drop to negative values',
              'Weekend gaps close automatically',
            ],
            correct_index: 0,
            explanation: 'Liquidity providers briefly pull quotes during settlement transition at 17:00 ET, widening spreads.',
          },
          {
            id: 'l0108-q3',
            question: 'Which session accounts for the single largest share of global FX turnover?',
            options: ['Sydney', 'London', 'Wellington', 'Zurich'],
            correct_index: 1,
            explanation: 'London historically handles the largest single geographic share of daily global FX volume.',
          },
        ],
      },
      {
        id: 'lesson-01-09',
        title: 'Broker Types, Regulation, Execution and Platform Due Diligence',
        category: 'Introduction to Forex',
        summary: 'Learn how to verify broker regulation, understand dealing-desk vs. agency execution, and spot common retail FX scams.',
        learning_objective: 'Conduct regulatory due diligence on a Forex broker and recognize red flags highlighted by regulators.',
        introduction:
          'Before funding any trading account, choosing a properly regulated, transparent broker protects your capital far more than any chart indicator.',
        content:
          '### Execution Models\n- **Market Maker / Dealing Desk**: Acts as counterparty to client trades, internalizing or hedging net exposure; typically offers fixed or standard spreads.\n- **STP / ECN / Agency Models**: Routes orders to external liquidity providers with variable spreads and often separate commissions.\n\n### Regulatory Verification & Red Flags (CFTC / NFA / FCA Guidance)\nAlways verify a broker’s license number directly on the **official regulator’s website** (not just a logo in the broker’s footer): e.g., **CFTC/NFA** (United States), **FCA** (United Kingdom), **ASIC** (Australia), **BaFin** (Germany), **FINMA** (Switzerland), **MAS** (Singapore), or **IIROC/CIRO** (Canada).\n\n**Common Warning Signs**:\n- Promises of "guaranteed monthly returns" or "risk-free AI bots".\n- Unsolicited social-media messages asking you to send crypto to an unverified trading pool.\n- Withdrawal delays, surprise "tax release fees" before withdrawing, or unregulated offshore shell entities.',
        demonstration:
          'Due Diligence Checklist before depositing:\n1. Look up the exact legal entity name in your broker’s Terms & Conditions.\n2. Cross-check that entity’s registration number on the official regulator registry (e.g., NFA BASIC or FCA Register).\n3. Confirm client fund segregation rules, withdrawal methods, and negative-balance protection terms.',
        common_mistakes: [
          'Trusting a "regulated" badge image on a website without verifying the license ID on the regulator’s own portal.',
          'Sending money to an individual’s wallet or account manager promising fixed weekly profits.',
          'Ignoring which specific legal subsidiary holds your account (many firms operate one strict onshore entity and one loosely regulated offshore entity).',
        ],
        summary_recap:
          'Verify broker registration directly with tier-1 regulators, read exact legal entity terms, and reject any entity promising guaranteed profits.',
        practical_exercise: {
          title: 'Broker Regulatory Verification Audit',
          objective: 'Practice verifying an actual broker registration using public regulatory databases.',
          steps: [
            'Visit NFA BASIC (nfa.futures.org) or the FCA Register website.',
            'Look up one established retail FX broker by legal name.',
            'Verify its active status, permitted activities, and disciplinary history.',
          ],
          deliverable: 'Written confirmation notes of legal entity name, regulator ID, and fund segregation policy.',
        },
        visual_key: 'broker-due-diligence',
        duration_minutes: 13,
        tags: ['regulation', 'CFTC', 'NFA', 'scam awareness', 'execution'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.NFA_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0109-q1',
            question: 'How should you verify whether a Forex broker is genuinely regulated?',
            options: [
              'Check the footer logo on the broker’s homepage',
              'Search the broker’s legal entity and license number directly on the official regulator’s public registry',
              'Ask in a Telegram group',
              'Check if the website uses dark mode',
            ],
            correct_index: 1,
            explanation: 'Scam sites routinely copy regulator logos; only the official regulator database confirms valid authorization.',
          },
          {
            id: 'l0109-q2',
            question: 'Which pitch is a classic regulatory red flag of Forex fraud?',
            options: [
              'Clear risk disclosures warning of potential losses',
              '"Guaranteed 15% weekly profits with zero risk"',
              'Standard demo account practice before live trading',
              'Transparent contract specification sheets',
            ],
            correct_index: 1,
            explanation: 'Financial markets carry inherent risk; any promise of guaranteed or risk-free returns is fraudulent.',
          },
          {
            id: 'l0109-q3',
            question: 'Why must you check the exact legal subsidiary holding your account?',
            options: [
              'A brand may hold a tier-1 license in one country while onboarding international users under a less-protected offshore subsidiary',
              'All subsidiaries share identical leverage and investor compensation rules',
              'Subsidiaries only affect chart colors',
              'It changes the number of decimals in EUR/USD',
            ],
            correct_index: 0,
            explanation: 'Investor protection, leverage limits, and segregated custody vary by the specific legal entity you sign up with.',
          },
        ],
      },
      {
        id: 'lesson-01-10',
        title: 'Demo Accounts and the Order Ticket in MT4, MT5 or Other Platforms',
        category: 'Introduction to Forex',
        summary: 'Learn every field of a standard trading order ticket—symbol, volume, order type, stop-loss, take-profit—and how to use demo accounts effectively.',
        learning_objective: 'Navigate a standard order ticket (MT4/MT5/web terminal), place and modify a demo order, and recognize demo vs. live differences.',
        introduction:
          'Before risking real capital, every trader should master the order ticket on a free simulated (demo) account until placing, modifying, and closing trades becomes second nature.',
        content:
          '### Anatomy of the Order Ticket\nWhether you use MetaTrader 4 (MT4), MetaTrader 5 (MT5), cTrader, or a web platform, the order ticket contains the same core fields:\n1. **Symbol**: Instrument being traded (e.g., `EURUSD`).\n2. **Execution / Order Type**: `Market Execution` or `Pending Order` (Buy/Sell Limit, Buy/Sell Stop).\n3. **Volume (Lots)**: Position size (`0.01`, `0.10`, `1.00`). Always double-check decimals!\n4. **Stop-Loss (SL)** and **Take-Profit (TP)**: Exact price levels where the trade closes automatically.\n5. **Comment / Magic Number** (optional): Useful for tagging strategy names.\n\n### Demo vs. Live Execution Differences\nDemo accounts are vital for practicing platform navigation and testing rules, **but they are simulated**:\n- Demo feeds often assume instant fills without partial fills or real order-book depth.\n- Demo accounts lack real emotional stress—losing fake money feels painless compared to risking hard-earned savings.\n- Always transition to live markets (only if appropriate for your finances) with the smallest micro-lot size (`0.01`) first.',
        demonstration:
          'Step-by-step Demo Order Drill:\n1. Open a demo account and set simulated starting balance close to your realistic future capital (e.g., $1,000, not $100,000).\n2. Select `EURUSD`, set Volume = `0.02`.\n3. Choose `Market Execution`, enter your pre-calculated SL (e.g., 30 pips below entry) and TP (e.g., 60 pips above entry).\n4. Submit the order, verify the Trade tab shows open SL/TP prices, practice modifying SL to breakeven, and close the position.',
        common_mistakes: [
          'Opening a $100,000 demo account and trading 5.00 lots recklessly—building bad habits that blow up small real accounts.',
          'Typing `1.00` lot instead of `0.10` or `0.01` due to a decimal slip on the order ticket.',
          'Thinking demo profitability guarantees identical execution on a live account during volatile news.',
        ],
        summary_recap:
          'Master the order ticket fields on a realistic-balance demo account, attach SL and TP on every trade, and recognize that live execution involves real slippage and emotions.',
        practical_exercise: {
          title: 'Complete Demo Order Lifecycle',
          objective: 'Execute, modify, and review a full demo trade cycle.',
          steps: [
            'Open a demo terminal or use the MeridianFX Chart Practice & Position Calculator tools.',
            'Calculate a 0.01 or 0.02 lot position with a defined SL and 1:2 TP.',
            'Place the demo trade, verify spread cost on open, modify the TP, and record the difference between demo fill and live-market slippage risk.',
          ],
          deliverable: 'Completed order log showing entry price, SL, TP, lot size, and spread paid.',
        },
        visual_key: 'order-ticket-mockup',
        duration_minutes: 15,
        tags: ['MT4', 'MT5', 'demo account', 'order ticket'],
        sources: [OFFICIAL_SOURCES.CFTC_FX, OFFICIAL_SOURCES.NFA_EDU],
        quiz: [
          {
            id: 'l0110-q1',
            question: 'Why should beginners configure a demo account with a realistic balance rather than $100,000+',
            options: [
              'So position sizing, risk percentages, and margin behavior reflect real conditions they will face',
              'Because $100,000 demo accounts have slower charts',
              'Because MT5 bans balances over $10,000',
              'Because spreads are lower on small accounts',
            ],
            correct_index: 0,
            explanation: 'Practicing with realistic capital builds genuine position-sizing discipline.',
          },
          {
            id: 'l0110-q2',
            question: 'Which field on an order ticket determines whether you risk $0.10 per pip or $10.00 per pip on EUR/USD?',
            options: ['Timeframe', 'Volume (Lot Size)', 'Chart theme', 'Magic Number'],
            correct_index: 1,
            explanation: 'Volume (lot size) directly controls dollar exposure per pip movement.',
          },
          {
            id: 'l0110-q3',
            question: 'Which statement compares demo and live execution accurately?',
            options: [
              'Live accounts can experience real slippage, requotes, wider news spreads, and psychological pressure absent in demo accounts',
              'Demo accounts have higher risk than live accounts',
              'Live accounts never experience slippage',
              'Order tickets work differently in live accounts',
            ],
            correct_index: 0,
            explanation: 'Live liquidity constraints and real-money emotions differentiate live trading from simulated demo feeds.',
          },
        ],
      },
    ],
  },

  {
    id: 'course-02-currency-pairs',
    slug: 'understanding-currency-pairs',
    course_number: 2,
    title: '02. Understanding Currency Pairs',
    category: 'Understanding currency pairs',
    level: 'Beginner',
    level_label: 'Beginner',
    description:
      'Master currency quote conventions, major, minor/cross and exotic classifications, direct vs. indirect quotes, account-currency pip conversion, correlation dynamics, and how to select pairs responsibly.',
    prerequisites: '01. Introduction to Forex',
    learning_outcomes: [
      'Classify pairs into Majors, Minors/Crosses, and Exotics with realistic spread and volatility expectations.',
      'Convert pip values accurately into your account currency (USD, EUR, GBP, etc.).',
      'Assess relative currency strength and avoid accidental double-exposure through correlated pairs.',
    ],
    estimated_hours: 3.0,
    cover_image_url: '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    assessment: [
      {
        id: 'c2-a1',
        question: 'What defines a "Major" Forex currency pair?',
        options: [
          'Any pair containing Gold',
          'A liquid pair pairing the US Dollar (USD) with another major G10 currency such as EUR, JPY, GBP, CHF, CAD, AUD, or NZD',
          'Any pair with a spread above 15 pips',
          'Only pairs traded in Asia',
        ],
        correct_index: 1,
        explanation: 'Major pairs always include USD paired with major developed-market currencies and offer the highest liquidity and lowest spreads.',
      },
      {
        id: 'c2-a2',
        question: 'If EUR/USD rises, does that guarantee EUR is also rising against GBP (EUR/GBP)?',
        options: [
          'Yes, always',
          'No—EUR/USD rising only shows EUR strengthening vs. USD; GBP could be strengthening even faster against USD',
          'Only on Fridays',
          'Yes, because EUR is always the strongest currency',
        ],
        correct_index: 1,
        explanation: 'A pair only expresses relative strength between its two currencies. Cross-pair rates reflect relative performance between both.',
      },
      {
        id: 'c2-a3',
        question: 'Which pair classification typically carries the widest spreads and sharpest gap/slippage risk?',
        options: ['Majors', 'Exotic pairs (e.g., USD/TRY, USD/ZAR)', 'EUR/USD', 'USD/JPY'],
        correct_index: 1,
        explanation: 'Exotic pairs pair a major currency with an emerging-market currency that has lower liquidity and wider bid-ask spreads.',
      },
      {
        id: 'c2-a4',
        question: 'If you open simultaneous BUY trades on EUR/USD and GBP/USD (both USD-short) plus SELL USD/CHF (also USD-short), what risk occurs?',
        options: [
          'Perfect risk diversification',
          'Concentrated shared exposure to a single USD move—effectively multiplying your USD risk',
          'Zero spread cost',
          'Automatic arbitrage profits',
        ],
        correct_index: 1,
        explanation: 'Correlated trades sharing the USD side behave like one oversized bet on USD direction.',
      },
      {
        id: 'c2-a5',
        question: 'Why does pip value in USD fluctuate slightly on USD/CAD or USD/JPY compared to EUR/USD?',
        options: [
          'Because USD is the quote currency in EUR/USD, whereas USD is the base currency in USD/CAD and USD/JPY, requiring conversion by the live exchange rate',
          'Because USD/JPY uses 5 decimal pips',
          'Because brokers arbitrarily change contract sizes hourly',
          'It never fluctuates',
        ],
        correct_index: 0,
        explanation: 'When the quote currency differs from your account currency, pip value must be converted back at the current exchange rate.',
      },
    ],
    lessons: [
      {
        id: 'lesson-02-01',
        title: 'Base Versus Quote Currency and Quote Conventions',
        category: 'Understanding currency pairs',
        summary: 'Learn standard interbank quoting order (why EUR comes before GBP, GBP before AUD, and USD before JPY/CAD/CHF).',
        learning_objective: 'Explain standard market priority order for quoting currency pairs.',
        introduction:
          'Have you ever wondered why the market quotes EUR/GBP instead of GBP/EUR, or GBP/USD instead of USD/GBP? Interbank quoting follows an established historical priority hierarchy.',
        content:
          '### Standard Interbank Quoting Hierarchy\nInstitutional currency conventions rank major currencies roughly in this order for spot quotation:\n1. **EUR** (Euro)\n2. **GBP** (British Pound)\n3. **AUD** (Australian Dollar)\n4. **NZD** (New Zealand Dollar)\n5. **USD** (US Dollar)\n6. **CAD** (Canadian Dollar)\n7. **CHF** (Swiss Franc)\n8. **JPY** (Japanese Yen)\n\nWhichever currency ranks higher generally sits on the left as the **Base Currency**—explaining why we trade **EUR/USD**, **GBP/USD**, **AUD/USD**, **EUR/GBP**, and **USD/JPY**, **USD/CAD**, **USD/CHF**.\n\n### Practical Consequence\nUnderstanding conventions prevents mental confusion when switching between pairs like **EUR/USD** (buying means bullish Euro / bearish Dollar) and **USD/CHF** (buying means bullish Dollar / bearish Franc).',
        demonstration:
          'Quick Convention Check:\n- Compare **EUR** vs **GBP** -> EUR is higher -> Quoted **EUR/GBP**.\n- Compare **AUD** vs **JPY** -> AUD is higher -> Quoted **AUD/JPY**.\n- Compare **USD** vs **CAD** -> USD is higher -> Quoted **USD/CAD**.',
        common_mistakes: [
          'Assuming all pairs have USD as the base currency—only USD/JPY, USD/CAD, and USD/CHF among the 7 majors do.',
          'Misreading EUR/GBP charts as "stronger GBP makes the chart go up" (a stronger GBP actually pushes EUR/GBP *down*).',
        ],
        summary_recap:
          'Interbank quoting hierarchy determines which currency is Base (left) and Quote (right). Always check direction relative to the left currency.',
        practical_exercise: {
          title: 'Convention & Direction Matrix',
          objective: 'Confirm base/quote conventions across 6 pairs.',
          steps: [
            'List EUR/USD, GBP/USD, AUD/USD, USD/JPY, USD/CAD, and EUR/GBP.',
            'Write down which currency strengthens when each chart rises.',
            'Write down which currency strengthens when each chart falls.',
          ],
          deliverable: 'Six verified directional rules.',
        },
        visual_key: 'currency-quote-anatomy',
        duration_minutes: 10,
        tags: ['quote conventions', 'ISO hierarchy'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0201-q1',
            question: 'If GBP strengthens rapidly while EUR remains unchanged, what happens to the EUR/GBP chart?',
            options: ['EUR/GBP rises', 'EUR/GBP falls', 'EUR/GBP stays unchanged', 'Only USD/JPY moves'],
            correct_index: 1,
            explanation: 'GBP is the quote currency in EUR/GBP; stronger GBP means 1 EUR buys fewer GBP, pushing EUR/GBP lower.',
          },
          {
            id: 'l0201-q2',
            question: 'In AUD/NZD, which currency is the base currency?',
            options: ['NZD', 'AUD', 'USD', 'JPY'],
            correct_index: 1,
            explanation: 'AUD appears first and precedes NZD in interbank quoting priority.',
          },
          {
            id: 'l0201-q3',
            question: 'Among the 7 major pairs, which three place USD as the base currency?',
            options: [
              'EUR/USD, GBP/USD, AUD/USD',
              'USD/JPY, USD/CAD, USD/CHF',
              'NZD/USD, EUR/USD, USD/JPY',
              'None of them',
            ],
            correct_index: 1,
            explanation: 'USD precedes CAD, CHF, and JPY in standard interbank conventions.',
          },
        ],
      },
      {
        id: 'lesson-02-02',
        title: 'Major, Minor/Cross and Exotic Pairs',
        category: 'Understanding currency pairs',
        summary: 'Compare the liquidity, spreads, and characteristics of Major, Minor/Cross, and Exotic currency pairs.',
        learning_objective: 'Categorize Forex pairs into Majors, Minors/Crosses, and Exotics and evaluate tradeability for beginners.',
        introduction:
          'Not all currency pairs behave the same way. Some cost less than one pip to enter and move smoothly; others carry wide spreads and sudden jumps.',
        content:
          '### The Three Pair Categories\n1. **Major Pairs**: Pair USD with major G10 economies — **EUR/USD, USD/JPY, GBP/USD, USD/CHF, AUD/USD, USD/CAD, NZD/USD**. Highest global turnover, tightest spreads, deepest liquidity.\n2. **Minor (Cross) Pairs**: Major currencies paired *without* USD — e.g., **EUR/GBP, EUR/JPY, GBP/JPY, AUD/CAD, CHF/JPY**. Tight to moderate spreads; popular for trading non-USD divergence (e.g., EUR vs. JPY).\n3. **Exotic Pairs**: One major currency paired with an emerging or smaller economy currency — e.g., **USD/TRY, USD/ZAR, USD/MXN, EUR/PLN**. Much lower liquidity, wider spreads, sharper gap risk, and higher overnight financing.',
        demonstration:
          'Illustrative comparison:\n- **EUR/USD** (Major): Spread ~0.2–1.2 pips, smooth intraday liquidity.\n- **GBP/JPY** (Minor/Cross): Spread ~1.5–3.0 pips, much larger daily pip swings.\n- **USD/ZAR** (Exotic): Spread can exceed 30–100+ pips equivalent with sharp spikes during local news.',
        common_mistakes: [
          'Starting out as a beginner on high-spread Exotic pairs or volatile crosses like GBP/JPY without adjusting stop distance and lot size.',
          'Ignoring how wide exotic spreads erode short-term strategy expectancy.',
        ],
        summary_recap:
          'Beginners should focus on liquid Major pairs first to benefit from low transaction costs and cleaner technical price behavior.',
        practical_exercise: {
          title: 'Pair Classification & Spread Audit',
          objective: 'Compare live/demo spreads across all three pair classes.',
          steps: [
            'Check the current quoted Bid/Ask spread on your demo or MeridianFX Markets page for EUR/USD, EUR/GBP, and one exotic pair.',
            'Record the spread in pips and compare it against typical daily ATR movement.',
          ],
          deliverable: 'Comparison table of spreads across Major, Minor, and Exotic pairs.',
        },
        visual_key: 'pair-categories-matrix',
        duration_minutes: 11,
        tags: ['majors', 'minors', 'crosses', 'exotics'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY, OFFICIAL_SOURCES.CFTC_FX],
        quiz: [
          {
            id: 'l0202-q1',
            question: 'Which of the following is classified as a Minor (Cross) currency pair?',
            options: ['EUR/USD', 'EUR/JPY', 'USD/MXN', 'USD/CAD'],
            correct_index: 1,
            explanation: 'EUR/JPY pairs two major currencies without involving USD, making it a cross pair.',
          },
          {
            id: 'l0202-q2',
            question: 'Why are Major pairs generally recommended for beginners?',
            options: [
              'They have the highest liquidity and lowest spread costs',
              'They never move against your position',
              'They are exempt from margin rules',
              'They pay daily dividends',
            ],
            correct_index: 0,
            explanation: 'Deep liquidity keeps spreads tight and reduces erratic slippage compared to exotics.',
          },
          {
            id: 'l0202-q3',
            question: 'USD/ZAR and USD/TRY belong to which pair category?',
            options: ['Majors', 'Crosses', 'Exotics', 'Commodities'],
            correct_index: 2,
            explanation: 'They pair USD with emerging-market currencies (South African Rand, Turkish Lira).',
          },
        ],
      },
      {
        id: 'lesson-02-03',
        title: "How a Pair's Price Movement Is Interpreted",
        category: 'Understanding currency pairs',
        summary: 'Understand why a pair moves when one currency strengthens, the other weakens, or both move at different speeds.',
        learning_objective: 'Diagnose whether a currency pair move is driven by base strength, quote weakness, or both.',
        introduction:
          'When EUR/USD drops sharply, beginners often assume "the Euro is crashing". In reality, the Euro might be totally flat while the US Dollar is surging against everything!',
        content:
          '### Relative Price Tug-of-War\nEvery Forex chart shows a **ratio**: `Base / Quote`. Therefore, a chart rises in three possible ways:\n1. Base strengthens while Quote is steady.\n2. Base is steady while Quote weakens.\n3. Both happen simultaneously—creating the cleanest trends.\n\n**Professional Note**: A pair rising means its base currency is strengthening *relative to its quote currency*; it does not mean the base currency is strengthening against every currency in the world.',
        demonstration:
          'Illustrative check:\n- Suppose **EUR/USD falls**, **GBP/USD falls**, and **USD/JPY rises** all at 13:30 UTC after US CPI inflation data.\n- What moved? Not Europe, Britain, and Japan simultaneously—**USD** surged across the board.\n- Comparing 2–3 pairs prevents misattributing the true macro driver.',
        common_mistakes: [
          'Looking at only one chart in isolation and failing to see whether Base or Quote is driving the move.',
          'Assuming EUR strength vs USD guarantees EUR strength vs GBP.',
        ],
        summary_recap:
          'Always interpret pair movement as a relative ratio between two currencies, verified by cross-checking other pairs sharing those currencies.',
        practical_exercise: {
          title: 'Driver Isolation Exercise',
          objective: 'Separate Base-driven moves from Quote-driven moves.',
          steps: [
            'Open the Markets page and inspect EUR/USD, GBP/USD, and USD/JPY daily % changes.',
            'Identify whether USD appears uniformly strong/weak across all three or if one non-USD currency is moving independently.',
          ],
          deliverable: 'Short 3-sentence diagnosis of today’s dominant currency driver.',
        },
        visual_key: 'currency-strength-bars',
        duration_minutes: 10,
        tags: ['relative strength', 'ratio', 'price interpretation'],
        sources: [OFFICIAL_SOURCES.BIS_HUB],
        quiz: [
          {
            id: 'l0203-q1',
            question: 'If EUR/USD rises while EUR/JPY and EUR/GBP are falling, what is most likely happening?',
            options: [
              'USD is weakening broadly while EUR is actually weak vs. GBP and JPY',
              'EUR is the strongest currency globally',
              'The broker chart is broken',
              'JPY is pegged to USD',
            ],
            correct_index: 0,
            explanation: 'EUR/USD can still rise if USD falls even faster than EUR falls against other currencies.',
          },
          {
            id: 'l0203-q2',
            question: 'What creates the cleanest, strongest directional trends in a single currency pair?',
            options: [
              'Both currencies having identical interest rates',
              'One currency strengthening broadly while the other weakens broadly (policy divergence)',
              'Trading on Sunday evening',
              'Low volume holidays',
            ],
            correct_index: 1,
            explanation: 'Divergence—strongest vs. weakest—drives sustained trends.',
          },
        ],
      },
      {
        id: 'lesson-02-04',
        title: 'Direct and Indirect Quotations',
        category: 'Understanding currency pairs',
        summary: 'Learn how direct vs. indirect quoting works depending on your domestic account currency.',
        learning_objective: 'Distinguish direct quotes from indirect quotes relative to a trader’s home account currency.',
        introduction:
          'Whether a pair is called a "direct" or "indirect" quote depends on where you live—or more precisely, what currency your trading account is denominated in.',
        content:
          '### Direct vs. Indirect Quoting\n- **Direct Quote** (from a USD-account perspective): Foreign currency as Base, domestic currency as Quote (e.g., **EUR/USD**, **GBP/USD**, **AUD/USD** — showing how many USD buy 1 foreign unit).\n- **Indirect Quote** (from a USD-account perspective): Domestic currency as Base, foreign currency as Quote (e.g., **USD/JPY**, **USD/CAD**, **USD/CHF** — showing how many foreign units 1 USD buys).\n\n### Why It Matters\nFor a Euro-denominated account, EUR/USD is an *indirect* quote, whereas USD/CHF requires cross conversion into EUR! Direct quotes to your account currency have constant pip values; indirect or cross quotes have dynamic pip values.',
        demonstration:
          'For a **USD-funded account**:\n- **EUR/USD = 1.0800**: Direct quote -> 1 pip on 1 standard lot is always exactly **$10.00 USD**.\n- **USD/CAD = 1.3800**: Indirect quote -> 1 pip on 1 standard lot is `10 CAD`, which equals `10 / 1.3800 = $7.25 USD`.',
        common_mistakes: [
          'Assuming every pair has a fixed $10/pip value on a USD account regardless of whether USD is base or quote.',
          'Ignoring account currency differences when using online risk calculators designed for USD accounts on a EUR or GBP account.',
        ],
        summary_recap:
          'Direct quotes price foreign currency in your account currency (fixed pip value). Indirect quotes price your account currency in foreign units (variable pip value).',
        practical_exercise: {
          title: 'Account Perspective Classification',
          objective: 'Classify 4 pairs from both USD and EUR account perspectives.',
          steps: [
            'Take EUR/USD, USD/JPY, GBP/USD, and EUR/GBP.',
            'Label each as Direct, Indirect, or Cross for a USD account.',
            'Repeat the exercise assuming a EUR-denominated account.',
          ],
          deliverable: 'Two classification lists comparing USD vs. EUR accounts.',
        },
        visual_key: 'direct-indirect-quotes',
        duration_minutes: 11,
        tags: ['direct quote', 'indirect quote', 'account currency'],
        sources: [OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0204-q1',
            question: 'For a trader with a USD-denominated account, which pair has a fixed $10.00 pip value per standard lot?',
            options: ['USD/JPY', 'USD/CHF', 'GBP/USD', 'EUR/GBP'],
            correct_index: 2,
            explanation: 'In GBP/USD, USD is the quote currency, making 1 pip on 100,000 GBP strictly equal to $10.00 USD.',
          },
          {
            id: 'l0204-q2',
            question: 'For a GBP-denominated account, EUR/GBP is a:',
            options: ['Direct quote (fixed £10 per pip per standard lot)', 'Indirect quote', 'Exotic pair', 'Commodity'],
            correct_index: 0,
            explanation: 'GBP is the quote currency, matching the trader’s GBP account currency.',
          },
        ],
      },
      {
        id: 'lesson-02-05',
        title: 'Pip Value and Conversion into Account Currency',
        category: 'Understanding currency pairs',
        summary: 'Learn the exact universal pip-value formula and how to convert quote-currency profits/losses into your account currency.',
        learning_objective: 'Calculate exact pip value in any account currency using the universal pip-value formula.',
        introduction:
          'Knowing a trade risks "35 pips" is meaningless until you convert those 35 pips into actual dollars, euros, or pounds in your account.',
        content:
          '### Universal Pip-Value Formula\n`Pip Value (in Quote Currency) = Pip Size × Lot Units`\n\nThen convert into your **Account Currency**:\n- If **Quote Currency = Account Currency**: Done!\n- If **Base Currency = Account Currency** (e.g. USD/JPY on a USD account): `Pip Value = (Pip Size × Units) / Current Exchange Rate`.\n- If **Neither Currency = Account Currency** (e.g. EUR/GBP on a USD account): Multiply Quote pip value by `GBP/USD` rate (or divide by `USD/GBP`).\n\n### Worked Illustrative Examples (1.00 Standard Lot = 100,000 Units)\n1. **EUR/USD** (USD Account): `0.0001 × 100,000 = $10.00 USD / pip`.\n2. **USD/JPY at 150.00** (USD Account): `0.01 × 100,000 = 1,000 JPY` -> `1,000 / 150.00 = $6.67 USD / pip`.\n3. **EUR/GBP** with **GBP/USD = 1.2700** (USD Account): `0.0001 × 100,000 = £10.00 GBP` -> `£10 × 1.2700 = $12.70 USD / pip`!',
        demonstration:
          'Notice how **EUR/GBP costs ~$12.70/pip** per standard lot while **USD/JPY at 150.00 costs ~$6.67/pip**—almost **double** the dollar risk per pip! That is why using a uniform lot size across all pairs leads to uneven risk.',
        common_mistakes: [
          'Assuming every currency pair equals $10 per pip per standard lot—EUR/GBP is ~$12.70/pip and USD/JPY is ~$6.67/pip.',
          'Forgetting to update pip value calculations when exchange rates move significantly over months.',
        ],
        summary_recap:
          'Calculate pip value in the quote currency first (`Pip Size × Units`), then convert into your account currency so your dollar risk stays exact.',
        practical_exercise: {
          title: 'Pip Value Conversion Lab',
          objective: 'Use both manual math and the Academy Pip Value Calculator.',
          steps: [
            'Compute the USD pip value of 0.10 lots (10,000 units) of USD/CAD at an illustrative rate of 1.3800.',
            'Verify your result using the Interactive Pip-Value Calculator in the Academy Tools tab.',
          ],
          deliverable: 'Manual calculation (`$1.00 / 1.3800 = $0.72/pip`) verified against the calculator.',
        },
        visual_key: 'pip-conversion-formula',
        duration_minutes: 15,
        tags: ['pip value', 'conversion', 'math'],
        sources: [OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0205-q1',
            question: 'At illustrative USD/JPY = 150.00, what is the approximate USD pip value of 0.10 lots (10,000 units)?',
            options: ['$1.00', '$0.67', '$6.67', '$10.00'],
            correct_index: 1,
            explanation: '(0.01 × 10,000) / 150.00 = 100 JPY / 150 = $0.67 per pip.',
          },
          {
            id: 'l0205-q2',
            question: 'Why does EUR/GBP carry a higher USD pip value than EUR/USD for identical lot sizes?',
            options: [
              'Because 1 GBP is worth more than 1 USD, so £10/pip converts to more than $10/pip',
              'Because EUR/GBP uses 3 decimals',
              'Because Europe uses higher leverage',
              'Because GBP is an exotic currency',
            ],
            correct_index: 0,
            explanation: 'Pip value originates in the quote currency (GBP) and converts into USD at the GBP/USD rate (~1.27).',
          },
        ],
      },
      {
        id: 'lesson-02-06',
        title: 'Spread, Liquidity, Volatility and Trading Costs by Pair',
        category: 'Understanding currency pairs',
        summary: 'Compare spread-to-range ratios across pairs so transaction costs do not silently destroy your trade expectancy.',
        learning_objective: 'Evaluate trading cost efficiency using the spread-to-ATR (volatility) ratio.',
        introduction:
          'A 2-pip spread on a pair that moves 120 pips a day is tiny; a 12-pip spread on a pair that moves 40 pips a day eats 30% of the daily range just to break even.',
        content:
          '### Cost Efficiency = Spread vs. Average Daily Range\nEvery pair has its own personality:\n- **Low Volatility / Tight Spread** (e.g., EUR/GBP, EUR/USD): Ideal for disciplined structure, requires patience.\n- **High Volatility / Moderate Spread** (e.g., GBP/JPY, XAU/USD): Large intraday swings offer room for targets, but require wider stops and smaller lot sizes.\n- **Low Liquidity / Wide Spread** (Exotics): High transaction friction makes short-term intraday strategies mathematically difficult.\n\n### Cost Friction Check\nIf your target profit is 15 pips and total round-turn cost (spread + commission) is 3 pips, you pay a **20% hurdle** on every winning trade and enlarge every loser!',
        demonstration:
          'Compare two illustrative intraday setups:\n- Setup A: **EUR/USD**, 1.0 pip total cost, 30 pip stop, 60 pip target -> Cost is **3.3%** of risk.\n- Setup B: **Exotic pair**, 12 pip spread, 30 pip stop, 60 pip target -> Cost is **40%** of risk. Even identical chart skill yields dramatically worse outcomes in Setup B.',
        common_mistakes: [
          'Scalping 5-to-10 pip targets on pairs whose spread + commission exceeds 2 pips.',
          'Judging a pair’s volatility purely by pip count without converting to ATR or percentage movement.',
        ],
        summary_recap:
          'Evaluate pairs by total cost relative to typical range (Spread-to-ATR). Keep transaction costs a tiny fraction of your stop-loss distance.',
        practical_exercise: {
          title: 'Spread-to-Range Friction Audit',
          objective: 'Measure whether a pair’s cost suits your intended stop distance.',
          steps: [
            'Pick 3 pairs from different categories.',
            'Divide current spread by a typical 30-pip or 50-pip stop distance.',
            'Flag any pair where cost exceeds 10% of stop distance as unsuitable for tight intraday setups.',
          ],
          deliverable: '3-pair transaction cost audit.',
        },
        visual_key: 'pair-cost-comparison',
        duration_minutes: 12,
        tags: ['spread', 'volatility', 'trading costs'],
        sources: [OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'l0206-q1',
            question: 'Why does a 4-pip total cost severely damage a scalping strategy targeting 10 pips?',
            options: [
              'It requires price to move 14 pips in your favor just to net 10, while a 10-pip stop only gives price 6 pips of adverse room',
              'Brokers refuse 10-pip targets',
              'Spreads are refunded when trades lose',
              'It makes pipettes irrelevant',
            ],
            correct_index: 0,
            explanation: 'High cost relative to stop/target distance dramatically tilts the math against short-term setups.',
          },
        ],
      },
      {
        id: 'lesson-02-07',
        title: 'Currency Strength and Relative Performance',
        category: 'Understanding currency pairs',
        summary: 'Learn how to rank individual currencies from strongest to weakest across baskets to identify high-clarity pairs.',
        learning_objective: 'Construct a basic relative currency strength comparison across major G8 currencies.',
        introduction:
          'Rather than scanning 28 pairs blindly, experienced analysts first identify which single currency is strongest and which is weakest—then look at the pair combining those two.',
        content:
          '### Basket Relative Performance\nInstead of only checking EUR/USD, compare EUR across **EUR/USD, EUR/JPY, EUR/GBP, EUR/AUD**. If a currency is gaining across 5 out of 6 crosses, it shows genuine underlying demand.\n\n### Combining Weakest vs. Strongest\n- Pairing a strong currency against another strong currency (e.g., strong USD vs. strong CAD) often creates choppy, overlapping ranges.\n- Pairing a clearly strong currency against a clearly weak currency often produces smoother directional trends.',
        demonstration:
          'Illustrative Currency Snapshot:\n- USD up vs EUR, GBP, JPY, AUD -> USD Rank #1.\n- JPY down vs USD, EUR, GBP, AUD -> JPY Rank #8.\n- Pairing Strong vs Weak highlights **USD/JPY** as having clear divergence, whereas **EUR/GBP** (both middle-ranked) may chop sideways.',
        common_mistakes: [
          'Using lagging "rainbow currency strength meters" blindly without checking upcoming central-bank events.',
          'Trading two equally strong currencies expecting a massive breakout.',
        ],
        summary_recap:
          'Measure individual currency performance across baskets to pair structural strength against weakness.',
        practical_exercise: {
          title: 'Daily G8 Strength Ranking',
          objective: 'Rank USD, EUR, GBP, and JPY relative performance.',
          steps: [
            'Check today’s Markets tab quotes for EUR/USD, GBP/USD, USD/JPY, and EUR/JPY.',
            'Score each currency (+1 for each pair where it gained, -1 where it lost).',
            'Identify the strongest and weakest currency of the session.',
          ],
          deliverable: 'Ranked currency strength scorecard.',
        },
        visual_key: 'currency-strength-bars',
        duration_minutes: 11,
        tags: ['currency strength', 'relative performance'],
        sources: [OFFICIAL_SOURCES.BIS_HUB],
        quiz: [
          {
            id: 'l0207-q1',
            question: 'What often happens when you trade a pair where both currencies have similar fundamental strength?',
            options: [
              'Price tends to range or chop sideways',
              'Spreads drop to zero',
              'Trendlines become unbreakable',
              'Risk disappears',
            ],
            correct_index: 0,
            explanation: 'Similar strength in both currencies reduces directional divergence.',
          },
        ],
      },
      {
        id: 'lesson-02-08',
        title: 'Currency Correlations and Changing Correlations',
        category: 'Understanding currency pairs',
        summary: 'Understand positive and negative correlation coefficients (+1 to -1) and why correlations shift across macro regimes.',
        learning_objective: 'Interpret currency correlation coefficients and explain why historical correlations are never permanent.',
        introduction:
          'Because currencies trade in pairs sharing USD, EUR, or JPY, many pairs move almost like mirror images or twins—until a central-bank shock breaks the relationship.',
        content:
          '### Correlation Scale (-1.0 to +1.0)\n- **Positive Correlation (+0.70 to +1.00)**: Pairs tend to move in the same direction (historically common for **EUR/USD** and **GBP/USD** because both quote USD).\n- **Negative Correlation (-0.70 to -1.00)**: Pairs tend to move in opposite directions (historically common for **EUR/USD** and **USD/CHF**).\n- **Near Zero (-0.25 to +0.25)**: Pairs move largely independently.\n\n### Why Correlations Change\nCorrelations are **not physical laws**. If the Bank of England surprises markets with a hawkish hike while the ECB stays dovish, EUR/USD and GBP/USD can temporarily decouple and move in opposite directions. Never treat correlation as a permanent hedge.',
        demonstration:
          'Illustrative example:\n- Normally, EUR/USD and USD/CHF show strong negative correlation (~ -0.85).\n- During a sharp Eurozone political shock, EUR drops while CHF (a safe haven) strengthens—causing EUR/USD to drop and USD/CHF to *also* drop (breaking the negative correlation).',
        common_mistakes: [
          'Assuming EUR/USD and GBP/USD will always move identically.',
          'Using a negatively correlated trade as a "risk-free hedge" when spreads and decoupling can cause both trades to lose.',
        ],
        summary_recap:
          'Correlation measures how closely two pairs move together over a lookback window, but shifts whenever monetary policy or risk regimes change.',
        practical_exercise: {
          title: 'Correlation Awareness Check',
          objective: 'Spot potential shared-driver correlation before opening multiple trades.',
          steps: [
            'Compare recent daily candles of EUR/USD, GBP/USD, and USD/CHF.',
            'Note whether they moved in lockstep or diverged due to UK/EU-specific news.',
          ],
          deliverable: 'Observation note on recent correlation behavior.',
        },
        visual_key: 'correlation-matrix',
        duration_minutes: 12,
        tags: ['correlation', 'exposure', 'regimes'],
        sources: [OFFICIAL_SOURCES.BIS_HUB],
        quiz: [
          {
            id: 'l0208-q1',
            question: 'What does a correlation of -0.88 between two pairs over the past 30 days indicate?',
            options: [
              'They tended to move in opposite directions most of the time during that period',
              'They are guaranteed to move identically forever',
              'One pair has zero spread',
              'Both pairs always go up together',
            ],
            correct_index: 0,
            explanation: 'Values near -1.0 reflect strong inverse movement over the measured window, though subject to regime shifts.',
          },
        ],
      },
      {
        id: 'lesson-02-09',
        title: 'Cross-Pair Analysis and Shared Currency Exposure',
        category: 'Understanding currency pairs',
        summary: 'Learn the math of synthetic crosses (EUR/JPY = EUR/USD × USD/JPY) and avoid hidden over-exposure.',
        learning_objective: 'Decompose a cross pair into its USD legs and audit total portfolio exposure by individual currency.',
        introduction:
          'If you buy EUR/USD and simultaneously sell USD/JPY, you may not realize you just created a synthetic long position in EUR/JPY—plus double exposure to USD!',
        content:
          '### Cross-Pair Math & Shared Exposure\nEvery cross pair is mathematically linked to its USD majors:\n- `EUR/JPY = EUR/USD × USD/JPY`\n- `EUR/GBP = EUR/USD ÷ GBP/USD`\n\n### The Hidden Risk Trap\nSuppose your rule is "max 1% risk per trade." You risk 1% buying EUR/USD, 1% buying GBP/USD, and 1% buying AUD/USD. Because all three positions are **short USD**, a single surprise U.S. inflation print could trigger all three stop-losses simultaneously—resulting in a **3% loss** instead of 1%.',
        demonstration:
          'Exposure Audit:\n- Trade 1: Buy EUR/USD (+EUR / -USD) risking 1%\n- Trade 2: Buy GBP/USD (+GBP / -USD) risking 1%\n- Net USD risk = **-2% exposure to USD strengthening**. Split risk (e.g., 0.5% each) or pick only the cleanest setup.',
        common_mistakes: [
          'Counting three correlated USD trades as "three independent 1% risks".',
          'Taking opposing signals on EUR/USD and EUR/GBP without checking the net GBP/USD implication.',
        ],
        summary_recap:
          'Always break open positions into their constituent currencies so you never accidentally multiply risk on a single currency shock.',
        practical_exercise: {
          title: 'Portfolio Currency Exposure Tally',
          objective: 'Identify hidden stacked exposure across three sample positions.',
          steps: [
            'Write down: Long EUR/USD, Short USD/CHF, Long AUD/USD (1% risk each).',
            'Tally how many times you are long or short USD.',
            'Propose a capped risk adjustment to keep total USD event risk within 1%–1.5%.',
          ],
          deliverable: 'Exposure tally showing 3x short-USD concentration and proposed risk split.',
        },
        visual_key: 'correlation-matrix',
        duration_minutes: 12,
        tags: ['cross pairs', 'shared exposure', 'risk aggregation'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0209-q1',
            question: 'If you simultaneously Buy EUR/USD (1% risk) and Sell USD/CHF (1% risk), what is your concentrated single-event risk?',
            options: [
              'Approximately 2% risk to a sudden USD rally',
              '0% risk because they cancel out',
              '0.5% risk',
              'Risk only on CHF',
            ],
            correct_index: 0,
            explanation: 'Both positions benefit from USD falling and lose if USD surges abruptly.',
          },
        ],
      },
      {
        id: 'lesson-02-10',
        title: 'Selecting Instruments Based on Strategy, Costs and Availability',
        category: 'Understanding currency pairs',
        summary: 'Create a focused, disciplined watchlist matched to your trading schedule, strategy horizon, and spread budget.',
        learning_objective: 'Select 2–4 focus pairs aligned with your active trading hours, strategy type, and broker costs.',
        introduction:
          'Beginners often monitor 30 charts at once and end up confused. Professional specialists frequently focus deeply on just 2 to 4 instruments.',
        content:
          '### Watchlist Selection Criteria\n1. **Session Alignment**: Trade JPY/AUD pairs if your free hours align with Asia; trade EUR/GBP/USD/XAU if you trade London/New York.\n2. **Cost vs. Timeframe**: Lower-timeframe intraday strategies require razor-thin spreads (EUR/USD, USD/JPY). Higher-timeframe swing trades (4H/Daily) tolerate slightly wider spreads on crosses.\n3. **Data & Broker Availability**: Confirm contract sizes, trading hours, and swap rates on your specific regulated broker.',
        demonstration:
          'Sample Beginner Watchlist (London/NY schedule): `EUR/USD` (primary liquid anchor), `GBP/USD` (high-clarity sessions), `USD/JPY` (macro rate sensitivity). Three pairs are plenty to learn cleanly without distraction.',
        common_mistakes: [
          'Flipping randomly between 25 charts chasing action.',
          'Trading Asia-active pairs only at midnight Asia when spreads are widest, or trading EUR/USD during dead liquidity.',
        ],
        summary_recap:
          'Specialize in 2–4 liquid pairs that fit your daily schedule, strategy timeframe, and cost limits.',
        practical_exercise: {
          title: 'Build Your Personal 3-Pair Watchlist',
          objective: 'Customize your MeridianFX watchlist based on real schedule constraints.',
          steps: [
            'Write down the 2-hour window you can realistically study charts each day.',
            'Choose 3 pairs active during that window with low spread-to-ATR cost.',
            'Save those 3 pairs in your MeridianFX Profile/Dashboard Watchlist.',
          ],
          deliverable: '3-pair watchlist with documented trading window and cost check.',
        },
        visual_key: 'pair-categories-matrix',
        duration_minutes: 10,
        tags: ['watchlist', 'instrument selection'],
        sources: [OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0210-q1',
            question: 'Why is a focused 2–4 pair watchlist generally superior for learners than monitoring 30 instruments?',
            options: [
              'It builds deeper familiarity with pair behavior, costs, and reduces impulsive overtrading',
              'Platforms limit watchlists to 4 pairs',
              'More pairs reduce your leverage',
              'Only 4 pairs move each day',
            ],
            correct_index: 0,
            explanation: 'Specialization improves pattern context, cost awareness, and decision consistency.',
          },
        ],
      },
    ],
  },

  {
    id: 'course-03-candlesticks',
    slug: 'candlestick-patterns',
    course_number: 3,
    title: '03. Candlestick Patterns',
    category: 'Candlestick patterns',
    level: 'Beginner',
    level_label: 'Beginner',
    description:
      'Read Open, High, Low, Close (OHLC) candle anatomy and interpret single, dual, and triple candlestick formations in structural market context—never as blind standalone signals.',
    prerequisites: '01. Introduction to Forex, 02. Understanding Currency Pairs',
    learning_outcomes: [
      'Decode what the body, upper wick, and lower wick reveal about buyer and seller auction pressure.',
      'Identify major single, two-candle, and three-candle formations accurately.',
      'Apply strict structural location, candle-close, and confirmation rules—and recognize when patterns fail.',
    ],
    estimated_hours: 4.0,
    cover_image_url: '/src/assets/images/academy_forex_cover_1795085836938.jpg',
    assessment: [
      {
        id: 'c3-a1',
        question: 'Which four price points does a single candlestick summarize for its timeframe?',
        options: [
          'Bid, Ask, Spread, Swap',
          'Open, High, Low, Close (OHLC)',
          'Entry, Stop, TP1, TP2',
          'RSI, MACD, EMA, ATR',
        ],
        correct_index: 1,
        explanation: 'Every candlestick displays the Open, High, Low, and Close prices over one chosen time interval.',
      },
      {
        id: 'c3-a2',
        question: 'Why should a Bullish Hammer or Pin Bar NOT be treated as an automatic Buy signal anywhere on a chart?',
        options: [
          'Context matters: a rejection candle at major support after a downswing carries far higher significance than one floating in mid-range chop',
          'Hammers only work on 1-minute charts',
          'Brokers ban hammer trades',
          'Hammers are strictly bearish',
        ],
        correct_index: 0,
        explanation: 'Candlestick names describe short-term order flow; without structural location and confirmation, isolated shapes fail frequently.',
      },
      {
        id: 'c3-a3',
        question: 'When is a candlestick pattern officially formed and valid to evaluate?',
        options: [
          'The instant a wick appears mid-candle',
          'Only after the candle closes and locks in its OHLC values',
          'Five minutes before the candle opens',
          'Whenever volume ticks once',
        ],
        correct_index: 1,
        explanation: 'A candle’s shape can morph completely before the period ends; always wait for the candle close.',
      },
      {
        id: 'c3-a4',
        question: 'What is the defining feature of an Inside Bar?',
        options: [
          'Its entire high-to-low range fits within the high-to-low range of the preceding mother bar',
          'It has no wicks at all',
          'It gaps 100 pips higher',
          'It only forms on Gold',
        ],
        correct_index: 0,
        explanation: 'An inside bar signals temporary volatility contraction/consolidation within the prior bar’s range.',
      },
      {
        id: 'c3-a5',
        question: 'What distinguishes a Hammer from a Hanging Man if both have small upper bodies and long lower wicks?',
        options: [
          'Their color only',
          'Market context: Hammer appears after a downtrend (potential bullish reversal), Hanging Man appears after an uptrend (potential bearish warning)',
          'Hanging Man has no open price',
          'They are unrelated to trend direction',
        ],
        correct_index: 1,
        explanation: 'Identical shapes mean different things depending on preceding directional context.',
      },
    ],
    lessons: [
      {
        id: 'lesson-03-01',
        title: 'Open, High, Low and Close; Candle Body and Wick',
        category: 'Candlestick patterns',
        summary: 'Learn the four OHLC data points inside every Japanese candlestick and what body-to-wick proportions communicate.',
        learning_objective: 'Read any candlestick’s Open, High, Low, Close, body, and wicks to summarize the battle between buyers and sellers.',
        introduction:
          'A candlestick is not just a colored rectangle—it is a compact story showing where price opened, how far buyers and sellers pushed it, and who won control by the time the clock ran out.',
        content:
          '### The Four Components of OHLC\n- **Open**: First traded/quoted price of the interval.\n- **High**: Highest price reached during the interval (tip of the upper wick/shadow).\n- **Low**: Lowest price reached during the interval (tip of the lower wick/shadow).\n- **Close**: Final price when the interval finishes.\n\n### Body vs. Wick (Shadow)\n- **Real Body**: Distance between Open and Close. A large body signals strong directional conviction.\n- **Upper & Lower Wicks**: Thin lines extending beyond the body showing prices that were visited and **rejected** before the close.\n\n**Professional Note**: Never interpret a candle name as a standalone buy/sell rule. Location, trend, confirmation, and stop-loss invalidation always govern decisions.',
        demonstration:
          'Read an illustrative **1-Hour Bullish Candle** on EUR/USD:\n- Open = `1.0800`, Low = `1.0785`, High = `1.0840`, Close = `1.0835`.\n- Notice sellers initially drove price down 15 pips to `1.0785`, buyers absorbed all supply and drove price up to `1.0840`, closing near the high (`1.0835`). Long lower wick + strong upper close = buyer rejection of lower prices.',
        common_mistakes: [
          'Acting on a candle shape before the candle actually closes.',
          'Ignoring wick length and looking only at green/red body color.',
        ],
        summary_recap:
          'Every candlestick compresses OHLC auction behavior. Large bodies reflect control; long wicks reflect price rejection.',
        practical_exercise: {
          title: 'OHLC Story Translation',
          objective: 'Translate raw OHLC numbers into buyer/seller narrative.',
          steps: [
            'Take OHLC: Open 1.2650, High 1.2695, Low 1.2645, Close 1.2655.',
            'Sketch the candle on paper and identify where the long wick sits.',
            'Explain in one sentence which side rejected the high.',
          ],
          deliverable: 'Hand-drawn labeled candle showing long upper rejection wick.',
        },
        visual_key: 'candlestick-anatomy',
        duration_minutes: 12,
        tags: ['OHLC', 'candle body', 'wicks'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0301-q1',
            question: 'In a bullish candle (Close > Open), where is the Open price located?',
            options: [
              'At the top of the real body',
              'At the bottom of the real body',
              'At the tip of the upper wick',
              'At the tip of the lower wick',
            ],
            correct_index: 1,
            explanation: 'Bullish candles open lower and close higher, so the Open forms the bottom edge of the body.',
          },
          {
            id: 'l0301-q2',
            question: 'What does a very long upper wick with a small body near the candle low usually signify?',
            options: [
              'Buyers pushed higher earlier in the period, but sellers rejected those highs before the close',
              'Buyers maintained full control into the close',
              'Zero price volatility occurred',
              'Spread dropped to zero',
            ],
            correct_index: 0,
            explanation: 'Long upper wicks demonstrate upward rejection during that interval.',
          },
        ],
      },
      {
        id: 'lesson-03-02',
        title: 'Bullish, Bearish and Neutral Candles',
        category: 'Candlestick patterns',
        summary: 'Compare momentum candles against neutral equilibrium candles to gauge shifts in conviction.',
        learning_objective: 'Distinguish strong directional candles from neutral indecision candles.',
        introduction:
          'Markets alternate between bursts of directional energy and pauses of balance. Spot the difference instantly from candle size and symmetry.',
        content:
          '### Three Functional Candle Families\n1. **Bullish Conviction**: Close substantially above Open, small wicks, body ≥ 60% of total range.\n2. **Bearish Conviction**: Close substantially below Open, small wicks, sellers in command into close.\n3. **Neutral / Indecision**: Open and Close sit very close together near the middle of the range, reflecting balance between buyers and sellers.',
        demonstration:
          'Compare three consecutive H4 candles approaching resistance: two wide-bodied bullish bars followed by a tiny neutral bar. That compression warns bullish momentum is pausing near supply.',
        common_mistakes: [
          'Expecting an immediate reversal just because one small neutral bar appears inside a powerful trend.',
        ],
        summary_recap:
          'Wide bodies indicate imbalance/conviction; narrow centered bodies indicate pause or temporary equilibrium.',
        practical_exercise: {
          title: 'Conviction vs. Indecision Scan',
          objective: 'Spot momentum transitions on historical charts.',
          steps: [
            'Open the Markets chart on 1H EUR/USD.',
            'Identify 3 strong conviction candles and 3 small neutral candles.',
            'Observe where the neutral candles tended to cluster (ranges or turning zones).',
          ],
          deliverable: 'Notes comparing where conviction vs. neutral bars form.',
        },
        visual_key: 'candlestick-anatomy',
        duration_minutes: 10,
        tags: ['bullish', 'bearish', 'neutral'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0302-q1',
            question: 'What does a series of shrinking candle bodies after an extended rally suggest?',
            options: [
              'Momentum may be slowing or consolidating',
              'Guaranteed crash on the next bar',
              'Broker platform malfunction',
              'Leverage increased automatically',
            ],
            correct_index: 0,
            explanation: 'Shrinking bodies show buyers are making less incremental progress per interval.',
          },
        ],
      },
      {
        id: 'lesson-03-03',
        title: 'Doji and Spinning Top',
        category: 'Candlestick patterns',
        summary: 'Understand Standard Doji, Dragonfly Doji, Gravestone Doji, and Spinning Top indecision patterns.',
        learning_objective: 'Identify Doji variants and Spinning Tops and evaluate why they are pause signals rather than automatic reversals.',
        introduction:
          'When buyers and sellers fight furiously for an hour yet finish at nearly the exact price they started, the chart prints a cross-like candle called a Doji.',
        content:
          '### Doji Variants\n- **Standard / Long-Legged Doji**: Open and Close virtually equal with upper and lower wicks—high two-way uncertainty.\n- **Dragonfly Doji**: Open and Close near the high with a long lower wick (bullish rejection of lows).\n- **Gravestone Doji**: Open and Close near the low with a long upper wick (bearish rejection of highs).\n- **Spinning Top**: Small real body (slightly larger than Doji) centered between roughly equal upper and lower wicks.\n\n### Context Rule\nIn a sideways range, Dojis appear constantly and mean very little. At a major Daily resistance or support level after an extended move, a Dragonfly or Gravestone Doji warns of potential exhaustion pending confirmation.',
        demonstration:
          'Wait for the *next* candle after a Doji at resistance: if the following bar closes strongly below the Doji’s low, sellers confirmed rejection. Without follow-through, the Doji was merely a pause.',
        common_mistakes: [
          'Shorting every Doji inside a strong uptrend—many Dojis resolve into trend continuation.',
          'Trading Dojis on noisy 1-minute charts.',
        ],
        summary_recap:
          'Dojis and Spinning Tops signal equilibrium. Wait for structural location and follow-through confirmation before acting.',
        practical_exercise: {
          title: 'Doji Context Filter',
          objective: 'Separate meaningful Dojis from range noise.',
          steps: [
            'Locate 4 Dojis on a 4H or Daily chart.',
            'Note which ones occurred at major swing highs/lows versus mid-range.',
            'Check how many led to reversals vs. trend continuation.',
          ],
          deliverable: '4-example Doji outcome log.',
        },
        visual_key: 'candlestick-single-patterns',
        duration_minutes: 11,
        tags: ['doji', 'spinning top', 'indecision'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0303-q1',
            question: 'Which Doji variant has its Open and Close near the candle’s low with a long upper wick?',
            options: ['Dragonfly Doji', 'Gravestone Doji', 'Marubozu', 'Morning Star'],
            correct_index: 1,
            explanation: 'A Gravestone Doji shows a failed rally rejected back down to the open/close near the low.',
          },
          {
            id: 'l0303-q2',
            question: 'Why should you avoid trading a Standard Doji immediately upon close in mid-range?',
            options: [
              'Dojis only express indecision; without a key level and confirmation bar, direction remains unresolved',
              'Dojis cannot have stop-losses',
              'Dojis only form in crypto',
              'Spreads triple during Dojis',
            ],
            correct_index: 0,
            explanation: 'Equilibrium is not a directional trigger by itself.',
          },
        ],
      },
      {
        id: 'lesson-03-04',
        title: 'Hammer, Inverted Hammer, Hanging Man and Shooting Star',
        category: 'Candlestick patterns',
        summary: 'Master single-candle pin-bar rejections and why identical shapes carry opposite labels depending on trend position.',
        learning_objective: 'Distinguish Hammer, Inverted Hammer, Hanging Man, and Shooting Star and study Pin-Bar rejection setups.',
        introduction:
          'Single-candle rejection patterns—often called "Pin Bars" in modern price action—show price probing a level and snapping sharply back.',
        content:
          '### The Four Single-Candle Formations\n- **Hammer** (after a downswing at support): Small body at top, lower wick ≥ 2× body length. Sellers pushed low, buyers reclaimed control.\n- **Inverted Hammer** (after a downswing): Small body at bottom, long upper wick. Needs strong bullish next-candle confirmation.\n- **Hanging Man** (after an upswing at resistance): Identical shape to a Hammer, but warns of fragile buying at highs if confirmed by a bearish close below it.\n- **Shooting Star** (after an upswing at resistance): Small body at bottom, long upper wick ≥ 2× body length. Shows sharp rejection of higher prices.\n\n### Setup Study: Pin-Bar Rejection After a Directional Move\nLook for a clean swing into a **pre-marked higher-timeframe level**, a prominent rejection wick (at least 2× body), and a close back inside the prior range—with invalidation placed safely beyond the rejection wick tip.',
        demonstration:
          'Pin-bar Setup Checklist (Illustrative EUR/USD 4H):\n1. Pre-mark daily support at `1.0780`.\n2. Price drops swiftly into `1.0772` and closes back at `1.0795` forming a Hammer.\n3. Invalidation lies below `1.0772` (plus buffer); avoid chasing if the wick is huge relative to target.',
        common_mistakes: [
          'Calling every small-wick candle a pin bar.',
          'Trading a Shooting Star in the middle of a violent bullish breakout without waiting for confirmation.',
        ],
        summary_recap:
          'Hammers/Shooting Stars reveal aggressive intra-bar rejection, meaningful only after a directional swing into a real structural zone.',
        practical_exercise: {
          title: 'Pin-Bar Rejection Location Test',
          objective: 'Compare pin bars at support/resistance vs. mid-range.',
          steps: [
            'Use Chart Practice Mode to inspect the Pin-Bar at Support scenario.',
            'Measure wick-to-body ratio (target ≥ 2:1).',
            'Identify the exact wick extreme used for stop invalidation.',
          ],
          deliverable: 'Annotated pin-bar example noting wick ratio and invalidation level.',
        },
        visual_key: 'candlestick-single-patterns',
        duration_minutes: 14,
        tags: ['hammer', 'shooting star', 'pin bar', 'hanging man'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0304-q1',
            question: 'Where does a valid Shooting Star formation appear?',
            options: [
              'After a bearish decline at support',
              'After an upswing at resistance, featuring a small body near the low and a long upper wick',
              'Inside a quiet Asian range',
              'Only on weekly charts',
            ],
            correct_index: 1,
            explanation: 'Shooting Stars represent failed upward extension at resistance after an advance.',
          },
          {
            id: 'l0304-q2',
            question: 'Where is structural invalidation normally placed for a bullish Hammer rejection setup?',
            options: [
              'Above the Hammer high',
              'Safely beyond the low of the Hammer’s rejection wick',
              'At the midpoint of the body',
              'No stop is needed',
            ],
            correct_index: 1,
            explanation: 'If price breaks back below the rejection wick low, the rejection thesis has failed.',
          },
        ],
      },
      {
        id: 'lesson-03-05',
        title: 'Bullish and Bearish Engulfing (At Pre-Marked Levels)',
        category: 'Candlestick patterns',
        summary: 'Learn two-candle engulfing reversals and study the engulfing-at-a-pre-marked-level setup.',
        learning_objective: 'Identify genuine Bullish and Bearish Engulfing patterns and validate them against pre-marked structural zones.',
        introduction:
          'When one candle completely swallows the body of the previous candle in the opposite direction, it shows a decisive shift in short-term order flow.',
        content:
          '### Two-Candle Engulfing Structure\n- **Bullish Engulfing**: After a decline, a bearish candle is followed by a larger bullish candle whose **real body completely engulfs** the prior candle’s real body.\n- **Bearish Engulfing**: After an advance, a bullish candle is followed by a larger bearish candle whose real body completely engulfs the prior candle’s real body.\n\n### Setup Study: Engulfing Candle at a Pre-Marked Level\n1. Mark higher-timeframe support or resistance **before** the candle forms.\n2. Wait for price to test the zone and print an engulfing candle closing firmly away from the level.\n3. Verify that the engulfing candle isn’t an unusually huge news spike that ruins Risk-to-Reward.',
        demonstration:
          'Illustrative GBP/USD H4 example:\n- Resistance pre-marked at `1.2750`.\n- Candle 1 closes bullish at `1.2748`.\n- Candle 2 opens near `1.2749`, sweeps `1.2756`, and closes bearish at `1.2715`, engulfing Candle 1. Invalidation sits above `1.2756`.',
        common_mistakes: [
          'Counting tiny engulfings inside sideways consolidation.',
          'Entering after a massive news-spike engulfing candle where stop distance is 3× larger than normal ATR.',
        ],
        summary_recap:
          'Engulfing patterns capture short-term control shifts; prioritize setups anchored at pre-marked levels with reasonable stop-to-target geometry.',
        practical_exercise: {
          title: 'Pre-Marked Level Engulfing Audit',
          objective: 'Evaluate engulfing quality and R:R constraints.',
          steps: [
            'Find two engulfing candles on a 1H or 4H chart—one at a swing level and one mid-range.',
            'Measure stop distance from close to the pattern extreme.',
            'Record which one offered cleaner follow-through and better R:R.',
          ],
          deliverable: 'Comparison notes between level-anchored vs. mid-range engulfings.',
        },
        visual_key: 'candlestick-multi-patterns',
        duration_minutes: 13,
        tags: ['bullish engulfing', 'bearish engulfing', 'level setup'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0305-q1',
            question: 'What must the second candle do in a textbook Bullish Engulfing pattern?',
            options: [
              'Have a smaller body than the first candle',
              'Close bullish with a real body completely covering the prior bearish candle’s real body',
              'Be a Doji',
              'Gap down 50 pips',
            ],
            correct_index: 1,
            explanation: 'The bullish second body wraps around the prior bearish body, signaling strong buyer takeover.',
          },
        ],
      },
      {
        id: 'lesson-03-06',
        title: 'Morning Star and Evening Star',
        category: 'Candlestick patterns',
        summary: 'Examine three-candle reversal transitions: directional push, indecision pause, and opposing confirmation.',
        learning_objective: 'Identify Morning Star and Evening Star 3-candle sequences and explain the order-flow psychology behind them.',
        introduction:
          'Three-candle Star patterns tell a complete three-act story: trend push, hesitation at a turning zone, and reversal confirmation.',
        content:
          '### Three-Candle Anatomy\n- **Morning Star (Bullish Transition)**: (1) Large bearish candle -> (2) Small-bodied pause/Doji candle showing selling exhaustion -> (3) Strong bullish candle closing well into (ideally >50% of) the first candle’s body.\n- **Evening Star (Bearish Transition)**: (1) Large bullish candle -> (2) Small pause/Doji candle -> (3) Strong bearish candle closing deep into the first candle’s body.\n\n*Spot FX note*: Unlike stocks that gap overnight between bars, 24-hour spot FX bars rarely gap between Candle 1 and Candle 2—focus on the **pause + decisive third-candle close** rather than demanding an equity-style gap.',
        demonstration:
          'On 4H EUR/USD at support: Bearish bar drops 45 pips -> tiny Spinning Top holds support -> next 4H bar closes bullish +38 pips above the Spinning Top high. Three acts complete.',
        common_mistakes: [
          'Rejecting valid FX Morning/Evening Stars simply because there is no equity-market price gap between candles.',
          'Jumping in on Candle 2 before Candle 3 actually confirms the shift.',
        ],
        summary_recap:
          'Morning and Evening Stars show momentum deceleration (Candle 2) followed by confirmed reversal (Candle 3).',
        practical_exercise: {
          title: '3-Act Star Identification',
          objective: 'Spot Morning/Evening Stars without requiring stock-style gaps.',
          steps: [
            'Review a Daily or 4H FX chart.',
            'Identify one 3-candle Morning Star or Evening Star sequence at a swing extreme.',
            'Verify whether Candle 3 closed past the midpoint of Candle 1.',
          ],
          deliverable: 'Annotated 3-candle transition summary.',
        },
        visual_key: 'candlestick-multi-patterns',
        duration_minutes: 12,
        tags: ['morning star', 'evening star', '3-candle'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0306-q1',
            question: 'Which candle provides the confirmation trigger in a Morning Star formation?',
            options: [
              'Candle 1 (bearish)',
              'Candle 2 (small pause)',
              'Candle 3 closing strongly bullish deep into Candle 1’s body',
              'Any candle 10 bars later',
            ],
            correct_index: 2,
            explanation: 'Candle 3 confirms that buyers took control after the Candle 2 pause.',
          },
        ],
      },
      {
        id: 'lesson-03-07',
        title: 'Piercing Line and Dark Cloud Cover',
        category: 'Candlestick patterns',
        summary: 'Learn two-candle partial counter-thrust formations and why penetration depth past 50% matters.',
        learning_objective: 'Recognize Piercing Line and Dark Cloud Cover in FX and distinguish them from full Engulfing patterns.',
        introduction:
          'Not every reversal swallows 100% of the prior candle. Sometimes the counter-move pushes more than halfway back—a Piercing Line or Dark Cloud Cover.',
        content:
          '### Pattern Definitions\n- **Piercing Line (Bullish)**: Following a bearish trend candle, the next candle reverses upward and closes **above the 50% midpoint** of the prior bearish body (without fully engulfing it).\n- **Dark Cloud Cover (Bearish)**: Following a bullish trend candle, the next candle reverses downward and closes **below the 50% midpoint** of the prior bullish body.\n\n*FX Context Note*: Because 24-hour FX bars open near the prior close, look for strong penetration past 50% of the prior body at a key zone, ideally reinforced by next-candle follow-through.',
        demonstration:
          'If Candle 1 rallied from `1.0800` to `1.0860` (60-pip body, midpoint `1.0830`), a Dark Cloud Cover closes at or below `1.0830`, proving sellers erased over half of buyers’ gains.',
        common_mistakes: [
          'Treating a shallow 20% pullback candle as a Piercing Line or Dark Cloud Cover—50% penetration is the minimum threshold.',
        ],
        summary_recap:
          'Piercing Line and Dark Cloud Cover measure >50% counter-penetration of the prior body, signaling meaningful opposition at key levels.',
        practical_exercise: {
          title: '50% Midpoint Check',
          objective: 'Verify whether counter-candles cross the 50% body threshold.',
          steps: [
            'Measure Candle 1 Open-to-Close range on two historical swing reversals.',
            'Verify whether Candle 2 closed past the 50% midpoint.',
          ],
          deliverable: 'Two midpoint measurements.',
        },
        visual_key: 'candlestick-multi-patterns',
        duration_minutes: 10,
        tags: ['piercing line', 'dark cloud cover'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0307-q1',
            question: 'What is the key threshold that separates a Dark Cloud Cover from a minor pullback candle?',
            options: [
              'The bearish second candle must close below the 50% midpoint of the prior bullish body',
              'It must be a Doji',
              'It must occur only on Mondays',
              'It requires 10 candles',
            ],
            correct_index: 0,
            explanation: 'Closing past the 50% mark demonstrates substantial bearish supply.',
          },
        ],
      },
      {
        id: 'lesson-03-08',
        title: 'Harami and Tweezer Formations',
        category: 'Candlestick patterns',
        summary: 'Learn how Harami containment and Tweezer double-rejection wicks warn of stalling momentum at levels.',
        learning_objective: 'Identify Bullish/Bearish Harami and Tweezer Tops/Bottoms and confirm break direction.',
        introduction:
          'When a large trend candle is immediately followed by a small candle trapped inside its body (Harami), or two bars reject the exact same high/low (Tweezers), momentum is stalling.',
        content:
          '### Harami vs. Tweezers\n- **Harami** (Japanese for "pregnant"): A large Candle 1 followed by a small Candle 2 whose real body sits completely inside Candle 1’s real body. Structurally similar to an Inside Bar—indicates contraction before a break.\n- **Tweezer Top / Tweezer Bottom**: Two consecutive candles sharing nearly identical **Highs** (Tweezer Top at resistance) or **Lows** (Tweezer Bottom at support), showing buyers/sellers failed twice at the same price ceiling or floor.',
        demonstration:
          'A Tweezer Bottom at `1.0750` prints two 1H candles whose lows both touch `1.0749`–`1.0751` with lower wicks—demonstrating persistent demand defending `1.0750`.',
        common_mistakes: [
          'Guessing the breakout direction of a Harami prematurely instead of waiting for a break of the mother candle’s range.',
        ],
        summary_recap:
          'Haramis show contraction inside a prior body; Tweezers show repeated horizontal rejection at identical highs or lows.',
        practical_exercise: {
          title: 'Tweezer Level Verification',
          objective: 'Spot repeated price rejection across two adjacent bars.',
          steps: [
            'Locate one Tweezer Top or Bottom near a clear horizontal level.',
            'Note the exact pip tolerance (within 1–3 pips) between the two wicks.',
          ],
          deliverable: 'Documented Tweezer example with rejection zone.',
        },
        visual_key: 'candlestick-multi-patterns',
        duration_minutes: 10,
        tags: ['harami', 'tweezer top', 'tweezer bottom'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0308-q1',
            question: 'What defines a Tweezer Bottom formation?',
            options: [
              'Two consecutive candles testing and rejecting nearly the exact same low level',
              'Three massive green candles',
              'A single wide-bodied candle',
              'Two gaps in a row',
            ],
            correct_index: 0,
            explanation: 'Matching lows across adjacent candles indicate repeated support defense.',
          },
        ],
      },
      {
        id: 'lesson-03-09',
        title: 'Three White Soldiers and Three Black Crows',
        category: 'Candlestick patterns',
        summary: 'Study sustained 3-bar momentum thrusts—and learn why chasing after the 3rd bar can leave you entering right before a pullback.',
        learning_objective: 'Recognize Three White Soldiers and Three Black Crows as momentum shifts while avoiding overextended entries.',
        introduction:
          'Three strong directional candles marching steadily higher or lower demonstrate forceful order-flow commitment—but entering blindly at the end carries pullback risk.',
        content:
          '### Pattern Structure\n- **Three White Soldiers**: Three consecutive sturdy bullish candles, each opening within or near the prior body and closing progressively higher near its high with minimal upper wicks.\n- **Three Black Crows**: Three consecutive sturdy bearish candles closing progressively lower near their lows with minimal lower wicks.\n\n### Critical Execution Caution\nBecause three strong candles already traveled a large distance, entering right after Candle 3 closes often catches a short-term exhaustion pullback. Look instead for a controlled pullback/retest into prior broken structure.',
        demonstration:
          'After Three White Soldiers break a multi-day range, measure ATR: if price already covered 100% of daily ATR, wait for a healthy pullback rather than buying the top wick.',
        common_mistakes: [
          'Chasing market entries right after three huge extended bars near major higher-timeframe resistance.',
        ],
        summary_recap:
          'Three White Soldiers and Three Black Crows confirm directional strength; use them to define trend bias and await pullbacks rather than chasing extended highs/lows.',
        practical_exercise: {
          title: 'Overextension vs. Pullback Study',
          objective: 'Observe how price behaves immediately after 3-bar thrusts.',
          steps: [
            'Find two examples of 3 consecutive strong directional candles on 1H.',
            'Measure whether price pulled back partially before continuing.',
          ],
          deliverable: 'Pullback depth note on two 3-bar thrusts.',
        },
        visual_key: 'candlestick-multi-patterns',
        duration_minutes: 10,
        tags: ['three white soldiers', 'three black crows', 'momentum'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0309-q1',
            question: 'What is the main risk of buying immediately at market after Three White Soldiers finish forming?',
            options: [
              'Price may already be short-term overextended and due for a pullback, creating poor stop placement',
              'The pattern is strictly bearish',
              'Brokers block entries after 3 green bars',
              'The spread becomes 0',
            ],
            correct_index: 0,
            explanation: 'After three large thrust bars, waiting for a pullback protects R:R and avoids buying local tops.',
          },
        ],
      },
      {
        id: 'lesson-03-10',
        title: 'Marubozu, Inside Bar and Outside Bar (Plus Inside-Bar Breakout Study)',
        category: 'Candlestick patterns',
        summary: 'Learn full-body Marubozu conviction, Inside Bar consolidation, Outside Bar volatility expansion, and Inside-Bar breakout invalidation.',
        learning_objective: 'Identify Marubozu, Inside Bar, and Outside Bar and structure an Inside-Bar breakout with a defined invalidation level.',
        introduction:
          'Modern price-action traders rely heavily on Inside Bars and Outside Bars because they capture contraction and expansion cycles clearly without subjective pattern names.',
        content:
          '### Definitions\n- **Marubozu**: A strong full-bodied candle with virtually zero upper or lower wicks—buyers (or sellers) controlled the entire session from open to close.\n- **Inside Bar**: A bar whose High is lower than (or equal to) the prior "mother bar’s" High, and whose Low is higher than (or equal to) the mother bar’s Low. Signals compression.\n- **Outside Bar**: A bar whose High exceeds the prior bar’s High *and* whose Low breaks below the prior bar’s Low—signaling volatility expansion or liquidity sweep.\n\n### Setup Study: Inside-Bar Breakout With Defined Invalidation\n1. Identify an Inside Bar forming in the direction of a clear trend or at a key consolidation zone (avoid choppy mid-range).\n2. Wait for a **candle close** (or disciplined break) beyond the mother bar or inside bar high/low.\n3. Set invalidation safely on the opposite side of the inside bar (or mother bar for wider safety).',
        demonstration:
          'Illustrative USD/JPY 4H Inside Bar:\n- Mother Bar: High `152.50`, Low `151.80` (bullish trend).\n- Inside Bar: High `152.35`, Low `152.00`.\n- Bullish breakout triggers above `152.35`/`152.50` with invalidation below `152.00` (or `151.80`).',
        common_mistakes: [
          'Trading inside bars inside tight sideways chop where false breaks occur constantly.',
          'Ignoring an outside bar’s wide range, which can trap breakout buyers if it reverses.',
        ],
        summary_recap:
          'Marubozu shows uninterrupted pressure; Inside Bars signal compression ready to break; Outside Bars reflect volatility expansion.',
        practical_exercise: {
          title: 'Inside-Bar Breakout & Invalidation Blueprint',
          objective: 'Map mother bar, inside bar, trigger, and invalidation.',
          steps: [
            'Locate an Inside Bar on a 4H or Daily chart during a clear trend.',
            'Write down exact Mother Bar High/Low and Inside Bar High/Low.',
            'Define both trigger level and invalidation stop level before looking at the next bar.',
          ],
          deliverable: 'Written inside-bar trade blueprint with defined invalidation.',
        },
        visual_key: 'inside-outside-marubozu',
        duration_minutes: 13,
        tags: ['marubozu', 'inside bar', 'outside bar', 'breakout'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0310-q1',
            question: 'What defines a bullish or bearish Marubozu candle?',
            options: [
              'A full real body with virtually no wicks at either end',
              'Tiny body and massive wicks',
              'High and Low inside the prior bar',
              'Identical Open and Close',
            ],
            correct_index: 0,
            explanation: 'Marubozu candles reflect full-session control from open to close without significant wick rejection.',
          },
          {
            id: 'l0310-q2',
            question: 'Where is a logical invalidation level for an upward Inside-Bar breakout?',
            options: [
              'Below the Inside Bar low (or Mother Bar low)',
              'Above the Mother Bar high',
              'At the 50-period SMA only',
              'No invalidation needed',
            ],
            correct_index: 0,
            explanation: 'A move back below the consolidation low invalidates the upward expansion.',
          },
        ],
      },
      {
        id: 'lesson-03-11',
        title: 'Candle Close, Timeframe and Confirmation',
        category: 'Candlestick patterns',
        summary: 'Understand why waiting for the candle close, respecting higher timeframes, and logging failed patterns prevents premature entries.',
        learning_objective: 'Apply timeframe hierarchy and candle-close discipline to filter out false mid-bar candlestick signals.',
        introduction:
          'One of the costliest beginner habits is entering a trade 10 minutes before a 1-hour candle closes because it "looks like a Hammer"—only to watch the candle finish as a bearish Marubozu.',
        content:
          '### The Three Rules of Candlestick Discipline\n1. **Wait for the Close**: Until the timer hits zero, a candle’s pattern does not exist.\n2. **Timeframe Hierarchy**: A 4H or Daily pin bar carries vastly more market consensus than a 5-minute pin bar, which often reflects minor random noise.\n3. **Record Failed Patterns**: Even textbook patterns at good levels fail regularly! Recording failed setups teaches you why context (e.g., an opposing higher-timeframe trend or upcoming CPI news) overruled the candle.',
        demonstration:
          'Practice logging: Create a table with columns `Pattern`, `Timeframe`, `Location (Support/Resistance/Mid-range)`, `Confirmed?`, `Outcome`. You will quickly see mid-range and unclosed patterns fail far more often.',
        common_mistakes: [
          'Acting on unclosed candles.',
          'Ignoring an opposing Daily trend because a 5-minute bullish engulfing appeared.',
        ],
        summary_recap:
          'Wait for the candle close, prioritize higher-timeframe context, and keep a log of failed patterns to sharpen selectivity.',
        practical_exercise: {
          title: 'Failed Pattern Audit (Course 03 Capstone)',
          objective: 'Analyze why seemingly textbook candle patterns fail.',
          steps: [
            'Find 2 candlestick patterns on historical charts that failed immediately.',
            'Diagnose why each failed (mid-range location, opposing HTF trend, spread/news spike, or no confirmation).',
          ],
          deliverable: 'Two written post-mortems of failed candle patterns.',
        },
        visual_key: 'candlestick-context-comparison',
        duration_minutes: 12,
        tags: ['candle close', 'confirmation', 'timeframe'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0311-q1',
            question: 'Why do experienced traders wait for a candle to close before validating a candlestick pattern?',
            options: [
              'Price can reverse sharply before the period finishes, completely erasing the apparent pattern',
              'Brokers prohibit trading before candle close',
              'Charts update only once a day',
              'Spreads are zero at candle close',
            ],
            correct_index: 0,
            explanation: 'An unclosed candle is incomplete data and can morph from a bullish pin bar into a bearish bar in seconds.',
          },
        ],
      },
    ],
  },

  {
    id: 'course-04-technical-analysis',
    slug: 'technical-analysis',
    course_number: 4,
    title: '04. Technical Analysis',
    category: 'Technical analysis',
    level: 'Beginner',
    level_label: 'Beginner to Intermediate',
    description:
      'Use charts and structured market analysis to identify market phases, swing structure, Break of Structure, top-down timeframes, classical chart patterns, Fibonacci ratios, volatility measures, and scenario planning.',
    prerequisites: '03. Candlestick Patterns',
    learning_outcomes: [
      'Recognize Uptrends (HH/HL), Downtrends (LH/LL), and Ranges objectively.',
      'Explain Break of Structure (BOS), Market-Structure Shift (MSS), and top-down multi-timeframe workflow.',
      'Interpret Head & Shoulders, Double Tops/Bottoms, Triangles, Flags, Wedges, Fibonacci levels, and Pivot Points with defined invalidation.',
      'Build balanced Bullish, Bearish, and Neutral scenarios instead of rigid price predictions.',
    ],
    estimated_hours: 4.5,
    cover_image_url: '/src/assets/images/hero_light_trading_1795086732029.jpg',
    assessment: [
      {
        id: 'c4-a1',
        question: 'What defines an objective Uptrend in price structure?',
        options: [
          'Three green candles in a row',
          'A sequence of Higher Highs (HH) and Higher Lows (HL)',
          'RSI above 50',
          'Lower Highs and Lower Lows',
        ],
        correct_index: 1,
        explanation: 'Structural uptrends advance via successive higher swing peaks and higher swing troughs.',
      },
      {
        id: 'c4-a2',
        question: 'What does Technical Analysis actually provide?',
        options: [
          'Certainty about future prices',
          'Structured scenarios, key reference levels, probabilities, and clear trade invalidation points',
          'Guaranteed entry triggers',
          'A substitute for risk management',
        ],
        correct_index: 1,
        explanation: 'Technical analysis describes scenarios and probabilities; it cannot predict prices with certainty.',
      },
      {
        id: 'c4-a3',
        question: 'Why must spot Forex traders be cautious with Volume indicators on retail MT4/MT5 charts?',
        options: [
          'Spot FX is decentralized OTC, so retail platforms display broker-specific "tick volume" (price updates) rather than true global contract volume',
          'Spot FX volume is always zero',
          'Volume predicts exact pips',
          'Tick volume only works on Sundays',
        ],
        correct_index: 0,
        explanation: 'Without a single centralized exchange, retail FX volume bars represent tick frequency at that broker rather than consolidated global volume.',
      },
      {
        id: 'c4-a4',
        question: 'In a Head and Shoulders top pattern, where does structural bearish breakdown typically trigger?',
        options: [
          'At the peak of the head',
          'On a confirmed break below the Neckline connecting the troughs',
          'At the left shoulder open',
          'Before the right shoulder forms',
        ],
        correct_index: 1,
        explanation: 'Breaking the neckline completes the reversal structure; entering before neckline break risks premature range failure.',
      },
      {
        id: 'c4-a5',
        question: 'What are the most widely monitored Fibonacci retracement ratios during trend pullbacks?',
        options: ['10%, 20%, 90%', '38.2%, 50.0%, 61.8%, and 78.6%', '12% and 99%', '150% and 300%'],
        correct_index: 1,
        explanation: '38.2%, 50%, 61.8%, and 78.6% are standard retracement reference zones.',
      },
    ],
    lessons: [
      {
        id: 'lesson-04-01',
        title: 'Technical Analysis: Scope and Limitations',
        category: 'Technical analysis',
        summary: 'Understand what chart analysis can realistically accomplish—and why it frames probabilities and invalidation rather than certainties.',
        learning_objective: 'Explain the scope, assumptions, and inherent limitations of technical analysis.',
        introduction:
          'Technical analysis studies historical price charts to organize market structure, spot potential reaction zones, and decide where a trade idea is proven wrong.',
        content:
          '### What Technical Analysis Does Well\n- Maps **where** buyers and sellers previously reacted.\n- Identifies trend vs. range environments.\n- Provides **objective invalidation levels** for stop-loss placement and Risk-to-Reward measurement.\n\n### Critical Limitations\n**Professional Note**: Technical analysis describes **scenarios and probabilities**; it cannot predict prices with certainty.\n- Sudden central-bank surprises or geopolitical shocks can slice straight through "perfect" chart patterns.\n- Multiple analysts can look at the exact same chart and draw different patterns (**subjectivity**).\n- Never treat chart patterns as self-fulfilling laws; always combine them with risk management.',
        demonstration:
          'Instead of saying *"EUR/USD WILL hit 1.1000"*, frame scenarios professionally: *"If price holds above 1.0800 support and prints a higher low, upside toward 1.0890 becomes plausible; a daily close below 1.0780 invalidates the bullish view."*',
        common_mistakes: [
          'Becoming emotionally attached to a single directional forecast instead of preparing bullish, bearish, and neutral scenarios.',
          'Overcomplicating charts with 10 conflicting tools until price candles are barely visible.',
        ],
        summary_recap:
          'Technical analysis organizes price structure and defines clear invalidation; it never eliminates uncertainty.',
        practical_exercise: {
          title: 'Three-Scenario Chart Plan',
          objective: 'Replace single-outcome prediction with conditional scenario planning.',
          steps: [
            'Pick one major pair (e.g., EUR/USD) on the Daily chart.',
            'Write one Bullish condition, one Bearish condition, and one Neutral/No-Trade condition.',
          ],
          deliverable: '3-scenario conditional plan.',
        },
        visual_key: 'market-structure-phases',
        duration_minutes: 10,
        tags: ['technical analysis', 'probabilities', 'limitations'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS, OFFICIAL_SOURCES.FINRA_EDU],
        quiz: [
          {
            id: 'l0401-q1',
            question: 'What is the healthiest professional mindset when performing technical analysis?',
            options: [
              'Predicting exact future prices with 100% certainty',
              'Mapping conditional scenarios, probabilities, and exact invalidation points',
              'Ignoring economic news completely',
              'Removing stop-losses when a pattern looks clean',
            ],
            correct_index: 1,
            explanation: 'Conditional scenarios keep traders adaptable and protect capital when price invalidates a view.',
          },
        ],
      },
      {
        id: 'lesson-04-02',
        title: 'Market Phases: Uptrend, Downtrend and Range',
        category: 'Technical analysis',
        summary: 'Classify any chart instantly into one of three regimes: Uptrend, Downtrend, or Sideways Range.',
        learning_objective: 'Identify Uptrend, Downtrend, and Range environments and match strategy style to market phase.',
        introduction:
          'Applying a trend-following pullback system inside a sideways choppy range leads to endless small losses. First identify which market phase you are in.',
        content:
          '### The Three Market Phases\n1. **Uptrend**: Price advances in waves forming **Higher Highs (HH)** and **Higher Lows (HL)**. Buyers control dips.\n2. **Downtrend**: Price declines in waves forming **Lower Highs (LH)** and **Lower Lows (LL)**. Sellers control rallies.\n3. **Range (Consolidation)**: Price oscillates horizontally between a defined ceiling (resistance) and floor (support) without sustained HH or LL progression.\n\n### Strategy-to-Phase Alignment\n- Trends favor **pullback** and **breakout-retest** approaches.\n- Ranges favor **boundary mean-reversion** or **standing aside** until a confirmed breakout occurs.',
        demonstration:
          'Scan EUR/USD Daily -> identify if recent 4-week swings made HH/HL (uptrend), LH/LL (downtrend), or bounced inside a 200-pip box (range).',
        common_mistakes: [
          'Forcing trendlines inside a flat horizontal range.',
          'Expecting huge trend targets while price is trapped inside a range.',
        ],
        summary_recap:
          'Every market sits in an uptrend, downtrend, or range. Diagnose the phase before choosing a setup.',
        practical_exercise: {
          title: 'Phase Classification Across 3 Timeframes',
          objective: 'Spot how phases differ between Daily, 4H, and 1H charts.',
          steps: [
            'Check Daily, 4H, and 1H on GBP/USD in the Markets tab.',
            'Label each timeframe as Uptrend, Downtrend, or Range.',
          ],
          deliverable: 'Multi-timeframe phase summary.',
        },
        visual_key: 'market-structure-phases',
        duration_minutes: 11,
        tags: ['uptrend', 'downtrend', 'range'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0402-q1',
            question: 'Which market phase is characterized by Lower Highs and Lower Lows?',
            options: ['Uptrend', 'Downtrend', 'Accumulation range', 'Random spike'],
            correct_index: 1,
            explanation: 'Successive lower swing peaks and troughs define a downtrend.',
          },
        ],
      },
      {
        id: 'lesson-04-03',
        title: 'Swing Highs/Lows, Higher Highs/Lows and Lower Highs/Lows',
        category: 'Technical analysis',
        summary: 'Learn objective rules for marking true structural swing highs and swing lows without guessing.',
        learning_objective: 'Mark structural swing highs and swing lows consistently on any chart.',
        introduction:
          'To label Higher Highs and Higher Lows consistently, you need a clear rule for what counts as a real swing point versus a minor 1-candle wiggle.',
        content:
          '### Defining Structural Swing Points\n- **Swing High**: A prominent peak where price rallied, paused or reversed, and pulled back noticeably—forming a clear turning point with lower highs on both sides.\n- **Swing Low**: A prominent trough with higher lows on both sides.\n- **Impulse vs. Correction**: Moves in the trend direction are **impulses** (often larger, steeper candles); counter-moves are **pullbacks/corrections**.',
        demonstration:
          'In an uptrend: Swing Low 1 (`1.0700`) -> Swing High 1 (`1.0800`) -> pullback holds at `1.0740` (**HL**) -> breaks above `1.0800` to `1.0870` (**HH**). Until `1.0740` breaks, the uptrend structure remains intact.',
        common_mistakes: [
          'Marking every tiny 3-pip ripple on a 5-minute chart as a major structural swing.',
        ],
        summary_recap:
          'Consistent swing marking reveals whether impulses are making progress or stalling.',
        practical_exercise: {
          title: 'Swing Structure Labeling',
          objective: 'Label HH, HL, LH, and LL on historical price action.',
          steps: [
            'Open Chart Practice Mode and select the Bullish Structure scenario.',
            'Identify each confirmed HL before price prints the next HH.',
          ],
          deliverable: 'Labeled swing sequence.',
        },
        visual_key: 'market-structure-phases',
        duration_minutes: 11,
        tags: ['swing highs', 'swing lows', 'HH HL'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0403-q1',
            question: 'In an uptrend making HL at 1.0740 and HH at 1.0870, which level must hold to keep the uptrend structure unbroken?',
            options: ['1.0870', 'The Higher Low at 1.0740', '1.0950', 'Any moving average'],
            correct_index: 1,
            explanation: 'Breaking below the most recent protected Higher Low signals structural weakness.',
          },
        ],
      },
      {
        id: 'lesson-04-04',
        title: 'Break of Structure and Market-Structure Shift Concepts',
        category: 'Technical analysis',
        summary: 'Differentiate trend-continuation Break of Structure (BOS) from reversal Market-Structure Shift (MSS / CHoCH).',
        learning_objective: 'Distinguish BOS (continuation) from MSS/CHoCH (potential trend reversal) using candle-close criteria.',
        introduction:
          'When price breaks a swing high or swing low, traders use two key terms: one confirms the trend is continuing, while the other warns the trend may be turning.',
        content:
          '### BOS vs. MSS (CHoCH)\n- **Break of Structure (BOS)**: Price closes beyond a previous swing point *in the direction of the prevailing trend* (e.g., closing above a prior HH in an uptrend), confirming continuation.\n- **Market-Structure Shift (MSS)** (also called **Change of Character / CHoCH**): Price breaks and closes beyond the **most recent opposing structural swing** against the trend (e.g., in an uptrend, closing decisively below the last Higher Low), signaling potential shift from bullish to bearish control.\n\n*Confirmation Note*: Prefer a **candle body close** beyond the swing point rather than a brief 2-pip wick probe.',
        demonstration:
          'Illustrative transition: Uptrend `1.0700 -> 1.0800 -> 1.0740 (HL) -> 1.0860 (HH)`. Price fails to exceed `1.0860`, reverses, and closes a 4H candle at `1.0725` below `1.0740 (HL)` -> **Market-Structure Shift (MSS)** warning sellers took short-term control.',
        common_mistakes: [
          'Calling a 1-pip wick sweep on a 5-minute chart a major daily market-structure shift.',
          'Expecting every MSS to lead to a 500-pip crash without checking higher-timeframe support.',
        ],
        summary_recap:
          'BOS confirms trend continuation; MSS warns of potential trend change when the prior protected swing breaks with a candle close.',
        practical_exercise: {
          title: 'BOS vs. MSS Drill',
          objective: 'Correctly label continuation breaks vs. reversal shifts.',
          steps: [
            'Open Chart Practice Mode.',
            'Distinguish at least one continuation BOS from one reversal MSS.',
          ],
          deliverable: 'Marked BOS and MSS annotations.',
        },
        visual_key: 'bos-mss-diagram',
        duration_minutes: 12,
        tags: ['BOS', 'MSS', 'CHoCH', 'market structure'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0404-q1',
            question: 'In an established downtrend (LH, LL), what constitutes a bullish Market-Structure Shift (MSS)?',
            options: [
              'Price breaks and closes below the prior Lower Low',
              'Price rallies and closes decisively above the most recent Lower High',
              'RSI touches 30',
              'A single bullish wick forms',
            ],
            correct_index: 1,
            explanation: 'Breaking above the last Lower High breaks the bearish sequence and signals potential bullish shift.',
          },
        ],
      },
      {
        id: 'lesson-04-05',
        title: 'Timeframes and Top-Down Analysis',
        category: 'Technical analysis',
        summary: 'Build a structured top-down routine from Weekly/Daily macro context down to 4H/1H execution charts.',
        learning_objective: 'Perform a top-down multi-timeframe analysis connecting higher-timeframe bias to lower-timeframe execution.',
        introduction:
          'Staring solely at a 15-minute chart is like driving while staring 5 feet in front of your bumper—you miss the sharp curve or brick wall sitting right ahead on the Daily chart.',
        content:
          '### The Top-Down Hierarchy\n1. **Higher Timeframe (Weekly / Daily)** — *Context & Major Levels*: Identify dominant trend/range and major horizontal support/resistance.\n2. **Structure Timeframe (4H / 1H)** — *Setup Zone*: Locate pullbacks, breakouts, and directional waves aligning with (or reacting at) Daily zones.\n3. **Execution Timeframe (1H / 15m)** — *Timing & Invalidation*: Refine entry trigger and stop-loss without fighting higher-timeframe walls.\n\n*Rule of Thumb*: Pair timeframes roughly 4×–6× apart (e.g., **Daily -> 4H -> 1H** for swing traders, or **4H -> 1H -> 15m** for intraday traders).',
        demonstration:
          'Top-Down Walkthrough:\n- **Daily**: EUR/USD in uptrend pulling back into key `1.0780` support.\n- **4H**: Prints Higher Low structure inside `1.0780–1.0800`.\n- **1H**: Bullish BOS above local minor high gives refined entry with 25-pip stop instead of 90-pip Daily stop.',
        common_mistakes: [
          'Buying on a 5-minute breakout directly underneath massive Weekly/Daily resistance.',
          'Mixing disconnected timeframes like Monthly and 1-minute.',
        ],
        summary_recap:
          'Top-down analysis aligns execution timing on lower timeframes with higher-timeframe structure and levels.',
        practical_exercise: {
          title: 'Write a Complete Top-Down Analysis',
          objective: 'Draft a structured Daily -> 4H -> 1H report on one major pair.',
          steps: [
            'Inspect Daily, 4H, and 1H on EUR/USD or XAU/USD in Markets.',
            'Write 2 sentences for Daily context, 2 for 4H structure, and define key 1H watch zones.',
          ],
          deliverable: '3-timeframe top-down analysis note.',
        },
        visual_key: 'top-down-timeframes',
        duration_minutes: 12,
        tags: ['top-down', 'multi-timeframe', 'MTF'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0405-q1',
            question: 'What is the primary goal of top-down analysis?',
            options: [
              'To trade as many 1-minute signals as possible',
              'To establish macro levels and directional context on higher timeframes before refining entries on lower timeframes',
              'To avoid using stop-losses',
              'To prove charts predict news',
            ],
            correct_index: 1,
            explanation: 'Higher timeframes filter out low-timeframe noise and highlight major structural obstacles.',
          },
        ],
      },
      {
        id: 'lesson-04-06',
        title: 'Chart Types and Chart Scaling',
        category: 'Technical analysis',
        summary: 'Compare Line, Bar (OHLC), Candlestick, and Heikin-Ashi charts, plus linear vs. logarithmic scaling.',
        learning_objective: 'Choose appropriate chart types and price scales (arithmetic vs. logarithmic) and recognize Heikin-Ashi distortion.',
        introduction:
          'Your chart software offers several ways to display prices. Knowing what each chart type hides or highlights prevents serious misreadings.',
        content:
          '### Chart Types\n- **Line Chart**: Connects closing prices only—great for spotting clean horizontal levels and cutting out wick noise.\n- **OHLC Bar & Candlestick**: Show full Open, High, Low, Close.\n- **Heikin-Ashi**: Uses *averaged/smoothed* formulas rather than real market Open/Close prices. **Warning**: Never place exact stop/entry orders directly off a Heikin-Ashi candle without checking actual real-price candlesticks!\n\n### Arithmetic (Linear) vs. Logarithmic Scaling\n- **Linear**: Equal vertical pixel spacing for equal price units (standard for intraday FX).\n- **Logarithmic**: Equal vertical spacing for equal *percentage* changes—essential on multi-year Crypto or Gold charts where price grew several hundred percent.',
        demonstration:
          'Switch a Bitcoin multi-year chart between Linear and Log scale: Linear makes early 2017–2020 cycles look completely flat, while Log reveals clear proportional structure.',
        common_mistakes: [
          'Assuming Heikin-Ashi candles show real traded bid prices.',
          'Analyzing 5-year Crypto or Index trends on linear scale without logarithmic perspective.',
        ],
        summary_recap:
          'Use Line charts for closing clarity, Candlesticks for real OHLC execution, and Logarithmic scale for large multi-year percentage moves.',
        practical_exercise: {
          title: 'Chart View Comparison',
          objective: 'Compare Line vs. Candlestick clarity on a major pair.',
          steps: [
            'Mark horizontal support/resistance using closing prices only (Line view mindset).',
            'Switch back to Candlesticks to inspect where wicks probed beyond those closing levels.',
          ],
          deliverable: 'Note on differences between closing levels and wick extremes.',
        },
        visual_key: 'candlestick-anatomy',
        duration_minutes: 10,
        tags: ['chart types', 'log scale', 'Heikin-Ashi'],
        sources: [OFFICIAL_SOURCES.TV_CANDLES],
        quiz: [
          {
            id: 'l0406-q1',
            question: 'Why must you check standard Candlesticks rather than relying solely on Heikin-Ashi for order execution?',
            options: [
              'Heikin-Ashi plots mathematically averaged/smoothed prices rather than actual market Open and Close prices',
              'Heikin-Ashi only displays weekend prices',
              'Heikin-Ashi removes spreads',
              'Candlesticks are slower',
            ],
            correct_index: 0,
            explanation: 'Heikin-Ashi smoothing hides real current bid prices.',
          },
        ],
      },
      {
        id: 'lesson-04-07',
        title: 'Head and Shoulders; Double Tops and Bottoms',
        category: 'Technical analysis',
        summary: 'Master classic reversal chart structures, neckline confirmation, and measured invalidation.',
        learning_objective: 'Identify Head & Shoulders, Inverse H&S, Double Top, and Double Bottom patterns only after neckline confirmation.',
        introduction:
          'Classical reversal patterns occur when a trend tries multiple times to push higher or lower, fails to sustain new extremes, and breaks its supporting neckline.',
        content:
          '### Key Reversal Structures\n- **Head & Shoulders (Bearish)** / **Inverse H&S (Bullish)**: Three peaks (or troughs) where the middle peak (Head) exceeds the Left and Right Shoulders. Structure completes **only when price breaks and closes beyond the Neckline**.\n- **Double Top ("M") & Double Bottom ("W")**: Price tests a swing high (or low) twice, fails to continue, and breaks the intervening trough/peak (**Neckline**).\n\n### Confirmation Rule\nUntil the neckline breaks, a "Double Top" is simply a bullish pullback that might break out into a strong continuation! Always wait for the neckline break (or break-and-retest).',
        demonstration:
          'Double Top Invalidation vs. Trigger:\n- Peak 1 = `1.0950`, Pullback = `1.0880` (Neckline), Peak 2 = `1.0948`.\n- Short thesis triggers on close below `1.0880`, with invalidation above Peak 2 (or the right shoulder / pullback high).',
        common_mistakes: [
          'Shorting Peak 2 blindly assuming a Double Top before the neckline breaks.',
          'Treating "measured move targets" as guaranteed destinations.',
        ],
        summary_recap:
          'Head & Shoulders and Double Tops/Bottoms require neckline confirmation; before the break, they remain unconfirmed consolidations.',
        practical_exercise: {
          title: 'Reversal Pattern Neckline Drill',
          objective: 'Practice waiting for neckline confirmation in Chart Practice Mode.',
          steps: [
            'Open Chart Practice Mode and load the Head & Shoulders scenario.',
            'Identify Left Shoulder, Head, Right Shoulder, and Neckline.',
            'Mark the candle-close confirmation point and stop invalidation.',
          ],
          deliverable: 'Annotated reversal structure with neckline and stop level.',
        },
        visual_key: 'chart-patterns-reversals',
        duration_minutes: 13,
        tags: ['head and shoulders', 'double top', 'double bottom', 'neckline'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0407-q1',
            question: 'When is a Double Top ("M" pattern) structurally confirmed?',
            options: [
              'The moment the second peak touches the first peak’s price',
              'Only after price breaks and closes below the intervening swing low (neckline)',
              'When RSI hits 70',
              'At market open',
            ],
            correct_index: 1,
            explanation: 'Without a neckline break, price can easily break upward above both tops in trend continuation.',
          },
        ],
      },
      {
        id: 'lesson-04-08',
        title: 'Triangles, Flags, Pennants and Wedges',
        category: 'Technical analysis',
        summary: 'Understand consolidation continuation and terminal wedge patterns with clear breakout confirmation and failure rules.',
        learning_objective: 'Distinguish Ascending, Descending, Symmetrical Triangles, Bull/Bear Flags, Pennants, and Rising/Falling Wedges.',
        introduction:
          'Markets rarely move in straight lines—they surge, rest inside tightening patterns as buyers and sellers digest gains, and then expand again.',
        content:
          '### Consolidation & Wedge Formations\n- **Triangles**:\n  - *Ascending*: Flat resistance top + rising higher lows.\n  - *Descending*: Flat support floor + declining lower highs.\n  - *Symmetrical*: Converging lower highs and higher lows (neutral coil).\n- **Flags & Pennants**: Sharp impulse leg ("flagpole") followed by a brief parallel counter-channel (Flag) or tiny symmetrical coil (Pennant) before potential continuation.\n- **Rising & Falling Wedges**: Converging trendlines sloping together. A Rising Wedge in an uptrend often warns of tiring momentum if the lower line breaks; a Falling Wedge in a downtrend can resolve upward if resistance breaks.',
        demonstration:
          'Bull Flag Example: Pair surges 120 pips in 6 hours, then drifts gently downward inside a tidy 35-pip channel over 24 hours. A strong candle close above the upper flag boundary signals potential continuation, invalidated below the flag low.',
        common_mistakes: [
          'Forcing curved price action into imaginary triangle lines with only 1–2 touches.',
          'Buying inside a shrinking triangle before breakout confirmation and getting whipsawed.',
        ],
        summary_recap:
          'Triangles, Flags, Pennants, and Wedges capture volatility contraction; wait for a confirmed close outside the pattern boundary with defined invalidation.',
        practical_exercise: {
          title: 'Continuation Pattern Comparison',
          objective: 'Spot clean consolidation flags vs. messy sideways ranges.',
          steps: [
            'Locate one Flag or Triangle on 4H historical data.',
            'Measure the consolidation duration vs. the preceding impulse leg.',
            'Define breakout trigger and invalidation.',
          ],
          deliverable: 'Annotated Flag/Triangle diagram notes.',
        },
        visual_key: 'chart-patterns-continuation',
        duration_minutes: 13,
        tags: ['triangles', 'flags', 'pennants', 'wedges'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0408-q1',
            question: 'What differentiates a Bull Flag from a Symmetrical Triangle?',
            options: [
              'A Bull Flag typically forms as a compact, parallel, slightly downward-sloping channel after a sharp upward impulse',
              'A Bull Flag always lasts 6 months',
              'Triangles only happen in Gold',
              'Flags have no invalidation level',
            ],
            correct_index: 0,
            explanation: 'Flags feature parallel consolidation boundaries sloping modestly against the prior impulse.',
          },
        ],
      },
      {
        id: 'lesson-04-09',
        title: 'Fibonacci Retracement and Extension',
        category: 'Technical analysis',
        summary: 'Use Fibonacci retracement ratios (38.2%, 50%, 61.8%, 78.6%) and extensions as objective measurement rulers rather than magic barriers.',
        learning_objective: 'Plot Fibonacci retracements from valid impulse swings and combine them with structural confluence.',
        introduction:
          'Fibonacci ratios give traders a standardized way to ask: "Has this pullback retraced shallowly, moderately, or deeply relative to the prior swing?"',
        content:
          '### Key Fibonacci Ratios\n- **Retracements** (measuring pullbacks within a swing): `23.6%`, `38.2%`, `50.0%` (Gann/equilibrium midpoint), `61.8%` (Golden Ratio), `78.6%`.\n- **Extensions** (projecting expansion zones): `127.2%`, `161.8%`, `200%`.\n\n### Practical Usage & Realism\n- Always anchor the tool from **true structural Swing Low to Swing High** (in an uptrend) or **Swing High to Swing Low** (in a downtrend).\n- **Confluence Rule**: Never buy blindly just because price touches `61.8%`. A `61.8%` retracement carries real weight when it *overlaps* with prior horizontal support, a trendline, or a moving average.',
        demonstration:
          'Illustrative Uptrend Swing: Swing Low `1.0700` -> Swing High `1.0900` (200-pip impulse). A `50.0%` pullback sits at `1.0800`; a `61.8%` pullback sits at `1.0776`. If prior resistance turned support also sits at `1.0780`, you have multi-factor confluence.',
        common_mistakes: [
          'Redrawing Fibonacci anchors repeatedly until one arbitrarily fits a candle.',
          'Treating 61.8% as an automatic buy wall without confirmation or stop-loss.',
        ],
        summary_recap:
          'Fibonacci levels are standardized pullback rulers. Combine them with horizontal structure and candle confirmation rather than trading ratios in isolation.',
        practical_exercise: {
          title: 'Fibonacci Confluence Mapping',
          objective: 'Measure pullback depth on a clean impulse swing.',
          steps: [
            'Take an impulse from 1.2500 to 1.2700 (200 pips).',
            'Calculate the exact 38.2%, 50.0%, and 61.8% retracement prices manually.',
            'Check which level aligns closest to a round number (1.2600).',
          ],
          deliverable: 'Calculated prices: 1.2624 (38.2%), 1.2600 (50.0%), 1.2576 (61.8%).',
        },
        visual_key: 'fibonacci-retracement',
        duration_minutes: 12,
        tags: ['fibonacci', 'retracement', 'extension', 'confluence'],
        sources: [OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0409-q1',
            question: 'If an uptrend swings from 1.0600 to 1.0800 (200 pips), what price is the 50.0% retracement?',
            options: ['1.0750', '1.0700', '1.0650', '1.0850'],
            correct_index: 1,
            explanation: '50% of 200 pips is 100 pips down from 1.0800 = 1.0700.',
          },
          {
            id: 'l0409-q2',
            question: 'When is a 61.8% Fibonacci level most useful?',
            options: [
              'When it aligns (has confluence) with an existing horizontal support/resistance zone or structure',
              'In isolation on a 1-minute chart during news',
              'Even when the main trend already broke structure',
              'Without any stop-loss',
            ],
            correct_index: 0,
            explanation: 'Confluence with horizontal structure dramatically improves the significance of any Fib zone.',
          },
        ],
      },
      {
        id: 'lesson-04-10',
        title: 'Pivot Points and Volatility Measures',
        category: 'Technical analysis',
        summary: 'Learn how floor-trader Pivot Points (P, R1/R2, S1/S2) and volatility metrics (ATR, daily range) frame intraday boundaries.',
        learning_objective: 'Calculate standard Pivot Points and use volatility metrics to assess realistic intraday targets.',
        introduction:
          'Pivot Points and volatility indicators answer a practical daily question: "How far does this pair normally move in a day, and where might intraday profit-taking occur?"',
        content:
          '### Standard Pivot Point Formulas (Prior Session H, L, C)\n- **Central Pivot (`P`)** = `(High + Low + Close) / 3`\n- **R1** = `(2 × P) − Low`, **S1** = `(2 × P) − High`\n- **R2** = `P + (High − Low)`, **S2** = `P − (High − Low)`\n\n### Volatility Context (ATR & Average Daily Range)\nChecking 14-day **Average True Range (ATR)** tells you whether EUR/USD has been moving ~65 pips/day or ~120 pips/day. If a pair already moved 95% of its 14-day ATR in one direction today, chasing a fresh breakout target 60 pips farther has poor odds.',
        demonstration:
          'Illustrative Daily OHLC: High `1.0880`, Low `1.0820`, Close `1.0860` -> `P = (1.0880 + 1.0820 + 1.0860) / 3 = 1.0853`; `R1 = 2(1.0853) - 1.0820 = 1.0886`; `S1 = 2(1.0853) - 1.0880 = 1.0826`.',
        common_mistakes: [
          'Setting a 120-pip intraday take-profit on a pair whose 14-day ATR is only 55 pips.',
          'Ignoring timezone differences when plotting daily Pivot Points (standard FX uses 17:00 NY close).',
        ],
        summary_recap:
          'Pivot Points offer objective prior-day reference levels; ATR/range prevents setting unrealistic intraday targets or dangerously tight stops.',
        practical_exercise: {
          title: 'Pivot & Range Feasibility Check',
          objective: 'Compute standard Pivot, R1, and S1 levels manually.',
          steps: [
            'Take prior day illustrative High 1.2700, Low 1.2620, Close 1.2670.',
            'Calculate Pivot (P), R1, and S1.',
          ],
          deliverable: 'P = 1.2663, R1 = 1.2706, S1 = 1.2626.',
        },
        visual_key: 'volatility-atr-diagram',
        duration_minutes: 11,
        tags: ['pivot points', 'ATR', 'volatility'],
        sources: [OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0410-q1',
            question: 'What is the main value of checking 14-day ATR before setting an intraday Take-Profit?',
            options: [
              'It shows whether your target distance is realistic within typical daily price expansion',
              'It predicts whether price will go up or down',
              'It reduces broker commissions',
              'It removes news volatility',
            ],
            correct_index: 0,
            explanation: 'ATR calibrates target and stop expectations to real current volatility.',
          },
        ],
      },
      {
        id: 'lesson-04-11',
        title: 'Volume and Tick-Volume Limitations in Decentralised Spot FX',
        category: 'Technical analysis',
        summary: 'Understand why retail spot FX displays tick volume rather than actual currency dollars traded—and how CME FX futures volume differs.',
        learning_objective: 'Explain the difference between centralized exchange contract volume and OTC spot FX tick volume.',
        introduction:
          'Stock and futures traders watch share/contract volume closely. Why do experienced spot Forex teachers warn beginners not to blindly apply stock volume rules to MT4?',
        content:
          '### Centralized vs. Decentralized Volume\n- **Stocks & CME FX Futures**: Trade on centralized exchanges where every contract traded is recorded with exact size (**Real Volume**).\n- **Spot FX (OTC)**: Decentralized across banks and brokers globally—no single entity sees total worldwide dollar volume in real time. Instead, retail terminals show **Tick Volume** (how many times the broker’s price quote ticked up or down per candle).\n\n### Practical Implication\nWhile tick volume often correlates loosely with market activity (high during London/NY, low during Asia), it does **not** measure actual order size ($100k vs. $500M) and can vary between brokers. Keep volume-heavy strategies anchored to CME FX futures data if true volume matters.',
        demonstration:
          'Compare two brokers’ tick volume bars during a quiet rollover hour—one broker with jittery feeds can show 3× more ticks than another even though real institutional size was tiny.',
        common_mistakes: [
          'Treating retail MT4 tick volume bars as proof of "$500M institutional buying".',
        ],
        summary_recap:
          'Spot FX volume is tick frequency from your specific broker, not centralized market dollar volume.',
        practical_exercise: {
          title: 'Tick vs. Futures Volume Note',
          objective: 'Summarize where real FX volume data comes from.',
          steps: [
            'Visit CME Group Education or note CME 6E (Euro FX futures) vs. OTC spot EUR/USD.',
            'Write 2 sentences explaining why centralized futures report real contract volume while spot OTC uses tick volume.',
          ],
          deliverable: 'Short written distinction between OTC tick volume and futures volume.',
        },
        visual_key: 'forex-ecosystem',
        duration_minutes: 10,
        tags: ['tick volume', 'CME futures', 'OTC'],
        sources: [OFFICIAL_SOURCES.CME_EDU, OFFICIAL_SOURCES.BIS_SURVEY],
        quiz: [
          {
            id: 'l0411-q1',
            question: 'What does the "Volume" histogram on a typical retail spot Forex platform actually measure?',
            options: [
              'Total global dollars exchanged across all world banks',
              'Tick volume—the count of price updates at that broker during each candle',
              'Central bank gold reserves',
              'Net retail trader profit',
            ],
            correct_index: 1,
            explanation: 'Retail OTC spot platforms lack centralized global volume and display tick-update counts instead.',
          },
        ],
      },
      {
        id: 'lesson-04-12',
        title: 'Combining Technical and Fundamental Context',
        category: 'Technical analysis',
        summary: 'Bring charts and macro together: fundamentals explain *why* money flows; technicals show *where* to structure risk.',
        learning_objective: 'Synthesize macroeconomic awareness with technical chart structure without relying blindly on either alone.',
        introduction:
          'Purely fundamental traders often enter too early with huge drawdowns; purely technical traders often get blindsided by scheduled central-bank catalysts. The strongest workflow respects both.',
        content:
          '### Complementary Roles\n- **Fundamental Context ("The Wind")**: Central-bank interest-rate expectations, inflation surprises, and risk sentiment tell you which direction capital has tailwinds.\n- **Technical Structure ("The Map & Steering")**: Support, resistance, trend structure, and volatility show *where* entries make sense, *where* a trade is invalidated, and *whether* Risk-to-Reward is worthwhile.\n\n### Practical Pre-Trade Routine\n1. Check the **Economic Calendar** before every session.\n2. Map Daily/4H technical structure and key invalidation zones.\n3. Prepare Bullish, Bearish, and Stand-Aside scenarios around upcoming macro catalysts.',
        demonstration:
          'Before a U.S. Non-Farm Payrolls (NFP) Friday, mark your Weekly/Daily levels ahead of time, avoid placing tight stops right before the 13:30 UTC release, and let post-release spread normalization + candle close confirm direction.',
        common_mistakes: [
          'Opening a technical breakout setup 5 minutes before an FOMC rate decision.',
          'Ignoring technical stop-loss placement simply because you "feel bullish on USD fundamentals".',
        ],
        summary_recap:
          'Fundamentals highlight macro tailwinds and event risks; technicals define execution levels, invalidation, and Risk-to-Reward.',
        practical_exercise: {
          title: 'Combined Technical + Calendar Prep',
          objective: 'Draft a complete pre-session brief combining MeridianFX Calendar and Chart data.',
          steps: [
            'Check this week’s high-impact events on the MeridianFX Calendar page.',
            'Inspect EUR/USD or XAU/USD on the Markets chart.',
            'Write a 3-scenario plan (Bullish, Bearish, Stand-Aside during high-impact event).',
          ],
          deliverable: 'Combined pre-session market brief.',
        },
        visual_key: 'top-down-timeframes',
        duration_minutes: 12,
        tags: ['macro', 'confluence', 'scenario planning'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.TV_PATTERNS],
        quiz: [
          {
            id: 'l0412-q1',
            question: 'How do technical analysis and fundamental analysis complement each other best?',
            options: [
              'Fundamentals clarify macro drivers and scheduled volatility windows; technicals define structure, entry timing, and stop invalidation',
              'They always cancel each other out',
              'Only fundamentals use stop-losses',
              'Only technicals work in Forex',
            ],
            correct_index: 0,
            explanation: 'Combining macro context with structured price levels avoids blind news spikes and improves timing.',
          },
        ],
      },
    ],
  },

  {
    id: 'course-05-fundamental-analysis',
    slug: 'fundamental-analysis',
    course_number: 5,
    title: '05. Fundamental Analysis',
    category: 'Fundamental analysis',
    level: 'Intermediate',
    level_label: 'Intermediate',
    description:
      'Explain how economic releases (CPI, NFP, GDP, PMI), central-bank mandates, interest-rate expectations, yield differentials, geopolitical developments, and market-expectation surprises drive currencies.',
    prerequisites: '01. Introduction to Forex, 02. Understanding Currency Pairs, 04. Technical Analysis',
    learning_outcomes: [
      'Interpret Economic Calendar columns (Actual, Forecast, Previous, Revisions) accurately.',
      'Explain central-bank mandates, hawkish vs. dovish policy guidance, and real yield differentials across the major G8 central banks.',
      'Understand why price frequently moves opposite to a headline due to priced-in expectations, revisions, or component details.',
    ],
    estimated_hours: 4.5,
    cover_image_url: '/src/assets/images/hero_light_trading_1795086732029.jpg',
    assessment: [
      {
        id: 'c5-a1',
        question: 'In an Economic Calendar, what typically moves a currency more sharply right at release time?',
        options: [
          'The Previous value alone',
          'The surprise gap between the Actual figure and the market consensus Forecast (plus revisions)',
          'The font color of the calendar row',
          'Whether the release is on a Tuesday',
        ],
        correct_index: 1,
        explanation: 'Markets price in consensus forecasts ahead of time; unexpected deviations between Actual and Forecast force repricing.',
      },
      {
        id: 'c5-a2',
        question: 'What does "Hawkish" central-bank communication signal?',
        options: [
          'Priority on fighting inflation via higher interest rates or tighter monetary policy—often supportive for the currency',
          'Urgent plans to slash interest rates to zero',
          'Closing the central bank',
          'Buying Bitcoin reserves',
        ],
        correct_index: 0,
        explanation: 'Hawkish policymakers favor tighter policy/higher rates to curb inflation.',
      },
      {
        id: 'c5-a3',
        question: 'Why might USD fall immediately even if US Non-Farm Payrolls (NFP) prints a strong headline job number?',
        options: [
          'Because expectations were already priced higher, prior months were revised sharply downward, or unemployment/wage components disappointed',
          'Because NFP only moves Gold',
          'Because calendars print inverted numbers',
          'Because USD cannot rise on Fridays',
        ],
        correct_index: 0,
        explanation: 'Markets trade expectations, revisions, and policy implications—not isolated headline numbers mechanically.',
      },
      {
        id: 'c5-a4',
        question: 'Why do experienced analysts monitor Core CPI alongside headline CPI?',
        options: [
          'Core CPI strips out volatile food and energy prices to reveal underlying persistent inflation trends watched closely by central banks',
          'Headline CPI is illegal to trade',
          'Core CPI only measures housing rents in Europe',
          'Core CPI is always lower than zero',
        ],
        correct_index: 0,
        explanation: 'Food and energy swing rapidly; central banks track Core CPI/PCE for persistent inflation.',
      },
      {
        id: 'c5-a5',
        question: 'Which statement reflects real-world high-impact news risk?',
        options: [
          'High-impact news releases guarantee tight 0.1-pip spreads',
          'High-impact releases can trigger sudden spread widening, slippage beyond stop-losses, and rapid two-way whipsaws',
          'Data releases mechanically move pairs 100 pips in one straight line',
          'Central banks always announce rate cuts in advance',
        ],
        correct_index: 1,
        explanation: 'Liquidity thins around major announcements, causing spread spikes and slippage.',
      },
    ],
    lessons: [
      {
        id: 'lesson-05-01',
        title: 'Economic Calendars: Actual, Forecast and Previous',
        category: 'Fundamental analysis',
        summary: 'Learn how to read High/Medium/Low impact events and compare Actual, Consensus Forecast, and Previous numbers.',
        learning_objective: 'Read any Economic Calendar entry accurately and understand consensus expectations.',
        introduction:
          'Every week, scheduled government and central-bank reports spark the biggest volatility bursts in Forex. An Economic Calendar tells you *what* is coming, *when* it drops, and *what* the market already expects.',
        content:
          '### The Four Key Calendar Columns\n1. **Impact Level (Low / Medium / High)**: High-impact events (rate decisions, CPI, NFP, GDP) routinely widen spreads and move pairs sharply.\n2. **Previous**: Last period’s reported number (watch for **revisions**!).\n3. **Forecast (Consensus)**: Median estimate surveyed from institutional economists—this is largely **already priced in** before release.\n4. **Actual**: The newly released official number.\n\n**Professional Note**: High-impact releases cause spreads to widen, slippage, and rapid whipsaws. Never assume a green or red calendar figure mechanically guarantees directional price follow-through.',
        demonstration:
          'Open the MeridianFX **Calendar** tab, set timezone to your local time, filter to **High Impact**, and check Forecast vs. Previous on the next USD or EUR inflation/employment release.',
        common_mistakes: [
          'Forgetting to check timezone alignment on an economic calendar.',
          'Ignoring prior-month revisions when evaluating the headline Actual figure.',
        ],
        summary_recap:
          'Forecast reflects what is priced in; the surprise gap between Actual and Forecast (plus revisions) triggers repricing, often alongside wide spreads.',
        practical_exercise: {
          title: 'Calendar Pre-Week Audit',
          objective: 'Identify this week’s top 3 High-Impact events.',
          steps: [
            'Navigate to the MeridianFX Calendar tab.',
            'Filter by Impact = High.',
            'Record event name, currency, local release time, Forecast, and Previous for 3 upcoming events.',
          ],
          deliverable: '3-event high-impact risk schedule.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 11,
        tags: ['economic calendar', 'forecast', 'actual', 'revisions'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.BEA_DATA],
        quiz: [
          {
            id: 'l0501-q1',
            question: 'Which Economic Calendar column represents what institutional markets have largely already priced in before the announcement?',
            options: ['Actual', 'Forecast (Consensus)', 'Impact badge', 'Time column'],
            correct_index: 1,
            explanation: 'Prices adjust in advance around the consensus Forecast; deviations from Forecast cause surprises.',
          },
        ],
      },
      {
        id: 'lesson-05-02',
        title: 'Central-Bank Mandates and Monetary Policy',
        category: 'Fundamental analysis',
        summary: 'Understand why central banks raise or cut interest rates: price stability (inflation targets), maximum employment, and financial stability.',
        learning_objective: 'Explain core central-bank mandates and the main tools of monetary policy.',
        introduction:
          'Why do currency traders obsess over central banks? Because central banks control the supply and "price" (interest rate) of their nation’s money.',
        content:
          '### Core Mandates\n- **Single Mandate (Price Stability)**: e.g., the **ECB** and **BoE** primarily target ~2% inflation over the medium term.\n- **Dual Mandate**: The **Federal Reserve** targets both **price stability (~2% inflation)** and **maximum employment**.\n\n### Primary Policy Tools\n1. **Policy Interest Rate**: Raising rates makes holding that currency yield more (often attracting capital inflows); cutting rates lowers yield and stimulates borrowing.\n2. **Quantitative Easing / Tightening (QE/QT)**: Buying or shrinking central-bank bond holdings to influence longer-term borrowing conditions.\n3. **Forward Guidance**: Statements signaling likely future policy path.',
        demonstration:
          'When inflation climbs well above 2% while employment stays tight, a central bank faces pressure to hold rates higher or hike—supporting its currency relative to a central bank cutting rates.',
        common_mistakes: [
          'Thinking central banks try to manipulate exchange rates daily to help Forex traders—they act on domestic inflation, growth, and employment mandates.',
        ],
        summary_recap:
          'Central banks steer interest rates and liquidity to hit inflation and employment mandates; those rate shifts drive long-term currency trends.',
        practical_exercise: {
          title: 'Mandate Comparison',
          objective: 'Compare Federal Reserve vs. ECB mandates.',
          steps: [
            'Note the Fed’s dual mandate (price stability + maximum employment).',
            'Contrast with ECB’s primary price-stability mandate (~2% inflation target).',
          ],
          deliverable: 'Short mandate comparison note.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['central banks', 'monetary policy', 'mandates'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.ECB_MONETARY, OFFICIAL_SOURCES.BOE_MONETARY],
        quiz: [
          {
            id: 'l0502-q1',
            question: 'What are the two components of the U.S. Federal Reserve’s dual mandate?',
            options: [
              'Stock market growth and zero taxes',
              'Maximum employment and price stability (low, stable inflation)',
              'Fixed EUR/USD exchange rate and gold backing',
              'Crypto regulation and retail spreads',
            ],
            correct_index: 1,
            explanation: 'Congress mandates the Fed to pursue maximum employment and stable prices.',
          },
        ],
      },
      {
        id: 'lesson-05-03',
        title: 'Policy Rates and Interest-Rate Expectations',
        category: 'Fundamental analysis',
        summary: 'Learn why forward *expectations* of future rate hikes or cuts move currencies weeks or months before the actual central-bank meeting.',
        learning_objective: 'Explain why markets price future interest-rate paths rather than waiting for rate announcement day.',
        introduction:
          'Often, a central bank raises interest rates by 0.25%—and its currency actually *falls*! Why? Because markets expected a 0.25% hike weeks ago, and the bank hinted no more hikes are coming.',
        content:
          '### Buy the Rumor, Reprice the Path\nFinancial markets are forward-looking discounting machines:\n- Rate futures and OIS (Overnight Index Swaps) continuously price what traders expect policy rates to be 3, 6, and 12 months ahead.\n- If traders already priced a 95% probability of a 25 bps hike today, the hike itself is old news.\n- What moves the currency is whether the **projected future path** shifts higher (more hikes / fewer cuts) or lower (earlier cuts).',
        demonstration:
          'Illustrative FOMC scenario: Fed holds rates steady as expected (0% surprise), **but** updated Dot Plot projections show fewer cuts next year than consensus expected -> USD rallies sharply on the *expectations shift*.',
        common_mistakes: [
          'Thinking a rate hike automatically pushes a currency up regardless of whether it was 100% priced in or paired with dovish guidance.',
        ],
        summary_recap:
          'Currencies respond primarily to *changes in expected future interest-rate paths*, not merely the current headline rate.',
        practical_exercise: {
          title: 'Rate Expectation Scenario',
          objective: 'Predict market logic when guidance contradicts the current action.',
          steps: [
            'Write out what happens if a central bank cuts rates by 0.25% (expected) but warns inflation remains sticky and pauses further cuts.',
            'Explain why the currency might paradoxically rally.',
          ],
          deliverable: 'Short paragraph explaining "hawkish cut" repricing.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['interest rates', 'expectations', 'forward guidance'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.CME_EDU],
        quiz: [
          {
            id: 'l0503-q1',
            question: 'Why might a currency fall immediately after its central bank announces an expected 0.25% interest-rate hike?',
            options: [
              'If the hike was fully priced in and accompanying guidance signals the tightening cycle is now finished ("dovish hike")',
              'Because higher interest rates always weaken currencies',
              'Because markets never read statements',
              'Because swaps reset to zero',
            ],
            correct_index: 0,
            explanation: 'If future rate expectations drop, the currency reprices downward despite today’s hike.',
          },
        ],
      },
      {
        id: 'lesson-05-04',
        title: 'Inflation: CPI, Core CPI and PPI',
        category: 'Fundamental analysis',
        summary: 'Understand Consumer Price Index (CPI), Core CPI, PCE, and Producer Price Index (PPI) and how hot/cool prints reshape rate expectations.',
        learning_objective: 'Distinguish CPI, Core CPI, and PPI and explain their link to central-bank policy.',
        introduction:
          'Because central banks exist largely to keep inflation stable around ~2%, monthly inflation reports like CPI frequently trigger the largest currency moves of the month.',
        content:
          '### Key Inflation Gauges\n- **CPI (Consumer Price Index)**: Measures price changes paid by urban consumers across a basket of goods and services (reported Month-over-Month MoM and Year-over-Year YoY).\n- **Core CPI**: Excludes volatile **food and energy** components to expose sticky underlying inflation (services, shelter).\n- **PPI (Producer Price Index)**: Measures price changes received by domestic producers—sometimes signals upstream cost pressures.\n- **PCE (Personal Consumption Expenditures)**: The Federal Reserve’s preferred US inflation benchmark.\n\n### How Markets Interpret Inflation\n- *Hotter-than-forecast Core CPI* -> raises odds of tighter/higher-for-longer rates -> often bullish for the currency (though extreme stagflation fears can complicate this).\n- *Cooler-than-forecast Core CPI* -> raises odds of earlier rate cuts -> often pressures yields and the currency lower.',
        demonstration:
          'Inspect U.S. Bureau of Labor Statistics (bls.gov) CPI structure: compare Headline CPI MoM, Core CPI MoM, and Shelter/Services sub-components before assuming market reaction.',
        common_mistakes: [
          'Looking only at YoY CPI while ignoring MoM Core CPI momentum.',
          'Forgetting that oil price spikes can distort Headline CPI while central banks stay focused on Core.',
        ],
        summary_recap:
          'CPI, Core CPI, and PPI directly shape interest-rate expectations. Core MoM readings often carry the highest policy signal.',
        practical_exercise: {
          title: 'Inflation Scenario Matrix',
          objective: 'Draft pre-release plans for Hot vs. Cool CPI surprises.',
          steps: [
            'Assume Consensus Core CPI MoM = 0.3%.',
            'Draft one scenario if Actual prints 0.5% and another if Actual prints 0.1%.',
            'Note spread-widening precautions at release minute.',
          ],
          deliverable: 'Pre-event CPI scenario plan.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['CPI', 'Core CPI', 'PPI', 'inflation'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.FED_MONETARY],
        quiz: [
          {
            id: 'l0504-q1',
            question: 'Which two volatile categories are excluded from Core CPI?',
            options: [
              'Housing and healthcare',
              'Food and energy',
              'Education and apparel',
              'Autos and electronics',
            ],
            correct_index: 1,
            explanation: 'Excluding food and energy helps policymakers see persistent underlying price trends.',
          },
        ],
      },
      {
        id: 'lesson-05-05',
        title: 'GDP, Employment, Unemployment and Wage Data',
        category: 'Fundamental analysis',
        summary: 'Analyze growth (GDP) and labor reports (US NFP, unemployment rate, average hourly earnings) as drivers of monetary policy.',
        learning_objective: 'Interpret GDP, Non-Farm Payrolls (NFP), unemployment rate, and wage growth coherently.',
        introduction:
          'Strong job growth and rising wages keep consumer spending brisk—and can keep inflation elevated—forcing central banks to stay cautious about cutting rates.',
        content:
          '### Growth & Labor Pillars\n- **GDP (Gross Domestic Product)**: Broadest measure of economic output (reported Quarterly; Advance, Second, and Final estimates via BEA in the U.S.). Because GDP is backward-looking, the *Advance* release usually moves markets most.\n- **Employment & Unemployment Rate**: Measures job creation (e.g., U.S. **Non-Farm Payrolls / NFP**) and share of the labor force seeking work.\n- **Wage Growth (Average Hourly Earnings)**: Crucial link between labor tightness and services inflation.\n\n*Nuance*: Always read payrolls, unemployment rate, and wage growth **together**—mixed signals inside one report often produce violent two-way spikes!',
        demonstration:
          'Illustrative Mixed NFP Release: Headline jobs beat (+240k vs 180k forecast), **but** Unemployment ticks up from 3.9% to 4.2% and prior two months are revised down -70k -> USD spikes up for 3 minutes, then reverses sharply lower.',
        common_mistakes: [
          'Trading blindly on the single NFP headline number while missing unemployment rate or wage surprises.',
          'Trading with tight 10-pip stops during NFP release minute.',
        ],
        summary_recap:
          'GDP tracks economic growth; labor and wage reports drive central-bank confidence on inflation and employment mandates.',
        practical_exercise: {
          title: 'NFP 3-Component Check',
          objective: 'Learn to read payrolls, unemployment, and wages together.',
          steps: [
            'Check bls.gov or the MeridianFX Calendar for the latest Employment Situation components.',
            'List all three key figures: Nonfarm Payrolls, Unemployment Rate, Average Hourly Earnings.',
          ],
          deliverable: '3-component NFP checklist.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['GDP', 'NFP', 'employment', 'wages'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.BEA_DATA],
        quiz: [
          {
            id: 'l0505-q1',
            question: 'Why do central banks watch Average Hourly Earnings (wage growth) closely inside labor reports?',
            options: [
              'Rapid wage growth can sustain consumer demand and feed persistent services inflation',
              'Wages directly set broker spreads',
              'Wages replace CPI completely',
              'Only manufacturing wages count in GDP',
            ],
            correct_index: 0,
            explanation: 'Sustained wage pressure influences inflation persistence, affecting rate decisions.',
          },
        ],
      },
      {
        id: 'lesson-05-06',
        title: 'Retail Sales, PMI and Business Surveys',
        category: 'Fundamental analysis',
        summary: 'Use leading activity indicators like Purchasing Managers’ Index (PMI) and Retail Sales to gauge turning points before GDP arrives.',
        learning_objective: 'Interpret PMI (above/below 50 expansion threshold) and Retail Sales data.',
        introduction:
          'Official GDP numbers arrive weeks after a quarter ends. Purchasing Managers’ Index (PMI) surveys and monthly Retail Sales give markets a much timelier pulse.',
        content:
          '### Timelier Growth Signals\n- **PMI (Manufacturing & Services Purchasing Managers’ Index)**: Surveys purchasing executives on new orders, output, employment, and prices.\n  - **Above 50.0** = sector expansion; **Below 50.0** = sector contraction.\n  - Markets focus especially on the **Services PMI** in developed economies (U.S., Eurozone, UK) because services dominate GDP.\n- **Retail Sales**: Measures consumer spending at stores and online—critical since household consumption makes up ~65–70% of major developed economies.',
        demonstration:
          'If Eurozone Services PMI drops unexpectedly from `51.5` to `48.2` (crossing below 50 into contraction), traders may rapidly price in higher odds of an ECB rate cut, pressuring EUR.',
        common_mistakes: [
          'Overweighting Manufacturing PMI in heavily services-driven economies while ignoring Services PMI.',
        ],
        summary_recap:
          'PMIs (50 threshold) and Retail Sales offer timely early reads on growth momentum before backward-looking GDP releases.',
        practical_exercise: {
          title: 'PMI Expansion vs. Contraction Read',
          objective: 'Interpret PMI thresholds accurately.',
          steps: [
            'Locate Manufacturing and Services PMI in the MeridianFX Economic Calendar.',
            'Classify whether each reading is above 50 (expanding) or below 50 (contracting) and compare to Forecast.',
          ],
          deliverable: 'PMI directional summary.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 10,
        tags: ['PMI', 'retail sales', 'leading indicators'],
        sources: [OFFICIAL_SOURCES.BEA_DATA, OFFICIAL_SOURCES.ECB_MONETARY],
        quiz: [
          {
            id: 'l0506-q1',
            question: 'In a PMI survey, what does a reading of 47.5 indicate?',
            options: [
              'Economic contraction in that sector (below the 50.0 neutral threshold)',
              'Strong expansion',
              '47.5% inflation',
              'Central bank rate of 4.75%',
            ],
            correct_index: 0,
            explanation: 'Readings below 50 denote month-on-month contraction; above 50 denote expansion.',
          },
        ],
      },
      {
        id: 'lesson-05-07',
        title: 'Federal Reserve, ECB, BoE, BoJ, BoC, RBA and RBNZ',
        category: 'Fundamental analysis',
        summary: 'Tour the seven major central banks behind the primary FX pairs, their currencies, meeting rhythms, and policy quirks.',
        learning_objective: 'Identify the central bank, currency, and key structural characteristics for each major economy.',
        introduction:
          'Every major currency has a central bank steering its interest rates. Knowing who meets when—and what makes each central bank unique—organizes your macro awareness.',
        content:
          '### The G7 / Commodity Central Banks\n1. **Federal Reserve (Fed / FOMC)** — **USD**: Global reserve anchor; 8 FOMC meetings/year; publishes Summary of Economic Projections ("Dot Plot").\n2. **European Central Bank (ECB)** — **EUR**: Governs Eurozone; balances diverse member economies; closely watched Governing Council press conferences.\n3. **Bank of England (BoE / MPC)** — **GBP**: Monetary Policy Committee votes (watch the exact vote split, e.g., 7–2).\n4. **Bank of Japan (BoJ)** — **JPY**: Historically ultra-low rates / Yield Curve Control transitions; sensitive to domestic wages and FX intervention warnings.\n5. **Bank of Canada (BoC)** — **CAD**: Influenced by North American trade and energy/oil terms of trade.\n6. **Reserve Bank of Australia (RBA)** — **AUD**: Sensitive to metals/China demand and quarterly Australian CPI.\n7. **Reserve Bank of New Zealand (RBNZ)** — **NZD**: Sensitive to dairy/agricultural exports and quarterly CPI/jobs data.',
        demonstration:
          'Compare BoE vs. Fed: On BoE decision days, traders watch not just the rate decision but the **MPC vote split** (e.g., if 2 members unexpectedly voted to cut, GBP can drop immediately).',
        common_mistakes: [
          'Assuming every central bank publishes data on the same monthly cadence (e.g., Australia and New Zealand release primary CPI quarterly rather than monthly, though Australia also added a monthly CPI indicator).',
        ],
        summary_recap:
          'Each major central bank has distinct vote structures, projections, and domestic sensitivities that shape its currency.',
        practical_exercise: {
          title: 'Central Bank Reference Sheet',
          objective: 'Map the 7 major central banks to their currencies and key features.',
          steps: [
            'List Fed, ECB, BoE, BoJ, BoC, RBA, and RBNZ.',
            'Write each bank’s currency and one distinguishing policy/economic feature.',
          ],
          deliverable: '7-row central bank cheat sheet.',
        },
        visual_key: 'central-bank-spectrum',
        duration_minutes: 12,
        tags: ['Fed', 'ECB', 'BoE', 'BoJ', 'BoC', 'RBA', 'RBNZ'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.ECB_MONETARY, OFFICIAL_SOURCES.BOE_MONETARY],
        quiz: [
          {
            id: 'l0507-q1',
            question: 'Which central bank’s policy announcements include an MPC member vote split (e.g., 7-2) watched closely for shifts in sentiment?',
            options: ['Bank of England (BoE)', 'Reserve Bank of New Zealand', 'Federal Reserve', 'Bank of Canada'],
            correct_index: 0,
            explanation: 'The Bank of England’s Monetary Policy Committee releases exact member vote splits alongside its rate decision.',
          },
        ],
      },
      {
        id: 'lesson-05-08',
        title: 'Hawkish and Dovish Communication',
        category: 'Fundamental analysis',
        summary: 'Decode central-bank language: hawkish signals favoring tighter policy vs. dovish signals favoring accommodation.',
        learning_objective: 'Classify central-bank statements as hawkish, neutral, or dovish and understand policy divergence.',
        introduction:
          'Central bankers rarely shout "buy or sell!" Instead, they adjust subtle adjectives in speeches and minutes—shifting from "patient" to "vigilant" or "data-dependent".',
        content:
          '### The Policy Tone Spectrum\n- **Hawkish**: Emphasizes inflation risks, tight labor markets, keeping rates restrictive longer, or raising rates -> generally currency-supportive.\n- **Dovish**: Emphasizes slowing growth, rising unemployment risks, confidence inflation is cooling, or readiness to cut rates -> generally currency-negative.\n\n### Interest-Rate Divergence Setup\nWhen Bank A turns **more hawkish** while Bank B turns **more dovish**, the resulting widening yield gap creates multi-week or multi-month trends in the A/B currency pair.',
        demonstration:
          'Compare two phrases:\n- *"Inflation remains unacceptably elevated and further tightening remains on the table"* = **Hawkish**.\n- *"Progress on disinflation allows us to begin easing policy restriction soon"* = **Dovish**.',
        common_mistakes: [
          'Reacting to a single out-of-context word from a non-voting regional speaker instead of official consensus statements or governor press conferences.',
        ],
        summary_recap:
          'Hawkish communication warns of tighter policy; dovish communication signals easing. Divergences between two central banks drive lasting FX trends.',
        practical_exercise: {
          title: 'Hawkish vs. Dovish Statement Drill',
          objective: 'Classify policy wording on the hawkish/dovish spectrum.',
          steps: [
            'Read the latest FOMC or ECB summary statement linked in the source library.',
            'Highlight two phrases indicating either inflation vigilance (hawkish) or growth caution (dovish).',
          ],
          deliverable: 'Annotated policy tone summary.',
        },
        visual_key: 'central-bank-spectrum',
        duration_minutes: 11,
        tags: ['hawkish', 'dovish', 'divergence'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.ECB_MONETARY],
        quiz: [
          {
            id: 'l0508-q1',
            question: 'If the Federal Reserve turns hawkish while the ECB turns dovish, what fundamental pressure generally applies to EUR/USD?',
            options: [
              'Downward pressure (USD favored vs. EUR due to widening US–Eurozone yield advantage)',
              'Upward pressure on EUR/USD',
              'No effect on exchange rates',
              'EUR/USD freezes',
            ],
            correct_index: 0,
            explanation: 'Hawkish Fed + dovish ECB widens USD yield advantage, creating fundamental headwinds for EUR/USD.',
          },
        ],
      },
      {
        id: 'lesson-05-09',
        title: 'Yield Differentials and Real Interest Rates',
        category: 'Fundamental analysis',
        summary: 'Understand why 2-year government bond yield spreads and inflation-adjusted real yields act as a magnet for global capital.',
        learning_objective: 'Explain nominal vs. real interest rates and how 2-year yield differentials correlate with FX trends.',
        introduction:
          'Global capital flows toward currencies offering stronger inflation-adjusted returns for comparable risk. Watching 2-year bond yield spreads explains much of medium-term FX direction.',
        content:
          '### Nominal vs. Real Yields\n- **Nominal Interest Rate**: Headline bond yield or policy rate (e.g., 4.5%).\n- **Real Interest Rate**: `Nominal Yield − Inflation Expectations`. If nominal yield is 4.5% but inflation is 6.0%, your **real yield is -1.5%** (purchasing power shrinks!).\n\n### 2-Year Yield Differentials\n2-year government bond yields (e.g., US 2Y minus German 2Y Schatz) closely reflect expected central-bank rates over the next two years. When the US–Germany 2Y yield spread widens in favor of the US, EUR/USD frequently faces downward pressure—though never mechanically in lockstep every day.',
        demonstration:
          'Illustrative comparison:\n- Country A: 5.0% nominal rate, 2.5% inflation -> **+2.5% Real Rate**.\n- Country B: 5.0% nominal rate, 6.0% inflation -> **-1.0% Real Rate**.\nEven with identical headline rates, Country A offers vastly superior real purchasing-power return.',
        common_mistakes: [
          'Assuming a high nominal interest rate in a hyper-inflationary emerging market makes that currency strong—negative real yields and inflation erode the currency.',
        ],
        summary_recap:
          'Real rates adjust nominal yields for inflation. Rising 2-year yield differentials often attract capital toward the higher-yielding currency.',
        practical_exercise: {
          title: 'Real Yield Calculation',
          objective: 'Compute real interest rates across two hypothetical economies.',
          steps: [
            'Economy X has 4.2% nominal yield and 2.1% inflation.',
            'Economy Y has 6.0% nominal yield and 7.5% inflation.',
            'Calculate both real rates and explain which has stronger purchasing-power support.',
          ],
          deliverable: 'Economy X (+2.1% real) vs. Economy Y (-1.5% real).',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['yield differentials', 'real interest rates', 'bonds'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY],
        quiz: [
          {
            id: 'l0509-q1',
            question: 'How is the approximate Real Interest Rate calculated?',
            options: [
              'Nominal Interest Rate minus Inflation (or Inflation Expectations)',
              'Nominal Rate multiplied by Leverage',
              'GDP divided by CPI',
              '2Y Yield plus 10Y Yield',
            ],
            correct_index: 0,
            explanation: 'Subtracting inflation from the nominal yield reveals true purchasing-power return.',
          },
        ],
      },
      {
        id: 'lesson-05-10',
        title: 'Geopolitical Events, Fiscal Policy and Risk Sentiment',
        category: 'Fundamental analysis',
        summary: 'Understand Risk-On vs. Risk-Off capital flows, safe-haven currencies (USD, JPY, CHF), and fiscal stimulus effects.',
        learning_objective: 'Explain how Risk-On/Risk-Off sentiment and fiscal policy affect FX pairs and safe-haven currencies.',
        introduction:
          'When geopolitical conflicts erupt or stock markets sell off abruptly, traders stop worrying about tiny PMI beats and rush into liquid safe-haven currencies.',
        content:
          '### Risk-On vs. Risk-Off Regimes\n- **Risk-On** (calm markets, rising equities): Capital often flows into higher-yielding or growth/commodity-linked currencies (**AUD, NZD, CAD, EMFX**).\n- **Risk-Off** (financial stress, geopolitical escalation): Capital often retreats into deep liquidity and safe-haven currencies (**USD, CHF, JPY**) or **Gold**.\n\n### Fiscal Policy\nGovernment tax cuts or large deficit spending (**fiscal stimulus**) can boost near-term growth and inflation, potentially forcing the central bank to keep interest rates higher than otherwise.',
        demonstration:
          'During an unexpected geopolitical escalation, global equities drop 2.5% while **AUD/JPY** (classic risk-sentiment barometer) falls sharply as AUD sells off and JPY/USD attract defensive flows.',
        common_mistakes: [
          'Assuming "safe haven" means guaranteed uninterrupted appreciation—even safe havens reverse violently on de-escalation headlines.',
        ],
        summary_recap:
          'Risk sentiment drives sudden rotational flows between commodity/growth currencies and safe havens; fiscal policy reshapes inflation and rate paths.',
        practical_exercise: {
          title: 'Risk-On / Risk-Off Barometer Check',
          objective: 'Contrast a risk-sensitive pair against safe havens.',
          steps: [
            'Check today’s SPX500 index % change alongside AUD/JPY or AUD/USD and USD/CHF in the Markets tab.',
            'Identify whether today’s tone leans Risk-On, Risk-Off, or Mixed.',
          ],
          deliverable: '1-paragraph risk-sentiment check.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 11,
        tags: ['geopolitics', 'risk-on', 'risk-off', 'fiscal policy'],
        sources: [OFFICIAL_SOURCES.BIS_HUB],
        quiz: [
          {
            id: 'l0510-q1',
            question: 'During a sharp global "Risk-Off" equity sell-off, which currencies are historically most vulnerable to outflows?',
            options: [
              'Growth and commodity-linked currencies like AUD and NZD (and emerging-market currencies)',
              'Only USD',
              'CHF exclusively',
              'None—all pairs freeze',
            ],
            correct_index: 0,
            explanation: 'Risk-sensitive and commodity-linked currencies tend to soften when global risk appetite contracts.',
          },
        ],
      },
      {
        id: 'lesson-05-11',
        title: 'Data Surprises, Revisions and Market Expectations',
        category: 'Fundamental analysis',
        summary: 'Learn why second-order details—prior revisions, whisper expectations, and core sub-indexes—often trump the headline.',
        learning_objective: 'Diagnose data surprises accurately by accounting for revisions and sub-component quality.',
        introduction:
          'Markets rarely react purely to a single headline digit. Institutional desks read the full release table within milliseconds, checking prior-month revisions and sub-components.',
        content:
          '### Why Headlines Alone Mislead\n1. **Prior Revisions**: A +200k jobs beat vs. +180k forecast actually represents a *net miss* if the prior two months were revised downward by -90k!\n2. **Whisper Numbers**: After hot related data earlier in the week, traders may already expect higher than the published economist consensus.\n3. **Component Quality**: Did GDP beat because consumers bought goods, or merely because businesses piled up unsold inventories?',
        demonstration:
          'Net Revision Check: Actual = `+200k`, Forecast = `+180k` (+20k beat), Previous revised from `+210k` down to `+150k` (-60k revision). Net surprise = `+20k - 60k = -40k` softer than expected!',
        common_mistakes: [
          'Clicking instant market trades on a calendar flash color without reading revisions or details.',
        ],
        summary_recap:
          'Evaluate net surprises including prior revisions and underlying component quality rather than isolated headlines.',
        practical_exercise: {
          title: 'Revision Impact Calculation',
          objective: 'Calculate net data surprise including revisions.',
          steps: [
            'Given Forecast +160k, Actual +175k, Prior revised from +190k to +140k.',
            'Calculate the net labor addition surprise.',
          ],
          deliverable: 'Net surprise = +15k - 50k = -35k net shortfall.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 10,
        tags: ['revisions', 'data surprises', 'expectations'],
        sources: [OFFICIAL_SOURCES.BLS_DATA, OFFICIAL_SOURCES.BEA_DATA],
        quiz: [
          {
            id: 'l0511-q1',
            question: 'If Actual Retail Sales prints +0.4% vs. +0.3% Forecast, why might the currency still sell off?',
            options: [
              'If the prior month was revised down sharply (e.g., from +0.6% to +0.1%) or core ex-autos sales contracted',
              'Because +0.4% is always negative',
              'Because retail sales do not count',
              'Because computers randomly invert numbers',
            ],
            correct_index: 0,
            explanation: 'Downward revisions and weak core details often outweigh a tiny headline beat.',
          },
        ],
      },
      {
        id: 'lesson-05-12',
        title: 'Why Price Can Move Opposite to a Headline',
        category: 'Fundamental analysis',
        summary: 'Synthesize priced-in positioning, "sell-the-fact" profit-taking, liquidity sweeps, and conflicting cross-currents.',
        learning_objective: 'Explain at least four valid reasons why a currency moves opposite to an apparently bullish or bearish headline.',
        introduction:
          'Nothing frustrates a newer trader more than seeing a "bullish" news headline and watching the currency plunge. Understanding why prevents panic and revenge trading.',
        content:
          '### Four Reasons Price Defies Headlines\n1. **Fully Priced In ("Buy the Rumor, Sell the Fact")**: Traders bought ahead of the news; upon release, early buyers take profit into fresh retail buying liquidity.\n2. **Sub-Component / Guidance Override**: A positive GDP beat accompanied by a central-bank warning about slowing future quarters.\n3. **Dominant Higher-Impact Driver Elsewhere**: A strong UK retail print gets overshadowed minutes later by a hawkish U.S. Fed shock.\n4. **Initial Liquidity Stop-Run**: Automated algos spike price into thin post-news order books, sweeping nearby stops before reversing.\n\n**Professional Rule**: Wait 15–30 minutes after major news for spreads to normalize and a real candle to close before drawing conclusions.',
        demonstration:
          'Before an event, write down: "Even if Actual beats Forecast, if price fails to hold above [key resistance] and closes back inside the range, I will NOT fight price action." Price always has the final vote.',
        common_mistakes: [
          'Refusing to exit a losing news trade because "the fundamentals say it has to go up!"',
        ],
        summary_recap:
          'Price reacts to positioning, expectations, guidance, and liquidity—never fight price action solely because a headline looked bullish.',
        practical_exercise: {
          title: 'Pre-Event & Post-Event Scenario Plan',
          objective: 'Build a complete event discipline protocol.',
          steps: [
            'Select one upcoming High-Impact release on the Calendar.',
            'Write pre-event spread/no-trade rules (e.g., flat 15m prior).',
            'Define post-event confirmation criteria (15m/1H candle close after spreads normalize).',
          ],
          deliverable: 'Complete pre-event & post-event playbook.',
        },
        visual_key: 'fundamentals-transmission',
        duration_minutes: 12,
        tags: ['sell the fact', 'whipsaws', 'news risk'],
        sources: [OFFICIAL_SOURCES.FED_MONETARY, OFFICIAL_SOURCES.CFTC_FX],
        quiz: [
          {
            id: 'l0512-q1',
            question: 'What is the safest beginner approach to high-impact news releases?',
            options: [
              'Stand aside prior to release, let spreads normalize, and evaluate confirmed post-event price structure',
              'Place 10-pip stops 30 seconds before CPI',
              'Double leverage right before NFP',
              'Trade solely off the headline flash color',
            ],
            correct_index: 0,
            explanation: 'Standing aside avoids spread spikes and slippage while letting real institutional repricing settle.',
          },
        ],
      },
    ],
  },
];
