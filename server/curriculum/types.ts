import type { CourseLevel, LessonExercise, LessonSource, QuizQuestion } from '../../src/types.ts';

export interface CurriculumLessonSeed {
  id: string;
  title: string;
  category: string;
  summary: string;
  learning_objective: string;
  introduction: string;
  content: string;
  demonstration: string;
  common_mistakes: string[];
  summary_recap: string;
  practical_exercise: LessonExercise;
  visual_key: string;
  duration_minutes: number;
  tags: string[];
  sources: LessonSource[];
  quiz: QuizQuestion[];
}

export interface CurriculumCourseSeed {
  id: string;
  slug: string;
  course_number: number;
  title: string;
  category: string;
  level: CourseLevel;
  level_label: string;
  description: string;
  prerequisites: string;
  learning_outcomes: string[];
  estimated_hours: number;
  cover_image_url: string;
  assessment: QuizQuestion[];
  lessons: CurriculumLessonSeed[];
}

export const OFFICIAL_SOURCES = {
  BIS_SURVEY: {
    title: 'Bank for International Settlements (BIS) — Triennial Central Bank FX Survey',
    url: 'https://www.bis.org/statistics/rpfx25_fx.pdf',
  },
  BIS_HUB: {
    title: 'BIS — Triennial FX and OTC Derivatives Data Hub',
    url: 'https://www.bis.org/publications/triennial-central-bank-survey-foreign-exchange-and-over-the-counter-otc-derivatives-markets-2025',
  },
  CFTC_FX: {
    title: 'U.S. CFTC — Retail Forex Customer Advisory & Fraud Warnings',
    url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/forex.html',
  },
  NFA_EDU: {
    title: 'National Futures Association (NFA) — Investor Forex Resources',
    url: 'https://www.nfa.futures.org/investors/investor-resources.html',
  },
  FED_MONETARY: {
    title: 'Federal Reserve — Monetary Policy & FOMC Materials',
    url: 'https://www.federalreserve.gov/monetarypolicy.htm',
  },
  ECB_MONETARY: {
    title: 'European Central Bank (ECB) — Monetary Policy Decisions',
    url: 'https://www.ecb.europa.eu/mopo/html/index.en.html',
  },
  BOE_MONETARY: {
    title: 'Bank of England — Monetary Policy Committee (MPC)',
    url: 'https://www.bankofengland.co.uk/monetary-policy',
  },
  BLS_DATA: {
    title: 'U.S. Bureau of Labor Statistics (BLS) — CPI & Employment Data',
    url: 'https://www.bls.gov/',
  },
  BEA_DATA: {
    title: 'U.S. Bureau of Economic Analysis (BEA) — GDP & Economic Accounts',
    url: 'https://www.bea.gov/',
  },
  TV_CANDLES: {
    title: 'TradingView — Introduction to Candlestick Charts and Patterns',
    url: 'https://www.tradingview.com/support/solutions/43000745269-introduction-to-candlestick-charts-and-patterns/',
  },
  TV_PATTERNS: {
    title: 'TradingView — How to Read Chart Patterns',
    url: 'https://www.tradingview.com/support/solutions/43000759289-how-to-read-chart-patterns/',
  },
  CME_EDU: {
    title: 'CME Group Education — Futures, FX & Risk Mechanics',
    url: 'https://www.cmegroup.com/education.html',
  },
  SEC_CRYPTO: {
    title: 'SEC Investor.gov — Crypto Asset & Investment Risk Education',
    url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-asset-related-investments',
  },
  FINRA_EDU: {
    title: 'FINRA — Investor Education and Risk Awareness',
    url: 'https://www.finra.org/investors',
  },
};
